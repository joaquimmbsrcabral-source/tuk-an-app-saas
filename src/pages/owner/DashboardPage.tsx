import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { StatCard } from '../../components/StatCard'
import { formatCurrency, isTodayDate } from '../../lib/format'
import { Payment, Booking, Profile } from '../../lib/types'
import { StatusBadge } from '../../components/StatusBadge'
import { BarChart3, TrendingUp, Wallet, Car, UserCheck, Trophy } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#f59e0b', '#b45309', '#d97706', '#92400e', '#fbbf24']

export const DashboardPage: React.FC = () => {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    todayTours: 0,
    topDriver: { name: '', revenue: 0 },
    topTuktuk: { nickname: '', revenue: 0 },
  })
  const [chartData, setChartData] = useState<{ date: string; label: string; bookings: number; street: number; total: number }[]>([])
  const [bookingStats, setBookingStats] = useState({
    totalWidget: 0,
    confirmed: 0,
    cancelled: 0,
    pending: 0,
    conversionRate: 0,
    avgValue: 0,
    sourceBreakdown: [] as { name: string; value: number }[],
  })
  const [loading, setLoading] = useState(true)
  const [liveDrivers, setLiveDrivers] = useState<Profile[]>([])

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('role', 'driver')
      if (!cancelled && data) setLiveDrivers(data as Profile[])
    }
    load()
    const channel = supabase
      .channel('drivers-presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `company_id=eq.${profile.company_id}` }, () => load())
      .subscribe()
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [profile])

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return
      try {
        const [paymentsRes, bookingsRes, streetSalesRes, tukTuksRes] = await Promise.all([
          supabase.from('payments').select('*').eq('company_id', profile.company_id),
          supabase.from('bookings').select('*').eq('company_id', profile.company_id),
          supabase.from('street_sales').select('*').eq('company_id', profile.company_id),
          supabase.from('tuktuks').select('id, nickname').eq('company_id', profile.company_id),
        ])

        const payments = paymentsRes.data || []
        const bookings = bookingsRes.data || []
        const streetSales = streetSalesRes.data || []
        const tuktuks = tukTuksRes.data || []
        const tuktukMap: Record<string, string> = {}
        tuktuks.forEach(t => { tuktukMap[t.id] = t.nickname })

        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        let todayRevenue = 0
        let weekRevenue = 0
        let monthRevenue = 0
        const driverRevenue: Record<string, number> = {}
        const tuktukRevenue: Record<string, number> = {}
        const dailyBookingRevenue: Record<string, number> = {}
        const dailyStreetRevenue: Record<string, number> = {}

        payments.forEach((p: any) => {
          const paymentDate = new Date(p.received_at)
          const day = paymentDate.toISOString().split('T')[0]
          if (!dailyBookingRevenue[day]) dailyBookingRevenue[day] = 0
          dailyBookingRevenue[day] += p.amount
          if (isTodayDate(paymentDate)) todayRevenue += p.amount
          if (paymentDate >= weekAgo) weekRevenue += p.amount
          if (paymentDate >= monthStart) monthRevenue += p.amount
          if (p.received_by) {
            driverRevenue[p.received_by] = (driverRevenue[p.received_by] || 0) + p.amount
          }
        })

        streetSales.forEach((s: any) => {
          const saleDate = new Date(s.created_at)
          const day = saleDate.toISOString().split('T')[0]
          if (!dailyStreetRevenue[day]) dailyStreetRevenue[day] = 0
          dailyStreetRevenue[day] += (s.price || 0)
          if (isTodayDate(saleDate)) todayRevenue += (s.price || 0)
          if (saleDate >= weekAgo) weekRevenue += (s.price || 0)
          if (saleDate >= monthStart) monthRevenue += (s.price || 0)
          if (s.driver_id) {
            driverRevenue[s.driver_id] = (driverRevenue[s.driver_id] || 0) + (s.price || 0)
          }
          if (s.tuktuk_id) {
            tuktukRevenue[s.tuktuk_id] = (tuktukRevenue[s.tuktuk_id] || 0) + (s.price || 0)
          }
        })

        bookings.forEach((b: any) => {
          const bookingPayments = payments.filter((p: any) => p.booking_id === b.id)
          const bookingTotal = bookingPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
          if (b.tuktuk_id) {
            tuktukRevenue[b.tuktuk_id] = (tuktukRevenue[b.tuktuk_id] || 0) + bookingTotal
          }
        })

        let topDriver = { name: '-', revenue: 0 }
        let topDriverId = ''
        Object.entries(driverRevenue).forEach(([id, amount]) => {
          if (amount > topDriver.revenue) {
            topDriver = { name: id, revenue: amount }
            topDriverId = id
          }
        })
        if (topDriverId) {
          const { data: driverProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', topDriverId)
            .single()
          if (driverProfile?.full_name) topDriver.name = driverProfile.full_name
        }

        let topTuktuk = { nickname: '-', revenue: 0 }
        Object.entries(tuktukRevenue).forEach(([id, amount]) => {
          if (amount > topTuktuk.revenue) {
            topTuktuk = { nickname: tuktukMap[id] || id, revenue: amount }
          }
        })

        const todayTours = bookings.filter((b: any) => isTodayDate(b.start_at) && b.status !== 'cancelled').length
        setStats({ todayRevenue, weekRevenue, monthRevenue, todayTours, topDriver, topTuktuk })

        const chartDays = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dayStr = d.toISOString().split('T')[0]
          const label = d.toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3)
          const bRev = dailyBookingRevenue[dayStr] || 0
          const sRev = dailyStreetRevenue[dayStr] || 0
          chartDays.push({ date: dayStr, label, bookings: bRev, street: sRev, total: bRev + sRev })
        }
        setChartData(chartDays)

        const monthBookings = bookings.filter((b: any) => new Date(b.created_at) >= monthStart)
        const widgetBookings = monthBookings.filter((b: any) => b.source === 'widget' || b.source === 'online')
        const confirmedBookings = monthBookings.filter((b: any) => b.status === 'confirmed' || b.status === 'completed')
        const cancelledBookings = monthBookings.filter((b: any) => b.status === 'cancelled')
        const pendingBookings = monthBookings.filter((b: any) => b.status === 'pending')
        const totalPaid = payments.filter((p: any) => new Date(p.received_at) >= monthStart).reduce((s: number, p: any) => s + p.amount, 0)
        const avgValue = confirmedBookings.length > 0 ? totalPaid / confirmedBookings.length : 0

        const sourceCounts: Record<string, number> = {}
        monthBookings.forEach((b: any) => {
          const src = b.source || 'manual'
          sourceCounts[src] = (sourceCounts[src] || 0) + 1
        })
        const sourceBreakdown = Object.entries(sourceCounts).map(([name, value]) => ({
          name: name === 'widget' ? 'Website' : name === 'manual' ? 'Manual' : name === 'street' ? 'Rua' : name === 'online' ? 'Online' : name,
          value,
        }))

        setBookingStats({
          totalWidget: widgetBookings.length,
          confirmed: confirmedBookings.length,
          cancelled: cancelledBookings.length,
          pending: pendingBookings.length,
          conversionRate: monthBookings.length > 0 ? (confirmedBookings.length / monthBookings.length) * 100 : 0,
          avgValue,
          sourceBreakdown,
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [profile])

  if (loading) {
    return (
      <OwnerLayout>
        <div className="space-y-6">
          <div className="skeleton h-8 w-48 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </OwnerLayout>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 shadow-lg">
          <p className="font-bold mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>
              {p.name === 'bookings' ? 'Reservas' : 'Rua'}: {formatCurrency(p.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const totalBookings = bookingStats.confirmed + bookingStats.pending + bookingStats.cancelled

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-ink">Dashboard</h1>
            <p className="text-sm text-ink2 mt-0.5">Visão geral do negócio</p>
          </div>
          <div className="text-xs text-ink2 bg-card border border-line px-3 py-1.5 rounded-lg shadow-card">
            {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Receita Hoje" value={formatCurrency(stats.todayRevenue)} icon={<BarChart3 size={18} />} accent="yellow" />
          <StatCard label="Receita Semana" value={formatCurrency(stats.weekRevenue)} icon={<TrendingUp size={18} />} accent="green" />
          <StatCard label="Receita Mês" value={formatCurrency(stats.monthRevenue)} icon={<Wallet size={18} />} accent="yellow" />
          <StatCard label="Tours Hoje" value={stats.todayTours} icon={<Car size={18} />} accent="ink" />
          <StatCard
            label="Top Motorista"
            value={stats.topDriver.name}
            icon={<UserCheck size={18} />}
            accent="copper"
            sublabel={stats.topDriver.revenue > 0 ? formatCurrency(stats.topDriver.revenue) : 'esta semana'}
          />
          <StatCard
            label="Top TukTuk"
            value={stats.topTuktuk.nickname}
            icon={<Trophy size={18} />}
            accent="yellow"
            sublabel={stats.topTuktuk.revenue > 0 ? formatCurrency(stats.topTuktuk.revenue) : ''}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Receita — últimos 7 dias</h2>
              <span className="text-xs font-bold text-ink">{formatCurrency(stats.weekRevenue)}</span>
            </div>
            <div className="px-2 pb-4 pt-4" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="bookings" stackId="revenue" fill="#f59e0b" radius={[0, 0, 0, 0]} name="bookings" />
                  <Bar dataKey="street" stackId="revenue" fill="#d97706" radius={[4, 4, 0, 0]} name="street" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="px-5 pb-3 flex items-center gap-4 text-[10px] text-ink2">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" /> Reservas</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#d97706]" /> Vendas na rua</span>
            </div>
          </div>

          <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Motoristas</h2>
              <span className="flex items-center gap-1.5 text-xs text-green font-medium">
                <span className="w-2 h-2 rounded-full bg-green pulse-dot" />
                tempo real
              </span>
            </div>
            {liveDrivers.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-ink2">Convida motoristas na página Motoristas.</p>
              </div>
            ) : (
              <div className="divide-y divide-line max-h-[220px] overflow-y-auto">
                {liveDrivers.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow flex items-center justify-center text-ink font-black text-sm flex-shrink-0">
                        {(d.full_name || 'M').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink leading-none">{d.full_name || '—'}</div>
                        {d.phone && <div className="text-xs text-ink2 mt-0.5">{d.phone}</div>}
                      </div>
                    </div>
                    <StatusBadge status={d.status || 'offline'} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <h2 className="text-sm font-bold text-ink">Métricas de Reservas — este mês</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-ink">{totalBookings}</div>
                  <div className="text-xs text-ink2 mt-1">Total Reservas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-green">{bookingStats.confirmed}</div>
                  <div className="text-xs text-ink2 mt-1">Confirmadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-ink">{bookingStats.conversionRate.toFixed(0)}%</div>
                  <div className="text-xs text-ink2 mt-1">Taxa Conversão</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-ink">{formatCurrency(bookingStats.avgValue)}</div>
                  <div className="text-xs text-ink2 mt-1">Valor Médio</div>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink2">Confirmadas</span>
                    <span className="font-medium text-green">{bookingStats.confirmed}</span>
                  </div>
                  <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                    <div className="h-full bg-green rounded-full transition-all" style={{ width: `${totalBookings > 0 ? (bookingStats.confirmed / totalBookings) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink2">Pendentes</span>
                    <span className="font-medium text-yellow-600">{bookingStats.pending}</span>
                  </div>
                  <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                    <div className="h-full bg-yellow rounded-full transition-all" style={{ width: `${totalBookings > 0 ? (bookingStats.pending / totalBookings) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink2">Canceladas</span>
                    <span className="font-medium text-red-500">{bookingStats.cancelled}</span>
                  </div>
                  <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${totalBookings > 0 ? (bookingStats.cancelled / totalBookings) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <h2 className="text-sm font-bold text-ink">Origem das Reservas</h2>
            </div>
            <div className="p-4" style={{ height: 220 }}>
              {bookingStats.sourceBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStats.sourceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {bookingStats.sourceBreakdown.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Reservas']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-ink2">
                  Sem dados este mês
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  )
}
