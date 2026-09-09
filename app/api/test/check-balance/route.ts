import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Endpoint temporaire pour vérifier le solde d'un utilisateur par email
 * Uniquement pour les tests E2E - à supprimer en production
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      creditBalance: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    balance: user.creditBalance?.balanceCredits ?? 0,
  })
}
