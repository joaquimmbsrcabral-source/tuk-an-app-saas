import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-cream/95 backdrop-blur-sm border-b border-line">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🛺</span>
            <span className="font-outfit font-extrabold text-xl text-ink">
              Tuk <span className="font-lora italic text-copper">an</span> App
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-1 text-sm font-outfit text-ink2 hover:text-ink transition-colors">
            <ChevronLeft size={16} />
            Voltar
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="font-outfit font-bold text-3xl sm:text-4xl text-ink mb-2">Termos de Serviço</h1>
        <p className="font-outfit text-sm text-muted mb-10">Última atualização: 21 de Abril de 2026</p>

        <div className="prose-custom space-y-8">
          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">1. Aceitação dos Termos</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Ao aceder e utilizar a plataforma Tuk an App (disponível em www.tukanapp.pt), o utilizador aceita e concorda cumprir estes Termos de Serviço. Se não concordar com algum dos termos, não deverá utilizar a plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">2. Descrição do Serviço</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              O Tuk an App é uma plataforma SaaS (Software as a Service) de gestão para operadores de TukTuk. O serviço inclui gestão de reservas, frota, motoristas, escalas e finanças. A plataforma é fornecida "tal como está" e está em constante evolução.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">3. Contas e Registo</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Para utilizar o Tuk an App, é necessário criar uma conta fornecendo informações verdadeiras e atualizadas. O utilizador é responsável por manter a confidencialidade das suas credenciais de acesso e por todas as atividades realizadas na sua conta.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">4. Planos e Pagamentos</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              O Tuk an App oferece um plano gratuito (Starter) com funcionalidades limitadas e um plano pago (Pro) com funcionalidades completas. Os pagamentos do plano Pro são processados mensalmente através de Stripe. O utilizador pode cancelar a subscrição a qualquer momento, mantendo acesso até ao final do período pago. Não existem contratos de fidelização.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">5. Utilização Aceitável</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              O utilizador compromete-se a utilizar a plataforma apenas para fins legítimos de gestão de operações de TukTuk. É proibido utilizar o serviço para atividades ilegais, prejudicar outros utilizadores, tentar aceder a dados de outras empresas, ou sobrecarregar intencionalmente os sistemas.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">6. Propriedade dos Dados</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Todos os dados introduzidos pelo utilizador na plataforma são propriedade do utilizador. O Tuk an App não reclama qualquer direito sobre os dados do utilizador. O utilizador pode exportar os seus dados a qualquer momento e solicitar a eliminação completa dos mesmos.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">7. Disponibilidade do Serviço</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              O Tuk an App esforça-se por manter o serviço disponível 24/7, mas não garante disponibilidade ininterrupta. Poderão existir períodos de manutenção programada ou interrupções não previstas. O utilizador será notificado com antecedência sempre que possível.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">8. Limitação de Responsabilidade</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              O Tuk an App não se responsabiliza por perdas indiretas, lucros cessantes ou danos consequenciais resultantes da utilização ou impossibilidade de utilização da plataforma. A responsabilidade total está limitada ao valor pago pelo utilizador nos últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">9. Alterações aos Termos</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              O Tuk an App reserva-se o direito de alterar estes termos a qualquer momento. As alterações serão comunicadas por email com 30 dias de antecedência. A continuação do uso da plataforma após a entrada em vigor das alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">10. Contacto</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Para questões sobre estes Termos de Serviço, contacte-nos através de{' '}
              <a href="mailto:ops@tukanapp.pt" className="text-copper hover:underline">ops@tukanapp.pt</a>.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">11. Lei Aplicável</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Estes termos são regidos pela lei portuguesa. Qualquer litígio será resolvido nos tribunais de Lisboa, Portugal.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
