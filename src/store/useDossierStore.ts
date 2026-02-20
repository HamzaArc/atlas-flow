// src/store/useDossierStore.ts
import { create } from 'zustand';
import { Dossier, DossierContainer, ShipmentStatus, ActivityCategory, DossierTask, Document, Quote, ChargeLine, CargoItem } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";
import { DossierService, FetchDossiersParams } from '@/services/dossier.service';
import { generateUUID } from '@/lib/utils';
import { useFinanceStore } from './useFinanceStore';
import { addDays } from 'date-fns';

export interface ExceptionDetail {
    id: string;
    ref: string;
    reason: string;
}

export interface DossierDashboardStats {
    total: number;
    bookings: number;
    inTransit: number;
    exceptions: number;
    exceptionDetails: ExceptionDetail[];
    sea: number;
    air: number;
    road: number;
}

interface DossierState {
  dossiers: Dossier[];
  totalRecords: number;
  dashboardStats: DossierDashboardStats;
  dossier: Dossier;
  isLoading: boolean;
  isEditing: boolean;
  error: string | null;
  pendingFinanceLines: Partial<ChargeLine>[];

  fetchDossiers: () => Promise<void>; 
  fetchPaginatedDossiers: (params: FetchDossiersParams) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;

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
  setStage: (stage: string) => void;
  
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
    stage: 'Intake',
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
    nextAction: 'Initialize Booking',
    
    chargeableWeight: 0,
    flightNumber: '',
    truckPlate: '',
    trailerPlate: '',
    carnetTir: false
};

export const useDossierStore = create<DossierState>((set, get) => ({
  dossiers: [],
  totalRecords: 0,
  dashboardStats: {
      total: 0, bookings: 0, inTransit: 0, exceptions: 0, exceptionDetails: [], sea: 0, air: 0, road: 0
  },
  dossier: DEFAULT_DOSSIER,
  isLoading: false,
  isEditing: false,
  error: null,
  pendingFinanceLines: [],

  fetchDossiers: async () => {
      set({ isLoading: true, error: null });
      try {
          const dossiers = await DossierService.fetchAll();
          set({ dossiers, totalRecords: dossiers.length, isLoading: false });
      } catch (e: any) {
          console.error("Failed to fetch dossiers", e);
          set({ isLoading: false, error: e.message || 'Failed to fetch dossiers' });
          useToast.getState().toast("Connection Error: Could not retrieve shipments.", "error");
      }
  },

  fetchPaginatedDossiers: async (params: FetchDossiersParams) => {
      set({ isLoading: true, error: null });
      try {
          const { data, count } = await DossierService.fetchPaginated(params);
          set({ dossiers: data, totalRecords: count, isLoading: false });
      } catch (e: any) {
          console.error("Failed to fetch paginated dossiers", e);
          set({ isLoading: false, error: e.message });
      }
  },

  fetchDashboardStats: async () => {
      try {
          const raw = await DossierService.fetchStats();
          let bookings = 0, inTransit = 0, exceptions = 0;
          let sea = 0, air = 0, road = 0;
          const exceptionDetails: ExceptionDetail[] = [];

          raw.forEach((r: any) => {
              if (r.stage === 'Booking') bookings++;
              if (r.stage === 'Transit' || r.stage === 'Origin') inTransit++;
              
              if (r.mode?.includes('SEA')) sea++;
              if (r.mode?.includes('AIR')) air++;
              if (r.mode?.includes('ROAD')) road++;
              
              if (r.eta) {
                  const daysToEta = Math.ceil((new Date(r.eta).getTime() - Date.now()) / (1000 * 3600 * 24));
                  if (r.status === 'ON_WATER' && daysToEta < 2) {
                      exceptions++;
                      let reasonText = '';
                      if (daysToEta < 0) reasonText = `Overdue by ${Math.abs(daysToEta)} days`;
                      else if (daysToEta === 0) reasonText = `Arriving today`;
                      else reasonText = `Arriving in ${daysToEta} day(s)`;

                      exceptionDetails.push({
                          id: r.id,
                          ref: r.ref,
                          reason: reasonText
                      });
                  }
              }
          });

          set({
              dashboardStats: {
                  total: raw.length,
                  bookings,
                  inTransit,
                  exceptions,
                  exceptionDetails,
                  sea, air, road
              }
          });
      } catch (e) {
          console.error("Error fetching dashboard stats", e);
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
    
    const activeOption = quote.options.find(o => o.id === quote.activeOptionId) || quote.options[0];
    if (!activeOption) {
        useToast.getState().toast("Error: Quote has no options to convert.", "error");
        return;
    }

    const etd = quote.requestedDepartureDate 
        ? new Date(quote.requestedDepartureDate) 
        : (quote.cargoReadyDate ? new Date(quote.cargoReadyDate) : new Date());
    
    const eta = activeOption.transitTime 
        ? addDays(etd, activeOption.transitTime)
        : addDays(etd, 14);

    const containers: DossierContainer[] = [];
    
    if (activeOption.equipmentList && activeOption.equipmentList.length > 0) {
        activeOption.equipmentList.forEach(eq => {
            const count = eq.count || 1;
            for (let i = 0; i < count; i++) {
                containers.push({
                    id: generateUUID(),
                    number: '', 
                    type: (eq.type as any) || '40HC',
                    seal: '',
                    weight: 0,
                    packages: 0,
                    packageType: quote.packagingType || 'PALLETS',
                    volume: 0,
                    status: 'GATE_IN',
                    pickupDate: undefined,
                    returnDate: undefined
                });
            }
        });
    } else if (activeOption.containerCount > 0) {
        for (let i = 0; i < activeOption.containerCount; i++) {
            containers.push({
                id: generateUUID(),
                number: '',
                type: (activeOption.equipmentType as any) || '40HC',
                seal: '',
                weight: 0,
                packages: 0,
                packageType: quote.packagingType || 'PALLETS',
                volume: 0,
                status: 'GATE_IN'
            });
        }
    }

    let cargoItems: CargoItem[] = [];

    if (quote.cargoRows && quote.cargoRows.length > 0) {
        cargoItems = quote.cargoRows.map(r => {
            let dimensions = '';
            if (r.length && r.width && r.height) {
                dimensions = `${r.length}x${r.width}x${r.height}`;
            }

            let rowVolume = Number(r.volume || 0);
            if (!rowVolume && r.length && r.width && r.height) {
                const singlePieceVol = (Number(r.length) * Number(r.width) * Number(r.height)) / 1000000;
                const count = Number(r.count || r.quantity || r.pieces || 1);
                rowVolume = singlePieceVol * count;
            }
            
            const count = Number(r.count || r.quantity || r.pieces || r.pkgCount || 0);
            const type = r.packageType || r.pkgType || r.type || quote.packagingType || 'PALLETS';

            return {
                id: generateUUID(),
                description: r.description || quote.goodsDescription || 'General Cargo',
                packageCount: count,
                packageType: type,
                weight: Number(r.weight || r.grossWeight || 0),
                volume: Number(rowVolume.toFixed(3)),
                dimensions: dimensions || undefined
            };
        });
    } else {
        if (quote.totalWeight || quote.totalVolume) {
            cargoItems.push({
                id: generateUUID(),
                description: quote.goodsDescription || 'General Cargo',
                packageCount: 1, 
                packageType: quote.packagingType || 'PALLETS',
                weight: quote.totalWeight || 0,
                volume: quote.totalVolume || 0,
                dimensions: undefined
            });
        }
    }

    const financeLines: Partial<ChargeLine>[] = [];
    
    activeOption.items.forEach(item => {
        if (item.buyPrice > 0) {
            financeLines.push({
                type: 'EXPENSE',
                code: 'FREIGHT_COST',
                description: `[Cost] ${item.description}`,
                amount: item.buyPrice,
                currency: item.buyCurrency || item.buyCurrency,
                vatRule: item.vatRule,
                status: 'ESTIMATED',
                vendorName: item.vendorName,
                isBillable: true
            });
        }

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
        
        incotermPlace: activeOption.placeOfDelivery || activeOption.placeOfLoading || quote.pol || '',
        
        etd: etd,
        eta: eta,
        transitTime: activeOption.transitTime || 0,
        freeTimeDays: activeOption.freeTime || 7,

        shipper: { 
            name: quote.clientName, 
            role: 'Shipper',
            address: activeOption.placeOfLoading || ''
        },
        consignee: {
            name: 'To Order', 
            role: 'Consignee',
            address: activeOption.placeOfDelivery || ''
        },
        
        containers: containers,
        cargoItems: cargoItems,
        
        chargeableWeight: quote.chargeableWeight || 0,

        createdDate: new Date().toISOString(),
        status: 'BOOKED',
        stage: 'Intake'
    };

    set({
        dossier: newDossier,
        isEditing: true,
        pendingFinanceLines: financeLines,
        error: null
    });

    useToast.getState().toast("Booking initialized successfully from Quote.", "success");
    get().addActivity(`Booking initialized from Quote ${quote.reference} (v${quote.version})`, 'SYSTEM', 'neutral');
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
          stage: 'Intake',
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
      let newStatus: ShipmentStatus = get().dossier.status;
      const s = stage;
      
      if (['Intake', 'Booking', 'Order', 'Cargo Pickup', 'Container Pickup'].includes(s)) {
          newStatus = 'BOOKED';
      }
      else if (['Gate In', 'Warehouse Drop', 'Loading', 'Export Customs'].includes(s)) {
          newStatus = 'AT_POL';
      }
      else if (['On Water', 'Departed', 'Crossing'].includes(s)) {
          newStatus = 'ON_WATER';
      }
      else if (['Arrival (POD)', 'Arrived', 'Import Customs'].includes(s)) {
          newStatus = 'AT_POD';
      }
      else if (['Customs', 'Delivery'].includes(s)) {
          newStatus = 'DELIVERED';
      }
      else if (['Finance', 'Closed'].includes(s)) {
          newStatus = 'COMPLETED';
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
      
      const { dossier, pendingFinanceLines } = get();
      
      try {
          const savedDossier = await DossierService.save(dossier);
          
          if (pendingFinanceLines && pendingFinanceLines.length > 0) {
              const financeStore = useFinanceStore.getState();
              for (const line of pendingFinanceLines) {
                  await financeStore.addCharge({
                      ...line,
                      dossierId: savedDossier.id
                  });
              }
              set({ pendingFinanceLines: [] });
          }

          get().fetchDashboardStats(); // Refresh stats after saving

          set({ 
              dossier: savedDossier, 
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
          get().fetchDashboardStats(); // Sync stats
          set((_state) => ({ 
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