# Tuk an App — Plano de Lançamento SaaS

> Objectivo: Lançar o Tuk an App como plataforma SaaS para empresas de TukTuk em Portugal.
> Foco: Produto pronto para vender, não operações internas.
> Actualizado: 2026-04-21

---

## Contexto

O Tuk an App é uma plataforma de gestão para operadores de TukTuk. Já tem funcionalidades core operacionais (reservas, frota, motoristas, finanças, escalas, suporte). O que falta é torná-lo num produto pronto para que qualquer empresa de TukTuk se registe e comece a usar sozinha.

### O que já está pronto
- Landing page SaaS em www.tukanapp.pt
- Signup com invite code + login
- Multi-tenant (company_id em todas as tabelas, RLS)
- Dashboard owner com KPIs
- CRUD completo: frota, reservas, motoristas, finanças
- Driver app (mobile-first)
- Planos Starter (0€) e Pro (29€/mês) na landing page

### O que falta
- Stripe billing (os planos estão na landing page mas não cobram)
- Onboarding wizard para novos owners
- Página de signup aberta (sem invite code) ou sistema de invite codes self-service
- Email transacional (confirmações, convites)
- Termos de Serviço e Política de Privacidade
- Demo/screenshots na landing page

---

## Fase 1 — Produto Pronto para Beta (Semanas 1-2)

Objectivo: Permitir que 5-10 empresas se registem e usem a plataforma sem assistência.

### 1.1 Signup Aberto (remover barreira do invite code)
- Criar rota `/signup` que funcione sem invite code
- Manter invite code como opcional (para campanhas ou referrals)
- Novo owner cria conta → cria empresa automaticamente
- Redireciona para onboarding wizard

### 1.2 Onboarding Wizard
Depois de criar conta, guiar o owner por 3 passos:
1. **Empresa** — Nome, NIF, localização, logo (pré-preenchido do signup)
2. **Primeiro TukTuk** — Matrícula, modelo, capacidade
3. **Primeiro Tour** — Nome, duração, preço, zona
→ Ao concluir, redireciona para o dashboard com dados reais

### 1.3 Email Transacional (Resend)
Configurar Resend (já tem domain tukanapp.pt):
- Email de boas-vindas ao owner
- Convite de motorista (link direto, substituir mailto)
- Confirmação de reserva ao cliente (para quando o owner criar reserva)
- Reset de password

### 1.4 Termos e Privacidade
- Criar página `/termos` com Termos de Serviço básicos
- Criar página `/privacidade` com Política de Privacidade (RGPD)
- Checkbox obrigatório no signup
- Link no footer da landing page

### 1.5 Polish da Landing Page
- Adicionar screenshots reais do dashboard (ou mockup)
- Adicionar secção "Testemunhos" (placeholder para futuro)
- Melhorar copy do pricing com comparação lado-a-lado mais detalhada
- Adicionar FAQ section

---

## Fase 2 — Billing & Limites (Semanas 3-4)

Objectivo: Cobrar pelo plano Pro e enforçar limites no Starter.

### 2.1 Stripe Integration
- Criar produtos/preços no Stripe: Starter (free), Pro (29€/mês)
- Checkout session para upgrade Starter → Pro
- Customer portal para gestão de subscrição
- Webhook para atualizar `companies.plan` no Supabase

### 2.2 Enforçar Limites do Plano Starter
- Máx 2 TukTuks (bloquear adicionar mais)
- Máx 3 motoristas (bloquear convite)
- Mostrar banner de upgrade quando atingir limite
- Todas as outras features desbloqueadas (reservas ilimitadas, finanças, etc.)

### 2.3 Página de Billing no Settings
- Mostrar plano actual e data de renovação
- Botão "Upgrade para Pro" → Stripe Checkout
- Botão "Gerir Subscrição" → Stripe Customer Portal
- Histórico de faturas

---

## Fase 3 — Go-to-Market (Semanas 3-6, em paralelo)

Objectivo: Encontrar e converter as primeiras 10 empresas clientes.

### 3.1 Pesquisa de Mercado
- Listar todas as empresas de TukTuk em Lisboa, Porto, Sintra, Algarve
- Fontes: Google Maps, TripAdvisor, GetYourGuide, Viator, Instagram
- Para cada empresa: nome, contacto, tamanho estimado da frota, presença digital
- Criar spreadsheet com pipeline de prospects

### 3.2 Outreach Directo
- Email personalizado a cada empresa (desde ops@tukanapp.pt)
- Oferta: 3 meses Pro grátis para early adopters
- Template de email com link para demo/signup
- Follow-up por telefone/WhatsApp se não responder em 3 dias

### 3.3 Presença Online
- Google Business Profile para "Tuk an App"
- Post no LinkedIn do Joaquim sobre o lançamento
- SEO: blog post "Como gerir uma empresa de TukTuk em 2026"
- Listar no ProductHunt (versão PT)

### 3.4 Parcerias Locais
- Contactar associações de turismo (ATL, Turismo de Portugal)
- Contactar câmaras municipais que licenciam TukTuks
- Oferecer workshop gratuito "Digitalizar o seu negócio de TukTuk"

---

## Fase 4 — Iteração com Feedback (Semanas 5-8)

Objectivo: Melhorar o produto com base no uso real.

### 4.1 Feedback Loop
- Formulário in-app para feedback (widget simples)
- Check-in semanal com early adopters (call de 15 min)
- Priorizar features pedidas por 2+ empresas

### 4.2 Features Mais Pedidas (previsão)
- Booking widget público para clientes finais
- Integração WhatsApp para confirmações
- Relatórios PDF mensal
- Multi-idioma (PT/EN)

### 4.3 Métricas de Sucesso
| Métrica | Target Fase 1 | Target Fase 4 |
|---------|--------------|--------------|
| Empresas registadas | 5 | 20 |
| Empresas activas (>1 reserva/semana) | 3 | 10 |
| MRR | 0€ (beta grátis) | 290€ (10 Pro) |
| Churn mensal | — | <10% |
| NPS | — | >40 |

---

## Prioridades para Executar Agora

Pela ordem, o que posso fazer já:

1. **Landing page polish** — screenshots, FAQ, copy melhorado
2. **Signup aberto** — remover obrigatoriedade do invite code
3. **Onboarding wizard** — guiar novos owners pelos primeiros passos
4. **Termos e Privacidade** — páginas legais mínimas
5. **Pesquisa de mercado** — listar empresas de TukTuk em Portugal
6. **Email outreach template** — preparar email de cold outreach

Items 1-4 são código/produto. Items 5-6 são go-to-market.
