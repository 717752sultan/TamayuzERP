import * as XLSX from "xlsx";
import { supabase } from "./supabase";

export const attendanceSummaryColumns = [
  { key: "employee_id", label: "الرقم الوظيفي" },
  { key: "employee_name", label: "إسم الموظف" },
  { key: "work_time", label: "وقت العمل" },
  { key: "work_days_in_month", label: "أيام العمل في الشهر" },
  { key: "total_present_days", label: "مجموع أيام الحضور" },
  { key: "total_absent_days", label: "مجموع أيام الغياب" },
  { key: "overtime_hours", label: "الساعات الإضافية" },
  { key: "available_hours_in_period", label: "إجمالي الساعات المتاحة في الفترة" },
  { key: "total_attendance_hours", label: "إجمالي ساعات الحضور" },
  { key: "total_permissions", label: "إجمالي الأذونات" },
  { key: "total_late_hours", label: "إجمالي ساعات التأخير" },
  { key: "total_absence_in_period", label: "إجمالي الغياب في الفترة" },
  { key: "work_schedule", label: "جدول العمل" },
];

const aliases = {
  employee_id: ["الرقم الوظيفي", "رقم الموظف", "Employee ID", "Employee Code"],
  employee_name: ["إسم الموظف", "اسم الموظف", "الموظف", "Employee Name"],
  attendance_date: ["التاريخ", "Date", "Attendance Date"],
  check_in_time: ["دخول", "وقت الدخول", "Check In", "In Time"],
  check_out_time: ["خروج", "وقت الخروج", "Check Out", "Out Time"],
  worked_minutes: ["دقائق العمل", "Worked Minutes"],
  late_minutes: ["التأخير", "دقائق التأخير", "Late Minutes"],
  early_leave_minutes: ["الخروج المبكر", "Early Leave"],
  absence_minutes: ["دقائق الغياب", "Absence Minutes"],
  overtime_minutes: ["دقائق الإضافي", "Overtime Minutes"],
  branch: ["الفرع", "Branch"],
  department: ["القسم", "Department"],
  job_title: ["الوظيفة", "Job Title"],
  status: ["الحالة", "Status"],
};
for (const column of attendanceSummaryColumns) aliases[column.key] = aliases[column.key] || [column.label];

const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const pick = (row, names) => {
  const key = Object.keys(row || {}).find((item) => names.some((name) => String(item).trim().toLowerCase() === String(name).trim().toLowerCase()));
  return key ? row[key] : "";
};

export const normalizeAttendanceDate = (value) => {
  if (value instanceof Date) return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, "0"), String(value.getDate()).padStart(2, "0")].join("-");
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    return parsed ? `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}` : "";
  }
  const text = String(value || "").trim();
  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const dmy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  return "";
};

export const normalizeAttendanceTime = (value) => {
  if (value == null || value === "") return "";
  if (typeof value === "number") {
    const sec = Math.round(value * 86400) % 86400;
    return `${String(Math.floor(sec / 3600)).padStart(2, "0")}:${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  }
  const match = String(value).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}:${match[3] || "00"}` : "";
};

export const mapSmartHrAttendanceColumns = (row = {}) => {
  const out = {};
  for (const [key, names] of Object.entries(aliases)) out[key] = pick(row, names);
  out.attendance_date = normalizeAttendanceDate(out.attendance_date);
  out.check_in_time = normalizeAttendanceTime(out.check_in_time);
  out.check_out_time = normalizeAttendanceTime(out.check_out_time);
  out.raw_payload = row;
  return out;
};

export const parseAttendanceExcel = async (file) => {
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", blankrows: false, raw: true });
  return rows.map(mapSmartHrAttendanceColumns).filter((row) => String(row.employee_id || "").trim());
};

export const validateAttendanceRows = (rows = []) => rows.map((row, index) => ({
  ...row,
  row_number: index + 2,
  valid: Boolean(String(row.employee_id || "").trim() && (row.attendance_date || row.work_days_in_month !== "")),
  errors: [
    !String(row.employee_id || "").trim() ? "employee_id" : "",
    !row.attendance_date && row.work_days_in_month === "" ? "date/summary" : "",
  ].filter(Boolean),
}));

const dailyPayload = (row, companyId, foundId, index, options = {}) => {
  const summaryDate = options.attendance_date || row.attendance_date || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  const absentDays = num(row.total_absent_days);
  return {
    attendance_id: foundId || `attendance-${companyId}-${row.employee_id}-${row.attendance_date || summaryDate}-${index}`,
    company_id: companyId,
    employee_id: String(row.employee_id || "").trim(),
    employee_name: row.employee_name || "",
    branch: row.branch || "",
    department: row.department || "",
    job_title: row.job_title || "",
    attendance_date: row.attendance_date || summaryDate,
    check_in_time: row.check_in_time || null,
    check_out_time: row.check_out_time || null,
    worked_minutes: row.worked_minutes ? num(row.worked_minutes) : Math.round(num(row.total_attendance_hours) * 60),
    late_minutes: row.late_minutes ? num(row.late_minutes) : Math.round(num(row.total_late_hours) * 60),
    early_leave_minutes: num(row.early_leave_minutes),
    absence_minutes: row.absence_minutes ? num(row.absence_minutes) : Math.round(num(row.total_absence_in_period) * 60),
    overtime_minutes: row.overtime_minutes ? num(row.overtime_minutes) : Math.round(num(row.overtime_hours) * 60),
    is_absent: row.is_absent === true || absentDays > 0,
    is_approved_leave: row.is_approved_leave === true,
    is_permission: row.is_permission === true || num(row.total_permissions) > 0,
    is_rest_day: row.is_rest_day === true,
    status: row.status || "مستورد",
    source: options.source || "smart_hr",
    approval_status: options.approval_status || "draft",
    raw_payload: row.raw_payload || row,
    notes: row.notes || "",
    updated_at: new Date().toISOString(),
  };
};

export const importAttendanceRows = async (rows, companyId, options = {}) => {
  if (!companyId) throw new Error("company_id is required.");
  const valid = validateAttendanceRows(rows).filter((row) => row.valid);
  let imported = 0; let updated = 0; let skipped = 0;
  const errors = [];
  for (const [index, row] of valid.entries()) {
    try {
      const date = row.attendance_date || options.attendance_date || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
      const found = await supabase.select("hr_attendance_daily_records", `select=attendance_id&company_id=eq.${encodeURIComponent(companyId)}&employee_id=eq.${encodeURIComponent(row.employee_id)}&attendance_date=eq.${date}&limit=1`).catch(() => []);
      if (found.length && options.duplicateMode === "skip") { skipped += 1; continue; }
      const payload = dailyPayload({ ...row, attendance_date: date }, companyId, found[0]?.attendance_id, index, options);
      await supabase.upsert("hr_attendance_daily_records", payload, { onConflict: "attendance_id" });
      found.length ? updated += 1 : imported += 1;
    } catch (error) {
      console.error("hr_attendance_daily_records import error:", error);
      errors.push({ employee_id: row.employee_id, error: error.message });
    }
  }
  return { imported, updated, skipped, errors };
};

const write = (rows, columns, name) => {
  const data = (rows || []).map((row) => Object.fromEntries(columns.map((column) => [column.label, row[column.key] ?? ""])));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, name);
};

export const exportAttendanceTemplate = () => write([], attendanceSummaryColumns, "attendance-template.xlsx");
export const exportAttendanceRecords = (rows, options = {}) => write(rows, options.columns || attendanceSummaryColumns, options.fileName || "attendance-records.xlsx");
export const exportAttendanceSummary = (rows, options = {}) => write(rows, attendanceSummaryColumns, options.fileName || "attendance-summary.xlsx");
export const attendanceImportExportService = { parseAttendanceExcel, validateAttendanceRows, importAttendanceRows, exportAttendanceTemplate, exportAttendanceRecords, exportAttendanceSummary, mapSmartHrAttendanceColumns, normalizeAttendanceDate, normalizeAttendanceTime, attendanceSummaryColumns };
