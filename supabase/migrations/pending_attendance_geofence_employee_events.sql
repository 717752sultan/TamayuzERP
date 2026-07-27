-- Pending migration: Attendance geofence locations and employee self-attendance events.
-- DO NOT EXECUTE automatically.
-- This project currently uses custom application login, not full Supabase Auth JWT claims.
-- For that reason, this migration intentionally does not enable RLS and does not add fake permissive policies.
-- Add safe company_id RLS policies only after the app sends trusted company_id claims through Supabase Auth/JWT.

create table if not exists public.attendance_locations (
  location_id text primary key,
  company_id text not null,
  branch text,
  employee_id text,
  location_name text not null,
  latitude numeric not null,
  longitude numeric not null,
  allowed_radius_meters integer default 100,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_attendance_locations_company_id
  on public.attendance_locations (company_id);

create index if not exists idx_attendance_locations_company_branch
  on public.attendance_locations (company_id, branch);

create index if not exists idx_attendance_locations_company_employee
  on public.attendance_locations (company_id, employee_id);

create index if not exists idx_attendance_locations_company_active
  on public.attendance_locations (company_id, is_active);

create table if not exists public.employee_attendance_events (
  event_id text primary key,
  company_id text not null,
  employee_id text not null,
  employee_name text,
  branch text,
  attendance_date date not null,
  event_type text not null,
  event_time timestamptz not null,
  latitude numeric,
  longitude numeric,
  accuracy numeric,
  allowed_latitude numeric,
  allowed_longitude numeric,
  allowed_radius_meters integer,
  distance_from_allowed_location numeric,
  geofence_status text default 'unavailable',
  source text default 'employee_app',
  device_info text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_employee_attendance_events_company_id
  on public.employee_attendance_events (company_id);

create index if not exists idx_employee_attendance_events_company_employee
  on public.employee_attendance_events (company_id, employee_id);

create index if not exists idx_employee_attendance_events_company_date
  on public.employee_attendance_events (company_id, attendance_date);

create index if not exists idx_employee_attendance_events_company_branch
  on public.employee_attendance_events (company_id, branch);

create index if not exists idx_employee_attendance_events_company_event_type
  on public.employee_attendance_events (company_id, event_type);

notify pgrst, 'reload schema';
