import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { Input } from '../components/Input'
import { Button } from '../components/Button'

export const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign up the user
      await signUp(email, password)

      // Get the user ID (we need to wait for auth state to update)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Failed to get user')

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{ name: companyName }])
        .select()
        .single()
      if (companyError) throw companyError

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            company_id: company.id,
            role: 'owner',
            full_name: fullName,
            phone,
          },
        ])
      if (profileError) throw profileError

      navigate('/dashboard')
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
          <h1 className="text-2xl font-bold text-ink mb-6 text-center">Criar Conta</h1>

          {error && (
            <div className="bg-copper bg-opacity-10 border border-copper text-copper px-4 py-3 rounded-btn mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Nome Completo"
              placeholder="João Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              type="text"
              label="Nome da Empresa"
              placeholder="Tuk & Roll"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
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
              type="email"
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Conta'}
            </Button>
          </form>

          <p className="text-center text-sm text-ink2 mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-ink font-bold hover:text-copper">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
