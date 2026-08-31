# Tax and promo codes

Two things the code cannot do for you: register with a tax authority, and remit
what you collected. This is what the code does, what you have to do, and the
order to do it in.

## The short version

Stripe Tax calculates. Stripe coupons discount. We record the outcome so it can
be reported without asking Stripe a question every time.

The one rule worth internalising: **a discount is applied before tax is
calculated.** Stripe does this automatically. It is also the single easiest
thing to get wrong by computing a discounted price yourself, which is why no
code in this repo ever computes what a customer owes — checkout is handed a
promotion code ID and Stripe derives everything from it.

## Turning tax on

`STRIPE_TAX_ENABLED` gates `automatic_tax` in [api/create-checkout.ts](api/create-checkout.ts).
It exists because enabling tax on an unconfigured account **does not fail when
the session is created** — the session is created happily, and the calculation
then fails for a real customer in the middle of checkout.

Stripe Tax settings are per-account, and a sandbox is its own account. So:

| Environment | Stripe keys | `STRIPE_TAX_ENABLED` |
| --- | --- | --- |
| Development / Preview | sandbox | `true`, once the sandbox is configured below |
| Production | live | `false` until the live account is configured below |

Sandbox tax is not billed and creates no filing obligation, so turn it on there
first and actually run a checkout. Per environment:

1. **Set the origin address.** Stripe Dashboard → Settings → Tax → your business
   address. Tax is calculated from origin *and* destination; without this it
   cannot start.
2. **Add at least one registration.** Settings → Tax → Registrations. You are in
   Ontario, so that means GST/HST. A registration is what tells Stripe *to*
   collect somewhere — with none, it calculates zero everywhere and you have a
   quiet under-collection rather than an error.
3. **Check the preset tax code.** Line items are sent as `txcd_99999999`
   (General — Tangible Goods) and shipping as `txcd_92010001`. Jewellery has no
   dedicated code; tangible goods is correct for a shipped physical piece.
4. **Then** set the env var and run a real test checkout to a taxable address.

What this buys you once it is on: Stripe charges the destination province's
GST/HST on Canadian orders and zero-rates exports, so most international orders
come through with no tax line at all.

## What you still have to do

Stripe calculates and reports. It does not register you, and it does not file.

- **Watch thresholds.** Settings → Tax → Monitoring shows where your sales are
  approaching a registration obligation. It will not register for you, and it
  will not tell you that you crossed one last quarter.
- **File and remit** on your own schedule, using the numbers below.
- **Revisit if you start shipping somewhere new.** The allowed countries are
  `US`, `CA`, `GB`, `AU`, set in [api/create-checkout.ts](api/create-checkout.ts).
  Adding a country is a code change *and* a registration question.

## Where the numbers come from

Every paid session writes an `Orders` row with subtotal, discount, shipping, tax,
total, the destination country and state, and Stripe's per-jurisdiction
breakdown. It is idempotent on the session ID, so a webhook redelivery cannot
double-count revenue.

**Admin → Dashboard** shows "Tax collected by jurisdiction", grouped by shipping
destination over all time — the shape a remittance return asks for. Taxable base
is subtotal less discount, before tax: the figure a return declares.

"Tax unresolved" counts orders where Stripe could not finish the calculation.
Each one is a hole in a filing, not a rounding difference. Investigate rather
than average away.

One caveat worth knowing: revenue on the dashboard is split into **Charged**
(real, from `Orders`) and an older metal-derived **estimate** for pieces sold
before this table existed. They are shown separately on purpose. One is a fact
and the other is a guess, and blending them produces a number that is neither.

## Promo codes

**Admin → Promo Codes.** Issuing a code creates a Stripe coupon and promotion
code, then records who you gave it to.

Division of responsibility:

- **Stripe** enforces the discount, expiry, redemption cap, minimum order, and
  first-order-only. Its redemption counter is what actually stops a code working,
  so that is the count the panel shows.
- **We** record who holds a code, for which campaign, with notes — the thing
  Stripe has nowhere to put. A coupon with nine redemptions and no memory of who
  it was issued to is not a record of anything.
- **`Orders`** answers who used it. Stripe only counts.

Discount terms are create-only, mirroring Stripe: a coupon's percentage cannot
change once issued, because people are already holding the code. To change a
discount, turn the old code off and mint a new one.

### Where a customer types it

Both places. The order summary on `/checkout` validates a code against Stripe and
shows the discount before the shopper leaves the site. If they leave the box
empty, Stripe's own promotion-code field is offered on its page instead —
Checkout permits one or the other, never both at once.

A code typed by someone still creating their account cannot be validated (there
is no session yet, and a first-order-only code has no customer to judge). It is
carried through and validated server-side with the order, and a rejection comes
back with the same wording.

### Statuses in the panel

| Status | Meaning |
| --- | --- |
| `live` | Works right now |
| `off` | Deactivated here or in Stripe |
| `expired` | Past its expiry date |
| `used up` | Redemption cap reached |
| `not in Stripe` | Our ledger has it, Stripe does not — archived or deleted directly in the Stripe dashboard. **It will not work at checkout.** |

That last one is the only genuinely surprising state, and it comes from editing
codes in the Stripe dashboard instead of here. Issue and retire codes in the
panel and it will not occur.

## Setup checklist

- [ ] Run `supabase/migrations/0008_orders_tax_and_promos.sql`
- [ ] Sandbox: set origin address + a test registration, then `STRIPE_TAX_ENABLED=true` in Preview/Development
- [ ] Run a sandbox checkout to a taxable address; confirm an `Orders` row appears with a non-zero `tax_cents`
- [ ] Issue a sandbox promo code and redeem it; confirm the redemption appears under the code
- [ ] Live account: origin address + real registrations, confirm Settings → Tax shows active
- [ ] Only then: `STRIPE_TAX_ENABLED=true` in Production
