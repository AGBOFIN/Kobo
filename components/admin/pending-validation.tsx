'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PendingPurchase = {
  id: string
  amount: number
  creditsPurchased: number
  createdAt: string
  user: { name: string; email: string }
  pack: { name: string }
}

/**
 * Paiements hors-ligne en attente — confirmation/rejet par un admin.
 * L'achat Chariow n'apparaît jamais ici (confirmé automatiquement par webhook).
 */
export function PendingValidation({ purchases }: { purchases: PendingPurchase[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const act = async (purchase: PendingPurchase, action: 'confirm' | 'reject') => {
    setBusyId(purchase.id)
    setError('')
    try {
      const res = await fetch(`/api/admin/purchases?id=${purchase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (res.ok) {
        router.refresh()
      } else {
        setError(data.error || "Erreur lors de la validation")
      }
    } catch {
      setError('Erreur lors de la validation')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                {['Utilisateur', 'Pack', 'Montant', 'Date', 'Actions'].map(header => (
                  <th
                    key={header}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {purchases.map(purchase => (
                <tr key={purchase.id}>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="text-sm font-medium text-stone-900">
                      {purchase.user.name}
                    </div>
                    <div className="text-sm text-stone-500">{purchase.user.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="text-sm font-medium text-stone-900">
                      {purchase.pack.name}
                    </div>
                    <div className="text-sm text-stone-500">
                      {purchase.creditsPurchased} crédits
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-stone-900">
                    {purchase.amount.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-500">
                    {new Date(purchase.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(purchase, 'confirm')}
                        disabled={busyId === purchase.id}
                        className="btn btn-success btn-sm"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => act(purchase, 'reject')}
                        disabled={busyId === purchase.id}
                        className="btn btn-danger btn-sm"
                      >
                        Rejeter
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
