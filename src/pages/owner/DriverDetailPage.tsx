import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { formatCurrency, formatDate } from '../../lib/format'
import { ArrowLeft, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { startOfWeek, startOfMonth, format } from 'date-fns'
import { pt } from 'date-fns/locale'

export const DriverDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [driver, setDriver] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    weekCount: 0, weekGross: 0, weekCommission: 0,
    monthCount: 0, monthGross: 0, monthCommission: 0,
    allCount: 0, allGross: 0, allCommission: 0, activeDays: 0, avgPerDay: 0, avgPerTour: 0,
    recent: [] as any[],
  })

  useEffect(() => {
    if (profile && id) fetchData()
  }, [profile, id])

  const fetchData = async () => {
    if (!profile || !id) return
    setLoading(true)
    try {
      const { data: drv } = await supabase.from('profiles').select('*').eq('id', id).single()
      setDriver(drv)

      const pct = Number(drv?.commission_pct || 0) / 100
      const weekFrom = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()
      const monthFrom = startOfMonth(new Date()).toISOString()

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, start_at, price, tour_type, status')
        .eq('driver_id', id)
        .eq('status', 'completed')
        .order('start_at', { ascending: false })

      const { data: sales } = await supabase
        .from('street_sales')
        .select('id, sold_at, price, tour_name')
        .eq('driver_id', id)
        .order('sold_at', { ascending: false })

      const all = [
        ...(bookings || []).map((b: any) => ({ id: b.id, date: b.start_at, price: Number(b.price || 0), name: b.tour_type, kind: 'booking' })),
        ...(sales || []).map((s: any) => ({ id: s.id, date: s.sold_at, price: Number(s.price || 0), name: s.tour_name, kind: 'street' })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const week = all.filter((x) => x.date >= weekFrom)
      const month = all.filter((x) => x.date >= monthFrom)
      const sum = (arr: any[]) => arr.reduce((s, x) => s + x.price, 0)

      setStats({
        weekCount: week.length, weekGross: sum(week), weekCommission: sum(week) * pct,
        monthCount: month.length, monthGross: sum(month), monthCommission: sum(month) * pct,
        allCount: all.length, allGross: sum(all), allCommission: sum(all) * pct,
        activeDays: new Set(all.map((x: any) => (x.date || '').slice(0,10)).filter(Boolean)).size,
        avgPerDay: (() => { const d = new Set(all.map((x: any) => (x.date || '').slice(0,10)).filter(Boolean)).size; return d ? sum(all) / d : 0 })(),
        avgPerTour: all.length ? sum(all) / all.length : 0,
        recent: all.slice(0, 20),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !driver) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <button onClick={() => navigate('/motoristas')} className="flex items-center gap-2 text-ink2 hover:text-ink">
          <ArrowLeft size={18} /> Voltar a Motoristas
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-yellow flex items-center justify-center text-2xl font-bold text-ink">
            {driver.full_name?.[0] || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-ink">{driver.full_name}</h1>
            <p className="text-ink2">{driver.phone} · Comissão {driver.commission_pct}% · <span className={driver.status === 'available' ? 'text-green' : 'text-ink2'}>{driver.status || 'offline'}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green bg-opacity-5 border-green border-opacity-30">
            <div className="flex items-center gap-2 mb-2"><TrendingUp size={18} className="text-green" /><h3 className="font-bold text-ink">Esta semana</h3></div>
            <div className="text-2xl font-bold text-ink">{stats.weekCount} tours</div>
            <div className="text-sm text-ink2">Bruto: {formatCurrency(stats.weekGross)}</div>
            <div className="text-sm font-semibold text-green">Comissão: {formatCurrency(stats.weekCommission)}</div>
          </Card>
          <Card className="bg-yellow bg-opacity-5 border-yellow border-opacity-30">
            <div className="flex items-center gap-2 mb-2"><Calendar size={18} className="text-copper" /><h3 className="font-bold text-ink">Este mês</h3></div>
            <div className="text-2xl font-bold text-ink">{stats.monthCount} tours</div>
            <div className="text-sm text-ink2">Bruto: {formatCurrency(stats.monthGross)}</div>
            <div className="text-sm font-semibold text-copper">Comissão: {formatCurrency(stats.monthCommission)}</div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2"><DollarSign size={18} className="text-ink2" /><h3 className="font-bold text-ink">Total histórico</h3></div>
            <div className="text-2xl font-bold text-ink">{stats.allCount} tours</div>
            <div className="text-sm text-ink2">Bruto: {formatCurrency(stats.allGross)}</div>
            <div className="text-sm font-semibold text-ink">Comissão: {formatCurrency(stats.allCommission)}</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-sm text-ink2 mb-1">Média de faturação por dia</div>
            <div className="text-2xl font-bold text-ink">{formatCurrency(stats.avgPerDay)}</div>
            <div className="text-xs text-ink2 mt-1">{stats.activeDays} {stats.activeDays === 1 ? 'dia ativo' : 'dias ativos'}</div>
          </Card>
          <Card>
            <div className="text-sm text-ink2 mb-1">Média por tour</div>
            <div className="text-2xl font-bold text-ink">{formatCurrency(stats.avgPerTour)}</div>
          </Card>
          <Card>
            <div className="text-sm text-ink2 mb-1">Tours por dia ativo</div>
            <div className="text-2xl font-bold text-ink">{stats.activeDays ? (stats.allCount / stats.activeDays).toFixed(1) : '0'}</div>
          </Card>
        </div>

        <Card>
          <h2 className="text-lg font-bold text-ink mb-4">Últimas atividades</h2>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-ink2 text-center py-4">Sem atividade ainda.</p>
          ) : (
            <div className="space-y-2">
              {stats.recent.map((r) => (
                <div key={`${r.kind}-${r.id}`} className="flex items-center justify-between p-3 border border-line rounded-btn">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{r.kind === 'street' ? '️' : ''}</span>
                    <div>
                      <div className="font-semibold text-ink text-sm">{r.name}</div>
                      <div className="text-xs text-ink2">{format(new Date(r.date), "d 'de' MMMM", { locale: pt })}</div>
                    </div>
                  </div>
                  <div className="font-bold text-ink">{formatCurrency(r.price)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </OwnerLayout>
  )
}
