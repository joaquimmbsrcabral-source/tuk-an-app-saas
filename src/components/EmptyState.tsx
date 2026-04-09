import React from 'react'

interface EmptyStateProps {
  icon?: string
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
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && (
        <div className="w-20 h-20 rounded-2xl bg-cream border border-line flex items-center justify-center text-4xl mb-5 shadow-card">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-ink mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-ink2 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-2 bg-ink text-yellow font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition-all active:scale-95 shadow-card"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
