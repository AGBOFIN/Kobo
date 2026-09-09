/**
 * Script de réinitialisation du mot de passe admin
 * 
 * Ce script permet de réinitialiser le mot de passe du compte admin principal
 * (mosesbusiness84@gmail.com) de manière sécurisée.
 * 
 * UTILISATION :
 * node scripts/reset-admin-password.ts <nouveau_mot_de_passe>
 * 
 * EXEMPLE :
 * node scripts/reset-admin-password.ts MonNouveauMotDePasse123
 * 
 * Pour utiliser avec PostgreSQL en production, définissez DATABASE_URL :
 * $env:DATABASE_URL="postgresql://..."
 * node scripts/reset-admin-password.ts MonNouveauMotDePasse123
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Récupérer le mot de passe depuis les arguments de ligne de commande
const newPassword = process.argv[2]

if (!newPassword) {
  console.error('❌ Erreur: Veuillez fournir le nouveau mot de passe')
  console.error('Usage: node scripts/reset-admin-password.ts <nouveau_mot_de_passe>')
  console.error('Exemple: node scripts/reset-admin-password.ts MonNouveauMotDePasse123')
  process.exit(1)
}

if (newPassword.length < 6) {
  console.error('❌ Erreur: Le mot de passe doit contenir au moins 6 caractères')
  process.exit(1)
}

// Utiliser DATABASE_URL si disponible, sinon SQLite local
const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
  log: ['error'],
})

console.log(dbUrl.startsWith('postgresql') ? '🗄️  Mode: PostgreSQL (production)' : '🗄️  Mode: SQLite (développement)')

async function resetAdminPassword() {
  const adminEmail = 'mosesbusiness84@gmail.com'
  
  console.log('🔐 Réinitialisation du mot de passe admin\n')
  console.log(`Email: ${adminEmail}`)

  try {
    // Vérifier si le compte admin existe
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    if (!admin) {
      console.error('❌ Le compte admin n\'existe pas!')
      console.error('   Pour créer le compte admin, exécutez: npm run create-admin')
      await prisma.$disconnect()
      process.exit(1)
    }

    if (admin.role !== 'ADMIN') {
      console.error('❌ Le compte existe mais n\'a pas le rôle ADMIN!')
      console.error('   Rôle actuel:', admin.role)
      await prisma.$disconnect()
      process.exit(1)
    }

    console.log('\n✅ Compte admin trouvé:')
    console.log(`   ID: ${admin.id}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Nom: ${admin.name}`)
    console.log(`   Rôle: ${admin.role}`)

    // Hasher le nouveau mot de passe
    console.log('\n🔒 Hashage du mot de passe...')
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe
    console.log('📝 Mise à jour du mot de passe...')
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        passwordHash: hashedPassword,
        // Invalider tout lien de réinitialisation en attente
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    console.log('\n✅ Mot de passe réinitialisé avec succès!')
    console.log('   Le compte admin peut maintenant se connecter avec le nouveau mot de passe.')
    console.log('\n⚠️  Sécurité:')
    console.log('   - Conservez ce mot de passe en sécurité')
    console.log('   - N\'utilisez pas le même mot de passe sur plusieurs sites')
    console.log('   - Changez-le régulièrement')

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error)
    await prisma.$disconnect()
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
