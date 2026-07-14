-- HRMS Inventory currency, totals, and stock valuation support
-- Safe to run more than once.

create table if not exists public.inventory_currency_settings (
  setting_id text primary key,
  currency_code text not null unique,
  currency_name text not null,
  exchange_rate numeric(18, 6) not null default 1,
  base_currency_code text not null default 'YER',
  is_base_currency boolean not null default false,
  is_active boolean not null default true,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.inventory_currency_settings
  (setting_id, currency_code, currency_name, exchange_rate, base_currency_code, is_base_currency, is_active)
values
  ('CUR-YER', 'YER', 'ريال يمني', 1, 'YER', true, true),
  ('CUR-SAR', 'SAR', 'ريال سعودي', 580, 'YER', false, true),
  ('CUR-USD', 'USD', 'دولار أمريكي', 530, 'YER', false, true)
on conflict (currency_code) do update set
  currency_name = excluded.currency_name,
  exchange_rate = excluded.exchange_rate,
  base_currency_code = excluded.base_currency_code,
  is_active = excluded.is_active,
  updated_at = now();

alter table if exists public.inventory_items
  add column if not exists default_currency_code text not null default 'YER',
  add column if not exists default_currency_name text not null default 'ريال يمني',
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_movements
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_purchase_requests
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_purchase_orders
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_receipts
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_invoices
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_branch_issues
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_branch_returns
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_transfers
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_adjustments
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_stocktakes
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_document_details
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_issue_details
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

alter table if exists public.inventory_transfer_details
  add column if not exists currency_code text not null default 'YER',
  add column if not exists currency_name text not null default 'ريال يمني',
  add column if not exists exchange_rate numeric(18, 6) not null default 1,
  add column if not exists base_currency_code text not null default 'YER',
  add column if not exists total_value numeric(18, 2) not null default 0,
  add column if not exists total_value_base numeric(18, 2) not null default 0;

update public.inventory_items
set
  currency_code = coalesce(nullif(currency_code, ''), default_currency_code, 'YER'),
  currency_name = coalesce(nullif(currency_name, ''), default_currency_name, 'ريال يمني'),
  exchange_rate = coalesce(nullif(exchange_rate, 0), 1),
  base_currency_code = coalesce(nullif(base_currency_code, ''), 'YER'),
  total_value = coalesce(nullif(total_value, 0), coalesce(current_balance, opening_balance, 0) * coalesce(default_unit_cost, 0)),
  total_value_base = coalesce(nullif(total_value_base, 0), coalesce(current_balance, opening_balance, 0) * coalesce(default_unit_cost, 0) * coalesce(nullif(exchange_rate, 0), 1))
where true;

-- Refresh PostgREST/Supabase schema cache.
notify pgrst, 'reload schema';
