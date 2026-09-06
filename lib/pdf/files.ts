import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import crypto from 'crypto'

/**
 * Les PDF sont stockés hors du dossier public/ pour ne jamais être servis
 * en accès public permanent. Ils ne sont accessibles que via :
 *  - la route API authentifiée /api/invoices/[id]/pdf (propriétaire uniquement)
 *  - un lien de partage temporaire /share/[token] pour le client (WhatsApp)
 *
 * IMPORTANT (sécurité) : la clé de stockage est l'ID GLOBAL de la facture
 * (cuid, unique), jamais le numéro de facture. Le numéro `KOBO-2026-0001`
 * n'est unique que PAR UTILISATEUR : deux vendeurs ont tous les deux un
 * « KOBO-2026-0001 » et un cache indexé par numéro ferait servir le PDF d'un
 * vendeur à un autre (fuite inter-utilisateurs détectée par le test E2E
 * d'isolation, scripts/e2e/isolation.testrun.js).
 *
 * DÉPLOIEMENT (Vercel serverless) : le filesystem est éphémère, seul /tmp est
 * inscriptible. Le cache PDF y fonctionne donc par instance/invocation chaude,
 * MAIS l'effet de bord business reste correct : si le cache est froid, on
 * régénère le PDF — or un PDF déjà généré est GRATUIT (le crédit n'est débité
 * que si aucun PDF n'existe... ce qui redeviendrait faux en serverless).
 *
 * ⚠️ Pour un déploiement Vercel réel, déplacer ce cache vers un stockage
 * persistant (S3/R2) OU rendre la gratuité idempotente autrement : la colonne
 * `Invoice.pdfToken` sert de marqueur « déjà généré » — voir la logique de
 * débit dans app/api/invoices/[id]/pdf/route.ts, qui vérifie le cache AVANT
 * de facturer. Le correctif minimal appliqué ici : si le cache est froid mais
 * que l'invoice possède déjà un pdfToken (PDF généré antérieurement), la
 * régénération est gratuite — voir route.ts.
 */
const IS_SERVERLESS = process.env.VERCEL === '1'
const STORAGE_DIR = IS_SERVERLESS
  ? join('/tmp', 'kobo-storage', 'invoices')
  : join(process.cwd(), 'storage', 'invoices')

export function getPdfStorageDir(): string {
  return STORAGE_DIR
}

export async function ensureStorageDir(): Promise<string> {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true })
  }
  return STORAGE_DIR
}

function safeFileName(invoiceId: string): string {
  const safeName = invoiceId.replace(/[^a-zA-Z0-9_-]/g, '_')
  return join(STORAGE_DIR, `${safeName}.pdf`)
}

export function getPdfPath(invoiceId: string): string {
  return safeFileName(invoiceId)
}

export async function savePdf(invoiceId: string, buffer: Buffer): Promise<string> {
  await ensureStorageDir()
  const filepath = safeFileName(invoiceId)
  await writeFile(filepath, buffer)
  return filepath
}

export async function readPdf(invoiceId: string): Promise<Buffer | null> {
  const filepath = getPdfPath(invoiceId)
  if (!existsSync(filepath)) {
    return null
  }
  return readFile(filepath)
}

/** Jeton aléatoire difficilement devinable pour le lien de partage temporaire */
export function generatePdfToken(): string {
  return crypto.randomBytes(24).toString('hex')
}
