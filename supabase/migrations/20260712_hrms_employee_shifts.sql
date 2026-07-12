create table if not exists public.shift_types (
  shift_type_id text primary key,
  shift_name text not null,
  start_time text,
  end_time text,
  total_hours numeric default 0,
  break_minutes integer default 0,
  shift_period text default 'صباحي',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.used_shifts (
  used_shift_id text primary key,
  branch text not null,
  shift_type_id text,
  shift_name text,
  start_time text,
  end_time text,
  required_employees integer default 0,
  min_employees integer default 0,
  max_employees integer default 0,
  active_from date,
  active_to date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shift_scenarios (
  scenario_id text primary key,
  scenario_name text not null,
  branch text,
  scenario_type text default 'عادي',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shift_scenario_details (
  scenario_detail_id text primary key,
  scenario_id text not null references public.shift_scenarios(scenario_id) on delete cascade,
  shift_type_id text,
  shift_name text,
  start_time text,
  end_time text,
  required_employees integer default 0,
  notes text
);

create table if not exists public.employee_shift_assignments (
  assignment_id text primary key,
  assignment_date date not null,
  branch text,
  employee_id text not null,
  employee_name text,
  employee_phone text,
  job text,
  shift_type_id text,
  shift_name text,
  start_time text,
  end_time text,
  total_hours numeric default 0,
  status text default 'مجدول',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_shift_types_updated_at on public.shift_types;
create trigger set_shift_types_updated_at before update on public.shift_types for each row execute function public.set_updated_at();

drop trigger if exists set_used_shifts_updated_at on public.used_shifts;
create trigger set_used_shifts_updated_at before update on public.used_shifts for each row execute function public.set_updated_at();

drop trigger if exists set_shift_scenarios_updated_at on public.shift_scenarios;
create trigger set_shift_scenarios_updated_at before update on public.shift_scenarios for each row execute function public.set_updated_at();

drop trigger if exists set_employee_shift_assignments_updated_at on public.employee_shift_assignments;
create trigger set_employee_shift_assignments_updated_at before update on public.employee_shift_assignments for each row execute function public.set_updated_at();

create index if not exists idx_shift_types_shift_name on public.shift_types(shift_name);
create index if not exists idx_used_shifts_branch on public.used_shifts(branch);
create index if not exists idx_used_shifts_shift_type_id on public.used_shifts(shift_type_id);
create index if not exists idx_shift_scenarios_branch on public.shift_scenarios(branch);
create index if not exists idx_shift_scenarios_scenario_type on public.shift_scenarios(scenario_type);
create index if not exists idx_employee_shift_assignments_date on public.employee_shift_assignments(assignment_date);
create index if not exists idx_employee_shift_assignments_branch on public.employee_shift_assignments(branch);
create index if not exists idx_employee_shift_assignments_employee_id on public.employee_shift_assignments(employee_id);
create index if not exists idx_employee_shift_assignments_shift_type_id on public.employee_shift_assignments(shift_type_id);
create index if not exists idx_employee_shift_assignments_status on public.employee_shift_assignments(status);

notify pgrst, 'reload schema';
