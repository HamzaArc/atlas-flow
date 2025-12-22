import { create } from 'zustand';
import { SupplierRate, RateCharge } from '@/types/tariff';
import { useToast } from "@/components/ui/use-toast";
import { TariffService } from '@/services/tariff.service';

interface TariffState {
    rates: SupplierRate[];
    activeRate: SupplierRate | null;
    isLoading: boolean;

    // Actions
    fetchRates: () => Promise<void>;
    createRate: () => void;
    loadRate: (id: string) => void;
    saveRate: () => Promise<void>;
    deleteRate: (id: string) => Promise<void>;

    // Editor Actions - STRICT TYPING
    updateRateField: <K extends keyof SupplierRate>(field: K, value: SupplierRate[K]) => void;
    
    addChargeRow: (section: 'freightCharges' | 'originCharges' | 'destCharges') => void;
    
    updateChargeRow: <K extends keyof RateCharge>(
        section: 'freightCharges' | 'originCharges' | 'destCharges', 
        id: string, 
        field: K, 
        value: RateCharge[K]
    ) => void;
    
    removeChargeRow: (section: 'freightCharges' | 'originCharges' | 'destCharges', id: string) => void;
}

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
        try {
            const rates = await TariffService.fetchAll();
            set({ rates, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            useToast.getState().toast("Failed to load rates", "error");
        }
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
        const { rates, activeRate } = get();
        if (!activeRate) return;

        await TariffService.save(activeRate);

        const idx = rates.findIndex(r => r.id === activeRate.id);
        const newRates = [...rates];
        
        // Optimistic Update
        const savedRate = { ...activeRate, status: 'ACTIVE' as const, updatedAt: new Date() };
        
        if (idx >= 0) newRates[idx] = savedRate;
        else newRates.unshift(savedRate);

        set({ rates: newRates, activeRate: savedRate, isLoading: false });
        useToast.getState().toast("Rate sheet saved successfully", "success");
    },

    deleteRate: async (id) => {
        await TariffService.delete(id);
        set(state => ({ rates: state.rates.filter(r => r.id !== id) }));
        useToast.getState().toast("Rate deleted", "info");
    },

    // --- STRICT TYPE SAFETY IMPLEMENTATION ---
    updateRateField: (field, value) => {
        set(state => state.activeRate ? ({ activeRate: { ...state.activeRate, [field]: value } }) : {});
    },

    addChargeRow: (section) => {
        set(state => {
            if (!state.activeRate) return {};
            const newRow = TariffService.createChargeRow(state.activeRate.currency);
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