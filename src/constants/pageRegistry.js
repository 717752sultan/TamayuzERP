export const pageRegistry = [
  { key: "dashboard", label: "الرئيسية", aliases: ["لوحة التحكم", "الداشبورد"], icon: "LayoutDashboard", group: "core", groupLabel: "أساسية", permissionKey: "dashboard", moduleKey: "dashboard", order: 1, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "employees", label: "قائمة الموظفين", aliases: ["الموظفون", "سجل الموظفين"], icon: "Users", group: "hr", groupLabel: "موارد بشرية", permissionKey: "employees", moduleKey: "employees", order: 2, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "templates", label: "نماذج التقييم", aliases: ["القوالب القديمة"], icon: "ClipboardList", group: "performance", groupLabel: "الأداء", permissionKey: "templates", moduleKey: "templates", order: 3, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "evaluations", label: "تقييم الموظفين", aliases: ["تقييم أداء الموظفين"], icon: "BadgeCheck", group: "performance", groupLabel: "الأداء", permissionKey: "employee_evaluation", moduleKey: "employee_evaluation", order: 4, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "productivity", label: "الإنتاجية", aliases: ["مؤشرات الإنتاجية"], icon: "Gauge", group: "performance", groupLabel: "الأداء", permissionKey: "productivity", moduleKey: "productivity", order: 5, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "discipline", label: "الانضباط", aliases: ["الانضباط الوظيفي", "الحضور"], icon: "CalendarCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "discipline", moduleKey: "discipline", order: 6, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "incentives", label: "الحوافز", aliases: ["المكافآت"], icon: "Gift", group: "financial", groupLabel: "مالية", permissionKey: "incentives", moduleKey: "incentives", order: 7, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "top", label: "موظف الشهر", aliases: ["أفضل موظف"], icon: "Trophy", group: "performance", groupLabel: "الأداء", permissionKey: "employee_of_month", moduleKey: "employee_of_month", order: 8, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "plans", label: "خطط التحسين", aliases: ["PIP", "خطة تحسين الأداء"], icon: "TrendingUp", group: "performance", groupLabel: "الأداء", permissionKey: "improvement_plans", moduleKey: "improvement_plans", order: 9, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "reports", label: "قسم التقارير", aliases: ["التقارير"], icon: "FileBarChart", group: "reports", groupLabel: "تقارير", permissionKey: "reports", moduleKey: "reports", order: 10, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "settings", label: "إعدادات", aliases: ["إعدادات النظام"], icon: "Settings", group: "settings", groupLabel: "إعدادات", permissionKey: "settings", moduleKey: "settings", order: 11, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "guarantees", label: "ضمانات الموظفين", aliases: ["الضمانات"], icon: "ShieldCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "guarantees", moduleKey: "guarantees", order: 12, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "overtime", label: "العمل الإضافي", aliases: ["ساعات إضافية"], icon: "Clock3", group: "hr", groupLabel: "موارد بشرية", permissionKey: "overtime", moduleKey: "overtime", order: 13, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "shifts", label: "شفتات الموظفين", aliases: ["الشفتات", "الجداول"], icon: "CalendarCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "shifts", moduleKey: "shifts", order: 14, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "inventory", label: "إدارة المخزون", aliases: ["المخزون"], icon: "Wallet", group: "inventory", groupLabel: "مخزون", permissionKey: "inventory", moduleKey: "inventory", order: 15, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "daily_operations", label: "العمليات اليومية", aliases: ["عمليات يومية"], icon: "Gauge", group: "core", groupLabel: "أساسية", permissionKey: "daily_operations", moduleKey: "daily_operations", order: 16, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "performance_criteria", label: "معايير الأداء", aliases: ["معايير التقييم"], icon: "ClipboardList", group: "performance", groupLabel: "الأداء", permissionKey: "performance_standards", moduleKey: "performance_standards", order: 17, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "performance_kpi_scores", label: "درجات KPI", aliases: ["نتائج KPI"], icon: "Star", group: "performance", groupLabel: "الأداء", permissionKey: "kpi_scores", moduleKey: "kpi_scores", order: 18, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "users_permissions", label: "المستخدمون والصلاحيات", aliases: ["الصلاحيات", "الأدوار"], icon: "UserRoundCog", group: "settings", groupLabel: "إعدادات", permissionKey: "users_permissions", moduleKey: "users_permissions", order: 19, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "recruitment", label: "طلبات التوظيف", aliases: ["التوظيف"], icon: "UserPlus", group: "hr", groupLabel: "موارد بشرية", permissionKey: "recruitment_requests", moduleKey: "recruitment_requests", order: 20, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "reports_center", label: "مركز التقارير", aliases: ["التقارير المركزية"], icon: "FileBarChart", group: "reports", groupLabel: "تقارير", permissionKey: "report_center", moduleKey: "report_center", order: 21, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "audit_logs", label: "سجل العمليات", aliases: ["سجل التدقيق"], icon: "ClipboardList", group: "settings", groupLabel: "إعدادات", permissionKey: "audit_logs", moduleKey: "audit_logs", order: 22, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "companies_admin", label: "إدارة الشركات", aliases: ["شركات المنصة"], icon: "Building2", group: "platform", groupLabel: "منصة", permissionKey: "companies_management", moduleKey: "companies_management", order: 23, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_home", label: "الرئيسية", aliases: ["رئيسية الموارد البشرية"], icon: "LayoutDashboard", group: "core", groupLabel: "أساسية", permissionKey: "hr_home", moduleKey: "hr_home", order: 101, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "hr_employees_full", label: "قائمة الموظفين", aliases: ["قائمة موظفين كاملة"], icon: "Users", group: "hr", groupLabel: "موارد بشرية", permissionKey: "hr_employees_full", moduleKey: "hr_employees_full", order: 102, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "hr_reports_full", label: "قسم التقارير", aliases: ["قسم تقارير كامل"], icon: "FileBarChart", group: "reports", groupLabel: "تقارير", permissionKey: "hr_reports_full", moduleKey: "hr_reports_full", order: 103, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "hr_requests", label: "الطلبات", aliases: ["طلبات الموظفين"], icon: "ClipboardList", group: "hr", groupLabel: "موارد بشرية", permissionKey: "requests", moduleKey: "requests", order: 104, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_performance_full", label: "قياس الأداء", aliases: ["أداء الموارد البشرية"], icon: "BadgeCheck", group: "performance", groupLabel: "الأداء", permissionKey: "performance", moduleKey: "performance", order: 105, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "hr_incentives_full", label: "الحوافز", aliases: ["حوافز الموارد البشرية"], icon: "Gift", group: "financial", groupLabel: "مالية", permissionKey: "hr_incentives_full", moduleKey: "hr_incentives_full", order: 106, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "hr_attendance_payroll", label: "حساب الدوام", aliases: ["الحضور والدوام"], icon: "Clock3", group: "hr", groupLabel: "موارد بشرية", permissionKey: "attendance", moduleKey: "attendance", order: 107, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_salary", label: "حساب الراتب", aliases: ["الرواتب"], icon: "Wallet", group: "financial", groupLabel: "مالية", permissionKey: "salaries", moduleKey: "salaries", order: 108, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_disciplinary", label: "المساءلات والإنذارات", aliases: ["المساءلات"], icon: "AlertTriangle", group: "hr", groupLabel: "موارد بشرية", permissionKey: "disciplinary", moduleKey: "disciplinary", order: 109, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_recruitment_full", label: "التوظيف", aliases: ["التوظيف الكامل"], icon: "UserPlus", group: "hr", groupLabel: "موارد بشرية", permissionKey: "recruitment", moduleKey: "recruitment", order: 110, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "hr_leaves", label: "الإجازات", aliases: ["إدارة الإجازات"], icon: "CalendarCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "leaves", moduleKey: "leaves", order: 111, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_complaints", label: "الشكاوى", aliases: ["شكاوى الموظفين"], icon: "MessageSquareWarning", group: "hr", groupLabel: "موارد بشرية", permissionKey: "complaints", moduleKey: "complaints", order: 112, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_circulars", label: "التعاميم", aliases: ["التعاميم الإدارية"], icon: "ClipboardList", group: "hr", groupLabel: "موارد بشرية", permissionKey: "circulars", moduleKey: "circulars", order: 113, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_termination", label: "إنهاء الخدمة", aliases: ["نهاية الخدمة"], icon: "LogOut", group: "hr", groupLabel: "موارد بشرية", permissionKey: "end_of_service", moduleKey: "end_of_service", order: 114, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_surveys", label: "الاستبيانات", aliases: ["استبيانات"], icon: "ClipboardList", group: "hr", groupLabel: "موارد بشرية", permissionKey: "surveys", moduleKey: "surveys", order: 115, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_insurance", label: "التأمينات", aliases: ["التأمين"], icon: "ShieldCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "insurance", moduleKey: "insurance", order: 116, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_announcements", label: "قسم الإعلانات", aliases: ["الإعلانات"], icon: "Bell", group: "hr", groupLabel: "موارد بشرية", permissionKey: "announcements", moduleKey: "announcements", order: 117, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_files", label: "إدارة الملفات", aliases: ["ملفات الموظفين"], icon: "FileSpreadsheet", group: "hr", groupLabel: "موارد بشرية", permissionKey: "files", moduleKey: "files", order: 118, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_training", label: "التدريب", aliases: ["التدريب والتطوير"], icon: "Star", group: "hr", groupLabel: "موارد بشرية", permissionKey: "training", moduleKey: "training", order: 119, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_approvals", label: "الموافقات", aliases: ["الاعتمادات"], icon: "BadgeCheck", group: "hr", groupLabel: "موارد بشرية", permissionKey: "approvals", moduleKey: "approvals", order: 120, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_org_chart", label: "الهيكل التنظيمي", aliases: ["الهيكل"], icon: "Building2", group: "hr", groupLabel: "موارد بشرية", permissionKey: "organization", moduleKey: "organization", order: 121, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_settings_full", label: "إعدادات", aliases: ["إعدادات الموارد البشرية"], icon: "Settings", group: "settings", groupLabel: "إعدادات", permissionKey: "hr_settings_full", moduleKey: "hr_settings_full", order: 122, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "hr_financial_setup", label: "تهيئة المعلومات المالية", aliases: ["الإعداد المالي"], icon: "CircleDollarSign", group: "financial", groupLabel: "مالية", permissionKey: "financial_setup", moduleKey: "financial_setup", order: 123, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "hr_templates_full", label: "القوالب", aliases: ["قوالب الموارد البشرية"], icon: "ClipboardList", group: "settings", groupLabel: "إعدادات", permissionKey: "hr_templates_full", moduleKey: "hr_templates_full", order: 124, isOfficialPage: true, isDuplicateAllowed: true },
  { key: "ai_assistant", label: "المساعد الذكي", aliases: ["AI"], icon: "UserRoundCog", group: "core", groupLabel: "أساسية", permissionKey: "ai_assistant", moduleKey: "ai_assistant", order: 125, isOfficialPage: true, isDuplicateAllowed: false },
  { key: "theme_settings", label: "الثيم والألوان", aliases: ["ألوان الشركة"], icon: "Settings", group: "settings", groupLabel: "إعدادات", permissionKey: "theme_settings", moduleKey: "theme_settings", order: 126, isOfficialPage: true, isDuplicateAllowed: false },
].map((page) => ({
  ...page,
  routeKey: page.routeKey || page.key,
  defaultEnabled: page.defaultEnabled ?? !["salaries", "financial_setup", "incentives", "inventory", "ai_assistant", "companies_management"].includes(page.permissionKey),
}));

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
