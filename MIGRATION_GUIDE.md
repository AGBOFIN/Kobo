# Guide de Migration Rapide - Kobo Scaling

## 🚀 Actions Immédiates (Cette semaine)

### 1. Optimiser Prisma Client
✅ **Fait** - Voir `lib/db/prisma.ts` (déjà optimisé avec singleton pattern)

### 2. Ajouter Vercel Analytics
```bash
npm install @vercel/analytics
```

Ajouter dans `app/layout.tsx` :
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 3. Upgrader Supabase Free → Pro ($25/mois)
1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner le projet Kobo
3. Settings → Billing → Upgrade to Pro
4. Coût : $25/mois
5. Bénéfices : 8 GB storage, 50 GB transfer

### 4. Créer un compte Cloudflare R2
1. Aller sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. R2 → Create Bucket → `kobo-invoices`
3. Créer API Token (R2 API Token)
4. Ajouter les variables d'environnement Vercel :
   ```
   R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=<your-access-key>
   R2_SECRET_ACCESS_KEY=<your-secret-key>
   R2_BUCKET_NAME=kobo-invoices
   ```

### 5. Installer les dépendances
```bash
npm install @aws-sdk/client-s3 @upstash/redis @vercel/analytics
```

---

## 📋 Étapes de Migration (Progressives)

### Semaine 1 : Monitoring
- [ ] Installer Vercel Analytics
- [ ] Configurer Supabase Monitoring
- [ ] Créer compte Sentry (optionnel)
- [ ] Documenter les métriques actuelles

### Semaine 2 : Base de données
- [ ] Upgrader Supabase → Pro
- [ ] Ajouter les index DB (voir SCALING_PLAN.md)
- [ ] Tester en staging
- [ ] Monitorer les performances

### Semaine 3 : Stockage PDF
- [ ] Créer compte Cloudflare R2
- [ ] Implémenter `lib/storage/r2.ts` (déjà créé)
- [ ] Modifier `app/api/invoices/[id]/pdf/route.ts`
- [ ] Migrer les PDF existants
- [ ] Tester le téléchargement

### Semaine 4 : Cache
- [ ] Créer compte Upstash Redis (Free tier)
- [ ] Implémenter `lib/cache/redis.ts` (déjà créé)
- [ ] Ajouter cache aux routes critiques
- [ ] A/B testing performance

---

## 💰 Coûts Progressifs

| Phase | Mensuel | Capacité |
|-------|---------|----------|
| Actuel | $0 | 50-200 utilisateurs |
| + Analytics | $0 | 50-200 utilisateurs |
| + Supabase Pro | $25 | 1,000 utilisateurs |
| + R2 Storage | $26 | 1,000 utilisateurs |
| + Redis Cache | $30 | 5,000 utilisateurs |
| + Vercel Pro | $50 | 10,000 utilisateurs |

---

## ⚡ Optimisations Rapides (Sans changement d'infrastructure)

### 1. Ajouter des index DB
```sql
-- Exécuter dans Supabase SQL Editor
CREATE INDEX "Invoice_userId_date_idx" ON "Invoice"("userId", "date" DESC);
CREATE INDEX "Invoice_status_date_idx" ON "Invoice"("status", "date" DESC);
```

### 2. Optimiser les requêtes
```typescript
// Éviter N+1 queries
const invoices = await prisma.invoice.findMany({
  include: { user: true, items: true },
  where: { userId },
  orderBy: { date: 'desc' },
  take: 10,
})
```

### 3. Pagination pour les listes
```typescript
// Ajouter pagination
const invoices = await prisma.invoice.findMany({
  where: { userId },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { date: 'desc' },
})
```

---

## 🎯 Points de Validation

### KPIs à surveiller
- **Temps de réponse API** : < 200ms (p95)
- **Taux d'erreur** : < 0.1%
- **Uptime** : > 99.9%
- **Coût par utilisateur** : < $0.50/mois

### Alertes à configurer
- CPU > 80%
- Memory > 80%
- Connection pool > 80%
- Erreurs > 1%
- Temps de réponse > 2s

---

## 📚 Ressources

- [SCALING_PLAN.md](./SCALING_PLAN.md) - Plan détaillé complet
- [lib/cache/redis.ts](./lib/cache/redis.ts) - Implémentation Redis
- [lib/storage/r2.ts](./lib/storage/r2.ts) - Implémentation R2
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)

---

## ✅ Checklist de Pré-Production

### Avant upgrade
- [ ] Backup de la base de données
- [ ] Tests de performance
- [ ] Documentation de runbooks
- [ ] Configurer staging environment
- [ ] Alertes monitoring actives

### Pendant upgrade
- [ ] Effectuer pendant heures creuses
- [ ] Monitorer en temps réel
- [ ] Avoir rollback plan
- [ ] Communiquer aux utilisateurs

### Après upgrade
- [ ] Vérifier les métriques
- [ ] Tester les fonctionnalités critiques
- [ ] Monitorer pendant 24h
- [ ] Documenter les leçons apprises
