import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import styles from './ConfiguratorPage.module.css'
import { ASSETS } from '../lib/assets'

/* ── Types ─────────────────────────────────────────────── */
type Shape      = 'square' | 'circle' | 'heart' | 'pear'
type Metal      = 'steel' | 'silver' | '10k' | '18k'
type MetalColor = 'white' | 'gold' | 'rose'

/* ── Constants ─────────────────────────────────────────── */
const CHAIN_PATH = ASSETS.chain

const PENDANT_PATHS: Record<Shape, string> = {
  square: ASSETS.pendantSquare,
  circle: ASSETS.pendantCircle,
  heart:  ASSETS.pendantHeart,
  pear:   ASSETS.pendantPear,
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

// UI swatch colors (approximate visual representation)
const BIRTHSTONE_COLORS = [
  '#9B1B30', '#9B59B6', '#7EC8C8', '#F2F2FF',
  '#2ECC71', '#D4AF8A', '#CC0000', '#93C572',
  '#154EC1', '#FF6EB4', '#E4A800', '#3BC4C4',
]

const BIRTHSTONE_NAMES = [
  'Garnet', 'Amethyst', 'Aquamarine', 'White Topaz',
  'Emerald', 'Pearl', 'Ruby', 'Peridot',
  'Sapphire', 'Pink Tourmaline', 'Citrine', 'Turquoise',
]

// Per-gem physical material properties for realistic rendering.
// transmission + IOR + attenuation = subsurface color/clarity of real stones.
const GEM_PROPS = [
  // Garnet — deep red, high-RI, brilliant
  { color: '#A01520', ior: 1.78, transmission: 0.70, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0, envMapIntensity: 5.0, attenuationColor: '#C02030', attenuationDistance: 1.0,  iridescence: 0, iridescenceIOR: 1.3 },
  // Amethyst — purple quartz, clear
  { color: '#8B3FBB', ior: 1.54, transmission: 0.88, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0, envMapIntensity: 4.5, attenuationColor: '#A855CC', attenuationDistance: 1.5,  iridescence: 0, iridescenceIOR: 1.3 },
  // Aquamarine — pale blue beryl, very clear
  { color: '#7ECFE0', ior: 1.57, transmission: 0.93, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0, envMapIntensity: 4.5, attenuationColor: '#A0E0EE', attenuationDistance: 3.0,  iridescence: 0, iridescenceIOR: 1.3 },
  // White Topaz — colourless, crisp reflections
  { color: '#E8EEFF', ior: 1.62, transmission: 0.88, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0, envMapIntensity: 4.0, attenuationColor: '#F0F2FF', attenuationDistance: 4.0,  iridescence: 0, iridescenceIOR: 1.3 },
  // Emerald — rich green, slightly included
  { color: '#22873A', ior: 1.58, transmission: 0.62, thickness: 0.4, roughness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.05, envMapIntensity: 4.5, attenuationColor: '#38A850', attenuationDistance: 0.8, iridescence: 0, iridescenceIOR: 1.3 },
  // Pearl — opaque, iridescent nacre
  { color: '#F5EFE0', ior: 1.53, transmission: 0.00, thickness: 0.5, roughness: 0.15, clearcoat: 0.7, clearcoatRoughness: 0.10, envMapIntensity: 3.0, attenuationColor: '#FFFFFF', attenuationDistance: 4.0,  iridescence: 0.90, iridescenceIOR: 1.5  },
  // Ruby — deep red corundum, brilliant
  { color: '#B80010', ior: 1.77, transmission: 0.68, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0, envMapIntensity: 5.0, attenuationColor: '#D81828', attenuationDistance: 1.0,  iridescence: 0, iridescenceIOR: 1.3 },
  // Peridot — bright lime-green olivine
  { color: '#7DC040', ior: 1.67, transmission: 0.85, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0, envMapIntensity: 4.5, attenuationColor: '#A8D868', attenuationDistance: 2.0,  iridescence: 0, iridescenceIOR: 1.3 },
  // Sapphire — deep blue corundum, brilliant
  { color: '#1840C0', ior: 1.77, transmission: 0.65, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0, envMapIntensity: 5.0, attenuationColor: '#2858E0', attenuationDistance: 1.2,  iridescence: 0, iridescenceIOR: 1.3 },
  // Pink Tourmaline — warm pink, semi-transparent
  { color: '#D85080', ior: 1.63, transmission: 0.80, thickness: 0.4, roughness: 0.02, clearcoat: 1.0, clearcoatRoughness: 0.0, envMapIntensity: 4.5, attenuationColor: '#F078A8', attenuationDistance: 1.8,  iridescence: 0, iridescenceIOR: 1.3 },
  // Citrine — warm golden quartz
  { color: '#D4980A', ior: 1.54, transmission: 0.86, thickness: 0.4, roughness: 0.01, clearcoat: 1.0, clearcoatRoughness: 0.0, envMapIntensity: 4.5, attenuationColor: '#F0B820', attenuationDistance: 2.0,  iridescence: 0, iridescenceIOR: 1.3 },
  // Turquoise — opaque, waxy blue-green
  { color: '#30AEAE', ior: 1.61, transmission: 0.00, thickness: 0.5, roughness: 0.35, clearcoat: 0.2, clearcoatRoughness: 0.30, envMapIntensity: 2.5, attenuationColor: '#FFFFFF', attenuationDistance: 4.0,  iridescence: 0, iridescenceIOR: 1.3 },
] as const

const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
]

const STONE_MEANINGS = [
  'Devotion and protection on new journeys.',
  'Clarity of mind, sincerity, and inner peace.',
  'Courage, calm, and clarity in turbulent waters.',
  'Eternal love, strength, and invincibility.',
  'Hope, rebirth, and the endurance of love.',
  'Purity and wisdom earned through experience.',
  'Passion, vitality, and the fire of commitment.',
  'Strength, purpose, and a light that cannot be dimmed.',
  'Truth, loyalty, and the wisdom of the ages.',
  'Compassion, healing, and emotional depth.',
  'Joy, abundance, and the warmth of generosity.',
  'Protection, friendship, and good fortune.',
]

const BUILD_DURATION  = 900 // ms — fade + drift animation
const BUILD_DRIFT_Y   = -0.07 // world-units below final position at animation start

/* ── Helpers ───────────────────────────────────────────── */
function easeOutCubic(t: number) { return 1 - Math.pow(1 - Math.min(t, 1), 3) }

// Gem mesh detection — matched against material name, mesh name, and parent node name
const GEM_NAME_RE = /garnet|amethyst|aquamarine|diamond|emerald|pearl|ruby|peridot|sapphire|tourmaline|citrine|turquoise|gem|stone|crystal/i

// Heart/pear gem meshes may have inconsistent normals due to how they're modelled
// as inset cavities. DoubleSide ensures correct glass rendering regardless of normal direction.
const BEZEL_SHAPES = new Set<Shape>(['heart', 'pear'])

function createGemMaterial(stoneIdx: number, shape: Shape | null = null): THREE.MeshPhysicalMaterial {
  const g = GEM_PROPS[stoneIdx]
  const inset = shape !== null && BEZEL_SHAPES.has(shape)

  const baseColor = new THREE.Color(g.color)

  // Heart/pear gems: the mesh face may have inconsistent normals (inward-pointing)
  // because the gem is modelled as an inset cavity. DoubleSide ensures both the
  // front and back glass surfaces contribute to the render, which restores the
  // glassy refraction/caustic look regardless of normal direction.
  // We also boost envMapIntensity so the IOR-driven surface reflections are vivid.
  return new THREE.MeshPhysicalMaterial({
    color:               baseColor,
    ior:                 g.ior,
    transmission:        g.transmission,
    thickness:           g.thickness,
    roughness:           g.roughness,
    metalness:           0,
    clearcoat:           g.clearcoat,
    clearcoatRoughness:  g.clearcoatRoughness,
    envMapIntensity:     inset ? g.envMapIntensity * 2.0 : g.envMapIntensity,
    attenuationColor:    new THREE.Color(g.attenuationColor),
    attenuationDistance: g.attenuationDistance,
    iridescence:         g.iridescence,
    iridescenceIOR:      g.iridescenceIOR,
    side:                inset ? THREE.DoubleSide : THREE.FrontSide,
  })
}

export default function ConfiguratorPage() {
  const { addItem } = useCart()
  const navigate    = useNavigate()

  /* ── State ── */
  const [shape,       setShape]       = useState<Shape | null>(null)
  const [metal,       setMetal]       = useState<Metal>('18k')
  const [metalColor,  setMetalColor]  = useState<MetalColor>('gold')
  const [birthstone,  setBirthstone]  = useState<number>(0)
  const [loading,     setLoading]     = useState(false)
  const [isTouch,     setIsTouch]     = useState(false)

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
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr',
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
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    loader.setMeshoptDecoder(MeshoptDecoder)

    if (!chainCacheRef.current) {
      loader.load(CHAIN_PATH, (gltf) => { chainCacheRef.current = gltf.scene })
    }

    ;(Object.keys(PENDANT_PATHS) as Shape[]).forEach((s) => {
      if (pendantCacheRef.current[s]) return
      loader.load(PENDANT_PATHS[s], (gltf) => {
        pendantCacheRef.current[s] = gltf.scene
      })
    })

    return () => { dracoLoader.dispose() }
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

    // ── Align pendant bail to stored chain attach point ─────────────────────
    function positionPendant(pendantModel: THREE.Group) {
      const pendantBox  = new THREE.Box3().setFromObject(pendantModel)
      const pendantSize = pendantBox.getSize(new THREE.Vector3())
      const pendantTop  = new THREE.Vector3(
        (pendantBox.min.x + pendantBox.max.x) / 2,
        pendantBox.max.y,
        (pendantBox.min.z + pendantBox.max.z) / 2,
      )
      const offset = chainAttachRef.current!.clone().sub(pendantTop)
      offset.y += pendantSize.y * 0.21
      offset.z += pendantSize.x * 0.05
      pendantModel.position.add(offset)
      pendantModel.updateMatrixWorld(true)
    }

    // ── Add pendant to scene with build-in animation ─────────────────────────
    function onPendantReady(pendantSrc: THREE.Group) {
      if (cancelled || destroyedRef.current) return

      const pendantModel = pendantSrc.clone(true)
      pendantModel.rotation.x = Math.PI / 2
      pendantModel.scale.setScalar(assemblyScaleRef.current)
      pendantModel.updateMatrixWorld(true)

      positionPendant(pendantModel)

      const pivot = new THREE.Group()
      pivot.add(pendantModel)
      pivot.updateMatrixWorld(true)

      const gemMats:  THREE.MeshPhysicalMaterial[] = []
      const bodyMats: THREE.MeshStandardMaterial[]  = []
      const bodyColor = snapMetal === 'steel'
        ? new THREE.Color(STEEL_COLOR)
        : new THREE.Color(METAL_COLOR_HEX[snapColor])

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

      const chainModel = chainSrc.clone(true)
      chainModel.rotation.x = Math.PI / 2
      chainModel.updateMatrixWorld(true)

      const box1   = new THREE.Box3().setFromObject(chainModel)
      const size1  = box1.getSize(new THREE.Vector3())
      const maxDim = Math.max(size1.x, size1.y, size1.z)
      const scale  = maxDim > 0 ? 2.5 / maxDim : 1
      chainModel.scale.setScalar(scale)
      chainModel.updateMatrixWorld(true)

      // Centre the chain, then read the final bbox once for the attach point
      const box2 = new THREE.Box3().setFromObject(chainModel)
      chainModel.position.sub(box2.getCenter(new THREE.Vector3()))
      chainModel.updateMatrixWorld(true)

      assemblyScaleRef.current = scale
      const box3 = new THREE.Box3().setFromObject(chainModel)
      chainAttachRef.current = new THREE.Vector3(
        (box3.min.x + box3.max.x) / 2,
        box3.min.y,
        (box3.min.z + box3.max.z) / 2,
      )

      scene.add(chainModel)
      chainGroupRef.current = chainModel
      onPendantReady(pendantSrc)
    }

    // ── Loading coordination ─────────────────────────────────────────────────
    const chainInScene  = !!chainGroupRef.current
    const chainCached   = !!chainCacheRef.current
    const pendantCached = !!pendantCacheRef.current[shapeKey]

    if (!pendantCached || (!chainInScene && !chainCached)) setLoading(true)

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    loader.setMeshoptDecoder(MeshoptDecoder)

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

    return () => { cancelled = true; dracoLoader.dispose() }
  // metal/metalColor/birthstone intentionally excluded — Effects 3 & 4 mutate
  // existing materials directly so the GLB never needs to reload for those changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape])

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
            <p className={styles.orbitHint} aria-hidden="true">
              {isTouch ? 'Drag to rotate · Pinch to zoom' : 'Drag to rotate · Scroll to zoom'}
            </p>
          </div>
        </div>

        {/* ── Right: Configurator ── */}
        <div className={styles.configPanel}>

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
                <span className={styles.tooltipWrap}>
                  <span className={styles.tooltipIcon} aria-label="About shape">?</span>
                  <span className={styles.tooltip} role="tooltip">
                    The foundation of your piece. The <strong>Square</strong> offers clean architectural lines and bold geometry. The <strong>Circle</strong> is a symbol of continuity — a loop with no beginning or end.
                  </span>
                </span>
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
          </section>

          {/* Step 2 — Base Metal */}
          <section className={styles.step}>
            <div className={styles.stepHeader}>
              <div className={styles.stepTitleRow}>
                <p className={styles.stepLabel}>02 — Base Metal</p>
                <span className={styles.tooltipWrap}>
                  <span className={styles.tooltipIcon} aria-label="About base metal">?</span>
                  <span className={styles.tooltip} role="tooltip">
                    The core material of your pendant. <strong>Steel</strong> is modern and resilient. <strong>Silver</strong> is classic and refined. <strong>10K Gold</strong> is 41.7% pure gold — durable for daily wear. <strong>18K Gold</strong> is 75% pure — the mark of a true heirloom.
                  </span>
                </span>
              </div>
              <span className={styles.stepLine} aria-hidden="true" />
            </div>
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
            <div className={styles.stepHeader}>
              <div className={styles.stepTitleRow}>
                <p className={styles.stepLabel}>03 — Metal Color</p>
                <span className={styles.tooltipWrap}>
                  <span className={styles.tooltipIcon} aria-label="About metal color">?</span>
                  <span className={styles.tooltip} role="tooltip">
                    The finish of your pendant's surface. <strong>White</strong> has a cool, platinum-like tone. <strong>Gold</strong> carries classic warmth. <strong>Rose</strong> blends copper's blush with gold's richness. Steel pieces are finished in their natural gunmetal tone.
                  </span>
                </span>
              </div>
              <span className={styles.stepLine} aria-hidden="true" />
            </div>
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
            <div className={styles.stepHeader}>
              <div className={styles.stepTitleRow}>
                <p className={styles.stepLabel}>04 — Birthstone</p>
                <span className={styles.tooltipWrap}>
                  <span className={styles.tooltipIcon} aria-label="About birthstone">?</span>
                  <span className={styles.tooltip} role="tooltip">
                    Each month carries a gemstone chosen across centuries for its beauty and meaning. Select a stone for your birth month, a loved one's, or any date that holds personal significance. Every stone is hand-set by our artisans.
                  </span>
                </span>
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
              disabled={!shape}
              aria-disabled={!shape}
              onClick={() => {
                if (!shape) return
                addItem({
                  shape,
                  metal,
                  metalColor,
                  birthstoneIndex: birthstone,
                  price: METAL_PRICES[metal],
                  specLine,
                })
                navigate('/cart')
              }}
            >
              {shape ? 'Add to Cart' : 'Select a Shape First'}
            </button>
            <Link to="/contact" className={styles.ctaSecondary}>
              Speak with the Atelier
            </Link>
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
              The tradition of birthstones stretches back to ancient civilisations —
              each stone assigned to a month not by chance, but by the qualities it
              was believed to carry: protection, clarity, passion, renewal.
            </p>
            <p className={styles.storyBody}>
              The Tijoray Pendant honours that tradition and extends it. Beneath the
              surface of each stone sits a passive NFC vault — no battery, no signal
              required — holding whatever you choose to preserve. A voice. A map.
              A letter. A photograph. The stone carries meaning. The vault carries memory.
            </p>
            <p className={styles.storyBody}>
              Together, they compose something that outlasts both.
            </p>
          </div>
          <div className={styles.storyImageWrap}>
            <img src="/assets/editorial/lifestyle-worn.png" alt="Tijoray pendant worn at the collarbone" />
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
            <img src="/assets/editorial/macro-finish.png" alt="Close-up of Tijoray pendant surface finish" />
          </div>
          <div className={styles.craftText}>
            <p className={styles.eyebrow}>Crafted to Last</p>
            <h2 className={styles.storyTitle}>Built for <em>a lifetime</em> of wear.</h2>
            <p className={styles.storyBody}>
              Every Tijoray pendant undergoes a multi-stage surface treatment before it
              leaves our atelier. Steel pieces are finished with PVD coating — a process
              used in aerospace and surgical instruments — achieving a hardness that
              resists daily scratching far beyond standard plating.
            </p>
            <p className={styles.storyBody}>
              Gold and silver pendants receive a final micron-thick rhodium or IP gold
              layer, bonded at the molecular level. The result is a surface that holds
              its colour, its lustre, and its precision-set stone through years of
              continuous wear.
            </p>
            <p className={styles.storyBody}>
              Every piece leaves under our Lifetime Heritage Guarantee — not a warranty,
              but a commitment that we will maintain your pendant for as long as it exists.
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
            Chain length can be adjusted at checkout.
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
                img: '/assets/editorial/wear-solo.png',
                alt: 'Tijoray pendant worn solo',
              },
              {
                label: 'Stacked',
                desc: 'Multiple Tijoray pendants on a single chain — each stone a different month, a different person, a different memory.',
                img: '/assets/editorial/wear-stacked.png',
                alt: 'Multiple Tijoray pendants on one chain',
              },
              {
                label: 'Layered',
                desc: 'Pair your Tijoray pendant with other necklaces at varying lengths — the pendant sits naturally at collarbone height.',
                img: '/assets/editorial/wear-layered.png',
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
