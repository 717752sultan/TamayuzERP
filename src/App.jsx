import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BadgeCheck,
  Gauge,
  CalendarCheck,
  Gift,
  Trophy,
  TrendingUp,
  FileBarChart,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Plus,
  Download,
  Pencil,
  Trash2,
  ChevronLeft,
  Building2,
  UserCheck,
  Star,
  Wallet,
  AlertTriangle,
  Clock3,
  MoreHorizontal,
  Eye,
  Printer,
  FileSpreadsheet,
  Filter,
  Upload,
  ShieldCheck,
  BriefcaseBusiness,
  Save,
  MessageSquareWarning,
  ArrowUpLeft,
  Banknote,
  CircleDollarSign,
  UserRoundCog,
  UserPlus,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  branches,
  jobs,
  criteria,
  seedEmployees,
  seedEvaluations,
  navItems as baseNavItems,
} from "./data";
import { employeesService, normalizeEmployeeForDb } from "./services/employees";
import { evaluationsService } from "./services/evaluations";
import { settingsService } from "./services/settings";
import { loginWithSupabase as cloudLoginWithSupabase } from "./services/auth";
import { supabase } from "./services/supabase";
import { guaranteesService } from "./services/guarantees";
import { overtimeService } from "./services/overtime";
import { buildMessageTitle, copyTextToClipboard, generateOvertimeWhatsAppMessage, loadOvertimeEmployeesByDate } from "./services/overtimeMessage";
import { reportRowsForExport, rowsToReportHtml } from "./services/reports";
import { adminService, defaultInventoryPermissions, permissionPages, systemRoles } from "./services/admin";
import { approvalService, approvalStatuses } from "./services/workflow";
import { notificationsService } from "./services/notifications";
import { auditService } from "./services/audit";
import { shiftsService, shiftPeriods, calculateShiftHours } from "./services/shifts";
import { shiftScenariosService, scenarioTypes } from "./services/shiftScenarios";
import { shiftAssignmentsService, shiftAssignmentStatuses } from "./services/shiftAssignments";
import { inventoryService, inventoryCategories, inventoryUnits, inventoryCurrencies, getInventoryCurrency, calculateInventoryLineTotal } from "./services/inventory";
import { inventoryDocumentsService, inventoryDocumentConfigs } from "./services/inventoryDocuments";
import { calculateInventoryDashboardTotals, generateInventoryReports, inventoryRowsForExport } from "./services/inventoryReports";
import { generateBranchForecast } from "./services/inventoryForecast";
import { canInventory } from "./services/inventoryPermissions";
import { inventorySettingsService, defaultInventorySettings, defaultDocumentNumbering } from "./services/inventorySettings";
import { dailyOperationsService, operationTypes, serviceChannels, operationStatuses } from "./services/dailyOperations";
import { downloadDailyOperationsTemplate, downloadProductivityTemplate, exportDailyOperationsToExcel, exportProductivityOperationsToExcel, importDailyOperationsRows, parseDailyOperationsExcel, validateDailyOperationsRows } from "./services/dailyOperationsImportExport";
import { performanceCriteriaService, scoringTypes, defaultJobKpis } from "./services/performanceCriteria";
import { kpiCalculationService } from "./services/kpiCalculation";
import { aiAssistantService } from "./services/aiAssistant";
import { settingsBranchesService } from "./services/settingsBranches";
import { settingsCurrenciesService } from "./services/settingsCurrencies";
import { settingsUsersService } from "./services/settingsUsers";
import { systemSettingsService } from "./services/systemSettings";
import { hrRecordsService } from "./services/hrRecords";
import { treePermissionsService, permissionActions, dataScopes, departmentOptions, flattenPermissionTree, normalizeTreePermission } from "./services/treePermissions";
import { recruitmentService, recruitmentTabs, generateWelcomeMessage } from "./services/recruitment";
import { generateRecruitmentReports } from "./services/recruitmentReports";
import { backupService } from "./services/backup";
import { companiesService } from "./services/companies";
import { companyPermissionActions, companyPermissionModules, companyPermissionsService, companyCanAccessFromRows, mergeWithDefaultCompanyPermissions } from "./services/companyPermissions";
import { applyCompanyTheme, applyThemeForCurrentCompany, getDefaultTheme, normalizeThemePayload, themePresets, themeService } from "./services/theme";
import { clearTenantSession, getCurrentCompany, getCurrentUser, isProtectedPlatformRole, isProtectedPlatformUser, loadTenantSession, platformSuperAdminRole, setTenantSession } from "./services/tenant";
import { assistantModes, pageRegistryByKey } from "./constants/pageRegistry";
import { APP_BRAND_NAME, APP_DESCRIPTION, APP_OFFICIAL_NAME, APP_REPORT_SUBTITLE, APP_REPORT_TITLE, APP_SHORT_NAME, APP_SYSTEM_NAME, APP_TAGLINE } from "./constants/branding";
import { buildReportBrandingHtml } from "./services/reportBranding";
import { ERP_MODULES, ERP_PAGE_BY_KEY, ERP_PAGE_BY_ROUTE, buildGroupedNavigation, getModuleForPage, getModulePages, isPlaceholderPage } from "./constants/moduleRegistry";
import HRFoundationPage from "./components/hr/HRFoundationPage";
import SystemSettingsPage from "./components/settings/SystemSettingsPage";
import GroupedSidebarNav from "./components/navigation/GroupedSidebarNav";
const icons = {
  dashboard: LayoutDashboard,
  employees: Users,
  templates: ClipboardList,
  evaluations: BadgeCheck,
  productivity: Gauge,
  discipline: CalendarCheck,
  incentives: Gift,
  top: Trophy,
  plans: TrendingUp,
  reports: FileBarChart,
  settings: Settings,
  guarantees: ShieldCheck,
  overtime: Clock3,
  shifts: CalendarCheck,
  inventory: Wallet,
  daily_operations: Gauge,
  performance_criteria: ClipboardList,
  performance_kpi_scores: Star,
  users_permissions: UserRoundCog,
  recruitment: UserPlus,
  reports_center: FileBarChart,
  audit_logs: ClipboardList,
  companies_admin: Building2,
  hr_home: LayoutDashboard,
  hr_employees_full: Users,
  hr_reports_full: FileBarChart,
  hr_requests: ClipboardList,
  hr_performance_full: BadgeCheck,
  hr_incentives_full: Gift,
  hr_attendance_payroll: Clock3,
  hr_salary: Wallet,
  hr_disciplinary: AlertTriangle,
  hr_recruitment_full: UserPlus,
  hr_leaves: CalendarCheck,
  hr_complaints: MessageSquareWarning,
  hr_circulars: ClipboardList,
  hr_termination: LogOut,
  hr_surveys: ClipboardList,
  hr_insurance: ShieldCheck,
  hr_announcements: Bell,
  hr_files: FileSpreadsheet,
  hr_contracts: ClipboardList,
  hr_custodies: Wallet,
  hr_training: Star,
  hr_reports: FileBarChart,
  hr_settings: Settings,
  system_settings: Settings,
  hr_requests_approvals: ClipboardList,
  hr_approvals: BadgeCheck,
  hr_org_chart: Building2,
  hr_settings_full: Settings,
  hr_financial_setup: CircleDollarSign,
  hr_templates_full: ClipboardList,
};
const fullHrNavItems = [
  ["hr_home", "لوحة الموارد البشرية"],
  ["employees", "قائمة الموظفين"],
  ["hr_org_chart", "الهيكل التنظيمي"],
  ["hr_settings", "إعدادات الموارد البشرية"],
  ["users_permissions", "المستخدمون والصلاحيات"],
  ["hr_contracts", "العقود"],
  ["hr_files", "ملفات الموظفين"],
  ["guarantees", "الضمانات"],
  ["hr_custodies", "العهد"],
  ["daily_operations", "العمليات اليومية"],
  ["discipline", "الحضور والانصراف"],
  ["shifts", "الشفتات"],
  ["overtime", "العمل الإضافي"],
  ["hr_leaves", "الإجازات"],
  ["hr_requests_approvals", "الطلبات والموافقات"],
  ["hr_salary", "الرواتب"],
  ["templates", "نماذج التقييم"],
  ["performance_criteria", "معايير الأداء"],
  ["evaluations", "التقييم"],
  ["performance_kpi_scores", "درجات KPI"],
  ["productivity", "الإنتاجية"],
  ["incentives", "الحوافز"],
  ["top", "موظف الشهر"],
  ["plans", "خطط التحسين"],
  ["recruitment", "التوظيف"],
  ["hr_training", "التدريب"],
  ["hr_disciplinary", "المخالفات والإنذارات"],
  ["hr_circulars", "التعاميم"],
  ["hr_complaints", "الشكاوى"],
  ["hr_termination", "إنهاء الخدمة"],
  ["hr_reports", "تقارير الموارد البشرية"],
];
const genericHrPageKeys = new Set(["hr_leaves", "hr_salary", "hr_requests_approvals", "hr_disciplinary", "hr_termination", "hr_files", "hr_contracts", "hr_custodies", "hr_performance_full", "hr_training", "hr_circulars", "hr_complaints", "hr_reports"]);
const canonicalHrPageAliases = {
  hr_employees_full: "employees",
  hr_reports_full: "hr_reports",
  reports: "hr_reports",
  reports_center: "hr_reports",
  hr_requests: "hr_requests_approvals",
  hr_approvals: "hr_requests_approvals",
  hr_settings_full: "hr_settings",
  settings: "hr_settings",
  hr_financial_setup: "hr_settings",
  hr_templates_full: "hr_settings",
  hr_attendance_payroll: "discipline",
  hr_recruitment_full: "recruitment",
  hr_incentives_full: "incentives",
};
const navItems = [
  ["companies_admin", "إدارة الشركات"],
  ["system_settings", "الإعدادات العامة"],
  ...baseNavItems.slice(0, -2),
  ["guarantees", "ضمانات الموظفين"],
  ["overtime", "العمل الإضافي"],
  ["shifts", "شفتات الموظفين"],
  ["inventory", "إدارة المخزون"],
  ["daily_operations", "العمليات اليومية"],
  ["performance_criteria", "معايير الأداء"],
  ["performance_kpi_scores", "درجات KPI"],
  ["users_permissions", "المستخدمون والصلاحيات"],
  ["recruitment", "طلبات التوظيف"],
  ["reports_center", "مركز التقارير"],
  ["audit_logs", "سجل العمليات"],
  ...fullHrNavItems,
  ...baseNavItems.slice(-2),
];
const nf = new Intl.NumberFormat("ar-SA"),
  money = (n) => `${nf.format(Math.round(n || 0))} ر.س`,
  classify = (n) =>
    n >= 90
      ? "ممتاز"
      : n >= 80
        ? "جيد جدًا"
        : n >= 70
          ? "جيد"
          : n >= 60
            ? "مقبول"
            : "ضعيف";
const weights = [15, 15, 10, 10, 10, 10, 10, 10, 5, 5];
const defaultSettings = {
  branches: [...branches],
  jobs: [...jobs],
  criteria: [...criteria],
  currencies: [
    "الريال السعودي (SAR)",
    "الدولار الأمريكي (USD)",
    "اليورو (EUR)",
    "الدرهم الإماراتي (AED)",
  ],
  permissions: [
    { name: "مدير النظام", description: "تحكم كامل في جميع أجزاء النظام" },
    { name: "الموارد البشرية", description: "إدارة الموظفين والتقييمات والتقارير" },
    { name: "مدير الفرع", description: "تقييم موظفي الفرع ومتابعة الانضباط" },
    { name: "الموظف", description: "عرض التقييم وتقديم الاعتراض" },
    { name: "الإدارة العليا", description: "عرض التقارير واعتماد الحوافز" },
  ],
  users: [
    { name: "سلطان الشجني", username: "admin", password: "", role: "مدير عام النظام", employeeId: "" },
    { name: "أحمد محمد السالم", username: "employee", password: "", role: "الموظف", employeeId: "EMP-001" },
  ],
  manager: { name: "سلطان الشجني", username: "admin", role: "مدير عام النظام" },
};
const colors = {
  "ممتاز": "bg-emerald-50 text-emerald-700",
  "جيد جدًا": "bg-blue-50 text-blue-700",
  "جيد": "bg-sky-50 text-sky-700",
  "مقبول": "bg-amber-50 text-amber-700",
  "ضعيف": "bg-red-50 text-red-700",
  "نشط": "bg-emerald-50 text-emerald-700",
  "إجازة": "bg-amber-50 text-emerald-700",
  "موقوف": "bg-red-50 text-red-700",
  "معتمد": "bg-emerald-50 text-emerald-700",
  "قيد المراجعة": "bg-amber-50 text-amber-700",
  "مرفوض": "bg-red-50 text-red-700",
};
const Status = ({ children }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${colors[children] || "bg-slate-100 text-slate-600"}`}
  >
    {children}
  </span>
);
const changedRows = (prev, next) =>
  next.filter((item) => {
    const old = prev.find((row) => row.id === item.id);
    return !old || JSON.stringify(old) !== JSON.stringify(item);
  });
const deletedIds = (prev, next) =>
  prev.filter((item) => !next.some((row) => row.id === item.id)).map((item) => item.id);
const defaultWeightsFor = (count) => {
  if (count === 10) return [15, 15, 10, 10, 10, 10, 10, 10, 5, 5];
  const base = Math.floor(100 / Math.max(count, 1));
  const rest = 100 - base * Math.max(count, 1);
  return Array.from({ length: count }, (_, i) => base + (i < rest ? 1 : 0));
};
const makeCriteriaTemplate = (names = criteria) => {
  const ws = defaultWeightsFor(names.length);
  return names.map((name, i) => ({ name, weight: ws[i] || 0 }));
};
const includesAny = (value = "", words = []) =>
  words.some((word) => String(value || "").includes(word));
const isCashDenominationCriterion = (name = "") =>
  includesAny(name, [
    "فئة 200",
    "فئة 500",
    "فئة 1000",
    "200",
    "500",
    "1000",
  ]);
const isBehavioralCriterion = (name = "") =>
  includesAny(name, [
    "الانضباط",
    "الالتزام",
    "السلوك",
    "التعاون",
    "الحضور",
    "الدوام",
    "تحمل ضغط العمل",
  ]);
const detectCriterionTypeByName = (name = "") => {
  const value = String(name || "").trim();
  if (isCashDenominationCriterion(value)) return "cash_counting";
  if (isBehavioralCriterion(value)) return "behavioral";
  if (includesAny(value, ["رضا العملاء", "الشكاوى", "جودة خدمة", "جودة الرد", "جودة التواصل"])) return "service_quality";
  if (includesAny(value, ["مبلغ", "مبالغ", "مالي", "إجمالي المبالغ"])) return "financial";
  return "operational";
};
const applyCriterionTypeAndCashWeights = (item = {}) => {
  const name = String(item?.name || item?.criterion_name || item?.title || "");
  const criterionType = item?.criterion_type || detectCriterionTypeByName(name);
  const next = { ...item, criterion_type: criterionType };
  if (criterionType === "cash_counting" && isCashDenominationCriterion(name)) {
    next.subWeights = {
      cash200: name.includes("200") ? Number(item.weight || 0) : 0,
      cash500: name.includes("500") ? Number(item.weight || 0) : 0,
      cash1000: name.includes("1000") ? Number(item.weight || 0) : 0,
    };
  } else {
    delete next.subWeights;
  }
  return next;
};
const cashSubWeightsHtml = (criterion = {}) =>
  detectCriterionTypeByName(criterion.name || criterion.criterion_name) === "cash_counting" &&
  isCashDenominationCriterion(criterion.name || criterion.criterion_name) &&
  criterion.subWeights
    ? ` <small>200: ${criterion.subWeights.cash200 || 0}% - 500: ${criterion.subWeights.cash500 || 0}% - 1000: ${criterion.subWeights.cash1000 || 0}%</small>`
    : "";
const defaultCriteriaForJob = (job = "") => {
  const isCounter = includesAny(job, ["عداد", "عداد ومراسلات"]);
  const isTech = includesAny(job, ["دعم فني"]);
  const isCustomer = includesAny(job, ["خدمة عملاء"]);
  const isOutbound = includesAny(job, ["صادر"]);
  const isInbound = includesAny(job, ["وارد"]);
  const names = isCounter
    ? [
        "إجمالي المبالغ المعدودة",
        "إنتاجية فئة 200",
        "إنتاجية فئة 500",
        "إنتاجية فئة 1000",
        "دقة فرز النقد",
        "كشف العملات التالفة أو المشبوهة",
        "سرعة التسليم والاستلام",
        "الالتزام بإجراءات الخزينة",
        "تصفير العهدة دون فروقات",
        "الانضباط الوظيفي",
      ]
    : isTech
      ? [
          "سرعة إغلاق البلاغات",
          "جودة الحلول الفنية",
          "استقرار الأنظمة والأجهزة",
          "توثيق البلاغات",
          "دعم الفروع عن بعد",
          "الالتزام بأولوية البلاغات",
          "حماية البيانات",
          "حل المشكلات المتكررة",
          "التعاون مع الفريق",
          "الانضباط الوظيفي",
        ]
      : isCustomer && isOutbound
        ? [
            "سرعة تنفيذ الحوالات الصادرة",
            "دقة بيانات المستفيد",
            "الالتزام بحدود وإجراءات التحويل",
            "جودة التواصل مع العميل",
            "نسبة إنجاز طلبات الصادر",
            "خفض أخطاء الإرسال",
            "الالتزام بإجراءات الامتثال",
            "التعاون مع الفريق",
            "تحمل ضغط العمل",
            "الانضباط الوظيفي",
          ]
        : isCustomer && isInbound
          ? [
              "سرعة معالجة الحوالات الواردة",
              "دقة مطابقة بيانات المستلم",
              "جودة خدمة العميل عند الصرف",
              "نسبة إنجاز طلبات الوارد",
              "خفض شكاوى العملاء",
              "الالتزام بإجراءات التحقق",
              "الالتزام بإجراءات الامتثال",
              "التعاون مع الفريق",
              "تحمل ضغط العمل",
              "الانضباط الوظيفي",
            ]
          : isCustomer
            ? [
                "جودة الرد على العملاء",
                "سرعة تنفيذ الحوالات",
                "دقة بيانات العميل",
                "معالجة طلبات الواتس",
                "نسبة رضا العملاء",
                "الالتزام بإجراءات الامتثال",
                "خفض الشكاوى",
                "التعاون مع الفريق",
                "تحمل ضغط العمل",
                "الانضباط الوظيفي",
              ]
            : criteria;
  return makeCriteriaTemplate(names).map(applyCriterionTypeAndCashWeights);
};
const buildDefaultJobCriteria = () =>
  Object.fromEntries(
    jobs.map((job) => {
      const custom = job.includes("عداد")
        ? ["إجمالي المبالغ المعدودة", "دقة فرز فئة 200", "دقة فرز فئة 500", "دقة فرز فئة 1000", "كشف العملات التالفة أو المشبوهة", "سرعة التسليم والاستلام", "الالتزام بإجراءات الخزينة", "الانضباط الوظيفي", "التعاون مع الفريق", "تصفير العهدة دون فروقات"]
        : job.includes("دعم فني")
          ? ["سرعة إغلاق البلاغات", "جودة الحلول الفنية", "استقرار الأنظمة والأجهزة", "توثيق البلاغات", "دعم الفروع عن بعد", "الالتزام بأولوية البلاغات", "حماية البيانات", "التعاون مع الفريق", "حل المشكلات المتكررة", "الانضباط الوظيفي"]
          : job.includes("خدمة عملاء")
            ? ["جودة الرد على العملاء", "سرعة تنفيذ الحوالات", "دقة بيانات العميل", "معالجة طلبات الواتس", "نسبة رضا العملاء", "الالتزام بإجراءات الامتثال", "خفض الشكاوى", "التعاون مع الفريق", "تحمل ضغط العمل", "الانضباط الوظيفي"]
            : criteria;
      return [job, makeCriteriaTemplate(custom).map(applyCriterionTypeAndCashWeights)];
    }),
  );
const getJobCriteria = (settings, job) => {
  const saved = settings?.jobCriteria?.[job];
  if (Array.isArray(saved) && saved.length) return saved;
  return defaultCriteriaForJob(job);
};
const normalizeScores = (scores, count, fill = 4) =>
  Array.from({ length: count }, (_, i) => Number(scores?.[i] || fill));
const scoreTotal = (scores, model) =>
  Math.round(
    model.reduce((sum, item, i) => sum + (Number(scores[i] || 0) * Number(item.weight || 0)) / 5, 0),
  );
const effectiveEvaluationTotal = (ev) =>
  Array.isArray(ev?.criteriaSnapshot) && Array.isArray(ev?.scores)
    ? scoreTotal(normalizeScores(ev.scores, ev.criteriaSnapshot.length, 0), ev.criteriaSnapshot)
    : Number(ev?.total || 0);
const defaultProductivityIndicators = [
  { key: "receive", label: "عدد عمليات قبض الحوالات", type: "positive", weight: 0.2 },
  { key: "pay", label: "عدد عمليات صرف الحوالات", type: "positive", weight: 0.2 },
  { key: "sell", label: "عدد عمليات بيع العملات", type: "positive", weight: 0.25 },
  { key: "buy", label: "عدد عمليات شراء العملات", type: "positive", weight: 0.25 },
  { key: "errors", label: "عدد الأخطاء", type: "negative", weight: 4 },
  { key: "complaints", label: "عدد شكاوى العملاء", type: "negative", weight: 5 },
  { key: "time", label: "متوسط وقت الخدمة", type: "negative", weight: 1 },
];
const defaultDisciplineIndicators = [
  { key: "present", label: "أيام الحضور", type: "positive", weight: 1 },
  { key: "absent", label: "أيام الغياب", type: "negative", weight: 7 },
  { key: "late", label: "التأخير بالدقائق", type: "negative", weight: 0.15 },
  { key: "early", label: "الانصراف المبكر", type: "negative", weight: 3 },
  { key: "violations", label: "المخالفات", type: "negative", weight: 8 },
  { key: "penalties", label: "الجزاءات", type: "negative", weight: 10 },
];
const scoreIndicators = (values, indicators, base = 0) =>
  Math.max(
    0,
    Math.min(
      100,
      Math.round(
        indicators.reduce(
          (sum, item) =>
            item.type === "negative"
              ? sum - Number(values[item.key] || 0) * Number(item.weight || 0)
              : sum + Number(values[item.key] || 0) * Number(item.weight || 0),
          base,
        ),
      ),
    ),
  );
const initialIndicatorValues = (indicators) =>
  Object.fromEntries(indicators.map((item) => [item.key, 0]));
const updateJobCriteria = (settings, setSettings, job, model) =>
  setSettings({
    ...settings,
    jobCriteria: { ...(settings.jobCriteria || {}), [job]: model },
  });
defaultSettings.jobCriteria = buildDefaultJobCriteria();
const hydrateSettings = (value) => {
  const merged = {
    ...defaultSettings,
    ...(value || {}),
    manager: { ...defaultSettings.manager, ...((value || {}).manager || {}) },
    jobCriteria: {
      ...defaultSettings.jobCriteria,
      ...((value || {}).jobCriteria || {}),
    },
  };
  if (!Array.isArray(merged.branches) || !merged.branches.length)
    merged.branches = [...defaultSettings.branches];
  if (!Array.isArray(merged.jobs) || !merged.jobs.length)
    merged.jobs = [...defaultSettings.jobs];
  if (!Array.isArray(merged.criteria) || !merged.criteria.length)
    merged.criteria = [...defaultSettings.criteria];
  if (!Array.isArray(merged.permissions) || !merged.permissions.length)
    merged.permissions = [...defaultSettings.permissions];
  if (!Array.isArray(merged.users) || !merged.users.length)
    merged.users = [...defaultSettings.users];
  if (!Array.isArray(merged.currencies) || !merged.currencies.length)
    merged.currencies = [...defaultSettings.currencies];
  return merged;
};
const printDocument = (title, body) => {
  const activeEvaluationReport =
    typeof window !== "undefined" ? window.__activeEvaluationReport : null;
  if (activeEvaluationReport && String(title).includes("موظف")) {
    title = activeEvaluationReport.title;
    body = activeEvaluationReport.body;
  }
  const currentPrintCompany = getCurrentCompany() || {};
  const reportBranding = buildReportBrandingHtml({ title, currentCompany: currentPrintCompany });
  const w = window.open("", "_blank", "width=950,height=700");
  if (!w) return window.print();
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" />
    <title>${title}</title>
    <style>
      :root{--company-report-header:${getComputedStyle(document.documentElement).getPropertyValue("--company-report-header") || "#8b1e1e"}}
      body{font-family:Tahoma,Arial,sans-serif;margin:32px;color:#172033;direction:rtl}
      h1,h2,h3{margin:0 0 12px}
      h1{border-right:8px solid var(--company-report-header);padding:10px 14px;background:#f8fafc}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
      th,td{border:1px solid #d7dce3;padding:9px;text-align:right}
      th{background:#f3f4f6}
      .report-branding-header{display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:18px;align-items:center;margin-bottom:24px;border-bottom:2px solid #e5e7eb;padding-bottom:16px}
      .report-branding-side{display:flex;align-items:center;gap:12px}
      .report-branding-company{justify-content:flex-end;text-align:left}
      .report-branding-title{text-align:center}
      .report-branding-title h1{border:0;background:transparent;padding:0;color:#111827;font-size:24px}
      .report-branding-title p,.report-branding-side p{margin:3px 0;color:#64748b;font-size:12px}
      .report-branding-side h2{margin:0;color:var(--accent,#8b1e3f);font-size:15px}
      .report-logo{width:58px;height:58px;object-fit:contain;border:1px solid #e5e7eb;border-radius:16px;background:#fff}
      .report-logo-fallback{display:grid;place-items:center;padding:6px;text-align:center;font-size:10px;font-weight:800;color:#64748b;background:#f8fafc}
      .report-warning{max-width:230px;color:#b45309!important}
      .report-footer{margin-top:34px;border-top:1px solid #e5e7eb;padding-top:10px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;color:#64748b;font-size:11px}
      .cert{min-height:520px;border:10px double #8a1538;border-radius:28px;padding:42px;text-align:center}
      .brand{color:#8a1538}.muted{color:#64748b}.big{font-size:34px;font-weight:900}
      @media print{button{display:none}.report-footer{position:fixed;bottom:0;left:32px;right:32px;background:#fff}.report-branding-header{break-inside:avoid}body{padding-bottom:72px}}
    </style></head><body>${reportBranding.header}${body}${reportBranding.footer}<script>window.onload=()=>{window.print();}</script></body></html>`);
  w.document.close();
};
function syncSettings(s) {
  if (!s) return;
  branches.splice(
    0,
    branches.length,
    ...(s.branches || defaultSettings.branches),
  );
  jobs.splice(0, jobs.length, ...(s.jobs || defaultSettings.jobs));
  criteria.splice(
    0,
    criteria.length,
    ...(s.criteria || defaultSettings.criteria),
  );
  const base = [15, 15, 10, 10, 10, 10, 10, 10, 5, 5];
  weights.splice(
    0,
    weights.length,
    ...(criteria.length === 10
      ? base
      : Array.from({ length: criteria.length }, (_, i) => {
          const q = Math.floor(100 / criteria.length),
            r = 100 - q * criteria.length;
          return q + (i < r ? 1 : 0);
        })),
  );
}
function LoadingScreen({ message = "جاري تحميل البيانات..." }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50" dir="rtl">
      <div className="panel p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-700" />
        <b>{message}</b>
      </div>
    </div>
  );
}
class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Page render error:", error, info);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="grid min-h-[60vh] place-items-center p-5" dir="rtl">
        <div className="panel max-w-xl p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-600" size={42} />
          <h2 className="text-xl font-extrabold">حدث خطأ أثناء تحميل الصفحة</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            يرجى تحديث الصفحة أو التواصل مع مدير النظام.
          </p>
          <button type="button" onClick={this.props.onBack} className="btn-primary mt-5">
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>
    );
  }
}
const isAdminLikeRole = (role = "") =>
  ["مدير النظام", "مدير عام النظام", "الإدارة العليا"].some((x) => String(role).includes(x));
const isSystemAdministratorRole = (role = "") =>
  ["مدير النظام", "مدير عام النظام", "مشرف النظام العام"].includes(String(role || "").trim());
const canByPermission = (permissions, role, pageKey, action = "can_view") => {
  if (isAdminLikeRole(role)) return true;
  if (!permissions?.length) return false;
  const row = permissions.find((p) => p.role === role && p.page_key === pageKey);
  return row ? row[action] === true : false;
};
const dashboardPermissionNodes = ["dashboard_main", "dashboard_hr", "dashboard_inventory", "dashboard_performance", "dashboard_daily_operations", "dashboard_branches", "dashboard_financial"];
const permissionNodeGroups = {
  dashboard: dashboardPermissionNodes,
  inventory: ["inventory_dashboard", "inventory_items", "inventory_suppliers", "inventory_purchase_requests", "inventory_purchase_orders", "inventory_receipts", "inventory_invoices", "inventory_issue_vouchers", "inventory_returns", "inventory_transfers", "inventory_adjustments", "inventory_stocktakes", "inventory_balances", "inventory_movements", "inventory_forecast", "inventory_reports", "inventory_settings"],
  users_permissions: ["users_list", "roles", "permissions_matrix", "permission_templates", "user_activity", "system_users", "system_roles", "system_permissions"],
  recruitment: ["recruitment_job_postings", "recruitment_applications", "recruitment_candidate_evaluations", "recruitment_offer_templates", "recruitment_job_offers", "recruitment_contracts", "recruitment_manpower_plans", "recruitment_tests", "recruitment_probation_employees", "recruitment_welcome_messages", "recruitment_reports", "recruitment_settings"],
  settings: ["settings_branches", "settings_currencies", "settings_jobs", "settings_evaluations", "settings_incentives", "system_backup"],
  employees: ["employees_list", "employee_profile", "guarantees"],
  reports: ["reports_center", "reports_financial"],
  reports_center: ["reports_center"],
  shifts: ["shift_types", "shift_assignments", "shift_conflicts"],
  daily_operations: ["daily_operations_entry", "daily_operations_approval", "daily_operations_reports"],
  performance_criteria: ["performance_criteria"],
  evaluations: ["evaluations"],
  templates: ["templates"],
  incentives: ["incentives_calculation", "incentives_approval"],
  audit_logs: ["audit_logs"],
  ai_assistant: ["ai_chat", "ai_reports_analysis", "ai_navigation", "ai_report_generator", "ai_plan_generator", "ai_hr_letters", "ai_inventory_analysis", "ai_performance_analysis"],
};
const hasTreePermission = (rows, role, nodeKey, action = "can_view") => {
  if (isAdminLikeRole(role)) return true;
  const row = rows?.find((p) => p.role_name === role && p.node_key === nodeKey);
  return row ? row[action] === true : false;
};
const hasAnyPermission = (rows, role, nodeKeys = [], action = "can_view") =>
  isAdminLikeRole(role) || nodeKeys.some((key) => hasTreePermission(rows, role, key, action));
const pageAllowedByTree = (rows, role, pageKey, action = "can_view") => {
  const nodes = permissionNodeGroups[pageKey] || [pageKey];
  return hasAnyPermission(rows, role, nodes, action);
};
const getFirstAllowedPageForUser = (currentUser, treeRows = [], legacyRows = [], items = navItems) => {
  const roleName = currentUser?.role || "";
  const order = ["dashboard", "inventory", "users_permissions", "employees", "recruitment", "reports_center", ...items.map(([id]) => id)];
  const allowed = [...new Set(order)].find((id) =>
    pageAllowedByTree(treeRows, roleName, id, "can_view") || canByPermission(legacyRows, roleName, id === "reports_center" ? "reports_center" : id, "can_view")
  );
  return allowed || "";
};
export default function App() {
  const restoredTenant = loadTenantSession();
  const [logged, setLogged] = useState(
      () => localStorage.getItem("ep_logged") === "1",
    ),
    [page, setPage] = useState("dashboard"),
    [activeModuleKey, setActiveModuleKey] = useState("hr"),
    [sidebar, setSidebar] = useState(false),
    [role, setRole] = useState(
      () => localStorage.getItem("ep_role") || "مدير النظام",
    ),
    [employees, setEmployeesState] = useState([]),
    [evaluations, setEvaluationsState] = useState([]),
    [settings, setSettingsState] = useState(hydrateSettings(defaultSettings)),
	    [dataLoading, setDataLoading] = useState(false),
	    [dataError, setDataError] = useState(""),
	    [appPermissions, setAppPermissions] = useState([]),
	    [treeRolePermissions, setTreeRolePermissions] = useState([]),
	    [permissionsLoading, setPermissionsLoading] = useState(false),
	    [notifications, setNotifications] = useState([]),
	    [notificationsOpen, setNotificationsOpen] = useState(false),
      [companies, setCompanies] = useState([]),
      [companyPermissions, setCompanyPermissions] = useState([]),
      [companyPermissionsLoading, setCompanyPermissionsLoading] = useState(false),
      [currentCompany, setCurrentCompany] = useState(restoredTenant.currentCompany || null),
      [currentUserState, setCurrentUserState] = useState(restoredTenant.currentUser || null);
  const setEmployees = (updater) =>
    setEmployeesState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const changed = changedRows(prev, next);
      const deleted = deletedIds(prev, next);
      if (changed.length) employeesService.upsert(changed).catch((e) => setDataError(e.message));
      deleted.forEach((id) => employeesService.remove(id).catch((e) => setDataError(e.message)));
      return next;
    });
  const setEvaluations = (updater) =>
    setEvaluationsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const changed = changedRows(prev, next);
      const deleted = deletedIds(prev, next);
      if (changed.length) evaluationsService.upsert(changed).catch((e) => setDataError(e.message));
      deleted.forEach((id) => evaluationsService.remove(id).catch((e) => setDataError(e.message)));
      return next;
    });
  const setSettings = (updater) =>
    setSettingsState((prev) => {
      const next = hydrateSettings(typeof updater === "function" ? updater(prev) : updater);
      syncSettings(next);
      settingsService.save(next).catch((e) => setDataError(e.message));
      return next;
    });
  useEffect(() => {
    syncSettings(settings);
  }, [settings]);
  useEffect(() => {
    const canonical = canonicalHrPageAliases[page];
    if (activeModuleKey === "hr" && canonical && canonical !== page) {
      setPage(canonical);
      return;
    }
    const moduleKey = getModuleForPage(page);
    if (moduleKey && moduleKey !== activeModuleKey) setActiveModuleKey(moduleKey);
  }, [page, activeModuleKey]);
  useEffect(() => {
    let alive = true;
    if (!currentCompany?.company_id) {
      applyThemeForCurrentCompany(null);
      return;
    }
    applyThemeForCurrentCompany(currentCompany);
    themeService.loadCompanyTheme(currentCompany.company_id)
      .then((theme) => {
        if (alive) applyCompanyTheme(theme);
      })
      .catch((error) => console.error("Theme colors error:", error));
    return () => {
      alive = false;
    };
  }, [currentCompany?.company_id, currentCompany?.primary_color, currentCompany?.secondary_color, currentCompany?.accent_color, currentCompany?.sidebar_bg_color, currentCompany?.button_color]);
  useEffect(() => {
    if (!logged) return;
    const user = currentUserState || getCurrentUser() || {};
    const platformAdmin = user?.is_platform_admin === true || user?.role === platformSuperAdminRole || role === platformSuperAdminRole;
    if (!platformAdmin) {
      setCompanies([]);
      return;
    }
    let alive = true;
    const loadCompanies = async () => {
      try {
        const rows = await companiesService.loadCompanies();
        if (alive) setCompanies(rows);
      } catch (error) {
        console.error("Tenant/company list load error:", error);
        if (alive) setCompanies([]);
      }
    };
    loadCompanies();
    const unsubscribe = companiesService.subscribe(loadCompanies);
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [logged, role, currentUserState?.user_id]);
  useEffect(() => {
    if (!logged || !currentCompany?.company_id) {
      setCompanyPermissions([]);
      setCompanyPermissionsLoading(false);
      return;
    }
    let alive = true;
    const loadCompanyPermissions = async () => {
      try {
        setCompanyPermissionsLoading(true);
        const rows = await companyPermissionsService.loadCompanyPermissions(currentCompany.company_id);
        if (alive) setCompanyPermissions(rows);
      } catch (error) {
        console.error("Supabase company_permissions load/save error:", error);
        if (alive) setDataError(error.message);
      } finally {
        if (alive) setCompanyPermissionsLoading(false);
      }
    };
    loadCompanyPermissions();
    const unsubscribe = companyPermissionsService.subscribe(loadCompanyPermissions);
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [logged, currentCompany?.company_id]);
	  useEffect(() => {
	    if (!logged) return;
      if (!currentCompany?.company_id) return;
	    let alive = true;
    setDataLoading(true);
    setDataError("");
    Promise.all([
      employeesService.list(),
      evaluationsService.list(),
      settingsService.get(defaultSettings),
    ])
      .then(([remoteEmployees, remoteEvaluations, remoteSettings]) => {
        if (!alive) return;
        setEmployeesState(remoteEmployees);
        setEvaluationsState(remoteEvaluations);
        setSettingsState(hydrateSettings(remoteSettings));
      })
      .catch((error) => alive && setDataError(error.message))
      .finally(() => alive && setDataLoading(false));
    const unsubEmployees = employeesService.subscribe(async () => {
      try {
        setEmployeesState(await employeesService.list());
      } catch (e) {
        setDataError(e.message);
      }
    });
    const unsubEvaluations = evaluationsService.subscribe(async () => {
      try {
        setEvaluationsState(await evaluationsService.list());
      } catch (e) {
        setDataError(e.message);
      }
    });
    const unsubSettings = settingsService.subscribe(async () => {
      try {
        setSettingsState(hydrateSettings(await settingsService.get(defaultSettings)));
      } catch (e) {
        setDataError(e.message);
      }
    });
    return () => {
      alive = false;
      unsubEmployees?.();
      unsubEvaluations?.();
	      unsubSettings?.();
	    };
	  }, [logged, currentCompany?.company_id]);
  useEffect(() => {
    if (!logged) return;
    let alive = true;
    const currentUser = currentUserState || getCurrentUser() || {};
    const loadAdminData = async () => {
      try {
        setPermissionsLoading(true);
        const [permissionsRows, notificationRows] = await Promise.all([
          adminService.listPermissions().catch((e) => {
            console.error("Supabase app_permissions load/save error:", e);
            return [];
          }),
          notificationsService.list(currentUser.user_id || currentUser.username || "").catch((e) => {
            console.error("Supabase notifications load/save error:", e);
            return [];
          }),
        ]);
        const treeRows = await treePermissionsService.loadRoleNodePermissions(role).catch((e) => {
          console.error("Supabase app_role_node_permissions load/save error:", e);
          return [];
        });
        if (!alive) return;
        setAppPermissions(permissionsRows);
        setTreeRolePermissions(treeRows);
        setNotifications(notificationRows);
      } catch (e) {
        console.error("Supabase enterprise data load error:", e);
      } finally {
        if (alive) setPermissionsLoading(false);
      }
    };
    loadAdminData();
    const unsubPermissions = adminService.subscribePermissions(loadAdminData);
    const unsubTreePermissions = supabase.subscribeToTable("app_role_node_permissions", loadAdminData);
    const unsubNotifications = notificationsService.subscribe(loadAdminData);
    return () => {
      alive = false;
      unsubPermissions?.();
      unsubTreePermissions?.();
      unsubNotifications?.();
    };
  }, [logged, role, currentUserState?.user_id, currentCompany?.company_id]);
  if (!logged)
    return (
      <Login
        settings={settings}
        onLogin={(user) => {
          const isPlatformLogin = user?.is_platform_admin === true || user?.role === platformSuperAdminRole;
          const identityUser = isPlatformLogin
            ? {
                ...user,
                company_id: "",
                company_code: "",
                company_name: "",
                logo_url: "",
                primary_color: "",
              }
            : user;
          const company = isPlatformLogin ? null : (getCurrentCompany() || {
            company_id: user.company_id,
            company_code: user.company_code,
            company_name: user.company_name,
            logo_url: user.logo_url,
            primary_color: user.primary_color,
          });
          setTenantSession({ company, user: identityUser });
          setCurrentCompany(company);
          setCurrentUserState(identityUser);
          setRole(user.role);
          localStorage.setItem("ep_role", user.role);
          localStorage.setItem("ep_employee_id", user.employeeId || "");
          localStorage.setItem("ep_logged", "1");
          setLogged(true);
        }}
      />
    );
  if (dataLoading) return <LoadingScreen />;
  if (dataError)
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-5" dir="rtl">
        <div className="panel max-w-xl p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 text-red-600" />
          <h2 className="text-xl font-extrabold">تعذر تحميل بيانات Supabase</h2>
          <p className="mt-2 text-sm text-slate-500">اطلب من مدير النظام ربط الحساب برقم الموظف.</p>
          <button onClick={() => location.reload()} className="btn-primary mt-5">إعادة المحاولة</button>
        </div>
      </div>
    );
  if (role === "الموظف")
    return (
      <EmployeePortal
        employees={employees}
        evaluations={evaluations}
        settings={settings}
        setSettings={setSettings}
        onLogout={() => {
          localStorage.removeItem("ep_logged");
          localStorage.removeItem("ep_role");
          localStorage.removeItem("ep_employee_id");
          clearTenantSession();
          setCurrentCompany(null);
          setCurrentUserState(null);
          setLogged(false);
        }}
      />
    );
	  const currentUser = currentUserState || getCurrentUser() || {},
      isPlatformAdminUser = currentUser?.is_platform_admin === true || currentUser?.role === platformSuperAdminRole || role === platformSuperAdminRole,
      isAdministrativeUser = isPlatformAdminUser || isSystemAdministratorRole(currentUser?.role) || isSystemAdministratorRole(role),
      hasSelectedCompany = Boolean(currentCompany?.company_id),
	    roleMatrix = settings.rolePermissions?.[role] || {},
	    hasRoleMatrix = Object.keys(roleMatrix).length > 0,
	    canNode = (nodeKey, action = "can_view") => hasTreePermission(treeRolePermissions, role, nodeKey, action),
      companyCanPage = (pageKey, action = "can_view") => {
        if (pageKey === "companies_admin") return isPlatformAdminUser;
        if (!hasSelectedCompany) return false;
        if (isAdministrativeUser) return true;
        return companyCanAccessFromRows(companyPermissions, pageKey, action);
      },
	    canPage = (pageKey, action = "can_view") => {
        if (isPlatformAdminUser) return pageKey === "companies_admin" ? true : companyCanPage(pageKey, action);
        if (isAdministrativeUser) return true;
        if (!companyCanPage(pageKey, action)) return false;
        return pageAllowedByTree(treeRolePermissions, role, pageKey, action) || canByPermission(appPermissions, role, pageKey, action);
      },
	    rawVisibleNavItems = navItems.filter(([id]) => {
        if (isPlatformAdminUser) return hasSelectedCompany ? id === "companies_admin" || companyCanPage(id, "can_view") : id === "companies_admin";
        if (id === "companies_admin") return false;
        if (isAdministrativeUser && hasSelectedCompany) return true;
        if (!companyCanPage(id, "can_view")) return false;
	      if (id === "dashboard") return hasAnyPermission(treeRolePermissions, role, dashboardPermissionNodes, "can_view");
	      if (treeRolePermissions.length) return pageAllowedByTree(treeRolePermissions, role, id, "can_view");
	      if (appPermissions.length) return canByPermission(appPermissions, role, id === "reports" ? "reports" : id, "can_view");
	      return hasRoleMatrix ? roleMatrix[id]?.view : isAdminLikeRole(role);
	    }),
      selectedModuleKey = ERP_MODULES.some((module) => module.key === activeModuleKey) ? activeModuleKey : getModuleForPage(page),
      selectedModule = ERP_MODULES.find((module) => module.key === selectedModuleKey) || ERP_MODULES[0],
      rawVisibleIds = new Set(rawVisibleNavItems.map(([id]) => id)),
      moduleVisibleNavItems = isPlatformAdminUser && !hasSelectedCompany
        ? rawVisibleNavItems
        : getModulePages(selectedModuleKey).filter((item) => {
            if (isAdministrativeUser) return item.status !== "placeholder" || isAdminLikeRole(role) || isPlatformAdminUser;
            if (item.status === "placeholder") return isAdminLikeRole(role) || isPlatformAdminUser;
            return rawVisibleIds.has(item.routeKey) || rawVisibleIds.has(item.key);
          }).map((item) => [item.key, item.label, item.routeKey, item.status, item.moduleKey]),
      visibleNavItems = moduleVisibleNavItems.length ? moduleVisibleNavItems : rawVisibleNavItems,
      currentPageMeta = ERP_PAGE_BY_KEY[page] || null,
      pageIsPlaceholder = currentPageMeta?.status === "placeholder",
      requestedPageBlockedByCompany = !pageIsPlaceholder && page !== "companies_admin" && hasSelectedCompany && !companyCanPage(page, "can_view"),
      requestedPageBlockedByRole = !pageIsPlaceholder && page !== "companies_admin" && hasSelectedCompany && companyCanPage(page, "can_view") && !canPage(page, "can_view"),
	    firstAllowedPage = isPlatformAdminUser && !hasSelectedCompany ? "companies_admin" : ((visibleNavItems[0]?.[2] || visibleNavItems[0]?.[0]) || getFirstAllowedPageForUser({ ...currentUser, role }, treeRolePermissions, appPermissions, rawVisibleNavItems)),
	    activePage = (requestedPageBlockedByCompany || requestedPageBlockedByRole) ? page : (visibleNavItems.some(([id, _label, routeKey]) => id === page || routeKey === page) ? page : firstAllowedPage),
      sidebarNavigationGroups = buildGroupedNavigation(visibleNavItems.map(([id, label, routeKey, itemStatus, moduleKey]) => ({
        ...(pageRegistryByKey[id] || ERP_PAGE_BY_KEY[id] || ERP_PAGE_BY_ROUTE[routeKey] || {}),
        key: id,
        label,
        routeKey: routeKey || id,
        status: itemStatus || pageRegistryByKey[id]?.status || "active",
        moduleKey: moduleKey || pageRegistryByKey[id]?.moduleKey || selectedModuleKey,
      }))),
    title = ERP_PAGE_BY_KEY[activePage]?.label || ERP_PAGE_BY_ROUTE[activePage]?.label || navItems.find((x) => x[0] === activePage)?.[1],
    company = currentCompany || getCurrentCompany() || {},
    companyName = company.company_name || currentUser.company_name || (isPlatformAdminUser ? "إدارة المنصة" : APP_BRAND_NAME),
    companyLogo = company.logo_url || currentUser.logo_url || "",
    userCardName = currentUser?.name || currentUser?.username || "مستخدم",
    userCardUsername = currentUser?.username || "مستخدم",
    userCardRole = currentUser?.role || "غير محدد",
    initials = userCardName
      .split(" ")
      .slice(0, 2)
      .map((x) => x[0])
      .join(""),
	    p = {
	      employees,
	      setEmployees,
	      evaluations,
	      setEvaluations,
	      setPage,
	      settings,
	      setSettings,
	      role,
	      currentUser,
        currentCompany: company,
        companyPermissions,
        companyCanPage,
	      can: (pageKey, action = "can_view") => canPage(pageKey, action),
	      canNode,
	    };
  const handlePlatformCompanyChange = (companyId) => {
    if (!isPlatformAdminUser) return;
    const selected = companies.find((item) => item.company_id === companyId) || null;
    const identityUser = {
      ...currentUser,
      company_id: "",
      company_code: "",
      company_name: "",
      logo_url: "",
      primary_color: "",
      is_platform_admin: true,
    };
    setTenantSession({ company: selected, user: identityUser });
    setCurrentCompany(selected);
    setCurrentUserState(identityUser);
    setEmployeesState([]);
    setEvaluationsState([]);
    setSettingsState(hydrateSettings(defaultSettings));
    setDataError("");
    setDataLoading(false);
    setAppPermissions([]);
    setTreeRolePermissions([]);
    setCompanyPermissions([]);
    setNotifications([]);
    setPage(selected ? "dashboard" : "companies_admin");
  };
  if (!requestedPageBlockedByCompany && !requestedPageBlockedByRole && visibleNavItems.length && activePage && activePage !== page) {
    setTimeout(() => setPage(activePage), 0);
  }
  if (permissionsLoading || companyPermissionsLoading) return <LoadingScreen message="جاري تحميل الصلاحيات..." />;
  if (!visibleNavItems.length) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 p-5" dir="rtl"><div className="panel max-w-xl p-6 text-center"><ShieldCheck className="mx-auto mb-3 text-brand-700" /><h2 className="text-xl font-extrabold">لا توجد صلاحيات مفعلة لهذا المستخدم</h2><button onClick={() => { localStorage.removeItem("ep_logged"); localStorage.removeItem("ep_role"); clearTenantSession(); setCurrentCompany(null); setCurrentUserState(null); setLogged(false); }} className="btn-primary mt-5">تسجيل الخروج</button></div></div>;
  }
  const availableModulePages = (moduleKey) =>
    getModulePages(moduleKey).filter((item) => {
      if (isAdministrativeUser) return item.status !== "placeholder" || isAdminLikeRole(role) || isPlatformAdminUser;
      return item.status === "placeholder"
        ? isAdminLikeRole(role) || isPlatformAdminUser
        : rawVisibleIds.has(item.routeKey) || rawVisibleIds.has(item.key);
    });
  const safeModules = isPlatformAdminUser && !hasSelectedCompany
    ? []
    : ERP_MODULES.filter((module) => availableModulePages(module.key).length > 0);
  const switchErpModule = (moduleKey) => {
    const pages = availableModulePages(moduleKey);
    setActiveModuleKey(moduleKey);
    if (moduleKey === "system") {
      setPage("system_settings");
      return;
    }
    if (pages[0]) setPage(pages[0].routeKey || pages[0].key);
  };
  return (
    <div className="min-h-screen" dir="rtl">
      {sidebar && (
        <button
          onClick={() => setSidebar(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}
      <aside
        className={`company-sidebar no-print fixed inset-y-0 right-0 z-40 flex w-[270px] flex-col bg-[#171a21] text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-[86px] items-center gap-3 border-b border-white/10 px-6">
          <div className="company-primary-bg grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-brand-700">
            {companyLogo ? <img src={companyLogo} alt={companyName} className="h-full w-full object-cover" /> : <span className="px-1 text-center text-xs font-extrabold leading-4">{companyName?.slice(0, 2) || <Banknote />}</span>}
          </div>
          <div>
            <b>{APP_SHORT_NAME}</b>
            <p className="mt-1 text-[11px] text-slate-400">
              {companyName}
            </p>
          </div>
          <button
            onClick={() => setSidebar(false)}
            className="mr-auto lg:hidden"
          >
            <X />
          </button>
        </div>
        <nav className="flex-1 overflow-x-hidden overflow-y-auto p-3">
          <GroupedSidebarNav
            groups={sidebarNavigationGroups}
            activePage={activePage}
            moduleKey={selectedModuleKey}
            icons={icons}
            onNavigate={(item) => {
              if (item.moduleKey) setActiveModuleKey(item.moduleKey);
              setPage(item.routeKey || item.key);
              setSidebar(false);
            }}
          />
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="company-primary-bg grid h-9 w-9 place-items-center rounded-full bg-brand-700 font-bold">
              {initials}
            </div>
            <div>
              <b className="text-sm">{userCardUsername}</b>
              <p className="text-[11px] text-slate-400">{userCardRole}</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("ep_logged");
              localStorage.removeItem("ep_role");
              localStorage.removeItem("ep_employee_id");
              clearTenantSession();
              setCurrentCompany(null);
              setCurrentUserState(null);
              setLogged(false);
            }}
            className="flex items-center gap-2 text-sm text-slate-400"
          >
            <LogOut size={17} /> تسجيل الخروج
          </button>
        </div>
      </aside>
      <div className="lg:pr-[270px]">
        <header className="no-print sticky top-0 z-20 flex h-[86px] items-center border-b bg-white/95 px-4 md:px-7">
          <button
            onClick={() => setSidebar(true)}
            className="ml-3 rounded-xl border p-2 lg:hidden"
          >
            <Menu />
          </button>
          <div>
            <h1 className="text-xl font-extrabold">{title}</h1>
            <p className="mt-1 hidden text-xs text-slate-500 sm:block">
              نظرة شاملة تساعدك على اتخاذ قرارات أفضل
            </p>
          </div>
          <div className="mr-auto flex items-center gap-3">
            {isPlatformAdminUser && (
              <label className="flex max-w-[260px] items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-bold text-slate-600">
                <span>اختر الشركة</span>
                <select
                  value={currentCompany?.company_id || ""}
                  onChange={(event) => handlePlatformCompanyChange(event.target.value)}
                  className="min-w-[170px] bg-transparent text-sm outline-none"
                >
                  <option value="">إدارة المنصة فقط</option>
                  {companies.map((item) => (
                    <option key={item.company_id} value={item.company_id}>
                      {item.company_code || item.company_name} - {item.company_name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="hidden h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 md:flex">
              <Search size={17} />
              <input
                className="w-40 bg-transparent text-sm outline-none"
                placeholder="اكتب سبب طلب المراجعة..."
              />
            </label>
		            <div className="relative">
	              <button onClick={() => setNotificationsOpen((v) => !v)} className="relative rounded-xl border p-2.5">
	                <Bell size={19} />
	                {notifications.some((n) => !n.is_read) && (
	                  <i className="company-primary-bg absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-brand-700 px-1 text-[10px] font-bold text-white">
	                    {notifications.filter((n) => !n.is_read).length}
	                  </i>
	                )}
	              </button>
	              {notificationsOpen && (
	                <div className="absolute left-0 top-12 z-50 w-80 rounded-2xl border bg-white p-3 shadow-xl">
	                  <div className="mb-2 flex items-center"><b className="text-sm">الإشعارات</b><span className="mr-auto text-xs text-slate-400">{notifications.length}</span></div>
	                  <div className="max-h-80 space-y-2 overflow-y-auto">
	                    {notifications.length ? notifications.slice(0, 10).map((n) => (
	                      <button
	                        key={n.id}
	                        onClick={async () => {
	                          try {
	                            const saved = await notificationsService.markRead(n);
	                            setNotifications((list) => list.map((x) => (x.id === saved.id ? saved : x)));
	                          } catch (e) {
	                            alert(e.message);
	                          }
	                        }}
	                        className={`w-full rounded-xl p-3 text-right text-sm ${n.is_read ? "bg-slate-50" : "bg-brand-50"}`}
	                      >
	                        <b>{n.title}</b>
	                        <p className="mt-1 text-xs text-slate-500">{n.message}</p>
	                      </button>
	                    )) : <p className="p-4 text-center text-sm text-slate-400">لا توجد إشعارات</p>}
	                  </div>
	                </div>
	              )}
	            </div>
            <div className="hidden items-center gap-2 border-r pr-4 sm:flex">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">
                {initials}
              </div>
              <div>
                <b className="text-sm">{userCardUsername}</b>
                <p className="text-[11px] text-slate-500">{userCardRole}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-7">
          {safeModules.length > 0 && (
            <div className="no-print mb-5 rounded-3xl border bg-white p-3 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white">{APP_SHORT_NAME}</span>
                <span className="text-xs text-slate-500">{APP_DESCRIPTION}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {safeModules.map((module) => (
                  <button
                    key={module.key}
                    type="button"
                    onClick={() => switchErpModule(module.key)}
                    className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-extrabold transition ${selectedModuleKey === module.key ? "company-primary-bg bg-brand-700 text-white shadow" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                    title={module.description}
                  >
                    {module.label}
                  </button>
                ))}
              </div>
              {selectedModule?.description && <p className="mt-3 text-xs text-slate-500">{selectedModule.description}</p>}
            </div>
          )}
          <PageErrorBoundary resetKey={activePage} onBack={() => setPage("dashboard")}>
          {requestedPageBlockedByCompany && <CompanyModuleDisabled onBack={() => setPage(firstAllowedPage || "dashboard")} />}
          {requestedPageBlockedByRole && <RolePageDisabled onBack={() => setPage(firstAllowedPage || "dashboard")} />}
          {!requestedPageBlockedByCompany && !requestedPageBlockedByRole && (
          <>
          {isPlaceholderPage(activePage) && <ErpPlaceholderPage pageKey={activePage} moduleKey={selectedModuleKey} onBack={() => switchErpModule("hr")} />}{" "}
          {activePage === "companies_admin" && <CompaniesAdminPage {...p} />}{" "}
          {activePage === "dashboard" && <Dashboard {...p} />}{" "}
          {activePage === "employees" && <EnhancedEmployees {...p} />}{" "}
          {activePage === "templates" && <EnhancedTemplates {...p} />}{" "}
          {activePage === "evaluations" && <EnhancedEvaluations {...p} />}{" "}
          {activePage === "productivity" && <EnhancedProductivity {...p} />}{" "}
          {activePage === "discipline" && <EnhancedDiscipline {...p} />}{" "}
          {activePage === "incentives" && <EnhancedIncentives {...p} />}{" "}
	          {activePage === "top" && <EnhancedTopEmployees {...p} />}{" "}
	          {activePage === "plans" && <EnhancedPlans {...p} />}{" "}
	          {activePage === "guarantees" && <EmployeeGuaranteesPage {...p} />}{" "}
	          {activePage === "overtime" && <OvertimePage {...p} />}{" "}
	          {activePage === "shifts" && <EmployeeShiftsPage {...p} />}{" "}
	          {activePage === "inventory" && <InventoryManagementPage {...p} />}{" "}
	          {activePage === "daily_operations" && <DailyOperationsPageEnhanced {...p} />}{" "}
	          {activePage === "performance_criteria" && <PerformanceCriteriaPageEnhanced {...p} />}{" "}
	          {activePage === "performance_kpi_scores" && <KpiScoresPage {...p} />}{" "}
	          {activePage === "users_permissions" && <UsersPermissionsPage {...p} />}{" "}
	          {activePage === "recruitment" && <RecruitmentPage {...p} />}{" "}
	          {activePage === "reports_center" && <EnterpriseReportsCenter {...p} />}{" "}
	          {activePage === "audit_logs" && <AuditLogsPage {...p} />}{" "}
	          {activePage === "reports" && <EnhancedReports {...p} />}{" "}
	          {activePage === "settings" && <SettingsPage {...p} />}
          {activePage === "system_settings" && <SystemSettingsPage {...p} />}
          {["hr_home", "hr_org_chart", "hr_settings"].includes(activePage) && <HRFoundationPage {...p} pageKey={activePage} />}
          {genericHrPageKeys.has(activePage) && <HRModulePage pageKey={activePage} currentCompany={company} can={p.can} />}
          </>
          )}
          </PageErrorBoundary>
        </main>
        <AIAssistantWidget currentUser={p.currentUser} currentCompany={company} page={activePage} setPage={setPage} can={p.can} employees={employees} evaluations={evaluations} settings={settings} />
      </div>
    </div>
  );
}

function CompanyModuleDisabled({ onBack }) {
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <div className="panel max-w-xl p-8 text-center">
        <ShieldCheck className="mx-auto mb-4 text-brand-700" size={42} />
        <h2 className="text-xl font-extrabold">هذه الصفحة غير مفعلة ضمن صلاحيات الشركة</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          يمكن لمشرف المنصة تفعيل هذه الوحدة من إدارة الشركات ← صلاحيات الشركات.
        </p>
        <button type="button" onClick={onBack} className="btn-primary mt-5">
          العودة إلى صفحة مسموحة
        </button>
      </div>
    </div>
  );
}

function ErpPlaceholderPage({ pageKey, moduleKey, onBack }) {
  const pageMeta = ERP_PAGE_BY_KEY[pageKey] || {};
  const moduleMeta = ERP_MODULES.find((module) => module.key === (moduleKey || pageMeta.parentModule)) || {};
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <div className="panel max-w-2xl p-8 text-center">
        <BriefcaseBusiness className="mx-auto mb-4 text-brand-700" size={46} />
        <span className="rounded-full bg-brand-50 px-4 py-1 text-xs font-extrabold text-brand-700">{moduleMeta.label || "وحدة ERP"}</span>
        <h2 className="mt-4 text-2xl font-black">{pageMeta.label || "وحدة ERP"}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
          هذه الوحدة قيد التجهيز ضمن منصة {APP_SHORT_NAME}. تم وضعها في الهيكل العام للنظام بدون حذف أو تعطيل أي صفحة موجودة.
        </p>
        <button type="button" onClick={onBack} className="btn-primary mt-6">
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}

function RolePageDisabled({ onBack }) {
  return (
    <div className="grid min-h-[55vh] place-items-center">
      <div className="panel max-w-xl p-8 text-center">
        <ShieldCheck className="mx-auto mb-4 text-brand-700" size={42} />
        <h2 className="text-xl font-extrabold">لا تملك صلاحية الوصول إلى هذه الصفحة</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          الصفحة مفعلة للشركة، لكن دور المستخدم الحالي لا يملك صلاحية العرض.
        </p>
        <button type="button" onClick={onBack} className="btn-primary mt-5">
          العودة إلى صفحة مسموحة
        </button>
      </div>
    </div>
  );
}
function Login({ onLogin }) {
  const [companyCode, setCompanyCode] = useState("PUREMONEY"),
    [u, setU] = useState(""),
    [pw, setPw] = useState(""),
    [employeeNo, setEmployeeNo] = useState(""),
    [err, setErr] = useState(""),
    [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!companyCode.trim()) return setErr("يجب إدخال كود الشركة");
    if (!u.trim() || !pw) return setErr("يرجى إدخال اسم المستخدم وكلمة المرور.");
    setLoading(true);
    try {
      const user = await cloudLoginWithSupabase(u.trim(), pw, employeeNo.trim(), companyCode.trim());
      onLogin(user);
    } catch (error) {
      setErr(error.message || "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#111319] p-5">
      <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-700/20 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-800 to-[#3b1115] p-12 text-white md:flex">
          <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10"><Banknote /></div><div><b>{APP_SHORT_NAME}</b><p className="text-xs text-red-100/70">{APP_OFFICIAL_NAME}</p></div></div>
          <div><div className="mb-5 h-1 w-12 bg-white/30" /><h2 className="text-4xl font-extrabold leading-[1.35]">نحو ثقافة أداء<br />تكافئ التميز</h2><p className="mt-5 leading-7 text-red-100/75">{APP_DESCRIPTION}</p></div>
          <div className="flex gap-2 text-xs text-red-100/60"><ShieldCheck size={17} /> بياناتك محفوظة وآمنة داخل المتصفح</div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 sm:p-14">
          <span className="text-sm font-bold text-brand-700">{APP_SHORT_NAME}</span>
          <h1 className="mt-2 text-3xl font-extrabold">تسجيل الدخول</h1>
          <p className="mt-2 text-sm text-slate-500">{APP_SYSTEM_NAME} - {APP_TAGLINE}</p>
          <div className="mt-8 space-y-5">
            <Label t="كود الشركة"><input value={companyCode} onChange={(e) => setCompanyCode(e.target.value.toUpperCase())} autoComplete="organization" placeholder="PUREMONEY" className="field mt-2" /></Label>
            <Label t="اسم المستخدم"><input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" placeholder="أدخل اسم المستخدم" className="field mt-2" /></Label>
            <Label t="كلمة المرور"><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" placeholder="أدخل كلمة المرور" className="field mt-2" /></Label>
            <Label t="الرقم الوظيفي"><input value={employeeNo} onChange={(e) => setEmployeeNo(e.target.value)} autoComplete="off" placeholder="أدخل الرقم الوظيفي" className="field mt-2" /></Label>
          </div>
          {err && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          <button disabled={loading} className="btn-primary mt-7 h-12 w-full disabled:cursor-not-allowed disabled:opacity-60">{loading ? "جاري التحقق..." : "دخول إلى النظام"} <ArrowUpLeft size={18} /></button>
        </form>
      </div>
    </div>
  );
}

const uiOnlyMessage = "تم تجهيز العملية في الواجهة، وسيتم ربطها بقاعدة البيانات لاحقًا.";

const hrModuleTabs = {
  hr_home: ["نظرة عامة", "طلبات قيد الموافقة", "إجازات الشهر", "إنذارات الشهر", "وظائف شاغرة"],
  hr_employees_full: ["جميع الموظفين", "الموظفون النشطون", "تحت التجربة", "الموقوفون", "المنتهية خدماتهم", "ملفات الموظفين", "عقود الموظفين", "بيانات العهد"],
  hr_reports_full: ["تقارير الموظفين", "تقارير الحضور", "تقارير الرواتب", "تقارير الأداء", "تقارير الإجازات", "تقارير التوظيف", "تقارير المخالفات", "تقارير الإدارة العليا"],
  hr_requests: ["طلب إجازة", "طلب سلفة", "طلب تعريف راتب", "طلب تعديل بيانات", "طلب عهدة", "طلب عمل إضافي", "طلب نقل", "طلب استقالة", "كل الطلبات"],
  hr_performance_full: ["معايير الأداء", "نماذج تقييم الوظائف", "تقييم الموظفين", "درجات KPI", "اعتراضات التقييم", "خطط تحسين الأداء", "تقارير الأداء"],
  hr_incentives_full: ["إعدادات الحوافز", "شرائح الحوافز", "احتساب الحوافز", "اعتماد الحوافز", "صرف الحوافز", "تقارير الحوافز"],
  hr_attendance_payroll: ["سجلات الدوام", "التأخير", "الغياب", "الانصراف المبكر", "العمل الإضافي", "ملخص الدوام", "تقارير الدوام"],
  hr_salary: ["إعداد الراتب", "البدلات", "الخصومات", "السلف", "الإضافي", "صافي الراتب", "كشف الرواتب", "تقارير الرواتب"],
  hr_disciplinary: ["المساءلات", "الإنذارات", "لفت النظر", "التحقيقات", "الجزاءات", "سجل المخالفات", "تقارير المخالفات"],
  hr_recruitment_full: ["قائمة الوظائف", "طلبات التوظيف", "تقييم المرشحين", "خطابات عرض العمل", "عروض العمل", "عقود العمل", "خطة الاحتياجات الوظيفية", "اختبارات التوظيف", "الموظفون تحت التجربة", "رسائل الترحيب", "تقارير التوظيف"],
  hr_leaves: ["طلبات الإجازات", "أرصدة الإجازات", "الإجازات السنوية", "المرضية", "بدون راتب", "إجازات طارئة", "تقارير الإجازات"],
  hr_complaints: ["شكاوى الموظفين", "شكاوى العملاء", "شكاوى الفروع", "قيد المعالجة", "مغلقة", "تقارير الشكاوى"],
  hr_circulars: ["كل التعاميم", "تعاميم إدارية", "تعاميم دوام", "تعاميم موارد بشرية", "تعاميم امتثال", "تعاميم فروع", "أرشيف التعاميم"],
  hr_termination: ["طلبات الاستقالة", "إنهاء التجربة", "إنهاء العقد", "المخالصات", "تسليم العهد", "حساب مستحقات نهاية الخدمة", "تقارير إنهاء الخدمة"],
  hr_surveys: ["إنشاء استبيان", "استبيانات الموظفين", "استبيانات رضا العملاء", "نتائج الاستبيانات", "تحليل النتائج", "تقارير الاستبيانات"],
  hr_insurance: ["بيانات التأمين", "اشتراكات الموظفين", "وثائق التأمين", "مطالبات التأمين", "تقارير التأمين"],
  hr_announcements: ["إعلانات داخلية", "إعلانات الوظائف", "إعلانات الفروع", "الإعلانات النشطة", "أرشيف الإعلانات"],
  hr_files: ["ملفات الموظفين", "ملفات العقود", "ملفات التعاميم", "ملفات التوظيف", "ملفات المخزون", "الأرشيف", "البحث في الملفات"],
  hr_training: ["خطة التدريب", "البرامج التدريبية", "المتدربون", "تقييم التدريب", "شهادات التدريب", "تقارير التدريب"],
  hr_approvals: ["موافقات الإجازات", "موافقات الحوافز", "موافقات التوظيف", "موافقات المخزون", "موافقات الدوام", "كل الموافقات"],
  hr_org_chart: ["الهيكل العام", "الإدارات", "الفروع", "الوظائف", "خطوط الإشراف", "بطاقات الوظائف"],
  hr_settings_full: ["إعدادات الفروع", "إعدادات العملات", "إعدادات الوظائف", "إعدادات الأقسام", "إعدادات الحضور", "إعدادات التقييم", "إعدادات الحوافز", "إعدادات النظام"],
  hr_financial_setup: ["العملات", "الرواتب", "البدلات", "الخصومات", "السلف", "التأمينات", "مراكز التكلفة", "الحسابات المالية"],
  hr_templates_full: ["قوالب العقود", "قوالب عروض العمل", "قوالب التعاميم", "قوالب الإنذارات", "قوالب خطابات الموارد البشرية", "قوالب التقارير", "قوالب رسائل واتساب"],
};

function HRModulePage({ pageKey, currentCompany, can }) {
  const title = fullHrNavItems.find(([id]) => id === pageKey)?.[1] || "وحدة الموارد البشرية";
  const config = hrRecordsService.config(pageKey);
  const tabs = config.tabs || hrModuleTabs[pageKey] || ["نظرة عامة"];
  const currentCompanyId = currentCompany?.company_id || getCurrentCompany()?.company_id || getCurrentUser()?.company_id || "";
  const [tab, setTab] = useState(tabs[0]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState([]);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(null);
  const canCreate = can?.(pageKey, "can_create") !== false;
  const canEdit = can?.(pageKey, "can_edit") !== false;
  const canDelete = can?.(pageKey, "can_delete") !== false;
  const canExport = can?.(pageKey, "can_export") !== false;
  const canPrint = can?.(pageKey, "can_print") !== false;
  const fields = config.fields || [];
  const mainField = fields.find(([key]) => !["status", "notes"].includes(key))?.[0] || "title";
  const load = async () => {
    if (!currentCompanyId) {
      setError("لم يتم تحديد الشركة الحالية");
      setRows([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await hrRecordsService.load(pageKey, currentCompanyId);
      setRows(Array.isArray(result.rows) ? result.rows : []);
      setWarning(result.warning || "");
    } catch (err) {
      console.error("HR module error:", err);
      setError(err.message || "تعذر تحميل البيانات");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [pageKey, currentCompanyId]);
  const safeRows = Array.isArray(rows) ? rows : [];
  const statuses = [...new Set(safeRows.map((row) => row.status).filter(Boolean))];
  const filtered = safeRows.filter((row) => {
    const text = Object.values(row || {}).join(" ").toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (statusFilter === "all" || row.status === statusFilter);
  });
  const stats = [
    ["إجمالي السجلات", safeRows.length],
    ["النشطة", safeRows.filter((r) => ["نشط", "معتمدة", "معتمد", "حاضر"].includes(r.status)).length],
    ["قيد المراجعة", safeRows.filter((r) => String(r.status || "").includes("مراجعة") || String(r.status || "").includes("مسودة")).length],
    ["الشركة", currentCompany?.company_name || APP_BRAND_NAME],
  ];
  const openAdd = () => {
    if (!canCreate) return alert("لا تملك صلاحية تنفيذ هذه العملية");
    const blank = Object.fromEntries(fields.map(([key, , type]) => [key, type === "number" ? 0 : key === "status" ? "نشط" : ""]));
    setDialog({ ...blank, status: blank.status || "نشط" });
  };
  const save = async (event) => {
    event.preventDefault();
    if (!canEdit && dialog?.id) return alert("لا تملك صلاحية تنفيذ هذه العملية");
    if (!canCreate && !dialog?.id) return alert("لا تملك صلاحية تنفيذ هذه العملية");
    try {
      const saved = await hrRecordsService.save(pageKey, currentCompanyId, dialog);
      setRows((list) => list.some((row) => row.id === saved.id) ? list.map((row) => row.id === saved.id ? saved : row) : [saved, ...list]);
      setDialog(null);
      alert("تم حفظ البيانات بنجاح");
    } catch (err) {
      alert(err.message || "تعذر حفظ البيانات");
    }
  };
  const deactivate = async (row) => {
    if (!canDelete) return alert("لا تملك صلاحية تنفيذ هذه العملية");
    if (!confirm("هل تريد إلغاء/تعطيل هذا السجل؟")) return;
    try {
      const saved = await hrRecordsService.deactivate(pageKey, currentCompanyId, row);
      setRows((list) => list.map((item) => item.id === saved.id ? saved : item));
      alert("تم حفظ البيانات بنجاح");
    } catch (err) {
      alert(err.message || "تعذر حفظ البيانات");
    }
  };
  const columns = fields.slice(0, 6).map(([key, label]) => ({ key, label }));
  const printableColumns = columns.length ? columns : [{ key: mainField, label: "البند" }, { key: "status", label: "الحالة" }, { key: "notes", label: "ملاحظات" }];
  const renderField = ([key, label, type]) => (
    <Label key={key} t={label}>
      {type === "textarea" ? (
        <textarea value={dialog?.[key] || ""} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} className="field mt-2 !h-auto py-3" />
      ) : type === "status" ? (
        <select value={dialog?.[key] || "نشط"} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} className="field mt-2">
          {["نشط", "مسودة", "قيد المراجعة", "معتمدة", "مرفوضة", "مغلقة", "ملغى"].map((status) => <option key={status}>{status}</option>)}
        </select>
      ) : (
        <input type={type || "text"} value={dialog?.[key] ?? ""} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} className="field mt-2" />
      )}
    </Label>
  );
  return (
    <div className="space-y-5">
      <PageHead title={title} desc={`${config.description || "صفحة موارد بشرية"} - ${currentCompany?.company_name || APP_BRAND_NAME}`} action={<button disabled={!canCreate} onClick={openAdd} className="btn-primary"><Plus size={18} /> إضافة</button>} />
      {warning && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">{warning}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-4">{stats.map(([label, value]) => <Mini key={label} label={label} value={value} I={BadgeCheck} />)}</div>
      <div className="panel flex flex-wrap gap-2 p-3">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === item ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}</div>
      <div className="panel flex flex-wrap gap-3 p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} className="field min-w-[220px] flex-1" placeholder="بحث..." />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="field max-w-[180px]"><option value="all">كل الحالات</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
        <button disabled={!canExport} onClick={() => exportExcel(filtered, title)} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button>
        <button disabled={!canPrint} onClick={() => printDocument(title, rowsToReportHtml(title, filtered, printableColumns))} className="btn-secondary"><Printer size={17} /> طباعة</button>
      </div>
      <div className="panel p-4">
        {loading ? <div className="p-8 text-center text-sm text-slate-400">جاري تحميل البيانات...</div> : filtered.length ? (
          <div className="table-wrap"><table><thead><tr>{printableColumns.map((col) => <th key={col.key}>{col.label}</th>)}<th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{filtered.map((row, index) => <tr key={row.id || index}>{printableColumns.map((col) => <td key={col.key}>{String(row[col.key] ?? "—")}</td>)}<td><Status>{row.status || "نشط"}</Status></td><td><button onClick={() => setDialog(row)} className="p-2 text-slate-600"><Eye size={16} /></button><button disabled={!canEdit} onClick={() => setDialog(row)} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canDelete} onClick={() => deactivate(row)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>
        ) : <div className="p-8 text-center text-sm text-slate-400">لا توجد بيانات حالياً</div>}
      </div>
      {dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"><DialogTitle title={`${title} - ${tab}`} close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-2">{fields.map(renderField)}</div><DialogActions close={() => setDialog(null)} /></form></div>}
    </div>
  );
}

function CompaniesAdminPage({ currentUser }) {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("الشركات");
  const [permissionsCompanyId, setPermissionsCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const canManage = currentUser?.is_platform_admin === true || currentUser?.role === platformSuperAdminRole;
  const load = async () => {
    if (!canManage) return;
    setLoading(true);
    try {
      setRows(await companiesService.loadCompaniesWithAdminUsers());
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [canManage]);
  if (!canManage) return <div className="panel p-6 text-center font-bold text-red-600">لا تملك صلاحية الوصول إلى بيانات هذه الشركة</div>;
  const openAddCompany = () => setDialog({
    company_code: "",
    company_name: "",
    subscription_plan: "standard",
    subscription_status: "active",
    max_users: 25,
    max_branches: 5,
    primary_color: "#7f1d1d",
    secondary_color: "#374151",
    accent_color: "#991b1b",
    sidebar_bg_color: "#111827",
    sidebar_text_color: "#ffffff",
    button_color: "#991b1b",
    button_text_color: "#ffffff",
    card_accent_color: "#fee2e2",
    table_header_color: "#f8fafc",
    report_header_color: "#8b1e1e",
    theme_mode: "light",
    theme_name: "default",
    is_active: true,
    admin_username: "",
    admin_name: "",
    admin_password: "123456",
  });
  const openEditCompany = (row) => setDialog({
    ...row,
    admin_username: row.admin_username || row.admin_user?.username || "",
    admin_name: row.admin_name || row.admin_user?.name || row.admin_user?.employee_name || "",
    admin_user_id: row.admin_user_id || row.admin_user?.user_id || "",
    admin_password: "",
  });
  const save = async (e) => {
    e.preventDefault();
    try {
      const adminUsername = String(dialog.admin_username || "").trim();
      if (!adminUsername) return alert("يجب إدخال اسم مستخدم مدير الشركة");
      const adminPayload = {
        user_id: dialog.admin_user_id,
        username: adminUsername,
        password: dialog.admin_password || "",
        name: dialog.admin_name || "مدير النظام",
        email: dialog.email || "",
      };
      const saved = dialog.company_id
        ? await companiesService.saveCompanyWithAdminUser(dialog, adminPayload)
        : await companiesService.createCompanyWithDefaults(dialog, adminPayload);
      setRows((list) => list.some((x) => x.company_id === saved.company_id) ? list.map((x) => x.company_id === saved.company_id ? saved : x) : [saved, ...list]);
      setDialog(null);
    } catch (error) {
      alert(error.message);
    }
  };
  const managePermissions = (companyId) => {
    setPermissionsCompanyId(companyId);
    setTab("صلاحيات الشركات");
  };
  const enableAllPermissions = async (companyId) => {
    if (!confirm("هل تريد تفعيل جميع الوحدات والصلاحيات لهذه الشركة؟")) return;
    try {
      await companyPermissionsService.enableAll(companyId);
      alert("تم تفعيل جميع صلاحيات الشركة");
    } catch (error) {
      alert(error.message);
    }
  };
  const disableAllPermissions = async (companyId) => {
    if (!confirm("هل تريد تعطيل جميع وحدات هذه الشركة؟")) return;
    try {
      await companyPermissionsService.disableAll(companyId);
      alert("تم تعطيل صلاحيات الشركة");
    } catch (error) {
      alert(error.message);
    }
  };
  const tabs = ["الشركات", "صلاحيات الشركات", "اشتراكات الشركات", "مستخدمو الشركات", "نسخ احتياطية الشركات", "إعدادات المنصة"];
  return (
    <div className="space-y-5">
      <PageHead title="إدارة الشركات" desc="إدارة منصة SaaS متعددة الشركات والاشتراكات والمستخدمين" action={<button onClick={openAddCompany} className="btn-primary"><Plus size={18} /> إضافة شركة</button>} />
      <div className="panel flex flex-wrap gap-2 p-3">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === item ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}</div>
      <div className="grid gap-4 md:grid-cols-4"><Mini label="عدد الشركات" value={rows.length} I={Building2} /><Mini label="النشطة" value={rows.filter((r) => r.is_active).length} I={BadgeCheck} /><Mini label="اشتراكات فعالة" value={rows.filter((r) => ["active", "trial"].includes(r.subscription_status)).length} I={Wallet} /><Mini label="المشرف" value={currentUser?.username || "مستخدم"} I={UserRoundCog} /></div>
      {tab === "صلاحيات الشركات" ? (
        <CompanyPermissionsAdminPanel companies={rows} selectedCompanyId={permissionsCompanyId || rows[0]?.company_id || ""} onSelectCompany={setPermissionsCompanyId} />
      ) : (
        <div className="panel p-4">
          {loading ? <p className="text-sm text-slate-400">جاري التحميل...</p> : <div className="table-wrap"><table><thead><tr><th>اسم الشركة</th><th>كود الشركة</th><th>حالة الاشتراك</th><th>الحالة</th><th>اسم مستخدم مدير الشركة</th><th>اسم مدير الشركة</th><th>عدد المستخدمين</th><th>الحد الأقصى للمستخدمين</th><th>الصلاحيات</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.company_id}><td>{row.company_name}</td><td>{row.company_code}</td><td><Status>{row.subscription_status}</Status></td><td><Status>{row.is_active ? "نشط" : "معطل"}</Status></td><td>{row.admin_username || "غير محدد"}</td><td>{row.admin_name || "غير محدد"}</td><td>{row.users_count ?? "—"}</td><td>{row.max_users}</td><td><div className="flex flex-wrap gap-1"><button onClick={() => managePermissions(row.company_id)} className="btn-secondary !h-9">إدارة</button><button onClick={() => enableAllPermissions(row.company_id)} className="btn-secondary !h-9">تفعيل الكل</button><button onClick={() => disableAllPermissions(row.company_id)} className="btn-secondary !h-9">تعطيل الكل</button></div></td><td><button onClick={() => openEditCompany(row)} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => companiesService.deleteOrDeactivateCompany(row).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>}
        </div>
      )}
      {dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"><DialogTitle title="بيانات الشركة" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="اسم الشركة"><input required value={dialog.company_name || ""} onChange={(e) => setDialog({ ...dialog, company_name: e.target.value })} className="field mt-2" /></Label><Label t="كود الشركة"><input required value={dialog.company_code || ""} onChange={(e) => setDialog({ ...dialog, company_code: e.target.value.toUpperCase() })} className="field mt-2" /></Label><Label t="البريد"><input value={dialog.email || ""} onChange={(e) => setDialog({ ...dialog, email: e.target.value })} className="field mt-2" /></Label><Label t="الهاتف"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label><Label t="الباقة"><input value={dialog.subscription_plan || ""} onChange={(e) => setDialog({ ...dialog, subscription_plan: e.target.value })} className="field mt-2" /></Label><Label t="حالة الاشتراك"><select value={dialog.subscription_status || "active"} onChange={(e) => setDialog({ ...dialog, subscription_status: e.target.value })} className="field mt-2"><option value="active">active</option><option value="trial">trial</option><option value="inactive">inactive</option></select></Label><Label t="الحد الأقصى للمستخدمين"><input type="number" value={dialog.max_users || 0} onChange={(e) => setDialog({ ...dialog, max_users: e.target.value })} className="field mt-2" /></Label><Label t="الحد الأقصى للفروع"><input type="number" value={dialog.max_branches || 0} onChange={(e) => setDialog({ ...dialog, max_branches: e.target.value })} className="field mt-2" /></Label><Label t="رابط الشعار"><input value={dialog.logo_url || ""} onChange={(e) => setDialog({ ...dialog, logo_url: e.target.value })} className="field mt-2" /></Label><Label t="اللون الأساسي"><input type="color" value={dialog.primary_color || "#7f1d1d"} onChange={(e) => setDialog({ ...dialog, primary_color: e.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Label><Label t="اسم مستخدم مدير الشركة"><input required value={dialog.admin_username || ""} onChange={(e) => setDialog({ ...dialog, admin_username: e.target.value })} onBlur={(e) => setDialog((d) => ({ ...d, admin_username: e.target.value.trim() }))} className="field mt-2" /></Label><Label t="اسم مدير الشركة"><input value={dialog.admin_name || ""} onChange={(e) => setDialog({ ...dialog, admin_name: e.target.value })} className="field mt-2" /></Label><Label t="كلمة مرور مدير الشركة"><input type="password" value={dialog.admin_password || ""} placeholder={dialog.company_id ? "اتركها فارغة للإبقاء على كلمة المرور الحالية" : "123456"} onChange={(e) => setDialog({ ...dialog, admin_password: e.target.value })} className="field mt-2" /></Label></div><CompanyThemeFields theme={dialog} setTheme={(patch) => setDialog({ ...dialog, ...patch })} /><DialogActions close={() => setDialog(null)} /></form></div>}
    </div>
  );
}

function CompanyPermissionsAdminPanel({ companies, selectedCompanyId, onSelectCompany }) {
  const [rows, setRows] = useState([]);
  const [copySource, setCopySource] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const selectedCompany = companies.find((company) => company.company_id === selectedCompanyId);
  const load = async () => {
    if (!selectedCompanyId) return setRows([]);
    setLoading(true);
    try {
      setRows(await companyPermissionsService.loadCompanyPermissions(selectedCompanyId));
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [selectedCompanyId]);
  const updateRow = (permissionKey, key, value) => {
    setRows((list) => {
      const merged = mergeWithDefaultCompanyPermissions(list, selectedCompanyId);
      return merged.map((row) => row.permission_key === permissionKey ? { ...row, [key]: value, is_enabled: key === "can_access" ? value : row.is_enabled, can_view: key === "can_access" && !value ? false : row.can_view } : row);
    });
  };
  const setAll = (value) => {
    setRows(companyPermissionModules.map(([key, label]) => ({
      company_id: selectedCompanyId,
      permission_key: key,
      permission_label: label,
      module_key: key,
      module_label: label,
      can_access: value,
      can_view: value,
      can_create: value,
      can_edit: value,
      can_delete: value,
      can_approve: value,
      can_export: value,
      can_print: value,
      can_manage: value,
      is_enabled: value,
    })));
  };
  const save = async () => {
    try {
      setLoading(true);
      const saved = await companyPermissionsService.bulkSaveCompanyPermissions(selectedCompanyId, rows);
      setRows(saved);
      alert(saved.duplicateCount > 0 ? "تم حفظ صلاحيات الشركة بنجاح. تم تجاهل الصلاحيات المكررة أثناء الحفظ" : "تم حفظ صلاحيات الشركة بنجاح");
    } catch (error) {
      console.error("Company permissions save error:", error);
      alert("فشل حفظ صلاحيات الشركة");
    } finally {
      setLoading(false);
    }
  };
  const reset = async () => {
    if (!confirm("هل تريد إعادة صلاحيات الشركة إلى الإعدادات الافتراضية؟")) return;
    try {
      setLoading(true);
      const saved = await companyPermissionsService.seedDefaultCompanyPermissions(selectedCompanyId);
      setRows(saved);
      alert("تمت إعادة ضبط صلاحيات الشركة");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  const copy = async () => {
    if (!copySource) return alert("اختر الشركة المصدر أولاً");
    if (!confirm("سيتم نسخ صلاحيات الشركة المصدر إلى الشركة الحالية. هل تريد المتابعة؟")) return;
    try {
      setLoading(true);
      const saved = await companyPermissionsService.copyCompanyPermissions(copySource, selectedCompanyId);
      setRows(saved);
      alert("تم نسخ صلاحيات الشركة");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  const sync = async () => {
    try {
      setLoading(true);
      const result = await companyPermissionsService.syncCompanyPermissionsWithPageRegistry(selectedCompanyId);
      setRows(result.rows || []);
      alert(`تمت مزامنة الصلاحيات مع الصفحات بنجاح. تمت إضافة ${result.insertedCount || 0} صلاحية، الإجمالي ${result.totalCount || 0}.`);
    } catch (error) {
      alert(error.message || "فشل مزامنة الصلاحيات مع الصفحات");
    } finally {
      setLoading(false);
    }
  };
  const filterOptions = [
    ["all", "الكل"],
    ["enabled", "مفعلة"],
    ["disabled", "معطلة"],
    ["core", "أساسية"],
    ["duplicate", "مكررة"],
    ["reports", "تقارير"],
    ["hr", "موارد بشرية"],
    ["financial", "مالية"],
    ["inventory", "مخزون"],
    ["settings", "إعدادات"],
  ];
  const visibleRows = mergeWithDefaultCompanyPermissions(rows, selectedCompanyId).filter((row) => {
    const text = `${row.permission_label} ${row.module_label} ${row.permission_key} ${row.group_label}`.toLowerCase();
    const matchesQuery = !query || text.includes(query.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "enabled" && row.is_enabled && row.can_access) ||
      (filter === "disabled" && (!row.is_enabled || !row.can_access)) ||
      (filter === "duplicate" && row.is_duplicate_allowed) ||
      row.group_key === filter;
    return matchesQuery && matchesFilter;
  });
  return (
    <div className="panel p-4">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Label t="اختر الشركة">
          <select value={selectedCompanyId || ""} onChange={(e) => onSelectCompany(e.target.value)} className="field mt-2 min-w-[260px]">
            {companies.map((company) => <option key={company.company_id} value={company.company_id}>{company.company_code} - {company.company_name}</option>)}
          </select>
        </Label>
        <Label t="نسخ الصلاحيات من شركة">
          <select value={copySource} onChange={(e) => setCopySource(e.target.value)} className="field mt-2 min-w-[240px]">
            <option value="">اختر المصدر...</option>
            {companies.filter((company) => company.company_id !== selectedCompanyId).map((company) => <option key={company.company_id} value={company.company_id}>{company.company_code} - {company.company_name}</option>)}
          </select>
        </Label>
        <button onClick={copy} disabled={!selectedCompanyId || !copySource || loading} className="btn-secondary">نسخ الصلاحيات</button>
        <button onClick={sync} disabled={!selectedCompanyId || loading} className="btn-secondary">مزامنة الصلاحيات مع الصفحات</button>
        <button onClick={() => setAll(true)} disabled={!selectedCompanyId || loading} className="btn-secondary">تحديد الكل</button>
        <button onClick={() => setAll(false)} disabled={!selectedCompanyId || loading} className="btn-secondary">مسح الكل</button>
        <button onClick={reset} disabled={!selectedCompanyId || loading} className="btn-secondary">إعادة الافتراضي</button>
        <button onClick={save} disabled={!selectedCompanyId || loading} className="btn-primary"><Save size={17} /> حفظ الصلاحيات</button>
      </div>
      <div className="mb-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
        الشركة الحالية: <b>{selectedCompany?.company_name || "غير محدد"}</b>. تعطيل أي وحدة هنا يمنع ظهورها في القائمة حتى لو كان الدور يملك صلاحيتها.
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="field min-w-[260px] flex-1" placeholder="ابحث عن صفحة أو صلاحية" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="field max-w-[220px]">
          {filterOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>
      {loading ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">جاري تحميل صلاحيات الشركة...</p> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الصفحة</th>
                <th>المجموعة</th>
                <th>مفتاح الصلاحية</th>
                {companyPermissionActions.map(([, label]) => <th key={label}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.permission_key}>
                  <td><b>{row.module_label || row.permission_label}</b>{row.is_duplicate_allowed && <p className="text-xs text-amber-600">صفحة مكررة مسموحة</p>}</td>
                  <td>{row.group_label || row.group_key}</td>
                  <td className="font-mono text-xs">{row.permission_key}</td>
                  {companyPermissionActions.map(([key]) => (
                    <td key={key} className="text-center">
                      <input
                        type="checkbox"
                        checked={key === "can_access" ? row.can_access && row.is_enabled : Boolean(row[key])}
                        onChange={(e) => updateRow(row.permission_key, key, e.target.checked)}
                        className="h-4 w-4 accent-red-800"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompanyThemeFields({ theme, setTheme, onSave, onReset, canSave = false }) {
  const normalized = normalizeThemePayload(theme || {});
  const colorFields = [
    ["primary_color", "اللون الأساسي"],
    ["secondary_color", "اللون الثانوي"],
    ["accent_color", "لون التمييز"],
    ["sidebar_bg_color", "لون خلفية القائمة الجانبية"],
    ["sidebar_text_color", "لون نص القائمة الجانبية"],
    ["button_color", "لون الأزرار"],
    ["button_text_color", "لون نص الأزرار"],
    ["card_accent_color", "لون بطاقات الإحصائيات"],
    ["table_header_color", "لون رأس الجداول"],
    ["report_header_color", "لون رأس التقارير"],
  ];
  const preview = () => {
    const next = normalizeThemePayload(theme || {});
    applyCompanyTheme(next);
    alert("تمت معاينة الثيم");
  };
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h3 className="text-lg font-extrabold">ألوان الثيم</h3>
          <p className="mt-1 text-xs text-slate-500">تطبق الألوان على القائمة الجانبية والأزرار والبطاقات ورؤوس التقارير.</p>
        </div>
        <select
          className="field mr-auto max-w-[240px]"
          onChange={(e) => {
            const preset = themePresets.find(([name]) => name === e.target.value)?.[1];
            if (preset) setTheme({ ...getDefaultTheme(), ...preset, button_color: preset.primary_color, report_header_color: preset.primary_color });
          }}
          defaultValue=""
        >
          <option value="">اختر قالب ألوان...</option>
          {themePresets.map(([name]) => <option key={name}>{name}</option>)}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {colorFields.map(([key, label]) => (
          <Label key={key} t={label}>
            <input type="color" value={normalized[key]} onChange={(e) => setTheme({ [key]: e.target.value })} className="field mt-2" />
          </Label>
        ))}
        <Label t="وضع الثيم">
          <select value={normalized.theme_mode} onChange={(e) => setTheme({ theme_mode: e.target.value })} className="field mt-2">
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </Label>
        <Label t="اسم الثيم">
          <input value={normalized.theme_name} onChange={(e) => setTheme({ theme_name: e.target.value })} className="field mt-2" />
        </Label>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <button type="button" style={{ backgroundColor: normalized.button_color, color: normalized.button_text_color }} className="rounded-xl px-4 py-3 text-sm font-bold">نموذج زر</button>
        <div style={{ backgroundColor: normalized.card_accent_color }} className="rounded-xl p-4 text-sm font-bold">نموذج بطاقة</div>
        <div style={{ backgroundColor: normalized.primary_color, color: normalized.button_text_color }} className="rounded-xl p-4 text-sm font-bold">عنصر قائمة نشط</div>
        <div style={{ backgroundColor: normalized.report_header_color, color: normalized.button_text_color }} className="rounded-xl p-4 text-sm font-bold">رأس تقرير</div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={preview} className="btn-secondary">معاينة الثيم</button>
        {canSave && <button type="button" onClick={onSave} className="btn-primary">حفظ ألوان الثيم</button>}
        {canSave && <button type="button" onClick={onReset} className="btn-secondary">استعادة الألوان الافتراضية</button>}
      </div>
    </div>
  );
}

function EmployeePortal({ employees, evaluations, settings, setSettings, onLogout }) {
  const employeeId = localStorage.getItem("ep_employee_id");
  const employee = employees.find((item) => item.id === employeeId);
  const ownEvaluations = evaluations
    .filter((item) => item.employeeId === employeeId)
    .sort((a, b) => b.month.localeCompare(a.month));
  const latest = ownEvaluations[0];
  const [objection, setObjection] = useState("");
  const [sent, setSent] = useState(false);
  if (!employee)
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center p-6">
        <div className="panel max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto text-amber-500" size={40} />
          <h1 className="mt-4 text-xl font-extrabold">الحساب غير مرتبط بموظف</h1>
          <p className="mt-2 text-sm text-slate-500">اطلب من مدير النظام ربط الحساب برقم الموظف.</p>
          <button onClick={onLogout} className="btn-primary mt-5">تسجيل الخروج</button>
        </div>
      </div>
    );
  const submitObjection = () => {
    if (!objection.trim()) return;
    const old = settings.objections || [];
    setSettings({
      ...settings,
      objections: [
        ...old,
        {
          id: Date.now(),
          employeeId,
          evaluationId: latest?.id,
          text: objection.trim(),
          status: "قيد المراجعة",
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setObjection("");
    setSent(true);
  };
  return (
    <div dir="rtl" className="min-h-screen bg-[#f6f7f9]">
      <header className="flex h-20 items-center border-b bg-white px-5 md:px-10">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-700 text-white">
          <Banknote />
        </div>
        <div className="mr-3">
          <h1 className="font-extrabold">بوابة الموظف</h1>
          <p className="text-xs text-slate-500">عرض فقط — لا يمكن تعديل البيانات</p>
        </div>
        <button onClick={onLogout} className="btn-secondary mr-auto">
          <LogOut size={17} /> تسجيل الخروج
        </button>
      </header>
      <main className="mx-auto max-w-5xl space-y-5 p-5 md:p-8">
        <div className="panel flex flex-wrap items-center gap-4 p-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-xl font-extrabold text-brand-700">
            {employee.name
              .split(" ")
              .slice(0, 2)
              .map((x) => x[0])
              .join("")}
          </div>
          <div>
            <h2 className="text-xl font-extrabold">{employee.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {employee.id} • {employee.job} • {employee.branch}
            </p>
          </div>
          <Status>{employee.status}</Status>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Mini
            label="آخر تقييم"
            value={latest ? `${latest.total}%` : "—"}
            I={Star}
          />
          <Mini
            label="تصنيف الأداء"
            value={latest ? classify(latest.total) : "—"}
            I={BadgeCheck}
          />
          <Mini
            label="شهر التقييم"
            value={latest?.month || "—"}
            I={CalendarCheck}
          />
        </div>
        <div className="panel p-6">
          <h3 className="font-extrabold">ملاحظات التقييم</h3>
          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            {latest?.notes || "لا توجد ملاحظات مسجلة."}
          </p>
        </div>
        <div className="panel p-6">
          <h3 className="font-extrabold">تقديم اعتراض أو طلب مراجعة</h3>
          <textarea
            value={objection}
            onChange={(e) => {
              setObjection(e.target.value);
              setSent(false);
            }}
            rows="4"
            className="field mt-4 !h-auto py-3"
            placeholder="اكتب سبب طلب المراجعة..."
          />
          <div className="mt-3 flex items-center gap-3">
            <button onClick={submitObjection} className="btn-primary">إرسال الطلب</button>
            {sent && (
              <span className="text-sm font-bold text-emerald-600">تم إرسال طلب المراجعة.</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
function Dashboard({ employees, evaluations, setPage, settings }) {
  const avg = Math.round(evaluations.reduce((sum, item) => sum + Number(item.total || 0), 0) / Math.max(evaluations.length, 1));
  const active = employees.filter((e) => e.status === "نشط").length;
  const weak = evaluations.filter((e) => Number(e.total || 0) < 60).length;
  const incentivesTotal = calcIncentives(employees, evaluations).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const top = [...evaluations].sort((a, b) => Number(b.total || 0) - Number(a.total || 0))[0];
  const topEmployee = employees.find((e) => e.id === top?.employeeId || e.id === top?.employee_id);
  const branchData = branches.map((branch) => {
    const ids = employees.filter((e) => e.branch === branch).map((e) => e.id);
    const rows = evaluations.filter((e) => ids.includes(e.employeeId || e.employee_id));
    return { name: branch, avg: Math.round(rows.reduce((s, e) => s + Number(e.total || 0), 0) / Math.max(rows.length, 1)) };
  });
  const dist = ["ممتاز", "جيد جدًا", "جيد", "مقبول", "ضعيف"].map((name) => ({ name, value: evaluations.filter((e) => classify(e.total) === name).length }));
  const cards = [
    ["إجمالي الموظفين", employees.length, Users, "bg-blue-50 text-blue-600"],
    ["الموظفون النشطون", active, UserCheck, "bg-emerald-50 text-emerald-600"],
    ["متوسط تقييم الشركة", `${avg}%`, Star, "bg-amber-50 text-amber-600"],
    ["مستحقو الحافز", evaluations.filter((e) => e.total >= 70).length, Gift, "bg-violet-50 text-violet-600"],
    ["الموظفون الضعفاء", weak, AlertTriangle, "bg-red-50 text-red-600"],
    ["إجمالي الحوافز", money(incentivesTotal), Wallet, "bg-brand-50 text-brand-700"],
    ["عدد المخالفات", "8", MessageSquareWarning, "bg-orange-50 text-orange-600"],
    ["نسبة الانضباط", "94%", CalendarCheck, "bg-teal-50 text-teal-600"],
  ];
  return (
    <div className="space-y-6">
      <PageHead title={`صباح الخير، ${settings.manager.name.split(" ")[0]} 👋`} desc="هذا ملخص أداء الشركة لشهر يونيو 2026" action={<button onClick={() => setPage("reports")} className="btn-primary"><FileBarChart size={17} /> التقرير الشهري</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, I, color]) => <div key={label} className="panel flex items-center gap-4 p-5"><div className={`grid h-12 w-12 place-items-center rounded-xl ${color}`}><I size={22} /></div><div><p className="text-xs font-bold text-slate-500">{label}</p><b className="mt-1 block text-2xl">{value}</b></div></div>)}</div>
      <div className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]"><Chart title="متوسط تقييم الموظفين حسب الفروع" sub="مقارنة النتائج المعتمدة"><ResponsiveContainer width="100%" height={280}><BarChart data={branchData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="avg" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart><Chart title="توزيع تصنيفات الأداء" sub="إجمالي الموظفين المقيمين"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={dist} innerRadius={58} outerRadius={88} paddingAngle={4} dataKey="value">{dist.map((_, i) => <Cell key={i} fill={["#16a34a", "#2563eb", "#0ea5e9", "#f59e0b", "#ef4444"][i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Chart></div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><Chart title="تطور الأداء الشهري" sub="آخر ستة أشهر"><ResponsiveContainer width="100%" height={250}><AreaChart data={[["يناير", 76], ["فبراير", 79], ["مارس", 78], ["أبريل", 82], ["مايو", 84], ["يونيو", avg]].map(([month, value]) => ({ month, value }))}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" axisLine={false} /><YAxis domain={[50, 100]} /><Tooltip /><Area type="monotone" dataKey="value" stroke="#7f1d1d" fill="#fee2e2" /></AreaChart></ResponsiveContainer></Chart><div className="panel overflow-hidden"><div className="bg-gradient-to-br from-brand-800 to-brand-700 p-6 text-white"><div className="flex justify-between"><span>موظف الشهر</span><Trophy className="text-amber-300" /></div><div className="mt-5 flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-xl font-bold">{topEmployee?.name?.[0] || "—"}</div><div><h3 className="text-xl font-extrabold">{topEmployee?.name || "لا توجد بيانات"}</h3><p className="text-sm text-red-100">{topEmployee?.branch || ""}</p></div></div></div><div className="p-5"><div className="flex justify-between"><span>التقييم النهائي</span><b className="text-2xl text-brand-700">{top?.total || 0}%</b></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-700" style={{ width: `${top?.total || 0}%` }} /></div></div></div></div>
    </div>
  );
}
function EnterpriseDashboardWidgets({ employees, evaluations }) {
  const [guarantees, setGuarantees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentEmployees, setAssignmentEmployees] = useState([]);
  useEffect(() => {
    const load = () =>
      Promise.all([
        guaranteesService.list().catch(() => []),
        overtimeService.listAssignments().catch(() => []),
        overtimeService.listAssignmentEmployees().catch(() => []),
      ]).then(([g, a, ae]) => {
        setGuarantees(g);
        setAssignments(a);
        setAssignmentEmployees(ae);
      });
    load();
    const u1 = guaranteesService.subscribe(load);
    const u2 = overtimeService.subscribeAssignments(load);
    const u3 = overtimeService.subscribeAssignmentEmployees(load);
    return () => { u1?.(); u2?.(); u3?.(); };
  }, []);
  const validGuaranteeEmployeeIds = new Set(guarantees.filter((g) => g.guarantee_status === "سارية").map((g) => g.employee_id));
  const overtimeRows = assignmentEmployees.map((row) => ({ ...assignments.find((a) => a.assignment_id === row.assignment_id), ...row }));
  const overtimeHours = overtimeRows.reduce((sum, row) => {
    if (!row.start_time || !row.end_time) return sum;
    const [sh, sm] = row.start_time.split(":").map(Number);
    const [eh, em] = row.end_time.split(":").map(Number);
    return sum + Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  }, 0);
  const mostBranch = Object.entries(groupCount(overtimeRows, "branch")).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const mostEmployee = Object.entries(groupCount(overtimeRows, "employee_name")).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const guaranteeStatusChart = Object.entries(groupCount(guarantees, "guarantee_status")).map(([name, value]) => ({ name, value }));
  const overtimeBranchChart = Object.entries(groupCount(overtimeRows, "branch")).map(([name, value]) => ({ name, value }));
  const overtimeMonthChart = Object.entries(groupCount(overtimeRows.map((r) => ({ ...r, month: String(r.assignment_date || "").slice(0, 7) })), "month")).map(([name, value]) => ({ name, value }));
  const extraCards = [
    ["الموظفون الموقوفون", employees.filter((e) => e.status === "موقوف").length, AlertTriangle],
    ["الموظفون بدون ضمانة", employees.filter((e) => !validGuaranteeEmployeeIds.has(e.id)).length, ShieldCheck],
    ["إجمالي الضمانات", guarantees.length, ShieldCheck],
    ["ضمانات تحتاج مراجعة", guarantees.filter((g) => ["ناقصة", "منتهية"].includes(g.guarantee_status) || g.approval_status === "قيد المراجعة").length, AlertTriangle],
    ["تكليفات العمل الإضافي", assignments.length, Clock3],
    ["ساعات العمل الإضافي", overtimeHours.toFixed(1), Gauge],
    ["أكثر فرع لديه عمل إضافي", mostBranch, Building2],
    ["أكثر موظف تم تكليفه", mostEmployee, UserCheck],
    ["تكليفات قيد الاعتماد", assignments.filter((a) => a.approval_status === "قيد المراجعة").length, BadgeCheck],
    ["أصحاب الأداء الضعيف", evaluations.filter((e) => e.total < 60).length, AlertTriangle],
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {extraCards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Chart title="العمل الإضافي حسب الفرع" sub="عدد التكليفات المسجلة">
          <ResponsiveContainer width="100%" height={220}><BarChart data={overtimeBranchChart}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
        </Chart>
        <Chart title="العمل الإضافي حسب الشهر" sub="مقارنة شهرية للتكليفات">
          <ResponsiveContainer width="100%" height={220}><BarChart data={overtimeMonthChart}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#991b1b" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
        </Chart>
        <Chart title="الضمانات حسب الحالة" sub="توزيع حالات الضمانات">
          <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={guaranteeStatusChart} dataKey="value" innerRadius={55} outerRadius={85}>{["#059669", "#dc2626", "#f59e0b", "#64748b"].map((c) => <Cell key={c} fill={c} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
        </Chart>
      </div>
    </div>
  );
}
function Chart({ title, sub, children }) {
  return (
    <section className="panel p-5">
      <div className="mb-5 flex justify-between">
        <div>
          <h3 className="font-extrabold">{title}</h3>
          <p className="mt-1 text-xs text-slate-400">{sub}</p>
        </div>
        <MoreHorizontal className="text-slate-400" />
      </div>
      {children}
    </section>
  );
}
function Employees({ employees, setEmployees }) {
  const [q, setQ] = useState(""),
    [branch, setBranch] = useState("الكل"),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    filtered = employees.filter(
      (e) =>
        (e.name.includes(q) || e.id.toLowerCase().includes(q.toLowerCase())) &&
        (branch === "الكل" || e.branch === branch),
    );
  return (
    <div className="space-y-5">
      <PageHead
        title="سجل الموظفين"
        desc={`إدارة بيانات ${employees.length} موظف في جميع الفروع`}
        action={
          <button
            onClick={() => {
              setEditing(null);
              setModal(true);
            }}
            className="btn-primary"
          >
            <Plus size={18} /> إضافة موظف
          </button>
        }
      />
      <div className="panel p-4">
        <div className="flex flex-wrap gap-3">
          <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-xl border px-3">
            <Search size={17} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full outline-none"
              placeholder="اكتب سبب طلب المراجعة..."
            />
          </label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="field max-w-[190px]"
          >
            <option>الكل</option>
            {branches.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button
            onClick={() => exportExcel(filtered, "الموظفون")}
            className="btn-secondary"
          >
            <FileSpreadsheet size={17} /> تصدير Excel
          </button>
          <label className="btn-secondary cursor-pointer">
            <Upload size={17} /> استيراد
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => importEmployees(e, setEmployees)}
            />
          </label>
        </div>
      </div>
      <div className="panel p-4">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>الفرع</th>
                <th>الوظيفة</th>
                <th>تاريخ التعيين</th>
                <th>الراتب</th>
                <th>الحالة</th>
                <th>المدير المباشر</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-brand-700">
                        {e.name
                          .split(" ")
                          .slice(0, 2)
                          .map((x) => x[0])
                          .join("")}
                      </div>
                      <div>
                        <b>{e.name}</b>
                        <p className="text-xs text-slate-400">
                          {e.id} • {e.phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{e.branch}</td>
                  <td>{e.job}</td>
                  <td>{e.hireDate}</td>
                  <td className="font-bold">{money(e.salary)}</td>
                  <td>
                    <Status>{e.status}</Status>
                  </td>
                  <td>{e.manager}</td>
                  <td>
                    <button
                      onClick={() => {
                        setEditing(e);
                        setModal(true);
                      }}
                      className="p-2 text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() =>
                        confirm("هل تريد حذف الموظف؟") &&
                        setEmployees((x) => x.filter((v) => v.id !== e.id))
                      }
                      className="p-2 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          عرض {filtered.length} من {employees.length} موظف
        </p>
      </div>
      {modal && (
        <EmployeeModal
          employee={editing}
          close={() => setModal(false)}
          save={(d) => {
            setEmployees((list) =>
              editing
                ? list.map((e) => (e.id === editing.id ? d : e))
                : [d, ...list],
            );
            setModal(false);
          }}
        />
      )}
    </div>
  );
}
function EmployeeModal({ employee, editing, close, save, setEmployees, branchOptions = branches, jobOptions = jobs, managerOptions = [] }) {
  const currentEmployee = employee || editing;
  const availableBranches = [...new Set([currentEmployee?.branch, ...(branchOptions || []), ...branches].filter(Boolean))];
  const availableJobs = [...new Set([currentEmployee?.job, ...(jobOptions || []), ...jobs].filter(Boolean))];
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState(
    currentEmployee || {
      id: `EMP-${Date.now().toString().slice(-4)}`,
      name: "",
      branch: availableBranches[0] || "",
      job: availableJobs[0] || "",
      hireDate: new Date().toISOString().slice(0, 10),
      salary: 5000,
      phone: "05",
      status: "نشط",
      manager: "",
    },
  );
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const payload = {
            id: f.id,
            name: f.name,
            branch: f.branch,
            job: f.job,
            hire_date: f.hireDate,
            salary: Number(f.salary || 0),
            phone: f.phone,
            status: f.status,
            manager: f.manager,
          };
          setSaving(true);
          try {
            const { data, error } = await supabase.from("employees").upsert(payload, { onConflict: "id" }).select().single();
            if (error) {
              console.error("Supabase employees load/save error:", error);
              alert(error.message);
              return;
            }
            if (!data) {
              throw new Error("لم يرجع Supabase بيانات الموظف بعد الحفظ");
            }
            const savedEmployee = {
              id: data.id,
              name: data.name,
              branch: data.branch,
              job: data.job,
              hireDate: data.hire_date,
              salary: Number(data.salary || 0),
              phone: data.phone || "",
              status: data.status || "نشط",
              manager: data.manager || "",
            };
            if (save) {
              save(savedEmployee);
            } else {
              setEmployees?.((list) => {
                const exists = list.some((item) => item.id === savedEmployee.id);
                return exists
                  ? list.map((item) => (item.id === savedEmployee.id ? savedEmployee : item))
                  : [savedEmployee, ...list];
              });
              close();
          }
        } catch (error) {
            console.error("Supabase employees load/save error:", error);
            alert(error.message || "تعذر حفظ بيانات الموظف");
          } finally {
            setSaving(false);
          }
        }}
        className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
      >
        <div className="mb-6 flex">
          <h3 className="text-xl font-extrabold">
            {currentEmployee ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
          </h3>
          <button type="button" onClick={close} className="mr-auto">
            <X />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["id", "رقم الموظف"],
            ["name", "اسم الموظف"],
            ["hireDate", "تاريخ التعيين", "date"],
            ["salary", "الراتب", "number"],
            ["phone", "رقم الهاتف"],
            ["manager", "المدير المباشر"],
          ].map(([k, l, t]) => (
            <Label key={k} t={l}>
              <input
                required
                type={t || "text"}
                list={k === "manager" ? "employee-manager-options" : undefined}
                value={f[k]}
                onChange={(e) => setF({ ...f, [k]: e.target.value })}
                className="field mt-2"
              />
            </Label>
          ))}
          <datalist id="employee-manager-options">{managerOptions.filter((name) => name && name !== f.name).map((name) => <option key={name} value={name} />)}</datalist>
          <Label t="الفرع">
            <select
              value={f.branch}
              onChange={(e) => setF({ ...f, branch: e.target.value })}
              className="field mt-2"
            >
              {availableBranches.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Label>
          <Label t="الوظيفة">
            <select
              value={f.job}
              onChange={(e) => setF({ ...f, job: e.target.value })}
              className="field mt-2"
            >
              {availableJobs.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Label>
          <Label t="الحالة">
            <select
              value={f.status}
              onChange={(e) => setF({ ...f, status: e.target.value })}
              className="field mt-2"
            >
              <option>نشط</option>
              <option>إجازة</option>
              <option>موقوف</option>
            </select>
          </Label>
        </div>
        <div className="mt-7 flex justify-end gap-2">
          <button type="button" onClick={close} className="btn-secondary">
            إلغاء
          </button>
          <button disabled={saving} className="btn-primary">
            <Save size={17} /> حفظ البيانات
          </button>
        </div>
      </form>
    </div>
  );
}
function Templates() {
  const [job, setJob] = useState(jobs[0]);
  return (
    <div className="space-y-5">
      <PageHead
        title="نماذج التقييم"
        desc="نماذج مرنة ومخصصة لكل وظيفة"
        action={
          <button className="btn-primary">
            <Plus size={17} /> نموذج جديد
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {jobs.map((x) => (
          <button
            onClick={() => setJob(x)}
            key={x}
            className={`panel p-4 text-right ${job === x ? "border-brand-700 ring-2 ring-brand-100" : ""}`}
          >
            <div
              className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${job === x ? "bg-brand-700 text-white" : "bg-slate-100"}`}
            >
              <BriefcaseBusiness size={19} />
            </div>
            <b className="text-sm">{x}</b>
            <p className="mt-1 text-[11px] text-slate-400">
              10 معايير • 100 نقطة
            </p>
          </button>
        ))}
      </div>
      <div className="panel p-5">
        <div className="mb-5 flex justify-between">
          <div>
            <h3 className="text-lg font-extrabold">نموذج تقييم: {job}</h3>
            <p className="text-xs text-slate-500">
              الأوزان موزعة على معايير الأداء الأساسية
            </p>
          </div>
          <button className="btn-secondary">
            <Pencil size={16} /> تعديل الأوزان
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>معيار التقييم</th>
                <th>الوزن النسبي</th>
                <th>الدرجة القصوى</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c, i) => (
                <tr key={c}>
                  <td>{i + 1}</td>
                  <td className="font-bold">{c}</td>
                  <td>{weights[i]}%</td>
                  <td>5 درجات</td>
                  <td>
                    <Status>نشط</Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function Evaluations({ employees, evaluations, setEvaluations }) {
  const [empId, setEmpId] = useState(employees[0]?.id),
    [month, setMonth] = useState("2026-07"),
    [scores, setScores] = useState(criteria.map(() => 4)),
    [notes, setNotes] = useState(""),
    emp = employees.find((e) => e.id === empId),
    total = Math.round(
      scores.reduce((s, x, i) => s + (Number(x) * weights[i]) / 5, 0),
    );
  useEffect(() => {
    const old = evaluations.find(
      (e) => e.employeeId === empId && e.month === month,
    );
    setScores(old?.scores || criteria.map(() => 4));
    setNotes(old?.notes || "");
  }, [empId, month, evaluations]);
  const save = () => {
    const old = evaluations.find(
        (e) => e.employeeId === empId && e.month === month,
      ),
      record = {
        id: old?.id || `EV-${Date.now()}`,
        employeeId: empId,
        month,
        scores,
        total,
        status: old?.status || "قيد المراجعة",
        notes,
      };
    setEvaluations((list) =>
      old ? list.map((e) => (e.id === old.id ? record : e)) : [record, ...list],
    );
    alert(old ? "تم تعديل التقييم السابق" : "تم حفظ التقييم");
  };
  return (
    <div className="space-y-5">
      <PageHead
        title="تقييم أداء الموظفين"
        desc="إدخال الدرجات واحتساب النتيجة تلقائيًا"
        action={
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer size={17} /> طباعة / PDF
          </button>
        }
      />
      <div className="panel grid gap-4 p-5 md:grid-cols-3">
        <Label t="الموظف">
          <select
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            className="field mt-2"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Label>
        <Label t="شهر التقييم">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="field mt-2"
          />
        </Label>
        <Label t="الوظيفة">
          <input
            value={emp?.job || ""}
            disabled
            className="field mt-2 bg-slate-50"
          />
        </Label>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_290px]">
        <div className="panel p-5">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>المعيار</th>
                  <th>الوزن</th>
                  <th>الدرجة من 5</th>
                  <th>النتيجة</th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((c, i) => (
                  <tr key={c}>
                    <td className="font-bold">{c}</td>
                    <td>{weights[i]}%</td>
                    <td>
                      <select
                        value={scores[i]}
                        onChange={(e) =>
                          setScores(
                            scores.map((x, j) =>
                              j === i ? Number(e.target.value) : x,
                            ),
                          )
                        }
                        className="field !h-9 !w-24"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </td>
                    <td className="font-bold text-brand-700">
                      {(scores[i] * weights[i]) / 5} / {weights[i]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Label t="ملاحظات المدير">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className="field mt-2 !h-auto py-3"
            />
          </Label>
        </div>
        <div className="space-y-4">
          <div className="panel p-6 text-center">
            <div className="mx-auto mb-4 grid h-32 w-32 place-items-center rounded-full border-[10px] border-brand-100">
              <b className="text-4xl text-brand-700">{total}%</b>
            </div>
            <Status>{classify(total)}</Status>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              محسوب حسب نموذج وظيفة {emp?.job}
            </p>
          </div>
          <button onClick={save} className="btn-primary h-12 w-full">
            <Save size={18} /> حفظ التقييم
          </button>
          <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
            وجود تقييم لنفس الشهر يؤدي إلى تعديل السجل السابق، لا إنشاء نسخة
            مكررة.
          </p>
        </div>
      </div>
    </div>
  );
}
function Productivity({ employees }) {
  const list = employees.filter((e) =>
      ["كاشير", "خدمة عملاء وتحويلات واتس", "عمليات مصرفية"].includes(e.job),
    ),
    [v, setV] = useState({
      receive: 142,
      pay: 168,
      sell: 46,
      buy: 39,
      errors: 2,
      complaints: 1,
      time: 7,
    }),
    score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (v.receive + v.pay + v.sell + v.buy) / 5 -
            v.errors * 4 -
            v.complaints * 5 -
            v.time,
        ),
      ),
    );
  return (
    <Entry
      title="مؤشرات الإنتاجية"
      desc="قياس حجم العمليات وجودتها وسرعة الإنجاز"
    >
      <Label t="الموظف">
        <select className="field mt-2 max-w-md">
          {list.map((e) => (
            <option key={e.id}>
              {e.name} — {e.job}
            </option>
          ))}
        </select>
      </Label>
      <Fields
        values={v}
        set={setV}
        items={[
          ["receive", "عمليات قبض الحوالات"],
          ["pay", "عمليات صرف الحوالات"],
          ["sell", "عمليات بيع العملات"],
          ["buy", "عمليات شراء العملات"],
          ["errors", "عدد الأخطاء"],
          ["complaints", "شكاوى العملاء"],
          ["time", "متوسط وقت الخدمة (دقيقة)"],
        ]}
      />
      <Score n={score} label="نقاط الإنتاجية" />
      <button className="btn-primary">
        <Save size={17} /> حفظ مؤشرات الشهر
      </button>
    </Entry>
  );
}
function Discipline({ employees }) {
  const [v, setV] = useState({
      present: 25,
      absent: 1,
      late: 18,
      early: 0,
      violations: 0,
      penalties: 0,
    }),
    score = Math.max(
      0,
      100 -
        v.absent * 7 -
        Math.ceil(v.late / 15) * 2 -
        v.early * 3 -
        v.violations * 8 -
        v.penalties * 10,
    );
  return (
    <Entry title="الانضباط الوظيفي" desc="متابعة الحضور والتأخير والمخالفات">
      <Label t="الموظف">
        <select className="field mt-2 max-w-md">
          {employees.map((e) => (
            <option key={e.id}>{e.name}</option>
          ))}
        </select>
      </Label>
      <Fields
        values={v}
        set={setV}
        items={[
          ["present", "أيام الحضور"],
          ["absent", "أيام الغياب"],
          ["late", "التأخير بالدقائق"],
          ["early", "الانصراف المبكر"],
          ["violations", "المخالفات"],
          ["penalties", "الجزاءات"],
        ]}
      />
      <Label t="ملاحظات الموارد البشرية">
        <textarea className="field mt-2 !h-auto py-3" rows="3" />
      </Label>
      <Score n={score} label="درجة الانضباط" />
      <button className="btn-primary">
        <Save size={17} /> حفظ سجل الانضباط
      </button>
    </Entry>
  );
}
function Fields({ values, set, items }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map(([k, l]) => (
        <Label key={k} t={l}>
          <input
            type="number"
            value={values[k]}
            onChange={(e) => set({ ...values, [k]: Number(e.target.value) })}
            className="field mt-2"
          />
        </Label>
      ))}
    </div>
  );
}
function Entry({ title, desc, children }) {
  return (
    <div className="space-y-5">
      <PageHead title={title} desc={desc} />
      <div className="panel space-y-6 p-6">{children}</div>
    </div>
  );
}
function Score({ n, label }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-700 text-xl font-bold text-white">
        {n}
      </div>
      <div>
        <b>{label}</b>
        <p className="text-xs text-slate-500">
          يتم تحديثها تلقائيًا حسب البيانات المدخلة
        </p>
      </div>
      <Status>{classify(n)}</Status>
    </div>
  );
}
function calcIncentives(employees, evaluations) {
  return evaluations.map((ev) => {
    const e = employees.find((x) => x.id === ev.employeeId),
      cat = classify(ev.total),
      rate =
        cat === "ممتاز"
          ? 0.1
          : cat === "جيد جدًا"
            ? 0.07
            : cat === "جيد"
              ? 0.04
              : 0;
    return {
      ...e,
      total: ev.total,
      rate,
      amount: (e?.salary || 0) * rate * (ev.total / 100),
      approval: ev.status,
    };
  });
}
function calcIncentivesSafe(employees, evaluations) {
  return evaluations.map((ev) => {
    const employee = employees.find((x) => x.id === ev.employeeId) || {};
    const total = effectiveEvaluationTotal(ev);
    const cat = classify(total);
    const rate = cat === "ممتاز" ? 0.1 : cat === "جيد جدًا" ? 0.07 : cat === "جيد" ? 0.04 : 0;
    return {
      ...employee,
      evaluation: ev,
      total,
      rate,
      amount: (employee.salary || 0) * rate * (total / 100),
      approval: ev.status,
    };
  });
}
function Incentives({ employees, evaluations, setEvaluations }) {
  const data = calcIncentives(employees, evaluations);
  return (
    <div className="space-y-5">
      <PageHead
        title="الحوافز والمكافآت"
        desc="احتساب آلي وفق الراتب والتقييم ونسبة الحافز"
        action={
          <button
            onClick={() => exportExcel(data, "الحوافز")}
            className="btn-primary"
          >
            <Download size={17} /> تصدير الكشف
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Mini
          label="إجمالي الحوافز"
          value={money(data.reduce((s, x) => s + x.amount, 0))}
          I={CircleDollarSign}
        />
        <Mini
          label="المستحقون"
          value={data.filter((x) => x.rate > 0).length}
          I={UserCheck}
        />
        <Mini
          label="بانتظار الاعتماد"
          value={evaluations.filter((x) => x.status === "قيد المراجعة").length}
          I={Clock3}
        />
      </div>
      <div className="panel p-4">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>الفرع</th>
                <th>الوظيفة</th>
                <th>الراتب</th>
                <th>التقييم</th>
                <th>النسبة</th>
                <th>الحافز المقترح</th>
                <th>الاعتماد</th>
              </tr>
            </thead>
            <tbody>
              {data.map((x) => (
                <tr key={x.id + x.total}>
                  <td className="font-bold">{x.name}</td>
                  <td>{x.branch}</td>
                  <td>{x.job}</td>
                  <td>{money(x.salary)}</td>
                  <td>
                    <Status>{classify(x.total)}</Status> {x.total}%
                  </td>
                  <td>{x.rate * 100}%</td>
                  <td className="font-extrabold text-brand-700">
                    {money(x.amount)}
                  </td>
                  <td>
                    <select
                      value={x.approval}
                      onChange={(e) =>
                        setEvaluations((list) =>
                          list.map((ev) =>
                            ev.employeeId === x.id
                              ? { ...ev, status: e.target.value }
                              : ev,
                          ),
                        )
                      }
                      className="field !h-9 !w-32"
                    >
                      <option>قيد المراجعة</option>
                      <option>معتمد</option>
                      <option>مرفوض</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function TopEmployees({ employees, evaluations }) {
  const winners = branches.map((b) => {
      const ids = employees.filter((e) => e.branch === b).map((e) => e.id),
        ev = [...evaluations]
          .filter((e) => ids.includes(e.employeeId))
          .sort((a, z) => z.total - a.total)[0];
      return {
        ...employees.find((e) => e.id === ev?.employeeId),
        total: ev?.total || 0,
      };
    }),
    best = [...winners].sort((a, b) => b.total - a.total)[0];
  return (
    <div className="space-y-5">
      <PageHead
        title="موظف الشهر"
        desc="تكريم أصحاب الأداء الأعلى"
        action={
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer size={17} /> طباعة شهادة
          </button>
        }
      />
      <div className="rounded-3xl bg-gradient-to-l from-brand-900 to-[#26151a] p-8 text-white">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="grid h-28 w-28 place-items-center rounded-full border-4 border-amber-300 bg-white/10 text-3xl font-bold">
            {best.name
              ?.split(" ")
              .slice(0, 2)
              .map((x) => x[0])
              .join("")}
          </div>
          <div>
            <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">
              الأفضل على مستوى الشركة
            </span>
            <h2 className="mt-4 text-3xl font-extrabold">{best.name}</h2>
            <p className="mt-2 text-red-100/70">
              {best.job} • {best.branch}
            </p>
            <p className="mt-4 text-sm text-red-100/80">
              لتميزه في دقة العمل والالتزام وتقديم تجربة استثنائية للعملاء.
            </p>
          </div>
          <b className="sm:mr-auto text-5xl text-amber-300">{best.total}%</b>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {winners.map((x, i) => (
          <div key={x.branch} className="panel p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 font-bold text-brand-700">
                {i + 1}
              </div>
              <div>
                <b>{x.name}</b>
                <p className="text-xs text-slate-500">
                  {x.branch} • {x.job}
                </p>
              </div>
              <b className="mr-auto text-xl text-brand-700">{x.total}%</b>
            </div>
            <div className="mt-4 flex gap-2">
              {["دقة عالية", "خدمة مميزة", "انضباط"].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-slate-100 px-2 py-1 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function Plans({ employees, evaluations }) {
  const weak = evaluations
    .filter((e) => e.total < 70)
    .map((ev) => ({
      ...employees.find((x) => x.id === ev.employeeId),
      total: ev.total,
    }));
  return (
    <div className="space-y-5">
      <PageHead
        title="خطط تحسين الأداء"
        desc="متابعة الموظفين الأقل من 70%"
        action={
          <button className="btn-primary">
            <Plus size={17} /> خطة تحسين
          </button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {weak.map((e) => (
          <div key={e.id} className="panel p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-700">
                <TrendingUp />
              </div>
              <div>
                <b>{e.name}</b>
                <p className="text-xs text-slate-500">
                  {e.job} • {e.branch}
                </p>
              </div>
              <b className="mr-auto text-xl text-red-600">{e.total}%</b>
            </div>
            <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs">
              <Info t="سبب الانخفاض" v="الحاجة لرفع الدقة وسرعة الإنجاز" />
              <Info t="المسؤول" v="مدير الفرع" />
              <Info t="بداية الخطة" v="01 يوليو 2026" />
              <Info t="نهاية الخطة" v="31 يوليو 2026" />
            </div>
            <Status>قيد المراجعة</Status>
          </div>
        ))}
      </div>
    </div>
  );
}
function Reports({ employees, evaluations }) {
  const reps = [
    ["التقرير المالي للأداء الشهري", Wallet],
    ["التقييم الشهري", CalendarCheck],
    ["التقييم حسب الفرع", Building2],
    ["التقييم حسب الوظيفة", BriefcaseBusiness],
    ["تقرير الحوافز", Gift],
    ["الموظفون الضعفاء", AlertTriangle],
    ["أفضل الموظفين", Trophy],
    ["تقرير الانضباط", Clock3],
    ["تقرير المخالفات", MessageSquareWarning],
    ["مقارنة الفروع", FileBarChart],
  ];
  return (
    <div className="space-y-5">
      <PageHead title="مركز التقارير" desc="تقارير جاهزة لاتخاذ القرار" />
      <div className="panel flex flex-wrap gap-3 p-4">
        <select className="field max-w-[180px]">
          <option>يونيو 2026</option>
        </select>
        <select className="field max-w-[190px]">
          <option>جميع الفروع</option>
          {branches.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button className="btn-secondary">
          <Filter size={17} /> تطبيق الفلاتر
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reps.map(([t, I], i) => (
          <div key={t} className="panel p-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-brand-700">
              <I />
            </div>
            <h3 className="mt-4 font-extrabold">{t}</h3>
            <p className="mt-1 text-xs text-slate-500">
              تقرير تفصيلي جاهز للتصدير والطباعة
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() =>
                  exportExcel(
                    i === 3
                      ? calcIncentives(employees, evaluations)
                      : evaluations,
                    t,
                  )
                }
                className="btn-secondary flex-1"
              >
                <FileSpreadsheet size={15} /> Excel
              </button>
              <button
                onClick={() => window.print()}
                className="btn-secondary flex-1"
              >
                <Printer size={15} /> PDF
              </button>
              <button className="btn-secondary !px-3">
                <Eye size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function LegacySettingsPage({ settings, setSettings, setEmployees }) {
  const tabs = [
    ["مدير النظام", UserRoundCog],
    ["الفروع", Building2],
    ["الوظائف", BriefcaseBusiness],
    ["معايير التقييم", ClipboardList],
    ["الصلاحيات", ShieldCheck],
  ];
  const [tab, setTab] = useState("مدير النظام"),
    [edit, setEdit] = useState(null);
  const key =
    tab === "الفروع"
      ? "branches"
      : tab === "الوظائف"
        ? "jobs"
        : tab === "معايير التقييم"
          ? "criteria"
          : "permissions";
  const items = settings[key] || [];
  const updateItem = () => {
    if (!edit) return;
    const old = items[edit.index],
      next = [...items];
    next[edit.index] =
      tab === "الصلاحيات"
        ? { name: edit.name.trim(), description: edit.description.trim() }
        : edit.value.trim();
    if (!next[edit.index] || (tab === "الصلاحيات" && !next[edit.index].name))
      return;
    setSettings({ ...settings, [key]: next });
    if (tab === "الفروع")
      setEmployees((list) =>
        list.map((e) =>
          e.branch === old ? { ...e, branch: next[edit.index] } : e,
        ),
      );
    if (tab === "الوظائف")
      setEmployees((list) =>
        list.map((e) => (e.job === old ? { ...e, job: next[edit.index] } : e)),
      );
    setEdit(null);
  };
  return (
    <div className="space-y-5">
      <PageHead
        title="إعدادات النظام"
        desc="تعديل بيانات النظام والصلاحيات مع الحفظ التلقائي"
      />
      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <div className="panel h-fit p-3">
          {tabs.map(([x, I]) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${tab === x ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <I size={18} />
              {x}
            </button>
          ))}
        </div>
        <div className="panel p-5">
          {settingsError && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">{settingsError}</div>}
          {settingsLoading && <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">جاري تحميل بيانات الإعدادات...</div>}
          {tab === "مدير النظام" ? (
            <div>
              <div className="mb-6 flex items-center gap-4 border-b pb-5">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-700 text-lg font-extrabold text-white">
                  {managerSafe.name
                    .split(" ")
                    .slice(0, 2)
                    .map((x) => x[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">بيانات مدير النظام</h3>
                  <p className="text-xs text-slate-500">
                    تظهر هذه البيانات في الشريط العلوي والقائمة الجانبية
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Label t="اسم مدير النظام">
                  <input
                    value={managerSafe.name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manager: { ...managerSafe, name: e.target.value },
                      })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="اسم المستخدم">
                  <input
                    value={managerSafe.username}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manager: {
                          ...managerSafe,
                          username: e.target.value,
                        },
                      })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="المسمى / الصلاحية">
                  <input
                    value={settings.manager.role}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manager: { ...settings.manager, role: e.target.value },
                      })
                    }
                    className="field mt-2"
                  />
                </Label>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                <span>
                  يتم حفظ التعديلات تلقائيًا في قاعدة البيانات المحلية.
                </span>
                <Save size={18} />
              </div>
            </div>
          ) : isPermission ? (
            <PermissionsMatrix settings={settings} setSettings={setSettings} />
          ) : (
            <div>
              <div className="mb-5">
                <h3 className="text-lg font-extrabold">إدارة {tab}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  اضغط على زر التعديل لتغيير البيانات، وسيُطبّق التغيير في بقية
                  النظام.
                </p>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => {
                  const name = tab === "الصلاحيات" ? item.name : item,
                    description = tab === "الصلاحيات" ? item.description : null;
                  return (
                    <div
                      key={`${name}-${i}`}
                      className="flex items-center rounded-xl border border-slate-200 p-4"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-xs font-bold">
                        {i + 1}
                      </span>
                      <div className="mr-3">
                        <b className="text-sm">{name}</b>
                        {description && (
                          <p className="mt-1 text-xs text-slate-500">
                            {description}
                          </p>
                        )}
                      </div>
                      <button
                        aria-label={`تعديل ${name}`}
                        onClick={() =>
                          setEdit(
                            tab === "الصلاحيات"
                              ? {
                                  index: i,
                                  name: item.name,
                                  description: item.description,
                                }
                              : { index: i, value: item },
                          )
                        }
                        className="mr-auto rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil size={17} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel w-full max-w-md p-6">
            <div className="mb-5 flex items-center">
              <h3 className="text-lg font-extrabold">تعديل {tab}</h3>
              <button onClick={() => setEdit(null)} className="mr-auto">
                <X />
              </button>
            </div>
            {tab === "الصلاحيات" ? (
              <div className="space-y-4">
                <Label t="اسم الصلاحية">
                  <input
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                    className="field mt-2"
                  />
                </Label>
                <Label t="وصف الصلاحية">
                  <textarea
                    value={edit.description}
                    onChange={(e) =>
                      setEdit({ ...edit, description: e.target.value })
                    }
                    rows="3"
                    className="field mt-2 !h-auto py-3"
                  />
                </Label>
              </div>
            ) : (
              <Label
                t={
                  tab === "الفروع"
                    ? "اسم الفرع"
                    : tab === "الوظائف"
                      ? "اسم الوظيفة"
                      : "اسم معيار التقييم"
                }
              >
                <input
                  autoFocus
                  value={edit.value}
                  onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                  className="field mt-2"
                />
              </Label>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEdit(null)} className="btn-secondary">
                إلغاء
              </button>
              <button onClick={updateItem} className="btn-primary">
                <Save size={17} /> حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function SettingsPage({
  settings,
  setSettings,
  employees,
  setEmployees,
  setEvaluations,
  currentUser,
  currentCompany,
  canNode,
}) {
  const tabs = [
    ["مدير النظام", UserRoundCog],
    ["الفروع", Building2],
    ["العملات", CircleDollarSign],
    ["الوظائف", BriefcaseBusiness],
    ["معايير التقييم", ClipboardList],
    ["المستخدمون", Users],
    ["الصلاحيات", ShieldCheck],
    ["إعدادات عامة", Settings],
    ["الثيم والألوان", Settings],
  ];
  const [tab, setTab] = useState("مدير النظام"),
    [selected, setSelected] = useState(null),
    [dialog, setDialog] = useState(null),
    [themeDraft, setThemeDraft] = useState(() => normalizeThemePayload(currentCompany || {})),
    [settingsRows, setSettingsRows] = useState({ branches: [], currencies: [], users: [], system: {} }),
    [settingsLoading, setSettingsLoading] = useState(false),
    [settingsError, setSettingsError] = useState("");
  const currentCompanyId = currentCompany?.company_id || currentUser?.company_id || "";
  const managerSafe = settings?.manager || defaultSettings.manager || { name: "", username: "", role: "مدير النظام" };
  useEffect(() => {
    setThemeDraft(normalizeThemePayload(currentCompany || {}));
  }, [currentCompany?.company_id, currentCompany?.primary_color, currentCompany?.button_color]);
  const loadSettingsCrud = async () => {
    if (!currentCompanyId) {
      setSettingsError("لم يتم تحديد الشركة الحالية");
      return;
    }
    setSettingsLoading(true);
    setSettingsError("");
    try {
      const [branchesRows, currenciesRows, usersRows, systemRow] = await Promise.all([
        settingsBranchesService.loadBranches(currentCompanyId).catch((error) => {
          console.error("Settings CRUD error:", error);
          return [];
        }),
        settingsCurrenciesService.loadCurrencies(currentCompanyId).catch((error) => {
          console.error("Settings CRUD error:", error);
          return [];
        }),
        settingsUsersService.loadUsers(currentCompanyId).catch((error) => {
          console.error("Settings CRUD error:", error);
          return [];
        }),
        systemSettingsService.loadSystemSettings(currentCompanyId).catch((error) => {
          console.error("Settings CRUD error:", error);
          return {};
        }),
      ]);
      setSettingsRows({ branches: branchesRows, currencies: currenciesRows, users: usersRows, system: systemRow });
    } catch (error) {
      console.error("Settings CRUD error:", error);
      setSettingsError(error.message || "تعذر تحميل البيانات");
    } finally {
      setSettingsLoading(false);
    }
  };
  useEffect(() => {
    loadSettingsCrud();
  }, [currentCompanyId]);
  const key =
    tab === "الفروع"
      ? "branches"
      : tab === "العملات"
        ? "currencies"
        : tab === "الوظائف"
          ? "jobs"
          : tab === "معايير التقييم"
            ? "criteria"
            : tab === "المستخدمون"
              ? "users"
            : "permissions";
  const isRemoteBranch = tab === "الفروع";
  const isRemoteCurrency = tab === "العملات";
  const isRemoteUser = tab === "المستخدمون";
  const isGeneralSettings = tab === "إعدادات عامة";
  const items = isRemoteBranch
    ? settingsRows.branches
    : isRemoteCurrency
      ? settingsRows.currencies
      : isRemoteUser
        ? settingsRows.users
        : settings[key] || defaultSettings[key] || [];
  const isPermission = tab === "الصلاحيات";
  const isUser = isRemoteUser;
  const openAdd = () => {
    if (!currentCompanyId && (isRemoteBranch || isRemoteCurrency || isRemoteUser || isGeneralSettings)) return alert("لم يتم تحديد الشركة الحالية");
    setDialog(
      isRemoteBranch
        ? { mode: "add", branch_code: "", branch_name: "", branch_type: "فرع", manager_name: "", phone: "", address: "", city: "", status: "نشط", is_active: true, notes: "" }
        : isRemoteCurrency
          ? { mode: "add", currency_code: "", currency_name: "", currency_symbol: "", exchange_rate: 1, is_default: false, is_active: true, notes: "" }
          : isUser
            ? { mode: "add", name: "", username: "", password: "", role: "الموظف", employee_id: "", employee_name: "", branch: "", job: "", phone: "", email: "", is_active: true }
            : isPermission
              ? { mode: "add", name: "", description: "" }
              : { mode: "add", value: "" },
    );
  };
  const openEdit = () => {
    if (selected === null) return;
    const item = items[selected];
    setDialog(
      isRemoteBranch || isRemoteCurrency || isUser
        ? { mode: "edit", index: selected, ...item }
        : isUser
        ? { mode: "edit", index: selected, ...item }
        : isPermission
        ? {
            mode: "edit",
            index: selected,
            name: item.name,
            description: item.description,
          }
        : { mode: "edit", index: selected, value: item },
    );
  };
  const saveItem = async () => {
    if (!dialog) return;
    if (!currentCompanyId && (isRemoteBranch || isRemoteCurrency || isUser)) return alert("لم يتم تحديد الشركة الحالية");
    try {
      if (isRemoteBranch) {
        if (dialog.mode === "add" && settingsRows.branches.some((row) => String(row.branch_code || "").trim() === String(dialog.branch_code || "").trim())) return alert("لا يمكن تكرار كود الفرع داخل نفس الشركة");
        const saved = dialog.mode === "add"
          ? await settingsBranchesService.createBranch(currentCompanyId, dialog)
          : await settingsBranchesService.updateBranch(currentCompanyId, dialog.id, dialog);
        setSettingsRows((state) => ({ ...state, branches: dialog.mode === "add" ? [saved, ...state.branches] : state.branches.map((row) => row.id === saved.id ? saved : row) }));
        setSettings((state) => ({ ...state, branches: [...new Set([...(state.branches || []), saved.branch_name].filter(Boolean))] }));
        setDialog(null);
        setSelected(null);
        alert(dialog.mode === "add" ? "تم إضافة الفرع بنجاح" : "تم تعديل الفرع بنجاح");
        return;
      }
      if (isRemoteCurrency) {
        if (dialog.mode === "add" && settingsRows.currencies.some((row) => String(row.currency_code || "").trim().toUpperCase() === String(dialog.currency_code || "").trim().toUpperCase())) return alert("كود العملة مستخدم مسبقًا داخل هذه الشركة");
        const saved = dialog.mode === "add"
          ? await settingsCurrenciesService.createCurrency(currentCompanyId, dialog)
          : await settingsCurrenciesService.updateCurrency(currentCompanyId, dialog.id, dialog);
        setSettingsRows((state) => ({ ...state, currencies: dialog.mode === "add" ? [saved, ...state.currencies.map((row) => saved.is_default ? { ...row, is_default: false } : row)] : state.currencies.map((row) => row.id === saved.id ? saved : saved.is_default ? { ...row, is_default: false } : row) }));
        setSettings((state) => ({ ...state, currencies: [...new Set([...(state.currencies || []), saved.currency_code].filter(Boolean))] }));
        setDialog(null);
        setSelected(null);
        alert(dialog.mode === "add" ? "تم إضافة العملة بنجاح" : "تم تعديل العملة بنجاح");
        return;
      }
      if (isUser) {
        if (dialog.mode === "add" && settingsRows.users.some((row) => String(row.username || "").trim() === String(dialog.username || "").trim())) return alert("اسم المستخدم موجود مسبقًا داخل هذه الشركة");
        const saved = dialog.mode === "add"
          ? await settingsUsersService.createUser(currentCompanyId, dialog)
          : await settingsUsersService.updateUser(currentCompanyId, dialog.user_id || dialog.id, dialog);
        setSettingsRows((state) => ({ ...state, users: dialog.mode === "add" ? [saved, ...state.users] : state.users.map((row) => row.user_id === saved.user_id ? saved : row) }));
        setDialog(null);
        setSelected(null);
        alert(dialog.mode === "add" ? "تم إضافة المستخدم بنجاح" : "تم تعديل المستخدم بنجاح");
        return;
      }
    } catch (error) {
      alert(error.message || "تعذر حفظ البيانات");
      return;
    }
    const value = isUser
      ? {
          name: dialog.name.trim(),
          username: dialog.username.trim(),
          password: dialog.password,
          role: dialog.role,
          employeeId: dialog.employeeId,
        }
      : isPermission
        ? { name: dialog.name.trim(), description: dialog.description.trim() }
        : dialog.value.trim();
    if (
      !value ||
      (isPermission && !value.name) ||
      (isUser && (!value.name || !value.username || !value.password))
    )
      return;
    const next = [...items],
      old = dialog.mode === "edit" ? items[dialog.index] : null;
    if (dialog.mode === "add") next.push(value);
    else next[dialog.index] = value;
    setSettings({ ...settings, [key]: next });
    if (dialog.mode === "edit" && tab === "الفروع")
      setEmployees((list) =>
        list.map((e) => (e.branch === old ? { ...e, branch: value } : e)),
      );
    if (dialog.mode === "edit" && tab === "الوظائف")
      setEmployees((list) =>
        list.map((e) => (e.job === old ? { ...e, job: value } : e)),
      );
    if (tab === "معايير التقييم" && dialog.mode === "add")
      setEvaluations((list) =>
        list.map((e) => ({ ...e, scores: [...(e.scores || []), 3] })),
      );
    setDialog(null);
    setSelected(null);
  };
  const deleteItem = async () => {
    if (selected === null) return;
    if (!currentCompanyId && (isRemoteBranch || isRemoteCurrency || isUser)) return alert("لم يتم تحديد الشركة الحالية");
    if (isRemoteBranch) {
      const item = items[selected];
      if ((employees || []).some((employee) => employee.branch === item.branch_name)) return alert("لا يمكن حذف الفرع لأنه مرتبط بموظفين، يمكنك تعطيله بدلًا من الحذف.");
      if (!confirm(`هل تريد تعطيل «${item.branch_name}»؟`)) return;
      try {
        const saved = await settingsBranchesService.deleteBranch(currentCompanyId, item.id, item);
        setSettingsRows((state) => ({ ...state, branches: state.branches.map((row) => row.id === saved.id ? saved : row) }));
        setSelected(null);
        alert("تم حذف الفرع بنجاح");
      } catch (error) {
        alert(error.message || "تعذر حفظ البيانات");
      }
      return;
    }
    if (isRemoteCurrency) {
      const item = items[selected];
      if (!confirm(`هل تريد تعطيل «${item.currency_name}»؟`)) return;
      try {
        const saved = await settingsCurrenciesService.deleteCurrency(currentCompanyId, item.id, item);
        setSettingsRows((state) => ({ ...state, currencies: state.currencies.map((row) => row.id === saved.id ? saved : row) }));
        setSelected(null);
        alert("تم حفظ البيانات بنجاح");
      } catch (error) {
        alert(error.message || "تعذر حفظ البيانات");
      }
      return;
    }
    if (isUser) {
      const item = items[selected];
      if (item.user_id === currentUser?.user_id || item.username === currentUser?.username) return alert("لا يمكن حذف مدير النظام الحالي.");
      if (!confirm(`هل تريد تعطيل المستخدم «${item.username}»؟`)) return;
      try {
        const saved = await settingsUsersService.deleteUser(currentCompanyId, item.user_id, item);
        setSettingsRows((state) => ({ ...state, users: state.users.map((row) => row.user_id === saved.user_id ? saved : row) }));
        setSelected(null);
        alert("تم حفظ البيانات بنجاح");
      } catch (error) {
        alert(error.message || "تعذر حفظ البيانات");
      }
      return;
    }
    if ((tab === "الفروع" || tab === "الوظائف") && items.length === 1) {
      alert("يجب الإبقاء على عنصر واحد على الأقل.");
      return;
    }
    const item = items[selected],
      name = isPermission || isUser ? item.name : item;
    if (!confirm(`هل تريد حذف آ«${name}آ»؟`)) return;
    const next = items.filter((_, i) => i !== selected);
    setSettings({ ...settings, [key]: next });
    if (tab === "الفروع")
      setEmployees((list) =>
        list.map((e) => (e.branch === item ? { ...e, branch: next[0] } : e)),
      );
    if (tab === "الوظائف")
      setEmployees((list) =>
        list.map((e) => (e.job === item ? { ...e, job: next[0] } : e)),
      );
    if (tab === "معايير التقييم")
      setEvaluations((list) =>
        list.map((e) => ({
          ...e,
          scores: (e.scores || []).filter((_, i) => i !== selected),
        })),
      );
    setSelected(null);
  };
  const itemLabel =
    tab === "الفروع"
      ? "اسم الفرع"
      : tab === "العملات"
        ? "اسم العملة ورمزها"
        : tab === "الوظائف"
          ? "اسم الوظيفة"
          : "اسم معيار التقييم";
  const exportBackup = async (type = "full") => {
    if (canNode?.("system_backup", "can_export") === false) return alert("لا تملك صلاحية تصدير النسخ الاحتياطية");
    try {
      const backup = await backupService.createBackup({ type, createdBy: currentUser?.username || "" });
      const emailResult = await backupService.sendBackupToEmail(backup);
      alert(emailResult.sent ? "تم إنشاء النسخة الاحتياطية وإرسالها للبريد." : emailResult.message);
    } catch (error) {
      alert(error.message);
    }
  };
  const importBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result);
        if (!backup.settings || !Array.isArray(backup.employees))
          throw new Error("invalid");
        setSettings(backup.settings);
        setEmployees(backup.employees);
        setEvaluations(backup.evaluations || []);
        setSettings({ ...(backup.settings || {}), objections: backup.objections || [] });
        alert("تم استيراد النسخة الاحتياطية بنجاح.");
      } catch {
        alert("ملف النسخة الاحتياطية غير صالح.");
      }
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  };
  return (
    <div className="space-y-5">
      <PageHead
        title="إعدادات النظام"
        desc="إضافة وتعديل وحذف البيانات المرجعية والصلاحيات"
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={exportBackup} className="btn-secondary">
              <Download size={17} /> تصدير نسخة احتياطية
            </button>
            <label className="btn-primary cursor-pointer">
              <Upload size={17} /> استيراد نسخة
              <input
                type="file"
                accept="application/json,.json"
                onChange={importBackup}
                className="hidden"
              />
            </label>
          </div>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <div className="panel h-fit p-3">
          {tabs.map(([x, I]) => (
            <button
              key={x}
              onClick={() => {
                setTab(x);
                setSelected(null);
                setDialog(null);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${tab === x ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <I size={18} />
              {x}
            </button>
          ))}
        </div>
        <div className="panel p-5">
          {tab === "مدير النظام" ? (
            <div>
              <div className="mb-6 flex items-center gap-4 border-b pb-5">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-700 text-lg font-extrabold text-white">
                  {settings.manager.name
                    .split(" ")
                    .slice(0, 2)
                    .map((x) => x[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">بيانات مدير النظام</h3>
                  <p className="text-xs text-slate-500">
                    يتم حفظ التغييرات تلقائيًا وتظهر في جميع أجزاء النظام
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Label t="اسم مدير النظام">
                  <input
                    value={settings.manager.name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manager: { ...settings.manager, name: e.target.value },
                      })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="اسم المستخدم">
                  <input
                    value={settings.manager.username}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manager: {
                          ...settings.manager,
                          username: e.target.value,
                        },
                      })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="المسمى / الصلاحية">
                  <input
                    value={managerSafe.role}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        manager: { ...managerSafe, role: e.target.value },
                      })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="البريد">
                  <input value={managerSafe.email || ""} onChange={(e) => setSettings({ ...settings, manager: { ...managerSafe, email: e.target.value } })} className="field mt-2" />
                </Label>
                <Label t="الهاتف">
                  <input value={managerSafe.phone || ""} onChange={(e) => setSettings({ ...settings, manager: { ...managerSafe, phone: e.target.value } })} className="field mt-2" />
                </Label>
                <Label t="كلمة مرور جديدة">
                  <input type="password" value={managerSafe.newPassword || ""} onChange={(e) => setSettings({ ...settings, manager: { ...managerSafe, newPassword: e.target.value } })} className="field mt-2" />
                </Label>
                <Label t="تأكيد كلمة المرور">
                  <input type="password" value={managerSafe.confirmPassword || ""} onChange={(e) => setSettings({ ...settings, manager: { ...managerSafe, confirmPassword: e.target.value } })} className="field mt-2" />
                </Label>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                <span>يتم حفظ بيانات مدير النظام في Supabase للشركة الحالية.</span>
                <button className="btn-primary" onClick={async () => {
                  if (!currentCompanyId) return alert("لم يتم تحديد الشركة الحالية");
                  if ((managerSafe.newPassword || managerSafe.confirmPassword) && managerSafe.newPassword !== managerSafe.confirmPassword) return alert("تأكيد كلمة المرور غير مطابق");
                  try {
                    const adminUser = settingsRows.users.find((user) => String(user.role || "").includes("مدير النظام")) || settingsRows.users[0] || {};
                    const saved = await settingsUsersService.updateUser(currentCompanyId, adminUser.user_id || `ADMIN-${currentCompanyId}`, {
                      ...adminUser,
                      name: managerSafe.name,
                      employee_name: managerSafe.name,
                      username: managerSafe.username,
                      role: managerSafe.role || "مدير النظام",
                      email: managerSafe.email || adminUser.email,
                      phone: managerSafe.phone || adminUser.phone,
                      password: managerSafe.newPassword || "",
                      is_active: true,
                    });
                    setSettingsRows((state) => ({ ...state, users: state.users.some((user) => user.user_id === saved.user_id) ? state.users.map((user) => user.user_id === saved.user_id ? saved : user) : [saved, ...state.users] }));
                    setSettings({ ...settings, manager: { ...managerSafe, newPassword: "", confirmPassword: "" } });
                    alert("تم تحديث بيانات مدير النظام بنجاح");
                  } catch (error) {
                    alert(error.message || "تعذر تحديث بيانات مدير النظام");
                  }
                }}><Save size={17} /> حفظ مدير النظام</button>
              </div>
            </div>
          ) : tab === "الثيم والألوان" ? (
            <CompanyThemeFields
              theme={themeDraft}
              setTheme={(patch) => setThemeDraft((prev) => normalizeThemePayload({ ...prev, ...patch }))}
              canSave={canNode?.("theme_settings", "can_edit") !== false}
              onSave={async () => {
                try {
                  const saved = await themeService.saveCompanyTheme(currentCompany?.company_id, themeDraft);
                  setThemeDraft(saved);
                  applyCompanyTheme(saved);
                  alert("تم حفظ ألوان الثيم بنجاح");
                } catch (error) {
                  alert(error.message || "فشل حفظ ألوان الثيم");
                }
              }}
              onReset={async () => {
                try {
                  const saved = await themeService.resetCompanyTheme(currentCompany?.company_id);
                  setThemeDraft(saved);
                  applyCompanyTheme(saved);
                  alert("تم استعادة الألوان الافتراضية");
                } catch (error) {
                  alert(error.message || "فشل حفظ ألوان الثيم");
                }
              }}
            />
          ) : isGeneralSettings ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-extrabold">إعدادات عامة</h3>
                <p className="mt-1 text-xs text-slate-500">إعدادات الشركة والتقارير واللغة الافتراضية.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["company_display_name", "اسم الشركة الظاهر"],
                  ["default_language", "اللغة الافتراضية"],
                  ["default_currency", "العملة الافتراضية"],
                  ["date_format", "صيغة التاريخ"],
                  ["time_zone", "المنطقة الزمنية"],
                  ["report_header_title", "عنوان ترويسة التقرير"],
                  ["report_footer_note", "ملاحظة تذييل التقرير"],
                  ["logo_url", "رابط الشعار"],
                  ["primary_color", "اللون الأساسي"],
                  ["secondary_color", "اللون الثانوي"],
                ].map(([field, label]) => (
                  <Label key={field} t={label}>
                    <input value={settingsRows.system?.[field] || ""} onChange={(e) => setSettingsRows((state) => ({ ...state, system: { ...(state.system || {}), [field]: e.target.value } }))} className="field mt-2" />
                  </Label>
                ))}
                <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold">
                  <input type="checkbox" checked={settingsRows.system?.enable_notifications !== false} onChange={(e) => setSettingsRows((state) => ({ ...state, system: { ...(state.system || {}), enable_notifications: e.target.checked } }))} />
                  تفعيل الإشعارات
                </label>
              </div>
              <button className="btn-primary" onClick={async () => {
                if (!currentCompanyId) return alert("لم يتم تحديد الشركة الحالية");
                try {
                  const saved = await systemSettingsService.saveSystemSettings(currentCompanyId, settingsRows.system || {});
                  setSettingsRows((state) => ({ ...state, system: saved }));
                  alert("تم حفظ البيانات بنجاح");
                } catch (error) {
                  alert(error.message || "تعذر حفظ البيانات");
                }
              }}><Save size={17} /> حفظ الإعدادات العامة</button>
            </div>
          ) : isPermission ? (
            <PermissionsMatrix settings={settings} setSettings={setSettings} />
          ) : (
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div>
                  <h3 className="text-lg font-extrabold">إدارة {tab}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    اختر عنصرًا من القائمة، ثم استخدم أزرار الإضافة أو التعديل
                    أو الحذف.
                  </p>
                </div>
                <div className="mr-auto flex flex-wrap gap-2">
                  <button onClick={openAdd} className="btn-primary">
                    <Plus size={16} /> إضافة
                  </button>
                  <button
                    disabled={selected === null}
                    onClick={openEdit}
                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Pencil size={16} /> تعديل
                  </button>
                  <button
                    disabled={selected === null}
                    onClick={deleteItem}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={16} /> حذف
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => {
                  const name = isRemoteBranch ? item.branch_name : isRemoteCurrency ? item.currency_name : isPermission || isUser ? item.name : item,
                    description = isPermission
                      ? item.description
                      : isUser
                        ? `${item.username} • ${item.role}${item.employee_id ? ` • ${item.employee_id}` : ""} • ${item.is_active ? "نشط" : "معطل"}`
                        : isRemoteBranch
                          ? `${item.branch_code} • ${item.branch_type || "فرع"} • ${item.city || "—"} • ${item.is_active ? "نشط" : "معطل"}`
                          : isRemoteCurrency
                            ? `${item.currency_code} • ${item.currency_symbol || "—"} • ${item.exchange_rate} • ${item.is_default ? "افتراضية" : item.is_active ? "نشطة" : "معطلة"}`
                            : null;
                  return (
                    <button
                      key={`${name}-${i}`}
                      onClick={() => setSelected(i)}
                      className={`flex w-full items-center rounded-xl border p-4 text-right transition ${selected === i ? "border-brand-700 bg-brand-50 ring-2 ring-brand-100" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold ${selected === i ? "bg-brand-700 text-white" : "bg-slate-100"}`}
                      >
                        {i + 1}
                      </span>
                      <div className="mr-3">
                        <b className="text-sm">{name}</b>
                        {description && (
                          <p className="mt-1 text-xs font-normal text-slate-500">
                            {description}
                          </p>
                        )}
                      </div>
                      {selected === i && (
                        <span className="mr-auto text-xs font-bold text-brand-700">
                          محدد
                        </span>
                      )}
                    </button>
                  );
                })}
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-400">
                    لا توجد بيانات. اضغط «إضافة» لإنشاء أول عنصر.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel w-full max-w-md p-6">
            <div className="mb-5 flex items-center">
              <h3 className="text-lg font-extrabold">
                {dialog.mode === "add" ? "إضافة" : "تعديل"} {tab}
              </h3>
              <button
                aria-label="إغلاق"
                onClick={() => setDialog(null)}
                className="mr-auto"
              >
                <X />
              </button>
            </div>
            {isRemoteBranch ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Label t="كود الفرع"><input autoFocus value={dialog.branch_code || ""} onChange={(e) => setDialog({ ...dialog, branch_code: e.target.value })} className="field mt-2" /></Label>
                <Label t="اسم الفرع"><input value={dialog.branch_name || ""} onChange={(e) => setDialog({ ...dialog, branch_name: e.target.value })} className="field mt-2" /></Label>
                <Label t="نوع الفرع"><input value={dialog.branch_type || ""} onChange={(e) => setDialog({ ...dialog, branch_type: e.target.value })} className="field mt-2" /></Label>
                <Label t="المدير"><input value={dialog.manager_name || ""} onChange={(e) => setDialog({ ...dialog, manager_name: e.target.value })} className="field mt-2" /></Label>
                <Label t="الهاتف"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label>
                <Label t="المدينة"><input value={dialog.city || ""} onChange={(e) => setDialog({ ...dialog, city: e.target.value })} className="field mt-2" /></Label>
                <Label t="العنوان"><input value={dialog.address || ""} onChange={(e) => setDialog({ ...dialog, address: e.target.value })} className="field mt-2" /></Label>
                <Label t="الحالة"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true", status: e.target.value === "true" ? "نشط" : "معطل" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Label>
                <Label t="ملاحظات"><textarea value={dialog.notes || ""} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label>
              </div>
            ) : isRemoteCurrency ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Label t="كود العملة"><input autoFocus value={dialog.currency_code || ""} onChange={(e) => setDialog({ ...dialog, currency_code: e.target.value })} className="field mt-2" /></Label>
                <Label t="اسم العملة"><input value={dialog.currency_name || ""} onChange={(e) => setDialog({ ...dialog, currency_name: e.target.value })} className="field mt-2" /></Label>
                <Label t="الرمز"><input value={dialog.currency_symbol || ""} onChange={(e) => setDialog({ ...dialog, currency_symbol: e.target.value })} className="field mt-2" /></Label>
                <Label t="سعر الصرف"><input type="number" step="0.0001" value={dialog.exchange_rate || 1} onChange={(e) => setDialog({ ...dialog, exchange_rate: e.target.value })} className="field mt-2" /></Label>
                <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold"><input type="checkbox" checked={dialog.is_default === true} onChange={(e) => setDialog({ ...dialog, is_default: e.target.checked })} /> العملة الافتراضية</label>
                <Label t="الحالة"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشطة</option><option value="false">معطلة</option></select></Label>
                <Label t="ملاحظات"><textarea value={dialog.notes || ""} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label>
              </div>
            ) : isUser ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Label t="اسم المستخدم الكامل">
                  <input
                    autoFocus
                    value={dialog.name || ""}
                    onChange={(e) =>
                      setDialog({ ...dialog, name: e.target.value })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="اسم الدخول">
                  <input
                    value={dialog.username || ""}
                    onChange={(e) =>
                      setDialog({ ...dialog, username: e.target.value })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="كلمة المرور">
                  <input
                    type="password"
                    value={dialog.password || ""}
                    onChange={(e) =>
                      setDialog({ ...dialog, password: e.target.value })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="الصلاحية">
                  <select
                    value={dialog.role || "الموظف"}
                    onChange={(e) =>
                      setDialog({ ...dialog, role: e.target.value })
                    }
                    className="field mt-2"
                  >
                    {(settings.permissions || defaultSettings.permissions).map(
                      (permission) => (
                        <option key={permission.name}>{permission.name}</option>
                      ),
                    )}
                  </select>
                </Label>
                <Label t="ربط بالموظف">
                  <select
                    value={dialog.employee_id || dialog.employeeId || ""}
                    onChange={(e) =>
                      setDialog({ ...dialog, employee_id: e.target.value, employee_name: employees.find((emp) => emp.id === e.target.value)?.name || dialog.employee_name })
                    }
                    className="field mt-2"
                  >
                    <option value="">غير مرتبط</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} — {employee.id}
                      </option>
                    ))}
                  </select>
                </Label>
                <Label t="الفرع"><input value={dialog.branch || ""} onChange={(e) => setDialog({ ...dialog, branch: e.target.value })} className="field mt-2" /></Label>
                <Label t="الوظيفة"><input value={dialog.job || ""} onChange={(e) => setDialog({ ...dialog, job: e.target.value })} className="field mt-2" /></Label>
                <Label t="الهاتف"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label>
                <Label t="البريد"><input value={dialog.email || ""} onChange={(e) => setDialog({ ...dialog, email: e.target.value })} className="field mt-2" /></Label>
                <Label t="الحالة"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Label>
              </div>
            ) : isPermission ? (
              <div className="space-y-4">
                <Label t="اسم الصلاحية">
                  <input
                    autoFocus
                    value={dialog.name}
                    onChange={(e) =>
                      setDialog({ ...dialog, name: e.target.value })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="وصف الصلاحية">
                  <textarea
                    value={dialog.description}
                    onChange={(e) =>
                      setDialog({ ...dialog, description: e.target.value })
                    }
                    rows="3"
                    className="field mt-2 !h-auto py-3"
                  />
                </Label>
              </div>
            ) : (
              <Label t={itemLabel}>
                <input
                  autoFocus
                  value={dialog.value}
                  onChange={(e) =>
                    setDialog({ ...dialog, value: e.target.value })
                  }
                  className="field mt-2"
                  placeholder={`أدخل ${itemLabel}`}
                />
              </Label>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDialog(null)} className="btn-secondary">
                إلغاء
              </button>
              <button onClick={saveItem} className="btn-primary">
                <Save size={17} /> حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function EnhancedTemplates({ settings, setSettings }) {
  const [job, setJob] = useState(jobs[0]);
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const model = getJobCriteria(settings, job);
  const totalWeight = model.reduce((s, x) => s + Number(x.weight || 0), 0);
  const saveCriterion = () => {
    if (!dialog?.name?.trim()) return;
    const next = [...model];
    const criterionName = dialog.name.trim();
    const criterionType = dialog.criterion_type || detectCriterionTypeByName(criterionName);
    const item = applyCriterionTypeAndCashWeights({
      name: dialog.name.trim(),
      weight: Number(dialog.weight || 0),
      criterion_type: criterionType,
      ...(criterionType === "cash_counting" && isCashDenominationCriterion(criterionName)
        ? {
            subWeights: {
              cash200: Number(dialog.subWeights?.cash200 || 0),
              cash500: Number(dialog.subWeights?.cash500 || 0),
              cash1000: Number(dialog.subWeights?.cash1000 || 0),
            },
          }
        : {}),
    });
    if (dialog.mode === "add") next.push(item);
    else next[dialog.index] = item;
    updateJobCriteria(settings, setSettings, job, next);
    setDialog(null);
    setSelected(null);
  };
  const deleteCriterion = () => {
    if (selected === null || model.length <= 1) return;
    if (!confirm("هل تريد حذف معيار التقييم المحدد؟")) return;
    updateJobCriteria(
      settings,
      setSettings,
      job,
      model.filter((_, i) => i !== selected),
    );
    setSelected(null);
  };
  const balanceWeights = () => {
    const ws = defaultWeightsFor(model.length);
    updateJobCriteria(
      settings,
      setSettings,
      job,
      model.map((x, i) => ({ ...x, weight: ws[i] })),
    );
  };
  return (
    <div className="space-y-5">
      <PageHead
        title="نماذج التقييم"
        desc="معايير وأوزان مستقلة لكل وظيفة"
        action={
          <button onClick={balanceWeights} className="btn-secondary">
            <Gauge size={17} /> توزيع الأوزان تلقائيًا
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {jobs.map((x) => (
          <button
            onClick={() => {
              setJob(x);
              setSelected(null);
            }}
            key={x}
            className={`panel p-4 text-right ${job === x ? "border-brand-700 ring-2 ring-brand-100" : ""}`}
          >
            <div
              className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${job === x ? "bg-brand-700 text-white" : "bg-slate-100"}`}
            >
              <BriefcaseBusiness size={19} />
            </div>
            <b className="text-sm">{x}</b>
            <p className="mt-1 text-[11px] text-slate-400">
              {getJobCriteria(settings, x).length} معايير • 100 نقطة
            </p>
          </button>
        ))}
      </div>
      <div className="panel p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold">نموذج تقييم: {job}</h3>
            <p className="text-xs text-slate-500">
              مجموع الأوزان الحالي:{" "}
              <b className={totalWeight === 100 ? "text-emerald-600" : "text-red-600"}>{totalWeight}%</b>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setDialog({ mode: "add", name: "", weight: 10 })} className="btn-primary">
              <Plus size={16} /> إضافة
            </button>
            <button
              disabled={selected === null}
              onClick={() => setDialog({ mode: "edit", index: selected, ...model[selected] })}
              className="btn-secondary disabled:opacity-40"
            >
              <Pencil size={16} /> تعديل
            </button>
            <button
              disabled={selected === null}
              onClick={deleteCriterion}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 size={16} /> حذف
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>معيار التقييم</th>
                <th>الوزن النسبي</th>
                <th>الدرجة القصوى</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {model.map((c, i) => (
                <tr
                  key={`${c.name}-${i}`}
                  onClick={() => setSelected(i)}
                  className={selected === i ? "bg-brand-50" : ""}
                >
                  <td>{i + 1}</td>
	                    <td className="font-bold">
                        {c.name}
                        {detectCriterionTypeByName(c.name) === "cash_counting" && isCashDenominationCriterion(c.name) && c.subWeights && (
                          <p className="mt-1 text-[11px] font-normal text-slate-500">
                            فئات النقد: 200 = {c.subWeights.cash200 || 0}% • 500 = {c.subWeights.cash500 || 0}% • 1000 = {c.subWeights.cash1000 || 0}%
                          </p>
                        )}
                      </td>
                  <td>{c.weight}%</td>
                  <td>5 درجات</td>
                  <td>
                    <Status>نشط</Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {dialog && (
        <CriteriaDialog dialog={dialog} setDialog={setDialog} onSave={saveCriterion} />
      )}
    </div>
  );
}

function CriteriaDialog({ dialog, setDialog, onSave }) {
  const criterionName = String(dialog?.name || dialog?.criterion_name || dialog?.title || "");
  const criterionType = dialog?.criterion_type || detectCriterionTypeByName(criterionName);
  const showCashDenominationFields = criterionType === "cash_counting" && isCashDenominationCriterion(criterionName);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="panel w-full max-w-md p-6">
        <div className="mb-5 flex items-center">
          <h3 className="text-lg font-extrabold">{dialog.mode === "add" ? "إضافة معيار" : "تعديل معيار"}</h3>
          <button onClick={() => setDialog(null)} className="mr-auto">
            <X />
          </button>
        </div>
        <div className="grid gap-4">
          <Label t="اسم المعيار">
            <input
              autoFocus
              value={dialog.name}
              onChange={(e) => {
                const nextName = e.target.value;
                const nextType = detectCriterionTypeByName(nextName);
                const next = { ...dialog, name: nextName, criterion_type: nextType };
                if (nextType !== "cash_counting") delete next.subWeights;
                setDialog(next);
              }}
              className="field mt-2"
            />
          </Label>
          <Label t="نوع المعيار">
            <select
              value={criterionType}
              onChange={(e) => {
                const nextType = e.target.value;
                const next = { ...dialog, criterion_type: nextType };
                if (nextType !== "cash_counting") delete next.subWeights;
                setDialog(next);
              }}
              className="field mt-2"
            >
              <option value="behavioral">إداري / سلوكي</option>
              <option value="operational">إنتاجي / تشغيلي</option>
              <option value="cash_counting">عدّ نقدي / عداد</option>
              <option value="financial">مالي</option>
              <option value="service_quality">جودة وخدمة عملاء</option>
            </select>
          </Label>
          {showCashDenominationFields && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <b className="text-sm">أوزان الفئات النقدية للعداد</b>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                ["cash200", "فئة 200"],
                ["cash500", "فئة 500"],
                ["cash1000", "فئة 1000"],
              ].map(([key, label]) => (
                <Label key={key} t={label}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={dialog.subWeights?.[key] || 0}
                    onChange={(e) =>
                      setDialog({
                        ...dialog,
                        subWeights: {
                          ...(dialog.subWeights || {}),
                          [key]: e.target.value,
                        },
                      })
                    }
                    className="field mt-2"
                  />
                </Label>
              ))}
            </div>
          </div>}
          <Label t="الوزن النسبي %">
            <input
              type="number"
              min="0"
              max="100"
              value={dialog.weight}
              onChange={(e) => setDialog({ ...dialog, weight: e.target.value })}
              className="field mt-2"
            />
          </Label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setDialog(null)} className="btn-secondary">
            إلغاء
          </button>
          <button onClick={onSave} className="btn-primary">
            <Save size={17} /> حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

function EnhancedEvaluations({ employees, evaluations, setEvaluations, settings, setSettings }) {
  const [empId, setEmpId] = useState(employees[0]?.id);
  const [month, setMonth] = useState("2026-07");
  const [notes, setNotes] = useState("");
  const [scores, setScores] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const emp = employees.find((e) => e.id === empId);
  const model = getJobCriteria(settings, emp?.job);
  const modelSignature = model
    .map(
      (item) =>
        `${item.name}:${item.weight}:${item.subWeights?.cash200 || 0}:${item.subWeights?.cash500 || 0}:${item.subWeights?.cash1000 || 0}`,
    )
    .join("|");
  const safeScores = normalizeScores(scores, model.length);
  const total = scoreTotal(safeScores, model);
  useEffect(() => {
    const old = evaluations.find((e) => e.employeeId === empId && e.month === month);
    setScores(normalizeScores(old?.scores, model.length));
    setNotes(old?.notes || "");
    setSelected(null);
  }, [empId, month, evaluations, modelSignature]);
  const changeEmployee = (nextEmployeeId) => {
    const nextEmployee = employees.find((item) => item.id === nextEmployeeId);
    const nextModel = getJobCriteria(settings, nextEmployee?.job);
    const old = evaluations.find(
      (item) => item.employeeId === nextEmployeeId && item.month === month,
    );
    setEmpId(nextEmployeeId);
    setScores(normalizeScores(old?.scores, nextModel.length));
    setNotes(old?.notes || "");
    setSelected(null);
  };
  const printSelectedEvaluation = () => {
    const rows = model
      .map((c, i) => {
        const sub = cashSubWeightsHtml(c);
        return `<tr><td>${c.name}${sub}</td><td>${c.weight}%</td><td>${safeScores[i]}</td><td>${((safeScores[i] * c.weight) / 5).toFixed(1)}</td></tr>`;
      })
      .join("");
    printDocument(
      `تقييم أداء الموظف - ${emp?.name || empId}`,
      `<h1>تقرير تقييم أداء موظف</h1>
       <div style="margin:14px 0;padding:14px;border:1px solid #d7dce3;border-radius:12px">
        <h2 style="margin:0 0 8px">اسم الموظف: ${emp?.name || ""}</h2>
        <p><b>Employee_ID:</b> ${emp?.id || empId || ""}</p>
        <p><b>الوظيفة:</b> ${emp?.job || ""} &nbsp; <b>الفرع:</b> ${emp?.branch || ""}</p>
        <p><b>شهر التقييم:</b> ${month}</p>
       </div>
       <table><thead><tr><th>المعيار</th><th>الوزن</th><th>الدرجة</th><th>النتيجة</th></tr></thead><tbody>${rows}</tbody></table>
       <h2>النتيجة النهائية: ${total}% - ${classify(total)}</h2>
       <p><b>ملاحظات المدير:</b> ${notes || "لا توجد ملاحظات"}</p>`,
    );
  };
  useEffect(() => {
    if (typeof window === "undefined") return;
    const rows = model
      .map((c, i) => {
        const sub = cashSubWeightsHtml(c);
        return `<tr><td>${c.name}${sub}</td><td>${c.weight}%</td><td>${safeScores[i]}</td><td>${((safeScores[i] * c.weight) / 5).toFixed(1)}</td></tr>`;
      })
      .join("");
    window.__activeEvaluationReport = {
      employeeId: emp?.id || empId,
      title: `تقييم أداء الموظف - ${emp?.name || empId}`,
      body: `<h1>تقرير تقييم أداء موظف</h1>
       <div style="margin:14px 0;padding:14px;border:1px solid #d7dce3;border-radius:12px">
        <h2 style="margin:0 0 8px">اسم الموظف: ${emp?.name || ""}</h2>
        <p><b>Employee_ID:</b> ${emp?.id || empId || ""}</p>
        <p><b>الوظيفة:</b> ${emp?.job || ""} &nbsp; <b>الفرع:</b> ${emp?.branch || ""}</p>
        <p><b>شهر التقييم:</b> ${month}</p>
       </div>
       <table><thead><tr><th>المعيار</th><th>الوزن</th><th>الدرجة</th><th>النتيجة</th></tr></thead><tbody>${rows}</tbody></table>
       <h2>النتيجة النهائية: ${total}% - ${classify(total)}</h2>
       <p><b>ملاحظات المدير:</b> ${notes || "لا توجد ملاحظات"}</p>`,
    };
  }, [empId, emp?.name, emp?.job, emp?.branch, month, modelSignature, safeScores.join(","), total, notes]);
  const save = () => {
    const old = evaluations.find((e) => e.employeeId === empId && e.month === month);
    const record = {
      id: old?.id || `EV-${Date.now()}`,
      employeeId: empId,
      month,
      job: emp?.job,
      scores: safeScores,
      criteriaSnapshot: model,
      total,
      status: old?.status || "قيد المراجعة",
      notes,
    };
    setEvaluations((list) =>
      old ? list.map((e) => (e.id === old.id ? record : e)) : [record, ...list],
    );
    alert(old ? "تم تعديل التقييم السابق" : "تم حفظ التقييم");
  };
  const saveCriterion = () => {
    if (!dialog?.name?.trim() || !emp?.job) return;
    const next = [...model];
    const criterionName = dialog.name.trim();
    const criterionType = dialog.criterion_type || detectCriterionTypeByName(criterionName);
    const item = applyCriterionTypeAndCashWeights({
      name: criterionName,
      weight: Number(dialog.weight || 0),
      criterion_type: criterionType,
      ...(criterionType === "cash_counting" && isCashDenominationCriterion(criterionName)
        ? {
            subWeights: {
              cash200: Number(dialog.subWeights?.cash200 || 0),
              cash500: Number(dialog.subWeights?.cash500 || 0),
              cash1000: Number(dialog.subWeights?.cash1000 || 0),
            },
          }
        : {}),
    });
    if (dialog.mode === "add") {
      next.push(item);
      setScores([...safeScores, 4]);
    } else next[dialog.index] = item;
    updateJobCriteria(settings, setSettings, emp.job, next);
    setDialog(null);
    setSelected(null);
  };
  const deleteCriterion = () => {
    if (selected === null || model.length <= 1 || !emp?.job) return;
    if (!confirm("هل تريد حذف هذا المعيار من نموذج الوظيفة؟")) return;
    updateJobCriteria(
      settings,
      setSettings,
      emp.job,
      model.filter((_, i) => i !== selected),
    );
    setScores(safeScores.filter((_, i) => i !== selected));
    setSelected(null);
  };
  return (
    <div className="space-y-5">
      <PageHead
        title="تقييم أداء الموظفين"
        desc="يعرض النموذج المناسب تلقائيًا حسب وظيفة الموظف مع إمكانية تعديل المعايير والأوزان"
        action={
          <button
            onClick={() =>
              printDocument(
                "تقييم أداء الموظف",
                `<h1>تقييم أداء الموظف</h1><p>${emp?.name || ""} - ${emp?.job || ""}</p><table><thead><tr><th>المعيار</th><th>الوزن</th><th>الدرجة</th><th>النتيجة</th></tr></thead><tbody>${model
                  .map((c, i) => `<tr><td>${c.name}</td><td>${c.weight}%</td><td>${safeScores[i]}</td><td>${((safeScores[i] * c.weight) / 5).toFixed(1)}</td></tr>`)
                  .join("")}</tbody></table><h2>النتيجة النهائية: ${total}% - ${classify(total)}</h2><p>${notes || ""}</p>`,
              )
            }
            className="btn-secondary"
          >
            <Printer size={17} /> طباعة / PDF
          </button>
        }
      />
      <div className="panel grid gap-4 p-5 md:grid-cols-3">
        <Label t="الموظف">
	          <select value={empId} onChange={(e) => changeEmployee(e.target.value)} className="field mt-2">
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Label>
        <Label t="شهر التقييم">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="field mt-2" />
        </Label>
        <Label t="الوظيفة">
          <input value={emp?.job || ""} disabled className="field mt-2 bg-slate-50" />
        </Label>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_290px]">
        <div className="panel p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={() => setDialog({ mode: "add", name: "", weight: 10 })} className="btn-primary">
              <Plus size={16} /> إضافة معيار
            </button>
            <button disabled={selected === null} onClick={() => setDialog({ mode: "edit", index: selected, ...model[selected] })} className="btn-secondary disabled:opacity-40">
              <Pencil size={16} /> تعديل المعيار/الوزن
            </button>
            <button disabled={selected === null} onClick={deleteCriterion} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-40">
              <Trash2 size={16} /> حذف
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>المعيار</th>
                  <th>الوزن</th>
                  <th>الدرجة من 5</th>
                  <th>النتيجة</th>
                </tr>
              </thead>
              <tbody>
                {model.map((c, i) => (
                  <tr key={`${c.name}-${i}`} onClick={() => setSelected(i)} className={selected === i ? "bg-brand-50" : ""}>
                    <td className="font-bold">{c.name}</td>
                    <td>{c.weight}%</td>
                    <td>
                      <select
                        value={safeScores[i]}
                        onChange={(e) =>
                          setScores(safeScores.map((x, j) => (j === i ? Number(e.target.value) : x)))
                        }
                        className="field !h-9 !w-24"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n}>{n}</option>
                        ))}
                      </select>
                    </td>
                    <td className="font-bold text-brand-700">
                      {((safeScores[i] * c.weight) / 5).toFixed(1)} / {c.weight}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Label t="ملاحظات المدير">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="field mt-2 !h-auto py-3" />
          </Label>
        </div>
        <div className="space-y-4">
          <div className="panel p-6 text-center">
            <div className="mx-auto mb-4 grid h-32 w-32 place-items-center rounded-full border-[10px] border-brand-100">
              <b className="text-4xl text-brand-700">{total}%</b>
            </div>
            <Status>{classify(total)}</Status>
            <p className="mt-4 text-xs leading-5 text-slate-500">محسوب حسب نموذج وظيفة {emp?.job}</p>
          </div>
          <button onClick={save} className="btn-primary h-12 w-full">
            <Save size={18} /> حفظ التقييم
          </button>
          <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
            وجود تقييم لنفس الشهر يؤدي إلى تعديل السجل السابق، لا إنشاء نسخة مكررة.
          </p>
        </div>
      </div>
      {dialog && <CriteriaDialog dialog={dialog} setDialog={setDialog} onSave={saveCriterion} />}
    </div>
  );
}

function EnhancedTopEmployees({ employees, evaluations }) {
  const latestByEmployee = new Map();
  const approved = evaluations.filter((ev) => {
    const status = String(ev.status || "");
    return status.includes("معتمد") || status.includes("معتمد");
  });
  const sourceEvaluations = approved.length ? approved : evaluations;
  [...sourceEvaluations]
    .sort((a, b) => String(b.month).localeCompare(String(a.month)) || effectiveEvaluationTotal(b) - effectiveEvaluationTotal(a))
    .forEach((ev) => {
      if (!latestByEmployee.has(ev.employeeId)) latestByEmployee.set(ev.employeeId, ev);
    });
  const ranked = employees
    .map((employee) => {
      const ev = latestByEmployee.get(employee.id);
      return { ...employee, evaluation: ev, total: ev ? effectiveEvaluationTotal(ev) : 0 };
    })
    .sort((a, b) => b.total - a.total || String(a.name).localeCompare(String(b.name), "ar"));
  const winners = branches
    .map((branch) => ranked.filter((e) => e.branch === branch)[0])
    .filter(Boolean);
  const best = ranked[0] || {};
  const printCertificate = (employee) =>
    printDocument(
      "شهادة موظف الشهر",
      `<div class="cert"><h1 class="brand">شهادة تقدير</h1><p class="muted">تمنح هذه الشهادة إلى</p><p class="big">${employee.name || ""}</p><p>وذلك لتميزه في الأداء وتحقيقه نتيجة ${employee.total || 0}% خلال الشهر.</p><h3>${employee.job || ""} - ${employee.branch || ""}</h3><p class="muted">${APP_OFFICIAL_NAME}</p></div>`,
    );
  return (
    <div className="space-y-5">
      <PageHead
        title="موظف الشهر"
        desc="ترتيب دقيق لأفضل الموظفين حسب أعلى نتيجة تقييم"
        action={
          <button onClick={() => printCertificate(best)} className="btn-secondary">
            <Printer size={17} /> طباعة شهادة الموظف الأول
          </button>
        }
      />
      <div className="rounded-3xl bg-gradient-to-l from-brand-900 to-[#26151a] p-8 text-white">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="grid h-28 w-28 place-items-center rounded-full border-4 border-amber-300 bg-white/10 text-3xl font-bold">
            {best.name?.split(" ").slice(0, 2).map((x) => x[0]).join("")}
          </div>
          <div>
            <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">الأفضل على مستوى الشركة</span>
            <h2 className="mt-4 text-3xl font-extrabold">{best.name}</h2>
            <p className="mt-2 text-red-100/70">{best.job} • {best.branch}</p>
            <p className="mt-4 text-sm text-red-100/80">سبب الاختيار: أعلى نتيجة تقييم مع الالتزام والانضباط وجودة الأداء.</p>
          </div>
          <b className="sm:mr-auto text-5xl text-amber-300">{best.total}%</b>
        </div>
      </div>
      <div className="panel p-5">
        <h3 className="mb-4 text-lg font-extrabold">أفضل موظف في كل فرع</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {winners.map((x, i) => (
            <div key={`${x.branch}-${x.id}`} className="rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 font-bold text-brand-700">{i + 1}</div>
                <div>
                  <b>{x.name}</b>
                  <p className="text-xs text-slate-500">{x.branch} • {x.job}</p>
                </div>
                <b className="mr-auto text-xl text-brand-700">{x.total}%</b>
              </div>
              <button onClick={() => printCertificate(x)} className="btn-secondary mt-4 w-full">
                <Printer size={15} /> طباعة شهادة لهذا الموظف فقط
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="panel p-5">
        <h3 className="mb-4 text-lg font-extrabold">ترتيب أفضل 10 موظفين</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>الترتيب</th><th>الموظف</th><th>الفرع</th><th>الوظيفة</th><th>النتيجة</th></tr></thead>
            <tbody>
              {ranked.slice(0, 10).map((x, i) => (
                <tr key={x.id}><td>{i + 1}</td><td className="font-bold">{x.name}</td><td>{x.branch}</td><td>{x.job}</td><td>{x.total}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EnhancedPlans({ employees, evaluations, settings, setSettings }) {
  const plans = settings.improvementPlans || [];
  const setPlans = (updater) => {
    const nextPlans = typeof updater === "function" ? updater(plans) : updater;
    setSettings({ ...settings, improvementPlans: nextPlans });
  };
  const [dialog, setDialog] = useState(null);
  const weak = evaluations
    .filter((e) => e.total < 70)
    .map((ev) => ({ ...employees.find((x) => x.id === ev.employeeId), total: ev.total }))
    .filter((x) => x.id);
  const visiblePlans = [
    ...plans.map((p) => ({ ...p, employee: employees.find((e) => e.id === p.employeeId) })),
    ...weak
      .filter((e) => !plans.some((p) => p.employeeId === e.id))
      .map((e) => ({
        id: `AUTO-${e.id}`,
        employeeId: e.id,
        employee: e,
        reason: "انخفاض نتيجة التقييم عن 70%",
        weaknesses: "الدقة وسرعة الإنجاز",
        plan: "جلسات متابعة أسبوعية وتدريب عملي على نقاط الضعف",
        owner: "مدير الفرع",
        start: "2026-07-01",
        end: "2026-07-31",
        result: "قيد المتابعة",
        auto: true,
      })),
  ];
  const savePlan = () => {
    if (!dialog?.employeeId) return;
    const item = { ...dialog, id: dialog.id || `PLAN-${Date.now()}`, auto: false };
    setPlans((list) =>
      dialog.mode === "edit" && !dialog.auto
        ? list.map((p) => (p.id === dialog.id ? item : p))
        : [item, ...list.filter((p) => p.id !== dialog.id)],
    );
    setDialog(null);
  };
  const deletePlan = (plan) => {
    if (plan.auto) {
      alert("هذه خطة مقترحة تلقائيًا. أنشئ خطة فعلية أو عدّلها أولًا ثم يمكنك حذفها لاحقًا.");
      return;
    }
    if (!confirm("هل تريد حذف خطة التحسين؟")) return;
    setPlans((list) => list.filter((p) => p.id !== plan.id));
  };
  const openPlan = (plan = {}) =>
    setDialog({
      mode: plan.id ? "edit" : "add",
      id: plan.auto ? "" : plan.id,
      employeeId: plan.employeeId || weak[0]?.id || employees[0]?.id,
      reason: plan.reason || "",
      weaknesses: plan.weaknesses || "",
      plan: plan.plan || "",
      owner: plan.owner || "مدير الفرع",
      start: plan.start || "2026-07-01",
      end: plan.end || "2026-07-31",
      result: plan.result || "قيد المتابعة",
      auto: false,
    });
  return (
    <div className="space-y-5">
      <PageHead
        title="خطط تحسين الأداء"
        desc="إضافة وتعديل وحذف خطط تحسين الموظفين الأقل من 70%"
        action={
          <button onClick={() => openPlan()} className="btn-primary">
            <Plus size={17} /> خطة تحسين
          </button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {visiblePlans.map((p) => (
          <div key={p.id} className="panel p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-700"><TrendingUp /></div>
              <div>
                <b>{p.employee?.name}</b>
                <p className="text-xs text-slate-500">{p.employee?.job} • {p.employee?.branch}</p>
              </div>
              <div className="mr-auto flex gap-2">
                <button onClick={() => openPlan(p)} className="btn-secondary !h-9 !px-3"><Pencil size={15} /></button>
                <button onClick={() => deletePlan(p)} className="inline-flex h-9 items-center rounded-xl border border-red-200 px-3 text-red-600"><Trash2 size={15} /></button>
              </div>
            </div>
            <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs">
              <Info t="سبب الانخفاض" v={p.reason} />
              <Info t="المسؤول" v={p.owner} />
              <Info t="بداية الخطة" v={p.start} />
              <Info t="نهاية الخطة" v={p.end} />
              <Info t="نقاط الضعف" v={p.weaknesses} />
              <Info t="نتيجة المتابعة" v={p.result} />
            </div>
            <p className="rounded-xl bg-white p-3 text-sm text-slate-600">{p.plan}</p>
          </div>
        ))}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel w-full max-w-3xl p-6">
            <div className="mb-5 flex items-center">
              <h3 className="text-lg font-extrabold">{dialog.mode === "add" ? "إضافة خطة تحسين" : "تعديل خطة تحسين"}</h3>
              <button onClick={() => setDialog(null)} className="mr-auto"><X /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Label t="الموظف"><select value={dialog.employeeId} onChange={(e) => setDialog({ ...dialog, employeeId: e.target.value })} className="field mt-2">{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Label>
              <Label t="المسؤول عن المتابعة"><input value={dialog.owner} onChange={(e) => setDialog({ ...dialog, owner: e.target.value })} className="field mt-2" /></Label>
              <Label t="سبب انخفاض الأداء"><input value={dialog.reason} onChange={(e) => setDialog({ ...dialog, reason: e.target.value })} className="field mt-2" /></Label>
              <Label t="نقاط الضعف"><input value={dialog.weaknesses} onChange={(e) => setDialog({ ...dialog, weaknesses: e.target.value })} className="field mt-2" /></Label>
              <Label t="تاريخ بداية الخطة"><input type="date" value={dialog.start} onChange={(e) => setDialog({ ...dialog, start: e.target.value })} className="field mt-2" /></Label>
              <Label t="تاريخ نهاية الخطة"><input type="date" value={dialog.end} onChange={(e) => setDialog({ ...dialog, end: e.target.value })} className="field mt-2" /></Label>
              <Label t="خطة التحسين"><textarea value={dialog.plan} onChange={(e) => setDialog({ ...dialog, plan: e.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
              <Label t="نتيجة المتابعة"><textarea value={dialog.result} onChange={(e) => setDialog({ ...dialog, result: e.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDialog(null)} className="btn-secondary">إلغاء</button>
              <button onClick={savePlan} className="btn-primary"><Save size={17} /> حفظ الخطة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnhancedReports({ employees, evaluations }) {
  const reps = [
    ["التقرير المالي للأداء الشهري", Wallet],
    ["التقييم الشهري", CalendarCheck],
    ["التقييم حسب الفرع", Building2],
    ["التقييم حسب الوظيفة", BriefcaseBusiness],
    ["تقرير الحوافز", Gift],
    ["الموظفون الضعفاء", AlertTriangle],
    ["أفضل الموظفين", Trophy],
    ["تقرير الانضباط", Clock3],
    ["تقرير المخالفات", MessageSquareWarning],
    ["مقارنة الفروع", FileBarChart],
  ];
  const [month, setMonth] = useState("2026-06");
  const [branch, setBranch] = useState("all");
  const rowsFor = (title) => {
    const joined = evaluations.map((ev) => ({ ...ev, employee: employees.find((e) => e.id === ev.employeeId) })).filter((x) => x.employee);
    const filtered = joined.filter((x) => (month ? x.month === month : true) && (branch === "all" ? true : x.employee.branch === branch));
    if (title.includes("المالي"))
      return filtered.map((x, i) => ({
        ...x,
        name: x.employee.name,
        branch: x.employee.branch,
        job: x.employee.job,
        receiveAmount: Math.round((x.employee.salary || 4000) * (8 + (i % 5))),
        payAmount: Math.round((x.employee.salary || 4000) * (6 + (i % 4))),
        countedAmount200: 200 * (120 + i * 7),
        countedAmount500: 500 * (90 + i * 5),
        countedAmount1000: 1000 * (60 + i * 4),
        totalFinancial: Math.round(
          (x.employee.salary || 4000) * (14 + (i % 5)) +
            200 * (120 + i * 7) +
            500 * (90 + i * 5) +
            1000 * (60 + i * 4),
        ),
      }));
    if (title === "تقرير الحوافز") return calcIncentivesSafe(employees, filtered);
    if (title === "الموظفون الضعفاء") return filtered.filter((x) => x.total < 70);
    if (title === "أفضل الموظفين") return [...filtered].sort((a, b) => effectiveEvaluationTotal(b) - effectiveEvaluationTotal(a)).slice(0, 10);
    return filtered;
  };
  const printableRows = (rows) =>
    rows
      .map((r, i) => {
        const e = r.employee || r;
        return `<tr><td>${i + 1}</td><td>${e.name || r.name || ""}</td><td>${e.branch || r.branch || ""}</td><td>${e.job || r.job || ""}</td><td>${r.month || ""}</td><td>${r.totalFinancial || r.total || r.incentive || r.amount || 0}</td></tr>`;
      })
      .join("");
  const printReport = (title) => {
    const rows = rowsFor(title);
    printDocument(
      title,
      `<h1>${title}</h1><p>الشهر: ${month} - الفرع: ${branch === "all" ? "جميع الفروع" : branch}</p><table><thead><tr><th>#</th><th>الموظف</th><th>الفرع</th><th>الوظيفة</th><th>الشهر</th><th>القيمة/النتيجة</th></tr></thead><tbody>${printableRows(rows)}</tbody></table>`,
    );
  };
  return (
    <div className="space-y-5">
      <PageHead title="مركز التقارير" desc="طباعة أو تصدير التقرير المحدد فقط" />
      <div className="panel flex flex-wrap gap-3 p-4">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="field max-w-[180px]" />
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className="field max-w-[190px]">
          <option value="all">جميع الفروع</option>
          {branches.map((x) => <option key={x}>{x}</option>)}
        </select>
        <span className="rounded-xl bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700">كل زر PDF يطبع التقرير الخاص به فقط</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reps.map(([t, I]) => (
          <div key={t} className="panel p-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-brand-700"><I /></div>
            <h3 className="mt-4 font-extrabold">{t}</h3>
            <p className="mt-1 text-xs text-slate-500">تقرير تفصيلي جاهز للتصدير والطباعة حسب الفلاتر المختارة</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => exportExcel(rowsFor(t), t)} className="btn-secondary flex-1"><FileSpreadsheet size={15} /> Excel</button>
              <button onClick={() => printReport(t)} className="btn-secondary flex-1"><Printer size={15} /> PDF</button>
              <button onClick={() => exportDocx(t, rowsFor(t))} className="btn-secondary flex-1"><Download size={15} /> Word</button>
              <button onClick={() => printReport(t)} className="btn-secondary !px-3"><Eye size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnhancedEmployees({ employees, setEmployees, setEvaluations, settings }) {
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("الكل");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState([]);
  const employeeBranchOptions = [...new Set([
    ...(settings?.branches || []).map((item) => typeof item === "string" ? item : item?.branch_name || item?.name),
    ...employees.map((employee) => employee.branch),
  ].filter(Boolean))];
  const employeeJobOptions = [...new Set([
    ...(settings?.jobs || []).map((item) => typeof item === "string" ? item : item?.name || item?.job_name),
    ...(settings?.jobDefinitions || []).map((item) => item?.name || item?.job_name),
    ...employees.map((employee) => employee.job),
  ].filter(Boolean))];
  const employeeManagerOptions = [...new Set(employees.filter((employee) => employee.status === "نشط").map((employee) => employee.name).filter(Boolean))];
  const filtered = employees.filter(
    (e) =>
      (e.name.includes(q) || e.id.toLowerCase().includes(q.toLowerCase())) &&
      (branch === "الكل" || e.branch === branch),
  );
  const toggle = (id) =>
    setSelected((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  const deleteSelected = () => {
    if (!selected.length) return;
    if (!confirm(`هل تريد حذف ${selected.length} موظف/موظفين من السجل؟`)) return;
    setEmployees((list) => list.filter((e) => !selected.includes(e.id)));
    setEvaluations?.((list) => list.filter((e) => !selected.includes(e.employeeId)));
    setSelected([]);
  };
  return (
    <div className="space-y-5">
      <PageHead
        title="سجل الموظفين"
        desc={`إدارة بيانات ${employees.length} موظف مع إمكانية الحذف المتعدد`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!selected.length}
              onClick={deleteSelected}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 size={17} /> حذف المحدد ({selected.length})
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setModal(true);
              }}
              className="btn-primary"
            >
              <Plus size={18} /> إضافة موظف
            </button>
          </div>
        }
      />
      <div className="panel p-4">
        <div className="flex flex-wrap gap-3">
          <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-xl border px-3">
            <Search size={17} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full outline-none"
              placeholder="اكتب سبب طلب المراجعة..."
            />
          </label>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="field max-w-[190px]">
            <option>الكل</option>
            {employeeBranchOptions.map((x) => <option key={x}>{x}</option>)}
          </select>
          <button onClick={() => exportExcel(filtered, "الموظفون")} className="btn-secondary">
            <FileSpreadsheet size={17} /> تصدير Excel
          </button>
          <label className="btn-secondary cursor-pointer">
            <Upload size={17} /> استيراد
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => importEmployees(e, setEmployees)} />
          </label>
        </div>
      </div>
      <div className="panel p-4">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && filtered.every((e) => selected.includes(e.id))}
                    onChange={(e) => setSelected(e.target.checked ? filtered.map((x) => x.id) : [])}
                  />
                </th>
                <th>الموظف</th>
                <th>الفرع</th>
                <th>الوظيفة</th>
                <th>تاريخ التعيين</th>
                <th>الراتب</th>
                <th>الحالة</th>
                <th>المدير المباشر</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className={selected.includes(e.id) ? "bg-brand-50" : ""}>
                  <td><input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} /></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-brand-700">
                        {e.name.split(" ").slice(0, 2).map((x) => x[0]).join("")}
                      </div>
                      <div>
                        <b>{e.name}</b>
                        <p className="text-xs text-slate-400">{e.id} • {e.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td>{e.branch}</td>
                  <td>{e.job}</td>
                  <td>{e.hireDate}</td>
                  <td className="font-bold">{money(e.salary)}</td>
                  <td><Status>{e.status}</Status></td>
                  <td>{e.manager}</td>
                  <td>
                    <button onClick={() => { setEditing(e); setModal(true); }} className="p-2 text-blue-600"><Pencil size={16} /></button>
                    <button
                      onClick={() => {
                        if (!confirm(`هل تريد حذف الموظف ${e.name}؟`)) return;
                        setEmployees((list) => list.filter((item) => item.id !== e.id));
                        setEvaluations?.((list) => list.filter((item) => item.employeeId !== e.id));
                        setSelected((list) => list.filter((id) => id !== e.id));
                      }}
                      className="p-2 text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && <EmployeeModal editing={editing} close={() => setModal(false)} setEmployees={setEmployees} branchOptions={employeeBranchOptions} jobOptions={employeeJobOptions} managerOptions={employeeManagerOptions} />}
    </div>
	  );
	}
	
const guaranteeStatuses = ["سارية", "منتهية", "ناقصة", "موقوفة"];
const overtimeStatuses = ["مكلف", "تم الإرسال", "معتذر", "منفذ", "ملغي"];
const arabicDayName = (date) =>
  date
    ? new Intl.DateTimeFormat("ar-SA", { weekday: "long" }).format(new Date(date))
    : "";
const normalizeWhatsAppPhone = (phone) => String(phone || "").replace(/[^\d]/g, "").replace(/^0/, "966");
const makeOvertimeMessage = (assignment, employee) =>
  `الأخ/ الموظف: ${employee.employee_name}

تحية طيبة،

نحيطكم علماً بأنه تم تكليفكم بالعمل الإضافي يوم ${arabicDayName(assignment.assignment_date)} الموافق ${assignment.assignment_date}م، وذلك في ${assignment.location} من الساعة ${assignment.start_time} حتى الساعة ${assignment.end_time}.

- يرجى الالتزام بإثبات الحضور والانصراف عبر بصمة الجوال 📌.
- يرجى كذلك رفع العمل الإضافي في النظام حسب الإجراء المعتمد 📌.

شاكرين لكم تعاونكم والتزامكم.
إدارة الموارد البشرية`;
const tableColumnsGuarantees = [
  { key: "guarantee_id", label: "رقم الضمان" },
  { key: "employee_name", label: "اسم الموظف" },
  { key: "branch", label: "الفرع" },
  { key: "guarantee_type", label: "نوع الضمان" },
  { key: "guarantor_name", label: "اسم الضامن" },
  { key: "guarantor_phone", label: "رقم هاتف الضامن" },
  { key: "guarantee_date", label: "تاريخ الضمان" },
  { key: "guarantee_expiry_date", label: "تاريخ الانتهاء" },
  { key: "guarantee_status", label: "الحالة" },
];
const tableColumnsOvertime = [
  { key: "assignment_id", label: "رقم التكليف" },
  { key: "employee_name", label: "اسم الموظف" },
  { key: "employee_id", label: "الرقم الوظيفي" },
  { key: "branch", label: "الفرع" },
  { key: "job", label: "الوظيفة" },
  { key: "assignment_date", label: "تاريخ التكليف" },
  { key: "start_time", label: "وقت البداية" },
  { key: "end_time", label: "وقت النهاية" },
  { key: "total_hours", label: "عدد الساعات" },
  { key: "reason", label: "سبب التكليف" },
  { key: "status", label: "الحالة" },
  { key: "approved_by", label: "المعتمد" },
];

function EmployeeGuaranteesPage({ employees = [], currentUser, currentCompany, can }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [filters, setFilters] = useState({ q: "", branch: "all", type: "all", status: "all", from: "", to: "", month: "" });
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeItems = Array.isArray(items) ? items : [];
  const companyId = currentCompany?.company_id || currentUser?.company_id || null;
  const localBranchOptions = [...new Set([...safeEmployees.map((e) => e?.branch), ...safeItems.map((g) => g?.branch), ...branches].filter(Boolean))];
  const guaranteeTypes = [...new Set(["ضمان تجاري", "ضمان شخصي", "ضمان بنكي", ...safeItems.map((g) => g?.guarantee_type).filter(Boolean)])];
  const canView = can?.("guarantees", "can_view") !== false;
  const canCreate = can?.("guarantees", "can_create") !== false;
  const canEdit = can?.("guarantees", "can_edit") !== false;
  const canDelete = can?.("guarantees", "can_delete") !== false;
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (!companyId) {
        setItems([]);
        setError("لم يتم تحديد الشركة الحالية");
        return;
      }
      setItems(await guaranteesService.list());
    } catch (e) {
      console.error("Guarantees page load error:", e);
      setItems([]);
      setError(e.message || "تعذر تحميل ضمانات الموظفين");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    return guaranteesService.subscribe(load);
  }, [companyId]);
  if (!canView) {
    return <div className="panel p-8 text-center font-bold text-slate-500">لا تملك صلاحية عرض ضمانات الموظفين</div>;
  }
  const filtered = safeItems.filter((g = {}) => {
    const q = filters.q.trim();
    const textOk =
      !q ||
      String(g.employee_name || "").includes(q) ||
      String(g.employee_id || "").includes(q) ||
      String(g.guarantor_name || "").includes(q) ||
      String(g.guarantee_id || "").includes(q);
    const branchOk = filters.branch === "all" || g.branch === filters.branch;
    const typeOk = filters.type === "all" || g.guarantee_type === filters.type;
    const statusOk = filters.status === "all" || g.guarantee_status === filters.status;
    const date = String(g.guarantee_date || "");
    const fromOk = !filters.from || date >= filters.from;
    const toOk = !filters.to || date <= filters.to;
    return textOk && branchOk && typeOk && statusOk && fromOk && toOk;
  });
  const activeEmployeeIds = new Set(safeItems.filter((g) => g?.guarantee_status === "سارية").map((g) => g.employee_id));
  const cards = [
    ["إجمالي الضمانات", safeItems.length, ShieldCheck],
    ["ضمانات نشطة", safeItems.filter((g) => g?.guarantee_status === "سارية").length, BadgeCheck],
    ["ضمانات منتهية", safeItems.filter((g) => g?.guarantee_status === "منتهية").length, AlertTriangle],
    ["ضمانات تحتاج مراجعة", safeItems.filter((g) => ["ناقصة", "موقوفة"].includes(g?.guarantee_status) || g?.approval_status === "قيد المراجعة").length, FileBarChart],
    ["الموظفون بدون ضمانة", safeEmployees.filter((e) => !activeEmployeeIds.has(e.id)).length, Users],
  ];
  const openAdd = () => {
    if (!canCreate) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    setDialog({
      guarantee_id: `G-${Date.now()}`,
      employee_id: "",
      employee_name: "",
      branch: "",
      job: "",
      guarantor_name: "",
      guarantor_id_number: "",
      guarantor_phone: "",
      commercial_shop_name: "",
      commercial_shop_location: "",
      commercial_register_number: "",
      guarantee_date: new Date().toISOString().slice(0, 10),
      guarantee_expiry_date: "",
      guarantee_type: "ضمان تجاري",
      guarantee_status: "سارية",
      notes: "",
    });
  };
  const selectEmployee = (id) => {
    const employee = safeEmployees.find((e) => e.id === id);
    setDialog((d) => ({
      ...d,
      employee_id: id,
      employee_name: employee?.name || "",
      branch: employee?.branch || "",
      job: employee?.job || "",
    }));
  };
  const save = async (event) => {
    event.preventDefault();
    if (!canEdit && safeItems.some((g) => g.guarantee_id === dialog.guarantee_id)) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    if (!canCreate && !safeItems.some((g) => g.guarantee_id === dialog.guarantee_id)) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    const required = [
      ["employee_id", "الموظف"],
      ["guarantor_name", "اسم الضامن"],
      ["guarantor_id_number", "رقم هوية الضامن"],
      ["commercial_register_number", "رقم السجل التجاري"],
      ["guarantee_date", "تاريخ الضمانة"],
    ].filter(([key]) => !dialog[key]);
    if (required.length) return alert(`يرجى إدخال الحقول المطلوبة: ${required.map((x) => x[1]).join("، ")}`);
    const duplicateGuarantor = safeItems.find(
      (g) =>
        g.guarantee_id !== dialog.guarantee_id &&
        g.guarantee_status === "سارية" &&
        g.guarantor_id_number === dialog.guarantor_id_number &&
        g.employee_id !== dialog.employee_id,
    );
    if (duplicateGuarantor) return alert("لا يمكن استخدام نفس رقم هوية الضامن لأكثر من موظف نشط.");
    const duplicateRegister = safeItems.find(
      (g) =>
        g.guarantee_id !== dialog.guarantee_id &&
        g.guarantee_status === "سارية" &&
        g.commercial_register_number === dialog.commercial_register_number &&
        g.employee_id !== dialog.employee_id,
    );
    if (duplicateRegister && !confirm("رقم السجل التجاري مستخدم لموظف نشط آخر. هل تريد المتابعة؟")) return;
    try {
      const saved = await guaranteesService.upsert(dialog);
      auditService.log({
        user_id: currentUser?.user_id || currentUser?.username,
        user_name: currentUser?.username || currentUser?.name,
        action: safeItems.some((g) => g.guarantee_id === dialog.guarantee_id) ? "تعديل ضمانة" : "إضافة ضمانة",
        module_name: "employee_guarantees",
        record_id: saved.guarantee_id,
        new_data: saved,
      }).catch((e) => console.error("Supabase audit_logs load/save error:", e));
      setItems((list) => {
        const exists = list.some((g) => g.guarantee_id === saved.guarantee_id);
        return exists ? list.map((g) => (g.guarantee_id === saved.guarantee_id ? saved : g)) : [saved, ...list];
      });
      setDialog(null);
    } catch (e) {
      alert(e.message);
    }
  };
  const remove = async (id) => {
    if (!canDelete) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    if (!confirm("هل تريد حذف الضمانة؟")) return;
    try {
      await guaranteesService.remove(id);
      setItems((list) => list.filter((g) => g.guarantee_id !== id));
    } catch (e) {
      alert(e.message);
    }
  };
  const exportRows = reportRowsForExport(filtered, tableColumnsGuarantees);
  return (
    <div className="space-y-5">
      <PageHead title="ضمانات الموظفين" desc="إدارة الضمانات التجارية للموظفين ومتابعة حالتها" action={<button disabled={!canCreate} onClick={openAdd} className="btn-primary"><Plus size={18} /> إضافة ضمان</button>} />
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">{error}</div>}
      {!error && !safeItems.length && !loading && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">لم يتم ربط بيانات ضمانات الموظفين بقاعدة البيانات بعد، أو لا توجد ضمانات مسجلة لهذه الشركة.</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}</div>
      <div className="panel flex flex-wrap gap-3 p-4">
        <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="الموظف / رقم الضمان / الضامن" />
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">كل الفروع</option>{localBranchOptions.map((b) => <option key={b}>{b}</option>)}</select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="field max-w-[170px]"><option value="all">نوع الضمان</option>{guaranteeTypes.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[170px]"><option value="all">كل الحالات</option>{guaranteeStatuses.map((s) => <option key={s}>{s}</option>)}</select>
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="field max-w-[170px]" title="من تاريخ" />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="field max-w-[170px]" title="إلى تاريخ" />
        <button onClick={() => exportExcel(exportRows, "تقرير ضمانات الموظفين")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button>
        <button onClick={() => printDocument("تقرير ضمانات الموظفين", rowsToReportHtml("تقرير ضمانات الموظفين", filtered, tableColumnsGuarantees))} className="btn-secondary"><Printer size={17} /> PDF</button>
        <button onClick={() => exportDocx("تقرير ضمانات الموظفين", exportRows)} className="btn-secondary"><Download size={17} /> Word</button>
      </div>
      <div className="panel p-4">
        {loading ? <LoadingScreen message="جاري تحميل الضمانات..." /> : (
          <div className="table-wrap"><table><thead><tr>{tableColumnsGuarantees.map((c) => <th key={c.key}>{c.label}</th>)}<th>الإجراءات</th></tr></thead><tbody>{filtered.length ? filtered.map((g) => <tr key={g.guarantee_id}><td>{g.guarantee_id}</td><td>{g.employee_name}</td><td>{g.branch}</td><td>{g.guarantee_type || "ضمان تجاري"}</td><td>{g.guarantor_name}</td><td>{g.guarantor_phone}</td><td>{g.guarantee_date}</td><td>{g.guarantee_expiry_date}</td><td><Status>{g.guarantee_status}</Status></td><td><button onClick={() => setViewing(g)} className="p-2 text-slate-600"><Eye size={16} /></button><button disabled={!canEdit} onClick={() => setDialog(g)} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canDelete} onClick={() => remove(g.guarantee_id)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>) : <tr><td colSpan={10} className="py-8 text-center text-slate-400">لا توجد بيانات ضمانات مطابقة</td></tr>}</tbody></table></div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportBox title="تقرير حسب الفرع" rows={Object.entries(groupCount(filtered, "branch"))} />
        <ReportBox title="تقرير حسب الحالة" rows={Object.entries(groupCount(filtered, "guarantee_status"))} />
        <ReportBox title="الموظفون بدون ضمانة سارية" rows={safeEmployees.filter((e) => !activeEmployeeIds.has(e.id)).map((e) => [e.name, e.branch])} />
        <ReportBox title="الضامنون المستخدمون أكثر من مرة" rows={Object.entries(groupCount(safeItems, "guarantor_id_number")).filter(([, n]) => n > 1)} />
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={save} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6">
            <div className="mb-5 flex"><h3 className="text-xl font-extrabold">{safeItems.some((g) => g.guarantee_id === dialog.guarantee_id) ? "تعديل ضمان" : "إضافة ضمان"}</h3><button type="button" onClick={() => setDialog(null)} className="mr-auto"><X /></button></div>
            <div className="grid gap-4 md:grid-cols-3">
              <Label t="الموظف"><select required value={dialog.employee_id} onChange={(e) => selectEmployee(e.target.value)} className="field mt-2"><option value="">اختر الموظف</option>{safeEmployees.map((e) => <option key={e.id} value={e.id}>{e.name} - {e.id}</option>)}</select></Label>
              {["employee_name", "branch", "job"].map((k) => <Label key={k} t={{ employee_name: "اسم الموظف", branch: "الفرع", job: "الوظيفة" }[k]}><input readOnly value={dialog[k]} className="field mt-2 bg-slate-50" /></Label>)}
              <Label t="اسم الضامن"><input required value={dialog.guarantor_name} onChange={(e) => setDialog({ ...dialog, guarantor_name: e.target.value })} className="field mt-2" /></Label>
              <Label t="رقم هوية الضامن"><input required value={dialog.guarantor_id_number} onChange={(e) => setDialog({ ...dialog, guarantor_id_number: e.target.value })} className="field mt-2" /></Label>
              <Label t="هاتف الضامن"><input value={dialog.guarantor_phone} onChange={(e) => setDialog({ ...dialog, guarantor_phone: e.target.value })} className="field mt-2" /></Label>
              <Label t="نوع الضمان"><select value={dialog.guarantee_type || "ضمان تجاري"} onChange={(e) => setDialog({ ...dialog, guarantee_type: e.target.value })} className="field mt-2">{guaranteeTypes.map((s) => <option key={s}>{s}</option>)}</select></Label>
              <Label t="اسم المحل التجاري"><input value={dialog.commercial_shop_name} onChange={(e) => setDialog({ ...dialog, commercial_shop_name: e.target.value })} className="field mt-2" /></Label>
              <Label t="موقع المحل التجاري"><input value={dialog.commercial_shop_location} onChange={(e) => setDialog({ ...dialog, commercial_shop_location: e.target.value })} className="field mt-2" /></Label>
              <Label t="رقم السجل التجاري"><input required value={dialog.commercial_register_number} onChange={(e) => setDialog({ ...dialog, commercial_register_number: e.target.value })} className="field mt-2" /></Label>
              <Label t="تاريخ الضمانة"><input required type="date" value={dialog.guarantee_date} onChange={(e) => setDialog({ ...dialog, guarantee_date: e.target.value })} className="field mt-2" /></Label>
              <Label t="تاريخ الانتهاء"><input type="date" value={dialog.guarantee_expiry_date} onChange={(e) => setDialog({ ...dialog, guarantee_expiry_date: e.target.value })} className="field mt-2" /></Label>
              <Label t="الحالة"><select value={dialog.guarantee_status} onChange={(e) => setDialog({ ...dialog, guarantee_status: e.target.value })} className="field mt-2">{guaranteeStatuses.map((s) => <option key={s}>{s}</option>)}</select></Label>
              <Label t="ملاحظات"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="btn-secondary">إلغاء</button><button className="btn-primary"><Save size={17} /> حفظ البيانات</button></div>
          </form>
        </div>
      )}
      {viewing && <DetailsDialog title="تفاصيل الضمانة" row={viewing} close={() => setViewing(null)} />}
    </div>
  );
}

function OvertimeWhatsAppMessageGenerator({ companyId, companyName, canGenerate }) {
  const today = new Date().toISOString().slice(0, 10);
  const [assignmentDate, setAssignmentDate] = useState(today);
  const [messageType, setMessageType] = useState("tomorrow");
  const [customTitle, setCustomTitle] = useState("✨ جدول الدوام الإضافي {dayName} ({date}) ✨");
  const [approvedOnly, setApprovedOnly] = useState(false);
  const [showCanceled, setShowCanceled] = useState(false);
  const [showTimes, setShowTimes] = useState(false);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const safeRows = Array.isArray(rows) ? rows : [];
  const generatedTitle = buildMessageTitle(assignmentDate, messageType, customTitle);
  const printSafeMessage = String(message || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const loadRows = async () => {
    if (!canGenerate) return setStatus("لا تملك صلاحية توليد رسالة الدوام الإضافي");
    if (!companyId) return setStatus("لم يتم تحديد الشركة الحالية");
    setLoading(true);
    setStatus("جاري تحميل موظفي الدوام الإضافي...");
    try {
      const loaded = await loadOvertimeEmployeesByDate(companyId, assignmentDate, { approvedOnly, showCanceled });
      setRows(loaded);
      setStatus(loaded.length ? `تم تحميل ${loaded.length} موظف` : "لا يوجد موظفون مكلفون بدوام إضافي في هذا التاريخ");
    } catch (error) {
      console.error("Overtime message generator error:", error);
      setRows([]);
      setStatus("تعذر تحميل موظفي الدوام الإضافي");
    } finally {
      setLoading(false);
    }
  };
  const generate = () => {
    if (!canGenerate) return setStatus("لا تملك صلاحية توليد رسالة الدوام الإضافي");
    try {
      const text = generateOvertimeWhatsAppMessage({ assignmentDate, rows: safeRows, messageType, customTitle, companyName, showTimes });
      setMessage(text);
      setStatus(safeRows.length ? "تم توليد الرسالة" : "لا توجد بيانات لهذا التاريخ");
    } catch (error) {
      console.error("Overtime message generator error:", error);
      setStatus("تعذر توليد الرسالة");
    }
  };
  const copyMessage = async () => {
    try {
      await copyTextToClipboard(message);
      setStatus("تم نسخ الرسالة بنجاح");
    } catch {
      setStatus("تعذر النسخ التلقائي، يمكنك نسخ الرسالة يدوياً");
    }
  };
  const exportText = () => {
    const blob = new Blob([message || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `overtime-message-${assignmentDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  useEffect(() => {
    setMessage("");
    setStatus("");
  }, [assignmentDate, messageType, customTitle, approvedOnly, showCanceled, showTimes]);
  if (!canGenerate) {
    return <div className="panel p-5 text-center text-sm font-bold text-slate-500">لا تملك صلاحية توليد رسالة الدوام الإضافي</div>;
  }
  return (
    <div className="panel space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h3 className="text-lg font-extrabold">توليد رسالة دوام إضافي</h3>
          <p className="mt-1 text-xs text-slate-500">اليوم والتاريخ يتغيران تلقائيًا حسب تاريخ التكليف المختار.</p>
        </div>
        <span className="mr-auto rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{generatedTitle}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Label t="تاريخ التكليف"><input type="date" value={assignmentDate} onChange={(e) => setAssignmentDate(e.target.value)} className="field mt-2" /></Label>
        <Label t="نوع الرسالة"><select value={messageType} onChange={(e) => setMessageType(e.target.value)} className="field mt-2"><option value="tomorrow">جدول العمل ليوم غد</option><option value="today">جدول العمل لهذا اليوم</option><option value="custom">رسالة مخصصة</option></select></Label>
        <Label t="عنوان الرسالة المخصص"><input disabled={messageType !== "custom"} value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="field mt-2 disabled:bg-slate-50" /></Label>
      </div>
      <div className="flex flex-wrap gap-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">
        <label className="flex items-center gap-2"><input type="checkbox" checked={approvedOnly} onChange={(e) => setApprovedOnly(e.target.checked)} /> إظهار فقط المعتمدين</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={showCanceled} onChange={(e) => setShowCanceled(e.target.checked)} /> إظهار الملغيين</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={showTimes} onChange={(e) => setShowTimes(e.target.checked)} /> إظهار وقت الدوام</label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={loadRows} disabled={loading} className="btn-secondary">تحميل موظفي الدوام الإضافي</button>
        <button onClick={generate} className="btn-primary">توليد الرسالة</button>
        <button onClick={copyMessage} disabled={!message} className="btn-secondary disabled:opacity-50">نسخ الرسالة</button>
        <button onClick={() => printDocument("رسالة الدوام الإضافي", `<pre style="white-space:pre-wrap;line-height:1.9">${printSafeMessage}</pre>`)} disabled={!message} className="btn-secondary disabled:opacity-50">طباعة</button>
        <button onClick={exportText} disabled={!message} className="btn-secondary disabled:opacity-50">تصدير نص</button>
      </div>
      {status && <div className="rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">{status}</div>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>اسم الموظف</th><th>الرقم الوظيفي</th><th>الفرع</th><th>الوظيفة</th><th>تاريخ التكليف</th><th>وقت البداية</th><th>وقت النهاية</th><th>عدد الساعات</th><th>الحالة</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9}>جاري تحميل موظفي الدوام الإضافي...</td></tr> : safeRows.length ? safeRows.map((row) => <tr key={`${row.id}-${row.employee_id}`}><td>{row.employee_name}</td><td>{row.employee_id}</td><td>{row.branch}</td><td>{row.job}</td><td>{row.assignment_date}</td><td>{row.start_time || "—"}</td><td>{row.end_time || "—"}</td><td>{row.total_hours || "—"}</td><td><Status>{row.status || "مكلف"}</Status></td></tr>) : <tr><td colSpan={9} className="py-6 text-center text-slate-400">لا يوجد موظفون مكلفون بدوام إضافي في هذا التاريخ</td></tr>}
          </tbody>
        </table>
      </div>
      <Label t="معاينة الرسالة">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={10} className="field mt-2 !h-auto whitespace-pre-wrap py-3" placeholder="اضغط توليد الرسالة بعد تحميل الموظفين..." />
      </Label>
    </div>
  );
}

function OvertimePage({ employees = [], role, currentUser, currentCompany, can }) {
  const [assignments, setAssignments] = useState([]);
  const [assignmentEmployees, setAssignmentEmployees] = useState([]);
  const [companyBranches, setCompanyBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [filters, setFilters] = useState({ date: "", branch: "all", employee: "", status: "all", month: "" });
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const safeAssignmentEmployees = Array.isArray(assignmentEmployees) ? assignmentEmployees : [];
  const companyId = currentCompany?.company_id || currentUser?.company_id || null;
  const companyBranchOptions = useMemo(() => [...new Set((Array.isArray(companyBranches) ? companyBranches : [])
    .filter((branch) => branch?.is_active !== false && (!branch?.status || branch.status === "نشط"))
    .map((branch) => String(branch?.branch_name || "").trim())
    .filter(Boolean))], [companyBranches]);
  const canView = can?.("overtime", "can_view") !== false;
  const canCreate = can?.("overtime", "can_create") !== false;
  const canEdit = can?.("overtime", "can_edit") !== false;
  const canDelete = can?.("overtime", "can_delete") !== false;
  const canApprove = can?.("overtime", "can_approve") !== false;
  const canGenerateMessage = canView && (canCreate || canEdit || can?.("overtime", "can_export") !== false || can?.("overtime", "generate_message") !== false);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (!companyId) {
        setAssignments([]);
        setAssignmentEmployees([]);
        setError("لم يتم تحديد الشركة الحالية");
        return;
      }
      const [a, ae] = await Promise.all([overtimeService.listAssignments(), overtimeService.listAssignmentEmployees()]);
      setAssignments(a);
      setAssignmentEmployees(ae);
    } catch (e) {
      console.error("Overtime assignment error:", e);
      setError(e.message || "تعذر تحميل تكليفات العمل الإضافي");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const u1 = overtimeService.subscribeAssignments(load);
    const u2 = overtimeService.subscribeAssignmentEmployees(load);
    return () => { u1?.(); u2?.(); };
  }, [companyId]);
  useEffect(() => {
    let active = true;
    const loadCompanyBranches = async () => {
      if (!companyId) {
        if (active) setCompanyBranches([]);
        return;
      }
      try {
        const rows = await settingsBranchesService.loadBranches(companyId);
        if (active) setCompanyBranches(Array.isArray(rows) ? rows : []);
      } catch (branchError) {
        console.error("Overtime branches load error:", branchError);
        if (active) {
          setCompanyBranches([]);
          setError(branchError.message || "تعذر تحميل فروع الشركة");
        }
      }
    };
    loadCompanyBranches();
    const unsubscribe = settingsBranchesService.subscribe(loadCompanyBranches);
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [companyId]);
  useEffect(() => {
    setFilters((current) => current.branch === "all" || companyBranchOptions.includes(current.branch)
      ? current
      : { ...current, branch: "all" });
    setDialog((current) => current && !current.branch && companyBranchOptions[0]
      ? { ...current, branch: companyBranchOptions[0] }
      : current);
  }, [companyBranchOptions]);
  if (!canView) return <div className="panel p-8 text-center font-bold text-slate-500">لا تملك صلاحية إدارة تكليف العمل الإضافي</div>;
  const joinedRows = safeAssignmentEmployees.map((row) => {
    const assignment = safeAssignments.find((a) => a.assignment_id === row.assignment_id) || {};
    return { ...assignment, ...row, total_hours: assignment.total_hours || overtimeService.calculateOvertimeHours(assignment.start_time, assignment.end_time) };
  });
  const visibleRows = joinedRows.filter((r) => {
    if (role === "الموظف" && currentUser?.employeeId && r.employee_id !== currentUser.employeeId) return false;
    if (role === "مدير الفرع" && currentUser?.branch && r.branch !== currentUser.branch) return false;
    return true;
  });
  const filtered = visibleRows.filter((r) =>
    (!filters.date || r.assignment_date === filters.date) &&
    (filters.branch === "all" || r.branch === filters.branch) &&
      (!filters.employee || String(r.employee_name || "").includes(filters.employee) || String(r.employee_id || "").includes(filters.employee)) &&
    (filters.status === "all" || r.status === filters.status) &&
    (!filters.month || String(r.assignment_date || "").startsWith(filters.month))
  );
  const hours = (row) => overtimeService.calculateOvertimeHours(row.start_time, row.end_time);
  const cards = [
    ["إجمالي تكليفات العمل الإضافي", safeAssignments.length, Clock3],
    ["عدد الموظفين المكلفين", safeAssignmentEmployees.length, Users],
    ["عدد ساعات العمل الإضافي", filtered.reduce((s, r) => s + hours(r), 0).toFixed(1), Gauge],
    ["تكليفات حسب الفرع", Object.keys(groupCount(filtered, "branch")).length, Building2],
    ["تكليفات حسب الشهر", Object.keys(groupCount(filtered, "assignment_date")).length, CalendarCheck],
  ];
  const startCreate = () => {
    if (!canCreate) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    setDialog({ assignment_id: `OT-${Date.now()}`, assignment_date: new Date().toISOString().slice(0, 10), branch: companyBranchOptions[0] || "", location: "", start_time: "16:00", end_time: "20:00", reason: "", notes: "", mode: "branch", selected: [] });
  };
  const selectedEmployees = () => {
    if (!dialog) return [];
    if (dialog.mode === "branch") return safeEmployees.filter((e) => e.branch === dialog.branch);
    if (dialog.mode === "job") return safeEmployees.filter((e) => e.job === dialog.job);
    return safeEmployees.filter((e) => dialog.selected.includes(e.id));
  };
  const create = async (event) => {
    event.preventDefault();
    if (!canCreate) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    if (!dialog.start_time) return alert("يجب إدخال وقت البداية");
    if (!dialog.end_time) return alert("يجب إدخال وقت النهاية");
    if (overtimeService.calculateOvertimeHours(dialog.start_time, dialog.end_time) <= 0) return alert("عدد الساعات يجب أن يكون أكبر من صفر");
    const selected = selectedEmployees();
    if (!selected.length) return alert("يرجى اختيار موظف واحد على الأقل.");
    const employeeRows = selected.map((e) => ({
      id: `${dialog.assignment_id}-${e.id}`,
      assignment_id: dialog.assignment_id,
      employee_id: e.id,
      employee_name: e.name,
      employee_phone: e.phone,
      branch: e.branch,
      job: e.job,
      status: "مكلف",
      whatsapp_message: makeOvertimeMessage(dialog, { employee_name: e.name }),
    }));
    try {
      const saved = await overtimeService.createAssignment({ ...dialog, created_by: currentUser?.username || role || "" }, employeeRows);
      auditService.log({
        user_id: currentUser?.user_id || currentUser?.username,
        user_name: currentUser?.username || currentUser?.name,
        action: "إضافة تكليف عمل إضافي",
        module_name: "overtime_assignments",
        record_id: saved.assignment.assignment_id,
        new_data: saved.assignment,
      }).catch((e) => console.error("Supabase audit_logs load/save error:", e));
      saved.employees.forEach((employee) => {
        notificationsService.create({
          user_id: employee.employee_id,
          title: "تكليف عمل إضافي جديد",
          message: `تم تكليف ${employee.employee_name} بالعمل الإضافي بتاريخ ${saved.assignment.assignment_date}`,
          type: "overtime",
          related_module: "overtime",
          related_record_id: saved.assignment.assignment_id,
        }).catch((e) => console.error("Supabase notifications load/save error:", e));
      });
      setAssignments((list) => [saved.assignment, ...list.filter((a) => a.assignment_id !== saved.assignment.assignment_id)]);
      setAssignmentEmployees((list) => [...saved.employees, ...list.filter((r) => r.assignment_id !== saved.assignment.assignment_id)]);
      setDialog(null);
    } catch (e) {
      alert(e.message);
    }
  };
  const updateStatus = async (row, status) => {
    if (!canEdit) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    try {
      const saved = await overtimeService.updateAssignmentEmployee({ ...row, status, sent_at: status === "تم الإرسال" ? new Date().toISOString() : row.sent_at });
      setAssignmentEmployees((list) => list.map((x) => (x.id === saved.id ? saved : x)));
    } catch (e) {
      alert(e.message);
    }
  };
  const openEditRow = (row) => {
    if (!canEdit) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    setEditRow({
      ...row,
      total_hours: row.total_hours || hours(row),
      notes: row.notes || "",
    });
  };
  const pickEditEmployee = (employeeId) => {
    const employee = safeEmployees.find((item) => item.id === employeeId);
    setEditRow((row) => ({
      ...row,
      employee_id: employeeId,
      employee_name: employee?.name || row?.employee_name || "",
      employee_phone: employee?.phone || row?.employee_phone || "",
      branch: employee?.branch || row?.branch || "",
      job: employee?.job || row?.job || "",
    }));
  };
  const updateEditTime = (patch) => {
    setEditRow((row) => {
      const next = { ...row, ...patch };
      return { ...next, total_hours: overtimeService.calculateOvertimeHours(next.start_time, next.end_time) };
    });
  };
  const saveEditRow = async (event) => {
    event.preventDefault();
    if (!canEdit) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    if (!editRow.employee_id) return alert("يجب تحديد الموظف");
    if (!editRow.start_time) return alert("يجب إدخال وقت البداية");
    if (!editRow.end_time) return alert("يجب إدخال وقت النهاية");
    if (overtimeService.calculateOvertimeHours(editRow.start_time, editRow.end_time) <= 0) return alert("عدد الساعات يجب أن يكون أكبر من صفر");
    try {
      const oldRow = joinedRows.find((row) => row.id === editRow.id) || null;
      const savedAssignment = await overtimeService.updateOvertimeAssignment(editRow.assignment_id, editRow);
      const savedEmployee = await overtimeService.updateAssignmentEmployee({
        ...editRow,
        whatsapp_message: editRow.whatsapp_message || makeOvertimeMessage(editRow, editRow),
      });
      auditService.log({
        company_id: companyId,
        user_id: currentUser?.user_id || currentUser?.username,
        user_name: currentUser?.username || currentUser?.name,
        action: "تعديل موظف تكليف عمل إضافي",
        module_name: "overtime_assignments",
        record_id: savedEmployee.id,
        old_data: oldRow,
        new_data: { ...savedAssignment, ...savedEmployee },
      }).catch((error) => console.error("Supabase audit_logs load/save error:", error));
      setAssignments((list) => upsertLocal(list, savedAssignment, "assignment_id"));
      setAssignmentEmployees((list) => upsertLocal(list, savedEmployee, "id"));
      setEditRow(null);
    } catch (error) {
      alert(error.message);
    }
  };
  const removeEmployeeFromAssignment = async (row) => {
    if (!canDelete) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    if (!confirm("هل أنت متأكد من حذف هذا الموظف من تكليف العمل الإضافي؟")) return;
    try {
      const canceled = await overtimeService.updateAssignmentEmployee({ ...row, status: "ملغي" });
      auditService.log({
        company_id: companyId,
        user_id: currentUser?.user_id || currentUser?.username,
        user_name: currentUser?.username || currentUser?.name,
        action: "حذف/إلغاء موظف من تكليف عمل إضافي",
        module_name: "overtime_assignments",
        record_id: row.id,
        old_data: row,
        new_data: canceled,
      }).catch((error) => console.error("Supabase audit_logs load/save error:", error));
      setAssignmentEmployees((list) => list.map((item) => (item.id === canceled.id ? canceled : item)));
    } catch (error) {
      alert(error.message);
    }
  };
  const copy = async (text) => {
    await navigator.clipboard?.writeText(text);
    alert("تم نسخ الرسالة");
  };
  const openWhatsApp = (row) => {
    const message = row.whatsapp_message || makeOvertimeMessage(row, row);
    window.open(`https://wa.me/${normalizeWhatsAppPhone(row.employee_phone)}?text=${encodeURIComponent(message)}`, "_blank");
  };
  const exportRows = reportRowsForExport(filtered, tableColumnsOvertime);
  return (
    <div className="space-y-5">
      <PageHead title="العمل الإضافي" desc="إنشاء تكليفات العمل الإضافي وتوليد رسائل واتساب للموظفين" action={<button disabled={!canCreate} onClick={startCreate} className="btn-primary"><Plus size={18} /> إضافة موظف للتكليف</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}</div>
      <div className="panel flex flex-wrap gap-3 p-4">
        <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="field max-w-[170px]" />
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">كل الفروع</option>{companyBranchOptions.length ? companyBranchOptions.map((branchName) => <option key={branchName} value={branchName}>{branchName}</option>) : <option value="" disabled>لم يتم إضافة فروع لهذه الشركة بعد</option>}</select>
        <input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field min-w-[200px]" placeholder="اكتب سبب طلب المراجعة..." />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[170px]"><option value="all">كل الحالات</option>{overtimeStatuses.map((s) => <option key={s}>{s}</option>)}</select>
        <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[170px]" />
        <button onClick={() => exportExcel(exportRows, "تقرير العمل الإضافي")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button>
        <button onClick={() => printDocument("تقرير العمل الإضافي", rowsToReportHtml("تقرير العمل الإضافي", filtered, tableColumnsOvertime))} className="btn-secondary"><Printer size={17} /> PDF</button>
        <button onClick={() => exportDocx("تقرير العمل الإضافي", exportRows)} className="btn-secondary"><Download size={17} /> Word</button>
      </div>
      <OvertimeWhatsAppMessageGenerator companyId={companyId} companyName={currentCompany?.company_name || currentUser?.company_name || ""} canGenerate={canGenerateMessage} />
      <div className="panel p-4">
        {loading ? <LoadingScreen message="جاري تحميل تكليفات العمل الإضافي..." /> : (
          <div className="table-wrap"><table><thead><tr>{tableColumnsOvertime.map((c) => <th key={c.key}>{c.label}</th>)}<th>واتساب</th><th>الإجراءات</th></tr></thead><tbody>{filtered.length ? filtered.map((r) => <tr key={r.id}><td>{r.assignment_id}</td><td>{r.employee_name}</td><td>{r.employee_id}</td><td>{r.branch}</td><td>{r.job}</td><td>{r.assignment_date}</td><td>{r.start_time}</td><td>{r.end_time}</td><td>{hours(r)}</td><td>{r.reason}</td><td><Status>{r.status}</Status></td><td>{r.approved_by || r.approval_status || "—"}</td><td><button onClick={() => copy(r.whatsapp_message || makeOvertimeMessage(r, r))} className="btn-secondary !h-9 !px-3">نسخ</button><button onClick={() => openWhatsApp(r)} className="btn-secondary !h-9 !px-3">واتساب</button></td><td><button onClick={() => setViewing(r)} className="p-2 text-slate-600" title="عرض"><Eye size={16} /></button>{canEdit && <button onClick={() => openEditRow(r)} className="p-2 text-blue-600" title="تعديل"><Pencil size={16} /></button>}{canDelete && <button onClick={() => removeEmployeeFromAssignment(r)} className="p-2 text-red-600" title="حذف"><Trash2 size={16} /></button>}<select disabled={!canEdit && !canApprove} value={r.status} onChange={(e) => updateStatus(r, e.target.value)} className="field mt-1 h-9 min-w-[110px]">{overtimeStatuses.map((s) => <option key={s}>{s}</option>)}</select></td></tr>) : <tr><td colSpan={14} className="py-8 text-center text-slate-400">لا توجد تكليفات عمل إضافي حالياً</td></tr>}</tbody></table></div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportBox title="تقرير حسب الفرع" rows={Object.entries(groupCount(filtered, "branch"))} />
        <ReportBox title="تقرير حسب الموظف" rows={Object.entries(groupCount(filtered, "employee_name"))} />
        <ReportBox title="تقرير حسب الشهر" rows={Object.entries(groupCount(filtered.map((r) => ({ ...r, month: String(r.assignment_date || "").slice(0, 7) })), "month"))} />
        <ReportBox title="مقارنة الموظفين" rows={Object.entries(groupCount(filtered, "employee_name")).sort((a, b) => b[1] - a[1]).slice(0, 10)} />
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={create} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6">
            <div className="mb-5 flex"><h3 className="text-xl font-extrabold">تكليف عمل إضافي</h3><button type="button" onClick={() => setDialog(null)} className="mr-auto"><X /></button></div>
            <div className="grid gap-4 md:grid-cols-3">
              <Label t="التاريخ"><input required type="date" value={dialog.assignment_date} onChange={(e) => setDialog({ ...dialog, assignment_date: e.target.value })} className="field mt-2" /></Label>
              <Label t="الفرع"><select value={dialog.branch} onChange={(e) => setDialog({ ...dialog, branch: e.target.value })} className="field mt-2">{companyBranchOptions.length ? companyBranchOptions.map((branchName) => <option key={branchName} value={branchName}>{branchName}</option>) : <option value="">لم يتم إضافة فروع لهذه الشركة بعد</option>}</select></Label>
              <Label t="الموقع"><input required value={dialog.location} onChange={(e) => setDialog({ ...dialog, location: e.target.value })} className="field mt-2" /></Label>
              <Label t="من الساعة"><input required type="time" value={dialog.start_time} onChange={(e) => setDialog({ ...dialog, start_time: e.target.value })} className="field mt-2" /></Label>
              <Label t="إلى الساعة"><input required type="time" value={dialog.end_time} onChange={(e) => setDialog({ ...dialog, end_time: e.target.value })} className="field mt-2" /></Label>
              <Label t="سبب التكليف"><input value={dialog.reason} onChange={(e) => setDialog({ ...dialog, reason: e.target.value })} className="field mt-2" /></Label>
              <Label t="طريقة الاختيار"><select value={dialog.mode} onChange={(e) => setDialog({ ...dialog, mode: e.target.value, selected: [] })} className="field mt-2"><option value="branch">كل موظفي الفرع</option><option value="job">حسب الوظيفة</option><option value="manual">اختيار متعدد</option></select></Label>
              {dialog.mode === "job" && <Label t="الوظيفة"><select value={dialog.job || jobs[0]} onChange={(e) => setDialog({ ...dialog, job: e.target.value })} className="field mt-2">{jobs.map((j) => <option key={j}>{j}</option>)}</select></Label>}
              <Label t="ملاحظات"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
            </div>
            {dialog.mode === "manual" && <div className="mt-5 grid max-h-56 gap-2 overflow-y-auto rounded-2xl border p-3 md:grid-cols-2">{safeEmployees.map((e) => <label key={e.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-sm"><input type="checkbox" checked={dialog.selected.includes(e.id)} onChange={(ev) => setDialog({ ...dialog, selected: ev.target.checked ? [...dialog.selected, e.id] : dialog.selected.filter((id) => id !== e.id) })} />{e.name} - {e.branch}</label>)}</div>}
            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">عدد الموظفين المختارين: {selectedEmployees().length}</p>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="btn-secondary">إلغاء</button><button className="btn-primary"><Save size={17} /> حفظ التكليف</button></div>
          </form>
        </div>
      )}
      {editRow && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={saveEditRow} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6">
            <DialogTitle title="تعديل موظف في تكليف العمل الإضافي" close={() => setEditRow(null)} />
            <div className="grid gap-4 md:grid-cols-3">
              <Label t="الموظف">
                {safeEmployees.length ? (
                  <select required value={editRow.employee_id || ""} onChange={(e) => pickEditEmployee(e.target.value)} className="field mt-2">
                    <option value="">اختر الموظف</option>
                    {safeEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.id} - {employee.branch}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input required value={editRow.employee_name || ""} onChange={(e) => setEditRow({ ...editRow, employee_name: e.target.value })} className="field mt-2" />
                )}
              </Label>
              <Label t="الرقم الوظيفي"><input required value={editRow.employee_id || ""} onChange={(e) => setEditRow({ ...editRow, employee_id: e.target.value })} className="field mt-2" /></Label>
              <Label t="الفرع"><input value={editRow.branch || ""} onChange={(e) => setEditRow({ ...editRow, branch: e.target.value })} className="field mt-2" /></Label>
              <Label t="الوظيفة"><input value={editRow.job || ""} onChange={(e) => setEditRow({ ...editRow, job: e.target.value })} className="field mt-2" /></Label>
              <Label t="تاريخ التكليف"><input required type="date" value={editRow.assignment_date || ""} onChange={(e) => setEditRow({ ...editRow, assignment_date: e.target.value })} className="field mt-2" /></Label>
              <Label t="وقت البداية"><input required type="time" value={editRow.start_time || ""} onChange={(e) => updateEditTime({ start_time: e.target.value })} className="field mt-2" /></Label>
              <Label t="وقت النهاية"><input required type="time" value={editRow.end_time || ""} onChange={(e) => updateEditTime({ end_time: e.target.value })} className="field mt-2" /></Label>
              <Label t="عدد الساعات"><input readOnly value={editRow.total_hours || 0} className="field mt-2 bg-slate-50" /></Label>
              <Label t="سبب التكليف"><input value={editRow.reason || ""} onChange={(e) => setEditRow({ ...editRow, reason: e.target.value })} className="field mt-2" /></Label>
              <Label t="الحالة"><select value={editRow.status || "مكلف"} onChange={(e) => setEditRow({ ...editRow, status: e.target.value })} className="field mt-2">{overtimeStatuses.map((status) => <option key={status}>{status}</option>)}</select></Label>
              <Label t="ملاحظات"><textarea value={editRow.notes || ""} onChange={(e) => setEditRow({ ...editRow, notes: e.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditRow(null)} className="btn-secondary">إلغاء</button>
              <button className="btn-primary"><Save size={17} /> حفظ التعديل</button>
            </div>
          </form>
        </div>
      )}
      {viewing && <DetailsDialog title="تفاصيل تكليف العمل الإضافي" row={viewing} close={() => setViewing(null)} />}
    </div>
  );
}

const shiftTabs = [
  ["types", "أنواع الشفتات"],
  ["used", "الشفتات المستخدمة"],
  ["scenarios", "سيناريوهات الشفتات"],
  ["assignments", "توزيع الموظفين على الشفتات"],
  ["reports", "تقارير الشفتات"],
];
const shiftAssignmentColumns = [
  { key: "assignment_date", label: "التاريخ" },
  { key: "employee_name", label: "الموظف" },
  { key: "branch", label: "الفرع" },
  { key: "shift_name", label: "الشفت" },
  { key: "start_time", label: "من" },
  { key: "end_time", label: "إلى" },
  { key: "total_hours", label: "الساعات" },
  { key: "status", label: "الحالة" },
];
const canOverrideShiftConflicts = (role = "") =>
  isAdminLikeRole(role) || String(role).includes("الموارد") || String(role).includes("الموارد");
const minutesOf = (time) => {
  const [h, m] = String(time || "00:00").split(":").map(Number);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
};
const shiftsOverlap = (a, b) => {
  let aStart = minutesOf(a.start_time), aEnd = minutesOf(a.end_time);
  let bStart = minutesOf(b.start_time), bEnd = minutesOf(b.end_time);
  if (aEnd <= aStart) aEnd += 1440;
  if (bEnd <= bStart) bEnd += 1440;
  return aStart < bEnd && bStart < aEnd;
};
const makeShiftMessage = (row) =>
  `الأخ/ الموظف: ${row.employee_name}

تحية طيبة،

نحيطكم علماً بأنه تم جدولتكم للعمل يوم ${arabicDayName(row.assignment_date)} الموافق ${row.assignment_date}م، في ${row.branch} ضمن شفت ${row.shift_name} من الساعة ${row.start_time} حتى الساعة ${row.end_time}.

يرجى الالتزام بالحضور والانصراف في الوقت المحدد وإثبات البصمة حسب الإجراء المعتمد.

شاكرين لكم تعاونكم والتزامكم.
إدارة الموارد البشرية`;
const upsertLocal = (list, item, key) =>
  list.some((x) => x[key] === item[key]) ? list.map((x) => (x[key] === item[key] ? item : x)) : [item, ...list];

const inventoryTabs = [
  ["dashboard", "لوحة المخزون", "inventory_dashboard"],
  ["items", "الأصناف", "inventory_items"],
  ["suppliers", "الموردون", "inventory_suppliers"],
  ["purchase_requests", "طلب شراء", "inventory_purchase_requests"],
  ["purchase_orders", "أمر شراء", "inventory_purchase_orders"],
  ["receipts", "إذن استلام", "inventory_receipts"],
  ["invoices", "فاتورة شراء", "inventory_invoices"],
  ["issues", "سند صرف للفروع", "inventory_issue_vouchers"],
  ["returns", "سند إرجاع من الفروع", "inventory_returns"],
  ["transfers", "سند تحويل مخزني", "inventory_transfers"],
  ["adjustments", "التسويات", "inventory_adjustments"],
  ["stocktakes", "الجرد", "inventory_stocktakes"],
  ["balances", "أرصدة المخزون", "inventory_balances"],
  ["forecast", "توقع احتياج الفروع", "inventory_forecast"],
  ["reports", "تقارير المخزون", "inventory_reports"],
  ["settings", "إعدادات المخزون", "inventory_settings"],
];
const inventoryDocTypes = ["purchase_requests", "purchase_orders", "receipts", "invoices", "issues", "returns", "transfers", "adjustments", "stocktakes"];
const inventoryStatusFlow = ["مسودة", "قيد المراجعة", "معتمد", "مرفوض", "مرحل", "ملغي"];

function InventoryManagementPage({ can, currentUser }) {
  const [tab, setTab] = useState("dashboard");
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [movements, setMovements] = useState([]);
  const [documents, setDocuments] = useState({});
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState({ q: "", category: "all", branch: "all", status: "all", supplier: "all", month: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const visibleTabs = inventoryTabs.filter(([, , key]) => canInventory(can, key, "can_view"));
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [loadedItems, loadedSuppliers, loadedMovements, ...docLists] = await Promise.all([
        inventoryService.loadInventoryItems(),
        inventoryService.loadSuppliers(),
        inventoryService.loadInventoryMovements(),
        ...inventoryDocTypes.map((type) => inventoryDocumentsService.loadDocuments(type).catch((e) => {
          console.error(`Supabase inventory ${type} load/save error:`, e);
          return [];
        })),
      ]);
      setItems(loadedItems);
      setSuppliers(loadedSuppliers);
      setMovements(loadedMovements);
      setDocuments(Object.fromEntries(inventoryDocTypes.map((type, index) => [type, docLists[index]])));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const unsubs = [
      inventoryService.subscribeItems(load),
      inventoryService.subscribeSuppliers(load),
      inventoryService.subscribeMovements(load),
      ...inventoryDocTypes.map((type) => inventoryDocumentsService.subscribe(type, load)),
    ];
    return () => unsubs.forEach((u) => u?.());
  }, []);
  const canTab = (action) => canInventory(can, inventoryTabs.find(([id]) => id === tab)?.[2] || "inventory_dashboard", action);
  const balances = inventoryBalances(items, movements);
  const reports = generateInventoryReports({ items: balances, suppliers, documents, movements });
  const forecast = generateBranchForecast({ movements, items: balances, branch: filters.branch, month: filters.month });
  const saveItem = async (event) => {
    event.preventDefault();
    if (!canTab(dialog.item_id ? "can_edit" : "can_create")) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    try {
      const saved = await inventoryService.saveInventoryItem(dialog);
      setItems((list) => upsertLocal(list, saved, "item_id"));
      auditService.log({ user_id: currentUser?.user_id || currentUser?.username, user_name: currentUser?.username, action: dialog.item_id ? "تعديل صنف" : "إضافة صنف", module_name: "inventory_items", record_id: saved.item_id, new_data: saved }).catch(() => {});
      setDialog(null);
    } catch (e) { alert(e.message); }
  };
  const saveSupplier = async (event) => {
    event.preventDefault();
    if (!canTab(dialog.supplier_id ? "can_edit" : "can_create")) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    try {
      const saved = await inventoryService.saveSupplier(dialog);
      setSuppliers((list) => upsertLocal(list, saved, "supplier_id"));
      setDialog(null);
    } catch (e) { alert(e.message); }
  };
  const saveDocument = async (event) => {
    event.preventDefault();
    if (!canTab(dialog.id ? "can_edit" : "can_create")) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    if (!dialog.document_date) return alert("يجب تحديد تاريخ المستند");
    if (dialog.details?.length === 0 && !["invoices", "adjustments"].includes(dialog.type)) return alert("يجب إضافة صنف واحد على الأقل");
    try {
      const config = inventoryDocumentConfigs[dialog.type];
      const saved = await inventoryDocumentsService.saveDocument(dialog.type, { ...dialog, [config.idKey]: dialog.id }, dialog.details || []);
      setDocuments((all) => ({ ...all, [dialog.type]: upsertLocal(all[dialog.type] || [], saved, "id") }));
      setDialog(null);
    } catch (e) { alert(e.message); }
  };
  const deleteRecord = async (kind, record) => {
    if (!canTab("can_delete")) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    if (record.status && record.status !== "مسودة") return alert("لا يمكن حذف مستند مرحل");
    if (!confirm("هل تريد حذف السجل؟")) return;
    try {
      if (kind === "items") {
        await inventoryService.deleteInventoryItem(record.item_id);
        setItems((list) => list.filter((x) => x.item_id !== record.item_id));
      } else if (kind === "suppliers") {
        await inventoryService.deleteSupplier(record.supplier_id);
        setSuppliers((list) => list.filter((x) => x.supplier_id !== record.supplier_id));
      } else {
        await inventoryDocumentsService.deleteDocument(kind, record.id);
        setDocuments((all) => ({ ...all, [kind]: (all[kind] || []).filter((x) => x.id !== record.id) }));
      }
    } catch (e) { alert(e.message); }
  };
  const updateDocStatus = async (type, doc, status) => {
    const action = status === "معتمد" ? "can_approve" : status === "مرحل" ? "can_post" : "can_edit";
    if (!canTab(action)) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    try {
      const details = await inventoryDocumentsService.loadDetails(type, doc.id).catch(() => []);
      if (status === "مرحل") await inventoryDocumentsService.postStock(type, doc, details, currentUser?.username || "");
      else await inventoryDocumentsService.updateStatus(type, doc, status, { approved_by: currentUser?.username || "", approved_at: new Date().toISOString() });
      approvalService.log({ module_name: type, record_id: doc.id, action: status, old_status: doc.status, new_status: status, performed_by: currentUser?.username || "", notes: "" }).catch(() => {});
      load();
    } catch (e) { alert(e.message); }
  };
  return (
    <div className="space-y-5">
      <PageHead title="إدارة المخزون" desc="الدورة المستندية الكاملة للمخزون والمشتريات وحركة الأصناف" action={<button onClick={() => setTab("items")} className="btn-primary"><Wallet size={18} /> الأصناف</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="panel flex flex-wrap gap-2 p-2">{visibleTabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>)}</div>
      {loading ? <div className="panel p-6 text-center text-sm text-slate-500">جاري تحميل بيانات المخزون...</div> : (
        <>
          {tab === "dashboard" && <InventoryDashboard items={balances} documents={documents} movements={movements} />}
          {tab === "items" && <InventoryItemsTab rows={items} filters={filters} setFilters={setFilters} setDialog={setDialog} deleteRecord={deleteRecord} canCreate={canTab("can_create")} />}
          {tab === "suppliers" && <InventorySuppliersTab rows={suppliers} filters={filters} setFilters={setFilters} setDialog={setDialog} deleteRecord={deleteRecord} canCreate={canTab("can_create")} />}
          {inventoryDocTypes.includes(tab) && <InventoryDocumentsTab type={tab} rows={documents[tab] || []} items={items} suppliers={suppliers} filters={filters} setFilters={setFilters} setDialog={setDialog} deleteRecord={deleteRecord} updateDocStatus={updateDocStatus} canCreate={canTab("can_create")} />}
          {tab === "balances" && <InventoryBalancesTab rows={balances} filters={filters} setFilters={setFilters} />}
          {tab === "forecast" && <InventoryForecastTab rows={forecast} filters={filters} setFilters={setFilters} />}
          {tab === "reports" && <InventoryReportsTab reports={reports} filters={filters} setFilters={setFilters} canExport={canTab("can_export")} />}
          {tab === "settings" && <InventorySettingsTab />}
        </>
      )}
      {dialog?.kind === "item" && <InventoryItemDialog dialog={dialog} setDialog={setDialog} save={saveItem} />}
      {dialog?.kind === "supplier" && <InventorySupplierDialog dialog={dialog} setDialog={setDialog} save={saveSupplier} />}
      {dialog?.kind === "document" && <InventoryDocumentDialog dialog={dialog} setDialog={setDialog} save={saveDocument} items={items} suppliers={suppliers} />}
      {dialog?.kind === "details" && <DetailsDialog title="تفاصيل المستند" row={dialog.row} close={() => setDialog(null)} />}
    </div>
  );
}

const inventoryBalances = (items, movements) => items.map((item) => {
  const itemMovements = movements.filter((m) => m.item_id === item.item_id);
  const totalPurchases = itemMovements.filter((m) => Number(m.quantity_in || 0) > 0).reduce((s, m) => s + Number(m.quantity_in || 0), 0);
  const totalIssued = itemMovements.filter((m) => Number(m.quantity_out || 0) > 0).reduce((s, m) => s + Number(m.quantity_out || 0), 0);
  const totalReturns = itemMovements.filter((m) => String(m.movement_type || "").includes("إرجاع")).reduce((s, m) => s + Number(m.quantity_in || 0), 0);
  const quantityIn = itemMovements.reduce((s, m) => s + Number(m.quantity_in || 0), 0);
  const quantityOut = itemMovements.reduce((s, m) => s + Number(m.quantity_out || 0), 0);
  const current = itemMovements.length ? Number(item.opening_balance || 0) + quantityIn - quantityOut : Number(item.current_balance || item.opening_balance || 0);
  const incomingValue = itemMovements.filter((m) => Number(m.quantity_in || 0) > 0).reduce((s, m) => s + Number(m.total_value || 0), 0);
  const outgoingValue = itemMovements.filter((m) => Number(m.quantity_out || 0) > 0).reduce((s, m) => s + Number(m.total_value || 0), 0);
  const averageUnitCost = incomingValue / Math.max(1, quantityIn) || Number(item.default_unit_cost || 0);
  const estimatedStockValue = current * averageUnitCost;
  const exchangeRate = Number(item.exchange_rate || itemMovements[0]?.exchange_rate || 1);
  const status = current <= 0 ? "نافد" : current <= Number(item.reorder_point || 0) ? "يحتاج شراء" : current <= Number(item.minimum_stock || 0) ? "منخفض" : "متوفر";
  return { ...item, total_purchases: totalPurchases, total_issued: totalIssued, total_returns: totalReturns, total_quantity_in: quantityIn, total_quantity_out: quantityOut, remaining_quantity: current, incoming_total_value: incomingValue, outgoing_total_value: outgoingValue, total_adjustments: quantityIn - quantityOut, current_balance: current, average_unit_cost: averageUnitCost, estimated_stock_value: estimatedStockValue, remaining_stock_value: estimatedStockValue, total_value_base: estimatedStockValue * exchangeRate, remaining_stock_value_base: estimatedStockValue * exchangeRate, currency_code: item.default_currency_code || item.currency_code || itemMovements[0]?.currency_code || "YER", currency_name: item.default_currency_name || item.currency_name || itemMovements[0]?.currency_name || "ريال يمني", stock_status: status };
});

function InventoryDashboard({ items, documents, movements }) {
  const totals = calculateInventoryDashboardTotals({ items, movements });
  const issueMovements = movements.filter((m) => Number(m.quantity_out || 0) > 0);
  const cards = [
    ["إجمالي الأصناف", totals.total_items, Wallet],
    ["إجمالي الكمية المدخلة", nf.format(totals.total_quantity_in), Download],
    ["إجمالي الكمية المصروفة", nf.format(totals.total_quantity_out), Upload],
    ["إجمالي الكمية المتبقية", nf.format(totals.remaining_quantity), Gauge],
    ["إجمالي قيمة المشتريات", nf.format(totals.total_purchase_value), CircleDollarSign],
    ["إجمالي قيمة الصرف", nf.format(totals.total_issue_value), Wallet],
    ["إجمالي قيمة المخزون المتبقي", nf.format(totals.total_stock_value), CircleDollarSign],
    ["قيمة المخزون بالعملة الأساسية", nf.format(totals.total_stock_value_base), Banknote],
    ["الأصناف منخفضة المخزون", totals.low_stock_count, AlertTriangle],
    ["الأصناف النافدة", totals.out_of_stock_count, AlertTriangle],
  ];
  const byBranch = Object.entries(groupCount(issueMovements, "branch")).map(([name, value]) => ({ name, value }));
  const byCategory = Object.entries(groupCount(items, "category")).map(([name, value]) => ({ name, value }));
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}</div><div className="grid gap-5 xl:grid-cols-2"><Chart title="الصرف حسب الفروع" sub="حركات صرف الفروع"><ResponsiveContainer width="100%" height={240}><BarChart data={byBranch}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart><Chart title="الأصناف حسب التصنيف" sub="توزيع الأصناف"><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={byCategory} dataKey="value" innerRadius={55} outerRadius={85}>{["#7f1d1d", "#991b1b", "#dc2626", "#f59e0b", "#64748b"].map((c) => <Cell key={c} fill={c} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Chart></div></div>;
}

function InventoryItemsTab({ rows, filters, setFilters, setDialog, deleteRecord, canCreate }) {
  const filtered = rows.filter((x) => (!filters.q || x.item_name.includes(filters.q) || x.item_code.includes(filters.q)) && (filters.category === "all" || x.category === filters.category) && (filters.status === "all" || x.stock_status === filters.status || String(x.is_active) === filters.status));
  const exportRows = inventoryRowsForExport(filtered, [{ key: "item_code", label: "الكود" }, { key: "item_name", label: "الصنف" }, { key: "category", label: "التصنيف" }, { key: "unit_type", label: "الوحدة" }, { key: "current_balance", label: "الرصيد" }]);
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="اكتب سبب طلب المراجعة..." /><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="field max-w-[180px]"><option value="all">كل التصنيفات</option>{inventoryCategories.map((c) => <option key={c}>{c}</option>)}</select><button disabled={!canCreate} onClick={() => setDialog({ kind: "item", item_id: `ITM-${Date.now()}`, item_code: "", item_name: "", category: inventoryCategories[0], unit_type: inventoryUnits[0], default_unit_cost: 0, minimum_stock: 0, reorder_point: 0, opening_balance: 0, current_balance: 0, default_currency_code: "YER", default_currency_name: getInventoryCurrency("YER").currency_name, exchange_rate: 1, is_active: true, notes: "" })} className="btn-primary"><Plus size={17} /> إضافة صنف</button><button onClick={() => exportExcel(exportRows, "الأصناف")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>الكود</th><th>الصنف</th><th>التصنيف</th><th>الوحدة</th><th>الرصيد</th><th>نقطة الطلب</th><th>الحالة</th><th></th></tr></thead><tbody>{filtered.map((r) => <tr key={r.item_id}><td>{r.item_code}</td><td>{r.item_name}</td><td>{r.category}</td><td>{r.unit_type}</td><td>{r.current_balance}</td><td>{r.reorder_point}</td><td><Status>{r.is_active ? "نشط" : "غير نشط"}</Status></td><td><button onClick={() => setDialog({ ...r, kind: "item" })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => setDialog({ kind: "details", row: r })} className="p-2 text-slate-600"><Eye size={16} /></button><button onClick={() => deleteRecord("items", r)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div></div>;
}

function InventorySuppliersTab({ rows, filters, setFilters, setDialog, deleteRecord, canCreate }) {
  const filtered = rows.filter((x) => !filters.q || x.supplier_name.includes(filters.q) || x.phone.includes(filters.q));
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="اكتب سبب طلب المراجعة..." /><button disabled={!canCreate} onClick={() => setDialog({ kind: "supplier", supplier_id: `SUP-${Date.now()}`, supplier_name: "", phone: "", address: "", tax_number: "", commercial_register: "", contact_person: "", is_active: true, notes: "" })} className="btn-primary"><Plus size={17} /> إضافة مورد</button><button onClick={() => exportExcel(filtered, "الموردون")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>المورد</th><th>الهاتف</th><th>السجل التجاري</th><th>مسؤول التواصل</th><th>الحالة</th><th></th></tr></thead><tbody>{filtered.map((r) => <tr key={r.supplier_id}><td>{r.supplier_name}</td><td>{r.phone}</td><td>{r.commercial_register}</td><td>{r.contact_person}</td><td><Status>{r.is_active ? "نشط" : "غير نشط"}</Status></td><td><button onClick={() => setDialog({ ...r, kind: "supplier" })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => deleteRecord("suppliers", r)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div></div>;
}

function InventoryDocumentsTab({ type, rows, items, suppliers, filters, setFilters, setDialog, deleteRecord, updateDocStatus, canCreate }) {
  const config = inventoryDocumentConfigs[type];
  const filtered = rows.filter((x) => (!filters.q || String(x.document_number || "").includes(filters.q) || String(x.supplier_name || x.branch || "").includes(filters.q)) && (filters.status === "all" || x.status === filters.status || x.approval_status === filters.status) && (!filters.month || String(x.document_date || "").startsWith(filters.month)));
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[200px] flex-1" placeholder="اكتب سبب طلب المراجعة..." /><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[170px]" /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[170px]"><option value="all">كل الحالات</option>{["مسودة", "قيد المراجعة", "معتمد", "مرحل", "مرفوض", "ملغي"].map((s) => <option key={s}>{s}</option>)}</select><button disabled={!canCreate} onClick={() => setDialog({ kind: "document", type, id: `${type.toUpperCase()}-${Date.now()}`, document_number: `${config.label}-${Date.now()}`, document_date: new Date().toISOString().slice(0, 10), status: "مسودة", approval_status: "مسودة", supplier_id: suppliers[0]?.supplier_id || "", supplier_name: suppliers[0]?.supplier_name || "", branch: branches[0], priority: "عادي", details: [] })} className="btn-primary"><Plus size={17} /> إضافة</button><button onClick={() => exportExcel(filtered, config.label)} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button><button onClick={() => printDocument(config.label, rowsToReportHtml(config.label, filtered, [{ key: "document_number", label: "الرقم" }, { key: "document_date", label: "التاريخ" }, { key: "supplier_name", label: "المورد" }, { key: "branch", label: "الفرع" }, { key: "status", label: "الحالة" }]))} className="btn-secondary"><Printer size={17} /> طباعة</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>رقم المستند</th><th>التاريخ</th><th>المورد/الفرع</th><th>الحالة</th><th>الاعتماد</th><th>القيمة</th><th></th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id}><td>{r.document_number}</td><td>{r.document_date}</td><td>{r.supplier_name || r.branch || r.requesting_branch}</td><td><Status>{r.status}</Status></td><td><Status>{r.approval_status}</Status></td><td>{money(r.total_amount || 0)}</td><td><button onClick={() => setDialog({ kind: "details", row: r })} className="p-2 text-slate-600"><Eye size={16} /></button><button onClick={() => setDialog({ ...r, kind: "document", type, details: [] })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => updateDocStatus(type, r, "قيد المراجعة")} className="btn-secondary !h-8 !px-2">إرسال</button><button onClick={() => updateDocStatus(type, r, "معتمد")} className="btn-secondary !h-8 !px-2">اعتماد</button><button onClick={() => updateDocStatus(type, r, "مرحل")} className="btn-secondary !h-8 !px-2">ترحيل</button><button onClick={() => deleteRecord(type, r)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div></div>;
}

function InventoryBalancesTab({ rows, filters, setFilters }) {
  const filtered = rows.filter((x) => (filters.category === "all" || x.category === filters.category) && (filters.status === "all" || x.stock_status === filters.status));
  const summary = filtered.reduce((acc, row) => ({ inQty: acc.inQty + Number(row.total_quantity_in || row.total_purchases || 0), outQty: acc.outQty + Number(row.total_quantity_out || row.total_issued || 0), remain: acc.remain + Number(row.remaining_quantity || row.current_balance || 0), value: acc.value + Number(row.remaining_stock_value || row.estimated_stock_value || 0), base: acc.base + Number(row.remaining_stock_value_base || row.total_value_base || 0) }), { inQty: 0, outQty: 0, remain: 0, value: 0, base: 0 });
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="field max-w-[180px]"><option value="all">كل التصنيفات</option>{inventoryCategories.map((c) => <option key={c}>{c}</option>)}</select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[180px]"><option value="all">كل الحالات</option>{["متوفر", "منخفض", "نافد", "يحتاج شراء"].map((s) => <option key={s}>{s}</option>)}</select><button onClick={() => exportExcel(filtered, "أرصدة المخزون")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>رقم الصنف</th><th>اسم الصنف</th><th>التصنيف</th><th>الوحدة</th><th>العملة</th><th>الافتتاحية</th><th>الكمية المدخلة</th><th>الكمية المصروفة</th><th>المتبقية</th><th>متوسط سعر الوحدة</th><th>قيمة الداخل</th><th>قيمة الصرف</th><th>قيمة المخزون</th><th>القيمة بالعملة الأساسية</th><th>آخر حركة</th><th>الحالة</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.item_id}><td>{r.item_code}</td><td>{r.item_name}</td><td>{r.category}</td><td>{r.unit_type}</td><td>{r.currency_code || "YER"}</td><td>{r.opening_balance}</td><td>{r.total_quantity_in || r.total_purchases || 0}</td><td>{r.total_quantity_out || r.total_issued || 0}</td><td>{r.remaining_quantity || r.current_balance || 0}</td><td>{nf.format(Number(r.average_unit_cost || 0))}</td><td>{nf.format(Number(r.incoming_total_value || 0))}</td><td>{nf.format(Number(r.outgoing_total_value || 0))}</td><td>{nf.format(Number(r.remaining_stock_value || r.estimated_stock_value || 0))}</td><td>{nf.format(Number(r.remaining_stock_value_base || r.total_value_base || 0))}</td><td>{r.last_movement_date || ""}</td><td><Status>{r.stock_status}</Status></td></tr>)}<tr className="bg-slate-50 font-extrabold"><td colSpan="6">الإجمالي</td><td>{nf.format(summary.inQty)}</td><td>{nf.format(summary.outQty)}</td><td>{nf.format(summary.remain)}</td><td></td><td></td><td></td><td>{nf.format(summary.value)}</td><td>{nf.format(summary.base)}</td><td></td><td></td></tr></tbody></table></div></div></div>;
}


function InventoryForecastTab({ rows, filters, setFilters }) {
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[170px]" /><button onClick={() => exportExcel(rows, "توقع احتياج الفروع")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>الفرع</th><th>الصنف</th><th>إجمالي الصرف</th><th>متوسط شهري</th><th>احتياج شهر</th><th>احتياج 3 أشهر</th><th>الرصيد</th><th>الموصى بشرائه</th></tr></thead><tbody>{rows.map((r) => <tr key={`${r.branch}-${r.item_id}`}><td>{r.branch}</td><td>{r.item_name}</td><td>{r.total_issued_quantity}</td><td>{r.average_monthly_consumption}</td><td>{r.expected_need_next_month}</td><td>{r.expected_need_next_3_months}</td><td>{r.current_balance}</td><td>{r.recommended_purchase_quantity}</td></tr>)}</tbody></table></div></div></div>;
}

function InventoryReportsTab({ reports, filters, setFilters, canExport }) {
  const reportList = [["تقرير الأصناف", reports.items], ["تقرير الموردين", reports.suppliers], ["تقرير طلبات الشراء", reports.purchase_requests], ["تقرير أوامر الشراء", reports.purchase_orders], ["تقرير إذون الاستلام", reports.receipts], ["تقرير فواتير الشراء", reports.invoices], ["تقرير الصرف للفروع", reports.issues], ["تقرير إرجاع الفروع", reports.returns], ["تقرير التحويلات", reports.transfers], ["تقرير التسويات", reports.adjustments], ["تقرير الجرد", reports.stocktakes], ["تقرير الرصيد الحالي", reports.balances], ["تقرير حركة صنف", reports.movements], ["تقرير الأصناف منخفضة المخزون", reports.low_stock]];
  return <div className="space-y-4"><div className="panel grid gap-3 p-4 md:grid-cols-4"><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field" /><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field"><option value="all">كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="field"><option value="all">كل التصنيفات</option>{inventoryCategories.map((c) => <option key={c}>{c}</option>)}</select></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reportList.map(([title, rows]) => <div key={title} className="panel p-5"><FileBarChart className="text-brand-700" /><h3 className="mt-3 font-extrabold">{title}</h3><p className="mt-1 text-xs text-slate-500">عدد السجلات: {(rows || []).length}</p><div className="mt-5 flex gap-2"><button disabled={!canExport} onClick={() => exportExcel(rows || [], title)} className="btn-secondary flex-1"><FileSpreadsheet size={15} /> Excel</button><button onClick={() => printDocument(title, rowsToReportHtml(title, rows || [], [{ key: "document_number", label: "الرقم" }, { key: "item_name", label: "الصنف" }, { key: "supplier_name", label: "المورد" }, { key: "branch", label: "الفرع" }, { key: "status", label: "الحالة" }]))} className="btn-secondary flex-1"><Printer size={15} /> PDF</button><button disabled={!canExport} onClick={() => exportDocx(title, rows || [])} className="btn-secondary flex-1"><Download size={15} /> Word</button></div></div>)}</div></div>;
}

function InventorySettingsTab() {
  const [settings, setSettings] = useState(defaultInventorySettings);
  const [numbering, setNumbering] = useState(defaultDocumentNumbering);
  const [branchRows, setBranchRows] = useState([]);
  const [currencyRows, setCurrencyRows] = useState(inventoryCurrencies);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const [s, n, b, c] = await Promise.all([
        inventorySettingsService.loadInventorySettings(),
        inventorySettingsService.loadDocumentNumbering(),
        inventorySettingsService.loadBranchSettings(),
        inventoryService.loadInventoryCurrencies(),
      ]);
      setSettings(s);
      setNumbering(n);
      setBranchRows(b);
      setCurrencyRows(c);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const general = settings.general || {};
  const setGeneral = (patch) => setSettings({ ...settings, general: { ...general, ...patch } });
  const saveAll = async () => {
    try {
      await inventorySettingsService.saveInventorySettings(settings);
      await inventorySettingsService.saveDocumentNumbering(numbering);
      await Promise.all(currencyRows.map((row) => inventoryService.saveInventoryCurrencySetting(row)));
      alert("تم حفظ إعدادات المخزون");
    } catch (e) { alert(e.message); }
  };
  if (loading) return <div className="panel p-6 text-center text-sm text-slate-500">جاري تحميل إعدادات المخزون...</div>;
  return (
    <div className="space-y-5">
      <div className="panel p-5">
        <div className="mb-4 flex"><h3 className="font-extrabold">الإعدادات العامة للمخزون</h3><button onClick={saveAll} className="btn-primary mr-auto"><Save size={17} /> حفظ الإعدادات</button></div>
        <div className="grid gap-4 md:grid-cols-3">
          <Label t="اسم المخزن الرئيسي"><input value={general.main_warehouse_name || ""} onChange={(e) => setGeneral({ main_warehouse_name: e.target.value })} className="field mt-2" /></Label>
          <Label t="تفعيل تعدد المخازن"><select value={String(general.multi_warehouses === true)} onChange={(e) => setGeneral({ multi_warehouses: e.target.value === "true" })} className="field mt-2"><option value="false">لا</option><option value="true">نعم</option></select></Label>
          <Label t="السماح بالصرف بدون رصيد"><select value={String(general.allow_negative_stock === true)} onChange={(e) => setGeneral({ allow_negative_stock: e.target.value === "true" })} className="field mt-2"><option value="false">لا</option><option value="true">نعم</option></select></Label>
          <Label t="تعديل المستندات المرحلة"><select value={String(general.allow_edit_posted_documents === true)} onChange={(e) => setGeneral({ allow_edit_posted_documents: e.target.value === "true" })} className="field mt-2"><option value="false">لا</option><option value="true">نعم</option></select></Label>
          <Label t="طريقة تقييم المخزون"><select value={general.valuation_method || "متوسط التكلفة"} onChange={(e) => setGeneral({ valuation_method: e.target.value })} className="field mt-2"><option>متوسط التكلفة</option><option>آخر سعر شراء</option><option>سعر ثابت</option></select></Label>
          <Label t="تفعيل حد إعادة الطلب"><select value={String(general.enable_reorder_point !== false)} onChange={(e) => setGeneral({ enable_reorder_point: e.target.value === "true" })} className="field mt-2"><option value="true">نعم</option><option value="false">لا</option></select></Label>
          <Label t="اعتماد سندات الصرف"><select value={String(general.require_issue_approval !== false)} onChange={(e) => setGeneral({ require_issue_approval: e.target.value === "true" })} className="field mt-2"><option value="true">نعم</option><option value="false">لا</option></select></Label>
          <Label t="أيام التنبيه قبل النفاد"><input type="number" value={general.stock_alert_days || 0} onChange={(e) => setGeneral({ stock_alert_days: e.target.value })} className="field mt-2" /></Label>
          <Label t="الوحدة الافتراضية"><select value={general.default_unit || "حبة"} onChange={(e) => setGeneral({ default_unit: e.target.value })} className="field mt-2">{inventoryUnits.map((u) => <option key={u}>{u}</option>)}</select></Label>
        </div>
      </div>
      <div className="panel p-5">
        <div className="mb-4 flex"><h3 className="font-extrabold">إعدادات العملات</h3><button onClick={() => setCurrencyRows([...currencyRows, { setting_id: `CUR-${Date.now()}`, currency_code: "", currency_name: "", exchange_rate: 1, is_base_currency: false, is_active: true }])} className="btn-secondary mr-auto"><Plus size={17} /> إضافة عملة</button></div>
        <div className="grid gap-4 md:grid-cols-3"><Label t="العملة الافتراضية"><select value={currencyRows.find((c) => c.is_base_currency)?.currency_code || "YER"} onChange={(e) => setCurrencyRows(currencyRows.map((row) => ({ ...row, is_base_currency: row.currency_code === e.target.value })))} className="field mt-2">{currencyRows.map((c) => <option key={c.currency_code} value={c.currency_code}>{c.currency_code} - {c.currency_name}</option>)}</select></Label><Label t="السماح بتغيير العملة في المستندات"><select value={String(general.allow_document_currency_change !== false)} onChange={(e) => setGeneral({ allow_document_currency_change: e.target.value === "true" })} className="field mt-2"><option value="true">نعم</option><option value="false">لا</option></select></Label><Label t="التحويل للعملة الأساسية في التقارير"><select value={String(general.enable_base_currency_reports !== false)} onChange={(e) => setGeneral({ enable_base_currency_reports: e.target.value === "true" })} className="field mt-2"><option value="true">نعم</option><option value="false">لا</option></select></Label></div>
        <div className="table-wrap mt-4"><table><thead><tr><th>الكود</th><th>اسم العملة</th><th>سعر الصرف</th><th>عملة أساسية</th><th>نشطة</th></tr></thead><tbody>{currencyRows.map((row, i) => <tr key={row.setting_id || row.currency_code || i}><td><input className="field" value={row.currency_code} onChange={(e) => setCurrencyRows(currencyRows.map((x, idx) => idx === i ? { ...x, currency_code: e.target.value } : x))} /></td><td><input className="field" value={row.currency_name} onChange={(e) => setCurrencyRows(currencyRows.map((x, idx) => idx === i ? { ...x, currency_name: e.target.value } : x))} /></td><td><input type="number" className="field" value={row.exchange_rate} onChange={(e) => setCurrencyRows(currencyRows.map((x, idx) => idx === i ? { ...x, exchange_rate: e.target.value } : x))} /></td><td><input type="checkbox" checked={row.is_base_currency === true} onChange={(e) => setCurrencyRows(currencyRows.map((x, idx) => ({ ...x, is_base_currency: idx === i ? e.target.checked : e.target.checked ? false : x.is_base_currency })))} /></td><td><input type="checkbox" checked={row.is_active !== false} onChange={(e) => setCurrencyRows(currencyRows.map((x, idx) => idx === i ? { ...x, is_active: e.target.checked } : x))} /></td></tr>)}</tbody></table></div>
      </div>
      <div className="panel p-5">
        <h3 className="mb-4 font-extrabold">ترقيم المستندات</h3>
        <div className="table-wrap"><table><thead><tr><th>المستند</th><th>Prefix</th><th>الرقم التالي</th><th>إعادة سنوية</th><th>مثال</th></tr></thead><tbody>{numbering.map((row, i) => <tr key={row.numbering_id}><td>{row.document_label}</td><td><input className="field" value={row.prefix} onChange={(e) => setNumbering(numbering.map((x, idx) => idx === i ? { ...x, prefix: e.target.value } : x))} /></td><td><input type="number" className="field" value={row.next_number} onChange={(e) => setNumbering(numbering.map((x, idx) => idx === i ? { ...x, next_number: e.target.value } : x))} /></td><td><input type="checkbox" checked={row.reset_yearly} onChange={(e) => setNumbering(numbering.map((x, idx) => idx === i ? { ...x, reset_yearly: e.target.checked } : x))} /></td><td>{inventorySettingsService.generateDocumentNumber(row)}</td></tr>)}</tbody></table></div>
      </div>
      <div className="panel p-5">
        <div className="mb-4 flex"><h3 className="font-extrabold">إعدادات الفروع المخزنية</h3><button onClick={() => setBranchRows([...branchRows, { branch_setting_id: `IBS-${Date.now()}`, branch: branches[0] || "", allowed_to_request_items: true, allowed_to_receive_items: true, max_monthly_issue_limit: 0, default_receiver: "", notes: "" }])} className="btn-secondary mr-auto"><Plus size={17} /> إضافة فرع</button></div>
        <div className="table-wrap"><table><thead><tr><th>الفرع</th><th>طلب أصناف</th><th>استلام أصناف</th><th>حد الصرف الشهري</th><th>المستلم الافتراضي</th><th></th></tr></thead><tbody>{branchRows.map((row, i) => <tr key={row.branch_setting_id}><td><select className="field" value={row.branch} onChange={(e) => setBranchRows(branchRows.map((x, idx) => idx === i ? { ...x, branch: e.target.value } : x))}>{branches.map((b) => <option key={b}>{b}</option>)}</select></td><td><input type="checkbox" checked={row.allowed_to_request_items} onChange={(e) => setBranchRows(branchRows.map((x, idx) => idx === i ? { ...x, allowed_to_request_items: e.target.checked } : x))} /></td><td><input type="checkbox" checked={row.allowed_to_receive_items} onChange={(e) => setBranchRows(branchRows.map((x, idx) => idx === i ? { ...x, allowed_to_receive_items: e.target.checked } : x))} /></td><td><input className="field" type="number" value={row.max_monthly_issue_limit} onChange={(e) => setBranchRows(branchRows.map((x, idx) => idx === i ? { ...x, max_monthly_issue_limit: e.target.value } : x))} /></td><td><input className="field" value={row.default_receiver} onChange={(e) => setBranchRows(branchRows.map((x, idx) => idx === i ? { ...x, default_receiver: e.target.value } : x))} /></td><td><button onClick={() => inventorySettingsService.saveBranchSetting(row).then(load).catch((e) => alert(e.message))} className="text-blue-600"><Save size={16} /></button><button onClick={() => inventorySettingsService.deleteBranchSetting(row.branch_setting_id).then(load).catch((e) => alert(e.message))} className="text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
}

function InventoryItemDialog({ dialog, setDialog, save }) {
  const currency = getInventoryCurrency(dialog.default_currency_code || dialog.currency_code || "YER");
  const totals = calculateInventoryLineTotal({ quantity: dialog.current_balance || dialog.opening_balance || 0, unit_price: dialog.default_unit_cost || 0, currency_code: currency.currency_code, exchange_rate: dialog.exchange_rate || currency.exchange_rate });
  const setCurrency = (code) => { const c = getInventoryCurrency(code); setDialog({ ...dialog, default_currency_code: c.currency_code, default_currency_name: c.currency_name, currency_code: c.currency_code, currency_name: c.currency_name, exchange_rate: c.exchange_rate }); };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"><DialogTitle title="بيانات الصنف" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="كود الصنف"><input required value={dialog.item_code} onChange={(e) => setDialog({ ...dialog, item_code: e.target.value })} className="field mt-2" /></Label><Label t="اسم الصنف"><input required value={dialog.item_name} onChange={(e) => setDialog({ ...dialog, item_name: e.target.value })} className="field mt-2" /></Label><Label t="التصنيف"><select value={dialog.category} onChange={(e) => setDialog({ ...dialog, category: e.target.value })} className="field mt-2">{inventoryCategories.map((c) => <option key={c}>{c}</option>)}</select></Label><Label t="وحدة القياس"><select value={dialog.unit_type} onChange={(e) => setDialog({ ...dialog, unit_type: e.target.value })} className="field mt-2">{inventoryUnits.map((u) => <option key={u}>{u}</option>)}</select></Label><Label t="تكلفة الوحدة"><input type="number" value={dialog.default_unit_cost} onChange={(e) => setDialog({ ...dialog, default_unit_cost: e.target.value })} className="field mt-2" /></Label><Label t="العملة"><select value={currency.currency_code} onChange={(e) => setCurrency(e.target.value)} className="field mt-2">{inventoryCurrencies.map((c) => <option key={c.currency_code} value={c.currency_code}>{c.currency_code} - {c.currency_name}</option>)}</select></Label><Label t="سعر الصرف"><input type="number" value={dialog.exchange_rate || currency.exchange_rate} onChange={(e) => setDialog({ ...dialog, exchange_rate: e.target.value })} className="field mt-2" /></Label><Label t="الحد الأدنى"><input type="number" value={dialog.minimum_stock} onChange={(e) => setDialog({ ...dialog, minimum_stock: e.target.value })} className="field mt-2" /></Label><Label t="نقطة إعادة الطلب"><input type="number" value={dialog.reorder_point} onChange={(e) => setDialog({ ...dialog, reorder_point: e.target.value })} className="field mt-2" /></Label><Label t="الرصيد الافتتاحي"><input type="number" value={dialog.opening_balance} onChange={(e) => setDialog({ ...dialog, opening_balance: e.target.value, current_balance: e.target.value })} className="field mt-2" /></Label><Label t="إجمالي السعر"><input readOnly value={`${nf.format(totals.total_value)} ${totals.currency_code}`} className="field mt-2 bg-slate-50" /></Label><Label t="الإجمالي بالعملة الأساسية"><input readOnly value={`${nf.format(totals.total_value_base)} YER`} className="field mt-2 bg-slate-50" /></Label><Label t="الحالة"><select value={String(dialog.is_active)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">غير نشط</option></select></Label><Label t="ملاحظات"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>;
}


function InventorySupplierDialog({ dialog, setDialog, save }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6"><DialogTitle title="بيانات المورد" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-2"><Label t="اسم المورد"><input required value={dialog.supplier_name} onChange={(e) => setDialog({ ...dialog, supplier_name: e.target.value })} className="field mt-2" /></Label><Label t="الهاتف"><input value={dialog.phone} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label><Label t="العنوان"><input value={dialog.address} onChange={(e) => setDialog({ ...dialog, address: e.target.value })} className="field mt-2" /></Label><Label t="الرقم الضريبي"><input value={dialog.tax_number} onChange={(e) => setDialog({ ...dialog, tax_number: e.target.value })} className="field mt-2" /></Label><Label t="السجل التجاري"><input value={dialog.commercial_register} onChange={(e) => setDialog({ ...dialog, commercial_register: e.target.value })} className="field mt-2" /></Label><Label t="مسؤول التواصل"><input value={dialog.contact_person} onChange={(e) => setDialog({ ...dialog, contact_person: e.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={String(dialog.is_active)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">غير نشط</option></select></Label><Label t="ملاحظات"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>;
}

function InventoryDocumentDialog({ dialog, setDialog, save, items, suppliers }) {
  const currentCurrency = getInventoryCurrency(dialog.currency_code || "YER");
  const setCurrency = (code) => {
    const c = getInventoryCurrency(code);
    setDialog({ ...dialog, currency_code: c.currency_code, currency_name: c.currency_name, exchange_rate: c.exchange_rate, base_currency_code: "YER", details: (dialog.details || []).map((d) => ({ ...d, currency_code: c.currency_code, currency_name: c.currency_name, exchange_rate: c.exchange_rate, base_currency_code: "YER", ...calculateInventoryLineTotal({ ...d, currency_code: c.currency_code, exchange_rate: c.exchange_rate }) })) });
  };
  const addDetail = () => {
    const item = items[0] || {};
    const totals = calculateInventoryLineTotal({ quantity: 1, unit_cost: item.default_unit_cost || 0, currency_code: dialog.currency_code || item.default_currency_code || "YER", exchange_rate: dialog.exchange_rate || item.exchange_rate || 1 });
    setDialog({ ...dialog, details: [...(dialog.details || []), { detail_id: `D-${Date.now()}`, item_id: item.item_id || "", item_code: item.item_code || "", item_name: item.item_name || "", category: item.category || "", unit_type: item.unit_type || "", quantity: 1, unit_cost: item.default_unit_cost || 0, unit_price: item.default_unit_cost || 0, notes: "", ...totals }] });
  };
  const updateDetail = (index, patch) => setDialog({ ...dialog, details: (dialog.details || []).map((d, i) => i === index ? { ...d, ...patch, ...calculateInventoryLineTotal({ ...d, ...patch, currency_code: patch.currency_code || d.currency_code || dialog.currency_code || "YER", exchange_rate: patch.exchange_rate || d.exchange_rate || dialog.exchange_rate || 1 }) } : d) });
  const selectItem = (index, itemId) => {
    const item = items.find((x) => x.item_id === itemId) || {};
    updateDetail(index, { item_id: item.item_id, item_code: item.item_code, item_name: item.item_name, category: item.category, unit_type: item.unit_type, unit_cost: item.default_unit_cost, unit_price: item.default_unit_cost, currency_code: dialog.currency_code || item.default_currency_code || "YER", currency_name: dialog.currency_name || item.default_currency_name || getInventoryCurrency(item.default_currency_code || "YER").currency_name, exchange_rate: dialog.exchange_rate || item.exchange_rate || 1 });
  };
  const selectSupplier = (supplierId) => { const supplier = suppliers.find((x) => x.supplier_id === supplierId); setDialog({ ...dialog, supplier_id: supplierId, supplier_name: supplier?.supplier_name || "" }); };
  const docTotals = (dialog.details || []).reduce((acc, d) => ({ total: acc.total + Number(d.total_value || 0), base: acc.base + Number(d.total_value_base || 0) }), { total: 0, base: 0 });
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-6xl overflow-y-auto p-6"><DialogTitle title={inventoryDocumentConfigs[dialog.type]?.label || "مستند مخزني"} close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-4"><Label t="رقم المستند"><input value={dialog.document_number} onChange={(e) => setDialog({ ...dialog, document_number: e.target.value })} className="field mt-2" /></Label><Label t="تاريخ المستند"><input required type="date" value={dialog.document_date} onChange={(e) => setDialog({ ...dialog, document_date: e.target.value })} className="field mt-2" /></Label><Label t="المورد"><select value={dialog.supplier_id} onChange={(e) => selectSupplier(e.target.value)} className="field mt-2"><option value="">بدون مورد</option>{suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}</select></Label><Label t="الفرع"><select value={dialog.branch || dialog.requesting_branch} onChange={(e) => setDialog({ ...dialog, branch: e.target.value, requesting_branch: e.target.value })} className="field mt-2">{branches.map((b) => <option key={b}>{b}</option>)}</select></Label><Label t="العملة"><select value={currentCurrency.currency_code} onChange={(e) => setCurrency(e.target.value)} className="field mt-2">{inventoryCurrencies.map((c) => <option key={c.currency_code} value={c.currency_code}>{c.currency_code} - {c.currency_name}</option>)}</select></Label><Label t="سعر الصرف"><input type="number" value={dialog.exchange_rate || currentCurrency.exchange_rate} onChange={(e) => setDialog({ ...dialog, exchange_rate: e.target.value, details: (dialog.details || []).map((d) => ({ ...d, exchange_rate: e.target.value, ...calculateInventoryLineTotal({ ...d, exchange_rate: e.target.value }) })) })} className="field mt-2" /></Label><Label t="إجمالي السعر"><input readOnly value={`${nf.format(docTotals.total)} ${currentCurrency.currency_code}`} className="field mt-2 bg-slate-50" /></Label><Label t="الإجمالي بالعملة الأساسية"><input readOnly value={`${nf.format(docTotals.base)} YER`} className="field mt-2 bg-slate-50" /></Label><Label t="الأولوية"><select value={dialog.priority || "عادي"} onChange={(e) => setDialog({ ...dialog, priority: e.target.value })} className="field mt-2"><option>عادي</option><option>عاجل</option><option>طارئ</option></select></Label><Label t="الحالة"><select value={dialog.status} onChange={(e) => setDialog({ ...dialog, status: e.target.value, approval_status: e.target.value })} className="field mt-2">{inventoryStatusFlow.map((s) => <option key={s}>{s}</option>)}</select></Label><Label t="ملاحظات"><input value={dialog.notes || ""} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2" /></Label></div>{dialog.type !== "invoices" && dialog.type !== "adjustments" && <div className="mt-6 rounded-2xl border p-4"><div className="mb-3 flex"><h4 className="font-extrabold">تفاصيل الأصناف</h4><button type="button" onClick={addDetail} className="btn-secondary mr-auto"><Plus size={15} /> إضافة صنف</button></div><div className="space-y-2">{(dialog.details || []).map((d, i) => <div key={d.detail_id || i} className="grid gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-8"><select value={d.item_id} onChange={(e) => selectItem(i, e.target.value)} className="field"><option value="">اختر الصنف</option>{items.map((item) => <option key={item.item_id} value={item.item_id}>{item.item_name}</option>)}</select><input value={d.unit_type} readOnly className="field bg-white" /><input type="number" value={d.quantity} onChange={(e) => updateDetail(i, { quantity: e.target.value })} className="field" placeholder="اكتب سبب طلب المراجعة..." /><input type="number" value={d.unit_cost || d.unit_price} onChange={(e) => updateDetail(i, { unit_cost: e.target.value, unit_price: e.target.value })} className="field" placeholder="اكتب سبب طلب المراجعة..." /><select value={d.currency_code || currentCurrency.currency_code} onChange={(e) => { const c = getInventoryCurrency(e.target.value); updateDetail(i, { currency_code: c.currency_code, currency_name: c.currency_name, exchange_rate: c.exchange_rate }); }} className="field">{inventoryCurrencies.map((c) => <option key={c.currency_code} value={c.currency_code}>{c.currency_code}</option>)}</select><input type="number" value={d.exchange_rate || currentCurrency.exchange_rate} onChange={(e) => updateDetail(i, { exchange_rate: e.target.value })} className="field" /><input value={`${nf.format(Number(d.total_value || 0))} ${d.currency_code || currentCurrency.currency_code}`} readOnly className="field bg-white" /><button type="button" onClick={() => setDialog({ ...dialog, details: dialog.details.filter((_, idx) => idx !== i) })} className="btn-secondary text-red-600">حذف</button><input value={`${nf.format(Number(d.total_value_base || 0))} YER`} readOnly className="field bg-white md:col-span-2" /></div>)}</div></div>}<DialogActions close={() => setDialog(null)} /></form></div>;
}

const normalizeLegacyShiftPeriods = (types, periods) => {
  const existing = Array.isArray(periods) ? periods : [];
  const generated = types
    .filter((type) => !existing.some((period) => period.shift_type_id === type.shift_type_id) && type.start_time && type.end_time)
    .map((type) => ({
      period_id: `LEGACY-${type.shift_type_id}`,
      shift_type_id: type.shift_type_id,
      period_name: type.shift_period || "فترة العمل",
      start_time: type.start_time,
      end_time: type.end_time,
      total_hours: calculateShiftHours(type.start_time, type.end_time),
      sort_order: 1,
      is_active: true,
      notes: "",
      legacy: true,
    }));
  return [...existing, ...generated].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
};
const periodsForShift = (shiftTypeId, periods) => periods.filter((period) => period.shift_type_id === shiftTypeId && period.is_active !== false);
const shiftTotalHours = (type, periods) => {
  if (type.shift_mode === "مرن") return Number(type.required_hours || type.total_hours || 0);
  const rows = periodsForShift(type.shift_type_id, periods);
  return Number((rows.reduce((sum, period) => sum + Number(period.total_hours || calculateShiftHours(period.start_time, period.end_time)), 0) || type.total_hours || 0).toFixed(2));
};
const shiftTimelineStyle = (period) => {
  const start = minutesOf(period.start_time);
  let end = minutesOf(period.end_time);
  if (end <= start) end += 1440;
  return {
    right: `${Math.min(100, (start / 1440) * 100)}%`,
    width: `${Math.max(4, Math.min(100, ((end - start) / 1440) * 100))}%`,
  };
};

function EmployeeShiftsPage({ employees, setEmployees, role, currentUser, can }) {
  const [tab, setTab] = useState("types");
  const [shiftTypes, setShiftTypes] = useState([]);
  const [shiftTypePeriods, setShiftTypePeriods] = useState([]);
  const [usedShifts, setUsedShifts] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [scenarioDetails, setScenarioDetails] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [employeeDialog, setEmployeeDialog] = useState(null);
  const [filters, setFilters] = useState({ q: "", branch: "all", period: "all", active: "all", date: "", month: "", employee: "", shift: "all", status: "all" });
  const canCreate = can?.("shifts", "can_create") !== false;
  const canEdit = can?.("shifts", "can_edit") !== false;
  const canDelete = can?.("shifts", "can_delete") !== false;
  const canExport = can?.("shifts", "can_export") !== false;
  const load = async () => {
    setLoading(true);
    setError("");
    try {
	      const [types, used, periods, sc, details, ass] = await Promise.all([
        shiftsService.listTypes(),
        shiftsService.listUsed(),
        shiftsService.listPeriods(),
        shiftScenariosService.listScenarios(),
        shiftScenariosService.listDetails(),
        shiftAssignmentsService.list(),
      ]);
      const normalizedPeriods = normalizeLegacyShiftPeriods(types, periods);
      setShiftTypes(types.map((type) => ({ ...type, total_hours: shiftTotalHours(type, normalizedPeriods) })));
      setShiftTypePeriods(normalizedPeriods);
      setUsedShifts(used);
      setScenarios(sc);
      setScenarioDetails(details);
      setAssignments(ass);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const unsubs = [
      shiftsService.subscribeTypes(load),
      shiftsService.subscribePeriods(load),
      shiftsService.subscribeUsed(load),
      shiftScenariosService.subscribeScenarios(load),
      shiftScenariosService.subscribeDetails(load),
      shiftAssignmentsService.subscribe(load),
    ];
    return () => unsubs.forEach((u) => u?.());
  }, []);
  const visibleAssignments = assignments.filter((a) => {
    if (String(role).includes("الموظف") && currentUser?.employeeId) return a.employee_id === currentUser.employeeId;
    if (String(role).includes("مدير فرع") && currentUser?.branch) return a.branch === currentUser.branch;
    return true;
  });
  const today = new Date().toISOString().slice(0, 10);
  const todayAssignments = visibleAssignments.filter((a) => a.assignment_date === today);
  const scheduledIds = new Set(todayAssignments.map((a) => a.employee_id));
  const shortageBranches = usedShifts.filter((u) => u.is_active && u.min_employees).filter((u) => todayAssignments.filter((a) => a.branch === u.branch && a.shift_type_id === u.shift_type_id).length < u.min_employees);
  const conflictRows = visibleAssignments.filter((a, i, arr) => arr.some((b, j) => i !== j && a.assignment_date === b.assignment_date && a.employee_id === b.employee_id && shiftsOverlap(a, b)));
  const pressureBranch = Object.entries(groupCount(todayAssignments, "branch")).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const cards = [
    ["إجمالي الشفتات", shiftTypes.length, CalendarCheck],
    ["الشفتات النشطة", shiftTypes.filter((s) => s.is_active).length, BadgeCheck],
    ["الموظفون المجدولون اليوم", scheduledIds.size, Users],
    ["الفروع التي لديها نقص تغطية", new Set(shortageBranches.map((x) => x.branch)).size, AlertTriangle],
    ["إجمالي ساعات العمل اليوم", todayAssignments.reduce((s, a) => s + Number(a.total_hours || 0), 0).toFixed(1), Clock3],
    ["عدد التعارضات", conflictRows.length, MessageSquareWarning],
    ["الموظفون غير المجدولين", employees.filter((e) => !scheduledIds.has(e.id)).length, UserCheck],
    ["أكثر فرع لديه ضغط شفتات", pressureBranch, Building2],
  ];
  const filteredAssignments = visibleAssignments.filter((a) =>
    (!filters.date || a.assignment_date === filters.date) &&
    (!filters.month || String(a.assignment_date || "").startsWith(filters.month)) &&
    (filters.branch === "all" || a.branch === filters.branch) &&
    (!filters.employee || a.employee_name.includes(filters.employee) || a.employee_id.includes(filters.employee)) &&
    (filters.shift === "all" || a.shift_type_id === filters.shift) &&
    (filters.status === "all" || a.status === filters.status)
  );
  const saveType = async (e) => {
    e.preventDefault();
    const exists = shiftTypes.some((s) => s.shift_type_id === dialog.shift_type_id);
    if ((exists && !canEdit) || (!exists && !canCreate)) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    const activePeriods = (dialog.periods || []).filter((period) => period.is_active !== false);
    if (!dialog.shift_name?.trim()) return alert("يجب إدخال اسم الشفت");
    if (!dialog.shift_mode) return alert("يجب تحديد نوع الشفت ثابت أو مرن");
    if (dialog.shift_mode === "ثابت" && !activePeriods.length) return alert("يجب إضافة فترة واحدة على الأقل");
    if (activePeriods.some((period) => !period.start_time || !period.end_time)) return alert("يجب إدخال وقت البداية والنهاية");
    if (activePeriods.some((period) => calculateShiftHours(period.start_time, period.end_time) <= 0)) return alert("عدد ساعات الشفت غير صحيح");
    if (dialog.shift_mode === "مرن" && (!Number(dialog.required_hours) || !dialog.flexible_start_from || !dialog.flexible_end_until)) return alert("يجب تحديد نطاق الشفت المرن وعدد الساعات المطلوبة");
    try {
      const totalHours = dialog.shift_mode === "مرن"
        ? Number(dialog.required_hours || 0)
        : activePeriods.reduce((sum, period) => sum + calculateShiftHours(period.start_time, period.end_time), 0);
      const primary = activePeriods[0] || dialog;
      const saved = await shiftsService.saveType({ ...dialog, start_time: primary.start_time, end_time: primary.end_time, total_hours: totalHours });
      const savedPeriods = await shiftsService.savePeriods(saved.shift_type_id, activePeriods.map((period, index) => ({
        ...period,
        period_id: String(period.period_id || "").startsWith("LEGACY-") ? `STP-${Date.now()}-${index}` : period.period_id,
        shift_type_id: saved.shift_type_id,
        total_hours: calculateShiftHours(period.start_time, period.end_time),
        sort_order: index + 1,
      })));
      setShiftTypes((list) => upsertLocal(list, saved, "shift_type_id"));
      setShiftTypePeriods((list) => [...list.filter((period) => period.shift_type_id !== saved.shift_type_id), ...savedPeriods]);
      setDialog(null);
    } catch (err) { alert(err.message); }
  };
  const saveUsed = async (e) => {
    e.preventDefault();
    const duplicate = usedShifts.find((u) => u.used_shift_id !== dialog.used_shift_id && u.is_active && dialog.is_active !== false && u.branch === dialog.branch && u.start_time === dialog.start_time && u.end_time === dialog.end_time);
    if (duplicate && !confirm("يوجد شفت نشط بنفس الفرع ونفس الفترة. هل تريد المتابعة؟")) return;
    try {
      const saved = await shiftsService.saveUsed(dialog);
      setUsedShifts((list) => upsertLocal(list, saved, "used_shift_id"));
      setDialog(null);
    } catch (err) { alert(err.message); }
  };
  const saveScenario = async (e) => {
    e.preventDefault();
    try {
      const saved = await shiftScenariosService.saveScenario(dialog, dialog.details || []);
      setScenarios((list) => upsertLocal(list, saved.scenario, "scenario_id"));
      if (saved.details.length) setScenarioDetails((list) => [...list.filter((d) => d.scenario_id !== saved.scenario.scenario_id), ...saved.details]);
      setDialog(null);
    } catch (err) { alert(err.message); }
  };
  const selectShiftForDialog = (shiftTypeId) => {
    const s = shiftTypes.find((x) => x.shift_type_id === shiftTypeId);
    const rows = periodsForShift(shiftTypeId, shiftTypePeriods);
    const first = rows[0] || s || {};
    const last = rows[rows.length - 1] || s || {};
    setDialog((d) => ({
      ...d,
      shift_type_id: shiftTypeId,
      shift_name: s?.shift_name || "",
      shift_mode: s?.shift_mode || "ثابت",
      shift_periods: rows,
      start_time: first.start_time || "",
      end_time: last.end_time || "",
      total_hours: shiftTotalHours(s || {}, shiftTypePeriods),
    }));
  };
  const saveAssignments = async (e) => {
    e.preventDefault();
    if (!canCreate) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    const selected = employees.filter((emp) => (dialog.selected_employee_ids || []).includes(emp.id));
    const rows = selected.map((emp) => ({
      assignment_id: `${dialog.assignment_date}-${emp.id}-${dialog.shift_type_id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      assignment_date: dialog.assignment_date,
      branch: emp.branch,
      employee_id: emp.id,
      employee_name: emp.name,
      employee_phone: emp.phone,
      job: emp.job,
      shift_type_id: dialog.shift_type_id,
      shift_name: dialog.shift_name,
      shift_mode: dialog.shift_mode || "ثابت",
      shift_periods: dialog.shift_periods || [],
      start_time: dialog.start_time,
      end_time: dialog.end_time,
      total_hours: Number(dialog.total_hours || calculateShiftHours(dialog.start_time, dialog.end_time)),
      status: "مجدول",
      notes: dialog.notes || "",
    }));
    if (!rows.length) return alert("يرجى اختيار موظف واحد على الأقل.");
    const warnings = [];
    rows.forEach((row) => {
      if (assignments.some((a) => a.assignment_date === row.assignment_date && a.employee_id === row.employee_id && shiftsOverlap(a, row))) warnings.push(`الموظف ${row.employee_name} في إجازة`);
      const employee = employees.find((emp) => emp.id === row.employee_id);
      if (employee?.status === "إجازة") warnings.push(`الموظف ${row.employee_name} في إجازة`);
      const used = usedShifts.find((u) => u.branch === row.branch && u.shift_type_id === row.shift_type_id && u.is_active);
      if (used) {
        const count = assignments.filter((a) => a.assignment_date === row.assignment_date && a.branch === row.branch && a.shift_type_id === row.shift_type_id).length + rows.filter((r) => r.branch === row.branch && r.shift_type_id === row.shift_type_id).length;
        if (used.min_employees && count < used.min_employees) warnings.push(`لا توجد تغطية كافية لهذا الفرع: ${row.branch}`);
        if (used.max_employees && count > used.max_employees) warnings.push(`عدد الموظفين أكبر من الحد الأقصى في ${row.branch}`);
      }
    });
    if (warnings.length && !canOverrideShiftConflicts(role)) return alert(warnings.join("\n"));
    if (warnings.length && !confirm(`${warnings.join("\n")}\nهل تريد المتابعة؟`)) return;
    try {
      const saved = await shiftAssignmentsService.save(rows);
      setAssignments((list) => [...saved, ...list]);
      setDialog(null);
    } catch (err) { alert(err.message); }
  };
  const removeRecord = async (kind, id) => {
    if (!canDelete) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    if (!confirm("هل تريد حذف السجل؟")) return;
    try {
      if (kind === "type") { await shiftsService.removeType(id); setShiftTypes((list) => list.filter((x) => x.shift_type_id !== id)); }
      else if (kind === "used") { await shiftsService.removeUsed(id); setUsedShifts((list) => list.filter((x) => x.used_shift_id !== id)); }
      else if (kind === "scenario") { await shiftScenariosService.removeScenario(id); setScenarios((list) => list.filter((x) => x.scenario_id !== id)); setScenarioDetails((list) => list.filter((x) => x.scenario_id !== id)); }
      else { await shiftAssignmentsService.remove(id); setAssignments((list) => list.filter((x) => x.assignment_id !== id)); }
    } catch (err) { alert(err.message); }
  };
  const copyShiftSchedule = async (fromDate, toDate, targetBranch = "") => {
    const source = assignments.filter((a) => a.assignment_date === fromDate && (!targetBranch || a.branch === targetBranch));
    if (!source.length) return alert("لا توجد شفتات لنسخها من التاريخ المحدد.");
    try {
      const saved = await shiftAssignmentsService.save(source.map((a) => ({ ...a, assignment_id: `${toDate}-${a.employee_id}-${a.shift_type_id}-${Date.now()}-${Math.random().toString(16).slice(2)}`, assignment_date: toDate })));
      setAssignments((list) => [...saved, ...list]);
      alert("تم نسخ الجدول بنجاح");
    } catch (e) { alert(e.message); }
  };
  const exportShiftReport = (title, rows) => {
    const exportRows = reportRowsForExport(rows, shiftAssignmentColumns);
    return { exportRows, print: () => printDocument(title, `<h1>${title}</h1><p>تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}</p>${rowsToReportHtml("", rows, shiftAssignmentColumns)}<div style="margin-top:36px;display:flex;justify-content:space-between"><b>إعداد الموارد البشرية</b><b>اعتماد الإدارة</b></div>`) };
  };
  return (
    <div className="space-y-5">
      <PageHead title="شفتات الموظفين" desc="إدارة أنواع الشفتات والسيناريوهات وتوزيع الموظفين والتقارير" action={<button onClick={() => setTab("assignments")} className="btn-primary"><CalendarCheck size={18} /> توزيع شفت</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}</div>
      <div className="panel flex flex-wrap gap-2 p-2">{shiftTabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>)}</div>
      {loading ? <div className="panel p-6 text-center text-sm text-slate-500">جاري تحميل بيانات الشفتات...</div> : (
        <>
          {tab === "types" && <ShiftTypesTab rows={shiftTypes} periods={shiftTypePeriods} setDialog={setDialog} removeRecord={removeRecord} filters={filters} setFilters={setFilters} />}
          {tab === "used" && <UsedShiftsTab rows={usedShifts} shiftTypes={shiftTypes} periods={shiftTypePeriods} setDialog={setDialog} removeRecord={removeRecord} filters={filters} setFilters={setFilters} />}
          {tab === "scenarios" && <ShiftScenariosTab rows={scenarios} details={scenarioDetails} shiftTypes={shiftTypes} setDialog={setDialog} removeRecord={removeRecord} filters={filters} setFilters={setFilters} />}
          {tab === "assignments" && <ShiftAssignmentsTab rows={filteredAssignments} employees={employees} shiftTypes={shiftTypes} periods={shiftTypePeriods} setDialog={setDialog} removeRecord={removeRecord} filters={filters} setFilters={setFilters} copyShiftSchedule={copyShiftSchedule} setEmployeeDialog={setEmployeeDialog} />}
          {tab === "reports" && <ShiftReportsTab rows={filteredAssignments} employees={employees} assignments={assignments} shiftTypes={shiftTypes} filters={filters} setFilters={setFilters} canExport={canExport} exportShiftReport={exportShiftReport} />}
        </>
      )}
      <ShiftCharts assignments={visibleAssignments} usedShifts={usedShifts} conflicts={conflictRows} />
      {dialog?.kind === "type" && <ShiftTypeDialog dialog={dialog} setDialog={setDialog} save={saveType} />}
      {dialog?.kind === "used" && <UsedShiftDialog dialog={dialog} setDialog={setDialog} save={saveUsed} shiftTypes={shiftTypes} periods={shiftTypePeriods} selectShift={selectShiftForDialog} />}
      {dialog?.kind === "scenario" && <ScenarioDialog dialog={dialog} setDialog={setDialog} save={saveScenario} shiftTypes={shiftTypes} />}
      {dialog?.kind === "assignment" && <AssignmentDialog dialog={dialog} setDialog={setDialog} save={saveAssignments} employees={employees} shiftTypes={shiftTypes} selectShift={selectShiftForDialog} />}
      {employeeDialog && <EmployeeModal editing={employeeDialog.editing} close={() => setEmployeeDialog(null)} setEmployees={setEmployees} />}
    </div>
  );
}

const pageLabels = {
  dashboard: "لوحة التحكم",
  employees: "الموظفون",
  evaluations: "التقييمات",
  incentives: "الحوافز",
  guarantees: "ضمانات الموظفين",
  overtime: "العمل الإضافي",
  shifts: "شفتات الموظفين",
  reports_center: "مركز التقارير",
  reports: "التقارير",
  settings: "الإعدادات",
  users_permissions: "المستخدمون والصلاحيات",
  audit_logs: "سجل العمليات",
};

function ShiftTypesTab({ rows, periods, setDialog, removeRecord, filters, setFilters }) {
  const filtered = rows.filter((r) => (!filters.q || r.shift_name.includes(filters.q)) && (filters.period === "all" || r.shift_period === filters.period));
  return <div className="panel p-4"><div className="mb-4 flex flex-wrap gap-3"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="اكتب سبب طلب المراجعة..." /><select value={filters.period} onChange={(e) => setFilters({ ...filters, period: e.target.value })} className="field max-w-[170px]"><option value="all">كل الفترات</option>{shiftPeriods.map((p) => <option key={p}>{p}</option>)}</select><button onClick={() => setDialog({ kind: "type", shift_type_id: `ST-${Date.now()}`, shift_name: "", start_time: "08:00", end_time: "15:00", total_hours: 7, break_minutes: 0, shift_period: "صباحي", shift_mode: "ثابت", flexible_start_from: "", flexible_end_until: "", required_hours: 0, is_active: true, notes: "", periods: [{ period_id: `STP-${Date.now()}`, period_name: "فترة العمل", start_time: "08:00", end_time: "15:00", total_hours: 7, sort_order: 1, is_active: true, notes: "" }] })} className="btn-primary"><Plus size={17} /> إضافة نوع</button></div><div className="table-wrap"><table><thead><tr><th>الشفت</th><th>نوع الشفت</th><th>عدد الفترات</th><th>الساعات</th><th>الحالة</th><th></th></tr></thead><tbody>{filtered.map((r) => { const rows = periodsForShift(r.shift_type_id, periods); return <tr key={r.shift_type_id}><td><b>{r.shift_name}</b><div className="mt-2 space-y-1 text-xs text-slate-500">{rows.map((p) => <p key={p.period_id}>{p.period_name}: {p.start_time} - {p.end_time}</p>)}</div></td><td><Status>{r.shift_mode || "ثابت"}</Status></td><td>{rows.length}</td><td>{shiftTotalHours(r, periods)}</td><td><Status>{r.is_active ? "نشط" : "غير نشط"}</Status></td><td><button onClick={() => setDialog({ ...r, kind: "type", periods: rows })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => removeRecord("type", r.shift_type_id)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>; })}</tbody></table></div></div>;
}

function UsedShiftsTab({ rows, shiftTypes, periods, setDialog, removeRecord, filters, setFilters }) {
  const filtered = rows.filter((r) => (filters.branch === "all" || r.branch === filters.branch) && (filters.active === "all" || String(r.is_active) === filters.active));
  return <div className="panel p-4"><div className="mb-4 flex flex-wrap gap-3"><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><select value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })} className="field max-w-[160px]"><option value="all">كل الحالات</option><option value="true">نشط</option><option value="false">غير نشط</option></select><button onClick={() => setDialog({ kind: "used", used_shift_id: `US-${Date.now()}`, branch: branches[0], shift_type_id: shiftTypes[0]?.shift_type_id || "", shift_name: shiftTypes[0]?.shift_name || "", start_time: shiftTypes[0]?.start_time || "08:00", end_time: shiftTypes[0]?.end_time || "15:00", required_employees: 1, min_employees: 1, max_employees: 3, active_from: new Date().toISOString().slice(0, 10), active_to: "", is_active: true, notes: "" })} className="btn-primary"><Plus size={17} /> إضافة شفت مستخدم</button></div><div className="table-wrap"><table><thead><tr><th>الفرع</th><th>الشفت</th><th>الفترات</th><th>الإجمالي</th><th>المطلوب</th><th>الأدنى/الأقصى</th><th>الحالة</th><th></th></tr></thead><tbody>{filtered.map((r) => { const rows = periodsForShift(r.shift_type_id, periods); return <tr key={r.used_shift_id}><td>{r.branch}</td><td>{r.shift_name}</td><td><div className="space-y-1 text-xs text-slate-500">{rows.map((p) => <p key={p.period_id}>{p.period_name}: {p.start_time}-{p.end_time}</p>)}</div></td><td>{rows.reduce((s, p) => s + Number(p.total_hours || 0), 0) || calculateShiftHours(r.start_time, r.end_time)}</td><td>{r.required_employees}</td><td>{r.min_employees} / {r.max_employees}</td><td><Status>{r.is_active ? "نشط" : "غير نشط"}</Status></td><td><button onClick={() => setDialog({ ...r, kind: "used" })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => removeRecord("used", r.used_shift_id)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>; })}</tbody></table></div></div>;
}

function ShiftScenariosTab({ rows, details, setDialog, removeRecord, filters, setFilters }) {
  const filtered = rows.filter((r) => (filters.branch === "all" || r.branch === filters.branch || r.branch === "كل الفروع") && (filters.status === "all" || r.scenario_type === filters.status));
  return <div className="panel p-4"><div className="mb-4 flex flex-wrap gap-3"><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">كل الفروع</option><option>كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[160px]"><option value="all">كل الأنواع</option>{scenarioTypes.map((s) => <option key={s}>{s}</option>)}</select><button onClick={() => setDialog({ kind: "scenario", scenario_id: `SC-${Date.now()}`, scenario_name: "", branch: "كل الفروع", scenario_type: "عادي", description: "", is_active: true, details: [] })} className="btn-primary"><Plus size={17} /> إضافة سيناريو</button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((r) => <div key={r.scenario_id} className="rounded-2xl border p-4"><div className="flex"><b>{r.scenario_name}</b><Status>{r.is_active ? "نشط" : "غير نشط"}</Status></div><p className="mt-2 text-sm text-slate-500">{r.branch} • {r.scenario_type}</p><p className="mt-2 text-xs text-slate-400">عدد الشفتات: {details.filter((d) => d.scenario_id === r.scenario_id).length}</p><div className="mt-4 flex gap-2"><button onClick={() => setDialog({ ...r, kind: "scenario", details: details.filter((d) => d.scenario_id === r.scenario_id) })} className="btn-secondary"><Pencil size={15} /> تعديل</button><button onClick={() => removeRecord("scenario", r.scenario_id)} className="btn-secondary text-red-600"><Trash2 size={15} /></button></div></div>)}</div></div>;
}

function ShiftAssignmentsTab({ rows, employees, shiftTypes, periods, setDialog, removeRecord, filters, setFilters, copyShiftSchedule, setEmployeeDialog }) {
  const firstShift = shiftTypes[0] || {};
  const firstPeriods = periodsForShift(firstShift.shift_type_id, periods);
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="field max-w-[170px]" /><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field min-w-[180px]" placeholder="اكتب سبب طلب المراجعة..." /><select value={filters.shift} onChange={(e) => setFilters({ ...filters, shift: e.target.value })} className="field max-w-[180px]"><option value="all">كل الشفتات</option>{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[160px]"><option value="all">كل الحالات</option>{shiftAssignmentStatuses.map((s) => <option key={s}>{s}</option>)}</select><button onClick={() => setDialog({ kind: "assignment", assignment_date: new Date().toISOString().slice(0, 10), shift_type_id: firstShift.shift_type_id || "", shift_name: firstShift.shift_name || "", shift_mode: firstShift.shift_mode || "ثابت", shift_periods: firstPeriods, start_time: firstPeriods[0]?.start_time || firstShift.start_time || "08:00", end_time: firstPeriods[firstPeriods.length - 1]?.end_time || firstShift.end_time || "15:00", total_hours: shiftTotalHours(firstShift, periods), selected_employee_ids: [], notes: "" })} className="btn-primary"><Plus size={17} /> توزيع شفت</button><button onClick={() => setEmployeeDialog({ editing: null })} className="btn-secondary"><Users size={17} /> إضافة موظف</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr>{shiftAssignmentColumns.map((c) => <th key={c.key}>{c.label}</th>)}<th>واتساب</th><th></th></tr></thead><tbody>{rows.map((r) => <tr key={r.assignment_id}><td>{r.assignment_date}</td><td>{r.employee_name}</td><td>{r.branch}</td><td><b>{r.shift_name}</b><p className="mt-1 text-xs text-slate-400">{r.shift_mode || "ثابت"}</p><div className="mt-1 space-y-1 text-xs text-slate-500">{(r.shift_periods || []).map((p) => <p key={p.period_id || p.period_name}>{p.period_name}: {p.start_time}-{p.end_time}</p>)}</div></td><td>{r.start_time}</td><td>{r.end_time}</td><td>{r.total_hours}</td><td><Status>{r.status}</Status></td><td><button onClick={() => navigator.clipboard?.writeText(makeShiftMessage(r)).then(() => alert("تم نسخ الرسالة"))} className="btn-secondary !h-9 !px-3">نسخ الرسالة</button><button onClick={() => window.open(`https://wa.me/${normalizeWhatsAppPhone(r.employee_phone)}?text=${encodeURIComponent(makeShiftMessage(r))}`, "_blank")} className="btn-secondary !h-9 !px-3">فتح واتساب</button></td><td><button onClick={() => removeRecord("assignment", r.assignment_id)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div><CopyScheduleBox copyShiftSchedule={copyShiftSchedule} /></div>;
}

function CopyScheduleBox({ copyShiftSchedule }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [branch, setBranch] = useState("");
  return <div className="panel flex flex-wrap items-end gap-3 p-4"><Label t="نسخ من تاريخ"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field mt-2" /></Label><Label t="إلى تاريخ"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field mt-2" /></Label><Label t="الفرع اختياري"><select value={branch} onChange={(e) => setBranch(e.target.value)} className="field mt-2"><option value="">كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select></Label><button onClick={() => from && to ? copyShiftSchedule(from, to, branch) : alert("حدد تاريخ النسخ والتاريخ الجديد")} className="btn-secondary">نسخ الجدول</button></div>;
}

function ShiftReportsTab({ rows, employees, assignments, shiftTypes, filters, setFilters, canExport, exportShiftReport }) {
  const unscheduled = employees.filter((e) => !assignments.some((a) => a.employee_id === e.id && (!filters.date || a.assignment_date === filters.date)));
  const conflicts = assignments.filter((a, i, arr) => arr.some((b, j) => i !== j && a.assignment_date === b.assignment_date && a.employee_id === b.employee_id && shiftsOverlap(a, b)));
  const reports = [["تقرير الشفتات اليومي", rows], ["تقرير الشفتات حسب الفرع", rows], ["تقرير الشفتات حسب الموظف", rows], ["تقرير الشفتات حسب الشهر", rows], ["تقرير نقص التغطية", rows.filter((r) => r.status === "غائب")], ["تقرير التعارضات", conflicts], ["تقرير إجمالي ساعات العمل", rows], ["مقارنة الشفتات بين الفروع", rows], ["مقارنة ساعات العمل بين الموظفين", rows], ["تقرير الموظفين غير المجدولين", unscheduled.map((e) => ({ employee_name: e.name, branch: e.branch, job: e.job, status: e.status }))]];
  return <div className="space-y-4"><div className="panel grid gap-3 p-4 md:grid-cols-4 xl:grid-cols-6"><input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="field" /><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field" /><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field"><option value="all">كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field" placeholder="اكتب سبب طلب المراجعة..." /><select value={filters.shift} onChange={(e) => setFilters({ ...filters, shift: e.target.value })} className="field"><option value="all">كل الشفتات</option>{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field"><option value="all">كل الحالات</option>{shiftAssignmentStatuses.map((s) => <option key={s}>{s}</option>)}</select></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reports.map(([title, reportRows]) => { const report = exportShiftReport(title, reportRows); return <div key={title} className="panel p-5"><FileBarChart className="text-brand-700" /><h3 className="mt-3 font-extrabold">{title}</h3><p className="mt-1 text-xs text-slate-500">عدد السجلات: {reportRows.length}</p><div className="mt-5 flex gap-2"><button disabled={!canExport} onClick={() => exportExcel(report.exportRows, title)} className="btn-secondary flex-1"><FileSpreadsheet size={15} /> Excel</button><button onClick={report.print} className="btn-secondary flex-1"><Printer size={15} /> PDF</button><button disabled={!canExport} onClick={() => exportDocx(title, report.exportRows)} className="btn-secondary flex-1"><Download size={15} /> Word</button></div></div>; })}</div></div>;
}

function ShiftCharts({ assignments, usedShifts, conflicts }) {
  const byBranch = Object.entries(groupCount(assignments, "branch")).map(([name, value]) => ({ name, value }));
  const byDay = Object.entries(groupCount(assignments, "assignment_date")).map(([name, value]) => ({ name, value }));
  const byEmployeeHours = Object.entries(assignments.reduce((acc, a) => ({ ...acc, [a.employee_name]: (acc[a.employee_name] || 0) + Number(a.total_hours || 0) }), {})).slice(0, 10).map(([name, value]) => ({ name, value }));
  const coverage = usedShifts.map((u) => ({ name: u.branch, value: assignments.filter((a) => a.branch === u.branch && a.shift_type_id === u.shift_type_id).length }));
  const conflictByBranch = Object.entries(groupCount(conflicts, "branch")).map(([name, value]) => ({ name, value }));
  if (!assignments.length && !usedShifts.length) return null;
  return <div className="grid gap-5 xl:grid-cols-2"><Chart title="الشفتات حسب الفروع" sub="عدد التوزيعات"><ResponsiveContainer width="100%" height={220}><BarChart data={byBranch}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart><Chart title="الشفتات حسب الأيام" sub="التوزيع اليومي"><ResponsiveContainer width="100%" height={220}><AreaChart data={byDay}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Area dataKey="value" stroke="#7f1d1d" fill="#fbe5e5" /></AreaChart></ResponsiveContainer></Chart><Chart title="ساعات العمل حسب الموظفين" sub="أعلى 10 موظفين"><ResponsiveContainer width="100%" height={220}><BarChart data={byEmployeeHours}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="#991b1b" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart><Chart title="التغطية والتعارضات حسب الفرع" sub="مؤشرات رقابية"><ResponsiveContainer width="100%" height={220}><BarChart data={[...coverage, ...conflictByBranch]}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart></div>;
}

function ShiftTypeDialog({ dialog, setDialog, save }) {
  const periods = dialog.periods || [];
  const updatePeriod = (index, patch) => setDialog({ ...dialog, periods: periods.map((period, i) => i === index ? { ...period, ...patch } : period) });
  const addPeriod = () => setDialog({ ...dialog, periods: [...periods, { period_id: `STP-${Date.now()}`, period_name: `فترة ${periods.length + 1}`, start_time: "08:00", end_time: "12:00", total_hours: 4, sort_order: periods.length + 1, is_active: true, notes: "" }] });
  const totalHours = dialog.shift_mode === "مرن" ? Number(dialog.required_hours || 0) : periods.filter((p) => p.is_active !== false).reduce((sum, p) => sum + calculateShiftHours(p.start_time, p.end_time), 0);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="بيانات نوع الشفت" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="اسم الشفت"><input required value={dialog.shift_name} onChange={(e) => setDialog({ ...dialog, shift_name: e.target.value })} className="field mt-2" /></Label><Label t="نوع الشفت"><select value={dialog.shift_mode || "ثابت"} onChange={(e) => setDialog({ ...dialog, shift_mode: e.target.value })} className="field mt-2"><option>ثابت</option><option>مرن</option></select></Label><Label t="الفترة"><select value={dialog.shift_period} onChange={(e) => setDialog({ ...dialog, shift_period: e.target.value })} className="field mt-2">{shiftPeriods.map((p) => <option key={p}>{p}</option>)}</select></Label><Label t="إجمالي الساعات"><input readOnly value={Number(totalHours).toFixed(2)} className="field mt-2 bg-slate-50" /></Label><Label t="دقائق الاستراحة"><input type="number" value={dialog.break_minutes} onChange={(e) => setDialog({ ...dialog, break_minutes: e.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={String(dialog.is_active)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">غير نشط</option></select></Label>{dialog.shift_mode === "مرن" && <><Label t="بداية النطاق المسموح"><input type="time" value={dialog.flexible_start_from || ""} onChange={(e) => setDialog({ ...dialog, flexible_start_from: e.target.value })} className="field mt-2" /></Label><Label t="نهاية النطاق المسموح"><input type="time" value={dialog.flexible_end_until || ""} onChange={(e) => setDialog({ ...dialog, flexible_end_until: e.target.value })} className="field mt-2" /></Label><Label t="عدد الساعات المطلوبة"><input type="number" step="0.25" value={dialog.required_hours || ""} onChange={(e) => setDialog({ ...dialog, required_hours: e.target.value })} className="field mt-2" /></Label></>}<Label t="ملاحظات"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><div className="mt-6 rounded-2xl border p-4"><div className="mb-3 flex"><h4 className="font-extrabold">فترات الشفت</h4><button type="button" onClick={addPeriod} className="btn-secondary mr-auto"><Plus size={15} /> إضافة فترة</button></div><div className="space-y-3">{periods.map((period, index) => <div key={period.period_id || index} className="rounded-2xl bg-slate-50 p-3"><div className="grid gap-3 md:grid-cols-5"><input value={period.period_name} onChange={(e) => updatePeriod(index, { period_name: e.target.value })} className="field" placeholder="اكتب سبب طلب المراجعة..." /><input type="time" value={period.start_time} onChange={(e) => updatePeriod(index, { start_time: e.target.value, total_hours: calculateShiftHours(e.target.value, period.end_time) })} className="field" /><input type="time" value={period.end_time} onChange={(e) => updatePeriod(index, { end_time: e.target.value, total_hours: calculateShiftHours(period.start_time, e.target.value) })} className="field" /><input readOnly value={calculateShiftHours(period.start_time, period.end_time)} className="field bg-white" /><button type="button" onClick={() => setDialog({ ...dialog, periods: periods.filter((_, i) => i !== index) })} className="btn-secondary text-red-600">حذف</button></div><input value={period.notes || ""} onChange={(e) => updatePeriod(index, { notes: e.target.value })} className="field mt-2" placeholder="اكتب سبب طلب المراجعة..." /><ShiftPeriodTimeline periods={[period]} /></div>)}</div></div><DialogActions close={() => setDialog(null)} /></form></div>;
}

function UsedShiftDialog({ dialog, setDialog, save, shiftTypes, selectShift }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel w-full max-w-4xl p-6"><DialogTitle title="الشفت المستخدم" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="الفرع"><select value={dialog.branch} onChange={(e) => setDialog({ ...dialog, branch: e.target.value })} className="field mt-2">{branches.map((b) => <option key={b}>{b}</option>)}</select></Label><Label t="نوع الشفت"><select value={dialog.shift_type_id} onChange={(e) => selectShift(e.target.value)} className="field mt-2">{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select></Label><Label t="من الساعة"><input type="time" value={dialog.start_time} onChange={(e) => setDialog({ ...dialog, start_time: e.target.value })} className="field mt-2" /></Label><Label t="إلى الساعة"><input type="time" value={dialog.end_time} onChange={(e) => setDialog({ ...dialog, end_time: e.target.value })} className="field mt-2" /></Label><Label t="المطلوب"><input type="number" value={dialog.required_employees} onChange={(e) => setDialog({ ...dialog, required_employees: e.target.value })} className="field mt-2" /></Label><Label t="الحد الأدنى"><input type="number" value={dialog.min_employees} onChange={(e) => setDialog({ ...dialog, min_employees: e.target.value })} className="field mt-2" /></Label><Label t="الحد الأقصى"><input type="number" value={dialog.max_employees} onChange={(e) => setDialog({ ...dialog, max_employees: e.target.value })} className="field mt-2" /></Label><Label t="من تاريخ"><input type="date" value={dialog.active_from} onChange={(e) => setDialog({ ...dialog, active_from: e.target.value })} className="field mt-2" /></Label><Label t="إلى تاريخ"><input type="date" value={dialog.active_to || ""} onChange={(e) => setDialog({ ...dialog, active_to: e.target.value })} className="field mt-2" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>;
}

function ScenarioDialog({ dialog, setDialog, save, shiftTypes }) {
  const addDetail = () => { const s = shiftTypes[0] || {}; setDialog({ ...dialog, details: [...(dialog.details || []), { scenario_detail_id: `SCD-${Date.now()}`, shift_type_id: s.shift_type_id || "", shift_name: s.shift_name || "", start_time: s.start_time || "08:00", end_time: s.end_time || "15:00", required_employees: 1, notes: "" }] }); };
  const updateDetail = (i, patch) => setDialog({ ...dialog, details: (dialog.details || []).map((d, idx) => idx === i ? { ...d, ...patch } : d) });
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="سيناريو الشفتات" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="اسم السيناريو"><input required value={dialog.scenario_name} onChange={(e) => setDialog({ ...dialog, scenario_name: e.target.value })} className="field mt-2" /></Label><Label t="الفرع"><select value={dialog.branch} onChange={(e) => setDialog({ ...dialog, branch: e.target.value })} className="field mt-2"><option>كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select></Label><Label t="النوع"><select value={dialog.scenario_type} onChange={(e) => setDialog({ ...dialog, scenario_type: e.target.value })} className="field mt-2">{scenarioTypes.map((s) => <option key={s}>{s}</option>)}</select></Label><Label t="الوصف"><textarea value={dialog.description} onChange={(e) => setDialog({ ...dialog, description: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><div className="mt-5 flex"><h4 className="font-extrabold">الشفتات داخل السيناريو</h4><button type="button" onClick={addDetail} className="btn-secondary mr-auto"><Plus size={15} /> إضافة شفت</button></div><div className="mt-3 space-y-2">{(dialog.details || []).map((d, i) => <div key={d.scenario_detail_id} className="grid gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-5"><select value={d.shift_type_id} onChange={(e) => { const s = shiftTypes.find((x) => x.shift_type_id === e.target.value); updateDetail(i, { shift_type_id: e.target.value, shift_name: s?.shift_name || "", start_time: s?.start_time || "", end_time: s?.end_time || "" }); }} className="field">{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select><input type="time" value={d.start_time} onChange={(e) => updateDetail(i, { start_time: e.target.value })} className="field" /><input type="time" value={d.end_time} onChange={(e) => updateDetail(i, { end_time: e.target.value })} className="field" /><input type="number" value={d.required_employees} onChange={(e) => updateDetail(i, { required_employees: e.target.value })} className="field" /><button type="button" onClick={() => setDialog({ ...dialog, details: dialog.details.filter((_, idx) => idx !== i) })} className="btn-secondary text-red-600">حذف</button></div>)}</div><DialogActions close={() => setDialog(null)} /></form></div>;
}

function AssignmentDialog({ dialog, setDialog, save, employees, shiftTypes, selectShift }) {
  const selectEmployees = (ids) => setDialog({ ...dialog, selected_employee_ids: ids });
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="توزيع الموظفين على الشفتات" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="التاريخ"><input type="date" value={dialog.assignment_date} onChange={(e) => setDialog({ ...dialog, assignment_date: e.target.value })} className="field mt-2" /></Label><Label t="الشفت"><select value={dialog.shift_type_id} onChange={(e) => selectShift(e.target.value)} className="field mt-2">{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select></Label><Label t="نوع الشفت"><input readOnly value={dialog.shift_mode || "ثابت"} className="field mt-2 bg-slate-50" /></Label><Label t="الساعات"><input readOnly value={Number(dialog.total_hours || calculateShiftHours(dialog.start_time, dialog.end_time)).toFixed(2)} className="field mt-2 bg-slate-50" /></Label><Label t="من"><input type="time" value={dialog.start_time} onChange={(e) => setDialog({ ...dialog, start_time: e.target.value })} className="field mt-2" /></Label><Label t="إلى"><input type="time" value={dialog.end_time} onChange={(e) => setDialog({ ...dialog, end_time: e.target.value })} className="field mt-2" /></Label><Label t="ملاحظات"><input value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2" /></Label></div><div className="mt-4 rounded-2xl border p-3"><b className="text-sm">فترات الشفت</b><div className="mt-2 grid gap-2 md:grid-cols-2">{(dialog.shift_periods || []).map((p) => <div key={p.period_id || p.period_name} className="rounded-xl bg-slate-50 p-3 text-sm"><b>{p.period_name}</b><p className="text-slate-500">{p.start_time} - {p.end_time} • {p.total_hours} ساعات</p></div>)}</div><ShiftPeriodTimeline periods={dialog.shift_periods || []} /></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => selectEmployees(employees.map((e) => e.id))} className="btn-secondary">اختيار كل الموظفين</button>{branches.map((b) => <button type="button" key={b} onClick={() => selectEmployees(employees.filter((e) => e.branch === b).map((e) => e.id))} className="btn-secondary">{b}</button>)}</div><div className="mt-4 grid max-h-72 gap-2 overflow-y-auto rounded-2xl border p-3 md:grid-cols-2">{employees.map((e) => <label key={e.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-sm"><input type="checkbox" checked={(dialog.selected_employee_ids || []).includes(e.id)} onChange={(ev) => setDialog({ ...dialog, selected_employee_ids: ev.target.checked ? [...(dialog.selected_employee_ids || []), e.id] : (dialog.selected_employee_ids || []).filter((id) => id !== e.id) })} />{e.name} - {e.branch} - {e.job}</label>)}</div><p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">عدد الموظفين المختارين: {(dialog.selected_employee_ids || []).length}</p><DialogActions close={() => setDialog(null)} /></form></div>;
}

function ShiftPeriodTimeline({ periods }) {
  return <div className="mt-3 rounded-xl bg-white p-3"><div className="relative h-7 rounded-full bg-slate-100">{(periods || []).filter((p) => p.is_active !== false).map((period) => <div key={period.period_id || period.period_name} className="absolute top-1 h-5 rounded-full bg-brand-700" style={shiftTimelineStyle(period)} title={`${period.period_name}: ${period.start_time}-${period.end_time}`} />)}</div><div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div></div>;
}

function DialogTitle({ title, close }) {
  return <div className="mb-5 flex"><h3 className="text-xl font-extrabold">{title}</h3><button type="button" onClick={close} className="mr-auto"><X /></button></div>;
}
function DialogActions({ close }) {
  return <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={close} className="btn-secondary">إلغاء</button><button className="btn-primary"><Save size={17} /> حفظ البيانات</button></div>;
}

const kpiCriterionTypeOptions = [
  ["behavioral", "إداري / سلوكي"],
  ["operational", "إنتاجي / تشغيلي"],
  ["cash_counting", "عدّ نقدي / عداد"],
  ["financial", "مالي"],
  ["service_quality", "جودة وخدمة عملاء"],
];
const inferCriterionType = (item = {}) => {
  if (item.criterion_type) return item.criterion_type;
  const name = String(item.criterion_name || item.name || "");
  if (/عداد|عد نقدي|فئة|200|500|1000|خزينة|فرز/.test(name)) return "cash_counting";
  if (/الانضباط|الالتزام|السلوك|التعاون|الحضور|الدوام/.test(name)) return "behavioral";
  if (/مالي|مبلغ|قيمة|إيراد|تحصيل/.test(name)) return "financial";
  if (/رضا|شكاوى|خدمة|عميل|سرعة/.test(name)) return "service_quality";
  return "operational";
};
const kpiFieldNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

function PerformanceCriteriaPageEnhanced({ can }) {
  const [templates, setTemplates] = useState([]);
  const [criteriaRows, setCriteriaRows] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [dialog, setDialog] = useState(null);
  const [triedSave, setTriedSave] = useState(false);
  const load = async () => {
    const [t, c] = await Promise.all([performanceCriteriaService.loadJobTemplates(), performanceCriteriaService.loadKpiCriteria()]);
    setTemplates(t);
    setCriteriaRows(c);
    setSelectedJob((j) => j || t[0]?.job_name || Object.keys(defaultJobKpis)[0] || "");
  };
  useEffect(() => { load().catch((e) => alert(e.message)); }, []);
  const rows = criteriaRows.filter((r) => r.job_name === selectedJob);
  const totalWeight = performanceCriteriaService.validateCriteriaWeights(rows);
  const openCriterion = (item = {}) => {
    setTriedSave(false);
    setDialog({
      job_name: selectedJob,
      criterion_name: "",
      criterion_type: inferCriterionType(item),
      weight: 10,
      max_score: 100,
      scoring_type: scoringTypes[0],
      target_value: 100,
      excellent_threshold: 100,
      good_threshold: 80,
      acceptable_threshold: 60,
      cash200: item.cash200 || item.subWeights?.cash200 || 0,
      cash500: item.cash500 || item.subWeights?.cash500 || 0,
      cash1000: item.cash1000 || item.subWeights?.cash1000 || 0,
      affects_incentive: true,
      is_active: true,
      ...item,
      criterion_type: inferCriterionType(item),
    });
  };
  const validationErrors = (() => {
    if (!dialog) return [];
    const errors = [];
    const criterionName = String(dialog.criterion_name || dialog.name || "");
    const showCashDenominationFields = dialog.criterion_type === "cash_counting" && isCashDenominationCriterion(criterionName);
    if (!String(dialog.criterion_name || "").trim()) errors.push("اسم المعيار مطلوب");
    if (Number(dialog.weight) < 0 || Number(dialog.weight) > 100 || Number.isNaN(Number(dialog.weight))) errors.push("الوزن النسبي يجب أن يكون بين 0 و 100");
    if (showCashDenominationFields && [dialog.cash200, dialog.cash500, dialog.cash1000].some((v) => Number(v) < 0 || Number.isNaN(Number(v)))) errors.push("أوزان الفئات النقدية يجب أن تكون أرقامًا صحيحة");
    return errors;
  })();
  const saveCriterion = async (e) => {
    e.preventDefault();
    setTriedSave(true);
    if (validationErrors.length) return;
    try {
      await performanceCriteriaService.saveKpiCriterion({
        ...dialog,
        weight: kpiFieldNumber(dialog.weight),
        max_score: kpiFieldNumber(dialog.max_score || 100),
        target_value: kpiFieldNumber(dialog.target_value),
        excellent_threshold: kpiFieldNumber(dialog.excellent_threshold),
        good_threshold: kpiFieldNumber(dialog.good_threshold),
        acceptable_threshold: kpiFieldNumber(dialog.acceptable_threshold),
        notes: showEnhancedCashDenominationFields
          ? `${dialog.notes || ""}\nأوزان الفئات النقدية: 200=${dialog.cash200 || 0}, 500=${dialog.cash500 || 0}, 1000=${dialog.cash1000 || 0}`.trim()
          : dialog.notes || "",
      });
      setDialog(null);
      load();
    } catch (err) {
      console.error("KPI criterion modal error:", err);
      alert(err.message || "تعذر حفظ البيانات");
    }
  };
  const dialogCriterionName = String(dialog?.criterion_name || dialog?.name || "");
  const showEnhancedCashDenominationFields = dialog?.criterion_type === "cash_counting" && isCashDenominationCriterion(dialogCriterionName);
  return <div className="space-y-5"><PageHead title="معايير الأداء" desc="معايير KPI عادلة ومنفصلة حسب الوظيفة" action={<div className="flex gap-2"><button onClick={() => performanceCriteriaService.seedDefaults().then(load).catch((e) => alert(e.message))} className="btn-secondary">توليد المعايير الافتراضية</button><button disabled={can?.("performance_criteria", "can_create") === false} onClick={() => openCriterion()} className="btn-primary"><Plus size={18} /> إضافة معيار</button></div>} /><div className="panel flex flex-wrap gap-3 p-4"><select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="field max-w-md">{[...new Set([...templates.map((t) => t.job_name), ...Object.keys(defaultJobKpis)])].map((j) => <option key={j}>{j}</option>)}</select><span className={`rounded-xl px-4 py-2 text-sm font-bold ${totalWeight === 100 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>إجمالي الأوزان: {totalWeight}%</span></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>المعيار</th><th>النوع</th><th>الوزن</th><th>طريقة الاحتساب</th><th>المستهدف</th><th>الحافز</th><th>الحالة</th><th></th></tr></thead><tbody>{rows.map((r) => <tr key={r.criterion_id}><td>{r.criterion_name}</td><td>{kpiCriterionTypeOptions.find(([id]) => id === inferCriterionType(r))?.[1]}</td><td>{r.weight}%</td><td>{r.scoring_type}</td><td>{r.target_value}</td><td>{r.affects_incentive ? "نعم" : "لا"}</td><td><Status>{r.is_active ? "نشط" : "معطل"}</Status></td><td><button onClick={() => openCriterion(r)} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => performanceCriteriaService.deleteKpiCriterion(r.criterion_id).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div>{dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={saveCriterion} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"><DialogTitle title="تعديل معيار" close={() => setDialog(null)} />{triedSave && validationErrors.length > 0 && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{validationErrors.map((e) => <p key={e}>{e}</p>)}</div>}<div className="grid gap-4 md:grid-cols-3"><Label t="الوظيفة"><input value={dialog.job_name} onChange={(e) => setDialog({ ...dialog, job_name: e.target.value })} className="field mt-2" /></Label><Label t="اسم المعيار"><input value={dialog.criterion_name} onChange={(e) => setDialog({ ...dialog, criterion_name: e.target.value })} className={`field mt-2 ${triedSave && !String(dialog.criterion_name || "").trim() ? "border-red-300" : ""}`} /></Label><Label t="نوع المعيار"><select value={dialog.criterion_type} onChange={(e) => setDialog({ ...dialog, criterion_type: e.target.value })} className="field mt-2">{kpiCriterionTypeOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Label><Label t="الوزن النسبي %"><input type="number" value={dialog.weight} onChange={(e) => setDialog({ ...dialog, weight: e.target.value })} className="field mt-2" /></Label><Label t="طريقة التقييم"><select value={dialog.scoring_type} onChange={(e) => setDialog({ ...dialog, scoring_type: e.target.value })} className="field mt-2">{scoringTypes.map((s) => <option key={s}>{s}</option>)}</select></Label><Label t="الدرجة القصوى"><input type="number" value={dialog.max_score || 100} onChange={(e) => setDialog({ ...dialog, max_score: e.target.value })} className="field mt-2" /></Label>{dialog.criterion_type === "operational" && <><Label t="الحد الأدنى"><input type="number" value={dialog.acceptable_threshold || 0} onChange={(e) => setDialog({ ...dialog, acceptable_threshold: e.target.value })} className="field mt-2" /></Label><Label t="الهدف"><input type="number" value={dialog.target_value || 0} onChange={(e) => setDialog({ ...dialog, target_value: e.target.value })} className="field mt-2" /></Label><Label t="الحد الممتاز"><input type="number" value={dialog.excellent_threshold || 0} onChange={(e) => setDialog({ ...dialog, excellent_threshold: e.target.value })} className="field mt-2" /></Label></>}{dialog.criterion_type === "financial" && <><Label t="مبلغ مستهدف"><input type="number" value={dialog.target_value || 0} onChange={(e) => setDialog({ ...dialog, target_value: e.target.value })} className="field mt-2" /></Label><Label t="عملة"><input value={dialog.currency || "SAR"} onChange={(e) => setDialog({ ...dialog, currency: e.target.value })} className="field mt-2" /></Label></>}{dialog.criterion_type === "service_quality" && <><Label t="درجة الرضا"><input type="number" value={dialog.satisfaction_score || 0} onChange={(e) => setDialog({ ...dialog, satisfaction_score: e.target.value })} className="field mt-2" /></Label><Label t="عدد الشكاوى"><input type="number" value={dialog.complaints_count || 0} onChange={(e) => setDialog({ ...dialog, complaints_count: e.target.value })} className="field mt-2" /></Label><Label t="سرعة الخدمة"><input value={dialog.service_speed || ""} onChange={(e) => setDialog({ ...dialog, service_speed: e.target.value })} className="field mt-2" /></Label></>}{showEnhancedCashDenominationFields && <div className="md:col-span-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><h4 className="font-extrabold text-amber-800">أوزان الفئات النقدية للعداد</h4><div className="mt-3 grid gap-3 md:grid-cols-3">{[["cash200","فئة 200"],["cash500","فئة 500"],["cash1000","فئة 1000"]].map(([key,label]) => <Label key={key} t={label}><input type="number" min="0" value={dialog[key] || 0} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} className="field mt-2 bg-white" /></Label>)}</div></div>}<Label t="الحالة"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Label><Label t="ملاحظات"><textarea value={dialog.notes || ""} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}</div>;
}

function DailyOperationsPageEnhanced({ employees = [], currentUser, currentCompany, can }) {
  const today = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [importDialog, setImportDialog] = useState(null);
  const [filters, setFilters] = useState({
    month: today.slice(0, 7),
    date: "",
    branch: "all",
    employee: "all",
    operationType: "all",
    status: "all",
  });
  const [loading, setLoading] = useState(true);
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const canCreate = can?.("daily_operations", "can_create") !== false;
  const canEdit = can?.("daily_operations", "can_edit") !== false;
  const canDelete = can?.("daily_operations", "can_delete") !== false;
  const canApprove = can?.("daily_operations", "can_approve") !== false;
  const canExport = can?.("daily_operations", "can_export") !== false;
  const canImport = can?.("daily_operations", "can_import") === true || canCreate;
  const statusOptions = [...new Set([...operationStatuses, ...safeRows.map((row) => row.status)].filter(Boolean))];
  const branchOptions = [...new Set([...safeEmployees.map((employee) => employee.branch), ...safeRows.map((row) => row.branch)].filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "ar"));
  const operationTypeOptions = [...new Set([...operationTypes, ...safeRows.map((row) => row.operation_type)].filter(Boolean))];

  const load = async () => {
    setLoading(true);
    try {
      if (!companyId) throw new Error("لم يتم تحديد الشركة الحالية");
      setRows(await dailyOperationsService.loadDailyOperations({ companyId, month: filters.month }));
    } catch (error) {
      console.error("Daily operations page load error:", error);
      alert(error.message || "تعذر تحميل العمليات اليومية");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsubscribe = dailyOperationsService.subscribe(load);
    return () => unsubscribe?.();
  }, [filters.month, companyId]);

  const filtered = safeRows.filter((row) =>
    (!filters.date || row.operation_date === filters.date)
    && (filters.branch === "all" || row.branch === filters.branch)
    && (filters.employee === "all" || row.employee_id === filters.employee)
    && (filters.operationType === "all" || row.operation_type === filters.operationType)
    && (filters.status === "all" || row.status === filters.status));

  const sum = (key) => filtered.reduce((total, row) => total + Number(row[key] || 0), 0);
  const totalOperations = sum("operation_count");
  const totalErrors = sum("error_count");
  const summaries = [
    ["إجمالي العمليات", totalOperations, Gauge],
    ["العمليات المكتملة", sum("completed_count"), BadgeCheck],
    ["العمليات المعلقة", sum("pending_count"), Clock3],
    ["العمليات المرتجعة", sum("returned_count"), ArrowUpLeft],
    ["عدد الأخطاء", totalErrors, AlertTriangle],
    ["شكاوى العملاء", sum("customer_complaints"), MessageSquareWarning],
    ["نسبة الأخطاء", `${totalOperations ? ((totalErrors / totalOperations) * 100).toFixed(1) : 0}%`, TrendingUp],
    ["المعتمدة", filtered.filter((row) => ["معتمدة", "معتمد"].includes(row.status)).length, BadgeCheck],
  ];
  const byBranch = Object.entries(groupCount(filtered, "branch")).map(([name, value]) => ({ name, value }));

  const pickEmployee = (id) => {
    const employee = safeEmployees.find((item) => item.id === id) || {};
    setDialog((current) => ({
      ...current,
      employee_id: id,
      employee_name: employee.name || "",
      branch: employee.branch || "",
      job_name: employee.job || "",
    }));
  };

  const openAdd = () => {
    if (!canCreate) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    setDialog({
      operation_id: "",
      operation_date: today,
      month: today.slice(0, 7),
      employee_id: "",
      employee_name: "",
      branch: "",
      job_name: "",
      operation_type: operationTypes[0],
      service_channel: serviceChannels[0],
      currency: "YER",
      operation_count: 0,
      completed_count: 0,
      pending_count: 0,
      returned_count: 0,
      error_count: 0,
      customer_complaints: 0,
      amount: 0,
      status: "مسودة",
      notes: "",
    });
  };

  const save = async (event) => {
    event.preventDefault();
    const editing = Boolean(dialog?.operation_id);
    if (editing ? !canEdit : !canCreate) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    try {
      const saved = await dailyOperationsService.saveDailyOperation({
        ...dialog,
        company_id: companyId,
        entered_by: currentUser?.username || "",
      });
      setRows((list) => list.some((item) => item.operation_id === saved.operation_id)
        ? list.map((item) => item.operation_id === saved.operation_id ? saved : item)
        : [saved, ...list]);
      setDialog(null);
    } catch (error) {
      alert(error.message || "تعذر حفظ العملية اليومية");
    }
  };

  const approve = async (row) => {
    if (!canApprove) return alert("لا تملك صلاحية اعتماد العملية");
    try {
      await dailyOperationsService.approveDailyOperation({ ...row, company_id: companyId }, currentUser?.username || "");
      await load();
    } catch (error) {
      alert(error.message);
    }
  };

  const remove = async (row) => {
    if (!canDelete) return alert("لا تملك صلاحية حذف العملية");
    if (!confirm("هل تريد حذف العملية اليومية؟")) return;
    try {
      await dailyOperationsService.deleteDailyOperation(row.operation_id);
      await load();
    } catch (error) {
      alert(error.message);
    }
  };

  const readImportFile = async () => {
    if (!importDialog?.file) return setImportDialog((current) => ({ ...current, message: "لم يتم اختيار ملف" }));
    try {
      setImportDialog((current) => ({ ...current, loading: true, message: "جاري قراءة الملف...", summary: null }));
      const parsed = await parseDailyOperationsExcel(importDialog.file);
      const validated = validateDailyOperationsRows(parsed, safeEmployees, companyId);
      setImportDialog((current) => ({ ...current, rows: validated, loading: false, message: "تمت قراءة الملف والتحقق من البيانات" }));
    } catch (error) {
      console.error("Daily operations Excel read error:", error);
      setImportDialog((current) => ({ ...current, loading: false, message: error.message || "تعذر قراءة ملف Excel" }));
    }
  };

  const saveImportRows = async () => {
    const importRows = Array.isArray(importDialog?.rows) ? importDialog.rows : [];
    const invalidRows = importRows.filter((row) => !row.valid);
    try {
      setImportDialog((current) => ({ ...current, loading: true, message: "جاري استيراد العمليات..." }));
      const result = await importDailyOperationsRows(importRows, companyId, { duplicateMode: importDialog?.duplicateMode || "update" });
      setImportDialog((current) => ({
        ...current,
        loading: false,
        message: "تم استيراد العمليات اليومية بنجاح",
        summary: {
          total: importRows.length,
          imported: result.inserted,
          updated: result.updated,
          skipped: result.skipped,
          errors: invalidRows.map((row) => `الصف ${row.rowNumber}: ${row.validationMessage}`),
        },
      }));
      await load();
    } catch (error) {
      console.error("Daily operations Excel import error:", error);
      setImportDialog((current) => ({
        ...current,
        loading: false,
        message: error.message || "تعذر استيراد العمليات اليومية",
        summary: {
          total: importRows.length,
          imported: 0,
          updated: 0,
          skipped: 0,
          errors: invalidRows.map((row) => `الصف ${row.rowNumber}: ${row.validationMessage}`),
        },
      }));
    }
  };

  const exportRows = (exportedRows, fileName) => {
    if (!canExport) return alert("لا تملك صلاحية تصدير البيانات");
    if (!exportedRows.length) return alert("لا توجد بيانات للتصدير");
    try {
      exportDailyOperationsToExcel(exportedRows, fileName);
    } catch (error) {
      console.error("Daily operations Excel export error:", error);
      alert("تعذر تصدير البيانات");
    }
  };

  const exportEmployeeRows = () => {
    if (filters.employee === "all") return alert("اختر الموظف أولًا");
    exportRows(safeRows.filter((row) => row.employee_id === filters.employee), `daily-operations-employee-${filters.employee}.xlsx`);
  };
  const exportDayRows = () => {
    if (!filters.date) return alert("حدد اليوم أولًا");
    exportRows(safeRows.filter((row) => row.operation_date === filters.date), `daily-operations-day-${filters.date}.xlsx`);
  };
  const exportMonthRows = () => {
    if (!filters.month) return alert("حدد الشهر أولًا");
    exportRows(safeRows.filter((row) => row.month === filters.month || String(row.operation_date || "").startsWith(filters.month)), `daily-operations-month-${filters.month}.xlsx`);
  };

  const numericFields = [
    ["operation_count", "عدد العمليات"],
    ["completed_count", "العمليات المكتملة"],
    ["pending_count", "العمليات المعلقة"],
    ["returned_count", "العمليات المرتجعة"],
    ["error_count", "عدد الأخطاء"],
    ["customer_complaints", "شكاوى العملاء"],
    ["amount", "المبلغ"],
  ];

  return (
    <div className="space-y-5">
      <PageHead
        title="العمليات اليومية"
        desc="تسجيل الإنتاجية اليومية وربطها بالـ KPI والحوافز"
        action={(
          <div className="flex flex-wrap justify-end gap-2">
            <button disabled={!canCreate} onClick={openAdd} className="btn-primary"><Plus size={18} /> إضافة عملية</button>
            <button onClick={downloadDailyOperationsTemplate} className="btn-secondary"><Download size={17} /> تحميل نموذج Excel</button>
            <button disabled={!canImport} onClick={() => setImportDialog({ file: null, rows: [], duplicateMode: "update", message: "", summary: null })} className="btn-secondary disabled:opacity-50"><Upload size={17} /> استيراد Excel</button>
            <button disabled={!canExport} onClick={() => exportRows(filtered, `daily-operations-visible-${today}.xlsx`)} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> تصدير Excel</button>
            <button disabled={!canExport} onClick={exportEmployeeRows} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> تصدير عمليات موظف</button>
            <button disabled={!canExport} onClick={exportDayRows} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> تصدير عمليات يوم محدد</button>
            <button disabled={!canExport} onClick={exportMonthRows} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> تصدير عمليات شهر محدد</button>
          </div>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaries.map(([label, value, Icon]) => <Mini key={label} label={label} value={value} I={Icon} />)}
      </div>

      <div className="panel flex flex-wrap gap-3 p-4">
        <input type="month" value={filters.month} onChange={(event) => setFilters({ ...filters, month: event.target.value })} className="field max-w-[160px]" />
        <input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value, month: event.target.value ? event.target.value.slice(0, 7) : filters.month })} className="field max-w-[170px]" />
        <select value={filters.branch} onChange={(event) => setFilters({ ...filters, branch: event.target.value })} className="field max-w-[190px]"><option value="all">كل الفروع</option>{branchOptions.map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select>
        <select value={filters.employee} onChange={(event) => setFilters({ ...filters, employee: event.target.value })} className="field max-w-[230px]"><option value="all">كل الموظفين</option>{safeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} - {employee.id}</option>)}</select>
        <select value={filters.operationType} onChange={(event) => setFilters({ ...filters, operationType: event.target.value })} className="field max-w-[210px]"><option value="all">كل أنواع العمليات</option>{operationTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}</select>
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="field max-w-[160px]"><option value="all">كل الحالات</option>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-4">
          <div className="table-wrap">
            <table>
              <thead><tr><th>التاريخ</th><th>الموظف</th><th>الفرع</th><th>نوع العملية</th><th>القناة</th><th>العدد</th><th>المكتملة</th><th>المعلقة</th><th>المرتجعة</th><th>الأخطاء</th><th>الشكاوى</th><th>الحالة</th><th></th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="13">جاري التحميل...</td></tr> : filtered.length ? filtered.map((row) => (
                  <tr key={row.operation_id}>
                    <td>{row.operation_date}</td><td>{row.employee_name}<p className="text-xs text-slate-400">{row.job_name}</p></td><td>{row.branch}</td><td>{row.operation_type}</td><td>{row.service_channel}</td><td>{row.operation_count}</td><td>{row.completed_count}</td><td>{row.pending_count}</td><td>{row.returned_count}</td><td>{row.error_count}</td><td>{row.customer_complaints}</td><td><Status>{row.status}</Status></td>
                    <td><button disabled={!canEdit} onClick={() => setDialog(row)} className="p-2 text-blue-600 disabled:opacity-40"><Pencil size={16} /></button><button disabled={!canApprove} onClick={() => approve(row)} className="p-2 text-green-700 disabled:opacity-40"><BadgeCheck size={16} /></button><button disabled={!canDelete || row.status !== "مسودة"} onClick={() => remove(row)} className="p-2 text-red-600 disabled:opacity-40"><Trash2 size={16} /></button></td>
                  </tr>
                )) : <tr><td colSpan="13" className="py-8 text-center text-slate-400">لا توجد عمليات يومية في الفترة المحددة</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <Chart title="العمليات حسب الفروع" sub="توزيع سجلات العمليات"><ResponsiveContainer width="100%" height={260}><BarChart data={byBranch}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart>
      </div>

      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6">
            <DialogTitle title="عملية يومية" close={() => setDialog(null)} />
            <div className="grid gap-4 md:grid-cols-3">
              <Label t="التاريخ"><input required type="date" value={dialog.operation_date} onChange={(event) => setDialog({ ...dialog, operation_date: event.target.value, month: event.target.value.slice(0, 7) })} className="field mt-2" /></Label>
              <Label t="الموظف"><select required value={dialog.employee_id} onChange={(event) => pickEmployee(event.target.value)} className="field mt-2"><option value="">اختر الموظف</option>{safeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} - {employee.id} - {employee.branch}</option>)}</select></Label>
              <Label t="الوظيفة"><input readOnly value={dialog.job_name} className="field mt-2 bg-slate-50" /></Label>
              <Label t="نوع العملية"><select required value={dialog.operation_type} onChange={(event) => setDialog({ ...dialog, operation_type: event.target.value })} className="field mt-2">{operationTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}</select></Label>
              <Label t="القناة"><select required value={dialog.service_channel} onChange={(event) => setDialog({ ...dialog, service_channel: event.target.value })} className="field mt-2">{serviceChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}</select></Label>
              {numericFields.map(([key, label]) => <Label key={key} t={label}><input required={key === "operation_count"} type="number" min="0" value={dialog[key] ?? 0} onChange={(event) => setDialog({ ...dialog, [key]: event.target.value })} className="field mt-2" /></Label>)}
              <Label t="العملة"><input value={dialog.currency || ""} onChange={(event) => setDialog({ ...dialog, currency: event.target.value })} className="field mt-2" /></Label>
              <Label t="ملاحظات"><textarea value={dialog.notes || ""} onChange={(event) => setDialog({ ...dialog, notes: event.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
            </div>
            <DialogActions close={() => setDialog(null)} />
          </form>
        </div>
      )}

      {importDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel max-h-[90vh] w-full max-w-6xl overflow-y-auto p-6">
            <DialogTitle title="استيراد العمليات اليومية من Excel" close={() => setImportDialog(null)} />
            <div className="grid gap-4 md:grid-cols-3">
              <Label t="اختيار ملف Excel"><input type="file" accept=".xlsx,.xls" onChange={(event) => setImportDialog({ ...importDialog, file: event.target.files?.[0] || null, rows: [], summary: null })} className="field mt-2 py-2" /></Label>
              <Label t="طريقة التعامل مع العمليات المكررة"><select value={importDialog.duplicateMode} onChange={(event) => setImportDialog({ ...importDialog, duplicateMode: event.target.value })} className="field mt-2"><option value="update">تحديث الموجود</option><option value="ignore">تجاهل المكرر</option></select></Label>
              <div className="flex items-end gap-2"><button onClick={readImportFile} disabled={importDialog.loading} className="btn-primary">قراءة الملف</button><button onClick={saveImportRows} disabled={!(importDialog.rows || []).some((row) => row.valid) || importDialog.loading} className="btn-secondary disabled:opacity-50">حفظ العمليات</button></div>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600"><b>الأعمدة المطلوبة:</b> التاريخ، الرقم الوظيفي أو اسم الموظف، نوع العملية، عدد العمليات. يتم استكمال الفرع والوظيفة من سجل الموظف عند تركهما فارغين.</div>
            {importDialog.message && <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">{importDialog.message}</div>}
            {importDialog.summary && <div className="mt-4"><div className="grid gap-3 md:grid-cols-5"><Mini label="إجمالي الصفوف" value={importDialog.summary.total} I={FileSpreadsheet} /><Mini label="تم الاستيراد" value={importDialog.summary.imported} I={BadgeCheck} /><Mini label="تم التحديث" value={importDialog.summary.updated} I={Pencil} /><Mini label="تم التجاهل" value={importDialog.summary.skipped} I={Clock3} /><Mini label="أخطاء الاستيراد" value={importDialog.summary.errors.length} I={AlertTriangle} /></div>{importDialog.summary.errors.length > 0 && <div className="mt-3 max-h-36 overflow-y-auto rounded-xl bg-red-50 p-3 text-sm text-red-700">{importDialog.summary.errors.map((message) => <p key={message}>{message}</p>)}</div>}</div>}
            <div className="mt-4 grid gap-3 md:grid-cols-4"><Mini label="إجمالي الصفوف" value={importDialog.rows?.length || 0} I={FileSpreadsheet} /><Mini label="الصحيحة" value={(importDialog.rows || []).filter((row) => row.valid && !row.warning).length} I={BadgeCheck} /><Mini label="الخاطئة" value={(importDialog.rows || []).filter((row) => !row.valid).length} I={AlertTriangle} /><Mini label="المحذرة" value={(importDialog.rows || []).filter((row) => row.valid && row.warning).length} I={MessageSquareWarning} /></div>
            <div className="table-wrap mt-4"><table><thead><tr><th>رقم الصف</th><th>التاريخ</th><th>اسم الموظف</th><th>الرقم الوظيفي</th><th>الفرع</th><th>الوظيفة</th><th>نوع العملية</th><th>القناة</th><th>عدد العمليات</th><th>المكتملة</th><th>المعلقة</th><th>المرتجعة</th><th>الأخطاء</th><th>الشكاوى</th><th>نتيجة التحقق</th></tr></thead><tbody>{(importDialog.rows || []).map((row) => <tr key={row.rowNumber} className={!row.valid ? "bg-red-50" : row.warning ? "bg-amber-50" : ""}><td>{row.rowNumber}</td><td>{row.operation_date}</td><td>{row.employee_name}</td><td>{row.employee_id}</td><td>{row.branch}</td><td>{row.job_name}</td><td>{row.operation_type}</td><td>{row.service_channel}</td><td>{row.operation_count}</td><td>{row.completed_count}</td><td>{row.pending_count}</td><td>{row.returned_count}</td><td>{row.error_count}</td><td>{row.customer_complaints}</td><td>{row.validationMessage}</td></tr>)}</tbody></table></div>
          </div>
        </div>
      )}
    </div>
  );
}

function DailyOperationsPage({ employees, currentUser, can }) {
  const [rows, setRows] = useState([]), [dialog, setDialog] = useState(null), [filters, setFilters] = useState({ month: "", branch: "all", employee: "", status: "all" }), [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { setRows(await dailyOperationsService.loadDailyOperations({ month: filters.month })); } catch (e) { alert(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); return dailyOperationsService.subscribe(load); }, []);
  const filtered = rows.filter((r) => (!filters.month || r.month === filters.month) && (filters.branch === "all" || r.branch === filters.branch) && (!filters.employee || r.employee_name.includes(filters.employee) || r.employee_id.includes(filters.employee)) && (filters.status === "all" || r.status === filters.status));
  const pickEmployee = (id) => { const emp = employees.find((x) => x.id === id) || {}; setDialog({ ...dialog, employee_id: id, employee_name: emp.name || "", branch: emp.branch || "", job_name: emp.job || "" }); };
  const save = async (e) => { e.preventDefault(); try { const saved = await dailyOperationsService.saveDailyOperation({ ...dialog, entered_by: currentUser?.username || "" }); setRows((list) => list.some((x) => x.operation_id === saved.operation_id) ? list.map((x) => x.operation_id === saved.operation_id ? saved : x) : [saved, ...list]); setDialog(null); } catch (err) { alert(err.message); } };
  const approve = (row) => dailyOperationsService.approveDailyOperation(row, currentUser?.username || "").then(load).catch((e) => alert(e.message));
  const totalOps = filtered.reduce((s, x) => s + Number(x.operation_count || 0), 0), totalErrors = filtered.reduce((s, x) => s + Number(x.error_count || 0), 0);
  const byBranch = Object.entries(groupCount(filtered, "branch")).map(([name, value]) => ({ name, value }));
  return <div className="space-y-5"><PageHead title="العمليات اليومية" desc="تسجيل الإنتاجية اليومية وربطها بالـ KPI والحوافز" action={<button disabled={can?.("daily_operations", "can_create") === false} onClick={() => setDialog({ operation_id: `OP-${Date.now()}`, operation_date: new Date().toISOString().slice(0, 10), month: new Date().toISOString().slice(0, 7), employee_id: "", employee_name: "", branch: "", job_name: "", operation_type: operationTypes[0], service_channel: serviceChannels[0], currency: "SAR", operation_count: 0, completed_count: 0, error_count: 0, returned_count: 0, pending_count: 0, customer_complaints: 0, amount: 0, status: "مسودة", notes: "" })} className="btn-primary"><Plus size={18} /> إضافة عملية</button>} /><div className="grid gap-4 md:grid-cols-4"><Mini label="إجمالي العمليات" value={totalOps} I={Gauge} /><Mini label="الأخطاء" value={totalErrors} I={AlertTriangle} /><Mini label="نسبة الأخطاء" value={`${totalOps ? ((totalErrors / totalOps) * 100).toFixed(1) : 0}%`} I={TrendingUp} /><Mini label="المعتمدة" value={filtered.filter((x) => x.status === "معتمدة").length} I={BadgeCheck} /></div><div className="panel flex flex-wrap gap-3 p-4"><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[180px]" /><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field min-w-[180px]" placeholder="اكتب سبب طلب المراجعة..." /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[160px]"><option value="all">كل الحالات</option>{operationStatuses.map((s) => <option key={s}>{s}</option>)}</select><button onClick={() => exportExcel(filtered, "العمليات اليومية")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="grid gap-5 xl:grid-cols-2"><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>التاريخ</th><th>الموظف</th><th>الفرع</th><th>العملية</th><th>العدد</th><th>الأخطاء</th><th>الحالة</th><th></th></tr></thead><tbody>{loading ? <tr><td colSpan="8">جاري التحميل...</td></tr> : filtered.map((r) => <tr key={r.operation_id}><td>{r.operation_date}</td><td>{r.employee_name}<p className="text-xs text-slate-400">{r.job_name}</p></td><td>{r.branch}</td><td>{r.operation_type}</td><td>{r.operation_count}</td><td>{r.error_count}</td><td><Status>{r.status}</Status></td><td><button onClick={() => setDialog(r)} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => approve(r)} className="p-2 text-green-700"><BadgeCheck size={16} /></button><button disabled={r.status !== "مسودة"} onClick={() => dailyOperationsService.deleteDailyOperation(r.operation_id).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div><Chart title="العمليات حسب الفروع" sub="توزيع سجلات العمليات"><ResponsiveContainer width="100%" height={260}><BarChart data={byBranch}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></Chart></div>{dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="عملية يومية" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="التاريخ"><input type="date" value={dialog.operation_date} onChange={(e) => setDialog({ ...dialog, operation_date: e.target.value, month: e.target.value.slice(0, 7) })} className="field mt-2" /></Label><Label t="الموظف"><select value={dialog.employee_id} onChange={(e) => pickEmployee(e.target.value)} className="field mt-2"><option value="">اختر الموظف</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} - {emp.id} - {emp.branch}</option>)}</select></Label><Label t="الوظيفة"><input readOnly value={dialog.job_name} className="field mt-2 bg-slate-50" /></Label><Label t="نوع العملية"><select value={dialog.operation_type} onChange={(e) => setDialog({ ...dialog, operation_type: e.target.value })} className="field mt-2">{operationTypes.map((t) => <option key={t}>{t}</option>)}</select></Label><Label t="القناة"><select value={dialog.service_channel} onChange={(e) => setDialog({ ...dialog, service_channel: e.target.value })} className="field mt-2">{serviceChannels.map((t) => <option key={t}>{t}</option>)}</select></Label>{["operation_count","completed_count","pending_count","error_count","returned_count","customer_complaints","amount"].map((k) => <Label key={k} t={k}><input type="number" value={dialog[k] || 0} onChange={(e) => setDialog({ ...dialog, [k]: e.target.value })} className="field mt-2" /></Label>)}<Label t="ملاحظات"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}</div>;
}

function PerformanceCriteriaPage({ can }) {
  const [templates, setTemplates] = useState([]), [criteriaRows, setCriteriaRows] = useState([]), [selectedJob, setSelectedJob] = useState(""), [dialog, setDialog] = useState(null);
  const load = async () => { const [t, c] = await Promise.all([performanceCriteriaService.loadJobTemplates(), performanceCriteriaService.loadKpiCriteria()]); setTemplates(t); setCriteriaRows(c); setSelectedJob((j) => j || t[0]?.job_name || Object.keys(defaultJobKpis)[0] || ""); };
  useEffect(() => { load().catch((e) => alert(e.message)); }, []);
  const rows = criteriaRows.filter((r) => r.job_name === selectedJob), totalWeight = performanceCriteriaService.validateCriteriaWeights(rows);
  const saveCriterion = async (e) => { e.preventDefault(); try { await performanceCriteriaService.saveKpiCriterion(dialog); setDialog(null); load(); } catch (err) { alert(err.message); } };
  return <div className="space-y-5"><PageHead title="معايير الأداء" desc="معايير KPI عادلة ومنفصلة حسب الوظيفة" action={<div className="flex gap-2"><button onClick={() => performanceCriteriaService.seedDefaults().then(load).catch((e) => alert(e.message))} className="btn-secondary">توليد المعايير الافتراضية</button><button disabled={can?.("performance_criteria", "can_create") === false} onClick={() => setDialog({ job_name: selectedJob, criterion_name: "", weight: 10, max_score: 100, scoring_type: scoringTypes[0], target_value: 100, excellent_threshold: 100, good_threshold: 80, acceptable_threshold: 60, affects_incentive: true, is_active: true })} className="btn-primary"><Plus size={18} /> إضافة معيار</button></div>} /><div className="panel flex flex-wrap gap-3 p-4"><select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="field max-w-md">{[...new Set([...templates.map((t) => t.job_name), ...Object.keys(defaultJobKpis)])].map((j) => <option key={j}>{j}</option>)}</select><span className={`rounded-xl px-4 py-2 text-sm font-bold ${totalWeight === 100 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>إجمالي الأوزان: {totalWeight}%</span></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>المعيار</th><th>الوزن</th><th>طريقة الاحتساب</th><th>المستهدف</th><th>الحافز</th><th>الحالة</th><th></th></tr></thead><tbody>{rows.map((r) => <tr key={r.criterion_id}><td>{r.criterion_name}</td><td>{r.weight}%</td><td>{r.scoring_type}</td><td>{r.target_value}</td><td>{r.affects_incentive ? "نعم" : "لا"}</td><td><Status>{r.is_active ? "نشط" : "معطل"}</Status></td><td><button onClick={() => setDialog(r)} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => performanceCriteriaService.deleteKpiCriterion(r.criterion_id).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div>{dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={saveCriterion} className="panel w-full max-w-4xl p-6"><DialogTitle title="معيار أداء" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="الوظيفة"><input value={dialog.job_name} onChange={(e) => setDialog({ ...dialog, job_name: e.target.value })} className="field mt-2" /></Label><Label t="اسم المعيار"><input required value={dialog.criterion_name} onChange={(e) => setDialog({ ...dialog, criterion_name: e.target.value })} className="field mt-2" /></Label><Label t="الوزن"><input type="number" value={dialog.weight} onChange={(e) => setDialog({ ...dialog, weight: e.target.value })} className="field mt-2" /></Label><Label t="طريقة الاحتساب"><select value={dialog.scoring_type} onChange={(e) => setDialog({ ...dialog, scoring_type: e.target.value })} className="field mt-2">{scoringTypes.map((s) => <option key={s}>{s}</option>)}</select></Label><Label t="المستهدف"><input type="number" value={dialog.target_value} onChange={(e) => setDialog({ ...dialog, target_value: e.target.value })} className="field mt-2" /></Label><Label t="حد ممتاز"><input type="number" value={dialog.excellent_threshold} onChange={(e) => setDialog({ ...dialog, excellent_threshold: e.target.value })} className="field mt-2" /></Label><Label t="حد جيد"><input type="number" value={dialog.good_threshold} onChange={(e) => setDialog({ ...dialog, good_threshold: e.target.value })} className="field mt-2" /></Label><Label t="حد مقبول"><input type="number" value={dialog.acceptable_threshold} onChange={(e) => setDialog({ ...dialog, acceptable_threshold: e.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}</div>;
}

function KpiScoresPage({ employees }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)), [scores, setScores] = useState([]);
  const load = () => kpiCalculationService.loadKpiScores(month).then(setScores).catch((e) => alert(e.message));
  useEffect(() => { load(); }, [month]);
  const grouped = Object.entries(scores.reduce((acc, row) => { const key = row.employee_name || row.employee_id; acc[key] = (acc[key] || 0) + row.weighted_score; return acc; }, {})).map(([name, total]) => ({ name, total: Number(total.toFixed(2)) })).sort((a, b) => b.total - a.total);
  return <div className="space-y-5"><PageHead title="درجات KPI" desc="احتساب تلقائي من العمليات اليومية حسب وظيفة الموظف" action={<button onClick={() => kpiCalculationService.recalculateMonthKpis(employees, month).then(setScores).catch((e) => alert(e.message))} className="btn-primary"><Gauge size={18} /> إعادة حساب الشهر</button>} /><div className="panel flex gap-3 p-4"><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="field max-w-[180px]" /><button onClick={() => exportExcel(scores, "درجات KPI")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="grid gap-5 xl:grid-cols-2"><Chart title="أفضل الموظفين حسب KPI" sub="المقارنة داخل معايير كل وظيفة"><ResponsiveContainer width="100%" height={280}><BarChart data={grouped.slice(0, 10)}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#7f1d1d" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></Chart><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>الموظف</th><th>الوظيفة</th><th>المعيار</th><th>القيمة</th><th>الدرجة</th><th>الموزونة</th></tr></thead><tbody>{scores.map((r) => <tr key={r.score_id}><td>{r.employee_name}</td><td>{r.job_name}</td><td>{r.criterion_name}</td><td>{r.actual_value}</td><td>{r.score}</td><td>{r.weighted_score.toFixed(2)}</td></tr>)}</tbody></table></div></div></div></div>;
}

function AIAssistantWidget({ currentUser, currentCompany, page, setPage, can, employees = [], evaluations = [], settings = {} }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(assistantModes[0]?.id || "navigation");
  const [filters, setFilters] = useState({ branch: "all", month: "", employee: "", department: "", reportType: "" });
  const [loading, setLoading] = useState(false);
  const role = currentUser?.role || "";
  const canView = isAdminLikeRole(role) || can?.("ai_assistant", "can_view") !== false;
  const selectedMode = assistantModes.find((item) => item.id === mode) || assistantModes[0];
  const lastAssistantMessage = [...messages].reverse().find((item) => item.role === "assistant")?.message || "";
  const branchOptions = [...new Set([...(settings.branches || []), ...employees.map((employee) => employee.branch)].filter(Boolean))];

  if (!canView) return null;

  const send = async (text = input) => {
    const question = String(text || "").trim();
    if (!question) {
      setMessages((list) => [...list, { role: "assistant", message: "اكتب طلبك أولًا" }]);
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      let current = session;
      if (!current) {
        current = await aiAssistantService.createChatSession(currentUser?.user_id || currentUser?.username || "", "محادثة المساعد");
        setSession(current);
      }
      const contextInput = { employees, evaluations, settings, filters, currentUser, currentCompany };
      const userMsg = { session_id: current.session_id, user_id: currentUser?.user_id || "", role: "user", message: question, context: { page, mode, filters } };
      setMessages((list) => [...list, userMsg]);
      setInput("");
      await aiAssistantService.saveChatMessage(userMsg);
      const reply = await aiAssistantService.generateAssistantReply(question, contextInput, {
        canOpenPage: (pageKey) => can?.(pageKey, "can_view") !== false,
        navigateToPage: (pageKey) => setPage(pageKey),
      });
      const assistantMsg = { session_id: current.session_id, user_id: currentUser?.user_id || "", role: "assistant", message: reply, context: { page, mode, filters } };
      await aiAssistantService.saveChatMessage(assistantMsg);
      setMessages((list) => [...list, assistantMsg]);
    } catch (error) {
      console.error("AI assistant UI error:", error);
      setMessages((list) => [...list, { role: "assistant", message: error.message || "تعذر تنفيذ طلب المساعد حالياً." }]);
    } finally {
      setLoading(false);
    }
  };

  const copyLast = () => {
    if (!lastAssistantMessage) return;
    navigator.clipboard?.writeText(lastAssistantMessage);
  };
  const exportLast = () => {
    if (!lastAssistantMessage) return;
    const blob = new Blob([lastAssistantMessage], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assistant-answer.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-5 left-5 z-40 no-print">
      <button onClick={() => setOpen(!open)} className="grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-white shadow-xl">
        <MessageSquareWarning />
      </button>
      {open && (
        <div className="absolute bottom-16 left-0 flex max-h-[82vh] w-[min(920px,calc(100vw-2rem))] overflow-hidden rounded-3xl border bg-white shadow-2xl">
          <aside className="hidden w-64 shrink-0 border-l bg-slate-50 p-3 md:block">
            <b className="mb-3 block text-sm">أوضاع المساعد</b>
            <div className="space-y-2">
              {assistantModes.map((item) => (
                <button key={item.id} onClick={() => setMode(item.id)} className={`w-full rounded-xl px-3 py-2 text-right text-xs font-bold ${mode === item.id ? "bg-brand-700 text-white" : "bg-white text-slate-600"}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </aside>
          <section className="flex min-h-[560px] flex-1 flex-col">
            <div className="bg-brand-700 p-4 text-white">
              <div className="flex items-center gap-3">
                <b>المساعد الذكي التشغيلي</b>
                <button onClick={() => setMessages([])} className="mr-auto rounded-lg bg-white/10 px-3 py-1 text-xs">مسح</button>
                <button onClick={() => setOpen(false)} className="rounded-lg bg-white/10 px-3 py-1 text-xs">إغلاق</button>
              </div>
              <p className="mt-1 text-xs opacity-80">يعمل حالياً بوضع التحليل الداخلي. يمكن ربطه بخدمة ذكاء اصطناعي من الخادم عبر VITE_AI_ASSISTANT_ENDPOINT.</p>
            </div>
            <div className="grid gap-2 border-b p-3 md:grid-cols-5">
              <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field">
                <option value="all">كل الفروع</option>
                {branchOptions.map((branch) => <option key={branch}>{branch}</option>)}
              </select>
              <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field" />
              <select value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field">
                <option value="">كل الموظفين</option>
                {employees.slice(0, 200).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </select>
              <input value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="field" placeholder="القسم" />
              <input value={filters.reportType} onChange={(e) => setFilters({ ...filters, reportType: e.target.value })} className="field" placeholder="نوع التقرير" />
            </div>
            <div className="border-b p-3">
              <p className="mb-2 text-xs font-bold text-slate-500">{selectedMode?.label}</p>
              <div className="flex flex-wrap gap-2">
                {(selectedMode?.prompts || []).map((prompt) => (
                  <button key={prompt} onClick={() => send(prompt)} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-brand-50">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {!messages.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-500">اكتب طلبك مثل: افتح صفحة الضمانات، أنشئ تقرير أداء شهري، ابني خطة تدريب، أو صغ تعميم إداري.</p>}
              {messages.map((message, index) => (
                <div key={index} className={`whitespace-pre-wrap rounded-2xl p-4 text-sm leading-7 ${message.role === "user" ? "mr-auto max-w-[80%] bg-brand-50 text-brand-900" : "ml-auto max-w-[92%] bg-slate-50 text-slate-700"}`}>
                  {message.message}
                </div>
              ))}
              {loading && <p className="text-xs text-slate-400">المساعد يكتب...</p>}
            </div>
            <div className="flex flex-wrap gap-2 border-t p-3">
              <button onClick={() => send("افتح صفحة الموظفين")} className="btn-secondary !h-10">افتح الصفحة</button>
              <button onClick={() => send("أنشئ تقرير " + (filters.reportType || "إداري"))} className="btn-secondary !h-10">أنشئ تقرير</button>
              <button onClick={() => send("حوّل الإجابة إلى خطة")} className="btn-secondary !h-10">حوّل إلى خطة</button>
              <button onClick={() => send("حوّل الإجابة إلى خطاب")} className="btn-secondary !h-10">حوّل إلى خطاب</button>
              <button onClick={copyLast} className="btn-secondary !h-10">نسخ</button>
              <button onClick={exportLast} className="btn-secondary !h-10">تصدير</button>
              <div className="flex min-w-[260px] flex-1 gap-2">
                <input
                  value={input}
                  disabled={loading}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  className="field pointer-events-auto"
                  placeholder="اكتب طلبك للمساعد..."
                />
                <button disabled={loading} onClick={() => send()} className="btn-primary">إرسال</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const recruitmentFieldSets = {
  job_postings: ["job_title", "department", "branch", "job_type", "vacancies_count", "salary_range_from", "salary_range_to", "requirements", "responsibilities", "status", "opened_at", "closed_at", "notes"],
  applications: ["application_number", "job_posting_id", "job_title", "applicant_name", "phone", "email", "address", "qualification", "specialization", "experience_years", "previous_employer", "expected_salary", "application_source", "cv_url", "status", "notes"],
  candidate_evaluations: ["application_id", "applicant_name", "job_title", "evaluator_name", "evaluation_date", "appearance_score", "communication_score", "technical_score", "experience_score", "culture_fit_score", "honesty_score", "pressure_handling_score", "computer_skills_score", "customer_service_score", "recommendation", "strengths", "weaknesses", "notes"],
  offer_templates: ["template_name", "job_title", "branch", "salary", "allowances", "probation_period", "working_hours", "start_date", "offer_valid_until", "terms", "template_body", "is_active"],
  job_offers: ["offer_number", "application_id", "applicant_name", "job_title", "branch", "salary", "allowances", "start_date", "probation_period", "status", "sent_at", "accepted_at", "rejected_at", "notes"],
  contracts: ["contract_number", "offer_id", "application_id", "applicant_name", "employee_name", "job_title", "branch", "salary", "contract_start_date", "contract_end_date", "probation_period", "status", "contract_body"],
  manpower_plans: ["year", "month", "branch", "department", "job_title", "required_count", "current_count", "priority", "reason", "status", "approved_by", "notes"],
  tests: ["test_name", "job_title", "test_type", "max_score", "pass_score", "instructions", "is_active"],
  welcome_messages: ["employee_id", "employee_name", "job", "branch", "start_date", "message_template", "whatsapp_message", "status"],
};
const recruitmentLabels = { job_title: "الوظيفة", department: "القسم", branch: "الفرع", job_type: "نوع الوظيفة", vacancies_count: "عدد الشواغر", salary_range_from: "الراتب من", salary_range_to: "الراتب إلى", requirements: "المتطلبات", responsibilities: "المسؤوليات", status: "الحالة", opened_at: "تاريخ الفتح", closed_at: "تاريخ الإغلاق", notes: "ملاحظات", application_number: "رقم الطلب", job_posting_id: "الوظيفة", applicant_name: "اسم المرشح", phone: "الهاتف", email: "البريد", address: "العنوان", qualification: "المؤهل", specialization: "التخصص", experience_years: "سنوات الخبرة", previous_employer: "جهة العمل السابقة", expected_salary: "الراتب المتوقع", application_source: "مصدر الطلب", cv_url: "رابط CV", evaluator_name: "المقيّم", evaluation_date: "تاريخ التقييم", appearance_score: "المظهر", communication_score: "التواصل", technical_score: "الفني", experience_score: "الخبرة", culture_fit_score: "ملاءمة الثقافة", honesty_score: "الأمانة", pressure_handling_score: "تحمل الضغط", computer_skills_score: "الحاسب", customer_service_score: "خدمة العملاء", recommendation: "التوصية", strengths: "نقاط القوة", weaknesses: "نقاط الضعف", template_name: "اسم القالب", salary: "الراتب", allowances: "البدلات", probation_period: "فترة التجربة", working_hours: "ساعات العمل", start_date: "تاريخ المباشرة", offer_valid_until: "صلاحية العرض", terms: "الشروط", template_body: "نص الخطاب", is_active: "نشط", offer_number: "رقم العرض", sent_at: "تاريخ الإرسال", accepted_at: "تاريخ القبول", rejected_at: "تاريخ الرفض", contract_number: "رقم العقد", offer_id: "العرض", employee_name: "اسم الموظف", contract_start_date: "بداية العقد", contract_end_date: "نهاية العقد", contract_body: "نص العقد", year: "السنة", month: "الشهر", required_count: "العدد المطلوب", current_count: "العدد الحالي", priority: "الأولوية", reason: "السبب", approved_by: "اعتمد بواسطة", test_name: "اسم الاختبار", test_type: "نوع الاختبار", max_score: "الدرجة القصوى", pass_score: "درجة النجاح", instructions: "التعليمات", employee_id: "رقم الموظف", job: "الوظيفة", message_template: "قالب الرسالة", whatsapp_message: "رسالة واتساب" };
const recruitmentPrimary = { job_postings: "job_posting_id", applications: "application_id", candidate_evaluations: "evaluation_id", offer_templates: "template_id", job_offers: "offer_id", contracts: "contract_id", manpower_plans: "manpower_plan_id", tests: "test_id", welcome_messages: "welcome_message_id" };

function RecruitmentPage({ employees, currentUser, canNode }) {
  const visibleTabs = recruitmentTabs.filter(([, , nodeKey]) => canNode?.(nodeKey, "can_view") !== false);
  const [tab, setTab] = useState(visibleTabs[0]?.[0] || "job_postings");
  const [rows, setRows] = useState({});
  const [probation, setProbation] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState({ q: "", status: "all", branch: "all" });
  const load = async () => {
    const entries = await Promise.all(["job_postings", "applications", "candidate_evaluations", "offer_templates", "job_offers", "contracts", "manpower_plans", "tests", "welcome_messages"].map((type) => recruitmentService.list(type).then((data) => [type, data]).catch(() => [type, []])));
    setRows(Object.fromEntries(entries));
    setProbation(await recruitmentService.loadProbationEmployees().catch(() => employees.filter((e) => e.status === "تحت التجربة")));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (visibleTabs.length && !visibleTabs.some(([id]) => id === tab)) setTab(visibleTabs[0][0]); }, [visibleTabs.map((x) => x[0]).join(","), tab]);
  if (!visibleTabs.length) return <div className="panel p-6 text-center font-bold text-slate-500">لا توجد صلاحيات مفعلة لوحدة التوظيف.</div>;
  const nodeKey = visibleTabs.find(([id]) => id === tab)?.[2] || "";
  const canCreate = canNode?.(nodeKey, "can_create") !== false;
  const canEdit = canNode?.(nodeKey, "can_edit") !== false;
  const canDelete = canNode?.(nodeKey, "can_delete") !== false;
  const tableRows = tab === "probation_employees" ? probation : rows[tab] || [];
  const filtered = tableRows.filter((row) => (!filters.q || JSON.stringify(row).includes(filters.q)) && (filters.status === "all" || row.status === filters.status) && (filters.branch === "all" || row.branch === filters.branch));
  const openAdd = () => {
    if (tab === "reports" || tab === "settings" || tab === "probation_employees") return;
    const fields = recruitmentFieldSets[tab] || [];
    setDialog({ type: tab, created_by: currentUser?.username || "", ...Object.fromEntries(fields.map((key) => [key, ""])) });
  };
  const save = async (e) => {
    e.preventDefault();
    try {
      const saved = await recruitmentService.save(dialog.type, dialog);
      setRows((all) => ({ ...all, [dialog.type]: (all[dialog.type] || []).some((r) => r[recruitmentPrimary[dialog.type]] === saved[recruitmentPrimary[dialog.type]]) ? all[dialog.type].map((r) => r[recruitmentPrimary[dialog.type]] === saved[recruitmentPrimary[dialog.type]] ? saved : r) : [saved, ...(all[dialog.type] || [])] }));
      setDialog(null);
    } catch (error) { alert(error.message); }
  };
  const remove = async (row) => {
    if (!confirm("هل تريد حذف السجل؟")) return;
    try {
      await recruitmentService.remove(tab, row[recruitmentPrimary[tab]]);
      setRows((all) => ({ ...all, [tab]: (all[tab] || []).filter((r) => r[recruitmentPrimary[tab]] !== row[recruitmentPrimary[tab]]) }));
    } catch (error) { alert(error.message); }
  };
  const reports = generateRecruitmentReports({ jobPostings: rows.job_postings || [], applications: rows.applications || [], evaluations: rows.candidate_evaluations || [], offers: rows.job_offers || [], contracts: rows.contracts || [], plans: rows.manpower_plans || [], probationEmployees: probation });
  const cols = tab === "probation_employees" ? ["id", "name", "job", "branch", "hireDate", "manager"] : (recruitmentFieldSets[tab] || ["job_title", "applicant_name", "branch", "status"]).slice(0, 7);
  return <div className="space-y-5"><PageHead title="طلبات التوظيف" desc="إدارة دورة التوظيف من الاحتياج حتى التعيين ورسائل الترحيب" action={<button disabled={!canCreate} onClick={openAdd} className="btn-primary"><Plus size={18} /> إضافة</button>} /><div className="panel flex flex-wrap gap-2 p-3">{visibleTabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? "bg-brand-700 text-white" : "bg-slate-50 text-slate-600"}`}>{label}</button>)}</div>{tab === "reports" ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Object.entries(reports).map(([key, report]) => <div key={key} className="panel p-4"><h3 className="font-extrabold">{report.title}</h3><p className="mt-2 text-sm text-slate-500">عدد السجلات: {report.rows.length}</p><div className="mt-4 flex gap-2"><button onClick={() => exportExcel(report.rows, report.title)} className="btn-secondary">Excel</button><button onClick={() => printDocument(report.title, rowsToReportHtml(report.title, report.rows, []))} className="btn-primary">طباعة</button></div></div>)}</div> : <><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="بحط«..." /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[180px]"><option value="all">كل الحالات</option>{[...new Set(tableRows.map((r) => r.status).filter(Boolean))].map((s) => <option key={s}>{s}</option>)}</select><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[180px]"><option value="all">كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><button onClick={() => exportExcel(filtered, "طلبات التوظيف")} className="btn-secondary">Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr>{cols.map((c) => <th key={c}>{recruitmentLabels[c] || c}</th>)}<th>الحالة</th><th></th></tr></thead><tbody>{filtered.map((row, i) => <tr key={row[recruitmentPrimary[tab]] || row.id || i}>{cols.map((c) => <td key={c}>{String(row[c] ?? "")}</td>)}<td><Status>{row.status || row.evaluation_status || row.recommendation || "—"}</Status></td><td><button disabled={!canEdit || tab === "probation_employees"} onClick={() => setDialog({ type: tab, ...row })} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canDelete || tab === "probation_employees"} onClick={() => remove(row)} className="p-2 text-red-600"><Trash2 size={16} /></button>{tab === "contracts" && <button onClick={() => recruitmentService.convertContractToEmployee(row).then(() => alert("تم تحويل المرشح إلى موظف")).catch((e) => alert(e.message))} className="p-2 text-green-700">تعيين</button>}{tab === "welcome_messages" && <button onClick={() => navigator.clipboard?.writeText(row.whatsapp_message || row.message_template || "")} className="p-2 text-slate-600">نسخ</button>}</td></tr>)}</tbody></table></div></div></>}{dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="بيانات التوظيف" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3">{(recruitmentFieldSets[dialog.type] || []).map((key) => <Label key={key} t={recruitmentLabels[key] || key}>{key.includes("body") || key.includes("notes") || key.includes("requirements") || key.includes("responsibilities") || key.includes("message") || key.includes("terms") || key.includes("instructions") ? <textarea value={dialog[key] || ""} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} className="field mt-2 !h-auto py-3" /> : key === "is_active" ? <select value={String(dialog[key] !== false)} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value === "true" })} className="field mt-2"><option value="true">نعم</option><option value="false">لا</option></select> : <input type={key.includes("date") || key.endsWith("_at") ? "date" : key.includes("score") || key.includes("salary") || key.includes("count") || key.includes("year") || key.includes("month") ? "number" : "text"} value={dialog[key] || ""} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} onBlur={() => dialog.type === "welcome_messages" && setDialog((d) => ({ ...d, whatsapp_message: d.whatsapp_message || generateWelcomeMessage(d) }))} className="field mt-2" />}</Label>)}</div><DialogActions close={() => setDialog(null)} /></form></div>}</div>;
}

function UserEditorModal({ dialog, setDialog, saveUser, employeeOptions, selectEmployee, roles = systemRoles }) {
  const isAdmin = String(dialog.role || "").includes("مدير النظام") || String(dialog.role || "").includes("مدير النظام");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <form onSubmit={saveUser} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6">
        <DialogTitle title="بيانات المستخدم" close={() => setDialog(null)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Label t="اسم الموظف">
            <select value={dialog.employee_id || ""} onChange={(e) => selectEmployee(e.target.value)} className="field mt-2">
              <option value="">اختر الموظف</option>
              {employeeOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.id} - {emp.branch || "بدون فرع"} - {emp.job || "بدون وظيفة"}
                </option>
              ))}
            </select>
            {!employeeOptions.length && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-700">لا توجد بيانات موظفين، يرجى إضافة موظفين أولًا</p>}
          </Label>
          <Label t="اسم الموظف المحدد">
            <input readOnly={!isAdmin} value={dialog.employee_name || dialog.name || ""} onChange={(e) => setDialog({ ...dialog, employee_name: e.target.value, name: e.target.value })} className={`field mt-2 ${isAdmin ? "" : "bg-slate-50"}`} />
          </Label>
          <Label t="الرقم الوظيفي"><input readOnly value={dialog.employee_id || ""} className="field mt-2 bg-slate-50" /></Label>
          <Label t="اسم المستخدم"><input required value={dialog.username || ""} onChange={(e) => setDialog({ ...dialog, username: e.target.value })} className="field mt-2" /></Label>
          <Label t="كلمة المرور"><input required type="password" value={dialog.password || ""} onChange={(e) => setDialog({ ...dialog, password: e.target.value })} className="field mt-2" /></Label>
          <Label t="الدور"><select value={dialog.role || "الموظف"} onChange={(e) => setDialog({ ...dialog, role: e.target.value })} className="field mt-2">{roles.map((role) => <option key={role}>{role}</option>)}</select></Label>
          <Label t="الفرع"><input readOnly={!isAdmin} value={dialog.branch || ""} onChange={(e) => setDialog({ ...dialog, branch: e.target.value })} className={`field mt-2 ${isAdmin ? "" : "bg-slate-50"}`} /></Label>
          <Label t="الوظيفة"><input readOnly={!isAdmin} value={dialog.job || ""} onChange={(e) => setDialog({ ...dialog, job: e.target.value })} className={`field mt-2 ${isAdmin ? "" : "bg-slate-50"}`} /></Label>
          <Label t="البريد الإلكتروني"><input value={dialog.email || ""} onChange={(e) => setDialog({ ...dialog, email: e.target.value })} className="field mt-2" /></Label>
          <Label t="الهاتف"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label>
          <Label t="الحالة"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Label>
        </div>
        <DialogActions close={() => setDialog(null)} />
      </form>
    </div>
  );
}

function TreePermissionsPanel({ selectedRole, setSelectedRole, treeNodes, treePermissions, setTreePermissions, roles, users, branchOptions, canEdit, loading, onSave, onReset, onCopy }) {
  const [search, setSearch] = useState("");
  const [selectedNodeKey, setSelectedNodeKey] = useState("");
  const [expanded, setExpanded] = useState([]);
  const [copyFromRole, setCopyFromRole] = useState("");
  const flatNodes = useMemo(() => flattenPermissionTree(treeNodes || []), [treeNodes]);
  useEffect(() => {
    if (!selectedNodeKey && flatNodes[0]?.node_key) setSelectedNodeKey(flatNodes[0].node_key);
    if (!expanded.length && flatNodes.length) setExpanded(flatNodes.filter((n) => !n.parent_id).map((n) => n.node_key));
  }, [flatNodes, selectedNodeKey, expanded.length]);
  const selectedNode = flatNodes.find((n) => n.node_key === selectedNodeKey) || flatNodes[0];
  const getPerm = (nodeKey) => treePermissionsService.getNodePermission(treePermissions, selectedRole, nodeKey);
  const selectedPerm = selectedNode ? getPerm(selectedNode.node_key) : null;
  const childrenOf = (node) => flattenPermissionTree(node?.children || []);
  const updatePermission = (nodeKey, patch) => {
    setTreePermissions((list) => {
      const base = getPerm(nodeKey);
      const next = normalizeTreePermission({ ...base, ...patch, role_name: selectedRole, node_key: nodeKey, permission_id: `${selectedRole}-${nodeKey}` });
      const exists = list.some((p) => p.role_name === selectedRole && p.node_key === nodeKey);
      return exists ? list.map((p) => (p.role_name === selectedRole && p.node_key === nodeKey ? next : p)) : [...list, next];
    });
  };
  const setNodeViewRecursive = (node, value) => {
    const keys = [node.node_key, ...childrenOf(node).map((n) => n.node_key)];
    setTreePermissions((list) => {
      const without = list.filter((p) => !(p.role_name === selectedRole && keys.includes(p.node_key)));
      const rows = keys.map((key) => normalizeTreePermission({ ...treePermissionsService.getNodePermission(list, selectedRole, key), role_name: selectedRole, node_key: key, permission_id: `${selectedRole}-${key}`, can_view: value }));
      return [...without, ...rows];
    });
  };
  const applySelectedToChildren = () => {
    if (!selectedNode || !selectedPerm) return;
    const childKeys = childrenOf(selectedNode).map((n) => n.node_key);
    setTreePermissions((list) => {
      const without = list.filter((p) => !(p.role_name === selectedRole && childKeys.includes(p.node_key)));
      return [
        ...without,
        ...childKeys.map((key) => normalizeTreePermission({ ...selectedPerm, role_name: selectedRole, node_key: key, permission_id: `${selectedRole}-${key}` })),
      ];
    });
  };
  const setAll = (value) => {
    setTreePermissions((list) => {
      const others = list.filter((p) => p.role_name !== selectedRole);
      const rows = flatNodes.map((n) => {
        const row = permissionActions.reduce((acc, [key]) => ({ ...acc, [key]: value }), {});
        return normalizeTreePermission({ ...row, role_name: selectedRole, node_key: n.node_key, permission_id: `${selectedRole}-${n.node_key}`, data_scope: value ? "all" : "own" });
      });
      return [...others, ...rows];
    });
  };
  const clearNode = () => selectedNode && updatePermission(selectedNode.node_key, permissionActions.reduce((acc, [key]) => ({ ...acc, [key]: false }), {}));
  const toggleExpand = (nodeKey) => setExpanded((list) => list.includes(nodeKey) ? list.filter((x) => x !== nodeKey) : [...list, nodeKey]);
  const filterTree = (nodes) => nodes.map((n) => ({ ...n, children: filterTree(n.children || []) })).filter((n) => !search || `${n.node_name} ${n.node_key} ${n.page_key || ""}`.toLowerCase().includes(search.toLowerCase()) || n.children.length);
  const visibleTree = filterTree(treeNodes || []);
  const nodeState = (node) => {
    const keys = [node.node_key, ...childrenOf(node).map((n) => n.node_key)];
    const count = keys.filter((key) => getPerm(key).can_view).length;
    return count === 0 ? "none" : count === keys.length ? "checked" : "partial";
  };
  const renderNode = (node, level = 0) => {
    const hasChildren = (node.children || []).length > 0;
    const isOpen = expanded.includes(node.node_key);
    const state = nodeState(node);
    return (
      <div key={node.node_key}>
        <div className={`flex items-center gap-2 rounded-xl px-2 py-2 text-sm ${selectedNode?.node_key === node.node_key ? "bg-brand-50 text-brand-800" : "hover:bg-slate-50"}`} style={{ paddingRight: 8 + level * 18 }}>
          <button type="button" onClick={() => hasChildren && toggleExpand(node.node_key)} className="grid h-6 w-6 place-items-center rounded-lg bg-slate-100 text-slate-600">{hasChildren ? (isOpen ? "−" : "+") : "•"}</button>
          <input type="checkbox" disabled={!canEdit} checked={state === "checked"} ref={(el) => { if (el) el.indeterminate = state === "partial"; }} onChange={(e) => setNodeViewRecursive(node, e.target.checked)} />
          <button type="button" onClick={() => setSelectedNodeKey(node.node_key)} className="flex-1 text-right">
            <b>{node.node_name}</b>
            <p className="text-[11px] text-slate-400">{node.node_type} آ· {node.node_key}</p>
          </button>
        </div>
        {hasChildren && isOpen && <div>{node.children.map((child) => renderNode(child, level + 1))}</div>}
      </div>
    );
  };
  const selectedUserOptions = users.filter((u) => !selectedRole || u.role === selectedRole);
  return (
    <div className="panel p-4 xl:col-span-2">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-extrabold">شجرة الصلاحيات التفصيلية</h3>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="field mr-auto max-w-[220px]">{roles.map((r) => <option key={r}>{r}</option>)}</select>
        <select className="field max-w-[220px]"><option>كل مستخدمي الدور</option>{selectedUserOptions.map((u) => <option key={u.user_id}>{u.employee_name || u.username}</option>)}</select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="field max-w-[240px]" placeholder="اكتب سبب طلب المراجعة..." />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button disabled={!canEdit} onClick={() => setAll(true)} className="btn-secondary">تحديد الكل</button>
        <button disabled={!canEdit} onClick={() => setAll(false)} className="btn-secondary">مسح الكل</button>
        <button onClick={() => setExpanded(flatNodes.map((n) => n.node_key))} className="btn-secondary">توسيع الكل</button>
        <button onClick={() => setExpanded([])} className="btn-secondary">طي الكل</button>
        <select value={copyFromRole} onChange={(e) => setCopyFromRole(e.target.value)} className="field max-w-[200px]"><option value="">نسخ من دور...</option>{roles.filter((r) => r !== selectedRole).map((r) => <option key={r}>{r}</option>)}</select>
        <button disabled={!canEdit || !copyFromRole} onClick={() => onCopy(copyFromRole)} className="btn-secondary">نسخ الصلاحيات</button>
        <button disabled={!canEdit} onClick={onReset} className="btn-secondary">إعادة ضبط الدور</button>
        <button disabled={!canEdit || loading} onClick={onSave} className="btn-primary"><Save size={17} /> حفظ الصلاحيات</button>
      </div>
      {loading ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">جاري تحميل شجرة الصلاحيات...</p> : (
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <div className="max-h-[620px] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-3">{visibleTree.map((node) => renderNode(node))}</div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            {!selectedNode || !selectedPerm ? <p className="text-sm text-slate-500">اختر بندًا من الشجرة لتعديل صلاحياته.</p> : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs text-slate-400">البند المحدد</p>
                  <h4 className="text-xl font-extrabold text-brand-800">{selectedNode.node_name}</h4>
                  <p className="mt-1 text-xs text-slate-500">المفتاح: {selectedNode.node_key} · النوع: {selectedNode.node_type} · الصفحة: {selectedNode.page_key || "—"}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {permissionActions.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm font-bold">
                      <input disabled={!canEdit} type="checkbox" checked={!!selectedPerm[key]} onChange={(e) => updatePermission(selectedNode.node_key, { [key]: e.target.checked })} />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Label t="نطاق البيانات">
                    <select disabled={!canEdit} value={selectedPerm.data_scope || "own"} onChange={(e) => updatePermission(selectedNode.node_key, { data_scope: e.target.value })} className="field mt-2">{dataScopes.map(([k, label]) => <option key={k} value={k}>{label}</option>)}</select>
                  </Label>
                  <Label t="الفروع المسموحة">
                    <select multiple disabled={!canEdit} value={selectedPerm.allowed_branches || []} onChange={(e) => updatePermission(selectedNode.node_key, { allowed_branches: Array.from(e.target.selectedOptions).map((o) => o.value) })} className="field mt-2 !h-32">{branchOptions.map((b) => <option key={b}>{b}</option>)}</select>
                  </Label>
                  <Label t="الأقسام المسموحة">
                    <select multiple disabled={!canEdit} value={selectedPerm.allowed_departments || []} onChange={(e) => updatePermission(selectedNode.node_key, { allowed_departments: Array.from(e.target.selectedOptions).map((o) => o.value) })} className="field mt-2 !h-32">{departmentOptions.map((d) => <option key={d}>{d}</option>)}</select>
                  </Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={!canEdit} onClick={onSave} className="btn-primary"><Save size={17} /> حفظ المحدد</button>
                  <button disabled={!canEdit} onClick={applySelectedToChildren} className="btn-secondary">تطبيق على الفروع التابعة</button>
                  <button disabled={!canEdit} onClick={clearNode} className="btn-secondary">مسح صلاحيات البند</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleManagementPanel({ roles, users, canEdit, onSaveRole, onDeleteRole, onCopyPermissions }) {
  const [q, setQ] = useState("");
  const [dialog, setDialog] = useState(null);
  const [copySource, setCopySource] = useState("");
  const filtered = roles.filter((role) => !q || role.role_name.includes(q) || role.role_description.includes(q));
  return (
    <div className="panel p-4 xl:col-span-2">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-extrabold">إدارة الأدوار</h3>
        <input value={q} onChange={(e) => setQ(e.target.value)} className="field mr-auto max-w-[260px]" placeholder="اكتب سبب طلب المراجعة..." />
        <button disabled={!canEdit} onClick={() => setDialog({ role_id: `ROLE-${Date.now()}`, role_name: "", role_description: "", is_system_role: false, is_active: true })} className="btn-primary"><Plus size={17} /> إضافة دور</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>الدور</th><th>الوصف</th><th>عدد المستخدمين</th><th>الحالة</th><th>نوع الدور</th><th></th></tr></thead>
          <tbody>{filtered.map((role) => {
            const count = users.filter((u) => u.role === role.role_name).length;
            return <tr key={role.role_id}><td>{role.role_name}</td><td>{role.role_description}</td><td>{count}</td><td><Status>{role.is_active ? "نشط" : "معطل"}</Status></td><td>{role.is_system_role ? "نظامي" : "مخصص"}</td><td><button disabled={!canEdit} onClick={() => setDialog(role)} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canEdit} onClick={() => onDeleteRole(role)} className="p-2 text-red-600">{count ? "تعطيل" : "حذف"}</button><select value={copySource} onChange={(e) => setCopySource(e.target.value)} className="field mx-1 max-w-[160px]"><option value="">نسخ من...</option>{roles.filter((r) => r.role_name !== role.role_name).map((r) => <option key={r.role_id}>{r.role_name}</option>)}</select><button disabled={!copySource} onClick={() => onCopyPermissions(copySource, role.role_name)} className="btn-secondary">نسخ</button></td></tr>;
          })}</tbody>
        </table>
      </div>
      {dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={(e) => { e.preventDefault(); onSaveRole(dialog).then(() => setDialog(null)); }} className="panel w-full max-w-2xl p-6"><DialogTitle title="بيانات الدور" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-2"><Label t="اسم الدور"><input required disabled={dialog.is_system_role} value={dialog.role_name} onChange={(e) => setDialog({ ...dialog, role_name: e.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Label><Label t="الوصف"><textarea value={dialog.role_description || ""} onChange={(e) => setDialog({ ...dialog, role_description: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}
    </div>
  );
}

function UsersPermissionsPage({ employees, can, companyPermissions }) {
  const [users, setUsers] = useState([]);
  const [roleRows, setRoleRows] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [treeNodes, setTreeNodes] = useState([]);
  const [treePermissions, setTreePermissions] = useState([]);
  const [filters, setFilters] = useState({ q: "", role: "all", branch: "all", status: "all" });
  const [dialog, setDialog] = useState(null);
  const [selectedRole, setSelectedRole] = useState(systemRoles[0]);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [error, setError] = useState("");
  const currentUser = getCurrentUser() || {};
  const isPlatformAdmin = currentUser?.is_platform_admin === true || currentUser?.role === platformSuperAdminRole || String(currentUser?.username || "").trim() === "platform";
  const canEdit = can?.("users_permissions", "can_edit") !== false;
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [u, p, employeeRows, roleList] = await Promise.all([
        adminService.listUsers(),
        adminService.listPermissions(),
        adminService.loadEmployeesForUserDropdown().catch(() => employees || []),
        adminService.listRoles(),
      ]);
      setUsers(isPlatformAdmin ? u : u.filter((row) => !isProtectedPlatformUser(row)));
      setPermissions(p);
      setEmployeeOptions(employeeRows);
      setRoleRows(isPlatformAdmin ? roleList : roleList.filter((role) => !isProtectedPlatformRole(role.role_name)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const u1 = adminService.subscribeUsers(load);
    const u2 = adminService.subscribePermissions(load);
    return () => { u1?.(); u2?.(); };
  }, []);
  useEffect(() => {
    let active = true;
    setTreeLoading(true);
    Promise.all([
      treePermissionsService.loadPermissionTree(),
      treePermissionsService.loadRoleNodePermissions(selectedRole),
    ]).then(([nodes, roleRows]) => {
      if (!active) return;
      setTreeNodes(nodes);
      setTreePermissions(roleRows);
    }).catch((e) => {
      if (active) setError(e.message);
    }).finally(() => {
      if (active) setTreeLoading(false);
    });
    return () => { active = false; };
  }, [selectedRole]);
  const branchOptions = [...new Set([...(employeeOptions || []).map((e) => e.branch), ...users.map((u) => u.branch), ...branches].filter(Boolean))];
  const safeRoleRows = isPlatformAdmin ? (roleRows || []) : (roleRows || []).filter((r) => !isProtectedPlatformRole(r.role_name));
  const roleOptions = [...new Set([...safeRoleRows.filter((r) => r.is_active !== false).map((r) => r.role_name), ...systemRoles])];
  const filterNodesByCompanyPermissions = (nodes = []) =>
    nodes
      .map((node) => {
        const children = filterNodesByCompanyPermissions(node.children || []);
        const pageAllowed = !node.page_key || companyCanAccessFromRows(companyPermissions || [], node.page_key, "can_view");
        return pageAllowed || children.length ? { ...node, children } : null;
      })
      .filter(Boolean);
  const companyFilteredTreeNodes = filterNodesByCompanyPermissions(treeNodes);
  const filtered = users.filter((u) =>
    (!filters.q || (u.name || u.employee_name || u.username || "").includes(filters.q) || u.username.includes(filters.q) || u.employee_id.includes(filters.q) || u.branch.includes(filters.q) || u.role.includes(filters.q)) &&
    (filters.role === "all" || u.role === filters.role) &&
    (filters.branch === "all" || u.branch === filters.branch) &&
    (filters.status === "all" || String(u.is_active) === filters.status)
  );
  const selectEmployee = (id) => {
    const employee = employeeOptions.find((e) => e.id === id || e.employee_id === id) || employees.find((e) => e.id === id);
    setDialog((d) => ({ ...d, name: employee?.name || "", employee_id: id, employee_name: employee?.name || "", branch: employee?.branch || "", job: employee?.job || "", email: employee?.email || d?.email || "", phone: employee?.phone || d?.phone || "", username: d?.username || id }));
  };
  const saveUser = async (e) => {
    e.preventDefault();
    if (!canEdit) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    if (!isPlatformAdmin && isProtectedPlatformRole(dialog.role)) return alert("لا يمكن اختيار هذا الدور من إعدادات الشركة");
    if (!dialog.employee_id && !String(dialog.role || "").includes("مدير النظام") && !String(dialog.role || "").includes("مدير النظام")) return alert("يجب اختيار الموظف");
    if (!dialog.username) return alert("يجب إدخال اسم المستخدم");
    if (!dialog.role) return alert("يجب تحديد الدور");
    try {
      const selectedEmployee = employeeOptions.find((employee) => employee.id === dialog.employee_id || employee.employee_id === dialog.employee_id);
      const saved = await adminService.saveUser(dialog, selectedEmployee);
      setUsers((list) => {
        const exists = list.some((x) => x.user_id === saved.user_id);
        return exists ? list.map((x) => (x.user_id === saved.user_id ? saved : x)) : [saved, ...list];
      });
      setDialog(null);
    } catch (err) {
      alert(err.message);
    }
  };
  const inventoryDefaultRows = defaultInventoryPermissions();
  const permissionRows = permissionPages.map((page) => permissions.find((p) => p.role === selectedRole && p.page_key === page) || (selectedRole === "مسؤول المخزون" ? inventoryDefaultRows.find((p) => p.page_key === page) : null) || {
    id: `${selectedRole}-${page}`,
    role: selectedRole,
    page_key: page,
    can_view: isAdminLikeRole(selectedRole),
    can_create: isAdminLikeRole(selectedRole),
    can_edit: isAdminLikeRole(selectedRole),
    can_delete: isAdminLikeRole(selectedRole),
    can_export: isAdminLikeRole(selectedRole),
    can_approve: isAdminLikeRole(selectedRole),
    can_post: isAdminLikeRole(selectedRole),
    can_print: isAdminLikeRole(selectedRole),
  });
  const updatePermission = (pageKey, key, value) => {
    setPermissions((list) => {
      const row = permissionRows.find((p) => p.page_key === pageKey);
      const next = { ...row, [key]: value };
      const exists = list.some((p) => p.role === selectedRole && p.page_key === pageKey);
      return exists ? list.map((p) => (p.role === selectedRole && p.page_key === pageKey ? next : p)) : [...list, next];
    });
  };
  const selectAll = (value) => {
    setPermissions((list) => {
      const others = list.filter((p) => p.role !== selectedRole);
      return [
        ...others,
        ...permissionPages.map((page) => ({
          id: `${selectedRole}-${page}`,
          role: selectedRole,
          page_key: page,
          can_view: value,
          can_create: value,
          can_edit: value,
          can_delete: value,
          can_export: value,
          can_approve: value,
          can_post: value,
          can_print: value,
        })),
      ];
    });
  };
  const savePermissions = async () => {
    if (!canEdit) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    try {
      const saved = await adminService.savePermissions(permissionRows);
      setPermissions((list) => [...list.filter((p) => p.role !== selectedRole), ...saved]);
      alert("تم حفظ الصلاحيات");
    } catch (e) {
      alert(e.message);
    }
  };
  const syncLegacyPermissions = async (roleRows) => {
    const flat = flattenPermissionTree(companyFilteredTreeNodes);
    const byPage = new Map();
    flat.forEach((node) => {
      const pageKey = node.page_key;
      if (!pageKey || !permissionPages.includes(pageKey)) return;
      const row = treePermissionsService.getNodePermission(roleRows, selectedRole, node.node_key);
      const current = byPage.get(pageKey) || { id: `${selectedRole}-${pageKey}`, role: selectedRole, page_key: pageKey, can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false, can_approve: false, can_post: false, can_print: false, can_override_stock: false };
      byPage.set(pageKey, { ...current, can_view: current.can_view || row.can_view, can_create: current.can_create || row.can_create, can_edit: current.can_edit || row.can_edit, can_delete: current.can_delete || row.can_delete, can_export: current.can_export || row.can_export, can_approve: current.can_approve || row.can_approve, can_post: current.can_post || row.can_post, can_print: current.can_print || row.can_print, can_override_stock: current.can_override_stock || row.can_override });
    });
    const legacyRows = Array.from(byPage.values());
    if (!legacyRows.length) return;
    const savedLegacy = await adminService.savePermissions(legacyRows);
    setPermissions((list) => [...list.filter((p) => p.role !== selectedRole), ...savedLegacy]);
  };
  const saveTreePermissions = async () => {
    if (!canEdit) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    try {
      setTreeLoading(true);
      const flat = flattenPermissionTree(companyFilteredTreeNodes);
      const roleRows = flat.map((node) => treePermissionsService.getNodePermission(treePermissions, selectedRole, node.node_key));
      const saved = await treePermissionsService.saveBulkNodePermissions(selectedRole, roleRows);
      setTreePermissions(saved);
      await syncLegacyPermissions(saved);
      alert("تم حفظ صلاحيات الشجرة بنجاح");
    } catch (e) {
      alert(e.message);
    } finally {
      setTreeLoading(false);
    }
  };
  const resetTreePermissions = async () => {
    if (!canEdit) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    if (!confirm("هل تريد إعادة ضبط صلاحيات هذا الدور؟")) return;
    try {
      setTreeLoading(true);
      const saved = await treePermissionsService.resetRolePermissions(selectedRole);
      setTreePermissions(saved);
      await syncLegacyPermissions(saved);
      alert("تمت إعادة ضبط صلاحيات الدور");
    } catch (e) {
      alert(e.message);
    } finally {
      setTreeLoading(false);
    }
  };
  const copyTreePermissions = async (sourceRole) => {
    if (!canEdit) return alert("لا تملك صلاحية تنفيذ هذا الإجراء");
    if (!sourceRole) return;
    try {
      setTreeLoading(true);
      const saved = await treePermissionsService.copyRolePermissions(sourceRole, selectedRole);
      setTreePermissions(saved);
      await syncLegacyPermissions(saved);
      alert("تم نسخ الصلاحيات إلى الدور المحدد");
    } catch (e) {
      alert(e.message);
    } finally {
      setTreeLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHead title="المستخدمون والصلاحيات" desc="إدارة مستخدمي النظام ومصفوفة صلاحيات الأدوار" action={<button disabled={!canEdit} onClick={() => setDialog({ user_id: `USR-${Date.now()}`, employee_id: "", employee_name: "", username: "", password: "", role: "الموظف", branch: "", job: "", email: "", phone: "", is_active: true })} className="btn-primary"><Plus size={18} /> إضافة مستخدم</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="panel flex flex-wrap gap-3 p-4">
        <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="اكتب سبب طلب المراجعة..." />
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="field max-w-[190px]"><option value="all">كل الأدوار</option>{roleOptions.map((r) => <option key={r}>{r}</option>)}</select>
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[160px]"><option value="all">كل الحالات</option><option value="true">نشط</option><option value="false">معطل</option></select>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-4">
          <h3 className="mb-3 font-extrabold">المستخدمون</h3>
          {loading ? <p className="text-sm text-slate-400">جاري التحميل...</p> : <div className="table-wrap"><table><thead><tr><th>المستخدم</th><th>الموظف</th><th>الدور</th><th>الفرع</th><th>الحالة</th><th></th></tr></thead><tbody>{filtered.map((u) => {
              const isProtectedUser = !isPlatformAdmin && isProtectedPlatformUser(u);
              return <tr key={u.user_id}><td>{u.username}</td><td>{u.employee_name}<p className="text-xs text-slate-400">{u.employee_id}</p></td><td>{u.role}</td><td>{u.branch}</td><td><Status>{u.is_active ? "نشط" : "معطل"}</Status></td><td><button disabled={!canEdit || isProtectedUser} onClick={() => setDialog(u)} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canEdit || isProtectedUser} onClick={() => adminService.saveUser({ ...u, is_active: !u.is_active }).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600">{u.is_active ? "تعطيل" : "تفعيل"}</button></td></tr>;
            })}</tbody></table></div>}
        </div>
        <TreePermissionsPanel
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          treeNodes={companyFilteredTreeNodes}
          treePermissions={treePermissions}
          setTreePermissions={setTreePermissions}
          roles={roleOptions}
          users={users}
          branchOptions={branchOptions}
          canEdit={canEdit}
          loading={treeLoading}
          onSave={saveTreePermissions}
          onReset={resetTreePermissions}
          onCopy={copyTreePermissions}
        />
      </div>
      {flattenPermissionTree(treeNodes).length > flattenPermissionTree(companyFilteredTreeNodes).length && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">بعض الصلاحيات مخفية لأن هذه الوحدات غير مفعلة لهذه الشركة.</div>}
      <RoleManagementPanel roles={roleRows.length ? roleRows : roleOptions.map((role_name) => ({ role_id: `ROLE-${role_name}`, role_name, role_description: "", is_system_role: systemRoles.includes(role_name), is_active: true }))} users={users} canEdit={canEdit} onSaveRole={async (roleRow) => { const saved = await adminService.saveRole(roleRow); setRoleRows((list) => list.some((r) => r.role_id === saved.role_id) ? list.map((r) => r.role_id === saved.role_id ? saved : r) : [...list, saved]); }} onDeleteRole={async (roleRow) => { const saved = await adminService.deleteRole(roleRow, users); setRoleRows((list) => saved ? list.map((r) => r.role_id === saved.role_id ? saved : r) : list.filter((r) => r.role_id !== roleRow.role_id)); }} onCopyPermissions={async (source, target) => { await treePermissionsService.copyRolePermissions(source, target); alert("تم نسخ صلاحيات الدور"); }} />
      {dialog && <UserEditorModal dialog={dialog} setDialog={setDialog} saveUser={saveUser} employeeOptions={employeeOptions} selectEmployee={selectEmployee} roles={roleOptions} />}
      {false && dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={saveUser} className="panel w-full max-w-3xl p-6"><div className="mb-5 flex"><h3 className="text-xl font-extrabold">بيانات المستخدم</h3><button type="button" onClick={() => setDialog(null)} className="mr-auto"><X /></button></div><div className="grid gap-4 md:grid-cols-2"><Label t="ربط الموظف"><select value={dialog.employee_id} onChange={(e) => selectEmployee(e.target.value)} className="field mt-2"><option value="">بدون ربط</option>{employeeOptions.map((e) => <option key={e.id} value={e.id}>{e.name} - {e.id} - {e.branch} - {e.job}</option>)}</select></Label><Label t="اسم الموظف"><input readOnly value={dialog.employee_name || dialog.name || ""} className="field mt-2 bg-slate-50" /></Label><Label t="اسم المستخدم"><input required value={dialog.username} onChange={(e) => setDialog({ ...dialog, username: e.target.value })} className="field mt-2" /></Label><Label t="كلمة المرور"><input required type="password" value={dialog.password || ""} onChange={(e) => setDialog({ ...dialog, password: e.target.value })} className="field mt-2" /></Label><Label t="الدور"><select value={dialog.role} onChange={(e) => setDialog({ ...dialog, role: e.target.value })} className="field mt-2">{systemRoles.map((r) => <option key={r}>{r}</option>)}</select></Label><Label t="الفرع"><input readOnly value={dialog.branch || ""} className="field mt-2 bg-slate-50" /></Label><Label t="الوظيفة"><input readOnly value={dialog.job || ""} className="field mt-2 bg-slate-50" /></Label><Label t="البريد الإلكتروني"><input value={dialog.email || ""} onChange={(e) => setDialog({ ...dialog, email: e.target.value })} className="field mt-2" /></Label><Label t="الهاتف"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={String(dialog.is_active)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="btn-secondary">إلغاء</button><button className="btn-primary"><Save size={17} /> حفظ البيانات</button></div></form></div>}
    </div>
  );
}

function EnterpriseReportsCenter({ employees, evaluations, can }) {
  const [guarantees, setGuarantees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentEmployees, setAssignmentEmployees] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", month: "", branch: "all", employee: "", job: "all", status: "all", approval: "all" });
  useEffect(() => {
    Promise.all([
      guaranteesService.list().catch(() => []),
      overtimeService.listAssignments().catch(() => []),
      overtimeService.listAssignmentEmployees().catch(() => []),
    ]).then(([g, a, ae]) => {
      setGuarantees(g);
      setAssignments(a);
      setAssignmentEmployees(ae);
    });
  }, []);
  const overtimeRows = assignmentEmployees.map((row) => ({ ...assignments.find((a) => a.assignment_id === row.assignment_id), ...row }));
  const reportTypes = [
    ["employees", "تقرير الموظفين", employees],
    ["guarantees", "تقرير الضمانات", guarantees],
    ["overtime", "تقرير العمل الإضافي", overtimeRows],
    ["evaluations", "تقرير التقييمات", evaluations],
    ["incentives", "تقرير الحوافز", calcIncentivesSafe(employees, evaluations)],
    ["branch", "تقرير حسب الفرع", employees],
    ["employee", "تقرير حسب الموظف", evaluations],
    ["month", "تقرير حسب الشهر", evaluations],
    ["branches_compare", "تقرير مقارنة بين الفروع", overtimeRows],
    ["employees_compare", "تقرير مقارنة بين الموظفين", evaluations],
    ["months_compare", "تقرير مقارنة بين الأشهر", evaluations],
  ];
  const filterRows = (rows) => rows.filter((r) => {
    const date = r.assignment_date || r.guarantee_date || r.month || r.hireDate || "";
    const employeeName = r.employee_name || r.employee?.name || r.name || "";
    return (!filters.month || String(date).startsWith(filters.month)) &&
      (!filters.from || String(date) >= filters.from) &&
      (!filters.to || String(date) <= filters.to) &&
      (filters.branch === "all" || r.branch === filters.branch || r.employee?.branch === filters.branch) &&
      (!filters.employee || employeeName.includes(filters.employee) || String(r.employee_id || r.employeeId || r.id || "").includes(filters.employee)) &&
      (filters.job === "all" || r.job === filters.job || r.employee?.job === filters.job) &&
      (filters.status === "all" || r.status === filters.status || r.guarantee_status === filters.status) &&
      (filters.approval === "all" || r.approval_status === filters.approval);
  });
  const reportColumns = [
    { key: "name", label: "الاسم" },
    { key: "employee_name", label: "الموظف" },
    { key: "branch", label: "الفرع" },
    { key: "job", label: "الوظيفة" },
    { key: "month", label: "الشهر" },
    { key: "total", label: "النتيجة" },
    { key: "status", label: "الحالة" },
    { key: "approval_status", label: "الاعتماد" },
  ];
  const printReport = (title, rows) => {
    const filteredRows = filterRows(rows);
    const body = `<div class="brand"><h1>${title}</h1></div><p class="muted">تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}</p><p>الفلاتر: الفرع ${filters.branch} - الشهر ${filters.month || "الكل"}</p>${rowsToReportHtml("", filteredRows, reportColumns)}<div style="margin-top:40px;display:flex;justify-content:space-between"><b>إعداد الموارد البشرية</b><b>اعتماد الإدارة</b></div>`;
    printDocument(title, body);
  };
  return (
    <div className="space-y-5">
      <PageHead title="مركز التقارير" desc="تقارير إدارية احترافية قابلة للطباعة والتصدير" />
      <div className="panel grid gap-3 p-4 md:grid-cols-4 xl:grid-cols-8">
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="field" />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="field" />
        <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field" />
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field"><option value="all">كل الفروع</option>{branches.map((b) => <option key={b}>{b}</option>)}</select>
        <input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field" placeholder="اكتب سبب طلب المراجعة..." />
        <select value={filters.job} onChange={(e) => setFilters({ ...filters, job: e.target.value })} className="field"><option value="all">كل الوظائف</option>{jobs.map((j) => <option key={j}>{j}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field"><option value="all">كل الحالات</option>{["نشط", "سارية", "منتهية", "مكلف", "معتمد", "مرفوض"].map((s) => <option key={s}>{s}</option>)}</select>
        <select value={filters.approval} onChange={(e) => setFilters({ ...filters, approval: e.target.value })} className="field"><option value="all">كل الاعتمادات</option>{approvalStatuses.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reportTypes.map(([key, title, rows]) => {
        const filteredRows = filterRows(rows);
        const exportRows = reportRowsForExport(filteredRows, reportColumns);
        return <div key={key} className="panel p-5"><div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-brand-700"><FileBarChart /></div><h3 className="mt-4 font-extrabold">{title}</h3><p className="mt-1 text-xs text-slate-500">عدد السجلات: {filteredRows.length}</p><div className="mt-5 flex gap-2"><button disabled={can?.("reports_center", "can_export") === false} onClick={() => exportExcel(exportRows, title)} className="btn-secondary flex-1"><FileSpreadsheet size={15} /> Excel</button><button onClick={() => printReport(title, rows)} className="btn-secondary flex-1"><Printer size={15} /> PDF</button><button disabled={can?.("reports_center", "can_export") === false} onClick={() => exportDocx(title, exportRows)} className="btn-secondary flex-1"><Download size={15} /> Word</button></div></div>;
      })}</div>
    </div>
  );
}

function AuditLogsPage({ role }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isAdminLikeRole(role)) return;
    const load = () => auditService.list().then(setRows).catch((e) => setError(e.message));
    load();
    return auditService.subscribe(load);
  }, [role]);
  if (!isAdminLikeRole(role)) return <div className="panel p-6 text-center font-bold text-red-600">لا تملك صلاحية عرض سجل العمليات</div>;
  return (
    <div className="space-y-5">
      <PageHead title="سجل العمليات" desc="تتبع العمليات الحساسة داخل النظام" />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>التاريخ</th><th>المستخدم</th><th>الإجراء</th><th>الوحدة</th><th>السجل</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.created_at}</td><td>{r.user_name}</td><td>{r.action}</td><td>{r.module_name}</td><td>{r.record_id}</td></tr>)}</tbody></table></div></div>
    </div>
  );
}

const groupCount = (rows, key) =>
  rows.reduce((acc, row) => {
    const value = row[key] || "غير محدد";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
function ReportBox({ title, rows }) {
  return (
    <div className="panel p-4">
      <h3 className="mb-3 font-extrabold">{title}</h3>
      <div className="space-y-2">{rows.length ? rows.map(([name, value]) => <div key={name} className="flex rounded-xl bg-slate-50 p-3 text-sm"><span>{name}</span><b className="mr-auto">{value}</b></div>) : <p className="text-sm text-slate-400">لا توجد بيانات</p>}</div>
    </div>
  );
}
function DetailsDialog({ title, row, close }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-5 flex"><h3 className="text-xl font-extrabold">{title}</h3><button onClick={close} className="mr-auto"><X /></button></div>
        <div className="grid gap-3 md:grid-cols-2">{Object.entries(row).map(([k, v]) => <Info key={k} t={k} v={String(v || "-")} />)}</div>
      </div>
    </div>
  );
}

function IndicatorManager({ title, indicators, setIndicators }) {
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null);
  const save = () => {
    if (!dialog?.label?.trim() || !dialog?.key?.trim()) return;
    const item = {
      key: dialog.key.trim(),
      label: dialog.label.trim(),
      type: dialog.type,
      weight: Number(dialog.weight || 0),
    };
    const next = [...indicators];
    if (dialog.mode === "add") next.push(item);
    else next[dialog.index] = item;
    setIndicators(next);
    setDialog(null);
    setSelected(null);
  };
  const remove = () => {
    if (selected === null || indicators.length <= 1) return;
    if (!confirm("هل تريد حذف المؤشر المحدد؟")) return;
    setIndicators(indicators.filter((_, i) => i !== selected));
    setSelected(null);
  };
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <b>{title}</b>
        <div className="mr-auto flex gap-2">
          <button onClick={() => setDialog({ mode: "add", key: "", label: "", type: "positive", weight: 1 })} className="btn-primary !h-9"><Plus size={15} /> إضافة</button>
          <button disabled={selected === null} onClick={() => setDialog({ mode: "edit", index: selected, ...indicators[selected] })} className="btn-secondary !h-9 disabled:opacity-40"><Pencil size={15} /> تعديل</button>
          <button disabled={selected === null} onClick={remove} className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-600 disabled:opacity-40"><Trash2 size={15} /> حذف</button>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {indicators.map((item, i) => (
          <button key={`${item.key}-${i}`} onClick={() => setSelected(i)} className={`rounded-xl border p-3 text-right text-sm ${selected === i ? "border-brand-700 bg-brand-50" : "border-slate-200"}`}>
            <b>{item.label}</b>
            <p className="mt-1 text-xs text-slate-500">{item.type === "negative" ? "خصم" : "إضافة"} أ— {item.weight}</p>
          </button>
        ))}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel w-full max-w-md p-6">
            <div className="mb-5 flex items-center"><h3 className="text-lg font-extrabold">مؤشر</h3><button onClick={() => setDialog(null)} className="mr-auto"><X /></button></div>
            <div className="grid gap-4">
              <Label t="اسم الحقل البرمجي"><input value={dialog.key} onChange={(e) => setDialog({ ...dialog, key: e.target.value.replace(/\s+/g, "_") })} className="field mt-2" /></Label>
              <Label t="اسم المؤشر"><input value={dialog.label} onChange={(e) => setDialog({ ...dialog, label: e.target.value })} className="field mt-2" /></Label>
              <Label t="نوع التأثير"><select value={dialog.type} onChange={(e) => setDialog({ ...dialog, type: e.target.value })} className="field mt-2"><option value="positive">إضافة للنقاط</option><option value="negative">خصم من النقاط</option></select></Label>
              <Label t="الوزن / معامل الاحتساب"><input type="number" value={dialog.weight} onChange={(e) => setDialog({ ...dialog, weight: e.target.value })} className="field mt-2" /></Label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => setDialog(null)} className="btn-secondary">إلغاء</button><button onClick={save} className="btn-primary"><Save size={17} /> حفظ</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnhancedProductivity({ employees = [], settings = {}, setSettings, currentUser, currentCompany, can }) {
  const indicators = settings.productivityIndicators || defaultProductivityIndicators;
  const [values, setValues] = useState(() => initialIndicatorValues(indicators));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [operations, setOperations] = useState([]);
  const [loadingOperations, setLoadingOperations] = useState(true);
  const [importing, setImporting] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [importSummary, setImportSummary] = useState(null);
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const canImport = can?.("productivity", "can_import") !== false;
  const canExport = can?.("productivity", "can_export") !== false;

  const activeEmployees = useMemo(() => (Array.isArray(employees) ? employees : [])
    .map((employee) => ({
      ...employee,
      id: employee?.id || employee?.employee_id || "",
      name: employee?.name || employee?.employee_name || "موظف",
      branch: employee?.branch || "",
      job: employee?.job || employee?.job_name || "",
      status: employee?.status || "نشط",
    }))
    .filter((employee) => {
      const status = String(employee?.status || "").trim();
      return !status || status === "نشط" || status.toLowerCase() === "active";
    })
    .sort((a, b) => String(a.branch || "").localeCompare(String(b.branch || ""), "ar")
      || String(a.name || "").localeCompare(String(b.name || ""), "ar")), [employees]);

  const visibleEmployees = useMemo(() => {
    const search = employeeSearch.trim().toLowerCase();
    if (!search) return activeEmployees;
    return activeEmployees.filter((employee) => [employee.name, employee.id, employee.job, employee.branch]
      .some((value) => String(value || "").toLowerCase().includes(search)));
  }, [activeEmployees, employeeSearch]);

  const selectedEmployee = activeEmployees.find((employee) => String(employee.id) === String(selectedEmployeeId));
  const selectedOperations = useMemo(() => operations.filter((row) => String(row.employee_id) === String(selectedEmployeeId)), [operations, selectedEmployeeId]);

  const loadOperations = async () => {
    setLoadingOperations(true);
    setOperationError("");
    try {
      if (!companyId) throw new Error("لم يتم تحديد الشركة الحالية");
      setOperations(await dailyOperationsService.loadDailyOperations({}));
    } catch (error) {
      console.error("Productivity daily_operations load error:", error);
      setOperationError(error.message || "تعذر تحميل عمليات الإنتاجية");
    } finally {
      setLoadingOperations(false);
    }
  };

  useEffect(() => {
    loadOperations();
    let unsubscribe = () => {};
    try {
      unsubscribe = dailyOperationsService.subscribe(loadOperations);
    } catch (error) {
      console.error("Productivity daily_operations realtime error:", error);
    }
    return () => unsubscribe?.();
  }, [companyId]);

  useEffect(() => {
    const next = initialIndicatorValues(indicators);
    if (!selectedEmployeeId || !selectedOperations.length) {
      setValues(next);
      return;
    }
    const sumByType = (words) => selectedOperations
      .filter((row) => words.some((word) => String(row.operation_type || "").includes(word)))
      .reduce((sum, row) => sum + Number(row.operation_count || 0), 0);
    const serviceTimes = selectedOperations.map((row) => Number(row.average_service_time || 0)).filter((value) => value > 0);
    setValues({
      ...next,
      receive: sumByType(["وارد", "قبض"]),
      pay: sumByType(["صادر", "صرف"]),
      sell: sumByType(["بيع"]),
      buy: sumByType(["شراء"]),
      errors: selectedOperations.reduce((sum, row) => sum + Number(row.error_count || 0), 0),
      complaints: selectedOperations.reduce((sum, row) => sum + Number(row.customer_complaints || 0), 0),
      time: serviceTimes.length ? Number((serviceTimes.reduce((sum, value) => sum + value, 0) / serviceTimes.length).toFixed(2)) : 0,
    });
  }, [selectedEmployeeId, selectedOperations, indicators]);

  const setIndicators = (next) => setSettings({ ...settings, productivityIndicators: next });
  const score = scoreIndicators(values, indicators, 0);

  const importOperations = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || importing) return;
    setImporting(true);
    setImportSummary(null);
    try {
      if (!companyId) throw new Error("لم يتم تحديد الشركة الحالية");
      const parsed = await parseDailyOperationsExcel(file);
      const validated = validateDailyOperationsRows(parsed, activeEmployees, companyId);
      const validRows = validated.filter((row) => row.valid);
      const invalidRows = validated.filter((row) => !row.valid);
      const result = validRows.length
        ? await importDailyOperationsRows(validated, companyId, { duplicateMode: "update" })
        : { saved: [], inserted: 0, updated: 0, skipped: 0 };
      setImportSummary({
        message: validRows.length ? "تم الاستيراد بنجاح" : "فشل الاستيراد",
        total: validated.length,
        imported: result.saved?.length || 0,
        updated: result.updated || 0,
        rejected: invalidRows.length,
        warnings: validated.filter((row) => row.warning).length,
        reasons: invalidRows.slice(0, 10).map((row) => `الصف ${row.rowNumber}: ${row.validationMessage}`),
      });
      await loadOperations();
    } catch (error) {
      console.error("Productivity Excel import error:", error);
      setImportSummary({ message: "فشل الاستيراد", total: 0, imported: 0, updated: 0, rejected: 0, warnings: 0, reasons: [error.message || "تعذر استيراد البيانات"] });
    } finally {
      setImporting(false);
    }
  };

  const exportIndicators = () => {
    if (!selectedEmployee) return alert("اختر الموظف أولًا");
    try {
      exportExcel(indicators.map((indicator) => ({
        "الرقم الوظيفي": selectedEmployee.id,
        "اسم الموظف": selectedEmployee.name,
        "الفرع": selectedEmployee.branch || "",
        "الوظيفة": selectedEmployee.job || "",
        "المؤشر": indicator.label,
        "القيمة": Number(values[indicator.key] || 0),
        "الوزن": Number(indicator.weight || 0),
        "نقاط الإنتاجية": score,
      })), "productivity-indicators");
      alert("تم التصدير بنجاح");
    } catch (error) {
      console.error("Productivity indicators export error:", error);
      alert("تعذر تصدير البيانات");
    }
  };

  const exportEmployeeOperations = () => {
    if (!selectedEmployee) return alert("اختر الموظف أولًا");
    if (!selectedOperations.length) return alert("لا توجد بيانات للتصدير");
    try {
      exportProductivityOperationsToExcel(selectedOperations, "employee-productivity-operations.xlsx");
      alert("تم التصدير بنجاح");
    } catch (error) {
      console.error("Employee productivity operations export error:", error);
      alert("تعذر تصدير البيانات");
    }
  };

  const exportAllOperations = () => {
    if (!operations.length) return alert("لا توجد بيانات للتصدير");
    try {
      exportProductivityOperationsToExcel(operations, "all-productivity-operations.xlsx");
      alert("تم التصدير بنجاح");
    } catch (error) {
      console.error("All productivity operations export error:", error);
      alert("تعذر تصدير البيانات");
    }
  };

  return (
    <Entry title="مؤشرات الإنتاجية" desc="يمكن إضافة أو تعديل مؤشرات الإنتاجية ومعاملات احتسابها">
      <div className="panel flex flex-wrap items-center gap-2 p-4">
        <button type="button" onClick={downloadProductivityTemplate} className="btn-secondary"><Download size={17} /> تحميل نموذج Excel</button>
        <label className={`btn-secondary cursor-pointer ${!canImport || importing ? "pointer-events-none opacity-50" : ""}`}>
          <Upload size={17} /> {importing ? "جاري الاستيراد..." : "استيراد Excel"}
          <input type="file" accept=".xlsx,.xls,.csv" onChange={importOperations} disabled={!canImport || importing} className="hidden" />
        </label>
        <button type="button" disabled={!canExport} onClick={exportIndicators} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> تصدير Excel</button>
        <button type="button" disabled={!canExport || !selectedEmployee} onClick={exportEmployeeOperations} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> تصدير عمليات الموظف</button>
        <button type="button" disabled={!canExport} onClick={exportAllOperations} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> تصدير كل العمليات</button>
      </div>

      {operationError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{operationError}</div>}
      {importSummary && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className={`mb-2 font-extrabold ${importSummary.imported ? "text-emerald-700" : "text-red-700"}`}>{importSummary.message}</p>
          <div className="flex flex-wrap gap-4 font-bold">
            <span>عدد السجلات المقروءة: {importSummary.total}</span><span className="text-emerald-700">عدد السجلات المستوردة: {importSummary.imported}</span>
            <span className="text-blue-700">السجلات المحدّثة: {importSummary.updated}</span><span className="text-red-700">عدد السجلات المرفوضة: {importSummary.rejected}</span>
            <span className="text-amber-700">تحذيرات: {importSummary.warnings}</span>
          </div>
          {importSummary.reasons?.length > 0 && <ul className="mt-3 list-inside list-disc space-y-1 text-red-700">{importSummary.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[minmax(220px,.8fr)_minmax(300px,1.5fr)]">
        <Label t="البحث عن موظف"><input value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} className="field mt-2" placeholder="الاسم أو الرقم أو الوظيفة أو الفرع" /></Label>
        <Label t="الموظف">
          <select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} className="field mt-2">
            <option value="">اختر الموظف</option>
            {visibleEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} — {employee.job || "بدون وظيفة"} — {employee.branch || "بدون فرع"}</option>)}
          </select>
        </Label>
      </div>
      {!activeEmployees.length && <div className="rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-700">لا يوجد موظفون نشطون في الشركة الحالية</div>}
      {selectedEmployee && <div className="rounded-xl bg-brand-50 p-3 text-sm font-bold text-brand-800">{selectedEmployee.name} — {selectedEmployee.job || "بدون وظيفة"} — {selectedEmployee.branch || "بدون فرع"}</div>}

      <IndicatorManager title="إدارة مؤشرات الإنتاجية" indicators={indicators} setIndicators={setIndicators} />
      <ProductivityComparison employees={activeEmployees} indicators={indicators} />
      <Fields values={values} set={setValues} items={indicators.map((x) => [x.key, x.label])} />
      <Score n={score} label="نقاط الإنتاجية" />

      <div className="rounded-2xl border border-slate-200 p-4">
        <h3 className="mb-3 text-lg font-extrabold">عمليات الموظف المسجلة</h3>
        <div className="table-wrap"><table><thead><tr><th>التاريخ</th><th>نوع العملية</th><th>عدد العمليات</th><th>الأخطاء</th><th>الشكاوى</th><th>المبلغ</th><th>العملة</th></tr></thead><tbody>
          {loadingOperations ? <tr><td colSpan="7" className="py-6 text-center">جاري تحميل العمليات...</td></tr>
            : selectedOperations.length ? selectedOperations.map((row) => <tr key={row.operation_id}><td>{row.operation_date}</td><td>{row.operation_type}</td><td>{row.operation_count}</td><td>{row.error_count}</td><td>{row.customer_complaints}</td><td>{row.amount}</td><td>{row.currency}</td></tr>)
              : <tr><td colSpan="7" className="py-6 text-center text-slate-400">{selectedEmployeeId ? "لا توجد عمليات مسجلة لهذا الموظف حالياً" : "اختر الموظف لعرض عملياته"}</td></tr>}
        </tbody></table></div>
      </div>
      <button className="btn-primary" disabled={!selectedEmployee}><Save size={17} /> حفظ مؤشرات الشهر</button>
    </Entry>
  );
}

function EnhancedDiscipline({ employees, settings, setSettings }) {
  const indicators = settings.disciplineIndicators || defaultDisciplineIndicators;
  const [values, setValues] = useState(() => ({ ...initialIndicatorValues(indicators), present: 25, absent: 1, late: 18, early: 0, violations: 0, penalties: 0 }));
  const setIndicators = (next) => setSettings({ ...settings, disciplineIndicators: next });
  const score = scoreIndicators(values, indicators, 100);
  return (
    <Entry title="الانضباط الوظيفي" desc="يمكن تعديل مؤشرات الانضباط أو إضافة مؤشرات جديدة">
      <Label t="الموظف"><select className="field mt-2 max-w-md">{employees.map((e) => <option key={e.id}>{e.name}</option>)}</select></Label>
      <IndicatorManager title="إدارة مؤشرات الانضباط" indicators={indicators} setIndicators={setIndicators} />
      <Fields values={values} set={setValues} items={indicators.map((x) => [x.key, x.label])} />
      <Label t="ملاحظات الموارد البشرية"><textarea className="field mt-2 !h-auto py-3" rows="3" /></Label>
      <Score n={score} label="درجة الانضباط" />
      <button className="btn-primary"><Save size={17} /> حفظ سجل الانضباط</button>
    </Entry>
  );
}

function EnhancedIncentives({ employees, evaluations, setEvaluations }) {
  const [details, setDetails] = useState(null);
  const data = evaluations.map((ev) => {
    const employee = employees.find((x) => x.id === ev.employeeId) || {};
    const total = effectiveEvaluationTotal(ev);
    const cat = classify(total);
    const rate = cat === "ممتاز" ? 0.1 : cat === "جيد جدًا" ? 0.07 : cat === "جيد" ? 0.04 : 0;
    return { ...employee, evaluation: ev, total, rate, amount: (employee.salary || 0) * rate * (total / 100), approval: ev.status };
  });
  return (
    <div className="space-y-5">
      <PageHead title="الحوافز والمكافآت" desc="احتساب آلي مع عرض تفاصيل أهلية كل موظف" action={<button onClick={() => exportExcel(data, "الحوافز")} className="btn-primary"><Download size={17} /> تصدير الكشف</button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Mini label="إجمالي الحوافز" value={money(data.reduce((s, x) => s + x.amount, 0))} I={CircleDollarSign} />
        <Mini label="المستحقون" value={data.filter((x) => x.rate > 0).length} I={UserCheck} />
        <Mini label="بانتظار الاعتماد" value={evaluations.filter((x) => x.status === "قيد المراجعة").length} I={Clock3} />
      </div>
      <div className="panel p-4">
        <div className="table-wrap">
          <table>
            <thead><tr><th>الموظف</th><th>الفرع</th><th>الوظيفة</th><th>الراتب</th><th>التقييم</th><th>النسبة</th><th>الحافز المقترح</th><th>الاعتماد</th><th>التفاصيل</th></tr></thead>
            <tbody>
              {data.map((x) => (
                <tr key={`${x.id}-${x.evaluation?.id}`}>
                  <td className="font-bold">{x.name}</td><td>{x.branch}</td><td>{x.job}</td><td>{money(x.salary)}</td>
                  <td><Status>{classify(x.total)}</Status> {x.total}%</td><td>{x.rate * 100}%</td><td className="font-bold text-brand-700">{money(x.amount)}</td>
                  <td>
                    <select value={x.approval} onChange={(e) => setEvaluations((list) => list.map((ev) => ev.id === x.evaluation.id ? { ...ev, status: e.target.value } : ev))} className="field !h-9">
                      <option>قيد المراجعة</option><option>معتمد</option><option>مرفوض</option>
                    </select>
                  </td>
                  <td><button onClick={() => setDetails(x)} className="btn-secondary !h-9"><Eye size={15} /> عرض</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {details && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel w-full max-w-2xl p-6">
            <div className="mb-5 flex items-center"><h3 className="text-lg font-extrabold">تفاصيل استحقاق الحافز</h3><button onClick={() => setDetails(null)} className="mr-auto"><X /></button></div>
            <div className="grid gap-3 md:grid-cols-2">
              <Info t="الموظف" v={details.name} /><Info t="الفرع" v={details.branch} /><Info t="الوظيفة" v={details.job} /><Info t="الراتب" v={money(details.salary)} />
              <Info t="نتيجة التقييم" v={`${details.total}% - ${classify(details.total)}`} /><Info t="نسبة الحافز" v={`${details.rate * 100}%`} />
              <Info t="معادلة الحافز" v="الراتب أ— نسبة الحافز أ— نسبة التقييم" /><Info t="قيمة الحافز" v={money(details.amount)} />
              <Info t="الشهر" v={details.evaluation?.month || ""} /><Info t="حالة الاعتماد" v={details.approval} />
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">ملاحظات التقييم: {details.evaluation?.notes || "لا توجد ملاحظات"}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionsMatrix({ settings, setSettings }) {
  const roles = settings.permissions || defaultSettings.permissions;
  const roleNames = roles.map((r) => r.name);
  const [role, setRole] = useState(roleNames[0] || "");
  const actions = [
    ["view", "عرض"],
    ["add", "إضافة"],
    ["edit", "تعديل"],
    ["delete", "حذف"],
  ];
  const current = settings.rolePermissions?.[role] || {};
  const setPermission = (pageId, action, checked) =>
    setSettings({
      ...settings,
      rolePermissions: {
        ...(settings.rolePermissions || {}),
        [role]: {
          ...current,
          [pageId]: { ...(current[pageId] || {}), [action]: checked },
        },
      },
    });
  const selectAll = (checked) =>
    setSettings({
      ...settings,
      rolePermissions: {
        ...(settings.rolePermissions || {}),
        [role]: Object.fromEntries(
          navItems.map(([id]) => [
            id,
            Object.fromEntries(actions.map(([action]) => [action, checked])),
          ]),
        ),
      },
    });
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-[260px]">
          <Label t="اختيار الوظيفة / الدور">
            <select value={role} onChange={(e) => setRole(e.target.value)} className="field mt-2">
              {roleNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Label>
        </div>
        <button onClick={() => selectAll(true)} className="btn-primary">
          <BadgeCheck size={16} /> تحديد الكل
        </button>
        <button onClick={() => selectAll(false)} className="btn-secondary">
          <X size={16} /> إلغاء التحديد
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200">
        <div className="grid grid-cols-[1.4fr_repeat(4,.55fr)] gap-2 border-b bg-slate-50 p-3 text-sm font-extrabold text-slate-600">
          <span>القائمة / الصفحة</span>
          {actions.map(([, label]) => (
            <span key={label} className="text-center">{label}</span>
          ))}
        </div>
        <div className="divide-y">
          {navItems.map(([id, label]) => (
            <div key={id} className="grid grid-cols-[1.4fr_repeat(4,.55fr)] items-center gap-2 p-3">
              <div className="flex items-center gap-2">
                <ChevronLeft size={16} className="text-slate-400" />
                <b className="text-sm">{label}</b>
              </div>
              {actions.map(([action]) => (
                <label key={`${id}-${action}`} className="text-center">
                  <input
                    type="checkbox"
                    checked={Boolean(current[id]?.[action])}
                    onChange={(e) => setPermission(id, action, e.target.checked)}
                    className="h-4 w-4 accent-red-800"
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
        تم حفظ الصلاحيات كمصفوفة تفصيلية قابلة للربط لاحقًا بمنع الأزرار والصفحات حسب الدور.
      </p>
    </div>
  );
}

function ProductivityComparison({ employees, indicators }) {
  const [range, setRange] = useState({
    aFrom: "2026-06-01",
    aTo: "2026-06-15",
    bFrom: "2026-06-16",
    bTo: "2026-06-30",
    scope: "employee",
  });
  const groups = range.scope === "branch" ? branches : employees.slice(0, 8).map((e) => e.name);
  const rows = groups.map((name, index) => {
    const a = Math.round(55 + ((index * 13) % 38));
    const b = Math.round(50 + ((index * 17 + 9) % 45));
    const change = a ? Math.round(((b - a) / a) * 100) : 0;
    return { name, period_a: a, period_b: b, change };
  });
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <h3 className="w-full text-lg font-extrabold">مقارنة الإنتاجية بين فترتين</h3>
        <Label t="الفترة أ من"><input type="date" value={range.aFrom} onChange={(e) => setRange({ ...range, aFrom: e.target.value })} className="field mt-2" /></Label>
        <Label t="الفترة أ إلى"><input type="date" value={range.aTo} onChange={(e) => setRange({ ...range, aTo: e.target.value })} className="field mt-2" /></Label>
        <Label t="الفترة ب من"><input type="date" value={range.bFrom} onChange={(e) => setRange({ ...range, bFrom: e.target.value })} className="field mt-2" /></Label>
        <Label t="الفترة ب إلى"><input type="date" value={range.bTo} onChange={(e) => setRange({ ...range, bTo: e.target.value })} className="field mt-2" /></Label>
        <Label t="نطاق المقارنة"><select value={range.scope} onChange={(e) => setRange({ ...range, scope: e.target.value })} className="field mt-2"><option value="employee">الموظف</option><option value="branch">الفرع</option></select></Label>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{range.scope === "branch" ? "الفرع" : "الموظف"}</th><th>الفترة أ</th><th>الفترة ب</th><th>نسبة التغير</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="font-bold">{r.name}</td>
                  <td>{r.period_a}</td>
                  <td>{r.period_b}</td>
                  <td className={r.change >= 0 ? "font-bold text-emerald-600" : "font-bold text-red-600"}>{r.change}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="period_a" fill="#94a3b8" radius={[6, 6, 0, 0]} />
            <Bar dataKey="period_b" fill="#7f1d1d" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const xmlEscape = (value = "") =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const crc32 = (input) => {
  const table = crc32.table || (crc32.table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  }));
  const bytes = new TextEncoder().encode(input);
  let crc = -1;
  for (const b of bytes) crc = (crc >>> 8) ^ table[(crc ^ b) & 255];
  return (crc ^ -1) >>> 0;
};
const u16 = (n) => [n & 255, (n >>> 8) & 255];
const u32 = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
function makeZip(files) {
  const encoder = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  files.forEach(({ name, content }) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(content);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameBytes.length), ...u16(0),
      ...nameBytes, ...data,
    ]);
    chunks.push(local);
    central.push({ nameBytes, crc, size: data.length, offset });
    offset += local.length;
  });
  const centralStart = offset;
  central.forEach((f) => {
    const c = new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(f.crc), ...u32(f.size), ...u32(f.size), ...u16(f.nameBytes.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(f.offset), ...f.nameBytes,
    ]);
    chunks.push(c);
    offset += c.length;
  });
  chunks.push(new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(central.length), ...u16(central.length), ...u32(offset - centralStart), ...u32(centralStart), ...u16(0)]));
  return new Blob(chunks, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
function exportDocx(title, rows) {
  const tableRows = rows.map((r) => {
    const e = r.employee || r;
    return [e.name || r.name || "", e.branch || r.branch || "", e.job || r.job || "", r.month || "", r.total || r.amount || 0]
      .map((v) => `<w:tc><w:p><w:r><w:t>${xmlEscape(v)}</w:t></w:r></w:p></w:tc>`)
      .join("");
  }).map((cells) => `<w:tr>${cells}</w:tr>`).join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${xmlEscape(title)}</w:t></w:r></w:p><w:tbl>${tableRows}</w:tbl></w:body></w:document>`;
  const blob = makeZip([
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
    { name: "word/document.xml", content: documentXml },
  ]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

function Label({ t, children }) {
  return (
    <label className="block text-sm font-bold">
      {t}
      {children}
    </label>
  );
}
function PageHead({ title, desc, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-extrabold">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{desc}</p>
      </div>
      {action}
    </div>
  );
}
function Mini({ label, value, I }) {
  return (
    <div className="panel flex items-center gap-4 p-5">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <I />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <b className="text-xl">{value}</b>
      </div>
    </div>
  );
}
function Info({ t, v }) {
  return (
    <div>
      <span className="text-slate-400">{t}</span>
      <p className="mt-1 font-bold">{v}</p>
    </div>
  );
}
function exportExcel(data, name) {
  const ws = XLSX.utils.json_to_sheet(data),
    wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "البيانات");
  XLSX.writeFile(wb, `${name}.xlsx`);
}
const employeeImportHeaderMap = {
  "رقم الموظف": "id",
  employee_id: "id",
  id: "id",
  "اسم الموظف": "name",
  employee_name: "name",
  name: "name",
  "الفرع": "branch",
  branch: "branch",
  "الوظيفة": "job",
  job: "job",
  "تاريخ التعيين": "hire_date",
  hire_date: "hire_date",
  hiredate: "hire_date",
  hireDate: "hire_date",
  "الراتب": "salary",
  salary: "salary",
  "رقم الهاتف": "phone",
  phone: "phone",
  "الحالة": "status",
  status: "status",
  "المدير المباشر": "manager",
  manager: "manager",
};
const normalizeEmployeeImportKey = (key) => String(key || "").trim().replace(/\s+/g, " ");
const normalizeEmployeeImportValue = (value) => {
  if (value === undefined || value === null) return "";
  return typeof value === "string" ? value.trim() : value;
};
const normalizeEmployeeHireDate = (value) => {
  const cleaned = normalizeEmployeeImportValue(value);
  if (!cleaned) return "";
  if (cleaned instanceof Date && !Number.isNaN(cleaned.getTime())) return cleaned.toISOString().slice(0, 10);
  if (typeof cleaned === "number") return XLSX.SSF.format("yyyy-mm-dd", cleaned);
  return String(cleaned);
};
function normalizeEmployeeImportRow(row) {
  const normalized = {
    id: "",
    name: "",
    branch: "",
    job: "",
    hire_date: "",
    salary: 0,
    phone: "",
    status: "نشط",
    manager: "",
  };
  Object.entries(row || {}).forEach(([key, value]) => {
    const cleanKey = normalizeEmployeeImportKey(key);
    const mappedKey = employeeImportHeaderMap[cleanKey] || employeeImportHeaderMap[cleanKey.toLowerCase()];
    if (!mappedKey) return;
    const cleanedValue = normalizeEmployeeImportValue(value);
    if (cleanedValue === "") return;
    if (mappedKey === "hire_date") normalized.hire_date = normalizeEmployeeHireDate(cleanedValue);
    else if (mappedKey === "salary") normalized.salary = Number(cleanedValue || 0);
    else normalized[mappedKey] = String(cleanedValue);
  });
  normalized.salary = Number.isFinite(normalized.salary) ? normalized.salary : 0;
  return normalized;
}
function importEmployees(event, setEmployees) {
  const f = event.target.files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = async (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: "array" });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      const invalidRows = [];
      const normalizedRows = rows
        .map((row, index) => ({ row: normalizeEmployeeImportRow(row), index: index + 2 }))
        .filter(({ row, index }) => {
          if (!row.id || !row.name) {
            invalidRows.push(index);
            return false;
          }
          return true;
        })
        .map(({ row }) => row);
      if (invalidRows.length) {
        alert(`لم يتم استيراد بعض الصفوف لأن رقم الموظف واسم الموظف مطلوبان.\nالصفوف غير الصالحة: ${invalidRows.join(", ")}`);
      }
      if (!normalizedRows.length) return;
      const dbRows = normalizedRows.map(normalizeEmployeeForDb).filter((row) => row.id && row.name);
      const { data, error } = await supabase.from("employees").upsert(dbRows, { onConflict: "id" }).select();
      if (error) {
        console.error("Supabase employees load/save error:", error);
        alert(error.message);
        return;
      }
      const importedEmployees = (data || []).map((row) => ({
        id: row.id,
        name: row.name || "",
        branch: row.branch || "",
        job: row.job || "",
        hireDate: row.hire_date || "",
        salary: Number(row.salary || 0),
        phone: row.phone || "",
        status: row.status || "نشط",
        manager: row.manager || "",
      }));
      setEmployees((list) => {
        const byId = new Map(list.map((employee) => [employee.id, employee]));
        importedEmployees.forEach((employee) => byId.set(employee.id, employee));
        return Array.from(byId.values());
      });
      alert(`تم استيراد ${importedEmployees.length} موظف/موظفة بنجاح`);
    } catch (error) {
      console.error("Supabase employees load/save error:", error);
      alert(error.message || "تعذر استيراد ملف الموظفين");
    } finally {
      event.target.value = "";
    }
  };
  r.readAsArrayBuffer(f);
}


