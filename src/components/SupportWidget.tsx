import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Minus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: string
  thread_id: string
  sender_type: 'visitor' | 'agent' | 'system'
  body: string
  created_at: string
}

interface Thread {
  id: string
  status: string
  subject: string
}

const STORAGE_KEY = 'tukanapp_support_thread'

export const SupportWidget: React.FC = () => {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [thread, setThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load existing thread from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const t = JSON.parse(saved) as Thread
        setThread(t)
      } catch { /* ignore */ }
    }
  }, [])

  // Fetch messages when thread exists
  useEffect(() => {
    if (!thread) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true })
      if (data) setMessages(data)
    }

    fetchMessages()

    // Subscribe to realtime
    const channel = supabase
      .channel(`support-${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          if (msg.sender_type === 'agent' && (!open || minimized)) {
            setUnread(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [thread, open, minimized])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opening
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open, minimized])

  const createThread = async (): Promise<Thread | null> => {
    const name = profile?.full_name || 'Visitante'
    const { data, error } = await supabase
      .from('support_threads')
      .insert({
        visitor_name: name,
        subject: 'Chat de suporte',
        channel: 'widget',
        company_id: profile?.company_id || null,
      })
      .select()
      .single()

    if (error || !data) return null

    const t: Thread = { id: data.id, status: data.status, subject: data.subject }
    setThread(t)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t))

    // Auto welcome message
    await supabase.from('support_messages').insert({
      thread_id: data.id,
      sender_type: 'system',
      body: 'Bem-vindo ao suporte Tuk an App! Em que podemos ajudar?',
    })

    return t
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return

    setSending(true)
    let currentThread = thread

    if (!currentThread) {
      currentThread = await createThread()
      if (!currentThread) {
        setSending(false)
        return
      }
    }

    await supabase.from('support_messages').insert({
      thread_id: currentThread.id,
      sender_type: 'visitor',
      sender_id: profile?.id || null,
      body: text,
    })

    setInput('')
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const toggleOpen = () => {
    if (!open) {
      setOpen(true)
      setMinimized(false)
      setUnread(0)
    } else {
      setOpen(false)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Chat panel */}
      {open && !minimized && (
        <div
          className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-card rounded-2xl shadow-card-lg border border-line flex flex-col overflow-hidden"
          style={{
            height: '460px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div className="bg-ink px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛺</span>
              <div>
                <p className="text-yellow text-sm font-bold">Suporte Tuk an App</p>
                <p className="text-white text-opacity-60 text-xs">Normalmente respondemos em minutos</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white text-opacity-60 hover:text-yellow transition-colors"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white text-opacity-60 hover:text-yellow transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-cream">
            {messages.length === 0 && !thread && (
              <div className="text-center py-8 px-4">
                <p className="text-3xl mb-2">👋</p>
                <p className="text-ink font-bold text-sm">Precisa de ajuda?</p>
                <p className="text-ink2 text-xs mt-1">
                  Escreva a sua mensagem e respondemos o mais depressa possível.
                </p>
              </div>
            )}
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'visitor' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    msg.sender_type === 'visitor'
                      ? 'bg-ink text-yellow rounded-br-md'
                      : msg.sender_type === 'system'
                      ? 'bg-line text-ink2 rounded-bl-md text-xs italic'
                      : 'bg-card text-ink border border-line rounded-bl-md shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p
                    className={`text-2xs mt-1 ${
                      msg.sender_type === 'visitor'
                        ? 'text-yellow text-opacity-60'
                        : 'text-muted'
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-line bg-card px-3 py-2 flex items-center gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva uma mensagem..."
              className="flex-1 bg-cream border border-line rounded-xl px-3 py-2 text-sm text-ink placeholder-muted focus:outline-none focus:border-yellow"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-ink text-yellow hover:bg-opacity-90 disabled:opacity-40 transition-all flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-ink text-yellow shadow-card-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        style={{ boxShadow: '0 4px 20px rgba(24,24,26,0.25)' }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-copper text-white text-2xs font-bold flex items-center justify-center pulse-dot">
            {unread}
          </span>
        )}
      </button>
    </>
  )
}
