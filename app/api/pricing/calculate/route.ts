import { NextRequest, NextResponse } from 'next/server'
import {
  pricingCalculatorSchema,
  calculatePricing,
} from '@/lib/validations/pricing'
import {
  checkRateLimit,
  clientIp,
  rateLimitHeaders,
} from '@/lib/security/rate-limit'

/**
 * POST /api/pricing/calculate — version serveur du calculateur de prix (§9).
 *
 * Le calcul reste fait côté client pour l'interactivité ; cette route existe
 * pour la cohérence (une seule source de vérité : lib/validations/pricing.ts),
 * les tests automatisés et une future intégration (ex: assistant WhatsApp).
 *
 * Route PUBLIQUE (le calculateur est gratuit et sans compte) mais limitée :
 * 30 requêtes / IP / minute (anti-abus de calcul).
 */
export async function POST(request: NextRequest) {
  const rl = checkRateLimit(`pricing:ip:${clientIp(request)}`, 30, 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans un instant.' },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  try {
    const body = await request.json()
    const parsed = pricingCalculatorSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const result = calculatePricing(parsed.data)

    return NextResponse.json({ result })
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide' },
      { status: 400 }
    )
  }
}
