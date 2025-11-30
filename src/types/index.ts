// --- 1. CORE LOGISTICS ENUMS ---
// Expanded to full Incoterms 2020 support for validation logic
export type Incoterm = 
  | 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP' // Any Mode
  | 'FAS' | 'FOB' | 'CFR' | 'CIF';                        // Sea & Inland Waterway Only

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

export interface Quote {
  id: string;
  reference: string;
  customerReference?: string;
  status: 'DRAFT' | 'PRICING' | 'VALIDATION' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  
  // CRM & Identity
  clientId: string;
  clientName: string;
  salespersonId: string;
  salespersonName: string;
  
  // Logistics Timeline
  validityDate: Date;
  cargoReadyDate: Date;
  requestedDepartureDate?: Date;
  estimatedDepartureDate?: Date;
  estimatedArrivalDate?: Date;
  transitTime?: number; // Estimated transit in days
  freeTime?: number;    // Detention/Demurrage Franchise (Days)
  
  // Logistics Route & Equipment
  incoterm: Incoterm;
  mode: TransportMode;
  pol: string; // Port of Loading or Airport of Departure
  pod: string; // Port of Discharge or Airport of Destination
  placeOfLoading?: string;  // Physical address (EXW)
  placeOfDelivery?: string; // Physical address (DAP/DDP)
  equipmentType?: string;   // 20DV, 40HC, FTL Mega, etc.
  containerCount: number;   // Number of units
  
  // Cargo Details
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
  
  // Business Intelligence
  probability: Probability;
  competitorInfo?: string;
  internalNotes: string;
  activities: ActivityItem[];
  
  // Financials
  baseCurrency: Currency; 
  quoteCurrency: Currency; 
  exchangeRates: Record<string, number>; 
  items: QuoteLineItem[];
  
  // KPI Data
  totalTTC: number; 
  
  // Workflow Engine
  approval: QuoteApproval;
}

export interface QuoteLineItem {
  id: string;
  quoteId: string;
  section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION';
  description: string;
  buyPrice: number;
  buyCurrency: Currency;
  markupType: 'PERCENT' | 'FIXED_AMOUNT';
  markupValue: number;
  vatRule: 'STD_20' | 'ROAD_14' | 'EXPORT_0_ART92' | 'DISBURSEMENT';
}

export interface Dossier {
  id: string;
  ref: string;
  status: 'PRE_ALERT' | 'ON_WATER' | 'ARRIVAL' | 'CUSTOMS' | 'DELIVERY';
  mblNumber: string;
  vesselName: string;
  eta: Date;
  dischargeDate?: Date;
  freeTimeEnd?: Date;
}

export interface Client {
  id: string;
  name: string;
  ice: string;
  rc?: string;
  paymentTerms: 'CASH' | '30_DAYS' | '60_DAYS';
  creditLimit: number;
}