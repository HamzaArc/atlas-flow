import { supabase } from '@/lib/supabase';
import { Dossier, DossierAlert, ShipmentStage, DossierContainer, ShipmentEvent, DossierTask, ActivityItem } from '@/types/index';

// --- Mappers ---

const mapDossierFromDb = (row: any): Dossier => {
  if (!row) throw new Error("Dossier data missing");

  return {
    id: row.id,
    ref: row.ref,
    bookingRef: row.booking_ref,
    status: row.status,
    stage: row.stage as ShipmentStage,
    clientId: row.client_id,
    clientName: row.client_name,
    quoteId: row.quote_id,
    mblNumber: row.mbl_number || '',
    hblNumber: row.hbl_number || '',
    customerReference: '', 
    carrier: row.carrier,
    vesselName: row.vessel_name,
    voyageNumber: row.voyage_number,
    pol: row.pol,
    pod: row.pod,
    incoterm: row.incoterm,
    incotermPlace: row.incoterm_place,
    mode: row.mode,
    etd: row.etd ? new Date(row.etd) : new Date(),
    eta: row.eta ? new Date(row.eta) : new Date(),
    ata: row.ata ? new Date(row.ata) : undefined,
    
    // JSONB columns
    shipper: row.shipper || { name: '', role: 'Shipper' },
    consignee: row.consignee || { name: '', role: 'Consignee' },
    notify: row.notify,
    cargoItems: row.cargo_items || [],
    tags: row.tags || [],
    
    // Relations (Populated via joins)
    containers: (row.dossier_containers || []).map(mapContainerFromDb),
    events: (row.dossier_events || []).map(mapEventFromDb),
    tasks: (row.dossier_tasks || []).map(mapTaskFromDb),
    activities: (row.dossier_activities || []).map(mapActivityFromDb),
    
    // Defaults/Computed to satisfy strict interface
    parties: [], 
    documents: [], 
    alerts: [], 
    
    // Dates & Operations
    freeTimeDays: row.free_time_days || 0,
    vgmCutOff: row.vgm_cut_off ? new Date(row.vgm_cut_off) : undefined,
    portCutOff: row.port_cut_off ? new Date(row.port_cut_off) : undefined,
    docCutOff: row.doc_cut_off ? new Date(row.doc_cut_off) : undefined,
    
    // Financials
    nextAction: row.next_action || '',
    totalRevenue: row.total_revenue || 0,
    totalCost: row.total_cost || 0,
    currency: row.currency || 'MAD',
    
    createdDate: row.created_at,
    owner: row.owner || '' // FIX: Map the owner from the database
  };
};

const mapDossierToDb = (dossier: Dossier) => {
  // Destructure to remove fields that don't exist in the 'dossiers' table
  const { 
      id, 
      containers, 
      events, 
      tasks, 
      documents, 
      activities, 
      alerts, 
      parties, // Exclude from DB payload
      ...rest 
  } = dossier;
  
  const isNew = id.startsWith('new-');

  return {
    ...(isNew ? {} : { id }),
    ref: rest.ref,
    booking_ref: rest.bookingRef,
    status: rest.status,
    stage: rest.stage,
    client_id: rest.clientId || null,
    client_name: rest.clientName,
    quote_id: rest.quoteId || null,
    mbl_number: rest.mblNumber,
    hbl_number: rest.hblNumber,
    carrier: rest.carrier,
    vessel_name: rest.vesselName,
    voyage_number: rest.voyageNumber,
    pol: rest.pol,
    pod: rest.pod,
    incoterm: rest.incoterm,
    incoterm_place: rest.incotermPlace,
    mode: rest.mode,
    etd: rest.etd,
    eta: rest.eta,
    ata: rest.ata,
    shipper: rest.shipper,
    consignee: rest.consignee,
    notify: rest.notify,
    cargo_items: rest.cargoItems,
    free_time_days: rest.freeTimeDays,
    vgm_cut_off: rest.vgmCutOff,
    port_cut_off: rest.portCutOff,
    doc_cut_off: rest.docCutOff,
    tags: rest.tags,
    next_action: rest.nextAction,
    total_revenue: rest.totalRevenue,
    total_cost: rest.totalCost,
    currency: rest.currency,
    owner: rest.owner // FIX: Include owner in the payload sent to Supabase
  };
};

const mapContainerFromDb = (row: any): DossierContainer => ({
    id: row.id,
    number: row.container_number,
    type: row.type,
    seal: row.seal_number,
    weight: row.weight,
    packages: row.package_count,
    packageType: row.package_type,
    volume: row.volume,
    status: row.status,
    pickupDate: row.pickup_date,
    returnDate: row.return_date
});

const mapEventFromDb = (row: any): ShipmentEvent => ({
    id: row.id,
    title: row.title,
    location: row.location,
    timestamp: row.occurred_at,
    isException: row.is_exception,
    exceptionReason: row.exception_reason,
    source: row.source
});

const mapTaskFromDb = (row: any): DossierTask => ({
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    assignee: row.assignee_id,
    completed: row.is_completed,
    isBlocker: row.is_blocker,
    category: row.category,
    priority: row.priority,
    stage: row.stage
});

const mapActivityFromDb = (row: any): ActivityItem => ({
    id: row.id,
    category: row.category,
    tone: row.tone,
    text: row.text,
    meta: row.meta,
    timestamp: new Date(row.created_at)
});

// --- Service ---

export const DossierService = {
    fetchAll: async (): Promise<Dossier[]> => {
        const { data, error } = await supabase
            .from('dossiers')
            .select(`
                *,
                dossier_containers(*),
                dossier_events(*),
                dossier_tasks(*),
                dossier_activities(*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch Error:", error);
            throw error;
        }
        return data.map(mapDossierFromDb);
    },

    getById: async (id: string): Promise<Dossier | null> => {
        const { data, error } = await supabase
            .from('dossiers')
            .select(`
                *,
                dossier_containers(*),
                dossier_events(*),
                dossier_tasks(*),
                dossier_activities(*)
            `)
            .eq('id', id)
            .single();

        if (error) return null;
        return mapDossierFromDb(data);
    },

    save: async (dossier: Dossier): Promise<Dossier> => {
        // 1. Save Main Dossier
        const dbPayload = mapDossierToDb(dossier);
        
        const { data: savedDossier, error: mainError } = await supabase
            .from('dossiers')
            .upsert(dbPayload)
            .select()
            .single();

        if (mainError) throw mainError;
        const dossierId = savedDossier.id;

        // 2. Sync Containers
        if (dossier.containers.length > 0) {
            const containersPayload = dossier.containers.map(c => ({
                id: c.id.length < 10 ? undefined : c.id, // ID check for temp IDs
                dossier_id: dossierId,
                container_number: c.number,
                type: c.type,
                seal_number: c.seal,
                weight: c.weight,
                package_count: c.packages,
                package_type: c.packageType,
                volume: c.volume,
                status: c.status,
                pickup_date: c.pickupDate,
                return_date: c.returnDate
            }));
            await supabase.from('dossier_containers').upsert(containersPayload);
        }

        // 3. Sync Events
        if (dossier.events.length > 0) {
            const eventsPayload = dossier.events.map(e => ({
                id: e.id.startsWith('evt-') ? undefined : e.id,
                dossier_id: dossierId,
                title: e.title,
                location: e.location,
                occurred_at: e.timestamp,
                is_exception: e.isException,
                exception_reason: e.exceptionReason,
                source: e.source
            }));
            await supabase.from('dossier_events').upsert(eventsPayload);
        }

        // 4. Sync Tasks
        if (dossier.tasks.length > 0) {
            const tasksPayload = dossier.tasks.map(t => ({
                id: t.id.length < 10 ? undefined : t.id,
                dossier_id: dossierId,
                title: t.title,
                description: t.description,
                due_date: t.dueDate,
                assignee_id: t.assignee,
                is_completed: t.completed,
                is_blocker: t.isBlocker,
                category: t.category,
                priority: t.priority,
                stage: t.stage
            }));
            await supabase.from('dossier_tasks').upsert(tasksPayload);
        }

        return await DossierService.getById(dossierId) as Dossier;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase.from('dossiers').delete().eq('id', id);
        if (error) throw error;
    },

    analyzeHealth: (dossier: Dossier): { alerts: DossierAlert[], nextAction: string } => {
        const alerts: DossierAlert[] = [];
        let nextAction = 'Monitor Shipment';
        
        // Client-side logic for alerts
        if (dossier.eta) {
            const daysToEta = Math.ceil((new Date(dossier.eta).getTime() - Date.now()) / (1000 * 3600 * 24));
            if (dossier.status === 'ON_WATER' && daysToEta < 2) {
                nextAction = 'Prepare Arrival Notice';
                alerts.push({ id: 'a1', type: 'INFO', message: 'Vessel arriving soon.' });
            }
        }
        return { alerts, nextAction };
    }
};