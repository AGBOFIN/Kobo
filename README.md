# Kobo - SaaS de Calcul de Prix & Facturation pour Commerçants

## 🎯 Mission

Plateforme web SaaS destinée aux petits commerçants africains (Togo en priorité) qui vendent via WhatsApp, Instagram, Facebook, TikTok ou en boutique physique.

**Objectif principal :** Permettre à un vendeur de calculer son prix de vente et de créer une facture professionnelle partageable sur WhatsApp en moins de 2 minutes.

## 🏗️ Architecture Technique

### Stack Retenue

- **Frontend** : Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend** : Next.js API routes / Server Actions
- **ORM** : Prisma
- **Base de données** : PostgreSQL
- **Génération PDF** : `@react-pdf/renderer` (côté serveur)
- **Authentification** : NextAuth.js v5 (Auth.js)
- **Stockage fichiers** : Stockage local en développement, compatible S3 en production
- **Hébergement** : Vercel + PostgreSQL managé (Supabase ou Neon)

### Justification du Choix

1. **Simplicité de déploiement** : Une seule application Next.js à déployer, pas de synchronisation entre frontend et backend séparés
2. **TypeScript end-to-end** : Partage des types entre frontend et backend
3. **Performance** : Server Actions et API routes optimisés pour les connexions lentes (3G)
4. **Coût** : Hébergement économique sur Vercel avec base de données managée
5. **Extensibilité** : Architecture modulaire qui permettra d'ajouter un backend Laravel dédié si besoin futur
6. **Écosystème** : Auth.js mature, Prisma robuste, excellent support TypeScript

### Structure des Dossiers

```
/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Routes d'authentification (login, register...)
│   ├── (dashboard)/         # Espace utilisateur (dashboard, factures...)
│   ├── (public)/            # Pages publiques (calculateur, landing)
│   ├── (admin)/             # Espace admin
│   └── api/                 # API routes
├── components/              # Composants React réutilisables
├── lib/                     # Utilitaires et fonctions partagées
│   ├── auth/               # Configuration NextAuth
│   ├── db/                 # Client Prisma
│   ├── pdf/                # Génération PDF
│   ├── payment/            # Interface et implémentation paiement
│   └── validations/        # Schémas Zod
├── prisma/                  # Schéma et migrations Prisma
├── public/                  # Assets statiques
└── tests/                   # Tests unitaires et intégration
```

## 🗄️ Schéma de Base de Données

### Entités Principales

- **User** : Utilisateurs (vendeurs et admins)
- **CreditBalance** : Solde de crédits par utilisateur
- **CreditPack** : Packs de crédits disponibles
- **CreditPurchase** : Historique des achats de crédits
- **Invoice** : Factures créées par les utilisateurs
- **InvoiceItem** : Lignes de produits dans les factures
- **Session** : Sessions NextAuth
- **AuditLog** : Journal d'audit pour l'admin
- **ErrorLog** : Journal des erreurs applicatives

### Contraintes de Sécurité

- Toute requête sur `Invoice`, `InvoiceItem`, `CreditPurchase` est filtrée par `user_id`
- `numero_facture` est séquentiel et unique **par utilisateur**, jamais global
- Rôles stricts : `USER` vs `ADMIN` avec vérification côté serveur

## 🔐 Authentification

- Mots de passe hashés avec bcrypt
- Sessions sécurisées via NextAuth.js
- Réinitialisation de mot de passe par lien à usage unique
- Séparation stricte des rôles au niveau middleware

## 💰 Système de Paiement & Crédits

### Packs de Crédits

| Prix | Crédits (factures) |
|------|---------------------|
| 500 FCFA | 5 |
| 1000 FCFA | 15 |
| 2000 FCFA | 50 |

### Architecture de Paiement

- Interface `PaymentProviderInterface` pour changer facilement de fournisseur
- Implémentation `ManualPaymentProvider` pour le MVP (confirmation admin)
- Crédits crédités **uniquement après confirmation explicite** du paiement
- Historique complet et traçable des transactions

**Note** : L'intégration avec un fournisseur réel (Flooz, T-Money, CinetPay, FedaPay) sera ajoutée après le MVP.

## 📱 Fonctionnalités du MVP

### 1. Calculateur de Prix (accès libre)
- Calcul instantané du prix de vente conseillé
- Prise en compte de tous les coûts (transport, emballage, publicité, etc.)
- Affichage clair de la marge bénéficiaire

### 2. Génération de Factures (nécessite compte + crédits)
- Création de factures professionnelles multi-produits
- Calculs automatiques (totaux, réduction, reste à payer)
- Génération PDF côté serveur
- Partage via WhatsApp (lien `wa.me`)

### 3. Dashboard Utilisateur
- Vue d'ensemble de l'activité
- Solde de crédits
- Historique des factures
- Statistiques simples

### 4. Espace Admin
- Gestion des utilisateurs
- Validation des paiements (mode manuel)
- Statistiques de revenus
- Journal des événements

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp env.example .env
# Éditer .env avec vos configurations

# Initialiser la base de données
npx prisma migrate dev

# Lancer le serveur de développement
npm run dev
```

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration
```

## 📝 Conventions de Code

- TypeScript strict
- Pas de commentaires sauf demande explicite
- Code compact et idiomatique
- Validation Zod pour toutes les entrées
- Tests avant implémentation (TDD quand pertinent)

## 🔒 Sécurité

- Validation stricte de toutes les entrées
- Protection CSRF/XSS standard du framework
- Rate limiting sur les routes sensibles
- Isolation totale des données entre utilisateurs
- Logs d'erreurs centralisés (admin uniquement)
- Fichiers uploadés validés en type/taille

## 🌍 Localisation

- Français par défaut
- FCFA (XOF) par défaut
- Architecture prête pour multi-langues et multi-devises

## 📈 Roadmap

1. ✅ Étape 0 - Cadrage et architecture
2. ✅ Étape 1 - Calculateur de prix
3. ✅ Étape 2 - Authentification & profil
4. ✅ Étape 3 - Facturation
5. ✅ Étape 4 - Génération PDF & WhatsApp
6. ✅ Étape 5 - Crédits & paiement (mode manuel + Chariow, E2E simulé 22/22)
7. ✅ Étape 6 - Dashboard & historique
8. ✅ Étape 7 - Administration
9. ✅ Étape 8 - Sécurité & durcissement (isolation E2E 24/24, rate limiting, tokens hashés)
10. 🟡 Étape 9 - Déploiement (préparation Vercel/Neon terminée — migration initiale à générer
    dès réception de la DATABASE_URL de production, voir §Déploiement)

## 🤝 Contribution

Ce projet est développé comme MVP pour une phase de validation avec des utilisateurs réels au Togo.

## 🚀 Déploiement (Vercel + Neon/Supabase)

### 1. Base de données PostgreSQL

Créer une base sur [Neon](https://neon.tech) ou [Supabase](https://supabase.com) (plan gratuit) et récupérer la chaîne de connexion `postgresql://…?sslmode=require` (URL « pooled » recommandée sur Neon).

### 2. Migration initiale — ✅ FAITE

La migration `20260906160849_init` est appliquée sur Supabase et versionnée sous `prisma/migrations/`. Le schéma PostgreSQL utilise `directUrl` (connexion directe :5432) pour les migrations DDL et `DATABASE_URL` (pooler transactionnel :6543, pgbouncer) pour le runtime.

Pour de futures évolutions du schéma :

```bash
cd indefini-saas
cp .env.production .env.migrate-tmp   # ou exporter DATABASE_URL/DIRECT_URL à la main
DATABASE_URL="postgresql://…" DIRECT_URL="postgresql://…" npm run db:migrate -- --name <nom>
```

Les 3 packs de crédits ont été seedés sur la base de production (donnée de configuration, pas de démo). Aucun utilisateur de test n'existe sur la base de production (§19 du cahier des charges).

Ensuite, à chaque évolution du schéma : modifier **les deux** fichiers (`schema.prisma` ET `schema.postgres.prisma`, mêmes modèles), puis régénérer la migration (`migrate dev`) et repousser sur SQLite en dev (`npm run db:dev`).

### 3. Déploiement Vercel

`vercel.json` applique automatiquement `prisma migrate deploy` + `prisma generate` au build.

**Variables d'environnement à définir dans Vercel (Project → Settings → Environment Variables) :**

| Variable | Source | Valeur |
|---|---|---|
| `DATABASE_URL` | Supabase | URL du pooler transactionnel : `postgresql://…:6543/postgres?pgbouncer=true` (Project Settings → Database → Connection string → Transaction pooler). Copiée dans `.env.production` en local. |
| `NEXTAUTH_SECRET` | à générer | `openssl rand -base64 32` — secret NEUF, jamais réutiliser celui du dev |
| `NEXTAUTH_URL` | à générer | `https://<votre-projet>.vercel.app` (à créer après le 1er déploiement, ou le domaine final) — la mettre à jour si le domaine change |
| `APP_URL` | idem | identique à `NEXTAUTH_URL` (liens WhatsApp / partage PDF) |
| `APP_NAME` | fixe | `KOBO` |
| `CHARIOW_API_KEY` | Chariow | app.chariow.com → Settings → API Keys. Absente = mode manuel (validation admin des paiements) |
| `CHARIOW_PULSE_SECRET` | Chariow | Automations → Pulses → Signing secret (`whsec_…`) — à créer APRÈS le déploiement, quand l'URL publique est connue |

`vercel.json` gère le build : `prisma migrate deploy` + `prisma generate` (schéma PostgreSQL) + `next build`. Aucune variable n'est lue depuis `.env`/`.env.production` sur Vercel — tout passe par les Environment Variables du dashboard (`.env.production` n'est utile qu'en local pour `db:migrate`).

**Limitation connue (serverless) :** le filesystem Vercel est éphémère. PDF et logos passent par `/tmp` (fonctionne, mais non persistant entre instances) — brancher un stockage S3/R2 est la suite logique. Les crédits PDF restent corrects : un PDF déjà payé (`Invoice.pdfToken`) est toujours régénéré gratuitement même si le cache `/tmp` est froid.

### 4. Webhook Chariow

Créer un Pulse (app.chariow.com → Automations → Pulses) pointant vers `https://<domaine>/api/credits/webhook/chariow`, événements `successful.sale`, `failed.sale`, `abandoned.sale`, et renseigner le `CHARIOW_PULSE_SECRET` correspondant dans Vercel.

## 📄 Licence

Propriétaire - Kobo