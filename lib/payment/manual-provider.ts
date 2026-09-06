import { PaymentProviderInterface } from './interface'

/**
 * Implémentation manuelle du fournisseur de paiement pour le MVP
 * 
 * Mode de fonctionnement:
 * - Le vendeur effectue un paiement hors-ligne (Mobile Money, espèces, etc.)
 * - L'administrateur confirme manuellement le paiement dans l'interface admin
 * - Les crédits sont crédités uniquement après confirmation admin
 * 
 * Cette implémentation sert de placeholder en attendant le choix d'un agrégateur
 * de paiement réel (Flooz, T-Money, CinetPay, FedaPay, etc.)
 */
export class ManualPaymentProvider implements PaymentProviderInterface {
  async initiatePayment(
    amount: number,
    userId: string,
    packId: string,
    _context?: {
      description?: string
      email?: string
      name?: string
      phone?: string
      callbackUrl?: string
    }
  ): Promise<{
    success: boolean
    transactionRef?: string
    paymentUrl?: string
    error?: string
  }> {
    // En mode manuel, on génère simplement une référence de transaction
    // Le paiement effectif se fait hors-ligne
    const transactionRef = `MANUAL-${Date.now()}-${userId.slice(0, 8)}`
    
    return {
      success: true,
      transactionRef,
      // Pas d'URL de paiement en mode manuel
    }
  }

  async handleWebhook(payload: unknown): Promise<{
    success: boolean
    transactionRef?: string
    status?: 'CONFIRME' | 'ECHOUE'
    error?: string
  }> {
    // En mode manuel, il n'y a pas de webhook automatique
    // La confirmation se fait via l'interface admin
    return {
      success: false,
      error: 'Webhook non supporté en mode manuel. Utilisez l\'interface admin pour confirmer les paiements.'
    }
  }

  async checkPaymentStatus(transactionRef: string): Promise<{
    success: boolean
    status?: 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE'
    error?: string
  }> {
    // En mode manuel, le statut est géré via la base de données
    // Cette méthode n'est pas utilisée en mode manuel
    return {
      success: false,
      error: 'Vérification automatique non supportée en mode manuel'
    }
  }
}