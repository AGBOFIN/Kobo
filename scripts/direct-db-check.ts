/**
 * Script pour vérifier et mettre à jour directement la base de données Supabase
 * Nécessite DATABASE_URL configuré dans .env
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
  console.log('🔍 Vérification directe de la base de données...')
  console.log('='.repeat(50))

  try {
    // Vérifier les packs actuels
    const packs = await prisma.creditPack.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    })

    console.log('\n📦 Packs actuels:')
    for (const pack of packs) {
      console.log(`  - ${pack.name}: ${pack.price} FCFA / ${pack.creditsCount} crédits`)
      console.log(`    ID: ${pack.id}`)
      console.log(`    Chariow Product ID: ${pack.chariowProductId}`)
      console.log(`    Mis à jour: ${pack.updatedAt.toISOString()}`)
    }

    // Vérifier si les packs doivent être mis à jour
    const needsUpdate = packs.some(p => 
      (p.name === 'Pack Débutant' && p.price !== 1500) ||
      (p.name === 'Pack Standard' && p.price !== 5000) ||
      (p.name === 'Pack Pro' && p.price !== 10000)
    )

    if (needsUpdate) {
      console.log('\n⚠️  Les packs doivent être mis à jour')
      console.log('Exécution des mises à jour...')

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
      const updatedPacks = await prisma.creditPack.findMany({
        where: { active: true },
        orderBy: { price: 'asc' },
      })

      console.log('\n📦 Packs après mise à jour:')
      for (const pack of updatedPacks) {
        console.log(`  - ${pack.name}: ${pack.price} FCFA / ${pack.creditsCount} crédits`)
      }
    } else {
      console.log('\n✅ Les packs sont déjà à jour')
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

  } catch (error) {
    console.error('\n❌ Erreur:', error)
    console.error('Vérifiez que DATABASE_URL est correctement configuré dans .env')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
