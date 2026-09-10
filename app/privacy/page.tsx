import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Comment Kobo collecte, utilise et protège les données personnelles des commerçants qui utilisent la plateforme.',
}

/**
 * Page légale — Politique de confidentialité (contenu statique, aucun accès DB).
 *
 * Éditeur : HUB DIG (Togo). L'email de contact est rempli.
 */
export default function PrivacyPage() {
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
          Politique de confidentialité
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Dernière mise à jour : 7 septembre 2026
        </p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-stone-600">
          <section>
            <h2 className="text-lg font-semibold text-stone-900">1. Qui sommes-nous</h2>
            <p className="mt-3">
              Kobo est une plateforme web permettant aux commerçants de calculer leur
              prix de vente et de générer des factures professionnelles. Kobo est édité
              par <strong className="font-medium text-stone-800">HUB DIG</strong>,
              basé au <strong className="font-medium text-stone-800">Togo</strong>.
            </p>
            <p className="mt-3">
              Pour toute question relative à cette politique ou à vos données
              personnelles, vous pouvez nous contacter à :{' '}
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
              2. Quelles données nous collectons
            </h2>
            <p className="mt-3">
              Lorsque vous utilisez Kobo, nous collectons les données suivantes :
            </p>
            <p className="mt-3 font-medium text-stone-800">
              Données de compte <span className="font-normal text-stone-500">(lors de l&apos;inscription)</span> :
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Nom</li>
              <li>Numéro de téléphone</li>
              <li>Adresse email</li>
              <li>Mot de passe (stocké de façon chiffrée, jamais en clair)</li>
              <li>Nom de l&apos;entreprise, adresse, logo (facultatifs)</li>
            </ul>
            <p className="mt-3 font-medium text-stone-800">Données liées à l&apos;usage du service :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Informations saisies dans le calculateur de prix (non associées à votre
                compte si vous n&apos;êtes pas connecté)
              </li>
              <li>
                Factures créées : nom et téléphone de vos clients, produits, montants,
                statuts de paiement
              </li>
              <li>
                Historique de vos achats de crédits (montant, pack, statut, référence de
                transaction)
              </li>
            </ul>
            <p className="mt-3 font-medium text-stone-800">Données techniques :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Adresse IP, type de navigateur, journaux de connexion (pour la sécurité
                et la prévention de la fraude)
              </li>
            </ul>
            <p className="mt-3">
              Nous ne collectons <strong className="font-medium text-stone-800">aucune donnée bancaire</strong>{' '}
              directement : les paiements sont traités par notre partenaire de
              paiement, Chariow (voir section 5).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              3. Pourquoi nous utilisons vos données
            </h2>
            <p className="mt-3">Nous utilisons vos données uniquement pour :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Vous permettre de créer un compte et d&apos;utiliser les fonctionnalités
                de Kobo (calcul de prix, facturation, gestion de crédits)
              </li>
              <li>
                Générer vos factures PDF et vous permettre de les partager (notamment
                via WhatsApp)
              </li>
              <li>Traiter vos achats de crédits et vous en attribuer le bénéfice</li>
              <li>
                Assurer la sécurité de la plateforme (prévention de la fraude,
                isolation de vos données par rapport aux autres utilisateurs)
              </li>
              <li>
                Vous contacter en cas de besoin lié à votre compte (ex. réinitialisation
                de mot de passe)
              </li>
              <li>
                Améliorer le service (statistiques d&apos;usage agrégées et anonymisées)
              </li>
            </ul>
            <p className="mt-3">
              Nous n&apos;utilisons jamais vos données à des fins de revente à des
              tiers, ni de publicité ciblée.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              4. Qui a accès à vos données
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                <strong className="font-medium text-stone-800">Vous seul</strong> avez
                accès à vos factures, vos clients et votre historique. Un contrôle
                technique garantit qu&apos;un autre utilisateur de Kobo ne peut jamais
                accéder à vos données.
              </li>
              <li>
                <strong className="font-medium text-stone-800">Notre équipe (administrateurs Kobo)</strong>{' '}
                peut accéder aux données strictement nécessaires pour assurer le support
                technique, la sécurité, ou la validation manuelle d&apos;un paiement,
                dans le respect de la confidentialité.
              </li>
              <li>
                <strong className="font-medium text-stone-800">Vos clients</strong> ne
                voient que les informations que vous choisissez de partager avec eux (le
                contenu de la facture que vous leur envoyez).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              5. Partage avec des prestataires tiers
            </h2>
            <p className="mt-3">
              Pour fonctionner, Kobo s&apos;appuie sur des prestataires techniques qui
              traitent certaines données en notre nom, dans le strict cadre de leur
              mission :
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-800">
                    <th className="px-4 py-3 font-semibold">Prestataire</th>
                    <th className="px-4 py-3 font-semibold">Rôle</th>
                    <th className="px-4 py-3 font-semibold">Données concernées</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-stone-800">Chariow</td>
                    <td className="px-4 py-3">
                      Traitement des paiements pour l&apos;achat de crédits
                    </td>
                    <td className="px-4 py-3">
                      Numéro de téléphone, montant, référence de transaction
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-stone-800">Vercel</td>
                    <td className="px-4 py-3">Hébergement de l&apos;application</td>
                    <td className="px-4 py-3">Données techniques de connexion</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-stone-800">Supabase</td>
                    <td className="px-4 py-3">Hébergement de la base de données</td>
                    <td className="px-4 py-3">
                      L&apos;ensemble des données stockées dans Kobo
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Ces prestataires n&apos;utilisent vos données que pour exécuter le service
              demandé et ne sont pas autorisés à les réutiliser à d&apos;autres fins.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              6. Combien de temps nous conservons vos données
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                Les données de votre compte et vos factures sont conservées tant que
                votre compte est actif.
              </li>
              <li>
                Si vous supprimez votre compte, vos données personnelles sont supprimées
                ou anonymisées dans un délai raisonnable, sauf obligation légale de
                conservation (par exemple à des fins comptables).
              </li>
              <li>
                L&apos;historique de vos transactions de paiement peut être conservé plus
                longtemps si la loi l&apos;exige.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">7. Vos droits</h2>
            <p className="mt-3">Vous disposez à tout moment du droit de :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Accéder aux données que nous détenons sur vous</li>
              <li>Demander la correction d&apos;une information inexacte</li>
              <li>Demander la suppression de votre compte et de vos données</li>
              <li>
                Vous opposer à un traitement de vos données que vous jugeriez abusif
              </li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous à{' '}
              <a
                href="mailto:kobo@gmail.com"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                kobo@gmail.com
              </a>
              . Nous répondrons dans un délai raisonnable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              8. Sécurité de vos données
            </h2>
            <p className="mt-3">
              Nous mettons en œuvre des mesures techniques pour protéger vos données :
              mots de passe chiffrés, connexions sécurisées, isolation stricte des
              données entre utilisateurs, contrôle d&apos;accès par rôle pour notre
              équipe. Aucun système n&apos;étant infaillible à 100&nbsp;%, nous vous
              encourageons à choisir un mot de passe robuste et à ne le partager avec
              personne.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              9. Utilisateurs mineurs
            </h2>
            <p className="mt-3">
              Kobo est destiné aux commerçants et vendeurs, généralement majeurs. Nous
              ne collectons pas sciemment de données concernant des personnes mineures.
              Si vous pensez qu&apos;un compte a été créé par un mineur, contactez-nous
              pour que nous puissions agir en conséquence.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">
              10. Modifications de cette politique
            </h2>
            <p className="mt-3">
              Nous pouvons être amenés à modifier cette politique de confidentialité,
              notamment en cas d&apos;évolution du service ou de la réglementation.
              Toute modification importante vous sera communiquée (par email ou
              notification dans l&apos;application) avant son entrée en vigueur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">11. Contact</h2>
            <p className="mt-3">
              Pour toute question relative à cette politique de confidentialité :{' '}
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
