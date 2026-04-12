import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

const variantStyles: Record<string, string> = {
  primary: 'bg-yellow text-ink font-bold hover:bg-yellow/90 shadow-md shadow-yellow/20 active:scale-[0.98]',
  secondary: 'bg-ink text-white font-bold hover:bg-ink/90 shadow-md active:scale-[0.98]',
  ghost: 'bg-transparent text-ink border border-line hover:bg-cream active:scale-[0.98]',
  danger: 'bg-red-500 text-white font-bold hover:bg-red-600 shadow-md active:scale-[0.98]',
  outline: 'bg-white text-ink border-2 border-ink hover:bg-ink hover:text-white active:scale-[0.98]',
}

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading

  return (
    <button
      className={`inline-flex items-center justify-center font-outfit transition-all duration-200
        ${variantStyles[variant]} ${sizeStyles[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
