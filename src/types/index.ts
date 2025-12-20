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

export interface QuoteApproval {
    requiresApproval: boolean;
    reason: string | null;
    requestedBy?: string;
    requestedAt?: Date;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
}

export interface QuoteLineItem {
  id: string;
  quoteId: string; // References the Parent Quote (RFQ)
  optionId?: string; // NEW: References the specific Option (Air vs Sea)
  section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION';
  description: string;
  
  // Buying (Cost)
  buyPrice: number;
  buyCurrency: Currency;
  vendorId?: string; // NEW: Link to CRM Supplier
  vendorName?: string; // NEW: Snapshot of Supplier Name
  validityDate?: Date; // NEW: Line-item specific validity (e.g., spot rate expiration)

  // Selling (Revenue)
  markupType: 'PERCENT' | 'FIXED_AMOUNT';
  markupValue: number;
  vatRule: 'STD_20' | 'ROAD_14' | 'EXPORT_0_ART92' | 'DISBURSEMENT';
}

// NEW: The specific logistics solution (e.g. Option 1: Air Freight)
export interface QuoteOption {
    id: string;
    quoteId: string;
    name: string; // "Option A: Express Air"
    isRecommended: boolean;
    
    // Route & Mode (Specific to this option)
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

    // Financials (Specific to this option)
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
  customerReference?: string;
  status: 'DRAFT' | 'PRICING' | 'VALIDATION' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  
  // Client Identity
  clientId: string;
  clientName: string;
  salespersonId: string;
  salespersonName: string;
  
  // Global Dates
  validityDate: Date; // The overall validity of the offer
  cargoReadyDate: Date;
  requestedDepartureDate?: Date;
  
  // Cargo (Shared across all options usually)
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
  
  // Workflow
  probability: Probability;
  competitorInfo?: string;
  internalNotes: string;
  activities: ActivityItem[];
  approval: QuoteApproval;

  // NEW: Multi-Option Support
  // We keep legacy fields on the Quote interface temporarily if needed for database mapping,
  // but logically, the data now lives in 'options'.
  options: QuoteOption[];
}

// --- 3. DOSSIER (SHIPMENT) MODELS ---
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
  weight: number; // kg
  packages: number;
  packageType: PackagingType;
  volume: number; // cbm
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

// --- 4. FINANCE ENGINE (RE-ARCHITECTED) ---
export type ChargeType = 'INCOME' | 'EXPENSE';
export type ChargeStatus = 'ESTIMATED' | 'ACCRUED' | 'READY_TO_INVOICE' | 'INVOICED' | 'POSTED' | 'PAID' | 'PARTIAL';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type InvoiceType = 'INVOICE' | 'CREDIT_NOTE' | 'PROFORMA';
export type VatRule = 'STD_20' | 'ROAD_14' | 'EXPORT_0_ART92' | 'DISBURSEMENT_0';

export interface ChargeLine {
    id: string;
    dossierId: string;
    type: ChargeType;
    code: string; // e.g. 'OF', 'THC', 'DUM'
    description: string;
    vendorId?: string; // For AP
    vendorName?: string;
    
    // Amounts
    currency: Currency;
    amount: number; // The amount in original currency
    exchangeRate: number; // ROE to Local (MAD)
    amountLocal: number; // The amount in MAD
    
    // Tax Logic
    vatRule: VatRule;
    vatRate: number; // e.g. 0.20
    vatAmount: number;
    totalAmount: number;

    status: ChargeStatus;
    invoiceRef?: string; // Link to generated invoice
    invoiceId?: string; // Relation ID
    isBillable: boolean; // If expense, can we bill it?
    createdAt?: Date;
}

export interface Invoice {
    id: string;
    type: InvoiceType;
    reference: string; // INV-24-001
    dossierId: string;
    clientId: string;
    clientName: string;
    date: Date;
    dueDate: Date;
    
    // Explicitly using the InvoiceStatus type to fix TS2322
    status: InvoiceStatus;
    
    currency: Currency;
    exchangeRate: number;
    subTotal: number;
    taxTotal: number;
    total: number;
    balanceDue: number;
    
    lines: ChargeLine[];
}

export interface Client {
  id: string;
  created_at: string;
  updated_at?: string;
  entityName: string;
  status: 'ACTIVE' | 'PROSPECT' | 'SUSPENDED' | 'BLACKLISTED';
  type: 'SHIPPER' | 'CONSIGNEE' | 'FORWARDER' | 'PARTNER';
  email: string;
  phone: string;
  website?: string;
  city: string;
  country: string;
  address?: string;
  creditLimit: number;
  creditUsed: number;
  financials: {
      paymentTerms: string;
      vatNumber: string;
      currency: string;
      ice?: string;
      rc?: string;
      taxId?: string;
  };
  salesRepId: string;
  tags: string[];
  contacts: any[];
  routes: any[];
  documents: any[];
  suppliers: any[];
  commodities: any[];
  operational: any;
  activities: ActivityItem[];
}