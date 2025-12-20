import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { QuoteLineItem, Incoterm, TransportMode } from '@/types/index';

// --- STYLES ---
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 9, color: '#333', lineHeight: 1.4 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #0f172a', paddingBottom: 15 },
  logoText: { fontSize: 24, fontWeight: 'heavy', color: '#0f172a', textTransform: 'uppercase' },
  subTitle: { fontSize: 8, color: '#64748b', marginTop: 2 },
  
  quoteMeta: { alignItems: 'flex-end' },
  quoteRef: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  date: { fontSize: 9, color: '#64748b' },

  // Info Box
  boxContainer: { flexDirection: 'row', marginBottom: 25, gap: 10 },
  box: { flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: 2 },
  boxLabel: { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  boxValue: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' },
  
  // Highlight Badge in PDF
  optionBadge: { marginTop: 4, padding: 4, backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: 8, borderRadius: 2, alignSelf: 'flex-start' },

  // Table
  table: { width: '100%', marginBottom: 10 },
  sectionRow: { backgroundColor: '#e2e8f0', padding: 4, paddingLeft: 8, marginTop: 8 },
  sectionText: { fontSize: 8, fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' },
  row: { flexDirection: 'row', borderBottom: '1px solid #f1f5f9', paddingVertical: 6, alignItems: 'center' },
  headerRow: { flexDirection: 'row', borderBottom: '1px solid #0f172a', paddingVertical: 6, marginBottom: 4 },
  
  colDesc: { flex: 4, paddingLeft: 8 },
  colMeta: { flex: 1, textAlign: 'center' },
  colMoney: { flex: 1.5, textAlign: 'right', paddingRight: 8 },

  // Totals
  totalsContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  totalsBox: { width: '40%', backgroundColor: '#f8fafc', padding: 10, borderRadius: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { color: '#64748b' },
  totalValue: { fontWeight: 'bold', color: '#0f172a' },
  grandTotal: { borderTop: '1px solid #cbd5e1', paddingTop: 6, marginTop: 4 },
  grandValue: { fontSize: 12, fontWeight: 'bold', color: '#2563eb' },

  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 7, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 10 }
});

interface QuotePDFProps {
  reference: string;
  clientName: string;
  pol: string;
  pod: string;
  incoterm: Incoterm;
  mode: TransportMode;
  items: QuoteLineItem[];
  totalHT: number;
  totalTax: number;
  totalTTC: number;
  currency: string;
  validityDate: string;
  weight: number;
  volume: number;
  exchangeRates: Record<string, number>;
  marginBuffer: number;
  optionName?: string; // NEW PROP
}

export const QuotePDF = ({ 
  reference, clientName, pol, pod, incoterm, mode, items, 
  totalHT, totalTax, totalTTC, currency, validityDate,
  weight, volume, exchangeRates, optionName
}: QuotePDFProps) => {

  const renderSection = (title: string, sectionFilter: string) => {
      const sectionItems = items.filter(i => i.section === sectionFilter);
      if (sectionItems.length === 0) return null;

      return (
          <View>
              <View style={styles.sectionRow}>
                  <Text style={styles.sectionText}>{title}</Text>
              </View>
              {sectionItems.map((item, i) => {
                  const buyRate = exchangeRates[item.buyCurrency] || 1;
                  const targetRate = exchangeRates[currency] || 1;
                  const costInMAD = item.buyPrice * buyRate;
                  
                  let sellInMAD = 0;
                  if (item.markupType === 'PERCENT') sellInMAD = costInMAD * (1 + (item.markupValue / 100));
                  else sellInMAD = costInMAD + (item.markupValue * buyRate);

                  const finalSell = currency === 'MAD' ? sellInMAD : sellInMAD / targetRate;

                  return (
                    <View key={i} style={styles.row}>
                        <Text style={styles.colDesc}>{item.description}</Text>
                        <Text style={styles.colMeta}>{item.vatRule === 'EXPORT_0_ART92' ? '0%' : '20%'}</Text>
                        <Text style={styles.colMoney}>{finalSell.toFixed(2)}</Text>
                    </View>
                  );
              })}
          </View>
      );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>Atlas Flow</Text>
            <Text style={styles.subTitle}>Global Logistics & Freight Forwarding</Text>
          </View>
          <View style={styles.quoteMeta}>
            <Text style={styles.quoteRef}>QUOTE: {reference}</Text>
            <Text style={styles.date}>Date: {new Date().toLocaleDateString()}</Text>
            <Text style={styles.date}>Valid Until: {validityDate}</Text>
          </View>
        </View>

        <View style={styles.boxContainer}>
            <View style={styles.box}>
                <Text style={styles.boxLabel}>Customer</Text>
                <Text style={styles.boxValue}>{clientName}</Text>
            </View>
            <View style={styles.box}>
                <Text style={styles.boxLabel}>Route</Text>
                <Text style={styles.boxValue}>{pol}  to  {pod}</Text>
            </View>
            <View style={styles.box}>
                <Text style={styles.boxLabel}>Shipment Details</Text>
                <Text style={styles.boxValue}>{mode} | {incoterm}</Text>
                {/* NEW: Display Option Name clearly */}
                {optionName && <Text style={styles.optionBadge}>{optionName}</Text>}
            </View>
        </View>

        <View style={styles.table}>
            <View style={styles.headerRow}>
                <Text style={styles.colDesc}>Description</Text>
                <Text style={styles.colMeta}>VAT</Text>
                <Text style={styles.colMoney}>Amount ({currency})</Text>
            </View>

            {renderSection("Origin Charges", "ORIGIN")}
            {renderSection("Freight Charges", "FREIGHT")}
            {renderSection("Destination Charges", "DESTINATION")}
        </View>

        <View style={styles.totalsContainer}>
            <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal (Net):</Text>
                    <Text style={styles.totalValue}>{totalHT.toFixed(2)} {currency}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>VAT:</Text>
                    <Text style={styles.totalValue}>{totalTax.toFixed(2)} {currency}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotal]}>
                    <Text style={[styles.totalLabel, {fontWeight:'bold', color:'#0f172a'}]}>Total TTC:</Text>
                    <Text style={styles.grandValue}>{totalTTC.toFixed(2)} {currency}</Text>
                </View>
            </View>
        </View>

        <View style={styles.footer}>
            <Text>Terms and Conditions: Subject to equipment availability. Standard trading conditions apply.</Text>
            <Text>Atlas Flow SARL | Casablanca, Morocco | www.atlasflow.com</Text>
        </View>

      </Page>
    </Document>
  );
};