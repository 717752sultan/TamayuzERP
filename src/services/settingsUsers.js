import { supabase } from "./supabase";
import { getCurrentCompany, isPlatformAdminUser, isProtectedPlatformRole, isProtectedPlatformUser } from "./tenant";
import { normalizeRoleName } from "./roles";

const requireCompany = (companyId) => {
  const id = String(companyId || "").trim();
  if (!id) throw new Error("لم يتم تحديد الشركة الحالية");
  return id;
};

export const settingsUserFromDb = (row = {}) => ({
  id: row.user_id || row.id || row.username || "",
  user_id: row.user_id || row.id || row.username || "",
  company_id: row.company_id || "",
  company_code: String(row.company_code || "").trim().toUpperCase(),
  name: row.name || row.employee_name || row.username || "",
  username: row.username || "",
  password: "",
  role: normalizeRoleName(row.role || "الموظف"),
  employee_id: row.employee_id || "",
  employee_name: row.employee_name || row.name || "",
  branch: row.branch || "",
  job: row.job || "",
  phone: row.phone || "",
  email: row.email || "",
  is_active: row.is_active !== false,
  is_platform_admin: row.is_platform_admin === true,
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const userToDb = (companyId, companyCode, user = {}) => ({
  user_id: String(user.user_id || user.id || `USR-${Date.now()}`).trim(),
  company_id: requireCompany(companyId),
  company_code: String(companyCode || companyId).trim().toUpperCase(),
  name: String(user.name || user.employee_name || user.username || "").trim(),
  username: String(user.username || "").trim(),
  password: user.password === undefined ? undefined : String(user.password || "").trim(),
  role: normalizeRoleName(user.role || ""),
  employee_id: String(user.employee_id || user.employeeId || "").trim(),
  employee_name: String(user.employee_name || user.name || "").trim(),
  branch: String(user.branch || "").trim(),
  job: String(user.job || "").trim(),
  phone: String(user.phone || "").trim(),
  email: user.email ? String(user.email).trim() : null,
  is_active: user.is_active !== false,
  is_platform_admin: false,
  updated_at: new Date().toISOString(),
});

const assertUser = (payload, mode = "edit") => {
  if (!payload.username) throw new Error("اسم المستخدم مطلوب");
  if (!payload.role || payload.role === "غير محدد") throw new Error("الدور مطلوب");
  if (mode === "add" && !payload.password) throw new Error("كلمة المرور مطلوبة عند إنشاء مستخدم جديد.");
};

export const settingsUsersService = {
  async loadUsers(companyId) {
    try {
      requireCompany(companyId);
      const rows = await supabase.select("app_users", `company_id=eq.${encodeURIComponent(companyId)}&is_platform_admin=eq.false&select=*&order=username.asc`);
      return (rows || []).map(settingsUserFromDb).filter((row) => !isProtectedPlatformUser(row));
    } catch (error) {
      console.error("Settings CRUD error:", error);
      throw new Error("تعذر تحميل المستخدمين: " + error.message);
    }
  },

  async saveUser(companyId, user, mode = "edit") {
    try {
      const id = requireCompany(companyId);
      const selectedCompany = getCurrentCompany() || {};
      let companyCode = String(
        user.company_code || (selectedCompany.company_id === id ? selectedCompany.company_code : "") || "",
      ).trim().toUpperCase();
      if (!companyCode) {
        const companyRows = await supabase.select(
          "companies",
          `company_id=eq.${encodeURIComponent(id)}&select=company_id,company_code&limit=1`,
        );
        companyCode = String(companyRows?.[0]?.company_code || id).trim().toUpperCase();
      }
      const payload = userToDb(id, companyCode, user);
      assertUser(payload, mode);
      if (isProtectedPlatformUser(payload)) {
        if (isProtectedPlatformRole(payload.role)) {
          throw new Error("لا يمكن تعيين هذا الدور من داخل إعدادات الشركة");
        }
        throw new Error("هذا المستخدم محمي ولا يمكن تعديله من إعدادات الشركة");
      }
      if (mode !== "add") {
        const targetRows = await supabase.select(
          "app_users",
          `user_id=eq.${encodeURIComponent(payload.user_id)}&select=id,is_platform_admin&limit=1`,
        );
        if (targetRows?.[0]?.is_platform_admin === true) {
          throw new Error("حساب مشرف المنصة محمي ولا يمكن تعديله من إعدادات الشركة");
        }
      }
      const isCreate = mode === "add";
      if (isCreate && !String(payload.password || "").trim()) throw new Error("كلمة المرور مطلوبة عند إنشاء مستخدم جديد.");
      if (!isCreate && !String(payload.password || "").trim()) delete payload.password;
      console.error("app_users write debug", { mode: isCreate ? "create" : "edit", payloadKeys: Object.keys(payload), username: payload.username, hasPassword: Boolean(payload.password), role: payload.role });
      const { data, error } = await supabase.from("app_users").upsert(payload, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      return settingsUserFromDb(data);
    } catch (error) {
      console.error("Settings CRUD error:", error);
      if (String(error.message || "").toLowerCase().includes("duplicate")) throw new Error("اسم المستخدم مستخدم مسبقا، استخدم اسم مستخدم مختلف.");
      if (error.message === "كلمة المرور مطلوبة عند إنشاء مستخدم جديد.") throw error;
      throw new Error("تعذر حفظ المستخدم: " + error.message);
    }
  },

  async createUser(companyId, user) {
    return this.saveUser(companyId, user, "add");
  },

  async updateUser(companyId, userId, user) {
    return this.saveUser(companyId, { ...user, user_id: userId || user.user_id || user.id }, "edit");
  },

  async toggleUserStatus(companyId, userId, isActive, user = {}) {
    const id = String(userId || "").trim();
    if (!id) throw new Error("لم يتم تحديد المستخدم");
    const companyFilter = isPlatformAdminUser() ? "" : `&company_id=eq.${encodeURIComponent(requireCompany(companyId))}`;
    const payload = { is_active: Boolean(isActive), updated_at: new Date().toISOString() };
    console.error("app_users write debug", { mode: "status", payloadKeys: Object.keys(payload), username: user?.username, hasPassword: false, role: user?.role });
    await supabase.request(`/rest/v1/app_users?user_id=eq.${encodeURIComponent(id)}&is_platform_admin=eq.false${companyFilter}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify(payload) });
    return { user_id: id, ...payload };
  },

  async resetUserPassword(companyId, userId, newPassword) {
    const id = String(userId || "").trim();
    const password = String(newPassword || "").trim();
    if (!id) throw new Error("لم يتم تحديد المستخدم");
    if (!password) throw new Error("يجب إدخال كلمة المرور الجديدة");
    const companyFilter = isPlatformAdminUser() ? "" : `&company_id=eq.${encodeURIComponent(requireCompany(companyId))}`;
    await supabase.request(`/rest/v1/app_users?user_id=eq.${encodeURIComponent(id)}&is_platform_admin=eq.false${companyFilter}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ password, password_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
    });
    return { user_id: id };
  },

  async deleteUser(companyId, userId, user = {}) {
    if (isProtectedPlatformUser(user)) throw new Error("هذا المستخدم محمي ولا يمكن تعديله من إعدادات الشركة");
    return this.toggleUserStatus(companyId, userId, false, user);
  },
};
