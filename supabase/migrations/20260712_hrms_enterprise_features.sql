create table if not exists public.app_permissions (
  id text primary key,
  page_key text not null,
  role text not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  can_export boolean not null default false,
  can_approve boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.app_users add column if not exists user_id text;
alter table if exists public.app_users add column if not exists employee_id text;
alter table if exists public.app_users add column if not exists employee_name text;
alter table if exists public.app_users add column if not exists username text;
alter table if exists public.app_users add column if not exists role text default 'الموظف';
alter table if exists public.app_users add column if not exists branch text;
alter table if exists public.app_users add column if not exists is_active boolean default true;
alter table if exists public.app_users add column if not exists updated_at timestamptz default now();

create table if not exists public.approval_logs (
  id text primary key,
  module_name text not null,
  record_id text not null,
  action text not null,
  old_status text,
  new_status text,
  performed_by text,
  performed_at timestamptz not null default now(),
  notes text
);

create table if not exists public.notifications (
  id text primary key,
  user_id text,
  title text not null,
  message text,
  type text default 'info',
  is_read boolean not null default false,
  related_module text,
  related_record_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  user_id text,
  user_name text,
  action text not null,
  module_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

alter table if exists public.employee_guarantees add column if not exists approval_status text default 'مسودة';
alter table if exists public.employee_guarantees add column if not exists approved_by text;
alter table if exists public.employee_guarantees add column if not exists approved_at timestamptz;
alter table if exists public.employee_guarantees add column if not exists rejection_reason text;
alter table if exists public.employee_guarantees add column if not exists approval_notes text;

alter table if exists public.overtime_assignments add column if not exists approval_status text default 'مسودة';
alter table if exists public.overtime_assignments add column if not exists approved_by text;
alter table if exists public.overtime_assignments add column if not exists approved_at timestamptz;
alter table if exists public.overtime_assignments add column if not exists rejection_reason text;
alter table if exists public.overtime_assignments add column if not exists approval_notes text;

alter table if exists public.evaluations add column if not exists approval_status text default 'قيد المراجعة';
alter table if exists public.evaluations add column if not exists approved_by text;
alter table if exists public.evaluations add column if not exists approved_at timestamptz;
alter table if exists public.evaluations add column if not exists rejection_reason text;
alter table if exists public.evaluations add column if not exists approval_notes text;

create index if not exists idx_app_permissions_role on public.app_permissions(role);
create index if not exists idx_app_permissions_page_key on public.app_permissions(page_key);
create unique index if not exists idx_app_users_user_id_unique on public.app_users(user_id);
create index if not exists idx_approval_logs_module on public.approval_logs(module_name);
create index if not exists idx_approval_logs_record on public.approval_logs(record_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);
create index if not exists idx_audit_logs_module on public.audit_logs(module_name);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id);
create index if not exists idx_employee_guarantees_approval_status on public.employee_guarantees(approval_status);
create index if not exists idx_overtime_assignments_approval_status on public.overtime_assignments(approval_status);
create index if not exists idx_evaluations_approval_status on public.evaluations(approval_status);

notify pgrst, 'reload schema';
