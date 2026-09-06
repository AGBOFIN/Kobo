import { prisma } from '@/lib/db/prisma'
import { UsersTable } from '@/components/admin/users-table'

/**
 * Utilisateurs (admin) — liste avec statistiques d'usage et recherche.
 * (Brief §5.9 : liste des utilisateurs, activer/désactiver un compte.)
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim()

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { companyName: { contains: query } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      companyName: true,
      role: true,
      active: true,
      createdAt: true,
      creditBalance: { select: { balanceCredits: true } },
      _count: { select: { invoices: true, creditPurchases: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          Utilisateurs
        </h1>
        <p className="mt-1 text-stone-600">
          Activez ou désactivez les comptes commerçants
        </p>
      </div>

      <form method="GET" className="mb-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Rechercher par nom, email ou entreprise…"
          className="input"
        />
        <button type="submit" className="btn btn-secondary">
          Rechercher
        </button>
      </form>

      <UsersTable
        users={users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          companyName: user.companyName,
          role: user.role,
          active: user.active,
          credits: user.creditBalance?.balanceCredits ?? 0,
          invoicesCount: user._count.invoices,
          purchasesCount: user._count.creditPurchases,
        }))}
      />
    </div>
  )
}
