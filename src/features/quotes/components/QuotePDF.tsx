import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { QuoteLineItem, Incoterm, TransportMode } from '@/types/index';

// Register a standard font (optional, using Helvetica by default)
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subHeader: { fontSize: 9, color: '#64748b', marginBottom: 20 },
  
  // Grid Layout for Info
  infoGrid: { flexDirection: 'row', marginBottom: 30, justifyContent: 'space-between' },
  infoCol: { flexDirection: 'column' },
  label: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 10, fontWeight: 'bold', marginBottom: 8 },

  // Table
  table: { width: '100%', marginBottom: 20 },
  row: { flexDirection: 'row', borderBottom: '1px solid #f1f5f9', paddingVertical: 8, alignItems: 'center' },
  headerRow: { flexDirection: 'row', borderBottom: '2px solid #e2e8f0', paddingVertical: 8, backgroundColor: '#f8fafc' },
  
  colDesc: { width: '60%', paddingLeft: 8 },
  colPrice: { width: '20%', textAlign: 'right', paddingRight: 8 },
  colTotal: { width: '20%', textAlign: 'right', paddingRight: 8 },
  
  // Footer
  footer: { marginTop: 30, borderTop: '1px solid #eee', paddingTop: 10 },
  disclaimer: { fontSize: 8, color: '#94a3b8', marginTop: 20, textAlign: 'center' },
  totalSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalLabel: { fontSize: 12, marginRight: 10 },
  totalValue: { fontSize: 14, fontWeight: 'bold' }
});

interface QuotePDFProps {
  reference: string;
  clientName: string;
  pol: string;
  pod: string;
  incoterm: Incoterm;
  mode: TransportMode;
  items: QuoteLineItem[];
  totalSell: number;
  currency: string;
  validityDate: string;
}

export const QuotePDF = ({ 
  reference, clientName, pol, pod, incoterm, mode, items, totalSell, currency, validityDate 
}: QuotePDFProps) => {

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* 1. Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>ATLAS FLOW LOGISTICS</Text>
          <Text style={styles.subHeader}>Forwarder License No. 1234/2024 | Casablanca, Morocco</Text>
        </View>

        {/* 2. Logistics Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Client</Text>
            <Text style={styles.value}>{clientName}</Text>
            <Text style={styles.label}>Quote Ref</Text>
            <Text style={styles.value}>{reference}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Origin (POL)</Text>
            <Text style={styles.value}>{pol || '---'}</Text>
            <Text style={styles.label}>Destination (POD)</Text>
            <Text style={styles.value}>{pod || '---'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Mode</Text>
            <Text style={styles.value}>{mode} / {incoterm}</Text>
            <Text style={styles.label}>Validity</Text>
            <Text style={styles.value}>{validityDate}</Text>
          </View>
        </View>

        {/* 3. The Table (Sanitized - No Buy Prices) */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.label, styles.colDesc]}>Description of Charges</Text>
            <Text style={[styles.label, styles.colPrice]}>Currency</Text>
            <Text style={[styles.label, styles.colTotal]}>Amount (MAD)</Text>
          </View>

          {/* Table Rows */}
          {items.map((item, i) => (
             <View key={i} style={styles.row}>
               <Text style={styles.colDesc}>{item.description || 'Service Charge'}</Text>
               <Text style={[styles.subHeader, styles.colPrice]}>MAD</Text>
               {/* Note: In a real app, we would recalculate the sell price here or pass it pre-calculated. 
                   For now, we assume the display logic handled the markup calculation. 
                   We will verify this in the workspace. */}
               <Text style={styles.colTotal}>
                  {/* Quick math to replicate the sell price display logic for the PDF */}
                  {((item.buyPrice * 1.02) * (item.markupType === 'PERCENT' ? (1 + item.markupValue/100) : 1) + (item.markupType === 'FIXED_AMOUNT' ? item.markupValue : 0)).toFixed(2)}
               </Text>
             </View>
          ))}
        </View>

        {/* 4. Totals */}
        <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Estimated:</Text>
            <Text style={styles.totalValue}>{totalSell.toFixed(2)} {currency}</Text>
        </View>

        {/* 5. Footer & Legal Disclaimer */}
        <View style={styles.footer}>
            <Text style={styles.disclaimer}>
                Terms & Conditions: This quote is valid until the date specified. 
                Subject to space and equipment availability. 
                Standard Trading Conditions of the Moroccan Freight Forwarders Association apply.
            </Text>
        </View>

      </Page>
    </Document>
  );
};