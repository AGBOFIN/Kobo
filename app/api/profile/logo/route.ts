import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { logError, requestMeta } from '@/lib/errors/log-error'
import { mkdir, writeFile, unlink } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * Upload du logo du vendeur (brief §16 : validation type/taille avant stockage).
 *
 *  - Formats acceptés : PNG ou JPEG (vérification par MAGIC BYTES, pas par le
 *    Content-Type déclaré par le navigateur) ;
 *  - Taille max : 2 Mo ;
 *  - Stockage hors de public/ : storage/uploads/<userId>-<random>.<ext>,
 *    servi par la route publique GET /api/uploads/[file] ;
 *  - L'ancien logo est supprimé du disque après remplacement.
 */
const MAX_SIZE = 2 * 1024 * 1024 // 2 Mo

function detectImageType(buffer: Buffer): 'png' | 'jpg' | null {
  if (buffer.length < 12) return null
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return 'png'
  // JPEG : FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  return null
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('logo')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image trop lourde (2 Mo maximum)' },
        { status: 413 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const type = detectImageType(buffer)

    if (!type) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilisez PNG ou JPG.' },
        { status: 415 }
      )
    }

    // Sur Vercel (filesystem éphémère), on écrit dans /tmp : l'image servie
    // par /api/uploads/[file] ne survit pas à l'instance → voir la doc de
    // déploiement : brancher S3/R2 pour un stockage de logos persistant.
    const uploadsDir = process.env.VERCEL === '1'
      ? path.join('/tmp', 'kobo-storage', 'uploads')
      : path.join(process.cwd(), 'storage', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Supprime l'ancien logo du disque s'il existe
    const previous = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { logoUrl: true },
    })
    if (previous?.logoUrl) {
      const oldName = previous.logoUrl.split('/').pop()
      if (oldName && /^[\w.-]+$/.test(oldName)) {
        await unlink(path.join(uploadsDir, oldName)).catch(() => {})
      }
    }

    const fileName = `${session.user.id}-${crypto.randomBytes(6).toString('hex')}.${type}`
    await writeFile(path.join(uploadsDir, fileName), buffer)

    const logoUrl = `/api/uploads/${fileName}`
    await prisma.user.update({
      where: { id: session.user.id },
      data: { logoUrl },
    })

    return NextResponse.json({ logoUrl }, { status: 201 })
  } catch (error) {
    console.error('Logo upload error:', error)
    await logError({
      errorType: 'LOGO_UPLOAD_ERROR',
      message: error instanceof Error ? error.message : String(error),
      ...(request ? requestMeta(request) : {}),
    })
    return NextResponse.json({ error: "Erreur lors de l'upload du logo" }, { status: 500 })
  }
}

/** Supprime le logo du vendeur (disque + base). */
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { logoUrl: true },
    })

    if (user?.logoUrl) {
      const oldName = user.logoUrl.split('/').pop()
      if (oldName && /^[\w.-]+$/.test(oldName)) {
        await unlink(path.join(process.cwd(), 'storage', 'uploads', oldName)).catch(() => {})
      }
      await prisma.user.update({
        where: { id: session.user.id },
        data: { logoUrl: null },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logo delete error:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression du logo' }, { status: 500 })
  }
}
