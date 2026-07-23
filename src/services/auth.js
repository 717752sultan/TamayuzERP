import { supabase } from "./supabase";
import { normalizeCompany, normalizeTenantUser, setTenantSession } from "./tenant";

export const normalizeCloudUser = (raw = {}, fallbackUsername = "") => {
  const source = Array.isArray(raw) ? raw[0] || {} : raw;
  const user = source.user || source;
  const metadata = user.user_metadata || user.raw_user_meta_data || {};
  const userId = source.id || source.user_id || user.id || fallbackUsername;
  const username = source.username || user.username || user.email || fallbackUsername;
  const role = source.role || source.permission || metadata.role || metadata.permission || "الموظف";
  const isPlatformAdmin =
    source.is_platform_admin === true ||
    metadata.is_platform_admin === true ||
    role === "مشرف النظام العام" ||
    String(username || "").trim().toLowerCase() === "platform";
  return {
    id: userId,
    user_id: userId,
    name: source.name || source.employee_name || user.name || metadata.name || metadata.full_name || fallbackUsername,
    username,
    role,
    employeeId: source.employee_id || source.employeeId || metadata.employee_id || metadata.employeeId || "",
    employee_id: source.employee_id || source.employeeId || metadata.employee_id || metadata.employeeId || "",
    branch: source.branch || metadata.branch || "",
    job: source.job || metadata.job || "",
    phone: source.phone || metadata.phone || "",
    company_id: source.company_id || metadata.company_id || "",
    company_code: String(source.company_code || metadata.company_code || "").trim().toUpperCase(),
    company_name: source.company_name || metadata.company_name || "",
    logo_url: source.logo_url || metadata.logo_url || "",
    primary_color: source.primary_color || metadata.primary_color || "#7f1d1d",
    is_platform_admin: isPlatformAdmin,
    is_active: source.is_active !== false,
    cloudId: source.id || user.id || "",
    email: user.email || source.email || "",
  };
};

const activeSubscription = (status = "") => {
  const normalized = String(status || "").toLowerCase();
  return ["active", "trial", "نشط", "تجريبي"].includes(normalized) || ["نشط", "تجريبي"].includes(status);
};

const extractVerifiedUser = (rpcData) => {
  const result = Array.isArray(rpcData) ? rpcData[0] || null : rpcData;
  if (!result) return null;
  if (result.success === false || result.valid === false || result.authenticated === false) {
    throw new Error(result.message || result.error || "بيانات الدخول غير صحيحة");
  }
  const isWrappedResult = Object.prototype.hasOwnProperty.call(result, "user")
    || Object.prototype.hasOwnProperty.call(result, "user_data")
    || Object.prototype.hasOwnProperty.call(result, "data");
  const payload = isWrappedResult ? (result.user || result.user_data || result.data || null) : result;
  if (Array.isArray(payload)) return payload[0] || null;
  return payload && typeof payload === "object" && Object.keys(payload).length ? payload : null;
};

export async function loginWithSupabase(username, password, employeeNumber = "", companyCode = "PUREMONEY") {
  const companyInput = String(companyCode || "").trim();
  let normalizedCompanyCode = companyInput.toUpperCase();
  const loginValue = String(employeeNumber || username || "").trim();
  if (!normalizedCompanyCode) throw new Error("يجب إدخال كود الشركة");
  if (!loginValue) throw new Error("يجب إدخال اسم المستخدم أو الرقم الوظيفي");

  const isPlatformLogin = normalizedCompanyCode === "PLATFORM";
  let company = null;

  if (!isPlatformLogin) {
    let companyRows = await supabase.select(
      "companies",
      `company_code=eq.${encodeURIComponent(normalizedCompanyCode)}&select=*&limit=1`,
    );
    if (!companyRows?.length) {
      companyRows = await supabase.select(
        "companies",
        `company_name=eq.${encodeURIComponent(companyInput)}&select=*&limit=1`,
      );
    }
    company = normalizeCompany(companyRows?.[0] || {});
    if (!company.company_id) throw new Error("الشركة غير موجودة");
    normalizedCompanyCode = company.company_code;
    if (!company.is_active) throw new Error("هذه الشركة غير مفعلة، يرجى التواصل مع إدارة النظام");
    if (!activeSubscription(company.subscription_status)) throw new Error("اشتراك الشركة غير نشط، يرجى التواصل مع إدارة النظام");
  }

  const rpcData = await supabase.rpc("verify_app_login", {
    p_company_code: normalizedCompanyCode,
    p_login: loginValue,
    p_password: password,
  });
  const verifiedUser = extractVerifiedUser(rpcData);
  if (!verifiedUser) throw new Error("بيانات الدخول غير صحيحة");

  const cloudUser = normalizeCloudUser(verifiedUser, loginValue);
  if (isPlatformLogin && !cloudUser.is_platform_admin) throw new Error("بيانات دخول مشرف المنصة غير صحيحة");
  if (!isPlatformLogin && cloudUser.is_platform_admin) throw new Error("لا يمكن دخول مشرف المنصة من مسار الشركات");
  if (!isPlatformLogin && cloudUser.company_code && cloudUser.company_code !== normalizedCompanyCode) {
    throw new Error("كود الشركة لا يطابق بيانات المستخدم");
  }

  const user = normalizeTenantUser(
    {
      ...verifiedUser,
      ...cloudUser,
      company_id: cloudUser.company_id || company?.company_id || "",
      company_code: cloudUser.company_code || company?.company_code || normalizedCompanyCode,
    },
    company || {},
  );
  setTenantSession({ company, user });
  return user;
}
