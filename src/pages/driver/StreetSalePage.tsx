import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input, Select, TextArea } from '../../components/Input'
import { TourCatalogItem } from '../../lib/types'
import { ArrowLeft } from 'lucide-react'

export const StreetSalePage: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [tours, setTours] = useState<TourCatalogItem[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tour_name: '',
    duration_min: 60,
    pax: 2,
    price: 0,
    payment_method: 'cash',
    tip_amount: 0,
    notes: '',
  })

  useEffect(() => {
    if (!profile) return
    supabase
      .from('tour_catalog')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('active', true)
      .order('name')
      .then(({ data }) => setTours(data || []))
  }, [profile])

  const handleSelectTour = (id: string) => {
    const tour = tours.find((t) => t.id === id)
    if (tour) {
      setForm((f) => ({
        ...f,
        tour_name: tour.name,
        duration_min: tour.default_duration_min,
        price: Number(tour.default_price),
      }))
    }
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
        sold_at: new Date().toISOString(),
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
      <div className="p-4 space-y-4">
        <button
          onClick={() => navigate('/driver/today')}
          className="flex items-center gap-1 text-sm text-ink2"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <h1 className="text-2xl font-bold text-ink">Nova Venda de Rua</h1>
        <p className="text-sm text-ink2">
          Vendeste um tour diretamente na rua? Regista aqui para que conte para as tuas finanças e para o owner.
        </p>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Select
              label="Tour"
              options={tours.map((t) => ({
                value: t.id,
                label: `${t.name} — €${Number(t.default_price).toFixed(0)} / ${t.default_duration_min}min`,
              }))}
              onChange={(e) => handleSelectTour(e.target.value)}
            />

            <Input
              label="Nome do tour (se não estiver na lista)"
              value={form.tour_name}
              onChange={(e) => setForm({ ...form, tour_name: e.target.value })}
              placeholder="Ex: City Tour"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Duração (min)"
                type="number"
                value={form.duration_min}
                onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Pessoas"
                type="number"
                value={form.pax}
                onChange={(e) => setForm({ ...form, pax: parseInt(e.target.value) || 1 })}
              />
            </div>

            <Input
              label="Preço total (€)"
              type="number"
              step="0.5"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            />

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

            <Button type="submit" variant="primary" className="w-full" disabled={saving}>
              {saving ? 'A guardar…' : 'Registar Venda'}
            </Button>
          </form>
        </Card>
      </div>
    </DriverLayout>
  )
}
