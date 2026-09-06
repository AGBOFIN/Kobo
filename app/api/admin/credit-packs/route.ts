import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'
import { z } from 'zod'
import { logError } from '@/lib/errors/log-error'

/**
 * GET  /api/admin/credit-packs — liste des packs de crédits.
 * PATCH /api/admin/credit-packs?id=... — modification d'un pack :
 *   nom, prix, nombre de crédits, activation, produit Chariow associé (brief §5.9).
 *
 * Note Chariow : le prix appliqué au paiement est celui du PRODUIT Chariow
 * (chariowProductId). `price` doit rester aligné sur le produit correspondant
 * dans le dashboard Chariow pour un rapprochement comptable sans surprise.
 */
const patchSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  creditsCount: z.number().int().positive().optional(),
  active: z.boolean().optional(),
  chariowProductId: z.string().min(1).nullable().optional(),
})

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if (guard.error) return guard.error

  try {
    const packs = await prisma.creditPack.findMany({
      orderBy: { price: 'asc' },
    })
    return NextResponse.json({ packs })
  } catch (error) {
    console.error('Admin credit-packs GET error:', error)
    await logError({
      errorType: 'ADMIN_API_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: { route: '/api/admin/credit-packs', method: 'GET' },
      userId: guard.session!.id,
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin(request)
  if (guard.error) return guard.error

  try {
    const packId = request.nextUrl.searchParams.get('id')

    if (!packId) {
      return NextResponse.json({ error: "Paramètre 'id' requis" }, { status: 400 })
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const existing = await prisma.creditPack.findUnique({ where: { id: packId } })

    if (!existing) {
      return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 })
    }

    const pack = await prisma.creditPack.update({
      where: { id: packId },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: guard.session!.id,
        action: 'ADMIN_UPDATE_PACK',
        entityType: 'CreditPack',
        entityId: packId,
        details: JSON.stringify({ before: existing, after: pack }),
      },
    })

    return NextResponse.json({ pack })
  } catch (error) {
    console.error('Admin credit-packs PATCH error:', error)
    await logError({
      errorType: 'ADMIN_API_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: { route: '/api/admin/credit-packs', method: 'PATCH' },
      userId: guard.session!.id,
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
