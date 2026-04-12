import { supabase } from './supabase'

// VAPID public key — must match the one in Supabase Edge Function secrets
const VAPID_PUBLIC_KEY = 'BLOTdBmGUmSiSOIe8_3O01zP9-9yJ2ctFtdHJFW9EoBocO-8_ZELXtmBwU36-FXrykDfpn1S94LSNghG1aXC74A'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported')
    return null
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('SW registered:', registration.scope)
    return registration
  } catch (err) {
    console.error('SW registration failed:', err)
    return null
  }
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  userId: string,
  companyId: string
): Promise<PushSubscription | null> {
  if (!('PushManager' in window)) {
    console.warn('Push notifications not supported')
    return null
  }

  try {
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    // Save to Supabase
    const subJson = subscription.toJSON()
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        company_id: companyId,
        endpoint: subscription.endpoint,
        p256dh: subJson.keys?.p256dh || '',
        auth: subJson.keys?.auth || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' }
    )

    if (error) {
      console.error('Error saving push subscription:', error)
      return null
    }

    console.log('Push subscription saved')
    return subscription
  } catch (err) {
    console.error('Push subscription failed:', err)
    return null
  }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint)
    }
  } catch (err) {
    console.error('Unsubscribe failed:', err)
  }
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission {
  return Notification.permission
}
