/**
 * Tijoray lifecycle emails — shared branded template + send functions.
 *
 * Server-only (uses the Supabase service-role key and the Resend secret). Lives
 * OUTSIDE /api so Vercel never turns it into an endpoint; the api/* functions
 * import from here.
 *
 * Every send goes through `dispatch()`, which claims a row in Email_Log before
 * sending. A unique-violation on (ref, type) means the email already went out,
 * so retried crons / re-delivered DB webhooks are exactly-once.
 */
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const FROM = 'Tijoray <hello@tijoray.com>'
const SITE = (process.env.VITE_SITE_URL ?? 'https://tijoray.com').replace(/\/+$/, '')

/** Memory-collection window length (days from purchase). Mirrors the cron. */
export const MEMORY_WINDOW_DAYS = 14

/* ── Brand palette (from src/index.css) ──────────────────────────────────── */
const C = {
  cream:     '#F7F7F2',
  creamWarm: '#EFE8DE',
  ink:       '#1D1A19',
  inkMid:    '#4D4641',
  inkSoft:   '#8A827B',
  rose:      '#B97A6A',
  burgundy:  '#4A2326',
  gold:      '#BFA15F',
  border:    '#D9D1C6',
}
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif"
const SANS  = "'Montserrat', Arial, Helvetica, sans-serif"

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

/** First name for greetings; falls back to a warm default. */
export function firstName(name?: string | null): string {
  const n = name?.trim().split(/\s+/)[0]
  return n ? esc(n) : 'there'
}

const fmtUSD = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    .format(cents / 100)

export const fmtDate = (iso: string | Date) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

/* ── Branded HTML shell ──────────────────────────────────────────────────── */
type ShellOpts = {
  preheader: string
  headline:  string
  bodyHtml:  string
  ctaLabel?: string
  ctaHref?:  string
  footnote?: string
}

function button(label: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 8px;">
    <tr>
      <td align="center" bgcolor="${C.burgundy}" style="border-radius:2px;">
        <a href="${esc(href)}" target="_blank"
           style="display:inline-block;padding:16px 36px;font-family:${SANS};font-size:13px;font-weight:600;
                  letter-spacing:2px;text-transform:uppercase;color:${C.cream};text-decoration:none;">
          ${esc(label)}
        </a>
      </td>
    </tr>
  </table>`
}

function shell(o: ShellOpts): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${esc(o.headline)}</title>
</head>
<body style="margin:0;padding:0;background:${C.cream};">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">
    ${esc(o.preheader)}
  </span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${C.border};">
          <!-- Header / wordmark -->
          <tr>
            <td align="center" style="padding:40px 40px 8px;">
              <div style="font-family:${SERIF};font-size:30px;font-weight:500;letter-spacing:8px;
                          text-transform:uppercase;color:${C.burgundy};">Tijoray</div>
              <div style="height:1px;width:48px;background:${C.gold};margin:18px auto 0;"></div>
            </td>
          </tr>
          <!-- Headline -->
          <tr>
            <td align="center" style="padding:24px 40px 0;">
              <h1 style="margin:0;font-family:${SERIF};font-size:32px;font-weight:300;line-height:1.2;color:${C.ink};">
                ${esc(o.headline)}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:20px 48px 8px;font-family:${SANS};font-size:15px;line-height:1.8;color:${C.inkMid};">
              ${o.bodyHtml}
              ${o.ctaLabel && o.ctaHref ? button(o.ctaLabel, o.ctaHref) : ''}
              ${o.footnote ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:${C.inkSoft};font-style:italic;">${o.footnote}</p>` : ''}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:32px 48px 40px;">
              <div style="height:1px;background:${C.border};margin-bottom:24px;"></div>
              <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.7;color:${C.inkSoft};">
                Tijoray — keepsakes that hold a memory.<br>
                You're receiving this because you placed an order with Tijoray.<br>
                <a href="${SITE}" style="color:${C.rose};text-decoration:none;">${SITE.replace(/^https?:\/\//, '')}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/* ── Exactly-once send ───────────────────────────────────────────────────── */
type SendResult = 'sent' | 'skipped'

async function dispatch(
  ref: string, type: string, to: string,
  subject: string, html: string, text: string,
): Promise<SendResult> {
  // Claim the (ref, type) slot. Unique-violation => already sent.
  const { error: claimErr } = await supabase.from('Email_Log').insert({ ref, type, recipient: to })
  if (claimErr) {
    if ((claimErr as { code?: string }).code === '23505') return 'skipped'
    throw claimErr
  }

  if (!resend) {
    // Release the claim: leaving it would mark this email "sent" forever, so
    // even after the key is configured no retry would ever deliver it.
    await supabase.from('Email_Log').delete().eq('ref', ref).eq('type', type)
    console.error(`[email] RESEND_API_KEY missing — could NOT send "${type}" to ${to}`)
    return 'skipped'
  }

  try {
    await resend.emails.send({ from: FROM, to, subject, html, text })
  } catch (err) {
    // Roll the claim back so a later retry can re-attempt the send.
    await supabase.from('Email_Log').delete().eq('ref', ref).eq('type', type)
    throw err
  }
  return 'sent'
}

/* ── #1 — Order received / being crafted (+ start building CTA) ──────────── */
export async function sendCraftingEmail(opts: {
  sessionId: string
  to:        string
  buyerName?: string | null
  items:     { name: string; priceCents: number }[]
  totalCents: number
  /** Sales tax Stripe collected, in cents. Omitted/0 renders no tax row —
   *  exports out of Canada are zero-rated, so most orders have none. */
  taxCents?: number
  /** Promotion discount applied, in cents. Omitted/0 renders no discount row. */
  discountCents?: number
  /** The code redeemed, shown beside the discount so the saving is attributable. */
  promoCode?: string | null
}): Promise<SendResult> {
  const portal = `${SITE}/portal`
  const rows = opts.items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${C.border};font-family:${SERIF};font-size:17px;color:${C.ink};">${esc(i.name)}</td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid ${C.border};font-family:${SERIF};font-size:17px;color:${C.ink};">${fmtUSD(i.priceCents)}</td>
    </tr>`).join('')

  // Rendered only when they actually happened. The itemised lines must reach the
  // total or the receipt reads as a billing error, and a customer who used a code
  // needs to see it land — a total that is simply lower than the prices above it,
  // with no line explaining why, is the same complaint as one that is too high.
  const taxCents = opts.taxCents ?? 0
  const discountCents = opts.discountCents ?? 0

  const summaryRow = (label: string, value: string, tone: string = C.inkMid) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${C.border};font-family:${SERIF};font-size:17px;color:${tone};">${label}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${C.border};font-family:${SERIF};font-size:17px;color:${tone};">${value}</td>
      </tr>`

  const discountRow = discountCents > 0
    ? summaryRow(
        opts.promoCode ? `Discount (${esc(opts.promoCode)})` : 'Discount',
        `−${fmtUSD(discountCents)}`,
      )
    : ''
  const taxRow = taxCents > 0 ? summaryRow('Tax', fmtUSD(taxCents)) : ''

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${firstName(opts.buyerName)},</p>
    <p style="margin:0 0 16px;">Thank you for your order. Your piece is now in the hands of our atelier, where it's being crafted by hand. We'll email you again the moment it ships.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
      ${rows}
      ${discountRow}
      ${taxRow}
      <tr>
        <td style="padding:14px 0 0;font-family:${SANS};font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${C.inkMid};">Total</td>
        <td align="right" style="padding:14px 0 0;font-family:${SERIF};font-size:20px;color:${C.ink};">${fmtUSD(opts.totalCents)}</td>
      </tr>
    </table>
    <p style="margin:28px 0 0;"><strong style="color:${C.ink};">While we craft it, build the memory inside.</strong> Your piece's private portal is open now — add photos, voice notes, a written message, places, and songs. It's ready the moment it's worn.</p>`

  const text =
`Hi ${firstName(opts.buyerName)},

Thank you for your order. Your piece is being crafted by hand and we'll email you when it ships.

${discountCents > 0 ? `Discount${opts.promoCode ? ` (${opts.promoCode})` : ''}: -${fmtUSD(discountCents)}\n` : ''}${taxCents > 0 ? `Tax: ${fmtUSD(taxCents)}\n` : ''}Order total: ${fmtUSD(opts.totalCents)}

While we craft it, start building the memory inside your piece's portal:
${portal}

— Tijoray`

  return dispatch(opts.sessionId, 'crafting', opts.to,
    'Your Tijoray piece is being crafted', shell({
      preheader: 'Your order is confirmed — start building the memory inside.',
      headline:  'Your piece is being crafted',
      bodyHtml,
      ctaLabel:  'Start building your memories',
      ctaHref:   portal,
      footnote:  "You'll get another note the moment it ships.",
    }), text)
}

/* ── #3 — Memory reminders (3 escalating tiers) ──────────────────────────── */
const REMINDER_COPY: Record<1 | 2 | 3, { subject: string; headline: string; intro: string; footnote?: string }> = {
  1: {
    subject:  'Your Tijoray piece is waiting for its memory',
    headline: 'Ready when you are',
    intro:    "Your piece is being crafted — and its portal is open, waiting for the memory that will live inside it. Whenever you have a quiet moment, we'd love for you to begin.",
  },
  2: {
    subject:  'A photo, a voice, a few words',
    headline: 'What will they find inside?',
    intro:    "Your piece will soon be on its way. The most loved memories are the small, personal ones — a photo from that day, a voice note, a song, a few honest words. Add even one and it's no longer just jewelry.",
  },
  3: {
    subject:  'Last chance to add memories before it ships',
    headline: 'It ships soon',
    intro:    "Your piece is nearly ready to leave our atelier. Once it ships, the memory inside is sealed — so this is the moment to add anything you've been meaning to.",
    footnote: 'Added everything already? You can ignore this note.',
  },
}

export async function sendMemoryReminder(opts: {
  pieceId:   string
  tier:      1 | 2 | 3
  to:        string
  buyerName?: string | null
  deadline:  string | Date
  portalUrl: string
}): Promise<SendResult> {
  const copy = REMINDER_COPY[opts.tier]
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${firstName(opts.buyerName)},</p>
    <p style="margin:0 0 16px;">${copy.intro}</p>
    <p style="margin:0;">Memories can be added until <strong style="color:${C.ink};">${fmtDate(opts.deadline)}</strong>.</p>`

  const text =
`Hi ${firstName(opts.buyerName)},

${copy.intro}

Add memories before ${fmtDate(opts.deadline)}:
${opts.portalUrl}

— Tijoray`

  return dispatch(opts.pieceId, `reminder_${opts.tier}`, opts.to,
    copy.subject, shell({
      preheader: copy.intro.slice(0, 100),
      headline:  copy.headline,
      bodyHtml,
      ctaLabel:  'Add your memories',
      ctaHref:   opts.portalUrl,
      footnote:  copy.footnote,
    }), text)
}

/* ── #4 — Shipped (with memories-sealed closure folded in) ───────────────── */
export async function sendShippedEmail(opts: {
  pieceId:     string
  to:          string
  buyerName?:  string | null
  recipientName?: string | null
  pieceName:   string
  portalUrl:   string
}): Promise<SendResult> {
  const forWhom = opts.recipientName?.trim()
    ? `on its way to ${esc(opts.recipientName.trim())}`
    : 'on its way'

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${firstName(opts.buyerName)},</p>
    <p style="margin:0 0 16px;">Your <strong style="color:${C.ink};">${esc(opts.pieceName)}</strong> has shipped and is ${forWhom}.</p>
    <p style="margin:0;">The memory you composed is now sealed inside it — ready to be discovered the moment the piece is worn. You can revisit what you created any time in your portal.</p>`

  const text =
`Hi ${firstName(opts.buyerName)},

Your ${opts.pieceName} has shipped and is ${opts.recipientName ? `on its way to ${opts.recipientName}` : 'on its way'}.

The memory you composed is sealed inside it. Revisit it any time:
${opts.portalUrl}

— Tijoray`

  return dispatch(opts.pieceId, 'shipped', opts.to,
    'Your Tijoray piece has shipped', shell({
      preheader: 'It has shipped — the memory inside is sealed.',
      headline:  'On its way',
      bodyHtml,
      ctaLabel:  'View your portal',
      ctaHref:   opts.portalUrl,
    }), text)
}

/* ── #6 — Recipient linked their piece (to buyer) ────────────────────────── */
export async function sendRecipientLinkedEmail(opts: {
  pieceId:    string
  to:         string
  buyerName?: string | null
  recipientName?: string | null
  pieceName:  string
}): Promise<SendResult> {
  const who = opts.recipientName?.trim() ? esc(opts.recipientName.trim()) : 'Your recipient'
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${firstName(opts.buyerName)},</p>
    <p style="margin:0;"><strong style="color:${C.ink};">${who}</strong> has linked their <strong style="color:${C.ink};">${esc(opts.pieceName)}</strong>. The memory you made is now theirs to hold — and to open whenever they like.</p>`

  const text =
`Hi ${firstName(opts.buyerName)},

${opts.recipientName ?? 'Your recipient'} has linked their ${opts.pieceName}. The memory you made is now theirs to hold.

— Tijoray`

  return dispatch(opts.pieceId, 'linked', opts.to,
    `${opts.recipientName ?? 'Your recipient'} linked their Tijoray piece`, shell({
      preheader: 'The memory you made has found its home.',
      headline:  'It found its home',
      bodyHtml,
    }), text)
}

/* ── #7 — Recipient viewed their memories (to buyer) ─────────────────────── */
export async function sendRecipientViewedEmail(opts: {
  pieceId:    string
  to:         string
  buyerName?: string | null
  recipientName?: string | null
  pieceName:  string
}): Promise<SendResult> {
  const who = opts.recipientName?.trim() ? esc(opts.recipientName.trim()) : 'Your recipient'
  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${firstName(opts.buyerName)},</p>
    <p style="margin:0;"><strong style="color:${C.ink};">${who}</strong> just opened the memories inside their <strong style="color:${C.ink};">${esc(opts.pieceName)}</strong> for the first time. Somewhere, your gift is being felt.</p>`

  const text =
`Hi ${firstName(opts.buyerName)},

${opts.recipientName ?? 'Your recipient'} just opened the memories inside their ${opts.pieceName} for the first time.

— Tijoray`

  return dispatch(opts.pieceId, 'viewed', opts.to,
    `${opts.recipientName ?? 'Your recipient'} opened your memories`, shell({
      preheader: 'Your gift is being felt.',
      headline:  'They opened it',
      bodyHtml,
    }), text)
}
