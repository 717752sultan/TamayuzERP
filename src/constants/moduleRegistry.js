export const ERP_MODULES = [
  {
    key: "hr",
    label: "الموارد البشرية",
    description: "كل ما يخص الموظفين وشؤون الموارد البشرية",
    permissionKey: "module_hr",
    pages: [
      { key: "dashboard", label: "لوحة الموارد البشرية", routeKey: "dashboard", permissionKey: "dashboard", moduleKey: "hr", status: "active" },
      { key: "employees", label: "الموظفون", routeKey: "employees", permissionKey: "employees", moduleKey: "hr", status: "active" },
      { key: "discipline", label: "الحضور والانصراف", routeKey: "discipline", permissionKey: "discipline", moduleKey: "hr", status: "active" },
      { key: "hr_leaves", label: "الإجازات", routeKey: "hr_leaves", permissionKey: "leaves", moduleKey: "hr", status: "active" },
      { key: "hr_salary", label: "الرواتب", routeKey: "hr_salary", permissionKey: "salaries", moduleKey: "hr", status: "active" },
      { key: "hr_requests", label: "الطلبات والموافقات", routeKey: "hr_requests", permissionKey: "requests", moduleKey: "hr", status: "active" },
      { key: "hr_disciplinary", label: "المخالفات والإنذارات", routeKey: "hr_disciplinary", permissionKey: "disciplinary", moduleKey: "hr", status: "active" },
      { key: "hr_termination", label: "إنهاء الخدمة", routeKey: "hr_termination", permissionKey: "end_of_service", moduleKey: "hr", status: "active" },
      { key: "hr_files", label: "ملفات الموظفين", routeKey: "hr_files", permissionKey: "files", moduleKey: "hr", status: "active" },
      { key: "hr_templates_full", label: "العقود والقوالب", routeKey: "hr_templates_full", permissionKey: "hr_templates_full", moduleKey: "hr", status: "active" },
      { key: "guarantees", label: "الضمانات", routeKey: "guarantees", permissionKey: "guarantees", moduleKey: "hr", status: "active" },
      { key: "hr_financial_setup", label: "العهد والتهيئة المالية", routeKey: "hr_financial_setup", permissionKey: "financial_setup", moduleKey: "hr", status: "active" },
      { key: "evaluations", label: "التقييم", routeKey: "evaluations", permissionKey: "employee_evaluation", moduleKey: "hr", status: "active" },
      { key: "templates", label: "نماذج التقييم", routeKey: "templates", permissionKey: "templates", moduleKey: "hr", status: "active" },
      { key: "performance_criteria", label: "معايير الأداء", routeKey: "performance_criteria", permissionKey: "performance_standards", moduleKey: "hr", status: "active" },
      { key: "performance_kpi_scores", label: "درجات KPI", routeKey: "performance_kpi_scores", permissionKey: "kpi_scores", moduleKey: "hr", status: "active" },
      { key: "incentives", label: "الحوافز", routeKey: "incentives", permissionKey: "incentives", moduleKey: "hr", status: "active" },
      { key: "overtime", label: "العمل الإضافي", routeKey: "overtime", permissionKey: "overtime", moduleKey: "hr", status: "active" },
      { key: "shifts", label: "الشفتات", routeKey: "shifts", permissionKey: "shifts", moduleKey: "hr", status: "active" },
      { key: "recruitment", label: "التوظيف", routeKey: "recruitment", permissionKey: "recruitment_requests", moduleKey: "hr", status: "active" },
      { key: "hr_training", label: "التدريب", routeKey: "hr_training", permissionKey: "training", moduleKey: "hr", status: "active" },
      { key: "reports", label: "التقارير", routeKey: "reports", permissionKey: "reports", moduleKey: "hr", status: "active" },
      { key: "reports_center", label: "مركز التقارير", routeKey: "reports_center", permissionKey: "report_center", moduleKey: "hr", status: "active" },
      { key: "daily_operations", label: "العمليات اليومية", routeKey: "daily_operations", permissionKey: "daily_operations", moduleKey: "hr", status: "active" },
    ],
  },
  {
    key: "inventory",
    label: "المخازن والمخزون",
    description: "إدارة الأصناف والمستودعات والحركات المخزنية",
    permissionKey: "module_inventory",
    pages: [
      { key: "inventory", label: "لوحة المخزون", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_items", label: "الأصناف", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_suppliers", label: "الموردون", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_purchase_requests", label: "طلبات الشراء", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_purchase_orders", label: "أوامر الشراء", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_receipts", label: "الاستلام", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_issue_vouchers", label: "الصرف", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_transfers", label: "التحويل المخزني", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_returns", label: "الإرجاع", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_adjustments", label: "التسويات", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_stocktakes", label: "الجرد", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_balances", label: "الأرصدة", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_movements", label: "حركة المخزون", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_reports", label: "تقارير المخزون", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
      { key: "inventory_settings", label: "إعدادات المخزون", routeKey: "inventory", permissionKey: "inventory", moduleKey: "inventory", status: "active" },
    ],
  },
  {
    key: "sales",
    label: "المبيعات",
    description: "إدارة العملاء وعروض الأسعار وأوامر وفواتير البيع",
    permissionKey: "module_sales",
    pages: ["لوحة المبيعات", "العملاء", "عروض الأسعار", "أوامر البيع", "فواتير البيع", "مردودات البيع", "المدفوعات", "تقارير المبيعات"].map((label, index) => ({ key: `sales_${index + 1}`, label, routeKey: `sales_${index + 1}`, permissionKey: "module_sales", moduleKey: "sales", status: "placeholder" })),
  },
  {
    key: "purchasing",
    label: "المشتريات",
    description: "إدارة الموردين وطلبات وأوامر وفواتير الشراء",
    permissionKey: "module_purchasing",
    pages: [
      { key: "purchasing_dashboard", label: "لوحة المشتريات", routeKey: "purchasing_dashboard", permissionKey: "module_purchasing", moduleKey: "purchasing", status: "placeholder" },
      { key: "purchasing_suppliers", label: "الموردون", routeKey: "inventory", permissionKey: "inventory", moduleKey: "purchasing", status: "active" },
      { key: "purchasing_requests", label: "طلبات الشراء", routeKey: "inventory", permissionKey: "inventory", moduleKey: "purchasing", status: "active" },
      { key: "purchasing_orders", label: "أوامر الشراء", routeKey: "inventory", permissionKey: "inventory", moduleKey: "purchasing", status: "active" },
      { key: "purchasing_invoices", label: "فواتير الشراء", routeKey: "inventory", permissionKey: "inventory", moduleKey: "purchasing", status: "active" },
      { key: "purchasing_returns", label: "مردودات الشراء", routeKey: "inventory", permissionKey: "inventory", moduleKey: "purchasing", status: "active" },
      { key: "purchasing_payments", label: "مدفوعات الموردين", routeKey: "purchasing_payments", permissionKey: "module_purchasing", moduleKey: "purchasing", status: "placeholder" },
      { key: "purchasing_reports", label: "تقارير المشتريات", routeKey: "purchasing_reports", permissionKey: "module_purchasing", moduleKey: "purchasing", status: "placeholder" },
    ],
  },
  {
    key: "accounting",
    label: "الحسابات",
    description: "إدارة الحسابات والقيود والسندات والتقارير المالية",
    permissionKey: "module_accounting",
    pages: ["لوحة الحسابات", "دليل الحسابات", "القيود اليومية", "سند قبض", "سند صرف", "مراكز التكلفة", "العملات", "التقارير المالية", "ميزان المراجعة", "قائمة الدخل", "المركز المالي", "كشف حساب"].map((label, index) => ({ key: `accounting_${index + 1}`, label, routeKey: `accounting_${index + 1}`, permissionKey: "module_accounting", moduleKey: "accounting", status: "placeholder" })),
  },
  {
    key: "crm",
    label: "CRM",
    description: "إدارة علاقات العملاء والفرص والمتابعات",
    permissionKey: "module_crm",
    pages: ["لوحة CRM", "العملاء المحتملون", "العملاء", "الفرص البيعية", "المتابعات", "التذاكر والشكاوى", "الحملات", "تقارير CRM"].map((label, index) => ({ key: `crm_${index + 1}`, label, routeKey: `crm_${index + 1}`, permissionKey: "module_crm", moduleKey: "crm", status: "placeholder" })),
  },
  {
    key: "assets",
    label: "الأصول",
    description: "إدارة سجل الأصول والعهد والإهلاك والصيانة",
    permissionKey: "module_assets",
    pages: ["لوحة الأصول", "سجل الأصول", "تصنيفات الأصول", "العهد", "الإهلاك", "الصيانة", "نقل الأصول", "استبعاد الأصول", "تقارير الأصول"].map((label, index) => ({ key: `assets_${index + 1}`, label, routeKey: `assets_${index + 1}`, permissionKey: "module_assets", moduleKey: "assets", status: "placeholder" })),
  },
  {
    key: "projects",
    label: "المشاريع",
    description: "إدارة المشاريع والمهام والفرق والمستندات",
    permissionKey: "module_projects",
    pages: ["لوحة المشاريع", "قائمة المشاريع", "المهام", "الفرق", "المصروفات", "المراحل", "المستندات", "تقارير المشاريع"].map((label, index) => ({ key: `projects_${index + 1}`, label, routeKey: `projects_${index + 1}`, permissionKey: "module_projects", moduleKey: "projects", status: "placeholder" })),
  },
];

export const ERP_MODULE_BY_KEY = Object.fromEntries(ERP_MODULES.map((module) => [module.key, module]));
export const ERP_PAGE_BY_KEY = Object.fromEntries(ERP_MODULES.flatMap((module) => module.pages.map((page) => [page.key, { ...page, parentModule: module.key }])));
export const ERP_PAGE_BY_ROUTE = ERP_MODULES.flatMap((module) => module.pages.map((page) => ({ ...page, parentModule: module.key }))).reduce((acc, page) => {
  acc[page.routeKey] = acc[page.routeKey] || page;
  return acc;
}, {});
export const ERP_PLACEHOLDER_PAGES = Object.values(ERP_PAGE_BY_KEY).filter((page) => page.status === "placeholder");

export const getModuleForPage = (pageKey = "") => ERP_PAGE_BY_KEY[pageKey]?.parentModule || ERP_PAGE_BY_ROUTE[pageKey]?.parentModule || "hr";
export const getModulePages = (moduleKey = "") => ERP_MODULE_BY_KEY[moduleKey]?.pages || [];
export const isPlaceholderPage = (pageKey = "") => ERP_PAGE_BY_KEY[pageKey]?.status === "placeholder";
