import { NextResponse } from 'next/server'

/**
 * Endpoint simple pour vérifier si le déploiement est à jour
 */
export async function GET() {
  return NextResponse.json({
    status: 'deployed',
    timestamp: new Date().toISOString(),
    message: 'If you see this, the deployment is active',
  })
}
