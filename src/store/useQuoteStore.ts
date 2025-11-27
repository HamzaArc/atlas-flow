import { create } from 'zustand';
import { supabase } from '@/lib/supabase'; 
import { Quote, QuoteLineItem, TransportMode, Incoterm } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";

// --- TYPES ---
interface CargoRow {
  id: string;
  qty: number;
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface QuoteState {
  // --- DATABASE STATE ---
  quotes: Quote[];
  isLoading: boolean;

  // --- EDITOR STATE ---
  id: string;
  reference: string;
  status: 'DRAFT' | 'PRICING' | 'VALIDATION' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  clientId: string;
  clientName: string;
  salespersonId: string;
  salespersonName: string;
  validityDate: string;
  
  goodsDescription: string; 
  internalNotes: string;

  pol: string;
  pod: string;
  incoterm: Incoterm;
  mode: TransportMode;
  cargoRows: CargoRow[];
  
  // Financials
  items: QuoteLineItem[];
  exchangeRates: Record<string, number>;
  marginBuffer: number;
  totalVolume: number;
  totalWeight: number;
  chargeableWeight: number;
  totalSellMAD: number;
  totalTaxMAD: number;
  totalSellTTC: number;
  totalMarginMAD: number;

  // --- ACTIONS ---
  
  // Editor Setters
  setIdentity: (field: string, value: string) => void;
  setStatus: (status: QuoteState['status']) => void;
  setRoute: (pol: string, pod: string, mode: TransportMode) => void;
  setIncoterm: (incoterm: Incoterm) => void;
  updateCargo: (rows: CargoRow[]) => void;
  addLineItem: (section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION') => void;
  updateLineItem: (id: string, field: keyof QuoteLineItem, value: any) => void;
  removeLineItem: (id: string) => void;
  
  // Cloud Actions
  fetchQuotes: () => Promise<void>;
  saveQuote: () => Promise<void>;
  loadQuote: (id: string) => void; 
  createNewQuote: () => void;
  deleteQuote: (id: string) => Promise<void>;
  duplicateQuote: () => void;
}

// Default Editor State
const DEFAULT_STATE = {
  id: 'new',
  reference: 'Q-24-DRAFT',
  status: 'DRAFT' as const,
  clientId: '',
  clientName: '',
  salespersonId: 'user-1', 
  salespersonName: 'Youssef (Sales)',
  validityDate: new Date().toISOString().split('T')[0],
  goodsDescription: '',
  internalNotes: '',
  pol: '',
  pod: '',
  incoterm: 'FOB' as Incoterm,
  mode: 'SEA_LCL' as TransportMode,
  cargoRows: [{ id: '1', qty: 1, length: 0, width: 0, height: 0, weight: 0 }],
  totalVolume: 0,
  totalWeight: 0,
  chargeableWeight: 0,
  items: [],
  exchangeRates: { MAD: 1, USD: 10.0, EUR: 11.0 },
  marginBuffer: 1.02,
  totalSellMAD: 0,
  totalTaxMAD: 0,
  totalSellTTC: 0,
  totalMarginMAD: 0,
};

// Helper: Tax Logic
const getTaxRate = (rule: string) => {
  switch (rule) {
    case 'STD_20': return 0.20;
    case 'ROAD_14': return 0.14;
    case 'EXPORT_0_ART92': return 0.0;
    default: return 0.20;
  }
};

export const useQuoteStore = create<QuoteState>((set, get) => ({
  quotes: [],
  isLoading: false,
  ...DEFAULT_STATE,

  // --- EDITOR LOGIC ---
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
      id: Math.random().toString(36).substring(7),
      quoteId: get().id,
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
    const newItems = get().items.filter(i => i.id !== id);
    set({ items: newItems });
    // Trigger recalc via dummy update
    get().updateLineItem('trigger', 'description', 'trigger'); 
  },

  updateLineItem: (id, field, value) => {
    const { items } = get();
    // Special handling to allow triggering recalc without changing data
    const updatedItems = items.map(item => {
      if (item.id !== id && id !== 'trigger') return item;
      if (id !== 'trigger') return { ...item, [field]: value };
      return item;
    });
    
    let totalSell = 0;
    let totalTax = 0;
    let totalBuy = 0;

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
        
        const taxAmount = sellPrice * getTaxRate(item.vatRule);
        totalSell += sellPrice;
        totalTax += taxAmount;
        totalBuy += (item.buyPrice * rate);
    });

    set({ 
        items: updatedItems, 
        totalSellMAD: parseFloat(totalSell.toFixed(2)),
        totalTaxMAD: parseFloat(totalTax.toFixed(2)),
        totalSellTTC: parseFloat((totalSell + totalTax).toFixed(2)),
        totalMarginMAD: parseFloat((totalSell - totalBuy).toFixed(2))
    });
  },

  // --- CLOUD INTERACTION LOGIC ---

  fetchQuotes: async () => {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
          console.error('Error fetching quotes:', error);
          set({ isLoading: false });
          return;
      }

      const mappedQuotes: Quote[] = data.map((row: any) => ({
          id: row.id,
          reference: row.reference,
          status: row.status,
          clientName: row.client_name,
          validityDate: new Date(row.validity_date),
          pol: row.pol,
          pod: row.pod,
          mode: row.data.mode || 'SEA_LCL',
          incoterm: row.data.incoterm || 'FOB',
          clientId: '', 
          outputCurrency: 'MAD',
          marginBuffer: row.data.marginBuffer || 1.0,
          exchangeRates: row.data.exchangeRates || {}
      }));

      set({ quotes: mappedQuotes, isLoading: false });
  },

  saveQuote: async () => {
      const state = get();

      // 1. VALIDATION GUARD
      if (!state.clientName) {
          useToast.getState().toast("Missing Client Name. Please select a customer.", "error");
          return;
      }
      if (!state.pol || !state.pod) {
          useToast.getState().toast("Route Incomplete. Please specify Origin and Destination.", "error");
          return;
      }
      if (state.items.length === 0) {
          useToast.getState().toast("No Charges. Please add at least one line item.", "error");
          return;
      }

      set({ isLoading: true });
      
      const jsonPayload = {
          mode: state.mode,
          incoterm: state.incoterm,
          cargoRows: state.cargoRows,
          items: state.items,
          goodsDescription: state.goodsDescription,
          internalNotes: state.internalNotes,
          exchangeRates: state.exchangeRates,
          marginBuffer: state.marginBuffer,
          salespersonName: state.salespersonName
      };

      const dbRow = {
          reference: state.reference,
          status: state.status,
          client_name: state.clientName,
          pol: state.pol,
          pod: state.pod,
          validity_date: state.validityDate,
          total_ttc: state.totalSellTTC,
          data: jsonPayload
      };

      const isNew = state.id === 'new';
      let resultId = state.id;

      try {
          if (isNew) {
              const { data, error } = await supabase.from('quotes').insert([dbRow]).select().single();
              if (error) throw error;
              resultId = data.id;
          } else {
              const { error } = await supabase.from('quotes').update(dbRow).eq('id', state.id);
              if (error) throw error;
          }

          await get().fetchQuotes();
          set({ id: resultId, isLoading: false });
          
          useToast.getState().toast(`Quote ${state.reference} saved successfully!`, "success");

      } catch (error: any) {
          console.error(error);
          set({ isLoading: false });
          useToast.getState().toast("Failed to save quote. Check console.", "error");
      }
  },

  loadQuote: async (id) => {
      set({ isLoading: true });
      const { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
      
      if (error || !data) {
          console.error("Load Error", error);
          set({ isLoading: false });
          return;
      }

      const json = data.data; 

      set({
          isLoading: false,
          id: data.id,
          reference: data.reference,
          status: data.status,
          clientName: data.client_name,
          pol: data.pol,
          pod: data.pod,
          validityDate: data.validity_date,
          // Hydrate from JSONB
          mode: json.mode,
          incoterm: json.incoterm,
          cargoRows: json.cargoRows || [],
          items: json.items || [],
          goodsDescription: json.goodsDescription || '',
          internalNotes: json.internalNotes || '',
          exchangeRates: json.exchangeRates,
          marginBuffer: json.marginBuffer
      });
  },

  deleteQuote: async (id) => {
      if(!confirm("Are you sure you want to delete this quote?")) return;
      
      set({ isLoading: true });
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      
      if (error) {
          useToast.getState().toast("Failed to delete quote.", "error");
      } else {
          useToast.getState().toast("Quote deleted successfully.", "info");
          await get().fetchQuotes();
      }
      set({ isLoading: false });
  },

  createNewQuote: () => {
    set({ ...DEFAULT_STATE, id: 'new', reference: `Q-24-${Math.floor(Math.random() * 10000)}` });
  },

  duplicateQuote: () => {
    const current = get();
    set({
        ...current,
        id: 'new',
        reference: `${current.reference}-COPY`,
        status: 'DRAFT'
    });
    useToast.getState().toast("Duplicated! Click Save to write to Cloud.", "info");
  }

}));