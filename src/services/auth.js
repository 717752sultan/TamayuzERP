import { supabase } from "./supabase";
import { normalizeCompany, normalizeTenantUser, setTenantSession } from "./tenant";

export const normalizeCloudUser = (raw = {}, fallbackUsername = "") => {
  const source = Array.isArray(raw) ? raw[0] || {} : raw;
  const user = source.user || source;
  const metadata = user.user_metadata || user.raw_user_meta_data || {};
  return {
    user_id: source.user_id || source.id || user.id || fallbackUsername,
    name: source.name || source.employee_name || user.name || metadata.name || metadata.full_name || fallbackUsername,
    username: source.username || user.username || user.email || fallbackUsername,
    role: source.role || source.permission || metadata.role || metadata.permission || "الموظف",
    employeeId: source.employee_id || source.employeeId || metadata.employee_id || metadata.employeeId || "",
    employee_id: source.employee_id || source.employeeId || metadata.employee_id || metadata.employeeId || "",
    branch: source.branch || metadata.branch || "",
    job: source.job || metadata.job || "",
    phone: source.phone || metadata.phone || "",
    company_id: source.company_id || metadata.company_id || "",
    company_code: source.company_code || metadata.company_code || "",
    company_name: source.company_name || metadata.company_name || "",
    logo_url: source.logo_url || metadata.logo_url || "",
    primary_color: source.primary_color || metadata.primary_color || "#7f1d1d",
    is_platform_admin: source.is_platform_admin === true || metadata.is_platform_admin === true,
    cloudId: source.id || user.id || "",
    email: user.email || source.email || "",
  };
};

const activeSubscription = (status = "") => {
  const normalized = String(status || "").toLowerCase();
  return ["active", "trial", "نشط", "تجريبي"].includes(normalized) || ["نشط", "تجريبي"].includes(status);
};

export async function loginWithSupabase(username, password, employeeNumber = "", companyCode = "PUREMONEY") {
  if (!companyCode?.trim()) throw new Error("يجب إدخال كود الشركة");

  const companyRows = await supabase.select(
    "companies",
    `company_code=eq.${encodeURIComponent(companyCode.trim().toUpperCase())}&select=*&limit=1`
  );
  const company = normalizeCompany(companyRows?.[0] || {});
  if (!company.company_id) throw new Error("الشركة غير موجودة");
  if (!company.is_active) throw new Error("هذه الشركة غير مفعلة، يرجى التواصل مع إدارة النظام");
  if (!activeSubscription(company.subscription_status)) throw new Error("اشتراك الشركة غير نشط، يرجى التواصل مع إدارة النظام");

  const employeeFilter = employeeNumber ? `&employee_id=eq.${encodeURIComponent(employeeNumber)}` : "";
  const userRows = await supabase.select(
    "app_users",
    `company_id=eq.${encodeURIComponent(company.company_id)}&username=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(password)}&is_active=eq.true${employeeFilter}&select=*&limit=1`
  );
  if (userRows?.[0]) {
    const user = normalizeTenantUser(userRows[0], company);
    setTenantSession({ company, user });
    return user;
  }

  // Backward compatible fallback for existing installations that still expose verify_app_login.
  const rpcData = await supabase.rpc("verify_app_login", {
    p_username: username,
    p_password: password,
    p_employee_id: employeeNumber,
  }).catch(() => null);
  if (rpcData && (!Array.isArray(rpcData) || rpcData.length)) {
    const user = normalizeTenantUser(
      { ...normalizeCloudUser(rpcData, username), company_id: company.company_id, company_code: company.company_code },
      company
    );
    setTenantSession({ company, user });
    return user;
  }

  throw new Error("بيانات الدخول غير صحيحة");
}
