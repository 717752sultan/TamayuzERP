export const inventoryReportColumns = [
  { key: "document_date", label: "التاريخ" },
  { key: "document_number", label: "رقم المستند" },
  { key: "item_code", label: "كود الصنف" },
  { key: "item_name", label: "الصنف" },
  { key: "category", label: "التصنيف" },
  { key: "branch", label: "الفرع" },
  { key: "supplier_name", label: "المورد" },
  { key: "status", label: "الحالة" },
  { key: "total_amount", label: "القيمة" },
];

export const generateInventoryReports = ({ items = [], suppliers = [], documents = {}, movements = [] }) => ({
  items,
  suppliers,
  purchase_requests: documents.purchase_requests || [],
  purchase_orders: documents.purchase_orders || [],
  receipts: documents.receipts || [],
  invoices: documents.invoices || [],
  issues: documents.issues || [],
  returns: documents.returns || [],
  transfers: documents.transfers || [],
  adjustments: documents.adjustments || [],
  stocktakes: documents.stocktakes || [],
  balances: items.map((item) => {
    const itemMovements = movements.filter((m) => m.item_id === item.item_id);
    const quantityIn = itemMovements.reduce((s, m) => s + Number(m.quantity_in || 0), 0);
    const quantityOut = itemMovements.reduce((s, m) => s + Number(m.quantity_out || 0), 0);
    const current = Number(item.opening_balance || 0) + quantityIn - quantityOut;
    return { ...item, current_balance: current, estimated_stock_value: current * Number(item.default_unit_cost || 0) };
  }),
  movements,
  low_stock: items.filter((item) => Number(item.current_balance || 0) <= Number(item.reorder_point || 0)),
});

export const inventoryRowsForExport = (rows, columns = inventoryReportColumns) =>
  rows.map((row) =>
    columns.reduce((acc, col) => {
      acc[col.label] = row[col.key] ?? "";
      return acc;
    }, {}),
  );
