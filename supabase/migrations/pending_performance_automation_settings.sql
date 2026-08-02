create table if not exists public.performance_automation_settings (
 setting_id text primary key, company_id text not null, period_month integer, period_year integer,
 min_daily_operations numeric default 0, target_daily_operations numeric default 0, excellent_daily_operations numeric default 0,
 min_monthly_operations numeric default 0, target_monthly_operations numeric default 0, excellent_monthly_operations numeric default 0,
 max_productivity_score numeric default 100, productivity_weight numeric default 50, quality_weight numeric default 20,
 attendance_weight numeric default 15, behavior_weight numeric default 10, compliance_weight numeric default 5,
 minimum_kpi_for_incentive numeric default 70, minimum_attendance_for_incentive numeric default 70,
 exclude_if_absent_days_more_than integer default 0, exclude_if_has_major_violation boolean default true,
 include_only_approved_operations boolean default true, auto_calculate_after_approval boolean default true,
 auto_update_employee_of_month boolean default true, auto_generate_incentive_preview boolean default true,
 is_active boolean default true, notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists performance_automation_settings_company_idx on public.performance_automation_settings(company_id);
create index if not exists performance_automation_settings_period_idx on public.performance_automation_settings(company_id,period_year,period_month);
