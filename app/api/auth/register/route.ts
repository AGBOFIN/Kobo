import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedFields = registerSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: validatedFields.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password } = validatedFields.data

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Sécurité : forcer le rôle à USER - aucune élévation de privilège possible
    // Même si quelqu'un injecte un champ 'role' dans la requête, il sera ignoré
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: 'USER', // Toujours USER, jamais ADMIN - sécurité critique
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    await prisma.creditBalance.create({
      data: {
        userId: user.id,
        balanceCredits: 0,
      },
    })

    return NextResponse.json(
      { message: 'Compte créé avec succès', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    
    // Messages d'erreur plus spécifiques selon le type d'erreur
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      })
      
      if (error.message.includes('DATABASE_URL') || error.message.includes('PrismaClientInitializationError')) {
        return NextResponse.json(
          { error: 'Erreur de configuration de la base de données. Veuillez contacter le support.' },
          { status: 500 }
        )
      }
      
      if (error.message.includes('unique constraint') || error.message.includes('email')) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé. Essayez de vous connecter à la place.' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Une erreur technique est survenue. Veuillez réessayer ou contacter le support.' },
      { status: 500 }
    )
  }
}