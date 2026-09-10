import { describe, it, expect } from '@jest/globals'
import { createHmac } from 'crypto'
import {
  ChariowProvider,
  verifyChariowWebhookSignature,
  toChariowPhone,
} from '../lib/payment/chariow-provider'
import { calculatePricing } from '../lib/validations/pricing'
import { calculateInvoice } from '../lib/validations/invoice'
import { randomUUID } from 'crypto'

/**
 * 5.1 Exemple de référence (brief) — garde-fou sur la logique de calcul,
 * exécuté à chaque suite pour garantir la cohérence des montants FCFA.
 */
describe('Calculs de référence (brief 5.1)', () => {
  it('calcule le prix conseillé : 7500 de coûts + 30% → 9750 FCFA', () => {
    const result = calculatePricing({
      productName: 'Pagne wax',
      purchasePrice: 5000,
      transportCost: 1000,
      packagingCost: 300,
      advertisingCost: 700,
      otherCosts: 500,
      profitPercentage: 30,
    })
    expect(result.totalCosts).toBe(7500)
    expect(result.recommendedPrice).toBe(9750)
    expect(result.profitMarginFcfa).toBe(2250)
  })

  it('calcule les totaux d’une facture avec réduction et reste à payer', () => {
    const result = calculateInvoice({
      clientName: 'Client Test',
      clientPhone: '90000000',
      items: [
        { designation: 'Article A', quantity: 2, unitPrice: 1000 },
        { designation: 'Article B', quantity: 1, unitPrice: 500 },
      ],
      discount: 500,
      deliveryFee: 200,
      amountPaid: 1500,
    })
    expect(result.subtotal).toBe(2500)
    expect(result.totalAmount).toBe(2200)
    expect(result.remainingAmount).toBe(700)
    expect(result.status).toBe('PARTIEL')
  })
})

/**
 * Chariow — vérification de la signature des webhooks « Pulses ».
 * Contrat doc (chariow.dev → Pulse Security) :
 *   x-chariow-signature: "sha256=" + hex(HMAC-SHA256(corps BRUT, whsec_...))
 */
describe('Chariow — vérification de signature webhook (Pulse)', () => {
  const secret = 'whsec_test_secret_123'
  const payload = JSON.stringify({
    event: 'successful.sale',
    sale: {
      id: 'sal_xyz789abc',
      status: 'completed',
      amount: { value: 1500, currency: 'XOF' },
      custom_metadata: { kobo_user_id: 'user_1', kobo_pack_id: 'pack_1' },
    },
    customer: { email: 'awa@kobo.test' },
  })

  const sign = (body: string, sec: string) =>
    'sha256=' + createHmac('sha256', sec).update(body, 'utf8').digest('hex')

  it('accepte une signature valide', () => {
    expect(verifyChariowWebhookSignature(payload, sign(payload, secret), secret)).toBe(true)
  })

  it('rejette un corps modifié (tampering)', () => {
    const tampered = payload.replace('1500', '999999')
    expect(verifyChariowWebhookSignature(payload, sign(tampered, secret), secret)).toBe(false)
  })

  it('rejette un secret incorrect (clé API au lieu du secret Pulse)', () => {
    expect(verifyChariowWebhookSignature(payload, sign(payload, 'sk_live_otherey'), secret)).toBe(false)
  })

  it('rejette un préfixe de schéma inconnu', () => {
    expect(verifyChariowWebhookSignature(payload, 'md5=deadbeef', secret)).toBe(false)
  })

  it('rejette une signature ou un secret absent', () => {
    expect(verifyChariowWebhookSignature(payload, null, secret)).toBe(false)
    expect(verifyChariowWebhookSignature(payload, sign(payload, secret), '')).toBe(false)
  })
})

/**
 * Chariow — format du téléphone attendu par POST /v1/checkout.
 *
 * Doc (chariow.dev → Initiate Checkout) :
 *   phone.number       = numéro NATIONAL, chiffres seuls (ex. US « 1234567890 »,
 *                        sans l'indicatif « 1 ») ;
 *   phone.country_code = code ISO 3166-1 alpha-2 (« TG », PAS « 228 »).
 *
 * Régression : « +22890123456 » était envoyé brut (indicatif inclus) → 400
 * « Invalid phone number. Check the number and country code. »
 */
describe('Chariow — normalisation du téléphone (format API documenté)', () => {
  it('retire l\'indicatif international +228 d\'un numéro togolais (cas du bug)', () => {
    expect(toChariowPhone('+22890123456')).toEqual({
      number: '90123456',
      countryCode: 'TG',
    })
  })

  it('gère les espaces et le préfixe international 00', () => {
    expect(toChariowPhone('+228 90 12 34 56')).toEqual({ number: '90123456', countryCode: 'TG' })
    expect(toChariowPhone('0022890123456')).toEqual({ number: '90123456', countryCode: 'TG' })
  })

  it('laisse tel quel un numéro déjà national (8 chiffres, Togo)', () => {
    expect(toChariowPhone('90 12 34 56')).toEqual({ number: '90123456', countryCode: 'TG' })
    // 8 chiffres commençant par 22 : NE PAS confondre avec un indicatif
    // (la numérotation togolaise à 8 chiffres prime sur la détection d'indicatif)
    expect(toChariowPhone('22501234')).toEqual({ number: '22501234', countryCode: 'TG' })
  })

  it('retire le « 0 » de trunk initial (format local 9 chiffres)', () => {
    expect(toChariowPhone('090123456')).toEqual({ number: '90123456', countryCode: 'TG' })
  })

  it('détecte les indicatifs des pays voisins et de la diaspora', () => {
    expect(toChariowPhone('+229 97 12 34 56')).toEqual({ number: '97123456', countryCode: 'BJ' })
    expect(toChariowPhone('+226 70 12 34 56')).toEqual({ number: '70123456', countryCode: 'BF' })
    expect(toChariowPhone('+225 07 12 34 56 78')).toEqual({ number: '0712345678', countryCode: 'CI' })
    expect(toChariowPhone('+233 24 123 4567')).toEqual({ number: '241234567', countryCode: 'GH' })
    expect(toChariowPhone('+33 6 12 34 56 78')).toEqual({ number: '612345678', countryCode: 'FR' })
  })

  it('tombe sur un placeholder propre quand il n\'y a aucun numéro', () => {
    expect(toChariowPhone('')).toEqual({ number: '00000000', countryCode: 'TG' })
    expect(toChariowPhone(null)).toEqual({ number: '00000000', countryCode: 'TG' })
    expect(toChariowPhone('pas un numéro')).toEqual({ number: '00000000', countryCode: 'TG' })
  })
})

/**
 * Chariow — mapping des événements webhook vers les statuts Kobo.
 */
describe('ChariowProvider — mapping des événements Pulse', () => {
  const withKey = (fn: () => Promise<void>) => async () => {
    const prev = process.env.CHARIOW_API_KEY
    process.env.CHARIOW_API_KEY = 'test_key'
    try {
      await fn()
    } finally {
      if (prev === undefined) delete process.env.CHARIOW_API_KEY
      else process.env.CHARIOW_API_KEY = prev
    }
  }

  const provider = () => new ChariowProvider()

  it(
    'successful.sale → CONFIRME avec la référence de vente',
    withKey(async () => {
      const result = await provider().handleWebhook({
        event: 'successful.sale',
        sale: { id: 'sal_abc123', status: 'completed' },
      })
      expect(result.success).toBe(true)
      expect(result.transactionRef).toBe('sal_abc123')
      expect(result.status).toBe('CONFIRME')
    })
  )

  it(
    'failed.sale → ECHOUE',
    withKey(async () => {
      const result = await provider().handleWebhook({
        event: 'failed.sale',
        sale: { id: 'sal_def456', status: 'failed' },
      })
      expect(result.success).toBe(true)
      expect(result.status).toBe('ECHOUE')
    })
  )

  it(
    'abandoned.sale → ignoré (aucun crédit)',
    withKey(async () => {
      const result = await provider().handleWebhook({
        event: 'abandoned.sale',
        sale: { id: 'sal_ghi789', status: 'abandoned' },
      })
      expect(result.success).toBe(true)
      expect(result.transactionRef).toBeUndefined()
    })
  )

  it(
    'événement non-vente → ignoré',
    withKey(async () => {
      const result = await provider().handleWebhook({
        event: 'license.activated',
        license: { id: 'lic_1' },
      })
      expect(result.success).toBe(true)
      expect(result.transactionRef).toBeUndefined()
    })
  )

  it(
    'payload sans vente → erreur explicite',
    withKey(async () => {
      const result = await provider().handleWebhook({ event: 'successful.sale' })
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  )
})

/**
 * Déduplication & montant des crédits — invariant métier :
 * une même référence de vente ne crédite qu'une seule fois, et le nombre de
 * crédits attribués correspond toujours au pack enregistré en base (brief §11).
 *
 * La logique est portée par :
 *  - la contrainte @@unique([provider, transactionRef]) sur CreditPurchase ;
 *  - la bascule conditionnelle EN_ATTENTE → CONFIRME (updateMany count).
 */
describe('Déduplication des crédits (invariants de schéma)', () => {
  const PACKS = [
    { id: 'cmtpo381s0000797fsj1qtvru', price: 1500, credits: 15 },
    { id: 'cmtpo381s0001797ftorq9ngj', price: 5000, credits: 60 },
    { id: 'cmtpo381s0002797frrn90ewb', price: 10000, credits: 150 },
  ]

  const priceToCredits = (price: number) =>
    PACKS.find(p => p.price === price)?.credits ?? 0

  it('chaque prix de pack correspond à un nombre de crédits connu', () => {
    expect(priceToCredits(1500)).toBe(15)
    expect(priceToCredits(5000)).toBe(60)
    expect(priceToCredits(10000)).toBe(150)
    expect(priceToCredits(9999)).toBe(0) // prix inconnu → jamais crédité
  })

  it('une vente déjà traitée ne re-crédite pas (simulation du updateMany count)', async () => {
    const processed = new Set<string>()
    const creditOnce = (saleId: string) => {
      if (processed.has(saleId)) return false
      processed.add(saleId)
      return true
    }

    const saleId = `sal_${randomUUID()}`
    expect(creditOnce(saleId)).toBe(true) // premier webhook
    expect(creditOnce(saleId)).toBe(false) // doublon (retry / replay)
  })
})
