import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useCatalog } from '../contexts/CatalogContext'
import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import styles from './ConfiguratorPage.module.css'
import { asset } from '../lib/assets'
import { CHAIN_PATH, PENDANT_PATHS } from '../data/product-types'
import { createGemMaterial, GEM_NAME_RE } from '../3d/gem'
import { createGltfLoader } from '../3d/engine'
import { prepareChain, preparePendant } from '../3d/assemblies/pendant'
import type { Shape, Metal, MetalColor } from '../data/catalog'
import {
  readDesign, writeDesign, SHAPE_NOTES,
  METAL_NOTES, METAL_COLOR_NOTES, METALS, METAL_COLORS,
} from '../lib/design'
import {
  METAL_LABELS_SHORT       as METAL_LABELS,
  METAL_COLOR_HEX,
  METAL_COLOR_LABELS_SHORT as METAL_COLOR_LABELS,
  ROUGHNESS,
  STONE_COLORS             as BIRTHSTONE_COLORS,
  STONE_NAMES              as BIRTHSTONE_NAMES,
  MONTH_NAMES,
  SHAPE_LABELS,
  STONE_MEANINGS,
  metalPhrase,
} from '../data/catalog'
import { usePageMeta } from '../lib/usePageMeta'

/* ── Constants ─────────────────────────────────────────── */
/* A shopper deciding on a $1,299 piece should see the real thing, not only a
   render. These sit beside the 3D view rather than far below the fold. */
const PHOTOS = [
  { src: asset('/assets/editorial/product-pendant-worn.png'),    label: 'Worn',      alt: 'Tijoray pendant worn at the collarbone' },
  { src: asset('/assets/editorial/product-pendant-closeup.png'), label: 'Detail',    alt: 'Macro close-up of the pendant setting and stone' },
  { src: asset('/assets/editorial/product-nfc-tap.png'),         label: 'The tap',   alt: 'A phone tapped against the pendant, opening the vault' },
  { src: asset('/assets/editorial/product-unboxing.png'),        label: 'Packaging', alt: 'Tijoray packaging as it arrives' },
]


const BUILD_DURATION  = 900 // ms — fade + drift animation
const BUILD_DRIFT_Y   = -0.07 // world-units below final position at animation start

/* ── Helpers ───────────────────────────────────────────── */
function easeOutCubic(t: number) { return 1 - Math.pow(1 - Math.min(t, 1), 3) }

export default function ConfiguratorPage() {
  usePageMeta('Design Your Pendant', 'Configure a Tijoray birthstone pendant — silhouette, metal and stone — with an encrypted memory vault sealed inside. From $399.')
  const { addItem, openCart } = useCart()
  const catalog     = useCatalog()

  /* ── State ── */
  // Seeded from the URL so a shared design link opens exactly what was sent,
  // and defaulted to a real configuration so the page never opens on an empty
  // canvas and a disabled buy button.
  const [searchParams, setSearchParams] = useSearchParams()
  const [initial] = useState(() => readDesign(searchParams))
  const [shape,       setShape]       = useState<Shape>(initial.shape)
  const [metal,       setMetal]       = useState<Metal>(initial.metal)
  const [metalColor,  setMetalColor]  = useState<MetalColor>(initial.metalColor)
  const [birthstone,  setBirthstone]  = useState<number>(initial.birthstone)
  const [loading,     setLoading]     = useState(false)
  const [isTouch,     setIsTouch]     = useState(false)
  const [shareState,  setShareState]  = useState<'idle' | 'copied' | 'failed'>('idle')
  /** null = the interactive 3D view; a number selects a photograph. */
  const [photo,       setPhoto]       = useState<number | null>(null)

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
  const buildStartRef   = useRef<number | null>(null)
  const pendantMatsRef  = useRef<THREE.Material[]>([]) // pendant-only mats for fade animation

  /* ── Interaction tracking for polar spring-back ── */
  const isInteractingRef = useRef(false)

  /* ── GLB preload caches ── */
  const pendantCacheRef = useRef<Partial<Record<Shape, THREE.Group>>>({})
  const chainCacheRef   = useRef<THREE.Group | null>(null)

  /* ── Chain scene state (set once, never rebuilt) ── */
  const chainGroupRef    = useRef<THREE.Group | null>(null)   // live chain in scene
  const assemblyScaleRef = useRef<number>(1)                  // scale computed from chain bbox
  const chainAttachRef   = useRef<THREE.Vector3 | null>(null) // chain bottom-center for pendant alignment

  /* ── Touch detection (runs once) ── */
  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches)
  }, [])

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

    // Camera — aspect updated by resize handler
    const camera = new THREE.PerspectiveCamera(42, canvas.clientWidth / canvas.clientHeight, 0.01, 100)
    camera.position.set(0, 0, 5)
    cameraRef.current = camera

    // HDR environment (same source as ScrollStory)
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    new RGBELoader().load(
      '/assets/hdr/studio_small_09_1k.hdr',
      (hdr) => {
        scene.environment = pmrem.fromEquirectangular(hdr).texture
        hdr.dispose()
        pmrem.dispose()
      }
    )

    // Lights — front-heavy for jewelry: stone and chain well-lit head-on
    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    // Strong direct front key — straight-on, slightly high, punches through chain links
    const frontKey = new THREE.DirectionalLight(0xfff8f0, 2.2)
    frontKey.position.set(0, 2, 8)
    scene.add(frontKey)
    // Softer upper-right accent for metal highlights
    const keyLight = new THREE.DirectionalLight(0xfff5e0, 0.9)
    keyLight.position.set(2, 4, 3)
    scene.add(keyLight)
    // Left fill to balance rotation
    const fillLight = new THREE.DirectionalLight(0xd8e8ff, 0.5)
    fillLight.position.set(-3, 1, 3)
    scene.add(fillLight)
    // Soft back-rim for depth separation
    const rimLight = new THREE.DirectionalLight(0xaaccff, 0.2)
    rimLight.position.set(-1, -1, -4)
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

    // Resize handler — fills the full canvas element
    function resize() {
      const w = canvas!.clientWidth
      const h = canvas!.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // Reusable spherical for polar spring-back
    const spherical = new THREE.Spherical()

    // Main RAF loop — renders + drives fade/drift animation + polar spring-back
    function loop(ts: DOMHighResTimeStamp) {
      if (destroyedRef.current) return
      rafRef.current = requestAnimationFrame(loop)

      const group = currentGroupRef.current
      if (group && buildStartRef.current !== null) {
        const ease = easeOutCubic((ts - buildStartRef.current) / BUILD_DURATION)
        // Fade opacity
        pendantMatsRef.current.forEach(m => { m.opacity = ease; m.needsUpdate = true })
        // Drift upward into final position
        group.position.y = BUILD_DRIFT_Y * (1 - ease)
        if (ease >= 1) {
          buildStartRef.current = null
          group.position.y = 0
          pendantMatsRef.current.forEach(m => {
            m.transparent = false; m.opacity = 1; m.needsUpdate = true
          })
        }
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

  /* ── Effect 2a: Preload chain + both pendant GLBs silently on mount ── */
  useEffect(() => {
    const { loader, dispose } = createGltfLoader()

    if (!chainCacheRef.current) {
      loader.load(CHAIN_PATH, (gltf) => { chainCacheRef.current = gltf.scene })
    }

    ;(Object.keys(PENDANT_PATHS) as Shape[]).forEach((s) => {
      if (pendantCacheRef.current[s]) return
      loader.load(PENDANT_PATHS[s], (gltf) => {
        pendantCacheRef.current[s] = gltf.scene
      })
    })

    return () => { dispose() }
  }, [])

  /* ── Effect 2: GLB load (fires when shape changes) ── */
  useEffect(() => {
    if (!shape || !sceneRef.current) return

    const scene    = sceneRef.current
    const shapeKey = shape

    // Remove ONLY the pendant pivot — chain stays in scene permanently
    const outgoing = currentGroupRef.current
    if (outgoing) {
      scene.remove(outgoing)
      currentGroupRef.current = null
      gemMatsRef.current  = []
      bodyMatsRef.current = []
    }

    const snapMetal      = metal
    const snapColor      = metalColor
    const snapBirthstone = birthstone

    let cancelled = false

    // ── Shared material applicator ──────────────────────────────────────────
    function applyMetal(
      root: THREE.Object3D,
      bodyMats: THREE.MeshStandardMaterial[],
      gemMats:  THREE.MeshPhysicalMaterial[],
      bodyColor: THREE.Color,
    ) {
      root.traverse((child) => {
        if (child instanceof THREE.Line) { child.visible = false; return }
        if (!(child instanceof THREE.Mesh)) return
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat, idx) => {
          if (!mat) return
          const std = mat as THREE.MeshStandardMaterial
          const col = std.color ?? new THREE.Color(1, 1, 1)
          if (col.r < 0.3 && col.g > 0.45 && col.b > 0.45) { child.visible = false; return }

          const parentName = child.parent?.name ?? ''
          const isGem = GEM_NAME_RE.test(std.name) || GEM_NAME_RE.test(child.name) || GEM_NAME_RE.test(parentName)
            || (col.r < 0.12 && col.g < 0.12 && col.b < 0.12)

          if (isGem) {
            const gemMat = createGemMaterial(snapBirthstone, shapeKey)
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
    }

    // ── Add pendant to scene with build-in animation ─────────────────────────
    function onPendantReady(pendantSrc: THREE.Group) {
      if (cancelled || destroyedRef.current) return

      // Clone, scale, and align the pendant bail to the stored chain attach point.
      const pendantModel = preparePendant(pendantSrc, assemblyScaleRef.current, chainAttachRef.current!)

      const pivot = new THREE.Group()
      pivot.add(pendantModel)
      pivot.updateMatrixWorld(true)

      const gemMats:  THREE.MeshPhysicalMaterial[] = []
      const bodyMats: THREE.MeshStandardMaterial[]  = []
      const bodyColor = new THREE.Color(METAL_COLOR_HEX[snapColor])

      applyMetal(pivot, bodyMats, gemMats, bodyColor)
      // Include chain materials so Effect 3 keeps chain in sync on metal change
      if (chainGroupRef.current) applyMetal(chainGroupRef.current, bodyMats, gemMats, bodyColor)

      // Camera: frame on pendant medallion using combined chain + pendant bbox
      const combinedBox = new THREE.Box3()
      if (chainGroupRef.current) combinedBox.expandByObject(chainGroupRef.current)
      combinedBox.expandByObject(pivot)
      const totalHeight = combinedBox.max.y - combinedBox.min.y
      const pendantY    = combinedBox.min.y + totalHeight * 0.18
      if (cameraRef.current) {
        cameraRef.current.position.set(0, pendantY, 1.4)
        cameraRef.current.lookAt(0, pendantY, 0)
      }
      if (controlsRef.current) {
        controlsRef.current.target.set(0, pendantY, 0)
        controlsRef.current.update()
      }

      // Set up fade-in: make all pendant materials transparent at opacity 0,
      // and start the pivot slightly below its final position (drift upward)
      const fadeMats: THREE.Material[] = []
      pivot.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach(m => { m.transparent = true; m.opacity = 0; m.needsUpdate = true; fadeMats.push(m) })
      })
      pendantMatsRef.current = fadeMats
      pivot.position.y = BUILD_DRIFT_Y

      scene.add(pivot)
      currentGroupRef.current = pivot
      gemMatsRef.current  = gemMats
      bodyMatsRef.current = bodyMats
      buildStartRef.current = performance.now()
      setLoading(false)
    }

    // ── Set up chain in scene (first shape selection only) ───────────────────
    function setupChain(chainSrc: THREE.Group, pendantSrc: THREE.Group) {
      if (cancelled || destroyedRef.current) return

      // Normalise the chain and compute the pendant attach point.
      const { chainModel, scale, attach } = prepareChain(chainSrc)
      assemblyScaleRef.current = scale
      chainAttachRef.current   = attach

      scene.add(chainModel)
      chainGroupRef.current = chainModel
      onPendantReady(pendantSrc)
    }

    // ── Loading coordination ─────────────────────────────────────────────────
    const chainInScene  = !!chainGroupRef.current
    const chainCached   = !!chainCacheRef.current
    const pendantCached = !!pendantCacheRef.current[shapeKey]

    if (!pendantCached || (!chainInScene && !chainCached)) setLoading(true)

    const { loader, dispose } = createGltfLoader()

    let chainReady   = chainCached || chainInScene
    let pendantReady = pendantCached

    function tryComplete() {
      if (!chainReady || !pendantReady) return
      if (chainInScene) {
        onPendantReady(pendantCacheRef.current![shapeKey]!)
      } else {
        setupChain(chainCacheRef.current!, pendantCacheRef.current![shapeKey]!)
      }
    }

    if (!chainCached && !chainInScene) {
      loader.load(CHAIN_PATH, (gltf) => {
        chainCacheRef.current = gltf.scene
        chainReady = true
        tryComplete()
      }, undefined, (err) => {
        console.error('[Tijoray Configurator] Chain GLB load error:', err)
        setLoading(false)
      })
    }

    if (!pendantCached) {
      loader.load(PENDANT_PATHS[shapeKey], (gltf) => {
        pendantCacheRef.current[shapeKey] = gltf.scene
        pendantReady = true
        tryComplete()
      }, undefined, (err) => {
        console.error('[Tijoray Configurator] Pendant GLB load error:', err)
        setLoading(false)
      })
    }

    tryComplete()

    return () => { cancelled = true; dispose() }
  // metal/metalColor/birthstone intentionally excluded — Effects 3 & 4 mutate
  // existing materials directly so the GLB never needs to reload for those changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape])

  /* ── Effect 3: Metal / color mutation (no GLB reload) ── */
  useEffect(() => {
    const mats = bodyMatsRef.current
    if (!mats.length) return
    const color = new THREE.Color(METAL_COLOR_HEX[metalColor])
    mats.forEach(m => {
      m.color.set(color)
      m.roughness = ROUGHNESS[metal]
      m.needsUpdate = true
    })
  }, [metal, metalColor])

  /* ── Effect 4: Birthstone change — copy fresh material props onto live gem mats ── */
  useEffect(() => {
    const mats = gemMatsRef.current
    if (!mats.length) return
    // Build a reference material with the correct params for this stone + shape,
    // then copy every property onto the live materials so Three.js picks up the change.
    const ref = createGemMaterial(birthstone, shape)
    mats.forEach(m => {
      m.color.copy(ref.color)
      m.ior                 = ref.ior
      m.transmission        = ref.transmission
      m.thickness           = ref.thickness
      m.roughness           = ref.roughness
      m.clearcoat           = ref.clearcoat
      m.clearcoatRoughness  = ref.clearcoatRoughness
      m.envMapIntensity     = ref.envMapIntensity
      m.attenuationColor.copy(ref.attenuationColor)
      m.attenuationDistance = ref.attenuationDistance
      m.iridescence         = ref.iridescence
      m.iridescenceIOR      = ref.iridescenceIOR
      m.side                = ref.side
      m.needsUpdate         = true
    })
    ref.dispose()
  }, [birthstone, shape])

  /* ── Keep the address bar in step so the design is always shareable ── */
  useEffect(() => {
    setSearchParams(writeDesign({ shape, metal, metalColor, birthstone }), { replace: true })
    setShareState('idle')
  // setSearchParams identity changes each render — including it would loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, metal, metalColor, birthstone])

  /* ── Derived values ── */
  const fmtPrice = (n: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n)

  /** Charged price for any metal — also drives the per-option price labels, so
   *  the 3x jump between silver and 18K is visible before it is committed to. */
  const priceOf = (m: Metal) => catalog.priceDollars('birthstone', 'pendant', m)
  const price   = fmtPrice(priceOf(metal))

  const specLine = [
    `${SHAPE_LABELS[shape]} pendant`,
    metalPhrase(metal, metalColor),
    BIRTHSTONE_NAMES[birthstone],
  ].join(' · ')

  /* ── Actions ── */
  function handleAdd() {
    addItem({
      productType:  'pendant',
      collectionId: 'birthstone',
      shape,
      metal,
      metalColor,
      birthstoneIndex: birthstone,
      price: catalog.priceDollars('birthstone', 'pendant', metal),
      specLine,
    })
    // Open the cart in place rather than navigating away: the pieces are sold
    // as a set, so the likeliest next action is a second stone, not checkout.
    openCart()
  }

  /** Gifting runs on hints — a design has to be sendable. */
  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareState('copied')
    } catch {
      // Clipboard can be blocked (insecure context, denied permission). The
      // address bar already holds the design, so point at it rather than
      // opening a blocking prompt or failing silently.
      setShareState('failed')
    }
    window.setTimeout(() => setShareState('idle'), 3000)
  }

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
              aria-label="3D preview — drag to rotate, scroll to zoom"
            />
            {loading && photo === null && (
              <div className={styles.loadingOverlay} aria-live="polite" aria-label="Loading pendant">
                <div className={styles.loadingSpinner} aria-hidden="true" />
                <span>Crafting your pendant…</span>
              </div>
            )}
            {photo !== null && (
              <img
                src={PHOTOS[photo].src}
                alt={PHOTOS[photo].alt}
                className={styles.photoOverlay}
              />
            )}
            {photo === null && (
              <p className={styles.orbitHint} aria-hidden="true">
                {isTouch ? 'Drag to rotate · Pinch to zoom' : 'Drag to rotate · Scroll to zoom'}
              </p>
            )}
          </div>

          <div className={styles.viewStrip} role="group" aria-label="Choose a view">
            <button
              type="button"
              className={`${styles.viewThumb} ${photo === null ? styles.viewThumbActive : ''}`}
              onClick={() => setPhoto(null)}
              aria-pressed={photo === null}
            >
              <span className={styles.viewThumb3d} aria-hidden="true" />
              <span className={styles.viewThumbLabel}>Your design</span>
            </button>
            {PHOTOS.map((shot, i) => (
              <button
                key={shot.label}
                type="button"
                className={`${styles.viewThumb} ${photo === i ? styles.viewThumbActive : ''}`}
                onClick={() => setPhoto(i)}
                aria-pressed={photo === i}
              >
                <img src={shot.src} alt="" className={styles.viewThumbImg} loading="lazy" />
                <span className={styles.viewThumbLabel}>{shot.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: Configurator ── */}
        <div className={styles.configPanel}>

          <Link to="/collection" className={styles.backLink}>← Collection</Link>

          <div className={styles.configHeader}>
            <p className={styles.eyebrow}>Compose Your Piece</p>
            <h1 className={styles.configTitle}>The <em>Tijoray</em> Pendant</h1>
            <p className={styles.seriesTag}>Birthstone Series</p>
          </div>

          {/* Step 1 — Shape */}
          <section className={styles.step}>
            <div className={styles.stepHeader}>
              <div className={styles.stepTitleRow}>
                <p className={styles.stepLabel}>01 — Shape</p>
              </div>
              <span className={styles.stepLine} aria-hidden="true" />
            </div>
            <div className={styles.shapeGrid}>
              {(['square', 'circle', 'heart', 'pear'] as Shape[]).map(s => (
                <button
                  key={s}
                  className={`${styles.shapeBtn} ${shape === s ? styles.active : ''}`}
                  onClick={() => setShape(s)}
                  aria-pressed={shape === s}
                >
                  <span
                    className={`${styles.shapeIcon} ${styles[`shapeIcon_${s}`]}`}
                    aria-hidden="true"
                  />
                  <span className={styles.shapeName}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                </button>
              ))}
            </div>
            <p className={styles.stepNote}>{SHAPE_NOTES[shape]}</p>
          </section>

          {/* Step 2 — Base Metal */}
          <section className={styles.step}>
            <div className={styles.stepHeader}>
              <div className={styles.stepTitleRow}>
                <p className={styles.stepLabel}>02 — Base Metal</p>
              </div>
              <span className={styles.stepLine} aria-hidden="true" />
            </div>
            <div className={styles.optionRow}>
              {METALS.map(m => (
                <button
                  key={m}
                  className={`${styles.optionBtn} ${metal === m ? styles.active : ''}`}
                  onClick={() => setMetal(m)}
                  aria-pressed={metal === m}
                >
                  <span className={styles.optionLabel}>{METAL_LABELS[m]}</span>
                  <span className={styles.optionPrice}>{fmtPrice(priceOf(m))}</span>
                </button>
              ))}
            </div>
            <p className={styles.stepNote}>{METAL_NOTES[metal]}</p>
          </section>

          {/* Step 3 — Metal Color */}
          <section className={styles.step}>
            <div className={styles.stepHeader}>
              <div className={styles.stepTitleRow}>
                <p className={styles.stepLabel}>03 — Metal Color</p>
              </div>
              <span className={styles.stepLine} aria-hidden="true" />
            </div>
            <div className={styles.colorSwatches}>
              {METAL_COLORS.map(c => (
                <button
                  key={c}
                  className={`${styles.swatchBtn} ${metalColor === c ? styles.active : ''}`}
                  onClick={() => setMetalColor(c)}
                  aria-pressed={metalColor === c}
                  style={{ '--swatch-color': METAL_COLOR_HEX[c] } as React.CSSProperties}
                >
                  <span className={styles.swatchCircle} aria-hidden="true" />
                  <span className={styles.swatchLabel}>{METAL_COLOR_LABELS[c]}</span>
                </button>
              ))}
            </div>
            <p className={styles.stepNote}>{METAL_COLOR_NOTES[metalColor]}</p>
          </section>

          {/* Step 4 — Birthstone */}
          <section className={styles.step}>
            <div className={styles.stepHeader}>
              <div className={styles.stepTitleRow}>
                <p className={styles.stepLabel}>04 — Birthstone</p>
              </div>
              <span className={styles.stepLine} aria-hidden="true" />
            </div>
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
            <p className={styles.stepNote}>{STONE_MEANINGS[birthstone]}</p>
          </section>

          {/* Price + CTA */}
          <div className={styles.priceBlock}>
            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Price</span>
              <span className={styles.priceValue}>{price}</span>
            </div>
            <p className={styles.specLine}>{specLine}</p>

            {/* The vault is the whole reason to buy this rather than any other
                piece — it belongs at the point of decision, not four screens
                further down the page. */}
            <p className={styles.vaultNote}>
              Includes the Tijoray memory vault — add photos, voice notes and
              letters once your piece arrives.{' '}
              <Link to="/technology" className={styles.vaultLink}>See how it works</Link>
            </p>

            <button className={styles.ctaBtn} onClick={handleAdd}>
              Add to Cart
            </button>

            {/* Every claim here is the policy stated in our own terms. */}
            <ul className={styles.reassure}>
              <li>Complimentary shipping</li>
              <li>Made to order — ships in 10–14 business days</li>
              <li>Replaced or refunded if it arrives damaged</li>
            </ul>

            <div className={styles.secondaryRow}>
              <button
                type="button"
                className={styles.shareBtn}
                onClick={handleShare}
                aria-live="polite"
              >
                {shareState === 'copied' ? 'Link copied'
                  : shareState === 'failed' ? 'Copy the address bar to share'
                  : 'Share this design'}
              </button>
              <Link to="/contact" className={styles.ctaSecondary}>
                Speak with the Atelier
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ── Story section ── */}
      <section className={styles.storySection}>
        <div className={styles.storyInner}>
          <div className={styles.storyText}>
            <p className={styles.eyebrow}>The Birthstone Pendant</p>
            <h2 className={styles.storyTitle}>
              A gemstone chosen<br />across <em>centuries.</em>
            </h2>
            <p className={styles.storyBody}>
              The tradition of birthstones stretches back to ancient civilizations —
              each stone assigned to a month not by chance, but by the qualities it
              was believed to carry: protection, clarity, passion, renewal.
            </p>
            <p className={styles.storyBody}>
              The Tijoray Pendant honors that tradition and extends it. Beneath the
              surface of each stone sits a passive NFC vault — no battery, no signal
              required — holding whatever you choose to preserve. A voice. A map.
              A letter. A photograph. The stone carries meaning. The vault carries memory.
            </p>
            <p className={styles.storyBody}>
              Together, they compose something that outlasts both.
            </p>
          </div>
          <div className={styles.storyImageWrap}>
            <img src={asset('/assets/editorial/lifestyle-worn.png')} alt="Tijoray pendant worn at the collarbone" />
          </div>
        </div>
      </section>

      {/* ── Stone meanings ── */}
      <section className={styles.stonesSection}>
        <div className={styles.stonesInner}>
          <div className={styles.stonesHeader}>
            <p className={styles.eyebrow}>The Twelve Stones</p>
            <h2 className={styles.storyTitle}>Every month has a <em>meaning.</em></h2>
          </div>
          <div className={styles.stonesGrid}>
            {BIRTHSTONE_NAMES.map((name, i) => (
              <div key={name} className={styles.stoneCard}>
                <span
                  className={styles.stoneCardGem}
                  style={{ '--gem-color': BIRTHSTONE_COLORS[i] } as React.CSSProperties}
                />
                <span className={styles.stoneCardMonth}>{MONTH_NAMES[i]}</span>
                <span className={styles.stoneCardName}>{name}</span>
                <p className={styles.stoneCardMeaning}>{STONE_MEANINGS[i]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Crafted to last ── */}
      <section className={styles.craftSection}>
        <div className={styles.craftInner}>
          <div className={styles.craftImageWrap}>
            <img src={asset('/assets/editorial/macro-finish.png')} alt="Close-up of Tijoray pendant surface finish" />
          </div>
          <div className={styles.craftText}>
            <p className={styles.eyebrow}>Crafted to Last</p>
            <h2 className={styles.storyTitle}>Built for <em>a lifetime</em> of wear.</h2>
            <p className={styles.storyBody}>
              Every Tijoray pendant passes through multi-stage finishing before it
              leaves our atelier — cut, set, polished, and inspected by hand, with
              each stage checked before the next begins.
            </p>
            <p className={styles.storyBody}>
              The result is a surface that holds its color, its luster, and its
              precision-set stone through years of continuous wear — a piece made
              for every day, not for the drawer.
            </p>
          </div>
        </div>
      </section>

      {/* ── Dimensions ── */}
      <section className={styles.dimsSection}>
        <div className={styles.dimsInner}>
          <p className={styles.eyebrow}>Pendant Dimensions</p>
          <div className={styles.dimsGrid}>
            {[
              { stat: '18 mm', label: 'Pendant face' },
              { stat: '2.5 mm', label: 'Profile depth' },
              { stat: '45 cm', label: 'Chain length' },
              { stat: '4–9 g', label: 'Weight by metal' },
            ].map(d => (
              <div key={d.label} className={styles.dimStat}>
                <span className={styles.dimValue}>{d.stat}</span>
                <span className={styles.dimLabel}>{d.label}</span>
              </div>
            ))}
          </div>
          <p className={styles.dimsNote}>
            The pendant face is consistent across all four shapes — Square, Circle, Heart, and Pear —
            so pieces can be stacked and layered interchangeably on the same chain.
          </p>
        </div>
      </section>

      {/* ── Ways to wear ── */}
      <section className={styles.wearSection}>
        <div className={styles.wearInner}>
          <p className={styles.eyebrow}>How to Wear It</p>
          <h2 className={styles.storyTitle}>One piece. <em>Endless ways.</em></h2>
          <div className={styles.wearGrid}>
            {[
              {
                label: 'Solo',
                desc: 'Worn alone, the Tijoray pendant speaks for itself — a single stone, a single story, worn close to the skin.',
                img: asset('/assets/editorial/wear-solo.png'),
                alt: 'Tijoray pendant worn solo',
              },
              {
                label: 'Stacked',
                desc: 'Multiple Tijoray pendants on a single chain — each stone a different month, a different person, a different memory.',
                img: asset('/assets/editorial/wear-stacked.png'),
                alt: 'Multiple Tijoray pendants on one chain',
              },
              {
                label: 'Layered',
                desc: 'Pair your Tijoray pendant with other necklaces at varying lengths — the pendant sits naturally at collarbone height.',
                img: asset('/assets/editorial/wear-layered.png'),
                alt: 'Tijoray pendant layered with other necklaces',
              },
            ].map(w => (
              <div key={w.label} className={styles.wearCard}>
                <div className={styles.wearImageWrap}>
                  <img src={w.img} alt={w.alt} />
                </div>
                <h3 className={styles.wearLabel}>{w.label}</h3>
                <p className={styles.wearDesc}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
