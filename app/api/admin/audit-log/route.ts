import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'
import { logError } from '@/lib/errors/log-error'

/**
 * GET /api/admin/audit-log — journal d'audit des actions sensibles
 * (activations de comptes, modifications de packs, confirmations d'achats…).
 * Filtres : ?action=ADMIN_…, ?entity=User|CreditPack|CreditPurchase
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if (guard.error) return guard.error

  try {
    const action = request.nextUrl.searchParams.get('action')?.trim()
    const entity = request.nextUrl.searchParams.get('entity')?.trim()

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(action ? { action: { contains: action } } : {}),
        ...(entity ? { entityType: entity } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Admin audit-log GET error:', error)
    await logError({
      errorType: 'ADMIN_API_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: { route: '/api/admin/audit-log', method: 'GET' },
      userId: guard.session!.id,
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
