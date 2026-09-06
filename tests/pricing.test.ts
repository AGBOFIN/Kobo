import { describe, it, expect } from '@jest/globals'
import { calculatePricing, type PricingCalculatorInput } from '../lib/validations/pricing'

describe('Pricing Calculator', () => {
  it('should calculate correctly with the reference example', () => {
    const input: PricingCalculatorInput = {
      productName: 'Produit test',
      purchasePrice: 5000,
      transportCost: 1000,
      packagingCost: 300,
      advertisingCost: 700,
      otherCosts: 500,
      profitPercentage: 30,
    }

    const result = calculatePricing(input)

    expect(result.totalCosts).toBe(7500)
    expect(result.profitAmount).toBe(2250)
    expect(result.recommendedPrice).toBe(9750)
    expect(result.profitMarginFcfa).toBe(2250)
    expect(result.profitMarginPercent).toBe(30)
  })

  it('should handle zero costs correctly', () => {
    const input: PricingCalculatorInput = {
      productName: 'Produit simple',
      purchasePrice: 1000,
      transportCost: 0,
      packagingCost: 0,
      advertisingCost: 0,
      otherCosts: 0,
      profitPercentage: 20,
    }

    const result = calculatePricing(input)

    expect(result.totalCosts).toBe(1000)
    expect(result.profitAmount).toBe(200)
    expect(result.recommendedPrice).toBe(1200)
  })

  it('should handle 0% profit correctly', () => {
    const input: PricingCalculatorInput = {
      productName: 'Produit sans bénéfice',
      purchasePrice: 5000,
      transportCost: 1000,
      packagingCost: 300,
      advertisingCost: 700,
      otherCosts: 500,
      profitPercentage: 0,
    }

    const result = calculatePricing(input)

    expect(result.totalCosts).toBe(7500)
    expect(result.profitAmount).toBe(0)
    expect(result.recommendedPrice).toBe(7500)
  })

  it('should handle high profit percentage correctly', () => {
    const input: PricingCalculatorInput = {
      productName: 'Produit luxe',
      purchasePrice: 10000,
      transportCost: 2000,
      packagingCost: 1000,
      advertisingCost: 3000,
      otherCosts: 1000,
      profitPercentage: 100,
    }

    const result = calculatePricing(input)

    expect(result.totalCosts).toBe(17000)
    expect(result.profitAmount).toBe(17000)
    expect(result.recommendedPrice).toBe(34000)
  })

  it('should calculate unit cost correctly for single product', () => {
    const input: PricingCalculatorInput = {
      productName: 'Produit unique',
      purchasePrice: 5000,
      transportCost: 1000,
      packagingCost: 300,
      advertisingCost: 700,
      otherCosts: 500,
      profitPercentage: 30,
    }

    const result = calculatePricing(input)

    expect(result.unitCost).toBe(result.totalCosts)
  })
})