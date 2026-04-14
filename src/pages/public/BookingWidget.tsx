import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { redirectToCheckout } from '../../lib/stripe'
import { formatCurrency } from '../../lib/format'
import type { TourCatalogItem } from '../../lib/types'

// Hardcoded fallback — the Tuk & Roll company
const TUKNROLL_COMPANY_ID = 'd4338c09-d351-4a3e-96ed-b7f0fea69844'
const DEFAULT_COMPANY_ID = import.meta.env.VITE_DEFAULT_COMPANY_ID || TUKNROLL_COMPANY_ID

// Tour visual metadata (emoji + highlight for each known tour)
const tourMeta: Record<string, { emoji: string; highlights: string[] }> = {
  'Historico': {
    emoji: '\u{1F3F0}',
    highlights: ['Alfama', 'S\u00e9 Cathedral', 'Portas do Sol', 'Igreja S. Vicente de Fora'],
  },
  'Nova Lisboa': {
    emoji: '\u{2728}',
    highlights: ['Convento Do Carmo', 'Elevador Santa Justa', 'Pr\u00edncipe Real', 'Bas\u00edlica da Estrela'],
  },
  'Belem': {
    emoji: '\u{26F5}',
    highlights: ['Torre de Bel\u00e9m', 'Mosteiro dos Jer\u00f3nimos', 'Past\u00e9is de Bel\u00e9m', 'Padr\u00e3o dos Descobrimentos'],
  },
}

function getTourMeta(name: string) {
  return tourMeta[name] || { emoji: '\u{1F6FA}', highlights: [] }
}

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

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
]

export function BookingWidget() {
  const [form, setForm] = useState<BookingForm>(initialForm)
  const [tours, setTours] = useState<TourCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1=tour, 2=details, 3=confirm
  const [fetchError, setFetchError] = useState(false)

  const selectedTour = tours.find(t => t.id === form.tour_id)
  const totalPrice = selectedTour ? selectedTour.default_price : 0

  useEffect(() => {
    fetchTours()
  }, [])

  async function fetchTours() {
    setLoading(true)
    setFetchError(false)
    try {
      const { data, error } = await supabase
        .from('tour_catalog')
        .select('*')
        .eq('company_id', DEFAULT_COMPANY_ID)
        .eq('active', true)
        .order('name')

      if (error) {
        console.error('Tour fetch error:', error)
        setFetchError(true)
      } else if (data) {
        setTours(data)
      }
    } catch (err) {
      console.error('Tour fetch exception:', err)
      setFetchError(true)
    }
    setLoading(false)
  }

  function handleChange(field: keyof BookingForm, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  function validateStep1() {
    if (!form.tour_id) return 'Please select a tour / Selecione um tour'
    if (!form.date) return 'Please select a date / Selecione uma data'
    return null
  }

  function validateStep2() {
    if (!form.customer_name.trim()) return 'Please enter your name / Insira o seu nome'
    if (!form.customer_phone.trim() && !form.customer_email.trim()) {
      return 'Please enter your phone or email / Insira o seu telefone ou email'
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
      const startAt = new Date(`${form.date}T${form.time}:00`)
      const endAt = new Date(startAt.getTime() + selectedTour.default_duration_min * 60000)

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

  const today = new Date().toISOString().split('T')[0]

  const stepLabels = ['Tour', 'Details', 'Confirm']

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">{'\u{1F6FA}'}</div>
          <p className="text-clay font-medium">Loading tours...</p>
          <p className="text-clay/60 text-sm mt-1">A carregar tours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <div className="bg-charcoal text-white py-6">
        <div className="max-w-lg mx-auto px-4 text-center">
          <a href="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-bold">{'\u{1F6FA}'} Tuk & Roll</h1>
          </a>
          <p className="text-sm text-sand/80 mt-1">Book your Lisbon TukTuk tour</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    s < step
                      ? 'bg-green-500 text-white'
                      : s === step
                        ? 'bg-copper text-white'
                        : 'bg-cream text-clay'
                  }`}
                >
                  {s < step ? '\u2713' : s}
                </div>
                <span className="text-xs text-clay mt-1">{stepLabels[s - 1]}</span>
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 mb-5 ${s < step ? 'bg-green-500' : 'bg-cream'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-start gap-2">
            <span className="text-red-500 mt-0.5">{'\u26A0\uFE0F'}</span>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Choose Tour */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-charcoal">
              Choose your tour <span className="text-clay font-normal text-sm">/ Escolha o seu tour</span>
            </h2>

            {/* Tour cards or error state */}
            {fetchError || tours.length === 0 ? (
              <div className="bg-white rounded-xl p-6 border border-cream text-center">
                <div className="text-4xl mb-3">{fetchError ? '\u{1F614}' : '\u{1F50D}'}</div>
                <p className="text-charcoal font-medium">
                  {fetchError ? 'Could not load tours' : 'No tours available'}
                </p>
                <p className="text-clay text-sm mt-1">
                  {fetchError
                    ? 'Please try again / Tente novamente'
                    : 'Check back soon / Volte em breve'}
                </p>
                {fetchError && (
                  <button
                    onClick={fetchTours}
                    className="mt-4 px-6 py-2 bg-copper text-white rounded-xl hover:bg-copper/90 transition-colors text-sm font-medium"
                  >
                    Retry / Tentar novamente
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {tours.map(tour => {
                  const meta = getTourMeta(tour.name)
                  const isSelected = form.tour_id === tour.id
                  return (
                    <button
                      key={tour.id}
                      onClick={() => handleChange('tour_id', tour.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-copper bg-copper/5 shadow-sm'
                          : 'border-cream bg-white hover:border-copper/40 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-3xl flex-shrink-0 mt-0.5">{meta.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold text-charcoal text-base">{tour.name}</h3>
                            <span className="text-copper font-bold whitespace-nowrap">
                              {formatCurrency(tour.default_price)}/tuktuk
                            </span>
                          </div>
                          {tour.description && (
                            <p className="text-sm text-clay mt-1 line-clamp-2">{tour.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                            <span className="text-xs text-clay bg-cream/80 px-2 py-0.5 rounded-full">
                              {'\u23F1\uFE0F'} {tour.default_duration_min} min
                            </span>
                            {meta.highlights.slice(0, 3).map(h => (
                              <span key={h} className="text-xs text-clay">
                                {'\u{1F4CD}'} {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-2 ml-10 text-xs text-copper font-medium">
                          {'\u2713'} Selected
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Date <span className="text-clay font-normal">/ Data</span>
                </label>
                <input
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={e => handleChange('date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  Time <span className="text-clay font-normal">/ Hora</span>
                </label>
                <select
                  value={form.time}
                  onChange={e => handleChange('time', e.target.value)}
                  className="w-full px-3 py-2.5 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper transition-colors"
                >
                  <optgroup label="Morning / Manh\u00e3">
                    {timeSlots.filter(t => parseInt(t) < 12).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Afternoon / Tarde">
                    {timeSlots.filter(t => parseInt(t) >= 12).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Passengers <span className="text-clay font-normal">/ Passageiros</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => form.pax > 1 && handleChange('pax', form.pax - 1)}
                  className="w-10 h-10 rounded-full border-2 border-cream flex items-center justify-center text-lg font-bold hover:bg-cream hover:border-copper/30 transition-colors disabled:opacity-40"
                  disabled={form.pax <= 1}
                >
                  -
                </button>
                <span className="text-xl font-bold text-charcoal w-8 text-center">{form.pax}</span>
                <button
                  onClick={() => form.pax < 6 && handleChange('pax', form.pax + 1)}
                  className="w-10 h-10 rounded-full border-2 border-cream flex items-center justify-center text-lg font-bold hover:bg-cream hover:border-copper/30 transition-colors disabled:opacity-40"
                  disabled={form.pax >= 6}
                >
                  +
                </button>
                <span className="text-sm text-clay ml-1">(max 6)</span>
              </div>
            </div>

            {/* Price summary */}
            {selectedTour && (
              <div className="bg-copper/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-clay">Total</p>
                  <p className="text-xs text-clay">
                    Per TukTuk (up to 6 pax)
                  </p>
                </div>
                <p className="text-2xl font-bold text-copper">{formatCurrency(totalPrice)}</p>
              </div>
            )}

            <button
              onClick={handleNextStep}
              disabled={tours.length === 0}
              className="w-full py-3.5 bg-copper text-white font-semibold rounded-xl hover:bg-copper/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              Continue {'\u2192'}
            </button>
          </div>
        )}

        {/* Step 2: Your Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-charcoal">
              Your details <span className="text-clay font-normal text-sm">/ Os seus dados</span>
            </h2>

            {/* Tour summary mini-card */}
            {selectedTour && (
              <div className="bg-white rounded-xl p-3 border border-cream flex items-center gap-3">
                <span className="text-2xl">{getTourMeta(selectedTour.name).emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-charcoal text-sm">{selectedTour.name}</p>
                  <p className="text-xs text-clay">
                    {form.date} {'\u00B7'} {form.time} {'\u00B7'} {form.pax} pax
                  </p>
                </div>
                <p className="font-bold text-copper">{formatCurrency(totalPrice)}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Full name / Nome completo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.customer_name}
                onChange={e => handleChange('customer_name', e.target.value)}
                placeholder="John Smith"
                className="w-full px-3 py-2.5 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Email
              </label>
              <input
                type="email"
                value={form.customer_email}
                onChange={e => handleChange('customer_email', e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2.5 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Phone / WhatsApp
              </label>
              <input
                type="tel"
                value={form.customer_phone}
                onChange={e => handleChange('customer_phone', e.target.value)}
                placeholder="+44 7700 900123"
                className="w-full px-3 py-2.5 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper transition-colors"
              />
              <p className="text-xs text-clay mt-1">
                {'\u{1F4AC}'} We'll send your booking confirmation via WhatsApp
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Pickup location / Local de recolha
              </label>
              <input
                type="text"
                value={form.pickup_location}
                onChange={e => handleChange('pickup_location', e.target.value)}
                placeholder="Hotel name or address"
                className="w-full px-3 py-2.5 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                Notes / Notas <span className="text-clay font-normal">(optional)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="Any special requests? / Algum pedido especial?"
                rows={2}
                className="w-full px-3 py-2.5 border border-cream rounded-xl bg-white focus:ring-2 focus:ring-copper/20 focus:border-copper transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border-2 border-cream text-clay font-semibold rounded-xl hover:bg-cream transition-colors"
              >
                {'\u2190'} Back
              </button>
              <button
                onClick={handleNextStep}
                className="flex-1 py-3 bg-copper text-white font-semibold rounded-xl hover:bg-copper/90 transition-colors"
              >
                Review {'\u2192'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Pay */}
        {step === 3 && selectedTour && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-charcoal">
              Confirm & Pay <span className="text-clay font-normal text-sm">/ Confirmar e Pagar</span>
            </h2>

            <div className="bg-white rounded-xl p-5 space-y-3 border border-cream">
              <div className="flex items-center gap-3 pb-3 border-b border-cream">
                <span className="text-3xl">{getTourMeta(selectedTour.name).emoji}</span>
                <div>
                  <h3 className="font-bold text-charcoal">{selectedTour.name}</h3>
                  <p className="text-sm text-clay">{selectedTour.default_duration_min} min tour</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-clay">{'\u{1F4C5}'} Date</span>
                <span className="font-semibold text-charcoal text-right">{form.date}</span>

                <span className="text-clay">{'\u{1F552}'} Time</span>
                <span className="font-semibold text-charcoal text-right">{form.time}</span>

                <span className="text-clay">{'\u{1F465}'} Passengers</span>
                <span className="font-semibold text-charcoal text-right">{form.pax}</span>

                {form.pickup_location && (
                  <>
                    <span className="text-clay">{'\u{1F4CD}'} Pickup</span>
                    <span className="font-semibold text-charcoal text-right">{form.pickup_location}</span>
                  </>
                )}
              </div>

              <hr className="border-cream" />

              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-clay">{'\u{1F464}'} Name</span>
                <span className="font-semibold text-charcoal text-right">{form.customer_name}</span>

                {form.customer_email && (
                  <>
                    <span className="text-clay">{'\u2709\uFE0F'} Email</span>
                    <span className="font-semibold text-charcoal text-right">{form.customer_email}</span>
                  </>
                )}

                {form.customer_phone && (
                  <>
                    <span className="text-clay">{'\u{1F4F1}'} Phone</span>
                    <span className="font-semibold text-charcoal text-right">{form.customer_phone}</span>
                  </>
                )}
              </div>

              <hr className="border-cream" />

              <div className="flex justify-between items-center pt-1">
                <div>
                  <span className="text-sm text-clay">
                    Per TukTuk (up to 6 pax)
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-clay">Total</p>
                  <p className="text-2xl font-bold text-copper">{formatCurrency(totalPrice)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={submitting}
                className="flex-1 py-3 border-2 border-cream text-clay font-semibold rounded-xl hover:bg-cream transition-colors disabled:opacity-50"
              >
                {'\u2190'} Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 bg-copper text-white font-semibold rounded-xl hover:bg-copper/90 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Pay ${formatCurrency(totalPrice)} \u{1F512}`
                )}
              </button>
            </div>

            <p className="text-xs text-clay text-center">
              {'\u{1F512}'} Secure payment powered by Stripe. You will be redirected to complete payment.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <a href="/" className="text-xs text-clay hover:text-copper transition-colors">
          {'\u2190'} tukanapp.pt
        </a>
        <p className="text-xs text-clay mt-1">
          Powered by Tuk an App {'\u00A9'} {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
