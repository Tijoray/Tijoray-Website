# Arcana Website Design and Plan

## Purpose

This document defines the design direction, content architecture, interaction model, and implementation plan for the Arcana website. It reflects the current built state of the homepage and serves as the living blueprint for future pages.

**Last updated:** April 2026 — full audit against source files.

---

## Brand Direction

Arcana should feel like a luxury maison with a concealed technological core. The website needs to balance editorial warmth and high-end craftsmanship with the precision of secure digital infrastructure.

### Brand Pillars

- Eternal craftsmanship
- Private digital legacy
- Modern ritual and storytelling
- Bespoke composition and authorship
- Trust, authentication, and permanence

### Experience Goals

- Introduce Arcana as memory-preserving jewelry, not generic accessories
- Make NFC and the digital vault feel magical but credible
- Guide users from intrigue to configuration with minimal friction
- Preserve a premium, deliberate pace across motion and content

---

## Confirmed Language From the App

- Product vocabulary consistently uses atelier language: "Atelier", "Vault", and "Digital Atelier"
- Trust states use explicit certification language: "Vault Secure", "Vault Certified", "Purity Verified", and "Verification secured BY ARCANA"
- Material metadata is presented as elevated specification blocks: "Metal Type", "Metal Color", and "Metal Purity"
- The app emphasizes permanence and provenance through phrases like "Your legacy, secured" and "permanent digital archive"
- The vault is framed as intimate and archival, not social: "A sanctuary for your most precious digital memories"
- Media examples include certificates, photos, and audio, with content such as "Certificate_042.pdf", "Paris Unveiling", and "Heartbeat"
- Rose gold is a flagship visual cue and should be treated as a hero finish, not a secondary option
- The collection language feels named and editorial, such as "Aurelia Infinite"

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

## Current Implementation — Homepage

### Stack (built)

- **Framework:** Vite + React 18 + TypeScript
- **Styling:** CSS Modules per component
- **3D:** Three.js + GLTFLoader + DRACOLoader + RGBELoader (Poly Haven HDR)
- **Animation:** CSS keyframes + imperative scroll-driven JS (RAF loop)
- **Dev server:** `npm run dev` → http://localhost:5173

### File Structure

```
public/assets/
  3D Pendant.glb          — Draco-compressed GLB, Z-up export
  Arcana Logo.png
  Establishing Connection.png   — phone screen: NFC pairing in progress
  Connected Piece.png           — phone screen: vault opened (Aurelia Infinite)
src/
  index.css               — design tokens + global reset
  main.tsx                — React root (no StrictMode)
  App.tsx                 — progress bar + component composition
  components/
    Navbar.tsx / .module.css
    Hero.tsx / .module.css
    ScrollStory.tsx / .module.css
    Features.tsx / .module.css
    CtaSection.tsx / .module.css
    Footer.tsx / .module.css
```

---

## Homepage Sections (built)

### 1. Navigation

- Fixed, three states: transparent (over cream hero), `.in-dark` (over dark scroll story), `.frosted` (cream frosted glass, after story)
- Logo: `Arcana Logo.png` with dark/light filter switching
- Links: Collection, Technology, Atelier, Journal — all placeholder `#` for now
- CTA: "Curate Your Legacy" — burgundy on cream, gold on dark
- **Mobile (≤900px):** hamburger button → full-screen dark overlay (`rgba(10,8,7,0.97)`) with large Cormorant Garamond links (clamp 36px–56px), staggered entrance (280ms in, 260ms out)
  - Overlay entrance: `overlayIn` keyframe `translateY(-12px → 0)`, 280ms
  - Overlay exit: `overlayOut` keyframe `translateY(0 → -12px)`, 260ms — triggered by `closing` state + 260ms `setTimeout` before React unmount
  - Link entrance: `linkIn` staggered (0.10s, 0.18s, 0.26s, 0.34s delays)
  - Link exit: `linkOut` reverse stagger (0s, 0.04s, 0.08s, 0.12s delays)
  - Backdrop click dismisses overlay; X close button inside overlay
- `aria-label="Primary navigation"` on nav element

### 2. Hero

- Cream background, centred text, animated entrance (riseIn keyframe, staggered)
- Eyebrow: "Atelier Arcana" — rose gold, 12px, weight 600
- Title: "Memories. *Forever.*" — Cormorant Garamond, `clamp(76px, 11vw, 148px)`, "Forever" in rose gradient
- Subtitle (15px, weight 400, `--ink-mid`): "Fine jewellery woven with encrypted digital legacy. / Every piece, an heirloom. Every touch, a memory."
- **CTA buttons:** "Curate Your Legacy" (dark filled, ink bg) + "Explore the Collection" (ghost, ink border)
- Rose rule (1px, 56px tall, rose gradient, margin-top 24px)
- Scroll cue: "Scroll to Discover" label, animated rose line, 10px label
- Ambient rose-gold orb pulse in background

### 3. Scroll Story (`#scroll-story`)

- Height: **500vh** (desktop and mobile)
- Sticky stage: `height: 100vh`, dark background `#111111`
- Stage glow: `radial-gradient(ellipse 70% 55% at 50% 50%, #1c100b 0%, #111111 65%)` behind pendant
- Radial vignette mask on canvas (pendant) to fade chain edges softly

#### 3D Pendant

- **File:** `public/assets/3D Pendant.glb` (Draco compressed)
- **Orientation fix:** `model.rotation.x = Math.PI / 2` (Z-up export correction)
- **Auto-centred and scaled** in two passes: scale to 2 world-units (pass 1), re-measure bounds and subtract new center (pass 2) — prevents centering drift
- **Pivot group:** model wrapped in `THREE.Group()` so `rotProg` drives `pivot.rotation.y` cleanly; starts at `Math.PI` (back face)
- **Camera:** `PerspectiveCamera(45)`, aimed at gem bottom 22% of model height; Z=1.4 for both desktop and mobile
- **Lighting:** `AmbientLight(0xffffff, 0.15)` + `DirectionalLight(0xfff5e0, 1.8)` key at (3,5,3) + `DirectionalLight(0xaaccff, 0.5)` rim at (-2,-1,-3)
- **HDR environment:** Poly Haven `studio_small_09_1k.hdr` via `RGBELoader` → `PMREMGenerator` for real PBR metal reflections
- **Gold material override:** `metalness: 1.0, roughness: 0.22, envMapIntensity: 3.5`
- **Gem material override:** `MeshPhysicalMaterial` — `color: 0x050508, metalness: 0, roughness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.05` — detected by base color `r < 0.12 && g < 0.12 && b < 0.12`
- **Tone mapping:** `ACESFilmicToneMapping, exposure: 1.0`; output: `SRGBColorSpace`
- **Canvas filter:** `drop-shadow(0 0 80px rgba(191,161,95,0.18))` for ambient gold glow
- **Canvas size:** 78vh desktop / 70vh mobile; `renderer.setSize(w, h, false)` — CSS controls display size; resizes on window resize
- **Continuous animLoop:** runs at 60fps regardless of scroll; `pivot.rotation.y = Math.PI * (1 - easeOut(rotProg, 1.8))` updated from scroll progress; early-returns rotation (not render) on `prefers-reduced-motion`

#### Pendant Captions

Two caption cards rendered beneath the pendant during the `rot` phase, swapping at `rotProg >= 0.5`:

| rotProg | Eyebrow | Title |
|---------|---------|-------|
| < 0.5 | Handcrafted Heirloom | Your Story, *Set in Stone* |
| ≥ 0.5 | The Arcana Pendant | Eternal Craft, *Digital Soul* |

Caption fades in over first 4% of scroll, fades out over last 6% of `rot` phase. Updated imperatively (innerHTML/textContent) without React state.

#### Phase Map

```js
P.rot    = [0.00, 0.28]  // pendant rotates back→stone face (pivot.rotation.y: π → 0)
P.arrive = [0.28, 0.43]  // phone slides up from below (ty: 50vh → 32vh, easeOut 2.8)
P.tilt   = [0.43, 0.58]  // phone tilts +14° toward pendant, NFC rings pulse, pendant fades
P.reveal = [0.58, 0.72]  // phone untilts, slides to centre (ty: 32vh → 0, easeOut 2.5)
P.conn   = [0.72, 1.00]  // gold flash fires instantly, Connected Piece slides in iOS-style
```

**Note:** Connection Established is NOT a separate screen/phase. The flash fires at `connProg > 0.08` via `.pop` class addition (one-shot, resets when `connProg === 0`). The Connected Piece screen slides in directly. There is no `Connection Established.png` asset — the phone screens are `Establishing Connection.png` → `Connected Piece.png`.

#### Phone Animation

- Phone size: 72vh desktop / 48vh mobile; aspect ratio `0.463` (iPhone 14 Pro)
- Border radius: 52px desktop / 34px mobile
- Three.js canvas and phone are separate layers — canvas has radial vignette mask
- **Desktop conn phase:** phone shifts left `lerp(0, -13, easeOut(connProg, 2.2))` vw; text panel slides from right `translate(lerp(56,16,t)vw, -50%)`
- **Mobile conn phase:** phone rises `lerp(0, -16, easeOut(connProg, 2.2))` vh (center at 34vh, bottom at 58vh); text panel `translateY(calc(10vh + lerp(5,0,t)vh))`
- `prefers-reduced-motion`: scroll render function returns early; animLoop still renders but skips pendant rotation

#### Vignette Mask

**Desktop:**
```css
mask-image: radial-gradient(
  ellipse 80% 70% at 50% 62%,
  black 45%, rgba(0,0,0,0.5) 68%, transparent 90%
);
```

**Mobile (≤768px):**
```css
mask-image: radial-gradient(
  ellipse 90% 55% at 50% 68%,
  black 40%, rgba(0,0,0,0.5) 65%, transparent 88%
);
```

#### Connected Text Panel Content

The right-side panel (desktop) / below-phone panel (mobile) that appears during the `conn` phase:

- Eyebrow: "Your Digital Vault"
- Rose-to-gold horizontal rule (36px wide)
- Headline: "One Piece. *A Lifetime* of Memory."
- 4 vault feature items (each with rose vertical bar):
  1. **Certificate of Authenticity** — Provenance and material purity verified & sealed by Arcana
  2. **Personal Archive** — Photographs, voice notes, letters — encrypted inside your jewel
  3. **Access Your Vault** — Tap with any NFC device to reveal your private memories
  4. **Generational Transfer** — Pass the piece — and the vault — to those who come after you
- Status badge: gold checkmark SVG + "Legacy Secured" (gold, 10px, letter-spacing 2.5px)

#### Chapter Navigation Dots

- 4 dots, desktop only (hidden on mobile via `display: none`)
- Real `<button>` elements with `aria-label="Go to chapter N"`
- Click calls `scrollToChapter(n)` → smooth scroll using fractions `[0, P.arrive[0], P.conn[0], P.conn[0] + 0.1]`
- Active dot: rose color, `scale(1.5)`; inactive: `rgba(245,240,232,0.2)`

### 4. Features

- Cream background, `padding: 80px 0`
- Eyebrow: "The Arcana System"; title: "Craft. Vault. *Legacy.*"
- Three cards: The Jewel / The Vault / The Legacy (staggered `transitionDelay` 0s / 0.12s / 0.24s)
- Card background: `#E5D9CC` (distinct from `--cream` `#F7F7F2`)
- Persistent faint rose top border (opacity 0.2), brightens on hover (0.8)
- Feature numbers: `rgba(185,122,106,0.35)` — visible as decorative elements, 64px Cormorant
- IntersectionObserver fade-in-up on scroll (threshold 0.18)

### 5. CTA Section

- Warm cream background with subtle gold grid
- Eyebrow: "Begin Your Journey"
- Headline: "Curate Your *Legacy*"
- Body: "Every Arcana piece begins with a conversation…"
- Two buttons: "Enter the Atelier" (dark primary) + "Discover the Technology" (ghost)

### 6. Footer

- Near-black `#0A0A0A` background
- Four columns: brand/tagline, Collection, Atelier, Support
- Copyright: `© {new Date().getFullYear()} Atelier Arcana` — dynamic year
- All links placeholder `#` — real routes to be added per page

---

## Accessibility Status

| Item | Status |
|------|--------|
| `aria-label="Primary navigation"` on nav | ✅ Done |
| `role="img"` on 3D canvas | ✅ Done |
| Chapter dots as `<button>` with aria-labels | ✅ Done |
| `prefers-reduced-motion` JS check | ✅ Done |
| Mobile navigation (hamburger) | ✅ Done |
| WCAG contrast — rose on cream (~2.8:1) | ⚠️ Known issue — rose used only for short decorative labels |
| Footer link contrast on dark bg | ✅ Fixed to 75% opacity minimum |
| Keyboard navigation through scroll story | ❌ Not yet implemented |
| Skip-to-content link | ❌ Not yet implemented |

---

## Known Open Issues

- All nav/footer links are placeholder `#` — no routing implemented yet
- Rose (`#B97A6A`) on cream fails WCAG AA — acceptable for eyebrow decorative use only
- Mobile scroll story layout (phone + text panel) may need further tuning across screen sizes
- No social proof, press mentions, or product imagery in the above-fold experience
- No hamburger menu for tablet (900px–768px range is a gap)

---

## Information Architecture

### Primary Pages

- **Home** — built ✅
- Build Your Arcana — planned
- Build Necklace — planned
- Build Bracelet — planned
- About Us — planned
- Technology — planned (dark theme)
- Contact Us — planned

### Utility Surfaces

- Navigation with persistent CTA: "Curate Your Legacy"
- Mobile navigation: full-screen overlay with large serif links ✅
- Confirmation modal after inquiry submission — planned
- Future: Journal, FAQ, Care Guide, Order Tracking

---

## Remaining Pages (not yet built)

### Technology Page

- Dark theme (`#111111` background)
- Gold for signals, certification states, diagrams
- Sections: NFC intro, vault embedding, auth flow, supported content types, app screenshots
- Trust messaging: passive NFC, secure pairing, private archive framing

### Builder Pages

- Sticky product preview (desktop) / stacked (mobile)
- Steps: Base metal → Shape → Gemstone → Summary
- Real-time preview updates
- Elevated summary panel in certificate-style framing

### About Us

- Editorial atelier imagery
- Warm light, shallow depth of field
- Craftsmanship + digital permanence narrative
- Specification callouts inspired by app product detail screens

### Contact Us

- Cream background, minimal
- Fields: Name, Email, Message ("How may our Atelier assist you today?")
- Burgundy submit button
- Email: curator@atelierarcana.com

---

## Motion Principles

- Slow and intentional; favor cinematic transitions
- Use opacity, parallax depth, object rotation, and soft bloom
- Avoid bouncy easing or playful interaction timing
- Scroll-story pacing: 500vh for the full pendant → phone → vault sequence
- Connection flash: instantaneous gold radial burst (`.pop` class triggers `estFlash` keyframe), not a sustained screen
- Menu open/close: 280ms ease-in (staggered links), 260ms ease-out (reverse stagger)
- `easeOut(t, exp)` exponents per phase: rotation 1.8, arrive 2.8, reveal 2.5, conn shift/rise 2.2, conn screen 2.5

---

## Technical Notes

- **No React StrictMode** — double-invocation breaks the WebGL context
- **Three.js imports:** use `three/examples/jsm/` paths (not `three/addons/`)
- **Draco decoder:** `https://www.gstatic.com/draco/versioned/decoders/1.5.6/`
- **HDR environment:** loaded from Poly Haven CDN — requires internet; `RGBELoader` → `PMREMGenerator` → `scene.environment`
- **Scroll animation performance:** all style mutations are imperative (`ref.current.style.xxx`) — never React state in scroll handlers; captions use `textContent`/`innerHTML` with dirty-check to avoid thrashing
- **Canvas sizing:** `renderer.setSize(w, h, false)` — `false` prevents inline style override of CSS-controlled display size
- **Two-pass model centering:** scale first, then re-measure with a new `Box3` and subtract the new center — prevents the center vector mutating before the position subtraction
- **Hamburger exit animation:** React has no native exit animation; pattern is `closing: boolean` state → apply `overlayClosing`/`linksClosing` CSS classes → `setTimeout(260ms)` → set `menuOpen: false`, `closing: false`; component then unmounts cleanly
- **Flash one-shot:** `flashFired` flag prevents re-triggering; reset only when `connProg === 0` (user scrolls back)
- **animLoop vs scroll RAF:** Two separate loops — `animLoop` runs continuously for Three.js renders; scroll uses `requestAnimationFrame(render)` debounced on scroll events, with `lastY` dirty-check to skip no-op frames

---

## Implementation Phases (updated)

### Phase 1: Foundations ✅ Complete
- Vite + React + TypeScript scaffold
- Design tokens, global CSS, typography system
- Navbar, Hero, Features, CTA, Footer components

### Phase 2: Home Page Animation ✅ Complete
- 3D pendant via Three.js + GLB (Draco, HDR PBR, gold/gem material overrides)
- Scroll-story phase sequence (rot → arrive → tilt → reveal → conn)
- Pendant caption system (two captions swapping at 50% rotProg)
- Phone mockup sequence, NFC rings, gold flash, Connected text panel
- Mobile responsive layout
- Accessibility: reduced-motion, aria labels, interactive chapter dots
- Hamburger overlay with entrance/exit animations and backdrop dismiss

### Phase 3: Remaining Marketing Pages
- Technology page (dark theme)
- About Us
- Contact Us + form handling

### Phase 4: Builder Flow
- Build Your Arcana landing
- Necklace and bracelet builder with live preview
- Pricing logic and summary panel

### Phase 5: Launch Readiness
- Real routing (React Router or Next.js migration)
- Analytics and event tracking
- SEO metadata and social previews
- Production forms and checkout integration
- Full WCAG AA audit
