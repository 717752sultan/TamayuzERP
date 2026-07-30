-- Pending migration: Tamyuz Employee mobile portal.
-- DO NOT EXECUTE automatically.
-- Tables only. RLS is intentionally not enabled in this task because the app uses custom login.

create table if not exists public.employee_requests (
  request_id text primary key,
  company_id text not null,
  employee_id text not null,
  request_type text not null,
  title text,
  description text,
  from_date date,
  to_date date,
  from_time time,
  to_time time,
  attachment_url text,
  status text default 'pending',
  current_approver text,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_employee_requests_company_id
  on public.employee_requests (company_id);
create index if not exists idx_employee_requests_company_employee
  on public.employee_requests (company_id, employee_id);
create index if not exists idx_employee_requests_company_status
  on public.employee_requests (company_id, status);
create index if not exists idx_employee_requests_company_created_at
  on public.employee_requests (company_id, created_at);

create table if not exists public.employee_request_attachments (
  attachment_id text primary key,
  company_id text not null,
  request_id text not null,
  employee_id text not null,
  file_name text,
  file_url text,
  file_path text,
  file_type text,
  file_size numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_employee_request_attachments_company_id
  on public.employee_request_attachments (company_id);
create index if not exists idx_employee_request_attachments_company_employee
  on public.employee_request_attachments (company_id, employee_id);
create index if not exists idx_employee_request_attachments_company_request
  on public.employee_request_attachments (company_id, request_id);
create index if not exists idx_employee_request_attachments_company_created_at
  on public.employee_request_attachments (company_id, created_at);

create table if not exists public.employee_notifications (
  notification_id text primary key,
  company_id text not null,
  employee_id text,
  title text not null,
  body text,
  type text default 'general',
  is_read boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_employee_notifications_company_id
  on public.employee_notifications (company_id);
create index if not exists idx_employee_notifications_company_employee
  on public.employee_notifications (company_id, employee_id);
create index if not exists idx_employee_notifications_company_type
  on public.employee_notifications (company_id, type);
create index if not exists idx_employee_notifications_company_created_at
  on public.employee_notifications (company_id, created_at);

create table if not exists public.employee_device_registry (
  device_id text primary key,
  company_id text not null,
  employee_id text not null,
  device_name text,
  device_info text,
  user_agent text,
  last_login_at timestamptz,
  last_ip text,
  last_seen_at timestamptz,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_employee_device_registry_company_id
  on public.employee_device_registry (company_id);
create index if not exists idx_employee_device_registry_company_employee
  on public.employee_device_registry (company_id, employee_id);
create index if not exists idx_employee_device_registry_company_active
  on public.employee_device_registry (company_id, is_active);
create index if not exists idx_employee_device_registry_company_created_at
  on public.employee_device_registry (company_id, created_at);

notify pgrst, 'reload schema';
