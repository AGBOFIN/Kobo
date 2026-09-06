import { PaymentProviderInterface } from './interface'
import { ManualPaymentProvider } from './manual-provider'
import { ChariowProvider } from './chariow-provider'

/**
 * Sélection du fournisseur de paiement actif :
 *  - Chariow dès que CHARIOW_API_KEY est configurée (paiement en ligne via
 *    les produits Chariow associés aux packs)
 *  - sinon repli sur le paiement manuel (confirmation admin) pour le développement
 */
export function isChariowEnabled(): boolean {
  return Boolean(process.env.CHARIOW_API_KEY)
}

export function getPaymentProvider(): {
  provider: PaymentProviderInterface
  name: string
} {
  if (isChariowEnabled()) {
    return { provider: new ChariowProvider(), name: 'CHARIOW' }
  }
  return { provider: new ManualPaymentProvider(), name: 'MANUAL' }
}
