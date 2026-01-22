import { supabase } from '@/lib/supabase';
import { 
    Client, 
    ClientContact, 
    ClientRoute, 
    ClientSupplier, 
    ClientCommodity 
} from '@/types/index';

// --- TRANSFORMERS (DB <-> APP) ---

// 1. Convert DB Row (Snake_Case) -> App Client (CamelCase + Date Objects)
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
        
        // Numeric Fields
        creditLimit: Number(row.credit_limit) || 0,
        creditUsed: Number(row.credit_used) || 0,
        unbilledWork: Number(row.unbilled_work) || 0,
        unpaidInvoices: Number(row.unpaid_invoices) || 0,
        
        salesRepId: row.sales_rep_id || '',
        tags: row.tags || [],
        
        // JSONB Fields (Default to empty objects/arrays if null)
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

// 2. Convert App Client -> DB Row (Snake_Case)
const mapClientToRow = (client: Client) => {
    return {
        entity_name: client.entityName,
        status: client.status,
        type: client.type,
        email: client.email || null,
        phone: client.phone || null,
        website: client.website || null,
        city: client.city || null,
        country: client.country || null,
        billing_address: client.billingAddress || null,
        delivery_address: client.deliveryAddress || null,
        
        // Statistics & Limits
        credit_limit: client.creditLimit || 0,
        credit_used: client.creditUsed || 0,
        unbilled_work: client.unbilledWork || 0,
        unpaid_invoices: client.unpaidInvoices || 0,
        
        sales_rep_id: client.salesRepId || null,
        tags: client.tags || [],
        
        // JSONB Columns
        financials: client.financials || {},
        operational: client.operational || {},
        contacts: client.contacts || [],
        routes: client.routes || [],
        suppliers: client.suppliers || [],
        commodities: client.commodities || [],
        documents: client.documents || [],
        activities: client.activities || []
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
            console.error('SERVER ERROR: Fetching clients failed', error);
            throw new Error(error.message);
        }

        return (data || []).map(mapRowToClient);
    },

    /**
     * Save or Update a Client
     */
    save: async (client: Client): Promise<Client> => {
        const payload = mapClientToRow(client);
        
        // Check if ID is a valid UUID vs Temporary ID (e.g., 'new-170...')
        const isNewRecord = !client.id || client.id.startsWith('new-');

        let data, error;

        try {
            if (isNewRecord) {
                // INSERT: Supabase generates the UUID
                const response = await supabase
                    .from('clients')
                    .insert([payload])
                    .select()
                    .single();
                
                data = response.data;
                error = response.error;
            } else {
                // UPDATE: Use existing UUID
                const response = await supabase
                    .from('clients')
                    .update({ 
                        ...payload, 
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', client.id)
                    .select()
                    .single();

                data = response.data;
                error = response.error;
            }

            if (error) {
                // Log detailed error for debugging
                console.error('SUPABASE SAVE ERROR:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    payload // Verify what we tried to send
                });
                throw new Error(error.message);
            }

            return mapRowToClient(data);
            
        } catch (err: any) {
            console.error('CLIENT SERVICE EXCEPTION:', err);
            throw err;
        }
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
            console.error('DELETE ERROR:', error);
            throw new Error(error.message);
        }
    },

    /**
     * Upload a file to Supabase Storage
     */
    uploadFile: async (file: File, clientId: string): Promise<{ path: string, url: string }> => {
        // Sanitize filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${clientId}/${fileName}`;

        // Removed 'data' from destructuring since it was unused
        const { error } = await supabase.storage
            .from('client-docs')
            .upload(filePath, file);

        if (error) {
            throw new Error(error.message);
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('client-docs')
            .getPublicUrl(filePath);

        return {
            path: filePath,
            url: publicUrl
        };
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
        deliveryAddress: '',
        creditLimit: 0,
        creditUsed: 0,
        unbilledWork: 0,
        unpaidInvoices: 0,
        salesRepId: '', 
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