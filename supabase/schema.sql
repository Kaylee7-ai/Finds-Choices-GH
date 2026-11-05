-- Finds & Choices GH: secure profiles and product catalogue
-- Applied to the connected Supabase project on 5 November 2026.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
grant select on public.profiles to authenticated;
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile" on public.profiles
for select to authenticated using ((select auth.uid()) = id);

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''), 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null default 'Other',
  retailer text not null default '',
  product_type text not null default 'affiliate' check (product_type in ('affiliate','resold','digital')),
  price numeric(12,2),
  compare_at_price numeric(12,2),
  currency text not null default 'GHS',
  image_url text not null default '',
  product_url text not null,
  status text not null default 'draft' check (status in ('active','draft','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_nonempty check (length(trim(name)) > 0),
  constraint products_url_https check (product_url ~ '^https://'),
  constraint products_image_https check (image_url = '' or image_url ~ '^https://'),
  constraint products_price_nonnegative check (price is null or price >= 0),
  constraint products_compare_price_nonnegative check (compare_at_price is null or compare_at_price >= 0)
);
create index if not exists products_status_category_idx on public.products(status, category);
alter table public.products enable row level security;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products" on public.products
for select to anon, authenticated using (status = 'active' or (select private.is_admin()));
drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products" on public.products
for insert to authenticated with check ((select private.is_admin()));
drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products" on public.products
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products" on public.products
for delete to authenticated using ((select private.is_admin()));

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute procedure public.set_updated_at();
