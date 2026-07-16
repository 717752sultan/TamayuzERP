create table if not exists public.company_permissions (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  permission_key text not null,
  permission_label text not null,
  module_key text,
  module_label text,
  group_key text,
  group_label text,
  route_key text,
  can_access boolean default true,
  can_view boolean default true,
  can_create boolean default false,
  can_edit boolean default false,
  can_delete boolean default false,
  can_approve boolean default false,
  can_export boolean default false,
  can_print boolean default false,
  can_manage boolean default false,
  is_enabled boolean default true,
  is_official_page boolean default true,
  is_duplicate_allowed boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.company_permissions add column if not exists group_key text;
alter table public.company_permissions add column if not exists group_label text;
alter table public.company_permissions add column if not exists route_key text;
alter table public.company_permissions add column if not exists is_official_page boolean default true;
alter table public.company_permissions add column if not exists is_duplicate_allowed boolean default false;
alter table public.company_permissions add column if not exists sort_order integer default 0;

create unique index if not exists company_permissions_company_permission_idx
  on public.company_permissions (company_id, permission_key);

alter table public.companies add column if not exists accent_color text;
alter table public.companies add column if not exists sidebar_bg_color text;
alter table public.companies add column if not exists sidebar_text_color text;
alter table public.companies add column if not exists button_color text;
alter table public.companies add column if not exists button_text_color text;
alter table public.companies add column if not exists card_accent_color text;
alter table public.companies add column if not exists table_header_color text;
alter table public.companies add column if not exists report_header_color text;
alter table public.companies add column if not exists theme_mode text default 'light';
alter table public.companies add column if not exists theme_name text default 'default';

update public.companies set
  primary_color = coalesce(nullif(primary_color, ''), '#8b1e1e'),
  secondary_color = coalesce(nullif(secondary_color, ''), '#374151'),
  accent_color = coalesce(nullif(accent_color, ''), '#991b1b'),
  sidebar_bg_color = coalesce(nullif(sidebar_bg_color, ''), '#111827'),
  sidebar_text_color = coalesce(nullif(sidebar_text_color, ''), '#ffffff'),
  button_color = coalesce(nullif(button_color, ''), '#991b1b'),
  button_text_color = coalesce(nullif(button_text_color, ''), '#ffffff'),
  card_accent_color = coalesce(nullif(card_accent_color, ''), '#fee2e2'),
  table_header_color = coalesce(nullif(table_header_color, ''), '#f8fafc'),
  report_header_color = coalesce(nullif(report_header_color, ''), '#8b1e1e'),
  theme_mode = coalesce(nullif(theme_mode, ''), 'light'),
  theme_name = coalesce(nullif(theme_name, ''), 'default');

with registry(permission_key, permission_label, module_key, module_label, group_key, group_label, route_key, is_official_page, is_duplicate_allowed, sort_order) as (
  values
  ('dashboard','الرئيسية','dashboard','الرئيسية','core','أساسية','dashboard',true,false,1),
  ('employees','قائمة الموظفين','employees','قائمة الموظفين','hr','موارد بشرية','employees',true,false,2),
  ('templates','نماذج التقييم','templates','نماذج التقييم','performance','الأداء','templates',true,true,3),
  ('employee_evaluation','تقييم الموظفين','employee_evaluation','تقييم الموظفين','performance','الأداء','evaluations',true,true,4),
  ('productivity','الإنتاجية','productivity','الإنتاجية','performance','الأداء','productivity',true,false,5),
  ('discipline','الانضباط','discipline','الانضباط','hr','موارد بشرية','discipline',true,true,6),
  ('incentives','الحوافز','incentives','الحوافز','financial','مالية','incentives',true,true,7),
  ('employee_of_month','موظف الشهر','employee_of_month','موظف الشهر','performance','الأداء','top',true,false,8),
  ('improvement_plans','خطط التحسين','improvement_plans','خطط التحسين','performance','الأداء','plans',true,false,9),
  ('reports','قسم التقارير','reports','قسم التقارير','reports','تقارير','reports',true,true,10),
  ('settings','إعدادات','settings','إعدادات','settings','إعدادات','settings',true,true,11),
  ('guarantees','ضمانات الموظفين','guarantees','ضمانات الموظفين','hr','موارد بشرية','guarantees',true,true,12),
  ('overtime','العمل الإضافي','overtime','العمل الإضافي','hr','موارد بشرية','overtime',true,true,13),
  ('shifts','شفتات الموظفين','shifts','شفتات الموظفين','hr','موارد بشرية','shifts',true,false,14),
  ('inventory','إدارة المخزون','inventory','إدارة المخزون','inventory','مخزون','inventory',true,true,15),
  ('daily_operations','العمليات اليومية','daily_operations','العمليات اليومية','core','أساسية','daily_operations',true,false,16),
  ('performance_standards','معايير الأداء','performance_standards','معايير الأداء','performance','الأداء','performance_criteria',true,true,17),
  ('kpi_scores','درجات KPI','kpi_scores','درجات KPI','performance','الأداء','performance_kpi_scores',true,false,18),
  ('users_permissions','المستخدمون والصلاحيات','users_permissions','المستخدمون والصلاحيات','settings','إعدادات','users_permissions',true,false,19),
  ('recruitment_requests','طلبات التوظيف','recruitment_requests','طلبات التوظيف','hr','موارد بشرية','recruitment',true,true,20),
  ('report_center','مركز التقارير','report_center','مركز التقارير','reports','تقارير','reports_center',true,true,21),
  ('audit_logs','سجل العمليات','audit_logs','سجل العمليات','settings','إعدادات','audit_logs',true,false,22),
  ('companies_management','إدارة الشركات','companies_management','إدارة الشركات','platform','منصة','companies_admin',true,false,23),
  ('hr_home','الرئيسية','hr_home','الرئيسية','core','أساسية','hr_home',true,true,101),
  ('hr_employees_full','قائمة الموظفين','hr_employees_full','قائمة الموظفين','hr','موارد بشرية','hr_employees_full',true,true,102),
  ('hr_reports_full','قسم التقارير','hr_reports_full','قسم التقارير','reports','تقارير','hr_reports_full',true,true,103),
  ('requests','الطلبات','requests','الطلبات','hr','موارد بشرية','hr_requests',true,false,104),
  ('performance','قياس الأداء','performance','قياس الأداء','performance','الأداء','hr_performance_full',true,true,105),
  ('hr_incentives_full','الحوافز','hr_incentives_full','الحوافز','financial','مالية','hr_incentives_full',true,true,106),
  ('attendance','حساب الدوام','attendance','حساب الدوام','hr','موارد بشرية','hr_attendance_payroll',true,false,107),
  ('salaries','حساب الراتب','salaries','حساب الراتب','financial','مالية','hr_salary',true,false,108),
  ('disciplinary','المساءلات والإنذارات','disciplinary','المساءلات والإنذارات','hr','موارد بشرية','hr_disciplinary',true,false,109),
  ('recruitment','التوظيف','recruitment','التوظيف','hr','موارد بشرية','hr_recruitment_full',true,true,110),
  ('leaves','الإجازات','leaves','الإجازات','hr','موارد بشرية','hr_leaves',true,false,111),
  ('complaints','الشكاوى','complaints','الشكاوى','hr','موارد بشرية','hr_complaints',true,false,112),
  ('circulars','التعاميم','circulars','التعاميم','hr','موارد بشرية','hr_circulars',true,false,113),
  ('end_of_service','إنهاء الخدمة','end_of_service','إنهاء الخدمة','hr','موارد بشرية','hr_termination',true,false,114),
  ('surveys','الاستبيانات','surveys','الاستبيانات','hr','موارد بشرية','hr_surveys',true,false,115),
  ('insurance','التأمينات','insurance','التأمينات','hr','موارد بشرية','hr_insurance',true,false,116),
  ('announcements','قسم الإعلانات','announcements','قسم الإعلانات','hr','موارد بشرية','hr_announcements',true,false,117),
  ('files','إدارة الملفات','files','إدارة الملفات','hr','موارد بشرية','hr_files',true,false,118),
  ('training','التدريب','training','التدريب','hr','موارد بشرية','hr_training',true,false,119),
  ('approvals','الموافقات','approvals','الموافقات','hr','موارد بشرية','hr_approvals',true,false,120),
  ('organization','الهيكل التنظيمي','organization','الهيكل التنظيمي','hr','موارد بشرية','hr_org_chart',true,false,121),
  ('hr_settings_full','إعدادات','hr_settings_full','إعدادات','settings','إعدادات','hr_settings_full',true,true,122),
  ('financial_setup','تهيئة المعلومات المالية','financial_setup','تهيئة المعلومات المالية','financial','مالية','hr_financial_setup',true,false,123),
  ('hr_templates_full','القوالب','hr_templates_full','القوالب','settings','إعدادات','hr_templates_full',true,true,124),
  ('ai_assistant','المساعد الذكي','ai_assistant','المساعد الذكي','core','أساسية','ai_assistant',true,false,125),
  ('theme_settings','الثيم والألوان','theme_settings','الثيم والألوان','settings','إعدادات','theme_settings',true,false,126)
)
insert into public.company_permissions
  (company_id, permission_key, permission_label, module_key, module_label, group_key, group_label, route_key, can_access, can_view, can_create, can_edit, can_delete, can_approve, can_export, can_print, can_manage, is_enabled, is_official_page, is_duplicate_allowed, sort_order)
select
  c.company_id, r.permission_key, r.permission_label, r.module_key, r.module_label, r.group_key, r.group_label, r.route_key,
  true, true, true, true, false, true, true, true, true, true, r.is_official_page, r.is_duplicate_allowed, r.sort_order
from public.companies c
cross join registry r
on conflict (company_id, permission_key) do update set
  permission_label = excluded.permission_label,
  module_key = excluded.module_key,
  module_label = excluded.module_label,
  group_key = excluded.group_key,
  group_label = excluded.group_label,
  route_key = excluded.route_key,
  is_official_page = excluded.is_official_page,
  is_duplicate_allowed = excluded.is_duplicate_allowed,
  sort_order = excluded.sort_order,
  updated_at = now();

notify pgrst, 'reload schema';
