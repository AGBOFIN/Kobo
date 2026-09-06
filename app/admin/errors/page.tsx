'use client'

import { useEffect, useState } from 'react'

/**
 * Journal des erreurs (admin) — erreurs applicatives centralisées, sans
 * données sensibles en clair (brief §16).
 */
export default function AdminErrorsPage() {
  const [errors, setErrors] = useState<any[]>([])
  const [type, setType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchErrors()
  }, [])

  const fetchErrors = async (t = '') => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/errors${t ? `?type=${encodeURIComponent(t)}` : ''}`)
      const data = await res.json()
      if (res.ok) setErrors(data.errors || [])
      else setError(data.error || 'Erreur de chargement')
    } catch {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const errorTypes = [
    'AUTH_LOGIN_FAILED',
    'AUTH_LOGIN_BLOCKED',
    'AUTH_FORGOT_PASSWORD_ERROR',
    'PAYMENT_INIT_FAILED',
    'PAYMENT_PURCHASE_EXCEPTION',
    'WEBHOOK_PROCESSING_ERROR',
    'ADMIN_ACCESS_DENIED',
    'ADMIN_API_ERROR',
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          Erreurs applicatives
        </h1>
        <p className="mt-1 text-stone-600">
          Journal centralisé — les secrets ne sont jamais journalisés
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <select
          value={type}
          onChange={e => {
            setType(e.target.value)
            fetchErrors(e.target.value)
          }}
          className="input sm:w-72"
        >
          <option value="">Tous les types</option>
          {errorTypes.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card card-pad text-center text-stone-500">Chargement…</div>
      ) : errors.length === 0 ? (
        <div className="card card-pad flex flex-col items-center py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-primary-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <p className="mt-3 font-medium text-stone-900">Aucune erreur journalisée</p>
          <p className="mt-1 text-sm text-stone-500">
            Les erreurs applicatives apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {errors.map(entry => (
            <div key={entry.id} className="card card-pad">
              <button
                onClick={() =>
                  setExpandedId(expandedId === entry.id ? null : entry.id)
                }
                className="flex w-full items-start justify-between gap-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge-red font-mono text-xs">
                      {entry.errorType}
                    </span>
                    <span className="text-xs text-stone-400">
                      {new Date(entry.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm text-stone-800">
                    {entry.message}
                  </p>
                </div>
                <span className="mt-1 shrink-0 text-stone-400">
                  {expandedId === entry.id ? '▲' : '▼'}
                </span>
              </button>

              {expandedId === entry.id && (
                <div className="mt-3 space-y-2 border-t border-stone-100 pt-3 text-xs">
                  {entry.context && (
                    <div>
                      <p className="font-semibold text-stone-500">Contexte</p>
                      <pre className="mt-1 overflow-x-auto rounded-lg bg-stone-50 p-3 font-mono text-stone-700">
                        {entry.context}
                      </pre>
                    </div>
                  )}
                  {entry.stackTrace && (
                    <div>
                      <p className="font-semibold text-stone-500">Stack</p>
                      <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-stone-50 p-3 font-mono text-stone-700">
                        {entry.stackTrace}
                      </pre>
                    </div>
                  )}
                  {(entry.ipAddress || entry.userAgent) && (
                    <p className="text-stone-400">
                      {entry.ipAddress && <>IP : {entry.ipAddress} · </>}
                      {entry.userAgent}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
