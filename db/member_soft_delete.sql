alter table public.members
  add column if not exists is_active boolean not null default true;

alter table public.members
  add column if not exists deleted_at timestamptz;

update public.members
set is_active = true
where is_active is null;

create index if not exists members_is_active_idx
  on public.members (is_active);

alter table if exists public.products
  add column if not exists deleted_at timestamptz;

alter table if exists public.locations
  add column if not exists deleted_at timestamptz;

alter table if exists public.technician
  add column if not exists deleted_at timestamptz;

alter table if exists public.ai_record
  add column if not exists deleted_at timestamptz;

alter table if exists public.product_batch
  add column if not exists deleted_at timestamptz;

alter table if exists public.transactions
  add column if not exists deleted_at timestamptz;
