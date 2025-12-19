import { create } from 'zustand';
import { supabase } from '@/lib/supabase'; 
import { Quote, QuoteLineItem, QuoteOption, TransportMode, Incoterm, Currency, Probability, PackagingType, ActivityItem, ActivityCategory, QuoteApproval } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";

// --- UPDATED TYPES ---
// Expert Update: added pkgType and isStackable to the row definition
interface CargoRow {
  id: string;
  qty: number;
  pkgType: PackagingType; // granular control
  length: number;
  width: number;
  height: number;
  weight: number;
  isStackable: boolean; // crucial for load planning
}

// TEMPLATE TYPES
type PricingTemplate = 'IMPORT_STD' | 'EXPORT_STD' | 'CROSS_TRADE' | 'CLEARANCE_ONLY';

const OPTION_LABELS = ['Option A', 'Option B', 'Option C', 'Option D'];

const getModeLabel = (mode: TransportMode) => {
  switch (mode) {
    case 'AIR':
      return 'Air';
    case 'SEA_FCL':
      return 'Sea FCL';
    case 'SEA_LCL':
      return 'Sea LCL';
    case 'ROAD':
      return 'Road';
    default:
      return mode;
  }
};

const createQuoteOptionFromState = (
  state: Pick<QuoteState, 'id' | 'mode' | 'incoterm' | 'pol' | 'pod' | 'placeOfLoading' | 'placeOfDelivery' | 'equipmentType' | 'containerCount' | 'requestedDepartureDate' | 'estimatedDepartureDate' | 'estimatedArrivalDate' | 'transitTime' | 'freeTime' | 'items'>,
  optionId: string,
  label: string
): QuoteOption => ({
  id: optionId,
  label,
  mode: state.mode,
  incoterm: state.incoterm,
  pol: state.pol,
  pod: state.pod,
  placeOfLoading: state.placeOfLoading,
  placeOfDelivery: state.placeOfDelivery,
  equipmentType: state.equipmentType,
  containerCount: state.containerCount,
  requestedDepartureDate: state.requestedDepartureDate,
  estimatedDepartureDate: state.estimatedDepartureDate,
  estimatedArrivalDate: state.estimatedArrivalDate,
  transitTime: state.transitTime,
  freeTime: state.freeTime,
  items: state.items.map(item => ({
    ...item,
    id: Math.random().toString(36).substring(7),
    quoteId: state.id
  }))
});

interface QuoteState {
  // --- DATABASE STATE ---
  quotes: Quote[];
  isLoading: boolean;

  // --- EDITOR STATE ---
  id: string;
  reference: string;
  customerReference: string;
  status: 'DRAFT' | 'PRICING' | 'VALIDATION' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  
  // CRM & Identity
  clientId: string;
  clientName: string;
  salespersonId: string;
  salespersonName: string;
  
  // Dates & KPIs
  validityDate: string;
  exchangeRateValidity: string;
  cargoReadyDate: string;
  requestedDepartureDate: string;
  estimatedDepartureDate: string;
  estimatedArrivalDate: string;
  transitTime: number; 
  freeTime: number;    
  probability: Probability;
  competitorInfo: string;
  
  // Cargo Specifics
  goodsDescription: string; 
  hsCode: string;
  // packagingType: PackagingType; // REMOVED: Now handled per row
  isHazmat: boolean;
  // isStackable: boolean; // REMOVED: Now handled per row
  isReefer: boolean;
  temperature: string;
  cargoValue: number;
  insuranceRequired: boolean;
  internalNotes: string;

  // Multi-option quote
  quoteOptions: QuoteOption[];
  activeOptionId: string;

  // Route & Equipment
  mode: TransportMode;
  incoterm: Incoterm;
  pol: string;
  pod: string;
  placeOfLoading: string;
  placeOfDelivery: string;
  equipmentType: string;
  containerCount: number;

  cargoRows: CargoRow[];
  
  // Financials
  items: QuoteLineItem[];
  exchangeRates: Record<string, number>;
  marginBuffer: number;
  quoteCurrency: Currency; 
  
  // Workflow Engine
  approval: QuoteApproval;
  
  // Activity Feed
  activities: ActivityItem[];

  // Calculated Fields
  totalVolume: number;
  totalWeight: number;
  totalPackages: number; // New KPI
  chargeableWeight: number;
  densityRatio: number; // New KPI
  
  // Internal Reporting (MAD)
  totalCostMAD: number;
  totalSellMAD: number;
  totalMarginMAD: number;
  totalTaxMAD: number; 
  totalTTCMAD: number; 
  
  // Client Facing (Target)
  totalSellTarget: number; 
  totalTaxTarget: number;  
  totalTTCTarget: number;  

  // --- ACTIONS ---
  setIdentity: (field: string, value: any) => void;
  setStatus: (status: QuoteState['status']) => void;
  
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
  setActiveOption: (id: string) => void;
  addQuoteOption: () => void;
  renameQuoteOption: (id: string, label: string) => void;
  updateOptionField: (field: keyof QuoteOption, value: any) => void;
  
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
  exchangeRateValidity: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
  cargoReadyDate: new Date().toISOString().split('T')[0],
  requestedDepartureDate: '',
  estimatedDepartureDate: '',
  estimatedArrivalDate: '',
  
  transitTime: 0,
  freeTime: 0,
  probability: 'MEDIUM' as Probability,
  competitorInfo: '',

  goodsDescription: '',
  hsCode: '',
  // Default Removed
  isHazmat: false,
  isReefer: false,
  temperature: '',
  cargoValue: 0,
  insuranceRequired: false,
  internalNotes: '',

  quoteOptions: [
    {
      id: 'option-a',
      label: 'Option A: Sea LCL',
      mode: 'SEA_LCL' as TransportMode,
      incoterm: 'FOB' as Incoterm,
      pol: 'CASABLANCA (MAP)',
      pod: 'SHANGHAI (CN)',
      placeOfLoading: '',
      placeOfDelivery: '',
      equipmentType: '',
      containerCount: 1,
      requestedDepartureDate: '',
      estimatedDepartureDate: '',
      estimatedArrivalDate: '',
      transitTime: 0,
      freeTime: 0,
      items: []
    }
  ],
  activeOptionId: 'option-a',
  
  mode: 'SEA_LCL' as TransportMode,
  incoterm: 'FOB' as Incoterm,
  pol: 'CASABLANCA (MAP)',
  pod: 'SHANGHAI (CN)',
  placeOfLoading: '',
  placeOfDelivery: '',
  equipmentType: '',
  containerCount: 1,

  cargoRows: [{ id: '1', qty: 1, pkgType: 'PALLETS' as PackagingType, length: 120, width: 80, height: 100, weight: 500, isStackable: true }],
  
  totalVolume: 0,
  totalWeight: 0,
  totalPackages: 0,
  chargeableWeight: 0,
  densityRatio: 0,

  items: [],
  exchangeRates: { MAD: 1, USD: 9.80, EUR: 10.75, GBP: 12.50 }, 
  marginBuffer: 1.02,
  quoteCurrency: 'MAD' as Currency,
  
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

  setIdentity: (field, value) => {
      set((state) => ({
        ...state,
        [field]: value,
        quoteOptions: ['requestedDepartureDate', 'estimatedDepartureDate', 'estimatedArrivalDate', 'transitTime', 'freeTime']
          .includes(field)
          ? state.quoteOptions.map(option =>
              option.id === state.activeOptionId
                ? { ...option, [field]: value }
                : option
            )
          : state.quoteOptions
      }));
  },
  setStatus: async (status) => {
      set({ status });
      get().addActivity(`Status manually changed to ${status}`, 'SYSTEM', 'neutral');
      await get().saveQuote(); 
  },

  setMode: (mode) => {
      set((state) => {
          const incoterm = mode === 'AIR' ? 'FCA' : 'FOB';
          const optionIndex = state.quoteOptions.findIndex(option => option.id === state.activeOptionId);
          const labelPrefix = OPTION_LABELS[optionIndex] || `Option ${optionIndex + 1}`;
          const updatedOptions = state.quoteOptions.map(option =>
              option.id === state.activeOptionId
                ? {
                    ...option,
                    mode,
                    incoterm,
                    equipmentType: '',
                    containerCount: 1,
                    freeTime: 0,
                    placeOfLoading: '',
                    placeOfDelivery: '',
                    label: `${labelPrefix}: ${getModeLabel(mode)}`
                  }
                : option
          );
          return {
              mode,
              incoterm,
              equipmentType: '',
              containerCount: 1,
              freeTime: 0,
              placeOfLoading: '',
              placeOfDelivery: '',
              quoteOptions: updatedOptions
          };
      });
      get().updateCargo(get().cargoRows);
  },

  setIncoterm: (incoterm) => {
      const isExw = incoterm === 'EXW';
      const isDoorDelivery = ['DAP', 'DPU', 'DDP'].includes(incoterm);
      set((state) => ({
          incoterm,
          placeOfLoading: isExw ? state.placeOfLoading : '',
          placeOfDelivery: isDoorDelivery ? state.placeOfDelivery : '',
          quoteOptions: state.quoteOptions.map(option =>
              option.id === state.activeOptionId
                ? {
                    ...option,
                    incoterm,
                    placeOfLoading: isExw ? state.placeOfLoading : '',
                    placeOfDelivery: isDoorDelivery ? state.placeOfDelivery : ''
                  }
                : option
          )
      }));
  },

  setRouteLocations: (field, value) => {
      set((state) => ({
          ...state,
          [field]: value,
          quoteOptions: state.quoteOptions.map(option =>
              option.id === state.activeOptionId
                ? { ...option, [field]: value }
                : option
          )
      }));
  },

  setEquipment: (type, count) => {
      set((state) => ({
          equipmentType: type,
          containerCount: count,
          quoteOptions: state.quoteOptions.map(option =>
              option.id === state.activeOptionId
                ? { ...option, equipmentType: type, containerCount: count }
                : option
          )
      }));
  },

  setExchangeRate: (currency, rate) => {
    const newRates = { ...get().exchangeRates, [currency]: rate };
    set({ exchangeRates: newRates });
    get().updateLineItem('trigger', 'description', 'trigger');
  },

  setQuoteCurrency: (currency) => {
    set({ quoteCurrency: currency });
    get().updateLineItem('trigger', 'description', 'trigger');
  },

  updateOptionField: (field, value) => {
      set((state) => ({
          quoteOptions: state.quoteOptions.map(option =>
              option.id === state.activeOptionId
                ? { ...option, [field]: value }
                : option
          )
      }));
  },

  setActiveOption: (id) => {
      set((state) => {
          const currentOption = state.quoteOptions.find(option => option.id === state.activeOptionId);
          const syncedOptions = currentOption
            ? state.quoteOptions.map(option =>
                option.id === state.activeOptionId
                  ? {
                      ...option,
                      mode: state.mode,
                      incoterm: state.incoterm,
                      pol: state.pol,
                      pod: state.pod,
                      placeOfLoading: state.placeOfLoading,
                      placeOfDelivery: state.placeOfDelivery,
                      equipmentType: state.equipmentType,
                      containerCount: state.containerCount,
                      requestedDepartureDate: state.requestedDepartureDate,
                      estimatedDepartureDate: state.estimatedDepartureDate,
                      estimatedArrivalDate: state.estimatedArrivalDate,
                      transitTime: state.transitTime,
                      freeTime: state.freeTime,
                      items: state.items
                    }
                  : option
              )
            : state.quoteOptions;
          const nextOption = syncedOptions.find(option => option.id === id) || syncedOptions[0];
          if (!nextOption) return state;
          return {
              activeOptionId: nextOption.id,
              quoteOptions: syncedOptions,
              mode: nextOption.mode,
              incoterm: nextOption.incoterm,
              pol: nextOption.pol,
              pod: nextOption.pod,
              placeOfLoading: nextOption.placeOfLoading,
              placeOfDelivery: nextOption.placeOfDelivery,
              equipmentType: nextOption.equipmentType,
              containerCount: nextOption.containerCount,
              requestedDepartureDate: nextOption.requestedDepartureDate,
              estimatedDepartureDate: nextOption.estimatedDepartureDate,
              estimatedArrivalDate: nextOption.estimatedArrivalDate,
              transitTime: nextOption.transitTime,
              freeTime: nextOption.freeTime,
              items: nextOption.items
          };
      });
      get().updateLineItem('trigger', 'description', 'trigger');
  },

  addQuoteOption: () => {
      set((state) => {
          const nextIndex = state.quoteOptions.length;
          const optionId = `option-${Math.random().toString(36).substring(7)}`;
          const labelPrefix = OPTION_LABELS[nextIndex] || `Option ${nextIndex + 1}`;
          const option = createQuoteOptionFromState(
            state,
            optionId,
            `${labelPrefix}: ${getModeLabel(state.mode)}`
          );
          return {
              quoteOptions: [...state.quoteOptions, option],
              activeOptionId: optionId,
              mode: option.mode,
              incoterm: option.incoterm,
              pol: option.pol,
              pod: option.pod,
              placeOfLoading: option.placeOfLoading,
              placeOfDelivery: option.placeOfDelivery,
              equipmentType: option.equipmentType,
              containerCount: option.containerCount,
              requestedDepartureDate: option.requestedDepartureDate,
              estimatedDepartureDate: option.estimatedDepartureDate,
              estimatedArrivalDate: option.estimatedArrivalDate,
              transitTime: option.transitTime,
              freeTime: option.freeTime,
              items: option.items
          };
      });
      get().updateLineItem('trigger', 'description', 'trigger');
  },

  renameQuoteOption: (id, label) => {
      set((state) => ({
          quoteOptions: state.quoteOptions.map(option =>
              option.id === id ? { ...option, label } : option
          )
      }));
  },

  // --- UPDATED CALCULATION LOGIC ---
  updateCargo: (rows) => {
    const { mode } = get();
    let vol = 0;
    let weight = 0;
    let pkgs = 0;

    rows.forEach(r => {
      // Calculate volume in m3
      const rowVol = (r.length * r.width * r.height * r.qty) / 1000000;
      vol += rowVol;
      weight += (r.weight * r.qty);
      pkgs += r.qty;
    });
    
    // Expert Chargeable Weight Logic
    let chargeable = 0;
    if (mode === 'AIR') chargeable = Math.max(weight, (vol * 1000000) / 6000); // IATA Standard 1:6
    else if (mode === 'SEA_LCL') chargeable = Math.max(weight, vol * 1000); // 1:1 Ratio
    else if (mode === 'ROAD') chargeable = Math.max(weight, vol * 333); // 1:3 Ratio (common in Morocco/Europe)
    else chargeable = weight; // FCL (Flat rates usually, but tracking weight is vital)
    
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
    const newItem: QuoteLineItem = {
      id: Math.random().toString(36).substring(7),
      quoteId: get().id,
      section,
      description: '',
      buyPrice: 0,
      buyCurrency: 'MAD', 
      vendorId: '',
      vendorName: '',
      lineValidityDate: '',
      markupType: 'PERCENT',
      markupValue: 20, 
      vatRule: 'STD_20',
    };
    set(state => {
      const updatedItems = [...state.items, newItem];
      return {
        items: updatedItems,
        quoteOptions: state.quoteOptions.map(option =>
          option.id === state.activeOptionId ? { ...option, items: updatedItems } : option
        )
      };
    });
    get().updateLineItem('trigger', 'description', 'trigger');
  },

  removeLineItem: (id) => {
    const newItems = get().items.filter(i => i.id !== id);
    set((state) => ({
      items: newItems,
      quoteOptions: state.quoteOptions.map(option =>
        option.id === state.activeOptionId ? { ...option, items: newItems } : option
      )
    }));
    get().updateLineItem('trigger', 'description', 'trigger'); 
  },

  applyTemplate: (template) => {
      const newItems: QuoteLineItem[] = [];
      const validityDate = get().validityDate;
      const createItem = (section: any, desc: string, price: number, curr: Currency = 'MAD', markup = 20): QuoteLineItem => ({
          id: Math.random().toString(36).substring(7),
          quoteId: get().id,
          section,
          description: desc,
          buyPrice: price,
          buyCurrency: curr,
          vendorId: '',
          vendorName: '',
          lineValidityDate: validityDate,
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

      set((state) => ({
        items: newItems,
        quoteOptions: state.quoteOptions.map(option =>
          option.id === state.activeOptionId ? { ...option, items: newItems } : option
        )
      }));
      get().updateLineItem('trigger', 'description', 'trigger');
      useToast.getState().toast("Pricing template applied successfully.", "success");
  },

  updateLineItem: (id, field, value) => {
    const { items, exchangeRates, quoteCurrency } = get();
    
    const updatedItems = items.map(item => {
      if (item.id !== id && id !== 'trigger') return item;
      if (id !== 'trigger') return { ...item, [field]: value };
      return item;
    });
    
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

    set((state) => ({ 
        items: updatedItems,
        quoteOptions: state.quoteOptions.map(option =>
          option.id === state.activeOptionId ? { ...option, items: updatedItems } : option
        ),
        totalCostMAD: parseFloat(totalCostMAD.toFixed(2)),
        totalSellMAD: parseFloat(totalSellMAD.toFixed(2)),
        totalMarginMAD: parseFloat(totalMarginMAD.toFixed(2)),
        totalTaxMAD: parseFloat(totalTaxMAD.toFixed(2)),
        totalTTCMAD: parseFloat((totalSellMAD + totalTaxMAD).toFixed(2)),
        totalSellTarget: parseFloat(totalSellTarget.toFixed(2)),
        totalTaxTarget: parseFloat(totalTaxTarget.toFixed(2)),
        totalTTCTarget: parseFloat((totalSellTarget + totalTaxTarget).toFixed(2)),
        approval: { ...state.approval, requiresApproval, reason: approvalReason }
    }));
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
          
          pol: row.pol,
          pod: row.pod,
          mode: row.data.mode || 'SEA_LCL',
          incoterm: row.data.incoterm || 'FOB',
          placeOfLoading: row.data.placeOfLoading || '',
          placeOfDelivery: row.data.placeOfDelivery || '',
          equipmentType: row.data.equipmentType || '',
          containerCount: row.data.containerCount || 1,
          transitTime: row.data.transitTime || 0,
          freeTime: row.data.freeTime || 0,

          clientId: '', 
          salespersonId: row.data.salespersonId || '',
          salespersonName: row.data.salespersonName || 'Admin',
          baseCurrency: 'MAD',
          quoteCurrency: row.data.quoteCurrency || 'MAD',
          exchangeRates: row.data.exchangeRates || DEFAULT_STATE.exchangeRates,
          marginBuffer: row.data.marginBuffer || 1.02,
          items: [],
          cargoRows: row.data.cargoRows || [],
          internalNotes: row.data.internalNotes || '',
          activities: row.data.activities || [],
          cargoReadyDate: new Date(row.data.cargoReadyDate || new Date()),
          probability: row.data.probability || 'MEDIUM',
          // packagingType removed
          isReefer: row.data.isReefer || false,
          temperature: row.data.temperature || '',
          cargoValue: row.data.cargoValue || 0,
          insuranceRequired: row.data.insuranceRequired || false,
          isHazmat: row.data.isHazmat || false,
          // isStackable removed from global
          goodsDescription: row.data.goodsDescription || '',
          hsCode: row.data.hsCode || '',
          approval: row.data.approval || { requiresApproval: false, reason: null },
          totalTTC: row.total_ttc || 0,
          // Missing type mapping for packageType would default to PALLET if not in DB
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
          mode: state.mode,
          incoterm: state.incoterm,
          pol: state.pol,
          pod: state.pod,
          placeOfLoading: state.placeOfLoading,
          placeOfDelivery: state.placeOfDelivery,
          equipmentType: state.equipmentType,
          containerCount: state.containerCount,
          transitTime: state.transitTime,
          freeTime: state.freeTime,

          cargoRows: state.cargoRows,
          items: state.items,
          quoteOptions: state.quoteOptions,
          activeOptionId: state.activeOptionId,
          goodsDescription: state.goodsDescription,
          internalNotes: state.internalNotes,
          activities: state.activities, 
          exchangeRates: state.exchangeRates,
          exchangeRateValidity: state.exchangeRateValidity,
          marginBuffer: state.marginBuffer, 
          quoteCurrency: state.quoteCurrency,
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
          pol: state.pol,
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
      const fallbackMode = json.mode || 'SEA_LCL';
      const fallbackOption: QuoteOption = {
          id: 'option-a',
          label: `Option A: ${getModeLabel(fallbackMode)}`,
          mode: fallbackMode,
          incoterm: json.incoterm || 'FOB',
          pol: json.pol || data.pol,
          pod: json.pod || data.pod,
          placeOfLoading: json.placeOfLoading || '',
          placeOfDelivery: json.placeOfDelivery || '',
          equipmentType: json.equipmentType || '',
          containerCount: json.containerCount || 1,
          requestedDepartureDate: json.requestedDepartureDate || '',
          estimatedDepartureDate: json.estimatedDepartureDate || '',
          estimatedArrivalDate: json.estimatedArrivalDate || '',
          transitTime: json.transitTime || 0,
          freeTime: json.freeTime || 0,
          items: json.items || []
      };
      const options = json.quoteOptions?.length ? json.quoteOptions : [fallbackOption];
      const normalizedOptions = options.map((option: QuoteOption, index: number) => ({
          ...option,
          label: option.label || `${OPTION_LABELS[index] || `Option ${index + 1}`}: ${getModeLabel(option.mode)}`
      }));
      const activeId = json.activeOptionId || normalizedOptions[0]?.id || fallbackOption.id;
      const activeOption = normalizedOptions.find((option: QuoteOption) => option.id === activeId) || normalizedOptions[0];

      set({
          isLoading: false,
          id: data.id,
          reference: data.reference,
          status: data.status,
          clientName: data.client_name,
          validityDate: data.validity_date,
          exchangeRateValidity: json.exchangeRateValidity || data.validity_date,

          quoteOptions: normalizedOptions,
          activeOptionId: activeOption.id,
          mode: activeOption.mode,
          incoterm: activeOption.incoterm,
          pol: activeOption.pol,
          pod: activeOption.pod,
          placeOfLoading: activeOption.placeOfLoading,
          placeOfDelivery: activeOption.placeOfDelivery,
          equipmentType: activeOption.equipmentType,
          containerCount: activeOption.containerCount,
          transitTime: activeOption.transitTime,
          freeTime: activeOption.freeTime,

          cargoRows: json.cargoRows || [],
          items: activeOption.items || [],
          goodsDescription: json.goodsDescription || '',
          internalNotes: json.internalNotes || '',
          activities: json.activities || [],
          exchangeRates: json.exchangeRates || DEFAULT_STATE.exchangeRates,
          marginBuffer: json.marginBuffer || DEFAULT_STATE.marginBuffer,
          quoteCurrency: json.quoteCurrency || 'MAD',
          salespersonName: json.salespersonName || 'Admin',
          probability: json.probability || 'MEDIUM',
          customerReference: json.customerReference || '',
          cargoReadyDate: json.cargoReadyDate || new Date().toISOString().split('T')[0],
          requestedDepartureDate: activeOption.requestedDepartureDate || '',
          estimatedDepartureDate: activeOption.estimatedDepartureDate || '',
          estimatedArrivalDate: activeOption.estimatedArrivalDate || '',
          competitorInfo: json.competitorInfo || '',
          hsCode: json.hsCode || '',
          isHazmat: json.isHazmat || false,
          isReefer: json.isReefer || false,
          temperature: json.temperature || '',
          cargoValue: json.cargoValue || 0,
          insuranceRequired: json.insuranceRequired || false,
          approval: json.approval || { requiresApproval: false, reason: null },
          totalTTCMAD: data.total_ttc || 0,
      });
      get().updateLineItem('trigger', 'description', 'trigger');
  },

  deleteQuote: async (id) => {
      if(!confirm("Confirm delete?")) return;
      set({ isLoading: true });
      await supabase.from('quotes').delete().eq('id', id);
      await get().fetchQuotes();
      set({ isLoading: false });
  },

  createNewQuote: () => set({ ...DEFAULT_STATE, id: 'new', reference: `Q-24-${Math.floor(Math.random() * 10000)}` }),

  duplicateQuote: () => {
    const current = get();
    set({ ...current, id: 'new', reference: `${current.reference}-COPY`, status: 'DRAFT' });
    useToast.getState().toast("Duplicated!", "info");
  }
}));
