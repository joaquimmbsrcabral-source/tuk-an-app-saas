import type { VercelRequest, VercelResponse } from '@vercel/node'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM_EMAIL = process.env.FROM_EMAIL || 'ops@tukanapp.pt'

interface BookingEmailData {
  to: string
  customer_name: string
  tour_name: string
  date: string
  time: string
  pax: number
  total: number
  booking_ref: string
  pickup_location?: string
}

function buildConfirmationHtml(data: BookingEmailData): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAF3E3; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: #2D2926; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">\u{1F6FA} Tuk & Roll</h1>
      <p style="color: #FAF3E3; margin: 8px 0 0; font-size: 14px;">Booking Confirmation</p>
    </div>
    <div style="padding: 24px;">
      <p style="color: #2D2926; font-size: 16px;">Hello <strong>${data.customer_name}</strong>,</p>
      <p style="color: #6B6560; font-size: 14px;">Your TukTuk tour is confirmed! Here are the details:</p>
      
      <div style="background: #FAF3E3; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #6B6560; font-size: 14px;">Tour</td><td style="padding: 6px 0; text-align: right; color: #2D2926; font-weight: 600; font-size: 14px;">${data.tour_name}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B6560; font-size: 14px;">Date</td><td style="padding: 6px 0; text-align: right; color: #2D2926; font-weight: 600; font-size: 14px;">${data.date}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B6560; font-size: 14px;">Time</td><td style="padding: 6px 0; text-align: right; color: #2D2926; font-weight: 600; font-size: 14px;">${data.time}</td></tr>
          <tr><td style="padding: 6px 0; color: #6B6560; font-size: 14px;">Passengers</td><td style="padding: 6px 0; text-align: right; color: #2D2926; font-weight: 600; font-size: 14px;">${data.pax}</td></tr>
          ${data.pickup_location ? `<tr><td style="padding: 6px 0; color: #6B6560; font-size: 14px;">Pickup</td><td style="padding: 6px 0; text-align: right; color: #2D2926; font-weight: 600; font-size: 14px;">${data.pickup_location}</td></tr>` : ''}
          <tr style="border-top: 1px solid #E8DFC8;"><td style="padding: 10px 0 6px; color: #2D2926; font-weight: 700; font-size: 16px;">Total paid</td><td style="padding: 10px 0 6px; text-align: right; color: #C87941; font-weight: 700; font-size: 16px;">\u{20AC}${data.total.toFixed(2)}</td></tr>
        </table>
      </div>

      <div style="background: #F0E8D0; border-radius: 8px; padding: 12px; text-align: center; margin: 16px 0;">
        <p style="margin: 0; color: #6B6560; font-size: 12px;">Booking reference</p>
        <p style="margin: 4px 0 0; color: #2D2926; font-size: 20px; font-weight: 700; font-family: monospace;">${data.booking_ref}</p>
      </div>

      <p style="color: #6B6560; font-size: 13px; line-height: 1.5;">
        Your driver will contact you before the tour. If you need to make changes, reply to this email or WhatsApp us.
      </p>
      <p style="color: #6B6560; font-size: 13px;">See you in Lisbon! \u{1F1F5}\u{1F1F9}</p>
    </div>
    <div style="background: #F8F4EC; padding: 16px; text-align: center; border-top: 1px solid #E8DFC8;">
      <p style="margin: 0; color: #6B6560; font-size: 12px;">Tuk & Roll \u{2014} Lisbon TukTuk Tours</p>
      <p style="margin: 4px 0 0; color: #9B938A; font-size: 11px;">Powered by Tuk an App</p>
    </div>
  </div>
</body>
</html>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data: BookingEmailData = req.body

    if (!data.to || !data.customer_name || !data.booking_ref) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Tuk & Roll <${FROM_EMAIL}>`,
        to: [data.to],
        subject: `\u{2705} Booking Confirmed — ${data.tour_name} | Tuk & Roll`,
        html: buildConfirmationHtml(data),
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('Resend error:', err)
      return res.status(500).json({ error: 'Failed to send email', detail: err })
    }

    const result = await response.json()
    return res.status(200).json({ success: true, id: result.id })
  } catch (err: any) {
    console.error('Email error:', err)
    return res.status(500).json({ error: err.message })
  }
}
