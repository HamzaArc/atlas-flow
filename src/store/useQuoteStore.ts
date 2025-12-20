import { create } from 'zustand';
import { supabase } from '@/lib/supabase'; 
import { Quote, QuoteLineItem, QuoteOption, TransportMode, Incoterm, Currency, Probability, PackagingType, ActivityItem, ActivityCategory, QuoteApproval } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";

// --- UPDATED TYPES ---
interface CargoRow {
  id: string;
  qty: number;
  pkgType: PackagingType; 
  length: number;
  width: number;
  height: number;
  weight: number;
  isStackable: boolean; 
}

// TEMPLATE TYPES
type PricingTemplate = 'IMPORT_STD' | 'EXPORT_STD' | 'CROSS_TRADE' | 'CLEARANCE_ONLY';

interface QuoteState {
  // --- DATABASE STATE ---
  quotes: Quote[];
  isLoading: boolean;

  // --- EDITOR STATE (Global RFQ Context) ---
  id: string;
  reference: string;
  customerReference: string;
  status: 'DRAFT' | 'PRICING' | 'VALIDATION' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  
  // CRM & Identity
  clientId: string;
  clientName: string;
  salespersonId: string;
  salespersonName: string;
  
  // Dates & KPIs (Global)
  validityDate: string;
  cargoReadyDate: string;
  requestedDepartureDate: string;
  estimatedDepartureDate: string;
  estimatedArrivalDate: string;
  
  probability: Probability;
  competitorInfo: string;
  
  // Cargo Specifics (Shared across options usually)
  goodsDescription: string; 
  hsCode: string;
  isHazmat: boolean;
  isReefer: boolean;
  temperature: string;
  cargoValue: number;
  insuranceRequired: boolean;
  internalNotes: string;

  cargoRows: CargoRow[];
  
  // --- MULTI-OPTION ENGINE (New) ---
  options: QuoteOption[];
  activeOptionId: string; // The ID of the currently selected tab

  // --- FACADE PROPERTIES (Mapped to Active Option for UI compatibility) ---
  mode: TransportMode;
  incoterm: Incoterm;
  pol: string;
  pod: string;
  placeOfLoading: string;
  placeOfDelivery: string;
  equipmentType: string;
  containerCount: number;
  transitTime: number; 
  freeTime: number;    

  items: QuoteLineItem[];
  exchangeRates: Record<string, number>;
  marginBuffer: number;
  quoteCurrency: Currency; 

  // Calculated Fields (Active Option)
  totalVolume: number;
  totalWeight: number;
  totalPackages: number; 
  chargeableWeight: number;
  densityRatio: number; 
  
  // Internal Reporting (MAD) (Active Option)
  totalCostMAD: number;
  totalSellMAD: number;
  totalMarginMAD: number;
  totalTaxMAD: number; 
  totalTTCMAD: number; 
  
  // Client Facing (Target) (Active Option)
  totalSellTarget: number; 
  totalTaxTarget: number;  
  totalTTCTarget: number;  

  // Workflow Engine
  approval: QuoteApproval;
  activities: ActivityItem[];

  // --- ACTIONS ---
  setIdentity: (field: string, value: any) => void;
  setStatus: (status: QuoteState['status']) => void;
  
  // Option Management
  createOption: (mode: TransportMode) => void;
  setActiveOption: (optionId: string) => void;
  removeOption: (optionId: string) => void;
  duplicateOption: (optionId: string) => void;

  // Active Option Setters
  setMode: (mode: TransportMode) => void; 
  setIncoterm: (incoterm: Incoterm) => void;
  setRouteLocations: (field: 'pol' | 'pod' | 'placeOfLoading' | 'placeOfDelivery', value: string) => void;
  setEquipment: (type: string, count: number) => void;

  updateCargo: (rows: CargoRow[]) => void;
  setExchangeRate: (currency: string, rate: number) => void;
  setQuoteCurrency: (currency: Currency) => void;
  
  addLineItem: (section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION') => void;
  updateLineItem: (id: string, field: keyof QuoteLineItem, value: any) => void;
  removeLineItem: (id: string) => void;
  applyTemplate: (template: PricingTemplate) => void;
  
  addActivity: (text: string, category?: ActivityCategory, tone?: 'success' | 'neutral' | 'warning' | 'destructive') => void;
  
  attemptSubmission: () => Promise<void>;
  submitForApproval: () => Promise<void>;
  approveQuote: (comment?: string) => Promise<void>;
  rejectQuote: (reason: string) => Promise<void>;

  fetchQuotes: () => Promise<void>;
  saveQuote: () => Promise<void>;
  loadQuote: (id: string) => void; 
  createNewQuote: () => void;
  deleteQuote: (id: string) => Promise<void>;
  duplicateQuote: () => void;
}

// Helper to generate a fresh option
const createDefaultOption = (quoteId: string, mode: TransportMode = 'SEA_LCL'): QuoteOption => ({
    id: Math.random().toString(36).substring(7),
    quoteId,
    name: mode === 'AIR' ? 'Air Freight Option' : 'Sea Freight Option',
    isRecommended: true,
    mode,
    incoterm: mode === 'AIR' ? 'FCA' : 'FOB',
    pol: 'CASABLANCA (MAP)',
    pod: 'SHANGHAI (CN)',
    placeOfLoading: '',
    placeOfDelivery: '',
    equipmentType: '',
    containerCount: 1,
    transitTime: 0,
    freeTime: 0,
    items: [],
    baseCurrency: 'MAD',
    quoteCurrency: 'MAD',
    exchangeRates: { MAD: 1, USD: 9.80, EUR: 10.75, GBP: 12.50 },
    marginBuffer: 1.02,
    totalTTC: 0
});

const DEFAULT_STATE = {
  id: 'new',
  reference: 'Q-24-DRAFT',
  customerReference: '',
  status: 'DRAFT' as const,
  clientId: '',
  clientName: '',
  salespersonId: 'user-1', 
  salespersonName: 'Youssef (Sales)',
  
  validityDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
  cargoReadyDate: new Date().toISOString().split('T')[0],
  requestedDepartureDate: '',
  estimatedDepartureDate: '',
  estimatedArrivalDate: '',
  
  probability: 'MEDIUM' as Probability,
  competitorInfo: '',

  goodsDescription: '',
  hsCode: '',
  isHazmat: false,
  isReefer: false,
  temperature: '',
  cargoValue: 0,
  insuranceRequired: false,
  internalNotes: '',
  
  cargoRows: [{ id: '1', qty: 1, pkgType: 'PALLETS' as PackagingType, length: 120, width: 80, height: 100, weight: 500, isStackable: true }],
  
  options: [],
  activeOptionId: '',

  // Facade Defaults (will be overwritten by active option)
  mode: 'SEA_LCL' as TransportMode,
  incoterm: 'FOB' as Incoterm,
  pol: '',
  pod: '',
  placeOfLoading: '',
  placeOfDelivery: '',
  equipmentType: '',
  containerCount: 1,
  transitTime: 0,
  freeTime: 0,
  items: [],
  exchangeRates: { MAD: 1, USD: 9.80, EUR: 10.75, GBP: 12.50 },
  marginBuffer: 1.02,
  quoteCurrency: 'MAD' as Currency,

  totalVolume: 0,
  totalWeight: 0,
  totalPackages: 0,
  chargeableWeight: 0,
  densityRatio: 0,

  approval: { requiresApproval: false, reason: null },
  
  activities: [
      { id: '1', category: 'SYSTEM', text: 'Quote initialized', meta: 'System', tone: 'neutral', timestamp: new Date() },
  ] as ActivityItem[],

  totalCostMAD: 0,
  totalSellMAD: 0,
  totalMarginMAD: 0,
  totalTaxMAD: 0,
  totalTTCMAD: 0,
  totalSellTarget: 0,
  totalTaxTarget: 0,
  totalTTCTarget: 0,
};

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

  // --- INIT HELPER ---
  // Initializes a quote with one default option if none exist
  createNewQuote: () => {
    const newState = { ...DEFAULT_STATE, id: 'new', reference: `Q-24-${Math.floor(Math.random() * 10000)}` };
    const defaultOption = createDefaultOption(newState.id);
    
    set({
        ...newState,
        options: [defaultOption],
        activeOptionId: defaultOption.id,
        // Hydrate facade
        mode: defaultOption.mode,
        incoterm: defaultOption.incoterm,
        pol: defaultOption.pol,
        pod: defaultOption.pod,
        items: defaultOption.items,
        exchangeRates: defaultOption.exchangeRates
    });
    get().updateCargo(newState.cargoRows);
  },

  setIdentity: (field, value) => set((state) => ({ ...state, [field]: value })),
  setStatus: async (status) => {
      set({ status });
      get().addActivity(`Status manually changed to ${status}`, 'SYSTEM', 'neutral');
      await get().saveQuote(); 
  },

  // --- OPTION MANAGEMENT ---
  
  createOption: (mode) => {
      const { id, options } = get();
      const newOpt = createDefaultOption(id, mode);
      
      // Clone basics from first option if available to save typing
      if (options.length > 0) {
          const base = options[0];
          newOpt.pol = base.pol;
          newOpt.pod = base.pod;
          newOpt.incoterm = base.incoterm;
      }

      set({ 
          options: [...options, newOpt],
          activeOptionId: newOpt.id 
      });
      get().setActiveOption(newOpt.id); // Triggers re-calculation and facade update
      useToast.getState().toast(`New ${mode} option added.`, "success");
  },

  setActiveOption: (optionId) => {
      const { options } = get();
      const opt = options.find(o => o.id === optionId);
      if (!opt) return;

      set({
          activeOptionId: optionId,
          // Hydrate Facade
          mode: opt.mode,
          incoterm: opt.incoterm,
          pol: opt.pol,
          pod: opt.pod,
          placeOfLoading: opt.placeOfLoading || '',
          placeOfDelivery: opt.placeOfDelivery || '',
          equipmentType: opt.equipmentType || '',
          containerCount: opt.containerCount || 1,
          transitTime: opt.transitTime || 0,
          freeTime: opt.freeTime || 0,
          items: opt.items,
          exchangeRates: opt.exchangeRates,
          marginBuffer: opt.marginBuffer,
          quoteCurrency: opt.quoteCurrency
      });
      // Trigger recalculation of financials for this option
      get().updateLineItem('trigger', 'description', 'trigger'); 
  },

  removeOption: (optionId) => {
      const { options, activeOptionId } = get();
      if (options.length <= 1) {
          useToast.getState().toast("Cannot delete the last option.", "error");
          return;
      }
      const newOptions = options.filter(o => o.id !== optionId);
      set({ options: newOptions });
      
      if (activeOptionId === optionId) {
          get().setActiveOption(newOptions[0].id);
      }
  },

  duplicateOption: (optionId) => {
     const { options } = get();
     const source = options.find(o => o.id === optionId);
     if (!source) return;

     const newOpt = { ...source, id: Math.random().toString(36).substring(7), name: `${source.name} (Copy)` };
     set({ options: [...options, newOpt] });
     get().setActiveOption(newOpt.id);
  },

  // --- FACADE SETTERS (Updates the Active Option) ---

  setMode: (mode) => {
      const { options, activeOptionId } = get();
      const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, mode } : o);
      set({ mode, options: updatedOptions });
      get().updateCargo(get().cargoRows); // Recalculate chargeable weight
  },

  setIncoterm: (incoterm) => {
      const { options, activeOptionId } = get();
      const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, incoterm } : o);
      set({ incoterm, options: updatedOptions });
  },

  setRouteLocations: (field, value) => {
      const { options, activeOptionId } = get();
      const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, [field]: value } : o);
      set({ [field]: value, options: updatedOptions });
  },

  setEquipment: (type, count) => {
      const { options, activeOptionId } = get();
      const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, equipmentType: type, containerCount: count } : o);
      set({ equipmentType: type, containerCount: count, options: updatedOptions });
  },

  setExchangeRate: (currency, rate) => {
    const { options, activeOptionId, exchangeRates } = get();
    const newRates = { ...exchangeRates, [currency]: rate };
    
    const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, exchangeRates: newRates } : o);
    set({ exchangeRates: newRates, options: updatedOptions });
    get().updateLineItem('trigger', 'description', 'trigger');
  },

  setQuoteCurrency: (currency) => {
    const { options, activeOptionId } = get();
    const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, quoteCurrency: currency } : o);
    set({ quoteCurrency: currency, options: updatedOptions });
    get().updateLineItem('trigger', 'description', 'trigger');
  },

  // --- UPDATED CALCULATION LOGIC ---
  updateCargo: (rows) => {
    const { mode } = get(); // Gets from facade (active option)
    let vol = 0;
    let weight = 0;
    let pkgs = 0;

    rows.forEach(r => {
      const rowVol = (r.length * r.width * r.height * r.qty) / 1000000;
      vol += rowVol;
      weight += (r.weight * r.qty);
      pkgs += r.qty;
    });
    
    // Expert Chargeable Weight Logic based on Active Option Mode
    let chargeable = 0;
    if (mode === 'AIR') chargeable = Math.max(weight, (vol * 1000000) / 6000); 
    else if (mode === 'SEA_LCL') chargeable = Math.max(weight, vol * 1000); 
    else if (mode === 'ROAD') chargeable = Math.max(weight, vol * 333); 
    else chargeable = weight; 
    
    const densityRatio = vol > 0 ? weight / vol : 0;

    set({
      cargoRows: rows,
      totalVolume: parseFloat(vol.toFixed(3)),
      totalWeight: parseFloat(weight.toFixed(2)),
      totalPackages: pkgs,
      chargeableWeight: parseFloat(chargeable.toFixed(2)),
      densityRatio: parseFloat(densityRatio.toFixed(0))
    });
  },

  addLineItem: (section) => {
    const { id, activeOptionId, options, items } = get();
    
    const newItem: QuoteLineItem = {
      id: Math.random().toString(36).substring(7),
      quoteId: id,
      optionId: activeOptionId, // NEW: Link to option
      section,
      description: '',
      buyPrice: 0,
      buyCurrency: 'MAD', 
      markupType: 'PERCENT',
      markupValue: 20, 
      vatRule: 'STD_20',
      vendorId: '', // NEW
      vendorName: '' // NEW
    };

    const newItems = [...items, newItem];
    const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, items: newItems } : o);

    set({ items: newItems, options: updatedOptions });
    get().updateLineItem('trigger', 'description', 'trigger');
  },

  removeLineItem: (itemId) => {
    const { items, options, activeOptionId } = get();
    const newItems = items.filter(i => i.id !== itemId);
    const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, items: newItems } : o);
    
    set({ items: newItems, options: updatedOptions });
    get().updateLineItem('trigger', 'description', 'trigger'); 
  },

  applyTemplate: (template) => {
      const { activeOptionId } = get();
      const newItems: QuoteLineItem[] = [];
      const createItem = (section: any, desc: string, price: number, curr: Currency = 'MAD', markup = 20): QuoteLineItem => ({
          id: Math.random().toString(36).substring(7),
          quoteId: get().id,
          optionId: activeOptionId,
          section,
          description: desc,
          buyPrice: price,
          buyCurrency: curr,
          markupType: 'PERCENT',
          markupValue: markup,
          vatRule: section === 'FREIGHT' ? 'EXPORT_0_ART92' : 'STD_20'
      });

      if (template === 'IMPORT_STD') {
          newItems.push(createItem('ORIGIN', 'EXW Charges (Pick up)', 150, 'EUR'));
          newItems.push(createItem('ORIGIN', 'Export Customs Clearance', 65, 'EUR'));
          newItems.push(createItem('FREIGHT', 'Ocean Freight (All In)', 1200, 'USD', 15));
          newItems.push(createItem('DESTINATION', 'THC Destination', 1600, 'MAD'));
          newItems.push(createItem('DESTINATION', 'Dossier Fee', 450, 'MAD'));
      } else if (template === 'EXPORT_STD') {
          newItems.push(createItem('ORIGIN', 'Trucking to Port', 1200, 'MAD'));
          newItems.push(createItem('ORIGIN', 'Customs Clearance', 800, 'MAD'));
          newItems.push(createItem('FREIGHT', 'Ocean Freight', 850, 'USD', 20));
          newItems.push(createItem('DESTINATION', 'DTHC (Prepaid)', 120, 'EUR'));
      }

      const { options } = get();
      const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, items: newItems } : o);

      set({ items: newItems, options: updatedOptions });
      get().updateLineItem('trigger', 'description', 'trigger');
      useToast.getState().toast("Pricing template applied successfully.", "success");
  },

  updateLineItem: (id, field, value) => {
    const { items, exchangeRates, quoteCurrency, options, activeOptionId } = get();
    
    // 1. Update the Item List
    const updatedItems = items.map(item => {
      if (item.id !== id && id !== 'trigger') return item;
      if (id !== 'trigger') return { ...item, [field]: value };
      return item;
    });
    
    // 2. Calculate Financials for this specific Option
    let totalCostMAD = 0;
    let totalSellMAD = 0;
    let totalTaxMAD = 0;

    updatedItems.forEach(item => {
        const buyRate = exchangeRates[item.buyCurrency] || 1;
        const costInMAD = item.buyPrice * buyRate;

        let sellInMAD = 0;
        if (item.markupType === 'PERCENT') {
            sellInMAD = costInMAD * (1 + (item.markupValue / 100));
        } else {
            const marginInMAD = item.markupValue * buyRate; 
            sellInMAD = costInMAD + marginInMAD;
        }
        
        const taxAmountMAD = sellInMAD * getTaxRate(item.vatRule);

        totalCostMAD += costInMAD;
        totalSellMAD += sellInMAD;
        totalTaxMAD += taxAmountMAD;
    });

    const targetRate = exchangeRates[quoteCurrency] || 1;
    const totalSellTarget = quoteCurrency === 'MAD' ? totalSellMAD : totalSellMAD / targetRate;
    const totalTaxTarget = quoteCurrency === 'MAD' ? totalTaxMAD : totalTaxMAD / targetRate;

    const totalMarginMAD = totalSellMAD - totalCostMAD;
    const marginPercent = totalSellMAD > 0 ? (totalMarginMAD / totalSellMAD) * 100 : 0;
    
    const requiresApproval = marginPercent < 15;
    const approvalReason = requiresApproval ? `Margin ${marginPercent.toFixed(1)}% is below 15% threshold` : null;

    // 3. Sync back to Options Array
    const updatedOptions = options.map(o => o.id === activeOptionId ? { 
        ...o, 
        items: updatedItems,
        totalTTC: totalSellMAD + totalTaxMAD // simplified storage
    } : o);

    set({ 
        items: updatedItems, 
        options: updatedOptions,
        totalCostMAD: parseFloat(totalCostMAD.toFixed(2)),
        totalSellMAD: parseFloat(totalSellMAD.toFixed(2)),
        totalMarginMAD: parseFloat(totalMarginMAD.toFixed(2)),
        totalTaxMAD: parseFloat(totalTaxMAD.toFixed(2)),
        totalTTCMAD: parseFloat((totalSellMAD + totalTaxMAD).toFixed(2)),
        totalSellTarget: parseFloat(totalSellTarget.toFixed(2)),
        totalTaxTarget: parseFloat(totalTaxTarget.toFixed(2)),
        totalTTCTarget: parseFloat((totalSellTarget + totalTaxTarget).toFixed(2)),
        approval: { ...get().approval, requiresApproval, reason: approvalReason }
    });
  },

  addActivity: (text, category = 'NOTE', tone = 'neutral') => {
      const newItem: ActivityItem = {
          id: Math.random().toString(36).substring(7),
          text,
          tone,
          category,
          meta: category === 'NOTE' ? 'You' : category === 'APPROVAL' ? 'Workflow' : 'System',
          timestamp: new Date()
      };
      set((state) => ({ activities: [newItem, ...state.activities] }));
  },

  // --- WORKFLOW ACTIONS ---
  
  attemptSubmission: async () => {
      const { approval } = get();
      if (approval.requiresApproval) {
          useToast.getState().toast("Approval required before sending.", "error");
      } else {
          set({ status: 'SENT' });
          get().addActivity('Quote sent to client', 'SYSTEM', 'success');
          await get().saveQuote(); 
          useToast.getState().toast("Quote marked as SENT.", "success");
      }
  },

  submitForApproval: async () => {
      const { approval } = get();
      set({ 
          status: 'VALIDATION',
          approval: { 
              ...approval, 
              requestedBy: 'Youssef (Sales)',
              requestedAt: new Date()
          }
      });
      get().addActivity(`Requested approval: ${approval.reason}`, 'APPROVAL', 'warning');
      await get().saveQuote(); 
      useToast.getState().toast("Submitted for Manager Approval", "success");
  },

  approveQuote: async (comment) => {
      const { approval } = get();
      set({ 
          status: 'SENT', 
          approval: {
              ...approval,
              requiresApproval: false, 
              approvedBy: 'Fatima (Manager)',
              approvedAt: new Date()
          }
      });
      get().addActivity(`Manager approved quote.${comment ? ` Note: ${comment}` : ''}`, 'APPROVAL', 'success');
      await get().saveQuote(); 
      useToast.getState().toast("Quote Approved & Validated", "success");
  },

  rejectQuote: async (reason) => {
      set({ 
          status: 'DRAFT', 
          approval: { ...get().approval, rejectionReason: reason }
      });
      get().addActivity(`Approval rejected: ${reason}`, 'APPROVAL', 'destructive');
      await get().saveQuote(); 
      useToast.getState().toast("Quote Rejected and reset to Draft", "info");
  },

  // --- DATABASE ACTIONS ---

  fetchQuotes: async () => {
      set({ isLoading: true });
      const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false });
      if (error) { set({ isLoading: false }); return; }

      const mappedQuotes: Quote[] = data.map((row: any) => ({
          id: row.id,
          reference: row.reference,
          status: row.status,
          clientName: row.client_name,
          validityDate: new Date(row.validity_date),
          
          // These top-level fields are legacy/display only now
          pol: row.pol,
          pod: row.pod,
          
          // Data Object Mapping
          clientId: '', 
          salespersonId: row.data.salespersonId || '',
          salespersonName: row.data.salespersonName || 'Admin',
          cargoRows: row.data.cargoRows || [],
          internalNotes: row.data.internalNotes || '',
          activities: row.data.activities || [],
          cargoReadyDate: new Date(row.data.cargoReadyDate || new Date()),
          probability: row.data.probability || 'MEDIUM',
          isReefer: row.data.isReefer || false,
          temperature: row.data.temperature || '',
          cargoValue: row.data.cargoValue || 0,
          insuranceRequired: row.data.insuranceRequired || false,
          isHazmat: row.data.isHazmat || false,
          goodsDescription: row.data.goodsDescription || '',
          hsCode: row.data.hsCode || '',
          approval: row.data.approval || { requiresApproval: false, reason: null },
          
          // NEW: Map Options
          options: row.data.options || [],
          packagingType: 'PALLETS', 
          isStackable: true,
      }));

      set({ quotes: mappedQuotes, isLoading: false });
  },

  saveQuote: async () => {
      const state = get();
      if (!state.clientName) { useToast.getState().toast("Missing Client Name.", "error"); return; }
      
      set({ isLoading: true });
      
      const jsonPayload = {
          // New Structure: Arrays of Options
          options: state.options,
          activeOptionId: state.activeOptionId,

          // Shared Data
          cargoRows: state.cargoRows,
          goodsDescription: state.goodsDescription,
          internalNotes: state.internalNotes,
          activities: state.activities, 
          salespersonName: state.salespersonName,
          salespersonId: state.salespersonId,
          probability: state.probability,
          cargoReadyDate: state.cargoReadyDate,
          requestedDepartureDate: state.requestedDepartureDate,
          estimatedDepartureDate: state.estimatedDepartureDate,
          estimatedArrivalDate: state.estimatedArrivalDate,
          competitorInfo: state.competitorInfo,
          customerReference: state.customerReference,
          hsCode: state.hsCode,
          isHazmat: state.isHazmat,
          isReefer: state.isReefer,
          temperature: state.temperature,
          cargoValue: state.cargoValue,
          insuranceRequired: state.insuranceRequired,
          approval: state.approval 
      };

      const dbRow = {
          reference: state.reference,
          status: state.status,
          client_name: state.clientName,
          pol: state.pol, // Saving current active pol for quick search
          pod: state.pod,
          validity_date: state.validityDate,
          total_ttc: state.totalTTCMAD,
          data: jsonPayload
      };

      try {
          if (state.id === 'new') {
              const { data, error } = await supabase.from('quotes').insert([dbRow]).select().single();
              if (error) throw error;
              set({ id: data.id });
          } else {
              const { error } = await supabase.from('quotes').update(dbRow).eq('id', state.id);
              if (error) throw error;
          }
          await get().fetchQuotes();
          set({ isLoading: false });
      } catch (error: any) {
          console.error(error);
          set({ isLoading: false });
          useToast.getState().toast("Save failed.", "error");
      }
  },

  loadQuote: async (id) => {
      set({ isLoading: true });
      const { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
      if (error || !data) { set({ isLoading: false }); return; }

      const json = data.data; 
      
      // Handle Backward Compatibility
      let loadedOptions = json.options;
      let activeOptId = json.activeOptionId;

      if (!loadedOptions || loadedOptions.length === 0) {
        // Migration: If loading old quote, convert legacy fields to Option 1
        const legacyOption: QuoteOption = {
            id: 'legacy-opt',
            quoteId: data.id,
            name: 'Standard Option',
            isRecommended: true,
            mode: json.mode || 'SEA_LCL',
            incoterm: json.incoterm || 'FOB',
            pol: json.pol || data.pol,
            pod: json.pod || data.pod,
            placeOfLoading: json.placeOfLoading || '',
            placeOfDelivery: json.placeOfDelivery || '',
            equipmentType: json.equipmentType || '',
            containerCount: json.containerCount || 1,
            transitTime: json.transitTime || 0,
            freeTime: json.freeTime || 0,
            items: json.items || [],
            baseCurrency: 'MAD',
            quoteCurrency: json.quoteCurrency || 'MAD',
            exchangeRates: json.exchangeRates || DEFAULT_STATE.exchangeRates,
            marginBuffer: json.marginBuffer || 1.02,
            totalTTC: data.total_ttc || 0
        };
        loadedOptions = [legacyOption];
        activeOptId = 'legacy-opt';
      }

      set({
          isLoading: false,
          id: data.id,
          reference: data.reference,
          status: data.status,
          clientName: data.client_name,
          validityDate: data.validity_date,
          
          options: loadedOptions,
          activeOptionId: activeOptId,

          cargoRows: json.cargoRows || [],
          goodsDescription: json.goodsDescription || '',
          internalNotes: json.internalNotes || '',
          activities: json.activities || [],
          salespersonName: json.salespersonName || 'Admin',
          probability: json.probability || 'MEDIUM',
          customerReference: json.customerReference || '',
          cargoReadyDate: json.cargoReadyDate || new Date().toISOString().split('T')[0],
          requestedDepartureDate: json.requestedDepartureDate || '',
          estimatedDepartureDate: json.estimatedDepartureDate || '',
          estimatedArrivalDate: json.estimatedArrivalDate || '',
          competitorInfo: json.competitorInfo || '',
          hsCode: json.hsCode || '',
          isHazmat: json.isHazmat || false,
          isReefer: json.isReefer || false,
          temperature: json.temperature || '',
          cargoValue: json.cargoValue || 0,
          insuranceRequired: json.insuranceRequired || false,
          approval: json.approval || { requiresApproval: false, reason: null },
      });
      
      // Hydrate Facade with active option
      get().setActiveOption(activeOptId);
  },

  deleteQuote: async (id) => {
      if(!confirm("Confirm delete?")) return;
      set({ isLoading: true });
      await supabase.from('quotes').delete().eq('id', id);
      await get().fetchQuotes();
      set({ isLoading: false });
  },

  duplicateQuote: () => {
    const current = get();
    set({ ...current, id: 'new', reference: `${current.reference}-COPY`, status: 'DRAFT' });
    useToast.getState().toast("Duplicated!", "info");
  }
}));