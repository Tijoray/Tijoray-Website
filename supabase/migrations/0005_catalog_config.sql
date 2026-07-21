-- Migration: DB-backed catalog document (Catalog_Config)
--
-- Moves the product catalog's source of truth from compile-time TS constants
-- (src/data/*.ts) into an editable database document, so the admin panel can
-- change pricing, collections, product copy, 3D model paths, and gem materials
-- without a code deploy.
--
-- Design: a SINGLETON row (id = 'live') holding the entire catalog as one jsonb
-- document. One document = atomic saves, trivial optimistic-concurrency, and a
-- clean fallback (if the row is absent, code defaults are used). The shape mirrors
-- src/data/catalog-doc.ts (buildDefaultCatalog), which also seeds this row on the
-- first save from the admin panel.
--
-- Consumers:
--   • api/catalog.ts        — public GET, serves the live document to the site
--   • api/create-checkout.ts — reads per-product×metal prices from it (money path)
--   • api/admin.ts          — get-catalog / save-catalog (admin only, audited)
--
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent.

create table if not exists "Catalog_Config" (
  id          text primary key default 'live',   -- singleton; only the 'live' row is used
  data        jsonb not null,                     -- the full catalog document
  version     integer not null default 1,         -- bumped on each save
  updated_at  timestamptz not null default now(),
  updated_by  text                                -- admin email that last saved
);

comment on table "Catalog_Config" is
  'Singleton catalog document (row id = ''live''). Editable source of truth for '
  'products, collections, product-types, metals pricing, and stones/gem materials. '
  'Absent row => code defaults (src/data/catalog-doc.ts) are used.';

-- No RLS policies added: this table is read/written ONLY through the service-role
-- key (public reads go through api/catalog.ts, which caches and can fall back to
-- code). Keep it inaccessible to the anon client.
alter table "Catalog_Config" enable row level security;
