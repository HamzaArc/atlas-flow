import { create } from 'zustand';
import { SupplierRate, RateCharge, RateMode } from '@/types/tariff';
import { useToast } from "@/components/ui/use-toast";

interface TariffState {
    rates: SupplierRate[];
    activeRate: SupplierRate | null;
    isLoading: boolean;

    // Actions
    fetchRates: () => Promise<void>;
    createRate: () => void;
    loadRate: (id: string) => void;
    saveRate: () => Promise<void>;
    deleteRate: (id: string) => void;

    // Editor Actions
    updateRateField: (field: keyof SupplierRate, value: any) => void;
    addChargeRow: (section: 'freightCharges' | 'originCharges' | 'destCharges') => void;
    updateChargeRow: (section: 'freightCharges' | 'originCharges' | 'destCharges', id: string, field: keyof RateCharge, value: any) => void;
    removeChargeRow: (section: 'freightCharges' | 'originCharges' | 'destCharges', id: string) => void;
}

// Mock Data for Dashboard
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

const EMPTY_RATE: SupplierRate = {
    id: 'new', reference: 'NEW-RATE', carrierId: '', carrierName: '',
    mode: 'SEA_FCL', type: 'SPOT', status: 'DRAFT',
    validFrom: new Date(), validTo: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    pol: '', pod: '', transitTime: 0,
    currency: 'USD', incoterm: 'CY/CY', freeTime: 7, paymentTerms: 'PREPAID',
    freightCharges: [], originCharges: [], destCharges: [], remarks: '', updatedAt: new Date()
};

export const useTariffStore = create<TariffState>((set, get) => ({
    rates: [],
    activeRate: null,
    isLoading: false,

    fetchRates: async () => {
        set({ isLoading: true });
        // Simulate API
        setTimeout(() => set({ rates: MOCK_RATES, isLoading: false }), 500);
    },

    createRate: () => {
        set({ activeRate: { ...EMPTY_RATE, id: `new-${Date.now()}` } });
    },

    loadRate: (id) => {
        const found = get().rates.find(r => r.id === id);
        if (found) set({ activeRate: JSON.parse(JSON.stringify(found)) });
    },

    saveRate: async () => {
        set({ isLoading: true });
        setTimeout(() => {
            const { rates, activeRate } = get();
            if (!activeRate) return;
            
            const idx = rates.findIndex(r => r.id === activeRate.id);
            const newRates = [...rates];
            if (idx >= 0) newRates[idx] = { ...activeRate, status: 'ACTIVE' };
            else newRates.unshift({ ...activeRate, status: 'ACTIVE' });

            set({ rates: newRates, isLoading: false });
            useToast.getState().toast("Rate sheet saved successfully", "success");
        }, 600);
    },

    deleteRate: (id) => {
        set(state => ({ rates: state.rates.filter(r => r.id !== id) }));
        useToast.getState().toast("Rate deleted", "info");
    },

    updateRateField: (field, value) => {
        set(state => state.activeRate ? ({ activeRate: { ...state.activeRate, [field]: value } }) : {});
    },

    addChargeRow: (section) => {
        set(state => {
            if (!state.activeRate) return {};
            const newRow: RateCharge = {
                id: Math.random().toString(36),
                chargeHead: '', isSurcharge: false,
                price20DV: 0, price40DV: 0, price40HC: 0, price40RF: 0,
                currency: state.activeRate.currency
            };
            return {
                activeRate: {
                    ...state.activeRate,
                    [section]: [...state.activeRate[section], newRow]
                }
            };
        });
    },

    updateChargeRow: (section, id, field, value) => {
        set(state => {
            if (!state.activeRate) return {};
            return {
                activeRate: {
                    ...state.activeRate,
                    [section]: state.activeRate[section].map(row => 
                        row.id === id ? { ...row, [field]: value } : row
                    )
                }
            };
        });
    },

    removeChargeRow: (section, id) => {
        set(state => {
            if (!state.activeRate) return {};
            return {
                activeRate: {
                    ...state.activeRate,
                    [section]: state.activeRate[section].filter(r => r.id !== id)
                }
            };
        });
    }
}));