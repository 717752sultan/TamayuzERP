import { erpModuleLabels, pageRegistry } from "./pageRegistry";

const ERP_MODULE_DEFINITIONS = [
  {
    key: "platform",
    label: erpModuleLabels.platform,
    description: "إدارة الشركات وإعدادات المنصة",
    permissionKey: "platform",
    order: 0,
  },
  {
    key: "hr",
    label: erpModuleLabels.hr,
    description: "كل ما يخص الموظفين وشؤون الموارد البشرية والتقييم والحوافز والإعدادات والتقارير",
    permissionKey: "module_hr",
    order: 1,
  },
  {
    key: "inventory",
    label: erpModuleLabels.inventory,
    description: "إدارة الأصناف والمستودعات والحركات المخزنية",
    permissionKey: "module_inventory",
    order: 2,
  },
  {
    key: "sales",
    label: erpModuleLabels.sales,
    description: "إدارة العملاء وعروض الأسعار وأوامر وفواتير البيع",
    permissionKey: "module_sales",
    order: 3,
  },
  {
    key: "purchasing",
    label: erpModuleLabels.purchasing,
    description: "إدارة الموردين وطلبات وأوامر وفواتير الشراء",
    permissionKey: "module_purchasing",
    order: 4,
  },
  {
    key: "accounting",
    label: erpModuleLabels.accounting,
    description: "إدارة الحسابات والقيود والسندات والتقارير المالية",
    permissionKey: "module_accounting",
    order: 5,
  },
  {
    key: "crm",
    label: erpModuleLabels.crm,
    description: "إدارة علاقات العملاء والفرص والمتابعات",
    permissionKey: "module_crm",
    order: 6,
  },
  {
    key: "assets",
    label: erpModuleLabels.assets,
    description: "إدارة سجل الأصول والعهد والإهلاك والصيانة",
    permissionKey: "module_assets",
    order: 7,
  },
  {
    key: "projects",
    label: erpModuleLabels.projects,
    description: "إدارة المشاريع والمهام والفرق والمستندات",
    permissionKey: "module_projects",
    order: 8,
  },
  {
    key: "system",
    label: erpModuleLabels.system,
    description: "إدارة إعدادات النظام العامة الخاصة بالشركة",
    permissionKey: "system",
    order: 9,
  },
];

const CANONICAL_HR_PAGE_KEYS = [
  "hr_home",
  "employees",
  "hr_org_chart",
  "hr_settings",
  "users_permissions",
  "hr_contracts",
  "hr_files",
  "guarantees",
  "hr_custodies",
  "daily_operations",
  "discipline",
  "shifts",
  "overtime",
  "hr_leaves",
  "hr_requests_approvals",
  "hr_salary",
  "templates",
  "performance_criteria",
  "evaluations",
  "performance_kpi_scores",
  "productivity",
  "incentives",
  "top",
  "plans",
  "recruitment",
  "hr_training",
  "hr_disciplinary",
  "hr_circulars",
  "hr_complaints",
  "hr_termination",
  "hr_reports",
];

const CANONICAL_HR_PAGE_KEY_SET = new Set(CANONICAL_HR_PAGE_KEYS);
const CANONICAL_HR_PAGE_ORDER = Object.fromEntries(CANONICAL_HR_PAGE_KEYS.map((key, index) => [key, index + 1]));

const dedupeByKey = (items = [], keyGetter) => {
  const map = new Map();
  for (const item of items || []) {
    const key = keyGetter(item);
    if (!key) continue;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      continue;
    }
    const existingIsPlaceholder = existing.status === "placeholder" || existing.isPlaceholder === true || String(existing.description || "").includes("قيد التجهيز");
    const itemIsActive = item.status === "active" || item.isActive === true || item.component || item.routeKey;
    if (existingIsPlaceholder && itemIsActive) map.set(key, item);
  }
  return Array.from(map.values());
};

const normalizeModulePage = (page = {}) => ({
  key: page.key,
  label: page.label,
  routeKey: page.routeKey || page.key,
  permissionKey: page.permissionKey || page.key,
  moduleKey: page.moduleKey || "hr",
  moduleLabel: page.moduleLabel || erpModuleLabels[page.moduleKey] || page.groupLabel || "",
  status: page.status || "active",
  actions: page.actions || ["can_view"],
  order: page.moduleKey === "hr" && CANONICAL_HR_PAGE_ORDER[page.key] ? CANONICAL_HR_PAGE_ORDER[page.key] : Number(page.order || 9999),
  icon: page.icon || "BriefcaseBusiness",
  isOfficialPage: page.isOfficialPage !== false,
  navGroupKey: page.navGroupKey || `${page.moduleKey || "hr"}_pages`,
  navGroupLabel: page.navGroupLabel || page.moduleLabel || erpModuleLabels[page.moduleKey] || "الصفحات",
  navGroupOrder: Number(page.navGroupOrder || page.order || 9999),
  navItemOrder: Number(page.navItemOrder || page.order || 9999),
  navLabel: page.navLabel || page.label,
  canonical: page.canonical !== false,
  alias: page.alias === true || page.status === "alias",
  hiddenFromNavigation: page.hiddenFromNavigation === true,
});

const modulePages = pageRegistry
  .filter((page) => ERP_MODULE_DEFINITIONS.some((module) => module.key === page.moduleKey))
  .filter((page) => page.moduleKey !== "hr" || CANONICAL_HR_PAGE_KEY_SET.has(page.key))
  .map(normalizeModulePage);

export const ERP_MODULES = ERP_MODULE_DEFINITIONS.map((module) => ({
  ...module,
  pages: dedupeByKey(modulePages
    .filter((page) => page.moduleKey === module.key)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0)), (page) => page.key),
}));

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

export const buildGroupedNavigation = (pages = []) => {
  const groups = new Map();
  for (const page of pages || []) {
    if (!page?.key || page.hiddenFromNavigation || page.alias || page.canonical === false || page.status === "alias") continue;
    const groupKey = page.navGroupKey || `${page.moduleKey || "module"}_pages`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        label: page.navGroupLabel || page.moduleLabel || "الصفحات",
        order: Number(page.navGroupOrder || 9999),
        pages: [],
      });
    }
    groups.get(groupKey).pages.push(page);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      pages: group.pages.sort((a, b) => Number(a.navItemOrder || a.order || 0) - Number(b.navItemOrder || b.order || 0)),
    }))
    .filter((group) => group.pages.length > 0)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
};
