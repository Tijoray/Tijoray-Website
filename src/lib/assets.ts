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
  pendantSquare:  asset('/assets/3d/pendant-square.glb'),
  pendantCircle:  asset('/assets/3d/pendant-circle.glb'),
  pendantHeart:   asset('/assets/3d/pendant-heart.glb'),
  pendantPear:    asset('/assets/3d/pendant-pear.glb'),
  pendantScroll:  asset('/assets/3d/pendant-scroll.glb'),
} as const
