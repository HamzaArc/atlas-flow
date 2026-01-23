// src/store/useDossierStore.ts
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

  // Actions
  fetchDossiers: () => Promise<void>;
  createDossier: () => void;
  loadDossier: (id: string) => void;
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

  // Task Actions (New)
  addTask: (task: DossierTask) => void;
  toggleTask: (taskId: string) => void;

  // Collaboration
  addActivity: (text: string, category: ActivityCategory, tone?: 'success' | 'neutral' | 'warning' | 'destructive') => void;
  
  // Internal Logic
  runSmartChecks: () => void;
}

const DEFAULT_DOSSIER: Dossier = {
    id: 'new', 
    ref: 'NEW-FILE', 
    bookingRef: '', 
    status: 'BOOKED',
    stage: ShipmentStage.INTAKE, // New Default
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
    cargoItems: [], // New default
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

  fetchDossiers: async () => {
      set({ isLoading: true });
      try {
          const dossiers = await DossierService.fetchAll();
          set({ dossiers, isLoading: false });
      } catch (e) {
          set({ isLoading: false });
      }
  },

  createDossier: () => {
      set({ dossier: { ...DEFAULT_DOSSIER, id: `new-${Date.now()}` }, isEditing: true });
  },

  loadDossier: (id) => {
      const found = get().dossiers.find(d => d.id === id);
      if (found) {
          const safeCopy = JSON.parse(JSON.stringify(found));
          
          if (!safeCopy.tasks) safeCopy.tasks = [];
          if (!safeCopy.events) safeCopy.events = [];
          if (!safeCopy.parties) safeCopy.parties = [];
          if (!safeCopy.tags) safeCopy.tags = [];
          if (!safeCopy.containers) safeCopy.containers = [];
          if (!safeCopy.cargoItems) safeCopy.cargoItems = [];
          if (!safeCopy.stage) safeCopy.stage = ShipmentStage.INTAKE;

          set({ dossier: safeCopy, isEditing: false });
          get().runSmartChecks();
      }
  },

  setEditing: (isEditing) => set({ isEditing }),

  updateDossier: (field, value) => {
      set((state) => ({
          dossier: { ...state.dossier, [field]: value }
      }));
      if (['eta', 'etd', 'status', 'mblNumber', 'totalRevenue', 'totalCost'].includes(field as string)) {
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
      
      const state = get();
      await DossierService.save(state.dossier);
      
      let newDossiers = [...state.dossiers];
      const index = newDossiers.findIndex(d => d.id === state.dossier.id);
      
      if (index >= 0) {
          newDossiers[index] = state.dossier;
      } else {
          newDossiers.unshift(state.dossier);
      }

      set({ dossiers: newDossiers, isLoading: false, isEditing: false });
      useToast.getState().toast("Shipment data saved securely.", "success");
  },

  deleteDossier: async (id) => {
      set({ dossiers: get().dossiers.filter(d => d.id !== id) });
      useToast.getState().toast("Shipment file archived.", "info");
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