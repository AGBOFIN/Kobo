import { createHmac, timingSafeEqual } from 'crypto'
import { PaymentProviderInterface } from './interface'

/**
 * Fournisseur de paiement Chariow (https://chariow.com — doc développeurs : chariow.dev).
 *
 * Chariow est une plateforme de vente de produits numériques : le prix est porté
 * par le PRODUIT côté Chariow (pas par l'appel API). Chaque pack de crédits Kobo
 * correspond donc à un produit Chariow dont l'ID est stocké dans
 * CreditPack.chariowProductId. Les montants enregistrés côté Kobo restent
 * ceux du pack en base et sont re-vérifiés avant tout crédit.
 *
 * Configuration par variables d'environnement (jamais de clé en dur) :
 *  - CHARIOW_API_KEY        : clé API (Bearer) — Settings → API Keys sur app.chariow.com
 *  - CHARIOW_PULSE_SECRET   : secret de signature du Pulse webhook (préfixe whsec_)
 *  - CHARIOW_ENV            : "sandbox" (défaut) ou "live" — indicatif, documenté dans env.example
 *  - CHARIOW_API_URL        : optionnel, surcharge l'URL de base de l'API
 *
 * Points de doc respectés (chariow.dev) :
 *  - Checkout    : POST {API}/checkout avec product_id, email, first_name, last_name,
 *                  phone {number, country_code}, custom_metadata (max 10 clés, 255 car),
 *                  currency optionnelle. Réponse data.step = "payment" → data.payment.checkout_url.
 *  - Webhooks    : « Pulses ». En-tête x-chariow-signature = "sha256=" + hex(HMAC-SHA256(corps
 *                  BRUT, secret du Pulse)). Aucun timestamp dans la signature — la protection
 *                  anti-rejeu passe par la déduplication sur x-pulse-delivery-id.
 *  - Événements  : successful.sale, failed.sale, abandoned.sale (ventes) ; le payload
 *                  contient sale.id, sale.status, sale.custom_metadata, customer.email.
 *  - Vente       : GET {API}/sales/{id} — re-vérification indépendante avant crédit.
 */
export class ChariowProvider implements PaymentProviderInterface {
  private apiKey: string
  private baseUrl: string
  readonly name = 'CHARIOW'

  constructor() {
    const key = process.env.CHARIOW_API_KEY
    if (!key) {
      throw new Error(
        "CHARIOW_API_KEY manquante : configurez les variables d'environnement Chariow."
      )
    }
    this.apiKey = key
    this.baseUrl = process.env.CHARIOW_API_URL || 'https://api.chariow.com/v1'
  }

  private async request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...(options.headers || {}),
      },
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(
        `Chariow API error ${response.status}: ${JSON.stringify(body)}`
      )
    }

    return body
  }

  async initiatePayment(
    amount: number,
    userId: string,
    packId: string,
    context?: {
      description?: string
      email?: string
      name?: string
      phone?: string
      callbackUrl?: string
      productId?: string
    }
  ): Promise<{
    success: boolean
    transactionRef?: string
    paymentUrl?: string
    error?: string
  }> {
    try {
      if (!context?.productId) {
        throw new Error(
          `Aucun produit Chariow configuré pour ce pack (CreditPack.chariowProductId). Associez chaque pack à un produit Chariow depuis le dashboard Chariow.`
        )
      }

      const purchaseRef = `KOBO-${packId.slice(0, 6).toUpperCase()}-${Date.now()}`

      // Découpe du nom pour first_name / last_name (champs requis par l'API)
      const nameParts = (context.name || 'Client Kobo').trim().split(/\s+/)
      const firstName = nameParts[0] || 'Client'
      const lastName = nameParts.slice(1).join(' ') || 'Kobo'

      // Téléphone : l'API exige numeric-only + code pays ISO.
      let phoneDigits = (context.phone || '').replace(/\D/g, '')
      if (!phoneDigits) phoneDigits = '00000000'

      const payload: Record<string, unknown> = {
        product_id: context.productId,
        email: context.email,
        first_name: firstName,
        last_name: lastName,
        phone: { number: phoneDigits, country_code: 'TG' },
        // Montant du pack enregistré dans les métadonnées : sert de contrôle
        // croisé lors du webhook (l'API ne prend pas de montant).
        custom_metadata: {
          kobo_user_id: userId,
          kobo_pack_id: packId,
          kobo_purchase_ref: purchaseRef,
          kobo_amount_fcfa: String(amount),
        },
      }
      if (context.callbackUrl) payload.redirect_url = context.callbackUrl
      if (amount > 0) payload.currency = 'XOF'

      const response = await this.request('/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const step: string = response?.data?.step || ''
      const saleId: string | undefined = response?.data?.purchase?.id

      if (step === 'payment') {
        const checkoutUrl: string | undefined = response?.data?.payment?.checkout_url
        if (!checkoutUrl) {
          throw new Error('Réponse Chariow sans URL de paiement')
        }
        return { success: true, transactionRef: saleId, paymentUrl: checkoutUrl }
      }

      if (step === 'already_purchased') {
        throw new Error(
          'Ce client possède déjà un accès actif à ce produit Chariow (produit non ré-achetable). Utilisez un produit de type licence ou téléchargeable autorisant les achats répétés.'
        )
      }

      throw new Error(`Réponse Chariow inattendue (step: ${step || 'inconnu'})`)
    } catch (error: any) {
      console.error('Chariow initiatePayment error:', error?.message || error)
      return {
        success: false,
        error: error?.message || "Erreur lors de l'initiation du paiement Chariow",
      }
    }
  }

  async handleWebhook(payload: unknown): Promise<{
    success: boolean
    transactionRef?: string
    status?: 'CONFIRME' | 'ECHOUE'
    error?: string
  }> {
    // La signature est vérifiée dans la route webhook (elle nécessite le corps
    // brut). Ici on n'interprête que l'événement.
    const event = payload as any
    const eventName: string = event?.event || ''

    if (!eventName.endsWith('.sale')) {
      return { success: true, error: `Événement ignoré : ${eventName}` }
    }

    const sale = event?.sale
    const saleId = sale?.id

    if (!saleId) {
      return {
        success: false,
        error: "Impossible d'extraire l'identifiant de vente du webhook",
      }
    }

    if (eventName === 'successful.sale') {
      return { success: true, transactionRef: String(saleId), status: 'CONFIRME' }
    }
    if (eventName === 'failed.sale') {
      return { success: true, transactionRef: String(saleId), status: 'ECHOUE' }
    }
    // abandoned.sale : le panier est abandonné, rien à créditer ni à clôturer
    // (l'achat reste EN_ATTENTE côté Kobo et expirera naturellement).
    return { success: true, error: `Vente abandonnée, achat laissé en attente` }
  }

  async checkPaymentStatus(transactionRef: string): Promise<{
    success: boolean
    status?: 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE'
    error?: string
  }> {
    try {
      const response = await this.request(`/sales/${encodeURIComponent(transactionRef)}`)
      const sale = response?.data
      const status: string = sale?.status || ''

      if (['completed', 'settled'].includes(status)) {
        return { success: true, status: 'CONFIRME' }
      }
      if (['failed', 'refunded'].includes(status)) {
        return { success: true, status: 'ECHOUE' }
      }
      return { success: true, status: 'EN_ATTENTE' }
    } catch (error: any) {
      console.error('Chariow checkPaymentStatus error:', error?.message || error)
      return { success: false, error: error?.message || 'Erreur de vérification Chariow' }
    }
  }
}

/**
 * Vérification de la signature des webhooks Chariow (« Pulses »).
 *
 * Contrat exact (chariow.dev → Pulse Security) :
 *  - en-tête x-chariow-signature, format "sha256=<64 hex minuscules>" ;
 *  - signature = HMAC-SHA256(corps HTTP BRUT, secret du Pulse "whsec_...") ;
 *  - pas de timestamp : pas de fenêtre de rejeu ici — la protection contre les
 *    rejeux est assurée par la déduplication sur x-pulse-delivery-id ;
 *  - comparaison en temps constant (crypto.timingSafeEqual) après égalité de longueur.
 */
export function verifyChariowWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false
  if (!signatureHeader.startsWith('sha256=')) return false

  const received = signatureHeader.slice('sha256='.length)
  const expected = createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')

  const a = Buffer.from(received, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}
