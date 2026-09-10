/**
 * Script pour mettre à jour les packs de crédits en production
 * via l'API (nécessite un cookie de session admin)
 */

const API_BASE = 'https://facomptkobo.vercel.app'

async function updatePackViaAdmin(packId: string, name: string, price: number, credits: number) {
  console.log(`Mise à jour pack ${name}: ${price} FCFA / ${credits} crédits`)

  // Note: Cela nécessite d'être connecté en tant qu'admin
  // Pour l'instant, nous devons utiliser la migration Prisma
  console.log('⚠️  Ce script nécessite une session admin valide')
  console.log('⚠️  Utilisez plutôt la migration Prisma qui sera appliquée au déploiement')
}

console.log('Pour mettre à jour les packs en production:')
console.log('1. Attendez que le déploiement Vercel applique les migrations')
console.log('2. Les packs seront automatiquement mis à jour via la migration SQL')
console.log('3. Si la migration échoue, vous pouvez exécuter manuellement dans Supabase:')
console.log('')
console.log('UPDATE "CreditPack" SET name = \'Pack Découverte\', price = 1500, creditsCount = 15 WHERE name = \'Pack Débutant\';')
console.log('UPDATE "CreditPack" SET price = 5000, creditsCount = 60 WHERE name = \'Pack Standard\';')
console.log('UPDATE "CreditPack" SET price = 10000, creditsCount = 150 WHERE name = \'Pack Pro\';')
