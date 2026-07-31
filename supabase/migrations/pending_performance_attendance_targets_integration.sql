-- Pending migration: performance, attendance, targets, and incentives integration
-- RLS is intentionally not enabled here.
create table if not exists performance_employee_targets (
 target_id text primary key, company_id text not null, period_month integer not null, period_year integer not null,
 employee_id text not null, employee_name text, branch text, department text, job_title text, operation_type text,
 service_channel text, target_count numeric default 0, minimum_count numeric default 0, excellent_count numeric default 0,
 target_weight numeric default 0, is_active boolean default true, notes text,
 created_at timestamptz default now(), updated_at timestamptz default now(),
 unique(company_id,period_month,period_year,employee_id,operation_type,service_channel)
);
create table if not exists performance_branch_targets (
 branch_target_id text primary key, company_id text not null, period_month integer not null, period_year integer not null,
 branch text not null, operation_type text, service_channel text, target_count numeric default 0, minimum_count numeric default 0,
 excellent_count numeric default 0, target_customers numeric default 0, attendance_compliance_target numeric default 0,
 is_active boolean default true, notes text, created_at timestamptz default now(), updated_at timestamptz default now(),
 unique(company_id,period_month,period_year,branch,operation_type,service_channel)
);
create table if not exists performance_attendance_kpi_rules (
 rule_id text primary key, company_id text not null unique, attendance_weight_percent numeric default 15,
 max_late_minutes_without_penalty integer default 0, late_penalty_per_occurrence numeric default 0,
 late_penalty_per_minute numeric default 0, absence_penalty numeric default 0, early_leave_penalty numeric default 0,
 approved_leave_neutral_enabled boolean default true, unauthorized_absence_exclusion_enabled boolean default false,
 max_absence_days_before_incentive_block integer default 0, max_late_occurrences_before_incentive_reduction integer default 0,
 overtime_bonus_enabled boolean default false, overtime_bonus_points numeric default 0,
 minimum_attendance_score_for_incentive numeric default 0, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists performance_incentive_exclusions (
 exclusion_id text primary key, company_id text not null, period_month integer not null, period_year integer not null,
 employee_id text not null, employee_name text, branch text, job_title text, action_type text not null,
 reduction_percent numeric default 0, deduction_amount numeric default 0, adjustment_amount numeric default 0,
 reason text not null, approved_by text, approval_status text default 'pending', notes text,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists performance_monthly_cycles (
 cycle_id text primary key, company_id text not null, period_month integer not null, period_year integer not null,
 status text default 'draft', opened_by text, approved_by text, notes text,
 created_at timestamptz default now(), updated_at timestamptz default now(), unique(company_id,period_month,period_year)
);
create table if not exists hr_attendance_daily_records (
 attendance_id text primary key, company_id text not null, employee_id text not null, employee_name text, branch text,
 department text, job_title text, attendance_date date not null, check_in_time text, check_out_time text,
 worked_minutes integer default 0, late_minutes integer default 0, early_leave_minutes integer default 0,
 absence_minutes integer default 0, overtime_minutes integer default 0, is_absent boolean default false,
 is_approved_leave boolean default false, is_permission boolean default false, is_rest_day boolean default false,
 status text, source text default 'manual', approval_status text default 'draft', raw_payload jsonb, notes text,
 created_at timestamptz default now(), updated_at timestamptz default now(), unique(company_id,employee_id,attendance_date)
);
create table if not exists performance_attendance_scores (
 score_id text primary key, company_id text not null, period_month integer not null, period_year integer not null,
 employee_id text not null, employee_name text, branch text, job_title text, total_work_days integer default 0,
 present_days integer default 0, absent_days integer default 0, approved_leave_days integer default 0,
 late_occurrences integer default 0, total_late_minutes integer default 0, early_leave_occurrences integer default 0,
 total_early_leave_minutes integer default 0, overtime_minutes integer default 0, attendance_score numeric default 0,
 max_score numeric default 100, calculated_at timestamptz default now(), notes text,
 created_at timestamptz default now(), updated_at timestamptz default now(), unique(company_id,period_month,period_year,employee_id)
);
create index if not exists idx_pet_company_period on performance_employee_targets(company_id,period_year,period_month);
create index if not exists idx_pet_company_employee on performance_employee_targets(company_id,employee_id);
create index if not exists idx_pbt_company_period on performance_branch_targets(company_id,period_year,period_month);
create index if not exists idx_pbt_company_branch on performance_branch_targets(company_id,branch);
create index if not exists idx_pie_company_period on performance_incentive_exclusions(company_id,period_year,period_month);
create index if not exists idx_har_company_date on hr_attendance_daily_records(company_id,attendance_date);
create index if not exists idx_har_company_employee on hr_attendance_daily_records(company_id,employee_id);
create index if not exists idx_pas_company_period on performance_attendance_scores(company_id,period_year,period_month);
create index if not exists idx_pas_company_employee on performance_attendance_scores(company_id,employee_id);
