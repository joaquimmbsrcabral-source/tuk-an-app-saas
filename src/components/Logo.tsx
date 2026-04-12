export const Logo = ({ variant = 'dark' }: { variant?: 'dark' | 'light' }) => (
  <div className="flex items-center gap-2 font-outline">
    <span className="text-2xl">🛺</span>
    <span className={`text-xl font-extrabold ${variant === 'light' ? 'text-white' : 'text-ink'}`}>
      Tuk <span className="font-lora-italic text-copper">an</span> App
    </span>
  </div>
)
