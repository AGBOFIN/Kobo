import { auth } from '@/lib/auth/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KoboMark } from '@/components/brand/logo'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-stone-200/70 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <KoboMark className="h-8 w-8 rounded-lg" />
            <div>
              <span className="block text-base font-bold leading-tight text-stone-900">
                Kobo
              </span>
              <span className="block text-xs font-medium text-stone-500">Espace admin</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/dashboard"
              className="btn btn-ghost btn-sm"
            >
              Retour dashboard
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="btn btn-ghost btn-sm">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
        <AdminNav />
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}
