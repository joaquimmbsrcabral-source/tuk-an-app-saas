import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { Shield, Users, Car, CalendarDays, Wallet, ChevronRight, ChevronLeft, Search, Star, Zap, Eye, RefreshCw, Plus, Copy, Trash2, Check, X, MessageCircle, ArrowRight } from 'lucide-react'

/* ── Types ──────────────────────────────────────────── */

type CompanyAdmin = {
  id: string
  name: string
  nif: string | null
  plan: 'starter' | 'pro'
  plan_max_tuktuks: number
  plan_max_drivers: number
  plan_updated_at: string | null
  admin_notes: string | null
  created_at: string
  owners: { id: string; full_name: string; email: string; phone: string | null; last_seen_at: string | null }[]
  driver_count: number
  tuktuk_count: number
  booking_count: number
  revenue: number
  street_sales_count: number
  street_sales_revenue: number
}

type Invite = {
  id: string
  code: string
  note: string | null
  created_at: string
  used_at: string | null
  used_by: string | null
  expires_at: string | null
  created_by: string | null
}

type Tab = 'empresas' | 'invites' | 'help'

type RecentBooking = {
  id: string
  customer_name: string
  tour_type: string
  start_at: string
  price: number
  status: string
  driver_name: string | null
}

const SIGNUP_BASE = (typeof window !== 'undefined' ? window.location.origin : 'https://www.tukanapp.pt')

const planLabel = (p: string) => p === 'pro' ? 'Pro' : 'Starter'
const planColor = (p: string) => p === 'pro' ? 'bg-copper text-cream' : 'bg-yellow text-ink'

function makeCode(noteHint = ''): string {
  const year = new Date().getFullYear()
  const letters = (noteHint || '').trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  const alpha = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const rand = Array.from({ length: 2 }, () => alpha[Math.floor(Math.random() * alpha.length)]).join('')
  const prefix = letters.length >= 2 ? letters.slice(0, 2) : (letters + rand).slice(0, 2)
  return `${prefix}-${year}`
}

/* ── Main Component ─────────────────────────────────── */

export const AdminPage: React.FC = () => {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('empresas')
  const [companies, setCompanies] = useState<CompanyAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Invite state
  const [invites, setInvites] = useState<Invite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newExpires, setNewExpires] = useState('')
  const [inviteErr, setInviteErr] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: comps }, { data: profs }, { data: tks }, { data: bks }, { data: ss }] = await Promise.all([
        supabase.from('companies').select('id,name,nif,plan,plan_max_tuktuks,plan_max_drivers,plan_updated_at,admin_notes,created_at').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id,company_id,role,full_name,phone,last_seen_at').order('created_at'),
        supabase.from('tuktuks').select('id,company_id'),
        supabase.from('bookings').select('id,company_id,price,status'),
        supabase.from('street_sales').select('id,company_id,price'),
      ])
      // Get auth emails for owners
      const ownerProfiles = (profs || []).filter((p: any) => p.role === 'owner')

      const result: CompanyAdmin[] = (comps || []).map((c: any) => {
        const cOwners = ownerProfiles.filter((p: any) => p.company_id === c.id)
        const cDrivers = (profs || []).filter((p: any) => p.company_id === c.id && p.role === 'driver')
        const cTuktuks = (tks || []).filter((t: any) => t.company_id === c.id)
        const cBookings = (bks || []).filter((b: any) => b.company_id === c.id)
        const cSales = (ss || []).filter((s: any) => s.company_id === c.id)
        return {
          id: c.id,
          name: c.name,
          nif: c.nif,
          plan: c.plan || 'starter',
          plan_max_tuktuks: c.plan_max_tuktuks || 2,
          plan_max_drivers: c.plan_max_drivers || 3,
          plan_updated_at: c.plan_updated_at,
          admin_notes: c.admin_notes,
          created_at: c.created_at,
          owners: cOwners.map((o: any) => ({ id: o.id, full_name: o.full_name || 'Sem nome', email: '', phone: o.phone, last_seen_at: o.last_seen_at })),
          driver_count: cDrivers.length,
          tuktuk_count: cTuktuks.length,
          booking_count: cBookings.length,
          revenue: cBookings.filter((b: any) => b.status === 'completed').reduce((s: number, b: any) => s + Number(b.price || 0), 0),
          street_sales_count: cSales.length,
          street_sales_revenue: cSales.reduce((s: number, x: any) => s + Number(x.price || 0), 0),
        }
      })
      setCompanies(result)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCompanies() }, [loadCompanies])
  useEffect(() => { if (tab === 'invites') loadInvites() }, [tab])

  /* ── Invite helpers ─── */
  async function loadInvites() {
    setLoadingInvites(true)
    try {
      const { data, error } = await supabase.from('signup_invites').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setInvites((data || []) as Invite[])
    } catch (e) { console.error(e) } finally { setLoadingInvites(false) }
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteErr(''); setInviteMsg('')
    const codeValue = (newCode || makeCode(newNote)).toUpperCase().trim()
    if (codeValue.length < 3) { setInviteErr('Código tem de ter pelo menos 3 caracteres'); return }
    try {
      const payload: any = { p_code: codeValue, p_note: newNote || null }
      if (newExpires) payload.p_expires_at = new Date(newExpires).toISOString()
      const { error } = await supabase.rpc('admin_create_invite', payload)
      if (error) { if ((error.message || '').includes('code_exists')) throw new Error('Já existe um código com esse valor'); throw error }
      setInviteMsg(`Código ${codeValue} criado`)
      setNewCode(''); setNewNote(''); setNewExpires('')
      await loadInvites()
    } catch (err: any) { setInviteErr(err.message || 'Falha ao criar código') }
  }

  async function handleDeleteInvite(id: string) {
    if (!confirm('Eliminar este código?')) return
    try { const { error } = await supabase.rpc('admin_delete_invite', { p_id: id }); if (error) throw error; await loadInvites() }
    catch (e: any) { alert(e.message || 'Falha ao eliminar') }
  }

  async function copyLink(invite: Invite) {
    const url = `${SIGNUP_BASE}/signup?code=${encodeURIComponent(invite.code)}`
    try { await navigator.clipboard.writeText(url); setCopiedId(invite.id); setTimeout(() => setCopiedId(null), 2000) }
    catch { prompt('Copia este link:', url) }
  }

  /* ── Computed ─── */
  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.nif || '').includes(search))
  const selected = companies.find(c => c.id === selectedId) || null
  const starterCount = companies.filter(c => c.plan === 'starter').length
  const proCount = companies.filter(c => c.plan === 'pro').length
  const totalRevenue = companies.reduce((s, c) => s + c.revenue + c.street_sales_revenue, 0)
  const activeInvites = invites.filter(i => !i.used_at && (!i.expires_at || new Date(i.expires_at) > new Date()))
  const usedInvites = invites.filter(i => i.used_at)

  /* ── Tabs ─── */
  const tabs: { key: Tab; label: string }[] = [
    { key: 'empresas', label: 'Empresas' },
    { key: 'invites', label: 'Códigos de Convite' },
    { key: 'help', label: 'Como Funciona' },
  ]

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
              <Shield size={24} className="text-copper" /> Super Admin
            </h1>
            <p className="text-ink2 text-sm mt-1">Gestão de empresas, planos e convites.</p>
          </div>
          <div className="flex gap-2">
            {tabs.map(t => (
              <button key={t.key} className={`px-4 py-2 rounded-btn text-sm font-semibold transition-colors ${tab === t.key ? 'bg-ink text-cream' : 'bg-line text-ink hover:bg-ink hover:text-cream'}`} onClick={() => { setTab(t.key); if (t.key !== 'empresas') setSelectedId(null) }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════ EMPRESAS TAB ═══════════════ */}
        {tab === 'empresas' && !selected && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><div className="text-xs text-ink2">Total Empresas</div><div className="text-2xl font-bold text-ink">{companies.length}</div></Card>
              <Card>
                <div className="text-xs text-ink2">Planos</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-btn bg-yellow text-ink font-semibold">{starterCount} Starter</span>
                  <span className="text-xs px-2 py-0.5 rounded-btn bg-copper text-cream font-semibold">{proCount} Pro</span>
                </div>
              </Card>
              <Card>
                <div className="text-xs text-ink2">Receita Total</div>
                <div className="text-2xl font-bold text-ink">€{totalRevenue.toFixed(0)}</div>
              </Card>
              <Card>
                <div className="text-xs text-ink2">Convites Ativos</div>
                <div className="text-2xl font-bold text-ink">{activeInvites.length}</div>
                <div className="text-[10px] text-ink2">{usedInvites.length} usados</div>
              </Card>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink2" />
              <input type="text" placeholder="Pesquisar empresa por nome ou NIF..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-line rounded-btn text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Companies list */}
            <Card>
              <h2 className="text-lg font-bold text-ink mb-4">Empresas ({filtered.length})</h2>
              {loading ? (
                <div className="text-center py-8 text-ink2">A carregar...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-ink2">
                        <th className="py-2 pr-4">Empresa</th>
                        <th className="py-2 pr-4">Plano</th>
                        <th className="py-2 pr-4">TukTuks</th>
                        <th className="py-2 pr-4">Motoristas</th>
                        <th className="py-2 pr-4">Reservas</th>
                        <th className="py-2 pr-4">Receita €</th>
                        <th className="py-2 pr-4">Desde</th>
                        <th className="py-2 pr-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => {
                        const total = c.revenue + c.street_sales_revenue
                        return (
                          <tr key={c.id} className="border-b border-line hover:bg-cream/50 cursor-pointer transition-colors" onClick={() => setSelectedId(c.id)}>
                            <td className="py-3 pr-4">
                              <div className="font-semibold text-ink">{c.name}</div>
                              {c.nif && <div className="text-xs text-ink2">NIF: {c.nif}</div>}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`text-xs px-2.5 py-1 rounded-btn font-semibold ${planColor(c.plan)}`}>
                                {planLabel(c.plan)}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="font-semibold">{c.tuktuk_count}</span>
                              <span className="text-ink2">/{c.plan_max_tuktuks === 999 ? '∞' : c.plan_max_tuktuks}</span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="font-semibold">{c.driver_count}</span>
                              <span className="text-ink2">/{c.plan_max_drivers === 999 ? '∞' : c.plan_max_drivers}</span>
                            </td>
                            <td className="py-3 pr-4">{c.booking_count}</td>
                            <td className="py-3 pr-4 font-semibold">€{total.toFixed(0)}</td>
                            <td className="py-3 pr-4 text-ink2">{new Date(c.created_at).toLocaleDateString('pt-PT')}</td>
                            <td className="py-3"><ChevronRight size={16} className="text-ink2" /></td>
                          </tr>
                        )
                      })}
                      {filtered.length === 0 && (
                        <tr><td colSpan={8} className="py-8 text-center text-ink2">Nenhuma empresa encontrada.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Vercel Analytics */}
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-btn bg-yellow/20 flex items-center justify-center text-lg">📊</div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Web Analytics</h3>
                  <p className="text-xs text-ink2">
                    Visitas à landing page no{' '}
                    <a href="https://vercel.com/joaquimmbsrcabral-4447s-projects/tuk-an-app-saas/analytics" target="_blank" rel="noopener noreferrer" className="text-copper font-semibold underline">Vercel Analytics</a>.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ═══════════════ COMPANY DETAIL ═══════════════ */}
        {tab === 'empresas' && selected && (
          <CompanyDetail company={selected} onBack={() => setSelectedId(null)} onRefresh={loadCompanies} />
        )}

        {/* ═══════════════ INVITES TAB ═══════════════ */}
        {tab === 'invites' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><div className="text-xs text-ink2">Códigos ativos</div><div className="text-2xl font-bold text-ink">{activeInvites.length}</div></Card>
              <Card><div className="text-xs text-ink2">Códigos usados</div><div className="text-2xl font-bold text-ink">{usedInvites.length}</div></Card>
              <Card><div className="text-xs text-ink2">Total gerado</div><div className="text-2xl font-bold text-ink">{invites.length}</div></Card>
            </div>

            <Card>
              <h2 className="text-lg font-bold text-ink mb-4">Criar novo código</h2>
              {inviteErr && <div className="bg-copper/10 border border-copper text-copper px-4 py-2 rounded-btn mb-3 text-sm">{inviteErr}</div>}
              {inviteMsg && <div className="bg-green/10 border border-green text-green px-4 py-2 rounded-btn mb-3 text-sm">{inviteMsg}</div>}
              <form onSubmit={handleCreateInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-ink2 mb-1">Nome / Empresa</label>
                  <input type="text" className="w-full px-3 py-2 bg-card border border-line rounded-btn text-sm" placeholder="Ex: Salvador Sá" value={newNote} onChange={e => setNewNote(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-ink2 mb-1">Código (vazio = gerar)</label>
                  <input type="text" className="w-full px-3 py-2 bg-card border border-line rounded-btn text-sm uppercase font-mono" placeholder="SA-2026" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className="block text-xs text-ink2 mb-1">Expira a (opcional)</label>
                  <input type="date" className="w-full px-3 py-2 bg-card border border-line rounded-btn text-sm" value={newExpires} onChange={e => setNewExpires(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="primary" className="w-full">Criar código</Button>
                </div>
              </form>
            </Card>

            <Card>
              <h2 className="text-lg font-bold text-ink mb-4">Códigos ativos ({activeInvites.length})</h2>
              {loadingInvites ? <div className="text-center py-8 text-ink2">A carregar...</div> : activeInvites.length === 0 ? <div className="text-center py-8 text-ink2">Nenhum código ativo.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-line text-left text-ink2"><th className="py-2 pr-4">Código</th><th className="py-2 pr-4">Nota</th><th className="py-2 pr-4">Criado</th><th className="py-2 pr-4">Expira</th><th className="py-2 pr-4">Ações</th></tr></thead>
                    <tbody>
                      {activeInvites.map(i => (
                        <tr key={i.id} className="border-b border-line">
                          <td className="py-2 pr-4 font-mono font-bold text-ink">{i.code}</td>
                          <td className="py-2 pr-4 text-ink2">{i.note || '—'}</td>
                          <td className="py-2 pr-4 text-ink2">{new Date(i.created_at).toLocaleDateString('pt-PT')}</td>
                          <td className="py-2 pr-4 text-ink2">{i.expires_at ? new Date(i.expires_at).toLocaleDateString('pt-PT') : 'Nunca'}</td>
                          <td className="py-2 pr-4">
                            <div className="flex gap-2">
                              <button className="px-3 py-1 text-xs rounded-btn bg-yellow text-ink font-semibold hover:bg-yellow/80" onClick={() => copyLink(i)}>{copiedId === i.id ? '✓ Copiado' : 'Copiar link'}</button>
                              <button className="px-3 py-1 text-xs rounded-btn bg-line text-ink2 hover:bg-copper hover:text-cream" onClick={() => handleDeleteInvite(i.id)}>Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {usedInvites.length > 0 && (
              <Card>
                <h2 className="text-lg font-bold text-ink mb-4">Códigos usados ({usedInvites.length})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-line text-left text-ink2"><th className="py-2 pr-4">Código</th><th className="py-2 pr-4">Nota</th><th className="py-2 pr-4">Usado a</th></tr></thead>
                    <tbody>
                      {usedInvites.map(i => (
                        <tr key={i.id} className="border-b border-line">
                          <td className="py-2 pr-4 font-mono text-ink2 line-through">{i.code}</td>
                          <td className="py-2 pr-4 text-ink2">{i.note || '—'}</td>
                          <td className="py-2 pr-4 text-ink2">{i.used_at ? new Date(i.used_at).toLocaleString('pt-PT') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ═══════════════ HELP TAB ═══════════════ */}
        {tab === 'help' && (
          <Card>
            <h2 className="text-xl font-bold text-ink mb-4">Como convidar um novo cliente (Owner)</h2>
            <ol className="list-decimal list-inside space-y-3 text-ink">
              <li>Vai a <strong>Códigos de Convite</strong> e cria um código novo.<div className="text-sm text-ink2 ml-6 mt-1">Escreve o nome/empresa do cliente e clica em <strong>Criar código</strong>.</div></li>
              <li>Copia o <strong>link de convite</strong> (botão <em>Copiar link</em>).<div className="text-sm text-ink2 ml-6 mt-1">Exemplo: <code>{SIGNUP_BASE}/signup?code=SA-2026</code></div></li>
              <li>Envia o link ao cliente por <strong>email, WhatsApp ou SMS</strong>.</li>
              <li>Quando o cliente concluir o registo, o código é <strong>marcado como usado</strong> automaticamente.</li>
            </ol>
            <div className="mt-6 bg-yellow/10 border border-yellow rounded-btn p-4">
              <h3 className="font-bold text-ink mb-2">Gestão de planos</h3>
              <ul className="text-sm text-ink2 space-y-1 list-disc list-inside">
                <li>Todos os novos clientes começam no plano <strong>Starter</strong> (gratuito, 2 TukTuks, 3 motoristas).</li>
                <li>Para fazer upgrade para <strong>Pro</strong>, vai a <strong>Empresas</strong>, clica na empresa e usa o botão <strong>Upgrade para Pro</strong>.</li>
                <li>O Pro desbloqueia TukTuks e motoristas ilimitados, relatórios avançados e exportação de dados.</li>
                <li>O valor do plano Pro é 29€/mês — combina o pagamento diretamente com o cliente.</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </OwnerLayout>
  )
}

/* ── Company Detail Component ───────────────────────── */

const CompanyDetail: React.FC<{
  company: CompanyAdmin
  onBack: () => void
  onRefresh: () => Promise<void>
}> = ({ company, onBack, onRefresh }) => {
  const [notes, setNotes] = useState(company.admin_notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [changingPlan, setChangingPlan] = useState(false)
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)

  useEffect(() => {
    setNotes(company.admin_notes || '')
    loadRecentBookings()
  }, [company.id])

  async function loadRecentBookings() {
    setLoadingBookings(true)
    try {
      const { data } = await supabase
        .from('bookings')
        .select('id,customer_name,tour_type,start_at,price,status,driver_id')
        .eq('company_id', company.id)
        .order('start_at', { ascending: false })
        .limit(10)
      setRecentBookings((data || []).map((b: any) => ({
        id: b.id,
        customer_name: b.customer_name || '—',
        tour_type: b.tour_type || '—',
        start_at: b.start_at,
        price: Number(b.price || 0),
        status: b.status,
        driver_name: null,
      })))
    } catch (e) { console.error(e) } finally { setLoadingBookings(false) }
  }

  async function handleTogglePlan() {
    const newPlan = company.plan === 'starter' ? 'pro' : 'starter'
    const confirmMsg = newPlan === 'pro'
      ? `Fazer upgrade de "${company.name}" para Pro?\n\nIsto desbloqueia TukTuks e motoristas ilimitados.`
      : `Fazer downgrade de "${company.name}" para Starter?\n\nIsto limita a 2 TukTuks e 3 motoristas.`
    if (!confirm(confirmMsg)) return

    setChangingPlan(true)
    try {
      const updates: any = {
        plan: newPlan,
        plan_max_tuktuks: newPlan === 'pro' ? 999 : 2,
        plan_max_drivers: newPlan === 'pro' ? 999 : 3,
        plan_updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('companies').update(updates).eq('id', company.id)
      if (error) throw error
      await onRefresh()
    } catch (e: any) {
      alert('Erro ao mudar plano: ' + (e.message || 'Erro desconhecido'))
    } finally {
      setChangingPlan(false)
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    try {
      const { error } = await supabase.from('companies').update({ admin_notes: notes || null }).eq('id', company.id)
      if (error) throw error
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
      await onRefresh()
    } catch (e: any) {
      alert('Erro ao guardar notas: ' + (e.message || 'Erro'))
    } finally { setSavingNotes(false) }
  }

  const totalRevenue = company.revenue + company.street_sales_revenue
  const daysSinceCreation = Math.floor((Date.now() - new Date(company.created_at).getTime()) / (1000 * 60 * 60 * 24))

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow/20 text-ink',
    confirmed: 'bg-green/10 text-green',
    in_progress: 'bg-copper/10 text-copper',
    completed: 'bg-green/20 text-green',
    cancelled: 'bg-line text-ink2',
  }
  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmada',
    in_progress: 'Em curso',
    completed: 'Completa',
    cancelled: 'Cancelada',
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-copper font-semibold hover:underline">
        <ChevronLeft size={16} /> Voltar às empresas
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink flex items-center gap-3">
            {company.name}
            <span className={`text-xs px-3 py-1 rounded-btn font-semibold ${planColor(company.plan)}`}>
              {planLabel(company.plan)}
            </span>
          </h2>
          <p className="text-sm text-ink2 mt-1">
            {company.nif ? `NIF: ${company.nif} · ` : ''}
            Registada a {new Date(company.created_at).toLocaleDateString('pt-PT')} ({daysSinceCreation} dias)
          </p>
        </div>
        <button
          onClick={handleTogglePlan}
          disabled={changingPlan}
          className={`px-6 py-2.5 rounded-btn font-semibold text-sm transition-colors flex items-center gap-2 ${
            company.plan === 'starter'
              ? 'bg-copper text-cream hover:bg-copper/90'
              : 'bg-line text-ink hover:bg-ink hover:text-cream'
          }`}
        >
          {changingPlan ? 'A processar...' : company.plan === 'starter' ? (
            <><Zap size={16} /> Upgrade para Pro</>
          ) : (
            <><Star size={16} /> Downgrade para Starter</>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink2"><Car size={14} /> TukTuks</div>
          <div className="text-2xl font-bold text-ink mt-1">{company.tuktuk_count}<span className="text-sm text-ink2 font-normal">/{company.plan_max_tuktuks === 999 ? '∞' : company.plan_max_tuktuks}</span></div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink2"><Users size={14} /> Motoristas</div>
          <div className="text-2xl font-bold text-ink mt-1">{company.driver_count}<span className="text-sm text-ink2 font-normal">/{company.plan_max_drivers === 999 ? '∞' : company.plan_max_drivers}</span></div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink2"><CalendarDays size={14} /> Reservas</div>
          <div className="text-2xl font-bold text-ink mt-1">{company.booking_count}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink2"><Wallet size={14} /> Receita</div>
          <div className="text-2xl font-bold text-ink mt-1">€{totalRevenue.toFixed(0)}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-xs text-ink2"><Zap size={14} /> V. Rua</div>
          <div className="text-2xl font-bold text-ink mt-1">{company.street_sales_count}</div>
          <div className="text-xs text-ink2">€{company.street_sales_revenue.toFixed(0)}</div>
        </Card>
      </div>

      {/* Plan info */}
      {company.plan_updated_at && (
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-copper/10 flex items-center justify-center"><Wallet size={20} className="text-copper" /></div>
            <div>
              <h3 className="text-sm font-bold text-ink">Informação do Plano</h3>
              <p className="text-xs text-ink2">
                Plano atual: <strong>{planLabel(company.plan)}</strong>
                {company.plan === 'pro' && ' · 29€/mês'}
                {company.plan === 'starter' && ' · Gratuito'}
                {' · '}Última alteração: {new Date(company.plan_updated_at).toLocaleDateString('pt-PT')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Owners */}
      <Card>
        <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2"><Users size={18} /> Owners ({company.owners.length})</h3>
        {company.owners.length === 0 ? (
          <p className="text-sm text-ink2">Nenhum owner registado.</p>
        ) : (
          <div className="space-y-3">
            {company.owners.map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-cream rounded-btn">
                <div>
                  <div className="font-semibold text-ink text-sm">{o.full_name}</div>
                  <div className="text-xs text-ink2">
                    {o.phone && <span>📱 {o.phone} · </span>}
                    {o.last_seen_at ? `Último acesso: ${new Date(o.last_seen_at).toLocaleString('pt-PT')}` : 'Nunca acedeu'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1 ${o.last_seen_at && (Date.now() - new Date(o.last_seen_at).getTime()) < 86400000 ? 'bg-green' : 'bg-line'}`} title={o.last_seen_at ? 'Ativo nas últimas 24h' : 'Inativo'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Admin notes */}
      <Card>
        <h3 className="text-lg font-bold text-ink mb-3 flex items-center gap-2"><MessageCircle size={18} /> Notas Internas</h3>
        <p className="text-xs text-ink2 mb-2">Notas privadas sobre esta empresa — só visíveis para ti.</p>
        <textarea
          className="w-full px-4 py-3 bg-cream border border-line rounded-btn text-sm resize-none"
          rows={4}
          placeholder="Ex: Cliente contactou a 15/04, interessado no Pro. Vai decidir após experimentar 2 semanas..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <div className="flex items-center gap-3 mt-3">
          <Button variant="primary" onClick={handleSaveNotes} disabled={savingNotes}>
            {savingNotes ? 'A guardar...' : 'Guardar notas'}
          </Button>
          {notesSaved && <span className="text-sm text-green font-semibold flex items-center gap-1"><Check size={14} /> Guardado</span>}
        </div>
      </Card>

      {/* Recent bookings */}
      <Card>
        <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2"><CalendarDays size={18} /> Últimas Reservas</h3>
        {loadingBookings ? (
          <div className="text-center py-6 text-ink2">A carregar...</div>
        ) : recentBookings.length === 0 ? (
          <div className="text-center py-6 text-ink2">Nenhuma reserva registada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink2">
                  <th className="py-2 pr-4">Cliente</th>
                  <th className="py-2 pr-4">Tour</th>
                  <th className="py-2 pr-4">Data</th>
                  <th className="py-2 pr-4">Valor</th>
                  <th className="py-2 pr-4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b.id} className="border-b border-line">
                    <td className="py-2 pr-4 font-medium text-ink">{b.customer_name}</td>
                    <td className="py-2 pr-4 text-ink2">{b.tour_type}</td>
                    <td className="py-2 pr-4 text-ink2">{new Date(b.start_at).toLocaleDateString('pt-PT')}</td>
                    <td className="py-2 pr-4 font-semibold">€{b.price.toFixed(0)}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-btn font-semibold ${statusColors[b.status] || 'bg-line text-ink2'}`}>
                        {statusLabels[b.status] || b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <Card>
        <h3 className="text-lg font-bold text-ink mb-3">Ações Rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <a href={`mailto:ops@tukanapp.pt?subject=Tuk an App — ${encodeURIComponent(company.name)}`} className="px-4 py-2 rounded-btn bg-line text-ink text-sm font-semibold hover:bg-ink hover:text-cream transition-colors">
            ✉️ Enviar email ao owner
          </a>
          <a href={`https://wa.me/351915873799?text=${encodeURIComponent(`Nota interna: ${company.name} (${planLabel(company.plan)})`)}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-btn bg-line text-ink text-sm font-semibold hover:bg-ink hover:text-cream transition-colors">
            💬 WhatsApp (teu)
          </a>
          <button onClick={() => { navigator.clipboard.writeText(company.id); alert('ID copiado: ' + company.id) }} className="px-4 py-2 rounded-btn bg-line text-ink text-sm font-semibold hover:bg-ink hover:text-cream transition-colors">
            📋 Copiar ID da empresa
          </button>
        </div>
      </Card>
    </div>
  )
}
