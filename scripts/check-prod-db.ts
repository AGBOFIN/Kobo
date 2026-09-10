/**
 * Script pour vérifier l'état de la base de données production
 * Utilise la connexion directe Supabase
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function checkDatabase() {
  console.log('🔍 Vérification de la base de données production...')
  console.log('='.repeat(50))

  try {
    // Vérifier les packs
    const packs = await prisma.creditPack.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    })

    console.log('\n📦 Packs de crédits:')
    for (const pack of packs) {
      console.log(`  - ${pack.name}: ${pack.price} FCFA / ${pack.creditsCount} crédits`)
    }

    // Vérifier le dernier utilisateur
    const lastUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        creditBalance: true,
      },
    })

    if (lastUser) {
      console.log('\n👤 Dernier utilisateur:')
      console.log(`  - Email: ${lastUser.email}`)
      console.log(`  - Créé: ${lastUser.createdAt.toISOString()}`)
      console.log(`  - Solde: ${lastUser.creditBalance?.balanceCredits ?? 0} crédits`)
    }

    // Vérifier les transactions récentes
    const recentPurchases = await prisma.creditPurchase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    console.log('\n💳 Transactions récentes:')
    for (const purchase of recentPurchases) {
      console.log(`  - ${purchase.creditsPurchased} crédits (${purchase.status}) - ${purchase.source}`)
    }

    console.log('\n✅ Base de données accessible')
  } catch (error) {
    console.error('\n❌ Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
