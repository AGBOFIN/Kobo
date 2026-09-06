import { NextResponse } from 'next/server'
import { isChariowEnabled } from '@/lib/payment'

/**
 * Informe l'interface du mode de paiement actuellement configuré :
 *  - "CHARIOW" quand CHARIOW_API_KEY est présente (paiement en ligne)
 *  - "MANUAL" sinon (paiement hors-ligne + confirmation admin)
 */
export async function GET() {
  return NextResponse.json({
    mode: isChariowEnabled() ? 'CHARIOW' : 'MANUAL',
    env: (process.env.CHARIOW_ENV || 'sandbox').toLowerCase(),
  })
}
