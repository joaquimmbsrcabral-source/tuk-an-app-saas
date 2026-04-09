import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AuthUser, Profile, DriverStatus } from '../lib/types'

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateMyStatus: (next: DriverStatus) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfileById = async (userId: string) => {
    const timeout = new Promise<{ data: null }>((resolve) =>
      setTimeout(() => resolve({ data: null }), 5000)
    )
    const query = supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    const result = await Promise.race([query, timeout])
    return (result as any).data
  }

  const refreshProfile = async () => {
    if (!user) return
    const data = await fetchProfileById(user.id)
    if (data) setProfile(data)
  }

  const updateMyStatus = async (next: DriverStatus) => {
    if (!profile) return
    // Optimistic update
    setProfile({ ...profile, status: next, status_updated_at: new Date().toISOString() })
    const { error } = await supabase
      .from('profiles')
      .update({ status: next, status_updated_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (error) {
      console.error('Failed to update status:', error)
      // Rollback by refetching
      await refreshProfile()
      throw error
    }
  }

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && !cancelled) {
          setUser({ id: session.user.id, email: session.user.email || '' })
          const data = await fetchProfileById(session.user.id)
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
      // and INITIAL_SESSION must NOT trigger a profile refetch.
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' })
        const data = await fetchProfileById(session.user.id)
        if (!cancelled && data) setProfile(data)
        if (!cancelled) setLoading(false)
      }
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [])

  // Heartbeat: keep last_seen_at fresh while the driver app is open.
  // Owner UI uses this to auto-mark stale drivers (last_seen > 2min) as offline.
  useEffect(() => {
    if (!profile || profile.role !== 'driver') return
    let cancelled = false

    const ping = async () => {
      if (cancelled) return
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', profile.id)
    }

    ping()
    const id = setInterval(ping, 60_000)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [profile?.id, profile?.role])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
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
    if (profile?.role === 'driver') {
      await supabase
        .from('profiles')
        .update({ status: 'offline', status_updated_at: new Date().toISOString() })
        .eq('id', profile.id)
        .then(() => {})
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile, updateMyStatus }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
