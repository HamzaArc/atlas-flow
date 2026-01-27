import { create } from 'zustand';
import { Dossier, DossierContainer, ShipmentStatus, ActivityCategory, ShipmentStage, DossierTask, Document, Quote, ChargeLine } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";
import { DossierService } from '@/services/dossier.service';
import { generateUUID } from '@/lib/utils';
import { useFinanceStore } from './useFinanceStore';
import { addDays } from 'date-fns';

interface DossierState {
  dossiers: Dossier[];
  dossier: Dossier;
  isLoading: boolean;
  isEditing: boolean;
  error: string | null;
  pendingFinanceLines: Partial<ChargeLine>[];

  fetchDossiers: () => Promise<void>;
  createDossier: () => void;
  initializeFromQuote: (quote: Quote) => void;
  loadDossier: (id: string) => Promise<void>;
  saveDossier: () => Promise<void>;
  deleteDossier: (id: string) => Promise<void>;
  duplicateDossier: () => void;
  cancelDossier: () => Promise<void>;
  
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
  pendingFinanceLines: [],

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
          error: null,
          pendingFinanceLines: []
      });
  },

  initializeFromQuote: (quote: Quote) => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const newRef = `BKG-${year}-${random}`;
    
    // Determine active option
    const activeOption = quote.options.find(o => o.id === quote.activeOptionId) || quote.options[0];
    if (!activeOption) {
        useToast.getState().toast("Error: Quote has no options to convert.", "error");
        return;
    }

    // Prepare Date Logic
    const etd = quote.requestedDepartureDate 
        ? new Date(quote.requestedDepartureDate) 
        : (quote.cargoReadyDate ? new Date(quote.cargoReadyDate) : new Date());
    
    const eta = activeOption.transitTime 
        ? addDays(etd, activeOption.transitTime)
        : addDays(etd, 14);

    // Map Containers
    const containers: DossierContainer[] = activeOption.equipmentList.map(eq => ({
        id: generateUUID(),
        number: '',
        type: eq.type as any || '40HC',
        seal: '',
        weight: 0,
        packages: 0,
        packageType: 'PALLETS',
        volume: 0,
        status: 'GATE_IN',
        pickupDate: undefined,
        returnDate: undefined
    }));

    // Map Financial Lines (Expenses and Income)
    const financeLines: Partial<ChargeLine>[] = [];
    
    activeOption.items.forEach(item => {
        // Create Expense (Payable) - Buy Price
        if (item.buyPrice > 0) {
            financeLines.push({
                type: 'EXPENSE',
                code: 'FREIGHT_COST', // Generic code, could be improved with mapping
                description: `[Cost] ${item.description}`,
                amount: item.buyPrice,
                currency: item.buyCurrency || item.buyCurrency,
                vatRule: item.vatRule,
                status: 'ESTIMATED',
                vendorName: item.vendorName,
                isBillable: true
            });
        }

        // Create Income (Receivable) - Sell Price
        if (item.sellPrice > 0) {
            financeLines.push({
                type: 'INCOME',
                code: 'FREIGHT_REV',
                description: item.description,
                amount: item.sellPrice,
                currency: activeOption.quoteCurrency,
                vatRule: item.vatRule,
                status: 'ESTIMATED',
                isBillable: true
            });
        }
    });

    const newDossier: Dossier = {
        ...DEFAULT_DOSSIER,
        id: `new-quote-${quote.id}`,
        ref: newRef,
        customerReference: quote.reference,
        clientId: quote.clientId,
        clientName: quote.clientName,
        quoteId: quote.id,
        
        mode: activeOption.mode || quote.mode || 'SEA_FCL',
        incoterm: activeOption.incoterm || quote.incoterm || 'FOB',
        pol: activeOption.pol || quote.pol || '',
        pod: activeOption.pod || quote.pod || '',
        
        incotermPlace: activeOption.placeOfDelivery || activeOption.placeOfLoading || '',
        
        etd: etd,
        eta: eta,
        transitTime: activeOption.transitTime || 0,
        freeTimeDays: activeOption.freeTime || 7,

        // Parties Mapping
        shipper: { 
            name: quote.clientName, // Default to client as shipper if not specified
            role: 'Shipper',
            address: activeOption.placeOfLoading || ''
        },
        consignee: {
            name: 'To Order', // Placeholder
            role: 'Consignee',
            address: activeOption.placeOfDelivery || ''
        },
        
        // Goods
        containers: containers,
        cargoItems: quote.cargoRows ? quote.cargoRows.map(r => ({
             id: generateUUID(),
             description: quote.goodsDescription || 'General Cargo',
             packageCount: r.count || 0,
             packageType: quote.packagingType || 'PALLETS',
             weight: r.weight || quote.totalWeight || 0,
             volume: r.volume || quote.totalVolume || 0
        })) : [],

        createdDate: new Date().toISOString(),
        status: 'BOOKED',
        stage: ShipmentStage.INTAKE
    };

    set({
        dossier: newDossier,
        isEditing: true,
        pendingFinanceLines: financeLines,
        error: null
    });

    useToast.getState().toast("Booking initialized from quote details.", "success");
    // Activity Log
    get().addActivity(`Booking initialized from Quote ${quote.reference}`, 'SYSTEM', 'neutral');
  },

  duplicateDossier: () => {
      const current = get().dossier;
      const newRef = `${current.ref}-COPY`;
      
      const duplicated: Dossier = {
          ...current,
          id: `new-${Date.now()}`,
          ref: newRef,
          bookingRef: '',
          status: 'BOOKED',
          stage: ShipmentStage.INTAKE,
          mblNumber: '',
          hblNumber: '',
          documents: [],
          activities: [],
          tasks: [],
          events: [],
          alerts: [],
          createdDate: new Date().toISOString(),
      };
      
      set({ dossier: duplicated, isEditing: true });
      get().addActivity(`Duplicated from job ${current.ref}`, 'SYSTEM', 'neutral');
      useToast.getState().toast("Job duplicated. Please review and save.", "success");
  },

  cancelDossier: async () => {
      set({ isLoading: true });
      try {
          set(state => ({
              dossier: { ...state.dossier, status: 'CANCELLED' }
          }));
          get().addActivity('Job marked as CANCELLED by user', 'SYSTEM', 'destructive');
          await get().saveDossier();
          useToast.getState().toast("Job has been cancelled.", "info");
      } catch (e) {
          useToast.getState().toast("Failed to cancel job.", "error");
          set({ isLoading: false });
      }
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
              
              set({ dossier: safeCopy, isEditing: false, isLoading: false, pendingFinanceLines: [] });
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
      // Logic to auto-map stage to status for better UX
      let newStatus: ShipmentStatus = get().dossier.status;
      
      switch (stage) {
          case ShipmentStage.INTAKE:
          case ShipmentStage.BOOKING:
              newStatus = 'BOOKED';
              break;
          case ShipmentStage.ORIGIN:
              newStatus = 'AT_POL';
              break;
          case ShipmentStage.TRANSIT:
              newStatus = 'ON_WATER';
              break;
          case ShipmentStage.DELIVERY:
              newStatus = 'AT_POD'; // Or DELIVERED depending on POD date
              break;
          case ShipmentStage.FINANCE:
              newStatus = 'DELIVERED';
              break;
          case ShipmentStage.CLOSED:
              newStatus = 'COMPLETED';
              break;
      }

      set((state) => ({
          dossier: { ...state.dossier, stage, status: newStatus }
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

  saveDossier: async () => {
      set({ isLoading: true });
      get().runSmartChecks(); 
      
      const { dossier, dossiers, pendingFinanceLines } = get();
      
      try {
          const savedDossier = await DossierService.save(dossier);
          
          // --- Process Pending Finance Lines ---
          if (pendingFinanceLines && pendingFinanceLines.length > 0) {
              const financeStore = useFinanceStore.getState();
              // Process sequentially to ensure order or reduce race conditions
              for (const line of pendingFinanceLines) {
                  await financeStore.addCharge({
                      ...line,
                      dossierId: savedDossier.id
                  });
              }
              // Clear pending lines after successful add
              set({ pendingFinanceLines: [] });
          }

          const index = dossiers.findIndex(d => d.id === dossier.id);
          let newDossiers = [...dossiers];
          
          if (index >= 0) {
              newDossiers[index] = savedDossier;
          } else {
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