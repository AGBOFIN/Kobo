import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { generateInvoicePDF } from '@/lib/pdf/generator'
import { savePdf, readPdf, generatePdfToken } from '@/lib/pdf/files'

/**
 * Route de téléchargement / génération du PDF d'une facture.
 *
 * Règles métier :
 *  - La prévisualisation en ligne (page de détail) est GRATUITE.
 *  - Le PDF consomme 1 crédit à la première génération/téléchargement.
 *  - Les téléchargements suivants sont gratuits (fichier déjà généré).
 *  - Seul le propriétaire de la facture peut générer/télécharger.
 *
 * Note : cette route est volontairement accessible en GET (téléchargement
 * direct depuis un lien), avec effet de bord uniquement à la première
 * génération, quand aucun PDF n'existe encore.
 */

async function ensureAndGetPdf(invoiceId: string, userId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: {
      items: true,
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          address: true,
          companyName: true,
          logoUrl: true,
        },
      },
    },
  })

  if (!invoice) {
    return { error: 'NOT_FOUND' as const }
  }

  // Cache indexé par l'ID global de la facture (jamais le numéro, qui n'est
  // unique que par utilisateur — voir lib/pdf/files.ts).
  // Sur Vercel, le filesystem est éphémère : cache froid possible même pour un
  // PDF déjà payé. Le marqueur « déjà généré/payé » est alors Invoice.pdfToken :
  // une régénération après paiement est TOUJOURS gratuite.
  const existing = await readPdf(invoice.id)
  if (existing) {
    return { buffer: existing, invoice, charged: false }
  }
  const alreadyPaid = Boolean(invoice.pdfToken)

  // Première génération : vérifier et consommer 1 crédit (sauf si déjà payé,
  // cf. alreadyPaid ci-dessus — cache froid en serverless)
  const balance = await prisma.creditBalance.findUnique({
    where: { userId },
  })

  if (!balance || balance.balanceCredits <= 0) {
    return {
      error: 'NO_CREDITS' as const,
      message: 'Crédits insuffisants. Achetez un pack de crédits pour générer le PDF.',
    }
  }

  const buffer = await generateInvoicePDF({
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      clientName: invoice.clientName,
      clientPhone: invoice.clientPhone,
      clientEmail: invoice.clientEmail || undefined,
      clientAddress: invoice.clientAddress || undefined,
      dueDate: invoice.dueDate || undefined,
      items: invoice.items.map(item => ({
        designation: item.designation,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      deliveryFee: invoice.deliveryFee,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      remainingAmount: invoice.remainingAmount,
      status: invoice.status,
      paymentMode: invoice.paymentMode || undefined,
    },
    seller: {
      name: invoice.user.name,
      phone: invoice.user.phone || undefined,
      address: invoice.user.address || undefined,
      companyName: invoice.user.companyName || undefined,
      email: invoice.user.email || undefined,
      // react-pdf fetch l'image côté serveur : l'URL relative doit être rendue
      // absolue (base = NEXTAUTH_URL).
      logoUrl: invoice.user.logoUrl
        ? new URL(invoice.user.logoUrl, process.env.NEXTAUTH_URL || 'http://localhost:3000').toString()
        : undefined,
    },
  })

  if (alreadyPaid) {
    await savePdf(invoice.id, buffer)
    return { buffer, invoice, charged: false }
  }

  await savePdf(invoice.id, buffer)
  const pdfToken = generatePdfToken()

  // Débit atomique du crédit + enregistrement du PDF
  const downloadUrl = `/api/invoices/${invoice.id}/pdf`
  const updated = await prisma.$transaction(async tx => {
    const decremented = await tx.creditBalance.updateMany({
      where: { userId, balanceCredits: { gt: 0 } },
      data: { balanceCredits: { decrement: 1 } },
    })

    if (decremented.count === 0) {
      throw new Error('NO_CREDITS')
    }

    return tx.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl: downloadUrl, pdfToken },
      select: { id: true },
    })
  })

  void updated

  return { buffer, invoice, charged: true }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const result = await ensureAndGetPdf(id, session.user.id)

    if (result.error === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    if (result.error === 'NO_CREDITS') {
      return NextResponse.json(
        { error: result.message || 'Crédits insuffisants' },
        { status: 402 }
      )
    }

    const filename = `${result.invoice.invoiceNumber}.pdf`
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(result.buffer.length),
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error: any) {
    if (error?.message === 'NO_CREDITS') {
      return NextResponse.json(
        { error: 'Crédits insuffisants. Achetez un pack de crédits.' },
        { status: 402 }
      )
    }
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la génération du PDF' },
      { status: 500 }
    )
  }
}