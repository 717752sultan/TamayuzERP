create table if not exists public.performance_incentive_proposals (
  proposal_id text primary key,
  company_id text not null,
  title text not null,
  subtitle text,
  proposal_status text default 'مسودة',
  approval_status text default 'غير معتمد',
  is_default boolean default false,
  version_no integer default 1,
  content jsonb not null,
  created_by text,
  updated_by text,
  approved_by text,
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_performance_incentive_proposals_company_id
on public.performance_incentive_proposals (company_id);

create index if not exists idx_performance_incentive_proposals_is_default
on public.performance_incentive_proposals (is_default);

create index if not exists idx_performance_incentive_proposals_proposal_status
on public.performance_incentive_proposals (proposal_status);

create index if not exists idx_performance_incentive_proposals_approval_status
on public.performance_incentive_proposals (approval_status);

notify pgrst, 'reload schema';
