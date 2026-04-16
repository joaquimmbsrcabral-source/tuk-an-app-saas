import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'

type CompanyRow = {
  id: string
  name: string
  nif: string
  created_at: string
  owners: number
  drivers: number
  tuktuks: number
  bookings: number
  revenue: number
  street_sales_count: number
  street_sales_revenue: number
  payment_status: 'trial' | 'active' | 'past_due' | 'unknown'
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

type Tab = 'overview' | 'invites' | 'help'

const SIGNUP_BASE = (typeof window !== 'undefined' ? window.location.origin : 'https://www.tukanapp.pt')

function makeCode(noteHint = ''): string {
  const year = new Date().getFullYear()
  const letters = (noteHint || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const alpha = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const rand = Array.from({ length: 2 }, () => alpha[Math.floor(Math.random() * alpha.length)]).join('')
  const prefix = letters.length >= 2 ? letters.slice(0, 2) : (letters + rand).slice(0, 2)
  return `${prefix}-${year}`
}

export const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview')

  // Overview state
  const [rows, setRows] = useState<CompanyRow[]>([])
  const [loadingRows, setLoadingRows] = useState(true)

  // Invite state
  const [invites, setInvites] = useState<Invite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newExpires, setNewExpires] = useState('')
  const [inviteErr, setInviteErr] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadOverview()
  }, [])

  useEffect(() => {
    if (tab === 'invites') loadInvites()
  }, [tab])

  async function loadOverview() {
    setLoadingRows(true)
    try {
      const { data: companies } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
      const { data: profiles } = await supabase.from('profiles').select('id,company_id,role')
      const { data: tuktuks } = await supabase.from('tuktuks').select('id,company_id')
      const { data: bookings } = await supabase.from('bookings').select('id,company_id,price,status')
      const { data: streetSales } = await supabase.from('street_sales').select('id,company_id,amount')

      const result: CompanyRow[] = (companies || []).map((c: any) => {
        const cps = (profiles || []).filter((p: any) => p.company_id === c.id)
        const cbk = (bookings || []).filter((b: any) => b.company_id === c.id)
        const css = (streetSales || []).filter((s: any) => s.company_id === c.id)
        const createdDays = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: c.id,
          name: c.name,
          nif: c.nif || '\u2014',
          created_at: c.created_at,
          owners: cps.filter((p: any) => p.role === 'owner').length,
          drivers: cps.filter((p: any) => p.role === 'driver').length,
          tuktuks: (tuktuks || []).filter((t: any) => t.company_id === c.id).length,
          bookings: cbk.length,
          revenue: cbk.filter((b: any) => b.status === 'completed').reduce((s: number, b: any) => s + Number(b.price || 0), 0),
          street_sales_count: css.length,
          street_sales_revenue: css.reduce((s: number, ss: any) => s + Number(ss.amount || 0), 0),
          payment_status: createdDays < 30 ? 'trial' : 'unknown',
        }
      })
      setRows(result)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingRows(false)
    }
  }

  async function loadInvites() {
    setLoadingInvites(true)
    try {
      const { data, error } = await supabase
        .from('signup_invites')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setInvites((data || []) as Invite[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingInvites(false)
    }
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteErr('')
    setInviteMsg('')
    const codeValue = (newCode || makeCode(newNote)).toUpperCase().trim()
    if (codeValue.length < 3) {
      setInviteErr('C\u00f3digo tem de ter pelo menos 3 caracteres')
      return
    }
    try {
      const payload: any = { p_code: codeValue, p_note: newNote || null }
      if (newExpires) payload.p_expires_at = new Date(newExpires).toISOString()
      const { error } = await supabase.rpc('admin_create_invite', payload)
      if (error) {
        if ((error.message || '').includes('code_exists')) throw new Error('J\u00e1 existe um c\u00f3digo com esse valor')
        throw error
      }
      setInviteMsg(`C\u00f3digo ${codeValue} criado`)
      setNewCode('')
      setNewNote('')
      setNewExpires('')
      await loadInvites()
    } catch (err: any) {
      setInviteErr(err.message || 'Falha ao criar c\u00f3digo')
    }
  }

  async function handleDeleteInvite(id: string) {
    if (!confirm('Eliminar este c\u00f3digo? S\u00f3 \u00e9 poss\u00edvel se ainda n\u00e3o foi usado.')) return
    try {
      const { error } = await supabase.rpc('admin_delete_invite', { p_id: id })
      if (error) throw error
      await loadInvites()
    } catch (e: any) {
      alert(e.message || 'Falha ao eliminar')
    }
  }

  async function copyLink(invite: Invite) {
    const url = `${SIGNUP_BASE}/signup?code=${encodeURIComponent(invite.code)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(invite.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      prompt('Copia este link:', url)
    }
  }

  const totals = rows.reduce(
    (acc, r) => ({
      companies: acc.companies + 1,
      drivers: acc.drivers + r.drivers,
      tuktuks: acc.tuktuks + r.tuktuks,
      bookings: acc.bookings + r.bookings,
      revenue: acc.revenue + r.revenue,
      street_sales: acc.street_sales + r.street_sales_count,
      street_revenue: acc.street_revenue + r.street_sales_revenue,
    }),
    { companies: 0, drivers: 0, tuktuks: 0, bookings: 0, revenue: 0, street_sales: 0, street_revenue: 0 }
  )

  const totalRevenue = totals.revenue + totals.street_revenue

  const activeInvites = invites.filter((i) => !i.used_at && (!i.expires_at || new Date(i.expires_at) > new Date()))
  const usedInvites = invites.filter((i) => i.used_at)

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Super Admin \u00b7 Tuk an App</h1>
            <p className="text-ink2 text-sm">Gest\u00e3o da plataforma \u2014 empresas, convites e suporte.</p>
          </div>
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-btn text-sm font-600 ${tab === 'overview' ? 'bg-ink text-cream' : 'bg-line text-ink hover:bg-ink hover:text-cream'}`}
              onClick={() => setTab('overview')}
            >
              Vis\u00e3o Geral
            </button>
            <button
              className={`px-4 py-2 rounded-btn text-sm font-600 ${tab === 'invites' ? 'bg-ink text-cream' : 'bg-line text-ink hover:bg-ink hover:text-cream'}`}
              onClick={() => setTab('invites')}
            >
              C\u00f3digos de Convite
            </button>
            <button
              className={`px-4 py-2 rounded-btn text-sm font-600 ${tab === 'help' ? 'bg-ink text-cream' : 'bg-line text-ink hover:bg-ink hover:text-cream'}`}
              onClick={() => setTab('help')}
            >
              Como Funciona
            </button>
          </div>
        </div>

        {tab === 'overview' && (
          <>
            {/* Top-level KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <div className="text-xs text-ink2">Empresas</div>
                <div className="text-2xl font-bold text-ink">{totals.companies}</div>
              </Card>
              <Card>
                <div className="text-xs text-ink2">Motoristas</div>
                <div className="text-2xl font-bold text-ink">{totals.drivers}</div>
              </Card>
              <Card>
                <div className="text-xs text-ink2">TukTuks</div>
                <div className="text-2xl font-bold text-ink">{totals.tuktuks}</div>
              </Card>
              <Card>
                <div className="text-xs text-ink2">Receita Total \u20ac</div>
                <div className="text-2xl font-bold text-ink">{totalRevenue.toFixed(0)}</div>
                <div className="text-[10px] text-ink2 mt-0.5">
                  {totals.bookings} reservas + {totals.street_sales} vendas rua
                </div>
              </Card>
            </div>

            {/* Revenue breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="text-xs text-ink2">Receita de Reservas</div>
                <div className="text-xl font-bold text-ink">\u20ac{totals.revenue.toFixed(0)}</div>
                <div className="text-[10px] text-ink2">{totals.bookings} reservas completas</div>
              </Card>
              <Card>
                <div className="text-xs text-ink2">Receita de Vendas de Rua</div>
                <div className="text-xl font-bold text-ink">\u20ac{totals.street_revenue.toFixed(0)}</div>
                <div className="text-[10px] text-ink2">{totals.street_sales} vendas registadas</div>
              </Card>
              <Card>
                <div className="text-xs text-ink2">C\u00f3digos de Convite</div>
                <div className="text-xl font-bold text-ink">{activeInvites.length} ativos</div>
                <div className="text-[10px] text-ink2">{usedInvites.length} usados de {invites.length} total</div>
              </Card>
            </div>

            {/* Companies table */}
            <Card>
              <h2 className="text-lg font-bold text-ink mb-4">Empresas ({rows.length})</h2>
              {loadingRows ? (
                <div className="text-center py-8 text-ink2">A carregar...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-ink2">
                        <th className="py-2 pr-4">Empresa</th>
                        <th className="py-2 pr-4">NIF</th>
                        <th className="py-2 pr-4">Owners</th>
                        <th className="py-2 pr-4">Motoristas</th>
                        <th className="py-2 pr-4">TukTuks</th>
                        <th className="py-2 pr-4">Reservas</th>
                        <th className="py-2 pr-4">V. Rua</th>
                        <th className="py-2 pr-4">Receita \u20ac</th>
                        <th className="py-2 pr-4">Pagamento</th>
                        <th className="py-2 pr-4">Desde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const total = r.revenue + r.street_sales_revenue
                        return (
                          <tr key={r.id} className="border-b border-line">
                            <td className="py-2 pr-4 font-medium text-ink">{r.name}</td>
                            <td className="py-2 pr-4 text-ink2">{r.nif}</td>
                            <td className="py-2 pr-4">{r.owners}</td>
                            <td className="py-2 pr-4">{r.drivers}</td>
                            <td className="py-2 pr-4">{r.tuktuks}</td>
                            <td className="py-2 pr-4">{r.bookings}</td>
                            <td className="py-2 pr-4">{r.street_sales_count}</td>
                            <td className="py-2 pr-4 font-600">{total.toFixed(0)}</td>
                            <td className="py-2 pr-4">
                              <span className={`text-xs px-2 py-1 rounded-btn ${
                                r.payment_status === 'active' ? 'bg-green bg-opacity-10 text-green' :
                                r.payment_status === 'trial' ? 'bg-yellow bg-opacity-20 text-ink' :
                                r.payment_status === 'past_due' ? 'bg-copper bg-opacity-10 text-copper' :
                                'bg-line text-ink2'
                              }`}>
                                {r.payment_status === 'trial' ? 'Trial' :
                                 r.payment_status === 'active' ? 'Ativo' :
                                 r.payment_status === 'past_due' ? 'Em atraso' : '\u2014'}
                              </span>
                            </td>
                            <td className="py-2 pr-4 text-ink2">{new Date(r.created_at).toLocaleDateString('pt-PT')}</td>
                          </tr>
                        )
                      })}
                      {rows.length === 0 && (
                        <tr><td colSpan={10} className="py-6 text-center text-ink2">Sem empresas ainda.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Vercel Analytics hint */}
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-btn bg-yellow bg-opacity-20 flex items-center justify-center text-lg">
                  \ud83d\udcca
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Web Analytics</h3>
                  <p className="text-xs text-ink2">
                    As visitas \u00e0 landing page e ao dashboard est\u00e3o dispon\u00edveis no{' '}
                    <a href="https://vercel.com/joaquimmbsrcabral-4447s-projects/tuk-an-app-saas/analytics" target="_blank" rel="noopener noreferrer" className="text-yellow font-600 underline">
                      Vercel Analytics
                    </a>
                    {' '}\u2014 page views, visitantes \u00fanicos, pa\u00edses e referrers.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {tab === 'invites' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><div className="text-xs text-ink2">C\u00f3digos ativos</div><div className="text-2xl font-bold text-ink">{activeInvites.length}</div></Card>
              <Card><div className="text-xs text-ink2">C\u00f3digos usados</div><div className="text-2xl font-bold text-ink">{usedInvites.length}</div></Card>
              <Card><div className="text-xs text-ink2">Total gerado</div><div className="text-2xl font-bold text-ink">{invites.length}</div></Card>
            </div>

            <Card>
              <h2 className="text-lg font-bold text-ink mb-4">Criar novo c\u00f3digo</h2>
              {inviteErr && (
                <div className="bg-copper bg-opacity-10 border border-copper text-copper px-4 py-2 rounded-btn mb-3 text-sm">{inviteErr}</div>
              )}
              {inviteMsg && (
                <div className="bg-green bg-opacity-10 border border-green text-green px-4 py-2 rounded-btn mb-3 text-sm">{inviteMsg}</div>
              )}
              <form onSubmit={handleCreateInvite} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-ink2 mb-1">Nome / Empresa (opcional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-card border border-line rounded-btn text-sm"
                    placeholder="Ex: Salvador S\u00e1"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink2 mb-1">C\u00f3digo (vazio = gerar)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-card border border-line rounded-btn text-sm uppercase font-mono"
                    placeholder="SA-2026"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink2 mb-1">Expira a (opcional)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-card border border-line rounded-btn text-sm"
                    value={newExpires}
                    onChange={(e) => setNewExpires(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="primary" className="w-full">Criar c\u00f3digo</Button>
                </div>
              </form>
              <p className="text-xs text-ink2 mt-3">
                Depois de criar o c\u00f3digo, copia o link e envia ao cliente. O link abre o registo j\u00e1 com o c\u00f3digo preenchido.
              </p>
            </Card>

            <Card>
              <h2 className="text-lg font-bold text-ink mb-4">C\u00f3digos ativos ({activeInvites.length})</h2>
              {loadingInvites ? (
                <div className="text-center py-8 text-ink2">A carregar...</div>
              ) : activeInvites.length === 0 ? (
                <div className="text-center py-8 text-ink2">Nenhum c\u00f3digo ativo.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-ink2">
                        <th className="py-2 pr-4">C\u00f3digo</th>
                        <th className="py-2 pr-4">Nota</th>
                        <th className="py-2 pr-4">Criado</th>
                        <th className="py-2 pr-4">Expira</th>
                        <th className="py-2 pr-4">A\u00e7\u00f5es</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeInvites.map((i) => (
                        <tr key={i.id} className="border-b border-line">
                          <td className="py-2 pr-4 font-mono font-bold text-ink">{i.code}</td>
                          <td className="py-2 pr-4 text-ink2">{i.note || '\u2014'}</td>
                          <td className="py-2 pr-4 text-ink2">{new Date(i.created_at).toLocaleDateString('pt-PT')}</td>
                          <td className="py-2 pr-4 text-ink2">{i.expires_at ? new Date(i.expires_at).toLocaleDateString('pt-PT') : 'Nunca'}</td>
                          <td className="py-2 pr-4">
                            <div className="flex gap-2">
                              <button
                                className="px-3 py-1 text-xs rounded-btn bg-yellow text-ink font-600 hover:bg-yellow-dark"
                                onClick={() => copyLink(i)}
                              >
                                {copiedId === i.id ? '\u2713 Copiado' : 'Copiar link'}
                              </button>
                              <button
                                className="px-3 py-1 text-xs rounded-btn bg-line text-ink2 hover:bg-copper hover:text-cream"
                                onClick={() => handleDeleteInvite(i.id)}
                              >
                                Eliminar
                              </button>
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
                <h2 className="text-lg font-bold text-ink mb-4">C\u00f3digos usados ({usedInvites.length})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-ink2">
                        <th className="py-2 pr-4">C\u00f3digo</th>
                        <th className="py-2 pr-4">Nota</th>
                        <th className="py-2 pr-4">Usado a</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usedInvites.map((i) => (
                        <tr key={i.id} className="border-b border-line">
                          <td className="py-2 pr-4 font-mono text-ink2 line-through">{i.code}</td>
                          <td className="py-2 pr-4 text-ink2">{i.note || '\u2014'}</td>
                          <td className="py-2 pr-4 text-ink2">{i.used_at ? new Date(i.used_at).toLocaleString('pt-PT') : '\u2014'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {tab === 'help' && (
          <Card>
            <h2 className="text-xl font-bold text-ink mb-4">Como convidar um novo cliente (Owner)</h2>
            <ol className="list-decimal list-inside space-y-3 text-ink">
              <li>
                Vai a <strong>C\u00f3digos de Convite</strong> e cria um c\u00f3digo novo.
                <div className="text-sm text-ink2 ml-6 mt-1">
                  Escreve o nome/empresa do cliente (ex: <em>Salvador S\u00e1</em>) e clica em <strong>Criar c\u00f3digo</strong>. O c\u00f3digo \u00e9 gerado automaticamente (ex: <code>SA-2026</code>).
                </div>
              </li>
              <li>
                Copia o <strong>link de convite</strong> (bot\u00e3o <em>Copiar link</em>).
                <div className="text-sm text-ink2 ml-6 mt-1">
                  Exemplo: <code>{SIGNUP_BASE}/signup?code=SA-2026</code>
                </div>
              </li>
              <li>
                Envia o link ao cliente por <strong>email, WhatsApp ou SMS</strong>.
                <div className="text-sm text-ink2 ml-6 mt-1">
                  Quando o cliente abre o link, o c\u00f3digo j\u00e1 vai preenchido. Ele s\u00f3 tem de completar nome, empresa, telefone, email e palavra-passe.
                </div>
              </li>
              <li>
                Quando o cliente concluir o registo, o c\u00f3digo \u00e9 <strong>marcado como usado</strong> automaticamente e n\u00e3o pode ser reutilizado.
              </li>
            </ol>
            <div className="mt-6 bg-yellow bg-opacity-10 border border-yellow rounded-btn p-4">
              <h3 className="font-bold text-ink mb-2">Problemas comuns</h3>
              <ul className="text-sm text-ink2 space-y-1 list-disc list-inside">
                <li><strong>O cliente n\u00e3o viu onde meter o c\u00f3digo</strong> \u2014 envia-lhe o link completo (<code>/signup?code=...</code>) para ser autom\u00e1tico.</li>
                <li><strong>Email j\u00e1 registado</strong> \u2014 o cliente tem de usar um email que ainda n\u00e3o existe no sistema.</li>
                <li><strong>C\u00f3digo j\u00e1 usado</strong> \u2014 cria um novo c\u00f3digo e envia.</li>
                <li><strong>N\u00e3o recebeu email de confirma\u00e7\u00e3o</strong> \u2014 diz-lhe para verificar o spam, ou reenvia o link.</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </OwnerLayout>
  )
}
