import * as XLSX from "xlsx";
import { inventoryService } from "./inventory";
import { exportWorkbook } from "./reportExport";

const headers = ["كود الصنف", "اسم الصنف", "التصنيف", "الوحدة", "الباركود", "سعر الشراء", "سعر البيع", "الحد الأدنى للمخزون", "الرصيد الافتتاحي", "المخزن", "الحالة", "ملاحظات"];
const val = (row, keys) => keys.map((k) => row[k]).find((v) => v !== undefined && v !== null && String(v).trim() !== "") || "";
const num = (v) => Number(String(v || 0).replace(/,/g, "")) || 0;

export const downloadInventoryItemsTemplate = () => exportWorkbook([{ name: "الأصناف", rows: [Object.fromEntries(headers.map((h) => [h, ""]))] }], "inventory-items-template.xlsx");

export const parseInventoryItemsExcel = async (file, existingItems = [], mode = "skip") => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", blankrows: false, raw: true });
  const codes = new Set(existingItems.map((item) => String(item.item_code || "").trim()).filter(Boolean));
  return rows.map((raw, index) => {
    const item_code = String(val(raw, ["كود الصنف", "item_code", "code"])).trim();
    const row = {
      rowNumber: index + 2,
      item_id: existingItems.find((item) => item.item_code === item_code)?.item_id || `ITM-${item_code || Date.now()}-${index}`,
      item_code,
      item_name: String(val(raw, ["اسم الصنف", "item_name", "name"])).trim(),
      category: String(val(raw, ["التصنيف", "category"])).trim(),
      unit_type: String(val(raw, ["الوحدة", "unit", "unit_type"])).trim(),
      barcode: String(val(raw, ["الباركود", "barcode"])).trim(),
      default_unit_cost: num(val(raw, ["سعر الشراء", "purchase_price", "default_unit_cost"])),
      sale_price: num(val(raw, ["سعر البيع", "sale_price"])),
      minimum_stock: num(val(raw, ["الحد الأدنى للمخزون", "min_stock", "minimum_stock"])),
      opening_balance: num(val(raw, ["الرصيد الافتتاحي", "opening_balance"])),
      warehouse: String(val(raw, ["المخزن", "warehouse"])).trim(),
      is_active: !["معطل", "غير نشط", "false"].includes(String(val(raw, ["الحالة", "status"])).trim()),
      notes: String(val(raw, ["ملاحظات", "notes"])),
    };
    const errors = [];
    if (!row.item_code) errors.push("كود الصنف مطلوب");
    if (!row.item_name) errors.push("اسم الصنف مطلوب");
    if (!row.unit_type) errors.push("الوحدة مطلوبة");
    if (!row.category) errors.push("التصنيف مطلوب");
    if (codes.has(row.item_code) && mode !== "update") errors.push("كود الصنف موجود مسبقًا");
    return { ...row, valid: errors.length === 0, errors };
  });
};

export const saveInventoryItemsImportRows = async (rows = []) => {
  let insertedRows = 0;
  let updatedRows = 0;
  for (const row of rows.filter((r) => r.valid)) {
    await inventoryService.saveInventoryItem(row);
    if (String(row.item_id || "").includes(row.item_code)) insertedRows += 1; else updatedRows += 1;
  }
  return { totalRows: rows.length, validRows: rows.filter((r) => r.valid).length, invalidRows: rows.filter((r) => !r.valid).length, insertedRows, updatedRows };
};

export const exportInventoryItems = (items = []) => exportWorkbook([{ name: "الأصناف", rows: items }], "inventory-items.xlsx");
