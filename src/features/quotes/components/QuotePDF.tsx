import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { QuoteLineItem, Incoterm, TransportMode } from '@/types/index';

// --- STYLES ---
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333', lineHeight: 1.5 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 },
  brandSection: { flexDirection: 'column' },
  brandName: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  brandSub: { fontSize: 8, color: '#64748b' },
  
  metaSection: { textAlign: 'right' },
  statusBadge: { fontSize: 9, color: '#64748b', textTransform: 'uppercase', marginTop: 4 },

  // Info Grid
  grid: { flexDirection: 'row', gap: 20, marginBottom: 30, backgroundColor: '#f8fafc', padding: 10, borderRadius: 4 },
  col: { flex: 1 },
  label: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' },

  // Table
  table: { width: '100%', marginBottom: 20 },
  row: { flexDirection: 'row', borderBottom: '1px solid #f1f5f9', paddingVertical: 8, alignItems: 'center' },
  headerRow: { flexDirection: 'row', borderBottom: '2px solid #e2e8f0', paddingVertical: 8, backgroundColor: '#f1f5f9' },
  
  // Columns
  colDesc: { flex: 3, paddingLeft: 8 },
  colMeta: { flex: 1, textAlign: 'center' },
  colMoney: { flex: 1, textAlign: 'right', paddingRight: 8 },

  // Totals Area
  footerSection: { flexDirection: 'row', marginTop: 10 },
  notesArea: { flex: 2, paddingRight: 20 },
  totalsArea: { flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 4 },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { fontSize: 9, color: '#64748b' },
  totalValue: { fontSize: 9, fontWeight: 'bold' },
  grandTotal: { borderTop: '1px solid #e2e8f0', paddingTop: 6, marginTop: 6 },
  grandLabel: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  grandValue: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },

  // Footer
  legal: { marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: 10, textAlign: 'center' },
  disclaimer: { fontSize: 7, color: '#94a3b8', marginBottom: 2 }
});

// --- HELPER LOGIC (Duplicated from Store to ensure PDF consistency) ---
const getTaxRate = (rule: string) => {
  switch (rule) {
    case 'STD_20': return 0.20;
    case 'ROAD_14': return 0.14;
    case 'EXPORT_0_ART92': return 0.0;
    default: return 0.20;
  }
};

interface QuotePDFProps {
  reference: string;
  clientName: string;
  pol: string;
  pod: string;
  incoterm: Incoterm;
  mode: TransportMode;
  items: QuoteLineItem[];
  // We pass pre-calculated totals to ensure UI matches PDF
  totalHT: number;
  totalTax: number;
  totalTTC: number;
  currency: string;
  validityDate: string;
  exchangeRates: Record<string, number>;
  marginBuffer: number;
}

export const QuotePDF = ({ 
  reference, clientName, pol, pod, incoterm, mode, items, 
  totalHT, totalTax, totalTTC, currency, validityDate,
  exchangeRates, marginBuffer
}: QuotePDFProps) => {

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* 1. Header */}
        <View style={styles.header}>
          <View style={styles.brandSection}>
            <Text style={styles.brandName}>ATLAS FLOW LOGISTICS</Text>
            <Text style={styles.brandSub}>Casablanca, Morocco | Tax ID: 12345678</Text>
          </View>
          <View style={styles.metaSection}>
            <Text style={styles.value}>Quote #{reference}</Text>
            <Text style={styles.statusBadge}>Valid Until: {validityDate}</Text>
          </View>
        </View>

        {/* 2. Logistics Context */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.label}>Client</Text>
            <Text style={styles.value}>{clientName}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Origin (POL)</Text>
            <Text style={styles.value}>{pol || '---'}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Destination (POD)</Text>
            <Text style={styles.value}>{pod || '---'}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Terms</Text>
            <Text style={styles.value}>{mode} / {incoterm}</Text>
          </View>
        </View>

        {/* 3. The Line Items */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.label, styles.colDesc]}>Description of Services</Text>
            <Text style={[styles.label, styles.colMeta]}>VAT Rule</Text>
            <Text style={[styles.label, styles.colMoney]}>Amount ({currency})</Text>
          </View>

          {/* Rows */}
          {items.map((item, i) => {
             // Re-calculate sell price for display consistency
             const rate = exchangeRates[item.buyCurrency] || 1;
             const bufferedRate = rate * marginBuffer;
             const costInMAD = item.buyPrice * bufferedRate;
             let sell = 0;
             if (item.markupType === 'PERCENT') sell = costInMAD * (1 + (item.markupValue / 100));
             else sell = costInMAD + item.markupValue;
             
             return (
               <View key={i} style={styles.row}>
                 <Text style={styles.colDesc}>{item.description || 'Service Charge'}</Text>
                 <Text style={[styles.statusBadge, styles.colMeta]}>{item.vatRule.replace('_', ' ')}</Text>
                 <Text style={styles.colMoney}>{sell.toFixed(2)}</Text>
               </View>
             );
          })}
        </View>

        {/* 4. Financial Footer */}
        <View style={styles.footerSection}>
            <View style={styles.notesArea}>
                <Text style={styles.label}>Terms & Conditions</Text>
                <Text style={styles.disclaimer}>
                    1. Rates are subject to space and equipment availability.
                </Text>
                <Text style={styles.disclaimer}>
                    2. Payment terms: 30 Days from invoice date.
                </Text>
                <Text style={styles.disclaimer}>
                    3. This quote does not include insurance unless specified.
                </Text>
            </View>

            <View style={styles.totalsArea}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Net (HT):</Text>
                    <Text style={styles.totalValue}>{totalHT.toFixed(2)} {currency}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total VAT (TVA):</Text>
                    <Text style={styles.totalValue}>{totalTax.toFixed(2)} {currency}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotal]}>
                    <Text style={styles.grandLabel}>Total TTC:</Text>
                    <Text style={styles.grandValue}>{totalTTC.toFixed(2)} {currency}</Text>
                </View>
            </View>
        </View>

        {/* 5. Legal Footer */}
        <View style={styles.legal}>
            <Text style={styles.disclaimer}>
                Atlas Flow Logistics SARL | RC: 12345 | ICE: 0011223344 | Patente: 889900
            </Text>
            <Text style={styles.disclaimer}>
                Generated by Atlas Flow Platform on {new Date().toLocaleDateString()}
            </Text>
        </View>

      </Page>
    </Document>
  );
};