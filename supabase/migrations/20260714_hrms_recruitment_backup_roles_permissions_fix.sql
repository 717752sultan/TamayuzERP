create table if not exists public.app_roles (
  role_id text primary key,
  role_name text unique not null,
  role_description text default '',
  is_system_role boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.app_permission_nodes (
  node_id text primary key,
  parent_id text,
  node_key text unique not null,
  node_name text not null,
  node_type text default 'page',
  module_key text,
  page_key text,
  tab_key text,
  sort_order numeric default 0,
  icon text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.app_role_node_permissions (
  permission_id text primary key,
  role_name text not null,
  node_key text not null,
  can_view boolean default false,
  can_create boolean default false,
  can_edit boolean default false,
  can_delete boolean default false,
  can_approve boolean default false,
  can_reject boolean default false,
  can_cancel boolean default false,
  can_post boolean default false,
  can_import boolean default false,
  can_export boolean default false,
  can_print boolean default false,
  can_configure boolean default false,
  can_override boolean default false,
  can_view_financial boolean default false,
  can_view_sensitive boolean default false,
  data_scope text default 'own',
  allowed_branches jsonb default '[]'::jsonb,
  allowed_departments jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_app_role_node_permissions_unique_v2 on public.app_role_node_permissions(role_name, node_key);

create table if not exists public.system_backups (
  backup_id text primary key,
  backup_type text default 'full',
  file_name text,
  file_url text,
  backup_payload jsonb,
  sent_to_email text,
  created_by text,
  created_at timestamptz default now(),
  status text default 'جاهزة',
  notes text
);

create table if not exists public.recruitment_job_postings (
  job_posting_id text primary key,
  job_title text,
  department text,
  branch text,
  job_type text,
  vacancies_count numeric default 1,
  salary_range_from numeric default 0,
  salary_range_to numeric default 0,
  requirements text,
  responsibilities text,
  status text default 'مفتوحة',
  opened_at date,
  closed_at date,
  created_by text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruitment_applications (
  application_id text primary key,
  application_number text,
  job_posting_id text,
  job_title text,
  applicant_name text,
  phone text,
  email text,
  address text,
  qualification text,
  specialization text,
  experience_years numeric default 0,
  previous_employer text,
  expected_salary numeric default 0,
  application_source text,
  cv_url text,
  status text default 'جديد',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruitment_candidate_evaluations (
  evaluation_id text primary key,
  application_id text,
  applicant_name text,
  job_title text,
  evaluator_name text,
  evaluation_date date,
  appearance_score numeric default 0,
  communication_score numeric default 0,
  technical_score numeric default 0,
  experience_score numeric default 0,
  culture_fit_score numeric default 0,
  honesty_score numeric default 0,
  pressure_handling_score numeric default 0,
  computer_skills_score numeric default 0,
  customer_service_score numeric default 0,
  total_score numeric default 0,
  recommendation text,
  strengths text,
  weaknesses text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruitment_offer_templates (
  template_id text primary key,
  template_name text,
  job_title text,
  branch text,
  salary numeric default 0,
  allowances numeric default 0,
  probation_period text,
  working_hours text,
  start_date date,
  offer_valid_until date,
  terms text,
  template_body text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruitment_job_offers (
  offer_id text primary key,
  offer_number text,
  application_id text,
  applicant_name text,
  job_title text,
  branch text,
  salary numeric default 0,
  allowances numeric default 0,
  start_date date,
  probation_period text,
  status text default 'مسودة',
  sent_at date,
  accepted_at date,
  rejected_at date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruitment_contracts (
  contract_id text primary key,
  contract_number text,
  offer_id text,
  application_id text,
  applicant_name text,
  employee_name text,
  job_title text,
  branch text,
  salary numeric default 0,
  contract_start_date date,
  contract_end_date date,
  probation_period text,
  status text default 'مسودة',
  contract_body text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruitment_manpower_plans (
  manpower_plan_id text primary key,
  year numeric,
  month numeric,
  branch text,
  department text,
  job_title text,
  required_count numeric default 0,
  current_count numeric default 0,
  shortage_count numeric default 0,
  priority text default 'عادي',
  reason text,
  status text default 'مسودة',
  approved_by text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruitment_tests (
  test_id text primary key,
  test_name text,
  job_title text,
  test_type text,
  max_score numeric default 100,
  pass_score numeric default 60,
  instructions text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruitment_test_results (
  result_id text primary key,
  test_id text,
  application_id text,
  applicant_name text,
  test_date date,
  score numeric default 0,
  passed boolean default false,
  evaluator text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruitment_probation_evaluations (
  probation_evaluation_id text primary key,
  employee_id text,
  employee_name text,
  discipline_score numeric default 0,
  performance_score numeric default 0,
  learning_score numeric default 0,
  behavior_score numeric default 0,
  accuracy_score numeric default 0,
  customer_service_score numeric default 0,
  total_score numeric default 0,
  recommendation text,
  manager_notes text,
  hr_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.recruitment_welcome_messages (
  welcome_message_id text primary key,
  employee_id text,
  employee_name text,
  job text,
  branch text,
  start_date date,
  message_template text,
  whatsapp_message text,
  status text default 'مسودة',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_recruitment_applications_status on public.recruitment_applications(status);
create index if not exists idx_recruitment_applications_job on public.recruitment_applications(job_posting_id);
create index if not exists idx_recruitment_offers_status on public.recruitment_job_offers(status);
create index if not exists idx_recruitment_contracts_status on public.recruitment_contracts(status);
create index if not exists idx_system_backups_type on public.system_backups(backup_type);

insert into public.app_roles (role_id, role_name, role_description, is_system_role, is_active)
values
  ('ROLE-admin', 'مدير النظام', 'تحكم كامل في النظام', true, true),
  ('ROLE-hr', 'الموارد البشرية', 'إدارة الموارد البشرية والتوظيف', true, true),
  ('ROLE-branch-manager', 'مدير فرع', 'إدارة نطاق الفرع', true, true),
  ('ROLE-executive', 'الإدارة العليا', 'عرض واعتماد التقارير', true, true),
  ('ROLE-inventory', 'مسؤول المخزون', 'إدارة المخزون', true, true),
  ('ROLE-employee', 'الموظف', 'بوابة الموظف', true, true)
on conflict (role_name) do nothing;

insert into public.app_permission_nodes (node_id, node_key, node_name, parent_id, node_type, module_key, page_key, tab_key, sort_order, is_active)
values
  ('dashboard', 'dashboard', 'لوحة التحكم', null, 'module', 'dashboard', 'dashboard', null, 0, true),
  ('dashboard_main', 'dashboard_main', 'لوحة التحكم الرئيسية', 'dashboard', 'tab', 'dashboard', 'dashboard', 'dashboard_main', 1, true),
  ('dashboard_hr', 'dashboard_hr', 'لوحة الموارد البشرية', 'dashboard', 'tab', 'dashboard', 'dashboard', 'dashboard_hr', 2, true),
  ('dashboard_inventory', 'dashboard_inventory', 'لوحة المخزون', 'dashboard', 'tab', 'dashboard', 'dashboard', 'dashboard_inventory', 3, true),
  ('dashboard_performance', 'dashboard_performance', 'لوحة الأداء', 'dashboard', 'tab', 'dashboard', 'dashboard', 'dashboard_performance', 4, true),
  ('dashboard_daily_operations', 'dashboard_daily_operations', 'لوحة العمليات اليومية', 'dashboard', 'tab', 'dashboard', 'dashboard', 'dashboard_daily_operations', 5, true),
  ('dashboard_branches', 'dashboard_branches', 'لوحة الفروع', 'dashboard', 'tab', 'dashboard', 'dashboard', 'dashboard_branches', 6, true),
  ('dashboard_financial', 'dashboard_financial', 'لوحة مالية', 'dashboard', 'tab', 'dashboard', 'dashboard', 'dashboard_financial', 7, true),
  ('users_list', 'users_list', 'قائمة المستخدمين', 'system', 'tab', 'system', 'users_permissions', 'users_list', 6, true),
  ('roles', 'roles', 'إدارة الأدوار', 'system', 'tab', 'system', 'users_permissions', 'roles', 7, true),
  ('permissions_matrix', 'permissions_matrix', 'مصفوفة الصلاحيات', 'system', 'tab', 'system', 'users_permissions', 'permissions_matrix', 8, true),
  ('permission_templates', 'permission_templates', 'قوالب الصلاحيات', 'system', 'tab', 'system', 'users_permissions', 'permission_templates', 9, true),
  ('user_activity', 'user_activity', 'نشاط المستخدمين', 'system', 'tab', 'system', 'users_permissions', 'user_activity', 10, true),
  ('system_backup', 'system_backup', 'النسخ الاحتياطي', 'system', 'page', 'system', 'settings', 'system_backup', 11, true),
  ('recruitment', 'recruitment', 'طلبات التوظيف', null, 'module', 'recruitment', 'recruitment', null, 11, true),
  ('recruitment_job_postings', 'recruitment_job_postings', 'قائمة الوظائف', 'recruitment', 'tab', 'recruitment', 'recruitment', 'job_postings', 1, true),
  ('recruitment_applications', 'recruitment_applications', 'طلبات التوظيف', 'recruitment', 'tab', 'recruitment', 'recruitment', 'applications', 2, true),
  ('recruitment_candidate_evaluations', 'recruitment_candidate_evaluations', 'تقييم المرشحين', 'recruitment', 'tab', 'recruitment', 'recruitment', 'candidate_evaluations', 3, true),
  ('recruitment_offer_templates', 'recruitment_offer_templates', 'خطاب عرض العمل', 'recruitment', 'tab', 'recruitment', 'recruitment', 'offer_templates', 4, true),
  ('recruitment_job_offers', 'recruitment_job_offers', 'عروض العمل', 'recruitment', 'tab', 'recruitment', 'recruitment', 'job_offers', 5, true),
  ('recruitment_contracts', 'recruitment_contracts', 'عقود العمل', 'recruitment', 'tab', 'recruitment', 'recruitment', 'contracts', 6, true),
  ('recruitment_manpower_plans', 'recruitment_manpower_plans', 'خطة الاحتياجات الوظيفية', 'recruitment', 'tab', 'recruitment', 'recruitment', 'manpower_plans', 7, true),
  ('recruitment_tests', 'recruitment_tests', 'اختبارات التوظيف', 'recruitment', 'tab', 'recruitment', 'recruitment', 'tests', 8, true),
  ('recruitment_probation_employees', 'recruitment_probation_employees', 'الموظفون تحت التجربة', 'recruitment', 'tab', 'recruitment', 'recruitment', 'probation_employees', 9, true),
  ('recruitment_welcome_messages', 'recruitment_welcome_messages', 'رسائل الترحيب', 'recruitment', 'tab', 'recruitment', 'recruitment', 'welcome_messages', 10, true),
  ('recruitment_reports', 'recruitment_reports', 'تقارير التوظيف', 'recruitment', 'tab', 'recruitment', 'recruitment', 'reports', 11, true),
  ('recruitment_settings', 'recruitment_settings', 'إعدادات التوظيف', 'recruitment', 'tab', 'recruitment', 'recruitment', 'settings', 12, true)
on conflict (node_key) do update set
  node_name = excluded.node_name,
  parent_id = excluded.parent_id,
  node_type = excluded.node_type,
  module_key = excluded.module_key,
  page_key = excluded.page_key,
  tab_key = excluded.tab_key,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.app_role_node_permissions (
  permission_id, role_name, node_key, can_view, can_create, can_edit, can_delete,
  can_approve, can_reject, can_cancel, can_import, can_export, can_print,
  can_configure, can_view_sensitive, data_scope, updated_at
)
select 'مدير النظام-' || node_key, 'مدير النظام', node_key, true, true, true, true, true, true, true, true, true, true, true, true, 'all', now()
from public.app_permission_nodes
on conflict (permission_id) do update set
  can_view = true,
  can_create = true,
  can_edit = true,
  can_delete = true,
  can_approve = true,
  can_reject = true,
  can_cancel = true,
  can_import = true,
  can_export = true,
  can_print = true,
  can_configure = true,
  can_view_sensitive = true,
  data_scope = 'all',
  updated_at = now();

notify pgrst, 'reload schema';
