import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, CalendarDays, Users, Car, Wallet, MessageCircle, Shield, Smartphone, ChevronRight, CheckCircle, ArrowRight, Star, Zap, ChevronDown, HelpCircle } from 'lucide-react'

const features = [
  {
    icon: CalendarDays,
    title: 'Reservas & Agenda',
    description: 'Organize todas as reservas num calendário visual. Receba notificações, evite conflitos de horário e nunca perca um cliente.',
  },
  {
    icon: Car,
    title: 'Gestão de Frota',
    description: 'Controle cada TukTuk — manutenção, estado, quilómetros. Saiba sempre qual veículo está disponível e pronto a rolar.',
  },
  {
    icon: Users,
    title: 'Motoristas & Escalas',
    description: 'Convide motoristas, defina escalas semanais e acompanhe o desempenho de cada membro da equipa em tempo real.',
  },
  {
    icon: Wallet,
    title: 'Finanças & Relatórios',
    description: 'Receitas, comissões e despesas por período. Dashboards visuais para tomar decisões com dados, não com palpites.',
  },
  {
    icon: MessageCircle,
    title: 'Suporte Integrado',
    description: 'Chat de suporte direto na plataforma. Os seus motoristas e a sua equipa nunca ficam sem resposta.',
  },
  {
    icon: Shield,
    title: 'Seguro & Fiável',
    description: 'Dados encriptados, backups automáticos e controlo de acesso por função. A sua informação está sempre protegida.',
  },
]

const benefits = [
  'Configuração em menos de 10 minutos',
  'Sem contratos — cancele quando quiser',
  'Suporte em Português',
  'Atualizações constantes e gratuitas',
  'Funciona em telemóvel, tablet e computador',
  'Dados sempre seus — exporte a qualquer momento',
]

const steps = [
  {
    number: '01',
    title: 'Crie a sua conta',
    description: 'Registe-se em segundos e configure a sua empresa em minutos. Sem código, sem complicações.',
  },
  {
    number: '02',
    title: 'Adicione a sua frota',
    description: 'Registe os seus TukTuks, convide motoristas e defina os seus tours.',
  },
  {
    number: '03',
    title: 'Comece a gerir',
    description: 'Reservas, escalas, finanças — tudo num só lugar. Concentre-se no que importa: os seus clientes.',
  },
]

const faqs = [
  {
    question: 'Preciso de conhecimentos técnicos para usar?',
    answer: 'Não. O Tuk an App foi desenhado para ser simples e intuitivo. Se sabe usar um telemóvel, sabe usar a plataforma. E se tiver dúvidas, o nosso suporte em Português está sempre disponível.',
  },
  {
    question: 'Posso experimentar antes de pagar?',
    answer: 'Sim! O plano Starter é totalmente gratuito e permite gerir até 2 TukTuks e 3 motoristas sem limite de tempo. Quando precisar de mais, faz upgrade para o Pro.',
  },
  {
    question: 'Os meus dados estão seguros?',
    answer: 'Absolutamente. Usamos encriptação de ponta a ponta, backups automáticos diários, e a infraestrutura está alojada na Europa (RGPD compliant). Os seus dados são sempre seus — pode exportá-los a qualquer momento.',
  },
  {
    question: 'Funciona em telemóvel?',
    answer: 'Sim. A plataforma é 100% responsiva. Os owners gerem tudo via browser (telemóvel, tablet ou computador) e os motoristas têm uma interface mobile-first optimizada para o dia-a-dia na estrada.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim, sem contratos nem fidelização. Pode fazer downgrade para o plano Starter ou cancelar quando quiser. Sem perguntas, sem complicações.',
  },
  {
    question: 'Quanto tempo demora a configurar?',
    answer: 'Menos de 10 minutos. Cria a conta, adiciona os seus TukTuks e tours, convida os motoristas — e está pronto a gerir.',
  },
]

const stats = [
  { value: '10 min', label: 'Setup completo' },
  { value: '100%', label: 'Cloud — sem instalação' },
  { value: '24/7', label: 'Sempre disponível' },
  { value: 'RGPD', label: 'Dados na Europa' },
]

function FAQItem({ faq }: { faq: typeof faqs[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-line last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="font-outfit font-semibold text-ink pr-4">{faq.question}</span>
        <ChevronDown
          size={20}
          className={`text-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="font-outfit text-sm text-ink2 pb-5 leading-relaxed pr-8">
          {faq.answer}
        </p>
      )}
    </div>
  )
}

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  const Icon = feature.icon
  return (
    <div className="bg-white rounded-card shadow-card hover:shadow-card-md transition-all duration-300 p-6 group">
      <div className="w-12 h-12 bg-yellow/20 rounded-btn flex items-center justify-center mb-4 group-hover:bg-yellow/30 transition-colors">
        <Icon size={24} className="text-copper" />
      </div>
      <h3 className="font-outfit font-bold text-lg text-ink">{feature.title}</h3>
      <p className="text-ink2 text-sm mt-2 leading-relaxed font-outfit">{feature.description}</p>
    </div>
  )
}

function StepCard({ step, isLast }: { step: typeof steps[0]; isLast: boolean }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 bg-yellow rounded-full flex items-center justify-center font-outfit font-black text-ink text-lg shrink-0">
          {step.number}
        </div>
        {!isLast && <div className="w-0.5 h-full bg-line mt-2 min-h-[40px]" />}
      </div>
      <div className="pb-10">
        <h3 className="font-outfit font-bold text-xl text-ink">{step.title}</h3>
        <p className="text-ink2 text-sm mt-1 leading-relaxed font-outfit">{step.description}</p>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛺</span>
            <span className="font-outfit font-extrabold text-xl text-ink">
              Tuk <span className="font-lora italic text-copper">an</span> App
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-outfit text-ink2">
            <a href="#features" className="hover:text-ink transition-colors">Funcionalidades</a>
            <a href="#how" className="hover:text-ink transition-colors">Como Funciona</a>
            <a href="#pricing" className="hover:text-ink transition-colors">Planos</a>
            <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-outfit font-semibold text-ink2 hover:text-ink transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/signup"
              className="bg-yellow text-ink px-5 py-2.5 rounded-btn font-outfit font-semibold text-sm hover:bg-yellow/90 transition-colors"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow/20 text-ink2 px-4 py-2 rounded-full text-sm font-outfit mb-6">
            <Zap size={14} className="text-copper" />
            <span>A plataforma feita para operadores de TukTuk</span>
          </div>
          <h1 className="font-outfit font-black text-4xl sm:text-6xl lg:text-7xl text-ink leading-tight">
            Faça a gestão do seu<br />
            negócio <span className="text-copper">de TukTuk</span>
          </h1>
          <p className="font-outfit text-lg sm:text-xl text-ink2 mt-6 max-w-2xl mx-auto leading-relaxed">
            Reservas, frota, motoristas e finanças — tudo numa única plataforma.
            Menos tempo no escritório, mais tempo na estrada.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              to="/signup"
              className="bg-yellow text-ink px-8 py-4 rounded-btn font-outfit font-bold text-lg hover:bg-yellow/90 transition-colors shadow-card-md flex items-center justify-center gap-2"
            >
              Começar Grátis <ArrowRight size={20} />
            </Link>
            <a
              href="#features"
              className="bg-white text-ink border border-line px-8 py-4 rounded-btn font-outfit font-bold text-lg hover:bg-cream transition-colors"
            >
              Ver Funcionalidades
            </a>
          </div>
          <div className="flex items-center justify-center gap-6 sm:gap-8 mt-12 text-sm font-outfit text-muted flex-wrap">
            <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-green" /> Sem cartão de crédito</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-green" /> Setup em 10 min</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-green" /> Suporte em PT</span>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-card shadow-card-lg p-4 sm:p-8 border border-line">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-cream rounded-btn p-4 text-center">
                <div className="text-2xl sm:text-3xl font-outfit font-black text-ink">12</div>
                <div className="text-2xs sm:text-sm text-muted font-outfit mt-1">Reservas Hoje</div>
              </div>
              <div className="bg-cream rounded-btn p-4 text-center">
                <div className="text-2xl sm:text-3xl font-outfit font-black text-copper">4</div>
                <div className="text-2xs sm:text-sm text-muted font-outfit mt-1">TukTuks Ativos</div>
              </div>
              <div className="bg-cream rounded-btn p-4 text-center">
                <div className="text-2xl sm:text-3xl font-outfit font-black text-green">840€</div>
                <div className="text-2xs sm:text-sm text-muted font-outfit mt-1">Receita do Dia</div>
              </div>
              <div className="bg-cream rounded-btn p-4 text-center">
                <div className="text-2xl sm:text-3xl font-outfit font-black text-ink">6</div>
                <div className="text-2xs sm:text-sm text-muted font-outfit mt-1">Motoristas</div>
              </div>
            </div>
            <div className="mt-6 bg-cream rounded-btn p-6">
              <div className="flex items-end justify-between gap-2 h-32">
                {[35, 52, 45, 68, 72, 58, 85, 90, 78, 95, 88, 102].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-sm ${i >= 10 ? 'bg-copper' : 'bg-yellow'}`}
                      style={{ height: `${(v / 102) * 100}%` }}
                    />
                    <span className="text-[9px] text-muted font-outfit">{['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i]}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted font-outfit mt-3 text-center">Receitas mensais — dados de exemplo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-outfit font-black text-copper">{s.value}</div>
                <div className="text-sm text-muted font-outfit mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 sm:px-6 bg-white border-t border-line">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-outfit text-muted mb-8 uppercase tracking-wider font-semibold">A confiança de quem já usa</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-cream rounded-card p-6 text-center">
              <div className="text-3xl font-outfit font-black text-copper">50+</div>
              <p className="text-sm text-ink2 font-outfit mt-1">Reservas geridas por semana</p>
            </div>
            <div className="bg-cream rounded-card p-6 text-center">
              <div className="text-3xl font-outfit font-black text-copper">Lisboa</div>
              <p className="text-sm text-ink2 font-outfit mt-1">Nasceu e opera nas ruas da capital</p>
            </div>
            <div className="bg-cream rounded-card p-6 text-center">
              <div className="text-3xl font-outfit font-black text-copper">0€</div>
              <p className="text-sm text-ink2 font-outfit mt-1">Para começar — sem cartão de crédito</p>
            </div>
          </div>
          <div className="mt-8 bg-cream rounded-card p-6 max-w-2xl mx-auto">
            <p className="font-outfit text-ink2 text-sm leading-relaxed italic text-center">
              "Antes usávamos folhas de Excel e mensagens no WhatsApp para gerir os tours. Com o Tuk an App, temos tudo organizado num só sítio — reservas, motoristas, finanças. Poupamos horas por semana."
            </p>
            <p className="text-center mt-3 font-outfit text-xs text-muted font-semibold">— Operador de TukTuks em Lisboa</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-ink">Tudo o que precisa, num só lugar</h2>
            <p className="font-outfit text-ink2 mt-3 max-w-xl mx-auto">
              Ferramentas pensadas para quem gere TukTuks no dia-a-dia. Simples, rápidas e em Português.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <FeatureCard key={f.title} feature={f} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-16 sm:py-24 px-4 sm:px-6 bg-cream">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-ink">Como Funciona</h2>
            <p className="font-outfit text-ink2 mt-3">Três passos para digitalizar o seu negócio</p>
          </div>
          <div className="flex flex-col">
            {steps.map((step, i) => (
              <StepCard key={step.number} step={step} isLast={i === steps.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-outfit font-bold text-3xl text-ink">
                Feito para operadores.<br />
                <span className="text-copper">Por operadores.</span>
              </h2>
              <p className="text-ink2 font-outfit mt-4 leading-relaxed">
                Sabemos os desafios do dia-a-dia porque vivemos o mesmo negócio.
                O Tuk an App nasceu nas ruas de Lisboa e foi pensado para resolver problemas reais.
              </p>
              <div className="mt-8 space-y-3">
                {benefits.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-green shrink-0" />
                    <span className="font-outfit text-sm text-ink2">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow/30 to-copper/10 rounded-card p-8 text-center">
              <Smartphone size={64} className="mx-auto text-copper/60" />
              <h3 className="font-outfit font-bold text-xl text-ink mt-4">Mobile-first</h3>
              <p className="text-ink2 text-sm mt-2 font-outfit leading-relaxed">
                Os seus motoristas usam a app no telemóvel — veem os tours do dia, registam vendas de rua e consultam a escala. Tudo sem ligar para o escritório.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-outfit font-bold text-ink">24/7</div>
                  <div className="text-2xs text-muted font-outfit">Disponível</div>
                </div>
                <div>
                  <div className="text-2xl font-outfit font-bold text-ink">PT</div>
                  <div className="text-2xs text-muted font-outfit">Português</div>
                </div>
                <div>
                  <div className="text-2xl font-outfit font-bold text-ink">100%</div>
                  <div className="text-2xs text-muted font-outfit">Cloud</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 bg-cream">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-ink">Planos Simples, Sem Surpresas</h2>
            <p className="font-outfit text-ink2 mt-3 max-w-xl mx-auto">
              Sem contratos, sem taxas escondidas. Comece grátis e faça upgrade apenas quando o seu negócio precisar de mais.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-card shadow-card p-8">
              <div className="text-sm font-outfit font-semibold text-copper uppercase tracking-wider">Starter</div>
              <div className="mt-4">
                <span className="text-4xl font-outfit font-black text-ink">0€</span>
                <span className="text-muted font-outfit ml-1">/ mês</span>
              </div>
              <p className="text-ink2 text-sm font-outfit mt-3">Perfeito para começar e experimentar a plataforma.</p>
              <div className="mt-6 space-y-3">
                {['Até 2 TukTuks', 'Até 3 motoristas', 'Reservas ilimitadas', 'Dashboard de finanças', 'Suporte por chat'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-outfit text-ink2">
                    <CheckCircle size={16} className="text-green shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/signup"
                className="mt-8 block text-center bg-cream text-ink border border-line px-6 py-3 rounded-btn font-outfit font-semibold text-sm hover:bg-line/30 transition-colors"
              >
                Criar Conta Grátis
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-ink rounded-card shadow-card-lg p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow text-ink px-4 py-1 rounded-bl-btn font-outfit font-bold text-2xs uppercase">
                Popular
              </div>
              <div className="text-sm font-outfit font-semibold text-yellow uppercase tracking-wider">Pro</div>
              <div className="mt-4">
                <span className="text-4xl font-outfit font-black text-cream">29€</span>
                <span className="text-cream/60 font-outfit ml-1">/ mês</span>
              </div>
              <p className="text-cream/70 text-sm font-outfit mt-3">Para operações a sério. Tudo ilimitado.</p>
              <div className="mt-6 space-y-3">
                {['TukTuks ilimitados', 'Motoristas ilimitados', 'Relatórios avançados', 'Escalas automáticas', 'Suporte prioritário', 'Exportação de dados'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-outfit text-cream/80">
                    <CheckCircle size={16} className="text-yellow shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/signup"
                className="mt-8 block text-center bg-yellow text-ink px-6 py-3 rounded-btn font-outfit font-bold text-sm hover:bg-yellow/90 transition-colors"
              >
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-yellow/20 text-ink2 px-4 py-2 rounded-full text-sm font-outfit mb-4">
              <HelpCircle size={14} className="text-copper" />
              <span>Perguntas Frequentes</span>
            </div>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-ink">Tem dúvidas? Nós respondemos.</h2>
          </div>
          <div className="bg-cream rounded-card p-6 sm:p-8">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} faq={faq} />
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="font-outfit text-sm text-muted">
              Não encontrou a resposta?{' '}
              <a href="mailto:ops@tukanapp.pt" className="text-copper hover:underline font-semibold">
                Envie-nos um email
              </a>
              {' '}ou{' '}
              <a href="https://wa.me/351915873799" target="_blank" rel="noopener noreferrer" className="text-copper hover:underline font-semibold">
                fale connosco no WhatsApp
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-ink">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-outfit font-bold text-3xl sm:text-4xl text-cream">
            Pronto para modernizar o seu negócio?
          </h2>
          <p className="font-outfit text-cream/70 mt-4 text-lg">
            Junte-se aos operadores de TukTuk que já usam o Tuk an App para gerir tudo num só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              to="/signup"
              className="bg-yellow text-ink px-8 py-4 rounded-btn font-outfit font-bold text-lg hover:bg-yellow/90 transition-colors flex items-center justify-center gap-2"
            >
              Começar Grátis <ArrowRight size={20} />
            </Link>
            <a
              href="https://wa.me/351915873799?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20o%20Tuk%20an%20App"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-cream/10 text-cream border border-cream/20 px-8 py-4 rounded-btn font-outfit font-bold text-lg hover:bg-cream/20 transition-colors flex items-center justify-center gap-2"
            >
              💬 Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 bg-ink border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🛺</span>
                <span className="font-outfit font-extrabold text-xl text-cream">
                  Tuk <span className="font-lora italic text-yellow">an</span> App
                </span>
              </div>
              <p className="text-cream/60 text-sm font-outfit leading-relaxed">
                A plataforma de gestão para<br />
                operadores de TukTuk.
              </p>
            </div>
            <div>
              <h3 className="font-outfit font-semibold text-cream mb-3">Plataforma</h3>
              <div className="space-y-2 text-sm font-outfit text-cream/60">
                <a href="#features" className="block hover:text-cream transition-colors">Funcionalidades</a>
                <a href="#pricing" className="block hover:text-cream transition-colors">Planos</a>
                <a href="#how" className="block hover:text-cream transition-colors">Como Funciona</a>
                <a href="#faq" className="block hover:text-cream transition-colors">FAQ</a>
              </div>
            </div>
            <div>
              <h3 className="font-outfit font-semibold text-cream mb-3">Contacto & Legal</h3>
              <div className="space-y-2 text-sm font-outfit text-cream/60">
                <a href="mailto:ops@tukanapp.pt" className="block hover:text-cream transition-colors">
                  ops@tukanapp.pt
                </a>
                <a href="https://wa.me/351915873799" target="_blank" rel="noopener noreferrer" className="block hover:text-cream transition-colors">
                  💬 WhatsApp
                </a>
                <Link to="/termos" className="block hover:text-cream transition-colors">Termos de Serviço</Link>
                <Link to="/privacidade" className="block hover:text-cream transition-colors">Política de Privacidade</Link>
              </div>
              <div className="mt-4">
                <Link to="/login" className="text-sm font-outfit text-cream/60 hover:text-cream transition-colors flex items-center gap-1">
                  Aceder ao painel <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-cream/40 text-sm font-outfit">
            <p>&copy; {new Date().getFullYear()} Tuk an App — Plataforma de gestão para operadores de TukTuk. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
