import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'

export const SettingsPage: React.FC = () => {
  const { profile } = useAuth()
  const [company, setCompany] = useState({ name: '', nif: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      fetchCompany()
    }
  }, [profile])

  const fetchCompany = async () => {
    if (!profile) return
    try {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single()

      if (data) {
        setCompany({ name: data.name || '', nif: data.nif || '' })
      }
    } catch (err) {
      console.error('Error fetching company:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      await supabase
        .from('companies')
        .update({ name: company.name, nif: company.nif })
        .eq('id', profile.company_id)
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-2xl">
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
            <Button onClick={handleSave} variant="primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Alterações'}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-ink mb-2">Sua Conta</h2>
          <p className="text-sm text-ink2 mb-4">Nome: {profile?.full_name}</p>
          <p className="text-sm text-ink2 mb-4">Telefone: {profile?.phone}</p>
          <p className="text-sm text-ink2">Role: {profile?.role === 'owner' ? 'Proprietário' : 'Motorista'}</p>
        </Card>
      </div>
    </OwnerLayout>
  )
}
