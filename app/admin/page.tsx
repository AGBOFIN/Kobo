import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { PendingValidation } from '@/components/admin/pending-validation'

/**
 * Vue générale admin — revenus, usage, validations de paiements en attente.
 * (Brief §5.9 : revenus totaux, statistiques d'usage, achats de crédits.)
 */
export default async function AdminPage() {
  const [
    confirmed,
    pending,
    failed,
    userCount,
    activeUserCount,
    invoiceAgg,
    webhookUnprocessed,
    errorCount,
    pendingPurchases,
  ] = await Promise.all([
    prisma.creditPurchase.aggregate({
      where: { status: 'CONFIRME' },
      _sum: { amount: true, creditsPurchased: true },
      _count: true,
    }),
    prisma.creditPurchase.aggregate({
      where: { status: 'EN_ATTENTE' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.creditPurchase.count({ where: { status: 'ECHOUE' } }),
    prisma.user.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.invoice.aggregate({
      _count: true,
      _sum: { totalAmount: true, amountPaid: true, remainingAmount: true },
    }),
    prisma.webhookLog.count({ where: { processed: false } }),
    prisma.errorLog.count(),
    prisma.creditPurchase.findMany({
      where: { status: 'EN_ATTENTE' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        pack: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const stats = [
    {
      label: 'Revenus confirmés',
      value: `${(confirmed._sum.amount || 0).toLocaleString('fr-FR')} F`,
      sub: `${confirmed._count} achat(s) · ${(confirmed._sum.creditsPurchased || 0).toLocaleString('fr-FR')} crédits vendus`,
    },
    {
      label: 'En attente de validation',
      value: `${(pending._sum.amount || 0).toLocaleString('fr-FR')} F`,
      sub: `${pending._count} paiement(s) hors-ligne`,
      alert: pending._count > 0,
    },
    {
      label: 'Utilisateurs',
      value: userCount,
      sub: `${activeUserCount} actif(s)`,
    },
    {
      label: 'Factures créées',
      value: invoiceAgg._count,
      sub: `${(invoiceAgg._sum.totalAmount || 0).toLocaleString('fr-FR')} F facturés`,
    },
  ]

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          Vue générale
        </h1>
        <p className="mt-1 text-stone-600">
          Activité de la plateforme Kobo en un coup d'œil
        </p>
      </div>

      {/* ===== Stats principales ===== */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat: any) => (
          <div key={stat.label} className="card card-pad">
            <p className="text-sm text-stone-500">{stat.label}</p>
            <p
              className={`mt-1 text-2xl font-bold tracking-tight md:text-3xl ${
                stat.alert ? 'text-amber-600' : 'text-stone-900'
              }`}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-stone-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ===== Indicateurs secondaires ===== */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="card card-pad">
          <p className="text-sm text-stone-500">Achats échoués</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{failed}</p>
        </div>
        <div className="card card-pad">
          <p className="text-sm text-stone-500">Webhooks non traités</p>
          <p className="mt-1 text-xl font-bold text-stone-900">
            {webhookUnprocessed}
          </p>
        </div>
        <div className="card card-pad">
          <p className="text-sm text-stone-500">Erreurs journalisées</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{errorCount}</p>
        </div>
      </div>

      {/* ===== Liens rapides ===== */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/users" className="btn btn-secondary btn-sm">
          Utilisateurs
        </Link>
        <Link href="/admin/invoices" className="btn btn-secondary btn-sm">
          Toutes les factures
        </Link>
        <Link href="/admin/purchases" className="btn btn-secondary btn-sm">
          Achats de crédits
        </Link>
        <Link href="/admin/credit-packs" className="btn btn-secondary btn-sm">
          Gérer les packs
        </Link>
        <Link href="/admin/webhooks" className="btn btn-secondary btn-sm">
          Journal des webhooks
        </Link>
        <Link href="/admin/errors" className="btn btn-secondary btn-sm">
          Journal des erreurs
        </Link>
      </div>

      {/* ===== Paiements en attente (mode manuel) ===== */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-stone-900">
          Paiements à valider
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Achats hors-ligne attendant la confirmation d'un administrateur.
          Les achats Chariow sont confirmés automatiquement par webhook.
        </p>

        <div className="mt-4">
          {pendingPurchases.length === 0 ? (
            <div className="card card-pad flex flex-col items-center py-12 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-primary-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p className="mt-3 font-medium text-stone-900">
                Aucun paiement en attente
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Les nouvelles demandes apparaîtront ici.
              </p>
            </div>
          ) : (
            <PendingValidation
              purchases={pendingPurchases.map((purchase: any) => ({
                id: purchase.id,
                amount: purchase.amount,
                creditsPurchased: purchase.creditsPurchased,
                createdAt: purchase.createdAt.toISOString(),
                user: { name: purchase.user.name, email: purchase.user.email },
                pack: { name: purchase.pack.name },
              }))}
            />
          )}
        </div>
      </div>
    </div>
  )
}
