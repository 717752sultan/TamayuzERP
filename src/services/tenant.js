const TENANT_SESSION_KEY = "hrms_tenant_session";

const tenantSessionStorages = () => [
  typeof localStorage !== "undefined" ? localStorage : null,
  typeof sessionStorage !== "undefined" ? sessionStorage : null,
].filter(Boolean);

let tenantState = {
  currentCompany: null,
  currentUser: null,
};

export const platformSuperAdminRole = "مدير عام النظام";
export const PROTECTED_PLATFORM_ROLES = ["مشرف النظام العام", "Platform Admin", "platform_admin"];
export const PROTECTED_PLATFORM_USERNAMES = ["platform"];

export const isProtectedPlatformRole = (role = "") => PROTECTED_PLATFORM_ROLES.includes(String(role || "").trim());
export const isProtectedPlatformUser = (user = {}) => {
  if (!user) return false;
  return user?.is_platform_admin === true || isProtectedPlatformRole(user.role) || String(user.username || "").trim().toLowerCase() === "platform";
};

export const isPlatformAdminUser = (user = tenantState.currentUser) =>
  user?.is_platform_admin === true ||
  user?.role === "مشرف النظام العام" ||
  String(user?.username || "").trim().toLowerCase() === "platform";

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
  return ({
  user_id: row.user_id || row.id || row.username || "",
  id: row.id || row.user_id || row.username || "",
  name: row.name || row.employee_name || row.username || "",
  username: row.username || "",
  role: row.role || "الموظف",
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
  });
};

export const setTenantSession = ({ company, user }) => {
  tenantState = {
    currentCompany: company ? normalizeCompany(company) : null,
    currentUser: user ? normalizeTenantUser(user, company || {}) : null,
  };
  tenantSessionStorages().forEach((storage) => {
    try {
      storage.setItem(TENANT_SESSION_KEY, JSON.stringify(tenantState));
    } catch {
      // Auth-session storage may be unavailable in restricted browsers.
    }
  });
  return tenantState;
};

export const loadTenantSession = () => {
  try {
    const stored = tenantSessionStorages()
      .map((storage) => {
        try { return storage.getItem(TENANT_SESSION_KEY); } catch { return ""; }
      })
      .find(Boolean);
    const parsed = JSON.parse(stored || "{}");
    if (parsed.currentCompany || parsed.currentUser) {
      tenantState = {
        currentCompany: parsed.currentCompany ? normalizeCompany(parsed.currentCompany) : null,
        currentUser: parsed.currentUser ? normalizeTenantUser(parsed.currentUser, parsed.currentCompany || {}) : null,
      };
    }
  } catch {
    tenantState = { currentCompany: null, currentUser: null };
  }
  return tenantState;
};

export const clearTenantSession = () => {
  tenantState = { currentCompany: null, currentUser: null };
  tenantSessionStorages().forEach((storage) => {
    try { storage.removeItem(TENANT_SESSION_KEY); } catch { /* Ignore. */ }
  });
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
  "daily_operations",
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
]);
