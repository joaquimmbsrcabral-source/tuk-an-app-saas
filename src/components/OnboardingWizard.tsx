import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Input } from './Input'
import { Button } from './Button'
import { Truck, Map, CheckCircle, ChevronRight } from 'lucide-react'

type Step = 'welcome' | 'tuktuk' | 'tour' | 'done'

interface OnboardingWizardProps {
  onComplete: () => void
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { profile } = useAuth()
  const [step, setStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // TukTuk form
  const [plate, setPlate] = useState('')
  const [nickname, setNickname] = useState('')
  const [color, setColor] = useState('#FFD700')

  // Tour form
  const [tourName, setTourName] = useState('')
  const [tourPrice, setTourPrice] = useState('')
  const [tourDuration, setTourDuration] = useState('60')

  const handleAddTuktuk = async () => {
    if (!profile || !plate.trim() || !nickname.trim()) {
      setError('Preenche a matrícula e o nome do TukTuk.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error: insertError } = await supabase.from('tuktuks').insert({
        company_id: profile.company_id,
        plate: plate.trim().toUpperCase(),
        nickname: nickname.trim(),
        color,
        status: 'active',
        km: 0,
        insurance_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        next_service_km: 5000,
        notes: '',
      })
      if (insertError) throw insertError
      setStep('tour')
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar TukTuk')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTour = async () => {
    if (!profile || !tourName.trim() || !tourPrice) {
      setError('Preenche o nome e o preço do tour.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error: insertError } = await supabase.from('tour_catalog').insert({
        company_id: profile.company_id,
        name: tourName.trim(),
        default_price: parseFloat(tourPrice),
        default_duration_min: parseInt(tourDuration) || 60,
        active: true,
        description: '',
      })
      if (insertError) throw insertError
      setStep('done')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar tour')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipTour = () => setStep('done')

  const stepNumber = step === 'welcome' ? 0 : step === 'tuktuk' ? 1 : step === 'tour' ? 2 : 3
  const totalSteps = 3

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        {step !== 'done' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                    i < stepNumber
                      ? 'bg-green-500 text-white'
                      : i === stepNumber
                      ? 'bg-ink text-yellow'
                      : 'bg-line text-ink2'
                  }`}
                >
                  {i < stepNumber ? '✓' : i + 1}
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-ink rounded-full transition-all duration-500"
                style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="bg-card border border-line rounded-2xl p-8">
          {error && (
            <div className="bg-copper bg-opacity-10 border border-copper text-copper px-4 py-3 rounded-btn mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 'welcome' && (
            <div className="text-center">
              <div className="text-5xl mb-4">🛺</div>
              <h2 className="text-2xl font-bold text-ink mb-2">
                Bem-vindo ao Tuk an App!
              </h2>
              <p className="text-ink2 mb-6 leading-relaxed">
                Vamos configurar a tua empresa em 2 minutos. Primeiro, adiciona o teu primeiro TukTuk e depois cria um tour.
              </p>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => setStep('tuktuk')}
              >
                Começar <ChevronRight size={18} />
              </Button>
            </div>
          )}

          {step === 'tuktuk' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow bg-opacity-30 rounded-full flex items-center justify-center">
                  <Truck size={20} className="text-ink" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-ink">Adiciona o teu TukTuk</h2>
                  <p className="text-sm text-ink2">Passo 1 de 2</p>
                </div>
              </div>

              <Input
                label="Matrícula"
                placeholder="XX-XX-XX"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                required
              />
              <Input
                label="Nome / Apelido"
                placeholder="Ex: Sol Amarelo"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
              <div className="mb-4">
                <label className="block text-sm font-600 text-ink mb-2">Cor</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 rounded-btn border border-line cursor-pointer"
                  />
                  <span className="text-sm text-ink2">{color}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleAddTuktuk}
                loading={loading}
                disabled={!plate.trim() || !nickname.trim()}
              >
                Adicionar TukTuk <ChevronRight size={18} />
              </Button>
            </div>
          )}

          {step === 'tour' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow bg-opacity-30 rounded-full flex items-center justify-center">
                  <Map size={20} className="text-ink" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-ink">Cria o teu primeiro tour</h2>
                  <p className="text-sm text-ink2">Passo 2 de 2</p>
                </div>
              </div>

              <Input
                label="Nome do Tour"
                placeholder="Ex: Tour Histórico de Lisboa"
                value={tourName}
                onChange={(e) => setTourName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Preço (€)"
                  type="number"
                  placeholder="50"
                  value={tourPrice}
                  onChange={(e) => setTourPrice(e.target.value)}
                  required
                />
                <Input
                  label="Duração (min)"
                  type="number"
                  placeholder="60"
                  value={tourDuration}
                  onChange={(e) => setTourDuration(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  className="flex-1"
                  onClick={handleSkipTour}
                >
                  Saltar
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={handleAddTour}
                  loading={loading}
                  disabled={!tourName.trim() || !tourPrice}
                >
                  Criar Tour <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-ink mb-2">Tudo pronto!</h2>
              <p className="text-ink2 mb-6 leading-relaxed">
                A tua empresa está configurada. Podes agora gerir a frota, criar reservas e acompanhar as finanças.
              </p>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={onComplete}
              >
                Ir para o Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
