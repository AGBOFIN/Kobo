import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const creditBalance = await prisma.creditBalance.findUnique({
      where: { userId: session.user.id },
    })

    if (!creditBalance) {
      return NextResponse.json(
        { error: 'Solde de crédits non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ balance: creditBalance.balanceCredits })
  } catch (error) {
    console.error('Credit balance fetch error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}