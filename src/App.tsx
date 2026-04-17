import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { inject } from '@vercel/analytics'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Initialize Vercel Web Analytics
inject()

// Auth Pages
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { JoinPage } from './pages/JoinPage'

// Owner Pages
import { DashboardPage } from './pages/owner/DashboardPage'
import { FleetPage } from './pages/owner/FleetPage'
import { TukTukDetailPage } from './pages/owner/TukTukDetailPage'
import { BookingsPage } from './pages/owner/BookingsPage'
import { DriversPage } from './pages/owner/DriversPage'
import { FinancePage } from './pages/owner/FinancePage'
import { SettingsPage } from './pages/owner/SettingsPage'
import { OwnerSchedulePage } from './pages/owner/SchedulePage'
import { SupportPage } from './pages/owner/SupportPage'
import { PromoCodesPage } from './pages/owner/PromoCodesPage'
import { AdminPage } from './pages/admin/AdminPage'

// Components
import { SupportWidget } from './components/SupportWidget'
import { ErrorBoundary } from './components/ErrorBoundary'

// Driver Pages
import { TodayPage } from './pages/driver/TodayPage'
import { TourPage } from './pages/driver/TourPage'
// HistoryPage removed — redirects to FinancePage
import { ProfilePage } from './pages/driver/ProfilePage'
import { StreetSalePage } from './pages/driver/StreetSalePage'
import { DriverFinancePage } from './pages/driver/FinancePage'
import { DriverSchedulePage } from './pages/driver/SchedulePage'

const DriverRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <div className="flex items-center justify-center h-screen">Carregando...</div>
  if (profile.role !== 'driver') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <div className="flex items-center justify-center h-screen">Carregando...</div>
  if (profile.role !== 'owner') return <Navigate to="/driver/today" replace />
  return <>{children}</>
}

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>
  if (!user || !profile) return <Navigate to="/login" replace />
  if (!profile.is_super_admin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>
  if (user && profile) {
    return <Navigate to={profile.role === 'driver' ? '/driver/today' : '/dashboard'} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
            <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />
            <Route path="/join" element={<AuthLayout><JoinPage /></AuthLayout>} />

            {/* Owner Routes */}
            <Route path="/dashboard" element={<OwnerRoute><DashboardPage /></OwnerRoute>} />
            <Route path="/frota" element={<OwnerRoute><FleetPage /></OwnerRoute>} />
            <Route path="/frota/:id" element={<OwnerRoute><TukTukDetailPage /></OwnerRoute>} />
            <Route path="/reservas" element={<OwnerRoute><BookingsPage /></OwnerRoute>} />
            <Route path="/motoristas" element={<OwnerRoute><DriversPage /></OwnerRoute>} />
            <Route path="/financas" element={<OwnerRoute><FinancePage /></OwnerRoute>} />
            <Route path="/codigos" element={<OwnerRoute><PromoCodesPage /></OwnerRoute>} />
            <Route path="/definicoes" element={<OwnerRoute><SettingsPage /></OwnerRoute>} />
            <Route path="/escala" element={<OwnerRoute><OwnerSchedulePage /></OwnerRoute>} />
            <Route path="/suporte" element={<OwnerRoute><SupportPage /></OwnerRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

            {/* Driver Routes */}
            <Route path="/driver/today" element={<DriverRoute><TodayPage /></DriverRoute>} />
            <Route path="/driver/tour/:id" element={<DriverRoute><TourPage /></DriverRoute>} />
            <Route path="/driver/street-sale" element={<DriverRoute><StreetSalePage /></DriverRoute>} />
            <Route path="/driver/finance" element={<DriverRoute><DriverFinancePage /></DriverRoute>} />
            <Route path="/driver/schedule" element={<DriverRoute><DriverSchedulePage /></DriverRoute>} />
            <Route path="/driver/history" element={<Navigate to="/driver/finance" replace />} />
            <Route path="/driver/profile" element={<DriverRoute><ProfilePage /></DriverRoute>} />

            {/* Fallback */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <SupportWidget />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}
