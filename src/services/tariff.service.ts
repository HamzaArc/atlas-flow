import { SupplierRate, RateCharge } from '@/types/tariff';

// --- MOCK DATA (Moved from Store) ---
const MOCK_RATES: SupplierRate[] = [
    {
        id: '1', reference: 'CN-MAE-2024-01', carrierId: 'sup_1', carrierName: 'Maersk Line',
        mode: 'SEA_FCL', type: 'CONTRACT', status: 'ACTIVE',
        validFrom: new Date('2024-01-01'), validTo: new Date('2024-12-31'),
        pol: 'SHANGHAI (CN)', pod: 'CASABLANCA (MAP)', transitTime: 28, serviceLoop: 'AEU3',
        currency: 'USD', incoterm: 'CY/CY', freeTime: 14, paymentTerms: 'PREPAID',
        freightCharges: [
            { id: 'c1', chargeHead: 'Ocean Freight', isSurcharge: false, price20DV: 1200, price40DV: 2200, price40HC: 2200, price40RF: 3500, currency: 'USD' },
            { id: 'c2', chargeHead: 'BAF (Bunker)', isSurcharge: true, price20DV: 150, price40DV: 300, price40HC: 300, price40RF: 450, currency: 'USD' }
        ],
        originCharges: [], destCharges: [], remarks: 'Subject to GRI', updatedAt: new Date()
    }
];

export const TariffService = {
    fetchAll: async (): Promise<SupplierRate[]> => {
        // Simulate API latency
        return new Promise((resolve) => {
            setTimeout(() => resolve([...MOCK_RATES]), 500);
        });
    },

    save: async (rate: SupplierRate): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), 600);
        });
    },

    delete: async (id: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), 300);
        });
    },

    /**
     * Factory for creating a clean new Charge Row
     */
    createChargeRow: (currency: string = 'USD'): RateCharge => ({
        id: Math.random().toString(36).substr(2, 9),
        chargeHead: '', 
        isSurcharge: false,
        price20DV: 0, 
        price40DV: 0, 
        price40HC: 0, 
        price40RF: 0,
        currency: currency
    })
};