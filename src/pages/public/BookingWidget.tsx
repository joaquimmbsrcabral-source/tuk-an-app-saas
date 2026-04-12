import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { redirectToCheckout } from '../../lib/stripe'
import { formatCurrency } from '../../lib/format'
import type { TourCatalogItem } from '../../lib/types'

// The default company for the public widget
// In production, this comes from the URL slug or subdomain
const DEFAULT_COMPANY_ID = import.meta.env.VITE_DEFAULT_COMPANY_ID || ''

interface BookingForm {
  customer_name: string
  customer_phone: string
  customer_email: string
  tour_id: string
  date: string
  time: string
  pax: number
  pickup_location: string
  notes: string
}

const initialForm: BookingForm = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  tour_id: '',
  date: '',
  time: '10:00',
  pax: 2,
  pickup_location: '',
  notes: '',
}

export function BookingWidget() {
  const [form, setForm] = useState<BookingForm>(initialForm)
  const [tours, setTours] = useState<TourCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1=tour, 2=details, 3=confirm

  const selectedTour = tours.find(t => t.id === form.tour_id)
  const totalPrice = selectedTour ? selectedTour.default_price * form.pax : 0

  useEffect(() => {
    fetchTours()
  }, [])

  async function fetchTours() {
    const { data, error } = await supabase
      .from('tour_catalog')
      .select('*')
      .eq('company_id', DEFAULT_COMPANY_ID)
      .eq('active', true)
      .order('name')

    if (!error && data) setTours(data)
    setLoading(false)
  }

  function handleChange(field: keyof BookingForm, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  function validateStep1() {
    if (!form.tour_id) return 'Please select a tour'
    if (!form.date) return 'Please select a date'
    return null
  }

  function validateStep2() {
    if (!form.customer_name.trim()) return 'Please enter your name'
    if (!form.customer_phone.trim() && !form.customer_email.trim()) {
      return 'Please enter your phone or email'
    }
    return null
  }

  function handleNextStep() {
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
      setStep(2)
    } else if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
      setStep(3)
    }
  }

  async function handleSubmit() {
    if (!selectedTour) return
    setSubmitting(true)
    setError('')

    try {
      // Calculate end time
      const startAt = new Date(`${form.date}T${form.time}:00`)
      const endAt = new Date(startAt.getTime() + selectedTour.default_duration_min * 60000)

      // 1. Create booking in Supabase
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          company_id: DEFAULT_COMPANY_ID,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          tour_type: selectedTour.name,
          pax: form.pax,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          price: totalPrice,
          status: 'pending',
          source: 'direct',
          pickup_location: form.pickup_location,
          notes: form.notes || `Email: ${form.customer_email}`,
        })
        .select('id')
        .single()

      if (bookingError) throw bookingError

      // 2. Redirect to Stripe Checkout
      const { error: stripeError } = await redirectToCheckout({
        booking_id: booking.id,
        company_id: DEFAULT_COMPANY_ID,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        tour_name: selectedTour.name,
        amount: totalPrice,
      })

      if (stripeError) throw new Error(stripeError)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  // Set min date to today
  const today = new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">\u{1F6FA}</div>
          <p className="text-clay">Loading tours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <div className="bg-charcoal text-white py-6">
        <div className="max-w-lg mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold">\u{1F6FA} Tuk & Roll</h1>
          <p className="text-sm text-sand/80 mt-1">Book your Lisbon TukTuk tour</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s <= step ? 'bg-copper text-white' : 'bg-cream text-clay'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-copper' : 'bg-cream'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Choose Tour */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-charcoal">Choose your tour</h2>

            <div className="space-y-3">
              {tours.map(tour => (
                <button
                  key={tour.id}
                  onClick={() => handleChange('tour_id', tour.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    form.tour_id === tour.id
                      ? 'border-copper bg-copper/5'
                      : 'border-cream bg-white hover:border-copper/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-charcoal">{tour.name}</h3>
                      {tour.description && (
                        <p className="text-sm text-clay mt-1">{tour.description}</p>
                      )}
                      <p className="text-xs text-clay mt-2">\u{23F1} {tour.default_duration_min} min</p>
                    </div>
                    <span className="text-copper font-bold">{formatCurrency(tour.default_price)}/pp</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Date</label>
                <input
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={e => handleChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Time</label>
                <select
                  value={form.time}
                  onChange={e => handleChange('time', e.target.value)}
                  className="w-full px-3 py-2 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper"
                >
                  {['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Passengers</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => form.pax > 1 && handleChange('pax', form.pax - 1)}
                  className="w-10 h-10 rounded-full border border-cream flex items-center justify-center text-lg hover:bg-cream"
                >-</button>
                <span className="text-xl font-bold text-charcoal w-8 text-center">{form.pax}</span>
                <button
                  onClick={() => form.pax < 6 && handleChange('pax', form.pax + 1)}
                  className="w-10 h-10 rounded-full border border-cream flex items-center justify-center text-lg hover:bg-cream"
                >+</button>
              </div>
            </div>

            {selectedTour && (
              <div className="bg-copper/10 rounded-xl p-4 text-center">
                <p className="text-sm text-clay">Total</p>
                <p className="text-2xl font-bold text-copper">{formatCurrency(totalPrice)}</p>
                <p className="text-xs text-clay">{form.pax} x {formatCurrency(selectedTour.default_price)}</p>
              </div>
            )}

            <button
              onClick={handleNextStep}
              className="w-full py-3 bg-copper text-white font-semibold rounded-xl hover:bg-copper/90 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Your Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-charcoal">Your details</h2>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Full name *</label>
              <input
                type="text"
                value={form.customer_name}
                onChange={e => handleChange('customer_name', e.target.value)}
                placeholder="John Smith"
                className="w-full px-3 py-2 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
              <input
                type="email"
                value={form.customer_email}
                onChange={e => handleChange('customer_email', e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Phone (WhatsApp)</label>
              <input
                type="tel"
                value={form.customer_phone}
                onChange={e => handleChange('customer_phone', e.target.value)}
                placeholder="+44 7700 900123"
                className="w-full px-3 py-2 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Pickup location</label>
              <input
                type="text"
                value={form.pickup_location}
                onChange={e => handleChange('pickup_location', e.target.value)}
                placeholder="Hotel name or address"
                className="w-full px-3 py-2 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="Any special requests?"
                rows={2}
                className="w-full px-3 py-2 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-cream text-clay font-semibold rounded-xl hover:bg-cream transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="flex-1 py-3 bg-copper text-white font-semibold rounded-xl hover:bg-copper/90 transition-colors"
              >
                Review booking
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Pay */}
        {step === 3 && selectedTour && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-charcoal">Confirm & Pay</h2>

            <div className="bg-white rounded-xl p-4 space-y-3 border border-cream">
              <div className="flex justify-between">
                <span className="text-clay">Tour</span>
                <span className="font-semibold text-charcoal">{selectedTour.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clay">Date</span>
                <span className="font-semibold text-charcoal">{form.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clay">Time</span>
                <span className="font-semibold text-charcoal">{form.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clay">Passengers</span>
                <span className="font-semibold text-charcoal">{form.pax}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-clay">Duration</span>
                <span className="font-semibold text-charcoal">{selectedTour.default_duration_min} min</span>
              </div>
              {form.pickup_location && (
                <div className="flex justify-between">
                  <span className="text-clay">Pickup</span>
                  <span className="font-semibold text-charcoal">{form.pickup_location}</span>
                </div>
              )}
              <hr className="border-cream" />
              <div className="flex justify-between">
                <span className="text-clay">Name</span>
                <span className="font-semibold text-charcoal">{form.customer_name}</span>
              </div>
              {form.customer_email && (
                <div className="flex justify-between">
                  <span className="text-clay">Email</span>
                  <span className="font-semibold text-charcoal">{form.customer_email}</span>
                </div>
              )}
              {form.customer_phone && (
                <div className="flex justify-between">
                  <span className="text-clay">Phone</span>
                  <span className="font-semibold text-charcoal">{form.customer_phone}</span>
                </div>
              )}
              <hr className="border-cream" />
              <div className="flex justify-between text-lg">
                <span className="font-bold text-charcoal">Total</span>
                <span className="font-bold text-copper">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={submitting}
                className="flex-1 py-3 border border-cream text-clay font-semibold rounded-xl hover:bg-cream transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-copper text-white font-semibold rounded-xl hover:bg-copper/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Processing...' : `Pay ${formatCurrency(totalPrice)}`}
              </button>
            </div>

            <p className="text-xs text-clay text-center">
              Secure payment powered by Stripe. You will be redirected to complete payment.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-xs text-clay">Powered by Tuk an App \u{00A9} {new Date().getFullYear()}</p>
      </div>
    </div>
  )
          }
