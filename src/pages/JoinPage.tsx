import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { Input } from '../components/Input'
import { Button } from '../components/Button'

export const JoinPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUp } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const email = searchParams.get('email') || ''
  const companyId = searchParams.get('company') || ''

  useEffect(() => {
    if (!email || !companyId) {
      setError('Link de convite inválido')
    }
  }, [email, companyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        throw new Error('Conta criada. Verifica o teu email para confirmar antes de entrar.')
      }

      const { error: rpcError } = await supabase.rpc('signup_driver', {
        p_company_id: companyId,
        p_full_name: fullName,
        p_phone: phone,
      })
      if (rpcError) throw rpcError

      window.location.replace('/driver/today')
    } catch (err: any) {
      setError(err.message || 'Falha ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-card border border-line rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-ink mb-6 text-center">Entrar na Equipa</h1>

          {error && (
            <div className="bg-copper bg-opacity-10 border border-copper text-copper px-4 py-3 rounded-btn mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-line bg-opacity-20 px-4 py-3 rounded-btn">
              <p className="text-sm text-ink2 mb-1">Email de Convite</p>
              <p className="font-600 text-ink">{email}</p>
            </div>

            <Input
              type="text"
              label="Nome Completo"
              placeholder="João da Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              type="tel"
              label="Telefone"
              placeholder="+351 9XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              type="password"
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              label="Confirmar Senha"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Criar Conta e Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
