import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'
import { z } from 'zod'
import { logError } from '@/lib/errors/log-error'

/**
 * GET /api/admin/users — liste des utilisateurs avec statistiques d'usage.
 * Recherche optionnelle : ?q=<nom ou email>
 * PATCH /api/admin/users/:id — activer / désactiver un compte (brief §5.9).
 */
const patchSchema = z.object({
  active: z.boolean(),
})

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if (guard.error) return guard.error

  try {
    const q = request.nextUrl.searchParams.get('q')?.trim()

    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { companyName: { contains: q } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        role: true,
        active: true,
        createdAt: true,
        creditBalance: { select: { balanceCredits: true } },
        _count: { select: { invoices: true, creditPurchases: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      users: users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        companyName: user.companyName,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        credits: user.creditBalance?.balanceCredits ?? 0,
        invoicesCount: user._count.invoices,
        purchasesCount: user._count.creditPurchases,
      })),
    })
  } catch (error) {
    console.error('Admin users GET error:', error)
    await logError({
      errorType: 'ADMIN_API_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: { route: '/api/admin/users', method: 'GET' },
      userId: guard.session!.id,
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin(request)
  if (guard.error) return guard.error

  try {
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const userId = request.nextUrl.searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: "Paramètre 'id' requis" },
        { status: 400 }
      )
    }

    if (userId === guard.session!.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas désactiver votre propre compte' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { active: parsed.data.active },
      select: { id: true, active: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: guard.session!.id,
        action: parsed.data.active ? 'ADMIN_ACTIVATE_USER' : 'ADMIN_DEACTIVATE_USER',
        entityType: 'User',
        entityId: userId,
        details: JSON.stringify({ email: user.email }),
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Admin users PATCH error:', error)
    await logError({
      errorType: 'ADMIN_API_ERROR',
      message: error instanceof Error ? error.message : String(error),
      context: { route: '/api/admin/users', method: 'PATCH' },
      userId: guard.session!.id,
    })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
