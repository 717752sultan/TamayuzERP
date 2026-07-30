-- Pending migration only. Do not execute automatically.
-- Employee portal attendance dashboard, lateness, and advanced geofence rules.
-- This file intentionally does not enable RLS and does not modify login.

alter table if exists public.employee_app_settings
add column if not exists default_check_in_time time default '08:00',
add column if not exists default_check_out_time time default '17:00',
add column if not exists grace_period_minutes integer default 15,
add column if not exists count_late_after_grace boolean default true,
add column if not exists save_rejected_attendance_attempts boolean default true;

alter table if exists public.attendance_locations
add column if not exists location_purpose text default 'both',
add column if not exists allow_check_in boolean default true,
add column if not exists allow_check_out boolean default true,
add column if not exists block_check_in_here boolean default false,
add column if not exists block_check_out_here boolean default false,
add column if not exists priority integer default 1;

alter table if exists public.employee_attendance_events
add column if not exists matched_location_id text,
add column if not exists matched_location_name text,
add column if not exists matched_location_purpose text,
add column if not exists event_status text default 'accepted',
add column if not exists rejection_reason text,
add column if not exists is_late boolean default false,
add column if not exists late_minutes integer default 0;

create index if not exists employee_attendance_events_company_date_idx
on public.employee_attendance_events(company_id, attendance_date);

create index if not exists employee_attendance_events_company_employee_date_idx
on public.employee_attendance_events(company_id, employee_id, attendance_date);

create index if not exists employee_attendance_events_company_event_type_idx
on public.employee_attendance_events(company_id, event_type);

create index if not exists employee_attendance_events_company_event_status_idx
on public.employee_attendance_events(company_id, event_status);

create index if not exists employee_attendance_events_company_is_late_idx
on public.employee_attendance_events(company_id, is_late);

create index if not exists attendance_locations_company_branch_idx
on public.attendance_locations(company_id, branch);

create index if not exists attendance_locations_company_employee_idx
on public.attendance_locations(company_id, employee_id);

create index if not exists attendance_locations_company_purpose_idx
on public.attendance_locations(company_id, location_purpose);

notify pgrst, 'reload schema';
