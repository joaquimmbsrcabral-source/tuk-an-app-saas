import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react'

const articles = [
  {
    slug: 'como-gerir-empresa-tuktuk-2026',
    title: 'Como Gerir uma Empresa de TukTuk em 2026: Guia Completo',
    excerpt: 'Descubra as melhores práticas para gerir a sua frota de TukTuks, desde a gestão de motoristas até à maximização de receita com ferramentas digitais.',
    date: '2026-04-24',
    readTime: '8 min',
    image: null,
  },
]

export const BlogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-ink">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-cream font-bold text-lg">
            <div className="w-8 h-8 bg-yellow rounded-full flex items-center justify-center text-ink font-black text-sm">T</div>
            Tuk an App
          </Link>
          <Link to="/signup" className="text-sm font-semibold text-yellow hover:underline">
            Experimentar Grátis
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-ink mb-2">Blog</h1>
        <p className="text-lg text-ink2 mb-10">Dicas, guias e novidades para operadores de TukTuk em Portugal.</p>

        <div className="space-y-6">
          {articles.map((a) => (
            <Link
              key={a.slug}
              to={`/blog/${a.slug}`}
              className="block bg-card border border-line rounded-2xl p-6 hover:shadow-card-md transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 text-xs text-ink2 mb-3">
                <span className="flex items-center gap-1"><Calendar size={12} /> {a.date}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {a.readTime}</span>
              </div>
              <h2 className="text-xl font-bold text-ink mb-2 group-hover:text-copper transition-colors">{a.title}</h2>
              <p className="text-ink2 leading-relaxed mb-4">{a.excerpt}</p>
              <span className="text-sm font-semibold text-copper flex items-center gap-1">
                Ler artigo <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <footer className="border-t border-line py-8 text-center">
        <p className="text-sm text-ink2">
          © 2026 <Link to="/" className="font-semibold text-ink hover:text-copper">Tuk an App</Link> — Plataforma de gestão para operadores de TukTuk
        </p>
      </footer>
    </div>
  )
}

export const BlogArticlePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-ink">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-cream font-bold text-lg">
            <div className="w-8 h-8 bg-yellow rounded-full flex items-center justify-center text-ink font-black text-sm">T</div>
            Tuk an App
          </Link>
          <Link to="/signup" className="text-sm font-semibold text-yellow hover:underline">
            Experimentar Grátis
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/blog" className="flex items-center gap-2 text-sm text-ink2 hover:text-ink mb-8">
          <ArrowLeft size={16} /> Voltar ao blog
        </Link>

        <div className="flex items-center gap-3 text-xs text-ink2 mb-4">
          <span className="flex items-center gap-1"><Calendar size={12} /> 24 Abril 2026</span>
          <span className="flex items-center gap-1"><Clock size={12} /> 8 min de leitura</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-6 leading-tight">
          Como Gerir uma Empresa de TukTuk em 2026: Guia Completo
        </h1>

        <div className="prose prose-lg max-w-none">
          <div className="space-y-6 text-ink2 leading-relaxed">
            <p className="text-lg">
              O mercado de tours de TukTuk em Portugal continua a crescer. Lisboa, Porto, Sintra e Algarve atraem milhões de turistas todos os anos, e o TukTuk tornou-se num dos meios de transporte turístico mais populares. Mas gerir uma empresa de TukTuk vai muito além de ter veículos na rua.
            </p>

            <h2 className="text-2xl font-bold text-ink mt-10 mb-4">1. Gestão da Frota</h2>
            <p>
              O primeiro desafio de qualquer operador é manter a frota em boas condições. Cada TukTuk precisa de manutenção regular, seguro actualizado e inspecção periódica. Uma boa prática é registar quilometragem, datas de serviço e custos de manutenção de cada veículo. Com uma plataforma digital como o Tuk an App, isto fica automatizado — cada TukTuk tem a sua ficha com alertas de manutenção e seguro.
            </p>

            <h2 className="text-2xl font-bold text-ink mt-10 mb-4">2. Gestão de Motoristas</h2>
            <p>
              Os motoristas são o rosto da sua empresa. É importante definir comissões claras, acompanhar o desempenho individual e garantir que cada motorista sabe os tours disponíveis. Uma boa estrutura de comissões (tipicamente entre 15% a 30% do valor do tour) motiva a equipa e alinha interesses. O acompanhamento de vendas por motorista — tanto reservas como vendas de rua — permite identificar os melhores performers e dar formação onde necessário.
            </p>

            <h2 className="text-2xl font-bold text-ink mt-10 mb-4">3. Reservas e Vendas</h2>
            <p>
              Existem dois canais principais de receita: reservas antecipadas (via website, GetYourGuide, Viator, etc.) e vendas de rua (turistas que encontram o TukTuk no momento). Idealmente, deve ter um sistema que registe ambos os tipos de venda num único lugar. Ter um widget de reservas no seu website permite que turistas reservem directamente, reduzindo dependência de marketplaces que cobram comissões de 20-30%.
            </p>

            <h2 className="text-2xl font-bold text-ink mt-10 mb-4">4. Finanças e Relatórios</h2>
            <p>
              Saber exactamente quanto factura por dia, semana e mês é essencial. Acompanhe receita por tour, por motorista e por TukTuk. Isto ajuda a tomar decisões informadas: qual é o tour mais rentável? Que dias da semana são mais fortes? Precisa de mais veículos ou pode optimizar a rotação? Um dashboard financeiro com estes dados em tempo real é uma vantagem competitiva enorme.
            </p>

            <h2 className="text-2xl font-bold text-ink mt-10 mb-4">5. A Transição Digital</h2>
            <p>
              Muitos operadores de TukTuk ainda gerem tudo com papel, WhatsApp e folhas de Excel. Em 2026, a transição para ferramentas digitais já não é opcional — é uma necessidade competitiva. Uma plataforma como o Tuk an App foi desenhada especificamente para operadores de TukTuk, com funcionalidades como gestão de frota, escala de motoristas, controlo financeiro e reservas online, tudo numa única aplicação.
            </p>

            <h2 className="text-2xl font-bold text-ink mt-10 mb-4">6. Dicas Práticas</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Invista em TukTuks eléctricos — além de eco-friendly, os turistas preferem e as autarquias incentivam.</li>
              <li>Defina 3-4 tours fixos com nomes apelativos e preços claros.</li>
              <li>Use o Google Business Profile para aparecer nas pesquisas locais.</li>
              <li>Peça reviews no TripAdvisor e Google — são o seu melhor marketing.</li>
              <li>Tenha um website com reserva online para reduzir dependência de marketplaces.</li>
              <li>Acompanhe as finanças semanalmente, não apenas no fim do mês.</li>
            </ul>

            <div className="bg-yellow bg-opacity-10 border border-yellow border-opacity-30 rounded-2xl p-6 mt-10">
              <h3 className="text-lg font-bold text-ink mb-2">Experimente o Tuk an App gratuitamente</h3>
              <p className="text-ink2 mb-4">
                O Tuk an App é a plataforma de gestão feita à medida para empresas de TukTuk. Gerir frota, motoristas, reservas e finanças — tudo num só lugar. Plano Starter gratuito com até 2 TukTuks.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-ink text-cream font-bold px-6 py-3 rounded-btn hover:bg-opacity-90 transition-colors"
              >
                Começar Grátis <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </article>

      <footer className="border-t border-line py-8 text-center">
        <p className="text-sm text-ink2">
          © 2026 <Link to="/" className="font-semibold text-ink hover:text-copper">Tuk an App</Link> — Plataforma de gestão para operadores de TukTuk
        </p>
      </footer>
    </div>
  )
}
