import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BadgeCheck,
  Gauge,
  CalendarCheck,
   CalendarDays,
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
  Smartphone,
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
import { activityLogsService } from "./services/activityLogs";
import { shiftsService, shiftPeriods, calculateShiftHours } from "./services/shifts";
import { shiftScenariosService, scenarioTypes } from "./services/shiftScenarios";
import { shiftAssignmentsService, shiftAssignmentStatuses } from "./services/shiftAssignments";
import { inventoryService, inventoryCategories, inventoryUnits, inventoryCurrencies, getInventoryCurrency, calculateInventoryLineTotal } from "./services/inventory";
import { inventoryDocumentsService, inventoryDocumentConfigs } from "./services/inventoryDocuments";
import { calculateInventoryDashboardTotals, generateInventoryReports, inventoryRowsForExport } from "./services/inventoryReports";
import { generateBranchForecast } from "./services/inventoryForecast";
import { canInventory } from "./services/inventoryPermissions";
import { inventorySettingsService, defaultInventorySettings, defaultDocumentNumbering } from "./services/inventorySettings";
import { dailyOperationsService, isApprovedDailyOperation, isApprovedStatus, normalizeIncludedInKpi, operationTypes, serviceChannels, operationStatuses, pendingDailyOperationStatuses } from "./services/dailyOperations";
import { downloadDailyOperationsTemplate, downloadProductivityTemplate, exportDailyOperationsToExcel, exportProductivityOperationsToExcel, getTodayDateOnly, importDailyOperationsRows, parseDailyOperationsExcel, validateDailyOperationsRows } from "./services/dailyOperationsImportExport";
import { performanceCriteriaService, scoringTypes, defaultJobKpis } from "./services/performanceCriteria";
import { kpiCalculationService } from "./services/kpiCalculation";
import KpiSettingsPage from "./components/hr/KpiSettingsPage";
import { defaultKpiCriterionTypes, defaultKpiEvaluationMethods, loadKpiCriterionTypes, loadKpiEvaluationMethods } from "./services/kpiSettings";
import { aiAssistantService } from "./services/aiAssistant";
import { settingsBranchesService } from "./services/settingsBranches";
import { settingsCurrenciesService } from "./services/settingsCurrencies";
import { settingsUsersService, settingsUserFromDb } from "./services/settingsUsers";
import { systemSettingsService } from "./services/systemSettings";
import { hrRecordsService } from "./services/hrRecords";
import { treePermissionsService, permissionActions, dataScopes, departmentOptions, flattenPermissionTree, normalizeTreePermission } from "./services/treePermissions";
import { recruitmentService, recruitmentTabs, generateWelcomeMessage } from "./services/recruitment";
import { generateRecruitmentReports } from "./services/recruitmentReports";
import { backupService } from "./services/backup";
import { companiesService } from "./services/companies";
import { applyCompanyPermissionActionToggle, companyPermissionActions, companyPermissionChildActionKeys, companyPermissionModules, companyPermissionsService, companyCanAccessFromRows, companyCanModuleFromRows, companyCanPageFromRows, mergeWithDefaultCompanyPermissions } from "./services/companyPermissions";
import { applyCompanyTheme, applyThemeForCurrentCompany, getDefaultTheme, normalizeThemePayload, themePresets, themeService } from "./services/theme";
import { clearTenantSession, getCurrentCompany, getCurrentUser, isPlatformAdminUser, isPlatformRoute, isProtectedPlatformRole, isProtectedPlatformUser, loadTenantSession, setCompanySession, setPlatformSession } from "./services/tenant";
import { displayRoleName, getCleanRoleOptions, isMojibakeText, normalizeRoleName } from "./services/roles";
import { assistantModes, pageRegistryByKey } from "./constants/pageRegistry";
import { APP_BRAND_NAME, APP_DESCRIPTION, APP_OFFICIAL_NAME, APP_REPORT_SUBTITLE, APP_REPORT_TITLE, APP_SHORT_NAME, APP_SYSTEM_NAME, APP_TAGLINE } from "./constants/branding";
import { buildReportBrandingHtml } from "./services/reportBranding";
import { ERP_MODULES, ERP_PAGE_BY_KEY, ERP_PAGE_BY_ROUTE, buildGroupedNavigation, getModuleForPage, getModulePages, isPlaceholderPage } from "./constants/moduleRegistry";
import HRFoundationPage from "./components/hr/HRFoundationPage";
import HRExecutiveDashboard from "./components/hr/HRExecutiveDashboard";
import AttendanceCalculationPage from "./components/hr/AttendanceCalculationPage";
import EmployeeSelfAttendancePage from "./components/hr/EmployeeSelfAttendancePage";
import EmployeePortalApp, { EmployeeLoginPage } from "./components/employee/EmployeePortalApp";
import EmployeeAppAdminSettingsPage from "./components/hr/EmployeeAppAdminSettingsPage";
import KpiScoresDashboardPage from "./components/hr/KpiScoresDashboardPage";
import AttendanceRecordsPage from "./components/hr/AttendanceRecordsPage";
import MonthlyEmployeeTargetsPage from "./components/performance/MonthlyEmployeeTargetsPage";
import BranchTargetsPage from "./components/performance/BranchTargetsPage";
import AttendanceKpiRulesPage from "./components/performance/AttendanceKpiRulesPage";
import IncentiveExclusionsPage from "./components/performance/IncentiveExclusionsPage";
import PerformanceProcessGuidePage from "./components/performance/PerformanceProcessGuidePage";
import IncentiveProposalPage from "./components/performance/IncentiveProposalPage";
import { kpiScoresService } from "./services/kpiScores";
import { dailyOperationsReportsService } from "./services/dailyOperationsReports";
import DailyOperationsReportsPage from "./components/hr/DailyOperationsReportsPage";
import OvertimeImportExportPage from "./components/hr/OvertimeImportExportPage";
import { EmployeeEffectivenessPage, EmployeesGridPage, UserActivityLogsPage } from "./components/hr/EmployeeSubPages";
import SystemSettingsPage from "./components/settings/SystemSettingsPage";
import GroupedSidebarNav from "./components/navigation/GroupedSidebarNav";
import FixedAssetsModule from "./components/assets/FixedAssetsModule";
import FixedAssetsImportExportPage from "./components/assets/FixedAssetsImportExportPage";
import AssetDepreciationPage from "./components/assets/AssetDepreciationPage";
import InventoryItemsImportExportPage from "./components/inventory/InventoryItemsImportExportPage";
const icons = {
  dashboard: LayoutDashboard,
  employees: Users,
  employees_grid: Users,
  employee_effectiveness: UserCheck,
  user_activity_logs: ClipboardList,
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
  overtime_import_export: FileSpreadsheet,
  shifts: CalendarCheck,
  inventory: Wallet,
  inventory_items_import_export: FileSpreadsheet,
  daily_operations: Gauge,
  daily_operations_reports: FileBarChart,
  attendance_dashboard: Clock3,
  attendance_records: CalendarCheck,
  bulk_attendance: Users,
  attendance_requests: ClipboardList,
  working_hours_report: FileBarChart,
  attendance_in_out_report: FileBarChart,
  monthly_attendance_report: CalendarDays,
  attendance_period_settings: Settings,
  performance_criteria: ClipboardList,
  performance_kpi_scores: Star,
  kpi_settings: Settings,
  users_permissions: UserRoundCog,
  recruitment: UserPlus,
  reports_center: FileBarChart,
  audit_logs: ClipboardList,
  companies_admin: Building2,
  platform_admin_settings: ShieldCheck,
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
  assets_import_export: FileSpreadsheet,
  assets_depreciation_tools: FileBarChart,
  hr_contracts: ClipboardList,
  hr_custodies: Wallet,
  hr_training: Star,
  hr_reports: FileBarChart,
  hr_settings: Settings,
  employee_app_settings: Smartphone,
  system_settings: Settings,
  hr_requests_approvals: ClipboardList,
  hr_approvals: BadgeCheck,
  hr_org_chart: Building2,
  hr_settings_full: Settings,
  hr_financial_setup: CircleDollarSign,
  hr_templates_full: ClipboardList,
};
const fullHrNavItems = [
  ["hr_home", "ظ„ظˆط­ط© ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©"],
  ["employees", "ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط¸ظپظٹظ†"],
  ["employees_grid", "ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط¸ظپظٹظ† ط´ط¨ظƒظٹ"],
  ["employee_effectiveness", "ط§ظ„ظ…ظˆط¸ظپظˆظ† ط§ظ„ظ…طھط¹ط§ظˆظ†ظˆظ† ظˆط؛ظٹط± ط§ظ„ظپط¹ط§ظ„ظˆظ†"],
  ["user_activity_logs", "ط³ط¬ظ„ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†"],
  ["hr_org_chart", "ط§ظ„ظ‡ظٹظƒظ„ ط§ظ„طھظ†ط¸ظٹظ…ظٹ"],
  ["hr_settings", "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©"],
  ["employee_app_settings", "ط¥ط¹ط¯ط§ط¯ط§طھ طھط·ط¨ظٹظ‚ ط§ظ„ظ…ظˆط¸ظپ"],
  ["users_permissions", "ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ† ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ"],
  ["hr_contracts", "ط§ظ„ط¹ظ‚ظˆط¯"],
  ["hr_files", "ظ…ظ„ظپط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†"],
  ["guarantees", "ط§ظ„ط¶ظ…ط§ظ†ط§طھ"],
  ["hr_custodies", "ط§ظ„ط¹ظ‡ط¯"],
  ["daily_operations", "ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط©"],
  ["daily_operations_reports", "طھظ‚ط§ط±ظٹط± ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط©"],
  ["attendance_dashboard", "ظ„ظˆط­ط© ط­ط³ط§ط¨ ط§ظ„ط¯ظˆط§ظ…"],
  ["attendance_records", "طھط³ط¬ظٹظ„ ط­ط¶ظˆط± ظˆط§ظ†طµط±ط§ظپ"],
  ["hr-attendance-records", "الحضور والغياب"],
  ["bulk_attendance", "طھط­ط¶ظٹط± ط¬ظ…ط§ط¹ظٹ"],
  ["attendance_requests", "ظ…ط¹ط§ظ„ط¬ط© ط·ظ„ط¨ط§طھ ط§ظ„ط¹ظ…ظ„"],
  ["working_hours_report", "طھظ‚ط±ظٹط± ط³ط§ط¹ط§طھ ط§ظ„ط§ط´طھط؛ط§ظ„"],
  ["attendance_in_out_report", "طھظ‚ط±ظٹط± ط§ظ„ط­ط¶ظˆط± ظˆط§ظ„ط§ظ†طµط±ط§ظپ"],
  ["monthly_attendance_report", "طھظ‚ط±ظٹط± ط§ظ„ط­ط¶ظˆط± ط§ظ„ط´ظ‡ط±ظٹ"],
  ["attendance_period_settings", "ط¥ط¹ط¯ط§ط¯ط§طھ ظپطھط±ط§طھ ط§ظ„ط¯ظˆط§ظ…"],
  ["discipline", "ط§ظ„ط­ط¶ظˆط± ظˆط§ظ„ط§ظ†طµط±ط§ظپ"],
  ["shifts", "ط§ظ„ط´ظپطھط§طھ"],
  ["overtime", "ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ"],
  ["overtime_import_export", "ط§ط³طھظٹط±ط§ط¯ ظˆطھطµط¯ظٹط± ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ"],
  ["hr_leaves", "ط§ظ„ط¥ط¬ط§ط²ط§طھ"],
  ["hr_requests_approvals", "ط§ظ„ط·ظ„ط¨ط§طھ ظˆط§ظ„ظ…ظˆط§ظپظ‚ط§طھ"],
  ["hr_salary", "ط§ظ„ط±ظˆط§طھط¨"],
  ["templates", "نماذج التقييم"],
  ["evaluations", "تقييم الموظفين"],
  ["performance_criteria", "معايير الأداء"],
  ["performance-monthly-targets", "أهداف الشهر"],
  ["performance-branch-targets", "أهداف الفروع"],
  ["performance-attendance-rules", "قواعد الحضور والانضباط"],
  ["performance_kpi_scores", "درجات KPI"],
  ["kpi_settings", "إعدادات KPI"],
  ["productivity", "الإنتاجية"],
  ["incentives", "الحوافز"],
  ["performance-incentive-exclusions", "استثناءات الحوافز"],
  ["performance-incentive-proposal", "تصور نظام الحوافز"],
  ["performance-process-guide", "شرح آلية التقييم والحوافز"],
  ["top", "موظف الشهر"],
  ["plans", "خطط التحسين"],
  ["recruitment", "ط§ظ„طھظˆط¸ظٹظپ"],
  ["hr_training", "ط§ظ„طھط¯ط±ظٹط¨"],
  ["hr_disciplinary", "ط§ظ„ظ…ط®ط§ظ„ظپط§طھ ظˆط§ظ„ط¥ظ†ط°ط§ط±ط§طھ"],
  ["hr_circulars", "ط§ظ„طھط¹ط§ظ…ظٹظ…"],
  ["hr_complaints", "ط§ظ„ط´ظƒط§ظˆظ‰"],
  ["hr_termination", "ط¥ظ†ظ‡ط§ط، ط§ظ„ط®ط¯ظ…ط©"],
  ["hr_reports", "طھظ‚ط§ط±ظٹط± ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©"],
];
const genericHrPageKeys = new Set(["hr_leaves", "hr_salary", "hr_requests_approvals", "hr_disciplinary", "hr_termination", "hr_files", "hr_contracts", "hr_custodies", "hr_performance_full", "hr_training", "hr_circulars", "hr_complaints", "hr_reports"]);
const attendancePageKeys = new Set(["attendance_dashboard", "attendance_records", "bulk_attendance", "attendance_requests", "working_hours_report", "attendance_in_out_report", "monthly_attendance_report", "attendance_period_settings"]);
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
  hr_attendance_payroll: "attendance_dashboard",
  hr_recruitment_full: "recruitment",
  hr_incentives_full: "incentives",
};
const navItems = [
  ["companies_admin", "ط¥ط¯ط§ط±ط© ط§ظ„ط´ط±ظƒط§طھ"],
  ["platform_admin_settings", "ط¥ط¹ط¯ط§ط¯ط§طھ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©"],
  ["system_settings", "ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¹ط§ظ…ط©"],
  ...baseNavItems.slice(0, -2),
  ["guarantees", "ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†"],
  ["overtime", "ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ"],
  ["shifts", "ط´ظپطھط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†"],
  ["inventory", "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط®ط²ظˆظ†"],
  ["daily_operations", "ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط©"],
  ["performance_criteria", "ظ…ط¹ط§ظٹظٹط± ط§ظ„ط£ط¯ط§ط،"],
  ["performance_kpi_scores", "ط¯ط±ط¬ط§طھ KPI"],
  ["kpi_settings", "ط¥ط¹ط¯ط§ط¯ط§طھ KPI"],
  ["users_permissions", "ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ† ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ"],
  ["recruitment", "ط·ظ„ط¨ط§طھ ط§ظ„طھظˆط¸ظٹظپ"],
  ["reports_center", "ظ…ط±ظƒط² ط§ظ„طھظ‚ط§ط±ظٹط±"],
  ["audit_logs", "ط³ط¬ظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ"],
  ...fullHrNavItems,
  ...baseNavItems.slice(-2),
];
const safeNavigationItems = (items = []) => (Array.isArray(items) ? items : []).filter((item) => {
  const valid = Array.isArray(item) && item.length >= 2 && Boolean(item[0]);
  if (!valid) console.warn("Invalid navigation item skipped", item);
  return valid;
});
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
    { name: "ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©", description: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظˆط¸ظپظٹظ† ظˆط§ظ„طھظ‚ظٹظٹظ…ط§طھ ظˆط§ظ„طھظ‚ط§ط±ظٹط±" },
    { name: "ظ…ط¯ظٹط± ط§ظ„ظپط±ط¹", description: "طھظ‚ظٹظٹظ… ظ…ظˆط¸ظپظٹ ط§ظ„ظپط±ط¹ ظˆظ…طھط§ط¨ط¹ط© ط§ظ„ط§ظ†ط¶ط¨ط§ط·" },
    { name: "ط§ظ„ظ…ظˆط¸ظپ", description: "ط¹ط±ط¶ ط§ظ„طھظ‚ظٹظٹظ… ظˆطھظ‚ط¯ظٹظ… ط§ظ„ط§ط¹طھط±ط§ط¶" },
    { name: "ط§ظ„ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ„ظٹط§", description: "ط¹ط±ط¶ ط§ظ„طھظ‚ط§ط±ظٹط± ظˆط§ط¹طھظ…ط§ط¯ ط§ظ„ط­ظˆط§ظپط²" },
  ],
  users: [
    { name: "ط³ظ„ط·ط§ظ† ط§ظ„ط´ط¬ظ†ظٹ", username: "admin", password: "", role: "ظ…ط¯ظٹط± ط¹ط§ظ… ط§ظ„ظ†ط¸ط§ظ…", employeeId: "" },
    { name: "ط£ط­ظ…ط¯ ظ…ط­ظ…ط¯ ط§ظ„ط³ط§ظ„ظ…", username: "employee", password: "", role: "ط§ظ„ظ…ظˆط¸ظپ", employeeId: "EMP-001" },
  ],
  manager: { name: "ط³ظ„ط·ط§ظ† ط§ظ„ط´ط¬ظ†ظٹ", username: "admin", role: "ظ…ط¯ظٹط± ط¹ط§ظ… ط§ظ„ظ†ط¸ط§ظ…" },
};
const colors = {
  "ظ…ظ…طھط§ط²": "bg-emerald-50 text-emerald-700",
  "ط¬ظٹط¯ ط¬ط¯ظ‹ط§": "bg-blue-50 text-blue-700",
  "ط¬ظٹط¯": "bg-sky-50 text-sky-700",
  "ظ…ظ‚ط¨ظˆظ„": "bg-amber-50 text-amber-700",
  "ط¶ط¹ظٹظپ": "bg-red-50 text-red-700",
  "ظ†ط´ط·": "bg-emerald-50 text-emerald-700",
  "ط¥ط¬ط§ط²ط©": "bg-amber-50 text-emerald-700",
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
  words.some((word) => String(value || "").includes(word));
const isCashDenominationCriterion = (name = "") =>
  includesAny(name, [
    "ظپط¦ط© 200",
    "ظپط¦ط© 500",
    "ظپط¦ط© 1000",
    "200",
    "500",
    "1000",
  ]);
const isBehavioralCriterion = (name = "") =>
  includesAny(name, [
    "ط§ظ„ط§ظ†ط¶ط¨ط§ط·",
    "ط§ظ„ط§ظ„طھط²ط§ظ…",
    "ط§ظ„ط³ظ„ظˆظƒ",
    "ط§ظ„طھط¹ط§ظˆظ†",
    "ط§ظ„ط­ط¶ظˆط±",
    "ط§ظ„ط¯ظˆط§ظ…",
    "طھط­ظ…ظ„ ط¶ط؛ط· ط§ظ„ط¹ظ…ظ„",
  ]);
const detectCriterionTypeByName = (name = "") => {
  const value = String(name || "").trim();
  if (isCashDenominationCriterion(value)) return "cash_counting";
  if (isBehavioralCriterion(value)) return "behavioral";
  if (includesAny(value, ["ط±ط¶ط§ ط§ظ„ط¹ظ…ظ„ط§ط،", "ط§ظ„ط´ظƒط§ظˆظ‰", "ط¬ظˆط¯ط© ط®ط¯ظ…ط©", "ط¬ظˆط¯ط© ط§ظ„ط±ط¯", "ط¬ظˆط¯ط© ط§ظ„طھظˆط§طµظ„"])) return "service_quality";
  if (includesAny(value, ["ظ…ط¨ظ„ط؛", "ظ…ط¨ط§ظ„ط؛", "ظ…ط§ظ„ظٹ", "ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ط§ظ„ط؛"])) return "financial";
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
  const isCounter = includesAny(job, ["ط¹ط¯ط§ط¯", "ط¹ط¯ط§ط¯ ظˆظ…ط±ط§ط³ظ„ط§طھ"]);
  const isTech = includesAny(job, ["ط¯ط¹ظ… ظپظ†ظٹ"]);
  const isCustomer = includesAny(job, ["ط®ط¯ظ…ط© ط¹ظ…ظ„ط§ط،"]);
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
  return makeCriteriaTemplate(names).map(applyCriterionTypeAndCashWeights);
};
const buildDefaultJobCriteria = () =>
  Object.fromEntries(
    jobs.map((job) => {
      const custom = job.includes("ط¹ط¯ط§ط¯")
        ? ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¨ط§ظ„ط؛ ط§ظ„ظ…ط¹ط¯ظˆط¯ط©", "ط¯ظ‚ط© ظپط±ط² ظپط¦ط© 200", "ط¯ظ‚ط© ظپط±ط² ظپط¦ط© 500", "ط¯ظ‚ط© ظپط±ط² ظپط¦ط© 1000", "ظƒط´ظپ ط§ظ„ط¹ظ…ظ„ط§طھ ط§ظ„طھط§ظ„ظپط© ط£ظˆ ط§ظ„ظ…ط´ط¨ظˆظ‡ط©", "ط³ط±ط¹ط© ط§ظ„طھط³ظ„ظٹظ… ظˆط§ظ„ط§ط³طھظ„ط§ظ…", "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط¥ط¬ط±ط§ط،ط§طھ ط§ظ„ط®ط²ظٹظ†ط©", "ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ", "ط§ظ„طھط¹ط§ظˆظ† ظ…ط¹ ط§ظ„ظپط±ظٹظ‚", "طھطµظپظٹط± ط§ظ„ط¹ظ‡ط¯ط© ط¯ظˆظ† ظپط±ظˆظ‚ط§طھ"]
        : job.includes("ط¯ط¹ظ… ظپظ†ظٹ")
          ? ["ط³ط±ط¹ط© ط¥ط؛ظ„ط§ظ‚ ط§ظ„ط¨ظ„ط§ط؛ط§طھ", "ط¬ظˆط¯ط© ط§ظ„ط­ظ„ظˆظ„ ط§ظ„ظپظ†ظٹط©", "ط§ط³طھظ‚ط±ط§ط± ط§ظ„ط£ظ†ط¸ظ…ط© ظˆط§ظ„ط£ط¬ظ‡ط²ط©", "طھظˆط«ظٹظ‚ ط§ظ„ط¨ظ„ط§ط؛ط§طھ", "ط¯ط¹ظ… ط§ظ„ظپط±ظˆط¹ ط¹ظ† ط¨ط¹ط¯", "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط£ظˆظ„ظˆظٹط© ط§ظ„ط¨ظ„ط§ط؛ط§طھ", "ط­ظ…ط§ظٹط© ط§ظ„ط¨ظٹط§ظ†ط§طھ", "ط§ظ„طھط¹ط§ظˆظ† ظ…ط¹ ط§ظ„ظپط±ظٹظ‚", "ط­ظ„ ط§ظ„ظ…ط´ظƒظ„ط§طھ ط§ظ„ظ…طھظƒط±ط±ط©", "ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ"]
          : job.includes("ط®ط¯ظ…ط© ط¹ظ…ظ„ط§ط،")
            ? ["ط¬ظˆط¯ط© ط§ظ„ط±ط¯ ط¹ظ„ظ‰ ط§ظ„ط¹ظ…ظ„ط§ط،", "ط³ط±ط¹ط© طھظ†ظپظٹط° ط§ظ„ط­ظˆط§ظ„ط§طھ", "ط¯ظ‚ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظٹظ„", "ظ…ط¹ط§ظ„ط¬ط© ط·ظ„ط¨ط§طھ ط§ظ„ظˆط§طھط³", "ظ†ط³ط¨ط© ط±ط¶ط§ ط§ظ„ط¹ظ…ظ„ط§ط،", "ط§ظ„ط§ظ„طھط²ط§ظ… ط¨ط¥ط¬ط±ط§ط،ط§طھ ط§ظ„ط§ظ…طھط«ط§ظ„", "ط®ظپط¶ ط§ظ„ط´ظƒط§ظˆظ‰", "ط§ظ„طھط¹ط§ظˆظ† ظ…ط¹ ط§ظ„ظپط±ظٹظ‚", "طھط­ظ…ظ„ ط¶ط؛ط· ط§ظ„ط¹ظ…ظ„", "ط§ظ„ط§ظ†ط¶ط¨ط§ط· ط§ظ„ظˆط¸ظٹظپظٹ"]
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
  if (activeEvaluationReport && String(title).includes("ظ…ظˆط¸ظپ")) {
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
          <h2 className="text-xl font-extrabold">ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط©</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            ظٹط±ط¬ظ‰ طھط­ط¯ظٹط« ط§ظ„طµظپط­ط© ط£ظˆ ط§ظ„طھظˆط§طµظ„ ظ…ط¹ ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ….
          </p>
          <button type="button" onClick={this.props.onBack} className="btn-primary mt-5">
            ط§ظ„ط¹ظˆط¯ط© ط¥ظ„ظ‰ ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…
          </button>
        </div>
      </div>
    );
  }
}
const isAdminLikeRole = (role = "") =>
  ["ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…", "ظ…ط¯ظٹط± ط¹ط§ظ… ط§ظ„ظ†ط¸ط§ظ…", "ط§ظ„ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ„ظٹط§"].some((x) => String(role).includes(x));
const isSystemAdministratorRole = (role = "") =>
  ["ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…", "ظ…ط¯ظٹط± ط¹ط§ظ… ط§ظ„ظ†ط¸ط§ظ…", "ظ…ط´ط±ظپ ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ط¹ط§ظ…"].includes(String(role || "").trim());
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
  employees_grid: ["employees_list", "employee_profile"],
  employee_effectiveness: ["employees_list", "employee_profile", "evaluations"],
  user_activity_logs: ["audit_logs", "user_activity"],
  reports: ["reports_center", "reports_financial"],
  reports_center: ["reports_center"],
  shifts: ["shift_types", "shift_assignments", "shift_conflicts"],
  daily_operations: ["daily_operations_entry", "daily_operations_approval", "daily_operations_reports"],
  performance_criteria: ["performance_criteria"],
  kpi_settings: ["kpi_settings"],
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
  const initialPortalType = isPlatformRoute() ? "platform" : "company";
  const restoredTenant = loadTenantSession(initialPortalType);
  const [logged, setLogged] = useState(
      () => Boolean(restoredTenant.currentUser),
    ),
    [page, setPage] = useState("dashboard"),
    [activeModuleKey, setActiveModuleKey] = useState("hr"),
    [sidebar, setSidebar] = useState(false),
    [role, setRole] = useState(
      () => restoredTenant.currentUser?.role || "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…",
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
    if (!logged || !page) return;
    const user = currentUserState || getCurrentUser() || {};
    const pageMeta = pageRegistryByKey[page] || ERP_PAGE_BY_KEY[page] || ERP_PAGE_BY_ROUTE[page] || {};
    const financialPage = ["hr_salary", "incentives", "hr_financial_setup"].includes(page);
    const timer = setTimeout(() => {
      activityLogsService.logUserActivity({
        company_id: currentCompany?.company_id || user.company_id,
        user_id: user.id || user.user_id,
        username: user.username,
        user_name: user.name,
        user_role: user.role,
        module_key: pageMeta.moduleKey || activeModuleKey,
        module_name: pageMeta.moduleLabel || "",
        page_key: page,
        page_name: pageMeta.label || page,
        action_type: financialPage ? "financial_view" : "navigation",
        action_label: financialPage ? "ط¹ط±ط¶ طµظپط­ط© ظ…ط§ظ„ظٹط©" : "طھظ†ظ‚ظ„ ط¨ظٹظ† ط§ظ„طµظپط­ط§طھ",
        description: `ظپطھط­ طµظپط­ط© ${pageMeta.label || page}`,
        severity: financialPage ? "ط­ط³ط§ط³" : "ظ…ظ†ط®ظپط¶",
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [logged, page, activeModuleKey, currentCompany?.company_id, currentUserState?.id, currentUserState?.user_id, currentUserState?.username]);
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
    const platformAdmin = isPlatformAdminUser(user);
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
  const employeePortalPaths = ["/employee-login", "/employee", "/employee/profile", "/employee/attendance", "/employee/requests", "/employee/requests/new", "/employee/notifications", "/employee/schedule"];
  if (employeePortalPaths.includes(window.location.pathname)) {
    return window.location.pathname === "/employee-login" ? <EmployeeLoginPage /> : <EmployeePortalApp />;
  }
  if (!logged)
    return (window.location.pathname === "/platform-login" || window.location.pathname === "/admin-platform-login") ? (
      <PlatformLogin
        onLogin={(user) => {
          const isPlatformLogin = isPlatformAdminUser(user);
          if (!isPlatformLogin) {
            clearTenantSession("platform");
            return;
          }
          const identityUser = user;
          setPlatformSession(identityUser);
          setCurrentCompany(null);
          setCurrentUserState(identityUser);
          setRole(user.role);
          localStorage.setItem("ep_role", user.role);
          localStorage.setItem("ep_employee_id", user.employeeId || "");
          localStorage.setItem("ep_logged", "1");
          activityLogsService.logUserActivity({
            company_id: user.company_id,
            user_id: user.id || user.user_id,
            username: user.username,
            user_name: user.name,
            user_role: user.role,
            module_key: "platform",
            module_name: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طµط©",
            page_key: "platform_login",
            page_name: "ط¯ط®ظˆظ„ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©",
            action_type: "login",
            action_label: "طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„ ظ†ط§ط¬ط­",
            description: "طھظ… طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط© ط¨ظ†ط¬ط§ط­",
            severity: "ظ…طھظˆط³ط·",
          });
          setLogged(true);
        }}
      />
    ) : (
      <Login
        settings={settings}
        onLogin={(user) => {
          const isPlatformLogin = isPlatformAdminUser(user);
          if (isPlatformLogin) {
            clearTenantSession("company");
            return;
          }
          const identityUser = user;
          const company = isPlatformLogin ? null : (getCurrentCompany() || {
            company_id: user.company_id,
            company_code: user.company_code,
            company_name: user.company_name,
            logo_url: user.logo_url,
            primary_color: user.primary_color,
          });
          setCompanySession(identityUser, company);
          setCurrentCompany(company);
          setCurrentUserState(identityUser);
          setRole(user.role);
          localStorage.setItem("ep_role", user.role);
          localStorage.setItem("ep_employee_id", user.employeeId || "");
          localStorage.setItem("ep_logged", "1");
          activityLogsService.logUserActivity({
            company_id: company?.company_id || user.company_id,
            user_id: user.id || user.user_id,
            username: user.username,
            user_name: user.name,
            user_role: user.role,
            module_key: "auth",
            module_name: "طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„",
            page_key: "login",
            page_name: "طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„",
            action_type: "login",
            action_label: "طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„ ظ†ط§ط¬ط­",
            description: "طھظ… طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط¥ظ„ظ‰ ط§ظ„ظ†ط¸ط§ظ… ط¨ظ†ط¬ط§ط­",
            severity: "ظ…طھظˆط³ط·",
          });
          setLogged(true);
        }}
      />
    );
  const activePortalType = isPlatformRoute() ? "platform" : "company";
  const sessionUserForGuard = currentUserState || getCurrentUser() || {};
  const sessionCompanyForGuard = currentCompany || getCurrentCompany() || null;
  const invalidPlatformSession = activePortalType === "platform" && !isPlatformAdminUser(sessionUserForGuard);
  const invalidCompanySession = activePortalType === "company"
    && (isPlatformAdminUser(sessionUserForGuard) || sessionCompanyForGuard?.company_code === "PLATFORM" || !sessionCompanyForGuard?.company_id);
  if (invalidPlatformSession || invalidCompanySession) {
    const portalToClear = activePortalType;
    setTimeout(() => {
      activityLogsService.logUserActivity({
        company_id: sessionCompanyForGuard?.company_id || sessionUserForGuard?.company_id,
        user_id: sessionUserForGuard?.id || sessionUserForGuard?.user_id,
        username: sessionUserForGuard?.username,
        user_name: sessionUserForGuard?.name,
        user_role: sessionUserForGuard?.role,
        module_key: activePortalType,
        module_name: activePortalType === "platform" ? "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طµط©" : "ط¨ظˆط§ط¨ط© ط§ظ„ط´ط±ظƒط©",
        action_type: "invalid_session_detected",
        action_label: "ط¬ظ„ط³ط© ط؛ظٹط± طµط§ظ„ط­ط©",
        description: "طھظ… ط§ظƒطھط´ط§ظپ ط®ظ„ط· ط¨ظٹظ† ط¬ظ„ط³ط© ط§ظ„ط´ط±ظƒط© ظˆط¬ظ„ط³ط© ط§ظ„ظ…ظ†طµط©",
        severity: "ظ…ط±طھظپط¹",
      }).catch(() => {});
      clearTenantSession(portalToClear);
      setCurrentCompany(null);
      setCurrentUserState(null);
      setLogged(false);
      if (portalToClear === "platform" && window.location.pathname !== "/platform-login") {
        window.location.href = "/platform-login";
      }
    }, 0);
    if (activePortalType === "company") {
      return (
        <div className="grid min-h-screen place-items-center bg-slate-50 p-5" dir="rtl">
          <div className="panel max-w-xl p-6 text-center">
            <ShieldCheck className="mx-auto mb-3 text-brand-700" />
            <h2 className="text-xl font-extrabold">ط§ظ†طھظ‡طھ ط¬ظ„ط³ط© ط§ظ„ط´ط±ظƒط©طŒ ظٹط±ط¬ظ‰ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰</h2>
          </div>
        </div>
      );
    }
    return <LoadingScreen message="ط¬ط§ط±ظٹ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط¬ظ„ط³ط© ط§ظ„ظ…ظ†طµط©..." />;
  }
  if (dataLoading) return <LoadingScreen />;
  if (dataError)
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-5" dir="rtl">
        <div className="panel max-w-xl p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 text-red-600" />
          <h2 className="text-xl font-extrabold">طھط¹ط°ط± طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ Supabase</h2>
          <p className="mt-2 text-sm text-slate-500">ط§ط·ظ„ط¨ ظ…ظ† ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ… ط±ط¨ط· ط§ظ„ط­ط³ط§ط¨ ط¨ط±ظ‚ظ… ط§ظ„ظ…ظˆط¸ظپ.</p>
          <button onClick={() => location.reload()} className="btn-primary mt-5">ط¥ط¹ط§ط¯ط© ط§ظ„ظ…ط­ط§ظˆظ„ط©</button>
        </div>
      </div>
    );
  if (window.location.pathname === "/employee-attendance") {
    return <EmployeeSelfAttendancePage employees={employees} currentUser={currentUserState || getCurrentUser()} currentCompany={currentCompany || getCurrentCompany()} />;
  }
  if (role === "ط§ظ„ظ…ظˆط¸ظپ")
    return (
      <EmployeePortal
        employees={employees}
        evaluations={evaluations}
        settings={settings}
        setSettings={setSettings}
        onLogout={() => {
          activityLogsService.logUserActivity({
            company_id: currentCompany?.company_id,
            action_type: "logout",
            action_label: "طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬",
            description: "طھظ… طھط³ط¬ظٹظ„ ط®ط±ظˆط¬ ط§ظ„ظ…ط³طھط®ط¯ظ…",
            severity: "ظ…ظ†ط®ظپط¶",
          });
          localStorage.removeItem("ep_logged");
          localStorage.removeItem("ep_role");
          localStorage.removeItem("ep_employee_id");
          clearTenantSession("company");
          setCurrentCompany(null);
          setCurrentUserState(null);
          setLogged(false);
        }}
      />
    );
	  const currentUser = currentUserState || getCurrentUser() || {},
      platformAdmin = isPlatformAdminUser(currentUser),
      isAdministrativeUser = platformAdmin || isSystemAdministratorRole(currentUser?.role) || isSystemAdministratorRole(role),
      hasSelectedCompany = Boolean(currentCompany?.company_id),
	    roleMatrix = settings.rolePermissions?.[role] || {},
	    hasRoleMatrix = Object.keys(roleMatrix).length > 0,
	    canNode = (nodeKey, action = "can_view") => hasTreePermission(treeRolePermissions, role, nodeKey, action),
      companyCanPage = (pageKey, action = "can_view") => {
        if (pageKey === "companies_admin" || pageKey === "platform_admin_settings") return platformAdmin;
        if (platformAdmin) return hasSelectedCompany;
        if (!hasSelectedCompany) return false;
        if (isAdministrativeUser && ["performance-monthly-targets", "performance-branch-targets", "performance-attendance-rules", "performance-incentive-exclusions", "performance-incentive-proposal", "performance-process-guide", "hr-attendance-records"].includes(pageKey)) return true;
        if (["employees_grid", "employee_effectiveness", "user_activity_logs"].includes(pageKey)
          && !companyCanPageFromRows(companyPermissions, "employees", "can_view")) return false;
        if (pageKey === "employee_effectiveness"
          && !companyCanPageFromRows(companyPermissions, "evaluations", "can_view")) return false;
        const pageAllowed = companyCanPageFromRows(companyPermissions, pageKey, action);
        if (pageKey !== "user_activity_logs") return pageAllowed;
        if (action === "can_view_sensitive" || action === "can_manage") return pageAllowed;
        if (!pageAllowed) return false;
        return companyCanPageFromRows(companyPermissions, pageKey, "can_view_sensitive")
          || companyCanPageFromRows(companyPermissions, pageKey, "can_manage");
      },
      companyCanModule = (moduleKey) =>
        platformAdmin ? hasSelectedCompany || moduleKey === "platform" : hasSelectedCompany && companyCanModuleFromRows(companyPermissions, moduleKey),
	    canPage = (pageKey, action = "can_view") => {
        if (platformAdmin) return companyCanPage(pageKey, action);
        if (!companyCanPage(pageKey, action)) return false;
        if (isAdministrativeUser) return true;
        return pageAllowedByTree(treeRolePermissions, role, pageKey, action) || canByPermission(appPermissions, role, pageKey, action);
      },
	    rawVisibleNavItems = safeNavigationItems(navItems).filter(([id]) => {
        if (platformAdmin) return hasSelectedCompany ? true : ["companies_admin", "platform_admin_settings"].includes(id);
        if (id === "companies_admin" || id === "platform_admin_settings") return false;
        if (!companyCanPage(id, "can_view")) return false;
        if (isAdministrativeUser) return true;
	      if (id === "dashboard") return hasAnyPermission(treeRolePermissions, role, dashboardPermissionNodes, "can_view");
	      if (treeRolePermissions.length) return pageAllowedByTree(treeRolePermissions, role, id, "can_view");
	      if (appPermissions.length) return canByPermission(appPermissions, role, id === "reports" ? "reports" : id, "can_view");
	      return hasRoleMatrix ? roleMatrix[id]?.view : isAdminLikeRole(role);
	    }),
      selectedModuleKey = ERP_MODULES.some((module) => module.key === activeModuleKey) ? activeModuleKey : getModuleForPage(page),
      selectedModule = ERP_MODULES.find((module) => module.key === selectedModuleKey) || ERP_MODULES[0],
      rawVisibleIds = new Set(rawVisibleNavItems.map(([id]) => id)),
      moduleVisibleNavItems = platformAdmin && !hasSelectedCompany
        ? rawVisibleNavItems
        : getModulePages(selectedModuleKey).filter((item) => {
            if (!platformAdmin && !companyCanPage(item.key, "can_view")) return false;
            if (isAdministrativeUser) return item.status !== "placeholder" || isAdminLikeRole(role) || platformAdmin;
            if (item.status === "placeholder") return isAdminLikeRole(role) || platformAdmin;
            return rawVisibleIds.has(item.routeKey) || rawVisibleIds.has(item.key);
          }).map((item) => [item.key, item.label, item.routeKey, item.status, item.moduleKey]),
      visibleNavItems = moduleVisibleNavItems.length ? moduleVisibleNavItems : rawVisibleNavItems,
      currentPageMeta = ERP_PAGE_BY_KEY[page] || null,
      pageIsPlaceholder = currentPageMeta?.status === "placeholder",
      requestedPageBlockedByCompany = !pageIsPlaceholder && page !== "companies_admin" && hasSelectedCompany && !companyCanPage(page, "can_view"),
      requestedPageBlockedByRole = !pageIsPlaceholder && page !== "companies_admin" && hasSelectedCompany && companyCanPage(page, "can_view") && !canPage(page, "can_view"),
	    firstAllowedPage = platformAdmin && !hasSelectedCompany ? "companies_admin" : ((visibleNavItems[0]?.[2] || visibleNavItems[0]?.[0]) || getFirstAllowedPageForUser({ ...currentUser, role }, treeRolePermissions, appPermissions, rawVisibleNavItems)),
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
    companyName = company.company_name || currentUser.company_name || (platformAdmin ? "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طµط©" : APP_BRAND_NAME),
    companyLogo = company.logo_url || currentUser.logo_url || "",
    userCardName = currentUser?.name || currentUser?.username || "ظ…ط³طھط®ط¯ظ…",
    userCardUsername = currentUser?.username || "ظ…ط³طھط®ط¯ظ…",
    userCardRole = currentUser?.role || "ط؛ظٹط± ظ…ط­ط¯ط¯",
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
        setCurrentUserState,
        currentCompany: company,
        companyPermissions,
        companyCanPage,
	      can: (pageKey, action = "can_view") => canPage(pageKey, action),
	      canNode,
	    };
  const handlePlatformCompanyChange = (companyId) => {
    if (!platformAdmin) return;
    const selected = companies.find((item) => item.company_id === companyId) || null;
    const identityUser = {
      ...currentUser,
      is_platform_admin: true,
    };
    setPlatformSession(identityUser, selected);
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
  if (permissionsLoading || companyPermissionsLoading) return <LoadingScreen message="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„طµظ„ط§ط­ظٹط§طھ..." />;
  if (!visibleNavItems.length) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 p-5" dir="rtl"><div className="panel max-w-xl p-6 text-center"><ShieldCheck className="mx-auto mb-3 text-brand-700" /><h2 className="text-xl font-extrabold">ظ„ط§ طھظˆط¬ط¯ طµظ„ط§ط­ظٹط§طھ ظ…ظپط¹ظ„ط© ظ„ظ‡ط°ط§ ط§ظ„ظ…ط³طھط®ط¯ظ…</h2><button onClick={() => { activityLogsService.logUserActivity({ company_id: currentCompany?.company_id, action_type: platformAdmin ? "platform_logout" : "company_logout", action_label: "طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬", description: "طھظ… طھط³ط¬ظٹظ„ ط®ط±ظˆط¬ ط§ظ„ظ…ط³طھط®ط¯ظ…", severity: "ظ…ظ†ط®ظپط¶" }); localStorage.removeItem("ep_logged"); localStorage.removeItem("ep_role"); clearTenantSession(platformAdmin ? "platform" : "company"); setCurrentCompany(null); setCurrentUserState(null); setLogged(false); }} className="btn-primary mt-5">طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬</button></div></div>;
  }
  const availableModulePages = (moduleKey) =>
    (moduleKey === "platform" && !platformAdmin) || !companyCanModule(moduleKey) ? [] : getModulePages(moduleKey).filter((item) => {
      if (!platformAdmin && !companyCanPage(item.key, "can_view")) return false;
      if (isAdministrativeUser) return item.status !== "placeholder" || isAdminLikeRole(role) || platformAdmin;
      return item.status === "placeholder"
        ? isAdminLikeRole(role) || platformAdmin
        : rawVisibleIds.has(item.routeKey) || rawVisibleIds.has(item.key);
    });
  const safeModules = platformAdmin && !hasSelectedCompany
    ? ERP_MODULES.filter((module) => module.key === "platform")
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
              activityLogsService.logUserActivity({
                company_id: currentCompany?.company_id,
                action_type: platformAdmin ? "platform_logout" : "company_logout",
                action_label: "طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬",
                description: "طھظ… طھط³ط¬ظٹظ„ ط®ط±ظˆط¬ ط§ظ„ظ…ط³طھط®ط¯ظ…",
                severity: "ظ…ظ†ط®ظپط¶",
              });
              localStorage.removeItem("ep_logged");
              localStorage.removeItem("ep_role");
              localStorage.removeItem("ep_employee_id");
              clearTenantSession(platformAdmin ? "platform" : "company");
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
            {platformAdmin && (
              <label className="flex max-w-[260px] items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-bold text-slate-600">
                <span>طھط؛ظٹظٹط± ط§ظ„ط´ط±ظƒط§طھ</span>
                <select
                  value={currentCompany?.company_id || ""}
                  onChange={(event) => handlePlatformCompanyChange(event.target.value)}
                  className="min-w-[170px] bg-transparent text-sm outline-none"
                >
                  <option value="">ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طµط© ظپظ‚ط·</option>
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
                placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..."
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
          {activePage === "platform_admin_settings" && <PlatformAdminSettingsPage {...p} />}{" "}
          {activePage === "dashboard" && <Dashboard {...p} />}{" "}
          {activePage === "employees" && <EnhancedEmployees {...p} />}{" "}
          {activePage === "employees_grid" && (
            <EmployeesGridPage
              {...p}
              EmployeeDetailsModal={EmployeeDetailsModal}
              EmployeeModal={EmployeeModal}
              onEmployeeSaved={(saved, previous) => activityLogsService.logUserActivity({
                company_id: company.company_id,
                user_id: currentUser.id || currentUser.user_id,
                username: currentUser.username,
                user_name: currentUser.name,
                user_role: currentUser.role,
                module_key: "hr",
                module_name: "ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©",
                page_key: "employees_grid",
                page_name: "ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط¸ظپظٹظ† ط´ط¨ظƒظٹ",
                action_type: previous ? "update" : "create",
                action_label: previous ? "طھط¹ط¯ظٹظ„ ظ…ظˆط¸ظپ" : "ط¥ط¶ط§ظپط© ظ…ظˆط¸ظپ",
                description: `${previous ? "طھظ… طھط¹ط¯ظٹظ„" : "طھظ…طھ ط¥ط¶ط§ظپط©"} ط³ط¬ظ„ ط§ظ„ظ…ظˆط¸ظپ ${saved?.name || saved?.id || ""}`,
                entity_type: "employee",
                entity_id: saved?.id,
                severity: "ظ…طھظˆط³ط·",
              })}
            />
          )}{" "}
          {activePage === "employee_effectiveness" && <EmployeeEffectivenessPage {...p} EmployeeDetailsModal={EmployeeDetailsModal} />}{" "}
          {activePage === "user_activity_logs" && <UserActivityLogsPage {...p} />}{" "}
          {activePage === "templates" && <EnhancedTemplates {...p} />}{" "}
          {activePage === "evaluations" && <EnhancedEvaluations {...p} />}{" "}
          {activePage === "productivity" && <EnhancedProductivity {...p} />}{" "}
          {activePage === "discipline" && <EnhancedDiscipline {...p} />}{" "}
          {activePage === "incentives" && <EnhancedIncentives {...p} />}{" "}
	          {activePage === "top" && <EnhancedTopEmployees {...p} />}{" "}
	          {activePage === "plans" && <EnhancedPlans {...p} />}{" "}
	          {activePage === "guarantees" && <EmployeeGuaranteesPage {...p} />}{" "}
	          {activePage === "overtime" && <OvertimePage {...p} />}{" "}
	          {activePage === "overtime_import_export" && <OvertimeImportExportPage {...p} />}{" "}
	          {activePage === "shifts" && <EmployeeShiftsPage {...p} />}{" "}
	          {activePage === "inventory" && <InventoryManagementPage {...p} />}{" "}
	          {activePage === "inventory_items_import_export" && <InventoryItemsImportExportPage {...p} />}{" "}
	          {activePage === "daily_operations" && <DailyOperationsPageEnhanced {...p} />}{" "}
	          {activePage === "daily_operations_reports" && <DailyOperationsReportsPage {...p} />}{" "}
	          {activePage === "assets_import_export" && <FixedAssetsImportExportPage {...p} />}{" "}
	          {activePage === "assets_depreciation_tools" && <AssetDepreciationPage {...p} />}{" "}
	          {activePage?.startsWith("assets_") && !["assets_import_export", "assets_depreciation_tools"].includes(activePage) && <FixedAssetsModule {...p} activePage={activePage} />}{" "}
	          {attendancePageKeys.has(activePage) && activePage !== "attendance_records" && <AttendanceCalculationPage {...p} pageKey={activePage} />}{" "}
	          {activePage === "performance_criteria" && <PerformanceCriteriaPageEnhanced {...p} />}{" "}
	          {activePage === "performance_kpi_scores" && <KpiScoresDashboardPage {...p} />}{" "}
          {activePage === "kpi_settings" && <KpiSettingsPage {...p} />}{" "}
          {activePage === "performance-monthly-targets" && <MonthlyEmployeeTargetsPage {...p} />}
          {activePage === "performance-branch-targets" && <BranchTargetsPage {...p} />}
          {activePage === "performance-attendance-rules" && <AttendanceKpiRulesPage {...p} />}
          {activePage === "performance-incentive-exclusions" && <IncentiveExclusionsPage {...p} />}
          {activePage === "performance-incentive-proposal" && <IncentiveProposalPage {...p} />}
          {activePage === "performance-process-guide" && <PerformanceProcessGuidePage {...p} />}
          {activePage === "hr-attendance-records" && <AttendanceRecordsPage {...p} />}{" "}
	          {activePage === "users_permissions" && <UsersPermissionsPage {...p} />}{" "}
	          {activePage === "recruitment" && <RecruitmentPage {...p} />}{" "}
	          {activePage === "reports_center" && <EnterpriseReportsCenter {...p} />}{" "}
	          {activePage === "audit_logs" && <AuditLogsPage {...p} />}{" "}
	          {activePage === "reports" && <EnhancedReports {...p} />}{" "}
	          {activePage === "settings" && <SettingsPage {...p} />}
          {activePage === "system_settings" && <SystemSettingsPage {...p} />}
          {activePage === "hr_home" && <HRExecutiveDashboard {...p} />}
          {activePage === "employee_app_settings" && <EmployeeAppAdminSettingsPage {...p} />}
          {["hr_org_chart", "hr_settings"].includes(activePage) && <HRFoundationPage {...p} pageKey={activePage} />}
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
        <h2 className="text-xl font-extrabold">ظ‡ط°ظ‡ ط§ظ„طµظپط­ط© ط؛ظٹط± ظ…ظپط¹ظ„ط© ط¶ظ…ظ† طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط©</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          ظٹظ…ظƒظ† ظ„ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط© طھظپط¹ظٹظ„ ظ‡ط°ظ‡ ط§ظ„ظˆط­ط¯ط© ظ…ظ† ط¥ط¯ط§ط±ط© ط§ظ„ط´ط±ظƒط§طھ â†گ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط§طھ.
        </p>
        <button type="button" onClick={onBack} className="btn-primary mt-5">
          ط§ظ„ط¹ظˆط¯ط© ط¥ظ„ظ‰ طµظپط­ط© ظ…ط³ظ…ظˆط­ط©
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
        <span className="rounded-full bg-brand-50 px-4 py-1 text-xs font-extrabold text-brand-700">{moduleMeta.label || "ظˆط­ط¯ط© ERP"}</span>
        <h2 className="mt-4 text-2xl font-black">{pageMeta.label || "ظˆط­ط¯ط© ERP"}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
          ظ‡ط°ظ‡ ط§ظ„ظˆط­ط¯ط© ظ‚ظٹط¯ ط§ظ„طھط¬ظ‡ظٹط² ط¶ظ…ظ† ظ…ظ†طµط© {APP_SHORT_NAME}. طھظ… ظˆط¶ط¹ظ‡ط§ ظپظٹ ط§ظ„ظ‡ظٹظƒظ„ ط§ظ„ط¹ط§ظ… ظ„ظ„ظ†ط¸ط§ظ… ط¨ط¯ظˆظ† ط­ط°ظپ ط£ظˆ طھط¹ط·ظٹظ„ ط£ظٹ طµظپط­ط© ظ…ظˆط¬ظˆط¯ط©.
        </p>
        <button type="button" onClick={onBack} className="btn-primary mt-6">
          ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط±ط¦ظٹط³ظٹط©
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
        <h2 className="text-xl font-extrabold">ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط§ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ظ‡ط°ظ‡ ط§ظ„طµظپط­ط©</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          ط§ظ„طµظپط­ط© ظ…ظپط¹ظ„ط© ظ„ظ„ط´ط±ظƒط©طŒ ظ„ظƒظ† ط¯ظˆط± ط§ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ط­ط§ظ„ظٹ ظ„ط§ ظٹظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط§ظ„ط¹ط±ط¶.
        </p>
        <button type="button" onClick={onBack} className="btn-primary mt-5">
          ط§ظ„ط¹ظˆط¯ط© ط¥ظ„ظ‰ طµظپط­ط© ظ…ط³ظ…ظˆط­ط©
        </button>
      </div>
    </div>
  );
}
function Login({ onLogin }) {
  const [companyCode, setCompanyCode] = useState("PUREMONEY"),
    [u, setU] = useState(""),
    [pw, setPw] = useState(""),
    [err, setErr] = useState(""),
    [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!companyCode.trim()) return setErr("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ظƒظˆط¯ ط§ظ„ط´ط±ظƒط©");
    if (!u.trim() || !pw.trim()) return setErr("ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ظˆظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±.");
    setLoading(true);
    try {
      const user = await cloudLoginWithSupabase(
        u.trim(),
        pw.trim(),
        "",
        companyCode.trim(),
      );
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
          <div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10"><Banknote /></div><div><b>{APP_SHORT_NAME}</b><p className="text-xs text-red-100/70">{APP_OFFICIAL_NAME}</p></div></div>
          <div><div className="mb-5 h-1 w-12 bg-white/30" /><h2 className="text-4xl font-extrabold leading-[1.35]">ظ†ط­ظˆ ط«ظ‚ط§ظپط© ط£ط¯ط§ط،<br />طھظƒط§ظپط¦ ط§ظ„طھظ…ظٹط²</h2><p className="mt-5 leading-7 text-red-100/75">{APP_DESCRIPTION}</p></div>
          <div className="flex gap-2 text-xs text-red-100/60"><ShieldCheck size={17} /> ط¨ظٹط§ظ†ط§طھظƒ ظ…ط­ظپظˆط¸ط© ظˆط¢ظ…ظ†ط© ط¯ط§ط®ظ„ ط§ظ„ظ…طھطµظپط­</div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 sm:p-14">
          <span className="text-sm font-bold text-brand-700">{APP_SHORT_NAME}</span>
          <h1 className="mt-2 text-3xl font-extrabold">طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„</h1>
          <p className="mt-2 text-sm text-slate-500">{APP_SYSTEM_NAME} - {APP_TAGLINE}</p>
          <div className="mt-8 space-y-5">
            <Label t="ظƒظˆط¯ ط§ظ„ط´ط±ظƒط© ط£ظˆ ط§ط³ظ… ط§ظ„ط´ط±ظƒط©"><input value={companyCode} onChange={(e) => setCompanyCode(e.target.value.toUpperCase())} autoComplete="organization" placeholder="PUREMONEY" className="field mt-2" /></Label>
            <Label t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ط£ظˆ ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط¸ظٹظپظٹ"><input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" placeholder="admin ط£ظˆ EMP-001" className="field mt-2" /></Label>
            <Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" placeholder="ط£ط¯ط®ظ„ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±" className="field mt-2" /></Label>
          </div>
          {err && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          <button disabled={loading} className="btn-primary mt-7 h-12 w-full disabled:cursor-not-allowed disabled:opacity-60">{loading ? "ط¬ط§ط±ظٹ ط§ظ„طھط­ظ‚ظ‚..." : "ط¯ط®ظˆظ„ ط¥ظ„ظ‰ ط§ظ„ظ†ط¸ط§ظ…"} <ArrowUpLeft size={18} /></button>
        </form>
      </div>
    </div>
  );
}

const uiOnlyMessage = "طھظ… طھط¬ظ‡ظٹط² ط§ظ„ط¹ظ…ظ„ظٹط© ظپظٹ ط§ظ„ظˆط§ط¬ظ‡ط©طŒ ظˆط³ظٹطھظ… ط±ط¨ط·ظ‡ط§ ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ„ط§ط­ظ‚ظ‹ط§.";

function PlatformAdminSettingsPage({ currentUser, currentCompany, setCurrentUserState }) {
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const platformAdmin = isPlatformAdminUser(currentUser);
  if (!platformAdmin) return <RolePageDisabled onBack={() => {}} />;
  const emailMissing = !String(form.email || "").trim();
  const save = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setMessage("ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ط؛ظٹط± طµط­ظٹط­");
      return;
    }
    if ((form.newPassword || form.confirmPassword || form.currentPassword) && form.newPassword.length < 8) {
      setMessage("ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط¬ط¯ظٹط¯ط© ظٹط¬ط¨ ط£ظ„ط§ طھظ‚ظ„ ط¹ظ† 8 ط£ط­ط±ظپ");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setMessage("طھط£ظƒظٹط¯ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± ظ…ط·ط§ط¨ظ‚");
      return;
    }
    try {
      setSaving(true);
      const result = await adminService.updatePlatformAdminAccount(currentUser, form);
      const session = setPlatformSession(result.user, currentCompany?.company_id ? currentCompany : null);
      const nextUser = session.currentUser || result.user;
      setCurrentUserState?.(nextUser);
      activityLogsService.logUserActivity({
        company_id: currentCompany?.company_id || nextUser.company_id,
        user_id: nextUser.id || nextUser.user_id,
        username: nextUser.username,
        user_name: nextUser.name,
        user_role: nextUser.role,
        module_key: "platform",
        module_name: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طµط©",
        page_key: "platform_admin_settings",
        page_name: "ط¥ط¹ط¯ط§ط¯ط§طھ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©",
        action_type: "platform_setting_update",
        action_label: "طھط­ط¯ظٹط« ط¥ط¹ط¯ط§ط¯ط§طھ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©",
        description: result.passwordChanged ? "طھظ… طھط­ط¯ظٹط« ظ…ظ„ظپ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط© ظˆطھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±" : "طھظ… طھط­ط¯ظٹط« ظ…ظ„ظپ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©",
        entity_type: "platform_admin",
        entity_id: nextUser.id || nextUser.user_id,
        severity: result.passwordChanged ? "ط­ط³ط§ط³" : "ظ…ط±طھظپط¹",
      });
      setForm({
        name: nextUser.name || "",
        username: nextUser.username || "",
        email: nextUser.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage(result.passwordChanged
        ? "طھظ… طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط© ط¨ظ†ط¬ط§ط­\nطھظ… طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط¨ظ†ط¬ط§ط­"
        : "طھظ… طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط© ط¨ظ†ط¬ط§ط­");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-5">
      <PageHead title="ط¥ط¹ط¯ط§ط¯ط§طھ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©" desc="Platform Admin Settings" />
      {emailMissing && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          ظٹط±ط¬ظ‰ ط±ط¨ط· ط­ط³ط§ط¨ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط© ط¨ط¨ط±ظٹط¯ ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظ„ط­ظ…ط§ظٹط© ط§ظ„ط­ط³ط§ط¨.
        </div>
      )}
      <div className="panel p-5">
        <div className="grid gap-4 md:grid-cols-5">
          <Info t="ط§ظ„ط§ط³ظ…" v={currentUser?.name || "-"} />
          <Info t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…" v={currentUser?.username || "-"} />
          <Info t="ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ" v={currentUser?.email || "-"} />
          <Info t="ط§ظ„ط¯ظˆط±" v={currentUser?.role || "-"} />
          <Info t="ط§ظ„ط­ط§ظ„ط©" v={currentUser?.is_active === false ? "ظ…ط¹ط·ظ„" : "ظ†ط´ط·"} />
        </div>
      </div>
      <form onSubmit={save} className="panel space-y-5 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Label t="ط§ط³ظ… ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field mt-2" /></Label>
          <Label t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…"><input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="field mt-2" /></Label>
          <Label t="ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field mt-2" /></Label>
          <Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط­ط§ظ„ظٹط©"><input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="field mt-2" /></Label>
          <Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط¬ط¯ظٹط¯ط©"><input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="field mt-2" /></Label>
          <Label t="طھط£ظƒظٹط¯ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط¬ط¯ظٹط¯ط©"><input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="field mt-2" /></Label>
        </div>
        {/* Future: implement email verification and secure password reset via Supabase Auth or Edge Function. */}
        <p className="text-xs text-slate-500">ط³ظٹطھظ… ط±ط¨ط· ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¨ط±ظٹط¯ ظˆط§ط³طھط¹ط§ط¯ط© ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط¨ظ…ط²ظˆط¯ ط­ظ‚ظٹظ‚ظٹ ظ„ط§ط­ظ‚ظ‹ط§.</p>
        {message && <div className="whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700">{message}</div>}
        <button disabled={saving} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"><Save size={17} /> {saving ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : "ط­ظپط¸ ط¥ط¹ط¯ط§ط¯ط§طھ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©"}</button>
      </form>
    </div>
  );
}

const hrModuleTabs = {
  hr_home: ["ظ†ط¸ط±ط© ط¹ط§ظ…ط©", "ط·ظ„ط¨ط§طھ ظ‚ظٹط¯ ط§ظ„ظ…ظˆط§ظپظ‚ط©", "ط¥ط¬ط§ط²ط§طھ ط§ظ„ط´ظ‡ط±", "ط¥ظ†ط°ط§ط±ط§طھ ط§ظ„ط´ظ‡ط±", "ظˆط¸ط§ط¦ظپ ط´ط§ط؛ط±ط©"],
  hr_employees_full: ["ط¬ظ…ظٹط¹ ط§ظ„ظ…ظˆط¸ظپظٹظ†", "ط§ظ„ظ…ظˆط¸ظپظˆظ† ط§ظ„ظ†ط´ط·ظˆظ†", "طھط­طھ ط§ظ„طھط¬ط±ط¨ط©", "ط§ظ„ظ…ظˆظ‚ظˆظپظˆظ†", "ط§ظ„ظ…ظ†طھظ‡ظٹط© ط®ط¯ظ…ط§طھظ‡ظ…", "ظ…ظ„ظپط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†", "ط¹ظ‚ظˆط¯ ط§ظ„ظ…ظˆط¸ظپظٹظ†", "ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ‡ط¯"],
  hr_reports_full: ["طھظ‚ط§ط±ظٹط± ط§ظ„ظ…ظˆط¸ظپظٹظ†", "طھظ‚ط§ط±ظٹط± ط§ظ„ط­ط¶ظˆط±", "طھظ‚ط§ط±ظٹط± ط§ظ„ط±ظˆط§طھط¨", "طھظ‚ط§ط±ظٹط± ط§ظ„ط£ط¯ط§ط،", "طھظ‚ط§ط±ظٹط± ط§ظ„ط¥ط¬ط§ط²ط§طھ", "طھظ‚ط§ط±ظٹط± ط§ظ„طھظˆط¸ظٹظپ", "طھظ‚ط§ط±ظٹط± ط§ظ„ظ…ط®ط§ظ„ظپط§طھ", "طھظ‚ط§ط±ظٹط± ط§ظ„ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ„ظٹط§"],
  hr_requests: ["ط·ظ„ط¨ ط¥ط¬ط§ط²ط©", "ط·ظ„ط¨ ط³ظ„ظپط©", "ط·ظ„ط¨ طھط¹ط±ظٹظپ ط±ط§طھط¨", "ط·ظ„ط¨ طھط¹ط¯ظٹظ„ ط¨ظٹط§ظ†ط§طھ", "ط·ظ„ط¨ ط¹ظ‡ط¯ط©", "ط·ظ„ط¨ ط¹ظ…ظ„ ط¥ط¶ط§ظپظٹ", "ط·ظ„ط¨ ظ†ظ‚ظ„", "ط·ظ„ط¨ ط§ط³طھظ‚ط§ظ„ط©", "ظƒظ„ ط§ظ„ط·ظ„ط¨ط§طھ"],
  hr_performance_full: ["ظ…ط¹ط§ظٹظٹط± ط§ظ„ط£ط¯ط§ط،", "ظ†ظ…ط§ط°ط¬ طھظ‚ظٹظٹظ… ط§ظ„ظˆط¸ط§ط¦ظپ", "طھظ‚ظٹظٹظ… ط§ظ„ظ…ظˆط¸ظپظٹظ†", "ط¯ط±ط¬ط§طھ KPI", "ط§ط¹طھط±ط§ط¶ط§طھ ط§ظ„طھظ‚ظٹظٹظ…", "ط®ط·ط· طھط­ط³ظٹظ† ط§ظ„ط£ط¯ط§ط،", "طھظ‚ط§ط±ظٹط± ط§ظ„ط£ط¯ط§ط،"],
  hr_incentives_full: ["ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط­ظˆط§ظپط²", "ط´ط±ط§ط¦ط­ ط§ظ„ط­ظˆط§ظپط²", "ط§ط­طھط³ط§ط¨ ط§ظ„ط­ظˆط§ظپط²", "ط§ط¹طھظ…ط§ط¯ ط§ظ„ط­ظˆط§ظپط²", "طµط±ظپ ط§ظ„ط­ظˆط§ظپط²", "طھظ‚ط§ط±ظٹط± ط§ظ„ط­ظˆط§ظپط²"],
  hr_attendance_payroll: ["ط³ط¬ظ„ط§طھ ط§ظ„ط¯ظˆط§ظ…", "ط§ظ„طھط£ط®ظٹط±", "ط§ظ„ط؛ظٹط§ط¨", "ط§ظ„ط§ظ†طµط±ط§ظپ ط§ظ„ظ…ط¨ظƒط±", "ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", "ظ…ظ„ط®طµ ط§ظ„ط¯ظˆط§ظ…", "طھظ‚ط§ط±ظٹط± ط§ظ„ط¯ظˆط§ظ…"],
  hr_salary: ["ط¥ط¹ط¯ط§ط¯ ط§ظ„ط±ط§طھط¨", "ط§ظ„ط¨ط¯ظ„ط§طھ", "ط§ظ„ط®طµظˆظ…ط§طھ", "ط§ظ„ط³ظ„ظپ", "ط§ظ„ط¥ط¶ط§ظپظٹ", "طµط§ظپظٹ ط§ظ„ط±ط§طھط¨", "ظƒط´ظپ ط§ظ„ط±ظˆط§طھط¨", "طھظ‚ط§ط±ظٹط± ط§ظ„ط±ظˆط§طھط¨"],
  hr_disciplinary: ["ط§ظ„ظ…ط³ط§ط،ظ„ط§طھ", "ط§ظ„ط¥ظ†ط°ط§ط±ط§طھ", "ظ„ظپطھ ط§ظ„ظ†ط¸ط±", "ط§ظ„طھط­ظ‚ظٹظ‚ط§طھ", "ط§ظ„ط¬ط²ط§ط،ط§طھ", "ط³ط¬ظ„ ط§ظ„ظ…ط®ط§ظ„ظپط§طھ", "طھظ‚ط§ط±ظٹط± ط§ظ„ظ…ط®ط§ظ„ظپط§طھ"],
  hr_recruitment_full: ["ظ‚ط§ط¦ظ…ط© ط§ظ„ظˆط¸ط§ط¦ظپ", "ط·ظ„ط¨ط§طھ ط§ظ„طھظˆط¸ظٹظپ", "طھظ‚ظٹظٹظ… ط§ظ„ظ…ط±ط´ط­ظٹظ†", "ط®ط·ط§ط¨ط§طھ ط¹ط±ط¶ ط§ظ„ط¹ظ…ظ„", "ط¹ط±ظˆط¶ ط§ظ„ط¹ظ…ظ„", "ط¹ظ‚ظˆط¯ ط§ظ„ط¹ظ…ظ„", "ط®ط·ط© ط§ظ„ط§ط­طھظٹط§ط¬ط§طھ ط§ظ„ظˆط¸ظٹظپظٹط©", "ط§ط®طھط¨ط§ط±ط§طھ ط§ظ„طھظˆط¸ظٹظپ", "ط§ظ„ظ…ظˆط¸ظپظˆظ† طھط­طھ ط§ظ„طھط¬ط±ط¨ط©", "ط±ط³ط§ط¦ظ„ ط§ظ„طھط±ط­ظٹط¨", "طھظ‚ط§ط±ظٹط± ط§ظ„طھظˆط¸ظٹظپ"],
  hr_leaves: ["ط·ظ„ط¨ط§طھ ط§ظ„ط¥ط¬ط§ط²ط§طھ", "ط£ط±طµط¯ط© ط§ظ„ط¥ط¬ط§ط²ط§طھ", "ط§ظ„ط¥ط¬ط§ط²ط§طھ ط§ظ„ط³ظ†ظˆظٹط©", "ط§ظ„ظ…ط±ط¶ظٹط©", "ط¨ط¯ظˆظ† ط±ط§طھط¨", "ط¥ط¬ط§ط²ط§طھ ط·ط§ط±ط¦ط©", "طھظ‚ط§ط±ظٹط± ط§ظ„ط¥ط¬ط§ط²ط§طھ"],
  hr_complaints: ["ط´ظƒط§ظˆظ‰ ط§ظ„ظ…ظˆط¸ظپظٹظ†", "ط´ظƒط§ظˆظ‰ ط§ظ„ط¹ظ…ظ„ط§ط،", "ط´ظƒط§ظˆظ‰ ط§ظ„ظپط±ظˆط¹", "ظ‚ظٹط¯ ط§ظ„ظ…ط¹ط§ظ„ط¬ط©", "ظ…ط؛ظ„ظ‚ط©", "طھظ‚ط§ط±ظٹط± ط§ظ„ط´ظƒط§ظˆظ‰"],
  hr_circulars: ["ظƒظ„ ط§ظ„طھط¹ط§ظ…ظٹظ…", "طھط¹ط§ظ…ظٹظ… ط¥ط¯ط§ط±ظٹط©", "طھط¹ط§ظ…ظٹظ… ط¯ظˆط§ظ…", "طھط¹ط§ظ…ظٹظ… ظ…ظˆط§ط±ط¯ ط¨ط´ط±ظٹط©", "طھط¹ط§ظ…ظٹظ… ط§ظ…طھط«ط§ظ„", "طھط¹ط§ظ…ظٹظ… ظپط±ظˆط¹", "ط£ط±ط´ظٹظپ ط§ظ„طھط¹ط§ظ…ظٹظ…"],
  hr_termination: ["ط·ظ„ط¨ط§طھ ط§ظ„ط§ط³طھظ‚ط§ظ„ط©", "ط¥ظ†ظ‡ط§ط، ط§ظ„طھط¬ط±ط¨ط©", "ط¥ظ†ظ‡ط§ط، ط§ظ„ط¹ظ‚ط¯", "ط§ظ„ظ…ط®ط§ظ„طµط§طھ", "طھط³ظ„ظٹظ… ط§ظ„ط¹ظ‡ط¯", "ط­ط³ط§ط¨ ظ…ط³طھط­ظ‚ط§طھ ظ†ظ‡ط§ظٹط© ط§ظ„ط®ط¯ظ…ط©", "طھظ‚ط§ط±ظٹط± ط¥ظ†ظ‡ط§ط، ط§ظ„ط®ط¯ظ…ط©"],
  hr_surveys: ["ط¥ظ†ط´ط§ط، ط§ط³طھط¨ظٹط§ظ†", "ط§ط³طھط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†", "ط§ط³طھط¨ظٹط§ظ†ط§طھ ط±ط¶ط§ ط§ظ„ط¹ظ…ظ„ط§ط،", "ظ†طھط§ط¦ط¬ ط§ظ„ط§ط³طھط¨ظٹط§ظ†ط§طھ", "طھط­ظ„ظٹظ„ ط§ظ„ظ†طھط§ط¦ط¬", "طھظ‚ط§ط±ظٹط± ط§ظ„ط§ط³طھط¨ظٹط§ظ†ط§طھ"],
  hr_insurance: ["ط¨ظٹط§ظ†ط§طھ ط§ظ„طھط£ظ…ظٹظ†", "ط§ط´طھط±ط§ظƒط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†", "ظˆط«ط§ط¦ظ‚ ط§ظ„طھط£ظ…ظٹظ†", "ظ…ط·ط§ظ„ط¨ط§طھ ط§ظ„طھط£ظ…ظٹظ†", "طھظ‚ط§ط±ظٹط± ط§ظ„طھط£ظ…ظٹظ†"],
  hr_announcements: ["ط¥ط¹ظ„ط§ظ†ط§طھ ط¯ط§ط®ظ„ظٹط©", "ط¥ط¹ظ„ط§ظ†ط§طھ ط§ظ„ظˆط¸ط§ط¦ظپ", "ط¥ط¹ظ„ط§ظ†ط§طھ ط§ظ„ظپط±ظˆط¹", "ط§ظ„ط¥ط¹ظ„ط§ظ†ط§طھ ط§ظ„ظ†ط´ط·ط©", "ط£ط±ط´ظٹظپ ط§ظ„ط¥ط¹ظ„ط§ظ†ط§طھ"],
  hr_files: ["ظ…ظ„ظپط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†", "ظ…ظ„ظپط§طھ ط§ظ„ط¹ظ‚ظˆط¯", "ظ…ظ„ظپط§طھ ط§ظ„طھط¹ط§ظ…ظٹظ…", "ظ…ظ„ظپط§طھ ط§ظ„طھظˆط¸ظٹظپ", "ظ…ظ„ظپط§طھ ط§ظ„ظ…ط®ط²ظˆظ†", "ط§ظ„ط£ط±ط´ظٹظپ", "ط§ظ„ط¨ط­ط« ظپظٹ ط§ظ„ظ…ظ„ظپط§طھ"],
  hr_training: ["ط®ط·ط© ط§ظ„طھط¯ط±ظٹط¨", "ط§ظ„ط¨ط±ط§ظ…ط¬ ط§ظ„طھط¯ط±ظٹط¨ظٹط©", "ط§ظ„ظ…طھط¯ط±ط¨ظˆظ†", "طھظ‚ظٹظٹظ… ط§ظ„طھط¯ط±ظٹط¨", "ط´ظ‡ط§ط¯ط§طھ ط§ظ„طھط¯ط±ظٹط¨", "طھظ‚ط§ط±ظٹط± ط§ظ„طھط¯ط±ظٹط¨"],
  hr_approvals: ["ظ…ظˆط§ظپظ‚ط§طھ ط§ظ„ط¥ط¬ط§ط²ط§طھ", "ظ…ظˆط§ظپظ‚ط§طھ ط§ظ„ط­ظˆط§ظپط²", "ظ…ظˆط§ظپظ‚ط§طھ ط§ظ„طھظˆط¸ظٹظپ", "ظ…ظˆط§ظپظ‚ط§طھ ط§ظ„ظ…ط®ط²ظˆظ†", "ظ…ظˆط§ظپظ‚ط§طھ ط§ظ„ط¯ظˆط§ظ…", "ظƒظ„ ط§ظ„ظ…ظˆط§ظپظ‚ط§طھ"],
  hr_org_chart: ["ط§ظ„ظ‡ظٹظƒظ„ ط§ظ„ط¹ط§ظ…", "ط§ظ„ط¥ط¯ط§ط±ط§طھ", "ط§ظ„ظپط±ظˆط¹", "ط§ظ„ظˆط¸ط§ط¦ظپ", "ط®ط·ظˆط· ط§ظ„ط¥ط´ط±ط§ظپ", "ط¨ط·ط§ظ‚ط§طھ ط§ظ„ظˆط¸ط§ط¦ظپ"],
  hr_settings_full: ["ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظپط±ظˆط¹", "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¹ظ…ظ„ط§طھ", "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظˆط¸ط§ط¦ظپ", "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط£ظ‚ط³ط§ظ…", "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط­ط¶ظˆط±", "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„طھظ‚ظٹظٹظ…", "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط­ظˆط§ظپط²", "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ†ط¸ط§ظ…"],
  hr_financial_setup: ["ط§ظ„ط¹ظ…ظ„ط§طھ", "ط§ظ„ط±ظˆط§طھط¨", "ط§ظ„ط¨ط¯ظ„ط§طھ", "ط§ظ„ط®طµظˆظ…ط§طھ", "ط§ظ„ط³ظ„ظپ", "ط§ظ„طھط£ظ…ظٹظ†ط§طھ", "ظ…ط±ط§ظƒط² ط§ظ„طھظƒظ„ظپط©", "ط§ظ„ط­ط³ط§ط¨ط§طھ ط§ظ„ظ…ط§ظ„ظٹط©"],
  hr_templates_full: ["ظ‚ظˆط§ظ„ط¨ ط§ظ„ط¹ظ‚ظˆط¯", "ظ‚ظˆط§ظ„ط¨ ط¹ط±ظˆط¶ ط§ظ„ط¹ظ…ظ„", "ظ‚ظˆط§ظ„ط¨ ط§ظ„طھط¹ط§ظ…ظٹظ…", "ظ‚ظˆط§ظ„ط¨ ط§ظ„ط¥ظ†ط°ط§ط±ط§طھ", "ظ‚ظˆط§ظ„ط¨ ط®ط·ط§ط¨ط§طھ ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©", "ظ‚ظˆط§ظ„ط¨ ط§ظ„طھظ‚ط§ط±ظٹط±", "ظ‚ظˆط§ظ„ط¨ ط±ط³ط§ط¦ظ„ ظˆط§طھط³ط§ط¨"],
};

function HRModulePage({ pageKey, currentCompany, can }) {
  const title = fullHrNavItems.find(([id]) => id === pageKey)?.[1] || "ظˆط­ط¯ط© ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©";
  const config = hrRecordsService.config(pageKey);
  const tabs = config.tabs || hrModuleTabs[pageKey] || ["ظ†ط¸ط±ط© ط¹ط§ظ…ط©"];
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
      setError("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
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
      setError(err.message || "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ");
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
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط³ط¬ظ„ط§طھ", safeRows.length],
    ["ط§ظ„ظ†ط´ط·ط©", safeRows.filter((r) => ["ظ†ط´ط·", "ظ…ط¹طھظ…ط¯ط©", "ظ…ط¹طھظ…ط¯", "ط­ط§ط¶ط±"].includes(r.status)).length],
    ["ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©", safeRows.filter((r) => String(r.status || "").includes("ظ…ط±ط§ط¬ط¹ط©") || String(r.status || "").includes("ظ…ط³ظˆط¯ط©")).length],
    ["ط§ظ„ط´ط±ظƒط©", currentCompany?.company_name || APP_BRAND_NAME],
  ];
  const openAdd = () => {
    if (!canCreate) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ظ‡ ط§ظ„ط¹ظ…ظ„ظٹط©");
    const blank = Object.fromEntries(fields.map(([key, , type]) => [key, type === "number" ? 0 : key === "status" ? "ظ†ط´ط·" : ""]));
    setDialog({ ...blank, status: blank.status || "ظ†ط´ط·" });
  };
  const save = async (event) => {
    event.preventDefault();
    if (!canEdit && dialog?.id) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ظ‡ ط§ظ„ط¹ظ…ظ„ظٹط©");
    if (!canCreate && !dialog?.id) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ظ‡ ط§ظ„ط¹ظ…ظ„ظٹط©");
    try {
      const saved = await hrRecordsService.save(pageKey, currentCompanyId, dialog);
      setRows((list) => list.some((row) => row.id === saved.id) ? list.map((row) => row.id === saved.id ? saved : row) : [saved, ...list]);
      setDialog(null);
      alert("طھظ… ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ظ†ط¬ط§ط­");
    } catch (err) {
      alert(err.message || "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ");
    }
  };
  const deactivate = async (row) => {
    if (!canDelete) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ظ‡ ط§ظ„ط¹ظ…ظ„ظٹط©");
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط¥ظ„ط؛ط§ط،/طھط¹ط·ظٹظ„ ظ‡ط°ط§ ط§ظ„ط³ط¬ظ„طں")) return;
    try {
      const saved = await hrRecordsService.deactivate(pageKey, currentCompanyId, row);
      setRows((list) => list.map((item) => item.id === saved.id ? saved : item));
      alert("طھظ… ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ظ†ط¬ط§ط­");
    } catch (err) {
      alert(err.message || "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ");
    }
  };
  const columns = fields.slice(0, 6).map(([key, label]) => ({ key, label }));
  const printableColumns = columns.length ? columns : [{ key: mainField, label: "ط§ظ„ط¨ظ†ط¯" }, { key: "status", label: "ط§ظ„ط­ط§ظ„ط©" }, { key: "notes", label: "ظ…ظ„ط§ط­ط¸ط§طھ" }];
  const renderField = ([key, label, type]) => (
    <Label key={key} t={label}>
      {type === "textarea" ? (
        <textarea value={dialog?.[key] || ""} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} className="field mt-2 !h-auto py-3" />
      ) : type === "status" ? (
        <select value={dialog?.[key] || "ظ†ط´ط·"} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} className="field mt-2">
          {["ظ†ط´ط·", "ظ…ط³ظˆط¯ط©", "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©", "ظ…ط¹طھظ…ط¯ط©", "ظ…ط±ظپظˆط¶ط©", "ظ…ط؛ظ„ظ‚ط©", "ظ…ظ„ط؛ظ‰"].map((status) => <option key={status}>{status}</option>)}
        </select>
      ) : (
        <input type={type || "text"} value={dialog?.[key] ?? ""} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} className="field mt-2" />
      )}
    </Label>
  );
  return (
    <div className="space-y-5">
      <PageHead title={title} desc={`${config.description || "طµظپط­ط© ظ…ظˆط§ط±ط¯ ط¨ط´ط±ظٹط©"} - ${currentCompany?.company_name || APP_BRAND_NAME}`} action={<button disabled={!canCreate} onClick={openAdd} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط©</button>} />
      {warning && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">{warning}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-4">{stats.map(([label, value]) => <Mini key={label} label={label} value={value} I={BadgeCheck} />)}</div>
      <div className="panel flex flex-wrap gap-2 p-3">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === item ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}</div>
      <div className="panel flex flex-wrap gap-3 p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} className="field min-w-[220px] flex-1" placeholder="ط¨ط­ط«..." />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
        <button disabled={!canExport} onClick={() => exportExcel(filtered, title)} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button>
        <button disabled={!canPrint} onClick={() => printDocument(title, rowsToReportHtml(title, filtered, printableColumns))} className="btn-secondary"><Printer size={17} /> ط·ط¨ط§ط¹ط©</button>
      </div>
      <div className="panel p-4">
        {loading ? <div className="p-8 text-center text-sm text-slate-400">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ...</div> : filtered.length ? (
          <div className="table-wrap"><table><thead><tr>{printableColumns.map((col) => <th key={col.key}>{col.label}</th>)}<th>ط§ظ„ط­ط§ظ„ط©</th><th>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th></tr></thead><tbody>{filtered.map((row, index) => <tr key={row.id || index}>{printableColumns.map((col) => <td key={col.key}>{String(row[col.key] ?? "â€”")}</td>)}<td><Status>{row.status || "ظ†ط´ط·"}</Status></td><td><button onClick={() => setDialog(row)} className="p-2 text-slate-600"><Eye size={16} /></button><button disabled={!canEdit} onClick={() => setDialog(row)} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canDelete} onClick={() => deactivate(row)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>
        ) : <div className="p-8 text-center text-sm text-slate-400">ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ط­ط§ظ„ظٹط§ظ‹</div>}
      </div>
      {dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"><DialogTitle title={`${title} - ${tab}`} close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-2">{fields.map(renderField)}</div><DialogActions close={() => setDialog(null)} /></form></div>}
    </div>
  );
}

function CompaniesAdminPage({ currentUser }) {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("ط§ظ„ط´ط±ظƒط§طھ");
  const [permissionsCompanyId, setPermissionsCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const canManage = isPlatformAdminUser(currentUser);
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
  if (!canManage) return <div className="panel p-6 text-center font-bold text-red-600">ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط§ظ„ظˆطµظˆظ„ ط¥ظ„ظ‰ ط¨ظٹط§ظ†ط§طھ ظ‡ط°ظ‡ ط§ظ„ط´ط±ظƒط©</div>;
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
      if (!adminUsername) return alert("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ظ…ط³طھط®ط¯ظ… ظ…ط¯ظٹط± ط§ظ„ط´ط±ظƒط©");
      const adminPayload = {
        user_id: dialog.admin_user_id,
        username: adminUsername,
        password: dialog.admin_password || "",
        name: dialog.admin_name || "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…",
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
    setTab("طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط§طھ");
  };
  const enableAllPermissions = async (companyId) => {
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ طھظپط¹ظٹظ„ ط¬ظ…ظٹط¹ ط§ظ„ظˆط­ط¯ط§طھ ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ ظ„ظ‡ط°ظ‡ ط§ظ„ط´ط±ظƒط©طں")) return;
    try {
      await companyPermissionsService.enableAll(companyId);
      alert("طھظ… طھظپط¹ظٹظ„ ط¬ظ…ظٹط¹ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط©");
    } catch (error) {
      alert(error.message);
    }
  };
  const disableAllPermissions = async (companyId) => {
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ طھط¹ط·ظٹظ„ ط¬ظ…ظٹط¹ ظˆط­ط¯ط§طھ ظ‡ط°ظ‡ ط§ظ„ط´ط±ظƒط©طں")) return;
    try {
      await companyPermissionsService.disableAll(companyId);
      alert("طھظ… طھط¹ط·ظٹظ„ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط©");
    } catch (error) {
      alert(error.message);
    }
  };
  const tabs = ["ط§ظ„ط´ط±ظƒط§طھ", "طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط§طھ", "ط§ط´طھط±ط§ظƒط§طھ ط§ظ„ط´ط±ظƒط§طھ", "ظ…ط³طھط®ط¯ظ…ظˆ ط§ظ„ط´ط±ظƒط§طھ", "ظ†ط³ط® ط§ط­طھظٹط§ط·ظٹط© ط§ظ„ط´ط±ظƒط§طھ", "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…ظ†طµط©"];
  return (
    <div className="space-y-5">
      <PageHead title="ط¥ط¯ط§ط±ط© ط§ظ„ط´ط±ظƒط§طھ" desc="ط¥ط¯ط§ط±ط© ظ…ظ†طµط© SaaS ظ…طھط¹ط¯ط¯ط© ط§ظ„ط´ط±ظƒط§طھ ظˆط§ظ„ط§ط´طھط±ط§ظƒط§طھ ظˆط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†" action={<button onClick={openAddCompany} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط© ط´ط±ظƒط©</button>} />
      <div className="panel flex flex-wrap gap-2 p-3">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === item ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}</div>
      <div className="grid gap-4 md:grid-cols-4"><Mini label="ط¹ط¯ط¯ ط§ظ„ط´ط±ظƒط§طھ" value={rows.length} I={Building2} /><Mini label="ط§ظ„ظ†ط´ط·ط©" value={rows.filter((r) => r.is_active).length} I={BadgeCheck} /><Mini label="ط§ط´طھط±ط§ظƒط§طھ ظپط¹ط§ظ„ط©" value={rows.filter((r) => ["active", "trial"].includes(r.subscription_status)).length} I={Wallet} /><Mini label="ط§ظ„ظ…ط´ط±ظپ" value={currentUser?.username || "ظ…ط³طھط®ط¯ظ…"} I={UserRoundCog} /></div>
      {tab === "طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط§طھ" ? (
        <CompanyPermissionsAdminPanel companies={rows} selectedCompanyId={permissionsCompanyId || rows[0]?.company_id || ""} onSelectCompany={setPermissionsCompanyId} />
      ) : (
        <div className="panel p-4">
          {loading ? <p className="text-sm text-slate-400">ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</p> : <div className="table-wrap"><table><thead><tr><th>ط§ط³ظ… ط§ظ„ط´ط±ظƒط©</th><th>ظƒظˆط¯ ط§ظ„ط´ط±ظƒط©</th><th>ط­ط§ظ„ط© ط§ظ„ط§ط´طھط±ط§ظƒ</th><th>ط§ظ„ط­ط§ظ„ط©</th><th>ط§ط³ظ… ظ…ط³طھط®ط¯ظ… ظ…ط¯ظٹط± ط§ظ„ط´ط±ظƒط©</th><th>ط§ط³ظ… ظ…ط¯ظٹط± ط§ظ„ط´ط±ظƒط©</th><th>ط¹ط¯ط¯ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†</th><th>ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰ ظ„ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†</th><th>ط§ظ„طµظ„ط§ط­ظٹط§طھ</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.company_id}><td>{row.company_name}</td><td>{row.company_code}</td><td><Status>{row.subscription_status}</Status></td><td><Status>{row.is_active ? "ظ†ط´ط·" : "ظ…ط¹ط·ظ„"}</Status></td><td>{row.admin_username || "ط؛ظٹط± ظ…ط­ط¯ط¯"}</td><td>{row.admin_name || "ط؛ظٹط± ظ…ط­ط¯ط¯"}</td><td>{row.users_count ?? "â€”"}</td><td>{row.max_users}</td><td><div className="flex flex-wrap gap-1"><button onClick={() => managePermissions(row.company_id)} className="btn-secondary !h-9">ط¥ط¯ط§ط±ط©</button><button onClick={() => enableAllPermissions(row.company_id)} className="btn-secondary !h-9">طھظپط¹ظٹظ„ ط§ظ„ظƒظ„</button><button onClick={() => disableAllPermissions(row.company_id)} className="btn-secondary !h-9">طھط¹ط·ظٹظ„ ط§ظ„ظƒظ„</button></div></td><td><button onClick={() => openEditCompany(row)} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => companiesService.deleteOrDeactivateCompany(row).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>}
        </div>
      )}
      {dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"><DialogTitle title="ط¨ظٹط§ظ†ط§طھ ط§ظ„ط´ط±ظƒط©" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="ط§ط³ظ… ط§ظ„ط´ط±ظƒط©"><input required value={dialog.company_name || ""} onChange={(e) => setDialog({ ...dialog, company_name: e.target.value })} className="field mt-2" /></Label><Label t="ظƒظˆط¯ ط§ظ„ط´ط±ظƒط©"><input required value={dialog.company_code || ""} onChange={(e) => setDialog({ ...dialog, company_code: e.target.value.toUpperCase() })} className="field mt-2" /></Label><Label t="ط§ظ„ط¨ط±ظٹط¯"><input value={dialog.email || ""} onChange={(e) => setDialog({ ...dialog, email: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظ‡ط§طھظپ"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط¨ط§ظ‚ط©"><input value={dialog.subscription_plan || ""} onChange={(e) => setDialog({ ...dialog, subscription_plan: e.target.value })} className="field mt-2" /></Label><Label t="ط­ط§ظ„ط© ط§ظ„ط§ط´طھط±ط§ظƒ"><select value={dialog.subscription_status || "active"} onChange={(e) => setDialog({ ...dialog, subscription_status: e.target.value })} className="field mt-2"><option value="active">active</option><option value="trial">trial</option><option value="inactive">inactive</option></select></Label><Label t="ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰ ظ„ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†"><input type="number" value={dialog.max_users || 0} onChange={(e) => setDialog({ ...dialog, max_users: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰ ظ„ظ„ظپط±ظˆط¹"><input type="number" value={dialog.max_branches || 0} onChange={(e) => setDialog({ ...dialog, max_branches: e.target.value })} className="field mt-2" /></Label><Label t="ط±ط§ط¨ط· ط§ظ„ط´ط¹ط§ط±"><input value={dialog.logo_url || ""} onChange={(e) => setDialog({ ...dialog, logo_url: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظ„ظˆظ† ط§ظ„ط£ط³ط§ط³ظٹ"><input type="color" value={dialog.primary_color || "#7f1d1d"} onChange={(e) => setDialog({ ...dialog, primary_color: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select></Label><Label t="ط§ط³ظ… ظ…ط³طھط®ط¯ظ… ظ…ط¯ظٹط± ط§ظ„ط´ط±ظƒط©"><input required value={dialog.admin_username || ""} onChange={(e) => setDialog({ ...dialog, admin_username: e.target.value })} onBlur={(e) => setDialog((d) => ({ ...d, admin_username: e.target.value.trim() }))} className="field mt-2" /></Label><Label t="ط§ط³ظ… ظ…ط¯ظٹط± ط§ظ„ط´ط±ظƒط©"><input value={dialog.admin_name || ""} onChange={(e) => setDialog({ ...dialog, admin_name: e.target.value })} className="field mt-2" /></Label><Label t="ظƒظ„ظ…ط© ظ…ط±ظˆط± ظ…ط¯ظٹط± ط§ظ„ط´ط±ظƒط©"><input type="password" value={dialog.admin_password || ""} placeholder={dialog.company_id ? "ط§طھط±ظƒظ‡ط§ ظپط§ط±ط؛ط© ظ„ظ„ط¥ط¨ظ‚ط§ط، ط¹ظ„ظ‰ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط­ط§ظ„ظٹط©" : "123456"} onChange={(e) => setDialog({ ...dialog, admin_password: e.target.value })} className="field mt-2" /></Label></div><CompanyThemeFields theme={dialog} setTheme={(patch) => setDialog({ ...dialog, ...patch })} /><DialogActions close={() => setDialog(null)} /></form></div>}
    </div>
  );
}

function CompanyPermissionsAdminPanel({ companies, selectedCompanyId, onSelectCompany }) {
  const [rows, setRows] = useState([]);
  const [copySource, setCopySource] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const selectedCompany = companies.find((company) => company.company_id === selectedCompanyId);
  const pagePermissionKeys = ["can_view", ...companyPermissionChildActionKeys];
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
  const updateAction = (permissionKey, key, value) => {
    setRows((list) => {
      const merged = mergeWithDefaultCompanyPermissions(list, selectedCompanyId);
      return merged.map((row) => row.permission_key === permissionKey
        ? applyCompanyPermissionActionToggle(row, key, value)
        : row);
    });
  };
  const setPermissionTreeValue = (row, value) => ({
    ...row,
    ...Object.fromEntries(companyPermissionActions.map(([key]) => [key, value])),
    is_enabled: value,
    can_access: value,
  });
  const togglePage = (permissionKey, value) => {
    setRows((list) => mergeWithDefaultCompanyPermissions(list, selectedCompanyId)
      .map((row) => row.permission_key === permissionKey ? setPermissionTreeValue(row, value) : row));
  };
  const toggleModule = (moduleKey, value) => {
    setRows((list) => mergeWithDefaultCompanyPermissions(list, selectedCompanyId)
      .map((row) => row.module_key === moduleKey ? setPermissionTreeValue(row, value) : row));
  };
  const setAll = (value) => {
    setRows(mergeWithDefaultCompanyPermissions(rows, selectedCompanyId).map((row) => setPermissionTreeValue(row, value)));
  };
  const save = async () => {
    try {
      setLoading(true);
      const saved = await companyPermissionsService.bulkSaveCompanyPermissions(selectedCompanyId, rows);
      setRows(saved);
      activityLogsService.logUserActivity({
        company_id: selectedCompanyId,
        module_key: "platform",
        module_name: "ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طµط©",
        page_key: "companies_admin",
        page_name: "طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط§طھ",
        action_type: "permission_change",
        action_label: "ط­ظپط¸ طµظ„ط§ط­ظٹط§طھ ط´ط±ظƒط©",
        description: `طھظ… ط­ظپط¸ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط© ${selectedCompany?.company_name || selectedCompanyId}`,
        entity_type: "company",
        entity_id: selectedCompanyId,
        severity: "ط­ط³ط§ط³",
        metadata: { permission_rows_count: rows.length },
      });
      if (saved.schemaCompatibilityWarning) {
        alert("طھظ… ط­ظپط¸ طھظپط¹ظٹظ„ ط§ظ„ظˆط­ط¯ط§طھ ظˆط§ظ„طµظپط­ط§طھ. ط¨ط¹ط¶ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ ط§ظ„ط¥ط¶ط§ظپظٹط© طھط­طھط§ط¬ طھط·ط¨ظٹظ‚ ظ…ط³ظˆط¯ط© ط£ط¹ظ…ط¯ط© company_permissions.");
      } else {
        alert(saved.duplicateCount > 0 ? "طھظ… ط­ظپط¸ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط© ط¨ظ†ط¬ط§ط­. طھظ… طھط¬ط§ظ‡ظ„ ط§ظ„طµظ„ط§ط­ظٹط§طھ ط§ظ„ظ…ظƒط±ط±ط© ط£ط«ظ†ط§ط، ط§ظ„ط­ظپط¸" : "طھظ… ط­ظپط¸ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط© ط¨ظ†ط¬ط§ط­");
      }
    } catch (error) {
      console.error("Company permissions save error:", error);
      alert("ظپط´ظ„ ط­ظپط¸ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط©");
    } finally {
      setLoading(false);
    }
  };
  const reset = async () => {
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط¥ط¹ط§ط¯ط© طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط© ط¥ظ„ظ‰ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©طں")) return;
    try {
      setLoading(true);
      const saved = await companyPermissionsService.seedDefaultCompanyPermissions(selectedCompanyId);
      setRows(saved);
      alert("طھظ…طھ ط¥ط¹ط§ط¯ط© ط¶ط¨ط· طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط©");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  const copy = async () => {
    if (!copySource) return alert("ط§ط®طھط± ط§ظ„ط´ط±ظƒط© ط§ظ„ظ…طµط¯ط± ط£ظˆظ„ط§ظ‹");
    if (!confirm("ط³ظٹطھظ… ظ†ط³ط® طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط© ط§ظ„ظ…طµط¯ط± ط¥ظ„ظ‰ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©. ظ‡ظ„ طھط±ظٹط¯ ط§ظ„ظ…طھط§ط¨ط¹ط©طں")) return;
    try {
      setLoading(true);
      const saved = await companyPermissionsService.copyCompanyPermissions(copySource, selectedCompanyId);
      setRows(saved);
      alert("طھظ… ظ†ط³ط® طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط©");
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
      alert(`طھظ…طھ ظ…ط²ط§ظ…ظ†ط© ط§ظ„طµظ„ط§ط­ظٹط§طھ ظ…ط¹ ط§ظ„طµظپط­ط§طھ ط¨ظ†ط¬ط§ط­. طھظ…طھ ط¥ط¶ط§ظپط© ${result.insertedCount || 0} طµظ„ط§ط­ظٹط©طŒ ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ${result.totalCount || 0}.`);
    } catch (error) {
      alert(error.message || "ظپط´ظ„ ظ…ط²ط§ظ…ظ†ط© ط§ظ„طµظ„ط§ط­ظٹط§طھ ظ…ط¹ ط§ظ„طµظپط­ط§طھ");
    } finally {
      setLoading(false);
    }
  };
  const filterOptions = [
    ["all", "ط§ظ„ظƒظ„"],
    ["enabled", "ظ…ظپط¹ظ„ط©"],
    ["disabled", "ظ…ط¹ط·ظ„ط©"],
    ["core", "ط£ط³ط§ط³ظٹط©"],
    ["duplicate", "ظ…ظƒط±ط±ط©"],
    ["reports", "طھظ‚ط§ط±ظٹط±"],
    ["hr", "ظ…ظˆط§ط±ط¯ ط¨ط´ط±ظٹط©"],
    ["financial", "ظ…ط§ظ„ظٹط©"],
    ["inventory", "ظ…ط®ط²ظˆظ†"],
    ["settings", "ط¥ط¹ط¯ط§ط¯ط§طھ"],
  ];
  const allRows = mergeWithDefaultCompanyPermissions(rows, selectedCompanyId);
  const visibleRows = allRows.filter((row) => {
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
  const groupedRows = Object.entries(visibleRows.reduce((acc, row) => {
    const key = row.module_key || "general";
    const module = ERP_MODULES.find((item) => item.key === key);
    if (!acc[key]) acc[key] = { key, label: module?.label || row.module_label || row.group_label || key, rows: [] };
    acc[key].rows.push(row);
    return acc;
  }, {})).map(([, group]) => ({ ...group, rows: group.rows.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)) }));
  const pageCheckboxState = (row) => {
    const values = pagePermissionKeys.map((key) => row[key] === true);
    const checked = row.is_enabled === true && row.can_access === true && values.every(Boolean);
    const hasAny = row.is_enabled === true || row.can_access === true || values.some(Boolean);
    return { checked, indeterminate: hasAny && !checked };
  };
  const moduleCheckboxState = (moduleKey) => {
    const moduleRows = allRows.filter((row) => row.module_key === moduleKey);
    const states = moduleRows.map(pageCheckboxState);
    const checked = states.length > 0 && states.every((state) => state.checked);
    const hasAny = states.some((state) => state.checked || state.indeterminate);
    return { checked, indeterminate: hasAny && !checked };
  };
  useEffect(() => {
    if (!expandedGroups.length && groupedRows.length) setExpandedGroups(groupedRows.map((group) => group.key));
  }, [visibleRows.length]);
  const isExpanded = (key) => expandedGroups.includes(key);
  const toggleGroup = (key) => setExpandedGroups((list) => list.includes(key) ? list.filter((item) => item !== key) : [...list, key]);
  return (
    <div className="panel p-4">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Label t="ط§ط®طھط± ط§ظ„ط´ط±ظƒط©">
          <select value={selectedCompanyId || ""} onChange={(e) => onSelectCompany(e.target.value)} className="field mt-2 min-w-[260px]">
            {companies.map((company) => <option key={company.company_id} value={company.company_id}>{company.company_code} - {company.company_name}</option>)}
          </select>
        </Label>
        <Label t="ظ†ط³ط® ط§ظ„طµظ„ط§ط­ظٹط§طھ ظ…ظ† ط´ط±ظƒط©">
          <select value={copySource} onChange={(e) => setCopySource(e.target.value)} className="field mt-2 min-w-[240px]">
            <option value="">ط§ط®طھط± ط§ظ„ظ…طµط¯ط±...</option>
            {companies.filter((company) => company.company_id !== selectedCompanyId).map((company) => <option key={company.company_id} value={company.company_id}>{company.company_code} - {company.company_name}</option>)}
          </select>
        </Label>
        <button onClick={copy} disabled={!selectedCompanyId || !copySource || loading} className="btn-secondary">ظ†ط³ط® ط§ظ„طµظ„ط§ط­ظٹط§طھ</button>
        <button onClick={sync} disabled={!selectedCompanyId || loading} className="btn-secondary">ظ…ط²ط§ظ…ظ†ط© ط§ظ„طµظ„ط§ط­ظٹط§طھ ظ…ط¹ ط§ظ„طµظپط­ط§طھ</button>
        <button onClick={() => setExpandedGroups(groupedRows.map((group) => group.key))} disabled={!selectedCompanyId || loading} className="btn-secondary">طھظˆط³ظٹط¹ ط§ظ„ظƒظ„</button>
        <button onClick={() => setExpandedGroups([])} disabled={!selectedCompanyId || loading} className="btn-secondary">ط·ظٹ ط§ظ„ظƒظ„</button>
        <button onClick={() => setAll(true)} disabled={!selectedCompanyId || loading} className="btn-secondary">طھط­ط¯ظٹط¯ ط§ظ„ظƒظ„</button>
        <button onClick={() => setAll(false)} disabled={!selectedCompanyId || loading} className="btn-secondary">ط¥ظ„ط؛ط§ط، ط§ظ„ظƒظ„</button>
        <button onClick={reset} disabled={!selectedCompanyId || loading} className="btn-secondary">ط¥ط¹ط§ط¯ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹ</button>
        <button onClick={save} disabled={!selectedCompanyId || loading} className="btn-primary"><Save size={17} /> ط­ظپط¸ ط§ظ„طµظ„ط§ط­ظٹط§طھ</button>
      </div>
      <div className="mb-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
        ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©: <b>{selectedCompany?.company_name || "ط؛ظٹط± ظ…ط­ط¯ط¯"}</b>. طھط¹ط·ظٹظ„ ط£ظٹ ظˆط­ط¯ط© ظ‡ظ†ط§ ظٹظ…ظ†ط¹ ط¸ظ‡ظˆط±ظ‡ط§ ظپظٹ ط§ظ„ظ‚ط§ط¦ظ…ط© ط­طھظ‰ ظ„ظˆ ظƒط§ظ† ط§ظ„ط¯ظˆط± ظٹظ…ظ„ظƒ طµظ„ط§ط­ظٹطھظ‡ط§.
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="field min-w-[260px] flex-1" placeholder="ط§ط¨ط­ط« ط¹ظ† طµظپط­ط© ط£ظˆ طµظ„ط§ط­ظٹط©" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="field max-w-[220px]">
          {filterOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </div>
      {loading ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط´ط±ظƒط©...</p> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ط§ظ„ظ…ط³طھظˆظ‰ / ط§ظ„طµظپط­ط©</th>
                <th>ظ…ظپطھط§ط­ ط§ظ„طµظ„ط§ط­ظٹط©</th>
                {companyPermissionActions.map(([, label]) => <th key={label}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((group) => (
                <React.Fragment key={group.key}>
                  <tr className="bg-slate-100">
                    <td colSpan={2 + companyPermissionActions.length}>
                      <div className="flex items-center gap-3">
                        <input
                          ref={(input) => { if (input) input.indeterminate = moduleCheckboxState(group.key).indeterminate; }}
                          type="checkbox"
                          checked={moduleCheckboxState(group.key).checked}
                          onChange={(e) => toggleModule(group.key, e.target.checked)}
                          aria-label={`طھط­ط¯ظٹط¯ ظˆط­ط¯ط© ${group.label}`}
                          className="h-5 w-5 accent-red-800"
                        />
                        <button type="button" onClick={() => toggleGroup(group.key)} className="flex min-w-0 flex-1 items-center gap-2 text-right font-extrabold text-slate-700">
                          <ChevronLeft size={16} className={isExpanded(group.key) ? "-rotate-90 shrink-0 transition" : "shrink-0 transition"} />
                          <span className="truncate">{group.label}</span>
                          <span className="text-xs font-bold text-slate-400">({group.rows.length})</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded(group.key) && group.rows.map((row) => (
                    <tr key={row.permission_key}>
                      <td className="min-w-[220px]"><b>{row.module_label || row.permission_label}</b><p className="text-xs text-slate-400">{row.permission_label}</p>{row.is_duplicate_allowed && <p className="text-xs text-amber-600">طµظپط­ط© ظ…ظƒط±ط±ط© ظ…ط³ظ…ظˆط­ط©</p>}</td>
                      <td className="font-mono text-xs">{row.permission_key}</td>
                      {companyPermissionActions.map(([key]) => {
                        const pageState = pageCheckboxState(row);
                        const isPageCheckbox = key === "is_enabled";
                        return (
                        <td key={key} className="text-center">
                          <input
                            ref={isPageCheckbox ? (input) => { if (input) input.indeterminate = pageState.indeterminate; } : undefined}
                            type="checkbox"
                            checked={isPageCheckbox ? pageState.checked : Boolean(row[key])}
                            onChange={(e) => isPageCheckbox
                              ? togglePage(row.permission_key, e.target.checked)
                              : updateAction(row.permission_key, key, e.target.checked)}
                            className="h-4 w-4 accent-red-800"
                          />
                        </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
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
    ["primary_color", "ط§ظ„ظ„ظˆظ† ط§ظ„ط£ط³ط§ط³ظٹ"],
    ["secondary_color", "ط§ظ„ظ„ظˆظ† ط§ظ„ط«ط§ظ†ظˆظٹ"],
    ["accent_color", "ظ„ظˆظ† ط§ظ„طھظ…ظٹظٹط²"],
    ["sidebar_bg_color", "ظ„ظˆظ† ط®ظ„ظپظٹط© ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط¬ط§ظ†ط¨ظٹط©"],
    ["sidebar_text_color", "ظ„ظˆظ† ظ†طµ ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط¬ط§ظ†ط¨ظٹط©"],
    ["button_color", "ظ„ظˆظ† ط§ظ„ط£ط²ط±ط§ط±"],
    ["button_text_color", "ظ„ظˆظ† ظ†طµ ط§ظ„ط£ط²ط±ط§ط±"],
    ["card_accent_color", "ظ„ظˆظ† ط¨ط·ط§ظ‚ط§طھ ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ"],
    ["table_header_color", "ظ„ظˆظ† ط±ط£ط³ ط§ظ„ط¬ط¯ط§ظˆظ„"],
    ["report_header_color", "ظ„ظˆظ† ط±ط£ط³ ط§ظ„طھظ‚ط§ط±ظٹط±"],
  ];
  const preview = () => {
    const next = normalizeThemePayload(theme || {});
    applyCompanyTheme(next);
    alert("طھظ…طھ ظ…ط¹ط§ظٹظ†ط© ط§ظ„ط«ظٹظ…");
  };
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h3 className="text-lg font-extrabold">ط£ظ„ظˆط§ظ† ط§ظ„ط«ظٹظ…</h3>
          <p className="mt-1 text-xs text-slate-500">طھط·ط¨ظ‚ ط§ظ„ط£ظ„ظˆط§ظ† ط¹ظ„ظ‰ ط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط¬ط§ظ†ط¨ظٹط© ظˆط§ظ„ط£ط²ط±ط§ط± ظˆط§ظ„ط¨ط·ط§ظ‚ط§طھ ظˆط±ط¤ظˆط³ ط§ظ„طھظ‚ط§ط±ظٹط±.</p>
        </div>
        <select
          className="field mr-auto max-w-[240px]"
          onChange={(e) => {
            const preset = themePresets.find(([name]) => name === e.target.value)?.[1];
            if (preset) setTheme({ ...getDefaultTheme(), ...preset, button_color: preset.primary_color, report_header_color: preset.primary_color });
          }}
          defaultValue=""
        >
          <option value="">ط§ط®طھط± ظ‚ط§ظ„ط¨ ط£ظ„ظˆط§ظ†...</option>
          {themePresets.map(([name]) => <option key={name}>{name}</option>)}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {colorFields.map(([key, label]) => (
          <Label key={key} t={label}>
            <input type="color" value={normalized[key]} onChange={(e) => setTheme({ [key]: e.target.value })} className="field mt-2" />
          </Label>
        ))}
        <Label t="ظˆط¶ط¹ ط§ظ„ط«ظٹظ…">
          <select value={normalized.theme_mode} onChange={(e) => setTheme({ theme_mode: e.target.value })} className="field mt-2">
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </Label>
        <Label t="ط§ط³ظ… ط§ظ„ط«ظٹظ…">
          <input value={normalized.theme_name} onChange={(e) => setTheme({ theme_name: e.target.value })} className="field mt-2" />
        </Label>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <button type="button" style={{ backgroundColor: normalized.button_color, color: normalized.button_text_color }} className="rounded-xl px-4 py-3 text-sm font-bold">ظ†ظ…ظˆط°ط¬ ط²ط±</button>
        <div style={{ backgroundColor: normalized.card_accent_color }} className="rounded-xl p-4 text-sm font-bold">ظ†ظ…ظˆط°ط¬ ط¨ط·ط§ظ‚ط©</div>
        <div style={{ backgroundColor: normalized.primary_color, color: normalized.button_text_color }} className="rounded-xl p-4 text-sm font-bold">ط¹ظ†طµط± ظ‚ط§ط¦ظ…ط© ظ†ط´ط·</div>
        <div style={{ backgroundColor: normalized.report_header_color, color: normalized.button_text_color }} className="rounded-xl p-4 text-sm font-bold">ط±ط£ط³ طھظ‚ط±ظٹط±</div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={preview} className="btn-secondary">ظ…ط¹ط§ظٹظ†ط© ط§ظ„ط«ظٹظ…</button>
        {canSave && <button type="button" onClick={onSave} className="btn-primary">ط­ظپط¸ ط£ظ„ظˆط§ظ† ط§ظ„ط«ظٹظ…</button>}
        {canSave && <button type="button" onClick={onReset} className="btn-secondary">ط§ط³طھط¹ط§ط¯ط© ط§ظ„ط£ظ„ظˆط§ظ† ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©</button>}
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
          <h1 className="mt-4 text-xl font-extrabold">ط§ظ„ط­ط³ط§ط¨ ط؛ظٹط± ظ…ط±طھط¨ط· ط¨ظ…ظˆط¸ظپ</h1>
          <p className="mt-2 text-sm text-slate-500">ط§ط·ظ„ط¨ ظ…ظ† ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ… ط±ط¨ط· ط§ظ„ط­ط³ط§ط¨ ط¨ط±ظ‚ظ… ط§ظ„ظ…ظˆط¸ظپ.</p>
          <button onClick={onLogout} className="btn-primary mt-5">طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬</button>
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
            <button onClick={submitObjection} className="btn-primary">ط¥ط±ط³ط§ظ„ ط§ظ„ط·ظ„ط¨</button>
            {sent && (
              <span className="text-sm font-bold text-emerald-600">طھظ… ط¥ط±ط³ط§ظ„ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©.</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
function Dashboard({ employees, evaluations, setPage, settings, currentCompany, currentUser }) {
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const month = new Date().toISOString().slice(0, 7);
  const [kpiRanking, setKpiRanking] = useState([]);
  useEffect(() => {
    let alive = true;
    if (!companyId) return undefined;
    kpiScoresService.loadKpiScores(companyId, { month }, employees).then((result) => { if (alive) setKpiRanking(result.ranking || []); }).catch((error) => { console.error("Executive KPI summary error:", error); if (alive) setKpiRanking([]); });
    return () => { alive = false; };
  }, [companyId, month, employees]);
  const scored = kpiRanking.filter((row) => Number.isFinite(Number(row.final_kpi_score ?? row.final_score)));
  const avg = scored.length ? Math.min(100, scored.reduce((sum, row) => sum + Number(row.final_kpi_score ?? row.final_score), 0) / scored.length) : 0;
  const active = employees.filter((e) => e.status === "ظ†ط´ط·").length;
  const weak = scored.filter((row) => Number(row.final_kpi_score ?? row.final_score) < 60).length;
  const bonusRate = (score) => score >= 95 ? 0.20 : score >= 90 ? 0.15 : score >= 85 ? 0.10 : score >= 80 ? 0.05 : 0;
  const incentivesTotal = scored.reduce((sum, row) => { const employee = employees.find((item) => String(item.id) === String(row.employee_id)); return sum + Number(employee?.salary || 0) * bonusRate(Number(row.final_kpi_score ?? row.final_score)); }, 0);
  const top = [...scored].sort((a, b) => Number(b.final_kpi_score ?? b.final_score) - Number(a.final_kpi_score ?? a.final_score) || Number(b.achievement_percentage || 0) - Number(a.achievement_percentage || 0) || Number(b.total_operations || b.operations?.total_operations || 0) - Number(a.total_operations || a.operations?.total_operations || 0))[0];
  const realBranches = [...new Set(scored.flatMap((row) => row.branches?.length ? row.branches : [row.branch]).filter(Boolean))];
  const branchData = realBranches.map((branch) => { const rows = scored.filter((row) => row.branch === branch || row.branches?.includes(branch)); return { name: branch, avg: rows.length ? Math.min(100, Math.round(rows.reduce((sum, row) => sum + Number(row.final_kpi_score ?? row.final_score), 0) / rows.length)) : 0 }; });
  const dist = ["ظ…ظ…طھط§ط²", "ط¬ظٹط¯ ط¬ط¯ظ‹ط§", "ط¬ظٹط¯", "ظ…ظ‚ط¨ظˆظ„", "ظٹط­طھط§ط¬ طھط­ط³ظٹظ†"].map((name) => ({ name, value: scored.filter((row) => row.rating_label === name || row.performance_label === name).length }));
  const cards = [
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ظˆط¸ظپظٹظ†", employees.length, Users, "bg-blue-50 text-blue-600"],
    ["ط§ظ„ظ…ظˆط¸ظپظˆظ† ط§ظ„ظ†ط´ط·ظˆظ†", active, UserCheck, "bg-emerald-50 text-emerald-600"],
    ["ظ…طھظˆط³ط· ط¯ط±ط¬ط© KPI", avg.toFixed(2) + "%", Star, "bg-amber-50 text-amber-600"],
    ["ظ…ط³طھط­ظ‚ظˆ ط§ظ„ط­ط§ظپط²", scored.filter((row) => Number(row.final_kpi_score ?? row.final_score) >= 80).length, Gift, "bg-violet-50 text-violet-600"],
    ["ط§ظ„ظ…ظˆط¸ظپظˆظ† ظ…ظ†ط®ظپط¶ظˆ ط§ظ„ط£ط¯ط§ط،", weak, AlertTriangle, "bg-red-50 text-red-600"],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط­ظˆط§ظپط² ط§ظ„ظ…ظ‚طھط±ط­ط©", money(incentivesTotal), Wallet, "bg-brand-50 text-brand-700"],
  ];
  return (
    <div className="space-y-6">
      <PageHead title={"طµط¨ط§ط­ ط§ظ„ط®ظٹط±طŒ " + settings.manager.name.split(" ")[0] + " ًں‘‹"} desc={"ظ…ظ„ط®طµ KPI ظ„ظ„ط´ظ‡ط± " + month} action={<button onClick={() => setPage("performance_kpi_scores")} className="btn-primary"><FileBarChart size={17} /> طھظ‚ط±ظٹط± KPI</button>} />
      <div className="rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">ظٹطھظ… ط§ط­طھط³ط§ط¨ KPI ظ…ظ† ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ط¹طھظ…ط¯ط© ط§ظ„ط¯ط§ط®ظ„ط© ظپظٹ KPI ظپظ‚ط·.</div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value, I, color]) => <div key={label} className="panel flex items-center gap-4 p-5"><div className={"grid h-12 w-12 place-items-center rounded-xl " + color}><I size={22} /></div><div><p className="text-xs font-bold text-slate-500">{label}</p><b className="mt-1 block text-2xl">{value}</b></div></div>)}</div>
      <div className="grid gap-5 xl:grid-cols-[1.45fr_.8fr]"><Chart title="ظ…طھظˆط³ط· ط¯ط±ط¬ط© KPI ط­ط³ط¨ ط§ظ„ظپط±ظˆط¹" sub="ط§ظ„ظ†طھط§ط¦ط¬ ط§ظ„ظ…ظˆط­ط¯ط©"><ResponsiveContainer width="100%" height={280}><BarChart data={branchData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="avg" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart><Chart title="طھظˆط²ظٹط¹ طھطµظ†ظٹظپط§طھ ط§ظ„ط£ط¯ط§ط،" sub="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط§ظ„ظ…ظ‚ظٹظ…ظٹظ†"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={dist} innerRadius={58} outerRadius={88} paddingAngle={4} dataKey="value">{dist.map((_, i) => <Cell key={i} fill={["#16a34a", "#2563eb", "#0ea5e9", "#f59e0b", "#ef4444"][i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Chart></div>
      <div className="panel overflow-hidden"><div className="bg-gradient-to-br from-brand-800 to-brand-700 p-6 text-white"><div className="flex justify-between"><span>ظ…ظˆط¸ظپ ط§ظ„ط´ظ‡ط±</span><Trophy className="text-amber-300" /></div>{top ? <div className="mt-5 flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-xl font-bold">{top.employee_name?.[0] || "â€”"}</div><div><h3 className="text-xl font-extrabold">{top.employee_name}</h3><p className="text-sm text-red-100">{top.branches?.length ? top.branches.join("طŒ ") : top.branch} â€¢ {top.job || top.job_name}</p></div></div> : <p className="mt-5">ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظƒط§ظپظٹط© ظ„ط§ط®طھظٹط§ط± ظ…ظˆط¸ظپ ط§ظ„ط´ظ‡ط±.</p>}</div>{top && <div className="p-5"><div className="flex justify-between"><span>ط¯ط±ط¬ط© KPI ط§ظ„ظ†ظ‡ط§ط¦ظٹط©</span><b className="text-2xl text-brand-700">{Number(top.final_kpi_score ?? top.final_score).toFixed(2)}%</b></div><p className="mt-2 text-sm text-slate-500">ظ†ط³ط¨ط© ط§ظ„ط¥ظ†ط¬ط§ط²: {top.achievement_percentage}%</p><p className="mt-2 text-sm font-bold text-slate-600">ط£ط¹ظ„ظ‰ ط¯ط±ط¬ط© KPI ظ†ظ‡ط§ط¦ظٹط© ظ…ط¹ ظ…ط±ط§ط¹ط§ط© ط§ظ„ط¥ظ†طھط§ط¬ظٹط© ظˆط¬ظˆط¯ط© ط§ظ„ط£ط¯ط§ط،.</p><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-700" style={{ width: Math.min(100, Number(top.final_kpi_score ?? top.final_score)) + "%" }} /></div></div>}</div>
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
    ["ط§ظ„ظ…ظˆط¸ظپظˆظ† ط§ظ„ظ…ظˆظ‚ظˆظپظˆظ†", employees.filter((e) => e.status === "ظ…ظˆظ‚ظˆظپ").length, AlertTriangle],
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
const employeeImageUrl = (employee = {}) =>
  String(employee.profile_image_url || employee.profileImageUrl || employee.profile_image || employee.avatar_url || employee.photo_url || "").trim();

const employeeInitials = (name = "") =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("") || "طں";

function EmployeeAvatar({ employee, size = "md", onClick }) {
  const [failed, setFailed] = useState(false);
  const src = employeeImageUrl(employee);
  useEffect(() => setFailed(false), [src]);
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-24 w-24 text-2xl",
  };
  const className = `${sizes[size] || sizes.md} shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-brand-700`;
  const content = src && !failed
    ? <img src={src} alt={employee?.name || "طµظˆط±ط© ط§ظ„ظ…ظˆط¸ظپ"} onError={() => setFailed(true)} className="h-full w-full object-cover" />
    : <span className="grid h-full w-full place-items-center font-extrabold">{employeeInitials(employee?.name)}</span>;

  return onClick ? (
    <button type="button" onClick={onClick} className={`${className} focus:outline-none focus:ring-2 focus:ring-brand-500`}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
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
              placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..."
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
function EmployeeModal({ employee, editing, close, save, setEmployees, branchOptions = branches, jobOptions = jobs, managerOptions = [], canViewFinancial = true, currentCompany, currentUser, onSaved }) {
  const currentEmployee = employee || editing;
  const availableBranches = [...new Set([currentEmployee?.branch, ...(branchOptions || []), ...branches].filter(Boolean))];
  const availableJobs = [...new Set([currentEmployee?.job, ...(jobOptions || []), ...jobs].filter(Boolean))];
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(employeeImageUrl(currentEmployee));
  const [photoError, setPhotoError] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [f, setF] = useState(
    currentEmployee || {
      id: `EMP-${Date.now().toString().slice(-4)}`,
      name: "",
      branch: availableBranches[0] || "",
      job: availableJobs[0] || "",
      hireDate: new Date().toISOString().slice(0, 10),
      salary: 5000,
      phone: "05",
      status: "ظ†ط´ط·",
      manager: "",
      gender: "ط؛ظٹط± ظ…ط­ط¯ط¯",
      profile_image_url: "",
      profile_image_path: "",
    },
  );
  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(removePhoto ? "" : employeeImageUrl(f));
      return undefined;
    }
    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile, removePhoto, f.profile_image_url, f.profileImageUrl]);
  const selectPhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setPhotoError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("ظ†ظˆط¹ ط§ظ„ظ…ظ„ظپ ط؛ظٹط± ظ…ط¯ط¹ظˆظ…");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("ط­ط¬ظ… ط§ظ„طµظˆط±ط© ظٹط¬ط¨ ط£ظ„ط§ ظٹطھط¬ط§ظˆط² 2 ظ…ظٹط¬ط§ط¨ط§ظٹطھ");
      return;
    }
    setPhotoFile(file);
    setRemovePhoto(false);
  };
  const clearPhoto = () => {
    setPhotoFile(null);
    setRemovePhoto(true);
    setPhotoPreview("");
    setPhotoError("");
    setF({ ...f, profile_image_url: "", profileImageUrl: "", profile_image_path: "", profileImagePath: "" });
  };
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
            gender: f.gender || "ط؛ظٹط± ظ…ط­ط¯ط¯",
            profile_image_url: employeeImageUrl(f),
            profile_image_path: f.profile_image_path || f.profileImagePath || "",
          };
          setSaving(true);
          try {
            const currentPhotoPath = f.profile_image_path || f.profileImagePath || currentEmployee?.profile_image_path || currentEmployee?.profileImagePath || "";
            if (photoFile) {
              const uploaded = await employeesService.uploadEmployeePhoto(photoFile, payload, currentCompany?.company_id || currentUser?.company_id || f.company_id || "");
              payload.profile_image_url = uploaded.profile_image_url;
              payload.profile_image_path = uploaded.profile_image_path;
              if (currentPhotoPath && currentPhotoPath !== uploaded.profile_image_path) {
                employeesService.removeEmployeePhoto(currentPhotoPath).catch((error) => console.error("Supabase employee photo delete error:", error));
              }
            } else if (removePhoto) {
              payload.profile_image_url = "";
              payload.profile_image_path = "";
              if (currentPhotoPath) {
                employeesService.removeEmployeePhoto(currentPhotoPath).catch((error) => console.error("Supabase employee photo delete error:", error));
              }
            }
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
              gender: data.gender || "ط؛ظٹط± ظ…ط­ط¯ط¯",
              profile_image_url: data.profile_image_url || data.profile_image || data.avatar_url || data.photo_url || "",
              profileImageUrl: data.profile_image_url || data.profile_image || data.avatar_url || data.photo_url || "",
              profile_image_path: data.profile_image_path || data.photo_path || "",
              profileImagePath: data.profile_image_path || data.photo_path || "",
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
            onSaved?.(savedEmployee, currentEmployee || null);
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
        <div className="mb-5 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
          <EmployeeAvatar employee={{ ...f, profile_image_url: photoPreview }} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-700">طµظˆط±ط© ط§ظ„ظ…ظˆط¸ظپ</p>
            <p className="mt-1 text-xs text-slate-500">JPG ط£ظˆ PNG ط£ظˆ WEBPطŒ ط¨ط­ط¯ ط£ظ‚طµظ‰ 2 ظ…ظٹط¬ط§ط¨ط§ظٹطھ.</p>
            {photoError && <p className="mt-2 text-xs font-bold text-red-600">{photoError}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="btn-secondary cursor-pointer">
                <Upload size={17} /> ط§ط®طھظٹط§ط± طµظˆط±ط©
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={selectPhoto} />
              </label>
              <button type="button" onClick={clearPhoto} className="btn-secondary text-red-600">ط¥ط²ط§ظ„ط© ط§ظ„طµظˆط±ط©</button>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["id", "ط±ظ‚ظ… ط§ظ„ظ…ظˆط¸ظپ"],
            ["name", "ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ"],
            ["hireDate", "طھط§ط±ظٹط® ط§ظ„طھط¹ظٹظٹظ†", "date"],
            ...(canViewFinancial ? [["salary", "ط§ظ„ط±ط§طھط¨", "number"]] : []),
            ["phone", "ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ"],
            ["manager", "ط§ظ„ظ…ط¯ظٹط± ط§ظ„ظ…ط¨ط§ط´ط±"],
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
          <Label t="ط§ظ„ظپط±ط¹">
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
          <Label t="ط§ظ„ظˆط¸ظٹظپط©">
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
          <Label t="ط§ظ„ظ†ظˆط¹">
            <select
              value={f.gender || "ط؛ظٹط± ظ…ط­ط¯ط¯"}
              onChange={(e) => setF({ ...f, gender: e.target.value })}
              className="field mt-2"
            >
              <option>ط؛ظٹط± ظ…ط­ط¯ط¯</option>
              <option>ط°ظƒط±</option>
              <option>ط£ظ†ط«ظ‰</option>
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
          {settingsError && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">{settingsError}</div>}
          {settingsLoading && <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ...</div>}
          {tab === "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…" ? (
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
                  <h3 className="text-lg font-extrabold">ط¨ظٹط§ظ†ط§طھ ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…</h3>
                  <p className="text-xs text-slate-500">
                    طھط¸ظ‡ط± ظ‡ط°ظ‡ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظپظٹ ط§ظ„ط´ط±ظٹط· ط§ظ„ط¹ظ„ظˆظٹ ظˆط§ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ط¬ط§ظ†ط¨ظٹط©
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Label t="ط§ط³ظ… ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…">
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
                <Label t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…">
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
  currentCompany,
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
    ["ط¥ط¹ط¯ط§ط¯ط§طھ ط¹ط§ظ…ط©", Settings],
    ["ط§ظ„ط«ظٹظ… ظˆط§ظ„ط£ظ„ظˆط§ظ†", Settings],
  ];
  const [tab, setTab] = useState("ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…"),
    [selected, setSelected] = useState(null),
    [dialog, setDialog] = useState(null),
    [themeDraft, setThemeDraft] = useState(() => normalizeThemePayload(currentCompany || {})),
    [settingsRows, setSettingsRows] = useState({ branches: [], currencies: [], users: [], system: {} }),
    [settingsLoading, setSettingsLoading] = useState(false),
    [settingsError, setSettingsError] = useState("");
  const currentCompanyId = currentCompany?.company_id || currentUser?.company_id || "";
  const managerSafe = settings?.manager || defaultSettings.manager || { name: "", username: "", role: "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…" };
  useEffect(() => {
    setThemeDraft(normalizeThemePayload(currentCompany || {}));
  }, [currentCompany?.company_id, currentCompany?.primary_color, currentCompany?.button_color]);
  const loadSettingsCrud = async () => {
    if (!currentCompanyId) {
      setSettingsError("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
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
      setSettingsError(error.message || "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ");
    } finally {
      setSettingsLoading(false);
    }
  };
  useEffect(() => {
    loadSettingsCrud();
  }, [currentCompanyId]);
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
  const isRemoteBranch = tab === "ط§ظ„ظپط±ظˆط¹";
  const isRemoteCurrency = tab === "ط§ظ„ط¹ظ…ظ„ط§طھ";
  const isRemoteUser = tab === "ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ†";
  const isGeneralSettings = tab === "ط¥ط¹ط¯ط§ط¯ط§طھ ط¹ط§ظ…ط©";
  const items = isRemoteBranch
    ? settingsRows.branches
    : isRemoteCurrency
      ? settingsRows.currencies
      : isRemoteUser
        ? settingsRows.users
        : settings[key] || defaultSettings[key] || [];
  const isPermission = tab === "ط§ظ„طµظ„ط§ط­ظٹط§طھ";
  const isUser = isRemoteUser;
  const openAdd = () => {
    if (!currentCompanyId && (isRemoteBranch || isRemoteCurrency || isRemoteUser || isGeneralSettings)) return alert("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
    setDialog(
      isRemoteBranch
        ? { mode: "add", branch_code: "", branch_name: "", branch_type: "ظپط±ط¹", manager_name: "", phone: "", address: "", city: "", status: "ظ†ط´ط·", is_active: true, notes: "" }
        : isRemoteCurrency
          ? { mode: "add", currency_code: "", currency_name: "", currency_symbol: "", exchange_rate: 1, is_default: false, is_active: true, notes: "" }
          : isUser
            ? { mode: "add", name: "", username: "", password: "", role: "ط§ظ„ظ…ظˆط¸ظپ", employee_id: "", employee_name: "", branch: "", job: "", phone: "", email: "", is_active: true }
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
    if (!currentCompanyId && (isRemoteBranch || isRemoteCurrency || isUser)) return alert("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
    try {
      if (isRemoteBranch) {
        if (dialog.mode === "add" && settingsRows.branches.some((row) => String(row.branch_code || "").trim() === String(dialog.branch_code || "").trim())) return alert("ظ„ط§ ظٹظ…ظƒظ† طھظƒط±ط§ط± ظƒظˆط¯ ط§ظ„ظپط±ط¹ ط¯ط§ط®ظ„ ظ†ظپط³ ط§ظ„ط´ط±ظƒط©");
        const saved = dialog.mode === "add"
          ? await settingsBranchesService.createBranch(currentCompanyId, dialog)
          : await settingsBranchesService.updateBranch(currentCompanyId, dialog.id, dialog);
        setSettingsRows((state) => ({ ...state, branches: dialog.mode === "add" ? [saved, ...state.branches] : state.branches.map((row) => row.id === saved.id ? saved : row) }));
        setSettings((state) => ({ ...state, branches: [...new Set([...(state.branches || []), saved.branch_name].filter(Boolean))] }));
        setDialog(null);
        setSelected(null);
        alert(dialog.mode === "add" ? "طھظ… ط¥ط¶ط§ظپط© ط§ظ„ظپط±ط¹ ط¨ظ†ط¬ط§ط­" : "طھظ… طھط¹ط¯ظٹظ„ ط§ظ„ظپط±ط¹ ط¨ظ†ط¬ط§ط­");
        return;
      }
      if (isRemoteCurrency) {
        if (dialog.mode === "add" && settingsRows.currencies.some((row) => String(row.currency_code || "").trim().toUpperCase() === String(dialog.currency_code || "").trim().toUpperCase())) return alert("ظƒظˆط¯ ط§ظ„ط¹ظ…ظ„ط© ظ…ط³طھط®ط¯ظ… ظ…ط³ط¨ظ‚ظ‹ط§ ط¯ط§ط®ظ„ ظ‡ط°ظ‡ ط§ظ„ط´ط±ظƒط©");
        const saved = dialog.mode === "add"
          ? await settingsCurrenciesService.createCurrency(currentCompanyId, dialog)
          : await settingsCurrenciesService.updateCurrency(currentCompanyId, dialog.id, dialog);
        setSettingsRows((state) => ({ ...state, currencies: dialog.mode === "add" ? [saved, ...state.currencies.map((row) => saved.is_default ? { ...row, is_default: false } : row)] : state.currencies.map((row) => row.id === saved.id ? saved : saved.is_default ? { ...row, is_default: false } : row) }));
        setSettings((state) => ({ ...state, currencies: [...new Set([...(state.currencies || []), saved.currency_code].filter(Boolean))] }));
        setDialog(null);
        setSelected(null);
        alert(dialog.mode === "add" ? "طھظ… ط¥ط¶ط§ظپط© ط§ظ„ط¹ظ…ظ„ط© ط¨ظ†ط¬ط§ط­" : "طھظ… طھط¹ط¯ظٹظ„ ط§ظ„ط¹ظ…ظ„ط© ط¨ظ†ط¬ط§ط­");
        return;
      }
      if (isUser) {
        if (dialog.mode === "add" && settingsRows.users.some((row) => String(row.username || "").trim() === String(dialog.username || "").trim())) return alert("ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ظ…ظˆط¬ظˆط¯ ظ…ط³ط¨ظ‚ظ‹ط§ ط¯ط§ط®ظ„ ظ‡ط°ظ‡ ط§ظ„ط´ط±ظƒط©");
        const saved = dialog.mode === "add"
          ? await settingsUsersService.createUser(currentCompanyId, dialog)
          : await settingsUsersService.updateUser(currentCompanyId, dialog.user_id || dialog.id, dialog);
        setSettingsRows((state) => ({ ...state, users: dialog.mode === "add" ? [saved, ...state.users] : state.users.map((row) => row.user_id === saved.user_id ? saved : row) }));
        setDialog(null);
        setSelected(null);
        alert(dialog.mode === "add" ? "طھظ… ط¥ط¶ط§ظپط© ط§ظ„ظ…ط³طھط®ط¯ظ… ط¨ظ†ط¬ط§ط­" : "طھظ… طھط¹ط¯ظٹظ„ ط§ظ„ظ…ط³طھط®ط¯ظ… ط¨ظ†ط¬ط§ط­");
        return;
      }
    } catch (error) {
      alert(error.message || "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ");
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
  const deleteItem = async () => {
    if (selected === null) return;
    if (!currentCompanyId && (isRemoteBranch || isRemoteCurrency || isUser)) return alert("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
    if (isRemoteBranch) {
      const item = items[selected];
      if ((employees || []).some((employee) => employee.branch === item.branch_name)) return alert("ظ„ط§ ظٹظ…ظƒظ† ط­ط°ظپ ط§ظ„ظپط±ط¹ ظ„ط£ظ†ظ‡ ظ…ط±طھط¨ط· ط¨ظ…ظˆط¸ظپظٹظ†طŒ ظٹظ…ظƒظ†ظƒ طھط¹ط·ظٹظ„ظ‡ ط¨ط¯ظ„ظ‹ط§ ظ…ظ† ط§ظ„ط­ط°ظپ.");
      if (!confirm(`ظ‡ظ„ طھط±ظٹط¯ طھط¹ط·ظٹظ„ آ«${item.branch_name}آ»طں`)) return;
      try {
        const saved = await settingsBranchesService.deleteBranch(currentCompanyId, item.id, item);
        setSettingsRows((state) => ({ ...state, branches: state.branches.map((row) => row.id === saved.id ? saved : row) }));
        setSelected(null);
        alert("طھظ… ط­ط°ظپ ط§ظ„ظپط±ط¹ ط¨ظ†ط¬ط§ط­");
      } catch (error) {
        alert(error.message || "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ");
      }
      return;
    }
    if (isRemoteCurrency) {
      const item = items[selected];
      if (!confirm(`ظ‡ظ„ طھط±ظٹط¯ طھط¹ط·ظٹظ„ آ«${item.currency_name}آ»طں`)) return;
      try {
        const saved = await settingsCurrenciesService.deleteCurrency(currentCompanyId, item.id, item);
        setSettingsRows((state) => ({ ...state, currencies: state.currencies.map((row) => row.id === saved.id ? saved : row) }));
        setSelected(null);
        alert("طھظ… ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ظ†ط¬ط§ط­");
      } catch (error) {
        alert(error.message || "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ");
      }
      return;
    }
    if (isUser) {
      const item = items[selected];
      if (item.user_id === currentUser?.user_id || item.username === currentUser?.username) return alert("ظ„ط§ ظٹظ…ظƒظ† ط­ط°ظپ ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ط­ط§ظ„ظٹ.");
      if (!confirm(`ظ‡ظ„ طھط±ظٹط¯ طھط¹ط·ظٹظ„ ط§ظ„ظ…ط³طھط®ط¯ظ… آ«${item.username}آ»طں`)) return;
      try {
        const saved = await settingsUsersService.deleteUser(currentCompanyId, item.user_id, item);
        setSettingsRows((state) => ({ ...state, users: state.users.map((row) => row.user_id === saved.user_id ? saved : row) }));
        setSelected(null);
        alert("طھظ… ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ظ†ط¬ط§ط­");
      } catch (error) {
        alert(error.message || "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ");
      }
      return;
    }
    if ((tab === "ط§ظ„ظپط±ظˆط¹" || tab === "ط§ظ„ظˆط¸ط§ط¦ظپ") && items.length === 1) {
      alert("ظٹط¬ط¨ ط§ظ„ط¥ط¨ظ‚ط§ط، ط¹ظ„ظ‰ ط¹ظ†طµط± ظˆط§ط­ط¯ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„.");
      return;
    }
    const item = items[selected],
      name = isPermission || isUser ? item.name : item;
    if (!confirm(`ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط¢آ«${name}ط¢آ»طں`)) return;
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
                <Label t="ط§ظ„ط¨ط±ظٹط¯">
                  <input value={managerSafe.email || ""} onChange={(e) => setSettings({ ...settings, manager: { ...managerSafe, email: e.target.value } })} className="field mt-2" />
                </Label>
                <Label t="ط§ظ„ظ‡ط§طھظپ">
                  <input value={managerSafe.phone || ""} onChange={(e) => setSettings({ ...settings, manager: { ...managerSafe, phone: e.target.value } })} className="field mt-2" />
                </Label>
                <Label t="ظƒظ„ظ…ط© ظ…ط±ظˆط± ط¬ط¯ظٹط¯ط©">
                  <input type="password" value={managerSafe.newPassword || ""} onChange={(e) => setSettings({ ...settings, manager: { ...managerSafe, newPassword: e.target.value } })} className="field mt-2" />
                </Label>
                <Label t="طھط£ظƒظٹط¯ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±">
                  <input type="password" value={managerSafe.confirmPassword || ""} onChange={(e) => setSettings({ ...settings, manager: { ...managerSafe, confirmPassword: e.target.value } })} className="field mt-2" />
                </Label>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
                <span>ظٹطھظ… ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ… ظپظٹ Supabase ظ„ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©.</span>
                <button className="btn-primary" onClick={async () => {
                  if (!currentCompanyId) return alert("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
                  if ((managerSafe.newPassword || managerSafe.confirmPassword) && managerSafe.newPassword !== managerSafe.confirmPassword) return alert("طھط£ظƒظٹط¯ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± ظ…ط·ط§ط¨ظ‚");
                  try {
                    const adminUser = settingsRows.users.find((user) => String(user.role || "").includes("ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…")) || settingsRows.users[0] || {};
                    const saved = await settingsUsersService.updateUser(currentCompanyId, adminUser.user_id || `ADMIN-${currentCompanyId}`, {
                      ...adminUser,
                      name: managerSafe.name,
                      employee_name: managerSafe.name,
                      username: managerSafe.username,
                      role: managerSafe.role || "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…",
                      email: managerSafe.email || adminUser.email,
                      phone: managerSafe.phone || adminUser.phone,
                      password: managerSafe.newPassword || "",
                      is_active: true,
                    });
                    setSettingsRows((state) => ({ ...state, users: state.users.some((user) => user.user_id === saved.user_id) ? state.users.map((user) => user.user_id === saved.user_id ? saved : user) : [saved, ...state.users] }));
                    setSettings({ ...settings, manager: { ...managerSafe, newPassword: "", confirmPassword: "" } });
                    alert("طھظ… طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ… ط¨ظ†ط¬ط§ط­");
                  } catch (error) {
                    alert(error.message || "طھط¹ط°ط± طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھ ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…");
                  }
                }}><Save size={17} /> ط­ظپط¸ ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…</button>
              </div>
            </div>
          ) : tab === "ط§ظ„ط«ظٹظ… ظˆط§ظ„ط£ظ„ظˆط§ظ†" ? (
            <CompanyThemeFields
              theme={themeDraft}
              setTheme={(patch) => setThemeDraft((prev) => normalizeThemePayload({ ...prev, ...patch }))}
              canSave={canNode?.("theme_settings", "can_edit") !== false}
              onSave={async () => {
                try {
                  const saved = await themeService.saveCompanyTheme(currentCompany?.company_id, themeDraft);
                  setThemeDraft(saved);
                  applyCompanyTheme(saved);
                  alert("طھظ… ط­ظپط¸ ط£ظ„ظˆط§ظ† ط§ظ„ط«ظٹظ… ط¨ظ†ط¬ط§ط­");
                } catch (error) {
                  alert(error.message || "ظپط´ظ„ ط­ظپط¸ ط£ظ„ظˆط§ظ† ط§ظ„ط«ظٹظ…");
                }
              }}
              onReset={async () => {
                try {
                  const saved = await themeService.resetCompanyTheme(currentCompany?.company_id);
                  setThemeDraft(saved);
                  applyCompanyTheme(saved);
                  alert("طھظ… ط§ط³طھط¹ط§ط¯ط© ط§ظ„ط£ظ„ظˆط§ظ† ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©");
                } catch (error) {
                  alert(error.message || "ظپط´ظ„ ط­ظپط¸ ط£ظ„ظˆط§ظ† ط§ظ„ط«ظٹظ…");
                }
              }}
            />
          ) : isGeneralSettings ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-extrabold">ط¥ط¹ط¯ط§ط¯ط§طھ ط¹ط§ظ…ط©</h3>
                <p className="mt-1 text-xs text-slate-500">ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط´ط±ظƒط© ظˆط§ظ„طھظ‚ط§ط±ظٹط± ظˆط§ظ„ظ„ط؛ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["company_display_name", "ط§ط³ظ… ط§ظ„ط´ط±ظƒط© ط§ظ„ط¸ط§ظ‡ط±"],
                  ["default_language", "ط§ظ„ظ„ط؛ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©"],
                  ["default_currency", "ط§ظ„ط¹ظ…ظ„ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©"],
                  ["date_format", "طµظٹط؛ط© ط§ظ„طھط§ط±ظٹط®"],
                  ["time_zone", "ط§ظ„ظ…ظ†ط·ظ‚ط© ط§ظ„ط²ظ…ظ†ظٹط©"],
                  ["report_header_title", "ط¹ظ†ظˆط§ظ† طھط±ظˆظٹط³ط© ط§ظ„طھظ‚ط±ظٹط±"],
                  ["report_footer_note", "ظ…ظ„ط§ط­ط¸ط© طھط°ظٹظٹظ„ ط§ظ„طھظ‚ط±ظٹط±"],
                  ["logo_url", "ط±ط§ط¨ط· ط§ظ„ط´ط¹ط§ط±"],
                  ["primary_color", "ط§ظ„ظ„ظˆظ† ط§ظ„ط£ط³ط§ط³ظٹ"],
                  ["secondary_color", "ط§ظ„ظ„ظˆظ† ط§ظ„ط«ط§ظ†ظˆظٹ"],
                ].map(([field, label]) => (
                  <Label key={field} t={label}>
                    <input value={settingsRows.system?.[field] || ""} onChange={(e) => setSettingsRows((state) => ({ ...state, system: { ...(state.system || {}), [field]: e.target.value } }))} className="field mt-2" />
                  </Label>
                ))}
                <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold">
                  <input type="checkbox" checked={settingsRows.system?.enable_notifications !== false} onChange={(e) => setSettingsRows((state) => ({ ...state, system: { ...(state.system || {}), enable_notifications: e.target.checked } }))} />
                  طھظپط¹ظٹظ„ ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ
                </label>
              </div>
              <button className="btn-primary" onClick={async () => {
                if (!currentCompanyId) return alert("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
                try {
                  const saved = await systemSettingsService.saveSystemSettings(currentCompanyId, settingsRows.system || {});
                  setSettingsRows((state) => ({ ...state, system: saved }));
                  alert("طھظ… ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ظ†ط¬ط§ط­");
                } catch (error) {
                  alert(error.message || "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ");
                }
              }}><Save size={17} /> ط­ظپط¸ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط¹ط§ظ…ط©</button>
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
                  const name = isRemoteBranch ? item.branch_name : isRemoteCurrency ? item.currency_name : isPermission || isUser ? item.name : item,
                    description = isPermission
                      ? item.description
                      : isUser
                        ? `${item.username} â€¢ ${item.role}${item.employee_id ? ` â€¢ ${item.employee_id}` : ""} â€¢ ${item.is_active ? "ظ†ط´ط·" : "ظ…ط¹ط·ظ„"}`
                        : isRemoteBranch
                          ? `${item.branch_code} â€¢ ${item.branch_type || "ظپط±ط¹"} â€¢ ${item.city || "â€”"} â€¢ ${item.is_active ? "ظ†ط´ط·" : "ظ…ط¹ط·ظ„"}`
                          : isRemoteCurrency
                            ? `${item.currency_code} â€¢ ${item.currency_symbol || "â€”"} â€¢ ${item.exchange_rate} â€¢ ${item.is_default ? "ط§ظپطھط±ط§ط¶ظٹط©" : item.is_active ? "ظ†ط´ط·ط©" : "ظ…ط¹ط·ظ„ط©"}`
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
            {isRemoteBranch ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Label t="ظƒظˆط¯ ط§ظ„ظپط±ط¹"><input autoFocus value={dialog.branch_code || ""} onChange={(e) => setDialog({ ...dialog, branch_code: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ط³ظ… ط§ظ„ظپط±ط¹"><input value={dialog.branch_name || ""} onChange={(e) => setDialog({ ...dialog, branch_name: e.target.value })} className="field mt-2" /></Label>
                <Label t="ظ†ظˆط¹ ط§ظ„ظپط±ط¹"><input value={dialog.branch_type || ""} onChange={(e) => setDialog({ ...dialog, branch_type: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ظ„ظ…ط¯ظٹط±"><input value={dialog.manager_name || ""} onChange={(e) => setDialog({ ...dialog, manager_name: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ظ„ظ‡ط§طھظپ"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ظ„ظ…ط¯ظٹظ†ط©"><input value={dialog.city || ""} onChange={(e) => setDialog({ ...dialog, city: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ظ„ط¹ظ†ظˆط§ظ†"><input value={dialog.address || ""} onChange={(e) => setDialog({ ...dialog, address: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true", status: e.target.value === "true" ? "ظ†ط´ط·" : "ظ…ط¹ط·ظ„" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select></Label>
                <Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes || ""} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label>
              </div>
            ) : isRemoteCurrency ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Label t="ظƒظˆط¯ ط§ظ„ط¹ظ…ظ„ط©"><input autoFocus value={dialog.currency_code || ""} onChange={(e) => setDialog({ ...dialog, currency_code: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ط³ظ… ط§ظ„ط¹ظ…ظ„ط©"><input value={dialog.currency_name || ""} onChange={(e) => setDialog({ ...dialog, currency_name: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ظ„ط±ظ…ط²"><input value={dialog.currency_symbol || ""} onChange={(e) => setDialog({ ...dialog, currency_symbol: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط³ط¹ط± ط§ظ„طµط±ظپ"><input type="number" step="0.0001" value={dialog.exchange_rate || 1} onChange={(e) => setDialog({ ...dialog, exchange_rate: e.target.value })} className="field mt-2" /></Label>
                <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold"><input type="checkbox" checked={dialog.is_default === true} onChange={(e) => setDialog({ ...dialog, is_default: e.target.checked })} /> ط§ظ„ط¹ظ…ظ„ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©</label>
                <Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·ط©</option><option value="false">ظ…ط¹ط·ظ„ط©</option></select></Label>
                <Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes || ""} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label>
              </div>
            ) : isUser ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Label t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ظƒط§ظ…ظ„">
                  <input
                    autoFocus
                    value={dialog.name || ""}
                    onChange={(e) =>
                      setDialog({ ...dialog, name: e.target.value })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="ط§ط³ظ… ط§ظ„ط¯ط®ظˆظ„">
                  <input
                    value={dialog.username || ""}
                    onChange={(e) =>
                      setDialog({ ...dialog, username: e.target.value })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±">
                  <input
                    type="password"
                    value={dialog.password || ""}
                    onChange={(e) =>
                      setDialog({ ...dialog, password: e.target.value })
                    }
                    className="field mt-2"
                  />
                </Label>
                <Label t="ط§ظ„طµظ„ط§ط­ظٹط©">
                  <select
                    value={normalizeRoleName(dialog.role || "ط§ظ„ظ…ظˆط¸ظپ") || "ط§ظ„ظ…ظˆط¸ظپ"}
                    onChange={(e) =>
                      setDialog({ ...dialog, role: e.target.value })
                    }
                    className="field mt-2"
                  >
                    {getCleanRoleOptions((settings.permissions || defaultSettings.permissions).map((permission) => permission.name)).filter((role) => role && !isMojibakeText(role)).map(
                      (permission) => (
                        <option key={permission}>{permission}</option>
                      ),
                    )}
                  </select>
                </Label>
                <Label t="ط±ط¨ط· ط¨ط§ظ„ظ…ظˆط¸ظپ">
                  <select
                    value={dialog.employee_id || dialog.employeeId || ""}
                    onChange={(e) =>
                      setDialog({ ...dialog, employee_id: e.target.value, employee_name: employees.find((emp) => emp.id === e.target.value)?.name || dialog.employee_name })
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
                <Label t="ط§ظ„ظپط±ط¹"><input value={dialog.branch || ""} onChange={(e) => setDialog({ ...dialog, branch: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ظ„ظˆط¸ظٹظپط©"><input value={dialog.job || ""} onChange={(e) => setDialog({ ...dialog, job: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ظ„ظ‡ط§طھظپ"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ظ„ط¨ط±ظٹط¯"><input value={dialog.email || ""} onChange={(e) => setDialog({ ...dialog, email: e.target.value })} className="field mt-2" /></Label>
                <Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select></Label>
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
                        {detectCriterionTypeByName(c.name) === "cash_counting" && isCashDenominationCriterion(c.name) && c.subWeights && (
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
  const criterionName = String(dialog?.name || dialog?.criterion_name || dialog?.title || "");
  const criterionType = dialog?.criterion_type || detectCriterionTypeByName(criterionName);
  const showCashDenominationFields = criterionType === "cash_counting" && isCashDenominationCriterion(criterionName);
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
          <Label t="ظ†ظˆط¹ ط§ظ„ظ…ط¹ظٹط§ط±">
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
              <option value="behavioral">ط¥ط¯ط§ط±ظٹ / ط³ظ„ظˆظƒظٹ</option>
              <option value="operational">ط¥ظ†طھط§ط¬ظٹ / طھط´ط؛ظٹظ„ظٹ</option>
              <option value="cash_counting">ط¹ط¯ظ‘ ظ†ظ‚ط¯ظٹ / ط¹ط¯ط§ط¯</option>
              <option value="financial">ظ…ط§ظ„ظٹ</option>
              <option value="service_quality">ط¬ظˆط¯ط© ظˆط®ط¯ظ…ط© ط¹ظ…ظ„ط§ط،</option>
            </select>
          </Label>
          {showCashDenominationFields && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
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
          </div>}
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
        const sub = cashSubWeightsHtml(c);
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
        const sub = cashSubWeightsHtml(c);
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

function EnhancedTopEmployees({ employees, currentCompany, currentUser }) {
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!companyId) return undefined;
    setLoading(true);
    kpiScoresService.loadKpiScores(companyId, { month }, employees).then((result) => { if (alive) setRanked(result.ranking || []); }).catch((error) => { console.error("Employee of month KPI error:", error); if (alive) setRanked([]); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [companyId, month, employees]);
  const valid = [...ranked].filter((row) => Number.isFinite(Number(row.final_kpi_score ?? row.final_score))).sort((a, b) => Number(b.final_kpi_score ?? b.final_score) - Number(a.final_kpi_score ?? a.final_score) || Number(b.achievement_percentage || 0) - Number(a.achievement_percentage || 0) || Number(b.total_operations || b.operations?.total_operations || 0) - Number(a.total_operations || a.operations?.total_operations || 0));
  const positive = valid.filter((row) => Number(row.final_kpi_score ?? row.final_score) > 0);
  const best = positive[0] || valid[0] || null;
  const branchNames = [...new Set(valid.flatMap((row) => row.branches?.length ? row.branches : [row.branch]).filter(Boolean))];
  const winners = branchNames.map((branch) => valid.find((row) => row.branch === branch || row.branches?.includes(branch))).filter(Boolean);
  const printCertificate = (employee) => employee && printDocument("ط´ظ‡ط§ط¯ط© ظ…ظˆط¸ظپ ط§ظ„ط´ظ‡ط±", '<div class="cert"><h1 class="brand">ط´ظ‡ط§ط¯ط© طھظ‚ط¯ظٹط±</h1><p class="muted">طھظ…ظ†ط­ ظ‡ط°ظ‡ ط§ظ„ط´ظ‡ط§ط¯ط© ط¥ظ„ظ‰</p><p class="big">' + (employee.employee_name || '') + '</p><p>ط£ط¹ظ„ظ‰ ط¯ط±ط¬ط© KPI ظ†ظ‡ط§ط¦ظٹط© ظ…ط¹ ظ…ط±ط§ط¹ط§ط© ط§ظ„ط¥ظ†طھط§ط¬ظٹط© ظˆط¬ظˆط¯ط© ط§ظ„ط£ط¯ط§ط،: ' + Number(employee.final_kpi_score ?? employee.final_score).toFixed(2) + '%</p><h3>' + (employee.job || employee.job_name || '') + ' - ' + (employee.branch || '') + '</h3><p class="muted">' + APP_OFFICIAL_NAME + '</p></div>');
  return (
    <div className="space-y-5">
      <PageHead title="ظ…ظˆط¸ظپ ط§ظ„ط´ظ‡ط±" desc="ط§ظ„ط§ط®طھظٹط§ط± ظ…ظ† ظ‚ط§ط¦ظ…ط© KPI ط§ظ„ظ…ظˆط­ط¯ط© ظ„ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ط¹طھظ…ط¯ط© ط§ظ„ط¯ط§ط®ظ„ط© ظپظٹ KPI ظپظ‚ط·" action={<div className="flex gap-2"><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="field max-w-[170px]" /><button disabled={!best} onClick={() => printCertificate(best)} className="btn-secondary"><Printer size={17} /> ط·ط¨ط§ط¹ط© ط´ظ‡ط§ط¯ط© ط§ظ„ظ…ظˆط¸ظپ ط§ظ„ط£ظˆظ„</button></div>} />
      {loading && <div className="panel p-6 text-center">ط¬ط§ط±ظٹ ط§ط­طھط³ط§ط¨ KPI...</div>}
      {!loading && !best && <div className="rounded-xl bg-amber-50 p-5 font-bold text-amber-700">ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظƒط§ظپظٹط© ظ„ط§ط®طھظٹط§ط± ظ…ظˆط¸ظپ ط§ظ„ط´ظ‡ط±.</div>}
      {best && <div className="rounded-3xl bg-gradient-to-l from-brand-900 to-[#26151a] p-8 text-white"><div className="flex flex-col items-center gap-6 sm:flex-row"><div className="grid h-28 w-28 place-items-center rounded-full border-4 border-amber-300 bg-white/10 text-3xl font-bold">{best.employee_name?.split(" ").slice(0, 2).map((x) => x[0]).join("")}</div><div><span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">ط§ظ„ط£ظپط¶ظ„ ط¹ظ„ظ‰ ظ…ط³طھظˆظ‰ ط§ظ„ط´ط±ظƒط©</span><h2 className="mt-4 text-3xl font-extrabold">{best.employee_name}</h2><p className="mt-2 text-red-100/70">{best.job || best.job_name} â€¢ {best.branches?.length ? best.branches.join("طŒ ") : best.branch}</p><p className="mt-3">ظ†ط³ط¨ط© ط§ظ„ط¥ظ†ط¬ط§ط²: {best.achievement_percentage}% {best.achievement_percentage > 100 ? "â€¢ ظ…طھط¬ط§ظˆط² ط§ظ„ظ‡ط¯ظپ" : ""}</p><p className="mt-4 text-sm text-red-100/80">ط³ط¨ط¨ ط§ظ„ط§ط®طھظٹط§ط±: ط£ط¹ظ„ظ‰ ط¯ط±ط¬ط© KPI ظ†ظ‡ط§ط¦ظٹط© ظ…ط¹ ظ…ط±ط§ط¹ط§ط© ط§ظ„ط¥ظ†طھط§ط¬ظٹط© ظˆط¬ظˆط¯ط© ط§ظ„ط£ط¯ط§ط،.</p></div><b className="text-5xl text-amber-300 sm:mr-auto">{Number(best.final_kpi_score ?? best.final_score).toFixed(2)}%</b></div></div>}
      <div className="panel p-5"><h3 className="mb-4 text-lg font-extrabold">ط£ظپط¶ظ„ ظ…ظˆط¸ظپ ظپظٹ ظƒظ„ ظپط±ط¹</h3><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{winners.map((x, i) => <div key={(x.branch || "branch") + x.employee_id} className="rounded-2xl border p-4"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 font-bold text-brand-700">{i + 1}</div><div><b>{x.employee_name}</b><p className="text-xs text-slate-500">{x.branch} â€¢ {x.job || x.job_name}</p></div><b className="mr-auto text-xl text-brand-700">{Number(x.final_kpi_score ?? x.final_score).toFixed(2)}%</b></div></div>)}</div></div>
      <div className="panel p-5"><h3 className="mb-4 text-lg font-extrabold">ط£ظپط¶ظ„ 10 ظ…ظˆط¸ظپظٹظ† ط­ط³ط¨ KPI ظˆط§ظ„ط¥ظ†طھط§ط¬ظٹط©</h3><p className="mb-4 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-800">ط¹ظ†ط¯ طھط³ط§ظˆظٹ ط¯ط±ط¬ط© KPI ط§ظ„ظ†ظ‡ط§ط¦ظٹط©طŒ ظٹطھظ… طھط±طھظٹط¨ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط­ط³ط¨ ظ†ط³ط¨ط© ط§ظ„ط¥ظ†ط¬ط§ط² ط«ظ… ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ.</p>{valid.length > 0 && valid.filter((row) => Number(row.final_kpi_score ?? row.final_score) === 100).length / valid.length > 0.5 && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">ظٹط¨ط¯ظˆ ط£ظ† ط§ظ„ظ…ط³طھظ‡ط¯ظپ ط§ظ„ط­ط§ظ„ظٹ ظ…ظ†ط®ظپط¶ ظ…ظ‚ط§ط±ظ†ط© ط¨ط§ظ„ط¥ظ†طھط§ط¬ ط§ظ„ظپط¹ظ„ظٹطŒ ظٹظˆطµظ‰ ط¨ظ…ط±ط§ط¬ط¹ط© ظ…ط³طھظ‡ط¯ظپط§طھ ط§ظ„ظˆط¸ط§ط¦ظپ ظˆط§ظ„ظپط±ظˆط¹.</p>}<div className="table-wrap"><table><thead><tr><th>ط§ظ„طھط±طھظٹط¨</th><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ظپط±ط¹ / ط§ظ„ظپط±ظˆط¹</th><th>ط§ظ„ظˆط¸ظٹظپط©</th><th>ط¯ط±ط¬ط© KPI ط§ظ„ظ†ظ‡ط§ط¦ظٹط©</th><th>ظ†ط³ط¨ط© ط§ظ„ط¥ظ†ط¬ط§ط²</th><th>ط§ظ„ط¹ظ…ظ„ظٹط§طھ</th><th>ط§ظ„ظ‡ط¯ظپ</th></tr></thead><tbody>{valid.slice(0, 10).map((x, i) => <tr key={x.employee_id}><td>{i + 1}</td><td className="font-bold">{x.employee_name}</td><td>{x.branches?.length ? x.branches.join("طŒ ") : x.branch}</td><td>{x.job || x.job_name}</td><td>{Number(x.final_kpi_score ?? x.final_score).toFixed(2)}%</td><td>{x.achievement_percentage}%</td><td>{x.total_operations ?? x.operations?.total_operations ?? 0}</td><td>{x.target_operations}</td></tr>)}</tbody></table></div></div>
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

function EnhancedEmployees({ employees, setEmployees, setEvaluations, settings, currentUser, currentCompany, can }) {
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("ط§ظ„ظƒظ„");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailsEmployee, setDetailsEmployee] = useState(null);
  const [selected, setSelected] = useState([]);
  const canViewFinancial = isPlatformAdminUser() || currentUser?.is_platform_admin === true || can?.("employees", "can_view_financial") === true || can?.("hr_salary", "can_view_financial") === true;
  const employeeBranchOptions = [...new Set([
    ...(settings?.branches || []).map((item) => typeof item === "string" ? item : item?.branch_name || item?.name),
    ...employees.map((employee) => employee.branch),
  ].filter(Boolean))];
  const employeeJobOptions = [...new Set([
    ...(settings?.jobs || []).map((item) => typeof item === "string" ? item : item?.name || item?.job_name),
    ...(settings?.jobDefinitions || []).map((item) => item?.name || item?.job_name),
    ...employees.map((employee) => employee.job),
  ].filter(Boolean))];
  const employeeManagerOptions = [...new Set(employees.filter((employee) => employee.status === "ظ†ط´ط·").map((employee) => employee.name).filter(Boolean))];
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
              placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..."
            />
          </label>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="field max-w-[190px]">
            <option>ط§ظ„ظƒظ„</option>
            {employeeBranchOptions.map((x) => <option key={x}>{x}</option>)}
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
                {canViewFinancial && <th>ط§ظ„ط±ط§طھط¨</th>}
                <th>ط§ظ„ط­ط§ظ„ط©</th>
                <th>ط§ظ„ظ…ط¯ظٹط± ط§ظ„ظ…ط¨ط§ط´ط±</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} onClick={() => setDetailsEmployee(e)} className={`${selected.includes(e.id) ? "bg-brand-50" : ""} cursor-pointer hover:bg-slate-50`}>
                  <td onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} /></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar employee={e} size="sm" onClick={(event) => { event.stopPropagation(); setDetailsEmployee(e); }} />
                      <div>
                        <button type="button" onClick={(event) => { event.stopPropagation(); setDetailsEmployee(e); }} className="font-extrabold text-slate-900 hover:text-brand-700">{e.name}</button>
                        <p className="text-xs text-slate-400">{e.id} â€¢ {e.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td>{e.branch}</td>
                  <td>{e.job}</td>
                  <td>{e.hireDate}</td>
                  {canViewFinancial && <td className="font-bold">{money(e.salary)}</td>}
                  <td><Status>{e.status}</Status></td>
                  <td>{e.manager}</td>
                  <td onClick={(event) => event.stopPropagation()}>
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
      {detailsEmployee && (
        <EmployeeDetailsModal
          employee={detailsEmployee}
          close={() => setDetailsEmployee(null)}
          setEmployees={setEmployees}
          onEdit={() => {
            setEditing(detailsEmployee);
            setDetailsEmployee(null);
            setModal(true);
          }}
          currentUser={currentUser}
          currentCompany={currentCompany}
          can={can}
        />
      )}
      {modal && <EmployeeModal
        editing={editing}
        close={() => setModal(false)}
        setEmployees={setEmployees}
        branchOptions={employeeBranchOptions}
        jobOptions={employeeJobOptions}
        managerOptions={employeeManagerOptions}
        canViewFinancial={canViewFinancial}
        currentCompany={currentCompany}
        currentUser={currentUser}
        onSaved={(saved, previous) => activityLogsService.logUserActivity({
          company_id: currentCompany?.company_id,
          user_id: currentUser?.id || currentUser?.user_id,
          username: currentUser?.username,
          user_name: currentUser?.name,
          user_role: currentUser?.role,
          module_key: "hr",
          module_name: "ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©",
          page_key: "employees",
          page_name: "ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط¸ظپظٹظ†",
          action_type: previous ? "update" : "create",
          action_label: previous ? "طھط¹ط¯ظٹظ„ ظ…ظˆط¸ظپ" : "ط¥ط¶ط§ظپط© ظ…ظˆط¸ظپ",
          description: `${previous ? "طھظ… طھط¹ط¯ظٹظ„" : "طھظ…طھ ط¥ط¶ط§ظپط©"} ط³ط¬ظ„ ط§ظ„ظ…ظˆط¸ظپ ${saved?.name || saved?.id || ""}`,
          entity_type: "employee",
          entity_id: saved?.id,
          severity: "ظ…طھظˆط³ط·",
        })}
      />}
    </div>
	  );
	}
	
function EmployeeDetailsModal({ employee, close, onEdit, currentUser, currentCompany, can, setEmployees, initialPanel = "profile" }) {
  const [activePanel, setActivePanel] = useState(initialPanel || "profile");
  const [panelRows, setPanelRows] = useState([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelMessage, setPanelMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [linkForm, setLinkForm] = useState({ user_id: "", username: "", password: "", role: "ط§ظ„ظ…ظˆط¸ظپ" });
  const [passwordForm, setPasswordForm] = useState({ user_id: "", password: "", confirm: "" });
  const platformAdmin = isPlatformAdminUser(currentUser) || currentUser?.is_platform_admin === true;
  const sameCompany = platformAdmin || !currentCompany?.company_id || !employee?.company_id || employee.company_id === currentCompany.company_id;
  const canEditEmployee = sameCompany && (platformAdmin || can?.("employees", "can_edit") !== false);
  const canDeactivateEmployee = sameCompany && (platformAdmin || can?.("employees", "can_delete") === true || can?.("employees", "can_manage") === true || can?.("employees", "can_edit") === true);
  const canViewFinancial = platformAdmin || can?.("employees", "can_view_financial") === true || can?.("hr_salary", "can_view_financial") === true;
  const canResetPassword = sameCompany && (platformAdmin || can?.("users_permissions", "can_reset_user_password") === true || can?.("system_users", "can_reset_user_password") === true);
  const companyId = currentCompany?.company_id || employee?.company_id || currentUser?.company_id || "";
  const linkedUsers = users.filter((user) => String(user.employee_id || "") === String(employee.id || ""));
  const details = [
    ["ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط¸ظٹظپظٹ", employee.id],
    ["ط§ظ„ط§ط³ظ…", employee.name],
    ["ط§ظ„ظ‡ط§طھظپ", employee.phone],
    ["ط§ظ„ظ†ظˆط¹", employee.gender || "ط؛ظٹط± ظ…ط­ط¯ط¯"],
    ["ط§ظ„ظپط±ط¹", employee.branch],
    ["ط§ظ„ط¥ط¯ط§ط±ط©", employee.department || employee.administration || "ط؛ظٹط± ظ…ط­ط¯ط¯"],
    ["ط§ظ„ظ‚ط³ظ…", employee.department || "ط؛ظٹط± ظ…ط­ط¯ط¯"],
    ["ط§ظ„ظˆط¸ظٹظپط© / ط§ظ„ظ…ط³ظ…ظ‰ ط§ظ„ظˆط¸ظٹظپظٹ", employee.job || employee.job_title],
    ["ط§ظ„ظ…ط¯ظٹط± ط§ظ„ظ…ط¨ط§ط´ط±", employee.manager || employee.direct_manager || "ط؛ظٹط± ظ…ط­ط¯ط¯"],
    ["طھط§ط±ظٹط® ط§ظ„طھظˆط¸ظٹظپ", employee.hireDate || employee.hire_date || "ط؛ظٹط± ظ…ط­ط¯ط¯"],
    ...(canViewFinancial ? [["ط§ظ„ط±ط§طھط¨", money(employee.salary || 0)]] : []),
    ["ط§ظ„ط­ط§ظ„ط©", employee.status],
  ];

  const openPanel = async (panel) => {
    setPanelMessage("");
    setPanelRows([]);
    if (!sameCompany && panel !== "profile") {
      setActivePanel(panel);
      setPanelMessage("ظ„ط§ ظٹظ…ظƒظ†ظƒ ط¥ط¯ط§ط±ط© ظ…ظˆط¸ظپ طھط§ط¨ط¹ ظ„ط´ط±ظƒط© ط£ط®ط±ظ‰");
      return;
    }
    if (panel === "financial" && !canViewFinancial) {
      setActivePanel(panel);
      setPanelMessage("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط¹ط±ط¶ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط§ظ„ظٹط©");
      return;
    }
    if (panel === "password" && !canResetPassword) {
      setActivePanel(panel);
      setPanelMessage("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±");
      return;
    }
    setActivePanel(panel);
    if (panel === "financial") {
      activityLogsService.logUserActivity({
        company_id: companyId,
        user_id: currentUser?.id || currentUser?.user_id,
        username: currentUser?.username,
        user_name: currentUser?.name,
        user_role: currentUser?.role,
        module_key: "hr",
        module_name: "ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©",
        page_key: "employees",
        page_name: "ظ…ظ„ظپ ط§ظ„ظ…ظˆط¸ظپ",
        action_type: "financial_view",
        action_label: "ط¹ط±ط¶ ط¨ظٹط§ظ†ط§طھ ظ…ط§ظ„ظٹط©",
        description: `طھظ… ظپطھط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط§ظ„ظٹط© ظ„ظ„ظ…ظˆط¸ظپ ${employee.id}`,
        entity_type: "employee",
        entity_id: employee.id,
        severity: "ط­ط³ط§ط³",
      });
    }
    if (panel === "documents") await loadHrPanel("hr_files", "ظ„ط§ طھظˆط¬ط¯ ظˆط«ط§ط¦ظ‚ ظ…ط±ظپظ‚ط© ظ„ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپ");
    if (panel === "movements") setPanelMessage("ظ„ط§ طھظˆط¬ط¯ ط­ط±ظƒط§طھ ظ…ط³ط¬ظ„ط© ظ„ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپ");
    if (panel === "dependents") setPanelMessage("ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ طھط§ط¨ط¹ظٹظ† ظ„ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپ");
    if (panel === "link" || panel === "password") await loadEmployeeUsers(panel);
  };

  const loadHrPanel = async (pageKey, emptyMessage) => {
    setPanelLoading(true);
    try {
      const result = await hrRecordsService.load(pageKey, companyId);
      const rows = (result.rows || []).filter((row) =>
        String(row.employee_id || row.employeeId || "") === String(employee.id || "") ||
        String(row.employee_name || row.name || "") === String(employee.name || "")
      );
      setPanelRows(rows);
      setPanelMessage(rows.length ? "" : emptyMessage);
    } catch (error) {
      setPanelMessage(error.message || emptyMessage);
    } finally {
      setPanelLoading(false);
    }
  };

  const loadEmployeeUsers = async (panel) => {
    setPanelLoading(true);
    try {
      const rows = platformAdmin
        ? await supabase.select("app_users", `company_id=eq.${encodeURIComponent(companyId)}&is_platform_admin=eq.false&select=*&order=username.asc`)
        : await settingsUsersService.loadUsers(companyId);
      const normalized = (rows || []).map(settingsUserFromDb ? settingsUserFromDb : (row) => row);
      setUsers(normalized);
      const linked = normalized.find((user) => String(user.employee_id || "") === String(employee.id || ""));
      setLinkForm({
        user_id: linked?.user_id || "",
        username: linked?.username || "",
        password: "",
        role: linked?.role || "ط§ظ„ظ…ظˆط¸ظپ",
      });
      setPasswordForm((form) => ({ ...form, user_id: linked?.user_id || "" }));
      if (panel === "password" && !linked) setPanelMessage("ظ„ط§ ظٹظˆط¬ط¯ ط­ط³ط§ط¨ ظ…ط³طھط®ط¯ظ… ظ…ط±طھط¨ط· ط¨ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپ");
    } catch (error) {
      setPanelMessage(error.message || "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط­ط³ط§ط¨ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†");
    } finally {
      setPanelLoading(false);
    }
  };

  useEffect(() => {
    if (initialPanel && initialPanel !== "profile") openPanel(initialPanel);
  }, [initialPanel, employee?.id]);

  const saveUserLink = async (event) => {
    event.preventDefault();
    if (!sameCompany) return setPanelMessage("ظ„ط§ ظٹظ…ظƒظ†ظƒ ط¥ط¯ط§ط±ط© ظ…ظˆط¸ظپ طھط§ط¨ط¹ ظ„ط´ط±ظƒط© ط£ط®ط±ظ‰");
    if (!linkForm.user_id && !linkForm.username.trim()) return setPanelMessage("ط§ط®طھط± ط­ط³ط§ط¨ط§ظ‹ ط£ظˆ ط£ط¯ط®ظ„ ط§ط³ظ… ظ…ط³طھط®ط¯ظ… ط¬ط¯ظٹط¯");
    if (!linkForm.user_id && !String(linkForm.password || "").trim()) return setPanelMessage("ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظ…ط·ظ„ظˆط¨ط© ط¹ظ†ط¯ ط¥ظ†ط´ط§ط، ظ…ط³طھط®ط¯ظ… ط¬ط¯ظٹط¯.");
    setPanelLoading(true);
    try {
      const existing = users.find((user) => user.user_id === linkForm.user_id);
      if (existing) {
        await settingsUsersService.updateUser(companyId, existing.user_id, {
          ...existing,
          employee_id: employee.id,
          employee_name: employee.name,
          name: employee.name,
          branch: employee.branch,
          job: employee.job,
          phone: employee.phone,
        });
      } else {
        const payload = {
          user_id: `USR-${Date.now()}`,
          company_id: companyId,
          name: employee.name,
          username: linkForm.username.trim(),
          password: String(linkForm.password || "").trim(),
          role: linkForm.role || "ط§ظ„ظ…ظˆط¸ظپ",
          employee_id: employee.id,
          employee_name: employee.name,
          branch: employee.branch || "",
          job: employee.job || "",
          phone: employee.phone || "",
          is_active: true,
          is_platform_admin: false,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        const isCreate = true;
        if (isCreate && !String(payload.password || "").trim()) throw new Error("ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظ…ط·ظ„ظˆط¨ط© ط¹ظ†ط¯ ط¥ظ†ط´ط§ط، ظ…ط³طھط®ط¯ظ… ط¬ط¯ظٹط¯.");
        console.error("app_users write debug", { mode: "create", payloadKeys: Object.keys(payload), username: payload.username, hasPassword: Boolean(payload.password), role: payload.role });
        const { error } = await supabase.from("app_users").upsert(payload, { onConflict: "user_id" }).select().single();
        if (error) throw error;
      }
      setPanelMessage("طھظ… ط±ط¨ط· ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ… ط¨ط§ظ„ظ…ظˆط¸ظپ ط¨ظ†ط¬ط§ط­");
      await loadEmployeeUsers("link");
    } catch (error) {
      setPanelMessage(error.message || "طھط¹ط°ط± ط±ط¨ط· ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ…");
    } finally {
      setPanelLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (!canResetPassword) return setPanelMessage("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±");
    if (!passwordForm.user_id) return setPanelMessage("ط§ط®طھط± ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ… ط£ظˆظ„ط§ظ‹");
    if (passwordForm.password.length < 8) return setPanelMessage("ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظٹط¬ط¨ ط£ظ„ط§ طھظ‚ظ„ ط¹ظ† 8 ط£ط­ط±ظپ");
    if (passwordForm.password !== passwordForm.confirm) return setPanelMessage("طھط£ظƒظٹط¯ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± ظ…ط·ط§ط¨ظ‚");
    setPanelLoading(true);
    try {
      await settingsUsersService.resetUserPassword(companyId, passwordForm.user_id, passwordForm.password);
      activityLogsService.logUserActivity({
        company_id: companyId,
        user_id: currentUser?.id || currentUser?.user_id,
        username: currentUser?.username,
        user_name: currentUser?.name,
        user_role: currentUser?.role,
        module_key: "hr",
        module_name: "ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©",
        page_key: "employees",
        page_name: "ظ…ظ„ظپ ط§ظ„ظ…ظˆط¸ظپ",
        action_type: "password_reset",
        action_label: "طھط؛ظٹظٹط± ظƒظ„ظ…ط© ظ…ط±ظˆط± ظ…ط³طھط®ط¯ظ…",
        description: `طھظ… طھط؛ظٹظٹط± ظƒظ„ظ…ط© ظ…ط±ظˆط± ط§ظ„ط­ط³ط§ط¨ ط§ظ„ظ…ط±طھط¨ط· ط¨ط§ظ„ظ…ظˆط¸ظپ ${employee.id}`,
        entity_type: "employee",
        entity_id: employee.id,
        severity: "ط­ط³ط§ط³",
      });
      setPasswordForm({ user_id: passwordForm.user_id, password: "", confirm: "" });
      setPanelMessage("طھظ… طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط¨ظ†ط¬ط§ط­");
    } catch (error) {
      setPanelMessage(error.message || "طھط¹ط°ط± طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±");
    } finally {
      setPanelLoading(false);
    }
  };

  const startTermination = async () => {
    if (!canEditEmployee) return setPanelMessage("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھط¹ط¯ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپ");
    if (!confirm("ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط¨ط¯ط، ط¥ط¬ط±ط§ط، ط¥ظ†ظ‡ط§ط، ط®ط¯ظ…ط© ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپطں")) return;
    setActivePanel("termination");
    setPanelLoading(true);
    try {
      await hrRecordsService.save("hr_termination", companyId, {
        employee_name: employee.name,
        branch: employee.branch,
        termination_type: "ط¥ظ†ظ‡ط§ط، ط®ط¯ظ…ط©",
        last_working_day: new Date().toISOString().slice(0, 10),
        reason: "",
        settlement_amount: 0,
        clearance_status: "ظ‚ظٹط¯ ط§ظ„ط¥ط¬ط±ط§ط،",
        status: "ظ‚ظٹط¯ ط§ظ„ط¥ط¬ط±ط§ط،",
        notes: `طھظ… ط¨ط¯ط، ط§ظ„ط¥ط¬ط±ط§ط، ظ…ظ† ظ…ظ„ظپ ط§ظ„ظ…ظˆط¸ظپ ${employee.id}`,
      });
      setPanelMessage("طھظ… ط¨ط¯ط، ط¥ط¬ط±ط§ط، ط¥ظ†ظ‡ط§ط، ط§ظ„ط®ط¯ظ…ط© ط¨ظ†ط¬ط§ط­");
    } catch (error) {
      setPanelMessage(error.message || "طھط¹ط°ط± ط¨ط¯ط، ط¥ط¬ط±ط§ط، ط¥ظ†ظ‡ط§ط، ط§ظ„ط®ط¯ظ…ط©");
    } finally {
      setPanelLoading(false);
    }
  };

  const deactivateEmployee = async () => {
    if (!canDeactivateEmployee) return setPanelMessage("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط¥ظ„ط؛ط§ط، طھظپط¹ظٹظ„ ط§ظ„ظ…ظˆط¸ظپ");
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط¥ظ„ط؛ط§ط، طھظپط¹ظٹظ„ ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپطں")) return;
    setPanelLoading(true);
    try {
      const next = { ...employee, status: "ط؛ظٹط± ظ†ط´ط·", is_active: false };
      setEmployees?.((list) => list.map((item) => item.id === employee.id ? next : item));
      activityLogsService.logUserActivity({
        company_id: companyId,
        user_id: currentUser?.id || currentUser?.user_id,
        username: currentUser?.username,
        user_name: currentUser?.name,
        user_role: currentUser?.role,
        module_key: "hr",
        module_name: "ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©",
        page_key: "employees",
        page_name: "ظ…ظ„ظپ ط§ظ„ظ…ظˆط¸ظپ",
        action_type: "employee_status_change",
        action_label: "ط¥ظ„ط؛ط§ط، طھظپط¹ظٹظ„ ظ…ظˆط¸ظپ",
        description: `طھظ… ط¥ظ„ط؛ط§ط، طھظپط¹ظٹظ„ ط§ظ„ظ…ظˆط¸ظپ ${employee.id}`,
        entity_type: "employee",
        entity_id: employee.id,
        severity: "ظ…ط±طھظپط¹",
      });
      setPanelMessage("طھظ… ط¥ظ„ط؛ط§ط، طھظپط¹ظٹظ„ ط§ظ„ظ…ظˆط¸ظپ ط¨ظ†ط¬ط§ط­");
    } catch (error) {
      setPanelMessage(error.message || "طھط¹ط°ط± ط¥ظ„ط؛ط§ط، طھظپط¹ظٹظ„ ط§ظ„ظ…ظˆط¸ظپ");
    } finally {
      setPanelLoading(false);
    }
  };

  const actions = [
    ["ط¹ط±ط¶", false, () => openPanel("profile")],
    ["طھط¹ط¯ظٹظ„", !canEditEmployee, onEdit],
    ["ط¨ظٹط§ظ†ط§طھ ظ…ط§ظ„ظٹط©", false, () => openPanel("financial")],
    ["ط§ظ„ط­ط±ظƒط§طھ", false, () => openPanel("movements")],
    ["ظˆط«ط§ط¦ظ‚ ط§ظ„ظ…ظˆط¸ظپ", false, () => openPanel("documents")],
    ["ط¥ظ†ظ‡ط§ط، ط§ظ„ط®ط¯ظ…ط©", !canEditEmployee, startTermination],
    ["ط§ظ„طھط§ط¨ط¹ظٹظ†", false, () => openPanel("dependents")],
    ["ط±ط¨ط· ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ…", !canEditEmployee, () => openPanel("link")],
    ["طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±", false, () => openPanel("password")],
    ["ط¥ظ„ط؛ط§ط، ط§ظ„طھظپط¹ظٹظ„", !canDeactivateEmployee, deactivateEmployee],
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" dir="rtl">
      <div className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-0">
        <div className="flex items-center gap-3 border-b p-5">
          <div>
            <p className="text-xs font-bold text-slate-400">ظ…ظ„ظپ ط§ظ„ظ…ظˆط¸ظپ</p>
            <h3 className="text-xl font-extrabold">{employee.name}</h3>
          </div>
          <button type="button" onClick={close} className="mr-auto rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="ط¥ط؛ظ„ط§ظ‚">
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
          <aside className="border-b bg-slate-50 p-6 lg:border-b-0 lg:border-l">
            <div className="flex flex-col items-center text-center">
              <EmployeeAvatar employee={employee} size="lg" />
              <h4 className="mt-4 text-lg font-extrabold">{employee.name}</h4>
              <p className="mt-1 text-sm text-slate-500">{employee.job || "ط؛ظٹط± ظ…ط­ط¯ط¯"}</p>
              <p className="mt-1 text-xs text-slate-400">{employee.branch || "ط؛ظٹط± ظ…ط­ط¯ط¯"}</p>
              <div className="mt-4"><Status>{employee.status || "ط؛ظٹط± ظ…ط­ط¯ط¯"}</Status></div>
            </div>
          </aside>
          <section className="space-y-5 p-6">
            {!sameCompany && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپ طھط§ط¨ط¹ ظ„ط´ط±ظƒط© ط£ط®ط±ظ‰طŒ ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ ط§ظ„ط¥ط¯ط§ط±ظٹط© ظ…ظ‚ظٹط¯ط©.</div>}
            <div className="overflow-hidden rounded-2xl border">
              <table className="w-full">
                <tbody>
                  {details.map(([label, value]) => (
                    <tr key={label} className="border-b last:border-0">
                      <th className="w-48 bg-slate-50 px-4 py-3 text-right text-xs text-slate-500">{label}</th>
                      <td className="px-4 py-3 text-sm font-bold text-slate-700">{value || "ط؛ظٹط± ظ…ط­ط¯ط¯"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <h4 className="font-extrabold">
                  {activePanel === "profile" && "ط¹ط±ط¶ ظ…ظ„ظپ ط§ظ„ظ…ظˆط¸ظپ"}
                  {activePanel === "financial" && "ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط§ظ„ظٹط©"}
                  {activePanel === "movements" && "ط­ط±ظƒط§طھ ط§ظ„ظ…ظˆط¸ظپ"}
                  {activePanel === "documents" && "ظˆط«ط§ط¦ظ‚ ط§ظ„ظ…ظˆط¸ظپ"}
                  {activePanel === "termination" && "ط¥ظ†ظ‡ط§ط، ط§ظ„ط®ط¯ظ…ط©"}
                  {activePanel === "dependents" && "ط§ظ„طھط§ط¨ط¹ظٹظ†"}
                  {activePanel === "link" && "ط±ط¨ط· ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ…"}
                  {activePanel === "password" && "طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"}
                </h4>
                {panelLoading && <span className="mr-auto text-xs font-bold text-slate-400">ط¬ط§ط±ظٹ ط§ظ„ظ…ط¹ط§ظ„ط¬ط©...</span>}
              </div>
              {panelMessage && <div className="mb-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-700">{panelMessage}</div>}
              {activePanel === "profile" && (
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <Info t="ط§ظ„ظ…ظˆط¸ظپ" v={employee.name} />
                  <Info t="ط§ظ„ظˆط¸ظٹظپط©" v={employee.job || "ط؛ظٹط± ظ…ط­ط¯ط¯"} />
                  <Info t="ط§ظ„ظپط±ط¹" v={employee.branch || "ط؛ظٹط± ظ…ط­ط¯ط¯"} />
                </div>
              )}
              {activePanel === "financial" && canViewFinancial && (
                <div className="grid gap-3 md:grid-cols-3">
                  <Mini label="ط§ظ„ط±ط§طھط¨ ط§ظ„ط­ط§ظ„ظٹ" value={money(employee.salary || 0)} I={Wallet} />
                  <Mini label="ط§ظ„ط­ط§ظ„ط©" value={employee.status || "ط؛ظٹط± ظ…ط­ط¯ط¯"} I={BadgeCheck} />
                  <Mini label="طھط§ط±ظٹط® ط§ظ„طھظˆط¸ظٹظپ" value={employee.hireDate || employee.hire_date || "ط؛ظٹط± ظ…ط­ط¯ط¯"} I={CalendarCheck} />
                </div>
              )}
              {(activePanel === "movements" || activePanel === "dependents") && !panelRows.length && !panelLoading && !panelMessage && (
                <p className="text-sm font-bold text-slate-500">{activePanel === "movements" ? "ظ„ط§ طھظˆط¬ط¯ ط­ط±ظƒط§طھ ظ…ط³ط¬ظ„ط© ظ„ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپ" : "ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ طھط§ط¨ط¹ظٹظ† ظ„ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپ"}</p>
              )}
              {activePanel === "documents" && panelRows.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>ظ†ظˆط¹ ط§ظ„ظˆط«ظٹظ‚ط©</th><th>ط±ظ‚ظ… ط§ظ„ظˆط«ظٹظ‚ط©</th><th>طھط§ط±ظٹط® ط§ظ„ط¥طµط¯ط§ط±</th><th>طھط§ط±ظٹط® ط§ظ„ط§ظ†طھظ‡ط§ط،</th><th>ط§ظ„ط­ط§ظ„ط©</th></tr></thead>
                    <tbody>{panelRows.map((row, index) => <tr key={row.id || row.document_number || index}><td>{row.document_type}</td><td>{row.document_number}</td><td>{row.issue_date}</td><td>{row.expiry_date}</td><td><Status>{row.status || "ط؛ظٹط± ظ…ط­ط¯ط¯"}</Status></td></tr>)}</tbody>
                  </table>
                </div>
              )}
              {activePanel === "link" && (
                <form onSubmit={saveUserLink} className="grid gap-3 md:grid-cols-3">
                  <Label t="ط­ط³ط§ط¨ ظ…ظˆط¬ظˆط¯">
                    <select value={linkForm.user_id} onChange={(e) => setLinkForm({ ...linkForm, user_id: e.target.value, username: "", password: "" })} className="field mt-2">
                      <option value="">ط¥ظ†ط´ط§ط،/ط§ط®طھظٹط§ط± ظ„ط§ط­ظ‚</option>
                      {users.map((user) => <option key={user.user_id} value={user.user_id}>{user.username} - {user.employee_name || "ط؛ظٹط± ظ…ط±طھط¨ط·"}</option>)}
                    </select>
                  </Label>
                  <Label t="ط§ط³ظ… ظ…ط³طھط®ط¯ظ… ط¬ط¯ظٹط¯">
                    <input disabled={!!linkForm.user_id} value={linkForm.username} onChange={(e) => setLinkForm({ ...linkForm, username: e.target.value })} className="field mt-2" />
                  </Label>
                  {!linkForm.user_id && <Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"><input required type="password" value={linkForm.password || ""} onChange={(e) => setLinkForm({ ...linkForm, password: e.target.value })} className="field mt-2" /></Label>}
                  <Label t="ط§ظ„ط¯ظˆط±">
                    <select disabled={!!linkForm.user_id} value={linkForm.role} onChange={(e) => setLinkForm({ ...linkForm, role: e.target.value })} className="field mt-2">
                      {jobs.map((job) => <option key={job}>{job}</option>)}
                    </select>
                  </Label>
                  <div className="md:col-span-3 flex justify-end">
                    <button disabled={panelLoading} className="btn-primary">ط±ط¨ط· ط§ظ„ط­ط³ط§ط¨</button>
                  </div>
                </form>
              )}
              {activePanel === "password" && (
                <form onSubmit={resetPassword} className="grid gap-3 md:grid-cols-3">
                  <Label t="ط­ط³ط§ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ…">
                    <select value={passwordForm.user_id} onChange={(e) => setPasswordForm({ ...passwordForm, user_id: e.target.value })} className="field mt-2">
                      <option value="">ط§ط®طھط± ط§ظ„ط­ط³ط§ط¨</option>
                      {(linkedUsers.length ? linkedUsers : users).map((user) => <option key={user.user_id} value={user.user_id}>{user.username}</option>)}
                    </select>
                  </Label>
                  <Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط¬ط¯ظٹط¯ط©">
                    <input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} className="field mt-2" />
                  </Label>
                  <Label t="طھط£ظƒظٹط¯ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±">
                    <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className="field mt-2" />
                  </Label>
                  <div className="md:col-span-3 flex justify-end">
                    <button disabled={panelLoading} className="btn-primary">طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±</button>
                  </div>
                </form>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {actions.map(([label, disabled, action]) => (
                <button key={label} type="button" disabled={disabled} onClick={action} className={label === "طھط¹ط¯ظٹظ„" ? "btn-primary" : "btn-secondary"}>
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
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
  { key: "guarantee_id", label: "ط±ظ‚ظ… ط§ظ„ط¶ظ…ط§ظ†" },
  { key: "employee_name", label: "ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ" },
  { key: "branch", label: "ط§ظ„ظپط±ط¹" },
  { key: "guarantee_type", label: "ظ†ظˆط¹ ط§ظ„ط¶ظ…ط§ظ†" },
  { key: "guarantor_name", label: "ط§ط³ظ… ط§ظ„ط¶ط§ظ…ظ†" },
  { key: "guarantor_phone", label: "ط±ظ‚ظ… ظ‡ط§طھظپ ط§ظ„ط¶ط§ظ…ظ†" },
  { key: "guarantee_date", label: "طھط§ط±ظٹط® ط§ظ„ط¶ظ…ط§ظ†" },
  { key: "guarantee_expiry_date", label: "طھط§ط±ظٹط® ط§ظ„ط§ظ†طھظ‡ط§ط،" },
  { key: "guarantee_status", label: "ط§ظ„ط­ط§ظ„ط©" },
];
const tableColumnsOvertime = [
  { key: "assignment_id", label: "ط±ظ‚ظ… ط§ظ„طھظƒظ„ظٹظپ" },
  { key: "employee_name", label: "ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ" },
  { key: "employee_id", label: "ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط¸ظٹظپظٹ" },
  { key: "branch", label: "ط§ظ„ظپط±ط¹" },
  { key: "job", label: "ط§ظ„ظˆط¸ظٹظپط©" },
  { key: "assignment_date", label: "طھط§ط±ظٹط® ط§ظ„طھظƒظ„ظٹظپ" },
  { key: "start_time", label: "ظˆظ‚طھ ط§ظ„ط¨ط¯ط§ظٹط©" },
  { key: "end_time", label: "ظˆظ‚طھ ط§ظ„ظ†ظ‡ط§ظٹط©" },
  { key: "total_hours", label: "ط¹ط¯ط¯ ط§ظ„ط³ط§ط¹ط§طھ" },
  { key: "reason", label: "ط³ط¨ط¨ ط§ظ„طھظƒظ„ظٹظپ" },
  { key: "status", label: "ط§ظ„ط­ط§ظ„ط©" },
  { key: "approved_by", label: "ط§ظ„ظ…ط¹طھظ…ط¯" },
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
  const guaranteeTypes = [...new Set(["ط¶ظ…ط§ظ† طھط¬ط§ط±ظٹ", "ط¶ظ…ط§ظ† ط´ط®طµظٹ", "ط¶ظ…ط§ظ† ط¨ظ†ظƒظٹ", ...safeItems.map((g) => g?.guarantee_type).filter(Boolean)])];
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
        setError("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
        return;
      }
      setItems(await guaranteesService.list());
    } catch (e) {
      console.error("Guarantees page load error:", e);
      setItems([]);
      setError(e.message || "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    return guaranteesService.subscribe(load);
  }, [companyId]);
  if (!canView) {
    return <div className="panel p-8 text-center font-bold text-slate-500">ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط¹ط±ط¶ ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†</div>;
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
  const activeEmployeeIds = new Set(safeItems.filter((g) => g?.guarantee_status === "ط³ط§ط±ظٹط©").map((g) => g.employee_id));
  const cards = [
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¶ظ…ط§ظ†ط§طھ", safeItems.length, ShieldCheck],
    ["ط¶ظ…ط§ظ†ط§طھ ظ†ط´ط·ط©", safeItems.filter((g) => g?.guarantee_status === "ط³ط§ط±ظٹط©").length, BadgeCheck],
    ["ط¶ظ…ط§ظ†ط§طھ ظ…ظ†طھظ‡ظٹط©", safeItems.filter((g) => g?.guarantee_status === "ظ…ظ†طھظ‡ظٹط©").length, AlertTriangle],
    ["ط¶ظ…ط§ظ†ط§طھ طھط­طھط§ط¬ ظ…ط±ط§ط¬ط¹ط©", safeItems.filter((g) => ["ظ†ط§ظ‚طµط©", "ظ…ظˆظ‚ظˆظپط©"].includes(g?.guarantee_status) || g?.approval_status === "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©").length, FileBarChart],
    ["ط§ظ„ظ…ظˆط¸ظپظˆظ† ط¨ط¯ظˆظ† ط¶ظ…ط§ظ†ط©", safeEmployees.filter((e) => !activeEmployeeIds.has(e.id)).length, Users],
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
      guarantee_type: "ط¶ظ…ط§ظ† طھط¬ط§ط±ظٹ",
      guarantee_status: "ط³ط§ط±ظٹط©",
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
    if (!canEdit && safeItems.some((g) => g.guarantee_id === dialog.guarantee_id)) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (!canCreate && !safeItems.some((g) => g.guarantee_id === dialog.guarantee_id)) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    const required = [
      ["employee_id", "ط§ظ„ظ…ظˆط¸ظپ"],
      ["guarantor_name", "ط§ط³ظ… ط§ظ„ط¶ط§ظ…ظ†"],
      ["guarantor_id_number", "ط±ظ‚ظ… ظ‡ظˆظٹط© ط§ظ„ط¶ط§ظ…ظ†"],
      ["commercial_register_number", "ط±ظ‚ظ… ط§ظ„ط³ط¬ظ„ ط§ظ„طھط¬ط§ط±ظٹ"],
      ["guarantee_date", "طھط§ط±ظٹط® ط§ظ„ط¶ظ…ط§ظ†ط©"],
    ].filter(([key]) => !dialog[key]);
    if (required.length) return alert(`ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط·ظ„ظˆط¨ط©: ${required.map((x) => x[1]).join("طŒ ")}`);
    const duplicateGuarantor = safeItems.find(
      (g) =>
        g.guarantee_id !== dialog.guarantee_id &&
        g.guarantee_status === "ط³ط§ط±ظٹط©" &&
        g.guarantor_id_number === dialog.guarantor_id_number &&
        g.employee_id !== dialog.employee_id,
    );
    if (duplicateGuarantor) return alert("ظ„ط§ ظٹظ…ظƒظ† ط§ط³طھط®ط¯ط§ظ… ظ†ظپط³ ط±ظ‚ظ… ظ‡ظˆظٹط© ط§ظ„ط¶ط§ظ…ظ† ظ„ط£ظƒط«ط± ظ…ظ† ظ…ظˆط¸ظپ ظ†ط´ط·.");
    const duplicateRegister = safeItems.find(
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
        action: safeItems.some((g) => g.guarantee_id === dialog.guarantee_id) ? "طھط¹ط¯ظٹظ„ ط¶ظ…ط§ظ†ط©" : "ط¥ط¶ط§ظپط© ط¶ظ…ط§ظ†ط©",
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
      <PageHead title="ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†" desc="ط¥ط¯ط§ط±ط© ط§ظ„ط¶ظ…ط§ظ†ط§طھ ط§ظ„طھط¬ط§ط±ظٹط© ظ„ظ„ظ…ظˆط¸ظپظٹظ† ظˆظ…طھط§ط¨ط¹ط© ط­ط§ظ„طھظ‡ط§" action={<button disabled={!canCreate} onClick={openAdd} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط© ط¶ظ…ط§ظ†</button>} />
      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">{error}</div>}
      {!error && !safeItems.length && !loading && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">ظ„ظ… ظٹطھظ… ط±ط¨ط· ط¨ظٹط§ظ†ط§طھ ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¨ط¹ط¯طŒ ط£ظˆ ظ„ط§ طھظˆط¬ط¯ ط¶ظ…ط§ظ†ط§طھ ظ…ط³ط¬ظ„ط© ظ„ظ‡ط°ظ‡ ط§ظ„ط´ط±ظƒط©.</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}</div>
      <div className="panel flex flex-wrap gap-3 p-4">
        <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط§ظ„ظ…ظˆط¸ظپ / ط±ظ‚ظ… ط§ظ„ط¶ظ…ط§ظ† / ط§ظ„ط¶ط§ظ…ظ†" />
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{localBranchOptions.map((b) => <option key={b}>{b}</option>)}</select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="field max-w-[170px]"><option value="all">ظ†ظˆط¹ ط§ظ„ط¶ظ…ط§ظ†</option>{guaranteeTypes.map((s) => <option key={s}>{s}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[170px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{guaranteeStatuses.map((s) => <option key={s}>{s}</option>)}</select>
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} className="field max-w-[170px]" title="ظ…ظ† طھط§ط±ظٹط®" />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} className="field max-w-[170px]" title="ط¥ظ„ظ‰ طھط§ط±ظٹط®" />
        <button onClick={() => exportExcel(exportRows, "طھظ‚ط±ظٹط± ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button>
        <button onClick={() => printDocument("طھظ‚ط±ظٹط± ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†", rowsToReportHtml("طھظ‚ط±ظٹط± ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†", filtered, tableColumnsGuarantees))} className="btn-secondary"><Printer size={17} /> PDF</button>
        <button onClick={() => exportDocx("طھظ‚ط±ظٹط± ط¶ظ…ط§ظ†ط§طھ ط§ظ„ظ…ظˆط¸ظپظٹظ†", exportRows)} className="btn-secondary"><Download size={17} /> Word</button>
      </div>
      <div className="panel p-4">
        {loading ? <LoadingScreen message="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¶ظ…ط§ظ†ط§طھ..." /> : (
          <div className="table-wrap"><table><thead><tr>{tableColumnsGuarantees.map((c) => <th key={c.key}>{c.label}</th>)}<th>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th></tr></thead><tbody>{filtered.length ? filtered.map((g) => <tr key={g.guarantee_id}><td>{g.guarantee_id}</td><td>{g.employee_name}</td><td>{g.branch}</td><td>{g.guarantee_type || "ط¶ظ…ط§ظ† طھط¬ط§ط±ظٹ"}</td><td>{g.guarantor_name}</td><td>{g.guarantor_phone}</td><td>{g.guarantee_date}</td><td>{g.guarantee_expiry_date}</td><td><Status>{g.guarantee_status}</Status></td><td><button onClick={() => setViewing(g)} className="p-2 text-slate-600"><Eye size={16} /></button><button disabled={!canEdit} onClick={() => setDialog(g)} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canDelete} onClick={() => remove(g.guarantee_id)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>) : <tr><td colSpan={10} className="py-8 text-center text-slate-400">ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ط¶ظ…ط§ظ†ط§طھ ظ…ط·ط§ط¨ظ‚ط©</td></tr>}</tbody></table></div>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportBox title="طھظ‚ط±ظٹط± ط­ط³ط¨ ط§ظ„ظپط±ط¹" rows={Object.entries(groupCount(filtered, "branch"))} />
        <ReportBox title="طھظ‚ط±ظٹط± ط­ط³ط¨ ط§ظ„ط­ط§ظ„ط©" rows={Object.entries(groupCount(filtered, "guarantee_status"))} />
        <ReportBox title="ط§ظ„ظ…ظˆط¸ظپظˆظ† ط¨ط¯ظˆظ† ط¶ظ…ط§ظ†ط© ط³ط§ط±ظٹط©" rows={safeEmployees.filter((e) => !activeEmployeeIds.has(e.id)).map((e) => [e.name, e.branch])} />
        <ReportBox title="ط§ظ„ط¶ط§ظ…ظ†ظˆظ† ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ† ط£ظƒط«ط± ظ…ظ† ظ…ط±ط©" rows={Object.entries(groupCount(safeItems, "guarantor_id_number")).filter(([, n]) => n > 1)} />
      </div>
      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={save} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6">
            <div className="mb-5 flex"><h3 className="text-xl font-extrabold">{safeItems.some((g) => g.guarantee_id === dialog.guarantee_id) ? "طھط¹ط¯ظٹظ„ ط¶ظ…ط§ظ†" : "ط¥ط¶ط§ظپط© ط¶ظ…ط§ظ†"}</h3><button type="button" onClick={() => setDialog(null)} className="mr-auto"><X /></button></div>
            <div className="grid gap-4 md:grid-cols-3">
              <Label t="ط§ظ„ظ…ظˆط¸ظپ"><select required value={dialog.employee_id} onChange={(e) => selectEmployee(e.target.value)} className="field mt-2"><option value="">ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ</option>{safeEmployees.map((e) => <option key={e.id} value={e.id}>{e.name} - {e.id}</option>)}</select></Label>
              {["employee_name", "branch", "job"].map((k) => <Label key={k} t={{ employee_name: "ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ", branch: "ط§ظ„ظپط±ط¹", job: "ط§ظ„ظˆط¸ظٹظپط©" }[k]}><input readOnly value={dialog[k]} className="field mt-2 bg-slate-50" /></Label>)}
              <Label t="ط§ط³ظ… ط§ظ„ط¶ط§ظ…ظ†"><input required value={dialog.guarantor_name} onChange={(e) => setDialog({ ...dialog, guarantor_name: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط±ظ‚ظ… ظ‡ظˆظٹط© ط§ظ„ط¶ط§ظ…ظ†"><input required value={dialog.guarantor_id_number} onChange={(e) => setDialog({ ...dialog, guarantor_id_number: e.target.value })} className="field mt-2" /></Label>
              <Label t="ظ‡ط§طھظپ ط§ظ„ط¶ط§ظ…ظ†"><input value={dialog.guarantor_phone} onChange={(e) => setDialog({ ...dialog, guarantor_phone: e.target.value })} className="field mt-2" /></Label>
              <Label t="ظ†ظˆط¹ ط§ظ„ط¶ظ…ط§ظ†"><select value={dialog.guarantee_type || "ط¶ظ…ط§ظ† طھط¬ط§ط±ظٹ"} onChange={(e) => setDialog({ ...dialog, guarantee_type: e.target.value })} className="field mt-2">{guaranteeTypes.map((s) => <option key={s}>{s}</option>)}</select></Label>
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

function OvertimeWhatsAppMessageGenerator({ companyId, companyName, canGenerate }) {
  const today = new Date().toISOString().slice(0, 10);
  const [assignmentDate, setAssignmentDate] = useState(today);
  const [messageType, setMessageType] = useState("tomorrow");
  const [customTitle, setCustomTitle] = useState("âœ¨ ط¬ط¯ظˆظ„ ط§ظ„ط¯ظˆط§ظ… ط§ظ„ط¥ط¶ط§ظپظٹ {dayName} ({date}) âœ¨");
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
    if (!canGenerate) return setStatus("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظˆظ„ظٹط¯ ط±ط³ط§ظ„ط© ط§ظ„ط¯ظˆط§ظ… ط§ظ„ط¥ط¶ط§ظپظٹ");
    if (!companyId) return setStatus("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
    setLoading(true);
    setStatus("ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ…ظˆط¸ظپظٹ ط§ظ„ط¯ظˆط§ظ… ط§ظ„ط¥ط¶ط§ظپظٹ...");
    try {
      const loaded = await loadOvertimeEmployeesByDate(companyId, assignmentDate, { approvedOnly, showCanceled });
      setRows(loaded);
      setStatus(loaded.length ? `طھظ… طھط­ظ…ظٹظ„ ${loaded.length} ظ…ظˆط¸ظپ` : "ظ„ط§ ظٹظˆط¬ط¯ ظ…ظˆط¸ظپظˆظ† ظ…ظƒظ„ظپظˆظ† ط¨ط¯ظˆط§ظ… ط¥ط¶ط§ظپظٹ ظپظٹ ظ‡ط°ط§ ط§ظ„طھط§ط±ظٹط®");
    } catch (error) {
      console.error("Overtime message generator error:", error);
      setRows([]);
      setStatus("طھط¹ط°ط± طھط­ظ…ظٹظ„ ظ…ظˆط¸ظپظٹ ط§ظ„ط¯ظˆط§ظ… ط§ظ„ط¥ط¶ط§ظپظٹ");
    } finally {
      setLoading(false);
    }
  };
  const generate = () => {
    if (!canGenerate) return setStatus("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظˆظ„ظٹط¯ ط±ط³ط§ظ„ط© ط§ظ„ط¯ظˆط§ظ… ط§ظ„ط¥ط¶ط§ظپظٹ");
    try {
      const text = generateOvertimeWhatsAppMessage({ assignmentDate, rows: safeRows, messageType, customTitle, companyName, showTimes });
      setMessage(text);
      setStatus(safeRows.length ? "طھظ… طھظˆظ„ظٹط¯ ط§ظ„ط±ط³ط§ظ„ط©" : "ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ„ظ‡ط°ط§ ط§ظ„طھط§ط±ظٹط®");
    } catch (error) {
      console.error("Overtime message generator error:", error);
      setStatus("طھط¹ط°ط± طھظˆظ„ظٹط¯ ط§ظ„ط±ط³ط§ظ„ط©");
    }
  };
  const copyMessage = async () => {
    try {
      await copyTextToClipboard(message);
      setStatus("طھظ… ظ†ط³ط® ط§ظ„ط±ط³ط§ظ„ط© ط¨ظ†ط¬ط§ط­");
    } catch {
      setStatus("طھط¹ط°ط± ط§ظ„ظ†ط³ط® ط§ظ„طھظ„ظ‚ط§ط¦ظٹطŒ ظٹظ…ظƒظ†ظƒ ظ†ط³ط® ط§ظ„ط±ط³ط§ظ„ط© ظٹط¯ظˆظٹط§ظ‹");
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
    return <div className="panel p-5 text-center text-sm font-bold text-slate-500">ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظˆظ„ظٹط¯ ط±ط³ط§ظ„ط© ط§ظ„ط¯ظˆط§ظ… ط§ظ„ط¥ط¶ط§ظپظٹ</div>;
  }
  return (
    <div className="panel space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h3 className="text-lg font-extrabold">طھظˆظ„ظٹط¯ ط±ط³ط§ظ„ط© ط¯ظˆط§ظ… ط¥ط¶ط§ظپظٹ</h3>
          <p className="mt-1 text-xs text-slate-500">ط§ظ„ظٹظˆظ… ظˆط§ظ„طھط§ط±ظٹط® ظٹطھط؛ظٹط±ط§ظ† طھظ„ظ‚ط§ط¦ظٹظ‹ط§ ط­ط³ط¨ طھط§ط±ظٹط® ط§ظ„طھظƒظ„ظٹظپ ط§ظ„ظ…ط®طھط§ط±.</p>
        </div>
        <span className="mr-auto rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{generatedTitle}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Label t="طھط§ط±ظٹط® ط§ظ„طھظƒظ„ظٹظپ"><input type="date" value={assignmentDate} onChange={(e) => setAssignmentDate(e.target.value)} className="field mt-2" /></Label>
        <Label t="ظ†ظˆط¹ ط§ظ„ط±ط³ط§ظ„ط©"><select value={messageType} onChange={(e) => setMessageType(e.target.value)} className="field mt-2"><option value="tomorrow">ط¬ط¯ظˆظ„ ط§ظ„ط¹ظ…ظ„ ظ„ظٹظˆظ… ط؛ط¯</option><option value="today">ط¬ط¯ظˆظ„ ط§ظ„ط¹ظ…ظ„ ظ„ظ‡ط°ط§ ط§ظ„ظٹظˆظ…</option><option value="custom">ط±ط³ط§ظ„ط© ظ…ط®طµطµط©</option></select></Label>
        <Label t="ط¹ظ†ظˆط§ظ† ط§ظ„ط±ط³ط§ظ„ط© ط§ظ„ظ…ط®طµطµ"><input disabled={messageType !== "custom"} value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="field mt-2 disabled:bg-slate-50" /></Label>
      </div>
      <div className="flex flex-wrap gap-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">
        <label className="flex items-center gap-2"><input type="checkbox" checked={approvedOnly} onChange={(e) => setApprovedOnly(e.target.checked)} /> ط¥ط¸ظ‡ط§ط± ظپظ‚ط· ط§ظ„ظ…ط¹طھظ…ط¯ظٹظ†</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={showCanceled} onChange={(e) => setShowCanceled(e.target.checked)} /> ط¥ط¸ظ‡ط§ط± ط§ظ„ظ…ظ„ط؛ظٹظٹظ†</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={showTimes} onChange={(e) => setShowTimes(e.target.checked)} /> ط¥ط¸ظ‡ط§ط± ظˆظ‚طھ ط§ظ„ط¯ظˆط§ظ…</label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={loadRows} disabled={loading} className="btn-secondary">طھط­ظ…ظٹظ„ ظ…ظˆط¸ظپظٹ ط§ظ„ط¯ظˆط§ظ… ط§ظ„ط¥ط¶ط§ظپظٹ</button>
        <button onClick={generate} className="btn-primary">طھظˆظ„ظٹط¯ ط§ظ„ط±ط³ط§ظ„ط©</button>
        <button onClick={copyMessage} disabled={!message} className="btn-secondary disabled:opacity-50">ظ†ط³ط® ط§ظ„ط±ط³ط§ظ„ط©</button>
        <button onClick={() => printDocument("ط±ط³ط§ظ„ط© ط§ظ„ط¯ظˆط§ظ… ط§ظ„ط¥ط¶ط§ظپظٹ", `<pre style="white-space:pre-wrap;line-height:1.9">${printSafeMessage}</pre>`)} disabled={!message} className="btn-secondary disabled:opacity-50">ط·ط¨ط§ط¹ط©</button>
        <button onClick={exportText} disabled={!message} className="btn-secondary disabled:opacity-50">طھطµط¯ظٹط± ظ†طµ</button>
      </div>
      {status && <div className="rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">{status}</div>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط¸ظٹظپظٹ</th><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„ظˆط¸ظٹظپط©</th><th>طھط§ط±ظٹط® ط§ظ„طھظƒظ„ظٹظپ</th><th>ظˆظ‚طھ ط§ظ„ط¨ط¯ط§ظٹط©</th><th>ظˆظ‚طھ ط§ظ„ظ†ظ‡ط§ظٹط©</th><th>ط¹ط¯ط¯ ط§ظ„ط³ط§ط¹ط§طھ</th><th>ط§ظ„ط­ط§ظ„ط©</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9}>ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ…ظˆط¸ظپظٹ ط§ظ„ط¯ظˆط§ظ… ط§ظ„ط¥ط¶ط§ظپظٹ...</td></tr> : safeRows.length ? safeRows.map((row) => <tr key={`${row.id}-${row.employee_id}`}><td>{row.employee_name}</td><td>{row.employee_id}</td><td>{row.branch}</td><td>{row.job}</td><td>{row.assignment_date}</td><td>{row.start_time || "â€”"}</td><td>{row.end_time || "â€”"}</td><td>{row.total_hours || "â€”"}</td><td><Status>{row.status || "ظ…ظƒظ„ظپ"}</Status></td></tr>) : <tr><td colSpan={9} className="py-6 text-center text-slate-400">ظ„ط§ ظٹظˆط¬ط¯ ظ…ظˆط¸ظپظˆظ† ظ…ظƒظ„ظپظˆظ† ط¨ط¯ظˆط§ظ… ط¥ط¶ط§ظپظٹ ظپظٹ ظ‡ط°ط§ ط§ظ„طھط§ط±ظٹط®</td></tr>}
          </tbody>
        </table>
      </div>
      <Label t="ظ…ط¹ط§ظٹظ†ط© ط§ظ„ط±ط³ط§ظ„ط©">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={10} className="field mt-2 !h-auto whitespace-pre-wrap py-3" placeholder="ط§ط¶ط؛ط· طھظˆظ„ظٹط¯ ط§ظ„ط±ط³ط§ظ„ط© ط¨ط¹ط¯ طھط­ظ…ظٹظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ†..." />
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
    .filter((branch) => branch?.is_active !== false && (!branch?.status || branch.status === "ظ†ط´ط·"))
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
        setError("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
        return;
      }
      const [a, ae] = await Promise.all([overtimeService.listAssignments(), overtimeService.listAssignmentEmployees()]);
      setAssignments(a);
      setAssignmentEmployees(ae);
    } catch (e) {
      console.error("Overtime assignment error:", e);
      setError(e.message || "طھط¹ط°ط± طھط­ظ…ظٹظ„ طھظƒظ„ظٹظپط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ");
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
          setError(branchError.message || "طھط¹ط°ط± طھط­ظ…ظٹظ„ ظپط±ظˆط¹ ط§ظ„ط´ط±ظƒط©");
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
  if (!canView) return <div className="panel p-8 text-center font-bold text-slate-500">ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط¥ط¯ط§ط±ط© طھظƒظ„ظٹظپ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ</div>;
  const joinedRows = safeAssignmentEmployees.map((row) => {
    const assignment = safeAssignments.find((a) => a.assignment_id === row.assignment_id) || {};
    return { ...assignment, ...row, total_hours: assignment.total_hours || overtimeService.calculateOvertimeHours(assignment.start_time, assignment.end_time) };
  });
  const visibleRows = joinedRows.filter((r) => {
    if (role === "ط§ظ„ظ…ظˆط¸ظپ" && currentUser?.employeeId && r.employee_id !== currentUser.employeeId) return false;
    if (role === "ظ…ط¯ظٹط± ط§ظ„ظپط±ط¹" && currentUser?.branch && r.branch !== currentUser.branch) return false;
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
    ["ط¥ط¬ظ…ط§ظ„ظٹ طھظƒظ„ظٹظپط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", safeAssignments.length, Clock3],
    ["ط¹ط¯ط¯ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط§ظ„ظ…ظƒظ„ظپظٹظ†", safeAssignmentEmployees.length, Users],
    ["ط¹ط¯ط¯ ط³ط§ط¹ط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", filtered.reduce((s, r) => s + hours(r), 0).toFixed(1), Gauge],
    ["طھظƒظ„ظٹظپط§طھ ط­ط³ط¨ ط§ظ„ظپط±ط¹", Object.keys(groupCount(filtered, "branch")).length, Building2],
    ["طھظƒظ„ظٹظپط§طھ ط­ط³ط¨ ط§ظ„ط´ظ‡ط±", Object.keys(groupCount(filtered, "assignment_date")).length, CalendarCheck],
  ];
  const startCreate = () => {
    if (!canCreate) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
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
    if (!canCreate) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (!dialog.start_time) return alert("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ظˆظ‚طھ ط§ظ„ط¨ط¯ط§ظٹط©");
    if (!dialog.end_time) return alert("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ظˆظ‚طھ ط§ظ„ظ†ظ‡ط§ظٹط©");
    if (overtimeService.calculateOvertimeHours(dialog.start_time, dialog.end_time) <= 0) return alert("ط¹ط¯ط¯ ط§ظ„ط³ط§ط¹ط§طھ ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† ط£ظƒط¨ط± ظ…ظ† طµظپط±");
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
  const openEditRow = (row) => {
    if (!canEdit) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
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
    if (!canEdit) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (!editRow.employee_id) return alert("ظٹط¬ط¨ طھط­ط¯ظٹط¯ ط§ظ„ظ…ظˆط¸ظپ");
    if (!editRow.start_time) return alert("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ظˆظ‚طھ ط§ظ„ط¨ط¯ط§ظٹط©");
    if (!editRow.end_time) return alert("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ظˆظ‚طھ ط§ظ„ظ†ظ‡ط§ظٹط©");
    if (overtimeService.calculateOvertimeHours(editRow.start_time, editRow.end_time) <= 0) return alert("ط¹ط¯ط¯ ط§ظ„ط³ط§ط¹ط§طھ ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† ط£ظƒط¨ط± ظ…ظ† طµظپط±");
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
        action: "طھط¹ط¯ظٹظ„ ظ…ظˆط¸ظپ طھظƒظ„ظٹظپ ط¹ظ…ظ„ ط¥ط¶ط§ظپظٹ",
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
    if (!canDelete) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    if (!confirm("ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپ ظ…ظ† طھظƒظ„ظٹظپ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹطں")) return;
    try {
      const canceled = await overtimeService.updateAssignmentEmployee({ ...row, status: "ظ…ظ„ط؛ظٹ" });
      auditService.log({
        company_id: companyId,
        user_id: currentUser?.user_id || currentUser?.username,
        user_name: currentUser?.username || currentUser?.name,
        action: "ط­ط°ظپ/ط¥ظ„ط؛ط§ط، ظ…ظˆط¸ظپ ظ…ظ† طھظƒظ„ظٹظپ ط¹ظ…ظ„ ط¥ط¶ط§ظپظٹ",
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
    alert("طھظ… ظ†ط³ط® ط§ظ„ط±ط³ط§ظ„ط©");
  };
  const openWhatsApp = (row) => {
    const message = row.whatsapp_message || makeOvertimeMessage(row, row);
    window.open(`https://wa.me/${normalizeWhatsAppPhone(row.employee_phone)}?text=${encodeURIComponent(message)}`, "_blank");
  };
  const exportRows = reportRowsForExport(filtered, tableColumnsOvertime);
  return (
    <div className="space-y-5">
      <PageHead title="ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ" desc="ط¥ظ†ط´ط§ط، طھظƒظ„ظٹظپط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ ظˆطھظˆظ„ظٹط¯ ط±ط³ط§ط¦ظ„ ظˆط§طھط³ط§ط¨ ظ„ظ„ظ…ظˆط¸ظپظٹظ†" action={<button disabled={!canCreate} onClick={startCreate} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط© ظ…ظˆط¸ظپ ظ„ظ„طھظƒظ„ظٹظپ</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, I]) => <Mini key={label} label={label} value={value} I={I} />)}</div>
      <div className="panel flex flex-wrap gap-3 p-4">
        <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="field max-w-[170px]" />
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{companyBranchOptions.length ? companyBranchOptions.map((branchName) => <option key={branchName} value={branchName}>{branchName}</option>) : <option value="" disabled>ظ„ظ… ظٹطھظ… ط¥ط¶ط§ظپط© ظپط±ظˆط¹ ظ„ظ‡ط°ظ‡ ط§ظ„ط´ط±ظƒط© ط¨ط¹ط¯</option>}</select>
        <input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field min-w-[200px]" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[170px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{overtimeStatuses.map((s) => <option key={s}>{s}</option>)}</select>
        <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[170px]" />
        <button onClick={() => exportExcel(exportRows, "طھظ‚ط±ظٹط± ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button>
        <button onClick={() => printDocument("طھظ‚ط±ظٹط± ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", rowsToReportHtml("طھظ‚ط±ظٹط± ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", filtered, tableColumnsOvertime))} className="btn-secondary"><Printer size={17} /> PDF</button>
        <button onClick={() => exportDocx("طھظ‚ط±ظٹط± ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ", exportRows)} className="btn-secondary"><Download size={17} /> Word</button>
      </div>
      <OvertimeWhatsAppMessageGenerator companyId={companyId} companyName={currentCompany?.company_name || currentUser?.company_name || ""} canGenerate={canGenerateMessage} />
      <div className="panel p-4">
        {loading ? <LoadingScreen message="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ طھظƒظ„ظٹظپط§طھ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ..." /> : (
          <div className="table-wrap"><table><thead><tr>{tableColumnsOvertime.map((c) => <th key={c.key}>{c.label}</th>)}<th>ظˆط§طھط³ط§ط¨</th><th>ط§ظ„ط¥ط¬ط±ط§ط،ط§طھ</th></tr></thead><tbody>{filtered.length ? filtered.map((r) => <tr key={r.id}><td>{r.assignment_id}</td><td>{r.employee_name}</td><td>{r.employee_id}</td><td>{r.branch}</td><td>{r.job}</td><td>{r.assignment_date}</td><td>{r.start_time}</td><td>{r.end_time}</td><td>{hours(r)}</td><td>{r.reason}</td><td><Status>{r.status}</Status></td><td>{r.approved_by || r.approval_status || "â€”"}</td><td><button onClick={() => copy(r.whatsapp_message || makeOvertimeMessage(r, r))} className="btn-secondary !h-9 !px-3">ظ†ط³ط®</button><button onClick={() => openWhatsApp(r)} className="btn-secondary !h-9 !px-3">ظˆط§طھط³ط§ط¨</button></td><td><button onClick={() => setViewing(r)} className="p-2 text-slate-600" title="ط¹ط±ط¶"><Eye size={16} /></button>{canEdit && <button onClick={() => openEditRow(r)} className="p-2 text-blue-600" title="طھط¹ط¯ظٹظ„"><Pencil size={16} /></button>}{canDelete && <button onClick={() => removeEmployeeFromAssignment(r)} className="p-2 text-red-600" title="ط­ط°ظپ"><Trash2 size={16} /></button>}<select disabled={!canEdit && !canApprove} value={r.status} onChange={(e) => updateStatus(r, e.target.value)} className="field mt-1 h-9 min-w-[110px]">{overtimeStatuses.map((s) => <option key={s}>{s}</option>)}</select></td></tr>) : <tr><td colSpan={14} className="py-8 text-center text-slate-400">ظ„ط§ طھظˆط¬ط¯ طھظƒظ„ظٹظپط§طھ ط¹ظ…ظ„ ط¥ط¶ط§ظپظٹ ط­ط§ظ„ظٹط§ظ‹</td></tr>}</tbody></table></div>
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
              <Label t="ط§ظ„ظپط±ط¹"><select value={dialog.branch} onChange={(e) => setDialog({ ...dialog, branch: e.target.value })} className="field mt-2">{companyBranchOptions.length ? companyBranchOptions.map((branchName) => <option key={branchName} value={branchName}>{branchName}</option>) : <option value="">ظ„ظ… ظٹطھظ… ط¥ط¶ط§ظپط© ظپط±ظˆط¹ ظ„ظ‡ط°ظ‡ ط§ظ„ط´ط±ظƒط© ط¨ط¹ط¯</option>}</select></Label>
              <Label t="ط§ظ„ظ…ظˆظ‚ط¹"><input required value={dialog.location} onChange={(e) => setDialog({ ...dialog, location: e.target.value })} className="field mt-2" /></Label>
              <Label t="ظ…ظ† ط§ظ„ط³ط§ط¹ط©"><input required type="time" value={dialog.start_time} onChange={(e) => setDialog({ ...dialog, start_time: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط¥ظ„ظ‰ ط§ظ„ط³ط§ط¹ط©"><input required type="time" value={dialog.end_time} onChange={(e) => setDialog({ ...dialog, end_time: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط³ط¨ط¨ ط§ظ„طھظƒظ„ظٹظپ"><input value={dialog.reason} onChange={(e) => setDialog({ ...dialog, reason: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط·ط±ظٹظ‚ط© ط§ظ„ط§ط®طھظٹط§ط±"><select value={dialog.mode} onChange={(e) => setDialog({ ...dialog, mode: e.target.value, selected: [] })} className="field mt-2"><option value="branch">ظƒظ„ ظ…ظˆط¸ظپظٹ ط§ظ„ظپط±ط¹</option><option value="job">ط­ط³ط¨ ط§ظ„ظˆط¸ظٹظپط©</option><option value="manual">ط§ط®طھظٹط§ط± ظ…طھط¹ط¯ط¯</option></select></Label>
              {dialog.mode === "job" && <Label t="ط§ظ„ظˆط¸ظٹظپط©"><select value={dialog.job || jobs[0]} onChange={(e) => setDialog({ ...dialog, job: e.target.value })} className="field mt-2">{jobs.map((j) => <option key={j}>{j}</option>)}</select></Label>}
              <Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
            </div>
            {dialog.mode === "manual" && <div className="mt-5 grid max-h-56 gap-2 overflow-y-auto rounded-2xl border p-3 md:grid-cols-2">{safeEmployees.map((e) => <label key={e.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-sm"><input type="checkbox" checked={dialog.selected.includes(e.id)} onChange={(ev) => setDialog({ ...dialog, selected: ev.target.checked ? [...dialog.selected, e.id] : dialog.selected.filter((id) => id !== e.id) })} />{e.name} - {e.branch}</label>)}</div>}
            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">ط¹ط¯ط¯ ط§ظ„ظ…ظˆط¸ظپظٹظ† ط§ظ„ظ…ط®طھط§ط±ظٹظ†: {selectedEmployees().length}</p>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="btn-secondary">ط¥ظ„ط؛ط§ط،</button><button className="btn-primary"><Save size={17} /> ط­ظپط¸ ط§ظ„طھظƒظ„ظٹظپ</button></div>
          </form>
        </div>
      )}
      {editRow && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={saveEditRow} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6">
            <DialogTitle title="طھط¹ط¯ظٹظ„ ظ…ظˆط¸ظپ ظپظٹ طھظƒظ„ظٹظپ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ" close={() => setEditRow(null)} />
            <div className="grid gap-4 md:grid-cols-3">
              <Label t="ط§ظ„ظ…ظˆط¸ظپ">
                {safeEmployees.length ? (
                  <select required value={editRow.employee_id || ""} onChange={(e) => pickEditEmployee(e.target.value)} className="field mt-2">
                    <option value="">ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ</option>
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
              <Label t="ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط¸ظٹظپظٹ"><input required value={editRow.employee_id || ""} onChange={(e) => setEditRow({ ...editRow, employee_id: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط§ظ„ظپط±ط¹"><input value={editRow.branch || ""} onChange={(e) => setEditRow({ ...editRow, branch: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط§ظ„ظˆط¸ظٹظپط©"><input value={editRow.job || ""} onChange={(e) => setEditRow({ ...editRow, job: e.target.value })} className="field mt-2" /></Label>
              <Label t="طھط§ط±ظٹط® ط§ظ„طھظƒظ„ظٹظپ"><input required type="date" value={editRow.assignment_date || ""} onChange={(e) => setEditRow({ ...editRow, assignment_date: e.target.value })} className="field mt-2" /></Label>
              <Label t="ظˆظ‚طھ ط§ظ„ط¨ط¯ط§ظٹط©"><input required type="time" value={editRow.start_time || ""} onChange={(e) => updateEditTime({ start_time: e.target.value })} className="field mt-2" /></Label>
              <Label t="ظˆظ‚طھ ط§ظ„ظ†ظ‡ط§ظٹط©"><input required type="time" value={editRow.end_time || ""} onChange={(e) => updateEditTime({ end_time: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط¹ط¯ط¯ ط§ظ„ط³ط§ط¹ط§طھ"><input readOnly value={editRow.total_hours || 0} className="field mt-2 bg-slate-50" /></Label>
              <Label t="ط³ط¨ط¨ ط§ظ„طھظƒظ„ظٹظپ"><input value={editRow.reason || ""} onChange={(e) => setEditRow({ ...editRow, reason: e.target.value })} className="field mt-2" /></Label>
              <Label t="ط§ظ„ط­ط§ظ„ط©"><select value={editRow.status || "ظ…ظƒظ„ظپ"} onChange={(e) => setEditRow({ ...editRow, status: e.target.value })} className="field mt-2">{overtimeStatuses.map((status) => <option key={status}>{status}</option>)}</select></Label>
              <Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={editRow.notes || ""} onChange={(e) => setEditRow({ ...editRow, notes: e.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditRow(null)} className="btn-secondary">ط¥ظ„ط؛ط§ط،</button>
              <button className="btn-primary"><Save size={17} /> ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„</button>
            </div>
          </form>
        </div>
      )}
      {viewing && <DetailsDialog title="طھظپط§طµظٹظ„ طھظƒظ„ظٹظپ ط§ظ„ط¹ظ…ظ„ ط§ظ„ط¥ط¶ط§ظپظٹ" row={viewing} close={() => setViewing(null)} />}
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
  isAdminLikeRole(role) || String(role).includes("ط§ظ„ظ…ظˆط§ط±ط¯") || String(role).includes("ط§ظ„ظ…ظˆط§ط±ط¯");
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
  ["items_import_export", "ط§ظ„ط§ط³طھظٹط±ط§ط¯ ظˆط§ظ„طھطµط¯ظٹط±", "inventory_items_import_export"],
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
  const totalReturns = itemMovements.filter((m) => String(m.movement_type || "").includes("ط¥ط±ط¬ط§ط¹")).reduce((s, m) => s + Number(m.quantity_in || 0), 0);
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
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." /><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„طھطµظ†ظٹظپط§طھ</option>{inventoryCategories.map((c) => <option key={c}>{c}</option>)}</select><button disabled={!canCreate} onClick={() => setDialog({ kind: "item", item_id: `ITM-${Date.now()}`, item_code: "", item_name: "", category: inventoryCategories[0], unit_type: inventoryUnits[0], default_unit_cost: 0, minimum_stock: 0, reorder_point: 0, opening_balance: 0, current_balance: 0, default_currency_code: "YER", default_currency_name: getInventoryCurrency("YER").currency_name, exchange_rate: 1, is_active: true, notes: "" })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط© طµظ†ظپ</button><button onClick={() => exportExcel(exportRows, "ط§ظ„ط£طµظ†ط§ظپ")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„ظƒظˆط¯</th><th>ط§ظ„طµظ†ظپ</th><th>ط§ظ„طھطµظ†ظٹظپ</th><th>ط§ظ„ظˆط­ط¯ط©</th><th>ط§ظ„ط±طµظٹط¯</th><th>ظ†ظ‚ط·ط© ط§ظ„ط·ظ„ط¨</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{filtered.map((r) => <tr key={r.item_id}><td>{r.item_code}</td><td>{r.item_name}</td><td>{r.category}</td><td>{r.unit_type}</td><td>{r.current_balance}</td><td>{r.reorder_point}</td><td><Status>{r.is_active ? "ظ†ط´ط·" : "ط؛ظٹط± ظ†ط´ط·"}</Status></td><td><button onClick={() => setDialog({ ...r, kind: "item" })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => setDialog({ kind: "details", row: r })} className="p-2 text-slate-600"><Eye size={16} /></button><button onClick={() => deleteRecord("items", r)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div></div>;
}

function InventorySuppliersTab({ rows, filters, setFilters, setDialog, deleteRecord, canCreate }) {
  const filtered = rows.filter((x) => !filters.q || x.supplier_name.includes(filters.q) || x.phone.includes(filters.q));
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." /><button disabled={!canCreate} onClick={() => setDialog({ kind: "supplier", supplier_id: `SUP-${Date.now()}`, supplier_name: "", phone: "", address: "", tax_number: "", commercial_register: "", contact_person: "", is_active: true, notes: "" })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط© ظ…ظˆط±ط¯</button><button onClick={() => exportExcel(filtered, "ط§ظ„ظ…ظˆط±ط¯ظˆظ†")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„ظ…ظˆط±ط¯</th><th>ط§ظ„ظ‡ط§طھظپ</th><th>ط§ظ„ط³ط¬ظ„ ط§ظ„طھط¬ط§ط±ظٹ</th><th>ظ…ط³ط¤ظˆظ„ ط§ظ„طھظˆط§طµظ„</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{filtered.map((r) => <tr key={r.supplier_id}><td>{r.supplier_name}</td><td>{r.phone}</td><td>{r.commercial_register}</td><td>{r.contact_person}</td><td><Status>{r.is_active ? "ظ†ط´ط·" : "ط؛ظٹط± ظ†ط´ط·"}</Status></td><td><button onClick={() => setDialog({ ...r, kind: "supplier" })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => deleteRecord("suppliers", r)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div></div>;
}

function InventoryDocumentsTab({ type, rows, items, suppliers, filters, setFilters, setDialog, deleteRecord, updateDocStatus, canCreate }) {
  const config = inventoryDocumentConfigs[type];
  const filtered = rows.filter((x) => (!filters.q || String(x.document_number || "").includes(filters.q) || String(x.supplier_name || x.branch || "").includes(filters.q)) && (filters.status === "all" || x.status === filters.status || x.approval_status === filters.status) && (!filters.month || String(x.document_date || "").startsWith(filters.month)));
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[200px] flex-1" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." /><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[170px]" /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[170px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{["ظ…ط³ظˆط¯ط©", "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©", "ظ…ط¹طھظ…ط¯", "ظ…ط±ط­ظ„", "ظ…ط±ظپظˆط¶", "ظ…ظ„ط؛ظٹ"].map((s) => <option key={s}>{s}</option>)}</select><button disabled={!canCreate} onClick={() => setDialog({ kind: "document", type, id: `${type.toUpperCase()}-${Date.now()}`, document_number: `${config.label}-${Date.now()}`, document_date: new Date().toISOString().slice(0, 10), status: "ظ…ط³ظˆط¯ط©", approval_status: "ظ…ط³ظˆط¯ط©", supplier_id: suppliers[0]?.supplier_id || "", supplier_name: suppliers[0]?.supplier_name || "", branch: branches[0], priority: "ط¹ط§ط¯ظٹ", details: [] })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط©</button><button onClick={() => exportExcel(filtered, config.label)} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button><button onClick={() => printDocument(config.label, rowsToReportHtml(config.label, filtered, [{ key: "document_number", label: "ط§ظ„ط±ظ‚ظ…" }, { key: "document_date", label: "ط§ظ„طھط§ط±ظٹط®" }, { key: "supplier_name", label: "ط§ظ„ظ…ظˆط±ط¯" }, { key: "branch", label: "ط§ظ„ظپط±ط¹" }, { key: "status", label: "ط§ظ„ط­ط§ظ„ط©" }]))} className="btn-secondary"><Printer size={17} /> ط·ط¨ط§ط¹ط©</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط±ظ‚ظ… ط§ظ„ظ…ط³طھظ†ط¯</th><th>ط§ظ„طھط§ط±ظٹط®</th><th>ط§ظ„ظ…ظˆط±ط¯/ط§ظ„ظپط±ط¹</th><th>ط§ظ„ط­ط§ظ„ط©</th><th>ط§ظ„ط§ط¹طھظ…ط§ط¯</th><th>ط§ظ„ظ‚ظٹظ…ط©</th><th></th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id}><td>{r.document_number}</td><td>{r.document_date}</td><td>{r.supplier_name || r.branch || r.requesting_branch}</td><td><Status>{r.status}</Status></td><td><Status>{r.approval_status}</Status></td><td>{money(r.total_amount || 0)}</td><td><button onClick={() => setDialog({ kind: "details", row: r })} className="p-2 text-slate-600"><Eye size={16} /></button><button onClick={() => setDialog({ ...r, kind: "document", type, details: [] })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => updateDocStatus(type, r, "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©")} className="btn-secondary !h-8 !px-2">ط¥ط±ط³ط§ظ„</button><button onClick={() => updateDocStatus(type, r, "ظ…ط¹طھظ…ط¯")} className="btn-secondary !h-8 !px-2">ط§ط¹طھظ…ط§ط¯</button><button onClick={() => updateDocStatus(type, r, "ظ…ط±ط­ظ„")} className="btn-secondary !h-8 !px-2">طھط±ط­ظٹظ„</button><button onClick={() => deleteRecord(type, r)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div></div>;
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
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-6xl overflow-y-auto p-6"><DialogTitle title={inventoryDocumentConfigs[dialog.type]?.label || "ظ…ط³طھظ†ط¯ ظ…ط®ط²ظ†ظٹ"} close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-4"><Label t="ط±ظ‚ظ… ط§ظ„ظ…ط³طھظ†ط¯"><input value={dialog.document_number} onChange={(e) => setDialog({ ...dialog, document_number: e.target.value })} className="field mt-2" /></Label><Label t="طھط§ط±ظٹط® ط§ظ„ظ…ط³طھظ†ط¯"><input required type="date" value={dialog.document_date} onChange={(e) => setDialog({ ...dialog, document_date: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظ…ظˆط±ط¯"><select value={dialog.supplier_id} onChange={(e) => selectSupplier(e.target.value)} className="field mt-2"><option value="">ط¨ط¯ظˆظ† ظ…ظˆط±ط¯</option>{suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}</select></Label><Label t="ط§ظ„ظپط±ط¹"><select value={dialog.branch || dialog.requesting_branch} onChange={(e) => setDialog({ ...dialog, branch: e.target.value, requesting_branch: e.target.value })} className="field mt-2">{branches.map((b) => <option key={b}>{b}</option>)}</select></Label><Label t="ط§ظ„ط¹ظ…ظ„ط©"><select value={currentCurrency.currency_code} onChange={(e) => setCurrency(e.target.value)} className="field mt-2">{inventoryCurrencies.map((c) => <option key={c.currency_code} value={c.currency_code}>{c.currency_code} - {c.currency_name}</option>)}</select></Label><Label t="ط³ط¹ط± ط§ظ„طµط±ظپ"><input type="number" value={dialog.exchange_rate || currentCurrency.exchange_rate} onChange={(e) => setDialog({ ...dialog, exchange_rate: e.target.value, details: (dialog.details || []).map((d) => ({ ...d, exchange_rate: e.target.value, ...calculateInventoryLineTotal({ ...d, exchange_rate: e.target.value }) })) })} className="field mt-2" /></Label><Label t="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط³ط¹ط±"><input readOnly value={`${nf.format(docTotals.total)} ${currentCurrency.currency_code}`} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ط¨ط§ظ„ط¹ظ…ظ„ط© ط§ظ„ط£ط³ط§ط³ظٹط©"><input readOnly value={`${nf.format(docTotals.base)} YER`} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ظ„ط£ظˆظ„ظˆظٹط©"><select value={dialog.priority || "ط¹ط§ط¯ظٹ"} onChange={(e) => setDialog({ ...dialog, priority: e.target.value })} className="field mt-2"><option>ط¹ط§ط¯ظٹ</option><option>ط¹ط§ط¬ظ„</option><option>ط·ط§ط±ط¦</option></select></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={dialog.status} onChange={(e) => setDialog({ ...dialog, status: e.target.value, approval_status: e.target.value })} className="field mt-2">{inventoryStatusFlow.map((s) => <option key={s}>{s}</option>)}</select></Label><Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><input value={dialog.notes || ""} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2" /></Label></div>{dialog.type !== "invoices" && dialog.type !== "adjustments" && <div className="mt-6 rounded-2xl border p-4"><div className="mb-3 flex"><h4 className="font-extrabold">طھظپط§طµظٹظ„ ط§ظ„ط£طµظ†ط§ظپ</h4><button type="button" onClick={addDetail} className="btn-secondary mr-auto"><Plus size={15} /> ط¥ط¶ط§ظپط© طµظ†ظپ</button></div><div className="space-y-2">{(dialog.details || []).map((d, i) => <div key={d.detail_id || i} className="grid gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-8"><select value={d.item_id} onChange={(e) => selectItem(i, e.target.value)} className="field"><option value="">ط§ط®طھط± ط§ظ„طµظ†ظپ</option>{items.map((item) => <option key={item.item_id} value={item.item_id}>{item.item_name}</option>)}</select><input value={d.unit_type} readOnly className="field bg-white" /><input type="number" value={d.quantity} onChange={(e) => updateDetail(i, { quantity: e.target.value })} className="field" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." /><input type="number" value={d.unit_cost || d.unit_price} onChange={(e) => updateDetail(i, { unit_cost: e.target.value, unit_price: e.target.value })} className="field" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." /><select value={d.currency_code || currentCurrency.currency_code} onChange={(e) => { const c = getInventoryCurrency(e.target.value); updateDetail(i, { currency_code: c.currency_code, currency_name: c.currency_name, exchange_rate: c.exchange_rate }); }} className="field">{inventoryCurrencies.map((c) => <option key={c.currency_code} value={c.currency_code}>{c.currency_code}</option>)}</select><input type="number" value={d.exchange_rate || currentCurrency.exchange_rate} onChange={(e) => updateDetail(i, { exchange_rate: e.target.value })} className="field" /><input value={`${nf.format(Number(d.total_value || 0))} ${d.currency_code || currentCurrency.currency_code}`} readOnly className="field bg-white" /><button type="button" onClick={() => setDialog({ ...dialog, details: dialog.details.filter((_, idx) => idx !== i) })} className="btn-secondary text-red-600">ط­ط°ظپ</button><input value={`${nf.format(Number(d.total_value_base || 0))} YER`} readOnly className="field bg-white md:col-span-2" /></div>)}</div></div>}<DialogActions close={() => setDialog(null)} /></form></div>;
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
      if (assignments.some((a) => a.assignment_date === row.assignment_date && a.employee_id === row.employee_id && shiftsOverlap(a, row))) warnings.push(`ط§ظ„ظ…ظˆط¸ظپ ${row.employee_name} ظپظٹ ط¥ط¬ط§ط²ط©`);
      const employee = employees.find((emp) => emp.id === row.employee_id);
      if (employee?.status === "ط¥ط¬ط§ط²ط©") warnings.push(`ط§ظ„ظ…ظˆط¸ظپ ${row.employee_name} ظپظٹ ط¥ط¬ط§ط²ط©`);
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
  return <div className="panel p-4"><div className="mb-4 flex flex-wrap gap-3"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." /><select value={filters.period} onChange={(e) => setFilters({ ...filters, period: e.target.value })} className="field max-w-[170px]"><option value="all">ظƒظ„ ط§ظ„ظپطھط±ط§طھ</option>{shiftPeriods.map((p) => <option key={p}>{p}</option>)}</select><button onClick={() => setDialog({ kind: "type", shift_type_id: `ST-${Date.now()}`, shift_name: "", start_time: "08:00", end_time: "15:00", total_hours: 7, break_minutes: 0, shift_period: "طµط¨ط§ط­ظٹ", shift_mode: "ط«ط§ط¨طھ", flexible_start_from: "", flexible_end_until: "", required_hours: 0, is_active: true, notes: "", periods: [{ period_id: `STP-${Date.now()}`, period_name: "ظپطھط±ط© ط§ظ„ط¹ظ…ظ„", start_time: "08:00", end_time: "15:00", total_hours: 7, sort_order: 1, is_active: true, notes: "" }] })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط© ظ†ظˆط¹</button></div><div className="table-wrap"><table><thead><tr><th>ط§ظ„ط´ظپطھ</th><th>ظ†ظˆط¹ ط§ظ„ط´ظپطھ</th><th>ط¹ط¯ط¯ ط§ظ„ظپطھط±ط§طھ</th><th>ط§ظ„ط³ط§ط¹ط§طھ</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{filtered.map((r) => { const rows = periodsForShift(r.shift_type_id, periods); return <tr key={r.shift_type_id}><td><b>{r.shift_name}</b><div className="mt-2 space-y-1 text-xs text-slate-500">{rows.map((p) => <p key={p.period_id}>{p.period_name}: {p.start_time} - {p.end_time}</p>)}</div></td><td><Status>{r.shift_mode || "ط«ط§ط¨طھ"}</Status></td><td>{rows.length}</td><td>{shiftTotalHours(r, periods)}</td><td><Status>{r.is_active ? "ظ†ط´ط·" : "ط؛ظٹط± ظ†ط´ط·"}</Status></td><td><button onClick={() => setDialog({ ...r, kind: "type", periods: rows })} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => removeRecord("type", r.shift_type_id)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>; })}</tbody></table></div></div>;
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
  return <div className="space-y-4"><div className="panel flex flex-wrap gap-3 p-4"><input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="field max-w-[170px]" /><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field min-w-[180px]" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." /><select value={filters.shift} onChange={(e) => setFilters({ ...filters, shift: e.target.value })} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„ط´ظپطھط§طھ</option>{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[160px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{shiftAssignmentStatuses.map((s) => <option key={s}>{s}</option>)}</select><button onClick={() => setDialog({ kind: "assignment", assignment_date: new Date().toISOString().slice(0, 10), shift_type_id: firstShift.shift_type_id || "", shift_name: firstShift.shift_name || "", shift_mode: firstShift.shift_mode || "ط«ط§ط¨طھ", shift_periods: firstPeriods, start_time: firstPeriods[0]?.start_time || firstShift.start_time || "08:00", end_time: firstPeriods[firstPeriods.length - 1]?.end_time || firstShift.end_time || "15:00", total_hours: shiftTotalHours(firstShift, periods), selected_employee_ids: [], notes: "" })} className="btn-primary"><Plus size={17} /> طھظˆط²ظٹط¹ ط´ظپطھ</button><button onClick={() => setEmployeeDialog({ editing: null })} className="btn-secondary"><Users size={17} /> ط¥ط¶ط§ظپط© ظ…ظˆط¸ظپ</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr>{shiftAssignmentColumns.map((c) => <th key={c.key}>{c.label}</th>)}<th>ظˆط§طھط³ط§ط¨</th><th></th></tr></thead><tbody>{rows.map((r) => <tr key={r.assignment_id}><td>{r.assignment_date}</td><td>{r.employee_name}</td><td>{r.branch}</td><td><b>{r.shift_name}</b><p className="mt-1 text-xs text-slate-400">{r.shift_mode || "ط«ط§ط¨طھ"}</p><div className="mt-1 space-y-1 text-xs text-slate-500">{(r.shift_periods || []).map((p) => <p key={p.period_id || p.period_name}>{p.period_name}: {p.start_time}-{p.end_time}</p>)}</div></td><td>{r.start_time}</td><td>{r.end_time}</td><td>{r.total_hours}</td><td><Status>{r.status}</Status></td><td><button onClick={() => navigator.clipboard?.writeText(makeShiftMessage(r)).then(() => alert("طھظ… ظ†ط³ط® ط§ظ„ط±ط³ط§ظ„ط©"))} className="btn-secondary !h-9 !px-3">ظ†ط³ط® ط§ظ„ط±ط³ط§ظ„ط©</button><button onClick={() => window.open(`https://wa.me/${normalizeWhatsAppPhone(r.employee_phone)}?text=${encodeURIComponent(makeShiftMessage(r))}`, "_blank")} className="btn-secondary !h-9 !px-3">ظپطھط­ ظˆط§طھط³ط§ط¨</button></td><td><button onClick={() => removeRecord("assignment", r.assignment_id)} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div><CopyScheduleBox copyShiftSchedule={copyShiftSchedule} /></div>;
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
  return <div className="space-y-4"><div className="panel grid gap-3 p-4 md:grid-cols-4 xl:grid-cols-6"><input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="field" /><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field" /><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." /><select value={filters.shift} onChange={(e) => setFilters({ ...filters, shift: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„ط´ظپطھط§طھ</option>{shiftTypes.map((s) => <option key={s.shift_type_id} value={s.shift_type_id}>{s.shift_name}</option>)}</select><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{shiftAssignmentStatuses.map((s) => <option key={s}>{s}</option>)}</select></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reports.map(([title, reportRows]) => { const report = exportShiftReport(title, reportRows); return <div key={title} className="panel p-5"><FileBarChart className="text-brand-700" /><h3 className="mt-3 font-extrabold">{title}</h3><p className="mt-1 text-xs text-slate-500">ط¹ط¯ط¯ ط§ظ„ط³ط¬ظ„ط§طھ: {reportRows.length}</p><div className="mt-5 flex gap-2"><button disabled={!canExport} onClick={() => exportExcel(report.exportRows, title)} className="btn-secondary flex-1"><FileSpreadsheet size={15} /> Excel</button><button onClick={report.print} className="btn-secondary flex-1"><Printer size={15} /> PDF</button><button disabled={!canExport} onClick={() => exportDocx(title, report.exportRows)} className="btn-secondary flex-1"><Download size={15} /> Word</button></div></div>; })}</div></div>;
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
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="ط¨ظٹط§ظ†ط§طھ ظ†ظˆط¹ ط§ظ„ط´ظپطھ" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="ط§ط³ظ… ط§ظ„ط´ظپطھ"><input required value={dialog.shift_name} onChange={(e) => setDialog({ ...dialog, shift_name: e.target.value })} className="field mt-2" /></Label><Label t="ظ†ظˆط¹ ط§ظ„ط´ظپطھ"><select value={dialog.shift_mode || "ط«ط§ط¨طھ"} onChange={(e) => setDialog({ ...dialog, shift_mode: e.target.value })} className="field mt-2"><option>ط«ط§ط¨طھ</option><option>ظ…ط±ظ†</option></select></Label><Label t="ط§ظ„ظپطھط±ط©"><select value={dialog.shift_period} onChange={(e) => setDialog({ ...dialog, shift_period: e.target.value })} className="field mt-2">{shiftPeriods.map((p) => <option key={p}>{p}</option>)}</select></Label><Label t="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط³ط§ط¹ط§طھ"><input readOnly value={Number(totalHours).toFixed(2)} className="field mt-2 bg-slate-50" /></Label><Label t="ط¯ظ‚ط§ط¦ظ‚ ط§ظ„ط§ط³طھط±ط§ط­ط©"><input type="number" value={dialog.break_minutes} onChange={(e) => setDialog({ ...dialog, break_minutes: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ط؛ظٹط± ظ†ط´ط·</option></select></Label>{dialog.shift_mode === "ظ…ط±ظ†" && <><Label t="ط¨ط¯ط§ظٹط© ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ظ…ط³ظ…ظˆط­"><input type="time" value={dialog.flexible_start_from || ""} onChange={(e) => setDialog({ ...dialog, flexible_start_from: e.target.value })} className="field mt-2" /></Label><Label t="ظ†ظ‡ط§ظٹط© ط§ظ„ظ†ط·ط§ظ‚ ط§ظ„ظ…ط³ظ…ظˆط­"><input type="time" value={dialog.flexible_end_until || ""} onChange={(e) => setDialog({ ...dialog, flexible_end_until: e.target.value })} className="field mt-2" /></Label><Label t="ط¹ط¯ط¯ ط§ظ„ط³ط§ط¹ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©"><input type="number" step="0.25" value={dialog.required_hours || ""} onChange={(e) => setDialog({ ...dialog, required_hours: e.target.value })} className="field mt-2" /></Label></>}<Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><div className="mt-6 rounded-2xl border p-4"><div className="mb-3 flex"><h4 className="font-extrabold">ظپطھط±ط§طھ ط§ظ„ط´ظپطھ</h4><button type="button" onClick={addPeriod} className="btn-secondary mr-auto"><Plus size={15} /> ط¥ط¶ط§ظپط© ظپطھط±ط©</button></div><div className="space-y-3">{periods.map((period, index) => <div key={period.period_id || index} className="rounded-2xl bg-slate-50 p-3"><div className="grid gap-3 md:grid-cols-5"><input value={period.period_name} onChange={(e) => updatePeriod(index, { period_name: e.target.value })} className="field" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." /><input type="time" value={period.start_time} onChange={(e) => updatePeriod(index, { start_time: e.target.value, total_hours: calculateShiftHours(e.target.value, period.end_time) })} className="field" /><input type="time" value={period.end_time} onChange={(e) => updatePeriod(index, { end_time: e.target.value, total_hours: calculateShiftHours(period.start_time, e.target.value) })} className="field" /><input readOnly value={calculateShiftHours(period.start_time, period.end_time)} className="field bg-white" /><button type="button" onClick={() => setDialog({ ...dialog, periods: periods.filter((_, i) => i !== index) })} className="btn-secondary text-red-600">ط­ط°ظپ</button></div><input value={period.notes || ""} onChange={(e) => updatePeriod(index, { notes: e.target.value })} className="field mt-2" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." /><ShiftPeriodTimeline periods={[period]} /></div>)}</div></div><DialogActions close={() => setDialog(null)} /></form></div>;
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

const fallbackKpiCriterionTypeOptions = defaultKpiCriterionTypes.filter(([key]) => ["operational", "behavioral", "administrative", "compliance", "attendance_discipline"].includes(key));
const fallbackKpiEvaluationMethodOptions = defaultKpiEvaluationMethods.filter(([key]) => key !== "mixed").map(([key, label]) => [key, label]);
const inferCriterionType = (item = {}) => {
  if (item.criterion_type) return item.criterion_type;
  const name = String(item.criterion_name || item.name || "");
  if (/ط¹ط¯ط§ط¯|ط¹ط¯ ظ†ظ‚ط¯ظٹ|ظپط¦ط©|200|500|1000|ط®ط²ظٹظ†ط©|ظپط±ط²/.test(name)) return "cash_counting";
  if (/ط§ظ„ط§ظ†ط¶ط¨ط§ط·|ط§ظ„ط§ظ„طھط²ط§ظ…|ط§ظ„ط³ظ„ظˆظƒ|ط§ظ„طھط¹ط§ظˆظ†|ط§ظ„ط­ط¶ظˆط±|ط§ظ„ط¯ظˆط§ظ…/.test(name)) return "behavioral";
  if (/ظ…ط§ظ„ظٹ|ظ…ط¨ظ„ط؛|ظ‚ظٹظ…ط©|ط¥ظٹط±ط§ط¯|طھط­طµظٹظ„/.test(name)) return "financial";
  if (/ط±ط¶ط§|ط´ظƒط§ظˆظ‰|ط®ط¯ظ…ط©|ط¹ظ…ظٹظ„|ط³ط±ط¹ط©/.test(name)) return "service_quality";
  return "operational";
};
const kpiFieldNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

function PerformanceCriteriaPageEnhanced({ can, currentCompany }) {
  const [templates, setTemplates] = useState([]);
  const [criteriaRows, setCriteriaRows] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [dialog, setDialog] = useState(null);
  const [triedSave, setTriedSave] = useState(false);
  const [criterionTypeOptions, setCriterionTypeOptions] = useState(fallbackKpiCriterionTypeOptions);
  const [evaluationMethodOptions, setEvaluationMethodOptions] = useState(fallbackKpiEvaluationMethodOptions);
  const load = async () => {
    const companyId = currentCompany?.company_id || "";
    const [t, c, typeRows, methodRows] = await Promise.all([
      performanceCriteriaService.loadJobTemplates(),
      performanceCriteriaService.loadKpiCriteria(),
      companyId ? loadKpiCriterionTypes(companyId, { activeOnly: true }).catch((error) => { console.error("KPI criterion types fallback:", error); return []; }) : [],
      companyId ? loadKpiEvaluationMethods(companyId, { activeOnly: true }).catch((error) => { console.error("KPI evaluation methods fallback:", error); return []; }) : [],
    ]);
    setTemplates(t);
    setCriteriaRows(c);
    setCriterionTypeOptions(typeRows.length ? typeRows.map((row) => [row.type_key, row.type_name]) : fallbackKpiCriterionTypeOptions);
    setEvaluationMethodOptions(methodRows.length ? methodRows.map((row) => [row.method_key, row.method_name]) : fallbackKpiEvaluationMethodOptions);
    setSelectedJob((j) => j || t[0]?.job_name || Object.keys(defaultJobKpis)[0] || "");
  };
  useEffect(() => { load().catch((e) => alert(e.message)); }, [currentCompany?.company_id]);
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
      scoring_type: evaluationMethodOptions[0]?.[1] || scoringTypes[0],
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
    if (!String(dialog.criterion_name || "").trim()) errors.push("ط§ط³ظ… ط§ظ„ظ…ط¹ظٹط§ط± ظ…ط·ظ„ظˆط¨");
    if (Number(dialog.weight) < 0 || Number(dialog.weight) > 100 || Number.isNaN(Number(dialog.weight))) errors.push("ط§ظ„ظˆط²ظ† ط§ظ„ظ†ط³ط¨ظٹ ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† ط¨ظٹظ† 0 ظˆ 100");
    if (showCashDenominationFields && [dialog.cash200, dialog.cash500, dialog.cash1000].some((v) => Number(v) < 0 || Number.isNaN(Number(v)))) errors.push("ط£ظˆط²ط§ظ† ط§ظ„ظپط¦ط§طھ ط§ظ„ظ†ظ‚ط¯ظٹط© ظٹط¬ط¨ ط£ظ† طھظƒظˆظ† ط£ط±ظ‚ط§ظ…ظ‹ط§ طµط­ظٹط­ط©");
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
          ? `${dialog.notes || ""}\nط£ظˆط²ط§ظ† ط§ظ„ظپط¦ط§طھ ط§ظ„ظ†ظ‚ط¯ظٹط©: 200=${dialog.cash200 || 0}, 500=${dialog.cash500 || 0}, 1000=${dialog.cash1000 || 0}`.trim()
          : dialog.notes || "",
      });
      setDialog(null);
      load();
    } catch (err) {
      console.error("KPI criterion modal error:", err);
      alert(err.message || "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ");
    }
  };
  const dialogCriterionName = String(dialog?.criterion_name || dialog?.name || "");
  const showEnhancedCashDenominationFields = dialog?.criterion_type === "cash_counting" && isCashDenominationCriterion(dialogCriterionName);
  return <div className="space-y-5"><PageHead title="ظ…ط¹ط§ظٹظٹط± ط§ظ„ط£ط¯ط§ط،" desc="ظ…ط¹ط§ظٹظٹط± KPI ط¹ط§ط¯ظ„ط© ظˆظ…ظ†ظپطµظ„ط© ط­ط³ط¨ ط§ظ„ظˆط¸ظٹظپط©" action={<div className="flex gap-2"><button onClick={() => performanceCriteriaService.seedDefaults().then(load).catch((e) => alert(e.message))} className="btn-secondary">طھظˆظ„ظٹط¯ ط§ظ„ظ…ط¹ط§ظٹظٹط± ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©</button><button disabled={can?.("performance_criteria", "can_create") === false} onClick={() => openCriterion()} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط© ظ…ط¹ظٹط§ط±</button></div>} /><div className="panel flex flex-wrap gap-3 p-4"><select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} className="field max-w-md">{[...new Set([...templates.map((t) => t.job_name), ...Object.keys(defaultJobKpis)])].map((j) => <option key={j}>{j}</option>)}</select><span className={`rounded-xl px-4 py-2 text-sm font-bold ${totalWeight === 100 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط£ظˆط²ط§ظ†: {totalWeight}%</span></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„ظ…ط¹ظٹط§ط±</th><th>ط§ظ„ظ†ظˆط¹</th><th>ط§ظ„ظˆط²ظ†</th><th>ط·ط±ظٹظ‚ط© ط§ظ„ط§ط­طھط³ط§ط¨</th><th>ط§ظ„ظ…ط³طھظ‡ط¯ظپ</th><th>ط§ظ„ط­ط§ظپط²</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{rows.map((r) => <tr key={r.criterion_id}><td>{r.criterion_name}</td><td>{criterionTypeOptions.find(([id]) => id === inferCriterionType(r))?.[1] || r.criterion_type}</td><td>{r.weight}%</td><td>{r.scoring_type}</td><td>{r.target_value}</td><td>{r.affects_incentive ? "ظ†ط¹ظ…" : "ظ„ط§"}</td><td><Status>{r.is_active ? "ظ†ط´ط·" : "ظ…ط¹ط·ظ„"}</Status></td><td><button onClick={() => openCriterion(r)} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => performanceCriteriaService.deleteKpiCriterion(r.criterion_id).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div>{dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={saveCriterion} className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-6"><DialogTitle title="طھط¹ط¯ظٹظ„ ظ…ط¹ظٹط§ط±" close={() => setDialog(null)} />{triedSave && validationErrors.length > 0 && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{validationErrors.map((e) => <p key={e}>{e}</p>)}</div>}<div className="grid gap-4 md:grid-cols-3"><Label t="ط§ظ„ظˆط¸ظٹظپط©"><input value={dialog.job_name} onChange={(e) => setDialog({ ...dialog, job_name: e.target.value })} className="field mt-2" /></Label><Label t="ط§ط³ظ… ط§ظ„ظ…ط¹ظٹط§ط±"><input value={dialog.criterion_name} onChange={(e) => setDialog({ ...dialog, criterion_name: e.target.value })} className={`field mt-2 ${triedSave && !String(dialog.criterion_name || "").trim() ? "border-red-300" : ""}`} /></Label><Label t="ظ†ظˆط¹ ط§ظ„ظ…ط¹ظٹط§ط±"><select value={dialog.criterion_type} onChange={(e) => setDialog({ ...dialog, criterion_type: e.target.value })} className="field mt-2">{[...criterionTypeOptions, ...(dialog.criterion_type && !criterionTypeOptions.some(([id]) => id === dialog.criterion_type) ? [[dialog.criterion_type, dialog.criterion_type]] : [])].map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Label><Label t="ط§ظ„ظˆط²ظ† ط§ظ„ظ†ط³ط¨ظٹ %"><input type="number" value={dialog.weight} onChange={(e) => setDialog({ ...dialog, weight: e.target.value })} className="field mt-2" /></Label><Label t="ط·ط±ظٹظ‚ط© ط§ظ„طھظ‚ظٹظٹظ…"><select value={dialog.scoring_type} onChange={(e) => setDialog({ ...dialog, scoring_type: e.target.value })} className="field mt-2">{[...evaluationMethodOptions.map(([, label]) => label), ...(dialog.scoring_type && !evaluationMethodOptions.some(([, label]) => label === dialog.scoring_type) ? [dialog.scoring_type] : [])].map((label) => <option key={label} value={label}>{label}</option>)}</select></Label><Label t="ط§ظ„ط¯ط±ط¬ط© ط§ظ„ظ‚طµظˆظ‰"><input type="number" value={dialog.max_score || 100} onChange={(e) => setDialog({ ...dialog, max_score: e.target.value })} className="field mt-2" /></Label>{dialog.criterion_type === "operational" && <><Label t="ط§ظ„ط­ط¯ ط§ظ„ط£ط¯ظ†ظ‰"><input type="number" value={dialog.acceptable_threshold || 0} onChange={(e) => setDialog({ ...dialog, acceptable_threshold: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظ‡ط¯ظپ"><input type="number" value={dialog.target_value || 0} onChange={(e) => setDialog({ ...dialog, target_value: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط¯ ط§ظ„ظ…ظ…طھط§ط²"><input type="number" value={dialog.excellent_threshold || 0} onChange={(e) => setDialog({ ...dialog, excellent_threshold: e.target.value })} className="field mt-2" /></Label></>}{dialog.criterion_type === "financial" && <><Label t="ظ…ط¨ظ„ط؛ ظ…ط³طھظ‡ط¯ظپ"><input type="number" value={dialog.target_value || 0} onChange={(e) => setDialog({ ...dialog, target_value: e.target.value })} className="field mt-2" /></Label><Label t="ط¹ظ…ظ„ط©"><input value={dialog.currency || "SAR"} onChange={(e) => setDialog({ ...dialog, currency: e.target.value })} className="field mt-2" /></Label></>}{dialog.criterion_type === "service_quality" && <><Label t="ط¯ط±ط¬ط© ط§ظ„ط±ط¶ط§"><input type="number" value={dialog.satisfaction_score || 0} onChange={(e) => setDialog({ ...dialog, satisfaction_score: e.target.value })} className="field mt-2" /></Label><Label t="ط¹ط¯ط¯ ط§ظ„ط´ظƒط§ظˆظ‰"><input type="number" value={dialog.complaints_count || 0} onChange={(e) => setDialog({ ...dialog, complaints_count: e.target.value })} className="field mt-2" /></Label><Label t="ط³ط±ط¹ط© ط§ظ„ط®ط¯ظ…ط©"><input value={dialog.service_speed || ""} onChange={(e) => setDialog({ ...dialog, service_speed: e.target.value })} className="field mt-2" /></Label></>}{showEnhancedCashDenominationFields && <div className="md:col-span-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><h4 className="font-extrabold text-amber-800">ط£ظˆط²ط§ظ† ط§ظ„ظپط¦ط§طھ ط§ظ„ظ†ظ‚ط¯ظٹط© ظ„ظ„ط¹ط¯ط§ط¯</h4><div className="mt-3 grid gap-3 md:grid-cols-3">{[["cash200","ظپط¦ط© 200"],["cash500","ظپط¦ط© 500"],["cash1000","ظپط¦ط© 1000"]].map(([key,label]) => <Label key={key} t={label}><input type="number" min="0" value={dialog[key] || 0} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} className="field mt-2 bg-white" /></Label>)}</div></div>}<Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select></Label><Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes || ""} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}</div>;
}

function DailyOperationsPageEnhanced({ employees = [], currentUser, currentCompany, can }) {
  const today = getTodayDateOnly();
  const [rows, setRows] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [importDialog, setImportDialog] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const pageTopRef = useRef(null);
  const filtersRef = useRef(null);
  const tableRef = useRef(null);
  const pageBottomRef = useRef(null);
  const dashboardRef = useRef(null);
  const [filters, setFilters] = useState({
    month: "",
    date: "",
    fromDate: "",
    toDate: "",
    year: "",
    branch: "all",
    department: "all",
    employeeId: "",
    operationType: "all",
    channel: "all",
    status: "all",
  });
  const [selectedOperationIds, setSelectedOperationIds] = useState([]);
  const [bulkDialog, setBulkDialog] = useState(null);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null);
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
  const departmentOptions = [...new Set(safeRows.map((row) => row.department).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "ar"));
  const channelOptions = [...new Set([...serviceChannels, ...safeRows.map((row) => row.service_channel)].filter(Boolean))];

  const load = async (nextFilters = filters) => {
    setLoading(true);
    try {
      if (!companyId) throw new Error("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
      const queryLimit = 10000;
      const hasDateScope = Boolean(nextFilters.date || nextFilters.fromDate || nextFilters.toDate);
      const queryMonth = hasDateScope ? "" : (nextFilters.month || today.slice(0, 7) || "");
      const loaded = await dailyOperationsService.loadDailyOperations({
        companyId,
        limit: queryLimit,
        month: queryMonth,
        date: nextFilters.date,
        fromDate: nextFilters.fromDate,
        toDate: nextFilters.toDate,
        status: nextFilters.status || "all",
        employeeId: nextFilters.employeeId || "",
        operationType: nextFilters.operationType || "all",
        channel: nextFilters.channel || "all",
      });
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
        console.log("daily operations load limit debug", {
          filters: { ...nextFilters, month: queryMonth },
          limit: queryLimit,
          loadedRows: loaded.length,
          firstLoadedDate: loaded[loaded.length - 1]?.operation_date,
          lastLoadedDate: loaded[0]?.operation_date,
        });
      }
      setRows(loaded);
    } catch (error) {
      console.error("Daily operations page load error:", error);
      alert(error.message || "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط©");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsubscribe = dailyOperationsService.subscribe(load);
    return () => unsubscribe?.();
  }, [filters.month, filters.date, filters.fromDate, filters.toDate, filters.status, filters.employeeId, filters.operationType, filters.channel, companyId]);

  const filtered = safeRows.filter((row) =>
    (!filters.date || row.operation_date === filters.date)
    && (!filters.fromDate || row.operation_date >= filters.fromDate)
    && (!filters.toDate || row.operation_date <= filters.toDate)
    && (!filters.month || row.month === filters.month || String(row.operation_date || "").startsWith(filters.month))
    && (!filters.year || String(row.operation_date || "").slice(0, 4) === String(filters.year))
    && (filters.branch === "all" || row.branch === filters.branch)
    && (filters.department === "all" || row.department === filters.department)
    && (!filters.employeeId || row.employee_id === filters.employeeId)
    && (filters.operationType === "all" || row.operation_type === filters.operationType)
    && (filters.channel === "all" || row.service_channel === filters.channel)
    && (filters.status === "all" || row.status === filters.status));

  const sum = (key) => filtered.reduce((total, row) => total + Number(row[key] || 0), 0);
  const totalOperations = sum("operation_count");
  const totalErrors = sum("error_count");
  const approvedRows = filtered.filter((row) => isApprovedStatus(row.status));
  const pendingRows = filtered.filter((row) => String(row.status || "").trim() === "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©");
  const kpiRows = filtered.filter((row) => isApprovedDailyOperation(row));
  const nonKpiRows = filtered.filter((row) => !isApprovedDailyOperation(row));
  const approvedOperationsTotal = approvedRows.reduce((total, row) => total + Number(row.operation_count || 0), 0);
  const pendingOperationsTotal = pendingRows.reduce((total, row) => total + Number(row.operation_count || 0), 0);
  const kpiOperationsTotal = kpiRows.reduce((total, row) => total + Number(row.operation_count || 0), 0);
  const nonKpiOperationsTotal = nonKpiRows.reduce((total, row) => total + Number(row.operation_count || 0), 0);
  const pendingCount = filtered.filter((row) => pendingDailyOperationStatuses.has(String(row.status || "").trim())).length;
  const approvedCount = approvedRows.length;
  const rejectedCount = filtered.filter((row) => ["ظ…ط±ظپظˆط¶", "ظ…ط±ظپظˆط¶ط©"].includes(String(row.status || "").trim())).length;
  const summaries = [
    ["ط¹ط¯ط¯ ط§ظ„ط³ط¬ظ„ط§طھ", filtered.length, Upload],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظƒظ„ظٹ", totalOperations, Gauge],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ط¹طھظ…ط¯ط©", approvedOperationsTotal, BadgeCheck],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©", pendingOperationsTotal, Clock3],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ط¯ط§ط®ظ„ط© ظپظٹ KPI", kpiOperationsTotal, Gauge],
    ["ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط؛ظٹط± ط§ظ„ط¯ط§ط®ظ„ط© ظپظٹ KPI", nonKpiOperationsTotal, AlertTriangle],
    ["ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©", pendingCount, Clock3],
    ["ظ…ط¹طھظ…ط¯ط©", approvedCount, BadgeCheck],
    ["ظ…ط±ظپظˆط¶ط©", rejectedCount, AlertTriangle],
    ["ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ظƒطھظ…ظ„ط©", sum("completed_count"), BadgeCheck],
    ["ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ط¹ظ„ظ‚ط©", sum("pending_count"), Clock3],
    ["ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ط±طھط¬ط¹ط©", sum("returned_count"), ArrowUpLeft],
    ["ط¹ط¯ط¯ ط§ظ„ط£ط®ط·ط§ط،", totalErrors, AlertTriangle],
    ["ط´ظƒط§ظˆظ‰ ط§ظ„ط¹ظ…ظ„ط§ط،", sum("customer_complaints"), MessageSquareWarning],
    ["ظ†ط³ط¨ط© ط§ظ„ط£ط®ط·ط§ط،", `${totalOperations ? ((totalErrors / totalOperations) * 100).toFixed(1) : 0}%`, TrendingUp],
  ];
  const byBranch = Object.entries(groupCount(filtered, "branch")).map(([name, value]) => ({ name, value }));
  const loadedDates = safeRows.map((row) => row.operation_date).filter(Boolean).sort();
  const loadedDataRange = loadedDates.length ? `${loadedDates[0]} ط¥ظ„ظ‰ ${loadedDates[loadedDates.length - 1]}` : "ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ…ط­ظ…ظ‘ظ„ط©";
  const filtersActive = Boolean(filters.date || filters.fromDate || filters.toDate || filters.status !== "all" || filters.branch !== "all" || filters.employeeId || filters.operationType !== "all" || filters.channel !== "all" || filters.department !== "all" || filters.month || filters.year);

  useEffect(() => {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.log("daily operations filters debug", {
        date: filters.date,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        loadedRows: rows.length,
        filteredRows: filtered.length,
      });
    }
  }, [filters.date, filters.fromDate, filters.toDate, rows.length, filtered.length]);

  const updateFilter = (patch = {}) => setFilters((current) => ({
    ...current,
    ...patch,
  }));

  const setSingleDateFilter = (date) => updateFilter({
    date,
    fromDate: "",
    toDate: "",
    month: date ? "" : filters.month,
  });

  const setRangeFilter = (patch = {}) => updateFilter({
    ...patch,
    date: "",
    month: "",
  });

  const clearDailyOperationFilters = async () => {
    const resetFilters = {
    month: "",
    date: "",
    fromDate: "",
    toDate: "",
    year: "",
    branch: "all",
    department: "all",
    employeeId: "",
    operationType: "all",
    channel: "all",
    status: "all",
    };
    setFilters(resetFilters);
    await load(resetFilters);
  };

  const scrollToRef = (ref) => ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });

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
    if (!canCreate) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
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
      status: "ظ…ط³ظˆط¯ط©",
      notes: "",
    });
  };

  const save = async (event) => {
    event.preventDefault();
    const editing = Boolean(dialog?.operation_id);
    if (editing ? !canEdit : !canCreate) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    try {
      const saved = await dailyOperationsService.saveDailyOperation({
        ...dialog,
        company_id: companyId,
        included_in_kpi: normalizeIncludedInKpi(dialog.status, dialog.included_in_kpi === true),
        entered_by: currentUser?.username || "",
      });
      setRows((list) => list.some((item) => item.operation_id === saved.operation_id)
        ? list.map((item) => item.operation_id === saved.operation_id ? saved : item)
        : [saved, ...list]);
      setDialog(null);
    } catch (error) {
      alert(error.message || "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط¹ظ…ظ„ظٹط© ط§ظ„ظٹظˆظ…ظٹط©");
    }
  };

  const approve = async (row) => {
    if (!canApprove) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¹ظ…ظ„ظٹط©");
    try {
      await dailyOperationsService.approveDailyOperation({ ...row, company_id: companyId }, currentUser);
      activityLogsService.logUserActivity({
        company_id: companyId,
        user_id: currentUser?.id || currentUser?.user_id,
        username: currentUser?.username,
        module_key: "daily_operations",
        page_key: "daily_operations",
        action_type: "daily_operation_approve",
        action_label: "ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¹ظ…ظ„ظٹط©",
        description: `طھظ… ط§ط¹طھظ…ط§ط¯ ط¹ظ…ظ„ظٹط© ${row.operation_id}`,
        metadata: { count: 1, operation_id: row.operation_id },
      }).catch(() => {});
      await load();
    } catch (error) {
      alert(error.message);
    }
  };

  const pendingFilteredRows = filtered.filter((row) => pendingDailyOperationStatuses.has(String(row.status || "").trim()));
  const selectedRows = filtered.filter((row) => selectedOperationIds.includes(row.operation_id));
  const allVisibleSelected = filtered.length > 0 && filtered.every((row) => selectedOperationIds.includes(row.operation_id));
  const setAllVisibleSelected = (checked) => {
    const visibleIds = filtered.map((row) => row.operation_id);
    setSelectedOperationIds((ids) => checked
      ? [...new Set([...ids, ...visibleIds])]
      : ids.filter((id) => !visibleIds.includes(id)));
  };
  const toggleSelectedOperation = (id, checked) => {
    setSelectedOperationIds((ids) => checked ? [...new Set([...ids, id])] : ids.filter((item) => item !== id));
  };
  const buildBulkFilters = (scope = "filtered") => ({
    companyId,
    month: scope === "range" ? "" : filters.month,
    date: scope === "day" ? filters.date : "",
    fromDate: scope === "range" ? filters.fromDate : "",
    toDate: scope === "range" ? filters.toDate : "",
    year: filters.year,
    branch: filters.branch,
    department: filters.department,
    employeeId: filters.employeeId,
    operationType: filters.operationType,
    channel: filters.channel,
    status: filters.status,
  });
  const rowsForBulkScope = (scope = "filtered") => {
    if (scope === "selected") return selectedRows;
    if (scope === "day") return pendingFilteredRows.filter((row) => filters.date && row.operation_date === filters.date);
    if (scope === "range") return pendingFilteredRows.filter((row) => (!filters.fromDate || row.operation_date >= filters.fromDate) && (!filters.toDate || row.operation_date <= filters.toDate));
    if (scope === "month") return pendingFilteredRows.filter((row) => filters.month && (row.month === filters.month || String(row.operation_date || "").startsWith(filters.month)));
    return pendingFilteredRows;
  };
  const openBulkDialog = (action, scope = "selected") => {
    if (action === "approve" && !canApprove) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ");
    if (action === "reject" && can?.("daily_operations", "can_reject") === false) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط±ظپط¶ ط§ظ„ط¹ظ…ظ„ظٹط§طھ");
    if (action === "return" && !canEdit) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط¥ط±ط¬ط§ط¹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ظ„ظ„طھط¹ط¯ظٹظ„");
    if (scope === "day" && !filters.date) return alert("ط­ط¯ط¯ ط§ظ„ظٹظˆظ… ط£ظˆظ„ظ‹ط§");
    if (scope === "range" && !filters.fromDate && !filters.toDate) return alert("ط­ط¯ط¯ ط§ظ„ظپطھط±ط© ط£ظˆظ„ظ‹ط§");
    const rows = rowsForBulkScope(scope);
    const count = rows.length;
    if (!count) return alert("ظ„ط§ طھظˆط¬ط¯ ط¹ظ…ظ„ظٹط§طھ ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط© ظ…ط·ط§ط¨ظ‚ط© ظ„ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    setBulkReason("");
    setBulkProgress(null);
    setBulkDialog({ action, scope, count, ids: rows.map((row) => row.operation_id), filters: buildBulkFilters(scope) });
  };
  const runBulkAction = async () => {
    if (!bulkDialog) return;
    if (["reject", "return"].includes(bulkDialog.action) && !bulkReason.trim()) return alert("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ط§ظ„ط³ط¨ط¨ ظ‚ط¨ظ„ ط§ظ„ط­ظپط¸");
    setBulkSaving(true);
    setBulkProgress({ processed: 0, total: bulkDialog.count });
    try {
      let result = [];
      const progressOptions = {
        onProgress: (progress) => setBulkProgress({
          processed: progress.processed || 0,
          total: progress.total || bulkDialog.count,
          failed: progress.failed || 0,
        }),
      };
      if (bulkDialog.action === "approve" && ["day", "range", "month"].includes(bulkDialog.scope)) {
        result = await dailyOperationsService.approveDailyOperationsByFilter(bulkDialog.filters, currentUser, progressOptions);
      } else if (bulkDialog.action === "approve") {
        result = await dailyOperationsService.approveSelectedDailyOperations(bulkDialog.ids, currentUser, progressOptions);
      } else if (bulkDialog.action === "reject") {
        result = await dailyOperationsService.rejectSelectedDailyOperations(bulkDialog.ids, bulkReason, currentUser, progressOptions);
      } else if (bulkDialog.action === "return") {
        result = await dailyOperationsService.returnDailyOperationsForEdit(bulkDialog.ids, bulkReason, currentUser, progressOptions);
      }
      const actionType = bulkDialog.action === "approve"
        ? "daily_operations_bulk_approve"
        : bulkDialog.action === "reject"
          ? "daily_operations_reject"
          : "daily_operations_return_for_edit";
      activityLogsService.logUserActivity({
        company_id: companyId,
        user_id: currentUser?.id || currentUser?.user_id,
        username: currentUser?.username,
        module_key: "daily_operations",
        page_key: "daily_operations",
        action_type: actionType,
        action_label: bulkDialog.action === "approve" ? "ط§ط¹طھظ…ط§ط¯ ط¬ظ…ط§ط¹ظٹ" : bulkDialog.action === "reject" ? "ط±ظپط¶ ط¬ظ…ط§ط¹ظٹ" : "ط¥ط±ط¬ط§ط¹ ظ„ظ„طھط¹ط¯ظٹظ„",
        description: `طھظ… طھظ†ظپظٹط° ط§ظ„ط¥ط¬ط±ط§ط، ط¹ظ„ظ‰ ${result.length || bulkDialog.count} ط¹ظ…ظ„ظٹط©`,
        metadata: { count: result.length || bulkDialog.count, filters: bulkDialog.filters, reason: bulkDialog.action === "approve" ? undefined : bulkReason },
      }).catch(() => {});
      setSelectedOperationIds([]);
      setBulkDialog(null);
      setBulkReason("");
      setBulkProgress(null);
      await load();
      alert(bulkDialog.action === "approve" ? `طھظ… ط§ط¹طھظ…ط§ط¯ ط¹ط¯ط¯ (${result.length || bulkDialog.count}) ط¹ظ…ظ„ظٹط© ط¨ظ†ط¬ط§ط­` : "طھظ… طھظ†ظپظٹط° ط§ظ„ط¥ط¬ط±ط§ط، ط¨ظ†ط¬ط§ط­");
    } catch (error) {
      console.error("Daily operations bulk action error:", error);
      alert(error.successCount ? "طھظ… ط§ط¹طھظ…ط§ط¯ ط¬ط²ط، ظ…ظ† ط§ظ„ط¹ظ…ظ„ظٹط§طھ ظˆظپط´ظ„ ط¬ط²ط، ط¢ط®ط±." : "طھط¹ط°ط± ط§ط¹طھظ…ط§ط¯ ط¨ط¹ط¶ ط§ظ„ط¹ظ…ظ„ظٹط§طھ. ظٹط±ط¬ظ‰ ط§ظ„ظ…ط­ط§ظˆظ„ط© ظ…ط±ط© ط£ط®ط±ظ‰.");
    } finally {
      setBulkSaving(false);
    }
  };

  const remove = async (row) => {
    if (!canDelete) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط­ط°ظپ ط§ظ„ط¹ظ…ظ„ظٹط©");
    if (!confirm("ظ‡ظ„ طھط±ظٹط¯ ط­ط°ظپ ط§ظ„ط¹ظ…ظ„ظٹط© ط§ظ„ظٹظˆظ…ظٹط©طں")) return;
    try {
      await dailyOperationsService.deleteDailyOperation(row.operation_id);
      await load();
    } catch (error) {
      alert(error.message);
    }
  };

  const readImportFile = async () => {
    if (!importDialog?.file) return setImportDialog((current) => ({ ...current, message: "ظ„ظ… ظٹطھظ… ط§ط®طھظٹط§ط± ظ…ظ„ظپ" }));
    try {
      setImportDialog((current) => ({ ...current, loading: true, message: "ط¬ط§ط±ظٹ ظ‚ط±ط§ط،ط© ط§ظ„ظ…ظ„ظپ...", summary: null }));
      const parsed = await parseDailyOperationsExcel(importDialog.file);
      const validated = validateDailyOperationsRows(parsed, safeEmployees, companyId);
      setImportDialog((current) => ({ ...current, rows: validated, loading: false, message: "طھظ…طھ ظ‚ط±ط§ط،ط© ط§ظ„ظ…ظ„ظپ ظˆط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¨ظٹط§ظ†ط§طھ" }));
    } catch (error) {
      console.error("Daily operations Excel read error:", error);
      setImportDialog((current) => ({ ...current, loading: false, message: error.message || "طھط¹ط°ط± ظ‚ط±ط§ط،ط© ظ…ظ„ظپ Excel" }));
    }
  };

  const saveImportRows = async () => {
    const importRows = Array.isArray(importDialog?.rows) ? importDialog.rows : [];
    const invalidRows = importRows.filter((row) => !row.valid);
    try {
      setImportDialog((current) => ({ ...current, loading: true, message: "ط¬ط§ط±ظٹ ط§ط³طھظٹط±ط§ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ..." }));
      const result = await importDailyOperationsRows(importRows, companyId, { duplicateMode: importDialog?.duplicateMode || "update" });
      const importedBranches = new Set(importRows.filter((row) => row.valid).map((row) => row.branch).filter(Boolean));
      const importedEmployees = new Set(importRows.filter((row) => row.valid).map((row) => row.employee_id).filter(Boolean));
      const filtersMayHideImportedRows = Boolean(
        filters.status !== "all"
        || filters.date
        || filters.fromDate
        || filters.toDate
        || filters.month
        || filters.year
        || (filters.branch !== "all" && !importedBranches.has(filters.branch))
        || (filters.employeeId && !importedEmployees.has(filters.employeeId))
        || filters.department !== "all"
        || filters.operationType !== "all"
        || filters.channel !== "all",
      );
      const resetFilters = {
        ...filters,
        month: "",
        date: "",
        fromDate: "",
        toDate: "",
        year: "",
        branch: "all",
        department: "all",
        employeeId: "",
        operationType: "all",
        channel: "all",
        status: "all",
      };
      setFilters(resetFilters);
      await load(resetFilters);
      const savedCount = result.saved?.length || 0;
      const validImportRows = importRows.filter((row) => row.valid);
      const excelTotal = validImportRows.reduce((total, row) => total + Number(row.operation_count || 0), 0);
      const savedRows = result.saved || [];
      const systemTotal = savedRows.reduce((total, row) => total + Number(row.operation_count || 0), 0);
      const approvedTotal = savedRows.filter((row) => isApprovedStatus(row.status)).reduce((total, row) => total + Number(row.operation_count || 0), 0);
      const pendingReviewTotal = savedRows.filter((row) => String(row.status || "").trim() === "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©").reduce((total, row) => total + Number(row.operation_count || 0), 0);
      const kpiTotal = savedRows.filter((row) => isApprovedDailyOperation(row)).reduce((total, row) => total + Number(row.operation_count || 0), 0);
      const reconciliation = `\nط¥ط¬ظ…ط§ظ„ظٹ Excel: ${excelTotal}\nط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ظƒظ„ظٹ: ${systemTotal}\nط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط¹طھظ…ط¯: ${approvedTotal}\nط¥ط¬ظ…ط§ظ„ظٹ ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©: ${pendingReviewTotal}\nط¥ط¬ظ…ط§ظ„ظٹ ط¯ط§ط®ظ„ KPI: ${kpiTotal}\nط§ظ„ظپط±ظ‚: ${excelTotal - systemTotal}`;
      const filterWarning = filtersMayHideImportedRows
        ? "\nطھظ… ط§ظ„ط§ط³طھظٹط±ط§ط¯ ط¨ظ†ط¬ط§ط­طŒ ظ„ظƒظ† ظ‚ط¯ ظ„ط§ طھط¸ظ‡ط± ط¨ط¹ط¶ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط¨ط³ط¨ط¨ ط§ظ„ظپظ„ط§طھط± ط§ظ„ط­ط§ظ„ظٹط©. طھظ… طھطµظپظٹط± ط§ظ„ظپظ„ط§طھط± ظ„ط¹ط±ط¶ ط§ظ„ظ†طھط§ط¦ط¬."
        : "";
      alert(`طھظ… ط§ط³طھظٹط±ط§ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط© ط¨ظ†ط¬ط§ط­\nطھظ… ط§ظ„ط­ظپط¸: ${savedCount}\nط¥ط¶ط§ظپط©: ${result.inserted || 0}\nطھط­ط¯ظٹط«: ${result.updated || 0}\nطھط¬ط§ظ‡ظ„: ${result.skipped || 0}${reconciliation}${filterWarning}`);
      setImportDialog(null);
    } catch (error) {
      console.error("Daily operations Excel import error:", error);
      setImportDialog((current) => ({
        ...current,
        loading: false,
        message: "طھط¹ط°ط± ط­ظپط¸ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط©",
        summary: {
          total: importRows.length,
          imported: 0,
          updated: 0,
          skipped: 0,
          errors: invalidRows.map((row) => `ط§ظ„طµظپ ${row.rowNumber}: ${row.validationMessage}`),
        },
      }));
    }
  };

  const exportRows = (exportedRows, fileName) => {
    if (!canExport) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھطµط¯ظٹط± ط§ظ„ط¨ظٹط§ظ†ط§طھ");
    if (!exportedRows.length) return alert("ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ„ظ„طھطµط¯ظٹط±");
    try {
      exportDailyOperationsToExcel(exportedRows, fileName);
    } catch (error) {
      console.error("Daily operations Excel export error:", error);
      alert("طھط¹ط°ط± طھطµط¯ظٹط± ط§ظ„ط¨ظٹط§ظ†ط§طھ");
    }
  };

  const exportEmployeeRows = () => {
    if (!filters.employeeId) return alert("ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ ط£ظˆظ„ظ‹ط§");
    exportRows(safeRows.filter((row) => row.employee_id === filters.employeeId), `daily-operations-employee-${filters.employeeId}.xlsx`);
  };
  const exportDayRows = () => {
    if (!filters.date) return alert("ط­ط¯ط¯ ط§ظ„ظٹظˆظ… ط£ظˆظ„ظ‹ط§");
    exportRows(safeRows.filter((row) => row.operation_date === filters.date), `daily-operations-day-${filters.date}.xlsx`);
  };
  const exportMonthRows = () => {
    if (!filters.month) return alert("ط­ط¯ط¯ ط§ظ„ط´ظ‡ط± ط£ظˆظ„ظ‹ط§");
    exportRows(safeRows.filter((row) => row.month === filters.month || String(row.operation_date || "").startsWith(filters.month)), `daily-operations-month-${filters.month}.xlsx`);
  };

  const numericFields = [
    ["operation_count", "ط¹ط¯ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ"],
    ["completed_count", "ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ظƒطھظ…ظ„ط©"],
    ["pending_count", "ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ط¹ظ„ظ‚ط©"],
    ["returned_count", "ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ط±طھط¬ط¹ط©"],
    ["error_count", "ط¹ط¯ط¯ ط§ظ„ط£ط®ط·ط§ط،"],
    ["customer_complaints", "ط´ظƒط§ظˆظ‰ ط§ظ„ط¹ظ…ظ„ط§ط،"],
    ["amount", "ط§ظ„ظ…ط¨ظ„ط؛"],
  ];

  return (
    <div ref={pageTopRef} className="relative space-y-5">
      <div className="no-print fixed right-2 top-1/3 z-30 hidden flex-col gap-2 rounded-2xl border bg-white/95 p-2 shadow-lg xl:flex">
        <button onClick={() => scrollToRef(pageTopRef)} className="rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100">ط£ط¹ظ„ظ‰ ط§ظ„طµظپط­ط©</button>
        <button onClick={() => scrollToRef(filtersRef)} className="rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100">ط§ظ„ظپظ„ط§طھط±</button>
        <button onClick={() => scrollToRef(tableRef)} className="rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100">ط¬ط¯ظˆظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ</button>
        <button onClick={() => scrollToRef(pageBottomRef)} className="rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100">ط£ط³ظپظ„ ط§ظ„طµظپط­ط©</button>
        <button onClick={() => { setViewMode("dashboard"); setTimeout(() => scrollToRef(dashboardRef), 0); }} className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-extrabold text-brand-700 hover:bg-brand-100">ط§ظ„ط¯ط§ط´ط¨ظˆط±ط¯</button>
      </div>
      <PageHead
        title="ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط©"
        desc="طھط³ط¬ظٹظ„ ط§ظ„ط¥ظ†طھط§ط¬ظٹط© ط§ظ„ظٹظˆظ…ظٹط© ظˆط±ط¨ط·ظ‡ط§ ط¨ط§ظ„ظ€ KPI ظˆط§ظ„ط­ظˆط§ظپط²"
        action={(
          <div className="flex flex-wrap justify-end gap-2">
            <button disabled={!canCreate} onClick={openAdd} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط© ط¹ظ…ظ„ظٹط©</button>
          </div>
        )}
      />

      <div className="panel flex flex-wrap gap-2 p-3">
        {[["list", "ظ‚ط§ط¦ظ…ط© ط§ظ„ط¹ظ…ظ„ظٹط§طھ"], ["dashboard", "ط§ظ„ط¯ط§ط´ط¨ظˆط±ط¯"], ["import", "ط§ظ„ط§ط³طھظٹط±ط§ط¯ ظˆط§ظ„طھطµط¯ظٹط±"]].map(([key, label]) => (
          <button key={key} onClick={() => setViewMode(key)} className={`rounded-2xl px-4 py-2 text-sm font-extrabold transition ${viewMode === key ? "bg-brand-700 text-white shadow" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{label}</button>
        ))}
        <span className="mr-auto rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">ط¹ط¯ط¯ ط§ظ„ظ†طھط§ط¦ط¬ ط§ظ„ظ…ط¹ط±ظˆط¶ط©: {filtered.length} / ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ: {safeRows.length}</span>
        <span className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">ظ†ط·ط§ظ‚ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظ…ظ‘ظ„ط©: {loadedDataRange}</span>
        {filtersActive && <span className="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-extrabold text-amber-700">ط§ظ„ظپظ„ط§طھط± ظ…ظپط¹ظ„ط©</span>}
      </div>

      {viewMode === "dashboard" && <div ref={dashboardRef} className="space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-extrabold text-amber-800">
        ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط© ظ„ط§ طھط¯ط®ظ„ ظپظٹ ظ…ط¤ط´ط±ط§طھ ط§ظ„ط£ط¯ط§ط، KPI ط­طھظ‰ ظٹطھظ… ط§ط¹طھظ…ط§ط¯ظ‡ط§.
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaries.map(([label, value, Icon]) => <Mini key={label} label={label} value={value} I={Icon} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Chart title="ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط­ط³ط¨ ط§ظ„ظپط±ظˆط¹" sub="طھظˆط²ظٹط¹ ط³ط¬ظ„ط§طھ ط§ظ„ط¹ظ…ظ„ظٹط§طھ"><ResponsiveContainer width="100%" height={260}><BarChart data={byBranch}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Chart>
        <div className="panel p-4">
          <h3 className="mb-3 font-extrabold">ط£ط­ط¯ط« ط§ظ„ط¹ظ…ظ„ظٹط§طھ</h3>
          <div className="table-wrap max-h-[320px]"><table><thead><tr><th>ط§ظ„طھط§ط±ظٹط®</th><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ط¹ظ…ظ„ظٹط©</th><th>ط§ظ„ط­ط§ظ„ط©</th></tr></thead><tbody>{filtered.slice(0, 10).map((row) => <tr key={row.operation_id}><td>{row.operation_date}</td><td>{row.employee_name}</td><td>{row.operation_type}</td><td><Status>{row.status}</Status></td></tr>)}</tbody></table></div>
        </div>
      </div>
      </div>}

      {viewMode === "import" && <div className="panel p-4">
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-bold text-blue-700">ط§ط³طھظٹط±ط§ط¯ ظˆطھطµط¯ظٹط± ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط© ظ…ط¹ ط¥ط¨ظ‚ط§ط، طµظپظˆظپ ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط¸ط§ظ‡ط±ط© ط¨ط¹ط¯ ط§ظ„ط­ظپط¸.</div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadDailyOperationsTemplate} className="btn-secondary"><Download size={17} /> طھط­ظ…ظٹظ„ ظ†ظ…ظˆط°ط¬ Excel</button>
          <button disabled={!canImport} onClick={() => setImportDialog({ file: null, rows: [], duplicateMode: "update", message: "", summary: null })} className="btn-secondary disabled:opacity-50"><Upload size={17} /> ط§ط³طھظٹط±ط§ط¯ Excel</button>
          <button disabled={!canExport} onClick={() => exportRows(filtered, `daily-operations-visible-${today}.xlsx`)} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> طھطµط¯ظٹط± Excel</button>
          <button disabled={!canExport} onClick={exportEmployeeRows} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> طھطµط¯ظٹط± ط¹ظ…ظ„ظٹط§طھ ظ…ظˆط¸ظپ</button>
          <button disabled={!canExport} onClick={exportDayRows} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> طھطµط¯ظٹط± ط¹ظ…ظ„ظٹط§طھ ظٹظˆظ… ظ…ط­ط¯ط¯</button>
          <button disabled={!canExport} onClick={exportMonthRows} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> طھطµط¯ظٹط± ط¹ظ…ظ„ظٹط§طھ ط´ظ‡ط± ظ…ط­ط¯ط¯</button>
        </div>
      </div>}

      {viewMode === "list" && <>
      <div ref={filtersRef} className="panel flex flex-wrap gap-3 p-4">
        <input type="month" value={filters.month} onChange={(event) => updateFilter({ month: event.target.value, date: "", fromDate: "", toDate: "" })} className="field max-w-[160px]" />
        <input type="date" value={filters.date} onChange={(event) => setSingleDateFilter(event.target.value)} className="field max-w-[170px]" title="طھط§ط±ظٹط® ظˆط§ط­ط¯" />
        <input type="date" value={filters.fromDate} onChange={(event) => setRangeFilter({ fromDate: event.target.value })} className="field max-w-[170px]" title="ظ…ظ† طھط§ط±ظٹط®" />
        <input type="date" value={filters.toDate} onChange={(event) => setRangeFilter({ toDate: event.target.value })} className="field max-w-[170px]" title="ط¥ظ„ظ‰ طھط§ط±ظٹط®" />
        <input type="number" value={filters.year} onChange={(event) => updateFilter({ year: event.target.value })} className="field max-w-[120px]" placeholder="ط§ظ„ط³ظ†ط©" />
        <select value={filters.branch} onChange={(event) => updateFilter({ branch: event.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branchOptions.map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select>
        <select value={filters.department} onChange={(event) => updateFilter({ department: event.target.value })} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„ط¥ط¯ط§ط±ط§طھ</option>{departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}</select>
        <select value={filters.employeeId} onChange={(event) => updateFilter({ employeeId: event.target.value })} className="field max-w-[230px]"><option value="">ظƒظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ†</option>{safeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} - {employee.id}</option>)}</select>
        <select value={filters.operationType} onChange={(event) => updateFilter({ operationType: event.target.value })} className="field max-w-[210px]"><option value="all">ظƒظ„ ط£ظ†ظˆط§ط¹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ</option>{operationTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}</select>
        <select value={filters.channel} onChange={(event) => updateFilter({ channel: event.target.value })} className="field max-w-[160px]"><option value="all">ظƒظ„ ط§ظ„ظ‚ظ†ظˆط§طھ</option>{channelOptions.map((channel) => <option key={channel} value={channel}>{channel}</option>)}</select>
        <select value={filters.status} onChange={(event) => updateFilter({ status: event.target.value })} className="field max-w-[160px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select>
        <button onClick={clearDailyOperationFilters} className="btn-secondary">ظ…ط³ط­ ط§ظ„ظپظ„ط§طھط±</button>
      </div>

      <div className="panel space-y-3 p-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
          ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط© ظ„ط§ طھط¯ط®ظ„ ظپظٹ ظ…ط¤ط´ط±ط§طھ ط§ظ„ط£ط¯ط§ط، KPI ط­طھظ‰ ظٹطھظ… ط§ط¹طھظ…ط§ط¯ظ‡ط§. ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ط¯ط§ط®ظ„ط© ظپظٹ KPI ظٹط¬ط¨ ط£ظ† طھظƒظˆظ† ط­ط§ظ„طھظ‡ط§ "ظ…ط¹طھظ…ط¯" ظˆظ…ط¤ط´ط± KPI ظ…ظپط¹ظ‘ظ„.
        </div>
        {!canApprove && <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ</div>}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">ط§ظ„ظ…ط­ط¯ط¯: {selectedRows.length}</span>
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط© ط­ط³ط¨ ط§ظ„ظپظ„ط§طھط±: {pendingFilteredRows.length}</span>
          <button disabled={bulkSaving || !canApprove || !selectedRows.length} onClick={() => openBulkDialog("approve", "selected")} className="btn-primary disabled:opacity-50">ط§ط¹طھظ…ط§ط¯ ط§ظ„ظ…ط­ط¯ط¯</button>
          <button disabled={bulkSaving || !canApprove || !filters.date} onClick={() => openBulkDialog("approve", "day")} className="btn-secondary disabled:opacity-50">ط§ط¹طھظ…ط§ط¯ ط§ظ„ظٹظˆظ…</button>
          <button disabled={bulkSaving || !canApprove || (!filters.fromDate && !filters.toDate)} onClick={() => openBulkDialog("approve", "range")} className="btn-secondary disabled:opacity-50">ط§ط¹طھظ…ط§ط¯ ط§ظ„ظپطھط±ط©</button>
          <button disabled={bulkSaving || !canApprove || !filters.month} onClick={() => openBulkDialog("approve", "month")} className="btn-secondary disabled:opacity-50">ط§ط¹طھظ…ط§ط¯ ط§ظ„ط´ظ‡ط±</button>
          <button disabled={bulkSaving || !selectedRows.length || can?.("daily_operations", "can_reject") === false} onClick={() => openBulkDialog("reject", "selected")} className="btn-secondary disabled:opacity-50">ط±ظپط¶ ط§ظ„ظ…ط­ط¯ط¯</button>
          <button disabled={bulkSaving || !selectedRows.length || !canEdit} onClick={() => openBulkDialog("return", "selected")} className="btn-secondary disabled:opacity-50">ط¥ط±ط¬ط§ط¹ ظ„ظ„طھط¹ط¯ظٹظ„</button>
        </div>
      </div>

      <div ref={tableRef} className="panel p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="font-extrabold text-slate-900">ط¬ط¯ظˆظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ</h3>
            <span className="mr-auto rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">ط¹ط¯ط¯ ط§ظ„ظ†طھط§ط¦ط¬ ط§ظ„ظ…ط¹ط±ظˆط¶ط©: {filtered.length}</span>
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ: {safeRows.length}</span>
            <span className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">ظ†ط·ط§ظ‚ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظ…ظ‘ظ„ط©: {loadedDataRange}</span>
          </div>
          <div className="table-wrap max-h-[calc(100vh-260px)] overflow-auto rounded-2xl border">
            <table>
              <thead className="sticky top-0 z-10 bg-slate-50"><tr><th><input type="checkbox" checked={allVisibleSelected} onChange={(event) => setAllVisibleSelected(event.target.checked)} /></th><th>ط§ظ„طھط§ط±ظٹط®</th><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ظپط±ط¹</th><th>ظ†ظˆط¹ ط§ظ„ط¹ظ…ظ„ظٹط©</th><th>ط§ظ„ظ‚ظ†ط§ط©</th><th>ط§ظ„ط¹ط¯ط¯</th><th>ط§ظ„ظ…ظƒطھظ…ظ„ط©</th><th>ط§ظ„ظ…ط¹ظ„ظ‚ط©</th><th>ط§ظ„ظ…ط±طھط¬ط¹ط©</th><th>ط§ظ„ط£ط®ط·ط§ط،</th><th>ط§ظ„ط´ظƒط§ظˆظ‰</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="14">ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</td></tr> : filtered.length ? filtered.map((row) => (
                  <tr key={row.operation_id}>
                    <td><input type="checkbox" checked={selectedOperationIds.includes(row.operation_id)} onChange={(event) => toggleSelectedOperation(row.operation_id, event.target.checked)} /></td>
                    <td>{row.operation_date}</td><td>{row.employee_name}<p className="text-xs text-slate-400">{row.job_name}</p></td><td>{row.branch}</td><td>{row.operation_type}</td><td>{row.service_channel}</td><td>{row.operation_count}</td><td>{row.completed_count}</td><td>{row.pending_count}</td><td>{row.returned_count}</td><td>{row.error_count}</td><td>{row.customer_complaints}</td><td><Status>{row.status}</Status></td>
                    <td><button disabled={!canEdit} onClick={() => setDialog(row)} className="p-2 text-blue-600 disabled:opacity-40"><Pencil size={16} /></button><button disabled={!canApprove} onClick={() => approve(row)} className="p-2 text-green-700 disabled:opacity-40"><BadgeCheck size={16} /></button><button disabled={!canDelete || row.status !== "ظ…ط³ظˆط¯ط©"} onClick={() => remove(row)} className="p-2 text-red-600 disabled:opacity-40"><Trash2 size={16} /></button></td>
                  </tr>
                )) : <tr><td colSpan="14" className="py-8 text-center text-slate-400"><p className="font-extrabold text-slate-600">ظ„ط§ طھظˆط¬ط¯ ط¹ظ…ظ„ظٹط§طھ ظ…ط·ط§ط¨ظ‚ط© ظ„ظ„ظپظ„ط§طھط± ط§ظ„ط­ط§ظ„ظٹط©.</p><button onClick={clearDailyOperationFilters} className="mt-3 btn-secondary">ظ…ط³ط­ ط§ظ„ظپظ„ط§طھط±</button></td></tr>}
              </tbody>
            </table>
          </div>
      </div>
      </>}

      {dialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6">
            <DialogTitle title="ط¹ظ…ظ„ظٹط© ظٹظˆظ…ظٹط©" close={() => setDialog(null)} />
            <div className="grid gap-4 md:grid-cols-3">
              <Label t="ط§ظ„طھط§ط±ظٹط®"><input required type="date" value={dialog.operation_date} onChange={(event) => setDialog({ ...dialog, operation_date: event.target.value, month: event.target.value.slice(0, 7) })} className="field mt-2" /></Label>
              <Label t="ط§ظ„ظ…ظˆط¸ظپ"><select required value={dialog.employee_id} onChange={(event) => pickEmployee(event.target.value)} className="field mt-2"><option value="">ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ</option>{safeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} - {employee.id} - {employee.branch}</option>)}</select></Label>
              <Label t="ط§ظ„ظˆط¸ظٹظپط©"><input readOnly value={dialog.job_name} className="field mt-2 bg-slate-50" /></Label>
              <Label t="ظ†ظˆط¹ ط§ظ„ط¹ظ…ظ„ظٹط©"><select required value={dialog.operation_type} onChange={(event) => setDialog({ ...dialog, operation_type: event.target.value })} className="field mt-2">{operationTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}</select></Label>
              <Label t="ط§ظ„ظ‚ظ†ط§ط©"><select required value={dialog.service_channel} onChange={(event) => setDialog({ ...dialog, service_channel: event.target.value })} className="field mt-2">{serviceChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}</select></Label>
              {numericFields.map(([key, label]) => <Label key={key} t={label}><input required={key === "operation_count"} type="number" min="0" value={dialog[key] ?? 0} onChange={(event) => setDialog({ ...dialog, [key]: event.target.value })} className="field mt-2" /></Label>)}
              <Label t="ط§ظ„ط¹ظ…ظ„ط©"><input value={dialog.currency || ""} onChange={(event) => setDialog({ ...dialog, currency: event.target.value })} className="field mt-2" /></Label>
              <Label t="ط§ظ„ط­ط§ظ„ط©"><select value={dialog.status || "ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط©"} onChange={(event) => setDialog({ ...dialog, status: event.target.value, included_in_kpi: normalizeIncludedInKpi(event.target.value, dialog.included_in_kpi === true) })} className="field mt-2">{operationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></Label>
              <label className={`mt-6 flex items-center gap-2 rounded-2xl p-3 text-sm font-bold ${isApprovedStatus(dialog.status) ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                <input type="checkbox" disabled={!isApprovedStatus(dialog.status)} checked={isApprovedDailyOperation(dialog)} onChange={(event) => setDialog({ ...dialog, included_in_kpi: normalizeIncludedInKpi(dialog.status, event.target.checked) })} />
                ظٹط¯ط®ظ„ ظپظٹ KPI {isApprovedStatus(dialog.status) ? "" : "(ظ…طھط§ط­ ظپظ‚ط· ط¹ظ†ط¯ ط§ظ„ط§ط¹طھظ…ط§ط¯)"}
              </label>
              <Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes || ""} onChange={(event) => setDialog({ ...dialog, notes: event.target.value })} className="field mt-2 !h-auto py-3" rows="3" /></Label>
            </div>
            <DialogActions close={() => setDialog(null)} />
          </form>
        </div>
      )}

      {bulkDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel w-full max-w-xl p-6">
            <DialogTitle
              title={bulkDialog.action === "approve" ? "طھط£ظƒظٹط¯ ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ" : bulkDialog.action === "reject" ? "ط±ظپط¶ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ط­ط¯ط¯ط©" : "ط¥ط±ط¬ط§ط¹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ظ„ظ„طھط¹ط¯ظٹظ„"}
              close={() => !bulkSaving && setBulkDialog(null)}
            />
            {bulkDialog.action === "approve" ? (
              <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-7 text-emerald-800">
                ط³ظٹطھظ… ط§ط¹طھظ…ط§ط¯ ط¹ط¯ط¯ ({bulkDialog.count}) ط¹ظ…ظ„ظٹط©. ط¨ط¹ط¯ ط§ظ„ط§ط¹طھظ…ط§ط¯ ط³طھط¯ط®ظ„ ظ‡ط°ظ‡ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ظپظٹ ط§ظ„ط¥ظ†طھط§ط¬ظٹط© ظˆط¯ط±ط¬ط§طھ KPI ظˆط§ظ„ط­ظˆط§ظپط².
              </p>
            ) : (
              <div className="space-y-3">
                <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
                  ط³ظٹطھظ… طھط­ط¯ظٹط« ط¹ط¯ط¯ ({bulkDialog.count}) ط¹ظ…ظ„ظٹط©. ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ط§ظ„ط³ط¨ط¨ ظ‚ط¨ظ„ ط§ظ„ط­ظپط¸.
                </p>
                <Label t="ط§ظ„ط³ط¨ط¨">
                  <textarea value={bulkReason} onChange={(event) => setBulkReason(event.target.value)} className="field mt-2 !h-auto py-3" rows="3" />
                </Label>
              </div>
            )}
            {bulkProgress && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm font-extrabold text-slate-700">
                  <span>
                    {bulkDialog.action === "approve" ? "ط¬ط§ط±ظٹ ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ" : "ط¬ط§ط±ظٹ طھط­ط¯ظٹط« ط§ظ„ط¹ظ…ظ„ظٹط§طھ"}: {bulkProgress.processed} / {bulkProgress.total}
                  </span>
                  {bulkProgress.failed > 0 && <span className="text-red-700">ظپط´ظ„: {bulkProgress.failed}</span>}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-brand-700 transition-all"
                    style={{ width: `${Math.min(100, Math.round((Number(bulkProgress.processed || 0) / Math.max(1, Number(bulkProgress.total || 1))) * 100))}%` }}
                  />
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button disabled={bulkSaving} onClick={() => setBulkDialog(null)} className="btn-secondary">ط¥ظ„ط؛ط§ط،</button>
              <button disabled={bulkSaving || (["reject", "return"].includes(bulkDialog.action) && !bulkReason.trim())} onClick={runBulkAction} className="btn-primary disabled:opacity-50">
                {bulkSaving ? "ط¬ط§ط±ظٹ ط§ظ„ط­ظپط¸..." : bulkDialog.action === "approve" ? "ط§ط¹طھظ…ط§ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ" : "ط­ظپط¸ ط§ظ„ط¥ط¬ط±ط§ط،"}
              </button>
            </div>
          </div>
        </div>
      )}

      {importDialog && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="panel max-h-[90vh] w-full max-w-6xl overflow-y-auto p-6">
            <DialogTitle title="ط§ط³طھظٹط±ط§ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط© ظ…ظ† Excel" close={() => setImportDialog(null)} />
            <div className="grid gap-4 md:grid-cols-3">
              <Label t="ط§ط®طھظٹط§ط± ظ…ظ„ظپ Excel"><input type="file" accept=".xlsx,.xls" onChange={(event) => setImportDialog({ ...importDialog, file: event.target.files?.[0] || null, rows: [], summary: null })} className="field mt-2 py-2" /></Label>
              <Label t="ط·ط±ظٹظ‚ط© ط§ظ„طھط¹ط§ظ…ظ„ ظ…ط¹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ظƒط±ط±ط©"><select value={importDialog.duplicateMode} onChange={(event) => setImportDialog({ ...importDialog, duplicateMode: event.target.value })} className="field mt-2"><option value="update">طھط­ط¯ظٹط« ط§ظ„ظ…ظˆط¬ظˆط¯</option><option value="ignore">طھط¬ط§ظ‡ظ„ ط§ظ„ظ…ظƒط±ط±</option></select></Label>
              <div className="flex items-end gap-2"><button onClick={readImportFile} disabled={importDialog.loading} className="btn-primary">ظ‚ط±ط§ط،ط© ط§ظ„ظ…ظ„ظپ</button><button onClick={saveImportRows} disabled={!(importDialog.rows || []).some((row) => row.valid) || importDialog.loading} className="btn-secondary disabled:opacity-50">ط­ظپط¸ ط§ظ„ط¹ظ…ظ„ظٹط§طھ</button></div>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600"><b>ط§ظ„ط£ط¹ظ…ط¯ط© ط§ظ„ظ…ط·ظ„ظˆط¨ط©:</b> ط§ظ„طھط§ط±ظٹط®طŒ ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط¸ظٹظپظٹ ط£ظˆ ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپطŒ ظ†ظˆط¹ ط§ظ„ط¹ظ…ظ„ظٹط©طŒ ط¹ط¯ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ. ظٹطھظ… ط§ط³طھظƒظ…ط§ظ„ ط§ظ„ظپط±ط¹ ظˆط§ظ„ظˆط¸ظٹظپط© ظ…ظ† ط³ط¬ظ„ ط§ظ„ظ…ظˆط¸ظپ ط¹ظ†ط¯ طھط±ظƒظ‡ظ…ط§ ظپط§ط±ط؛ظٹظ†.</div>
            {importDialog.message && <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">{importDialog.message}</div>}
            {importDialog.summary && <div className="mt-4"><div className="grid gap-3 md:grid-cols-5"><Mini label="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طµظپظˆظپ" value={importDialog.summary.total} I={FileSpreadsheet} /><Mini label="طھظ… ط§ظ„ط§ط³طھظٹط±ط§ط¯" value={importDialog.summary.imported} I={BadgeCheck} /><Mini label="طھظ… ط§ظ„طھط­ط¯ظٹط«" value={importDialog.summary.updated} I={Pencil} /><Mini label="طھظ… ط§ظ„طھط¬ط§ظ‡ظ„" value={importDialog.summary.skipped} I={Clock3} /><Mini label="ط£ط®ط·ط§ط، ط§ظ„ط§ط³طھظٹط±ط§ط¯" value={importDialog.summary.errors.length} I={AlertTriangle} /></div>{importDialog.summary.errors.length > 0 && <div className="mt-3 max-h-36 overflow-y-auto rounded-xl bg-red-50 p-3 text-sm text-red-700">{importDialog.summary.errors.map((message) => <p key={message}>{message}</p>)}</div>}</div>}
            <div className="mt-4 grid gap-3 md:grid-cols-4"><Mini label="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طµظپظˆظپ" value={importDialog.rows?.length || 0} I={FileSpreadsheet} /><Mini label="ط§ظ„طµط­ظٹط­ط©" value={(importDialog.rows || []).filter((row) => row.valid && !row.warning).length} I={BadgeCheck} /><Mini label="ط§ظ„ط®ط§ط·ط¦ط©" value={(importDialog.rows || []).filter((row) => !row.valid).length} I={AlertTriangle} /><Mini label="ط§ظ„ظ…ط­ط°ط±ط©" value={(importDialog.rows || []).filter((row) => row.valid && row.warning).length} I={MessageSquareWarning} /></div>
            <div className="table-wrap mt-4"><table><thead><tr><th>ط±ظ‚ظ… ط§ظ„طµظپ</th><th>ط§ظ„طھط§ط±ظٹط®</th><th>ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط¸ظٹظپظٹ</th><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„ظˆط¸ظٹظپط©</th><th>ظ†ظˆط¹ ط§ظ„ط¹ظ…ظ„ظٹط©</th><th>ط§ظ„ظ‚ظ†ط§ط©</th><th>ط¹ط¯ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ</th><th>ط§ظ„ظ…ظƒطھظ…ظ„ط©</th><th>ط§ظ„ظ…ط¹ظ„ظ‚ط©</th><th>ط§ظ„ظ…ط±طھط¬ط¹ط©</th><th>ط§ظ„ط£ط®ط·ط§ط،</th><th>ط§ظ„ط´ظƒط§ظˆظ‰</th><th>ظ†طھظٹط¬ط© ط§ظ„طھط­ظ‚ظ‚</th></tr></thead><tbody>{(importDialog.rows || []).map((row) => <tr key={row.rowNumber} className={!row.valid ? "bg-red-50" : row.warning ? "bg-amber-50" : ""}><td>{row.rowNumber}</td><td>{row.operation_date}</td><td>{row.employee_name}</td><td>{row.employee_id}</td><td>{row.branch}</td><td>{row.job_name}</td><td>{row.operation_type}</td><td>{row.service_channel}</td><td>{row.operation_count}</td><td>{row.completed_count}</td><td>{row.pending_count}</td><td>{row.returned_count}</td><td>{row.error_count}</td><td>{row.customer_complaints}</td><td>{row.validationMessage}</td></tr>)}</tbody></table></div>
          </div>
        </div>
      )}
      <div ref={pageBottomRef} />
    </div>
  );
}

function PlatformLogin({ onLogin }) {
  const [u, setU] = useState("platform"),
    [pw, setPw] = useState(""),
    [err, setErr] = useState(""),
    [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!u.trim() || !pw) return setErr("ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط© ظˆظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±.");
    setLoading(true);
    try {
      const user = await cloudLoginWithSupabase(u.trim(), pw, "", "PLATFORM");
      if (!isPlatformAdminUser(user)) throw new Error("ظ‡ط°ط§ ط§ظ„ظ…ط³ط§ط± ظ…ط®طµطµ ظ„ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط© ظپظ‚ط·");
      onLogin(user);
    } catch (error) {
      setErr(error.message || "طھط¹ط°ط± طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#111319] p-5">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] bg-white p-8 shadow-2xl sm:p-12">
        <span className="text-sm font-bold text-brand-700">{APP_SHORT_NAME}</span>
        <h1 className="mt-2 text-3xl font-extrabold">ط¯ط®ظˆظ„ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©</h1>
        <p className="mt-2 text-sm text-slate-500">ظ…ط³ط§ط± ظ…ط­ظ…ظٹ ظ„ط¥ط¯ط§ط±ط© ط§ظ„ظ…ظ†طµط© ظˆط§ظ„ط´ط±ظƒط§طھ</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Label t="ط§ط³ظ… ظ…ط³طھط®ط¯ظ… ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©"><input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" placeholder="platform" className="field mt-2" /></Label>
          <Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" placeholder="ط£ط¯ط®ظ„ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±" className="field mt-2" /></Label>
          {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          <button disabled={loading} className="btn-primary h-12 w-full disabled:cursor-not-allowed disabled:opacity-60">{loading ? "ط¬ط§ط±ظٹ ط§ظ„طھط­ظ‚ظ‚..." : "ط¯ط®ظˆظ„ ظ…ط´ط±ظپ ط§ظ„ظ…ظ†طµط©"} <ArrowUpLeft size={18} /></button>
        </form>
      </div>
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
  return <div className="space-y-5"><PageHead title="ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط©" desc="طھط³ط¬ظٹظ„ ط§ظ„ط¥ظ†طھط§ط¬ظٹط© ط§ظ„ظٹظˆظ…ظٹط© ظˆط±ط¨ط·ظ‡ط§ ط¨ط§ظ„ظ€ KPI ظˆط§ظ„ط­ظˆط§ظپط²" action={<button disabled={can?.("daily_operations", "can_create") === false} onClick={() => { const today = getTodayDateOnly(); setDialog({ operation_id: `OP-${Date.now()}`, operation_date: today, month: today.slice(0, 7), employee_id: "", employee_name: "", branch: "", job_name: "", operation_type: operationTypes[0], service_channel: serviceChannels[0], currency: "SAR", operation_count: 0, completed_count: 0, error_count: 0, returned_count: 0, pending_count: 0, customer_complaints: 0, amount: 0, status: "ظ…ط³ظˆط¯ط©", notes: "" }); }} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط© ط¹ظ…ظ„ظٹط©</button>} /><div className="grid gap-4 md:grid-cols-4"><Mini label="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¹ظ…ظ„ظٹط§طھ" value={totalOps} I={Gauge} /><Mini label="ط§ظ„ط£ط®ط·ط§ط،" value={totalErrors} I={AlertTriangle} /><Mini label="ظ†ط³ط¨ط© ط§ظ„ط£ط®ط·ط§ط،" value={`${totalOps ? ((totalErrors / totalOps) * 100).toFixed(1) : 0}%`} I={TrendingUp} /><Mini label="ط§ظ„ظ…ط¹طھظ…ط¯ط©" value={filtered.filter((x) => x.status === "ظ…ط¹طھظ…ط¯ط©").length} I={BadgeCheck} /></div><div className="panel flex flex-wrap gap-3 p-4"><input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field max-w-[180px]" /><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field min-w-[180px]" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[160px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{operationStatuses.map((s) => <option key={s}>{s}</option>)}</select><button onClick={() => exportExcel(filtered, "ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظٹظˆظ…ظٹط©")} className="btn-secondary"><FileSpreadsheet size={17} /> Excel</button></div><div className="grid gap-5 xl:grid-cols-2"><div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„طھط§ط±ظٹط®</th><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„ط¹ظ…ظ„ظٹط©</th><th>ط§ظ„ط¹ط¯ط¯</th><th>ط§ظ„ط£ط®ط·ط§ط،</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{loading ? <tr><td colSpan="8">ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</td></tr> : filtered.map((r) => <tr key={r.operation_id}><td>{r.operation_date}</td><td>{r.employee_name}<p className="text-xs text-slate-400">{r.job_name}</p></td><td>{r.branch}</td><td>{r.operation_type}</td><td>{r.operation_count}</td><td>{r.error_count}</td><td><Status>{r.status}</Status></td><td><button onClick={() => setDialog(r)} className="p-2 text-blue-600"><Pencil size={16} /></button><button onClick={() => approve(r)} className="p-2 text-green-700"><BadgeCheck size={16} /></button><button disabled={r.status !== "ظ…ط³ظˆط¯ط©"} onClick={() => dailyOperationsService.deleteDailyOperation(r.operation_id).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></div><Chart title="ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط­ط³ط¨ ط§ظ„ظپط±ظˆط¹" sub="طھظˆط²ظٹط¹ ط³ط¬ظ„ط§طھ ط§ظ„ط¹ظ…ظ„ظٹط§طھ"><ResponsiveContainer width="100%" height={260}><BarChart data={byBranch}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#7f1d1d" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></Chart></div>{dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="ط¹ظ…ظ„ظٹط© ظٹظˆظ…ظٹط©" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3"><Label t="ط§ظ„طھط§ط±ظٹط®"><input type="date" value={dialog.operation_date} onChange={(e) => setDialog({ ...dialog, operation_date: e.target.value, month: e.target.value.slice(0, 7) })} className="field mt-2" /></Label><Label t="ط§ظ„ظ…ظˆط¸ظپ"><select value={dialog.employee_id} onChange={(e) => pickEmployee(e.target.value)} className="field mt-2"><option value="">ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ</option>{employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} - {emp.id} - {emp.branch}</option>)}</select></Label><Label t="ط§ظ„ظˆط¸ظٹظپط©"><input readOnly value={dialog.job_name} className="field mt-2 bg-slate-50" /></Label><Label t="ظ†ظˆط¹ ط§ظ„ط¹ظ…ظ„ظٹط©"><select value={dialog.operation_type} onChange={(e) => setDialog({ ...dialog, operation_type: e.target.value })} className="field mt-2">{operationTypes.map((t) => <option key={t}>{t}</option>)}</select></Label><Label t="ط§ظ„ظ‚ظ†ط§ط©"><select value={dialog.service_channel} onChange={(e) => setDialog({ ...dialog, service_channel: e.target.value })} className="field mt-2">{serviceChannels.map((t) => <option key={t}>{t}</option>)}</select></Label>{["operation_count","completed_count","pending_count","error_count","returned_count","customer_complaints","amount"].map((k) => <Label key={k} t={k}><input type="number" value={dialog[k] || 0} onChange={(e) => setDialog({ ...dialog, [k]: e.target.value })} className="field mt-2" /></Label>)}<Label t="ظ…ظ„ط§ط­ط¸ط§طھ"><textarea value={dialog.notes} onChange={(e) => setDialog({ ...dialog, notes: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}</div>;
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
      setMessages((list) => [...list, { role: "assistant", message: "ط§ظƒطھط¨ ط·ظ„ط¨ظƒ ط£ظˆظ„ظ‹ط§" }]);
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      let current = session;
      if (!current) {
        current = await aiAssistantService.createChatSession(currentUser?.user_id || currentUser?.username || "", "ظ…ط­ط§ط¯ط«ط© ط§ظ„ظ…ط³ط§ط¹ط¯");
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
      setMessages((list) => [...list, { role: "assistant", message: error.message || "طھط¹ط°ط± طھظ†ظپظٹط° ط·ظ„ط¨ ط§ظ„ظ…ط³ط§ط¹ط¯ ط­ط§ظ„ظٹط§ظ‹." }]);
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
            <b className="mb-3 block text-sm">ط£ظˆط¶ط§ط¹ ط§ظ„ظ…ط³ط§ط¹ط¯</b>
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
                <b>ط§ظ„ظ…ط³ط§ط¹ط¯ ط§ظ„ط°ظƒظٹ ط§ظ„طھط´ط؛ظٹظ„ظٹ</b>
                <button onClick={() => setMessages([])} className="mr-auto rounded-lg bg-white/10 px-3 py-1 text-xs">ظ…ط³ط­</button>
                <button onClick={() => setOpen(false)} className="rounded-lg bg-white/10 px-3 py-1 text-xs">ط¥ط؛ظ„ط§ظ‚</button>
              </div>
              <p className="mt-1 text-xs opacity-80">ظٹط¹ظ…ظ„ ط­ط§ظ„ظٹط§ظ‹ ط¨ظˆط¶ط¹ ط§ظ„طھط­ظ„ظٹظ„ ط§ظ„ط¯ط§ط®ظ„ظٹ. ظٹظ…ظƒظ† ط±ط¨ط·ظ‡ ط¨ط®ط¯ظ…ط© ط°ظƒط§ط، ط§طµط·ظ†ط§ط¹ظٹ ظ…ظ† ط§ظ„ط®ط§ط¯ظ… ط¹ط¨ط± VITE_AI_ASSISTANT_ENDPOINT.</p>
            </div>
            <div className="grid gap-2 border-b p-3 md:grid-cols-5">
              <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field">
                <option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>
                {branchOptions.map((branch) => <option key={branch}>{branch}</option>)}
              </select>
              <input type="month" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })} className="field" />
              <select value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field">
                <option value="">ظƒظ„ ط§ظ„ظ…ظˆط¸ظپظٹظ†</option>
                {employees.slice(0, 200).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </select>
              <input value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="field" placeholder="ط§ظ„ظ‚ط³ظ…" />
              <input value={filters.reportType} onChange={(e) => setFilters({ ...filters, reportType: e.target.value })} className="field" placeholder="ظ†ظˆط¹ ط§ظ„طھظ‚ط±ظٹط±" />
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
              {!messages.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-500">ط§ظƒطھط¨ ط·ظ„ط¨ظƒ ظ…ط«ظ„: ط§ظپطھط­ طµظپط­ط© ط§ظ„ط¶ظ…ط§ظ†ط§طھطŒ ط£ظ†ط´ط¦ طھظ‚ط±ظٹط± ط£ط¯ط§ط، ط´ظ‡ط±ظٹطŒ ط§ط¨ظ†ظٹ ط®ط·ط© طھط¯ط±ظٹط¨طŒ ط£ظˆ طµط؛ طھط¹ظ…ظٹظ… ط¥ط¯ط§ط±ظٹ.</p>}
              {messages.map((message, index) => (
                <div key={index} className={`whitespace-pre-wrap rounded-2xl p-4 text-sm leading-7 ${message.role === "user" ? "mr-auto max-w-[80%] bg-brand-50 text-brand-900" : "ml-auto max-w-[92%] bg-slate-50 text-slate-700"}`}>
                  {message.message}
                </div>
              ))}
              {loading && <p className="text-xs text-slate-400">ط§ظ„ظ…ط³ط§ط¹ط¯ ظٹظƒطھط¨...</p>}
            </div>
            <div className="flex flex-wrap gap-2 border-t p-3">
              <button onClick={() => send("ط§ظپطھط­ طµظپط­ط© ط§ظ„ظ…ظˆط¸ظپظٹظ†")} className="btn-secondary !h-10">ط§ظپطھط­ ط§ظ„طµظپط­ط©</button>
              <button onClick={() => send("ط£ظ†ط´ط¦ طھظ‚ط±ظٹط± " + (filters.reportType || "ط¥ط¯ط§ط±ظٹ"))} className="btn-secondary !h-10">ط£ظ†ط´ط¦ طھظ‚ط±ظٹط±</button>
              <button onClick={() => send("ط­ظˆظ‘ظ„ ط§ظ„ط¥ط¬ط§ط¨ط© ط¥ظ„ظ‰ ط®ط·ط©")} className="btn-secondary !h-10">ط­ظˆظ‘ظ„ ط¥ظ„ظ‰ ط®ط·ط©</button>
              <button onClick={() => send("ط­ظˆظ‘ظ„ ط§ظ„ط¥ط¬ط§ط¨ط© ط¥ظ„ظ‰ ط®ط·ط§ط¨")} className="btn-secondary !h-10">ط­ظˆظ‘ظ„ ط¥ظ„ظ‰ ط®ط·ط§ط¨</button>
              <button onClick={copyLast} className="btn-secondary !h-10">ظ†ط³ط®</button>
              <button onClick={exportLast} className="btn-secondary !h-10">طھطµط¯ظٹط±</button>
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
                  placeholder="ط§ظƒطھط¨ ط·ظ„ط¨ظƒ ظ„ظ„ظ…ط³ط§ط¹ط¯..."
                />
                <button disabled={loading} onClick={() => send()} className="btn-primary">ط¥ط±ط³ط§ظ„</button>
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
  return <div className="space-y-5"><PageHead title="ط·ظ„ط¨ط§طھ ط§ظ„طھظˆط¸ظٹظپ" desc="ط¥ط¯ط§ط±ط© ط¯ظˆط±ط© ط§ظ„طھظˆط¸ظٹظپ ظ…ظ† ط§ظ„ط§ط­طھظٹط§ط¬ ط­طھظ‰ ط§ظ„طھط¹ظٹظٹظ† ظˆط±ط³ط§ط¦ظ„ ط§ظ„طھط±ط­ظٹط¨" action={<button disabled={!canCreate} onClick={openAdd} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط©</button>} /><div className="panel flex flex-wrap gap-2 p-3">{visibleTabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? "bg-brand-700 text-white" : "bg-slate-50 text-slate-600"}`}>{label}</button>)}</div>{tab === "reports" ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Object.entries(reports).map(([key, report]) => <div key={key} className="panel p-4"><h3 className="font-extrabold">{report.title}</h3><p className="mt-2 text-sm text-slate-500">ط¹ط¯ط¯ ط§ظ„ط³ط¬ظ„ط§طھ: {report.rows.length}</p><div className="mt-4 flex gap-2"><button onClick={() => exportExcel(report.rows, report.title)} className="btn-secondary">Excel</button><button onClick={() => printDocument(report.title, rowsToReportHtml(report.title, report.rows, []))} className="btn-primary">ط·ط¨ط§ط¹ط©</button></div></div>)}</div> : <><div className="panel flex flex-wrap gap-3 p-4"><input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط¨ط­ط·آ«..." /><select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option>{[...new Set(tableRows.map((r) => r.status).filter(Boolean))].map((s) => <option key={s}>{s}</option>)}</select><select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[180px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select><button onClick={() => exportExcel(filtered, "ط·ظ„ط¨ط§طھ ط§ظ„طھظˆط¸ظٹظپ")} className="btn-secondary">Excel</button></div><div className="panel p-4"><div className="table-wrap"><table><thead><tr>{cols.map((c) => <th key={c}>{recruitmentLabels[c] || c}</th>)}<th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{filtered.map((row, i) => <tr key={row[recruitmentPrimary[tab]] || row.id || i}>{cols.map((c) => <td key={c}>{String(row[c] ?? "")}</td>)}<td><Status>{row.status || row.evaluation_status || row.recommendation || "â€”"}</Status></td><td><button disabled={!canEdit || tab === "probation_employees"} onClick={() => setDialog({ type: tab, ...row })} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canDelete || tab === "probation_employees"} onClick={() => remove(row)} className="p-2 text-red-600"><Trash2 size={16} /></button>{tab === "contracts" && <button onClick={() => recruitmentService.convertContractToEmployee(row).then(() => alert("طھظ… طھط­ظˆظٹظ„ ط§ظ„ظ…ط±ط´ط­ ط¥ظ„ظ‰ ظ…ظˆط¸ظپ")).catch((e) => alert(e.message))} className="p-2 text-green-700">طھط¹ظٹظٹظ†</button>}{tab === "welcome_messages" && <button onClick={() => navigator.clipboard?.writeText(row.whatsapp_message || row.message_template || "")} className="p-2 text-slate-600">ظ†ط³ط®</button>}</td></tr>)}</tbody></table></div></div></>}{dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="panel max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6"><DialogTitle title="ط¨ظٹط§ظ†ط§طھ ط§ظ„طھظˆط¸ظٹظپ" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-3">{(recruitmentFieldSets[dialog.type] || []).map((key) => <Label key={key} t={recruitmentLabels[key] || key}>{key.includes("body") || key.includes("notes") || key.includes("requirements") || key.includes("responsibilities") || key.includes("message") || key.includes("terms") || key.includes("instructions") ? <textarea value={dialog[key] || ""} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} className="field mt-2 !h-auto py-3" /> : key === "is_active" ? <select value={String(dialog[key] !== false)} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط¹ظ…</option><option value="false">ظ„ط§</option></select> : <input type={key.includes("date") || key.endsWith("_at") ? "date" : key.includes("score") || key.includes("salary") || key.includes("count") || key.includes("year") || key.includes("month") ? "number" : "text"} value={dialog[key] || ""} onChange={(e) => setDialog({ ...dialog, [key]: e.target.value })} onBlur={() => dialog.type === "welcome_messages" && setDialog((d) => ({ ...d, whatsapp_message: d.whatsapp_message || generateWelcomeMessage(d) }))} className="field mt-2" />}</Label>)}</div><DialogActions close={() => setDialog(null)} /></form></div>}</div>;
}

function UserEditorModal({ dialog, setDialog, saveUser, employeeOptions, selectEmployee, roles = systemRoles }) {
  const normalizedDialogRole = normalizeRoleName(dialog.role || "ط§ظ„ظ…ظˆط¸ظپ") || "ط§ظ„ظ…ظˆط¸ظپ";
  const roleChoices = getCleanRoleOptions(roles).filter((role) => role && !isMojibakeText(role));
  const isAdmin = String(normalizedDialogRole || "").includes("ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…") || String(normalizedDialogRole || "").includes("ظ…ط´ط±ظپ ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ط¹ط§ظ…");
  const isNewUser = dialog._isNew === true || (!dialog.user_id && !dialog.id);
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
          {isNewUser && <Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"><input required type="password" value={dialog.password || ""} onChange={(e) => setDialog({ ...dialog, password: e.target.value })} className="field mt-2" /></Label>}
          <Label t="ط§ظ„ط¯ظˆط±"><select value={roleChoices.includes(normalizedDialogRole) ? normalizedDialogRole : "ط؛ظٹط± ظ…ط­ط¯ط¯"} onChange={(e) => setDialog({ ...dialog, role: e.target.value })} className="field mt-2"><option value="ط؛ظٹط± ظ…ط­ط¯ط¯" disabled>ط؛ظٹط± ظ…ط­ط¯ط¯</option>{roleChoices.filter((role) => role && !isMojibakeText(role)).map((role) => <option key={role}>{role}</option>)}</select></Label>
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
            <p className="text-[11px] text-slate-400">{node.node_type} ط¢آ· {node.node_key}</p>
          </button>
        </div>
        {hasChildren && isOpen && <div>{node.children.map((child) => renderNode(child, level + 1))}</div>}
      </div>
    );
  };
  const roleChoices = getCleanRoleOptions(roles).filter((role) => role && !isMojibakeText(role));
  const selectedUserOptions = users.filter((u) => !selectedRole || normalizeRoleName(u.role) === selectedRole);
  return (
    <div className="panel p-4 xl:col-span-2">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-extrabold">ط´ط¬ط±ط© ط§ظ„طµظ„ط§ط­ظٹط§طھ ط§ظ„طھظپطµظٹظ„ظٹط©</h3>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="field mr-auto max-w-[220px]">{roleChoices.filter((role) => role && !isMojibakeText(role)).map((r) => <option key={r}>{r}</option>)}</select>
        <select className="field max-w-[220px]"><option>ظƒظ„ ظ…ط³طھط®ط¯ظ…ظٹ ط§ظ„ط¯ظˆط±</option>{selectedUserOptions.map((u) => <option key={u.user_id}>{u.employee_name || u.username}</option>)}</select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="field max-w-[240px]" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button disabled={!canEdit} onClick={() => setAll(true)} className="btn-secondary">طھط­ط¯ظٹط¯ ط§ظ„ظƒظ„</button>
        <button disabled={!canEdit} onClick={() => setAll(false)} className="btn-secondary">ظ…ط³ط­ ط§ظ„ظƒظ„</button>
        <button onClick={() => setExpanded(flatNodes.map((n) => n.node_key))} className="btn-secondary">طھظˆط³ظٹط¹ ط§ظ„ظƒظ„</button>
        <button onClick={() => setExpanded([])} className="btn-secondary">ط·ظٹ ط§ظ„ظƒظ„</button>
        <select value={copyFromRole} onChange={(e) => setCopyFromRole(e.target.value)} className="field max-w-[200px]"><option value="">ظ†ط³ط® ظ…ظ† ط¯ظˆط±...</option>{roleChoices.filter((r) => r !== selectedRole).map((r) => <option key={r}>{r}</option>)}</select>
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
  const safeRoles = (roles || []).map((role) => ({
    ...role,
    display_role_name: displayRoleName(role.raw_role_name || role.role_name),
    normalized_role_name: normalizeRoleName(role.raw_role_name || role.role_name),
  }));
  const visibleRoles = safeRoles.filter((role) => role.display_role_name !== "ط¯ظˆط± طھط§ظ„ظپ ظٹط­طھط§ط¬ ظ…ط¹ط§ظ„ط¬ط©" || !role.is_system_role);
  const filtered = visibleRoles.filter((role) => !q || role.display_role_name.includes(q) || String(role.role_description || "").includes(q));
  return (
    <div className="panel p-4 xl:col-span-2">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-extrabold">ط¥ط¯ط§ط±ط© ط§ظ„ط£ط¯ظˆط§ط±</h3>
        <input value={q} onChange={(e) => setQ(e.target.value)} className="field mr-auto max-w-[260px]" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." />
        <button disabled={!canEdit} onClick={() => setDialog({ role_id: `ROLE-${Date.now()}`, role_name: "", role_description: "", is_system_role: false, is_active: true })} className="btn-primary"><Plus size={17} /> ط¥ط¶ط§ظپط© ط¯ظˆط±</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ط§ظ„ط¯ظˆط±</th><th>ط§ظ„ظˆطµظپ</th><th>ط¹ط¯ط¯ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†</th><th>ط§ظ„ط­ط§ظ„ط©</th><th>ظ†ظˆط¹ ط§ظ„ط¯ظˆط±</th><th></th></tr></thead>
          <tbody>{filtered.map((role) => {
            const count = users.filter((u) => normalizeRoleName(u.role) === role.normalized_role_name).length;
            const corrupted = role.display_role_name === "ط¯ظˆط± طھط§ظ„ظپ ظٹط­طھط§ط¬ ظ…ط¹ط§ظ„ط¬ط©";
            const copyOptions = visibleRoles.filter((r) => r.role_id !== role.role_id && r.display_role_name !== "ط¯ظˆط± طھط§ظ„ظپ ظٹط­طھط§ط¬ ظ…ط¹ط§ظ„ط¬ط©" && r.normalized_role_name && !isMojibakeText(r.normalized_role_name) && !isMojibakeText(r.display_role_name));
            return <tr key={role.role_id} className={corrupted ? "bg-amber-50" : ""}><td>{role.display_role_name}{corrupted && <p className="mt-1 text-xs font-bold text-amber-700">ط§ظ„ظ‚ظٹظ…ط© ط§ظ„ط£طµظ„ظٹط© طھط§ظ„ظپط© ظپظٹ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ</p>}</td><td>{role.role_description}</td><td>{count}</td><td><Status>{role.is_active ? "ظ†ط´ط·" : "ظ…ط¹ط·ظ„"}</Status></td><td>{role.is_system_role ? "ظ†ط¸ط§ظ…ظٹ" : "ظ…ط®طµطµ"}</td><td><button disabled={!canEdit || corrupted} onClick={() => setDialog({ ...role, role_name: role.normalized_role_name })} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canEdit || corrupted} onClick={() => onDeleteRole(role)} className="p-2 text-red-600">{count ? "طھط¹ط·ظٹظ„" : "ط­ط°ظپ"}</button><select value={copySource} onChange={(e) => setCopySource(e.target.value)} className="field mx-1 max-w-[160px]"><option value="">ظ†ط³ط® ظ…ظ†...</option>{copyOptions.filter((r) => r.normalized_role_name && !isMojibakeText(r.normalized_role_name) && !isMojibakeText(r.display_role_name)).map((r) => <option key={r.role_id} value={r.normalized_role_name}>{r.display_role_name}</option>)}</select><button disabled={!copySource || corrupted} onClick={() => onCopyPermissions(copySource, role.normalized_role_name)} className="btn-secondary">ظ†ط³ط®</button></td></tr>;
          })}</tbody>
        </table>
      </div>
      {dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={(e) => { e.preventDefault(); onSaveRole(dialog).then(() => setDialog(null)); }} className="panel w-full max-w-2xl p-6"><DialogTitle title="ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¯ظˆط±" close={() => setDialog(null)} /><div className="grid gap-4 md:grid-cols-2"><Label t="ط§ط³ظ… ط§ظ„ط¯ظˆط±"><input required disabled={dialog.is_system_role} value={dialog.role_name} onChange={(e) => setDialog({ ...dialog, role_name: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active !== false)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select></Label><Label t="ط§ظ„ظˆطµظپ"><textarea value={dialog.role_description || ""} onChange={(e) => setDialog({ ...dialog, role_description: e.target.value })} className="field mt-2 !h-auto py-3" /></Label></div><DialogActions close={() => setDialog(null)} /></form></div>}
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
  const isPlatformAdmin = isPlatformAdminUser(currentUser);
  const canEdit = can?.("users_permissions", "can_edit") !== false;
  const canResetPassword = isPlatformAdmin || can?.("users_permissions", "can_reset_user_password") === true;
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
  const roleOptions = getCleanRoleOptions(safeRoleRows.filter((r) => r.is_active !== false).map((r) => r.raw_role_name || r.role_name)).filter((role) => role && !isMojibakeText(role));
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
    (!filters.q || (u.name || u.employee_name || u.username || "").includes(filters.q) || u.username.includes(filters.q) || u.employee_id.includes(filters.q) || u.branch.includes(filters.q) || displayRoleName(u.role).includes(filters.q)) &&
    (filters.role === "all" || normalizeRoleName(u.role) === filters.role) &&
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
    const dialogRole = normalizeRoleName(dialog.role);
    if (!isPlatformAdmin && isProtectedPlatformRole(dialogRole)) return alert("ظ„ط§ ظٹظ…ظƒظ† ط§ط®طھظٹط§ط± ظ‡ط°ط§ ط§ظ„ط¯ظˆط± ظ…ظ† ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط´ط±ظƒط©");
    if (!dialog.employee_id && !String(dialogRole || "").includes("ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…") && !String(dialogRole || "").includes("ظ…ط´ط±ظپ ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ط¹ط§ظ…")) return alert("ظٹط¬ط¨ ط§ط®طھظٹط§ط± ط§ظ„ظ…ظˆط¸ظپ");
    if (!dialog.username) return alert("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…");
    if (!dialogRole) return alert("ظٹط¬ط¨ طھط­ط¯ظٹط¯ ط§ظ„ط¯ظˆط±");
    if (dialog._isNew && !String(dialog.password || "").trim()) return alert("ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ظ…ط·ظ„ظˆط¨ط© ط¹ظ†ط¯ ط¥ظ†ط´ط§ط، ظ…ط³طھط®ط¯ظ… ط¬ط¯ظٹط¯.");
    try {
      const selectedEmployee = employeeOptions.find((employee) => employee.id === dialog.employee_id || employee.employee_id === dialog.employee_id);
      const saved = await adminService.saveUser({ ...dialog, role: dialogRole }, selectedEmployee, dialog._isNew ? "add" : "edit");
      setUsers((list) => {
        const exists = list.some((x) => x.user_id === saved.user_id);
        return exists ? list.map((x) => (x.user_id === saved.user_id ? saved : x)) : [saved, ...list];
      });
      setDialog(null);
    } catch (err) {
      alert(err.message);
    }
  };
  const resetUserPassword = async (user) => {
    if (!canResetPassword) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±");
    const newPassword = prompt("ط£ط¯ط®ظ„ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط¬ط¯ظٹط¯ط©");
    if (!newPassword) return;
    try {
      await adminService.resetUserPassword(user.user_id || user.id, newPassword);
      alert("طھظ… طھط­ط¯ظٹط« ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±");
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
    if (!canEdit) return alert("ظ„ط§ طھظ…ظ„ظƒ طµظ„ط§ط­ظٹط© طھظ†ظپظٹط° ظ‡ط°ط§ ط§ظ„ط¥ط¬ط±ط§ط،");
    try {
      setTreeLoading(true);
      const flat = flattenPermissionTree(companyFilteredTreeNodes);
      const roleRows = flat.map((node) => treePermissionsService.getNodePermission(treePermissions, selectedRole, node.node_key));
      const saved = await treePermissionsService.saveBulkNodePermissions(selectedRole, roleRows);
      setTreePermissions(saved);
      await syncLegacyPermissions(saved);
      alert("طھظ… ط­ظپط¸ طµظ„ط§ط­ظٹط§طھ ط§ظ„ط¯ظˆط± ط¨ظ†ط¬ط§ط­.");
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
      <PageHead title="ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ† ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ" desc="ط¥ط¯ط§ط±ط© ظ…ط³طھط®ط¯ظ…ظٹ ط§ظ„ظ†ط¸ط§ظ… ظˆظ…طµظپظˆظپط© طµظ„ط§ط­ظٹط§طھ ط§ظ„ط£ط¯ظˆط§ط±" action={<button disabled={!canEdit} onClick={() => setDialog({ _isNew: true, user_id: `USR-${Date.now()}`, employee_id: "", employee_name: "", username: "", password: "", role: "ط§ظ„ظ…ظˆط¸ظپ", branch: "", job: "", email: "", phone: "", is_active: true })} className="btn-primary"><Plus size={18} /> ط¥ط¶ط§ظپط© ظ…ط³طھط®ط¯ظ…</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      <div className="panel flex flex-wrap gap-3 p-4">
        <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className="field min-w-[220px] flex-1" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." />
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ط£ط¯ظˆط§ط±</option>{roleOptions.filter((role) => role && !isMojibakeText(role)).map((r) => <option key={r}>{r}</option>)}</select>
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })} className="field max-w-[190px]"><option value="all">ظƒظ„ ط§ظ„ظپط±ظˆط¹</option>{branches.map((b) => <option key={b}>{b}</option>)}</select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="field max-w-[160px]"><option value="all">ظƒظ„ ط§ظ„ط­ط§ظ„ط§طھ</option><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-4">
          <h3 className="mb-3 font-extrabold">ط§ظ„ظ…ط³طھط®ط¯ظ…ظˆظ†</h3>
          {loading ? <p className="text-sm text-slate-400">ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</p> : <div className="table-wrap"><table><thead><tr><th>ط§ظ„ظ…ط³طھط®ط¯ظ…</th><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ط¯ظˆط±</th><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„ط­ط§ظ„ط©</th><th></th></tr></thead><tbody>{filtered.map((u) => {
              const isProtectedUser = !isPlatformAdmin && isProtectedPlatformUser(u);
              return <tr key={u.user_id}><td>{u.username}</td><td>{u.employee_name}<p className="text-xs text-slate-400">{u.employee_id}</p></td><td>{displayRoleName(u.role)}</td><td>{u.branch}</td><td><Status>{u.is_active ? "ظ†ط´ط·" : "ظ…ط¹ط·ظ„"}</Status></td><td><button disabled={!canEdit || isProtectedUser} onClick={() => setDialog({ ...u, password: "", _isNew: false, role: normalizeRoleName(u.role) || "" })} className="p-2 text-blue-600"><Pencil size={16} /></button><button disabled={!canResetPassword || isProtectedUser} onClick={() => resetUserPassword(u)} className="p-2 text-amber-700">ط¥ط¹ط§ط¯ط© ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±</button><button disabled={!canEdit || isProtectedUser || !normalizeRoleName(u.role)} onClick={() => adminService.updateUserStatus(u.user_id, !u.is_active).then(load).catch((e) => alert(e.message))} className="p-2 text-red-600">{u.is_active ? "طھط¹ط·ظٹظ„" : "طھظپط¹ظٹظ„"}</button></td></tr>;
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
      {flattenPermissionTree(treeNodes).length > flattenPermissionTree(companyFilteredTreeNodes).length && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">ط¨ط¹ط¶ ط§ظ„طµظ„ط§ط­ظٹط§طھ ظ…ط®ظپظٹط© ظ„ط£ظ† ظ‡ط°ظ‡ ط§ظ„ظˆط­ط¯ط§طھ ط؛ظٹط± ظ…ظپط¹ظ„ط© ظ„ظ‡ط°ظ‡ ط§ظ„ط´ط±ظƒط©.</div>}
      <RoleManagementPanel roles={roleRows.length ? roleRows : roleOptions.map((role_name) => ({ role_id: `ROLE-${role_name}`, role_name, role_description: "", is_system_role: systemRoles.includes(role_name), is_active: true }))} users={users} canEdit={canEdit} onSaveRole={async (roleRow) => { const saved = await adminService.saveRole(roleRow); setRoleRows((list) => list.some((r) => r.role_id === saved.role_id) ? list.map((r) => r.role_id === saved.role_id ? saved : r) : [...list, saved]); }} onDeleteRole={async (roleRow) => { const saved = await adminService.deleteRole(roleRow, users); setRoleRows((list) => saved ? list.map((r) => r.role_id === saved.role_id ? saved : r) : list.filter((r) => r.role_id !== roleRow.role_id)); }} onCopyPermissions={async (source, target) => { await treePermissionsService.copyRolePermissions(source, target); alert("طھظ… ظ†ط³ط® طµظ„ط§ط­ظٹط§طھ ط§ظ„ط¯ظˆط±"); }} />
      {dialog && <UserEditorModal dialog={dialog} setDialog={setDialog} saveUser={saveUser} employeeOptions={employeeOptions} selectEmployee={selectEmployee} roles={roleOptions} />}
      {false && dialog && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={saveUser} className="panel w-full max-w-3xl p-6"><div className="mb-5 flex"><h3 className="text-xl font-extrabold">ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…</h3><button type="button" onClick={() => setDialog(null)} className="mr-auto"><X /></button></div><div className="grid gap-4 md:grid-cols-2"><Label t="ط±ط¨ط· ط§ظ„ظ…ظˆط¸ظپ"><select value={dialog.employee_id} onChange={(e) => selectEmployee(e.target.value)} className="field mt-2"><option value="">ط¨ط¯ظˆظ† ط±ط¨ط·</option>{employeeOptions.map((e) => <option key={e.id} value={e.id}>{e.name} - {e.id} - {e.branch} - {e.job}</option>)}</select></Label><Label t="ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ"><input readOnly value={dialog.employee_name || dialog.name || ""} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…"><input required value={dialog.username} onChange={(e) => setDialog({ ...dialog, username: e.target.value })} className="field mt-2" /></Label><Label t="ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"><input required type="password" value={dialog.password || ""} onChange={(e) => setDialog({ ...dialog, password: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط¯ظˆط±"><select value={dialog.role} onChange={(e) => setDialog({ ...dialog, role: e.target.value })} className="field mt-2">{getCleanRoleOptions(systemRoles).filter((role) => role && !isMojibakeText(role)).map((r) => <option key={r}>{r}</option>)}</select></Label><Label t="ط§ظ„ظپط±ط¹"><input readOnly value={dialog.branch || ""} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ظ„ظˆط¸ظٹظپط©"><input readOnly value={dialog.job || ""} className="field mt-2 bg-slate-50" /></Label><Label t="ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ"><input value={dialog.email || ""} onChange={(e) => setDialog({ ...dialog, email: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظ‡ط§طھظپ"><input value={dialog.phone || ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ط­ط§ظ„ط©"><select value={String(dialog.is_active)} onChange={(e) => setDialog({ ...dialog, is_active: e.target.value === "true" })} className="field mt-2"><option value="true">ظ†ط´ط·</option><option value="false">ظ…ط¹ط·ظ„</option></select></Label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className="btn-secondary">ط¥ظ„ط؛ط§ط،</button><button className="btn-primary"><Save size={17} /> ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ</button></div></form></div>}
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
        <input value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} className="field" placeholder="ط§ظƒطھط¨ ط³ط¨ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط±ط§ط¬ط¹ط©..." />
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
            <p className="mt-1 text-xs text-slate-500">{item.type === "negative" ? "ط®طµظ…" : "ط¥ط¶ط§ظپط©"} ط£â€” {item.weight}</p>
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
      name: employee?.name || employee?.employee_name || "ظ…ظˆط¸ظپ",
      branch: employee?.branch || "",
      job: employee?.job || employee?.job_name || "",
      status: employee?.status || "ظ†ط´ط·",
    }))
    .filter((employee) => {
      const status = String(employee?.status || "").trim();
      return !status || status === "ظ†ط´ط·" || status.toLowerCase() === "active";
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
      if (!companyId) throw new Error("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
      setOperations(await dailyOperationsService.loadDailyOperations({ companyId, approvedOnly: true }));
    } catch (error) {
      console.error("Productivity daily_operations load error:", error);
      setOperationError(error.message || "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط¹ظ…ظ„ظٹط§طھ ط§ظ„ط¥ظ†طھط§ط¬ظٹط©");
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
      receive: sumByType(["ظˆط§ط±ط¯", "ظ‚ط¨ط¶"]),
      pay: sumByType(["طµط§ط¯ط±", "طµط±ظپ"]),
      sell: sumByType(["ط¨ظٹط¹"]),
      buy: sumByType(["ط´ط±ط§ط،"]),
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
      if (!companyId) throw new Error("ظ„ظ… ظٹطھظ… طھط­ط¯ظٹط¯ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©");
      const parsed = await parseDailyOperationsExcel(file);
      const validated = validateDailyOperationsRows(parsed, activeEmployees, companyId);
      const validRows = validated.filter((row) => row.valid);
      const invalidRows = validated.filter((row) => !row.valid);
      const result = validRows.length
        ? await importDailyOperationsRows(validated, companyId, { duplicateMode: "update" })
        : { saved: [], inserted: 0, updated: 0, skipped: 0 };
      setImportSummary({
        message: validRows.length ? "طھظ… ط§ظ„ط§ط³طھظٹط±ط§ط¯ ط¨ظ†ط¬ط§ط­" : "ظپط´ظ„ ط§ظ„ط§ط³طھظٹط±ط§ط¯",
        total: validated.length,
        imported: result.saved?.length || 0,
        updated: result.updated || 0,
        rejected: invalidRows.length,
        warnings: validated.filter((row) => row.warning).length,
        reasons: invalidRows.slice(0, 10).map((row) => `ط§ظ„طµظپ ${row.rowNumber}: ${row.validationMessage}`),
      });
      await loadOperations();
    } catch (error) {
      console.error("Productivity Excel import error:", error);
      setImportSummary({ message: "ظپط´ظ„ ط§ظ„ط§ط³طھظٹط±ط§ط¯", total: 0, imported: 0, updated: 0, rejected: 0, warnings: 0, reasons: [error.message || "طھط¹ط°ط± ط§ط³طھظٹط±ط§ط¯ ط§ظ„ط¨ظٹط§ظ†ط§طھ"] });
    } finally {
      setImporting(false);
    }
  };

  const exportIndicators = () => {
    if (!selectedEmployee) return alert("ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ ط£ظˆظ„ظ‹ط§");
    try {
      exportExcel(indicators.map((indicator) => ({
        "ط§ظ„ط±ظ‚ظ… ط§ظ„ظˆط¸ظٹظپظٹ": selectedEmployee.id,
        "ط§ط³ظ… ط§ظ„ظ…ظˆط¸ظپ": selectedEmployee.name,
        "ط§ظ„ظپط±ط¹": selectedEmployee.branch || "",
        "ط§ظ„ظˆط¸ظٹظپط©": selectedEmployee.job || "",
        "ط§ظ„ظ…ط¤ط´ط±": indicator.label,
        "ط§ظ„ظ‚ظٹظ…ط©": Number(values[indicator.key] || 0),
        "ط§ظ„ظˆط²ظ†": Number(indicator.weight || 0),
        "ظ†ظ‚ط§ط· ط§ظ„ط¥ظ†طھط§ط¬ظٹط©": score,
      })), "productivity-indicators");
      alert("طھظ… ط§ظ„طھطµط¯ظٹط± ط¨ظ†ط¬ط§ط­");
    } catch (error) {
      console.error("Productivity indicators export error:", error);
      alert("طھط¹ط°ط± طھطµط¯ظٹط± ط§ظ„ط¨ظٹط§ظ†ط§طھ");
    }
  };

  const exportEmployeeOperations = () => {
    if (!selectedEmployee) return alert("ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ ط£ظˆظ„ظ‹ط§");
    if (!selectedOperations.length) return alert("ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ„ظ„طھطµط¯ظٹط±");
    try {
      exportProductivityOperationsToExcel(selectedOperations, "employee-productivity-operations.xlsx");
      alert("طھظ… ط§ظ„طھطµط¯ظٹط± ط¨ظ†ط¬ط§ط­");
    } catch (error) {
      console.error("Employee productivity operations export error:", error);
      alert("طھط¹ط°ط± طھطµط¯ظٹط± ط§ظ„ط¨ظٹط§ظ†ط§طھ");
    }
  };

  const exportAllOperations = () => {
    if (!operations.length) return alert("ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ„ظ„طھطµط¯ظٹط±");
    try {
      exportProductivityOperationsToExcel(operations, "all-productivity-operations.xlsx");
      alert("طھظ… ط§ظ„طھطµط¯ظٹط± ط¨ظ†ط¬ط§ط­");
    } catch (error) {
      console.error("All productivity operations export error:", error);
      alert("طھط¹ط°ط± طھطµط¯ظٹط± ط§ظ„ط¨ظٹط§ظ†ط§طھ");
    }
  };

  return (
    <Entry title="ظ…ط¤ط´ط±ط§طھ ط§ظ„ط¥ظ†طھط§ط¬ظٹط©" desc="ظٹظ…ظƒظ† ط¥ط¶ط§ظپط© ط£ظˆ طھط¹ط¯ظٹظ„ ظ…ط¤ط´ط±ط§طھ ط§ظ„ط¥ظ†طھط§ط¬ظٹط© ظˆظ…ط¹ط§ظ…ظ„ط§طھ ط§ط­طھط³ط§ط¨ظ‡ط§">
      <div className="panel flex flex-wrap items-center gap-2 p-4">
        <button type="button" onClick={downloadProductivityTemplate} className="btn-secondary"><Download size={17} /> طھط­ظ…ظٹظ„ ظ†ظ…ظˆط°ط¬ Excel</button>
        <label className={`btn-secondary cursor-pointer ${!canImport || importing ? "pointer-events-none opacity-50" : ""}`}>
          <Upload size={17} /> {importing ? "ط¬ط§ط±ظٹ ط§ظ„ط§ط³طھظٹط±ط§ط¯..." : "ط§ط³طھظٹط±ط§ط¯ Excel"}
          <input type="file" accept=".xlsx,.xls,.csv" onChange={importOperations} disabled={!canImport || importing} className="hidden" />
        </label>
        <button type="button" disabled={!canExport} onClick={exportIndicators} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> طھطµط¯ظٹط± Excel</button>
        <button type="button" disabled={!canExport || !selectedEmployee} onClick={exportEmployeeOperations} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> طھطµط¯ظٹط± ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ظˆط¸ظپ</button>
        <button type="button" disabled={!canExport} onClick={exportAllOperations} className="btn-secondary disabled:opacity-50"><FileSpreadsheet size={17} /> طھطµط¯ظٹط± ظƒظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ</button>
      </div>

      {operationError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{operationError}</div>}
      {importSummary && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className={`mb-2 font-extrabold ${importSummary.imported ? "text-emerald-700" : "text-red-700"}`}>{importSummary.message}</p>
          <div className="flex flex-wrap gap-4 font-bold">
            <span>ط¹ط¯ط¯ ط§ظ„ط³ط¬ظ„ط§طھ ط§ظ„ظ…ظ‚ط±ظˆط،ط©: {importSummary.total}</span><span className="text-emerald-700">ط¹ط¯ط¯ ط§ظ„ط³ط¬ظ„ط§طھ ط§ظ„ظ…ط³طھظˆط±ط¯ط©: {importSummary.imported}</span>
            <span className="text-blue-700">ط§ظ„ط³ط¬ظ„ط§طھ ط§ظ„ظ…ط­ط¯ظ‘ط«ط©: {importSummary.updated}</span><span className="text-red-700">ط¹ط¯ط¯ ط§ظ„ط³ط¬ظ„ط§طھ ط§ظ„ظ…ط±ظپظˆط¶ط©: {importSummary.rejected}</span>
            <span className="text-amber-700">طھط­ط°ظٹط±ط§طھ: {importSummary.warnings}</span>
          </div>
          {importSummary.reasons?.length > 0 && <ul className="mt-3 list-inside list-disc space-y-1 text-red-700">{importSummary.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[minmax(220px,.8fr)_minmax(300px,1.5fr)]">
        <Label t="ط§ظ„ط¨ط­ط« ط¹ظ† ظ…ظˆط¸ظپ"><input value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} className="field mt-2" placeholder="ط§ظ„ط§ط³ظ… ط£ظˆ ط§ظ„ط±ظ‚ظ… ط£ظˆ ط§ظ„ظˆط¸ظٹظپط© ط£ظˆ ط§ظ„ظپط±ط¹" /></Label>
        <Label t="ط§ظ„ظ…ظˆط¸ظپ">
          <select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} className="field mt-2">
            <option value="">ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ</option>
            {visibleEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} â€” {employee.job || "ط¨ط¯ظˆظ† ظˆط¸ظٹظپط©"} â€” {employee.branch || "ط¨ط¯ظˆظ† ظپط±ط¹"}</option>)}
          </select>
        </Label>
      </div>
      {!activeEmployees.length && <div className="rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-700">ظ„ط§ ظٹظˆط¬ط¯ ظ…ظˆط¸ظپظˆظ† ظ†ط´ط·ظˆظ† ظپظٹ ط§ظ„ط´ط±ظƒط© ط§ظ„ط­ط§ظ„ظٹط©</div>}
      {selectedEmployee && <div className="rounded-xl bg-brand-50 p-3 text-sm font-bold text-brand-800">{selectedEmployee.name} â€” {selectedEmployee.job || "ط¨ط¯ظˆظ† ظˆط¸ظٹظپط©"} â€” {selectedEmployee.branch || "ط¨ط¯ظˆظ† ظپط±ط¹"}</div>}

      <IndicatorManager title="ط¥ط¯ط§ط±ط© ظ…ط¤ط´ط±ط§طھ ط§ظ„ط¥ظ†طھط§ط¬ظٹط©" indicators={indicators} setIndicators={setIndicators} />
      <ProductivityComparison currentCompany={currentCompany} currentUser={currentUser} />
      <Fields values={values} set={setValues} items={indicators.map((x) => [x.key, x.label])} />
      <Score n={score} label="ظ†ظ‚ط§ط· ط§ظ„ط¥ظ†طھط§ط¬ظٹط©" />

      <div className="rounded-2xl border border-slate-200 p-4">
        <h3 className="mb-3 text-lg font-extrabold">ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ظˆط¸ظپ ط§ظ„ظ…ط³ط¬ظ„ط©</h3>
        <div className="table-wrap"><table><thead><tr><th>ط§ظ„طھط§ط±ظٹط®</th><th>ظ†ظˆط¹ ط§ظ„ط¹ظ…ظ„ظٹط©</th><th>ط¹ط¯ط¯ ط§ظ„ط¹ظ…ظ„ظٹط§طھ</th><th>ط§ظ„ط£ط®ط·ط§ط،</th><th>ط§ظ„ط´ظƒط§ظˆظ‰</th><th>ط§ظ„ظ…ط¨ظ„ط؛</th><th>ط§ظ„ط¹ظ…ظ„ط©</th><th>KPI</th></tr></thead><tbody>
          {loadingOperations ? <tr><td colSpan="8" className="py-6 text-center">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¹ظ…ظ„ظٹط§طھ...</td></tr>
            : selectedOperations.length ? selectedOperations.map((row) => <tr key={row.operation_id}><td>{row.operation_date}</td><td>{row.operation_type}</td><td>{row.operation_count}</td><td>{row.error_count}</td><td>{row.customer_complaints}</td><td>{row.amount}</td><td>{row.currency}</td><td>{isApprovedDailyOperation(row) ? "ط¯ط§ط®ظ„ KPI" : "ط؛ظٹط± ط¯ط§ط®ظ„"}</td></tr>)
              : <tr><td colSpan="8" className="py-6 text-center text-slate-400">{selectedEmployeeId ? "ظ„ط§ طھظˆط¬ط¯ ط¹ظ…ظ„ظٹط§طھ ظ…ط¹طھظ…ط¯ط© ظ„ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپ ط­ط§ظ„ظٹط§ظ‹" : "ط§ط®طھط± ط§ظ„ظ…ظˆط¸ظپ ظ„ط¹ط±ط¶ ط¹ظ…ظ„ظٹط§طھظ‡ ط§ظ„ظ…ط¹طھظ…ط¯ط©"}</td></tr>}
        </tbody></table></div>
      </div>
      <button className="btn-primary" disabled={!selectedEmployee}><Save size={17} /> ط­ظپط¸ ظ…ط¤ط´ط±ط§طھ ط§ظ„ط´ظ‡ط±</button>
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

function EnhancedIncentives({ employees, evaluations, currentCompany, currentUser }) {
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const [details, setDetails] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [kpiMonth, setKpiMonth] = useState(new Date().toISOString().slice(0, 7));
  const [kpiLoading, setKpiLoading] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!companyId) return undefined;
    setKpiLoading(true);
    kpiScoresService.loadKpiScores(companyId, { month: kpiMonth }, employees).then((result) => { if (alive) setRanking(result.ranking || []); }).catch((error) => { console.error("Incentives KPI load error:", error); if (alive) setRanking([]); }).finally(() => { if (alive) setKpiLoading(false); });
    return () => { alive = false; };
  }, [companyId, kpiMonth, employees]);
  const latestEvaluation = (employeeId) => [...evaluations].filter((row) => String(row.employeeId || row.employee_id) === String(employeeId)).sort((a, b) => String(b.month || "").localeCompare(String(a.month || "")))[0];
  const bonusPercentage = (score) => score >= 95 ? 20 : score >= 90 ? 15 : score >= 85 ? 10 : score >= 80 ? 5 : 0;
  const data = ranking.map((row) => {
    const employee = employees.find((item) => String(item.id) === String(row.employee_id)) || {};
    const score = Number(row.final_kpi_score ?? row.final_score ?? 0);
    const percentage = bonusPercentage(score);
    const salaryAvailable = Number(employee.salary) > 0;
    const evaluation = latestEvaluation(row.employee_id);
    const eligibility = score < 80 ? "ط؛ظٹط± ظ…ط³طھط­ظ‚" : evaluation && evaluation.status !== "ظ…ط¹طھظ…ط¯" ? "ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ط§ط¹طھظ…ط§ط¯" : "ظ…ط³طھط­ظ‚ ط§ظ„ط­ط§ظپط²";
    return { ...employee, ...row, name: row.employee_name, job: row.job || row.job_name, final_kpi_score: score, bonus_percentage: percentage, suggested_bonus: salaryAvailable ? Number(employee.salary) * percentage / 100 : 0, salaryAvailable, eligibility, evaluation };
  });
  return (
    <div className="space-y-5">
      <PageHead title="ط§ظ„ط­ظˆط§ظپط² ظˆط§ظ„ظ…ظƒط§ظپط¢طھ" desc="ط§ظ„ط§ط³طھط­ظ‚ط§ظ‚ ظˆط§ظ„ط­ط§ظپط² ط§ظ„ظ…ظ‚طھط±ط­ ط­ط³ط¨ ط¯ط±ط¬ط© KPI ط§ظ„ظ†ظ‡ط§ط¦ظٹط©" action={<div className="flex flex-wrap gap-2"><input type="month" value={kpiMonth} onChange={(event) => setKpiMonth(event.target.value)} className="field max-w-[160px]" /><button onClick={() => exportExcel(data, "ط§ظ„ط­ظˆط§ظپط²")} className="btn-primary"><Download size={17} /> طھطµط¯ظٹط± ط§ظ„ظƒط´ظپ</button></div>} />
      <div className="rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-700">ظٹطھظ… ط§ط­طھط³ط§ط¨ KPI ظ…ظ† ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ط¹طھظ…ط¯ط© ط§ظ„ط¯ط§ط®ظ„ط© ظپظٹ KPI ظپظ‚ط·.</div>
      {!kpiLoading && !ranking.length && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">ظ„ظ… ظٹطھظ… ط§ط­طھط³ط§ط¨ ط¯ط±ط¬ط§طھ KPI ط¨ط¹ط¯</div>}
      <div className="grid gap-4 sm:grid-cols-3"><Mini label="ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط­ظˆط§ظپط² ط§ظ„ظ…ظ‚طھط±ط­ط©" value={money(data.reduce((sum, row) => sum + row.suggested_bonus, 0))} I={CircleDollarSign} /><Mini label="ظ…ط³طھط­ظ‚ظˆ ط§ظ„ط­ط§ظپط²" value={data.filter((row) => row.eligibility === "ظ…ط³طھط­ظ‚ ط§ظ„ط­ط§ظپط²").length} I={UserCheck} /><Mini label="ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ط§ط¹طھظ…ط§ط¯" value={data.filter((row) => row.eligibility === "ط¨ط§ظ†طھط¸ط§ط± ط§ظ„ط§ط¹طھظ…ط§ط¯").length} I={Clock3} /></div>
      <div className="panel p-4"><div className="table-wrap"><table><thead><tr><th>ط§ظ„ظ…ظˆط¸ظپ</th><th>ط§ظ„ظپط±ط¹</th><th>ط§ظ„ظˆط¸ظٹظپط©</th><th>ط§ظ„ط±ط§طھط¨</th><th>ط¯ط±ط¬ط© KPI ط§ظ„ظ†ظ‡ط§ط¦ظٹط©</th><th>ط§ظ„ط§ط³طھط­ظ‚ط§ظ‚</th><th>ظ†ط³ط¨ط© ط§ظ„ط­ط§ظپط²</th><th>ط§ظ„ط­ط§ظپط² ط§ظ„ظ…ظ‚طھط±ط­</th><th>ط§ظ„ط³ط¨ط¨</th><th>ط§ظ„طھظپط§طµظٹظ„</th></tr></thead><tbody>{data.map((x) => <tr key={x.employee_id}><td className="font-bold">{x.name}</td><td>{x.branches?.length ? x.branches.join("طŒ ") : x.branch}</td><td>{x.job}</td><td>{x.salaryAvailable ? money(x.salary) : "ط§ظ„ط±ط§طھط¨ ط؛ظٹط± ظ…ط­ط¯ط¯"}</td><td>{x.final_kpi_score.toFixed(2)}%</td><td><Status>{x.eligibility}</Status></td><td>{x.bonus_percentage}%</td><td className="font-bold text-brand-700">{x.salaryAvailable ? money(x.suggested_bonus) : "0"}</td><td>{!x.salaryAvailable && x.bonus_percentage > 0 ? "ظ„ط§ ظٹظ…ظƒظ† ط§ط­طھط³ط§ط¨ ط§ظ„ط­ط§ظپط² ظ„ط¹ط¯ظ… طھظˆظپط± ط§ظ„ط±ط§طھط¨." : x.final_kpi_score < 80 ? "ط؛ظٹط± ظ…ط³طھط­ظ‚" : x.eligibility}</td><td><button onClick={() => setDetails(x)} className="btn-secondary !h-9"><Eye size={15} /> ط¹ط±ط¶</button></td></tr>)}</tbody></table></div></div>
      {details && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="panel w-full max-w-2xl p-6"><div className="mb-5 flex items-center"><h3 className="text-lg font-extrabold">طھظپط§طµظٹظ„ ط§ط³طھط­ظ‚ط§ظ‚ ط§ظ„ط­ط§ظپط²</h3><button onClick={() => setDetails(null)} className="mr-auto"><X /></button></div><div className="grid gap-3 md:grid-cols-2"><Info t="ط§ظ„ظ…ظˆط¸ظپ" v={details.name} /><Info t="ط§ظ„ظپط±ط¹" v={details.branch} /><Info t="ط§ظ„ظˆط¸ظٹظپط©" v={details.job} /><Info t="ط§ظ„ط±ط§طھط¨" v={details.salaryAvailable ? money(details.salary) : "ط§ظ„ط±ط§طھط¨ ط؛ظٹط± ظ…ط­ط¯ط¯"} /><Info t="ط¯ط±ط¬ط© KPI ط§ظ„ظ†ظ‡ط§ط¦ظٹط©" v={details.final_kpi_score.toFixed(2) + "%"} /><Info t="ظ†ط³ط¨ط© ط§ظ„ط¥ظ†ط¬ط§ط²" v={details.achievement_percentage + "%"} /><Info t="ظ†ط³ط¨ط© ط§ظ„ط­ط§ظپط²" v={details.bonus_percentage + "%"} /><Info t="ظ‚ظٹظ…ط© ط§ظ„ط­ط§ظپط²" v={details.salaryAvailable ? money(details.suggested_bonus) : "ظ„ط§ ظٹظ…ظƒظ† ط§ط­طھط³ط§ط¨ ط§ظ„ط­ط§ظپط² ظ„ط¹ط¯ظ… طھظˆظپط± ط§ظ„ط±ط§طھط¨."} /><Info t="ط§ظ„ط´ظ‡ط±" v={kpiMonth} /><Info t="ط­ط§ظ„ط© ط§ظ„ط§ط³طھط­ظ‚ط§ظ‚" v={details.eligibility} /></div></div></div>}
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

function ProductivityComparison({ currentCompany, currentUser }) {
  const companyId = currentCompany?.company_id || currentUser?.company_id || "";
  const now = new Date();
  const year = now.getFullYear();
  const monthNumber = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const [range, setRange] = useState({ aFrom: year + "-" + monthNumber + "-01", aTo: year + "-" + monthNumber + "-15", bFrom: year + "-" + monthNumber + "-16", bTo: year + "-" + monthNumber + "-" + String(lastDay).padStart(2, "0"), scope: "employee" });
  const [rows, setRows] = useState([]);
  const [realBranches, setRealBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    if (!companyId || !range.aFrom || !range.aTo || !range.bFrom || !range.bTo) return undefined;
    setLoading(true); setError("");
    dailyOperationsReportsService.compareProductivityPeriods(companyId, range).then((result) => { if (alive) { setRows(result.rows || []); setRealBranches(result.branches || []); } }).catch((loadError) => { console.error("Productivity comparison error:", loadError); if (alive) { setRows([]); setRealBranches([]); setError(loadError.message || "طھط¹ط°ط± طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ‚ط§ط±ظ†ط©"); } }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [companyId, range.aFrom, range.aTo, range.bFrom, range.bTo, range.scope]);
  const scopeLabel = range.scope === "branch" ? "ط§ظ„ظپط±ط¹" : range.scope === "job" ? "ط§ظ„ظˆط¸ظٹظپط©" : range.scope === "operation_type" ? "ظ†ظˆط¹ ط§ظ„ط¹ظ…ظ„ظٹط©" : "ط§ظ„ظ…ظˆط¸ظپ";
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-4 flex flex-wrap items-end gap-3"><h3 className="w-full text-lg font-extrabold">ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ط¥ظ†طھط§ط¬ظٹط© ط¨ظٹظ† ظپطھط±طھظٹظ†</h3><Label t="ط§ظ„ظپطھط±ط© ط£ ظ…ظ†"><input type="date" value={range.aFrom} onChange={(e) => setRange({ ...range, aFrom: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظپطھط±ط© ط£ ط¥ظ„ظ‰"><input type="date" value={range.aTo} onChange={(e) => setRange({ ...range, aTo: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظپطھط±ط© ط¨ ظ…ظ†"><input type="date" value={range.bFrom} onChange={(e) => setRange({ ...range, bFrom: e.target.value })} className="field mt-2" /></Label><Label t="ط§ظ„ظپطھط±ط© ط¨ ط¥ظ„ظ‰"><input type="date" value={range.bTo} onChange={(e) => setRange({ ...range, bTo: e.target.value })} className="field mt-2" /></Label><Label t="ظ†ط·ط§ظ‚ ط§ظ„ظ…ظ‚ط§ط±ظ†ط©"><select value={range.scope} onChange={(e) => setRange({ ...range, scope: e.target.value })} className="field mt-2"><option value="employee">ط§ظ„ظ…ظˆط¸ظپ</option><option value="branch">ط§ظ„ظپط±ط¹</option><option value="job">ط§ظ„ظˆط¸ظٹظپط©</option><option value="operation_type">ظ†ظˆط¹ ط§ظ„ط¹ظ…ظ„ظٹط©</option></select></Label></div>
      <p className="mb-3 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-700">ظٹطھظ… ط§ط­طھط³ط§ط¨ KPI ظ…ظ† ط§ظ„ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ط¹طھظ…ط¯ط© ط§ظ„ط¯ط§ط®ظ„ط© ظپظٹ KPI ظپظ‚ط·. ط§ظ„ظپط±ظˆط¹ ط§ظ„ظپط¹ظ„ظٹط© ظپظٹ ط§ظ„ظپطھط±طھظٹظ†: {realBranches.length ? realBranches.join("طŒ ") : "ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ"}</p>
      {error && <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
      {loading ? <div className="py-8 text-center">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ‚ط§ط±ظ†ط©...</div> : <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]"><div className="table-wrap"><table><thead><tr><th>{scopeLabel}</th><th>ط§ظ„ظپطھط±ط© ط£</th><th>ط§ظ„ظپطھط±ط© ط¨</th><th>ظ†ط³ط¨ط© ط§ظ„طھط؛ظٹط±</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.name}><td className="font-bold">{row.name}</td><td>{row.period_a}</td><td>{row.period_b}</td><td className={row.change === null || row.change >= 0 ? "font-bold text-emerald-600" : "font-bold text-red-600"}>{row.change_label}</td></tr>) : <tr><td colSpan={4} className="py-6 text-center text-slate-400">ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ…ط¹طھظ…ط¯ط© ط¯ط§ط®ظ„ط© ظپظٹ KPI ط¶ظ…ظ† ط§ظ„ظپطھط±طھظٹظ†.</td></tr>}</tbody></table></div><ResponsiveContainer width="100%" height={260}><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="period_a" fill="#94a3b8" radius={[6, 6, 0, 0]} /><Bar dataKey="period_b" fill="#7f1d1d" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>}
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
  "ط§ظ„ظ†ظˆط¹": "gender",
  "ط§ظ„ط¬ظ†ط³": "gender",
  gender: "gender",
  sex: "gender",
  "ط±ط§ط¨ط· طµظˆط±ط© ط§ظ„ظ…ظˆط¸ظپ": "profile_image_url",
  "طµظˆط±ط© ط§ظ„ظ…ظˆط¸ظپ": "profile_image_url",
  profile_image_url: "profile_image_url",
  profile_image: "profile_image_url",
  avatar_url: "profile_image_url",
  photo_url: "profile_image_url",
  profile_image_path: "profile_image_path",
  photo_path: "profile_image_path",
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
    gender: "ط؛ظٹط± ظ…ط­ط¯ط¯",
    profile_image_url: "",
    profile_image_path: "",
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
        gender: row.gender || "ط؛ظٹط± ظ…ط­ط¯ط¯",
        profile_image_url: row.profile_image_url || row.profile_image || row.avatar_url || row.photo_url || "",
        profileImageUrl: row.profile_image_url || row.profile_image || row.avatar_url || row.photo_url || "",
        profile_image_path: row.profile_image_path || row.photo_path || "",
        profileImagePath: row.profile_image_path || row.photo_path || "",
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
