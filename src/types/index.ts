import { create } from 'zustand';

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
  quoteId: string;
  section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION';
  description: string;
  buyPrice: number;
  buyCurrency: Currency;
  markupType: 'PERCENT' | 'FIXED_AMOUNT';
  markupValue: number;
  vatRule: 'STD_20' | 'ROAD_14' | 'EXPORT_0_ART92' | 'DISBURSEMENT';
}

export interface Quote {
  id: string;
  reference: string;
  customerReference?: string;
  status: 'DRAFT' | 'PRICING' | 'VALIDATION' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  clientId: string;
  clientName: string;
  salespersonId: string;
  salespersonName: string;
  validityDate: Date;
  cargoReadyDate: Date;
  requestedDepartureDate?: Date;
  estimatedDepartureDate?: Date;
  estimatedArrivalDate?: Date;
  transitTime?: number;
  freeTime?: number;
  incoterm: Incoterm;
  mode: TransportMode;
  pol: string;
  pod: string;
  placeOfLoading?: string;
  placeOfDelivery?: string;
  equipmentType?: string;
  containerCount: number;
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
  probability: Probability;
  competitorInfo?: string;
  internalNotes: string;
  activities: ActivityItem[];
  baseCurrency: Currency; 
  quoteCurrency: Currency; 
  exchangeRates: Record<string, number>; 
  items: QuoteLineItem[];
  totalTTC: number; 
  approval: QuoteApproval;
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
  packageType: PackagingType; // <--- ADDED REQUIRED PROPERTY
  volume: number; // cbm
  status: 'GATE_IN' | 'LOADED' | 'ON_WATER' | 'DISCHARGED' | 'DELIVERED' | 'EMPTY_RETURN';
  pickupDate?: string;
  returnDate?: string;
}

export interface Dossier {
  id: string;
  ref: string; // Internal File Ref (e.g., IMP-24-001)
  status: ShipmentStatus;
  
  // Linked Entities
  clientId: string;
  clientName: string;
  quoteId?: string;

  // Master Data
  mblNumber: string; // Master Bill of Lading
  hblNumber: string; // House Bill of Lading
  carrier: string;
  vesselName: string;
  voyageNumber: string;
  
  // Routing
  pol: string;
  pod: string;
  etd: Date;
  eta: Date;
  ata?: Date; // Actual Time of Arrival

  // Parties
  shipper: ShipmentParty;
  consignee: ShipmentParty;
  notify?: ShipmentParty;

  // Operational Logic
  incoterm: Incoterm;
  mode: TransportMode;
  freeTimeDays: number; // Demurrage allowance
  
  // Sub-Resources
  containers: DossierContainer[];
  activities: ActivityItem[];
  
  // Financial Snapshot (Derived from P&L)
  totalRevenue: number;
  totalCost: number;
  currency: Currency;
}

// Re-export legacy types if needed for compatibility
export interface Client {
  id: string;
  name: string;
  ice: string;
  rc?: string;
  paymentTerms: 'CASH' | '30_DAYS' | '60_DAYS';
  creditLimit: number;
}