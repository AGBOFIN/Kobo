'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

function StatusBadge({ status }: { status: string }) {
  if (status === 'PAYE') return <span className="badge badge-green">Payé</span>
  if (status === 'PARTIEL') return <span className="badge badge-yellow">Partiel</span>
  return <span className="badge badge-red">Non payé</span>
}

function PaymentModeLabel({ mode }: { mode?: string }) {
  if (!mode) return null
  const labels: Record<string, string> = {
    ESPECES: 'Espèces',
    MOBILE_MONEY: 'Mobile Money',
    VIREMENT: 'Virement',
    AUTRE: 'Autre',
  }
  return <>{labels[mode] || mode}</>
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      setInvoice(data.invoice)
      setShareUrl(data.shareUrl || null)
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!invoice || downloading) return
    setDownloading(true)
    setDownloadMessage(null)

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`)

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        if (response.status === 402) {
          setDownloadMessage({
            type: 'error',
            text: 'Crédits insuffisants. Achetez un pack pour générer le PDF.',
          })
        } else {
          setDownloadMessage({
            type: 'error',
            text: data?.error || 'Une erreur est survenue lors de la génération du PDF',
          })
        }
        return
      }

      // Téléchargement du fichier
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      // Le PDF vient d'être généré (1 crédit) : on rafraîchit pour
      // récupérer le lien de partage à insérer dans le message WhatsApp
      const refetch = await fetch(`/api/invoices/${invoice.id}`)
      const data = await refetch.json()
      if (refetch.ok && data.invoice) {
        setInvoice(data.invoice)
        setShareUrl(data.shareUrl || null)
        setDownloadMessage({
          type: 'success',
          text: data.shareUrl
            ? 'PDF généré. Le lien de téléchargement est inclus dans le message WhatsApp.'
            : 'PDF téléchargé.',
        })
      }
    } catch (error) {
      setDownloadMessage({ type: 'error', text: 'Une erreur est survenue' })
    } finally {
      setDownloading(false)
    }
  }

  /**
   * Impression : récupère le PDF (le génère au besoin — même logique de
   * crédit que le téléchargement) puis ouvre la boîte d'impression du
   * navigateur sur l'objet PDF (pas la page HTML).
   */
  const handlePrint = async () => {
    if (!invoice || printing) return
    setPrinting(true)
    setDownloadMessage(null)

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`)

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        if (response.status === 402) {
          setDownloadMessage({
            type: 'error',
            text: 'Crédits insuffisants. Achetez un pack pour générer le PDF.',
          })
        } else {
          setDownloadMessage({
            type: 'error',
            text: data?.error || "Erreur lors de la préparation de l'impression",
          })
        }
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank')
      if (win) {
        win.addEventListener('load', () => win.print())
        // Filet de sécurité : certains navigateurs ne déclenchent pas load sur blob:
        setTimeout(() => win.print(), 800)
      } else {
        setDownloadMessage({
          type: 'error',
          text: "Autorisez les pop-ups pour imprimer, ou téléchargez le PDF.",
        })
      }
      // Révoque plus tard : le temps pour l'aperçu de charger
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setDownloadMessage({ type: 'error', text: 'Une erreur est survenue' })
    } finally {
      setPrinting(false)
    }
  }

  const generateWhatsAppLink = () => {
    if (!invoice) return '#'

    const phone = invoice.clientPhone.replace(/[^0-9]/g, '')
    let message = `Bonjour ${invoice.clientName},\n\nVoici votre facture n°${invoice.invoiceNumber}.\n\nMontant total : ${invoice.totalAmount.toLocaleString('fr-FR')} FCFA.\n\nMerci pour votre confiance.`

    if (shareUrl) {
      const pdfLink = `${window.location.origin}${shareUrl}`
      message += `\n\nTéléchargez votre facture : ${pdfLink}`
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-600">Chargement...</div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'Facture non trouvée'}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3 md:mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
              Facture {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-stone-600">
            Client : {invoice.clientName} · {invoice.clientPhone}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm"
        >
          ← Retour
        </button>
      </div>

      {/* ===== Document facture ===== */}
      <div className="card card-pad">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-stone-200/80 pb-6">
          <div>
            <h3 className="text-sm font-semibold text-stone-500">Vendeur</h3>
            <p className="mt-1 font-semibold text-stone-900">
              {invoice.user.companyName || invoice.user.name}
            </p>
            {invoice.user.name && (
              <p className="text-sm text-stone-600">{invoice.user.name}</p>
            )}
            {invoice.user.phone && (
              <p className="text-sm text-stone-600">{invoice.user.phone}</p>
            )}
            {invoice.user.address && (
              <p className="text-sm text-stone-600">{invoice.user.address}</p>
            )}
          </div>
          <div className="text-left sm:text-right">
            <h3 className="text-sm font-semibold text-stone-500">Facturé à</h3>
            <p className="mt-1 font-semibold text-stone-900">{invoice.clientName}</p>
            <p className="text-sm text-stone-600">{invoice.clientPhone}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm">
          <span className="text-stone-600">
            Date :{' '}
            <span className="font-medium text-stone-900">
              {new Date(invoice.date).toLocaleDateString('fr-FR')}
            </span>
          </span>
          <span className="text-stone-600">
            Facture n° :{' '}
            <span className="font-medium text-stone-900">{invoice.invoiceNumber}</span>
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                <th className="py-2.5 pr-3 font-semibold">Désignation</th>
                <th className="py-2.5 px-3 text-right font-semibold">Qté</th>
                <th className="py-2.5 px-3 text-right font-semibold">P.U.</th>
                <th className="py-2.5 pl-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {invoice.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3 pr-3 font-medium text-stone-900">{item.designation}</td>
                  <td className="py-3 px-3 text-right text-stone-600">{item.quantity}</td>
                  <td className="py-3 px-3 text-right text-stone-600">
                    {item.unitPrice.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="py-3 pl-3 text-right font-semibold text-stone-900">
                    {item.lineTotal.toLocaleString('fr-FR')} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-2.5 border-t border-stone-200/80 pt-5 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Sous-total</span>
            <span className="font-medium text-stone-900">
              {invoice.subtotal.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-600">Réduction</span>
              <span className="font-medium text-red-600">
                -{invoice.discount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          )}
          {invoice.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span className="text-stone-600">Frais de livraison</span>
              <span className="font-medium text-stone-900">
                {invoice.deliveryFee.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-primary-600 px-4 py-3 text-white">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold">
              {invoice.totalAmount.toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-stone-600">Montant payé</span>
            <span className="font-medium text-emerald-600">
              {invoice.amountPaid.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Reste à payer</span>
            <span className="font-semibold text-stone-900">
              {invoice.remainingAmount.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Mode de paiement</span>
            <span className="font-medium text-stone-900">
              <PaymentModeLabel mode={invoice.paymentMode} />
            </span>
          </div>
        </div>
      </div>

      {/* ===== Actions ===== */}
      <div className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={generateWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success btn-lg w-full"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Envoyer sur WhatsApp
          </a>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn btn-primary btn-lg w-full"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading
              ? 'Génération du PDF...'
              : shareUrl
                ? 'Télécharger le PDF'
                : 'Télécharger le PDF (1 crédit)'}
          </button>
          <button
            onClick={handlePrint}
            disabled={printing}
            className="btn btn-secondary btn-lg w-full"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {printing ? 'Préparation…' : 'Imprimer'}
          </button>
        </div>

        {downloadMessage && (
          <div
            className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
              downloadMessage.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {downloadMessage.text}
          </div>
        )}

        {!shareUrl && !downloadMessage && (
          <p className="mt-3 text-center text-xs text-stone-500">
            La prévisualisation est gratuite. Le PDF est généré au premier
            téléchargement (1 crédit) et son lien de partage est ajouté au message WhatsApp.
          </p>
        )}
      </div>
    </div>
  )
}