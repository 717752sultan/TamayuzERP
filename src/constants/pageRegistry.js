export const erpModuleLabels = {
  platform: "إدارة المنصة",
  system: "النظام",
  hr: "الموارد البشرية",
  inventory: "المخازن والمخزون",
  sales: "المبيعات",
  purchasing: "المشتريات",
  accounting: "الحسابات",
  crm: "CRM",
  assets: "الأصول",
  projects: "المشاريع",
};

export const permissionActionLabels = {
  can_view: "عرض",
  can_create: "إضافة",
  can_edit: "تعديل",
  can_delete: "حذف",
  can_approve: "اعتماد",
  can_reject: "رفض",
  can_cancel: "إلغاء",
  can_post: "ترحيل",
  can_import: "استيراد",
  can_export: "تصدير",
  can_print: "طباعة",
  can_configure: "إدارة",
  can_override: "تجاوز",
  can_view_financial: "مالي",
  can_view_sensitive: "حساس",
};

export const standardPermissionActions = Object.keys(permissionActionLabels);

const commonActions = ["can_view", "can_create", "can_edit", "can_delete", "can_export", "can_print"];
const approvalActions = ["can_view", "can_create", "can_edit", "can_delete", "can_approve", "can_reject", "can_cancel", "can_export", "can_print"];
const financialActions = ["can_view", "can_create", "can_edit", "can_approve", "can_export", "can_print", "can_view_financial", "can_view_sensitive"];
const reportActions = ["can_view", "can_export", "can_print"];
const settingsActions = ["can_view", "can_create", "can_edit", "can_delete", "can_configure", "can_export", "can_print"];

const moduleOverrides = {
  companies_admin: "platform",
  inventory: "inventory",
};

const hrPageKeys = new Set([
  "dashboard", "employees", "templates", "evaluations", "productivity", "discipline", "incentives", "top", "plans", "reports", "settings",
  "guarantees", "overtime", "shifts", "daily_operations", "performance_criteria", "performance_kpi_scores", "users_permissions", "recruitment",
  "reports_center", "audit_logs", "hr_home", "hr_employees_full", "hr_reports", "hr_reports_full", "hr_requests_approvals", "hr_requests", "hr_performance_full", "hr_incentives_full",
  "hr_attendance_payroll", "hr_salary", "hr_disciplinary", "hr_recruitment_full", "hr_leaves", "hr_complaints", "hr_circulars", "hr_termination",
  "hr_surveys", "hr_insurance", "hr_announcements", "hr_files", "hr_contracts", "hr_custodies", "hr_training", "hr_approvals", "hr_org_chart", "hr_settings_full",
  "hr_financial_setup", "hr_templates_full", "hr_settings", "ai_assistant", "theme_settings",
]);

const pageActionOverrides = {
  dashboard: ["can_view", "can_export", "can_print"],
  employees: commonActions,
  hr_employees_full: commonActions,
  discipline: approvalActions,
  hr_attendance_payroll: approvalActions,
  hr_salary: financialActions,
  hr_requests_approvals: approvalActions,
  incentives: financialActions,
  hr_incentives_full: financialActions,
  reports: reportActions,
  reports_center: reportActions,
  hr_reports: reportActions,
  settings: settingsActions,
  system_settings: settingsActions,
  hr_settings: settingsActions,
  users_permissions: settingsActions,
  audit_logs: ["can_view", "can_export", "can_print", "can_view_sensitive"],
  companies_admin: settingsActions,
  evaluations: ["can_view", "can_create", "can_edit", "can_approve", "can_export", "can_print"],
  performance_criteria: settingsActions,
  performance_kpi_scores: ["can_view", "can_create", "can_edit", "can_approve", "can_export", "can_print"],
  templates: settingsActions,
  inventory: ["can_view", "can_create", "can_edit", "can_delete", "can_approve", "can_post", "can_import", "can_export", "can_print", "can_view_financial"],
};

// Sidebar hierarchy belongs to the canonical page registry so navigation,
// permissions and routing continue to share the same page keys.
const navigationMetadata = {
  hr_home: { navGroupKey: "hr_dashboard", navGroupLabel: "لوحة الموارد البشرية", navGroupOrder: 1, navItemOrder: 1 },
  employees: { navGroupKey: "hr_employees", navGroupLabel: "إدارة الموظفين", navGroupOrder: 2, navItemOrder: 1 },
  hr_org_chart: { navGroupKey: "hr_employees", navGroupLabel: "إدارة الموظفين", navGroupOrder: 2, navItemOrder: 2 },
  hr_contracts: { navGroupKey: "hr_employees", navGroupLabel: "إدارة الموظفين", navGroupOrder: 2, navItemOrder: 3 },
  hr_files: { navGroupKey: "hr_employees", navGroupLabel: "إدارة الموظفين", navGroupOrder: 2, navItemOrder: 4 },
  guarantees: { navGroupKey: "hr_employees", navGroupLabel: "إدارة الموظفين", navGroupOrder: 2, navItemOrder: 5 },
  hr_custodies: { navGroupKey: "hr_employees", navGroupLabel: "إدارة الموظفين", navGroupOrder: 2, navItemOrder: 6 },
  daily_operations: { navGroupKey: "hr_attendance", navGroupLabel: "الحضور والدوام", navGroupOrder: 3, navItemOrder: 1 },
  discipline: { navGroupKey: "hr_attendance", navGroupLabel: "الحضور والدوام", navGroupOrder: 3, navItemOrder: 2 },
  shifts: { navGroupKey: "hr_attendance", navGroupLabel: "الحضور والدوام", navGroupOrder: 3, navItemOrder: 3 },
  overtime: { navGroupKey: "hr_attendance", navGroupLabel: "الحضور والدوام", navGroupOrder: 3, navItemOrder: 4 },
  hr_leaves: { navGroupKey: "hr_requests", navGroupLabel: "الإجازات والطلبات", navGroupOrder: 4, navItemOrder: 1 },
  hr_requests_approvals: { navGroupKey: "hr_requests", navGroupLabel: "الإجازات والطلبات", navGroupOrder: 4, navItemOrder: 2 },
  hr_salary: { navGroupKey: "hr_payroll", navGroupLabel: "الرواتب والمزايا", navGroupOrder: 5, navItemOrder: 1, navLabel: "الرواتب" },
  hr_financial_setup: { navGroupKey: "hr_payroll", navGroupLabel: "الرواتب والمزايا", navGroupOrder: 5, navItemOrder: 2, navLabel: "تهيئة العمليات المالية" },
  templates: { navGroupKey: "hr_performance", navGroupLabel: "الأداء والحوافز", navGroupOrder: 6, navItemOrder: 1 },
  evaluations: { navGroupKey: "hr_performance", navGroupLabel: "الأداء والحوافز", navGroupOrder: 6, navItemOrder: 2 },
  performance_criteria: { navGroupKey: "hr_performance", navGroupLabel: "الأداء والحوافز", navGroupOrder: 6, navItemOrder: 3 },
  performance_kpi_scores: { navGroupKey: "hr_performance", navGroupLabel: "الأداء والحوافز", navGroupOrder: 6, navItemOrder: 4 },
  productivity: { navGroupKey: "hr_performance", navGroupLabel: "الأداء والحوافز", navGroupOrder: 6, navItemOrder: 5 },
  incentives: { navGroupKey: "hr_performance", navGroupLabel: "الأداء والحوافز", navGroupOrder: 6, navItemOrder: 6 },
  top: { navGroupKey: "hr_performance", navGroupLabel: "الأداء والحوافز", navGroupOrder: 6, navItemOrder: 7 },
  plans: { navGroupKey: "hr_performance", navGroupLabel: "الأداء والحوافز", navGroupOrder: 6, navItemOrder: 8 },
  recruitment: { navGroupKey: "hr_recruitment", navGroupLabel: "التوظيف والتطوير", navGroupOrder: 7, navItemOrder: 1, navLabel: "التوظيف" },
  hr_training: { navGroupKey: "hr_recruitment", navGroupLabel: "التوظيف والتطوير", navGroupOrder: 7, navItemOrder: 2 },
  hr_disciplinary: { navGroupKey: "hr_relations", navGroupLabel: "العلاقات الوظيفية", navGroupOrder: 8, navItemOrder: 1, navLabel: "المخالفات والإنذارات" },
  hr_circulars: { navGroupKey: "hr_relations", navGroupLabel: "العلاقات الوظيفية", navGroupOrder: 8, navItemOrder: 2 },
  hr_complaints: { navGroupKey: "hr_relations", navGroupLabel: "العلاقات الوظيفية", navGroupOrder: 8, navItemOrder: 3 },
  hr_termination: { navGroupKey: "hr_termination", navGroupLabel: "إنهاء الخدمة", navGroupOrder: 9, navItemOrder: 1 },
  hr_reports: { navGroupKey: "hr_reports", navGroupLabel: "التقارير", navGroupOrder: 10, navItemOrder: 1 },
  hr_settings: { navGroupKey: "hr_settings", navGroupLabel: "الإعدادات والصلاحيات", navGroupOrder: 11, navItemOrder: 1 },
  users_permissions: { navGroupKey: "hr_settings", navGroupLabel: "الإعدادات والصلاحيات", navGroupOrder: 11, navItemOrder: 2 },

  inventory: { navGroupKey: "inventory_dashboard", navGroupLabel: "لوحة المخزون", navGroupOrder: 1, navItemOrder: 1, navLabel: "لوحة المخزون" },
  inventory_items: { navGroupKey: "inventory_items", navGroupLabel: "الأصناف", navGroupOrder: 2, navItemOrder: 1 },
  inventory_categories: { navGroupKey: "inventory_classification", navGroupLabel: "التصنيفات والوحدات", navGroupOrder: 3, navItemOrder: 1 },
  inventory_units: { navGroupKey: "inventory_classification", navGroupLabel: "التصنيفات والوحدات", navGroupOrder: 3, navItemOrder: 2 },
  inventory_warehouses: { navGroupKey: "inventory_warehouses", navGroupLabel: "المستودعات", navGroupOrder: 4, navItemOrder: 1 },
  inventory_suppliers: { navGroupKey: "inventory_purchasing", navGroupLabel: "المشتريات", navGroupOrder: 5, navItemOrder: 1 },
  inventory_purchase_requests: { navGroupKey: "inventory_purchasing", navGroupLabel: "المشتريات", navGroupOrder: 5, navItemOrder: 2 },
  inventory_purchase_orders: { navGroupKey: "inventory_purchasing", navGroupLabel: "المشتريات", navGroupOrder: 5, navItemOrder: 3 },
  inventory_receipts: { navGroupKey: "inventory_purchasing", navGroupLabel: "المشتريات", navGroupOrder: 5, navItemOrder: 4 },
  inventory_purchase_invoices: { navGroupKey: "inventory_purchasing", navGroupLabel: "المشتريات", navGroupOrder: 5, navItemOrder: 5 },
  inventory_issue_vouchers: { navGroupKey: "inventory_movements", navGroupLabel: "حركات المخزون", navGroupOrder: 6, navItemOrder: 1 },
  inventory_returns: { navGroupKey: "inventory_movements", navGroupLabel: "حركات المخزون", navGroupOrder: 6, navItemOrder: 2 },
  inventory_transfers: { navGroupKey: "inventory_movements", navGroupLabel: "حركات المخزون", navGroupOrder: 6, navItemOrder: 3 },
  inventory_balances: { navGroupKey: "inventory_movements", navGroupLabel: "حركات المخزون", navGroupOrder: 6, navItemOrder: 4 },
  inventory_movements: { navGroupKey: "inventory_movements", navGroupLabel: "حركات المخزون", navGroupOrder: 6, navItemOrder: 5 },
  inventory_adjustments: { navGroupKey: "inventory_stocktake", navGroupLabel: "الجرد والتسويات", navGroupOrder: 7, navItemOrder: 1 },
  inventory_stocktakes: { navGroupKey: "inventory_stocktake", navGroupLabel: "الجرد والتسويات", navGroupOrder: 7, navItemOrder: 2 },
  inventory_alerts: { navGroupKey: "inventory_alerts", navGroupLabel: "التنبيهات", navGroupOrder: 8, navItemOrder: 1 },
  inventory_reports: { navGroupKey: "inventory_reports", navGroupLabel: "التقارير", navGroupOrder: 9, navItemOrder: 1 },
  inventory_settings: { navGroupKey: "inventory_settings", navGroupLabel: "إعدادات المخزون", navGroupOrder: 10, navItemOrder: 1 },

  sales_1: { navGroupKey: "sales_dashboard", navGroupLabel: "لوحة المبيعات", navGroupOrder: 1, navItemOrder: 1 },
  sales_2: { navGroupKey: "sales_customers", navGroupLabel: "العملاء", navGroupOrder: 2, navItemOrder: 1 },
  sales_3: { navGroupKey: "sales_quotes", navGroupLabel: "عروض الأسعار", navGroupOrder: 3, navItemOrder: 1 },
  sales_4: { navGroupKey: "sales_orders", navGroupLabel: "أوامر البيع", navGroupOrder: 4, navItemOrder: 1 },
  sales_5: { navGroupKey: "sales_invoices", navGroupLabel: "فواتير المبيعات", navGroupOrder: 5, navItemOrder: 1 },
  sales_6: { navGroupKey: "sales_returns", navGroupLabel: "المرتجعات", navGroupOrder: 6, navItemOrder: 1 },
  sales_7: { navGroupKey: "sales_collections", navGroupLabel: "التحصيلات", navGroupOrder: 7, navItemOrder: 1 },
  sales_8: { navGroupKey: "sales_reports", navGroupLabel: "التقارير", navGroupOrder: 9, navItemOrder: 1 },
};

const erpRegistryPages = [
  ["inventory_items", "الأصناف", "inventory", "inventory", "inventory.items", commonActions, "active"],
  ["inventory_suppliers", "الموردون", "inventory", "inventory", "inventory.suppliers", commonActions, "active"],
  ["inventory_purchase_requests", "طلبات الشراء", "inventory", "inventory", "inventory.purchase_requests", approvalActions, "active"],
  ["inventory_purchase_orders", "أوامر الشراء", "inventory", "inventory", "inventory.purchase_orders", approvalActions, "active"],
  ["inventory_receipts", "الاستلام", "inventory", "inventory", "inventory.receipts", ["can_view", "can_create", "can_edit", "can_post", "can_export", "can_print"], "active"],
  ["inventory_issue_vouchers", "الصرف", "inventory", "inventory", "inventory.issue_vouchers", approvalActions, "active"],
  ["inventory_transfers", "التحويل المخزني", "inventory", "inventory", "inventory.transfers", approvalActions, "active"],
  ["inventory_returns", "الإرجاع", "inventory", "inventory", "inventory.returns", ["can_view", "can_create", "can_edit", "can_post", "can_export", "can_print"], "active"],
  ["inventory_adjustments", "التسويات", "inventory", "inventory", "inventory.adjustments", approvalActions, "active"],
  ["inventory_stocktakes", "الجرد", "inventory", "inventory", "inventory.stocktakes", approvalActions, "active"],
  ["inventory_balances", "الأرصدة", "inventory", "inventory", "inventory.balances", reportActions, "active"],
  ["inventory_movements", "حركة المخزون", "inventory", "inventory", "inventory.movements", reportActions, "active"],
  ["inventory_reports", "تقارير المخزون", "inventory", "inventory", "inventory.reports", reportActions, "active"],
  ["inventory_settings", "إعدادات المخزون", "inventory", "inventory", "inventory.settings", settingsActions, "active"],
  ...["لوحة المبيعات", "العملاء", "عروض الأسعار", "أوامر البيع", "فواتير البيع", "مردودات البيع", "المدفوعات", "تقارير المبيعات"].map((label, index) => [`sales_${index + 1}`, label, "sales", `sales_${index + 1}`, `sales.page_${index + 1}`, index === 7 ? reportActions : commonActions, "placeholder"]),
  ...["لوحة المشتريات", "الموردون", "طلبات الشراء", "أوامر الشراء", "فواتير الشراء", "مردودات الشراء", "مدفوعات الموردين", "تقارير المشتريات"].map((label, index) => [`purchasing_${index + 1}`, label, "purchasing", index > 0 && index < 6 ? "inventory" : `purchasing_${index + 1}`, `purchasing.page_${index + 1}`, [2, 3].includes(index) ? approvalActions : index === 7 ? reportActions : commonActions, index > 0 && index < 6 ? "active" : "placeholder"]),
  ...["لوحة الحسابات", "دليل الحسابات", "القيود اليومية", "سند قبض", "سند صرف", "مراكز التكلفة", "العملات", "التقارير المالية", "ميزان المراجعة", "قائمة الدخل", "المركز المالي", "كشف حساب"].map((label, index) => [`accounting_${index + 1}`, label, "accounting", `accounting_${index + 1}`, `accounting.page_${index + 1}`, index >= 7 ? reportActions : financialActions, "placeholder"]),
  ...["لوحة CRM", "العملاء المحتملون", "العملاء", "الفرص البيعية", "المتابعات", "التذاكر والشكاوى", "الحملات", "تقارير CRM"].map((label, index) => [`crm_${index + 1}`, label, "crm", `crm_${index + 1}`, `crm.page_${index + 1}`, index === 7 ? reportActions : commonActions, "placeholder"]),
  ...["لوحة الأصول", "سجل الأصول", "تصنيفات الأصول", "العهد", "الإهلاك", "الصيانة", "نقل الأصول", "استبعاد الأصول", "تقارير الأصول"].map((label, index) => [`assets_${index + 1}`, label, "assets", `assets_${index + 1}`, `assets.page_${index + 1}`, index === 8 ? reportActions : financialActions, "placeholder"]),
  ...["لوحة المشاريع", "قائمة المشاريع", "المهام", "الفرق", "المصروفات", "المراحل", "المستندات", "تقارير المشاريع"].map((label, index) => [`projects_${index + 1}`, label, "projects", `projects_${index + 1}`, `projects.page_${index + 1}`, index === 7 ? reportActions : commonActions, "placeholder"]),
].map(([key, label, moduleKey, routeKey, permissionKey, actions, status], index) => ({
  key,
  label,
  aliases: [],
  icon: "BriefcaseBusiness",
  group: moduleKey,
  groupLabel: erpModuleLabels[moduleKey] || moduleKey,
  permissionKey,
  moduleKey,
  moduleLabel: erpModuleLabels[moduleKey] || moduleKey,
  routeKey,
  order: 300 + index,
  actions,
  status,
  isOfficialPage: status !== "placeholder",
  isDuplicateAllowed: false,
  defaultEnabled: ["hr", "inventory", "purchasing"].includes(moduleKey) || status === "active",
}));

export const pageRegistry = [
  { key: "dashboard", label: "الرئيسية", aliases: ["لوحة التحكم", "الداشبورد"], icon: "LayoutDashboard", group: "core", groupLabel: "أساسية", permissionKey: "dashboard", moduleKey: "dashboard", order: 1, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "employees", label: "قائمة الموظفين", aliases: ["الموظفون", "سجل الموظفين"], icon: "Users", group: "hr", groupLabel: "موارد بشرية", permissionKey: "employees", moduleKey: "employees", order: 2, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "templates", label: "نماذج التقييم", aliases: ["القوالب القديمة"], icon: "ClipboardList", group: "performance", groupLabel: "الأداء", permissionKey: "templates", moduleKey: "templates", order: 3, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "evaluations", label: "تقييم الموظفين", aliases: ["تقييم أداء الموظفين"], icon: "BadgeCheck", group: "performance", groupLabel: "الأداء", permissionKey: "employee_evaluation", moduleKey: "employee_evaluation", order: 4, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "productivity", label: "الإنتاجية", aliases: ["مؤشرات الإنتاجية"], icon: "Gauge", group: "performance", groupLabel: "الأداء", permissionKey: "productivity", moduleKey: "productivity", order: 5, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "discipline", label: "الحضور والانصراف", aliases: ["الانضباط الوظيفي", "الحضور", "الانضباط"], icon: "CalendarCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "discipline", moduleKey: "discipline", order: 6, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "incentives", label: "الحوافز", aliases: ["المكافآت"], icon: "Gift", group: "financial", groupLabel: "مالية", permissionKey: "incentives", moduleKey: "incentives", order: 7, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "top", label: "موظف الشهر", aliases: ["أفضل موظف"], icon: "Trophy", group: "performance", groupLabel: "الأداء", permissionKey: "employee_of_month", moduleKey: "employee_of_month", order: 8, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "plans", label: "خطط التحسين", aliases: ["PIP", "خطة تحسين الأداء"], icon: "TrendingUp", group: "performance", groupLabel: "الأداء", permissionKey: "improvement_plans", moduleKey: "improvement_plans", order: 9, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "reports", label: "قسم التقارير", aliases: ["التقارير"], icon: "FileBarChart", group: "reports", groupLabel: "تقارير", permissionKey: "reports", moduleKey: "reports", order: 10, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "settings", label: "إعدادات", aliases: ["إعدادات النظام"], icon: "Settings", group: "settings", groupLabel: "إعدادات", permissionKey: "settings", moduleKey: "settings", order: 11, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "guarantees", label: "ضمانات الموظفين", aliases: ["الضمانات"], icon: "ShieldCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "guarantees", moduleKey: "guarantees", order: 12, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "overtime", label: "العمل الإضافي", aliases: ["ساعات إضافية"], icon: "Clock3", group: "hr", groupLabel: "موارد بشرية", permissionKey: "overtime", moduleKey: "overtime", order: 13, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "shifts", label: "شفتات الموظفين", aliases: ["الشفتات", "الجداول"], icon: "CalendarCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "shifts", moduleKey: "shifts", order: 14, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "inventory", label: "إدارة المخزون", aliases: ["المخزون"], icon: "Wallet", group: "inventory", groupLabel: "مخزون", permissionKey: "inventory", moduleKey: "inventory", order: 15, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "daily_operations", label: "العمليات اليومية", aliases: ["عمليات يومية"], icon: "Gauge", group: "core", groupLabel: "أساسية", permissionKey: "daily_operations", moduleKey: "daily_operations", order: 16, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "performance_criteria", label: "معايير الأداء", aliases: ["معايير التقييم"], icon: "ClipboardList", group: "performance", groupLabel: "الأداء", permissionKey: "performance_standards", moduleKey: "performance_standards", order: 17, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "performance_kpi_scores", label: "درجات KPI", aliases: ["نتائج KPI"], icon: "Star", group: "performance", groupLabel: "الأداء", permissionKey: "kpi_scores", moduleKey: "kpi_scores", order: 18, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "users_permissions", label: "المستخدمون والصلاحيات", aliases: ["الصلاحيات", "الأدوار"], icon: "UserRoundCog", group: "settings", groupLabel: "إعدادات", permissionKey: "users_permissions", moduleKey: "users_permissions", order: 19, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "recruitment", label: "طلبات التوظيف", aliases: ["التوظيف"], icon: "UserPlus", group: "hr", groupLabel: "موارد بشرية", permissionKey: "recruitment_requests", moduleKey: "recruitment_requests", order: 20, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "reports_center", label: "مركز التقارير", aliases: ["التقارير المركزية"], icon: "FileBarChart", group: "reports", groupLabel: "تقارير", permissionKey: "report_center", moduleKey: "report_center", order: 21, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "audit_logs", label: "سجل العمليات", aliases: ["سجل التدقيق"], icon: "ClipboardList", group: "settings", groupLabel: "إعدادات", permissionKey: "audit_logs", moduleKey: "audit_logs", order: 22, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "companies_admin", label: "إدارة الشركات", aliases: ["شركات المنصة"], icon: "Building2", group: "platform", groupLabel: "منصة", permissionKey: "companies_management", moduleKey: "companies_management", order: 23, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "system_settings", label: "الإعدادات العامة", aliases: ["إعدادات النظام العامة"], icon: "Settings", group: "settings", groupLabel: "إعدادات", permissionKey: "system.settings", moduleKey: "system", moduleLabel: "النظام", routeKey: "system_settings", order: 24, isOfficialPage: true, isDuplicateAllowed: false, status: "active", defaultEnabled: true },
  { key: "hr_home", label: "الرئيسية", aliases: ["رئيسية الموارد البشرية"], icon: "LayoutDashboard", group: "core", groupLabel: "أساسية", permissionKey: "hr_home", moduleKey: "hr_home", order: 101, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_requests_approvals", label: "الطلبات والموافقات", aliases: ["طلبات الموارد البشرية", "الموافقات"], icon: "ClipboardList", group: "hr", groupLabel: "موارد بشرية", permissionKey: "hr.requests_approvals", moduleKey: "hr_requests_approvals", order: 106, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_reports", label: "تقارير الموارد البشرية", aliases: ["تقارير HR"], icon: "FileBarChart", group: "reports", groupLabel: "تقارير", permissionKey: "hr.reports", moduleKey: "hr_reports", order: 122, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_settings", label: "إعدادات الموارد البشرية", aliases: ["إعدادات HR"], icon: "Settings", group: "settings", groupLabel: "إعدادات", permissionKey: "hr.settings", moduleKey: "hr_settings", order: 123, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_employees_full", label: "قائمة الموظفين", aliases: ["قائمة موظفين كاملة"], icon: "Users", group: "hr", groupLabel: "موارد بشرية", permissionKey: "hr_employees_full", moduleKey: "hr_employees_full", order: 102, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "hr_reports_full", label: "قسم التقارير", aliases: ["قسم تقارير كامل"], icon: "FileBarChart", group: "reports", groupLabel: "تقارير", permissionKey: "hr_reports_full", moduleKey: "hr_reports_full", order: 103, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "hr_requests", label: "الطلبات", aliases: ["طلبات الموظفين"], icon: "ClipboardList", group: "hr", groupLabel: "موارد بشرية", permissionKey: "requests", moduleKey: "requests", order: 104, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "hr_performance_full", label: "قياس الأداء", aliases: ["أداء الموارد البشرية"], icon: "BadgeCheck", group: "performance", groupLabel: "الأداء", permissionKey: "performance", moduleKey: "performance", order: 105, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "hr_incentives_full", label: "الحوافز", aliases: ["حوافز الموارد البشرية"], icon: "Gift", group: "financial", groupLabel: "مالية", permissionKey: "hr_incentives_full", moduleKey: "hr_incentives_full", order: 106, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "hr_attendance_payroll", label: "حساب الدوام", aliases: ["الحضور والدوام"], icon: "Clock3", group: "hr", groupLabel: "موارد بشرية", permissionKey: "attendance", moduleKey: "attendance", order: 107, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "hr_salary", label: "حساب الراتب", aliases: ["الرواتب"], icon: "Wallet", group: "financial", groupLabel: "مالية", permissionKey: "salaries", moduleKey: "salaries", order: 108, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_disciplinary", label: "المساءلات والإنذارات", aliases: ["المساءلات"], icon: "AlertTriangle", group: "hr", groupLabel: "موارد بشرية", permissionKey: "disciplinary", moduleKey: "disciplinary", order: 109, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_recruitment_full", label: "التوظيف", aliases: ["التوظيف الكامل"], icon: "UserPlus", group: "hr", groupLabel: "موارد بشرية", permissionKey: "recruitment", moduleKey: "recruitment", order: 110, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "hr_leaves", label: "الإجازات", aliases: ["إدارة الإجازات"], icon: "CalendarCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "leaves", moduleKey: "leaves", order: 111, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_complaints", label: "الشكاوى", aliases: ["شكاوى الموظفين"], icon: "MessageSquareWarning", group: "hr", groupLabel: "موارد بشرية", permissionKey: "complaints", moduleKey: "complaints", order: 112, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_circulars", label: "التعاميم", aliases: ["التعاميم الإدارية"], icon: "ClipboardList", group: "hr", groupLabel: "موارد بشرية", permissionKey: "circulars", moduleKey: "circulars", order: 113, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_termination", label: "إنهاء الخدمة", aliases: ["نهاية الخدمة"], icon: "LogOut", group: "hr", groupLabel: "موارد بشرية", permissionKey: "end_of_service", moduleKey: "end_of_service", order: 114, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_surveys", label: "الاستبيانات", aliases: ["استبيانات"], icon: "ClipboardList", group: "hr", groupLabel: "موارد بشرية", permissionKey: "surveys", moduleKey: "surveys", order: 115, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_insurance", label: "التأمينات", aliases: ["التأمين"], icon: "ShieldCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "insurance", moduleKey: "insurance", order: 116, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_announcements", label: "قسم الإعلانات", aliases: ["الإعلانات"], icon: "Bell", group: "hr", groupLabel: "موارد بشرية", permissionKey: "announcements", moduleKey: "announcements", order: 117, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_files", label: "إدارة الملفات", aliases: ["ملفات الموظفين"], icon: "FileSpreadsheet", group: "hr", groupLabel: "موارد بشرية", permissionKey: "files", moduleKey: "files", order: 118, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_contracts", label: "العقود", aliases: ["عقود الموظفين"], icon: "ClipboardList", group: "hr", groupLabel: "موارد بشرية", permissionKey: "contracts", moduleKey: "contracts", order: 119, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_custodies", label: "العهد", aliases: ["عهد الموظفين"], icon: "Wallet", group: "hr", groupLabel: "موارد بشرية", permissionKey: "custodies", moduleKey: "custodies", order: 120, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_training", label: "التدريب", aliases: ["التدريب والتطوير"], icon: "Star", group: "hr", groupLabel: "موارد بشرية", permissionKey: "training", moduleKey: "training", order: 121, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_approvals", label: "الموافقات", aliases: ["الاعتمادات"], icon: "BadgeCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "approvals", moduleKey: "approvals", order: 122, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "hr_org_chart", label: "الهيكل التنظيمي", aliases: ["الهيكل"], icon: "Building2", group: "hr", groupLabel: "موارد بشرية", permissionKey: "organization", moduleKey: "organization", order: 123, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_settings_full", label: "إعدادات", aliases: ["إعدادات الموارد البشرية"], icon: "Settings", group: "settings", groupLabel: "إعدادات", permissionKey: "hr_settings_full", moduleKey: "hr_settings_full", order: 124, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "hr_financial_setup", label: "تهيئة المعلومات المالية", aliases: ["الإعداد المالي"], icon: "CircleDollarSign", group: "financial", groupLabel: "مالية", permissionKey: "financial_setup", moduleKey: "financial_setup", order: 125, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "hr_templates_full", label: "القوالب", aliases: ["قوالب الموارد البشرية"], icon: "ClipboardList", group: "settings", groupLabel: "إعدادات", permissionKey: "hr_templates_full", moduleKey: "hr_templates_full", order: 126, isOfficialPage: false, isDuplicateAllowed: false, status: "alias", defaultEnabled: false },
  { key: "ai_assistant", label: "المساعد الذكي", aliases: ["AI"], icon: "UserRoundCog", group: "core", groupLabel: "أساسية", permissionKey: "ai_assistant", moduleKey: "ai_assistant", order: 125, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "theme_settings", label: "الثيم والألوان", aliases: ["ألوان الشركة"], icon: "Settings", group: "settings", groupLabel: "إعدادات", permissionKey: "theme_settings", moduleKey: "theme_settings", order: 126, isOfficialPage: true, isDuplicateAllowed: false },
  ...erpRegistryPages,
].map((page) => {
  const normalizedModuleKey = moduleOverrides[page.key] || (hrPageKeys.has(page.key) ? "hr" : page.moduleKey || "hr");
  const navMetadata = navigationMetadata[page.key] || {};
  const isAlias = page.status === "alias";
  return {
  ...page,
  ...navMetadata,
  moduleKey: normalizedModuleKey,
  moduleLabel: page.moduleLabel || erpModuleLabels[normalizedModuleKey] || page.groupLabel || page.label,
  actions: page.actions || pageActionOverrides[page.key] || commonActions,
  status: page.status || "active",
  routeKey: page.routeKey || page.key,
  defaultEnabled: page.defaultEnabled ?? !["salaries", "financial_setup", "incentives", "inventory", "ai_assistant", "companies_management"].includes(page.permissionKey),
  canonical: !isAlias,
  alias: isAlias,
  hiddenFromNavigation: page.hiddenFromNavigation ?? isAlias,
  };
});

export const pageRegistryByKey = Object.fromEntries(pageRegistry.map((page) => [page.key, page]));
export const permissionKeyForPage = (pageKey = "") => pageRegistryByKey[pageKey]?.permissionKey || pageKey;

export const validateUniquePermissionKeys = (pages = pageRegistry) => {
  const seen = new Map();
  const duplicates = [];
  for (const page of pages || []) {
    if (!page?.permissionKey) continue;
    if (seen.has(page.permissionKey)) {
      duplicates.push({ permissionKey: page.permissionKey, firstPage: seen.get(page.permissionKey), duplicatePage: page.key });
    } else {
      seen.set(page.permissionKey, page.key);
    }
  }
  if (duplicates.length) console.warn("Duplicate permissionKey in pageRegistry:", duplicates);
  return duplicates;
};

validateUniquePermissionKeys(pageRegistry);

export const findPageByArabicName = (value = "") => {
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  return pageRegistry.find((page) =>
    [page.label, page.key, page.permissionKey, ...(page.aliases || [])].some((name) => text.includes(String(name).toLowerCase())),
  ) || null;
};

export const assistantModes = [
  {
    id: "navigation",
    label: "مساعد التنقل",
    prompts: ["افتح صفحة ضمانات الموظفين", "افتح صفحة الموظفين", "انتقل إلى التقارير", "اذهب إلى المخزون"],
  },
  {
    id: "reports",
    label: "مساعد التقارير",
    prompts: ["أنشئ تقرير أداء شهري", "أنشئ تقرير ضمانات الموظفين", "أنشئ تقرير مخزون", "أنشئ تقرير حضور وانضباط"],
  },
  {
    id: "plans",
    label: "مساعد الخطط والاستراتيجيات",
    prompts: ["ابني خطة استراتيجية للموارد البشرية", "ابني خطة تشغيلية لتحسين الفروع", "ابني خطة تدريب شهرية", "ابني برنامج تحسين أداء"],
  },
  {
    id: "hr",
    label: "مساعد الموارد البشرية",
    prompts: ["حلل أداء الموظفين", "اقترح خطة تقليل دوران الموظفين", "اكتب خطة توظيف", "اقترح برنامج تأهيل موظف جديد"],
  },
];
