import { create } from 'zustand';
import { useToast } from "@/components/ui/use-toast";
import { ActivityItem, ActivityCategory } from "@/types/index";

// --- DOMAIN TYPES ---
export type ClientStatus = 'ACTIVE' | 'PROSPECT' | 'SUSPENDED' | 'BLACKLISTED';
export type ClientType = 'SHIPPER' | 'CONSIGNEE' | 'FORWARDER' | 'PARTNER';

export interface ClientContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface ClientRoute {
  id: string;
  origin: string;
  destination: string;
  mode: 'SEA' | 'AIR' | 'ROAD';
  incoterm: 'EXW' | 'FOB' | 'CIF' | 'DAP' | 'DDP' | 'OTHER';
  equipment: '20DV' | '40HC' | 'LCL' | 'AIR' | 'FTL' | 'LTL';
  volume: number;
  volumeUnit: 'TEU' | 'KG' | 'TRK';
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ADHOC';
}

export interface ClientDocument {
  id: string;
  name: string;
  type: 'CONTRACT' | 'KYC' | 'NDA' | 'OTHER';
  uploadDate: Date;
  size: string;
  url: string;
}

export interface ClientFinancials {
  paymentTerms: string;
  vatNumber: string;
  currency: string;
  ice?: string;
  rc?: string;
  taxId?: string;
}

// --- NEW INTELLIGENT TYPES ---
export type SupplierRole = 'SEA_LINE' | 'AIRLINE' | 'HAULIER' | 'FORWARDER';
export type SupplierTier = 'STRATEGIC' | 'APPROVED' | 'BACKUP' | 'BLOCKED';

export interface ClientSupplier {
  id: string;
  name: string;
  role: SupplierRole;
  tier: SupplierTier;
}

export type CommoditySector = 'AUTOMOTIVE' | 'TEXTILE' | 'PERISHABLE' | 'RETAIL' | 'INDUSTRIAL' | 'TECH';

export interface ClientCommodity {
  id: string;
  name: string;
  sector: CommoditySector;
  isHazmat: boolean;
}

// OPERATIONAL PROFILE
export interface OperationalProfile {
  hsCodes: string[];
  requiresHazmat: boolean;
  requiresReefer: boolean;
  requiresOOG: boolean;
  customsRegime: 'STANDARD' | 'TEMPORARY' | 'FREE_ZONE';
  // Removed old string arrays, now handled by root collections
}

export interface Client {
  id: string;
  created_at: string;
  updated_at?: string;
  entityName: string;
  status: ClientStatus;
  type: ClientType;
  email: string;
  phone: string;
  website?: string;
  city: string;
  country: string;
  address?: string;
  
  // Financials
  creditLimit: number;
  creditUsed: number;
  financials: ClientFinancials;
  
  // Sales & CRM
  salesRepId: string;
  tags: string[];
  
  // Sub-Resources
  contacts: ClientContact[];
  routes: ClientRoute[];
  documents: ClientDocument[];
  
  // NEW: Rich Collections
  suppliers: ClientSupplier[];
  commodities: ClientCommodity[];
  
  // Logistics Intelligence
  operational: OperationalProfile;
  
  // Collaboration
  activities: ActivityItem[];
}

interface ClientState {
  clients: Client[];
  activeClient: Client | null;
  isLoading: boolean;
  filters: {
    search: string;
    status: string;
  };

  setSearch: (term: string) => void;
  setFilterStatus: (status: string) => void;
  
  fetchClients: () => Promise<void>;
  createClient: () => void;
  loadClient: (id: string) => Promise<void>;
  saveClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  updateActiveField: (field: keyof Client, value: any) => void;
  updateActiveFinancials: (field: keyof ClientFinancials, value: any) => void;
  updateOperationalProfile: (field: keyof OperationalProfile, value: any) => void;
  
  addContact: (contact: ClientContact) => void;
  removeContact: (contactId: string) => void;
  addRoute: (route: ClientRoute) => void;
  removeRoute: (routeId: string) => void;
  addDocument: (doc: ClientDocument) => void;
  removeDocument: (docId: string) => void;

  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  
  // NEW ACTIONS
  addSupplier: (supplier: ClientSupplier) => void;
  removeSupplier: (id: string) => void;
  addCommodity: (commodity: ClientCommodity) => void;
  removeCommodity: (id: string) => void;
  
  addActivity: (text: string, category: ActivityCategory, tone?: 'success' | 'neutral' | 'warning' | 'destructive') => void;
}

const createEmptyClient = (): Client => ({
  id: `new-${Date.now()}`,
  created_at: new Date().toISOString(),
  entityName: '',
  status: 'PROSPECT',
  type: 'SHIPPER',
  email: '',
  phone: '',
  city: '',
  country: 'Morocco',
  creditLimit: 0,
  creditUsed: 0,
  salesRepId: 'Youssef (Sales)',
  tags: [],
  contacts: [],
  routes: [],
  documents: [],
  suppliers: [],
  commodities: [],
  operational: {
      hsCodes: [],
      requiresHazmat: false,
      requiresReefer: false,
      requiresOOG: false,
      customsRegime: 'STANDARD',
  },
  activities: [
    { 
        id: 'init', 
        category: 'SYSTEM', 
        text: 'Client profile initialized', 
        meta: 'System', 
        timestamp: new Date(), 
        tone: 'neutral' 
    }
  ],
  financials: {
    paymentTerms: 'PREPAID',
    vatNumber: '',
    currency: 'MAD',
    ice: '',
    rc: ''
  }
});

const MOCK_DB_CLIENTS: Client[] = [
    {
        id: 'cli_1', created_at: '2023-01-15T10:00:00Z', entityName: 'TexNord SARL', status: 'ACTIVE', type: 'SHIPPER',
        email: 'logistics@texnord.ma', phone: '+212 522 00 00 00', website: 'www.texnord.ma',
        city: 'Casablanca', country: 'Morocco', address: '123 Ind. Zone Sidi Maarouf',
        creditLimit: 500000, creditUsed: 125000,
        salesRepId: 'Youssef (Sales)', tags: ['VIP', 'Textile', 'Export'],
        contacts: [
            { id: 'ct_1', name: 'Ahmed Bennani', role: 'Logistics Manager', email: 'ahmed@texnord.ma', phone: '+212 600 11 22 33', isPrimary: true }
        ], 
        routes: [
            { id: 'rt_1', origin: 'CASABLANCA', destination: 'LE HAVRE', mode: 'SEA', incoterm: 'CIF', equipment: '40HC', volume: 50, volumeUnit: 'TEU', frequency: 'WEEKLY' },
            { id: 'rt_2', origin: 'CASABLANCA', destination: 'BARCELONA', mode: 'ROAD', incoterm: 'DAP', equipment: 'FTL', volume: 12, volumeUnit: 'TRK', frequency: 'MONTHLY' }
        ],
        documents: [
            { id: 'doc_1', name: 'Commercial Contract 2024.pdf', type: 'CONTRACT', uploadDate: new Date('2024-01-01'), size: '2.4 MB', url: '#' }
        ],
        suppliers: [
            { id: 'sup_1', name: 'Maersk', role: 'SEA_LINE', tier: 'STRATEGIC' },
            { id: 'sup_2', name: 'CMA CGM', role: 'SEA_LINE', tier: 'APPROVED' },
            { id: 'sup_3', name: 'DHL Aviation', role: 'AIRLINE', tier: 'BACKUP' }
        ],
        commodities: [
            { id: 'com_1', name: 'Raw Cotton Fabric', sector: 'TEXTILE', isHazmat: false },
            { id: 'com_2', name: 'Industrial Dyes', sector: 'INDUSTRIAL', isHazmat: true }
        ],
        operational: {
            hsCodes: ['5208.10', '5209.42'],
            requiresHazmat: true,
            requiresReefer: false,
            requiresOOG: false,
            customsRegime: 'STANDARD',
        },
        activities: [
            { id: 'a1', category: 'NOTE', text: 'Meeting with CEO next Tuesday regarding Q3 targets.', meta: 'Youssef', timestamp: new Date('2024-01-20'), tone: 'neutral' }
        ], 
        financials: { paymentTerms: 'NET_60', vatNumber: '12345', currency: 'MAD', ice: '001528829000054', rc: '34992' }
    }
];

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  activeClient: null,
  isLoading: false,
  filters: { search: '', status: 'ALL' },

  setSearch: (search) => set((state) => ({ filters: { ...state.filters, search } })),
  setFilterStatus: (status) => set((state) => ({ filters: { ...state.filters, status } })),

  fetchClients: async () => {
    // PRESERVE STATE: Only fetch if empty to avoid wiping new local creations
    if (get().clients.length > 0) return;

    set({ isLoading: true });
    setTimeout(() => {
        set({ isLoading: false, clients: MOCK_DB_CLIENTS });
    }, 600);
  },

  createClient: () => {
    set({ activeClient: createEmptyClient() });
  },

  loadClient: async (id) => {
    set({ isLoading: true });
    const found = get().clients.find(c => c.id === id);
    setTimeout(() => {
        set({ activeClient: found ? JSON.parse(JSON.stringify(found)) : null, isLoading: false });
    }, 300);
  },

  saveClient: async (client) => {
    set({ isLoading: true });
    setTimeout(() => {
        const { clients } = get();
        const existsIndex = clients.findIndex(c => c.id === client.id);
        let updatedList = [...clients];

        if (existsIndex >= 0) {
            updatedList[existsIndex] = { ...client, updated_at: new Date().toISOString() };
        } else {
            updatedList = [{ ...client, id: client.id, created_at: new Date().toISOString() }, ...clients];
        }

        set({ clients: updatedList, activeClient: client, isLoading: false });
        useToast.getState().toast("Client profile saved successfully", "success");
    }, 600);
  },

  deleteClient: async (id) => {
    set({ clients: get().clients.filter(c => c.id !== id) });
    useToast.getState().toast("Client removed from directory", "info");
  },

  updateActiveField: (field, value) => set(state => ({
      activeClient: state.activeClient ? { ...state.activeClient, [field]: value } : null
  })),

  updateActiveFinancials: (field, value) => set(state => ({
      activeClient: state.activeClient ? { 
          ...state.activeClient, 
          financials: { ...state.activeClient.financials, [field]: value } 
      } : null
  })),

  updateOperationalProfile: (field, value) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          operational: { ...state.activeClient.operational, [field]: value }
      } : null
  })),

  addContact: (contact) => set(state => {
      if (!state.activeClient) return {};
      const newContacts = [...state.activeClient.contacts, contact];
      if(contact.isPrimary) {
          newContacts.forEach(c => { if(c.id !== contact.id) c.isPrimary = false });
      }
      return { activeClient: { ...state.activeClient, contacts: newContacts } };
  }),

  removeContact: (id) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          contacts: state.activeClient.contacts.filter(c => c.id !== id)
      } : null
  })),

  addRoute: (route) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          routes: [...state.activeClient.routes, route]
      } : null
  })),

  removeRoute: (id) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          routes: state.activeClient.routes.filter(r => r.id !== id)
      } : null
  })),

  addDocument: (doc) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          documents: [doc, ...state.activeClient.documents]
      } : null
  })),

  removeDocument: (id) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          documents: state.activeClient.documents.filter(d => d.id !== id)
      } : null
  })),

  addTag: (tag) => set(state => {
      if(!state.activeClient || state.activeClient.tags.includes(tag)) return {};
      return { activeClient: { ...state.activeClient, tags: [...state.activeClient.tags, tag] } };
  }),

  removeTag: (tag) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          tags: state.activeClient.tags.filter(t => t !== tag)
      } : null
  })),

  // --- NEW RICH ACTIONS ---
  addSupplier: (supplier) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          suppliers: [...state.activeClient.suppliers, supplier]
      } : null
  })),

  removeSupplier: (id) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          suppliers: state.activeClient.suppliers.filter(s => s.id !== id)
      } : null
  })),

  addCommodity: (commodity) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          commodities: [...state.activeClient.commodities, commodity]
      } : null
  })),

  removeCommodity: (id) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          commodities: state.activeClient.commodities.filter(c => c.id !== id)
      } : null
  })),

  addActivity: (text, category, tone = 'neutral') => set(state => {
      if(!state.activeClient) return {};
      const newActivity: ActivityItem = {
          id: Math.random().toString(36).substr(2, 9),
          category,
          text,
          tone,
          meta: 'User Action',
          timestamp: new Date()
      };
      return { activeClient: { ...state.activeClient, activities: [newActivity, ...state.activeClient.activities] } };
  }),
}));