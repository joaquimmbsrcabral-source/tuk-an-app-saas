import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { BarChart3, Box, Calendar, Users, DollarSign, Settings, LogOut, Shield, CalendarDays, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'

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
    ...(profile?.is_super_admin ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
  ]

  const isActive = (path: string) => location.pathname === path

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
        <div className={`px-4 py-5 border-b border-white border-opacity-10 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          {sidebarOpen ? (
            <Logo variant="light" />
          ) : (
            <div className="text-2xl">🛺</div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                    : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-8'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{label}</span>
                )}
                {!sidebarOpen && !active && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-ink text-yellow text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-lg border border-yellow border-opacity-20 z-50">
                    {label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white border-opacity-10 p-3 space-y-1">
          <button
            onClick={() => signOut()}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-white text-opacity-60 hover:text-white hover:bg-white hover:bg-opacity-8 rounded-xl transition-all duration-150 ${
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
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-ink border border-yellow border-opacity-30 text-yellow flex items-center justify-center hover:bg-yellow hover:text-ink transition-all shadow-md"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-card border-b border-line px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-card">
          <div>
            <p className="text-xs text-ink2 font-medium">Bem-vindo de volta</p>
            <h1 className="text-base font-bold text-ink leading-tight">{profile?.full_name || '—'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow flex items-center justify-center text-ink font-black text-sm">
              {(profile?.full_name || 'O').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 page-enter">{children}</main>
      </div>
    </div>
  )
}
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { BarChart3, Box, Calendar, Users, DollarSign, Settings, LogOut, Shield, CalendarDays, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react'

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
    ...(profile?.is_super_admin ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
  ]

  const isActive = (path: string) => location.pathname === path

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
        <div className={`px-4 py-5 border-b border-white border-opacity-10 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          {sidebarOpen ? (
            <Logo />
          ) : (
            <div className="text-2xl">🛺</div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                    : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-8'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{label}</span>
                )}
                {!sidebarOpen && !active && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-ink text-yellow text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-lg border border-yellow border-opacity-20 z-50">
                    {label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white border-opacity-10 p-3 space-y-1">
          <button
            onClick={() => signOut()}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-white text-opacity-60 hover:text-white hover:bg-white hover:bg-opacity-8 rounded-xl transition-all duration-150 ${
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
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-ink border border-yellow border-opacity-30 text-yellow flex items-center justify-center hover:bg-yellow hover:text-ink transition-all shadow-md"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-card border-b border-line px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-card">
          <div>
            <p className="text-xs text-ink2 font-medium">Bem-vindo de volta</p>
            <h1 className="text-base font-bold text-ink leading-tight">{profile?.full_name || '—'}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow flex items-center justify-center text-ink font-black text-sm">
              {(profile?.full_name || 'O').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 page-enter">{children}</main>
      </div>
    </div>
  )
}
