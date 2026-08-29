-- Migration: address column + profile sync on UPDATE
--
-- ⚠️  SUPERSEDED — DO NOT EDIT handle_new_auth_user() HERE.
-- This function is now owned by the mobile-app repo, whose migrations
-- 20260824020000_sync_verified_phone.sql and 20260828000000_web_contact_phone.sql
-- are its current definition. Two repos independently rewriting one function is
-- exactly what opened the phone hole that 20260824020000 was written to close,
-- so this file is kept for history only. Change it there, not here.
--
-- The behaviour below is out of date in one way that matters: the phone
-- coalesce at line ~49 no longer exists. A number from raw_user_meta_data now
-- lands in Users.contact_phone (unverified contact detail); Users.phone_number
-- holds only an SMS-confirmed number taken from auth.users.phone.
--
-- The "Users" table mirrors auth.users via handle_new_auth_user(), but the
-- trigger only fired AFTER INSERT, so anything a user added AFTER signup
-- (phone/address via the profile-completion gate or Settings) never reached
-- this table — which is why phone_number is mostly NULL.
--
-- This migration:
--   1. Adds a structured `address` (jsonb) column.
--   2. Rewrites the sync function as an upsert (keeps the original name/phone
--      fallbacks; adds address).
--   3. Fires the sync on INSERT *and* on the relevant UPDATEs.
--   4. Backfills existing rows from current auth metadata.
--
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent.

-- ── 1. Address column ───────────────────────────────────────────────────────
alter table public."Users"
  add column if not exists address jsonb;

comment on column public."Users".address is
  'Structured shipping address synced from auth.users raw_user_meta_data->address '
  '(captured by the web profile-completion flow). Shape: '
  '{ formatted, line, unit, city, state, postcode, country, lat, lon }.';

-- ── 2. Sync function — upsert, address-aware ────────────────────────────────
create or replace function public.handle_new_auth_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $function$
begin
  insert into public."Users" (id, name, email, phone_number, address, created_at)
  values (
    new.id,
    -- Users.name is NOT NULL — fall through metadata, then email, then a placeholder
    coalesce(
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      new.email,
      'Member'
    ),
    new.email,
    -- Phone can come from three places depending on the sign-in method
    coalesce(
      new.phone,
      nullif(new.raw_user_meta_data->>'phone', ''),
      nullif(new.raw_user_meta_data->>'phone_number', '')
    ),
    -- Structured address object written by the web app (may be absent)
    new.raw_user_meta_data->'address',
    now()
  )
  on conflict (id) do update set
    name         = coalesce(excluded.name, public."Users".name),
    email        = excluded.email,
    -- Don't blank an existing phone/address if a later update lacks one
    phone_number = coalesce(excluded.phone_number, public."Users".phone_number),
    address      = coalesce(excluded.address, public."Users".address);

  return new;
end;
$function$;

-- ── 3. Triggers — insert + meaningful updates ───────────────────────────────
-- Keep the original INSERT trigger.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- New: sync on UPDATE, but only when synced fields actually change — so the
-- per-login writes to auth.users (last_sign_in_at, tokens, …) don't fire it.
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row
  when (
    old.email             is distinct from new.email
    or old.phone          is distinct from new.phone
    or old.raw_user_meta_data is distinct from new.raw_user_meta_data
  )
  execute function public.handle_new_auth_user();

-- ── 4. Backfill existing rows from current auth metadata ────────────────────
update public."Users" u
set
  phone_number = coalesce(
    u.phone_number,
    a.phone,
    nullif(a.raw_user_meta_data->>'phone', ''),
    nullif(a.raw_user_meta_data->>'phone_number', '')
  ),
  address = coalesce(u.address, a.raw_user_meta_data->'address')
from auth.users a
where a.id = u.id;
