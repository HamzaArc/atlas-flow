import { create } from 'zustand';
import { useToast } from "@/components/ui/use-toast";
import { 
    Client, 
    ClientContact, 
    ClientRoute, 
    ClientDocument, 
    ClientFinancials, 
    ClientSupplier, 
    ClientCommodity, 
    OperationalProfile,
    ActivityItem, 
    ActivityCategory 
} from "@/types/index";
import { ClientService } from '@/services/client.service';

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

  // STRICT TYPING GENERIC
  updateActiveField: <K extends keyof Client>(field: K, value: Client[K]) => void;
  updateActiveFinancials: <K extends keyof ClientFinancials>(field: K, value: ClientFinancials[K]) => void;
  updateOperationalProfile: <K extends keyof OperationalProfile>(field: K, value: OperationalProfile[K]) => void;
  
  addContact: (contact: ClientContact) => void;
  removeContact: (contactId: string) => void;
  addRoute: (route: ClientRoute) => void;
  removeRoute: (routeId: string) => void;
  addDocument: (doc: ClientDocument) => void;
  removeDocument: (docId: string) => void;

  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  
  addSupplier: (supplier: ClientSupplier) => void;
  removeSupplier: (id: string) => void;
  addCommodity: (commodity: ClientCommodity) => void;
  removeCommodity: (id: string) => void;
  
  addActivity: (text: string, category: ActivityCategory, tone?: 'success' | 'neutral' | 'warning' | 'destructive') => void;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  activeClient: null,
  isLoading: false,
  filters: { search: '', status: 'ALL' },

  setSearch: (search) => set((state) => ({ filters: { ...state.filters, search } })),
  setFilterStatus: (status) => set((state) => ({ filters: { ...state.filters, status } })),

  fetchClients: async () => {
    if (get().clients.length > 0) return;

    set({ isLoading: true });
    try {
        const clients = await ClientService.fetchAll();
        set({ isLoading: false, clients });
    } catch (e) {
        set({ isLoading: false });
        useToast.getState().toast("Failed to load clients", "error");
    }
  },

  createClient: () => {
    set({ activeClient: ClientService.createEmpty() });
  },

  loadClient: async (id) => {
    set({ isLoading: true });
    const found = get().clients.find(c => c.id === id);
    
    // Simulate selection delay
    setTimeout(() => {
        set({ activeClient: found ? JSON.parse(JSON.stringify(found)) : null, isLoading: false });
    }, 100);
  },

  saveClient: async (client) => {
    set({ isLoading: true });
    
    await ClientService.save(client);

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
  },

  deleteClient: async (id) => {
    set({ clients: get().clients.filter(c => c.id !== id) });
    useToast.getState().toast("Client removed from directory", "info");
  },

  // --- GENERIC UPDATES ---
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