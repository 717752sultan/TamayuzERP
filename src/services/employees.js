import { supabase } from "./supabase";

export const normalizeEmployeeForDb = (item = {}) => ({
  id: String(item.id || item.employee_id || item.employeeId || "").trim(),
  name: String(item.name || item.employee_name || item.employeeName || "").trim(),
  branch: String(item.branch || ""),
  job: String(item.job || ""),
  hire_date: item.hire_date || item.hireDate || null,
  salary: Number(item.salary || 0),
  phone: String(item.phone || ""),
  status: String(item.status || "نشط"),
  manager: String(item.manager || ""),
});

const fromDb = (row = {}) => ({
  id: row.id,
  company_id: row.company_id || "",
  name: row.name || "",
  branch: row.branch || "",
  job: row.job || row.job_title || "",
  hireDate: row.hire_date || row.hireDate || "",
  salary: Number(row.salary || 0),
  phone: row.phone || "",
  status: row.status || "نشط",
  manager: row.manager || row.direct_manager || "",
});

const normalizeEmployeeRows = (employeeOrEmployees) =>
  (Array.isArray(employeeOrEmployees) ? employeeOrEmployees : [employeeOrEmployees])
    .map(normalizeEmployeeForDb)
    .filter((row) => row.id && row.name);

export const employeesService = {
  async list() {
    try {
      const rows = await supabase.select("employees", "select=*&order=id.asc");
      return (rows || []).map(fromDb);
    } catch (error) {
      console.error("Supabase employees load/save error:", error);
      throw new Error("فشل تحميل بيانات الموظفين من Supabase: " + error.message);
    }
  },

  async upsert(employeeOrEmployees) {
    const rows = normalizeEmployeeRows(employeeOrEmployees);
    if (!rows.length) return [];
    try {
      const { data, error } = await supabase.from("employees").upsert(rows, { onConflict: "id" }).select();
      if (error) throw error;
      return (data || []).map(fromDb);
    } catch (error) {
      console.error("Supabase employees load/save error:", error);
      throw new Error("فشل حفظ بيانات الموظفين في Supabase: " + error.message);
    }
  },

  async remove(id) {
    try {
      return await supabase.remove("employees", id);
    } catch (error) {
      console.error("Supabase employees load/save error:", error);
      throw new Error("فشل حذف بيانات الموظف من Supabase: " + error.message);
    }
  },

  subscribe(onChange) {
    return supabase.subscribeToTable("employees", onChange);
  },
};
