import { describe, it, expect } from '@jest/globals'
import { calculateInvoice, type CreateInvoiceInput } from '../lib/validations/invoice'

describe('Invoice Calculator', () => {
  it('should calculate correctly with multiple items', () => {
    const input: CreateInvoiceInput = {
      clientName: 'Test Client',
      clientPhone: '+22890000000',
      items: [
        { designation: 'Product 1', quantity: 2, unitPrice: 5000 },
        { designation: 'Product 2', quantity: 1, unitPrice: 10000 },
      ],
      discount: 0,
      deliveryFee: 0,
      amountPaid: 0,
    }

    const result = calculateInvoice(input)

    expect(result.subtotal).toBe(20000)
    expect(result.totalAmount).toBe(20000)
    expect(result.remainingAmount).toBe(20000)
    expect(result.status).toBe('NON_PAYE')
  })

  it('should calculate with discount amount', () => {
    const input: CreateInvoiceInput = {
      clientName: 'Test Client',
      clientPhone: '+22890000000',
      items: [
        { designation: 'Product 1', quantity: 1, unitPrice: 10000 },
      ],
      discount: 1000,
      deliveryFee: 0,
      amountPaid: 0,
    }

    const result = calculateInvoice(input)

    expect(result.subtotal).toBe(10000)
    expect(result.discount).toBe(1000)
    expect(result.totalAmount).toBe(9000)
  })

  it('should calculate with discount percentage', () => {
    const input: CreateInvoiceInput = {
      clientName: 'Test Client',
      clientPhone: '+22890000000',
      items: [
        { designation: 'Product 1', quantity: 1, unitPrice: 10000 },
      ],
      discount: 0,
      discountPercent: 10,
      deliveryFee: 0,
      amountPaid: 0,
    }

    const result = calculateInvoice(input)

    expect(result.subtotal).toBe(10000)
    expect(result.discount).toBe(1000)
    expect(result.totalAmount).toBe(9000)
  })

  it('should calculate with delivery fee', () => {
    const input: CreateInvoiceInput = {
      clientName: 'Test Client',
      clientPhone: '+22890000000',
      items: [
        { designation: 'Product 1', quantity: 1, unitPrice: 10000 },
      ],
      discount: 0,
      deliveryFee: 2000,
      amountPaid: 0,
    }

    const result = calculateInvoice(input)

    expect(result.subtotal).toBe(10000)
    expect(result.deliveryFee).toBe(2000)
    expect(result.totalAmount).toBe(12000)
  })

  it('should determine PAID status correctly', () => {
    const input: CreateInvoiceInput = {
      clientName: 'Test Client',
      clientPhone: '+22890000000',
      items: [
        { designation: 'Product 1', quantity: 1, unitPrice: 10000 },
      ],
      discount: 0,
      deliveryFee: 0,
      amountPaid: 10000,
    }

    const result = calculateInvoice(input)

    expect(result.status).toBe('PAYE')
    expect(result.remainingAmount).toBe(0)
  })

  it('should determine PARTIEL status correctly', () => {
    const input: CreateInvoiceInput = {
      clientName: 'Test Client',
      clientPhone: '+22890000000',
      items: [
        { designation: 'Product 1', quantity: 1, unitPrice: 10000 },
      ],
      discount: 0,
      deliveryFee: 0,
      amountPaid: 5000,
    }

    const result = calculateInvoice(input)

    expect(result.status).toBe('PARTIEL')
    expect(result.remainingAmount).toBe(5000)
  })

  it('should handle complex scenario', () => {
    const input: CreateInvoiceInput = {
      clientName: 'Test Client',
      clientPhone: '+22890000000',
      items: [
        { designation: 'Product 1', quantity: 2, unitPrice: 5000 },
        { designation: 'Product 2', quantity: 3, unitPrice: 3000 },
      ],
      discount: 1000,
      deliveryFee: 1500,
      amountPaid: 10000,
    }

    const result = calculateInvoice(input)

    expect(result.subtotal).toBe(19000)
    expect(result.totalAmount).toBe(19500)
    expect(result.remainingAmount).toBe(9500)
    expect(result.status).toBe('PARTIEL')
  })
})