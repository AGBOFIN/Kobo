'use client'

import { useState, useEffect } from 'react'
import { pricingCalculatorSchema, type PricingCalculatorInput } from '@/lib/validations/pricing'

interface PricingCalculatorProps {
  onCalculate: (input: PricingCalculatorInput) => void
}

const defaultForm: PricingCalculatorInput = {
  productName: '',
  purchasePrice: 0,
  transportCost: 0,
  packagingCost: 0,
  advertisingCost: 0,
  otherCosts: 0,
  profitPercentage: 30,
}

export default function PricingCalculator({ onCalculate }: PricingCalculatorProps) {
  const [formData, setFormData] = useState<PricingCalculatorInput>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const validated = pricingCalculatorSchema.safeParse(formData)
    if (validated.success) {
      onCalculate(validated.data)
    }
  }, [formData, onCalculate])

  const handleChange = (field: keyof PricingCalculatorInput, value: string | number) => {
    const numValue =
      typeof value === 'string'
        ? field === 'productName'
          ? value
          : parseFloat(value) || 0
        : value
    setFormData(prev => ({ ...prev, [field]: numValue }))

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validated = pricingCalculatorSchema.safeParse(formData)

    if (!validated.success) {
      const fieldErrors: Record<string, string> = {}
      validated.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[String(err.path[0])] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    onCalculate(validated.data)
  }

  const costs = [
    { field: 'purchasePrice' as const, label: "Prix d'achat", placeholder: '5000', required: true },
    { field: 'transportCost' as const, label: 'Transport', placeholder: '1000', required: false },
    { field: 'packagingCost' as const, label: 'Emballage', placeholder: '300', required: false },
    { field: 'advertisingCost' as const, label: 'Publicité', placeholder: '700', required: false },
    { field: 'otherCosts' as const, label: 'Autres frais', placeholder: '500', required: false },
  ]

  return (
    <div className="card card-pad">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="productName" className="label">
            Nom du produit *
          </label>
          <input
            type="text"
            id="productName"
            value={formData.productName}
            onChange={(e) => handleChange('productName', e.target.value)}
            className={`input ${errors.productName ? 'input-error' : ''}`}
            placeholder="Ex : Chemise en coton"
          />
          {errors.productName && (
            <p className="mt-1 text-sm text-red-600">{errors.productName}</p>
          )}
        </div>

        <div>
          <label htmlFor="purchasePrice" className="label">
            Prix d’achat (FCFA) *
          </label>
          <input
            type="number"
            id="purchasePrice"
            value={formData.purchasePrice || ''}
            onChange={(e) => handleChange('purchasePrice', e.target.value)}
            className={`input ${errors.purchasePrice ? 'input-error' : ''}`}
            placeholder="5000"
            min="0"
            inputMode="numeric"
          />
          {errors.purchasePrice && (
            <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {costs.slice(1).map((cost) => (
            <div key={cost.field}>
              <label htmlFor={cost.field} className="label">
                {cost.label} (FCFA)
              </label>
              <input
                type="number"
                id={cost.field}
                value={formData[cost.field] || ''}
                onChange={(e) => handleChange(cost.field, e.target.value)}
                className="input"
                placeholder={cost.placeholder}
                min="0"
                inputMode="numeric"
              />
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="profitPercentage" className="label mb-0">
              Bénéfice souhaité *
            </label>
            <span className="text-sm font-bold text-primary-600">
              {formData.profitPercentage}%
            </span>
          </div>
          <input
            type="range"
            id="profitPercentage"
            value={formData.profitPercentage}
            onChange={(e) => handleChange('profitPercentage', e.target.value)}
            min="0"
            max="100"
            step="5"
            className="mt-2 w-full accent-primary-600"
          />
          <div className="mt-1 flex justify-between text-xs text-stone-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          {errors.profitPercentage && (
            <p className="mt-1 text-sm text-red-600">{errors.profitPercentage}</p>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-full">
          Calculer le prix
        </button>
      </form>
    </div>
  )
}