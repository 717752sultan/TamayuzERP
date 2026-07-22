import { supabase } from "./supabase";
import { getCurrentCompanyId } from "./tenant";

export const operationTypes = [...new Set([
  "قبض حوالات",
  "صرف حوالات",
  "بيع عملة",
  "شراء عملة",
  "حوالات واتس صادر",
  "حوالات واتس وارد",
  "عمليات أخرى",
  "حوالات وارد",
  "حوالات صادر",
  "واتساب وارد",
  "واتساب صادر",
  "صرف نقدي",
  "قبض نقدي",
  "عد نقدية",
  "مراسلات",
  "بلاغ دعم فني",
  "جرد مخزون",
  "صرف مخزون",
  "معاملة موارد بشرية",
  "قيد حسابي",
  "فحص امتثال",
  "أخرى",
])];

export const serviceChannels = [...new Set(["مباشر", "واتساب", "هاتف", "تطبيق", "أخرى", "فرع", "إدارة", "نظام داخلي"])];
export const operationStatuses = ["مسودة", "قيد المراجعة", "معتمدة", "مرفوضة"];

const averageServiceTimeMarker = /\n?\[\[average_service_time:([-+]?\d+(?:\.\d+)?)\]\]/g;

const unpackNotes = (notes = "") => {
  const text = String(notes || "");
  const match = [...text.matchAll(averageServiceTimeMarker)].at(-1);
  return {
    notes: text.replace(averageServiceTimeMarker, "").trim(),
    average_service_time: Number(match?.[1] || 0),
  };
};

const packNotes = (notes = "", averageServiceTime = 0) => {
  const cleanNotes = String(notes || "").replace(averageServiceTimeMarker, "").trim();
  const value = Number(averageServiceTime || 0);
  return `${cleanNotes}${cleanNotes ? "\n" : ""}[[average_service_time:${Number.isFinite(value) ? value : 0}]]`;
};

const safeNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const resolveCompanyId = (value) => String(value || getCurrentCompanyId() || "").trim();

export const dailyOperationLogicalKey = (row = {}, companyId = "") => [
  resolveCompanyId(companyId || row.company_id),
  String(row.operation_date || "").trim(),
  String(row.employee_id || row.employeeId || "").trim(),
  String(row.operation_type || "").trim(),
  String(row.service_channel || row.channel || "مباشر").trim(),
].join("|");

export const stableDailyOperationId = (row = {}, companyId = "") => `OP|${dailyOperationLogicalKey(row, companyId)}`;

const fromDb = (row = {}) => {
  const noteData = unpackNotes(row.notes);
  return {
    operation_id: row.operation_id || "",
    company_id: row.company_id || "",
    operation_date: row.operation_date || "",
    month: row.month || String(row.operation_date || "").slice(0, 7),
    branch: row.branch || "",
    employee_id: row.employee_id || "",
    employee_name: row.employee_name || "",
    job_name: row.job_name || "",
    operation_type: row.operation_type || "",
    service_channel: row.service_channel || "مباشر",
    currency: row.currency || "",
    operation_count: safeNumber(row.operation_count),
    amount: safeNumber(row.amount),
    error_count: safeNumber(row.error_count),
    returned_count: safeNumber(row.returned_count),
    completed_count: safeNumber(row.completed_count),
    pending_count: safeNumber(row.pending_count),
    customer_complaints: safeNumber(row.customer_complaints),
    average_service_time: noteData.average_service_time,
    notes: noteData.notes,
    entered_by: row.entered_by || "",
    approved_by: row.approved_by || "",
    status: row.status || "مسودة",
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
  };
};

const toDb = (row = {}) => {
  const companyId = resolveCompanyId(row.company_id);
  if (!companyId) throw new Error("لم يتم تحديد الشركة الحالية");
  const operationDate = String(row.operation_date || "").trim();
  const normalized = {
    company_id: companyId,
    operation_date: operationDate,
    month: row.month || operationDate.slice(0, 7),
    branch: String(row.branch || ""),
    employee_id: String(row.employee_id || row.employeeId || "").trim(),
    employee_name: String(row.employee_name || row.employeeName || ""),
    job_name: String(row.job_name || row.job || ""),
    operation_type: String(row.operation_type || "").trim(),
    service_channel: String(row.service_channel || row.channel || "مباشر").trim(),
    currency: String(row.currency || row.currency_code || ""),
    operation_count: safeNumber(row.operation_count),
    amount: safeNumber(row.amount),
    error_count: safeNumber(row.error_count),
    returned_count: safeNumber(row.returned_count),
    completed_count: safeNumber(row.completed_count),
    pending_count: safeNumber(row.pending_count),
    customer_complaints: safeNumber(row.customer_complaints ?? row.complaints_count),
    notes: packNotes(row.notes, row.average_service_time),
    entered_by: String(row.entered_by || ""),
    approved_by: String(row.approved_by || ""),
    status: String(row.status || "مسودة"),
    updated_at: new Date().toISOString(),
  };
  return {
    operation_id: String(row.operation_id || stableDailyOperationId(normalized, companyId)).trim(),
    ...normalized,
  };
};

const findLogicalDuplicate = async (payload) => {
  const query = [
    `company_id=eq.${encodeURIComponent(payload.company_id)}`,
    `operation_date=eq.${encodeURIComponent(payload.operation_date)}`,
    `employee_id=eq.${encodeURIComponent(payload.employee_id)}`,
    `operation_type=eq.${encodeURIComponent(payload.operation_type)}`,
    `service_channel=eq.${encodeURIComponent(payload.service_channel)}`,
    "select=*",
    "limit=1",
  ].join("&");
  const rows = await supabase.select("daily_operations", query);
  return Array.isArray(rows) ? rows[0] || null : null;
};

export const dailyOperationsService = {
  async loadDailyOperations(filters = {}) {
    try {
      const companyId = resolveCompanyId(filters.companyId || filters.company_id);
      if (!companyId) throw new Error("لم يتم تحديد الشركة الحالية");
      const query = [
        `company_id=eq.${encodeURIComponent(companyId)}`,
        ...(filters.month ? [`month=eq.${encodeURIComponent(filters.month)}`] : []),
        ...(filters.date ? [`operation_date=eq.${encodeURIComponent(filters.date)}`] : []),
        ...(filters.employeeId ? [`employee_id=eq.${encodeURIComponent(filters.employeeId)}`] : []),
        "select=*",
        "order=operation_date.desc",
      ].join("&");
      const rows = await supabase.select("daily_operations", query);
      return (Array.isArray(rows) ? rows : []).map(fromDb);
    } catch (error) {
      console.error("Supabase daily_operations load error:", error);
      throw new Error("فشل تحميل العمليات اليومية: " + error.message);
    }
  },

  async saveDailyOperation(operation) {
    try {
      const payload = toDb(operation);
      if (!payload.operation_date) throw new Error("يجب تحديد التاريخ");
      if (!payload.employee_id) throw new Error("يجب اختيار الموظف");
      if (!payload.operation_type) throw new Error("يجب تحديد نوع العملية");
      if (!payload.service_channel) throw new Error("يجب تحديد القناة");
      if (payload.operation_count < 0) throw new Error("لا يمكن أن يكون عدد العمليات أقل من صفر");

      const duplicate = await findLogicalDuplicate(payload);
      if (duplicate && duplicate.operation_id !== payload.operation_id) payload.operation_id = duplicate.operation_id;

      const { data, error } = await supabase.from("daily_operations").upsert(payload, { onConflict: "operation_id" }).select().single();
      if (error) throw error;
      return fromDb(data);
    } catch (error) {
      console.error("Supabase daily_operations save error:", error);
      throw new Error("فشل حفظ العملية اليومية: " + error.message);
    }
  },

  async deleteDailyOperation(id) {
    try {
      return await supabase.request(`/rest/v1/daily_operations?operation_id=eq.${encodeURIComponent(id)}`, { method: "DELETE", prefer: "return=minimal" });
    } catch (error) {
      console.error("Supabase daily_operations delete error:", error);
      throw new Error("فشل حذف العملية اليومية: " + error.message);
    }
  },

  async approveDailyOperation(row, user = "") {
    if (!row.employee_id || !row.operation_type) throw new Error("لا يمكن اعتماد عملية ناقصة");
    return this.saveDailyOperation({ ...row, status: "معتمدة", approved_by: user });
  },

  async rejectDailyOperation(row, user = "") {
    return this.saveDailyOperation({ ...row, status: "مرفوضة", approved_by: user });
  },

  subscribe(onChange) {
    return supabase.subscribeToTable("daily_operations", onChange);
  },
};
