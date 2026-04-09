import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Card } from '../../components/Card'
import { Booking, Shift, DriverStatus, StreetSale } from '../../lib/types'
import { formatCurrency } from '../../lib/format'
import { Play, ShoppingBag, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'

export const TodayPage: React.FC = () => {
  const { user, profile, updateMyStatus } = useAuth()
  const [shift, setShift] = useState<Shift | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [streetSales, setStreetSales] = useState<StreetSale[]>([])
  const [weekRevenue, setWeekRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusSaving, setStatusSaving] = useState(false)

  const status: DriverStatus = profile?.status || 'offline'

  const fetchTodayData = async () => {
    if (!user) return
    setLoading(true)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 6)

    const [shiftRes, bookingsRes, todaySalesRes, weekSalesRes] = await Promise.all([
      supabase
        .from('shifts')
        .select('*')
        .eq('driver_id', user.id)
        .gte('started_at', today.toISOString())
        .lt('started_at', tomorrow.toISOString())
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('bookings')
        .select('*')
        .eq('driver_id', user.id)
        .gte('start_at', today.toISOString())
        .lt('start_at', tomorrow.toISOString())
        .neq('status', 'cancelled'),
      supabase
        .from('street_sales')
        .select('*')
        .eq('driver_id', user.id)
        .gte('sold_at', today.toISOString())
        .lt('sold_at', tomorrow.toISOString()),
      supabase
        .from('street_sales')
        .select('price, tip_amount')
        .eq('driver_id', user.id)
        .gte('sold_at', weekAgo.toISOString()),
    ])

    setShift(shiftRes.data || null)
    setBookings(bookingsRes.data || [])
    setStreetSales(todaySalesRes.data || [])
    setWeekRevenue(
      ((weekSalesRes.data || []) as any[]).reduce(
        (sum: number, s: any) => sum + (s.price || 0) + (s.tip_amount || 0),
        0
      )
    )
    setLoading(false)
  }

  useEffect(() => {
    fetchTodayData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleStatusChange = async (newStatus: DriverStatus) => {
    setStatusSaving(true)
    await updateMyStatus(newStatus)
    setStatusSaving(false)
  }

  const todayRevenue =
    bookings.reduce((sum, b) => sum + (b.price || 0), 0) +
    streetSales.reduce((sum, s) => sum + (s.price || 0), 0)

  const todayTips =
    bookings.reduce((sum, b) => sum + (b.tip_amount || 0), 0) +
    streetSales.reduce((sum, s) => sum + (s.tip_amount || 0), 0)

  const todayTours = bookings.length + streetSales.length

  const activeTour = bookings.find((b) => b.status === 'in_progress')

  type ActivityItem = { kind: 'booking' | 'sale'; label: string; time: string; amount: number }

  const recentActivity: ActivityItem[] = [
    ...bookings
      .filter((b) => b.status === 'completed')
      .map((b) => ({
        kind: 'booking' as const,
        label: b.customer_name || b.tour_type || 'Tour',
        time: b.end_at || b.start_at || '',
        amount: (b.price || 0) + (b.tip_amount || 0),
      })),
    ...streetSales.map((s) => ({
      kind: 'sale' as const,
      label: s.tour_name || 'Venda na rua',
      time: s.sold_at || '',
      amount: (s.price || 0) + (s.tip_amount || 0),
    })),
  ]
    .filter((a) => a.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8)

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

  const upcomingBookings = bookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'in_progress'
  )

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
        </div>
      </DriverLayout>
    )
  }

  return (
    <DriverLayout>
      <div className="space-y-4 pb-6">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Olá, {profile?.full_name?.split(' ')[0] || 'Motorista'} 👋
          </h1>
          <p className="text-sm text-gray-500 capitalize">
            {new Date().toLocaleDateString('pt-PT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        {/* Daily summary */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Receita</p>
            <p className="text-base font-bold text-gray-900">{formatCurrency(todayRevenue)}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Gorjetas</p>
            <p className="text-base font-bold text-yellow-600">{formatCurrency(todayTips)}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Tours</p>
            <p className="text-base font-bold text-gray-900">{todayTours}</p>
          </Card>
        </div>

        {/* Active tour */}
        {activeTour && (
          <Card className="p-4 bg-green-50 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800">Tour em curso</p>
                <p className="text-sm text-green-700 truncate">
                  {activeTour.customer_name || activeTour.tour_type || 'Tour ativo'}
                </p>
              </div>
              <StatusBadge status={activeTour.status} />
            </div>
          </Card>
        )}

        {/* Status + Street sale */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Estado
            </p>
            <div className="space-y-2">
              {(['available', 'busy', 'offline'] as DriverStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={statusSaving}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    status === s
                      ? s === 'available'
                        ? 'bg-green-100 text-green-800'
                        : s === 'busy'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-200 text-gray-700'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {s === 'available'
                    ? '🟢 Disponível'
                    : s === 'busy'
                    ? '🟡 Ocupado'
                    : '⚫ Offline'}
                </button>
              ))}
            </div>
          </Card>

          <Link to="/driver/street-sale" className="block">
            <Card className="p-4 bg-yellow-400 border-yellow-400 h-full flex flex-col items-center justify-center text-center hover:bg-yellow-500 transition-colors cursor-pointer">
              <ShoppingBag className="h-9 w-9 text-yellow-900 mb-2" />
              <p className="font-bold text-yellow-900">Vendi na rua</p>
              <p className="text-xs text-yellow-800 mt-1">Registar venda</p>
            </Card>
          </Link>
        </div>

        {/* Week metric */}
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Receita semana (vendas na rua)</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(weekRevenue)}</p>
          </div>
        </Card>

        {/* Recent activity */}
        {recentActivity.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Atividade de hoje</h2>
            <div className="space-y-2">
              {recentActivity.map((item, i) => (
                <Card key={i} className="p-3 flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.kind === 'sale' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}
                  >
                    {item.kind === 'sale' ? (
                      <ShoppingBag className="h-4 w-4 text-yellow-700" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
                    <p className="text-xs text-gray-500">{fmtTime(item.time)}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                    {formatCurrency(item.amount)}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming bookings */}
        {upcomingBookings.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Tours agendados</h2>
            <div className="space-y-2">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id} className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Play className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {booking.customer_name || booking.tour_type || 'Tour'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.start_at ? fmtTime(booking.start_at) : ''}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DriverLayout>
  )
}
