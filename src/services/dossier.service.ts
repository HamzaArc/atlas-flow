// src/services/dossier.service.ts

import { Dossier, DossierAlert, ShipmentStage } from '@/types/index';

const MOCK_DOSSIERS: Dossier[] = [
    {
        id: '1', ref: 'IMP-24-001', bookingRef: 'HLCU-123456', status: 'ON_WATER', stage: ShipmentStage.TRANSIT, clientId: 'c1', clientName: 'AutoParts Maroc', mblNumber: 'MAEU123456789', hblNumber: 'HBL001', carrier: 'Maersk', vesselName: 'MERETE MAERSK', voyageNumber: '402E', pol: 'Shanghai, CN', pod: 'Casablanca, MA', etd: new Date('2024-02-01'), eta: new Date('2024-03-15'), incoterm: 'FOB', mode: 'SEA_FCL', freeTimeDays: 14,
        shipper: { name: 'Shanghai Parts Co.', role: 'Shipper' },
        consignee: { name: 'AutoParts Maroc', role: 'Consignee' },
        parties: [], containers: [{ id: 'c1', number: 'MSKU1234567', type: '40HC', seal: 'ML-888', weight: 12500, packages: 20, packageType: 'PALLETS', volume: 65, status: 'ON_WATER' }],
        cargoItems: [], // New
        documents: [], // Fixed: Added missing property
        activities: [], alerts: [], tasks: [], events: [], tags: ['Priority'], nextAction: 'Track Vessel', totalRevenue: 45000, totalCost: 32000, currency: 'MAD'
    },
    {
        id: '2', ref: 'EXP-24-045', bookingRef: 'CMA-987654', status: 'BOOKED', stage: ShipmentStage.BOOKING, clientId: 'c2', clientName: 'Textile Export Ltd', mblNumber: '', hblNumber: '', carrier: 'CMA CGM', vesselName: 'TBA', voyageNumber: '', pol: 'Tangier Med, MA', pod: 'Le Havre, FR', etd: new Date('2024-03-20'), eta: new Date('2024-03-25'), incoterm: 'DAP', mode: 'SEA_FCL', freeTimeDays: 7,
        shipper: { name: 'Textile Export Ltd', role: 'Shipper' },
        consignee: { name: 'Fashion France SA', role: 'Consignee' },
        parties: [], containers: [], 
        cargoItems: [], // New
        documents: [], // Fixed: Added missing property
        activities: [], alerts: [], tasks: [], events: [], tags: [], nextAction: 'Confirm Booking', totalRevenue: 1250, totalCost: 850, currency: 'EUR'
    }
];

export const DossierService = {
    fetchAll: async (): Promise<Dossier[]> => {
        // Simulating API latency
        return new Promise(resolve => setTimeout(() => resolve(MOCK_DOSSIERS), 800));
    },

    save: async (dossier: Dossier): Promise<Dossier> => {
        return new Promise(resolve => setTimeout(() => resolve(dossier), 500));
    },

    analyzeHealth: (dossier: Dossier): { alerts: DossierAlert[], nextAction: string } => {
        const alerts: DossierAlert[] = [];
        let nextAction = 'Monitor Shipment';

        // Example Logic
        const today = new Date();
        const daysToEta = Math.ceil((new Date(dossier.eta).getTime() - today.getTime()) / (1000 * 3600 * 24));

        if (dossier.status === 'ON_WATER' && daysToEta < 2) {
            nextAction = 'Prepare Arrival Notice';
            alerts.push({ id: 'a1', type: 'INFO', message: 'Vessel arriving in < 48 hours.' });
        }

        if (dossier.status === 'BOOKED' && !dossier.mblNumber) {
            nextAction = 'Request MBL';
            alerts.push({ id: 'a2', type: 'WARNING', message: 'Booking confirmed but MBL missing.' });
        }

        if (dossier.totalRevenue < dossier.totalCost) {
            alerts.push({ id: 'a3', type: 'BLOCKER', message: 'Negative margin detected.' });
        }

        return { alerts, nextAction };
    }
};