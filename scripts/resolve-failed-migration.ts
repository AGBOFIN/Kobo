/**
 * Script pour résoudre la migration échouée en production
 * 
 * UTILISATION :
 * 1. Configurez temporairement DATABASE_URL et DIRECT_URL dans .env pour la production
 * 2. Lancez : npx tsx scripts/resolve-failed-migration.ts
 * 
 * OU utilisez directement avec les credentials :
 * DATABASE_URL="production_url" DIRECT_URL="production_direct_url" npx tsx scripts/resolve-failed-migration.ts
 */

import { execSync } from 'child_process'

console.log('🔧 Résolution de la migration échouée...')
console.log('='.repeat(50))

// Vérifier les variables d'environnement
if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.error('\n❌ Erreur: DATABASE_URL et DIRECT_URL doivent être configurés')
  console.error('\n💡 Configurez-les dans .env ou passez-les en paramètres :')
  console.error('   DATABASE_URL="your_prod_url" DIRECT_URL="your_direct_url" npx tsx scripts/resolve-failed-migration.ts')
  process.exit(1)
}

console.log('📌 DATABASE_URL:', process.env.DATABASE_URL.substring(0, 20) + '...')
console.log('📌 DIRECT_URL:', process.env.DIRECT_URL.substring(0, 20) + '...')

try {
  // Marquer la migration comme rolled-back
  console.log('\n📋 Marquage de la migration 20240109_add_invoice_client_fields comme rolled-back...')
  
  execSync('npx prisma migrate resolve --rolled-back 20240109_add_invoice_client_fields --schema prisma/schema.postgres.prisma', {
    stdio: 'inherit',
    env: {
      ...process.env,
    },
  })

  console.log('\n✅ Migration marquée comme rolled-back avec succès')
  console.log('📝 Le blocage est levé, les nouveaux déploiements pourront maintenant s\'appliquer')
  console.log('\n🚀 Prochaine étape : poussez le code et lancez un nouveau déploiement Vercel')
} catch (error) {
  console.error('\n❌ Erreur lors de la résolution de la migration:')
  console.error(error)
  console.error('\n💡 Vérifiez que:')
  console.error('   1. DATABASE_URL est correct (PostgreSQL pooler)')
  console.error('   2. DIRECT_URL est correct (PostgreSQL direct)')
  console.error('   3. Les credentials sont valides')
  process.exit(1)
}
