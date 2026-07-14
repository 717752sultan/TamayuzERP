import { supabase } from "./supabase";

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
  "مدير النظام",
  "الموارد البشرية",
  "مدير فرع",
  "الإدارة العليا",
  "مسؤول المخزون",
  "الموظف",
];

const isAdminRole = (role = "") => ["مدير النظام", "مدير عام النظام"].some((name) => String(role).includes(name));

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
    password: row.password || "",
    role: row.role || "الموظف",
    branch: row.branch || employee?.branch || "",
    job: row.job || employee?.job || "",
    email: row.email || employee?.email || "",
    phone: row.phone || employee?.phone || "",
    is_active: row.is_active !== false,
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
  };
};

export const normalizeAppUserForDb = (user = {}, selectedEmployee = null) => {
  const role = String(user.role || "الموظف").trim();
  const admin = isAdminRole(role);
  const employeeName =
    selectedEmployee?.name ||
    selectedEmployee?.employee_name ||
    user.name ||
    user.employee_name ||
    user.full_name ||
    (admin ? "مدير النظام" : "") ||
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
    name: String(employeeName || "مستخدم").trim(),
    employee_name: String(employeeName || "مستخدم").trim(),
    username: String(user.username || user.email || employeeId || "").trim(),
    password: String(user.password || "123456").trim(),
    role,
    employee_id: String(employeeId || "").trim(),
    email: user.email ? String(user.email).trim() : null,
    branch: String(selectedEmployee?.branch || user.branch || (admin ? "الإدارة" : "")).trim(),
    job: String(selectedEmployee?.job || user.job || (admin ? "مدير النظام" : "")).trim(),
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
      id: `مسؤول المخزون-${page_key}`,
      role: "مسؤول المخزون",
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
      return [...loaded, ...missing];
    } catch (error) {
      console.error("App roles load/save error:", error);
      return systemRoles.map((name) => ({ role_id: `ROLE-${name}`, role_name: name, role_description: "", is_system_role: true, is_active: true }));
    }
  },
  async saveRole(role) {
    try {
      const payload = roleToDb(role);
      if (!payload.role_name) throw new Error("يجب إدخال اسم الدور");
      const { data, error } = await supabase.from("app_roles").upsert(payload, { onConflict: "role_id" }).select().single();
      if (error) throw error;
      return roleFromDb(data);
    } catch (error) {
      console.error("App roles load/save error:", error);
      throw new Error("فشل حفظ الدور: " + error.message);
    }
  },
  async deleteRole(role, users = []) {
    try {
      const row = roleFromDb(role);
      if (row.is_system_role) throw new Error("لا يمكن حذف دور نظامي");
      if (users.some((user) => user.role === row.role_name)) {
        return this.saveRole({ ...row, is_active: false });
      }
      await supabase.request(`/rest/v1/app_roles?role_id=eq.${encodeURIComponent(row.role_id)}`, { method: "DELETE", prefer: "return=minimal" });
      return null;
    } catch (error) {
      console.error("App roles load/save error:", error);
      throw new Error("فشل حذف/تعطيل الدور: " + error.message);
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
        .filter((row) => row.id && row.name && (!row.status || row.status === "نشط" || row.status === "ظ†ط´ط·"));
    } catch (error) {
      console.error("Users permissions module error:", error);
      throw new Error("فشل تحميل قائمة الموظفين: " + error.message);
    }
  },
  async listUsers() {
    try {
      const [userRows, employees] = await Promise.all([
        supabase.select("app_users", "select=*&order=created_at.desc"),
        this.loadEmployeesForUserDropdown().catch(() => []),
      ]);
      return (userRows || []).map((row) => {
        const employee = employees.find((item) => item.id === row.employee_id || item.employee_id === row.employee_id);
        return userFromDb(row, employee);
      });
    } catch (error) {
      console.error("Users permissions module error:", error);
      throw new Error("فشل تحميل بيانات المستخدمين من Supabase: " + error.message);
    }
  },
  async saveUser(user, selectedEmployee = null) {
    try {
      const payload = normalizeAppUserForDb(user, selectedEmployee);
      const admin = isAdminRole(payload.role);
      if (!payload.employee_id && !admin) throw new Error("يجب اختيار الموظف");
      if (!payload.name && !admin) throw new Error("لا يمكن حفظ مستخدم بدون اسم موظف");
      if (!payload.username) throw new Error("يجب إدخال اسم المستخدم");
      if (!payload.role) throw new Error("يجب تحديد الدور");
      if (!payload.password) throw new Error("يجب إدخال كلمة المرور");

      const existing = await this.listUsers().catch(() => []);
      const sameUser = (row) => String(row.user_id || row.id) === String(payload.user_id);
      if (payload.employee_id && !admin && existing.some((row) => !sameUser(row) && row.employee_id === payload.employee_id)) {
        throw new Error("هذا الموظف لديه مستخدم مسبقًا");
      }
      if (existing.some((row) => !sameUser(row) && row.username === payload.username)) {
        throw new Error("اسم المستخدم مستخدم مسبقًا");
      }

      const { data, error } = await supabase.from("app_users").upsert(payload, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      return userFromDb(data, selectedEmployee);
    } catch (error) {
      console.error("Users permissions module error:", error);
      throw new Error(error.message?.startsWith("فشل") ? error.message : "فشل حفظ بيانات المستخدم: " + error.message);
    }
  },
  async listPermissions() {
    try {
      const rows = await supabase.select("app_permissions", "select=*&order=role.asc");
      return (rows || []).map(permissionFromDb);
    } catch (error) {
      console.error("Users permissions module error:", error);
      throw new Error("فشل تحميل الصلاحيات من Supabase: " + error.message);
    }
  },
  async savePermissions(rows) {
    try {
      const payload = rows.map(permissionToDb).filter((row) => row.role && row.page_key);
      if (!payload.length) return [];
      const { data, error } = await supabase.from("app_permissions").upsert(payload, { onConflict: "id" }).select();
      if (error) throw error;
      return (data || []).map(permissionFromDb);
    } catch (error) {
      console.error("Users permissions module error:", error);
      throw new Error("فشل حفظ الصلاحيات في Supabase: " + error.message);
    }
  },
  subscribeUsers(onChange) {
    return supabase.subscribeToTable("app_users", onChange);
  },
  subscribePermissions(onChange) {
    return supabase.subscribeToTable("app_permissions", onChange);
  },
};
