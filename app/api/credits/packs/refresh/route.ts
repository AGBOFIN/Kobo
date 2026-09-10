import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Endpoint pour forcer le rafraîchissement des packs
 * Désactive le cache et lit directement de la base de données
 */
export async function GET(request: NextRequest) {
  try {
    // Forcer la lecture fraîche de la base de données
    const packs = await prisma.creditPack.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    })

    // Ajouter des headers pour désactiver le cache
    return NextResponse.json(
      { packs },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Erreur rafraîchissement packs:', error)
    return NextResponse.json(
      { error: 'Erreur lors du rafraîchissement' },
      { status: 500 }
    )
  }
}
