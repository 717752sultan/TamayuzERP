import { supabase } from "./supabase";

const requireCompany = (companyId) => {
  const id = String(companyId || "").trim();
  if (!id) throw new Error("لم يتم تحديد الشركة الحالية");
  return id;
};

export const settingsUserFromDb = (row = {}) => ({
  id: row.user_id || row.id || row.username || "",
  user_id: row.user_id || row.id || row.username || "",
  company_id: row.company_id || "",
  name: row.name || row.employee_name || row.username || "",
  username: row.username || "",
  password: row.password || "",
  role: row.role || "الموظف",
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

const userToDb = (companyId, user = {}) => ({
  user_id: String(user.user_id || user.id || `USR-${Date.now()}`).trim(),
  company_id: requireCompany(companyId),
  name: String(user.name || user.employee_name || user.username || "").trim(),
  username: String(user.username || "").trim(),
  password: user.password === undefined ? undefined : String(user.password || "").trim(),
  role: String(user.role || "").trim(),
  employee_id: String(user.employee_id || user.employeeId || "").trim(),
  employee_name: String(user.employee_name || user.name || "").trim(),
  branch: String(user.branch || "").trim(),
  job: String(user.job || "").trim(),
  phone: String(user.phone || "").trim(),
  email: user.email ? String(user.email).trim() : null,
  is_active: user.is_active !== false,
  is_platform_admin: user.is_platform_admin === true,
  updated_at: new Date().toISOString(),
});

const assertUser = (payload, mode = "edit") => {
  if (!payload.username) throw new Error("اسم المستخدم مطلوب");
  if (!payload.role) throw new Error("الدور مطلوب");
  if (mode === "add" && !payload.password) throw new Error("كلمة المرور مطلوبة عند الإنشاء");
};

export const settingsUsersService = {
  async loadUsers(companyId) {
    try {
      requireCompany(companyId);
      const rows = await supabase.select("app_users", `company_id=eq.${encodeURIComponent(companyId)}&is_platform_admin=eq.false&select=*&order=username.asc`);
      return (rows || []).map(settingsUserFromDb);
    } catch (error) {
      console.error("Settings CRUD error:", error);
      throw new Error("تعذر تحميل المستخدمين: " + error.message);
    }
  },

  async saveUser(companyId, user, mode = "edit") {
    try {
      const payload = userToDb(companyId, user);
      assertUser(payload, mode);
      if (mode !== "add" && !payload.password) delete payload.password;
      const { data, error } = await supabase.from("app_users").upsert(payload, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      return settingsUserFromDb(data);
    } catch (error) {
      console.error("Settings CRUD error:", error);
      if (String(error.message || "").toLowerCase().includes("duplicate")) throw new Error("اسم المستخدم مستخدم مسبقًا، استخدم اسم مستخدم مختلف.");
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
    return this.updateUser(companyId, userId, { ...user, is_active: isActive });
  },

  async resetUserPassword(companyId, userId, newPassword, user = {}) {
    if (!newPassword) throw new Error("يجب إدخال كلمة المرور الجديدة");
    return this.updateUser(companyId, userId, { ...user, password: newPassword });
  },

  async deleteUser(companyId, userId, user = {}) {
    if (user.is_platform_admin) throw new Error("لا يمكن حذف مشرف المنصة");
    return this.toggleUserStatus(companyId, userId, false, user);
  },
};
