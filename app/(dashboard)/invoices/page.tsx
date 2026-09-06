'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const PAGE_SIZE = 10

const statusFilters = [
  { value: '', label: 'Toutes' },
  { value: 'PAYE', label: 'Payées' },
  { value: 'PARTIEL', label: 'Partielles' },
  { value: 'NON_PAYE', label: 'Non payées' },
]

function StatusBadge({ status }: { status: string }) {
  if (status === 'PAYE') return <span className="badge badge-green">Payé</span>
  if (status === 'PARTIEL') return <span className="badge badge-yellow">Partiel</span>
  return <span className="badge badge-red">Non payé</span>
}

export default function InvoicesHistoryPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const fetchInvoices = useCallback(async (opts?: { page?: number }) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(opts?.page ?? page),
        limit: String(PAGE_SIZE),
      })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const response = await fetch(`/api/invoices?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      setInvoices(data.invoices || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(Math.max(1, data.pagination?.totalPages || 1))
    } catch (e) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }, [page, search, status, dateFrom, dateTo])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchDraft.trim())
  }

  const applyStatus = (value: string) => {
    setStatus(value)
    setPage(1)
  }

  const applyDates = () => {
    // Une seule borne renseignée est acceptée ; inversion corrigée ici
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setDateFrom(dateTo)
      setDateTo(dateFrom)
    }
    setPage(1)
  }

  const clearDates = () => {
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const downloadPdf = async (invoice: any) => {
    setDownloadingId(invoice.id)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`)
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        alert(data?.error || 'Impossible de générer le PDF')
        return
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Une erreur est survenue lors du téléchargement')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
            Mes factures
          </h1>
          <p className="mt-1 text-stone-600">
            {total > 0 ? `${total} facture${total > 1 ? 's' : ''} au total` : 'Aucune facture'}
          </p>
        </div>
        <Link href="/invoices/new" className="btn btn-primary btn-md">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle facture
        </Link>
      </div>

      {/* ===== Recherche & filtres ===== */}
      <div className="card card-pad mb-6 space-y-4">
        <form onSubmit={applySearch} className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="input pl-10"
              placeholder="Rechercher un client ou un n° de facture…"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-md shrink-0">
            Rechercher
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => applyStatus(filter.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                status === filter.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Filtre par date (§5.8) */}
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="dateFrom" className="mb-1 block text-xs font-medium text-stone-500">
              Du
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input sm:w-40"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="mb-1 block text-xs font-medium text-stone-500">
              Au
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="input sm:w-40"
            />
          </div>
          <button type="button" onClick={applyDates} className="btn btn-secondary btn-md">
            Filtrer
          </button>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={clearDates}
              className="text-sm font-medium text-stone-500 hover:text-stone-700"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ===== Liste ===== */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-stone-500">Chargement...</div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="card card-pad flex flex-col items-center py-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-stone-100 text-stone-400">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <p className="mt-4 font-medium text-stone-900">
            {search || status || dateFrom || dateTo
              ? 'Aucune facture ne correspond à votre recherche'
              : 'Aucune facture pour le moment'}
          </p>
          {!search && !status && !dateFrom && !dateTo && (
            <Link href="/invoices/new" className="btn btn-primary btn-md mt-5">
              Créer ma première facture
            </Link>
          )}
        </div>
      ) : (
        <>
          <ul className="card divide-y divide-stone-100 overflow-hidden">
            {invoices.map((invoice: any) => (
              <li key={invoice.id} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-stone-900">
                      {invoice.invoiceNumber}
                    </p>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-stone-500">
                    {invoice.clientName} · {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <p className="hidden shrink-0 font-semibold text-stone-900 sm:block">
                  {invoice.totalAmount.toLocaleString('fr-FR')}{' '}
                  <span className="text-xs font-medium text-stone-500">FCFA</span>
                </p>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => downloadPdf(invoice)}
                    disabled={downloadingId === invoice.id}
                    className="btn btn-ghost btn-sm !px-2.5"
                    title="Télécharger le PDF"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Ouvrir
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {/* ===== Pagination ===== */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-secondary btn-md"
              >
                ← Précédent
              </button>
              <span className="text-sm text-stone-600">
                Page {page} sur {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-secondary btn-md"
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}