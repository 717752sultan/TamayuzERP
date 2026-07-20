import { supabase } from "./supabase";

export const operationTypes = [
  "حوالات وارد",
  "حوالات صادر",
  "واتساب وارد",
  "واتساب صادر",
  "بيع عملة",
  "شراء عملة",
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
];

export const serviceChannels = ["مباشر", "واتساب", "فرع", "إدارة", "نظام داخلي"];
export const operationStatuses = ["مسودة", "معتمدة", "مرفوضة"];

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

const fromDb = (row = {}) => {
  const noteData = unpackNotes(row.notes);
  return {
    operation_id: row.operation_id,
    company_id: row.company_id || "",
    operation_date: row.operation_date || "",
    month: row.month || String(row.operation_date || "").slice(0, 7),
    branch: row.branch || "",
    employee_id: row.employee_id || "",
    employee_name: row.employee_name || "",
    job_name: row.job_name || "",
    operation_type: row.operation_type || "",
    service_channel: row.service_channel || "",
    currency: row.currency || "",
    operation_count: Number(row.operation_count || 0),
    amount: Number(row.amount || 0),
    error_count: Number(row.error_count || 0),
    returned_count: Number(row.returned_count || 0),
    completed_count: Number(row.completed_count || 0),
    pending_count: Number(row.pending_count || 0),
    customer_complaints: Number(row.customer_complaints || 0),
    average_service_time: noteData.average_service_time,
    notes: noteData.notes,
    entered_by: row.entered_by || "",
    approved_by: row.approved_by || "",
    status: row.status || "مسودة",
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
  };
};

const toSafeNumber = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

const toDb = (row = {}) => {
  const operationDate = row.operation_date || new Date().toISOString().slice(0, 10);
  const companyId = String(row.company_id || "").trim();
  return {
    operation_id: String(row.operation_id || row.id || `OP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).trim(),
    ...(companyId ? { company_id: companyId } : {}),
    operation_date: operationDate,
    month: row.month || operationDate.slice(0, 7),
    branch: String(row.branch || ""),
    employee_id: String(row.employee_id || row.employeeId || ""),
    employee_name: String(row.employee_name || row.employeeName || ""),
    job_name: String(row.job_name || row.job || ""),
    operation_type: String(row.operation_type || ""),
    service_channel: String(row.service_channel || "فرع"),
    currency: String(row.currency || row.currency_code || ""),
    operation_count: toSafeNumber(row.operation_count),
    amount: toSafeNumber(row.amount),
    error_count: toSafeNumber(row.error_count),
    returned_count: toSafeNumber(row.returned_count),
    completed_count: toSafeNumber(row.completed_count ?? row.operation_count),
    pending_count: toSafeNumber(row.pending_count),
    customer_complaints: toSafeNumber(row.customer_complaints ?? row.complaints_count),
    notes: packNotes(row.notes, row.average_service_time),
    entered_by: String(row.entered_by || ""),
    approved_by: String(row.approved_by || ""),
    status: String(row.status || "مسودة"),
    updated_at: new Date().toISOString(),
  };
};

export const dailyOperationsService = {
  async loadDailyOperations(filters = {}) {
    try {
      let query = "select=*&order=operation_date.desc";
      if (filters.month) query = `month=eq.${encodeURIComponent(filters.month)}&${query}`;
      const rows = await supabase.select("daily_operations", query);
      return (rows || []).map(fromDb);
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
      if (payload.operation_count < 0) throw new Error("لا يمكن أن يكون العدد أقل من صفر");
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
