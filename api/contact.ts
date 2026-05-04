import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, message } = req.body ?? {}

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    await resend.emails.send({
      from:    'Tijoray Contact <hello@tijoray.com>',
      to:      'support@tijoray.com',
      replyTo: email.trim(),
      subject: `Atelier enquiry from ${name.trim()}`,
      html: `
        <p><strong>Name:</strong> ${name.trim()}</p>
        <p><strong>Email:</strong> ${email.trim()}</p>
        <br/>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${message.trim()}</p>
      `,
    })

    // Auto-reply to sender
    await resend.emails.send({
      from:    'Tijoray Atelier <hello@tijoray.com>',
      to:      email.trim(),
      subject: 'We received your message — Tijoray Atelier',
      html: `
        <p>Dear ${name.trim()},</p>
        <p>Thank you for reaching out. Our atelier has received your message and will be in touch within 48 hours.</p>
        <p>— The Tijoray Atelier</p>
      `,
    })

    return res.status(200).json({ ok: true })
  } catch (err: unknown) {
    console.error('Contact email error:', err)
    return res.status(500).json({ error: 'Failed to send message. Please try again.' })
  }
}
