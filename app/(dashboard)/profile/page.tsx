'use client'

import { useState, useEffect, useRef } from 'react'

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyName: '',
    address: '',
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      const data = await response.json()
      if (response.ok && data.user) {
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
          companyName: data.user.companyName || '',
          address: data.user.address || '',
        })
        setLogoUrl(data.user.logoUrl || null)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      setMessage('Profil mis à jour avec succès')
    } catch {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = async (file: File) => {
    setError('')
    setMessage('')

    // Pré-validation côté client (la validation serveur fait foi)
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Format non supporté. Utilisez PNG ou JPG.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image trop lourde (2 Mo maximum).')
      return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const res = await fetch('/api/profile/logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setLogoUrl(data.logoUrl)
        setMessage('Logo mis à jour — il apparaîtra sur vos factures.')
      } else {
        setError(data.error || "Erreur lors de l'upload")
      }
    } catch {
      setError("Erreur lors de l'upload")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeLogo = async () => {
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/profile/logo', { method: 'DELETE' })
      if (res.ok) {
        setLogoUrl(null)
        setMessage('Logo supprimé.')
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      setError('Erreur lors de la suppression')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 md:text-3xl">
          Mon profil
        </h1>
        <p className="mt-1 text-stone-600">
          Ces informations apparaîtront sur vos factures.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ===== Logo ===== */}
      <div className="card card-pad mb-5">
        <h2 className="font-semibold text-stone-900">Logo de votre boutique</h2>
        <p className="mt-1 text-sm text-stone-500">
          Facultatif — affiché sur vos factures PDF. PNG ou JPG, 2 Mo maximum.
        </p>
        <div className="mt-4 flex items-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo de la boutique"
              className="h-16 w-16 rounded-xl border border-stone-200 bg-white object-contain p-1"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-xl border-2 border-dashed border-stone-300 text-stone-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          )}
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleLogoChange(file)
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-secondary btn-sm"
            >
              {uploading ? 'Envoi…' : logoUrl ? 'Changer le logo' : 'Ajouter un logo'}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={removeLogo}
                className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="label">
              Nom complet
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Jean Kouassi"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="label">
              Nom de l'entreprise
            </label>
            <input
              type="text"
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="input"
              placeholder="Ma Boutique SARL"
            />
          </div>

          <div>
            <label htmlFor="phone" className="label">
              Téléphone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
              placeholder="+228 90 00 00 00"
            />
          </div>

          <div>
            <label htmlFor="address" className="label">
              Adresse
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input h-auto min-h-24 py-3"
              rows={3}
              placeholder="Lomé, Togo"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg w-full sm:w-auto sm:px-10"
          >
            {loading ? 'Mise à jour...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  )
}
