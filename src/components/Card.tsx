import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  noPadding?: boolean
  onClick?: () => void
  header?: React.ReactNode
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  elevated = false,
  noPadding = false,
  onClick,
  header,
}) => {
  const shadow = elevated
    ? 'shadow-card-md hover:shadow-card-lg'
    : 'shadow-card hover:shadow-card-md'
  const padding = noPadding ? '' : 'p-5'
  const cursor = onClick ? 'cursor-pointer active:scale-[0.99]' : ''

  return (
    <div
      className={`bg-card border border-line rounded-2xl transition-all duration-200 ${shadow} ${cursor} ${className}`}
      onClick={onClick}
    >
      {header && (
        <div className="px-5 py-4 border-b border-line">
          {header}
        </div>
      )}
      <div className={padding}>
        {children}
      </div>
    </div>
  )
}
