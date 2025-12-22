import { create } from 'zustand';
import { ChargeLine, Invoice, InvoiceStatus, VatRule } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";
import { FinanceService } from '@/services/finance.service';

interface FinanceState {
    ledger: ChargeLine[];
    invoices: Invoice[];
    
    // Dossier-Specific KPIs
    dossierStats: {
        revenue: number;
        cost: number;
        margin: number;
        marginPercent: number;
    };

    // Global KPIs
    globalRevenue: number;
    globalOverdue: number;
    globalMargin: number;
    
    // Actions
    loadLedger: (dossierId: string) => void;
    fetchGlobalStats: () => void;
    
    addCharge: (charge: Partial<ChargeLine>) => void;
    updateCharge: (id: string, updates: Partial<ChargeLine>) => void;
    deleteCharge: (id: string) => void;
    
    // Updated: Returns the Invoice object. PDF Generation must be handled by the UI.
    generateInvoice: (dossierId: string, lineIds: string[], type?: 'INVOICE' | 'CREDIT_NOTE') => Promise<Invoice | null>;
    
    createManualInvoice: (invoice: Partial<Invoice>) => Promise<void>;
    updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
    createCreditNote: (invoiceId: string) => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    ledger: [],
    invoices: [],
    dossierStats: { revenue: 0, cost: 0, margin: 0, marginPercent: 0 },
    globalRevenue: 0,
    globalOverdue: 0,
    globalMargin: 0,

    loadLedger: async (dossierId) => {
        const dossierLines = await FinanceService.fetchLedger(dossierId);
        
        // Recalc Stats
        let rev = 0;
        let cost = 0;
        dossierLines.forEach(l => {
            if(l.type === 'INCOME') rev += l.amountLocal;
            else cost += l.amountLocal;
        });
        const margin = rev - cost;
        const marginPercent = rev > 0 ? (margin / rev) * 100 : 0;

        set({ 
            ledger: dossierLines,
            dossierStats: { revenue: rev, cost, margin, marginPercent: parseFloat(marginPercent.toFixed(1)) }
        });
    },

    fetchGlobalStats: () => {
        set({ 
            globalRevenue: 145000, 
            globalOverdue: 12000, 
            globalMargin: 18.5 
        });
    },

    addCharge: (charge) => {
        const vatRule = (charge.vatRule as VatRule) || 'STD_20';
        const vatAmt = FinanceService.calculateVat(charge.amount || 0, vatRule);
        const exRate = charge.exchangeRate || 1;
        
        const newLine: ChargeLine = {
            id: Math.random().toString(36).substr(2,9),
            dossierId: '1', 
            type: charge.type || 'EXPENSE',
            code: charge.code || 'MISC',
            description: charge.description || 'New Charge',
            vendorName: charge.vendorName,
            currency: charge.currency || 'MAD',
            amount: charge.amount || 0,
            exchangeRate: exRate,
            amountLocal: (charge.amount || 0) * exRate,
            vatRule: vatRule,
            vatRate: FinanceService.getVatRate(vatRule),
            vatAmount: vatAmt, 
            totalAmount: ((charge.amount || 0) + vatAmt) * exRate,
            status: charge.type === 'EXPENSE' ? 'ACCRUED' : 'ESTIMATED',
            isBillable: true,
            createdAt: new Date(),
            ...charge
        };
        
        const newLedger = [...get().ledger, newLine];
        set({ ledger: newLedger });
        get().loadLedger('1');
        useToast.getState().toast("Charge accrued successfully.", "success");
    },

    updateCharge: (id, updates) => {
        const newLedger = get().ledger.map(l => {
            if (l.id !== id) return l;
            
            // Recalculate logic if amounts changed
            const newAmount = updates.amount !== undefined ? updates.amount : l.amount;
            const newRate = updates.exchangeRate !== undefined ? updates.exchangeRate : l.exchangeRate;
            const newVatRule = (updates.vatRule as VatRule) !== undefined ? (updates.vatRule as VatRule) : l.vatRule;
            
            const vatAmt = FinanceService.calculateVat(newAmount, newVatRule);
            
            return { 
                ...l, 
                ...updates,
                amount: newAmount,
                exchangeRate: newRate,
                amountLocal: newAmount * newRate,
                vatAmount: vatAmt,
                totalAmount: (newAmount + vatAmt) * newRate 
            };
        });
        
        set({ ledger: newLedger });
        get().loadLedger('1');
        useToast.getState().toast("Ledger updated.", "info");
    },

    deleteCharge: (id) => {
        set({ ledger: get().ledger.filter(l => l.id !== id) });
        get().loadLedger('1');
    },

    generateInvoice: async (dossierId, lineIds, type = 'INVOICE') => {
        const selectedLines = get().ledger.filter(l => lineIds.includes(l.id));
        if (selectedLines.length === 0) return null;

        // Validation: Ensure all lines have same currency
        const currency = selectedLines[0].currency;
        if(selectedLines.some(l => l.currency !== currency)) {
            useToast.getState().toast("Error: Cannot invoice mixed currencies.", "error");
            return null;
        }

        const newInvoice = FinanceService.buildInvoiceObject(dossierId, selectedLines, type);

        set(state => ({ invoices: [newInvoice, ...state.invoices] }));
        
        // Lock lines and link to invoice
        const newLedger = get().ledger.map(l => 
            lineIds.includes(l.id) ? { ...l, status: 'INVOICED' as const, invoiceId: newInvoice.id } : l
        );
        set({ ledger: newLedger });
        
        useToast.getState().toast(`${type === 'CREDIT_NOTE' ? 'Credit Note' : 'Invoice'} generated`, "success");
        
        // Return the object so the UI can handle PDF generation
        return newInvoice;
    },

    createManualInvoice: async (data) => {
        const subTotal = data.lines?.reduce((acc: number, l: any) => acc + l.amount, 0) || 0;
        const newInvoice: Invoice = {
            id: Math.random().toString(36),
            type: 'INVOICE',
            reference: `MAN-24-${Math.floor(Math.random() * 1000)}`,
            dossierId: 'GENERAL', 
            clientId: data.clientId || 'UNKNOWN',
            clientName: data.clientName || 'Cash Client',
            date: new Date(),
            dueDate: new Date(),
            status: 'ISSUED',
            currency: 'MAD',
            exchangeRate: 1,
            subTotal,
            taxTotal: subTotal * 0.2, 
            total: subTotal * 1.2,
            balanceDue: subTotal * 1.2,
            lines: data.lines || []
        };
        set(state => ({ invoices: [newInvoice, ...state.invoices] }));
    },

    updateInvoiceStatus: (id, status) => {
        set(state => ({
            invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
        }));
        get().fetchGlobalStats(); 
    },

    createCreditNote: (invoiceId) => {
        const targetInv = get().invoices.find(i => i.id === invoiceId);
        if(!targetInv) return;

        // Uses Service logic implicitly via data cloning, but we can extract if needed.
        // For now, keeping simple logic here is fine as it's state manipulation.
        const cn: Invoice = {
            ...targetInv,
            id: Math.random().toString(36),
            type: 'CREDIT_NOTE',
            reference: `CN-${targetInv.reference}`,
            status: 'PAID', 
            total: -targetInv.total, 
            balanceDue: 0,
            lines: targetInv.lines.map(l => ({...l, amount: -l.amount}))
        };

        set(state => ({ invoices: [cn, ...state.invoices] }));
        useToast.getState().toast("Credit Note created.", "warning");
    }
}));