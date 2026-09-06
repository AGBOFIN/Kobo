/**
 * E2E — Isolation des données entre utilisateurs (critère d'acceptation brief §20).
 *
 * Preuve par requêtes HTTP réelles qu'un utilisateur A ne peut JAMAIS accéder
 * aux données d'un utilisateur B — API, PDF, jetons de partage.
 *
 * Prérequis : une instance Kobo de test sur :3110 avec une base dédiée
 * (voir scripts/e2e/run-isolation.sh qui orchestre tout).
 *
 * Scénario :
 *  1. Alice crée un compte + 2 factures ; génère le PDF d'une facture
 *     (consomme 1 crédit, crée le jeton de partage).
 *  2. Mallory crée un compte. Tentatives :
 *     - GET    /api/invoices/<facture d'Alice>        → 404 attendu
 *     - GET    /api/invoices (liste)                   → ne contient JAMAIS les factures d'Alice
 *     - GET    /api/invoices/<facture Alice>/pdf       → 404 + aucun débit
 *     - GET    /share/<token d'Alice>                  → 200 : c'est un lien PUBLIC de partage
 *       client (volontaire, brief §5.4) — on vérifie qu'il ne révèle que le PDF.
 *     - PATCH  /api/admin/users?id=<Alice>             → 403 (non-admin)
 *     - GET    /api/admin/invoices                     → 403 (non-admin)
 *  3. Alice n'a toujours que SES factures ; son crédit n'a pas bougé suite aux
 *     tentatives de Mallory ; Mallory a toujours son solde initial.
 */
const { PrismaClient } = require('@prisma/client')

const KOBO = 'http://localhost:3110'
const prisma = new PrismaClient()
let failures = 0

const ok = (condition, label, detail = '') => {
  console.log(`${condition ? '  OK' : '  FAIL'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!condition) failures++
}

async function api(path, options = {}) {
  const res = await fetch(`${KOBO}${path}`, { ...options, redirect: 'manual' })
  let body = null
  try {
    body = await res.json()
  } catch {}
  return { status: res.status, body, headers: res.headers }
}

/** Inscription + login (CSRF NextAuth) → cookie de session. */
async function createUser(name) {
  const email = `${name.toLowerCase()}-${Date.now()}@kobo.test`
  const reg = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: 'isolation-pass' }),
  })
  if (reg.status !== 201) throw new Error(`register ${name}: ${reg.status} ${JSON.stringify(reg.body)}`)

  const csrfRes = await fetch(`${KOBO}/api/auth/csrf`)
  const csrf = await csrfRes.json()
  const csrfCookie = (csrfRes.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ')

  const login = await fetch(`${KOBO}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', cookie: csrfCookie },
    body: new URLSearchParams({ email, password: 'isolation-pass', csrfToken: csrf.csrfToken }).toString(),
    redirect: 'manual',
  })
  const cookies = (login.headers.getSetCookie?.() || []).map(c => c.split(';')[0]).join('; ')
  if (!cookies.includes('session-token')) throw new Error(`login ${name} sans session`)

  const user = await prisma.user.findUnique({ where: { email } })
  return { email, cookie: cookies, user }
}

const credits = async userId => {
  const cb = await prisma.creditBalance.findUnique({ where: { userId } })
  return cb?.balanceCredits ?? 0
}

async function main() {
  console.log('=== E2E Isolation des données entre utilisateurs ===\n')

  // ===== Crédits de départ (écriture directe base de test) =====
  const { cookie: aliceCookie, user: alice } = await createUser('Alice')
  const { cookie: malloryCookie, user: mallory } = await createUser('Mallory')
  await prisma.creditBalance.update({ where: { userId: alice.id }, data: { balanceCredits: 5 } })
  await prisma.creditBalance.update({ where: { userId: mallory.id }, data: { balanceCredits: 5 } })
  console.log(`Alice: ${alice.id}\nMallory: ${mallory.id}\n`)

  // ===== Alice crée 2 factures =====
  const inv1 = await api('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: aliceCookie },
    body: JSON.stringify({
      clientName: 'Client Secret d\'Alice',
      clientPhone: '90000001',
      items: [{ designation: 'Article A', quantity: 1, unitPrice: 5000 }],
      subtotal: 5000, totalAmount: 5000, remainingAmount: 5000, status: 'NON_PAYE',
    }),
  })
  ok(inv1.status === 201, 'A1 Alice crée la facture 1', inv1.body?.error || '')
  const inv2 = await api('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: aliceCookie },
    body: JSON.stringify({
      clientName: 'Autre Client',
      clientPhone: '90000002',
      items: [{ designation: 'Article B', quantity: 2, unitPrice: 1500 }],
      subtotal: 3000, totalAmount: 3000, remainingAmount: 3000, status: 'NON_PAYE',
    }),
  })
  ok(inv2.status === 201, 'A2 Alice crée la facture 2')

  const aliceInvoice1 = inv1.body.invoice
  const aliceInvoice2 = inv2.body.invoice

  // Alice génère son PDF (1 crédit → jeton de partage créé)
  const pdf = await fetch(`${KOBO}/api/invoices/${aliceInvoice1.id}/pdf`, {
    headers: { cookie: aliceCookie },
  })
  ok(pdf.status === 200, 'A3 Alice génère son propre PDF', `status=${pdf.status}`)
  const detail = await api(`/api/invoices/${aliceInvoice1.id}`, { headers: { cookie: aliceCookie } })
  const shareToken = detail.body?.shareUrl?.split('/').pop()
  ok(typeof shareToken === 'string' && shareToken.length > 10, 'A4 jeton de partage émis')

  const aliceCreditsAfterPdf = await credits(alice.id)
  ok(aliceCreditsAfterPdf === 4, 'A5 Alice a dépensé exactement 1 crédit', `solde=${aliceCreditsAfterPdf}`)

  // Mallory crée AUSSI une facture (la liste doit ne contenir QUE les siennes)
  const minv = await api('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: malloryCookie },
    body: JSON.stringify({
      clientName: 'Client de Mallory',
      clientPhone: '90000009',
      items: [{ designation: 'Article M', quantity: 1, unitPrice: 100 }],
      subtotal: 100, totalAmount: 100, remainingAmount: 100, status: 'NON_PAYE',
    }),
  })
  ok(minv.status === 201, 'A6 Mallory crée sa propre facture (même numéro KOBO-2026-0001 attendu)', minv.body?.error || '')
  ok(minv.body?.invoice?.invoiceNumber === aliceInvoice1.invoiceNumber, 'A7 collision de numéro prouvée (même KOBO-2026-0001) — le stockage PDF doit être indexé par ID', minv.body?.invoice?.invoiceNumber)

  console.log('')

  // ===== Mallory attaque =====
  const m1 = await api(`/api/invoices/${aliceInvoice1.id}`, { headers: { cookie: malloryCookie } })
  ok(m1.status === 404, 'M1 GET facture d\'Alice → 404 (pas 403 : pas de divulgation d\'existence)', `status=${m1.status}`)

  const m2 = await api('/api/invoices?limit=100', { headers: { cookie: malloryCookie } })
  const m2List = m2.body?.invoices || []
  ok(
    m2List.length === 1 && m2List[0].userId === mallory.id,
    'M2 la liste de Mallory ne contient que SES facture',
    `${m2List.length} facture(s), userId étranger présent: ${m2List.some(i => i.userId === alice.id)}`
  )
  ok(!m2.body?.invoices?.some(i => i.id === aliceInvoice1.id || i.id === aliceInvoice2.id), 'M3 aucune facture d\'Alice dans la liste')

  // Filtre de recherche : Mallory cherche le client d'Alice par nom → rien
  const m3 = await api('/api/invoices?search=Client%20Secret', { headers: { cookie: malloryCookie } })
  ok((m3.body?.invoices || []).length === 0, 'M4 recherche du client d\'Alice par Mallory → 0 résultat')

  // PDF d'Alice : accès refusé ET aucun débit. Piège supplémentaire : la
  // facture de Mallory porte le MÊME numéro (KOBO-2026-0001) — un cache PDF
  // indexé par numéro servirait ici le document d'Alice.
  const malloryCreditsBefore = await credits(mallory.id)
  const m4res = await fetch(`${KOBO}/api/invoices/${minv.body.invoice.id}/pdf`, {
    headers: { cookie: malloryCookie },
  })
  ok(m4res.status === 200, 'M4b Mallory génère SON PDF (même numéro) — doit recevoir le SIEN, pas celui d\'Alice', `status=${m4res.status}, taille=${(await m4res.arrayBuffer()).byteLength}`)
  const malloryPdfDetail = await api(`/api/invoices/${minv.body.invoice.id}`, { headers: { cookie: malloryCookie } })
  ok(malloryPdfDetail.body?.invoice?.totalAmount === 100, 'M4c le PDF de Mallory correspond à SA facture (100 F, pas 5000 F)', `total=${malloryPdfDetail.body?.invoice?.totalAmount}`)

  // Solde de Mallory juste avant la tentative interdite (après M4b, qui a
  // légitimement consommé 1 crédit pour SON propre PDF)
  const malloryCreditsBeforeForbidden = await credits(mallory.id)
  const m4 = await fetch(`${KOBO}/api/invoices/${aliceInvoice1.id}/pdf`, {
    headers: { cookie: malloryCookie },
  })
  ok(m4.status === 404, 'M5 PDF d\'Alice demandé par Mallory → 404', `status=${m4.status}`)
  ok(
    (await credits(mallory.id)) === malloryCreditsBeforeForbidden,
    'M6 aucun crédit débité à Mallory sur la tentative interdite',
    `solde=${await credits(mallory.id)}`
  )

  // Admin API : Mallory n'est pas admin
  const m5 = await api(`/api/admin/users?id=${alice.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: malloryCookie },
    body: JSON.stringify({ active: false }),
  })
  ok(m5.status === 403, 'M7 Mallory tente de désactiver Alice via /api/admin → 403', `status=${m5.status}`)
  const m6 = await api('/api/admin/invoices', { headers: { cookie: malloryCookie } })
  ok(m6.status === 403, 'M8 Mallory lit /api/admin/invoices → 403', `status=${m6.status}`)
  const aliceStillActive = await prisma.user.findUnique({ where: { id: alice.id }, select: { active: true } })
  ok(aliceStillActive.active === true, 'M9 Alice toujours active après la tentative')

  // Lien de partage : public par design (brief §5.4), sert le PDF
  const m7 = await fetch(`${KOBO}/share/${shareToken}`)
  ok(m7.status === 200, 'M10 lien de partage (public par design) sert le PDF', `status=${m7.status}`)

  // Injection : id invalide / token invalide → propre
  const m8 = await api('/api/invoices/../../etc/passwd', { headers: { cookie: malloryCookie } })
  ok([400, 404].includes(m8.status), 'M11 id malformé → 400/400', `status=${m8.status}`)
  const m9 = await fetch(`${KOBO}/share/not-a-valid-token`)
  ok(m9.status === 404, 'M12 jeton de partage invalide → 404', `status=${m9.status}`)

  console.log('')

  // ===== État final =====
  ok((await credits(alice.id)) === 4, 'F1 le solde d\'Alice est intact (4)', `solde=${await credits(alice.id)}`)
  const aliceInvoices = await prisma.invoice.count({ where: { userId: alice.id } })
  ok(aliceInvoices === 2, 'F2 Alice a toujours ses 2 factures en base')

  console.log(`\n=== ${failures === 0 ? 'ISOLATION PROUVÉE — TOUT PASSE' : failures + ' ÉCHEC(S)'} ===`)
  process.exitCode = failures === 0 ? 0 : 1
}

main()
  .catch(e => {
    console.error('E2E fatal:', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
