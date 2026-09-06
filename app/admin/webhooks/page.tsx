'use client'

import { useEffect, useState } from 'react'

/**
 * Journal des webhooks (admin) — chaque réception Chariow (Pulse) ou autre,
 * avec statut de traitement et erreurs éventuelles (brief §5.9).
 */
export default function AdminWebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [provider, setProvider] = useState('')
  const [processed, setProcessed] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async (p = '', pr = '') => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (p) params.set('provider', p)
      if (pr) params.set('processed', pr)
      const res = await fetch(`/api/admin/webhooks?${params.toString()}`)
      const data = await res.json()
      if (res.ok) setWebhooks(data.webhooks || [])
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
          Webhooks reçus
        </h1>
        <p className="mt-1 text-stone-600">
          Journal des notifications Chariow (Pulses) et traitements associés
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={provider}
          onChange={e => {
            setProvider(e.target.value)
            fetchWebhooks(e.target.value, processed)
          }}
          className="input sm:w-44"
        >
          <option value="">Tous les fournisseurs</option>
          <option value="CHARIOW">Chariow</option>
          <option value="MANUAL">Manuel</option>
        </select>
        <select
          value={processed}
          onChange={e => {
            setProcessed(e.target.value)
            fetchWebhooks(provider, e.target.value)
          }}
          className="input sm:w-44"
        >
          <option value="">Tous les statuts</option>
          <option value="true">Traité</option>
          <option value="false">Non traité</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                {['Fournisseur', 'Événement', 'Traité', 'Détail', 'Reçu le'].map(
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
                  <td colSpan={5} className="px-5 py-10 text-center text-stone-500">
                    Chargement…
                  </td>
                </tr>
              ) : webhooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-stone-500">
                    Aucun webhook reçu pour le moment.
                  </td>
                </tr>
              ) : (
                webhooks.map(webhook => (
                  <tr key={webhook.id}>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="badge badge-green">{webhook.provider}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-sm text-stone-700">
                      {webhook.eventType}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {webhook.processed ? (
                        <span className="badge badge-green">Oui</span>
                      ) : (
                        <span className="badge badge-yellow">Non</span>
                      )}
                    </td>
                    <td className="max-w-[320px] px-5 py-4">
                      {webhook.error && (
                        <div className="text-sm font-medium text-red-600">
                          {webhook.error}
                        </div>
                      )}
                      <div className="truncate font-mono text-xs text-stone-400">
                        {webhook.payloadPreview}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-500">
                      {new Date(webhook.createdAt).toLocaleString('fr-FR')}
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
