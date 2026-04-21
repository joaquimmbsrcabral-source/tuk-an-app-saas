import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { StatCard } from '../../components/StatCard'
import { formatCurrency, isTodayDate } from '../../lib/format'
import { Payment, Booking, Profile, StreetSale } from '../../lib/types'
import { StatusBadge } from '../../components/StatusBadge'
import { OnboardingWizard } from '../../components/OnboardingWizard'

export const DashboardPage: React.FC = () => {
  const { profile } = useAuth()
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)
  const [stats, setStats] = useState({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    todayTours: 0,
    topDriver: { name: '', revenue: 0 },
    topTuktuk: { nickname: '', revenue: 0 },
  })
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [liveDrivers, setLiveDrivers] = useState<Profile[]>([])

  // Check if this owner needs onboarding (no tuktuks yet)
  useEffect(() => {
    if (!profile) return
    const check = async () => {
      const { count } = await supabase
        .from('tuktuks')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
      setNeedsOnboarding(count === 0)
    }
    check()
  }, [profile])

  // Only show skeleton if loading takes more than 300ms — avoids flash when data is cached
  useEffect(() => {
    if (!loading) {
      setShowSkeleton(false)
      return
    }
    const timer = setTimeout(() => setShowSkeleton(true), 300)
    return () => clearTimeout(timer)
  }, [loading])

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
        const [{ data: payments }, { data: bookings }, { data: streetSales }] = await Promise.all([
          supabase.from('payments').select('*').eq('company_id', profile.company_id),
          supabase.from('bookings').select('*').eq('company_id', profile.company_id),
          supabase.from('street_sales').select('*').eq('company_id', profile.company_id),
        ])

        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        let todayRevenue = 0
        let weekRevenue = 0
        let monthRevenue = 0
        const driverRevenue: Record<string, { name: string; amount: number }> = {}
        const tuktukRevenue: Record<string, { nickname: string; amount: number }> = {}
        const dailyRevenue: Record<string, number> = {}

        payments?.forEach((p) => {
          const paymentDate = new Date(p.received_at)
          const day = paymentDate.toISOString().split('T')[0]
          if (!dailyRevenue[day]) dailyRevenue[day] = 0
          dailyRevenue[day] += p.amount
          if (isTodayDate(paymentDate)) todayRevenue += p.amount
          if (paymentDate >= weekAgo) weekRevenue += p.amount
          if (paymentDate >= monthStart) monthRevenue += p.amount
          if (!driverRevenue[p.received_by]) {
            driverRevenue[p.received_by] = { name: p.received_by, amount: 0 }
          }
          driverRevenue[p.received_by].amount += p.amount
        })

        // Include street sales in revenue
        streetSales?.forEach((s: StreetSale) => {
          const saleDate = new Date(s.sold_at)
          const day = saleDate.toISOString().split('T')[0]
          if (!dailyRevenue[day]) dailyRevenue[day] = 0
          dailyRevenue[day] += Number(s.price)
          if (isTodayDate(saleDate)) todayRevenue += Number(s.price)
          if (saleDate >= weekAgo) weekRevenue += Number(s.price)
          if (saleDate >= monthStart) monthRevenue += Number(s.price)
          if (!driverRevenue[s.driver_id]) {
            driverRevenue[s.driver_id] = { name: s.driver_id, amount: 0 }
          }
          driverRevenue[s.driver_id].amount += Number(s.price)
        })

        let topDriver = { name: '-', revenue: 0 }
        let topDriverId = ''
        Object.entries(driverRevenue).forEach(([id, d]) => {
          if (d.amount > topDriver.revenue) {
            topDriver = { name: d.name, revenue: d.amount }
            topDriverId = id
          }
        })

        // Resolve driver UUID to full_name
        if (topDriverId) {
          const { data: driverProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', topDriverId)
            .single()
          if (driverProfile?.full_name) topDriver.name = driverProfile.full_name
        }

        const todayBookings = bookings?.filter((b) => isTodayDate(b.start_at) && b.status !== 'cancelled').length || 0
        const todayStreetSales = streetSales?.filter((s: StreetSale) => isTodayDate(s.sold_at)).length || 0
        const todayTours = todayBookings + todayStreetSales

        bookings?.forEach((b) => {
          const bookingPayments = payments?.filter((p) => p.booking_id === b.id) || []
          const bookingTotal = bookingPayments.reduce((sum, p) => sum + p.amount, 0)
          if (!tuktukRevenue[b.tuktuk_id]) {
            tuktukRevenue[b.tuktuk_id] = { nickname: b.id, amount: 0 }
          }
          tuktukRevenue[b.tuktuk_id].amount += bookingTotal
        })

        let topTuktuk = { nickname: '-', revenue: 0 }
        Object.values(tuktukRevenue).forEach((t) => {
          if (t.amount > topTuktuk.revenue) topTuktuk = { nickname: t.nickname, revenue: t.amount }
        })

        if (topTuktuk.nickname !== '-') {
          const { data: tk } = await supabase
            .from('tuktuks')
            .select('nickname')
            .eq('id', topTuktuk.nickname)
            .single()
          if (tk) topTuktuk.nickname = tk.nickname
        }

        setStats({ todayRevenue, weekRevenue, monthRevenue, todayTours, topDriver, topTuktuk })

        const chartDays = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dayStr = d.toISOString().split('T')[0]
          chartDays.push({ date: dayStr, amount: dailyRevenue[dayStr] || 0 })
        }
        setChartData(chartDays)
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [profile])

  const maxRevenue = Math.max(...chartData.map((d) => d.amount), 1)

  const dayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3)
  }

  if (loading && showSkeleton) {
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

  if (loading) {
    return <OwnerLayout><div /></OwnerLayout>
  }

  if (needsOnboarding) {
    return (
      <OwnerLayout>
        <OnboardingWizard onComplete={() => {
          setNeedsOnboarding(false)
          setLoading(true)
          // Re-fetch stats after onboarding
          window.location.reload()
        }} />
      </OwnerLayout>
    )
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-ink">Dashboard</h1>
            <p className="text-sm text-ink2 mt-0.5">Visão geral do negócio</p>
          </div>
          <div className="text-xs text-ink2 bg-card border border-line px-3 py-1.5 rounded-lg shadow-card">
            {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Receita Hoje" value={formatCurrency(stats.todayRevenue)} icon="📊" accent="yellow" />
          <StatCard label="Receita Semana" value={formatCurrency(stats.weekRevenue)} icon="📈" accent="green" />
          <StatCard label="Receita Mês" value={formatCurrency(stats.monthRevenue)} icon="💰" accent="yellow" />
          <StatCard label="Tours Hoje" value={stats.todayTours} icon="🛺" accent="ink" />
          <StatCard label="Top Motorista" value={stats.topDriver.name} icon="👤" accent="copper" sublabel="esta semana" />
          <StatCard label="Top TukTuk" value={stats.topTuktuk.nickname} icon="🏆" accent="yellow" />
        </div>

        {/* Drivers + Chart row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Motoristas Live */}
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
              <div className="divide-y divide-line">
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

          {/* Revenue Chart */}
          <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Receita — últimos 7 dias</h2>
              <span className="text-xs font-bold text-ink">{formatCurrency(stats.weekRevenue)}</span>
            </div>
            <div className="px-5 pb-5 pt-4">
              <div className="flex items-end gap-2 h-36">
                {chartData.map((day, i) => {
                  const pct = maxRevenue > 0 ? (day.amount / maxRevenue) : 0
                  const isToday = i === chartData.length - 1
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <div className="w-full flex items-end" style={{ height: 120 }}>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 relative ${
                            isToday ? 'bg-yellow' : 'bg-yellow bg-opacity-30 group-hover:bg-opacity-60'
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
                      <p className={`text-[10px] font-medium ${isToday ? 'text-ink font-bold' : 'text-ink2'}`}>
                        {dayLabel(day.date)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  )
}
