import { Dossier, ShipmentStatus, ShipmentStage } from "@/types/index";

// --- MOCK DATABASE ---
const MOCK_DOSSIERS: Dossier[] = [
  {
    id: "dos-1001",
    ref: "REF-2024-889",
    bookingRef: "CMA-AE-99821",
    status: "ON_WATER" as ShipmentStatus,
    stage: ShipmentStage.TRANSIT,
    clientId: "cli-1",
    clientName: "Atlas Textiles SARL",
    mblNumber: "CMAU123456789",
    hblNumber: "ATL-24-892",
    carrier: "CMA CGM",
    vesselName: "CMA CGM MAGELLAN",
    voyageNumber: "0FL3QE1MA",
    pol: "Tanger Med",
    pod: "Hamburg",
    etd: new Date("2024-03-10"),
    eta: new Date("2024-03-18"),
    incoterm: "FOB",
    mode: "SEA_FCL",
    freeTimeDays: 7,
    // FIX: Added 'role' to satisfy ShipmentParty interface
    shipper: { name: "Morocco Garments Co.", address: "Zone Franche, Tanger", role: 'Shipper' },
    consignee: { name: "German Fashion GmbH", address: "HafenCity, Hamburg", role: 'Consignee' },
    parties: [
       { id: 'p1', role: 'Notify', name: 'Hamburg Logistics Agent', email: 'ops@hla.de' },
       { id: 'p2', role: 'Agent', name: 'Clearance Masters', email: 'declarant@customs.ma' }
    ],
    containers: [
      { 
         id: "cnt-1", number: "CMAU9988771", type: "40HC", seal: "SL-991", 
         weight: 12500, packages: 450, packageType: "CARTONS", volume: 68, status: "ON_WATER" 
      },
      { 
         id: "cnt-2", number: "CMAU9988772", type: "40HC", seal: "SL-992", 
         weight: 12100, packages: 420, packageType: "CARTONS", volume: 68, status: "ON_WATER" 
      }
    ],
    tasks: [
      { id: "t1", title: "Verify Bill of Lading", category: "Documents", priority: "High", completed: true, dueDate: "2024-03-11", assignee: "KA", isBlocker: false },
      { id: "t2", title: "Send Arrival Notice", category: "General", priority: "Medium", completed: false, dueDate: "2024-03-16", assignee: "KA", isBlocker: false },
      { id: "t3", title: "Customs Clearance", category: "Customs", priority: "High", completed: false, dueDate: "2024-03-17", assignee: "Broker", isBlocker: true }
    ],
    events: [
      { id: "e1", title: "Shipment Created", timestamp: "2024-03-01T09:00:00Z", source: "System" },
      { id: "e2", title: "Booking Confirmed", timestamp: "2024-03-02T14:30:00Z", source: "Carrier" },
      { id: "e3", title: "Empty Container Picked Up", timestamp: "2024-03-05T08:15:00Z", location: "Tanger Med Depot", source: "Manual" },
      { id: "e4", title: "Gate In Full", timestamp: "2024-03-08T11:20:00Z", location: "Tanger Med Terminal", source: "System" },
      { id: "e5", title: "Vessel Departure", timestamp: "2024-03-10T23:45:00Z", location: "Tanger Med", source: "Carrier" },
    ],
    // FIX: Removed 'revenue' and 'costs' arrays because 'revenue' in Dossier interface is a number.
    // The financial details are likely handled by a separate FinanceService or different property.
    activities: [
       { id: "a1", category: "SYSTEM", text: "Shipment moved to TRANSIT stage", timestamp: new Date("2024-03-10T10:00:00Z"), meta: "System" },
       { id: "a2", category: "EMAIL", text: "Sent booking confirmation to client", timestamp: new Date("2024-03-02T15:00:00Z"), meta: "Karim Alami" }
    ],
    tags: ["VIP Client", "Textile"],
    totalRevenue: 14220,
    totalCost: 9547.5,
    currency: "MAD",
    alerts: [],
    nextAction: "Track Arrival"
  },
  {
    id: "dos-1002",
    ref: "REF-2024-890",
    bookingRef: "AF-KLM-882",
    status: "BOOKED" as ShipmentStatus,
    stage: ShipmentStage.BOOKING,
    clientId: "cli-2",
    clientName: "TechParts Maroc",
    mblNumber: "057-22991188",
    hblNumber: "ATL-AIR-204",
    carrier: "Air France",
    vesselName: "AF1288",
    voyageNumber: "N/A",
    pol: "Paris CDG",
    pod: "Casablanca CMN",
    etd: new Date("2024-03-20"),
    eta: new Date("2024-03-20"),
    incoterm: "EXW",
    mode: "AIR",
    freeTimeDays: 2,
    // FIX: Added role
    shipper: { name: "Tech Components SA", address: "Roissy, France", role: 'Shipper' },
    consignee: { name: "TechParts Maroc", address: "Sidi Maarouf, Casablanca", role: 'Consignee' },
    parties: [],
    containers: [],
    tasks: [
       { id: "t4", title: "Arrange Pickup at EXW", category: "Transport", priority: "High", completed: false, dueDate: "2024-03-18", assignee: "KA", isBlocker: true }
    ],
    events: [],
    activities: [],
    tags: ["Urgent", "AOG"],
    totalRevenue: 0,
    totalCost: 0,
    currency: "MAD",
    alerts: [],
    nextAction: "Confirm Pickup"
  }
];

export const DossierService = {
  // Simulate API Delay
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  async fetchAll(): Promise<Dossier[]> {
    await this.delay(600);
    return MOCK_DOSSIERS;
  },

  async fetchById(id: string): Promise<Dossier | undefined> {
    await this.delay(400);
    if (id === 'new') return undefined;
    
    const found = MOCK_DOSSIERS.find(d => d.id === id);
    if (found) return found;

    // Fallback: Return the main demo dossier if ID not found (for smooth dev experience)
    return { ...MOCK_DOSSIERS[0], id };
  },

  async save(dossier: Dossier): Promise<Dossier> {
    await this.delay(800);
    console.log("Saved Dossier:", dossier);
    return dossier;
  },

  analyzeHealth(dossier: Dossier) {
     const alerts: any[] = [];
     
     // 1. Check Margin
     const revenue = dossier.totalRevenue || 0;
     const cost = dossier.totalCost || 0;
     if (revenue > 0 && (revenue - cost) / revenue < 0.1) {
        alerts.push({ id: 'al-1', type: 'WARNING', message: 'Low profit margin (<10%)' });
     }

     // 2. Check Dates
     if (dossier.eta && new Date(dossier.eta) < new Date() && dossier.stage !== ShipmentStage.DELIVERY) {
        alerts.push({ id: 'al-2', type: 'BLOCKER', message: 'Shipment past ETA but not delivered' });
     }

     return { 
        alerts, 
        nextAction: alerts.length > 0 ? 'Resolve Alerts' : 'Monitor Transit' 
     };
  }
};