import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

/**
 * Endpoint pour calculer le chiffre d'affaires
 * Disponible pour les utilisateurs du Pack Pro
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier si l'utilisateur a le Pack Pro
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        creditPurchases: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            pack: true,
          },
        },
      },
    })

    const hasProPack = user?.creditPurchases.some(
      (purchase) => purchase.pack && purchase.pack.name === 'Pack Pro'
    )

    if (!hasProPack) {
      return NextResponse.json(
        { error: 'Cette fonctionnalité est réservée au Pack Pro' },
        { status: 403 }
      )
    }

    // Calculer le chiffre d'affaires total
    const invoices = await prisma.invoice.findMany({
      where: { userId: session.user.id },
      select: {
        totalAmount: true,
        amountPaid: true,
        status: true,
        date: true,
      },
    })

    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    const totalPaid = invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0)
    const totalOutstanding = totalRevenue - totalPaid

    // Chiffre d'affaires par mois (6 derniers mois)
    const now = new Date()
    const monthlyRevenue: Record<string, number> = {}

    for (let i = 0; i < 6; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = month.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
      
      const monthInvoices = invoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.date)
        return (
          invoiceDate.getMonth() === month.getMonth() &&
          invoiceDate.getFullYear() === month.getFullYear()
        )
      })

      monthlyRevenue[monthKey] = monthInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
    }

    return NextResponse.json({
      totalRevenue,
      totalPaid,
      totalOutstanding,
      monthlyRevenue,
      invoiceCount: invoices.length,
    })
  } catch (error) {
    console.error('Revenue stats error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
