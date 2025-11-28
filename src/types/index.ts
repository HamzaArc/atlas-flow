// --- 1. CORE LOGISTICS ENUMS ---
export type Incoterm = 'EXW' | 'FOB' | 'CFR' | 'CIF' | 'DDP';
export type TransportMode = 'SEA_FCL' | 'SEA_LCL' | 'AIR' | 'ROAD';
export type Currency = 'MAD' | 'USD' | 'EUR' | 'GBP';
export type Probability = 'LOW' | 'MEDIUM' | 'HIGH';
export type PackagingType = 'PALLETS' | 'CARTONS' | 'CRATES' | 'DRUMS' | 'LOOSE';

// --- 2. QUOTE ENGINE MODELS ---
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
  validityDate: Date; // RE-ADDED
  cargoReadyDate: Date;
  requestedDepartureDate?: Date;
  estimatedDepartureDate?: Date;
  estimatedArrivalDate?: Date;
  transitTime?: number;
  
  // Logistics Route
  incoterm: Incoterm;
  mode: TransportMode;
  pol: string;
  pod: string;
  
  // Cargo Details (Enhanced)
  cargoRows: any[];
  goodsDescription: string;
  hsCode?: string;
  packagingType: PackagingType; // New
  isHazmat: boolean;
  isStackable: boolean;
  isReefer: boolean; // New (Temp Control)
  temperature?: string; // New (e.g. "-18C")
  cargoValue?: number; // New (For Insurance)
  insuranceRequired: boolean; // New
  
  // Business Intelligence
  probability: Probability;
  competitorInfo?: string;
  internalNotes: string;
  
  // Financials
  baseCurrency: Currency; 
  quoteCurrency: Currency; 
  exchangeRates: Record<string, number>; 
  items: QuoteLineItem[];
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