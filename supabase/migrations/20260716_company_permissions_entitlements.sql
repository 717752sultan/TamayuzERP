create table if not exists public.company_permissions (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  permission_key text not null,
  permission_label text not null,
  module_key text,
  module_label text,
  can_access boolean not null default true,
  can_view boolean not null default true,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  can_approve boolean not null default false,
  can_export boolean not null default false,
  can_print boolean not null default false,
  can_manage boolean not null default false,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_permissions_company_key_unique unique (company_id, permission_key)
);

create index if not exists company_permissions_company_id_idx
  on public.company_permissions (company_id);

create index if not exists company_permissions_module_key_idx
  on public.company_permissions (module_key);

insert into public.company_permissions
  (company_id, permission_key, permission_label, module_key, module_label, can_access, can_view, can_create, can_edit, can_delete, can_approve, can_export, can_print, can_manage, is_enabled)
values
  ('COMP-PUREMONEY', 'dashboard', 'لوحة التحكم', 'dashboard', 'لوحة التحكم', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'employees', 'الموظفون', 'employees', 'الموظفون', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'templates', 'نماذج التقييم', 'templates', 'نماذج التقييم', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'evaluations', 'تقييم الموظفين', 'evaluations', 'تقييم الموظفين', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'productivity', 'الإنتاجية', 'productivity', 'الإنتاجية', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'discipline', 'الانضباط', 'discipline', 'الانضباط', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'incentives', 'الحوافز', 'incentives', 'الحوافز', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'top', 'موظف الشهر', 'top', 'موظف الشهر', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'plans', 'خطط التحسين', 'plans', 'خطط التحسين', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'reports', 'التقارير', 'reports', 'التقارير', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'settings', 'الإعدادات', 'settings', 'الإعدادات', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'guarantees', 'ضمانات الموظفين', 'guarantees', 'ضمانات الموظفين', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'overtime', 'العمل الإضافي', 'overtime', 'العمل الإضافي', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'shifts', 'شفتات الموظفين', 'shifts', 'شفتات الموظفين', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'inventory', 'إدارة المخزون', 'inventory', 'إدارة المخزون', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'daily_operations', 'العمليات اليومية', 'daily_operations', 'العمليات اليومية', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'performance_criteria', 'معايير الأداء', 'performance_criteria', 'معايير الأداء', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'performance_kpi_scores', 'درجات KPI', 'performance_kpi_scores', 'درجات KPI', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'users_permissions', 'المستخدمون والصلاحيات', 'users_permissions', 'المستخدمون والصلاحيات', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'recruitment', 'طلبات التوظيف', 'recruitment', 'طلبات التوظيف', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'reports_center', 'مركز التقارير', 'reports_center', 'مركز التقارير', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'audit_logs', 'سجل العمليات', 'audit_logs', 'سجل العمليات', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'ai_assistant', 'المساعد الذكي', 'ai_assistant', 'المساعد الذكي', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'companies_management', 'إدارة الشركات', 'companies_management', 'إدارة الشركات', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'financial_setup', 'تهيئة المعلومات المالية', 'financial_setup', 'تهيئة المعلومات المالية', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'salaries', 'الرواتب', 'salaries', 'الرواتب', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'attendance', 'الحضور والدوام', 'attendance', 'الحضور والدوام', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'requests', 'الطلبات', 'requests', 'الطلبات', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'leaves', 'الإجازات', 'leaves', 'الإجازات', true, true, true, true, true, true, true, true, true, true),
  ('COMP-PUREMONEY', 'performance', 'الأداء', 'performance', 'الأداء', true, true, true, true, true, true, true, true, true, true)
on conflict (company_id, permission_key) do update set
  permission_label = excluded.permission_label,
  module_key = excluded.module_key,
  module_label = excluded.module_label,
  can_access = excluded.can_access,
  can_view = excluded.can_view,
  can_create = excluded.can_create,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete,
  can_approve = excluded.can_approve,
  can_export = excluded.can_export,
  can_print = excluded.can_print,
  can_manage = excluded.can_manage,
  is_enabled = excluded.is_enabled,
  updated_at = now();

notify pgrst, 'reload schema';
