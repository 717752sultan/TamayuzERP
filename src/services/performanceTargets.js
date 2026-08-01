import { supabase } from "./supabase";

const id = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const required = (companyId) => { if (!String(companyId || "").trim()) throw new Error("company_id is required."); };
const now = () => new Date().toISOString();

const load = async (table, companyId, filters = {}) => {
  try {
    required(companyId);
    const monthText = String(filters.month || "");
    const monthFromText = monthText.includes("-") ? monthText.split("-")[1] : monthText;
    const yearFromText = monthText.includes("-") ? monthText.split("-")[0] : "";
    const params = ["select=*", `company_id=eq.${encodeURIComponent(companyId)}`];
    if (filters.period_month || monthFromText) params.push(`period_month=eq.${encodeURIComponent(filters.period_month || monthFromText)}`);
    if (filters.period_year || filters.year || yearFromText) params.push(`period_year=eq.${encodeURIComponent(filters.period_year || filters.year || yearFromText)}`);
    if (filters.employee_id) params.push(`employee_id=eq.${encodeURIComponent(filters.employee_id)}`);
    if (filters.branch) params.push(`branch=eq.${encodeURIComponent(filters.branch)}`);
    return await supabase.select(table, `${params.join("&")}&order=updated_at.desc`);
  } catch (error) {
    console.error(`${table} load error:`, error);
    return [];
  }
};

const employeePayload = (payload = {}) => ({
  target_id: payload.target_id || id("target"),
  company_id: payload.company_id,
  period_month: num(payload.period_month || payload.month),
  period_year: num(payload.period_year || payload.year),
  employee_id: String(payload.employee_id || "").trim(),
  employee_name: payload.employee_name || "",
  branch: payload.branch || "",
  department: payload.department || "",
  job_title: payload.job_title || payload.job || "",
  operation_type: payload.operation_type || "",
  service_channel: payload.service_channel || "",
  target_count: num(payload.target_count),
  minimum_count: num(payload.minimum_count),
  excellent_count: num(payload.excellent_count),
  target_weight: num(payload.target_weight || 100),
  is_active: payload.is_active !== false,
  notes: payload.notes || "",
  updated_at: now(),
});

const branchPayload = (payload = {}) => ({
  branch_target_id: payload.branch_target_id || id("branch-target"),
  company_id: payload.company_id,
  period_month: num(payload.period_month || payload.month),
  period_year: num(payload.period_year || payload.year),
  branch: payload.branch || "",
  operation_type: payload.operation_type || "",
  service_channel: payload.service_channel || "",
  target_count: num(payload.target_count),
  minimum_count: num(payload.minimum_count),
  excellent_count: num(payload.excellent_count),
  target_customers: num(payload.target_customers),
  attendance_compliance_target: num(payload.attendance_compliance_target),
  is_active: payload.is_active !== false,
  notes: payload.notes || "",
  updated_at: now(),
});

const save = async (table, key, payload, normalize) => {
  required(payload.company_id);
  const row = normalize(payload);
  const { data, error } = await supabase.from(table).upsert(row, { onConflict: key }).select().single();
  if (error) throw error;
  return data;
};

const remove = async (table, key, value, companyId) => {
  required(companyId);
  return supabase.request(`/rest/v1/${table}?${key}=eq.${encodeURIComponent(value)}&company_id=eq.${encodeURIComponent(companyId)}`, { method: "DELETE", prefer: "return=minimal" });
};

export const performanceTargetsService = {
  loadEmployeeTargets: (companyId, filters = {}) => load("performance_employee_targets", companyId, filters),
  saveEmployeeTarget: (payload) => save("performance_employee_targets", "target_id", payload, employeePayload),
  deleteEmployeeTarget: (value, companyId) => remove("performance_employee_targets", "target_id", value, companyId),
  loadBranchTargets: (companyId, filters = {}) => load("performance_branch_targets", companyId, filters),
  saveBranchTarget: (payload) => save("performance_branch_targets", "branch_target_id", payload, branchPayload),
  deleteBranchTarget: (value, companyId) => remove("performance_branch_targets", "branch_target_id", value, companyId),
  async copyEmployeeTargetsFromPreviousMonth(companyId, fromMonth, fromYear, toMonth, toYear) {
    const rows = await this.loadEmployeeTargets(companyId, { period_month: fromMonth, period_year: fromYear });
    const payload = rows.map((row) => employeePayload({ ...row, target_id: id("target"), period_month: toMonth, period_year: toYear }));
    return payload.length ? supabase.upsert("performance_employee_targets", payload, { onConflict: "target_id" }) : [];
  },
  async copyBranchTargetsFromPreviousMonth(companyId, fromMonth, fromYear, toMonth, toYear) {
    const rows = await this.loadBranchTargets(companyId, { period_month: fromMonth, period_year: fromYear });
    const payload = rows.map((row) => branchPayload({ ...row, branch_target_id: id("branch-target"), period_month: toMonth, period_year: toYear }));
    return payload.length ? supabase.upsert("performance_branch_targets", payload, { onConflict: "branch_target_id" }) : [];
  },
  async loadTargetContext(companyId, filters = {}) {
    const [employeeTargets, branchTargets] = await Promise.all([
      this.loadEmployeeTargets(companyId, filters),
      this.loadBranchTargets(companyId, filters),
    ]);
    return { employeeTargets, branchTargets };
  },
  findTargetForEmployee(employee = {}, context = {}, filters = {}) {
    const employeeId = String(employee.id || employee.employee_id || filters.employeeId || "").trim();
    const month = Number(filters.period_month || String(filters.month || "").split("-")[1] || 0);
    const year = Number(filters.period_year || String(filters.month || "").split("-")[0] || 0);
    const employeeTarget = (context.employeeTargets || []).find((row) => String(row.employee_id) === employeeId && (!month || Number(row.period_month) === month) && (!year || Number(row.period_year) === year) && row.is_active !== false);
    if (employeeTarget) return { source: "employee", target_operations: num(employeeTarget.target_count) || null };
    const branchTarget = (context.branchTargets || []).find((row) => (!month || Number(row.period_month) === month) && (!year || Number(row.period_year) === year) && row.is_active !== false && (!row.branch || row.branch === employee.branch));
    if (branchTarget) return { source: "branch", target_operations: num(branchTarget.target_count) || null };
    const explicit = Number(filters.target_operations || employee.target_operations || employee.kpi_target_operations || 0);
    if (Number.isFinite(explicit) && explicit > 0) return { source: "explicit", target_operations: explicit };
    return { source: "missing", target_operations: null };
  },
};

export const { loadEmployeeTargets, saveEmployeeTarget, deleteEmployeeTarget, copyEmployeeTargetsFromPreviousMonth, loadBranchTargets, saveBranchTarget, deleteBranchTarget, copyBranchTargetsFromPreviousMonth } = performanceTargetsService;
