create table if not exists public.inventory_settings (
  setting_id text primary key,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  setting_group text default 'inventory',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_document_numbering (
  numbering_id text primary key,
  document_type text not null,
  document_label text,
  prefix text,
  next_number integer default 1,
  reset_yearly boolean default true,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.inventory_branch_settings (
  branch_setting_id text primary key,
  branch text not null,
  allowed_to_request_items boolean default true,
  allowed_to_receive_items boolean default true,
  max_monthly_issue_limit numeric default 0,
  default_receiver text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.notifications (
  notification_id text primary key,
  title text not null,
  message text,
  notification_type text,
  module_name text,
  record_id text,
  record_number text,
  target_role text,
  target_user_id text,
  branch text,
  priority text default 'عادي',
  is_read boolean default false,
  read_at timestamptz,
  created_by text,
  created_at timestamptz default now()
);

alter table if exists public.notifications add column if not exists notification_id text;
alter table if exists public.notifications add column if not exists notification_type text;
alter table if exists public.notifications add column if not exists module_name text;
alter table if exists public.notifications add column if not exists record_id text;
alter table if exists public.notifications add column if not exists record_number text;
alter table if exists public.notifications add column if not exists target_role text;
alter table if exists public.notifications add column if not exists target_user_id text;
alter table if exists public.notifications add column if not exists branch text;
alter table if exists public.notifications add column if not exists priority text default 'عادي';
alter table if exists public.notifications add column if not exists read_at timestamptz;
alter table if exists public.notifications add column if not exists created_by text;

create table if not exists public.ai_chat_sessions (
  session_id text primary key,
  user_id text,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ai_chat_messages (
  message_id text primary key,
  session_id text,
  user_id text,
  role text,
  message text,
  context jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.performance_job_templates (
  template_id text primary key,
  job_name text not null,
  department text,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.performance_kpi_criteria (
  criterion_id text primary key,
  template_id text,
  job_name text,
  criterion_name text not null,
  criterion_description text,
  weight numeric default 0,
  max_score numeric default 100,
  scoring_type text default 'يدوي',
  target_value numeric default 0,
  excellent_threshold numeric default 0,
  good_threshold numeric default 0,
  acceptable_threshold numeric default 0,
  weak_threshold numeric default 0,
  data_source text,
  affects_incentive boolean default true,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.performance_kpi_scores (
  score_id text primary key,
  employee_id text,
  employee_name text,
  job_name text,
  branch text,
  month text,
  criterion_id text,
  criterion_name text,
  actual_value numeric default 0,
  target_value numeric default 0,
  score numeric default 0,
  weighted_score numeric default 0,
  source_module text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.daily_operations (
  operation_id text primary key,
  operation_date date not null,
  month text,
  branch text,
  employee_id text,
  employee_name text,
  job_name text,
  operation_type text,
  service_channel text,
  currency text,
  operation_count numeric default 0,
  amount numeric default 0,
  error_count numeric default 0,
  returned_count numeric default 0,
  completed_count numeric default 0,
  pending_count numeric default 0,
  customer_complaints numeric default 0,
  notes text,
  entered_by text,
  approved_by text,
  status text default 'مسودة',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table if exists public.app_permissions add column if not exists can_print boolean default false;
alter table if exists public.app_permissions add column if not exists can_configure boolean default false;
alter table if exists public.app_permissions add column if not exists can_override boolean default false;
alter table if exists public.app_permissions add column if not exists can_mark_read boolean default false;
alter table if exists public.app_permissions add column if not exists can_ask boolean default false;
alter table if exists public.app_permissions add column if not exists can_view_all_data boolean default false;
alter table if exists public.app_permissions add column if not exists can_export_chat boolean default false;

create index if not exists idx_inventory_settings_key on public.inventory_settings(setting_key);
create index if not exists idx_inventory_numbering_type on public.inventory_document_numbering(document_type);
create index if not exists idx_inventory_branch_settings_branch on public.inventory_branch_settings(branch);
create index if not exists idx_notifications_read on public.notifications(is_read, created_at);
create index if not exists idx_notifications_target_role on public.notifications(target_role);
create unique index if not exists idx_notifications_notification_id_unique on public.notifications(notification_id) where notification_id is not null;
create index if not exists idx_ai_messages_session on public.ai_chat_messages(session_id, created_at);
create index if not exists idx_kpi_criteria_job on public.performance_kpi_criteria(job_name);
create index if not exists idx_kpi_scores_employee_month on public.performance_kpi_scores(employee_id, month);
create index if not exists idx_daily_operations_date on public.daily_operations(operation_date);
create index if not exists idx_daily_operations_month on public.daily_operations(month);
create index if not exists idx_daily_operations_branch on public.daily_operations(branch);
create index if not exists idx_daily_operations_employee on public.daily_operations(employee_id);
create index if not exists idx_daily_operations_job on public.daily_operations(job_name);
create index if not exists idx_daily_operations_type on public.daily_operations(operation_type);
create index if not exists idx_daily_operations_status on public.daily_operations(status);

insert into public.inventory_settings (setting_id, setting_key, setting_group, setting_value)
values ('INV-SET-GENERAL', 'general', 'inventory', '{"general":{"main_warehouse_name":"المخزن الرئيسي","multi_warehouses":false,"allow_negative_stock":false,"valuation_method":"متوسط التكلفة","enable_reorder_point":true}}'::jsonb)
on conflict (setting_id) do nothing;

insert into public.inventory_document_numbering (numbering_id, document_type, document_label, prefix, next_number, reset_yearly)
values
('NUM-purchase_requests','purchase_requests','طلب شراء','PR',1,true),
('NUM-purchase_orders','purchase_orders','أمر شراء','PO',1,true),
('NUM-receipts','receipts','إذن استلام','RCV',1,true),
('NUM-invoices','invoices','فاتورة شراء','INV',1,true),
('NUM-issues','issues','سند صرف','ISS',1,true),
('NUM-returns','returns','سند إرجاع','RET',1,true),
('NUM-transfers','transfers','سند تحويل','TRF',1,true),
('NUM-adjustments','adjustments','تسوية','ADJ',1,true),
('NUM-stocktakes','stocktakes','جرد','STK',1,true)
on conflict (numbering_id) do nothing;

insert into public.app_permissions (id, page_key, role, can_view, can_create, can_edit, can_delete, can_export, can_approve, can_print, can_configure, can_override, can_mark_read, can_ask, can_view_all_data, can_export_chat)
select role || '-' || page_key, page_key, role, true,
  case when role in ('مدير النظام','الموارد البشرية') then true else false end,
  case when role in ('مدير النظام','الموارد البشرية') then true else false end,
  case when role = 'مدير النظام' then true else false end,
  true,
  case when role in ('مدير النظام','الموارد البشرية','الإدارة العليا') then true else false end,
  true,
  case when role = 'مدير النظام' then true else false end,
  case when role = 'مدير النظام' then true else false end,
  true,
  true,
  case when role in ('مدير النظام','الإدارة العليا') then true else false end,
  true
from (values
  ('inventory_settings'),('notifications'),('ai_assistant'),('performance_criteria'),('daily_operations'),('daily_operations_approval'),('performance_kpi_scores')
) as pages(page_key)
cross join (values
  ('مدير النظام'),('الموارد البشرية'),('مسؤول المخزون'),('مدير فرع'),('الإدارة العليا'),('الموظف')
) as roles(role)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
