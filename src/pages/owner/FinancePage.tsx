import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input, Select } from '../../components/Input'
import { EmptyState } from '../../components/EmptyState'
import { Payment } from '../../lib/types'
import { formatCurrency, formatDate } from '../../lib/format'
import { Download, Wallet } from 'lucide-react'

export const FinancePage: React.FC = () => {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
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

  useEffect(() => {
    applyFilters()
  }, [payments, filters])

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
      setDrivers((data || []).map((d) => ({ id: d.id, name: d.full_name })))
    } catch (err) {
      console.error('Error fetching drivers:', err)
    }
  }

  const applyFilters = () => {
    let filtered = payments

    if (filters.method) {
      filtered = filtered.filter((p) => p.method === filters.method)
    }

    if (filters.driver) {
      filtered = filtered.filter((p) => p.received_by === filters.driver)
    }

    if (filters.startDate) {
      filtered = filtered.filter((p) => new Date(p.received_at) >= new Date(filters.startDate))
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59)
      filtered = filtered.filter((p) => new Date(p.received_at) <= endDate)
    }

    setFilteredPayments(filtered)
  }

  const exportCSV = () => {
    const headers = ['Data', 'Método', 'Motorista', 'Valor', 'Notas']
    const rows = filteredPayments.map((p) => [
      formatDate(p.received_at),
      p.method,
      p.received_by,
      formatCurrency(p.amount),
      p.notes,
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

  const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Finanças</h1>
          {filteredPayments.length > 0 && (
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

        {filteredPayments.length === 0 ? (
          <EmptyState
            icon={<Wallet size={24} />}
            title="Nenhum Pagamento"
            description="Nenhum pagamento encontrado com os filtros selecionados"
          />
        ) : (
          <>
            <Card className="bg-yellow bg-opacity-5 border-yellow">
              <p className="text-sm text-ink2 mb-1">Total</p>
              <p className="text-3xl font-bold text-ink">{formatCurrency(total)}</p>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-ink mb-1">{payment.received_by}</h3>
                    <p className="text-sm text-ink2 mb-2">{formatDate(payment.received_at)}</p>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded-btn bg-line bg-opacity-50 text-ink">
                        {payment.method}
                      </span>
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
          </>
        )}
      </div>
    </OwnerLayout>
  )
}
