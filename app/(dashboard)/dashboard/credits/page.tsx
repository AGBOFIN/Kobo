'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CreditsPage() {
  const [packs, setPacks] = useState<any[]>([])
  const [balance, setBalance] = useState(0)
  const [paymentMode, setPaymentMode] = useState<'CHARIOW' | 'MANUAL'>('MANUAL')
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [packsRes, balanceRes, modeRes] = await Promise.all([
        fetch('/api/credits/packs'),
        fetch('/api/credits/balance'),
        fetch('/api/credits/payment-mode'),
      ])

      const packsData = await packsRes.json()
      const balanceData = await balanceRes.json()
      const modeData = await modeRes.json().catch(() => null)

      setPacks(packsData.packs || [])
      setBalance(balanceData.balance || 0)
      if (modeData?.mode) setPaymentMode(modeData.mode)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packId: string) => {
    setPurchasing(packId)
    setMessage('')

    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Une erreur est survenue')
        return
      }

      // Chariow : redirection vers le checkout sécurisé
      if (data.paymentUrl) {
        setMessage('Redirection vers le paiement sécurisé...')
        setTimeout(() => {
          window.location.href = data.paymentUrl
        }, 800)
        return
      }

      // Mode manuel : confirmation par l'administrateur
      setMessage('Achat initié avec succès. Votre paiement sera confirmé par l\'administrateur.')
      fetchData()
    } catch (error) {
      setMessage('Une erreur est survenue')
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-600">Chargement...</div>
      </div>
    )
  }

  const featuredPack = packs[1]?.id

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          Acheter des crédits
        </h1>
        <p className="mt-1 text-stone-600">1 crédit = 1 facture générée</p>
      </div>

      {/* ===== Solde ===== */}
      <div className="mb-8 flex items-center justify-between rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-md shadow-emerald-600/20">
        <div>
          <p className="text-sm text-emerald-50/90">Votre solde actuel</p>
          <p className="mt-1 text-3xl font-bold">
            {balance} crédit{balance > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/dashboard"
          className="btn btn-sm bg-white text-emerald-700 hover:bg-emerald-50"
        >
          ← Dashboard
        </Link>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            message.includes('succès')
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* ===== Packs ===== */}
      <div className="grid gap-4 sm:grid-cols-3 sm:items-stretch">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className={`card card-pad relative flex flex-col ${
              pack.id === featuredPack
                ? 'border-primary-300 ring-2 ring-primary-500/20'
                : ''
            }`}
          >
            {pack.id === featuredPack && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-green">
                Populaire
              </span>
            )}
            <h3 className="font-semibold text-stone-900">{pack.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-stone-900">
                {pack.price.toLocaleString('fr-FR')}
              </span>
              <span className="text-sm font-medium text-stone-500">FCFA</span>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              {pack.creditsCount} crédits ·{' '}
              {Math.round(pack.price / pack.creditsCount)} FCFA/facture
            </p>
            <button
              onClick={() => handlePurchase(pack.id)}
              disabled={purchasing === pack.id}
              className={`btn mt-5 w-full ${
                pack.id === featuredPack ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {purchasing === pack.id ? 'Traitement...' : 'Acheter'}
            </button>
          </div>
        ))}
      </div>

      {/* ===== Info paiement ===== */}
      {paymentMode === 'MANUAL' ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h4 className="font-semibold text-amber-900">Mode de paiement manuel</h4>
              <p className="mt-1 text-sm text-amber-800">
                Pour ce lancement, le paiement se fait via Mobile Money ou autre moyen.
                Après votre paiement, l’administrateur confirme la transaction et vos
                crédits sont ajoutés automatiquement.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h4 className="font-semibold text-emerald-900">Paiement en ligne sécurisé</h4>
              <p className="mt-1 text-sm text-emerald-800">
                Le paiement se fait par Mobile Money ou carte bancaire via notre
                partenaire Chariow. Après paiement, vos crédits sont ajoutés
                automatiquement à votre solde.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}