import Link from 'next/link'
import { Smartphone } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="card card-pad max-w-md w-full text-center">
        <div className="grid h-20 w-20 mx-auto mb-6 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white">
          <Smartphone className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Vous êtes hors connexion
        </h1>
        <p className="text-secondary-600 mb-6">
          Vérifiez votre connexion internet et réessayez.
        </p>
        <Link href="/" className="btn btn-primary btn-md w-full">
          Réessayer
        </Link>
        <p className="mt-4 text-xs text-secondary-500">
          Certaines fonctionnalités peuvent être limitées hors ligne
        </p>
      </div>
    </div>
  )
}
