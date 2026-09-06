/**
 * Limiteur de débit en mémoire (fenêtre glissante) — MVP mono-instance.
 *
 * Choix délibéré pour le MVP : pas de dépendance externe (Redis). Suffisant
 * tant que l'app tourne sur une seule instance. AVANT un passage multi-instances
 * (Vercel serverless ou scaling horizontal), remplacer le store par Redis —
 * l'interface `check()` est conçue pour ça (voir note en bas de fichier).
 */

type Bucket = {
  /** Horodatages (ms) des requêtes acceptées dans la fenêtre courante */
  hits: number[]
}

const buckets = new Map<string, Bucket>()

/** Purge périodique des buckets inactifs (évite la croissance indéfinie). */
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    if (bucket.hits.length === 0 || now - bucket.hits[bucket.hits.length - 1] > CLEANUP_INTERVAL_MS) {
      buckets.delete(key)
    }
  }
}

export type RateLimitResult = {
  /** true si la requête est autorisée */
  allowed: boolean
  /** Requêtes restantes dans la fenêtre */
  remaining: number
  /** Secondes à attendre avant le prochain essai (si refusé) */
  retryAfter: number
}

/**
 * Vérifie et consomme un jeton pour la clé donnée.
 * @param key      identifiant unique (ex: "login:ip:1.2.3.4", "purchase:user:abc")
 * @param limit    nombre max de requêtes dans la fenêtre
 * @param windowMs taille de la fenêtre en millisecondes
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  cleanup(now)

  const bucket = buckets.get(key) || { hits: [] }
  // Ne garde que les hits encore dans la fenêtre
  bucket.hits = bucket.hits.filter(t => now - t < windowMs)

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket)
    const oldest = bucket.hits[0]
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    }
  }

  bucket.hits.push(now)
  buckets.set(key, bucket)

  return {
    allowed: true,
    remaining: limit - bucket.hits.length,
    retryAfter: 0,
  }
}

/**
 * Lecture seule : la fenêtre est-elle dépassée pour cette clé ?
 * N'enregistre PAS de requête — utilisé quand on veut ne compter que les
 * échecs (ex: login : on vérifie à l'entrée, on consomme un jeton à l'échec).
 */
export function peekRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)
  const hits = bucket ? bucket.hits.filter(t => now - t < windowMs) : []

  if (hits.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)),
    }
  }
  return { allowed: true, remaining: limit - hits.length, retryAfter: 0 }
}

/** Réinitialise un bucket (utile pour les tests). */
export function resetRateLimit(key?: string) {
  if (key) buckets.delete(key)
  else buckets.clear()
}

/** Extrait l'IP client d'une requête Next (proxy/CDN friendly). */
export function clientIp(request: Request): string {
  const h = request.headers
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * En-têtes standard à joindre aux réponses 429 (bonne pratique RFC 6585+).
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'Retry-After': String(result.retryAfter),
  }
}

/**
 * NOTE MULTI-INSTANCES : pour un déploiement serverless/multi-instances,
 * remplacer l'implémentation par un store partagé (Redis / Upstash). La
 * signature `checkRateLimit(key, limit, windowMs)` reste identique : seul ce
 * fichier change. Le débit de la route webhook Chariow ne doit PAS être
 * limité côté instance (Chariow peut retenter 5 fois) — voir la route pour
 * la stratégie retenue (limite large basée sur l'IP + priorité à la signature).
 */
