-- Operational physical pledges module. No accounting entries or RLS policies are created.
create table if not exists public.pledge_customers (
 customer_id text primary key, company_id text not null, customer_name text not null,
 identity_type text, identity_number text, phone text, address text, risk_level text default 'عادي',
 notes text, is_active boolean default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.pledge_contracts (
 pledge_id text primary key, company_id text not null, pledge_no text not null, customer_id text not null,
 customer_name text, branch text, created_by text, approved_by text, pledge_date date not null, due_date date,
 status text default 'مسودة', requested_amount numeric default 0, approved_amount numeric default 0,
 total_fees numeric default 0, total_paid numeric default 0, remaining_amount numeric default 0,
 renewal_count integer default 0, notes text, approval_status text default 'غير معتمد',
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.pledge_assets (
 asset_id text primary key, company_id text not null, pledge_id text not null, asset_type text not null,
 asset_name text, asset_description text, serial_number text, gold_weight numeric, gold_karat text,
 quantity numeric default 1, condition_status text, ownership_proof text, estimated_market_value numeric default 0,
 accepted_pledge_value numeric default 0, financing_ratio numeric default 0, max_allowed_amount numeric default 0,
 storage_location_id text, vault_no text, shelf_no text, bag_no text, asset_status text default 'مستلم',
 notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.pledge_asset_valuations (
 valuation_id text primary key, company_id text not null, pledge_id text not null, asset_id text not null,
 evaluator_name text, valuation_date date not null, market_value numeric default 0, quick_sale_value numeric default 0,
 safety_discount_percent numeric default 0, accepted_value numeric default 0, financing_ratio numeric default 0,
 max_allowed_amount numeric default 0, gold_weight numeric, gold_karat text, gram_price numeric, risk_notes text,
 approval_status text default 'غير معتمد', approved_by text, notes text,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.pledge_payments (
 payment_id text primary key, company_id text not null, pledge_id text not null, payment_date date not null,
 payment_type text not null, amount numeric not null default 0, payment_method text, received_by text, notes text,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.pledge_fees (
 fee_id text primary key, company_id text not null, pledge_id text not null, fee_type text not null,
 fee_amount numeric default 0, fee_date date, is_paid boolean default false, notes text,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.pledge_storage_locations (
 location_id text primary key, company_id text not null, branch text, vault_no text, shelf_no text, bag_no text,
 location_description text, is_active boolean default true, notes text,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.pledge_status_logs (
 log_id text primary key, company_id text not null, pledge_id text not null, old_status text, new_status text,
 action_by text, action_at timestamptz default now(), reason text, notes text
);
create table if not exists public.pledge_documents (
 document_id text primary key, company_id text not null, pledge_id text, customer_id text, asset_id text,
 document_type text, document_name text, document_url text, notes text, created_at timestamptz default now()
);
create table if not exists public.pledge_notifications (
 notification_id text primary key, company_id text not null, pledge_id text not null, customer_id text,
 notification_type text, notification_date date, message text, status text default 'غير مرسل', sent_at timestamptz,
 notes text, created_at timestamptz default now()
);
create table if not exists public.pledge_disposals (
 disposal_id text primary key, company_id text not null, pledge_id text not null, asset_id text, disposal_date date,
 approved_by text, sale_value numeric default 0, buyer_name text, disposal_status text default 'مسودة',
 reason text, notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.pledge_audit_logs (
 audit_id text primary key, company_id text not null, entity_name text not null, entity_id text not null,
 action_type text not null, old_data jsonb, new_data jsonb, action_by text, action_at timestamptz default now(),
 reason text, notes text
);
create table if not exists public.pledge_settings (
 setting_id text primary key, company_id text not null, asset_type text not null,
 max_financing_ratio numeric default 70, default_pledge_days integer default 30, max_renewal_count integer default 2,
 reminder_days_before_due integer default 3, default_storage_fee numeric default 0,
 default_valuation_fee numeric default 0, default_admin_fee numeric default 0,
 liquidation_after_delay_days integer default 15, require_manager_approval boolean default true,
 is_active boolean default true, notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);

create index if not exists idx_pledge_customers_company on public.pledge_customers(company_id);
create index if not exists idx_pledge_customers_identity on public.pledge_customers(company_id, identity_number);
create index if not exists idx_pledge_contracts_company on public.pledge_contracts(company_id);
create index if not exists idx_pledge_contracts_customer on public.pledge_contracts(company_id, customer_id);
create index if not exists idx_pledge_contracts_due on public.pledge_contracts(company_id, due_date);
create index if not exists idx_pledge_contracts_status on public.pledge_contracts(company_id, status);
create index if not exists idx_pledge_contracts_branch on public.pledge_contracts(company_id, branch);
create index if not exists idx_pledge_assets_company on public.pledge_assets(company_id);
create index if not exists idx_pledge_assets_pledge on public.pledge_assets(company_id, pledge_id);
create index if not exists idx_pledge_assets_type on public.pledge_assets(company_id, asset_type);
create index if not exists idx_pledge_valuations_pledge on public.pledge_asset_valuations(company_id, pledge_id);
create index if not exists idx_pledge_payments_pledge on public.pledge_payments(company_id, pledge_id);
create index if not exists idx_pledge_fees_pledge on public.pledge_fees(company_id, pledge_id);
create index if not exists idx_pledge_storage_company on public.pledge_storage_locations(company_id);
create index if not exists idx_pledge_status_logs_pledge on public.pledge_status_logs(company_id, pledge_id);
create index if not exists idx_pledge_documents_pledge on public.pledge_documents(company_id, pledge_id);
create index if not exists idx_pledge_notifications_pledge on public.pledge_notifications(company_id, pledge_id);
create index if not exists idx_pledge_notifications_date on public.pledge_notifications(company_id, notification_date);
create index if not exists idx_pledge_disposals_pledge on public.pledge_disposals(company_id, pledge_id);
create index if not exists idx_pledge_settings_type on public.pledge_settings(company_id, asset_type);
