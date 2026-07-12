import { supabase } from "./supabase";

export const permissionPages = [
  "dashboard",
  "employees",
  "evaluations",
  "incentives",
  "guarantees",
  "overtime",
  "shifts",
  "reports_center",
  "reports",
  "settings",
  "users_permissions",
  "audit_logs",
];

export const systemRoles = [
  "مدير النظام",
  "الموارد البشرية",
  "مدير فرع",
  "الإدارة العليا",
  "الموظف",
];

const userFromDb = (row = {}) => ({
  user_id: row.user_id || row.id,
  employee_id: row.employee_id || "",
  employee_name: row.employee_name || "",
  username: row.username || "",
  role: row.role || "الموظف",
  branch: row.branch || "",
  is_active: row.is_active !== false,
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const userToDb = (item = {}) => ({
  user_id: String(item.user_id || item.id || `USR-${Date.now()}`).trim(),
  employee_id: String(item.employee_id || item.employeeId || ""),
  employee_name: String(item.employee_name || item.employeeName || ""),
  username: String(item.username || "").trim(),
  role: String(item.role || "الموظف"),
  branch: String(item.branch || ""),
  is_active: item.is_active !== false,
  created_at: item.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

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
});

export const adminService = {
  async listUsers() {
    try {
      const rows = await supabase.select("app_users", "select=*&order=created_at.desc");
      return (rows || []).map(userFromDb);
    } catch (error) {
      console.error("Supabase app_users load/save error:", error);
      throw new Error("فشل تحميل بيانات المستخدمين من Supabase: " + error.message);
    }
  },
  async saveUser(user) {
    try {
      const payload = userToDb(user);
      const { data, error } = await supabase.from("app_users").upsert(payload, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      return userFromDb(data);
    } catch (error) {
      console.error("Supabase app_users load/save error:", error);
      throw new Error("فشل حفظ بيانات المستخدم في Supabase: " + error.message);
    }
  },
  async listPermissions() {
    try {
      const rows = await supabase.select("app_permissions", "select=*&order=role.asc");
      return (rows || []).map(permissionFromDb);
    } catch (error) {
      console.error("Supabase app_permissions load/save error:", error);
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
      console.error("Supabase app_permissions load/save error:", error);
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
