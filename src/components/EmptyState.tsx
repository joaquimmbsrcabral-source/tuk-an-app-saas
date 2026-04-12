import React from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {icon && (
      <div className="w-16 h-16 rounded-2xl bg-yellow/10 flex items-center justify-center text-yellow mb-5">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-bold text-ink">{title}</h3>
    {description && (
      <p className="mt-2 text-sm text-ink2 max-w-sm leading-relaxed">{description}</p>
    )}
    {action && (
      <div className="mt-6">
        <Button onClick={action.onClick} size="md">
          {action.label}
        </Button>
      </div>
    )}
  </div>
)
