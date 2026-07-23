import { supabase } from "./supabase";
import { isPlatformAdminUser, isProtectedPlatformRole, isProtectedPlatformUser } from "./tenant";

export const permissionPages = [
  "dashboard",
  "employees",
  "evaluations",
  "incentives",
  "guarantees",
  "overtime",
  "shifts",
  "inventory",
  "inventory_dashboard",
  "inventory_items",
  "inventory_suppliers",
  "inventory_purchase_requests",
  "inventory_purchase_orders",
  "inventory_receipts",
  "inventory_invoices",
  "inventory_issue_vouchers",
  "inventory_returns",
  "inventory_transfers",
  "inventory_adjustments",
  "inventory_stocktakes",
  "inventory_balances",
  "inventory_forecast",
  "inventory_reports",
  "inventory_settings",
  "notifications",
  "ai_assistant",
  "performance_criteria",
  "daily_operations",
  "daily_operations_approval",
  "performance_kpi_scores",
  "reports_center",
  "reports",
  "settings",
  "users_permissions",
  "recruitment",
  "audit_logs",
];

export const systemRoles = [
  "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…",
  "ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©",
  "ظ…ط¯ظٹط± ظپط±ط¹",
  "ط§ظ„ط¥ط¯ط§ط±ط© ط§ظ„ط¹ظ„ظٹط§",
  "ظ…ط³ط¤ظˆظ„ ط§ظ„ظ…ط®ط²ظˆظ†",
  "ط§ظ„ظ…ظˆط¸ظپ",
];

const isAdminRole = (role = "") => ["ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…", "ظ…ط¯ظٹط± ط¹ط§ظ… ط§ظ„ظ†ط¸ط§ظ…"].some((name) => String(role).includes(name));

const employeeFromDb = (row = {}) => ({
  id: row.id || row.employee_id || row.employeeId || "",
  employee_id: row.id || row.employee_id || row.employeeId || "",
  name: row.name || row.employee_name || row.employeeName || "",
  branch: row.branch || "",
  job: row.job || row.job_title || "",
  phone: row.phone || "",
  email: row.email || "",
  status: row.status || "",
});

const userFromDb = (row = {}, employee = null) => {
  const employeeName = row.name || row.employee_name || employee?.name || row.username || "";
  const employeeId = row.employee_id || employee?.id || "";
  return {
    user_id: row.user_id || row.id,
    id: row.user_id || row.id,
    name: employeeName,
    employee_id: employeeId,
    employee_name: employeeName,
    username: row.username || "",
    password: "",
    role: row.role || "ط§ظ„ظ…ظˆط¸ظپ",
    branch: row.branch || employee?.branch || "",
    job: row.job || employee?.job || "",
    email: row.email || employee?.email || "",
    phone: row.phone || employee?.phone || "",
    is_active: row.is_active !== false,
    is_platform_admin: row.is_platform_admin === true,
    is_protected: row.is_protected === true,
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
  };
};

const platformUserSelect = [
  "id",
  "user_id",
  "name",
  "username",
  "email",
  "role",
  "employee_id",
  "company_id",
  "company_code",
  "is_platform_admin",
  "is_active",
  "created_at",
  "updated_at",
].join(",");

const rpcUser = (result) => {
  const first = Array.isArray(result) ? result[0] || null : result;
  if (!first) return null;
  const payload = first.user || first.user_data || first.data || first;
  return Array.isArray(payload) ? payload[0] || null : payload;
};

const platformAccountFromDb = (row = {}, currentUser = {}) => ({
  ...currentUser,
  id: row.id || currentUser.id || "",
  user_id: row.user_id || currentUser.user_id || row.id || "",
  name: row.name || row.username || "",
  username: row.username || "",
  email: row.email || "",
  role: row.role || currentUser.role || "مشرف النظام العام",
  employeeId: row.employee_id || currentUser.employeeId || "",
  employee_id: row.employee_id || currentUser.employee_id || "",
  company_id: row.company_id || currentUser.company_id || "",
  company_code: row.company_code || currentUser.company_code || "",
  is_platform_admin: row.is_platform_admin === true,
  is_active: row.is_active !== false,
  created_at: row.created_at || currentUser.created_at || "",
  updated_at: row.updated_at || "",
});

const platformSettingsMessages = new Set([
  "كلمة المرور الحالية غير صحيحة",
  "البريد الإلكتروني غير صحيح",
  "اسم المستخدم مستخدم مسبقًا",
  "اسم المستخدم مطلوب",
  "البريد الإلكتروني مطلوب",
  "كلمة المرور الحالية مطلوبة",
  "كلمة المرور الجديدة مطلوبة",
  "كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف",
  "تأكيد كلمة المرور غير مطابق",
]);

export const normalizeAppUserForDb = (user = {}, selectedEmployee = null) => {
  const role = String(user.role || "ط§ظ„ظ…ظˆط¸ظپ").trim();
  const admin = isAdminRole(role);
  const employeeName =
    selectedEmployee?.name ||
    selectedEmployee?.employee_name ||
    user.name ||
    user.employee_name ||
    user.full_name ||
    (admin ? "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…" : "") ||
    user.username;
  const employeeId =
    selectedEmployee?.id ||
    selectedEmployee?.employee_id ||
    selectedEmployee?.employeeId ||
    user.employee_id ||
    user.employeeId ||
    (admin ? "ADMIN-001" : "");

  return {
    user_id: String(user.user_id || user.id || `USR-${Date.now()}`).trim(),
    name: String(employeeName || "ظ…ط³طھط®ط¯ظ…").trim(),
    employee_name: String(employeeName || "ظ…ط³طھط®ط¯ظ…").trim(),
    username: String(user.username || user.email || employeeId || "").trim(),
    password: user.password === undefined ? undefined : String(user.password || "").trim(),
    role,
    employee_id: String(employeeId || "").trim(),
    email: user.email ? String(user.email).trim() : null,
    branch: String(selectedEmployee?.branch || user.branch || (admin ? "ط§ظ„ط¥ط¯ط§ط±ط©" : "")).trim(),
    job: String(selectedEmployee?.job || user.job || (admin ? "ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…" : "")).trim(),
    phone: String(selectedEmployee?.phone || user.phone || "").trim(),
    is_active: user.is_active ?? user.active ?? true,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

const permissionFromDb = (row = {}) => ({
  id: row.id || `${row.role}-${row.page_key}`,
  page_key: row.page_key || "",
  role: row.role || "",
  can_view: row.can_view === true,
  can_create: row.can_create === true,
  can_edit: row.can_edit === true,
  can_delete: row.can_delete === true,
  can_export: row.can_export === true,
  can_approve: row.can_approve === true,
  can_cancel: row.can_cancel === true,
  can_post: row.can_post === true,
  can_print: row.can_print === true,
  can_override_stock: row.can_override_stock === true,
});

const permissionToDb = (item = {}) => ({
  id: String(item.id || `${item.role}-${item.page_key}`).trim(),
  page_key: String(item.page_key || ""),
  role: String(item.role || ""),
  can_view: item.can_view === true,
  can_create: item.can_create === true,
  can_edit: item.can_edit === true,
  can_delete: item.can_delete === true,
  can_export: item.can_export === true,
  can_approve: item.can_approve === true,
  can_cancel: item.can_cancel === true,
  can_post: item.can_post === true,
  can_print: item.can_print === true,
  can_override_stock: item.can_override_stock === true,
});

const roleFromDb = (row = {}) => ({
  role_id: row.role_id || `ROLE-${row.role_name || row.name || Date.now()}`,
  role_name: row.role_name || row.name || "",
  role_description: row.role_description || row.description || "",
  is_system_role: row.is_system_role === true,
  is_active: row.is_active !== false,
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const roleToDb = (role = {}) => ({
  role_id: String(role.role_id || `ROLE-${Date.now()}`).trim(),
  role_name: String(role.role_name || role.name || "").trim(),
  role_description: String(role.role_description || role.description || ""),
  is_system_role: role.is_system_role === true,
  is_active: role.is_active !== false,
  created_at: role.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const inventoryDefaults = {
  inventory_dashboard: ["can_view"],
  inventory_items: ["can_view", "can_create", "can_edit", "can_delete", "can_export", "can_print"],
  inventory_suppliers: ["can_view", "can_create", "can_edit", "can_delete", "can_export", "can_print"],
  inventory_purchase_requests: ["can_view", "can_create", "can_edit", "can_delete", "can_approve", "can_export", "can_print"],
  inventory_purchase_orders: ["can_view", "can_create", "can_edit", "can_approve", "can_export", "can_print"],
  inventory_receipts: ["can_view", "can_create", "can_edit", "can_post", "can_export", "can_print"],
  inventory_issue_vouchers: ["can_view", "can_create", "can_edit", "can_approve", "can_post", "can_export", "can_print"],
  inventory_returns: ["can_view", "can_create", "can_edit", "can_post", "can_export", "can_print"],
  inventory_transfers: ["can_view", "can_create", "can_edit", "can_approve", "can_post", "can_export", "can_print"],
  inventory_adjustments: ["can_view", "can_create", "can_edit", "can_approve", "can_export", "can_print"],
  inventory_stocktakes: ["can_view", "can_create", "can_edit", "can_approve", "can_post", "can_export", "can_print"],
  inventory_balances: ["can_view", "can_export", "can_print"],
  inventory_forecast: ["can_view", "can_export", "can_print"],
  inventory_reports: ["can_view", "can_export", "can_print"],
};

export const defaultInventoryPermissions = () =>
  Object.entries(inventoryDefaults).map(([page_key, keys]) => {
    const row = {
      id: `ظ…ط³ط¤ظˆظ„ ط§ظ„ظ…ط®ط²ظˆظ†-${page_key}`,
      role: "ظ…ط³ط¤ظˆظ„ ط§ظ„ظ…ط®ط²ظˆظ†",
      page_key,
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_export: false,
      can_approve: false,
      can_cancel: false,
      can_post: false,
      can_print: false,
      can_override_stock: false,
    };
    keys.forEach((key) => { row[key] = true; });
    return row;
  });

export const adminService = {
  async listRoles() {
    try {
      const rows = await supabase.select("app_roles", "select=*&order=role_name.asc");
      const loaded = (rows || []).map(roleFromDb);
      const missing = systemRoles.filter((name) => !loaded.some((role) => role.role_name === name)).map((name) => ({ role_id: `ROLE-${name}`, role_name: name, role_description: "", is_system_role: true, is_active: true }));
      const result = [...loaded, ...missing];
      return isPlatformAdminUser() ? result : result.filter((role) => !isProtectedPlatformRole(role.role_name));
    } catch (error) {
      console.error("App roles load/save error:", error);
      const fallback = systemRoles.map((name) => ({ role_id: `ROLE-${name}`, role_name: name, role_description: "", is_system_role: true, is_active: true }));
      return fallback;
    }
  },
  async saveRole(role) {
    try {
      const payload = roleToDb(role);
      if (!payload.role_name) throw new Error("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„ط¯ظˆط±");
      if (!isPlatformAdminUser() && isProtectedPlatformRole(payload.role_name)) {
        throw new Error("ظ„ط§ ظٹظ…ظƒظ† طھط¹ط¯ظٹظ„ ظ‡ط°ط§ ط§ظ„ط¯ظˆط± ظ…ظ† ط¯ط§ط®ظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط´ط±ظƒط©");
      }
      const { data, error } = await supabase.from("app_roles").upsert(payload, { onConflict: "role_id" }).select().single();
      if (error) throw error;
      return roleFromDb(data);
    } catch (error) {
      console.error("App roles load/save error:", error);
      throw new Error("ظپط´ظ„ ط­ظپط¸ ط§ظ„ط¯ظˆط±: " + error.message);
    }
  },
  async deleteRole(role, users = []) {
    try {
      const row = roleFromDb(role);
      if (row.is_system_role) throw new Error("ظ„ط§ ظٹظ…ظƒظ† ط­ط°ظپ ط¯ظˆط± ظ†ط¸ط§ظ…ظٹ");
      if (!isPlatformAdminUser() && isProtectedPlatformRole(row.role_name)) {
        throw new Error("ظ„ط§ ظٹظ…ظƒظ† ط­ط°ظپ ظ‡ط°ط§ ط§ظ„ط¯ظˆط± ظ…ظ† ط¯ط§ط®ظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط´ط±ظƒط©");
      }
      if (users.some((user) => user.role === row.role_name)) {
        return this.saveRole({ ...row, is_active: false });
      }
      await supabase.request(`/rest/v1/app_roles?role_id=eq.${encodeURIComponent(row.role_id)}`, { method: "DELETE", prefer: "return=minimal" });
      return null;
    } catch (error) {
      console.error("App roles load/save error:", error);
      throw new Error("ظپط´ظ„ ط­ط°ظپ/طھط¹ط·ظٹظ„ ط§ظ„ط¯ظˆط±: " + error.message);
    }
  },
  async loadUsersByRole(roleName) {
    const rows = await this.listUsers();
    return rows.filter((user) => user.role === roleName);
  },
  async loadEmployeesForUserDropdown() {
    try {
      const rows = await supabase.select("employees", "select=*&order=name.asc");
      return (rows || [])
        .map(employeeFromDb)
        .filter((row) => row.id && row.name && (!row.status || row.status === "ظ†ط´ط·" || row.status === "ط¸â€ ط·آ´ط·آ·"));
    } catch (error) {
      console.error("Users permissions module error:", error);
      throw new Error("ظپط´ظ„ طھط­ظ…ظٹظ„ ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظˆط¸ظپظٹظ†: " + error.message);
    }
  },
  async listUsers() {
    try {
      const [userRows, employees] = await Promise.all([
        supabase.select("app_users", "select=*&order=created_at.desc"),
        this.loadEmployeesForUserDropdown().catch(() => []),
      ]);
      const rows = (userRows || []).map((row) => {
        const employee = employees.find((item) => item.id === row.employee_id || item.employee_id === row.employee_id);
        return userFromDb(row, employee);
      });
      return rows.filter((row) => !isProtectedPlatformUser(row));
    } catch (error) {
      console.error("Users permissions module error:", error);
      throw new Error("ظپط´ظ„ طھط­ظ…ظٹظ„ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ظ…ظ† Supabase: " + error.message);
    }
  },
  async saveUser(user, selectedEmployee = null) {
    try {
      const payload = normalizeAppUserForDb(user, selectedEmployee);
      const admin = isAdminRole(payload.role);
      if (!payload.employee_id && !admin) throw new Error("ظٹط¬ط¨ ط§ط®طھظٹط§ط± ط§ظ„ظ…ظˆط¸ظپ");
      if (!payload.name && !admin) throw new Error("ظ„ط§ ظٹظ…ظƒظ† ط­ظپط¸ ظ…ط³طھط®ط¯ظ… ط¨ط¯ظˆظ† ط§ط³ظ… ظ…ظˆط¸ظپ");
      if (!payload.username) throw new Error("ظٹط¬ط¨ ط¥ط¯ط®ط§ظ„ ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…");
      if (!payload.role) throw new Error("ظٹط¬ط¨ طھط­ط¯ظٹط¯ ط§ظ„ط¯ظˆط±");
      const isNewUser = !user.user_id && !user.id;
      if (isNewUser && !payload.password) throw new Error("يجب إدخال كلمة المرور");
      if (!payload.password) delete payload.password;
      if (isProtectedPlatformUser(payload) || isProtectedPlatformRole(payload.role)) {
        throw new Error("ظ„ط§ ظٹظ…ظƒظ† ط­ظپط¸ ظ‡ط°ط§ ط§ظ„ظ…ط³طھط®ط¯ظ… ظ…ظ† ط¯ط§ط®ظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط´ط±ظƒط©");
      }
      if (!isNewUser) {
        const targetRows = await supabase.select(
          "app_users",
          `user_id=eq.${encodeURIComponent(payload.user_id)}&select=id,is_platform_admin&limit=1`,
        );
        if (targetRows?.[0]?.is_platform_admin === true) {
          throw new Error("حساب مشرف المنصة محمي ولا يمكن تعديله من إدارة مستخدمي الشركة");
        }
      }

      const existing = await this.listUsers().catch(() => []);
      const sameUser = (row) => String(row.user_id || row.id) === String(payload.user_id);
      if (payload.employee_id && !admin && existing.some((row) => !sameUser(row) && row.employee_id === payload.employee_id)) {
        throw new Error("ظ‡ط°ط§ ط§ظ„ظ…ظˆط¸ظپ ظ„ط¯ظٹظ‡ ظ…ط³طھط®ط¯ظ… ظ…ط³ط¨ظ‚ظ‹ط§");
      }
      if (existing.some((row) => !sameUser(row) && row.username === payload.username)) {
        throw new Error("ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ… ظ…ط³طھط®ط¯ظ… ظ…ط³ط¨ظ‚ظ‹ط§");
      }

      const { data, error } = await supabase.from("app_users").upsert(payload, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      return userFromDb(data, selectedEmployee);
    } catch (error) {
      console.error("Users permissions module error:", error);
      throw new Error(error.message?.startsWith("ظپط´ظ„") ? error.message : "ظپط´ظ„ ط­ظپط¸ ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…: " + error.message);
    }
  },
  async resetUserPassword(userId, newPassword) {
    try {
      const id = String(userId || "").trim();
      const password = String(newPassword || "").trim();
      if (!id) throw new Error("لم يتم تحديد المستخدم");
      if (!password) throw new Error("يجب إدخال كلمة المرور الجديدة");
      await supabase.request(`/rest/v1/app_users?user_id=eq.${encodeURIComponent(id)}&is_platform_admin=eq.false`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({ password, password_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
      });
      return { user_id: id };
    } catch (error) {
      console.error("Users permissions module error:", error);
      throw new Error("فشل إعادة تعيين كلمة المرور: " + error.message);
    }
  },
  async updatePlatformAdminAccount(currentUser = {}, changes = {}) {
    try {
      if (!isPlatformAdminUser(currentUser)) throw new Error("هذه الصفحة مخصصة لمشرف المنصة فقط");

      const platformRows = await supabase.request(
        `/rest/v1/app_users?is_platform_admin=eq.true&select=${platformUserSelect}`,
        { skipTenantScope: true },
      );
      const currentId = String(currentUser.id || "").trim();
      const currentUserId = String(currentUser.user_id || "").trim();
      const account = (platformRows || []).find((row) => String(row.id || "") === currentId)
        || (platformRows || []).find((row) => String(row.user_id || "") === currentUserId)
        || (platformRows || []).find((row) => String(row.username || "") === String(currentUser.username || ""));
      const databaseId = String(account?.id || "").trim();
      if (!databaseId || !account?.is_platform_admin) throw new Error("لم يتم تحديد حساب مشرف المنصة");

      const nextUsername = String(changes.username || currentUser.username || "").trim();
      const nextEmail = String(changes.email || "").trim();
      const nextName = String(changes.name || currentUser.name || "").trim();
      const currentPassword = String(changes.currentPassword || "");
      const newPassword = String(changes.newPassword || "");
      const confirmPassword = String(changes.confirmPassword || "");
      if (!nextUsername) throw new Error("اسم المستخدم مطلوب");
      if (!nextEmail) throw new Error("البريد الإلكتروني مطلوب");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) throw new Error("البريد الإلكتروني غير صحيح");

      const duplicateRows = await supabase.request(
        `/rest/v1/app_users?username=eq.${encodeURIComponent(nextUsername)}&id=neq.${encodeURIComponent(databaseId)}&select=id&limit=1`,
        { skipTenantScope: true },
      );
      if (duplicateRows?.length) throw new Error("اسم المستخدم مستخدم مسبقًا");

      const passwordChanged = Boolean(newPassword || confirmPassword || currentPassword);
      if (passwordChanged) {
        if (!currentPassword) throw new Error("كلمة المرور الحالية مطلوبة");
        if (!newPassword) throw new Error("كلمة المرور الجديدة مطلوبة");
        if (newPassword.length < 8) throw new Error("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف");
        if (newPassword !== confirmPassword) throw new Error("تأكيد كلمة المرور غير مطابق");
        const verified = await supabase.rpc("verify_app_login", {
          p_company_code: "PLATFORM",
          p_login: account.username,
          p_password: currentPassword,
        });
        const verifiedAccount = rpcUser(verified);
        if (
          !verifiedAccount
          || String(verifiedAccount.id || "") !== databaseId
          || !isPlatformAdminUser(verifiedAccount)
        ) {
          throw new Error("كلمة المرور الحالية غير صحيحة");
        }
      }

      const now = new Date().toISOString();
      const rowScope = `id=eq.${encodeURIComponent(databaseId)}&company_id=eq.${encodeURIComponent(account.company_id)}&is_platform_admin=eq.true`;
      const profileRows = await supabase.request(`/rest/v1/app_users?${rowScope}&select=${platformUserSelect}`, {
        method: "PATCH",
        prefer: "return=representation",
        body: JSON.stringify({
          name: nextName,
          username: nextUsername,
          email: nextEmail,
          updated_at: now,
        }),
      });
      if (!profileRows?.length) throw new Error("لم يتم تحديث حساب مشرف المنصة");

      if (passwordChanged) {
        const passwordRows = await supabase.request(`/rest/v1/app_users?${rowScope}&select=id`, {
          method: "PATCH",
          prefer: "return=representation",
          body: JSON.stringify({
            password: newPassword,
            password_changed_at: now,
            updated_at: now,
          }),
        });
        if (!passwordRows?.length) throw new Error("لم يتم تغيير كلمة مرور مشرف المنصة");
      }

      const refreshedRows = await supabase.select(
        "app_users",
        `id=eq.${encodeURIComponent(databaseId)}&company_id=eq.${encodeURIComponent(account.company_id)}&is_platform_admin=eq.true&select=${platformUserSelect}&limit=1`,
      );
      if (!refreshedRows?.length) throw new Error("تعذر إعادة تحميل حساب مشرف المنصة");
      return {
        user: platformAccountFromDb(refreshedRows[0], currentUser),
        passwordChanged,
      };
    } catch (error) {
      console.error("Platform admin settings error:", { message: error.message });
      const message = String(error.message || "");
      if (platformSettingsMessages.has(message)) throw new Error(message);
      if (message.toLowerCase().includes("duplicate") || message.includes("app_users_username")) {
        throw new Error("اسم المستخدم مستخدم مسبقًا");
      }
      throw new Error("تعذر حفظ إعدادات مشرف المنصة: " + message);
    }
  },
  async listPermissions() {
    try {
      const rows = await supabase.select("app_permissions", "select=*&order=role.asc");
      return (rows || []).map(permissionFromDb);
    } catch (error) {
      console.error("Users permissions module error:", error);
      throw new Error("ظپط´ظ„ طھط­ظ…ظٹظ„ ط§ظ„طµظ„ط§ط­ظٹط§طھ ظ…ظ† Supabase: " + error.message);
    }
  },
  async savePermissions(rows) {
    try {
      const payload = rows.map(permissionToDb).filter((row) => row.role && row.page_key);
      if (!payload.length) return [];
      if (!isPlatformAdminUser() && payload.some((row) => isProtectedPlatformRole(row.role))) {
        throw new Error("ظ„ط§ ظٹظ…ظƒظ† ط­ظپط¸ طµظ„ط§ط­ظٹط§طھ ظ‡ط°ط§ ط§ظ„ط¯ظˆط± ظ…ظ† ط¯ط§ط®ظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط´ط±ظƒط©");
      }
      const { data, error } = await supabase.from("app_permissions").upsert(payload, { onConflict: "id" }).select();
      if (error) throw error;
      return (data || []).map(permissionFromDb);
    } catch (error) {
      console.error("Users permissions module error:", error);
      throw new Error("ظپط´ظ„ ط­ظپط¸ ط§ظ„طµظ„ط§ط­ظٹط§طھ ظپظٹ Supabase: " + error.message);
    }
  },
  subscribeUsers(onChange) {
    return supabase.subscribeToTable("app_users", onChange);
  },
  subscribePermissions(onChange) {
    return supabase.subscribeToTable("app_permissions", onChange);
  },
};
