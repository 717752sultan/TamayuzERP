import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  Network,
  Pencil,
  Plus,
  Save,
  Settings,
  Trash2,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";
import { settingsBranchesService } from "../../services/settingsBranches";

const statusOptions = ["نشط", "معطل"];

const foundationDefaults = {
  employee_id_prefix: "EMP",
  probation_months: 3,
  weekly_working_days: 6,
  daily_working_hours: 8,
  weekend_day: "الجمعة",
  default_employee_status: "نشط",
};

const tabItems = [
  ["overview", "نظرة عامة", LayoutDashboard],
  ["organization", "الهيكل التنظيمي", Network],
  ["branches", "الفروع", Building2],
  ["departments", "الأقسام", Building2],
  ["jobs", "الوظائف", BriefcaseBusiness],
  ["job_titles", "المسميات الوظيفية", BadgeCheck],
  ["reporting_managers", "المديرون المباشرون", UserRoundCog],
  ["hr_settings", "إعدادات الموارد البشرية", Settings],
];

const entityConfigs = {
  departments: {
    title: "القسم",
    settingsKey: "departments",
    prefix: "DEP",
    fields: [
      ["code", "كود القسم", "text"],
      ["name", "اسم القسم", "text"],
      ["parent_department", "القسم الرئيسي", "department"],
      ["branch_name", "الفرع", "branch"],
      ["manager_name", "مدير القسم", "manager"],
      ["status", "الحالة", "status"],
    ],
  },
  jobs: {
    title: "الوظيفة",
    settingsKey: "jobDefinitions",
    prefix: "JOB",
    fields: [
      ["code", "كود الوظيفة", "text"],
      ["name", "اسم الوظيفة", "text"],
      ["department_name", "القسم", "department"],
      ["status", "الحالة", "status"],
    ],
  },
  job_titles: {
    title: "المسمى الوظيفي",
    settingsKey: "jobTitles",
    prefix: "TITLE",
    fields: [
      ["code", "كود المسمى", "text"],
      ["title", "المسمى الوظيفي", "text"],
      ["job_name", "الوظيفة", "job"],
      ["department_name", "القسم", "department"],
      ["grade", "الدرجة الوظيفية", "text"],
      ["status", "الحالة", "status"],
    ],
  },
};

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const clean = (value) => String(value || "").trim();
const unique = (values = []) => [...new Set(values.map(clean).filter(Boolean))];

const normalizeDepartments = (settings = {}) =>
  (Array.isArray(settings.departments) ? settings.departments : []).map((item, index) =>
    typeof item === "string"
      ? { id: `DEP-LEGACY-${index}`, code: "", name: item, parent_department: "", branch_name: "", manager_name: "", status: "نشط" }
      : { id: item.id || `DEP-LEGACY-${index}`, code: item.code || "", name: item.name || item.department_name || "", parent_department: item.parent_department || "", branch_name: item.branch_name || item.branch || "", manager_name: item.manager_name || item.manager || "", status: item.status || "نشط" },
  );

const normalizeJobs = (settings = {}) => {
  const source = Array.isArray(settings.jobDefinitions) && settings.jobDefinitions.length
    ? settings.jobDefinitions
    : Array.isArray(settings.jobs) ? settings.jobs : [];
  return source.map((item, index) =>
    typeof item === "string"
      ? { id: `JOB-LEGACY-${index}`, code: "", name: item, department_name: "", status: "نشط" }
      : { id: item.id || `JOB-LEGACY-${index}`, code: item.code || "", name: item.name || item.job_name || "", department_name: item.department_name || item.department || "", status: item.status || "نشط" },
  );
};

const normalizeJobTitles = (settings = {}, jobs = []) => {
  const source = Array.isArray(settings.jobTitles) && settings.jobTitles.length
    ? settings.jobTitles
    : jobs.map((job) => ({ title: job.name, job_name: job.name, department_name: job.department_name }));
  return source.map((item, index) =>
    typeof item === "string"
      ? { id: `TITLE-LEGACY-${index}`, code: "", title: item, job_name: item, department_name: "", grade: "", status: "نشط" }
      : { id: item.id || `TITLE-LEGACY-${index}`, code: item.code || "", title: item.title || item.job_title || item.name || "", job_name: item.job_name || item.job || "", department_name: item.department_name || item.department || "", grade: item.grade || "", status: item.status || "نشط" },
  );
};

const pageDefaults = {
  hr_home: "overview",
  hr_org_chart: "organization",
  hr_settings: "hr_settings",
};

const pageTitles = {
  hr_home: "لوحة الموارد البشرية",
  hr_org_chart: "الهيكل التنظيمي",
  hr_settings: "إعدادات الموارد البشرية",
};

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={20} /></div>
        <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div>
      </div>
    </div>
  );
}

function EmptyState({ children = "لا توجد بيانات حالياً" }) {
  return <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">{children}</div>;
}

function ModalShell({ title, close, children, onSubmit, saving = false }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" dir="rtl">
      <form onSubmit={onSubmit} className="panel max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6">
        <div className="mb-6 flex items-center"><h3 className="text-xl font-extrabold">{title}</h3><button type="button" onClick={close} className="mr-auto"><X /></button></div>
        {children}
        <div className="mt-7 flex justify-end gap-2">
          <button type="button" onClick={close} className="btn-secondary">إلغاء</button>
          <button disabled={saving} className="btn-primary"><Save size={17} /> {saving ? "جاري الحفظ..." : "حفظ البيانات"}</button>
        </div>
      </form>
    </div>
  );
}

export default function HRFoundationPage({
  pageKey = "hr_home",
  employees = [],
  setEmployees,
  settings = {},
  setSettings,
  currentCompany,
  can,
}) {
  const companyId = currentCompany?.company_id || "";
  const [tab, setTab] = useState(pageDefaults[pageKey] || "overview");
  const [branchRows, setBranchRows] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchError, setBranchError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [foundationDraft, setFoundationDraft] = useState(() => ({ ...foundationDefaults, ...(settings.hrFoundation || {}) }));

  useEffect(() => {
    setTab(pageDefaults[pageKey] || "overview");
  }, [pageKey]);

  useEffect(() => {
    setFoundationDraft({ ...foundationDefaults, ...(settings.hrFoundation || {}) });
  }, [settings.hrFoundation, companyId]);

  const loadBranches = async () => {
    if (!companyId) {
      setBranchRows([]);
      setBranchError("لم يتم تحديد الشركة الحالية");
      return;
    }
    setBranchesLoading(true);
    setBranchError("");
    try {
      setBranchRows(await settingsBranchesService.loadBranches(companyId));
    } catch (error) {
      console.error("HR foundation branches load error:", error);
      setBranchRows([]);
      setBranchError(error.message || "تعذر تحميل الفروع");
    } finally {
      setBranchesLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
    const unsubscribe = settingsBranchesService.subscribe?.(loadBranches);
    return () => unsubscribe?.();
  }, [companyId]);

  const departmentRows = useMemo(() => normalizeDepartments(settings), [settings.departments]);
  const jobRows = useMemo(() => normalizeJobs(settings), [settings.jobDefinitions, settings.jobs]);
  const jobTitleRows = useMemo(() => normalizeJobTitles(settings, jobRows), [settings.jobTitles, jobRows]);
  const branchNames = unique([
    ...branchRows.filter((row) => row.is_active !== false).map((row) => row.branch_name),
    ...(settings.branches || []),
    ...employees.map((employee) => employee.branch),
  ]);
  const managerNames = unique(employees.filter((employee) => employee.status === "نشط").map((employee) => employee.name));
  const canConfigure = can?.("hr_settings", "can_edit") !== false;
  const canCreate = can?.("hr_settings", "can_create") !== false;
  const canManageEmployees = can?.("employees", "can_edit") !== false;

  const entityRows = (type) => type === "departments" ? departmentRows : type === "jobs" ? jobRows : jobTitleRows;

  const openEntity = (type, row = null) => {
    if (!row && !canCreate) return alert("لا تملك صلاحية إضافة بيانات الموارد البشرية");
    if (row && !canConfigure) return alert("لا تملك صلاحية تعديل إعدادات الموارد البشرية");
    const config = entityConfigs[type];
    const empty = Object.fromEntries(config.fields.map(([key, , fieldType]) => [key, fieldType === "status" ? "نشط" : ""]));
    setDialog({ type, ...(row || { id: makeId(config.prefix), ...empty }) });
  };

  const saveEntity = async (event) => {
    event.preventDefault();
    const type = dialog?.type;
    const config = entityConfigs[type];
    if (!config) return;
    const primaryField = type === "job_titles" ? "title" : "name";
    if (!clean(dialog[primaryField])) return alert(`${config.title} مطلوب`);
    const rows = entityRows(type);
    const duplicate = rows.some((row) => row.id !== dialog.id && clean(row[primaryField]).toLowerCase() === clean(dialog[primaryField]).toLowerCase());
    if (duplicate) return alert(`${config.title} موجود مسبقًا داخل هذه الشركة`);
    const normalized = { ...dialog, [primaryField]: clean(dialog[primaryField]), status: dialog.status || "نشط" };
    delete normalized.type;
    const next = rows.some((row) => row.id === normalized.id)
      ? rows.map((row) => row.id === normalized.id ? normalized : row)
      : [normalized, ...rows];
    const nextSettings = { ...settings, [config.settingsKey]: next };
    if (type === "jobs") nextSettings.jobs = unique(next.map((row) => row.name));
    setSettings(nextSettings);
    setDialog(null);
    alert("تم حفظ البيانات بنجاح");
  };

  const deactivateEntity = (type, row) => {
    if (!canConfigure) return alert("لا تملك صلاحية تعديل إعدادات الموارد البشرية");
    const config = entityConfigs[type];
    const label = row.title || row.name;
    if (!confirm(`هل تريد تعطيل «${label}»؟`)) return;
    const next = entityRows(type).map((item) => item.id === row.id ? { ...item, status: "معطل" } : item);
    const nextSettings = { ...settings, [config.settingsKey]: next };
    if (type === "jobs") nextSettings.jobs = unique(next.map((item) => item.name));
    setSettings(nextSettings);
  };

  const openBranch = (row = null) => {
    if (!row && !canCreate) return alert("لا تملك صلاحية إضافة فرع");
    if (row && !canConfigure) return alert("لا تملك صلاحية تعديل الفرع");
    setDialog({
      type: "branch",
      ...(row || { branch_code: "", branch_name: "", branch_type: "فرع", manager_name: "", phone: "", address: "", city: "", status: "نشط", is_active: true, notes: "" }),
    });
  };

  const saveBranch = async (event) => {
    event.preventDefault();
    if (!companyId) return alert("لم يتم تحديد الشركة الحالية");
    setSaving(true);
    try {
      const saved = dialog.id
        ? await settingsBranchesService.updateBranch(companyId, dialog.id, dialog)
        : await settingsBranchesService.createBranch(companyId, dialog);
      const next = branchRows.some((row) => row.id === saved.id)
        ? branchRows.map((row) => row.id === saved.id ? saved : row)
        : [saved, ...branchRows];
      setBranchRows(next);
      setSettings({ ...settings, branches: unique([...next.filter((row) => row.is_active !== false).map((row) => row.branch_name), ...employees.map((employee) => employee.branch)]) });
      setDialog(null);
      alert("تم حفظ الفرع بنجاح");
    } catch (error) {
      console.error("HR foundation branch save error:", error);
      alert(error.message || "تعذر حفظ الفرع");
    } finally {
      setSaving(false);
    }
  };

  const deactivateBranch = async (row) => {
    if (!canConfigure) return alert("لا تملك صلاحية تعديل الفرع");
    if (employees.some((employee) => employee.branch === row.branch_name)) return alert("الفرع مرتبط بموظفين؛ انقل الموظفين أولًا قبل تعطيله.");
    if (!confirm(`هل تريد تعطيل فرع «${row.branch_name}»؟`)) return;
    try {
      const saved = await settingsBranchesService.deleteBranch(companyId, row.id, row);
      const next = branchRows.map((item) => item.id === saved.id ? saved : item);
      setBranchRows(next);
      setSettings({ ...settings, branches: unique(next.filter((item) => item.is_active !== false).map((item) => item.branch_name)) });
    } catch (error) {
      console.error("HR foundation branch save error:", error);
      alert(error.message || "تعذر تعطيل الفرع");
    }
  };

  const openReportingManager = (employee) => {
    if (!canManageEmployees) return alert("لا تملك صلاحية تعديل بيانات الموظفين");
    setDialog({ type: "reporting_manager", employee_id: employee.id, employee_name: employee.name, manager_name: employee.manager || "" });
  };

  const saveReportingManager = (event) => {
    event.preventDefault();
    const employee = employees.find((item) => item.id === dialog.employee_id);
    if (!employee) return alert("تعذر العثور على الموظف");
    if (dialog.manager_name === employee.name) return alert("لا يمكن أن يكون الموظف مديرًا مباشرًا لنفسه");
    setEmployees((rows) => rows.map((row) => row.id === employee.id ? { ...row, manager: clean(dialog.manager_name) } : row));
    setDialog(null);
    alert("تم تحديث المدير المباشر بنجاح");
  };

  const saveFoundationSettings = () => {
    if (!canConfigure) return alert("لا تملك صلاحية تعديل إعدادات الموارد البشرية");
    setSettings({ ...settings, hrFoundation: { ...foundationDefaults, ...foundationDraft } });
    alert("تم حفظ إعدادات الموارد البشرية بنجاح");
  };

  const jobDepartmentMap = Object.fromEntries(jobRows.map((job) => [job.name, job.department_name || "غير محدد"]));
  const organizationBranches = branchNames.length ? branchNames : ["غير محدد"];
  const assignedManagers = employees.filter((employee) => clean(employee.manager)).length;

  const renderOverview = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="إجمالي الموظفين" value={employees.length} icon={Users} />
        <Metric label="الموظفون النشطون" value={employees.filter((employee) => employee.status === "نشط").length} icon={BadgeCheck} />
        <Metric label="الفروع" value={branchNames.length} icon={Building2} />
        <Metric label="الأقسام" value={departmentRows.filter((row) => row.status !== "معطل").length} icon={Network} />
        <Metric label="الوظائف" value={jobRows.filter((row) => row.status !== "معطل").length} icon={BriefcaseBusiness} />
        <Metric label="المسميات الوظيفية" value={jobTitleRows.filter((row) => row.status !== "معطل").length} icon={BadgeCheck} />
        <Metric label="خطوط الإشراف المحددة" value={assignedManagers} icon={UserRoundCog} />
        <Metric label="مستخدمو الشركة" value="من صفحة الصلاحيات" icon={Settings} />
      </div>
      <div className="panel p-5">
        <h3 className="text-lg font-extrabold">جاهزية أساس الموارد البشرية</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ["سجل الموظفين", employees.length > 0],
            ["الفروع", branchNames.length > 0],
            ["الأقسام", departmentRows.length > 0],
            ["الوظائف", jobRows.length > 0],
            ["المسميات الوظيفية", jobTitleRows.length > 0],
            ["المديرون المباشرون", assignedManagers > 0],
          ].map(([label, ready]) => <div key={label} className={`flex items-center gap-3 rounded-xl p-3 text-sm font-bold ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><BadgeCheck size={18} />{label}<span className="mr-auto">{ready ? "جاهز" : "يحتاج إعداد"}</span></div>)}
        </div>
      </div>
    </div>
  );

  const renderOrganization = () => (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-900 p-5 text-white"><p className="text-xs text-slate-300">الشركة</p><h3 className="mt-1 text-xl font-extrabold">{currentCompany?.company_name || "الشركة الحالية"}</h3></div>
      <div className="grid gap-4 xl:grid-cols-2">
        {organizationBranches.map((branchName) => {
          const branchEmployees = employees.filter((employee) => (employee.branch || "غير محدد") === branchName);
          const branchDepartments = unique([
            ...departmentRows.filter((department) => !department.branch_name || department.branch_name === branchName).map((department) => department.name),
            ...branchEmployees.map((employee) => jobDepartmentMap[employee.job] || "غير محدد"),
          ]);
          return <div key={branchName} className="panel p-5"><div className="flex items-center gap-3 border-b pb-4"><Building2 className="text-brand-700" /><div><h3 className="font-extrabold">{branchName}</h3><p className="text-xs text-slate-500">{branchEmployees.length} موظف</p></div></div><div className="mt-4 space-y-3">{branchDepartments.map((departmentName) => { const departmentEmployees = branchEmployees.filter((employee) => (jobDepartmentMap[employee.job] || "غير محدد") === departmentName); return <div key={departmentName} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center"><b className="text-sm">{departmentName}</b><span className="mr-auto text-xs text-slate-400">{departmentEmployees.length}</span></div><div className="mt-2 flex flex-wrap gap-2">{departmentEmployees.map((employee) => <span key={employee.id} className="rounded-lg bg-white px-2 py-1 text-xs text-slate-600">{employee.name} · {employee.job}</span>)}</div></div>; })}</div></div>;
        })}
      </div>
    </div>
  );

  const renderBranches = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3"><div><h3 className="text-lg font-extrabold">إدارة الفروع</h3><p className="text-xs text-slate-500">بيانات الفروع محفوظة في Supabase ومعزولة حسب الشركة.</p></div><button disabled={!canCreate} onClick={() => openBranch()} className="btn-primary mr-auto"><Plus size={17} /> إضافة فرع</button></div>
      {branchError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">{branchError}</div>}
      {branchesLoading ? <EmptyState>جاري تحميل الفروع...</EmptyState> : branchRows.length ? <div className="table-wrap"><table><thead><tr><th>الكود</th><th>اسم الفرع</th><th>النوع</th><th>المدير</th><th>المدينة</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{branchRows.map((row) => <tr key={row.id}><td>{row.branch_code}</td><td className="font-bold">{row.branch_name}</td><td>{row.branch_type}</td><td>{row.manager_name || "—"}</td><td>{row.city || "—"}</td><td>{row.is_active === false ? "معطل" : row.status}</td><td><button disabled={!canConfigure} onClick={() => openBranch(row)} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canConfigure || row.is_active === false} onClick={() => deactivateBranch(row)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div> : <EmptyState />}
    </div>
  );

  const renderEntityTable = (type) => {
    const config = entityConfigs[type];
    const rows = entityRows(type);
    return <div className="space-y-4"><div className="flex flex-wrap items-center gap-3"><div><h3 className="text-lg font-extrabold">إدارة {type === "departments" ? "الأقسام" : type === "jobs" ? "الوظائف" : "المسميات الوظيفية"}</h3><p className="text-xs text-slate-500">تُحفظ البيانات المرجعية ضمن إعدادات الشركة في Supabase.</p></div><button disabled={!canCreate} onClick={() => openEntity(type)} className="btn-primary mr-auto"><Plus size={17} /> إضافة</button></div>{rows.length ? <div className="table-wrap"><table><thead><tr>{config.fields.slice(0, 5).map(([key, label]) => <th key={key}>{label}</th>)}<th>الإجراءات</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{config.fields.slice(0, 5).map(([key]) => <td key={key}>{row[key] || "—"}</td>)}<td><button disabled={!canConfigure} onClick={() => openEntity(type, row)} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canConfigure || row.status === "معطل"} onClick={() => deactivateEntity(type, row)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div> : <EmptyState />}</div>;
  };

  const renderManagers = () => (
    <div className="space-y-4"><div><h3 className="text-lg font-extrabold">خطوط الإشراف والمديرون المباشرون</h3><p className="text-xs text-slate-500">يُحفظ المدير المباشر في سجل الموظف نفسه داخل Supabase.</p></div>{employees.length ? <div className="table-wrap"><table><thead><tr><th>رقم الموظف</th><th>الموظف</th><th>الفرع</th><th>الوظيفة</th><th>المدير المباشر</th><th>الإجراءات</th></tr></thead><tbody>{employees.map((employee) => <tr key={employee.id}><td>{employee.id}</td><td className="font-bold">{employee.name}</td><td>{employee.branch}</td><td>{employee.job}</td><td>{employee.manager || "غير محدد"}</td><td><button disabled={!canManageEmployees} onClick={() => openReportingManager(employee)} className="btn-secondary"><Pencil size={15} /> تعديل</button></td></tr>)}</tbody></table></div> : <EmptyState />}</div>
  );

  const renderHrSettings = () => (
    <div className="space-y-5"><div><h3 className="text-lg font-extrabold">إعدادات الموارد البشرية الأساسية</h3><p className="text-xs text-slate-500">إعدادات تأسيسية تستخدمها المراحل اللاحقة ولا تعتمد على LocalStorage.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[
      ["employee_id_prefix", "بادئة الرقم الوظيفي", "text"],
      ["probation_months", "مدة التجربة بالأشهر", "number"],
      ["weekly_working_days", "أيام العمل الأسبوعية", "number"],
      ["daily_working_hours", "ساعات العمل اليومية", "number"],
      ["weekend_day", "يوم الراحة الأسبوعية", "text"],
      ["default_employee_status", "حالة الموظف الافتراضية", "status"],
    ].map(([key, label, type]) => <label key={key} className="text-sm font-bold text-slate-600">{label}{type === "status" ? <select value={foundationDraft[key] || "نشط"} onChange={(event) => setFoundationDraft({ ...foundationDraft, [key]: event.target.value })} className="field mt-2"><option>نشط</option><option>تحت التجربة</option></select> : <input type={type} value={foundationDraft[key] ?? ""} onChange={(event) => setFoundationDraft({ ...foundationDraft, [key]: type === "number" ? Number(event.target.value || 0) : event.target.value })} className="field mt-2" />}</label>)}</div><button disabled={!canConfigure} onClick={saveFoundationSettings} className="btn-primary"><Save size={17} /> حفظ إعدادات الموارد البشرية</button></div>
  );

  const content = tab === "overview" ? renderOverview()
    : tab === "organization" ? renderOrganization()
      : tab === "branches" ? renderBranches()
        : tab === "departments" ? renderEntityTable("departments")
          : tab === "jobs" ? renderEntityTable("jobs")
            : tab === "job_titles" ? renderEntityTable("job_titles")
              : tab === "reporting_managers" ? renderManagers()
                : renderHrSettings();

  const renderDialogField = ([key, label, type]) => {
    const value = dialog?.[key] ?? "";
    const options = type === "department" ? departmentRows.map((row) => row.name)
      : type === "branch" ? branchNames
        : type === "manager" ? managerNames
          : type === "job" ? jobRows.map((row) => row.name)
            : [];
    return <label key={key} className="text-sm font-bold text-slate-600">{label}{type === "status" ? <select value={value || "نشط"} onChange={(event) => setDialog({ ...dialog, [key]: event.target.value })} className="field mt-2">{statusOptions.map((option) => <option key={option}>{option}</option>)}</select> : options.length ? <select value={value} onChange={(event) => setDialog({ ...dialog, [key]: event.target.value })} className="field mt-2"><option value="">غير محدد</option>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input value={value} onChange={(event) => setDialog({ ...dialog, [key]: event.target.value })} className="field mt-2" />}</label>;
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="panel flex flex-wrap items-center gap-4 p-5"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-700 text-white"><Network /></div><div><h1 className="text-xl font-extrabold">{pageTitles[pageKey] || "أساس الموارد البشرية"}</h1><p className="mt-1 text-xs text-slate-500">تأسيس الهيكل والبيانات المرجعية للشركة قبل تشغيل مراحل دورة الموظف.</p></div><span className="mr-auto rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">المرحلة الأولى</span></div>
      <div className="panel flex gap-2 overflow-x-auto p-3">{tabItems.map(([key, label, Icon]) => <button key={key} onClick={() => setTab(key)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${tab === key ? "bg-brand-700 text-white" : "bg-slate-50 text-slate-600"}`}><Icon size={16} />{label}</button>)}</div>
      {content}

      {dialog?.type === "branch" && <ModalShell title={dialog.id ? "تعديل فرع" : "إضافة فرع"} close={() => setDialog(null)} onSubmit={saveBranch} saving={saving}><div className="grid gap-4 md:grid-cols-2">{[
        ["branch_code", "كود الفرع"], ["branch_name", "اسم الفرع"], ["branch_type", "نوع الفرع"], ["manager_name", "مدير الفرع"], ["phone", "الهاتف"], ["city", "المدينة"], ["address", "العنوان"], ["notes", "ملاحظات"],
      ].map(([key, label]) => <label key={key} className="text-sm font-bold text-slate-600">{label}<input required={["branch_code", "branch_name"].includes(key)} value={dialog[key] || ""} onChange={(event) => setDialog({ ...dialog, [key]: event.target.value })} className="field mt-2" /></label>)}</div></ModalShell>}

      {entityConfigs[dialog?.type] && <ModalShell title={`${dialog.id?.includes("LEGACY") ? "تعديل" : "إضافة أو تعديل"} ${entityConfigs[dialog.type].title}`} close={() => setDialog(null)} onSubmit={saveEntity}><div className="grid gap-4 md:grid-cols-2">{entityConfigs[dialog.type].fields.map(renderDialogField)}</div></ModalShell>}

      {dialog?.type === "reporting_manager" && <ModalShell title="تعديل المدير المباشر" close={() => setDialog(null)} onSubmit={saveReportingManager}><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-bold text-slate-600">الموظف<input readOnly value={dialog.employee_name || ""} className="field mt-2 bg-slate-50" /></label><label className="text-sm font-bold text-slate-600">المدير المباشر<select value={dialog.manager_name || ""} onChange={(event) => setDialog({ ...dialog, manager_name: event.target.value })} className="field mt-2"><option value="">غير محدد</option>{managerNames.filter((name) => name !== dialog.employee_name).map((name) => <option key={name}>{name}</option>)}</select></label></div></ModalShell>}
    </div>
  );
}
