import React from 'react'
import { DriverStatus } from '../lib/types'

interface Props {
  status: DriverStatus
  size?: 'sm' | 'md'
}

const LABELS: Record<DriverStatus, string> = {
  available: 'Disponível',
  busy: 'Ocupado',
  offline: 'Offline',
}

const COLORS: Record<DriverStatus, string> = {
  available: 'bg-green-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span className={`inline-flex items-center gap-2 rounded-full bg-cream border border-line ${padding}`}>
      <span className={`inline-block w-2 h-2 rounded-full ${COLORS[status]} ${status === 'available' ? 'animate-pulse' : ''}`} />
      <span className="text-ink font-medium">{LABELS[status]}</span>
    </span>
  )
}
