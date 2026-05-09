import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Crown, ArrowLeft, Check, Loader2 } from 'lucide-react'

export function BillingPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const success = searchParams.get('success') === '1'
  const canceled = searchParams.get('canceled') === '1'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyPlan, setCompanyPlan] = useState<string>('starter')

  useEffect(() => {
    if (profile?.company_id) {
      supabase.from('companies').select('plan').eq('id', profile.company_id).single()
        .then(({ data }) => { if (data) setCompanyPlan(data.plan) })
    }
  }, [profile])

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', { body: {} })
      if (error) throw error
      if (data?.url) window.location.href = data.url
      else throw new Error('No checkout URL returned')
    } catch (err) {
      setError((err as Error).message || 'Erro ao iniciar checkout')
      setLoading(false)
    }
  }

  const handleManagePortal = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', { body: {} })
      if (error) throw error
      if (data?.url) window.location.href = data.url
    } catch (err) {
      setError((err as Error).message || 'Erro ao abrir portal')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-ink2 hover:text-ink mb-8 font-outfit">
          <ArrowLeft size={16} /> Voltar ao dashboard
        </Link>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-card p-6 mb-6">
            <h2 className="font-outfit font-bold text-xl text-green-900 flex items-center gap-2">
              <Check size={24} /> Bem-vindo ao Pro!
            </h2>
            <p className="font-outfit text-green-800 mt-2">
              A tua subscrição está activa. O trial de 30 dias começou agora.
            </p>
          </div>
        )}

        {canceled && (
          <div className="bg-amber-50 border border-amber-200 rounded-card p-6 mb-6">
            <p className="font-outfit text-amber-900">
              Cancelaste o checkout. Quando estiveres pronto, podes tentar de novo.
            </p>
          </div>
        )}

        {companyPlan === 'pro' ? (
          <div className="bg-white rounded-card shadow-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <Crown size={32} className="text-yellow" />
              <h1 className="font-outfit font-black text-3xl text-ink">Plano Pro Activo</h1>
            </div>
            <p className="font-outfit text-ink2 mb-6">
              A tua empresa está no plano Pro. Para gerir a subscrição (cancelar, mudar pagamento, ver invoices), usa o botão abaixo.
            </p>
            <button
              onClick={handleManagePortal}
              disabled={loading}
              className="bg-ink text-cream px-6 py-3 rounded-btn font-outfit font-semibold hover:bg-ink/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> A abrir...
                </>
              ) : (
                'Gerir Subscrição'
              )}
            </button>
            {error && <p className="font-outfit text-sm text-red-600 mt-4">{error}</p>}
          </div>
        ) : (
          <div className="bg-white rounded-card shadow-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <Crown size={32} className="text-yellow" />
              <h1 className="font-outfit font-black text-3xl text-ink">Upgrade para Pro</h1>
            </div>
            <p className="font-outfit text-ink2 mb-6">
              Desbloqueia tudo: TukTuks ilimitados, motoristas ilimitados, live presence em tempo real, escalas avançadas, exports fiscais e suporte prioritário.
            </p>
            <div className="bg-cream rounded-card p-6 mb-6">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-outfit font-black text-ink">49€</span>
                <span className="text-muted font-outfit">/ mês</span>
              </div>
              <p className="text-sm font-outfit text-ink2">30 dias grátis · Sem cartão necessário · Cancela quando quiseres</p>
            </div>
            <ul className="space-y-2 font-outfit text-sm text-ink2 mb-8">
              {[
                'TukTuks ilimitados (vs. 2 no Starter)',
                'Motoristas ilimitados (vs. 3 no Starter)',
                'Live presence em tempo real',
                'Detecção de conflitos de escala',
                'Exportações fiscais (CSV / SAF-T)',
                'Suporte prioritário',
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <Check size={16} className="text-green shrink-0" /> {feat}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-yellow text-ink py-4 rounded-btn font-outfit font-bold text-lg hover:bg-yellow/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> A iniciar checkout...
                </>
              ) : (
                <>
                  <Crown size={20} /> Começar trial de 30 dias
                </>
              )}
            </button>
            {error && <p className="font-outfit text-sm text-red-600 mt-4">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
