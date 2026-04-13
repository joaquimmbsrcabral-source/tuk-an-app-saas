import React from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'toggle' | 'flags'
  className?: string
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'toggle',
  className = '',
}) => {
  const { i18n } = useTranslation()

  const currentLang = i18n.language?.startsWith('pt') ? 'pt' : 'en'

  const toggleLanguage = () => {
    const newLang = currentLang === 'pt' ? 'en' : 'pt'
    i18n.changeLanguage(newLang)
  }

  if (variant === 'flags') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <button
          onClick={() => i18n.changeLanguage('pt')}
          className={`px-2 py-1 rounded text-sm ${
            currentLang === 'pt'
              ? 'bg-amber-700 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Português"
        >
          PT PT
        </button>
        <button
          onClick={() => i18n.changeLanguage('en')}
          className={`px-2 py-1 rounded text-sm ${
            currentLang === 'en'
              ? 'bg-amber-700 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="English"
        >
          EN EN
        </button>
      </div>
    )
  }

  // Default: toggle button
  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
        bg-white/10 hover:bg-white/20 text-white transition-colors ${className}`}
      title={currentLang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
    >
      <Globe className="w-4 h-4" />
      <span>{currentLang === 'pt' ? 'EN' : 'PT'}</span>
    </button>
  )
}
