import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-card border border-line rounded-2xl p-6 ${className}`}>
    {children}
  </div>
)
