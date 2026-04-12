import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import {
  BarChart3, Box, Calendar, Users, DollarSign, Settings, LogOut,
  Shield, CalendarDays, ChevronLeft, ChevronRight, MessageCircle
} from 'lucide-react'

interface OwnerLayoutProps {
  children: React.ReactNode
}

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({ children }) => {
  const { signOut, profile } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/frota', label: 'Frota', icon: Box },
    { path: '/reservas', label: 'Reservas', icon: Calendar },
    { path: '/motoristas', label: 'Motoristas', icon: Users },
    { path: '/escala', label: 'Escala', icon: CalendarDays },
    { path: '/financas', label: 'Finanças', icon: DollarSign },
    { path: '/suporte', label: 'Suporte', icon: MessageCircle },
    { path: '/definicoes', label: 'Definições', icon: Settings },
    ...(profile?.is_super_admin
      ? [{ path: '/admin', label: 'Admin', icon: Shield }]
      : []),
  ]

  const isActive = (path: string) => location.pathname === path

  const initials = (profile?.full_name || 'O').charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-60' : 'w-[72px]'
        } bg-ink flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out relative z-10`}
        style={{ boxShadow: '4px 0 24px rgba(24,24,26,0.12)' }}
      >
        {/* Logo area */}
        <div
          className={`px-4 py-5 border-b border-white/10 ${
            sidebarOpen ? '' : 'flex justify-center'
          }`}
        >
          {sidebarOpen ? (
            <Logo variant="light" linkTo="/dashboard" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-yellow flex items-center justify-center text-ink font-black text-sm shadow-sm">
              T
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                title={!sidebarOpen ? label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                  active
                    ? 'bg-yellow text-ink font-bold shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium truncate">{label}</span>
                )}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-ink text-yellow text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-lg border border-yellow/20 z-50">
                    {label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User & sign out */}
        <div className="border-t border-white/10 p-3 space-y-2">
          {/* User info */}
          {sidebarOpen && profile?.full_name && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-yellow flex items-center justify-center text-ink font-black text-sm flex-shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {profile.full_name}
                </p>
                <p className="text-[10px] text-white/40 truncate leading-tight mt-0.5">
                  {profile.company_name || 'Operador'}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => signOut()}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all duration-150 ${
              !sidebarOpen ? 'justify-center' : ''
            }`}
            title={!sidebarOpen ? 'Sair' : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-ink border border-yellow/30 text-yellow flex items-center justify-center hover:bg-yellow hover:text-ink transition-all shadow-md"
        >
          {sidebarOpen ? (
            <ChevronLeft size={12} />
          ) : (
            <ChevronRight size={12} />
          )}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-card border-b border-line px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-card">
          <div>
            <p className="text-xs text-ink2 font-medium">Bem-vindo de volta</p>
            <h1 className="text-base font-bold text-ink leading-tight">
              {profile?.full_name || '—'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] text-ink2 bg-cream/60 border border-line px-2.5 py-1 rounded-lg hidden sm:block">
              {new Date().toLocaleDateString('pt-PT', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </div>
            <div className="w-9 h-9 rounded-full bg-yellow flex items-center justify-center text-ink font-black text-sm shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
