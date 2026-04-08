import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'
import { Clock, History, User, Home } from 'lucide-react'

interface DriverLayoutProps {
  children: React.ReactNode
}

export const DriverLayout: React.FC<DriverLayoutProps> = ({ children }) => {
  const { signOut } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/driver/today', label: 'Hoje', icon: Home },
    { path: '/driver/history', label: 'Histórico', icon: History },
    { path: '/driver/profile', label: 'Perfil', icon: User },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex flex-col h-screen bg-cream">
      <header className="bg-card border-b border-line px-4 py-3 flex items-center justify-between">
        <div className="flex-1">
          <Logo />
        </div>
        <button
          onClick={() => signOut()}
          className="text-sm text-ink2 hover:text-ink font-600"
        >
          Sair
        </button>
      </header>

      <main className="flex-1 overflow-auto pb-20">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-line flex justify-around">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
              isActive(path)
                ? 'text-yellow border-t-2 border-yellow'
                : 'text-ink2 hover:text-ink'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
