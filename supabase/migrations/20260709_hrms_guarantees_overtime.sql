create table if not exists public.employee_guarantees (
  guarantee_id text primary key,
  employee_id text not null,
  employee_name text,
  branch text,
  job text,
  guarantor_name text not null,
  guarantor_id_number text not null,
  guarantor_phone text,
  commercial_shop_name text,
  commercial_shop_location text,
  commercial_register_number text not null,
  guarantee_date date not null,
  guarantee_expiry_date date,
  guarantee_status text not null default 'سارية',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.overtime_assignments (
  assignment_id text primary key,
  assignment_date date not null,
  branch text,
  location text,
  start_time text,
  end_time text,
  reason text,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.overtime_assignment_employees (
  id text primary key,
  assignment_id text not null references public.overtime_assignments(assignment_id) on delete cascade,
  employee_id text not null,
  employee_name text,
  employee_phone text,
  branch text,
  job text,
  status text not null default 'مكلف',
  whatsapp_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_employee_guarantees_updated_at on public.employee_guarantees;
create trigger set_employee_guarantees_updated_at
before update on public.employee_guarantees
for each row execute function public.set_updated_at();

drop trigger if exists set_overtime_assignments_updated_at on public.overtime_assignments;
create trigger set_overtime_assignments_updated_at
before update on public.overtime_assignments
for each row execute function public.set_updated_at();

create index if not exists idx_employee_guarantees_employee_id on public.employee_guarantees(employee_id);
create index if not exists idx_employee_guarantees_branch on public.employee_guarantees(branch);
create index if not exists idx_employee_guarantees_status on public.employee_guarantees(guarantee_status);
create index if not exists idx_employee_guarantees_date on public.employee_guarantees(guarantee_date);
create index if not exists idx_overtime_assignments_date on public.overtime_assignments(assignment_date);
create index if not exists idx_overtime_assignments_branch on public.overtime_assignments(branch);
create index if not exists idx_overtime_assignment_employees_assignment_id on public.overtime_assignment_employees(assignment_id);
create index if not exists idx_overtime_assignment_employees_employee_id on public.overtime_assignment_employees(employee_id);
create index if not exists idx_overtime_assignment_employees_branch on public.overtime_assignment_employees(branch);
