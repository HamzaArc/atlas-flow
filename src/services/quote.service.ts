import { supabase } from '@/lib/supabase';
import { Quote, QuoteOption, PackagingType } from '@/types/index';

// Helper to map DB Row -> Domain Model
const mapRowToQuote = (row: any): Quote => {
    // Fallback logic for legacy options or empty data
    const legacyOption: QuoteOption = {
        id: 'legacy-opt',
        quoteId: row.id,
        name: 'Standard Option',
        isRecommended: true,
        mode: row.data?.mode || 'SEA_LCL',
        incoterm: row.data?.incoterm || 'FOB',
        pol: row.pol || row.data?.pol,
        pod: row.pod || row.data?.pod,
        placeOfLoading: row.data?.placeOfLoading || '',
        placeOfDelivery: row.data?.placeOfDelivery || '',
        equipmentType: row.data?.equipmentType || '',
        containerCount: row.data?.containerCount || 1,
        transitTime: row.data?.transitTime || 0,
        freeTime: row.data?.freeTime || 0,
        items: row.data?.items || [],
        baseCurrency: 'MAD',
        quoteCurrency: row.data?.quoteCurrency || 'MAD',
        exchangeRates: row.data?.exchangeRates || { MAD: 1, USD: 9.80, EUR: 10.75 },
        marginBuffer: row.data?.marginBuffer || 1.02,
        totalTTC: row.total_ttc || 0,
        equipmentList: [] // FIXED: Added to legacy option
    };

    const options = (row.data?.options && row.data.options.length > 0) 
        ? row.data.options 
        : [legacyOption];

    return {
        id: row.id,
        reference: row.reference,
        masterReference: row.data?.masterReference || row.reference,
        version: row.data?.version || 1,
        status: row.status,
        clientName: row.client_name,
        clientId: '', 
        paymentTerms: row.data?.paymentTerms || '30 Days',
        salespersonId: row.data?.salespersonId || '',
        salespersonName: row.data?.salespersonName || 'Admin',
        
        validityDate: new Date(row.validity_date),
        cargoReadyDate: new Date(row.data?.cargoReadyDate || new Date()),
        requestedDepartureDate: row.data?.requestedDepartureDate ? new Date(row.data.requestedDepartureDate) : undefined,
        
        // Flattened dashboard fields
        pol: row.pol,
        pod: row.pod,
        totalTTC: row.total_ttc,

        cargoRows: row.data?.cargoRows || [],
        goodsDescription: row.data?.goodsDescription || '',
        hsCode: row.data?.hsCode || '',
        packagingType: 'PALLETS' as PackagingType,
        isHazmat: row.data?.isHazmat || false,
        isReefer: row.data?.isReefer || false,
        temperature: row.data?.temperature || '',
        cargoValue: row.data?.cargoValue || 0,
        insuranceRequired: row.data?.insuranceRequired || false,
        isStackable: true,
        
        probability: row.data?.probability || 'MEDIUM',
        competitorInfo: row.data?.competitorInfo || '',
        internalNotes: row.data?.internalNotes || '',
        activities: row.data?.activities || [],
        approval: row.data?.approval || { requiresApproval: false, reason: null },
        
        options: options,
        customerReference: row.data?.customerReference || ''
    };
};

export const QuoteService = {
    /**
     * Fetches all quotes ordered by creation date
     */
    fetchAll: async (): Promise<Quote[]> => {
        const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapRowToQuote);
    },

    /**
     * Fetches a single quote by ID
     */
    getById: async (id: string): Promise<Quote | null> => {
        const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return mapRowToQuote(data);
    },

    /**
     * Persists a quote (Create or Update)
     */
    save: async (quote: Partial<Quote>, isNew: boolean): Promise<string> => {
        const jsonPayload = {
            options: quote.options,
            activeOptionId: quote.options?.[0]?.id, 
            cargoRows: quote.cargoRows,
            goodsDescription: quote.goodsDescription,
            internalNotes: quote.internalNotes,
            activities: quote.activities,
            salespersonName: quote.salespersonName,
            salespersonId: quote.salespersonId,
            probability: quote.probability,
            cargoReadyDate: quote.cargoReadyDate,
            requestedDepartureDate: quote.requestedDepartureDate,
            competitorInfo: quote.competitorInfo,
            customerReference: quote.customerReference,
            hsCode: quote.hsCode,
            isHazmat: quote.isHazmat,
            isReefer: quote.isReefer,
            temperature: quote.temperature,
            cargoValue: quote.cargoValue,
            insuranceRequired: quote.insuranceRequired,
            approval: quote.approval,
            version: quote.version,
            masterReference: quote.masterReference,
            paymentTerms: quote.paymentTerms
        };

        const dbRow: any = {
            reference: quote.reference,
            status: quote.status,
            client_name: quote.clientName,
            pol: quote.pol,
            pod: quote.pod,
            validity_date: quote.validityDate,
            total_ttc: quote.totalTTC, 
            data: jsonPayload
        };

        if (isNew) {
            const { data, error } = await supabase.from('quotes').insert([dbRow]).select().single();
            if (error) throw error;
            return data.id;
        } else {
            const { error } = await supabase.from('quotes').update(dbRow).eq('id', quote.id);
            if (error) throw error;
            return quote.id!;
        }
    },

    /**
     * Deletes a quote by ID
     */
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase.from('quotes').delete().eq('id', id);
        if (error) throw error;
    }
};