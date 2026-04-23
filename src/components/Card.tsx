import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  noPadding?: boolean
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ children, className = '', elevated = false, noPadding = false, onClick }) => (
  <div
    className={`bg-card border border-line rounded-2xl transition-shadow duration-200 ${
      elevated ? 'shadow-card-md hover:shadow-card-lg' : 'shadow-card hover:shadow-card-md'
    } ${noPadding ? '' : 'p-6'} ${className}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    {children}
  </div>
)
