import { pageRegistry, permissionKeyForPage } from "../constants/pageRegistry";
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

export const companyPermissionModules = pageRegistry.map((page) => [
  page.permissionKey,
  page.label,
  page.group,
  page,
]);

const sensitiveGroups = new Set(["financial", "inventory", "platform"]);
const sensitiveKeys = new Set(companyPermissionModules.filter(([, , group]) => sensitiveGroups.has(group)).map(([key]) => key));

export const pageToCompanyPermissionKey = permissionKeyForPage;

const pageMetaByPermissionKey = (permissionKey) =>
  pageRegistry.find((page) => page.permissionKey === permissionKey || page.key === permissionKey) || {
    key: permissionKey,
    label: permissionKey,
    group: "legacy",
    groupLabel: "صلاحيات قديمة / غير مستخدمة",
    permissionKey,
    moduleKey: permissionKey,
    order: 9999,
    isOfficialPage: false,
    isDuplicateAllowed: false,
  };

const moduleMeta = (permissionKey) => {
  const page = pageMetaByPermissionKey(permissionKey);
  return {
    permission_key: page.permissionKey,
    permission_label: page.label,
    module_key: page.moduleKey || page.permissionKey,
    module_label: page.label,
    group_key: page.group || "legacy",
    group_label: page.groupLabel || "صلاحيات قديمة / غير مستخدمة",
    route_key: page.key,
    is_official_page: page.isOfficialPage !== false,
    is_duplicate_allowed: page.isDuplicateAllowed === true,
    sort_order: Number(page.order || 9999),
  };
};

export const normalizeCompanyPermission = (row = {}, companyId = "") => {
  const permissionKey = String(row.permission_key || row.module_key || row.route_key || "").trim();
  const meta = moduleMeta(permissionKey);
  const enabled = row.is_enabled !== false && row.can_access !== false;
  return {
    id: row.id,
    company_id: String(row.company_id || companyId || "").trim(),
    ...meta,
    permission_label: row.permission_label || meta.permission_label,
    module_key: row.module_key || meta.module_key,
    module_label: row.module_label || meta.module_label,
    group_key: row.group_key || meta.group_key,
    group_label: row.group_label || meta.group_label,
    route_key: row.route_key || meta.route_key,
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
    is_official_page: row.is_official_page !== false,
    is_duplicate_allowed: row.is_duplicate_allowed === true || meta.is_duplicate_allowed === true,
    sort_order: Number(row.sort_order ?? meta.sort_order ?? 9999),
  };
};

const defaultRow = (companyId, [, , group, page], enableAll = false) => {
  const enabled = enableAll || !sensitiveGroups.has(group);
  return normalizeCompanyPermission({
    company_id: companyId,
    permission_key: page.permissionKey,
    permission_label: page.label,
    module_key: page.moduleKey || page.permissionKey,
    module_label: page.label,
    group_key: page.group,
    group_label: page.groupLabel,
    route_key: page.key,
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
    is_official_page: page.isOfficialPage !== false,
    is_duplicate_allowed: page.isDuplicateAllowed === true,
    sort_order: page.order || 0,
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
    group_key: normalized.group_key,
    group_label: normalized.group_label,
    route_key: normalized.route_key,
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
    is_official_page: normalized.is_official_page,
    is_duplicate_allowed: normalized.is_duplicate_allowed,
    sort_order: normalized.sort_order,
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
  return Array.from(map.values()).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
};

export const companyCanAccessFromRows = (rows = [], pageKey = "", action = "can_view") => {
  const permissionKey = pageToCompanyPermissionKey(pageKey);
  const row = rows.find((item) => item.permission_key === permissionKey || item.route_key === pageKey || item.module_key === permissionKey);
  if (!row) return false;
  if (row.is_enabled === false || row.can_access === false) return false;
  return action === "can_access" ? true : row[action] !== false;
};

export const companyPermissionsService = {
  async loadCompanyPermissions(companyId) {
    if (!companyId) return [];
    try {
      const rows = await supabase.select("company_permissions", `company_id=eq.${encodeURIComponent(companyId)}&select=*&order=sort_order.asc`);
      const merged = mergeWithDefaultCompanyPermissions(rows || [], companyId);
      currentCompanyPermissionCache = merged;
      return merged;
    } catch (error) {
      console.error("Company permissions error:", error);
      throw new Error("فشل تحميل صلاحيات الشركة: " + error.message);
    }
  },

  async saveCompanyPermission(companyId, permissionKey, payload = {}) {
    const row = toDb({ ...payload, permission_key: permissionKey }, companyId);
    const { data, error } = await supabase.from("company_permissions").upsert(row, { onConflict: "company_id,permission_key" }).select().single();
    if (error) {
      console.error("Company permissions error:", error);
      throw new Error("فشل حفظ صلاحيات الشركة: " + error.message);
    }
    return normalizeCompanyPermission(data, companyId);
  },

  async bulkSaveCompanyPermissions(companyId, permissions = []) {
    if (!companyId) throw new Error("يجب اختيار الشركة أولاً");
    const rows = mergeWithDefaultCompanyPermissions(permissions, companyId).map((row) => toDb(row, companyId));
    const { data, error } = await supabase.from("company_permissions").upsert(rows, { onConflict: "company_id,permission_key" }).select();
    if (error) {
      console.error("Company permissions error:", error);
      throw new Error("فشل حفظ صلاحيات الشركة: " + error.message);
    }
    const normalized = mergeWithDefaultCompanyPermissions(data || rows, companyId);
    currentCompanyPermissionCache = normalized;
    return normalized;
  },

  async enableCompanyModule(companyId, permissionKey) {
    const meta = moduleMeta(permissionKey);
    return this.saveCompanyPermission(companyId, permissionKey, { ...meta, can_access: true, can_view: true, is_enabled: true });
  },

  async disableCompanyModule(companyId, permissionKey) {
    const meta = moduleMeta(permissionKey);
    return this.saveCompanyPermission(companyId, permissionKey, { ...meta, can_access: false, can_view: false, is_enabled: false });
  },

  async syncCompanyPermissionsWithPageRegistry(companyId) {
    if (!companyId) throw new Error("يجب اختيار الشركة أولاً");
    try {
      const existing = await this.loadCompanyPermissions(companyId).catch(() => []);
      const existingKeys = new Set(existing.map((row) => row.permission_key));
      const missing = companyPermissionModules
        .filter(([permissionKey]) => !existingKeys.has(permissionKey))
        .map((item) => defaultRow(companyId, item, false));
      if (!missing.length) return existing;
      const { data, error } = await supabase.from("company_permissions").upsert(missing.map((row) => toDb(row, companyId)), { onConflict: "company_id,permission_key" }).select();
      if (error) throw error;
      return mergeWithDefaultCompanyPermissions([...(existing || []), ...(data || missing)], companyId);
    } catch (error) {
      console.error("Company permissions error:", error);
      throw new Error("فشل مزامنة الصلاحيات مع الصفحات: " + error.message);
    }
  },

  async syncAllCompaniesPermissionsWithPageRegistry() {
    const companies = await supabase.select("companies", "select=company_id");
    const result = [];
    for (const company of companies || []) {
      result.push(await this.syncCompanyPermissionsWithPageRegistry(company.company_id));
    }
    return result;
  },

  companyCanAccess(permissionKey, action = "can_view") {
    return companyCanAccessFromRows(currentCompanyPermissionCache, permissionKey, action);
  },

  getAllowedCompanyPages(companyId) {
    return this.loadCompanyPermissions(companyId).then((rows) => rows.filter((row) => row.is_enabled && row.can_access && row.can_view));
  },

  getAllowedCompanyModules(companyId) {
    return this.getAllowedCompanyPages(companyId);
  },

  async seedDefaultCompanyPermissions(companyId, options = {}) {
    const rows = companyPermissionModules.map((item) => defaultRow(companyId, item, options.enableAll === true));
    return this.bulkSaveCompanyPermissions(companyId, rows);
  },

  async enableAll(companyId) {
    return this.bulkSaveCompanyPermissions(companyId, companyPermissionModules.map((item) => defaultRow(companyId, item, true)));
  },

  async disableAll(companyId) {
    return this.bulkSaveCompanyPermissions(companyId, companyPermissionModules.map(([, , , page]) => normalizeCompanyPermission({
      company_id: companyId,
      permission_key: page.permissionKey,
      permission_label: page.label,
      module_key: page.moduleKey,
      module_label: page.label,
      group_key: page.group,
      group_label: page.groupLabel,
      route_key: page.key,
      can_access: false,
      can_view: false,
      is_enabled: false,
      is_official_page: page.isOfficialPage !== false,
      is_duplicate_allowed: page.isDuplicateAllowed === true,
      sort_order: page.order || 0,
    }, companyId)));
  },

  async copyPermissionsFromCompany(sourceCompanyId, targetCompanyId) {
    if (!sourceCompanyId || !targetCompanyId) throw new Error("يجب اختيار الشركة المصدر والشركة الهدف");
    const sourceRows = await this.loadCompanyPermissions(sourceCompanyId);
    const targetRows = sourceRows.map((row) => ({ ...row, id: undefined, company_id: targetCompanyId }));
    return this.bulkSaveCompanyPermissions(targetCompanyId, targetRows);
  },

  async copyCompanyPermissions(sourceCompanyId, targetCompanyId) {
    return this.copyPermissionsFromCompany(sourceCompanyId, targetCompanyId);
  },

  subscribe(onChange) {
    return supabase.subscribeToTable("company_permissions", onChange);
  },

  isSensitive(permissionKey) {
    return sensitiveKeys.has(pageToCompanyPermissionKey(permissionKey));
  },
};
