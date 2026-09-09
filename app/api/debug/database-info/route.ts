import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Endpoint de diagnostic pour vérifier l'état de la base de données
 * TEMPORAIRE - À SUPPRIMER APRÈS DÉBOGAGE
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer les packs actuels
    const packs = await prisma.creditPack.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    })

    // Récupérer le dernier utilisateur créé
    const lastUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        creditBalance: true,
      },
    })

    // Récupérer les transactions récentes
    const recentPurchases = await prisma.creditPurchase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      success: true,
      database: 'connected',
      packs: packs.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        credits: p.creditsCount,
        updatedAt: p.updatedAt,
      })),
      lastUser: lastUser ? {
        email: lastUser.email,
        createdAt: lastUser.createdAt,
        balance: lastUser.creditBalance?.balanceCredits ?? 0,
      } : null,
      recentPurchases: recentPurchases.map(p => ({
        id: p.id,
        amount: p.amount,
        credits: p.creditsPurchased,
        status: p.status,
        source: p.source,
        createdAt: p.createdAt,
      })),
    })
  } catch (error) {
    console.error('Erreur diagnostic DB:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        database: 'error',
      },
      { status: 500 }
    )
  }
}
