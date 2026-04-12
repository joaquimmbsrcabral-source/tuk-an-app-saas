import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { verifyCheckoutSession } from '../../lib/stripe'

export function BookingSuccess() {
  const [searchParams] = useSearchParams()
  const [verified, setVerified] = useState<boolean | null>(null)
  const sessionId = searchParams.get('session_id')
  const bookingId = searchParams.get('booking_id')

  useEffect(() => {
    if (sessionId) {
      verifyCheckoutSession(sessionId).then(result => {
        setVerified(result.success)
      })
    }
  }, [sessionId])

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">{verified === false ? '\u{274C}' : '\u{2705}'}</div>
        <h1 className="text-2xl font-bold text-charcoal mb-2">
          {verified === false ? 'Payment issue' : 'Booking confirmed!'}
        </h1>
        <p className="text-clay mb-6">
          {verified === false
            ? 'We could not verify your payment. Please contact us.'
            : 'Thank you for booking with Tuk & Roll! You will receive a confirmation email shortly.'}
        </p>

        {bookingId && (
          <div className="bg-white rounded-xl p-4 border border-cream mb-6">
            <p className="text-sm text-clay">Booking reference</p>
            <p className="font-mono text-lg font-bold text-charcoal">{bookingId.substring(0, 8).toUpperCase()}</p>
          </div>
        )}

        <div className="space-y-3">
          <a
            href="/book"
            className="block w-full py-3 bg-copper text-white font-semibold rounded-xl hover:bg-copper/90 transition-colors"
          >
            Book another tour
          </a>
          <p className="text-xs text-clay">
            Questions? WhatsApp us at +351 XXX XXX XXX
          </p>
        </div>
      </div>
    </div>
  )
}
