import { supabase } from "./supabase";
import { companiesService } from "./companies";
import { isPlatformAdminUser } from "./tenant";
import { ERP_MODULES, ERP_PAGE_BY_KEY } from "../constants/moduleRegistry";

const PLAN_LABELS = {
  trial: "تجريبية",
  hr_only: "الموارد البشرية فقط",
  sales_only: "المبيعات فقط",
  inventory_only: "المخزون فقط",
  basic: "أساسية",
  professional: "احترافية",
  enterprise: "مؤسسية",
  custom: "مخصصة",
};

const MODULE_PLAN_MAP = {
  trial: ["dashboard", "hr", "system"],
  hr_only: ["dashboard", "hr", "system"],
  sales_only: ["dashboard", "sales", "system"],
  inventory_only: ["dashboard", "inventory", "system"],
  basic: ["dashboard", "hr", "sales", "system"],
  professional: ["dashboard", "hr", "sales", "inventory", "purchasing", "system"],
  enterprise: ERP_MODULES.map((module) => module.key),
  custom: ["dashboard", "system"],
};

const PLAN_LIMITS = {
  trial: { max_users: 5, max_branches: 1 },
  hr_only: { max_users: 15, max_branches: 2 },
  sales_only: { max_users: 15, max_branches: 2 },
  inventory_only: { max_users: 15, max_branches: 2 },
  basic: { max_users: 25, max_branches: 3 },
  professional: { max_users: 50, max_branches: 5 },
  enterprise: { max_users: 999, max_branches: 99 },
  custom: { max_users: 25, max_branches: 5 },
};

const normalizeEntitlement = (row = {}) => {
  const moduleKey = String(row.module_key || row.moduleKey || "").trim();
  const pageKey = String(row.page_key || row.pageKey || row.page || "").trim();
  const entitlementKey = String(row.entitlement_key || row.entitlementKey || row.key || row.entitlement || "").trim();
  return {
    id: row.id || row.entitlement_id || null,
    company_id: String(row.company_id || "").trim(),
    entitlement_key: entitlementKey,
    entitlement_label: String(row.entitlement_label || row.label || entitlementKey || "").trim(),
    module_key: moduleKey,
    page_key: pageKey,
    feature_key: String(row.feature_key || row.featureKey || "").trim(),
    is_enabled: row.is_enabled !== false,
    source_plan: String(row.source_plan || row.plan || "custom").trim(),
    limit_value: row.limit_value !== undefined ? Number(row.limit_value) : null,
    limit_unit: String(row.limit_unit || row.limitUnit || "").trim(),
    metadata: row.metadata || row.meta || {},
    created_by: String(row.created_by || row.createdBy || "").trim(),
    updated_by: String(row.updated_by || row.updatedBy || "").trim(),
    created_at: row.created_at || row.createdAt || new Date().toISOString(),
    updated_at: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
};

const makeModuleEntitlement = (companyId, moduleKey, planKey) => ({
  company_id: companyId,
  entitlement_key: `module:${moduleKey}`,
  entitlement_label: `وحدة ${moduleKey}`,
  module_key: moduleKey,
  page_key: "",
  feature_key: "",
  is_enabled: true,
  source_plan: planKey,
  metadata: {},
});

const makeLimitEntitlement = (companyId, limitKey, limitValue, planKey) => ({
  company_id: companyId,
  entitlement_key: `limit:${limitKey}`,
  entitlement_label: limitKey === "max_users" ? "الحد الأقصى للمستخدمين" : "الحد الأقصى للفروع",
  module_key: "",
  page_key: "",
  feature_key: limitKey,
  is_enabled: true,
  source_plan: planKey,
  limit_value: Number(limitValue || 0),
  limit_unit: "count",
  metadata: {},
});

const getModuleRowsForPlan = (companyId, planKey) => {
  const moduleKeys = MODULE_PLAN_MAP[planKey] || MODULE_PLAN_MAP.custom;
  return moduleKeys.map((moduleKey) => makeModuleEntitlement(companyId, moduleKey, planKey));
};

export const getDefaultEntitlementsForPlan = (planKey = "custom", companyId = "") => {
  const moduleRows = getModuleRowsForPlan(companyId, planKey);
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.custom;
  return [
    ...moduleRows,
    makeLimitEntitlement(companyId, "max_users", limits.max_users, planKey),
    makeLimitEntitlement(companyId, "max_branches", limits.max_branches, planKey),
  ];
};

export const planLabels = PLAN_LABELS;

const getModuleEnabledMap = (rows = []) => {
  const map = new Map();
  (rows || []).forEach((row) => {
    if (!row || !row.entitlement_key) return;
    if (row.entitlement_key.startsWith("module:")) {
      const moduleKey = row.entitlement_key.split(":")[1];
      map.set(moduleKey, row.is_enabled !== false);
    }
  });
  return map;
};

const getPageEnabledMap = (rows = []) => {
  const map = new Map();
  (rows || []).forEach((row) => {
    if (!row || !row.entitlement_key) return;
    if (row.entitlement_key.startsWith("page:")) {
      const pageKey = row.entitlement_key.split(":")[1];
      map.set(pageKey, row.is_enabled !== false);
    }
  });
  return map;
};

const getLimitValue = (rows = [], limitKey) => {
  const row = (rows || []).find((item) => item.entitlement_key === `limit:${limitKey}`);
  return row ? Number(row.limit_value || 0) : null;
};

export const loadCompanyEntitlements = async (companyId) => {
  if (!companyId) return [];
  try {
    const rows = await supabase.select("company_entitlements", `company_id=eq.${encodeURIComponent(companyId)}&select=*&order=entitlement_key.asc`);
    return (rows || []).map(normalizeEntitlement);
  } catch (error) {
    console.error("Company entitlements load error:", error);
    throw new Error("فشل تحميل اشتراكات الشركة: " + error.message);
  }
};

export const saveCompanyEntitlements = async (companyId, rows = [], currentUser = {}) => {
  if (!isPlatformAdminUser(currentUser)) throw new Error("لا تملك صلاحية حفظ إعدادات الاشتراك");
  if (!companyId) throw new Error("يجب اختيار الشركة أولاً");
  try {
    const normalized = (rows || []).map((row) => normalizeEntitlement({ ...row, company_id: companyId, updated_by: currentUser.username || currentUser.user_id || "" }));
    const safeRows = normalized.map((row) => {
      const { id, ...rest } = row;
      return {
        ...rest,
        updated_at: new Date().toISOString(),
      };
    });
    const { data, error } = await supabase.from("company_entitlements").upsert(safeRows, { onConflict: "company_id,entitlement_key" }).select();
    if (error) throw error;
    return (data || []).map(normalizeEntitlement);
  } catch (error) {
    console.error("Company entitlements save error:", error);
    throw new Error("فشل حفظ صلاحيات الاشتراك: " + error.message);
  }
};

export const applySubscriptionPlan = async (companyId, planKey, currentUser = {}) => {
  if (!isPlatformAdminUser(currentUser)) throw new Error("لا تملك صلاحية حفظ إعدادات الاشتراك");
  if (!companyId) throw new Error("يجب اختيار الشركة أولاً");
  const planDefaults = PLAN_LIMITS[planKey] || PLAN_LIMITS.custom;
  const rows = getDefaultEntitlementsForPlan(planKey, companyId);
  const results = await saveCompanyEntitlements(companyId, rows, currentUser);
  await companiesService.saveCompany({
    company_id: companyId,
    subscription_plan: planKey,
    subscription_status: planKey === "trial" ? "active" : "active",
    max_users: planDefaults.max_users,
    max_branches: planDefaults.max_branches,
  });
  return results;
};

export const isCompanyModuleEnabled = (companyId, moduleKey, entitlements = []) => {
  if (!companyId) return false;
  const enabledMap = getModuleEnabledMap(entitlements || []);
  if (enabledMap.has(moduleKey)) return enabledMap.get(moduleKey);
  const anyPage = Object.values(ERP_PAGE_BY_KEY).some((page) => page.parentModule === moduleKey && (entitlements || []).some((row) => row.entitlement_key === `page:${page.key}` && row.is_enabled));
  return anyPage;
};

export const isCompanyPageEnabled = (companyId, pageKey, entitlements = []) => {
  if (!companyId || !pageKey) return false;
  const pageMeta = ERP_PAGE_BY_KEY[pageKey];
  const moduleKey = pageMeta?.parentModule || (pageMeta?.moduleKey || "");
  const moduleEnabled = isCompanyModuleEnabled(companyId, moduleKey, entitlements);
  if (!moduleEnabled) return false;
  const pageEnabledMap = getPageEnabledMap(entitlements || []);
  if (pageEnabledMap.has(pageKey)) return pageEnabledMap.get(pageKey);
  return moduleEnabled;
};

export const filterModulesByCompanyEntitlements = (modules = [], entitlements = [], currentUser = {}) => {
  if (isPlatformAdminUser(currentUser)) return modules;
  return (modules || []).filter((module) => isCompanyModuleEnabled(module.company_id || "", module.key, entitlements));
};

export const filterPagesByCompanyEntitlements = (pages = [], entitlements = [], currentUser = {}) => {
  if (isPlatformAdminUser(currentUser)) return pages;
  return (pages || []).filter((page) => isCompanyPageEnabled(page.company_id || "", page.key, entitlements));
};

export const getPlanLabel = (planKey = "") => PLAN_LABELS[planKey] || planKey;

export const getLimitForCompany = (companyId, entitlements = [], limitKey) => {
  if (!companyId) return null;
  return getLimitValue(entitlements, limitKey);
};

export const companyEntitlementsService = {
  loadCompanyEntitlements,
  saveCompanyEntitlements,
  applySubscriptionPlan,
  isCompanyModuleEnabled,
  isCompanyPageEnabled,
  filterModulesByCompanyEntitlements,
  filterPagesByCompanyEntitlements,
  getDefaultEntitlementsForPlan,
  getPlanLabel,
  getLimitForCompany,
};
