# Tijoray — Senior Design & UX Review

## Context

Tijoray is a luxury NFC jewelry brand site (React + Vite + Three.js + Supabase) at `/Users/akshatk/Desktop/My code projects/Tijoray Claude Website`. The build quality is already high: cohesive rose/cream/ink palette, Cormorant × Montserrat type pairing, a scroll-driven 3D pendant hero, a full Three.js configurator, and a brand voice that balances craftsmanship with cryptographic tech. This review identifies targeted improvements that deepen the luxurious-tech aesthetic without overhauling the system — focused on imagery gaps, typographic polish, color refinement, UX friction, and a handful of content-level fixes.

The goal is an editorial-grade experience where every page feels as considered as the home hero. Recommendations are prioritized so you can tackle the highest-impact items first.

---

## Priority 1 — Highest Impact

### 1. Editorial imagery for text-heavy pages
The [About](src/pages/AboutPage.tsx), [Technology](src/pages/TechnologyPage.tsx), and [Contact](src/pages/ContactPage.tsx) pages lean almost entirely on typography. Luxury sites like Cartier, Van Cleef, and Vacheron pair long-form copy with full-bleed atelier photography.

- **About hero:** add a full-bleed hero image (hands at the bench, close-up of a lathe, rose-gold ingot) behind `styles.hero` in [AboutPage.module.css](src/pages/AboutPage.module.css). Use a 70% darken gradient so serif copy still reads.
- **Mission section:** two-column — keep copy, add a 4:5 portrait editorial image on the right.
- **Technology page:** insert one or two macro shots of the NFC bail beside the "stone intelligence" blocks.
- Reuse existing assets in `/public/assets/editorial/` and `/public/assets/app/`; commission 3–4 new hero shots if budget allows.

### 2. Complete the broken / placeholder surfaces
These undermine trust on a "forever" brand:
- **Contact form** — wire submission (Resend / Supabase edge function). Current TODO at [ContactPage.tsx:35](src/pages/ContactPage.tsx#L35).
- **Checkout** — [CheckoutPage.tsx](src/pages/CheckoutPage.tsx) is a stub; complete Stripe integration + order confirmation email.
- **Footer dead links** — "Care Guide", "Craftsmanship", "Journal" should either ship minimal pages or be removed until ready. Grayed-out links read as unfinished, not coming-soon.

### 3. Navbar & button microcopy hierarchy
The primary CTA "Build Your Tijoray" competes visually with nav links. Recommendations for [Navbar.tsx](src/components/Navbar.tsx):
- Tighten CTA padding (`10px 22px`) and reduce letter-spacing from the existing uppercase treatment by ~0.5px.
- Introduce a **secondary ghost button** style (1px `--rose` border, transparent fill) for non-primary CTAs across the site — currently everything is either solid or a text link, which flattens hierarchy.

---

## Priority 2 — Design System Refinement

### 4. Typography polish
From [src/index.css](src/index.css) — the system is good, but small tweaks lift perceived quality:
- **Headline weight:** Cormorant at 300 can look thin on retina; add `font-synthesis: none;` and consider 400 for H2/H3 while keeping 300 for display H1 only.
- **Body line-height:** audit sans body copy — target `1.7` for paragraphs >60 characters; currently inconsistent across pages.
- **Italic emphasis:** the `<em>some things</em>` pattern on About is on-brand — codify it as a `.emphasis` utility with `font-style: italic; color: var(--rose-deep);` and apply across Collection/Technology intro copy.
- **Small-caps labels:** the uppercase 2.5–4px tracked eyebrows are strong; standardize to exactly `letter-spacing: 0.28em` and `font-size: 11px` via a single `--eyebrow` token.

### 5. Color refinement
- **Rose accent is slightly muted** (#B97A6A). For interactive states (hover, CTAs), shift to `--rose-deep` #9A5F51 — adds warmth and contrast on cream.
- **Onyx vs dark-story drift:** #0A0A0A (footer) and #111111 (ScrollStory) both read as "black" but produce a visible seam when sections stack. Pick one — recommend #0F0E0D (warm ink-black) for all dark sections.
- **Gold usage** — currently used for focus rings and some headings. Reserve gold exclusively for metallic references (material swatches in configurator, small accents) so rose stays the unambiguous brand primary.
- **Selection / focus:** the `::selection rgba(185,122,106,0.22)` is beautiful — pair with a `caret-color: var(--rose-deep);` globally.

### 6. Spacing rhythm
- Section vertical padding varies (80–140px); adopt an 8pt scale with `--space-section: clamp(80px, 10vw, 140px)` and apply consistently.
- Increase generous whitespace between editorial blocks on About and Technology — luxury is breathing room.

---

## Priority 3 — UX & Interaction

### 7. Configurator friction
[ConfiguratorPage](src/pages/ConfiguratorPage.tsx) is the crown jewel but has friction:
- **Progress indicator:** add a 4-step breadcrumb (Shape → Metal → Stone → Review) so buyers know how far they are.
- **Price reveal:** show live price update with a subtle animated counter rather than a static number.
- **Save configuration:** allow guests to save a design via email link (LocalStorage + magic-link) — reduces cart abandonment on a premium price point.

### 8. Portal UX
[PortalPage](src/pages/PortalPage.tsx) / [PortalPiecePage](src/pages/PortalPiecePage.tsx) feel utilitarian vs. the rest of the site. Post-purchase is where "luxury tech" lives — treat each piece page as a mini editorial: large 3D render, NFC tap timeline, memory vault preview with glassmorphism.

### 9. Micro-interactions
- **Cursor affordance:** add a custom cursor hover state (small rose dot) on the hero and product cards — subtle but premium.
- **Image lazy fade:** all `<img>` should fade in on decode using `loading="lazy"` + CSS transition, not pop in.
- **Scroll cue:** the home hero lacks a "scroll to continue" hint; add a subtle animated chevron or serif "↓" after 3s.

### 10. Accessibility & inclusivity
- Focus ring is gold-only — on gold/cream backgrounds it loses visibility. Use a dual ring: `outline: 2px solid var(--ink); outline-offset: 2px; box-shadow: 0 0 0 4px var(--gold);`.
- Audit all images for `alt` text — editorial shots currently use decorative alts in places that should describe content.
- Add `aria-current="page"` logic to navbar links for screen-reader users.
- Increase minimum body font-size on mobile from 14px to 15px in [Hero.module.css](src/components/Hero.module.css) and Features — 14px serifs on small screens are borderline illegible.

---

## Priority 4 — Content & Conversion

### 11. Homepage narrative additions
Between ScrollStory and Features, insert:
- **Press/recognition strip** — logos of any features (Vogue, Monocle, Wallpaper*) in a quiet greyscale row with `opacity: 0.55`.
- **Testimonial / founder quote** — single serif pull-quote on cream, attributed with small caps name + role.
- **Craft provenance module** — "Forged in [city]. Encrypted on-chain. Worn forever." with three small SVG icons.

### 12. Email capture
No newsletter signup exists sitewide. Add a quietly elegant footer module: single input, `cream-warm` bg, serif placeholder "Receive the Tijoray dispatch." Ties to Resend / Beehiiv.

### 13. Social proof + social links
Footer has no Instagram/Pinterest/TikTok — essential for a visual luxury brand. Add minimal line-icon row (no filled logos) with generous spacing.

### 14. Journal (soft launch)
Even a single "Founding Notes" post (atelier dispatch, behind-the-scenes) turns "Coming Soon" into a living section. Markdown-driven via MDX would take ~half a day.

---

## Critical files to modify

| Concern | File |
|---|---|
| Global tokens, type scale | [src/index.css](src/index.css) |
| Nav CTA + button system | [src/components/Navbar.tsx](src/components/Navbar.tsx), [Navbar.module.css](src/components/Navbar.module.css) |
| Home scroll cue + press strip | [src/components/Hero.module.css](src/components/Hero.module.css), [src/pages/HomePage.tsx](src/pages/HomePage.tsx) |
| About editorial imagery | [src/pages/AboutPage.module.css](src/pages/AboutPage.module.css) |
| Technology macro shots | [src/pages/TechnologyPage.module.css](src/pages/TechnologyPage.module.css) |
| Contact form backend | [src/pages/ContactPage.tsx](src/pages/ContactPage.tsx) |
| Configurator progress + save | [src/pages/ConfiguratorPage.tsx](src/pages/ConfiguratorPage.tsx), [ConfiguratorPage.module.css](src/pages/ConfiguratorPage.module.css) |
| Portal editorial upgrade | [src/pages/PortalPage.tsx](src/pages/PortalPage.tsx), [PortalPiecePage.tsx](src/pages/PortalPiecePage.tsx) |
| Footer newsletter + socials | [src/components/Footer.tsx](src/components/Footer.tsx), [Footer.module.css](src/components/Footer.module.css) |

## Verification

- Run `npm run dev`; click through every route in the table above, mobile + desktop viewports.
- Lighthouse accessibility ≥ 95 on Home, Configurator, About.
- Manually test: submit Contact form (confirm email arrives), complete a Stripe test checkout → order success → portal entry.
- Cross-browser: Safari (macOS + iOS), Chrome, Firefox — verify scroll behavior and 3D performance.
- `prefers-reduced-motion` on: confirm ScrollStory gracefully degrades.
