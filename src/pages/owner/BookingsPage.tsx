import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Input, TextArea, Select } from '../../components/Input'
import { EmptyState } from '../../components/EmptyState'
import { Booking, TukTuk, TourCatalogItem } from '../../lib/types'
import { formatDateTime, formatDateShort } from '../../lib/format'
import { Plus, Trash2, Calendar } from 'lucide-react'

export const BookingsPage: React.FC = () => {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tuktuks, setTuktuks] = useState<TukTuk[]>([])
  const [tours, setTours] = useState<TourCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    tour_type: '',
    pax: 1,
    start_at: '',
    end_at: '',
    price: 0,
    tuktuk_id: '',
    driver_id: '',
    pickup_location: '',
    notes: '',
  })

  useEffect(() => {
    if (profile) {
      fetchBookings()
      fetchTuktuks()
      fetchTours()
    }
  }, [profile])

  const fetchTours = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('tour_catalog')
      .select('*')
      .eq('company_id', profile.company_id)
      .eq('active', true)
      .order('name')
    setTours(data || [])
  }

  const handleSelectTour = (tourId: string) => {
    const t = tours.find((x) => x.id === tourId)
    if (!t) {
      setForm({ ...form, tour_type: '' })
      return
    }
    // Compute end_at from start_at + duration if start set
    let end_at = form.end_at
    if (form.start_at) {
      const start = new Date(form.start_at)
      const end = new Date(start.getTime() + t.default_duration_min * 60000)
      end_at = end.toISOString().slice(0, 16)
    }
    setForm({ ...form, tour_type: t.name, price: Number(t.default_price), end_at })
  }

  const fetchBookings = async () => {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('start_at', { ascending: false })
      setBookings(data || [])
    } catch (err) {
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTuktuks = async () => {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('tuktuks')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('status', 'active')
      setTuktuks(data || [])
    } catch (err) {
      console.error('Error fetching tuktuks:', err)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    try {
      await supabase
        .from('bookings')
        .insert([
          {
            ...form,
            company_id: profile.company_id,
            status: 'pending',
            source: 'app',
            pax: parseInt(form.pax.toString()),
            price: parseFloat(form.price.toString()),
          },
        ])
      await fetchBookings()
      setIsModalOpen(false)
      setForm({
        customer_name: '',
        customer_phone: '',
        tour_type: '',
        pax: 1,
        start_at: '',
        end_at: '',
        price: 0,
        tuktuk_id: '',
        driver_id: '',
        pickup_location: '',
        notes: '',
      })
    } catch (err) {
      console.error('Error saving:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza?')) return
    try {
      await supabase.from('bookings').delete().eq('id', id)
      await fetchBookings()
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h1 className="text-xl sm:text-3xl font-bold text-ink">Reservas</h1>
          <Button onClick={() => setIsModalOpen(true)} variant="primary">
            <Plus size={20} className="mr-2" />
            Nova Reserva
          </Button>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            icon={<Calendar size={24} />}
            title="Nenhuma Reserva"
            description="Comece a adicionar reservas"
            action={{ label: 'Nova Reserva', onClick: () => setIsModalOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-ink mb-1">{booking.customer_name}</h3>
                  <p className="text-sm text-ink2 mb-2">{booking.tour_type}</p>
                  <p className="text-sm text-ink2 mb-2">
                    {formatDateTime(booking.start_at)} • {booking.pax} pax
                  </p>
                  <p className="text-sm text-ink2 mb-2">Partida: {booking.pickup_location}</p>
                  <span className={`text-xs px-2 py-1 rounded-btn ${
                    booking.status === 'completed' ? 'bg-green bg-opacity-10 text-green' :
                    booking.status === 'cancelled' ? 'bg-copper bg-opacity-10 text-copper' :
                    'bg-yellow bg-opacity-10 text-ink'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="text-right">
                    <p className="font-bold text-ink">€{booking.price.toFixed(2)}</p>
                  </div>
                  <Button onClick={() => handleDelete(booking.id)} variant="secondary" size="sm">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Reserva">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <Input
            label="Nome do Cliente"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            required
          />
          <Input
            label="Telefone"
            value={form.customer_phone}
            onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
          />
          {tours.length > 0 ? (
            <Select
              label="Tour"
              value={tours.find((t) => t.name === form.tour_type)?.id || ''}
              onChange={(e) => handleSelectTour(e.target.value)}
            >
              <option value="">— Escolhe do catálogo —</option>
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · €{Number(t.default_price).toFixed(2)}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              label="Tipo de Tour"
              value={form.tour_type}
              onChange={(e) => setForm({ ...form, tour_type: e.target.value })}
              placeholder="Adiciona tours em Definições → Catálogo"
            />
          )}
          <Input
            label="Passageiros"
            type="number"
            value={form.pax}
            onChange={(e) => setForm({ ...form, pax: parseInt(e.target.value) || 1 })}
            min="1"
          />
          <Input
            label="Data/Hora Início"
            type="datetime-local"
            value={form.start_at}
            onChange={(e) => setForm({ ...form, start_at: e.target.value })}
            required
          />
          <Input
            label="Data/Hora Fim"
            type="datetime-local"
            value={form.end_at}
            onChange={(e) => setForm({ ...form, end_at: e.target.value })}
          />
          <Input
            label="Preço (€)"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            step="0.01"
          />
          <Input
            label="Local de Partida"
            value={form.pickup_location}
            onChange={(e) => setForm({ ...form, pickup_location: e.target.value })}
            placeholder="Hotel X, Av. Y"
          />
          <TextArea
            label="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} variant="primary" className="flex-1">
              Criar Reserva
            </Button>
            <Button onClick={() => setIsModalOpen(false)} variant="ghost" className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </OwnerLayout>
  )
}
