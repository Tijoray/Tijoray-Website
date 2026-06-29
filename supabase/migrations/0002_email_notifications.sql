-- Migration: lifecycle email notifications
--
-- Adds the columns the email system keys off, plus an idempotent send log so a
-- retried cron run or a re-delivered database webhook can never send the same
-- customer the same email twice.
--
-- Run in the Supabase SQL editor (or `supabase db push`) BEFORE deploying the
-- email code. Idempotent and safe to re-run; no existing rows are modified
-- beyond the status backfill.

-- ── Pieces: lifecycle state ────────────────────────────────────────────────
alter table "Pieces"
  add column if not exists status          text not null default 'crafting',  -- crafting | shipped | delivered
  add column if not exists shipped_at       timestamptz,
  add column if not exists memory_deadline  timestamptz,   -- created_at + window; drives reminder cron
  add column if not exists first_viewed_at  timestamptz;   -- stamped by the mobile app on first recipient view

comment on column "Pieces".status is
  'Lifecycle: crafting | shipped | delivered. Flipping to "shipped" triggers the shipped email via a database webhook.';
comment on column "Pieces".memory_deadline is
  'When the memory-collection window closes (default created_at + 14 days). Used by the reminder cron.';
comment on column "Pieces".first_viewed_at is
  'Set ONCE by the recipient mobile app the first time memories are viewed. Triggers the "recipient viewed" email. NULL until the app integration lands.';

-- Every row that exists at migration time is a historical order — mark it
-- shipped so the new reminder cron never emails customers about past orders.
-- Rows created AFTER this migration default to 'crafting' and flow normally.
update "Pieces"
  set status = 'shipped'
  where created_at < now();

-- ── Email_Log: idempotency backbone ─────────────────────────────────────────
-- One row per (ref, type). `ref` is a free-form key: a piece id for per-piece
-- emails (reminders/shipped/linked/viewed) or a Stripe session id for the
-- per-order crafting email. The UNIQUE constraint is what makes sends exactly-once.
create table if not exists "Email_Log" (
  id         uuid primary key default gen_random_uuid(),
  ref        text not null,
  type       text not null,
  recipient  text,
  sent_at    timestamptz not null default now(),
  unique (ref, type)
);

comment on table "Email_Log" is
  'Exactly-once log of lifecycle emails. Senders claim a (ref,type) row before sending; a unique-violation means it was already sent and the send is skipped.';
