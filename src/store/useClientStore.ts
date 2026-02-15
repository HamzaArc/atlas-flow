import { create } from 'zustand';
import { toast } from "@/components/ui/use-toast"; 
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
  updateContact: (contact: ClientContact) => void; // Added updateContact
  removeContact: (contactId: string) => void;
  
  addRoute: (route: ClientRoute) => void;
  updateRoute: (route: ClientRoute) => void; 
  removeRoute: (routeId: string) => void;
  
  addDocument: (doc: ClientDocument) => void;
  updateDocument: (doc: ClientDocument) => void;
  removeDocument: (docId: string) => void;

  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  
  addSupplier: (supplier: ClientSupplier) => void;
  updateSupplier: (supplier: ClientSupplier) => void; 
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
    set({ isLoading: true });
    try {
        const clients = await ClientService.fetchAll();
        set({ isLoading: false, clients });
    } catch (e: any) {
        set({ isLoading: false });
        toast(
            `Error loading clients: ${e.message || "Could not connect to database"}`, 
            "error"
        );
    }
  },

  createClient: () => {
    set({ activeClient: ClientService.createEmpty() });
  },

  loadClient: async (id) => {
    set({ isLoading: true });
    const found = get().clients.find(c => c.id === id);
    
    // Simulate selection delay for UI transition
    setTimeout(() => {
        set({ 
            activeClient: found ? JSON.parse(JSON.stringify(found)) : null, 
            isLoading: false 
        });
    }, 50);
  },

  saveClient: async (client) => {
    set({ isLoading: true });
    
    try {
        // 1. Persist to DB
        const savedClient = await ClientService.save(client);

        // 2. Update Local State (Optimistic-ish)
        const { clients } = get();
        const existsIndex = clients.findIndex(c => c.id === client.id);
        
        let updatedList = [...clients];

        if (existsIndex >= 0) {
            updatedList[existsIndex] = savedClient;
        } else {
            updatedList = [savedClient, ...clients];
        }

        set({ clients: updatedList, activeClient: savedClient, isLoading: false });
        
        toast(
            `Client ${savedClient.entityName} saved successfully`,
            "success"
        );

    } catch (e: any) {
        set({ isLoading: false });
        toast(
            `Save Failed: ${e.message}`,
            "error"
        );
    }
  },

  deleteClient: async (id) => {
    // Optimistic Update
    const previousClients = get().clients;
    set({ clients: previousClients.filter(c => c.id !== id) });

    try {
        await ClientService.delete(id);
        toast("Client removed from directory", "info");
    } catch (e: any) {
        // Revert on failure
        set({ clients: previousClients });
        toast(
            `Could not delete client: ${e.message}`,
            "error"
        );
    }
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
          // Ensure only one primary contact
          newContacts.forEach(c => { if(c.id !== contact.id) c.isPrimary = false });
      }
      return { activeClient: { ...state.activeClient, contacts: newContacts } };
  }),

  updateContact: (contact) => set(state => {
      if (!state.activeClient) return {};
      const updatedContacts = state.activeClient.contacts.map(c => 
        c.id === contact.id ? contact : c
      );
      if(contact.isPrimary) {
        updatedContacts.forEach(c => { if(c.id !== contact.id) c.isPrimary = false });
      }
      return { activeClient: { ...state.activeClient, contacts: updatedContacts } };
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

  updateRoute: (route) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          routes: state.activeClient.routes.map(r => r.id === route.id ? route : r)
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

  updateDocument: (doc) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          documents: state.activeClient.documents.map(d => d.id === doc.id ? doc : d)
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

  updateSupplier: (supplier) => set(state => ({
      activeClient: state.activeClient ? {
          ...state.activeClient,
          suppliers: state.activeClient.suppliers.map(s => s.id === supplier.id ? supplier : s)
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