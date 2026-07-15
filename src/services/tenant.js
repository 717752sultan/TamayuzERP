const TENANT_SESSION_KEY = "hrms_tenant_session";

let tenantState = {
  currentCompany: null,
  currentUser: null,
};

export const platformSuperAdminRole = "مدير عام النظام";

export const normalizeCompany = (row = {}) => ({
  company_id: row.company_id || row.id || "",
  company_code: String(row.company_code || "").trim().toUpperCase(),
  company_name: row.company_name || "",
  legal_name: row.legal_name || "",
  logo_url: row.logo_url || "",
  primary_color: row.primary_color || "#7f1d1d",
  secondary_color: row.secondary_color || "#374151",
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

export const normalizeTenantUser = (row = {}, company = {}) => ({
  user_id: row.user_id || row.id || row.username || "",
  id: row.user_id || row.id || row.username || "",
  name: row.name || row.employee_name || row.username || "",
  username: row.username || "",
  role: row.role || "الموظف",
  employeeId: row.employee_id || row.employeeId || "",
  employee_id: row.employee_id || row.employeeId || "",
  branch: row.branch || "",
  job: row.job || "",
  phone: row.phone || "",
  email: row.email || "",
  company_id: row.company_id || company.company_id || "",
  company_code: row.company_code || company.company_code || "",
  company_name: row.company_name || company.company_name || "",
  logo_url: row.logo_url || company.logo_url || "",
  primary_color: row.primary_color || company.primary_color || "#7f1d1d",
  is_platform_admin: row.is_platform_admin === true || row.role === platformSuperAdminRole,
  is_active: row.is_active !== false,
});

export const setTenantSession = ({ company, user }) => {
  tenantState = {
    currentCompany: company ? normalizeCompany(company) : null,
    currentUser: user ? normalizeTenantUser(user, company || {}) : null,
  };
  try {
    sessionStorage.setItem(TENANT_SESSION_KEY, JSON.stringify(tenantState));
  } catch {
    // Session storage may be unavailable in restricted browsers.
  }
  return tenantState;
};

export const loadTenantSession = () => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(TENANT_SESSION_KEY) || "{}");
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
  try {
    sessionStorage.removeItem(TENANT_SESSION_KEY);
  } catch {
    // Ignore.
  }
};

export const getCurrentTenant = () => tenantState;
export const getCurrentCompany = () => tenantState.currentCompany;
export const getCurrentUser = () => tenantState.currentUser;
export const getCurrentCompanyId = () => tenantState.currentCompany?.company_id || tenantState.currentUser?.company_id || "";
export const getCurrentCompanyCode = () => tenantState.currentCompany?.company_code || tenantState.currentUser?.company_code || "";
export const isPlatformAdmin = () => tenantState.currentUser?.is_platform_admin === true;

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
  "branches",
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
  "system_backups",
  "hrms_settings",
  "hrms_snapshots",
]);
