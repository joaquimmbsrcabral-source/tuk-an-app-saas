import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input, TextArea } from '../../components/Input'
import { EmptyState } from '../../components/EmptyState'
import { Modal } from '../../components/Modal'
import { TourCatalogItem } from '../../lib/types'
import { Plus, Trash2, Edit2, Map } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const { profile } = useAuth()
  const [company, setCompany] = useState({ name: '', nif: '', default_commission_pct: 0 })
  const [tours, setTours] = useState<TourCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingCo, setSavingCo] = useState(false)
  const [isTourModalOpen, setIsTourModalOpen] = useState(false)
  const [editingTour, setEditingTour] = useState<TourCatalogItem | null>(null)
  const [tourForm, setTourForm] = useState({
    name: '',
    description: '',
    default_price: 0,
    default_duration_min: 60,
    active: true,
  })

  useEffect(() => {
    if (profile) {
      fetchCompany()
      fetchTours()
    }
  }, [profile])

  const fetchCompany = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()
    if (data) {
      setCompany({
        name: data.name || '',
        nif: data.nif || '',
        default_commission_pct: data.default_commission_pct || 0,
      })
    }
    setLoading(false)
  }

  const fetchTours = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('tour_catalog')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: true })
    setTours(data || [])
  }

  const handleSaveCompany = async () => {
    if (!profile) return
    setSavingCo(true)
    await supabase
      .from('companies')
      .update({
        name: company.name,
        nif: company.nif,
        default_commission_pct: parseFloat(company.default_commission_pct.toString()) || 0,
      })
      .eq('id', profile.company_id)
    setSavingCo(false)
  }

  const openNewTour = () => {
    setEditingTour(null)
    setTourForm({ name: '', description: '', default_price: 0, default_duration_min: 60, active: true })
    setIsTourModalOpen(true)
  }

  const openEditTour = (t: TourCatalogItem) => {
    setEditingTour(t)
    setTourForm({
      name: t.name,
      description: t.description || '',
      default_price: t.default_price,
      default_duration_min: t.default_duration_min,
      active: t.active,
    })
    setIsTourModalOpen(true)
  }

  const handleSaveTour = async () => {
    if (!profile) return
    const payload = {
      company_id: profile.company_id,
      name: tourForm.name,
      description: tourForm.description,
      default_price: parseFloat(tourForm.default_price.toString()) || 0,
      default_duration_min: parseInt(tourForm.default_duration_min.toString()) || 60,
      active: tourForm.active,
    }
    if (editingTour) {
      await supabase.from('tour_catalog').update(payload).eq('id', editingTour.id)
    } else {
      await supabase.from('tour_catalog').insert([payload])
    }
    await fetchTours()
    setIsTourModalOpen(false)
  }

  const handleDeleteTour = async (id: string) => {
    if (!window.confirm('Apagar este tour do catálogo?')) return
    await supabase.from('tour_catalog').delete().eq('id', id)
    await fetchTours()
  }

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-3xl font-bold text-ink">Definições</h1>

        <Card>
          <h2 className="text-xl font-bold text-ink mb-4">Informações da Empresa</h2>
          <div className="space-y-4">
            <Input
              label="Nome da Empresa"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              placeholder="Tuk & Roll"
            />
            <Input
              label="NIF"
              value={company.nif}
              onChange={(e) => setCompany({ ...company, nif: e.target.value })}
              placeholder="123456789"
            />
            <Input
              label="Comissão Padrão dos Motoristas (%)"
              type="number"
              value={company.default_commission_pct}
              onChange={(e) => setCompany({ ...company, default_commission_pct: parseFloat(e.target.value) || 0 })}
              min="0"
              max="100"
              step="0.5"
            />
            <p className="text-xs text-ink2 -mt-2">
              Percentagem padrão aplicada aos motoristas sem comissão individual definida.
            </p>
            <Button onClick={handleSaveCompany} variant="primary" disabled={savingCo}>
              {savingCo ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-ink">Catálogo de Tours</h2>
              <p className="text-sm text-ink2">Define os tours que a tua empresa oferece e os preços padrão.</p>
            </div>
            <Button onClick={openNewTour} variant="primary" size="sm">
              <Plus size={18} className="mr-1" />
              Novo Tour
            </Button>
          </div>

          {tours.length === 0 ? (
            <EmptyState
              icon={<Map size={24} />}
              title="Sem tours no catálogo"
              description="Adiciona o primeiro tour para começar a usar preços padrão nas reservas."
              action={{ label: 'Adicionar Tour', onClick: openNewTour }}
            />
          ) : (
            <div className="space-y-3">
              {tours.map((t) => (
                <div key={t.id} className="flex items-start justify-between border border-line rounded-btn p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-ink">{t.name}</h3>
                      {!t.active && (
                        <span className="text-xs px-2 py-0.5 rounded-btn bg-line text-ink2">Inativo</span>
                      )}
                    </div>
                    {t.description && <p className="text-sm text-ink2 mb-1">{t.description}</p>}
                    <p className="text-sm text-ink2">
                      €{Number(t.default_price).toFixed(2)} · {t.default_duration_min} min
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button onClick={() => openEditTour(t)} variant="ghost" size="sm">
                      <Edit2 size={16} />
                    </Button>
                    <Button onClick={() => handleDeleteTour(t.id)} variant="ghost" size="sm">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-ink mb-2">A Tua Conta</h2>
          <p className="text-sm text-ink2 mb-1">Nome: {profile?.full_name}</p>
          <p className="text-sm text-ink2 mb-1">Telefone: {profile?.phone}</p>
          <p className="text-sm text-ink2">Perfil: {profile?.role === 'owner' ? 'Proprietário' : 'Motorista'}</p>
        </Card>
      </div>

      <Modal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        title={editingTour ? 'Editar Tour' : 'Novo Tour'}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={tourForm.name}
            onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })}
            placeholder="Tour Clássico de Lisboa"
            required
          />
          <TextArea
            label="Descrição"
            value={tourForm.description}
            onChange={(e) => setTourForm({ ...tourForm, description: e.target.value })}
            placeholder="Rota, pontos de paragem, etc."
          />
          <Input
            label="Preço Padrão (€)"
            type="number"
            value={tourForm.default_price}
            onChange={(e) => setTourForm({ ...tourForm, default_price: parseFloat(e.target.value) || 0 })}
            step="0.01"
            min="0"
          />
          <Input
            label="Duração Padrão (min)"
            type="number"
            value={tourForm.default_duration_min}
            onChange={(e) => setTourForm({ ...tourForm, default_duration_min: parseInt(e.target.value) || 60 })}
            min="15"
            step="15"
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={tourForm.active}
              onChange={(e) => setTourForm({ ...tourForm, active: e.target.checked })}
            />
            Ativo (aparece nas novas reservas)
          </label>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSaveTour} variant="primary" className="flex-1">
              {editingTour ? 'Guardar' : 'Criar Tour'}
            </Button>
            <Button onClick={() => setIsTourModalOpen(false)} variant="ghost" className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </OwnerLayout>
  )
}
