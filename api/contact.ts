import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

// Prevent email header injection — strip carriage returns and newlines
function sanitizeHeader(val: string): string {
  return val.replace(/[\r\n]/g, ' ').trim()
}

// Escape HTML entities for use in email body
function escapeHtml(val: string): string {
  return val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Simple in-memory rate limit: 5 submissions per IP per 10 minutes
const ipRateMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = ipRateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + 10 * 60_000 })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' })
  }

  const { name, email, message } = req.body ?? {}

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Sanitize header fields to prevent email header injection
  const safeName    = sanitizeHeader(name)
  const safeEmail   = sanitizeHeader(email)
  const safeMessage = escapeHtml(message.trim())

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }

  try {
    await resend.emails.send({
      from:    'Tijoray Contact <hello@tijoray.com>',
      to:      'support@tijoray.com',
      replyTo: safeEmail,
      subject: `Atelier enquiry from ${safeName}`,
      html: `
        <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
        <br/>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${safeMessage}</p>
      `,
    })

    // Auto-reply to sender
    await resend.emails.send({
      from:    'Tijoray Atelier <hello@tijoray.com>',
      to:      safeEmail,
      subject: 'We received your message · Tijoray Atelier',
      html: `
        <p>Dear ${escapeHtml(safeName)},</p>
        <p>Thank you for reaching out. Our atelier has received your message and will be in touch within 48 hours.</p>
        <p>The Tijoray Atelier</p>
      `,
    })

    return res.status(200).json({ ok: true })
  } catch (err: unknown) {
    console.error('Contact email error:', err)
    return res.status(500).json({ error: 'Failed to send message. Please try again.' })
  }
}
