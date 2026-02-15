import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Quote } from '@/types/index';
import { useSettingsStore } from '@/store/useSettingsStore';

// --- STYLES ---
const styles = StyleSheet.create({
  page: { 
    flexDirection: 'column', 
    backgroundColor: '#FFFFFF', 
    padding: 30, 
    fontFamily: 'Helvetica', 
    fontSize: 9, 
    color: '#1e293b',
    lineHeight: 1.4 
  },
  
  // BRAND HEADER
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20, 
    paddingBottom: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0' 
  },
  logoBlock: { width: '50%', justifyContent: 'center' },
  // INCREASED SIZE BY ~35% (140 -> 190 width, 50 -> 70 height)
  logoImage: { width: 190, height: 70, objectFit: 'contain' }, 
  
  // Fallback Text Styles (Only shown if no logo)
  logoText: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#0f172a', textTransform: 'uppercase', letterSpacing: -0.5 },
  logoSub: { fontSize: 8, color: '#64748b', letterSpacing: 2, marginTop: 2, textTransform: 'uppercase' },
  
  metaBlock: { width: '40%', alignItems: 'flex-end', justifyContent: 'flex-start' },
  statusBadge: { 
    backgroundColor: '#f1f5f9', 
    paddingVertical: 4, 
    paddingHorizontal: 8, 
    borderRadius: 4, 
    fontSize: 8, 
    fontFamily: 'Helvetica-Bold', 
    color: '#475569', 
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  refLabel: { fontSize: 8, color: '#94a3b8', marginBottom: 1 },
  refText: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 4 },
  dateText: { fontSize: 9, color: '#64748b' },

  // ADDRESS GRID
  gridTwoCol: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  col: { width: '48%' },
  colTitle: { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Helvetica-Bold', marginBottom: 6, letterSpacing: 0.5 },
  addressBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 4, border: '1px solid #f1f5f9' },
  addressName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginBottom: 2 },
  addressLine: { fontSize: 9, color: '#475569', marginBottom: 1 },

  // SHIPMENT CONTEXT BAR
  contextBar: { 
    flexDirection: 'row', 
    backgroundColor: '#0f172a', 
    borderRadius: 4, 
    padding: 10, 
    marginBottom: 20, 
    alignItems: 'center' 
  },
  contextItem: { flex: 1, borderRightWidth: 1, borderRightColor: '#334155', paddingLeft: 10 },
  contextItemLast: { flex: 1, paddingLeft: 10 },
  contextLabel: { fontSize: 6, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  contextValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff' },

  // SECTION TITLE
  sectionTitle: { 
    fontSize: 9, 
    fontFamily: 'Helvetica-Bold', 
    color: '#0f172a', 
    textTransform: 'uppercase', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0', 
    paddingBottom: 4, 
    marginBottom: 8, 
    marginTop: 10 
  },

  // CARGO TABLE
  cargoTable: { width: '100%', marginBottom: 20 },
  cargoHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 5, paddingHorizontal: 8, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  cargoRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 5, paddingHorizontal: 8 },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' },
  td: { fontSize: 8, color: '#334155' },
  
  // Cargo Columns
  cQty: { width: '10%', textAlign: 'center' },
  cType: { width: '25%' },
  cDims: { width: '30%' },
  cVol: { width: '15%', textAlign: 'right' },
  cWgt: { width: '20%', textAlign: 'right' },

  // FINANCIAL TABLE
  finTable: { width: '100%', marginBottom: 15 },
  finHeader: { flexDirection: 'row', backgroundColor: '#1e293b', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 3 },
  finTh: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  finRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 8 },
  
  fDesc: { width: '50%' },
  fMeta: { width: '15%', textAlign: 'center' },
  fVal: { width: '35%', textAlign: 'right' },

  // TOTALS
  totalBlock: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 },
  totalBox: { width: '45%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 9, color: '#64748b' },
  totalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopWidth: 2, borderTopColor: '#0f172a' },
  grandLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  grandValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a' },

  // TERMS & CONDITIONS
  termsContainer: { 
    marginTop: 20, 
    paddingTop: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0' 
  },
  termsTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 5, textTransform: 'uppercase' },
  termsText: { fontSize: 6.5, color: '#64748b', textAlign: 'justify', marginBottom: 3, lineHeight: 1.3 },
  
  // SIGNATURE BLOCK
  acceptanceBlock: {
      marginTop: 25,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 4,
      padding: 12,
      backgroundColor: '#f8fafc',
      pageBreakInside: 'avoid'
  },
  acceptanceTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 15, textTransform: 'uppercase' },
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sigCol: { width: '45%' },
  sigLine: { borderBottomWidth: 1, borderBottomColor: '#94a3b8', height: 20, marginBottom: 4 },
  sigLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase' },

  footer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 30, 
    right: 30, 
    textAlign: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9', 
    paddingTop: 10 
  },
  footerText: { fontSize: 7, color: '#94a3b8' }
});

const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(value);
};

interface QuotePDFProps {
    data: Quote;
}

export const QuotePDF: React.FC<QuotePDFProps> = ({ data }) => {
    // ACCESS SETTINGS STORE
    const { company } = useSettingsStore();

    // RESOLVE ACTIVE OPTION
    const activeOption = data.options.find(o => o.id === data.activeOptionId) || data.options[0];
    const quoteCurrency = activeOption?.quoteCurrency || company.currency || 'MAD';
    const mode = activeOption?.mode || data.mode || 'SEA_LCL';
    
    // RESOLVE EQUIPMENT STRING
    const equipmentStr = activeOption?.equipmentList && activeOption.equipmentList.length > 0
        ? activeOption.equipmentList.map(e => `${e.count}x ${e.type}`).join(', ')
        : (activeOption?.equipmentType ? `${activeOption.containerCount}x ${activeOption.equipmentType}` : '-');

    // LOGIC: Hide Manifest AND Weight/Vol for FCL or ROAD
    const showDetails = !['SEA_FCL', 'ROAD'].includes(mode);

    // LOGIC: Show Equipment only for FCL or ROAD (Hide for LCL / AIR)
    const showEquipment = ['SEA_FCL', 'ROAD'].includes(mode);

    // FINANCIALS
    const subTotal = data.totalSellTarget || 0;
    const vatTotal = data.totalTaxTarget || 0;
    const grandTotal = data.totalTTCTarget || (subTotal + vatTotal);

    // DATES
    const validUntil = new Date(data.validityDate).toLocaleDateString();
    const createdDate = new Date().toLocaleDateString();

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                
                {/* 1. HEADER */}
                <View style={styles.header}>
                    <View style={styles.logoBlock}>
                        {company.logoUrl ? (
                          /* If Logo exists, show ONLY the image, replacing text */
                          <Image style={styles.logoImage} src={company.logoUrl} />
                        ) : (
                          /* If no logo, show text fallback */
                          <>
                            <Text style={styles.logoText}>{company.name || 'ATLAS FLOW'}</Text>
                            <Text style={styles.logoSub}>Logistics Operating System</Text>
                          </>
                        )}
                    </View>
                    <View style={styles.metaBlock}>
                        <Text style={styles.statusBadge}>{data.status}</Text>
                        <Text style={styles.refLabel}>Quotation Reference</Text>
                        <Text style={styles.refText}>#{data.reference}</Text>
                        <Text style={styles.dateText}>Date: {createdDate}</Text>
                        <Text style={[styles.dateText, { color: '#ef4444', fontFamily: 'Helvetica-Bold' }]}>
                            Expires: {validUntil}
                        </Text>
                    </View>
                </View>

                {/* 2. PARTIES GRID */}
                <View style={styles.gridTwoCol}>
                    <View style={styles.col}>
                        <Text style={styles.colTitle}>Prepared For</Text>
                        <View style={styles.addressBox}>
                            <Text style={styles.addressName}>{data.clientName}</Text>
                            {data.clientTaxId && <Text style={styles.addressLine}>Tax ID: {data.clientTaxId}</Text>}
                            <Text style={styles.addressLine}>Payment Terms: {data.paymentTerms}</Text>
                        </View>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.colTitle}>Prepared By</Text>
                        <View style={styles.addressBox}>
                            <Text style={styles.addressName}>{company.name}</Text>
                            <Text style={styles.addressLine}>{company.addressLine1}</Text>
                            {company.addressLine2 && <Text style={styles.addressLine}>{company.addressLine2}</Text>}
                            <Text style={styles.addressLine}>{company.city}, {company.country}</Text>
                            <Text style={styles.addressLine}>{company.email}</Text>
                        </View>
                    </View>
                </View>

                {/* 3. LOGISTICS CONTEXT */}
                <View style={styles.contextBar}>
                    <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Origin (POL)</Text>
                        <Text style={styles.contextValue}>{data.pol || activeOption?.pol || '-'}</Text>
                    </View>
                    <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Destination (POD)</Text>
                        <Text style={styles.contextValue}>{data.pod || activeOption?.pod || '-'}</Text>
                    </View>
                    {/* Item 3: If details (Weight/Vol) are shown, this is a middle item. If details are hidden, this is the last item. */}
                    <View style={showDetails ? styles.contextItem : styles.contextItemLast}>
                        <Text style={styles.contextLabel}>Mode {showEquipment ? '/ Equipment' : ''}</Text>
                        <Text style={styles.contextValue}>
                            {mode}{showEquipment ? ` | ${equipmentStr}` : ''}
                        </Text>
                    </View>
                    {/* Item 4: Total Weight / Vol (Only for LCL/AIR) */}
                    {showDetails && (
                        <View style={styles.contextItemLast}>
                            <Text style={styles.contextLabel}>Total Weight / Vol</Text>
                            <Text style={styles.contextValue}>
                                {data.totalWeight?.toFixed(2) || 0} kg | {data.totalVolume?.toFixed(3) || 0} cbm
                            </Text>
                        </View>
                    )}
                </View>

                {/* 4. CARGO MANIFEST (CONDITIONAL) */}
                {showDetails ? (
                    <>
                        <Text style={styles.sectionTitle}>Cargo Manifest</Text>
                        <View style={styles.cargoTable}>
                            <View style={styles.cargoHeader}>
                                <Text style={[styles.th, styles.cQty]}>Qty</Text>
                                <Text style={[styles.th, styles.cType]}>Package Type</Text>
                                <Text style={[styles.th, styles.cDims]}>Dims (L x W x H)</Text>
                                <Text style={[styles.th, styles.cVol]}>Vol (cbm)</Text>
                                <Text style={[styles.th, styles.cWgt]}>Weight (kg)</Text>
                            </View>
                            {data.cargoRows && data.cargoRows.length > 0 ? (
                                data.cargoRows.map((row, idx) => {
                                const rowVol = ((row.length * row.width * row.height) / 1000000) * row.qty;
                                const rowWgt = row.weight * row.qty;
                                return (
                                    <View key={idx} style={styles.cargoRow}>
                                        <Text style={[styles.td, styles.cQty]}>{row.qty}</Text>
                                        <Text style={[styles.td, styles.cType]}>{row.pkgType}</Text>
                                        <Text style={[styles.td, styles.cDims]}>{row.length}x{row.width}x{row.height} cm</Text>
                                        <Text style={[styles.td, styles.cVol]}>{rowVol.toFixed(3)}</Text>
                                        <Text style={[styles.td, styles.cWgt]}>{rowWgt.toFixed(2)}</Text>
                                    </View>
                                );
                                })
                            ) : (
                                <View style={styles.cargoRow}>
                                    <Text style={[styles.td, { width: '100%', textAlign: 'center', fontStyle: 'italic' }]}>
                                        No cargo details specified.
                                    </Text>
                                </View>
                            )}
                        </View>
                    </>
                ) : (
                    <View style={{ marginBottom: 15 }}></View> // Spacer if manifest is hidden
                )}

                {/* 5. PRICING TABLE */}
                <Text style={styles.sectionTitle}>Charges & Fees</Text>
                <View style={styles.finTable}>
                    <View style={styles.finHeader}>
                        <Text style={[styles.finTh, styles.fDesc]}>Description</Text>
                        <Text style={[styles.finTh, styles.fMeta]}>VAT Rule</Text>
                        <Text style={[styles.finTh, styles.fVal]}>Amount ({quoteCurrency})</Text>
                    </View>

                    {activeOption?.items.map((item, index) => {
                        const buyRate = activeOption.exchangeRates[item.buyCurrency] || 1;
                        const targetRate = activeOption.exchangeRates[quoteCurrency] || 1;
                        const costMAD = item.buyPrice * buyRate;
                        
                        let sellMAD = 0;
                        if (item.markupType === 'PERCENT') sellMAD = costMAD * (1 + (item.markupValue / 100));
                        else sellMAD = costMAD + (item.markupValue * buyRate);
                        
                        const sellTarget = quoteCurrency === 'MAD' ? sellMAD : sellMAD / targetRate;
                        const vatLabel = item.vatRule === 'EXPORT_0_ART92' ? '0% (Exp)' : 
                                         item.vatRule === 'ROAD_14' ? '14%' : '20%';

                        return (
                            <View key={item.id} style={[styles.finRow, { backgroundColor: index % 2 !== 0 ? '#f8fafc' : '#ffffff' }]}>
                                <Text style={[styles.td, styles.fDesc]}>{item.description}</Text>
                                <Text style={[styles.td, styles.fMeta]}>{vatLabel}</Text>
                                <Text style={[styles.td, styles.fVal]}>{formatCurrency(sellTarget, quoteCurrency)}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* 6. TOTALS */}
                <View style={styles.totalBlock}>
                    <View style={styles.totalBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal (Net)</Text>
                            <Text style={styles.totalValue}>{formatCurrency(subTotal, quoteCurrency)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total VAT</Text>
                            <Text style={styles.totalValue}>{formatCurrency(vatTotal, quoteCurrency)}</Text>
                        </View>
                        <View style={styles.grandRow}>
                            <Text style={styles.grandLabel}>TOTAL PAYABLE</Text>
                            <Text style={styles.grandValue}>{formatCurrency(grandTotal, quoteCurrency)}</Text>
                        </View>
                    </View>
                </View>

                {/* 7. TERMS & CONDITIONS (New Page via break prop) */}
                <View style={styles.termsContainer} break>
                    <Text style={styles.termsTitle}>Standard Terms & Conditions</Text>
                    
                    {/* Render customized terms if available, otherwise fallback */}
                    {company.termsAndConditions ? (
                       <Text style={styles.termsText}>{company.termsAndConditions}</Text>
                    ) : (
                      <>
                        <Text style={styles.termsText}>
                            1. <Text style={{ fontFamily: 'Helvetica-Bold' }}>VALIDITY & BOOKING:</Text> Rates are valid until {validUntil} and subject to equipment/space availability at time of booking. Spot rates are subject to change without notice.
                        </Text>
                        
                        <Text style={styles.termsText}>
                            2. <Text style={{ fontFamily: 'Helvetica-Bold' }}>EXCLUSIONS:</Text> Unless strictly specified, rates exclude Customs Duties, Taxes (VAT), Inspection Fees, Scanning, Storage, Detention, Demurrage, and Waiting Time.
                        </Text>

                        <Text style={styles.termsText}>
                            3. <Text style={{ fontFamily: 'Helvetica-Bold' }}>INSURANCE:</Text> Goods travel at the risk of the cargo owner. Cargo insurance is NOT included unless explicitly itemized. We strongly recommend arranging comprehensive marine insurance.
                        </Text>
                        
                        <Text style={styles.termsText}>
                            4. <Text style={{ fontFamily: 'Helvetica-Bold' }}>PAYMENT:</Text> Invoices are payable according to agreed credit terms ({data.paymentTerms}). Late payments may be subject to interest charges. 
                        </Text>

                        <Text style={styles.termsText}>
                            5. <Text style={{ fontFamily: 'Helvetica-Bold' }}>EXCHANGE RATES:</Text> Final invoicing will be based on the exchange rate valid at the date of invoicing or date of shipment, as per company policy.
                        </Text>

                        <Text style={styles.termsText}>
                            6. <Text style={{ fontFamily: 'Helvetica-Bold' }}>LIABILITY:</Text> All business is undertaken subject to the Standard Trading Conditions of Atlas Flow SARL and applicable international conventions (Hague-Visby, CMR, Montreal).
                        </Text>
                      </>
                    )}
                </View>

                {/* 8. ACCEPTANCE & SIGNATURE */}
                <View style={styles.acceptanceBlock}>
                    <Text style={styles.acceptanceTitle}>Acceptance of Quotation</Text>
                    <Text style={{ fontSize: 7, color: '#475569', marginBottom: 10 }}>
                        By signing below, the client acknowledges and accepts the rates, terms, and conditions outlined in this quotation.
                    </Text>
                    
                    <View style={styles.sigRow}>
                        <View style={styles.sigCol}>
                            <View style={styles.sigLine} />
                            <Text style={styles.sigLabel}>Name & Title</Text>
                        </View>
                        <View style={styles.sigCol}>
                            <View style={styles.sigLine} />
                            <Text style={styles.sigLabel}>Date</Text>
                        </View>
                    </View>
                    
                    <View style={[styles.sigRow, { marginTop: 30 }]}>
                        <View style={[styles.sigCol, { width: '100%' }]}>
                            <View style={{ height: 40, borderBottomWidth: 1, borderBottomColor: '#94a3b8', marginBottom: 4 }} />
                            <Text style={styles.sigLabel}>Signature & Company Stamp</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    {/* DYNAMIC FOOTER TEXT */}
                    <Text style={styles.footerText}>{company.footerText}</Text>
                </View>

            </Page>
        </Document>
    );
};