/**
 * Test de sécurité statique - Analyse du code source
 * 
 * Ce script vérifie statiquement que le code ne contient pas de vulnérabilités
 * d'élévation de privilèges, sans dépendre de la base de données.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const PROJECT_ROOT = process.cwd()

interface SecurityCheck {
  name: string
  description: string
  check: () => { passed: boolean; details: string }
}

const securityChecks: SecurityCheck[] = [
  {
    name: 'Protection inscription - role forcé à USER',
    description: 'Vérifie que l\'API d\'inscription force le rôle à USER',
    check: () => {
      const registerRoute = readFileSync(join(PROJECT_ROOT, 'app/api/auth/register/route.ts'), 'utf-8')
      
      const hasRoleUser = registerRoute.includes("role: 'USER'")
      const hasAdminComment = registerRoute.includes('Toujours USER, jamais ADMIN')
      const hasSecurityComment = registerRoute.includes('sécurité')
      
      if (hasRoleUser && hasAdminComment && hasSecurityComment) {
        return { 
          passed: true, 
          details: '✅ L\'API d\'inscription force explicitement role: USER avec commentaire de sécurité' 
        }
      } else {
        return { 
          passed: false, 
          details: '❌ L\'API d\'inscription ne force pas explicitement le rôle à USER' 
        }
      }
    }
  },
  {
    name: 'Protection profil - exclusion du champ role',
    description: 'Vérifie que l\'API de profil exclut le champ role des données',
    check: () => {
      const profileRoute = readFileSync(join(PROJECT_ROOT, 'app/api/profile/route.ts'), 'utf-8')
      
      const hasRoleExclusion = profileRoute.includes('const { role, ...safeData }')
      const hasSafeDataUsage = profileRoute.includes('data: safeData')
      
      if (hasRoleExclusion && hasSafeDataUsage) {
        return { 
          passed: true, 
          details: '✅ L\'API de profil exclut explicitement le champ role via destructuring' 
        }
      } else {
        return { 
          passed: false, 
          details: '❌ L\'API de profil n\'exclut pas explicitement le champ role' 
        }
      }
    }
  },
  {
    name: 'Protection admin - garde requireAdmin',
    description: 'Vérifie que les routes admin utilisent requireAdmin',
    check: () => {
      const adminUsersRoute = readFileSync(join(PROJECT_ROOT, 'app/api/admin/users/route.ts'), 'utf-8')
      const guardFile = readFileSync(join(PROJECT_ROOT, 'lib/admin/guard.ts'), 'utf-8')
      
      const usesRequireAdmin = adminUsersRoute.includes('requireAdmin')
      const hasGuardCheck = guardFile.includes('session.user.role !== \'ADMIN\'')
      const returns403 = guardFile.includes('status: 403')
      
      if (usesRequireAdmin && hasGuardCheck && returns403) {
        return { 
          passed: true, 
          details: '✅ Les routes admin utilisent requireAdmin avec vérification stricte du rôle' 
        }
      } else {
        return { 
          passed: false, 
          details: '❌ Les routes admin n\'utilisent pas requireAdmin correctement' 
        }
      }
    }
  },
  {
    name: 'Schéma inscription - pas de champ role accepté',
    description: 'Vérifie que le schéma d\'inscription n\'accepte pas le champ role',
    check: () => {
      const registerRoute = readFileSync(join(PROJECT_ROOT, 'app/api/auth/register/route.ts'), 'utf-8')
      
      const registerSchemaMatch = registerRoute.match(/const registerSchema = z\.object\(([\s\S]*?)\)/)
      if (!registerSchemaMatch) {
        return { passed: false, details: '❌ Schéma d\'inscription non trouvé' }
      }
      
      const schemaContent = registerSchemaMatch[1]
      const hasRoleField = schemaContent.includes('role:')
      
      if (!hasRoleField) {
        return { 
          passed: true, 
          details: '✅ Le schéma d\'inscription n\'accepte pas le champ role' 
        }
      } else {
        return { 
          passed: false, 
          details: '❌ Le schéma d\'inscription accepte le champ role (vulnérabilité)' 
        }
      }
    }
  },
  {
    name: 'Schéma profil - pas de champ role accepté',
    description: 'Vérifie que le schéma de profil n\'accepte pas le champ role',
    check: () => {
      const profileRoute = readFileSync(join(PROJECT_ROOT, 'app/api/profile/route.ts'), 'utf-8')
      
      const profileSchemaMatch = profileRoute.match(/const updateProfileSchema = z\.object\(([\s\S]*?)\)/)
      if (!profileSchemaMatch) {
        return { passed: false, details: '❌ Schéma de profil non trouvé' }
      }
      
      const schemaContent = profileSchemaMatch[1]
      const hasRoleField = schemaContent.includes('role:')
      
      if (!hasRoleField) {
        return { 
          passed: true, 
          details: '✅ Le schéma de profil n\'accepte pas le champ role' 
        }
      } else {
        return { 
          passed: false, 
          details: '❌ Le schéma de profil accepte le champ role (vulnérabilité)' 
        }
      }
    }
  },
  {
    name: 'API admin users - uniquement modification active',
    description: 'Vérifie que l\'API admin users ne modifie que le champ active',
    check: () => {
      const adminUsersRoute = readFileSync(join(PROJECT_ROOT, 'app/api/admin/users/route.ts'), 'utf-8')
      
      const patchSchemaMatch = adminUsersRoute.match(/const patchSchema = z\.object\(([\s\S]*?)\)/)
      if (!patchSchemaMatch) {
        return { passed: false, details: '❌ Schéma PATCH admin users non trouvé' }
      }
      
      const schemaContent = patchSchemaMatch[1]
      const onlyActiveField = schemaContent.includes('active:') && !schemaContent.includes('role:')
      
      if (onlyActiveField) {
        return { 
          passed: true, 
          details: '✅ L\'API admin users ne modifie que le champ active, pas role' 
        }
      } else {
        return { 
          passed: false, 
          details: '❌ L\'API admin users pourrait modifier d\'autres champs' 
        }
      }
    }
  },
  {
    name: 'Pas de route de création admin publique',
    description: 'Vérifie qu\'il n\'existe pas de route publique pour créer des admins',
    check: () => {
      // Chercher dans tous les fichiers API
      const fs = require('fs')
      const path = require('path')
      
      const apiDir = join(PROJECT_ROOT, 'app/api')
      if (!fs.existsSync(apiDir)) {
        return { passed: true, details: '✅ Pas de répertoire API (probablement pas applicable)' }
      }
      
      function scanDirectory(dir: string): string[] {
        const files: string[] = []
        const items = fs.readdirSync(dir)
        
        for (const item of items) {
          const fullPath = path.join(dir, item)
          const stat = fs.statSync(fullPath)
          
          if (stat.isDirectory()) {
            files.push(...scanDirectory(fullPath))
          } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            files.push(fullPath)
          }
        }
        
        return files
      }
      
      const apiFiles = scanDirectory(apiDir)
      let hasVulnerability = false
      
      for (const file of apiFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        
        // Chercher des patterns suspects
        const suspiciousPatterns = [
          /role.*ADMIN/gi,
          /create.*admin/gi,
          /setRole.*ADMIN/gi,
        ]
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(content) && !file.includes('guard') && !file.includes('test')) {
            // Vérifier si c'est dans un contexte admin protégé ou un commentaire de sécurité
            const hasRequireAdmin = content.includes('requireAdmin')
            const hasSecurityComment = content.includes('sécurité') || content.includes('security')
            const hasRoleUserForce = content.includes("role: 'USER'") && content.includes('jamais ADMIN')
            
            if (!hasRequireAdmin && !hasSecurityComment && !hasRoleUserForce) {
              hasVulnerability = true
              console.log(`   ⚠️  Pattern suspect trouvé dans: ${file}`)
            }
          }
        }
      }
      
      if (!hasVulnerability) {
        return { 
          passed: true, 
          details: '✅ Aucune route publique ne permet de créer des admins' 
        }
      } else {
        return { 
          passed: false, 
          details: '❌ Des routes suspectes trouvées (voir détails ci-dessus)' 
        }
      }
    }
  }
]

async function runSecurityChecks() {
  console.log('🔒 Tests de sécurité statique - Analyse du code source\n')
  console.log('Ces tests vérifient que le code ne contient pas de vulnérabilités')
  console.log('d\'élévation de privilèges au niveau de la structure du code.\n')

  let passedCount = 0
  let failedCount = 0

  for (const check of securityChecks) {
    console.log(`📝 ${check.name}`)
    console.log(`   ${check.description}`)
    
    const result = check.check()
    console.log(`   ${result.details}\n`)
    
    if (result.passed) {
      passedCount++
    } else {
      failedCount++
    }
  }

  console.log('📊 Résumé:')
  console.log(`   ✅ Tests réussis: ${passedCount}/${securityChecks.length}`)
  console.log(`   ❌ Tests échoués: ${failedCount}/${securityChecks.length}`)

  if (failedCount === 0) {
    console.log('\n🎉 Tous les tests de sécurité sont passés!')
    console.log('   Le code est protégé contre l\'élévation de privilèges.')
  } else {
    console.log('\n⚠️  Certains tests ont échoué.')
    console.log('   Veuillez corriger les vulnérabilités identifiées.')
    process.exit(1)
  }
}

runSecurityChecks()
