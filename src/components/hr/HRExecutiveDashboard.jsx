import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileBarChart,
  Gauge,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { settingsBranchesService } from "../../services/settingsBranches";
import { hrRecordsService } from "../../services/hrRecords";
import { isPlatformAdminUser } from "../../services/tenant";

const CHART_COLORS = ["#7f1d1d", "#b91c1c", "#d97706", "#0369a1", "#475569", "#15803d"];
const monthNames = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const clean = (value) => String(value ?? "").trim();
const number = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const unique = (values) => [...new Set(values.map(clean).filter(Boolean))];
const employeeIdOf = (row = {}) => clean(row.employeeId || row.employee_id || row.id);
const evaluationEmployeeId = (row = {}) => clean(row.employeeId || row.employee_id);
const evaluationTotal = (row = {}) => number(row.total ?? row.final_score ?? row.finalScore);
const isApproved = (row = {}) => ["معتمد", "معتمدة", "approved"].includes(clean(row.status).toLowerCase());
const isActiveEmployee = (row = {}) =>
  row.is_active !== false && !["معطل", "غير نشط", "موقوف", "منتهي الخدمة", "ملغي"].includes(clean(row.status));
const recordDate = (row = {}) =>
  clean(
    row.attendance_date ||
      row.request_date ||
      row.start_date ||
      row.salary_month ||
      row.month ||
      row.created_at ||
      row.updated_at,
  );
const periodOf = (row = {}) => recordDate(row).slice(0, 7);
const formatNumber = (value, digits = 0) =>
  new Intl.NumberFormat("ar-SA", { maximumFractionDigits: digits }).format(number(value));

const employeeDepartment = (employee = {}, jobDepartmentMap = {}) =>
  clean(employee.department || employee.department_name || jobDepartmentMap[clean(employee.job)]) || "غير محدد";

function EmptyChart({ text = "لا توجد بيانات متاحة للفترة المحددة" }) {
  return (
    <div className="grid h-[250px] place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
      <div>
        <BarChart3 className="mx-auto text-slate-300" size={34} />
        <p className="mt-3 text-sm font-bold text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function DashboardCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={`panel overflow-hidden p-5 ${className}`}>
      <div className="mb-5">
        <h3 className="font-extrabold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function KpiCard({ label, value, hint, icon: Icon, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
    slate: "bg-slate-100 text-slate-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className="panel min-w-0 p-4">
      <div className="flex items-start gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tones[tone] || tones.brand}`}>
          <Icon size={21} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-500">{label}</p>
          <p className="mt-1 break-words text-2xl font-black text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-[11px] leading-5 text-slate-400">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

function RestrictedFinancialCard() {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div>
        <ShieldCheck className="mx-auto text-slate-400" size={38} />
        <h4 className="mt-3 font-extrabold text-slate-700">بيانات مالية محمية</h4>
        <p className="mt-2 max-w-md text-xs leading-6 text-slate-500">
          تحتاج إلى صلاحية عرض البيانات المالية لمشاهدة إجماليات الرواتب ومؤشراتها.
        </p>
      </div>
    </div>
  );
}

function Severity({ level }) {
  const styles = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-sky-50 text-sky-700",
  };
  const labels = { high: "مرتفع", medium: "متوسط", low: "منخفض" };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${styles[level]}`}>{labels[level]}</span>;
}

export default function HRExecutiveDashboard({
  employees = [],
  evaluations = [],
  settings = {},
  currentCompany,
  currentUser,
  can,
  setPage,
}) {
  const now = new Date();
  const companyId = clean(currentCompany?.company_id);
  const [filters, setFilters] = useState({
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, "0"),
    branch: "all",
    department: "all",
    status: "all",
  });
  const [branchRows, setBranchRows] = useState([]);
  const [records, setRecords] = useState({
    attendance: [],
    leaves: [],
    payroll: [],
    contracts: [],
    custodies: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadWarnings, setLoadWarnings] = useState([]);
  const selectedPeriod = `${filters.year}-${filters.month}`;

  const loadDashboardData = useCallback(async () => {
    if (!companyId) {
      setBranchRows([]);
      setRecords({ attendance: [], leaves: [], payroll: [], contracts: [], custodies: [] });
      setLoadWarnings(["لم يتم تحديد الشركة الحالية"]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const warnings = [];
    try {
      const [branchesResult, attendanceResult, leavesResult, payrollResult, contractsResult, custodiesResult] =
        await Promise.all([
          settingsBranchesService.loadBranches(companyId).catch((error) => {
            console.error("HR dashboard branches load error:", error);
            warnings.push("تعذر تحميل الفروع");
            return [];
          }),
          hrRecordsService.load("hr_attendance_payroll", companyId),
          hrRecordsService.load("hr_leaves", companyId),
          hrRecordsService.load("hr_salary", companyId),
          hrRecordsService.load("hr_contracts", companyId),
          hrRecordsService.load("hr_custodies", companyId),
        ]);
      setBranchRows(Array.isArray(branchesResult) ? branchesResult : []);
      const nextRecords = {
        attendance: attendanceResult?.rows || [],
        leaves: leavesResult?.rows || [],
        payroll: payrollResult?.rows || [],
        contracts: contractsResult?.rows || [],
        custodies: custodiesResult?.rows || [],
      };
      [
        ["الحضور", attendanceResult],
        ["الإجازات", leavesResult],
        ["الرواتب", payrollResult],
        ["العقود", contractsResult],
        ["العهد", custodiesResult],
      ].forEach(([label, result]) => {
        if (result?.warning) warnings.push(`بيانات ${label} غير متاحة حاليًا`);
      });
      setRecords(nextRecords);
      setLoadWarnings(unique(warnings));
    } catch (error) {
      console.error("HR executive dashboard load error:", error);
      setLoadWarnings([error.message || "تعذر تحميل بعض بيانات لوحة الموارد البشرية"]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const companyEmployees = useMemo(
    () => employees.filter((employee) => !companyId || !employee.company_id || clean(employee.company_id) === companyId),
    [employees, companyId],
  );

  const jobDefinitions = useMemo(
    () => (settings.jobDefinitions || settings.jobs || []).map((item) => (typeof item === "string" ? { name: item } : item)),
    [settings.jobDefinitions, settings.jobs],
  );
  const jobDepartmentMap = useMemo(
    () =>
      Object.fromEntries(
        jobDefinitions.map((job) => [
          clean(job.name || job.job_name || job.title),
          clean(job.department_name || job.department || job.departmentName),
        ]),
      ),
    [jobDefinitions],
  );
  const departments = useMemo(
    () =>
      unique([
        ...(settings.departments || []).map((item) =>
          typeof item === "string" ? item : item.name || item.department_name || item.label,
        ),
        ...companyEmployees.map((employee) => employeeDepartment(employee, jobDepartmentMap)),
      ]).filter((item) => item !== "غير محدد"),
    [settings.departments, companyEmployees, jobDepartmentMap],
  );
  const branches = useMemo(
    () =>
      unique([
        ...branchRows
          .filter((branch) => branch.is_active !== false && (!branch.status || branch.status === "نشط"))
          .map((branch) => branch.branch_name),
        ...companyEmployees.map((employee) => employee.branch),
      ]),
    [branchRows, companyEmployees],
  );
  const statuses = useMemo(() => unique(companyEmployees.map((employee) => employee.status || "نشط")), [companyEmployees]);

  const filteredEmployees = useMemo(
    () =>
      companyEmployees.filter((employee) => {
        if (filters.branch !== "all" && clean(employee.branch) !== filters.branch) return false;
        if (filters.department !== "all" && employeeDepartment(employee, jobDepartmentMap) !== filters.department) return false;
        if (filters.status !== "all" && clean(employee.status || "نشط") !== filters.status) return false;
        return true;
      }),
    [companyEmployees, filters.branch, filters.department, filters.status, jobDepartmentMap],
  );
  const filteredEmployeeIds = useMemo(() => new Set(filteredEmployees.map(employeeIdOf)), [filteredEmployees]);
  const matchesScope = useCallback(
    (row = {}) => {
      const employeeId = clean(row.employee_id || row.employeeId);
      if (employeeId) return filteredEmployeeIds.has(employeeId);
      if (filters.branch !== "all" && clean(row.branch) !== filters.branch) return false;
      const employeeName = clean(row.employee_name || row.name);
      if (employeeName) return filteredEmployees.some((employee) => clean(employee.name) === employeeName);
      return filters.branch === "all" && filters.department === "all" && filters.status === "all";
    },
    [filteredEmployeeIds, filteredEmployees, filters.branch, filters.department, filters.status],
  );

  const monthEvaluations = useMemo(
    () =>
      evaluations.filter(
        (evaluation) =>
          clean(evaluation.month).slice(0, 7) === selectedPeriod &&
          filteredEmployeeIds.has(evaluationEmployeeId(evaluation)) &&
          isApproved(evaluation),
      ),
    [evaluations, selectedPeriod, filteredEmployeeIds],
  );
  const latestEvaluationByEmployee = useMemo(() => {
    const map = new Map();
    monthEvaluations.forEach((evaluation) => {
      const id = evaluationEmployeeId(evaluation);
      const previous = map.get(id);
      if (!previous || clean(evaluation.updated_at || evaluation.created_at) >= clean(previous.updated_at || previous.created_at)) {
        map.set(id, evaluation);
      }
    });
    return map;
  }, [monthEvaluations]);
  const performanceRows = useMemo(
    () =>
      filteredEmployees
        .map((employee) => ({
          employee,
          evaluation: latestEvaluationByEmployee.get(employeeIdOf(employee)),
          total: evaluationTotal(latestEvaluationByEmployee.get(employeeIdOf(employee))),
        }))
        .filter((item) => item.evaluation)
        .sort((a, b) => b.total - a.total),
    [filteredEmployees, latestEvaluationByEmployee],
  );

  const activeEmployees = filteredEmployees.filter(isActiveEmployee);
  const inactiveEmployees = filteredEmployees.length - activeEmployees.length;
  const selectedMonthStart = new Date(Number(filters.year), Number(filters.month) - 1, 1);
  const nextMonthStart = new Date(Number(filters.year), Number(filters.month), 1);
  const previousMonthStart = new Date(Number(filters.year), Number(filters.month) - 2, 1);
  const hiresInRange = (start, end) =>
    filteredEmployees.filter((employee) => {
      const value = employee.hireDate || employee.hire_date;
      if (!value) return false;
      const date = new Date(`${clean(value).slice(0, 10)}T00:00:00`);
      return !Number.isNaN(date.getTime()) && date >= start && date < end;
    }).length;
  const newHires = hiresInRange(selectedMonthStart, nextMonthStart);
  const previousHires = hiresInRange(previousMonthStart, selectedMonthStart);
  const hiresDelta = newHires - previousHires;

  const today = new Date().toISOString().slice(0, 10);
  const attendanceForMonth = records.attendance.filter((row) => periodOf(row) === selectedPeriod && matchesScope(row));
  const todayAttendance = records.attendance.filter(
    (row) =>
      clean(row.attendance_date).slice(0, 10) === today &&
      matchesScope(row) &&
      !["غائب", "غياب", "absent"].includes(clean(row.status).toLowerCase()),
  );
  const pendingLeaves = records.leaves.filter(
    (row) => matchesScope(row) && ["قيد المراجعة", "قيد الانتظار", "pending"].includes(clean(row.status).toLowerCase()),
  );
  const activeLeaves = records.leaves.filter((row) => {
    if (!matchesScope(row)) return false;
    const start = clean(row.start_date).slice(0, 10);
    const end = clean(row.end_date).slice(0, 10);
    return start && end && start <= today && end >= today && isApproved(row);
  });
  const monthLeaveRows = records.leaves.filter((row) => periodOf(row) === selectedPeriod && matchesScope(row));

  const salaries = filteredEmployees.map((employee) => number(employee.salary)).filter((salary) => salary > 0);
  const salaryTotal = salaries.reduce((sum, salary) => sum + salary, 0);
  const performanceAverage = performanceRows.length
    ? performanceRows.reduce((sum, item) => sum + item.total, 0) / performanceRows.length
    : 0;
  const canViewFinancial =
    isPlatformAdminUser(currentUser) ||
    can?.("hr_salary", "can_view_financial") === true ||
    can?.("employees", "can_view_financial") === true;

  const branchChart = useMemo(
    () =>
      branches
        .map((name) => ({ name, value: filteredEmployees.filter((employee) => clean(employee.branch) === name).length }))
        .filter((item) => item.value > 0),
    [branches, filteredEmployees],
  );
  const departmentChart = useMemo(
    () =>
      unique(filteredEmployees.map((employee) => employeeDepartment(employee, jobDepartmentMap)))
        .map((name) => ({
          name,
          value: filteredEmployees.filter((employee) => employeeDepartment(employee, jobDepartmentMap) === name).length,
        }))
        .filter((item) => item.value > 0),
    [filteredEmployees, jobDepartmentMap],
  );
  const genderChart = useMemo(() => {
    const rows = filteredEmployees.filter((employee) => clean(employee.gender || employee.sex));
    return unique(rows.map((employee) => employee.gender || employee.sex)).map((name) => ({
      name,
      value: rows.filter((employee) => clean(employee.gender || employee.sex) === name).length,
    }));
  }, [filteredEmployees]);
  const statusChart = useMemo(
    () =>
      unique(filteredEmployees.map((employee) => employee.status || "نشط")).map((name) => ({
        name,
        value: filteredEmployees.filter((employee) => clean(employee.status || "نشط") === name).length,
      })),
    [filteredEmployees],
  );
  const attendanceTrend = useMemo(() => {
    const grouped = new Map();
    attendanceForMonth.forEach((row) => {
      const day = clean(row.attendance_date).slice(8, 10);
      if (!day) return;
      const current = grouped.get(day) || { day, حاضر: 0, متأخر: 0, غائب: 0 };
      const status = clean(row.status);
      if (status.includes("غ")) current["غائب"] += 1;
      else if (number(row.late_minutes) > 0 || status.includes("تأخ")) current["متأخر"] += 1;
      else current["حاضر"] += 1;
      grouped.set(day, current);
    });
    return [...grouped.values()].sort((a, b) => number(a.day) - number(b.day));
  }, [attendanceForMonth]);
  const totalLateMinutes = attendanceForMonth.reduce((sum, row) => sum + number(row.late_minutes), 0);
  const absenceCount = attendanceForMonth.filter((row) =>
    ["غائب", "غياب", "absent"].includes(clean(row.status).toLowerCase()),
  ).length;
  const attendanceRate = activeEmployees.length
    ? Math.min(100, (todayAttendance.length / activeEmployees.length) * 100)
    : 0;

  const performanceDistribution = useMemo(() => {
    const buckets = [
      ["ممتاز", 90, 101],
      ["جيد جدًا", 80, 90],
      ["جيد", 70, 80],
      ["مقبول", 60, 70],
      ["ضعيف", 0, 60],
    ];
    return buckets.map(([name, min, max]) => ({
      name,
      value: performanceRows.filter((item) => item.total >= min && item.total < max).length,
    }));
  }, [performanceRows]);

  const expiringContracts = records.contracts.filter((row) => {
    const end = new Date(`${clean(row.end_date).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(end.getTime())) return false;
    const remaining = (end.getTime() - Date.now()) / 86400000;
    return remaining >= 0 && remaining <= 30 && matchesScope(row);
  }).length;
  const overdueCustodies = records.custodies.filter(
    (row) =>
      matchesScope(row) &&
      clean(row.return_date) &&
      clean(row.return_date).slice(0, 10) < today &&
      !["مسترجعة", "معادة", "returned"].includes(clean(row.status).toLowerCase()),
  ).length;

  const alerts = [
    {
      label: "موظفون بدون فرع",
      count: filteredEmployees.filter((employee) => !clean(employee.branch)).length,
      severity: "high",
      page: "employees",
    },
    {
      label: "موظفون بدون قسم",
      count: filteredEmployees.filter((employee) => employeeDepartment(employee, jobDepartmentMap) === "غير محدد").length,
      severity: "medium",
      page: "hr_org_chart",
    },
    {
      label: "موظفون بدون مدير مباشر",
      count: filteredEmployees.filter((employee) => !clean(employee.manager)).length,
      severity: "medium",
      page: "hr_org_chart",
    },
    ...(canViewFinancial
      ? [
          {
            label: "موظفون بدون راتب مسجل",
            count: filteredEmployees.filter((employee) => number(employee.salary) <= 0).length,
            severity: "high",
            page: "employees",
          },
        ]
      : []),
    {
      label: "لم يتم تقييمهم في الفترة",
      count: Math.max(0, filteredEmployees.length - performanceRows.length),
      severity: "medium",
      page: "evaluations",
    },
    { label: "موظفون غير نشطين", count: inactiveEmployees, severity: "low", page: "employees" },
    { label: "عقود تنتهي خلال 30 يومًا", count: expiringContracts, severity: "high", page: "hr_contracts" },
    { label: "عهد متأخرة عن الإرجاع", count: overdueCustodies, severity: "medium", page: "hr_custodies" },
  ].filter((alert) => alert.count > 0);

  const quickActions = [
    ["إضافة موظف", "employees", UserPlus, "can_create"],
    ["الحضور والدوام", "discipline", CalendarCheck, "can_view"],
    ["طلب إجازة", "hr_leaves", CalendarDays, "can_create"],
    ["تقييم موظف", "evaluations", Gauge, "can_create"],
    ["مسير الرواتب", "hr_salary", Banknote, "can_view"],
    ["تقرير الموارد البشرية", "hr_reports", FileBarChart, "can_view"],
  ].filter(([_, page, __, action]) => can?.(page, action) !== false);

  const comparisonHint =
    hiresDelta === 0
      ? "دون تغير عن الشهر السابق"
      : hiresDelta > 0
        ? `أعلى بـ ${formatNumber(hiresDelta)} عن الشهر السابق`
        : `أقل بـ ${formatNumber(Math.abs(hiresDelta))} عن الشهر السابق`;

  return (
    <div className="space-y-5" dir="rtl">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-l from-slate-950 via-slate-900 to-brand-900 p-5 text-white shadow-lg md:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-xs font-bold text-red-200">{currentCompany?.company_name || "الشركة الحالية"}</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">لوحة الموارد البشرية</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              نظرة تنفيذية على الموظفين، الحضور، الرواتب، الأداء، والإجازات
            </p>
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:mr-auto xl:max-w-4xl xl:grid-cols-6">
            <select
              aria-label="السنة"
              value={filters.year}
              onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}
              className="field border-white/10 bg-white/10 text-white [color-scheme:dark]"
            >
              {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((year) => (
                <option key={year} value={year} className="text-slate-900">{year}</option>
              ))}
            </select>
            <select
              aria-label="الشهر"
              value={filters.month}
              onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))}
              className="field border-white/10 bg-white/10 text-white"
            >
              {monthNames.map((name, index) => (
                <option key={name} value={String(index + 1).padStart(2, "0")} className="text-slate-900">{name}</option>
              ))}
            </select>
            <select
              aria-label="الفرع"
              value={filters.branch}
              onChange={(event) => setFilters((current) => ({ ...current, branch: event.target.value }))}
              className="field border-white/10 bg-white/10 text-white"
            >
              <option value="all" className="text-slate-900">كل الفروع</option>
              {branches.map((branch) => <option key={branch} value={branch} className="text-slate-900">{branch}</option>)}
            </select>
            <select
              aria-label="القسم"
              value={filters.department}
              onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}
              className="field border-white/10 bg-white/10 text-white"
            >
              <option value="all" className="text-slate-900">كل الأقسام</option>
              {departments.map((department) => <option key={department} value={department} className="text-slate-900">{department}</option>)}
            </select>
            <select
              aria-label="الحالة"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="field border-white/10 bg-white/10 text-white"
            >
              <option value="all" className="text-slate-900">كل الحالات</option>
              {statuses.map((status) => <option key={status} value={status} className="text-slate-900">{status}</option>)}
            </select>
            <button type="button" onClick={loadDashboardData} disabled={loading} className="btn-primary justify-center !bg-white !text-slate-900">
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              تحديث
            </button>
          </div>
        </div>
      </div>

      {loadWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-800">
          بعض الأقسام تعرض حالة فارغة لأن مصادرها لم تُجهز بعد: {loadWarnings.join("، ")}.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <KpiCard label="إجمالي الموظفين" value={formatNumber(filteredEmployees.length)} hint={`${activeEmployees.length} نشط · ${inactiveEmployees} غير نشط`} icon={Users} />
        <KpiCard label="التعيينات الجديدة" value={formatNumber(newHires)} hint={comparisonHint} icon={UserPlus} tone={hiresDelta >= 0 ? "green" : "amber"} />
        <KpiCard label="الفروع" value={formatNumber(branches.length)} hint={`${departments.length} قسم مسجل`} icon={Building2} tone="blue" />
        <KpiCard label="الحضور اليوم" value={formatNumber(todayAttendance.length)} hint={records.attendance.length ? `${formatNumber(attendanceRate, 1)}% من النشطين` : "لا توجد سجلات حضور لليوم"} icon={UserCheck} tone="green" />
        <KpiCard label="الإجازات النشطة" value={formatNumber(activeLeaves.length)} hint={`${pendingLeaves.length} طلب قيد المراجعة`} icon={CalendarDays} tone="amber" />
        <KpiCard label="متوسط الأداء" value={performanceRows.length ? `${formatNumber(performanceAverage, 1)}%` : "—"} hint={`${performanceRows.length} موظف مقيم ومعتمد`} icon={Gauge} tone="brand" />
        <KpiCard label="غير المقيمين" value={formatNumber(Math.max(0, filteredEmployees.length - performanceRows.length))} hint={`للفترة ${selectedPeriod}`} icon={UserMinus} tone="slate" />
        <KpiCard label="طلبات الإجازة" value={formatNumber(monthLeaveRows.length)} hint={`خلال ${monthNames[number(filters.month) - 1]}`} icon={Clock3} tone="blue" />
        {canViewFinancial && (
          <>
            <KpiCard label="إجمالي الرواتب" value={formatNumber(salaryTotal)} hint={`${salaries.length} راتب مسجل`} icon={Wallet} tone="green" />
            <KpiCard label="متوسط الراتب" value={salaries.length ? formatNumber(salaryTotal / salaries.length) : "—"} hint={salaries.length ? `من ${formatNumber(Math.min(...salaries))} إلى ${formatNumber(Math.max(...salaries))}` : "لا توجد رواتب مسجلة"} icon={Banknote} tone="brand" />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardCard title="القوى العاملة حسب الفروع" subtitle="توزيع الموظفين ضمن نطاق الفلاتر">
          {branchChart.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={branchChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="الموظفون" fill="#7f1d1d" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </DashboardCard>
        <DashboardCard title="القوى العاملة حسب الأقسام" subtitle="الربط بين سجل الموظف وتعريف الوظيفة">
          {departmentChart.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={departmentChart} layout="vertical" margin={{ right: 10, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="الموظفون" fill="#991b1b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </DashboardCard>
        <DashboardCard title="التوزيع حسب النوع" subtitle="يعتمد على حقل النوع في السجل الوظيفي">
          {genderChart.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={genderChart} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95} paddingAngle={4}>
                  {genderChart.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart text="لا تتوفر بيانات النوع في سجلات الموظفين الحالية" />}
        </DashboardCard>
        <DashboardCard title="حالات الموظفين" subtitle="نشط، إجازة، موقوف، أو حالات أخرى">
          {statusChart.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                  {statusChart.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </DashboardCard>
      </div>

      <DashboardCard title="الحضور والانضباط" subtitle={`مؤشرات الفترة ${selectedPeriod}`}>
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard label="سجلات الحضور" value={formatNumber(attendanceForMonth.length)} icon={CalendarCheck} tone="green" />
          <KpiCard label="نسبة حضور اليوم" value={records.attendance.length ? `${formatNumber(attendanceRate, 1)}%` : "—"} icon={CheckCircle2} tone="blue" />
          <KpiCard label="دقائق التأخير" value={formatNumber(totalLateMinutes)} icon={Clock3} tone="amber" />
          <KpiCard label="حالات الغياب" value={formatNumber(absenceCount)} icon={UserMinus} tone="red" />
        </div>
        <div className="mt-5">
          {attendanceTrend.length ? (
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="حاضر" stroke="#15803d" strokeWidth={3} />
                <Line type="monotone" dataKey="متأخر" stroke="#d97706" strokeWidth={3} />
                <Line type="monotone" dataKey="غائب" stroke="#b91c1c" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart text="لا توجد سجلات حضور وانضباط للفترة المحددة" />}
        </div>
      </DashboardCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardCard title="الرواتب والمزايا" subtitle="ملخص مالي محمي بالصلاحيات">
          {canViewFinancial ? (
            salaries.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard label="إجمالي الرواتب الأساسية" value={formatNumber(salaryTotal)} icon={Wallet} tone="brand" />
                <KpiCard label="متوسط الراتب" value={formatNumber(salaryTotal / salaries.length)} icon={Banknote} tone="green" />
                <KpiCard label="أعلى راتب" value={formatNumber(Math.max(...salaries))} icon={TrendingUp} tone="blue" />
                <KpiCard label="أقل راتب" value={formatNumber(Math.min(...salaries))} icon={TrendingDown} tone="amber" />
              </div>
            ) : <EmptyChart text="لا توجد بيانات رواتب مسجلة للموظفين المحددين" />
          ) : <RestrictedFinancialCard />}
        </DashboardCard>
        <DashboardCard title="الإجازات والطلبات" subtitle="حالة الطلبات وأحدث الحركات">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-emerald-50 p-4"><b className="text-2xl text-emerald-700">{activeLeaves.length}</b><p className="mt-1 text-xs font-bold text-emerald-800">إجازات نشطة</p></div>
            <div className="rounded-2xl bg-amber-50 p-4"><b className="text-2xl text-amber-700">{pendingLeaves.length}</b><p className="mt-1 text-xs font-bold text-amber-800">قيد المراجعة</p></div>
            <div className="rounded-2xl bg-sky-50 p-4"><b className="text-2xl text-sky-700">{monthLeaveRows.length}</b><p className="mt-1 text-xs font-bold text-sky-800">طلبات الشهر</p></div>
          </div>
          {records.leaves.length ? (
            <div className="space-y-2">
              {[...records.leaves]
                .filter(matchesScope)
                .sort((a, b) => recordDate(b).localeCompare(recordDate(a)))
                .slice(0, 5)
                .map((row, index) => (
                  <div key={row.id || `${recordDate(row)}-${index}`} className="flex items-center gap-3 rounded-xl border p-3">
                    <CalendarDays className="text-brand-700" size={18} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{row.employee_name || "موظف غير محدد"}</p>
                      <p className="text-[11px] text-slate-500">{row.leave_type || "طلب إجازة"} · {row.start_date || recordDate(row) || "—"}</p>
                    </div>
                    <span className="mr-auto shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold">{row.status || "غير محدد"}</span>
                  </div>
                ))}
            </div>
          ) : <EmptyChart text="لا توجد طلبات إجازة متاحة" />}
        </DashboardCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <DashboardCard title="الأداء والتقييم" subtitle={`النتائج النهائية المعتمدة للفترة ${selectedPeriod}`}>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <KpiCard label="متوسط الأداء" value={performanceRows.length ? `${formatNumber(performanceAverage, 1)}%` : "—"} icon={Gauge} />
            <KpiCard label="تم تقييمهم" value={formatNumber(performanceRows.length)} icon={UserCheck} tone="green" />
            <KpiCard label="لم يتم تقييمهم" value={formatNumber(Math.max(0, filteredEmployees.length - performanceRows.length))} icon={UserMinus} tone="amber" />
          </div>
          {performanceRows.length ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={performanceDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="الموظفون" radius={[8, 8, 0, 0]}>
                  {performanceDistribution.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart text="لا توجد تقييمات نهائية معتمدة للفترة المحددة" />}
        </DashboardCard>
        <DashboardCard title="تنبيهات الموارد البشرية" subtitle="حالات تحتاج إلى استكمال أو متابعة">
          {alerts.length ? (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <button
                  key={alert.label}
                  type="button"
                  onClick={() => setPage?.(alert.page)}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-right transition hover:bg-slate-50"
                >
                  <AlertTriangle className={alert.severity === "high" ? "text-red-600" : alert.severity === "medium" ? "text-amber-600" : "text-sky-600"} size={18} />
                  <span className="min-w-0 flex-1 text-sm font-bold">{alert.label}</span>
                  <b className="text-lg">{alert.count}</b>
                  <Severity level={alert.severity} />
                </button>
              ))}
            </div>
          ) : (
            <div className="grid min-h-[240px] place-items-center text-center">
              <div><CheckCircle2 className="mx-auto text-emerald-600" size={38} /><p className="mt-3 font-extrabold text-slate-700">لا توجد تنبيهات حرجة ضمن النطاق الحالي</p></div>
            </div>
          )}
        </DashboardCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <DashboardCard title="أفضل الموظفين" subtitle="أعلى النتائج النهائية المعتمدة">
          {performanceRows.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>الترتيب</th><th>الموظف</th><th>الفرع</th><th>الوظيفة</th><th>النتيجة</th></tr></thead>
                <tbody>
                  {performanceRows.slice(0, 5).map((item, index) => (
                    <tr key={employeeIdOf(item.employee)}>
                      <td><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 font-black text-brand-700">{index + 1}</span></td>
                      <td className="font-bold">{item.employee.name}</td>
                      <td>{item.employee.branch || "غير محدد"}</td>
                      <td>{item.employee.job || "غير محدد"}</td>
                      <td className="font-black text-brand-700">{formatNumber(item.total, 1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyChart text="لا توجد تقييمات معتمدة لإظهار ترتيب الموظفين" />}
          {performanceRows.length > 5 && (
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              أقل خمس نتائج: {performanceRows.slice(-5).map((item) => `${item.employee.name} (${formatNumber(item.total, 1)}%)`).join("، ")}
            </div>
          )}
        </DashboardCard>
        <DashboardCard title="إجراءات سريعة" subtitle="اختصارات تظهر حسب صلاحيات المستخدم">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map(([label, page, Icon]) => (
              <button
                key={`${page}-${label}`}
                type="button"
                onClick={() => setPage?.(page)}
                className="flex min-h-20 items-center gap-3 rounded-2xl border bg-white p-4 text-right font-extrabold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-brand-700"><Icon size={20} /></span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          {!quickActions.length && <EmptyChart text="لا توجد إجراءات سريعة متاحة حسب الصلاحيات الحالية" />}
        </DashboardCard>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/20 backdrop-blur-[1px]">
          <div className="panel flex items-center gap-3 px-5 py-4 font-bold text-slate-700">
            <RefreshCw className="animate-spin text-brand-700" size={20} />
            جاري تحميل مؤشرات الموارد البشرية...
          </div>
        </div>
      )}
    </div>
  );
}
