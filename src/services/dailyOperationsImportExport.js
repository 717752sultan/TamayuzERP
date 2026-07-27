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

const validStatuses = ["مستورد", "قيد المراجعة", "معتمد", "معتمدة", "مرفوض", "مرفوضة", "ملغي", "معاد للتعديل"];

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

const pad2 = (value) => String(value).padStart(2, "0");

export const formatDateOnly = (year, month, day) => {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return "";
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return "";
  return `${y}-${pad2(m)}-${pad2(d)}`;
};

const formatLocalDateObject = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return formatDateOnly(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

export const parseOperationDate = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return formatLocalDateObject(value);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code?.(value);
    if (parsed?.y && parsed?.m && parsed?.d) {
      return formatDateOnly(parsed.y, parsed.m, parsed.d);
    }
  }
  const text = String(value).trim();
  if (/[Tt]/.test(text) || /Z$/i.test(text)) {
    const parsedDateObject = new Date(text);
    const localDate = formatLocalDateObject(parsedDateObject);
    if (localDate) return localDate;
  }
  const isoMatch = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) return formatDateOnly(isoMatch[1], isoMatch[2], isoMatch[3]);
  const dmyMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmyMatch) {
    const year = Number(dmyMatch[3]) < 100 ? 2000 + Number(dmyMatch[3]) : Number(dmyMatch[3]);
    return formatDateOnly(year, dmyMatch[2], dmyMatch[1]);
  }
  return text;
};

export const getTodayDateOnly = () => {
  const today = new Date();
  return formatDateOnly(today.getFullYear(), today.getMonth() + 1, today.getDate());
};

const normalizeHeader = (key) => String(key || "").trim().toLowerCase().replace(/[\s-]+/g, "_");

const isMeaningfulExcelValue = (value) => {
  if (value === null || value === undefined) return false;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value === "string") return value.replace(/\s+/g, "").length > 0;
  return String(value ?? "").trim() !== "";
};

export const isBlankExcelRow = (rawRow = {}) => {
  const values = Object.entries(rawRow || {})
    .filter(([key]) => !String(key || "").startsWith("__"))
    .map(([, value]) => value);
  return values.every((value) => !isMeaningfulExcelValue(value));
};

export const mapArabicColumnsToFields = (row = {}) => Object.entries(row || {}).reduce((acc, [key, value]) => {
  const normalizedKey = normalizeHeader(key);
  const targetKey = headerMap[String(key || "").trim()] || headerMap[normalizedKey] || headerMap[normalizedKey.replace(/_/g, "")];
  if (targetKey) acc[targetKey] = value;
  return acc;
}, {});

export const normalizeDailyOperationRow = (row = {}) => {
  const mapped = mapArabicColumnsToFields(row);
  const rawDate = mapped.operation_date;
  const operationDate = parseOperationDate(rawDate);
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    console.log("operation_date debug", {
      source: "daily-operations-import",
      rawDate,
      rawType: typeof rawDate,
      parsedDate: operationDate,
    });
  }
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
    status: String(mapped.status || "قيد المراجعة").trim(),
    notes: String(mapped.notes || "").trim(),
  };
};

export async function parseDailyOperationsExcel(file) {
  if (!file) throw new Error("لم يتم اختيار ملف");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("لا يحتوي الملف على ورقة بيانات");
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", blankrows: false, raw: true });
  const parsedRows = [];
  let consecutiveBlankRowsAfterData = 0;
  for (const [index, row] of rows.entries()) {
    if (isBlankExcelRow(row)) {
      if (parsedRows.length > 0) consecutiveBlankRowsAfterData += 1;
      if (consecutiveBlankRowsAfterData >= 20) break;
      continue;
    }
    consecutiveBlankRowsAfterData = 0;
    parsedRows.push({ rowNumber: index + 2, ...normalizeDailyOperationRow(row) });
  }
  return parsedRows;
}

export function validateDailyOperationsRows(rows = [], employees = [], currentCompanyId = "") {
  const employeeList = Array.isArray(employees) ? employees : [];
  return (Array.isArray(rows) ? rows : []).map((row, index) => {
    const errors = [];
    const warnings = [];
    let employee = null;

    if (!currentCompanyId) errors.push("لم يتم تحديد الشركة الحالية");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.operation_date || ""))) errors.push("التاريخ مطلوب أو غير صحيح");
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
    const parsedDate = parseOperationDate(row.operation_date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsedDate)) throw new Error("التاريخ مطلوب أو غير صحيح");
    const normalizedRowForKey = { ...row, operation_date: parsedDate, month: parsedDate.slice(0, 7) };
    const duplicateKey = dailyOperationLogicalKey(normalizedRowForKey, currentCompanyId);
    const existing = existingByKey.get(duplicateKey);
    if (existing && options.duplicateMode === "ignore") {
      skipped += 1;
      continue;
    }
    const payload = {
      ...(existing || {}),
      operation_id: existing?.operation_id || row.operation_id || stableDailyOperationId(normalizedRowForKey, currentCompanyId),
      company_id: currentCompanyId,
      operation_date: parsedDate,
      month: parsedDate.slice(0, 7),
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
      status: row.status || "قيد المراجعة",
    };
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.log("operation_date debug", {
        source: "daily-operations-save",
        rawDate: row.operation_date,
        savedDate: payload.operation_date,
      });
    }
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
  const today = getTodayDateOnly();
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
  const today = getTodayDateOnly();
  const example = {
    operation_date: today,
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
