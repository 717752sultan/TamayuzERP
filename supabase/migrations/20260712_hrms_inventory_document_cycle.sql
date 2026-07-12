create table if not exists public.inventory_items (
  item_id text primary key,
  item_code text not null,
  item_name text not null,
  category text,
  unit_type text,
  default_unit_cost numeric default 0,
  minimum_stock numeric default 0,
  reorder_point numeric default 0,
  opening_balance numeric default 0,
  current_balance numeric default 0,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table if exists public.app_permissions add column if not exists can_cancel boolean not null default false;
alter table if exists public.app_permissions add column if not exists can_post boolean not null default false;
alter table if exists public.app_permissions add column if not exists can_print boolean not null default false;
alter table if exists public.app_permissions add column if not exists can_override_stock boolean not null default false;

create table if not exists public.inventory_suppliers (
  supplier_id text primary key,
  supplier_name text not null,
  phone text,
  address text,
  tax_number text,
  commercial_register text,
  contact_person text,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_purchase_requests (
  request_id text primary key,
  request_number text,
  request_date date,
  requested_by text,
  requested_by_name text,
  requesting_branch text,
  branch text,
  request_reason text,
  priority text default 'عادي',
  status text default 'مسودة',
  approval_status text default 'مسودة',
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  notes text,
  total_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_purchase_request_details (
  request_detail_id text primary key,
  request_id text,
  item_id text,
  item_code text,
  item_name text,
  category text,
  unit_type text,
  requested_quantity numeric default 0,
  approved_quantity numeric default 0,
  notes text
);

create table if not exists public.inventory_purchase_orders (
  po_id text primary key,
  po_number text,
  po_date date,
  supplier_id text,
  supplier_name text,
  source_request_id text,
  expected_delivery_date date,
  status text default 'مسودة',
  approval_status text default 'مسودة',
  approved_by text,
  approved_at timestamptz,
  total_amount numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_purchase_order_details (
  po_detail_id text primary key,
  po_id text,
  item_id text,
  item_code text,
  item_name text,
  unit_type text,
  ordered_quantity numeric default 0,
  received_quantity numeric default 0,
  remaining_quantity numeric default 0,
  unit_price numeric default 0,
  total_amount numeric default 0,
  notes text
);

create table if not exists public.inventory_receipts (
  receipt_id text primary key,
  receipt_number text,
  receipt_date date,
  po_id text,
  supplier_id text,
  supplier_name text,
  received_by text,
  warehouse_name text,
  status text default 'مسودة',
  approval_status text default 'مسودة',
  notes text,
  total_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_receipt_details (
  receipt_detail_id text primary key,
  receipt_id text,
  item_id text,
  item_code text,
  item_name text,
  unit_type text,
  ordered_quantity numeric default 0,
  received_quantity numeric default 0,
  accepted_quantity numeric default 0,
  rejected_quantity numeric default 0,
  unit_price numeric default 0,
  total_value numeric default 0,
  notes text
);

create table if not exists public.inventory_purchase_invoices (
  invoice_id text primary key,
  invoice_number text,
  invoice_date date,
  supplier_id text,
  supplier_name text,
  po_id text,
  receipt_id text,
  invoice_total numeric default 0,
  tax_amount numeric default 0,
  discount_amount numeric default 0,
  net_amount numeric default 0,
  total_amount numeric default 0,
  status text default 'مسودة',
  approval_status text default 'مسودة',
  matched_by text,
  approved_by text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_issue_vouchers (
  issue_id text primary key,
  issue_number text,
  issue_date date,
  branch text,
  requested_by text,
  issued_by text,
  received_by text,
  status text default 'مسودة',
  approval_status text default 'مسودة',
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  notes text,
  total_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_issue_details (
  issue_detail_id text primary key,
  issue_id text,
  item_id text,
  item_code text,
  item_name text,
  category text,
  unit_type text,
  quantity_requested numeric default 0,
  quantity_approved numeric default 0,
  quantity_issued numeric default 0,
  unit_cost numeric default 0,
  total_value numeric default 0,
  notes text
);

create table if not exists public.inventory_return_vouchers (
  return_id text primary key,
  return_number text,
  return_date date,
  branch text,
  returned_by text,
  received_by text,
  reason text,
  status text default 'مسودة',
  approval_status text default 'مسودة',
  notes text,
  total_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_return_details (
  return_detail_id text primary key,
  return_id text,
  item_id text,
  item_code text,
  item_name text,
  unit_type text,
  returned_quantity numeric default 0,
  accepted_quantity numeric default 0,
  rejected_quantity numeric default 0,
  unit_cost numeric default 0,
  total_value numeric default 0,
  notes text
);

create table if not exists public.inventory_transfer_vouchers (
  transfer_id text primary key,
  transfer_number text,
  transfer_date date,
  from_location text,
  to_location text,
  transferred_by text,
  received_by text,
  status text default 'مسودة',
  approval_status text default 'مسودة',
  notes text,
  total_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_transfer_details (
  transfer_detail_id text primary key,
  transfer_id text,
  item_id text,
  item_code text,
  item_name text,
  unit_type text,
  quantity numeric default 0,
  unit_cost numeric default 0,
  total_value numeric default 0,
  notes text
);

create table if not exists public.inventory_adjustments (
  adjustment_id text primary key,
  adjustment_number text,
  adjustment_date date,
  item_id text,
  item_code text,
  item_name text,
  adjustment_type text,
  quantity numeric default 0,
  unit_cost numeric default 0,
  total_value numeric default 0,
  reason text,
  status text default 'مسودة',
  approval_status text default 'مسودة',
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_stocktakes (
  stocktake_id text primary key,
  stocktake_number text,
  stocktake_date date,
  location text,
  branch text,
  counted_by text,
  approved_by text,
  status text default 'مسودة',
  approval_status text default 'مسودة',
  notes text,
  total_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_stocktake_details (
  stocktake_detail_id text primary key,
  stocktake_id text,
  item_id text,
  item_code text,
  item_name text,
  unit_type text,
  system_quantity numeric default 0,
  counted_quantity numeric default 0,
  difference_quantity numeric default 0,
  unit_cost numeric default 0,
  difference_value numeric default 0,
  notes text
);

create table if not exists public.inventory_movements (
  movement_id text primary key,
  movement_date date,
  item_id text,
  item_code text,
  item_name text,
  location text,
  branch text,
  movement_type text,
  source_module text,
  source_id text,
  source_number text,
  quantity_in numeric default 0,
  quantity_out numeric default 0,
  unit_cost numeric default 0,
  total_value numeric default 0,
  balance_after numeric default 0,
  notes text,
  created_by text,
  created_at timestamptz default now()
);

create unique index if not exists idx_inventory_items_item_code_unique on public.inventory_items(item_code);
create index if not exists idx_inventory_items_name on public.inventory_items(item_name);
create index if not exists idx_inventory_items_category on public.inventory_items(category);
create index if not exists idx_inventory_suppliers_name on public.inventory_suppliers(supplier_name);
create index if not exists idx_inventory_movements_item on public.inventory_movements(item_id);
create index if not exists idx_inventory_movements_date on public.inventory_movements(movement_date);
create index if not exists idx_inventory_movements_source on public.inventory_movements(source_module, source_id);
create index if not exists idx_inventory_movements_branch on public.inventory_movements(branch);
create index if not exists idx_inventory_pr_status on public.inventory_purchase_requests(status, approval_status);
create index if not exists idx_inventory_po_status on public.inventory_purchase_orders(status, approval_status);
create index if not exists idx_inventory_receipts_status on public.inventory_receipts(status);
create index if not exists idx_inventory_issues_status on public.inventory_issue_vouchers(status, approval_status);
create index if not exists idx_inventory_returns_status on public.inventory_return_vouchers(status);
create index if not exists idx_inventory_transfers_status on public.inventory_transfer_vouchers(status);
create index if not exists idx_inventory_adjustments_status on public.inventory_adjustments(status, approval_status);
create index if not exists idx_inventory_stocktakes_status on public.inventory_stocktakes(status, approval_status);

insert into public.app_permissions (id, page_key, role, can_view, can_create, can_edit, can_delete, can_export, can_approve)
select 'inventory-admin-' || page_key, page_key, 'مدير النظام', true, true, true, true, true, true
from (values
('inventory'),
('inventory_dashboard'),('inventory_items'),('inventory_suppliers'),('inventory_purchase_requests'),('inventory_purchase_orders'),
('inventory_receipts'),('inventory_invoices'),('inventory_issue_vouchers'),('inventory_returns'),('inventory_transfers'),
('inventory_adjustments'),('inventory_stocktakes'),('inventory_balances'),('inventory_forecast'),('inventory_reports'),('inventory_settings')
) as p(page_key)
on conflict (id) do nothing;

insert into public.app_permissions (id, page_key, role, can_view, can_create, can_edit, can_delete, can_export, can_approve)
select 'inventory-officer-' || page_key, page_key, 'مسؤول المخزون', true, true, true, false, true, false
from (values
('inventory'),
('inventory_dashboard'),('inventory_items'),('inventory_suppliers'),('inventory_purchase_requests'),('inventory_purchase_orders'),
('inventory_receipts'),('inventory_invoices'),('inventory_issue_vouchers'),('inventory_returns'),('inventory_transfers'),
('inventory_adjustments'),('inventory_stocktakes'),('inventory_balances'),('inventory_forecast'),('inventory_reports'),('inventory_settings')
) as p(page_key)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
