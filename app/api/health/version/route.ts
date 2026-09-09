import { NextResponse } from 'next/server'

/**
 * Endpoint pour vérifier la version du déploiement
 * Utile pour vérifier si le dernier code est bien déployé
 */
export async function GET() {
  return NextResponse.json({
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    deployment: 'active',
    features: {
      freeCredits: true,
      newPacks: true,
      debugEndpoints: true,
    },
  })
}
