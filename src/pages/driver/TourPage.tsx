import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input, Select, TextArea } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { Booking } from '../../lib/types'
import { formatTime } from '../../lib/format'

export const TourPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEndModal, setShowEndModal] = useState(false)
  const [endForm, setEndForm] = useState({
    finalKm: 0,
    paymentMethod: 'cash',
    amount: 0,
    tipAmount: 0,
    notes: '',
  })

  useEffect(() => {
    if (id && profile) {
      fetchBooking()
    }
  }, [id, profile])

  const fetchBooking = async () => {
    if (!id) return
    try {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setBooking(data)
        setEndForm({ ...endForm, amount: data.price })
      }
    } catch (err) {
      console.error('Error fetching booking:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTour = async () => {
    if (!id) return
    try {
      await supabase
        .from('bookings')
        .update({ status: 'in_progress' })
        .eq('id', id)
      await fetchBooking()
    } catch (err) {
      console.error('Error starting tour:', err)
    }
  }

  const handleEndTour = async () => {
    if (!id || !profile) return
    try {
      // Update booking status (tip is private to driver, not in payment)
      await supabase
        .from('bookings')
        .update({ status: 'completed', tip_amount: endForm.tipAmount })
        .eq('id', id)

      // Record payment (tip is NOT included — 100% of tip stays with driver)
      await supabase
        .from('payments')
        .insert([
          {
            company_id: profile.company_id,
            booking_id: id,
            method: endForm.paymentMethod,
            amount: endForm.amount,
            received_at: new Date().toISOString(),
            received_by: profile.id,
            notes: endForm.notes,
          },
        ])

      setShowEndModal(false)
      navigate('/driver/today')
    } catch (err) {
      console.error('Error ending tour:', err)
    }
  }

  if (loading) return <DriverLayout><div className="text-center py-12">Carregando...</div></DriverLayout>

  if (!booking) {
    return (
      <DriverLayout>
        <div className="text-center py-12">Tour não encontrado</div>
      </DriverLayout>
    )
  }

  return (
    <DriverLayout>
      <div className="p-4 space-y-4">
        <Card className="bg-yellow bg-opacity-10 border-yellow">
          <h1 className="text-2xl font-bold text-ink mb-2">{booking.customer_name}</h1>
          <p className="text-sm text-ink2 mb-1">Tour: {booking.tour_type}</p>
          <p className="text-sm text-ink2 mb-1">Passageiros: {booking.pax}</p>
          <p className="text-sm text-ink2 mb-1">Partida: {booking.pickup_location}</p>
          <p className="text-sm text-ink2">Contacto: {booking.customer_phone}</p>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink mb-2">Detalhes do Tour</h2>
          <p className="text-sm text-ink2 mb-1">Início: {formatTime(booking.start_at)}</p>
          <p className="text-sm text-ink2 mb-1">Fim Previsto: {formatTime(booking.end_at)}</p>
          <p className="text-sm text-ink2 mb-2">Preço Base: €{booking.price.toFixed(2)}</p>
          <span className={`text-xs px-2 py-1 rounded-btn ${
            booking.status === 'in_progress' ? 'bg-yellow bg-opacity-10 text-ink' : 'bg-green bg-opacity-10 text-green'
          }`}>
            {booking.status === 'in_progress' ? 'Em Curso' : 'Completo'}
          </span>
        </Card>

        {booking.notes && (
          <Card>
            <h2 className="text-lg font-bold text-ink mb-2">Notas</h2>
            <p className="text-sm text-ink2">{booking.notes}</p>
          </Card>
        )}

        {booking.status === 'pending' && (
          <Button onClick={handleStartTour} variant="primary" className="w-full">
            Confirmar e Iniciar Tour
          </Button>
        )}

        {booking.status === 'in_progress' && (
          <Button onClick={() => setShowEndModal(true)} variant="primary" className="w-full bg-green">
            Terminar Tour
          </Button>
        )}

        {booking.status === 'completed' && (
          <div className="text-center py-4 text-green font-bold">
            ✓ Tour Completo
          </div>
        )}
      </div>

      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="Terminar Tour"
      >
        <div className="space-y-4">
          <Input
            label="KM Final"
            type="number"
            value={endForm.finalKm}
            onChange={(e) => setEndForm({ ...endForm, finalKm: parseInt(e.target.value) || 0 })}
            placeholder="12345"
          />
          <Input
            label="Valor Recebido (€)"
            type="number"
            value={endForm.amount}
            onChange={(e) => setEndForm({ ...endForm, amount: parseFloat(e.target.value) || 0 })}
            step="0.01"
          />
          <Input
            label="Gorjeta (\u20ac) \u2014 s\u00f3 tu v\u00eas \ud83e\udd2b"
            type="number"
            value={endForm.tipAmount}
            onChange={(e) => setEndForm({ ...endForm, tipAmount: parseFloat(e.target.value) || 0 })}
            step="0.5"
            placeholder="0"
          />
          <Select
            label="Método de Pagamento"
            options={[
              { value: 'cash', label: 'Dinheiro' },
              { value: 'card', label: 'Cartão' },
              { value: 'mbway', label: 'MB Way' },
              { value: 'transfer', label: 'Transferência' },
              { value: 'other', label: 'Outro' },
            ]}
            value={endForm.paymentMethod}
            onChange={(e) => setEndForm({ ...endForm, paymentMethod: e.target.value })}
          />
          <TextArea
            label="Notas (opcional)"
            value={endForm.notes}
            onChange={(e) => setEndForm({ ...endForm, notes: e.target.value })}
            placeholder="Alguma coisa especial?"
          />
          <div className="flex gap-2 pt-4">
            <Button onClick={handleEndTour} variant="primary" className="flex-1">
              Confirmar Conclusão
            </Button>
            <Button onClick={() => setShowEndModal(false)} variant="ghost" className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </DriverLayout>
  )
}
