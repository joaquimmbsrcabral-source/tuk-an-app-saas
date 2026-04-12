import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      booking_id,
      company_id,
      customer_name,
      customer_email,
      tour_name,
      amount,
      currency = 'eur',
    } = req.body

    if (!booking_id || !amount || !company_id) {
      return res.status(400).json({ error: 'Missing required fields: booking_id, amount, company_id' })
    }

    // Verify booking exists and belongs to company
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, company_id')
      .eq('id', booking_id)
      .eq('company_id', company_id)
      .single()

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot pay for a cancelled booking' })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customer_email || undefined,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: tour_name || 'TukTuk Tour Booking',
              description: `Reserva #${booking_id.substring(0, 8)} — ${customer_name || 'Guest'}`,
              images: ['https://tuk-an-app-saas.vercel.app/tuktuk-og.png'],
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id,
        company_id,
        customer_name: customer_name || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tuk-an-app-saas.vercel.app'}/book/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking_id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://tuk-an-app-saas.vercel.app'}/book/cancel?booking_id=${booking_id}`,
      locale: 'pt',
      expires_after: 1800, // 30 min
    })

    // Update booking with stripe session id
    await supabase
      .from('bookings')
      .update({ notes: `stripe_session:${session.id}` })
      .eq('id', booking_id)

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
  }
