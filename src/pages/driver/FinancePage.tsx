import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Card } from '../../components/Card'
import { Booking, StreetSale } from '../../lib/types'
import { formatCurrency } from '../../lib/format'
import { startOfWeek, startOfMonth, subDays, parseISO, isAfter } from 'date-fns'

export const DriverFinancePage: React.FC = () => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [sales, setSales] = useState<StreetSale[]>([])

  useEffect(() => {
    if (profile) load()
  }, [profile])

  const load = async () => {
    if (!profile) return
    const since = subDays(new Date(), 60).toISOString()

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

  if (loading) return <DriverLayout><div className="text-center py-12">Carregando...</div></DriverLayout>

  const commissionPct = Number(profile?.commission_pct || 0) / 100
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const monthStart = startOfMonth(new Date())

  type Row = { date: Date; gross: number; tip: number; pax: number; isStreet: boolean }
  const rows: Row[] = [
    ...bookings.map((b) => ({
      date: parseISO(b.end_at || b.start_at),
      gross: Number(b.price || 0),
      tip: Number(b.tip_amount || 0),
      pax: Number(b.pax || 0),
      isStreet: false,
    })),
    ...sales.map((s) => ({
      date: parseISO(s.sold_at),
      gross: Number(s.price || 0),
      tip: Number(s.tip_amount || 0),
      pax: Number(s.pax || 0),
      isStreet: true,
    })),
  ]

  const sum = (filterFn: (r: Row) => boolean) => {
    const f = rows.filter(filterFn)
    const gross = f.reduce((a, r) => a + r.gross, 0)
    const tips = f.reduce((a, r) => a + r.tip, 0)
    const commission = gross * commissionPct
    const total = commission + tips
    return { count: f.length, gross, tips, commission, total }
  }

  const week = sum((r) => isAfter(r.date, weekStart))
  const month = sum((r) => isAfter(r.date, monthStart))
  const all = sum(() => true)
  const avgPerTour = all.count > 0 ? all.gross / all.count : 0

  const Stat = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => (
    <div>
      <p className="text-xs text-ink2">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-green' : 'text-ink'}`}>{value}</p>
    </div>
  )

  return (
    <DriverLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-ink">Finanças</h1>
        <p className="text-sm text-ink2">
          A tua comissão é <strong>{(commissionPct * 100).toFixed(0)}%</strong> sobre as vendas. As gorjetas são 100% tuas e só tu as vês.
        </p>

        <Card className="bg-green bg-opacity-10 border-green">
          <h2 className="text-sm font-bold text-ink mb-3">Esta Semana</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Tours" value={week.count.toString()} />
            <Stat label="Vendas brutas" value={formatCurrency(week.gross)} />
            <Stat label="Comissão" value={formatCurrency(week.commission)} />
            <Stat label="Gorjetas 🤫" value={formatCurrency(week.tips)} />
          </div>
          <div className="border-t border-line mt-3 pt-3">
            <Stat label="Total a receber" value={formatCurrency(week.total)} accent />
          </div>
        </Card>

        <Card className="bg-yellow bg-opacity-10 border-yellow">
          <h2 className="text-sm font-bold text-ink mb-3">Este Mês</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Tours" value={month.count.toString()} />
            <Stat label="Vendas brutas" value={formatCurrency(month.gross)} />
            <Stat label="Comissão" value={formatCurrency(month.commission)} />
            <Stat label="Gorjetas 🤫" value={formatCurrency(month.tips)} />
          </div>
          <div className="border-t border-line mt-3 pt-3">
            <Stat label="Total a receber" value={formatCurrency(month.total)} accent />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-bold text-ink mb-3">Médias (últimos 60 dias)</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Tours feitos" value={all.count.toString()} />
            <Stat label="Média por tour" value={formatCurrency(avgPerTour)} />
            <Stat label="Total bruto" value={formatCurrency(all.gross)} />
            <Stat label="Total gorjetas" value={formatCurrency(all.tips)} />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-bold text-ink mb-2">Últimas vendas</h2>
          {rows.length === 0 ? (
            <p className="text-sm text-ink2">Ainda sem vendas registadas.</p>
          ) : (
            <ul className="divide-y divide-line">
              {rows
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 15)
                .map((r, i) => (
                  <li key={i} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <p className="text-ink">
                        {r.isStreet ? '🚶 Rua' : '📅 Reserva'} · {r.pax}p
                      </p>
                      <p className="text-xs text-ink2">{r.date.toLocaleDateString('pt-PT')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink">{formatCurrency(r.gross)}</p>
                      {r.tip > 0 && <p className="text-xs text-green">+{formatCurrency(r.tip)} 🤫</p>}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </DriverLayout>
  )
}
