import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'

/**
 * Endpoint admin pour mettre à jour les packs de crédits
 * Sécurisé : nécessite un compte admin
 */
export async function POST(request: NextRequest) {
  // Vérifier que l'utilisateur est admin
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.error

  try {
    // Mettre à jour le pack Débutant → Découverte
    await prisma.creditPack.updateMany({
      where: { name: 'Pack Débutant' },
      data: {
        name: 'Pack Découverte',
        price: 1500,
        creditsCount: 15,
      },
    })

    // Mettre à jour le pack Standard
    await prisma.creditPack.updateMany({
      where: { name: 'Pack Standard' },
      data: {
        price: 5000,
        creditsCount: 60,
      },
    })

    // Mettre à jour le pack Pro
    await prisma.creditPack.updateMany({
      where: { name: 'Pack Pro' },
      data: {
        price: 10000,
        creditsCount: 150,
      },
    })

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
    console.error('Erreur mise à jour packs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des packs' },
      { status: 500 }
    )
  }
}
