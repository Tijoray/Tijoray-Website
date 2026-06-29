-- Migration: make Pieces product-aware
--
-- Adds two columns to the Pieces table so an order can record WHICH product
-- (collection × product type) was purchased and the full configuration the
-- customer chose — not just a stone_id + metal_id, which only fits single-stone
-- gemstone pendants. `config` (jsonb) is the forward-compatible source of truth
-- for reconstructing any piece (multi-stone bracelets, the Initial collection's
-- letter, etc.); stone_id / metal_id remain for existing queries.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) BEFORE deploying
-- the webhook change that writes these columns. It is idempotent and safe to
-- re-run. No existing rows are modified.

alter table "Pieces"
  add column if not exists product_type text,
  add column if not exists config       jsonb;

-- Backfill existing rows (all pre-migration pieces are birthstone pendants).
update "Pieces"
  set product_type = 'pendant'
  where product_type is null;

comment on column "Pieces".product_type is
  'Product type id, e.g. "pendant" | "bracelet" (matches src/data/product-types.ts).';
comment on column "Pieces".config is
  'Full configuration the customer chose: { productType, collectionId, shape, metal, metalColor, birthstoneIndex, ... }. Source of truth for reconstructing the piece.';
