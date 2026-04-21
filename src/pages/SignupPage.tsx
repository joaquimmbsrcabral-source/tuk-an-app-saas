import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { Input } from '../components/Input'
import { Button } from '../components/Button'

type CodeStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'valid'; note?: string | null }
  | { state: 'invalid'; reason: string }

const REASON_MSG: Record<string, string> = {
  not_found: 'Código não encontrado',
  already_used: 'Este código já foi utilizado',
  expired: 'Este código expirou',
}

export const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [searchParams] = useSearchParams()

  const [code, setCode] = useState((searchParams.get('code') || '').toUpperCase())
  const [codeStatus, setCodeStatus] = useState<CodeStatus>({ state: 'idle' })
  const [showCodeField, setShowCodeField] = useState(!!searchParams.get('code'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Debounced code validation (only when code is entered)
  useEffect(() => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed || trimmed.length < 3) {
      setCodeStatus({ state: 'idle' })
      return
    }
    setCodeStatus({ state: 'checking' })
    const handle = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('validate_invite_code', { p_code: trimmed })
        if (error) {
          setCodeStatus({ state: 'invalid', reason: 'not_found' })
          return
        }
        const row = Array.isArray(data) ? data[0] : data
        if (row?.valid) {
          setCodeStatus({ state: 'valid', note: row.note })
        } else {
          setCodeStatus({ state: 'invalid', reason: row?.reason || 'not_found' })
        }
      } catch {
        setCodeStatus({ state: 'invalid', reason: 'not_found' })
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!acceptTerms) {
      setError('É necessário aceitar os Termos de Serviço e a Política de Privacidade.')
      return
    }

    const trimmedCode = code.trim().toUpperCase()

    // If a code was entered, it must be valid
    if (trimmedCode && codeStatus.state !== 'valid') {
      setError('Código de convite inválido. Verifica com quem te enviou o código.')
      return
    }

    setLoading(true)
    try {
      // Sign up + sign in to get a session
      await signUp(email, password)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        throw new Error('Conta criada. Verifica o teu email para confirmar antes de entrar.')
      }

      const { error: rpcError } = await supabase.rpc('signup_owner_direct', {
        p_code: trimmedCode || null,
        p_company_name: companyName,
        p_full_name: fullName,
        p_phone: phone,
      })
      if (rpcError) {
        const msg = (rpcError.message || '').toLowerCase()
        if (msg.includes('invalid_code')) throw new Error('Código de convite inválido.')
        if (msg.includes('code_already_used')) throw new Error('Este código já foi utilizado.')
        if (msg.includes('code_expired')) throw new Error('Este código expirou.')
        if (msg.includes('profile_already_exists')) throw new Error('Já existe um perfil associado a esta conta.')
        throw rpcError
      }

      window.location.replace('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Falha ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const codeBorder =
    codeStatus.state === 'valid' ? 'border-green-500' :
    codeStatus.state === 'invalid' ? 'border-copper' : 'border-line'

  const canSubmit = !loading && acceptTerms && (!code.trim() || codeStatus.state === 'valid')

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="bg-card border border-line rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-ink mb-2 text-center">Criar Conta</h1>
          <p className="text-sm text-ink2 text-center mb-6">
            Começa a gerir os teus TukTuks em minutos.
          </p>

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
              placeholder="Lisboa TukTuk Tours"
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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Invite code - optional, collapsible */}
            {showCodeField ? (
              <div>
                <label className="block text-sm font-600 text-ink mb-1">
                  Código de Convite <span className="text-ink2 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 bg-card border ${codeBorder} rounded-btn text-ink font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-yellow`}
                  placeholder="EX: AB-2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  autoComplete="off"
                />
                <div className="mt-1 text-xs min-h-[16px]">
                  {codeStatus.state === 'checking' && <span className="text-ink2">A validar código...</span>}
                  {codeStatus.state === 'valid' && (
                    <span className="text-green-600">
                      ✓ Código válido{codeStatus.note ? ` — ${codeStatus.note}` : ''}
                    </span>
                  )}
                  {codeStatus.state === 'invalid' && (
                    <span className="text-copper">✗ {REASON_MSG[codeStatus.reason] || 'Código inválido'}</span>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCodeField(true)}
                className="text-sm text-copper hover:text-copper/80 transition-colors"
              >
                Tens um código de convite?
              </button>
            )}

            {/* Terms & Privacy checkbox */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4 h-4 accent-yellow rounded"
              />
              <span className="text-xs text-ink2 leading-relaxed">
                Li e aceito os{' '}
                <Link to="/termos" target="_blank" className="text-copper underline hover:text-copper/80">
                  Termos de Serviço
                </Link>{' '}
                e a{' '}
                <Link to="/privacidade" target="_blank" className="text-copper underline hover:text-copper/80">
                  Política de Privacidade
                </Link>.
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!canSubmit}
            >
              {loading ? 'A criar...' : 'Criar Conta Grátis'}
            </Button>
          </form>

          <p className="text-center text-sm text-ink2 mt-6">
            Já tens conta?{' '}
            <Link to="/login" className="text-ink font-bold hover:text-copper">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
