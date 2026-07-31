import { dailyOperationsService, isApprovedDailyOperation, isApprovedStatus, operationStatuses, operationTypes, serviceChannels } from "./dailyOperations";
import { supabase } from "./supabase";

const n = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

const normalizeEmployeeIdValue = (value = "") => String(value || "").trim();

const loadEmployeeIdAliasMaps = async (companyId) => {
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
    console.error("Daily operations employee_id_aliases load error:", error);
    return { aliasToCanonical: new Map(), canonicalToAliases: new Map() };
  }
};

const applyEmployeeIdAliases = (rows = [], aliasToCanonical = new Map()) => (rows || []).map((row) => {
  const originalEmployeeId = normalizeEmployeeIdValue(row.employee_id);
  const canonicalEmployeeId = aliasToCanonical.get(originalEmployeeId) || originalEmployeeId;
  return {
    ...row,
    original_employee_id: originalEmployeeId,
    employee_id: canonicalEmployeeId,
    effective_employee_id: canonicalEmployeeId,
    alias_employee_id: canonicalEmployeeId !== originalEmployeeId ? originalEmployeeId : "",
  };
});

export const dailyOperationReportGroups = [
  ["all", "الكل"],
  ["branch", "الفرع"],
  ["employee", "الموظف"],
  ["canonical_employee", "حسب الرقم الرسمي"],
  ["original_employee", "حسب الرقم الأصلي"],
  ["department", "الإدارة / القسم"],
  ["operation_type", "نوع العملية"],
  ["operation_date", "اليوم"],
];

export const dailyOperationsReportOptions = {
  statuses: ["الكل", ...operationStatuses],
  operationTypes: ["الكل", ...operationTypes],
  channels: ["الكل", ...serviceChannels],
  groups: dailyOperationReportGroups,
};

export const classifyOperationType = (type = "") => {
  const text = String(type || "").trim();
  if (/قبض|وارد/.test(text)) return "receive";
  if (/صرف|صادر/.test(text)) return "pay";
  if (/بيع/.test(text)) return "sell";
  if (/شراء/.test(text)) return "buy";
  if (/واتس|واتساب/.test(text)) return "whatsapp";
  if (/صرافة/.test(text)) return "exchange";
  return "other";
};

export const summarizeDailyOperations = (rows = []) => {
  const totals = rows.reduce((acc, row) => {
    const count = n(row.operation_count);
    const kind = classifyOperationType(row.operation_type);
    if (kind === "receive") acc.receive += count;
    if (kind === "pay") acc.pay += count;
    if (kind === "sell") acc.sell += count;
    if (kind === "buy") acc.buy += count;
    acc.total += count;
    if (isApprovedStatus(row.status)) acc.approved += count;
    if (String(row.status || "").includes("قيد المراجعة")) acc.pendingReview += count;
    if (isApprovedDailyOperation(row)) acc.kpi += count;
    else acc.notKpi += count;
    return acc;
  }, { receive: 0, pay: 0, sell: 0, buy: 0, total: 0, approved: 0, pendingReview: 0, kpi: 0, notKpi: 0 });
  const employees = new Map();
  const branches = new Map();
  rows.forEach((row) => {
    employees.set(row.employee_id || row.employee_name || "غير محدد", (employees.get(row.employee_id || row.employee_name || "غير محدد") || 0) + n(row.operation_count));
    branches.set(row.branch || "غير محدد", (branches.get(row.branch || "غير محدد") || 0) + n(row.operation_count));
  });
  const topEmployee = [...employees.entries()].sort((a, b) => b[1] - a[1])[0];
  const topBranch = [...branches.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    ...totals,
    rowsCount: rows.length,
    averagePerEmployee: employees.size ? Number((totals.total / employees.size).toFixed(2)) : 0,
    topEmployee: topEmployee ? `${topEmployee[0]} (${topEmployee[1]})` : "—",
    topBranch: topBranch ? `${topBranch[0]} (${topBranch[1]})` : "—",
  };
};

export const groupDailyOperations = (rows = [], groupBy = "all") => {
  const keyOf = (row) => {
    if (groupBy === "all") return "الكل";
    if (groupBy === "employee") return `${row.employee_name || "غير محدد"} - ${row.employee_id || "غير محدد"}`;
    if (groupBy === "canonical_employee") return row.employee_id || "غير محدد";
    if (groupBy === "original_employee") return row.original_employee_id || row.employee_id || "غير محدد";
    return row[groupBy] || "غير محدد";
  };
  const grouped = new Map();
  rows.forEach((row) => {
    const key = keyOf(row);
    const current = grouped.get(key) || { group: key, records: 0, receive: 0, pay: 0, sell: 0, buy: 0, total: 0 };
    const count = n(row.operation_count);
    const kind = classifyOperationType(row.operation_type);
    current.records += 1;
    current.total += count;
    if (kind === "receive") current.receive += count;
    if (kind === "pay") current.pay += count;
    if (kind === "sell") current.sell += count;
    if (kind === "buy") current.buy += count;
    grouped.set(key, current);
  });
  return [...grouped.values()].sort((a, b) => b.total - a.total);
};

export const dailyOperationsReportsService = {
  async loadReport(companyId, filters = {}) {
    const rawRows = await dailyOperationsService.loadDailyOperations({
      companyId,
      fromDate: filters.fromDate || "",
      toDate: filters.toDate || "",
      branch: filters.branch || "all",
      department: filters.department || "all",
      employeeId: filters.employeeId || "",
      operationType: filters.operationType || "all",
      channel: filters.channel || "all",
      status: filters.status || "all",
      approvedOnly: filters.approvedOnly === true,
      includedInKpiOnly: filters.includedInKpiOnly === true,
      limit: 10000,
    });
    const aliasMaps = await loadEmployeeIdAliasMaps(companyId);
    const rows = applyEmployeeIdAliases(rawRows, aliasMaps.aliasToCanonical);
    const summary = summarizeDailyOperations(rows);
    const grouped = groupDailyOperations(rows, filters.groupBy || "all");
    const linkedEmployeeIds = [...aliasMaps.canonicalToAliases.entries()].map(([canonical_employee_id, aliases]) => ({
      canonical_employee_id,
      linked_employee_ids: [...aliases].join("، "),
    }));
    return { rows, summary, grouped, linkedEmployeeIds };
  },

  async compareProductivityPeriods(companyId, range = {}) {
    const id = String(companyId || "").trim();
    if (!id) throw new Error("لم يتم تحديد الشركة الحالية");
    const scope = ["branch", "employee", "job", "operation_type"].includes(range.scope) ? range.scope : "employee";
    const loadPeriod = (fromDate, toDate) => this.loadReport(id, { fromDate, toDate, status: "معتمد", approvedOnly: true, includedInKpiOnly: true });
    const [periodA, periodB] = await Promise.all([loadPeriod(range.aFrom, range.aTo), loadPeriod(range.bFrom, range.bTo)]);
    const keyOf = (row) => {
      if (scope === "branch") return row.branch || "غير محدد";
      if (scope === "job") return row.job || row.job_name || "غير محدد";
      if (scope === "operation_type") return row.operation_type || "غير محدد";
      return (row.employee_name || row.employee_id || "غير محدد") + " - " + (row.employee_id || "غير محدد");
    };
    const sumByScope = (rows) => (rows || []).reduce((map, row) => { const key = keyOf(row); map.set(key, (map.get(key) || 0) + n(row.operation_count)); return map; }, new Map());
    const a = sumByScope(periodA.rows);
    const b = sumByScope(periodB.rows);
    const keys = [...new Set([...a.keys(), ...b.keys()])];
    const rows = keys.map((name) => {
      const period_a = a.get(name) || 0;
      const period_b = b.get(name) || 0;
      const change = period_a === 0 ? (period_b > 0 ? null : 0) : Number((((period_b - period_a) / period_a) * 100).toFixed(2));
      return { name, period_a, period_b, change, change_label: period_a === 0 && period_b > 0 ? "جديد" : String(change) + "%" };
    }).sort((x, y) => y.period_b - x.period_b || y.period_a - x.period_a);
    return { rows, branches: [...new Set([...periodA.rows, ...periodB.rows].map((row) => row.branch).filter(Boolean))], periodA: periodA.rows, periodB: periodB.rows };
  },
};
