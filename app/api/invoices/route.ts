import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createInvoiceSchema = z.object({
  clientName: z.string().min(1),
  clientPhone: z.string().min(8),
  items: z.array(z.object({
    designation: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })).min(1),
  discount: z.number().min(0).default(0),
  discountPercent: z.number().min(0).max(100).optional(),
  deliveryFee: z.number().min(0).default(0),
  amountPaid: z.number().min(0).default(0),
  paymentMode: z.enum(['ESPECES', 'MOBILE_MONEY', 'VIREMENT', 'AUTRE']).optional(),
  subtotal: z.number().min(0),
  totalAmount: z.number().min(0),
  remainingAmount: z.number().min(0),
  status: z.enum(['PAYE', 'PARTIEL', 'NON_PAYE']),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedFields = createInvoiceSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: validatedFields.error.issues[0].message },
        { status: 400 }
      )
    }

    const { items, ...invoiceData } = validatedFields.data

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Numéro de facture séquentiel PAR UTILISATEUR, format KOBO-AAAA-NNNN
    const lastInvoice = await prisma.invoice.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    let nextNumber = 1
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/KOBO-(\d{4})-(\d+)/)
      if (match) {
        const year = parseInt(match[1])
        const num = parseInt(match[2])
        const currentYear = new Date().getFullYear()
        if (year === currentYear) {
          nextNumber = num + 1
        }
      }
    }

    const invoiceNumber = `KOBO-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`

    // La création d'une facture est gratuite : la prévisualisation en ligne est libre.
    // Le crédit (1 facture = 1 crédit) n'est débité qu'à la génération/téléchargement
    // du PDF (route /api/invoices/[id]/pdf).
    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        invoiceNumber,
        clientName: invoiceData.clientName,
        clientPhone: invoiceData.clientPhone,
        subtotal: invoiceData.subtotal,
        discount: invoiceData.discount,
        discountPercent: invoiceData.discountPercent,
        deliveryFee: invoiceData.deliveryFee,
        totalAmount: invoiceData.totalAmount,
        amountPaid: invoiceData.amountPaid,
        remainingAmount: invoiceData.remainingAmount,
        paymentMode: invoiceData.paymentMode,
        status: invoiceData.status,
        items: {
          create: items.map(item => ({
            designation: item.designation,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error('Invoice creation error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de la facture' },
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const where: any = {
      userId: session.user.id,
    }

    if (search) {
      // Pas de mode: 'insensitive' — non supporté par le connecteur SQLite
      // (crash Prisma). La recherche reste sensible à la casse pour le MVP.
      where.OR = [
        { clientName: { contains: search } },
        { invoiceNumber: { contains: search } },
      ]
    }

    if (status) {
      where.status = status
    }

    // Filtre par date (§5.8) : dateFrom inclus, dateTo inclus (fin de journée)
    if (dateFrom || dateTo) {
      where.date = {}
      const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
      const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null
      if (from && !isNaN(from.getTime())) where.date.gte = from
      if (to && !isNaN(to.getTime())) where.date.lte = to
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Invoices fetch error:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}