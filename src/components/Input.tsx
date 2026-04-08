import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-600 text-ink mb-2">{label}</label>}
    <input
      className={`w-full px-4 py-3 border border-line rounded-btn font-outfit focus:outline-none focus:border-copper ${
        error ? 'border-copper' : ''
      } ${className}`}
      {...props}
    />
    {error && <p className="text-sm text-copper mt-1">{error}</p>}
  </div>
)

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-600 text-ink mb-2">{label}</label>}
    <textarea
      className={`w-full px-4 py-3 border border-line rounded-btn font-outfit focus:outline-none focus:border-copper ${
        error ? 'border-copper' : ''
      } ${className}`}
      {...props}
    />
    {error && <p className="text-sm text-copper mt-1">{error}</p>}
  </div>
)

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-600 text-ink mb-2">{label}</label>}
    <select
      className={`w-full px-4 py-3 border border-line rounded-btn font-outfit focus:outline-none focus:border-copper ${
        error ? 'border-copper' : ''
      } ${className}`}
      {...props}
    >
      <option value="">Selecione...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-sm text-copper mt-1">{error}</p>}
  </div>
)
