-- Pending migration: Fixed Assets module for Tamyuz ERP.
-- لا تنفذ هذا الملف تلقائيًا. راجعه ثم نفذه يدويًا عند الاعتماد.
-- ملاحظة RLS:
-- هذا المشروع يستخدم custom login وليس Supabase Auth JWT claims بشكل كامل.
-- لذلك لا يتم تفعيل RLS هنا حتى يتم اعتماد نمط claims آمن يربط الجلسة بـ company_id.

create table if not exists public.fixed_asset_categories (
  category_id text primary key,
  company_id text not null,
  category_name text not null,
  depreciation_method text default 'القسط الثابت',
  default_useful_life_months integer default 60,
  default_residual_value numeric default 0,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists fixed_asset_categories_company_name_idx
  on public.fixed_asset_categories (company_id, category_name);

create index if not exists fixed_asset_categories_company_id_idx
  on public.fixed_asset_categories (company_id);

create unique index if not exists fixed_asset_categories_company_category_id_idx
  on public.fixed_asset_categories (company_id, category_id);

create table if not exists public.fixed_assets (
  asset_id text primary key,
  company_id text not null,
  asset_code text not null,
  asset_name text not null,
  category_id text,
  category_name text,
  branch text,
  department text,
  location text,
  custodian_employee_id text,
  custodian_employee_name text,
  purchase_date date,
  purchase_cost numeric default 0,
  currency_code text default 'YER',
  exchange_rate numeric default 1,
  purchase_cost_base numeric default 0,
  residual_value numeric default 0,
  useful_life_months integer default 60,
  depreciation_method text default 'القسط الثابت',
  accumulated_depreciation numeric default 0,
  book_value numeric default 0,
  status text default 'نشط',
  serial_number text,
  supplier_name text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists fixed_assets_company_asset_code_idx
  on public.fixed_assets (company_id, asset_code);

create unique index if not exists fixed_assets_company_asset_id_idx
  on public.fixed_assets (company_id, asset_id);

create index if not exists fixed_assets_company_id_idx
  on public.fixed_assets (company_id);

create index if not exists fixed_assets_company_status_idx
  on public.fixed_assets (company_id, status);

create index if not exists fixed_assets_company_branch_idx
  on public.fixed_assets (company_id, branch);

create index if not exists fixed_assets_company_category_idx
  on public.fixed_assets (company_id, category_id);

create table if not exists public.fixed_asset_custodies (
  custody_id text primary key,
  company_id text not null,
  asset_id text not null,
  asset_code text,
  asset_name text,
  employee_id text,
  employee_name text,
  branch text,
  custody_date date,
  return_date date,
  status text default 'مسلمة',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists fixed_asset_custodies_company_id_idx
  on public.fixed_asset_custodies (company_id);

create unique index if not exists fixed_asset_custodies_company_custody_id_idx
  on public.fixed_asset_custodies (company_id, custody_id);

create index if not exists fixed_asset_custodies_company_asset_idx
  on public.fixed_asset_custodies (company_id, asset_id);

create index if not exists fixed_asset_custodies_company_status_idx
  on public.fixed_asset_custodies (company_id, status);

create table if not exists public.fixed_asset_transfers (
  transfer_id text primary key,
  company_id text not null,
  asset_id text not null,
  asset_code text,
  asset_name text,
  from_branch text,
  to_branch text,
  from_location text,
  to_location text,
  transfer_date date,
  status text default 'منفذ',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists fixed_asset_transfers_company_id_idx
  on public.fixed_asset_transfers (company_id);

create unique index if not exists fixed_asset_transfers_company_transfer_id_idx
  on public.fixed_asset_transfers (company_id, transfer_id);

create index if not exists fixed_asset_transfers_company_asset_idx
  on public.fixed_asset_transfers (company_id, asset_id);

create index if not exists fixed_asset_transfers_company_status_idx
  on public.fixed_asset_transfers (company_id, status);

create table if not exists public.fixed_asset_maintenance (
  maintenance_id text primary key,
  company_id text not null,
  asset_id text not null,
  asset_code text,
  asset_name text,
  branch text,
  maintenance_type text default 'وقائية',
  provider_name text,
  maintenance_date date,
  cost numeric default 0,
  status text default 'مجدولة',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists fixed_asset_maintenance_company_id_idx
  on public.fixed_asset_maintenance (company_id);

create unique index if not exists fixed_asset_maintenance_company_maintenance_id_idx
  on public.fixed_asset_maintenance (company_id, maintenance_id);

create index if not exists fixed_asset_maintenance_company_asset_idx
  on public.fixed_asset_maintenance (company_id, asset_id);

create index if not exists fixed_asset_maintenance_company_status_idx
  on public.fixed_asset_maintenance (company_id, status);

create index if not exists fixed_asset_maintenance_company_branch_idx
  on public.fixed_asset_maintenance (company_id, branch);

create table if not exists public.fixed_asset_disposals (
  disposal_id text primary key,
  company_id text not null,
  asset_id text not null,
  asset_code text,
  asset_name text,
  disposal_reason text,
  disposal_date date,
  disposal_value numeric default 0,
  status text default 'قيد المراجعة',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists fixed_asset_disposals_company_id_idx
  on public.fixed_asset_disposals (company_id);

create unique index if not exists fixed_asset_disposals_company_disposal_id_idx
  on public.fixed_asset_disposals (company_id, disposal_id);

create index if not exists fixed_asset_disposals_company_asset_idx
  on public.fixed_asset_disposals (company_id, asset_id);

create index if not exists fixed_asset_disposals_company_status_idx
  on public.fixed_asset_disposals (company_id, status);

create table if not exists public.fixed_asset_depreciation_entries (
  entry_id text primary key,
  company_id text not null,
  asset_id text not null,
  asset_code text,
  asset_name text,
  depreciation_month text not null,
  depreciation_amount numeric default 0,
  accumulated_depreciation numeric default 0,
  book_value numeric default 0,
  status text default 'مرحل',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists fixed_asset_depreciation_company_asset_month_idx
  on public.fixed_asset_depreciation_entries (company_id, asset_id, depreciation_month);

create index if not exists fixed_asset_depreciation_company_id_idx
  on public.fixed_asset_depreciation_entries (company_id);

create unique index if not exists fixed_asset_depreciation_company_entry_id_idx
  on public.fixed_asset_depreciation_entries (company_id, entry_id);

create index if not exists fixed_asset_depreciation_company_month_idx
  on public.fixed_asset_depreciation_entries (company_id, depreciation_month);

notify pgrst, 'reload schema';
