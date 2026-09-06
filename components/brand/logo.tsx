import Link from 'next/link'

export function KoboMark({ className = 'h-9 w-9 rounded-xl' }: { className?: string }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[55%] w-[55%]"
        aria-hidden="true"
      >
        <path d="M6.5 4v16" />
        <path d="M17.5 4l-8.5 8 8.5 8" />
      </svg>
    </span>
  )
}

interface KoboLogoProps {
  href?: string
  dark?: boolean
  className?: string
}

export function KoboLogo({ href, dark = false, className = '' }: KoboLogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <KoboMark />
      <span
        className={`text-lg font-bold tracking-tight ${
          dark ? 'text-white' : 'text-stone-900'
        }`}
      >
        Kobo
      </span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="Kobo — Accueil">
        {content}
      </Link>
    )
  }

  return content
}