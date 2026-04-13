import type { VercelRequest, VercelResponse } from '@vercel/node'

// Twilio WhatsApp API integration for booking confirmations
// Uses the Twilio REST API directly (no SDK needed)

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886' // Twilio sandbox default

interface WhatsAppRequest {
  to: string // Customer phone number (with country code)
  customerName: string
  tourName: string
  date: string
  time: string
  passengers: number
  totalPaid: number
  bookingRef: string
  pickupLocation?: string
  language?: 'pt' | 'en'
}

function buildMessage(data: WhatsAppRequest): string {
  const lang = data.language || 'pt'

  if (lang === 'en') {

// Twilio WhatsApp API integration for booking confirmations
// Uses the Twilio REST API directly (no SDK needed)

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886' // Twilio sandbox default

interface WhatsAppRequest {
  to: string // Customer phone number (with country code)
  customerName: string
  tourName: string
  date: string
  time: string
  passengers: number
  totalPaid: number
  bookingRef: string
  pickupLocation?: string
  language?: 'pt' | 'en'
}

function buildMessage(data: WhatsAppRequest): string {
  const lang = data.language || 'pt'

  if (lang === 'en') {
    return [
      ` *Booking Confirmed!* `,
      ``,
      `Hello ${data.customerName}!`,
      `Your Tuk & Roll tour is booked and paid.`,
      ``,
      ` *Booking Details:*`,
      `• Tour: ${data.tourName}`,
      `• Date: ${data.date}`,
      `• Time: ${data.time}`,
      `• Passengers: ${data.passengers}`,
      `• Total Paid: €${data.totalPaid.toFixed(2)}`,
      `• Ref: ${data.bookingRef}`,
      data.pickupLocation ? `• Pickup: ${data.pickupLocation}` : '',
      ``,
      ` Please be at the pickup point 5 minutes early.`,
      ``,
      `Questions? Reply to this message or call us.`,
      ``,
      `_Tuk & Roll — Lisbon TukTuk Tours_ `,
    ].filter(Boolean).join('\n')
  }

  // Portuguese (default)
  return [
    ` *Reserva Confirmada!* `,
    ``,
    `Olá ${data.customerName}!`,
    `O seu tour Tuk & Roll está reservado e pago.`,
    ``,
    ` *Detalhes da Reserva:*`,
    `• Tour: ${data.tourName}`,
    `• Data: ${data.date}`,
    `• Hora: ${data.time}`,
    `• Passageiros: ${data.passengers}`,
    `• Total Pago: €${data.totalPaid.toFixed(2)}`,
    `• Ref: ${data.bookingRef}`,
    data.pickupLocation ? `• Ponto de encontro: ${data.pickupLocation}` : '',
    ``,
    ` Por favor esteja no ponto de encontro 5 minutos antes.`,
    ``,
    `Questões? Responda a esta mensagem ou ligue-nos.`,
    ``,
    `_Tuk & Roll — Passeios de TukTuk em Lisboa_ `,
  ].filter(Boolean).join('\n')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data = req.body as WhatsAppRequest

    if (!data.to || !data.customerName || !data.tourName) {
      return res.status(400).json({ error: 'Missing required fields: to, customerName, tourName' })
    }

    // Format phone number for WhatsApp
    let phone = data.to.replace(/[\s\-()]/g, '')
    if (!phone.startsWith('+')) {
      // Assume Portuguese number if no country code
      phone = phone.startsWith('351') ? `+${phone}` : `+351${phone}`
    }
    const whatsappTo = `whatsapp:${phone}`

    const message = buildMessage(data)

    // Send via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const formBody = new URLSearchParams({
      From: TWILIO_WHATSAPP_FROM,
      To: whatsappTo,
      Body: message,
    })

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    })

    const result = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('Twilio WhatsApp error:', result)
      return res.status(twilioResponse.status).json({
        error: 'Failed to send WhatsApp message',
        detail: result.message || result.error_message,
      })
    }

    console.log('WhatsApp sent:', result.sid, 'to:', whatsappTo)

    return res.status(200).json({
      success: true,
      messageSid: result.sid,
      to: whatsappTo,
    })
  } catch (err: any) {
    console.error('WhatsApp handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
