import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TourCatalogItem } from '../lib/types'
import { formatCurrency } from '../lib/format'
import { MapPin, Clock, Users, Phone, CheckCircle, ChevronRight } from 'lucide-react'

export const BookingPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>()
  const [companyName, setCompanyName] = useState('')
  const [tours, setTours] = useState<TourCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTour, setSelectedTour] = useState<TourCatalogItem | null>(null)
  const [step, setStep] = useState<'tours' | 'form' | 'success'>('tours')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    pax: 2,
    date: '',
    time: '10:00',
    notes: '',
  })

  useEffect(() => {
    if (companyId) fetchData()
  }, [companyId])

  const fetchData = async () => {
    if (!companyId) return
    try {
      const [compRes, toursRes] = await Promise.all([
        supabase.from('companies').select('name').eq('id', companyId).single(),
        supabase.from('tour_catalog').select('*').eq('company_id', companyId).eq('active', true).order('default_price', { ascending: true }),
      ])
      setCompanyName(compRes.data?.name || 'TukTuk Tours')
      setTours(toursRes.data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedTour || !companyId || !form.customer_name || !form.customer_phone || !form.date) return
    setSubmitting(true)
    try {
      const startAt = `${form.date}T${form.time}:00`
      const endMinutes = selectedTour.default_duration_min || 60
      const endDate = new Date(new Date(startAt).getTime() + endMinutes * 60000)

      await supabase.from('bookings').insert([{
        company_id: companyId,
        tuktuk_id: null,
        driver_id: null,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        tour_type: selectedTour.name,
        pax: form.pax,
        start_at: startAt,
        end_at: endDate.toISOString(),
        price: selectedTour.default_price,
        tip_amount: 0,
        status: 'pending',
        source: 'website',
        pickup_location: '',
        notes: form.notes,
      }])
      setStep('success')
    } catch (err) {
      console.error('Booking error:', err)
      alert('Erro ao criar reserva. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  // Get tomorrow as min date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!companyId || tours.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin size={32} className="text-yellow" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Reservas Indisponíveis</h1>
          <p className="text-ink2">De momento não existem tours disponíveis para reserva.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-ink text-cream">
        <div className="max-w-2xl mx-auto px-6 py-8 text-center">
          <div className="w-12 h-12 bg-yellow rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin size={24} className="text-ink" />
          </div>
          <h1 className="text-2xl font-bold mb-1">{companyName}</h1>
          <p className="text-cream text-opacity-70 text-sm">Reserve o seu tour de TukTuk</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {['Escolher Tour', 'Dados', 'Confirmado'].map((label, i) => {
            const stepIndex = i === 0 ? 'tours' : i === 1 ? 'form' : 'success'
            const isActive = step === stepIndex
            const isPast = (step === 'form' && i === 0) || (step === 'success' && i <= 1)
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive ? 'bg-yellow text-ink' : isPast ? 'bg-green text-white' : 'bg-line text-ink2'
                }`}>
                  {isPast ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-ink' : 'text-ink2'}`}>{label}</span>
                {i < 2 && <ChevronRight size={14} className="text-ink2 hidden sm:block" />}
              </div>
            )
          })}
        </div>

        {/* Step: Choose Tour */}
        {step === 'tours' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink text-center mb-6">Escolha o seu tour</h2>
            {tours.map((tour) => (
              <button
                key={tour.id}
                onClick={() => { setSelectedTour(tour); setStep('form') }}
                className="w-full bg-card border border-line rounded-2xl p-5 text-left hover:shadow-card-md hover:border-yellow transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-ink group-hover:text-ink mb-1">{tour.name}</h3>
                    {tour.description && <p className="text-sm text-ink2 mb-3 leading-relaxed">{tour.description}</p>}
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-sm text-ink2">
                        <Clock size={14} /> {tour.default_duration_min} min
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-2xl font-black text-ink">{formatCurrency(tour.default_price)}</div>
                    <span className="text-xs text-ink2">por tour</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step: Booking Form */}
        {step === 'form' && selectedTour && (
          <div className="space-y-6">
            {/* Selected tour summary */}
            <div className="bg-card border border-yellow border-opacity-30 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-ink2 uppercase font-semibold tracking-wider">Tour selecionado</p>
                <p className="font-bold text-ink">{selectedTour.name}</p>
                <p className="text-sm text-ink2">{selectedTour.default_duration_min} min · {formatCurrency(selectedTour.default_price)}</p>
              </div>
              <button onClick={() => setStep('tours')} className="text-sm text-copper font-semibold hover:underline">
                Alterar
              </button>
            </div>

            <div className="bg-card border border-line rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-ink">Os seus dados</h2>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Nome</label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="João Silva"
                  className="w-full px-4 py-3 border border-line rounded-btn text-ink placeholder:text-ink2 placeholder:text-opacity-40 focus:outline-none focus:border-copper transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={form.customer_phone}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  placeholder="+351 912 345 678"
                  className="w-full px-4 py-3 border border-line rounded-btn text-ink placeholder:text-ink2 placeholder:text-opacity-40 focus:outline-none focus:border-copper transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Data</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    min={minDate}
                    className="w-full px-4 py-3 border border-line rounded-btn text-ink focus:outline-none focus:border-copper transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Hora</label>
                  <select
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full px-4 py-3 border border-line rounded-btn text-ink focus:outline-none focus:border-copper transition-colors bg-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 8).map((h) => (
                      <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>{h}:00</option>
                    ))}
                    {Array.from({ length: 12 }, (_, i) => i + 8).map((h) => (
                      <option key={`${h}:30`} value={`${h.toString().padStart(2, '0')}:30`}>{h}:30</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Passageiros</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setForm({ ...form, pax: Math.max(1, form.pax - 1) })}
                    className="w-10 h-10 rounded-xl border border-line flex items-center justify-center text-ink hover:bg-cream transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <span className="text-xl font-black text-ink w-8 text-center">{form.pax}</span>
                  <button
                    onClick={() => setForm({ ...form, pax: Math.min(8, form.pax + 1) })}
                    className="w-10 h-10 rounded-xl border border-line flex items-center justify-center text-ink hover:bg-cream transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                  <span className="text-sm text-ink2 ml-2">
                    <Users size={14} className="inline mr-1" />
                    {form.pax} {form.pax === 1 ? 'pessoa' : 'pessoas'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Notas (opcional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ex: Hotel pickup, necessidades especiais..."
                  rows={2}
                  className="w-full px-4 py-3 border border-line rounded-btn text-ink placeholder:text-ink2 placeholder:text-opacity-40 focus:outline-none focus:border-copper transition-colors resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !form.customer_name || !form.customer_phone || !form.date}
              className="w-full bg-ink text-cream font-bold py-4 rounded-btn text-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Confirmar Reserva — {formatCurrency(selectedTour.default_price)}</>
              )}
            </button>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green" />
            </div>
            <h2 className="text-2xl font-bold text-ink mb-2">Reserva Confirmada!</h2>
            <p className="text-ink2 mb-6 leading-relaxed max-w-md mx-auto">
              A sua reserva foi recebida com sucesso. A equipa do <strong>{companyName}</strong> irá contactá-lo em breve para confirmar os detalhes.
            </p>
            <div className="bg-card border border-line rounded-2xl p-5 max-w-sm mx-auto text-left space-y-2 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-ink2">Tour</span>
                <span className="font-semibold text-ink">{selectedTour?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink2">Data</span>
                <span className="font-semibold text-ink">{form.date} às {form.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink2">Passageiros</span>
                <span className="font-semibold text-ink">{form.pax}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-line pt-2 mt-2">
                <span className="text-ink2">Total</span>
                <span className="font-bold text-ink text-lg">{formatCurrency(selectedTour?.default_price || 0)}</span>
              </div>
            </div>
            <button
              onClick={() => { setStep('tours'); setSelectedTour(null); setForm({ customer_name: '', customer_phone: '', pax: 2, date: '', time: '10:00', notes: '' }) }}
              className="text-copper font-semibold hover:underline"
            >
              Fazer outra reserva
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <p className="text-xs text-ink2">
            Powered by <a href="https://www.tukanapp.pt" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink hover:text-copper transition-colors">Tuk an App</a>
          </p>
        </div>
      </div>
    </div>
  )
}
