/**
 * Interface pour les fournisseurs de paiement
 * Permet de changer facilement de fournisseur (Flooz, T-Money, CinetPay, FedaPay, etc.)
 */

export interface PaymentProviderInterface {
  /**
   * Initie un paiement
   * @param amount - Montant en FCFA
   * @param userId - ID de l'utilisateur
   * @param packId - ID du pack de crédits
   * @param context - Informations complémentaires (client, URL de retour) utiles aux agrégateurs
   * @returns Référence de transaction ou URL de paiement
   */
  initiatePayment(
    amount: number,
    userId: string,
    packId: string,
    context?: {
      description?: string
      email?: string
      name?: string
      phone?: string
      callbackUrl?: string
      /** Chariow : ID du produit correspondant au pack (le prix est porté par le produit côté Chariow). */
      productId?: string
      /** IP du client (recommandé par Chariow : améliore les moyens de paiement proposés au checkout). */
      customerIp?: string
    }
  ): Promise<{
    success: boolean
    transactionRef?: string
    paymentUrl?: string
    error?: string
  }>

  /**
   * Gère le webhook de confirmation de paiement
   * @param payload - Données du webhook
   * @returns Statut de la confirmation
   */
  handleWebhook(payload: unknown): Promise<{
    success: boolean
    transactionRef?: string
    status?: 'CONFIRME' | 'ECHOUE'
    error?: string
  }>

  /**
   * Vérifie le statut d'une transaction
   * @param transactionRef - Référence de transaction
   * @returns Statut du paiement
   */
  checkPaymentStatus(transactionRef: string): Promise<{
    success: boolean
    status?: 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE'
    error?: string
  }>
}

/**
 * Configuration des packs de crédits
 */
export interface CreditPackConfig {
  id: string
  name: string
  price: number      // Prix en FCFA
  creditsCount: number // Nombre de crédits
}