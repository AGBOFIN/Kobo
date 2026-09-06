/**
 * FAKE Chariow API — serveur de test autonome (aucune dépendance).
 *
 * Simule les endpoints Chariow utilisés par Kobo (doc : chariow.dev) :
 *  - POST /v1/checkout        → crée une vente `sal_e2e_*` et renvoie
 *                               data.step="payment" + data.payment.checkout_url
 *  - GET  /v1/sales/:id       → statut de la vente ("awaiting_payment" puis
 *                               "completed" une fois /confirm appelé)
 *  - POST /confirm/:id        → (outil de test) marque la vente "completed"
 *  - POST /reset              → vide les ventes
 *  - GET  /health
 *
 * Objectif : vérifier que Kobo ne crédite JAMAIS sur la seule foi du webhook —
 * il doit appeler GET /sales/:id (re-vérification API) avant de créditer.
 */
const http = require('http')

const PORT = 4599

/** id → { status: 'awaiting_payment' | 'completed', checkout: {...} } */
const sales = new Map()

function json(res, code, body) {
  const payload = JSON.stringify(body)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  let raw = ''
  req.on('data', chunk => (raw += chunk))
  req.on('end', () => {
    // Auth Bearer exigée (comme la vraie API)
    if (url.pathname.startsWith('/v1/')) {
      const auth = req.headers.authorization || ''
      if (!auth.startsWith('Bearer ') || auth.length < 10) {
        return json(res, 401, {
          message: 'API key is missing. Please provide a valid API key.',
          data: [],
          errors: [],
        })
      }
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      return json(res, 200, { ok: true, sales: sales.size })
    }

    if (req.method === 'POST' && url.pathname === '/reset') {
      sales.clear()
      return json(res, 200, { ok: true })
    }

    // ---- POST /v1/checkout ----
    if (req.method === 'POST' && url.pathname === '/v1/checkout') {
      let body = {}
      try {
        body = JSON.parse(raw || '{}')
      } catch {
        return json(res, 400, { message: 'Invalid JSON', data: [], errors: [] })
      }

      const { product_id, email, custom_metadata } = body
      if (!product_id || !email) {
        return json(res, 422, {
          message: 'Validation error',
          data: [],
          errors: { email: !email ? ['required'] : undefined },
        })
      }

      const saleId = `sal_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      sales.set(saleId, { status: 'awaiting_payment', body })

      return json(res, 200, {
        data: {
          step: 'payment',
          message: null,
          purchase: {
            id: saleId,
            status: 'awaiting_payment',
            product: { id: product_id, name: `Produit test ${product_id}` },
            customer: { email },
            custom_metadata: custom_metadata || null,
          },
          payment: {
            checkout_url: `http://localhost:${PORT}/checkout/${saleId}`,
            transaction_id: `txn_${saleId}`,
          },
        },
        errors: [],
      })
    }

    // ---- GET /v1/sales/:id ----
    const saleMatch = url.pathname.match(/^\/v1\/sales\/(sal_\w+)$/)
    if (req.method === 'GET' && saleMatch) {
      const sale = sales.get(saleMatch[1])
      if (!sale) {
        return json(res, 404, { message: 'Sale not found', data: [], errors: [] })
      }
      return json(res, 200, {
        message: 'success',
        data: {
          id: saleMatch[1],
          status: sale.status,
          amount: { value: sale.body.custom_metadata?.kobo_amount_fcfa || 1000, currency: 'XOF' },
          custom_metadata: sale.body.custom_metadata || null,
          customer: { email: sale.body.email },
        },
        errors: [],
      })
    }

    // ---- POST /confirm/:id (outil de test : marque la vente payée) ----
    const confirmMatch = url.pathname.match(/^\/confirm\/(sal_\w+)$/)
    if (req.method === 'POST' && confirmMatch) {
      const sale = sales.get(confirmMatch[1])
      if (!sale) return json(res, 404, { ok: false })
      sale.status = 'completed'
      return json(res, 200, { ok: true, id: confirmMatch[1], status: sale.status })
    }

    // ---- POST /fail/:id (outil de test : marque la vente échouée) ----
    const failMatch = url.pathname.match(/^\/fail\/(sal_\w+)$/)
    if (req.method === 'POST' && failMatch) {
      const sale = sales.get(failMatch[1])
      if (!sale) return json(res, 404, { ok: false })
      sale.status = 'failed'
      return json(res, 200, { ok: true, id: failMatch[1], status: sale.status })
    }

    return json(res, 404, { message: `No route: ${req.method} ${url.pathname}` })
  })
})

server.listen(PORT, () => {
  console.log(`[fake-chariow] API de test sur http://localhost:${PORT}`)
})
