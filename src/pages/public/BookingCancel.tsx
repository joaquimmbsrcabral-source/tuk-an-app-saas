import React from 'react'

export function BookingCancel() {
  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">\u{1F614}</div>
        <h1 className="text-2xl font-bold text-charcoal mb-2">Payment cancelled</h1>
        <p className="text-clay mb-6">
          No worries! Your booking has not been charged. You can try again whenever you're ready.
        </p>
        <a
          href="/book"
          className="inline-block px-8 py-3 bg-copper text-white font-semibold rounded-xl hover:bg-copper/90 transition-colors"
        >
          Try again
        </a>
        <p className="text-xs text-clay mt-4">
          Need help? WhatsApp us at +351 XXX XXX XXX
        </p>
      </div>
    </div>
  )
}
