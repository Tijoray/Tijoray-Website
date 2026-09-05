/**
 * Studio lighting shared by every jewelry renderer: the two interactive
 * configurators and the static cart/checkout thumbnails.
 *
 * The look is image-based. A real photo-studio HDRI (Poly Haven's
 * `studio_small_03`, CC0: one large octabox, an overhead strip, black drapes)
 * supplies the reflections that make polished metal read as metal — long soft
 * highlights against dark surroundings — and gives the gem facets something
 * bright to catch. The analytic lights that used to do this job (an ambient
 * plus four directionals) flattened the metal into an even yellow; only a
 * single warm key and a cool rim remain, purely for sparkle and edge separation.
 *
 * Tone mapping is Khronos PBR Neutral: unlike ACES it does not desaturate or
 * hue-shift the strongly coloured stones (ruby, sapphire, emerald), which is
 * what it was designed for — product imagery where colour fidelity matters.
 */
import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

/** 2k for the interactive configurators; 1k for thumbnails and slow links. */
export const STUDIO_HDR_2K = '/assets/hdr/studio_small_03_2k.hdr'
export const STUDIO_HDR_1K = '/assets/hdr/studio_small_03_1k.hdr'

/** Configurator exposure. Thumbnails render smaller and a touch brighter. */
export const STUDIO_EXPOSURE = 1.0

/** envMapIntensity for the metal body. Anything above ~1.5 blows the gold to white. */
export const BODY_ENV_INTENSITY = 1.2

/**
 * Rotation of the environment about Y so the octabox sits upper-left of the
 * default camera and lands on the stone's crown facets.
 */
const ENV_ROTATION_Y = Math.PI

/**
 * Pick the HDRI for an interactive configurator. The 2k file is ~6.7 MB, which
 * is fine on a desktop connection but not worth it on data-saver or a slow
 * link, where the 1k (~1.7 MB) is visually very close once PMREM has blurred it.
 */
export function pickConfiguratorHdr(): string {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string }
  }
  const c = nav.connection
  if (c?.saveData) return STUDIO_HDR_1K
  if (c?.effectiveType && /2g|3g/.test(c.effectiveType)) return STUDIO_HDR_1K
  return STUDIO_HDR_2K
}

/**
 * Decode an HDR once per URL and keep the DataTexture for the life of the page.
 * PMREM output is per-renderer (GPU), but the decoded pixels are not, so cart
 * thumbnails — one renderer each — share a single decode.
 */
const hdrCache = new Map<string, Promise<THREE.DataTexture>>()
export function loadStudioHdr(url: string): Promise<THREE.DataTexture> {
  let p = hdrCache.get(url)
  if (!p) {
    p = new Promise((resolve, reject) => {
      new RGBELoader().load(url, resolve, undefined, reject)
    })
    hdrCache.set(url, p)
  }
  return p
}

/** Renderer settings every jewelry canvas shares. */
export function configureStudioRenderer(renderer: THREE.WebGLRenderer, exposure = STUDIO_EXPOSURE): void {
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = exposure
}

/**
 * Prefilter the HDR for this renderer and install it as the scene environment.
 * Returns a disposer for the PMREM texture; the decoded HDR stays cached.
 */
export async function applyStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  url: string,
): Promise<() => void> {
  const hdr = await loadStudioHdr(url)
  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const env = pmrem.fromEquirectangular(hdr).texture
  pmrem.dispose()
  scene.environment = env
  scene.environmentRotation.set(0, ENV_ROTATION_Y, 0)
  return () => {
    if (scene.environment === env) scene.environment = null
    env.dispose()
  }
}

/**
 * The only analytic lights in the scene. The HDRI carries the lighting; these
 * add a crisp catchlight on the stone and a cool edge on the metal's far side.
 */
export function addStudioLights(scene: THREE.Scene): void {
  const key = new THREE.DirectionalLight(0xfff6e8, 1.4)
  key.position.set(2.5, 4, 4)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xdde8ff, 0.5)
  rim.position.set(-3, 2, -3)
  scene.add(rim)
}
