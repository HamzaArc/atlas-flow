import { supabase } from '@/lib/supabase';
import { 
    Client, 
    ClientContact, 
    ClientRoute, 
    ClientSupplier, 
    ClientCommodity } from '@/types/index';

// --- TRANSFORMERS (DB <-> APP) ---

// 1. Convert DB Row (Snake_Case + Strings) -> App Client (CamelCase + Date Objects)
const mapRowToClient = (row: any): Client => {
    return {
        id: row.id,
        created_at: row.created_at, 
        updated_at: row.updated_at,
        entityName: row.entity_name,
        status: row.status as any,
        type: row.type as any,
        email: row.email || '',
        phone: row.phone || '',
        website: row.website || '',
        city: row.city || '',
        country: row.country || '',
        billingAddress: row.billing_address || '',
        deliveryAddress: row.delivery_address || '',
        creditLimit: row.credit_limit || 0,
        creditUsed: row.credit_used || 0, // FIXED: Mapped correctly
        unbilledWork: row.unbilled_work || 0,
        unpaidInvoices: row.unpaid_invoices || 0,
        salesRepId: row.sales_rep_id || '',
        tags: row.tags || [],
        
        // JSONB Fields
        financials: row.financials || {},
        operational: row.operational || {},
        
        // Arrays 
        contacts: (row.contacts || []) as ClientContact[],
        routes: (row.routes || []) as ClientRoute[],
        suppliers: (row.suppliers || []) as ClientSupplier[],
        commodities: (row.commodities || []) as ClientCommodity[],
        
        documents: (row.documents || []).map((d: any) => ({
            ...d,
            uploadDate: d.uploadDate ? new Date(d.uploadDate) : new Date(),
            expiryDate: d.expiryDate ? new Date(d.expiryDate) : undefined
        })),

        activities: (row.activities || []).map((a: any) => ({
            ...a,
            timestamp: a.timestamp ? new Date(a.timestamp) : new Date()
        }))
    };
};

// 2. Convert App Client -> DB Row
const mapClientToRow = (client: Client) => {
    return {
        entity_name: client.entityName,
        status: client.status,
        type: client.type,
        email: client.email,
        phone: client.phone,
        website: client.website,
        city: client.city,
        country: client.country,
        billing_address: client.billingAddress,
        delivery_address: client.deliveryAddress,
        credit_limit: client.creditLimit,
        credit_used: client.creditUsed, // FIXED: Mapped correctly
        sales_rep_id: client.salesRepId,
        tags: client.tags,
        
        // JSONB Columns
        financials: client.financials,
        operational: client.operational,
        contacts: client.contacts,
        routes: client.routes,
        suppliers: client.suppliers,
        commodities: client.commodities,
        documents: client.documents,
        activities: client.activities,
        
        // Read-only/Stats fields
        unbilled_work: client.unbilledWork,
        unpaid_invoices: client.unpaidInvoices
    };
};

export const ClientService = {
    /**
     * Fetch all clients from Supabase
     */
    fetchAll: async (): Promise<Client[]> => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching clients:', error);
            throw new Error(error.message);
        }

        return (data || []).map(mapRowToClient);
    },

    /**
     * Save or Update a Client
     */
    save: async (client: Client): Promise<Client> => {
        const payload = mapClientToRow(client);
        
        // Check if ID is a valid UUID vs Temporary ID
        const isNewRecord = !client.id || client.id.startsWith('new-');

        let data, error;

        if (isNewRecord) {
            // INSERT
            const response = await supabase
                .from('clients')
                .insert([payload])
                .select()
                .single();
            
            data = response.data;
            error = response.error;
        } else {
            // UPDATE
            const response = await supabase
                .from('clients')
                .update({ ...payload, updated_at: new Date().toISOString() })
                .eq('id', client.id)
                .select()
                .single();

            data = response.data;
            error = response.error;
        }

        if (error) {
            console.error('Error saving client:', error);
            throw new Error(error.message);
        }

        return mapRowToClient(data);
    },

    /**
     * Delete a client
     */
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(error.message);
        }
    },

    /**
     * Create an empty client template (Client-side only)
     */
    createEmpty: (): Client => ({
        id: `new-${Date.now()}`,
        created_at: new Date().toISOString(),
        entityName: '',
        status: 'PROSPECT',
        type: 'SHIPPER',
        email: '',
        phone: '',
        city: '',
        country: 'Morocco',
        billingAddress: '',
        creditLimit: 0,
        creditUsed: 0, // FIXED: Added initialization
        unbilledWork: 0,
        unpaidInvoices: 0,
        salesRepId: 'Youssef (Sales)',
        tags: [],
        contacts: [],
        routes: [],
        documents: [],
        suppliers: [],
        commodities: [],
        operational: {
            hsCodes: [],
            requiresHazmat: false,
            requiresReefer: false,
            requiresOOG: false,
            customsRegime: 'STANDARD',
            negotiatedFreeTime: 7
        },
        activities: [
          { 
              id: 'init', 
              category: 'SYSTEM', 
              text: 'Client profile initialized', 
              meta: 'System', 
              timestamp: new Date(), 
              tone: 'neutral' 
          }
        ],
        financials: {
          paymentTerms: 'PREPAID',
          vatNumber: '',
          currency: 'MAD',
          ice: '',
          rc: ''
        }
    })
};