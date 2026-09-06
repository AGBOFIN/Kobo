import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'
import { logError } from '@/lib/errors/log-error'

/**
 * GET /api/admin/errors — journal des erreurs applicatives (ErrorLog).
 * Filtre : ?type=AUTH_LOGIN_FAILED|PAYMENT_INIT_FAILED|...
 *
 * Aucune donnée sensible en clair : les secrets sont masqués à l'écriture
 * (lib/errors/log-error.ts) et cette route n'est accessible qu'aux admins.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if (guard.error) return guard.error

  try {
    const type = request.nextUrl.searchParams.get('type')?.trim()

    const errors = await prisma.errorLog.findMany({
      where: type ? { errorType: type } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ errors })
  } catch (error) {
    console.error('Admin errors GET error:', error)
    await logError({
      errorType: 'ADMIN_API_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: { route: '/api/admin/errors', method: 'GET' },
      userId: guard.session!.id,
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
