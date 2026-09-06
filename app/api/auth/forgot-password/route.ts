import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import crypto from 'crypto'
import { logError } from '@/lib/errors/log-error'
import { checkRateLimit, clientIp, rateLimitHeaders } from '@/lib/security/rate-limit'
import { hashToken } from '@/lib/security/tokens'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting : 5 demandes / IP / 15 min (anti-abus d'envoi d'emails)
    const ip = clientIp(request)
    const rl = checkRateLimit(`forgot:ip:${ip}`, 5, 15 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de demandes. Réessayez dans quelques minutes.' },
        { status: 429, headers: rateLimitHeaders(rl) }
      )
    }

    const body = await request.json()
    const validatedFields = forgotPasswordSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: validatedFields.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email } = validatedFields.data

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Si cet email existe, vous recevrez un lien de réinitialisation' },
        { status: 200 }
      )
    }

    // Le token envoyé par email est aléatoire ; seule son EMPREINTE SHA-256
    // est stockée en base — une fuite de la base ne permet pas de réinitialiser
    // un mot de passe (§16).
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 heure

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashToken(resetToken),
        resetTokenExpiry,
      },
    })

    // MVP : pas encore d'envoi d'email (blocage séparé côté produit).
    // Le lien est journalisé côté serveur uniquement — jamais renvoyé au client.
    console.log(`Reset link: ${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`)

    return NextResponse.json(
      { message: 'Si cet email existe, vous recevrez un lien de réinitialisation' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    await logError({
      errorType: 'AUTH_FORGOT_PASSWORD_ERROR',
      message: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}