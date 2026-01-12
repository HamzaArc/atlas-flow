export type RateMode = 'SEA_FCL' | 'SEA_LCL' | 'AIR' | 'ROAD';
export type RateType = 'CONTRACT' | 'SPOT' | 'NAC';
export type ContainerType = '20DV' | '40DV' | '40HC' | '40RF';

export type ChargeBasis = 'CONTAINER' | 'WEIGHT' | 'VOLUME' | 'TAXABLE_WEIGHT' | 'FLAT' | 'PERCENTAGE';
export type ChargeSection = 'FREIGHT' | 'ORIGIN' | 'DESTINATION';
export type VatRule = 'STD_20' | 'ROAD_14' | 'EXPORT_0' | 'EXEMPT';

export interface RateCharge {
    id: string;
    chargeHead: string; 
    isSurcharge: boolean;
    basis: ChargeBasis;
    price20DV: number;
    price40DV: number;
    price40HC: number;
    price40RF: number;
    unitPrice: number;
    minPrice: number;
    percentage: number;
    currency: string;
    vatRule: VatRule;
}

export interface SupplierRate {
    id: string;
    reference: string; 
    carrierId: string;
    carrierName: string;
    mode: RateMode;
    type: RateType;
    status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';
    
    // Validity
    validFrom: Date;
    validTo: Date;
    
    // Route Logic
    pol: string; 
    pod: string; 
    transitTime: number; 
    serviceLoop?: string; 
    
    // Commercials
    currency: string;
    incoterm: string;
    freeTime: number; 
    paymentTerms: 'PREPAID' | 'COLLECT';
    
    // NEW: Intelligence Fields
    reliabilityScore?: number; // 1-5 score for carrier performance
    volatilityFlag?: boolean; // True if price jumped >10% recently
    previousRateRef?: string; // Link to the rate this replaces
    
    // Matrix
    freightCharges: RateCharge[];
    originCharges: RateCharge[];
    destCharges: RateCharge[];
    
    remarks: string;
    updatedAt: Date;
}