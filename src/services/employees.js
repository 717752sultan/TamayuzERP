import { supabase } from "./supabase";

const fromDb = (row) => ({
  id: row.id,
  name: row.name || "",
  branch: row.branch || "",
  job: row.job || row.job_title || "",
  hireDate: row.hire_date || row.hireDate || "",
  salary: Number(row.salary || 0),
  phone: row.phone || "",
  status: row.status || "نشط",
  manager: row.manager || row.direct_manager || "",
});

const toDb = (employee) => ({
  id: employee.id,
  name: employee.name,
  branch: employee.branch,
  job: employee.job,
  hire_date: employee.hireDate,
  salary: Number(employee.salary || 0),
  phone: employee.phone,
  status: employee.status,
  manager: employee.manager,
});

export const employeesService = {
  async list() {
    return (await supabase.select("employees", "select=*&order=id.asc")).map(fromDb);
  },
  async upsert(employeeOrEmployees) {
    const rows = (Array.isArray(employeeOrEmployees) ? employeeOrEmployees : [employeeOrEmployees]).map(toDb);
    return (await supabase.upsert("employees", rows)).map(fromDb);
  },
  remove(id) {
    return supabase.remove("employees", id);
  },
  subscribe(onChange) {
    return supabase.subscribeToTable("employees", onChange);
  },
};
