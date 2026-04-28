import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function PrivacyPage() {
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
        <h1 className="font-outfit font-bold text-3xl sm:text-4xl text-ink mb-2">Política de Privacidade</h1>
        <p className="font-outfit text-sm text-muted mb-10">Última atualização: 21 de Abril de 2026</p>

        <div className="prose-custom space-y-8">
          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">1. Responsável pelo Tratamento</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              O responsável pelo tratamento dos dados pessoais recolhidos através da plataforma Tuk an App é Joaquim Cabral, empresário em nome individual, com sede em Lisboa, Portugal. Para questões de privacidade, contacte-nos em{' '}
              <a href="mailto:ops@tukanapp.pt" className="text-copper hover:underline">ops@tukanapp.pt</a>.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">2. Dados que Recolhemos</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed mb-3">
              Recolhemos apenas os dados necessários para o funcionamento da plataforma:
            </p>
            <div className="space-y-2 ml-4">
              <p className="font-outfit text-sm text-ink2"><span className="font-semibold text-ink">Dados de conta:</span> nome, email, password (encriptada), empresa, NIF</p>
              <p className="font-outfit text-sm text-ink2"><span className="font-semibold text-ink">Dados operacionais:</span> reservas, informação de frota, escalas de motoristas, pagamentos</p>
              <p className="font-outfit text-sm text-ink2"><span className="font-semibold text-ink">Dados técnicos:</span> endereço IP, tipo de browser, páginas visitadas (analytics anónimos)</p>
            </div>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">3. Finalidade do Tratamento</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Os dados pessoais são tratados para: fornecer e manter o serviço da plataforma, processar pagamentos de subscrições, enviar comunicações essenciais sobre o serviço, melhorar a plataforma com base em padrões de utilização anónimos, e cumprir obrigações legais.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">4. Base Legal</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              O tratamento dos dados é baseado no contrato de prestação de serviço (utilização da plataforma), no consentimento do utilizador (quando aplicável), e no interesse legítimo de melhorar o serviço, em conformidade com o Regulamento Geral de Proteção de Dados (RGPD).
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">5. Partilha de Dados</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Não vendemos nem partilhamos dados pessoais com terceiros para fins de marketing. Os dados podem ser partilhados com: Supabase (infraestrutura e base de dados, servidores na Europa), Stripe (processamento de pagamentos), e Vercel (alojamento da plataforma). Todos os subprocessadores cumprem o RGPD.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">6. Segurança</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Implementamos medidas técnicas e organizativas adequadas para proteger os dados pessoais, incluindo encriptação em trânsito (TLS/SSL), encriptação em repouso na base de dados, controlo de acesso baseado em funções (RLS), e backups automáticos diários.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">7. Retenção de Dados</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Os dados são mantidos enquanto a conta estiver ativa. Após o cancelamento da conta, os dados são eliminados no prazo de 30 dias, exceto quando a retenção é exigida por lei (por exemplo, dados de faturação durante o período legal de 10 anos).
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">8. Direitos do Utilizador</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed mb-3">
              Ao abrigo do RGPD, o utilizador tem os seguintes direitos:
            </p>
            <div className="space-y-2 ml-4">
              <p className="font-outfit text-sm text-ink2"><span className="font-semibold text-ink">Acesso:</span> solicitar uma cópia de todos os dados pessoais que temos sobre si</p>
              <p className="font-outfit text-sm text-ink2"><span className="font-semibold text-ink">Retificação:</span> corrigir dados pessoais incorretos ou desatualizados</p>
              <p className="font-outfit text-sm text-ink2"><span className="font-semibold text-ink">Eliminação:</span> solicitar a eliminação dos seus dados pessoais</p>
              <p className="font-outfit text-sm text-ink2"><span className="font-semibold text-ink">Portabilidade:</span> receber os seus dados num formato estruturado e de uso corrente</p>
              <p className="font-outfit text-sm text-ink2"><span className="font-semibold text-ink">Oposição:</span> opor-se ao tratamento dos seus dados em determinadas circunstâncias</p>
            </div>
            <p className="font-outfit text-sm text-ink2 leading-relaxed mt-3">
              Para exercer qualquer destes direitos, contacte-nos em{' '}
              <a href="mailto:ops@tukanapp.pt" className="text-copper hover:underline">ops@tukanapp.pt</a>. Responderemos no prazo de 30 dias.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">9. Cookies</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Utilizamos apenas cookies essenciais para o funcionamento da plataforma (autenticação e sessão). Não utilizamos cookies de publicidade ou rastreamento de terceiros. O Vercel Analytics recolhe dados anónimos de utilização sem cookies.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">10. Alterações</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Esta política pode ser atualizada periodicamente. As alterações significativas serão comunicadas por email com 30 dias de antecedência. A versão mais recente estará sempre disponível nesta página.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-bold text-xl text-ink mb-3">11. Autoridade de Controlo</h2>
            <p className="font-outfit text-sm text-ink2 leading-relaxed">
              Se considerar que o tratamento dos seus dados não está em conformidade com o RGPD, tem o direito de apresentar uma reclamação junto da Comissão Nacional de Proteção de Dados (CNPD) em www.cnpd.pt.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
