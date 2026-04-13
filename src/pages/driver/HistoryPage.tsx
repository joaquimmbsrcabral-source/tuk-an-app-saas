import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Card } from '../../components/Card'
import { EmptyState } from '../../components/EmptyState'
import { Booking, Payment, StreetSale } from '../../lib/types'
import { formatDate, formatCurrency, isThisMonthDate } from '../../lib/format'
import { subDays } from 'date-fns'
import { CheckCircle, ShoppingBag, ClipboardList } from 'lucide-react'

export const HistoryPage: React.FC = () => {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [streetSales, setStreetSales] = useState<StreetSale[]>([])
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchHistory()
    }
  }, [profile])

  const fetchHistory = async () => {
    if (!profile) return

    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

      const [bookingsRes, salesRes, paymentsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .eq('driver_id', profile.id)
          .eq('status', 'completed')
          .gte('end_at', thirtyDaysAgo)
          .order('end_at', { ascending: false }),
        supabase
          .from('street_sales')
          .select('*')
          .eq('driver_id', profile.id)
          .gte('sold_at', thirtyDaysAgo)
          .order('sold_at', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('received_by', profile.full_name),
      ])

      const bkgs = bookingsRes.data || []
      const sales = salesRes.data || []

      setBookings(bkgs)
      setStreetSales(sales)

      // Monthly total: tour payments + street sales revenue this month
      const paymentTotal = ((paymentsRes.data || []) as Payment[])
        .filter((p) => isThisMonthDate(p.received_at))
        .reduce((sum, p) => sum + p.amount, 0)

      const salesTotal = (sales as StreetSale[])
        .filter((s) => isThisMonthDate(s.sold_at))
        .reduce((sum, s) => sum + (s.price || 0) + (s.tip_amount || 0), 0)

      setMonthlyTotal(paymentTotal + salesTotal)
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  // Unified list sorted by most recent first
  type HistoryItem =
    | { kind: 'booking'; data: Booking; sortTime: string }
    | { kind: 'sale'; data: StreetSale; sortTime: string }

  const allActivity: HistoryItem[] = [
    ...bookings.map((b) => ({
      kind: 'booking' as const,
      data: b,
      sortTime: b.end_at || b.start_at || '',
    })),
    ...streetSales.map((s) => ({
      kind: 'sale' as const,
      data: s,
      sortTime: s.sold_at || '',
    })),
  ]
    .filter((a) => a.sortTime)
    .sort((a, b) => new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime())

  if (loading)
    return (
      <DriverLayout>
        <div className="text-center py-12">Carregando...</div>
      </DriverLayout>
    )

  return (
    <DriverLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-ink">Histórico</h1>

        <Card className="bg-green bg-opacity-10 border-green">
          <p className="text-sm text-ink2 mb-1">Receita Este Mês</p>
          <p className="text-3xl font-bold text-green">{formatCurrency(monthlyTotal)}</p>
          <p className="text-xs text-ink2 mt-1">Tours + vendas na rua</p>
        </Card>

        {allActivity.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={24} />}
            title="Sem Atividade"
            description="Nenhuma atividade nos últimos 30 dias"
          />
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-ink">
              Últimos 30 dias ({allActivity.length})
            </h2>
            {allActivity.map((item) => {
              if (item.kind === 'booking') {
                const b = item.data
                return (
                  <Card key={'b-' + b.id}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-ink">{b.customer_name}</h3>
                        <p className="text-sm text-ink2">{b.tour_type}</p>
                        <p className="text-sm text-ink2">{formatDate(b.end_at)}</p>
                        <span className="inline-block text-xs px-2 py-0.5 rounded-btn bg-green bg-opacity-10 text-green mt-1">
                          Tour completo
                        </span>
                      </div>
                      <p className="font-bold text-ink flex-shrink-0">
                        {formatCurrency(b.price || 0)}
                      </p>
                    </div>
                  </Card>
                )
              } else {
                const s = item.data
                return (
                  <Card key={'s-' + s.id}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ShoppingBag className="h-4 w-4 text-yellow-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-ink">{s.tour_name || 'Venda na rua'}</h3>
                        {s.pax ? <p className="text-sm text-ink2">{s.pax} pax</p> : null}
                        <p className="text-sm text-ink2">{formatDate(s.sold_at)}</p>
                        <span className="inline-block text-xs px-2 py-0.5 rounded-btn bg-yellow-100 text-yellow-800 mt-1">
                          Venda na rua
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-ink">
                          {formatCurrency((s.price || 0) + (s.tip_amount || 0))}
                        </p>
                        {s.tip_amount > 0 && (
                          <p className="text-xs text-ink2">+{formatCurrency(s.tip_amount)} gorj.</p>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              }
            })}
          </div>
        )}
      </div>
    </DriverLayout>
  )
}
