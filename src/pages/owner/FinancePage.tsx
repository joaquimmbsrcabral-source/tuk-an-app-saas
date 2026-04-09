import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Input, Select } from '../../components/Input'
import { EmptyState } from '../../components/EmptyState'
import { formatCurrency } from '../../lib/format'

type Sale = {
  id: string
  driver_id: string | null
  tour_name: string | null
  pax: number | null
  price: number
  payment_method: string | null
  tip_amount: number | null
  sold_at: string
  notes: string | null
}

export const FinancePage: React.FC = () => {
  const { profile } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [filtered, setFiltered] = useState<Sale[]>([])
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ method: '', driver: '', startDate: '', endDate: '' })

  useEffect(() => {
    if (profile?.company_id) {
      fetchSales()
      fetchDrivers()
    }
  }, [profile])

  useEffect(() => { applyFilters() }, [sales, filters])

  const fetchSales = async () => {
    if (!profile?.company_id) return
    try {
      const { data, error } = await supabase
        .from('street_sales')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('sold_at', { ascending: false })
      if (error) throw error
      setSales((data as any) || [])
    } catch (err) {
      console.error('Error fetching sales:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    if (!profile?.company_id) return
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('company_id', profile.company_id)
      .eq('role', 'driver')
    setDrivers((data || []).map((d: any) => ({ id: d.id, name: d.full_name })))
  }

  const applyFilters = () => {
    let f = sales
    if (filters.method) f = f.filter((s) => s.payment_method === filters.method)
    if (filters.driver) f = f.filter((s) => s.driver_id === filters.driver)
    if (filters.startDate) f = f.filter((s) => new Date(s.sold_at) >= new Date(filters.startDate))
    if (filters.endDate) f = f.filter((s) => new Date(s.sold_at) <= new Date(filters.endDate + 'T23:59:59'))
    setFiltered(f)
  }

  const total = filtered.reduce((sum, s) => sum + Number(s.price || 0), 0)
  const tips = filtered.reduce((sum, s) => sum + Number(s.tip_amount || 0), 0)

  const driverName = (id: string | null) => drivers.find((d) => d.id === id)?.name || '—'

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Finanças</h1>
          <p className="text-ink2 text-sm">Todas as tours vendidas pela tua equipa.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-ink2 mb-1">Total vendas</p>
            <p className="text-3xl font-bold text-ink">{formatCurrency(total)}</p>
          </Card>
          <Card>
            <p className="text-sm text-ink2 mb-1">Gorjetas</p>
            <p className="text-3xl font-bold text-ink">{formatCurrency(tips)}</p>
          </Card>
          <Card>
            <p className="text-sm text-ink2 mb-1">Nº de tours</p>
            <p className="text-3xl font-bold text-ink">{filtered.length}</p>
          </Card>
        </div>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <Select
              label="Método"
              value={filters.method}
              onChange={(e) => setFilters({ ...filters, method: e.target.value })}
              options={[
                { value: '', label: 'Todos' },
                { value: 'cash', label: 'Dinheiro' },
                { value: 'card', label: 'Cartão' },
                { value: 'mbway', label: 'MB Way' },
                { value: 'other', label: 'Outro' },
              ]}
            />
            <Select
              label="Motorista"
              value={filters.driver}
              onChange={(e) => setFilters({ ...filters, driver: e.target.value })}
              options={[{ value: '', label: 'Todos' }, ...drivers.map((d) => ({ value: d.id, label: d.name }))]}
            />
            <Input label="De" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            <Input label="Até" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </div>

          {loading ? (
            <div className="text-center py-8 text-ink2">A carregar...</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Sem vendas" description="Ainda não há tours vendidas para mostrar." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ink2">
                    <th className="py-2 pr-4">Data</th>
                    <th className="py-2 pr-4">Tour</th>
                    <th className="py-2 pr-4">Pax</th>
                    <th className="py-2 pr-4">Motorista</th>
                    <th className="py-2 pr-4">Método</th>
                    <th className="py-2 pr-4 text-right">Preço</th>
                    <th className="py-2 pr-4 text-right">Gorjeta</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-line">
                      <td className="py-2 pr-4 text-ink2">{new Date(s.sold_at).toLocaleString('pt-PT')}</td>
                      <td className="py-2 pr-4 font-medium text-ink">{s.tour_name || '—'}</td>
                      <td className="py-2 pr-4">{s.pax || '—'}</td>
                      <td className="py-2 pr-4 text-ink2">{driverName(s.driver_id)}</td>
                      <td className="py-2 pr-4 text-ink2">{s.payment_method || '—'}</td>
                      <td className="py-2 pr-4 text-right font-medium text-ink">{formatCurrency(Number(s.price || 0))}</td>
                      <td className="py-2 pr-4 text-right text-ink2">{formatCurrency(Number(s.tip_amount || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </OwnerLayout>
  )
}
