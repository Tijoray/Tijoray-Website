# Tijoray — Pre-Launch Checklist

Everything that needs to flip from "development / test" to "production" before opening the site to real customers. Grouped by service. Each item shows **what changes**, **where**, and **why**.

---

## Stripe — switch from test mode to live

Currently running on `sk_test_…` keys. Test-mode customers, payments, and webhooks don't carry over to live — you recreate them.

### In Stripe dashboard
- [ ] Complete **business verification** (bank account, tax ID, business address). Required before Stripe pays out. Settings → Business settings → Activate account.
- [ ] Toggle **Test mode OFF** (top of sidebar — orange "TEST" badge disappears).
- [ ] **Branding** in live mode — upload `Logo.svg`, set business name "Tijoray", accent color `#B97A6A`. (Live mode has separate branding from test mode.)
- [ ] Developers → API keys → copy new **Secret key** — starts `sk_live_…`
- [ ] Developers → Webhooks → **Add endpoint** (this is a new live-mode webhook, separate from the test one):
  - URL: `https://tijoray.com/api/stripe-webhook`
  - Events: `checkout.session.completed`
  - Create → copy new signing secret — starts `whsec_…`

### In Vercel env vars (Production scope)
- [ ] `STRIPE_SECRET_KEY` → new `sk_live_…`
- [ ] `STRIPE_WEBHOOK_SECRET` → new live `whsec_…`
- [ ] Redeploy

### Verify
- [ ] Do one real purchase with a real card — £5 test product or similar
- [ ] Refund it in Stripe dashboard → confirm the flow
- [ ] Stripe → Events → see the live `checkout.session.completed` with **200** response

**Keep the test-mode webhook alive** — useful for ongoing dev work. It runs in parallel.

---

## Cloudflare R2 — move to custom domain

Currently serving files from `pub-<hash>.r2.dev`. Cloudflare explicitly says this isn't for production — rate-limited.

### Step 1 — Move DNS from Vercel to Cloudflare
Domain stays **registered at Vercel**; only DNS provider changes.

- [ ] Cloudflare dash → **+ Add a site** → `tijoray.com` → Free plan
- [ ] Review scanned DNS records; ensure apex + www + any subdomains point at Vercel
- [ ] Copy the two Cloudflare nameservers (e.g. `alice.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
- [ ] Vercel → Domains → `tijoray.com` → Nameservers → Custom nameservers → paste both → Save
- [ ] Wait 5 min–2 hr for Cloudflare dash to show "Active"
- [ ] In Cloudflare DNS panel: for Vercel records, set proxy toggle to **grey cloud (DNS only)** — Vercel handles SSL; Cloudflare proxy would conflict
- [ ] Verify `https://tijoray.com` still loads

### Step 2 — Connect custom domain to R2 bucket
- [ ] R2 → `tijoray-uploads` → Settings → **Custom Domains** → **Connect Domain** → `media.tijoray.com`
- [ ] Cloudflare auto-creates the CNAME
- [ ] Wait for "Active"

### Step 3 — Update env var
- [ ] Vercel: `PUBLIC_FILE_BASE_URL` → `https://media.tijoray.com`
- [ ] Redeploy

### Step 4 — Disable r2.dev subdomain (optional but recommended)
- [ ] R2 bucket → Settings → **Public access** → **R2.dev subdomain** → Disable. Forces all public access through your custom domain.

### Verify
- [ ] Upload a file via portal → confirm new URL starts with `media.tijoray.com`
- [ ] Old files uploaded under `pub-<hash>.r2.dev` — they remain accessible via `media.tijoray.com/<key>` since it's the same bucket. No data migration needed.

---

## Resend — verify sending domain

Currently `api/stripe-webhook.ts:110` sends from `hello@tijoray.com`. Without domain verification, Resend will reject.

- [ ] Resend dashboard → **Domains** → Add Domain → `send.tijoray.com` (subdomain — avoids conflict with Purelymail's SPF/DKIM on root `tijoray.com`)
- [ ] Copy DNS records (TXT for SPF, TXT for DKIM, MX)
- [ ] Add all to Cloudflare DNS (once you've moved DNS there) — or Vercel DNS if still there
- [ ] Wait 5–10 min → Resend verifies
- [ ] Update [api/stripe-webhook.ts:110](api/stripe-webhook.ts#L110) — change `from: 'Tijoray <hello@tijoray.com>'` to `from: 'Tijoray <hello@send.tijoray.com>'`
- [ ] Commit + redeploy

### Verify
- [ ] Test purchase → confirm order email arrives in customer inbox
- [ ] Check the email headers — `From: hello@send.tijoray.com`, SPF and DKIM both pass

---

## Google OAuth — publish app

Currently in **Testing** mode. Only users you've added in Test Users can sign in with Google. For public launch, publish.

- [ ] Google Cloud Console → **APIs & Services** → **OAuth consent screen**
- [ ] Click **Publish app** → confirm
- [ ] Status changes to "In production"
- [ ] No verification required — you only use basic scopes (`email`, `profile`, `openid`)
- [ ] (Optional but nice) Add real links for Privacy Policy and Terms of Service on the consent screen

### Verify
- [ ] Sign in with Google from an account **not** in your test user list — should work without "unverified app" warning

---

## Purelymail — receive mail at curator@tijoray.com

Site lists `curator@tijoray.com` and `admin@tijoray.com` — both need to actually receive.

- [ ] Purelymail → Domains → confirm `tijoray.com` is verified
- [ ] Add routing rule or mailbox for `curator@tijoray.com` (forward to `admin@tijoray.com` or a real inbox)
- [ ] MX records in Cloudflare DNS should point at Purelymail's mail servers
- [ ] Test: email curator@tijoray.com from an external account → confirm delivery

---

## Content — broken / placeholder surfaces

From [claude review.md](claude review.md) P1 #2. These read as unfinished on a "forever" brand.

### Contact form backend
- [ ] [src/pages/ContactPage.tsx:35](src/pages/ContactPage.tsx#L35) — has a `TODO` for form submission
- [ ] Pick backend: Resend (simplest, you already have an account), Formspree, or Supabase Edge Function
- [ ] Wire up → redeploy → submit a test message → confirm email arrives

### Legal pages
- [ ] Privacy Policy (`/privacy`) — required for Google OAuth and general compliance (UK/EU: GDPR; US: CCPA)
- [ ] Terms of Service (`/terms`)
- [ ] Cookie Preferences (footer already links to `#`)
- [ ] Update footer dead links in [src/components/Footer.tsx:53-55](src/components/Footer.tsx#L53)

### "Soon" pages (decide: ship minimal version or remove from footer)
- [ ] Gift a Legacy
- [ ] Craftsmanship
- [ ] Journal (even one "Founding Notes" post = valid)
- [ ] Care Guide
- [ ] FAQ

---

## Editorial imagery

From [claude review.md](claude review.md) P1 #1. Text-heavy pages feel light without real photography.

- [ ] About hero — full-bleed atelier photo behind `styles.hero` in [src/pages/AboutPage.module.css](src/pages/AboutPage.module.css)
- [ ] Technology page — macro shots of the NFC bail beside "stone intelligence" blocks
- [ ] Contact page — atelier or bench photo
- [ ] Commission or source 3–4 new hero shots
- [ ] Add to `public/assets/editorial/`
- [ ] Wire into the relevant pages

---

## Vercel — production domain + canonical redirect

- [ ] Vercel → Settings → Domains → set `tijoray.com` as **Production Domain**
- [ ] Decide canonical: apex (`tijoray.com`) or www (`www.tijoray.com`). Pick one.
- [ ] Add the other as a 308 redirect to canonical (Vercel Domains UI handles this with a toggle)
- [ ] Confirm `https://` only — Vercel force-redirects HTTP → HTTPS by default

---

## GitHub repo rename

- [ ] GitHub → `Arcana-Website` repo → Settings → General → Repository name → `Tijoray-Website` → Rename
- [ ] Locally: `git remote set-url origin https://github.com/ak710/Tijoray-Website.git`
- [ ] (Old URLs auto-redirect but better to update)

---

## Pre-launch testing

### End-to-end flows
- [ ] Sign up → email verification → login
- [ ] Sign in with Google (from a non-test-user account after publishing)
- [ ] Configure pendant → add to cart → checkout with real card
- [ ] Order confirmation email arrives
- [ ] Portal → piece appears → upload photo/video/voice note
- [ ] Uploaded file loads back correctly in portal

### Accessibility
- [ ] Lighthouse a11y score ≥ 95 on Home, Configurator, About
- [ ] Keyboard navigation works end-to-end (tab through every interactive element)
- [ ] Alt text on every `<img>` — audit done manually

### Cross-browser / device
- [ ] Safari macOS + iOS
- [ ] Chrome
- [ ] Firefox
- [ ] Mobile viewport — 375px, 390px, 414px
- [ ] Tablet viewport — 768px, 1024px

### Performance
- [ ] Lighthouse perf ≥ 85 on Home
- [ ] First Load JS < 300KB (check Vercel deployment insights)
- [ ] Images lazy-load below the fold
- [ ] 3D canvas works on mid-range mobile (iPhone 12, Pixel 6)
- [ ] `prefers-reduced-motion` disables ScrollStory animations gracefully

### SEO
- [ ] `og:image` points to a real Tijoray SVG/PNG (currently `https://tijoray.com/assets/brand/Logo.svg` in [index.html](index.html))
- [ ] Sitemap generated (`public/sitemap.xml`)
- [ ] `robots.txt` sitemap URL points to correct production domain (done: `https://www.tijoray.com/sitemap.xml`)
- [ ] Verify site on Google Search Console

---

## Analytics (optional but recommended)

- [ ] Pick provider: Vercel Analytics (simplest, built-in), Plausible (privacy-first paid), Fathom, or GA4
- [ ] Add tracking script or package
- [ ] Set up conversion events: signup, add-to-cart, checkout completed

---

## Environment variable summary

All should be set for **Production** scope in Vercel at launch:

| Variable | Launch value |
|---|---|
| `VITE_SUPABASE_URL` | unchanged |
| `VITE_SUPABASE_ANON_KEY` | unchanged |
| `VITE_SITE_URL` | `https://tijoray.com` |
| `STRIPE_SECRET_KEY` | **`sk_live_…`** (swapped from test) |
| `STRIPE_WEBHOOK_SECRET` | **new live `whsec_…`** (swapped from test) |
| `SUPABASE_SERVICE_ROLE_KEY` | unchanged |
| `AWS_ACCESS_KEY_ID` | R2 token access key |
| `AWS_SECRET_ACCESS_KEY` | R2 token secret |
| `AWS_REGION` | `auto` |
| `AWS_S3_BUCKET_NAME` | `tijoray-uploads` |
| `S3_ENDPOINT` | `https://<account>.r2.cloudflarestorage.com` |
| `PUBLIC_FILE_BASE_URL` | `https://media.tijoray.com` (after DNS move) |
| `RESEND_API_KEY` | unchanged (from new Tijoray Resend account) |

---

## Final go-live checklist (day of launch)

1. [ ] Complete Stripe business verification — wait for approval email
2. [ ] Flip Stripe env vars to live → redeploy
3. [ ] Flip R2 `PUBLIC_FILE_BASE_URL` to `media.tijoray.com` → redeploy
4. [ ] Publish Google OAuth app
5. [ ] Run all end-to-end flows one more time
6. [ ] Announce
