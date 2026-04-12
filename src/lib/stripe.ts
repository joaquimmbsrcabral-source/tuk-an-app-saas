import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

/**
 * Get the Stripe.js instance (lazy-loaded singleton).
 * Uses the publishable key from environment variables.
 */
export const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.warn('Missing VITE_STRIPE_PUBLISHABLE_KEY environment variable')
      return Promise.resolve(null)
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

interface CheckoutParams {
  booking_id: string
  company_id: string
  customer_name?: string
  customer_email?: string
  tour_name?: string
  amount: number
}

/**
 * Create a Stripe Checkout session and redirect to payment page.
 * Calls /api/stripe/checkout to create the session server-side,
 * then redirects the user to Stripe's hosted checkout.
 */
export async function redirectToCheckout(params: CheckoutParams): Promise<{ error?: string }> {
  try {
    // 1. Create checkout session via API
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const data = await response.json()
      return { error: data.error || 'Failed to create checkout session' }
    }

    const { url } = await response.json()

    // 2. Redirect to Stripe Checkout
    if (url) {
      window.location.href = url
      return {}
    }

    return { error: 'No checkout URL returned' }
  } catch (err: any) {
    console.error('Stripe redirect error:', err)
    return { error: err.message || 'Failed to redirect to payment' }
  }
}

/**
 * Verify a checkout session after return from Stripe.
 * Used on the success page to confirm payment went through.
 */
export async function verifyCheckoutSession(sessionId: string): Promise<{
  success: boolean
  booking_id?: string
  error?: string
}> {
  try {
    const response = await fetch(`/api/stripe/verify?session_id=${sessionId}`)
    
    if (!response.ok) {
      return { success: false, error: 'Failed to verify payment' }
    }

    const data = await response.json()
    return {
      success: data.payment_status === 'paid',
      booking_id: data.booking_id,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
