// Base URL for the public R2 assets bucket (tijoray-assets).
// Set VITE_ASSETS_BASE_URL in Vercel env vars to the bucket's public domain.
// Omitting it falls back to local /public so dev works without the env var.
const BASE = (import.meta.env.VITE_ASSETS_BASE_URL as string | undefined)
  ?.replace(/\/$/, '') ?? ''

/** Prefix any public asset path with the R2 base URL. */
export function asset(path: string): string {
  return `${BASE}${path}`
}

export const ASSETS = {
  chain:          asset('/assets/3d/chain.glb'),
  pendantSquare:  asset('/assets/3d/pendant-asscher.glb'),
  pendantCircle:  asset('/assets/3d/pendant-circle.glb'),
  pendantHeart:   asset('/assets/3d/pendant-heart.glb'),
  pendantPear:    asset('/assets/3d/pendant-pear.glb'),
  pendantScroll:  asset('/assets/3d/pendant-scroll.glb'),
  braceletChain:  asset('/assets/3d/bracelet-chain.glb'),
  braceletSquare: asset('/assets/3d/bracelet-asscher.glb'), // 'square' key = asscher cut
  braceletCircle: asset('/assets/3d/bracelet-circle.glb'),
  braceletHeart:  asset('/assets/3d/bracelet-heart.glb'),
  braceletPear:   asset('/assets/3d/bracelet-pear.glb'),
} as const

/* ── v2 imagery (September 2026) ─────────────────────────
 * Everything below points at the `assets/v2/**` keys. The original
 * `assets/editorial/*.png` files are still in the bucket, untouched —
 * reverting this block restores the old imagery without re-uploading.
 */
const V2 = '/assets/v2'

export const IMG = {
  hero:             asset(`${V2}/editorial/hero.webp`),
  heroMobile:       asset(`${V2}/editorial/hero-mobile.webp`),
  pendantCloseup:   asset(`${V2}/editorial/product-pendant-closeup.webp`),
  pendantWorn:      asset(`${V2}/editorial/product-pendant-worn.webp`),
  unboxing:         asset(`${V2}/editorial/product-unboxing.webp`),
  nfcTap:           asset(`${V2}/editorial/product-nfc-tap.webp`),
  lifestyleWorn:    asset(`${V2}/editorial/lifestyle-worn.webp`),
  macroFinish:      asset(`${V2}/editorial/macro-finish.webp`),
  wearLayered:      asset(`${V2}/editorial/wear-layered.webp`),
  scaleReference:   asset(`${V2}/editorial/scale-reference.webp`),
  braceletWorn:     asset(`${V2}/editorial/bracelet-lifestyle-worn.webp`),
  braceletMacro:    asset(`${V2}/editorial/bracelet-macro-finish.webp`),
  braceletNfcTap:   asset(`${V2}/editorial/bracelet-nfc-tap.webp`),
  braceletUnboxing: asset(`${V2}/editorial/bracelet-unboxing.webp`),
  cardPendant:      asset(`${V2}/jewelry/birthstone-pendant.webp`),
  cardBracelet:     asset(`${V2}/jewelry/birthstone-bracelet.webp`),
  silverCircle:     asset(`${V2}/jewelry/silver-circle.webp`),
  braceletStations: asset(`${V2}/jewelry/bracelet-stations.webp`),
  collectionHero:   asset(`${V2}/collection/collection-hero.webp`),
  stoneGrid:        asset(`${V2}/collection/stone-grid.webp`),
  stoneStrip:       asset(`${V2}/collection/stone-strip.webp`),
  nfcCutaway:       asset(`${V2}/technology/nfc-cutaway.webp`),
  atelierWide:      asset(`${V2}/craftsmanship/atelier-wide.webp`),
  benchInspection:  asset(`${V2}/craftsmanship/bench-inspection.webp`),
  handFinishing:    asset(`${V2}/craftsmanship/hand-finishing.webp`),
  // How-it-works illustrations. Only step 01 has been remade so far;
  // 02–04 are still the original files at their original keys.
  hiw1:             asset(`${V2}/illustrations/how-it-works-1-choose.webp`),
  hiw2:             asset('/assets/illustrations/how-it-works-2-upload.png'),
  hiw3:             asset('/assets/illustrations/how-it-works-3-tap.png'),
  hiw4:             asset('/assets/illustrations/how-it-works-4-legacy.png'),
  // No v2 replacement shot yet — still the original files.
  wearSolo:         asset('/assets/editorial/wear-solo.png'),
  wearStacked:      asset('/assets/editorial/wear-stacked.png'),
} as const

/** Current Tijoray app captures supplied from the public R2 app folder. */
const APP_BASE = 'https://pub-1f8cd5d39ec04621bc73d5667b85e00b.r2.dev/assets/app'

export const APP_MEDIA = {
  main:                   `${APP_BASE}/main-page.png`,
  tapPiece:               `${APP_BASE}/Tap-piece.png`,
  establishingConnection: `${APP_BASE}/establishing-connection.png`,
  pieceScreen:            `${APP_BASE}/piece-screen.png`,
  authenticity:           `${APP_BASE}/authenticity.png`,
  vault:                  `${APP_BASE}/Vault.png`,
  memories:               `${APP_BASE}/memories.mov`,
} as const

/**
 * Photoreal studio render of a pendant for a given silhouette and metal.
 * Silver and white gold share the white-metal render; every render is
 * shot with a sapphire, so it stands in for the silhouette and metal
 * rather than the chosen stone.
 */
export function pendantRender(shape: string, metal: string, color: string): string {
  const tone = metal === 'silver' || color === 'white' ? 'white' : color === 'rose' ? 'rose' : 'gold'
  const s = ['square', 'circle', 'heart', 'pear'].includes(shape) ? shape : 'square'
  return asset(`${V2}/renders/pendant-${s}-${tone}.webp`)
}

/** Macro swatch of the set stone for a birthstone index (0 = January). */
const STONE_SLUGS = [
  'garnet', 'amethyst', 'aquamarine', 'white-topaz', 'emerald', 'mother-of-pearl',
  'ruby', 'peridot', 'sapphire', 'pink-tourmaline', 'citrine', 'turquoise',
] as const

export function stoneSwatch(birthstoneIndex: number): string {
  const i = Math.min(11, Math.max(0, birthstoneIndex))
  return asset(`${V2}/stones/${String(i + 1).padStart(2, '0')}-${STONE_SLUGS[i]}.webp`)
}
