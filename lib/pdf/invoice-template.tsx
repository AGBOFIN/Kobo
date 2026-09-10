import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'

interface InvoiceTemplateProps {
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

// Palette Kobo - Indigo Marché
const PRIMARY = '#2E3A87' // Indigo profond - confiance, professionnalisme
const PRIMARY_DARK = '#1e265f' // Indigo plus foncé
const SECONDARY = '#D46A3C' // Terracotta - chaleur, terre
const MUTED = '#924828' // Terracotta foncé
const LINE = '#dde1ed' // Indigo très clair
const ACCENT = '#4A9B7F' // Vert menthe doux - fraîcheur
const INK = '#1a1a1a' // Noir doux

function statusLabel(status: string): string {
  if (status === 'PAYE') return 'Payé'
  if (status === 'PARTIEL') return 'Partiellement payé'
  return 'Non payé'
}

function statusColor(status: string): string {
  if (status === 'PAYE') return '#4A9B7F' // Vert menthe doux pour succès
  if (status === 'PARTIEL') return '#D46A3C' // Terracotta pour partiel
  return '#2E3A87' // Indigo profond pour non payé
}

function paymentModeLabel(mode?: string): string {
  if (!mode) return ''
  const labels: Record<string, string> = {
    ESPECES: 'Espèces',
    MOBILE_MONEY: 'Mobile Money',
    VIREMENT: 'Virement',
    AUTRE: 'Autre',
  }
  return labels[mode] || mode
}

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: INK,
  },
  // ===== En-tête =====
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMark: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: PRIMARY,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 26,
    marginRight: 8,
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY_DARK,
    letterSpacing: 0.5,
  },
  titleBlock: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY_DARK,
    letterSpacing: 2,
  },
  meta: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
  },
  // ===== Blocs vendeur / client =====
  parties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  block: {
    width: '48%',
  },
  blockTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    color: MUTED,
    marginBottom: 4,
  },
  partyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: INK,
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 1,
  },
  // ===== Tableau =====
  table: {
    marginBottom: 16,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  th: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  rowAlt: {
    backgroundColor: '#f5f5f4',
  },
  td: {
    fontSize: 9,
  },
  designation: { flex: 3 },
  quantity: { flex: 1, textAlign: 'right' as const },
  unitPrice: { flex: 1.2, textAlign: 'right' as const },
  lineTotal: { flex: 1.2, textAlign: 'right' as const },
  // ===== Totaux =====
  totalsWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totals: {
    width: '55%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 9,
  },
  totalRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: PRIMARY_DARK,
    color: '#ffffff',
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginVertical: 6,
  },
  totalBoldText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  paid: {
    color: '#059669',
    fontWeight: 'bold',
  },
  // ===== Statut / paiement =====
  footerBox: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 9,
    color: MUTED,
  },
  statusTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  // ===== Pied de page =====
  footer: {
    position: 'absolute' as const,
    bottom: 18,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#a8a29e',
  },
})

export function InvoiceTemplate({ invoice, seller }: InvoiceTemplateProps) {
  const remaining = Math.max(0, invoice.remainingAmount)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ===== En-tête ===== */}
        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandMark}>K</Text>
              <Text style={styles.brandName}>Kobo</Text>
            </View>
            <Text style={[styles.meta, { marginTop: 6 }]}>
              Calcul de prix & facturation pour commerçants
            </Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>FACTURE</Text>
            <Text style={styles.meta}>N° {invoice.invoiceNumber}</Text>
            <Text style={styles.meta}>
              Date : {new Date(invoice.date).toLocaleDateString('fr-FR')}
            </Text>
            {invoice.dueDate && (
              <Text style={styles.meta}>
                Échéance : {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        </View>

        {/* ===== Vendeur / Client ===== */}
        <View style={styles.parties}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Vendeur</Text>
            {seller.logoUrl ? (
              <Image
                src={seller.logoUrl}
                style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 4 }}
              />
            ) : null}
            <Text style={styles.partyName}>{seller.companyName || seller.name}</Text>
            {seller.name && seller.companyName ? (
              <Text style={styles.partyLine}>{seller.name}</Text>
            ) : null}
            {seller.address ? (
              <Text style={styles.partyLine}>{seller.address}</Text>
            ) : null}
            {seller.phone ? <Text style={styles.partyLine}>Tél : {seller.phone}</Text> : null}
            {seller.email ? <Text style={styles.partyLine}>Email : {seller.email}</Text> : null}
          </View>
          <View style={[styles.block, { alignItems: 'flex-end' }]}>
            <Text style={styles.blockTitle}>Facturé à</Text>
            <Text style={styles.partyName}>{invoice.clientName}</Text>
            <Text style={styles.partyLine}>Tél : {invoice.clientPhone}</Text>
            {invoice.clientEmail ? (
              <Text style={styles.partyLine}>Email : {invoice.clientEmail}</Text>
            ) : null}
            {invoice.clientAddress ? (
              <Text style={styles.partyLine}>{invoice.clientAddress}</Text>
            ) : null}
          </View>
        </View>

        {/* ===== Tableau des produits ===== */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.designation]}>Désignation</Text>
            <Text style={[styles.th, styles.quantity]}>Qté</Text>
            <Text style={[styles.th, styles.unitPrice]}>P.U. (FCFA)</Text>
            <Text style={[styles.th, styles.lineTotal]}>Total (FCFA)</Text>
          </View>

          {invoice.items.map((item, index) => (
            <View key={index} style={index % 2 === 1 ? [styles.row, styles.rowAlt] : styles.row}>
              <Text style={[styles.td, styles.designation]}>{item.designation}</Text>
              <Text style={[styles.td, styles.quantity]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.unitPrice]}>
                {item.unitPrice.toLocaleString('fr-FR')}
              </Text>
              <Text style={[styles.td, styles.lineTotal]}>
                {item.lineTotal.toLocaleString('fr-FR')}
              </Text>
            </View>
          ))}
        </View>

        {/* ===== Totaux ===== */}
        <View style={styles.totalsWrap}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text>Sous-total</Text>
              <Text>{invoice.subtotal.toLocaleString('fr-FR')} FCFA</Text>
            </View>

            {invoice.discount > 0 && (
              <View style={styles.totalRow}>
                <Text>Réduction</Text>
                <Text style={{ color: '#dc2626' }}>
                  -{invoice.discount.toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            )}

            {invoice.deliveryFee > 0 && (
              <View style={styles.totalRow}>
                <Text>Frais de livraison</Text>
                <Text>{invoice.deliveryFee.toLocaleString('fr-FR')} FCFA</Text>
              </View>
            )}

            <View style={styles.totalRowBold}>
              <Text style={styles.totalBoldText}>Total</Text>
              <Text style={styles.totalBoldText}>
                {invoice.totalAmount.toLocaleString('fr-FR')} FCFA
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text>Montant payé</Text>
              <Text style={styles.paid}>
                {invoice.amountPaid.toLocaleString('fr-FR')} FCFA
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text>Reste à payer</Text>
              <Text style={{ fontWeight: 'bold' }}>{remaining.toLocaleString('fr-FR')} FCFA</Text>
            </View>
          </View>
        </View>

        {/* ===== Statut & paiement ===== */}
        <View style={styles.footerBox}>
          <View>
            <Text style={styles.footerNote}>
              Mode de paiement : {invoice.paymentMode ? paymentModeLabel(invoice.paymentMode) : '—'}
            </Text>
            <Text style={[styles.footerNote, { marginTop: 2 }]}>
              Merci pour votre confiance.
            </Text>
          </View>
          <Text style={[styles.statusTag, { backgroundColor: statusColor(invoice.status) }]}>
            {statusLabel(invoice.status)}
          </Text>
        </View>

        {/* ===== Pied de page ===== */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Généré par Kobo — Calcul de prix & facturation</Text>
          <Text style={styles.footerText}>www.kobo.app</Text>
        </View>
      </Page>
    </Document>
  )
}