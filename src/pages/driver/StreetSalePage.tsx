import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input, Select, TextArea } from '../../components/Input'
import { ArrowLeft, Calendar, Clock, Users, Minus, Plus, Sparkles } from 'lucide-react'
import { TourCatalogItem } from '../../lib/types'

// Pequena rota\u00e7\u00e3o de emojis para tornar os cart\u00f5es de tour visualmente distintos
// quando a empresa n\u00e3o associa um emoji explicitamente.
const TOUR_EMOJIS = ['\ud83c\udff0', '\ud83c\udf06', '\u2693', '\ud83d\udecd\ufe0f', '\ud83d\udd06', '\ud83c\udf3f', '\u2728', '\ud83c\udfa8']

const DURATION_OPTIONS = [
  { min: 30, label: '30m' },
  { min: 60, label: '1h' },
  { min: 90, label: '1h30' },
  { min: 120, label: '2h' },
  { min: 150, label: '2h30' },
  { min: 180, label: '3h' },
  { min: 210, label: '3h30' },
  { min: 240, label: '4h' },
]

export const StreetSalePage: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [tours, setTours] = useState<TourCatalogItem[]>([])
  const [toursLoading, setToursLoading] = useState(true)
  const [selectedTourIdx, setSelectedTourIdx] = useState<number | null>(null)
  const todayStr = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    tour_name: '',
    duration_min: 120,
    pax: 2,
    price: 0,
    payment_method: 'cash',
    tip_amount: 0,
    notes: '',
    sold_date: todayStr,
  })

  // Vai buscar o catálogo da empresa para que o motorista veja os tours reais
  // (configurados pelo owner em Definições) em vez de tours genéricos.
  useEffect(() => {
    const fetchTours = async () => {
      if (!profile) return
      const { data } = await supabase
        .from('tour_catalog')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('active', true)
        .order('default_price', { ascending: true })
      setTours(data || [])
      setToursLoading(false)
    }
    fetchTours()
  }, [profile])

  const selectTour = (idx: number) => {
    const tour = tours[idx]
    if (!tour) return
    setSelectedTourIdx(idx)
    setForm((f) => ({
      ...f,
      tour_name: tour.name,
      duration_min: tour.default_duration_min,
      price: Number(tour.default_price),
    }))
  }

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    if (h === 0) return `${m}m`
    return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
  }

  const adjustPax = (delta: number) => {
    setForm((f) => ({ ...f, pax: Math.max(1, Math.min(20, f.pax + delta)) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!form.tour_name || form.price <= 0) {
      alert('Escolhe o tour e preenche o pre\u00e7o.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('street_sales').insert([
      {
        company_id: profile.company_id,
        driver_id: profile.id,
        tour_name: form.tour_name,
        duration_min: form.duration_min,
        pax: form.pax,
        price: form.price,
        payment_method: form.payment_method,
        tip_amount: form.tip_amount,
        notes: form.notes || null,
        sold_at: new Date(form.sold_date + 'T12:00:00').toISOString(),
      },
    ])
    setSaving(false)
    if (error) {
      console.error(error)
      alert('N\u00e3o foi poss\u00edvel registar a venda. ' + error.message)
      return
    }
    navigate('/driver/today')
  }

  return (
    <DriverLayout>
      <div className="p-4 space-y-5 max-w-lg mx-auto pb-8">
        <button
          onClick={() => navigate('/driver/today')}
          className="flex items-center gap-1 text-sm text-ink2"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div>
          <h1 className="text-2xl font-bold text-ink">Nova Venda de Rua</h1>
          <p className="text-sm text-ink2 mt-1">
            {tours.length > 0 ? 'Escolhe o tour ou personaliza abaixo' : 'Personaliza os detalhes da venda'}
          </p>
        </div>

        {/* ── Tour Quick-Select Cards (catálogo da empresa) ── */}
        {!toursLoading && tours.length > 0 && (
        <div className={`grid gap-3 ${tours.length === 1 ? 'grid-cols-1' : tours.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {tours.map((tour, idx) => {
            const active = selectedTourIdx === idx
            const emoji = TOUR_EMOJIS[idx % TOUR_EMOJIS.length]
            return (
              <button
                key={tour.id}
                type="button"
                onClick={() => selectTour(idx)}
                className={`relative flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all duration-150 active:scale-[0.96] ${
                  active
                    ? 'border-yellow bg-yellow bg-opacity-10 shadow-md'
                    : 'border-line bg-card hover:border-ink hover:border-opacity-20'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-sm font-bold text-ink leading-tight text-center">
                  {tour.name}
                </span>
                <span className="text-xs text-ink2">{formatDuration(tour.default_duration_min)}</span>
                <span className="text-base font-bold text-ink">{Number(tour.default_price)}\u20ac</span>
                {active && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow rounded-full flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#18181A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
            )
          })}
        </div>
        )}

        {/* \u2500\u2500 Empty state: empresa ainda n\u00e3o tem tours configurados \u2500\u2500 */}
        {!toursLoading && tours.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-line p-4 text-center">
            <Sparkles size={20} className="mx-auto mb-2 text-yellow" />
            <p className="text-sm text-ink2">
              Ainda n\u00e3o h\u00e1 tours configurados. Pede ao teu owner para os adicionar em <span className="font-bold text-ink">Defini\u00e7\u00f5es \u2192 Cat\u00e1logo</span>.
              Podes registar a venda \u00e0 m\u00e3o abaixo.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Tour Details ── */}
          <Card>
            {/* ── Date ── */}
            <div className="mb-4">
              <label className="block text-sm font-600 text-ink mb-2">
                <Calendar size={14} className="inline mr-1 -mt-0.5" />
                Data da venda
              </label>
              <input
                type="date"
                value={form.sold_date}
                max={todayStr}
                onChange={(e) => setForm({ ...form, sold_date: e.target.value })}
                className="w-full px-4 py-3 border border-line rounded-btn font-outfit focus:outline-none focus:border-copper"
              />
            </div>

            <Input
              label="Nome do tour"
              value={form.tour_name}
              onChange={(e) => {
                setForm({ ...form, tour_name: e.target.value })
                setSelectedTourIdx(null)
              }}
              placeholder="Ex: City Tour"
            />

            {/* ── Duration Pills ── */}
            <div className="mb-4">
              <label className="block text-sm font-600 text-ink mb-2">
                <Clock size={14} className="inline mr-1 -mt-0.5" />
                Dura\u00e7\u00e3o
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.min}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, duration_min: opt.min }))}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-100 active:scale-95 ${
                      form.duration_min === opt.min
                        ? 'bg-ink text-yellow shadow-sm'
                        : 'bg-line text-ink hover:bg-opacity-80'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Pax Stepper ── */}
            <div className="mb-4">
              <label className="block text-sm font-600 text-ink mb-2">
                <Users size={14} className="inline mr-1 -mt-0.5" />
                Pessoas
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => adjustPax(-1)}
                  className="w-11 h-11 rounded-xl bg-line text-ink flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Minus size={18} />
                </button>
                <span className="text-2xl font-bold text-ink w-8 text-center">{form.pax}</span>
                <button
                  type="button"
                  onClick={() => adjustPax(1)}
                  className="w-11 h-11 rounded-xl bg-line text-ink flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* ── Price ── */}
            <Input
              label="Pre\u00e7o total (\u20ac)"
              type="number"
              step="5"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            />
          </Card>

          {/* ── Payment & Extras ── */}
          <Card>
            <Select
              label="Pagamento"
              options={[
                { value: 'cash', label: 'Dinheiro' },
                { value: 'mbway', label: 'MB Way' },
                { value: 'card', label: 'Cart\u00e3o' },
                { value: 'transfer', label: 'Transfer\u00eancia' },
                { value: 'other', label: 'Outro' },
              ]}
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            />

            <Input
              label="Gorjeta (\u20ac) \u2014 s\u00f3 tu v\u00eas"
              type="number"
              step="0.5"
              value={form.tip_amount}
              onChange={(e) => setForm({ ...form, tip_amount: parseFloat(e.target.value) || 0 })}
            />

            <TextArea
              label="Notas (opcional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Algum detalhe?"
            />
          </Card>

          {/* ── Submit ── */}
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving} loading={saving}>
            {saving ? 'A guardar\u2026' : 'Registar Venda'}
          </Button>
        </form>
      </div>
    </DriverLayout>
  )
}
