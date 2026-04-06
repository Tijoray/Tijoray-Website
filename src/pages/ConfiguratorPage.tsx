import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import styles from './ConfiguratorPage.module.css'

/* ── Types ─────────────────────────────────────────────── */
type Shape      = 'square' | 'circle'
type Metal      = 'steel' | 'silver' | '10k' | '18k'
type MetalColor = 'white' | 'gold' | 'rose'

/* ── Constants ─────────────────────────────────────────── */
const GLB_PATHS: Record<Shape, string> = {
  square: '/assets/pendant-square.glb',
  circle: '/assets/pendant-circle.glb',
}

const METAL_PRICES: Record<Metal, number> = {
  steel: 299, silver: 399, '10k': 799, '18k': 1299,
}

const METAL_LABELS: Record<Metal, string> = {
  steel: 'Steel', silver: 'Silver', '10k': '10K Gold', '18k': '18K Gold',
}

const METAL_COLOR_HEX: Record<MetalColor, string> = {
  white: '#D0CFCD',
  gold:  '#D4AF37',
  rose:  '#C4786A',
}

const METAL_COLOR_LABELS: Record<MetalColor, string> = {
  white: 'White', gold: 'Gold', rose: 'Rose',
}

const ROUGHNESS: Record<Metal, number> = {
  steel: 0.45, silver: 0.28, '10k': 0.28, '18k': 0.18,
}

const STEEL_COLOR = '#8A8A8A'

const BIRTHSTONE_COLORS = [
  '#9B1B30', '#9B59B6', '#7EC8C8', '#E8F4F8',
  '#2ECC71', '#D4AF8A', '#CC0000', '#93C572',
  '#154EC1', '#FF6EB4', '#E4A800', '#3BC4C4',
]

const BIRTHSTONE_NAMES = [
  'Garnet', 'Amethyst', 'Aquamarine', 'Diamond',
  'Emerald', 'Pearl', 'Ruby', 'Peridot',
  'Sapphire', 'Pink Tourmaline', 'Citrine', 'Turquoise',
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
]

const BUILD_DURATION = 600 // ms

/* ── Helpers ───────────────────────────────────────────── */
function easeOutCubic(t: number) { return 1 - Math.pow(1 - Math.min(t, 1), 3) }

export default function ConfiguratorPage() {
  /* ── State ── */
  const [shape,       setShape]       = useState<Shape | null>(null)
  const [metal,       setMetal]       = useState<Metal>('18k')
  const [metalColor,  setMetalColor]  = useState<MetalColor>('gold')
  const [birthstone,  setBirthstone]  = useState<number>(0)
  const [loading,     setLoading]     = useState(false)

  /* ── Three.js infrastructure refs (created once) ── */
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef     = useRef<THREE.Scene | null>(null)
  const cameraRef    = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef  = useRef<OrbitControls | null>(null)
  const rafRef       = useRef<number | null>(null)
  const destroyedRef = useRef(false)

  /* ── Per-load model refs (replaced on each shape switch) ── */
  const currentGroupRef = useRef<THREE.Group | null>(null)
  const gemMatsRef      = useRef<THREE.MeshPhysicalMaterial[]>([])
  const bodyMatsRef     = useRef<THREE.MeshStandardMaterial[]>([])

  /* ── Build-in animation refs ── */
  const buildStartRef = useRef<number | null>(null)
  const targetScaleRef = useRef<number>(1)

  /* ── Interaction tracking for polar spring-back ── */
  const isInteractingRef = useRef(false)

  /* ── Effect 1: Three.js infrastructure (runs once) ── */
  useEffect(() => {
    destroyedRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera (square canvas — aspect 1)
    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100)
    camera.position.set(0, 0, 5)
    cameraRef.current = camera

    // HDR environment (same source as ScrollStory)
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    new RGBELoader().load(
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr',
      (hdr) => {
        scene.environment = pmrem.fromEquirectangular(hdr).texture
        hdr.dispose()
        pmrem.dispose()
      }
    )

    // Lights (identical to ScrollStory)
    scene.add(new THREE.AmbientLight(0xffffff, 0.15))
    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.8)
    keyLight.position.set(3, 5, 3)
    scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight(0xaaccff, 0.5)
    rimLight.position.set(-2, -1, -3)
    scene.add(rimLight)

    // OrbitControls — free Y rotation, tight vertical clamp
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.enablePan = false
    controls.zoomToCursor = true
    controls.minDistance = 0.8
    controls.maxDistance = 2.0
    controls.minPolarAngle = Math.PI / 2 - 0.38  // ~22° above equator
    controls.maxPolarAngle = Math.PI / 2 + 0.38  // ~22° below equator
    controlsRef.current = controls

    // Track user interaction for polar spring-back
    const onStart = () => { isInteractingRef.current = true }
    const onEnd   = () => { isInteractingRef.current = false }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end',   onEnd)

    // Resize handler — keeps canvas square
    function resize() {
      const size = canvas!.clientWidth
      renderer.setSize(size, size, false)
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // Reusable spherical for polar spring-back
    const spherical = new THREE.Spherical()

    // Main RAF loop — renders + drives build-in scale animation + polar spring-back
    function loop(ts: DOMHighResTimeStamp) {
      if (destroyedRef.current) return
      rafRef.current = requestAnimationFrame(loop)

      const group = currentGroupRef.current
      if (group && buildStartRef.current !== null) {
        const elapsed = ts - buildStartRef.current
        const t = elapsed / BUILD_DURATION
        const scale = easeOutCubic(t) * targetScaleRef.current
        group.scale.setScalar(scale)
        if (t >= 1) buildStartRef.current = null
      }

      // Polar spring-back — gently return to equator when user releases
      if (!isInteractingRef.current) {
        spherical.setFromVector3(
          new THREE.Vector3().subVectors(camera.position, controls.target)
        )
        const diff = spherical.phi - Math.PI / 2
        if (Math.abs(diff) > 0.001) {
          spherical.phi -= diff * 0.06
          spherical.makeSafe()
          camera.position.copy(
            new THREE.Vector3().setFromSpherical(spherical).add(controls.target)
          )
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      destroyedRef.current = true
      window.removeEventListener('resize', resize)
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end',   onEnd)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      controls.dispose()
      renderer.dispose()
    }
  }, [])

  /* ── Effect 2: GLB load (fires when shape changes) ── */
  useEffect(() => {
    if (!shape || !sceneRef.current) return

    const scene = sceneRef.current
    setLoading(true)

    // Remove outgoing model
    const outgoing = currentGroupRef.current
    if (outgoing) {
      scene.remove(outgoing)
      currentGroupRef.current = null
      gemMatsRef.current = []
      bodyMatsRef.current = []
    }

    // Snapshot current config values for use inside async callback
    const snapMetal      = metal
    const snapColor      = metalColor
    const snapBirthstone = birthstone

    let cancelled = false
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)
    gltfLoader.setMeshoptDecoder(MeshoptDecoder)

    gltfLoader.load(GLB_PATHS[shape], (gltf) => {
      if (cancelled || destroyedRef.current) return

      const model = gltf.scene

      // Both GLBs are Z-up (Rhino export), correct to Y-up
      model.rotation.x = Math.PI / 2
      model.updateMatrixWorld(true)

      // Scale to 2 world-units
      const box1 = new THREE.Box3().setFromObject(model)
      const size = box1.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const targetScale = maxDim > 0 ? 2.0 / maxDim : 1
      model.scale.setScalar(targetScale)
      model.updateMatrixWorld(true)

      // Centre on origin (two-pass, same as ScrollStory)
      const box2 = new THREE.Box3().setFromObject(model)
      const center = box2.getCenter(new THREE.Vector3())
      model.position.sub(center)
      model.updateMatrixWorld(true)

      // Wrap in pivot group (scale stays 1 here so bounding box is correct)
      const pivot = new THREE.Group()
      pivot.add(model)
      pivot.updateMatrixWorld(true)

      // Collect material refs and apply initial config
      const gemMats: THREE.MeshPhysicalMaterial[] = []
      const bodyMats: THREE.MeshStandardMaterial[] = []
      const bodyColor = snapMetal === 'steel'
        ? new THREE.Color(STEEL_COLOR)
        : new THREE.Color(METAL_COLOR_HEX[snapColor])

      pivot.traverse((child) => {
        // Hide any line/curve geometry (CAD construction curves)
        if (child instanceof THREE.Line) { child.visible = false; return }
        if (!(child instanceof THREE.Mesh)) return
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat, idx) => {
          if (!mat) return
          const std = mat as THREE.MeshStandardMaterial
          const col = std.color ?? new THREE.Color(1, 1, 1)

          // Hide construction/guide geometry (aqua-teal curves exported from CAD)
          if (col.r < 0.3 && col.g > 0.45 && col.b > 0.45) {
            child.visible = false
            return
          }

          const GEM_NAME_RE = /garnet|amethyst|aquamarine|diamond|emerald|pearl|ruby|peridot|sapphire|tourmaline|citrine|turquoise|gem|stone|crystal/i
          const isGem = GEM_NAME_RE.test(std.name) || GEM_NAME_RE.test(child.name) || (col.r < 0.12 && col.g < 0.12 && col.b < 0.12)

          if (isGem) {
            const gemMat = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(BIRTHSTONE_COLORS[snapBirthstone]),
              metalness: 0.0,
              roughness: 0.05,
              reflectivity: 1.0,
              envMapIntensity: 3.0,
              clearcoat: 1.0,
              clearcoatRoughness: 0.05,
            })
            if (Array.isArray(child.material)) child.material[idx] = gemMat
            else child.material = gemMat
            gemMats.push(gemMat)
          } else {
            std.color.set(bodyColor)
            std.metalness = 1.0
            std.roughness = ROUGHNESS[snapMetal]
            std.envMapIntensity = 3.5
            std.needsUpdate = true
            bodyMats.push(std)
          }
        })
      })

      // Frame camera on pendant gem — only visible meshes, ignore chain
      const box3 = new THREE.Box3()
      pivot.traverse((child) => {
        if (!child.visible) return
        if (child instanceof THREE.Mesh) box3.expandByObject(child)
      })
      const modelHeight = box3.max.y - box3.min.y
      // Focus on the gem (sits ~20% from bottom of full model)
      const pendantY = box3.min.y + modelHeight * 0.20
      if (cameraRef.current) {
        cameraRef.current.position.set(0, pendantY, 1.4)
        cameraRef.current.lookAt(0, pendantY, 0)
      }
      if (controlsRef.current) {
        controlsRef.current.target.set(0, pendantY, 0)
        controlsRef.current.update()
      }

      // Now zero scale for build-in animation
      pivot.scale.setScalar(0)
      targetScaleRef.current = 1

      scene.add(pivot)
      currentGroupRef.current = pivot
      gemMatsRef.current = gemMats
      bodyMatsRef.current = bodyMats

      // Trigger build-in animation
      buildStartRef.current = performance.now()
      setLoading(false)
    }, undefined, (err) => {
      console.error('[Arcana Configurator] GLB load error:', err)
      setLoading(false)
    })

    return () => {
      cancelled = true
      dracoLoader.dispose()
    }
  }, [shape]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Effect 3: Metal / color mutation (no GLB reload) ── */
  useEffect(() => {
    const mats = bodyMatsRef.current
    if (!mats.length) return
    const color = metal === 'steel'
      ? new THREE.Color(STEEL_COLOR)
      : new THREE.Color(METAL_COLOR_HEX[metalColor])
    mats.forEach(m => {
      m.color.set(color)
      m.roughness = ROUGHNESS[metal]
      m.needsUpdate = true
    })
  }, [metal, metalColor])

  /* ── Effect 4: Birthstone mutation ── */
  useEffect(() => {
    const mats = gemMatsRef.current
    if (!mats.length) return
    mats.forEach(m => {
      m.color.set(new THREE.Color(BIRTHSTONE_COLORS[birthstone]))
      m.needsUpdate = true
    })
  }, [birthstone])

  /* ── Derived values ── */
  const price = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(METAL_PRICES[metal])

  const specLine = [
    shape ? `${shape.charAt(0).toUpperCase() + shape.slice(1)} pendant` : 'No shape selected',
    METAL_LABELS[metal],
    metal !== 'steel' ? METAL_COLOR_LABELS[metalColor] : null,
    BIRTHSTONE_NAMES[birthstone],
  ].filter(Boolean).join(' · ')

  /* ── JSX ── */
  return (
    <main className={styles.page}>
      <div className={styles.split}>

        {/* ── Left: Canvas ── */}
        <div className={styles.canvasPanel}>
          <div className={styles.canvasWrap}>
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              role="img"
              aria-label="3D pendant preview — drag to rotate, scroll to zoom"
            />
            {loading && (
              <div className={styles.loadingOverlay} aria-live="polite" aria-label="Loading pendant">
                <div className={styles.loadingSpinner} aria-hidden="true" />
                <span>Crafting your pendant…</span>
              </div>
            )}
            {!shape && !loading && (
              <div className={styles.canvasPrompt} aria-hidden="true">
                <p>Select a shape to begin</p>
              </div>
            )}
          </div>
          <p className={styles.orbitHint} aria-hidden="true">
            Drag to rotate · Scroll to zoom
          </p>
        </div>

        {/* ── Right: Configurator ── */}
        <div className={styles.configPanel}>

          <div className={styles.configHeader}>
            <p className={styles.eyebrow}>Compose Your Piece</p>
            <h1 className={styles.configTitle}>The <em>Arcana</em> Pendant</h1>
          </div>

          {/* Step 1 — Shape */}
          <section className={styles.step}>
            <p className={styles.stepLabel}>01 — Shape</p>
            <div className={styles.shapeGrid}>
              {(['square', 'circle'] as Shape[]).map(s => (
                <button
                  key={s}
                  className={`${styles.shapeBtn} ${shape === s ? styles.active : ''}`}
                  onClick={() => setShape(s)}
                  aria-pressed={shape === s}
                >
                  <span className={styles.shapeIcon} aria-hidden="true">
                    {s === 'square' ? '▪' : '●'}
                  </span>
                  <span className={styles.shapeName}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2 — Base Metal */}
          <section className={styles.step}>
            <p className={styles.stepLabel}>02 — Base Metal</p>
            <div className={styles.optionRow}>
              {(['steel', 'silver', '10k', '18k'] as Metal[]).map(m => (
                <button
                  key={m}
                  className={`${styles.optionBtn} ${metal === m ? styles.active : ''}`}
                  onClick={() => setMetal(m)}
                  aria-pressed={metal === m}
                >
                  {METAL_LABELS[m]}
                </button>
              ))}
            </div>
          </section>

          {/* Step 3 — Metal Color */}
          <section className={`${styles.step} ${metal === 'steel' ? styles.stepDisabled : ''}`}>
            <p className={styles.stepLabel}>03 — Metal Color</p>
            <div className={styles.colorSwatches}>
              {(['white', 'gold', 'rose'] as MetalColor[]).map(c => (
                <button
                  key={c}
                  className={`${styles.swatchBtn} ${metalColor === c ? styles.active : ''}`}
                  onClick={() => { if (metal !== 'steel') setMetalColor(c) }}
                  aria-pressed={metalColor === c}
                  aria-disabled={metal === 'steel'}
                  style={{ '--swatch-color': METAL_COLOR_HEX[c] } as React.CSSProperties}
                >
                  <span className={styles.swatchCircle} aria-hidden="true" />
                  <span className={styles.swatchLabel}>{METAL_COLOR_LABELS[c]}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Step 4 — Birthstone */}
          <section className={styles.step}>
            <p className={styles.stepLabel}>04 — Birthstone</p>
            <div className={styles.stoneGrid} role="group" aria-label="Select birthstone by month">
              {MONTH_NAMES.map((month, i) => (
                <button
                  key={month}
                  className={`${styles.stoneBtn} ${birthstone === i ? styles.active : ''}`}
                  onClick={() => setBirthstone(i)}
                  aria-pressed={birthstone === i}
                  aria-label={`${month} — ${BIRTHSTONE_NAMES[i]}`}
                  style={{ '--gem-color': BIRTHSTONE_COLORS[i] } as React.CSSProperties}
                >
                  <span className={styles.gemSwatch} aria-hidden="true" />
                  <span className={styles.monthAbbr}>{month.slice(0, 3)}</span>
                </button>
              ))}
            </div>
            <p className={styles.stoneName}>
              {BIRTHSTONE_NAMES[birthstone]} — {MONTH_NAMES[birthstone]}
            </p>
          </section>

          {/* Price + CTA */}
          <div className={styles.priceBlock}>
            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>From</span>
              <span className={styles.priceValue}>{price}</span>
            </div>
            <p className={styles.specLine}>{specLine}</p>
            <button
              className={styles.ctaBtn}
              disabled
              aria-disabled="true"
              title="Commission ordering coming soon"
            >
              Proceed to Commission
              <span className={styles.ctaBadge}>Coming Soon</span>
            </button>
            <Link to="/contact" className={styles.ctaSecondary}>
              Speak with the Atelier
            </Link>
          </div>

        </div>
      </div>
    </main>
  )
}
