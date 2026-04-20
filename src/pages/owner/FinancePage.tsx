import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input, Select } from '../../components/Input'
import { EmptyState } from '../../components/EmptyState'
import { Payment, StreetSale } from '../../lib/types'
import { formatCurrency, formatDate } from '../../lib/format'
import { Download, TrendingUp, Receipt, Banknote, PiggyBank, Calendar } from 'lucide-react'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO, format } from 'date-fns'
import { pt as ptPT } from 'date-fns/locale'

type FinanceEntry = {
  id: string
  type: 'payment' | 'street_sale'
  date: string
  amount: number
  method: string
  driverId: string
  notes: string
  tourName?: string
  tipAmount?: number
}

type PeriodKey = 'week' | 'month' | 'last_month' | 'all'

export const FinancePage: React.FC = () => {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [activePeriod, setActivePeriod] = useState<PeriodKey>('month')
  const [filters, setFilters] = useState({
    method: '',
    driver: '',
    startDate: '',
    endDate: '',
  })
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([])
  const [driverNames, setDriverNames] = useState<Record<string, string>>({})
  const [streetSales, setStreetSales] = useState<StreetSale[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (profile) {
      fetchPayments()
      fetchDrivers()
      fetchStreetSales()
    }
  }, [profile])

  const fetchPayments = async () => {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('received_at', { ascending: false })
      setPayments(data || [])
    } catch (err) {
      console.error('Error fetching payments:', err)
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
      const list = (data || []).map((d) => ({ id: d.id, name: d.full_name }))
      setDrivers(list)
      const names: Record<string, string> = {}
      list.forEach((d) => { names[d.id] = d.name })
      setDriverNames(names)
    } catch (err) {
      console.error('Error fetching drivers:', err)
    }
  }

  const fetchStreetSales = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('street_sales')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('sold_at', { ascending: false })
    setStreetSales(data || [])
  }

  const entries: FinanceEntry[] = useMemo(() => {
    const paymentEntries: FinanceEntry[] = payments.map((p) => ({
      id: p.id,
      type: 'payment',
      date: p.received_at,
      amount: p.amount,
      method: p.method,
      driverId: p.received_by,
      notes: p.notes || '',
    }))
    const saleEntries: FinanceEntry[] = streetSales.map((s) => ({
      id: s.id,
      type: 'street_sale',
      date: s.sold_at,
      amount: s.price,
      method: s.payment_method,
      driverId: s.driver_id,
      notes: s.notes || '',
      tourName: s.tour_name,
      tipAmount: s.tip_amount || 0,
    }))
    return [...paymentEntries, ...saleEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [payments, streetSales])

  const getPeriodRange = (key: PeriodKey): { start: Date; end: Date } | null => {
    const now = new Date()
    switch (key) {
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'last_month': {
        const prev = subMonths(now, 1)
        return { start: startOfMonth(prev), end: endOfMonth(prev) }
      }
      default:
        return null
    }
  }

  const periodLabel = (key: PeriodKey): string => {
    const map: Record<PeriodKey, string> = {
      week: 'Esta Semana',
      month: 'Este Mês',
      last_month: 'Mês Anterior',
      all: 'Tudo',
    }
    return map[key]
  }

  const filteredEntries = useMemo(() => {
    let filtered = entries

    // Apply period filter
    const range = getPeriodRange(activePeriod)
    if (range) {
      filtered = filtered.filter((e) => {
        const d = parseISO(e.date)
        return isWithinInterval(d, { start: range.start, end: range.end })
      })
    }

    // Apply manual filters
    if (filters.method) {
      filtered = filtered.filter((e) => e.method === filters.method)
    }
    if (filters.driver) {
      filtered = filtered.filter((e) => e.driverId === filters.driver)
    }
    if (filters.startDate) {
      filtered = filtered.filter((e) => new Date(e.date) >= new Date(filters.startDate))
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59)
      filtered = filtered.filter((e) => new Date(e.date) <= endDate)
    }
    return filtered
  }, [entries, activePeriod, filters])

  // Stats
  const stats = useMemo(() => {
    const total = filteredEntries.reduce((s, e) => s + e.amount, 0)
    const tips = filteredEntries.reduce((s, e) => s + (e.tipAmount || 0), 0)
    const count = filteredEntries.length
    const avg = count > 0 ? total / count : 0
    const salesCount = filteredEntries.filter((e) => e.type === 'street_sale').length
    const paymentsCount = filteredEntries.filter((e) => e.type === 'payment').length
    const salesTotal = filteredEntries.filter((e) => e.type === 'street_sale').reduce((s, e) => s + e.amount, 0)
    const paymentsTotal = filteredEntries.filter((e) => e.type === 'payment').reduce((s, e) => s + e.amount, 0)

    // Method breakdown
    const byMethod: Record<string, { count: number; total: number }> = {}
    filteredEntries.forEach((e) => {
      if (!byMethod[e.method]) byMethod[e.method] = { count: 0, total: 0 }
      byMethod[e.method].count++
      byMethod[e.method].total += e.amount
    })

    // Driver breakdown
    const byDriver: Record<string, { name: string; total: number; count: number }> = {}
    filteredEntries.forEach((e) => {
      if (!byDriver[e.driverId]) byDriver[e.driverId] = { name: driverNames[e.driverId] || e.driverId, total: 0, count: 0 }
      byDriver[e.driverId].total += e.amount
      byDriver[e.driverId].count++
    })

    return { total, tips, count, avg, salesCount, paymentsCount, salesTotal, paymentsTotal, byMethod, byDriver }
  }, [filteredEntries, driverNames])

  const methodLabel = (m: string) => {
    const map: Record<string, string> = {
      cash: 'Dinheiro',
      card: 'Cartão',
      mbway: 'MB Way',
      transfer: 'Transferência',
      other: 'Outro',
    }
    return map[m] || m
  }

  const methodColor = (m: string) => {
    const map: Record<string, string> = {
      cash: '#22c55e',
      card: '#3b82f6',
      mbway: '#ef4444',
      transfer: '#f59e0b',
      other: '#8b5cf6',
    }
    return map[m] || '#6b7280'
  }

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Método', 'Motorista', 'Valor', 'Gorjeta', 'Notas']
    const rows = filteredEntries.map((e) => [
      formatDate(e.date),
      e.type === 'street_sale' ? 'Venda de Rua' : 'Pagamento',
      methodLabel(e.method),
      driverNames[e.driverId] || e.driverId,
      formatCurrency(e.amount),
      e.tipAmount ? formatCurrency(e.tipAmount) : '',
      e.notes,
    ])
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financas-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const handlePeriod = (key: PeriodKey) => {
    setActivePeriod(key)
    if (key !== 'all') {
      setFilters({ method: '', driver: '', startDate: '', endDate: '' })
    }
  }

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Finanças</h1>
          <div className="flex gap-2">
            {filteredEntries.length > 0 && (
              <Button onClick={exportCSV} variant="ghost">
                <Download size={18} className="mr-1" />
                CSV
              </Button>
            )}
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap gap-2">
          {(['week', 'month', 'last_month', 'all'] as PeriodKey[]).map((key) => (
            <button
              key={key}
              onClick={() => handlePeriod(key)}
              className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors ${
                activePeriod === key
                  ? 'bg-yellow text-white'
                  : 'bg-line bg-opacity-30 text-ink2 hover:bg-opacity-50'
              }`}
            >
              {periodLabel(key)}
            </button>
          ))}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors ${
              showFilters ? 'bg-copper bg-opacity-20 text-copper' : 'bg-line bg-opacity-30 text-ink2 hover:bg-opacity-50'
            }`}
          >
            Filtros
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-line bg-opacity-10 rounded-card">
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
              onChange={(e) => { setActivePeriod('all'); setFilters({ ...filters, startDate: e.target.value }) }}
            />
            <Input
              label="Data Fim"
              type="date"
              value={filters.endDate}
              onChange={(e) => { setActivePeriod('all'); setFilters({ ...filters, endDate: e.target.value }) }}
            />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <Banknote size={24} className="mx-auto mb-2 text-yellow" />
            <p className="text-xs text-ink2 mb-1">Total</p>
            <p className="text-2xl font-bold text-ink">{formatCurrency(stats.total)}</p>
          </Card>
          <Card className="text-center">
            <Receipt size={24} className="mx-auto mb-2 text-copper" />
            <p className="text-xs text-ink2 mb-1">Transações</p>
            <p className="text-2xl font-bold text-ink">{stats.count}</p>
          </Card>
          <Card className="text-center">
            <TrendingUp size={24} className="mx-auto mb-2 text-green-500" />
            <p className="text-xs text-ink2 mb-1">Média</p>
            <p className="text-2xl font-bold text-ink">{formatCurrency(stats.avg)}</p>
          </Card>
          <Card className="text-center">
            <PiggyBank size={24} className="mx-auto mb-2 text-purple-500" />
            <p className="text-xs text-ink2 mb-1">Gorjetas</p>
            <p className="text-2xl font-bold text-ink">{formatCurrency(stats.tips)}</p>
          </Card>
        </div>

        {/* Type Breakdown */}
        {stats.count > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment vs Street Sales */}
            <Card>
              <h3 className="text-sm font-semibold text-ink mb-3">Origem</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink2">Pagamentos</span>
                    <span className="font-medium text-ink">{formatCurrency(stats.paymentsTotal)} ({stats.paymentsCount})</span>
                  </div>
                  <div className="w-full bg-line bg-opacity-30 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: stats.total > 0 ? `${(stats.paymentsTotal / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink2">Vendas de Rua</span>
                    <span className="font-medium text-ink">{formatCurrency(stats.salesTotal)} ({stats.salesCount})</span>
                  </div>
                  <div className="w-full bg-line bg-opacity-30 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-yellow"
                      style={{ width: stats.total > 0 ? `${(stats.salesTotal / stats.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Method Breakdown */}
            <Card>
              <h3 className="text-sm font-semibold text-ink mb-3">Método de Pagamento</h3>
              <div className="space-y-3">
                {Object.entries(stats.byMethod)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([method, data]) => (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-ink2">{methodLabel(method)}</span>
                        <span className="font-medium text-ink">{formatCurrency(data.total)} ({data.count})</span>
                      </div>
                      <div className="w-full bg-line bg-opacity-30 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: stats.total > 0 ? `${(data.total / stats.total) * 100}%` : '0%',
                            backgroundColor: methodColor(method),
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}

        {/* Driver Ranking */}
        {Object.keys(stats.byDriver).length > 1 && (
          <Card>
            <h3 className="text-sm font-semibold text-ink mb-3">Por Motorista</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(stats.byDriver)
                .sort((a, b) => b.total - a.total)
                .map((d) => (
                  <div key={d.name} className="flex items-center justify-between p-3 bg-line bg-opacity-10 rounded-btn">
                    <div>
                      <p className="font-medium text-ink text-sm">{d.name}</p>
                      <p className="text-xs text-ink2">{d.count} transações</p>
                    </div>
                    <p className="font-bold text-ink">{formatCurrency(d.total)}</p>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Transaction List */}
        <div>
          <h3 className="text-lg font-semibold text-ink mb-3">
            Transações ({filteredEntries.length})
          </h3>
          {filteredEntries.length === 0 ? (
            <EmptyState
              icon="💰"
              title="Nenhum Registo"
              description="Nenhum pagamento ou venda de rua encontrado para este período"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-ink mb-1">
                      {driverNames[entry.driverId] || entry.driverId}
                    </h3>
                    <p className="text-sm text-ink2 mb-2">{formatDate(entry.date)}</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded-btn bg-line bg-opacity-50 text-ink">
                        {methodLabel(entry.method)}
                      </span>
                      {entry.type === 'street_sale' && (
                        <span className="text-xs px-2 py-1 rounded-btn bg-yellow bg-opacity-20 text-ink font-medium">
                          Venda de Rua
                        </span>
                      )}
                      {entry.tourName && (
                        <span className="text-xs px-2 py-1 rounded-btn bg-copper bg-opacity-10 text-copper">
                          {entry.tourName}
                        </span>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-ink2">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink text-lg">{formatCurrency(entry.amount)}</p>
                    {(entry.tipAmount || 0) > 0 && (
                      <p className="text-xs text-green-600">+{formatCurrency(entry.tipAmount || 0)} gorjeta</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  )
}
