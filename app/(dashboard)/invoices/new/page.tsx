'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateInvoice, type CreateInvoiceInput, type InvoiceItemInput } from '@/lib/validations/invoice'

export default function NewInvoicePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    discount: 0,
    discountPercent: 0,
    deliveryFee: 0,
    amountPaid: 0,
    paymentMode: 'ESPECES' as const,
  })
  const [items, setItems] = useState<InvoiceItemInput[]>([
    { designation: '', quantity: 1, unitPrice: 0 },
  ])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    setItems([...items, { designation: '', quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItemInput, value: string | number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'designation' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : value),
    }
    setItems(newItems)
  }

  const calculation = calculateInvoice({
    ...formData,
    items,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (items.some(item => !item.designation || item.quantity <= 0 || item.unitPrice <= 0)) {
      setError('Veuillez remplir correctement tous les produits')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
          ...calculation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      router.push(`/invoices/${data.invoice.id}`)
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const statusBadge =
    calculation.status === 'PAYE' ? (
      <span className="badge badge-green">Payé</span>
    ) : calculation.status === 'PARTIEL' ? (
      <span className="badge badge-yellow">Partiel</span>
    ) : (
      <span className="badge badge-red">Non payé</span>
    )

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          Nouvelle facture
        </h1>
        <p className="mt-1 text-stone-600">
          Remplissez les informations, la facture PDF est générée automatiquement.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ===== Client ===== */}
        <section className="card card-pad">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-primary-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-stone-900">Informations client</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="clientName" className="label">
                Nom du client *
              </label>
              <input
                type="text"
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="input"
                placeholder="Koffi Amégnignon"
                required
              />
            </div>

            <div>
              <label htmlFor="clientPhone" className="label">
                Téléphone *
              </label>
              <input
                type="tel"
                id="clientPhone"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                className="input"
                placeholder="+228 90 00 00 00"
                required
              />
            </div>
          </div>
        </section>

        {/* ===== Produits ===== */}
        <section className="card card-pad">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-primary-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
              <h2 className="text-lg font-semibold text-stone-900">Produits</h2>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="btn btn-primary btn-sm"
            >
              + Ajouter
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
                <div>
                  <label className="label">
                    Désignation
                  </label>
                  <input
                    type="text"
                    value={item.designation}
                    onChange={(e) => updateItem(index, 'designation', e.target.value)}
                    className="input"
                    placeholder="Chemise en coton"
                    required
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
                  <div>
                    <label className="label">Quantité</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="input"
                      min="1"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Prix unitaire (FCFA)</label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="label">Total</label>
                      <p className="flex h-11 items-center rounded-xl bg-white px-3.5 text-sm font-semibold text-stone-900">
                        {(item.quantity * item.unitPrice).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        aria-label="Supprimer le produit"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Paiement ===== */}
        <section className="card card-pad">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-primary-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h2m4 0h4M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-stone-900">Options de paiement</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="discount" className="label">
                Réduction (FCFA)
              </label>
              <input
                type="number"
                id="discount"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="discountPercent" className="label">
                Réduction (%)
              </label>
              <input
                type="number"
                id="discountPercent"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || 0 })}
                className="input"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label htmlFor="deliveryFee" className="label">
                Frais de livraison (FCFA)
              </label>
              <input
                type="number"
                id="deliveryFee"
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) || 0 })}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="paymentMode" className="label">
                Mode de paiement
              </label>
              <select
                id="paymentMode"
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as any })}
                className="select"
              >
                <option value="ESPECES">Espèces</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="VIREMENT">Virement</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div>
              <label htmlFor="amountPaid" className="label">
                Montant payé (FCFA)
              </label>
              <input
                type="number"
                id="amountPaid"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })}
                className="input"
                min="0"
              />
            </div>
          </div>
        </section>

        {/* ===== Récapitulatif ===== */}
        <section className="card card-pad">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Récapitulatif</h2>
            {statusBadge}
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">Sous-total</span>
              <span className="font-medium text-stone-900">
                {calculation.subtotal.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            {calculation.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-600">Réduction</span>
                <span className="font-medium text-red-600">
                  -{calculation.discount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )}
            {calculation.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-600">Frais de livraison</span>
                <span className="font-medium text-stone-900">
                  {calculation.deliveryFee.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-primary-600 px-4 py-3 text-white">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">
                {calculation.totalAmount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-stone-600">Montant payé</span>
              <span className="font-medium text-emerald-600">
                {calculation.amountPaid.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Reste à payer</span>
              <span className="font-semibold text-stone-900">
                {calculation.remainingAmount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? 'Création de la facture...' : 'Créer la facture'}
        </button>
      </form>
    </div>
  )
}