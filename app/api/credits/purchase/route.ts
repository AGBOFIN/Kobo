import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { getPaymentProvider } from '@/lib/payment'
import { logError, requestMeta } from '@/lib/errors/log-error'
import { checkRateLimit, clientIp, rateLimitHeaders } from '@/lib/security/rate-limit'

const purchaseCreditsSchema = z.object({
  packId: z.string(),
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

    // Rate limiting achat de crédits : 10 / utilisateur / 10 min
    // (anti-spam de créations de transactions paiement)
    const rlUser = checkRateLimit(`purchase:user:${session.user.id}`, 10, 10 * 60 * 1000)
    if (!rlUser.allowed) {
      return NextResponse.json(
        { error: 'Trop de demandes. Réessayez dans quelques minutes.' },
        { status: 429, headers: rateLimitHeaders(rlUser) }
      )
    }
    // Et une garde par IP : 20 / 10 min (comptes multiples abuseurs)
    const rlIp = checkRateLimit(`purchase:ip:${clientIp(request)}`, 20, 10 * 60 * 1000)
    if (!rlIp.allowed) {
      return NextResponse.json(
        { error: 'Trop de demandes. Réessayez dans quelques minutes.' },
        { status: 429, headers: rateLimitHeaders(rlIp) }
      )
    }

    const body = await request.json()
    const validatedFields = purchaseCreditsSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: validatedFields.error.issues[0].message },
        { status: 400 }
      )
    }

    const { packId } = validatedFields.data

    const pack = await prisma.creditPack.findUnique({
      where: { id: packId },
    })

    if (!pack || !pack.active) {
      return NextResponse.json(
        { error: 'Pack de crédits non trouvé' },
        { status: 404 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    })

    const { provider, name: providerName } = getPaymentProvider()

    // Chariow exige un téléphone client (champ requis de l'API checkout) —
    // mieux vaut un message clair ici qu'une erreur API générique plus loin.
    if (providerName === 'CHARIOW' && !user?.phone) {
      return NextResponse.json(
        { error: 'Ajoutez votre numéro de téléphone dans votre profil (Profil → Téléphone) avant de payer — il est requis par la plateforme de paiement.' },
        { status: 400 }
      )
    }

    // L'URL de retour après paiement (checkout Chariow)
    const origin = request.nextUrl.origin
    const callbackUrl = `${origin}/dashboard/credits`

    const paymentResult = await provider.initiatePayment(
      pack.price,
      session.user.id,
      packId,
      {
        description: `Achat du pack « ${pack.name} » — ${pack.creditsCount} crédits Kobo`,
        email: user?.email,
        name: user?.name,
        phone: user?.phone || undefined,
        callbackUrl,
        // Recommandation doc Chariow : IP de l'acheteur pour les moyens de
        // paiement proposés au checkout (mobile money selon le pays).
        customerIp: clientIp(request),
        // Chariow : le prix est porté par le produit côté Chariow — chaque
        // pack Kobo doit être associé à un produit (voir env.example).
        productId: (pack as any).chariowProductId || undefined,
      }
    )

    if (!paymentResult.success || !paymentResult.transactionRef) {
      await logError({
        errorType: 'PAYMENT_INIT_FAILED',
        message: paymentResult.error || 'Erreur lors de l\'initialisation du paiement',
        context: {
          provider: providerName,
          packId,
          packName: pack.name,
        },
        userId: session.user.id,
        ...requestMeta(request),
      })
      // Message générique côté client : le détail technique (401 clé API,
      // réseau, réponse inattendue du provider…) reste dans le journal des
      // erreurs, consultable par l'admin (Dashboard → Admin → Erreurs).
      return NextResponse.json(
        { error: 'Le paiement en ligne est momentanément indisponible. Notre équipe a été notifiée — réessayez dans quelques instants.' },
        { status: 502 }
      )
    }

    const purchase = await prisma.creditPurchase.create({
      data: {
        userId: session.user.id,
        packId,
        amount: pack.price,
        creditsPurchased: pack.creditsCount,
        status: 'EN_ATTENTE',
        provider: providerName,
        transactionRef: paymentResult.transactionRef,
      },
    })

    // FedaPay : on redirige l'utilisateur vers le checkout sécurisé.
    // Mode manuel : le paiement se fait hors-ligne et l'admin confirme.
    return NextResponse.json(
      {
        purchase,
        provider: providerName,
        paymentUrl: paymentResult.paymentUrl || null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Credit purchase error:', error)
    await logError({
      errorType: 'PAYMENT_PURCHASE_EXCEPTION',
      message: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'achat de crédits' },
      { status: 500 }
    )
  }
}