import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { StatCard } from '../../components/StatCard'
import { EmptyState } from '../../components/EmptyState'
import { Payment, StreetSale, Booking } from '../../lib/types'
import { formatCurrency, formatDate } from '../../lib/format'
import {
  Download,
  TrendingUp,
  DollarSign,
  Users,
  MapPin,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowUpRight,
  Filter,
  X,
} from 'lucide-react'
import {
  isToday,
  isThisWeek,
  isThisMonth,
  parseISO,
  subDays,
  format,
} from 'date-fns'
import { pt as ptPT } from 'date-fns/locale'

type Period = 'week' | 'month' | 'all'

export const FinancePage: React.FC = () => {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [streetSales, setStreetSales] = useState<StreetSale[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('month')
  const [filterDriver, setFilterDriver] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([])
  const [driverNames, setDriverNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (profile) fetchAll()
  }, [profile])

  const fetchAll = async () => {
    if (!profile) return
    try {
      const [paymentsRes, salesRes, bookingsRes, driversRes] = await Promise.all([
        supabase
          .from('payments')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('received_at', { ascending: false }),
        supabase
          .from('street_sales')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('sold_at', { ascending: false }),
        supabase
          .from('bookings')
          .select('*')
          .eq('company_id', profile.company_id)
          .eq('status', 'completed')
          .order('start_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name')
          .eq('company_id', profile.company_id)
          .eq('role', 'driver'),
      ])

      setPayments(paymentsRes.data || [])
      setStreetSales(salesRes.data || [])
      setBookings(bookingsRes.data || [])

      const list = (driversRes.data || []).map((d) => ({ id: d.id, name: d.full_name }))
      setDrivers(list)
      const names: Record<string, string> = {}
      list.forEach((d) => { names[d.id] = d.name })
      setDriverNames(names)
    } catch (err) {
      console.error('Error fetching finance data:', err)
    } finally {
      setLoading(false)
    }
  }

  /* ── Helpers ── */
  const methodLabel = (m: string) => {
    const map: Record<string, string> = {
      cash: 'Dinheiro',
      card: 'Cartão',
      mbway: 'MB Way',
      transfer: 'Transferência',
      street: 'Venda Rua',
      other: 'Outro',
    }
    return map[m] || m
  }

  const methodIcon = (m: string) => {
    switch (m) {
      case 'cash': return <Banknote size={14} className="text-green" />
      case 'card': return <CreditCard size={14} className="text-copper" />
      case 'mbway': return <Smartphone size={14} className="text-ink" />
      case 'street': return <MapPin size={14} className="text-yellow" />
      default: return <DollarSign size={14} className="text-ink2" />
    }
  }

  const methodColor = (m: string): string => {
    switch (m) {
      case 'cash': return 'bg-green'
      case 'card': return 'bg-copper'
      case 'mbway': return 'bg-ink'
      case 'street': return 'bg-yellow'
      case 'transfer': return 'bg-ink2'
      default: return 'bg-line'
    }
  }

  /* ── Unified revenue items ── */
  type RevenueItem = {
    id: string
    date: string
    amount: number
    tip: number
    pax: number
    driverId: string
    method: string
    type: 'booking' | 'street_sale' | 'payment'
    label: string
  }

  const allItems = useMemo((): RevenueItem[] => {
    const items: RevenueItem[] = [
      ...payments.map((p) => ({
        id: p.id,
        date: p.received_at,
        amount: p.amount,
        tip: 0,
        pax: 0,
        driverId: p.received_by,
        method: p.method,
        type: 'payment' as const,
        label: p.notes || methodLabel(p.method),
      })),
      ...streetSales.map((s) => ({
        id: s.id,
        date: s.sold_at,
        amount: Number(s.price),
        tip: Number(s.tip_amount || 0),
        pax: Number(s.pax),
        driverId: s.driver_id,
        method: 'street',
        type: 'street_sale' as const,
        label: s.tour_name || 'Venda de Rua',
      })),
    ]
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return items
  }, [payments, streetSales])

  /* ── Period-filtered items ── */
  const filteredItems = useMemo(() => {
    let items = allItems

    // Period filter
    if (period === 'week') {
      items = items.filter((i) => isThisWeek(parseISO(i.date), { weekStartsOn: 1 }))
    } else if (period === 'month') {
      items = items.filter((i) => isThisMonth(parseISO(i.date)))
    }

    // Driver filter
    if (filterDriver) {
      items = items.filter((i) => i.driverId === filterDriver)
    }

    // Method filter
    if (filterMethod) {
      items = items.filter((i) => i.method === filterMethod)
    }

    return items
  }, [allItems, period, filterDriver, filterMethod])

  /* ── KPI Stats ── */
  const stats = useMemo(() => {
    const todayRev = allItems
      .filter((i) => isToday(parseISO(i.date)))
      .reduce((s, i) => s + i.amount, 0)
    const weekRev = allItems
      .filter((i) => isThisWeek(parseISO(i.date), { weekStartsOn: 1 }))
      .reduce((s, i) => s + i.amount, 0)
    const monthRev = allItems
      .filter((i) => isThisMonth(parseISO(i.date)))
      .reduce((s, i) => s + i.amount, 0)

    const monthTours = bookings.filter((b) => isThisMonth(parseISO(b.start_at))).length +
      streetSales.filter((s) => isThisMonth(parseISO(s.sold_at))).length
    const monthPax = bookings
      .filter((b) => isThisMonth(parseISO(b.start_at)))
      .reduce((s, b) => s + b.pax, 0) +
      streetSales
        .filter((s) => isThisMonth(parseISO(s.sold_at)))
        .reduce((s, r) => s + Number(r.pax), 0)
    const monthTips = allItems
      .filter((i) => isThisMonth(parseISO(i.date)))
      .reduce((s, i) => s + i.tip, 0)
    const avgPerTour = monthTours > 0 ? monthRev / monthTours : 0

    // Method breakdown for month
    const methodBreakdown: Record<string, number> = {}
    allItems
      .filter((i) => isThisMonth(parseISO(i.date)))
      .forEach((i) => {
        const m = i.method || 'other'
        methodBreakdown[m] = (methodBreakdown[m] || 0) + i.amount
      })

    // Driver ranking for month
    const driverRanking: Record<string, number> = {}
    allItems
      .filter((i) => isThisMonth(parseISO(i.date)))
      .forEach((i) => {
        driverRanking[i.driverId] = (driverRanking[i.driverId] || 0) + i.amount
      })
    const topDrivers = Object.entries(driverRanking)
      .map(([id, amount]) => ({ id, name: driverNames[id] || id, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    return { todayRev, weekRev, monthRev, monthTours, monthPax, monthTips, avgPerTour, methodBreakdown, topDrivers }
  }, [allItems, bookings, streetSales, driverNames])

  /* ── Chart data (last 7 days) ── */
  const chartData = useMemo(() => {
    const today = new Date()
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i)
      return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE', { locale: ptPT }), amount: 0 }
    })

    allItems.forEach((item) => {
      const dayStr = format(parseISO(item.date), 'yyyy-MM-dd')
      const day = days.find((d) => d.date === dayStr)
      if (day) day.amount += item.amount
    })

    return days
  }, [allItems])

  const maxChart = Math.max(...chartData.map((d) => d.amount), 1)

  /* ── Filtered total ── */
  const filteredTotal = filteredItems.reduce((s, i) => s + i.amount, 0)

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Método', 'Motorista', 'Valor', 'Gorjeta', 'Descrição']
    const rows = filteredItems.map((i) => [
      formatDate(i.date),
      i.type === 'street_sale' ? 'Venda Rua' : 'Pagamento',
      methodLabel(i.method),
      driverNames[i.driverId] || i.driverId,
      formatCurrency(i.amount),
      formatCurrency(i.tip),
      i.label,
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financas-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const hasActiveFilters = filterDriver || filterMethod

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

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-ink">Finanças</h1>
            <p className="text-sm text-ink2 mt-0.5">Visão financeira do negócio</p>
          </div>
          <div className="flex items-center gap-2">
            {filteredItems.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-ink2 bg-card border border-line rounded-xl hover:bg-cream transition-colors"
              >
                <Download size={16} />
                CSV
              </button>
            )}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Receita Hoje"
            value={formatCurrency(stats.todayRev)}
            icon={<TrendingUp size={18} className="text-green" />}
            accent="green"
          />
          <StatCard
            label="Receita Semana"
            value={formatCurrency(stats.weekRev)}
            icon={<TrendingUp size={18} className="text-yellow" />}
            accent="yellow"
          />
          <StatCard
            label="Receita Mês"
            value={formatCurrency(stats.monthRev)}
            icon={<DollarSign size={18} className="text-ink" />}
            accent="ink"
            sublabel={`${stats.monthTours} tours · ${stats.monthPax} pax`}
          />
          <StatCard
            label="Média por Tour"
            value={formatCurrency(stats.avgPerTour)}
            icon={<MapPin size={18} className="text-copper" />}
            accent="copper"
          />
        </div>

        {/* ── Chart + Method Breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Chart */}
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
                            isLast ? 'bg-yellow' : 'bg-yellow bg-opacity-30 group-hover:bg-opacity-60'
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
                      <p className={`text-[10px] font-medium ${isLast ? 'text-ink font-bold' : 'text-ink2'}`}>
                        {day.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Method Breakdown + Top Drivers */}
          <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <h2 className="text-sm font-bold text-ink">Receita por Método (Mês)</h2>
            </div>
            <div className="p-5">
              {/* Method bar */}
              {Object.keys(stats.methodBreakdown).length > 0 ? (
                <>
                  <div className="flex h-3 rounded-full overflow-hidden mb-4">
                    {Object.entries(stats.methodBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([method, amount]) => (
                        <div
                          key={method}
                          className={`${methodColor(method)} transition-all duration-500`}
                          style={{ width: `${(amount / stats.monthRev) * 100}%` }}
                          title={`${methodLabel(method)}: ${formatCurrency(amount)}`}
                        />
                      ))}
                  </div>
                  <div className="space-y-2.5">
                    {Object.entries(stats.methodBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([method, amount]) => (
                        <div key={method} className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${methodColor(method)}`} />
                            <span className="text-sm text-ink">{methodLabel(method)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-ink2">
                              {stats.monthRev > 0 ? Math.round((amount / stats.monthRev) * 100) : 0}%
                            </span>
                            <span className="text-sm font-bold text-ink">{formatCurrency(amount)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink2 text-center py-4">Sem dados este mês</p>
              )}

              {/* Top Drivers */}
              {stats.topDrivers.length > 0 && (
                <div className="mt-5 pt-5 border-t border-line">
                  <p className="text-xs font-semibold text-ink2 uppercase tracking-wider mb-3">Top Motoristas (Mês)</p>
                  <div className="space-y-2">
                    {stats.topDrivers.map((d, i) => (
                      <div key={d.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-yellow flex items-center justify-center text-ink font-black text-[10px] flex-shrink-0">
                            {i + 1}
                          </div>
                          <span className="text-sm text-ink truncate">{d.name}</span>
                        </div>
                        <span className="text-sm font-bold text-ink flex-shrink-0">{formatCurrency(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Period + Filters ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center bg-card border border-line rounded-xl overflow-hidden shadow-card">
            {([['week', 'Semana'], ['month', 'Mês'], ['all', 'Tudo']] as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  period === key
                    ? 'bg-ink text-cream'
                    : 'text-ink2 hover:text-ink hover:bg-cream'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl border transition-colors ${
                hasActiveFilters
                  ? 'bg-yellow bg-opacity-10 border-yellow border-opacity-30 text-ink'
                  : 'bg-card border-line text-ink2 hover:text-ink'
              }`}
            >
              <Filter size={14} />
              Filtros
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-yellow" />
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={() => { setFilterDriver(''); setFilterMethod('') }}
                className="text-xs text-copper font-semibold hover:underline flex items-center gap-1"
              >
                <X size={12} /> Limpar
              </button>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-card border border-line rounded-2xl p-4 shadow-card flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-ink2 mb-1.5 uppercase tracking-wider">Motorista</label>
              <select
                value={filterDriver}
                onChange={(e) => setFilterDriver(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm text-ink bg-white focus:outline-none focus:border-copper transition-colors"
              >
                <option value="">Todos</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-ink2 mb-1.5 uppercase tracking-wider">Método</label>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full px-3 py-2 border border-line rounded-xl text-sm text-ink bg-white focus:outline-none focus:border-copper transition-colors"
              >
                <option value="">Todos</option>
                <option value="cash">Dinheiro</option>
                <option value="card">Cartão</option>
                <option value="mbway">MB Way</option>
                <option value="transfer">Transferência</option>
                <option value="street">Vendas de Rua</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Transaction List ── */}
        <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">
              Transacções
              <span className="ml-2 text-xs font-normal text-ink2">
                ({filteredItems.length} {filteredItems.length === 1 ? 'entrada' : 'entradas'})
              </span>
            </h2>
            <span className="text-sm font-bold text-ink">{formatCurrency(filteredTotal)}</span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-ink2">Nenhuma transacção encontrada para este período.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {filteredItems.slice(0, 50).map((item) => (
                <div
                  key={item.id}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-cream transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.type === 'street_sale'
                        ? 'bg-yellow bg-opacity-20'
                        : 'bg-green bg-opacity-10'
                    }`}>
                      {item.type === 'street_sale' ? (
                        <MapPin size={16} className="text-yellow" />
                      ) : (
                        methodIcon(item.method)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink truncate">{item.label}</p>
                        {item.type === 'street_sale' && (
                          <span className="text-[10px] font-bold text-yellow bg-yellow bg-opacity-10 px-1.5 py-0.5 rounded-md flex-shrink-0">
                            RUA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink2 mt-0.5">
                        {formatDate(item.date)}
                        {driverNames[item.driverId] && ` · ${driverNames[item.driverId]}`}
                        {item.pax > 0 && ` · ${item.pax} pax`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-ink">{formatCurrency(item.amount)}</p>
                    {item.tip > 0 && (
                      <p className="text-[10px] text-green font-medium flex items-center justify-end gap-0.5">
                        <ArrowUpRight size={10} />
                        {formatCurrency(item.tip)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {filteredItems.length > 50 && (
                <div className="px-5 py-3 text-center">
                  <p className="text-xs text-ink2">
                    A mostrar 50 de {filteredItems.length} transacções. Exporte CSV para ver todas.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  )
}
