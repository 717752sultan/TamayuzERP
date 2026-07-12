export const inventoryPermissionPages = [
  "inventory_dashboard",
  "inventory_items",
  "inventory_suppliers",
  "inventory_purchase_requests",
  "inventory_purchase_orders",
  "inventory_receipts",
  "inventory_invoices",
  "inventory_issue_vouchers",
  "inventory_returns",
  "inventory_transfers",
  "inventory_adjustments",
  "inventory_stocktakes",
  "inventory_balances",
  "inventory_forecast",
  "inventory_reports",
  "inventory_settings",
];

export const inventoryRole = "مسؤول المخزون";

export const canInventory = (can, page, action = "can_view") =>
  typeof can === "function" ? can(page, action) !== false : true;
