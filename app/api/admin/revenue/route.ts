import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'
import { logError } from '@/lib/errors/log-error'

/**
 * GET /api/admin/revenue — revenus et statistiques d'usage de la plateforme.
 *
 * Revenus = achats de crédits CONFIRMÉS (Chariow ou confirmation manuelle admin),
 * ventilés par mode de paiement. Rapprochement comptable possible via la
 * référence de transaction de chaque achat (brief §5.5).
 */
export async function GET() {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  try {
    const [purchases, userCount, invoiceCount, packs, activeUsers] = await Promise.all([
      prisma.creditPurchase.findMany({
        select: {
          amount: true,
          creditsPurchased: true,
          status: true,
          provider: true,
          createdAt: true,
        },
      }),
      prisma.user.count(),
      prisma.invoice.count(),
      prisma.creditPack.findMany({ select: { id: true, name: true, price: true, creditsCount: true } }),
      prisma.user.count({ where: { active: true } }),
    ])

    const confirmed = purchases.filter(p => p.status === 'CONFIRME')
    const pending = purchases.filter(p => p.status === 'EN_ATTENTE')
    const failed = purchases.filter(p => p.status === 'ECHOUE')

    const sum = (list: { amount: number }[]) => list.reduce((acc, p) => acc + p.amount, 0)
    const credits = (list: { creditsPurchased: number }[]) =>
      list.reduce((acc, p) => acc + p.creditsPurchased, 0)

    // Revenus des 6 derniers mois (mois par mois)
    const monthly: { month: string; revenue: number; sales: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const inMonth = confirmed.filter(
        p => p.createdAt >= start && p.createdAt < end
      )
      monthly.push({
        month: start.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        revenue: sum(inMonth),
        sales: inMonth.length,
      })
    }

    return NextResponse.json({
      revenue: {
        total: sum(confirmed),
        pending: sum(pending),
        failed: sum(failed),
        creditsSold: credits(confirmed),
        byProvider: ['CHARIOW', 'MANUAL'].map(provider => ({
          provider,
          total: sum(confirmed.filter(p => p.provider === provider)),
          count: confirmed.filter(p => p.provider === provider).length,
        })),
        monthly,
      },
      usage: {
        users: userCount,
        activeUsers,
        invoices: invoiceCount,
        purchasesTotal: purchases.length,
        purchasesConfirmed: confirmed.length,
        purchasesPending: pending.length,
        purchasesFailed: failed.length,
        packs: packs.map((pack: any) => ({
          name: pack.name,
          price: pack.price,
          creditsCount: pack.creditsCount,
          sales: confirmed.filter(
            p => p.amount === pack.price && p.creditsPurchased === pack.creditsCount
          ).length,
        })),
      },
    })
  } catch (error) {
    console.error('Admin revenue GET error:', error)
    await logError({
      errorType: 'ADMIN_API_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: { route: '/api/admin/revenue', method: 'GET' },
      userId: guard.session!.id,
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
