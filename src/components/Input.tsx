import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          {icon}
        </div>
      )}
      <input
        className={`w-full ${icon ? 'pl-10' : 'px-4'} py-2.5 bg-white border ${
          error ? 'border-red-400 focus:ring-red-200' : 'border-line focus:ring-yellow/30 focus:border-yellow'
        } rounded-xl text-sm text-ink placeholder:text-muted/60 font-outfit
          focus:outline-none focus:ring-2 transition-all duration-200
          disabled:bg-gray-50 disabled:text-muted disabled:cursor-not-allowed
          ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">{error}</p>}
  </div>
)

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className = '', ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>}
    <textarea
      className={`w-full px-4 py-2.5 bg-white border ${
        error ? 'border-red-400 focus:ring-red-200' : 'border-line focus:ring-yellow/30 focus:border-yellow'
      } rounded-xl text-sm text-ink placeholder:text-muted/60 font-outfit
        focus:outline-none focus:ring-2 transition-all duration-200 resize-none
        disabled:bg-gray-50 disabled:text-muted disabled:cursor-not-allowed
        ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
  </div>
)

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options?: { value: string; label: string }[]
  children?: React.ReactNode
}

export const Select: React.FC<SelectProps> = ({ label, error, options, children, className = '', ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>}
    <select
      className={`w-full px-4 py-2.5 bg-white border ${
        error ? 'border-red-400 focus:ring-red-200' : 'border-line focus:ring-yellow/30 focus:border-yellow'
      } rounded-xl text-sm text-ink placeholder:text-muted/60 font-outfit
        focus:outline-none focus:ring-2 transition-all duration-200
        disabled:bg-gray-50 disabled:text-muted disabled:cursor-not-allowed
        ${className}`}
      {...props}
    >
      {children ? children : options?.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
  </div>
)

