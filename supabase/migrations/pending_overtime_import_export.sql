-- Pending migration only. Do not execute automatically.
-- Supports overtime import/export if the current overtime tables are not already deployed.

create table if not exists public.overtime_assignments (
  assignment_id text primary key,
  company_id text not null,
  assignment_date date not null,
  branch text,
  location text,
  start_time time,
  end_time time,
  total_hours numeric default 0,
  reason text,
  notes text,
  approval_status text default 'مسودة',
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  approval_notes text,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.overtime_assignment_employees (
  id text primary key,
  company_id text not null,
  assignment_id text not null,
  employee_id text not null,
  employee_name text,
  employee_phone text,
  branch text,
  job text,
  status text default 'مكلف',
  whatsapp_message text,
  sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists overtime_assignments_company_date_idx on public.overtime_assignments(company_id, assignment_date);
create index if not exists overtime_assignment_employees_company_employee_idx on public.overtime_assignment_employees(company_id, employee_id);

notify pgrst, 'reload schema';
