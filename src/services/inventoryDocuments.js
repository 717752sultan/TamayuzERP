import { supabase } from "./supabase";
import { inventoryService } from "./inventory";

export const inventoryDocumentConfigs = {
  purchase_requests: {
    table: "inventory_purchase_requests",
    detailTable: "inventory_purchase_request_details",
    idKey: "request_id",
    numberKey: "request_number",
    dateKey: "request_date",
    label: "طلب شراء",
  },
  purchase_orders: {
    table: "inventory_purchase_orders",
    detailTable: "inventory_purchase_order_details",
    idKey: "po_id",
    numberKey: "po_number",
    dateKey: "po_date",
    label: "أمر شراء",
  },
  receipts: {
    table: "inventory_receipts",
    detailTable: "inventory_receipt_details",
    idKey: "receipt_id",
    numberKey: "receipt_number",
    dateKey: "receipt_date",
    label: "إذن استلام",
  },
  invoices: {
    table: "inventory_purchase_invoices",
    idKey: "invoice_id",
    numberKey: "invoice_number",
    dateKey: "invoice_date",
    label: "فاتورة شراء",
  },
  issues: {
    table: "inventory_issue_vouchers",
    detailTable: "inventory_issue_details",
    idKey: "issue_id",
    numberKey: "issue_number",
    dateKey: "issue_date",
    label: "سند صرف للفروع",
  },
  returns: {
    table: "inventory_return_vouchers",
    detailTable: "inventory_return_details",
    idKey: "return_id",
    numberKey: "return_number",
    dateKey: "return_date",
    label: "سند إرجاع من الفروع",
  },
  transfers: {
    table: "inventory_transfer_vouchers",
    detailTable: "inventory_transfer_details",
    idKey: "transfer_id",
    numberKey: "transfer_number",
    dateKey: "transfer_date",
    label: "سند تحويل مخزني",
  },
  adjustments: {
    table: "inventory_adjustments",
    idKey: "adjustment_id",
    numberKey: "adjustment_number",
    dateKey: "adjustment_date",
    label: "تسوية",
  },
  stocktakes: {
    table: "inventory_stocktakes",
    detailTable: "inventory_stocktake_details",
    idKey: "stocktake_id",
    numberKey: "stocktake_number",
    dateKey: "stocktake_date",
    label: "جرد",
  },
};

const toDocumentDb = (type, doc = {}) => {
  const config = inventoryDocumentConfigs[type];
  const id = String(doc[config.idKey] || doc.id || `${type.toUpperCase()}-${Date.now()}`).trim();
  return {
    [config.idKey]: id,
    [config.numberKey]: String(doc[config.numberKey] || doc.document_number || `${config.label}-${Date.now()}`),
    [config.dateKey]: doc[config.dateKey] || doc.document_date || new Date().toISOString().slice(0, 10),
    supplier_id: String(doc.supplier_id || ""),
    supplier_name: String(doc.supplier_name || ""),
    branch: String(doc.branch || doc.requesting_branch || ""),
    requesting_branch: String(doc.requesting_branch || doc.branch || ""),
    requested_by: String(doc.requested_by || ""),
    requested_by_name: String(doc.requested_by_name || ""),
    priority: String(doc.priority || "عادي"),
    status: String(doc.status || "مسودة"),
    approval_status: String(doc.approval_status || doc.status || "مسودة"),
    approved_by: String(doc.approved_by || ""),
    approved_at: doc.approved_at || null,
    rejection_reason: String(doc.rejection_reason || ""),
    notes: String(doc.notes || ""),
    total_amount: Number(doc.total_amount || doc.invoice_total || doc.net_amount || 0),
    created_at: doc.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

const fromDocumentDb = (type, row = {}) => {
  const config = inventoryDocumentConfigs[type];
  return {
    ...row,
    id: row[config.idKey],
    document_number: row[config.numberKey],
    document_date: row[config.dateKey],
    title: `${config.label} ${row[config.numberKey] || ""}`,
    status: row.status || row.approval_status || "مسودة",
    approval_status: row.approval_status || row.status || "مسودة",
    total_amount: Number(row.total_amount || row.invoice_total || row.net_amount || 0),
  };
};

const toDetailDb = (type, parentId, detail = {}) => {
  const config = inventoryDocumentConfigs[type];
  const detailIdKey = `${config.idKey.replace("_id", "")}_detail_id`;
  return {
    [detailIdKey]: String(detail[detailIdKey] || detail.detail_id || `${parentId}-D-${Date.now()}-${Math.random().toString(16).slice(2)}`),
    [config.idKey]: parentId,
    item_id: String(detail.item_id || ""),
    item_code: String(detail.item_code || ""),
    item_name: String(detail.item_name || ""),
    category: String(detail.category || ""),
    unit_type: String(detail.unit_type || ""),
    requested_quantity: Number(detail.requested_quantity || detail.quantity || 0),
    approved_quantity: Number(detail.approved_quantity || detail.quantity || 0),
    ordered_quantity: Number(detail.ordered_quantity || detail.quantity || 0),
    received_quantity: Number(detail.received_quantity || detail.quantity || 0),
    accepted_quantity: Number(detail.accepted_quantity || detail.quantity || 0),
    rejected_quantity: Number(detail.rejected_quantity || 0),
    quantity_requested: Number(detail.quantity_requested || detail.quantity || 0),
    quantity_approved: Number(detail.quantity_approved || detail.quantity || 0),
    quantity_issued: Number(detail.quantity_issued || detail.quantity || 0),
    returned_quantity: Number(detail.returned_quantity || detail.quantity || 0),
    quantity: Number(detail.quantity || detail.quantity_issued || detail.accepted_quantity || detail.ordered_quantity || 0),
    unit_price: Number(detail.unit_price || detail.unit_cost || 0),
    unit_cost: Number(detail.unit_cost || detail.unit_price || 0),
    total_amount: Number(detail.total_amount || detail.total_value || 0),
    total_value: Number(detail.total_value || detail.total_amount || 0),
    notes: String(detail.notes || ""),
  };
};

export const inventoryDocumentsService = {
  async loadDocuments(type) {
    const config = inventoryDocumentConfigs[type];
    try {
      const rows = await supabase.select(config.table, `select=*&order=${config.dateKey}.desc`);
      return (rows || []).map((row) => fromDocumentDb(type, row));
    } catch (error) {
      console.error(`Supabase ${config.table} load/save error:`, error);
      throw new Error("فشل تحميل البيانات: " + error.message);
    }
  },
  async loadDetails(type, id) {
    const config = inventoryDocumentConfigs[type];
    if (!config.detailTable) return [];
    try {
      return await supabase.select(config.detailTable, `${config.idKey}=eq.${encodeURIComponent(id)}&select=*`);
    } catch (error) {
      console.error(`Supabase ${config.detailTable} load/save error:`, error);
      throw new Error("فشل تحميل تفاصيل المستند: " + error.message);
    }
  },
  async saveDocument(type, doc, details = []) {
    const config = inventoryDocumentConfigs[type];
    try {
      const payload = toDocumentDb(type, doc);
      const { data, error } = await supabase.from(config.table).upsert(payload, { onConflict: config.idKey }).select().single();
      if (error) throw error;
      if (config.detailTable && details.length) {
        const rows = details.map((detail) => toDetailDb(type, payload[config.idKey], detail));
        const result = await supabase.from(config.detailTable).upsert(rows).select();
        if (result.error) throw result.error;
      }
      return fromDocumentDb(type, data);
    } catch (error) {
      console.error(`Supabase ${config.table} load/save error:`, error);
      throw new Error("فشل حفظ البيانات: " + error.message);
    }
  },
  async deleteDocument(type, id) {
    const config = inventoryDocumentConfigs[type];
    try {
      return await supabase.request(`/rest/v1/${config.table}?${config.idKey}=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error(`Supabase ${config.table} delete error:`, error);
      throw new Error("فشل حذف السجل: " + error.message);
    }
  },
  async updateStatus(type, doc, status, extra = {}) {
    return this.saveDocument(type, { ...doc, status, approval_status: extra.approval_status || status, ...extra });
  },
  async postStock(type, doc, details = [], user = "") {
    const movementTypeByDoc = {
      receipts: "استلام شراء",
      issues: "صرف فرع",
      returns: "إرجاع فرع",
      transfers: "تحويل مخزني",
      adjustments: doc.adjustment_type === "زيادة" ? "تسوية زيادة" : "تسوية نقص",
      stocktakes: "فرق جرد",
    };
    const movementType = movementTypeByDoc[type] || "ترحيل مخزني";
    const signIn = ["receipts", "returns"].includes(type) || (type === "adjustments" && doc.adjustment_type === "زيادة");
    const rows = details.length ? details : [doc];
    const movements = [];
    for (const detail of rows) {
      const qty = Number(detail.accepted_quantity || detail.quantity_issued || detail.returned_quantity || detail.quantity || 0);
      const unitCost = Number(detail.unit_cost || detail.unit_price || doc.unit_cost || 0);
      const movement = await inventoryService.saveMovement({
        movement_date: doc.document_date || doc.receipt_date || doc.issue_date || doc.adjustment_date || new Date().toISOString().slice(0, 10),
        item_id: detail.item_id || doc.item_id,
        item_code: detail.item_code || doc.item_code,
        item_name: detail.item_name || doc.item_name,
        location: detail.location || "المخزن المركزي",
        branch: doc.branch || doc.requesting_branch || "",
        movement_type: movementType,
        source_module: type,
        source_id: doc.id,
        source_number: doc.document_number,
        quantity_in: signIn ? qty : 0,
        quantity_out: signIn ? 0 : qty,
        unit_cost: unitCost,
        total_value: qty * unitCost,
        created_by: user,
      });
      movements.push(movement);
    }
    await this.updateStatus(type, doc, "مرحل", { approval_status: "مرحل" });
    return movements;
  },
  subscribe(type, onChange) {
    return supabase.subscribeToTable(inventoryDocumentConfigs[type].table, onChange);
  },
};
