import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { Check, X, Loader2, BarChart3, Users, Calendar } from 'lucide-react'

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
        .select('id, code, used')
        .eq('code', c.trim().toUpperCase())
        .maybeSingle()
      if (e) throw e
      if (data && !data.used) {
        setCodeValid(true)
        setInviteId(data.id)
      } else {
        setError(data?.used ? 'Este codigo ja foi utilizado' : 'Codigo de convite invalido')
      }
    } catch {
      setError('Erro ao validar codigo')
    } finally {
      setCodeChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeValid) { setError('Introduz um codigo de convite valido'); return }
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, {
        full_name: fullName,
        company_name: companyName,
        phone,
        invite_id: inviteId,
      })
      if (inviteId) {
        await supabase.from('signup_invites').update({ used: true, used_by: email }).eq('id', inviteId)
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Falha ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <Logo variant="light" size="lg" />
          <h1 className="mt-16 text-4xl font-extrabold text-white leading-tight">
            Comeca a gerir<br />
            <span className="text-yellow">o teu negocio</span><br />
            hoje mesmo.
          </h1>
          <p className="mt-6 text-lg text-white/60 max-w-md leading-relaxed">
            Junta-te a dezenas de operadores de TukTuk que ja usam a Tuk an App para crescer o seu negocio.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-white/70">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-yellow" />
            </div>
            <span className="text-sm">Dashboard com metricas em tempo real</span>
          </div>
          <div className="flex items-center gap-3 text-white/70">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow" />
            </div>
            <span className="text-sm">Gestao completa de motoristas</span>
          </div>
          <div className="flex items-center gap-3 text-white/70">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow" />
            </div>
            <span className="text-sm">Reservas online automaticas</span>
          </div>
        </div>

        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-yellow/5" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-copper/5" />
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-cream">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <Logo size="lg" />
          </div>

          <h2 className="text-3xl font-extrabold text-ink">Criar conta</h2>
          <p className="mt-2 text-ink2">Preenche os dados para comecar</p>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* Invite code */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Codigo de convite *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="EX: TUKTUK2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 bg-white border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow transition-all font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => validateCode(code)}
                  disabled={!code || codeChecking}
                  className="px-4 py-2.5 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
                >
                  {codeChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validar'}
                </button>
              </div>
              {codeValid && (
                <p className="mt-1.5 text-sm text-green flex items-center gap-1">
                  <Check className="w-4 h-4" /> Codigo valido
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Nome completo" placeholder="Joaquim Silva" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <Input label="Empresa" placeholder="Lisboa TukTuks" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>

            <Input label="Telefone" type="tel" placeholder="+351 912 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Email" type="email" placeholder="tu@empresa.pt" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" placeholder="Min. 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required />

            <Button type="submit" className="w-full" disabled={loading || !codeValid}>
              {loading ? 'A criar conta...' : 'Criar conta'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink2">
            Ja tens conta?{' '}
            <Link to="/login" className="font-semibold text-copper hover:text-copper/80 transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
