import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Booking, StreetSale } from '../../lib/types'
import { formatCurrency } from '../../lib/format'
import {
  Trash2,
  TrendingUp,
  DollarSign,
  MapPin,
  Users,
  ArrowUpRight,
} from 'lucide-react'
import {
  startOfWeek,
  startOfMonth,
  subDays,
  parseISO,
  isAfter,
  isToday,
  format,
} from 'date-fns'
import { pt as ptPT } from 'date-fns/locale'

type Period = 'week' | 'month'

export const DriverFinancePage: React.FC = () => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [sales, setSales] = useState<StreetSale[]>([])
  const [period, setPeriod] = useState<Period>('week')

  useEffect(() => {
    if (profile) load()
  }, [profile])

  const load = async () => {
    if (!profile) return
    const since = subDays(new Date(), 90).toISOString()

    const [{ data: bkgs }, { data: ss }] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .eq('driver_id', profile.id)
        .eq('status', 'completed')
        .gte('end_at', since)
        .order('end_at', { ascending: false }),
      supabase
        .from('street_sales')
        .select('*')
        .eq('driver_id', profile.id)
        .gte('sold_at', since)
        .order('sold_at', { ascending: false }),
    ])
    setBookings(bkgs || [])
    setSales(ss || [])
    setLoading(false)
  }

  const commissionPct = Number(profile?.commission_pct || 0) / 100

  /* ── Unified rows ── */
  type Row = {
    id: string
    date: Date
    gross: number
    tip: number
    pax: number
    isStreet: boolean
    tourName?: string
  }

  const rows = useMemo((): Row[] => {
    const items: Row[] = [
      ...bookings.map((b) => ({
        id: b.id,
        date: parseISO(b.end_at || b.start_at),
        gross: Number(b.price || 0),
        tip: Number(b.tip_amount || 0),
        pax: Number(b.pax || 0),
        isStreet: false,
      })),
      ...sales.map((s) => ({
        id: s.id,
        date: parseISO(s.sold_at),
        gross: Number(s.price || 0),
        tip: Number(s.tip_amount || 0),
        pax: Number(s.pax || 0),
        isStreet: true,
        tourName: s.tour_name,
      })),
    ]
    items.sort((a, b) => b.date.getTime() - a.date.getTime())
    return items
  }, [bookings, sales])

  /* ── Stats helper ── */
  const computeStats = (filterFn: (r: Row) => boolean) => {
    const filtered = rows.filter(filterFn)
    const gross = filtered.reduce((a, r) => a + r.gross, 0)
    const tips = filtered.reduce((a, r) => a + r.tip, 0)
    const commission = gross * commissionPct
    const total = commission + tips
    const pax = filtered.reduce((a, r) => a + r.pax, 0)
    return { count: filtered.length, gross, tips, commission, total, pax }
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const monthStart = startOfMonth(new Date())

  const weekStats = useMemo(() => computeStats((r) => isAfter(r.date, weekStart)), [rows, weekStart])
  const monthStats = useMemo(() => computeStats((r) => isAfter(r.date, monthStart)), [rows, monthStart])
  const allStats = useMemo(() => computeStats(() => true), [rows])
  const todayStats = useMemo(() => computeStats((r) => isToday(r.date)), [rows])

  const activeStats = period === 'week' ? weekStats : monthStats

  /* ── Chart data (last 7 days) ── */
  const chartData = useMemo(() => {
    const today = new Date()
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i)
      return {
        date: format(d, 'yyyy-MM-dd'),
        label: format(d, 'EEE', { locale: ptPT }),
        amount: 0,
      }
    })

    rows.forEach((r) => {
      const dayStr = format(r.date, 'yyyy-MM-dd')
      const day = days.find((d) => d.date === dayStr)
      if (day) day.amount += r.gross * commissionPct + r.tip
    })

    return days
  }, [rows, commissionPct])

  const maxChart = Math.max(...chartData.map((d) => d.amount), 1)

  /* ── Delete street sale ── */
  const handleDelete = async (row: Row) => {
    if (!row.isStreet) return
    const label = row.tourName
      ? `"${row.tourName}" de ${row.date.toLocaleDateString('pt-PT')}`
      : `venda de ${row.date.toLocaleDateString('pt-PT')}`
    if (!window.confirm(`Apagar a venda ${label} (${formatCurrency(row.gross)})?`)) return
    const { error } = await supabase.from('street_sales').delete().eq('id', row.id)
    if (error) {
      alert('Erro ao apagar: ' + error.message)
      return
    }
    setSales((prev) => prev.filter((s) => s.id !== row.id))
  }

  /* ── Period rows ── */
  const periodRows = useMemo(() => {
    const filterFn = period === 'week'
      ? (r: Row) => isAfter(r.date, weekStart)
      : (r: Row) => isAfter(r.date, monthStart)
    return rows.filter(filterFn)
  }, [rows, period, weekStart, monthStart])

  if (loading) {
    return (
      <DriverLayout>
        <div className="p-4 space-y-4">
          <div className="h-7 w-32 bg-line rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-card border border-line rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-48 bg-card border border-line rounded-2xl animate-pulse" />
        </div>
      </DriverLayout>
    )
  }

  return (
    <DriverLayout>
      <div className="p-4 space-y-5">
        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-black text-ink">Finanças</h1>
          <p className="text-xs text-ink2 mt-0.5">
            Comissão de <strong className="text-ink">{(commissionPct * 100).toFixed(0)}%</strong> sobre vendas · Gorjetas são 100% tuas
          </p>
        </div>

        {/* ── Period Toggle ── */}
        <div className="flex items-center bg-card border border-line rounded-xl overflow-hidden shadow-card self-start">
          {([['week', 'Semana'], ['month', 'Mês']] as [Period, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`flex-1 px-5 py-2 text-sm font-semibold transition-colors ${
                period === key
                  ? 'bg-ink text-cream'
                  : 'text-ink2 hover:text-ink hover:bg-cream'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Highlight Card ── */}
        <div className="bg-green bg-opacity-5 border border-green border-opacity-20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-ink2 uppercase tracking-wider">
              {period === 'week' ? 'A receber esta semana' : 'A receber este mês'}
            </p>
            <div className="w-8 h-8 rounded-xl bg-green bg-opacity-10 flex items-center justify-center">
              <TrendingUp size={16} className="text-green" />
            </div>
          </div>
          <p className="text-3xl font-black text-green mb-1">{formatCurrency(activeStats.total)}</p>
          <p className="text-xs text-ink2">
            {formatCurrency(activeStats.commission)} comissão + {formatCurrency(activeStats.tips)} gorjetas
          </p>
        </div>

        {/* ── Stat Grid ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-line rounded-2xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-ink2 uppercase tracking-wider">Tours</p>
              <MapPin size={14} className="text-yellow" />
            </div>
            <p className="text-xl font-black text-ink">{activeStats.count}</p>
          </div>
          <div className="bg-card border border-line rounded-2xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-ink2 uppercase tracking-wider">Vendas Brutas</p>
              <DollarSign size={14} className="text-ink" />
            </div>
            <p className="text-xl font-black text-ink">{formatCurrency(activeStats.gross)}</p>
          </div>
          <div className="bg-card border border-line rounded-2xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-ink2 uppercase tracking-wider">Passageiros</p>
              <Users size={14} className="text-copper" />
            </div>
            <p className="text-xl font-black text-ink">{activeStats.pax}</p>
          </div>
          <div className="bg-card border border-line rounded-2xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-ink2 uppercase tracking-wider">Gorjetas</p>
              <span className="text-sm">🤫</span>
            </div>
            <p className="text-xl font-black text-green">{formatCurrency(activeStats.tips)}</p>
          </div>
        </div>

        {/* ── 7-day Chart ── */}
        <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <h2 className="text-xs font-bold text-ink">Ganhos — últimos 7 dias</h2>
            <span className="text-xs font-bold text-green">
              {formatCurrency(chartData.reduce((s, d) => s + d.amount, 0))}
            </span>
          </div>
          <div className="px-4 pb-4 pt-3">
            <div className="flex items-end gap-1.5 h-28">
              {chartData.map((day, i) => {
                const pct = maxChart > 0 ? day.amount / maxChart : 0
                const isLast = i === chartData.length - 1
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex items-end" style={{ height: 90 }}>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 relative ${
                          isLast ? 'bg-green' : 'bg-green bg-opacity-25 group-hover:bg-opacity-50'
                        }`}
                        style={{ height: `${Math.max(pct * 100, 4)}%` }}
                      >
                        {day.amount > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-ink opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {formatCurrency(day.amount)}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className={`text-[9px] font-medium ${isLast ? 'text-ink font-bold' : 'text-ink2'}`}>
                      {day.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Today highlight ── */}
        {todayStats.count > 0 && (
          <div className="bg-yellow bg-opacity-10 border border-yellow border-opacity-20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-ink2">Hoje</p>
              <p className="text-lg font-black text-ink">{todayStats.count} {todayStats.count === 1 ? 'tour' : 'tours'}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-green">{formatCurrency(todayStats.commission + todayStats.tips)}</p>
              <p className="text-[10px] text-ink2">{formatCurrency(todayStats.gross)} bruto</p>
            </div>
          </div>
        )}

        {/* ── All-time summary ── */}
        <div className="bg-card border border-line rounded-2xl p-4 shadow-card">
          <p className="text-xs font-semibold text-ink2 uppercase tracking-wider mb-3">Resumo (últimos 90 dias)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-ink2">Tours</p>
              <p className="text-base font-bold text-ink">{allStats.count}</p>
            </div>
            <div>
              <p className="text-[10px] text-ink2">Média por tour</p>
              <p className="text-base font-bold text-ink">{formatCurrency(allStats.count > 0 ? allStats.gross / allStats.count : 0)}</p>
            </div>
            <div>
              <p className="text-[10px] text-ink2">Total bruto</p>
              <p className="text-base font-bold text-ink">{formatCurrency(allStats.gross)}</p>
            </div>
            <div>
              <p className="text-[10px] text-ink2">Total gorjetas</p>
              <p className="text-base font-bold text-green">{formatCurrency(allStats.tips)}</p>
            </div>
          </div>
        </div>

        {/* ── Transaction List ── */}
        <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <h2 className="text-xs font-bold text-ink">
              Vendas {period === 'week' ? 'da Semana' : 'do Mês'}
              <span className="ml-1 font-normal text-ink2">({periodRows.length})</span>
            </h2>
            <span className="text-xs font-bold text-ink">
              {formatCurrency(periodRows.reduce((s, r) => s + r.gross, 0))}
            </span>
          </div>

          {periodRows.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-ink2">Ainda sem vendas {period === 'week' ? 'esta semana' : 'este mês'}.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {periodRows.slice(0, 20).map((r) => (
                <div
                  key={r.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-cream transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      r.isStreet ? 'bg-yellow bg-opacity-20' : 'bg-green bg-opacity-10'
                    }`}>
                      <MapPin size={14} className={r.isStreet ? 'text-yellow' : 'text-green'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-ink truncate">
                          {r.isStreet ? (r.tourName || 'Venda Rua') : 'Reserva'}
                        </p>
                        {r.isStreet && (
                          <span className="text-[9px] font-bold text-yellow bg-yellow bg-opacity-10 px-1 py-0.5 rounded flex-shrink-0">
                            RUA
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink2 mt-0.5">
                        {r.date.toLocaleDateString('pt-PT')} · {r.pax} pax
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-ink">{formatCurrency(r.gross)}</p>
                      {r.tip > 0 && (
                        <p className="text-[10px] text-green font-medium flex items-center justify-end gap-0.5">
                          <ArrowUpRight size={9} />
                          {formatCurrency(r.tip)} 🤫
                        </p>
                      )}
                    </div>
                    {r.isStreet && (
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        className="p-2 rounded-xl text-ink2 hover:text-copper hover:bg-copper hover:bg-opacity-10 transition-colors active:scale-90"
                        title="Apagar venda"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  )
}
