import { prisma } from '@/lib/db/prisma'
import { RevenueMonthlyChart } from '@/components/admin/revenue-monthly-chart'

/**
 * Revenus & usage (admin) — agrégats serveur : revenus confirmés par mode de
 * paiement, évolution sur 6 mois, statistiques d'usage et ventes par pack.
 */
export default async function AdminRevenuePage() {
  const [confirmed, failedAgg, userCount, activeUserCount, invoiceAgg, packs] =
    await Promise.all([
      prisma.creditPurchase.findMany({
        where: { status: 'CONFIRME' },
        select: {
          amount: true,
          creditsPurchased: true,
          provider: true,
          createdAt: true,
        },
      }),
      prisma.creditPurchase.aggregate({
        where: { status: 'ECHOUE' },
        _count: true,
      }),
      prisma.user.count(),
      prisma.user.count({ where: { active: true } }),
      prisma.invoice.aggregate({
        _count: true,
        _sum: { totalAmount: true, amountPaid: true, remainingAmount: true },
      }),
      prisma.creditPack.findMany({
        select: { id: true, name: true, price: true, creditsCount: true },
      }),
    ])

  const sum = (list: { amount: number }[]) => list.reduce((acc, p) => acc + p.amount, 0)

  const chariowRevenue = sum(confirmed.filter(p => p.provider === 'CHARIOW'))
  const manualRevenue = sum(confirmed.filter(p => p.provider === 'MANUAL'))
  const totalRevenue = chariowRevenue + manualRevenue
  const creditsSold = confirmed.reduce((acc, p) => acc + p.creditsPurchased, 0)

  // Revenus des 6 derniers mois
  const monthly: { month: string; revenue: number; sales: number }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const inMonth = confirmed.filter(p => p.createdAt >= start && p.createdAt < end)
    monthly.push({
      month: start.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      revenue: sum(inMonth),
      sales: inMonth.length,
    })
  }

  const packStats = packs.map((pack: any) => ({
    name: pack.name,
    price: pack.price,
    creditsCount: pack.creditsCount,
    sales: confirmed.filter(
      p => p.amount === pack.price && p.creditsPurchased === pack.creditsCount
    ).length,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          Revenus & usage
        </h1>
        <p className="mt-1 text-stone-600">
          Revenus confirmés et statistiques d'usage de la plateforme
        </p>
      </div>

      {/* ===== Revenus ===== */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card card-pad">
          <p className="text-sm text-stone-500">Revenus totaux</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
            {totalRevenue.toLocaleString('fr-FR')} F
          </p>
        </div>
        <div className="card card-pad">
          <p className="text-sm text-stone-500">Via Chariow</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-700">
            {chariowRevenue.toLocaleString('fr-FR')} F
          </p>
        </div>
        <div className="card card-pad">
          <p className="text-sm text-stone-500">Via validation manuelle</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
            {manualRevenue.toLocaleString('fr-FR')} F
          </p>
        </div>
        <div className="card card-pad">
          <p className="text-sm text-stone-500">Crédits vendus</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
            {creditsSold.toLocaleString('fr-FR')}
          </p>
        </div>
      </div>

      {/* ===== Évolution mensuelle ===== */}
      <div className="card card-pad mt-6">
        <h2 className="font-semibold text-stone-900">Revenus des 6 derniers mois</h2>
        <p className="mt-1 text-sm text-stone-500">Achats confirmés, en FCFA</p>
        <div className="mt-6">
          <RevenueMonthlyChart data={monthly} />
        </div>
      </div>

      {/* ===== Usage ===== */}
      <h2 className="mt-10 text-lg font-semibold text-stone-900">
        Statistiques d'usage
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card card-pad">
          <p className="text-sm text-stone-500">Utilisateurs</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{userCount}</p>
          <p className="mt-1 text-xs text-stone-500">{activeUserCount} actif(s)</p>
        </div>
        <div className="card card-pad">
          <p className="text-sm text-stone-500">Factures créées</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{invoiceAgg._count}</p>
          <p className="mt-1 text-xs text-stone-500">
            {(invoiceAgg._sum.totalAmount || 0).toLocaleString('fr-FR')} F facturés
          </p>
        </div>
        <div className="card card-pad">
          <p className="text-sm text-stone-500">Ventes par pack</p>
          <div className="mt-2 space-y-1">
            {packStats.map(pack => (
              <p key={pack.name} className="text-sm text-stone-700">
                {pack.name} : <span className="font-semibold">{pack.sales}</span>
              </p>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <p className="text-sm text-stone-500">Achats échoués</p>
          <p className="mt-1 text-xl font-bold text-stone-900">{failedAgg._count}</p>
        </div>
      </div>
    </div>
  )
}
