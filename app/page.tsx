import Link from 'next/link'
import { KoboLogo } from '@/components/brand/logo'
import { Calculator, Sparkles, ArrowRight, Check, Zap, Shield, TrendingUp } from 'lucide-react'

const benefits = [
  {
    icon: Zap,
    title: 'Rapide comme l\'éclair',
    description: 'Créez des factures professionnelles en moins de 2 minutes. Plus de calculs manuels.',
  },
  {
    icon: Shield,
    title: 'Données sécurisées',
    description: 'Vos factures et informations clients sont protégées. Seul vous y avez accès.',
  },
  {
    icon: TrendingUp,
    title: 'Prix juste toujours',
    description: 'Calculez vos prix de vente avec une vraie marge. Fini les pertes.',
  },
]

const creditPacks = [
  {
    name: 'Pack Découverte',
    price: '1 500 FCFA',
    credits: 15,
    popular: false,
    features: [
      'Génération PDF',
      'Partage WhatsApp',
      'Historique 30 jours',
    ],
  },
  {
    name: 'Pack Standard',
    price: '5 000 FCFA',
    credits: 60,
    popular: true,
    features: [
      'Tout le pack Découverte',
      'Historique illimité',
      'Logo personnalisé',
    ],
  },
  {
    name: 'Pack Pro',
    price: '10 000 FCFA',
    credits: 150,
    popular: false,
    features: [
      'Tout le pack Standard',
      'Statistiques CA',
      'Revenus mensuels',
    ],
  },
]

const faqs = [
  {
    question: 'C\'est gratuit ?',
    answer: 'Le calculateur de prix est 100% gratuit et illimité. Pour créer des factures, vous achetez des packs de crédits (1 crédit = 1 facture). Les packs commencent à 1 500 FCFA pour 15 factures.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Absolument. Vos factures et informations sont stockées de manière sécurisée et seul vous y avez accès. Nous ne partageons jamais vos données avec des tiers.',
  },
  {
    question: 'Comment payer les crédits ?',
    answer: 'Vous pouvez payer par Mobile Money (Flooz, T-Money), carte bancaire ou virement. Les crédits sont ajoutés instantanément après confirmation du paiement.',
  },
  {
    question: 'Faut-il un ordinateur ?',
    answer: 'Non ! Kobo est optimisé pour le mobile et fonctionne parfaitement sur smartphone, même avec une connexion 3G. Vous pouvez tout faire depuis votre téléphone.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-primary-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <KoboLogo href="/" />

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/calculateur" className="text-sm font-medium text-foreground hover:text-primary-600">
              Calculateur
            </Link>
            <Link href="#tarifs" className="text-sm font-medium text-foreground hover:text-primary-600">
              Tarifs
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-primary-50 sm:block">
              Se connecter
            </Link>
            <Link href="/register" className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
              Commencer
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 py-20 text-white md:py-32">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute left-10 top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute right-10 bottom-20 h-96 w-96 rounded-full bg-secondary-500/20 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="relative z-10">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Conçu pour les commerçants africains</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  Vendez au bon prix.<br />
                  <span className="text-secondary-400">Facturez en 2 minutes.</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
                  Kobo calcule vos prix de vente avec une vraie marge et génère des factures professionnelles à partager sur WhatsApp. Simple, mobile, sans jargon.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-primary-600 hover:bg-primary-50">
                    Créer mon compte gratuit
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link href="/calculateur" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/20">
                    <Calculator className="h-5 w-5" />
                    Essayer le calculateur
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap gap-6 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Gratuit pour commencer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>3 factures offertes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Montants en FCFA</span>
                  </div>
                </div>
              </div>

              {/* Hero Calculator Preview */}
              <div className="relative z-10">
                <div className="rounded-2xl bg-white p-6 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Prix de vente conseillé</p>
                    <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-600">
                      Marge 30%
                    </span>
                  </div>
                  <p className="text-5xl font-bold text-primary-600">
                    6 500 FCFA
                  </p>
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm text-foreground">
                      <span>Coût total</span>
                      <span className="font-medium">5 000 FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm text-foreground">
                      <span>Votre bénéfice</span>
                      <span className="font-medium text-accent-600">+1 500 FCFA</span>
                    </div>
                  </div>
                  <div className="mt-6 rounded-xl bg-accent-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Facture n° FAC-2026-0001</span>
                      <span className="flex items-center gap-1 rounded-full bg-accent-500 px-3 py-1 text-xs font-semibold text-white">
                        <Check className="h-3 w-3" />
                        Payé
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-foreground">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>Envoyée sur WhatsApp</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Free Credits Banner */}
        <section className="bg-accent-500 py-8 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">Offre de bienvenue</p>
                  <p className="text-sm text-white/90">3 factures gratuites à l'inscription</p>
                </div>
              </div>
              <Link href="/register" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-accent-600 hover:bg-primary-50">
                Profiter de l'offre
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Pourquoi choisir Kobo ?
              </h2>
              <p className="mt-4 text-lg text-foreground">
                Des avantages concrets pour votre activité quotidienne.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="rounded-2xl border-2 border-primary-100 p-8 text-center transition-colors hover:border-primary-300">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-100 text-primary-600">
                    <benefit.icon className="h-8 w-8" strokeWidth={2} />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-foreground">{benefit.title}</h3>
                  <p className="mt-3 text-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="tarifs" className="bg-primary-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Tarifs simples et transparents
              </h2>
              <p className="mt-4 text-lg text-foreground">
                Choisissez le pack qui correspond à vos besoins. 1 crédit = 1 facture.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {creditPacks.map((pack) => (
                <div
                  key={pack.name}
                  className={`relative rounded-2xl border-2 p-8 ${
                    pack.popular
                      ? 'border-primary-500 bg-white shadow-xl'
                      : 'border-primary-200 bg-white'
                  }`}
                >
                  {pack.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary-500 px-4 py-1 text-sm font-semibold text-white">
                        Populaire
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-foreground">{pack.name}</h3>
                  <p className="mt-2 text-4xl font-bold text-primary-600">{pack.price}</p>
                  <p className="mt-2 text-sm text-foreground">{pack.credits} factures</p>
                  <div className="mt-6 space-y-3">
                    {pack.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-accent-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/register"
                    className={`mt-8 block rounded-xl px-6 py-3 text-center text-sm font-semibold transition-colors ${
                      pack.popular
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50'
                    }`}
                  >
                    Choisir ce pack
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-foreground">
                Paiement sécurisé via Mobile Money, carte bancaire ou virement.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Questions fréquentes
              </h2>
              <p className="mt-4 text-lg text-foreground">
                Tout ce que vous devez savoir avant de commencer.
              </p>
            </div>

            <div className="mt-12 space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="rounded-xl border-2 border-primary-100 p-6">
                  <h3 className="text-lg font-semibold text-foreground">{faq.question}</h3>
                  <p className="mt-3 text-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary-600 py-20 text-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Prêt à vendre au bon prix ?
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Rejoignez des centaines de commerçants qui fixent leurs prix avec confiance et facturent comme des pros.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-primary-600 hover:bg-primary-50">
                Créer mon compte gratuit
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/calculateur" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/20">
                <Calculator className="h-5 w-5" />
                Essayer le calculateur
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <KoboLogo href="/" />
            </div>
            <div className="flex gap-6 text-sm text-foreground">
              <Link href="/terms" className="hover:text-primary-600">
                CGU
              </Link>
              <Link href="/privacy" className="hover:text-primary-600">
                Confidentialité
              </Link>
            </div>
            <p className="text-sm text-foreground">
              © 2026 Kobo — Calcul de prix & facturation pour commerçants
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
