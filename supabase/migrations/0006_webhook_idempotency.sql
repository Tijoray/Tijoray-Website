-- Migration: Stripe webhook idempotency keys on Pieces
--
-- Stripe guarantees AT-LEAST-ONCE webhook delivery: it retries on any timeout,
-- network blip, or non-2xx response. The checkout webhook had no dedupe guard,
-- so every retry minted a fresh piece (new serial) for an order paid for once.
-- Observed in production 2026-08-24: one $799 session produced two Pieces four
-- seconds apart when Stripe's automatic retry raced a manual resend.
--
-- The key is (session, item index) rather than session alone. One session can
-- carry several cart items, and the handler must stay correct when a retry
-- follows a PARTIAL failure — item 0 inserted, item 1 errored. A session-level
-- guard would see item 0 present, conclude "already handled", and drop item 1
-- permanently. Keying per item lets each one dedupe independently.
--
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent.

-- ── Idempotency columns ─────────────────────────────────────────────────────
alter table "Pieces"
  add column if not exists stripe_session_id text,
  add column if not exists stripe_item_index int;

comment on column "Pieces".stripe_session_id is
  'Stripe Checkout Session id that created this piece. Idempotency key for the webhook.';
comment on column "Pieces".stripe_item_index is
  'Zero-based index of this piece within its Checkout Session cart (metadata item_N).';

-- Partial index: rows predating this migration have a NULL session id and must
-- not collide with each other on (null, null).
create unique index if not exists pieces_stripe_session_item_key
  on "Pieces" (stripe_session_id, stripe_item_index)
  where stripe_session_id is not null;

-- Lookup path for the handler's pre-insert existence check.
create index if not exists pieces_stripe_session_id_idx
  on "Pieces" (stripe_session_id)
  where stripe_session_id is not null;
