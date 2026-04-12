import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  isPushSupported,
  getNotificationPermission,
} from '../lib/pushNotifications'

export function usePushNotifications() {
  const { profile } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [supported] = useState(isPushSupported())

  useEffect(() => {
    if (supported) {
      setPermission(getNotificationPermission())
    }
    // Check if already subscribed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        setIsSubscribed(!!sub)
      }).catch(() => {})
    }
  }, [supported])

  const subscribe = useCallback(async () => {
    if (!profile || !supported) return false
    setIsLoading(true)

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setIsLoading(false)
        return false
      }

      const registration = await registerServiceWorker()
      if (!registration) {
        setIsLoading(false)
        return false
      }

      const sub = await subscribeToPush(registration, profile.id, profile.company_id)
      setIsSubscribed(!!sub)
      setIsLoading(false)
      return !!sub
    } catch (err) {
      console.error('Subscribe error:', err)
      setIsLoading(false)
      return false
    }
  }, [profile, supported])

  const unsubscribe = useCallback(async () => {
    if (!profile) return
    setIsLoading(true)
    await unsubscribeFromPush(profile.id)
    setIsSubscribed(false)
    setIsLoading(false)
  }, [profile])

  return {
    supported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  }
}
