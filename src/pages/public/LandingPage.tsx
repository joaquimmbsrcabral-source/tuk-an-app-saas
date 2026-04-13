import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import {
  Zap, ArrowRight, Calendar, Users, BarChart3, Smartphone,
  Shield, Globe, MapPin, Star, Check, Menu, X, ChevronUp,
  ChevronDown, CheckCircle2
} from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    description: 'Para quem está a começar',
    price: 29,
    popular: false,
    cta: 'Começar grátis',
    features: [
      'Até 3 TukTuks',
      'Até 5 motoristas',
      'Reservas online (widget)',
      'Dashboard básico',
      'Suporte por email',
    ],
  },
  {
    name: 'Professional',
    description: 'Para operações em crescimento',
    price: 59,
    popular: true,
    cta: 'Começar grátis',
    features: [
      'Até 10 TukTuks',
      'Motoristas ilimitados',
      'Reservas + vendas na rua',
      'Dashboard completo com gráficos',
      'Gestão de escala',
      'Push notifications',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Enterprise',
    description: 'Para grandes operadores',
    price: 99,
    popular: false,
    cta: 'Falar com vendas',
    features: [
      'TukTuks ilimitados',
      'Motoristas ilimitados',
      'Tudo do Professional',
      'API personalizada',
      'Multi-empresa',
      'Relatórios avançados',
      'Account manager dedicado',
    ],
  },
]

const testimonials = [
  {
    name: 'António Silva',
    company: 'Lisboa TukTuk Tours',
    text: 'Finalmente uma plataforma feita para nós. Deixámos de usar Excel e WhatsApp para gerir tudo. A equipa adora a app de motorista.',
    rating: 5,
  },
  {
    name: 'Maria Santos',
    company: 'Porto Adventures',
    text: 'As reservas online triplicaram desde que instalámos o widget no site. Os clientes adoram a fácilidade de marcar e pagar.',
    rating: 5,
  },
  {
    name: 'João Costa',
    company: 'Algarve Rides',
    text: 'O dashboard em tempo real é fantástico. Sei exatamente quanto cada motorista e TukTuk faturam por dia. Recomendo a 100%.',
    rating: 5,
  },
]

const faqs = [
  {
    q: 'Preciso de instalar alguma app?',
    a: 'Não! O Tuk an App é uma Progressive Web App (PWA). Funciona diretamente no browser do telemóvel ou computador. Sem downloads, sem atualizações manuais.',
  },
  {
    q: 'Quanto tempo demora a configurar?',
    a: 'Menos de 15 minutos. Crias a conta, adicionas os teus TukTuks e convidas os motoristas. Eles recebem um link e estão prontos.',
  },
  {
    q: 'E se eu já tiver um site?',
    a: 'Perfeito! O nosso widget de reservas integra-se em qualquer site com um simples código. Instalação em menos de 5 minutos.',
  },
  {
    q: 'Os dados estão seguros?',
    a: 'Sim. Usamos Supabase (PostgreSQL) com encriptação, autenticação segura e backups automáticos. Os pagamentos são processados via Stripe.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Claro. Sem fidelização, sem letras pequenas. Cancelas quando quiseres e os teus dados ficam disponíveis para exportação.',
  },
  {
    q: 'Têm suporte em Português?',
    a: 'Sim! A plataforma é 100% em Português e o suporte é feito por uma equipa portuguesa. Também temos interface em Inglês.',
  },
]

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [contactSent, setContactSent] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setContactSent(true)
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-ink2 hover:text-ink transition-colors">Funcionalidades</a>
              <a href="#pricing" className="text-sm font-medium text-ink2 hover:text-ink transition-colors">Preços</a>
              <a href="#testimonials" className="text-sm font-medium text-ink2 hover:text-ink transition-colors">Testemunhos</a>
              <a href="#faq" className="text-sm font-medium text-ink2 hover:text-ink transition-colors">FAQ</a>
              <a href="#contact" className="text-sm font-medium text-ink2 hover:text-ink transition-colors">Contacto</a>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm font-semibold text-ink hover:text-ink2 transition-colors px-4 py-2">
                Entrar
              </Link>
              <Link to="/signup" className="text-sm font-bold bg-yellow text-ink px-5 py-2.5 rounded-xl hover:bg-yellow/90 transition-all shadow-sm">
                Começar grátis
              </Link>
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-line px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm font-medium text-ink2 py-2" onClick={() => setMobileMenuOpen(false)}>Funcionalidades</a>
            <a href="#pricing" className="block text-sm font-medium text-ink2 py-2" onClick={() => setMobileMenuOpen(false)}>Preços</a>
            <a href="#testimonials" className="block text-sm font-medium text-ink2 py-2" onClick={() => setMobileMenuOpen(false)}>Testemunhos</a>
            <a href="#faq" className="block text-sm font-medium text-ink2 py-2" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <a href="#contact" className="block text-sm font-medium text-ink2 py-2" onClick={() => setMobileMenuOpen(false)}>Contacto</a>
            <div className="pt-2 border-t border-line flex gap-3">
              <Link to="/login" className="flex-1 text-center text-sm font-semibold text-ink py-2.5 rounded-xl border border-line">Entrar</Link>
              <Link to="/signup" className="flex-1 text-center text-sm font-bold bg-yellow text-ink py-2.5 rounded-xl">Começar grátis</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow/5 via-transparent to-copper/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 bg-yellow/20 text-ink px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            <Zap size={14} />
            14 dias grátis — sem cartão de crédito
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink leading-tight max-w-4xl mx-auto">
            Gestão de TukTuks.<br />
            <span className="text-yellow">Simples. Moderna. Poderosa.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-ink2 max-w-2xl mx-auto leading-relaxed">
            Reservas online, gestão de frota, pagamentos e comunicação com motoristas — tudo numa só plataforma feita para operadores de TukTuk.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto bg-yellow text-ink font-bold px-8 py-4 rounded-2xl text-lg hover:bg-yellow/90 transition-all shadow-lg shadow-yellow/30 flex items-center justify-center gap-2"
            >
              Começar grátis <ArrowRight size={20} />
            </Link>
            <a
              href="#contact"
              className="w-full sm:w-auto border-2 border-ink text-ink font-bold px-8 py-4 rounded-2xl text-lg hover:bg-ink hover:text-white transition-all flex items-center justify-center gap-2"
            >
              Ver demo
            </a>
          </div>
          <p className="mt-4 text-sm text-ink2">Já utilizado por operadores em Lisboa, Porto e Algarve</p>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-ink">Tudo o que precisas para gerir o teu negócio</h2>
            <p className="mt-4 text-lg text-ink2 max-w-2xl mx-auto">Substitui folhas de Excel, grupos de WhatsApp e papel por uma plataforma profissional.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Calendar, title: 'Reservas Online', desc: 'Widget que instalas no teu site. Clientes reservam e pagam — tu recebes notificação.' },
              { icon: Users, title: 'Gestão de Motoristas', desc: 'Cada motorista tem a sua app. Vê escala, tours do dia, pagamentos e histórico.' },
              { icon: BarChart3, title: 'Dashboard em Tempo Real', desc: 'Receita, tours, top motoristas e TukTuks — tudo num ecrã com gráficos.' },
              { icon: Smartphone, title: 'App para Motoristas (PWA)', desc: 'Funciona no browser do telemóvel. Sem instalar nada. Push notifications incluídas.' },
              { icon: Shield, title: 'Pagamentos Seguros', desc: 'Stripe integrado. Aceita cartões, MB WAY e transferência. Reconciliação automática.' },
              { icon: Globe, title: 'Multi-idioma', desc: 'Interface em Português e Inglês. Widget de reservas adapta-se ao idioma do cliente.' },
              { icon: MapPin, title: 'Gestão de Frota', desc: 'Regista TukTuks, manutenções, documentos e seguros. Tudo organizado.' },
              { icon: Zap, title: 'WhatsApp Automático', desc: 'Confirmações e lembretes enviados automaticamente por WhatsApp aos clientes.' },
              { icon: Star, title: 'Avaliações Pós-Tour', desc: 'Recolhe feedback dos clientes automaticamente. Melhora o serviço continuamente.' },
            ].map((f, i) => (
              <div key={i} className="bg-cream rounded-2xl p-6 border border-line hover:shadow-lg transition-all group">
                <div className="w-12 h-12 rounded-xl bg-yellow/20 flex items-center justify-center mb-4 group-hover:bg-yellow/30 transition-colors">
                  <f.icon size={24} className="text-ink" />
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">{f.title}</h3>
                <p className="text-sm text-ink2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-ink">Preços simples e transparentes</h2>
            <p className="mt-4 text-lg text-ink2">14 dias grátis em todos os planos. Sem surpresas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-2xl p-8 border-2 ${
                  plan.popular ? 'border-yellow shadow-xl shadow-yellow/10 scale-105' : 'border-line'
                } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow text-ink text-xs font-bold px-4 py-1 rounded-full">
                    Mais popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-ink">{plan.name}</h3>
                <p className="text-sm text-ink2 mt-1">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-ink">{plan.price}€</span>
                  <span className="text-sm text-ink2">/mês</span>
                </div>
                <Link
                  to="/signup"
                  className={`mt-6 block text-center font-bold py-3 rounded-xl transition-all ${
                    plan.popular
                      ? 'bg-yellow text-ink hover:bg-yellow/90 shadow-lg shadow-yellow/20'
                      : 'bg-ink text-white hover:bg-ink/90'
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-ink2">
                      <Check size={16} className="text-green mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-ink">O que dizem os nossos clientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-cream rounded-2xl p-6 border border-line">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={16} className="fill-yellow text-yellow" />
                  ))}
                </div>
                <p className="text-sm text-ink leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-bold text-ink">{t.name}</p>
                  <p className="text-xs text-ink2">{t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-ink">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-line overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold text-ink">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-ink2" /> : <ChevronDown size={18} className="text-ink2" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-ink2 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-ink">Fala connosco</h2>
            <p className="mt-4 text-lg text-ink2">Tens dúvidas? Queres uma demo personalizada? Envia-nos uma mensagem.</p>
          </div>
          {contactSent ? (
            <div className="text-center bg-green/10 rounded-2xl p-8 border border-green/20">
              <div className="w-14 h-14 rounded-full bg-green/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Mensagem enviada!</h3>
              <p className="text-sm text-ink2">Respondemos em menos de 24 horas.</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Nome</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-line bg-cream text-ink focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow"
                    placeholder="O teu nome"
                    value={contactForm.name}
                    onChange={e => setContactForm({...contactForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-line bg-cream text-ink focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow"
                    placeholder="email@empresa.pt"
                    value={contactForm.email}
                    onChange={e => setContactForm({...contactForm, email: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Empresa</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-line bg-cream text-ink focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow"
                  placeholder="Nome da tua empresa de TukTuks"
                  value={contactForm.company}
                  onChange={e => setContactForm({...contactForm, company: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Mensagem</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-line bg-cream text-ink focus:outline-none focus:ring-2 focus:ring-yellow/50 focus:border-yellow resize-none"
                  placeholder="Como te podemos ajudar?"
                  value={contactForm.message}
                  onChange={e => setContactForm({...contactForm, message: e.target.value})}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow text-ink font-bold py-4 rounded-xl text-lg hover:bg-yellow/90 transition-all shadow-lg shadow-yellow/20"
              >
                Enviar mensagem
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Logo variant="light" />
              <p className="text-sm text-white/80 max-w-sm leading-relaxed mt-4">
                A plataforma de gestão feita para operadores de TukTuk em Portugal. Reservas, frota, motoristas e pagamentos — tudo num só lugar.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="/termos" className="hover:text-white transition-colors">Termos de Serviço</a></li>
                <li><a href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="/rgpd" className="hover:text-white transition-colors">RGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/70">© 2026 Tuk an App. Todos os direitos reservados.</p>
            <p className="text-sm text-white/70">Feito com ❤️ em Lisboa</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
