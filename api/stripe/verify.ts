import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

/**
 * GET /api/stripe/verify?session_id=cs_xxx
 * Verifies a Stripe Checkout session after redirect.
 * Used on the success page to confirm payment went through.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { session_id } = req.query

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'Missing session_id parameter' })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)

    return res.status(200).json({
      payment_status: session.payment_status,
      booking_id: session.metadata?.booking_id || null,
      customer_email: session.customer_email,
      amount_total: session.amount_total ? session.amount_total / 100 : null,
      currency: session.currency,
    })
  } catch (err: any) {
    console.error('Stripe verify error:', err)
    return res.status(500).json({ error: err.message || 'Failed to verify session' })
  }
}
