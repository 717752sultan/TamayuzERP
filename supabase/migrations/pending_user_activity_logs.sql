-- PENDING REVIEW ONLY — DO NOT EXECUTE AUTOMATICALLY.
-- This table intentionally has no RLS in this phase, per the approved task scope.

create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id text,
  user_id uuid,
  username text,
  user_name text,
  user_role text,
  module_key text,
  module_name text,
  page_key text,
  page_name text,
  action_type text not null,
  action_label text,
  description text,
  entity_type text,
  entity_id text,
  severity text default 'منخفض',
  metadata jsonb default '{}'::jsonb,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_user_activity_logs_company_id
on public.user_activity_logs (company_id);

create index if not exists idx_user_activity_logs_user_id
on public.user_activity_logs (user_id);

create index if not exists idx_user_activity_logs_action_type
on public.user_activity_logs (action_type);

create index if not exists idx_user_activity_logs_created_at
on public.user_activity_logs (created_at desc);

notify pgrst, 'reload schema';
