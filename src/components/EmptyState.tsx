import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="text-5xl mb-4">{icon}</div>}
    <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
    <p className="text-sm text-ink2 mb-4 max-w-sm">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="px-6 py-2 bg-ink text-yellow font-bold rounded-btn hover:translate-y-[-2px] transition-transform"
      >
        {action.label}
      </button>
    )}
  </div>
)
