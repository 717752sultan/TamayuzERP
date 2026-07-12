alter table if exists public.shift_types add column if not exists shift_mode text default 'ثابت';
alter table if exists public.shift_types add column if not exists flexible_start_from time;
alter table if exists public.shift_types add column if not exists flexible_end_until time;
alter table if exists public.shift_types add column if not exists required_hours numeric default 0;

create table if not exists public.shift_type_periods (
  period_id text primary key,
  shift_type_id text not null,
  period_name text not null,
  start_time text not null,
  end_time text not null,
  total_hours numeric default 0,
  sort_order integer default 1,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.employee_shift_assignments add column if not exists shift_mode text;
alter table if exists public.employee_shift_assignments add column if not exists shift_periods jsonb;

create index if not exists idx_shift_type_periods_shift_type_id on public.shift_type_periods(shift_type_id);
create index if not exists idx_shift_type_periods_sort_order on public.shift_type_periods(sort_order);
create index if not exists idx_shift_types_shift_mode on public.shift_types(shift_mode);

insert into public.shift_scenarios (scenario_id, scenario_name, branch, scenario_type, description, is_active)
values
('DEFAULT-NORMAL-BRANCHES', 'السيناريو العادي للفروع', 'كل الفروع', 'عادي', 'يستخدم للفروع ذات الدوام الاعتيادي.', true),
('DEFAULT-TWO-PERIODS', 'سيناريو الدوام الكامل على فترتين', 'كل الفروع', 'عادي', 'يستخدم للفروع أو الإدارة التي تعمل على فترتين.', true),
('DEFAULT-FRIDAY', 'سيناريو الجمعة', 'كل الفروع', 'جمعة', 'يستخدم لتغطية العمل يوم الجمعة بعدد أقل من الموظفين.', true),
('DEFAULT-RAMADAN', 'سيناريو رمضان', 'كل الفروع', 'رمضان', 'يستخدم في شهر رمضان بفترات مختصرة.', true),
('DEFAULT-CUSTOMER-03', 'سيناريو خدمة العملاء حتى 03:00', 'كل الفروع', 'مخصص', 'يستخدم لخدمة العملاء والواتساب عند الحاجة لتغطية متأخرة.', true)
on conflict (scenario_id) do nothing;

insert into public.shift_scenario_details
(scenario_detail_id, scenario_id, shift_type_id, shift_name, start_time, end_time, required_employees, notes)
values
('DEFAULT-NORMAL-MORNING', 'DEFAULT-NORMAL-BRANCHES', 'DEFAULT-MORNING', 'صباحي', '08:00', '15:00', 2, ''),
('DEFAULT-NORMAL-EVENING', 'DEFAULT-NORMAL-BRANCHES', 'DEFAULT-EVENING', 'مسائي', '15:00', '23:00', 2, ''),
('DEFAULT-TWO-PERIODS-FULL', 'DEFAULT-TWO-PERIODS', 'DEFAULT-FULL-TWO-PERIODS', 'دوام كامل على فترتين', '08:00', '21:00', 2, '08:00-12:00 / 15:00-21:00'),
('DEFAULT-FRIDAY-SHIFT', 'DEFAULT-FRIDAY', 'DEFAULT-FRIDAY-SHIFT', 'فترة الجمعة', '15:00', '21:00', 1, ''),
('DEFAULT-RAMADAN-BEFORE', 'DEFAULT-RAMADAN', 'DEFAULT-RAMADAN-BEFORE', 'فترة قبل الإفطار', '13:00', '17:00', 2, ''),
('DEFAULT-RAMADAN-AFTER', 'DEFAULT-RAMADAN', 'DEFAULT-RAMADAN-AFTER', 'فترة بعد الإفطار', '20:00', '01:00', 2, ''),
('DEFAULT-CUSTOMER-MORNING', 'DEFAULT-CUSTOMER-03', 'DEFAULT-MORNING', 'صباحي', '08:00', '15:00', 2, ''),
('DEFAULT-CUSTOMER-EVENING', 'DEFAULT-CUSTOMER-03', 'DEFAULT-EVENING', 'مسائي', '15:00', '23:00', 2, ''),
('DEFAULT-CUSTOMER-NIGHT', 'DEFAULT-CUSTOMER-03', 'DEFAULT-NIGHT', 'ليلي', '23:00', '03:00', 1, '')
on conflict (scenario_detail_id) do nothing;

notify pgrst, 'reload schema';
