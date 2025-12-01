import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

// --- DOMAIN TYPES ---
export type ClientStatus = 'ACTIVE' | 'PROSPECT' | 'SUSPENDED' | 'BLACKLISTED';
export type ClientType = 'SHIPPER' | 'CONSIGNEE' | 'FORWARDER' | 'PARTNER';

export interface Client {
  id: string;
  created_at?: string;
  entityName: string;
  status: ClientStatus;
  type: ClientType;
  email: string;
  phone: string;
  city: string;
  country: string;
  creditLimit: number;
  creditUsed: number;
  salesRepId: string;
  tags: string[];
  // JSONB Data fields
  contacts: any[];
  routes: any[];
  financials: {
    paymentTerms: string;
    vatNumber: string;
    currency: string;
  };
}

interface ClientState {
  // State
  clients: Client[];
  activeClient: Client | null; // For the Detail View
  isLoading: boolean;
  filters: {
    search: string;
    status: string;
  };

  // Actions
  setSearch: (term: string) => void;
  setFilterStatus: (status: string) => void;
  
  fetchClients: () => Promise<void>;
  createClient: () => void; // Initializes a blank client for the form
  loadClient: (id: string) => Promise<void>;
  saveClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

// --- DEFAULT EMPTY STATE ---
const NEW_CLIENT_TEMPLATE: Client = {
  id: 'new',
  entityName: '',
  status: 'PROSPECT',
  type: 'SHIPPER',
  email: '',
  phone: '',
  city: '',
  country: 'Morocco',
  creditLimit: 0,
  creditUsed: 0,
  salesRepId: '',
  tags: [],
  contacts: [],
  routes: [],
  financials: {
    paymentTerms: 'PREPAID',
    vatNumber: '',
    currency: 'MAD'
  }
};

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
    // Production: Replace with actual Supabase call
    // const { data, error } = await supabase.from('clients').select('*');
    
    // Simulation for Dev (Remove when DB is live)
    setTimeout(() => {
        set({ isLoading: false });
        // Only set mock data if empty (to persist changes in session)
        if (get().clients.length === 0) {
            set({ clients: MOCK_DB_CLIENTS });
        }
    }, 600);
  },

  createClient: () => {
    set({ activeClient: { ...NEW_CLIENT_TEMPLATE, id: `new-${Date.now()}` } });
  },

  loadClient: async (id) => {
    set({ isLoading: true });
    // In production, fetch specific ID from DB
    const client = get().clients.find(c => c.id === id) || null;
    set({ activeClient: client, isLoading: false });
  },

  saveClient: async (client) => {
    set({ isLoading: true });
    // Upsert logic
    const exists = get().clients.find(c => c.id === client.id);
    let updatedList;
    
    if (exists) {
        updatedList = get().clients.map(c => c.id === client.id ? client : c);
    } else {
        updatedList = [client, ...get().clients];
    }

    // Simulate DB Save delay
    setTimeout(() => {
        set({ clients: updatedList, isLoading: false });
        useToast.getState().toast("Client saved successfully", "success");
    }, 500);
  },

  deleteClient: async (id) => {
    set({ clients: get().clients.filter(c => c.id !== id) });
    useToast.getState().toast("Client removed", "info");
  }
}));

// --- SEED DATA (For immediate visual validation) ---
const MOCK_DB_CLIENTS: Client[] = [
    {
        id: 'cli_1', entityName: 'TexNord SARL', status: 'ACTIVE', type: 'SHIPPER',
        email: 'logistics@texnord.ma', phone: '+212 522 00 00 00',
        city: 'Casablanca', country: 'Morocco',
        creditLimit: 500000, creditUsed: 125000,
        salesRepId: 'Youssef (Sales)', tags: ['VIP', 'Textile'],
        contacts: [], routes: [], financials: { paymentTerms: 'NET_60', vatNumber: '12345', currency: 'MAD' }
    },
    {
        id: 'cli_2', entityName: 'Global Fruits Exp', status: 'ACTIVE', type: 'SHIPPER',
        email: 'ops@globalfruits.com', phone: '+212 661 99 88 77',
        city: 'Agadir', country: 'Morocco',
        creditLimit: 200000, creditUsed: 195000,
        salesRepId: 'Fatima (Ops)', tags: ['Perishable', 'Reefer'],
        contacts: [], routes: [], financials: { paymentTerms: 'NET_30', vatNumber: '67890', currency: 'MAD' }
    },
    {
        id: 'cli_3', entityName: 'AutoParts Tangier', status: 'PROSPECT', type: 'CONSIGNEE',
        email: 'purchasing@autoparts.ma', phone: '+212 539 33 44 55',
        city: 'Tangier', country: 'Morocco',
        creditLimit: 0, creditUsed: 0,
        salesRepId: 'Youssef (Sales)', tags: ['Automotive'],
        contacts: [], routes: [], financials: { paymentTerms: 'PREPAID', vatNumber: '54321', currency: 'EUR' }
    }
];