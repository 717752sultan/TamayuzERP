-- HRMS multi-tenant SaaS foundation + full HR UI support.
-- Safe migration: does not delete existing data.

create table if not exists public.companies (
  company_id text primary key,
  company_code text unique not null,
  company_name text not null,
  legal_name text,
  logo_url text,
  primary_color text,
  secondary_color text,
  address text,
  phone text,
  email text,
  website text,
  tax_number text,
  commercial_register text,
  subscription_plan text,
  subscription_status text default 'active',
  max_users integer,
  max_branches integer,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.companies (
  company_id,
  company_code,
  company_name,
  legal_name,
  primary_color,
  secondary_color,
  subscription_plan,
  subscription_status,
  max_users,
  max_branches,
  is_active
) values (
  'COMP-PUREMONEY',
  'PUREMONEY',
  'Pure Money',
  'Pure Money',
  '#7f1d1d',
  '#374151',
  'enterprise',
  'active',
  999,
  999,
  true
)
on conflict (company_code) do update set
  company_name = excluded.company_name,
  subscription_status = excluded.subscription_status,
  is_active = excluded.is_active,
  updated_at = now();

alter table if exists public.app_users
  add column if not exists company_id text,
  add column if not exists company_code text,
  add column if not exists is_platform_admin boolean default false,
  add column if not exists branch text,
  add column if not exists job text,
  add column if not exists phone text,
  add column if not exists updated_at timestamptz default now();

do $$
declare
  tbl text;
  pure_company_id text := 'COMP-PUREMONEY';
  tenant_tables text[] := array[
    'employees',
    'employees_evaluations',
    'evaluations',
    'app_users',
    'app_roles',
    'app_permissions',
    'app_permission_nodes',
    'app_role_node_permissions',
    'branches',
    'performance_job_templates',
    'performance_kpi_criteria',
    'performance_kpi_scores',
    'daily_operations',
    'incentives',
    'guarantees',
    'overtime_assignments',
    'shift_types',
    'shift_type_periods',
    'used_shifts',
    'shift_scenarios',
    'shift_scenario_details',
    'employee_shift_assignments',
    'inventory_items',
    'inventory_suppliers',
    'inventory_purchase_requests',
    'inventory_purchase_orders',
    'inventory_receipts',
    'inventory_purchase_invoices',
    'inventory_invoices',
    'inventory_issue_vouchers',
    'inventory_branch_issues',
    'inventory_issue_details',
    'inventory_return_vouchers',
    'inventory_branch_returns',
    'inventory_return_details',
    'inventory_transfer_vouchers',
    'inventory_transfers',
    'inventory_transfer_details',
    'inventory_adjustments',
    'inventory_stocktakes',
    'inventory_stocktake_details',
    'inventory_movements',
    'inventory_settings',
    'inventory_currency_settings',
    'inventory_document_numbering',
    'inventory_branch_settings',
    'inventory_document_details',
    'recruitment_job_postings',
    'recruitment_applications',
    'recruitment_candidate_evaluations',
    'recruitment_offer_templates',
    'recruitment_job_offers',
    'recruitment_contracts',
    'recruitment_manpower_plans',
    'recruitment_tests',
    'recruitment_test_results',
    'recruitment_probation_evaluations',
    'recruitment_welcome_messages',
    'notifications',
    'ai_chat_sessions',
    'ai_chat_messages',
    'audit_logs',
    'system_backups',
    'hrms_settings',
    'hrms_snapshots'
  ];
begin
  foreach tbl in array tenant_tables loop
    if to_regclass('public.' || tbl) is not null then
      execute format('alter table public.%I add column if not exists company_id text', tbl);
      execute format('update public.%I set company_id = %L where company_id is null or company_id = ''''', tbl, pure_company_id);
      execute format('create index if not exists %I on public.%I (company_id)', 'idx_' || tbl || '_company_id', tbl);

      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = tbl and column_name = 'branch'
      ) then
        execute format('create index if not exists %I on public.%I (company_id, branch)', 'idx_' || tbl || '_company_branch', tbl);
      end if;

      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = tbl and column_name = 'employee_id'
      ) then
        execute format('create index if not exists %I on public.%I (company_id, employee_id)', 'idx_' || tbl || '_company_employee', tbl);
      end if;

      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = tbl and column_name = 'created_at'
      ) then
        execute format('create index if not exists %I on public.%I (company_id, created_at)', 'idx_' || tbl || '_company_created', tbl);
      end if;

      if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = tbl and column_name = 'status'
      ) then
        execute format('create index if not exists %I on public.%I (company_id, status)', 'idx_' || tbl || '_company_status', tbl);
      end if;
    end if;
  end loop;
end $$;

update public.app_users
set
  company_id = coalesce(company_id, 'COMP-PUREMONEY'),
  company_code = coalesce(company_code, 'PUREMONEY'),
  updated_at = now()
where company_id is null or company_code is null;

insert into public.app_users (
  user_id,
  company_id,
  company_code,
  username,
  password,
  name,
  employee_name,
  employee_id,
  role,
  branch,
  job,
  is_platform_admin,
  is_active,
  created_at,
  updated_at
) values (
  'USR-PUREMONEY-ADMIN',
  'COMP-PUREMONEY',
  'PUREMONEY',
  'admin',
  '123456',
  'مدير النظام',
  'مدير النظام',
  'ADMIN',
  'مدير النظام',
  'المركز الرئيسي',
  'مدير النظام',
  false,
  true,
  now(),
  now()
)
on conflict (user_id) do update set
  company_id = excluded.company_id,
  company_code = excluded.company_code,
  username = excluded.username,
  password = excluded.password,
  role = excluded.role,
  is_active = true,
  updated_at = now();

insert into public.app_users (
  user_id,
  company_id,
  company_code,
  username,
  password,
  name,
  employee_name,
  employee_id,
  role,
  branch,
  job,
  is_platform_admin,
  is_active,
  created_at,
  updated_at
) values (
  'USR-PLATFORM-SUPER-ADMIN',
  'COMP-PUREMONEY',
  'PUREMONEY',
  'platform',
  '123456',
  'مشرف النظام العام',
  'مشرف النظام العام',
  'PLATFORM',
  'مشرف النظام العام',
  'المنصة',
  'مشرف النظام العام',
  true,
  true,
  now(),
  now()
)
on conflict (user_id) do update set
  company_id = excluded.company_id,
  company_code = excluded.company_code,
  role = excluded.role,
  is_platform_admin = true,
  is_active = true,
  updated_at = now();

insert into public.app_roles (role_id, company_id, role_name, role_description, is_system_role, is_active)
values
  ('ROLE-PUREMONEY-ADMIN', 'COMP-PUREMONEY', 'مدير النظام', 'مدير نظام الشركة', true, true),
  ('ROLE-PUREMONEY-HR', 'COMP-PUREMONEY', 'الموارد البشرية', 'إدارة الموارد البشرية', true, true),
  ('ROLE-PUREMONEY-BRANCH-MANAGER', 'COMP-PUREMONEY', 'مدير فرع', 'إدارة الفرع', true, true),
  ('ROLE-PUREMONEY-EXECUTIVE', 'COMP-PUREMONEY', 'الإدارة العليا', 'عرض التقارير والاعتمادات', true, true),
  ('ROLE-PUREMONEY-INVENTORY', 'COMP-PUREMONEY', 'مسؤول المخزون', 'إدارة المخزون', true, true),
  ('ROLE-PUREMONEY-EMPLOYEE', 'COMP-PUREMONEY', 'الموظف', 'بوابة الموظف', true, true),
  ('ROLE-PLATFORM-SUPER-ADMIN', 'COMP-PUREMONEY', 'مشرف النظام العام', 'إدارة منصة الشركات', true, true)
on conflict (role_id) do update set
  company_id = excluded.company_id,
  role_name = excluded.role_name,
  is_active = true;

notify pgrst, 'reload schema';
