import { supabase } from "./supabase";

export const defaultInventorySettings = {
  general: {
    main_warehouse_name: "المخزن الرئيسي",
    multi_warehouses: false,
    allow_negative_stock: false,
    allow_edit_posted_documents: false,
    valuation_method: "متوسط التكلفة",
    enable_reorder_point: true,
    require_issue_approval: true,
    enable_periodic_stocktake: true,
    stock_alert_days: 7,
    default_minimum_quantity: 1,
    default_unit: "حبة",
    default_category: "أخرى",
  },
  approvals: {},
};

export const defaultDocumentNumbering = [
  ["purchase_requests", "طلب شراء", "PR"],
  ["purchase_orders", "أمر شراء", "PO"],
  ["receipts", "إذن استلام", "RCV"],
  ["invoices", "فاتورة شراء", "INV"],
  ["issues", "سند صرف", "ISS"],
  ["returns", "سند إرجاع", "RET"],
  ["transfers", "سند تحويل", "TRF"],
  ["adjustments", "تسوية", "ADJ"],
  ["stocktakes", "جرد", "STK"],
].map(([document_type, document_label, prefix]) => ({
  numbering_id: `NUM-${document_type}`,
  document_type,
  document_label,
  prefix,
  next_number: 1,
  reset_yearly: true,
  is_active: true,
}));

const fromSetting = (row = {}) => row.setting_value || {};
const numberingFromDb = (row = {}) => ({
  numbering_id: row.numbering_id,
  document_type: row.document_type || "",
  document_label: row.document_label || "",
  prefix: row.prefix || "",
  next_number: Number(row.next_number || 1),
  reset_yearly: row.reset_yearly !== false,
  is_active: row.is_active !== false,
});
const branchSettingFromDb = (row = {}) => ({
  branch_setting_id: row.branch_setting_id,
  branch: row.branch || "",
  allowed_to_request_items: row.allowed_to_request_items !== false,
  allowed_to_receive_items: row.allowed_to_receive_items !== false,
  max_monthly_issue_limit: Number(row.max_monthly_issue_limit || 0),
  default_receiver: row.default_receiver || "",
  notes: row.notes || "",
  is_active: row.is_active !== false,
});

export const inventorySettingsService = {
  async loadInventorySettings() {
    try {
      const rows = await supabase.select("inventory_settings", "setting_key=eq.general&select=*");
      return rows?.[0] ? { ...defaultInventorySettings, ...fromSetting(rows[0]) } : defaultInventorySettings;
    } catch (error) {
      console.error("Inventory settings error:", error);
      throw new Error("فشل تحميل إعدادات المخزون: " + error.message);
    }
  },
  async saveInventorySettings(settings) {
    try {
      const payload = {
        setting_id: "INV-SET-GENERAL",
        setting_key: "general",
        setting_group: "inventory",
        setting_value: settings,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("inventory_settings").upsert(payload, { onConflict: "setting_id" }).select().single();
      if (error) throw error;
      return fromSetting(data);
    } catch (error) {
      console.error("Inventory settings error:", error);
      throw new Error("فشل حفظ إعدادات المخزون: " + error.message);
    }
  },
  async loadDocumentNumbering() {
    try {
      const rows = await supabase.select("inventory_document_numbering", "select=*&order=document_type.asc");
      return rows?.length ? rows.map(numberingFromDb) : defaultDocumentNumbering;
    } catch (error) {
      console.error("Inventory numbering error:", error);
      throw new Error("فشل تحميل ترقيم مستندات المخزون: " + error.message);
    }
  },
  async saveDocumentNumbering(rows) {
    try {
      const payload = rows.map((row) => ({
        numbering_id: row.numbering_id || `NUM-${row.document_type}`,
        document_type: String(row.document_type || ""),
        document_label: String(row.document_label || ""),
        prefix: String(row.prefix || ""),
        next_number: Number(row.next_number || 1),
        reset_yearly: row.reset_yearly !== false,
        is_active: row.is_active !== false,
        updated_at: new Date().toISOString(),
      })).filter((row) => row.document_type);
      if (!payload.length) return [];
      const { data, error } = await supabase.from("inventory_document_numbering").upsert(payload, { onConflict: "numbering_id" }).select();
      if (error) throw error;
      return (data || []).map(numberingFromDb);
    } catch (error) {
      console.error("Inventory numbering error:", error);
      throw new Error("فشل حفظ ترقيم المستندات: " + error.message);
    }
  },
  generateDocumentNumber(row, year = new Date().getFullYear()) {
    return `${row.prefix}-${year}-${String(row.next_number || 1).padStart(4, "0")}`;
  },
  async loadBranchSettings() {
    try {
      const rows = await supabase.select("inventory_branch_settings", "select=*&order=branch.asc");
      return (rows || []).map(branchSettingFromDb);
    } catch (error) {
      console.error("Inventory branch settings error:", error);
      throw new Error("فشل تحميل إعدادات الفروع المخزنية: " + error.message);
    }
  },
  async saveBranchSetting(row) {
    try {
      const payload = {
        branch_setting_id: row.branch_setting_id || `IBS-${Date.now()}`,
        branch: String(row.branch || ""),
        allowed_to_request_items: row.allowed_to_request_items !== false,
        allowed_to_receive_items: row.allowed_to_receive_items !== false,
        max_monthly_issue_limit: Number(row.max_monthly_issue_limit || 0),
        default_receiver: String(row.default_receiver || ""),
        notes: String(row.notes || ""),
        is_active: row.is_active !== false,
        updated_at: new Date().toISOString(),
      };
      if (!payload.branch) throw new Error("يجب تحديد الفرع");
      const { data, error } = await supabase.from("inventory_branch_settings").upsert(payload, { onConflict: "branch_setting_id" }).select().single();
      if (error) throw error;
      return branchSettingFromDb(data);
    } catch (error) {
      console.error("Inventory branch settings error:", error);
      throw new Error("فشل حفظ إعدادات الفرع: " + error.message);
    }
  },
  async deleteBranchSetting(id) {
    try {
      return await supabase.request(`/rest/v1/inventory_branch_settings?branch_setting_id=eq.${encodeURIComponent(id)}`, { method: "DELETE", prefer: "return=minimal" });
    } catch (error) {
      console.error("Inventory branch settings error:", error);
      throw new Error("فشل حذف إعدادات الفرع: " + error.message);
    }
  },
};
