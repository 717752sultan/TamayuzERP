import { supabase } from "./supabase";

export const attendanceStatuses = [
  "حاضر",
  "متأخر",
  "في إجازة",
  "عطلة رسمية",
  "في انتداب",
  "في مهمة عمل",
  "استئذان فقط",
  "غائب",
];

export const attendanceRequestTypes = [
  "إذن تأخير",
  "إذن خروج مبكر",
  "استئذان",
  "مهمة عمل",
  "انتداب",
  "تعديل حضور",
  "تعديل انصراف",
  "تبرير غياب",
];

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const clean = (value) => String(value ?? "").trim();
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const isoFromDateTime = (date, time) => {
  if (!date || !time) return null;
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
};

export const minutesBetweenTimes = (start, end) => {
  if (!start || !end) return 0;
  const [sh, sm] = clean(start).slice(0, 5).split(":").map(Number);
  const [eh, em] = clean(end).slice(0, 5).split(":").map(Number);
  if ([sh, sm, eh, em].some((part) => Number.isNaN(part))) return 0;
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
};

const timePart = (value) => {
  if (!value) return "";
  if (/^\d{2}:\d{2}/.test(String(value))) return String(value).slice(0, 5);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
};

export const calculateWorkedMinutes = (checkIn, checkOut, workPeriod = {}) => {
  const worked = minutesBetweenTimes(timePart(checkIn), timePart(checkOut));
  const breakMinutes = workPeriod?.break_start && workPeriod?.break_end
    ? minutesBetweenTimes(workPeriod.break_start, workPeriod.break_end)
    : 0;
  return Math.max(0, worked - breakMinutes);
};

export const calculateAttendanceStatus = (record = {}, workPeriod = {}) => {
  const status = clean(record.status);
  if (status && !["حاضر", "متأخر"].includes(status)) return status;
  const checkIn = timePart(record.check_in_time || record.check_in);
  const startTime = clean(workPeriod.start_time || "08:00");
  const lateMinutes = Math.max(0, minutesBetweenTimes(startTime, checkIn) - number(workPeriod.grace_minutes));
  return lateMinutes > 0 ? "متأخر" : "حاضر";
};

const normalizeRecord = (row = {}) => ({
  id: row.id,
  company_id: row.company_id || "",
  employee_id: row.employee_id || row.employeeId || "",
  employee_name: row.employee_name || row.employeeName || "",
  attendance_date: row.attendance_date || row.date || today(),
  work_period_id: row.work_period_id || row.workPeriodId || null,
  branch: row.branch || "",
  department: row.department || "",
  check_in_time: row.check_in_time || row.check_in || null,
  check_out_time: row.check_out_time || row.check_out || null,
  status: row.status || "حاضر",
  late_minutes: number(row.late_minutes),
  early_leave_minutes: number(row.early_leave_minutes),
  worked_minutes: number(row.worked_minutes),
  overtime_minutes: number(row.overtime_minutes),
  note: row.note || row.notes || "",
  manual_adjustment: row.manual_adjustment === true,
  adjustment_reason: row.adjustment_reason || "",
  created_by: row.created_by || "",
  updated_by: row.updated_by || "",
  created_at: row.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const normalizePeriod = (row = {}) => ({
  id: row.id,
  company_id: row.company_id || "",
  period_name: row.period_name || row.name || "دوام صباحي",
  start_time: row.start_time || "08:00",
  end_time: row.end_time || "16:00",
  grace_minutes: number(row.grace_minutes),
  required_minutes: number(row.required_minutes || minutesBetweenTimes(row.start_time || "08:00", row.end_time || "16:00")),
  break_start: row.break_start || null,
  break_end: row.break_end || null,
  work_days: Array.isArray(row.work_days) ? row.work_days : [],
  branch: row.branch || "",
  department: row.department || "",
  is_active: row.is_active !== false,
  notes: row.notes || "",
  updated_at: new Date().toISOString(),
});

const normalizeRequest = (row = {}) => ({
  id: row.id,
  company_id: row.company_id || "",
  employee_id: row.employee_id || "",
  request_type: row.request_type || attendanceRequestTypes[0],
  request_date: row.request_date || today(),
  from_time: row.from_time || "",
  to_time: row.to_time || "",
  reason: row.reason || "",
  status: row.status || "معلق",
  approved_by: row.approved_by || "",
  approved_at: row.approved_at || null,
  rejection_reason: row.rejection_reason || "",
  created_by: row.created_by || "",
  created_at: row.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const queryFromFilters = (filters = {}, order = "attendance_date.desc") => {
  const params = ["select=*"];
  if (filters.companyId) params.push(`company_id=eq.${encodeURIComponent(filters.companyId)}`);
  if (filters.date) params.push(`attendance_date=eq.${encodeURIComponent(filters.date)}`);
  if (filters.from) params.push(`attendance_date=gte.${encodeURIComponent(filters.from)}`);
  if (filters.to) params.push(`attendance_date=lte.${encodeURIComponent(filters.to)}`);
  if (filters.employeeId) params.push(`employee_id=eq.${encodeURIComponent(filters.employeeId)}`);
  return `${params.join("&")}&order=${order}`;
};

export const attendanceService = {
  today,
  nowTime,
  timePart,
  calculateAttendanceStatus,
  calculateWorkedMinutes,

  async loadAttendanceRecords(filters = {}) {
    try {
      const rows = await supabase.select("attendance_records", queryFromFilters(filters));
      return (rows || []).map(normalizeRecord);
    } catch (error) {
      console.error("Supabase attendance_records load error:", error);
      throw new Error("تعذر تحميل سجلات الحضور: " + error.message);
    }
  },

  async saveAttendanceRecord(record) {
    const payload = normalizeRecord(record);
    const { data, error } = await supabase.from("attendance_records").upsert(payload, { onConflict: "company_id,employee_id,attendance_date" }).select().single();
    if (error) {
      console.error("Supabase attendance_records save error:", error);
      throw new Error("تعذر حفظ سجل الحضور: " + error.message);
    }
    return normalizeRecord(data);
  },

  async bulkSaveAttendanceRecords(records = []) {
    const payload = records.map(normalizeRecord).filter((row) => row.employee_id && row.attendance_date);
    if (!payload.length) return [];
    const { data, error } = await supabase.from("attendance_records").upsert(payload, { onConflict: "company_id,employee_id,attendance_date" }).select();
    if (error) {
      console.error("Supabase attendance_records bulk save error:", error);
      throw new Error("تعذر حفظ التحضير الجماعي: " + error.message);
    }
    return (data || []).map(normalizeRecord);
  },

  async checkInEmployee(employee, date = today(), time = nowTime(), workPeriod = {}, extra = {}) {
    const checkIn = isoFromDateTime(date, time);
    const lateMinutes = Math.max(0, minutesBetweenTimes(workPeriod.start_time || "08:00", time) - number(workPeriod.grace_minutes));
    return this.saveAttendanceRecord({
      ...extra,
      employee_id: employee.id,
      employee_name: employee.name,
      attendance_date: date,
      branch: employee.branch,
      department: employee.department || employee.administration || "",
      check_in_time: checkIn,
      status: lateMinutes > 0 ? "متأخر" : "حاضر",
      late_minutes: lateMinutes,
    });
  },

  async checkOutEmployee(employee, date = today(), time = nowTime(), workPeriod = {}, existing = {}, extra = {}) {
    const checkOut = isoFromDateTime(date, time);
    const workedMinutes = calculateWorkedMinutes(existing.check_in_time, checkOut, workPeriod);
    const required = number(workPeriod.required_minutes || minutesBetweenTimes(workPeriod.start_time || "08:00", workPeriod.end_time || "16:00"));
    return this.saveAttendanceRecord({
      ...existing,
      ...extra,
      employee_id: employee.id,
      employee_name: employee.name,
      attendance_date: date,
      branch: employee.branch,
      department: employee.department || employee.administration || "",
      check_out_time: checkOut,
      worked_minutes: workedMinutes,
      overtime_minutes: Math.max(0, workedMinutes - required),
    });
  },

  async loadWorkPeriods(companyId) {
    try {
      const query = `select=*&company_id=eq.${encodeURIComponent(companyId || "")}&order=period_name.asc`;
      const rows = await supabase.select("attendance_work_periods", query);
      return (rows || []).map(normalizePeriod);
    } catch (error) {
      console.error("Supabase attendance_work_periods load error:", error);
      throw new Error("تعذر تحميل فترات الدوام: " + error.message);
    }
  },

  async saveWorkPeriod(period) {
    const payload = normalizePeriod(period);
    const { data, error } = await supabase.from("attendance_work_periods").upsert(payload, { onConflict: "id" }).select().single();
    if (error) {
      console.error("Supabase attendance_work_periods save error:", error);
      throw new Error("تعذر حفظ فترة الدوام: " + error.message);
    }
    return normalizePeriod(data);
  },

  async loadAttendanceRequests(filters = {}) {
    try {
      const params = ["select=*"];
      if (filters.companyId) params.push(`company_id=eq.${encodeURIComponent(filters.companyId)}`);
      if (filters.status && filters.status !== "all") params.push(`status=eq.${encodeURIComponent(filters.status)}`);
      const rows = await supabase.select("attendance_requests", `${params.join("&")}&order=created_at.desc`);
      return (rows || []).map(normalizeRequest);
    } catch (error) {
      console.error("Supabase attendance_requests load error:", error);
      throw new Error("تعذر تحميل طلبات العمل: " + error.message);
    }
  },

  async saveAttendanceRequest(request) {
    const payload = normalizeRequest(request);
    const { data, error } = await supabase.from("attendance_requests").upsert(payload, { onConflict: "id" }).select().single();
    if (error) {
      console.error("Supabase attendance_requests save error:", error);
      throw new Error("تعذر حفظ طلب العمل: " + error.message);
    }
    return normalizeRequest(data);
  },

  async approveAttendanceRequest(id, approvedBy = "") {
    return this.saveAttendanceRequest({ id, status: "معتمد", approved_by: approvedBy, approved_at: new Date().toISOString() });
  },

  async rejectAttendanceRequest(id, rejectionReason = "") {
    return this.saveAttendanceRequest({ id, status: "مرفوض", rejection_reason: rejectionReason });
  },
};
