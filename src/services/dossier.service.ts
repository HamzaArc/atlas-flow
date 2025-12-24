import { Dossier, DossierAlert } from '@/types/index';
import { differenceInDays } from 'date-fns';

// --- MOCK DATA (Moved from Store) ---
const MOCK_DOSSIERS: Dossier[] = [
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

export const DossierService = {
    fetchAll: async (): Promise<Dossier[]> => {
        // Simulate API latency
        return new Promise((resolve) => {
            setTimeout(() => resolve([...MOCK_DOSSIERS]), 500);
        });
    },

    save: async (dossier: Dossier): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Log to console to satisfy "unused variable" linter check
                console.log("Saving dossier mock:", dossier.ref);
                resolve();
            }, 800);
        });
    },

    /**
     * The "Expert Logic Engine" - Pure Function
     * Analyzes a dossier and returns Alerts and Next Actions
     */
    analyzeHealth: (d: Dossier): { alerts: DossierAlert[], nextAction: string } => {
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

        return { alerts, nextAction };
    }
};