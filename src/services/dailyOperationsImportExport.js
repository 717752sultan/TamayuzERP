import * as XLSX from "xlsx";
import {
  dailyOperationLogicalKey,
  dailyOperationsService,
  operationTypes,
  stableDailyOperationId,
} from "./dailyOperations";

const dailyHeaders = {
  operation_date: "التاريخ",
  employee_id: "الرقم الوظيفي",
  employee_name: "اسم الموظف",
  branch: "الفرع",
  job_name: "الوظيفة",
  operation_type: "نوع العملية",
  service_channel: "القناة",
  operation_count: "عدد العمليات",
  completed_count: "العمليات المكتملة",
  pending_count: "العمليات المعلقة",
  returned_count: "العمليات المرتجعة",
  error_count: "عدد الأخطاء",
  customer_complaints: "شكاوى العملاء",
  amount: "المبلغ",
  currency: "العملة",
  notes: "ملاحظات",
};

const productivityHeaders = {
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
  "الموظف": "employee_name",
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
  "القناة": "service_channel",
  channel: "service_channel",
  service_channel: "service_channel",
  servicechannel: "service_channel",
  "عدد العمليات": "operation_count",
  operations_count: "operation_count",
  operation_count: "operation_count",
  operationcount: "operation_count",
  "العمليات المكتملة": "completed_count",
  completed_count: "completed_count",
  completedcount: "completed_count",
  "العمليات المعلقة": "pending_count",
  pending_count: "pending_count",
  pendingcount: "pending_count",
  "العمليات المرتجعة": "returned_count",
  returned_count: "returned_count",
  returnedcount: "returned_count",
  "عدد الأخطاء": "error_count",
  errors_count: "error_count",
  error_count: "error_count",
  errorcount: "error_count",
  "شكاوى العملاء": "customer_complaints",
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

const validStatuses = ["مسودة", "قيد المراجعة", "معتمدة", "مرفوضة"];

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
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
};

const normalizeHeader = (key) => String(key || "").trim().toLowerCase().replace(/[\s-]+/g, "_");

export const mapArabicColumnsToFields = (row = {}) => Object.entries(row || {}).reduce((acc, [key, value]) => {
  const normalizedKey = normalizeHeader(key);
  const targetKey = headerMap[String(key || "").trim()] || headerMap[normalizedKey] || headerMap[normalizedKey.replace(/_/g, "")];
  if (targetKey) acc[targetKey] = value;
  return acc;
}, {});

export const normalizeDailyOperationRow = (row = {}) => {
  const mapped = mapArabicColumnsToFields(row);
  const operationDate = excelDateToIso(mapped.operation_date);
  const numberFields = [
    "operation_count",
    "completed_count",
    "pending_count",
    "returned_count",
    "error_count",
    "customer_complaints",
    "average_service_time",
    "amount",
  ];
  const numbers = Object.fromEntries(numberFields.map((key) => [key, safeNumber(mapped[key])]));
  return {
    operation_id: String(row.operation_id || row.id || "").trim(),
    operation_date: operationDate,
    month: operationDate ? operationDate.slice(0, 7) : "",
    employee_id: String(mapped.employee_id || "").trim(),
    employee_name: String(mapped.employee_name || "").trim(),
    branch: String(mapped.branch || "").trim(),
    job_name: String(mapped.job_name || "").trim(),
    operation_type: String(mapped.operation_type || "").trim(),
    service_channel: String(mapped.service_channel || "مباشر").trim(),
    ...numbers,
    operation_count_provided: mapped.operation_count !== "" && mapped.operation_count !== null && mapped.operation_count !== undefined,
    currency: String(mapped.currency || "").trim(),
    error_rate: calculateErrorRate(numbers.operation_count, numbers.error_count),
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
    if (!row.operation_count_provided) errors.push("عدد العمليات مطلوب");

    for (const [key, label] of [
      ["operation_count", "عدد العمليات"],
      ["completed_count", "العمليات المكتملة"],
      ["pending_count", "العمليات المعلقة"],
      ["returned_count", "العمليات المرتجعة"],
      ["error_count", "عدد الأخطاء"],
      ["customer_complaints", "شكاوى العملاء"],
      ["average_service_time", "متوسط وقت الخدمة"],
      ["amount", "المبلغ"],
    ]) {
      if (!Number.isFinite(Number(row[key])) || Number(row[key]) < 0) errors.push(`${label} يجب أن يكون رقمًا أكبر من أو يساوي صفر`);
    }
    if (Number(row.error_count || 0) > Number(row.operation_count || 0)) warnings.push("عدد الأخطاء يتجاوز عدد العمليات");
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
      branch: row.branch || employee?.branch || "",
      job_name: row.job_name || employee?.job || employee?.job_name || "",
      service_channel: row.service_channel || "مباشر",
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

  const existingRows = await dailyOperationsService.loadDailyOperations({ companyId: currentCompanyId });
  const existingByKey = new Map(existingRows.map((row) => [dailyOperationLogicalKey(row, currentCompanyId), row]));
  const saved = [];
  let skipped = 0;
  let inserted = 0;
  let updated = 0;

  for (const row of validRows) {
    const duplicateKey = dailyOperationLogicalKey(row, currentCompanyId);
    const existing = existingByKey.get(duplicateKey);
    if (existing && options.duplicateMode === "ignore") {
      skipped += 1;
      continue;
    }
    const payload = {
      ...(existing || {}),
      operation_id: existing?.operation_id || row.operation_id || stableDailyOperationId(row, currentCompanyId),
      company_id: currentCompanyId,
      operation_date: row.operation_date,
      month: row.month,
      employee_id: row.employee_id,
      employee_name: row.employee_name,
      branch: row.branch,
      job_name: row.job_name,
      operation_type: row.operation_type,
      service_channel: row.service_channel || "مباشر",
      operation_count: Number(row.operation_count || 0),
      completed_count: Number(row.completed_count || 0),
      pending_count: Number(row.pending_count || 0),
      returned_count: Number(row.returned_count || 0),
      error_count: Number(row.error_count || 0),
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

const toDailyExcelRow = (row = {}) => ({
  [dailyHeaders.operation_date]: row.operation_date || "",
  [dailyHeaders.employee_id]: row.employee_id || "",
  [dailyHeaders.employee_name]: row.employee_name || "",
  [dailyHeaders.branch]: row.branch || "",
  [dailyHeaders.job_name]: row.job_name || row.job || "",
  [dailyHeaders.operation_type]: row.operation_type || "",
  [dailyHeaders.service_channel]: row.service_channel || "",
  [dailyHeaders.operation_count]: Number(row.operation_count || 0),
  [dailyHeaders.completed_count]: Number(row.completed_count || 0),
  [dailyHeaders.pending_count]: Number(row.pending_count || 0),
  [dailyHeaders.returned_count]: Number(row.returned_count || 0),
  [dailyHeaders.error_count]: Number(row.error_count || 0),
  [dailyHeaders.customer_complaints]: Number(row.customer_complaints || 0),
  [dailyHeaders.amount]: Number(row.amount || 0),
  [dailyHeaders.currency]: row.currency || "",
  [dailyHeaders.notes]: row.notes || "",
});

const toProductivityExcelRow = (row = {}) => ({
  [productivityHeaders.operation_date]: row.operation_date || "",
  [productivityHeaders.employee_id]: row.employee_id || "",
  [productivityHeaders.employee_name]: row.employee_name || "",
  [productivityHeaders.branch]: row.branch || "",
  [productivityHeaders.job_name]: row.job_name || row.job || "",
  [productivityHeaders.operation_type]: row.operation_type || "",
  [productivityHeaders.operation_count]: Number(row.operation_count || 0),
  [productivityHeaders.error_count]: Number(row.error_count || 0),
  [productivityHeaders.customer_complaints]: Number(row.customer_complaints || 0),
  [productivityHeaders.average_service_time]: Number(row.average_service_time || 0),
  [productivityHeaders.amount]: Number(row.amount || 0),
  [productivityHeaders.currency]: row.currency || "",
  [productivityHeaders.notes]: row.notes || "",
});

const writeRows = (rows, fileName, sheetName, mapper, widths) => {
  const data = (Array.isArray(rows) ? rows : []).map(mapper);
  const worksheet = XLSX.utils.json_to_sheet(data.length ? data : [mapper()]);
  worksheet["!cols"] = widths.map((wch) => ({ wch }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
};

export const exportDailyOperationsToExcel = (rows = [], fileName = "daily-operations.xlsx") =>
  writeRows(rows, fileName, "العمليات اليومية", toDailyExcelRow, [12, 16, 24, 18, 22, 22, 14, 14, 18, 18, 18, 14, 16, 14, 12, 30]);

export const exportProductivityOperationsToExcel = (rows = [], fileName = "productivity-operations.xlsx") =>
  writeRows(rows, fileName, "عمليات الإنتاجية", toProductivityExcelRow, [12, 16, 24, 18, 22, 22, 14, 14, 14, 18, 14, 12, 30]);

export function downloadDailyOperationsTemplate() {
  const today = new Date().toISOString().slice(0, 10);
  const examples = ["قبض حوالات", "صرف حوالات", "بيع عملة", "شراء عملة"].map((operationType, index) => ({
    operation_date: today,
    employee_id: `EMP-00${index + 1}`,
    employee_name: "اسم الموظف",
    branch: "الفرع الرئيسي",
    job_name: "خدمة عملاء",
    operation_type: operationType,
    service_channel: index < 2 ? "مباشر" : "تطبيق",
    operation_count: 100,
    completed_count: 95,
    pending_count: 3,
    returned_count: 2,
    error_count: 1,
    customer_complaints: 0,
    amount: index < 2 ? 0 : 10000,
    currency: "YER",
    notes: "",
  }));
  writeRows(examples, "daily-operations-template.xlsx", "نموذج العمليات اليومية", toDailyExcelRow, [12, 16, 24, 18, 22, 22, 14, 14, 18, 18, 18, 14, 16, 14, 12, 30]);
}

export function downloadProductivityTemplate() {
  const example = {
    operation_date: new Date().toISOString().slice(0, 10),
    employee_id: "EMP-001",
    employee_name: "اسم الموظف",
    branch: "الفرع الرئيسي",
    job_name: "خدمة عملاء",
    operation_type: "قبض حوالات",
    operation_count: 120,
    error_count: 0,
    customer_complaints: 0,
    average_service_time: 7,
    amount: 0,
    currency: "YER",
    notes: "",
  };
  writeRows([example], "productivity-template.xlsx", "نموذج الإنتاجية", toProductivityExcelRow, [12, 16, 24, 18, 22, 22, 14, 14, 14, 18, 14, 12, 30]);
}

export const exportDailyOperationsTemplate = downloadDailyOperationsTemplate;
