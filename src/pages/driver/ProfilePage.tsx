import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { DriverLayout } from '../../components/DriverLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [form, setForm] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.company_id) return
    supabase
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .single()
      .then(({ data }) => {
        if (data) setCompanyName(data.name)
      })
  }, [profile?.company_id])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      await supabase
        .from('profiles')
        .update({
          full_name: form.fullName,
          phone: form.phone,
        })
        .eq('id', profile.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <DriverLayout>
      <div className="p-4 space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-ink">Meu Perfil</h1>

        <Card>
          <h2 className="text-lg font-bold text-ink mb-4">Informações Pessoais</h2>
          <div className="space-y-4">
            <Input
              label="Nome Completo"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="João Silva"
            />
            <Input
              label="Telefone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+351 9XX XXX XXX"
            />
            <Button onClick={handleSave} variant="primary" disabled={saving} className="w-full">
              {saving ? 'Guardando...' : saved ? '\u2713 Guardado!' : 'Guardar'}
            </Button>
            {saved && (
              <p className="text-sm text-green text-center font-medium">Perfil atualizado com sucesso!</p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink mb-2">Empresa</h2>
          <p className="text-base font-600 text-ink mb-1">{companyName || '...'}</p>
          <p className="text-xs text-ink2">Comissão: {profile?.commission_pct ?? 0}%</p>
        </Card>

        <Button onClick={handleSignOut} variant="secondary" className="w-full">
          Sair
        </Button>
      </div>
    </DriverLayout>
  )
}
