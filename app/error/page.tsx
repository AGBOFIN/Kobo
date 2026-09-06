import Link from 'next/link'

/**
 * Page d'erreur d'authentification — cible de `pages.error` dans la config
 * NextAuth (lib/auth/config.ts). Accessible publiquement.
 */
export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="card card-pad w-full max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </span>
        <h1 className="mt-4 text-xl font-bold text-stone-900">
          Une erreur est survenue
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          La connexion a échoué ou la session a expiré. Vos données ne sont pas
          affectées — réessayez de vous connecter.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/login" className="btn btn-primary">
            Se connecter
          </Link>
          <Link href="/calculateur" className="btn btn-secondary">
            Retour au calculateur
          </Link>
        </div>
      </div>
    </div>
  )
}
