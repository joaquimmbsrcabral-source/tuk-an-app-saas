import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { buffer } from 'micro'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Disable body parser — Stripe needs the raw body for signature verification
export const config = {
  api: { bodyParser: false },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    const rawBody = await buffer(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.booking_id
        const companyId = session.metadata?.company_id

        if (!bookingId || !companyId) {
          console.error('Missing metadata in checkout session:', session.id)
          break
        }

        const amountTotal = (session.amount_total || 0) / 100 // Convert from cents

        // 1. Update booking status to confirmed
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            notes: `Pago via Stripe — Session: ${session.id}`,
          })
          .eq('id', bookingId)
          .eq('company_id', companyId)

        if (bookingError) {
          console.error('Failed to update booking:', bookingError)
        }

        // 2. Create payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            company_id: companyId,
            booking_id: bookingId,
            method: 'card',
            amount: amountTotal,
            received_at: new Date().toISOString(),
            notes: `Stripe payment — PI: ${session.payment_intent} | Session: ${session.id}`,
          })

        if (paymentError) {
          console.error('Failed to create payment:', paymentError)
        }

        console.log(`Payment recorded for booking ${bookingId}: ${amountTotal}EUR`)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.booking_id

        if (bookingId) {
          // Clean up the stripe session reference from notes
          await supabase
            .from('bookings')
            .update({ notes: 'Stripe session expired — payment not completed' })
            .eq('id', bookingId)

          console.log(`Checkout session expired for booking ${bookingId}`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
          }
