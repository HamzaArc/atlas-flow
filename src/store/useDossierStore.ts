import { create } from 'zustand';
import { Dossier, DossierContainer, ShipmentStatus, ActivityCategory, ShipmentStage, DossierTask } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";
import { DossierService } from '@/services/dossier.service';

interface DossierState {
  // Collection State
  dossiers: Dossier[];
  dossier: Dossier; // The Active/Selected Dossier
  isLoading: boolean;
  isEditing: boolean;
  error: string | null;

  // Actions
  fetchDossiers: () => Promise<void>;
  createDossier: () => void;
  loadDossier: (id: string) => Promise<void>;
  saveDossier: () => Promise<void>;
  deleteDossier: (id: string) => Promise<void>;
  
  // Active Dossier Edits
  setEditing: (isEditing: boolean) => void;
  
  // STRICT TYPING GENERIC
  updateDossier: <K extends keyof Dossier>(field: K, value: Dossier[K]) => void;
  updateParty: (party: 'shipper' | 'consignee' | 'notify', field: string, value: string) => void;
  setStatus: (status: ShipmentStatus) => void;
  setStage: (stage: ShipmentStage) => void;
  
  // Container Actions
  addContainer: (container?: DossierContainer) => void;
  updateContainer: <K extends keyof DossierContainer>(id: string, field: K, value: DossierContainer[K]) => void;
  removeContainer: (id: string) => void;

  // Task Actions
  addTask: (task: DossierTask) => void;
  toggleTask: (taskId: string) => void;

  // Activity/Collaboration
  addActivity: (text: string, category: ActivityCategory, tone?: 'success' | 'neutral' | 'warning' | 'destructive') => void;
  
  // Internal Logic
  runSmartChecks: () => void;
}

const DEFAULT_DOSSIER: Dossier = {
    id: 'new', 
    ref: 'NEW-FILE', 
    bookingRef: '', 
    status: 'BOOKED',
    stage: ShipmentStage.INTAKE,
    clientId: '', 
    clientName: '',
    mblNumber: '', 
    hblNumber: '', 
    carrier: '', 
    vesselName: '', 
    voyageNumber: '',
    pol: '', 
    pod: '', 
    etd: new Date(), 
    eta: new Date(),
    incoterm: 'FOB', 
    mode: 'SEA_FCL', 
    freeTimeDays: 7,
    shipper: { name: '', role: 'Shipper' }, 
    consignee: { name: '', role: 'Consignee' },
    parties: [], 
    containers: [],
    cargoItems: [],
    documents: [],
    activities: [], 
    tasks: [], 
    events: [], 
    tags: [], 
    totalRevenue: 0, 
    totalCost: 0, 
    currency: 'MAD',
    alerts: [], 
    nextAction: 'Initialize Booking'
};

export const useDossierStore = create<DossierState>((set, get) => ({
  dossiers: [],
  dossier: DEFAULT_DOSSIER,
  isLoading: false,
  isEditing: false,
  error: null,

  fetchDossiers: async () => {
      set({ isLoading: true, error: null });
      try {
          const dossiers = await DossierService.fetchAll();
          set({ dossiers, isLoading: false });
      } catch (e: any) {
          console.error("Failed to fetch dossiers", e);
          set({ isLoading: false, error: e.message || 'Failed to fetch dossiers' });
          // FIXED: Correct toast signature
          useToast.getState().toast("Connection Error: Could not retrieve shipments.", "error");
      }
  },

  createDossier: () => {
      set({ 
          dossier: { ...DEFAULT_DOSSIER, id: `new-${Date.now()}` }, 
          isEditing: true,
          error: null
      });
  },

  loadDossier: async (id) => {
      set({ isLoading: true, error: null });
      try {
          let found = get().dossiers.find(d => d.id === id);
          
          if (!found) {
             const fromDb = await DossierService.getById(id);
             if (fromDb) found = fromDb;
          }

          if (found) {
              const safeCopy = JSON.parse(JSON.stringify(found));
              // Restore Date objects
              if (safeCopy.etd) safeCopy.etd = new Date(safeCopy.etd);
              if (safeCopy.eta) safeCopy.eta = new Date(safeCopy.eta);
              
              set({ dossier: safeCopy, isEditing: false, isLoading: false });
              get().runSmartChecks();
          } else {
              set({ isLoading: false, error: 'Shipment not found' });
          }
      } catch (e) {
          set({ isLoading: false, error: 'Failed to load shipment details' });
      }
  },

  setEditing: (isEditing) => set({ isEditing }),

  updateDossier: (field, value) => {
      set((state) => ({
          dossier: { ...state.dossier, [field]: value }
      }));
      if (['eta', 'etd', 'status', 'mblNumber'].includes(field as string)) {
          get().runSmartChecks();
      }
  },

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
      get().addActivity(`Shipment status updated to ${status}`, 'SYSTEM', 'neutral');
      get().runSmartChecks();
  },

  setStage: (stage) => {
      set((state) => ({
          dossier: { ...state.dossier, stage }
      }));
      get().addActivity(`Shipment moved to stage: ${stage}`, 'SYSTEM', 'neutral');
  },

  addContainer: (container) => {
      const newContainer: DossierContainer = container || {
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

  addTask: (task) => set((state) => ({
      dossier: {
          ...state.dossier,
          tasks: [...state.dossier.tasks, task]
      }
  })),

  toggleTask: (taskId) => set((state) => ({
      dossier: {
          ...state.dossier,
          tasks: state.dossier.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
      }
  })),

  saveDossier: async () => {
      set({ isLoading: true });
      get().runSmartChecks(); 
      
      const { dossier, dossiers } = get();
      
      try {
          const savedDossier = await DossierService.save(dossier);
          
          const index = dossiers.findIndex(d => d.id === dossier.id);
          let newDossiers = [...dossiers];
          
          if (index >= 0) {
              newDossiers[index] = savedDossier;
          } else {
              // Handle new ID replacement
              const tempIndex = dossiers.findIndex(d => d.id === dossier.id);
              if (tempIndex >= 0) {
                  newDossiers[tempIndex] = savedDossier;
              } else {
                  newDossiers.unshift(savedDossier);
              }
          }

          set({ 
              dossier: savedDossier, 
              dossiers: newDossiers, 
              isLoading: false, 
              isEditing: false 
          });
          
          useToast.getState().toast("Shipment data saved securely.", "success");
      } catch (e: any) {
          set({ isLoading: false });
          useToast.getState().toast("Save failed: " + e.message, "error");
          console.error("Save failed", e);
      }
  },

  deleteDossier: async (id) => {
      set({ isLoading: true });
      try {
          await DossierService.delete(id);
          set((state) => ({ 
              dossiers: state.dossiers.filter(d => d.id !== id),
              isLoading: false
          }));
          useToast.getState().toast("Shipment deleted.", "info");
      } catch (e) {
          set({ isLoading: false });
          useToast.getState().toast("Failed to delete shipment.", "error");
      }
  },

  addActivity: (text, category, tone = 'neutral') => set((state) => ({
      dossier: {
          ...state.dossier,
          activities: [{ 
              id: Math.random().toString(36), 
              category, 
              text, 
              tone, 
              meta: 'System', 
              timestamp: new Date() 
          }, ...state.dossier.activities]
      }
  })),

  runSmartChecks: () => {
      const { dossier } = get();
      const { alerts, nextAction } = DossierService.analyzeHealth(dossier);
      
      set((state) => ({
          dossier: { ...state.dossier, alerts, nextAction }
      }));
  }
}));