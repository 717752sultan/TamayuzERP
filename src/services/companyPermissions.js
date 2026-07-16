import { supabase } from "./supabase";

export const companyPermissionActions = [
  ["can_access", "تفعيل"],
  ["can_view", "عرض"],
  ["can_create", "إضافة"],
  ["can_edit", "تعديل"],
  ["can_delete", "حذف"],
  ["can_approve", "اعتماد"],
  ["can_export", "تصدير"],
  ["can_print", "طباعة"],
  ["can_manage", "إدارة"],
];

export const companyPermissionModules = [
  ["dashboard", "لوحة التحكم", "core"],
  ["employees", "الموظفون", "core"],
  ["templates", "نماذج التقييم", "core"],
  ["evaluations", "تقييم الموظفين", "core"],
  ["productivity", "الإنتاجية", "core"],
  ["discipline", "الانضباط", "core"],
  ["incentives", "الحوافز", "sensitive"],
  ["top", "موظف الشهر", "core"],
  ["plans", "خطط التحسين", "core"],
  ["reports", "التقارير", "core"],
  ["settings", "الإعدادات", "core"],
  ["guarantees", "ضمانات الموظفين", "core"],
  ["overtime", "العمل الإضافي", "core"],
  ["shifts", "شفتات الموظفين", "core"],
  ["inventory", "إدارة المخزون", "sensitive"],
  ["daily_operations", "العمليات اليومية", "core"],
  ["performance_criteria", "معايير الأداء", "core"],
  ["performance_kpi_scores", "درجات KPI", "core"],
  ["users_permissions", "المستخدمون والصلاحيات", "core"],
  ["recruitment", "طلبات التوظيف", "core"],
  ["reports_center", "مركز التقارير", "core"],
  ["audit_logs", "سجل العمليات", "core"],
  ["ai_assistant", "المساعد الذكي", "sensitive"],
  ["companies_management", "إدارة الشركات", "sensitive"],
  ["financial_setup", "تهيئة المعلومات المالية", "sensitive"],
  ["salaries", "الرواتب", "sensitive"],
  ["attendance", "الحضور والدوام", "core"],
  ["requests", "الطلبات", "core"],
  ["leaves", "الإجازات", "core"],
  ["performance", "الأداء", "core"],
];

const sensitiveKeys = new Set(companyPermissionModules.filter(([, , group]) => group === "sensitive").map(([key]) => key));

const pagePermissionMap = {
  companies_admin: "companies_management",
  hr_home: "dashboard",
  hr_employees_full: "employees",
  hr_reports_full: "reports",
  hr_requests: "requests",
  hr_performance_full: "performance",
  hr_incentives_full: "incentives",
  hr_attendance_payroll: "attendance",
  hr_salary: "salaries",
  hr_disciplinary: "discipline",
  hr_recruitment_full: "recruitment",
  hr_leaves: "leaves",
  hr_complaints: "requests",
  hr_circulars: "requests",
  hr_termination: "employees",
  hr_surveys: "requests",
  hr_insurance: "guarantees",
  hr_announcements: "requests",
  hr_files: "employees",
  hr_training: "performance",
  hr_approvals: "requests",
  hr_org_chart: "employees",
  hr_settings_full: "settings",
  hr_financial_setup: "financial_setup",
  hr_templates_full: "templates",
};

export const pageToCompanyPermissionKey = (pageKey = "") => pagePermissionMap[pageKey] || pageKey;

const moduleMeta = (permissionKey) => {
  const found = companyPermissionModules.find(([key]) => key === permissionKey);
  return {
    permission_key: permissionKey,
    permission_label: found?.[1] || permissionKey,
    module_key: permissionKey,
    module_label: found?.[1] || permissionKey,
  };
};

export const normalizeCompanyPermission = (row = {}, companyId = "") => {
  const permissionKey = String(row.permission_key || row.module_key || "").trim();
  const meta = moduleMeta(permissionKey);
  const enabled = row.is_enabled !== false && row.can_access !== false;
  return {
    id: row.id,
    company_id: String(row.company_id || companyId || "").trim(),
    ...meta,
    permission_label: row.permission_label || meta.permission_label,
    module_key: row.module_key || meta.module_key,
    module_label: row.module_label || meta.module_label,
    can_access: enabled,
    can_view: row.can_view !== false && enabled,
    can_create: row.can_create === true,
    can_edit: row.can_edit === true,
    can_delete: row.can_delete === true,
    can_approve: row.can_approve === true,
    can_export: row.can_export === true,
    can_print: row.can_print === true,
    can_manage: row.can_manage === true,
    is_enabled: enabled,
  };
};

const defaultRow = (companyId, [key, label, group], enableAll = false) => {
  const enabled = enableAll || group !== "sensitive";
  return normalizeCompanyPermission({
    company_id: companyId,
    permission_key: key,
    permission_label: label,
    module_key: key,
    module_label: label,
    can_access: enabled,
    can_view: enabled,
    can_create: enabled,
    can_edit: enabled,
    can_delete: enableAll ? enabled : false,
    can_approve: enabled,
    can_export: enabled,
    can_print: enabled,
    can_manage: enabled,
    is_enabled: enabled,
  }, companyId);
};

const toDb = (row, companyId) => {
  const normalized = normalizeCompanyPermission(row, companyId);
  return {
    company_id: normalized.company_id,
    permission_key: normalized.permission_key,
    permission_label: normalized.permission_label,
    module_key: normalized.module_key,
    module_label: normalized.module_label,
    can_access: normalized.can_access,
    can_view: normalized.can_view,
    can_create: normalized.can_create,
    can_edit: normalized.can_edit,
    can_delete: normalized.can_delete,
    can_approve: normalized.can_approve,
    can_export: normalized.can_export,
    can_print: normalized.can_print,
    can_manage: normalized.can_manage,
    is_enabled: normalized.is_enabled,
    updated_at: new Date().toISOString(),
  };
};

let currentCompanyPermissionCache = [];

export const mergeWithDefaultCompanyPermissions = (rows = [], companyId = "", options = {}) => {
  const map = new Map(companyPermissionModules.map((item) => [item[0], defaultRow(companyId, item, options.enableAll === true)]));
  (rows || []).forEach((row) => {
    const normalized = normalizeCompanyPermission(row, companyId);
    if (normalized.permission_key) map.set(normalized.permission_key, normalized);
  });
  return Array.from(map.values());
};

export const companyCanAccessFromRows = (rows = [], pageKey = "", action = "can_view") => {
  const permissionKey = pageToCompanyPermissionKey(pageKey);
  const row = rows.find((item) => item.permission_key === permissionKey || item.module_key === permissionKey);
  if (!row) return true;
  if (row.is_enabled === false || row.can_access === false) return false;
  return action === "can_access" ? true : row[action] !== false;
};

export const companyPermissionsService = {
  async loadCompanyPermissions(companyId) {
    if (!companyId) return [];
    try {
      const rows = await supabase.select("company_permissions", `company_id=eq.${encodeURIComponent(companyId)}&select=*&order=module_label.asc`);
      const merged = mergeWithDefaultCompanyPermissions(rows || [], companyId);
      currentCompanyPermissionCache = merged;
      return merged;
    } catch (error) {
      console.error("Supabase company_permissions load/save error:", error);
      throw new Error("فشل تحميل صلاحيات الشركة من Supabase: " + error.message);
    }
  },

  async saveCompanyPermission(companyId, permissionKey, payload = {}) {
    const row = toDb({ ...payload, permission_key: permissionKey }, companyId);
    const { data, error } = await supabase.from("company_permissions").upsert(row, { onConflict: "company_id,permission_key" }).select().single();
    if (error) {
      console.error("Supabase company_permissions save error:", error);
      throw new Error("فشل حفظ صلاحية الشركة: " + error.message);
    }
    return normalizeCompanyPermission(data, companyId);
  },

  async bulkSaveCompanyPermissions(companyId, permissions = []) {
    if (!companyId) throw new Error("يجب اختيار الشركة أولاً");
    const rows = mergeWithDefaultCompanyPermissions(permissions, companyId).map((row) => toDb(row, companyId));
    const { data, error } = await supabase.from("company_permissions").upsert(rows, { onConflict: "company_id,permission_key" }).select();
    if (error) {
      console.error("Supabase company_permissions bulk save error:", error);
      throw new Error("فشل حفظ صلاحيات الشركة: " + error.message);
    }
    const normalized = mergeWithDefaultCompanyPermissions(data || rows, companyId);
    currentCompanyPermissionCache = normalized;
    return normalized;
  },

  async enableCompanyModule(companyId, moduleKey) {
    const meta = moduleMeta(moduleKey);
    return this.saveCompanyPermission(companyId, moduleKey, { ...meta, can_access: true, can_view: true, is_enabled: true });
  },

  async disableCompanyModule(companyId, moduleKey) {
    const meta = moduleMeta(moduleKey);
    return this.saveCompanyPermission(companyId, moduleKey, { ...meta, can_access: false, can_view: false, is_enabled: false });
  },

  companyCanAccess(moduleKey, action = "can_view") {
    return companyCanAccessFromRows(currentCompanyPermissionCache, moduleKey, action);
  },

  getAllowedCompanyModules(companyId) {
    return this.loadCompanyPermissions(companyId).then((rows) => rows.filter((row) => row.is_enabled && row.can_access));
  },

  async seedDefaultCompanyPermissions(companyId, options = {}) {
    const rows = companyPermissionModules.map((item) => defaultRow(companyId, item, options.enableAll === true));
    return this.bulkSaveCompanyPermissions(companyId, rows);
  },

  async enableAll(companyId) {
    return this.bulkSaveCompanyPermissions(companyId, companyPermissionModules.map((item) => defaultRow(companyId, item, true)));
  },

  async disableAll(companyId) {
    return this.bulkSaveCompanyPermissions(companyId, companyPermissionModules.map(([key, label]) => normalizeCompanyPermission({
      company_id: companyId,
      permission_key: key,
      permission_label: label,
      module_key: key,
      module_label: label,
      can_access: false,
      can_view: false,
      is_enabled: false,
    }, companyId)));
  },

  async copyCompanyPermissions(sourceCompanyId, targetCompanyId) {
    if (!sourceCompanyId || !targetCompanyId) throw new Error("يجب اختيار الشركة المصدر والشركة الهدف");
    const sourceRows = await this.loadCompanyPermissions(sourceCompanyId);
    const targetRows = sourceRows.map((row) => ({ ...row, id: undefined, company_id: targetCompanyId }));
    return this.bulkSaveCompanyPermissions(targetCompanyId, targetRows);
  },

  subscribe(onChange) {
    return supabase.subscribeToTable("company_permissions", onChange);
  },

  isSensitive(permissionKey) {
    return sensitiveKeys.has(pageToCompanyPermissionKey(permissionKey));
  },
};
