import React, { useState } from 'react'
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
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink mb-2">Empresa</h2>
          <p className="text-sm text-ink2 mb-4">Company ID: {profile?.company_id}</p>
        </Card>

        <Button onClick={handleSignOut} variant="secondary" className="w-full">
          Sair
        </Button>
      </div>
    </DriverLayout>
  )
}
