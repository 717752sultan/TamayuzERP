import { supabase } from "./supabase";

export const permissionActions = [
  ["can_view", "عرض"],
  ["can_create", "إضافة"],
  ["can_edit", "تعديل"],
  ["can_delete", "حذف"],
  ["can_approve", "اعتماد"],
  ["can_reject", "رفض"],
  ["can_cancel", "إلغاء"],
  ["can_post", "ترحيل"],
  ["can_import", "استيراد"],
  ["can_export", "تصدير"],
  ["can_print", "طباعة"],
  ["can_configure", "تهيئة"],
  ["can_override", "تجاوز"],
  ["can_view_financial", "عرض مالي"],
  ["can_view_sensitive", "عرض حساس"],
];

export const dataScopes = [
  ["own", "خاص به فقط"],
  ["branch", "الفرع"],
  ["department", "القسم"],
  ["all", "كل الفروع"],
];

export const departmentOptions = ["الإدارة", "الموارد البشرية", "الحسابات", "الدعم الفني", "الامتثال", "العمليات", "المخزون", "الفروع"];

const node = (node_key, node_name, parent_id = "", node_type = "page", sort_order = 0, extra = {}) => ({
  node_id: node_key,
  parent_id,
  node_key,
  node_name,
  node_type,
  module_key: extra.module_key || parent_id || node_key,
  page_key: extra.page_key || node_key,
  tab_key: extra.tab_key || "",
  sort_order,
  icon: extra.icon || "",
  is_active: true,
});

export const defaultPermissionTreeNodes = [
  node("system", "النظام", "", "module", 1),
  node("system_users", "المستخدمون", "system", "page", 1, { page_key: "users_permissions" }),
  node("system_roles", "الأدوار", "system", "page", 2, { page_key: "users_permissions" }),
  node("system_permissions", "الصلاحيات", "system", "page", 3, { page_key: "users_permissions" }),
  node("audit_logs", "سجل العمليات", "system", "page", 4),
  node("notifications", "الإشعارات", "system", "page", 5),
  node("settings", "الإعدادات", "", "module", 2),
  node("settings_branches", "الفروع", "settings", "tab", 1, { page_key: "settings" }),
  node("settings_currencies", "العملات", "settings", "tab", 2, { page_key: "settings" }),
  node("settings_jobs", "الوظائف", "settings", "tab", 3, { page_key: "settings" }),
  node("settings_evaluations", "التقييمات", "settings", "tab", 4, { page_key: "settings" }),
  node("settings_incentives", "الحوافز", "settings", "tab", 5, { page_key: "settings" }),
  node("employees", "الموظفون", "", "module", 3),
  node("employees_list", "قائمة الموظفين", "employees", "page", 1, { page_key: "employees" }),
  node("employee_profile", "بيانات الموظف", "employees", "page", 2, { page_key: "employees" }),
  node("guarantees", "الضمانات", "employees", "page", 3),
  node("inventory", "المخزون", "", "module", 4),
  node("inventory_dashboard", "لوحة المخزون", "inventory", "tab", 1),
  node("inventory_items", "الأصناف", "inventory", "tab", 2),
  node("inventory_suppliers", "الموردون", "inventory", "tab", 3),
  node("inventory_purchase_requests", "طلب شراء", "inventory", "tab", 4),
  node("inventory_purchase_orders", "أمر شراء", "inventory", "tab", 5),
  node("inventory_receipts", "إذن استلام", "inventory", "tab", 6),
  node("inventory_invoices", "فاتورة شراء", "inventory", "tab", 7),
  node("inventory_issue_vouchers", "سند صرف للفروع", "inventory", "tab", 8),
  node("inventory_returns", "سند إرجاع من الفروع", "inventory", "tab", 9),
  node("inventory_transfers", "سند تحويل مخزني", "inventory", "tab", 10),
  node("inventory_adjustments", "التسويات", "inventory", "tab", 11),
  node("inventory_stocktakes", "الجرد", "inventory", "tab", 12),
  node("inventory_balances", "أرصدة المخزون", "inventory", "tab", 13),
  node("inventory_movements", "حركة المخزون", "inventory", "tab", 14),
  node("inventory_forecast", "توقع الاحتياج", "inventory", "tab", 15),
  node("inventory_reports", "تقارير المخزون", "inventory", "tab", 16),
  node("inventory_settings", "إعدادات المخزون", "inventory", "tab", 17),
  node("shifts", "الشفتات", "", "module", 5),
  node("shift_types", "أنواع الشفتات", "shifts", "tab", 1, { page_key: "shifts" }),
  node("shift_assignments", "توزيع الموظفين", "shifts", "tab", 2, { page_key: "shifts" }),
  node("shift_conflicts", "تعارضات الشفتات", "shifts", "tab", 3, { page_key: "shifts" }),
  node("performance", "التقييمات والأداء", "", "module", 6),
  node("performance_criteria", "معايير الأداء", "performance", "page", 1),
  node("templates", "نماذج الوظائف", "performance", "page", 2),
  node("evaluations", "تقييم الموظفين", "performance", "page", 3),
  node("performance_kpi_scores", "درجات KPI", "performance", "page", 4),
  node("daily_operations", "العمليات اليومية", "", "module", 7),
  node("daily_operations_entry", "إدخال العمليات", "daily_operations", "tab", 1, { page_key: "daily_operations" }),
  node("daily_operations_approval", "اعتماد العمليات", "daily_operations", "tab", 2),
  node("daily_operations_reports", "تقارير العمليات", "daily_operations", "tab", 3, { page_key: "daily_operations" }),
  node("incentives", "الحوافز", "", "module", 8),
  node("incentives_calculation", "احتساب الحوافز", "incentives", "page", 1, { page_key: "incentives" }),
  node("incentives_approval", "اعتماد الحوافز", "incentives", "page", 2, { page_key: "incentives" }),
  node("reports", "التقارير", "", "module", 9),
  node("reports_center", "مركز التقارير", "reports", "page", 1),
  node("reports_financial", "التقارير المالية", "reports", "page", 2, { page_key: "reports" }),
  node("ai_assistant", "المساعد الذكي", "", "module", 10),
  node("ai_chat", "المحادثة", "ai_assistant", "page", 1, { page_key: "ai_assistant" }),
  node("ai_reports_analysis", "تحليل التقارير", "ai_assistant", "page", 2, { page_key: "ai_assistant" }),
];

const blankPermission = (roleName, nodeKey) => ({
  permission_id: `${roleName}-${nodeKey}`,
  role_name: roleName,
  node_key: nodeKey,
  can_view: false,
  can_create: false,
  can_edit: false,
  can_delete: false,
  can_approve: false,
  can_reject: false,
  can_cancel: false,
  can_post: false,
  can_import: false,
  can_export: false,
  can_print: false,
  can_configure: false,
  can_override: false,
  can_view_financial: false,
  can_view_sensitive: false,
  data_scope: "own",
  allowed_branches: [],
  allowed_departments: [],
});

const nodeFromDb = (row = {}) => ({ ...row, children: [] });
const permissionFromDb = (row = {}) => ({
  ...blankPermission(row.role_name || row.role || "", row.node_key || row.page_key || ""),
  ...row,
  allowed_branches: Array.isArray(row.allowed_branches) ? row.allowed_branches : [],
  allowed_departments: Array.isArray(row.allowed_departments) ? row.allowed_departments : [],
});

export const normalizeTreePermission = (permission = {}) => {
  const next = { ...blankPermission(permission.role_name || permission.role || "", permission.node_key || permission.page_key || ""), ...permission };
  if (!next.can_view) {
    permissionActions.filter(([key]) => key !== "can_view").forEach(([key]) => { next[key] = false; });
  }
  if (permissionActions.some(([key]) => key !== "can_view" && next[key])) next.can_view = true;
  next.permission_id = String(next.permission_id || `${next.role_name}-${next.node_key}`).trim();
  next.allowed_branches = Array.isArray(next.allowed_branches) ? next.allowed_branches : [];
  next.allowed_departments = Array.isArray(next.allowed_departments) ? next.allowed_departments : [];
  return next;
};

export const buildPermissionTree = (nodes = []) => {
  const map = Object.fromEntries(nodes.map((n) => [n.node_key, { ...n, children: [] }]));
  const roots = [];
  Object.values(map).forEach((n) => {
    if (n.parent_id && map[n.parent_id]) map[n.parent_id].children.push(n);
    else roots.push(n);
  });
  const sort = (list) => list.sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)).map((n) => ({ ...n, children: sort(n.children || []) }));
  return sort(roots);
};

export const flattenPermissionTree = (nodes = []) => nodes.flatMap((n) => [n, ...flattenPermissionTree(n.children || [])]);

export const treePermissionsService = {
  async ensureDefaultNodes() {
    const payload = defaultPermissionTreeNodes.map((n) => ({ ...n, created_at: new Date().toISOString() }));
    const { error } = await supabase.from("app_permission_nodes").upsert(payload, { onConflict: "node_key" }).select();
    if (error) throw error;
  },
  async loadPermissionTree() {
    try {
      let rows = await supabase.select("app_permission_nodes", "select=*&order=sort_order.asc");
      if (!rows?.length) {
        await this.ensureDefaultNodes();
        rows = await supabase.select("app_permission_nodes", "select=*&order=sort_order.asc");
      }
      return buildPermissionTree((rows || []).map(nodeFromDb));
    } catch (error) {
      console.error("Tree permissions error:", error);
      throw new Error("فشل تحميل شجرة الصلاحيات: " + error.message);
    }
  },
  async loadRoleNodePermissions(roleName) {
    try {
      if (!roleName) throw new Error("يجب تحديد الدور أولًا");
      const rows = await supabase.select("app_role_node_permissions", `role_name=eq.${encodeURIComponent(roleName)}&select=*`);
      return (rows || []).map(permissionFromDb);
    } catch (error) {
      console.error("Tree permissions error:", error);
      throw new Error("فشل تحميل صلاحيات الدور: " + error.message);
    }
  },
  async saveNodePermission(roleName, nodeKey, permission) {
    try {
      const payload = normalizeTreePermission({ ...permission, role_name: roleName, node_key: nodeKey, updated_at: new Date().toISOString() });
      const { data, error } = await supabase.from("app_role_node_permissions").upsert(payload, { onConflict: "permission_id" }).select().single();
      if (error) throw error;
      return permissionFromDb(data);
    } catch (error) {
      console.error("Tree permissions error:", error);
      throw new Error("فشل حفظ صلاحية البند: " + error.message);
    }
  },
  async saveBulkNodePermissions(roleName, permissions = []) {
    try {
      if (!roleName) throw new Error("يجب تحديد الدور أولًا");
      const payload = permissions.map((p) => normalizeTreePermission({ ...p, role_name: roleName, permission_id: `${roleName}-${p.node_key}`, updated_at: new Date().toISOString() }));
      if (!payload.length) return [];
      const { data, error } = await supabase.from("app_role_node_permissions").upsert(payload, { onConflict: "permission_id" }).select();
      if (error) throw error;
      return (data || []).map(permissionFromDb);
    } catch (error) {
      console.error("Tree permissions error:", error);
      throw new Error("فشل حفظ صلاحيات الشجرة: " + error.message);
    }
  },
  async copyRolePermissions(sourceRole, targetRole) {
    const rows = await this.loadRoleNodePermissions(sourceRole);
    return this.saveBulkNodePermissions(targetRole, rows.map((r) => ({ ...r, role_name: targetRole, permission_id: `${targetRole}-${r.node_key}` })));
  },
  async resetRolePermissions(roleName) {
    const nodes = flattenPermissionTree(await this.loadPermissionTree());
    return this.saveBulkNodePermissions(roleName, nodes.map((n) => blankPermission(roleName, n.node_key)));
  },
  getNodePermission(rows, roleName, nodeKey) {
    return rows.find((p) => p.role_name === roleName && p.node_key === nodeKey) || blankPermission(roleName, nodeKey);
  },
  hasNodePermission(rows, roleName, nodeKey, action = "can_view") {
    return this.getNodePermission(rows, roleName, nodeKey)[action] === true;
  },
};
