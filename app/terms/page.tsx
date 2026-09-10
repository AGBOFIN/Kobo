import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation',
  description:
    'Les conditions générales d’utilisation de la plateforme Kobo : compte, crédits, paiements, responsabilités.',
}

/**
 * Page légale — CGU (contenu statique, aucun accès DB).
 *
 * Éditeur : HUB DIG (Togo). L'email de contact et l'URL sont remplis.
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* En-tête compact, aligné sur les autres pages publiques */}
      <header className="border-b border-stone-200/70 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight text-stone-900"
          >
            Kobo
          </Link>
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          Conditions générales d&apos;utilisation
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Dernière mise à jour : 7 septembre 2026
        </p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-stone-600">
          <section>
            <h2 className="text-lg font-semibold text-stone-900">1. Objet</h2>
            <p className="mt-3">
              Les présentes conditions générales d&apos;utilisation (ci-après
              «&nbsp;CGU&nbsp;») régissent l&apos;accès et l&apos;utilisation de la
              plateforme Kobo (ci-après «&nbsp;le Service&nbsp;»), éditée par{' '}
              <strong className="font-medium text-stone-800">HUB DIG</strong>,
              société établie au <strong className="font-medium text-stone-800">Togo</strong>,
              accessible à l&apos;adresse{' '}
              <a
                href="https://facomptkobo.vercel.app"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                facomptkobo.vercel.app
              </a>
              .
            </p>
            <p className="mt-3">
              En créant un compte ou en utilisant le Service, vous acceptez sans
              réserve les présentes CGU. Si vous n&apos;acceptez pas ces conditions,
              vous ne devez pas utiliser le Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              2. Description du Service
            </h2>
            <p className="mt-3">
              Kobo permet à ses utilisateurs (ci-après «&nbsp;l&apos;Utilisateur&nbsp;»
              ou «&nbsp;le Vendeur&nbsp;») de :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Calculer un prix de vente conseillé à partir de leurs coûts (gratuit,
                sans compte requis)
              </li>
              <li>Créer des factures professionnelles au format PDF</li>
              <li>Partager ces factures avec leurs clients, notamment via WhatsApp</li>
              <li>
                Acheter des crédits, chaque crédit permettant de générer/télécharger
                une facture
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              3. Création de compte
            </h2>
            <p className="mt-3">
              Pour utiliser les fonctionnalités de facturation, vous devez créer un
              compte en fournissant des informations exactes : nom, téléphone, email,
              mot de passe. Vous êtes responsable de la confidentialité de vos
              identifiants et de toute activité effectuée depuis votre compte.
            </p>
            <p className="mt-3">
              Vous devez être majeur (ou disposer de l&apos;autorisation
              d&apos;un représentant légal, selon la loi applicable) et avoir la
              capacité juridique de conclure un contrat pour créer un compte.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              4. Crédits et paiement
            </h2>

            <h3 className="mt-4 font-medium text-stone-800">4.1 Fonctionnement des crédits</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Le calculateur de prix est gratuit et illimité.</li>
              <li>La génération/téléchargement d&apos;une facture PDF consomme 1 crédit.</li>
              <li>
                Les crédits sont vendus par packs :
                <ul className="mt-1 list-[circle] space-y-1 pl-5">
                  <li>1 500 FCFA → 15 crédits</li>
                  <li>5 000 FCFA → 60 crédits</li>
                  <li>10 000 FCFA → 150 crédits</li>
                </ul>
              </li>
              <li>
                Les crédits achetés sont crédités sur votre compte après confirmation
                du paiement.
              </li>
              <li>
                Les crédits n&apos;expirent pas, sauf mention contraire communiquée à
                l&apos;avance.
              </li>
            </ul>

            <h3 className="mt-4 font-medium text-stone-800">4.2 Paiement</h3>
            <p className="mt-2">
              Les paiements sont traités par notre partenaire{' '}
              <strong className="font-medium text-stone-800">Chariow</strong>. Kobo ne
              stocke aucune donnée bancaire ou de paiement directement. En effectuant
              un paiement, vous acceptez également les conditions d&apos;utilisation de
              Chariow applicables au traitement de votre transaction.
            </p>

            <h3 className="mt-4 font-medium text-stone-800">
              4.3 Politique de remboursement
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Un crédit consommé par la génération d&apos;une facture n&apos;est pas
                remboursable, sauf erreur technique avérée imputable au Service.
              </li>
              <li>
                En cas de paiement effectué mais de crédits non reçus après un délai
                raisonnable, contactez-nous à{' '}
                <a
                  href="mailto:kobo@gmail.com"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  kobo@gmail.com
                </a>{' '}
                avec la référence de votre transaction ; nous investiguerons et
                régulariserons la situation.
              </li>
              <li>
                Aucun remboursement en espèces n&apos;est possible sur les crédits déjà
                attribués et non utilisés, sauf disposition légale contraire.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              5. Utilisation autorisée du Service
            </h2>
            <p className="mt-3">
              Vous vous engagez à utiliser Kobo uniquement à des fins légales, et
              notamment à :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Fournir des informations exactes sur vos factures et vos clients</li>
              <li>
                Ne pas utiliser le Service pour émettre des factures frauduleuses ou
                trompeuses
              </li>
              <li>
                Ne pas tenter de contourner le système de crédits (piratage,
                exploitation de faille, usage de plusieurs comptes pour obtenir des
                crédits gratuits de façon abusive)
              </li>
              <li>
                Ne pas perturber le fonctionnement technique du Service (tentative
                d&apos;intrusion, surcharge délibérée, etc.)
              </li>
            </ul>
            <p className="mt-3">
              Tout manquement à ces engagements peut entraîner la suspension ou la
              suppression de votre compte, sans préavis en cas de fraude avérée.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              6. Propriété et contenu
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                Vous restez propriétaire des données que vous saisissez dans Kobo
                (informations de vos factures, vos clients, votre logo).
              </li>
              <li>
                Kobo reste propriétaire de la plateforme, de sa marque, de son design
                et de son code.
              </li>
              <li>
                En utilisant votre logo dans une facture générée, vous garantissez
                disposer des droits nécessaires sur ce logo.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              7. Disponibilité du Service
            </h2>
            <p className="mt-3">
              Nous nous efforçons d&apos;assurer une disponibilité continue du Service,
              mais ne pouvons garantir une absence totale d&apos;interruption
              (maintenance, panne technique, cas de force majeure). Nous ne pourrons
              être tenus responsables des conséquences d&apos;une indisponibilité
              temporaire du Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              8. Limitation de responsabilité
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                Kobo est un outil d&apos;aide au calcul et à la facturation ; il ne
                remplace pas un conseil comptable, fiscal ou juridique professionnel.
                Vous restez seul responsable de l&apos;exactitude des montants facturés
                et du respect de vos obligations fiscales et comptables.
              </li>
              <li>
                Kobo ne pourra être tenu responsable des litiges entre vous et vos
                clients concernant le contenu d&apos;une facture que vous avez créée.
              </li>
              <li>
                Dans les limites permises par la loi applicable, la responsabilité de
                Kobo est limitée au montant des crédits achetés au cours des 12 derniers
                mois.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              9. Suspension et suppression de compte
            </h2>
            <p className="mt-3">
              Nous nous réservons le droit de suspendre ou supprimer un compte en cas
              de :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Violation des présentes CGU</li>
              <li>Usage frauduleux ou abusif du Service</li>
              <li>Demande de l&apos;Utilisateur lui-même</li>
            </ul>
            <p className="mt-3">
              Vous pouvez demander la suppression de votre compte à tout moment en nous
              contactant à{' '}
              <a
                href="mailto:kobo@gmail.com"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                kobo@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              10. Modification des CGU
            </h2>
            <p className="mt-3">
              Nous pouvons modifier les présentes CGU à tout moment, notamment pour
              refléter une évolution du Service, des packs de crédits, ou de la
              réglementation. Toute modification substantielle vous sera communiquée
              avant son entrée en vigueur. La poursuite de l&apos;utilisation du
              Service après notification vaut acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              11. Droit applicable et litiges
            </h2>
            <p className="mt-3">
              Les présentes CGU sont soumises au droit togolais. En cas de litige, les
              parties s&apos;efforceront de trouver une solution amiable avant toute
              action judiciaire. À défaut d&apos;accord amiable, les tribunaux
              compétents du Togo seront seuls compétents, sauf disposition légale
              impérative contraire.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">12. Contact</h2>
            <p className="mt-3">
              Pour toute question relative aux présentes conditions générales
              d&apos;utilisation :{' '}
              <a
                href="mailto:kobo@gmail.com"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                kobo@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-stone-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-stone-500 sm:px-6">
          <div className="mb-2 flex items-center justify-center gap-4">
            <Link href="/terms" className="hover:text-stone-900">
              Conditions d&apos;utilisation
            </Link>
            <Link href="/privacy" className="hover:text-stone-900">
              Politique de confidentialité
            </Link>
          </div>
          © {new Date().getFullYear()} Kobo — Calcul de prix &amp; facturation pour commerçants
        </div>
      </footer>
    </div>
  )
}
