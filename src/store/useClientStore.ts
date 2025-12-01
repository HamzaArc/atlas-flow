import { create } from 'zustand';
import { useToast } from "@/components/ui/use-toast";
import { ActivityItem, ActivityCategory } from "@/types/index"; // Ensure this import exists or define locally if needed

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
  volume: string;
}

export interface ClientFinancials {
  paymentTerms: string;
  vatNumber: string;
  currency: string;
  ice?: string;
  rc?: string;
}

export interface Client {
  id: string;
  created_at: string; // Made mandatory for "Customer From" logic
  updated_at?: string;
  entityName: string;
  status: ClientStatus;
  type: ClientType;
  email: string;
  phone: string;
  city: string;
  country: string;
  address?: string;
  creditLimit: number;
  creditUsed: number;
  salesRepId: string;
  
  // Segmentation
  tags: string[];
  
  // Nested Data
  contacts: ClientContact[];
  routes: ClientRoute[];
  financials: ClientFinancials;
  
  // Enhanced Logistics
  preferredSuppliers: string[];
  preferredGoods: string[];
  
  // Collaboration Hub
  activities: ActivityItem[];
  
  internalNotes?: string; // Legacy field, kept for backward compat
}

interface ClientState {
  // State
  clients: Client[];
  activeClient: Client | null;
  isLoading: boolean;
  filters: {
    search: string;
    status: string;
  };

  // Actions
  setSearch: (term: string) => void;
  setFilterStatus: (status: string) => void;
  
  fetchClients: () => Promise<void>;
  createClient: () => void;
  loadClient: (id: string) => Promise<void>;
  saveClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Granular State Mutations
  updateActiveField: (field: keyof Client, value: any) => void;
  updateActiveFinancials: (field: keyof ClientFinancials, value: any) => void;
  
  // Contact Actions
  addContact: (contact: ClientContact) => void;
  removeContact: (contactId: string) => void;
  
  // Route Actions
  addRoute: (route: ClientRoute) => void;
  removeRoute: (routeId: string) => void;

  // Tag Actions
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;

  // Logistics Preference Actions
  addPreference: (type: 'preferredSuppliers' | 'preferredGoods', value: string) => void;
  removePreference: (type: 'preferredSuppliers' | 'preferredGoods', value: string) => void;

  // Activity Actions
  addActivity: (text: string, category: ActivityCategory, tone?: 'success' | 'neutral' | 'warning' | 'destructive') => void;
}

// --- DEFAULT FACTORY ---
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
  preferredSuppliers: [],
  preferredGoods: [],
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

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  activeClient: null,
  isLoading: false,
  filters: { search: '', status: 'ALL' },

  setSearch: (search) => set((state) => ({ filters: { ...state.filters, search } })),
  setFilterStatus: (status) => set((state) => ({ filters: { ...state.filters, status } })),

  // --- DATABASE INTERACTIONS ---
  fetchClients: async () => {
    set({ isLoading: true });
    // Simulate DB fetch
    setTimeout(() => {
        set({ isLoading: false });
        if (get().clients.length === 0) set({ clients: MOCK_DB_CLIENTS });
    }, 600);
  },

  createClient: () => {
    set({ activeClient: createEmptyClient() });
  },

  loadClient: async (id) => {
    set({ isLoading: true });
    const found = get().clients.find(c => c.id === id);
    setTimeout(() => {
        // Deep copy to avoid mutating the list directly during edit
        set({ activeClient: found ? JSON.parse(JSON.stringify(found)) : null, isLoading: false });
    }, 300);
  },

  saveClient: async (client) => {
    set({ isLoading: true });
    setTimeout(() => {
        const { clients } = get();
        const exists = clients.find(c => c.id === client.id);
        let updatedList;

        if (exists) {
            updatedList = clients.map(c => c.id === client.id ? { ...client, updated_at: new Date().toISOString() } : c);
        } else {
            updatedList = [{ ...client, id: `cli_${Date.now()}`, created_at: new Date().toISOString() }, ...clients];
        }

        set({ clients: updatedList, activeClient: client, isLoading: false });
        useToast.getState().toast("Client saved successfully", "success");
    }, 600);
  },

  deleteClient: async (id) => {
    set({ clients: get().clients.filter(c => c.id !== id) });
    useToast.getState().toast("Client permanently removed", "info");
  },

  // --- GRANULAR EDITORS ---
  updateActiveField: (field, value) => set(state => ({
      activeClient: state.activeClient ? { ...state.activeClient, [field]: value } : null
  })),

  updateActiveFinancials: (field, value) => set(state => ({
      activeClient: state.activeClient ? { 
          ...state.activeClient, 
          financials: { ...state.activeClient.financials, [field]: value } 
      } : null
  })),

  // --- SUB-RESOURCE ACTIONS ---
  addContact: (contact) => set(state => {
      if (!state.activeClient) return {};
      const newContacts = [...state.activeClient.contacts, contact];
      // Logic: if new contact is primary, unset others
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

  addPreference: (type, value) => set(state => {
      if(!state.activeClient) return {};
      const list = state.activeClient[type];
      if(list.includes(value)) return {};
      return { activeClient: { ...state.activeClient, [type]: [...list, value] } };
  }),

  removePreference: (type, value) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          [type]: state.activeClient[type].filter(item => item !== value)
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

// --- SEED DATA ---
const MOCK_DB_CLIENTS: Client[] = [
    {
        id: 'cli_1', created_at: '2023-01-15T10:00:00Z', entityName: 'TexNord SARL', status: 'ACTIVE', type: 'SHIPPER',
        email: 'logistics@texnord.ma', phone: '+212 522 00 00 00',
        city: 'Casablanca', country: 'Morocco',
        creditLimit: 500000, creditUsed: 125000,
        salesRepId: 'Youssef (Sales)', tags: ['VIP', 'Textile'],
        contacts: [
            { id: 'ct_1', name: 'Ahmed Bennani', role: 'Logistics Manager', email: 'ahmed@texnord.ma', phone: '+212 600 11 22 33', isPrimary: true }
        ], 
        routes: [
            { id: 'rt_1', origin: 'CASABLANCA', destination: 'LE HAVRE', mode: 'SEA', volume: '50 TEU/yr' }
        ],
        preferredSuppliers: ['Maersk', 'CMA CGM'],
        preferredGoods: ['Fabrics', 'Yarn'],
        activities: [
            { id: 'a1', category: 'NOTE', text: 'Meeting with CEO next Tuesday.', meta: 'Youssef', timestamp: new Date('2024-01-20'), tone: 'neutral' },
            { id: 'a2', category: 'SYSTEM', text: 'Credit limit increased to 500k', meta: 'System', timestamp: new Date('2023-12-01'), tone: 'success' }
        ], 
        financials: { paymentTerms: 'NET_60', vatNumber: '12345', currency: 'MAD', ice: '001528829000054' }
    },
    {
        id: 'cli_2', created_at: '2023-06-20T14:30:00Z', entityName: 'Global Fruits Exp', status: 'ACTIVE', type: 'SHIPPER',
        email: 'ops@globalfruits.com', phone: '+212 661 99 88 77',
        city: 'Agadir', country: 'Morocco',
        creditLimit: 200000, creditUsed: 195000,
        salesRepId: 'Fatima (Ops)', tags: ['Perishable', 'Reefer'],
        contacts: [], routes: [], preferredSuppliers: [], preferredGoods: [], activities: [],
        financials: { paymentTerms: 'NET_30', vatNumber: '67890', currency: 'MAD' }
    },
    {
        id: 'cli_3', created_at: '2024-02-10T09:15:00Z', entityName: 'AutoParts Tangier', status: 'PROSPECT', type: 'CONSIGNEE',
        email: 'purchasing@autoparts.ma', phone: '+212 539 33 44 55',
        city: 'Tangier', country: 'Morocco',
        creditLimit: 0, creditUsed: 0,
        salesRepId: 'Youssef (Sales)', tags: ['Automotive'],
        contacts: [], routes: [], preferredSuppliers: [], preferredGoods: [], activities: [],
        financials: { paymentTerms: 'PREPAID', vatNumber: '54321', currency: 'EUR' }
    }
];