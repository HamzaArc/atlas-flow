import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Invoice } from '@/types/index';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 9, color: '#333', lineHeight: 1.4 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, borderBottom: '2px solid #0f172a', paddingBottom: 15 },
  logo: { fontSize: 20, fontWeight: 'black', color: '#0f172a', textTransform: 'uppercase' },
  invType: { fontSize: 18, fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase' },
  
  // Grid
  grid: { flexDirection: 'row', gap: 20, marginBottom: 25 },
  col: { flex: 1 },
  label: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 9, fontWeight: 'bold' },
  
  // Table
  table: { width: '100%', marginBottom: 15 },
  thead: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 6, borderBottom: '1px solid #cbd5e1' },
  tbody: { flexDirection: 'row', padding: 6, borderBottom: '1px solid #f1f5f9' },
  
  colDesc: { flex: 4 },
  colMeta: { flex: 1, textAlign: 'center' },
  colMoney: { flex: 1.5, textAlign: 'right' },

  // Footer Totals
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalBox: { width: '40%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  
  legal: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 7, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 10 }
});

export const InvoicePDF = ({ invoice }: { invoice: Invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
            <Text style={styles.logo}>Atlas Flow</Text>
            <Text style={{fontSize: 8, color:'#64748b'}}>Global Freight & Logistics</Text>
        </View>
        <View style={{alignItems:'flex-end'}}>
            <Text style={[styles.invType, { color: invoice.type === 'CREDIT_NOTE' ? '#dc2626' : '#2563eb' }]}>
                {invoice.type === 'CREDIT_NOTE' ? 'CREDIT NOTE' : 'INVOICE'}
            </Text>
            <Text style={{fontSize: 10, marginTop:4}}>#{invoice.reference}</Text>
        </View>
      </View>

      {/* Info Grid */}
      <View style={styles.grid}>
          <View style={styles.col}>
              <Text style={styles.label}>Bill To</Text>
              <Text style={styles.value}>{invoice.clientName}</Text>
              <Text style={{fontSize:8}}>Client ID: {invoice.clientId}</Text>
          </View>
          <View style={styles.col}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{new Date(invoice.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.col}>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>{new Date(invoice.dueDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.col}>
              <Text style={styles.label}>Currency</Text>
              <Text style={styles.value}>{invoice.currency}</Text>
          </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
          <View style={styles.thead}>
              <Text style={styles.colDesc}>Description</Text>
              <Text style={styles.colMeta}>Code</Text>
              <Text style={styles.colMeta}>VAT</Text>
              <Text style={styles.colMoney}>Total</Text>
          </View>
          {invoice.lines.map((l, i) => (
              <View key={i} style={styles.tbody}>
                  <Text style={styles.colDesc}>{l.description}</Text>
                  <Text style={styles.colMeta}>{l.code}</Text>
                  <Text style={styles.colMeta}>{(l.vatRate * 100).toFixed(0)}%</Text>
                  <Text style={styles.colMoney}>{l.amount.toFixed(2)}</Text>
              </View>
          ))}
      </View>

      {/* Calculations */}
      <View style={styles.footer}>
          <View style={styles.totalBox}>
              <View style={styles.row}>
                  <Text>Subtotal:</Text>
                  <Text style={styles.value}>{invoice.subTotal.toFixed(2)} {invoice.currency}</Text>
              </View>
              <View style={styles.row}>
                  <Text>Tax Total:</Text>
                  <Text style={styles.value}>{invoice.taxTotal.toFixed(2)} {invoice.currency}</Text>
              </View>
              <View style={[styles.row, { borderTop:'1px solid #333', paddingTop:5, marginTop:5 }]}>
                  <Text style={{fontWeight:'bold'}}>Total Due:</Text>
                  <Text style={{fontWeight:'bold', fontSize:12}}>{invoice.total.toFixed(2)} {invoice.currency}</Text>
              </View>
          </View>
      </View>

      {/* Footer */}
      <View style={styles.legal}>
          <Text>Payment Terms: Net 30 Days. Late payments subject to 5% interest.</Text>
          <Text>Bank: BMCE Bank | RIB: 123456789012345678901234 | Swift: BMCEUS33</Text>
          <Text>Atlas Flow SARL | ICE: 001528829000054 | RC: 34992 | Casablanca, Morocco</Text>
      </View>

    </Page>
  </Document>
);