import { prisma } from '@/lib/db/prisma'

/**
 * Journalisation centralisée des erreurs applicatives (table ErrorLog),
 * consultable uniquement depuis l'espace admin.
 *
 * Règles (brief §16) :
 *  - ne JAMAIS logger de clé API ni de secret ;
 *  - les données sensibles (mots de passe, tokens) ne passent jamais dans
 *    `message` / `context` — ne passer que des identifiants et des types.
 *
 * Best-effort : un échec de log ne doit jamais masquer l'erreur d'origine.
 */
export async function logError(params: {
  errorType: string
  message: string
  stackTrace?: string
  context?: Record<string, unknown>
  userId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  try {
    await prisma.errorLog.create({
      data: {
        errorType: params.errorType,
        message: params.message.slice(0, 2000),
        stackTrace: params.stackTrace?.slice(0, 4000),
        context: params.context ? JSON.stringify(sanitize(params.context)) : null,
        userId: params.userId || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent?.slice(0, 500) || null,
      },
    })
  } catch (loggingError) {
    console.error('[Kobo] logError a échoué:', loggingError)
  }
}

/** Retire toute clé ressemblant à un secret avant sérialisation. */
function sanitize(context: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if (/secret|password|token|key|authorization/i.test(key)) {
      clean[key] = '[REDACTED]'
    } else {
      clean[key] = value
    }
  }
  return clean
}

/** Extrait adresse IP / user-agent d'une requête Next. */
export function requestMeta(request: Request): {
  ipAddress: string | null
  userAgent: string | null
} {
  const h = request.headers
  return {
    ipAddress:
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      h.get('x-real-ip') ||
      null,
    userAgent: h.get('user-agent'),
  }
}
