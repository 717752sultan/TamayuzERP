-- Pending migration only. Do not execute automatically.
-- Extends fixed assets import/export and depreciation metadata safely.

alter table if exists public.fixed_assets
add column if not exists invoice_number text,
add column if not exists depreciation_start_date date,
add column if not exists salvage_value numeric,
add column if not exists total_production_units numeric default 0;

alter table if exists public.fixed_asset_maintenance
add column if not exists provider text;

create index if not exists fixed_assets_company_code_idx
on public.fixed_assets(company_id, asset_code);

create index if not exists fixed_asset_maintenance_company_date_idx
on public.fixed_asset_maintenance(company_id, maintenance_date);

notify pgrst, 'reload schema';
