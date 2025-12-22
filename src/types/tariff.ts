import { Client } from "./index";

export type RateMode = 'SEA_FCL' | 'SEA_LCL' | 'AIR' | 'ROAD';
export type RateType = 'CONTRACT' | 'SPOT' | 'NAC';
export type ContainerType = '20DV' | '40DV' | '40HC' | '40RF';

// NEW: Granular Charge Logic
export type ChargeBasis = 'CONTAINER' | 'WEIGHT' | 'VOLUME' | 'TAXABLE_WEIGHT' | 'FLAT' | 'PERCENTAGE';
export type ChargeSection = 'FREIGHT' | 'ORIGIN' | 'DESTINATION';

export interface RateCharge {
    id: string;
    chargeHead: string; // e.g., "Ocean Freight", "BAF", "ISPS"
    isSurcharge: boolean;
    
    // Logic Configuration
    basis: ChargeBasis;
    tierMin?: number; // For tiered rates (e.g. > 100kg)
    tierMax?: number; 
    
    // Pricing columns
    price20DV: number;
    price40DV: number;
    price40HC: number;
    price40RF: number;
    
    // Non-Container Pricing
    unitPrice: number; // For Per KG, Per CBM, or Flat
    percentage: number; // For ad-valorem

    currency: string;
}

export interface SupplierRate {
    id: string;
    reference: string; // e.g. "NAC-TEX-24"
    carrierId: string;
    carrierName: string; // Denormalized for UI speed
    mode: RateMode;
    type: RateType;
    status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';
    
    // Validity
    validFrom: Date;
    validTo: Date;
    
    // Route Logic
    pol: string; // Port of Loading
    pod: string; // Port of Discharge
    transitTime: number; // Days
    serviceLoop?: string; // e.g. "AEU3"
    
    // Commercials
    currency: string;
    incoterm: string; // Scope (e.g. CY/CY)
    freeTime: number; // Detention days
    paymentTerms: 'PREPAID' | 'COLLECT';
    
    // Matrix
    freightCharges: RateCharge[];
    originCharges: RateCharge[];
    destCharges: RateCharge[];
    
    // Meta
    remarks: string;
    updatedAt: Date;
}