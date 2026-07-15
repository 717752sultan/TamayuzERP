import { getCurrentCompanyId } from "./tenant";
import { supabase } from "./supabase";

export const calculateOvertimeHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = String(startTime).split(":").map(Number);
  const [eh, em] = String(endTime).split(":").map(Number);
  if ([sh, sm, eh, em].some((value) => Number.isNaN(value))) return 0;
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end <= start) end += 24 * 60;
  return Number(((end - start) / 60).toFixed(2));
};

const normalizeAssignmentForDb = (item = {}) => ({
  assignment_id: String(item.assignment_id || item.assignmentId || `OT-${Date.now()}`).trim(),
  assignment_date: item.assignment_date || item.assignmentDate || null,
  branch: String(item.branch || ""),
  location: String(item.location || ""),
  start_time: String(item.start_time || item.startTime || ""),
  end_time: String(item.end_time || item.endTime || ""),
  reason: String(item.reason || ""),
  notes: String(item.notes || ""),
  approval_status: String(item.approval_status || item.approvalStatus || "مسودة"),
  approved_by: String(item.approved_by || item.approvedBy || ""),
  approved_at: item.approved_at || item.approvedAt || null,
  rejection_reason: String(item.rejection_reason || item.rejectionReason || ""),
  approval_notes: String(item.approval_notes || item.approvalNotes || ""),
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
  total_hours: Number(row.total_hours || calculateOvertimeHours(row.start_time, row.end_time)),
  reason: row.reason || "",
  notes: row.notes || "",
  approval_status: row.approval_status || "مسودة",
  approved_by: row.approved_by || "",
  approved_at: row.approved_at || "",
  rejection_reason: row.rejection_reason || "",
  approval_notes: row.approval_notes || "",
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
  updated_at: row.updated_at || "",
});

const requireCurrentCompany = () => {
  const companyId = getCurrentCompanyId();
  if (!companyId) throw new Error("لم يتم تحديد الشركة الحالية");
  return companyId;
};

export const overtimeService = {
  calculateOvertimeHours,

  async loadOvertimeAssignments(_companyId, filters = {}) {
    const rows = await this.listAssignments();
    return rows.filter((row) =>
      (!filters.date || row.assignment_date === filters.date) &&
      (!filters.month || String(row.assignment_date || "").startsWith(filters.month)) &&
      (!filters.branch || filters.branch === "all" || row.branch === filters.branch),
    );
  },

  async listAssignments() {
    try {
      requireCurrentCompany();
      const rows = await supabase.select("overtime_assignments", "select=*&order=assignment_date.desc");
      return (rows || []).map(assignmentFromDb);
    } catch (error) {
      console.error("Overtime assignment error:", error);
      throw new Error("تعذر تحميل تكليفات العمل الإضافي");
    }
  },

  async listAssignmentEmployees() {
    try {
      requireCurrentCompany();
      const rows = await supabase.select("overtime_assignment_employees", "select=*&order=created_at.desc");
      return (rows || []).map(assignmentEmployeeFromDb);
    } catch (error) {
      console.error("Overtime assignment error:", error);
      throw new Error("تعذر تحميل موظفي تكليفات العمل الإضافي");
    }
  },

  async createAssignment(assignment, employees = []) {
    try {
      requireCurrentCompany();
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
      console.error("Overtime assignment error:", error);
      throw new Error(error.message || "تعذر حفظ تكليف العمل الإضافي");
    }
  },

  async createOvertimeAssignment(payload) {
    return this.createAssignment(payload, payload.employees || []);
  },

  async updateOvertimeAssignment(id, payload) {
    try {
      requireCurrentCompany();
      const row = normalizeAssignmentForDb({ ...payload, assignment_id: id || payload.assignment_id });
      const { data, error } = await supabase
        .from("overtime_assignments")
        .upsert(row, { onConflict: "assignment_id" })
        .select()
        .single();
      if (error) throw error;
      return assignmentFromDb(data);
    } catch (error) {
      console.error("Overtime assignment error:", error);
      throw new Error(error.message || "تعذر تحديث تكليف العمل الإضافي");
    }
  },

  async updateAssignmentEmployee(row) {
    try {
      requireCurrentCompany();
      const payload = normalizeAssignmentEmployeeForDb(row);
      const { data, error } = await supabase
        .from("overtime_assignment_employees")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return assignmentEmployeeFromDb(data);
    } catch (error) {
      console.error("Overtime assignment error:", error);
      throw new Error(error.message || "تعذر تحديث بيانات موظف العمل الإضافي");
    }
  },

  async updateOvertimeAssignmentEmployee(row) {
    return this.updateAssignmentEmployee(row);
  },

  async cancelOvertimeAssignmentEmployee(id) {
    return this.updateAssignmentEmployee({ id, status: "ملغي" });
  },

  async cancelOvertimeAssignment(id) {
    return this.updateOvertimeAssignment(id, { assignment_id: id, approval_status: "ملغي" });
  },

  async deleteOvertimeAssignment(id) {
    try {
      requireCurrentCompany();
      return await supabase.request(`/rest/v1/overtime_assignment_employees?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error("Overtime assignment error:", error);
      throw new Error(error.message || "تعذر حذف موظف من تكليف العمل الإضافي");
    }
  },

  async removeAssignment(id) {
    try {
      requireCurrentCompany();
      await supabase.request(`/rest/v1/overtime_assignment_employees?assignment_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
      return await supabase.request(`/rest/v1/overtime_assignments?assignment_id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
    } catch (error) {
      console.error("Overtime assignment error:", error);
      throw new Error("تعذر حذف تكليف العمل الإضافي");
    }
  },

  subscribeAssignments(onChange) {
    return supabase.subscribeToTable("overtime_assignments", onChange);
  },

  subscribeAssignmentEmployees(onChange) {
    return supabase.subscribeToTable("overtime_assignment_employees", onChange);
  },
};
