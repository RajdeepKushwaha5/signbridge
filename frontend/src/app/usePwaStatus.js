import { useEffect, useState } from 'react'

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function usePwaStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled] = useState(isStandalone)
  const [offlineReady, setOfflineReady] = useState(false)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    const handleInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then(() => setOfflineReady(true)).catch(() => {})

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  async function install() {
    if (!installPrompt) return false
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstallPrompt(null)
    return choice.outcome === 'accepted'
  }

  return { online, offlineReady, installed, canInstall: Boolean(installPrompt) && !installed, install }
}
