'use client'

import { useEffect, useState } from 'react'

function StatusBadge({ status }: { status: string }) {
  if (status === 'PAYE') return <span className="badge badge-green">Payé</span>
  if (status === 'PARTIEL') return <span className="badge badge-yellow">Partiel</span>
  return <span className="badge badge-red">Non payé</span>
}

/**
 * Factures (admin) — toutes les factures de la plateforme, lecture seule.
 * (Brief §5.9 : liste des factures créées en lecture seule.)
 */
export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [totals, setTotals] = useState<any>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async (q = '', s = '') => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (s) params.set('status', s)
      const res = await fetch(`/api/admin/invoices?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setInvoices(data.invoices || [])
        setTotals(data.totals)
      } else {
        setError(data.error || 'Erreur de chargement')
      }
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
          Factures
        </h1>
        <p className="mt-1 text-stone-600">
          Toutes les factures créées sur la plateforme (lecture seule)
        </p>
      </div>

      {totals && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="card card-pad">
            <p className="text-sm text-stone-500">Total facturé</p>
            <p className="mt-1 text-xl font-bold text-stone-900">
              {totals.totalAmount.toLocaleString('fr-FR')} F
            </p>
          </div>
          <div className="card card-pad">
            <p className="text-sm text-stone-500">Total payé</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              {totals.totalPaid.toLocaleString('fr-FR')} F
            </p>
          </div>
          <div className="card card-pad">
            <p className="text-sm text-stone-500">Reste à payer</p>
            <p className="mt-1 text-xl font-bold text-amber-600">
              {totals.totalRemaining.toLocaleString('fr-FR')} F
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={e => {
          e.preventDefault()
          fetchInvoices(query, status)
        }}
        className="mb-4 flex flex-wrap gap-2"
      >
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Client ou n° de facture…"
          className="input sm:max-w-xs"
        />
        <select
          value={status}
          onChange={e => {
            setStatus(e.target.value)
            fetchInvoices(query, e.target.value)
          }}
          className="input sm:w-44"
        >
          <option value="">Tous les statuts</option>
          <option value="PAYE">Payé</option>
          <option value="PARTIEL">Partiel</option>
          <option value="NON_PAYE">Non payé</option>
        </select>
        <button type="submit" className="btn btn-secondary">
          Rechercher
        </button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                {['N°', 'Vendeur', 'Client', 'Date', 'Total', 'Payé', 'Statut'].map(
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
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-stone-500">
                    Aucune facture trouvée.
                  </td>
                </tr>
              ) : (
                invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-stone-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-stone-900">
                        {invoice.user?.companyName || invoice.user?.name || '—'}
                      </div>
                      <div className="text-sm text-stone-500">{invoice.user?.email}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-700">
                      {invoice.clientName}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-stone-500">
                      {new Date(invoice.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-stone-900">
                      {invoice.totalAmount.toLocaleString('fr-FR')} F
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-emerald-700">
                      {invoice.amountPaid.toLocaleString('fr-FR')} F
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={invoice.status} />
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
