'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateInvoice, type CreateInvoiceInput, type InvoiceItemInput } from '@/lib/validations/invoice'
import { User, Package, CreditCard, Check, X } from 'lucide-react'

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

  const isValidClient = formData.clientName.length > 0 && formData.clientPhone.length > 0
  const isValidItems = items.some(item => item.designation && item.quantity > 0 && item.unitPrice > 0)

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 md:mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Nouvelle facture
          </h1>
          <p className="mt-1 text-secondary-600">
            Remplissez les informations, la facture PDF est générée automatiquement.
          </p>
        </div>
        <div className="badge badge-green">
          <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
          12 crédits restants
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-[1fr_380px]">

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ===== Client ===== */}
        <section className="card card-pad">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white">
              <User className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-foreground">Informations client</h2>
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
                className={`input ${formData.clientName && !isValidClient ? 'input-error' : ''}`}
                placeholder="Koffi Amégnignon"
                required
              />
              {formData.clientName && (
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {formData.clientName.length > 0 ? (
                    <span className="text-success-600 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Validé
                    </span>
                  ) : (
                    <span className="text-red-600">Requis</span>
                  )}
                </div>
              )}
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
                className={`input ${formData.clientPhone && !isValidClient ? 'input-error' : ''}`}
                placeholder="+228 90 00 00 00"
                required
              />
              {formData.clientPhone && (
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {formData.clientPhone.length > 0 ? (
                    <span className="text-success-600 font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Validé
                    </span>
                  ) : (
                    <span className="text-red-600">Requis</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===== Produits ===== */}
        <section className="card card-pad">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                <Package className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-semibold text-foreground">Produits</h2>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="btn btn-primary btn-sm"
            >
              + Ajouter
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="rounded-xl border border-secondary-200 bg-background p-4">
                <div className="grid gap-3 sm:grid-cols-[3fr_1fr_1.2fr_1.2fr_auto] sm:items-center">
                  <div>
                    <label className="label">Désignation</label>
                    <input
                      type="text"
                      value={item.designation}
                      onChange={(e) => updateItem(index, 'designation', e.target.value)}
                      className="input"
                      placeholder="Chemise en coton"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Qté</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      className="input text-right"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">P.U. (FCFA)</label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      className="input text-right"
                      min="0"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="label">Total</label>
                    <p className="flex h-11 items-center rounded-xl bg-white px-3.5 text-sm font-semibold text-foreground">
                      {(item.quantity * item.unitPrice).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  {items.length > 1 && (
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        aria-label="Supprimer le produit"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Paiement ===== */}
        <section className="card card-pad">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white">
              <CreditCard className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-semibold text-foreground">Détails de paiement</h2>
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
              <p className="input-hint">Optionnel</p>
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
              <p className="input-hint">Optionnel</p>
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
              <p className="input-hint">Le reste sera calculé automatiquement</p>
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
                <option value="">Sélectionner...</option>
                <option value="ESPECES">Espèces</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="VIREMENT">Virement</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
          </div>
        </section>

        {/* ===== Récapitulatif ===== */}
        <section className="card card-pad">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Récapitulatif</h2>
            {statusBadge}
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary-600">Sous-total</span>
              <span className="font-medium text-foreground">
                {calculation.subtotal.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            {calculation.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Réduction</span>
                <span className="font-medium text-red-600">
                  -{calculation.discount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )}
            {calculation.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-secondary-600">Frais de livraison</span>
                <span className="font-medium text-foreground">
                  {calculation.deliveryFee.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-3 text-white">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold">
                {calculation.totalAmount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-secondary-600">Montant payé</span>
              <span className="font-medium text-success-600">
                {calculation.amountPaid.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-600">Reste à payer</span>
              <span className="font-semibold text-foreground">
                {calculation.remainingAmount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary flex-1"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? 'Création de la facture...' : 'Générer la facture'}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}