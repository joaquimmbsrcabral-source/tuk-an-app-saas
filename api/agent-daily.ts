import { createClient } from '@supabase/supabase-js';

// ══════════════════════════════════════════════════════════════════════════════
// Tuk an App — Daily Agent v1.0 (Fase 1: Observação)
// Vercel Node.js Serverless Function + Cron Job
// Corre todos os dias às 09:00 UTC — recolhe dados e envia briefing por email
// ══════════════════════════════════════════════════════════════════════════════

export default async function handler(req: any, res: any) {
  // Apenas GET (Vercel Cron usa GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar CRON_SECRET para bloquear chamadas não autorizadas
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── Inicializar Supabase (service role — bypass RLS) ──────────────────────
  const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // ── 1. Reservas de hoje ───────────────────────────────────────────────────
  const { data: todayBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, customer_name, tour_type, pax, start_time, price, status, tuktuk_id, driver_id')
    .gte('start_time', `${todayStr}T00:00:00`)
    .lte('start_time', `${todayStr}T23:59:59`);

  // ── 2. Escala de motoristas de hoje ──────────────────────────────────────
  const { data: todayShifts, error: shiftsError } = await supabase
    .from('shifts')
    .select('id, driver_id, tuktuk_id, shift_date')
    .eq('shift_date', todayStr);

  // ── 3. Estado da frota ────────────────────────────────────────────────────
  const { data: tuktuks, error: tuktuksError } = await supabase
    .from('tuktuks')
    .select('id, plate, nickname, status, km, insurance_expiry, next_service_km');

  // ── 4. Pagamentos de ontem ────────────────────────────────────────────────
  const { data: yesterdayPayments, error: paymentsError } = await supabase
    .from('payments')
    .select('id, amount, method')
    .gte('received_at', `${yesterdayStr}T00:00:00`)
    .lte('received_at', `${yesterdayStr}T23:59:59`);

  // ── 5. Reservas confirmadas (para verificar pendentes) ────────────────────
  const { data: confirmedBookings, error: confirmedError } = await supabase
    .from('bookings')
    .select('id, price, customer_name, status')
    .eq('status', 'confirmed');

  // ── 6. Todos os motoristas ────────────────────────────────────────────────
  const { data: drivers, error: driversError } = await supabase
    .from('profiles')
    .select('user_id, full_name, role')
    .eq('role', 'driver');

  // ── Calcular estatísticas ─────────────────────────────────────────────────
  const bookingCount = todayBookings?.length ?? 0;
  const bookingsWithoutDriver = todayBookings?.filter((b: any) => !b.driver_id).length ?? 0;
  const bookingsWithoutTuktuk = todayBookings?.filter((b: any) => !b.tuktuk_id).length ?? 0;
  const expectedRevenue = todayBookings?.reduce((s: number, b: any) => s + (b.price || 0), 0) ?? 0;

  const activeTuktuks = tuktuks?.filter((t: any) => t.status === 'active') ?? [];
  const inactiveTuktuks = tuktuks?.filter((t: any) => t.status !== 'active') ?? [];
  const expiringInsurance = (tuktuks ?? []).filter((t: any) =>
    t.insurance_expiry && new Date(t.insurance_expiry) < nextWeek
  );
  const needsService = (tuktuks ?? []).filter((t: any) =>
    t.next_service_km && t.km && (t.next_service_km - t.km) < 500
  );

  const yesterdayRevenue = yesterdayPayments?.reduce((s: number, p: any) => s + (p.amount || 0), 0) ?? 0;
  const confirmedCount = confirmedBookings?.length ?? 0;
  const confirmedTotal = confirmedBookings?.reduce((s: number, b: any) => s + (b.price || 0), 0) ?? 0;

  const errors: string[] = [
    bookingsError  && `Reservas: ${bookingsError.message}`,
    shiftsError    && `Turnos: ${shiftsError.message}`,
    tuktuksError   && `Frota: ${tuktuksError.message}`,
    paymentsError  && `Pagamentos: ${paymentsError.message}`,
    driversError   && `Motoristas: ${driversError.message}`,
    confirmedError && `Confirmadas: ${confirmedError.message}`,
  ].filter(Boolean) as string[];

  const reportData = {
    date: todayStr,
    bookings: {
      count: bookingCount,
      withoutDriver: bookingsWithoutDriver,
      withoutTuktuk: bookingsWithoutTuktuk,
      expectedRevenue,
      statuses: (todayBookings ?? []).reduce((acc: Record<string, number>, b: any) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {}),
      list: (todayBookings ?? []).map((b: any) => ({
        hora: b.start_time?.substring(11, 16),
        cliente: b.customer_name,
        tour: b.tour_type,
        pax: b.pax,
        temMotorista: !!b.driver_id,
        temTuktuk: !!b.tuktuk_id,
      })),
    },
    shifts: {
      count: todayShifts?.length ?? 0,
      driversTotal: drivers?.length ?? 0,
    },
    fleet: {
      active: activeTuktuks.length,
      inactive: inactiveTuktuks.length,
      inactiveList: inactiveTuktuks.map((t: any) => `${t.nickname} (${t.plate}) — ${t.status}`),
      expiringInsurance: expiringInsurance.map((t: any) =>
        `${t.nickname} (${t.plate}) expira ${t.insurance_expiry}`),
      needsService: needsService.map((t: any) =>
        `${t.nickname} — faltam ${(t.next_service_km - t.km).toFixed(0)} km para revisão`),
    },
    finances: {
      expectedToday: expectedRevenue,
      receivedYesterday: yesterdayRevenue,
      confirmedBookings: confirmedCount,
      confirmedTotal,
    },
    dataErrors: errors,
  };

  // ── Gerar relatório com Claude claude-sonnet-4-6 ──────────────────────────────────────
  const prompt = `És o agente de operações diário da Tuk an App, plataforma SaaS de gestão de tours de tuk-tuk em Lisboa.

Dados recolhidos para ${todayStr}:
${JSON.stringify(reportData, null, 2)}

Gera o briefing matinal para o Joaquim (proprietário) em português europeu, usando exactamente este formato:

Bom dia Joaquim! 

 HOJE — ${todayStr}

 RESERVAS (${bookingCount} tours)
[lista detalhada ou "Nenhuma reserva para hoje."]
[alertas: reservas sem motorista/tuktuk OU ✅ Sem alertas]

 MOTORISTAS
[resumo: quantos em serviço, quantos disponíveis]
[alertas ou ✅ Sem alertas]

 FROTA
[resumo: activos vs inactivos]
[alertas de manutenção/seguro ou ✅ Sem alertas]

 FINANÇAS
• Receita esperada hoje: €${expectedRevenue.toFixed(2)}
• Recebido ontem: €${yesterdayRevenue.toFixed(2)}
[alertas de pendentes ou ✅ Sem pendentes]

 3 SUGESTÕES DE MELHORIA
1. [sugestão concreta e accionável baseada nos dados]
2. [sugestão concreta e accionável baseada nos dados]
3. [sugestão concreta e accionável baseada nos dados]

Bom dia de trabalho! ${errors.length > 0 ? '\n\n---\n⚠️ Erros de recolha de dados: ' + errors.join(', ') : ''}`;

  let report = '';
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const anthropicData = (await anthropicRes.json()) as any;
    report = anthropicData.content?.[0]?.text ?? 'Não foi possível gerar o relatório.';
  } catch (err: any) {
    report = `[Erro ao contactar Claude: ${err.message}]\n\nDados brutos:\n${JSON.stringify(reportData, null, 2)}`;
  }

  // ── Enviar email via Resend ───────────────────────────────────────────────
  let emailResult: any = { skipped: 'RESEND_API_KEY não configurado' };
  if (process.env.RESEND_API_KEY) {
    try {
      const htmlReport = report
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Tuk an App <agent@resend.dev>',
          to: ['joaquimmbsrcabral@gmail.com'],
          subject: ` Briefing Diário — ${todayStr}`,
          text: report,
          html: `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6;background:#f9fafb;">
  <div style="background:#f97316;border-radius:12px;padding:16px 24px;margin-bottom:24px;">
    <h1 style="margin:0;color:white;font-size:20px;"> Tuk an App — Briefing Diário</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${todayStr}</p>
  </div>
  <div style="background:white;border-radius:12px;padding:24px;white-space:pre-wrap;font-size:15px;">${htmlReport}</div>
  <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;">
  <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
    Enviado automaticamente pelo Agente Tuk an App às 09:00 UTC todos os dias.<br>
    Gerado por Claude claude-sonnet-4-6 • Dados do Supabase em tempo real
  </p>
</body></html>`,
        }),
      });
      emailResult = await emailRes.json();
    } catch (err: any) {
      emailResult = { error: err.message };
    }
  }

  // ── Resposta ──────────────────────────────────────────────────────────────
  return res.status(200).json({
    success: true,
    date: todayStr,
    stats: reportData,
    emailResult,
    reportPreview: report.substring(0, 400),
  });
}
