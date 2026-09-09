'use client'

import { useState } from 'react'
import { signIn } from '@/lib/auth/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        // Redirection selon le rôle : un administrateur arrive directement
        // dans son espace, un commerçant dans son tableau de bord.
        if (result.user?.role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/dashboard/dashboard')
        }
        router.refresh()
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card card-pad">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Connexion</h1>
        <p className="mt-1 text-stone-600">Heureux de vous revoir !</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input"
            placeholder="votre@email.com"
            autoComplete="username"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="mb-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-stone-600">
        <p>
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-semibold text-primary-600 hover:text-primary-700">
            Créer un compte gratuit
          </Link>
        </p>
      </div>
    </div>
  )
}