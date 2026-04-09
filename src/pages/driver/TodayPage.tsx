import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { Booking, Shift, DriverStatus } from '../../lib/types'
import { formatTime, isTodayDate } from '../../lib/format'
import { Play } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'

export const TodayPage: React.FC = () => {
  const { user, profile } = useAuth()
  const [shift, setShift] = useState<Shift | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<DriverStatus>(profile?.status || 'offline')
  const [statusSaving, setStatusSaving] = useState(false)

  useEffect(() => {
    if (profile?.status) setStatus(profile.status)
  }, [profile?.status])

  const updateStatus = async (next: DriverStatus) => {
    if (!profile) return
    setStatusSaving(true)
    const prev = status
    setStatus(next)
    const { error } = await supabase
      .from('profiles')
      .update({ status: next, status_updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (error) {
      console.error(error)
      setStatus(prev)
      alert('Não foi possível atualizar o estado.')
    }
    setStatusSaving(false)
  }

  useEffect(() => {
    if (user && profile) {
      fetchTodayData()
    }
  }, [user, profile])

  const fetchTodayData = async () => {
    if (!profile) return

    try {
      // Get today's shift
      const { data: shifts } = await supabase
        .from('shifts')
        .select('*')
        .eq('driver_id', profile.id)
        .eq('shift_date', new Date().toISOString().split('T')[0])

      if (shifts && shifts.length > 0) {
        setShift(shifts[0])
      }

      // Get today's bookings
      const { data: bkgs } = await supabase
        .from('bookings')
        .select('*')
        .eq('driver_id', profile.id)
        .gte('start_at', new Date().toISOString().split('T')[0])
        .lt('start_at', new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .neq('status', 'cancelled')

      setBookings(bkgs || [])
    } catch (err) {
      console.error('Error fetching today data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <DriverLayout><div className="text-center py-12">Carregando...</div></DriverLayout>

  return (
    <DriverLayout>
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold text-ink">Olá, {profile?.full_name?.split(' ')[0]}!</h1>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink">O meu estado</span>
            <StatusBadge status={status} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={status === 'available' ? 'primary' : 'secondary'}
              onClick={() => updateStatus('available')}
              disabled={statusSaving}
              className="text-xs"
            >
              Disponível
            </Button>
            <Button
              variant={status === 'busy' ? 'primary' : 'secondary'}
              onClick={() => updateStatus('busy')}
              disabled={statusSaving}
              className="text-xs"
            >
              Ocupado
            </Button>
            <Button
              variant={status === 'offline' ? 'primary' : 'secondary'}
              onClick={() => updateStatus('offline')}
              disabled={statusSaving}
              className="text-xs"
            >
              Offline
            </Button>
          </div>
          <p className="text-xs text-ink2">
            Marca <strong>Ocupado</strong> quando começas um tour e <strong>Disponível</strong> quando acabas. O owner vê em tempo real.
          </p>
        </Card>

        {shift && (
          <Card className="bg-yellow bg-opacity-10 border-yellow">
            <h2 className="text-lg font-bold text-ink mb-2">Turno de Hoje</h2>
            <p className="text-sm text-ink2 mb-1">
              {formatTime(shift.start_at)} - {formatTime(shift.end_at)}
            </p>
            <p className="text-sm text-ink2">ID do Tuktuk: {shift.tuktuk_id}</p>
          </Card>
        )}

        {bookings.length === 0 ? (
          <EmptyState
            icon="🛺"
            title="Sem Tours Hoje"
            description="Você não tem nenhum tour agendado para hoje"
          />
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Tours Hoje ({bookings.length})</h2>
            {bookings.map((booking) => (
              <Card key={booking.id} className="flex flex-col gap-3">
                <div>
                  <h3 className="text-lg font-bold text-ink">{booking.customer_name}</h3>
                  <p className="text-sm text-ink2 mb-2">{booking.tour_type}</p>
                  <p className="text-sm text-ink2 mb-1">Hora: {formatTime(booking.start_at)}</p>
                  <p className="text-sm text-ink2 mb-1">Partida: {booking.pickup_location}</p>
                  <p className="text-sm text-ink2 mb-2">Passageiros: {booking.pax}</p>
                  <span className={`text-xs px-2 py-1 rounded-btn ${
                    booking.status === 'completed' ? 'bg-green bg-opacity-10 text-green' :
                    booking.status === 'in_progress' ? 'bg-yellow bg-opacity-10 text-ink' :
                    'bg-line bg-opacity-50 text-ink2'
                  }`}>
                    {booking.status === 'pending' ? 'Pendente' :
                     booking.status === 'confirmed' ? 'Confirmado' :
                     booking.status === 'in_progress' ? 'Em Curso' :
                     'Completo'}
                  </span>
                </div>

                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                  <Link to={`/driver/tour/${booking.id}`} className="w-full">
                    <Button variant="primary" className="w-full">
                      <Play size={20} className="mr-2" />
                      Iniciar Tour
                    </Button>
                  </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DriverLayout>
  )
}
