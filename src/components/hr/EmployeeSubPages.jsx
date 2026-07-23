import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarDays,
  ChevronLeft,
  Download,
  Eye,
  FileText,
  Filter,
  Gauge,
  KeyRound,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { dailyOperationsService } from "../../services/dailyOperations";
import { hrRecordsService } from "../../services/hrRecords";
import {
  activityLogsService,
  activitySeverities,
  activityTypes,
} from "../../services/activityLogs";
import { isPlatformAdminUser } from "../../services/tenant";

const clean = (value) => String(value ?? "").trim();
const number = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const unique = (items) => [...new Set(items.map(clean).filter(Boolean))];
const employeeImage = (employee = {}) =>
  clean(employee.profile_image_url || employee.profileImageUrl || employee.profile_image || employee.avatar_url);
const employeeId = (employee = {}) => clean(employee.id || employee.employee_id);
const isActive = (employee = {}) =>
  employee.is_active !== false && !["غير نشط", "معطل", "موقوف", "منتهي الخدمة", "ملغي"].includes(clean(employee.status));
const departmentOf = (employee = {}, jobDepartments = {}) =>
  clean(employee.department || employee.department_name || employee.administration || jobDepartments[clean(employee.job)]) || "غير محدد";
const evaluationEmployeeId = (row = {}) => clean(row.employeeId || row.employee_id);
const evaluationScore = (row = {}) => number(row.total ?? row.final_score ?? row.finalScore);
const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

function Avatar({ employee, size = "lg" }) {
  const initials = clean(employee?.name)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("") || "؟";
  const classes = size === "lg" ? "h-20 w-20 text-xl" : "h-11 w-11 text-sm";
  return employeeImage(employee) ? (
    <img src={employeeImage(employee)} alt={employee.name || "الموظف"} className={`${classes} rounded-2xl object-cover ring-4 ring-white shadow`} />
  ) : (
    <span className={`${classes} grid place-items-center rounded-2xl bg-brand-50 font-black text-brand-700 ring-4 ring-white shadow`}>{initials}</span>
  );
}

function StatusBadge({ children }) {
  const value = clean(children) || "غير محدد";
  const style = ["نشط", "متعاون", "ممتاز"].includes(value)
    ? "bg-emerald-50 text-emerald-700"
    : ["غير فعال", "غير نشط", "موقوف", "مرتفع", "حساس"].includes(value)
      ? "bg-red-50 text-red-700"
      : ["يحتاج متابعة", "قيد المراجعة", "متوسط", "تحت التجربة"].includes(value)
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${style}`}>{value}</span>;
}

function EmptyState({ children }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div><Users className="mx-auto text-slate-300" size={38} /><p className="mt-3 text-sm font-bold text-slate-500">{children}</p></div>
    </div>
  );
}

const jobDepartmentMap = (settings = {}) =>
  Object.fromEntries(
    (settings.jobDefinitions || settings.jobs || []).map((item) => {
      const row = typeof item === "string" ? { name: item } : item || {};
      return [clean(row.name || row.job_name || row.title), clean(row.department || row.department_name || row.administration)];
    }),
  );

export function EmployeesGridPage({
  employees = [],
  setEmployees,
  settings = {},
  currentUser,
  currentCompany,
  can,
  EmployeeDetailsModal,
  EmployeeModal,
  onEmployeeSaved,
}) {
  const [filters, setFilters] = useState({ q: "", branch: "all", department: "all", job: "all", status: "all", gender: "all" });
  const [sortBy, setSortBy] = useState("name");
  const [cardCount, setCardCount] = useState(24);
  const [details, setDetails] = useState(null);
  const [editing, setEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const companyId = clean(currentCompany?.company_id);
  const platformAdmin = isPlatformAdminUser(currentUser);
  const canEdit = platformAdmin || can?.("employees", "can_edit") === true;
  const canDeactivate = platformAdmin || can?.("employees", "can_delete") === true || can?.("employees", "can_manage") === true;
  const canViewFinancial = platformAdmin || can?.("employees", "can_view_financial") === true || can?.("hr_salary", "can_view_financial") === true;
  const canResetPassword = platformAdmin || can?.("users_permissions", "can_reset_user_password") === true;
  const departmentsByJob = useMemo(() => jobDepartmentMap(settings), [settings.jobDefinitions, settings.jobs]);
  const companyEmployees = useMemo(
    () => employees.filter((employee) => !companyId || !employee.company_id || clean(employee.company_id) === companyId),
    [employees, companyId, refreshKey],
  );
  const options = useMemo(() => ({
    branches: unique(companyEmployees.map((employee) => employee.branch)),
    departments: unique(companyEmployees.map((employee) => departmentOf(employee, departmentsByJob))).filter((value) => value !== "غير محدد"),
    jobs: unique(companyEmployees.map((employee) => employee.job)),
    statuses: unique(companyEmployees.map((employee) => employee.status || "نشط")),
    genders: unique(companyEmployees.map((employee) => employee.gender || employee.sex)),
  }), [companyEmployees, departmentsByJob]);
  const filtered = useMemo(() => {
    const query = clean(filters.q).toLowerCase();
    const rows = companyEmployees.filter((employee) => {
      if (query && ![employee.name, employee.id, employee.phone].some((value) => clean(value).toLowerCase().includes(query))) return false;
      if (filters.branch !== "all" && clean(employee.branch) !== filters.branch) return false;
      if (filters.department !== "all" && departmentOf(employee, departmentsByJob) !== filters.department) return false;
      if (filters.job !== "all" && clean(employee.job) !== filters.job) return false;
      if (filters.status !== "all" && clean(employee.status || "نشط") !== filters.status) return false;
      if (filters.gender !== "all" && clean(employee.gender || employee.sex) !== filters.gender) return false;
      return true;
    });
    return rows.sort((a, b) => {
      if (sortBy === "branch") return clean(a.branch).localeCompare(clean(b.branch), "ar");
      if (sortBy === "department") return departmentOf(a, departmentsByJob).localeCompare(departmentOf(b, departmentsByJob), "ar");
      if (sortBy === "hireDate") return clean(b.hireDate || b.hire_date).localeCompare(clean(a.hireDate || a.hire_date));
      if (sortBy === "status") return clean(a.status).localeCompare(clean(b.status), "ar");
      return clean(a.name).localeCompare(clean(b.name), "ar");
    });
  }, [companyEmployees, filters, sortBy, departmentsByJob]);
  const branchOptions = unique([...(settings.branches || []).map((item) => typeof item === "string" ? item : item.branch_name || item.name), ...options.branches]);
  const jobOptions = unique([...(settings.jobs || []).map((item) => typeof item === "string" ? item : item.name || item.job_name), ...options.jobs]);
  const managerOptions = unique(companyEmployees.filter(isActive).map((employee) => employee.name));
  const isNewEmployee = (employee) => {
    const hireDate = new Date(`${clean(employee.hireDate || employee.hire_date).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(hireDate.getTime())) return false;
    return Date.now() - hireDate.getTime() <= 90 * 86400000;
  };
  const openDetails = (employee, panel = "profile") => setDetails({ employee, panel });
  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div><h2 className="text-2xl font-black">قائمة الموظفين شبكي</h2><p className="mt-1 text-sm text-slate-500">عرض بصري سريع لملفات موظفي الشركة</p></div>
        <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="btn-secondary md:mr-auto"><RefreshCw size={17} /> تحديث</button>
      </div>
      <div className="panel grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6">
        <label className="flex h-11 items-center gap-2 rounded-xl border px-3 md:col-span-2">
          <Search size={17} /><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} className="w-full outline-none" placeholder="بحث بالاسم أو الرقم أو الهاتف" />
        </label>
        {[
          ["branch", "كل الفروع", options.branches],
          ["department", "كل الإدارات", options.departments],
          ["job", "كل الوظائف", options.jobs],
          ["status", "كل الحالات", options.statuses],
          ...(options.genders.length ? [["gender", "كل الأنواع", options.genders]] : []),
        ].map(([key, label, values]) => (
          <select key={key} value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} className="field">
            <option value="all">{label}</option>{values.map((value) => <option key={value}>{value}</option>)}
          </select>
        ))}
      </div>
      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <Filter size={17} className="text-brand-700" />
        <span className="text-sm font-bold">إجمالي النتائج: {filtered.length}</span>
        <label className="mr-auto flex items-center gap-2 text-xs font-bold text-slate-500">الترتيب
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="field !h-9 min-w-36">
            <option value="name">الاسم</option><option value="branch">الفرع</option><option value="department">الإدارة</option><option value="hireDate">تاريخ التوظيف</option><option value="status">الحالة</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-500">عدد البطاقات
          <select value={cardCount} onChange={(event) => setCardCount(Number(event.target.value))} className="field !h-9 !w-24">
            {[12, 24, 48, 96].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.slice(0, cardCount).map((employee) => (
            <article key={employeeId(employee)} className="panel overflow-hidden">
              <div className="h-16 bg-gradient-to-l from-slate-950 to-brand-900" />
              <div className="-mt-10 p-5 pt-0">
                <div className="flex items-end gap-3"><Avatar employee={employee} /><div className="mb-1 min-w-0"><h3 className="truncate font-black">{employee.name}</h3><p className="text-xs text-slate-500">{employee.id}</p></div></div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <StatusBadge>{isActive(employee) ? "نشط" : "غير نشط"}</StatusBadge>
                  {isNewEmployee(employee) && <StatusBadge>جديد</StatusBadge>}
                  {(employee.probation_status === "active" || employee.under_probation === true) && <StatusBadge>تحت التجربة</StatusBadge>}
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p><b>الوظيفة:</b> {employee.job || "غير محدد"}</p>
                  <p><b>الفرع:</b> {employee.branch || "غير محدد"}</p>
                  <p><b>الإدارة:</b> {departmentOf(employee, departmentsByJob)}</p>
                  <p><b>الهاتف:</b> {employee.phone || "غير محدد"}</p>
                  <p><b>المدير:</b> {employee.manager || "غير محدد"}</p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 border-t pt-4">
                  <button type="button" onClick={() => openDetails(employee)} className="btn-secondary !h-9"><Eye size={15} /> عرض</button>
                  <button type="button" disabled={!canEdit} onClick={() => setEditing(employee)} className="btn-secondary !h-9 disabled:opacity-40"><Pencil size={15} /> تعديل</button>
                  {canViewFinancial && <button type="button" onClick={() => openDetails(employee, "financial")} className="btn-secondary !h-9"><Gauge size={15} /> بيانات مالية</button>}
                  <button type="button" onClick={() => openDetails(employee, "documents")} className="btn-secondary !h-9"><FileText size={15} /> الوثائق</button>
                  {canResetPassword && <button type="button" onClick={() => openDetails(employee, "password")} className="btn-secondary !h-9"><KeyRound size={15} /> كلمة المرور</button>}
                  {canDeactivate && isActive(employee) && <button type="button" onClick={() => openDetails(employee)} className="btn-secondary !h-9 text-red-600"><UserMinus size={15} /> إلغاء التفعيل</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyState>لا توجد بيانات موظفين مطابقة للفلاتر الحالية</EmptyState>}
      {details && EmployeeDetailsModal && (
        <EmployeeDetailsModal
          employee={details.employee}
          initialPanel={details.panel}
          close={() => setDetails(null)}
          onEdit={() => { setEditing(details.employee); setDetails(null); }}
          setEmployees={setEmployees}
          currentUser={currentUser}
          currentCompany={currentCompany}
          can={can}
        />
      )}
      {editing && EmployeeModal && (
        <EmployeeModal
          editing={editing}
          close={() => setEditing(null)}
          setEmployees={setEmployees}
          branchOptions={branchOptions}
          jobOptions={jobOptions}
          managerOptions={managerOptions}
          canViewFinancial={canViewFinancial}
          onSaved={(saved, previous) => {
            onEmployeeSaved?.(saved, previous);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function exportActivityCsv(rows) {
  const columns = [
    ["created_at", "التاريخ والوقت"], ["username", "المستخدم"], ["user_role", "الدور"], ["company_id", "الشركة"],
    ["branch", "الفرع"], ["module_name", "الوحدة"], ["page_name", "الصفحة"], ["action_label", "نوع العملية"],
    ["description", "الوصف"], ["entity_type", "الكيان"], ["entity_id", "معرف السجل"], ["severity", "الخطورة"],
  ];
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = "\ufeff" + [columns.map(([, label]) => escape(label)).join(","), ...rows.map((row) => columns.map(([key]) => escape(row[key])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `user-activity-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function UserActivityLogsPage({ currentUser, currentCompany, can }) {
  const platformAdmin = isPlatformAdminUser(currentUser);
  const allowed = platformAdmin || can?.("user_activity_logs", "can_view_sensitive") === true || can?.("user_activity_logs", "can_manage") === true;
  const [filters, setFilters] = useState({ from: "", to: "", user: "", module: "", page: "", action: "", severity: "", q: "" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setError("");
    try {
      setRows(await activityLogsService.loadUserActivityLogs({ ...filters, companyId: currentCompany?.company_id }));
    } catch (loadError) {
      setRows([]);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [allowed, currentCompany?.company_id, filters]);
  useEffect(() => { load(); }, [load]);
  if (!allowed) return <div className="panel p-8 text-center font-bold text-red-700">لا تملك صلاحية عرض سجلات المستخدمين الحساسة</div>;
  const options = {
    users: unique(rows.map((row) => row.username)),
    modules: unique(rows.map((row) => row.module_key)),
    pages: unique(rows.map((row) => row.page_key)),
  };
  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div><h2 className="text-2xl font-black">سجلات المستخدمين</h2><p className="mt-1 text-sm text-slate-500">سجل مركزي للعمليات الإدارية والحساسة داخل التطبيق</p></div>
        <div className="flex gap-2 md:mr-auto"><button type="button" onClick={load} className="btn-secondary"><RefreshCw size={17} /> تحديث</button><button type="button" onClick={() => {
          exportActivityCsv(rows);
          activityLogsService.logUserActivity({
            company_id: currentCompany?.company_id,
            module_key: "hr",
            module_name: "الموارد البشرية",
            page_key: "user_activity_logs",
            page_name: "سجلات المستخدمين",
            action_type: "export",
            action_label: "تصدير سجلات المستخدمين",
            description: "تم تصدير نتائج سجلات المستخدمين بصيغة CSV",
            severity: "حساس",
            metadata: { exported_rows_count: rows.length },
          });
        }} disabled={!rows.length} className="btn-secondary disabled:opacity-40"><Download size={17} /> CSV</button></div>
      </div>
      {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{error}<p className="mt-2 text-xs font-normal">جدول user_activity_logs اختياري؛ طبّق مسودة SQL المؤجلة بعد المراجعة لبدء التسجيل.</p></div>}
      <div className="panel grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-5">
        <input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} className="field" aria-label="من تاريخ" />
        <input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} className="field" aria-label="إلى تاريخ" />
        <select value={filters.user} onChange={(event) => setFilters({ ...filters, user: event.target.value })} className="field"><option value="">كل المستخدمين</option>{options.users.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.module} onChange={(event) => setFilters({ ...filters, module: event.target.value })} className="field"><option value="">كل الوحدات</option>{options.modules.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.page} onChange={(event) => setFilters({ ...filters, page: event.target.value })} className="field"><option value="">كل الصفحات</option>{options.pages.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })} className="field"><option value="">كل العمليات</option>{activityTypes.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.severity} onChange={(event) => setFilters({ ...filters, severity: event.target.value })} className="field"><option value="">كل مستويات الخطورة</option>{activitySeverities.map((value) => <option key={value}>{value}</option>)}</select>
        <label className="flex h-11 items-center gap-2 rounded-xl border px-3 md:col-span-2 xl:col-span-3"><Search size={17} /><input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} className="w-full outline-none" placeholder="بحث في وصف العملية أو السجل" /></label>
      </div>
      <div className="panel p-4">
        {loading ? <p className="py-10 text-center text-sm font-bold text-slate-400">جاري تحميل السجلات...</p> : rows.length ? (
          <div className="table-wrap"><table><thead><tr><th>التاريخ والوقت</th><th>المستخدم</th><th>الدور</th><th>الوحدة / الصفحة</th><th>العملية</th><th>الوصف</th><th>الكيان</th><th>الخطورة</th><th></th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}><td>{formatDateTime(row.created_at)}</td><td><b>{row.username || row.user_name}</b><p className="text-[11px] text-slate-400">{row.branch || row.company_id}</p></td><td>{row.user_role || "—"}</td><td>{row.module_name || row.module_key}<p className="text-[11px] text-slate-400">{row.page_name || row.page_key}</p></td><td>{row.action_label || row.action_type}</td><td className="max-w-xs truncate">{row.description || "—"}</td><td>{row.entity_type || "—"}<p className="text-[11px] text-slate-400">{row.entity_id || "—"}</p></td><td><StatusBadge>{row.severity}</StatusBadge></td><td><button type="button" onClick={() => setSelected(row)} className="p-2 text-brand-700"><Eye size={16} /></button></td></tr>)}</tbody>
          </table></div>
        ) : <EmptyState>لا توجد سجلات مطابقة للفلاتر الحالية</EmptyState>}
      </div>
      {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="panel max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6"><div className="mb-5 flex"><h3 className="text-xl font-black">تفاصيل سجل المستخدم</h3><button type="button" onClick={() => setSelected(null)} className="mr-auto"><X /></button></div><div className="grid gap-3 md:grid-cols-2">{Object.entries(selected).filter(([key]) => key !== "metadata").map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-400">{key}</p><p className="mt-1 break-words text-sm font-bold">{String(value || "—")}</p></div>)}</div>{Object.keys(selected.metadata || {}).length > 0 && <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-left text-xs text-slate-200" dir="ltr">{JSON.stringify(selected.metadata, null, 2)}</pre>}</div></div>}
    </div>
  );
}

const latestEvaluationMap = (evaluations = []) => {
  const map = new Map();
  evaluations.forEach((evaluation) => {
    const id = evaluationEmployeeId(evaluation);
    if (!id) return;
    const previous = map.get(id);
    if (!previous || clean(evaluation.month) >= clean(previous.month)) map.set(id, evaluation);
  });
  return map;
};

export function EmployeeEffectivenessPage({
  employees = [],
  evaluations = [],
  settings = {},
  currentCompany,
  currentUser,
  can,
  setPage,
  setEmployees,
  EmployeeDetailsModal,
}) {
  const [tab, setTab] = useState("all");
  const [details, setDetails] = useState(null);
  const [signals, setSignals] = useState({ attendance: [], violations: [], operations: [] });
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState("");
  const companyId = clean(currentCompany?.company_id);
  const departmentsByJob = useMemo(() => jobDepartmentMap(settings), [settings.jobDefinitions, settings.jobs]);
  const loadSignals = useCallback(async () => {
    if (!companyId) return setLoading(false);
    setLoading(true);
    const warnings = [];
    const [attendance, violations, operations] = await Promise.all([
      hrRecordsService.load("hr_attendance_payroll", companyId).then((result) => result.rows || []).catch((error) => { warnings.push(error.message); return []; }),
      hrRecordsService.load("hr_disciplinary", companyId).then((result) => result.rows || []).catch((error) => { warnings.push(error.message); return []; }),
      dailyOperationsService.loadDailyOperations({ companyId }).catch((error) => { warnings.push(error.message); return []; }),
    ]);
    setSignals({ attendance, violations, operations });
    setWarning(warnings.length ? "بعض مصادر بيانات الفعالية غير متاحة حاليًا" : "");
    setLoading(false);
  }, [companyId]);
  useEffect(() => { loadSignals(); }, [loadSignals]);
  const evaluationMap = useMemo(() => latestEvaluationMap(evaluations), [evaluations]);
  const rows = useMemo(() => employees
    .filter((employee) => !companyId || !employee.company_id || clean(employee.company_id) === companyId)
    .map((employee) => {
      const id = employeeId(employee);
      const evaluation = evaluationMap.get(id);
      const attendanceRows = signals.attendance.filter((row) => clean(row.employee_id) === id || clean(row.employee_name) === clean(employee.name));
      const violationRows = signals.violations.filter((row) => clean(row.employee_id) === id || clean(row.employee_name) === clean(employee.name));
      const operationRows = signals.operations.filter((row) => clean(row.employee_id) === id);
      const scores = [];
      if (evaluation) scores.push({ value: evaluationScore(evaluation), weight: 55, key: "evaluation" });
      if (attendanceRows.length) {
        const absences = attendanceRows.filter((row) => ["غياب", "غائب"].includes(clean(row.status))).length;
        const late = attendanceRows.filter((row) => number(row.late_minutes) > 0).length;
        scores.push({ value: Math.max(0, 100 - absences * 15 - late * 3), weight: 25, key: "attendance" });
      }
      if (violationRows.length || signals.violations.length) scores.push({ value: Math.max(0, 100 - violationRows.length * 20), weight: 10, key: "violations" });
      if (operationRows.length) {
        const total = operationRows.reduce((sum, row) => sum + number(row.operation_count), 0);
        const completed = operationRows.reduce((sum, row) => sum + number(row.completed_count), 0);
        const errors = operationRows.reduce((sum, row) => sum + number(row.error_count), 0);
        const base = total > 0 ? (completed / total) * 100 : 0;
        scores.push({ value: Math.max(0, Math.min(100, base - (total ? errors / total * 100 : 0))), weight: 10, key: "productivity" });
      }
      const weight = scores.reduce((sum, score) => sum + score.weight, 0);
      const score = weight ? scores.reduce((sum, item) => sum + item.value * item.weight, 0) / weight : null;
      const active = isActive(employee);
      const repeatedIssues = violationRows.length >= 3 || attendanceRows.filter((row) => ["غياب", "غائب"].includes(clean(row.status))).length >= 3;
      const missingImportant = !evaluation || !attendanceRows.length;
      let classification = "يحتاج متابعة";
      let reason = "بيانات أساسية غير مكتملة";
      if (!active || repeatedIssues || (score != null && score < 50)) {
        classification = "غير فعال";
        reason = !active ? "الموظف غير نشط" : repeatedIssues ? "تكرار الغياب أو المخالفات" : "درجة الفعالية أقل من 50";
      } else if (score != null && score >= 80 && !missingImportant && violationRows.length === 0) {
        classification = "متعاون";
        reason = "نتائج أداء وانضباط مرتفعة دون مخالفات";
      } else if (score != null) {
        reason = missingImportant ? "يحتاج استكمال بيانات التقييم أو الحضور" : "درجة الفعالية بين 50 و79";
      }
      return {
        employee,
        score,
        classification,
        reason,
        evaluation,
        violations: violationRows.length,
        absences: attendanceRows.filter((row) => ["غياب", "غائب"].includes(clean(row.status))).length,
        late: attendanceRows.filter((row) => number(row.late_minutes) > 0).length,
        insufficient: score == null || missingImportant,
      };
    }), [employees, companyId, evaluationMap, signals, departmentsByJob]);
  const summary = {
    cooperative: rows.filter((row) => row.classification === "متعاون").length,
    ineffective: rows.filter((row) => row.classification === "غير فعال").length,
    followup: rows.filter((row) => row.classification === "يحتاج متابعة").length,
    insufficient: rows.filter((row) => row.insufficient).length,
  };
  const filtered = rows.filter((row) =>
    tab === "all" ||
    (tab === "cooperative" && row.classification === "متعاون") ||
    (tab === "ineffective" && row.classification === "غير فعال") ||
    (tab === "followup" && row.classification === "يحتاج متابعة"),
  );
  const noSignals = !evaluations.length && !signals.attendance.length && !signals.violations.length && !signals.operations.length;
  return (
    <div className="space-y-5" dir="rtl">
      <div><h2 className="text-2xl font-black">الموظفون المتعاونون وغير الفعالون</h2><p className="mt-1 text-sm text-slate-500">تصنيف استرشادي يعتمد فقط على بيانات الأداء والانضباط والإنتاجية المتاحة</p></div>
      {(warning || noSignals) && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">{noSignals ? "لا توجد بيانات كافية لتصنيف الموظفين بدقة" : warning}</div>}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["عدد المتعاونين", summary.cooperative, UserCheck, "text-emerald-700 bg-emerald-50"],
          ["عدد غير الفعالين", summary.ineffective, UserMinus, "text-red-700 bg-red-50"],
          ["يحتاجون متابعة", summary.followup, AlertTriangle, "text-amber-700 bg-amber-50"],
          ["بدون بيانات كافية", summary.insufficient, ShieldAlert, "text-slate-700 bg-slate-100"],
        ].map(([label, value, Icon, style]) => <div key={label} className="panel flex items-center gap-3 p-4"><span className={`grid h-11 w-11 place-items-center rounded-xl ${style}`}><Icon size={20} /></span><div><p className="text-xs font-bold text-slate-500">{label}</p><b className="text-2xl">{value}</b></div></div>)}
      </div>
      <div className="panel flex flex-wrap gap-2 p-3">
        {[["cooperative", "الموظفون المتعاونون"], ["ineffective", "الموظفون غير الفعالين"], ["followup", "يحتاجون متابعة"], ["all", "الكل"]].map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === key ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>)}
      </div>
      <div className="panel p-4">
        {loading ? <p className="py-10 text-center text-sm font-bold text-slate-400">جاري تحليل البيانات المتاحة...</p> : filtered.length ? (
          <div className="table-wrap"><table><thead><tr><th>الرقم الوظيفي</th><th>الموظف</th><th>الفرع</th><th>الإدارة</th><th>الوظيفة</th><th>الحالة</th><th>درجة الفعالية</th><th>سبب التصنيف</th><th>آخر تقييم</th><th>المخالفات</th><th>الغياب / التأخير</th><th>إجراء</th></tr></thead>
            <tbody>{filtered.map((row) => <tr key={employeeId(row.employee)}><td>{employeeId(row.employee)}</td><td className="font-bold">{row.employee.name}</td><td>{row.employee.branch || "غير محدد"}</td><td>{departmentOf(row.employee, departmentsByJob)}</td><td>{row.employee.job || "غير محدد"}</td><td><StatusBadge>{row.classification}</StatusBadge></td><td>{row.score == null ? "غير متاح" : `${row.score.toFixed(1)}%`}</td><td className="max-w-xs">{row.reason}</td><td>{row.evaluation?.month || "غير متاح"}</td><td>{row.violations}</td><td>{row.absences} / {row.late}</td><td><div className="flex min-w-40 flex-wrap gap-1"><button type="button" onClick={() => setDetails(row.employee)} className="p-2 text-brand-700" title="عرض الملف"><Eye size={16} /></button><button type="button" onClick={() => setPage?.("plans")} className="p-2 text-amber-700" title="إنشاء خطة تحسين"><Gauge size={16} /></button><button type="button" onClick={() => setPage?.("hr_disciplinary")} className="p-2 text-slate-600" title="إضافة ملاحظة أو تنبيه"><ChevronLeft size={16} /></button></div></td></tr>)}</tbody>
          </table></div>
        ) : <EmptyState>لا يوجد موظفون ضمن التصنيف المحدد</EmptyState>}
      </div>
      {details && EmployeeDetailsModal && <EmployeeDetailsModal employee={details} close={() => setDetails(null)} onEdit={() => {}} setEmployees={setEmployees} currentUser={currentUser} currentCompany={currentCompany} can={can} />}
    </div>
  );
}
