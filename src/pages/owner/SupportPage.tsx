import React, { useState, useEffect, useRef } from 'react'
import { OwnerLayout } from '../../components/OwnerLayout'
import { EmptyState } from '../../components/EmptyState'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { MessageCircle, Send, CheckCircle, Clock, AlertCircle, Search, ArrowLeft } from 'lucide-react'

interface Thread {
  id: string
  visitor_name: string
  visitor_email: string | null
  visitor_phone: string | null
  subject: string
  status: 'open' | 'waiting' | 'resolved' | 'closed'
  channel: string
  company_id: string | null
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  thread_id: string
  sender_type: 'visitor' | 'agent' | 'system'
  sender_id: string | null
  body: string
  created_at: string
}

const statusConfig = {
  open: { label: 'Aberto', color: 'bg-copper', icon: AlertCircle },
  waiting: { label: 'A aguardar', color: 'bg-yellow', icon: Clock },
  resolved: { label: 'Resolvido', color: 'bg-green', icon: CheckCircle },
  closed: { label: 'Fechado', color: 'bg-muted', icon: CheckCircle },
}

export const SupportPage: React.FC = () => {
  const { profile } = useAuth()
  const [threads, setThreads] = useState<Thread[]>([])
  const [selected, setSelected] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch threads
  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('support_threads')
        .select('*')
        .order('updated_at', { ascending: false })
      if (data) setThreads(data)
      setLoading(false)
    }
    fetchThreads()

    // Realtime for new threads
    const channel = supabase
      .channel('support-threads-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_threads' },
        () => { fetchThreads() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Fetch messages when thread selected
  useEffect(() => {
    if (!selected) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('thread_id', selected.id)
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }
    fetchMessages()

    const channel = supabase
      .channel(`support-inbox-${selected.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `thread_id=eq.${selected.id}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selected) inputRef.current?.focus()
  }, [selected])

  const sendReply = async () => {
    const text = input.trim()
    if (!text || !selected || sending) return

    setSending(true)
    await supabase.from('support_messages').insert({
      thread_id: selected.id,
      sender_type: 'agent',
      sender_id: profile?.id || null,
      body: text,
    })

    // Update thread status to waiting (waiting for visitor reply)
    await supabase
      .from('support_threads')
      .update({ status: 'waiting' })
      .eq('id', selected.id)

    setInput('')
    setSending(false)
  }

  const updateStatus = async (threadId: string, status: string) => {
    await supabase
      .from('support_threads')
      .update({ status })
      .eq('id', threadId)

    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, status: status as Thread['status'] } : t))
    if (selected?.id === threadId) {
      setSelected(prev => prev ? { ...prev, status: status as Thread['status'] } : null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendReply()
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'agora'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })
  }

  const formatFullTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  }

  const filteredThreads = threads.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter
    const matchesSearch = !search || t.visitor_name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const openCount = threads.filter(t => t.status === 'open').length

  return (
    <OwnerLayout>
      <div className="flex flex-col h-full -m-6">
        <div className="flex flex-1 overflow-hidden">
          {/* Thread list */}
          <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-line bg-card flex-shrink-0`}>
            {/* List header */}
            <div className="px-4 py-3 border-b border-line">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                  <MessageCircle size={20} />
                  Suporte
                  {openCount > 0 && (
                    <span className="bg-copper text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {openCount}
                    </span>
                  )}
                </h2>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Procurar..."
                  className="w-full bg-cream border border-line rounded-xl pl-8 pr-3 py-1.5 text-sm text-ink placeholder-muted focus:outline-none focus:border-yellow"
                />
              </div>
              <div className="flex gap-1 mt-2">
                {['all', 'open', 'waiting', 'resolved'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      filter === f
                        ? 'bg-ink text-yellow'
                        : 'text-ink2 hover:bg-cream'
                    }`}
                  >
                    {f === 'all' ? 'Todos' : statusConfig[f as keyof typeof statusConfig]?.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Thread items */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton h-16 rounded-xl" />
                  ))}
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted text-sm">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                filteredThreads.map(t => {
                  const sc = statusConfig[t.status]
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setSelected(t); setMessages([]) }}
                      className={`w-full text-left px-4 py-3 border-b border-line hover:bg-cream transition-colors ${
                        selected?.id === t.id ? 'bg-cream' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.color}`} />
                            <p className="text-sm font-bold text-ink truncate">{t.visitor_name}</p>
                          </div>
                          <p className="text-xs text-ink2 truncate mt-0.5">{t.subject}</p>
                        </div>
                        <span className="text-2xs text-muted flex-shrink-0">{formatTime(t.updated_at)}</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-cream min-w-0`}>
            {selected ? (
              <>
                {/* Chat header */}
                <div className="bg-card border-b border-line px-4 py-3 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setSelected(null)}
                      className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-ink2 hover:text-ink hover:bg-cream transition-colors"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink truncate">{selected.visitor_name}</p>
                      <p className="text-xs text-muted">
                        {statusConfig[selected.status].label} · {selected.channel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selected.status !== 'resolved' && (
                      <button
                        onClick={() => updateStatus(selected.id, 'resolved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <CheckCircle size={12} />
                        Resolver
                      </button>
                    )}
                    {selected.status === 'resolved' && (
                      <button
                        onClick={() => updateStatus(selected.id, 'open')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-copper text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Reabrir
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          msg.sender_type === 'agent'
                            ? 'bg-ink text-yellow rounded-br-md'
                            : msg.sender_type === 'system'
                            ? 'bg-line text-ink2 rounded-bl-md text-xs italic'
                            : 'bg-card text-ink border border-line rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <p className={`text-2xs mt-1 ${
                          msg.sender_type === 'agent' ? 'text-yellow text-opacity-60' : 'text-muted'
                        }`}>
                          {formatFullTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Reply input */}
                <div className="border-t border-line bg-card px-4 py-3 flex items-end gap-2 flex-shrink-0">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreva a resposta..."
                    rows={1}
                    className="flex-1 bg-cream border border-line rounded-xl px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-yellow resize-none"
                    style={{ minHeight: '38px', maxHeight: '120px' }}
                  />
                  <button
                    onClick={sendReply}
                    disabled={!input.trim() || sending}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-ink text-yellow hover:bg-opacity-90 disabled:opacity-40 transition-all flex-shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={<MessageCircle size={24} />}
                  title="Selecione uma conversa"
                  description="Escolha uma conversa da lista para ver as mensagens"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </OwnerLayout>
  )
}
