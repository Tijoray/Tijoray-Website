# Hero Redesign — Cartier-Inspired Full-Bleed

## Context
The current homepage hero at [src/components/Hero.tsx](src/components/Hero.tsx) is centered serif text ("Memories. Forever.") on a cream background with a subtle rose-gold orb. It lacks the visual punch of Cartier's full-bleed warm-lit product hero and feels empty as the first impression of a luxury brand. We are redesigning Hero to be instantly eye-catching while preserving the existing ScrollStory pendant sequence that plays below it.

**Direction:**
- Full-bleed **commissioned editorial photo** (to be sourced) — hero-scale, warm-lit, intimate
- **Hero teases, ScrollStory reveals** — hero shows an atmospheric / cropped shot; the scroll sequence below is untouched
- Mood: **intimate & warm (Cartier-like)** — low-key warm lighting, jewelry on velvet or in-hand, candlelit feel

## Approach

Convert the hero from a centered cream text block into a **split, image-led composition**:

- **Full-bleed warm editorial photo** as the hero background (`<img>` + `object-fit: cover`, right-weighted on desktop so the subject sits right-of-center).
- **Left-aligned text column** over a soft cream-to-transparent gradient wash so text stays legible on the image. Gradient is warm (cream → transparent at ~55% width on desktop; cream → transparent top-to-bottom on mobile).
- Retain the existing serif title and `<em>` rose-gradient treatment — it's already on-brand, just needs to sit in a composed frame rather than float in void.
- Replace the 700px `.heroOrb` with a **warm corner vignette** burned into the image (inner shadow `rgba(40, 24, 20, 0.35)` at corners) — adds depth without competing with the photo.
- Keep CTAs and scroll cue; restyle `.heroBtnPrimary` to burgundy fill so it pops against the imagery. Recolor `.scrollCue` text for legibility over photo.
- End the hero with a subtle bottom cream gradient so the handoff to ScrollStory's dark sticky stage feels intentional.

### Layout spec (desktop ≥ 900px)
```
┌───────────────────────────────────────────────────┐
│ [left 45% cream wash]    [right 55% photo]        │
│                                                   │
│ Memories.                                         │
│ Forever.   ← serif, rose italic                   │
│ ─── subline ───                                   │
│ [Curate Your Legacy] [Explore the Collection]     │
│                                                   │
│                        scroll cue ▼ (centered)    │
└───────────────────────────────────────────────────┘
```

### Layout spec (mobile < 900px)
Image is full-bleed backdrop with a stronger warm vignette. Text stacks centered over it with a radial cream gradient behind the copy for legibility. Serif title scales per existing `clamp()`.

## Files to modify

| File | Change |
|---|---|
| [src/components/Hero.tsx](src/components/Hero.tsx) | Add `<img class={styles.heroImage}>` + `<div class={styles.heroWash}>` before content; remove `.heroOrb`; left-align `.heroContent`. |
| [src/components/Hero.module.css](src/components/Hero.module.css) | Rewrite `.hero` (keep 100vh, remove cream bg), add `.heroImage` (absolute full-bleed, object-fit: cover), `.heroWash` (left cream → transparent gradient + corner vignette), switch `.heroContent` to left-aligned on desktop and centered on mobile; restyle `.heroBtnPrimary` to burgundy; tune `.scrollCue` for photo contrast; delete `.heroOrb` rules + `orbPulse` keyframes. |
| `public/assets/editorial/hero.jpg` *(new, user-provided)* | Commissioned photo, 2400×1600+, warm low-key, subject right-of-center so left gutter stays softer for text legibility. Placeholder: reuse `public/assets/editorial/wear-layered.png` during build, swap when final arrives. |

## Reuse

- `@keyframes riseIn` (Hero.module.css:180) — already defined, keep for new layout entrance animation
- Design tokens in [src/styles/tokens.css](src/styles/tokens.css): `--cream`, `--rose`, `--rose-deep`, `--burgundy`, `--ink`, `--ink-mid`
- Navbar's `.frosted` state ([src/components/Navbar.module.css:15](src/components/Navbar.module.css#L15)) — hero keeps a cream-dominant top edge so frosted navbar still reads correctly; no navbar changes needed

## Out of scope

- **ScrollStory is untouched.** It continues to mount directly below Hero in [src/App.tsx](src/App.tsx) and retains its 4-phase scroll choreography on the 805KB `pendant-scroll.glb`.
- No route changes, no npm changes, no API changes.

## Verification

1. `npm run dev` → visit `/`. Hero shows full-bleed warm photo with legible left-aligned text, not cream-only.
2. Scroll past hero → ScrollStory's pendant sequence plays exactly as before. No regressions.
3. Resize to 768px → text stacks, image stays visible behind with stronger wash, title scales smoothly.
4. Tab through hero → CTAs and scroll-cue focus states visible against the image.
5. Scroll 20–40px → navbar `.frosted` state triggers correctly over hero's cream-dominant top edge.
6. Lighthouse perf on `/` ≥ 80; hero image optimized (WebP or compressed JPG ≤ 400KB, `loading="eager"`, `fetchpriority="high"`).

## Notes

- **Blocking on commissioned image.** Temporary placeholder via existing `wear-layered.png` so layout can be built and reviewed first, then swap when commissioned shot arrives.
- If the commissioned image is center-weighted instead of right-weighted, the CSS split is symmetric — flip to right-aligned text + left-weighted photo with a single directional change on `.heroWash` gradient + `.heroContent` alignment.
