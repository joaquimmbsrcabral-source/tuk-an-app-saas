import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { StatusBadge } from './StatusBadge'
import { Home, History, User, Calendar, DollarSign } from 'lucide-react'

interface DriverLayoutProps {
  children: React.ReactNode
}

export const DriverLayout: React.FC<DriverLayoutProps> = ({ children }) => {
  const { signOut, profile } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/driver/today', label: 'Hoje', icon: Home },
    { path: '/driver/schedule', label: 'Escala', icon: Calendar },
    { path: '/driver/finance', label: 'Financas', icon: DollarSign },
    { path: '/driver/history', label: 'Historico', icon: History },
    { path: '/driver/profile', label: 'Perfil', icon: User },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex flex-col h-screen bg-cream">
      {/* Header */}
      <header
        className="bg-card border-b border-line px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ boxShadow: '0 1px 8px rgba(24,24,26,0.06)' }}
      >
        <div className="flex-shrink-0">
          <Logo />
        </div>
        <div className="flex items-center gap-3">
          {profile?.role === 'driver' && <StatusBadge status={profile.status || 'offline'} size="sm" />}
          <div className="w-8 h-8 rounded-full bg-yellow flex items-center justify-center text-ink font-black text-sm">
            {(profile?.full_name || 'M').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-20">{children}</main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card border-t border-line flex justify-around safe-area-pb"
        style={{ boxShadow: '0 -4px 20px rgba(24,24,26,0.08)' }}
      >
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = isActive(path)
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all duration-150 relative ${
                active ? 'text-ink' : 'text-ink2 hover:text-ink'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-yellow rounded-b-full" />
              )}
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[10px] font-medium mt-0.5 ${active ? 'font-bold text-ink' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-yellow" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
