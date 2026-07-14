import { supabase } from "./supabase";
import { inventoryService, calculateInventoryLineTotal, getInventoryCurrency } from "./inventory";

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
    currency_code: String(doc.currency_code || "YER"),
    currency_name: String(doc.currency_name || getInventoryCurrency(doc.currency_code || "YER").currency_name),
    exchange_rate: Number(doc.exchange_rate || getInventoryCurrency(doc.currency_code || "YER").exchange_rate || 1),
    base_currency_code: String(doc.base_currency_code || "YER"),
    total_amount: Number(doc.total_amount || doc.invoice_total || doc.net_amount || doc.total_value || 0),
    total_value: Number(doc.total_value || doc.total_amount || doc.invoice_total || doc.net_amount || 0),
    total_value_base: Number(doc.total_value_base || 0),
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
    total_value: Number(row.total_value || row.total_amount || row.invoice_total || row.net_amount || 0),
    total_value_base: Number(row.total_value_base || 0),
    currency_code: row.currency_code || "YER",
    currency_name: row.currency_name || getInventoryCurrency(row.currency_code || "YER").currency_name,
    exchange_rate: Number(row.exchange_rate || 1),
    base_currency_code: row.base_currency_code || "YER",
  };
};

const cleanText = (value, fallback = "") => String(value || fallback).trim();
const today = () => new Date().toISOString().slice(0, 10);
const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeIssueVoucherForDb = (voucher = {}) => {
  const id = cleanText(voucher.issue_id || voucher.id, `ISS-${Date.now()}`);
  const number = cleanText(voucher.issue_number || voucher.document_number || voucher.number, id);
  return {
    issue_id: id,
    issue_number: number,
    issue_date: voucher.issue_date || voucher.document_date || voucher.date || today(),
    branch: cleanText(voucher.branch || voucher.to_branch || voucher.destination_branch, "غير محدد"),
    requested_by: cleanText(voucher.requested_by || voucher.created_by, "غير محدد"),
    issued_by: cleanText(voucher.issued_by || voucher.created_by, "مسؤول المخزون"),
    received_by: cleanText(voucher.received_by),
    status: cleanText(voucher.status, "مسودة"),
    approval_status: cleanText(voucher.approval_status || voucher.status, "مسودة"),
    approved_by: cleanText(voucher.approved_by),
    approved_at: voucher.approved_at || null,
    rejection_reason: cleanText(voucher.rejection_reason),
    notes: cleanText(voucher.notes),
    currency_code: cleanText(voucher.currency_code, "YER"),
    currency_name: cleanText(voucher.currency_name, getInventoryCurrency(voucher.currency_code || "YER").currency_name),
    exchange_rate: Number(voucher.exchange_rate || getInventoryCurrency(voucher.currency_code || "YER").exchange_rate || 1),
    base_currency_code: cleanText(voucher.base_currency_code, "YER"),
    total_amount: Number(voucher.total_amount || voucher.net_amount || voucher.total_value || 0),
    total_value: Number(voucher.total_value || voucher.total_amount || voucher.net_amount || 0),
    total_value_base: Number(voucher.total_value_base || 0),
    created_at: voucher.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

const normalizeIssueDetailForDb = (detail = {}, issueId) => {
  const quantity = Number(detail.quantity_issued || detail.quantity_approved || detail.quantity_requested || detail.quantity || 0);
  const unitCost = Number(detail.unit_cost || detail.unit_price || detail.default_unit_cost || 0);
  const totals = calculateInventoryLineTotal({ ...detail, quantity, unit_cost: unitCost });
  return {
    issue_detail_id: cleanText(detail.issue_detail_id || detail.id || detail.detail_id, makeId("ISD")),
    issue_id: issueId,
    item_id: cleanText(detail.item_id || detail.itemId),
    item_code: cleanText(detail.item_code || detail.itemCode, "بدون كود"),
    item_name: cleanText(detail.item_name || detail.itemName || detail.name, "صنف غير محدد"),
    category: cleanText(detail.category, "أخرى"),
    unit_type: cleanText(detail.unit_type || detail.unit, "حبة"),
    quantity_requested: Number(detail.quantity_requested || quantity),
    quantity_approved: Number(detail.quantity_approved || quantity),
    quantity_issued: quantity,
    unit_cost: unitCost,
    unit_price: unitCost,
    currency_code: totals.currency_code,
    currency_name: totals.currency_name,
    exchange_rate: totals.exchange_rate,
    base_currency_code: totals.base_currency_code,
    total_value: totals.total_value,
    total_amount: totals.total_value,
    total_value_base: totals.total_value_base,
    notes: cleanText(detail.notes),
  };
};

const normalizeTransferVoucherForDb = (transfer = {}) => {
  const id = cleanText(transfer.transfer_id || transfer.id, `TRF-${Date.now()}`);
  const number = cleanText(transfer.transfer_number || transfer.document_number || transfer.number, id);
  return {
    transfer_id: id,
    transfer_number: number,
    transfer_date: transfer.transfer_date || transfer.document_date || transfer.date || today(),
    from_location: cleanText(transfer.from_location || transfer.from_branch || transfer.source_branch, "المخزن الرئيسي"),
    to_location: cleanText(transfer.to_location || transfer.to_branch || transfer.branch, "غير محدد"),
    transferred_by: cleanText(transfer.transferred_by || transfer.created_by, "مسؤول المخزون"),
    received_by: cleanText(transfer.received_by),
    status: cleanText(transfer.status, "مسودة"),
    approval_status: cleanText(transfer.approval_status || transfer.status, "مسودة"),
    notes: cleanText(transfer.notes),
    currency_code: cleanText(transfer.currency_code, "YER"),
    currency_name: cleanText(transfer.currency_name, getInventoryCurrency(transfer.currency_code || "YER").currency_name),
    exchange_rate: Number(transfer.exchange_rate || getInventoryCurrency(transfer.currency_code || "YER").exchange_rate || 1),
    base_currency_code: cleanText(transfer.base_currency_code, "YER"),
    total_amount: Number(transfer.total_amount || transfer.total_value || 0),
    total_value: Number(transfer.total_value || transfer.total_amount || 0),
    total_value_base: Number(transfer.total_value_base || 0),
    created_at: transfer.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

const normalizeTransferDetailForDb = (detail = {}, transferId) => {
  const quantity = Number(detail.quantity || detail.quantity_issued || 0);
  const unitCost = Number(detail.unit_cost || detail.unit_price || detail.default_unit_cost || 0);
  const totals = calculateInventoryLineTotal({ ...detail, quantity, unit_cost: unitCost });
  return {
    transfer_detail_id: cleanText(detail.transfer_detail_id || detail.id || detail.detail_id, makeId("TRD")),
    transfer_id: transferId,
    item_id: cleanText(detail.item_id || detail.itemId),
    item_code: cleanText(detail.item_code || detail.itemCode, "بدون كود"),
    item_name: cleanText(detail.item_name || detail.itemName || detail.name, "صنف غير محدد"),
    unit_type: cleanText(detail.unit_type || detail.unit, "حبة"),
    quantity,
    unit_cost: unitCost,
    unit_price: unitCost,
    currency_code: totals.currency_code,
    currency_name: totals.currency_name,
    exchange_rate: totals.exchange_rate,
    base_currency_code: totals.base_currency_code,
    total_value: totals.total_value,
    total_amount: totals.total_value,
    total_value_base: totals.total_value_base,
    notes: cleanText(detail.notes),
  };
};

const normalizeDocumentPayload = (type, doc = {}) => {
  if (type === "issues") return normalizeIssueVoucherForDb(doc);
  if (type === "transfers") return normalizeTransferVoucherForDb(doc);
  return toDocumentDb(type, doc);
};

const normalizeDetailRows = (type, parentId, details = []) => {
  if (type === "issues") return details.map((detail) => normalizeIssueDetailForDb(detail, parentId)).filter((row) => row.item_id && row.quantity_issued > 0);
  if (type === "transfers") return details.map((detail) => normalizeTransferDetailForDb(detail, parentId)).filter((row) => row.item_id && row.quantity > 0);
  return details.map((detail) => toDetailDb(type, parentId, detail));
};

const validateStockDocument = (type, payload, rows) => {
  if (!["issues", "transfers"].includes(type)) return;
  if (!rows.length) throw new Error("يجب إضافة صنف واحد على الأقل");
  if (type === "issues" && !payload.branch) throw new Error("يجب تحديد الفرع");
  if (type === "transfers" && !payload.from_location) throw new Error("يجب تحديد المخزن أو الفرع المصدر");
  if (type === "transfers" && !payload.to_location) throw new Error("يجب تحديد الفرع المستلم");
  rows.forEach((row) => {
    if (!row.item_id) throw new Error("يجب تحديد الصنف");
    if (!row.unit_type) throw new Error("يجب تحديد وحدة القياس");
    const quantity = Number(row.quantity_issued || row.quantity || 0);
    if (!quantity) throw new Error("لا يمكن أن تكون الكمية صفر");
    const balance = Number(row.current_balance ?? row.available_balance ?? row.balance ?? NaN);
    if (!Number.isNaN(balance) && quantity > balance) throw new Error("لا يمكن صرف كمية أكبر من الرصيد المتاح");
  });
};

const toDetailDb = (type, parentId, detail = {}) => {
  const config = inventoryDocumentConfigs[type];
  const detailIdKey = `${config.idKey.replace("_id", "")}_detail_id`;
  const totals = calculateInventoryLineTotal(detail);
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
    quantity: totals.quantity,
    unit_price: totals.unit_price,
    unit_cost: totals.unit_cost,
    currency_code: totals.currency_code,
    currency_name: totals.currency_name,
    exchange_rate: totals.exchange_rate,
    base_currency_code: totals.base_currency_code,
    total_amount: totals.total_value,
    total_value: totals.total_value,
    total_value_base: totals.total_value_base,
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
      console.error(type === "issues" ? "Inventory issue voucher error:" : type === "transfers" ? "Inventory transfer voucher error:" : `Supabase ${config.table} load/save error:`, error);
      if (type === "issues") throw new Error("فشل حفظ سند الصرف: " + error.message);
      if (type === "transfers") throw new Error("فشل حفظ سند التحويل: " + error.message);
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
      const payload = normalizeDocumentPayload(type, doc);
      const parentId = payload[config.idKey];
      const rows = config.detailTable && details.length ? normalizeDetailRows(type, parentId, details) : [];
      if (rows.length) {
        payload.total_amount = rows.reduce((sum, row) => sum + Number(row.total_value || row.total_amount || 0), 0);
        payload.total_value = payload.total_amount;
        payload.total_value_base = rows.reduce((sum, row) => sum + Number(row.total_value_base || 0), 0);
        payload.currency_code = rows[0]?.currency_code || payload.currency_code || "YER";
        payload.currency_name = rows[0]?.currency_name || payload.currency_name || getInventoryCurrency(payload.currency_code).currency_name;
        payload.exchange_rate = rows[0]?.exchange_rate || payload.exchange_rate || 1;
        payload.base_currency_code = "YER";
      }
      if (details.length) validateStockDocument(type, payload, rows);
      const { data, error } = await supabase.from(config.table).upsert(payload, { onConflict: config.idKey }).select().single();
      if (error) throw error;
      if (config.detailTable && rows.length) {
        const result = await supabase.from(config.detailTable).upsert(rows).select();
        if (result.error) throw result.error;
      }
      return fromDocumentDb(type, data);
    } catch (error) {
      console.error(type === "issues" ? "Inventory issue voucher error:" : type === "transfers" ? "Inventory transfer voucher error:" : `Supabase ${config.table} load/save error:`, error);
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
    if (type === "issues") {
      try {
        const voucher = normalizeIssueVoucherForDb(doc);
        const rows = normalizeDetailRows("issues", voucher.issue_id, details.length ? details : [doc]);
        validateStockDocument("issues", voucher, rows);
        const movements = [];
        for (const detail of rows) {
          const movement = await inventoryService.saveMovement({
            movement_date: voucher.issue_date,
            item_id: detail.item_id,
            item_code: detail.item_code,
            item_name: detail.item_name,
            location: voucher.branch,
            branch: voucher.branch,
            movement_type: "صرف فرع",
            source_module: "inventory_issue_vouchers",
            source_id: voucher.issue_id,
            source_number: voucher.issue_number,
            quantity_in: 0,
            quantity_out: detail.quantity_issued,
            unit_cost: detail.unit_cost,
            total_value: detail.total_value,
            total_value_base: detail.total_value_base,
            currency_code: detail.currency_code,
            currency_name: detail.currency_name,
            exchange_rate: detail.exchange_rate,
            notes: detail.notes,
            created_by: user,
          });
          movements.push(movement);
        }
        await this.updateStatus(type, doc, "مرحل", { approval_status: "مرحل" });
        return movements;
      } catch (error) {
        console.error("Inventory issue voucher error:", error);
        throw new Error("فشل تنفيذ حركة المخزون: " + error.message);
      }
    }
    if (type === "transfers") {
      try {
        const voucher = normalizeTransferVoucherForDb(doc);
        const rows = normalizeDetailRows("transfers", voucher.transfer_id, details.length ? details : [doc]);
        validateStockDocument("transfers", voucher, rows);
        const movements = [];
        for (const detail of rows) {
          const outMovement = await inventoryService.saveMovement({
            movement_date: voucher.transfer_date,
            item_id: detail.item_id,
            item_code: detail.item_code,
            item_name: detail.item_name,
            location: voucher.from_location,
            branch: voucher.from_location,
            movement_type: "تحويل صادر",
            source_module: "inventory_transfer_vouchers",
            source_id: voucher.transfer_id,
            source_number: voucher.transfer_number,
            quantity_in: 0,
            quantity_out: detail.quantity,
            unit_cost: detail.unit_cost,
            total_value: detail.total_value,
            total_value_base: detail.total_value_base,
            currency_code: detail.currency_code,
            currency_name: detail.currency_name,
            exchange_rate: detail.exchange_rate,
            notes: detail.notes,
            created_by: user,
          });
          const inMovement = await inventoryService.saveMovement({
            movement_date: voucher.transfer_date,
            item_id: detail.item_id,
            item_code: detail.item_code,
            item_name: detail.item_name,
            location: voucher.to_location,
            branch: voucher.to_location,
            movement_type: "تحويل وارد",
            source_module: "inventory_transfer_vouchers",
            source_id: voucher.transfer_id,
            source_number: voucher.transfer_number,
            quantity_in: detail.quantity,
            quantity_out: 0,
            unit_cost: detail.unit_cost,
            total_value: detail.total_value,
            total_value_base: detail.total_value_base,
            currency_code: detail.currency_code,
            currency_name: detail.currency_name,
            exchange_rate: detail.exchange_rate,
            notes: detail.notes,
            created_by: user,
          });
          movements.push(outMovement, inMovement);
        }
        await this.updateStatus(type, doc, "مرحل", { approval_status: "مرحل" });
        return movements;
      } catch (error) {
        console.error("Inventory transfer voucher error:", error);
        throw new Error("فشل تنفيذ حركة المخزون: " + error.message);
      }
    }
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
        total_value: calculateInventoryLineTotal({ ...detail, quantity: qty, unit_cost: unitCost }).total_value,
        total_value_base: calculateInventoryLineTotal({ ...detail, quantity: qty, unit_cost: unitCost }).total_value_base,
        currency_code: detail.currency_code || doc.currency_code || "YER",
        currency_name: detail.currency_name || doc.currency_name || getInventoryCurrency(detail.currency_code || doc.currency_code || "YER").currency_name,
        exchange_rate: detail.exchange_rate || doc.exchange_rate || getInventoryCurrency(detail.currency_code || doc.currency_code || "YER").exchange_rate,
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
