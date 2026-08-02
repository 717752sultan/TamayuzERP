import { supabase } from "./supabase";
import { isApprovedDailyOperation } from "./dailyOperations";
import { exportWorkbook } from "./reportExport";
import { performanceTargetsService } from "./performanceTargets";
import { getActivePerformanceAutomationSetting } from "./performanceAutomationSettings";

const n = (value) => Number(value || 0) || 0;
const clampScore = (value) => Number(Math.max(0, Math.min(100, n(value))).toFixed(2));

export const classifyEmployeePerformance = (score) => {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return { label: "غير محسوب", tone: "slate" };
  const value = Number(score);
  if (value >= 90) return { label: "ممتاز", tone: "emerald" };
  if (value >= 80) return { label: "جيد جدًا", tone: "blue" };
  if (value >= 70) return { label: "جيد", tone: "cyan" };
  if (value >= 60) return { label: "مقبول", tone: "amber" };
  return { label: "يحتاج تحسين", tone: "red" };
};

export const classifyOperationType = (operationType = "") => {
  const text = String(operationType || "");
  if (/قبض|حوالات وارد|وارد/.test(text)) return "receipt";
  if (/صرف|حوالات صادر|صادر/.test(text)) return "payment";
  if (/بيع/.test(text)) return "sale";
  if (/شراء/.test(text)) return "purchase";
  return "other";
};

export const getProductivityTargetOperations = (employee = {}, filters = {}) => {
  const explicit = Number(filters.target_operations || employee.target_operations || employee.kpi_target_operations || 0);
  return Number.isFinite(explicit) && explicit > 0 ? explicit : null;
};

export const calculateProductivityScore = (totalOperations = 0, targetOperations = null, maximum = 100) => targetOperations && Number(targetOperations) > 0 ? Number(Math.min(Number(maximum || 100), (n(totalOperations) / Number(targetOperations)) * 100).toFixed(2)) : null;

export const normalizeEmployeeKpiResult = ({ employee = {}, employeeId = "", scoreInfo = null, operations = {}, filters = {} } = {}) => {
  const totalOperations = n(operations.total_operations);
  const targetOperations = getProductivityTargetOperations(employee, filters);
  const achievementPercentage = targetOperations ? Number(((totalOperations / targetOperations) * 100).toFixed(2)) : 0;
  const productivityScore = clampScore(achievementPercentage);
  const manualScore = scoreInfo ? clampScore(scoreInfo.total) : null;
  const finalKpiScore = productivityScore === null ? (manualScore === null ? null : manualScore) : clampScore(manualScore !== null ? (manualScore * 0.6) + (productivityScore * 0.4) : productivityScore);
  const calculationSource = manualScore !== null ? "محسوب من الإنتاجية والتقييم" : "محسوب من الإنتاجية";
  const calculationReason = manualScore !== null ? "تم احتساب الدرجة النهائية من التقييم اليدوي 60% والإنتاجية 40%." : "لا يوجد تقييم يدوي، لذلك تم احتساب الدرجة من العمليات المعتمدة الداخلة في KPI فقط.";
  const performance = classifyEmployeePerformance(finalKpiScore);
  const job = employee.job || employee.job_name || scoreInfo?.criteria?.[0]?.job_name || "";
  return { employee_id: employeeId, employee_name: employee.name || scoreInfo?.criteria?.[0]?.employee_name || operations.employee_name || employeeId, job, job_name: job, branch: employee.branch || scoreInfo?.criteria?.[0]?.branch || [...(operations.branches || [])][0] || "", branches: [...(operations.branches || [])], total_operations: totalOperations, target_operations: targetOperations, achievement_percentage: achievementPercentage, productivity_score: productivityScore, manual_score: manualScore, final_kpi_score: finalKpiScore, final_score: finalKpiScore, rating_label: performance.label, performance_label: performance.label, performance_tone: performance.tone, calculation_source: calculationSource, calculation_reason: calculationReason };
};

const normalizeScore = (row = {}) => ({
  score_id: row.score_id || "",
  company_id: row.company_id || "",
  employee_id: row.employee_id || "",
  employee_name: row.employee_name || "",
  job_name: row.job_name || "",
  branch: row.branch || "",
  month: row.month || "",
  criterion_id: row.criterion_id || "",
  criterion_name: row.criterion_name || "",
  actual_value: n(row.actual_value),
  target_value: n(row.target_value),
  score: n(row.score),
  weighted_score: n(row.weighted_score),
  source_module: row.source_module || "",
  notes: row.notes || "",
});

const filterEmployees = (employees = [], companyId = "", filters = {}) => (employees || []).filter((employee) =>
  (!companyId || !employee.company_id || employee.company_id === companyId)
  && (!filters.branch || filters.branch === "all" || employee.branch === filters.branch)
  && (!filters.job || filters.job === "all" || employee.job === filters.job || employee.job_name === filters.job)
  && (!filters.employeeId || employee.id === filters.employeeId)
  && (!filters.department || filters.department === "all" || employee.department === filters.department));

const normalizeEmployeeIdValue = (value = "") => String(value || "").trim();

const getMonthDateRange = (month = "") => {
  const match = String(month || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (!year || !monthNumber) return null;
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return {
    fromDate: `${year}-${String(monthNumber).padStart(2, "0")}-01`,
    toDate: `${year}-${String(monthNumber).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
};

const normalizeOperation = (row = {}) => ({
  operation_id: row.operation_id || "",
  company_id: row.company_id || "",
  employee_id: normalizeEmployeeIdValue(row.employee_id),
  original_employee_id: normalizeEmployeeIdValue(row.original_employee_id || row.employee_id),
  alias_employee_id: row.alias_employee_id || "",
  employee_name: row.employee_name || "",
  branch: row.branch || "",
  department: row.department || "",
  operation_date: row.operation_date || "",
  month: row.month || String(row.operation_date || "").slice(0, 7),
  operation_type: row.operation_type || "",
  operation_count: n(row.operation_count),
  status: row.status || "",
  included_in_kpi: row.included_in_kpi === true,
});

const loadEmployeeIdAliases = async (companyId) => {
  if (!companyId) return { aliasToCanonical: new Map(), canonicalToAliases: new Map() };
  try {
    const rows = await supabase.select("employee_id_aliases", [
      "select=company_id,alias_employee_id,canonical_employee_id,employee_name,is_active",
      `company_id=eq.${encodeURIComponent(companyId)}`,
      "is_active=eq.true",
    ].join("&"));
    const aliasToCanonical = new Map();
    const canonicalToAliases = new Map();
    (rows || []).forEach((row) => {
      const alias = normalizeEmployeeIdValue(row.alias_employee_id);
      const canonical = normalizeEmployeeIdValue(row.canonical_employee_id);
      if (!alias || !canonical) return;
      aliasToCanonical.set(alias, canonical);
      const aliases = canonicalToAliases.get(canonical) || new Set();
      aliases.add(alias);
      canonicalToAliases.set(canonical, aliases);
    });
    return { aliasToCanonical, canonicalToAliases };
  } catch (error) {
    console.error("KPI employee_id_aliases load error:", error);
    return { aliasToCanonical: new Map(), canonicalToAliases: new Map() };
  }
};

const applyEmployeeIdAliases = (rows = [], aliasToCanonical = new Map()) => (rows || []).map((row) => {
  const originalEmployeeId = normalizeEmployeeIdValue(row.employee_id);
  const canonicalEmployeeId = aliasToCanonical.get(originalEmployeeId) || originalEmployeeId;
  return normalizeOperation({
    ...row,
    employee_id: canonicalEmployeeId,
    original_employee_id: originalEmployeeId,
    alias_employee_id: canonicalEmployeeId !== originalEmployeeId ? originalEmployeeId : "",
  });
});

const loadApprovedKpiOperations = async (companyId, filters = {}) => {
  const params = [
    "select=*",
    `company_id=eq.${encodeURIComponent(companyId || "")}`,
    `status=eq.${encodeURIComponent("معتمد")}`,
    "included_in_kpi=eq.true",
  ];
  if (filters.fromDate || filters.toDate) {
    if (filters.fromDate) params.push(`operation_date=gte.${encodeURIComponent(filters.fromDate)}`);
    if (filters.toDate) params.push(`operation_date=lte.${encodeURIComponent(filters.toDate)}`);
  } else if (filters.month) {
    const range = getMonthDateRange(filters.month);
    if (range) {
      params.push(`operation_date=gte.${encodeURIComponent(range.fromDate)}`);
      params.push(`operation_date=lte.${encodeURIComponent(range.toDate)}`);
    }
  }
  if (filters.branch && filters.branch !== "all") params.push(`branch=eq.${encodeURIComponent(filters.branch)}`);
  if (filters.department && filters.department !== "all") params.push(`department=eq.${encodeURIComponent(filters.department)}`);
  if (filters.operationType && filters.operationType !== "all") params.push(`operation_type=eq.${encodeURIComponent(filters.operationType)}`);
  const rows = [];
  const limit = 1000;
  for (let offset = 0; offset < 10000; offset += limit) {
    const batch = await supabase.select("daily_operations", `${params.join("&")}&order=operation_date.desc&limit=${limit}&offset=${offset}`);
    const list = Array.isArray(batch) ? batch : [];
    rows.push(...list);
    if (list.length < limit) break;
  }
  const aliasContext = filters.aliasContext || await loadEmployeeIdAliases(companyId);
  return applyEmployeeIdAliases(rows, aliasContext.aliasToCanonical)
    .filter((row) => row.employee_id && row.operation_count > 0)
    .filter((row) => !filters.employeeId || row.employee_id === filters.employeeId || row.original_employee_id === filters.employeeId);
};

export const buildEmployeeOperationsSummary = (operationsRows = []) => {
  const map = new Map();
  (operationsRows || []).filter(isApprovedDailyOperation).forEach((row) => {
    const employeeId = row.employee_id || "";
    const item = map.get(employeeId) || { employee_id: employeeId, employee_name: row.employee_name || "", branches: new Set(), originalEmployeeIds: new Set(), total_operations: 0, receipt_operations: 0, payment_operations: 0, sale_operations: 0, purchase_operations: 0, other_operations: 0, daily: new Map(), byType: new Map(), byBranch: new Map(), byOriginalEmployeeId: new Map() };
    const count = n(row.operation_count);
    const kind = classifyOperationType(row.operation_type);
    item.total_operations += count;
    const originalEmployeeId = row.original_employee_id || row.employee_id || "";
    if (originalEmployeeId) {
      item.originalEmployeeIds.add(originalEmployeeId);
      item.byOriginalEmployeeId.set(originalEmployeeId, (item.byOriginalEmployeeId.get(originalEmployeeId) || 0) + count);
    }
    if (row.branch) {
      item.branches.add(row.branch);
      item.byBranch.set(row.branch, (item.byBranch.get(row.branch) || 0) + count);
    }
    if (kind === "receipt") item.receipt_operations += count;
    else if (kind === "payment") item.payment_operations += count;
    else if (kind === "sale") item.sale_operations += count;
    else if (kind === "purchase") item.purchase_operations += count;
    else item.other_operations += count;
    const day = item.daily.get(row.operation_date) || { operation_date: row.operation_date, total_operations: 0, receipt_operations: 0, payment_operations: 0, sale_operations: 0, purchase_operations: 0 };
    day.total_operations += count;
    if (kind === "receipt") day.receipt_operations += count;
    if (kind === "payment") day.payment_operations += count;
    if (kind === "sale") day.sale_operations += count;
    if (kind === "purchase") day.purchase_operations += count;
    item.daily.set(row.operation_date, day);
    item.byType.set(row.operation_type || "أخرى", (item.byType.get(row.operation_type || "أخرى") || 0) + count);
    map.set(employeeId, item);
  });
  return map;
};

export const buildKpiEmployeeRanking = (employees = [], kpiRows = [], operationsRows = [], filters = {}) => {
  const opsByEmployee = buildEmployeeOperationsSummary(operationsRows);
  const scoresByEmployee = new Map();
  (kpiRows || []).forEach((row) => {
    if (!row.employee_id) return;
    const current = scoresByEmployee.get(row.employee_id) || { criteria: [], total: 0 };
    current.criteria.push(row);
    current.total += n(row.weighted_score);
    scoresByEmployee.set(row.employee_id, current);
  });
  const allEmployeeIds = new Set([...employees.map((e) => e.id), ...scoresByEmployee.keys(), ...opsByEmployee.keys()]);
  const rows = [...allEmployeeIds].map((employeeId) => {
    const employee = employees.find((item) => String(item.id) === String(employeeId)) || {};
    const scoreInfo = scoresByEmployee.get(employeeId);
    const ops = opsByEmployee.get(employeeId) || { total_operations: 0, receipt_operations: 0, payment_operations: 0, sale_operations: 0, purchase_operations: 0, daily: new Map(), byType: new Map(), byBranch: new Map(), byOriginalEmployeeId: new Map(), branches: new Set(), originalEmployeeIds: new Set([employeeId]) };
    const normalized = normalizeEmployeeKpiResult({ employee, employeeId, scoreInfo, operations: ops, filters });
    const strengths = [];
    if (ops.receipt_operations) strengths.push("قبض");
    if (ops.payment_operations) strengths.push("صرف");
    if (ops.sale_operations) strengths.push("بيع");
    if (ops.purchase_operations) strengths.push("شراء");
    return {
      ...normalized,
      linked_employee_ids: [...(ops.originalEmployeeIds || new Set([employeeId]))],
      department: employee.department || "",
      strengths: strengths.length ? strengths.join("، ") : "ثبات الأداء",
      notes: normalized.calculation_reason,
      criteria: scoreInfo?.criteria || [],
      operations: ops,
    };
  }).filter((row) =>
    (!filters.branch || filters.branch === "all" || row.branch === filters.branch || row.branches?.includes(filters.branch))
    && (!filters.job || filters.job === "all" || row.job_name === filters.job)
    && (!filters.employeeId || row.employee_id === filters.employeeId)
    && (!filters.department || filters.department === "all" || row.department === filters.department));
  return rows
    .sort((a, b) => (b.final_kpi_score ?? b.final_score ?? -1) - (a.final_kpi_score ?? a.final_score ?? -1) || n(b.achievement_percentage) - n(a.achievement_percentage) || n(b.total_operations ?? b.operations?.total_operations) - n(a.total_operations ?? a.operations?.total_operations))
    .map((row, index) => ({ ...row, rank: index + 1 }));
};

export const kpiScoresService = {
  async loadKpiScores(companyId, filters = {}, employees = []) {
    const month = filters.month || "";
    const aliasContext = await loadEmployeeIdAliases(companyId);
    const params = ["select=*", `company_id=eq.${encodeURIComponent(companyId || "")}`];
    if (month) params.push(`month=eq.${encodeURIComponent(month)}`);
    const kpiRowsRaw = await supabase.select("performance_kpi_scores", `${params.join("&")}&order=employee_name.asc`);
    const kpiRows = (kpiRowsRaw || []).map((row) => {
      const normalized = normalizeScore(row);
      const originalEmployeeId = normalizeEmployeeIdValue(normalized.employee_id);
      return {
        ...normalized,
        original_employee_id: originalEmployeeId,
        employee_id: aliasContext.aliasToCanonical.get(originalEmployeeId) || originalEmployeeId,
      };
    });
    const operationsRows = await loadApprovedKpiOperations(companyId, { ...filters, aliasContext });
    const monthParts = String(month || "").split("-").map(Number);
    const [targetRows,branchTargets,automationSetting] = monthParts[0] && monthParts[1] ? await Promise.all([performanceTargetsService.loadEmployeeTargets(companyId,{period_year:monthParts[0],period_month:monthParts[1],is_active:true}).catch(()=>[]),performanceTargetsService.loadBranchTargets(companyId,{period_year:monthParts[0],period_month:monthParts[1],is_active:true}).catch(()=>[]),getActivePerformanceAutomationSetting(companyId,{period_year:monthParts[0],period_month:monthParts[1]}).catch(()=>null)]) : [[],[],null];
    const targetsByEmployee=new Map(targetRows.map(row=>[String(row.employee_id),row]));
    const scopedEmployees=filterEmployees(employees,companyId,filters).map(employee=>{const employeeTarget=targetsByEmployee.get(String(employee.id)),branchTarget=branchTargets.find(row=>row.is_active!==false&&row.branch===employee.branch),target=Number(employeeTarget?.target_count||branchTarget?.target_count||automationSetting?.target_monthly_operations||0)||null;return{...employee,target_operations:target,monthly_target:employeeTarget||branchTarget||automationSetting||null,target_source:employeeTarget?"employee":branchTarget?"branch":automationSetting?"automation":"missing",missing_monthly_target:!target};});
    const ranking = buildKpiEmployeeRanking(scopedEmployees, kpiRows, operationsRows, { ...filters, max_productivity_score: automationSetting?.max_productivity_score || 100 }).map((row) => { const source = scopedEmployees.find((employee) => String(employee.id) === String(row.employee_id)); return { ...row, missing_monthly_target: source?.missing_monthly_target === true, target_warning: source?.missing_monthly_target ? "\u0644\u0645 \u064a\u062a\u0645 \u062a\u062d\u062f\u064a\u062f \u0647\u062f\u0641 \u0644\u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0638\u0641 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631." : "" }; });
    return { kpiRows, operationsRows, ranking, employees: scopedEmployees, aliases: aliasContext };
  },

  async loadEmployeeKpiDetails(companyId, employeeId, filters = {}, employees = []) {
    const data = await this.loadKpiScores(companyId, { ...filters, employeeId }, employees);
    const employee = data.ranking.find((row) => String(row.employee_id) === String(employeeId)) || null;
    const peers = data.ranking.filter((row) => row.employee_id !== employeeId && (!employee?.job_name || row.job_name === employee.job_name || row.branch === employee.branch));
    const peerAverage = peers.length ? peers.reduce((sum, row) => sum + n(row.final_score), 0) / peers.filter((row) => row.final_score !== null).length : 0;
    return { ...employee, peer_average: Number((peerAverage || 0).toFixed(2)), comparison_to_average: employee?.final_score === null ? null : Number((n(employee?.final_score) - (peerAverage || 0)).toFixed(2)) };
  },

  loadEmployeeOperationsSummary(companyId, filters = {}) {
    return loadApprovedKpiOperations(companyId, filters);
  },

  exportEmployeeKpiReportExcel(report) {
    const operationRows = [...(report?.operations?.byType || new Map()).entries()].map(([operation_type, operation_count]) => ({ operation_type, operation_count }));
    const originalIdRows = [...(report?.operations?.byOriginalEmployeeId || new Map()).entries()].map(([employee_id, operation_count]) => ({ employee_id, operation_count }));
    const branchRows = [...(report?.operations?.byBranch || new Map()).entries()].map(([branch, operation_count]) => ({ branch, operation_count }));
    const dailyRows = [...(report?.operations?.daily || new Map()).values()];
    exportWorkbook([
      { name: "ملخص الموظف", rows: [report || {}] },
      { name: "معايير التقييم", rows: report?.criteria || [] },
      { name: "عمليات الموظف", rows: operationRows },
      { name: "حسب الرقم الأصلي", rows: originalIdRows },
      { name: "حسب الفرع", rows: branchRows },
      { name: "الأداء اليومي", rows: dailyRows },
    ], `kpi-employee-report-${report?.employee_id || "employee"}.xlsx`);
  },

  exportKpiRankingExcel(ranking = [], kpiRows = []) {
    exportWorkbook([
      { name: "ترتيب الموظفين", rows: ranking.map((row) => ({
        rank: row.rank,
        employee_id: row.employee_id,
        linked_employee_ids: row.linked_employee_ids?.join("، ") || row.employee_id,
        employee_name: row.employee_name,
        job_name: row.job_name,
        branch: row.branch,
        total_operations: row.operations?.total_operations || 0,
        target_operations: row.target_operations,
        achievement_percentage: row.achievement_percentage,
        productivity_score: row.productivity_score,
        manual_score: row.manual_score,
        final_score: row.final_score,
        calculation_source: row.calculation_source,
        performance_label: row.performance_label,
        notes: row.notes,
      })) },
      { name: "تفاصيل المعايير", rows: kpiRows },
    ], "kpi-ranking-report.xlsx");
  },
};
