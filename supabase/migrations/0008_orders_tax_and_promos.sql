-- Migration: Orders (money + tax of record) and Promo_Codes (the issuance ledger)
--
-- Two gaps this closes, both of which only matter once real money moves.
--
-- 1. NOTHING recorded what a customer was actually charged. Pieces stores the
--    configuration, not the payment, so "estimated revenue" in the admin panel
--    was literally re-derived from each piece's metal — an estimate that can
--    never match the bank, and that knows nothing at all about tax. Once tax is
--    being COLLECTED, that is not merely imprecise, it is a filing problem: a
--    remittance return asks how much tax you collected in each jurisdiction over
--    a period, and the only place that answer existed was inside Stripe's
--    dashboard. Orders is our own copy of that answer, written once per paid
--    session, keyed so a webhook redelivery cannot double-count it.
--
--    Stripe stays the source of truth for the calculation. This table is the
--    source of truth for the QUESTION "what did we collect, where, and when",
--    which is the one an accountant asks.
--
-- 2. Promo codes existed only in Stripe, where a code is an opaque string with a
--    redemption counter. Stripe can tell you SAVE20 was used nine times. It
--    cannot tell you we handed it to a specific press contact in March, that it
--    was meant to run for one campaign, or which nine people used it. That
--    context is a business record, not a payments record, so it lives here and
--    references the Stripe object rather than replacing it.
--
-- Deliberately NOT stored here: the discount amount per code (Stripe computes
-- it, and re-deriving it invites the two to disagree) and the redemption count
-- (read live from Stripe, cross-checked against Orders).
--
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent.

-- ── 1. Orders — one row per paid Checkout Session ───────────────────────────
create table if not exists "Orders" (
  id                    uuid primary key default gen_random_uuid(),

  -- Idempotency key. The Stripe webhook is at-least-once; this unique
  -- constraint is what makes a redelivery a no-op instead of a duplicate order.
  stripe_session_id     text not null unique,
  stripe_payment_intent text,

  user_id               uuid,          -- auth.users id of the buyer
  email                 text,          -- as given to Stripe at checkout

  -- Money, all in the smallest currency unit, exactly as Stripe reported it.
  -- subtotal is BEFORE discount and BEFORE tax; total is what was charged.
  currency              text    not null default 'usd',
  subtotal_cents        integer not null default 0,
  discount_cents        integer not null default 0,
  shipping_cents        integer not null default 0,
  tax_cents             integer not null default 0,
  total_cents           integer not null default 0,

  -- Tax provenance. Destination jurisdiction is the shipping address, because
  -- these are physical goods; a filing is grouped by exactly these columns.
  tax_status            text,          -- Stripe automatic_tax.status: complete | failed | requires_location_inputs
  tax_country           text,
  tax_state             text,
  tax_postal_code       text,
  tax_breakdown         jsonb,         -- session.total_details.breakdown.taxes, verbatim

  -- Promotion, when one was applied.
  promo_code            text,          -- the human code as redeemed, e.g. 'FOUNDER20'
  promo_code_id         text,          -- Stripe promotion_code id (promo_…)
  promo_coupon_id       text,          -- Stripe coupon id

  item_count            integer not null default 0,
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);

comment on table "Orders" is
  'One row per paid Stripe Checkout Session: what was charged, what tax was '
  'collected and where, and which promotion code was used. Written by '
  'api/stripe-webhook.ts. Stripe remains the source of truth for the '
  'calculation; this is our queryable record of the outcome.';
comment on column "Orders".subtotal_cents is
  'Pre-discount, pre-tax. subtotal - discount + shipping + tax = total.';
comment on column "Orders".tax_breakdown is
  'Stripe''s per-jurisdiction tax breakdown, stored verbatim so a filing can be '
  'reconstructed without calling the API.';

create index if not exists orders_paid_at_idx    on "Orders" (paid_at desc);
create index if not exists orders_user_id_idx    on "Orders" (user_id);
create index if not exists orders_promo_code_idx on "Orders" (promo_code_id) where promo_code_id is not null;
-- The shape a tax return is grouped by.
create index if not exists orders_tax_region_idx on "Orders" (tax_country, tax_state);

-- Service-role only, like every other table the payment path writes.
alter table "Orders" enable row level security;

-- ── 2. Promo_Codes — who we gave a code to, and why ─────────────────────────
create table if not exists "Promo_Codes" (
  id                       uuid primary key default gen_random_uuid(),

  -- The Stripe objects this row annotates. A promotion code is the customer-
  -- facing string; the coupon behind it holds the actual discount.
  stripe_promotion_code_id text not null unique,
  stripe_coupon_id         text not null,
  code                     text not null,

  -- Mirrored terms. Stripe enforces these; they are copied so the admin list
  -- can render without an API call per row, and so a code that is later
  -- archived in Stripe still reads correctly in our history.
  percent_off              numeric(5,2),
  amount_off_cents         integer,
  currency                 text not null default 'usd',
  max_redemptions          integer,
  expires_at               timestamptz,
  minimum_amount_cents     integer,
  first_time_only          boolean not null default false,

  -- The part Stripe cannot hold: the issuance record.
  issued_to_name           text,
  issued_to_email          text,
  campaign                 text,
  notes                    text,

  active                   boolean not null default true,
  created_by               text,       -- admin email that minted it
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

comment on table "Promo_Codes" is
  'Issuance ledger for Stripe promotion codes: who a code was given to, for '
  'which campaign, and any internal notes. Stripe enforces the discount and '
  'the redemption limits; this table answers "who has this and why".';
comment on column "Promo_Codes".active is
  'Mirrors the Stripe promotion code''s active flag. Deactivating here calls '
  'Stripe too — the two are kept in step by api/admin.ts, never edited apart.';

-- Codes are case-insensitive to a customer typing them, so uniqueness must be too.
create unique index if not exists promo_codes_code_key on "Promo_Codes" (upper(code));

alter table "Promo_Codes" enable row level security;

-- ── 3. Stripe customer id on Users ──────────────────────────────────────────
--
-- Needed for promotion-code restrictions that are defined PER CUSTOMER
-- ("first order only"), which Stripe cannot evaluate for an anonymous session.
-- It also means a buyer's orders, receipts, and saved tax location accumulate
-- on one Stripe customer instead of a new one per checkout.
alter table public."Users"
  add column if not exists stripe_customer_id text;

comment on column public."Users".stripe_customer_id is
  'Stripe Customer id (cus_…) for this buyer. Created lazily at first checkout '
  'by api/create-checkout.ts. Absent for anyone who has not paid.';

create unique index if not exists users_stripe_customer_id_key
  on public."Users" (stripe_customer_id)
  where stripe_customer_id is not null;
