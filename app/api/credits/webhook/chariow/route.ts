import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  ChariowProvider,
  verifyChariowWebhookSignature,
} from '@/lib/payment/chariow-provider'
import { logError } from '@/lib/errors/log-error'
import { checkRateLimit, clientIp } from '@/lib/security/rate-limit'

/**
 * Webhook Chariow (« Pulses ») — reçoit les événements de vente en temps réel.
 *
 * Règles de sécurité & métier (doc : chariow.dev → Pulse Security) :
 *  1. La signature x-chariow-signature (HMAC-SHA256 du corps BRUT avec le secret
 *     du Pulse) est toujours vérifiée AVANT tout traitement — 401 sinon.
 *  2. Chaque réception est journalisée (WebhookLog) pour l'audit admin.
 *  3. Anti-rejeu / anti-doublon : déduplication sur x-pulse-delivery-id
 *     (identifiant stable pour toutes les tentatives d'une même livraison).
 *     La signature ne portant pas de timestamp, c'est le mécanisme documenté.
 *  4. Le crédit n'est JAMAIS décidé sur la seule parole du webhook : on
 *     re-vérifie le statut de la vente via l'API Chariow (GET /sales/{id}).
 *  5. Le montant crédité est contrôlé : les crédits attribués viennent du pack
 *     enregistré en base au moment de l'achat, jamais d'un champ du webhook
 *     (l'utilisateur ne peut pas influer sur le nombre de crédits).
 *  6. Traitement idempotent : contrainte d'unicité (provider, transactionRef)
 *     + bascule de statut conditionnelle → une vente ne crédite jamais deux fois.
 *
 * Note MVP (décision durcissement étape 8) : traitement maintenu SYNCHRONE,
 * volontairement :
 *  1. Le traitement est court (1 appel API + 2 écritures) — très loin du
 *     timeout de 30 s imposé par Chariow ;
 *  2. En cas d'échec transitoire, on renvoie 4xx/5xx : Chariow retente alors
 *     automatiquement la MÊME livraison (5 essais, backoff exponentiel) et la
 *     clé d'idempotence est libérée → la retry retraite. Une file locale
 *     (BullMQ/in-process) ajouterait une perte de jobs au redémarrage en dev
 *     et une infra (Redis) injustifiée pour le volume MVP ;
 *  3. Le crédit reste exactement-une fois grâce à la dédup + bascule de statut,
 *     quel que soit le nombre de tentatives.
 * À repasser en file asynchrone (worker séparé + Redis/SQS) si le volume ou la
 * latence perçue l'exige — la logique métier ci-dessous est directement
 * transplantable dans un worker.
 */
export async function POST(request: NextRequest) {
  // Rate limiting : 60 / IP / minute — limite LARGE volontairement : Chariow
  // retente légitimement une livraison jusqu'à 5 fois (backoff exponentiel).
  // La sécurité repose d'abord sur la vérification de signature, pas sur le débit.
  const rl = checkRateLimit(`webhook:ip:${clientIp(request)}`, 60, 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429 }
    )
  }

  const rawBody = await request.text()

  let log: { id: string } | null = null

  try {
    const signature = request.headers.get('x-chariow-signature')
    const deliveryId = request.headers.get('x-pulse-delivery-id')
    const headerEvent = request.headers.get('x-pulse-event')
    const webhookSecret = process.env.CHARIOW_PULSE_SECRET || ''

    // Journalisation systématique avant tout traitement (audit)
    let eventType = headerEvent || 'unknown'
    try {
      const parsed = JSON.parse(rawBody)
      eventType = parsed?.event || eventType
    } catch {
      // corps illisible : on logge et on refuse
    }

    // 1. Vérification de la signature (corps brut obligatoire) — AVANT toute
    //    réservation de delivery-id : une requête non signée ne doit jamais
    //    pouvoir squatter une clé d'idempotence.
    if (!verifyChariowWebhookSignature(rawBody, signature, webhookSecret)) {
      await prisma.webhookLog.create({
        data: {
          provider: 'CHARIOW',
          eventType,
          payload: rawBody,
          processed: true,
          error: 'Signature invalide ou absente',
          processedAt: new Date(),
        },
      })
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }

    // 2. Déduplication des livraisons : x-pulse-delivery-id est l'idempotency
    //    key officielle Chariow (stable entre les tentatives d'une livraison).
    //    Contrainte @@unique([provider, deliveryId]). Les tests de dashboard
    //    Chariow n'ont pas de delivery-id et passent par le traitement normal.
    if (deliveryId) {
      const duplicate = await prisma.webhookLog.findUnique({
        where: {
          provider_deliveryId: { provider: 'CHARIOW', deliveryId },
        },
        select: { id: true },
      })

      if (duplicate) {
        // Tentative journalisée sans deliveryId (sinon viol d'unicité)
        await prisma.webhookLog.create({
          data: {
            provider: 'CHARIOW',
            eventType,
            payload: rawBody,
            processed: true,
            error: `Livraison dupliquée de ${deliveryId} (déjà traitée)`,
            processedAt: new Date(),
          },
        })
        return NextResponse.json({ received: true }, { status: 200 })
      }
    }

    log = await prisma.webhookLog.create({
      data: {
        provider: 'CHARIOW',
        eventType,
        deliveryId,
        payload: rawBody,
        processed: false,
      },
      select: { id: true },
    })

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
    }

    const provider = new ChariowProvider()
    const event = await provider.handleWebhook(payload)

    // Événement sans rapport avec une vente (ou abandon) : accusé de réception
    if (!event.success || !event.transactionRef) {
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          processed: true,
          error: event.error || 'Événement ignoré',
          processedAt: new Date(),
        },
      })
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const transactionRef = event.transactionRef
    const purchase = await prisma.creditPurchase.findUnique({
      where: {
        provider_transactionRef: { provider: 'CHARIOW', transactionRef },
      },
    })

    if (!purchase) {
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          // Libère la clé d'idempotence pour que la tentative Chariow
          // (même delivery-id) puisse être retraitée.
          deliveryId: null,
          error: `Aucun achat trouvé pour la vente ${transactionRef}`,
        },
      })
      // Erreur pour que Chariow retente : l'achat peut être créé entre la
      // vente et le webhook dans un cas limite.
      return NextResponse.json({ error: 'Achat introuvable' }, { status: 422 })
    }

    // 3. Re-vérification du statut réel via l'API Chariow (jamais le webhook seul)
    const verified = await provider.checkPaymentStatus(transactionRef)

    if (!verified.success) {
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          // Libère la clé d'idempotence : la vente sera retraitée à la retry
          deliveryId: null,
          error: `Échec de la vérification API : ${verified.error}`,
        },
      })
      return NextResponse.json({ error: 'Vérification API échouée' }, { status: 502 })
    }

    // 4. Application idempotente du crédit (uniquement si encore en attente)
    if (verified.status === 'CONFIRME') {
      const result = await prisma.$transaction(async tx => {
        const updated = await tx.creditPurchase.updateMany({
          where: { id: purchase.id, status: 'EN_ATTENTE' },
          data: { status: 'CONFIRME' },
        })

        if (updated.count === 0) {
          return false // déjà traité (événement dupliqué) : idempotent
        }

        await tx.creditBalance.update({
          where: { userId: purchase.userId },
          data: {
            balanceCredits: { increment: purchase.creditsPurchased },
          },
        })

        return true
      })

      await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          processed: true,
          error: result ? null : 'Événement dupliqué (déjà traité)',
          processedAt: new Date(),
        },
      })

      console.log(
        `[Kobo] Paiement Chariow confirmé : ${transactionRef} → +${purchase.creditsPurchased} crédits (${purchase.userId})`
      )
      return NextResponse.json({ received: true }, { status: 200 })
    }

    if (verified.status === 'ECHOUE') {
      await prisma.creditPurchase.updateMany({
        where: { id: purchase.id, status: 'EN_ATTENTE' },
        data: { status: 'ECHOUE' },
      })

      await prisma.webhookLog.update({
        where: { id: log.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      })

      return NextResponse.json({ received: true }, { status: 200 })
    }

    // EN_ATTENTE : on accuse réception sans créditer
    await prisma.webhookLog.update({
      where: { id: log.id },
      data: {
        processed: true,
        error: 'Vente encore en attente, crédit différé',
        processedAt: new Date(),
      },
    })
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Chariow webhook error:', error)

    // Course concurrente sur la déduplication : une seconde requête a inséré
    // la même deliveryId entre notre findUnique et notre create. On accuse
    // réception sans retraiter (idempotent, pas d'erreur pour Chariow).
    if (error?.code === 'P2002') {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
    }

    await logError({
      errorType: 'WEBHOOK_PROCESSING_ERROR',
      message: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
      context: { provider: 'CHARIOW' },
    })
    if (log?.id) {
      await prisma.webhookLog
        .update({
          where: { id: log.id },
          data: {
            // Libère la clé d'idempotence : la retry Chariow retraitera l'événement
            deliveryId: null,
            error: 'Erreur interne lors du traitement',
          },
        })
        .catch(() => {})
    }
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
