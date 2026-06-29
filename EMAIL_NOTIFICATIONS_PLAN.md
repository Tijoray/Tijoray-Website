# Email Notifications — Design Doc

Status: **Implemented (code).** Pending operational setup: run the migration,
set env vars, and configure the Supabase database webhook (see §14). This
documents the full lifecycle email system: what we send, to whom, what triggers
each message, the schema + infrastructure required, and the shared branded
template.

### Files
- `supabase/migrations/0002_email_notifications.sql` — schema (§5)
- `lib/email.ts` — branded template + idempotent send functions (§10)
- `api/stripe-webhook.ts` — fires #1 (crafting) — *edited*
- `api/cron/memory-reminders.ts` + `vercel.json` crons — fires #3 (§6)
- `api/hooks/piece-changed.ts` — fires #4 / #6 / #7 (§9, §14)

---

## 1. Goals

- A single, reusable, on-brand HTML email template (cream / burgundy / rose,
  Cormorant + Montserrat feel) so every message looks like Tijoray.
- Cover the buyer's full journey: purchase → add memories → ship → recipient
  links → recipient views.
- Be **idempotent** — crons and webhooks retry, so no customer ever gets the
  same email twice.
- Decouple triggers from *where* a state change happens (web portal vs. the
  recipient mobile app) using **Supabase Database Webhooks**.

---

## 2. Current state (what exists today)

| Thing | Status |
|---|---|
| Resend SDK | ✅ Installed (`resend@6.11.0`), sending from `Tijoray <hello@tijoray.com>` |
| Order email | ✅ Inline HTML in [`api/stripe-webhook.ts`](api/stripe-webhook.ts) ("being crafted") |
| `Pieces.sender_id` | ✅ Buyer (set at purchase) |
| `Pieces.receiver_id` / `nfc_linked_at` | ✅ Columns exist; set by the **mobile app** when a recipient links |
| `Messages.revealed_at` | ✅ Column exists; candidate "first viewed" signal |
| Shipped status | ❌ No column, no trigger |
| Reminder / deadline | ❌ No deadline, no cron, no dedupe flags |
| Cron jobs | ❌ None configured in `vercel.json` |

**Takeaway:** the templates are a few hours; the *plumbing* (schema, cron,
DB webhooks, idempotency) is the real work. Only "being crafted" has a live
trigger today.

---

## 3. Email inventory

Audience legend: **B** = buyer/sender, **R** = recipient.

**Locked decisions:** crafting + "start building" are **one merged email** (#1);
"memories sealed" is **folded into the shipped email** (#4); reminders are
**3 tiers** (§6); recipient first-view (#7) depends on a mobile-app integration
that is **not yet implemented**. The recipient welcome (#8) is **dropped for
now** (kept below for reference).

| # | Email | Audience | Trigger | Condition / notes |
|---|---|---|---|---|
| 1 | **Order received — being crafted + start building** | B | Stripe `checkout.session.completed` (existing) | Merged: confirms the order/receipt **and** carries the primary "Start building your memories" CTA to the portal. Replaces the current inline HTML. |
| 3 | **Reminder: add memories before it ships** | B | **Vercel Cron** (daily) | Only if the piece has **0 memories** and is **not yet shipped**. 3 escalating tiers (see §6). |
| 4 | **Your piece has shipped (memories sealed)** | B | Supabase DB webhook on `Pieces` when `status → shipped` | Folded: announces shipping **and** provides closure that the memories are now locked in. |
| 6 | **<Recipient> has linked their piece** | B | Supabase DB webhook on `Pieces` when `receiver_id` goes `null → set` | The mobile app sets `receiver_id`. Personalized with recipient name. |
| 7 | **<Recipient> has viewed their memories** | B | Supabase DB webhook on first-view signal | **Pending mobile integration** (§7). Fire **once** (first view), not every view. |
| ~~8~~ | ~~Welcome — your memories are ready~~ | ~~R~~ | — | **Dropped for now.** Only possible post-link (we don't have recipient email until then — see §8). Revisit later. |

### Items from your original list, mapped
- "Piece is being crafted" → **#1** (now merged with start-building)
- "You have X days to add memories before shipped" → **#1 CTA + #3** (reminders)
- "Piece is shipped" → **#4** (with sealed-memories closure folded in)
- "Recipient has linked their piece" → **#6**
- "Recipient has viewed their memories" → **#7** (pending mobile integration)

---

## 4. Architecture

```
                         ┌─────────────────────────────┐
  Stripe purchase ─────► │ api/stripe-webhook.ts        │ ──► #1, #2
                         └─────────────────────────────┘
                         ┌─────────────────────────────┐
  Vercel Cron (daily) ─► │ api/cron/memory-reminders.ts │ ──► #3 (tiered)
                         └─────────────────────────────┘
   Supabase DB webhooks  ┌─────────────────────────────┐
   on Pieces UPDATE ───► │ api/hooks/piece-changed.ts   │ ──► #4/#5, #6, #7, #8
                         └─────────────────────────────┘
                                       │
                                       ▼
                         ┌─────────────────────────────┐
                         │ api/_lib/email.ts            │  shared template + send
                         └─────────────────────────────┘
```

- **`api/_lib/email.ts`** — one branded HTML shell + one typed function per
  email (`sendCraftingEmail`, `sendShippedEmail`, …). All Resend calls go
  through here. This is the "nice template" deliverable.
- **Stripe webhook** — extend the existing handler to send #1/#2 via the new
  module (instead of the current inline HTML).
- **Cron** — new function, scheduled daily in `vercel.json`, for #3.
- **DB-webhook endpoint** — single endpoint that receives `Pieces` UPDATE
  payloads from Supabase and dispatches #4–#8 based on which columns changed.

---

## 5. Schema changes (Supabase)

```sql
-- Pieces: shipping + lifecycle
ALTER TABLE "Pieces"
  ADD COLUMN status text NOT NULL DEFAULT 'crafting',  -- crafting | shipped | delivered
  ADD COLUMN shipped_at timestamptz,
  ADD COLUMN memory_deadline timestamptz,              -- set at purchase = created_at + window
  ADD COLUMN first_viewed_at timestamptz;              -- set by the mobile app on first recipient view

-- Idempotent send log: one row per (piece, email type). Unique constraint
-- guarantees we never send the same email twice even under retries.
CREATE TABLE "Email_Log" (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id    uuid REFERENCES "Pieces"(id) ON DELETE CASCADE,
  type        text NOT NULL,            -- 'crafting' | 'reminder_1' | 'shipped' | 'linked' | 'viewed' ...
  sent_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (piece_id, type)
);
```

- `status` flips to `shipped` → triggers the shipped DB webhook.
- `memory_deadline` is computed at purchase so the reminder cron is a simple
  date query.
- `first_viewed_at` must be written by the **mobile app** (see §7).
- `Email_Log` is the backbone of idempotency. Every sender does
  `INSERT ... ON CONFLICT DO NOTHING` and only sends if the insert created a
  row. For tiered reminders, each tier is its own `type` (`reminder_1`, …).

---

## 6. The memory-reminder logic (#3)

Your call: *one* "add your memories" email, then *more engaging* reminders if
still empty. Implemented as tiers that stop the moment memories appear or the
piece ships.

- **Cron:** daily, e.g. `0 16 * * *` (one afternoon send window).
- **Eligibility query** — pieces where:
  - `status = 'crafting'` (not shipped), AND
  - memory count = 0 (`Message_Items` for the piece is empty), AND
  - the tier's `Email_Log` row doesn't exist yet, AND
  - enough time has elapsed for the tier.
- **Tiers** (relative to `created_at`, tunable):
  - `reminder_1` — day 3: gentle "ready when you are."
  - `reminder_2` — day 7: warmer, shows what a memory can be (photo/voice/note).
  - `reminder_3` — day ~`deadline − 2d`: urgent "last chance before it ships."
- **Stop conditions:** any memory added, or `status = shipped`. Because we
  re-check emptiness each run, the moment they add something the remaining
  tiers naturally never fire.

> If you'd rather literally send only one reminder, we drop to a single
> `reminder_1` tier — same machinery.

---

## 7. Recipient "viewed" signal (#7) — needs mobile-app cooperation

> **Status: pending.** The mobile app does not yet write a first-view signal.
> We'll build the email + DB webhook so it's ready, but #7 stays dormant until
> the app integration lands.

Viewing happens in the mobile app, so the web backend can't observe it on its
own. Cleanest contract:

- The app writes `Pieces.first_viewed_at = now()` **once**, the first time the
  recipient opens the memories (or sets `Messages.revealed_at`).
- A Supabase DB webhook on that column change (`null → set`) calls our hook
  endpoint, which emails the buyer #7.
- Firing on `first_viewed_at` (not every open) avoids spamming the buyer.

**Action item for the app team:** stamp `first_viewed_at` on first view. If
the app already sets `Messages.revealed_at`, we can key off that instead — just
confirm which.

---

## 8. Recipient-facing email caveat (#8)

Checkout collects the recipient's **name + phone**, not email. So we *cannot*
email the recipient an invitation up front — their onboarding is via
phone/NFC/app, which is correct. We only learn their email when they link and
create an account (`receiver_id` resolves to an auth user with an email). So:

- Recipient-facing email (#8) is only feasible **after** linking.
- Everything pre-link aimed at the recipient should be SMS/app, out of scope
  here.

Confirm whether you want a post-link recipient welcome at all, or keep all
emails buyer-facing.

---

## 9. Security & infrastructure

- **Supabase DB Webhooks** (Database → Webhooks): configure an HTTP POST on
  `Pieces` UPDATE to `https://tijoray.com/api/hooks/piece-changed`, with a
  custom header `x-tijoray-webhook-secret: <secret>`. The endpoint rejects any
  request missing the secret. Payload includes `record` + `old_record`, so we
  diff columns to decide which email(s) to send.
- **Cron auth:** Vercel Cron requests carry a bearer (`CRON_SECRET`); the cron
  endpoint verifies it so it can't be invoked publicly.
- All endpoints use the **service-role** Supabase client (server-only), never
  the anon key.
- `vercel.json` gains a `crons` entry:
  ```json
  "crons": [{ "path": "/api/cron/memory-reminders", "schedule": "0 16 * * *" }]
  ```

### New env vars
| Var | Purpose |
|---|---|
| `TIJORAY_WEBHOOK_SECRET` | Shared secret for Supabase DB webhook calls |
| `CRON_SECRET` | Guards the cron endpoint |
| (existing) `RESEND_API_KEY`, `VITE_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Reused |

---

## 10. The shared template (`api/_lib/email.ts`)

- **Layout:** table-based HTML (email clients ignore fl/grid), max-width ~600px,
  centered card on a cream background.
- **Brand tokens** (from `src/index.css`): cream `#F7F7F2`, cream-warm
  `#EFE8DE`, ink `#1D1A19`, rose `#B97A6A`, burgundy `#4A2326`, gold `#BFA15F`.
- **Fonts:** request Cormorant Garamond / Montserrat via `<link>` but always
  specify fallbacks (`Georgia, serif` / `Arial, Helvetica, sans-serif`) since
  many clients strip web fonts.
- **Components:** logo header, serif headline, body copy, one burgundy CTA
  button (bulletproof VML button for Outlook), divider, footer with address +
  unsubscribe-style note.
- **API shape:**
  ```ts
  shell({ preheader, headline, body, ctaLabel?, ctaHref? }): string
  sendCraftingEmail(to, { name, items, total })
  sendMemoryReminder(to, { name, tier, deadline, portalUrl })
  sendShippedEmail(to, { name, recipientName })
  sendRecipientLinkedEmail(to, { name, recipientName, portalUrl })
  sendRecipientViewedEmail(to, { name, recipientName })
  ```
- **Deliverability:** include a plain-text version per send (Resend supports
  `text` alongside `html`) to improve inbox placement.

---

## 11. Implementation plan (when approved)

1. **Schema** — run the §5 migration in Supabase.
2. **`api/_lib/email.ts`** — template shell + send functions + `Email_Log`
   idempotency helper.
3. **Stripe webhook** — swap inline email for `sendCraftingEmail` (+ #2).
4. **`api/cron/memory-reminders.ts`** + `vercel.json` cron entry.
5. **`api/hooks/piece-changed.ts`** — DB-webhook receiver dispatching #4–#8.
6. **Configure Supabase DB webhook** on `Pieces` UPDATE → the hook endpoint.
7. **Set env vars** in Vercel.
8. **Mobile-app coordination** — stamp `first_viewed_at` on first view.

---

## 12. Testing

- Unit-render each template to an `.html` file and preview in browser + a tool
  like Litmus/Email on Acid (or at least Gmail + Apple Mail + Outlook).
- Trigger the Stripe email via Stripe CLI (`stripe trigger checkout.session.completed`).
- Cron: invoke the endpoint manually with the `CRON_SECRET`; seed a piece with
  `created_at` in the past and no memories.
- DB webhook: flip `status`/`receiver_id`/`first_viewed_at` on a test piece in
  Supabase and confirm the right single email fires (and not twice on a manual
  webhook re-send).

---

## 13. Decisions — resolved

1. ✅ **Merged** — #1 is one email: crafting/receipt + "start building" CTA.
2. ✅ **Folded** — "memories sealed" lives inside the #4 shipped email.
3. ✅ **Dropped for now** — no recipient-facing welcome (#8); all emails are
   buyer-facing. Revisit once the recipient relationship warrants it.
4. ✅ **3 tiers** — reminders at day 3 / day 7 / deadline−2 (§6), auto-stopping
   when a memory is added or the piece ships.
5. ⏳ **Pending mobile integration** — the app will stamp a first-view signal
   later; #7 is built but dormant until then. Decide at integration time
   whether it's a new `first_viewed_at` column or existing `Messages.revealed_at`.

### Still to confirm before/at build time
- Exact reminder send time + tier day offsets (defaults proposed in §6).
- Memory window length feeding `memory_deadline` (default: 14 days from purchase).

### Defaults shipped in code
- `MEMORY_WINDOW_DAYS = 14` (`lib/email.ts`).
- Reminder tiers at day **3 / 7 / 12** (`api/cron/memory-reminders.ts`).
- Cron at **16:00 UTC daily** (`vercel.json`).

---

## 14. Deployment / setup checklist

Code is in place; these operational steps make it live:

1. **Run the migration** — `supabase/migrations/0002_email_notifications.sql`
   in the Supabase SQL editor (or `supabase db push`). Adds `status`,
   `shipped_at`, `memory_deadline`, `first_viewed_at` to `Pieces` and creates
   `Email_Log`. Existing pieces are backfilled to `status = 'shipped'`.

2. **Set env vars** in Vercel (Production + Preview):
   | Var | Purpose |
   |---|---|
   | `RESEND_API_KEY` | (existing) Resend send key |
   | `VITE_SITE_URL` | (existing) absolute site URL for links |
   | `SUPABASE_SERVICE_ROLE_KEY` | (existing) server DB access |
   | `CRON_SECRET` | **new** — Vercel sends it as `Authorization: Bearer …`; the cron rejects mismatches |
   | `TIJORAY_WEBHOOK_SECRET` | **new** — shared secret for the Supabase DB webhook header |

3. **Configure the Supabase Database Webhook** (Database → Webhooks):
   - Table `Pieces`, event **UPDATE**, type **HTTP Request**, method **POST**
   - URL: `https://<your-site>/api/hooks/piece-changed`
   - HTTP header: `x-tijoray-webhook-secret: <TIJORAY_WEBHOOK_SECRET>`
   - This drives #4 (shipped), #6 (linked), #7 (viewed).

4. **Verify `hello@tijoray.com` is a verified Resend sender/domain.**

5. **Mobile-app integration (later, for #7):** the recipient app must stamp
   `Pieces.first_viewed_at = now()` exactly once, on first view. Until then #7
   stays dormant (everything else works without it).

### How each email is triggered in production
- **#1 crafting** — automatic on Stripe `checkout.session.completed`.
- **#3 reminders** — daily cron; only for `status='crafting'` pieces with zero
  memories; tier auto-advances; stops on first memory or ship.
- **#4 shipped** — flip `Pieces.status` to `'shipped'` (Supabase dashboard or
  your tooling) → DB webhook → email.
- **#6 linked** — app sets `receiver_id` → DB webhook → email.
- **#7 viewed** — app sets `first_viewed_at` → DB webhook → email.

### Testing
- **Crafting:** `stripe trigger checkout.session.completed` (or a real test
  purchase) → check inbox + an `Email_Log` row with `type='crafting'`.
- **Reminders:** seed a test piece with `created_at` 8 days ago, `status`
  `'crafting'`, no memories; `curl` the cron with
  `Authorization: Bearer $CRON_SECRET` → expect tier 2.
- **Shipped/linked/viewed:** edit the columns on a test piece in Supabase and
  confirm exactly one email per transition (re-saving must NOT resend — the
  `Email_Log` unique constraint guarantees this).
