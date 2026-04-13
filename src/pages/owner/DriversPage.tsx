import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Input } from '../../components/Input'
import { EmptyState } from '../../components/EmptyState'
import { Profile } from '../../lib/types'
import { formatCurrency } from '../../lib/format'
import { Plus, Trash2, ChevronRight, UserPlus } from 'lucide-react'

export const DriversPage: React.FC = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [commissions, setCommissions] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', fullName: '', phone: '' })

  useEffect(() => { if (profile) fetchDrivers() }, [profile])

  const fetchDrivers = async () => {
    if (!profile) return
    try {
      const { data } = await supabase.from('profiles').select('*').eq('company_id', profile.company_id).eq('role', 'driver')
      setDrivers(data || [])

      const { data: bookings } = await supabase
        .from('bookings')
        .select('driver_id, price')
        .eq('company_id', profile.company_id)
        .eq('status', 'completed')
      const comm: Record<string, number> = {}
      ;(bookings || []).forEach((b: any) => {
        if (!b.driver_id) return
        comm[b.driver_id] = (comm[b.driver_id] || 0) + Number(b.price || 0)
      })
      setCommissions(comm)
    } finally { setLoading(false) }
  }

  const handleInvite = () => {
    const inviteLink = `${window.location.origin}/join?company=${profile?.company_id}&email=${encodeURIComponent(inviteForm.email)}`
    const subject = 'Junte-se ao Tuk an App'
    const body = `Olá ${inviteForm.fullName},\n\nClique no link para se juntar à equipa:\n${inviteLink}\n\nAte breve!`
    window.location.href = `mailto:${inviteForm.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setIsModalOpen(false)
    setInviteForm({ email: '', fullName: '', phone: '' })
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('Tem certeza? Isto não pode ser desfeito.')) return
    await supabase.from('profiles').delete().eq('id', id)
    await fetchDrivers()
  }

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Motoristas</h1>
          <Button onClick={() => setIsModalOpen(true)} variant="primary">
            <Plus size={20} className="mr-2" />Convidar Motorista
          </Button>
        </div>

        {drivers.length === 0 ? (
          <EmptyState icon={<UserPlus size={24} />} title="Nenhum Motorista" description="Convide motoristas para sua equipa" action={{ label: 'Convidar Motorista', onClick: () => setIsModalOpen(true) }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.map((driver) => (
              <button
                key={driver.id}
                onClick={() => navigate(`/motoristas/${driver.id}`)}
                className="text-left bg-white border border-line rounded-card p-5 hover:shadow-md transition-all hover:border-yellow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-yellow flex items-center justify-center text-xl font-bold text-ink shrink-0">
                    {driver.full_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-ink truncate">{driver.full_name}</h3>
                      <ChevronRight size={18} className="text-ink2 group-hover:text-ink transition-colors" />
                    </div>
                    <p className="text-sm text-ink2 truncate">{driver.phone}</p>
                    <p className="text-sm text-ink2">Bruto: {formatCurrency(commissions[driver.id] || 0)} · Comissão {driver.commission_pct || 0}%</p>
                    <div className="mt-1">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${driver.status === 'available' ? 'bg-green' : driver.status === 'busy' ? 'bg-copper' : 'bg-ink2'}`}></span>
                      <span className="text-xs text-ink2">{driver.status || 'offline'}</span>
                    </div>
                  </div>
                  <button onClick={(e) => handleDelete(e, driver.id)} className="text-copper p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Convidar Motorista">
        <div className="space-y-4">
          <Input label="Email" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="motorista@email.com" required />
          <Input label="Nome Completo" value={inviteForm.fullName} onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })} placeholder="João Silva" required />
          <Input label="Telefone" value={inviteForm.phone} onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })} placeholder="+351 9XX XXX XXX" required />
          <div className="flex gap-2 pt-4">
            <Button onClick={handleInvite} variant="primary" className="flex-1">Enviar Convite (Email)</Button>
            <Button onClick={() => setIsModalOpen(false)} variant="ghost" className="flex-1">Cancelar</Button>
          </div>
        </div>
      </Modal>
    </OwnerLayout>
  )
}
