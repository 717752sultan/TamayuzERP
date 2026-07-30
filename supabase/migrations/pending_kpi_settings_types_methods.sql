create table if not exists public.kpi_criterion_types (
  type_id text primary key,
  company_id text not null,
  type_key text not null,
  type_name text not null,
  description text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.kpi_evaluation_methods (
  method_id text primary key,
  company_id text not null,
  method_key text not null,
  method_name text not null,
  source_type text not null check (
    source_type in ('manual', 'daily_operations', 'attendance', 'inventory', 'evaluation', 'mixed')
  ),
  description text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_kpi_criterion_types_company_id
  on public.kpi_criterion_types(company_id);
create index if not exists idx_kpi_criterion_types_company_key
  on public.kpi_criterion_types(company_id, type_key);
create index if not exists idx_kpi_criterion_types_company_active
  on public.kpi_criterion_types(company_id, is_active);

create index if not exists idx_kpi_evaluation_methods_company_id
  on public.kpi_evaluation_methods(company_id);
create index if not exists idx_kpi_evaluation_methods_company_key
  on public.kpi_evaluation_methods(company_id, method_key);
create index if not exists idx_kpi_evaluation_methods_company_source
  on public.kpi_evaluation_methods(company_id, source_type);
create index if not exists idx_kpi_evaluation_methods_company_active
  on public.kpi_evaluation_methods(company_id, is_active);

