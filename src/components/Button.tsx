import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
  children: React.ReactNode
}

const variants: Record<string, string> = {
  primary: 'bg-ink text-yellow font-black hover:bg-opacity-90 shadow-card hover:shadow-card-md active:scale-[0.97]',
  secondary: 'bg-yellow text-ink font-black hover:bg-opacity-90 shadow-card hover:shadow-card-md active:scale-[0.97]',
  ghost: 'bg-transparent text-ink border border-line hover:bg-cream active:scale-[0.97]',
  danger: 'bg-copper text-white font-bold hover:bg-opacity-90 shadow-card active:scale-[0.97]',
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1'
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`${base} ${variants[variant]} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
