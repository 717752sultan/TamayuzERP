create table if not exists public.app_permission_nodes (
  node_id text primary key,
  parent_id text null,
  node_key text unique not null,
  node_name text not null,
  node_type text not null,
  module_key text,
  page_key text,
  tab_key text,
  sort_order integer default 0,
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

alter table if exists public.app_role_node_permissions add column if not exists can_reject boolean default false;
alter table if exists public.app_role_node_permissions add column if not exists can_cancel boolean default false;
alter table if exists public.app_role_node_permissions add column if not exists can_post boolean default false;
alter table if exists public.app_role_node_permissions add column if not exists can_import boolean default false;
alter table if exists public.app_role_node_permissions add column if not exists can_export boolean default false;
alter table if exists public.app_role_node_permissions add column if not exists can_print boolean default false;
alter table if exists public.app_role_node_permissions add column if not exists can_configure boolean default false;
alter table if exists public.app_role_node_permissions add column if not exists can_override boolean default false;
alter table if exists public.app_role_node_permissions add column if not exists can_view_financial boolean default false;
alter table if exists public.app_role_node_permissions add column if not exists can_view_sensitive boolean default false;
alter table if exists public.app_role_node_permissions add column if not exists data_scope text default 'own';
alter table if exists public.app_role_node_permissions add column if not exists allowed_branches jsonb default '[]'::jsonb;
alter table if exists public.app_role_node_permissions add column if not exists allowed_departments jsonb default '[]'::jsonb;

create unique index if not exists idx_app_role_node_permissions_unique on public.app_role_node_permissions(role_name, node_key);
create index if not exists idx_app_permission_nodes_parent on public.app_permission_nodes(parent_id);
create index if not exists idx_app_permission_nodes_key on public.app_permission_nodes(node_key);
create index if not exists idx_app_permission_nodes_module on public.app_permission_nodes(module_key);
create index if not exists idx_app_permission_nodes_page on public.app_permission_nodes(page_key);
create index if not exists idx_app_permission_nodes_tab on public.app_permission_nodes(tab_key);
create index if not exists idx_app_role_node_permissions_role on public.app_role_node_permissions(role_name);
create index if not exists idx_app_role_node_permissions_node on public.app_role_node_permissions(node_key);

insert into public.app_permission_nodes (node_id, parent_id, node_key, node_name, node_type, module_key, page_key, tab_key, sort_order)
values
('system', null, 'system', 'النظام', 'module', 'system', 'system', '', 1),
('system_users', 'system', 'system_users', 'المستخدمون', 'page', 'system', 'users_permissions', '', 1),
('system_roles', 'system', 'system_roles', 'الأدوار', 'page', 'system', 'users_permissions', '', 2),
('system_permissions', 'system', 'system_permissions', 'الصلاحيات', 'page', 'system', 'users_permissions', '', 3),
('audit_logs', 'system', 'audit_logs', 'سجل العمليات', 'page', 'system', 'audit_logs', '', 4),
('notifications', 'system', 'notifications', 'الإشعارات', 'page', 'system', 'notifications', '', 5),
('settings', null, 'settings', 'الإعدادات', 'module', 'settings', 'settings', '', 2),
('settings_branches', 'settings', 'settings_branches', 'الفروع', 'tab', 'settings', 'settings', 'branches', 1),
('settings_currencies', 'settings', 'settings_currencies', 'العملات', 'tab', 'settings', 'settings', 'currencies', 2),
('settings_jobs', 'settings', 'settings_jobs', 'الوظائف', 'tab', 'settings', 'settings', 'jobs', 3),
('employees', null, 'employees', 'الموظفون', 'module', 'employees', 'employees', '', 3),
('employees_list', 'employees', 'employees_list', 'قائمة الموظفين', 'page', 'employees', 'employees', '', 1),
('employee_profile', 'employees', 'employee_profile', 'بيانات الموظف', 'page', 'employees', 'employees', '', 2),
('guarantees', 'employees', 'guarantees', 'الضمانات', 'page', 'employees', 'guarantees', '', 3),
('inventory', null, 'inventory', 'المخزون', 'module', 'inventory', 'inventory', '', 4),
('inventory_dashboard', 'inventory', 'inventory_dashboard', 'لوحة المخزون', 'tab', 'inventory', 'inventory', 'dashboard', 1),
('inventory_items', 'inventory', 'inventory_items', 'الأصناف', 'tab', 'inventory', 'inventory', 'items', 2),
('inventory_suppliers', 'inventory', 'inventory_suppliers', 'الموردون', 'tab', 'inventory', 'inventory', 'suppliers', 3),
('inventory_purchase_requests', 'inventory', 'inventory_purchase_requests', 'طلب شراء', 'tab', 'inventory', 'inventory', 'purchase_requests', 4),
('inventory_purchase_orders', 'inventory', 'inventory_purchase_orders', 'أمر شراء', 'tab', 'inventory', 'inventory', 'purchase_orders', 5),
('inventory_receipts', 'inventory', 'inventory_receipts', 'إذن استلام', 'tab', 'inventory', 'inventory', 'receipts', 6),
('inventory_invoices', 'inventory', 'inventory_invoices', 'فاتورة شراء', 'tab', 'inventory', 'inventory', 'invoices', 7),
('inventory_issue_vouchers', 'inventory', 'inventory_issue_vouchers', 'سند صرف للفروع', 'tab', 'inventory', 'inventory', 'issues', 8),
('inventory_returns', 'inventory', 'inventory_returns', 'سند إرجاع من الفروع', 'tab', 'inventory', 'inventory', 'returns', 9),
('inventory_transfers', 'inventory', 'inventory_transfers', 'سند تحويل مخزني', 'tab', 'inventory', 'inventory', 'transfers', 10),
('inventory_adjustments', 'inventory', 'inventory_adjustments', 'التسويات', 'tab', 'inventory', 'inventory', 'adjustments', 11),
('inventory_stocktakes', 'inventory', 'inventory_stocktakes', 'الجرد', 'tab', 'inventory', 'inventory', 'stocktakes', 12),
('inventory_balances', 'inventory', 'inventory_balances', 'أرصدة المخزون', 'tab', 'inventory', 'inventory', 'balances', 13),
('inventory_forecast', 'inventory', 'inventory_forecast', 'توقع الاحتياج', 'tab', 'inventory', 'inventory', 'forecast', 14),
('inventory_reports', 'inventory', 'inventory_reports', 'تقارير المخزون', 'tab', 'inventory', 'inventory', 'reports', 15),
('inventory_settings', 'inventory', 'inventory_settings', 'إعدادات المخزون', 'tab', 'inventory', 'inventory', 'settings', 16),
('shifts', null, 'shifts', 'الشفتات', 'module', 'shifts', 'shifts', '', 5),
('shift_types', 'shifts', 'shift_types', 'أنواع الشفتات', 'tab', 'shifts', 'shifts', 'types', 1),
('shift_assignments', 'shifts', 'shift_assignments', 'توزيع الموظفين', 'tab', 'shifts', 'shifts', 'assignments', 2),
('performance', null, 'performance', 'التقييمات والأداء', 'module', 'performance', 'evaluations', '', 6),
('performance_criteria', 'performance', 'performance_criteria', 'معايير الأداء', 'page', 'performance', 'performance_criteria', '', 1),
('templates', 'performance', 'templates', 'نماذج الوظائف', 'page', 'performance', 'templates', '', 2),
('evaluations', 'performance', 'evaluations', 'تقييم الموظفين', 'page', 'performance', 'evaluations', '', 3),
('performance_kpi_scores', 'performance', 'performance_kpi_scores', 'درجات KPI', 'page', 'performance', 'performance_kpi_scores', '', 4),
('daily_operations', null, 'daily_operations', 'العمليات اليومية', 'module', 'daily_operations', 'daily_operations', '', 7),
('daily_operations_entry', 'daily_operations', 'daily_operations_entry', 'إدخال العمليات', 'tab', 'daily_operations', 'daily_operations', 'entry', 1),
('daily_operations_approval', 'daily_operations', 'daily_operations_approval', 'اعتماد العمليات', 'tab', 'daily_operations', 'daily_operations', 'approval', 2),
('incentives', null, 'incentives', 'الحوافز', 'module', 'incentives', 'incentives', '', 8),
('reports', null, 'reports', 'التقارير', 'module', 'reports', 'reports', '', 9),
('reports_center', 'reports', 'reports_center', 'مركز التقارير', 'page', 'reports', 'reports_center', '', 1),
('ai_assistant', null, 'ai_assistant', 'المساعد الذكي', 'module', 'ai_assistant', 'ai_assistant', '', 10),
('ai_chat', 'ai_assistant', 'ai_chat', 'المحادثة', 'page', 'ai_assistant', 'ai_assistant', 'chat', 1)
on conflict (node_key) do nothing;

insert into public.app_role_node_permissions (
  permission_id, role_name, node_key, can_view, can_create, can_edit, can_delete,
  can_approve, can_reject, can_cancel, can_post, can_import, can_export, can_print,
  can_configure, can_override, can_view_financial, can_view_sensitive, data_scope
)
select
  'مدير النظام-' || node_key,
  'مدير النظام',
  node_key,
  true, true, true, true, true, true, true, true, true, true, true, true, true, true, true,
  'all'
from public.app_permission_nodes
on conflict (permission_id) do nothing;

notify pgrst, 'reload schema';
