import React from 'react'

type StatusType = 'active' | 'inactive' | 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'online' | 'offline' | 'maintenance'

interface StatusBadgeProps {
  status: StatusType | string
  size?: 'sm' | 'md'
}

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: 'Ativo', dot: 'bg-green', bg: 'bg-green/10', text: 'text-green' },
  online: { label: 'Online', dot: 'bg-green', bg: 'bg-green/10', text: 'text-green' },
  confirmed: { label: 'Confirmado', dot: 'bg-green', bg: 'bg-green/10', text: 'text-green' },
  completed: { label: 'Concluido', dot: 'bg-green', bg: 'bg-green/10', text: 'text-green' },
  pending: { label: 'Pendente', dot: 'bg-yellow', bg: 'bg-yellow/10', text: 'text-yellow' },
  maintenance: { label: 'Manuten\u00e7\u00e3o', dot: 'bg-yellow', bg: 'bg-yellow/10', text: 'text-yellow' },
  inactive: { label: 'Inativo', dot: 'bg-muted', bg: 'bg-muted/10', text: 'text-muted' },
  offline: { label: 'Offline', dot: 'bg-muted', bg: 'bg-muted/10', text: 'text-muted' },
  retired: { label: 'Reformado', dot: 'bg-muted', bg: 'bg-muted/10', text: 'text-muted' },
  cancelled: { label: 'Cancelado', dot: 'bg-copper', bg: 'bg-copper/10', text: 'text-copper' },
  no_show: { label: 'No-show', dot: 'bg-copper', bg: 'bg-copper/10', text: 'text-copper' },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status] || { label: status, dot: 'bg-muted', bg: 'bg-muted/10', text: 'text-muted' }
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeClasses} font-medium rounded-full ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {config.label}
    </span>
  )
}
