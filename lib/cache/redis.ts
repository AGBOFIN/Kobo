/**
 * Cache Redis avec Upstash
 * 
 * Utilisation :
 * - Cache des requêtes DB fréquentes
 * - Cache des soldes utilisateurs
 * - Rate limiting
 * 
 * Variables d'environnement requises :
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from '@upstash/redis'

// Singleton pattern
let redis: Redis | null = null

export function getRedis() {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn('Upstash Redis not configured. Cache will be disabled.')
      return null
    }
    
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  
  return redis
}

/**
 * Cache une facture pendant 1 heure
 */
export async function cacheInvoice(invoiceId: string, data: any, ttl = 3600) {
  const client = getRedis()
  if (!client) return
  
  try {
    await client.set(`invoice:${invoiceId}`, JSON.stringify(data), { ex: ttl })
  } catch (error) {
    console.error('Error caching invoice:', error)
  }
}

/**
 * Récupère une facture depuis le cache
 */
export async function getCachedInvoice(invoiceId: string) {
  const client = getRedis()
  if (!client) return null
  
  try {
    const data = await client.get(`invoice:${invoiceId}`)
    return data ? JSON.parse(data as string) : null
  } catch (error) {
    console.error('Error getting cached invoice:', error)
    return null
  }
}

/**
 * Cache le solde d'un utilisateur pendant 5 minutes
 */
export async function cacheUserBalance(userId: string, balance: number, ttl = 300) {
  const client = getRedis()
  if (!client) return
  
  try {
    await client.set(`balance:${userId}`, balance, { ex: ttl })
  } catch (error) {
    console.error('Error caching user balance:', error)
  }
}

/**
 * Récupère le solde depuis le cache
 */
export async function getCachedUserBalance(userId: string) {
  const client = getRedis()
  if (!client) return null
  
  try {
    return await client.get<number>(`balance:${userId}`)
  } catch (error) {
    console.error('Error getting cached balance:', error)
    return null
  }
}

/**
 * Invalide le cache d'une facture
 */
export async function invalidateInvoiceCache(invoiceId: string) {
  const client = getRedis()
  if (!client) return
  
  try {
    await client.del(`invoice:${invoiceId}`)
  } catch (error) {
    console.error('Error invalidating invoice cache:', error)
  }
}

/**
 * Invalide le cache du solde d'un utilisateur
 */
export async function invalidateUserBalanceCache(userId: string) {
  const client = getRedis()
  if (!client) return
  
  try {
    await client.del(`balance:${userId}`)
  } catch (error) {
    console.error('Error invalidating balance cache:', error)
  }
}
