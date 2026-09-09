import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * ENDPOINT TEMPORAIRE - À SUPPRIMER APRÈS UTILISATION
 * Met à jour les packs de crédits sans authentification
 * Utilisé uniquement pour le déploiement production initial
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Mise à jour des packs de crédits...')

    // Mettre à jour le pack Débutant → Découverte
    const pack1 = await prisma.creditPack.updateMany({
      where: { name: 'Pack Débutant' },
      data: {
        name: 'Pack Découverte',
        price: 1500,
        creditsCount: 15,
      },
    })
    console.log(`✅ Pack Découverte mis à jour: ${pack1.count} row(s)`)

    // Mettre à jour le pack Standard
    const pack2 = await prisma.creditPack.updateMany({
      where: { name: 'Pack Standard' },
      data: {
        price: 5000,
        creditsCount: 60,
      },
    })
    console.log(`✅ Pack Standard mis à jour: ${pack2.count} row(s)`)

    // Mettre à jour le pack Pro
    const pack3 = await prisma.creditPack.updateMany({
      where: { name: 'Pack Pro' },
      data: {
        price: 10000,
        creditsCount: 150,
      },
    })
    console.log(`✅ Pack Pro mis à jour: ${pack3.count} row(s)`)

    // Récupérer les packs mis à jour
    const packs = await prisma.creditPack.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    })

    return NextResponse.json({
      success: true,
      message: 'Packs mis à jour avec succès',
      packs,
    })
  } catch (error) {
    console.error('❌ Erreur mise à jour packs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des packs', details: String(error) },
      { status: 500 }
    )
  }
}
