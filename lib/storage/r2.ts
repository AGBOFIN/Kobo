/**
 * Stockage PDF sur Cloudflare R2
 * 
 * Utilisation :
 * - Upload des PDF générés
 * - Récupération des URLs de téléchargement
 * - Alternative au stockage local éphémère
 * 
 * Variables d'environnement requises :
 * - R2_ENDPOINT
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 * - R2_PUBLIC_DOMAIN (optionnel, pour custom domain)
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

// Singleton pattern
let s3Client: S3Client | null = null

export function getS3Client() {
  if (!s3Client) {
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      console.warn('Cloudflare R2 not configured. Using local storage.')
      return null
    }
    
    s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })
  }
  
  return s3Client
}

/**
 * Upload un PDF vers R2
 */
export async function uploadPdf(invoiceId: string, pdfBuffer: Buffer): Promise<string> {
  const client = getS3Client()
  if (!client) {
    throw new Error('R2 not configured')
  }
  
  const bucketName = process.env.R2_BUCKET_NAME || 'kobo-invoices'
  const publicDomain = process.env.R2_PUBLIC_DOMAIN || `${bucketName}.r2.cloudflarestorage.com`
  
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `invoices/${invoiceId}.pdf`,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      CacheControl: 'public, max-age=31536000', // 1 an
    })
    
    await client.send(command)
    
    return `https://${publicDomain}/invoices/${invoiceId}.pdf`
  } catch (error) {
    console.error('Error uploading PDF to R2:', error)
    throw new Error('Failed to upload PDF to R2')
  }
}

/**
 * Récupère l'URL publique d'un PDF
 */
export function getPdfUrl(invoiceId: string): string {
  const bucketName = process.env.R2_BUCKET_NAME || 'kobo-invoices'
  const publicDomain = process.env.R2_PUBLIC_DOMAIN || `${bucketName}.r2.cloudflarestorage.com`
  
  return `https://${publicDomain}/invoices/${invoiceId}.pdf`
}

/**
 * Supprime un PDF de R2
 */
export async function deletePdf(invoiceId: string): Promise<void> {
  const client = getS3Client()
  if (!client) {
    console.warn('R2 not configured. Skipping deletion.')
    return
  }
  
  const bucketName = process.env.R2_BUCKET_NAME || 'kobo-invoices'
  
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `invoices/${invoiceId}.pdf`,
    })
    
    await client.send(command)
  } catch (error) {
    console.error('Error deleting PDF from R2:', error)
  }
}

/**
 * Vérifie si R2 est configuré
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  )
}
