// --- 1. CORE LOGISTICS ENUMS ---
export type Incoterm = 'EXW' | 'FOB' | 'CFR' | 'CIF' | 'DDP';
export type TransportMode = 'SEA_FCL' | 'SEA_LCL' | 'AIR' | 'ROAD';
export type Currency = 'MAD' | 'USD' | 'EUR';

// --- 2. QUOTE ENGINE MODELS ---
export interface Quote {
  id: string;
  reference: string;
  status: 'DRAFT' | 'PRICING' | 'VALIDATION' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  clientId: string;
  clientName: string;
  validityDate: Date;
  incoterm: Incoterm;
  mode: TransportMode;
  pol: string;
  pod: string;
  outputCurrency: Currency;
  marginBuffer: number;
  exchangeRates: Record<string, number>;
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
  isDisbursement: boolean;
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