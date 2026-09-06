import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'
import { logError } from '@/lib/errors/log-error'
import { z } from 'zod'

/**
 * GET /api/admin/purchases — historique des achats de crédits (tous utilisateurs),
 * avec utilisateur, pack, montant, statut, référence de transaction et crédits
 * attribués (brief §5.9). Filtre : ?status=EN_ATTENTE|CONFIRME|ECHOUE
 *
 * PATCH /api/admin/purchases?id=... — validation manuelle d'un paiement hors-ligne
 * (mode MANUAL) : action=confirm (crédite le compte, idempotent) ou reject.
 * Ne s'applique qu'aux achats EN_ATTENTE ; un achat Chariow confirmé par webhook
 * n'est jamais modifiable ici (garde-fou provider).
 */
const patchSchema = z.object({
  action: z.enum(['confirm', 'reject']),
})

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if (guard.error) return guard.error

  try {
    const status = request.nextUrl.searchParams.get('status')?.trim()

    const purchases = await prisma.creditPurchase.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        pack: {
          select: { id: true, name: true, price: true, creditsCount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ purchases })
  } catch (error) {
    console.error('Admin purchases GET error:', error)
    await logError({
      errorType: 'ADMIN_API_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: { route: '/api/admin/purchases', method: 'GET' },
      userId: guard.session!.id,
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin(request)
  if (guard.error) return guard.error

  try {
    const purchaseId = request.nextUrl.searchParams.get('id')

    if (!purchaseId) {
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

    const purchase = await prisma.creditPurchase.findUnique({
      where: { id: purchaseId },
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Achat non trouvé' }, { status: 404 })
    }

    if (purchase.status !== 'EN_ATTENTE') {
      return NextResponse.json(
        { error: 'Cet achat a déjà été traité' },
        { status: 409 }
      )
    }

    // Garde-fou : un achat initié via Chariow doit être confirmé par le
    // webhook (re-vérification API incluse), pas à la main.
    if (purchase.provider === 'CHARIOW') {
      return NextResponse.json(
        {
          error:
            "Achat Chariow : la confirmation se fait automatiquement via le webhook, pas manuellement",
        },
        { status: 409 }
      )
    }

    if (parsed.data.action === 'confirm') {
      const credited = await prisma.$transaction(async tx => {
        const updated = await tx.creditPurchase.updateMany({
          where: { id: purchase.id, status: 'EN_ATTENTE' },
          data: { status: 'CONFIRME' },
        })
        if (updated.count === 0) return false

        await tx.creditBalance.update({
          where: { userId: purchase.userId },
          data: { balanceCredits: { increment: purchase.creditsPurchased } },
        })
        return true
      })

      if (!credited) {
        return NextResponse.json(
          { error: 'Cet achat a déjà été traité' },
          { status: 409 }
        )
      }
    } else {
      await prisma.creditPurchase.update({
        where: { id: purchase.id },
        data: { status: 'ECHOUE' },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: guard.session!.id,
        action:
          parsed.data.action === 'confirm'
            ? 'ADMIN_CONFIRM_PURCHASE'
            : 'ADMIN_REJECT_PURCHASE',
        entityType: 'CreditPurchase',
        entityId: purchase.id,
        details: JSON.stringify({
          provider: purchase.provider,
          amount: purchase.amount,
          credits: purchase.creditsPurchased,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin purchases PATCH error:', error)
    await logError({
      errorType: 'ADMIN_API_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: { route: '/api/admin/purchases', method: 'PATCH' },
      userId: guard.session!.id,
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
