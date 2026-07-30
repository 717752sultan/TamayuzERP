-- Pending migration only. Do not execute automatically.
-- Adds optional import/export fields to existing inventory_items without deleting data.

alter table if exists public.inventory_items
add column if not exists barcode text,
add column if not exists sale_price numeric default 0,
add column if not exists warehouse text;

create unique index if not exists inventory_items_company_item_code_idx
on public.inventory_items(company_id, item_code);

notify pgrst, 'reload schema';
