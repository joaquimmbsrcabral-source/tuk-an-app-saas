import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend = 'neutral' }) => (
  <div className="bg-card border border-line rounded-2xl p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-ink2 mb-1">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
      </div>
      {icon && <div className="text-3xl">{icon}</div>}
    </div>
    {trend !== 'neutral' && (
      <div className={`text-xs mt-2 ${trend === 'up' ? 'text-green' : 'text-copper'}`}>
        {trend === 'up' ? '↑' : '↓'} vs semana passada
      </div>
    )}
  </div>
)
