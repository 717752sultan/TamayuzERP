import * as XLSX from "xlsx";
import { dailyOperationsService } from "./dailyOperations";

const arabicHeaders = {
  operation_date: "التاريخ",
  employee_id: "الرقم الوظيفي",
  employee_name: "اسم الموظف",
  branch: "الفرع",
  job_name: "الوظيفة",
  operation_type: "نوع العملية",
  operation_count: "عدد العمليات",
  error_count: "عدد الأخطاء",
  error_rate: "نسبة الأخطاء",
  status: "الحالة",
  notes: "ملاحظات",
  created_at: "تاريخ الإدخال",
  company_id: "الشركة",
};

const headerMap = {
  "التاريخ": "operation_date",
  date: "operation_date",
  operation_date: "operation_date",
  "الرقم الوظيفي": "employee_id",
  employee_id: "employee_id",
  "اسم الموظف": "employee_name",
  employee_name: "employee_name",
  "الفرع": "branch",
  branch: "branch",
  "الوظيفة": "job_name",
  job: "job_name",
  job_name: "job_name",
  "نوع العملية": "operation_type",
  operation_type: "operation_type",
  "عدد العمليات": "operation_count",
  operation_count: "operation_count",
  "عدد الأخطاء": "error_count",
  error_count: "error_count",
  "الحالة": "status",
  status: "status",
  "ملاحظات": "notes",
  notes: "notes",
};

const validStatuses = ["مسودة", "معتمدة", "مرفوضة", "قيد المراجعة"];
const validOperationTypes = ["حوالات وارد", "حوالات صادر", "واتساب وارد", "واتساب صادر", "بيع وشراء عملات", "عد نقدي", "خدمة عملاء", "أخرى"];

export const calculateErrorRate = (totalOperations, errorCount) => {
  const total = Number(totalOperations || 0);
  const errors = Number(errorCount || 0);
  return total > 0 ? Number(((errors / total) * 100).toFixed(2)) : 0;
};

const excelDateToIso = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m && parsed?.d) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString().slice(0, 10);
};

export const mapArabicColumnsToFields = (row = {}) =>
  Object.entries(row || {}).reduce((acc, [key, value]) => {
    const normalizedKey = headerMap[String(key || "").trim()];
    if (normalizedKey) acc[normalizedKey] = value;
    return acc;
  }, {});

export const normalizeDailyOperationRow = (row = {}) => {
  const mapped = mapArabicColumnsToFields(row);
  const operationDate = excelDateToIso(mapped.operation_date);
  const operationCount = Number(mapped.operation_count || 0);
  const errorCount = Number(mapped.error_count || 0);
  return {
    operation_id: row.operation_id || row.id || "",
    operation_date: operationDate,
    month: operationDate ? operationDate.slice(0, 7) : "",
    employee_id: String(mapped.employee_id || "").trim(),
    employee_name: String(mapped.employee_name || "").trim(),
    branch: String(mapped.branch || "").trim(),
    job_name: String(mapped.job_name || "").trim(),
    operation_type: String(mapped.operation_type || "").trim(),
    operation_count: Number.isFinite(operationCount) ? operationCount : 0,
    error_count: Number.isFinite(errorCount) ? errorCount : 0,
    error_rate: calculateErrorRate(operationCount, errorCount),
    status: String(mapped.status || "مسودة").trim(),
    notes: String(mapped.notes || "").trim(),
  };
};

export async function parseDailyOperationsExcel(file) {
  if (!file) throw new Error("لم يتم اختيار ملف");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rows.map((row, index) => ({ rowNumber: index + 2, ...normalizeDailyOperationRow(row) }));
}

export function validateDailyOperationsRows(rows = [], employees = [], currentCompanyId = "") {
  const employeeList = Array.isArray(employees) ? employees : [];
  return (Array.isArray(rows) ? rows : []).map((row, index) => {
    const errors = [];
    const warnings = [];
    let employee = null;
    if (!currentCompanyId) errors.push("لم يتم تحديد الشركة الحالية");
    if (!row.operation_date || Number.isNaN(new Date(`${row.operation_date}T12:00:00`).getTime())) errors.push("التاريخ مطلوب أو غير صحيح");
    if (!row.employee_id && !row.employee_name) errors.push("الرقم الوظيفي أو اسم الموظف مطلوب");
    if (!row.operation_type) errors.push("نوع العملية مطلوب");
    if (!validOperationTypes.includes(row.operation_type)) warnings.push("نوع العملية غير موجود ضمن القائمة المعتمدة");
    if (row.operation_count === "" || Number(row.operation_count) < 0) errors.push("عدد العمليات يجب أن يكون رقمًا أكبر أو يساوي صفر");
    if (Number(row.error_count || 0) < 0) errors.push("عدد الأخطاء يجب أن يكون رقمًا أكبر أو يساوي صفر");
    if (Number(row.error_count || 0) > Number(row.operation_count || 0)) errors.push("عدد الأخطاء لا يجب أن يتجاوز عدد العمليات");
    if (!validStatuses.includes(row.status)) warnings.push("الحالة غير موجودة ضمن الحالات المعتمدة وسيتم حفظها كما هي");

    if (row.employee_id) employee = employeeList.find((item) => String(item.id || item.employee_id || "") === String(row.employee_id));
    if (!employee && row.employee_name) employee = employeeList.find((item) => String(item.name || item.employee_name || "").trim() === String(row.employee_name).trim());
    if (!employee && row.employee_name) warnings.push("لم يتم العثور على الموظف في جدول الموظفين، وسيتم الاستيراد بالاسم الموجود");

    const normalized = {
      ...row,
      rowNumber: row.rowNumber || index + 2,
      company_id: currentCompanyId,
      employee_id: row.employee_id || employee?.id || employee?.employee_id || "",
      employee_name: row.employee_name || employee?.name || employee?.employee_name || "",
      branch: row.branch || employee?.branch || "",
      job_name: row.job_name || employee?.job || "",
      completed_count: Number(row.operation_count || 0) - Number(row.error_count || 0),
      source: "excel_import",
      imported_at: new Date().toISOString(),
    };

    return {
      ...normalized,
      valid: errors.length === 0,
      warning: warnings.length > 0,
      errors,
      warnings,
      validationMessage: errors.length ? errors.join("، ") : warnings.length ? warnings.join("، ") : "صحيح",
    };
  });
}

export async function importDailyOperationsRows(rows = [], currentCompanyId = "", options = {}) {
  if (!currentCompanyId) throw new Error("لم يتم تحديد الشركة الحالية");
  const validRows = (Array.isArray(rows) ? rows : []).filter((row) => row.valid);
  if (!validRows.length) throw new Error("لا توجد بيانات صالحة للاستيراد");

  const existingRows = await dailyOperationsService.loadDailyOperations({}).catch(() => []);
  const existingByKey = new Map(
    (Array.isArray(existingRows) ? existingRows : []).map((row) => [
      `${row.operation_date}-${row.employee_id}-${row.operation_type}`,
      row,
    ]),
  );

  const saved = [];
  let skipped = 0;
  for (const row of validRows) {
    const duplicateKey = `${row.operation_date}-${row.employee_id}-${row.operation_type}`;
    const existing = existingByKey.get(duplicateKey);
    if (existing && options.duplicateMode === "ignore") {
      skipped += 1;
      continue;
    }
    const payload = {
      ...(existing && options.duplicateMode === "update" ? existing : {}),
      ...row,
      operation_id: existing && options.duplicateMode === "update" ? existing.operation_id : row.operation_id || `OP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      company_id: currentCompanyId,
      updated_at: new Date().toISOString(),
    };
    saved.push(await dailyOperationsService.saveDailyOperation(payload));
  }
  return { saved, skipped };
}

export function exportDailyOperationsToExcel(rows = [], fileName = "daily-operations.xlsx") {
  const exportRows = (Array.isArray(rows) ? rows : []).map((row) => ({
    [arabicHeaders.operation_date]: row.operation_date || "",
    [arabicHeaders.employee_id]: row.employee_id || "",
    [arabicHeaders.employee_name]: row.employee_name || "",
    [arabicHeaders.branch]: row.branch || "",
    [arabicHeaders.job_name]: row.job_name || row.job || "",
    [arabicHeaders.operation_type]: row.operation_type || "",
    [arabicHeaders.operation_count]: Number(row.operation_count || 0),
    [arabicHeaders.error_count]: Number(row.error_count || 0),
    [arabicHeaders.error_rate]: row.error_rate ?? calculateErrorRate(row.operation_count, row.error_count),
    [arabicHeaders.status]: row.status || "",
    [arabicHeaders.notes]: row.notes || "",
    [arabicHeaders.created_at]: row.created_at || "",
    [arabicHeaders.company_id]: row.company_id || "",
  }));
  const ws = XLSX.utils.json_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "العمليات اليومية");
  XLSX.writeFile(wb, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}

export function downloadDailyOperationsTemplate() {
  const rows = [{
    "التاريخ": new Date().toISOString().slice(0, 10),
    "الرقم الوظيفي": "EMP-001",
    "اسم الموظف": "اسم الموظف",
    "الفرع": "الإدارة",
    "الوظيفة": "موارد بشرية",
    "نوع العملية": "حوالات وارد",
    "عدد العمليات": 120,
    "عدد الأخطاء": 0,
    "الحالة": "معتمدة",
    "ملاحظات": "لا توجد",
  }];
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "نموذج العمليات اليومية");
  XLSX.writeFile(wb, "daily-operations-template.xlsx");
}

export const exportDailyOperationsTemplate = downloadDailyOperationsTemplate;
