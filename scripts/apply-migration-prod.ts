/**
 * Script pour appliquer la migration PostgreSQL en production
 * 
 * Ce script nécessite les variables d'environnement de production :
 * - DATABASE_URL (PostgreSQL pooler)
 * - DIRECT_URL (PostgreSQL direct pour migrations)
 * 
 * UTILISATION :
 * 1. Configurez les variables d'environnement de production
 * 2. Lancez : npm run migrate:prod
 */

import { execSync } from 'child_process'

console.log('🗄️  Application de la migration PostgreSQL en production...\n')

try {
  // Appliquer la migration avec le schéma PostgreSQL
  console.log('📋 Exécution de : prisma migrate deploy --schema prisma/schema.postgres.prisma')
  execSync('npx prisma migrate deploy --schema prisma/schema.postgres.prisma', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
    },
  })

  console.log('\n✅ Migration appliquée avec succès !')
  console.log('📝 Les nouveaux champs (clientEmail, clientAddress, dueDate) sont maintenant disponibles.')
} catch (error) {
  console.error('\n❌ Erreur lors de la migration :')
  console.error(error)
  console.error('\n💡 Vérifiez que :')
  console.error('   1. DATABASE_URL est configuré (PostgreSQL pooler)')
  console.error('   2. DIRECT_URL est configuré (PostgreSQL direct)')
  console.error('   3. Les credentials sont valides')
  process.exit(1)
}
