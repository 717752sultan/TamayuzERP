-- Migration for HR letters and reports center tables
-- This migration adds the HR document templates, documents, and archive tables.

CREATE TABLE IF NOT EXISTS public.hr_document_templates (
  template_id text PRIMARY KEY,
  company_id text NOT NULL,
  template_type text NOT NULL,
  template_name text NOT NULL,
  subject text,
  body text NOT NULL,
  footer text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_documents (
  document_id text PRIMARY KEY,
  company_id text NOT NULL,
  document_no text,
  document_type text NOT NULL,
  document_title text NOT NULL,
  company_name text,
  employee_id text,
  employee_name text,
  branch text,
  department text,
  job_title text,
  document_date date DEFAULT current_date,
  subject text,
  body text,
  status text DEFAULT 'مسودة',
  approval_status text DEFAULT 'غير معتمد',
  requested_by text,
  approved_by text,
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hr_document_archive (
  archive_id text PRIMARY KEY,
  company_id text NOT NULL,
  document_id text,
  document_type text,
  employee_id text,
  employee_name text,
  archive_title text,
  archive_status text DEFAULT 'مؤرشف',
  file_url text,
  body_snapshot text,
  header_snapshot text,
  footer_snapshot text,
  notes text,
  created_at timestamptz DEFAULT now()
);
