import { calculateInventoryLineTotal } from "./inventory";

export const inventoryReportColumns = [
  { key: "document_date", label: "التاريخ" },
  { key: "document_number", label: "رقم المستند" },
  { key: "item_code", label: "كود الصنف" },
  { key: "item_name", label: "الصنف" },
  { key: "category", label: "التصنيف" },
  { key: "branch", label: "الفرع" },
  { key: "supplier_name", label: "المورد" },
  { key: "currency_code", label: "العملة" },
  { key: "total_value", label: "القيمة" },
  { key: "total_value_base", label: "القيمة بالعملة الأساسية" },
  { key: "status", label: "الحالة" },
];

const n = (value) => Number(value || 0);
const lastDate = (rows, key = "movement_date") => rows.map((r) => r[key]).filter(Boolean).sort().at(-1) || "";

export const loadCurrentStockBalanceReport = (items = [], movements = []) => {
  const rows = items.map((item) => {
    const itemMovements = movements.filter((m) => m.item_id === item.item_id);
    const quantityIn = itemMovements.reduce((sum, row) => sum + n(row.quantity_in), 0);
    const quantityOut = itemMovements.reduce((sum, row) => sum + n(row.quantity_out), 0);
    const remaining = itemMovements.length ? n(item.opening_balance) + quantityIn - quantityOut : n(item.current_balance || item.opening_balance);
    const incomingValue = itemMovements.filter((m) => n(m.quantity_in) > 0).reduce((sum, row) => sum + n(row.total_value), 0);
    const outgoingValue = itemMovements.filter((m) => n(m.quantity_out) > 0).reduce((sum, row) => sum + n(row.total_value), 0);
    const unitCost = itemMovements.length ? (incomingValue / Math.max(1, quantityIn)) || n(item.default_unit_cost) : n(item.default_unit_cost);
    const stockValue = remaining * unitCost;
    const exchangeRate = n(item.exchange_rate || itemMovements[0]?.exchange_rate || 1);
    const stockValueBase = stockValue * exchangeRate;
    return {
      ...item,
      currency_code: item.default_currency_code || item.currency_code || itemMovements[0]?.currency_code || "YER",
      currency_name: item.default_currency_name || item.currency_name || itemMovements[0]?.currency_name || "ريال يمني",
      opening_quantity: n(item.opening_balance),
      total_quantity_in: quantityIn,
      total_quantity_out: quantityOut,
      remaining_quantity: remaining,
      average_unit_cost: unitCost,
      incoming_total_value: incomingValue,
      outgoing_total_value: outgoingValue,
      remaining_stock_value: stockValue,
      remaining_stock_value_base: stockValueBase,
      estimated_stock_value: stockValue,
      total_value_base: stockValueBase,
      last_in_date: lastDate(itemMovements.filter((m) => n(m.quantity_in) > 0)),
      last_out_date: lastDate(itemMovements.filter((m) => n(m.quantity_out) > 0)),
      last_movement_date: lastDate(itemMovements),
      stock_status: remaining <= 0 ? "نافد" : remaining <= n(item.reorder_point) ? "يحتاج شراء" : remaining <= n(item.minimum_stock) ? "منخفض" : "متوفر",
    };
  });
  const summary = rows.reduce((acc, row) => ({
    total_quantity_in: acc.total_quantity_in + n(row.total_quantity_in),
    total_quantity_out: acc.total_quantity_out + n(row.total_quantity_out),
    remaining_quantity: acc.remaining_quantity + n(row.remaining_quantity),
    remaining_stock_value: acc.remaining_stock_value + n(row.remaining_stock_value),
    remaining_stock_value_base: acc.remaining_stock_value_base + n(row.remaining_stock_value_base),
  }), { total_quantity_in: 0, total_quantity_out: 0, remaining_quantity: 0, remaining_stock_value: 0, remaining_stock_value_base: 0 });
  return { rows, summary };
};

export const loadBranchIssueReport = (documents = {}, movements = []) => {
  const issueRows = movements.filter((m) => m.source_module === "inventory_issue_vouchers" || String(m.movement_type || "").includes("صرف"));
  const rows = issueRows.map((m) => ({
    issue_number: m.source_number,
    issue_date: m.movement_date,
    branch: m.branch,
    item_code: m.item_code,
    item_name: m.item_name,
    unit_type: m.unit_type || "",
    quantity_issued: n(m.quantity_out),
    currency_code: m.currency_code || "YER",
    unit_price: n(m.unit_cost),
    total_value: n(m.total_value),
    exchange_rate: n(m.exchange_rate || 1),
    total_value_base: n(m.total_value_base || n(m.total_value) * n(m.exchange_rate || 1)),
    issued_by: m.created_by,
    received_by: "",
    status: "مرحل",
  }));
  const byBranch = Object.values(rows.reduce((acc, row) => {
    const key = row.branch || "غير محدد";
    const current = acc[key] || { branch: key, total_quantity_issued: 0, total_issue_value: 0, total_issue_value_base: 0, top_item: "", last_issue_date: "" };
    current.total_quantity_issued += n(row.quantity_issued);
    current.total_issue_value += n(row.total_value);
    current.total_issue_value_base += n(row.total_value_base);
    current.last_issue_date = [current.last_issue_date, row.issue_date].filter(Boolean).sort().at(-1) || "";
    const branchRows = rows.filter((x) => x.branch === key);
    current.top_item = Object.entries(branchRows.reduce((m, x) => ({ ...m, [x.item_name]: (m[x.item_name] || 0) + n(x.quantity_issued) }), {})).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    acc[key] = current;
    return acc;
  }, {}));
  return { rows, byBranch };
};

export const loadInventoryMovementReport = (movements = []) => movements.map((m) => ({
  movement_date: m.movement_date,
  movement_type: m.movement_type,
  document_number: m.source_number,
  item_name: m.item_name,
  branch: m.branch || m.location,
  currency_code: m.currency_code || "YER",
  quantity_in: n(m.quantity_in),
  quantity_out: n(m.quantity_out),
  balance_after: n(m.balance_after),
  unit_price: n(m.unit_cost),
  total_value: n(m.total_value),
  exchange_rate: n(m.exchange_rate || 1),
  total_value_base: n(m.total_value_base || n(m.total_value) * n(m.exchange_rate || 1)),
  created_by: m.created_by,
  notes: m.notes,
}));

export const calculateInventoryDashboardTotals = ({ items = [], movements = [] }) => {
  const balanceReport = loadCurrentStockBalanceReport(items, movements);
  const totalQuantityIn = movements.reduce((sum, m) => sum + n(m.quantity_in), 0);
  const totalQuantityOut = movements.reduce((sum, m) => sum + n(m.quantity_out), 0);
  const remainingQuantity = movements.length ? totalQuantityIn - totalQuantityOut : items.reduce((sum, item) => sum + n(item.current_balance), 0);
  const purchaseValue = movements.filter((m) => n(m.quantity_in) > 0).reduce((sum, m) => sum + n(m.total_value), 0);
  const issueValue = movements.filter((m) => n(m.quantity_out) > 0).reduce((sum, m) => sum + n(m.total_value), 0);
  const baseValue = movements.reduce((sum, m) => sum + n(m.total_value_base), 0);
  return {
    total_items: items.length,
    total_quantity_in: totalQuantityIn,
    total_quantity_out: totalQuantityOut,
    remaining_quantity: remainingQuantity,
    total_purchase_value: purchaseValue,
    total_issue_value: issueValue,
    total_stock_value: balanceReport.summary.remaining_stock_value,
    total_stock_value_base: balanceReport.summary.remaining_stock_value_base || baseValue,
    low_stock_count: balanceReport.rows.filter((x) => x.stock_status === "منخفض" || String(x.stock_status).includes("منخفض")).length,
    out_of_stock_count: balanceReport.rows.filter((x) => x.stock_status === "نافد" || String(x.stock_status).includes("نفد")).length,
  };
};

export const generateInventoryReports = ({ items = [], suppliers = [], documents = {}, movements = [] }) => {
  const balance = loadCurrentStockBalanceReport(items, movements);
  const branchIssues = loadBranchIssueReport(documents, movements);
  const movementReport = loadInventoryMovementReport(movements);
  return {
    items,
    suppliers,
    purchase_requests: documents.purchase_requests || [],
    purchase_orders: documents.purchase_orders || [],
    receipts: documents.receipts || [],
    invoices: documents.invoices || [],
    issues: branchIssues.rows.length ? branchIssues.rows : documents.issues || [],
    issue_summary_by_branch: branchIssues.byBranch,
    returns: documents.returns || [],
    transfers: documents.transfers || [],
    adjustments: documents.adjustments || [],
    stocktakes: documents.stocktakes || [],
    balances: balance.rows,
    balance_summary: balance.summary,
    movements: movementReport,
    low_stock: balance.rows.filter((item) => item.stock_status === "منخفض" || item.stock_status === "يحتاج شراء"),
  };
};

export const inventoryRowsForExport = (rows, columns = inventoryReportColumns) =>
  rows.map((row) =>
    columns.reduce((acc, col) => {
      acc[col.label] = row[col.key] ?? 0;
      return acc;
    }, {}),
  );

