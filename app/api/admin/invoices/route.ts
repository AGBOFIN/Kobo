import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'
import { logError } from '@/lib/errors/log-error'

/**
 * GET /api/admin/invoices — toutes les factures de la plateforme (lecture seule).
 * Filtres : ?q=<client ou numéro>, ?status=<NON_PAYE|PARTIEL|PAYE>
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if (guard.error) return guard.error

  try {
    const q = request.nextUrl.searchParams.get('q')?.trim()
    const status = request.nextUrl.searchParams.get('status')?.trim()

    const invoices = await prisma.invoice.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { clientName: { contains: q } },
                { invoiceNumber: { contains: q } },
              ],
            }
          : {}),
        ...(status ? { status } : {}),
      },
      select: {
        id: true,
        invoiceNumber: true,
        clientName: true,
        clientPhone: true,
        date: true,
        totalAmount: true,
        amountPaid: true,
        remainingAmount: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const totals = await prisma.invoice.aggregate({
      _sum: {
        totalAmount: true,
        amountPaid: true,
        remainingAmount: true,
      },
      _count: true,
    })

    return NextResponse.json({
      invoices,
      totals: {
        count: totals._count,
        totalAmount: totals._sum.totalAmount || 0,
        totalPaid: totals._sum.amountPaid || 0,
        totalRemaining: totals._sum.remainingAmount || 0,
      },
    })
  } catch (error) {
    console.error('Admin invoices GET error:', error)
    await logError({
      errorType: 'ADMIN_API_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: { route: '/api/admin/invoices', method: 'GET' },
      userId: guard.session!.id,
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
