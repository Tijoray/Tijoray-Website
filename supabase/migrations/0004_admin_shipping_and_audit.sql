-- Migration: shipping/tracking fields + admin audit log
--
-- Backs the operational admin panel (/admin). Two things the DB is missing:
--
--   1. Carrier + tracking columns on Pieces. `shipped_at` and `hardware_id`
--      already exist; this adds where-it-is-in-transit fields so the fulfilment
--      screen can record a shipment and surface tracking to support.
--   2. Admin_Audit — an append-only log of every mutating admin action (status
--      flips, tag assignment, manual email resends, refunds). Non-negotiable for
--      a panel that can trigger emails and view private customer memories.
--
-- Admin IDENTITY is intentionally NOT a DB flag: the admin API gates on an
-- ADMIN_EMAILS env allowlist checked server-side, so a compromised/edited DB row
-- can never grant admin. Nothing to add here for that.
--
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent.

-- ── 1. Shipping / tracking on Pieces ────────────────────────────────────────
alter table "Pieces"
  add column if not exists carrier         text,   -- e.g. 'usps' | 'ups' | 'fedex' | 'dhl'
  add column if not exists tracking_number text,
  add column if not exists tracking_url    text;

comment on column "Pieces".carrier is
  'Shipping carrier key, set by the admin panel when a piece is marked shipped.';
comment on column "Pieces".tracking_number is
  'Carrier tracking number, set alongside status → shipped in the admin panel.';
comment on column "Pieces".tracking_url is
  'Optional full tracking URL; falls back to a carrier-derived link in the UI.';

-- ── 2. Admin_Audit — append-only action log ─────────────────────────────────
create table if not exists "Admin_Audit" (
  id          uuid primary key default gen_random_uuid(),
  actor_email text not null,          -- admin who performed the action (from the allowlist)
  actor_id    uuid,                   -- their auth.users id, when resolvable
  action      text not null,          -- e.g. 'piece.update_status' | 'piece.assign_hardware' | 'email.resend'
  entity_type text,                   -- 'piece' | 'customer' | 'email' | …
  entity_id   text,                   -- id of the affected row (text: pieces are uuid, email refs are free-form)
  before      jsonb,                  -- relevant prior state
  after       jsonb,                  -- relevant new state
  meta        jsonb,                  -- anything else worth keeping (ip, notes)
  created_at  timestamptz not null default now()
);

create index if not exists admin_audit_created_idx on "Admin_Audit" (created_at desc);
create index if not exists admin_audit_entity_idx  on "Admin_Audit" (entity_type, entity_id);

comment on table "Admin_Audit" is
  'Append-only log of every mutating admin-panel action. Written by the service-role admin API only; never exposed to the anon client.';
