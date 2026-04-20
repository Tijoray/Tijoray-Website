# Tijoray Website Design and Plan

## Purpose

This document defines the design direction, content architecture, interaction model, and implementation plan for the Tijoray website. It reflects the current built state of all pages and serves as the living blueprint for future work.

**Last updated:** April 2026 — full audit after Technology page, Configurator, About, Contact builds.

---

## Brand Direction

Tijoray should feel like a luxury maison with a concealed technological core. The website needs to balance editorial warmth and high-end craftsmanship with the precision of secure digital infrastructure.

### Brand Pillars

- Eternal craftsmanship
- Private digital legacy
- Modern ritual and storytelling
- Bespoke composition and authorship
- Trust, authentication, and permanence

### Experience Goals

- Introduce Tijoray as memory-preserving jewelry, not generic accessories
- Make NFC and the digital vault feel magical but credible
- Guide users from intrigue to configuration with minimal friction
- Preserve a premium, deliberate pace across motion and content

---

## Confirmed Language From the App

- Product vocabulary consistently uses atelier language: "Atelier", "Vault", and "Digital Atelier"
- Trust states use explicit certification language: "Vault Secure", "Vault Certified", "Purity Verified", and "Verification secured BY TIJORAY"
- Material metadata is presented as elevated specification blocks: "Metal Type", "Metal Color", and "Metal Purity"
- The app emphasizes permanence and provenance through phrases like "Your legacy, secured" and "permanent digital archive"
- The vault is framed as intimate and archival, not social: "A sanctuary for your most precious digital memories"
- Media examples include certificates, photos, and audio, with content such as "Certificate_042.pdf", "Paris Unveiling", and "Heartbeat"
- Rose gold is a flagship visual cue and should be treated as a hero finish, not a secondary option
- The collection language feels named and editorial, such as "Aurelia Infinite"
- **Product line branding:** The pendant configurator is part of the **Birthstone Series** (future: Birthstone Bracelet)

---

## Visual System

### Core Palette (CSS variables — implemented in `src/index.css`)

```css
--cream:        #F7F7F2   /* primary background */
--cream-warm:   #EFE8DE   /* secondary background */
--dark-story:   #111111   /* scroll story and footer */
--dark-surface: #181818
--dark:         #1D1A19
--onyx:         #0A0A0A
--ink:          #1D1A19   /* primary text on light */
--ink-mid:      #4D4641   /* secondary text on light */
--ink-soft:     rgba(29,26,25,0.45)
--text-light:   #F5F0E8   /* primary text on dark */
--text-muted:   rgba(245,240,232,0.75)  /* body text on dark — min 75% opacity */
--text-dim:     rgba(245,240,232,0.55)  /* footer legal only */
--rose:         #B97A6A   /* PRIMARY accent */
--rose-deep:    #9A5F51
--gold:         #BFA15F   /* secondary accent */
--gold-soft:    #D8C28A
--burgundy:     #4A2326   /* supporting accent */
--burgundy-h:   #5D2C30
--border-soft:  #D9D1C6
```

### Typography (implemented)

- **Heading font:** Cormorant Garamond (300, 400, 500, 600 + italics)
- **Body font:** Montserrat (300, 400, 500, 600)
- **Minimum sizes:** body text 13px desktop / 14px mobile; labels/eyebrows 10px desktop / 11px mobile; nav links 13px; buttons 12px; footer col headers 11px
- **Minimum weight for readable body copy:** 400 (never 300 at small sizes)
- Rose gold eyebrows on cream have a contrast ratio of ~2.8:1 — use for decorative/short labels only, not long-form text

### UI Principles

- Use large quiet spaces and restrained copy density
- Prioritize contrast over ornament
- Use gold sparingly for validation, security, and premium highlights
- Use rose gold gradients and reflections as product accents
- Keep cards, borders, and dividers soft and tactile, not glassy or neon
- Buttons should feel weighty and formal

---

## Routing (React Router v7 — implemented)

| Path | Page | Status |
|------|------|--------|
| `/` | Homepage | ✅ Built |
| `/about` | About Us (Atelier) | ✅ Built |
| `/contact` | Contact Us | ✅ Built |
| `/build` | Pendant Configurator | ✅ Built |
| `/technology` | Technology | ✅ Built |

---

## Navigation (built)

- Fixed navbar, three states: transparent (over cream hero), `.in-dark` (over dark scroll story), `.frosted` (cream frosted glass)
- Logo: `Tijoray Logo.png` with dark/light filter switching
- Links: **Collection** (#), **Technology** (`/technology`), **Atelier** (`/about`), **Journal** (#)
- CTA button: **"Build Your Tijoray"** → `/build` (previously "Curate Your Legacy" → `/contact`)
- **Mobile (≤900px):** hamburger → full-screen dark overlay with large Cormorant Garamond links, staggered entrance/exit animations
  - 4 nav links; animation delays: 0.10s, 0.18s, 0.26s, 0.34s (entrance); 0s, 0.04s, 0.08s, 0.12s (exit)

---

## Homepage Sections (built)

### 1. Hero

- Eyebrow: "Atelier Tijoray"; Title: "Memories. *Forever.*"
- CTA buttons: "Curate Your Legacy" → `/contact`; "Explore the Collection" → `/about`
- Animated rose rule + scroll cue

### 2. Scroll Story (`#scroll-story`)

- **500vh** sticky scroll sequence on dark `#111111` background
- Three.js pendant (Draco GLB), Z-up corrected, PBR gold + gem materials, HDR env
- Phase map: `rot [0–0.28] → arrive [0.28–0.43] → tilt [0.43–0.58] → reveal [0.58–0.72] → conn [0.72–1.00]`
- Phone screens: `Establishing Connection.png` → `Connected Piece.png`
- Animated maroon loading bar (JS-positioned, pixel-perfect): 0→25% during tilt, 25→100% during reveal
- Connection Established intermediate screen with gold checkmark
- Connected text panel: certificate, archive, vault access, generational transfer features
- Chapter navigation dots (desktop only)

### 3. Features

- Three cards: The Jewel / The Vault / The Legacy — IntersectionObserver fade-in

### 4. CTA Section

- Gold grid background; two buttons: "Enter the Atelier" → `/contact`; "Discover the Technology" → `/about`

### 5. Footer

- Near-black `#0A0A0A`; four columns; dynamic copyright year

---

## About Page (`/about` — built)

- Hero: "Born from the belief that *some things* deserve to last forever."
- Mission 2-col grid, 3 pillar cards, spec table + quote
- IntersectionObserver fade-up animations throughout
- CTA section linking to `/contact`

---

## Contact Page (`/contact` — built)

- 2-col layout, underline-only form inputs
- Fields: Name, Email, Message
- Confirmation state with gold checkmark SVG after submission
- Email reference: curator@tijoray.com

---

## Technology Page (`/technology` — built)

### Stack
- React + CSS Modules; IntersectionObserver fade-up animations; scroll-driven image parallax (JS)

### Sections

**1. Hero**
- "The intelligence *within* your jewel."
- Intro copy about the NFC chip and encrypted digital bridge

**2. How It Works — NFC Flow**
- 3-step iPhone-framed sequence with extracted app screenshots:
  - `app/app-tap.png` — "Tap Your Piece"
  - `app/app-connecting.png` — "Identity Confirmed" (Establishing Connection)
  - `app/app-connected.png` — "Your World Unlocks" (Connection Established)

**3. The App — Your Digital Atelier**
- Alternating left/right feature rows; phone frames with `overflow: hidden`
- Feature order (most important first):

| # | Label | Screenshot | Key hook |
|---|-------|-----------|----------|
| 1 | The Tijoray Experience | `memory-page.mp4` (video, autoplay loop) | Gift message revealed on first tap |
| 2 | Stone Intelligence | `app/app-atelier.png` (scroll parallax) | Stone type, clarity, GIA certificate |
| 3 | Gold Composition | `app/app-gold.png` (scroll parallax) | Metal purity, weight, craftsmanship guarantee |
| 4 | The Vault | `app/app-vault.png` (scroll parallax) | Private archive, date-organised, secure |

- Scroll parallax: images start at top of phone frame; JS scroll listener shifts `translateY` from 0 → `-(imgH - frameH)` as section passes through viewport
- GIF/video slot: `<video autoPlay loop muted playsInline>` — MP4 primary, MOV fallback

**4. Heritage Guarantee**
- Dark `var(--ink)` background; italic blockquote in large serif
- 3 stat cards with gold top border: Lifetime / Encrypted / Immutable

**5. CTA**
- Gold grid overlay; "Build Your Tijoray" → `/build`; "Speak with the Atelier" → `/contact`

---

## Pendant Configurator (`/build` — built)

### Layout

- Split grid: `55fr / 45fr` — sticky Three.js canvas left, scrollable config panel right
- Config panel: `position: sticky; height: calc(100vh - 80px); overflow-y: auto`
- Price/CTA block: `position: sticky; bottom: 0` — always visible inside scrollable panel

### Three.js Infrastructure

- `WebGLRenderer` with ACES filmic tone mapping, SRGBColorSpace
- `PerspectiveCamera(42°)` — square canvas (aspect 1:1)
- HDR env: Poly Haven `studio_small_09_1k.hdr` via `RGBELoader → PMREMGenerator`
- `OrbitControls`: `enablePan: false`, `zoomToCursor: true`, `maxDistance: 2.0`
- Polar angle clamp: `Math.PI/2 ± 0.38` (~±22° from equator)
- Spring-back to equator in RAF loop when not interacting (`diff * 0.06` lerp per frame)

### GLB Loading

- **Square:** `pendant-square.glb` (Draco compressed, Z-up, ~787KB)
- **Circle:** `pendant-circle.glb` (meshopt compressed via gltfpack, Z-up, ~1.1MB)
- Both preloaded silently on mount into `glbCacheRef` — switching shapes is instant (no spinner after first load)
- Z-up correction: `model.rotation.x = Math.PI / 2` for both shapes
- Two-pass centering: scale to 2 world-units, re-measure, subtract center
- Camera framed on pendant gem: `pendantY = box.min.y + modelHeight * 0.20`, Z=1.4
- Build-in scale animation: `easeOutCubic` over 600ms, `pivot.scale` 0→1

### Material System

- **Gem detection:** material name regex (`garnet|emerald|ruby|sapphire|...`) OR color near-black (`r < 0.12 && g < 0.12 && b < 0.12`)
- **Construction geometry:** hidden by color (`r < 0.3 && g > 0.45 && b > 0.45`) or `THREE.Line` type
- **Body materials:** `MeshStandardMaterial` — `metalness: 1.0`, `roughness` per metal, `envMapIntensity: 3.5`
- **Gem materials:** `MeshPhysicalMaterial` — `clearcoat: 1.0`, `roughness: 0.05`, `reflectivity: 1.0`
- Metal/color/birthstone mutations are **imperative** (direct `.color.set()`, `.needsUpdate = true`) — no GLB reload

### Configuration Options

| Step | Options |
|------|---------|
| 01 Shape | Square, Circle |
| 02 Base Metal | Steel ($299), Silver ($399), 10K Gold ($799), 18K Gold ($1299) |
| 03 Metal Color | White, Gold, Rose (disabled for Steel) |
| 04 Birthstone | 12 months (Jan–Dec), color swatches |

- Series tag: **"Birthstone Series"** under page title (future: Birthstone Bracelet)
- Step headers: gold decorative line + `?` tooltip icon with per-step descriptions
- All selection states use consistent gold border treatment
- Hover affordances: swatches scale 1.08× with shadow; gem swatches scale 1.15×
- Month labels: 11px; Stone name: 18px italic serif

### Price & CTA

- Dynamic price from metal selection; spec summary line below price
- "Proceed to Commission" button — disabled with "Coming Soon" badge
- "Speak with the Atelier" secondary link → `/contact`

---

## Assets (`public/assets/`)

```
Tijoray Logo.png
Tijoray.pdf                        — source app screenshots (16 pages)
Connected Piece.png               — scroll story phone screen
Connection Established.png        — scroll story intermediate screen
Establishing Connection.png       — scroll story phone screen
pendant-square.glb                — Draco compressed, ~787KB
pendant-circle.glb                — meshopt compressed (gltfpack -cc), ~1.1MB
memory-page.mov                   — original recording
memory-page.mp4                   — converted for browser (avconvert HEVC), ~3.8MB
memory-page.gif                   — legacy GIF (superseded by MP4)
app/
  app-tap.png                     — NFC scan initiation screen
  app-connecting.png              — Establishing Connection screen
  app-connected.png               — Connection Established screen
  app-atelier.png                 — Stone metadata (Atelier tab)
  app-gold.png                    — Gold composition screen
  app-memory.png                  — Memory polaroid screen
  app-vault.png                   — Christina's Vault screen
  app-reveal.png                  — Piece reveal (Vault Certified)
  page-01.png … page-16.png       — full PDF page renders (2x, archival)
scripts/
  strip-lines.mjs                 — removes non-triangle primitives from GLB (meshopt)
  decompress-draco.mjs            — decompresses Draco GLB via @gltf-transform
```

---

## File Structure

```
src/
  index.css                 — design tokens + global reset
  main.tsx                  — React root (no StrictMode)
  App.tsx                   — progress bar + React Router routes
  components/
    Navbar.tsx / .module.css
    Hero.tsx / .module.css
    ScrollStory.tsx / .module.css
    Features.tsx / .module.css
    CtaSection.tsx / .module.css
    Footer.tsx / .module.css
  pages/
    AboutPage.tsx / .module.css
    ContactPage.tsx / .module.css
    ConfiguratorPage.tsx / .module.css
    TechnologyPage.tsx / .module.css
```

---

## Accessibility Status

| Item | Status |
|------|--------|
| `aria-label="Primary navigation"` on nav | ✅ Done |
| `role="img"` on 3D canvas | ✅ Done |
| Chapter dots as `<button>` with aria-labels | ✅ Done |
| `prefers-reduced-motion` JS check | ✅ Done |
| Mobile navigation (hamburger) | ✅ Done |
| Configurator birthstone grid `role="group"` | ✅ Done |
| Contact form confirmation state | ✅ Done |
| WCAG contrast — rose on cream (~2.8:1) | ⚠️ Known — rose used only for short decorative labels |
| Keyboard navigation through scroll story | ❌ Not yet implemented |
| Skip-to-content link | ❌ Not yet implemented |

---

## Known Open Issues

- Collection, Journal nav links are placeholder `#`
- Footer links are placeholder `#`
- Rose (`#B97A6A`) on cream fails WCAG AA — acceptable for eyebrow decorative use only
- "Proceed to Commission" CTA is disabled — commission flow not yet built
- No social proof, press mentions, or editorial photography above the fold
- Technology page: `memory-page.mp4` is HEVC encoded — may need H.264 re-encode for wider Android support

---

## Information Architecture

### Live Pages

- **Home** `/` ✅
- **Technology** `/technology` ✅
- **About (Atelier)** `/about` ✅
- **Contact** `/contact` ✅
- **Build Your Tijoray** `/build` ✅

### Planned Pages

- Journal — editorial content, articles
- FAQ / Care Guide
- Collection landing page
- Order tracking / account

---

## Motion Principles

- Slow and intentional; favor cinematic transitions
- Use opacity, parallax depth, object rotation, and soft bloom
- Avoid bouncy easing or playful interaction timing
- Scroll-story pacing: 500vh for the full pendant → phone → vault sequence
- Connection flash: instantaneous gold radial burst (`.pop` class triggers `estFlash` keyframe)
- Menu open/close: 280ms ease-in (staggered links), 260ms ease-out (reverse stagger)
- `easeOut(t, exp)` exponents per phase: rotation 1.8, arrive 2.8, reveal 2.5, conn 2.2/2.5

---

## Technical Notes

- **No React StrictMode** — double-invocation breaks WebGL context
- **Three.js imports:** use `three/examples/jsm/` paths (not `three/addons/`)
- **Draco decoder CDN:** `https://www.gstatic.com/draco/versioned/decoders/1.5.6/`
- **MeshoptDecoder:** registered via `gltfLoader.setMeshoptDecoder(MeshoptDecoder)` for circle GLB
- **HDR environment:** loaded from Poly Haven CDN; `RGBELoader → PMREMGenerator → scene.environment`
- **GLB compression pipeline:**
  - Draco: `npx gltf-pipeline -i input.glb -o output.glb --draco.compressionLevel 7`
  - Meshopt: `gltfpack -i input.glb -o output.glb -cc`
  - Draco → Meshopt: decompress with `scripts/decompress-draco.mjs` first (gltfpack can't read Draco)
- **Scroll animation performance:** all style mutations are imperative (`ref.current.style.xxx`) — never React state in scroll handlers
- **Two-pass model centering:** scale first, re-measure with new `Box3`, subtract new center
- **Bounding box for camera framing:** computed before `pivot.scale.setScalar(0)` — otherwise box is empty
- **Vite manual chunk splitting:** three.js and react-vendor in separate chunks; `chunkSizeWarningLimit: 600`

---

## Implementation Phases

### Phase 1: Foundations ✅ Complete
- Vite + React + TypeScript scaffold
- Design tokens, global CSS, typography system
- Navbar, Hero, Features, CTA, Footer components

### Phase 2: Home Page Animation ✅ Complete
- 3D pendant via Three.js + GLB (Draco, HDR PBR, gold/gem material overrides)
- Scroll-story phase sequence (rot → arrive → tilt → reveal → conn)
- Phone mockup sequence, NFC rings, gold flash, Connected text panel
- Animated loading bar + Connection Established intermediate screen
- Mobile responsive layout; reduced-motion; accessibility

### Phase 3: Marketing Pages ✅ Complete
- Technology page with NFC flow, app screenshots, scroll parallax, video
- About Us (Atelier) with mission pillars and spec table
- Contact Us with underline form and confirmation state
- React Router v7 routing for all pages

### Phase 4: Pendant Configurator ✅ Complete
- `/build` page with Three.js OrbitControls + HDR + spring-back
- Square and circle GLB shapes with preloading cache
- Imperative material mutation (metal, color, birthstone)
- Sticky price block, series tag, step tooltips, unified hover states
- Birthstone Series product line designation

### Phase 5: Launch Readiness (planned)
- Commission/checkout flow for `/build`
- Journal page with editorial articles
- Collection landing page
- Analytics and event tracking
- SEO metadata and social previews
- Full WCAG AA audit
- H.264 re-encode of memory-page.mp4 for Android compatibility
