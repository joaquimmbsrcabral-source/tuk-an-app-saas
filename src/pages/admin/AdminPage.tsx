import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Copy, Trash2, Plus } from 'lucide-react'

type Row = {
  id: string
  name: string
  nif: string
  created_at: string
  owners: number
  drivers: number
  tuktuks: number
  bookings: number
  revenue: number
  payment_status: 'trial' | 'active' | 'past_due' | 'unknown'
}

export const AdminPage: React.FC = () => {
  const { profile } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [invites, setInvites] = useState<any[]>([])
  const [newCode, setNewCode] = useState('')
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data: companies } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
        const { data: profiles } = await supabase.from('profiles').select('id,company_id,role')
        const { data: tuktuks } = await supabase.from('tuktuks').select('id,company_id')
        const { data: bookings } = await supabase.from('bookings').select('id,company_id,price,status')
        const result: Row[] = (companies || []).map((c: any) => {
          const cps = (profiles || []).filter((p: any) => p.company_id === c.id)
          const cbk = (bookings || []).filter((b: any) => b.company_id === c.id)
          const createdDays = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24))
          return {
            id: c.id,
            name: c.name,
            nif: c.nif || '—',
            created_at: c.created_at,
            owners: cps.filter((p: any) => p.role === 'owner').length,
            drivers: cps.filter((p: any) => p.role === 'driver').length,
            tuktuks: (tuktuks || []).filter((t: any) => t.company_id === c.id).length,
            bookings: cbk.length,
            revenue: cbk.filter((b: any) => b.status === 'completed').reduce((s: number, b: any) => s + Number(b.price || 0), 0),
            payment_status: createdDays < 30 ? 'trial' : 'unknown',
          }
        })
        setRows(result)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
      fetchInvites()
    })()
  }, [])

  const fetchInvites = async () => {
    const { data } = await supabase.from('signup_invites').select('*').order('created_at', { ascending: false })
    setInvites(data || [])
  }

  const generate = async () => {
    if (!profile) return
    const code = newCode.trim() || `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const { error } = await supabase.from('signup_invites').insert([{ code, note: newNote || null, created_by: profile.id }])
    if (error) { alert(error.message); return }
    setNewCode(''); setNewNote('')
    fetchInvites()
  }

  const removeInvite = async (id: string) => {
    if (!window.confirm('Apagar este convite?')) return
    await supabase.from('signup_invites').delete().eq('id', id)
    fetchInvites()
  }

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/signup?code=${encodeURIComponent(code)}`
    navigator.clipboard.writeText(link)
    alert('Link copiado!\n' + link)
  }

  const totals = rows.reduce(
    (acc, r) => ({
      companies: acc.companies + 1,
      drivers: acc.drivers + r.drivers,
      tuktuks: acc.tuktuks + r.tuktuks,
      bookings: acc.bookings + r.bookings,
      revenue: acc.revenue + r.revenue,
    }),
    { companies: 0, drivers: 0, tuktuks: 0, bookings: 0, revenue: 0 }
  )

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Admin · Tuk an App</h1>
          <p className="text-ink2 text-sm">Visão global de todas as empresas da plataforma.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><div className="text-xs text-ink2">Empresas</div><div className="text-2xl font-bold text-ink">{totals.companies}</div></Card>
          <Card><div className="text-xs text-ink2">Motoristas</div><div className="text-2xl font-bold text-ink">{totals.drivers}</div></Card>
          <Card><div className="text-xs text-ink2">TukTuks</div><div className="text-2xl font-bold text-ink">{totals.tuktuks}</div></Card>
          <Card><div className="text-xs text-ink2">Reservas</div><div className="text-2xl font-bold text-ink">{totals.bookings}</div></Card>
          <Card><div className="text-xs text-ink2">Receita €</div><div className="text-2xl font-bold text-ink">{totals.revenue.toFixed(0)}</div></Card>
        </div>
        <Card>
          {loading ? (
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
                    <th className="py-2 pr-4">Receita €</th>
                    <th className="py-2 pr-4">Pagamento</th>
                    <th className="py-2 pr-4">Desde</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-line">
                      <td className="py-2 pr-4 font-medium text-ink">{r.name}</td>
                      <td className="py-2 pr-4 text-ink2">{r.nif}</td>
                      <td className="py-2 pr-4">{r.owners}</td>
                      <td className="py-2 pr-4">{r.drivers}</td>
                      <td className="py-2 pr-4">{r.tuktuks}</td>
                      <td className="py-2 pr-4">{r.bookings}</td>
                      <td className="py-2 pr-4">{r.revenue.toFixed(0)}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-1 rounded-btn ${
                          r.payment_status === 'active' ? 'bg-green bg-opacity-10 text-green' :
                          r.payment_status === 'trial' ? 'bg-yellow bg-opacity-20 text-ink' :
                          r.payment_status === 'past_due' ? 'bg-red-100 text-red-700' :
                          'bg-line text-ink2'
                        }`}>
                          {r.payment_status === 'trial' ? 'Trial' : r.payment_status === 'active' ? 'Ativo' : r.payment_status === 'past_due' ? 'Em atraso' : '—'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-ink2">{new Date(r.created_at).toLocaleDateString('pt-PT')}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={9} className="py-6 text-center text-ink2">Sem empresas ainda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink mb-4">Convites de Registo</h2>
          <p className="text-xs text-ink2 mb-3">Só pessoas com código válido podem criar conta. Gera um código e partilha o link.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Input label="Código (opcional)" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="AMIGO-2026" />
            <Input label="Nota" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Para quem é" />
            <div className="flex items-end">
              <Button onClick={generate} variant="primary" className="w-full"><Plus size={18} className="mr-2" />Gerar Convite</Button>
            </div>
          </div>
          {invites.length === 0 ? (
            <p className="text-sm text-ink2 text-center py-4">Nenhum convite criado ainda.</p>
          ) : (
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 border border-line rounded-btn">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-ink">{inv.code}</code>
                      {inv.used_at ? (
                        <span className="text-xs px-2 py-1 rounded-btn bg-ink2 bg-opacity-10 text-ink2">Usado</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-btn bg-green bg-opacity-10 text-green">Ativo</span>
                      )}
                    </div>
                    {inv.note && <p className="text-xs text-ink2 mt-1">{inv.note}</p>}
                  </div>
                  <div className="flex gap-1">
                    {!inv.used_at && (
                      <button onClick={() => copyLink(inv.code)} className="p-2 text-ink2 hover:text-ink" title="Copiar link">
                        <Copy size={16} />
                      </button>
                    )}
                    <button onClick={() => removeInvite(inv.id)} className="p-2 text-copper hover:text-copper">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </OwnerLayout>
  )
}
