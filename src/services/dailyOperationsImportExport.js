import * as XLSX from "xlsx";
import { dailyOperationsService, operationTypes } from "./dailyOperations";

const arabicHeaders = {
  operation_date: "التاريخ",
  employee_id: "الرقم الوظيفي",
  employee_name: "اسم الموظف",
  branch: "الفرع",
  job_name: "الوظيفة",
  operation_type: "نوع العملية",
  operation_count: "عدد العمليات",
  error_count: "عدد الأخطاء",
  customer_complaints: "عدد الشكاوى",
  average_service_time: "متوسط وقت الخدمة",
  amount: "المبلغ",
  currency: "العملة",
  notes: "ملاحظات",
};

const headerMap = {
  "التاريخ": "operation_date",
  date: "operation_date",
  operation_date: "operation_date",
  "الرقم الوظيفي": "employee_id",
  employee_id: "employee_id",
  employeeid: "employee_id",
  "اسم الموظف": "employee_name",
  employee_name: "employee_name",
  employeename: "employee_name",
  "الفرع": "branch",
  branch: "branch",
  "الوظيفة": "job_name",
  job: "job_name",
  job_name: "job_name",
  "نوع العملية": "operation_type",
  operation_type: "operation_type",
  operationtype: "operation_type",
  "عدد العمليات": "operation_count",
  operation_count: "operation_count",
  operationcount: "operation_count",
  "عدد الأخطاء": "error_count",
  error_count: "error_count",
  errorcount: "error_count",
  "عدد الشكاوى": "customer_complaints",
  complaints_count: "customer_complaints",
  customer_complaints: "customer_complaints",
  "متوسط وقت الخدمة": "average_service_time",
  average_service_time: "average_service_time",
  averageservicetime: "average_service_time",
  "المبلغ": "amount",
  amount: "amount",
  "العملة": "currency",
  currency: "currency",
  currency_code: "currency",
  "الحالة": "status",
  status: "status",
  "ملاحظات": "notes",
  notes: "notes",
};

const validStatuses = ["مسودة", "معتمدة", "مرفوضة", "قيد المراجعة"];

export const calculateErrorRate = (totalOperations, errorCount) => {
  const total = Number(totalOperations || 0);
  const errors = Number(errorCount || 0);
  return total > 0 ? Number(((errors / total) * 100).toFixed(2)) : 0;
};

const safeNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const normalized = typeof value === "string" ? value.replace(/,/g, "").trim() : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : Number.NaN;
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

const normalizeHeader = (key) => String(key || "").trim().toLowerCase().replace(/[\s-]+/g, "_");

export const mapArabicColumnsToFields = (row = {}) =>
  Object.entries(row || {}).reduce((acc, [key, value]) => {
    const normalizedKey = normalizeHeader(key);
    const targetKey = headerMap[String(key || "").trim()] || headerMap[normalizedKey] || headerMap[normalizedKey.replace(/_/g, "")];
    if (targetKey) acc[targetKey] = value;
    return acc;
  }, {});

export const normalizeDailyOperationRow = (row = {}) => {
  const mapped = mapArabicColumnsToFields(row);
  const operationDate = excelDateToIso(mapped.operation_date);
  const operationCount = safeNumber(mapped.operation_count);
  const errorCount = safeNumber(mapped.error_count);
  const complaints = safeNumber(mapped.customer_complaints);
  const averageServiceTime = safeNumber(mapped.average_service_time);
  const amount = safeNumber(mapped.amount);
  return {
    operation_id: String(row.operation_id || row.id || "").trim(),
    operation_date: operationDate,
    month: operationDate ? operationDate.slice(0, 7) : "",
    employee_id: String(mapped.employee_id || "").trim(),
    employee_name: String(mapped.employee_name || "").trim(),
    branch: String(mapped.branch || "").trim(),
    job_name: String(mapped.job_name || "").trim(),
    operation_type: String(mapped.operation_type || "").trim(),
    operation_count: operationCount,
    error_count: errorCount,
    customer_complaints: complaints,
    average_service_time: averageServiceTime,
    amount,
    currency: String(mapped.currency || "").trim(),
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
  if (!sheet) throw new Error("لا يحتوي الملف على ورقة بيانات");
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
    else if (!operationTypes.includes(row.operation_type)) errors.push("نوع العملية غير مدعوم");

    for (const [key, label] of [
      ["operation_count", "عدد العمليات"],
      ["error_count", "عدد الأخطاء"],
      ["customer_complaints", "عدد الشكاوى"],
      ["average_service_time", "متوسط وقت الخدمة"],
      ["amount", "المبلغ"],
    ]) {
      if (!Number.isFinite(Number(row[key])) || Number(row[key]) < 0) errors.push(`${label} يجب أن يكون رقمًا أكبر من أو يساوي صفر`);
    }
    if (Number(row.error_count || 0) > Number(row.operation_count || 0)) errors.push("عدد الأخطاء لا يجب أن يتجاوز عدد العمليات");
    if (!validStatuses.includes(row.status)) warnings.push("الحالة غير معتمدة وسيتم حفظها كما هي");

    if (row.employee_id) {
      employee = employeeList.find((item) => String(item.id || item.employee_id || "").trim() === String(row.employee_id).trim());
    }
    if (!employee && row.employee_name) {
      const matches = employeeList.filter((item) => String(item.name || item.employee_name || "").trim() === String(row.employee_name).trim());
      if (matches.length === 1) employee = matches[0];
      if (matches.length > 1) errors.push("اسم الموظف مكرر؛ يجب تحديد الرقم الوظيفي");
    }
    if (!employee) errors.push("لم يتم العثور على الموظف داخل الشركة الحالية");

    const normalized = {
      ...row,
      rowNumber: row.rowNumber || index + 2,
      company_id: currentCompanyId,
      employee_id: employee?.id || employee?.employee_id || row.employee_id || "",
      employee_name: employee?.name || employee?.employee_name || row.employee_name || "",
      branch: employee?.branch || row.branch || "",
      job_name: employee?.job || employee?.job_name || row.job_name || "",
      completed_count: Math.max(0, Number(row.operation_count || 0) - Number(row.error_count || 0)),
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

const logicalOperationKey = (row = {}, companyId = "") =>
  [companyId || row.company_id || "", row.operation_date || "", row.employee_id || "", row.operation_type || ""].join("|");

const stableOperationId = (row = {}, companyId = "") =>
  [companyId || row.company_id || "", row.employee_id || "", row.operation_date || "", row.operation_type || ""].join("-");

export async function importDailyOperationsRows(rows = [], currentCompanyId = "", options = {}) {
  if (!currentCompanyId) throw new Error("لم يتم تحديد الشركة الحالية");
  const validRows = (Array.isArray(rows) ? rows : []).filter((row) => row.valid);
  if (!validRows.length) throw new Error("لا توجد بيانات صالحة للاستيراد");

  const existingRows = await dailyOperationsService.loadDailyOperations({});
  const existingByKey = new Map(
    (Array.isArray(existingRows) ? existingRows : []).map((row) => [logicalOperationKey(row, currentCompanyId), row]),
  );

  const saved = [];
  let skipped = 0;
  let inserted = 0;
  let updated = 0;
  for (const row of validRows) {
    const duplicateKey = logicalOperationKey(row, currentCompanyId);
    const existing = existingByKey.get(duplicateKey);
    if (existing && options.duplicateMode === "ignore") {
      skipped += 1;
      continue;
    }
    const payload = {
      ...(existing || {}),
      operation_id: existing?.operation_id || row.operation_id || stableOperationId(row, currentCompanyId),
      company_id: currentCompanyId,
      operation_date: row.operation_date,
      month: row.month,
      employee_id: row.employee_id,
      employee_name: row.employee_name,
      branch: row.branch,
      job_name: row.job_name,
      operation_type: row.operation_type,
      operation_count: Number(row.operation_count || 0),
      error_count: Number(row.error_count || 0),
      completed_count: Number(row.completed_count || 0),
      customer_complaints: Number(row.customer_complaints || 0),
      average_service_time: Number(row.average_service_time || 0),
      amount: Number(row.amount || 0),
      currency: row.currency || "",
      notes: row.notes || "",
      status: row.status || "مسودة",
    };
    const savedRow = await dailyOperationsService.saveDailyOperation(payload);
    saved.push(savedRow);
    if (existing) updated += 1;
    else inserted += 1;
    existingByKey.set(duplicateKey, savedRow);
  }
  return { saved, skipped, inserted, updated };
}

const toExcelRow = (row = {}) => ({
  [arabicHeaders.operation_date]: row.operation_date || "",
  [arabicHeaders.employee_id]: row.employee_id || "",
  [arabicHeaders.employee_name]: row.employee_name || "",
  [arabicHeaders.branch]: row.branch || "",
  [arabicHeaders.job_name]: row.job_name || row.job || "",
  [arabicHeaders.operation_type]: row.operation_type || "",
  [arabicHeaders.operation_count]: Number(row.operation_count || 0),
  [arabicHeaders.error_count]: Number(row.error_count || 0),
  [arabicHeaders.customer_complaints]: Number(row.customer_complaints || 0),
  [arabicHeaders.average_service_time]: Number(row.average_service_time || 0),
  [arabicHeaders.amount]: Number(row.amount || 0),
  [arabicHeaders.currency]: row.currency || "",
  [arabicHeaders.notes]: row.notes || "",
});

export function exportDailyOperationsToExcel(rows = [], fileName = "all-productivity-operations.xlsx") {
  const exportRows = (Array.isArray(rows) ? rows : []).map(toExcelRow);
  const ws = XLSX.utils.json_to_sheet(exportRows.length ? exportRows : [toExcelRow()]);
  ws["!cols"] = [12, 16, 24, 18, 22, 22, 14, 14, 14, 18, 14, 12, 30].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "عمليات الإنتاجية");
  XLSX.writeFile(wb, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}

const writeOperationsTemplate = (fileName, sheetName) => {
  const rows = [toExcelRow({
    operation_date: new Date().toISOString().slice(0, 10),
    employee_id: "EMP-001",
    employee_name: "اسم الموظف",
    branch: "الفرع الرئيسي",
    job_name: "خدمة عملاء",
    operation_type: "حوالات وارد",
    operation_count: 120,
    error_count: 0,
    customer_complaints: 0,
    average_service_time: 7,
    amount: 0,
    currency: "SAR",
    notes: "",
  })];
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [12, 16, 24, 18, 22, 22, 14, 14, 14, 18, 14, 12, 30].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
};

export const downloadDailyOperationsTemplate = () => writeOperationsTemplate("daily-operations-template.xlsx", "نموذج العمليات اليومية");

export const downloadProductivityTemplate = () => writeOperationsTemplate("productivity-template.xlsx", "نموذج الإنتاجية");

export const exportDailyOperationsTemplate = downloadDailyOperationsTemplate;
