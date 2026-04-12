import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  accent?: 'yellow' | 'copper' | 'green' | 'ink'
  sublabel?: string
  trend?: 'up' | 'down' | 'neutral'
}

const accentStyles: Record<string, string> = {
  yellow: 'bg-yellow/10 text-yellow',
  copper: 'bg-copper/10 text-copper',
  green: 'bg-green/10 text-green',
  ink: 'bg-ink/8 text-ink',
}

const trendConfig = {
  up: { icon: <TrendingUp size={14} />, color: 'text-green', bg: 'bg-green/10' },
  down: { icon: <TrendingDown size={14} />, color: 'text-copper', bg: 'bg-copper/10' },
  neutral: { icon: <Minus size={14} />, color: 'text-ink2', bg: 'bg-ink/5' },
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accent = 'yellow',
  sublabel,
  trend,
}) => (
  <div className="bg-card border border-line rounded-2xl p-5 shadow-card hover:shadow-card-md transition-all duration-200">
    <div className="flex items-start justify-between mb-3">
      <span className="text-sm font-medium text-ink2">{label}</span>
      {icon && (
        <div className={`w-9 h-9 rounded-xl ${accentStyles[accent]} flex items-center justify-center`}>
          {icon}
        </div>
      )}
    </div>
    <div className="flex items-end gap-2">
      <span className="text-2xl font-extrabold text-ink tracking-tight">{value}</span>
      {trend && (
        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium ${trendConfig[trend].color} ${trendConfig[trend].bg} mb-0.5`}>
          {trendConfig[trend].icon}
        </span>
      )}
    </div>
    {sublabel && (
      <p className="mt-1.5 text-xs text-muted">{sublabel}</p>
    )}
  </div>
)
