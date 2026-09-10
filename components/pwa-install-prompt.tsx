'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Download, X } from 'lucide-react'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Show prompt after user has spent some time on the site
      setTimeout(() => {
        setShowPrompt(true)
      }, 30000) // 30 seconds
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Don't show if dismissed in this session
  useEffect(() => {
    if (sessionStorage.getItem('pwa-prompt-dismissed')) {
      setShowPrompt(false)
    }
  }, [])

  if (!showPrompt) return null

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
        <div className="card card-pad shadow-lg border-primary-300">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">Installez Kobo</p>
              <p className="text-xs text-secondary-600 mt-1">
                Pour installer : appuyez sur <span className="font-semibold">Partager</span> puis <span className="font-semibold">"Ajouter à l'écran d'accueil"</span>
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-secondary-400 hover:text-secondary-600 p-1"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="card card-pad shadow-lg border-primary-300">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Installez Kobo</p>
            <p className="text-xs text-secondary-600 mt-1">
              Accédez à Kobo comme une application native
            </p>
            <button
              onClick={handleInstall}
              className="mt-3 btn btn-primary btn-sm w-full"
            >
              Installer
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="text-secondary-400 hover:text-secondary-600 p-1"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
