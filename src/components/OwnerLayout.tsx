import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { Button } from './Button'
import { BarChart3, Box, Calendar, Users, DollarSign, Settings, LogOut } from 'lucide-react'

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
    { path: '/financas', label: 'Finanças', icon: DollarSign },
    { path: '/definicoes', label: 'Definições', icon: Settings },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex h-screen bg-cream">
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-ink text-yellow transition-all duration-300 flex flex-col`}
      >
        <div className="p-4">
          {sidebarOpen ? (
            <Logo />
          ) : (
            <div className="text-2xl text-center">🛺</div>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2 rounded-btn transition-colors ${
                isActive(path)
                  ? 'bg-yellow text-ink'
                  : 'text-yellow hover:bg-yellow hover:bg-opacity-10'
              }`}
            >
              <Icon size={20} />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t border-yellow border-opacity-20">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 text-yellow hover:bg-yellow hover:bg-opacity-10 rounded-btn transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-line px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink">{profile?.full_name || 'Bem-vindo'}</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-ink2 hover:text-ink"
          >
            ☰
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
