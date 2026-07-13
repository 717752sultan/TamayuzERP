alter table if exists public.app_users add column if not exists name text;
alter table if exists public.app_users add column if not exists password text;
alter table if exists public.app_users add column if not exists email text;
alter table if exists public.app_users add column if not exists branch text;
alter table if exists public.app_users add column if not exists job text;
alter table if exists public.app_users add column if not exists phone text;
alter table if exists public.app_users add column if not exists updated_at timestamptz default now();

alter table if exists public.app_permissions add column if not exists can_post boolean not null default false;
alter table if exists public.app_permissions add column if not exists can_print boolean not null default false;

create index if not exists idx_app_users_employee_id on public.app_users(employee_id);
create index if not exists idx_app_users_role on public.app_users(role);
create index if not exists idx_app_users_branch on public.app_users(branch);

insert into public.app_permissions
  (id, page_key, role, can_view, can_create, can_edit, can_delete, can_export, can_approve, can_post, can_print)
values
  ('مسؤول المخزون-inventory_dashboard', 'inventory_dashboard', 'مسؤول المخزون', true, false, false, false, false, false, false, false),
  ('مسؤول المخزون-inventory_items', 'inventory_items', 'مسؤول المخزون', true, true, true, true, true, false, false, true),
  ('مسؤول المخزون-inventory_suppliers', 'inventory_suppliers', 'مسؤول المخزون', true, true, true, true, true, false, false, true),
  ('مسؤول المخزون-inventory_purchase_requests', 'inventory_purchase_requests', 'مسؤول المخزون', true, true, true, true, true, true, false, true),
  ('مسؤول المخزون-inventory_purchase_orders', 'inventory_purchase_orders', 'مسؤول المخزون', true, true, true, false, true, true, false, true),
  ('مسؤول المخزون-inventory_receipts', 'inventory_receipts', 'مسؤول المخزون', true, true, true, false, true, false, true, true),
  ('مسؤول المخزون-inventory_issue_vouchers', 'inventory_issue_vouchers', 'مسؤول المخزون', true, true, true, false, true, true, true, true),
  ('مسؤول المخزون-inventory_returns', 'inventory_returns', 'مسؤول المخزون', true, true, true, false, true, false, true, true),
  ('مسؤول المخزون-inventory_transfers', 'inventory_transfers', 'مسؤول المخزون', true, true, true, false, true, true, true, true),
  ('مسؤول المخزون-inventory_adjustments', 'inventory_adjustments', 'مسؤول المخزون', true, true, true, false, true, true, false, true),
  ('مسؤول المخزون-inventory_stocktakes', 'inventory_stocktakes', 'مسؤول المخزون', true, true, true, false, true, true, true, true),
  ('مسؤول المخزون-inventory_balances', 'inventory_balances', 'مسؤول المخزون', true, false, false, false, true, false, false, true),
  ('مسؤول المخزون-inventory_forecast', 'inventory_forecast', 'مسؤول المخزون', true, false, false, false, true, false, false, true),
  ('مسؤول المخزون-inventory_reports', 'inventory_reports', 'مسؤول المخزون', true, false, false, false, true, false, false, true)
on conflict (id) do update set
  can_view = excluded.can_view,
  can_create = excluded.can_create,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete,
  can_export = excluded.can_export,
  can_approve = excluded.can_approve,
  can_post = excluded.can_post,
  can_print = excluded.can_print,
  updated_at = now();

notify pgrst, 'reload schema';
