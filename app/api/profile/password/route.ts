import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'

/**
 * POST /api/profile/password — changement de mot de passe par l'utilisateur
 * connecté (Profil → Changer le mot de passe).
 *
 * Sécurité :
 *  - session requise ;
 *  - rate limit par utilisateur : 5 tentatives / 15 min (l'endpoint vérifie le
 *    mot de passe ACTUEL, il faut donc le protéger du brute-force comme login) ;
 *  - le mot de passe actuel est obligatoire (pas de changement silencieux sur
 *    une session ouverte) ;
 *  - tout lien de réinitialisation en attente est invalidé.
 *
 * Limite connue (MVP) : les autres sessions JWT de l'utilisateur restent
 * valables — une invalidation fine des sessions exigerait un numéro de version
 * de token (évolution prévue avec la vérification DB déjà en place dans le
 * callback jwt).
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z
    .string()
    .min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Anti brute-force du mot de passe actuel (clé par utilisateur)
    const rl = checkRateLimit(
      `pwd-change:user:${session.user.id}`,
      5,
      15 * 60 * 1000
    )
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
        { status: 429, headers: rateLimitHeaders(rl) }
      )
    }

    const body = await request.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })
    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: 'Compte introuvable' },
        { status: 404 }
      )
    }

    const currentOk = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash
    )
    if (!currentOk) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: hashedPassword,
        // Invalide tout lien « mot de passe oublié » en attente
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json(
      { message: 'Mot de passe modifié avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors du changement de mot de passe' },
      { status: 500 }
    )
  }
}
