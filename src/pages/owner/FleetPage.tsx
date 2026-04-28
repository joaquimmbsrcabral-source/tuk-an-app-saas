import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { Input, TextArea, Select } from '../../components/Input'
import { EmptyState } from '../../components/EmptyState'
import { TukTuk } from '../../lib/types'
import { formatDate } from '../../lib/format'
import { AlertCircle, Plus, Trash2 } from 'lucide-react'

export const FleetPage: React.FC = () => {
  const { profile } = useAuth()
  const [tuktuks, setTuktuks] = useState<TukTuk[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [planLimit, setPlanLimit] = useState({ maxTuktuks: 2, plan: 'starter' as string })
  const [form, setForm] = useState({
    plate: '',
    nickname: '',
    status: 'active',
    color: '',
    km: 0,
    insurance_expiry: '',
    next_service_km: 0,
    notes: '',
  })

  useEffect(() => {
    fetchTuktuks()
  }, [profile])

  const fetchTuktuks = async () => {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('tuktuks')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
      setTuktuks(data || [])
      // Fetch plan limits
      const { data: companyData } = await supabase
        .from('companies')
        .select('plan, plan_max_tuktuks')
        .eq('id', profile.company_id)
        .single()
      if (companyData) {
        setPlanLimit({ maxTuktuks: companyData.plan_max_tuktuks || 2, plan: companyData.plan || 'starter' })
      }
    } catch (err) {
      console.error('Error fetching tuktuks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      if (editingId) {
        await supabase.from('tuktuks').update(form).eq('id', editingId)
      } else {
        await supabase
          .from('tuktuks')
          .insert([{ ...form, company_id: profile.company_id, km: parseInt(form.km.toString()) }])
      }
      await fetchTuktuks()
      setIsModalOpen(false)
      setEditingId(null)
      setForm({ plate: '', nickname: '', status: 'active', color: '', km: 0, insurance_expiry: '', next_service_km: 0, notes: '' })
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza?')) return
    try {
      await supabase.from('tuktuks').delete().eq('id', id)
      await fetchTuktuks()
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const handleEdit = (tk: TukTuk) => {
    setEditingId(tk.id)
    setForm({
      plate: tk.plate,
      nickname: tk.nickname,
      status: tk.status,
      color: tk.color,
      km: tk.km,
      insurance_expiry: tk.insurance_expiry || '',
      next_service_km: tk.next_service_km,
      notes: tk.notes || '',
    })
    setIsModalOpen(true)
  }

  const openNewModal = () => {
    setEditingId(null)
    setForm({ plate: '', nickname: '', status: 'active', color: '', km: 0, insurance_expiry: '', next_service_km: 0, notes: '' })
    setIsModalOpen(true)
  }

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Frota</h1>
          <Button
            onClick={() => {
              if (planLimit.plan === 'starter' && tuktuks.length >= planLimit.maxTuktuks) {
                alert(`Limite do plano Starter atingido (${planLimit.maxTuktuks} TukTuks). Faz upgrade para o plano Pro para adicionar mais.`)
                return
              }
              openNewModal()
            }}
            variant="primary"
          >
            <Plus size={20} className="mr-2" />
            Novo TukTuk
          </Button>
        </div>

        {tuktuks.length === 0 ? (
          <EmptyState
            icon="🛺"
            title="Nenhum TukTuk"
            description="Comece a adicionar seus TukTuks à frota"
            action={{ label: 'Adicionar TukTuk', onClick: openNewModal }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tuktuks.map((tk) => {
              const insuranceExpiring = new Date(tk.insurance_expiry) < new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
              const serviceNeeded = tk.km >= tk.next_service_km - 500

              return (
                <Card key={tk.id} className="flex items-start justify-between cursor-pointer hover:border-copper transition-colors" onClick={() => handleEdit(tk)}>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-ink mb-1">{tk.nickname}</h3>
                    <p className="text-sm text-ink2 mb-2">Matrícula: {tk.plate}</p>
                    <p className="text-sm text-ink2 mb-2">Cor: {tk.color} | KM: {tk.km}</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-btn ${tk.status === 'active' ? 'bg-green bg-opacity-10 text-green' : tk.status === 'maintenance' ? 'bg-yellow bg-opacity-10 text-ink' : 'bg-copper bg-opacity-10 text-copper'}`}>
                        {tk.status === 'active' ? 'Ativo' : tk.status === 'maintenance' ? 'Manutenção' : tk.status === 'retired' ? 'Reformado' : tk.status}
                      </span>
                      {insuranceExpiring && (
                        <span className="text-xs px-2 py-1 rounded-btn bg-copper bg-opacity-10 text-copper flex items-center gap-1">
                          <AlertCircle size={14} /> Seguro expira: {formatDate(tk.insurance_expiry)}
                        </span>
                      )}
                      {serviceNeeded && (
                        <span className="text-xs px-2 py-1 rounded-btn bg-copper bg-opacity-10 text-copper flex items-center gap-1">
                          <AlertCircle size={14} /> Serviço em {tk.next_service_km - tk.km} KM
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button onClick={() => handleEdit(tk)} variant="ghost" size="sm">
                      Editar
                    </Button>
                    <Button onClick={() => handleDelete(tk.id)} variant="secondary" size="sm">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar TukTuk' : 'Novo TukTuk'}>
        <div className="space-y-4">
          <Input
            label="Matrícula"
            value={form.plate}
            onChange={(e) => setForm({ ...form, plate: e.target.value })}
            placeholder="XX-XX-XX"
            required
          />
          <Input
            label="Apelido"
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            placeholder="Amarelo"
            required
          />
          <Input
            label="Cor"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            placeholder="Amarelo"
          />
          <Input
            label="KM"
            type="number"
            value={form.km}
            onChange={(e) => setForm({ ...form, km: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Próxima Manutenção (KM)"
            type="number"
            value={form.next_service_km}
            onChange={(e) => setForm({ ...form, next_service_km: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Seguro Expira"
            type="date"
            value={form.insurance_expiry}
            onChange={(e) => setForm({ ...form, insurance_expiry: e.target.value })}
          />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Ativo' },
              { value: 'maintenance', label: 'Manutenção' },
              { value: 'retired', label: 'Reformado' },
            ]}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          />
          <TextArea
            label="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Alguma nota..."
          />
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button onClick={() => setIsModalOpen(false)} variant="ghost" className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </OwnerLayout>
  )
}
