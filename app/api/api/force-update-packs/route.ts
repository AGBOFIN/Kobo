import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

/**
 * Endpoint de force-update pour les packs
 * Utilise Prisma directement avec la base de données production
 * TEMPORAIRE - À SUPPRIMER APRÈS UTILISATION
 */
export async function POST(request: NextRequest) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
  })

  try {
    console.log('🔄 Force update des packs...')

    // Mettre à jour le pack Débutant → Découverte
    const pack1 = await prisma.creditPack.updateMany({
      where: { name: 'Pack Débutant' },
      data: {
        name: 'Pack Découverte',
        price: 1500,
        creditsCount: 15,
      },
    })
    console.log(`✅ Pack Découverte: ${pack1.count} row(s)`)

    // Mettre à jour le pack Standard
    const pack2 = await prisma.creditPack.updateMany({
      where: { name: 'Pack Standard' },
      data: {
        price: 5000,
        creditsCount: 60,
      },
    })
    console.log(`✅ Pack Standard: ${pack2.count} row(s)`)

    // Mettre à jour le pack Pro
    const pack3 = await prisma.creditPack.updateMany({
      where: { name: 'Pack Pro' },
      data: {
        price: 10000,
        creditsCount: 150,
      },
    })
    console.log(`✅ Pack Pro: ${pack3.count} row(s)`)

    // Récupérer les packs mis à jour
    const packs = await prisma.creditPack.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'Packs mis à jour avec succès',
      packs: packs.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        credits: p.creditsCount,
      })),
    })
  } catch (error) {
    console.error('❌ Erreur:', error)
    await prisma.$disconnect()
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
