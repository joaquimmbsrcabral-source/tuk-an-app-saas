import { Link } from 'react-router-dom'

interface LogoProps {
  variant?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  linkTo?: string
}

const sizes = {
  sm: { icon: 'w-7 h-7 text-xs', text: 'text-base', gap: 'gap-1.5' },
  md: { icon: 'w-8 h-8 text-sm', text: 'text-xl', gap: 'gap-2' },
  lg: { icon: 'w-10 h-10 text-base', text: 'text-2xl', gap: 'gap-2.5' },
}

export const Logo = ({ variant = 'dark', size = 'md', linkTo }: LogoProps) => {
  const s = sizes[size]
  const textColor = variant === 'light' ? 'text-white' : 'text-ink'
  const iconBg = variant === 'light' ? 'bg-yellow' : 'bg-ink'
  const iconText = variant === 'light' ? 'text-ink' : 'text-yellow'

  const content = (
    <div className={`flex items-center ${s.gap} select-none`}>
      <div className={`${s.icon} rounded-lg ${iconBg} flex items-center justify-center ${iconText} font-black tracking-tight shadow-sm`}>
        T
      </div>
      <span className={`${s.text} font-extrabold tracking-tight ${textColor}`}>
        Tuk <span className="font-lora-italic text-copper">an</span> App
      </span>
    </div>
  )

  if (linkTo) {
    return <Link to={linkTo} className="hover:opacity-90 transition-opacity">{content}</Link>
  }

  return content
}
