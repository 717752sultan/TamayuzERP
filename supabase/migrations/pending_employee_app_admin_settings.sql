-- Pending migration: Employee Portal admin control center.
-- DO NOT EXECUTE automatically.
-- Tables only. RLS is intentionally not enabled in this task.

create table if not exists public.employee_app_settings (
  setting_id text primary key,
  company_id text not null unique,
  app_enabled boolean default true,
  employee_login_enabled boolean default true,
  geofence_required boolean default true,
  max_gps_accuracy_meters integer default 100,
  allow_attendance_without_location boolean default false,
  allow_checkout_outside_geofence boolean default false,
  allow_attachments boolean default true,
  show_schedule boolean default true,
  show_attendance_history boolean default true,
  show_salary boolean default false,
  show_leave_balance boolean default true,
  notifications_enabled boolean default true,
  device_registration_enabled boolean default false,
  single_device_only boolean default false,
  employee_notice text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_employee_app_settings_company_id
  on public.employee_app_settings (company_id);

create table if not exists public.employee_app_permissions (
  permission_id text primary key,
  company_id text not null,
  role_name text,
  employee_id text,
  module_key text not null,
  can_view boolean default false,
  can_create boolean default false,
  can_upload boolean default false,
  can_cancel boolean default false,
  can_approve boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_employee_app_permissions_company_role
  on public.employee_app_permissions (company_id, role_name);
create index if not exists idx_employee_app_permissions_company_employee
  on public.employee_app_permissions (company_id, employee_id);
create index if not exists idx_employee_app_permissions_company_module
  on public.employee_app_permissions (company_id, module_key);

create table if not exists public.employee_app_request_types (
  request_type_id text primary key,
  company_id text not null,
  request_key text not null,
  request_label text not null,
  is_enabled boolean default true,
  requires_attachment boolean default false,
  requires_date_range boolean default false,
  requires_time_range boolean default false,
  approval_role text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_employee_app_request_types_company_key
  on public.employee_app_request_types (company_id, request_key);

-- Optional seed templates. Replace COMP-PUREMONEY with the intended company_id before execution
-- if you want to seed a specific company from SQL instead of the admin UI.
/*
insert into public.employee_app_settings (setting_id, company_id)
values ('employee_app_settings_COMP-PUREMONEY', 'COMP-PUREMONEY')
on conflict (company_id) do nothing;

insert into public.employee_app_request_types
(request_type_id, company_id, request_key, request_label, is_enabled, requires_attachment, requires_date_range, requires_time_range)
values
('COMP-PUREMONEY_leave', 'COMP-PUREMONEY', 'leave', 'طلب إجازة', true, false, true, false),
('COMP-PUREMONEY_permission', 'COMP-PUREMONEY', 'permission', 'طلب استئذان', true, false, false, true),
('COMP-PUREMONEY_advance', 'COMP-PUREMONEY', 'advance', 'طلب سلفة', true, false, false, false),
('COMP-PUREMONEY_assistance', 'COMP-PUREMONEY', 'assistance', 'طلب مساعدة', true, false, false, false),
('COMP-PUREMONEY_custody', 'COMP-PUREMONEY', 'custody', 'طلب عهدة', true, false, false, false),
('COMP-PUREMONEY_attendance_correction', 'COMP-PUREMONEY', 'attendance_correction', 'طلب تعديل حضور', true, false, false, true),
('COMP-PUREMONEY_hr_letter', 'COMP-PUREMONEY', 'hr_letter', 'طلب خطاب HR', true, false, false, false),
('COMP-PUREMONEY_general', 'COMP-PUREMONEY', 'general', 'طلب عام', true, false, false, false)
on conflict (company_id, request_key) do nothing;
*/

notify pgrst, 'reload schema';
