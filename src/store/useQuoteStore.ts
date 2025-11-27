import { create } from 'zustand';
import { QuoteLineItem, TransportMode, Incoterm } from '@/types/index';

interface CargoRow {
  id: string;
  qty: number;
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface QuoteState {
  // --- IDENTIFICATION ---
  id: string;
  reference: string;
  status: 'DRAFT' | 'PRICING' | 'VALIDATION' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  clientId: string;
  clientName: string;
  salespersonId: string;
  salespersonName: string;
  validityDate: string; // <--- FIXED: Added missing field
  
  // --- LOGISTICS CONTEXT ---
  goodsDescription: string; 
  internalNotes: string;

  // --- LOGISTICS DATA ---
  pol: string;
  pod: string;
  incoterm: Incoterm;
  mode: TransportMode;
  cargoRows: CargoRow[];
  totalVolume: number;
  totalWeight: number;
  chargeableWeight: number;
  
  // --- FINANCIALS ---
  items: QuoteLineItem[];
  exchangeRates: Record<string, number>;
  marginBuffer: number;
  totalSellMAD: number;
  totalMarginMAD: number;

  // --- ACTIONS ---
  setIdentity: (field: 'clientId' | 'clientName' | 'salespersonId' | 'salespersonName' | 'goodsDescription' | 'internalNotes' | 'validityDate', value: string) => void; // Added validityDate here too
  setStatus: (status: QuoteState['status']) => void;
  
  setRoute: (pol: string, pod: string, mode: TransportMode) => void;
  setIncoterm: (incoterm: Incoterm) => void;
  updateCargo: (rows: CargoRow[]) => void;
  
  addLineItem: (section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION') => void;
  updateLineItem: (id: string, field: keyof QuoteLineItem, value: any) => void;
  removeLineItem: (id: string) => void;
  
  saveQuote: () => Promise<void>;
}

export const useQuoteStore = create<QuoteState>((set, get) => ({
  // Defaults
  id: 'new',
  reference: 'Q-24-DRAFT',
  status: 'DRAFT',
  clientId: '',
  clientName: '',
  salespersonId: 'user-1', 
  salespersonName: 'Youssef (Sales)',
  validityDate: new Date().toISOString().split('T')[0], // Default to Today
  goodsDescription: '',
  internalNotes: '',

  pol: '',
  pod: '',
  incoterm: 'FOB',
  mode: 'SEA_LCL',
  cargoRows: [{ id: '1', qty: 1, length: 0, width: 0, height: 0, weight: 0 }],
  totalVolume: 0,
  totalWeight: 0,
  chargeableWeight: 0,

  items: [],
  exchangeRates: { MAD: 1, USD: 10.0, EUR: 11.0 },
  marginBuffer: 1.02,
  totalSellMAD: 0,
  totalMarginMAD: 0,

  // Setters
  setIdentity: (field, value) => set((state) => ({ ...state, [field]: value })),
  setStatus: (status) => set({ status }),

  setRoute: (pol, pod, mode) => {
    set({ pol, pod, mode });
    get().updateCargo(get().cargoRows);
  },

  setIncoterm: (incoterm) => set({ incoterm }),

  updateCargo: (rows) => {
    const { mode } = get();
    let vol = 0;
    let weight = 0;
    rows.forEach(r => {
      const rowVol = (r.length * r.width * r.height * r.qty) / 1000000;
      vol += rowVol;
      weight += (r.weight * r.qty);
    });

    let volumetricWeight = 0;
    if (mode === 'AIR') volumetricWeight = (vol * 1000000) / 6000;
    if (mode === 'SEA_LCL') volumetricWeight = vol * 1000;
    if (mode === 'ROAD') volumetricWeight = vol * 333;
    
    set({
      cargoRows: rows,
      totalVolume: parseFloat(vol.toFixed(3)),
      totalWeight: parseFloat(weight.toFixed(2)),
      chargeableWeight: parseFloat(Math.max(weight, volumetricWeight).toFixed(2))
    });
  },

  addLineItem: (section) => {
    const newItem: QuoteLineItem = {
      id: Math.random().toString(),
      quoteId: 'temp',
      section,
      description: '',
      buyPrice: 0,
      buyCurrency: 'MAD',
      markupType: 'PERCENT',
      markupValue: 0,
      vatRule: 'STD_20',
      isDisbursement: false
    };
    set(state => ({ items: [...state.items, newItem] }));
  },

  removeLineItem: (id) => {
    set(state => ({ items: state.items.filter(i => i.id !== id) }));
  },

  updateLineItem: (id, field, value) => {
    const { items } = get();
    const updatedItems = items.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: value };
    });
    
    let grandTotalSell = 0;
    let grandTotalBuyMAD = 0;

    updatedItems.forEach(item => {
        const rate = get().exchangeRates[item.buyCurrency] || 1;
        const bufferedRate = rate * get().marginBuffer;
        const costInMAD = item.buyPrice * bufferedRate;

        let sellPrice = 0;
        if (item.markupType === 'PERCENT') {
            sellPrice = costInMAD * (1 + (item.markupValue / 100));
        } else {
            sellPrice = costInMAD + item.markupValue;
        }
        grandTotalSell += sellPrice;
        grandTotalBuyMAD += (item.buyPrice * rate);
    });

    set({ 
        items: updatedItems, 
        totalSellMAD: parseFloat(grandTotalSell.toFixed(2)),
        totalMarginMAD: parseFloat((grandTotalSell - grandTotalBuyMAD).toFixed(2))
    });
  },

  saveQuote: async () => {
      const state = get();
      console.log("SAVING TO DB:", state);
      alert(`Quote ${state.reference} Saved!`);
  }
}));