import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  noPadding?: boolean
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  elevated = false,
  noPadding = false,
  onClick,
}) => {
  const base = 'bg-card border border-line rounded-2xl transition-shadow duration-200'
  const shadow = elevated
    ? 'shadow-card-md hover:shadow-card-lg'
    : 'shadow-card hover:shadow-card-md'
  const padding = noPadding ? '' : 'p-5'
  const cursor = onClick ? 'cursor-pointer' : ''

  return (
    <div
      className={`${base} ${shadow} ${padding} ${cursor} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
