import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { MapPin, Shield, Zap } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Falha ao fazer login')
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
            Gere a tua frota<br />
            <span className="text-yellow">de TukTuks</span><br />
            num so lugar.
          </h1>
          <p className="mt-6 text-lg text-white/60 max-w-md leading-relaxed">
            Reservas, motoristas, pagamentos e relatorios — tudo o que precisas para fazer crescer o teu negocio de TukTuks.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-white/70">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-yellow" />
            </div>
            <span className="text-sm">Mapa ao vivo com GPS dos motoristas</span>
          </div>
          <div className="flex items-center gap-3 text-white/70">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow" />
            </div>
            <span className="text-sm">Pagamentos seguros com Stripe</span>
          </div>
          <div className="flex items-center gap-3 text-white/70">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow" />
            </div>
            <span className="text-sm">Setup em menos de 15 minutos</span>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-yellow/5" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-copper/5" />
        <div className="absolute top-1/2 right-12 w-64 h-64 rounded-full bg-yellow/3" />
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-cream">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <Logo size="lg" />
          </div>

          <h2 className="text-3xl font-extrabold text-ink">Bem-vindo de volta</h2>
          <p className="mt-2 text-ink2">Entra na tua conta para gerir a frota</p>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="tu@empresa.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-line text-yellow focus:ring-yellow" />
                <span className="text-sm text-ink2">Lembrar-me</span>
              </label>
              <a href="#" className="text-sm font-medium text-copper hover:text-copper/80 transition-colors">
                Esqueceste a password?
              </a>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'A entrar...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink2">
            Ainda nao tens conta?{' '}
            <Link to="/signup" className="font-semibold text-copper hover:text-copper/80 transition-colors">
              Criar conta
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-ink2">
            Es motorista?{' '}
            <Link to="/join" className="font-semibold text-copper hover:text-copper/80 transition-colors">
              Entrar como motorista
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
