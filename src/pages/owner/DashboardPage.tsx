import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { StatCard } from '../../components/StatCard'
import { formatCurrency, formatDate, isTodayDate, isThisWeekDate, isThisMonthDate } from '../../lib/format'
import { Payment, Booking } from '../../lib/types'
import { TrendingUp } from 'lucide-react'

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
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return

      try {
        // Get all payments for the company
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('company_id', profile.company_id)

        // Get all bookings for today
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('company_id', profile.company_id)

        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        // Calculate stats
        let todayRevenue = 0
        let weekRevenue = 0
        let monthRevenue = 0
        const driverRevenue: Record<string, { name: string; amount: number }> = {}
        const tuktukRevenue: Record<string, { nickname: string; amount: number }> = {}

        // Group by day for chart
        const dailyRevenue: Record<string, number> = {}

        payments?.forEach((p) => {
          const paymentDate = new Date(p.received_at)
          const day = paymentDate.toISOString().split('T')[0]

          if (!dailyRevenue[day]) dailyRevenue[day] = 0
          dailyRevenue[day] += p.amount

          if (isTodayDate(paymentDate)) todayRevenue += p.amount
          if (paymentDate >= weekAgo) weekRevenue += p.amount
          if (paymentDate >= monthStart) monthRevenue += p.amount

          // Track by driver
          if (!driverRevenue[p.received_by]) {
            driverRevenue[p.received_by] = { name: p.received_by, amount: 0 }
          }
          driverRevenue[p.received_by].amount += p.amount
        })

        // Find top driver
        let topDriver = { name: '-', revenue: 0 }
        Object.values(driverRevenue).forEach((d) => {
          if (d.amount > topDriver.revenue) topDriver = { name: d.name, revenue: d.amount }
        })

        // Count today's tours (non-cancelled bookings)
        const todayTours = bookings?.filter((b) => isTodayDate(b.start_at) && b.status !== 'cancelled').length || 0

        // Find top tuktuk by matching bookings with payments
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

        // Get tuktuk nickname
        if (topTuktuk.nickname !== '-') {
          const { data: tk } = await supabase
            .from('tuktuks')
            .select('nickname')
            .eq('id', topTuktuk.nickname)
            .single()
          if (tk) topTuktuk.nickname = tk.nickname
        }

        setStats({
          todayRevenue,
          weekRevenue,
          monthRevenue,
          todayTours,
          topDriver,
          topTuktuk,
        })

        // Build chart data (last 7 days)
        const chartDays = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dayStr = d.toISOString().split('T')[0]
          chartDays.push({
            date: dayStr,
            amount: dailyRevenue[dayStr] || 0,
          })
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

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  const maxRevenue = Math.max(...chartData.map((d) => d.amount), 1)

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-ink">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Receita Hoje" value={formatCurrency(stats.todayRevenue)} icon="📊" />
          <StatCard label="Receita Semana" value={formatCurrency(stats.weekRevenue)} icon="📈" />
          <StatCard label="Receita Mês" value={formatCurrency(stats.monthRevenue)} icon="💰" />
          <StatCard label="Tours Hoje" value={stats.todayTours} icon="🛺" />
          <StatCard label="Top Motorista (semana)" value={stats.topDriver.name} icon="👤" />
          <StatCard label="Top TukTuk" value={stats.topTuktuk.nickname} icon="🏆" />
        </div>

        <div className="bg-card border border-line rounded-2xl p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Receita Últimos 7 Dias</h2>
          <div className="flex items-end gap-2 h-40">
            {chartData.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-yellow rounded-t-lg" style={{ height: `${(day.amount / maxRevenue) * 160}px` }} />
                <p className="text-xs text-ink2 mt-2">{day.date.split('-')[2]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OwnerLayout>
  )
}
