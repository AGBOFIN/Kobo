'use client'

import { useEffect, useState } from 'react'

const statusBadges: Record<string, string> = {
  CONFIRME: 'badge-green',
  EN_ATTENTE: 'badge-yellow',
  ECHOUE: 'badge-red',
}

const statusLabels: Record<string, string> = {
  CONFIRME: 'Confirmé',
  EN_ATTENTE: 'En attente',
  ECHOUE: 'Échoué',
}

/**
 * Achats de crédits (admin) — historique complet avec utilisateur, pack, montant,
 * statut et référence de transaction (rapprochement comptable — brief §5.9).
 */
export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async (s = '') => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/admin/purchases${s ? `?status=${s}` : ''}`
      )
      const data = await res.json()
      if (res.ok) setPurchases(data.purchases || [])
      else setError(data.error || 'Erreur de chargement')
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          Achats de crédits
        </h1>
        <p className="mt-1 text-stone-600">
          Historique complet, y compris la référence de transaction pour le
          rapprochement avec Chariow
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { value: '', label: 'Tous' },
          { value: 'CONFIRME', label: 'Confirmés' },
          { value: 'EN_ATTENTE', label: 'En attente' },
          { value: 'ECHOUE', label: 'Échoués' },
        ].map(option => (
          <button
            key={option.value}
            onClick={() => {
              setStatus(option.value)
              fetchPurchases(option.value)
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              status === option.value
                ? 'bg-primary-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                {['Utilisateur', 'Pack', 'Montant', 'Crédits', 'Statut', 'Référence', 'Date'].map(
                  header => (
                    <th
                      key={header}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-stone-500">
                    Chargement…
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-stone-500">
                    Aucun achat trouvé.
                  </td>
                </tr>
              ) : (
                purchases.map(purchase => (
                  <tr key={purchase.id}>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-stone-900">
                        {purchase.user?.name || '—'}
                      </div>
                      <div className="text-sm text-stone-500">{purchase.user?.email}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-700">
                      {purchase.pack?.name || '—'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-stone-900">
                      {purchase.amount.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-700">
                      {purchase.creditsPurchased}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`badge ${statusBadges[purchase.status] || 'badge-red'}`}
                      >
                        {statusLabels[purchase.status] || purchase.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-medium text-stone-700">
                        {purchase.provider}
                      </div>
                      {purchase.transactionRef && (
                        <div className="max-w-[180px] truncate font-mono text-xs text-stone-500">
                          {purchase.transactionRef}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-500">
                      {new Date(purchase.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
