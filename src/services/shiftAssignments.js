import { supabase } from "./supabase";
import { calculateShiftHours } from "./shifts";

export const shiftAssignmentStatuses = ["مجدول", "حاضر", "غائب", "إجازة", "مستبدل", "ملغي"];

const fromDb = (row = {}) => ({
  assignment_id: row.assignment_id,
  assignment_date: row.assignment_date || "",
  branch: row.branch || "",
  employee_id: row.employee_id || "",
  employee_name: row.employee_name || "",
  employee_phone: row.employee_phone || "",
  job: row.job || "",
  shift_type_id: row.shift_type_id || "",
  shift_name: row.shift_name || "",
  shift_mode: row.shift_mode || "ثابت",
  shift_periods: row.shift_periods || [],
  start_time: row.start_time || "",
  end_time: row.end_time || "",
  total_hours: Number(row.total_hours || 0),
  status: row.status || "مجدول",
  notes: row.notes || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const toDb = (item = {}) => ({
  assignment_id: String(item.assignment_id || item.id || `SA-${Date.now()}-${Math.random().toString(16).slice(2)}`).trim(),
  assignment_date: item.assignment_date || item.assignmentDate || null,
  branch: String(item.branch || ""),
  employee_id: String(item.employee_id || item.employeeId || ""),
  employee_name: String(item.employee_name || item.employeeName || ""),
  employee_phone: String(item.employee_phone || item.employeePhone || ""),
  job: String(item.job || ""),
  shift_type_id: String(item.shift_type_id || item.shiftTypeId || ""),
  shift_name: String(item.shift_name || item.shiftName || ""),
  shift_mode: String(item.shift_mode || item.shiftMode || "ثابت"),
  shift_periods: Array.isArray(item.shift_periods || item.shiftPeriods) ? item.shift_periods || item.shiftPeriods : [],
  start_time: String(item.start_time || item.startTime || ""),
  end_time: String(item.end_time || item.endTime || ""),
  total_hours: Number(item.total_hours || calculateShiftHours(item.start_time || item.startTime, item.end_time || item.endTime)),
  status: String(item.status || "مجدول"),
  notes: String(item.notes || ""),
  created_at: item.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const shiftAssignmentsService = {
  async list() {
    try {
      const rows = await supabase.select("employee_shift_assignments", "select=*&order=assignment_date.desc");
      return (rows || []).map(fromDb);
    } catch (error) {
      console.error("Supabase employee_shift_assignments load/save error:", error);
      throw new Error("فشل تحميل بيانات الشفتات: " + error.message);
    }
  },
  async save(itemOrItems) {
    try {
      const rows = (Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems])
        .map(toDb)
        .filter((row) => row.assignment_date && row.employee_id && row.shift_type_id);
      if (!rows.length) return [];
      const { data, error } = await supabase.from("employee_shift_assignments").upsert(rows, { onConflict: "assignment_id" }).select();
      if (error) throw error;
      return (data || []).map(fromDb);
    } catch (error) {
      console.error("Supabase employee_shift_assignments load/save error:", error);
      throw new Error("فشل حفظ الشفت: " + error.message);
    }
  },
  async remove(id) {
    try {
      return await supabase.request(`/rest/v1/employee_shift_assignments?assignment_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error("Supabase employee_shift_assignments load/save error:", error);
      throw new Error("فشل حذف الشفت: " + error.message);
    }
  },
  subscribe(onChange) {
    return supabase.subscribeToTable("employee_shift_assignments", onChange);
  },
};
