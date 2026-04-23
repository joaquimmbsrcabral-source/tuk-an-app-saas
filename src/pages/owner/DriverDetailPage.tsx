import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { StatCard } from '../../components/StatCard'
import { StatusBadge } from '../../components/StatusBadge'
import { Button } from '../../components/Button'
import { Profile, Booking, StreetSale, Payment, Shift } from '../../lib/types'
import { formatCurrency, formatDate, formatDateShort } from '../../lib/format'
import {
  ArrowLeft,
  Phone,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Star,
  MapPin,
} from 'lucide-react'
import {
  isToday,
  isThisWeek,
  isThisMonth,
  parseISO,
  subDays,
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns'
import { pt as ptPT } from 'date-fns/locale'

type ActivityItem = {
  id: string
  type: 'booking' | 'street_sale'
  tourName: string
  price: number
  tip: number
  pax: number
  date: string
  status?: string
}

export const DriverDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile: ownerProfile } = useAuth()

  const [driver, setDriver] = useState<Profile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [streetSales, setStreetSales] = useState<StreetSale[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ownerProfile && id) fetchAll()
  }, [ownerProfile, id])

  const fetchAll = async () => {
    if (!ownerProfile || !id) return
    try {
      const [driverRes, bookingsRes, salesRes, paymentsRes, shiftsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase
          .from('bookings')
          .select('*')
          .eq('company_id', ownerProfile.company_id)
          .eq('driver_id', id)
          .order('start_at', { ascending: false }),
        supabase
          .from('street_sales')
          .select('*')
          .eq('company_id', ownerProfile.company_id)
          .eq('driver_id', id)
          .order('sold_at', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('company_id', ownerProfile.company_id)
          .eq('received_by', id)
          .order('received_at', { ascending: false }),
        supabase
          .from('shifts')
          .select('*')
          .eq('company_id', ownerProfile.company_id)
          .eq('driver_id', id)
          .order('shift_date', { ascending: false })
          .limit(30),
      ])

      setDriver(driverRes.data)
      setBookings(bookingsRes.data || [])
      setStreetSales(salesRes.data || [])
      setPayments(paymentsRes.data || [])
      setShifts(shiftsRes.data || [])
    } catch (err) {
      console.error('Error fetching driver details:', err)
    } finally {
      setLoading(false)
    }
  }

  /* ── Stats ── */
  const stats = useMemo(() => {
    const allRevenue = [
      ...bookings
        .filter((b) => b.status === 'completed')
        .map((b) => ({ price: b.price, tip: b.tip_amount, date: b.start_at })),
      ...streetSales.map((s) => ({ price: s.price, tip: s.tip_amount, date: s.sold_at })),
    ]

    const todayRev = allRevenue.filter((r) => isToday(parseISO(r.date))).reduce((s, r) => s + r.price, 0)
    const weekRev = allRevenue.filter((r) => isThisWeek(parseISO(r.date), { weekStartsOn: 1 })).reduce((s, r) => s + r.price, 0)
    const monthRev = allRevenue.filter((r) => isThisMonth(parseISO(r.date))).reduce((s, r) => s + r.price, 0)
    const totalRev = allRevenue.reduce((s, r) => s + r.price, 0)
    const totalTips = allRevenue.reduce((s, r) => s + r.tip, 0)
    const totalPax = [
      ...bookings.filter((b) => b.status === 'completed').map((b) => b.pax),
      ...streetSales.map((s) => s.pax),
    ].reduce((s, p) => s + p, 0)

    const totalTours = bookings.filter((b) => b.status === 'completed').length + streetSales.length
    const avgPerTour = totalTours > 0 ? totalRev / totalTours : 0

    const commissionPct = driver?.commission_pct || 0
    const monthCommission = monthRev * (commissionPct / 100)

    // Work days this month
    const workDaysThisMonth = new Set<string>()
    bookings
      .filter((b) => b.status === 'completed' && isThisMonth(parseISO(b.start_at)))
      .forEach((b) => workDaysThisMonth.add(format(parseISO(b.start_at), 'yyyy-MM-dd')))
    streetSales
      .filter((s) => isThisMonth(parseISO(s.sold_at)))
      .forEach((s) => workDaysThisMonth.add(format(parseISO(s.sold_at), 'yyyy-MM-dd')))
    shifts
      .filter((s) => isThisMonth(parseISO(s.shift_date)))
      .forEach((s) => workDaysThisMonth.add(s.shift_date))

    return {
      todayRev,
      weekRev,
      monthRev,
      totalRev,
      totalTips,
      totalPax,
      totalTours,
      avgPerTour,
      monthCommission,
      workDaysThisMonth: workDaysThisMonth.size,
    }
  }, [bookings, streetSales, shifts, driver])

  /* ── Chart data (last 7 days) ── */
  const chartData = useMemo(() => {
    const today = new Date()
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i)
      return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE', { locale: ptPT }), amount: 0 }
    })

    const allItems = [
      ...bookings
        .filter((b) => b.status === 'completed')
        .map((b) => ({ date: format(parseISO(b.start_at), 'yyyy-MM-dd'), amount: b.price })),
      ...streetSales.map((s) => ({ date: format(parseISO(s.sold_at), 'yyyy-MM-dd'), amount: s.price })),
    ]

    allItems.forEach((item) => {
      const day = days.find((d) => d.date === item.date)
      if (day) day.amount += item.amount
    })

    return days
  }, [bookings, streetSales])

  const maxChart = Math.max(...chartData.map((d) => d.amount), 1)

  /* ── Recent activity ── */
  const recentActivity = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [
      ...bookings
        .filter((b) => b.status === 'completed')
        .slice(0, 20)
        .map((b) => ({
          id: b.id,
          type: 'booking' as const,
          tourName: b.tour_type,
          price: b.price,
          tip: b.tip_amount,
          pax: b.pax,
          date: b.start_at,
          status: b.status,
        })),
      ...streetSales.slice(0, 20).map((s) => ({
        id: s.id,
        type: 'street_sale' as const,
        tourName: s.tour_name,
        price: s.price,
        tip: s.tip_amount,
        pax: s.pax,
        date: s.sold_at,
      })),
    ]
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return items.slice(0, 15)
  }, [bookings, streetSales])

  /* ── Week calendar ── */
  const weekCalendar = useMemo(() => {
    const now = new Date()
    const start = startOfWeek(now, { weekStartsOn: 1 })
    const end = endOfWeek(now, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const hasShift = shifts.some((s) => s.shift_date === dateStr)
      const dayBookings = bookings.filter(
        (b) => b.status === 'completed' && format(parseISO(b.start_at), 'yyyy-MM-dd') === dateStr
      )
      const daySales = streetSales.filter((s) => format(parseISO(s.sold_at), 'yyyy-MM-dd') === dateStr)
      const tours = dayBookings.length + daySales.length
      const revenue = dayBookings.reduce((s, b) => s + b.price, 0) + daySales.reduce((s, r) => s + r.price, 0)

      return {
        day,
        label: format(day, 'EEE', { locale: ptPT }),
        dateNum: format(day, 'd'),
        isToday: isSameDay(day, now),
        hasShift,
        tours,
        revenue,
      }
    })
  }, [shifts, bookings, streetSales])

  /* ── Loading / Not Found ── */
  if (loading) {
    return (
      <OwnerLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-line rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-card border border-line rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-card border border-line rounded-2xl animate-pulse" />
        </div>
      </OwnerLayout>
    )
  }

  if (!driver) {
    return (
      <OwnerLayout>
        <div className="text-center py-20">
          <p className="text-lg text-ink2 mb-4">Motorista não encontrado</p>
          <Button onClick={() => navigate('/motoristas')} variant="primary">
            Voltar aos Motoristas
          </Button>
        </div>
      </OwnerLayout>
    )
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/motoristas')}
            className="w-10 h-10 rounded-xl bg-card border border-line flex items-center justify-center hover:bg-cream transition-colors"
          >
            <ArrowLeft size={20} className="text-ink" />
          </button>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-full bg-yellow flex items-center justify-center text-ink font-black text-xl flex-shrink-0">
              {(driver.full_name || 'M').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-ink truncate">{driver.full_name}</h1>
                <StatusBadge status={driver.status || 'offline'} />
              </div>
              <div className="flex items-center gap-4 mt-1">
                {driver.phone && (
                  <span className="text-sm text-ink2 flex items-center gap-1">
                    <Phone size={14} /> {driver.phone}
                  </span>
                )}
                <span className="text-sm text-ink2 flex items-center gap-1">
                  <Calendar size={14} /> Desde {formatDate(driver.created_at)}
                </span>
                <span className="text-sm text-ink2 flex items-center gap-1">
                  <DollarSign size={14} /> Comissão: {driver.commission_pct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Hoje"
            value={formatCurrency(stats.todayRev)}
            icon={<TrendingUp size={18} className="text-green" />}
            accent="green"
          />
          <StatCard
            label="Esta Semana"
            value={formatCurrency(stats.weekRev)}
            icon={<TrendingUp size={18} className="text-yellow" />}
            accent="yellow"
          />
          <StatCard
            label="Este Mês"
            value={formatCurrency(stats.monthRev)}
            icon={<DollarSign size={18} className="text-ink" />}
            accent="ink"
            sublabel={`Comissão: ${formatCurrency(stats.monthCommission)}`}
          />
          <StatCard
            label="Total Acumulado"
            value={formatCurrency(stats.totalRev)}
            icon={<Star size={18} className="text-copper" />}
            accent="copper"
            sublabel={`${stats.totalTours} tours realizados`}
          />
        </div>

        {/* ── Second row stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Passageiros (Total)"
            value={stats.totalPax}
            icon={<Users size={18} className="text-ink" />}
            accent="ink"
          />
          <StatCard
            label="Média por Tour"
            value={formatCurrency(stats.avgPerTour)}
            icon={<MapPin size={18} className="text-yellow" />}
            accent="yellow"
          />
          <StatCard
            label="Gorjetas Totais"
            value={formatCurrency(stats.totalTips)}
            icon={<Star size={18} className="text-green" />}
            accent="green"
          />
          <StatCard
            label="Dias Trabalhados (Mês)"
            value={stats.workDaysThisMonth}
            icon={<Clock size={18} className="text-copper" />}
            accent="copper"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Revenue Chart (last 7 days) ── */}
          <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Receita — últimos 7 dias</h2>
              <span className="text-xs font-bold text-ink">{formatCurrency(stats.weekRev)}</span>
            </div>
            <div className="px-5 pb-5 pt-4">
              <div className="flex items-end gap-2 h-36">
                {chartData.map((day, i) => {
                  const pct = maxChart > 0 ? day.amount / maxChart : 0
                  const isLast = i === chartData.length - 1
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <div className="w-full flex items-end" style={{ height: 120 }}>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 relative ${
                            isLast
                              ? 'bg-yellow'
                              : 'bg-yellow bg-opacity-30 group-hover:bg-opacity-60'
                          }`}
                          style={{ height: `${Math.max(pct * 100, 4)}%` }}
                        >
                          {day.amount > 0 && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-ink opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {formatCurrency(day.amount)}
                            </div>
                          )}
                        </div>
                      </div>
                      <p
                        className={`text-[10px] font-medium ${
                          isLast ? 'text-ink font-bold' : 'text-ink2'
                        }`}
                      >
                        {day.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Week Calendar ── */}
          <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <h2 className="text-sm font-bold text-ink">Semana Atual</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {weekCalendar.map((d) => (
                  <div
                    key={d.dateNum}
                    className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
                      d.isToday
                        ? 'bg-yellow bg-opacity-20 border border-yellow border-opacity-40'
                        : d.hasShift || d.tours > 0
                        ? 'bg-green bg-opacity-5 border border-green border-opacity-10'
                        : 'bg-cream border border-line'
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-ink2 uppercase">{d.label}</span>
                    <span
                      className={`text-lg font-bold mt-0.5 ${
                        d.isToday ? 'text-ink' : 'text-ink2'
                      }`}
                    >
                      {d.dateNum}
                    </span>
                    {d.tours > 0 ? (
                      <>
                        <span className="text-[9px] font-bold text-green mt-1">{d.tours} tours</span>
                        <span className="text-[9px] text-ink2">{formatCurrency(d.revenue)}</span>
                      </>
                    ) : d.hasShift ? (
                      <span className="text-[9px] font-medium text-ink2 mt-1">Escalado</span>
                    ) : (
                      <span className="text-[9px] text-ink2 text-opacity-40 mt-1">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="text-sm font-bold text-ink">Actividade Recente</h2>
          </div>
          {recentActivity.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-ink2">Nenhuma actividade registada</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {recentActivity.map((item) => (
                <div key={item.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-cream transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.type === 'booking'
                          ? 'bg-yellow bg-opacity-20'
                          : 'bg-green bg-opacity-10'
                      }`}
                    >
                      <MapPin
                        size={14}
                        className={item.type === 'booking' ? 'text-yellow' : 'text-green'}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink leading-none">{item.tourName}</p>
                      <p className="text-xs text-ink2 mt-0.5">
                        {formatDate(item.date)} · {item.pax} pax
                        {item.type === 'street_sale' && (
                          <span className="ml-1 text-green font-medium">· Venda Rua</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink">{formatCurrency(item.price)}</p>
                    {item.tip > 0 && (
                      <p className="text-[10px] text-green font-medium">+{formatCurrency(item.tip)} gorjeta</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  )
}
