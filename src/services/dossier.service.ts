// src/services/dossier.service.ts
import { supabase } from '@/lib/supabase';
import { Dossier, DossierAlert, ShipmentStage, DossierContainer, ShipmentEvent, DossierTask, ActivityItem, Document } from '@/types/index';
import { generateUUID } from '@/lib/utils';

// --- Types ---
export interface FetchDossiersParams {
    page: number;
    pageSize: number;
    filterMode: string;
    searchTerm: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
}

// --- Helpers ---
const isValidUuid = (id?: string) => {
    return id && id.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

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
    parties: row.parties || [], 
    cargoItems: row.cargo_items || [],
    tags: row.tags || [],
    
    // Relations (Populated via joins)
    containers: (row.dossier_containers || []).map(mapContainerFromDb),
    events: (row.dossier_events || []).map(mapEventFromDb),
    tasks: (row.dossier_tasks || []).map(mapTaskFromDb),
    activities: (row.dossier_activities || []).map(mapActivityFromDb),
    documents: (row.dossier_documents || []).map(mapDocumentFromDb),
    
    // Defaults
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
    owner: row.owner || ''
  };
};

const mapDossierToDb = (dossier: Dossier) => {
  const { 
      id, containers, events, tasks, documents, activities, alerts, 
      ...rest 
  } = dossier;
  
  const dbId = isValidUuid(id) ? id : undefined;

  return {
    ...(dbId ? { id: dbId } : {}),
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
    
    // JSONB Fields
    shipper: rest.shipper,
    consignee: rest.consignee,
    notify: rest.notify,
    parties: rest.parties,
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
    owner: rest.owner 
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

const mapDocumentFromDb = (row: any): Document => ({
    id: row.id,
    dossierId: row.dossier_id,
    name: row.name,
    type: row.type,
    url: row.url,
    size: row.size,
    status: row.status,
    isInternal: row.is_internal,
    updatedAt: new Date(row.updated_at || row.created_at)
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
                dossier_activities(*),
                dossier_documents(*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch Error:", error);
            throw error;
        }
        return data.map(mapDossierFromDb);
    },

    fetchPaginated: async (params: FetchDossiersParams): Promise<{ data: Dossier[], count: number }> => {
        const { page, pageSize, filterMode, searchTerm, sortField = 'created_at', sortOrder = 'desc' } = params;
        
        let query = supabase.from('dossiers').select(`
            *,
            dossier_containers(*),
            dossier_events(*),
            dossier_tasks(*),
            dossier_activities(*),
            dossier_documents(*)
        `, { count: 'exact' });

        if (filterMode && filterMode !== 'All') {
            query = query.ilike('mode', `%${filterMode}%`);
        }

        if (searchTerm) {
            query = query.or(`ref.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%,booking_ref.ilike.%${searchTerm}%,carrier.ilike.%${searchTerm}%,owner.ilike.%${searchTerm}%`);
        }

        query = query.order(sortField, { ascending: sortOrder === 'asc' });

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: (data || []).map(row => {
                const dossier = mapDossierFromDb(row);
                const { alerts } = DossierService.analyzeHealth(dossier);
                dossier.alerts = alerts;
                return dossier;
            }),
            count: count || 0
        };
    },

    fetchStats: async (): Promise<any[]> => {
        const { data, error } = await supabase
            .from('dossiers')
            .select('id, ref, stage, mode, status, eta'); // Added 'ref' here

        if (error) throw error;
        return data || [];
    },

    getById: async (id: string): Promise<Dossier | null> => {
        const { data, error } = await supabase
            .from('dossiers')
            .select(`
                *,
                dossier_containers(*),
                dossier_events(*),
                dossier_tasks(*),
                dossier_activities(*),
                dossier_documents(*)
            `)
            .eq('id', id)
            .single();

        if (error) return null;
        return mapDossierFromDb(data);
    },

    save: async (dossier: Dossier): Promise<Dossier> => {
        const dbPayload = mapDossierToDb(dossier);
        
        const { data: savedDossier, error: mainError } = await supabase
            .from('dossiers')
            .upsert(dbPayload)
            .select()
            .single();

        if (mainError) throw mainError;
        const dossierId = savedDossier.id;

        // Sync Containers
        const validContainers = dossier.containers.map(c => ({
            ...c,
            id: isValidUuid(c.id) ? c.id : generateUUID()
        }));
        const containerIdsToKeep: string[] = [];
        if (validContainers.length > 0) {
            const containersPayload = validContainers.map(c => {
                containerIdsToKeep.push(c.id);
                return {
                    id: c.id, 
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
                };
            });
            await supabase.from('dossier_containers').upsert(containersPayload);
        }
        if (containerIdsToKeep.length > 0) {
            await supabase.from('dossier_containers').delete().eq('dossier_id', dossierId).not('id', 'in', `(${containerIdsToKeep.join(',')})`);
        } else {
            await supabase.from('dossier_containers').delete().eq('dossier_id', dossierId);
        }

        // Sync Events
        const validEvents = dossier.events.map(e => ({
            ...e,
            id: isValidUuid(e.id) ? e.id : generateUUID()
        }));
        const eventIdsToKeep: string[] = [];
        if (validEvents.length > 0) {
            const eventsPayload = validEvents.map(e => {
                eventIdsToKeep.push(e.id);
                return {
                    id: e.id,
                    dossier_id: dossierId,
                    title: e.title,
                    location: e.location,
                    occurred_at: e.timestamp,
                    is_exception: e.isException,
                    exception_reason: e.exceptionReason,
                    source: e.source
                };
            });
            await supabase.from('dossier_events').upsert(eventsPayload);
        }
        if (eventIdsToKeep.length > 0) {
            await supabase.from('dossier_events').delete().eq('dossier_id', dossierId).not('id', 'in', `(${eventIdsToKeep.join(',')})`);
        } else {
            await supabase.from('dossier_events').delete().eq('dossier_id', dossierId);
        }

        // Sync Tasks
        const validTasks = dossier.tasks.map(t => ({
            ...t,
            id: isValidUuid(t.id) ? t.id : generateUUID()
        }));
        const taskIdsToKeep: string[] = [];
        if (validTasks.length > 0) {
            const tasksPayload = validTasks.map(t => {
                taskIdsToKeep.push(t.id);
                let safeAssigneeId: string | null = t.assignee;
                if (!safeAssigneeId || !isValidUuid(safeAssigneeId)) safeAssigneeId = null;

                return {
                    id: t.id,
                    dossier_id: dossierId,
                    title: t.title,
                    description: t.description,
                    due_date: t.dueDate,
                    assignee_id: safeAssigneeId,
                    is_completed: t.completed,
                    is_blocker: t.isBlocker,
                    category: t.category,
                    priority: t.priority,
                    stage: t.stage
                };
            });
            await supabase.from('dossier_tasks').upsert(tasksPayload);
        }
        if (taskIdsToKeep.length > 0) {
            await supabase.from('dossier_tasks').delete().eq('dossier_id', dossierId).not('id', 'in', `(${taskIdsToKeep.join(',')})`);
        } else {
            await supabase.from('dossier_tasks').delete().eq('dossier_id', dossierId);
        }

        // Sync Activities
        if (dossier.activities.length > 0) {
            const activitiesPayload = dossier.activities.map(a => ({
                id: isValidUuid(a.id) ? a.id : generateUUID(),
                dossier_id: dossierId,
                category: a.category,
                tone: a.tone,
                text: a.text,
                meta: a.meta,
                created_at: a.timestamp
            }));
            await supabase.from('dossier_activities').upsert(activitiesPayload);
        }

        return await DossierService.getById(dossierId) as Dossier;
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase.from('dossiers').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Documents API ---
    uploadDocument: async (dossierId: string, file: File, meta: { type: string, isInternal: boolean }): Promise<Document> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${dossierId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('dossier-documents')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('dossier-documents')
            .getPublicUrl(fileName);

        const docPayload = {
            dossier_id: dossierId,
            name: file.name,
            type: meta.type,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            url: publicUrl,
            status: 'ISSUED', 
            is_internal: meta.isInternal
        };

        const { data, error: dbError } = await supabase
            .from('dossier_documents')
            .insert(docPayload)
            .select()
            .single();

        if (dbError) throw dbError;

        return mapDocumentFromDb(data);
    },

    updateDocument: async (id: string, updates: Partial<Document>): Promise<Document> => {
        const payload = {
            name: updates.name,
            type: updates.type,
            status: updates.status,
            is_internal: updates.isInternal
        };

        const { data, error } = await supabase
            .from('dossier_documents')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapDocumentFromDb(data);
    },

    deleteDocument: async (id: string): Promise<void> => {
        const { error } = await supabase.from('dossier_documents').delete().eq('id', id);
        if (error) throw error;
    },

    analyzeHealth: (dossier: Dossier): { alerts: DossierAlert[], nextAction: string } => {
        const alerts: DossierAlert[] = [];
        let nextAction = 'Monitor Shipment';
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