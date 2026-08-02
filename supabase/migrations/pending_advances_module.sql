-- وحدة إدارة السلف التشغيلية فقط - لا تنشئ قيودًا محاسبية
create table if not exists public.advance_parties (
 party_id text primary key, company_id text not null, party_type text not null default 'موظف', party_name text not null,
 employee_id text, customer_id text, supplier_id text, branch text, department text, job_title text, phone text,
 identity_number text, address text, monthly_salary numeric default 0, risk_level text default 'عادي',
 is_active boolean default true, notes text, created_at timestamptz default now(), updated_at timestamptz default now(),
 check (party_type in ('موظف','عميل','مورد','أخرى')), check (risk_level in ('عادي','متوسط','مرتفع'))
);
create table if not exists public.advances (
 advance_id text primary key, company_id text not null, advance_no text not null, party_id text not null,
 party_type text, party_name text, branch text, department text, request_date date not null, approval_date date,
 disbursement_date date, first_installment_date date, advance_type text not null default 'سلفة موظف',
 request_amount numeric default 0, approved_amount numeric default 0, disbursed_amount numeric default 0,
 total_paid numeric default 0, remaining_amount numeric default 0, installment_count integer default 1,
 installment_amount numeric default 0, repayment_method text default 'أقساط', reason text, guarantee_type text,
 guarantee_description text, guarantee_value numeric default 0, status text default 'مسودة',
 approval_status text default 'غير معتمد', approved_by text, disbursed_by text, created_by text, notes text,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.advance_installments (
 installment_id text primary key, company_id text not null, advance_id text not null, installment_no integer not null,
 due_date date not null, installment_amount numeric default 0, paid_amount numeric default 0, remaining_amount numeric default 0,
 payment_date date, status text default 'غير مستحق', notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.advance_payments (
 payment_id text primary key, company_id text not null, advance_id text not null, installment_id text,
 payment_date date not null, amount numeric not null default 0, payment_method text, received_by text, notes text,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.advance_approvals (
 approval_id text primary key, company_id text not null, advance_id text not null, approval_level text,
 approver_name text, approval_status text default 'بانتظار الاعتماد', approval_date date, rejection_reason text,
 notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.advance_notifications (
 notification_id text primary key, company_id text not null, advance_id text not null, installment_id text, party_id text,
 notification_type text, notification_date date, message text, status text default 'غير مرسل', sent_at timestamptz,
 notes text, created_at timestamptz default now()
);
create table if not exists public.advance_documents (
 document_id text primary key, company_id text not null, advance_id text, party_id text, document_type text,
 document_name text, document_url text, notes text, created_at timestamptz default now()
);
create table if not exists public.advance_status_logs (
 log_id text primary key, company_id text not null, advance_id text not null, old_status text, new_status text,
 action_by text, action_at timestamptz default now(), reason text, notes text
);
create table if not exists public.advance_audit_logs (
 audit_id text primary key, company_id text not null, entity_name text not null, entity_id text not null,
 action_type text not null, old_data jsonb, new_data jsonb, action_by text, action_at timestamptz default now(),
 reason text, notes text
);
create table if not exists public.advance_settings (
 setting_id text primary key, company_id text not null, party_type text not null default 'موظف',
 advance_type text not null default 'سلفة موظف', max_amount numeric default 0, max_salary_percent numeric default 50,
 max_active_advances integer default 1, max_installment_count integer default 6, default_installment_count integer default 1,
 reminder_days_before_due integer default 3, block_if_overdue boolean default true,
 require_manager_approval boolean default true, require_hr_approval boolean default true,
 require_general_manager_approval boolean default false, minimum_service_months integer default 0,
 allow_partial_payment boolean default true, allow_rescheduling boolean default false, is_active boolean default true,
 notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create index if not exists advance_parties_company_idx on public.advance_parties(company_id);
create index if not exists advance_parties_type_idx on public.advance_parties(party_type);
create index if not exists advances_company_idx on public.advances(company_id);
create index if not exists advances_party_idx on public.advances(party_id);
create index if not exists advances_status_idx on public.advances(status);
create index if not exists advances_approval_idx on public.advances(approval_status);
create index if not exists advances_branch_idx on public.advances(branch);
create index if not exists advances_type_idx on public.advances(advance_type);
create index if not exists advance_installments_company_idx on public.advance_installments(company_id);
create index if not exists advance_installments_advance_idx on public.advance_installments(advance_id);
create index if not exists advance_installments_due_idx on public.advance_installments(due_date);
create index if not exists advance_payments_company_idx on public.advance_payments(company_id);
create index if not exists advance_payments_advance_idx on public.advance_payments(advance_id);
create index if not exists advance_approvals_advance_idx on public.advance_approvals(advance_id);
create index if not exists advance_notifications_advance_idx on public.advance_notifications(advance_id);
create index if not exists advance_status_logs_advance_idx on public.advance_status_logs(advance_id);
create index if not exists advance_settings_company_idx on public.advance_settings(company_id);
