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
export const operationStatuses = ["قيد المراجعة", "معتمد", "معتمدة", "مسودة", "مرفوض", "ملغي", "معاد للتعديل"];
export const approvedDailyOperationStatuses = new Set(["معتمد", "معتمدة"]);
export const pendingDailyOperationStatuses = new Set(["مستورد", "قيد المراجعة", "مسودة"]);
export const excludedFromKpiStatuses = new Set(["قيد المراجعة", "مستورد", "مرفوض", "مرفوضة", "ملغي", "ملغى", "معاد للتعديل", "مسودة"]);
export const isApprovedDailyOperation = (row = {}) => row.included_in_kpi === true || approvedDailyOperationStatuses.has(String(row.status || "").trim());

export const DAILY_OPERATIONS_BULK_CHUNK_SIZE = 100;
export const DAILY_OPERATIONS_DEFAULT_LIMIT = 5000;

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

const normalizeStatus = (status = "") => {
  const value = String(status || "").trim();
  if (["معتمدة", "معتمد"].includes(value)) return "معتمد";
  if (["مرفوضة", "مرفوض"].includes(value)) return "مرفوض";
  if (["قيد المراجعة", "مسودة", "مستورد", "ملغي", "ملغى", "معاد للتعديل"].includes(value)) return value === "ملغى" ? "ملغي" : value;
  if (value) return value;
  return "قيد المراجعة";
};

const resolveCompanyId = (value) => String(value || getCurrentCompanyId() || "").trim();

const normalizeDateOnly = (value = "") => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const text = String(value || "").trim();
  if (/[Tt]/.test(text) || /Z$/i.test(text)) {
    const parsedDateObject = new Date(text);
    if (!Number.isNaN(parsedDateObject.getTime())) {
      return `${parsedDateObject.getFullYear()}-${String(parsedDateObject.getMonth() + 1).padStart(2, "0")}-${String(parsedDateObject.getDate()).padStart(2, "0")}`;
    }
  }
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, "0")}-${String(isoMatch[3]).padStart(2, "0")}`;
  const dmyMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmyMatch) {
    const year = Number(dmyMatch[3]) < 100 ? 2000 + Number(dmyMatch[3]) : Number(dmyMatch[3]);
    return `${year}-${String(dmyMatch[2]).padStart(2, "0")}-${String(dmyMatch[1]).padStart(2, "0")}`;
  }
  return text;
};

export const dailyOperationLogicalKey = (row = {}, companyId = "") => [
  resolveCompanyId(companyId || row.company_id),
  normalizeDateOnly(row.operation_date || ""),
  String(row.employee_id || row.employeeId || "").trim(),
  String(row.operation_type || "").trim(),
  String(row.service_channel || row.channel || "مباشر").trim(),
].join("|");

export const stableDailyOperationId = (row = {}, companyId = "") => `OP|${dailyOperationLogicalKey(row, companyId)}`;

const fromDb = (row = {}) => {
  const noteData = unpackNotes(row.notes);
  const status = normalizeStatus(row.status);
  const operationDate = normalizeDateOnly(row.operation_date || "");
  return {
    operation_id: row.operation_id || "",
    company_id: row.company_id || "",
    operation_date: operationDate,
    month: row.month || operationDate.slice(0, 7),
    branch: row.branch || "",
    department: row.department || "",
    employee_id: row.employee_id || "",
    employee_name: row.employee_name || "",
    job_name: row.job_name || "",
    operation_type: row.operation_type || "",
    service_channel: row.service_channel || "مباشر",
    currency: row.currency || "",
    operation_count: safeNumber(row.operation_count ?? row.operations_count),
    amount: safeNumber(row.amount),
    error_count: safeNumber(row.error_count ?? row.errors_count),
    returned_count: safeNumber(row.returned_count),
    completed_count: safeNumber(row.completed_count),
    pending_count: safeNumber(row.pending_count),
    customer_complaints: safeNumber(row.customer_complaints ?? row.complaints_count),
    average_service_time: noteData.average_service_time,
    notes: noteData.notes,
    entered_by: row.entered_by || "",
    approved_by: row.approved_by || "",
    approved_at: row.approved_at || "",
    rejected_by: row.rejected_by || "",
    rejected_at: row.rejected_at || "",
    rejection_reason: row.rejection_reason || "",
    included_in_kpi: row.included_in_kpi === true || approvedDailyOperationStatuses.has(status),
    status,
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
  };
};

const toDb = (row = {}) => {
  const companyId = resolveCompanyId(row.company_id);
  if (!companyId) throw new Error("لم يتم تحديد الشركة الحالية");
  const operationDate = normalizeDateOnly(row.operation_date);
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    console.log("operation_date debug", {
      source: "daily-operations-save",
      rawDate: row.operation_date,
      savedDate: operationDate,
    });
  }
  const status = normalizeStatus(row.status);
  const normalized = {
    company_id: companyId,
    operation_date: operationDate,
    month: row.month || operationDate.slice(0, 7),
    branch: String(row.branch || ""),
    department: String(row.department || ""),
    employee_id: String(row.employee_id || row.employeeId || "").trim(),
    employee_name: String(row.employee_name || row.employeeName || ""),
    job_name: String(row.job_name || row.job || ""),
    operation_type: String(row.operation_type || "").trim(),
    service_channel: String(row.service_channel || row.channel || "مباشر").trim(),
    currency: String(row.currency || row.currency_code || ""),
    operation_count: safeNumber(row.operation_count ?? row.operations_count),
    amount: safeNumber(row.amount),
    error_count: safeNumber(row.error_count ?? row.errors_count),
    returned_count: safeNumber(row.returned_count),
    completed_count: safeNumber(row.completed_count),
    pending_count: safeNumber(row.pending_count),
    customer_complaints: safeNumber(row.customer_complaints ?? row.complaints_count),
    notes: packNotes(row.notes, row.average_service_time),
    entered_by: String(row.entered_by || ""),
    approved_by: String(row.approved_by || ""),
    approved_at: row.approved_at || null,
    rejected_by: String(row.rejected_by || ""),
    rejected_at: row.rejected_at || null,
    rejection_reason: String(row.rejection_reason || ""),
    included_in_kpi: row.included_in_kpi === true || approvedDailyOperationStatuses.has(status),
    status,
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

const actorName = (currentUser = "") => typeof currentUser === "string"
  ? currentUser
  : (currentUser?.username || currentUser?.id || currentUser?.user_id || "");

const uniqueIds = (ids = []) => [...new Set((Array.isArray(ids) ? ids : [ids]).map((id) => String(id || "").trim()).filter(Boolean))];

const idsFilter = (ids = []) => `operation_id=in.(${uniqueIds(ids).map((id) => encodeURIComponent(id)).join(",")})`;

const chunkArray = (items = [], size = DAILY_OPERATIONS_BULK_CHUNK_SIZE) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
};

const patchOperationsByIds = async (ids = [], patch = {}) => {
  const cleanIds = uniqueIds(ids);
  if (!cleanIds.length) return [];
  return supabase.request(`/rest/v1/daily_operations?${idsFilter(cleanIds)}&select=*`, {
    method: "PATCH",
    prefer: "return=representation",
    body: JSON.stringify(patch),
  });
};

const patchOperationsByIdsChunked = async (ids = [], patch = {}, options = {}) => {
  const cleanIds = uniqueIds(ids);
  if (!cleanIds.length) return [];
  const chunks = chunkArray(cleanIds);
  const saved = [];
  const errors = [];
  let processed = 0;
  options.onProgress?.({ processed, total: cleanIds.length, chunkSize: DAILY_OPERATIONS_BULK_CHUNK_SIZE });
  for (const [index, chunk] of chunks.entries()) {
    try {
      const rows = await patchOperationsByIds(chunk, patch);
      saved.push(...(Array.isArray(rows) ? rows : []));
      processed += chunk.length;
      options.onProgress?.({ processed, total: cleanIds.length, chunkIndex: index + 1, chunks: chunks.length, chunkSize: DAILY_OPERATIONS_BULK_CHUNK_SIZE });
    } catch (error) {
      console.error("Supabase daily_operations bulk chunk error:", { chunkIndex: index + 1, chunkSize: chunk.length, error });
      errors.push({ chunkIndex: index + 1, message: error.message || "Failed to update chunk" });
      options.onProgress?.({ processed, total: cleanIds.length, chunkIndex: index + 1, chunks: chunks.length, failed: errors.length, chunkSize: DAILY_OPERATIONS_BULK_CHUNK_SIZE });
    }
  }
  if (errors.length) {
    const message = saved.length
      ? `تم تحديث جزء من العمليات وفشل جزء آخر. الناجح: ${saved.length}، الفاشل: ${cleanIds.length - saved.length}`
      : "تعذر اعتماد بعض العمليات. يرجى المحاولة مرة أخرى.";
    const error = new Error(message);
    error.details = errors;
    error.successCount = saved.length;
    error.errorCount = cleanIds.length - saved.length;
    throw error;
  }
  return saved;
};

const approvalFilterPredicate = (filters = {}, companyId = resolveCompanyId(filters.companyId || filters.company_id)) => (row = {}) => {
  if (companyId && row.company_id !== companyId) return false;
  if (!pendingDailyOperationStatuses.has(String(row.status || "").trim())) return false;
  if (filters.date && row.operation_date !== filters.date) return false;
  if (filters.fromDate && row.operation_date < filters.fromDate) return false;
  if (filters.toDate && row.operation_date > filters.toDate) return false;
  if (filters.month && !(row.month === filters.month || String(row.operation_date || "").startsWith(filters.month))) return false;
  if (filters.year && String(row.operation_date || "").slice(0, 4) !== String(filters.year)) return false;
  if (filters.branch && filters.branch !== "all" && row.branch !== filters.branch) return false;
  if (filters.department && filters.department !== "all" && row.department !== filters.department) return false;
  if (filters.employeeId && filters.employeeId !== "all" && row.employee_id !== filters.employeeId) return false;
  if (filters.employee && filters.employee !== "all" && row.employee_id !== filters.employee) return false;
  if (filters.operationType && filters.operationType !== "all" && row.operation_type !== filters.operationType) return false;
  if (filters.channel && filters.channel !== "all" && row.service_channel !== filters.channel) return false;
  if (filters.status && filters.status !== "all" && row.status !== filters.status) return false;
  return true;
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
        ...(filters.fromDate ? [`operation_date=gte.${encodeURIComponent(filters.fromDate)}`] : []),
        ...(filters.toDate ? [`operation_date=lte.${encodeURIComponent(filters.toDate)}`] : []),
        ...(filters.status && filters.status !== "all" ? [`status=eq.${encodeURIComponent(filters.status)}`] : []),
        ...(filters.employeeId ? [`employee_id=eq.${encodeURIComponent(filters.employeeId)}`] : []),
        ...(filters.operationType && filters.operationType !== "all" ? [`operation_type=eq.${encodeURIComponent(filters.operationType)}`] : []),
        ...(filters.channel && filters.channel !== "all" ? [`service_channel=eq.${encodeURIComponent(filters.channel)}`] : []),
        "select=*",
        "order=operation_date.desc",
        `limit=${Number(filters.limit || DAILY_OPERATIONS_DEFAULT_LIMIT)}`,
      ].join("&");
      const rows = await supabase.select("daily_operations", query);
      const mapped = (Array.isArray(rows) ? rows : []).map(fromDb);
      return filters.approvedOnly ? mapped.filter(isApprovedDailyOperation) : mapped;
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

  async approveDailyOperation(rowOrId, user = "") {
    const id = typeof rowOrId === "string" ? rowOrId : rowOrId?.operation_id;
    if (!id) throw new Error("لا يمكن اعتماد عملية غير محددة");
    const rows = await patchOperationsByIds([id], {
      status: "معتمد",
      approved_by: actorName(user),
      approved_at: new Date().toISOString(),
      included_in_kpi: true,
      updated_at: new Date().toISOString(),
    });
    return fromDb(rows?.[0] || {});
  },

  async rejectDailyOperation(row, user = "") {
    return this.rejectSelectedDailyOperations([row?.operation_id || row], "رفض العملية", user);
  },

  async approveSelectedDailyOperations(ids = [], currentUser = "", options = {}) {
    const rows = await patchOperationsByIdsChunked(ids, {
      status: "معتمد",
      approved_by: actorName(currentUser),
      approved_at: new Date().toISOString(),
      included_in_kpi: true,
      updated_at: new Date().toISOString(),
    }, options);
    return (rows || []).map(fromDb);
  },

  async approveDailyOperationsByFilter(filters = {}, currentUser = "", options = {}) {
    const companyId = resolveCompanyId(filters.companyId || filters.company_id);
    if (!companyId) throw new Error("لم يتم تحديد الشركة الحالية");
    const rows = await this.loadDailyOperations({ companyId, month: filters.month || "" });
    const ids = rows.filter(approvalFilterPredicate(filters, companyId)).map((row) => row.operation_id);
    return this.approveSelectedDailyOperations(ids, currentUser, options);
  },

  async rejectSelectedDailyOperations(ids = [], reason = "", currentUser = "", options = {}) {
    if (!String(reason || "").trim()) throw new Error("سبب الرفض مطلوب");
    const rows = await patchOperationsByIdsChunked(ids, {
      status: "مرفوض",
      rejected_by: actorName(currentUser),
      rejected_at: new Date().toISOString(),
      rejection_reason: String(reason || "").trim(),
      included_in_kpi: false,
      updated_at: new Date().toISOString(),
    }, options);
    return (rows || []).map(fromDb);
  },

  async returnDailyOperationsForEdit(ids = [], reason = "", currentUser = "", options = {}) {
    if (!String(reason || "").trim()) throw new Error("سبب الإرجاع للتعديل مطلوب");
    const rows = await patchOperationsByIdsChunked(ids, {
      status: "معاد للتعديل",
      rejected_by: actorName(currentUser),
      rejected_at: new Date().toISOString(),
      rejection_reason: String(reason || "").trim(),
      included_in_kpi: false,
      updated_at: new Date().toISOString(),
    }, options);
    return (rows || []).map(fromDb);
  },

  async loadDailyOperationApprovalStats(filters = {}) {
    const rows = await this.loadDailyOperations(filters);
    return {
      imported: rows.length,
      pending: rows.filter((row) => pendingDailyOperationStatuses.has(String(row.status || "").trim())).length,
      approved: rows.filter(isApprovedDailyOperation).length,
      rejected: rows.filter((row) => ["مرفوض", "مرفوضة"].includes(String(row.status || "").trim())).length,
      includedInKpi: rows.filter(isApprovedDailyOperation).length,
    };
  },

  subscribe(onChange) {
    return supabase.subscribeToTable("daily_operations", onChange);
  },
};
