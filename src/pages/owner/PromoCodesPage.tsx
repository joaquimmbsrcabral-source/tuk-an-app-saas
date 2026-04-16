import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { StatCard } from '../../components/StatCard'
import { Button } from '../../components/Button'
import { Input, Select } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { EmptyState } from '../../components/EmptyState'
import { formatCurrency, formatDate } from '../../lib/format'
import { Copy, Trash2, ToggleRight, Plus } from 'lucide-react'

interface PromoCode {
  id: string
  company_id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  current_uses: number
  expires_at: string | null
  description: string
  active: boolean
  created_at: string
  created_by: string
}

export const PromoCodesPage: React.FC = () => {
  const { profile } = useAuth()
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [filteredCodes, setFilteredCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: '', // 'active', 'expired', 'inactive'
  })
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    maxUses: '',
    expiryDate: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile) {
      fetchPromoCodes()
    }
  }, [profile])

  useEffect(() => {
    applyFilters()
  }, [promoCodes, filters])

  const fetchPromoCodes = async () => {
    if (!profile) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching promo codes:', error)
        setPromoCodes([])
      } else {
        setPromoCodes(data || [])
      }
    } catch (err) {
      console.error('Error fetching promo codes:', err)
      setPromoCodes([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = promoCodes

    if (filters.status === 'active') {
      filtered = filtered.filter((code) => {
        const isExpired = code.expires_at && new Date(code.expires_at) < new Date()
        return code.active && !isExpired
      })
    } else if (filters.status === 'expired') {
      filtered = filtered.filter((code) => {
        const isExpired = code.expires_at && new Date(code.expires_at) < new Date()
        return isExpired
      })
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter((code) => !code.active)
    }

    setFilteredCodes(filtered)
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile || !formData.code || !formData.discountValue) {
      alert('Por favor, preencha os campos obrigatórios')
      return
    }

    try {
      setSubmitting(true)

      const discountValue = parseFloat(formData.discountValue)
      if (isNaN(discountValue) || discountValue <= 0) {
        alert('Valor de desconto inválido')
        return
      }

      const newPromoCode = {
        company_id: profile.company_id,
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discountType,
        discount_value: discountValue,
        max_uses: formData.maxUses ? parseInt(formData.maxUses, 10) : null,
        current_uses: 0,
        expires_at: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        description: formData.description,
        active: true,
        created_by: profile.id,
      }

      const { data, error } = await supabase
        .from('promo_codes')
        .insert([newPromoCode])
        .select()

      if (error) {
        console.error('Error creating promo code:', error)
        alert(`Erro ao criar código: ${error.message}`)
        return
      }

      setPromoCodes([...promoCodes, ...(data || [])])
      setIsCreateModalOpen(false)
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        maxUses: '',
        expiryDate: '',
        description: '',
      })
    } catch (err) {
      console.error('Error creating promo code:', err)
      alert('Erro ao criar código de promoção')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyToClipboard = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCodeId(codeId)
      setTimeout(() => setCopiedCodeId(null), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  const handleToggleActive = async (codeId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ active: !currentActive })
        .eq('id', codeId)

      if (error) {
        console.error('Error updating promo code:', error)
        alert('Erro ao atualizar código')
        return
      }

      setPromoCodes(promoCodes.map((code) =>
        code.id === codeId ? { ...code, active: !currentActive } : code
      ))
    } catch (err) {
      console.error('Error toggling promo code:', err)
      alert('Erro ao atualizar código')
    }
  }

  const handleDeletePromoCode = async (codeId: string) => {
    if (!confirm('Tem certeza que deseja eliminar este código de promoção?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', codeId)

      if (error) {
        console.error('Error deleting promo code:', error)
        alert('Erro ao eliminar código')
        return
      }

      setPromoCodes(promoCodes.filter((code) => code.id !== codeId))
    } catch (err) {
      console.error('Error deleting promo code:', err)
      alert('Erro ao eliminar código')
    }
  }

  const getCodeStatus = (code: PromoCode): 'active' | 'expired' | 'inactive' => {
    if (!code.active) return 'inactive'
    if (code.expires_at && new Date(code.expires_at) < new Date()) return 'expired'
    return 'active'
  }

  const getStatusLabel = (status: 'active' | 'expired' | 'inactive'): string => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'expired':
        return 'Expirado'
      case 'inactive':
        return 'Inativo'
    }
  }

  const getStatusColor = (status: 'active' | 'expired' | 'inactive'): string => {
    switch (status) {
      case 'active':
        return 'bg-green bg-opacity-10 text-green'
      case 'expired':
        return 'bg-copper bg-opacity-10 text-copper'
      case 'inactive':
        return 'bg-line bg-opacity-50 text-ink2'
    }
  }

  if (loading) {
    return <OwnerLayout><div className="text-center py-12 text-ink2">Carregando...</div></OwnerLayout>
  }

  const totalCodes = promoCodes.length
  const activeCodes = promoCodes.filter((c) => getCodeStatus(c) === 'active').length
  const totalUses = promoCodes.reduce((sum, c) => sum + c.current_uses, 0)
  const estimatedSavings = promoCodes
    .filter((c) => getCodeStatus(c) === 'active')
    .reduce((sum, c) => {
      if (c.discount_type === 'percentage') {
        // Rough estimate: assume average booking €50
        return sum + (50 * c.discount_value / 100) * c.current_uses
      } else {
        return sum + c.discount_value * c.current_uses
      }
    }, 0)

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-ink">Códigos de Promoção</h1>
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <Plus size={20} />
            Criar Código
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total de Códigos"
            value={totalCodes}
            icon="🏷️"
            accent="yellow"
          />
          <StatCard
            label="Códigos Ativos"
            value={activeCodes}
            icon="✅"
            accent="green"
          />
          <StatCard
            label="Utilizações"
            value={totalUses}
            icon="🎯"
            accent="copper"
          />
          <StatCard
            label="Economia Estimada"
            value={formatCurrency(estimatedSavings)}
            icon="💰"
            accent="ink"
            sublabel="(estimado)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Status"
            options={[
              { value: '', label: 'Todos' },
              { value: 'active', label: 'Ativos' },
              { value: 'expired', label: 'Expirados' },
              { value: 'inactive', label: 'Inativos' },
            ]}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          />
        </div>

        {filters.status && (
          <button
            onClick={() => setFilters({ status: '' })}
            className="text-sm text-copper font-medium hover:underline"
          >
            Limpar filtros
          </button>
        )}

        {filteredCodes.length === 0 ? (
          <EmptyState
            icon="🏷️"
            title="Nenhum Código de Promoção"
            description={
              totalCodes === 0
                ? 'Crie seu primeiro código de promoção para aumentar as vendas'
                : 'Nenhum código encontrado com os filtros selecionados'
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCodes.map((code) => {
              const status = getCodeStatus(code)
              const usagePercentage = code.max_uses
                ? Math.round((code.current_uses / code.max_uses) * 100)
                : undefined

              return (
                <Card key={code.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-ink font-mono">{code.code}</h3>
                          <span className={`text-xs px-2 py-1 rounded-btn font-semibold ${getStatusColor(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                          {code.discount_type === 'percentage' ? (
                            <span className="text-xs px-2 py-1 rounded-btn bg-yellow bg-opacity-20 text-yellow font-semibold">
                              {code.discount_value}% OFF
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-btn bg-copper bg-opacity-20 text-copper font-semibold">
                              {formatCurrency(code.discount_value)}
                            </span>
                          )}
                        </div>
                      </div>

                      {code.description && (
                        <p className="text-sm text-ink2 mb-2">{code.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                        <div>
                          <p className="text-ink2 font-medium">Utilizações</p>
                          <p className="text-ink font-semibold">
                            {code.current_uses}
                            {code.max_uses && ` / ${code.max_uses}`}
                          </p>
                          {usagePercentage !== undefined && (
                            <div className="mt-1 bg-line rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-copper h-full transition-all"
                                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {code.expires_at && (
                          <div>
                            <p className="text-ink2 font-medium">Expiração</p>
                            <p className="text-ink font-semibold">{formatDate(code.expires_at)}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-ink2 font-medium">Criado</p>
                          <p className="text-ink font-semibold">{formatDate(code.created_at)}</p>
                        </div>

                        {code.discount_type === 'percentage' ? (
                          <div>
                            <p className="text-ink2 font-medium">Economia Est.</p>
                            <p className="text-ink font-semibold">
                              {formatCurrency((50 * code.discount_value / 100) * code.current_uses)}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-ink2 font-medium">Economia Est.</p>
                            <p className="text-ink font-semibold">
                              {formatCurrency(code.discount_value * code.current_uses)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyToClipboard(code.code, code.id)}
                        className="w-10 h-10 p-0 flex items-center justify-center"
                        title={copiedCodeId === code.id ? 'Copiado!' : 'Copiar código'}
                      >
                        <Copy
                          size={18}
                          className={copiedCodeId === code.id ? 'text-green' : ''}
                        />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(code.id, code.active)}
                        className={`w-10 h-10 p-0 flex items-center justify-center ${
                          code.active ? 'text-green' : 'text-ink2'
                        }`}
                        title={code.active ? 'Desativar' : 'Ativar'}
                      >
                        <ToggleRight size={18} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePromoCode(code.id)}
                        className="w-10 h-10 p-0 flex items-center justify-center text-copper hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Criar Código de Promoção"
        size="lg"
      >
        <form onSubmit={handleCreatePromoCode} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink">Código *</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ex: SUMMER20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="flex-1"
                disabled={submitting}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={generateCode}
                disabled={submitting}
                className="px-4"
              >
                Gerar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">Tipo de Desconto *</label>
              <Select
                options={[
                  { value: 'percentage', label: 'Percentagem (%)' },
                  { value: 'fixed', label: 'Valor Fixo (€)' },
                ]}
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">
                {formData.discountType === 'percentage' ? 'Percentagem (%)' : 'Valor (€)'} *
              </label>
              <Input
                type="number"
                step={formData.discountType === 'percentage' ? '0.1' : '0.01'}
                min="0"
                placeholder={formData.discountType === 'percentage' ? '10' : '5.00'}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">Usos Máximos</label>
              <Input
                type="number"
                min="1"
                placeholder="Ilimitado"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-ink">Data de Expiração</label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink">Descrição</label>
            <textarea
              placeholder="Ex: Desconto para clientes novos"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-xl border border-line bg-cream text-ink placeholder-ink2 focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={submitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Criando...' : 'Criar Código'}
            </Button>
          </div>
        </form>
      </Modal>
    </OwnerLayout>
  )
}
