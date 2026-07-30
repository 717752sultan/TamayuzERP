import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Eye,
  FileSpreadsheet,
  Gauge,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { attendanceRequestTypes, attendanceService, attendanceStatuses } from "../../services/attendance";
import { attendanceGeoService } from "../../services/attendanceGeo";
import { employeeAppService } from "../../services/employeeApp";
import { activityLogsService } from "../../services/activityLogs";

const tabs = [
  ["attendance_dashboard", "لوحة حساب الدوام"],
  ["attendance_records", "تسجيل حضور وانصراف"],
  ["bulk_attendance", "تحضير جماعي"],
  ["attendance_requests", "معالجة طلبات العمل"],
  ["working_hours_report", "تقرير ساعات الاشتغال"],
  ["attendance_in_out_report", "تقرير الحضور والانصراف"],
  ["monthly_attendance_report", "تقرير الحضور الشهري"],
  ["attendance_period_settings", "إعدادات فترات الدوام"],
];

const today = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => new Date().toISOString().slice(0, 7);
const clean = (value) => String(value ?? "").trim();
const hours = (minutes) => (Number(minutes || 0) / 60).toFixed(2);
const employeeDepartment = (employee = {}) => employee.department || employee.department_name || employee.administration || "غير محدد";
const recordKey = (record = {}) => `${record.employee_id}-${record.attendance_date}`;
const imageUrl = (employee = {}) => clean(employee.profile_image_url || employee.profileImageUrl || employee.profile_image || employee.avatar_url);

const timeValue = (value) => {
  if (!value) return "";
  if (/^\d{2}:\d{2}/.test(String(value))) return String(value).slice(0, 5);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
};

function PageHead({ title, desc, action }) {
  return <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-extrabold">{title}</h2><p className="mt-1 text-sm text-slate-500">{desc}</p></div>{action}</div>;
}

function Mini({ label, value, I }) {
  return <div className="panel flex items-center gap-4 p-5"><div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><I size={20} /></div><div><p className="text-xs text-slate-500">{label}</p><b className="text-xl">{value}</b></div></div>;
}

function Status({ children }) {
  const value = clean(children) || "غير محدد";
  const cls = ["حاضر", "معتمد", "نشط"].includes(value) ? "bg-green-50 text-green-700" : ["غائب", "مرفوض", "معطل"].includes(value) ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${cls}`}>{value}</span>;
}

function Avatar({ employee }) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl(employee);
  useEffect(() => setFailed(false), [src]);
  const initials = clean(employee.name).split(/\s+/).slice(0, 2).map((part) => part[0]).join("") || "؟";
  return src && !failed
    ? <img src={src} alt={employee.name || "الموظف"} onError={() => setFailed(true)} className="h-9 w-9 rounded-full object-cover" />
    : <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-black text-brand-700">{initials}</span>;
}

function DialogTitle({ title, close }) {
  return <div className="mb-5 flex items-center"><h3 className="text-xl font-extrabold">{title}</h3><button type="button" onClick={close} className="mr-auto rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>;
}

function DialogActions({ close, saving }) {
  return <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={close} className="btn-secondary">إلغاء</button><button disabled={saving} className="btn-primary">حفظ البيانات</button></div>;
}

function Label({ t, children }) {
  return <label className="block text-sm font-bold">{t}{children}</label>;
}

function ChartPanel({ title, sub, data, fill = "#7f1d1d" }) {
  return <section className="panel p-5"><div className="mb-4"><h3 className="font-extrabold">{title}</h3><p className="mt-1 text-xs text-slate-400">{sub}</p></div>{data.length ? <ResponsiveContainer width="100%" height={235}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill={fill} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="py-16 text-center text-sm text-slate-400">لا توجد بيانات كافية للرسم</p>}</section>;
}

function exportCsv(rows, filename) {
  const columns = Object.keys(rows[0] || { empty: "" });
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = "\ufeff" + [columns.map(escape).join(","), ...rows.map((row) => columns.map((col) => escape(row[col])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function EmployeeAttendanceDetailsModal({ employee, records, events, month, company, close }) {
  const rows = records.filter((record) => record.employee_id === employee.id && record.attendance_date?.startsWith(month));
  const printDetails = () => {
    const html = `<html dir="rtl"><head><meta charset="utf-8"><title>تفاصيل حضور الموظف</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}th{background:#7f1d1d;color:white}</style></head><body><h1>${company?.company_name || "التميز للأنظمة الذكية"}</h1><h2>تفاصيل حضور الموظف: ${employee.name}</h2><p>الشهر: ${month} - تاريخ الإصدار: ${today()}</p><table><thead><tr><th>التاريخ</th><th>الحضور</th><th>الخروج</th><th>الحالة</th><th>التأخير</th><th>ساعات العمل</th><th>ملاحظات</th></tr></thead><tbody>${rows.map((record) => `<tr><td>${record.attendance_date}</td><td>${timeValue(record.check_in_time) || "—"}</td><td>${timeValue(record.check_out_time) || "—"}</td><td>${record.status || "غير مسجل"}</td><td>${record.late_minutes || 0} د</td><td>${hours(record.worked_minutes)}</td><td>${record.note || "—"}</td></tr>`).join("")}</tbody></table></body></html>`;
    const win = window.open("", "_blank");
    win?.document.write(html);
    win?.document.close();
    win?.print();
  };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title={`تفاصيل حضور الموظف - ${employee.name}`} close={close} /><div className="mb-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-4"><p><b>الرقم:</b> {employee.id}</p><p><b>الفرع:</b> {employee.branch || "—"}</p><p><b>الوظيفة:</b> {employee.job || "—"}</p><p><b>الشهر:</b> {month}</p></div><div className="mb-3 flex justify-end gap-2"><button onClick={() => exportCsv(rows, `تفاصيل حضور ${employee.name}`)} className="btn-secondary"><FileSpreadsheet size={17} /> تصدير CSV</button><button onClick={printDetails} className="btn-primary">طباعة / PDF</button></div><div className="table-wrap"><table><thead><tr><th>التاريخ</th><th>الحضور</th><th>الخروج</th><th>الحالة</th><th>التأخير</th><th>ساعات العمل</th><th>الموقع</th><th>ملاحظات</th></tr></thead><tbody>{rows.length ? rows.map((record) => { const dayEvents = events.filter((event) => event.employee_id === employee.id && event.attendance_date === record.attendance_date); return <tr key={record.id || recordKey(record)}><td>{record.attendance_date}</td><td>{timeValue(record.check_in_time) || "—"}</td><td>{timeValue(record.check_out_time) || "—"}</td><td><Status>{record.status || "غير مسجل"}</Status></td><td>{record.late_minutes || 0} د</td><td>{hours(record.worked_minutes)}</td><td>{dayEvents.length ? dayEvents.map((event) => <span key={event.event_id} className="ml-1 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold">{event.event_type === "check_in" ? "حضور" : "خروج"}: {event.geofence_status === "inside" ? "داخل النطاق" : event.geofence_status === "outside" ? "خارج النطاق" : "غير متاح"}</span>) : "—"}</td><td>{record.note || "—"}</td></tr>; }) : <tr><td colSpan={8} className="py-8 text-center text-slate-400">لا توجد سجلات لهذا الموظف في الشهر المحدد</td></tr>}</tbody></table></div></div></div>;
}

export default function AttendanceCalculationPage({ pageKey = "attendance_dashboard", employees = [], currentUser, currentCompany, can }) {
  const [activeTab, setActiveTab] = useState(pageKey);
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(currentMonth());
  const [filters, setFilters] = useState({ q: "", branch: "all", department: "all", status: "all" });
  const [records, setRecords] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulk, setBulk] = useState({ status: "\u062d\u0627\u0636\u0631", check_in: "08:00", check_out: "", note: "" });
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkValidationMessage, setBulkValidationMessage] = useState("");
  const [editRecord, setEditRecord] = useState(null);
  const [requestDialog, setRequestDialog] = useState(null);
  const [periodDialog, setPeriodDialog] = useState(null);
  const [locationDialog, setLocationDialog] = useState(null);
  const [attendanceLocations, setAttendanceLocations] = useState([]);
  const [attendanceEvents, setAttendanceEvents] = useState([]);
  const [employeeAppSettings, setEmployeeAppSettings] = useState({ enabled: true, geofence_required: true, allowed_gps_accuracy: 100, allow_attendance_without_location: false, notes: "" });
  const [detailsEmployee, setDetailsEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const canView = can?.("attendance_records", "can_view") !== false;
  const canSave = can?.("attendance_records", "can_create") !== false || can?.("attendance_records", "can_edit") !== false;
  const canEdit = can?.("attendance_records", "can_edit") !== false;
  const canBulk = can?.("bulk_attendance", "can_manage") !== false;
  const canRequests = can?.("attendance_requests", "can_approve") !== false || can?.("attendance_requests", "can_edit") !== false;
  const canConfigure = can?.("attendance_period_settings", "can_configure") !== false || can?.("attendance_period_settings", "can_manage") !== false;
  const canExport = can?.(activeTab, "can_export") !== false;

  useEffect(() => setActiveTab(pageKey), [pageKey]);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status !== "موقوف" && employee.is_active !== false), [employees]);
  const branches = useMemo(() => [...new Set(activeEmployees.map((employee) => employee.branch).filter(Boolean))], [activeEmployees]);
  const departments = useMemo(() => [...new Set(activeEmployees.map(employeeDepartment).filter(Boolean))], [activeEmployees]);
  const activePeriod = periods.find((period) => period.is_active !== false) || periods[0] || { period_name: "دوام افتراضي", start_time: "08:00", end_time: "16:00", grace_minutes: 0, required_minutes: 480 };
  const periodById = Object.fromEntries(periods.map((period) => [period.id, period]));
  const todayRecords = records.filter((record) => record.attendance_date === date);
  const recordsByEmployee = new Map(todayRecords.map((record) => [record.employee_id, record]));

  const load = useCallback(async () => {
    if (!companyId || !canView) return;
    setLoading(true);
    setMessage("");
    try {
      const [recordRows, periodRows, requestRows] = await Promise.all([
        attendanceService.loadAttendanceRecords({ companyId, from: `${month}-01`, to: `${month}-31` }),
        attendanceService.loadWorkPeriods(companyId).catch(() => []),
        attendanceService.loadAttendanceRequests({ companyId }).catch(() => []),
      ]);
      setRecords(recordRows);
      setPeriods(periodRows);
      setRequests(requestRows);
      attendanceGeoService.loadAttendanceLocations(companyId).then(setAttendanceLocations).catch((error) => console.error("Attendance locations load error:", error));
      attendanceGeoService.loadEmployeeAttendanceEvents({ companyId, from: `${month}-01`, to: `${month}-31` }).then(setAttendanceEvents).catch((error) => console.error("Attendance events load error:", error));
      employeeAppService.loadEmployeeAppSettings(companyId).then(setEmployeeAppSettings).catch((error) => console.error("Employee app settings load error:", error));
    } catch (error) {
      setMessage(error.message || "تعذر تحميل بيانات حساب الدوام");
    } finally {
      setLoading(false);
    }
  }, [companyId, month, canView]);

  useEffect(() => { load(); }, [load]);

  const filteredEmployees = activeEmployees.filter((employee) => {
    const record = recordsByEmployee.get(employee.id);
    const q = clean(filters.q).toLowerCase();
    if (q && ![employee.name, employee.id, employee.phone].some((value) => clean(value).toLowerCase().includes(q))) return false;
    if (filters.branch !== "all" && employee.branch !== filters.branch) return false;
    if (filters.department !== "all" && employeeDepartment(employee) !== filters.department) return false;
    if (filters.status !== "all" && (record?.status || "غير مسجل") !== filters.status) return false;
    return true;
  });
  const selectedEmployees = activeEmployees.filter((employee) => selectedIds.includes(employee.id));
  const bulkStatus = clean(bulk.status);
  const canSaveBulkAttendance =
    selectedEmployees.length > 0 &&
    Boolean(date) &&
    Boolean(bulkStatus) &&
    !bulkSaving;

  const reportRows = activeEmployees.map((employee) => {
    const employeeRecords = records.filter((record) => record.employee_id === employee.id && record.attendance_date?.startsWith(month));
    const attended = employeeRecords.filter((record) => ["حاضر", "متأخر"].includes(record.status)).length;
    const absences = employeeRecords.filter((record) => record.status === "غائب").length;
    const leaves = employeeRecords.filter((record) => record.status === "في إجازة").length;
    const worked = employeeRecords.reduce((sum, record) => sum + Number(record.worked_minutes || 0), 0);
    const overtime = employeeRecords.reduce((sum, record) => sum + Number(record.overtime_minutes || 0), 0);
    const lateCount = employeeRecords.filter((record) => Number(record.late_minutes) > 0).length;
    const required = attended * Number(activePeriod.required_minutes || 480);
    return { employee, attended, absences, leaves, worked, overtime, lateCount, required, shortage: Math.max(0, required - worked), commitment: required ? Math.round((worked / required) * 100) : 0 };
  });

  const upsertLocalRecord = (record) => setRecords((list) => {
    const key = recordKey(record);
    return list.some((item) => recordKey(item) === key)
      ? list.map((item) => recordKey(item) === key ? record : item)
      : [record, ...list];
  });

  const log = (type, label, entityId) => activityLogsService.logUserActivity({
    company_id: companyId,
    user_id: currentUser?.id || currentUser?.user_id,
    username: currentUser?.username,
    user_role: currentUser?.role,
    module_key: "attendance",
    module_name: "حساب الدوام",
    page_key: activeTab,
    page_name: tabs.find(([key]) => key === activeTab)?.[1],
    action_type: type,
    action_label: label,
    entity_type: "attendance",
    entity_id: entityId,
    severity: "متوسط",
  }).catch(() => {});

  const checkIn = async (employee) => {
    if (!canSave) return alert("لا تملك صلاحية تسجيل الحضور");
    try {
      const saved = await attendanceService.checkInEmployee(employee, date, attendanceService.nowTime(), activePeriod, { company_id: companyId, created_by: currentUser?.username || "" });
      upsertLocalRecord(saved);
      log("attendance_check_in", "تسجيل حضور", employee.id);
    } catch (error) {
      alert(error.message);
    }
  };

  const checkOut = async (employee) => {
    if (!canSave) return alert("لا تملك صلاحية تسجيل الخروج");
    const existing = recordsByEmployee.get(employee.id);
    if (!existing?.check_in_time) return alert("يجب تسجيل الحضور أولاً");
    try {
      const saved = await attendanceService.checkOutEmployee(employee, date, attendanceService.nowTime(), periodById[existing.work_period_id] || activePeriod, existing, { company_id: companyId, updated_by: currentUser?.username || "" });
      upsertLocalRecord(saved);
      log("attendance_check_out", "تسجيل خروج", employee.id);
    } catch (error) {
      alert(error.message);
    }
  };

  const saveManual = async (event) => {
    event.preventDefault();
    if (!editRecord.adjustment_reason?.trim()) return alert("سبب التعديل مطلوب");
    const employee = activeEmployees.find((item) => item.id === editRecord.employee_id) || {};
    const payload = {
      ...editRecord,
      company_id: companyId,
      employee_name: employee.name || editRecord.employee_name,
      branch: employee.branch || editRecord.branch,
      department: employeeDepartment(employee),
      check_in_time: editRecord.check_in ? `${editRecord.attendance_date}T${editRecord.check_in}:00` : editRecord.check_in_time,
      check_out_time: editRecord.check_out ? `${editRecord.attendance_date}T${editRecord.check_out}:00` : editRecord.check_out_time,
      worked_minutes: attendanceService.calculateWorkedMinutes(editRecord.check_in || editRecord.check_in_time, editRecord.check_out || editRecord.check_out_time, activePeriod),
      manual_adjustment: true,
      updated_by: currentUser?.username || "",
    };
    try {
      const saved = await attendanceService.saveAttendanceRecord(payload);
      upsertLocalRecord(saved);
      setEditRecord(null);
      log("attendance_manual_edit", "تعديل وقت الحضور", saved.employee_id);
    } catch (error) {
      alert(error.message);
    }
  };

  const saveBulk = async () => {
    setBulkValidationMessage("");
    if (!selectedEmployees.length) {
      setBulkValidationMessage("\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0648\u0638\u0641 \u0648\u0627\u062d\u062f \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644");
      return;
    }
    if (!date) {
      setBulkValidationMessage("\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062a\u062d\u0636\u064a\u0631");
      return;
    }
    if (!bulkStatus) {
      setBulkValidationMessage("\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u062d\u0627\u0644\u0629 \u0627\u0644\u062a\u062d\u0636\u064a\u0631");
      return;
    }
    if (!canBulk) return alert("\u0644\u0627 \u062a\u0645\u0644\u0643 \u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u062a\u062d\u0636\u064a\u0631 \u0627\u0644\u062c\u0645\u0627\u0639\u064a");
    if (selectedIds.some((id) => recordsByEmployee.has(id)) && !confirm("\u062a\u0648\u062c\u062f \u0633\u062c\u0644\u0627\u062a \u062d\u0636\u0648\u0631 \u0644\u0647\u0630\u0627 \u0627\u0644\u062a\u0627\u0631\u064a\u062e\u060c \u0647\u0644 \u062a\u0631\u064a\u062f \u062a\u062d\u062f\u064a\u062b\u0647\u0627\u061f")) return;
    const noTimeStatuses = ["\u063a\u0627\u0626\u0628", "\u0625\u062c\u0627\u0632\u0629", "\u0641\u064a \u0625\u062c\u0627\u0632\u0629", "\u0639\u0637\u0644\u0629 \u0631\u0633\u0645\u064a\u0629", "\u0645\u0647\u0645\u0629 \u0639\u0645\u0644", "\u0641\u064a \u0645\u0647\u0645\u0629 \u0639\u0645\u0644", "\u0627\u0646\u062a\u062f\u0627\u0628", "\u0641\u064a \u0627\u0646\u062a\u062f\u0627\u0628", "\u0627\u0633\u062a\u0626\u0630\u0627\u0646 \u0641\u0642\u0637"];
    const needsCheckIn = ["\u062d\u0627\u0636\u0631", "\u0645\u062a\u0623\u062e\u0631"].includes(bulkStatus);
    const effectiveCheckIn = needsCheckIn && !bulk.check_in ? attendanceService.nowTime() : bulk.check_in;
    const rows = selectedEmployees.map((employee) => {
      const existing = recordsByEmployee.get(employee.id) || {};
      const checkInTime = noTimeStatuses.includes(bulkStatus)
        ? existing.check_in_time || null
        : effectiveCheckIn ? `${date}T${effectiveCheckIn}:00` : existing.check_in_time;
      const checkOutTime = noTimeStatuses.includes(bulkStatus)
        ? existing.check_out_time || null
        : bulk.check_out ? `${date}T${bulk.check_out}:00` : existing.check_out_time;
      return {
        ...existing,
        company_id: companyId,
        employee_id: employee.id,
        employee_name: employee.name,
        attendance_date: date,
        branch: employee.branch,
        department: employeeDepartment(employee),
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        status: bulkStatus,
        note: bulk.note,
        worked_minutes: attendanceService.calculateWorkedMinutes(checkInTime, checkOutTime, activePeriod),
        updated_by: currentUser?.username || "",
      };
    });
    setBulkSaving(true);
    try {
      await attendanceService.bulkSaveAttendanceRecords(rows);
      setMessage("\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u062a\u062d\u0636\u064a\u0631 \u0628\u0646\u062c\u0627\u062d");
      setSelectedIds([]);
      await load();
      log("attendance_bulk_update", "\u062a\u062d\u0636\u064a\u0631 \u062c\u0645\u0627\u0639\u064a", `${rows.length}`);
    } catch (error) {
      console.error("Attendance bulk save error:", error);
      setBulkValidationMessage("\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u062a\u062d\u0636\u064a\u0631");
      alert("\u062a\u0639\u0630\u0631 \u062d\u0641\u0638 \u0627\u0644\u062a\u062d\u0636\u064a\u0631");
    } finally {
      setBulkSaving(false);
    }
  };

  const saveRequest = async (event) => {
    event.preventDefault();
    try {
      const saved = await attendanceService.saveAttendanceRequest({ ...requestDialog, company_id: companyId, created_by: currentUser?.username || "" });
      setRequests((list) => [saved, ...list.filter((item) => item.id !== saved.id)]);
      setRequestDialog(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const changeRequestStatus = async (request, status) => {
    if (!canRequests) return alert("لا تملك صلاحية معالجة الطلبات");
    try {
      const saved = await attendanceService.saveAttendanceRequest({
        ...request,
        status,
        approved_by: status === "معتمد" ? currentUser?.username || "" : request.approved_by,
        approved_at: status === "معتمد" ? new Date().toISOString() : request.approved_at,
      });
      setRequests((list) => list.map((item) => item.id === saved.id ? saved : item));
      log(status === "معتمد" ? "attendance_request_approve" : "attendance_request_reject", status === "معتمد" ? "اعتماد طلب" : "رفض طلب", request.employee_id);
    } catch (error) {
      alert(error.message);
    }
  };

  const savePeriod = async (event) => {
    event.preventDefault();
    if (!canConfigure) return alert("لا تملك صلاحية إعداد فترات الدوام");
    try {
      const saved = await attendanceService.saveWorkPeriod({ ...periodDialog, company_id: companyId });
      setPeriods((list) => [saved, ...list.filter((item) => item.id !== saved.id)]);
      setPeriodDialog(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const saveLocation = async (event) => {
    event.preventDefault();
    if (!canConfigure) return alert("لا تملك صلاحية إعداد مواقع الحضور");
    try {
      const saved = await attendanceGeoService.saveAttendanceLocation({ ...locationDialog, company_id: companyId });
      setAttendanceLocations((list) => [saved, ...list.filter((item) => item.location_id !== saved.location_id)]);
      setLocationDialog(null);
      setMessage("تم حفظ موقع الحضور بنجاح");
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteLocation = async (location) => {
    if (!canConfigure) return alert("لا تملك صلاحية حذف مواقع الحضور");
    if (!confirm("هل تريد حذف موقع الحضور المحدد؟")) return;
    try {
      await attendanceGeoService.deleteAttendanceLocation(location.location_id);
      setAttendanceLocations((list) => list.filter((item) => item.location_id !== location.location_id));
    } catch (error) {
      alert(error.message);
    }
  };

  const useCurrentPositionForLocation = () => {
    if (!navigator.geolocation) return alert("المتصفح لا يدعم تحديد الموقع");
    navigator.geolocation.getCurrentPosition((position) => {
      setLocationDialog((draft) => ({
        ...draft,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }));
    }, () => alert("تعذر قراءة الموقع الحالي"), { enableHighAccuracy: true, timeout: 15000 });
  };

  const saveEmployeeAppSettings = async () => {
    if (!canConfigure) return alert("لا تملك صلاحية إعداد تطبيق الموظف");
    try {
      const saved = await employeeAppService.saveEmployeeAppSettings(companyId, employeeAppSettings);
      setEmployeeAppSettings(saved);
      setMessage("تم حفظ إعدادات تطبيق الموظف بنجاح");
    } catch (error) {
      alert(error.message);
    }
  };

  const present = todayRecords.filter((record) => ["حاضر", "متأخر"].includes(record.status)).length;
  const late = todayRecords.filter((record) => record.status === "متأخر" || Number(record.late_minutes) > 0).length;
  const absent = todayRecords.filter((record) => record.status === "غائب").length;
  const leave = todayRecords.filter((record) => record.status === "في إجازة").length;
  const mission = todayRecords.filter((record) => ["في مهمة عمل", "في انتداب"].includes(record.status)).length;
  const commitment = activeEmployees.length ? Math.round((present / activeEmployees.length) * 100) : 0;
  const totalWorked = todayRecords.reduce((sum, record) => sum + Number(record.worked_minutes || 0), 0);
  const lastSeven = Array.from({ length: 7 }).map((_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    const key = day.toISOString().slice(0, 10);
    return { name: key.slice(5), value: records.filter((record) => record.attendance_date === key && ["حاضر", "متأخر"].includes(record.status)).length };
  });
  const statusChart = attendanceStatuses.map((status) => ({ name: status, value: todayRecords.filter((record) => record.status === status).length })).filter((row) => row.value);
  const branchChart = branches.map((branch) => {
    const count = todayRecords.filter((record) => record.branch === branch && ["حاضر", "متأخر"].includes(record.status)).length;
    const branchEmployees = activeEmployees.filter((employee) => employee.branch === branch);
    return { name: branch, value: branchEmployees.length ? Math.round((count / branchEmployees.length) * 100) : 0 };
  }).sort((a, b) => b.value - a.value).slice(0, 8);
  const monthlyDays = Array.from({ length: new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate() }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);

  if (!canView) return <div className="panel p-8 text-center font-bold text-red-700">لا تملك صلاحية عرض حساب الدوام</div>;

  return (
    <div className="space-y-5" dir="rtl">
      <PageHead title="حساب الدوام" desc="تسجيل الحضور والانصراف واحتساب ساعات العمل والتأخير والتقارير" action={<button onClick={load} className="btn-secondary"><RefreshCw size={17} /> تحديث</button>} />
      {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{message}</div>}
      <div className="panel flex flex-wrap gap-2 p-3">{tabs.map(([key, label]) => <button key={key} onClick={() => setActiveTab(key)} className={`rounded-xl px-4 py-2 text-sm font-bold ${activeTab === key ? "bg-brand-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{label}</button>)}</div>
      <div className="panel flex flex-wrap gap-3 p-4">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field max-w-[170px]" />
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="field max-w-[160px]" />
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[180px]"><option value="all">كل الفروع</option>{branches.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="field max-w-[180px]"><option value="all">كل الإدارات</option>{departments.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[170px]"><option value="all">كل الحالات</option>{attendanceStatuses.map((value) => <option key={value}>{value}</option>)}<option>غير مسجل</option></select>
        <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="بحث باسم الموظف / الرقم الوظيفي" />
        {canExport && <button onClick={() => { exportCsv(reportRows.map((row) => ({ الموظف: row.employee.name, الفرع: row.employee.branch, الحضور: row.attended, الغياب: row.absences, التأخير: row.lateCount, ساعات_العمل: hours(row.worked), الالتزام: `${row.commitment}%` })), "تقرير حساب الدوام"); log("attendance_export", "تصدير تقرير", "attendance"); }} className="btn-secondary"><FileSpreadsheet size={17} /> CSV</button>}
      </div>

      {activeTab === "attendance_dashboard" && <><div className="grid gap-4 md:grid-cols-4"><Mini label="إجمالي الموظفين" value={activeEmployees.length} I={Users} /><Mini label="الحاضرون اليوم" value={present} I={UserCheck} /><Mini label="المتأخرون اليوم" value={late} I={Clock3} /><Mini label="الغائبون اليوم" value={absent} I={UserMinus} /><Mini label="في إجازة" value={leave} I={CalendarDays} /><Mini label="في مهمة عمل" value={mission} I={BriefcaseBusiness} /><Mini label="نسبة الالتزام" value={`${commitment}%`} I={BadgeCheck} /><Mini label="ساعات العمل اليوم" value={hours(totalWorked)} I={Gauge} /></div><div className="grid gap-5 xl:grid-cols-3"><ChartPanel title="حضور آخر 7 أيام" sub="عدد الحاضرين والمتأخرين" data={lastSeven} /><ChartPanel title="توزيع الحالات اليوم" sub="حسب سجلات اليوم" data={statusChart} fill="#991b1b" /><ChartPanel title="أكثر الفروع التزاماً" sub="النسبة اليومية" data={branchChart} fill="#64748b" /></div><div className="grid gap-4 md:grid-cols-2">{[["موظفون لم يسجلوا حضور", activeEmployees.filter((employee) => !recordsByEmployee.has(employee.id)).map((employee) => employee.name)], ["سجلوا حضور ولم يسجلوا خروج", todayRecords.filter((record) => record.check_in_time && !record.check_out_time).map((record) => record.employee_name)], ["تأخير متكرر", reportRows.filter((row) => row.lateCount >= 3).map((row) => row.employee.name)], ["غياب متكرر", reportRows.filter((row) => row.absences >= 3).map((row) => row.employee.name)]].map(([title, rows]) => <div key={title} className="panel p-4"><h3 className="font-extrabold">{title}</h3>{rows.length ? <div className="mt-3 flex flex-wrap gap-2">{rows.slice(0, 12).map((name) => <span key={name} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{name}</span>)}</div> : <p className="mt-3 text-sm text-slate-400">لا توجد تنبيهات حالياً</p>}</div>)}</div></>}

      {activeTab === "attendance_records" && <div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>الصورة</th><th>الرقم الوظيفي</th><th>الموظف</th><th>الوظيفة</th><th>الإدارة</th><th>الفرع</th><th>جدول العمل</th><th>وقت الحضور</th><th>وقت الانصراف</th><th>الحالة</th><th>التأخير</th><th>ساعات العمل</th><th>ملاحظات</th><th>إجراءات</th></tr></thead><tbody>{loading ? <tr><td colSpan={14}>جاري التحميل...</td></tr> : filteredEmployees.map((employee) => { const record = recordsByEmployee.get(employee.id) || {}; return <tr key={employee.id}><td><Avatar employee={employee} /></td><td>{employee.id}</td><td><button type="button" onClick={() => setDetailsEmployee(employee)} className="font-bold text-brand-700 underline-offset-4 hover:underline">{employee.name}</button></td><td>{employee.job}</td><td>{employeeDepartment(employee)}</td><td>{employee.branch}</td><td>{activePeriod.period_name}</td><td>{timeValue(record.check_in_time) || "—"}</td><td>{timeValue(record.check_out_time) || "—"}</td><td><Status>{record.status || "غير مسجل"}</Status></td><td>{record.late_minutes || 0} د</td><td>{hours(record.worked_minutes)}</td><td>{record.note || "—"}</td><td><div className="flex min-w-44 flex-wrap gap-1"><button disabled={!canSave || record.check_in_time} onClick={() => checkIn(employee)} className="btn-secondary !h-8 !px-2 disabled:opacity-40">حضور</button><button disabled={!canSave || !record.check_in_time || record.check_out_time} onClick={() => checkOut(employee)} className="btn-secondary !h-8 !px-2 disabled:opacity-40">خروج</button><button disabled={!canEdit} onClick={() => setEditRecord({ ...record, employee_id: employee.id, attendance_date: date, check_in: timeValue(record.check_in_time), check_out: timeValue(record.check_out_time), status: record.status || "حاضر", adjustment_reason: "" })} className="btn-secondary !h-8 !px-2 disabled:opacity-40">تعديل</button></div></td></tr>; })}</tbody></table></div></div>}

      {activeTab === "bulk_attendance" && <div className="space-y-4"><div className="panel flex flex-wrap gap-2 p-4"><button onClick={() => setSelectedIds(filteredEmployees.map((employee) => employee.id))} className="btn-secondary">اختيار الكل</button>{branches.map((branch) => <button key={branch} onClick={() => setSelectedIds(activeEmployees.filter((employee) => employee.branch === branch).map((employee) => employee.id))} className="btn-secondary">{branch}</button>)}</div><div className="panel grid gap-3 p-4 md:grid-cols-5"><select value={bulk.status} onChange={(e) => setBulk({ ...bulk, status: e.target.value })} className="field">{["حاضر", "غائب", "إجازة", "مهمة عمل", "عطلة رسمية"].map((value) => <option key={value}>{value}</option>)}</select><input type="time" value={bulk.check_in} onChange={(e) => setBulk({ ...bulk, check_in: e.target.value })} className="field" /><input type="time" value={bulk.check_out} onChange={(e) => setBulk({ ...bulk, check_out: e.target.value })} className="field" /><input value={bulk.note} onChange={(e) => setBulk({ ...bulk, note: e.target.value })} className="field" placeholder="ملاحظة جماعية" /><button onClick={saveBulk} disabled={!canSaveBulkAttendance} className="btn-primary disabled:opacity-40">{selectedEmployees.length > 0 ? `\u062d\u0641\u0638 \u0627\u0644\u062a\u062d\u0636\u064a\u0631 (${selectedEmployees.length})` : "\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646 \u0623\u0648\u0644\u064b\u0627"}</button></div>{bulkValidationMessage && <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 md:col-span-5">{bulkValidationMessage}</div>}<div className="panel grid gap-2 p-4 md:grid-cols-3">{filteredEmployees.map((employee) => <label key={employee.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-sm"><input type="checkbox" checked={selectedIds.includes(employee.id)} onChange={(e) => setSelectedIds((list) => e.target.checked ? [...list, employee.id] : list.filter((id) => id !== employee.id))} />{employee.name} - {employee.branch}</label>)}</div></div>}

      {activeTab === "attendance_requests" && <div className="space-y-4"><div className="flex justify-end"><button onClick={() => setRequestDialog({ id: crypto.randomUUID?.() || `REQ-${Date.now()}`, employee_id: activeEmployees[0]?.id || "", request_type: attendanceRequestTypes[0], request_date: date, from_time: "", to_time: "", reason: "", status: "معلق" })} className="btn-primary"><Plus size={17} /> طلب جديد</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>الموظف</th><th>النوع</th><th>التاريخ</th><th>من وقت</th><th>إلى وقت</th><th>السبب</th><th>الحالة</th><th>مقدم الطلب</th><th>تاريخ الطلب</th><th>إجراءات</th></tr></thead><tbody>{requests.length ? requests.map((request) => { const employee = activeEmployees.find((item) => item.id === request.employee_id); return <tr key={request.id}><td>{employee?.name || request.employee_id}</td><td>{request.request_type}</td><td>{request.request_date}</td><td>{request.from_time || "—"}</td><td>{request.to_time || "—"}</td><td>{request.reason}</td><td><Status>{request.status}</Status></td><td>{request.created_by || "—"}</td><td>{String(request.created_at || "").slice(0, 10)}</td><td><button disabled={!canRequests} onClick={() => changeRequestStatus(request, "معتمد")} className="p-2 text-green-700"><BadgeCheck size={16} /></button><button disabled={!canRequests} onClick={() => changeRequestStatus(request, "مرفوض")} className="p-2 text-red-600"><X size={16} /></button><button onClick={() => setRequestDialog(request)} className="p-2 text-blue-600"><Eye size={16} /></button></td></tr>; }) : <tr><td colSpan={10} className="py-8 text-center text-slate-400">لا توجد طلبات عمل حالياً</td></tr>}</tbody></table></div></div></div>}

      {["working_hours_report", "attendance_in_out_report"].includes(activeTab) && <div className="panel p-4"><div className="mb-3 grid gap-4 md:grid-cols-4"><Mini label="إجمالي أيام العمل" value={reportRows.reduce((s, r) => s + r.attended + r.absences + r.leaves, 0)} I={CalendarDays} /><Mini label="إجمالي الساعات الفعلية" value={hours(reportRows.reduce((s, r) => s + r.worked, 0))} I={Gauge} /><Mini label="ساعات النقص" value={hours(reportRows.reduce((s, r) => s + r.shortage, 0))} I={AlertTriangle} /><Mini label="ساعات الإضافي" value={hours(reportRows.reduce((s, r) => s + r.overtime, 0))} I={Clock3} /></div><div className="table-wrap"><table><thead><tr><th>الموظف</th><th>الفرع</th><th>الإدارة</th><th>أيام العمل</th><th>الحضور</th><th>الغياب</th><th>التأخير</th><th>ساعات العمل الفعلية</th><th>ساعات الإضافي</th><th>النقص</th><th>الالتزام %</th></tr></thead><tbody>{reportRows.map((row) => <tr key={row.employee.id}><td><button type="button" onClick={() => setDetailsEmployee(row.employee)} className="font-bold text-brand-700 underline-offset-4 hover:underline">{row.employee.name}</button></td><td>{row.employee.branch}</td><td>{employeeDepartment(row.employee)}</td><td>{row.attended + row.absences + row.leaves}</td><td>{row.attended}</td><td>{row.absences}</td><td>{row.lateCount}</td><td>{hours(row.worked)}</td><td>{hours(row.overtime)}</td><td>{hours(row.shortage)}</td><td>{row.commitment}%</td></tr>)}</tbody></table></div></div>}

      {activeTab === "monthly_attendance_report" && <div className="panel p-4"><div className="mb-4 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-green-50 px-3 py-1 text-green-700">ح حاضر</span><span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">م متأخر</span><span className="rounded-full bg-red-50 px-3 py-1 text-red-700">غ غائب</span><span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">إ إجازة</span><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">ع عطلة / مهمة</span></div><div className="table-wrap"><table><thead><tr><th>الموظف</th>{monthlyDays.map((day) => <th key={day}>{day.slice(-2)}</th>)}</tr></thead><tbody>{filteredEmployees.map((employee) => <tr key={employee.id}><td className="sticky right-0 bg-white"><button type="button" onClick={() => setDetailsEmployee(employee)} className="font-bold text-brand-700 underline-offset-4 hover:underline">{employee.name}</button></td>{monthlyDays.map((day) => { const record = records.find((item) => item.employee_id === employee.id && item.attendance_date === day); const symbol = record?.status === "متأخر" ? "م" : record?.status === "غائب" ? "غ" : record?.status === "في إجازة" ? "إ" : ["عطلة رسمية", "في مهمة عمل", "في انتداب"].includes(record?.status) ? "ع" : record ? "ح" : "—"; return <td key={day} className="text-center font-bold">{symbol}</td>; })}</tr>)}</tbody></table></div></div>}

      {activeTab === "attendance_period_settings" && <div className="space-y-5"><section className="space-y-4"><div className="flex justify-end"><button onClick={() => setPeriodDialog({ id: crypto.randomUUID?.() || `PER-${Date.now()}`, period_name: "دوام صباحي", start_time: "08:00", end_time: "16:00", grace_minutes: 15, required_minutes: 480, break_start: "", break_end: "", work_days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"], branch: "", department: "", is_active: true, notes: "" })} className="btn-primary"><Plus size={17} /> إضافة فترة</button></div><div className="panel p-4"><h3 className="mb-3 font-extrabold">فترات الدوام</h3><div className="table-wrap"><table><thead><tr><th>اسم الفترة</th><th>البداية</th><th>النهاية</th><th>السماح</th><th>الساعات المطلوبة</th><th>الراحة</th><th>الفرع</th><th>الإدارة</th><th>الحالة</th><th></th></tr></thead><tbody>{periods.length ? periods.map((period) => <tr key={period.id}><td>{period.period_name}</td><td>{period.start_time}</td><td>{period.end_time}</td><td>{period.grace_minutes} د</td><td>{hours(period.required_minutes)}</td><td>{period.break_start || "—"} - {period.break_end || "—"}</td><td>{period.branch || "كل الفروع"}</td><td>{period.department || "كل الإدارات"}</td><td><Status>{period.is_active ? "نشط" : "معطل"}</Status></td><td><button disabled={!canConfigure} onClick={() => setPeriodDialog(period)} className="p-2 text-blue-600"><Pencil size={16} /></button></td></tr>) : <tr><td colSpan={10} className="py-8 text-center text-slate-400">لا توجد فترات دوام، سيتم استخدام دوام افتراضي 08:00 - 16:00</td></tr>}</tbody></table></div></div></section><section className="panel p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-extrabold">إعدادات تطبيق الموظف</h3><p className="mt-1 text-xs text-slate-500">ضبط الحضور الذاتي وسياسة الموقع الجغرافي للأجهزة</p></div><button disabled={!canConfigure} onClick={saveEmployeeAppSettings} className="btn-primary">حفظ الإعدادات</button></div><div className="grid gap-3 md:grid-cols-4"><label className="rounded-2xl bg-slate-50 p-3 text-sm font-bold"><input type="checkbox" checked={employeeAppSettings.enabled !== false} onChange={(e) => setEmployeeAppSettings({ ...employeeAppSettings, enabled: e.target.checked })} className="ml-2" />تفعيل تطبيق الموظف</label><label className="rounded-2xl bg-slate-50 p-3 text-sm font-bold"><input type="checkbox" checked={employeeAppSettings.geofence_required !== false} onChange={(e) => setEmployeeAppSettings({ ...employeeAppSettings, geofence_required: e.target.checked })} className="ml-2" />اشتراط نطاق الموقع</label><label className="rounded-2xl bg-slate-50 p-3 text-sm font-bold"><input type="checkbox" checked={employeeAppSettings.allow_attendance_without_location === true} onChange={(e) => setEmployeeAppSettings({ ...employeeAppSettings, allow_attendance_without_location: e.target.checked })} className="ml-2" />السماح عند عدم إعداد موقع</label><Label t="دقة GPS المسموحة بالمتر"><input type="number" min="10" value={employeeAppSettings.allowed_gps_accuracy || 100} onChange={(e) => setEmployeeAppSettings({ ...employeeAppSettings, allowed_gps_accuracy: Number(e.target.value || 100) })} className="field mt-2" /></Label></div><div className="mt-4 grid gap-3 md:grid-cols-3"><button type="button" disabled className="btn-secondary opacity-60">إعادة تعيين كلمة مرور موظف</button><button type="button" disabled className="btn-secondary opacity-60">عرض أجهزة الموظفين</button><button type="button" disabled className="btn-secondary opacity-60">سجل تدقيق أحداث الحضور</button></div></section><section className="panel p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 font-extrabold"><MapPin size={18} /> مواقع الحضور الجغرافية</h3><p className="mt-1 text-xs text-slate-500">تحديد موقع مسموح للشركة أو الفرع أو موظف محدد</p></div><button disabled={!canConfigure} onClick={() => setLocationDialog({ location_id: crypto.randomUUID?.() || `LOC-${Date.now()}`, location_name: "موقع حضور", branch: "", employee_id: "", latitude: "", longitude: "", allowed_radius_meters: 100, is_active: true, notes: "" })} className="btn-primary"><Plus size={17} /> إضافة موقع</button></div><div className="table-wrap"><table><thead><tr><th>الموقع</th><th>الفرع</th><th>الموظف</th><th>خط العرض</th><th>خط الطول</th><th>النطاق</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{attendanceLocations.length ? attendanceLocations.map((location) => <tr key={location.location_id}><td>{location.location_name}</td><td>{location.branch || "كل الفروع"}</td><td>{activeEmployees.find((employee) => employee.id === location.employee_id)?.name || location.employee_id || "كل الموظفين"}</td><td>{location.latitude}</td><td>{location.longitude}</td><td>{location.allowed_radius_meters} متر</td><td><Status>{location.is_active ? "نشط" : "معطل"}</Status></td><td><button disabled={!canConfigure} onClick={() => setLocationDialog(location)} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canConfigure} onClick={() => deleteLocation(location)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>) : <tr><td colSpan={8} className="py-8 text-center text-slate-400">لم يتم إضافة مواقع حضور لهذه الشركة بعد</td></tr>}</tbody></table></div></section></div>}

      {editRecord && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={saveManual} className="panel w-full max-w-2xl p-6"><DialogTitle title="تعديل وقت الحضور" close={() => setEditRecord(null)} /><div className="grid gap-4 md:grid-cols-2"><Label t="الحضور"><input type="time" value={editRecord.check_in || ""} onChange={(e) => setEditRecord({ ...editRecord, check_in: e.target.value })} className="field mt-2" /></Label><Label t="الانصراف"><input type="time" value={editRecord.check_out || ""} onChange={(e) => setEditRecord({ ...editRecord, check_out: e.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={editRecord.status} onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value })} className="field mt-2">{attendanceStatuses.map((value) => <option key={value}>{value}</option>)}</select></Label><Label t="ملاحظات"><input value={editRecord.note || ""} onChange={(e) => setEditRecord({ ...editRecord, note: e.target.value })} className="field mt-2" /></Label><Label t="سبب التعديل"><textarea required value={editRecord.adjustment_reason || ""} onChange={(e) => setEditRecord({ ...editRecord, adjustment_reason: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setEditRecord(null)} /></form></div>}
      {requestDialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={saveRequest} className="panel w-full max-w-3xl p-6"><DialogTitle title="طلب عمل" close={() => setRequestDialog(null)} /><div className="grid gap-4 md:grid-cols-2"><Label t="الموظف"><select value={requestDialog.employee_id} onChange={(e) => setRequestDialog({ ...requestDialog, employee_id: e.target.value })} className="field mt-2">{activeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></Label><Label t="النوع"><select value={requestDialog.request_type} onChange={(e) => setRequestDialog({ ...requestDialog, request_type: e.target.value })} className="field mt-2">{attendanceRequestTypes.map((value) => <option key={value}>{value}</option>)}</select></Label><Label t="التاريخ"><input type="date" value={requestDialog.request_date} onChange={(e) => setRequestDialog({ ...requestDialog, request_date: e.target.value })} className="field mt-2" /></Label><Label t="من وقت"><input type="time" value={requestDialog.from_time || ""} onChange={(e) => setRequestDialog({ ...requestDialog, from_time: e.target.value })} className="field mt-2" /></Label><Label t="إلى وقت"><input type="time" value={requestDialog.to_time || ""} onChange={(e) => setRequestDialog({ ...requestDialog, to_time: e.target.value })} className="field mt-2" /></Label><Label t="السبب"><textarea value={requestDialog.reason || ""} onChange={(e) => setRequestDialog({ ...requestDialog, reason: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setRequestDialog(null)} /></form></div>}
      {periodDialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={savePeriod} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"><DialogTitle title="إعدادات فترة دوام" close={() => setPeriodDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="اسم الفترة"><input value={periodDialog.period_name} onChange={(e) => setPeriodDialog({ ...periodDialog, period_name: e.target.value })} className="field mt-2" /></Label><Label t="بداية الدوام"><input type="time" value={periodDialog.start_time} onChange={(e) => setPeriodDialog({ ...periodDialog, start_time: e.target.value })} className="field mt-2" /></Label><Label t="نهاية الدوام"><input type="time" value={periodDialog.end_time} onChange={(e) => setPeriodDialog({ ...periodDialog, end_time: e.target.value })} className="field mt-2" /></Label><Label t="فترة السماح بالدقائق"><input type="number" value={periodDialog.grace_minutes || 0} onChange={(e) => setPeriodDialog({ ...periodDialog, grace_minutes: e.target.value })} className="field mt-2" /></Label><Label t="ساعات العمل المطلوبة"><input type="number" value={Number(periodDialog.required_minutes || 0) / 60} onChange={(e) => setPeriodDialog({ ...periodDialog, required_minutes: Number(e.target.value || 0) * 60 })} className="field mt-2" /></Label><Label t="هل الفترة نشطة؟"><select value={String(periodDialog.is_active !== false)} onChange={(e) => setPeriodDialog({ ...periodDialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نعم</option><option value="false">لا</option></select></Label><Label t="بداية الراحة"><input type="time" value={periodDialog.break_start || ""} onChange={(e) => setPeriodDialog({ ...periodDialog, break_start: e.target.value })} className="field mt-2" /></Label><Label t="نهاية الراحة"><input type="time" value={periodDialog.break_end || ""} onChange={(e) => setPeriodDialog({ ...periodDialog, break_end: e.target.value })} className="field mt-2" /></Label><Label t="الفرع"><input value={periodDialog.branch || ""} onChange={(e) => setPeriodDialog({ ...periodDialog, branch: e.target.value })} className="field mt-2" placeholder="كل الفروع" /></Label><Label t="الإدارة"><input value={periodDialog.department || ""} onChange={(e) => setPeriodDialog({ ...periodDialog, department: e.target.value })} className="field mt-2" placeholder="كل الإدارات" /></Label><Label t="ملاحظات"><textarea value={periodDialog.notes || ""} onChange={(e) => setPeriodDialog({ ...periodDialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setPeriodDialog(null)} /></form></div>}
      {locationDialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={saveLocation} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"><DialogTitle title="موقع حضور جغرافي" close={() => setLocationDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="اسم الموقع"><input required value={locationDialog.location_name || ""} onChange={(e) => setLocationDialog({ ...locationDialog, location_name: e.target.value })} className="field mt-2" /></Label><Label t="الفرع"><select value={locationDialog.branch || ""} onChange={(e) => setLocationDialog({ ...locationDialog, branch: e.target.value })} className="field mt-2"><option value="">كل الفروع</option>{branches.map((branch) => <option key={branch}>{branch}</option>)}</select></Label><Label t="الموظف"><select value={locationDialog.employee_id || ""} onChange={(e) => setLocationDialog({ ...locationDialog, employee_id: e.target.value })} className="field mt-2"><option value="">كل الموظفين</option>{activeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></Label><Label t="خط العرض"><input required type="number" step="any" value={locationDialog.latitude || ""} onChange={(e) => setLocationDialog({ ...locationDialog, latitude: e.target.value })} className="field mt-2" /></Label><Label t="خط الطول"><input required type="number" step="any" value={locationDialog.longitude || ""} onChange={(e) => setLocationDialog({ ...locationDialog, longitude: e.target.value })} className="field mt-2" /></Label><Label t="النطاق المسموح بالمتر"><input type="number" min="10" value={locationDialog.allowed_radius_meters || 100} onChange={(e) => setLocationDialog({ ...locationDialog, allowed_radius_meters: e.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={String(locationDialog.is_active !== false)} onChange={(e) => setLocationDialog({ ...locationDialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Label><Label t="ملاحظات"><textarea value={locationDialog.notes || ""} onChange={(e) => setLocationDialog({ ...locationDialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label><div className="flex items-end"><button type="button" onClick={useCurrentPositionForLocation} className="btn-secondary"><MapPin size={17} /> استخدام موقعي الحالي</button></div></div><DialogActions close={() => setLocationDialog(null)} /></form></div>}
      {detailsEmployee && <EmployeeAttendanceDetailsModal employee={detailsEmployee} records={records} events={attendanceEvents} month={month} company={currentCompany} close={() => setDetailsEmployee(null)} />}
    </div>
  );
}

