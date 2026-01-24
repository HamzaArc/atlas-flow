import { supabase } from '@/lib/supabase';
import { ChargeLine, Invoice, VatRule, InvoiceStatus } from '@/types/index';
import { generateUUID } from '@/lib/utils';

// --- Helpers ---
const isValidUuid = (id?: string) => {
    return id && id.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// --- Mappers ---

const mapChargeFromDb = (row: any): ChargeLine => {
    let rate = Number(row.vat_rate || 0);
    // Auto-fix decimal rates to percentages if needed
    if (rate > 0 && rate < 1) {
        rate = rate * 100;
    }

    return {
        id: row.id,
        dossierId: row.dossier_id,
        type: row.type,
        code: row.code,
        description: row.description,
        vendorName: row.vendor_name,
        currency: row.currency,
        amount: Number(row.amount || 0),
        exchangeRate: Number(row.exchange_rate || 1),
        amountLocal: Number(row.amount_local || 0),
        vatRule: row.vat_rule,
        vatRate: rate, 
        vatAmount: Number(row.vat_amount || 0),
        totalAmount: Number(row.total_amount || 0),
        status: row.status,
        isBillable: row.is_billable,
        invoiceId: row.invoice_id,
        createdAt: new Date(row.created_at)
    };
};

const mapChargeToDb = (charge: Partial<ChargeLine>) => {
    const dbId = isValidUuid(charge.id) ? charge.id : generateUUID();

    return {
        id: dbId,
        dossier_id: charge.dossierId,
        type: charge.type,
        code: charge.code,
        description: charge.description,
        vendor_name: charge.vendorName,
        currency: charge.currency,
        amount: charge.amount,
        exchange_rate: charge.exchangeRate,
        amount_local: charge.amountLocal,
        vat_rule: charge.vatRule,
        vat_rate: charge.vatRate, 
        vat_amount: charge.vatAmount,
        total_amount: charge.totalAmount,
        status: charge.status,
        is_billable: charge.isBillable,
        invoice_id: charge.invoiceId
    };
};

// Map Invoice from DB (CamelCase Columns)
const mapInvoiceFromDb = (row: any, lines: ChargeLine[] = []): Invoice => ({
    id: row.id,
    type: row.type,
    reference: row.reference,
    dossierId: row.dossierId, // CamelCase in DB
    clientId: row.clientId,   // CamelCase in DB
    clientName: row.clientName, // CamelCase in DB
    date: new Date(row.date),
    dueDate: new Date(row.dueDate), // CamelCase in DB
    status: row.status as InvoiceStatus,
    currency: row.currency,
    exchangeRate: row.exchangeRate, // CamelCase in DB
    subTotal: row.subTotal, // CamelCase in DB
    taxTotal: row.taxTotal, // CamelCase in DB
    total: row.total,
    balanceDue: row.balanceDue, // CamelCase in DB
    lines: lines
});

// --- Service ---

export const FinanceService = {
    
    fetchLedger: async (dossierId: string): Promise<ChargeLine[]> => {
        const { data, error } = await supabase
            .from('dossier_charge_lines')
            .select('*')
            .eq('dossier_id', dossierId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Fetch Ledger Error", error);
            if (error.code === '42P01') return []; 
            throw error;
        }
        return data.map(mapChargeFromDb);
    },

    upsertCharge: async (charge: Partial<ChargeLine>): Promise<ChargeLine> => {
        const payload = mapChargeToDb(charge);
        
        const { data, error } = await supabase
            .from('dossier_charge_lines')
            .upsert(payload)
            .select()
            .single();

        if (error) {
            console.error("Upsert Charge Error", error);
            throw error;
        }
        return mapChargeFromDb(data);
    },

    deleteCharge: async (id: string): Promise<void> => {
        if (!isValidUuid(id)) return;
        const { error } = await supabase.from('dossier_charge_lines').delete().eq('id', id);
        if (error) throw error;
    },

    fetchInvoices: async (dossierId: string): Promise<Invoice[]> => {
        // FIXED: Use 'dossierId' (camelCase) to query the invoices table
        const { data: invData, error: invError } = await supabase
            .from('invoices')
            .select('*')
            .eq('dossierId', dossierId) 
            .order('date', { ascending: false });

        if (invError) throw invError;
        
        if (!invData || invData.length === 0) return [];

        const invoiceIds = invData.map(i => i.id);
        
        // Use 'invoice_id' (snake_case) to query the lines table
        const { data: linesData, error: linesError } = await supabase
            .from('dossier_charge_lines')
            .select('*')
            .in('invoice_id', invoiceIds);

        if (linesError) throw linesError;

        return invData.map(invRow => {
            const lines = (linesData || [])
                .filter(l => l.invoice_id === invRow.id)
                .map(mapChargeFromDb);
            return mapInvoiceFromDb(invRow, lines);
        });
    },

    createInvoice: async (invoice: Invoice): Promise<Invoice> => {
        // FIXED: Use camelCase keys for the invoices table payload
        const invPayload = {
            id: undefined,
            dossierId: invoice.dossierId,   // camelCase
            reference: invoice.reference,
            type: invoice.type,
            clientId: invoice.clientId,     // camelCase
            clientName: invoice.clientName, // camelCase
            date: invoice.date,
            dueDate: invoice.dueDate,       // camelCase
            status: invoice.status,
            currency: invoice.currency,
            exchangeRate: invoice.exchangeRate, // camelCase
            subTotal: invoice.subTotal,     // camelCase
            taxTotal: invoice.taxTotal,     // camelCase
            total: invoice.total,
            balanceDue: invoice.balanceDue  // camelCase
        };

        const { data: savedInv, error: invError } = await supabase
            .from('invoices')
            .insert(invPayload)
            .select()
            .single();

        if (invError) throw invError;

        const lineIds = invoice.lines.map(l => l.id);
        if (lineIds.length > 0) {
            // Use snake_case keys for the lines table update
            const { error: linesError } = await supabase
                .from('dossier_charge_lines')
                .update({ 
                    invoice_id: savedInv.id, 
                    status: 'INVOICED' 
                })
                .in('id', lineIds);

            if (linesError) throw linesError;
        }

        return { ...invoice, id: savedInv.id };
    },

    // --- Calculations ---

    calculateVat: (amount: number, rule: VatRule): number => {
        switch(rule) {
            case 'STD_20': return amount * 0.20;
            case 'ROAD_14': return amount * 0.14;
            default: return 0;
        }
    },

    getVatRate: (rule: VatRule): number => {
        switch(rule) {
            case 'STD_20': return 20;
            case 'ROAD_14': return 14;
            default: return 0;
        }
    },

    buildInvoiceObject: (dossierId: string, lines: ChargeLine[], type: 'INVOICE' | 'CREDIT_NOTE' = 'INVOICE'): Invoice => {
        const subTotal = lines.reduce((acc, l) => acc + l.amount, 0);
        const taxTotal = lines.reduce((acc, l) => acc + l.vatAmount, 0);
        const total = subTotal + taxTotal;
        
        return {
            id: '',
            reference: `${type === 'CREDIT_NOTE' ? 'CN' : 'INV'}-${Math.floor(Date.now() / 1000)}`,
            type: type,
            dossierId,
            clientId: 'cli_1',
            clientName: 'Client Name',
            date: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            status: 'ISSUED',
            currency: lines[0]?.currency || 'MAD',
            exchangeRate: lines[0]?.exchangeRate || 1,
            subTotal,
            taxTotal,
            total: type === 'CREDIT_NOTE' ? -total : total,
            balanceDue: type === 'CREDIT_NOTE' ? 0 : total,
            lines: lines
        };
    }
};