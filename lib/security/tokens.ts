import { createHash } from 'crypto'

/**
 * Empreinte SHA-256 d'un token de réinitialisation.
 *
 * Le token envoyé à l'utilisateur est aléatoire (256 bits) ; seule son
 * empreinte est stockée en base : une fuite de la base ne permet pas de
 * réinitialiser un mot de passe. La comparaison se fait empreinte contre
 * empreinte (pas de timing attack exploitable sur SHA-256 d'un secret 256 bits).
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}
