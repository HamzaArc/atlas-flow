// (Re-paste the entire file from previous steps, but with the saveQuote and loadQuote updated)
import { create } from 'zustand';
import { QuoteService } from '@/services/quote.service';
import { Quote, QuoteLineItem, QuoteOption, TransportMode, Incoterm, Currency, Probability, PackagingType, ActivityItem, ActivityCategory, QuoteApproval, ApprovalTrigger } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";

// ... (Keep existing Type definitions for CargoRow, PricingTemplate, QuoteState ...)
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

type PricingTemplate = 'IMPORT_STD' | 'EXPORT_STD' | 'CROSS_TRADE' | 'CLEARANCE_ONLY';

interface QuoteState {
  // --- DATABASE STATE ---
  quotes: Quote[];
  isLoading: boolean;

  // --- EDITOR STATE ---
  id: string;
  reference: string;
  masterReference: string; 
  version: number;
  customerReference: string;
  status: 'DRAFT' | 'PRICING' | 'VALIDATION' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  
  // CRM & Identity
  clientId: string;
  clientName: string;
  clientTaxId?: string; 
  clientIce?: string;
  paymentTerms: string;
  salespersonId: string;
  salespersonName: string;
  
  // Dates
  validityDate: string;
  cargoReadyDate: string;
  requestedDepartureDate: string;
  estimatedDepartureDate: string;
  estimatedArrivalDate: string;
  
  probability: Probability;
  competitorInfo: string;
  
  // Cargo
  goodsDescription: string; 
  hsCode: string;
  isHazmat: boolean;
  isReefer: boolean;
  temperature: string;
  cargoValue: number;
  insuranceRequired: boolean;
  internalNotes: string;

  cargoRows: CargoRow[];
  
  // --- MULTI-OPTION ENGINE ---
  options: QuoteOption[];
  activeOptionId: string;

  // --- FACADE PROPERTIES ---
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

  // Calculated
  totalVolume: number;
  totalWeight: number;
  totalPackages: number; 
  chargeableWeight: number;
  densityRatio: number; 
  
  // Financials
  totalCostMAD: number;
  totalSellMAD: number;
  totalMarginMAD: number;
  totalTaxMAD: number; 
  totalTTCMAD: number; 
  
  totalSellTarget: number; 
  totalTaxTarget: number;  
  totalTTCTarget: number;  

  // Workflow
  approval: QuoteApproval;
  activities: ActivityItem[];
  hasExpiredRates: boolean;

  // --- ACTIONS ---
  setIdentity: (field: string, value: any) => void;
  setClientSnapshot: (data: { id: string, name: string, terms: string, taxId?: string, ice?: string }) => void;
  setStatus: (status: QuoteState['status']) => void;
  
  createOption: (mode: TransportMode) => void;
  setActiveOption: (optionId: string) => void;
  removeOption: (optionId: string) => void;
  duplicateOption: (optionId: string) => void;

  setMode: (mode: TransportMode) => void; 
  setIncoterm: (incoterm: Incoterm) => void;
  setRouteLocations: (field: 'pol' | 'pod' | 'placeOfLoading' | 'placeOfDelivery', value: string) => void;
  setEquipment: (type: string, count: number) => void;
  setLogisticsParam: (field: 'transitTime' | 'freeTime', value: number) => void;

  updateCargo: (rows: CargoRow[]) => void;
  setExchangeRate: (currency: string, rate: number) => void;
  setQuoteCurrency: (currency: Currency) => void;
  
  addLineItem: (section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION', initialData?: Partial<QuoteLineItem>) => void;
  
  updateLineItem: (id: string, updates: Partial<QuoteLineItem>) => void;
  removeLineItem: (id: string) => void;
  applyTemplate: (template: PricingTemplate) => void;
  
  addActivity: (text: string, category?: ActivityCategory, tone?: 'success' | 'neutral' | 'warning' | 'destructive') => void;
  
  attemptSubmission: () => Promise<void>;
  submitForApproval: () => Promise<void>;
  approveQuote: (comment?: string) => Promise<void>;
  rejectQuote: (reason: string) => Promise<void>;
  cancelQuote: (reason: string) => Promise<void>;
  createRevision: () => Promise<void>;

  fetchQuotes: () => Promise<void>;
  saveQuote: () => Promise<void>;
  loadQuote: (id: string) => void; 
  createNewQuote: () => void;
  deleteQuote: (id: string) => Promise<void>;
  duplicateQuote: () => void;
}

// ... (Keep existing Helper Functions: evaluateRisk, checkStrictExpiry, createDefaultOption, DEFAULT_STATE, getTaxRate)
const evaluateRisk = (paymentTerms: string, totalSellMAD: number, marginPercent: number): ApprovalTrigger[] => {
    const triggers: ApprovalTrigger[] = [];
    if (marginPercent < 15) {
        triggers.push({ code: 'MARGIN_LOW', message: `Margin ${marginPercent.toFixed(1)}% is below 15% threshold`, severity: 'HIGH' });
    }
    if (paymentTerms.includes('60') || paymentTerms.includes('90')) {
        triggers.push({ code: 'CREDIT_EXTENDED', message: `Extended Payment Terms: ${paymentTerms}`, severity: 'MEDIUM' });
    }
    if (totalSellMAD > 100000) {
        triggers.push({ code: 'HIGH_VALUE', message: `High Value Exposure (>100k MAD)`, severity: 'HIGH' });
    }
    return triggers;
};

const checkStrictExpiry = (items: QuoteLineItem[]): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return items.some(item => {
        if (!item.validityDate) return false;
        const itemDate = new Date(item.validityDate);
        return itemDate < today;
    });
};

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
    equipmentType: '40HC',
    containerCount: 1,
    transitTime: 0,
    freeTime: 0,
    items: [],
    baseCurrency: 'MAD',
    quoteCurrency: 'MAD',
    exchangeRates: { MAD: 1, USD: 9.80, EUR: 10.75 }, 
    marginBuffer: 1.02,
    totalTTC: 0
});

const DEFAULT_STATE = {
  id: 'new',
  reference: 'Q-24-DRAFT',
  masterReference: 'Q-24-DRAFT',
  version: 1,
  customerReference: '',
  status: 'DRAFT' as const,
  clientId: '',
  clientName: '',
  clientTaxId: '',
  clientIce: '',
  paymentTerms: '30 Days',
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

  mode: 'SEA_LCL' as TransportMode,
  incoterm: 'FOB' as Incoterm,
  pol: '',
  pod: '',
  placeOfLoading: '',
  placeOfDelivery: '',
  equipmentType: '40HC',
  containerCount: 1,
  transitTime: 0,
  freeTime: 0,
  items: [],
  exchangeRates: { MAD: 1, USD: 9.80, EUR: 10.75 }, 
  marginBuffer: 1.02,
  quoteCurrency: 'MAD' as Currency,

  totalVolume: 0,
  totalWeight: 0,
  totalPackages: 0,
  chargeableWeight: 0,
  densityRatio: 0,

  approval: { requiresApproval: false, reason: null, triggers: [] },
  hasExpiredRates: false,
  
  activities: [] as ActivityItem[],

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
    case 'EXPORT_0': return 0.0;
    case 'DISBURSEMENT': return 0.0;
    case 'EXEMPT': return 0.0;
    default: return 0.20;
  }
};

export const useQuoteStore = create<QuoteState>((set, get) => ({
  quotes: [],
  isLoading: false,
  ...DEFAULT_STATE,

  createNewQuote: () => {
    const randomRef = `Q-24-${Math.floor(Math.random() * 10000)}`;
    const newState = { 
        ...DEFAULT_STATE, 
        id: 'new', 
        reference: randomRef,
        masterReference: randomRef,
        version: 1
    };
    const defaultOption = createDefaultOption(newState.id);
    
    set({
        ...newState,
        options: [defaultOption],
        activeOptionId: defaultOption.id,
        mode: defaultOption.mode,
        incoterm: defaultOption.incoterm,
        pol: defaultOption.pol,
        pod: defaultOption.pod,
        items: defaultOption.items,
        exchangeRates: defaultOption.exchangeRates,
        hasExpiredRates: checkStrictExpiry(defaultOption.items)
    });
    get().updateCargo(newState.cargoRows);
  },

  setIdentity: (field, value) => {
      set((state) => ({ ...state, [field]: value }));
      if (field === 'paymentTerms') {
          get().updateLineItem('trigger', {});
      }
  },

  setClientSnapshot: (data) => {
    set({
        clientId: data.id,
        clientName: data.name,
        paymentTerms: data.terms,
        clientTaxId: data.taxId,
        clientIce: data.ice
    });
    get().updateLineItem('trigger', {});
    useToast.getState().toast("Client profile linked & snapshot saved.", "success");
  },
  
  setStatus: async (status) => {
      set({ status });
      get().addActivity(`Status manually changed to ${status}`, 'SYSTEM', 'neutral');
      await get().saveQuote(); 
  },

  createOption: (mode) => {
      const { id, options } = get();
      const newOpt = createDefaultOption(id, mode);
      if (options.length > 0) {
          const base = options[0];
          newOpt.pol = base.pol;
          newOpt.pod = base.pod;
          newOpt.incoterm = base.incoterm;
      }
      set({ options: [...options, newOpt], activeOptionId: newOpt.id });
      get().setActiveOption(newOpt.id);
      useToast.getState().toast(`New ${mode} option added.`, "success");
  },

  setActiveOption: (optionId) => {
      const { options } = get();
      const opt = options.find(o => o.id === optionId);
      if (!opt) return;

      set({
          activeOptionId: optionId,
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
          quoteCurrency: opt.quoteCurrency,
          hasExpiredRates: checkStrictExpiry(opt.items)
      });
      get().updateLineItem('trigger', {}); 
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

  setMode: (mode) => {
      const { options, activeOptionId } = get();
      const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, mode } : o);
      set({ mode, options: updatedOptions });
      get().updateCargo(get().cargoRows);
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
  setLogisticsParam: (field, value) => {
      const { options, activeOptionId } = get();
      const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, [field]: value } : o);
      set({ [field]: value, options: updatedOptions });
  },

  setExchangeRate: (currency, rate) => {
    const { options, activeOptionId, exchangeRates } = get();
    const newRates = { ...exchangeRates, [currency]: rate };
    const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, exchangeRates: newRates } : o);
    set({ exchangeRates: newRates, options: updatedOptions });
    get().updateLineItem('trigger', {});
  },
  setQuoteCurrency: (currency) => {
    const { options, activeOptionId } = get();
    const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, quoteCurrency: currency } : o);
    set({ quoteCurrency: currency, options: updatedOptions });
    get().updateLineItem('trigger', {});
  },

  updateCargo: (rows) => {
    const { mode } = get();
    let vol = 0, weight = 0, pkgs = 0;

    rows.forEach(r => {
      const rowVol = (r.length * r.width * r.height * r.qty) / 1000000;
      vol += rowVol;
      weight += (r.weight * r.qty);
      pkgs += r.qty;
    });
    
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

  addLineItem: (section, initialData = {}) => {
    const { id, activeOptionId, options, items } = get();
    const newItem: QuoteLineItem = {
      id: Math.random().toString(36).substring(7),
      quoteId: id,
      optionId: activeOptionId,
      section,
      description: '',
      buyPrice: 0,
      buyCurrency: 'MAD', 
      markupType: 'PERCENT',
      markupValue: 20, 
      vatRule: 'STD_20',
      vendorId: '', 
      vendorName: '',
      source: 'MANUAL',
      ...initialData
    };
    const newItems = [...items, newItem];
    const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, items: newItems } : o);
    set({ 
        items: newItems, 
        options: updatedOptions,
        hasExpiredRates: checkStrictExpiry(newItems) 
    });
    get().updateLineItem('trigger', {});
  },

  removeLineItem: (itemId) => {
    const { items, options, activeOptionId } = get();
    const newItems = items.filter(i => i.id !== itemId);
    const updatedOptions = options.map(o => o.id === activeOptionId ? { ...o, items: newItems } : o);
    set({ 
        items: newItems, 
        options: updatedOptions,
        hasExpiredRates: checkStrictExpiry(newItems)
    });
    get().updateLineItem('trigger', {}); 
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
          vatRule: section === 'FREIGHT' ? 'EXPORT_0_ART92' : 'STD_20',
          source: 'MANUAL'
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
      set({ 
          items: newItems, 
          options: updatedOptions,
          hasExpiredRates: checkStrictExpiry(newItems)
      });
      get().updateLineItem('trigger', {});
      useToast.getState().toast("Pricing template applied successfully.", "success");
  },

  updateLineItem: (id, updates) => {
    const { items, exchangeRates, quoteCurrency, options, activeOptionId, paymentTerms } = get();
    
    const updatedItems = items.map(item => {
      if (item.id !== id && id !== 'trigger') return item;
      if (id !== 'trigger') {
          return { ...item, ...updates };
      }
      return item;
    });
    
    let totalCostMAD = 0, totalSellMAD = 0, totalTaxMAD = 0;

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
    
    // --- UPDATED RISK ANALYSIS ENGINE ---
    const riskTriggers = evaluateRisk(paymentTerms, totalSellMAD, marginPercent);
    const requiresApproval = riskTriggers.length > 0;
    
    const approvalReason = requiresApproval 
        ? riskTriggers.map(t => t.message).join(' | ') 
        : null;

    const updatedOptions = options.map(o => o.id === activeOptionId ? { 
        ...o, 
        items: updatedItems,
        totalTTC: totalSellMAD + totalTaxMAD
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
        approval: { 
            ...get().approval, 
            requiresApproval, 
            reason: approvalReason, 
            triggers: riskTriggers 
        },
        hasExpiredRates: checkStrictExpiry(updatedItems) 
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
      const { approval, hasExpiredRates } = get();

      if (hasExpiredRates) {
          useToast.getState().toast("Cannot Send: Active option contains expired rates.", "error");
          return;
      }

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
      const { approval, hasExpiredRates } = get();

      if (hasExpiredRates) {
          useToast.getState().toast("Cannot Submit: Active option contains expired rates.", "error");
          return;
      }

      set({ 
          status: 'VALIDATION',
          approval: { 
              ...approval, 
              requestedBy: 'Youssef (Sales)',
              requestedAt: new Date()
          }
      });
      get().addActivity(`Requested approval: ${approval.triggers.map(t => t.message).join(', ') || approval.reason}`, 'APPROVAL', 'warning');
      await get().saveQuote(); 
      useToast.getState().toast("Submitted for Manager Approval", "success");
  },

  approveQuote: async (comment) => {
      const { approval, hasExpiredRates } = get();

      if (hasExpiredRates) {
        useToast.getState().toast("Cannot Approve: Option contains expired rates.", "error");
        return;
      }

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

  cancelQuote: async (reason) => {
      set({ status: 'REJECTED' });
      get().addActivity(`Quote marked as LOST/REJECTED. Reason: ${reason}`, 'SYSTEM', 'destructive');
      await get().saveQuote();
      useToast.getState().toast("Quote marked as Rejected", "info");
  },

  createRevision: async () => {
      const current = get();
      const stateCopy = JSON.parse(JSON.stringify(current));
      const newVersion = (stateCopy.version || 1) + 1;
      
      set({
          ...stateCopy,
          id: 'new', 
          version: newVersion,
          status: 'DRAFT',
          approval: { requiresApproval: false, reason: null, triggers: [] },
          activities: [
              {
                  id: Math.random().toString(),
                  text: `Created Revision v${newVersion} (from v${current.version})`,
                  category: 'SYSTEM',
                  tone: 'neutral',
                  meta: 'System',
                  timestamp: new Date()
              }
          ]
      });

      await get().saveQuote();
      useToast.getState().toast(`Created Revision v${newVersion}`, "success");
  },

  // --- DATABASE ACTIONS (UPDATED to SAVE new fields) ---
  fetchQuotes: async () => {
      set({ isLoading: true });
      try {
          const quotes = await QuoteService.fetchAll();
          set({ quotes, isLoading: false });
      } catch (error) {
          console.error(error);
          set({ isLoading: false });
          useToast.getState().toast("Failed to load quotes.", "error");
      }
  },

  saveQuote: async () => {
      const state = get();
      if (!state.clientName) { useToast.getState().toast("Missing Client Name.", "error"); return; }
      
      set({ isLoading: true });

      const quotePayload: Partial<Quote> = {
          id: state.id,
          reference: state.reference,
          masterReference: state.masterReference,
          version: state.version,
          status: state.status,
          clientName: state.clientName,
          clientId: state.clientId,
          clientTaxId: state.clientTaxId,
          clientIce: state.clientIce,
          paymentTerms: state.paymentTerms,
          salespersonId: state.salespersonId,
          salespersonName: state.salespersonName,
          
          validityDate: new Date(state.validityDate), 
          cargoReadyDate: new Date(state.cargoReadyDate), 
          requestedDepartureDate: state.requestedDepartureDate ? new Date(state.requestedDepartureDate) : undefined,
          
          pol: state.pol,
          pod: state.pod,
          mode: state.mode,           // PERSISTED
          incoterm: state.incoterm,   // PERSISTED
          activeOptionId: state.activeOptionId, // PERSISTED for UI state
          
          totalTTC: state.totalTTCMAD,
          
          // PERSISTED FINANCIAL TARGETS
          totalSellTarget: state.totalSellTarget,
          totalTaxTarget: state.totalTaxTarget,
          totalTTCTarget: state.totalTTCTarget,

          cargoRows: state.cargoRows,
          
          // PERSISTED WEIGHTS
          totalWeight: state.totalWeight,
          totalVolume: state.totalVolume,
          chargeableWeight: state.chargeableWeight,

          goodsDescription: state.goodsDescription,
          hsCode: state.hsCode,
          isHazmat: state.isHazmat,
          isReefer: state.isReefer,
          temperature: state.temperature,
          cargoValue: state.cargoValue,
          insuranceRequired: state.insuranceRequired,
          
          probability: state.probability,
          competitorInfo: state.competitorInfo,
          internalNotes: state.internalNotes,
          activities: state.activities,
          approval: state.approval,
          
          options: state.options,
          customerReference: state.customerReference
      };

      try {
          const newId = await QuoteService.save(quotePayload, state.id === 'new');
          if (state.id === 'new') {
              set({ id: newId });
          }
          await get().fetchQuotes();
          set({ isLoading: false });
      } catch (error) {
          console.error(error);
          set({ isLoading: false });
          useToast.getState().toast("Save failed.", "error");
      }
  },

  loadQuote: async (id) => {
      set({ isLoading: true });
      try {
          const quote = await QuoteService.getById(id);
          if (!quote) {
              set({ isLoading: false });
              return;
          }

          // Resolve active option logic (use persisted if available, else default to first)
          let activeOptId = quote.activeOptionId;
          let activeOpt = quote.options.find(o => o.id === activeOptId);
          if (!activeOpt && quote.options.length > 0) {
              activeOpt = quote.options[0];
              activeOptId = activeOpt.id;
          }

          // Legacy Data Migration: If triggers are missing but reason exists, mock a trigger
          let migratedApproval = quote.approval;
          if (quote.approval && quote.approval.requiresApproval && (!quote.approval.triggers || quote.approval.triggers.length === 0)) {
              migratedApproval = {
                  ...quote.approval,
                  triggers: quote.approval.reason ? [{
                      code: 'LEGACY_RISK',
                      message: quote.approval.reason,
                      severity: 'MEDIUM'
                  }] : []
              };
          }

          set({
              isLoading: false,
              id: quote.id,
              reference: quote.reference,
              masterReference: quote.masterReference,
              version: quote.version,
              status: quote.status,
              clientName: quote.clientName,
              clientId: quote.clientId,
              clientTaxId: quote.clientTaxId,
              clientIce: quote.clientIce,
              paymentTerms: quote.paymentTerms,
              
              validityDate: quote.validityDate.toISOString().split('T')[0],
              cargoReadyDate: quote.cargoReadyDate.toISOString().split('T')[0],
              requestedDepartureDate: quote.requestedDepartureDate ? quote.requestedDepartureDate.toISOString().split('T')[0] : '',
              
              cargoRows: quote.cargoRows,
              
              // Load persisted stats (fallback to 0 if missing from old quotes)
              totalWeight: quote.totalWeight || 0,
              totalVolume: quote.totalVolume || 0,
              chargeableWeight: quote.chargeableWeight || 0,
              
              // Load persisted targets
              totalSellTarget: quote.totalSellTarget || 0,
              totalTaxTarget: quote.totalTaxTarget || 0,
              totalTTCTarget: quote.totalTTCTarget || 0,

              goodsDescription: quote.goodsDescription,
              hsCode: quote.hsCode,
              isHazmat: quote.isHazmat,
              isReefer: quote.isReefer,
              temperature: quote.temperature,
              cargoValue: quote.cargoValue,
              insuranceRequired: quote.insuranceRequired,
              
              probability: quote.probability,
              competitorInfo: quote.competitorInfo,
              internalNotes: quote.internalNotes,
              activities: quote.activities,
              approval: migratedApproval,
              customerReference: quote.customerReference,
              
              options: quote.options,
              activeOptionId: activeOptId || '', 
          });

          if (activeOptId) {
              get().setActiveOption(activeOptId);
          }
      } catch (error) {
          console.error(error);
          set({ isLoading: false });
      }
  },

  deleteQuote: async (id) => {
      if(!confirm("Confirm delete?")) return;
      set({ isLoading: true });
      try {
          await QuoteService.delete(id);
          await get().fetchQuotes();
          set({ isLoading: false });
      } catch (error) {
          console.error(error);
          set({ isLoading: false });
          useToast.getState().toast("Delete failed.", "error");
      }
  },

  duplicateQuote: () => {
    const current = get();
    const newRef = `${current.reference}-COPY`;
    set({ 
        ...current, 
        id: 'new', 
        reference: newRef, 
        masterReference: newRef,
        version: 1, 
        status: 'DRAFT',
        activities: [
            { id: 'init', category: 'SYSTEM', text: 'Duplicated from ' + current.reference, meta: 'System', tone: 'neutral', timestamp: new Date() }
        ]
    });
    useToast.getState().toast("Duplicated!", "info");
  }
}));