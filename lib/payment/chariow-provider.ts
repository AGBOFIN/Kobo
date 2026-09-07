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
 *                  phone {number NATIONAL, country_code ISO alpha-2} (voir toChariowPhone),
 *                  custom_metadata (max 10 clés, 255 car), currency optionnelle.
 *                  Réponse data.step = "payment" → data.payment.checkout_url.
 *  - Webhooks    : « Pulses ». En-tête x-chariow-signature = "sha256=" + hex(HMAC-SHA256(corps
 *                  BRUT, secret du Pulse)). Aucun timestamp dans la signature — la protection
 *                  anti-rejeu passe par la déduplication sur x-pulse-delivery-id.
 *  - Événements  : successful.sale, failed.sale, abandoned.sale (ventes) ; le payload
 *                  contient sale.id, sale.status, sale.custom_metadata, customer.email.
 *  - Vente       : GET {API}/sales/{id} — re-vérification indépendante avant crédit.
 */
/**
 * Normalisation du téléphone au format EXIGÉ par l'API checkout Chariow.
 *
 * Format documenté (chariow.dev → Initiate Checkout, champs phone) :
 *  - phone.number       : « Phone number (numeric only). Example: 1234567890 »
 *    → numéro NATIONAL uniquement, SANS l'indicatif international (l'exemple
 *      US « 1234567890 » fait 10 chiffres, sans le « 1 ») ;
 *  - phone.country_code : « ISO country code. Example: US, FR, GB »
 *    → code pays ISO 3166-1 alpha-2, PAS l'indicatif téléphonique.
 *
 * Les profils Kobo stockent le téléphone en texte libre (« +228 90 12 34 56 »,
 * « 0022890123456 », « 90123456 »…). Envoyer « +22890123456 » tel quel produit
 * number="22890123456" (11 chiffres, indicatif inclus) + country_code="TG" →
 * rejet 400 « Invalid phone number. Check the number and country code. »
 *
 * Normalisation :
 *  1. suppression de tout caractère non numérique, puis du préfixe « 00 » ;
 *  2. numéro de 8 chiffres → national Togo tel quel (numérotation togolaise = 8 chiffres) ;
 *  3. sinon indicatif reconnu (table ci-dessous, marché cible + diaspora) suivi
 *     d'une longueur nationale plausible (6–10 chiffres) → code ISO correspondant ;
 *  4. sinon « 0 » de trunk initial sur 9 chiffres → 8 chiffres Togo.
 *
 * Le numéro / pays résultants restent validés par Chariow : toute entrée non
 * conforme donnera un 400 explicite, journalisé comme les autres erreurs API.
 */
const DIAL_CODES: Array<{ code: string; iso: string }> = [
  { code: '228', iso: 'TG' }, // Togo
  { code: '229', iso: 'BJ' }, // Bénin
  { code: '226', iso: 'BF' }, // Burkina Faso
  { code: '225', iso: 'CI' }, // Côte d'Ivoire
  { code: '227', iso: 'NE' }, // Niger
  { code: '233', iso: 'GH' }, // Ghana
  { code: '234', iso: 'NG' }, // Nigeria
  { code: '221', iso: 'SN' }, // Sénégal
  { code: '223', iso: 'ML' }, // Mali
  { code: '224', iso: 'GN' }, // Guinée
  { code: '235', iso: 'TD' }, // Tchad
  { code: '236', iso: 'CF' }, // Centrafrique
  { code: '237', iso: 'CM' }, // Cameroun
  { code: '241', iso: 'GA' }, // Gabon
  { code: '242', iso: 'CG' }, // Congo
  { code: '243', iso: 'CD' }, // RD Congo
  { code: '33', iso: 'FR' }, // France
]

export function toChariowPhone(raw: string | undefined | null): {
  number: string
  countryCode: string
} {
  let digits = (raw || '').replace(/\D/g, '')
  if (!digits) return { number: '00000000', countryCode: 'TG' }

  // Préfixe international « 00 » (alternatif au « + »)
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (!digits) return { number: '00000000', countryCode: 'TG' }

  // Numérotation togolaise : 8 chiffres nationaux.
  if (digits.length === 8) return { number: digits, countryCode: 'TG' }

  // Indicatif reconnu + longueur nationale plausible → on le retire.
  const match = DIAL_CODES.find(d => digits.startsWith(d.code))
  if (match) {
    const national = digits.slice(match.code.length)
    if (national.length >= 6 && national.length <= 10) {
      return { number: national, countryCode: match.iso }
    }
  }

  // « 0 » de trunk initial (« 090123456 » → « 90123456 »).
  if (digits.length === 9 && digits.startsWith('0')) {
    return { number: digits.slice(1), countryCode: 'TG' }
  }

  // Dernier recours : on envoie tel quel avec le pays par défaut (Togo) —
  // Chariow validera et son erreur sera journalisée.
  return { number: digits, countryCode: 'TG' }
}

/** IP valide (IPv4 ou IPv6 simple) — évite d'envoyer « unknown » à l'API. */
function isPlausibleIp(value: string): boolean {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) return true // IPv4
  return /^[0-9a-fA-F:]{2,45}$/.test(value) && value.includes(':') // IPv6
}

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
      customerIp?: string
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

      // Téléphone : format documenté — numéro NATIONAL en chiffres seuls +
      // code pays ISO alpha-2 (voir toChariowPhone pour la normalisation).
      const phone = toChariowPhone(context.phone)

      const payload: Record<string, unknown> = {
        product_id: context.productId,
        email: context.email,
        first_name: firstName,
        last_name: lastName,
        phone: { number: phone.number, country_code: phone.countryCode },
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
      // Recommandé par la doc : permet à Chariow de proposer les bons moyens
      // de paiement (mobile money etc.) selon le pays de l'acheteur.
      if (context.customerIp && isPlausibleIp(context.customerIp)) {
        payload.customer_ip = context.customerIp
      }

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
