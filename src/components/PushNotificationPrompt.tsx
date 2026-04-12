import React from 'react'
import { usePushNotifications } from '../hooks/usePushNotifications'

export const PushNotificationPrompt: React.FC = () => {
  const { supported, permission, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications()

  if (!supported) return null
  if (permission === 'denied') return null

  if (isSubscribed) {
    return (
      <div className="bg-card border border-line rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green" />
          <span className="text-sm text-ink">Notificações ativas</span>
        </div>
        <button
          onClick={unsubscribe}
          disabled={isLoading}
          className="text-xs text-ink2 hover:text-red-500 transition-colors"
        >
          Desativar
        </button>
      </div>
    )
  }

  return (
    <div className="bg-yellow/10 border border-yellow/30 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="text-2xl">🔔</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-ink">Ativar notificações</div>
          <div className="text-xs text-ink2 mt-0.5">
            Recebe alertas quando tens novas reservas ou alterações de escala.
          </div>
        </div>
        <button
          onClick={subscribe}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow text-ink text-sm font-bold rounded-lg hover:bg-yellow/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'A ativar...' : 'Ativar'}
        </button>
      </div>
    </div>
  )
}
