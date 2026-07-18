import { erpModuleLabels, pageRegistry } from "./pageRegistry";

const ERP_MODULE_DEFINITIONS = [
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
];

const normalizeModulePage = (page = {}) => ({
  key: page.key,
  label: page.label,
  routeKey: page.routeKey || page.key,
  permissionKey: page.permissionKey || page.key,
  moduleKey: page.moduleKey || "hr",
  moduleLabel: page.moduleLabel || erpModuleLabels[page.moduleKey] || page.groupLabel || "",
  status: page.status || "active",
  actions: page.actions || ["can_view"],
  order: Number(page.order || 9999),
  icon: page.icon || "BriefcaseBusiness",
  isOfficialPage: page.isOfficialPage !== false,
});

const modulePages = pageRegistry
  .filter((page) => ERP_MODULE_DEFINITIONS.some((module) => module.key === page.moduleKey))
  .map(normalizeModulePage);

export const ERP_MODULES = ERP_MODULE_DEFINITIONS.map((module) => ({
  ...module,
  pages: modulePages
    .filter((page) => page.moduleKey === module.key)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0)),
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
