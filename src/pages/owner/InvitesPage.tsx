import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { OwnerLayout } from '../../components/OwnerLayout'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Copy, Trash2, Plus } from 'lucide-react'

export const InvitesPage: React.FC = () => {
  const { profile } = useAuth()
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')
  const [newNote, setNewNote] = useState('')

  useEffect(() => { fetchInvites() }, [profile])

  const fetchInvites = async () => {
    const { data } = await supabase.from('signup_invites').select('*').order('created_at', { ascending: false })
    setInvites(data || [])
    setLoading(false)
  }

  const generate = async () => {
    if (!profile) return
    const code = newCode.trim() || `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const { error } = await supabase.from('signup_invites').insert([{ code, note: newNote || null, created_by: profile.id }])
    if (error) { alert(error.message); return }
    setNewCode(''); setNewNote('')
    fetchInvites()
  }

  const remove = async (id: string) => {
    if (!window.confirm('Apagar este convite?')) return
    await supabase.from('signup_invites').delete().eq('id', id)
    fetchInvites()
  }

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/signup?code=${encodeURIComponent(code)}`
    navigator.clipboard.writeText(link)
    alert('Link copiado!\n' + link)
  }

  if (!profile?.is_super_admin) {
    return <OwnerLayout><div className="text-center py-12 text-ink2">Só super admins podem gerir convites.</div></OwnerLayout>
  }

  if (loading) return <OwnerLayout><div className="text-center py-12">Carregando...</div></OwnerLayout>

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-ink">Convites de Registo</h1>

        <Card>
          <h2 className="text-lg font-bold text-ink mb-4">Gerar Novo Convite</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Código (opcional)" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="AMIGO-2026" />
            <Input label="Nota" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Para quem é" />
            <div className="flex items-end">
              <Button onClick={generate} variant="primary" className="w-full"><Plus size={18} className="mr-2" />Gerar</Button>
            </div>
          </div>
          <p className="text-xs text-ink2 mt-2">Deixa o código vazio para gerar um aleatório. Partilha o link com a pessoa que queres convidar.</p>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-ink mb-4">Convites ({invites.length})</h2>
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
                    <button onClick={() => remove(inv.id)} className="p-2 text-copper hover:text-copper">
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
