import { useEffect, useMemo, useState } from "react";
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
import { performanceCriteriaService, scoringTypes, defaultJobKpis } from "./services/performanceCriteria";
import { kpiCalculationService } from "./services/kpiCalculation";
import { aiAssistantService } from "./services/aiAssistant";
import { treePermissionsService, permissionActions, dataScopes, departmentOptions, flattenPermissionTree, normalizeTreePermission } from "./services/treePermissions";
import { recruitmentService, recruitmentTabs, generateWelcomeMessage } from "./services/recruitment";
import { generateRecruitmentReports } from "./services/recruitmentReports";
import { backupService } from "./services/backup";
import { companiesService } from "./services/companies";
import { clearTenantSession, getCurrentCompany, getCurrentUser, loadTenantSession, platformSuperAdminRole, setTenantSession } from "./services/tenant";
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
  hr_training: Star,
  hr_approvals: BadgeCheck,
  hr_org_chart: Building2,
  hr_settings_full: Settings,
  hr_financial_setup: CircleDollarSign,
  hr_templates_full: ClipboardList,
};
const fullHrNavItems = [
  ["hr_home", "ط§ظ„ط±ط¦ظٹط³ظٹط©"],
  ["hr_employees_full", "ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط¸ظپظٹظ†"],
  ["hr_reports_full", "ظ‚ط³ظ… ط§ظ„طھظ‚ط§ط±ظٹط±"],
  ["hr_requests", "ط§ظ„ط·ظ„ط¨ط§طھ"],
  ["hr_performance_full", "ظ‚ظٹط§ط³ ط§ظ„ط£ط¯ط§ط،"],
  ["hr_incentives_full", "ط§ظ„ط­ظˆط§ظپط²"],
  ["hr_attendance_payroll", "ط­ط³ط§ط¨ ط§ظ„ط¯ظˆط§ظ…"],
  ["hr_salary", "ط­ط³ط§ط¨ ط§ظ„ط±ط§طھط¨"],
  ["hr_disciplinary", "ط§ظ„ظ…ط³ط§ط،ظ„ط§طھ ظˆط§ظ„ط¥ظ†ط°ط§ط±ط§طھ"],
  ["hr_recruitment_full", "ط§ظ„طھظˆط¸ظٹظپ"],
  ["hr_leaves", "ط§ظ„ط¥ط¬ط§ط²ط§طھ"],
  ["hr_complaints", "ط§ظ„ط´ظƒط§ظˆظ‰"],
  ["hr_circulars", "ط§ظ„طھط¹ط§ظ…ظٹظ…"],
  ["hr_termination", "ط¥ظ†ظ‡ط§ط، ط§ظ„ط®ط¯ظ…ط©"],
  ["hr_surveys", "ط§ظ„ط§ط³طھط¨ظٹط§ظ†ط§طھ"],
  ["hr_insurance", "ط§ظ„طھط£ظ…ظٹظ†ط§طھ"],
  ["hr_announcements", "ظ‚ط³ظ… ط§ظ„ط¥ط¹ظ„ط§ظ†ط§طھ"],
  ["hr_files", "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ„ظپط§طھ"],
  ["hr_training", "ط§ظ„طھط¯ط±ظٹط¨"],
  ["hr_approvals", "ط§ظ„ظ…ظˆط§ظپظ‚ط§طھ"],
  ["hr_org_chart", "ط§ظ„ظ‡ظٹظƒظ„ ط§ظ„طھظ†ط¸ظٹظ…ظٹ"],
  ["hr_settings_full", "ط¥ط¹ط¯ط§ط¯ط§طھ"],
  ["hr_financial_setup", "طھظ‡ظٹط¦ط© ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ط§ظ„ظٹط©"],
  ["hr_templates_full", "ط§ظ„ظ‚ظˆط§ظ„ط¨"],
];
const navItems = [
  ["companies_admin", "إدارة الشركات"],
  ...baseNavItems.slice(0, -2),
  ["guarantees", "ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†"],
  ["overtime", "ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ"],
  ["shifts", "ط´ظپطھط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†"],
  ["inventory", "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط®ط²ظˆظ†"],
  ["daily_operations", "ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط©"],
  ["performance_criteria", "ظ…ط¹ط§ظٹظٹط± ط§ظ„ط£ط¯ط§ط،"],
  ["performance_kpi_scores", "ط¯ط±ط¬ط§طھ KPI"],
  ["users_permissions", "ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ† ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ"],
  ["recruitment", "ط·ظ„ط¨ط§طھ ط§ظ„طھظˆط¸ظٹظپ"],
  ["reports_center", "ظ…ط±ظƒط² ط§ظ„طھظ‚ط§ط±ظٹط±"],
  ["audit_logs", "ط³ط¬ظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ"],
  ...fullHrNavItems,
  ...baseNavItems.slice(-2),
];
const nf = new Intl.NumberFormat("ar-SA"),
  money = (n) => `${nf.format(Math.round(n || 0))} ط±.ط³`,
  classify = (n) =>
    n >= 90
      ? "ظ…ظ…طھط§ط²"
      : n >= 80
        ? "ط¬ظٹط¯ ط¬ط¯ظ‹ط§"
        : n >= 70
          ? "ط¬ظٹط¯"
          : n >= 60
            ? "ظ…ظ‚ط¨ظˆظ„"
            : "ط¶ط¹ظٹظپ";
const weights = [15, 15, 10, 10, 10, 10, 10, 10, 5, 5];
const defaultSettings = {
  branches: [...branches],
  jobs: [...jobs],
  criteria: [...criteria],
  currencies: [
    "ط§ظ„ط±ظٹط§ظ„ ط§ظ„ط³ط¹ظˆط¯ظٹ (SAR)",
    "ط§ظ„ط¯ظˆظ„ط§ط± ط§ظ„ط£ظ…ط±ظٹظƒظٹ (USD)",
    "ط§ظ„ظٹظˆط±ظˆ (EUR)",
    "ط§ظ„ط¯ط±ظ‡ظ… ط§ظ„ط¥ظ…ط§ط±ط§طھظٹ (AED)",
  ],
  permissions: [
    { name: "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…", description: "طھط­ظƒظ… ظƒط§ظ…ظ„ ظپظٹ ط¬ظ…ظٹط¹ ط£ط¬ط²ط§ط، ط§ظ„ظ†ط¸ط§ظ…" },
    {
      name: "ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©",
      description: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظˆط¸ظپظٹظ† ظˆط§ظ„طھظ‚ظٹظٹظ…ط§طھ ظˆط§ظ„طھظ‚ط§ط±ظٹط±",
    },
    { name: "ظ…ط¯ظٹط± ط§ظ„ظپط±ط¹", description: "طھظ‚ظٹظٹظ… ظ…ظˆط¸ظپظٹ ط§ظ„ظپط±ط¹ ظˆظ…طھط§ط¨ط¹ط© ط§ظ„ط§ظ†ط¶ط¨ط§ط·" },
    { name: "ط§ظ„ظ…ظˆط¸ظپ", description: "ط¹ط±ط¶ ط§ظ„طھظ‚ظٹظٹظ… ظˆطھظ‚ط¯ظٹظ… ط§ظ„ط§ط¹طھط±ط§ط¶" },
    { name: "ط§ظ„ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ„ظٹط§", description: "ط¹ط±ط¶ ط§ظ„طھظ‚ط§ط±ظٹط± ظˆط§ط¹طھظ…ط§ط¯ ط§ظ„ط­ظˆط§ظپط²" },
  ],
  users: [
    {
      name: "ظ…ط­ظ…ط¯ ط§ظ„ط¹طھظٹط¨ظٹ",
      username: "admin",
      password: "",
      role: "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…",
      employeeId: "",
    },
    {
      name: "ط£ط­ظ…ط¯ ظ…ط­ظ…ط¯ ط§ظ„ط³ط§ظ„ظ…",
      username: "employee",
      password: "",
      role: "ط§ظ„ظ…ظˆط¸ظپ",
      employeeId: "EMP-001",
    },
  ],
  manager: { name: "ظ…ط­ظ…ط¯ ط§ظ„ط¹طھظٹط¨ظٹ", username: "admin", role: "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…" },
};
const colors = {
  "ظ…ظ…طھط§ط²": "bg-emerald-50 text-emerald-700",
  "ط¬ظٹط¯ ط¬ط¯ظ‹ط§": "bg-blue-50 text-blue-700",
  "ط¬ظٹط¯": "bg-sky-50 text-sky-700",
  "ظ…ظ‚ط¨ظˆظ„": "bg-amber-50 text-amber-700",
  "ط¶ط¹ظٹظپ": "bg-red-50 text-red-700",
  "ظ†ط´ط·": "bg-emerald-50 text-emerald-700",
  "ط¥ط¬ط§ط²ط©": "bg-amber-50 text-amber-700",
  "ظ…ظˆظ‚ظˆظپ": "bg-red-50 text-red-700",
  "ظ…ط¹طھظ…ط¯": "bg-emerald-50 text-emerald-700",
  "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©": "bg-amber-50 text-amber-700",
  "ظ…ط±ظپظˆط¶": "bg-red-50 text-red-700",
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
  words.some((word) => String(value).includes(word));
const defaultCriteriaForJob = (job = "") => {
  const isCounter = includesAny(job, ["ط¹ط¯ط§ط¯", "ط·آ¹ط·آ¯ط·آ§ط·آ¯"]);
  const isTech = includesAny(job, ["ط¯ط¹ظ… ظپظ†ظٹ", "ط·آ¯ط·آ¹ط¸â€¦ ط¸ظ¾ط¸â€ ط¸ظ¹"]);
  const isCustomer = includesAny(job, ["ط®ط¯ظ…ط© ط¹ظ…ظ„ط§ط،", "ط·آ®ط·آ¯ط¸â€¦ط·آ© ط·آ¹ط¸â€¦ط¸â€‍ط·آ§ط·طŒ"]);
  const isOutbound = includesAny(job, ["طµط§ط¯ط±"]);
  const isInbound = includesAny(job, ["ظˆط§ط±ط¯"]);
  const names = isCounter
    ? [
        "ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ط§ظ„ط؛ ط§ظ„ظ…ط¹ط¯ظˆط¯ط©",
        "ط¥ظ†طھط§ط¬ظٹط© ظپط¦ط© 200",
        "ط¥ظ†طھط§ط¬ظٹط© ظپط¦ط© 500",
        "ط¥ظ†طھط§ط¬ظٹط© ظپط¦ط© 1000",
        "ط¯ظ‚ط© ظپط±ط² ط§ظ„ظ†ظ‚ط¯",
        "ظƒط´ظپ ط§ظ„ط¹ظ…ظ„ط§طھ ط§ظ„طھط§ظ„ظپط© ط£ظˆ ط§ظ„ظ…ط´ط¨ظˆظ‡ط©",
        "ط³ط±ط¹ط© ط§ظ„طھط³ظ„ظٹظ… ظˆط§ظ„ط§ط³طھظ„ط§ظ…",
        "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط¥ط¬ط±ط§ط،ط§طھ ط§ظ„ط®ط²ظٹظ†ط©",
        "طھطµظپظٹط± ط§ظ„ط¹ظ‡ط¯ط© ط¯ظˆظ† ظپط±ظˆظ‚ط§طھ",
        "ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ",
      ]
    : isTech
      ? [
          "ط³ط±ط¹ط© ط¥ط؛ظ„ط§ظ‚ ط§ظ„ط¨ظ„ط§ط؛ط§طھ",
          "ط¬ظˆط¯ط© ط§ظ„ط­ظ„ظˆظ„ ط§ظ„ظپظ†ظٹط©",
          "ط§ط³طھظ‚ط±ط§ط± ط§ظ„ط£ظ†ط¸ظ…ط© ظˆط§ظ„ط£ط¬ظ‡ط²ط©",
          "طھظˆط«ظٹظ‚ ط§ظ„ط¨ظ„ط§ط؛ط§طھ",
          "ط¯ط¹ظ… ط§ظ„ظپط±ظˆط¹ ط¹ظ† ط¨ط¹ط¯",
          "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط£ظˆظ„ظˆظٹط© ط§ظ„ط¨ظ„ط§ط؛ط§طھ",
          "ط­ظ…ط§ظٹط© ط§ظ„ط¨ظٹط§ظ†ط§طھ",
          "ط­ظ„ ط§ظ„ظ…ط´ظƒظ„ط§طھ ط§ظ„ظ…طھظƒط±ط±ط©",
          "ط§ظ„طھط¹ط§ظˆظ† ظ…ط¹ ط§ظ„ظپط±ظٹظ‚",
          "ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ",
        ]
      : isCustomer && isOutbound
        ? [
            "ط³ط±ط¹ط© طھظ†ظپظٹط° ط§ظ„ط­ظˆط§ظ„ط§طھ ط§ظ„طµط§ط¯ط±ط©",
            "ط¯ظ‚ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھظپظٹط¯",
            "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط­ط¯ظˆط¯ ظˆط¥ط¬ط±ط§ط،ط§طھ ط§ظ„طھط­ظˆظٹظ„",
            "ط¬ظˆط¯ط© ط§ظ„طھظˆط§طµظ„ ظ…ط¹ ط§ظ„ط¹ظ…ظٹظ„",
            "ظ†ط³ط¨ط© ط¥ظ†ط¬ط§ط² ط·ظ„ط¨ط§طھ ط§ظ„طµط§ط¯ط±",
            "ط®ظپط¶ ط£ط®ط·ط§ط، ط§ظ„ط¥ط±ط³ط§ظ„",
            "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط¥ط¬ط±ط§ط،ط§طھ ط§ظ„ط§ظ…طھط«ط§ظ„",
            "ط§ظ„طھط¹ط§ظˆظ† ظ…ط¹ ط§ظ„ظپط±ظٹظ‚",
            "طھط­ظ…ظ„ ط¶ط؛ط· ط§ظ„ط¹ظ…ظ„",
            "ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ",
          ]
        : isCustomer && isInbound
          ? [
              "ط³ط±ط¹ط© ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط­ظˆط§ظ„ط§طھ ط§ظ„ظˆط§ط±ط¯ط©",
              "ط¯ظ‚ط© ظ…ط·ط§ط¨ظ‚ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھظ„ظ…",
              "ط¬ظˆط¯ط© ط®ط¯ظ…ط© ط§ظ„ط¹ظ…ظٹظ„ ط¹ظ†ط¯ ط§ظ„طµط±ظپ",
              "ظ†ط³ط¨ط© ط¥ظ†ط¬ط§ط² ط·ظ„ط¨ط§طھ ط§ظ„ظˆط§ط±ط¯",
              "ط®ظپط¶ ط´ظƒط§ظˆظ‰ ط§ظ„ط¹ظ…ظ„ط§ط،",
              "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط¥ط¬ط±ط§ط،ط§طھ ط§ظ„طھط­ظ‚ظ‚",
              "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط¥ط¬ط±ط§ط،ط§طھ ط§ظ„ط§ظ…طھط«ط§ظ„",
              "ط§ظ„طھط¹ط§ظˆظ† ظ…ط¹ ط§ظ„ظپط±ظٹظ‚",
              "طھط­ظ…ظ„ ط¶ط؛ط· ط§ظ„ط¹ظ…ظ„",
              "ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ",
            ]
          : isCustomer
            ? [
                "ط¬ظˆط¯ط© ط§ظ„ط±ط¯ ط¹ظ„ظ‰ ط§ظ„ط¹ظ…ظ„ط§ط،",
                "ط³ط±ط¹ط© طھظ†ظپظٹط° ط§ظ„ط­ظˆط§ظ„ط§طھ",
                "ط¯ظ‚ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„",
                "ظ…ط¹ط§ظ„ط¬ط© ط·ظ„ط¨ط§طھ ط§ظ„ظˆط§طھط³",
                "ظ†ط³ط¨ط© ط±ط¶ط§ ط§ظ„ط¹ظ…ظ„ط§ط،",
                "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط¥ط¬ط±ط§ط،ط§طھ ط§ظ„ط§ظ…طھط«ط§ظ„",
                "ط®ظپط¶ ط§ظ„ط´ظƒط§ظˆظ‰",
                "ط§ظ„طھط¹ط§ظˆظ† ظ…ط¹ ط§ظ„ظپط±ظٹظ‚",
                "طھط­ظ…ظ„ ط¶ط؛ط· ط§ظ„ط¹ظ…ظ„",
                "ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ",
              ]
            : criteria;
  return makeCriteriaTemplate(names).map((item) =>
    isCounter
      ? {
          ...item,
          subWeights: {
            cash200: item.name.includes("200") ? item.weight : 0,
            cash500: item.name.includes("500") ? item.weight : 0,
            cash1000: item.name.includes("1000") ? item.weight : 0,
          },
        }
      : item,
  );
};
const buildDefaultJobCriteria = () =>
  Object.fromEntries(
    jobs.map((job) => {
      const custom = job.includes("ط¹ط¯ط§ط¯")
        ? [
            "ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ط§ظ„ط؛ ط§ظ„ظ…ط¹ط¯ظˆط¯ط©",
            "ط¯ظ‚ط© ظپط±ط² ظپط¦ط© 200",
            "ط¯ظ‚ط© ظپط±ط² ظپط¦ط© 500",
            "ط¯ظ‚ط© ظپط±ط² ظپط¦ط© 1000",
            "ظƒط´ظپ ط§ظ„ط¹ظ…ظ„ط§طھ ط§ظ„طھط§ظ„ظپط© ط£ظˆ ط§ظ„ظ…ط´ط¨ظˆظ‡ط©",
            "ط³ط±ط¹ط© ط§ظ„طھط³ظ„ظٹظ… ظˆط§ظ„ط§ط³طھظ„ط§ظ…",
            "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط¥ط¬ط±ط§ط،ط§طھ ط§ظ„ط®ط²ظٹظ†ط©",
            "ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ",
            "ط§ظ„طھط¹ط§ظˆظ† ظ…ط¹ ط§ظ„ظپط±ظٹظ‚",
            "طھطµظپظٹط± ط§ظ„ط¹ظ‡ط¯ط© ط¯ظˆظ† ظپط±ظˆظ‚ط§طھ",
          ]
        : job.includes("ط¯ط¹ظ… ظپظ†ظٹ")
          ? [
              "ط³ط±ط¹ط© ط¥ط؛ظ„ط§ظ‚ ط§ظ„ط¨ظ„ط§ط؛ط§طھ",
              "ط¬ظˆط¯ط© ط§ظ„ط­ظ„ظˆظ„ ط§ظ„ظپظ†ظٹط©",
              "ط§ط³طھظ‚ط±ط§ط± ط§ظ„ط£ظ†ط¸ظ…ط© ظˆط§ظ„ط£ط¬ظ‡ط²ط©",
              "طھظˆط«ظٹظ‚ ط§ظ„ط¨ظ„ط§ط؛ط§طھ",
              "ط¯ط¹ظ… ط§ظ„ظپط±ظˆط¹ ط¹ظ† ط¨ط¹ط¯",
              "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط£ظˆظ„ظˆظٹط© ط§ظ„ط¨ظ„ط§ط؛ط§طھ",
              "ط­ظ…ط§ظٹط© ط§ظ„ط¨ظٹط§ظ†ط§طھ",
              "ط§ظ„طھط¹ط§ظˆظ† ظ…ط¹ ط§ظ„ظپط±ظٹظ‚",
              "ط­ظ„ ط§ظ„ظ…ط´ظƒظ„ط§طھ ط§ظ„ظ…طھظƒط±ط±ط©",
              "ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ",
            ]
          : job.includes("ط®ط¯ظ…ط© ط¹ظ…ظ„ط§ط،")
            ? [
                "ط¬ظˆط¯ط© ط§ظ„ط±ط¯ ط¹ظ„ظ‰ ط§ظ„ط¹ظ…ظ„ط§ط،",
                "ط³ط±ط¹ط© طھظ†ظپظٹط° ط§ظ„ط­ظˆط§ظ„ط§طھ",
                "ط¯ظ‚ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„",
                "ظ…ط¹ط§ظ„ط¬ط© ط·ظ„ط¨ط§طھ ط§ظ„ظˆط§طھط³",
                "ظ†ط³ط¨ط© ط±ط¶ط§ ط§ظ„ط¹ظ…ظ„ط§ط،",
                "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط¥ط¬ط±ط§ط،ط§طھ ط§ظ„ط§ظ…طھط«ط§ظ„",
                "ط®ظپط¶ ط§ظ„ط´ظƒط§ظˆظ‰",
                "ط§ظ„طھط¹ط§ظˆظ† ظ…ط¹ ط§ظ„ظپط±ظٹظ‚",
                "طھط­ظ…ظ„ ط¶ط؛ط· ط§ظ„ط¹ظ…ظ„",
                "ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ",
              ]
            : criteria;
      return [job, makeCriteriaTemplate(custom)];
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
  { key: "receive", label: "ط¹ط¯ط¯ ط¹ظ…ظ„ظٹط§طھ ظ‚ط¨ط¶ ط§ظ„ط­ظˆط§ظ„ط§طھ", type: "positive", weight: 0.2 },
  { key: "pay", label: "ط¹ط¯ط¯ ط¹ظ…ظ„ظٹط§طھ طµط±ظپ ط§ظ„ط­ظˆط§ظ„ط§طھ", type: "positive", weight: 0.2 },
  { key: "sell", label: "ط¹ط¯ط¯ ط¹ظ…ظ„ظٹط§طھ ط¨ظٹط¹ ط§ظ„ط¹ظ…ظ„ط§طھ", type: "positive", weight: 0.25 },
  { key: "buy", label: "ط¹ط¯ط¯ ط¹ظ…ظ„ظٹط§طھ ط´ط±ط§ط، ط§ظ„ط¹ظ…ظ„ط§طھ", type: "positive", weight: 0.25 },
  { key: "errors", label: "ط¹ط¯ط¯ ط§ظ„ط£ط®ط·ط§ط،", type: "negative", weight: 4 },
  { key: "complaints", label: "ط¹ط¯ط¯ ط´ظƒط§ظˆظ‰ ط§ظ„ط¹ظ…ظ„ط§ط،", type: "negative", weight: 5 },
  { key: "time", label: "ظ…طھظˆط³ط· ظˆظ‚طھ ط§ظ„ط®ط¯ظ…ط©", type: "negative", weight: 1 },
];
const defaultDisciplineIndicators = [
  { key: "present", label: "ط£ظٹط§ظ… ط§ظ„ط­ط¶ظˆط±", type: "positive", weight: 1 },
  { key: "absent", label: "ط£ظٹط§ظ… ط§ظ„ط؛ظٹط§ط¨", type: "negative", weight: 7 },
  { key: "late", label: "ط§ظ„طھط£ط®ظٹط± ط¨ط§ظ„ط¯ظ‚ط§ط¦ظ‚", type: "negative", weight: 0.15 },
  { key: "early", label: "ط§ظ„ط§ظ†طµط±ط§ظپ ط§ظ„ظ…ط¨ظƒط±", type: "negative", weight: 3 },
  { key: "violations", label: "ط§ظ„ظ…ط®ط§ظ„ظپط§طھ", type: "negative", weight: 8 },
  { key: "penalties", label: "ط§ظ„ط¬ط²ط§ط،ط§طھ", type: "negative", weight: 10 },
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
  if (activeEvaluationReport && String(title).includes("ط¸â€¦ط¸ث†ط·آ¸ط¸ظ¾")) {
    title = activeEvaluationReport.title;
    body = activeEvaluationReport.body;
  }
  const w = window.open("", "_blank", "width=950,height=700");
  if (!w) return window.print();
  w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body{font-family:Tahoma,Arial,sans-serif;margin:32px;color:#172033;direction:rtl}
      h1,h2,h3{margin:0 0 12px}
      table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
      th,td{border:1px solid #d7dce3;padding:9px;text-align:right}
      th{background:#f3f4f6}
      .cert{min-height:520px;border:10px double #8a1538;border-radius:28px;padding:42px;text-align:center}
      .brand{color:#8a1538}.muted{color:#64748b}.big{font-size:34px;font-weight:900}
      @media print{button{display:none}}
    </style></head><body>${body}<script>window.onload=()=>{window.print();}</script></body></html>`);
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
function LoadingScreen({ message = "ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ..." }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50" dir="rtl">
      <div className="panel p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-700" />
        <b>{message}</b>
      </div>
    </div>
  );
}
const isAdminLikeRole = (role = "") =>
  ["ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…", "ط§ظ„ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ„ظٹط§", "ط¸â€¦ط·آ¯ط¸ظ¹ط·آ± ط·آ§ط¸â€‍ط¸â€ ط·آ¸ط·آ§ط¸â€¦", "ط·آ§ط¸â€‍ط·آ¥ط·آ¯ط·آ§ط·آ±ط·آ© ط·آ§ط¸â€‍ط·آ¹ط¸â€‍ط¸ظ¹ط·آ§", "ط·آ¸أ¢â‚¬آ¦ط·آ·ط¢آ¯ط·آ¸ط¸آ¹ط·آ·ط¢آ± ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ¸أ¢â‚¬آ ط·آ·ط¢آ¸ط·آ·ط¢آ§ط·آ¸أ¢â‚¬آ¦", "ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¥ط·آ·ط¢آ¯ط·آ·ط¢آ§ط·آ·ط¢آ±ط·آ·ط¢آ© ط·آ·ط¢آ§ط·آ¸أ¢â‚¬â€چط·آ·ط¢آ¹ط·آ¸أ¢â‚¬â€چط·آ¸ط¸آ¹ط·آ·ط¢آ§"].some((x) =>
    String(role).includes(x),
  );
const canByPermission = (permissions, role, pageKey, action = "can_view") => {
  if (isAdminLikeRole(role)) return true;
  if (!permissions?.length) return action === "can_view" ? false : true;
  const row = permissions.find((p) => p.role === role && p.page_key === pageKey);
  return row ? row[action] === true : action === "can_view" ? false : true;
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
  ai_assistant: ["ai_chat", "ai_reports_analysis"],
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
    [sidebar, setSidebar] = useState(false),
    [role, setRole] = useState(
      () => localStorage.getItem("ep_role") || "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…",
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
          const company = getCurrentCompany() || {
            company_id: user.company_id,
            company_code: user.company_code,
            company_name: user.company_name,
            logo_url: user.logo_url,
            primary_color: user.primary_color,
          };
          setTenantSession({ company, user });
          setCurrentCompany(company);
          setCurrentUserState(user);
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
          <h2 className="text-xl font-extrabold">طھط¹ط°ط± طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ Supabase</h2>
          <p className="mt-2 text-sm text-slate-500">{dataError}</p>
          <button onClick={() => location.reload()} className="btn-primary mt-5">ط¥ط¹ط§ط¯ط© ط§ظ„ظ…ط­ط§ظˆظ„ط©</button>
        </div>
      </div>
    );
  if (role === "ط§ظ„ظ…ظˆط¸ظپ")
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
	    roleMatrix = settings.rolePermissions?.[role] || {},
	    hasRoleMatrix = Object.keys(roleMatrix).length > 0,
	    canNode = (nodeKey, action = "can_view") => hasTreePermission(treeRolePermissions, role, nodeKey, action),
	    canPage = (pageKey, action = "can_view") => pageAllowedByTree(treeRolePermissions, role, pageKey, action) || canByPermission(appPermissions, role, pageKey, action),
	    visibleNavItems = navItems.filter(([id]) => {
        if (id === "companies_admin") return currentUser?.is_platform_admin === true || role === platformSuperAdminRole;
	      if (id === "dashboard") return hasAnyPermission(treeRolePermissions, role, dashboardPermissionNodes, "can_view");
	      if (treeRolePermissions.length) return pageAllowedByTree(treeRolePermissions, role, id, "can_view");
	      if (appPermissions.length) return canByPermission(appPermissions, role, id === "reports" ? "reports" : id, "can_view");
	      return hasRoleMatrix ? roleMatrix[id]?.view : isAdminLikeRole(role);
	    }),
	    firstAllowedPage = getFirstAllowedPageForUser({ ...currentUser, role }, treeRolePermissions, appPermissions, visibleNavItems),
	    activePage = visibleNavItems.some(([id]) => id === page) ? page : firstAllowedPage,
    title = navItems.find((x) => x[0] === activePage)?.[1],
    company = currentCompany || getCurrentCompany() || {},
    companyName = company.company_name || currentUser.company_name || "Pure Money",
    companyLogo = company.logo_url || currentUser.logo_url || "",
    manager = { ...(settings.manager || defaultSettings.manager), name: currentUser.name || currentUser.username || (settings.manager || defaultSettings.manager).name },
    initials = manager.name
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
	      can: (pageKey, action = "can_view") => canPage(pageKey, action),
	      canNode,
	    };
  if (visibleNavItems.length && activePage && activePage !== page) {
    setTimeout(() => setPage(activePage), 0);
  }
  if (permissionsLoading) return <LoadingScreen message="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„طµظ„ط§ط­ظٹط§طھ..." />;
  if (!visibleNavItems.length) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 p-5" dir="rtl"><div className="panel max-w-xl p-6 text-center"><ShieldCheck className="mx-auto mb-3 text-brand-700" /><h2 className="text-xl font-extrabold">ظ„ط§ طھظˆط¬ط¯ طµظ„ط§ط­ظٹط§طھ ظ…ظپط¹ظ„ط© ظ„ظ‡ط°ط§ ط§ظ„ظ…ط³طھط®ط¯ظ…</h2><button onClick={() => { localStorage.removeItem("ep_logged"); localStorage.removeItem("ep_role"); clearTenantSession(); setCurrentCompany(null); setCurrentUserState(null); setLogged(false); }} className="btn-primary mt-5">طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬</button></div></div>;
  }
  return (
    <div className="min-h-screen" dir="rtl">
      {sidebar && (
        <button
          onClick={() => setSidebar(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}
      <aside
        className={`no-print fixed inset-y-0 right-0 z-40 flex w-[270px] flex-col bg-[#171a21] text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-[86px] items-center gap-3 border-b border-white/10 px-6">
          <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-brand-700">
            {companyLogo ? <img src={companyLogo} alt={companyName} className="h-full w-full object-cover" /> : <Banknote />}
          </div>
          <div>
            <b>ظ†ط¸ط§ظ… طھظ‚ظٹظٹظ… ط§ظ„ظ…ظˆط¸ظپظٹظ†</b>
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
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
	          {visibleNavItems.map(([id, label]) => {
            const I = icons[id];
            return (
              <button
                key={id}
                onClick={() => {
                  setPage(id);
                  setSidebar(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${activePage === id ? "bg-brand-700 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
              >
                <I size={19} />
                {label}
                {activePage === id && <ChevronLeft className="mr-auto" size={16} />}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 font-bold">
              {initials}
            </div>
            <div>
              <b className="text-sm">{manager.name}</b>
              <p className="text-[11px] text-slate-400">{role}</p>
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
            <LogOut size={17} /> طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬
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
              ظ†ط¸ط±ط© ط´ط§ظ…ظ„ط© طھط³ط§ط¹ط¯ظƒ ط¹ظ„ظ‰ ط§طھط®ط§ط° ظ‚ط±ط§ط±ط§طھ ط£ظپط¶ظ„
            </p>
          </div>
          <div className="mr-auto flex items-center gap-3">
            <label className="hidden h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 md:flex">
              <Search size={17} />
              <input
                className="w-40 bg-transparent text-sm outline-none"
                placeholder="ط¨ط­ط« ط³ط±ظٹط¹..."
              />
            </label>
		            <div className="relative">
	              <button onClick={() => setNotificationsOpen((v) => !v)} className="relative rounded-xl border p-2.5">
	                <Bell size={19} />
	                {notifications.some((n) => !n.is_read) && (
	                  <i className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-brand-700 px-1 text-[10px] font-bold text-white">
	                    {notifications.filter((n) => !n.is_read).length}
	                  </i>
	                )}
	              </button>
	              {notificationsOpen && (
	                <div className="absolute left-0 top-12 z-50 w-80 rounded-2xl border bg-white p-3 shadow-xl">
	                  <div className="mb-2 flex items-center"><b className="text-sm">ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ</b><span className="mr-auto text-xs text-slate-400">{notifications.length}</span></div>
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
	                    )) : <p className="p-4 text-center text-sm text-slate-400">ظ„ط§ طھظˆط¬ط¯ ط¥ط´ط¹ط§ط±ط§طھ</p>}
	                  </div>
	                </div>
	              )}
	            </div>
            <div className="hidden items-center gap-2 border-r pr-4 sm:flex">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">
                {initials}
              </div>
              <div>
                <b className="text-sm">{manager.name}</b>
                <p className="text-[11px] text-slate-500">{role}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-7">
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
	          {activePage === "daily_operations" && <DailyOperationsPage {...p} />}{" "}
	          {activePage === "performance_criteria" && <PerformanceCriteriaPage {...p} />}{" "}
	          {activePage === "performance_kpi_scores" && <KpiScoresPage {...p} />}{" "}
	          {activePage === "users_permissions" && <UsersPermissionsPage {...p} />}{" "}
	          {activePage === "recruitment" && <RecruitmentPage {...p} />}{" "}
	          {activePage === "reports_center" && <EnterpriseReportsCenter {...p} />}{" "}
	          {activePage === "audit_logs" && <AuditLogsPage {...p} />}{" "}
	          {activePage === "reports" && <EnhancedReports {...p} />}{" "}
	          {activePage === "settings" && <SettingsPage {...p} />}
          {fullHrNavItems.some(([id]) => id === activePage) && <HRModulePage pageKey={activePage} currentCompany={company} can={p.can} />}
        </main>
        <AIAssistantWidget currentUser={p.currentUser} page={activePage} />
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
    if (!companyCode.trim()) {
      setErr("يجب إدخال كود الشركة");
      return;
    }
    if (!u.trim() || !pw) {
      setErr("يرجى إدخال اسم المستخدم وكلمة المرور.");
      return;
    }
    setLoading(true);
    try {
      const user = await cloudLoginWithSupabase(u.trim(), pw, employeeNo.trim(), companyCode.trim());
      onLogin(user);
    } catch (error) {
      setErr(error.message || "طھط¹ط°ط± طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„. طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¨ظٹط§ظ†ط§طھ ظˆط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#111319] p-5">
      <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-700/20 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-800 to-[#3b1115] p-12 text-white md:flex">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10">
              <Banknote />
            </div>
            <b>ط´ط±ظƒط© ط§ظ„طµط±ط§ظپط© ظˆط§ظ„طھط­ظˆظٹظ„ط§طھ</b>
          </div>
          <div>
            <div className="mb-5 h-1 w-12 bg-white/30" />
            <h2 className="text-4xl font-extrabold leading-[1.35]">
              ظ†ط­ظˆ ط«ظ‚ط§ظپط© ط£ط¯ط§ط،
              <br />
              طھظƒط§ظپط¦ ط§ظ„طھظ…ظٹظ‘ط²
            </h2>
            <p className="mt-5 leading-7 text-red-100/75">
              ظ…ظ†طµط© ظ…ظˆط­ظ‘ط¯ط© ظ„ظ‚ظٹط§ط³ ط§ظ„ط£ط¯ط§ط، ظˆط±ط¨ط· ط§ظ„ط¥ظ†ط¬ط§ط² ط¨ط§ظ„ط­ظˆط§ظپط² ط¨ط´ظپط§ظپظٹط©.
            </p>
          </div>
          <div className="flex gap-2 text-xs text-red-100/60">
            <ShieldCheck size={17} /> ط¨ظٹط§ظ†ط§طھظƒ ظ…ط­ظپظˆط¸ط© ظˆط¢ظ…ظ†ط© ط¯ط§ط®ظ„ ط§ظ„ظ…طھطµظپط­
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 sm:p-14">
          <span className="text-sm font-bold text-brand-700">
            ظ…ط±ط­ط¨ظ‹ط§ ط¨ط¹ظˆط¯طھظƒ
          </span>
          <h1 className="mt-2 text-3xl font-extrabold">طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„</h1>
          <p className="mt-2 text-sm text-slate-500">
            ط£ط¯ط®ظ„ ط¨ظٹط§ظ†ط§طھظƒ ظ„ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…
          </p>
          <div className="mt-8 space-y-5">
            <Label t="كود الشركة">
              <input
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                autoComplete="organization"
                placeholder="PUREMONEY"
                className="field mt-2"
              />
            </Label>
            <Label t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…">
              <input
                value={u}
                onChange={(e) => setU(e.target.value)}
                autoComplete="username"
                placeholder="ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…"
                className="field mt-2"
              />
            </Label>
            <Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±">
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="current-password"
                placeholder="ط£ط¯ط®ظ„ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"
                className="field mt-2"
              />
            </Label>
            <Label t="ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط¸ظٹظپظٹ">
              <input
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
                autoComplete="off"
                placeholder="ط£ط¯ط®ظ„ ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط¸ظٹظپظٹ"
                className="field mt-2"
              />
            </Label>
          </div>
          {err && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {err}
            </p>
          )}
          <button disabled={loading} className="btn-primary mt-7 h-12 w-full disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "ط¬ط§ط±ظٹ ط§ظ„طھط­ظ‚ظ‚..." : "ط¯ط®ظˆظ„ ط¥ظ„ظ‰ ط§ظ„ظ†ط¸ط§ظ…"} <ArrowUpLeft size={18} />
          </button>
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

function HRModulePage({ pageKey, currentCompany }) {
  const title = fullHrNavItems.find(([id]) => id === pageKey)?.[1] || "وحدة الموارد البشرية";
  const tabs = hrModuleTabs[pageKey] || ["نظرة عامة"];
  const [tab, setTab] = useState(tabs[0]);
  const [q, setQ] = useState("");
  const [dialog, setDialog] = useState(null);
  const rows = tabs.map((name, index) => ({
    id: `${pageKey}-${index + 1}`,
    name,
    company: currentCompany?.company_name || "Pure Money",
    status: index % 3 === 0 ? "قيد المراجعة" : "نشط",
    owner: index % 2 === 0 ? "الموارد البشرية" : "مدير الفرع",
    date: new Date(Date.now() - index * 86400000).toISOString().slice(0, 10),
  })).filter((row) => !q || row.name.includes(q) || row.status.includes(q) || row.owner.includes(q));
  const stats = [
    ["إجمالي السجلات", rows.length],
    ["النشطة", rows.filter((r) => r.status === "نشط").length],
    ["قيد المراجعة", rows.filter((r) => r.status === "قيد المراجعة").length],
    ["الشركة", currentCompany?.company_name || "Pure Money"],
  ];
  const action = () => {
    console.error("HRMS UI placeholder error:", { pageKey, tab });
    alert(uiOnlyMessage);
  };
  return (
    <div className="space-y-5">
      <PageHead title={title} desc={`واجهة موارد بشرية متعددة الشركات - ${currentCompany?.company_name || "Pure Money"}`} action={<button onClick={() => setDialog({ name: "", status: "نشط" })} className="btn-primary"><Plus size={18} /> إضافة</button>} />
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(([label, value]) => <Mini key={label} label={label} value={value} I={BadgeCheck} />)}
      </div>
      <div className="panel flex flex-wrap gap-2 p-3">
        {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === item ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}
      </div>
      <div className="panel flex flex-wrap gap-3 p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} className="field min-w-[220px] flex-1" placeholder="بحث..." />
        <button onClick={() => exportExcel(rows, title)} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button>
        <button onClick={() => printDocument(title, rowsToReportHtml(title, rows, [{ key: "name", label: "البند" }, { key: "status", label: "الحالة" }, { key: "owner", label: "المسؤول" }, { key: "date", label: "التاريخ" }]))} className="btn-secondary"><Printer size={17} /> طباعة</button>
      </div>
      <div className="panel p-4">
        {rows.length ? <div className="table-wrap"><table><thead><tr><th>البند</th><th>الشركة</th><th>الحالة</th><th>المسؤول</th><th>التاريخ</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.company}</td><td><Status>{row.status}</Status></td><td>{row.owner}</td><td>{row.date}</td><td><button onClick={() => setDialog(row)} className="p-2 text-slate-600"><Eye size={16} /></button><button onClick={action} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={action} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div> : <div className="p-8 text-center text-sm text-slate-400">لا توجد بيانات للعرض</div>}
      </div>
      {dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={(e) => { e.preventDefault(); action(); setDialog(null); }} className="panel w-full max-w-2xl p-6"><DialogTitle title={`${title} - ${tab}`} close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-2"><Label t="الاسم"><input value={dialog.name || ""} onChange={(e) => setDialog({ ...dialog, name: e.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={dialog.status || "نشط"} onChange={(e) => setDialog({ ...dialog, status: e.target.value })} className="field mt-2"><option>نشط</option><option>قيد المراجعة</option><option>مغلق</option></select></Label><Label t="ملاحظات"><textarea className="field mt-2 !h-auto py-3" placeholder="سيتم ربط هذا النموذج بقاعدة البيانات لاحقًا" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}
    </div>
  );
}

function CompaniesAdminPage({ currentUser }) {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("الشركات");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const canManage = currentUser?.is_platform_admin === true || currentUser?.role === platformSuperAdminRole;
  const load = async () => {
    if (!canManage) return;
    setLoading(true);
    try {
      setRows(await companiesService.loadCompanies());
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [canManage]);
  if (!canManage) return <div className="panel p-6 text-center font-bold text-red-600">لا تملك صلاحية الوصول إلى بيانات هذه الشركة</div>;
  const save = async (e) => {
    e.preventDefault();
    try {
      const saved = dialog.company_id
        ? await companiesService.saveCompany(dialog)
        : await companiesService.createCompanyWithDefaults(dialog, { username: dialog.admin_username || "admin", password: dialog.admin_password || "123456", email: dialog.email });
      setRows((list) => list.some((x) => x.company_id === saved.company_id) ? list.map((x) => x.company_id === saved.company_id ? saved : x) : [saved, ...list]);
      setDialog(null);
    } catch (error) {
      alert(error.message);
    }
  };
  const tabs = ["الشركات", "اشتراكات الشركات", "مستخدمو الشركات", "نسخ احتياطية الشركات", "إعدادات المنصة"];
  return (
    <div className="space-y-5">
      <PageHead title="إدارة الشركات" desc="إدارة منصة SaaS متعددة الشركات والاشتراكات والمستخدمين" action={<button onClick={() => setDialog({ company_code: "", company_name: "", subscription_plan: "standard", subscription_status: "active", max_users: 25, max_branches: 5, primary_color: "#7f1d1d", is_active: true })} className="btn-primary"><Plus size={18} /> إضافة شركة</button>} />
      <div className="panel flex flex-wrap gap-2 p-3">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === item ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}</div>
      <div className="grid gap-4 md:grid-cols-4"><Mini label="عدد الشركات" value={rows.length} I={Building2} /><Mini label="النشطة" value={rows.filter((r) => r.is_active).length} I={BadgeCheck} /><Mini label="اشتراكات فعالة" value={rows.filter((r) => ["active", "trial"].includes(r.subscription_status)).length} I={Wallet} /><Mini label="المشرف" value={currentUser?.username || ""} I={UserRoundCog} /></div>
      <div className="panel p-4">
        {loading ? <p className="text-sm text-slate-400">جاري التحميل...</p> : <div className="table-wrap"><table><thead><tr><th>كود الشركة</th><th>اسم الشركة</th><th>الباقة</th><th>حالة الاشتراك</th><th>المستخدمون</th><th>الفروع</th><th>الحالة</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.company_id}><td>{row.company_code}</td><td>{row.company_name}</td><td>{row.subscription_plan}</td><td><Status>{row.subscription_status}</Status></td><td>{row.max_users}</td><td>{row.max_branches}</td><td><Status>{row.is_active ? "نشط" : "معطل"}</Status></td><td><button onClick={() => setDialog(row)} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => companiesService.deleteOrDeactivateCompany(row).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>}
      </div>
      {dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"><DialogTitle title="بيانات الشركة" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="اسم الشركة"><input required value={dialog.company_name || ""} onChange={(e) => setDialog({ ...dialog, company_name: e.target.value })} className="field mt-2" /></Label><Label t="كود الشركة"><input required value={dialog.company_code || ""} onChange={(e) => setDialog({ ...dialog, company_code: e.target.value.toUpperCase() })} className="field mt-2" /></Label><Label t="البريد"><input value={dialog.email || ""} onChange={(e) => setDialog({ ...dialog, email: e.target.value })} className="field mt-2" /></Label><Label t="الهاتف"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label><Label t="الباقة"><input value={dialog.subscription_plan || ""} onChange={(e) => setDialog({ ...dialog, subscription_plan: e.target.value })} className="field mt-2" /></Label><Label t="حالة الاشتراك"><select value={dialog.subscription_status || "active"} onChange={(e) => setDialog({ ...dialog, subscription_status: e.target.value })} className="field mt-2"><option value="active">active</option><option value="trial">trial</option><option value="inactive">inactive</option></select></Label><Label t="الحد الأقصى للمستخدمين"><input type="number" value={dialog.max_users || 0} onChange={(e) => setDialog({ ...dialog, max_users: e.target.value })} className="field mt-2" /></Label><Label t="الحد الأقصى للفروع"><input type="number" value={dialog.max_branches || 0} onChange={(e) => setDialog({ ...dialog, max_branches: e.target.value })} className="field mt-2" /></Label><Label t="رابط الشعار"><input value={dialog.logo_url || ""} onChange={(e) => setDialog({ ...dialog, logo_url: e.target.value })} className="field mt-2" /></Label><Label t="اللون الأساسي"><input type="color" value={dialog.primary_color || "#7f1d1d"} onChange={(e) => setDialog({ ...dialog, primary_color: e.target.value })} className="field mt-2" /></Label><Label t="الحالة"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">نشط</option><option value="false">معطل</option></select></Label><Label t="اسم مستخدم مدير الشركة"><input value={dialog.admin_username || "admin"} onChange={(e) => setDialog({ ...dialog, admin_username: e.target.value })} className="field mt-2" /></Label><Label t="كلمة مرور مدير الشركة"><input value={dialog.admin_password || "123456"} onChange={(e) => setDialog({ ...dialog, admin_password: e.target.value })} className="field mt-2" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}
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
          <h1 className="mt-4 text-xl font-extrabold">ط§ظ„ط­ط³ط§ط¨ ط؛ظٹط± ظ…ط±طھط¨ط· ط¨ظ…ظˆط¸ظپ</h1>
          <p className="mt-2 text-sm text-slate-500">
            ط§ط·ظ„ط¨ ظ…ظ† ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ… ط±ط¨ط· ط§ظ„ط­ط³ط§ط¨ ط¨ط±ظ‚ظ… ط§ظ„ظ…ظˆط¸ظپ.
          </p>
          <button onClick={onLogout} className="btn-primary mt-5">
            طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬
          </button>
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
          status: "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©",
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
          <h1 className="font-extrabold">ط¨ظˆط§ط¨ط© ط§ظ„ظ…ظˆط¸ظپ</h1>
          <p className="text-xs text-slate-500">ط¹ط±ط¶ ظپظ‚ط· â€” ظ„ط§ ظٹظ…ظƒظ† طھط¹ط¯ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ</p>
        </div>
        <button onClick={onLogout} className="btn-secondary mr-auto">
          <LogOut size={17} /> طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬
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
              {employee.id} â€¢ {employee.job} â€¢ {employee.branch}
            </p>
          </div>
          <Status>{employee.status}</Status>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Mini
            label="ط¢ط®ط± طھظ‚ظٹظٹظ…"
            value={latest ? `${latest.total}%` : "â€”"}
            I={Star}
          />
          <Mini
            label="طھطµظ†ظٹظپ ط§ظ„ط£ط¯ط§ط،"
            value={latest ? classify(latest.total) : "â€”"}
            I={BadgeCheck}
          />
          <Mini
            label="ط´ظ‡ط± ط§ظ„طھظ‚ظٹظٹظ…"
            value={latest?.month || "â€”"}
            I={CalendarCheck}
          />
        </div>
        <div className="panel p-6">
          <h3 className="font-extrabold">ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„طھظ‚ظٹظٹظ…</h3>
          <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            {latest?.notes || "ظ„ط§ طھظˆط¬ط¯ ظ…ظ„ط§ط­ط¸ط§طھ ظ…ط³ط¬ظ„ط©."}
          </p>
        </div>
        <div className="panel p-6">
          <h3 className="font-extrabold">طھظ‚ط¯ظٹظ… ط§ط¹طھط±ط§ط¶ ط£ظˆ ط·ظ„ط¨ ظ…ط±ط§ط¬ط¹ط©</h3>
          <textarea
            value={objection}
            onChange={(e) => {
              setObjection(e.target.value);
              setSent(false);
            }}
            rows="4"
            className="field mt-4 !h-auto py-3"
            placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..."
          />
          <div className="mt-3 flex items-center gap-3">
            <button onClick={submitObjection} className="btn-primary">
              ط¥ط±ط³ط§ظ„ ط§ظ„ط·ظ„ط¨
            </button>
            {sent && (
              <span className="text-sm font-bold text-emerald-600">
                طھظ… ط¥ط±ط³ط§ظ„ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©.
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
function Dashboard({ employees, evaluations, setPage, settings }) {
  const avg = Math.round(
      evaluations.reduce((s, e) => s + e.total, 0) / evaluations.length,
    ),
    top = [...evaluations].sort((a, b) => b.total - a.total)[0],
    topEmp = employees.find((e) => e.id === top?.employeeId),
    branchData = settings.branches.map((b) => {
      const ids = employees.filter((e) => e.branch === b).map((e) => e.id),
        ev = evaluations.filter((x) => ids.includes(x.employeeId));
      return {
        name: b.replace("ظپط±ط¹ ", ""),
        value: Math.round(
          ev.reduce((s, x) => s + x.total, 0) / (ev.length || 1),
        ),
      };
    }),
    dist = ["ظ…ظ…طھط§ط²", "ط¬ظٹط¯ ط¬ط¯ظ‹ط§", "ط¬ظٹط¯", "ظ…ظ‚ط¨ظˆظ„", "ط¶ط¹ظٹظپ"].map((name) => ({
      name,
      value: evaluations.filter((e) => classify(e.total) === name).length,
    })),
    cards = [
      ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ظˆط¸ظپظٹظ†", employees.length, Users, "bg-blue-50 text-blue-600"],
      [
        "ط§ظ„ظ…ظˆط¸ظپظˆظ† ط§ظ„ظ†ط´ط·ظˆظ†",
        employees.filter((e) => e.status === "ظ†ط´ط·").length,
        UserCheck,
        "bg-emerald-50 text-emerald-600",
      ],
      ["ظ…طھظˆط³ط· طھظ‚ظٹظٹظ… ط§ظ„ط´ط±ظƒط©", `${avg}%`, Star, "bg-amber-50 text-amber-600"],
      [
        "ظ…ط³طھط­ظ‚ظˆ ط§ظ„ط­ط§ظپط²",
        evaluations.filter((e) => e.total >= 70).length,
        Gift,
        "bg-violet-50 text-violet-600",
      ],
      [
        "ط§ظ„ظ…ظˆط¸ظپظˆظ† ط§ظ„ط¶ط¹ظپط§ط،",
        evaluations.filter((e) => e.total < 60).length,
        AlertTriangle,
        "bg-red-50 text-red-600",
      ],
      [
        "ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط­ظˆط§ظپط²",
        money(
          calcIncentives(employees, evaluations).reduce(
            (s, x) => s + x.amount,
            0,
          ),
        ),
        Wallet,
        "bg-brand-50 text-brand-700",
      ],
      [
        "ط¹ط¯ط¯ ط§ظ„ظ…ط®ط§ظ„ظپط§طھ",
        "8",
        MessageSquareWarning,
        "bg-orange-50 text-orange-600",
      ],
      ["ظ†ط³ط¨ط© ط§ظ„ط§ظ†ط¶ط¨ط§ط·", "94%", CalendarCheck, "bg-teal-50 text-teal-600"],
    ];
  return (
    <div className="space-y-6">
      <PageHead
        title={`طµط¨ط§ط­ ط§ظ„ط®ظٹط±طŒ ${settings.manager.name.split(" ")[0]} ًں‘‹`}
        desc="ظ‡ط°ط§ ظ…ظ„ط®طµ ط£ط¯ط§ط، ط§ظ„ط´ط±ظƒط© ظ„ط´ظ‡ط± ظٹظˆظ†ظٹظˆ 2026"
        action={
          <button onClick={() => setPage("reports")} className="btn-primary">
            <FileBarChart size={17} /> ط§ظ„طھظ‚ط±ظٹط± ط§ظ„ط´ظ‡ط±ظٹ
          </button>
        }
      />
	      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	        {cards.map(([l, v, I, c]) => (
          <div key={l} className="panel flex items-center gap-4 p-5">
            <div
              className={`grid h-12 w-12 place-items-center rounded-2xl ${c}`}
            >
              <I size={23} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{l}</p>
              <b className="text-2xl">{v}</b>
            </div>
          </div>
	        ))}
	      </div>
	      <EnterpriseDashboardWidgets employees={employees} evaluations={evaluations} />
	      <div className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
        <Chart
          title="ظ…طھظˆط³ط· طھظ‚ظٹظٹظ… ط§ظ„ظ…ظˆط¸ظپظٹظ† ط­ط³ط¨ ط§ظ„ظپط±ظˆط¹"
          sub="ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ظ†طھط§ط¦ط¬ ط§ظ„ظ…ط¹طھظ…ط¯ط©"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={branchData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} />
              <YAxis domain={[0, 100]} axisLine={false} />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#7f1d1d"
                radius={[8, 8, 0, 0]}
                barSize={35}
              />
            </BarChart>
          </ResponsiveContainer>
        </Chart>
        <Chart title="طھظˆط²ظٹط¹ طھطµظ†ظٹظپط§طھ ط§ظ„ط£ط¯ط§ط،" sub="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط§ظ„ظ…ظ‚ظٹظ…ظٹظ†">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={dist}
                innerRadius={58}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
              >
                {["#059669", "#2563eb", "#38bdf8", "#f59e0b", "#dc2626"].map(
                  (c) => (
                    <Cell key={c} fill={c} />
                  ),
                )}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {dist.map((x, i) => (
              <div key={x.name} className="flex gap-2">
                <i
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: [
                      "#059669",
                      "#2563eb",
                      "#38bdf8",
                      "#f59e0b",
                      "#dc2626",
                    ][i],
                  }}
                />
                {x.name}
                <b className="mr-auto">{x.value}</b>
              </div>
            ))}
          </div>
        </Chart>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Chart title="طھط·ظˆط± ط§ظ„ط£ط¯ط§ط، ط§ظ„ط´ظ‡ط±ظٹ" sub="ط¢ط®ط± ط³طھط© ط£ط´ظ‡ط±">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={[
                ["ظٹظ†ط§ظٹط±", 76],
                ["ظپط¨ط±ط§ظٹط±", 79],
                ["ظ…ط§ط±ط³", 78],
                ["ط£ط¨ط±ظٹظ„", 82],
                ["ظ…ط§ظٹظˆ", 84],
                ["ظٹظˆظ†ظٹظˆ", avg],
              ].map(([month, value]) => ({ month, value }))}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} />
              <YAxis domain={[50, 100]} axisLine={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#7f1d1d"
                strokeWidth={3}
                fill="#fbe5e5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Chart>
        <div className="panel overflow-hidden">
          <div className="bg-gradient-to-l from-brand-800 to-brand-700 p-6 text-white">
            <div className="flex justify-between">
              <span>ظ…ظˆط¸ظپ ط§ظ„ط´ظ‡ط±</span>
              <Trophy className="text-amber-300" />
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-xl font-bold">
                {topEmp?.name
                  .split(" ")
                  .slice(0, 2)
                  .map((x) => x[0])
                  .join("")}
              </div>
              <div>
                <h3 className="text-lg font-extrabold">{topEmp?.name}</h3>
                <p className="text-sm text-red-100">{topEmp?.job}</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex justify-between">
              <span>ط§ظ„طھظ‚ظٹظٹظ… ط§ظ„ظ†ظ‡ط§ط¦ظٹ</span>
              <b className="text-2xl text-brand-700">{top?.total}%</b>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-700"
                style={{ width: `${top?.total}%` }}
              />
            </div>
            <button
              onClick={() => setPage("top")}
              className="mt-5 w-full text-sm font-bold text-brand-700"
            >
              ط¹ط±ط¶ طھظپط§طµظٹظ„ ط§ظ„طھظƒط±ظٹظ…
            </button>
          </div>
        </div>
      </div>
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
  const validGuaranteeEmployeeIds = new Set(guarantees.filter((g) => g.guarantee_status === "ط³ط§ط±ظٹط©").map((g) => g.employee_id));
  const overtimeRows = assignmentEmployees.map((row) => ({ ...assignments.find((a) => a.assignment_id === row.assignment_id), ...row }));
  const overtimeHours = overtimeRows.reduce((sum, row) => {
    if (!row.start_time || !row.end_time) return sum;
    const [sh, sm] = row.start_time.split(":").map(Number);
    const [eh, em] = row.end_time.split(":").map(Number);
    return sum + Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  }, 0);
  const mostBranch = Object.entries(groupCount(overtimeRows, "branch")).sort((a, b) => b[1] - a[1])[0]?.[0] || "â€”";
  const mostEmployee = Object.entries(groupCount(overtimeRows, "employee_name")).sort((a, b) => b[1] - a[1])[0]?.[0] || "â€”";
  const guaranteeStatusChart = Object.entries(groupCount(guarantees, "guarantee_status")).map(([name, value]) => ({ name, value }));
  const overtimeBranchChart = Object.entries(groupCount(overtimeRows, "branch")).map(([name, value]) => ({ name, value }));
  const overtimeMonthChart = Object.entries(groupCount(overtimeRows.map((r) => ({ ...r, month: String(r.assignment_date || "").slice(0, 7) })), "month")).map(([name, value]) => ({ name, value }));
  const extraCards = [
    ["ط§ظ„ظ…ظˆط¸ظپظˆظ† ط§ظ„ظ…ظˆظ‚ظˆظپظˆظ†", employees.filter((e) => e.status === "ظ…ظˆظ‚ظˆظپ" || e.status === "ط¸â€¦ط¸ث†ط¸â€ڑط¸ث†ط¸ظ¾").length, AlertTriangle],
    ["ط§ظ„ظ…ظˆط¸ظپظˆظ† ط¨ط¯ظˆظ† ط¶ظ…ط§ظ†ط©", employees.filter((e) => !validGuaranteeEmployeeIds.has(e.id)).length, ShieldCheck],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¶ظ…ط§ظ†ط§طھ", guarantees.length, ShieldCheck],
    ["ط¶ظ…ط§ظ†ط§طھ طھط­طھط§ط¬ ظ…ط±ط§ط¬ط¹ط©", guarantees.filter((g) => ["ظ†ط§ظ‚طµط©", "ظ…ظ†طھظ‡ظٹط©"].includes(g.guarantee_status) || g.approval_status === "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©").length, AlertTriangle],
    ["طھظƒظ„ظٹظپط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", assignments.length, Clock3],
    ["ط³ط§ط¹ط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", overtimeHours.toFixed(1), Gauge],
    ["ط£ظƒط«ط± ظپط±ط¹ ظ„ط¯ظٹظ‡ ط¹ظ…ظ„ ط¥ط¶ط§ظپظٹ", mostBranch, Building2],
    ["ط£ظƒط«ط± ظ…ظˆط¸ظپ طھظ… طھظƒظ„ظٹظپظ‡", mostEmployee, UserCheck],
    ["طھظƒظ„ظٹظپط§طھ ظ‚ظٹط¯ ط§ظ„ط§ط¹طھظ…ط§ط¯", assignments.filter((a) => a.approval_status === "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©").length, BadgeCheck],
    ["ط£طµط­ط§ط¨ ط§ظ„ط£ط¯ط§ط، ط§ظ„ط¶ط¹ظٹظپ", evaluations.filter((e) => e.total < 60).length, AlertTriangle],
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {extraCards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Chart title="ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ ط­ط³ط¨ ط§ظ„ظپط±ط¹" sub="ط¹ط¯ط¯ ط§ظ„طھظƒظ„ظٹظپط§طھ ط§ظ„ظ…ط³ط¬ظ„ط©">
          <ResponsiveContainer width="100%" height={220}><BarChart data={overtimeBranchChart}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
        </Chart>
        <Chart title="ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ ط­ط³ط¨ ط§ظ„ط´ظ‡ط±" sub="ظ…ظ‚ط§ط±ظ†ط© ط´ظ‡ط±ظٹط© ظ„ظ„طھظƒظ„ظٹظپط§طھ">
          <ResponsiveContainer width="100%" height={220}><BarChart data={overtimeMonthChart}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#991b1b" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
        </Chart>
        <Chart title="ط§ظ„ط¶ظ…ط§ظ†ط§طھ ط­ط³ط¨ ط§ظ„ط­ط§ظ„ط©" sub="طھظˆط²ظٹط¹ ط­ط§ظ„ط§طھ ط§ظ„ط¶ظ…ط§ظ†ط§طھ">
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
    [branch, setBranch] = useState("ط§ظ„ظƒظ„"),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    filtered = employees.filter(
      (e) =>
        (e.name.includes(q) || e.id.toLowerCase().includes(q.toLowerCase())) &&
        (branch === "ط§ظ„ظƒظ„" || e.branch === branch),
    );
  return (
    <div className="space-y-5">
      <PageHead
        title="ط³ط¬ظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ†"
        desc={`ط¥ط¯ط§ط±ط© ط¨ظٹط§ظ†ط§طھ ${employees.length} ظ…ظˆط¸ظپ ظپظٹ ط¬ظ…ظٹط¹ ط§ظ„ظپط±ظˆط¹`}
        action={
          <button
            onClick={() => {
              setEditing(null);
              setModal(true);
            }}
            className="btn-primary"
          >
            <Plus size={18} /> ط¥ط¶ط§ظپط© ظ…ظˆط¸ظپ
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
              placeholder="ط§ط¨ط­ط« ط¨ط§ظ„ط§ط³ظ… ط£ظˆ ط§ظ„ط±ظ‚ظ…..."
            />
          </label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="field max-w-[190px]"
          >
            <option>ط§ظ„ظƒظ„</option>
            {branches.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button
            onClick={() => exportExcel(filtered, "ط§ظ„ظ…ظˆط¸ظپظˆظ†")}
            className="btn-secondary"
          >
            <FileSpreadsheet size={17} /> طھطµط¯ظٹط± Excel
          </button>
          <label className="btn-secondary cursor-pointer">
            <Upload size={17} /> ط§ط³طھظٹط±ط§ط¯
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
                <th>ط§ظ„ظ…ظˆط¸ظپ</th>
                <th>ط§ظ„ظپط±ط¹</th>
                <th>ط§ظ„ظˆط¸ظٹظپط©</th>
                <th>طھط§ط±ظٹط® ط§ظ„طھط¹ظٹظٹظ†</th>
                <th>ط§ظ„ط±ط§طھط¨</th>
                <th>ط§ظ„ط­ط§ظ„ط©</th>
                <th>ط§ظ„ظ…ط¯ظٹط± ط§ظ„ظ…ط¨ط§ط´ط±</th>
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
                          {e.id} â€¢ {e.phone}
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
                        confirm("ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط§ظ„ظ…ظˆط¸ظپطں") &&
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
          ط¹ط±ط¶ {filtered.length} ظ…ظ† {employees.length} ظ…ظˆط¸ظپ
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
function EmployeeModal({ employee, editing, close, save, setEmployees }) {
  const currentEmployee = employee || editing;
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState(
    currentEmployee || {
      id: `EMP-${Date.now().toString().slice(-4)}`,
      name: "",
      branch: branches[0],
      job: jobs[0],
      hireDate: new Date().toISOString().slice(0, 10),
      salary: 5000,
      phone: "05",
      status: "ظ†ط´ط·",
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
              throw new Error("ظ„ظ… ظٹط±ط¬ط¹ Supabase ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپ ط¨ط¹ط¯ ط§ظ„ط­ظپط¸");
            }
            const savedEmployee = {
              id: data.id,
              name: data.name,
              branch: data.branch,
              job: data.job,
              hireDate: data.hire_date,
              salary: Number(data.salary || 0),
              phone: data.phone || "",
              status: data.status || "ظ†ط´ط·",
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
            alert(error.message || "طھط¹ط°ط± ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپ");
          } finally {
            setSaving(false);
          }
        }}
        className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
      >
        <div className="mb-6 flex">
          <h3 className="text-xl font-extrabold">
            {currentEmployee ? "طھط¹ط¯ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپ" : "ط¥ط¶ط§ظپط© ظ…ظˆط¸ظپ ط¬ط¯ظٹط¯"}
          </h3>
          <button type="button" onClick={close} className="mr-auto">
            <X />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["id", "ط±ظ‚ظ… ط§ظ„ظ…ظˆط¸ظپ"],
            ["name", "ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ"],
            ["hireDate", "طھط§ط±ظٹط® ط§ظ„طھط¹ظٹظٹظ†", "date"],
            ["salary", "ط§ظ„ط±ط§طھط¨", "number"],
            ["phone", "ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ"],
            ["manager", "ط§ظ„ظ…ط¯ظٹط± ط§ظ„ظ…ط¨ط§ط´ط±"],
          ].map(([k, l, t]) => (
            <Label key={k} t={l}>
              <input
                required
                type={t || "text"}
                value={f[k]}
                onChange={(e) => setF({ ...f, [k]: e.target.value })}
                className="field mt-2"
              />
            </Label>
          ))}
          <Label t="ط§ظ„ظپط±ط¹">
            <select
              value={f.branch}
              onChange={(e) => setF({ ...f, branch: e.target.value })}
              className="field mt-2"
            >
              {branches.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Label>
          <Label t="ط§ظ„ظˆط¸ظٹظپط©">
            <select
              value={f.job}
              onChange={(e) => setF({ ...f, job: e.target.value })}
              className="field mt-2"
            >
              {jobs.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Label>
          <Label t="ط§ظ„ط­ط§ظ„ط©">
            <select
              value={f.status}
              onChange={(e) => setF({ ...f, status: e.target.value })}
              className="field mt-2"
            >
              <option>ظ†ط´ط·</option>
              <option>ط¥ط¬ط§ط²ط©</option>
              <option>ظ…ظˆظ‚ظˆظپ</option>
            </select>
          </Label>
        </div>
        <div className="mt-7 flex justify-end gap-2">
          <button type="button" onClick={close} className="btn-secondary">
            ط¥ظ„ط؛ط§ط،
          </button>
          <button disabled={saving} className="btn-primary">
            <Save size={17} /> ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ
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
        title="ظ†ظ…ط§ط°ط¬ ط§ظ„طھظ‚ظٹظٹظ…"
        desc="ظ†ظ…ط§ط°ط¬ ظ…ط±ظ†ط© ظˆظ…ط®طµطµط© ظ„ظƒظ„ ظˆط¸ظٹظپط©"
        action={
          <button className="btn-primary">
            <Plus size={17} /> ظ†ظ…ظˆط°ط¬ ط¬ط¯ظٹط¯
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
              10 ظ…ط¹ط§ظٹظٹط± â€¢ 100 ظ†ظ‚ط·ط©
            </p>
          </button>
        ))}
      </div>
      <div className="panel p-5">
        <div className="mb-5 flex justify-between">
          <div>
            <h3 className="text-lg font-extrabold">ظ†ظ…ظˆط°ط¬ طھظ‚ظٹظٹظ…: {job}</h3>
            <p className="text-xs text-slate-500">
              ط§ظ„ط£ظˆط²ط§ظ† ظ…ظˆط²ط¹ط© ط¹ظ„ظ‰ ظ…ط¹ط§ظٹظٹط± ط§ظ„ط£ط¯ط§ط، ط§ظ„ط£ط³ط§ط³ظٹط©
            </p>
          </div>
          <button className="btn-secondary">
            <Pencil size={16} /> طھط¹ط¯ظٹظ„ ط§ظ„ط£ظˆط²ط§ظ†
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ظ…ط¹ظٹط§ط± ط§ظ„طھظ‚ظٹظٹظ…</th>
                <th>ط§ظ„ظˆط²ظ† ط§ظ„ظ†ط³ط¨ظٹ</th>
                <th>ط§ظ„ط¯ط±ط¬ط© ط§ظ„ظ‚طµظˆظ‰</th>
                <th>ط§ظ„ط­ط§ظ„ط©</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c, i) => (
                <tr key={c}>
                  <td>{i + 1}</td>
                  <td className="font-bold">{c}</td>
                  <td>{weights[i]}%</td>
                  <td>5 ط¯ط±ط¬ط§طھ</td>
                  <td>
                    <Status>ظ†ط´ط·</Status>
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
        status: old?.status || "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©",
        notes,
      };
    setEvaluations((list) =>
      old ? list.map((e) => (e.id === old.id ? record : e)) : [record, ...list],
    );
    alert(old ? "طھظ… طھط¹ط¯ظٹظ„ ط§ظ„طھظ‚ظٹظٹظ… ط§ظ„ط³ط§ط¨ظ‚" : "طھظ… ط­ظپط¸ ط§ظ„طھظ‚ظٹظٹظ…");
  };
  return (
    <div className="space-y-5">
      <PageHead
        title="طھظ‚ظٹظٹظ… ط£ط¯ط§ط، ط§ظ„ظ…ظˆط¸ظپظٹظ†"
        desc="ط¥ط¯ط®ط§ظ„ ط§ظ„ط¯ط±ط¬ط§طھ ظˆط§ط­طھط³ط§ط¨ ط§ظ„ظ†طھظٹط¬ط© طھظ„ظ‚ط§ط¦ظٹظ‹ط§"
        action={
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer size={17} /> ط·ط¨ط§ط¹ط© / PDF
          </button>
        }
      />
      <div className="panel grid gap-4 p-5 md:grid-cols-3">
        <Label t="ط§ظ„ظ…ظˆط¸ظپ">
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
        <Label t="ط´ظ‡ط± ط§ظ„طھظ‚ظٹظٹظ…">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="field mt-2"
          />
        </Label>
        <Label t="ط§ظ„ظˆط¸ظٹظپط©">
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
                  <th>ط§ظ„ظ…ط¹ظٹط§ط±</th>
                  <th>ط§ظ„ظˆط²ظ†</th>
                  <th>ط§ظ„ط¯ط±ط¬ط© ظ…ظ† 5</th>
                  <th>ط§ظ„ظ†طھظٹط¬ط©</th>
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
          <Label t="ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„ظ…ط¯ظٹط±">
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
              ظ…ط­ط³ظˆط¨ ط­ط³ط¨ ظ†ظ…ظˆط°ط¬ ظˆط¸ظٹظپط© {emp?.job}
            </p>
          </div>
          <button onClick={save} className="btn-primary h-12 w-full">
            <Save size={18} /> ط­ظپط¸ ط§ظ„طھظ‚ظٹظٹظ…
          </button>
          <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
            ظˆط¬ظˆط¯ طھظ‚ظٹظٹظ… ظ„ظ†ظپط³ ط§ظ„ط´ظ‡ط± ظٹط¤ط¯ظٹ ط¥ظ„ظ‰ طھط¹ط¯ظٹظ„ ط§ظ„ط³ط¬ظ„ ط§ظ„ط³ط§ط¨ظ‚طŒ ظ„ط§ ط¥ظ†ط´ط§ط، ظ†ط³ط®ط©
            ظ…ظƒط±ط±ط©.
          </p>
        </div>
      </div>
    </div>
  );
}
function Productivity({ employees }) {
  const list = employees.filter((e) =>
      ["ظƒط§ط´ظٹط±", "ط®ط¯ظ…ط© ط¹ظ…ظ„ط§ط، ظˆطھط­ظˆظٹظ„ط§طھ ظˆط§طھط³", "ط¹ظ…ظ„ظٹط§طھ ظ…طµط±ظپظٹط©"].includes(e.job),
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
      title="ظ…ط¤ط´ط±ط§طھ ط§ظ„ط¥ظ†طھط§ط¬ظٹط©"
      desc="ظ‚ظٹط§ط³ ط­ط¬ظ… ط§ظ„ط¹ظ…ظ„ظٹط§طھ ظˆط¬ظˆط¯طھظ‡ط§ ظˆط³ط±ط¹ط© ط§ظ„ط¥ظ†ط¬ط§ط²"
    >
      <Label t="ط§ظ„ظ…ظˆط¸ظپ">
        <select className="field mt-2 max-w-md">
          {list.map((e) => (
            <option key={e.id}>
              {e.name} â€” {e.job}
            </option>
          ))}
        </select>
      </Label>
      <Fields
        values={v}
        set={setV}
        items={[
          ["receive", "ط¹ظ…ظ„ظٹط§طھ ظ‚ط¨ط¶ ط§ظ„ط­ظˆط§ظ„ط§طھ"],
          ["pay", "ط¹ظ…ظ„ظٹط§طھ طµط±ظپ ط§ظ„ط­ظˆط§ظ„ط§طھ"],
          ["sell", "ط¹ظ…ظ„ظٹط§طھ ط¨ظٹط¹ ط§ظ„ط¹ظ…ظ„ط§طھ"],
          ["buy", "ط¹ظ…ظ„ظٹط§طھ ط´ط±ط§ط، ط§ظ„ط¹ظ…ظ„ط§طھ"],
          ["errors", "ط¹ط¯ط¯ ط§ظ„ط£ط®ط·ط§ط،"],
          ["complaints", "ط´ظƒط§ظˆظ‰ ط§ظ„ط¹ظ…ظ„ط§ط،"],
          ["time", "ظ…طھظˆط³ط· ظˆظ‚طھ ط§ظ„ط®ط¯ظ…ط© (ط¯ظ‚ظٹظ‚ط©)"],
        ]}
      />
      <Score n={score} label="ظ†ظ‚ط§ط· ط§ظ„ط¥ظ†طھط§ط¬ظٹط©" />
      <button className="btn-primary">
        <Save size={17} /> ط­ظپط¸ ظ…ط¤ط´ط±ط§طھ ط§ظ„ط´ظ‡ط±
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
    <Entry title="ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ" desc="ظ…طھط§ط¨ط¹ط© ط§ظ„ط­ط¶ظˆط± ظˆط§ظ„طھط£ط®ظٹط± ظˆط§ظ„ظ…ط®ط§ظ„ظپط§طھ">
      <Label t="ط§ظ„ظ…ظˆط¸ظپ">
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
          ["present", "ط£ظٹط§ظ… ط§ظ„ط­ط¶ظˆط±"],
          ["absent", "ط£ظٹط§ظ… ط§ظ„ط؛ظٹط§ط¨"],
          ["late", "ط§ظ„طھط£ط®ظٹط± ط¨ط§ظ„ط¯ظ‚ط§ط¦ظ‚"],
          ["early", "ط§ظ„ط§ظ†طµط±ط§ظپ ط§ظ„ظ…ط¨ظƒط±"],
          ["violations", "ط§ظ„ظ…ط®ط§ظ„ظپط§طھ"],
          ["penalties", "ط§ظ„ط¬ط²ط§ط،ط§طھ"],
        ]}
      />
      <Label t="ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©">
        <textarea className="field mt-2 !h-auto py-3" rows="3" />
      </Label>
      <Score n={score} label="ط¯ط±ط¬ط© ط§ظ„ط§ظ†ط¶ط¨ط§ط·" />
      <button className="btn-primary">
        <Save size={17} /> ط­ظپط¸ ط³ط¬ظ„ ط§ظ„ط§ظ†ط¶ط¨ط§ط·
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
          ظٹطھظ… طھط­ط¯ظٹط«ظ‡ط§ طھظ„ظ‚ط§ط¦ظٹظ‹ط§ ط­ط³ط¨ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط¯ط®ظ„ط©
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
        cat === "ظ…ظ…طھط§ط²"
          ? 0.1
          : cat === "ط¬ظٹط¯ ط¬ط¯ظ‹ط§"
            ? 0.07
            : cat === "ط¬ظٹط¯"
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
    const rate = cat === "ظ…ظ…طھط§ط²" ? 0.1 : cat === "ط¬ظٹط¯ ط¬ط¯ظ‹ط§" ? 0.07 : cat === "ط¬ظٹط¯" ? 0.04 : 0;
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
        title="ط§ظ„ط­ظˆط§ظپط² ظˆط§ظ„ظ…ظƒط§ظپط¢طھ"
        desc="ط§ط­طھط³ط§ط¨ ط¢ظ„ظٹ ظˆظپظ‚ ط§ظ„ط±ط§طھط¨ ظˆط§ظ„طھظ‚ظٹظٹظ… ظˆظ†ط³ط¨ط© ط§ظ„ط­ط§ظپط²"
        action={
          <button
            onClick={() => exportExcel(data, "ط§ظ„ط­ظˆط§ظپط²")}
            className="btn-primary"
          >
            <Download size={17} /> طھطµط¯ظٹط± ط§ظ„ظƒط´ظپ
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Mini
          label="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط­ظˆط§ظپط²"
          value={money(data.reduce((s, x) => s + x.amount, 0))}
          I={CircleDollarSign}
        />
        <Mini
          label="ط§ظ„ظ…ط³طھط­ظ‚ظˆظ†"
          value={data.filter((x) => x.rate > 0).length}
          I={UserCheck}
        />
        <Mini
          label="ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ط§ط¹طھظ…ط§ط¯"
          value={evaluations.filter((x) => x.status === "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©").length}
          I={Clock3}
        />
      </div>
      <div className="panel p-4">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ط§ظ„ظ…ظˆط¸ظپ</th>
                <th>ط§ظ„ظپط±ط¹</th>
                <th>ط§ظ„ظˆط¸ظٹظپط©</th>
                <th>ط§ظ„ط±ط§طھط¨</th>
                <th>ط§ظ„طھظ‚ظٹظٹظ…</th>
                <th>ط§ظ„ظ†ط³ط¨ط©</th>
                <th>ط§ظ„ط­ط§ظپط² ط§ظ„ظ…ظ‚طھط±ط­</th>
                <th>ط§ظ„ط§ط¹طھظ…ط§ط¯</th>
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
                      <option>ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©</option>
                      <option>ظ…ط¹طھظ…ط¯</option>
                      <option>ظ…ط±ظپظˆط¶</option>
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
        title="ظ…ظˆط¸ظپ ط§ظ„ط´ظ‡ط±"
        desc="طھظƒط±ظٹظ… ط£طµط­ط§ط¨ ط§ظ„ط£ط¯ط§ط، ط§ظ„ط£ط¹ظ„ظ‰"
        action={
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer size={17} /> ط·ط¨ط§ط¹ط© ط´ظ‡ط§ط¯ط©
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
              ط§ظ„ط£ظپط¶ظ„ ط¹ظ„ظ‰ ظ…ط³طھظˆظ‰ ط§ظ„ط´ط±ظƒط©
            </span>
            <h2 className="mt-4 text-3xl font-extrabold">{best.name}</h2>
            <p className="mt-2 text-red-100/70">
              {best.job} â€¢ {best.branch}
            </p>
            <p className="mt-4 text-sm text-red-100/80">
              ظ„طھظ…ظٹط²ظ‡ ظپظٹ ط¯ظ‚ط© ط§ظ„ط¹ظ…ظ„ ظˆط§ظ„ط§ظ„طھط²ط§ظ… ظˆطھظ‚ط¯ظٹظ… طھط¬ط±ط¨ط© ط§ط³طھط«ظ†ط§ط¦ظٹط© ظ„ظ„ط¹ظ…ظ„ط§ط،.
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
                  {x.branch} â€¢ {x.job}
                </p>
              </div>
              <b className="mr-auto text-xl text-brand-700">{x.total}%</b>
            </div>
            <div className="mt-4 flex gap-2">
              {["ط¯ظ‚ط© ط¹ط§ظ„ظٹط©", "ط®ط¯ظ…ط© ظ…ظ…ظٹط²ط©", "ط§ظ†ط¶ط¨ط§ط·"].map((t) => (
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
        title="ط®ط·ط· طھط­ط³ظٹظ† ط§ظ„ط£ط¯ط§ط،"
        desc="ظ…طھط§ط¨ط¹ط© ط§ظ„ظ…ظˆط¸ظپظٹظ† ط§ظ„ط£ظ‚ظ„ ظ…ظ† 70%"
        action={
          <button className="btn-primary">
            <Plus size={17} /> ط®ط·ط© طھط­ط³ظٹظ†
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
                  {e.job} â€¢ {e.branch}
                </p>
              </div>
              <b className="mr-auto text-xl text-red-600">{e.total}%</b>
            </div>
            <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs">
              <Info t="ط³ط¨ط¨ ط§ظ„ط§ظ†ط®ظپط§ط¶" v="ط§ظ„ط­ط§ط¬ط© ظ„ط±ظپط¹ ط§ظ„ط¯ظ‚ط© ظˆط³ط±ط¹ط© ط§ظ„ط¥ظ†ط¬ط§ط²" />
              <Info t="ط§ظ„ظ…ط³ط¤ظˆظ„" v="ظ…ط¯ظٹط± ط§ظ„ظپط±ط¹" />
              <Info t="ط¨ط¯ط§ظٹط© ط§ظ„ط®ط·ط©" v="01 ظٹظˆظ„ظٹظˆ 2026" />
              <Info t="ظ†ظ‡ط§ظٹط© ط§ظ„ط®ط·ط©" v="31 ظٹظˆظ„ظٹظˆ 2026" />
            </div>
            <Status>ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©</Status>
          </div>
        ))}
      </div>
    </div>
  );
}
function Reports({ employees, evaluations }) {
  const reps = [
    ["ط§ظ„طھظ‚ط±ظٹط± ط§ظ„ظ…ط§ظ„ظٹ ظ„ظ„ط£ط¯ط§ط، ط§ظ„ط´ظ‡ط±ظٹ", Wallet],
    ["ط§ظ„طھظ‚ظٹظٹظ… ط§ظ„ط´ظ‡ط±ظٹ", CalendarCheck],
    ["ط§ظ„طھظ‚ظٹظٹظ… ط­ط³ط¨ ط§ظ„ظپط±ط¹", Building2],
    ["ط§ظ„طھظ‚ظٹظٹظ… ط­ط³ط¨ ط§ظ„ظˆط¸ظٹظپط©", BriefcaseBusiness],
    ["طھظ‚ط±ظٹط± ط§ظ„ط­ظˆط§ظپط²", Gift],
    ["ط§ظ„ظ…ظˆط¸ظپظˆظ† ط§ظ„ط¶ط¹ظپط§ط،", AlertTriangle],
    ["ط£ظپط¶ظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ†", Trophy],
    ["طھظ‚ط±ظٹط± ط§ظ„ط§ظ†ط¶ط¨ط§ط·", Clock3],
    ["طھظ‚ط±ظٹط± ط§ظ„ظ…ط®ط§ظ„ظپط§طھ", MessageSquareWarning],
    ["ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ظپط±ظˆط¹", FileBarChart],
  ];
  return (
    <div className="space-y-5">
      <PageHead title="ظ…ط±ظƒط² ط§ظ„طھظ‚ط§ط±ظٹط±" desc="طھظ‚ط§ط±ظٹط± ط¬ط§ظ‡ط²ط© ظ„ط§طھط®ط§ط° ط§ظ„ظ‚ط±ط§ط±" />
      <div className="panel flex flex-wrap gap-3 p-4">
        <select className="field max-w-[180px]">
          <option>ظٹظˆظ†ظٹظˆ 2026</option>
        </select>
        <select className="field max-w-[190px]">
          <option>ط¬ظ…ظٹط¹ ط§ظ„ظپط±ظˆط¹</option>
          {branches.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button className="btn-secondary">
          <Filter size={17} /> طھط·ط¨ظٹظ‚ ط§ظ„ظپظ„ط§طھط±
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
              طھظ‚ط±ظٹط± طھظپطµظٹظ„ظٹ ط¬ط§ظ‡ط² ظ„ظ„طھطµط¯ظٹط± ظˆط§ظ„ط·ط¨ط§ط¹ط©
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
    ["ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…", UserRoundCog],
    ["ط§ظ„ظپط±ظˆط¹", Building2],
    ["ط§ظ„ظˆط¸ط§ط¦ظپ", BriefcaseBusiness],
    ["ظ…ط¹ط§ظٹظٹط± ط§ظ„طھظ‚ظٹظٹظ…", ClipboardList],
    ["ط§ظ„طµظ„ط§ط­ظٹط§طھ", ShieldCheck],
  ];
  const [tab, setTab] = useState("ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…"),
    [edit, setEdit] = useState(null);
  const key =
    tab === "ط§ظ„ظپط±ظˆط¹"
      ? "branches"
      : tab === "ط§ظ„ظˆط¸ط§ط¦ظپ"
        ? "jobs"
        : tab === "ظ…ط¹ط§ظٹظٹط± ط§ظ„طھظ‚ظٹظٹظ…"
          ? "criteria"
          : "permissions";
  const items = settings[key] || [];
  const updateItem = () => {
    if (!edit) return;
    const old = items[edit.index],
      next = [...items];
    next[edit.index] =
      tab === "ط§ظ„طµظ„ط§ط­ظٹط§طھ"
        ? { name: edit.name.trim(), description: edit.description.trim() }
        : edit.value.trim();
    if (!next[edit.index] || (tab === "ط§ظ„طµظ„ط§ط­ظٹط§طھ" && !next[edit.index].name))
      return;
    setSettings({ ...settings, [key]: next });
    if (tab === "ط§ظ„ظپط±ظˆط¹")
      setEmployees((list) =>
        list.map((e) =>
          e.branch === old ? { ...e, branch: next[edit.index] } : e,
        ),
      );
    if (tab === "ط§ظ„ظˆط¸ط§ط¦ظپ")
      setEmployees((list) =>
        list.map((e) => (e.job === old ? { ...e, job: next[edit.index] } : e)),
      );
    setEdit(null);
  };
  return (
    <div className="space-y-5">
      <PageHead
        title="ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ…"
        desc="طھط¹ط¯ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ†ط¸ط§ظ… ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ ظ…ط¹ ط§ظ„ط­ظپط¸ ط§ظ„طھظ„ظ‚ط§ط¦ظٹ"
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
          {tab === "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…" ? (
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
                  <h3 className="text-lg font-extrabold">ط¨ظٹط§ظ†ط§طھ ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…</h3>
                  <p className="text-xs text-slate-500">
                    طھط¸ظ‡ط± ظ‡ط°ظ‡ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظپظٹ ط§ظ„ط´ط±ظٹط· ط§ظ„ط¹ظ„ظˆظٹ ظˆط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط¬ط§ظ†ط¨ظٹط©
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Label t="ط§ط³ظ… ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…">
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
                <Label t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…">
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
                <Label t="ط§ظ„ظ…ط³ظ…ظ‰ / ط§ظ„طµظ„ط§ط­ظٹط©">
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
                  ظٹطھظ… ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ طھظ„ظ‚ط§ط¦ظٹظ‹ط§ ظپظٹ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظ„ظٹط©.
                </span>
                <Save size={18} />
              </div>
            </div>
          ) : isPermission ? (
            <PermissionsMatrix settings={settings} setSettings={setSettings} />
          ) : (
            <div>
              <div className="mb-5">
                <h3 className="text-lg font-extrabold">ط¥ط¯ط§ط±ط© {tab}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  ط§ط¶ط؛ط· ط¹ظ„ظ‰ ط²ط± ط§ظ„طھط¹ط¯ظٹظ„ ظ„طھط؛ظٹظٹط± ط§ظ„ط¨ظٹط§ظ†ط§طھطŒ ظˆط³ظٹظڈط·ط¨ظ‘ظ‚ ط§ظ„طھط؛ظٹظٹط± ظپظٹ ط¨ظ‚ظٹط©
                  ط§ظ„ظ†ط¸ط§ظ….
                </p>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => {
                  const name = tab === "ط§ظ„طµظ„ط§ط­ظٹط§طھ" ? item.name : item,
                    description = tab === "ط§ظ„طµظ„ط§ط­ظٹط§طھ" ? item.description : null;
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
                        aria-label={`طھط¹ط¯ظٹظ„ ${name}`}
                        onClick={() =>
                          setEdit(
                            tab === "ط§ظ„طµظ„ط§ط­ظٹط§طھ"
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
              <h3 className="text-lg font-extrabold">طھط¹ط¯ظٹظ„ {tab}</h3>
              <button onClick={() => setEdit(null)} className="mr-auto">
                <X />
              </button>
            </div>
            {tab === "ط§ظ„طµظ„ط§ط­ظٹط§طھ" ? (
              <div className="space-y-4">
                <Label t="ط§ط³ظ… ط§ظ„طµظ„ط§ط­ظٹط©">
                  <input
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                    className="field mt-2"
                  />
                </Label>
                <Label t="ظˆطµظپ ط§ظ„طµظ„ط§ط­ظٹط©">
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
                  tab === "ط§ظ„ظپط±ظˆط¹"
                    ? "ط§ط³ظ… ط§ظ„ظپط±ط¹"
                    : tab === "ط§ظ„ظˆط¸ط§ط¦ظپ"
                      ? "ط§ط³ظ… ط§ظ„ظˆط¸ظٹظپط©"
                      : "ط§ط³ظ… ظ…ط¹ظٹط§ط± ط§ظ„طھظ‚ظٹظٹظ…"
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
                ط¥ظ„ط؛ط§ط،
              </button>
              <button onClick={updateItem} className="btn-primary">
                <Save size={17} /> ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„
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
  canNode,
}) {
  const tabs = [
    ["ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…", UserRoundCog],
    ["ط§ظ„ظپط±ظˆط¹", Building2],
    ["ط§ظ„ط¹ظ…ظ„ط§طھ", CircleDollarSign],
    ["ط§ظ„ظˆط¸ط§ط¦ظپ", BriefcaseBusiness],
    ["ظ…ط¹ط§ظٹظٹط± ط§ظ„طھظ‚ظٹظٹظ…", ClipboardList],
    ["ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ†", Users],
    ["ط§ظ„طµظ„ط§ط­ظٹط§طھ", ShieldCheck],
  ];
  const [tab, setTab] = useState("ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…"),
    [selected, setSelected] = useState(null),
    [dialog, setDialog] = useState(null);
  const key =
    tab === "ط§ظ„ظپط±ظˆط¹"
      ? "branches"
      : tab === "ط§ظ„ط¹ظ…ظ„ط§طھ"
        ? "currencies"
        : tab === "ط§ظ„ظˆط¸ط§ط¦ظپ"
          ? "jobs"
          : tab === "ظ…ط¹ط§ظٹظٹط± ط§ظ„طھظ‚ظٹظٹظ…"
            ? "criteria"
            : tab === "ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ†"
              ? "users"
            : "permissions";
  const items = settings[key] || defaultSettings[key] || [];
  const isPermission = tab === "ط§ظ„طµظ„ط§ط­ظٹط§طھ";
  const isUser = tab === "ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ†";
  const openAdd = () =>
    setDialog(
      isUser
        ? {
            mode: "add",
            name: "",
            username: "",
            password: "",
            role: "ط§ظ„ظ…ظˆط¸ظپ",
            employeeId: "",
          }
        : isPermission
        ? { mode: "add", name: "", description: "" }
        : { mode: "add", value: "" },
    );
  const openEdit = () => {
    if (selected === null) return;
    const item = items[selected];
    setDialog(
      isUser
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
  const saveItem = () => {
    if (!dialog) return;
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
    if (dialog.mode === "edit" && tab === "ط§ظ„ظپط±ظˆط¹")
      setEmployees((list) =>
        list.map((e) => (e.branch === old ? { ...e, branch: value } : e)),
      );
    if (dialog.mode === "edit" && tab === "ط§ظ„ظˆط¸ط§ط¦ظپ")
      setEmployees((list) =>
        list.map((e) => (e.job === old ? { ...e, job: value } : e)),
      );
    if (tab === "ظ…ط¹ط§ظٹظٹط± ط§ظ„طھظ‚ظٹظٹظ…" && dialog.mode === "add")
      setEvaluations((list) =>
        list.map((e) => ({ ...e, scores: [...(e.scores || []), 3] })),
      );
    setDialog(null);
    setSelected(null);
  };
  const deleteItem = () => {
    if (selected === null) return;
    if ((tab === "ط§ظ„ظپط±ظˆط¹" || tab === "ط§ظ„ظˆط¸ط§ط¦ظپ") && items.length === 1) {
      alert("ظٹط¬ط¨ ط§ظ„ط¥ط¨ظ‚ط§ط، ط¹ظ„ظ‰ ط¹ظ†طµط± ظˆط§ط­ط¯ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„.");
      return;
    }
    const item = items[selected],
      name = isPermission || isUser ? item.name : item;
    if (!confirm(`ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ آ«${name}آ»طں`)) return;
    const next = items.filter((_, i) => i !== selected);
    setSettings({ ...settings, [key]: next });
    if (tab === "ط§ظ„ظپط±ظˆط¹")
      setEmployees((list) =>
        list.map((e) => (e.branch === item ? { ...e, branch: next[0] } : e)),
      );
    if (tab === "ط§ظ„ظˆط¸ط§ط¦ظپ")
      setEmployees((list) =>
        list.map((e) => (e.job === item ? { ...e, job: next[0] } : e)),
      );
    if (tab === "ظ…ط¹ط§ظٹظٹط± ط§ظ„طھظ‚ظٹظٹظ…")
      setEvaluations((list) =>
        list.map((e) => ({
          ...e,
          scores: (e.scores || []).filter((_, i) => i !== selected),
        })),
      );
    setSelected(null);
  };
  const itemLabel =
    tab === "ط§ظ„ظپط±ظˆط¹"
      ? "ط§ط³ظ… ط§ظ„ظپط±ط¹"
      : tab === "ط§ظ„ط¹ظ…ظ„ط§طھ"
        ? "ط§ط³ظ… ط§ظ„ط¹ظ…ظ„ط© ظˆط±ظ…ط²ظ‡ط§"
        : tab === "ط§ظ„ظˆط¸ط§ط¦ظپ"
          ? "ط§ط³ظ… ط§ظ„ظˆط¸ظٹظپط©"
          : "ط§ط³ظ… ظ…ط¹ظٹط§ط± ط§ظ„طھظ‚ظٹظٹظ…";
  const exportBackup = async (type = "full") => {
    if (canNode?.("system_backup", "can_export") === false) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھطµط¯ظٹط± ط§ظ„ظ†ط³ط® ط§ظ„ط§ط­طھظٹط§ط·ظٹط©");
    try {
      const backup = await backupService.createBackup({ type, createdBy: currentUser?.username || "" });
      const emailResult = await backupService.sendBackupToEmail(backup);
      alert(emailResult.sent ? "طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط© ظˆط¥ط±ط³ط§ظ„ظ‡ط§ ظ„ظ„ط¨ط±ظٹط¯." : emailResult.message);
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
        alert("طھظ… ط§ط³طھظٹط±ط§ط¯ ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط© ط¨ظ†ط¬ط§ط­.");
      } catch {
        alert("ظ…ظ„ظپ ط§ظ„ظ†ط³ط®ط© ط§ظ„ط§ط­طھظٹط§ط·ظٹط© ط؛ظٹط± طµط§ظ„ط­.");
      }
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  };
  return (
    <div className="space-y-5">
      <PageHead
        title="ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ…"
        desc="ط¥ط¶ط§ظپط© ظˆطھط¹ط¯ظٹظ„ ظˆط­ط°ظپ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط±ط¬ط¹ظٹط© ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ"
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={exportBackup} className="btn-secondary">
              <Download size={17} /> طھطµط¯ظٹط± ظ†ط³ط®ط© ط§ط­طھظٹط§ط·ظٹط©
            </button>
            <label className="btn-primary cursor-pointer">
              <Upload size={17} /> ط§ط³طھظٹط±ط§ط¯ ظ†ط³ط®ط©
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
          {tab === "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…" ? (
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
                  <h3 className="text-lg font-extrabold">ط¨ظٹط§ظ†ط§طھ ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…</h3>
                  <p className="text-xs text-slate-500">
                    ظٹطھظ… ط­ظپط¸ ط§ظ„طھط؛ظٹظٹط±ط§طھ طھظ„ظ‚ط§ط¦ظٹظ‹ط§ ظˆطھط¸ظ‡ط± ظپظٹ ط¬ظ…ظٹط¹ ط£ط¬ط²ط§ط، ط§ظ„ظ†ط¸ط§ظ…
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Label t="ط§ط³ظ… ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…">
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
                <Label t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…">
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
                <Label t="ط§ظ„ظ…ط³ظ…ظ‰ / ط§ظ„طµظ„ط§ط­ظٹط©">
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
                <span>طھظ… طھظپط¹ظٹظ„ ط§ظ„ط­ظپط¸ ط§ظ„طھظ„ظ‚ط§ط¦ظٹ ظ„ط¨ظٹط§ظ†ط§طھ ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ….</span>
                <Save size={18} />
              </div>
            </div>
          ) : isPermission ? (
            <PermissionsMatrix settings={settings} setSettings={setSettings} />
          ) : (
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div>
                  <h3 className="text-lg font-extrabold">ط¥ط¯ط§ط±ط© {tab}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    ط§ط®طھط± ط¹ظ†طµط±ظ‹ط§ ظ…ظ† ط§ظ„ظ‚ط§ط¦ظ…ط©طŒ ط«ظ… ط§ط³طھط®ط¯ظ… ط£ط²ط±ط§ط± ط§ظ„ط¥ط¶ط§ظپط© ط£ظˆ ط§ظ„طھط¹ط¯ظٹظ„
                    ط£ظˆ ط§ظ„ط­ط°ظپ.
                  </p>
                </div>
                <div className="mr-auto flex flex-wrap gap-2">
                  <button onClick={openAdd} className="btn-primary">
                    <Plus size={16} /> ط¥ط¶ط§ظپط©
                  </button>
                  <button
                    disabled={selected === null}
                    onClick={openEdit}
                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Pencil size={16} /> طھط¹ط¯ظٹظ„
                  </button>
                  <button
                    disabled={selected === null}
                    onClick={deleteItem}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={16} /> ط­ط°ظپ
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => {
                  const name = isPermission || isUser ? item.name : item,
                    description = isPermission
                      ? item.description
                      : isUser
                        ? `${item.username} â€¢ ${item.role}${item.employeeId ? ` â€¢ ${item.employeeId}` : ""}`
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
                          ظ…ط­ط¯ط¯
                        </span>
                      )}
                    </button>
                  );
                })}
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-400">
                    ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ. ط§ط¶ط؛ط· آ«ط¥ط¶ط§ظپط©آ» ظ„ط¥ظ†ط´ط§ط، ط£ظˆظ„ ط¹ظ†طµط±.
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
                {dialog.mode === "add" ? "ط¥ط¶ط§ظپط©" : "طھط¹ط¯ظٹظ„"} {tab}
              </h3>
              <button
                aria-label="ط¥ط؛ظ„ط§ظ‚"
                onClick={() => setDialog(null)}
                className="mr-auto"
              >
                <X />
              </button>
            </div>
            {isUser ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Label t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ظƒط§ظ…ظ„">
                  <input
                    autoFocus
                    value={dialog.name}
                    onChange={(e) =>
                      setDialog({ ...dialog, name: e.target.value })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="ط§ط³ظ… ط§ظ„ط¯ط®ظˆظ„">
                  <input
                    value={dialog.username}
                    onChange={(e) =>
                      setDialog({ ...dialog, username: e.target.value })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±">
                  <input
                    type="password"
                    value={dialog.password}
                    onChange={(e) =>
                      setDialog({ ...dialog, password: e.target.value })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="ط§ظ„طµظ„ط§ط­ظٹط©">
                  <select
                    value={dialog.role}
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
                <Label t="ط±ط¨ط· ط¨ط§ظ„ظ…ظˆط¸ظپ">
                  <select
                    value={dialog.employeeId}
                    onChange={(e) =>
                      setDialog({ ...dialog, employeeId: e.target.value })
                    }
                    className="field mt-2"
                  >
                    <option value="">ط؛ظٹط± ظ…ط±طھط¨ط·</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} â€” {employee.id}
                      </option>
                    ))}
                  </select>
                </Label>
              </div>
            ) : isPermission ? (
              <div className="space-y-4">
                <Label t="ط§ط³ظ… ط§ظ„طµظ„ط§ط­ظٹط©">
                  <input
                    autoFocus
                    value={dialog.name}
                    onChange={(e) =>
                      setDialog({ ...dialog, name: e.target.value })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="ظˆطµظپ ط§ظ„طµظ„ط§ط­ظٹط©">
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
                  placeholder={`ط£ط¯ط®ظ„ ${itemLabel}`}
                />
              </Label>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDialog(null)} className="btn-secondary">
                ط¥ظ„ط؛ط§ط،
              </button>
              <button onClick={saveItem} className="btn-primary">
                <Save size={17} /> ط­ظپط¸
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
    const item = {
      name: dialog.name.trim(),
      weight: Number(dialog.weight || 0),
      subWeights: {
        cash200: Number(dialog.subWeights?.cash200 || 0),
        cash500: Number(dialog.subWeights?.cash500 || 0),
        cash1000: Number(dialog.subWeights?.cash1000 || 0),
      },
    };
    if (dialog.mode === "add") next.push(item);
    else next[dialog.index] = item;
    updateJobCriteria(settings, setSettings, job, next);
    setDialog(null);
    setSelected(null);
  };
  const deleteCriterion = () => {
    if (selected === null || model.length <= 1) return;
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ظ…ط¹ظٹط§ط± ط§ظ„طھظ‚ظٹظٹظ… ط§ظ„ظ…ط­ط¯ط¯طں")) return;
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
        title="ظ†ظ…ط§ط°ط¬ ط§ظ„طھظ‚ظٹظٹظ…"
        desc="ظ…ط¹ط§ظٹظٹط± ظˆط£ظˆط²ط§ظ† ظ…ط³طھظ‚ظ„ط© ظ„ظƒظ„ ظˆط¸ظٹظپط©"
        action={
          <button onClick={balanceWeights} className="btn-secondary">
            <Gauge size={17} /> طھظˆط²ظٹط¹ ط§ظ„ط£ظˆط²ط§ظ† طھظ„ظ‚ط§ط¦ظٹظ‹ط§
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
              {getJobCriteria(settings, x).length} ظ…ط¹ط§ظٹظٹط± â€¢ 100 ظ†ظ‚ط·ط©
            </p>
          </button>
        ))}
      </div>
      <div className="panel p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold">ظ†ظ…ظˆط°ط¬ طھظ‚ظٹظٹظ…: {job}</h3>
            <p className="text-xs text-slate-500">
              ظ…ط¬ظ…ظˆط¹ ط§ظ„ط£ظˆط²ط§ظ† ط§ظ„ط­ط§ظ„ظٹ:{" "}
              <b className={totalWeight === 100 ? "text-emerald-600" : "text-red-600"}>{totalWeight}%</b>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setDialog({ mode: "add", name: "", weight: 10 })} className="btn-primary">
              <Plus size={16} /> ط¥ط¶ط§ظپط©
            </button>
            <button
              disabled={selected === null}
              onClick={() => setDialog({ mode: "edit", index: selected, ...model[selected] })}
              className="btn-secondary disabled:opacity-40"
            >
              <Pencil size={16} /> طھط¹ط¯ظٹظ„
            </button>
            <button
              disabled={selected === null}
              onClick={deleteCriterion}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 size={16} /> ط­ط°ظپ
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ظ…ط¹ظٹط§ط± ط§ظ„طھظ‚ظٹظٹظ…</th>
                <th>ط§ظ„ظˆط²ظ† ط§ظ„ظ†ط³ط¨ظٹ</th>
                <th>ط§ظ„ط¯ط±ط¬ط© ط§ظ„ظ‚طµظˆظ‰</th>
                <th>ط§ظ„ط­ط§ظ„ط©</th>
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
                        {c.subWeights && (
                          <p className="mt-1 text-[11px] font-normal text-slate-500">
                            ظپط¦ط§طھ ط§ظ„ظ†ظ‚ط¯: 200 = {c.subWeights.cash200 || 0}% â€¢ 500 = {c.subWeights.cash500 || 0}% â€¢ 1000 = {c.subWeights.cash1000 || 0}%
                          </p>
                        )}
                      </td>
                  <td>{c.weight}%</td>
                  <td>5 ط¯ط±ط¬ط§طھ</td>
                  <td>
                    <Status>ظ†ط´ط·</Status>
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
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="panel w-full max-w-md p-6">
        <div className="mb-5 flex items-center">
          <h3 className="text-lg font-extrabold">{dialog.mode === "add" ? "ط¥ط¶ط§ظپط© ظ…ط¹ظٹط§ط±" : "طھط¹ط¯ظٹظ„ ظ…ط¹ظٹط§ط±"}</h3>
          <button onClick={() => setDialog(null)} className="mr-auto">
            <X />
          </button>
        </div>
        <div className="grid gap-4">
          <Label t="ط§ط³ظ… ط§ظ„ظ…ط¹ظٹط§ط±">
            <input
              autoFocus
              value={dialog.name}
              onChange={(e) => setDialog({ ...dialog, name: e.target.value })}
              className="field mt-2"
            />
          </Label>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <b className="text-sm">ط£ظˆط²ط§ظ† ط§ظ„ظپط¦ط§طھ ط§ظ„ظ†ظ‚ط¯ظٹط© ظ„ظ„ط¹ط¯ط§ط¯</b>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                ["cash200", "ظپط¦ط© 200"],
                ["cash500", "ظپط¦ط© 500"],
                ["cash1000", "ظپط¦ط© 1000"],
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
          </div>
          <Label t="ط§ظ„ظˆط²ظ† ط§ظ„ظ†ط³ط¨ظٹ %">
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
            ط¥ظ„ط؛ط§ط،
          </button>
          <button onClick={onSave} className="btn-primary">
            <Save size={17} /> ط­ظپط¸
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
        const sub = c.subWeights
          ? ` <small>200: ${c.subWeights.cash200 || 0}% - 500: ${c.subWeights.cash500 || 0}% - 1000: ${c.subWeights.cash1000 || 0}%</small>`
          : "";
        return `<tr><td>${c.name}${sub}</td><td>${c.weight}%</td><td>${safeScores[i]}</td><td>${((safeScores[i] * c.weight) / 5).toFixed(1)}</td></tr>`;
      })
      .join("");
    printDocument(
      `طھظ‚ظٹظٹظ… ط£ط¯ط§ط، ط§ظ„ظ…ظˆط¸ظپ - ${emp?.name || empId}`,
      `<h1>طھظ‚ط±ظٹط± طھظ‚ظٹظٹظ… ط£ط¯ط§ط، ظ…ظˆط¸ظپ</h1>
       <div style="margin:14px 0;padding:14px;border:1px solid #d7dce3;border-radius:12px">
        <h2 style="margin:0 0 8px">ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ: ${emp?.name || ""}</h2>
        <p><b>Employee_ID:</b> ${emp?.id || empId || ""}</p>
        <p><b>ط§ظ„ظˆط¸ظٹظپط©:</b> ${emp?.job || ""} &nbsp; <b>ط§ظ„ظپط±ط¹:</b> ${emp?.branch || ""}</p>
        <p><b>ط´ظ‡ط± ط§ظ„طھظ‚ظٹظٹظ…:</b> ${month}</p>
       </div>
       <table><thead><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„ظˆط²ظ†</th><th>ط§ظ„ط¯ط±ط¬ط©</th><th>ط§ظ„ظ†طھظٹط¬ط©</th></tr></thead><tbody>${rows}</tbody></table>
       <h2>ط§ظ„ظ†طھظٹط¬ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط©: ${total}% - ${classify(total)}</h2>
       <p><b>ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„ظ…ط¯ظٹط±:</b> ${notes || "ظ„ط§ طھظˆط¬ط¯ ظ…ظ„ط§ط­ط¸ط§طھ"}</p>`,
    );
  };
  useEffect(() => {
    if (typeof window === "undefined") return;
    const rows = model
      .map((c, i) => {
        const sub = c.subWeights
          ? ` <small>200: ${c.subWeights.cash200 || 0}% - 500: ${c.subWeights.cash500 || 0}% - 1000: ${c.subWeights.cash1000 || 0}%</small>`
          : "";
        return `<tr><td>${c.name}${sub}</td><td>${c.weight}%</td><td>${safeScores[i]}</td><td>${((safeScores[i] * c.weight) / 5).toFixed(1)}</td></tr>`;
      })
      .join("");
    window.__activeEvaluationReport = {
      employeeId: emp?.id || empId,
      title: `طھظ‚ظٹظٹظ… ط£ط¯ط§ط، ط§ظ„ظ…ظˆط¸ظپ - ${emp?.name || empId}`,
      body: `<h1>طھظ‚ط±ظٹط± طھظ‚ظٹظٹظ… ط£ط¯ط§ط، ظ…ظˆط¸ظپ</h1>
       <div style="margin:14px 0;padding:14px;border:1px solid #d7dce3;border-radius:12px">
        <h2 style="margin:0 0 8px">ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ: ${emp?.name || ""}</h2>
        <p><b>Employee_ID:</b> ${emp?.id || empId || ""}</p>
        <p><b>ط§ظ„ظˆط¸ظٹظپط©:</b> ${emp?.job || ""} &nbsp; <b>ط§ظ„ظپط±ط¹:</b> ${emp?.branch || ""}</p>
        <p><b>ط´ظ‡ط± ط§ظ„طھظ‚ظٹظٹظ…:</b> ${month}</p>
       </div>
       <table><thead><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„ظˆط²ظ†</th><th>ط§ظ„ط¯ط±ط¬ط©</th><th>ط§ظ„ظ†طھظٹط¬ط©</th></tr></thead><tbody>${rows}</tbody></table>
       <h2>ط§ظ„ظ†طھظٹط¬ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط©: ${total}% - ${classify(total)}</h2>
       <p><b>ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„ظ…ط¯ظٹط±:</b> ${notes || "ظ„ط§ طھظˆط¬ط¯ ظ…ظ„ط§ط­ط¸ط§طھ"}</p>`,
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
      status: old?.status || "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©",
      notes,
    };
    setEvaluations((list) =>
      old ? list.map((e) => (e.id === old.id ? record : e)) : [record, ...list],
    );
    alert(old ? "طھظ… طھط¹ط¯ظٹظ„ ط§ظ„طھظ‚ظٹظٹظ… ط§ظ„ط³ط§ط¨ظ‚" : "طھظ… ط­ظپط¸ ط§ظ„طھظ‚ظٹظٹظ…");
  };
  const saveCriterion = () => {
    if (!dialog?.name?.trim() || !emp?.job) return;
    const next = [...model];
    const item = {
      name: dialog.name.trim(),
      weight: Number(dialog.weight || 0),
      subWeights: {
        cash200: Number(dialog.subWeights?.cash200 || 0),
        cash500: Number(dialog.subWeights?.cash500 || 0),
        cash1000: Number(dialog.subWeights?.cash1000 || 0),
      },
    };
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
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ…ط¹ظٹط§ط± ظ…ظ† ظ†ظ…ظˆط°ط¬ ط§ظ„ظˆط¸ظٹظپط©طں")) return;
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
        title="طھظ‚ظٹظٹظ… ط£ط¯ط§ط، ط§ظ„ظ…ظˆط¸ظپظٹظ†"
        desc="ظٹط¹ط±ط¶ ط§ظ„ظ†ظ…ظˆط°ط¬ ط§ظ„ظ…ظ†ط§ط³ط¨ طھظ„ظ‚ط§ط¦ظٹظ‹ط§ ط­ط³ط¨ ظˆط¸ظٹظپط© ط§ظ„ظ…ظˆط¸ظپ ظ…ط¹ ط¥ظ…ظƒط§ظ†ظٹط© طھط¹ط¯ظٹظ„ ط§ظ„ظ…ط¹ط§ظٹظٹط± ظˆط§ظ„ط£ظˆط²ط§ظ†"
        action={
          <button
            onClick={() =>
              printDocument(
                "طھظ‚ظٹظٹظ… ط£ط¯ط§ط، ط§ظ„ظ…ظˆط¸ظپ",
                `<h1>طھظ‚ظٹظٹظ… ط£ط¯ط§ط، ط§ظ„ظ…ظˆط¸ظپ</h1><p>${emp?.name || ""} - ${emp?.job || ""}</p><table><thead><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„ظˆط²ظ†</th><th>ط§ظ„ط¯ط±ط¬ط©</th><th>ط§ظ„ظ†طھظٹط¬ط©</th></tr></thead><tbody>${model
                  .map((c, i) => `<tr><td>${c.name}</td><td>${c.weight}%</td><td>${safeScores[i]}</td><td>${((safeScores[i] * c.weight) / 5).toFixed(1)}</td></tr>`)
                  .join("")}</tbody></table><h2>ط§ظ„ظ†طھظٹط¬ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط©: ${total}% - ${classify(total)}</h2><p>${notes || ""}</p>`,
              )
            }
            className="btn-secondary"
          >
            <Printer size={17} /> ط·ط¨ط§ط¹ط© / PDF
          </button>
        }
      />
      <div className="panel grid gap-4 p-5 md:grid-cols-3">
        <Label t="ط§ظ„ظ…ظˆط¸ظپ">
	          <select value={empId} onChange={(e) => changeEmployee(e.target.value)} className="field mt-2">
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Label>
        <Label t="ط´ظ‡ط± ط§ظ„طھظ‚ظٹظٹظ…">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="field mt-2" />
        </Label>
        <Label t="ط§ظ„ظˆط¸ظٹظپط©">
          <input value={emp?.job || ""} disabled className="field mt-2 bg-slate-50" />
        </Label>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_290px]">
        <div className="panel p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={() => setDialog({ mode: "add", name: "", weight: 10 })} className="btn-primary">
              <Plus size={16} /> ط¥ط¶ط§ظپط© ظ…ط¹ظٹط§ط±
            </button>
            <button disabled={selected === null} onClick={() => setDialog({ mode: "edit", index: selected, ...model[selected] })} className="btn-secondary disabled:opacity-40">
              <Pencil size={16} /> طھط¹ط¯ظٹظ„ ط§ظ„ظ…ط¹ظٹط§ط±/ط§ظ„ظˆط²ظ†
            </button>
            <button disabled={selected === null} onClick={deleteCriterion} className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-40">
              <Trash2 size={16} /> ط­ط°ظپ
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ط§ظ„ظ…ط¹ظٹط§ط±</th>
                  <th>ط§ظ„ظˆط²ظ†</th>
                  <th>ط§ظ„ط¯ط±ط¬ط© ظ…ظ† 5</th>
                  <th>ط§ظ„ظ†طھظٹط¬ط©</th>
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
          <Label t="ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„ظ…ط¯ظٹط±">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="field mt-2 !h-auto py-3" />
          </Label>
        </div>
        <div className="space-y-4">
          <div className="panel p-6 text-center">
            <div className="mx-auto mb-4 grid h-32 w-32 place-items-center rounded-full border-[10px] border-brand-100">
              <b className="text-4xl text-brand-700">{total}%</b>
            </div>
            <Status>{classify(total)}</Status>
            <p className="mt-4 text-xs leading-5 text-slate-500">ظ…ط­ط³ظˆط¨ ط­ط³ط¨ ظ†ظ…ظˆط°ط¬ ظˆط¸ظٹظپط© {emp?.job}</p>
          </div>
          <button onClick={save} className="btn-primary h-12 w-full">
            <Save size={18} /> ط­ظپط¸ ط§ظ„طھظ‚ظٹظٹظ…
          </button>
          <p className="rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
            ظˆط¬ظˆط¯ طھظ‚ظٹظٹظ… ظ„ظ†ظپط³ ط§ظ„ط´ظ‡ط± ظٹط¤ط¯ظٹ ط¥ظ„ظ‰ طھط¹ط¯ظٹظ„ ط§ظ„ط³ط¬ظ„ ط§ظ„ط³ط§ط¨ظ‚طŒ ظ„ط§ ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ظ…ظƒط±ط±ط©.
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
    return status.includes("ظ…ط¹طھظ…ط¯") || status.includes("ط¸â€¦ط·آ¹ط·ع¾ط¸â€¦ط·آ¯");
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
      "ط´ظ‡ط§ط¯ط© ظ…ظˆط¸ظپ ط§ظ„ط´ظ‡ط±",
      `<div class="cert"><h1 class="brand">ط´ظ‡ط§ط¯ط© طھظ‚ط¯ظٹط±</h1><p class="muted">طھظ…ظ†ط­ ظ‡ط°ظ‡ ط§ظ„ط´ظ‡ط§ط¯ط© ط¥ظ„ظ‰</p><p class="big">${employee.name || ""}</p><p>ظˆط°ظ„ظƒ ظ„طھظ…ظٹط²ظ‡ ظپظٹ ط§ظ„ط£ط¯ط§ط، ظˆطھط­ظ‚ظٹظ‚ظ‡ ظ†طھظٹط¬ط© ${employee.total || 0}% ط®ظ„ط§ظ„ ط§ظ„ط´ظ‡ط±.</p><h3>${employee.job || ""} - ${employee.branch || ""}</h3><p class="muted">ظ†ط¸ط§ظ… طھظ‚ظٹظٹظ… ظˆطھط­ظپظٹط² ط§ظ„ظ…ظˆط¸ظپظٹظ†</p></div>`,
    );
  return (
    <div className="space-y-5">
      <PageHead
        title="ظ…ظˆط¸ظپ ط§ظ„ط´ظ‡ط±"
        desc="طھط±طھظٹط¨ ط¯ظ‚ظٹظ‚ ظ„ط£ظپط¶ظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط­ط³ط¨ ط£ط¹ظ„ظ‰ ظ†طھظٹط¬ط© طھظ‚ظٹظٹظ…"
        action={
          <button onClick={() => printCertificate(best)} className="btn-secondary">
            <Printer size={17} /> ط·ط¨ط§ط¹ط© ط´ظ‡ط§ط¯ط© ط§ظ„ظ…ظˆط¸ظپ ط§ظ„ط£ظˆظ„
          </button>
        }
      />
      <div className="rounded-3xl bg-gradient-to-l from-brand-900 to-[#26151a] p-8 text-white">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="grid h-28 w-28 place-items-center rounded-full border-4 border-amber-300 bg-white/10 text-3xl font-bold">
            {best.name?.split(" ").slice(0, 2).map((x) => x[0]).join("")}
          </div>
          <div>
            <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">ط§ظ„ط£ظپط¶ظ„ ط¹ظ„ظ‰ ظ…ط³طھظˆظ‰ ط§ظ„ط´ط±ظƒط©</span>
            <h2 className="mt-4 text-3xl font-extrabold">{best.name}</h2>
            <p className="mt-2 text-red-100/70">{best.job} â€¢ {best.branch}</p>
            <p className="mt-4 text-sm text-red-100/80">ط³ط¨ط¨ ط§ظ„ط§ط®طھظٹط§ط±: ط£ط¹ظ„ظ‰ ظ†طھظٹط¬ط© طھظ‚ظٹظٹظ… ظ…ط¹ ط§ظ„ط§ظ„طھط²ط§ظ… ظˆط§ظ„ط§ظ†ط¶ط¨ط§ط· ظˆط¬ظˆط¯ط© ط§ظ„ط£ط¯ط§ط،.</p>
          </div>
          <b className="sm:mr-auto text-5xl text-amber-300">{best.total}%</b>
        </div>
      </div>
      <div className="panel p-5">
        <h3 className="mb-4 text-lg font-extrabold">ط£ظپط¶ظ„ ظ…ظˆط¸ظپ ظپظٹ ظƒظ„ ظپط±ط¹</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {winners.map((x, i) => (
            <div key={`${x.branch}-${x.id}`} className="rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 font-bold text-brand-700">{i + 1}</div>
                <div>
                  <b>{x.name}</b>
                  <p className="text-xs text-slate-500">{x.branch} â€¢ {x.job}</p>
                </div>
                <b className="mr-auto text-xl text-brand-700">{x.total}%</b>
              </div>
              <button onClick={() => printCertificate(x)} className="btn-secondary mt-4 w-full">
                <Printer size={15} /> ط·ط¨ط§ط¹ط© ط´ظ‡ط§ط¯ط© ظ„ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپ ظپظ‚ط·
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="panel p-5">
        <h3 className="mb-4 text-lg font-extrabold">طھط±طھظٹط¨ ط£ظپط¶ظ„ 10 ظ…ظˆط¸ظپظٹظ†</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ط§ظ„طھط±طھظٹط¨</th><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„ظˆط¸ظٹظپط©</th><th>ط§ظ„ظ†طھظٹط¬ط©</th></tr></thead>
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
        reason: "ط§ظ†ط®ظپط§ط¶ ظ†طھظٹط¬ط© ط§ظ„طھظ‚ظٹظٹظ… ط¹ظ† 70%",
        weaknesses: "ط§ظ„ط¯ظ‚ط© ظˆط³ط±ط¹ط© ط§ظ„ط¥ظ†ط¬ط§ط²",
        plan: "ط¬ظ„ط³ط§طھ ظ…طھط§ط¨ط¹ط© ط£ط³ط¨ظˆط¹ظٹط© ظˆطھط¯ط±ظٹط¨ ط¹ظ…ظ„ظٹ ط¹ظ„ظ‰ ظ†ظ‚ط§ط· ط§ظ„ط¶ط¹ظپ",
        owner: "ظ…ط¯ظٹط± ط§ظ„ظپط±ط¹",
        start: "2026-07-01",
        end: "2026-07-31",
        result: "ظ‚ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©",
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
      alert("ظ‡ط°ظ‡ ط®ط·ط© ظ…ظ‚طھط±ط­ط© طھظ„ظ‚ط§ط¦ظٹظ‹ط§. ط£ظ†ط´ط¦ ط®ط·ط© ظپط¹ظ„ظٹط© ط£ظˆ ط¹ط¯ظ‘ظ„ظ‡ط§ ط£ظˆظ„ظ‹ط§ ط«ظ… ظٹظ…ظƒظ†ظƒ ط­ط°ظپظ‡ط§ ظ„ط§ط­ظ‚ظ‹ط§.");
      return;
    }
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط®ط·ط© ط§ظ„طھط­ط³ظٹظ†طں")) return;
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
      owner: plan.owner || "ظ…ط¯ظٹط± ط§ظ„ظپط±ط¹",
      start: plan.start || "2026-07-01",
      end: plan.end || "2026-07-31",
      result: plan.result || "ظ‚ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©",
      auto: false,
    });
  return (
    <div className="space-y-5">
      <PageHead
        title="ط®ط·ط· طھط­ط³ظٹظ† ط§ظ„ط£ط¯ط§ط،"
        desc="ط¥ط¶ط§ظپط© ظˆطھط¹ط¯ظٹظ„ ظˆط­ط°ظپ ط®ط·ط· طھط­ط³ظٹظ† ط§ظ„ظ…ظˆط¸ظپظٹظ† ط§ظ„ط£ظ‚ظ„ ظ…ظ† 70%"
        action={
          <button onClick={() => openPlan()} className="btn-primary">
            <Plus size={17} /> ط®ط·ط© طھط­ط³ظٹظ†
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
                <p className="text-xs text-slate-500">{p.employee?.job} â€¢ {p.employee?.branch}</p>
              </div>
              <div className="mr-auto flex gap-2">
                <button onClick={() => openPlan(p)} className="btn-secondary !h-9 !px-3"><Pencil size={15} /></button>
                <button onClick={() => deletePlan(p)} className="inline-flex h-9 items-center rounded-xl border border-red-200 px-3 text-red-600"><Trash2 size={15} /></button>
              </div>
            </div>
            <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs">
              <Info t="ط³ط¨ط¨ ط§ظ„ط§ظ†ط®ظپط§ط¶" v={p.reason} />
              <Info t="ط§ظ„ظ…ط³ط¤ظˆظ„" v={p.owner} />
              <Info t="ط¨ط¯ط§ظٹط© ط§ظ„ط®ط·ط©" v={p.start} />
              <Info t="ظ†ظ‡ط§ظٹط© ط§ظ„ط®ط·ط©" v={p.end} />
              <Info t="ظ†ظ‚ط§ط· ط§ظ„ط¶ط¹ظپ" v={p.weaknesses} />
              <Info t="ظ†طھظٹط¬ط© ط§ظ„ظ…طھط§ط¨ط¹ط©" v={p.result} />
            </div>
            <p className="rounded-xl bg-white p-3 text-sm text-slate-600">{p.plan}</p>
          </div>
        ))}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel w-full max-w-3xl p-6">
            <div className="mb-5 flex items-center">
              <h3 className="text-lg font-extrabold">{dialog.mode === "add" ? "ط¥ط¶ط§ظپط© ط®ط·ط© طھط­ط³ظٹظ†" : "طھط¹ط¯ظٹظ„ ط®ط·ط© طھط­ط³ظٹظ†"}</h3>
              <button onClick={() => setDialog(null)} className="mr-auto"><X /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Label t="ط§ظ„ظ…ظˆط¸ظپ"><select value={dialog.employeeId} onChange={(e) => setDialog({ ...dialog, employeeId: e.target.value })} className="field mt-2">{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Label>
              <Label t="ط§ظ„ظ…ط³ط¤ظˆظ„ ط¹ظ† ط§ظ„ظ…طھط§ط¨ط¹ط©"><input value={dialog.owner} onChange={(e) => setDialog({ ...dialog, owner: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط³ط¨ط¨ ط§ظ†ط®ظپط§ط¶ ط§ظ„ط£ط¯ط§ط،"><input value={dialog.reason} onChange={(e) => setDialog({ ...dialog, reason: e.target.value })} className="field mt-2" /></Label>
              <Label t="ظ†ظ‚ط§ط· ط§ظ„ط¶ط¹ظپ"><input value={dialog.weaknesses} onChange={(e) => setDialog({ ...dialog, weaknesses: e.target.value })} className="field mt-2" /></Label>
              <Label t="طھط§ط±ظٹط® ط¨ط¯ط§ظٹط© ط§ظ„ط®ط·ط©"><input type="date" value={dialog.start} onChange={(e) => setDialog({ ...dialog, start: e.target.value })} className="field mt-2" /></Label>
              <Label t="طھط§ط±ظٹط® ظ†ظ‡ط§ظٹط© ط§ظ„ط®ط·ط©"><input type="date" value={dialog.end} onChange={(e) => setDialog({ ...dialog, end: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط®ط·ط© ط§ظ„طھط­ط³ظٹظ†"><textarea value={dialog.plan} onChange={(e) => setDialog({ ...dialog, plan: e.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
              <Label t="ظ†طھظٹط¬ط© ط§ظ„ظ…طھط§ط¨ط¹ط©"><textarea value={dialog.result} onChange={(e) => setDialog({ ...dialog, result: e.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDialog(null)} className="btn-secondary">ط¥ظ„ط؛ط§ط،</button>
              <button onClick={savePlan} className="btn-primary"><Save size={17} /> ط­ظپط¸ ط§ظ„ط®ط·ط©</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnhancedReports({ employees, evaluations }) {
  const reps = [
    ["ط§ظ„طھظ‚ط±ظٹط± ط§ظ„ظ…ط§ظ„ظٹ ظ„ظ„ط£ط¯ط§ط، ط§ظ„ط´ظ‡ط±ظٹ", Wallet],
    ["ط§ظ„طھظ‚ظٹظٹظ… ط§ظ„ط´ظ‡ط±ظٹ", CalendarCheck],
    ["ط§ظ„طھظ‚ظٹظٹظ… ط­ط³ط¨ ط§ظ„ظپط±ط¹", Building2],
    ["ط§ظ„طھظ‚ظٹظٹظ… ط­ط³ط¨ ط§ظ„ظˆط¸ظٹظپط©", BriefcaseBusiness],
    ["طھظ‚ط±ظٹط± ط§ظ„ط­ظˆط§ظپط²", Gift],
    ["ط§ظ„ظ…ظˆط¸ظپظˆظ† ط§ظ„ط¶ط¹ظپط§ط،", AlertTriangle],
    ["ط£ظپط¶ظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ†", Trophy],
    ["طھظ‚ط±ظٹط± ط§ظ„ط§ظ†ط¶ط¨ط§ط·", Clock3],
    ["طھظ‚ط±ظٹط± ط§ظ„ظ…ط®ط§ظ„ظپط§طھ", MessageSquareWarning],
    ["ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ظپط±ظˆط¹", FileBarChart],
  ];
  const [month, setMonth] = useState("2026-06");
  const [branch, setBranch] = useState("all");
  const rowsFor = (title) => {
    const joined = evaluations.map((ev) => ({ ...ev, employee: employees.find((e) => e.id === ev.employeeId) })).filter((x) => x.employee);
    const filtered = joined.filter((x) => (month ? x.month === month : true) && (branch === "all" ? true : x.employee.branch === branch));
    if (title.includes("ط§ظ„ظ…ط§ظ„ظٹ"))
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
    if (title === "طھظ‚ط±ظٹط± ط§ظ„ط­ظˆط§ظپط²") return calcIncentivesSafe(employees, filtered);
    if (title === "ط§ظ„ظ…ظˆط¸ظپظˆظ† ط§ظ„ط¶ط¹ظپط§ط،") return filtered.filter((x) => x.total < 70);
    if (title === "ط£ظپط¶ظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ†") return [...filtered].sort((a, b) => effectiveEvaluationTotal(b) - effectiveEvaluationTotal(a)).slice(0, 10);
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
      `<h1>${title}</h1><p>ط§ظ„ط´ظ‡ط±: ${month} - ط§ظ„ظپط±ط¹: ${branch === "all" ? "ط¬ظ…ظٹط¹ ط§ظ„ظپط±ظˆط¹" : branch}</p><table><thead><tr><th>#</th><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„ظˆط¸ظٹظپط©</th><th>ط§ظ„ط´ظ‡ط±</th><th>ط§ظ„ظ‚ظٹظ…ط©/ط§ظ„ظ†طھظٹط¬ط©</th></tr></thead><tbody>${printableRows(rows)}</tbody></table>`,
    );
  };
  return (
    <div className="space-y-5">
      <PageHead title="ظ…ط±ظƒط² ط§ظ„طھظ‚ط§ط±ظٹط±" desc="ط·ط¨ط§ط¹ط© ط£ظˆ طھطµط¯ظٹط± ط§ظ„طھظ‚ط±ظٹط± ط§ظ„ظ…ط­ط¯ط¯ ظپظ‚ط·" />
      <div className="panel flex flex-wrap gap-3 p-4">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="field max-w-[180px]" />
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className="field max-w-[190px]">
          <option value="all">ط¬ظ…ظٹط¹ ط§ظ„ظپط±ظˆط¹</option>
          {branches.map((x) => <option key={x}>{x}</option>)}
        </select>
        <span className="rounded-xl bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700">ظƒظ„ ط²ط± PDF ظٹط·ط¨ط¹ ط§ظ„طھظ‚ط±ظٹط± ط§ظ„ط®ط§طµ ط¨ظ‡ ظپظ‚ط·</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reps.map(([t, I]) => (
          <div key={t} className="panel p-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-brand-700"><I /></div>
            <h3 className="mt-4 font-extrabold">{t}</h3>
            <p className="mt-1 text-xs text-slate-500">طھظ‚ط±ظٹط± طھظپطµظٹظ„ظٹ ط¬ط§ظ‡ط² ظ„ظ„طھطµط¯ظٹط± ظˆط§ظ„ط·ط¨ط§ط¹ط© ط­ط³ط¨ ط§ظ„ظپظ„ط§طھط± ط§ظ„ظ…ط®طھط§ط±ط©</p>
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

function EnhancedEmployees({ employees, setEmployees, setEvaluations }) {
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("ط§ظ„ظƒظ„");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState([]);
  const filtered = employees.filter(
    (e) =>
      (e.name.includes(q) || e.id.toLowerCase().includes(q.toLowerCase())) &&
      (branch === "ط§ظ„ظƒظ„" || e.branch === branch),
  );
  const toggle = (id) =>
    setSelected((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  const deleteSelected = () => {
    if (!selected.length) return;
    if (!confirm(`ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ${selected.length} ظ…ظˆط¸ظپ/ظ…ظˆط¸ظپظٹظ† ظ…ظ† ط§ظ„ط³ط¬ظ„طں`)) return;
    setEmployees((list) => list.filter((e) => !selected.includes(e.id)));
    setEvaluations?.((list) => list.filter((e) => !selected.includes(e.employeeId)));
    setSelected([]);
  };
  return (
    <div className="space-y-5">
      <PageHead
        title="ط³ط¬ظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ†"
        desc={`ط¥ط¯ط§ط±ط© ط¨ظٹط§ظ†ط§طھ ${employees.length} ظ…ظˆط¸ظپ ظ…ط¹ ط¥ظ…ظƒط§ظ†ظٹط© ط§ظ„ط­ط°ظپ ط§ظ„ظ…طھط¹ط¯ط¯`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!selected.length}
              onClick={deleteSelected}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 size={17} /> ط­ط°ظپ ط§ظ„ظ…ط­ط¯ط¯ ({selected.length})
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setModal(true);
              }}
              className="btn-primary"
            >
              <Plus size={18} /> ط¥ط¶ط§ظپط© ظ…ظˆط¸ظپ
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
              placeholder="ط§ط¨ط­ط« ط¨ط§ظ„ط§ط³ظ… ط£ظˆ ط§ظ„ط±ظ‚ظ…..."
            />
          </label>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="field max-w-[190px]">
            <option>ط§ظ„ظƒظ„</option>
            {branches.map((x) => <option key={x}>{x}</option>)}
          </select>
          <button onClick={() => exportExcel(filtered, "ط§ظ„ظ…ظˆط¸ظپظˆظ†")} className="btn-secondary">
            <FileSpreadsheet size={17} /> طھطµط¯ظٹط± Excel
          </button>
          <label className="btn-secondary cursor-pointer">
            <Upload size={17} /> ط§ط³طھظٹط±ط§ط¯
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
                <th>ط§ظ„ظ…ظˆط¸ظپ</th>
                <th>ط§ظ„ظپط±ط¹</th>
                <th>ط§ظ„ظˆط¸ظٹظپط©</th>
                <th>طھط§ط±ظٹط® ط§ظ„طھط¹ظٹظٹظ†</th>
                <th>ط§ظ„ط±ط§طھط¨</th>
                <th>ط§ظ„ط­ط§ظ„ط©</th>
                <th>ط§ظ„ظ…ط¯ظٹط± ط§ظ„ظ…ط¨ط§ط´ط±</th>
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
                        <p className="text-xs text-slate-400">{e.id} â€¢ {e.phone}</p>
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
                        if (!confirm(`ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط§ظ„ظ…ظˆط¸ظپ ${e.name}طں`)) return;
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
      {modal && <EmployeeModal editing={editing} close={() => setModal(false)} setEmployees={setEmployees} />}
    </div>
	  );
	}
	
const guaranteeStatuses = ["ط³ط§ط±ظٹط©", "ظ…ظ†طھظ‡ظٹط©", "ظ†ط§ظ‚طµط©", "ظ…ظˆظ‚ظˆظپط©"];
const overtimeStatuses = ["ظ…ظƒظ„ظپ", "طھظ… ط§ظ„ط¥ط±ط³ط§ظ„", "ظ…ط¹طھط°ط±", "ظ…ظ†ظپط°", "ظ…ظ„ط؛ظٹ"];
const arabicDayName = (date) =>
  date
    ? new Intl.DateTimeFormat("ar-SA", { weekday: "long" }).format(new Date(date))
    : "";
const normalizeWhatsAppPhone = (phone) => String(phone || "").replace(/[^\d]/g, "").replace(/^0/, "966");
const makeOvertimeMessage = (assignment, employee) =>
  `ط§ظ„ط£ط®/ ط§ظ„ظ…ظˆط¸ظپ: ${employee.employee_name}

طھط­ظٹط© ط·ظٹط¨ط©طŒ

ظ†ط­ظٹط·ظƒظ… ط¹ظ„ظ…ط§ظ‹ ط¨ط£ظ†ظ‡ طھظ… طھظƒظ„ظٹظپظƒظ… ط¨ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ ظٹظˆظ… ${arabicDayName(assignment.assignment_date)} ط§ظ„ظ…ظˆط§ظپظ‚ ${assignment.assignment_date}ظ…طŒ ظˆط°ظ„ظƒ ظپظٹ ${assignment.location} ظ…ظ† ط§ظ„ط³ط§ط¹ط© ${assignment.start_time} ط­طھظ‰ ط§ظ„ط³ط§ط¹ط© ${assignment.end_time}.

- ظٹط±ط¬ظ‰ ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط¥ط«ط¨ط§طھ ط§ظ„ط­ط¶ظˆط± ظˆط§ظ„ط§ظ†طµط±ط§ظپ ط¹ط¨ط± ط¨طµظ…ط© ط§ظ„ط¬ظˆط§ظ„ ًں“Œ.
- ظٹط±ط¬ظ‰ ظƒط°ظ„ظƒ ط±ظپط¹ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ ظپظٹ ط§ظ„ظ†ط¸ط§ظ… ط­ط³ط¨ ط§ظ„ط¥ط¬ط±ط§ط، ط§ظ„ظ…ط¹طھظ…ط¯ ًں“Œ.

ط´ط§ظƒط±ظٹظ† ظ„ظƒظ… طھط¹ط§ظˆظ†ظƒظ… ظˆط§ظ„طھط²ط§ظ…ظƒظ….
ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©`;
const tableColumnsGuarantees = [
  { key: "employee_name", label: "ط§ظ„ظ…ظˆط¸ظپ" },
  { key: "employee_id", label: "ط±ظ‚ظ… ط§ظ„ظ…ظˆط¸ظپ" },
  { key: "branch", label: "ط§ظ„ظپط±ط¹" },
  { key: "guarantor_name", label: "ط§ط³ظ… ط§ظ„ط¶ط§ظ…ظ†" },
  { key: "commercial_register_number", label: "ط§ظ„ط³ط¬ظ„ ط§ظ„طھط¬ط§ط±ظٹ" },
  { key: "guarantee_date", label: "طھط§ط±ظٹط® ط§ظ„ط¶ظ…ط§ظ†ط©" },
  { key: "guarantee_status", label: "ط§ظ„ط­ط§ظ„ط©" },
];
const tableColumnsOvertime = [
  { key: "assignment_date", label: "ط§ظ„طھط§ط±ظٹط®" },
  { key: "employee_name", label: "ط§ظ„ظ…ظˆط¸ظپ" },
  { key: "branch", label: "ط§ظ„ظپط±ط¹" },
  { key: "job", label: "ط§ظ„ظˆط¸ظٹظپط©" },
  { key: "start_time", label: "ظ…ظ†" },
  { key: "end_time", label: "ط¥ظ„ظ‰" },
  { key: "status", label: "ط§ظ„ط­ط§ظ„ط©" },
];

function EmployeeGuaranteesPage({ employees, currentUser, can }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [filters, setFilters] = useState({ q: "", branch: "all", status: "all", month: "" });
  const canCreate = can?.("guarantees", "can_create") !== false;
  const canEdit = can?.("guarantees", "can_edit") !== false;
  const canDelete = can?.("guarantees", "can_delete") !== false;
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await guaranteesService.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    return guaranteesService.subscribe(load);
  }, []);
  const filtered = items.filter((g) => {
    const q = filters.q.trim();
    const textOk =
      !q ||
      g.employee_name.includes(q) ||
      g.employee_id.includes(q) ||
      g.guarantor_name.includes(q);
    const branchOk = filters.branch === "all" || g.branch === filters.branch;
    const statusOk = filters.status === "all" || g.guarantee_status === filters.status;
    const monthOk = !filters.month || String(g.guarantee_date || "").startsWith(filters.month);
    return textOk && branchOk && statusOk && monthOk;
  });
  const activeEmployeeIds = new Set(items.filter((g) => g.guarantee_status === "ط³ط§ط±ظٹط©").map((g) => g.employee_id));
  const cards = [
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¶ظ…ط§ظ†ط§طھ", items.length, ShieldCheck],
    ["ط§ظ„ط¶ظ…ط§ظ†ط§طھ ط§ظ„ط³ط§ط±ظٹط©", items.filter((g) => g.guarantee_status === "ط³ط§ط±ظٹط©").length, BadgeCheck],
    ["ط§ظ„ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظ†طھظ‡ظٹط©", items.filter((g) => g.guarantee_status === "ظ…ظ†طھظ‡ظٹط©").length, AlertTriangle],
    ["ط§ظ„ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ†ط§ظ‚طµط©", items.filter((g) => g.guarantee_status === "ظ†ط§ظ‚طµط©").length, FileBarChart],
    ["ط§ظ„ظ…ظˆط¸ظپظˆظ† ط¨ط¯ظˆظ† ط¶ظ…ط§ظ†ط©", employees.filter((e) => !activeEmployeeIds.has(e.id)).length, Users],
  ];
  const openAdd = () => {
    if (!canCreate) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
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
      guarantee_status: "ط³ط§ط±ظٹط©",
      notes: "",
    });
  };
  const selectEmployee = (id) => {
    const employee = employees.find((e) => e.id === id);
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
    if (!canEdit && items.some((g) => g.guarantee_id === dialog.guarantee_id)) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (!canCreate && !items.some((g) => g.guarantee_id === dialog.guarantee_id)) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    const required = [
      ["employee_id", "ط§ظ„ظ…ظˆط¸ظپ"],
      ["guarantor_name", "ط§ط³ظ… ط§ظ„ط¶ط§ظ…ظ†"],
      ["guarantor_id_number", "ط±ظ‚ظ… ظ‡ظˆظٹط© ط§ظ„ط¶ط§ظ…ظ†"],
      ["commercial_register_number", "ط±ظ‚ظ… ط§ظ„ط³ط¬ظ„ ط§ظ„طھط¬ط§ط±ظٹ"],
      ["guarantee_date", "طھط§ط±ظٹط® ط§ظ„ط¶ظ…ط§ظ†ط©"],
    ].filter(([key]) => !dialog[key]);
    if (required.length) return alert(`ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط·ظ„ظˆط¨ط©: ${required.map((x) => x[1]).join("طŒ ")}`);
    const duplicateGuarantor = items.find(
      (g) =>
        g.guarantee_id !== dialog.guarantee_id &&
        g.guarantee_status === "ط³ط§ط±ظٹط©" &&
        g.guarantor_id_number === dialog.guarantor_id_number &&
        g.employee_id !== dialog.employee_id,
    );
    if (duplicateGuarantor) return alert("ظ„ط§ ظٹظ…ظƒظ† ط§ط³طھط®ط¯ط§ظ… ظ†ظپط³ ط±ظ‚ظ… ظ‡ظˆظٹط© ط§ظ„ط¶ط§ظ…ظ† ظ„ط£ظƒط«ط± ظ…ظ† ظ…ظˆط¸ظپ ظ†ط´ط·.");
    const duplicateRegister = items.find(
      (g) =>
        g.guarantee_id !== dialog.guarantee_id &&
        g.guarantee_status === "ط³ط§ط±ظٹط©" &&
        g.commercial_register_number === dialog.commercial_register_number &&
        g.employee_id !== dialog.employee_id,
    );
    if (duplicateRegister && !confirm("ط±ظ‚ظ… ط§ظ„ط³ط¬ظ„ ط§ظ„طھط¬ط§ط±ظٹ ظ…ط³طھط®ط¯ظ… ظ„ظ…ظˆط¸ظپ ظ†ط´ط· ط¢ط®ط±. ظ‡ظ„ طھط±ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©طں")) return;
    try {
      const saved = await guaranteesService.upsert(dialog);
      auditService.log({
        user_id: currentUser?.user_id || currentUser?.username,
        user_name: currentUser?.username || currentUser?.name,
        action: items.some((g) => g.guarantee_id === dialog.guarantee_id) ? "طھط¹ط¯ظٹظ„ ط¶ظ…ط§ظ†ط©" : "ط¥ط¶ط§ظپط© ط¶ظ…ط§ظ†ط©",
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
    if (!canDelete) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط§ظ„ط¶ظ…ط§ظ†ط©طں")) return;
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
      <PageHead title="ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†" desc="ط¥ط¯ط§ط±ط© ط§ظ„ط¶ظ…ط§ظ†ط§طھ ط§ظ„طھط¬ط§ط±ظٹط© ظ„ظ„ظ…ظˆط¸ظپظٹظ† ظˆظ…طھط§ط¨ط¹ط© ط­ط§ظ„طھظ‡ط§" action={<button onClick={openAdd} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط© ط¶ظ…ط§ظ†ط©</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}</div>
      <div className="panel flex flex-wrap gap-3 p-4">
        <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط¨ط­ط« ط¨ط§ظ„ظ…ظˆط¸ظپ ط£ظˆ ط§ظ„ط±ظ‚ظ… ط£ظˆ ط§ظ„ط¶ط§ظ…ظ†..." />
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branchOptions.map((b) => <option key={b}>{b}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[170px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{guaranteeStatuses.map((s) => <option key={s}>{s}</option>)}</select>
        <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[170px]" />
        <button onClick={() => exportExcel(exportRows, "طھظ‚ط±ظٹط± ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button>
        <button onClick={() => printDocument("طھظ‚ط±ظٹط± ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†", rowsToReportHtml("طھظ‚ط±ظٹط± ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†", filtered, tableColumnsGuarantees))} className="btn-secondary"><Printer size={17} /> PDF</button>
        <button onClick={() => exportDocx("طھظ‚ط±ظٹط± ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†", exportRows)} className="btn-secondary"><Download size={17} /> Word</button>
      </div>
      <div className="panel p-4">
        {loading ? <LoadingScreen message="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¶ظ…ط§ظ†ط§طھ..." /> : (
          <div className="table-wrap"><table><thead><tr>{tableColumnsGuarantees.map((c) => <th key={c.key}>{c.label}</th>)}<th></th></tr></thead><tbody>{filtered.map((g) => <tr key={g.guarantee_id}><td>{g.employee_name}</td><td>{g.employee_id}</td><td>{g.branch}</td><td>{g.guarantor_name}</td><td>{g.commercial_register_number}</td><td>{g.guarantee_date}</td><td><Status>{g.guarantee_status}</Status></td><td><button onClick={() => setViewing(g)} className="p-2 text-slate-600"><Eye size={16} /></button><button onClick={() => setDialog(g)} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => remove(g.guarantee_id)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportBox title="طھظ‚ط±ظٹط± ط­ط³ط¨ ط§ظ„ظپط±ط¹" rows={Object.entries(groupCount(filtered, "branch"))} />
        <ReportBox title="طھظ‚ط±ظٹط± ط­ط³ط¨ ط§ظ„ط­ط§ظ„ط©" rows={Object.entries(groupCount(filtered, "guarantee_status"))} />
        <ReportBox title="ط§ظ„ظ…ظˆط¸ظپظˆظ† ط¨ط¯ظˆظ† ط¶ظ…ط§ظ†ط© ط³ط§ط±ظٹط©" rows={employees.filter((e) => !activeEmployeeIds.has(e.id)).map((e) => [e.name, e.branch])} />
        <ReportBox title="ط§ظ„ط¶ط§ظ…ظ†ظˆظ† ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ† ط£ظƒط«ط± ظ…ظ† ظ…ط±ط©" rows={Object.entries(groupCount(items, "guarantor_id_number")).filter(([, n]) => n > 1)} />
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={save} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6">
            <div className="mb-5 flex"><h3 className="text-xl font-extrabold">{items.some((g) => g.guarantee_id === dialog.guarantee_id) ? "طھط¹ط¯ظٹظ„ ط¶ظ…ط§ظ†ط©" : "ط¥ط¶ط§ظپط© ط¶ظ…ط§ظ†ط©"}</h3><button type="button" onClick={() => setDialog(null)} className="mr-auto"><X /></button></div>
            <div className="grid gap-4 md:grid-cols-3">
              <Label t="ط§ظ„ظ…ظˆط¸ظپ"><select required value={dialog.employee_id} onChange={(e) => selectEmployee(e.target.value)} className="field mt-2"><option value="">ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.name} - {e.id}</option>)}</select></Label>
              {["employee_name", "branch", "job"].map((k) => <Label key={k} t={{ employee_name: "ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ", branch: "ط§ظ„ظپط±ط¹", job: "ط§ظ„ظˆط¸ظٹظپط©" }[k]}><input readOnly value={dialog[k]} className="field mt-2 bg-slate-50" /></Label>)}
              <Label t="ط§ط³ظ… ط§ظ„ط¶ط§ظ…ظ†"><input required value={dialog.guarantor_name} onChange={(e) => setDialog({ ...dialog, guarantor_name: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط±ظ‚ظ… ظ‡ظˆظٹط© ط§ظ„ط¶ط§ظ…ظ†"><input required value={dialog.guarantor_id_number} onChange={(e) => setDialog({ ...dialog, guarantor_id_number: e.target.value })} className="field mt-2" /></Label>
              <Label t="ظ‡ط§طھظپ ط§ظ„ط¶ط§ظ…ظ†"><input value={dialog.guarantor_phone} onChange={(e) => setDialog({ ...dialog, guarantor_phone: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط§ط³ظ… ط§ظ„ظ…ط­ظ„ ط§ظ„طھط¬ط§ط±ظٹ"><input value={dialog.commercial_shop_name} onChange={(e) => setDialog({ ...dialog, commercial_shop_name: e.target.value })} className="field mt-2" /></Label>
              <Label t="ظ…ظˆظ‚ط¹ ط§ظ„ظ…ط­ظ„ ط§ظ„طھط¬ط§ط±ظٹ"><input value={dialog.commercial_shop_location} onChange={(e) => setDialog({ ...dialog, commercial_shop_location: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط±ظ‚ظ… ط§ظ„ط³ط¬ظ„ ط§ظ„طھط¬ط§ط±ظٹ"><input required value={dialog.commercial_register_number} onChange={(e) => setDialog({ ...dialog, commercial_register_number: e.target.value })} className="field mt-2" /></Label>
              <Label t="طھط§ط±ظٹط® ط§ظ„ط¶ظ…ط§ظ†ط©"><input required type="date" value={dialog.guarantee_date} onChange={(e) => setDialog({ ...dialog, guarantee_date: e.target.value })} className="field mt-2" /></Label>
              <Label t="طھط§ط±ظٹط® ط§ظ„ط§ظ†طھظ‡ط§ط،"><input type="date" value={dialog.guarantee_expiry_date} onChange={(e) => setDialog({ ...dialog, guarantee_expiry_date: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط§ظ„ط­ط§ظ„ط©"><select value={dialog.guarantee_status} onChange={(e) => setDialog({ ...dialog, guarantee_status: e.target.value })} className="field mt-2">{guaranteeStatuses.map((s) => <option key={s}>{s}</option>)}</select></Label>
              <Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="btn-secondary">ط¥ظ„ط؛ط§ط،</button><button className="btn-primary"><Save size={17} /> ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ</button></div>
          </form>
        </div>
      )}
      {viewing && <DetailsDialog title="طھظپط§طµظٹظ„ ط§ظ„ط¶ظ…ط§ظ†ط©" row={viewing} close={() => setViewing(null)} />}
    </div>
  );
}

function OvertimePage({ employees, role, currentUser, can }) {
  const [assignments, setAssignments] = useState([]);
  const [assignmentEmployees, setAssignmentEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState({ date: "", branch: "all", employee: "", status: "all", month: "" });
  const canCreate = can?.("overtime", "can_create") !== false;
  const canEdit = can?.("overtime", "can_edit") !== false;
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [a, ae] = await Promise.all([overtimeService.listAssignments(), overtimeService.listAssignmentEmployees()]);
      setAssignments(a);
      setAssignmentEmployees(ae);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    const u1 = overtimeService.subscribeAssignments(load);
    const u2 = overtimeService.subscribeAssignmentEmployees(load);
    return () => { u1?.(); u2?.(); };
  }, []);
  const joinedRows = assignmentEmployees.map((row) => ({ ...assignments.find((a) => a.assignment_id === row.assignment_id), ...row }));
  const visibleRows = joinedRows.filter((r) => {
    if (role === "ط§ظ„ظ…ظˆط¸ظپ" && currentUser?.employeeId && r.employee_id !== currentUser.employeeId) return false;
    if (role === "ظ…ط¯ظٹط± ط§ظ„ظپط±ط¹" && currentUser?.branch && r.branch !== currentUser.branch) return false;
    return true;
  });
  const filtered = visibleRows.filter((r) =>
    (!filters.date || r.assignment_date === filters.date) &&
    (filters.branch === "all" || r.branch === filters.branch) &&
    (!filters.employee || r.employee_name.includes(filters.employee) || r.employee_id.includes(filters.employee)) &&
    (filters.status === "all" || r.status === filters.status) &&
    (!filters.month || String(r.assignment_date || "").startsWith(filters.month))
  );
  const hours = (row) => {
    if (!row.start_time || !row.end_time) return 0;
    const [sh, sm] = row.start_time.split(":").map(Number);
    const [eh, em] = row.end_time.split(":").map(Number);
    return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  };
  const cards = [
    ["ط¥ط¬ظ…ط§ظ„ظٹ طھظƒظ„ظٹظپط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", assignments.length, Clock3],
    ["ط¹ط¯ط¯ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط§ظ„ظ…ظƒظ„ظپظٹظ†", assignmentEmployees.length, Users],
    ["ط¹ط¯ط¯ ط³ط§ط¹ط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", filtered.reduce((s, r) => s + hours(r), 0).toFixed(1), Gauge],
    ["طھظƒظ„ظٹظپط§طھ ط­ط³ط¨ ط§ظ„ظپط±ط¹", Object.keys(groupCount(filtered, "branch")).length, Building2],
    ["طھظƒظ„ظٹظپط§طھ ط­ط³ط¨ ط§ظ„ط´ظ‡ط±", Object.keys(groupCount(filtered, "assignment_date")).length, CalendarCheck],
  ];
  const startCreate = () => {
    if (!canCreate) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    setDialog({ assignment_id: `OT-${Date.now()}`, assignment_date: new Date().toISOString().slice(0, 10), branch: branches[0], location: "", start_time: "16:00", end_time: "20:00", reason: "", notes: "", mode: "branch", selected: [] });
  };
  const selectedEmployees = () => {
    if (!dialog) return [];
    if (dialog.mode === "branch") return employees.filter((e) => e.branch === dialog.branch);
    if (dialog.mode === "job") return employees.filter((e) => e.job === dialog.job);
    return employees.filter((e) => dialog.selected.includes(e.id));
  };
  const create = async (event) => {
    event.preventDefault();
    if (!canCreate) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    const selected = selectedEmployees();
    if (!selected.length) return alert("ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ظ…ظˆط¸ظپ ظˆط§ط­ط¯ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„.");
    const employeeRows = selected.map((e) => ({
      id: `${dialog.assignment_id}-${e.id}`,
      assignment_id: dialog.assignment_id,
      employee_id: e.id,
      employee_name: e.name,
      employee_phone: e.phone,
      branch: e.branch,
      job: e.job,
      status: "ظ…ظƒظ„ظپ",
      whatsapp_message: makeOvertimeMessage(dialog, { employee_name: e.name }),
    }));
    try {
      const saved = await overtimeService.createAssignment({ ...dialog, created_by: currentUser?.username || role || "" }, employeeRows);
      auditService.log({
        user_id: currentUser?.user_id || currentUser?.username,
        user_name: currentUser?.username || currentUser?.name,
        action: "ط¥ط¶ط§ظپط© طھظƒظ„ظٹظپ ط¹ظ…ظ„ ط¥ط¶ط§ظپظٹ",
        module_name: "overtime_assignments",
        record_id: saved.assignment.assignment_id,
        new_data: saved.assignment,
      }).catch((e) => console.error("Supabase audit_logs load/save error:", e));
      saved.employees.forEach((employee) => {
        notificationsService.create({
          user_id: employee.employee_id,
          title: "طھظƒظ„ظٹظپ ط¹ظ…ظ„ ط¥ط¶ط§ظپظٹ ط¬ط¯ظٹط¯",
          message: `طھظ… طھظƒظ„ظٹظپ ${employee.employee_name} ط¨ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ ط¨طھط§ط±ظٹط® ${saved.assignment.assignment_date}`,
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
    if (!canEdit) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    try {
      const saved = await overtimeService.updateAssignmentEmployee({ ...row, status, sent_at: status === "طھظ… ط§ظ„ط¥ط±ط³ط§ظ„" ? new Date().toISOString() : row.sent_at });
      setAssignmentEmployees((list) => list.map((x) => (x.id === saved.id ? saved : x)));
    } catch (e) {
      alert(e.message);
    }
  };
  const copy = async (text) => {
    await navigator.clipboard?.writeText(text);
    alert("طھظ… ظ†ط³ط® ط§ظ„ط±ط³ط§ظ„ط©");
  };
  const openWhatsApp = (row) => {
    const message = row.whatsapp_message || makeOvertimeMessage(row, row);
    window.open(`https://wa.me/${normalizeWhatsAppPhone(row.employee_phone)}?text=${encodeURIComponent(message)}`, "_blank");
  };
  const exportRows = reportRowsForExport(filtered, tableColumnsOvertime);
  return (
    <div className="space-y-5">
      <PageHead title="ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ" desc="ط¥ظ†ط´ط§ط، طھظƒظ„ظٹظپط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ ظˆطھظˆظ„ظٹط¯ ط±ط³ط§ط¦ظ„ ظˆط§طھط³ط§ط¨ ظ„ظ„ظ…ظˆط¸ظپظٹظ†" action={<button onClick={startCreate} className="btn-primary"><Plus size={18} /> طھظƒظ„ظٹظپ ط¬ط¯ظٹط¯</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}</div>
      <div className="panel flex flex-wrap gap-3 p-4">
        <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="field max-w-[170px]" />
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select>
        <input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field min-w-[200px]" placeholder="ط¨ط­ط« ط¨ط§ظ„ظ…ظˆط¸ظپ..." />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[170px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{overtimeStatuses.map((s) => <option key={s}>{s}</option>)}</select>
        <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[170px]" />
        <button onClick={() => exportExcel(exportRows, "طھظ‚ط±ظٹط± ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button>
        <button onClick={() => printDocument("طھظ‚ط±ظٹط± ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", rowsToReportHtml("طھظ‚ط±ظٹط± ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", filtered, tableColumnsOvertime))} className="btn-secondary"><Printer size={17} /> PDF</button>
        <button onClick={() => exportDocx("طھظ‚ط±ظٹط± ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", exportRows)} className="btn-secondary"><Download size={17} /> Word</button>
      </div>
      <div className="panel p-4">
        {loading ? <LoadingScreen message="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ طھظƒظ„ظٹظپط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ..." /> : (
          <div className="table-wrap"><table><thead><tr>{tableColumnsOvertime.map((c) => <th key={c.key}>{c.label}</th>)}<th>ظˆط§طھط³ط§ط¨</th><th>طھط­ط¯ظٹط«</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id}><td>{r.assignment_date}</td><td>{r.employee_name}</td><td>{r.branch}</td><td>{r.job}</td><td>{r.start_time}</td><td>{r.end_time}</td><td><Status>{r.status}</Status></td><td><button onClick={() => copy(r.whatsapp_message || makeOvertimeMessage(r, r))} className="btn-secondary !h-9 !px-3">ظ†ط³ط® ط§ظ„ط±ط³ط§ظ„ط©</button><button onClick={() => openWhatsApp(r)} className="btn-secondary !h-9 !px-3">ظپطھط­ ظˆط§طھط³ط§ط¨</button></td><td><select value={r.status} onChange={(e) => updateStatus(r, e.target.value)} className="field h-9">{overtimeStatuses.map((s) => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportBox title="طھظ‚ط±ظٹط± ط­ط³ط¨ ط§ظ„ظپط±ط¹" rows={Object.entries(groupCount(filtered, "branch"))} />
        <ReportBox title="طھظ‚ط±ظٹط± ط­ط³ط¨ ط§ظ„ظ…ظˆط¸ظپ" rows={Object.entries(groupCount(filtered, "employee_name"))} />
        <ReportBox title="طھظ‚ط±ظٹط± ط­ط³ط¨ ط§ظ„ط´ظ‡ط±" rows={Object.entries(groupCount(filtered.map((r) => ({ ...r, month: String(r.assignment_date || "").slice(0, 7) })), "month"))} />
        <ReportBox title="ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ظ…ظˆط¸ظپظٹظ†" rows={Object.entries(groupCount(filtered, "employee_name")).sort((a, b) => b[1] - a[1]).slice(0, 10)} />
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={create} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6">
            <div className="mb-5 flex"><h3 className="text-xl font-extrabold">طھظƒظ„ظٹظپ ط¹ظ…ظ„ ط¥ط¶ط§ظپظٹ</h3><button type="button" onClick={() => setDialog(null)} className="mr-auto"><X /></button></div>
            <div className="grid gap-4 md:grid-cols-3">
              <Label t="ط§ظ„طھط§ط±ظٹط®"><input required type="date" value={dialog.assignment_date} onChange={(e) => setDialog({ ...dialog, assignment_date: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط§ظ„ظپط±ط¹"><select value={dialog.branch} onChange={(e) => setDialog({ ...dialog, branch: e.target.value })} className="field mt-2">{branches.map((b) => <option key={b}>{b}</option>)}</select></Label>
              <Label t="ط§ظ„ظ…ظˆظ‚ط¹"><input required value={dialog.location} onChange={(e) => setDialog({ ...dialog, location: e.target.value })} className="field mt-2" /></Label>
              <Label t="ظ…ظ† ط§ظ„ط³ط§ط¹ط©"><input required type="time" value={dialog.start_time} onChange={(e) => setDialog({ ...dialog, start_time: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط¥ظ„ظ‰ ط§ظ„ط³ط§ط¹ط©"><input required type="time" value={dialog.end_time} onChange={(e) => setDialog({ ...dialog, end_time: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط³ط¨ط¨ ط§ظ„طھظƒظ„ظٹظپ"><input value={dialog.reason} onChange={(e) => setDialog({ ...dialog, reason: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط·ط±ظٹظ‚ط© ط§ظ„ط§ط®طھظٹط§ط±"><select value={dialog.mode} onChange={(e) => setDialog({ ...dialog, mode: e.target.value, selected: [] })} className="field mt-2"><option value="branch">ظƒظ„ ظ…ظˆط¸ظپظٹ ط§ظ„ظپط±ط¹</option><option value="job">ط­ط³ط¨ ط§ظ„ظˆط¸ظٹظپط©</option><option value="manual">ط§ط®طھظٹط§ط± ظ…طھط¹ط¯ط¯</option></select></Label>
              {dialog.mode === "job" && <Label t="ط§ظ„ظˆط¸ظٹظپط©"><select value={dialog.job || jobs[0]} onChange={(e) => setDialog({ ...dialog, job: e.target.value })} className="field mt-2">{jobs.map((j) => <option key={j}>{j}</option>)}</select></Label>}
              <Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
            </div>
            {dialog.mode === "manual" && <div className="mt-5 grid max-h-56 gap-2 overflow-y-auto rounded-2xl border p-3 md:grid-cols-2">{employees.map((e) => <label key={e.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-sm"><input type="checkbox" checked={dialog.selected.includes(e.id)} onChange={(ev) => setDialog({ ...dialog, selected: ev.target.checked ? [...dialog.selected, e.id] : dialog.selected.filter((id) => id !== e.id) })} />{e.name} - {e.branch}</label>)}</div>}
            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">ط¹ط¯ط¯ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط§ظ„ظ…ط®طھط§ط±ظٹظ†: {selectedEmployees().length}</p>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="btn-secondary">ط¥ظ„ط؛ط§ط،</button><button className="btn-primary"><Save size={17} /> ط­ظپط¸ ط§ظ„طھظƒظ„ظٹظپ</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

const shiftTabs = [
  ["types", "ط£ظ†ظˆط§ط¹ ط§ظ„ط´ظپطھط§طھ"],
  ["used", "ط§ظ„ط´ظپطھط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…ط©"],
  ["scenarios", "ط³ظٹظ†ط§ط±ظٹظˆظ‡ط§طھ ط§ظ„ط´ظپطھط§طھ"],
  ["assignments", "طھظˆط²ظٹط¹ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط¹ظ„ظ‰ ط§ظ„ط´ظپطھط§طھ"],
  ["reports", "طھظ‚ط§ط±ظٹط± ط§ظ„ط´ظپطھط§طھ"],
];
const shiftAssignmentColumns = [
  { key: "assignment_date", label: "ط§ظ„طھط§ط±ظٹط®" },
  { key: "employee_name", label: "ط§ظ„ظ…ظˆط¸ظپ" },
  { key: "branch", label: "ط§ظ„ظپط±ط¹" },
  { key: "shift_name", label: "ط§ظ„ط´ظپطھ" },
  { key: "start_time", label: "ظ…ظ†" },
  { key: "end_time", label: "ط¥ظ„ظ‰" },
  { key: "total_hours", label: "ط§ظ„ط³ط§ط¹ط§طھ" },
  { key: "status", label: "ط§ظ„ط­ط§ظ„ط©" },
];
const canOverrideShiftConflicts = (role = "") =>
  isAdminLikeRole(role) || String(role).includes("ط§ظ„ظ…ظˆط§ط±ط¯") || String(role).includes("ط·آ§ط¸â€‍ط¸â€¦ط¸ث†ط·آ§ط·آ±ط·آ¯");
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
  `ط§ظ„ط£ط®/ ط§ظ„ظ…ظˆط¸ظپ: ${row.employee_name}

طھط­ظٹط© ط·ظٹط¨ط©طŒ

ظ†ط­ظٹط·ظƒظ… ط¹ظ„ظ…ط§ظ‹ ط¨ط£ظ†ظ‡ طھظ… ط¬ط¯ظˆظ„طھظƒظ… ظ„ظ„ط¹ظ…ظ„ ظٹظˆظ… ${arabicDayName(row.assignment_date)} ط§ظ„ظ…ظˆط§ظپظ‚ ${row.assignment_date}ظ…طŒ ظپظٹ ${row.branch} ط¶ظ…ظ† ط´ظپطھ ${row.shift_name} ظ…ظ† ط§ظ„ط³ط§ط¹ط© ${row.start_time} ط­طھظ‰ ط§ظ„ط³ط§ط¹ط© ${row.end_time}.

ظٹط±ط¬ظ‰ ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط§ظ„ط­ط¶ظˆط± ظˆط§ظ„ط§ظ†طµط±ط§ظپ ظپظٹ ط§ظ„ظˆظ‚طھ ط§ظ„ظ…ط­ط¯ط¯ ظˆط¥ط«ط¨ط§طھ ط§ظ„ط¨طµظ…ط© ط­ط³ط¨ ط§ظ„ط¥ط¬ط±ط§ط، ط§ظ„ظ…ط¹طھظ…ط¯.

ط´ط§ظƒط±ظٹظ† ظ„ظƒظ… طھط¹ط§ظˆظ†ظƒظ… ظˆط§ظ„طھط²ط§ظ…ظƒظ….
ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©`;
const upsertLocal = (list, item, key) =>
  list.some((x) => x[key] === item[key]) ? list.map((x) => (x[key] === item[key] ? item : x)) : [item, ...list];

const inventoryTabs = [
  ["dashboard", "ظ„ظˆط­ط© ط§ظ„ظ…ط®ط²ظˆظ†", "inventory_dashboard"],
  ["items", "ط§ظ„ط£طµظ†ط§ظپ", "inventory_items"],
  ["suppliers", "ط§ظ„ظ…ظˆط±ط¯ظˆظ†", "inventory_suppliers"],
  ["purchase_requests", "ط·ظ„ط¨ ط´ط±ط§ط،", "inventory_purchase_requests"],
  ["purchase_orders", "ط£ظ…ط± ط´ط±ط§ط،", "inventory_purchase_orders"],
  ["receipts", "ط¥ط°ظ† ط§ط³طھظ„ط§ظ…", "inventory_receipts"],
  ["invoices", "ظپط§طھظˆط±ط© ط´ط±ط§ط،", "inventory_invoices"],
  ["issues", "ط³ظ†ط¯ طµط±ظپ ظ„ظ„ظپط±ظˆط¹", "inventory_issue_vouchers"],
  ["returns", "ط³ظ†ط¯ ط¥ط±ط¬ط§ط¹ ظ…ظ† ط§ظ„ظپط±ظˆط¹", "inventory_returns"],
  ["transfers", "ط³ظ†ط¯ طھط­ظˆظٹظ„ ظ…ط®ط²ظ†ظٹ", "inventory_transfers"],
  ["adjustments", "ط§ظ„طھط³ظˆظٹط§طھ", "inventory_adjustments"],
  ["stocktakes", "ط§ظ„ط¬ط±ط¯", "inventory_stocktakes"],
  ["balances", "ط£ط±طµط¯ط© ط§ظ„ظ…ط®ط²ظˆظ†", "inventory_balances"],
  ["forecast", "طھظˆظ‚ط¹ ط§ط­طھظٹط§ط¬ ط§ظ„ظپط±ظˆط¹", "inventory_forecast"],
  ["reports", "طھظ‚ط§ط±ظٹط± ط§ظ„ظ…ط®ط²ظˆظ†", "inventory_reports"],
  ["settings", "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ط®ط²ظˆظ†", "inventory_settings"],
];
const inventoryDocTypes = ["purchase_requests", "purchase_orders", "receipts", "invoices", "issues", "returns", "transfers", "adjustments", "stocktakes"];
const inventoryStatusFlow = ["ظ…ط³ظˆط¯ط©", "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©", "ظ…ط¹طھظ…ط¯", "ظ…ط±ظپظˆط¶", "ظ…ط±ط­ظ„", "ظ…ظ„ط؛ظٹ"];

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
    if (!canTab(dialog.item_id ? "can_edit" : "can_create")) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    try {
      const saved = await inventoryService.saveInventoryItem(dialog);
      setItems((list) => upsertLocal(list, saved, "item_id"));
      auditService.log({ user_id: currentUser?.user_id || currentUser?.username, user_name: currentUser?.username, action: dialog.item_id ? "طھط¹ط¯ظٹظ„ طµظ†ظپ" : "ط¥ط¶ط§ظپط© طµظ†ظپ", module_name: "inventory_items", record_id: saved.item_id, new_data: saved }).catch(() => {});
      setDialog(null);
    } catch (e) { alert(e.message); }
  };
  const saveSupplier = async (event) => {
    event.preventDefault();
    if (!canTab(dialog.supplier_id ? "can_edit" : "can_create")) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    try {
      const saved = await inventoryService.saveSupplier(dialog);
      setSuppliers((list) => upsertLocal(list, saved, "supplier_id"));
      setDialog(null);
    } catch (e) { alert(e.message); }
  };
  const saveDocument = async (event) => {
    event.preventDefault();
    if (!canTab(dialog.id ? "can_edit" : "can_create")) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (!dialog.document_date) return alert("ظٹط¬ط¨ طھط­ط¯ظٹط¯ طھط§ط±ظٹط® ط§ظ„ظ…ط³طھظ†ط¯");
    if (dialog.details?.length === 0 && !["invoices", "adjustments"].includes(dialog.type)) return alert("ظٹط¬ط¨ ط¥ط¶ط§ظپط© طµظ†ظپ ظˆط§ط­ط¯ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„");
    try {
      const config = inventoryDocumentConfigs[dialog.type];
      const saved = await inventoryDocumentsService.saveDocument(dialog.type, { ...dialog, [config.idKey]: dialog.id }, dialog.details || []);
      setDocuments((all) => ({ ...all, [dialog.type]: upsertLocal(all[dialog.type] || [], saved, "id") }));
      setDialog(null);
    } catch (e) { alert(e.message); }
  };
  const deleteRecord = async (kind, record) => {
    if (!canTab("can_delete")) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (record.status && record.status !== "ظ…ط³ظˆط¯ط©") return alert("ظ„ط§ ظٹظ…ظƒظ† ط­ط°ظپ ظ…ط³طھظ†ط¯ ظ…ط±ط­ظ„");
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط§ظ„ط³ط¬ظ„طں")) return;
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
    const action = status === "ظ…ط¹طھظ…ط¯" ? "can_approve" : status === "ظ…ط±ط­ظ„" ? "can_post" : "can_edit";
    if (!canTab(action)) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    try {
      const details = await inventoryDocumentsService.loadDetails(type, doc.id).catch(() => []);
      if (status === "ظ…ط±ط­ظ„") await inventoryDocumentsService.postStock(type, doc, details, currentUser?.username || "");
      else await inventoryDocumentsService.updateStatus(type, doc, status, { approved_by: currentUser?.username || "", approved_at: new Date().toISOString() });
      approvalService.log({ module_name: type, record_id: doc.id, action: status, old_status: doc.status, new_status: status, performed_by: currentUser?.username || "", notes: "" }).catch(() => {});
      load();
    } catch (e) { alert(e.message); }
  };
  return (
    <div className="space-y-5">
      <PageHead title="ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط®ط²ظˆظ†" desc="ط§ظ„ط¯ظˆط±ط© ط§ظ„ظ…ط³طھظ†ط¯ظٹط© ط§ظ„ظƒط§ظ…ظ„ط© ظ„ظ„ظ…ط®ط²ظˆظ† ظˆط§ظ„ظ…ط´طھط±ظٹط§طھ ظˆط­ط±ظƒط© ط§ظ„ط£طµظ†ط§ظپ" action={<button onClick={() => setTab("items")} className="btn-primary"><Wallet size={18} /> ط§ظ„ط£طµظ†ط§ظپ</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="panel flex flex-wrap gap-2 p-2">{visibleTabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>)}</div>
      {loading ? <div className="panel p-6 text-center text-sm text-slate-500">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط®ط²ظˆظ†...</div> : (
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
      {dialog?.kind === "details" && <DetailsDialog title="طھظپط§طµظٹظ„ ط§ظ„ظ…ط³طھظ†ط¯" row={dialog.row} close={() => setDialog(null)} />}
    </div>
  );
}

const inventoryBalances = (items, movements) => items.map((item) => {
  const itemMovements = movements.filter((m) => m.item_id === item.item_id);
  const totalPurchases = itemMovements.filter((m) => Number(m.quantity_in || 0) > 0).reduce((s, m) => s + Number(m.quantity_in || 0), 0);
  const totalIssued = itemMovements.filter((m) => Number(m.quantity_out || 0) > 0).reduce((s, m) => s + Number(m.quantity_out || 0), 0);
  const totalReturns = itemMovements.filter((m) => String(m.movement_type || "").includes("ط¥ط±ط¬ط§ط¹") || String(m.movement_type || "").includes("ط·آ¥ط·آ±ط·آ¬ط·آ§ط·آ¹")).reduce((s, m) => s + Number(m.quantity_in || 0), 0);
  const quantityIn = itemMovements.reduce((s, m) => s + Number(m.quantity_in || 0), 0);
  const quantityOut = itemMovements.reduce((s, m) => s + Number(m.quantity_out || 0), 0);
  const current = itemMovements.length ? Number(item.opening_balance || 0) + quantityIn - quantityOut : Number(item.current_balance || item.opening_balance || 0);
  const incomingValue = itemMovements.filter((m) => Number(m.quantity_in || 0) > 0).reduce((s, m) => s + Number(m.total_value || 0), 0);
  const outgoingValue = itemMovements.filter((m) => Number(m.quantity_out || 0) > 0).reduce((s, m) => s + Number(m.total_value || 0), 0);
  const averageUnitCost = incomingValue / Math.max(1, quantityIn) || Number(item.default_unit_cost || 0);
  const estimatedStockValue = current * averageUnitCost;
  const exchangeRate = Number(item.exchange_rate || itemMovements[0]?.exchange_rate || 1);
  const status = current <= 0 ? "ظ†ط§ظپط¯" : current <= Number(item.reorder_point || 0) ? "ظٹط­طھط§ط¬ ط´ط±ط§ط،" : current <= Number(item.minimum_stock || 0) ? "ظ…ظ†ط®ظپط¶" : "ظ…طھظˆظپط±";
  return { ...item, total_purchases: totalPurchases, total_issued: totalIssued, total_returns: totalReturns, total_quantity_in: quantityIn, total_quantity_out: quantityOut, remaining_quantity: current, incoming_total_value: incomingValue, outgoing_total_value: outgoingValue, total_adjustments: quantityIn - quantityOut, current_balance: current, average_unit_cost: averageUnitCost, estimated_stock_value: estimatedStockValue, remaining_stock_value: estimatedStockValue, total_value_base: estimatedStockValue * exchangeRate, remaining_stock_value_base: estimatedStockValue * exchangeRate, currency_code: item.default_currency_code || item.currency_code || itemMovements[0]?.currency_code || "YER", currency_name: item.default_currency_name || item.currency_name || itemMovements[0]?.currency_name || "ط±ظٹط§ظ„ ظٹظ…ظ†ظٹ", stock_status: status };
});

function InventoryDashboard({ items, documents, movements }) {
  const totals = calculateInventoryDashboardTotals({ items, movements });
  const issueMovements = movements.filter((m) => Number(m.quantity_out || 0) > 0);
  const cards = [
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط£طµظ†ط§ظپ", totals.total_items, Wallet],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…ط¯ط®ظ„ط©", nf.format(totals.total_quantity_in), Download],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…طµط±ظˆظپط©", nf.format(totals.total_quantity_out), Upload],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…طھط¨ظ‚ظٹط©", nf.format(totals.remaining_quantity), Gauge],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ظ‚ظٹظ…ط© ط§ظ„ظ…ط´طھط±ظٹط§طھ", nf.format(totals.total_purchase_value), CircleDollarSign],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ظ‚ظٹظ…ط© ط§ظ„طµط±ظپ", nf.format(totals.total_issue_value), Wallet],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ظ‚ظٹظ…ط© ط§ظ„ظ…ط®ط²ظˆظ† ط§ظ„ظ…طھط¨ظ‚ظٹ", nf.format(totals.total_stock_value), CircleDollarSign],
    ["ظ‚ظٹظ…ط© ط§ظ„ظ…ط®ط²ظˆظ† ط¨ط§ظ„ط¹ظ…ظ„ط© ط§ظ„ط£ط³ط§ط³ظٹط©", nf.format(totals.total_stock_value_base), Banknote],
    ["ط§ظ„ط£طµظ†ط§ظپ ظ…ظ†ط®ظپط¶ط© ط§ظ„ظ…ط®ط²ظˆظ†", totals.low_stock_count, AlertTriangle],
    ["ط§ظ„ط£طµظ†ط§ظپ ط§ظ„ظ†ط§ظپط¯ط©", totals.out_of_stock_count, AlertTriangle],
  ];
  const byBranch = Object.entries(groupCount(issueMovements, "branch")).map(([name, value]) => ({ name, value }));
  const byCategory = Object.entries(groupCount(items, "category")).map(([name, value]) => ({ name, value }));
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}</div><div className="grid gap-5 xl:grid-cols-2"><Chart title="ط§ظ„طµط±ظپ ط­ط³ط¨ ط§ظ„ظپط±ظˆط¹" sub="ط­ط±ظƒط§طھ طµط±ظپ ط§ظ„ظپط±ظˆط¹"><ResponsiveContainer width="100%" height={240}><BarChart data={byBranch}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart><Chart title="ط§ظ„ط£طµظ†ط§ظپ ط­ط³ط¨ ط§ظ„طھطµظ†ظٹظپ" sub="طھظˆط²ظٹط¹ ط§ظ„ط£طµظ†ط§ظپ"><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={byCategory} dataKey="value" innerRadius={55} outerRadius={85}>{["#7f1d1d", "#991b1b", "#dc2626", "#f59e0b", "#64748b"].map((c) => <Cell key={c} fill={c} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Chart></div></div>;
}

function InventoryItemsTab({ rows, filters, setFilters, setDialog, deleteRecord, canCreate }) {
  const filtered = rows.filter((x) => (!filters.q || x.item_name.includes(filters.q) || x.item_code.includes(filters.q)) && (filters.category === "all" || x.category === filters.category) && (filters.status === "all" || x.stock_status === filters.status || String(x.is_active) === filters.status));
  const exportRows = inventoryRowsForExport(filtered, [{ key: "item_code", label: "ط§ظ„ظƒظˆط¯" }, { key: "item_name", label: "ط§ظ„طµظ†ظپ" }, { key: "category", label: "ط§ظ„طھطµظ†ظٹظپ" }, { key: "unit_type", label: "ط§ظ„ظˆط­ط¯ط©" }, { key: "current_balance", label: "ط§ظ„ط±طµظٹط¯" }]);
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط¨ط­ط« ط¨ط§ظ„طµظ†ظپ ط£ظˆ ط§ظ„ظƒظˆط¯..." /><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„طھطµظ†ظٹظپط§طھ</option>{inventoryCategories.map((c) => <option key={c}>{c}</option>)}</select><button disabled={!canCreate} onClick={() => setDialog({ kind: "item", item_id: `ITM-${Date.now()}`, item_code: "", item_name: "", category: inventoryCategories[0], unit_type: inventoryUnits[0], default_unit_cost: 0, minimum_stock: 0, reorder_point: 0, opening_balance: 0, current_balance: 0, default_currency_code: "YER", default_currency_name: getInventoryCurrency("YER").currency_name, exchange_rate: 1, is_active: true, notes: "" })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط© طµظ†ظپ</button><button onClick={() => exportExcel(exportRows, "ط§ظ„ط£طµظ†ط§ظپ")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„ظƒظˆط¯</th><th>ط§ظ„طµظ†ظپ</th><th>ط§ظ„طھطµظ†ظٹظپ</th><th>ط§ظ„ظˆط­ط¯ط©</th><th>ط§ظ„ط±طµظٹط¯</th><th>ظ†ظ‚ط·ط© ط§ظ„ط·ظ„ط¨</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{filtered.map((r) => <tr key={r.item_id}><td>{r.item_code}</td><td>{r.item_name}</td><td>{r.category}</td><td>{r.unit_type}</td><td>{r.current_balance}</td><td>{r.reorder_point}</td><td><Status>{r.is_active ? "ظ†ط´ط·" : "ط؛ظٹط± ظ†ط´ط·"}</Status></td><td><button onClick={() => setDialog({ ...r, kind: "item" })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => setDialog({ kind: "details", row: r })} className="p-2 text-slate-600"><Eye size={16} /></button><button onClick={() => deleteRecord("items", r)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div></div>;
}

function InventorySuppliersTab({ rows, filters, setFilters, setDialog, deleteRecord, canCreate }) {
  const filtered = rows.filter((x) => !filters.q || x.supplier_name.includes(filters.q) || x.phone.includes(filters.q));
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط¨ط­ط« ط¨ط§ظ„ظ…ظˆط±ط¯..." /><button disabled={!canCreate} onClick={() => setDialog({ kind: "supplier", supplier_id: `SUP-${Date.now()}`, supplier_name: "", phone: "", address: "", tax_number: "", commercial_register: "", contact_person: "", is_active: true, notes: "" })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط© ظ…ظˆط±ط¯</button><button onClick={() => exportExcel(filtered, "ط§ظ„ظ…ظˆط±ط¯ظˆظ†")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„ظ…ظˆط±ط¯</th><th>ط§ظ„ظ‡ط§طھظپ</th><th>ط§ظ„ط³ط¬ظ„ ط§ظ„طھط¬ط§ط±ظٹ</th><th>ظ…ط³ط¤ظˆظ„ ط§ظ„طھظˆط§طµظ„</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{filtered.map((r) => <tr key={r.supplier_id}><td>{r.supplier_name}</td><td>{r.phone}</td><td>{r.commercial_register}</td><td>{r.contact_person}</td><td><Status>{r.is_active ? "ظ†ط´ط·" : "ط؛ظٹط± ظ†ط´ط·"}</Status></td><td><button onClick={() => setDialog({ ...r, kind: "supplier" })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => deleteRecord("suppliers", r)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div></div>;
}

function InventoryDocumentsTab({ type, rows, items, suppliers, filters, setFilters, setDialog, deleteRecord, updateDocStatus, canCreate }) {
  const config = inventoryDocumentConfigs[type];
  const filtered = rows.filter((x) => (!filters.q || String(x.document_number || "").includes(filters.q) || String(x.supplier_name || x.branch || "").includes(filters.q)) && (filters.status === "all" || x.status === filters.status || x.approval_status === filters.status) && (!filters.month || String(x.document_date || "").startsWith(filters.month)));
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[200px] flex-1" placeholder="ط¨ط­ط« ط¨ط§ظ„ظ…ط³طھظ†ط¯..." /><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[170px]" /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[170px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{["ظ…ط³ظˆط¯ط©", "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©", "ظ…ط¹طھظ…ط¯", "ظ…ط±ط­ظ„", "ظ…ط±ظپظˆط¶", "ظ…ظ„ط؛ظٹ"].map((s) => <option key={s}>{s}</option>)}</select><button disabled={!canCreate} onClick={() => setDialog({ kind: "document", type, id: `${type.toUpperCase()}-${Date.now()}`, document_number: `${config.label}-${Date.now()}`, document_date: new Date().toISOString().slice(0, 10), status: "ظ…ط³ظˆط¯ط©", approval_status: "ظ…ط³ظˆط¯ط©", supplier_id: suppliers[0]?.supplier_id || "", supplier_name: suppliers[0]?.supplier_name || "", branch: branches[0], priority: "ط¹ط§ط¯ظٹ", details: [] })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط©</button><button onClick={() => exportExcel(filtered, config.label)} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button><button onClick={() => printDocument(config.label, rowsToReportHtml(config.label, filtered, [{ key: "document_number", label: "ط§ظ„ط±ظ‚ظ…" }, { key: "document_date", label: "ط§ظ„طھط§ط±ظٹط®" }, { key: "supplier_name", label: "ط§ظ„ظ…ظˆط±ط¯" }, { key: "branch", label: "ط§ظ„ظپط±ط¹" }, { key: "status", label: "ط§ظ„ط­ط§ظ„ط©" }]))} className="btn-secondary"><Printer size={17} /> ط·ط¨ط§ط¹ط©</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط±ظ‚ظ… ط§ظ„ظ…ط³طھظ†ط¯</th><th>ط§ظ„طھط§ط±ظٹط®</th><th>ط§ظ„ظ…ظˆط±ط¯/ط§ظ„ظپط±ط¹</th><th>ط§ظ„ط­ط§ظ„ط©</th><th>ط§ظ„ط§ط¹طھظ…ط§ط¯</th><th>ط§ظ„ظ‚ظٹظ…ط©</th><th></th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id}><td>{r.document_number}</td><td>{r.document_date}</td><td>{r.supplier_name || r.branch || r.requesting_branch}</td><td><Status>{r.status}</Status></td><td><Status>{r.approval_status}</Status></td><td>{money(r.total_amount || 0)}</td><td><button onClick={() => setDialog({ kind: "details", row: r })} className="p-2 text-slate-600"><Eye size={16} /></button><button onClick={() => setDialog({ ...r, kind: "document", type, details: [] })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => updateDocStatus(type, r, "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©")} className="btn-secondary !h-8 !px-2">ط¥ط±ط³ط§ظ„</button><button onClick={() => updateDocStatus(type, r, "ظ…ط¹طھظ…ط¯")} className="btn-secondary !h-8 !px-2">ط§ط¹طھظ…ط§ط¯</button><button onClick={() => updateDocStatus(type, r, "ظ…ط±ط­ظ„")} className="btn-secondary !h-8 !px-2">طھط±ط­ظٹظ„</button><button onClick={() => deleteRecord(type, r)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div></div>;
}

function InventoryBalancesTab({ rows, filters, setFilters }) {
  const filtered = rows.filter((x) => (filters.category === "all" || x.category === filters.category) && (filters.status === "all" || x.stock_status === filters.status));
  const summary = filtered.reduce((acc, row) => ({ inQty: acc.inQty + Number(row.total_quantity_in || row.total_purchases || 0), outQty: acc.outQty + Number(row.total_quantity_out || row.total_issued || 0), remain: acc.remain + Number(row.remaining_quantity || row.current_balance || 0), value: acc.value + Number(row.remaining_stock_value || row.estimated_stock_value || 0), base: acc.base + Number(row.remaining_stock_value_base || row.total_value_base || 0) }), { inQty: 0, outQty: 0, remain: 0, value: 0, base: 0 });
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„طھطµظ†ظٹظپط§طھ</option>{inventoryCategories.map((c) => <option key={c}>{c}</option>)}</select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{["ظ…طھظˆظپط±", "ظ…ظ†ط®ظپط¶", "ظ†ط§ظپط¯", "ظٹط­طھط§ط¬ ط´ط±ط§ط،"].map((s) => <option key={s}>{s}</option>)}</select><button onClick={() => exportExcel(filtered, "ط£ط±طµط¯ط© ط§ظ„ظ…ط®ط²ظˆظ†")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط±ظ‚ظ… ط§ظ„طµظ†ظپ</th><th>ط§ط³ظ… ط§ظ„طµظ†ظپ</th><th>ط§ظ„طھطµظ†ظٹظپ</th><th>ط§ظ„ظˆط­ط¯ط©</th><th>ط§ظ„ط¹ظ…ظ„ط©</th><th>ط§ظ„ط§ظپطھطھط§ط­ظٹط©</th><th>ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…ط¯ط®ظ„ط©</th><th>ط§ظ„ظƒظ…ظٹط© ط§ظ„ظ…طµط±ظˆظپط©</th><th>ط§ظ„ظ…طھط¨ظ‚ظٹط©</th><th>ظ…طھظˆط³ط· ط³ط¹ط± ط§ظ„ظˆط­ط¯ط©</th><th>ظ‚ظٹظ…ط© ط§ظ„ط¯ط§ط®ظ„</th><th>ظ‚ظٹظ…ط© ط§ظ„طµط±ظپ</th><th>ظ‚ظٹظ…ط© ط§ظ„ظ…ط®ط²ظˆظ†</th><th>ط§ظ„ظ‚ظٹظ…ط© ط¨ط§ظ„ط¹ظ…ظ„ط© ط§ظ„ط£ط³ط§ط³ظٹط©</th><th>ط¢ط®ط± ط­ط±ظƒط©</th><th>ط§ظ„ط­ط§ظ„ط©</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.item_id}><td>{r.item_code}</td><td>{r.item_name}</td><td>{r.category}</td><td>{r.unit_type}</td><td>{r.currency_code || "YER"}</td><td>{r.opening_balance}</td><td>{r.total_quantity_in || r.total_purchases || 0}</td><td>{r.total_quantity_out || r.total_issued || 0}</td><td>{r.remaining_quantity || r.current_balance || 0}</td><td>{nf.format(Number(r.average_unit_cost || 0))}</td><td>{nf.format(Number(r.incoming_total_value || 0))}</td><td>{nf.format(Number(r.outgoing_total_value || 0))}</td><td>{nf.format(Number(r.remaining_stock_value || r.estimated_stock_value || 0))}</td><td>{nf.format(Number(r.remaining_stock_value_base || r.total_value_base || 0))}</td><td>{r.last_movement_date || ""}</td><td><Status>{r.stock_status}</Status></td></tr>)}<tr className="bg-slate-50 font-extrabold"><td colSpan="6">ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</td><td>{nf.format(summary.inQty)}</td><td>{nf.format(summary.outQty)}</td><td>{nf.format(summary.remain)}</td><td></td><td></td><td></td><td>{nf.format(summary.value)}</td><td>{nf.format(summary.base)}</td><td></td><td></td></tr></tbody></table></div></div></div>;
}


function InventoryForecastTab({ rows, filters, setFilters }) {
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[170px]" /><button onClick={() => exportExcel(rows, "طھظˆظ‚ط¹ ط§ط­طھظٹط§ط¬ ط§ظ„ظپط±ظˆط¹")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„طµظ†ظپ</th><th>ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طµط±ظپ</th><th>ظ…طھظˆط³ط· ط´ظ‡ط±ظٹ</th><th>ط§ط­طھظٹط§ط¬ ط´ظ‡ط±</th><th>ط§ط­طھظٹط§ط¬ 3 ط£ط´ظ‡ط±</th><th>ط§ظ„ط±طµظٹط¯</th><th>ط§ظ„ظ…ظˆطµظ‰ ط¨ط´ط±ط§ط¦ظ‡</th></tr></thead><tbody>{rows.map((r) => <tr key={`${r.branch}-${r.item_id}`}><td>{r.branch}</td><td>{r.item_name}</td><td>{r.total_issued_quantity}</td><td>{r.average_monthly_consumption}</td><td>{r.expected_need_next_month}</td><td>{r.expected_need_next_3_months}</td><td>{r.current_balance}</td><td>{r.recommended_purchase_quantity}</td></tr>)}</tbody></table></div></div></div>;
}

function InventoryReportsTab({ reports, filters, setFilters, canExport }) {
  const reportList = [["طھظ‚ط±ظٹط± ط§ظ„ط£طµظ†ط§ظپ", reports.items], ["طھظ‚ط±ظٹط± ط§ظ„ظ…ظˆط±ط¯ظٹظ†", reports.suppliers], ["طھظ‚ط±ظٹط± ط·ظ„ط¨ط§طھ ط§ظ„ط´ط±ط§ط،", reports.purchase_requests], ["طھظ‚ط±ظٹط± ط£ظˆط§ظ…ط± ط§ظ„ط´ط±ط§ط،", reports.purchase_orders], ["طھظ‚ط±ظٹط± ط¥ط°ظˆظ† ط§ظ„ط§ط³طھظ„ط§ظ…", reports.receipts], ["طھظ‚ط±ظٹط± ظپظˆط§طھظٹط± ط§ظ„ط´ط±ط§ط،", reports.invoices], ["طھظ‚ط±ظٹط± ط§ظ„طµط±ظپ ظ„ظ„ظپط±ظˆط¹", reports.issues], ["طھظ‚ط±ظٹط± ط¥ط±ط¬ط§ط¹ ط§ظ„ظپط±ظˆط¹", reports.returns], ["طھظ‚ط±ظٹط± ط§ظ„طھط­ظˆظٹظ„ط§طھ", reports.transfers], ["طھظ‚ط±ظٹط± ط§ظ„طھط³ظˆظٹط§طھ", reports.adjustments], ["طھظ‚ط±ظٹط± ط§ظ„ط¬ط±ط¯", reports.stocktakes], ["طھظ‚ط±ظٹط± ط§ظ„ط±طµظٹط¯ ط§ظ„ط­ط§ظ„ظٹ", reports.balances], ["طھظ‚ط±ظٹط± ط­ط±ظƒط© طµظ†ظپ", reports.movements], ["طھظ‚ط±ظٹط± ط§ظ„ط£طµظ†ط§ظپ ظ…ظ†ط®ظپط¶ط© ط§ظ„ظ…ط®ط²ظˆظ†", reports.low_stock]];
  return <div className="space-y-4"><div className="panel grid gap-3 p-4 md:grid-cols-4"><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field" /><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„طھطµظ†ظٹظپط§طھ</option>{inventoryCategories.map((c) => <option key={c}>{c}</option>)}</select></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reportList.map(([title, rows]) => <div key={title} className="panel p-5"><FileBarChart className="text-brand-700" /><h3 className="mt-3 font-extrabold">{title}</h3><p className="mt-1 text-xs text-slate-500">ط¹ط¯ط¯ ط§ظ„ط³ط¬ظ„ط§طھ: {(rows || []).length}</p><div className="mt-5 flex gap-2"><button disabled={!canExport} onClick={() => exportExcel(rows || [], title)} className="btn-secondary flex-1"><FileSpreadsheet size={15} /> Excel</button><button onClick={() => printDocument(title, rowsToReportHtml(title, rows || [], [{ key: "document_number", label: "ط§ظ„ط±ظ‚ظ…" }, { key: "item_name", label: "ط§ظ„طµظ†ظپ" }, { key: "supplier_name", label: "ط§ظ„ظ…ظˆط±ط¯" }, { key: "branch", label: "ط§ظ„ظپط±ط¹" }, { key: "status", label: "ط§ظ„ط­ط§ظ„ط©" }]))} className="btn-secondary flex-1"><Printer size={15} /> PDF</button><button disabled={!canExport} onClick={() => exportDocx(title, rows || [])} className="btn-secondary flex-1"><Download size={15} /> Word</button></div></div>)}</div></div>;
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
      alert("طھظ… ط­ظپط¸ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ط®ط²ظˆظ†");
    } catch (e) { alert(e.message); }
  };
  if (loading) return <div className="panel p-6 text-center text-sm text-slate-500">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ط®ط²ظˆظ†...</div>;
  return (
    <div className="space-y-5">
      <div className="panel p-5">
        <div className="mb-4 flex"><h3 className="font-extrabold">ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¹ط§ظ…ط© ظ„ظ„ظ…ط®ط²ظˆظ†</h3><button onClick={saveAll} className="btn-primary mr-auto"><Save size={17} /> ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ</button></div>
        <div className="grid gap-4 md:grid-cols-3">
          <Label t="ط§ط³ظ… ط§ظ„ظ…ط®ط²ظ† ط§ظ„ط±ط¦ظٹط³ظٹ"><input value={general.main_warehouse_name || ""} onChange={(e) => setGeneral({ main_warehouse_name: e.target.value })} className="field mt-2" /></Label>
          <Label t="طھظپط¹ظٹظ„ طھط¹ط¯ط¯ ط§ظ„ظ…ط®ط§ط²ظ†"><select value={String(general.multi_warehouses === true)} onChange={(e) => setGeneral({ multi_warehouses: e.target.value === "true" })} className="field mt-2"><option value="false">ظ„ط§</option><option value="true">ظ†ط¹ظ…</option></select></Label>
          <Label t="ط§ظ„ط³ظ…ط§ط­ ط¨ط§ظ„طµط±ظپ ط¨ط¯ظˆظ† ط±طµظٹط¯"><select value={String(general.allow_negative_stock === true)} onChange={(e) => setGeneral({ allow_negative_stock: e.target.value === "true" })} className="field mt-2"><option value="false">ظ„ط§</option><option value="true">ظ†ط¹ظ…</option></select></Label>
          <Label t="طھط¹ط¯ظٹظ„ ط§ظ„ظ…ط³طھظ†ط¯ط§طھ ط§ظ„ظ…ط±ط­ظ„ط©"><select value={String(general.allow_edit_posted_documents === true)} onChange={(e) => setGeneral({ allow_edit_posted_documents: e.target.value === "true" })} className="field mt-2"><option value="false">ظ„ط§</option><option value="true">ظ†ط¹ظ…</option></select></Label>
          <Label t="ط·ط±ظٹظ‚ط© طھظ‚ظٹظٹظ… ط§ظ„ظ…ط®ط²ظˆظ†"><select value={general.valuation_method || "ظ…طھظˆط³ط· ط§ظ„طھظƒظ„ظپط©"} onChange={(e) => setGeneral({ valuation_method: e.target.value })} className="field mt-2"><option>ظ…طھظˆط³ط· ط§ظ„طھظƒظ„ظپط©</option><option>ط¢ط®ط± ط³ط¹ط± ط´ط±ط§ط،</option><option>ط³ط¹ط± ط«ط§ط¨طھ</option></select></Label>
          <Label t="طھظپط¹ظٹظ„ ط­ط¯ ط¥ط¹ط§ط¯ط© ط§ظ„ط·ظ„ط¨"><select value={String(general.enable_reorder_point !== false)} onChange={(e) => setGeneral({ enable_reorder_point: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط¹ظ…</option><option value="false">ظ„ط§</option></select></Label>
          <Label t="ط§ط¹طھظ…ط§ط¯ ط³ظ†ط¯ط§طھ ط§ظ„طµط±ظپ"><select value={String(general.require_issue_approval !== false)} onChange={(e) => setGeneral({ require_issue_approval: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط¹ظ…</option><option value="false">ظ„ط§</option></select></Label>
          <Label t="ط£ظٹط§ظ… ط§ظ„طھظ†ط¨ظٹظ‡ ظ‚ط¨ظ„ ط§ظ„ظ†ظپط§ط¯"><input type="number" value={general.stock_alert_days || 0} onChange={(e) => setGeneral({ stock_alert_days: e.target.value })} className="field mt-2" /></Label>
          <Label t="ط§ظ„ظˆط­ط¯ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©"><select value={general.default_unit || "ط­ط¨ط©"} onChange={(e) => setGeneral({ default_unit: e.target.value })} className="field mt-2">{inventoryUnits.map((u) => <option key={u}>{u}</option>)}</select></Label>
        </div>
      </div>
      <div className="panel p-5">
        <div className="mb-4 flex"><h3 className="font-extrabold">ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¹ظ…ظ„ط§طھ</h3><button onClick={() => setCurrencyRows([...currencyRows, { setting_id: `CUR-${Date.now()}`, currency_code: "", currency_name: "", exchange_rate: 1, is_base_currency: false, is_active: true }])} className="btn-secondary mr-auto"><Plus size={17} /> ط¥ط¶ط§ظپط© ط¹ظ…ظ„ط©</button></div>
        <div className="grid gap-4 md:grid-cols-3"><Label t="ط§ظ„ط¹ظ…ظ„ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©"><select value={currencyRows.find((c) => c.is_base_currency)?.currency_code || "YER"} onChange={(e) => setCurrencyRows(currencyRows.map((row) => ({ ...row, is_base_currency: row.currency_code === e.target.value })))} className="field mt-2">{currencyRows.map((c) => <option key={c.currency_code} value={c.currency_code}>{c.currency_code} - {c.currency_name}</option>)}</select></Label><Label t="ط§ظ„ط³ظ…ط§ط­ ط¨طھط؛ظٹظٹط± ط§ظ„ط¹ظ…ظ„ط© ظپظٹ ط§ظ„ظ…ط³طھظ†ط¯ط§طھ"><select value={String(general.allow_document_currency_change !== false)} onChange={(e) => setGeneral({ allow_document_currency_change: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط¹ظ…</option><option value="false">ظ„ط§</option></select></Label><Label t="ط§ظ„طھط­ظˆظٹظ„ ظ„ظ„ط¹ظ…ظ„ط© ط§ظ„ط£ط³ط§ط³ظٹط© ظپظٹ ط§ظ„طھظ‚ط§ط±ظٹط±"><select value={String(general.enable_base_currency_reports !== false)} onChange={(e) => setGeneral({ enable_base_currency_reports: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط¹ظ…</option><option value="false">ظ„ط§</option></select></Label></div>
        <div className="table-wrap mt-4"><table><thead><tr><th>ط§ظ„ظƒظˆط¯</th><th>ط§ط³ظ… ط§ظ„ط¹ظ…ظ„ط©</th><th>ط³ط¹ط± ط§ظ„طµط±ظپ</th><th>ط¹ظ…ظ„ط© ط£ط³ط§ط³ظٹط©</th><th>ظ†ط´ط·ط©</th></tr></thead><tbody>{currencyRows.map((row, i) => <tr key={row.setting_id || row.currency_code || i}><td><input className="field" value={row.currency_code} onChange={(e) => setCurrencyRows(currencyRows.map((x, idx) => idx === i ? { ...x, currency_code: e.target.value } : x))} /></td><td><input className="field" value={row.currency_name} onChange={(e) => setCurrencyRows(currencyRows.map((x, idx) => idx === i ? { ...x, currency_name: e.target.value } : x))} /></td><td><input type="number" className="field" value={row.exchange_rate} onChange={(e) => setCurrencyRows(currencyRows.map((x, idx) => idx === i ? { ...x, exchange_rate: e.target.value } : x))} /></td><td><input type="checkbox" checked={row.is_base_currency === true} onChange={(e) => setCurrencyRows(currencyRows.map((x, idx) => ({ ...x, is_base_currency: idx === i ? e.target.checked : e.target.checked ? false : x.is_base_currency })))} /></td><td><input type="checkbox" checked={row.is_active !== false} onChange={(e) => setCurrencyRows(currencyRows.map((x, idx) => idx === i ? { ...x, is_active: e.target.checked } : x))} /></td></tr>)}</tbody></table></div>
      </div>
      <div className="panel p-5">
        <h3 className="mb-4 font-extrabold">طھط±ظ‚ظٹظ… ط§ظ„ظ…ط³طھظ†ط¯ط§طھ</h3>
        <div className="table-wrap"><table><thead><tr><th>ط§ظ„ظ…ط³طھظ†ط¯</th><th>Prefix</th><th>ط§ظ„ط±ظ‚ظ… ط§ظ„طھط§ظ„ظٹ</th><th>ط¥ط¹ط§ط¯ط© ط³ظ†ظˆظٹط©</th><th>ظ…ط«ط§ظ„</th></tr></thead><tbody>{numbering.map((row, i) => <tr key={row.numbering_id}><td>{row.document_label}</td><td><input className="field" value={row.prefix} onChange={(e) => setNumbering(numbering.map((x, idx) => idx === i ? { ...x, prefix: e.target.value } : x))} /></td><td><input type="number" className="field" value={row.next_number} onChange={(e) => setNumbering(numbering.map((x, idx) => idx === i ? { ...x, next_number: e.target.value } : x))} /></td><td><input type="checkbox" checked={row.reset_yearly} onChange={(e) => setNumbering(numbering.map((x, idx) => idx === i ? { ...x, reset_yearly: e.target.checked } : x))} /></td><td>{inventorySettingsService.generateDocumentNumber(row)}</td></tr>)}</tbody></table></div>
      </div>
      <div className="panel p-5">
        <div className="mb-4 flex"><h3 className="font-extrabold">ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظپط±ظˆط¹ ط§ظ„ظ…ط®ط²ظ†ظٹط©</h3><button onClick={() => setBranchRows([...branchRows, { branch_setting_id: `IBS-${Date.now()}`, branch: branches[0] || "", allowed_to_request_items: true, allowed_to_receive_items: true, max_monthly_issue_limit: 0, default_receiver: "", notes: "" }])} className="btn-secondary mr-auto"><Plus size={17} /> ط¥ط¶ط§ظپط© ظپط±ط¹</button></div>
        <div className="table-wrap"><table><thead><tr><th>ط§ظ„ظپط±ط¹</th><th>ط·ظ„ط¨ ط£طµظ†ط§ظپ</th><th>ط§ط³طھظ„ط§ظ… ط£طµظ†ط§ظپ</th><th>ط­ط¯ ط§ظ„طµط±ظپ ط§ظ„ط´ظ‡ط±ظٹ</th><th>ط§ظ„ظ…ط³طھظ„ظ… ط§ظ„ط§ظپطھط±ط§ط¶ظٹ</th><th></th></tr></thead><tbody>{branchRows.map((row, i) => <tr key={row.branch_setting_id}><td><select className="field" value={row.branch} onChange={(e) => setBranchRows(branchRows.map((x, idx) => idx === i ? { ...x, branch: e.target.value } : x))}>{branches.map((b) => <option key={b}>{b}</option>)}</select></td><td><input type="checkbox" checked={row.allowed_to_request_items} onChange={(e) => setBranchRows(branchRows.map((x, idx) => idx === i ? { ...x, allowed_to_request_items: e.target.checked } : x))} /></td><td><input type="checkbox" checked={row.allowed_to_receive_items} onChange={(e) => setBranchRows(branchRows.map((x, idx) => idx === i ? { ...x, allowed_to_receive_items: e.target.checked } : x))} /></td><td><input className="field" type="number" value={row.max_monthly_issue_limit} onChange={(e) => setBranchRows(branchRows.map((x, idx) => idx === i ? { ...x, max_monthly_issue_limit: e.target.value } : x))} /></td><td><input className="field" value={row.default_receiver} onChange={(e) => setBranchRows(branchRows.map((x, idx) => idx === i ? { ...x, default_receiver: e.target.value } : x))} /></td><td><button onClick={() => inventorySettingsService.saveBranchSetting(row).then(load).catch((e) => alert(e.message))} className="text-blue-600"><Save size={16} /></button><button onClick={() => inventorySettingsService.deleteBranchSetting(row.branch_setting_id).then(load).catch((e) => alert(e.message))} className="text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>
      </div>
    </div>
  );
}

function InventoryItemDialog({ dialog, setDialog, save }) {
  const currency = getInventoryCurrency(dialog.default_currency_code || dialog.currency_code || "YER");
  const totals = calculateInventoryLineTotal({ quantity: dialog.current_balance || dialog.opening_balance || 0, unit_price: dialog.default_unit_cost || 0, currency_code: currency.currency_code, exchange_rate: dialog.exchange_rate || currency.exchange_rate });
  const setCurrency = (code) => { const c = getInventoryCurrency(code); setDialog({ ...dialog, default_currency_code: c.currency_code, default_currency_name: c.currency_name, currency_code: c.currency_code, currency_name: c.currency_name, exchange_rate: c.exchange_rate }); };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"><DialogTitle title="ط¨ظٹط§ظ†ط§طھ ط§ظ„طµظ†ظپ" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="ظƒظˆط¯ ط§ظ„طµظ†ظپ"><input required value={dialog.item_code} onChange={(e) => setDialog({ ...dialog, item_code: e.target.value })} className="field mt-2" /></Label><Label t="ط§ط³ظ… ط§ظ„طµظ†ظپ"><input required value={dialog.item_name} onChange={(e) => setDialog({ ...dialog, item_name: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„طھطµظ†ظٹظپ"><select value={dialog.category} onChange={(e) => setDialog({ ...dialog, category: e.target.value })} className="field mt-2">{inventoryCategories.map((c) => <option key={c}>{c}</option>)}</select></Label><Label t="ظˆط­ط¯ط© ط§ظ„ظ‚ظٹط§ط³"><select value={dialog.unit_type} onChange={(e) => setDialog({ ...dialog, unit_type: e.target.value })} className="field mt-2">{inventoryUnits.map((u) => <option key={u}>{u}</option>)}</select></Label><Label t="طھظƒظ„ظپط© ط§ظ„ظˆط­ط¯ط©"><input type="number" value={dialog.default_unit_cost} onChange={(e) => setDialog({ ...dialog, default_unit_cost: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط¹ظ…ظ„ط©"><select value={currency.currency_code} onChange={(e) => setCurrency(e.target.value)} className="field mt-2">{inventoryCurrencies.map((c) => <option key={c.currency_code} value={c.currency_code}>{c.currency_code} - {c.currency_name}</option>)}</select></Label><Label t="ط³ط¹ط± ط§ظ„طµط±ظپ"><input type="number" value={dialog.exchange_rate || currency.exchange_rate} onChange={(e) => setDialog({ ...dialog, exchange_rate: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط¯ ط§ظ„ط£ط¯ظ†ظ‰"><input type="number" value={dialog.minimum_stock} onChange={(e) => setDialog({ ...dialog, minimum_stock: e.target.value })} className="field mt-2" /></Label><Label t="ظ†ظ‚ط·ط© ط¥ط¹ط§ط¯ط© ط§ظ„ط·ظ„ط¨"><input type="number" value={dialog.reorder_point} onChange={(e) => setDialog({ ...dialog, reorder_point: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط±طµظٹط¯ ط§ظ„ط§ظپطھطھط§ط­ظٹ"><input type="number" value={dialog.opening_balance} onChange={(e) => setDialog({ ...dialog, opening_balance: e.target.value, current_balance: e.target.value })} className="field mt-2" /></Label><Label t="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط³ط¹ط±"><input readOnly value={`${nf.format(totals.total_value)} ${totals.currency_code}`} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ط¨ط§ظ„ط¹ظ…ظ„ط© ط§ظ„ط£ط³ط§ط³ظٹط©"><input readOnly value={`${nf.format(totals.total_value_base)} YER`} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ط؛ظٹط± ظ†ط´ط·</option></select></Label><Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>;
}


function InventorySupplierDialog({ dialog, setDialog, save }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6"><DialogTitle title="ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظˆط±ط¯" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-2"><Label t="ط§ط³ظ… ط§ظ„ظ…ظˆط±ط¯"><input required value={dialog.supplier_name} onChange={(e) => setDialog({ ...dialog, supplier_name: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظ‡ط§طھظپ"><input value={dialog.phone} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط¹ظ†ظˆط§ظ†"><input value={dialog.address} onChange={(e) => setDialog({ ...dialog, address: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط±ظ‚ظ… ط§ظ„ط¶ط±ظٹط¨ظٹ"><input value={dialog.tax_number} onChange={(e) => setDialog({ ...dialog, tax_number: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط³ط¬ظ„ ط§ظ„طھط¬ط§ط±ظٹ"><input value={dialog.commercial_register} onChange={(e) => setDialog({ ...dialog, commercial_register: e.target.value })} className="field mt-2" /></Label><Label t="ظ…ط³ط¤ظˆظ„ ط§ظ„طھظˆط§طµظ„"><input value={dialog.contact_person} onChange={(e) => setDialog({ ...dialog, contact_person: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ط؛ظٹط± ظ†ط´ط·</option></select></Label><Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>;
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
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-6xl overflow-y-auto p-6"><DialogTitle title={inventoryDocumentConfigs[dialog.type]?.label || "ظ…ط³طھظ†ط¯ ظ…ط®ط²ظ†ظٹ"} close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-4"><Label t="ط±ظ‚ظ… ط§ظ„ظ…ط³طھظ†ط¯"><input value={dialog.document_number} onChange={(e) => setDialog({ ...dialog, document_number: e.target.value })} className="field mt-2" /></Label><Label t="طھط§ط±ظٹط® ط§ظ„ظ…ط³طھظ†ط¯"><input required type="date" value={dialog.document_date} onChange={(e) => setDialog({ ...dialog, document_date: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظ…ظˆط±ط¯"><select value={dialog.supplier_id} onChange={(e) => selectSupplier(e.target.value)} className="field mt-2"><option value="">ط¨ط¯ظˆظ† ظ…ظˆط±ط¯</option>{suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}</select></Label><Label t="ط§ظ„ظپط±ط¹"><select value={dialog.branch || dialog.requesting_branch} onChange={(e) => setDialog({ ...dialog, branch: e.target.value, requesting_branch: e.target.value })} className="field mt-2">{branches.map((b) => <option key={b}>{b}</option>)}</select></Label><Label t="ط§ظ„ط¹ظ…ظ„ط©"><select value={currentCurrency.currency_code} onChange={(e) => setCurrency(e.target.value)} className="field mt-2">{inventoryCurrencies.map((c) => <option key={c.currency_code} value={c.currency_code}>{c.currency_code} - {c.currency_name}</option>)}</select></Label><Label t="ط³ط¹ط± ط§ظ„طµط±ظپ"><input type="number" value={dialog.exchange_rate || currentCurrency.exchange_rate} onChange={(e) => setDialog({ ...dialog, exchange_rate: e.target.value, details: (dialog.details || []).map((d) => ({ ...d, exchange_rate: e.target.value, ...calculateInventoryLineTotal({ ...d, exchange_rate: e.target.value }) })) })} className="field mt-2" /></Label><Label t="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط³ط¹ط±"><input readOnly value={`${nf.format(docTotals.total)} ${currentCurrency.currency_code}`} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ط¨ط§ظ„ط¹ظ…ظ„ط© ط§ظ„ط£ط³ط§ط³ظٹط©"><input readOnly value={`${nf.format(docTotals.base)} YER`} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ظ„ط£ظˆظ„ظˆظٹط©"><select value={dialog.priority || "ط¹ط§ط¯ظٹ"} onChange={(e) => setDialog({ ...dialog, priority: e.target.value })} className="field mt-2"><option>ط¹ط§ط¯ظٹ</option><option>ط¹ط§ط¬ظ„</option><option>ط·ط§ط±ط¦</option></select></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={dialog.status} onChange={(e) => setDialog({ ...dialog, status: e.target.value, approval_status: e.target.value })} className="field mt-2">{inventoryStatusFlow.map((s) => <option key={s}>{s}</option>)}</select></Label><Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><input value={dialog.notes || ""} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2" /></Label></div>{dialog.type !== "invoices" && dialog.type !== "adjustments" && <div className="mt-6 rounded-2xl border p-4"><div className="mb-3 flex"><h4 className="font-extrabold">طھظپط§طµظٹظ„ ط§ظ„ط£طµظ†ط§ظپ</h4><button type="button" onClick={addDetail} className="btn-secondary mr-auto"><Plus size={15} /> ط¥ط¶ط§ظپط© طµظ†ظپ</button></div><div className="space-y-2">{(dialog.details || []).map((d, i) => <div key={d.detail_id || i} className="grid gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-8"><select value={d.item_id} onChange={(e) => selectItem(i, e.target.value)} className="field"><option value="">ط§ط®طھط± ط§ظ„طµظ†ظپ</option>{items.map((item) => <option key={item.item_id} value={item.item_id}>{item.item_name}</option>)}</select><input value={d.unit_type} readOnly className="field bg-white" /><input type="number" value={d.quantity} onChange={(e) => updateDetail(i, { quantity: e.target.value })} className="field" placeholder="ط§ظ„ظƒظ…ظٹط©" /><input type="number" value={d.unit_cost || d.unit_price} onChange={(e) => updateDetail(i, { unit_cost: e.target.value, unit_price: e.target.value })} className="field" placeholder="ط§ظ„ط³ط¹ط±" /><select value={d.currency_code || currentCurrency.currency_code} onChange={(e) => { const c = getInventoryCurrency(e.target.value); updateDetail(i, { currency_code: c.currency_code, currency_name: c.currency_name, exchange_rate: c.exchange_rate }); }} className="field">{inventoryCurrencies.map((c) => <option key={c.currency_code} value={c.currency_code}>{c.currency_code}</option>)}</select><input type="number" value={d.exchange_rate || currentCurrency.exchange_rate} onChange={(e) => updateDetail(i, { exchange_rate: e.target.value })} className="field" /><input value={`${nf.format(Number(d.total_value || 0))} ${d.currency_code || currentCurrency.currency_code}`} readOnly className="field bg-white" /><button type="button" onClick={() => setDialog({ ...dialog, details: dialog.details.filter((_, idx) => idx !== i) })} className="btn-secondary text-red-600">ط­ط°ظپ</button><input value={`${nf.format(Number(d.total_value_base || 0))} YER`} readOnly className="field bg-white md:col-span-2" /></div>)}</div></div>}<DialogActions close={() => setDialog(null)} /></form></div>;
}

const normalizeLegacyShiftPeriods = (types, periods) => {
  const existing = Array.isArray(periods) ? periods : [];
  const generated = types
    .filter((type) => !existing.some((period) => period.shift_type_id === type.shift_type_id) && type.start_time && type.end_time)
    .map((type) => ({
      period_id: `LEGACY-${type.shift_type_id}`,
      shift_type_id: type.shift_type_id,
      period_name: type.shift_period || "ظپطھط±ط© ط§ظ„ط¹ظ…ظ„",
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
  if (type.shift_mode === "ظ…ط±ظ†") return Number(type.required_hours || type.total_hours || 0);
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
    if (String(role).includes("ط§ظ„ظ…ظˆط¸ظپ") && currentUser?.employeeId) return a.employee_id === currentUser.employeeId;
    if (String(role).includes("ظ…ط¯ظٹط± ظپط±ط¹") && currentUser?.branch) return a.branch === currentUser.branch;
    return true;
  });
  const today = new Date().toISOString().slice(0, 10);
  const todayAssignments = visibleAssignments.filter((a) => a.assignment_date === today);
  const scheduledIds = new Set(todayAssignments.map((a) => a.employee_id));
  const shortageBranches = usedShifts.filter((u) => u.is_active && u.min_employees).filter((u) => todayAssignments.filter((a) => a.branch === u.branch && a.shift_type_id === u.shift_type_id).length < u.min_employees);
  const conflictRows = visibleAssignments.filter((a, i, arr) => arr.some((b, j) => i !== j && a.assignment_date === b.assignment_date && a.employee_id === b.employee_id && shiftsOverlap(a, b)));
  const pressureBranch = Object.entries(groupCount(todayAssignments, "branch")).sort((a, b) => b[1] - a[1])[0]?.[0] || "â€”";
  const cards = [
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط´ظپطھط§طھ", shiftTypes.length, CalendarCheck],
    ["ط§ظ„ط´ظپطھط§طھ ط§ظ„ظ†ط´ط·ط©", shiftTypes.filter((s) => s.is_active).length, BadgeCheck],
    ["ط§ظ„ظ…ظˆط¸ظپظˆظ† ط§ظ„ظ…ط¬ط¯ظˆظ„ظˆظ† ط§ظ„ظٹظˆظ…", scheduledIds.size, Users],
    ["ط§ظ„ظپط±ظˆط¹ ط§ظ„طھظٹ ظ„ط¯ظٹظ‡ط§ ظ†ظ‚طµ طھط؛ط·ظٹط©", new Set(shortageBranches.map((x) => x.branch)).size, AlertTriangle],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط³ط§ط¹ط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ظٹظˆظ…", todayAssignments.reduce((s, a) => s + Number(a.total_hours || 0), 0).toFixed(1), Clock3],
    ["ط¹ط¯ط¯ ط§ظ„طھط¹ط§ط±ط¶ط§طھ", conflictRows.length, MessageSquareWarning],
    ["ط§ظ„ظ…ظˆط¸ظپظˆظ† ط؛ظٹط± ط§ظ„ظ…ط¬ط¯ظˆظ„ظٹظ†", employees.filter((e) => !scheduledIds.has(e.id)).length, UserCheck],
    ["ط£ظƒط«ط± ظپط±ط¹ ظ„ط¯ظٹظ‡ ط¶ط؛ط· ط´ظپطھط§طھ", pressureBranch, Building2],
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
    if ((exists && !canEdit) || (!exists && !canCreate)) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    const activePeriods = (dialog.periods || []).filter((period) => period.is_active !== false);
    if (!dialog.shift_name?.trim()) return alert("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„ط´ظپطھ");
    if (!dialog.shift_mode) return alert("ظٹط¬ط¨ طھط­ط¯ظٹط¯ ظ†ظˆط¹ ط§ظ„ط´ظپطھ ط«ط§ط¨طھ ط£ظˆ ظ…ط±ظ†");
    if (dialog.shift_mode === "ط«ط§ط¨طھ" && !activePeriods.length) return alert("ظٹط¬ط¨ ط¥ط¶ط§ظپط© ظپطھط±ط© ظˆط§ط­ط¯ط© ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„");
    if (activePeriods.some((period) => !period.start_time || !period.end_time)) return alert("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ظˆظ‚طھ ط§ظ„ط¨ط¯ط§ظٹط© ظˆط§ظ„ظ†ظ‡ط§ظٹط©");
    if (activePeriods.some((period) => calculateShiftHours(period.start_time, period.end_time) <= 0)) return alert("ط¹ط¯ط¯ ط³ط§ط¹ط§طھ ط§ظ„ط´ظپطھ ط؛ظٹط± طµط­ظٹط­");
    if (dialog.shift_mode === "ظ…ط±ظ†" && (!Number(dialog.required_hours) || !dialog.flexible_start_from || !dialog.flexible_end_until)) return alert("ظٹط¬ط¨ طھط­ط¯ظٹط¯ ظ†ط·ط§ظ‚ ط§ظ„ط´ظپطھ ط§ظ„ظ…ط±ظ† ظˆط¹ط¯ط¯ ط§ظ„ط³ط§ط¹ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©");
    try {
      const totalHours = dialog.shift_mode === "ظ…ط±ظ†"
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
    if (duplicate && !confirm("ظٹظˆط¬ط¯ ط´ظپطھ ظ†ط´ط· ط¨ظ†ظپط³ ط§ظ„ظپط±ط¹ ظˆظ†ظپط³ ط§ظ„ظپطھط±ط©. ظ‡ظ„ طھط±ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©طں")) return;
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
      shift_mode: s?.shift_mode || "ط«ط§ط¨طھ",
      shift_periods: rows,
      start_time: first.start_time || "",
      end_time: last.end_time || "",
      total_hours: shiftTotalHours(s || {}, shiftTypePeriods),
    }));
  };
  const saveAssignments = async (e) => {
    e.preventDefault();
    if (!canCreate) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
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
      shift_mode: dialog.shift_mode || "ط«ط§ط¨طھ",
      shift_periods: dialog.shift_periods || [],
      start_time: dialog.start_time,
      end_time: dialog.end_time,
      total_hours: Number(dialog.total_hours || calculateShiftHours(dialog.start_time, dialog.end_time)),
      status: "ظ…ط¬ط¯ظˆظ„",
      notes: dialog.notes || "",
    }));
    if (!rows.length) return alert("ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ظ…ظˆط¸ظپ ظˆط§ط­ط¯ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„.");
    const warnings = [];
    rows.forEach((row) => {
      if (assignments.some((a) => a.assignment_date === row.assignment_date && a.employee_id === row.employee_id && shiftsOverlap(a, row))) warnings.push(`ظٹظˆط¬ط¯ طھط¹ط§ط±ط¶ ظپظٹ ط¬ط¯ظˆظ„ ط§ظ„ظ…ظˆط¸ظپ ${row.employee_name}`);
      const employee = employees.find((emp) => emp.id === row.employee_id);
      if (employee?.status === "ط¥ط¬ط§ط²ط©" || employee?.status === "ط·آ¥ط·آ¬ط·آ§ط·آ²ط·آ©") warnings.push(`ط§ظ„ظ…ظˆط¸ظپ ${row.employee_name} ظپظٹ ط¥ط¬ط§ط²ط©`);
      const used = usedShifts.find((u) => u.branch === row.branch && u.shift_type_id === row.shift_type_id && u.is_active);
      if (used) {
        const count = assignments.filter((a) => a.assignment_date === row.assignment_date && a.branch === row.branch && a.shift_type_id === row.shift_type_id).length + rows.filter((r) => r.branch === row.branch && r.shift_type_id === row.shift_type_id).length;
        if (used.min_employees && count < used.min_employees) warnings.push(`ظ„ط§ طھظˆط¬ط¯ طھط؛ط·ظٹط© ظƒط§ظپظٹط© ظ„ظ‡ط°ط§ ط§ظ„ظپط±ط¹: ${row.branch}`);
        if (used.max_employees && count > used.max_employees) warnings.push(`ط¹ط¯ط¯ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط£ظƒط¨ط± ظ…ظ† ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰ ظپظٹ ${row.branch}`);
      }
    });
    if (warnings.length && !canOverrideShiftConflicts(role)) return alert(warnings.join("\n"));
    if (warnings.length && !confirm(`${warnings.join("\n")}\nظ‡ظ„ طھط±ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©طں`)) return;
    try {
      const saved = await shiftAssignmentsService.save(rows);
      setAssignments((list) => [...saved, ...list]);
      setDialog(null);
    } catch (err) { alert(err.message); }
  };
  const removeRecord = async (kind, id) => {
    if (!canDelete) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط§ظ„ط³ط¬ظ„طں")) return;
    try {
      if (kind === "type") { await shiftsService.removeType(id); setShiftTypes((list) => list.filter((x) => x.shift_type_id !== id)); }
      else if (kind === "used") { await shiftsService.removeUsed(id); setUsedShifts((list) => list.filter((x) => x.used_shift_id !== id)); }
      else if (kind === "scenario") { await shiftScenariosService.removeScenario(id); setScenarios((list) => list.filter((x) => x.scenario_id !== id)); setScenarioDetails((list) => list.filter((x) => x.scenario_id !== id)); }
      else { await shiftAssignmentsService.remove(id); setAssignments((list) => list.filter((x) => x.assignment_id !== id)); }
    } catch (err) { alert(err.message); }
  };
  const copyShiftSchedule = async (fromDate, toDate, targetBranch = "") => {
    const source = assignments.filter((a) => a.assignment_date === fromDate && (!targetBranch || a.branch === targetBranch));
    if (!source.length) return alert("ظ„ط§ طھظˆط¬ط¯ ط´ظپطھط§طھ ظ„ظ†ط³ط®ظ‡ط§ ظ…ظ† ط§ظ„طھط§ط±ظٹط® ط§ظ„ظ…ط­ط¯ط¯.");
    try {
      const saved = await shiftAssignmentsService.save(source.map((a) => ({ ...a, assignment_id: `${toDate}-${a.employee_id}-${a.shift_type_id}-${Date.now()}-${Math.random().toString(16).slice(2)}`, assignment_date: toDate })));
      setAssignments((list) => [...saved, ...list]);
      alert("طھظ… ظ†ط³ط® ط§ظ„ط¬ط¯ظˆظ„ ط¨ظ†ط¬ط§ط­");
    } catch (e) { alert(e.message); }
  };
  const exportShiftReport = (title, rows) => {
    const exportRows = reportRowsForExport(rows, shiftAssignmentColumns);
    return { exportRows, print: () => printDocument(title, `<h1>${title}</h1><p>طھط§ط±ظٹط® ط§ظ„طھظ‚ط±ظٹط±: ${new Date().toLocaleDateString("ar-SA")}</p>${rowsToReportHtml("", rows, shiftAssignmentColumns)}<div style="margin-top:36px;display:flex;justify-content:space-between"><b>ط¥ط¹ط¯ط§ط¯ ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©</b><b>ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¥ط¯ط§ط±ط©</b></div>`) };
  };
  return (
    <div className="space-y-5">
      <PageHead title="ط´ظپطھط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†" desc="ط¥ط¯ط§ط±ط© ط£ظ†ظˆط§ط¹ ط§ظ„ط´ظپطھط§طھ ظˆط§ظ„ط³ظٹظ†ط§ط±ظٹظˆظ‡ط§طھ ظˆطھظˆط²ظٹط¹ ط§ظ„ظ…ظˆط¸ظپظٹظ† ظˆط§ظ„طھظ‚ط§ط±ظٹط±" action={<button onClick={() => setTab("assignments")} className="btn-primary"><CalendarCheck size={18} /> طھظˆط²ظٹط¹ ط´ظپطھ</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}</div>
      <div className="panel flex flex-wrap gap-2 p-2">{shiftTabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>)}</div>
      {loading ? <div className="panel p-6 text-center text-sm text-slate-500">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط´ظپطھط§طھ...</div> : (
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
  dashboard: "ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…",
  employees: "ط§ظ„ظ…ظˆط¸ظپظˆظ†",
  evaluations: "ط§ظ„طھظ‚ظٹظٹظ…ط§طھ",
  incentives: "ط§ظ„ط­ظˆط§ظپط²",
  guarantees: "ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†",
  overtime: "ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ",
  shifts: "ط´ظپطھط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†",
  reports_center: "ظ…ط±ظƒط² ط§ظ„طھظ‚ط§ط±ظٹط±",
  reports: "ط§ظ„طھظ‚ط§ط±ظٹط±",
  settings: "ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ",
  users_permissions: "ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ† ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ",
  audit_logs: "ط³ط¬ظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ",
};

function ShiftTypesTab({ rows, periods, setDialog, removeRecord, filters, setFilters }) {
  const filtered = rows.filter((r) => (!filters.q || r.shift_name.includes(filters.q)) && (filters.period === "all" || r.shift_period === filters.period));
  return <div className="panel p-4"><div className="mb-4 flex flex-wrap gap-3"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط¨ط­ط« ط¨ط§ط³ظ… ط§ظ„ط´ظپطھ..." /><select value={filters.period} onChange={(e) => setFilters({ ...filters, period: e.target.value })} className="field max-w-[170px]"><option value="all">ظƒظ„ ط§ظ„ظپطھط±ط§طھ</option>{shiftPeriods.map((p) => <option key={p}>{p}</option>)}</select><button onClick={() => setDialog({ kind: "type", shift_type_id: `ST-${Date.now()}`, shift_name: "", start_time: "08:00", end_time: "15:00", total_hours: 7, break_minutes: 0, shift_period: "طµط¨ط§ط­ظٹ", shift_mode: "ط«ط§ط¨طھ", flexible_start_from: "", flexible_end_until: "", required_hours: 0, is_active: true, notes: "", periods: [{ period_id: `STP-${Date.now()}`, period_name: "ظپطھط±ط© ط§ظ„ط¹ظ…ظ„", start_time: "08:00", end_time: "15:00", total_hours: 7, sort_order: 1, is_active: true, notes: "" }] })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط© ظ†ظˆط¹</button></div><div className="table-wrap"><table><thead><tr><th>ط§ظ„ط´ظپطھ</th><th>ظ†ظˆط¹ ط§ظ„ط´ظپطھ</th><th>ط¹ط¯ط¯ ط§ظ„ظپطھط±ط§طھ</th><th>ط§ظ„ط³ط§ط¹ط§طھ</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{filtered.map((r) => { const rows = periodsForShift(r.shift_type_id, periods); return <tr key={r.shift_type_id}><td><b>{r.shift_name}</b><div className="mt-2 space-y-1 text-xs text-slate-500">{rows.map((p) => <p key={p.period_id}>{p.period_name}: {p.start_time} - {p.end_time}</p>)}</div></td><td><Status>{r.shift_mode || "ط«ط§ط¨طھ"}</Status></td><td>{rows.length}</td><td>{shiftTotalHours(r, periods)}</td><td><Status>{r.is_active ? "ظ†ط´ط·" : "ط؛ظٹط± ظ†ط´ط·"}</Status></td><td><button onClick={() => setDialog({ ...r, kind: "type", periods: rows })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => removeRecord("type", r.shift_type_id)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>; })}</tbody></table></div></div>;
}

function UsedShiftsTab({ rows, shiftTypes, periods, setDialog, removeRecord, filters, setFilters }) {
  const filtered = rows.filter((r) => (filters.branch === "all" || r.branch === filters.branch) && (filters.active === "all" || String(r.is_active) === filters.active));
  return <div className="panel p-4"><div className="mb-4 flex flex-wrap gap-3"><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><select value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })} className="field max-w-[160px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option><option value="true">ظ†ط´ط·</option><option value="false">ط؛ظٹط± ظ†ط´ط·</option></select><button onClick={() => setDialog({ kind: "used", used_shift_id: `US-${Date.now()}`, branch: branches[0], shift_type_id: shiftTypes[0]?.shift_type_id || "", shift_name: shiftTypes[0]?.shift_name || "", start_time: shiftTypes[0]?.start_time || "08:00", end_time: shiftTypes[0]?.end_time || "15:00", required_employees: 1, min_employees: 1, max_employees: 3, active_from: new Date().toISOString().slice(0, 10), active_to: "", is_active: true, notes: "" })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط© ط´ظپطھ ظ…ط³طھط®ط¯ظ…</button></div><div className="table-wrap"><table><thead><tr><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„ط´ظپطھ</th><th>ط§ظ„ظپطھط±ط§طھ</th><th>ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ</th><th>ط§ظ„ظ…ط·ظ„ظˆط¨</th><th>ط§ظ„ط£ط¯ظ†ظ‰/ط§ظ„ط£ظ‚طµظ‰</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{filtered.map((r) => { const rows = periodsForShift(r.shift_type_id, periods); return <tr key={r.used_shift_id}><td>{r.branch}</td><td>{r.shift_name}</td><td><div className="space-y-1 text-xs text-slate-500">{rows.map((p) => <p key={p.period_id}>{p.period_name}: {p.start_time}-{p.end_time}</p>)}</div></td><td>{rows.reduce((s, p) => s + Number(p.total_hours || 0), 0) || calculateShiftHours(r.start_time, r.end_time)}</td><td>{r.required_employees}</td><td>{r.min_employees} / {r.max_employees}</td><td><Status>{r.is_active ? "ظ†ط´ط·" : "ط؛ظٹط± ظ†ط´ط·"}</Status></td><td><button onClick={() => setDialog({ ...r, kind: "used" })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => removeRecord("used", r.used_shift_id)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>; })}</tbody></table></div></div>;
}

function ShiftScenariosTab({ rows, details, setDialog, removeRecord, filters, setFilters }) {
  const filtered = rows.filter((r) => (filters.branch === "all" || r.branch === filters.branch || r.branch === "ظƒظ„ ط§ظ„ظپط±ظˆط¹") && (filters.status === "all" || r.scenario_type === filters.status));
  return <div className="panel p-4"><div className="mb-4 flex flex-wrap gap-3"><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option><option>ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[160px]"><option value="all">ظƒظ„ ط§ظ„ط£ظ†ظˆط§ط¹</option>{scenarioTypes.map((s) => <option key={s}>{s}</option>)}</select><button onClick={() => setDialog({ kind: "scenario", scenario_id: `SC-${Date.now()}`, scenario_name: "", branch: "ظƒظ„ ط§ظ„ظپط±ظˆط¹", scenario_type: "ط¹ط§ط¯ظٹ", description: "", is_active: true, details: [] })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط© ط³ظٹظ†ط§ط±ظٹظˆ</button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((r) => <div key={r.scenario_id} className="rounded-2xl border p-4"><div className="flex"><b>{r.scenario_name}</b><Status>{r.is_active ? "ظ†ط´ط·" : "ط؛ظٹط± ظ†ط´ط·"}</Status></div><p className="mt-2 text-sm text-slate-500">{r.branch} â€¢ {r.scenario_type}</p><p className="mt-2 text-xs text-slate-400">ط¹ط¯ط¯ ط§ظ„ط´ظپطھط§طھ: {details.filter((d) => d.scenario_id === r.scenario_id).length}</p><div className="mt-4 flex gap-2"><button onClick={() => setDialog({ ...r, kind: "scenario", details: details.filter((d) => d.scenario_id === r.scenario_id) })} className="btn-secondary"><Pencil size={15} /> طھط¹ط¯ظٹظ„</button><button onClick={() => removeRecord("scenario", r.scenario_id)} className="btn-secondary text-red-600"><Trash2 size={15} /></button></div></div>)}</div></div>;
}

function ShiftAssignmentsTab({ rows, employees, shiftTypes, periods, setDialog, removeRecord, filters, setFilters, copyShiftSchedule, setEmployeeDialog }) {
  const firstShift = shiftTypes[0] || {};
  const firstPeriods = periodsForShift(firstShift.shift_type_id, periods);
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="field max-w-[170px]" /><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field min-w-[180px]" placeholder="ط¨ط­ط« ط¨ط§ظ„ظ…ظˆط¸ظپ..." /><select value={filters.shift} onChange={(e) => setFilters({ ...filters, shift: e.target.value })} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„ط´ظپطھط§طھ</option>{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[160px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{shiftAssignmentStatuses.map((s) => <option key={s}>{s}</option>)}</select><button onClick={() => setDialog({ kind: "assignment", assignment_date: new Date().toISOString().slice(0, 10), shift_type_id: firstShift.shift_type_id || "", shift_name: firstShift.shift_name || "", shift_mode: firstShift.shift_mode || "ط«ط§ط¨طھ", shift_periods: firstPeriods, start_time: firstPeriods[0]?.start_time || firstShift.start_time || "08:00", end_time: firstPeriods[firstPeriods.length - 1]?.end_time || firstShift.end_time || "15:00", total_hours: shiftTotalHours(firstShift, periods), selected_employee_ids: [], notes: "" })} className="btn-primary"><Plus size={17} /> طھظˆط²ظٹط¹ ط´ظپطھ</button><button onClick={() => setEmployeeDialog({ editing: null })} className="btn-secondary"><Users size={17} /> ط¥ط¶ط§ظپط© ظ…ظˆط¸ظپ</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr>{shiftAssignmentColumns.map((c) => <th key={c.key}>{c.label}</th>)}<th>ظˆط§طھط³ط§ط¨</th><th></th></tr></thead><tbody>{rows.map((r) => <tr key={r.assignment_id}><td>{r.assignment_date}</td><td>{r.employee_name}</td><td>{r.branch}</td><td><b>{r.shift_name}</b><p className="mt-1 text-xs text-slate-400">{r.shift_mode || "ط«ط§ط¨طھ"}</p><div className="mt-1 space-y-1 text-xs text-slate-500">{(r.shift_periods || []).map((p) => <p key={p.period_id || p.period_name}>{p.period_name}: {p.start_time}-{p.end_time}</p>)}</div></td><td>{r.start_time}</td><td>{r.end_time}</td><td>{r.total_hours}</td><td><Status>{r.status}</Status></td><td><button onClick={() => navigator.clipboard?.writeText(makeShiftMessage(r)).then(() => alert("طھظ… ظ†ط³ط® ط§ظ„ط±ط³ط§ظ„ط©"))} className="btn-secondary !h-9 !px-3">ظ†ط³ط® ط§ظ„ط±ط³ط§ظ„ط©</button><button onClick={() => window.open(`https://wa.me/${normalizeWhatsAppPhone(r.employee_phone)}?text=${encodeURIComponent(makeShiftMessage(r))}`, "_blank")} className="btn-secondary !h-9 !px-3">ظپطھط­ ظˆط§طھط³ط§ط¨</button></td><td><button onClick={() => removeRecord("assignment", r.assignment_id)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div><CopyScheduleBox copyShiftSchedule={copyShiftSchedule} /></div>;
}

function CopyScheduleBox({ copyShiftSchedule }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [branch, setBranch] = useState("");
  return <div className="panel flex flex-wrap items-end gap-3 p-4"><Label t="ظ†ط³ط® ظ…ظ† طھط§ط±ظٹط®"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field mt-2" /></Label><Label t="ط¥ظ„ظ‰ طھط§ط±ظٹط®"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field mt-2" /></Label><Label t="ط§ظ„ظپط±ط¹ ط§ط®طھظٹط§ط±ظٹ"><select value={branch} onChange={(e) => setBranch(e.target.value)} className="field mt-2"><option value="">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select></Label><button onClick={() => from && to ? copyShiftSchedule(from, to, branch) : alert("ط­ط¯ط¯ طھط§ط±ظٹط® ط§ظ„ظ†ط³ط® ظˆط§ظ„طھط§ط±ظٹط® ط§ظ„ط¬ط¯ظٹط¯")} className="btn-secondary">ظ†ط³ط® ط§ظ„ط¬ط¯ظˆظ„</button></div>;
}

function ShiftReportsTab({ rows, employees, assignments, shiftTypes, filters, setFilters, canExport, exportShiftReport }) {
  const unscheduled = employees.filter((e) => !assignments.some((a) => a.employee_id === e.id && (!filters.date || a.assignment_date === filters.date)));
  const conflicts = assignments.filter((a, i, arr) => arr.some((b, j) => i !== j && a.assignment_date === b.assignment_date && a.employee_id === b.employee_id && shiftsOverlap(a, b)));
  const reports = [["طھظ‚ط±ظٹط± ط§ظ„ط´ظپطھط§طھ ط§ظ„ظٹظˆظ…ظٹ", rows], ["طھظ‚ط±ظٹط± ط§ظ„ط´ظپطھط§طھ ط­ط³ط¨ ط§ظ„ظپط±ط¹", rows], ["طھظ‚ط±ظٹط± ط§ظ„ط´ظپطھط§طھ ط­ط³ط¨ ط§ظ„ظ…ظˆط¸ظپ", rows], ["طھظ‚ط±ظٹط± ط§ظ„ط´ظپطھط§طھ ط­ط³ط¨ ط§ظ„ط´ظ‡ط±", rows], ["طھظ‚ط±ظٹط± ظ†ظ‚طµ ط§ظ„طھط؛ط·ظٹط©", rows.filter((r) => r.status === "ط؛ط§ط¦ط¨")], ["طھظ‚ط±ظٹط± ط§ظ„طھط¹ط§ط±ط¶ط§طھ", conflicts], ["طھظ‚ط±ظٹط± ط¥ط¬ظ…ط§ظ„ظٹ ط³ط§ط¹ط§طھ ط§ظ„ط¹ظ…ظ„", rows], ["ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ط´ظپطھط§طھ ط¨ظٹظ† ط§ظ„ظپط±ظˆط¹", rows], ["ظ…ظ‚ط§ط±ظ†ط© ط³ط§ط¹ط§طھ ط§ظ„ط¹ظ…ظ„ ط¨ظٹظ† ط§ظ„ظ…ظˆط¸ظپظٹظ†", rows], ["طھظ‚ط±ظٹط± ط§ظ„ظ…ظˆط¸ظپظٹظ† ط؛ظٹط± ط§ظ„ظ…ط¬ط¯ظˆظ„ظٹظ†", unscheduled.map((e) => ({ employee_name: e.name, branch: e.branch, job: e.job, status: e.status }))]];
  return <div className="space-y-4"><div className="panel grid gap-3 p-4 md:grid-cols-4 xl:grid-cols-6"><input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="field" /><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field" /><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field" placeholder="ط§ظ„ظ…ظˆط¸ظپ" /><select value={filters.shift} onChange={(e) => setFilters({ ...filters, shift: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„ط´ظپطھط§طھ</option>{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{shiftAssignmentStatuses.map((s) => <option key={s}>{s}</option>)}</select></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reports.map(([title, reportRows]) => { const report = exportShiftReport(title, reportRows); return <div key={title} className="panel p-5"><FileBarChart className="text-brand-700" /><h3 className="mt-3 font-extrabold">{title}</h3><p className="mt-1 text-xs text-slate-500">ط¹ط¯ط¯ ط§ظ„ط³ط¬ظ„ط§طھ: {reportRows.length}</p><div className="mt-5 flex gap-2"><button disabled={!canExport} onClick={() => exportExcel(report.exportRows, title)} className="btn-secondary flex-1"><FileSpreadsheet size={15} /> Excel</button><button onClick={report.print} className="btn-secondary flex-1"><Printer size={15} /> PDF</button><button disabled={!canExport} onClick={() => exportDocx(title, report.exportRows)} className="btn-secondary flex-1"><Download size={15} /> Word</button></div></div>; })}</div></div>;
}

function ShiftCharts({ assignments, usedShifts, conflicts }) {
  const byBranch = Object.entries(groupCount(assignments, "branch")).map(([name, value]) => ({ name, value }));
  const byDay = Object.entries(groupCount(assignments, "assignment_date")).map(([name, value]) => ({ name, value }));
  const byEmployeeHours = Object.entries(assignments.reduce((acc, a) => ({ ...acc, [a.employee_name]: (acc[a.employee_name] || 0) + Number(a.total_hours || 0) }), {})).slice(0, 10).map(([name, value]) => ({ name, value }));
  const coverage = usedShifts.map((u) => ({ name: u.branch, value: assignments.filter((a) => a.branch === u.branch && a.shift_type_id === u.shift_type_id).length }));
  const conflictByBranch = Object.entries(groupCount(conflicts, "branch")).map(([name, value]) => ({ name, value }));
  if (!assignments.length && !usedShifts.length) return null;
  return <div className="grid gap-5 xl:grid-cols-2"><Chart title="ط§ظ„ط´ظپطھط§طھ ط­ط³ط¨ ط§ظ„ظپط±ظˆط¹" sub="ط¹ط¯ط¯ ط§ظ„طھظˆط²ظٹط¹ط§طھ"><ResponsiveContainer width="100%" height={220}><BarChart data={byBranch}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart><Chart title="ط§ظ„ط´ظپطھط§طھ ط­ط³ط¨ ط§ظ„ط£ظٹط§ظ…" sub="ط§ظ„طھظˆط²ظٹط¹ ط§ظ„ظٹظˆظ…ظٹ"><ResponsiveContainer width="100%" height={220}><AreaChart data={byDay}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Area dataKey="value" stroke="#7f1d1d" fill="#fbe5e5" /></AreaChart></ResponsiveContainer></Chart><Chart title="ط³ط§ط¹ط§طھ ط§ظ„ط¹ظ…ظ„ ط­ط³ط¨ ط§ظ„ظ…ظˆط¸ظپظٹظ†" sub="ط£ط¹ظ„ظ‰ 10 ظ…ظˆط¸ظپظٹظ†"><ResponsiveContainer width="100%" height={220}><BarChart data={byEmployeeHours}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey="value" fill="#991b1b" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart><Chart title="ط§ظ„طھط؛ط·ظٹط© ظˆط§ظ„طھط¹ط§ط±ط¶ط§طھ ط­ط³ط¨ ط§ظ„ظپط±ط¹" sub="ظ…ط¤ط´ط±ط§طھ ط±ظ‚ط§ط¨ظٹط©"><ResponsiveContainer width="100%" height={220}><BarChart data={[...coverage, ...conflictByBranch]}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart></div>;
}

function ShiftTypeDialog({ dialog, setDialog, save }) {
  const periods = dialog.periods || [];
  const updatePeriod = (index, patch) => setDialog({ ...dialog, periods: periods.map((period, i) => i === index ? { ...period, ...patch } : period) });
  const addPeriod = () => setDialog({ ...dialog, periods: [...periods, { period_id: `STP-${Date.now()}`, period_name: `ظپطھط±ط© ${periods.length + 1}`, start_time: "08:00", end_time: "12:00", total_hours: 4, sort_order: periods.length + 1, is_active: true, notes: "" }] });
  const totalHours = dialog.shift_mode === "ظ…ط±ظ†" ? Number(dialog.required_hours || 0) : periods.filter((p) => p.is_active !== false).reduce((sum, p) => sum + calculateShiftHours(p.start_time, p.end_time), 0);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="ط¨ظٹط§ظ†ط§طھ ظ†ظˆط¹ ط§ظ„ط´ظپطھ" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="ط§ط³ظ… ط§ظ„ط´ظپطھ"><input required value={dialog.shift_name} onChange={(e) => setDialog({ ...dialog, shift_name: e.target.value })} className="field mt-2" /></Label><Label t="ظ†ظˆط¹ ط§ظ„ط´ظپطھ"><select value={dialog.shift_mode || "ط«ط§ط¨طھ"} onChange={(e) => setDialog({ ...dialog, shift_mode: e.target.value })} className="field mt-2"><option>ط«ط§ط¨طھ</option><option>ظ…ط±ظ†</option></select></Label><Label t="ط§ظ„ظپطھط±ط©"><select value={dialog.shift_period} onChange={(e) => setDialog({ ...dialog, shift_period: e.target.value })} className="field mt-2">{shiftPeriods.map((p) => <option key={p}>{p}</option>)}</select></Label><Label t="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط³ط§ط¹ط§طھ"><input readOnly value={Number(totalHours).toFixed(2)} className="field mt-2 bg-slate-50" /></Label><Label t="ط¯ظ‚ط§ط¦ظ‚ ط§ظ„ط§ط³طھط±ط§ط­ط©"><input type="number" value={dialog.break_minutes} onChange={(e) => setDialog({ ...dialog, break_minutes: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ط؛ظٹط± ظ†ط´ط·</option></select></Label>{dialog.shift_mode === "ظ…ط±ظ†" && <><Label t="ط¨ط¯ط§ظٹط© ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ظ…ط³ظ…ظˆط­"><input type="time" value={dialog.flexible_start_from || ""} onChange={(e) => setDialog({ ...dialog, flexible_start_from: e.target.value })} className="field mt-2" /></Label><Label t="ظ†ظ‡ط§ظٹط© ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ظ…ط³ظ…ظˆط­"><input type="time" value={dialog.flexible_end_until || ""} onChange={(e) => setDialog({ ...dialog, flexible_end_until: e.target.value })} className="field mt-2" /></Label><Label t="ط¹ط¯ط¯ ط§ظ„ط³ط§ط¹ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©"><input type="number" step="0.25" value={dialog.required_hours || ""} onChange={(e) => setDialog({ ...dialog, required_hours: e.target.value })} className="field mt-2" /></Label></>}<Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><div className="mt-6 rounded-2xl border p-4"><div className="mb-3 flex"><h4 className="font-extrabold">ظپطھط±ط§طھ ط§ظ„ط´ظپطھ</h4><button type="button" onClick={addPeriod} className="btn-secondary mr-auto"><Plus size={15} /> ط¥ط¶ط§ظپط© ظپطھط±ط©</button></div><div className="space-y-3">{periods.map((period, index) => <div key={period.period_id || index} className="rounded-2xl bg-slate-50 p-3"><div className="grid gap-3 md:grid-cols-5"><input value={period.period_name} onChange={(e) => updatePeriod(index, { period_name: e.target.value })} className="field" placeholder="ط§ط³ظ… ط§ظ„ظپطھط±ط©" /><input type="time" value={period.start_time} onChange={(e) => updatePeriod(index, { start_time: e.target.value, total_hours: calculateShiftHours(e.target.value, period.end_time) })} className="field" /><input type="time" value={period.end_time} onChange={(e) => updatePeriod(index, { end_time: e.target.value, total_hours: calculateShiftHours(period.start_time, e.target.value) })} className="field" /><input readOnly value={calculateShiftHours(period.start_time, period.end_time)} className="field bg-white" /><button type="button" onClick={() => setDialog({ ...dialog, periods: periods.filter((_, i) => i !== index) })} className="btn-secondary text-red-600">ط­ط°ظپ</button></div><input value={period.notes || ""} onChange={(e) => updatePeriod(index, { notes: e.target.value })} className="field mt-2" placeholder="ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„ظپطھط±ط©" /><ShiftPeriodTimeline periods={[period]} /></div>)}</div></div><DialogActions close={() => setDialog(null)} /></form></div>;
}

function UsedShiftDialog({ dialog, setDialog, save, shiftTypes, selectShift }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel w-full max-w-4xl p-6"><DialogTitle title="ط§ظ„ط´ظپطھ ط§ظ„ظ…ط³طھط®ط¯ظ…" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="ط§ظ„ظپط±ط¹"><select value={dialog.branch} onChange={(e) => setDialog({ ...dialog, branch: e.target.value })} className="field mt-2">{branches.map((b) => <option key={b}>{b}</option>)}</select></Label><Label t="ظ†ظˆط¹ ط§ظ„ط´ظپطھ"><select value={dialog.shift_type_id} onChange={(e) => selectShift(e.target.value)} className="field mt-2">{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select></Label><Label t="ظ…ظ† ط§ظ„ط³ط§ط¹ط©"><input type="time" value={dialog.start_time} onChange={(e) => setDialog({ ...dialog, start_time: e.target.value })} className="field mt-2" /></Label><Label t="ط¥ظ„ظ‰ ط§ظ„ط³ط§ط¹ط©"><input type="time" value={dialog.end_time} onChange={(e) => setDialog({ ...dialog, end_time: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظ…ط·ظ„ظˆط¨"><input type="number" value={dialog.required_employees} onChange={(e) => setDialog({ ...dialog, required_employees: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط¯ ط§ظ„ط£ط¯ظ†ظ‰"><input type="number" value={dialog.min_employees} onChange={(e) => setDialog({ ...dialog, min_employees: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰"><input type="number" value={dialog.max_employees} onChange={(e) => setDialog({ ...dialog, max_employees: e.target.value })} className="field mt-2" /></Label><Label t="ظ…ظ† طھط§ط±ظٹط®"><input type="date" value={dialog.active_from} onChange={(e) => setDialog({ ...dialog, active_from: e.target.value })} className="field mt-2" /></Label><Label t="ط¥ظ„ظ‰ طھط§ط±ظٹط®"><input type="date" value={dialog.active_to || ""} onChange={(e) => setDialog({ ...dialog, active_to: e.target.value })} className="field mt-2" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>;
}

function ScenarioDialog({ dialog, setDialog, save, shiftTypes }) {
  const addDetail = () => { const s = shiftTypes[0] || {}; setDialog({ ...dialog, details: [...(dialog.details || []), { scenario_detail_id: `SCD-${Date.now()}`, shift_type_id: s.shift_type_id || "", shift_name: s.shift_name || "", start_time: s.start_time || "08:00", end_time: s.end_time || "15:00", required_employees: 1, notes: "" }] }); };
  const updateDetail = (i, patch) => setDialog({ ...dialog, details: (dialog.details || []).map((d, idx) => idx === i ? { ...d, ...patch } : d) });
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="ط³ظٹظ†ط§ط±ظٹظˆ ط§ظ„ط´ظپطھط§طھ" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="ط§ط³ظ… ط§ظ„ط³ظٹظ†ط§ط±ظٹظˆ"><input required value={dialog.scenario_name} onChange={(e) => setDialog({ ...dialog, scenario_name: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظپط±ط¹"><select value={dialog.branch} onChange={(e) => setDialog({ ...dialog, branch: e.target.value })} className="field mt-2"><option>ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select></Label><Label t="ط§ظ„ظ†ظˆط¹"><select value={dialog.scenario_type} onChange={(e) => setDialog({ ...dialog, scenario_type: e.target.value })} className="field mt-2">{scenarioTypes.map((s) => <option key={s}>{s}</option>)}</select></Label><Label t="ط§ظ„ظˆطµظپ"><textarea value={dialog.description} onChange={(e) => setDialog({ ...dialog, description: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><div className="mt-5 flex"><h4 className="font-extrabold">ط§ظ„ط´ظپطھط§طھ ط¯ط§ط®ظ„ ط§ظ„ط³ظٹظ†ط§ط±ظٹظˆ</h4><button type="button" onClick={addDetail} className="btn-secondary mr-auto"><Plus size={15} /> ط¥ط¶ط§ظپط© ط´ظپطھ</button></div><div className="mt-3 space-y-2">{(dialog.details || []).map((d, i) => <div key={d.scenario_detail_id} className="grid gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-5"><select value={d.shift_type_id} onChange={(e) => { const s = shiftTypes.find((x) => x.shift_type_id === e.target.value); updateDetail(i, { shift_type_id: e.target.value, shift_name: s?.shift_name || "", start_time: s?.start_time || "", end_time: s?.end_time || "" }); }} className="field">{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select><input type="time" value={d.start_time} onChange={(e) => updateDetail(i, { start_time: e.target.value })} className="field" /><input type="time" value={d.end_time} onChange={(e) => updateDetail(i, { end_time: e.target.value })} className="field" /><input type="number" value={d.required_employees} onChange={(e) => updateDetail(i, { required_employees: e.target.value })} className="field" /><button type="button" onClick={() => setDialog({ ...dialog, details: dialog.details.filter((_, idx) => idx !== i) })} className="btn-secondary text-red-600">ط­ط°ظپ</button></div>)}</div><DialogActions close={() => setDialog(null)} /></form></div>;
}

function AssignmentDialog({ dialog, setDialog, save, employees, shiftTypes, selectShift }) {
  const selectEmployees = (ids) => setDialog({ ...dialog, selected_employee_ids: ids });
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="طھظˆط²ظٹط¹ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط¹ظ„ظ‰ ط§ظ„ط´ظپطھط§طھ" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="ط§ظ„طھط§ط±ظٹط®"><input type="date" value={dialog.assignment_date} onChange={(e) => setDialog({ ...dialog, assignment_date: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط´ظپطھ"><select value={dialog.shift_type_id} onChange={(e) => selectShift(e.target.value)} className="field mt-2">{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select></Label><Label t="ظ†ظˆط¹ ط§ظ„ط´ظپطھ"><input readOnly value={dialog.shift_mode || "ط«ط§ط¨طھ"} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ظ„ط³ط§ط¹ط§طھ"><input readOnly value={Number(dialog.total_hours || calculateShiftHours(dialog.start_time, dialog.end_time)).toFixed(2)} className="field mt-2 bg-slate-50" /></Label><Label t="ظ…ظ†"><input type="time" value={dialog.start_time} onChange={(e) => setDialog({ ...dialog, start_time: e.target.value })} className="field mt-2" /></Label><Label t="ط¥ظ„ظ‰"><input type="time" value={dialog.end_time} onChange={(e) => setDialog({ ...dialog, end_time: e.target.value })} className="field mt-2" /></Label><Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><input value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2" /></Label></div><div className="mt-4 rounded-2xl border p-3"><b className="text-sm">ظپطھط±ط§طھ ط§ظ„ط´ظپطھ</b><div className="mt-2 grid gap-2 md:grid-cols-2">{(dialog.shift_periods || []).map((p) => <div key={p.period_id || p.period_name} className="rounded-xl bg-slate-50 p-3 text-sm"><b>{p.period_name}</b><p className="text-slate-500">{p.start_time} - {p.end_time} â€¢ {p.total_hours} ط³ط§ط¹ط§طھ</p></div>)}</div><ShiftPeriodTimeline periods={dialog.shift_periods || []} /></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => selectEmployees(employees.map((e) => e.id))} className="btn-secondary">ط§ط®طھظٹط§ط± ظƒظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ†</button>{branches.map((b) => <button type="button" key={b} onClick={() => selectEmployees(employees.filter((e) => e.branch === b).map((e) => e.id))} className="btn-secondary">{b}</button>)}</div><div className="mt-4 grid max-h-72 gap-2 overflow-y-auto rounded-2xl border p-3 md:grid-cols-2">{employees.map((e) => <label key={e.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-sm"><input type="checkbox" checked={(dialog.selected_employee_ids || []).includes(e.id)} onChange={(ev) => setDialog({ ...dialog, selected_employee_ids: ev.target.checked ? [...(dialog.selected_employee_ids || []), e.id] : (dialog.selected_employee_ids || []).filter((id) => id !== e.id) })} />{e.name} - {e.branch} - {e.job}</label>)}</div><p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">ط¹ط¯ط¯ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط§ظ„ظ…ط®طھط§ط±ظٹظ†: {(dialog.selected_employee_ids || []).length}</p><DialogActions close={() => setDialog(null)} /></form></div>;
}

function ShiftPeriodTimeline({ periods }) {
  return <div className="mt-3 rounded-xl bg-white p-3"><div className="relative h-7 rounded-full bg-slate-100">{(periods || []).filter((p) => p.is_active !== false).map((period) => <div key={period.period_id || period.period_name} className="absolute top-1 h-5 rounded-full bg-brand-700" style={shiftTimelineStyle(period)} title={`${period.period_name}: ${period.start_time}-${period.end_time}`} />)}</div><div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div></div>;
}

function DialogTitle({ title, close }) {
  return <div className="mb-5 flex"><h3 className="text-xl font-extrabold">{title}</h3><button type="button" onClick={close} className="mr-auto"><X /></button></div>;
}
function DialogActions({ close }) {
  return <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={close} className="btn-secondary">ط¥ظ„ط؛ط§ط،</button><button className="btn-primary"><Save size={17} /> ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ</button></div>;
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
  return <div className="space-y-5"><PageHead title="ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط©" desc="طھط³ط¬ظٹظ„ ط§ظ„ط¥ظ†طھط§ط¬ظٹط© ط§ظ„ظٹظˆظ…ظٹط© ظˆط±ط¨ط·ظ‡ط§ ط¨ط§ظ„ظ€ KPI ظˆط§ظ„ط­ظˆط§ظپط²" action={<button disabled={can?.("daily_operations", "can_create") === false} onClick={() => setDialog({ operation_id: `OP-${Date.now()}`, operation_date: new Date().toISOString().slice(0, 10), month: new Date().toISOString().slice(0, 7), employee_id: "", employee_name: "", branch: "", job_name: "", operation_type: operationTypes[0], service_channel: serviceChannels[0], currency: "SAR", operation_count: 0, completed_count: 0, error_count: 0, returned_count: 0, pending_count: 0, customer_complaints: 0, amount: 0, status: "ظ…ط³ظˆط¯ط©", notes: "" })} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط© ط¹ظ…ظ„ظٹط©</button>} /><div className="grid gap-4 md:grid-cols-4"><Mini label="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ" value={totalOps} I={Gauge} /><Mini label="ط§ظ„ط£ط®ط·ط§ط،" value={totalErrors} I={AlertTriangle} /><Mini label="ظ†ط³ط¨ط© ط§ظ„ط£ط®ط·ط§ط،" value={`${totalOps ? ((totalErrors / totalOps) * 100).toFixed(1) : 0}%`} I={TrendingUp} /><Mini label="ط§ظ„ظ…ط¹طھظ…ط¯ط©" value={filtered.filter((x) => x.status === "ظ…ط¹طھظ…ط¯ط©").length} I={BadgeCheck} /></div><div className="panel flex flex-wrap gap-3 p-4"><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[180px]" /><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field min-w-[180px]" placeholder="ط§ظ„ظ…ظˆط¸ظپ" /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[160px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{operationStatuses.map((s) => <option key={s}>{s}</option>)}</select><button onClick={() => exportExcel(filtered, "ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط©")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="grid gap-5 xl:grid-cols-2"><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„طھط§ط±ظٹط®</th><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„ط¹ظ…ظ„ظٹط©</th><th>ط§ظ„ط¹ط¯ط¯</th><th>ط§ظ„ط£ط®ط·ط§ط،</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{loading ? <tr><td colSpan="8">ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</td></tr> : filtered.map((r) => <tr key={r.operation_id}><td>{r.operation_date}</td><td>{r.employee_name}<p className="text-xs text-slate-400">{r.job_name}</p></td><td>{r.branch}</td><td>{r.operation_type}</td><td>{r.operation_count}</td><td>{r.error_count}</td><td><Status>{r.status}</Status></td><td><button onClick={() => setDialog(r)} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => approve(r)} className="p-2 text-green-700"><BadgeCheck size={16} /></button><button disabled={r.status !== "ظ…ط³ظˆط¯ط©"} onClick={() => dailyOperationsService.deleteDailyOperation(r.operation_id).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div><Chart title="ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط­ط³ط¨ ط§ظ„ظپط±ظˆط¹" sub="طھظˆط²ظٹط¹ ط³ط¬ظ„ط§طھ ط§ظ„ط¹ظ…ظ„ظٹط§طھ"><ResponsiveContainer width="100%" height={260}><BarChart data={byBranch}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></Chart></div>{dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="ط¹ظ…ظ„ظٹط© ظٹظˆظ…ظٹط©" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="ط§ظ„طھط§ط±ظٹط®"><input type="date" value={dialog.operation_date} onChange={(e) => setDialog({ ...dialog, operation_date: e.target.value, month: e.target.value.slice(0, 7) })} className="field mt-2" /></Label><Label t="ط§ظ„ظ…ظˆط¸ظپ"><select value={dialog.employee_id} onChange={(e) => pickEmployee(e.target.value)} className="field mt-2"><option value="">ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} - {emp.id} - {emp.branch}</option>)}</select></Label><Label t="ط§ظ„ظˆط¸ظٹظپط©"><input readOnly value={dialog.job_name} className="field mt-2 bg-slate-50" /></Label><Label t="ظ†ظˆط¹ ط§ظ„ط¹ظ…ظ„ظٹط©"><select value={dialog.operation_type} onChange={(e) => setDialog({ ...dialog, operation_type: e.target.value })} className="field mt-2">{operationTypes.map((t) => <option key={t}>{t}</option>)}</select></Label><Label t="ط§ظ„ظ‚ظ†ط§ط©"><select value={dialog.service_channel} onChange={(e) => setDialog({ ...dialog, service_channel: e.target.value })} className="field mt-2">{serviceChannels.map((t) => <option key={t}>{t}</option>)}</select></Label>{["operation_count","completed_count","pending_count","error_count","returned_count","customer_complaints","amount"].map((k) => <Label key={k} t={k}><input type="number" value={dialog[k] || 0} onChange={(e) => setDialog({ ...dialog, [k]: e.target.value })} className="field mt-2" /></Label>)}<Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}</div>;
}

function PerformanceCriteriaPage({ can }) {
  const [templates, setTemplates] = useState([]), [criteriaRows, setCriteriaRows] = useState([]), [selectedJob, setSelectedJob] = useState(""), [dialog, setDialog] = useState(null);
  const load = async () => { const [t, c] = await Promise.all([performanceCriteriaService.loadJobTemplates(), performanceCriteriaService.loadKpiCriteria()]); setTemplates(t); setCriteriaRows(c); setSelectedJob((j) => j || t[0]?.job_name || Object.keys(defaultJobKpis)[0] || ""); };
  useEffect(() => { load().catch((e) => alert(e.message)); }, []);
  const rows = criteriaRows.filter((r) => r.job_name === selectedJob), totalWeight = performanceCriteriaService.validateCriteriaWeights(rows);
  const saveCriterion = async (e) => { e.preventDefault(); try { await performanceCriteriaService.saveKpiCriterion(dialog); setDialog(null); load(); } catch (err) { alert(err.message); } };
  return <div className="space-y-5"><PageHead title="ظ…ط¹ط§ظٹظٹط± ط§ظ„ط£ط¯ط§ط،" desc="ظ…ط¹ط§ظٹظٹط± KPI ط¹ط§ط¯ظ„ط© ظˆظ…ظ†ظپطµظ„ط© ط­ط³ط¨ ط§ظ„ظˆط¸ظٹظپط©" action={<div className="flex gap-2"><button onClick={() => performanceCriteriaService.seedDefaults().then(load).catch((e) => alert(e.message))} className="btn-secondary">طھظˆظ„ظٹط¯ ط§ظ„ظ…ط¹ط§ظٹظٹط± ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©</button><button disabled={can?.("performance_criteria", "can_create") === false} onClick={() => setDialog({ job_name: selectedJob, criterion_name: "", weight: 10, max_score: 100, scoring_type: scoringTypes[0], target_value: 100, excellent_threshold: 100, good_threshold: 80, acceptable_threshold: 60, affects_incentive: true, is_active: true })} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط© ظ…ط¹ظٹط§ط±</button></div>} /><div className="panel flex flex-wrap gap-3 p-4"><select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="field max-w-md">{[...new Set([...templates.map((t) => t.job_name), ...Object.keys(defaultJobKpis)])].map((j) => <option key={j}>{j}</option>)}</select><span className={`rounded-xl px-4 py-2 text-sm font-bold ${totalWeight === 100 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط£ظˆط²ط§ظ†: {totalWeight}%</span></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„ظˆط²ظ†</th><th>ط·ط±ظٹظ‚ط© ط§ظ„ط§ط­طھط³ط§ط¨</th><th>ط§ظ„ظ…ط³طھظ‡ط¯ظپ</th><th>ط§ظ„ط­ط§ظپط²</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{rows.map((r) => <tr key={r.criterion_id}><td>{r.criterion_name}</td><td>{r.weight}%</td><td>{r.scoring_type}</td><td>{r.target_value}</td><td>{r.affects_incentive ? "ظ†ط¹ظ…" : "ظ„ط§"}</td><td><Status>{r.is_active ? "ظ†ط´ط·" : "ظ…ط¹ط·ظ„"}</Status></td><td><button onClick={() => setDialog(r)} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => performanceCriteriaService.deleteKpiCriterion(r.criterion_id).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div>{dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={saveCriterion} className="panel w-full max-w-4xl p-6"><DialogTitle title="ظ…ط¹ظٹط§ط± ط£ط¯ط§ط،" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="ط§ظ„ظˆط¸ظٹظپط©"><input value={dialog.job_name} onChange={(e) => setDialog({ ...dialog, job_name: e.target.value })} className="field mt-2" /></Label><Label t="ط§ط³ظ… ط§ظ„ظ…ط¹ظٹط§ط±"><input required value={dialog.criterion_name} onChange={(e) => setDialog({ ...dialog, criterion_name: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظˆط²ظ†"><input type="number" value={dialog.weight} onChange={(e) => setDialog({ ...dialog, weight: e.target.value })} className="field mt-2" /></Label><Label t="ط·ط±ظٹظ‚ط© ط§ظ„ط§ط­طھط³ط§ط¨"><select value={dialog.scoring_type} onChange={(e) => setDialog({ ...dialog, scoring_type: e.target.value })} className="field mt-2">{scoringTypes.map((s) => <option key={s}>{s}</option>)}</select></Label><Label t="ط§ظ„ظ…ط³طھظ‡ط¯ظپ"><input type="number" value={dialog.target_value} onChange={(e) => setDialog({ ...dialog, target_value: e.target.value })} className="field mt-2" /></Label><Label t="ط­ط¯ ظ…ظ…طھط§ط²"><input type="number" value={dialog.excellent_threshold} onChange={(e) => setDialog({ ...dialog, excellent_threshold: e.target.value })} className="field mt-2" /></Label><Label t="ط­ط¯ ط¬ظٹط¯"><input type="number" value={dialog.good_threshold} onChange={(e) => setDialog({ ...dialog, good_threshold: e.target.value })} className="field mt-2" /></Label><Label t="ط­ط¯ ظ…ظ‚ط¨ظˆظ„"><input type="number" value={dialog.acceptable_threshold} onChange={(e) => setDialog({ ...dialog, acceptable_threshold: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}</div>;
}

function KpiScoresPage({ employees }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)), [scores, setScores] = useState([]);
  const load = () => kpiCalculationService.loadKpiScores(month).then(setScores).catch((e) => alert(e.message));
  useEffect(() => { load(); }, [month]);
  const grouped = Object.entries(scores.reduce((acc, row) => { const key = row.employee_name || row.employee_id; acc[key] = (acc[key] || 0) + row.weighted_score; return acc; }, {})).map(([name, total]) => ({ name, total: Number(total.toFixed(2)) })).sort((a, b) => b.total - a.total);
  return <div className="space-y-5"><PageHead title="ط¯ط±ط¬ط§طھ KPI" desc="ط§ط­طھط³ط§ط¨ طھظ„ظ‚ط§ط¦ظٹ ظ…ظ† ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط© ط­ط³ط¨ ظˆط¸ظٹظپط© ط§ظ„ظ…ظˆط¸ظپ" action={<button onClick={() => kpiCalculationService.recalculateMonthKpis(employees, month).then(setScores).catch((e) => alert(e.message))} className="btn-primary"><Gauge size={18} /> ط¥ط¹ط§ط¯ط© ط­ط³ط§ط¨ ط§ظ„ط´ظ‡ط±</button>} /><div className="panel flex gap-3 p-4"><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="field max-w-[180px]" /><button onClick={() => exportExcel(scores, "ط¯ط±ط¬ط§طھ KPI")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="grid gap-5 xl:grid-cols-2"><Chart title="ط£ظپط¶ظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط­ط³ط¨ KPI" sub="ط§ظ„ظ…ظ‚ط§ط±ظ†ط© ط¯ط§ط®ظ„ ظ…ط¹ط§ظٹظٹط± ظƒظ„ ظˆط¸ظٹظپط©"><ResponsiveContainer width="100%" height={280}><BarChart data={grouped.slice(0, 10)}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#7f1d1d" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></Chart><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ظˆط¸ظٹظپط©</th><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„ظ‚ظٹظ…ط©</th><th>ط§ظ„ط¯ط±ط¬ط©</th><th>ط§ظ„ظ…ظˆط²ظˆظ†ط©</th></tr></thead><tbody>{scores.map((r) => <tr key={r.score_id}><td>{r.employee_name}</td><td>{r.job_name}</td><td>{r.criterion_name}</td><td>{r.actual_value}</td><td>{r.score}</td><td>{r.weighted_score.toFixed(2)}</td></tr>)}</tbody></table></div></div></div></div>;
}

function AIAssistantWidget({ currentUser, page }) {
  const [open, setOpen] = useState(false), [session, setSession] = useState(null), [messages, setMessages] = useState([]), [input, setInput] = useState(""), [loading, setLoading] = useState(false);
  const suggestions = ["ظ…ط§ ظ…ظ„ط®طµ ط£ط¯ط§ط، ط§ظ„ظ…ظˆط¸ظپظٹظ† ظ‡ط°ط§ ط§ظ„ط´ظ‡ط±طں", "ظ…ط§ ط§ظ„ط£طµظ†ط§ظپ ط§ظ„طھظٹ طھط­طھط§ط¬ ط´ط±ط§ط،طں", "ظ…ط§ ط£ظƒط«ط± ظپط±ط¹ ظ†ط´ط§ط·ظ‹ط§طں", "ط§ظ‚طھط±ط­ ظ…ط¹ط§ظٹظٹط± طھظ‚ظٹظٹظ… ظ„ظ…ط¯ظٹط± ظپط±ط¹."];
  const send = async (text = input) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      let current = session;
      if (!current) { current = await aiAssistantService.createChatSession(currentUser?.user_id || currentUser?.username || "", "ظ…ط­ط§ط¯ط«ط© ط§ظ„ظ…ط³ط§ط¹ط¯"); setSession(current); }
      const userMsg = { session_id: current.session_id, user_id: currentUser?.user_id || "", role: "user", message: text, context: { page } };
      setMessages((m) => [...m, userMsg]); setInput(""); await aiAssistantService.saveChatMessage(userMsg);
      const reply = await aiAssistantService.generateAssistantReply(text);
      const assistantMsg = { session_id: current.session_id, user_id: currentUser?.user_id || "", role: "assistant", message: reply, context: { page } };
      await aiAssistantService.saveChatMessage(assistantMsg); setMessages((m) => [...m, assistantMsg]);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };
  return <div className="fixed bottom-5 left-5 z-40 no-print"><button onClick={() => setOpen(!open)} className="grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-white shadow-xl"><MessageSquareWarning /></button>{open && <div className="absolute bottom-16 left-0 w-[360px] overflow-hidden rounded-2xl border bg-white shadow-2xl"><div className="bg-brand-700 p-4 text-white"><div className="flex"><b>ط§ظ„ظ…ط³ط§ط¹ط¯ ط§ظ„ط°ظƒظٹ</b><button onClick={() => setMessages([])} className="mr-auto text-xs">ظ…ط³ط­</button></div><p className="mt-1 text-xs opacity-80">ظٹط¹ظ…ظ„ ط­ط§ظ„ظٹظ‹ط§ ط¨ظˆط¶ط¹ ط§ظ„طھط­ظ„ظٹظ„ ط§ظ„ط¯ط§ط®ظ„ظٹ ط¨ط¯ظˆظ† ط§طھطµط§ظ„ ط®ط§ط±ط¬ظٹ.</p></div><div className="h-80 space-y-2 overflow-y-auto p-3">{!messages.length && <div className="space-y-2">{suggestions.map((s) => <button key={s} onClick={() => send(s)} className="w-full rounded-xl bg-slate-50 p-2 text-right text-xs">{s}</button>)}</div>}{messages.map((m, i) => <div key={i} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "bg-brand-50 text-brand-900" : "bg-slate-50"}`}>{m.message}</div>)}{loading && <p className="text-xs text-slate-400">ط§ظ„ظ…ط³ط§ط¹ط¯ ظٹظƒطھط¨...</p>}</div><div className="flex gap-2 border-t p-3"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="field" placeholder="ط§ظƒطھط¨ ط³ط¤ط§ظ„ظƒ..." /><button onClick={() => send()} className="btn-primary">ط¥ط±ط³ط§ظ„</button></div></div>}</div>;
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
const recruitmentLabels = { job_title: "ط§ظ„ظˆط¸ظٹظپط©", department: "ط§ظ„ظ‚ط³ظ…", branch: "ط§ظ„ظپط±ط¹", job_type: "ظ†ظˆط¹ ط§ظ„ظˆط¸ظٹظپط©", vacancies_count: "ط¹ط¯ط¯ ط§ظ„ط´ظˆط§ط؛ط±", salary_range_from: "ط§ظ„ط±ط§طھط¨ ظ…ظ†", salary_range_to: "ط§ظ„ط±ط§طھط¨ ط¥ظ„ظ‰", requirements: "ط§ظ„ظ…طھط·ظ„ط¨ط§طھ", responsibilities: "ط§ظ„ظ…ط³ط¤ظˆظ„ظٹط§طھ", status: "ط§ظ„ط­ط§ظ„ط©", opened_at: "طھط§ط±ظٹط® ط§ظ„ظپطھط­", closed_at: "طھط§ط±ظٹط® ط§ظ„ط¥ط؛ظ„ط§ظ‚", notes: "ظ…ظ„ط§ط­ط¸ط§طھ", application_number: "ط±ظ‚ظ… ط§ظ„ط·ظ„ط¨", job_posting_id: "ط§ظ„ظˆط¸ظٹظپط©", applicant_name: "ط§ط³ظ… ط§ظ„ظ…ط±ط´ط­", phone: "ط§ظ„ظ‡ط§طھظپ", email: "ط§ظ„ط¨ط±ظٹط¯", address: "ط§ظ„ط¹ظ†ظˆط§ظ†", qualification: "ط§ظ„ظ…ط¤ظ‡ظ„", specialization: "ط§ظ„طھط®طµطµ", experience_years: "ط³ظ†ظˆط§طھ ط§ظ„ط®ط¨ط±ط©", previous_employer: "ط¬ظ‡ط© ط§ظ„ط¹ظ…ظ„ ط§ظ„ط³ط§ط¨ظ‚ط©", expected_salary: "ط§ظ„ط±ط§طھط¨ ط§ظ„ظ…طھظˆظ‚ط¹", application_source: "ظ…طµط¯ط± ط§ظ„ط·ظ„ط¨", cv_url: "ط±ط§ط¨ط· CV", evaluator_name: "ط§ظ„ظ…ظ‚ظٹظ‘ظ…", evaluation_date: "طھط§ط±ظٹط® ط§ظ„طھظ‚ظٹظٹظ…", appearance_score: "ط§ظ„ظ…ط¸ظ‡ط±", communication_score: "ط§ظ„طھظˆط§طµظ„", technical_score: "ط§ظ„ظپظ†ظٹ", experience_score: "ط§ظ„ط®ط¨ط±ط©", culture_fit_score: "ظ…ظ„ط§ط،ظ…ط© ط§ظ„ط«ظ‚ط§ظپط©", honesty_score: "ط§ظ„ط£ظ…ط§ظ†ط©", pressure_handling_score: "طھط­ظ…ظ„ ط§ظ„ط¶ط؛ط·", computer_skills_score: "ط§ظ„ط­ط§ط³ط¨", customer_service_score: "ط®ط¯ظ…ط© ط§ظ„ط¹ظ…ظ„ط§ط،", recommendation: "ط§ظ„طھظˆطµظٹط©", strengths: "ظ†ظ‚ط§ط· ط§ظ„ظ‚ظˆط©", weaknesses: "ظ†ظ‚ط§ط· ط§ظ„ط¶ط¹ظپ", template_name: "ط§ط³ظ… ط§ظ„ظ‚ط§ظ„ط¨", salary: "ط§ظ„ط±ط§طھط¨", allowances: "ط§ظ„ط¨ط¯ظ„ط§طھ", probation_period: "ظپطھط±ط© ط§ظ„طھط¬ط±ط¨ط©", working_hours: "ط³ط§ط¹ط§طھ ط§ظ„ط¹ظ…ظ„", start_date: "طھط§ط±ظٹط® ط§ظ„ظ…ط¨ط§ط´ط±ط©", offer_valid_until: "طµظ„ط§ط­ظٹط© ط§ظ„ط¹ط±ط¶", terms: "ط§ظ„ط´ط±ظˆط·", template_body: "ظ†طµ ط§ظ„ط®ط·ط§ط¨", is_active: "ظ†ط´ط·", offer_number: "ط±ظ‚ظ… ط§ظ„ط¹ط±ط¶", sent_at: "طھط§ط±ظٹط® ط§ظ„ط¥ط±ط³ط§ظ„", accepted_at: "طھط§ط±ظٹط® ط§ظ„ظ‚ط¨ظˆظ„", rejected_at: "طھط§ط±ظٹط® ط§ظ„ط±ظپط¶", contract_number: "ط±ظ‚ظ… ط§ظ„ط¹ظ‚ط¯", offer_id: "ط§ظ„ط¹ط±ط¶", employee_name: "ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ", contract_start_date: "ط¨ط¯ط§ظٹط© ط§ظ„ط¹ظ‚ط¯", contract_end_date: "ظ†ظ‡ط§ظٹط© ط§ظ„ط¹ظ‚ط¯", contract_body: "ظ†طµ ط§ظ„ط¹ظ‚ط¯", year: "ط§ظ„ط³ظ†ط©", month: "ط§ظ„ط´ظ‡ط±", required_count: "ط§ظ„ط¹ط¯ط¯ ط§ظ„ظ…ط·ظ„ظˆط¨", current_count: "ط§ظ„ط¹ط¯ط¯ ط§ظ„ط­ط§ظ„ظٹ", priority: "ط§ظ„ط£ظˆظ„ظˆظٹط©", reason: "ط§ظ„ط³ط¨ط¨", approved_by: "ط§ط¹طھظ…ط¯ ط¨ظˆط§ط³ط·ط©", test_name: "ط§ط³ظ… ط§ظ„ط§ط®طھط¨ط§ط±", test_type: "ظ†ظˆط¹ ط§ظ„ط§ط®طھط¨ط§ط±", max_score: "ط§ظ„ط¯ط±ط¬ط© ط§ظ„ظ‚طµظˆظ‰", pass_score: "ط¯ط±ط¬ط© ط§ظ„ظ†ط¬ط§ط­", instructions: "ط§ظ„طھط¹ظ„ظٹظ…ط§طھ", employee_id: "ط±ظ‚ظ… ط§ظ„ظ…ظˆط¸ظپ", job: "ط§ظ„ظˆط¸ظٹظپط©", message_template: "ظ‚ط§ظ„ط¨ ط§ظ„ط±ط³ط§ظ„ط©", whatsapp_message: "ط±ط³ط§ظ„ط© ظˆط§طھط³ط§ط¨" };
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
    setProbation(await recruitmentService.loadProbationEmployees().catch(() => employees.filter((e) => e.status === "طھط­طھ ط§ظ„طھط¬ط±ط¨ط©")));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (visibleTabs.length && !visibleTabs.some(([id]) => id === tab)) setTab(visibleTabs[0][0]); }, [visibleTabs.map((x) => x[0]).join(","), tab]);
  if (!visibleTabs.length) return <div className="panel p-6 text-center font-bold text-slate-500">ظ„ط§ طھظˆط¬ط¯ طµظ„ط§ط­ظٹط§طھ ظ…ظپط¹ظ„ط© ظ„ظˆط­ط¯ط© ط§ظ„طھظˆط¸ظٹظپ.</div>;
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
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط§ظ„ط³ط¬ظ„طں")) return;
    try {
      await recruitmentService.remove(tab, row[recruitmentPrimary[tab]]);
      setRows((all) => ({ ...all, [tab]: (all[tab] || []).filter((r) => r[recruitmentPrimary[tab]] !== row[recruitmentPrimary[tab]]) }));
    } catch (error) { alert(error.message); }
  };
  const reports = generateRecruitmentReports({ jobPostings: rows.job_postings || [], applications: rows.applications || [], evaluations: rows.candidate_evaluations || [], offers: rows.job_offers || [], contracts: rows.contracts || [], plans: rows.manpower_plans || [], probationEmployees: probation });
  const cols = tab === "probation_employees" ? ["id", "name", "job", "branch", "hireDate", "manager"] : (recruitmentFieldSets[tab] || ["job_title", "applicant_name", "branch", "status"]).slice(0, 7);
  return <div className="space-y-5"><PageHead title="ط·ظ„ط¨ط§طھ ط§ظ„طھظˆط¸ظٹظپ" desc="ط¥ط¯ط§ط±ط© ط¯ظˆط±ط© ط§ظ„طھظˆط¸ظٹظپ ظ…ظ† ط§ظ„ط§ط­طھظٹط§ط¬ ط­طھظ‰ ط§ظ„طھط¹ظٹظٹظ† ظˆط±ط³ط§ط¦ظ„ ط§ظ„طھط±ط­ظٹط¨" action={<button disabled={!canCreate} onClick={openAdd} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط©</button>} /><div className="panel flex flex-wrap gap-2 p-3">{visibleTabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? "bg-brand-700 text-white" : "bg-slate-50 text-slate-600"}`}>{label}</button>)}</div>{tab === "reports" ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Object.entries(reports).map(([key, report]) => <div key={key} className="panel p-4"><h3 className="font-extrabold">{report.title}</h3><p className="mt-2 text-sm text-slate-500">ط¹ط¯ط¯ ط§ظ„ط³ط¬ظ„ط§طھ: {report.rows.length}</p><div className="mt-4 flex gap-2"><button onClick={() => exportExcel(report.rows, report.title)} className="btn-secondary">Excel</button><button onClick={() => printDocument(report.title, rowsToReportHtml(report.title, report.rows, []))} className="btn-primary">ط·ط¨ط§ط¹ط©</button></div></div>)}</div> : <><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط¨ط­ط«..." /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{[...new Set(tableRows.map((r) => r.status).filter(Boolean))].map((s) => <option key={s}>{s}</option>)}</select><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><button onClick={() => exportExcel(filtered, "ط·ظ„ط¨ط§طھ ط§ظ„طھظˆط¸ظٹظپ")} className="btn-secondary">Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr>{cols.map((c) => <th key={c}>{recruitmentLabels[c] || c}</th>)}<th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{filtered.map((row, i) => <tr key={row[recruitmentPrimary[tab]] || row.id || i}>{cols.map((c) => <td key={c}>{String(row[c] ?? "")}</td>)}<td><Status>{row.status || row.evaluation_status || row.recommendation || "â€”"}</Status></td><td><button disabled={!canEdit || tab === "probation_employees"} onClick={() => setDialog({ type: tab, ...row })} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canDelete || tab === "probation_employees"} onClick={() => remove(row)} className="p-2 text-red-600"><Trash2 size={16} /></button>{tab === "contracts" && <button onClick={() => recruitmentService.convertContractToEmployee(row).then(() => alert("طھظ… طھط­ظˆظٹظ„ ط§ظ„ظ…ط±ط´ط­ ط¥ظ„ظ‰ ظ…ظˆط¸ظپ")).catch((e) => alert(e.message))} className="p-2 text-green-700">طھط¹ظٹظٹظ†</button>}{tab === "welcome_messages" && <button onClick={() => navigator.clipboard?.writeText(row.whatsapp_message || row.message_template || "")} className="p-2 text-slate-600">ظ†ط³ط®</button>}</td></tr>)}</tbody></table></div></div></>}{dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="ط¨ظٹط§ظ†ط§طھ ط§ظ„طھظˆط¸ظٹظپ" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3">{(recruitmentFieldSets[dialog.type] || []).map((key) => <Label key={key} t={recruitmentLabels[key] || key}>{key.includes("body") || key.includes("notes") || key.includes("requirements") || key.includes("responsibilities") || key.includes("message") || key.includes("terms") || key.includes("instructions") ? <textarea value={dialog[key] || ""} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} className="field mt-2 !h-auto py-3" /> : key === "is_active" ? <select value={String(dialog[key] !== false)} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط¹ظ…</option><option value="false">ظ„ط§</option></select> : <input type={key.includes("date") || key.endsWith("_at") ? "date" : key.includes("score") || key.includes("salary") || key.includes("count") || key.includes("year") || key.includes("month") ? "number" : "text"} value={dialog[key] || ""} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} onBlur={() => dialog.type === "welcome_messages" && setDialog((d) => ({ ...d, whatsapp_message: d.whatsapp_message || generateWelcomeMessage(d) }))} className="field mt-2" />}</Label>)}</div><DialogActions close={() => setDialog(null)} /></form></div>}</div>;
}

function UserEditorModal({ dialog, setDialog, saveUser, employeeOptions, selectEmployee, roles = systemRoles }) {
  const isAdmin = String(dialog.role || "").includes("ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…") || String(dialog.role || "").includes("ط¸â€¦ط·آ¯ط¸ظ¹ط·آ± ط·آ§ط¸â€‍ط¸â€ ط·آ¸ط·آ§ط¸â€¦");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <form onSubmit={saveUser} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6">
        <DialogTitle title="ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…" close={() => setDialog(null)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Label t="ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ">
            <select value={dialog.employee_id || ""} onChange={(e) => selectEmployee(e.target.value)} className="field mt-2">
              <option value="">ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ</option>
              {employeeOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.id} - {emp.branch || "ط¨ط¯ظˆظ† ظپط±ط¹"} - {emp.job || "ط¨ط¯ظˆظ† ظˆط¸ظٹظپط©"}
                </option>
              ))}
            </select>
            {!employeeOptions.length && <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-700">ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ…ظˆط¸ظپظٹظ†طŒ ظٹط±ط¬ظ‰ ط¥ط¶ط§ظپط© ظ…ظˆط¸ظپظٹظ† ط£ظˆظ„ظ‹ط§</p>}
          </Label>
          <Label t="ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ ط§ظ„ظ…ط­ط¯ط¯">
            <input readOnly={!isAdmin} value={dialog.employee_name || dialog.name || ""} onChange={(e) => setDialog({ ...dialog, employee_name: e.target.value, name: e.target.value })} className={`field mt-2 ${isAdmin ? "" : "bg-slate-50"}`} />
          </Label>
          <Label t="ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط¸ظٹظپظٹ"><input readOnly value={dialog.employee_id || ""} className="field mt-2 bg-slate-50" /></Label>
          <Label t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…"><input required value={dialog.username || ""} onChange={(e) => setDialog({ ...dialog, username: e.target.value })} className="field mt-2" /></Label>
          <Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"><input required type="password" value={dialog.password || ""} onChange={(e) => setDialog({ ...dialog, password: e.target.value })} className="field mt-2" /></Label>
          <Label t="ط§ظ„ط¯ظˆط±"><select value={dialog.role || "ط§ظ„ظ…ظˆط¸ظپ"} onChange={(e) => setDialog({ ...dialog, role: e.target.value })} className="field mt-2">{roles.map((role) => <option key={role}>{role}</option>)}</select></Label>
          <Label t="ط§ظ„ظپط±ط¹"><input readOnly={!isAdmin} value={dialog.branch || ""} onChange={(e) => setDialog({ ...dialog, branch: e.target.value })} className={`field mt-2 ${isAdmin ? "" : "bg-slate-50"}`} /></Label>
          <Label t="ط§ظ„ظˆط¸ظٹظپط©"><input readOnly={!isAdmin} value={dialog.job || ""} onChange={(e) => setDialog({ ...dialog, job: e.target.value })} className={`field mt-2 ${isAdmin ? "" : "bg-slate-50"}`} /></Label>
          <Label t="ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ"><input value={dialog.email || ""} onChange={(e) => setDialog({ ...dialog, email: e.target.value })} className="field mt-2" /></Label>
          <Label t="ط§ظ„ظ‡ط§طھظپ"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label>
          <Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select></Label>
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
          <button type="button" onClick={() => hasChildren && toggleExpand(node.node_key)} className="grid h-6 w-6 place-items-center rounded-lg bg-slate-100 text-slate-600">{hasChildren ? (isOpen ? "âˆ’" : "+") : "â€¢"}</button>
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
        <h3 className="text-lg font-extrabold">ط´ط¬ط±ط© ط§ظ„طµظ„ط§ط­ظٹط§طھ ط§ظ„طھظپطµظٹظ„ظٹط©</h3>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="field mr-auto max-w-[220px]">{roles.map((r) => <option key={r}>{r}</option>)}</select>
        <select className="field max-w-[220px]"><option>ظƒظ„ ظ…ط³طھط®ط¯ظ…ظٹ ط§ظ„ط¯ظˆط±</option>{selectedUserOptions.map((u) => <option key={u.user_id}>{u.employee_name || u.username}</option>)}</select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="field max-w-[240px]" placeholder="ط¨ط­ط« ط¯ط§ط®ظ„ ط§ظ„ط´ط¬ط±ط©..." />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button disabled={!canEdit} onClick={() => setAll(true)} className="btn-secondary">طھط­ط¯ظٹط¯ ط§ظ„ظƒظ„</button>
        <button disabled={!canEdit} onClick={() => setAll(false)} className="btn-secondary">ظ…ط³ط­ ط§ظ„ظƒظ„</button>
        <button onClick={() => setExpanded(flatNodes.map((n) => n.node_key))} className="btn-secondary">طھظˆط³ظٹط¹ ط§ظ„ظƒظ„</button>
        <button onClick={() => setExpanded([])} className="btn-secondary">ط·ظٹ ط§ظ„ظƒظ„</button>
        <select value={copyFromRole} onChange={(e) => setCopyFromRole(e.target.value)} className="field max-w-[200px]"><option value="">ظ†ط³ط® ظ…ظ† ط¯ظˆط±...</option>{roles.filter((r) => r !== selectedRole).map((r) => <option key={r}>{r}</option>)}</select>
        <button disabled={!canEdit || !copyFromRole} onClick={() => onCopy(copyFromRole)} className="btn-secondary">ظ†ط³ط® ط§ظ„طµظ„ط§ط­ظٹط§طھ</button>
        <button disabled={!canEdit} onClick={onReset} className="btn-secondary">ط¥ط¹ط§ط¯ط© ط¶ط¨ط· ط§ظ„ط¯ظˆط±</button>
        <button disabled={!canEdit || loading} onClick={onSave} className="btn-primary"><Save size={17} /> ط­ظپط¸ ط§ظ„طµظ„ط§ط­ظٹط§طھ</button>
      </div>
      {loading ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط´ط¬ط±ط© ط§ظ„طµظ„ط§ط­ظٹط§طھ...</p> : (
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <div className="max-h-[620px] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-3">{visibleTree.map((node) => renderNode(node))}</div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            {!selectedNode || !selectedPerm ? <p className="text-sm text-slate-500">ط§ط®طھط± ط¨ظ†ط¯ظ‹ط§ ظ…ظ† ط§ظ„ط´ط¬ط±ط© ظ„طھط¹ط¯ظٹظ„ طµظ„ط§ط­ظٹط§طھظ‡.</p> : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs text-slate-400">ط§ظ„ط¨ظ†ط¯ ط§ظ„ظ…ط­ط¯ط¯</p>
                  <h4 className="text-xl font-extrabold text-brand-800">{selectedNode.node_name}</h4>
                  <p className="mt-1 text-xs text-slate-500">ط§ظ„ظ…ظپطھط§ط­: {selectedNode.node_key} آ· ط§ظ„ظ†ظˆط¹: {selectedNode.node_type} آ· ط§ظ„طµظپط­ط©: {selectedNode.page_key || "â€”"}</p>
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
                  <Label t="ظ†ط·ط§ظ‚ ط§ظ„ط¨ظٹط§ظ†ط§طھ">
                    <select disabled={!canEdit} value={selectedPerm.data_scope || "own"} onChange={(e) => updatePermission(selectedNode.node_key, { data_scope: e.target.value })} className="field mt-2">{dataScopes.map(([k, label]) => <option key={k} value={k}>{label}</option>)}</select>
                  </Label>
                  <Label t="ط§ظ„ظپط±ظˆط¹ ط§ظ„ظ…ط³ظ…ظˆط­ط©">
                    <select multiple disabled={!canEdit} value={selectedPerm.allowed_branches || []} onChange={(e) => updatePermission(selectedNode.node_key, { allowed_branches: Array.from(e.target.selectedOptions).map((o) => o.value) })} className="field mt-2 !h-32">{branchOptions.map((b) => <option key={b}>{b}</option>)}</select>
                  </Label>
                  <Label t="ط§ظ„ط£ظ‚ط³ط§ظ… ط§ظ„ظ…ط³ظ…ظˆط­ط©">
                    <select multiple disabled={!canEdit} value={selectedPerm.allowed_departments || []} onChange={(e) => updatePermission(selectedNode.node_key, { allowed_departments: Array.from(e.target.selectedOptions).map((o) => o.value) })} className="field mt-2 !h-32">{departmentOptions.map((d) => <option key={d}>{d}</option>)}</select>
                  </Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={!canEdit} onClick={onSave} className="btn-primary"><Save size={17} /> ط­ظپط¸ ط§ظ„ظ…ط­ط¯ط¯</button>
                  <button disabled={!canEdit} onClick={applySelectedToChildren} className="btn-secondary">طھط·ط¨ظٹظ‚ ط¹ظ„ظ‰ ط§ظ„ظپط±ظˆط¹ ط§ظ„طھط§ط¨ط¹ط©</button>
                  <button disabled={!canEdit} onClick={clearNode} className="btn-secondary">ظ…ط³ط­ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط¨ظ†ط¯</button>
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
        <h3 className="text-lg font-extrabold">ط¥ط¯ط§ط±ط© ط§ظ„ط£ط¯ظˆط§ط±</h3>
        <input value={q} onChange={(e) => setQ(e.target.value)} className="field mr-auto max-w-[260px]" placeholder="ط¨ط­ط« ظپظٹ ط§ظ„ط£ط¯ظˆط§ط±..." />
        <button disabled={!canEdit} onClick={() => setDialog({ role_id: `ROLE-${Date.now()}`, role_name: "", role_description: "", is_system_role: false, is_active: true })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط© ط¯ظˆط±</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ط§ظ„ط¯ظˆط±</th><th>ط§ظ„ظˆطµظپ</th><th>ط¹ط¯ط¯ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†</th><th>ط§ظ„ط­ط§ظ„ط©</th><th>ظ†ظˆط¹ ط§ظ„ط¯ظˆط±</th><th></th></tr></thead>
          <tbody>{filtered.map((role) => {
            const count = users.filter((u) => u.role === role.role_name).length;
            return <tr key={role.role_id}><td>{role.role_name}</td><td>{role.role_description}</td><td>{count}</td><td><Status>{role.is_active ? "ظ†ط´ط·" : "ظ…ط¹ط·ظ„"}</Status></td><td>{role.is_system_role ? "ظ†ط¸ط§ظ…ظٹ" : "ظ…ط®طµطµ"}</td><td><button disabled={!canEdit} onClick={() => setDialog(role)} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canEdit} onClick={() => onDeleteRole(role)} className="p-2 text-red-600">{count ? "طھط¹ط·ظٹظ„" : "ط­ط°ظپ"}</button><select value={copySource} onChange={(e) => setCopySource(e.target.value)} className="field mx-1 max-w-[160px]"><option value="">ظ†ط³ط® ظ…ظ†...</option>{roles.filter((r) => r.role_name !== role.role_name).map((r) => <option key={r.role_id}>{r.role_name}</option>)}</select><button disabled={!copySource} onClick={() => onCopyPermissions(copySource, role.role_name)} className="btn-secondary">ظ†ط³ط®</button></td></tr>;
          })}</tbody>
        </table>
      </div>
      {dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={(e) => { e.preventDefault(); onSaveRole(dialog).then(() => setDialog(null)); }} className="panel w-full max-w-2xl p-6"><DialogTitle title="ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¯ظˆط±" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-2"><Label t="ط§ط³ظ… ط§ظ„ط¯ظˆط±"><input required disabled={dialog.is_system_role} value={dialog.role_name} onChange={(e) => setDialog({ ...dialog, role_name: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select></Label><Label t="ط§ظ„ظˆطµظپ"><textarea value={dialog.role_description || ""} onChange={(e) => setDialog({ ...dialog, role_description: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}
    </div>
  );
}

function UsersPermissionsPage({ employees, can }) {
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
      setUsers(u);
      setPermissions(p);
      setEmployeeOptions(employeeRows);
      setRoleRows(roleList);
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
  const roleOptions = [...new Set([...(roleRows || []).filter((r) => r.is_active !== false).map((r) => r.role_name), ...systemRoles])];
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
    if (!canEdit) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (!dialog.employee_id && !String(dialog.role || "").includes("ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…") && !String(dialog.role || "").includes("ط¸â€¦ط·آ¯ط¸ظ¹ط·آ± ط·آ§ط¸â€‍ط¸â€ ط·آ¸ط·آ§ط¸â€¦")) return alert("ظٹط¬ط¨ ط§ط®طھظٹط§ط± ط§ظ„ظ…ظˆط¸ظپ");
    if (!dialog.username) return alert("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…");
    if (!dialog.role) return alert("ظٹط¬ط¨ طھط­ط¯ظٹط¯ ط§ظ„ط¯ظˆط±");
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
  const permissionRows = permissionPages.map((page) => permissions.find((p) => p.role === selectedRole && p.page_key === page) || (selectedRole === "ظ…ط³ط¤ظˆظ„ ط§ظ„ظ…ط®ط²ظˆظ†" ? inventoryDefaultRows.find((p) => p.page_key === page) : null) || {
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
    if (!canEdit) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    try {
      const saved = await adminService.savePermissions(permissionRows);
      setPermissions((list) => [...list.filter((p) => p.role !== selectedRole), ...saved]);
      alert("طھظ… ط­ظپط¸ ط§ظ„طµظ„ط§ط­ظٹط§طھ");
    } catch (e) {
      alert(e.message);
    }
  };
  const syncLegacyPermissions = async (roleRows) => {
    const flat = flattenPermissionTree(treeNodes);
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
    if (!canEdit) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    try {
      setTreeLoading(true);
      const flat = flattenPermissionTree(treeNodes);
      const roleRows = flat.map((node) => treePermissionsService.getNodePermission(treePermissions, selectedRole, node.node_key));
      const saved = await treePermissionsService.saveBulkNodePermissions(selectedRole, roleRows);
      setTreePermissions(saved);
      await syncLegacyPermissions(saved);
      alert("طھظ… ط­ظپط¸ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط¬ط±ط© ط¨ظ†ط¬ط§ط­");
    } catch (e) {
      alert(e.message);
    } finally {
      setTreeLoading(false);
    }
  };
  const resetTreePermissions = async () => {
    if (!canEdit) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط¥ط¹ط§ط¯ط© ط¶ط¨ط· طµظ„ط§ط­ظٹط§طھ ظ‡ط°ط§ ط§ظ„ط¯ظˆط±طں")) return;
    try {
      setTreeLoading(true);
      const saved = await treePermissionsService.resetRolePermissions(selectedRole);
      setTreePermissions(saved);
      await syncLegacyPermissions(saved);
      alert("طھظ…طھ ط¥ط¹ط§ط¯ط© ط¶ط¨ط· طµظ„ط§ط­ظٹط§طھ ط§ظ„ط¯ظˆط±");
    } catch (e) {
      alert(e.message);
    } finally {
      setTreeLoading(false);
    }
  };
  const copyTreePermissions = async (sourceRole) => {
    if (!canEdit) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (!sourceRole) return;
    try {
      setTreeLoading(true);
      const saved = await treePermissionsService.copyRolePermissions(sourceRole, selectedRole);
      setTreePermissions(saved);
      await syncLegacyPermissions(saved);
      alert("طھظ… ظ†ط³ط® ط§ظ„طµظ„ط§ط­ظٹط§طھ ط¥ظ„ظ‰ ط§ظ„ط¯ظˆط± ط§ظ„ظ…ط­ط¯ط¯");
    } catch (e) {
      alert(e.message);
    } finally {
      setTreeLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHead title="ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ† ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ" desc="ط¥ط¯ط§ط±ط© ظ…ط³طھط®ط¯ظ…ظٹ ط§ظ„ظ†ط¸ط§ظ… ظˆظ…طµظپظˆظپط© طµظ„ط§ط­ظٹط§طھ ط§ظ„ط£ط¯ظˆط§ط±" action={<button disabled={!canEdit} onClick={() => setDialog({ user_id: `USR-${Date.now()}`, employee_id: "", employee_name: "", username: "", password: "", role: "ط§ظ„ظ…ظˆط¸ظپ", branch: "", job: "", email: "", phone: "", is_active: true })} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط© ظ…ط³طھط®ط¯ظ…</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="panel flex flex-wrap gap-3 p-4">
        <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط¨ط­ط« ط¨ط§ظ„ط§ط³ظ… ط£ظˆ ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ط£ظˆ ط§ظ„ط±ظ‚ظ…..." />
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ط£ط¯ظˆط§ط±</option>{roleOptions.map((r) => <option key={r}>{r}</option>)}</select>
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[160px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-4">
          <h3 className="mb-3 font-extrabold">ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ†</h3>
          {loading ? <p className="text-sm text-slate-400">ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</p> : <div className="table-wrap"><table><thead><tr><th>ط§ظ„ظ…ط³طھط®ط¯ظ…</th><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ط¯ظˆط±</th><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{filtered.map((u) => <tr key={u.user_id}><td>{u.username}</td><td>{u.employee_name}<p className="text-xs text-slate-400">{u.employee_id}</p></td><td>{u.role}</td><td>{u.branch}</td><td><Status>{u.is_active ? "ظ†ط´ط·" : "ظ…ط¹ط·ظ„"}</Status></td><td><button disabled={!canEdit} onClick={() => setDialog(u)} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canEdit} onClick={() => adminService.saveUser({ ...u, is_active: !u.is_active }).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600">{u.is_active ? "طھط¹ط·ظٹظ„" : "طھظپط¹ظٹظ„"}</button></td></tr>)}</tbody></table></div>}
        </div>
        <TreePermissionsPanel
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          treeNodes={treeNodes}
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
      <RoleManagementPanel roles={roleRows.length ? roleRows : roleOptions.map((role_name) => ({ role_id: `ROLE-${role_name}`, role_name, role_description: "", is_system_role: systemRoles.includes(role_name), is_active: true }))} users={users} canEdit={canEdit} onSaveRole={async (roleRow) => { const saved = await adminService.saveRole(roleRow); setRoleRows((list) => list.some((r) => r.role_id === saved.role_id) ? list.map((r) => r.role_id === saved.role_id ? saved : r) : [...list, saved]); }} onDeleteRole={async (roleRow) => { const saved = await adminService.deleteRole(roleRow, users); setRoleRows((list) => saved ? list.map((r) => r.role_id === saved.role_id ? saved : r) : list.filter((r) => r.role_id !== roleRow.role_id)); }} onCopyPermissions={async (source, target) => { await treePermissionsService.copyRolePermissions(source, target); alert("طھظ… ظ†ط³ط® طµظ„ط§ط­ظٹط§طھ ط§ظ„ط¯ظˆط±"); }} />
      {dialog && <UserEditorModal dialog={dialog} setDialog={setDialog} saveUser={saveUser} employeeOptions={employeeOptions} selectEmployee={selectEmployee} roles={roleOptions} />}
      {false && dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={saveUser} className="panel w-full max-w-3xl p-6"><div className="mb-5 flex"><h3 className="text-xl font-extrabold">ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…</h3><button type="button" onClick={() => setDialog(null)} className="mr-auto"><X /></button></div><div className="grid gap-4 md:grid-cols-2"><Label t="ط±ط¨ط· ط§ظ„ظ…ظˆط¸ظپ"><select value={dialog.employee_id} onChange={(e) => selectEmployee(e.target.value)} className="field mt-2"><option value="">ط¨ط¯ظˆظ† ط±ط¨ط·</option>{employeeOptions.map((e) => <option key={e.id} value={e.id}>{e.name} - {e.id} - {e.branch} - {e.job}</option>)}</select></Label><Label t="ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ"><input readOnly value={dialog.employee_name || dialog.name || ""} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…"><input required value={dialog.username} onChange={(e) => setDialog({ ...dialog, username: e.target.value })} className="field mt-2" /></Label><Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"><input required type="password" value={dialog.password || ""} onChange={(e) => setDialog({ ...dialog, password: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط¯ظˆط±"><select value={dialog.role} onChange={(e) => setDialog({ ...dialog, role: e.target.value })} className="field mt-2">{systemRoles.map((r) => <option key={r}>{r}</option>)}</select></Label><Label t="ط§ظ„ظپط±ط¹"><input readOnly value={dialog.branch || ""} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ظ„ظˆط¸ظٹظپط©"><input readOnly value={dialog.job || ""} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ"><input value={dialog.email || ""} onChange={(e) => setDialog({ ...dialog, email: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظ‡ط§طھظپ"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select></Label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="btn-secondary">ط¥ظ„ط؛ط§ط،</button><button className="btn-primary"><Save size={17} /> ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ</button></div></form></div>}
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
    ["employees", "طھظ‚ط±ظٹط± ط§ظ„ظ…ظˆط¸ظپظٹظ†", employees],
    ["guarantees", "طھظ‚ط±ظٹط± ط§ظ„ط¶ظ…ط§ظ†ط§طھ", guarantees],
    ["overtime", "طھظ‚ط±ظٹط± ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", overtimeRows],
    ["evaluations", "طھظ‚ط±ظٹط± ط§ظ„طھظ‚ظٹظٹظ…ط§طھ", evaluations],
    ["incentives", "طھظ‚ط±ظٹط± ط§ظ„ط­ظˆط§ظپط²", calcIncentivesSafe(employees, evaluations)],
    ["branch", "طھظ‚ط±ظٹط± ط­ط³ط¨ ط§ظ„ظپط±ط¹", employees],
    ["employee", "طھظ‚ط±ظٹط± ط­ط³ط¨ ط§ظ„ظ…ظˆط¸ظپ", evaluations],
    ["month", "طھظ‚ط±ظٹط± ط­ط³ط¨ ط§ظ„ط´ظ‡ط±", evaluations],
    ["branches_compare", "طھظ‚ط±ظٹط± ظ…ظ‚ط§ط±ظ†ط© ط¨ظٹظ† ط§ظ„ظپط±ظˆط¹", overtimeRows],
    ["employees_compare", "طھظ‚ط±ظٹط± ظ…ظ‚ط§ط±ظ†ط© ط¨ظٹظ† ط§ظ„ظ…ظˆط¸ظپظٹظ†", evaluations],
    ["months_compare", "طھظ‚ط±ظٹط± ظ…ظ‚ط§ط±ظ†ط© ط¨ظٹظ† ط§ظ„ط£ط´ظ‡ط±", evaluations],
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
    { key: "name", label: "ط§ظ„ط§ط³ظ…" },
    { key: "employee_name", label: "ط§ظ„ظ…ظˆط¸ظپ" },
    { key: "branch", label: "ط§ظ„ظپط±ط¹" },
    { key: "job", label: "ط§ظ„ظˆط¸ظٹظپط©" },
    { key: "month", label: "ط§ظ„ط´ظ‡ط±" },
    { key: "total", label: "ط§ظ„ظ†طھظٹط¬ط©" },
    { key: "status", label: "ط§ظ„ط­ط§ظ„ط©" },
    { key: "approval_status", label: "ط§ظ„ط§ط¹طھظ…ط§ط¯" },
  ];
  const printReport = (title, rows) => {
    const filteredRows = filterRows(rows);
    const body = `<div class="brand"><h1>${title}</h1></div><p class="muted">طھط§ط±ظٹط® ط§ظ„طھظ‚ط±ظٹط±: ${new Date().toLocaleDateString("ar-SA")}</p><p>ط§ظ„ظپظ„ط§طھط±: ط§ظ„ظپط±ط¹ ${filters.branch} - ط§ظ„ط´ظ‡ط± ${filters.month || "ط§ظ„ظƒظ„"}</p>${rowsToReportHtml("", filteredRows, reportColumns)}<div style="margin-top:40px;display:flex;justify-content:space-between"><b>ط¥ط¹ط¯ط§ط¯ ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©</b><b>ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¥ط¯ط§ط±ط©</b></div>`;
    printDocument(title, body);
  };
  return (
    <div className="space-y-5">
      <PageHead title="ظ…ط±ظƒط² ط§ظ„طھظ‚ط§ط±ظٹط±" desc="طھظ‚ط§ط±ظٹط± ط¥ط¯ط§ط±ظٹط© ط§ط­طھط±ط§ظپظٹط© ظ‚ط§ط¨ظ„ط© ظ„ظ„ط·ط¨ط§ط¹ط© ظˆط§ظ„طھطµط¯ظٹط±" />
      <div className="panel grid gap-3 p-4 md:grid-cols-4 xl:grid-cols-8">
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="field" />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="field" />
        <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field" />
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select>
        <input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field" placeholder="ط§ظ„ظ…ظˆط¸ظپ" />
        <select value={filters.job} onChange={(e) => setFilters({ ...filters, job: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„ظˆط¸ط§ط¦ظپ</option>{jobs.map((j) => <option key={j}>{j}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{["ظ†ط´ط·", "ط³ط§ط±ظٹط©", "ظ…ظ†طھظ‡ظٹط©", "ظ…ظƒظ„ظپ", "ظ…ط¹طھظ…ط¯", "ظ…ط±ظپظˆط¶"].map((s) => <option key={s}>{s}</option>)}</select>
        <select value={filters.approval} onChange={(e) => setFilters({ ...filters, approval: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„ط§ط¹طھظ…ط§ط¯ط§طھ</option>{approvalStatuses.map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reportTypes.map(([key, title, rows]) => {
        const filteredRows = filterRows(rows);
        const exportRows = reportRowsForExport(filteredRows, reportColumns);
        return <div key={key} className="panel p-5"><div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-brand-700"><FileBarChart /></div><h3 className="mt-4 font-extrabold">{title}</h3><p className="mt-1 text-xs text-slate-500">ط¹ط¯ط¯ ط§ظ„ط³ط¬ظ„ط§طھ: {filteredRows.length}</p><div className="mt-5 flex gap-2"><button disabled={can?.("reports_center", "can_export") === false} onClick={() => exportExcel(exportRows, title)} className="btn-secondary flex-1"><FileSpreadsheet size={15} /> Excel</button><button onClick={() => printReport(title, rows)} className="btn-secondary flex-1"><Printer size={15} /> PDF</button><button disabled={can?.("reports_center", "can_export") === false} onClick={() => exportDocx(title, exportRows)} className="btn-secondary flex-1"><Download size={15} /> Word</button></div></div>;
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
  if (!isAdminLikeRole(role)) return <div className="panel p-6 text-center font-bold text-red-600">ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط¹ط±ط¶ ط³ط¬ظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ</div>;
  return (
    <div className="space-y-5">
      <PageHead title="ط³ط¬ظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ" desc="طھطھط¨ط¹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ط­ط³ط§ط³ط© ط¯ط§ط®ظ„ ط§ظ„ظ†ط¸ط§ظ…" />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„طھط§ط±ظٹط®</th><th>ط§ظ„ظ…ط³طھط®ط¯ظ…</th><th>ط§ظ„ط¥ط¬ط±ط§ط،</th><th>ط§ظ„ظˆط­ط¯ط©</th><th>ط§ظ„ط³ط¬ظ„</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.created_at}</td><td>{r.user_name}</td><td>{r.action}</td><td>{r.module_name}</td><td>{r.record_id}</td></tr>)}</tbody></table></div></div>
    </div>
  );
}

const groupCount = (rows, key) =>
  rows.reduce((acc, row) => {
    const value = row[key] || "ط؛ظٹط± ظ…ط­ط¯ط¯";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
function ReportBox({ title, rows }) {
  return (
    <div className="panel p-4">
      <h3 className="mb-3 font-extrabold">{title}</h3>
      <div className="space-y-2">{rows.length ? rows.map(([name, value]) => <div key={name} className="flex rounded-xl bg-slate-50 p-3 text-sm"><span>{name}</span><b className="mr-auto">{value}</b></div>) : <p className="text-sm text-slate-400">ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ</p>}</div>
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
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط§ظ„ظ…ط¤ط´ط± ط§ظ„ظ…ط­ط¯ط¯طں")) return;
    setIndicators(indicators.filter((_, i) => i !== selected));
    setSelected(null);
  };
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <b>{title}</b>
        <div className="mr-auto flex gap-2">
          <button onClick={() => setDialog({ mode: "add", key: "", label: "", type: "positive", weight: 1 })} className="btn-primary !h-9"><Plus size={15} /> ط¥ط¶ط§ظپط©</button>
          <button disabled={selected === null} onClick={() => setDialog({ mode: "edit", index: selected, ...indicators[selected] })} className="btn-secondary !h-9 disabled:opacity-40"><Pencil size={15} /> طھط¹ط¯ظٹظ„</button>
          <button disabled={selected === null} onClick={remove} className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-600 disabled:opacity-40"><Trash2 size={15} /> ط­ط°ظپ</button>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {indicators.map((item, i) => (
          <button key={`${item.key}-${i}`} onClick={() => setSelected(i)} className={`rounded-xl border p-3 text-right text-sm ${selected === i ? "border-brand-700 bg-brand-50" : "border-slate-200"}`}>
            <b>{item.label}</b>
            <p className="mt-1 text-xs text-slate-500">{item.type === "negative" ? "ط®طµظ…" : "ط¥ط¶ط§ظپط©"} أ— {item.weight}</p>
          </button>
        ))}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel w-full max-w-md p-6">
            <div className="mb-5 flex items-center"><h3 className="text-lg font-extrabold">ظ…ط¤ط´ط±</h3><button onClick={() => setDialog(null)} className="mr-auto"><X /></button></div>
            <div className="grid gap-4">
              <Label t="ط§ط³ظ… ط§ظ„ط­ظ‚ظ„ ط§ظ„ط¨ط±ظ…ط¬ظٹ"><input value={dialog.key} onChange={(e) => setDialog({ ...dialog, key: e.target.value.replace(/\s+/g, "_") })} className="field mt-2" /></Label>
              <Label t="ط§ط³ظ… ط§ظ„ظ…ط¤ط´ط±"><input value={dialog.label} onChange={(e) => setDialog({ ...dialog, label: e.target.value })} className="field mt-2" /></Label>
              <Label t="ظ†ظˆط¹ ط§ظ„طھط£ط«ظٹط±"><select value={dialog.type} onChange={(e) => setDialog({ ...dialog, type: e.target.value })} className="field mt-2"><option value="positive">ط¥ط¶ط§ظپط© ظ„ظ„ظ†ظ‚ط§ط·</option><option value="negative">ط®طµظ… ظ…ظ† ط§ظ„ظ†ظ‚ط§ط·</option></select></Label>
              <Label t="ط§ظ„ظˆط²ظ† / ظ…ط¹ط§ظ…ظ„ ط§ظ„ط§ط­طھط³ط§ط¨"><input type="number" value={dialog.weight} onChange={(e) => setDialog({ ...dialog, weight: e.target.value })} className="field mt-2" /></Label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button onClick={() => setDialog(null)} className="btn-secondary">ط¥ظ„ط؛ط§ط،</button><button onClick={save} className="btn-primary"><Save size={17} /> ط­ظپط¸</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnhancedProductivity({ employees, settings, setSettings }) {
  const indicators = settings.productivityIndicators || defaultProductivityIndicators;
  const [values, setValues] = useState(() => ({ ...initialIndicatorValues(indicators), receive: 142, pay: 168, sell: 46, buy: 39, errors: 2, complaints: 1, time: 7 }));
  const list = employees.filter((e) => ["ظƒط§ط´ظٹط±", "ط®ط¯ظ…ط© ط¹ظ…ظ„ط§ط، ظˆطھط­ظˆظٹظ„ط§طھ ظˆط§طھط³", "ط¹ظ…ظ„ظٹط§طھ ظ…طµط±ظپظٹط©"].includes(e.job));
  const setIndicators = (next) => setSettings({ ...settings, productivityIndicators: next });
  const score = scoreIndicators(values, indicators, 0);
  return (
    <Entry title="ظ…ط¤ط´ط±ط§طھ ط§ظ„ط¥ظ†طھط§ط¬ظٹط©" desc="ظٹظ…ظƒظ† ط¥ط¶ط§ظپط© ط£ظˆ طھط¹ط¯ظٹظ„ ظ…ط¤ط´ط±ط§طھ ط§ظ„ط¥ظ†طھط§ط¬ظٹط© ظˆظ…ط¹ط§ظ…ظ„ط§طھ ط§ط­طھط³ط§ط¨ظ‡ط§">
      <Label t="ط§ظ„ظ…ظˆط¸ظپ"><select className="field mt-2 max-w-md">{list.map((e) => <option key={e.id}>{e.name} â€” {e.job}</option>)}</select></Label>
      <IndicatorManager title="ط¥ط¯ط§ط±ط© ظ…ط¤ط´ط±ط§طھ ط§ظ„ط¥ظ†طھط§ط¬ظٹط©" indicators={indicators} setIndicators={setIndicators} />
      <ProductivityComparison employees={employees} indicators={indicators} />
      <Fields values={values} set={setValues} items={indicators.map((x) => [x.key, x.label])} />
      <Score n={score} label="ظ†ظ‚ط§ط· ط§ظ„ط¥ظ†طھط§ط¬ظٹط©" />
      <button className="btn-primary"><Save size={17} /> ط­ظپط¸ ظ…ط¤ط´ط±ط§طھ ط§ظ„ط´ظ‡ط±</button>
    </Entry>
  );
}

function EnhancedDiscipline({ employees, settings, setSettings }) {
  const indicators = settings.disciplineIndicators || defaultDisciplineIndicators;
  const [values, setValues] = useState(() => ({ ...initialIndicatorValues(indicators), present: 25, absent: 1, late: 18, early: 0, violations: 0, penalties: 0 }));
  const setIndicators = (next) => setSettings({ ...settings, disciplineIndicators: next });
  const score = scoreIndicators(values, indicators, 100);
  return (
    <Entry title="ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ" desc="ظٹظ…ظƒظ† طھط¹ط¯ظٹظ„ ظ…ط¤ط´ط±ط§طھ ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط£ظˆ ط¥ط¶ط§ظپط© ظ…ط¤ط´ط±ط§طھ ط¬ط¯ظٹط¯ط©">
      <Label t="ط§ظ„ظ…ظˆط¸ظپ"><select className="field mt-2 max-w-md">{employees.map((e) => <option key={e.id}>{e.name}</option>)}</select></Label>
      <IndicatorManager title="ط¥ط¯ط§ط±ط© ظ…ط¤ط´ط±ط§طھ ط§ظ„ط§ظ†ط¶ط¨ط§ط·" indicators={indicators} setIndicators={setIndicators} />
      <Fields values={values} set={setValues} items={indicators.map((x) => [x.key, x.label])} />
      <Label t="ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©"><textarea className="field mt-2 !h-auto py-3" rows="3" /></Label>
      <Score n={score} label="ط¯ط±ط¬ط© ط§ظ„ط§ظ†ط¶ط¨ط§ط·" />
      <button className="btn-primary"><Save size={17} /> ط­ظپط¸ ط³ط¬ظ„ ط§ظ„ط§ظ†ط¶ط¨ط§ط·</button>
    </Entry>
  );
}

function EnhancedIncentives({ employees, evaluations, setEvaluations }) {
  const [details, setDetails] = useState(null);
  const data = evaluations.map((ev) => {
    const employee = employees.find((x) => x.id === ev.employeeId) || {};
    const total = effectiveEvaluationTotal(ev);
    const cat = classify(total);
    const rate = cat === "ظ…ظ…طھط§ط²" ? 0.1 : cat === "ط¬ظٹط¯ ط¬ط¯ظ‹ط§" ? 0.07 : cat === "ط¬ظٹط¯" ? 0.04 : 0;
    return { ...employee, evaluation: ev, total, rate, amount: (employee.salary || 0) * rate * (total / 100), approval: ev.status };
  });
  return (
    <div className="space-y-5">
      <PageHead title="ط§ظ„ط­ظˆط§ظپط² ظˆط§ظ„ظ…ظƒط§ظپط¢طھ" desc="ط§ط­طھط³ط§ط¨ ط¢ظ„ظٹ ظ…ط¹ ط¹ط±ط¶ طھظپط§طµظٹظ„ ط£ظ‡ظ„ظٹط© ظƒظ„ ظ…ظˆط¸ظپ" action={<button onClick={() => exportExcel(data, "ط§ظ„ط­ظˆط§ظپط²")} className="btn-primary"><Download size={17} /> طھطµط¯ظٹط± ط§ظ„ظƒط´ظپ</button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Mini label="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط­ظˆط§ظپط²" value={money(data.reduce((s, x) => s + x.amount, 0))} I={CircleDollarSign} />
        <Mini label="ط§ظ„ظ…ط³طھط­ظ‚ظˆظ†" value={data.filter((x) => x.rate > 0).length} I={UserCheck} />
        <Mini label="ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ط§ط¹طھظ…ط§ط¯" value={evaluations.filter((x) => x.status === "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©").length} I={Clock3} />
      </div>
      <div className="panel p-4">
        <div className="table-wrap">
          <table>
            <thead><tr><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„ظˆط¸ظٹظپط©</th><th>ط§ظ„ط±ط§طھط¨</th><th>ط§ظ„طھظ‚ظٹظٹظ…</th><th>ط§ظ„ظ†ط³ط¨ط©</th><th>ط§ظ„ط­ط§ظپط² ط§ظ„ظ…ظ‚طھط±ط­</th><th>ط§ظ„ط§ط¹طھظ…ط§ط¯</th><th>ط§ظ„طھظپط§طµظٹظ„</th></tr></thead>
            <tbody>
              {data.map((x) => (
                <tr key={`${x.id}-${x.evaluation?.id}`}>
                  <td className="font-bold">{x.name}</td><td>{x.branch}</td><td>{x.job}</td><td>{money(x.salary)}</td>
                  <td><Status>{classify(x.total)}</Status> {x.total}%</td><td>{x.rate * 100}%</td><td className="font-bold text-brand-700">{money(x.amount)}</td>
                  <td>
                    <select value={x.approval} onChange={(e) => setEvaluations((list) => list.map((ev) => ev.id === x.evaluation.id ? { ...ev, status: e.target.value } : ev))} className="field !h-9">
                      <option>ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©</option><option>ظ…ط¹طھظ…ط¯</option><option>ظ…ط±ظپظˆط¶</option>
                    </select>
                  </td>
                  <td><button onClick={() => setDetails(x)} className="btn-secondary !h-9"><Eye size={15} /> ط¹ط±ط¶</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {details && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel w-full max-w-2xl p-6">
            <div className="mb-5 flex items-center"><h3 className="text-lg font-extrabold">طھظپط§طµظٹظ„ ط§ط³طھط­ظ‚ط§ظ‚ ط§ظ„ط­ط§ظپط²</h3><button onClick={() => setDetails(null)} className="mr-auto"><X /></button></div>
            <div className="grid gap-3 md:grid-cols-2">
              <Info t="ط§ظ„ظ…ظˆط¸ظپ" v={details.name} /><Info t="ط§ظ„ظپط±ط¹" v={details.branch} /><Info t="ط§ظ„ظˆط¸ظٹظپط©" v={details.job} /><Info t="ط§ظ„ط±ط§طھط¨" v={money(details.salary)} />
              <Info t="ظ†طھظٹط¬ط© ط§ظ„طھظ‚ظٹظٹظ…" v={`${details.total}% - ${classify(details.total)}`} /><Info t="ظ†ط³ط¨ط© ط§ظ„ط­ط§ظپط²" v={`${details.rate * 100}%`} />
              <Info t="ظ…ط¹ط§ط¯ظ„ط© ط§ظ„ط­ط§ظپط²" v="ط§ظ„ط±ط§طھط¨ أ— ظ†ط³ط¨ط© ط§ظ„ط­ط§ظپط² أ— ظ†ط³ط¨ط© ط§ظ„طھظ‚ظٹظٹظ…" /><Info t="ظ‚ظٹظ…ط© ط§ظ„ط­ط§ظپط²" v={money(details.amount)} />
              <Info t="ط§ظ„ط´ظ‡ط±" v={details.evaluation?.month || ""} /><Info t="ط­ط§ظ„ط© ط§ظ„ط§ط¹طھظ…ط§ط¯" v={details.approval} />
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">ظ…ظ„ط§ط­ط¸ط§طھ ط§ظ„طھظ‚ظٹظٹظ…: {details.evaluation?.notes || "ظ„ط§ طھظˆط¬ط¯ ظ…ظ„ط§ط­ط¸ط§طھ"}</div>
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
    ["view", "ط¹ط±ط¶"],
    ["add", "ط¥ط¶ط§ظپط©"],
    ["edit", "طھط¹ط¯ظٹظ„"],
    ["delete", "ط­ط°ظپ"],
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
          <Label t="ط§ط®طھظٹط§ط± ط§ظ„ظˆط¸ظٹظپط© / ط§ظ„ط¯ظˆط±">
            <select value={role} onChange={(e) => setRole(e.target.value)} className="field mt-2">
              {roleNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </Label>
        </div>
        <button onClick={() => selectAll(true)} className="btn-primary">
          <BadgeCheck size={16} /> طھط­ط¯ظٹط¯ ط§ظ„ظƒظ„
        </button>
        <button onClick={() => selectAll(false)} className="btn-secondary">
          <X size={16} /> ط¥ظ„ط؛ط§ط، ط§ظ„طھط­ط¯ظٹط¯
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200">
        <div className="grid grid-cols-[1.4fr_repeat(4,.55fr)] gap-2 border-b bg-slate-50 p-3 text-sm font-extrabold text-slate-600">
          <span>ط§ظ„ظ‚ط§ط¦ظ…ط© / ط§ظ„طµظپط­ط©</span>
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
        طھظ… ط­ظپط¸ ط§ظ„طµظ„ط§ط­ظٹط§طھ ظƒظ…طµظپظˆظپط© طھظپطµظٹظ„ظٹط© ظ‚ط§ط¨ظ„ط© ظ„ظ„ط±ط¨ط· ظ„ط§ط­ظ‚ظ‹ط§ ط¨ظ…ظ†ط¹ ط§ظ„ط£ط²ط±ط§ط± ظˆط§ظ„طµظپط­ط§طھ ط­ط³ط¨ ط§ظ„ط¯ظˆط±.
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
        <h3 className="w-full text-lg font-extrabold">ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ط¥ظ†طھط§ط¬ظٹط© ط¨ظٹظ† ظپطھط±طھظٹظ†</h3>
        <Label t="ط§ظ„ظپطھط±ط© ط£ ظ…ظ†"><input type="date" value={range.aFrom} onChange={(e) => setRange({ ...range, aFrom: e.target.value })} className="field mt-2" /></Label>
        <Label t="ط§ظ„ظپطھط±ط© ط£ ط¥ظ„ظ‰"><input type="date" value={range.aTo} onChange={(e) => setRange({ ...range, aTo: e.target.value })} className="field mt-2" /></Label>
        <Label t="ط§ظ„ظپطھط±ط© ط¨ ظ…ظ†"><input type="date" value={range.bFrom} onChange={(e) => setRange({ ...range, bFrom: e.target.value })} className="field mt-2" /></Label>
        <Label t="ط§ظ„ظپطھط±ط© ط¨ ط¥ظ„ظ‰"><input type="date" value={range.bTo} onChange={(e) => setRange({ ...range, bTo: e.target.value })} className="field mt-2" /></Label>
        <Label t="ظ†ط·ط§ظ‚ ط§ظ„ظ…ظ‚ط§ط±ظ†ط©"><select value={range.scope} onChange={(e) => setRange({ ...range, scope: e.target.value })} className="field mt-2"><option value="employee">ط§ظ„ظ…ظˆط¸ظپ</option><option value="branch">ط§ظ„ظپط±ط¹</option></select></Label>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <div className="table-wrap">
          <table>
            <thead><tr><th>{range.scope === "branch" ? "ط§ظ„ظپط±ط¹" : "ط§ظ„ظ…ظˆط¸ظپ"}</th><th>ط§ظ„ظپطھط±ط© ط£</th><th>ط§ظ„ظپطھط±ط© ط¨</th><th>ظ†ط³ط¨ط© ط§ظ„طھط؛ظٹط±</th></tr></thead>
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
  XLSX.utils.book_append_sheet(wb, ws, "ط§ظ„ط¨ظٹط§ظ†ط§طھ");
  XLSX.writeFile(wb, `${name}.xlsx`);
}
const employeeImportHeaderMap = {
  "ط±ظ‚ظ… ط§ظ„ظ…ظˆط¸ظپ": "id",
  employee_id: "id",
  id: "id",
  "ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ": "name",
  employee_name: "name",
  name: "name",
  "ط§ظ„ظپط±ط¹": "branch",
  branch: "branch",
  "ط§ظ„ظˆط¸ظٹظپط©": "job",
  job: "job",
  "طھط§ط±ظٹط® ط§ظ„طھط¹ظٹظٹظ†": "hire_date",
  hire_date: "hire_date",
  hiredate: "hire_date",
  hireDate: "hire_date",
  "ط§ظ„ط±ط§طھط¨": "salary",
  salary: "salary",
  "ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ": "phone",
  phone: "phone",
  "ط§ظ„ط­ط§ظ„ط©": "status",
  status: "status",
  "ط§ظ„ظ…ط¯ظٹط± ط§ظ„ظ…ط¨ط§ط´ط±": "manager",
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
    status: "ظ†ط´ط·",
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
        alert(`ظ„ظ… ظٹطھظ… ط§ط³طھظٹط±ط§ط¯ ط¨ط¹ط¶ ط§ظ„طµظپظˆظپ ظ„ط£ظ† ط±ظ‚ظ… ط§ظ„ظ…ظˆط¸ظپ ظˆط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ ظ…ط·ظ„ظˆط¨ط§ظ†.\nط§ظ„طµظپظˆظپ ط؛ظٹط± ط§ظ„طµط§ظ„ط­ط©: ${invalidRows.join(", ")}`);
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
        status: row.status || "ظ†ط´ط·",
        manager: row.manager || "",
      }));
      setEmployees((list) => {
        const byId = new Map(list.map((employee) => [employee.id, employee]));
        importedEmployees.forEach((employee) => byId.set(employee.id, employee));
        return Array.from(byId.values());
      });
      alert(`طھظ… ط§ط³طھظٹط±ط§ط¯ ${importedEmployees.length} ظ…ظˆط¸ظپ/ظ…ظˆط¸ظپط© ط¨ظ†ط¬ط§ط­`);
    } catch (error) {
      console.error("Supabase employees load/save error:", error);
      alert(error.message || "طھط¹ط°ط± ط§ط³طھظٹط±ط§ط¯ ظ…ظ„ظپ ط§ظ„ظ…ظˆط¸ظپظٹظ†");
    } finally {
      event.target.value = "";
    }
  };
  r.readAsArrayBuffer(f);
}

