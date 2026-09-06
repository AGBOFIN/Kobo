'use client'

import { useEffect, useState } from 'react'

/**
 * Journal d'audit (admin) — actions sensibles tracées : activation/désactivation
 * de comptes, modifications de packs, confirmations/rejets de paiements manuels.
 */
export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [action, setAction] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async (a = '') => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/audit-log${a ? `?action=${encodeURIComponent(a)}` : ''}`)
      const data = await res.json()
      if (res.ok) setLogs(data.logs || [])
      else setError(data.error || 'Erreur de chargement')
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const actionLabels: Record<string, { label: string; badge: string }> = {
    ADMIN_ACTIVATE_USER: { label: 'Compte activé', badge: 'badge-green' },
    ADMIN_DEACTIVATE_USER: { label: 'Compte désactivé', badge: 'badge-red' },
    ADMIN_UPDATE_PACK: { label: 'Pack modifié', badge: 'badge-yellow' },
    ADMIN_CONFIRM_PURCHASE: { label: 'Paiement confirmé', badge: 'badge-green' },
    ADMIN_REJECT_PURCHASE: { label: 'Paiement rejeté', badge: 'badge-red' },
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          Journal d'audit
        </h1>
        <p className="mt-1 text-stone-600">
          Toutes les actions sensibles effectuées depuis l'espace admin
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <select
          value={action}
          onChange={e => {
            setAction(e.target.value)
            fetchLogs(e.target.value)
          }}
          className="input sm:w-64"
        >
          <option value="">Toutes les actions</option>
          {Object.entries(actionLabels).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card card-pad text-center text-stone-500">Chargement…</div>
      ) : logs.length === 0 ? (
        <div className="card card-pad flex flex-col items-center py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-100 text-stone-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <p className="mt-3 font-medium text-stone-900">Aucune action journalisée</p>
          <p className="mt-1 text-sm text-stone-500">
            Les actions admin (activation de compte, modification de pack,
            validation de paiement) apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => {
            const meta = actionLabels[log.action]
            return (
              <div key={log.id} className="card card-pad">
                <button
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${meta?.badge || 'badge-yellow'}`}>
                        {meta?.label || log.action}
                      </span>
                      <span className="text-xs text-stone-400">
                        {log.entityType}
                        {log.entityId ? ` · ${log.entityId.slice(0, 12)}…` : ''}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-stone-700">
                      Par {log.userId ? `admin ${log.userId.slice(0, 12)}…` : 'système'}
                    </p>
                  </div>
                  <span className="mt-1 shrink-0 text-stone-400">
                    {expandedId === log.id ? '▲' : '▼'}
                  </span>
                </button>

                {expandedId === log.id && log.details && (
                  <div className="mt-3 border-t border-stone-100 pt-3">
                    <p className="text-xs font-semibold text-stone-500">Détails</p>
                    <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-stone-50 p-3 font-mono text-xs text-stone-700">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(log.details), null, 2)
                        } catch {
                          return log.details
                        }
                      })()}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
