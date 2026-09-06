'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KoboLogo } from '@/components/brand/logo'
import { calculatePricing, type PricingCalculatorInput, type PricingCalculationResult } from '@/lib/validations/pricing'
import PricingCalculator from '@/components/calculateur/pricing-calculator'

export default function CalculateurPage() {
  const [result, setResult] = useState<PricingCalculationResult | null>(null)

  const handleCalculate = (input: PricingCalculatorInput) => {
    const calculation = calculatePricing(input)
    setResult(calculation)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <KoboLogo href="/" />
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost btn-md hidden sm:inline-flex">
              Se connecter
            </Link>
            <Link href="/register" className="btn btn-primary btn-md">
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="badge badge-green mb-4">
            Gratuit · Sans compte
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            Calculateur de prix de vente
          </h1>
          <p className="mt-3 text-lg text-stone-600">
            Entrez vos coûts, choisissez votre marge. Kobo fait le calcul pour vous.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <PricingCalculator onCalculate={handleCalculate} />

          <div className="lg:sticky lg:top-24">
            {result ? (
              <PricingResult result={result} />
            ) : (
              <div className="card card-pad flex flex-col items-center py-12 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-primary-600">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </span>
                <p className="mt-4 font-semibold text-stone-900">Votre résultat apparaîtra ici</p>
                <p className="mt-1 max-w-xs text-sm text-stone-500">
                  Remplissez le nom du produit et le prix d’achat pour voir votre prix de vente conseillé.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50/60 px-6 py-10 text-center">
          <h2 className="text-xl font-bold text-stone-900">Prêt à facturer ?</h2>
          <p className="mt-1 max-w-md text-stone-600">
            Créez un compte gratuit et transformez vos prix en factures professionnelles à envoyer sur WhatsApp.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg mt-5">
            Créer un compte gratuit
          </Link>
        </div>
      </main>
    </div>
  )
}

function PricingResult({ result }: { result: PricingCalculationResult }) {
  return (
    <div className="card card-pad overflow-hidden">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-md shadow-emerald-600/20">
        <p className="text-sm text-emerald-50/90">
          {result.productName || 'Votre produit'} — Prix de vente conseillé
        </p>
        <p className="mt-1 text-4xl font-bold tracking-tight">
          {result.recommendedPrice.toLocaleString('fr-FR')}{' '}
          <span className="text-lg font-semibold text-emerald-100">FCFA</span>
        </p>
        <p className="mt-2 text-sm text-emerald-50/90">
          Ce prix couvre tous vos frais + votre bénéfice de {result.profitPercentage}%
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-stone-50 p-4">
          <p className="text-xs font-medium text-stone-500">Coût total</p>
          <p className="mt-1 text-xl font-bold text-stone-900">
            {result.totalCosts.toLocaleString('fr-FR')} FCFA
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-600">Votre bénéfice</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">
            +{result.profitAmount.toLocaleString('fr-FR')} FCFA
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-stone-200/80 pt-4">
        <h3 className="text-sm font-semibold text-stone-900">Détail des coûts</h3>
        <div className="mt-3 space-y-2 text-sm">
          <CostRow label="Prix d'achat" value={result.purchasePrice} />
          <CostRow label="Transport" value={result.transportCost} />
          <CostRow label="Emballage" value={result.packagingCost} />
          <CostRow label="Publicité" value={result.advertisingCost} />
          <CostRow label="Autres frais" value={result.otherCosts} />
        </div>
      </div>
    </div>
  )
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-600">{label}</span>
      <span className="font-medium text-stone-900">{value.toLocaleString('fr-FR')} FCFA</span>
    </div>
  )
}