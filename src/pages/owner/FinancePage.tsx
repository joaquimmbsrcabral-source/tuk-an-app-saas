import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input, Select } from '../../components/Input'
import { EmptyState } from '../../components/EmptyState'
import { formatCurrency, formatDate } from '../../lib/format'
import { Download, TrendingUp, Users, CreditCard, MapPin } from 'lucide-react'

/* ── helpers ── */
const METHOD_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  card: 'Cartão',
  mbway: 'MB Way',
  transfer: 'Transferência',
  other: 'Outro',
}

const METHOD_EMOJI: Record<string, string> = {
  cash: '💵',
  card: '💳',
  mbway: '📱',
  transfer: '🏦',
  other: '📋',
}

const TOUR_EMOJI: Record<string, string> = {
  'Historico': '🏰',
  'Nova Lisboa': '✨',
  'Belem': '⛵',
}

type EnrichedPayment = {
  id: string
  company_id: string
  booking_id: string
  method: string
  amount: number
  received_at: string
  received_by: string
  notes: string
  driver_name: string
  tour_type: string | null
}

/* ── mini bar chart component ── */
const BarChart: React.FC<{ data: { label: string; value: number; color?: string }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-ink2 w-16 text-right shrink-0 truncate">{d.label}</span>
          <div className="flex-1 bg-line bg-opacity-30 rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center px-2 transition-all duration-700"
              style={{
                width: `${Math.max((d.value / max) * 100, 8)}%`,
                backgroundColor: d.color || '#B8673B',
              }}
            >
              <span className="text-xs font-semibold text-white whitespace-nowrap">
                {formatCurrency(d.value)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── stat card ── */
const StatCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: boolean
}> = ({ icon, label, value, sub, accent }) => (
  <Card className={accent ? 'bg-copper bg-opacity-5 border-copper border-opacity-20' : ''}>
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-xl ${accent ? 'bg-copper bg-opacity-10 text-copper' : 'bg-line bg-opacity-30 text-ink2'}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-ink2 mb-0.5">{label}</p>
        <p className={`text-xl font-bold ${accent ? 'text-copper' : 'text-ink'}`}>{value}</p>
        {sub && <p className="text-xs text-ink2 mt-0.5">{sub}</p>}
      </div>
    </div>
  </Card>
)

export const FinancePage: React.FC = () => {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<EnrichedPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    method: '',
    driver: '',
    startDate: '',
    endDate: '',
  })
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (profile) {
      fetchPayments()
      fetchDrivers()
    }
  }, [profile])

  const fetchPayments = async () => {
    if (!profile) return
    try {
      /* join with profiles (driver name) and bookings (tour_type) */
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          driver:profiles!received_by ( full_name ),
          booking:bookings!booking_id ( tour_type )
        `)
        .eq('company_id', profile.company_id)
        .order('received_at', { ascending: false })

      if (error) throw error

      const enriched: EnrichedPayment[] = (data || []).map((p: any) => ({
        id: p.id,
        company_id: p.company_id,
        booking_id: p.booking_id,
        method: p.method,
        amount: Number(p.amount),
        received_at: p.received_at,
        received_by: p.received_by,
        notes: p.notes,
        driver_name: p.driver?.full_name || 'Desconhecido',
        tour_type: p.booking?.tour_type || null,
      }))
      setPayments(enriched)
    } catch (err) {
      console.error('Error fetching payments:', err)
      /* fallback: fetch without joins */
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('received_at', { ascending: false })
      setPayments(
        (data || []).map((p: any) => ({
          ...p,
          amount: Number(p.amount),
          driver_name: p.received_by,
          tour_type: null,
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profile.company_id)
        .eq('role', 'driver')
      setDrivers((data || []).map((d) => ({ id: d.id, name: d.full_name })))
    } catch (err) {
      console.error('Error fetching drivers:', err)
    }
  }

  /* ── filtered payments ── */
  const filteredPayments = useMemo(() => {
    let filtered = payments
    if (filters.method) filtered = filtered.filter((p) => p.method === filters.method)
    if (filters.driver) filtered = filtered.filter((p) => p.received_by === filters.driver)
    if (filters.startDate) filtered = filtered.filter((p) => new Date(p.received_at) >= new Date(filters.startDate))
    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59)
      filtered = filtered.filter((p) => new Date(p.received_at) <= endDate)
    }
    return filtered
  }, [payments, filters])

  /* ── statistics ── */
  const stats = useMemo(() => {
    const total = filteredPayments.reduce((s, p) => s + p.amount, 0)
    const count = filteredPayments.length
    const avg = count > 0 ? total / count : 0

    /* by method */
    const byMethod: Record<string, number> = {}
    filteredPayments.forEach((p) => {
      byMethod[p.method] = (byMethod[p.method] || 0) + p.amount
    })

    /* by driver */
    const byDriver: Record<string, { name: string; total: number; count: number }> = {}
    filteredPayments.forEach((p) => {
      if (!byDriver[p.received_by]) {
        byDriver[p.received_by] = { name: p.driver_name, total: 0, count: 0 }
      }
      byDriver[p.received_by].total += p.amount
      byDriver[p.received_by].count += 1
    })

    /* by tour */
    const byTour: Record<string, number> = {}
    filteredPayments.forEach((p) => {
      const t = p.tour_type || 'Sem tour'
      byTour[t] = (byTour[t] || 0) + p.amount
    })

    /* monthly chart (last 6 months) */
    const monthly: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthly[key] = 0
    }
    filteredPayments.forEach((p) => {
      const d = new Date(p.received_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in monthly) monthly[key] += p.amount
    })

    /* top method */
    const topMethod = Object.entries(byMethod).sort((a, b) => b[1] - a[1])[0]

    return { total, count, avg, byMethod, byDriver, byTour, monthly, topMethod }
  }, [filteredPayments])

  const exportCSV = () => {
    const headers = ['Data', 'Método', 'Motorista', 'Tour', 'Valor', 'Notas']
    const rows = filteredPayments.map((p) => [
      formatDate(p.received_at),
      METHOD_LABELS[p.method] || p.method,
      p.driver_name,
      p.tour_type || '',
      formatCurrency(p.amount),
      p.notes || '',
    ])
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financas-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading)
    return (
      <OwnerLayout>
        <div className="text-center py-12">Carregando...</div>
      </OwnerLayout>
    )

  const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const TOUR_COLORS: Record<string, string> = {
    'Historico': '#B8673B',
    'Nova Lisboa': '#D4A853',
    'Belem': '#3D3029',
    'Sem tour': '#7A6E65',
  }
  const METHOD_COLORS: Record<string, string> = {
    cash: '#22c55e',
    card: '#3b82f6',
    mbway: '#ef4444',
    transfer: '#8b5cf6',
    other: '#7A6E65',
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Finanças</h1>
          {filteredPayments.length > 0 && (
            <Button onClick={exportCSV} variant="ghost">
              <Download size={20} className="mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Receita Total"
            value={formatCurrency(stats.total)}
            sub={`${stats.count} pagamento${stats.count !== 1 ? 's' : ''}`}
            accent
          />
          <StatCard
            icon={<CreditCard size={20} />}
            label="Média / Pagamento"
            value={formatCurrency(stats.avg)}
          />
          <StatCard
            icon={<MapPin size={20} />}
            label="Top Tour"
            value={
              Object.entries(stats.byTour)
                .filter(([k]) => k !== 'Sem tour')
                .sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
            }
            sub={
              Object.entries(stats.byTour)
                .filter(([k]) => k !== 'Sem tour')
                .sort((a, b) => b[1] - a[1])[0]
                ? formatCurrency(
                    Object.entries(stats.byTour)
                      .filter(([k]) => k !== 'Sem tour')
                      .sort((a, b) => b[1] - a[1])[0][1]
                  )
                : undefined
            }
          />
          <StatCard
            icon={<Users size={20} />}
            label="Top Motorista"
            value={
              Object.values(stats.byDriver).sort((a, b) => b.total - a.total)[0]?.name || '—'
            }
            sub={
              Object.values(stats.byDriver).sort((a, b) => b.total - a.total)[0]
                ? formatCurrency(
                    Object.values(stats.byDriver).sort((a, b) => b.total - a.total)[0].total
                  )
                : undefined
            }
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Método"
            options={[
              { value: '', label: 'Todos' },
              { value: 'cash', label: 'Dinheiro' },
              { value: 'card', label: 'Cartão' },
              { value: 'mbway', label: 'MB Way' },
              { value: 'transfer', label: 'Transferência' },
              { value: 'other', label: 'Outro' },
            ]}
            value={filters.method}
            onChange={(e) => setFilters({ ...filters, method: e.target.value })}
          />
          <Select
            label="Motorista"
            options={[
              { value: '', label: 'Todos' },
              ...drivers.map((d) => ({ value: d.id, label: d.name })),
            ]}
            value={filters.driver}
            onChange={(e) => setFilters({ ...filters, driver: e.target.value })}
          />
          <Input
            label="Data Início"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            label="Data Fim"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        {(filters.method || filters.driver || filters.startDate || filters.endDate) && (
          <button
            onClick={() => setFilters({ method: '', driver: '', startDate: '', endDate: '' })}
            className="text-sm text-copper font-medium hover:underline"
          >
            Limpar filtros
          </button>
        )}

        {filteredPayments.length === 0 ? (
          <EmptyState
            icon="💰"
            title="Nenhum Pagamento"
            description="Nenhum pagamento encontrado com os filtros selecionados"
          />
        ) : (
          <>
            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly revenue chart */}
              <Card>
                <h3 className="text-sm font-bold text-ink mb-4">📊 Receita Mensal</h3>
                <div className="flex items-end gap-2 h-40">
                  {Object.entries(stats.monthly).map(([key, value]) => {
                    const max = Math.max(...Object.values(stats.monthly), 1)
                    const height = (value / max) * 100
                    const month = MONTH_NAMES[parseInt(key.split('-')[1]) - 1]
                    return (
                      <div key={key} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-ink2 font-medium">
                          {value > 0 ? formatCurrency(value) : ''}
                        </span>
                        <div className="w-full flex items-end" style={{ height: '120px' }}>
                          <div
                            className="w-full rounded-t-lg transition-all duration-700"
                            style={{
                              height: `${Math.max(height, value > 0 ? 8 : 2)}%`,
                              backgroundColor: value > 0 ? '#B8673B' : '#e5e0dc',
                            }}
                          />
                        </div>
                        <span className="text-xs text-ink2">{month}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Revenue by tour */}
              <Card>
                <h3 className="text-sm font-bold text-ink mb-4">🗺️ Receita por Tour</h3>
                <BarChart
                  data={Object.entries(stats.byTour)
                    .sort((a, b) => b[1] - a[1])
                    .map(([tour, value]) => ({
                      label: `${TOUR_EMOJI[tour] || '📋'} ${tour}`,
                      value,
                      color: TOUR_COLORS[tour] || '#7A6E65',
                    }))}
                />
              </Card>

              {/* Revenue by driver */}
              <Card>
                <h3 className="text-sm font-bold text-ink mb-4">👤 Receita por Motorista</h3>
                <BarChart
                  data={Object.values(stats.byDriver)
                    .sort((a, b) => b.total - a.total)
                    .map((d, i) => ({
                      label: d.name,
                      value: d.total,
                      color: ['#B8673B', '#D4A853', '#3D3029', '#7A6E65'][i % 4],
                    }))}
                />
                {Object.keys(stats.byDriver).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-line border-opacity-30">
                    <div className="flex justify-between text-xs text-ink2">
                      <span>Total tours realizados</span>
                      <span className="font-semibold text-ink">
                        {Object.values(stats.byDriver).reduce((s, d) => s + d.count, 0)}
                      </span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Revenue by payment method */}
              <Card>
                <h3 className="text-sm font-bold text-ink mb-4">💳 Receita por Método</h3>
                <BarChart
                  data={Object.entries(stats.byMethod)
                    .sort((a, b) => b[1] - a[1])
                    .map(([method, value]) => ({
                      label: `${METHOD_EMOJI[method] || ''} ${METHOD_LABELS[method] || method}`,
                      value,
                      color: METHOD_COLORS[method] || '#7A6E65',
                    }))}
                />
              </Card>
            </div>

            {/* ── Payment list ── */}
            <div>
              <h3 className="text-sm font-bold text-ink mb-3">
                Pagamentos ({filteredPayments.length})
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {filteredPayments.map((payment) => (
                  <Card key={payment.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-ink mb-0.5">{payment.driver_name}</h3>
                      <p className="text-sm text-ink2 mb-2">{formatDate(payment.received_at)}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded-btn bg-line bg-opacity-50 text-ink">
                          {METHOD_EMOJI[payment.method] || ''} {METHOD_LABELS[payment.method] || payment.method}
                        </span>
                        {payment.tour_type && (
                          <span className="text-xs px-2 py-1 rounded-btn bg-copper bg-opacity-10 text-copper">
                            {TOUR_EMOJI[payment.tour_type] || '🗺️'} {payment.tour_type}
                          </span>
                        )}
                        {payment.notes && (
                          <p className="text-xs text-ink2">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink text-lg">{formatCurrency(payment.amount)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </OwnerLayout>
  )
}
