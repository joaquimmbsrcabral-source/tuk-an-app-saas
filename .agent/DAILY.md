# Tuk an App — Rotina Diária do Agente (Chefe de Operações)

> Este ficheiro define a rotina matinal às 7h que o agente executa todos os dias.
> O objectivo é preparar o dia do Joaquim antes dele começar a trabalhar.

---

## 07:00 — Briefing Matinal

### 1. Verificar Reservas do Dia

- Consultar `bookings` com `start_time` = hoje
- Listar por hora: cliente, tour_type, pax, tuktuk atribuído, motorista
- Sinalizar reservas sem motorista ou sem tuktuk atribuído
- Sinalizar sobreposições de horário (mesmo tuktuk/motorista em dois tours)

### 2. Verificar Escala de Motoristas

- Consultar `shifts` com `shift_date` = hoje
- Confirmar que todos os turnos têm motorista + tuktuk
- Identificar motoristas que não têm turno (disponíveis para emergência)
- Verificar se algum motorista tem turno mas nenhuma reserva (sub-utilização)

### 3. Verificar Estado da Frota

- Consultar `tuktuks` com `status != 'active'`
- Alertar sobre TukTuks em manutenção ou inativos
- Verificar `insurance_expiry` nos próximos 7 dias
- Verificar `next_service_km` vs `km` actual — alertar se faltam < 500km

### 4. Verificar Finanças Pendentes

- Consultar `bookings` com `status = 'confirmed'` e sem `payment` associado (pagamento em falta)
- Calcular receita esperada para o dia
- Listar pagamentos recebidos ontem (resumo rápido)

### 5. Verificar Suporte

- Consultar `support_threads` com `status = 'open'`
- Listar threads abertos há mais de 24h sem resposta
- Resumir temas pendentes

### 6. Compor Briefing

Formato do briefing (enviar por email para ops@tukanapp.pt):

```
Bom dia Joaquim! 🛺

📅 HOJE — [data]

🎫 RESERVAS ([n] tours)
• [hora] — [cliente] ([pax]p) — [tour] — 🛺 [tuktuk] / 👤 [motorista]
• ...
⚠️ [alertas se houver]

👥 MOTORISTAS
• [n] em serviço, [n] disponíveis
⚠️ [alertas se houver]

🔧 FROTA
• [n] activos, [n] em manutenção
⚠️ [alertas se houver]

💰 FINANÇAS
• Receita esperada hoje: €[valor]
• Ontem: €[valor] recebido
⚠️ [pagamentos pendentes]

💬 SUPORTE
• [n] threads abertos
⚠️ [urgentes]

Bom dia de trabalho! 💪
```

---

## Notas

- O briefing deve ser conciso e accionável
- Usar emojis para facilitar leitura rápida no telemóvel
- Se não houver alertas numa secção, mostrar ✅ em vez de listar tudo
- Prioridade: reservas sem motorista > frota em baixo > pagamentos pendentes
- Futuramente: enviar também por WhatsApp
