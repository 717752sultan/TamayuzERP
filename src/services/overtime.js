import { supabase } from "./supabase";

const normalizeAssignmentForDb = (item = {}) => ({
  assignment_id: String(item.assignment_id || item.assignmentId || `OT-${Date.now()}`).trim(),
  assignment_date: item.assignment_date || item.assignmentDate || null,
  branch: String(item.branch || ""),
  location: String(item.location || ""),
  start_time: String(item.start_time || item.startTime || ""),
  end_time: String(item.end_time || item.endTime || ""),
  reason: String(item.reason || ""),
  notes: String(item.notes || ""),
  created_by: String(item.created_by || item.createdBy || ""),
  created_at: item.created_at || item.createdAt || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const normalizeAssignmentEmployeeForDb = (item = {}) => ({
  id: String(item.id || `${item.assignment_id || item.assignmentId}-${item.employee_id || item.employeeId}`).trim(),
  assignment_id: String(item.assignment_id || item.assignmentId || "").trim(),
  employee_id: String(item.employee_id || item.employeeId || "").trim(),
  employee_name: String(item.employee_name || item.employeeName || ""),
  employee_phone: String(item.employee_phone || item.employeePhone || ""),
  branch: String(item.branch || ""),
  job: String(item.job || ""),
  status: String(item.status || "مكلف"),
  whatsapp_message: String(item.whatsapp_message || item.whatsappMessage || ""),
  sent_at: item.sent_at || item.sentAt || null,
  created_at: item.created_at || item.createdAt || new Date().toISOString(),
});

const assignmentFromDb = (row = {}) => ({
  assignment_id: row.assignment_id,
  assignment_date: row.assignment_date || "",
  branch: row.branch || "",
  location: row.location || "",
  start_time: row.start_time || "",
  end_time: row.end_time || "",
  reason: row.reason || "",
  notes: row.notes || "",
  created_by: row.created_by || "",
  created_at: row.created_at || "",
  updated_at: row.updated_at || "",
});

const assignmentEmployeeFromDb = (row = {}) => ({
  id: row.id,
  assignment_id: row.assignment_id || "",
  employee_id: row.employee_id || "",
  employee_name: row.employee_name || "",
  employee_phone: row.employee_phone || "",
  branch: row.branch || "",
  job: row.job || "",
  status: row.status || "مكلف",
  whatsapp_message: row.whatsapp_message || "",
  sent_at: row.sent_at || "",
  created_at: row.created_at || "",
});

export const overtimeService = {
  async listAssignments() {
    try {
      const rows = await supabase.select("overtime_assignments", "select=*&order=assignment_date.desc");
      return (rows || []).map(assignmentFromDb);
    } catch (error) {
      console.error("Supabase overtime_assignments load/save error:", error);
      throw new Error("فشل تحميل تكليفات العمل الإضافي من Supabase: " + error.message);
    }
  },
  async listAssignmentEmployees() {
    try {
      const rows = await supabase.select("overtime_assignment_employees", "select=*&order=created_at.desc");
      return (rows || []).map(assignmentEmployeeFromDb);
    } catch (error) {
      console.error("Supabase overtime_assignment_employees load/save error:", error);
      throw new Error("فشل تحميل موظفي العمل الإضافي من Supabase: " + error.message);
    }
  },
  async createAssignment(assignment, employees) {
    try {
      const savedAssignmentPayload = normalizeAssignmentForDb(assignment);
      const { data: savedAssignment, error: assignmentError } = await supabase
        .from("overtime_assignments")
        .upsert(savedAssignmentPayload, { onConflict: "assignment_id" })
        .select()
        .single();
      if (assignmentError) throw assignmentError;
      const employeeRows = employees.map((employee) =>
        normalizeAssignmentEmployeeForDb({
          ...employee,
          assignment_id: savedAssignmentPayload.assignment_id,
        }),
      );
      const { data: savedEmployees, error: employeesError } = await supabase
        .from("overtime_assignment_employees")
        .upsert(employeeRows, { onConflict: "id" })
        .select();
      if (employeesError) throw employeesError;
      return {
        assignment: assignmentFromDb(savedAssignment),
        employees: (savedEmployees || []).map(assignmentEmployeeFromDb),
      };
    } catch (error) {
      console.error("Supabase overtime_assignments load/save error:", error);
      throw new Error("فشل حفظ تكليف العمل الإضافي في Supabase: " + error.message);
    }
  },
  async updateAssignmentEmployee(row) {
    try {
      const payload = normalizeAssignmentEmployeeForDb(row);
      const { data, error } = await supabase
        .from("overtime_assignment_employees")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return assignmentEmployeeFromDb(data);
    } catch (error) {
      console.error("Supabase overtime_assignment_employees load/save error:", error);
      throw new Error("فشل تحديث حالة موظف العمل الإضافي في Supabase: " + error.message);
    }
  },
  async removeAssignment(id) {
    try {
      await supabase.request(`/rest/v1/overtime_assignment_employees?assignment_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
      return await supabase.request(`/rest/v1/overtime_assignments?assignment_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error("Supabase overtime_assignments load/save error:", error);
      throw new Error("فشل حذف تكليف العمل الإضافي من Supabase: " + error.message);
    }
  },
  subscribeAssignments(onChange) {
    return supabase.subscribeToTable("overtime_assignments", onChange);
  },
  subscribeAssignmentEmployees(onChange) {
    return supabase.subscribeToTable("overtime_assignment_employees", onChange);
  },
};
