# Tuk an App — Backlog

> Prioridades de desenvolvimento e operações para o SaaS de gestão de TukTuks.
> Actualizado: 2026-04-10

---

## P0 — Crítico (esta semana)

- [ ] **WhatsApp Business API** — Integrar envio automático de confirmação de reserva ao cliente via WhatsApp (Twilio ou 360dialog)
- [ ] **Booking widget público** — Página pública `/book` para clientes fazerem reserva directa (sem login), com escolha de tour, data, horário e pagamento Stripe
- [ ] **Stripe checkout** — Integrar pagamento online no booking widget (checkout session → webhook → marcar booking como pago)
- [ ] **Email transacional** — Configurar Resend/Postmark para envio de confirmação de reserva, recibo, e lembrete 24h antes

## P1 — Importante (próximas 2 semanas)

- [ ] **Notificações push (driver app)** — PWA push notifications para alertar motorista de nova reserva atribuída ou alteração de escala
- [ ] **Relatórios mensais** — Gerar PDF com resumo mensal: receita, tours, comissões por motorista, utilização de frota
- [ ] **Multi-idioma** — i18n com PT/EN/ES/FR (react-i18next), começando pelo booking widget público
- [ ] **Mapa de tours ao vivo** — Dashboard com mapa em tempo real mostrando posição dos TukTuks durante tours activos (GPS via driver app)
- [ ] **Avaliações de clientes** — Formulário pós-tour enviado por WhatsApp/email, com rating 1-5 e comentário
- [ ] **Gestão de manutenção melhorada** — Alertas automáticos por km/data, integração com oficina parceira

## P2 — Nice to Have (próximo mês)

- [ ] **App nativa (React Native)** — Converter driver app para app nativa com Expo
- [ ] **Integração GetYourGuide/Viator** — Sync automático de reservas de marketplaces
- [ ] **Dashboard analytics avançado** — Gráficos de tendências, previsão de receita, heatmap de horários populares
- [ ] **Sistema de vouchers/descontos** — Códigos promocionais para parceiros hoteleiros
- [ ] **Contabilidade** — Exportação SAF-T PT para contabilista, integração com software de facturação

## P3 — Futuro

- [ ] **Multi-empresa** — Permitir que o SaaS seja usado por outras empresas de TukTuk (não só Tuk & Roll)
- [ ] **Marketplace de motoristas** — Pool de motoristas freelancer para dias de alta procura
- [ ] **AI route optimizer** — Sugerir rotas optimizadas com base em trânsito e preferências do cliente
- [ ] **Programa de fidelidade** — Pontos por tour, descontos para clientes repetidos

---

## Bugs Conhecidos

- [ ] Filtro de datas na página de finanças não limpa correctamente ao mudar de mês
- [ ] Skeleton loading no dashboard pisca brevemente mesmo quando dados já estão em cache

## Dívida Técnica

- [ ] Migrar de localStorage para Supabase para persistência do thread de suporte no widget
- [ ] Adicionar testes unitários (Vitest) para componentes críticos: BookingForm, PaymentFlow
- [ ] Implementar error boundaries em todas as páginas
- [ ] Optimizar bundle size — analisar com `vite-bundle-visualizer`
