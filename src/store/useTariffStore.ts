import { create } from 'zustand';
import { SupplierRate, RateCharge } from '@/types/tariff';
import { QuoteLineItem } from '@/types/index';
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

    // Editor Actions
    updateRateField: <K extends keyof SupplierRate>(field: K, value: SupplierRate[K]) => void;
    addChargeRow: (section: 'freightCharges' | 'originCharges' | 'destCharges') => void;
    updateChargeRow: <K extends keyof RateCharge>(
        section: 'freightCharges' | 'originCharges' | 'destCharges', 
        id: string, 
        field: K, 
        value: RateCharge[K]
    ) => void;
    removeChargeRow: (section: 'freightCharges' | 'originCharges' | 'destCharges', id: string) => void;

    // Smart Pricing & Injection
    findBestMatch: (params: { pol: string; pod: string; mode: string; incoterm: string; date: Date }) => SupplierRate | undefined;
    addSpotRateFromQuote: (params: { 
        item: QuoteLineItem; 
        pol: string; 
        pod: string; 
        mode: string; 
    }) => void;
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

    updateRateField: (field, value) => {
        set(state => state.activeRate ? ({ activeRate: { ...state.activeRate, [field]: value } }) : {});
    },

    addChargeRow: (section) => {
        set(state => {
            if (!state.activeRate) return {};
            const mode = state.activeRate.mode;
            const defaultBasis = mode === 'AIR' ? 'TAXABLE_WEIGHT' : 'CONTAINER';
            
            const newRow: RateCharge = {
                id: Math.random().toString(36).substr(2, 9),
                chargeHead: 'New Charge',
                isSurcharge: false,
                basis: defaultBasis,
                price20DV: 0, price40DV: 0, price40HC: 0, price40RF: 0,
                unitPrice: 0, minPrice: 0, percentage: 0,
                currency: state.activeRate.currency,
                vatRule: 'STD_20'
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
    },

    // --- INTELLIGENCE LAYER (UPDATED) ---
    findBestMatch: ({ pol, pod, mode, incoterm, date }) => {
        const { rates } = get();
        
        // 1. Strict Match: Route + Mode + Status
        const candidates = rates.filter(r => 
            r.status === 'ACTIVE' &&
            r.mode === mode &&
            r.pol === pol && 
            r.pod === pod
        );

        if (candidates.length === 0) return undefined;

        // 2. Filter by Validity
        const validCandidates = candidates.filter(r => {
            const from = new Date(r.validFrom);
            const to = new Date(r.validTo);
            return date >= from && date <= to;
        });

        // 3. Filter by Incoterm (Service Scope)
        const scopeMatches = validCandidates.filter(r => 
            r.incoterm === incoterm || 
            (incoterm === 'CY/CY' && !r.incoterm) // Fallback for legacy data
        );

        // 4. Selection Strategy: Prioritize Contracts over Spot, then newest
        return scopeMatches.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'CONTRACT' ? -1 : 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })[0];
    },

    // Feature: Create Spot Rate from Quote
    addSpotRateFromQuote: async ({ item, pol, pod, mode }) => {
        if (!item.vendorName || !item.buyPrice) {
            useToast.getState().toast("Cannot save: Missing Vendor or Price", "error");
            return;
        }

        const newCharge: RateCharge = {
            id: Math.random().toString(36).substr(2, 9),
            chargeHead: item.description,
            isSurcharge: false,
            basis: 'CONTAINER', // Default assumption, user can edit later
            price20DV: item.buyPrice,
            price40DV: item.buyPrice,
            price40HC: item.buyPrice,
            price40RF: item.buyPrice,
            unitPrice: item.buyPrice,
            minPrice: 0,
            percentage: 0,
            currency: item.buyCurrency,
            vatRule: item.vatRule as any
        };

        const newRate: SupplierRate = {
            ...EMPTY_RATE,
            id: `spot-${Date.now()}`,
            reference: `SPOT-${item.vendorName.toUpperCase().substring(0,3)}-${Date.now().toString().substring(8)}`,
            carrierName: item.vendorName,
            mode: mode as any,
            type: 'SPOT',
            status: 'ACTIVE',
            pol,
            pod,
            validFrom: new Date(),
            validTo: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 Day Validity for Spot
            freightCharges: item.section === 'FREIGHT' ? [newCharge] : [],
            originCharges: item.section === 'ORIGIN' ? [newCharge] : [],
            destCharges: item.section === 'DESTINATION' ? [newCharge] : [],
            updatedAt: new Date()
        };

        // Save to DB (mocked via Service) and State
        await TariffService.save(newRate);
        
        set(state => ({ rates: [newRate, ...state.rates] }));
        useToast.getState().toast("Spot Rate saved to Library!", "success");
    }
}));