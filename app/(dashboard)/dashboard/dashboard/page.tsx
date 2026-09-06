import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

function StatusBadge({ status }: { status: string }) {
  if (status === 'PAYE') return <span className="badge badge-green">Payé</span>
  if (status === 'PARTIEL') return <span className="badge badge-yellow">Partiel</span>
  return <span className="badge badge-red">Non payé</span>
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      creditBalance: true,
      // 5 dernières factures uniquement pour la liste
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!user) {
    return null
  }

  // Statistiques calculées sur TOUTES les factures, pas seulement les 5 récentes
  const [invoiceCount, totals] = await Promise.all([
    prisma.invoice.count({ where: { userId: user.id } }),
    prisma.invoice.aggregate({
      where: { userId: user.id },
      _sum: { totalAmount: true, amountPaid: true },
    }),
  ])

  const stats = {
    totalInvoices: invoiceCount,
    totalBilled: totals._sum.totalAmount || 0,
    totalPaid: totals._sum.amountPaid || 0,
    remainingCredits: user.creditBalance?.balanceCredits || 0,
  }

  const firstName = user.name?.split(' ')[0] || 'bienvenue'
  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <div>
      {/* ===== En-tête ===== */}
      <div className="mb-6 md:mb-8">
        <p className="text-sm capitalize text-stone-500">{today}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          Bonjour, {firstName} 👋
        </h1>
        <p className="mt-1 text-stone-600">Que voulez-vous faire aujourd’hui ?</p>
      </div>

      {/* ===== Bandeau crédits (mobile) ===== */}
      <div className="mb-6 sm:hidden">
        <Link
          href="/dashboard/credits"
          className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-md shadow-emerald-600/20"
        >
          <div>
            <p className="text-sm text-emerald-50/90">Votre solde</p>
            <p className="text-2xl font-bold">
              {stats.remainingCredits} crédit{stats.remainingCredits > 1 ? 's' : ''}
            </p>
          </div>
          <span className="btn btn-sm bg-white text-emerald-700 hover:bg-emerald-50">
            Acheter
          </span>
        </Link>
      </div>

      {/* ===== Actions rapides ===== */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/invoices/new"
          className="group flex items-center justify-between rounded-2xl bg-primary-600 p-6 text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-lg active:scale-[0.99]"
        >
          <div>
            <p className="text-lg font-semibold">Nouvelle facture</p>
            <p className="mt-0.5 text-sm text-emerald-50/90">
              Créer une facture professionnelle
            </p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 transition-transform group-hover:translate-x-1">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </span>
        </Link>

        <Link
          href="/calculateur"
          className="card card-pad group flex items-center justify-between transition-all hover:shadow-md hover:shadow-stone-900/5 active:scale-[0.99]"
        >
          <div>
            <p className="text-lg font-semibold text-stone-900">Calculateur de prix</p>
            <p className="mt-0.5 text-sm text-stone-600">Trouvez le bon prix de vente</p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-primary-600 transition-transform group-hover:translate-x-1">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </span>
        </Link>
      </div>

      {/* ===== Statistiques ===== */}
      <div className="mt-6 grid grid-cols-3 gap-3 md:mt-8 md:gap-4">
        <div className="card p-4 md:p-6">
          <p className="text-xs font-medium text-stone-500 md:text-sm">Factures créées</p>
          <p className="mt-1 text-xl font-bold text-stone-900 md:text-3xl">
            {stats.totalInvoices}
          </p>
        </div>
        <div className="card p-4 md:p-6">
          <p className="text-xs font-medium text-stone-500 md:text-sm">Total facturé</p>
          <p className="mt-1 text-xl font-bold text-stone-900 md:text-3xl">
            {stats.totalBilled.toLocaleString('fr-FR')}
            <span className="ml-1 text-xs font-semibold text-stone-500 md:text-sm">FCFA</span>
          </p>
        </div>
        <div className="card p-4 md:p-6">
          <p className="text-xs font-medium text-stone-500 md:text-sm">Total payé</p>
          <p className="mt-1 text-xl font-bold text-emerald-600 md:text-3xl">
            {stats.totalPaid.toLocaleString('fr-FR')}
            <span className="ml-1 text-xs font-semibold text-stone-500 md:text-sm">FCFA</span>
          </p>
        </div>
      </div>

      {/* ===== Dernières factures ===== */}
      <div className="card mt-6 md:mt-8">
        <div className="flex items-center justify-between border-b border-stone-200/80 px-5 py-4">
          <h2 className="font-semibold text-stone-900">Dernières factures</h2>
          <Link
            href="/invoices"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Toutes les factures
          </Link>
        </div>

        {user.invoices.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-stone-100 text-stone-400">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <p className="mt-4 font-medium text-stone-900">Aucune facture pour le moment</p>
            <p className="mt-1 text-sm text-stone-500">
              Votre première facture est à 1 crédit. C’est parti !
            </p>
            <Link href="/invoices/new" className="btn btn-primary btn-md mt-5">
              Créer ma première facture
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {user.invoices.map((invoice: any) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-stone-900">
                        {invoice.invoiceNumber}
                      </p>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-stone-500">
                      {invoice.clientName} · {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-stone-900">
                    {invoice.totalAmount.toLocaleString('fr-FR')}{' '}
                    <span className="text-xs font-medium text-stone-500">FCFA</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}