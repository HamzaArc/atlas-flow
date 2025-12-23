// src/types/index.ts

// --- 1. CORE LOGISTICS ENUMS ---
export type Incoterm = 
  | 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP' 
  | 'FAS' | 'FOB' | 'CFR' | 'CIF';

export type TransportMode = 'SEA_FCL' | 'SEA_LCL' | 'AIR' | 'ROAD';
export type Currency = 'MAD' | 'USD' | 'EUR' | 'GBP';
export type Probability = 'LOW' | 'MEDIUM' | 'HIGH';
export type PackagingType = 'PALLETS' | 'CARTONS' | 'CRATES' | 'DRUMS' | 'LOOSE';

// --- 2. QUOTE ENGINE MODELS ---
export type ActivityCategory = 'NOTE' | 'SYSTEM' | 'EMAIL' | 'ALERT' | 'APPROVAL';

export interface ActivityItem {
  id: string;
  category: ActivityCategory;
  tone?: "success" | "neutral" | "warning" | "destructive";
  text: string;
  meta: string; 
  timestamp: Date;
}

export interface ApprovalTrigger {
    code: string;
    message: string;
    severity: 'HIGH' | 'MEDIUM';
}

export interface QuoteApproval {
    requiresApproval: boolean;
    triggers: ApprovalTrigger[];
    reason: string | null;
    requestedBy?: string;
    requestedAt?: Date;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
}

export type DynamicLineType = 'MAIN_FRET' | 'RET_FOND' | 'PEAGE_LCL' | 'STATIC';

export interface QuoteLineItem {
  id: string;
  quoteId: string;
  optionId?: string;
  section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION';
  description: string;
  buyPrice: number;
  buyCurrency: Currency;
  vendorId?: string; 
  vendorName?: string; 
  validityDate?: Date; 
  markupType: 'PERCENT' | 'FIXED_AMOUNT';
  markupValue: number;
  vatRule: 'STD_20' | 'ROAD_14' | 'EXPORT_0_ART92' | 'DISBURSEMENT';
  source: 'MANUAL' | 'TARIFF' | 'SMART_INIT';
  tariffId?: string;
  isRequired?: boolean;           
  dynamicType?: DynamicLineType;  
  calculationFactor?: number;     
}

export interface QuoteOption {
    id: string;
    quoteId: string;
    name: string;
    isRecommended: boolean;
    mode: TransportMode;
    incoterm: Incoterm;
    pol: string;
    pod: string;
    placeOfLoading?: string;
    placeOfDelivery?: string;
    transitTime?: number;
    freeTime?: number;
    equipmentType?: string;
    containerCount: number;
    equipmentList: { id: string; type: string; count: number }[];
    items: QuoteLineItem[];
    totalTTC: number;
    baseCurrency: Currency;
    quoteCurrency: Currency;
    exchangeRates: Record<string, number>;
    marginBuffer: number;
}

export interface Quote {
  id: string;
  reference: string;
  masterReference: string; 
  version: number; 
  customerReference?: string;
  status: 'DRAFT' | 'PRICING' | 'VALIDATION' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  clientId: string;
  clientName: string;
  clientTaxId?: string; 
  clientIce?: string; 
  paymentTerms: string; 
  salespersonId: string;
  salespersonName: string;
  validityDate: Date; 
  cargoReadyDate: Date;
  requestedDepartureDate?: Date;
  pol?: string;
  pod?: string;
  mode?: TransportMode;       
  incoterm?: Incoterm;        
  activeOptionId?: string;    
  cargoRows: any[];
  goodsDescription: string;
  hsCode?: string;
  packagingType: PackagingType;
  isHazmat: boolean;
  isStackable: boolean;
  isReefer: boolean;
  temperature?: string;
  cargoValue?: number;
  insuranceRequired: boolean;
  totalWeight?: number; 
  totalVolume?: number;
  chargeableWeight?: number;
  totalTTC?: number;
  totalSellTarget?: number;
  totalTaxTarget?: number;
  totalTTCTarget?: number;
  probability: Probability;
  competitorInfo?: string;
  internalNotes: string;
  activities: ActivityItem[];
  approval: QuoteApproval;
  options: QuoteOption[];
}

// --- 3. DOSSIER MODELS ---
export type ShipmentStatus = 'BOOKED' | 'PICKUP' | 'AT_POL' | 'ON_WATER' | 'AT_POD' | 'CUSTOMS' | 'DELIVERED' | 'COMPLETED';

export interface ShipmentParty {
    name: string;
    address?: string;
    contact?: string;
}

export interface DossierContainer {
  id: string;
  number: string;
  type: '20DV' | '40HC' | '40RH' | '45HC' | 'LCL';
  seal: string;
  weight: number; 
  packages: number;
  packageType: PackagingType;
  volume: number; 
  status: 'GATE_IN' | 'LOADED' | 'ON_WATER' | 'DISCHARGED' | 'DELIVERED' | 'EMPTY_RETURN';
  pickupDate?: string;
  returnDate?: string;
}

export interface DossierAlert {
    id: string;
    type: 'BLOCKER' | 'WARNING' | 'INFO';
    message: string;
    actionRequired?: string;
}

export interface Dossier {
  id: string;
  ref: string; 
  bookingRef: string; 
  status: ShipmentStatus;
  clientId: string;
  clientName: string;
  quoteId?: string;
  mblNumber: string; 
  hblNumber: string; 
  carrier: string;
  vesselName: string;
  voyageNumber: string;
  pol: string;
  pod: string;
  etd: Date;
  eta: Date;
  ata?: Date; 
  shipper: ShipmentParty;
  consignee: ShipmentParty;
  notify?: ShipmentParty;
  incoterm: Incoterm;
  mode: TransportMode;
  freeTimeDays: number; 
  vgmCutOff?: Date;
  portCutOff?: Date;
  docCutOff?: Date;
  containers: DossierContainer[];
  activities: ActivityItem[];
  alerts: DossierAlert[];
  nextAction: string;
  totalRevenue: number;
  totalCost: number;
  currency: Currency;
}

// --- 4. FINANCE ENGINE ---
export type ChargeType = 'INCOME' | 'EXPENSE';
export type ChargeStatus = 'ESTIMATED' | 'ACCRUED' | 'READY_TO_INVOICE' | 'INVOICED' | 'POSTED' | 'PAID' | 'PARTIAL';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type InvoiceType = 'INVOICE' | 'CREDIT_NOTE' | 'PROFORMA';
export type VatRule = 'STD_20' | 'ROAD_14' | 'EXPORT_0_ART92' | 'DISBURSEMENT_0';

export interface ChargeLine {
    id: string;
    dossierId: string;
    type: ChargeType;
    code: string; 
    description: string;
    vendorId?: string; 
    vendorName?: string; 
    currency: Currency;
    amount: number; 
    exchangeRate: number; 
    amountLocal: number; 
    vatRule: VatRule;
    vatRate: number; 
    vatAmount: number;
    totalAmount: number;
    status: ChargeStatus;
    invoiceRef?: string; 
    invoiceId?: string; 
    isBillable: boolean; 
    createdAt?: Date;
}

export interface Invoice {
    id: string;
    type: InvoiceType;
    reference: string; 
    dossierId: string;
    clientId: string;
    clientName: string;
    date: Date;
    dueDate: Date;
    status: InvoiceStatus;
    currency: Currency;
    exchangeRate: number;
    subTotal: number;
    taxTotal: number;
    total: number;
    balanceDue: number;
    lines: ChargeLine[];
}

// --- 5. CLIENT INTELLIGENCE MODELS ---
export type ClientStatus = 'ACTIVE' | 'PROSPECT' | 'SUSPENDED' | 'BLACKLISTED';
export type ClientType = 'SHIPPER' | 'CONSIGNEE' | 'FORWARDER' | 'PARTNER';
// UPDATED ROLE: Added 'EXPORTER' for commercial suppliers
export type SupplierRole = 'SEA_LINE' | 'AIRLINE' | 'HAULIER' | 'FORWARDER' | 'EXPORTER';
export type SupplierTier = 'STRATEGIC' | 'APPROVED' | 'BACKUP' | 'BLOCKED';
export type CommoditySector = 'AUTOMOTIVE' | 'TEXTILE' | 'PERISHABLE' | 'RETAIL' | 'INDUSTRIAL' | 'TECH';
export type ClientRole = 'MANAGER' | 'SALES' | 'ACCOUNTING' | 'LOGISTICS' | 'CUSTOMS_BROKER' | 'WAREHOUSE';

export interface ClientContact {
  id: string;
  name: string;
  role: ClientRole | string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface ClientRoute {
  id: string;
  origin: string;
  destination: string;
  mode: 'SEA' | 'AIR' | 'ROAD';
  incoterm: 'EXW' | 'FOB' | 'CIF' | 'DAP' | 'DDP' | 'OTHER';
  equipment: '20DV' | '40HC' | 'LCL' | 'AIR' | 'FTL' | 'LTL';
  volume: number;
  volumeUnit: 'TEU' | 'KG' | 'TRK';
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ADHOC';
}

export interface ClientDocument {
  id: string;
  name: string;
  type: 'CONTRACT' | 'KYC' | 'NDA' | 'POWER_OF_ATTORNEY' | 'OTHER';
  uploadDate: Date;
  expiryDate?: Date;
  size: string;
  url: string;
}

export interface ClientFinancials {
  paymentTerms: string;
  vatNumber: string;
  currency: string;
  ice: string;      
  patente?: string; 
  cnss?: string;    
  rc?: string;
  taxId?: string;
  customsRebatePercent?: number; 
  adminFee?: number;             
  adminFeeCurrency?: Currency;   
  tollFee?: number;              // CONFIRMED PRESENT
  averageDaysToPay?: number;     
  specialInstructions?: string;  
}

// UPDATED CLIENT SUPPLIER
export interface ClientSupplier {
  id: string;
  name: string;
  role: SupplierRole;
  tier: SupplierTier;
  
  // New Rich Data Fields
  country?: string;
  city?: string;
  address?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  products?: string; // Comma separated list of goods
  website?: string;
  notes?: string;
}

export interface ClientCommodity {
  id: string;
  name: string;
  sector: CommoditySector;
  isHazmat: boolean;
}

export interface OperationalProfile {
  hsCodes: string[];
  requiresHazmat: boolean;
  requiresReefer: boolean;
  requiresOOG: boolean;
  customsRegime: 'STANDARD' | 'TEMPORARY' | 'FREE_ZONE';
  negotiatedFreeTime?: number; 
}

export interface Client {
  id: string;
  created_at: string;
  updated_at?: string;
  entityName: string;
  status: ClientStatus;
  blacklistReason?: string;
  type: ClientType;
  parentCompanyId?: string;
  email: string;
  phone: string;
  website?: string;
  billingAddress: string; 
  deliveryAddress?: string; 
  city: string;
  country: string;
  creditLimit: number;
  unbilledWork: number; 
  unpaidInvoices: number; 
  financials: ClientFinancials;
  salesRepId: string;
  opsManagerId?: string; 
  tags: string[];
  contacts: ClientContact[];
  routes: ClientRoute[];
  documents: ClientDocument[];
  suppliers: ClientSupplier[];
  commodities: ClientCommodity[];
  operational: OperationalProfile;
  activities: ActivityItem[];
}