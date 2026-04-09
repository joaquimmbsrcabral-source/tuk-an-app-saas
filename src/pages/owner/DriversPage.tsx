import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Input } from '../../components/Input'
import { EmptyState } from '../../components/EmptyState'
import { Profile, Payment } from '../../lib/types'
import { formatCurrency } from '../../lib/format'
import { Plus, Trash2 } from 'lucide-react'

export const DriversPage: React.FC = () => {
  const { profile } = useAuth()
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [commissions, setCommissions] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    phone: '',
  })

  useEffect(() => {
    if (profile) {
      fetchDrivers()
    }
  }, [profile])

  const fetchDrivers = async () => {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('role', 'driver')

      setDrivers(data || [])

      // Fetch commissions (sum of payments per driver)
      const { data: payments } = await supabase
        .from('payments')
        .select('received_by, amount')
        .eq('company_id', profile.company_id)

      const comm: Record<string, number> = {}
      payments?.forEach((p) => {
        if (!comm[p.received_by]) comm[p.received_by] = 0
        comm[p.received_by] += Number(p.amount)
      })
      setCommissions(comm)
    } catch (err) {
      console.error('Error fetching drivers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = () => {
    // Generate invite link
    const inviteLink = `${window.location.origin}/join?company=${profile?.company_id}&email=${encodeURIComponent(inviteForm.email)}`

    // For MVP, open mailto
    const subject = 'Junte-se ao Tuk an App'
    const body = `Olá ${inviteForm.fullName},\n\nClique no link para se juntar à equipa:\n${inviteLink}\n\nAte breve!`
    window.location.href = `mailto:${inviteForm.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    setIsModalOpen(false)
    setInviteForm({ email: '', fullName: '', phone: '' })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza? Isto não pode ser desfeito.')) return
    try {
      await supabase.from('profiles').delete().eq('id', id)
      await fetchDrivers()
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <h1 className="text-xl sm:text-3xl font-bold text-ink">Motoristas</h1>
          <Button onClick={() => setIsModalOpen(true)} variant="primary">
            <Plus size={20} className="mr-2" />
            Convidar Motorista
          </Button>
        </div>

        {drivers.length === 0 ? (
          <EmptyState
            icon="👤"
            title="Nenhum Motorista"
            description="Convide motoristas para sua equipa"
            action={{ label: 'Convidar Motorista', onClick: () => setIsModalOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {drivers.map((driver) => (
              <Card key={driver.id} className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-ink mb-1">{driver.full_name}</h3>
                  <p className="text-sm text-ink2 mb-1">{driver.phone}</p>
                  <p className="text-sm text-ink2 mb-2">Recebido: {formatCurrency(commissions[driver.id] || 0)}</p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-ink2">Comissão %:</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      defaultValue={driver.commission_pct || 0}
                      onBlur={async (e) => {
                        const pct = parseFloat(e.target.value) || 0
                        await supabase.from('profiles').update({ commission_pct: pct }).eq('id', driver.id)
                      }}
                      className="w-20 px-2 py-2 text-sm border border-line rounded-btn min-h-[44px]"
                    />
                  </div>
                </div>
                <Button onClick={() => handleDelete(driver.id)} variant="secondary" size="sm">
                  <Trash2 size={16} />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Convidar Motorista">
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            placeholder="motorista@email.com"
            required
          />
          <Input
            label="Nome Completo"
            value={inviteForm.fullName}
            onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
            placeholder="João Silva"
            required
          />
          <Input
            label="Telefone"
            value={inviteForm.phone}
            onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
            placeholder="+351 9XX XXX XXX"
            required
          />
          <div className="flex gap-2 pt-4">
            <Button onClick={handleInvite} variant="primary" className="flex-1">
              Enviar Convite (Email)
            </Button>
            <Button onClick={() => setIsModalOpen(false)} variant="ghost" className="flex-1">
              Cancelar
            </Button>
          </div>
          <p className="text-xs text-ink2 text-center">Será aberto seu cliente de email para enviar o convite.</p>
        </div>
      </Modal>
    </OwnerLayout>
  )
}
