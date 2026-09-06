'use client'

import { useEffect, useState } from 'react'

/**
 * Packs de crédits (admin) — gestion du prix, du nombre de crédits, de
 * l'activation et du produit Chariow associé (brief §5.9).
 *
 * Rappel : le prix réellement encaissé est celui du produit Chariow
 * (chariowProductId). Tenir les deux alignés pour le rapprochement comptable.
 */
export default function AdminCreditPacksPage() {
  const [packs, setPacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPacks()
  }, [])

  const fetchPacks = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/credit-packs')
      const data = await res.json()
      if (res.ok) setPacks(data.packs || [])
      else setError(data.error || 'Erreur de chargement')
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const updatePack = async (pack: any, updates: Record<string, unknown>) => {
    setBusyId(pack.id)
    setMessage('')
    setError('')
    try {
      const res = await fetch(`/api/admin/credit-packs?id=${pack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (res.ok) {
        setPacks(prev => prev.map(p => (p.id === pack.id ? data.pack : p)))
        setMessage('Pack mis à jour.')
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      setError('Erreur lors de la mise à jour')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          Packs de crédits
        </h1>
        <p className="mt-1 text-stone-600">
          Prix, contenu et produit Chariow associé à chaque pack
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card card-pad text-center text-stone-500">Chargement…</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {packs.map(pack => (
            <div key={pack.id} className="card card-pad">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-stone-900">{pack.name}</h3>
                <button
                  onClick={() => updatePack(pack, { active: !pack.active })}
                  disabled={busyId === pack.id}
                  className={`badge cursor-pointer ${
                    pack.active ? 'badge-green' : 'badge-red'
                  }`}
                >
                  {pack.active ? 'Actif' : 'Inactif'}
                </button>
              </div>

              <label className="mt-4 block text-sm font-medium text-stone-700">
                Prix (FCFA)
                <input
                  type="number"
                  min={1}
                  defaultValue={pack.price}
                  onBlur={e => {
                    const value = parseInt(e.target.value, 10)
                    if (value && value !== pack.price) updatePack(pack, { price: value })
                  }}
                  className="input mt-1"
                />
              </label>

              <label className="mt-3 block text-sm font-medium text-stone-700">
                Crédits inclus
                <input
                  type="number"
                  min={1}
                  defaultValue={pack.creditsCount}
                  onBlur={e => {
                    const value = parseInt(e.target.value, 10)
                    if (value && value !== pack.creditsCount)
                      updatePack(pack, { creditsCount: value })
                  }}
                  className="input mt-1"
                />
              </label>

              <label className="mt-3 block text-sm font-medium text-stone-700">
                Produit Chariow (ID prd_…)
                <input
                  type="text"
                  defaultValue={pack.chariowProductId || ''}
                  placeholder="prd_abc123"
                  onBlur={e => {
                    const value = e.target.value.trim() || null
                    if (value !== (pack.chariowProductId || null))
                      updatePack(pack, { chariowProductId: value })
                  }}
                  className="input mt-1 font-mono text-sm"
                />
              </label>

              <p className="mt-3 text-xs text-stone-500">
                {Math.round(pack.price / pack.creditsCount)} FCFA par facture
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
