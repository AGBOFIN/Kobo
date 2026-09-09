import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { logError } from '@/lib/errors/log-error'

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedFields = updateProfileSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: validatedFields.error.issues[0].message },
        { status: 400 }
      )
    }

    // Sécurité : s'assurer que le rôle ne peut jamais être modifié via cette API
    // Même si quelqu'un manipule la requête, le champ role sera explicitement ignoré
    const { role, ...safeData } = validatedFields.data as any

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: safeData, // Ne contient jamais le champ role
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        address: true,
        logoUrl: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile update error:', error)
    await logError({
      errorType: 'PROFILE_UPDATE_ERROR',
      message: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        address: true,
        logoUrl: true,
        currency: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}