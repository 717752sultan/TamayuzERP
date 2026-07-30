import { dailyOperationsService, operationStatuses, operationTypes, serviceChannels } from "./dailyOperations";

const n = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
};

export const dailyOperationReportGroups = [
  ["all", "الكل"],
  ["branch", "الفرع"],
  ["employee", "الموظف"],
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
    return acc;
  }, { receive: 0, pay: 0, sell: 0, buy: 0, total: 0 });
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
    if (groupBy === "employee") return row.employee_name || row.employee_id || "غير محدد";
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
    const rows = await dailyOperationsService.loadDailyOperations({
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
    const summary = summarizeDailyOperations(rows);
    const grouped = groupDailyOperations(rows, filters.groupBy || "all");
    return { rows, summary, grouped };
  },
};
