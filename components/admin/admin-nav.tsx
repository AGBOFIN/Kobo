'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Vue générale' },
  { href: '/admin/revenue', label: 'Revenus' },
  { href: '/admin/users', label: 'Utilisateurs' },
  { href: '/admin/invoices', label: 'Factures' },
  { href: '/admin/purchases', label: 'Achats de crédits' },
  { href: '/admin/credit-packs', label: 'Packs' },
  { href: '/admin/webhooks', label: 'Webhooks' },
  { href: '/admin/audit-log', label: 'Audit' },
  { href: '/admin/errors', label: 'Erreurs' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Navigation admin">
      {links.map(link => {
        const active =
          link.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
              active
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
