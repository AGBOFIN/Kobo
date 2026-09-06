import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { logError, requestMeta } from '@/lib/errors/log-error'

export type AdminSession = {
  id: string
  email?: string | null
  name?: string | null
  role: 'ADMIN' | 'USER'
}

/**
 * Garde d'accès admin pour toutes les routes /api/admin/*.
 *
 * Le brief (§10, §15) exige une vérification du rôle au niveau serveur,
 * systématique — jamais uniquement côté UI ou middleware. Retourne soit la
 * session admin, soit une réponse 401/403 prête à être renvoyée.
 */
export async function requireAdmin(
  request?: Request
): Promise<{ session: AdminSession; error: null } | { session: null; error: NextResponse }> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    }
  }

  if (session.user.role !== 'ADMIN') {
    await logError({
      errorType: 'ADMIN_ACCESS_DENIED',
      message: `Tentative d'accès admin par un non-admin : ${session.user.email || session.user.id}`,
      userId: session.user.id,
      ...(request ? requestMeta(request) : {}),
    })
    return {
      session: null,
      error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }),
    }
  }

  return {
    session: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: 'ADMIN',
    },
    error: null,
  }
}
