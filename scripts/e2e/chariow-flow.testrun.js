/**
 * E2E — Flux d'achat Chariow simulé de bout en bout (brief §5.5 / §18).
 *
 * Prérequis d'exécution :
 *  1. fake API Chariow  : node scripts/e2e/fake-chariow.js        (port 4599)
 *  2. instance Kobo test: npm run dev -- -p 3110
 *     avec DATABASE_URL=file:./prisma/e2e.db et CHARIOW_API_KEY/PULSE_SECRET
 *     + CHARIOW_API_URL=http://localhost:4599/v1
 *  3. node scripts/e2e/chariow-flow.testrun.js
 *
 * Scénario complet :
 *  A. Login admin → création d'un pack mappé sur un produit Chariow fake
 *  B. Inscription d'un vendeur → checkout via POST /api/credits/purchase
 *     → l'URL de paiement renvoyée pointe vers la fake API
 *  C. Webhooks (dans l'ordre) :
 *     C1. sans signature              → 401, aucun crédit
 *     C2. mauvais secret (clé API)    → 401, aucun crédit
 *     C3. signé, vente "awaiting"     → 200, aucun crédit
 *     C4. signé, vente "completed"    → 200, +15 crédits EXACTEMENT
 *     C5. même livraison rejouée      → 200 "dupliquée", toujours 15 crédits
 *     C6. nouvelle livraison, même vente → 200, toujours 15 crédits
 *     C7. payload forgé (+5000 crédits) signé valide → crédits controlés par
 *         le pack en base, pas par le payload → toujours 15
 *     C8. failed.sale signé sur une 2e vente → achat ECHOUE, aucun crédit
 */
const { PrismaClient } = require('@prisma/client')

const KOBO = 'http://localhost:3110'
const PULSE_SECRET = 'whsec_e2e_0123456789abcdef'
const API_KEY = 'sk_test_e2e_key'

const prisma = new PrismaClient()
let failures = 0

// Ids de livraison uniques par exécution : la déduplication Chariow est
// persistante en base, un re-run ne doit pas être confondu avec la précédente.
const RUN = Date.now().toString(36)
const dl = suffix => `dl_${RUN}_${suffix}`

const ok = (condition, label, detail = '') => {
  const mark = condition ? '  OK' : '  FAIL'
  console.log(`${mark} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!condition) failures++
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function api(path, options = {}) {
  const res = await fetch(`${KOBO}${path}`, { ...options, redirect: 'manual' })
  let body = null
  try {
    body = await res.json()
  } catch {}
  return { status: res.status, body, headers: res.headers }
}

/** Signe un corps brut comme un vrai Pulse Chariow. */
async function sendPulse({ event, sale, deliveryId }) {
  const payload = JSON.stringify({ event, ...(sale ? { sale } : {}) })
  const { createHmac } = require('crypto')
  const signature =
    'sha256=' + createHmac('sha256', PULSE_SECRET).update(payload, 'utf8').digest('hex')

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'x-chariow-signature': signature,
    'x-pulse-event': event,
  }
  if (deliveryId) headers['x-pulse-delivery-id'] = deliveryId

  const res = await fetch(`${KOBO}/api/credits/webhook/chariow`, {
    method: 'POST',
    headers,
    body: payload,
  })
  let body = null
  try {
    body = await res.json()
  } catch {}
  return { status: res.status, body }
}

/** Envoi brut (signature fausse ou absente). */
async function sendRawPulse(rawBody, headers = {}) {
  const res = await fetch(`${KOBO}/api/credits/webhook/chariow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: rawBody,
  })
  let body = null
  try {
    body = await res.json()
  } catch {}
  return { status: res.status, body }
}

const balance = async userId => {
  const cb = await prisma.creditBalance.findUnique({ where: { userId } })
  return cb?.balanceCredits ?? 0
}

async function main() {
  console.log('=== E2E Chariow — flux d\'achat simulé ===\n')

  // ===== A. Préparation : pack mappé sur un produit Chariow fake =====
  let pack = await prisma.creditPack.findFirst({
    where: { price: 1000, creditsCount: 15 },
  })
  if (pack) {
    pack = await prisma.creditPack.update({
      where: { id: pack.id },
      data: { chariowProductId: 'prd_e2e_standard', active: true },
    })
  } else {
    pack = await prisma.creditPack.create({
      data: {
        name: 'Pack Standard',
        price: 1000,
        creditsCount: 15,
        chariowProductId: 'prd_e2e_standard',
        active: true,
      },
    })
  }
  console.log(`Pack: ${pack.name} (${pack.id}) → produit Chariow prd_e2e_standard\n`)

  // ===== B. Inscription vendeur + checkout via l'API Kobo =====
  const vendorEmail = `e2e-${Date.now()}@kobo.test`
  const reg = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Vendeur E2E', email: vendorEmail, phone: '90000001', password: 'e2epass123' }),
  })
  ok(reg.status === 200 || reg.status === 201, `B0 inscription vendeur (${reg.status})`, reg.body?.error || '')

  // NextAuth : récupération du CSRF puis POST du formulaire credentials
  const csrfRes = await fetch(`${KOBO}/api/auth/csrf`)
  const csrfBody = await csrfRes.json()
  const csrfCookies = (csrfRes.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ')
  const login = await fetch(`${KOBO}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      cookie: csrfCookies,
    },
    body: new URLSearchParams({
      email: vendorEmail,
      password: 'e2epass123',
      csrfToken: csrfBody.csrfToken,
    }).toString(),
    redirect: 'manual',
  })
  const cookies = login.headers.getSetCookie?.() || []
  const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ')
  ok(
    cookies.some(c => c.includes('session-token')),
    'B1 login vendeur (cookie de session reçu)',
    `status=${login.status}`
  )

  const purchase = await api('/api/credits/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    body: JSON.stringify({ packId: pack.id }),
  })
  ok(purchase.status === 201, 'B2 checkout initié (201)', JSON.stringify(purchase.body).slice(0, 160))
  ok(
    typeof purchase.body?.paymentUrl === 'string' &&
      purchase.body.paymentUrl.includes('localhost:4599/checkout/'),
    'B3 URL de paiement = checkout fake Chariow',
    purchase.body?.paymentUrl || 'undefined'
  )
  const saleId = purchase.body?.purchase?.transactionRef || purchase.body?.paymentUrl?.split('/').pop()
  ok(typeof saleId === 'string' && saleId.startsWith('sal_'), 'B4 référence de vente Chariow', saleId)

  const vendor = await prisma.user.findUnique({ where: { email: vendorEmail } })
  const balanceAfterCheckout = await balance(vendor.id)
  ok(balanceAfterCheckout === 0, 'B5 aucun crédit après le simple checkout', `solde=${balanceAfterCheckout}`)
  const purchaseRow = await prisma.creditPurchase.findFirst({ where: { userId: vendor.id }, orderBy: { createdAt: 'desc' } })
  ok(purchaseRow?.status === 'EN_ATTENTE', 'B6 achat EN_ATTENTE en base')

  const fake = await fetch(`http://localhost:4599/v1/sales/${saleId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  }).then(r => r.json())
  ok(fake?.data?.status === 'awaiting_payment', 'B7 la fake API connaît la vente (awaiting_payment)')

  console.log('')

  // ===== C1. Webhook sans signature =====
  const rawPayload = JSON.stringify({ event: 'successful.sale', sale: { id: saleId } })
  const c1 = await sendRawPulse(rawPayload)
  ok(c1.status === 401, 'C1 webhook sans signature → 401', `status=${c1.status}`)
  ok((await balance(vendor.id)) === 0, 'C1 aucun crédit')

  // ===== C2. Mauvais secret (la clé API au lieu du secret Pulse) =====
  const c2 = await sendRawPulse(rawPayload, { 'x-chariow-signature': 'sha256=' + require('crypto').createHmac('sha256', API_KEY).update(rawPayload).digest('hex'), 'x-pulse-delivery-id': dl('bad_secret') })
  ok(c2.status === 401, 'C2 mauvais secret → 401', `status=${c2.status}`)
  ok((await balance(vendor.id)) === 0, 'C2 aucun crédit')

  // ===== C3. Webhook signé mais vente non payée =====
  const c3 = await sendPulse({ event: 'successful.sale', sale: { id: saleId }, deliveryId: dl('first') })
  ok(c3.status === 200, 'C3 webhook signé (vente awaiting) → 200', `status=${c3.status}`)
  await sleep(300)
  ok((await balance(vendor.id)) === 0, 'C3 aucun crédit tant que l\'API Chariow dit "awaiting_payment"', `solde=${await balance(vendor.id)}`)

  // ===== C4. La vente est réglée chez Chariow, nouvelle livraison signée =====
  await fetch(`http://localhost:4599/confirm/${saleId}`, { method: 'POST' })
  const c4 = await sendPulse({
    event: 'successful.sale',
    sale: { id: saleId, status: 'completed', custom_metadata: { kobo_user_id: vendor.id, kobo_pack_id: pack.id } },
    deliveryId: dl('confirm'),
  })
  ok(c4.status === 200, 'C4 webhook signé (vente completed) → 200', `status=${c4.status}`)
  await sleep(500)
  const balAfterConfirm = await balance(vendor.id)
  ok(balAfterConfirm === 15, 'C4 crédits ajoutés : EXACTEMENT 15', `solde=${balAfterConfirm}`)

  // ===== C5. Même livraison rejouée (retry Chariow, même delivery-id) =====
  const c5 = await sendPulse({
    event: 'successful.sale',
    sale: { id: saleId, status: 'completed' },
    deliveryId: dl('confirm'),
  })
  ok(c5.status === 200, 'C5 retry même livraison → 200 accusé', `status=${c5.status}`)
  ok((await balance(vendor.id)) === 15, 'C5 toujours 15 crédits (dédup delivery-id)', `solde=${await balance(vendor.id)}`)

  // ===== C6. Nouvelle livraison du même événement (delivery-id différent) =====
  const c6 = await sendPulse({
    event: 'successful.sale',
    sale: { id: saleId, status: 'completed' },
    deliveryId: dl('replay_new_id'),
  })
  ok(c6.status === 200, 'C6 nouvelle livraison même vente → 200', `status=${c6.status}`)
  ok((await balance(vendor.id)) === 15, 'C6 toujours 15 crédits (idempotence métier)', `solde=${await balance(vendor.id)}`)

  // ===== C7. Payload forgé : +5000 crédits avec signature valide =====
  const c7 = await sendPulse({
    event: 'successful.sale',
    sale: {
      id: saleId,
      status: 'completed',
      custom_metadata: { kobo_user_id: vendor.id, kobo_pack_id: pack.id, credits: 5000 },
      amount: { value: 5000 },
    },
    deliveryId: dl('forge'),
  })
  ok(c7.status === 200, 'C7 payload forgé → 200', `status=${c7.status}`)
  ok((await balance(vendor.id)) === 15, 'C7 crédits contrôlés par le pack en base, pas par le payload', `solde=${await balance(vendor.id)}`)

  // ===== C8a. failed.sale alors que l'API Chariow dit "awaiting_payment" =====
  const purchase2 = await api('/api/credits/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    body: JSON.stringify({ packId: pack.id }),
  })
  const saleId2 = purchase2.body?.purchase?.transactionRef
  ok(purchase2.status === 201 && typeof saleId2 === 'string', 'C8a 2e checkout initié', saleId2)

  await sendPulse({ event: 'failed.sale', sale: { id: saleId2 }, deliveryId: dl('failed_early') })
  await sleep(300)
  const row2early = await prisma.creditPurchase.findUnique({
    where: { provider_transactionRef: { provider: 'CHARIOW', transactionRef: saleId2 } },
  })
  ok(
    row2early?.status === 'EN_ATTENTE',
    'C8a webhook échec + API "awaiting" → contradiction : Kobo reste EN_ATTENTE (l\'API fait foi)',
    row2early?.status
  )
  ok((await balance(vendor.id)) === 15, 'C8a toujours 15 crédits', `solde=${await balance(vendor.id)}`)

  // ===== C8b. failed.sale confirmé par l'API Chariow =====
  await fetch(`http://localhost:4599/fail/${saleId2}`, { method: 'POST' })
  await sendPulse({ event: 'failed.sale', sale: { id: saleId2 }, deliveryId: dl('failed') })
  await sleep(300)
  const purchase2Row = await prisma.creditPurchase.findUnique({
    where: { provider_transactionRef: { provider: 'CHARIOW', transactionRef: saleId2 } },
  })
  ok(purchase2Row?.status === 'ECHOUE', 'C8b failed.sale + API "failed" → achat ECHOUE', purchase2Row?.status)
  ok((await balance(vendor.id)) === 15, 'C8b toujours 15 crédits', `solde=${await balance(vendor.id)}`)

  // ===== D. Traçabilité =====
  const logs = await prisma.webhookLog.count({ where: { provider: 'CHARIOW' } })
  ok(logs >= 8, 'D1 toutes les réceptions webhook journalisées (WebhookLog)', `${logs} entrées`)

  console.log(`\n=== ${failures === 0 ? 'TOUT PASSE' : failures + ' ÉCHEC(S)'} ===`)
  process.exitCode = failures === 0 ? 0 : 1
}

main()
  .catch(e => {
    console.error('E2E fatal:', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
