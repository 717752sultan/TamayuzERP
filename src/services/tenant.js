import { normalizeRoleName } from "./roles";

const LEGACY_TENANT_SESSION_KEY = "hrms_tenant_session";
export const COMPANY_USER_SESSION_KEY = "tamyuz_company_user";
export const COMPANY_CONTEXT_SESSION_KEY = "tamyuz_company";
export const COMPANY_SESSION_KEY = "tamyuz_company_session";
export const COMPANY_LAST_PAGE_KEY = "tamyuz_company_last_page";
export const PLATFORM_USER_SESSION_KEY = "tamyuz_platform_user";
export const PLATFORM_SESSION_KEY = "tamyuz_platform_session";
export const PLATFORM_LAST_PAGE_KEY = "tamyuz_platform_last_page";
export const ACTIVE_PORTAL_TYPE_KEY = "tamyuz_active_portal_type";

const tenantSessionStorages = () => [
  typeof localStorage !== "undefined" ? localStorage : null,
  typeof sessionStorage !== "undefined" ? sessionStorage : null,
].filter(Boolean);

let tenantState = {
  currentCompany: null,
  currentUser: null,
};

export const platformSuperAdminRole = "مدير عام النظام";
export const PROTECTED_PLATFORM_ROLES = ["مشرف النظام العام", "مدير عام النظام", "Platform Admin", "platform_admin"];
export const PROTECTED_PLATFORM_USERNAMES = ["platform"];

export const isProtectedPlatformRole = (role = "") => PROTECTED_PLATFORM_ROLES.includes(String(role || "").trim()) || PROTECTED_PLATFORM_ROLES.includes(normalizeRoleName(role));
export const isProtectedPlatformUser = (user = {}) => {
  if (!user) return false;
  return user?.is_platform_admin === true
    || isProtectedPlatformRole(user.role)
    || String(user.username || "").trim().toLowerCase() === "platform";
};

export const isPlatformAdminUser = (user = tenantState.currentUser) =>
  user?.is_platform_admin === true
  || normalizeRoleName(user?.role) === "مشرف النظام العام"
  || user?.role === "مدير عام النظام"
  || String(user?.username || "").trim().toLowerCase() === "platform";

const safeJsonParse = (value, fallback = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const readFirstStorageValue = (key) => {
  for (const storage of tenantSessionStorages()) {
    try {
      const value = storage.getItem(key);
      if (value) return value;
    } catch {
      // Storage may be unavailable in restricted browsers.
    }
  }
  return "";
};

const writeAllStorages = (key, value) => {
  tenantSessionStorages().forEach((storage) => {
    try { storage.setItem(key, value); } catch { /* Ignore unavailable storage. */ }
  });
};

const removeAllStorages = (keys = []) => {
  tenantSessionStorages().forEach((storage) => {
    keys.forEach((key) => {
      try { storage.removeItem(key); } catch { /* Ignore unavailable storage. */ }
    });
  });
};

export const isPlatformRoute = (pathname = (typeof window !== "undefined" ? window.location.pathname : "")) =>
  ["/platform-login", "/admin-platform-login", "/platform"].some((route) => String(pathname || "").startsWith(route));

export const isCompanyRoute = (pathname = (typeof window !== "undefined" ? window.location.pathname : "")) => !isPlatformRoute(pathname);

export const normalizeCompany = (row = {}) => ({
  company_id: row.company_id || row.id || "",
  company_code: String(row.company_code || "").trim().toUpperCase(),
  company_name: row.company_name || "",
  legal_name: row.legal_name || "",
  logo_url: row.logo_url || "",
  primary_color: row.primary_color || "#7f1d1d",
  secondary_color: row.secondary_color || "#374151",
  accent_color: row.accent_color || "#991b1b",
  sidebar_bg_color: row.sidebar_bg_color || "#111827",
  sidebar_text_color: row.sidebar_text_color || "#ffffff",
  button_color: row.button_color || row.primary_color || "#991b1b",
  button_text_color: row.button_text_color || "#ffffff",
  card_accent_color: row.card_accent_color || "#fee2e2",
  table_header_color: row.table_header_color || "#f8fafc",
  report_header_color: row.report_header_color || row.primary_color || "#8b1e1e",
  theme_mode: row.theme_mode || "light",
  theme_name: row.theme_name || "default",
  address: row.address || "",
  phone: row.phone || "",
  email: row.email || "",
  website: row.website || "",
  tax_number: row.tax_number || "",
  commercial_register: row.commercial_register || "",
  subscription_plan: row.subscription_plan || "standard",
  subscription_status: row.subscription_status || "active",
  max_users: Number(row.max_users || 25),
  max_branches: Number(row.max_branches || 5),
  is_active: row.is_active !== false,
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

export const normalizeTenantUser = (row = {}, company = {}) => {
  const platformAdmin = isPlatformAdminUser(row);
  const inheritCompanyContext = !platformAdmin;
  return {
    user_id: row.user_id || row.id || row.username || "",
    id: row.id || row.user_id || row.username || "",
    name: row.name || row.employee_name || row.username || "",
    username: row.username || "",
    role: normalizeRoleName(row.role || "الموظف"),
    employeeId: row.employee_id || row.employeeId || "",
    employee_id: row.employee_id || row.employeeId || "",
    branch: row.branch || "",
    job: row.job || "",
    phone: row.phone || "",
    email: row.email || "",
    company_id: row.company_id || (inheritCompanyContext ? company.company_id : "") || "",
    company_code: row.company_code || (inheritCompanyContext ? company.company_code : "") || "",
    company_name: row.company_name || (inheritCompanyContext ? company.company_name : "") || "",
    logo_url: row.logo_url || (inheritCompanyContext ? company.logo_url : "") || "",
    primary_color: row.primary_color || (inheritCompanyContext ? company.primary_color : "") || "#7f1d1d",
    secondary_color: row.secondary_color || (inheritCompanyContext ? company.secondary_color : "") || "#374151",
    accent_color: row.accent_color || (inheritCompanyContext ? company.accent_color : "") || "#991b1b",
    sidebar_bg_color: row.sidebar_bg_color || (inheritCompanyContext ? company.sidebar_bg_color : "") || "#111827",
    sidebar_text_color: row.sidebar_text_color || (inheritCompanyContext ? company.sidebar_text_color : "") || "#ffffff",
    button_color: row.button_color || (inheritCompanyContext ? company.button_color : "") || row.primary_color || (inheritCompanyContext ? company.primary_color : "") || "#991b1b",
    button_text_color: row.button_text_color || (inheritCompanyContext ? company.button_text_color : "") || "#ffffff",
    card_accent_color: row.card_accent_color || (inheritCompanyContext ? company.card_accent_color : "") || "#fee2e2",
    table_header_color: row.table_header_color || (inheritCompanyContext ? company.table_header_color : "") || "#f8fafc",
    report_header_color: row.report_header_color || (inheritCompanyContext ? company.report_header_color : "") || row.primary_color || (inheritCompanyContext ? company.primary_color : "") || "#8b1e1e",
    theme_mode: row.theme_mode || (inheritCompanyContext ? company.theme_mode : "") || "light",
    theme_name: row.theme_name || (inheritCompanyContext ? company.theme_name : "") || "default",
    is_platform_admin: platformAdmin,
    is_active: row.is_active !== false,
  };
};

export const setCompanySession = (user, company = null) => {
  const normalizedCompany = company ? normalizeCompany(company) : null;
  const normalizedUser = user ? normalizeTenantUser({ ...user, is_platform_admin: false }, normalizedCompany || {}) : null;
  tenantState = { currentCompany: normalizedCompany, currentUser: normalizedUser };
  writeAllStorages(COMPANY_USER_SESSION_KEY, JSON.stringify(normalizedUser));
  writeAllStorages(COMPANY_CONTEXT_SESSION_KEY, JSON.stringify(normalizedCompany));
  writeAllStorages(COMPANY_SESSION_KEY, JSON.stringify(tenantState));
  writeAllStorages(ACTIVE_PORTAL_TYPE_KEY, "company");
  removeAllStorages([LEGACY_TENANT_SESSION_KEY]);
  return tenantState;
};

export const getCompanySession = () => {
  const session = safeJsonParse(readFirstStorageValue(COMPANY_SESSION_KEY), null);
  const storedUser = safeJsonParse(readFirstStorageValue(COMPANY_USER_SESSION_KEY), null);
  const storedCompany = safeJsonParse(readFirstStorageValue(COMPANY_CONTEXT_SESSION_KEY), null);
  const company = session?.currentCompany || storedCompany;
  const user = session?.currentUser || storedUser;
  if (!user || isPlatformAdminUser(user)) return { currentCompany: null, currentUser: null };
  return {
    currentCompany: company ? normalizeCompany(company) : null,
    currentUser: normalizeTenantUser({ ...user, is_platform_admin: false }, company || {}),
  };
};

export const clearCompanySession = () => {
  removeAllStorages([COMPANY_USER_SESSION_KEY, COMPANY_CONTEXT_SESSION_KEY, COMPANY_SESSION_KEY, COMPANY_LAST_PAGE_KEY]);
};

export const setPlatformSession = (user, selectedCompany = null) => {
  const normalizedUser = user ? normalizeTenantUser({ ...user, is_platform_admin: true }, {}) : null;
  const normalizedCompany = selectedCompany ? normalizeCompany(selectedCompany) : null;
  tenantState = { currentCompany: normalizedCompany, currentUser: normalizedUser };
  writeAllStorages(PLATFORM_USER_SESSION_KEY, JSON.stringify(normalizedUser));
  writeAllStorages(PLATFORM_SESSION_KEY, JSON.stringify(tenantState));
  writeAllStorages(ACTIVE_PORTAL_TYPE_KEY, "platform");
  removeAllStorages([LEGACY_TENANT_SESSION_KEY]);
  return tenantState;
};

export const getPlatformSession = () => {
  const session = safeJsonParse(readFirstStorageValue(PLATFORM_SESSION_KEY), null);
  const storedUser = safeJsonParse(readFirstStorageValue(PLATFORM_USER_SESSION_KEY), null);
  const user = session?.currentUser || storedUser;
  if (!user || !isPlatformAdminUser(user)) return { currentCompany: null, currentUser: null };
  return {
    currentCompany: session?.currentCompany ? normalizeCompany(session.currentCompany) : null,
    currentUser: normalizeTenantUser({ ...user, is_platform_admin: true }, {}),
  };
};

export const clearPlatformSession = () => {
  removeAllStorages([PLATFORM_USER_SESSION_KEY, PLATFORM_SESSION_KEY, PLATFORM_LAST_PAGE_KEY]);
};

export const clearAllSessions = () => {
  clearCompanySession();
  clearPlatformSession();
  removeAllStorages([ACTIVE_PORTAL_TYPE_KEY, LEGACY_TENANT_SESSION_KEY]);
  tenantState = { currentCompany: null, currentUser: null };
};

export const setTenantSession = ({ company, user, portalType }) => {
  const nextPortalType = portalType || (isPlatformAdminUser(user) ? "platform" : "company");
  return nextPortalType === "platform"
    ? setPlatformSession(user, company || null)
    : setCompanySession(user, company || null);
};

export const loadTenantSession = (portalType) => {
  const nextPortalType = portalType || (isPlatformRoute() ? "platform" : "company");
  tenantState = nextPortalType === "platform" ? getPlatformSession() : getCompanySession();
  return tenantState;
};

export const clearTenantSession = (portalType) => {
  const nextPortalType = portalType || (isPlatformRoute() ? "platform" : "company");
  if (nextPortalType === "platform") clearPlatformSession();
  else clearCompanySession();
  tenantState = { currentCompany: null, currentUser: null };
};

export const getCurrentTenant = () => tenantState;
export const getCurrentCompany = () => tenantState.currentCompany;
export const getCurrentUser = () => tenantState.currentUser;
export const getCurrentCompanyId = () => tenantState.currentCompany?.company_id || tenantState.currentUser?.company_id || "";
export const getCurrentCompanyCode = () => tenantState.currentCompany?.company_code || tenantState.currentUser?.company_code || "";
export const isPlatformAdmin = () => isPlatformAdminUser();

export const requireCompanyId = () => {
  const companyId = getCurrentCompanyId();
  if (!companyId) throw new Error("فشل تحميل بيانات الشركة");
  return companyId;
};

export const withCompanyId = (payload = {}) => ({
  ...payload,
  company_id: payload.company_id || requireCompanyId(),
});

export const tenantFilter = (query = "select=*") => {
  if (isPlatformAdmin()) return query;
  const companyId = requireCompanyId();
  if (String(query).includes("company_id=")) return query;
  return `${query}${String(query).includes("&") || String(query).includes("=") ? "&" : ""}company_id=eq.${encodeURIComponent(companyId)}`;
};

export const checkCompanyAccess = (record = {}) => {
  if (isPlatformAdmin()) return true;
  const companyId = getCurrentCompanyId();
  if (!record.company_id || record.company_id === companyId) return true;
  console.error("Company access error:", { recordCompanyId: record.company_id, currentCompanyId: companyId });
  throw new Error("لا تملك صلاحية الوصول إلى بيانات هذه الشركة");
};

export const getFirstAllowedPageForUser = (pages = []) => pages?.[0]?.[0] || pages?.[0]?.id || "dashboard";

export const tenantAwareTables = new Set([
  "employees",
  "employees_evaluations",
  "evaluations",
  "app_users",
  "app_roles",
  "app_permissions",
  "app_permission_nodes",
  "app_role_node_permissions",
  "company_permissions",
  "company_settings",
  "branches",
  "currencies",
  "performance_job_templates",
  "performance_kpi_criteria",
  "performance_kpi_scores",
  "kpi_criterion_types",
  "kpi_evaluation_methods",
  "daily_operations",
  "attendance_records",
  "attendance_work_periods",
  "attendance_requests",
  "attendance_locations",
  "employee_attendance_events",
  "employee_requests",
  "employee_request_attachments",
  "employee_notifications",
  "employee_device_registry",
  "employee_app_settings",
  "employee_app_permissions",
  "employee_app_request_types",
  "incentives",
  "guarantees",
  "employee_guarantees",
  "overtime_assignments",
  "overtime_assignment_employees",
  "shift_types",
  "shift_type_periods",
  "used_shifts",
  "shift_scenarios",
  "shift_scenario_details",
  "employee_shift_assignments",
  "inventory_items",
  "inventory_suppliers",
  "inventory_purchase_requests",
  "inventory_purchase_orders",
  "inventory_receipts",
  "inventory_purchase_invoices",
  "inventory_invoices",
  "inventory_issue_vouchers",
  "inventory_branch_issues",
  "inventory_issue_details",
  "inventory_return_vouchers",
  "inventory_branch_returns",
  "inventory_return_details",
  "inventory_transfer_vouchers",
  "inventory_transfers",
  "inventory_transfer_details",
  "inventory_adjustments",
  "inventory_stocktakes",
  "inventory_stocktake_details",
  "inventory_movements",
  "inventory_settings",
  "inventory_currency_settings",
  "inventory_document_numbering",
  "inventory_branch_settings",
  "inventory_document_details",
  "recruitment_job_postings",
  "recruitment_applications",
  "recruitment_candidate_evaluations",
  "recruitment_offer_templates",
  "recruitment_job_offers",
  "recruitment_contracts",
  "recruitment_manpower_plans",
  "recruitment_tests",
  "recruitment_test_results",
  "recruitment_probation_evaluations",
  "recruitment_welcome_messages",
  "notifications",
  "ai_chat_sessions",
  "ai_chat_messages",
  "audit_logs",
  "user_activity_logs",
  "system_backups",
  "hrms_settings",
  "hrms_snapshots",
  "fixed_asset_categories",
  "fixed_assets",
  "fixed_asset_custodies",
  "fixed_asset_transfers",
  "fixed_asset_maintenance",
  "fixed_asset_disposals",
  "fixed_asset_depreciation_entries",
]);
