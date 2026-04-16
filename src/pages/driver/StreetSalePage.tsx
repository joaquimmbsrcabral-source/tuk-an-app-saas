import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input, Select, TextArea } from '../../components/Input'
import { ArrowLeft, Calendar, Clock, Users, Minus, Plus } from 'lucide-react'

const DEFAULT_TOURS = [
  { name: 'Histórico', duration_min: 120, price: 180, emoji: '🏰' },
  { name: 'New Lisbon', duration_min: 120, price: 180, emoji: '🌆' },
  { name: 'Belém', duration_min: 150, price: 220, emoji: '⚓' },
]

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

  const selectTour = (idx: number) => {
    const tour = DEFAULT_TOURS[idx]
    setSelectedTourIdx(idx)
    setForm((f) => ({
      ...f,
      tour_name: tour.name,
      duration_min: tour.duration_min,
      price: tour.price,
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
      alert('Escolhe o tour e preenche o preço.')
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
      alert('Não foi possível registar a venda. ' + error.message)
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
          <p className="text-sm text-ink2 mt-1">Escolhe o tour ou personaliza abaixo</p>
        </div>

        {/* Tour Quick-Select Cards */}
        <div className="grid grid-cols-3 gap-3">
          {DEFAULT_TOURS.map((tour, idx) => {
            const active = selectedTourIdx === idx
            return (
              <button
                key={tour.name}
                type="button"
                onClick={() => selectTour(idx)}
                className={`relative flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all duration-150 active:scale-[0.96] ${
                  active
                    ? 'border-yellow bg-yellow bg-opacity-10 shadow-md'
                    : 'border-line bg-card hover:border-ink hover:border-opacity-20'
                }`}
              >
                <span className="text-2xl">{tour.emoji}</span>
                <span className="text-sm font-bold text-ink leading-tight text-center">
                  {tour.name}
                </span>
                <span className="text-xs text-ink2">{formatDuration(tour.duration_min)}</span>
                <span className="text-base font-bold text-ink">{tour.price}€</span>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tour Details */}
          <Card>
            {/* Date */}
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

            {/* Duration Pills */}
            <div className="mb-4">
              <label className="block text-sm font-600 text-ink mb-2">
                <Clock size={14} className="inline mr-1 -mt-0.5" />
                Duração
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

            {/* Pax Stepper */}
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

            {/* Price */}
            <Input
              label="Preço total (€)"
              type="number"
              step="5"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            />
          </Card>

          {/* Payment & Extras */}
          <Card>
            <Select
              label="Pagamento"
              options={[
                { value: 'cash', label: 'Dinheiro' },
                { value: 'mbway', label: 'MB Way' },
                { value: 'card', label: 'Cartão' },
                { value: 'transfer', label: 'Transferência' },
                { value: 'other', label: 'Outro' },
              ]}
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
            />

            <Input
              label="Gorjeta (€) — só tu vês"
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

          {/* Submit */}
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving} loading={saving}>
            {saving ? 'A guardar…' : 'Registar Venda'}
          </Button>
        </form>
      </div>
    </DriverLayout>
  )
}
