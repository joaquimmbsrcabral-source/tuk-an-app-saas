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
import { Download } from 'lucide-react'

type FinanceEntry = {
  id: string
  type: 'payment' | 'street_sale'
  date: string
  amount: number
  method: string
  driverId: string
  notes: string
  tourName?: string
}

export const FinancePage: React.FC = () => {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    method: '',
    driver: '',
    startDate: '',
    endDate: '',
  })
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([])
  const [driverNames, setDriverNames] = useState<Record<string, string>>({})
  const [streetSales, setStreetSales] = useState<StreetSale[]>([])

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
    }))
    return [...paymentEntries, ...saleEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [payments, streetSales])

  const filteredEntries = useMemo(() => {
    let filtered = entries
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
  }, [entries, filters])

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

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Método', 'Motorista', 'Valor', 'Notas']
    const rows = filteredEntries.map((e) => [
      formatDate(e.date),
      e.type === 'street_sale' ? 'Venda de Rua' : 'Pagamento',
      methodLabel(e.method),
      driverNames[e.driverId] || e.driverId,
      formatCurrency(e.amount),
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

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  const total = filteredEntries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Finanças</h1>
          {(filteredEntries.length > 0) && (
            <Button onClick={exportCSV} variant="ghost">
              <Download size={20} className="mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>

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

        {filteredEntries.length === 0 ? (
          <EmptyState
            icon="💰"
            title="Nenhum Registo"
            description="Nenhum pagamento ou venda de rua encontrado com os filtros selecionados"
          />
        ) : (
          <>
            <Card className="bg-yellow bg-opacity-5 border-yellow">
              <p className="text-sm text-ink2 mb-1">Total</p>
              <p className="text-3xl font-bold text-ink">{formatCurrency(total)}</p>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-ink mb-1">
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
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </OwnerLayout>
  )
}
