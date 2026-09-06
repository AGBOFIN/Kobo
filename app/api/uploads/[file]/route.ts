import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

/**
 * Sert les logos uploadés depuis storage/uploads/ (hors de public/).
 *
 * Sécurité :
 *  - nom de fichier strictement validé (charset limité) → pas de traversal ;
 *  - seuls PNG / JPEG sont servis, avec les bons Content-Type + en-têtes de cache ;
 *  - le nom est imprévisible (userId + aléatoire) : l'URL d'un logo n'est pas
 *    devinable, et un logo n'expose aucune donnée au-delà de l'image elle-même.
 */
const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ file: string }> }
) {
  const { file } = await context.params

  if (!/^[\w-]+\.(png|jpg)$/.test(file)) {
    return NextResponse.json({ error: 'Fichier invalide' }, { status: 400 })
  }

  const ext = file.split('.').pop() as string
  // Vercel : /tmp ; local : storage/uploads (voir app/api/profile/logo/route.ts)
  const uploadsDir = process.env.VERCEL === '1'
    ? path.join('/tmp', 'kobo-storage', 'uploads')
    : path.join(process.cwd(), 'storage', 'uploads')
  const filePath = path.join(uploadsDir, file)

  try {
    const data = await readFile(filePath)
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        'Content-Type': MIME[ext],
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Image non trouvée' }, { status: 404 })
  }
}
