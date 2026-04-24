import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Plus, Trash2, Copy, Check, ChevronRight } from 'lucide-react'
import { StatusBadge } from '../../components/StatusBadge'

export const DriversPage: React.FC = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [commissions, setCommissions] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    phone: '',
  })
  const [linkCopied, setLinkCopied] = useState(false)
  const [planLimit, setPlanLimit] = useState({ maxDrivers: 3, plan: 'starter' as string })

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

      // Fetch plan limits
      const { data: companyData } = await supabase
        .from('companies')
        .select('plan, plan_max_drivers')
        .eq('id', profile.company_id)
        .single()
      if (companyData) {
        setPlanLimit({ maxDrivers: companyData.plan_max_drivers || 3, plan: companyData.plan || 'starter' })
      }
    } catch (err) {
      console.error('Error fetching drivers:', err)
    } finally {
      setLoading(false)
    }
  }

  const getInviteLink = () =>
    `${window.location.origin}/join?company=${profile?.company_id}&email=${encodeURIComponent(inviteForm.email)}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getInviteLink())
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = getInviteLink()
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  const handleInvite = () => {
    const inviteLink = getInviteLink()
    const subject = 'Junte-se ao Tuk an App'
    const body = `Ol\u00e1 ${inviteForm.fullName},\n\nClique no link para se juntar \u00e0 equipa:\n${inviteLink}\n\nAte breve!`
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Motoristas</h1>
          <Button
            onClick={() => {
              if (planLimit.plan === 'starter' && drivers.length >= planLimit.maxDrivers) {
                alert(`Limite do plano Starter atingido (${planLimit.maxDrivers} motoristas). Faz upgrade para o plano Pro para adicionar mais.`)
                return
              }
              setIsModalOpen(true)
            }}
            variant="primary"
          >
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
              <Card
                key={driver.id}
                className="flex items-center gap-4 cursor-pointer hover:shadow-card-md transition-all duration-200"
                onClick={() => navigate(`/motoristas/${driver.id}`)}
              >
                <div className="w-12 h-12 rounded-full bg-yellow flex items-center justify-center text-ink font-black text-lg flex-shrink-0">
                  {(driver.full_name || 'M').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-lg font-bold text-ink truncate">{driver.full_name}</h3>
                    <StatusBadge status={driver.status || 'offline'} size="sm" />
                  </div>
                  <p className="text-sm text-ink2">{driver.phone}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-ink2">Recebido: <span className="font-semibold text-ink">{formatCurrency(commissions[driver.id] || 0)}</span></span>
                    <span className="text-xs text-ink2">Comissão: <span className="font-semibold text-ink">{driver.commission_pct || 0}%</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleDelete(driver.id) }}
                    variant="secondary"
                    size="sm"
                  >
                    <Trash2 size={16} />
                  </Button>
                  <ChevronRight size={20} className="text-ink2" />
                </div>
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
            <Button onClick={handleInvite} variant="primary" className="flex-1" disabled={!inviteForm.email}>
              Enviar Convite (Email)
            </Button>
            <Button onClick={handleCopyLink} variant="secondary" className="flex-1" disabled={!inviteForm.email}>
              {linkCopied ? <><Check size={16} className="mr-1" /> Copiado!</> : <><Copy size={16} className="mr-1" /> Copiar Link</>}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsModalOpen(false)} variant="ghost" className="flex-1">
              Cancelar
            </Button>
          </div>
          <p className="text-xs text-ink2 text-center">Envia por email ou copia o link para partilhar por WhatsApp/SMS.</p>
        </div>
      </Modal>
    </OwnerLayout>
  )
}
