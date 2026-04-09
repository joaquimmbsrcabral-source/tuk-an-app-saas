import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AuthUser, Profile } from '../lib/types'

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchProfile = async (userId: string) => {
      // 5-second timeout to avoid getting stuck in "Carregando..."
      const timeout = new Promise<{ data: null }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 5000)
      )
      const query = supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      const result = await Promise.race([query, timeout])
      return (result as any).data
    }

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && !cancelled) {
          setUser({ id: session.user.id, email: session.user.email || '' })
          const data = await fetchProfile(session.user.id)
          if (data && !cancelled) setProfile(data)
        }
      } catch (err) {
        console.error('Auth check failed:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      // Only react to actual sign-in / sign-out. TOKEN_REFRESHED, USER_UPDATED
      // and INITIAL_SESSION must NOT trigger a profile refetch — a transient
      // network blip would null out the profile and bounce the user to /login.
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        const data = await fetchProfile(session.user.id)
        if (!cancelled && data) setProfile(data)
        if (!cancelled) setLoading(false)
      }
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Make sure no stale session/state is left behind on failure
      await supabase.auth.signOut().catch(() => {})
      if (error.message?.toLowerCase().includes('invalid')) {
        throw new Error('Email ou senha incorrectos.')
      }
      throw new Error(error.message || 'Falha ao fazer login.')
    }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used dentro de AuthProvider')
  return context
}
