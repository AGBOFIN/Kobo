import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { readPdf } from '@/lib/pdf/files'

/**
 * Partage temporaire d'un PDF de facture à un client (lien inclus dans le
 * message WhatsApp). Le lien contient un jeton aléatoire à usage unique par
 * facture (généré à la création du PDF) : aucune authentification n'est
 * requise pour le client, mais le jeton est impossible à deviner.
 *
 * Le fichier n'est jamais accessible en accès public permanent : seule cette
 * route peut le servir, et uniquement si le jeton correspond.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { pdfToken: token },
      select: { id: true, invoiceNumber: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
    }

    // Lecture par ID global (le numéro n'est unique que par utilisateur)
    const buffer = await readPdf(invoice.id)

    if (!buffer) {
      return NextResponse.json({ error: 'Document indisponible' }, { status: 410 })
    }

    const filename = `${invoice.invoiceNumber}.pdf`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('PDF share error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}