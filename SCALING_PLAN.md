# Plan de Migration et Scaling - Kobo SaaS

## 📊 Analyse de l'Architecture Actuelle

### **Stack Technique**
- **Frontend** : Next.js 16.3.4 (React 19) sur Vercel
- **Backend** : Next.js API Routes (serverless)
- **Base de données** : Supabase PostgreSQL (Free tier)
- **Auth** : NextAuth v5 avec Prisma adapter
- **PDF** : @react-pdf/renderer
- **PWA** : next-pwa

### **Bottlenecks Identifiés**

1. **Base de données** - Supabase Free (500 MB, 1 GB transfer/mois)
2. **Stockage PDF** - Stockage local Vercel (éphémère)
3. **Connexions DB** - Pool Prisma non optimisé
4. **Mise en cache** - Pas de cache (Redis, CDN)
5. **Monitoring** - Pas de monitoring en place

---

## 🎯 Objectifs de Capacité

| Phase | Utilisateurs Actifs | Utilisateurs Enregistrés | Factures/Mois |
|-------|-------------------|-------------------------|----------------|
| Actuel | 50-200 | 500-1,000 | 5,000-20,000 |
| Phase 1 | 500-1,000 | 5,000-10,000 | 50,000-100,000 |
| Phase 2 | 2,000-5,000 | 20,000-50,000 | 200,000-500,000 |
| Phase 3 | 10,000+ | 100,000+ | 1,000,000+ |

---

## 📋 Plan de Migration par Phase

### **PHASE 1 : Préparation (Immédiat)**

#### 1.1 Optimiser Prisma Client
```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClient = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Optimisations pour production
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Configuration du pool de connexions
const prismaClient = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Singleton pattern
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient

export const prisma = prismaClient
```

#### 1.2 Ajouter Vercel Analytics
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
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

#### 1.3 Configurer Supabase Monitoring
- Activer les logs dans Supabase Dashboard
- Configurer les alertes pour :
  - CPU > 80%
  - Memory > 80%
  - Connection pool saturation

---

### **PHASE 2 : Upgrade Supabase (1,000 utilisateurs)**

#### 2.1 Migrer vers Supabase Pro ($25/mois)

**Bénéfices :**
- 8 GB de stockage
- 50 GB de transfert/mois
- Compute amélioré
- Backups automatiques

**Actions :**
1. Upgrader le projet Supabase dans le dashboard
2. Mettre à jour les variables d'environnement Vercel
3. Tester en staging

#### 2.2 Optimiser les requêtes Prisma

**Index supplémentaires à ajouter :**
```prisma
// Dans schema.prisma
model Invoice {
  // ... champs existants
  
  @@index([userId, date])  // Pour les factures récentes par utilisateur
  @@index([status, date])   // Pour les filtres admin
  @@index([invoiceNumber]) // Optimiser la recherche par numéro
}

model CreditPurchase {
  // ... champs existants
  
  @@index([userId, createdAt]) // Historique achats utilisateur
  @@index([status, createdAt])  // Filtrer par statut
}
```

#### 2.3 Migration SQL
```sql
-- Créer les index optimisés
CREATE INDEX "Invoice_userId_date_idx" ON "Invoice"("userId", "date" DESC);
CREATE INDEX "Invoice_status_date_idx" ON "Invoice"("status", "date" DESC);
CREATE INDEX "CreditPurchase_userId_createdAt_idx" ON "CreditPurchase"("userId", "createdAt" DESC);
```

---

### **PHASE 3 : Stockage PDF sur Cloudflare R2 (2,000 utilisateurs)**

#### 3.1 Pourquoi Cloudflare R2 ?
- **Coût** : $0.015/GB/mois (vs $0.09/GB pour AWS S3)
- **egress gratuit** : Pas de frais de téléchargement
- **S3-compatible** : Facile à intégrer
- **CDN intégré** : Distribution mondiale

#### 3.2 Installation
```bash
npm install @aws-sdk/client-s3
```

#### 3.3 Configuration

```typescript
// lib/storage/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadPdf(invoiceId: string, pdfBuffer: Buffer) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: `invoices/${invoiceId}.pdf`,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
  })

  await s3Client.send(command)
  return `https://${process.env.R2_PUBLIC_DOMAIN}/invoices/${invoiceId}.pdf`
}

export async function getPdfUrl(invoiceId: string) {
  return `https://${process.env.R2_PUBLIC_DOMAIN}/invoices/${invoiceId}.pdf`
}
```

#### 3.4 Variables d'environnement Vercel
```
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_BUCKET_NAME=kobo-invoices
R2_PUBLIC_DOMAIN=<your-custom-domain>
```

#### 3.5 Migrer la logique PDF
```typescript
// Modifier app/api/invoices/[id]/pdf/route.ts
import { uploadPdf, getPdfUrl } from '@/lib/storage/r2'

// Remplacer savePdf/readPdf par uploadPdf/getPdfUrl
const pdfUrl = await uploadPdf(invoice.id, buffer)
await prisma.invoice.update({
  where: { id: invoice.id },
  data: { pdfUrl, pdfToken },
})
```

---

### **PHASE 4 : Mise en Cache avec Redis (5,000 utilisateurs)**

#### 4.1 Pourquoi Redis ?
- **Cache DB** : Réduire les requêtes PostgreSQL
- **Session store** : Sessions NextAuth
- **Rate limiting** : Protection contre abus
- **Queue** : Tâches en arrière-plan

#### 4.2 Option 1 : Upstash Redis (recommandé)
- **Coût** : Free tier suffisant pour début
- **Edge-ready** : Compatible Vercel Edge
- **Facile à intégrer**

```bash
npm install @upstash/redis
```

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function cacheInvoice(invoiceId: string, data: any, ttl = 3600) {
  await redis.set(`invoice:${invoiceId}`, JSON.stringify(data), { ex: ttl })
}

export async function getCachedInvoice(invoiceId: string) {
  const data = await redis.get(`invoice:${invoiceId}`)
  return data ? JSON.parse(data as string) : null
}

export async function cacheUserBalance(userId: string, balance: number, ttl = 300) {
  await redis.set(`balance:${userId}`, balance, { ex: ttl })
}

export async function getCachedUserBalance(userId: string) {
  return await redis.get<number>(`balance:${userId}`)
}
```

#### 4.2 Option 2 : Vercel KV (alternatif)
- Intégré nativement à Vercel
- Coût : $0.50/GB/mois
- Moins flexible qu'Upstash

#### 4.3 Implémentation dans les routes
```typescript
// app/api/invoices/[id]/route.ts
import { cacheInvoice, getCachedInvoice } from '@/lib/cache/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // Essayer le cache d'abord
  const cached = await getCachedInvoice(id)
  if (cached) {
    return NextResponse.json({ invoice: cached })
  }
  
  // Sinon, requête DB
  const invoice = await prisma.invoice.findUnique({ where: { id } })
  
  // Mettre en cache
  await cacheInvoice(id, invoice)
  
  return NextResponse.json({ invoice })
}
```

---

### **PHASE 5 : Vercel Pro + Monitoring (10,000 utilisateurs)**

#### 5.1 Upgrader Vercel Pro ($20/mois)

**Bénéfices :**
- Pas de timeout (60s → illimité)
- Edge Functions améliorées
- Analytics avancés
- Support prioritaire

#### 5.2 Configurer Vercel Analytics
```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

#### 5.3 Monitoring avec Sentry
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

#### 5.4 Alertes configurées
- Erreurs > 50/heure
- Temps de réponse > 3s
- Taux d'erreur > 1%
- Revenus journaliers en baisse

---

### **PHASE 6 : Optimisations Avancées (Enterprise)**

#### 6.1 Read Replicas PostgreSQL
- Configurer des replicas de lecture Supabase
- Router les requêtes de lecture vers les replicas
- Écrire vers le primary

#### 6.2 Queue System pour PDF
```bash
npm install bullmq
```

Générer les PDF en arrière-plan pour ne pas bloquer les requêtes utilisateur.

#### 6.3 Multi-region
- Déployer sur plusieurs régions Vercel
- Load balancer avec Vercel Edge
- Database multi-region avec Supabase

---

## 💰 Estimation des Coûts

### **Phase Actuelle (Free)**
- Vercel Hobby : $0
- Supabase Free : $0
- **Total : $0/mois**

### **Phase 1 (1,000 utilisateurs)**
- Vercel Hobby : $0
- Supabase Pro : $25/mois
- Cloudflare R2 : ~$1/mois (est. 100 GB PDF)
- **Total : ~$26/mois**

### **Phase 2 (5,000 utilisateurs)**
- Vercel Hobby : $0
- Supabase Pro : $25/mois
- Cloudflare R2 : ~$5/mois (est. 500 GB PDF)
- Upstash Redis : $0 (Free tier)
- **Total : ~$30/mois**

### **Phase 3 (10,000 utilisateurs)**
- Vercel Pro : $20/mois
- Supabase Pro : $25/mois
- Cloudflare R2 : ~$10/mois (est. 1 TB PDF)
- Upstash Redis : $5/mois
- Sentry : $0 (Free tier)
- **Total : ~$60/mois**

### **Phase 4 (50,000 utilisateurs)**
- Vercel Pro : $20/mois
- Supabase Pro ($50 tier) : $50/mois
- Cloudflare R2 : ~$50/mois (est. 5 TB PDF)
- Upstash Redis : $20/mois
- Sentry : $26/mois
- **Total : ~$166/mois**

---

## 📅 Roadmap de Migration

### **Semaine 1-2 : Préparation**
- [ ] Optimiser Prisma client
- [ ] Ajouter Vercel Analytics
- [ ] Configurer monitoring Supabase
- [ ] Créer staging environment

### **Semaine 3-4 : Upgrade Supabase**
- [ ] Upgrader vers Supabase Pro
- [ ] Ajouter index DB
- [ ] Migrer données existantes
- [ ] Tester en staging

### **Semaine 5-6 : Stockage PDF**
- [ ] Créer compte Cloudflare R2
- [ ] Implémenter upload R2
- [ ] Migrer PDF existants
- [ ] Mettre à jour les routes

### **Semaine 7-8 : Cache Redis**
- [ ] Créer compte Upstash
- [ ] Implémenter cache DB
- [ ] Implémenter cache sessions
- [ ] A/B testing

### **Semaine 9-10 : Monitoring**
- [ ] Upgrader Vercel Pro
- [ ] Configurer Sentry
- [ ] Configurer alertes
- [ ] Documentation runbooks

---

## 🎯 Points de Validation

### **KPIs à suivre**
- **Temps de réponse API** : < 200ms (p95)
- **Taux d'erreur** : < 0.1%
- **Uptime** : > 99.9%
- **Temps de génération PDF** : < 3s
- **Coût par utilisateur** : < $0.50/mois

### **Alertes critiques**
- DB connection pool > 80%
- CPU Vercel > 80%
- Erreurs > 1%
- Temps de réponse > 2s
- Espace disque > 80%

---

## 📚 Ressources Utiles

- [Vercel Scaling Guide](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Supabase Scaling](https://supabase.com/docs/guides/platform/scaling)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Upstash Redis](https://upstash.com/docs/redis)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

---

## 🚀 Conclusion

Ce plan permet de scaler Kobo de **50 utilisateurs actifs** à **10,000+ utilisateurs actifs** avec une progression graduelle des coûts de **$0/mois** à **~$60/mois**.

**Points clés :**
1. ✅ Upgrader progressivement (pas de big bang)
2. ✅ Monitorer en permanence
3. ✅ Optimiser avant de payer plus
4. ✅ Garder les coûts par utilisateur bas
