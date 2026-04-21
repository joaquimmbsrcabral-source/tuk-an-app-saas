# Tuk an App — Backlog

> Prioridades de desenvolvimento para o SaaS de gestão de TukTuks.
> Foco: tornar o produto vendável a empresas de TukTuk.
> Actualizado: 2026-04-21

---

## P0 — Lançamento SaaS (esta semana)

- [x] **Signup aberto** — Remover obrigatoriedade do invite code, permitir registo directo
- [ ] **Onboarding wizard** — Guiar novo owner: empresa → primeiro TukTuk → primeiro tour → dashboard
- [x] **Landing page polish** — Screenshots reais, FAQ section, copy melhorado do pricing
- [x] **Termos de Serviço** — Página /termos com condições básicas do SaaS
- [x] **Política de Privacidade** — Página /privacidade com RGPD
- [ ] **Pesquisa de mercado** — Listar empresas de TukTuk em PT (Lisboa, Porto, Sintra, Algarve)

## P1 — Billing & Monetização (próximas 2 semanas)

- [ ] **Stripe checkout** — Integrar pagamento para upgrade Starter → Pro (29€/mês)
- [ ] **Limites do plano Starter** — Enforçar máx 2 TukTuks, 3 motoristas
- [ ] **Página de billing** — No Settings, mostrar plano, upgrade, gerir subscrição
- [ ] **Email transacional (Resend)** — Boas-vindas, convite motorista, confirmação reserva

## P2 — Growth (próximo mês)

- [ ] **Booking widget público** — Página /book para clientes finais fazerem reserva directa
- [ ] **Blog / SEO** — Artigo "Como gerir uma empresa de TukTuk em 2026"
- [ ] **Multi-idioma** — i18n com PT/EN (react-i18next), começando pela landing page
- [ ] **Relatórios PDF** — Gerar resumo mensal exportável para o owner
- [ ] **Integração WhatsApp** — Envio automático de confirmação de reserva ao cliente

## P3 — Futuro

- [ ] **Integração GetYourGuide/Viator** — Sync automático de reservas de marketplaces
- [ ] **Dashboard analytics avançado** — Gráficos de tendências, previsão de receita
- [ ] **App nativa (Expo)** — Converter driver app para app nativa
- [ ] **Programa de referral** — Empresas que referem ganham desconto

---

## Bugs Conhecidos

- [x] ~~Filtro de datas na página de finanças não limpa correctamente ao mudar de mês~~ ✅
- [x] ~~Skeleton loading no dashboard pisca brevemente mesmo quando dados já estão em cache~~ ✅

## Dívida Técnica

- [ ] Migrar de localStorage para Supabase para persistência do thread de suporte
- [ ] Adicionar testes unitários (Vitest) para componentes críticos
- [ ] Implementar error boundaries em todas as páginas
- [ ] Optimizar bundle size — analisar com `vite-bundle-visualizer`
