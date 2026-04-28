import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import styles from './ScrollStory.module.css'
import { ASSETS, asset } from '../lib/assets'

/* ── Utilities ─────────────────────────────────────────── */
function clamp(v: number, lo: number, hi: number) { return v < lo ? lo : v > hi ? hi : v }
function phaseVal(p: number, start: number, end: number) { return clamp((p - start) / (end - start), 0, 1) }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function easeOut(t: number, exp = 2.5) { return 1 - Math.pow(1 - clamp(t, 0, 1), exp) }

/* ── Phase map ─────────────────────────────────────────── */
const P = {
  rot:    [0.00, 0.28],  // pendant rotates back→front
  arrive: [0.28, 0.43],  // phone slides up
  tilt:   [0.43, 0.58],  // phone tilts, NFC pulses, pendant fades
  reveal: [0.58, 0.72],  // phone untilts + centres
  conn:   [0.72, 1.00],  // flash fires instantly, Connected Piece slides in
}

/* ── Caption data ──────────────────────────────────────── */
const CAPTIONS = [
  { eyebrow: 'Fine Jewellery', title: 'Crafted to last.<br><em>Built to remember.</em>' },
  { eyebrow: 'Your Private Vault', title: 'Tap your piece.<br><em>Your memories open.</em>' },
]

export default function ScrollStory() {
  /* Canvas & overlay refs */
  const canvasRef        = useRef<HTMLCanvasElement>(null)
  const storyRef         = useRef<HTMLElement>(null)
  const videoWrapRef     = useRef<HTMLDivElement>(null)
  const capWrapRef       = useRef<HTMLDivElement>(null)
  const capEyebrowRef    = useRef<HTMLParagraphElement>(null)
  const capTitleRef      = useRef<HTMLHeadingElement>(null)
  const phoneAnchorRef   = useRef<HTMLDivElement>(null)
  const phoneMoverRef    = useRef<HTMLDivElement>(null)
  const phoneWrapRef     = useRef<HTMLDivElement>(null)
  const phoneEstRef      = useRef<HTMLImageElement>(null)
  const phoneConnRef     = useRef<HTMLImageElement>(null)
  const nfcPulseRef      = useRef<HTMLDivElement>(null)
  const connTextRef      = useRef<HTMLDivElement>(null)
  const loadingFillRef   = useRef<HTMLDivElement>(null)
  const loadingBarRef    = useRef<HTMLDivElement>(null)
  const phoneEstabRef    = useRef<HTMLImageElement>(null)
  const flashRef         = useRef<HTMLDivElement>(null)
  const dot0Ref          = useRef<HTMLButtonElement>(null)
  const dot1Ref          = useRef<HTMLButtonElement>(null)
  const dot2Ref          = useRef<HTMLButtonElement>(null)
  const dot3Ref          = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* ── Three.js Scene ────────────────────────────────── */
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000)
    camera.position.set(0, 0, 6)

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(700, 700, false)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // HDR studio environment — real reflections on gold links
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    new RGBELoader().load(
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr',
      (hdr) => {
        const envMap = pmrem.fromEquirectangular(hdr).texture
        scene.environment = envMap
        hdr.dispose()
        pmrem.dispose()
      }
    )

    // Minimal direct lights — environment map does the heavy lifting
    scene.add(new THREE.AmbientLight(0xffffff, 0.15))

    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.8)
    keyLight.position.set(3, 5, 3)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0xaaccff, 0.5)
    rimLight.position.set(-2, -1, -3)
    scene.add(rimLight)

    let pendantModel: THREE.Object3D | null = null
    let animFrameId: number | null = null
    let destroyed = false

    // Resize renderer to match canvas display size (handles mobile/orientation change)
    function resizeRenderer() {
      const w = canvas!.clientWidth || 700
      const h = canvas!.clientHeight || 700
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resizeRenderer()

    // Position loading bar overlay to match the baked-in bar in the image.
    // The image (1625×3684) is rendered with object-fit:cover object-position:top.
    // Since image AR (0.4412) < phoneScreens AR, cover scales by width.
    // Bar in image: y=2652px (71.98%), x from 24.7% to 76.4%
    const IMG_W = 1625, IMG_H = 3684
    const BAR_Y_FRAC = 2652 / IMG_H   // 0.7198
    const BAR_L_FRAC = 0.247
    const BAR_R_FRAC = 1 - 0.764      // right inset

    function positionLoadingBar() {
      const bar = loadingBarRef.current
      const screens = bar?.parentElement as HTMLElement | null
      if (!bar || !screens) return

      const psW = screens.clientWidth
      const psH = screens.clientHeight
      if (!psW || !psH) return

      // Scale = psW / IMG_W (cover scales by width when img_ar < ps_ar)
      const scale = psW / IMG_W
      const dispH = IMG_H * scale           // displayed image height in px
      const barY  = BAR_Y_FRAC * dispH     // bar center in px from top of displayed image

      bar.style.top    = `${barY}px`
      bar.style.left   = `${BAR_L_FRAC * 100}%`
      bar.style.right  = `${BAR_R_FRAC * 100}%`
    }
    positionLoadingBar()

    // Continuous render loop
    let rotProg = 0
    function animLoop() {
      if (destroyed) return
      animFrameId = requestAnimationFrame(animLoop)
      if (!prefersReduced && pendantModel) {
        pendantModel.rotation.y = Math.PI * (1 - easeOut(rotProg, 1.8))
      }
      renderer.render(scene, camera)
    }
    animLoop()

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)

    gltfLoader.load(ASSETS.pendantScroll, (gltf) => {
      if (destroyed) return

      const model = gltf.scene

      // Step 1 — correct Z-up export (common in jewelry tools): rotate so pendant faces camera
      model.rotation.x = Math.PI / 2    // stand it upright from Z-up (flipped)
      model.rotation.z = 0
      model.updateMatrixWorld(true)

      // Step 2 — measure bounds after upright correction and scale to 2 world-units
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale  = maxDim > 0 ? 2.0 / maxDim : 1
      model.scale.setScalar(scale)
      model.updateMatrixWorld(true)

      // Step 4 — re-centre on origin
      const box2   = new THREE.Box3().setFromObject(model)
      const center2 = box2.getCenter(new THREE.Vector3())
      model.position.sub(center2)
      model.updateMatrixWorld(true)

      // Step 5 — wrap in a pivot group so Y-rotation scrolls cleanly
      const pivot = new THREE.Group()
      pivot.add(model)
      pivot.rotation.y = Math.PI   // start showing back, scroll rewinds to stone face
      pendantModel = pivot

      // Step 6 — move camera up to frame just the pendant gem, not the full chain.
      // The gem is near the bottom of the pendant; the chain hangs above.
      // We shift the camera's target upward so the chain exits top of frame.
      const box3 = new THREE.Box3().setFromObject(pivot)
      const modelHeight = box3.max.y - box3.min.y
      const gemY = box3.min.y + modelHeight * 0.22
      camera.position.set(0, gemY, 1.4)
      camera.lookAt(0, gemY, 0)

      // Apply proper PBR materials — gold vs gem detected by mesh name / color
      pivot.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach((mat, idx) => {
          if (!mat) return
          const std = mat as THREE.MeshStandardMaterial
          const col = std.color ?? new THREE.Color(1, 1, 1)
          // Gem heuristic: very dark base color (onyx, black stone)
          const isGem = col.r < 0.12 && col.g < 0.12 && col.b < 0.12

          if (isGem) {
            // Glassy onyx — deep black with sharp surface reflections
            const gemMat = new THREE.MeshPhysicalMaterial({
              color: 0x050508,
              metalness: 0.0,
              roughness: 0.05,
              reflectivity: 1.0,
              envMapIntensity: 3.0,
              clearcoat: 1.0,
              clearcoatRoughness: 0.05,
            })
            if (Array.isArray(child.material)) {
              child.material[idx] = gemMat
            } else {
              child.material = gemMat
            }
          } else {
            // Polished 18K gold
            std.metalness = 1.0
            std.roughness = 0.22
            std.envMapIntensity = 3.5
            std.needsUpdate = true
          }
        })
      })

      scene.add(pivot)
    }, undefined, (err) => {
      console.error('[Tijoray] GLB load error:', err)
    })

    /* ── State ─────────────────────────────────────────── */
    let lastY      = -1
    let rafId: number | null = null
    let activeCh   = 0
    let flashFired = false

    const dotRefs = [dot0Ref, dot1Ref, dot2Ref, dot3Ref]

    /* ── Main render ───────────────────────────────────── */
    function render() {
      rafId = null

      const scrollY = window.scrollY
      if (Math.abs(scrollY - lastY) < 0.5) return
      lastY = scrollY

      const story = storyRef.current
      if (!story) return

      const rect       = story.getBoundingClientRect()
      const storyRange = story.offsetHeight - window.innerHeight
      const p          = clamp(-rect.top / storyRange, 0, 1)

      /* Phase progress */
      rotProg          = phaseVal(p, P.rot[0],    P.rot[1])
      const arriveProg = phaseVal(p, P.arrive[0], P.arrive[1])
      const tiltProg   = phaseVal(p, P.tilt[0],   P.tilt[1])
      const revealProg = phaseVal(p, P.reveal[0], P.reveal[1])
      const connProg   = phaseVal(p, P.conn[0],   P.conn[1])

      // Skip all scroll-driven animations for reduced-motion users
      if (prefersReduced) return

      /* Pendant fade */
      if (videoWrapRef.current) {
        const pendFadeStart = P.tilt[0]
        const pendFadeEnd   = lerp(P.tilt[0], P.tilt[1], 0.85)
        videoWrapRef.current.style.opacity = String(clamp(
          1 - (p - pendFadeStart) / (pendFadeEnd - pendFadeStart), 0, 1
        ))
      }

      /* Pendant caption */
      if (capWrapRef.current) {
        let capOpacity = 0
        if (p < P.rot[1]) {
          capOpacity = p < 0.04
            ? p / 0.04
            : p > P.rot[1] - 0.06
            ? clamp(1 - (p - (P.rot[1] - 0.06)) / 0.06, 0, 1)
            : 1
        }
        capWrapRef.current.style.opacity = String(capOpacity)
        const c = rotProg < 0.5 ? CAPTIONS[0] : CAPTIONS[1]
        if (capEyebrowRef.current && capEyebrowRef.current.textContent !== c.eyebrow) {
          capEyebrowRef.current.textContent = c.eyebrow
        }
        if (capTitleRef.current && capTitleRef.current.innerHTML !== c.title) {
          capTitleRef.current.innerHTML = c.title
        }
      }

      const isMobile = window.innerWidth <= 768

      /* Phone vertical position */
      let ty = 50
      if (p >= P.arrive[0]) ty = lerp(50, 32, easeOut(arriveProg, 2.8))
      if (p >= P.tilt[0])   ty = 32
      if (p >= P.reveal[0]) ty = lerp(32, 0, easeOut(revealProg, 2.5))

      // Desktop: phone shifts left to make room for text panel
      // Mobile: phone shifts up to make room for text below
      const connShift = isMobile ? 0 : lerp(0, -13, easeOut(connProg, 2.2))
      // Phone center sits at 50vh by default. Rise -16vh → center at 34vh.
      // Phone is 48vh tall → bottom edge at 34+24=58vh. Text starts at 60vh.
      const connRise  = isMobile ? lerp(0, -16, easeOut(connProg, 2.2)) : 0

      if (phoneAnchorRef.current) {
        phoneAnchorRef.current.style.opacity = p >= P.arrive[0] ? '1' : '0'
      }
      if (phoneMoverRef.current) {
        phoneMoverRef.current.style.transform = `translate(${connShift}vw, calc(${ty}vh + ${connRise}vh))`
      }

      /* Phone tilt */
      if (phoneWrapRef.current) {
        const tiltAngle = Math.sin(tiltProg * Math.PI) * 14
        phoneWrapRef.current.style.transform = `translate(-50%, -50%) rotateX(${tiltAngle}deg)`
      }

      /* Loading bar — 25% during tilt, 25%→100% during reveal */
      const tiltBarProg   = phaseVal(p, P.tilt[0], P.tilt[1])   // 0→1 during tilt
      const revealBarProg = phaseVal(p, P.reveal[0], P.reveal[1]) // 0→1 during reveal
      const barWidth = p < P.reveal[0]
        ? easeOut(tiltBarProg, 1.4) * 25           // 0→25% during tilt
        : 25 + easeOut(revealBarProg, 1.4) * 75   // 25→100% during reveal

      if (loadingFillRef.current) {
        loadingFillRef.current.style.width = `${barWidth}%`
      }
      // Bar overlay hides once reveal is complete (bar hit 100%)
      if (loadingFillRef.current?.parentElement) {
        const barWrap = loadingFillRef.current.parentElement as HTMLElement
        barWrap.style.opacity = p >= P.reveal[1] ? '0' : '1'
      }

      /* Phone screens — 3-screen sequence */
      // Screen 1: Establishing Connection — visible through reveal, fades out at end of reveal
      if (phoneEstRef.current) {
        const estFadeOut = phaseVal(p, lerp(P.reveal[0], P.reveal[1], 0.7), P.reveal[1])
        phoneEstRef.current.style.opacity = String(clamp(1 - estFadeOut, 0, 1))
      }

      // Screen 2: Connection Established — fades in at end of reveal, fades out when conn begins
      if (phoneEstabRef.current) {
        const estabFadeIn  = phaseVal(p, lerp(P.reveal[0], P.reveal[1], 0.6), P.reveal[1])
        const estabFadeOut = clamp(connProg / 0.2, 0, 1)
        const alpha = p < P.conn[0]
          ? clamp(estabFadeIn, 0, 1)
          : clamp(1 - estabFadeOut, 0, 1)
        phoneEstabRef.current.style.opacity = String(alpha)
      }

      // Screen 3: Connected Piece — slides up during conn phase
      if (phoneConnRef.current) {
        const connScreenT = easeOut(connProg, 2.5)
        phoneConnRef.current.style.opacity = String(clamp((connProg - 0.15) / 0.15, 0, 1))
        phoneConnRef.current.style.transform = `translateY(${lerp(100, 0, connScreenT)}%)`
      }

      /* NFC pulse */
      if (nfcPulseRef.current) {
        const nfcStart = lerp(P.tilt[0], P.tilt[1], 0.4)
        nfcPulseRef.current.style.opacity = (p >= nfcStart && p < P.reveal[1]) ? '1' : '0'
      }

      /* Connection established flash */
      if (flashRef.current) {
        if (connProg > 0.08 && !flashFired) {
          flashFired = true
          flashRef.current.classList.remove(styles.pop)
          void flashRef.current.offsetWidth
          flashRef.current.classList.add(styles.pop)
        }
        if (connProg === 0) flashFired = false
      }

      /* Connected text panel */
      if (connTextRef.current) {
        const connTextAlpha = clamp(connProg / 0.14, 0, 1)
        connTextRef.current.style.opacity = String(connTextAlpha)
        if (isMobile) {
          // top: 50% = 50vh. translateY(10vh) → text starts at 60vh. 2vh gap below phone.
          const slideY = lerp(5, 0, easeOut(connProg, 2.5))
          connTextRef.current.style.transform = `translateY(calc(10vh + ${slideY}vh))`
        } else {
          // Slide in from right on desktop
          const connTextSlide = lerp(56, 16, easeOut(connProg, 2.5))
          connTextRef.current.style.transform = `translate(${connTextSlide}vw, -50%)`
        }
      }

      /* Chapter dots */
      let ch = 0
      if (p >= P.conn[0] + 0.1)  ch = 3
      else if (p >= P.conn[0])   ch = 2
      else if (p >= P.arrive[0]) ch = 1

      if (ch !== activeCh) {
        const prev = dotRefs[activeCh].current
        const next = dotRefs[ch].current
        if (prev) prev.classList.remove(styles.active)
        if (next) next.classList.add(styles.active)
        activeCh = ch
      }
    }

    function onScroll() {
      if (!rafId) rafId = requestAnimationFrame(render)
    }

    function onResize() {
      resizeRenderer()
      positionLoadingBar()
      onScroll()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    onScroll()

    return () => {
      destroyed = true
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (rafId) cancelAnimationFrame(rafId)
      if (animFrameId) cancelAnimationFrame(animFrameId)
      dracoLoader.dispose()
      renderer.dispose()
    }
  }, [])

  function scrollToChapter(ch: number) {
    const story = storyRef.current
    if (!story) return
    const storyRange = story.offsetHeight - window.innerHeight
    const fractions = [0, P.arrive[0], P.conn[0], P.conn[0] + 0.1]
    const targetScroll = story.offsetTop + fractions[ch] * storyRange
    window.scrollTo({ top: targetScroll, behavior: 'smooth' })
  }

  return (
    <section id="scroll-story" ref={storyRef} className={styles.scrollStory} aria-label="Product Story">
      <div className={styles.stickyStage} id="sticky-stage">
        <div className={styles.stageGlow} aria-hidden="true" />

        {/* Pendant 3D canvas */}
        <div ref={videoWrapRef} className={styles.videoWrap}>
          <canvas
            ref={canvasRef}
            className={styles.pendantCanvas}
            role="img"
            aria-label="Tijoray pendant 3D view"
          />
        </div>

        {/* Caption beneath pendant */}
        <div ref={capWrapRef} className={styles.pendantCaption} aria-hidden="true">
          <p ref={capEyebrowRef} className={styles.capEyebrow}>Handcrafted Heirloom</p>
          <h2 ref={capTitleRef} className={styles.capTitle}>Your Story, <em>Set in Stone</em></h2>
        </div>

        {/* Phone animation */}
        <div ref={phoneAnchorRef} id="phone-anchor" className={styles.phoneAnchor} aria-label="Tijoray app connection sequence">
          <div ref={phoneMoverRef} className={styles.phoneMover}>
            <div ref={phoneWrapRef} className={styles.phoneWrap}>
              <div className={styles.phoneIsland} aria-hidden="true" />
              <div className={styles.phoneScreens}>
                <img
                  ref={phoneEstRef}
                  className={styles.phoneScreen}
                  src={asset('/assets/jewelry/nfc-establishing.png')}
                  alt="App: establishing NFC connection with pendant"
                  style={{ opacity: 1 }}
                />
                <img
                  ref={phoneEstabRef}
                  className={styles.phoneScreen}
                  src={asset('/assets/jewelry/nfc-established.png')}
                  alt="App: connection established"
                />
                <img
                  ref={phoneConnRef}
                  className={styles.phoneScreen}
                  src={asset('/assets/jewelry/nfc-connected.png')}
                  alt="App: connected piece vault — Aurelia Infinite"
                />
                {/* Animated loading bar overlay — JS-positioned to pixel-match the image bar */}
                <div ref={loadingBarRef} className={styles.loadingBarWrap} aria-hidden="true">
                  <div ref={loadingFillRef} className={styles.loadingBarFill} />
                </div>
              </div>
              {/* NFC pulse inside phone-wrap */}
              <div ref={nfcPulseRef} className={styles.nfcPulse} aria-hidden="true">
                <div className={styles.nfcRing} />
                <div className={styles.nfcRing} />
                <div className={styles.nfcRing} />
              </div>
            </div>
          </div>
        </div>

        {/* Connected phase text panel */}
        <div ref={connTextRef} className={styles.connTextPanel} role="region" aria-label="Vault features">
          <p className={styles.connEyebrow}>Your Digital Vault</p>
          <div className={styles.connRule} />
          <h2 className={styles.connHeadline}>
            One Piece.<br /><em>A Lifetime</em><br />of Memory.
          </h2>
          <ul className={styles.connList}>
            <li>
              <div className={styles.connListBar} />
              <div>
                <strong>Certificate of Authenticity</strong>
                <span>Provenance and material purity verified &amp; sealed by Tijoray</span>
              </div>
            </li>
            <li>
              <div className={styles.connListBar} />
              <div>
                <strong>Personal Archive</strong>
                <span>Photographs, voice notes, letters — encrypted inside your jewel</span>
              </div>
            </li>
            <li>
              <div className={styles.connListBar} />
              <div>
                <strong>Access Your Vault</strong>
                <span>Tap with any NFC device to reveal your private memories</span>
              </div>
            </li>
            <li>
              <div className={styles.connListBar} />
              <div>
                <strong>Generational Transfer</strong>
                <span>Pass the piece — and the vault — to those who come after you</span>
              </div>
            </li>
          </ul>
          <div className={styles.statusBadge}>
            <svg className={styles.checkIcon} viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="#BFA15F" strokeWidth="1" />
              <path d="M4 7l2 2 4-4" stroke="#BFA15F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className={styles.badgeLabel}>Legacy Secured</span>
          </div>
        </div>

        {/* Connection established gold flash */}
        <div ref={flashRef} className={styles.establishFlash} aria-hidden="true" />

        {/* Chapter navigation dots */}
        <div className={styles.chapterNav} aria-label="Story chapters">
          {[0,1,2,3].map(i => (
            <button
              key={i}
              ref={[dot0Ref,dot1Ref,dot2Ref,dot3Ref][i]}
              className={i === 0 ? `${styles.chDot} ${styles.active}` : styles.chDot}
              onClick={() => scrollToChapter(i)}
              aria-label={`Go to chapter ${i + 1}`}
              title={`Chapter ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
