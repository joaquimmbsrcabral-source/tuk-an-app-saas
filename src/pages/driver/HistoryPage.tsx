import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { Booking, Payment } from '../../lib/types'
import { formatDate, formatCurrency, isThisMonthDate } from '../../lib/format'
import { subDays } from 'date-fns'

export const HistoryPage: React.FC = () => {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [monthlyCommission, setMonthlyCommission] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchHistory()
    }
  }, [profile])

  const fetchHistory = async () => {
    if (!profile) return

    try {
      // Get last 30 completed bookings
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
      const { data: bkgs } = await supabase
        .from('bookings')
        .select('*')
        .eq('driver_id', profile.id)
        .eq('status', 'completed')
        .gte('end_at', thirtyDaysAgo)
        .order('end_at', { ascending: false })

      setBookings(bkgs || [])

      // Get this month's payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('received_by', profile.full_name)

      const monthlyTotal = (payments || [])
        .filter((p) => isThisMonthDate(p.received_at))
        .reduce((sum, p) => sum + p.amount, 0)

      setMonthlyCommission(monthlyTotal)
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <DriverLayout><div className="text-center py-12">Carregando...</div></DriverLayout>

  return (
    <DriverLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-ink">Histórico</h1>

        <Card className="bg-green bg-opacity-10 border-green">
          <p className="text-sm text-ink2 mb-1">Comissão Este Mês</p>
          <p className="text-3xl font-bold text-green">{formatCurrency(monthlyCommission)}</p>
        </Card>

        {bookings.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Sem Tours Completos"
            description="Nenhum tour completo nos últimos 30 dias"
          />
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-ink">Tours Completos ({bookings.length})</h2>
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <h3 className="text-lg font-bold text-ink mb-1">{booking.customer_name}</h3>
                <p className="text-sm text-ink2 mb-1">{booking.tour_type}</p>
                <p className="text-sm text-ink2 mb-2">{formatDate(booking.end_at)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-btn bg-green bg-opacity-10 text-green">
                    Completo
                  </span>
                  <p className="font-bold text-ink">€{booking.price.toFixed(2)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DriverLayout>
  )
}
