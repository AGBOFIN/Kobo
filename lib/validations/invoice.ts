import { z } from 'zod'

/**
 * Schéma de validation pour un élément de facture
 */
export const invoiceItemSchema = z.object({
  designation: z.string().min(1, 'La désignation est requise'),
  quantity: z.number().min(1, 'La quantité doit être au moins 1'),
  unitPrice: z.number().min(0, 'Le prix unitaire doit être positif'),
})

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>

/**
 * Schéma de validation pour la création de facture
 */
export const createInvoiceSchema = z.object({
  clientName: z.string().min(1, 'Le nom du client est requis'),
  clientPhone: z.string().min(8, 'Le numéro de téléphone est invalide'),
  items: z.array(invoiceItemSchema).min(1, 'Au moins un produit est requis'),
  discount: z.number().min(0, 'La réduction doit être positive').default(0),
  discountPercent: z.number().min(0).max(100).optional(),
  deliveryFee: z.number().min(0, 'Les frais de livraison doivent être positifs').default(0),
  amountPaid: z.number().min(0, 'Le montant payé doit être positif').default(0),
  paymentMode: z.enum(['ESPECES', 'MOBILE_MONEY', 'VIREMENT', 'AUTRE']).optional(),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

/**
 * Résultat du calcul de facture
 */
export interface InvoiceCalculationResult {
  subtotal: number
  discount: number
  discountPercent?: number
  deliveryFee: number
  totalAmount: number
  amountPaid: number
  remainingAmount: number
  status: 'PAYE' | 'PARTIEL' | 'NON_PAYE'
}

/**
 * Fonction de calcul de facture
 */
export function calculateInvoice(input: CreateInvoiceInput): InvoiceCalculationResult {
  const { items, discount, discountPercent, deliveryFee, amountPaid } = input

  // Calcul du sous-total (somme des lignes)
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)

  // Calcul de la réduction
  let finalDiscount = discount
  if (discountPercent !== undefined && discountPercent > 0) {
    finalDiscount = subtotal * (discountPercent / 100)
  }

  // Calcul du montant total
  const totalAmount = subtotal - finalDiscount + deliveryFee

  // Calcul du reste à payer
  const remainingAmount = totalAmount - amountPaid

  // Détermination du statut
  let status: 'PAYE' | 'PARTIEL' | 'NON_PAYE'
  if (remainingAmount <= 0) {
    status = 'PAYE'
  } else if (amountPaid > 0) {
    status = 'PARTIEL'
  } else {
    status = 'NON_PAYE'
  }

  return {
    subtotal,
    discount: finalDiscount,
    discountPercent,
    deliveryFee,
    totalAmount,
    amountPaid,
    remainingAmount: Math.max(0, remainingAmount),
    status,
  }
}