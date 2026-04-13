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
import { AlertCircle, Plus, Trash2, ChevronRight, Car } from 'lucide-react'

export const FleetPage: React.FC = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tuktuks, setTuktuks] = useState<TukTuk[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    plate: '', nickname: '', status: 'active', color: '', km: 0,
    insurance_expiry: '', next_service_km: 0, notes: '',
  })

  useEffect(() => { fetchTuktuks() }, [profile])

  const fetchTuktuks = async () => {
    if (!profile) return
    try {
      const { data } = await supabase.from('tuktuks').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false })
      setTuktuks(data || [])
    } finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!profile) return
    await supabase.from('tuktuks').insert([{ ...form, company_id: profile.company_id, km: parseInt(form.km.toString()) }])
    await fetchTuktuks()
    setIsModalOpen(false)
    setForm({ plate: '', nickname: '', status: 'active', color: '', km: 0, insurance_expiry: '', next_service_km: 0, notes: '' })
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('Tem certeza?')) return
    await supabase.from('tuktuks').delete().eq('id', id)
    await fetchTuktuks()
  }

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Frota</h1>
          <Button onClick={() => setIsModalOpen(true)} variant="primary">
            <Plus size={20} className="mr-2" />Novo TukTuk
          </Button>
        </div>

        {tuktuks.length === 0 ? (
          <EmptyState icon={<Car size={24} />} title="Nenhum TukTuk" description="Comece a adicionar seus TukTuks à frota" action={{ label: 'Adicionar TukTuk', onClick: () => setIsModalOpen(true) }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tuktuks.map((tk) => {
              const insuranceExpiring = tk.insurance_expiry && new Date(tk.insurance_expiry) < new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
              const serviceNeeded = tk.km >= tk.next_service_km - 500
              return (
                <button
                  key={tk.id}
                  onClick={() => navigate(`/frota/${tk.id}`)}
                  className="text-left bg-white border border-line rounded-card p-5 hover:shadow-md transition-all hover:border-yellow group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow/20 flex items-center justify-center"><Car size={28} className="text-ink" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-ink truncate">{tk.nickname}</h3>
                        <ChevronRight size={18} className="text-ink2 group-hover:text-ink transition-colors" />
                      </div>
                      <p className="text-sm text-ink2 mb-1">Matrícula: {tk.plate}</p>
                      <p className="text-sm text-ink2 mb-3">{tk.color} · {tk.km} km</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-btn ${tk.status === 'active' ? 'bg-green bg-opacity-10 text-green' : 'bg-copper bg-opacity-10 text-copper'}`}>{tk.status}</span>
                        {insuranceExpiring && (
                          <span className="text-xs px-2 py-1 rounded-btn bg-copper bg-opacity-10 text-copper flex items-center gap-1">
                            <AlertCircle size={12} /> Seguro {formatDate(tk.insurance_expiry)}
                          </span>
                        )}
                        {serviceNeeded && (
                          <span className="text-xs px-2 py-1 rounded-btn bg-copper bg-opacity-10 text-copper flex items-center gap-1">
                            <AlertCircle size={12} /> Revisão
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={(e) => handleDelete(e, tk.id)} className="text-copper p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo TukTuk">
        <div className="space-y-4">
          <Input label="Matrícula" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="XX-XX-XX" required />
          <Input label="Apelido" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} placeholder="Amarelo" required />
          <Input label="Cor" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <Input label="KM" type="number" value={form.km} onChange={(e) => setForm({ ...form, km: parseInt(e.target.value) || 0 })} />
          <Input label="Próxima Manutenção (KM)" type="number" value={form.next_service_km} onChange={(e) => setForm({ ...form, next_service_km: parseInt(e.target.value) || 0 })} />
          <Input label="Seguro Expira" type="date" value={form.insurance_expiry} onChange={(e) => setForm({ ...form, insurance_expiry: e.target.value })} />
          <Select label="Status" options={[{ value: 'active', label: 'Ativo' }, { value: 'maintenance', label: 'Manutenção' }, { value: 'retired', label: 'Reformado' }]} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <TextArea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} variant="primary" className="flex-1">Guardar</Button>
            <Button onClick={() => setIsModalOpen(false)} variant="ghost" className="flex-1">Cancelar</Button>
          </div>
          <p className="text-xs text-ink2 text-center">Clica no TukTuk para ver o dashboard completo e editar datas/documentos.</p>
        </div>
      </Modal>
    </OwnerLayout>
  )
}
