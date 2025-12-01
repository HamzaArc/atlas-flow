import { create } from 'zustand';
import { Dossier, DossierContainer, ShipmentStatus, ActivityItem, ActivityCategory, DossierAlert } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";
import { differenceInDays } from 'date-fns';

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
  addActivity: (text: string, category: ActivityCategory, tone?: 'success' | 'neutral' | 'warning' | 'destructive') => void;
  
  // Internal Logic
  runSmartChecks: () => void;
}

// --- MOCK DATA GENERATOR ---
const generateMockDossiers = (): Dossier[] => [
    {
        id: '1', ref: 'IMP-24-0056', bookingRef: 'BK-998877', status: 'ON_WATER', clientId: 'cli_1', clientName: 'TexNord SARL',
        mblNumber: 'MAEU123456789', hblNumber: 'ATL-IMP-0056', carrier: 'Maersk Line',
        vesselName: 'CMA CGM JULES VERNE', voyageNumber: '0ME2QE1MA',
        pol: 'SHANGHAI (CN)', pod: 'CASABLANCA (MAP)', etd: new Date('2024-11-20'), eta: new Date('2024-12-05'),
        incoterm: 'FOB', mode: 'SEA_FCL', freeTimeDays: 7,
        shipper: { name: 'Shanghai Textiles Ltd' }, consignee: { name: 'TexNord SARL' },
        containers: [{ id: 'c1', number: 'MSKU9012345', type: '40HC', seal: '123456', weight: 12500, packages: 500, packageType: 'CARTONS', volume: 65, status: 'ON_WATER' }],
        activities: [], totalRevenue: 45000, totalCost: 32000, currency: 'MAD',
        alerts: [], nextAction: 'Track Vessel Arrival'
    },
    {
        id: '2', ref: 'EXP-24-0102', bookingRef: 'CMA-112233', status: 'BOOKED', clientId: 'cli_2', clientName: 'AgriSouss',
        mblNumber: '', hblNumber: 'ATL-EXP-0102', carrier: 'CMA CGM',
        vesselName: 'TANGER EXPRESS', voyageNumber: 'TGX99',
        pol: 'AGADIR (MAP)', pod: 'ROTTERDAM (NL)', etd: new Date('2024-12-10'), eta: new Date('2024-12-16'),
        incoterm: 'CIF', mode: 'SEA_FCL', freeTimeDays: 5,
        shipper: { name: 'AgriSouss' }, consignee: { name: 'Fresh Market BV' },
        containers: [], activities: [], totalRevenue: 28000, totalCost: 21000, currency: 'EUR',
        alerts: [], nextAction: 'Collect Containers'
    }
];

const DEFAULT_DOSSIER: Dossier = {
    id: 'new', ref: 'NEW-FILE', bookingRef: '', status: 'BOOKED', clientId: '', clientName: '',
    mblNumber: '', hblNumber: '', carrier: '', vesselName: '', voyageNumber: '',
    pol: '', pod: '', etd: new Date(), eta: new Date(),
    incoterm: 'FOB', mode: 'SEA_FCL', freeTimeDays: 7,
    shipper: { name: '' }, consignee: { name: '' },
    containers: [], activities: [], totalRevenue: 0, totalCost: 0, currency: 'MAD',
    alerts: [], nextAction: 'Initialize Booking'
};

export const useDossierStore = create<DossierState>((set, get) => ({
  dossiers: [],
  dossier: DEFAULT_DOSSIER,
  isLoading: false,
  isEditing: false,

  fetchDossiers: async () => {
      set({ isLoading: true });
      setTimeout(() => {
          set({ dossiers: generateMockDossiers(), isLoading: false });
          get().runSmartChecks(); // Initial Check
      }, 500);
  },

  createDossier: () => {
      set({ dossier: { ...DEFAULT_DOSSIER, id: `new-${Date.now()}` }, isEditing: true });
  },

  loadDossier: (id) => {
      const found = get().dossiers.find(d => d.id === id);
      if (found) {
          set({ dossier: JSON.parse(JSON.stringify(found)), isEditing: false });
          get().runSmartChecks();
      }
  },

  setEditing: (isEditing) => set({ isEditing }),

  updateDossier: (field, value) => {
      set((state) => ({
          dossier: { ...state.dossier, [field]: value }
      }));
      // Auto-run checks on critical field updates
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
      get().runSmartChecks(); // Final check before save
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
          useToast.getState().toast("Shipment data saved securely.", "success");
      }, 800);
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

  // --- THE EXPERT LOGIC ENGINE ---
  runSmartChecks: () => {
      const d = get().dossier;
      const alerts: DossierAlert[] = [];
      let nextAction = "Monitor Status";

      // 1. FINANCIAL CHECK (Margin Integrity)
      const margin = d.totalRevenue - d.totalCost;
      const marginPercent = d.totalRevenue > 0 ? (margin / d.totalRevenue) : 0;
      
      if (marginPercent < 0.10 && d.totalRevenue > 0) {
          alerts.push({
              id: 'fin-1', type: 'WARNING', 
              message: `Low Margin Warning (${(marginPercent*100).toFixed(1)}%)`,
              actionRequired: 'Review costs or request manager approval'
          });
      }
      if (margin < 0) {
          alerts.push({
              id: 'fin-2', type: 'BLOCKER',
              message: 'Negative Profit Detected',
              actionRequired: 'Hold release until costs verified'
          });
      }

      // 2. DOCUMENTATION & COMPLIANCE
      if (d.status === 'ON_WATER' && !d.mblNumber) {
          alerts.push({
              id: 'doc-1', type: 'BLOCKER',
              message: 'Missing Master Bill of Lading (MBL)',
              actionRequired: 'Enter MBL to enable tracking'
          });
          nextAction = "Update MBL Number";
      }

      // 3. OPERATIONAL DEADLINES (Demurrage Risk)
      const today = new Date();
      if (d.status === 'AT_POD') {
          const etaDate = new Date(d.eta);
          const daysAtPort = differenceInDays(today, etaDate);
          const daysLeft = d.freeTimeDays - daysAtPort;

          if (daysLeft < 0) {
              alerts.push({
                  id: 'ops-1', type: 'BLOCKER',
                  message: `DEMURRAGE ALERT: ${Math.abs(daysLeft)} Days Overdue`,
                  actionRequired: 'Urgent: Clear Customs & Return Empty'
              });
              nextAction = "Expedite Clearance";
          } else if (daysLeft <= 2) {
              alerts.push({
                  id: 'ops-2', type: 'WARNING',
                  message: `Free Time Critical: ${daysLeft} Days Left`,
                  actionRequired: 'Prioritize delivery'
              });
              nextAction = "Schedule Haulage";
          }
      }

      // 4. NEXT BEST ACTION DERIVATION
      if (d.status === 'BOOKED') nextAction = "Confirm Departure (ETD)";
      else if (d.status === 'ON_WATER' && alerts.length === 0) nextAction = "Pre-Alert & Invoicing";
      else if (d.status === 'CUSTOMS') nextAction = "Monitor DUM Status";

      set((state) => ({
          dossier: { ...state.dossier, alerts, nextAction }
      }));
  }
}));