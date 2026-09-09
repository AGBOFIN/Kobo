import { renderToBuffer } from '@react-pdf/renderer'
import { InvoiceTemplate } from './invoice-template'

interface GenerateInvoicePDFParams {
  invoice: {
    invoiceNumber: string
    date: Date
    clientName: string
    clientPhone: string
    clientEmail?: string
    clientAddress?: string
    items: Array<{
      designation: string
      quantity: number
      unitPrice: number
      lineTotal: number
    }>
    subtotal: number
    discount: number
    deliveryFee: number
    totalAmount: number
    amountPaid: number
    remainingAmount: number
    status: string
    paymentMode?: string
    dueDate?: Date
  }
  seller: {
    name: string
    phone?: string
    address?: string
    companyName?: string
    logoUrl?: string
    email?: string
  }
}

export async function generateInvoicePDF(params: GenerateInvoicePDFParams): Promise<Buffer> {
  const pdfBuffer = await renderToBuffer(
    <InvoiceTemplate invoice={params.invoice} seller={params.seller} />
  )

  return pdfBuffer
}