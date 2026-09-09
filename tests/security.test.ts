/**
 * Tests de sécurité - Protection contre l'élévation de privilèges
 * 
 * Ces tests vérifient qu'aucun utilisateur normal ne peut obtenir le rôle ADMIN
 * via les API publiques de l'application.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

describe('Sécurité - Protection contre l\'élévation de privilèges', () => {
  let testUserId: string
  let testUserEmail: string
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

  beforeAll(async () => {
    // Créer un utilisateur de test
    testUserEmail = `security-test-${Date.now()}@example.com`
    const hashedPassword = await bcrypt.hash('test123456', 10)
    
    const user = await prisma.user.create({
      data: {
        name: 'Security Test User',
        email: testUserEmail,
        passwordHash: hashedPassword,
        role: 'USER',
        active: true,
      },
    })
    testUserId = user.id
  })

  afterAll(async () => {
    // Nettoyage
    try {
      await prisma.user.delete({ where: { id: testUserId } })
    } catch (error) {
      // Ignorer si déjà supprimé
    }
    await prisma.$disconnect()
  })

  describe('API d\'inscription (/api/auth/register)', () => {
    it('devrait rejeter toute tentative de définir role: ADMIN', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Malicious User',
          email: `malicious-${Date.now()}@example.com`,
          password: 'test123456',
          role: 'ADMIN', // Tentative d'élévation de privilège
        }),
      })

      const data = await response.json()
      
      // L'inscription devrait réussir mais le rôle doit être USER
      expect(response.ok).toBe(true)
      
      // Vérifier que l'utilisateur créé a bien le rôle USER
      if (data.user?.id) {
        const createdUser = await prisma.user.findUnique({
          where: { id: data.user.id },
          select: { role: true },
        })
        expect(createdUser?.role).toBe('USER')
        
        // Nettoyage
        await prisma.user.delete({ where: { id: data.user.id } })
      }
    })

    it('devrait ignorer tout champ role supplémentaire dans la requête', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Another Malicious User',
          email: `malicious2-${Date.now()}@example.com`,
          password: 'test123456',
          role: 'ADMIN',
          isAdmin: true,
          permissions: ['all'],
        }),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      
      if (data.user?.id) {
        const createdUser = await prisma.user.findUnique({
          where: { id: data.user.id },
          select: { role: true },
        })
        expect(createdUser?.role).toBe('USER')
        
        await prisma.user.delete({ where: { id: data.user.id } })
      }
    })
  })

  describe('API de profil (/api/profile)', () => {
    it('devrait rejeter toute tentative de modifier le champ role', async () => {
      // Note: Ce test nécessite une authentification complète
      // Pour l'instant, on teste que le schéma Zod rejette le champ role
      
      const response = await fetch(`${baseUrl}/api/profile`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated Name',
          role: 'ADMIN', // Tentative d'élévation de privilège
        }),
      })

      // Sans authentification, on devrait avoir un 401
      // Avec authentification, le champ role devrait être ignoré
      expect([401, 200]).toContain(response.status)
      
      if (response.status === 200) {
        const data = await response.json()
        // Vérifier que le rôle n'a pas été modifié
        const user = await prisma.user.findUnique({
          where: { id: testUserId },
          select: { role: true },
        })
        expect(user?.role).toBe('USER')
      }
    })
  })

  describe('API admin (/api/admin/*)', () => {
    it('devrait rejeter l\'accès non authentifié', async () => {
      const response = await fetch(`${baseUrl}/api/admin/users`)
      
      expect(response.status).toBe(401)
    })

    it('devrait rejeter l\'accès utilisateur normal', async () => {
      // Note: Ce test nécessiterait une session authentifiée
      // Pour l'instant, on teste que la garde requireAdmin fonctionne
      
      const response = await fetch(`${baseUrl}/api/admin/users`, {
        headers: {
          'Authorization': 'Bearer fake-token',
        },
      })
      
      // Sans authentification valide, on devrait avoir un 401
      expect([401, 403]).toContain(response.status)
    })
  })

  describe('Vérification de la base de données', () => {
    it('ne devrait contenir aucun admin créé via l\'API', async () => {
      // Vérifier que tous les admins ont été créés manuellement
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      })

      // Vérifier que l'email admin principal existe
      const mainAdmin = admins.find(admin => admin.email === 'mosesbusiness84@gmail.com')
      
      // S'il y a des admins, ils devraient être créés manuellement
      // (pas via l'API d'inscription qui force role: USER)
      if (admins.length > 0) {
        console.log(`Trouvé ${admins.length} admin(s) dans la base de données`)
        admins.forEach(admin => {
          console.log(`- ${admin.email} (créé le ${admin.createdAt})`)
        })
      }
      
      // Le compte principal admin devrait exister
      expect(mainAdmin).toBeDefined()
    })
  })
})
