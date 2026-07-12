import { supabase } from "./supabase";

export const shiftPeriods = ["صباحي", "مسائي", "ليلي", "كامل", "مخصص"];

export const calculateShiftHours = (start, end) => {
  if (!start || !end) return 0;
  const [sh, sm] = String(start).split(":").map(Number);
  const [eh, em] = String(end).split(":").map(Number);
  if ([sh, sm, eh, em].some((x) => Number.isNaN(x))) return 0;
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;
  return Number(((endMinutes - startMinutes) / 60).toFixed(2));
};

const shiftTypeFromDb = (row = {}) => ({
  shift_type_id: row.shift_type_id,
  shift_name: row.shift_name || "",
  start_time: row.start_time || "",
  end_time: row.end_time || "",
  total_hours: Number(row.total_hours || 0),
  break_minutes: Number(row.break_minutes || 0),
  shift_period: row.shift_period || "صباحي",
  shift_mode: row.shift_mode || "ثابت",
  flexible_start_from: row.flexible_start_from || "",
  flexible_end_until: row.flexible_end_until || "",
  required_hours: Number(row.required_hours || 0),
  is_active: row.is_active !== false,
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const shiftTypeToDb = (item = {}) => ({
  shift_type_id: String(item.shift_type_id || item.id || `ST-${Date.now()}`).trim(),
  shift_name: String(item.shift_name || item.shiftName || "").trim(),
  start_time: String(item.start_time || item.startTime || ""),
  end_time: String(item.end_time || item.endTime || ""),
  total_hours: Number(item.total_hours || calculateShiftHours(item.start_time || item.startTime, item.end_time || item.endTime)),
  break_minutes: Number(item.break_minutes || item.breakMinutes || 0),
  shift_period: String(item.shift_period || item.shiftPeriod || "صباحي"),
  shift_mode: String(item.shift_mode || item.shiftMode || "ثابت"),
  flexible_start_from: item.flexible_start_from || item.flexibleStartFrom || null,
  flexible_end_until: item.flexible_end_until || item.flexibleEndUntil || null,
  required_hours: Number(item.required_hours || item.requiredHours || 0),
  is_active: item.is_active !== false,
  notes: String(item.notes || ""),
  created_at: item.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const periodFromDb = (row = {}) => ({
  period_id: row.period_id,
  shift_type_id: row.shift_type_id || "",
  period_name: row.period_name || "",
  start_time: row.start_time || "",
  end_time: row.end_time || "",
  total_hours: Number(row.total_hours || 0),
  sort_order: Number(row.sort_order || 0),
  is_active: row.is_active !== false,
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const periodToDb = (item = {}) => ({
  period_id: String(item.period_id || item.id || `STP-${Date.now()}-${Math.random().toString(16).slice(2)}`).trim(),
  shift_type_id: String(item.shift_type_id || item.shiftTypeId || ""),
  period_name: String(item.period_name || item.periodName || "فترة العمل"),
  start_time: String(item.start_time || item.startTime || ""),
  end_time: String(item.end_time || item.endTime || ""),
  total_hours: Number(item.total_hours || calculateShiftHours(item.start_time || item.startTime, item.end_time || item.endTime)),
  sort_order: Number(item.sort_order || item.sortOrder || 0),
  is_active: item.is_active !== false,
  notes: String(item.notes || ""),
  created_at: item.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const usedShiftFromDb = (row = {}) => ({
  used_shift_id: row.used_shift_id,
  branch: row.branch || "",
  shift_type_id: row.shift_type_id || "",
  shift_name: row.shift_name || "",
  start_time: row.start_time || "",
  end_time: row.end_time || "",
  required_employees: Number(row.required_employees || 0),
  min_employees: Number(row.min_employees || 0),
  max_employees: Number(row.max_employees || 0),
  active_from: row.active_from || "",
  active_to: row.active_to || "",
  is_active: row.is_active !== false,
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const usedShiftToDb = (item = {}) => ({
  used_shift_id: String(item.used_shift_id || item.id || `US-${Date.now()}`).trim(),
  branch: String(item.branch || ""),
  shift_type_id: String(item.shift_type_id || item.shiftTypeId || ""),
  shift_name: String(item.shift_name || item.shiftName || ""),
  start_time: String(item.start_time || item.startTime || ""),
  end_time: String(item.end_time || item.endTime || ""),
  required_employees: Number(item.required_employees || item.requiredEmployees || 0),
  min_employees: Number(item.min_employees || item.minEmployees || 0),
  max_employees: Number(item.max_employees || item.maxEmployees || 0),
  active_from: item.active_from || item.activeFrom || null,
  active_to: item.active_to || item.activeTo || null,
  is_active: item.is_active !== false,
  notes: String(item.notes || ""),
  created_at: item.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const shiftsService = {
  async listTypes() {
    try {
      const rows = await supabase.select("shift_types", "select=*&order=shift_name.asc");
      return (rows || []).map(shiftTypeFromDb);
    } catch (error) {
      console.error("Supabase shift_types load/save error:", error);
      throw new Error("فشل تحميل بيانات الشفتات من Supabase: " + error.message);
    }
  },
  async saveType(item) {
    try {
      const payload = shiftTypeToDb(item);
      if (!payload.shift_name) throw new Error("اسم الشفت مطلوب");
      const { data, error } = await supabase.from("shift_types").upsert(payload, { onConflict: "shift_type_id" }).select().single();
      if (error) throw error;
      return shiftTypeFromDb(data);
    } catch (error) {
      console.error("Supabase shift_types load/save error:", error);
      throw new Error("فشل حفظ الشفت: " + error.message);
    }
  },
  async listPeriods() {
    try {
      const rows = await supabase.select("shift_type_periods", "select=*&order=sort_order.asc");
      return (rows || []).map(periodFromDb);
    } catch (error) {
      console.error("Supabase shift_type_periods load/save error:", error);
      throw new Error("فشل تحميل فترات الشفتات من Supabase: " + error.message);
    }
  },
  async savePeriods(shiftTypeId, periods) {
    try {
      const rows = periods.map((period, index) =>
        periodToDb({ ...period, shift_type_id: shiftTypeId, sort_order: index + 1 }),
      );
      if (!rows.length) return [];
      const { data, error } = await supabase.from("shift_type_periods").upsert(rows, { onConflict: "period_id" }).select();
      if (error) throw error;
      return (data || []).map(periodFromDb);
    } catch (error) {
      console.error("Supabase shift_type_periods load/save error:", error);
      throw new Error("فشل حفظ فترات الشفت: " + error.message);
    }
  },
  async removePeriod(id) {
    try {
      return await supabase.request(`/rest/v1/shift_type_periods?period_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error("Supabase shift_type_periods load/save error:", error);
      throw new Error("فشل حذف فترة الشفت: " + error.message);
    }
  },
  async removeType(id) {
    try {
      return await supabase.request(`/rest/v1/shift_types?shift_type_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error("Supabase shift_types load/save error:", error);
      throw new Error("فشل حذف الشفت: " + error.message);
    }
  },
  async listUsed() {
    try {
      const rows = await supabase.select("used_shifts", "select=*&order=branch.asc");
      return (rows || []).map(usedShiftFromDb);
    } catch (error) {
      console.error("Supabase used_shifts load/save error:", error);
      throw new Error("فشل تحميل بيانات الشفتات المستخدمة من Supabase: " + error.message);
    }
  },
  async saveUsed(item) {
    try {
      const payload = usedShiftToDb(item);
      const { data, error } = await supabase.from("used_shifts").upsert(payload, { onConflict: "used_shift_id" }).select().single();
      if (error) throw error;
      return usedShiftFromDb(data);
    } catch (error) {
      console.error("Supabase used_shifts load/save error:", error);
      throw new Error("فشل حفظ الشفت المستخدم: " + error.message);
    }
  },
  async removeUsed(id) {
    try {
      return await supabase.request(`/rest/v1/used_shifts?used_shift_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error("Supabase used_shifts load/save error:", error);
      throw new Error("فشل حذف الشفت المستخدم: " + error.message);
    }
  },
  subscribeTypes(onChange) {
    return supabase.subscribeToTable("shift_types", onChange);
  },
  subscribeUsed(onChange) {
    return supabase.subscribeToTable("used_shifts", onChange);
  },
  subscribePeriods(onChange) {
    return supabase.subscribeToTable("shift_type_periods", onChange);
  },
};
