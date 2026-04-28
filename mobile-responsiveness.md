# Mobile Responsiveness — Full Site Fix

## Context
Users primarily access Tijoray on mobile. The site currently has horizontal scrolling, uneven margins, and broken layouts on phones (375px) and tablets (768px). Root causes: fixed-width components that exceed viewport, missing breakpoints in the 640–900px range, and no touch/swipe support in key interactive components. This plan fixes all pages in priority order.

---

## Files to Modify

| File | Issue |
|---|---|
| `src/pages/MemoryCarousel.module.css` | No media queries at all — cards overflow on mobile |
| `src/pages/MemoryCarousel.tsx` | No swipe gesture support |
| `src/components/ScrollStory.tsx` | Canvas hardcoded to 700×700 on init |
| `src/pages/PortalPiecePage.module.css` | 360px fixed left panel persists until 900px; missing 768px breakpoint |
| `src/components/Navbar.module.css` | Logo 240px tall on mobile is oversized |
| `src/components/Footer.module.css` | Fragmented breakpoints; legal links overflow before 560px |
| `src/components/CtaSection.module.css` | `clamp(52px, 7vw, 88px)` min is too large for 320px screens |
| `src/components/Features.module.css` | Card padding (48px 40px) not reduced on mobile |
| `src/pages/AboutPage.module.css` | Pillar card padding (48px 40px) not reduced on mobile |
| `src/pages/ConfiguratorPage.module.css` | Color swatches don't wrap; shape grid cramped at 320px |
| `src/pages/ContactPage.module.css` | Detail values right-aligned when stacked; textarea too tall |
| `src/pages/TutorialModal.module.css` | No media queries — modal may exceed viewport on phones |
| `src/index.css` | Add `html { overflow-x: hidden }` safety net |

---

## Phase 1 — Critical (Causes Horizontal Overflow)

### 1. MemoryCarousel — Responsive cards + swipe

**Problem:** `MemoryCarousel.module.css` has zero `@media` rules. Center landscape card is 420px wide — overflows a 375px phone. Stage fixed at 400px height.

**CSS fixes in `MemoryCarousel.module.css`:**
```css
@media (max-width: 600px) {
  .stage { height: 320px; }

  .card { width: 160px; height: 240px; }
  .cardLandscape { width: min(88vw, 300px); height: 180px; }

  .cardCenter { width: 200px; height: 280px; }
  .cardCenter.cardLandscape { width: min(88vw, 320px); height: 200px; }

  .cardLeft  { transform: translateX(-55%) translateY(0) scale(0.72); }
  .cardRight { transform: translateX(55%)  translateY(0) scale(0.72); }
  .cardFarLeft  { transform: translateX(-95%) translateY(0) scale(0.55); }
  .cardFarRight { transform: translateX(95%)  translateY(0) scale(0.55); }

  .arrow { width: 30px; height: 30px; }
  .arrowLeft  { left: 2px; }
  .arrowRight { right: 2px; }
}
```

**Swipe support in `MemoryCarousel.tsx`:**
- Add `startXRef = useRef<number | null>(null)` at top of component
- On `<div className={styles.stage}>`: add `onPointerDown`, `onPointerUp` handlers
- `onPointerDown`: record `startXRef.current = e.clientX`
- `onPointerUp`: if `|e.clientX - startXRef.current| > 40`, call `prev()` or `next()`; reset ref
- Add `style={{ touchAction: 'pan-y' }}` to the stage div so vertical scroll isn't blocked

### 2. ScrollStory — Fix initial canvas size

**Problem:** `ScrollStory.tsx:67` calls `renderer.setSize(700, 700, false)` before the container has painted, so the canvas is 700px wide on first render on mobile, causing overflow.

**Fix in `ScrollStory.tsx`:** Change line 67 from:
```ts
renderer.setSize(700, 700, false)
```
to:
```ts
const initW = container.clientWidth || window.innerWidth
const initH = container.clientHeight || initW
renderer.setSize(initW, initH, false)
```
where `container` is the ref to the mounted DOM node. The existing resize handler already uses `clientWidth` (lines 102–104), so this just aligns first paint with it.

### 3. PortalPiecePage — Fix tablet breakpoint gap

**Problem:** Left panel is `360px` fixed until `max-width: 900px`. On a 768px tablet: 360 + 36 (gap) + content overflows the viewport. Single-column should start at 768px.

**Fix in `PortalPiecePage.module.css`:**
Add a new breakpoint *before* the 900px one:
```css
@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .addPanel {
    position: static;
  }
}
```
The existing `max-width: 900px` rule becomes redundant for layout but keep it for any other rules it contains.

---

## Phase 2 — Major (Poor Mobile UX)

### 4. Navbar logo size
**Problem:** `.logo img { height: 240px }` at `max-width: 900px` — overly tall for a phone.
**Fix** in `Navbar.module.css`: Add inside the existing `@media (max-width: 900px)` block or as a new `@media (max-width: 480px)`:
```css
@media (max-width: 480px) {
  .logo img { height: 160px; max-width: 80vw; }
}
```

### 5. Footer — Consolidate breakpoints
**Problem:** Three breakpoints (900/768/560px) with fragmented rules. Legal links stay horizontal until 560px — can overflow at 600px phones.
**Fix** in `Footer.module.css`:
- Move the `560px` legal-link stacking rule up to the `768px` breakpoint
- Ensure single-column grid also starts at `768px` not `900px` if it isn't already
- Delete the `560px` breakpoint entirely after merging its rules

### 6. CtaSection — Fix clamp minimum
**Problem:** `clamp(52px, 7vw, 88px)` — on 320px the vw value is ~22px so it snaps to 52px minimum, which is too large.
**Fix** in `CtaSection.module.css`: Change to `clamp(36px, 7vw, 88px)` and add:
```css
@media (max-width: 480px) {
  .ctaTitle { font-size: 32px; }
  .ctaBtns { justify-content: center; }
}
```

### 7. Feature cards + About pillar cards — Padding
**Problem:** Both use `padding: 48px 40px` with no mobile override; 80px total horizontal padding on a 320px screen leaves only 240px content width.
**Fix** in `Features.module.css` and `AboutPage.module.css`:
```css
@media (max-width: 768px) {
  .featureCard { padding: 32px 20px; }
  .pillarCard  { padding: 32px 20px; }
}
```

### 8. Configurator — Swatches and shape grid
**Problem:** Color swatches (`display: flex; gap: 24px`) don't wrap on small phones. Shape grid `repeat(4, 1fr)` at 320px = ~72px per button — too small.
**Fix** in `ConfiguratorPage.module.css`:
```css
@media (max-width: 480px) {
  .colorSwatches { flex-wrap: wrap; gap: 12px; }
  .shapeGrid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
}
```

### 9. Contact — Detail alignment + textarea
**Fix** in `ContactPage.module.css`:
- Inside `@media (max-width: 900px)`: add `.detailValue { text-align: left; }`
- Add `@media (max-width: 480px) { .textarea { min-height: 100px; } }`

---

## Phase 3 — Polish

### 10. TutorialModal responsive
**Fix** in `TutorialModal.module.css` — add:
```css
@media (max-width: 600px) {
  .card { margin: 16px; max-width: calc(100vw - 32px); padding: 28px 20px; }
}
```

### 11. Carousel dot touch targets
6px dots are too small for fingers. Fix in `MemoryCarousel.module.css`:
```css
@media (max-width: 768px) {
  .dot { width: 8px; height: 8px; }
  /* Increase tap area without changing visual size */
  .dot::before { content: ''; position: absolute; inset: -8px; }
  .dot { position: relative; }
}
```

### 12. Global overflow safety net
In `src/index.css`, add `html { overflow-x: hidden; }` alongside the existing `body { overflow-x: hidden; }`. This catches any absolutely-positioned element that bleeds past the body.

---

## Verification

1. `npm run dev` — open Chrome DevTools, toggle device toolbar
2. Test at **375px (iPhone SE)**, **390px (iPhone 14)**, **768px (iPad)**, **1024px (iPad landscape)**
3. For each viewport, verify in DevTools console: `document.body.scrollWidth <= window.innerWidth` (no horizontal overflow)
4. Check each page:
   - **All pages**: consistent `24px` side margins, no horizontal scroll
   - **Navbar**: hamburger opens, overlay fills screen, logo not too tall on 375px
   - **ScrollStory**: pendant fits within viewport on first load, no 700px overflow
   - **PortalPiecePage**: single column below 768px, form + carousel stack vertically
   - **MemoryCarousel**: cards don't overflow, swipe left/right navigates, dots tappable
   - **Configurator**: canvas fills width, swatches wrap, shape buttons usable
5. Real-device test on iOS Safari (most restrictive mobile browser) — pay attention to safe area insets and 100vh behavior
