import { 
    Dossier, ShipmentStage, 
    DossierAlert 
} from "@/types/index";

// --- MOCK DATA ---
const MOCK_DOSSIERS: Dossier[] = [
    {
        id: '1',
        ref: 'REF-2024-001',
        bookingRef: 'BK-998877',
        status: 'ON_WATER',
        stage: ShipmentStage.TRANSIT,
        clientId: 'c1',
        clientName: 'Acme Trading Co.',
        mblNumber: 'MAEU123456789',
        hblNumber: 'HBL001',
        carrier: 'Maersk',
        vesselName: 'Maersk Madrid',
        voyageNumber: '2405E',
        pol: 'Casablanca (MACAS)',
        pod: 'Rotterdam (NLRTM)',
        etd: new Date('2024-06-01'),
        eta: new Date('2024-06-15'),
        incoterm: 'CIF',
        mode: 'SEA_FCL',
        freeTimeDays: 14,
        shipper: { name: 'Atlas Exports SARL', role: 'Shipper', email: 'ops@atlas-exports.ma' },
        consignee: { name: 'Global Trade GmbH', role: 'Consignee', email: 'import@global-trade.de' },
        parties: [
            { id: 'p1', name: 'Transit Pro', role: 'Agent', email: 'agent@transitpro.com' }
        ],
        containers: [
            {
                id: 'cnt1',
                number: 'MSKU1234567',
                type: '40HC',
                seal: 'ML-889900',
                weight: 24000,
                packages: 1200,
                packageType: 'CARTONS',
                volume: 68.5,
                status: 'ON_WATER'
            }
        ],
        cargoItems: [ // New field required by UI
            {
                id: 'ci1',
                description: 'Textile Garments',
                packageCount: 1200,
                packageType: 'Cartons',
                weight: 24000,
                volume: 68.5
            }
        ],
        tasks: [
            {
                id: 't1',
                title: 'Send Arrival Notice',
                dueDate: '2024-06-12',
                assignee: 'Hamza',
                completed: false,
                isBlocker: false,
                category: 'Documents',
                priority: 'High'
            }
        ],
        events: [
            {
                id: 'e1',
                title: 'Vessel Departed',
                location: 'Casablanca',
                timestamp: '2024-06-01T10:00:00Z',
                source: 'Carrier'
            }
        ],
        activities: [],
        alerts: [],
        tags: ['Urgent', 'VIP'],
        totalRevenue: 3500,
        totalCost: 2800,
        currency: 'EUR',
        nextAction: 'Track Arrival'
    },
    {
        id: '2',
        ref: 'REF-2024-002',
        bookingRef: '',
        status: 'BOOKED',
        stage: ShipmentStage.BOOKING,
        clientId: 'c2',
        clientName: 'Maroc Fruits',
        mblNumber: '',
        hblNumber: '',
        carrier: 'CMA CGM',
        vesselName: 'CMA CGM Antoine',
        voyageNumber: 'TBD',
        pol: 'Agadir (MAAGA)',
        pod: 'Portsmouth (GBPTM)',
        etd: new Date('2024-06-20'),
        eta: new Date('2024-06-25'),
        incoterm: 'FOB',
        mode: 'SEA_FCL',
        freeTimeDays: 7,
        shipper: { name: 'Agri Souss', role: 'Shipper' },
        consignee: { name: 'UK Fresh Ltd', role: 'Consignee' },
        parties: [],
        containers: [],
        cargoItems: [], // Empty initially
        tasks: [],
        events: [],
        activities: [],
        alerts: [
            { id: 'a1', type: 'WARNING', message: 'Booking Confirmation Pending' }
        ],
        tags: [],
        totalRevenue: 1200,
        totalCost: 900,
        currency: 'GBP',
        nextAction: 'Confirm Booking'
    }
];

export const DossierService = {
    // --- READ ---
    fetchAll: async (): Promise<Dossier[]> => {
        // Simulate API delay
        return new Promise((resolve) => {
            setTimeout(() => resolve(MOCK_DOSSIERS), 500);
        });
    },

    fetchById: async (id: string): Promise<Dossier | undefined> => {
        return new Promise((resolve) => {
            const dossier = MOCK_DOSSIERS.find(d => d.id === id);
            setTimeout(() => resolve(dossier), 300);
        });
    },

    // --- WRITE ---
    save: async (dossier: Dossier): Promise<void> => {
        console.log('Saving Dossier to Backend:', dossier);
        return new Promise((resolve) => setTimeout(resolve, 600));
    },

    delete: async (id: string): Promise<void> => {
        console.log('Deleting Dossier:', id);
        return new Promise((resolve) => setTimeout(resolve, 300));
    },

    // --- LOGIC ---
    analyzeHealth: (dossier: Dossier): { alerts: DossierAlert[], nextAction: string } => {
        const alerts: DossierAlert[] = [];
        let nextAction = 'Monitor';

        // 1. Check Dates
        const today = new Date();
        if (dossier.etd && new Date(dossier.etd) < today && dossier.status === 'BOOKED') {
            alerts.push({ 
                id: 'al-1', 
                type: 'BLOCKER', 
                message: 'Shipment missed departure date.' 
            });
            nextAction = 'Re-book';
        }

        // 2. Check Missing Data
        if (!dossier.mblNumber && dossier.stage === ShipmentStage.TRANSIT) {
             alerts.push({
                 id: 'al-2',
                 type: 'WARNING',
                 message: 'Missing Master BL Number.'
             });
             nextAction = 'Update MBL';
        }

        // 3. New: Check Cargo Logic (now using cargoItems)
        const hasCargo = (dossier.cargoItems?.length ?? 0) > 0 || (dossier.containers?.length ?? 0) > 0;
        
        if (!hasCargo && dossier.stage !== ShipmentStage.INTAKE) {
            alerts.push({
                id: 'al-3',
                type: 'INFO',
                message: 'No cargo details added yet.'
            });
        }

        return { alerts, nextAction };
    }
};