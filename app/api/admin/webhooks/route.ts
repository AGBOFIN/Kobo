import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'
import { logError } from '@/lib/errors/log-error'

/**
 * GET /api/admin/webhooks — journal des webhooks reçus (Pulses Chariow, etc.).
 * Filtres : ?provider=CHARIOW|MANUAL, ?processed=true|false
 *
 * Le payload brut peut contenir des données clients (email, téléphone) :
 * il est visible uniquement ici, côté admin — jamais exposé ailleurs.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if (guard.error) return guard.error

  try {
    const provider = request.nextUrl.searchParams.get('provider')
    const processedParam = request.nextUrl.searchParams.get('processed')

    const webhooks = await prisma.webhookLog.findMany({
      where: {
        ...(provider ? { provider } : {}),
        ...(processedParam === 'true'
          ? { processed: true }
          : processedParam === 'false'
            ? { processed: false }
            : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        provider: true,
        eventType: true,
        processed: true,
        error: true,
        processedAt: true,
        createdAt: true,
        payload: true,
      },
    })

    return NextResponse.json({
      webhooks: webhooks.map((w: any) => ({
        id: w.id,
        provider: w.provider,
        eventType: w.eventType,
        processed: w.processed,
        error: w.error,
        processedAt: w.processedAt,
        createdAt: w.createdAt,
        // Aperçu court du payload pour la liste (payload complet au besoin)
        payloadPreview: w.payload?.slice(0, 180) || null,
      })),
    })
  } catch (error) {
    console.error('Admin webhooks GET error:', error)
    await logError({
      errorType: 'ADMIN_API_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: { route: '/api/admin/webhooks', method: 'GET' },
      userId: guard.session!.id,
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
