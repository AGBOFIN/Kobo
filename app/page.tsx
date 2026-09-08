import Link from 'next/link'
import { KoboLogo } from '@/components/brand/logo'
import { Clock, FileText, Calculator, Smartphone, Banknote, Lock, Sparkles, Check } from 'lucide-react'

const benefits = [
  {
    icon: Clock,
    title: 'Gain de temps massif',
    description: 'Plus de calculs à la main ou sur Excel. Tout est automatique. Une facture en moins de 2 minutes.',
  },
  {
    icon: FileText,
    title: 'Image professionnelle',
    description: 'Des factures propres et complètes qui inspirent confiance à vos clients. Plus de papier froissé.',
  },
  {
    icon: Calculator,
    title: 'Pas de calculs compliqués',
    description: 'Kobo fait les maths pour vous. Marge, TVA, réductions… tout est calculé instantanément.',
  },
  {
    icon: Smartphone,
    title: '100% mobile',
    description: 'Fonctionne parfaitement sur téléphone, même avec connexion 3G. Pas besoin d\'ordinateur.',
  },
  {
    icon: Banknote,
    title: 'Prix en FCFA',
    description: 'Tout est pensé pour l\'Afrique de l\'Ouest. Pas de conversion, pas de surprise. Des packs abordables.',
  },
  {
    icon: Lock,
    title: 'Vos données sont safe',
    description: 'Vos factures et informations clients sont sécurisées. Personne d\'autre n\'y a accès.',
  },
]

const steps = [
  {
    number: '1',
    title: 'Entrez vos coûts',
    description: 'Prix d\'achat, transport, emballage, publicité… Kobo additionne tout pour vous automatiquement.',
  },
  {
    number: '2',
    title: 'Obtenez votre prix',
    description: 'Kobo calcule votre prix de vente conseillé avec le bénéfice que vous choisissez. Plus de devinettes.',
  },
  {
    number: '3',
    title: 'Facturez & partagez',
    description: 'Créez la facture professionnelle en quelques touches, envoyez-la sur WhatsApp. Le client paie, vous gardez la trace.',
  },
]

const testimonials = [
  {
    name: 'Amina K.',
    role: 'Vendeuse de vêtements, Lomé',
    text: 'Avant Kobo, je passais 30 minutes à calculer mes prix de vente. Maintenant, c\'est instantané. Mes clients trouvent mes factures beaucoup plus professionnelles.',
    initials: 'AK',
  },
  {
    name: 'Kofi M.',
    role: 'Commerçant électronique, Cotonou',
    text: 'Le partage WhatsApp a changé ma façon de travailler. J\'envoie la facture, le client paie, et j\'ai tout l\'historique. Fini les papiers perdus.',
    initials: 'KM',
  },
  {
    name: 'Fatou A.',
    role: 'Boutique cosmétiques, Ouagadougou',
    text: 'J\'ai testé plusieurs outils mais Kobo est le seul qui soit vraiment adapté à nos réalités. Prix en FCFA, simple, rapide. Je recommande.',
    initials: 'FA',
  },
]

const faqs = [
  {
    question: 'C\'est gratuit ?',
    answer: 'Le calculateur de prix est 100% gratuit et illimité. Pour créer des factures, vous achetez des packs de crédits (1 crédit = 1 facture). Les packs commencent à 500 FCFA pour 5 factures.',
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
  {
    question: 'Puis-je personnaliser mes factures ?',
    answer: 'Oui, vous pouvez ajouter votre logo, vos coordonnées et personnaliser les informations de votre entreprise sur vos factures.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-secondary-200/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <KoboLogo href="/" />

          <nav className="hidden items-center gap-4 md:flex">
            <Link href="/calculateur" className="rounded-lg px-3 py-2 text-sm font-medium text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100">
              Calculateur
            </Link>
            <Link href="/register" className="rounded-lg px-3 py-2 text-sm font-medium text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100">
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
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-600 py-16 text-white md:py-24">
          <div className="absolute -top-[50%] -right-[20%] h-[600px] w-[600px] rounded-full bg-white/10" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div className="relative z-10">
                <div className="mb-6 flex flex-wrap gap-2">
                  <span className="badge bg-white/20 text-white backdrop-blur-sm flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    Conçu pour les commerçants africains
                  </span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                  Vendez au bon prix.<br />
                  <span className="text-accent-200">Facturez en 2 minutes.</span>
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/95 md:text-xl">
                  Kobo calcule vos prix de vente avec une vraie marge et génère des factures professionnelles à partager sur WhatsApp. Simple, mobile, sans jargon.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/register" className="btn btn-lg bg-white text-primary-600 hover:bg-primary-50">
                    Créer mon compte gratuit
                  </Link>
                  <Link href="/calculateur" className="btn btn-lg border-2 border-white bg-white/10 text-white hover:bg-white/20">
                    Essayer le calculateur
                  </Link>
                </div>

                <p className="mt-4 text-sm text-white/80">
                  Gratuit pour commencer · Sans carte bancaire · Montants en FCFA
                </p>
              </div>

              {/* Hero Card */}
              <div className="relative z-10">
                <div className="card card-pad shadow-2xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Prix de vente conseillé</p>
                    <span className="badge badge-green">Marge 30%</span>
                  </div>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-primary-600">
                    6 500 FCFA
                  </p>
                  <div className="mt-5 space-y-2.5 text-sm">
                    <div className="flex justify-between text-secondary-600">
                      <span>Coût total</span>
                      <span className="font-medium text-foreground">5 000 FCFA</span>
                    </div>
                    <div className="flex justify-between text-secondary-600">
                      <span>Votre bénéfice</span>
                      <span className="font-medium text-success-600">+1 500 FCFA</span>
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl bg-success-50 p-3 text-sm">
                    <div className="flex items-center justify-between text-secondary-700">
                      <span className="font-medium">Facture n° FAC-2026-0001</span>
                      <span className="badge badge-green flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Payé
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-secondary-600">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-500 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                      Envoyée sur WhatsApp
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Comment ça marche ?
              </h2>
              <p className="mt-4 text-lg text-secondary-600">
                Du prix de vente à la facture envoyée, tout se fait en 3 étapes simples.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-2xl font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-secondary-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bénéfices */}
        <section className="bg-background py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Pourquoi les commerçants adorent Kobo ?
              </h2>
              <p className="mt-4 text-lg text-secondary-600">
                Des avantages concrets qui changent votre quotidien.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="card card-pad flex gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                    <benefit.icon className="h-7 w-7" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                    <p className="mt-1 text-secondary-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Témoignages */}
        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Ce que disent nos utilisateurs
              </h2>
              <p className="mt-4 text-lg text-secondary-600">
                Des commerçants comme vous qui utilisent Kobo au quotidien.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.name} className="card card-pad">
                  <div className="mb-4 text-accent-500 text-xl">★★★★★</div>
                  <p className="mb-6 italic text-foreground leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-secondary-500 to-secondary-600 text-sm font-bold text-white">
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-secondary-600">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-background py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Questions fréquentes
              </h2>
              <p className="mt-4 text-lg text-secondary-600">
                Tout ce que vous devez savoir avant de commencer.
              </p>
            </div>

            <div className="mt-12 space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="card overflow-hidden">
                  <div className="border-b border-secondary-200 px-6 py-4 font-semibold text-foreground">
                    {faq.question}
                  </div>
                  <div className="px-6 py-4 text-secondary-600">
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="rounded-3xl bg-gradient-to-br from-secondary-600 to-secondary-700 px-8 py-16 text-center text-white md:px-12">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Prêt à vendre au bon prix ?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">
                Rejoignez des centaines de commerçants qui fixent leurs prix avec confiance et facturent comme des pros.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register" className="btn btn-lg bg-white text-secondary-700 hover:bg-secondary-50">
                  Créer mon compte gratuit
                </Link>
                <Link href="/calculateur" className="btn btn-lg border-2 border-white bg-white/10 text-white hover:bg-white/20">
                  Essayer le calculateur
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-secondary-200/70 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <KoboLogo />
          <p className="text-sm text-secondary-600">
            © {new Date().getFullYear()} Kobo — Calcul de prix & facturation pour commerçants
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-secondary-600">
            <Link href="/calculateur" className="hover:text-foreground">Calculateur</Link>
            <Link href="/login" className="hover:text-foreground">Connexion</Link>
            <Link href="/register" className="hover:text-foreground">Inscription</Link>
            <Link href="/terms" className="hover:text-foreground">CGU</Link>
            <Link href="/privacy" className="hover:text-foreground">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}