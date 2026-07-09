import { supabase } from "./supabase";

export const normalizeCloudUser = (raw = {}, fallbackUsername = "") => {
  const source = Array.isArray(raw) ? raw[0] || {} : raw;
  const user = source.user || source;
  const metadata = user.user_metadata || user.raw_user_meta_data || {};
  return {
    name: source.name || user.name || metadata.name || metadata.full_name || fallbackUsername,
    username: source.username || user.username || user.email || fallbackUsername,
    role: source.role || source.permission || metadata.role || metadata.permission || "الموظف",
    employeeId: source.employee_id || source.employeeId || metadata.employee_id || metadata.employeeId || "",
    cloudId: source.id || user.id || "",
    email: user.email || source.email || "",
  };
};

export async function loginWithSupabase(username, password, employeeNumber) {
  const rpcData = await supabase.rpc("verify_app_login", {
    p_username: username,
    p_password: password,
    p_employee_id: employeeNumber,
  });
  if (rpcData && (!Array.isArray(rpcData) || rpcData.length)) {
    return normalizeCloudUser(rpcData, username);
  }
  throw new Error("اسم المستخدم أو كلمة المرور أو الرقم الوظيفي غير صحيح.");
}
