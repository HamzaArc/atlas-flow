import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { ChargeLine, Invoice } from '@/types/index';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333', lineHeight: 1.4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottom: '2px solid #0f172a', paddingBottom: 10 },
  logoText: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase' },
  invoiceTitle: { fontSize: 22, fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase' },
  
  metaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metaBox: { width: '45%' },
  label: { fontSize: 8, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 10, fontWeight: 'bold' },

  table: { width: '100%', marginTop: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 8, borderBottom: '1px solid #cbd5e1' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottom: '1px solid #f1f5f9' },
  
  colDesc: { flex: 3 },
  colCode: { flex: 1 },
  colAmount: { flex: 1, textAlign: 'right' },

  totalSection: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '40%', marginBottom: 5 },
  grandTotal: { borderTop: '2px solid #0f172a', paddingTop: 5, marginTop: 5 },
  grandText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },

  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8' }
});

interface InvoicePDFProps {
    invoice: Invoice;
}

export const InvoicePDF = ({ invoice }: InvoicePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
            <Text style={styles.logoText}>Atlas Flow</Text>
            <Text style={{fontSize: 9, color: '#64748b'}}>Logistics & Freight Services</Text>
        </View>
        <Text style={styles.invoiceTitle}>INVOICE</Text>
      </View>

      {/* Meta Data */}
      <View style={styles.metaContainer}>
          <View style={styles.metaBox}>
              <Text style={styles.label}>Bill To:</Text>
              <Text style={styles.value}>{invoice.clientName}</Text>
              <Text style={{fontSize: 9, marginTop: 4}}>Client ID: {invoice.clientId}</Text>
          </View>
          <View style={[styles.metaBox, { alignItems: 'flex-end' }]}>
              <Text style={styles.label}>Invoice Details:</Text>
              <Text style={styles.value}>Ref: {invoice.reference}</Text>
              <Text style={styles.value}>Date: {new Date(invoice.date).toLocaleDateString()}</Text>
              <Text style={[styles.value, { color: '#dc2626' }]}>Due: {new Date(invoice.dueDate).toLocaleDateString()}</Text>
          </View>
      </View>

      {/* Line Items */}
      <View style={styles.table}>
          <View style={styles.tableHeader}>
              <Text style={styles.colCode}>Code</Text>
              <Text style={styles.colDesc}>Description</Text>
              <Text style={styles.colAmount}>Amount ({invoice.currency})</Text>
          </View>
          {invoice.lines.map((line) => (
              <View key={line.id} style={styles.tableRow}>
                  <Text style={styles.colCode}>{line.code}</Text>
                  <Text style={styles.colDesc}>{line.description}</Text>
                  <Text style={styles.colAmount}>{line.amount.toFixed(2)}</Text>
              </View>
          ))}
      </View>

      {/* Totals */}
      <View style={styles.totalSection}>
          <View style={styles.totalRow}>
              <Text>Subtotal:</Text>
              <Text>{invoice.subTotal.toFixed(2)} {invoice.currency}</Text>
          </View>
          <View style={styles.totalRow}>
              <Text>VAT (20%):</Text>
              <Text>{invoice.taxTotal.toFixed(2)} {invoice.currency}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandText}>TOTAL PAYABLE:</Text>
              <Text style={[styles.grandText, { color: '#2563eb' }]}>{invoice.total.toFixed(2)} {invoice.currency}</Text>
          </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
          <Text>Bank Details: BMCE Bank | RIB: 123456789012345678901234 | Swift: BMCEUS33</Text>
          <Text>Atlas Flow SARL | Techopolis, Rabat, Morocco</Text>
      </View>
    </Page>
  </Document>
);