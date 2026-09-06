'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type AdminUser = {
  id: string
  name: string
  email: string
  phone: string | null
  companyName: string | null
  role: string
  active: boolean
  credits: number
  invoicesCount: number
  purchasesCount: number
}

/**
 * Tableau utilisateurs (admin) — activation/désactivation d'un compte,
 * avec rafraîchissement des stats serveur après chaque action.
 */
export function UsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const toggleActive = async (user: AdminUser) => {
    setBusyId(user.id)
    setError('')
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      })
      const data = await res.json()
      if (res.ok) {
        router.refresh()
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      setError('Erreur lors de la mise à jour')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                {['Utilisateur', 'Entreprise', 'Crédits', 'Factures', 'Achats', 'Statut', 'Action'].map(
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
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-stone-900">{user.name}</div>
                    <div className="text-sm text-stone-500">{user.email}</div>
                    {user.phone && (
                      <div className="text-sm text-stone-500">{user.phone}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-stone-700">
                    {user.companyName || '—'}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-stone-900">
                    {user.credits}
                  </td>
                  <td className="px-5 py-4 text-sm text-stone-700">{user.invoicesCount}</td>
                  <td className="px-5 py-4 text-sm text-stone-700">{user.purchasesCount}</td>
                  <td className="px-5 py-4">
                    {user.role === 'ADMIN' ? (
                      <span className="badge badge-green">Admin</span>
                    ) : user.active ? (
                      <span className="badge badge-green">Actif</span>
                    ) : (
                      <span className="badge badge-red">Désactivé</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {user.role !== 'ADMIN' && (
                      <button
                        onClick={() => toggleActive(user)}
                        disabled={busyId === user.id}
                        className={`btn btn-sm ${user.active ? 'btn-danger' : 'btn-success'}`}
                      >
                        {busyId === user.id ? '…' : user.active ? 'Désactiver' : 'Activer'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
