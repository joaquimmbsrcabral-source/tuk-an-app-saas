import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { Input } from '../components/Input'
import { Button } from '../components/Button'

export const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState(searchParams.get('code') || '')
  const [inviteId, setInviteId] = useState<string | null>(null)
  const [codeChecking, setCodeChecking] = useState(false)
  const [codeValid, setCodeValid] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (code) validateCode(code)
  }, [])

  const validateCode = async (c: string) => {
    setCodeChecking(true)
    setError('')
    setCodeValid(false)
    setInviteId(null)
    try {
      const { data, error: e } = await supabase
        .from('signup_invites')
        .select('id, used_at, expires_at')
        .eq('code', c.trim())
        .maybeSingle()
      if (e || !data) { setError('Código de convite inválido'); return }
      if (data.used_at) { setError('Este código já foi usado'); return }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setError('Código expirado'); return }
      setInviteId(data.id)
      setCodeValid(true)
    } finally {
      setCodeChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!codeValid || !inviteId) { setError('Precisas de um código de convite válido'); return }
    setLoading(true)
    try {
      await signUp(email, password)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        throw new Error('Conta criada. Verifica o teu email para confirmar antes de entrar.')
      }
      const { error: rpcError } = await supabase.rpc('signup_owner', {
        p_company_name: companyName,
        p_full_name: fullName,
        p_phone: phone,
      })
      if (rpcError) throw rpcError
      // Mark invite as used
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('signup_invites').update({ used_at: new Date().toISOString(), used_by: user?.id }).eq('id', inviteId)
      window.location.replace('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Falha ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="bg-card border border-line rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-ink mb-6 text-center">Criar Conta</h1>
          {error && (
            <div className="bg-copper bg-opacity-10 border border-copper text-copper px-4 py-3 rounded-btn mb-4 text-sm">{error}</div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-1">Código de Convite</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setCodeValid(false); setInviteId(null) }}
                placeholder="ex: AMIGO-2026"
                className="flex-1 px-3 py-2 border border-line rounded-btn bg-white text-ink"
                disabled={codeValid}
              />
              {!codeValid ? (
                <Button type="button" variant="ghost" onClick={() => validateCode(code)} disabled={!code || codeChecking}>
                  {codeChecking ? '...' : 'Validar'}
                </Button>
              ) : (
                <span className="px-3 py-2 text-green font-bold">✓</span>
              )}
            </div>
            <p className="text-xs text-ink2 mt-1">Precisas de um código para criar conta. Pede ao administrador.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="text" label="Nome Completo" placeholder="João Silva" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input type="text" label="Nome da Empresa" placeholder="Tuk & Roll" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            <Input type="tel" label="Telefone" placeholder="+351 9XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <Input type="email" label="Email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" label="Senha" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" variant="primary" className="w-full" disabled={loading || !codeValid}>
              {loading ? 'Criando...' : 'Criar Conta'}
            </Button>
          </form>
          <p className="text-center text-sm text-ink2 mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-ink font-bold hover:text-copper">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
