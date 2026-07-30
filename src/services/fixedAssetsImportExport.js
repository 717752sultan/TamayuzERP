import * as XLSX from "xlsx";
import { fixedAssetsService } from "./fixedAssets";
import { parseOperationDate } from "./dailyOperationsImportExport";
import { exportWorkbook } from "./reportExport";
import { buildDepreciationSchedule } from "./assetDepreciation";

const assetHeaders = ["كود الأصل", "اسم الأصل", "التصنيف", "الفرع", "الموقع", "الموظف المسؤول", "تاريخ الشراء", "تكلفة الشراء", "القيمة التخريدية", "العمر الافتراضي", "طريقة الإهلاك", "الحالة", "المورد", "رقم الفاتورة", "ملاحظات"];
const maintenanceHeaders = ["كود الأصل", "تاريخ الصيانة", "نوع الصيانة", "تكلفة الصيانة", "المزود", "الحالة", "ملاحظات"];
const val = (row, keys) => keys.map((k) => row[k]).find((v) => v !== undefined && v !== null && String(v).trim() !== "") || "";
const num = (v) => Number(String(v || 0).replace(/,/g, "")) || 0;

export const downloadFixedAssetsTemplate = () => exportWorkbook([{ name: "سجل الأصول", rows: [Object.fromEntries(assetHeaders.map((h) => [h, ""]))] }, { name: "الصيانة", rows: [Object.fromEntries(maintenanceHeaders.map((h) => [h, ""]))] }], "fixed-assets-template.xlsx");

export const parseFixedAssetsExcel = async (file, existingAssets = []) => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", blankrows: false, raw: true });
  return rows.map((raw, index) => {
    const asset_code = String(val(raw, ["كود الأصل", "asset_code"])).trim();
    const existing = existingAssets.find((asset) => asset.asset_code === asset_code);
    const row = {
      rowNumber: index + 2,
      asset_id: existing?.asset_id || `AST-${asset_code || Date.now()}-${index}`,
      asset_code,
      asset_name: String(val(raw, ["اسم الأصل", "asset_name"])).trim(),
      category_name: String(val(raw, ["التصنيف", "category"])).trim(),
      branch: String(val(raw, ["الفرع", "branch"])).trim(),
      location: String(val(raw, ["الموقع", "location"])).trim(),
      custodian_employee_name: String(val(raw, ["الموظف المسؤول", "custodian"])).trim(),
      purchase_date: parseOperationDate(val(raw, ["تاريخ الشراء", "purchase_date"])),
      purchase_cost: num(val(raw, ["تكلفة الشراء", "purchase_cost"])),
      residual_value: num(val(raw, ["القيمة التخريدية", "salvage_value", "residual_value"])),
      useful_life_months: num(val(raw, ["العمر الافتراضي", "useful_life", "useful_life_months"])) || 60,
      depreciation_method: String(val(raw, ["طريقة الإهلاك", "depreciation_method"]) || "القسط الثابت"),
      status: String(val(raw, ["الحالة", "status"]) || "نشط"),
      supplier_name: String(val(raw, ["المورد", "supplier"])),
      invoice_number: String(val(raw, ["رقم الفاتورة", "invoice_number"])),
      notes: String(val(raw, ["ملاحظات", "notes"])),
    };
    const errors = [];
    if (!row.asset_code) errors.push("كود الأصل مطلوب");
    if (!row.asset_name) errors.push("اسم الأصل مطلوب");
    if (!row.purchase_date) errors.push("تاريخ الشراء مطلوب أو غير صحيح");
    return { ...row, valid: errors.length === 0, errors };
  });
};

export const parseAssetMaintenanceExcel = async (file, assets = []) => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", blankrows: false, raw: true });
  return rows.map((raw, index) => {
    const asset_code = String(val(raw, ["كود الأصل", "asset_code"])).trim();
    const asset = assets.find((item) => item.asset_code === asset_code);
    const row = {
      rowNumber: index + 2,
      asset_id: asset?.asset_id || "",
      asset_code,
      asset_name: asset?.asset_name || "",
      maintenance_date: parseOperationDate(val(raw, ["تاريخ الصيانة", "maintenance_date"])),
      maintenance_type: String(val(raw, ["نوع الصيانة", "maintenance_type"]) || "وقائية"),
      cost: num(val(raw, ["تكلفة الصيانة", "cost"])),
      provider_name: String(val(raw, ["المزود", "provider"])),
      status: String(val(raw, ["الحالة", "status"]) || "قيد المراجعة"),
      notes: String(val(raw, ["ملاحظات", "notes"])),
    };
    const errors = [];
    if (!asset) errors.push("لم يتم العثور على الأصل");
    if (!row.maintenance_date) errors.push("تاريخ الصيانة مطلوب أو غير صحيح");
    return { ...row, valid: errors.length === 0, errors };
  });
};

export const saveFixedAssetsRows = async (rows = [], companyId) => {
  for (const row of rows.filter((r) => r.valid)) await fixedAssetsService.saveFixedAsset({ ...row, company_id: companyId });
  return { totalRows: rows.length, validRows: rows.filter((r) => r.valid).length, invalidRows: rows.filter((r) => !r.valid).length };
};

export const saveAssetMaintenanceRows = async (rows = [], companyId) => {
  for (const row of rows.filter((r) => r.valid)) await fixedAssetsService.saveAssetMaintenance({ ...row, company_id: companyId });
  return { totalRows: rows.length, validRows: rows.filter((r) => r.valid).length, invalidRows: rows.filter((r) => !r.valid).length };
};

export const exportFixedAssetsRegister = (assets = []) => exportWorkbook([{ name: "سجل الأصول", rows: assets }], "fixed-assets-register.xlsx");
export const exportDepreciationSchedule = (asset, options) => exportWorkbook([{ name: "جدول الإهلاك", rows: buildDepreciationSchedule(asset, options) }], "asset-depreciation-schedule.xlsx");
