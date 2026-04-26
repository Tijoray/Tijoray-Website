// Base URL for public R2 assets bucket (tijoray-assets).
// In production this is set via VITE_ASSETS_BASE_URL env var.
// Falls back to /assets so local dev works without the env var.
const BASE = (import.meta.env.VITE_ASSETS_BASE_URL as string | undefined)
  ?.replace(/\/$/, '') ?? ''

export const ASSETS = {
  chain:          `${BASE}/assets/3d/chain.glb`,
  pendantSquare:  `${BASE}/assets/3d/pendant-square.glb`,
  pendantCircle:  `${BASE}/assets/3d/pendant-circle.glb`,
  pendantHeart:   `${BASE}/assets/3d/pendant-heart.glb`,
  pendantPear:    `${BASE}/assets/3d/pendant-pear.glb`,
  pendantScroll:  `${BASE}/assets/3d/pendant-scroll.glb`,
} as const
