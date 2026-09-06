import Link from 'next/link'
import { KoboLogo } from '@/components/brand/logo'

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Calculateur de prix',
    description:
      'Entrez vos coûts (achat, transport, emballage…) et obtenez instantanément votre prix de vente avec la bonne marge. Gratuit et illimité.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Factures professionnelles',
    description:
      'Créez une facture propre et complète en quelques touches : produits, réductions, livraison, reste à payer. PDF généré automatiquement.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Partage WhatsApp',
    description:
      'Envoyez la facture à votre client en un clic via WhatsApp. Le client reçoit le montant, le numéro de facture et le PDF.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Entrez vos coûts',
    description: 'Prix d’achat, transport, emballage, publicité… Kobo additionne tout pour vous.',
  },
  {
    number: '2',
    title: 'Obtenez votre prix',
    description: 'Kobo calcule votre prix de vente conseillé avec le bénéfice que vous choisissez.',
  },
  {
    number: '3',
    title: 'Facturez & partagez',
    description: 'Créez la facture, envoyez-la sur WhatsApp. Le client paie, vous gardez la trace.',
  },
]

const packs = [
  {
    name: 'Débutant',
    price: '500',
    credits: 5,
    perCredit: '100 FCFA / facture',
    featured: false,
  },
  {
    name: 'Standard',
    price: '1 000',
    credits: 15,
    perCredit: '67 FCFA / facture',
    featured: true,
  },
  {
    name: 'Pro',
    price: '2 000',
    credits: 50,
    perCredit: '40 FCFA / facture',
    featured: false,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <KoboLogo href="/" />

          <nav className="hidden items-center md:flex">
            <Link href="/calculateur" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100">
              Calculateur
            </Link>
            <Link href="/register" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100">
              Facturation
            </Link>
            <Link href="/register" className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100">
              Tarifs
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost btn-md hidden sm:inline-flex">
              Se connecter
            </Link>
            <Link href="/register" className="btn btn-primary btn-md">
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ===== Hero ===== */}
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 md:pt-20 md:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="badge badge-green mb-5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Conçu pour les petits commerçants
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
                Vendez au bon prix.{' '}
                <span className="text-primary-600">Facturez en 2 minutes.</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-600">
                Kobo calcule vos prix de vente avec une vraie marge et génère des
                factures professionnelles à partager sur WhatsApp. Simple, mobile,
                sans jargon.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="btn btn-primary btn-lg">
                  Créer mon compte gratuit
                </Link>
                <Link href="/calculateur" className="btn btn-secondary btn-lg">
                  Essayer le calculateur
                </Link>
              </div>

              <p className="mt-4 text-sm text-stone-500">
                Gratuit pour commencer · Sans carte bancaire · Montants en FCFA
              </p>
            </div>

            {/* Visuel hero */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="card card-pad relative z-10 shadow-xl shadow-stone-900/5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-900">Prix de vente conseillé</p>
                  <span className="badge badge-green">Marge 30%</span>
                </div>
                <p className="mt-3 text-4xl font-bold tracking-tight text-primary-600">
                  6 500 FCFA
                </p>
                <div className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between text-stone-500">
                    <span>Coût total</span>
                    <span className="font-medium text-stone-900">5 000 FCFA</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Votre bénéfice</span>
                    <span className="font-medium text-emerald-600">+1 500 FCFA</span>
                  </div>
                </div>
                <div className="mt-5 rounded-xl bg-stone-50 p-3 text-sm">
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="font-medium">Facture n° FAC-2026-0001</span>
                    <span className="badge badge-green">Payé ✓</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">✓</span>
                    Envoyée sur WhatsApp
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 z-0 hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-lg sm:block">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Moins de 2 minutes</p>
                    <p className="text-xs text-stone-500">du calcul au partage</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Fonctionnalités ===== */}
        <section className="border-t border-stone-200/70 bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-stone-900">
                Tout ce qu’il faut pour vendre, rien de superflu
              </h2>
              <p className="mt-3 text-lg text-stone-600">
                Pas de tableaux compliqués. Trois outils simples, pensés pour un usage sur téléphone.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="card card-pad hover:shadow-md hover:shadow-stone-900/5 transition-shadow">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-primary-600">
                    {feature.icon}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-stone-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Comment ça marche ===== */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-stone-900">
              Comment ça marche ?
            </h2>
            <p className="mt-3 text-lg text-stone-600">
              Du prix de vente à la facture envoyée, tout se fait en 3 étapes.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex items-center gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-600 text-base font-bold text-white">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-semibold text-stone-900">{step.title}</h3>
                </div>
                <p className="mt-3 pl-14 text-sm leading-relaxed text-stone-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Tarifs ===== */}
        <section className="border-t border-stone-200/70 bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-stone-900">
                Des tarifs simples, en FCFA
              </h2>
              <p className="mt-3 text-lg text-stone-600">
                1 crédit = 1 facture générée. Aucun abonnement, vous payez ce que vous utilisez.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {packs.map((pack) => (
                <div
                  key={pack.name}
                  className={`card card-pad relative flex flex-col ${
                    pack.featured ? 'border-primary-300 ring-2 ring-primary-500/20' : ''
                  }`}
                >
                  {pack.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-green">
                      Le plus choisi
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-stone-900">{pack.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-stone-900">
                      {pack.price}
                    </span>
                    <span className="text-sm font-medium text-stone-500">FCFA</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-500">{pack.credits} crédits · {pack.perCredit}</p>
                  <div className="mt-5">
                    <Link
                      href="/register"
                      className={`btn w-full ${pack.featured ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Commencer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CTA final ===== */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-24">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-14 text-center text-white md:px-12">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
              Prêt à vendre au bon prix ?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-emerald-50/90">
              Rejoignez des centaines de commerçants qui fixent leurs prix avec confiance et facturent comme des pros.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register" className="btn btn-lg bg-white text-emerald-700 hover:bg-emerald-50">
                Créer mon compte gratuit
              </Link>
              <Link
                href="/calculateur"
                className="btn btn-lg border border-white/30 text-white hover:bg-white/10"
              >
                Essayer le calculateur
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-stone-200/70 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <KoboLogo />
          <p className="text-sm text-stone-500">
            © {new Date().getFullYear()} Kobo — Calcul de prix & facturation pour commerçants
          </p>
          <div className="flex items-center gap-4 text-sm text-stone-500">
            <Link href="/calculateur" className="hover:text-stone-900">Calculateur</Link>
            <Link href="/login" className="hover:text-stone-900">Connexion</Link>
            <Link href="/register" className="hover:text-stone-900">Inscription</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}