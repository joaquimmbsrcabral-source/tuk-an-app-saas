import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { AlertCircle, Plus, Wrench, CheckCircle, XCircle, ChevronRight } from 'lucide-react'

export const FleetPage: React.FC = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tuktuks, setTuktuks] = useState<TukTuk[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
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
      await supabase
        .from('tuktuks')
        .insert([{ ...form, company_id: profile.company_id, km: parseInt(form.km.toString()) }])
      await fetchTuktuks()
      setIsModalOpen(false)
      setForm({ plate: '', nickname: '', status: 'active', color: '', km: 0, insurance_expiry: '', next_service_km: 0, notes: '' })
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  const openNewModal = () => {
    setForm({ plate: '', nickname: '', status: 'active', color: '', km: 0, insurance_expiry: '', next_service_km: 0, notes: '' })
    setIsModalOpen(true)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Ativo', bg: 'bg-green bg-opacity-10', text: 'text-green', icon: CheckCircle }
      case 'maintenance':
        return { label: 'Manuten\u00e7\u00e3o', bg: 'bg-yellow bg-opacity-20', text: 'text-ink', icon: Wrench }
      case 'retired':
        return { label: 'Reformado', bg: 'bg-copper bg-opacity-10', text: 'text-copper', icon: XCircle }
      default:
        return { label: status, bg: 'bg-line', text: 'text-ink2', icon: AlertCircle }
    }
  }

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink">Frota</h1>
            <p className="text-ink2 mt-1">{tuktuks.length} TukTuk{tuktuks.length !== 1 ? 's' : ''} registado{tuktuks.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={openNewModal} variant="primary">
            <Plus size={20} className="mr-2" />
            Novo TukTuk
          </Button>
        </div>

        {tuktuks.length === 0 ? (
          <EmptyState
            icon="\ud83d\udefa"
            title="Nenhum TukTuk"
            description="Comece a adicionar seus TukTuks \u00e0 frota"
            action={{ label: 'Adicionar TukTuk', onClick: openNewModal }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tuktuks.map((tk) => {
              const statusConfig = getStatusConfig(tk.status)
              const StatusIcon = statusConfig.icon
              const insuranceExpiring = tk.insurance_expiry && new Date(tk.insurance_expiry) < new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
              const serviceNeeded = tk.next_service_km > 0 && tk.km >= tk.next_service_km - 500

              return (
                <div
                  key={tk.id}
                  onClick={() => navigate(`/frota/${tk.id}`)}
                  className="bg-card border border-line rounded-btn p-5 cursor-pointer hover:border-yellow hover:shadow-md transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow bg-opacity-20 rounded-btn flex items-center justify-center text-2xl">
                        {'\ud83d\udefa'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-ink group-hover:text-yellow transition-colors">{tk.nickname}</h3>
                        <p className="text-sm text-ink2">{tk.plate}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-ink2 group-hover:text-yellow transition-colors mt-1" />
                  </div>

                  {/* Info row */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-ink2">
                    {tk.color && <span>{tk.color}</span>}
                    <span>{tk.km.toLocaleString()} km</span>
                  </div>

                  {/* Status + alerts */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-btn font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                      <StatusIcon size={13} />
                      {statusConfig.label}
                    </span>

                    {insuranceExpiring && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-btn bg-copper bg-opacity-10 text-copper font-medium">
                        <AlertCircle size={13} />
                        Seguro
                      </span>
                    )}

                    {serviceNeeded && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-btn bg-copper bg-opacity-10 text-copper font-medium">
                        <Wrench size={13} />
                        Revis\u00e3o
                      </span>
                    )}
                  </div>

                  {/* Bottom info */}
                  {tk.insurance_expiry && (
                    <div className="mt-4 pt-3 border-t border-line text-xs text-ink2">
                      Seguro: {formatDate(tk.insurance_expiry)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New TukTuk Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo TukTuk">
        <div className="space-y-4">
          <Input
            label="Matr\u00edcula"
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
            label="Pr\u00f3xima Manuten\u00e7\u00e3o (KM)"
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
              { value: 'maintenance', label: 'Manuten\u00e7\u00e3o' },
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
