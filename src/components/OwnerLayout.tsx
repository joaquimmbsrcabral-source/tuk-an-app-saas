import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import {
  BarChart3, Box, Calendar, Users, DollarSign, Settings, LogOut, Shield,
  CalendarDays, ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react'

interface OwnerLayoutProps {
  children: React.ReactNode
}

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({ children }) => {
  const { signOut, profile } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/frota', label: 'Frota', icon: Box },
    { path: '/reservas', label: 'Reservas', icon: Calendar },
    { path: '/motoristas', label: 'Motoristas', icon: Users },
    { path: '/escala', label: 'Escala', icon: CalendarDays },
    { path: '/financas', label: 'Financas', icon: DollarSign },
    { path: '/definicoes', label: 'Definicoes', icon: Settings },
    ...(profile?.is_super_admin ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
  ]

  const bottomNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/reservas', label: 'Reservas', icon: Calendar },
    { path: '/motoristas', label: 'Equipa', icon: Users },
    { path: '/escala', label: 'Escala', icon: CalendarDays },
    { path: '/financas', label: 'Finanças', icon: DollarSign },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-ink flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ boxShadow: '4px 0 24px rgba(24,24,26,0.18)' }}
      >
        <div className="px-4 py-5 border-b border-white border-opacity-10 flex items-center justify-between">
          <Logo />
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-lg bg-white bg-opacity-10 flex items-center justify-center text-white"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 ${
                  active
                    ? 'bg-yellow text-ink font-bold shadow-sm'
                    : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-8'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-white border-opacity-10 p-3">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-3 text-white text-opacity-60 hover:text-white hover:bg-white hover:bg-opacity-8 rounded-xl transition-all duration-150"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex ${
          sidebarOpen ? 'w-60' : 'w-[72px]'
        } bg-ink flex-col flex-shrink-0 transition-all duration-300 ease-in-out relative z-10`}
        style={{ boxShadow: '4px 0 24px rgba(24,24,26,0.12)' }}
      >
        <div className={`px-4 py-5 border-b border-white border-opacity-10 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          {sidebarOpen ? (
            <Logo />
          ) : (
            <div className="text-2xl">🛺</div>
          )}
        </div>

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

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-ink border border-yellow border-opacity-30 text-yellow flex items-center justify-center hover:bg-yellow hover:text-ink transition-all shadow-md"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-card border-b border-line px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-card">
          <button
            className="md:hidden w-10 h-10 -ml-1 rounded-xl flex items-center justify-center text-ink hover:bg-cream transition-colors"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 md:flex-none">
            <p className="text-xs text-ink2 font-medium">Bem-vindo de volta</p>
            <h1 className="text-base font-bold text-ink leading-tight">{profile?.full_name || '—'}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow flex items-center justify-center text-ink font-black text-sm">
              {(profile?.full_name || 'O').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 pb-24 md:pb-6 page-enter">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-line flex md:hidden z-20" style={{ minHeight: '56px' }}>
        {bottomNavItems.map(({ path, label, icon: Icon }) => {
          const active = isActive(path)
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors relative ${
                active ? 'text-ink' : 'text-ink2'
              }`}
            >
              {active && (
                <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-yellow rounded-full" />
              )}
              <Icon size={20} className={active ? 'text-yellow' : ''} />
              <span className={`text-[10px] font-medium ${active ? 'text-ink font-bold' : ''}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
