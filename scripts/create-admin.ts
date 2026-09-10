/**
 * Script pour créer manuellement le compte admin principal
 * 
 * Ce script doit être exécuté manuellement pour créer le compte admin
 * mosesbusiness84@gmail.com avec le rôle ADMIN.
 * 
 * À n'exécuter qu'une seule fois. Si le compte existe déjà, le script s'arrête.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createMainAdmin() {
  const adminEmail = 'mosesbusiness84@gmail.com'
  
  console.log('🔐 Création du compte admin principal\n')
  console.log(`Email: ${adminEmail}`)

  try {
    // Vérifier si le compte existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true, email: true, role: true, name: true },
    })

    if (existingAdmin) {
      console.log('\n✅ Le compte existe déjà:')
      console.log(`   ID: ${existingAdmin.id}`)
      console.log(`   Email: ${existingAdmin.email}`)
      console.log(`   Nom: ${existingAdmin.name}`)
      console.log(`   Rôle: ${existingAdmin.role}`)
      
      if (existingAdmin.role === 'ADMIN') {
        console.log('\n✅ Le compte a déjà le rôle ADMIN - aucune action nécessaire')
      } else {
        console.log('\n⚠️  Le compte existe mais n\'a pas le rôle ADMIN')
        console.log('   Pour promouvoir ce compte, exécutez:')
        console.log(`   UPDATE "User" SET role = 'ADMIN' WHERE email = '${adminEmail}';`)
      }
      
      await prisma.$disconnect()
      return
    }

    // Créer le compte admin
    console.log('\n📝 Création du compte admin...')
    
    // Demander le mot de passe via l'interface de ligne de commande
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const password = await new Promise<string>((resolve) => {
      rl.question('Entrez le mot de passe pour le compte admin: ', (answer: string) => {
        rl.close()
        resolve(answer)
      })
    })

    if (!password || password.length < 6) {
      console.error('❌ Le mot de passe doit contenir au moins 6 caractères')
      await prisma.$disconnect()
      process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.user.create({
      data: {
        name: 'Moses Admin',
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        active: true,
      },
    })

    // Créer le solde de crédits
    await prisma.creditBalance.create({
      data: {
        userId: admin.id,
        balanceCredits: 0,
      },
    })

    console.log('\n✅ Compte admin créé avec succès:')
    console.log(`   ID: ${admin.id}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Nom: ${admin.name}`)
    console.log(`   Rôle: ${admin.role}`)
    console.log('\n⚠️  Conservez ce mot de passe en sécurité!')
    console.log('   Il n\'existe aucun moyen de récupérer un compte admin oublié.')

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error)
    await prisma.$disconnect()
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createMainAdmin()
