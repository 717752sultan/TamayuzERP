import { supabase } from "./supabase";
import { dailyOperationsService, isApprovedDailyOperation } from "./dailyOperations";
import { exportWorkbook } from "./reportExport";

const n = (value) => Number(value || 0) || 0;

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

export const buildEmployeeOperationsSummary = (operationsRows = []) => {
  const map = new Map();
  (operationsRows || []).filter(isApprovedDailyOperation).forEach((row) => {
    const employeeId = row.employee_id || "";
    const item = map.get(employeeId) || { employee_id: employeeId, total_operations: 0, receipt_operations: 0, payment_operations: 0, sale_operations: 0, purchase_operations: 0, other_operations: 0, daily: new Map(), byType: new Map() };
    const count = n(row.operation_count);
    const kind = classifyOperationType(row.operation_type);
    item.total_operations += count;
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
    const ops = opsByEmployee.get(employeeId) || { total_operations: 0, receipt_operations: 0, payment_operations: 0, sale_operations: 0, purchase_operations: 0, daily: new Map(), byType: new Map() };
    const finalScore = scoreInfo ? Number(scoreInfo.total.toFixed(2)) : null;
    const performance = classifyEmployeePerformance(finalScore);
    const strengths = [];
    if (ops.receipt_operations) strengths.push("قبض");
    if (ops.payment_operations) strengths.push("صرف");
    if (ops.sale_operations) strengths.push("بيع");
    if (ops.purchase_operations) strengths.push("شراء");
    return {
      employee_id: employeeId,
      employee_name: employee.name || scoreInfo?.criteria?.[0]?.employee_name || employeeId,
      job_name: employee.job || employee.job_name || scoreInfo?.criteria?.[0]?.job_name || "",
      branch: employee.branch || scoreInfo?.criteria?.[0]?.branch || "",
      department: employee.department || "",
      final_score: finalScore,
      performance_label: performance.label,
      performance_tone: performance.tone,
      strengths: strengths.length ? strengths.join("، ") : finalScore !== null ? "ثبات الأداء" : "غير محدد",
      notes: finalScore === null ? "لم يتم احتساب درجة KPI" : ops.total_operations ? "عمليات معتمدة داخلة في KPI" : "لا توجد عمليات معتمدة ضمن الفترة",
      criteria: scoreInfo?.criteria || [],
      operations: ops,
    };
  }).filter((row) =>
    (!filters.branch || filters.branch === "all" || row.branch === filters.branch)
    && (!filters.job || filters.job === "all" || row.job_name === filters.job)
    && (!filters.employeeId || row.employee_id === filters.employeeId)
    && (!filters.department || filters.department === "all" || row.department === filters.department));
  return rows
    .sort((a, b) => (b.final_score ?? -1) - (a.final_score ?? -1) || n(b.operations?.total_operations) - n(a.operations?.total_operations))
    .map((row, index) => ({ ...row, rank: index + 1 }));
};

export const kpiScoresService = {
  async loadKpiScores(companyId, filters = {}, employees = []) {
    const month = filters.month || "";
    const params = ["select=*", `company_id=eq.${encodeURIComponent(companyId || "")}`];
    if (month) params.push(`month=eq.${encodeURIComponent(month)}`);
    const kpiRowsRaw = await supabase.select("performance_kpi_scores", `${params.join("&")}&order=employee_name.asc`);
    const kpiRows = (kpiRowsRaw || []).map(normalizeScore);
    const operationsRows = await dailyOperationsService.loadDailyOperations({
      companyId,
      month: filters.fromDate || filters.toDate ? "" : month,
      fromDate: filters.fromDate || "",
      toDate: filters.toDate || "",
      branch: filters.branch || "all",
      department: filters.department || "all",
      employeeId: filters.employeeId || "",
      operationType: filters.operationType || "all",
      approvedOnly: true,
      includedInKpiOnly: true,
      limit: 10000,
    });
    const scopedEmployees = filterEmployees(employees, companyId, filters);
    const ranking = buildKpiEmployeeRanking(scopedEmployees, kpiRows, operationsRows, filters);
    return { kpiRows, operationsRows, ranking, employees: scopedEmployees };
  },

  async loadEmployeeKpiDetails(companyId, employeeId, filters = {}, employees = []) {
    const data = await this.loadKpiScores(companyId, { ...filters, employeeId }, employees);
    const employee = data.ranking.find((row) => String(row.employee_id) === String(employeeId)) || null;
    const peers = data.ranking.filter((row) => row.employee_id !== employeeId && (!employee?.job_name || row.job_name === employee.job_name || row.branch === employee.branch));
    const peerAverage = peers.length ? peers.reduce((sum, row) => sum + n(row.final_score), 0) / peers.filter((row) => row.final_score !== null).length : 0;
    return { ...employee, peer_average: Number((peerAverage || 0).toFixed(2)), comparison_to_average: employee?.final_score === null ? null : Number((n(employee?.final_score) - (peerAverage || 0)).toFixed(2)) };
  },

  loadEmployeeOperationsSummary(companyId, filters = {}) {
    return dailyOperationsService.loadDailyOperations({ companyId, ...filters, approvedOnly: true, includedInKpiOnly: true, limit: 10000 });
  },

  exportEmployeeKpiReportExcel(report) {
    const operationRows = [...(report?.operations?.byType || new Map()).entries()].map(([operation_type, operation_count]) => ({ operation_type, operation_count }));
    const dailyRows = [...(report?.operations?.daily || new Map()).values()];
    exportWorkbook([
      { name: "ملخص الموظف", rows: [report || {}] },
      { name: "معايير التقييم", rows: report?.criteria || [] },
      { name: "عمليات الموظف", rows: operationRows },
      { name: "الأداء اليومي", rows: dailyRows },
    ], `kpi-employee-report-${report?.employee_id || "employee"}.xlsx`);
  },

  exportKpiRankingExcel(ranking = [], kpiRows = []) {
    exportWorkbook([
      { name: "ترتيب الموظفين", rows: ranking.map((row) => ({ ...row, operations: undefined, criteria: undefined })) },
      { name: "تفاصيل المعايير", rows: kpiRows },
    ], "kpi-ranking-report.xlsx");
  },
};
