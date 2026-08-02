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

const FALLBACK_BRANCHES = [
  "\u0641\u0631\u0639 \u0627\u0644\u0634\u0628\u0648\u0627\u0646\u064a",
  "\u0641\u0631\u0639 \u0627\u0644\u0645\u0631\u0643\u0632",
  "\u0641\u0631\u0639 \u0627\u0644\u0631\u0648\u0636\u0629",
  "\u0641\u0631\u0639 \u0627\u0644\u0635\u0645\u062f\u0629",
  "\u0641\u0631\u0639 \u0634\u0627\u0631\u0639 \u0635\u0646\u0639\u0627\u0621",
];
const FALLBACK_OPERATION_TYPES = ["\u0642\u0628\u0636", "\u0635\u0631\u0641", "\u0628\u064a\u0639", "\u0634\u0631\u0627\u0621", "\u062d\u0648\u0627\u0644\u0627\u062a \u0648\u0627\u0631\u062f", "\u062d\u0648\u0627\u0644\u0627\u062a \u0635\u0627\u062f\u0631", "\u0648\u0627\u062a\u0633\u0627\u0628 \u0648\u0627\u0631\u062f", "\u0648\u0627\u062a\u0633\u0627\u0628 \u0635\u0627\u062f\u0631", "\u0639\u0645\u0644\u064a\u0627\u062a \u0623\u062e\u0631\u0649"];
const normalizeTargetEmployee = (row = {}) => ({
  ...row,
  id: String(row.employee_id || row.id || "").trim(),
  employee_id: String(row.employee_id || row.id || "").trim(),
  name: row.name || row.employee_name || "",
  employee_name: row.employee_name || row.name || "",
  branch: row.branch || "",
  department: row.department || "",
  job: row.job || row.job_title || "",
  job_title: row.job_title || row.job || "",
});
const isActiveTargetEmployee = (row = {}) => { const status = String(row.status || "").trim().toLowerCase(); return row.active !== false && (!status || ["active", "\u0646\u0634\u0637", "\u0639\u0644\u0649 \u0631\u0623\u0633 \u0627\u0644\u0639\u0645\u0644"].includes(status)); };
const uniqueSorted = (values = []) => [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));

async function getActiveEmployeesForTargets(companyId) {
  try {
    required(companyId);
    const rows = [];
    for (let offset = 0; offset < 10000; offset += 1000) {
      const batch = await supabase.select("employees", `select=*&company_id=eq.${encodeURIComponent(companyId)}&limit=1000&offset=${offset}`);
      const list = Array.isArray(batch) ? batch : [];
      rows.push(...list);
      if (list.length < 1000) break;
    }
    return rows.map(normalizeTargetEmployee).filter((employee) => employee.id && isActiveTargetEmployee(employee)).sort((a, b) => String(a.branch).localeCompare(String(b.branch), "ar") || String(a.name).localeCompare(String(b.name), "ar"));
  } catch (error) {
    console.error("Target employees load error:", error);
    return [];
  }
}
async function getEmployeeTargetSelectionOptions(companyId) {
  const employees = await getActiveEmployeesForTargets(companyId);
  const dynamicBranches = uniqueSorted(employees.map((employee) => employee.branch)).filter((branch) => !FALLBACK_BRANCHES.includes(branch));
  const branches = [...FALLBACK_BRANCHES, ...dynamicBranches];
  return { employees, branches, options: [{ value: "__ALL_EMPLOYEES__", label: "\u0627\u0644\u0643\u0644" }, ...branches.map((branch) => ({ value: `__BRANCH__:${branch}`, label: `\u0645\u0648\u0638\u0641\u064a \u0641\u0631\u0639 ${branch.replace(/^\u0641\u0631\u0639\s*/, "")}` })), ...employees.map((employee) => ({ value: employee.id, label: `${employee.name} - ${employee.branch || "\u0628\u062f\u0648\u0646 \u0641\u0631\u0639"}` }))] };
}
async function getOperationTypeOptions(companyId) {
  try {
    required(companyId);
    const values = [];
    for (let offset = 0; offset < 10000; offset += 1000) {
      const batch = await supabase.select("daily_operations", `select=operation_type&company_id=eq.${encodeURIComponent(companyId)}&limit=1000&offset=${offset}`);
      const list = Array.isArray(batch) ? batch : [];
      values.push(...list.map((row) => row.operation_type));
      if (list.length < 1000) break;
    }
    const actual = uniqueSorted(values);
    return actual.length ? actual : [...FALLBACK_OPERATION_TYPES];
  } catch (error) {
    console.error("Operation types load error:", error);
    return [...FALLBACK_OPERATION_TYPES];
  }
}
async function saveEmployeeTargetsBulk(companyId, selection, targetDraft = {}) {
  required(companyId);
  const employees = await getActiveEmployeesForTargets(companyId);
  const selected = selection === "__ALL_EMPLOYEES__" ? employees : String(selection || "").startsWith("__BRANCH__:") ? employees.filter((employee) => employee.branch === String(selection).slice(11)) : employees.filter((employee) => employee.id === String(selection || ""));
  if (!selected.length) return { success: false, affectedCount: 0, message: "\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0645\u0648\u0638\u0641\u064a\u0646 \u0645\u0637\u0627\u0628\u0642\u064a\u0646 \u0644\u0644\u0627\u062e\u062a\u064a\u0627\u0631" };
  const existing = await load("performance_employee_targets", companyId, { period_month: targetDraft.period_month, period_year: targetDraft.period_year });
  const signature = (row) => [String(row.employee_id || ""), String(row.operation_type || ""), String(row.service_channel || "")].join("|");
  const existingBySignature = new Map(existing.map((row) => [signature(row), row]));
  const rows = selected.map((employee) => {
    const base = { ...targetDraft, company_id: companyId, employee_id: employee.id, employee_name: employee.name, branch: employee.branch, department: employee.department, job_title: employee.job_title || employee.job };
    const previous = existingBySignature.get(signature(base));
    return employeePayload({ ...base, target_id: previous?.target_id });
  });
  await supabase.upsert("performance_employee_targets", rows, { onConflict: "target_id" });
  return { success: true, affectedCount: rows.length, message: rows.length === 1 ? "\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0647\u062f\u0641 \u0644\u0645\u0648\u0638\u0641 \u0648\u0627\u062d\u062f" : `\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0647\u062f\u0641 \u0644\u0639\u062f\u062f ${rows.length} \u0645\u0648\u0638\u0641` };
}

const TARGET_NUMERIC_FIELDS = new Set(["target_count", "minimum_count", "excellent_count", "target_weight", "period_month", "period_year"]);
const TARGET_STRING_FIELDS = new Set(["employee_id", "employee_name", "branch", "department", "job_title", "operation_type", "service_channel", "notes"]);
export const normalizeTargetPatch = (patch = {}) => Object.entries(patch || {}).reduce((result, [key, value]) => {
  if (value === undefined) return result;
  if (TARGET_NUMERIC_FIELDS.has(key)) { if (value === "" || value === null) result[key] = null; else { const converted = Number(value); if (Number.isFinite(converted)) result[key] = converted; } }
  else if (TARGET_STRING_FIELDS.has(key)) result[key] = value === null ? "" : String(value);
  else if (key === "is_active") result[key] = Boolean(value);
  return result;
}, {});
async function updateEmployeeTarget(companyId, targetId, payload = {}) {
  required(companyId);
  if (!String(targetId || "").trim()) throw new Error("target_id is required.");
  const patch = { ...normalizeTargetPatch(payload), updated_at: now() };
  const rows = await supabase.request(`/rest/v1/performance_employee_targets?company_id=eq.${encodeURIComponent(companyId)}&target_id=eq.${encodeURIComponent(targetId)}`, { method: "PATCH", prefer: "return=representation", body: JSON.stringify(patch) });
  return Array.isArray(rows) ? rows[0] || null : rows;
}
async function updateEmployeeTargetsBulk(companyId, targetIds = [], patch = {}) {
  try {
    const ids = [...new Set((Array.isArray(targetIds) ? targetIds : []).map((value) => String(value || "").trim()).filter(Boolean))];
    if (!String(companyId || "").trim() || !ids.length) return { success: false, rows: [], affectedCount: 0, message: "\u0644\u0645 \u064a\u062a\u0645 \u062a\u062d\u062f\u064a\u062f \u0633\u062c\u0644\u0627\u062a \u0644\u0644\u062a\u0639\u062f\u064a\u0644" };
    const cleanPatch = normalizeTargetPatch(patch);
    if (!Object.keys(cleanPatch).length) return { success: false, rows: [], affectedCount: 0, message: "\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0642\u0648\u0644 \u0644\u0644\u062a\u0639\u062f\u064a\u0644" };
    cleanPatch.updated_at = now();
    const encodedIds = ids.map((value) => encodeURIComponent(JSON.stringify(value))).join(",");
    const rows = await supabase.request(`/rest/v1/performance_employee_targets?company_id=eq.${encodeURIComponent(companyId)}&target_id=in.(${encodedIds})`, { method: "PATCH", prefer: "return=representation", body: JSON.stringify(cleanPatch) });
    const resultRows = Array.isArray(rows) ? rows : [];
    const affectedCount = resultRows.length;
    if (!affectedCount) return { success: false, rows: [], affectedCount: 0, message: "\u0644\u0645 \u064a\u062a\u0645 \u062a\u0639\u062f\u064a\u0644 \u0623\u064a \u0633\u062c\u0644. \u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0633\u062c\u0644\u0627\u062a \u0627\u0644\u0645\u062d\u062f\u062f\u0629 \u0623\u0648 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a." };
    return { success: true, rows: resultRows, affectedCount, updatedCount: affectedCount, message: `\u062a\u0645 \u062a\u0639\u062f\u064a\u0644 ${affectedCount} \u0633\u062c\u0644 \u0628\u0646\u062c\u0627\u062d` };
  } catch (error) {
    console.error("Bulk update employee targets failed:", error);
    return { success: false, rows: [], affectedCount: 0, updatedCount: 0, message: "\u062a\u0639\u0630\u0631 \u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062c\u0645\u0627\u0639\u064a" };
  }
}
async function deleteEmployeeTargetsBulk(companyId, targetIds = []) {
  required(companyId);
  const ids = [...new Set((Array.isArray(targetIds) ? targetIds : []).map((value) => String(value || "").trim()).filter(Boolean))];
  if (!ids.length) return { success: true, deletedCount: 0 };
  const encodedIds = ids.map((value) => encodeURIComponent(value)).join(",");
  const rows = await supabase.request(`/rest/v1/performance_employee_targets?company_id=eq.${encodeURIComponent(companyId)}&target_id=in.(${encodedIds})`, { method: "DELETE", prefer: "return=representation" });
  return { success: true, deletedCount: Array.isArray(rows) ? rows.length : ids.length };
}

export const performanceTargetsService = {
  updateEmployeeTarget,
  updateEmployeeTargetsBulk,
  deleteEmployeeTargetsBulk,
  normalizeTargetPatch,
  getActiveEmployeesForTargets,
  getEmployeeTargetSelectionOptions,
  getOperationTypeOptions,
  saveEmployeeTargetsBulk,
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
