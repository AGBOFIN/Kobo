import { describe, it, expect, beforeEach } from '@jest/globals'
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit'

describe('Limiteur de débit (fenêtre glissante en mémoire)', () => {
  beforeEach(() => {
    resetRateLimit()
  })

  it('laisse passer jusqu\'à la limite', () => {
    const key = 'test:allow'
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit(key, 5, 60_000)
      expect(r.allowed).toBe(true)
    }
    expect(checkRateLimit(key, 5, 60_000).allowed).toBe(false)
  })

  it('refuse au-delà de la limite avec un retry-after cohérent', () => {
    const key = 'test:deny'
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000)
    const refused = checkRateLimit(key, 3, 60_000)
    expect(refused.allowed).toBe(false)
    expect(refused.retryAfter).toBeGreaterThanOrEqual(1)
    expect(refused.retryAfter).toBeLessThanOrEqual(60)
  })

  it('les clés sont indépendantes', () => {
    for (let i = 0; i < 3; i++) checkRateLimit('test:a', 3, 60_000)
    expect(checkRateLimit('test:a', 3, 60_000).allowed).toBe(false)
    expect(checkRateLimit('test:b', 3, 60_000).allowed).toBe(true)
  })

  it('la fenêtre glissante réautorise après expiration', () => {
    const key = 'test:window'
    for (let i = 0; i < 2; i++) checkRateLimit(key, 2, 50)
    expect(checkRateLimit(key, 2, 50).allowed).toBe(false)
    // Après expiration de la fenêtre (50 ms), le bucket se vide
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(checkRateLimit(key, 2, 50).allowed).toBe(true)
        resolve()
      }, 80)
    })
  })

  it('resetRateLimit(key) ne réinitialise que la clé visée', () => {
    for (let i = 0; i < 2; i++) checkRateLimit('test:x', 2, 60_000)
    for (let i = 0; i < 2; i++) checkRateLimit('test:y', 2, 60_000)
    resetRateLimit('test:x')
    expect(checkRateLimit('test:x', 2, 60_000).allowed).toBe(true)
    expect(checkRateLimit('test:y', 2, 60_000).allowed).toBe(false)
  })
})
