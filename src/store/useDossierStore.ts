import { create } from 'zustand';
import { Dossier, DossierContainer, ShipmentStatus, ActivityItem, ActivityCategory } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";

interface DossierState {
  // Collection State
  dossiers: Dossier[];
  dossier: Dossier; // The Active/Selected Dossier
  isLoading: boolean;
  isEditing: boolean;

  // Actions
  fetchDossiers: () => Promise<void>;
  createDossier: () => void;
  loadDossier: (id: string) => void;
  saveDossier: () => Promise<void>;
  deleteDossier: (id: string) => Promise<void>;
  
  // Active Dossier Edits
  setEditing: (isEditing: boolean) => void;
  updateDossier: (field: keyof Dossier, value: any) => void;
  updateParty: (party: 'shipper' | 'consignee' | 'notify', field: string, value: string) => void;
  setStatus: (status: ShipmentStatus) => void;
  
  // Container Actions
  addContainer: () => void;
  updateContainer: (id: string, field: keyof DossierContainer, value: any) => void;
  removeContainer: (id: string) => void;

  // Collaboration
  // [ARCHITECT NOTE]: Updated signature to match ClientStore and support UI 'tone'
  addActivity: (text: string, category: ActivityCategory, tone?: 'success' | 'neutral' | 'warning' | 'destructive') => void;
}

// --- MOCK DATA GENERATOR ---
const generateMockDossiers = (): Dossier[] => [
    {
        id: '1', ref: 'IMP-24-0056', status: 'ON_WATER', clientId: 'cli_1', clientName: 'TexNord SARL',
        mblNumber: 'MAEU123456789', hblNumber: 'ATL-IMP-0056', carrier: 'Maersk Line',
        vesselName: 'CMA CGM JULES VERNE', voyageNumber: '0ME2QE1MA',
        pol: 'SHANGHAI (CN)', pod: 'CASABLANCA (MAP)', etd: new Date('2024-11-20'), eta: new Date('2024-12-05'),
        incoterm: 'FOB', mode: 'SEA_FCL', freeTimeDays: 7,
        shipper: { name: 'Shanghai Textiles Ltd' }, consignee: { name: 'TexNord SARL' },
        containers: [{ id: 'c1', number: 'MSKU9012345', type: '40HC', seal: '123456', weight: 12500, packages: 500, packageType: 'CARTONS', volume: 65, status: 'ON_WATER' }],
        activities: [], totalRevenue: 45000, totalCost: 32000, currency: 'MAD'
    },
    {
        id: '2', ref: 'EXP-24-0102', status: 'BOOKED', clientId: 'cli_2', clientName: 'AgriSouss',
        mblNumber: 'Pending', hblNumber: 'ATL-EXP-0102', carrier: 'CMA CGM',
        vesselName: 'TANGER EXPRESS', voyageNumber: 'TGX99',
        pol: 'AGADIR (MAP)', pod: 'ROTTERDAM (NL)', etd: new Date('2024-12-10'), eta: new Date('2024-12-16'),
        incoterm: 'CIF', mode: 'SEA_FCL', freeTimeDays: 5,
        shipper: { name: 'AgriSouss' }, consignee: { name: 'Fresh Market BV' },
        containers: [], activities: [], totalRevenue: 28000, totalCost: 21000, currency: 'EUR'
    },
    {
        id: '3', ref: 'AIR-24-088', status: 'CUSTOMS', clientId: 'cli_3', clientName: 'AutoParts MA',
        mblNumber: '057-99991111', hblNumber: 'ATL-AIR-088', carrier: 'Air France',
        vesselName: 'AF1232', voyageNumber: 'AF1232',
        pol: 'CDG (FR)', pod: 'CMN (MAP)', etd: new Date('2024-11-28'), eta: new Date('2024-11-28'),
        incoterm: 'EXW', mode: 'AIR', freeTimeDays: 3,
        shipper: { name: 'Valeo France' }, consignee: { name: 'AutoParts MA' },
        containers: [], activities: [], totalRevenue: 15000, totalCost: 11000, currency: 'MAD'
    }
];

const DEFAULT_DOSSIER: Dossier = {
    id: 'new', ref: 'NEW-FILE', status: 'BOOKED', clientId: '', clientName: '',
    mblNumber: '', hblNumber: '', carrier: '', vesselName: '', voyageNumber: '',
    pol: '', pod: '', etd: new Date(), eta: new Date(),
    incoterm: 'FOB', mode: 'SEA_FCL', freeTimeDays: 7,
    shipper: { name: '' }, consignee: { name: '' },
    containers: [], activities: [], totalRevenue: 0, totalCost: 0, currency: 'MAD'
};

export const useDossierStore = create<DossierState>((set, get) => ({
  dossiers: [],
  dossier: DEFAULT_DOSSIER,
  isLoading: false,
  isEditing: false,

  fetchDossiers: async () => {
      set({ isLoading: true });
      // Simulate DB fetch
      setTimeout(() => {
          set({ dossiers: generateMockDossiers(), isLoading: false });
      }, 500);
  },

  createDossier: () => {
      set({ dossier: { ...DEFAULT_DOSSIER, id: `new-${Date.now()}` }, isEditing: true });
  },

  loadDossier: (id) => {
      const found = get().dossiers.find(d => d.id === id);
      if (found) set({ dossier: JSON.parse(JSON.stringify(found)), isEditing: false });
  },

  setEditing: (isEditing) => set({ isEditing }),

  updateDossier: (field, value) => set((state) => ({
      dossier: { ...state.dossier, [field]: value }
  })),

  updateParty: (party, field, value) => set((state) => ({
      dossier: {
          ...state.dossier,
          [party]: { ...state.dossier[party as 'shipper'], [field]: value }
      }
  })),

  setStatus: (status) => {
      set((state) => ({
          dossier: { ...state.dossier, status }
      }));
      get().addActivity(`Status changed to ${status}`, 'SYSTEM');
  },

  addContainer: () => {
      const newContainer: DossierContainer = {
          id: Math.random().toString(36).substr(2,9),
          number: '', 
          type: '40HC', 
          seal: '', 
          weight: 0, 
          packages: 0, 
          packageType: 'PALLETS',
          volume: 0, 
          status: 'GATE_IN'
      };
      set((state) => ({
          dossier: { ...state.dossier, containers: [...state.dossier.containers, newContainer] }
      }));
  },

  updateContainer: (id, field, value) => set((state) => ({
      dossier: {
          ...state.dossier,
          containers: state.dossier.containers.map(c => c.id === id ? { ...c, [field]: value } : c)
      }
  })),

  removeContainer: (id) => set((state) => ({
      dossier: {
          ...state.dossier,
          containers: state.dossier.containers.filter(c => c.id !== id)
      }
  })),

  saveDossier: async () => {
      set({ isLoading: true });
      setTimeout(() => {
          const state = get();
          let newDossiers = [...state.dossiers];
          const index = newDossiers.findIndex(d => d.id === state.dossier.id);
          
          if (index >= 0) {
              newDossiers[index] = state.dossier;
          } else {
              newDossiers.unshift(state.dossier);
          }

          set({ dossiers: newDossiers, isLoading: false, isEditing: false });
          useToast.getState().toast("Shipment saved successfully.", "success");
      }, 800);
  },

  deleteDossier: async (id) => {
      set({ dossiers: get().dossiers.filter(d => d.id !== id) });
      useToast.getState().toast("Shipment archived.", "info");
  },

  // [ARCHITECT NOTE]: Implementation updated to handle optional 'tone'
  addActivity: (text, category, tone = 'neutral') => set((state) => ({
      dossier: {
          ...state.dossier,
          activities: [{ 
              id: Math.random().toString(36), 
              category, 
              text, 
              tone, 
              meta: 'User', 
              timestamp: new Date() 
          }, ...state.dossier.activities]
      }
  })),
}));