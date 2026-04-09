import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon?: string
  accent?: 'yellow' | 'copper' | 'green' | 'ink'
  sublabel?: string
  trend?: 'up' | 'down' | 'neutral'
}

const accentStyles: Record<string, string> = {
  yellow: 'bg-yellow bg-opacity-15 text-yellow border border-yellow border-opacity-30',
  copper: 'bg-copper bg-opacity-10 text-copper border border-copper border-opacity-20',
  green: 'bg-green bg-opacity-10 text-green border border-green border-opacity-20',
  ink: 'bg-ink bg-opacity-8 text-ink border border-ink border-opacity-10',
}

const trendIcon = {
  up: <TrendingUp size={12} className="text-green" />,
  down: <TrendingDown size={12} className="text-copper" />,
  neutral: <Minus size={12} className="text-ink2" />,
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accent = 'yellow',
  sublabel,
  trend,
}) => {
  return (
    <div className="bg-card border border-line rounded-2xl shadow-card hover:shadow-card-md transition-shadow duration-200 p-5">
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${accentStyles[accent]}`}>
            {icon}
          </div>
        )}
        {trend && (
          <div className="flex items-center gap-1">
            {trendIcon[trend]}
          </div>
        )}
      </div>
      <p className="text-xs font-bold text-ink2 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-ink leading-none truncate">{value}</p>
      {sublabel && (
        <p className="text-xs text-muted mt-1">{sublabel}</p>
      )}
    </div>
  )
}
