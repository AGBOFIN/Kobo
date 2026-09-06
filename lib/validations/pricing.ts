import { z } from 'zod'

/**
 * Schéma de validation pour le calculateur de prix
 */
export const pricingCalculatorSchema = z.object({
  productName: z.string().min(1, 'Le nom du produit est requis'),
  purchasePrice: z.number().min(0, 'Le prix d\'achat doit être positif'),
  transportCost: z.number().min(0, 'Les frais de transport doivent être positifs').default(0),
  packagingCost: z.number().min(0, 'Les frais d\'emballage doivent être positifs').default(0),
  advertisingCost: z.number().min(0, 'Les frais de publicité doivent être positifs').default(0),
  otherCosts: z.number().min(0, 'Les autres frais doivent être positifs').default(0),
  profitPercentage: z.number().min(0, 'Le pourcentage de bénéfice doit être positif').max(1000, 'Pourcentage trop élevé'),
})

export type PricingCalculatorInput = z.infer<typeof pricingCalculatorSchema>

/**
 * Résultat du calcul de prix
 */
export interface PricingCalculationResult {
  productName: string
  purchasePrice: number
  transportCost: number
  packagingCost: number
  advertisingCost: number
  otherCosts: number
  totalCosts: number
  unitCost: number
  profitPercentage: number
  profitAmount: number
  recommendedPrice: number
  profitMarginFcfa: number
  profitMarginPercent: number
}

/**
 * Fonction de calcul de prix de vente
 */
export function calculatePricing(input: PricingCalculatorInput): PricingCalculationResult {
  const {
    productName,
    purchasePrice,
    transportCost,
    packagingCost,
    advertisingCost,
    otherCosts,
    profitPercentage,
  } = input

  // Calcul des coûts totaux
  const totalCosts = purchasePrice + transportCost + packagingCost + advertisingCost + otherCosts

  // Calcul du bénéfice
  const profitAmount = totalCosts * (profitPercentage / 100)

  // Prix de vente conseillé
  const recommendedPrice = totalCosts + profitAmount

  // Marge bénéficiaire en FCFA et en %
  const profitMarginFcfa = profitAmount
  const profitMarginPercent = profitPercentage

  return {
    productName,
    purchasePrice,
    transportCost,
    packagingCost,
    advertisingCost,
    otherCosts,
    totalCosts,
    unitCost: totalCosts, // Pour un produit unique, coût de revient = coût total
    profitPercentage,
    profitAmount,
    recommendedPrice,
    profitMarginFcfa,
    profitMarginPercent,
  }
}