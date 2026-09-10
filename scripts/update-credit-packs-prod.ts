/**
 * Script pour mettre à jour les packs de crédits en production
 * À exécuter manuellement après le déploiement
 * Utilise DIRECT_URL pour la connexion directe à PostgreSQL
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log('🔄 Mise à jour des packs de crédits en production...')
  console.log('='.repeat(50))

  try {
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

    // Vérifier les packs après mise à jour
    const packs = await prisma.creditPack.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    })

    console.log('\n📦 Packs après mise à jour:')
    for (const pack of packs) {
      console.log(`  - ${pack.name}: ${pack.price} FCFA / ${pack.creditsCount} crédits`)
    }

    console.log('\n✅ Mise à jour terminée avec succès')
  } catch (error) {
    console.error('\n❌ Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
