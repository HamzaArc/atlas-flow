import { create } from 'zustand';
import { Dossier, DossierContainer, ShipmentStatus, ActivityCategory, ShipmentStage, DossierTask, Document } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";
import { DossierService } from '@/services/dossier.service';
import { generateUUID } from '@/lib/utils';

interface DossierState {
  dossiers: Dossier[];
  dossier: Dossier;
  isLoading: boolean;
  isEditing: boolean;
  error: string | null;

  fetchDossiers: () => Promise<void>;
  createDossier: () => void;
  loadDossier: (id: string) => Promise<void>;
  saveDossier: () => Promise<void>;
  deleteDossier: (id: string) => Promise<void>;
  
  // NEW: Duplicate Capability
  duplicateDossier: () => Promise<string | null>;
  
  setEditing: (isEditing: boolean) => void;
  updateDossier: <K extends keyof Dossier>(field: K, value: Dossier[K]) => void;
  updateParty: (party: 'shipper' | 'consignee' | 'notify', field: string, value: string) => void;
  setStatus: (status: ShipmentStatus) => void;
  setStage: (stage: ShipmentStage) => void;
  
  addContainer: (container?: DossierContainer) => void;
  updateContainer: <K extends keyof DossierContainer>(id: string, field: K, value: DossierContainer[K]) => void;
  removeContainer: (id: string) => void;

  addTask: (task: DossierTask) => void;
  toggleTask: (taskId: string) => void;

  addActivity: (text: string, category: ActivityCategory, tone?: 'success' | 'neutral' | 'warning' | 'destructive') => void;
  
  // Document Actions
  uploadFile: (file: File, type: string, isInternal: boolean, nameOverride?: string) => Promise<void>;
  updateFile: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;

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
          id: generateUUID(),
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

  // --- Document Actions ---
  
  uploadFile: async (file, type, isInternal, nameOverride) => {
      const { dossier } = get();
      if (!dossier.id || dossier.id.startsWith('new-')) {
          useToast.getState().toast("Please save the dossier before uploading documents.", "warning");
          return;
      }

      set({ isLoading: true });
      
      // If user provided a name in the form, create a renamed File object, otherwise use original
      const fileToUpload = nameOverride ? new File([file], nameOverride + '.' + file.name.split('.').pop(), { type: file.type }) : file;

      try {
          const newDoc = await DossierService.uploadDocument(dossier.id, fileToUpload, { type, isInternal });
          set(state => ({
              dossier: {
                  ...state.dossier,
                  documents: [newDoc, ...state.dossier.documents]
              },
              isLoading: false
          }));
          useToast.getState().toast("Document uploaded.", "success");
      } catch (e: any) {
          set({ isLoading: false });
          useToast.getState().toast("Upload failed: " + e.message, "error");
      }
  },

  updateFile: async (id, updates) => {
      set({ isLoading: true });
      try {
          const updatedDoc = await DossierService.updateDocument(id, updates);
          set(state => ({
              dossier: {
                  ...state.dossier,
                  documents: state.dossier.documents.map(d => d.id === id ? updatedDoc : d)
              },
              isLoading: false
          }));
          useToast.getState().toast("Document updated.", "success");
      } catch (e: any) {
          set({ isLoading: false });
          useToast.getState().toast("Update failed.", "error");
      }
  },

  deleteFile: async (id) => {
      set({ isLoading: true });
      try {
          await DossierService.deleteDocument(id);
          set(state => ({
              dossier: {
                  ...state.dossier,
                  documents: state.dossier.documents.filter(d => d.id !== id)
              },
              isLoading: false
          }));
          useToast.getState().toast("Document deleted.", "info");
      } catch (e: any) {
          set({ isLoading: false });
          useToast.getState().toast("Deletion failed.", "error");
      }
  },

  duplicateDossier: async () => {
      const { dossier } = get();
      if (!dossier) return null;

      set({ isLoading: true });
      try {
          // Create deep copy
          const newDossier: Dossier = JSON.parse(JSON.stringify(dossier));
          
          // Reset identifiers and status
          newDossier.id = generateUUID(); // Temporary ID until saved? Or utilize backend gen.
          newDossier.ref = `${dossier.ref}-COPY`;
          newDossier.bookingRef = '';
          newDossier.status = 'BOOKED';
          newDossier.stage = ShipmentStage.INTAKE;
          newDossier.createdDate = new Date().toISOString();
          
          // Reset operational data
          newDossier.mblNumber = '';
          newDossier.hblNumber = '';
          newDossier.activities = [{ 
              id: generateUUID(), 
              category: 'SYSTEM', 
              text: `Job duplicated from ${dossier.ref}`, 
              meta: 'System', 
              timestamp: new Date() 
          }];
          newDossier.documents = []; // Do not copy docs
          newDossier.events = [];
          
          // Reset Container Execution but keep structure if needed? 
          // Default decision: Clear containers for a clean slate on a new job
          newDossier.containers = []; 
          
          // Tasks: Reset completion
          newDossier.tasks = newDossier.tasks.map(t => ({
              ...t,
              id: generateUUID(),
              completed: false,
              assignee: null // Reset assignee
          }));

          // Save immediately to persist
          const savedDossier = await DossierService.save(newDossier);
          
          // Update state
          const { dossiers } = get();
          set({
              dossiers: [savedDossier, ...dossiers],
              dossier: savedDossier,
              isLoading: false,
              isEditing: false
          });

          useToast.getState().toast("Job duplicated successfully.", "success");
          return savedDossier.id;
      } catch (e: any) {
          console.error("Duplicate failed", e);
          set({ isLoading: false });
          useToast.getState().toast("Failed to duplicate job.", "error");
          return null;
      }
  },

  saveDossier: async () => {
      set({ isLoading: true });
      get().runSmartChecks(); 
      
      const { dossier, dossiers } = get();
      
      try {
          // If ID is 'new' or generated client-side temp, ensure service handles it
          const savedDossier = await DossierService.save(dossier);
          
          const index = dossiers.findIndex(d => d.id === dossier.id);
          let newDossiers = [...dossiers];
          
          if (index >= 0) {
              newDossiers[index] = savedDossier;
          } else {
              // Handle case where we were editing a "new-timestamp" ID that is now a real UUID from DB if needed
              // or simply if it wasn't in the list yet
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
              id: generateUUID(), 
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