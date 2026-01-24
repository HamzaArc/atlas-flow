import { create } from 'zustand';
import { ChargeLine, Invoice, InvoiceStatus, VatRule } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";
import { FinanceService } from '@/services/finance.service';
import { generateUUID } from '@/lib/utils';

interface FinanceState {
    ledger: ChargeLine[];
    invoices: Invoice[];
    dossierStats: {
        revenue: number;
        cost: number;
        margin: number;
        marginPercent: number;
    };
    globalRevenue: number;
    globalOverdue: number;
    globalMargin: number;
    
    loadLedger: (dossierId: string) => Promise<void>;
    fetchGlobalStats: () => void;
    addCharge: (charge: Partial<ChargeLine>) => Promise<void>;
    updateCharge: (id: string, updates: Partial<ChargeLine>) => Promise<void>;
    deleteCharge: (id: string) => Promise<void>;
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
        try {
            const dossierLines = await FinanceService.fetchLedger(dossierId);
            const dossierInvoices = await FinanceService.fetchInvoices(dossierId);

            let rev = 0;
            let cost = 0;
            
            // Calculate totals based on 'amountLocal' (Net amount in base currency)
            dossierLines.forEach(l => {
                if(l.type === 'INCOME') rev += l.amountLocal;
                else cost += l.amountLocal;
            });
            const margin = rev - cost;
            const marginPercent = rev > 0 ? (margin / rev) * 100 : 0;

            // --- CRITICAL FIX: Persist calculated financials to Dossier Registry ---
            // This ensures the Dashboard sees the updated values immediately
            try {
                await FinanceService.syncDossierFinancials(dossierId, rev, cost);
            } catch (syncErr) {
                console.error("Failed to sync financials to dossier", syncErr);
                // We do not block the UI for this background sync
            }

            set({ 
                ledger: dossierLines,
                invoices: dossierInvoices,
                dossierStats: { revenue: rev, cost, margin, marginPercent: parseFloat(marginPercent.toFixed(1)) }
            });
        } catch (e) {
            console.error("Failed to load finance data", e);
            useToast.getState().toast("Failed to load financials.", "error");
        }
    },

    fetchGlobalStats: () => {
        set({ 
            globalRevenue: 145000, 
            globalOverdue: 12000, 
            globalMargin: 18.5 
        });
    },

    addCharge: async (charge) => {
        const vatRule = (charge.vatRule as VatRule) || 'STD_20';
        const vatAmt = FinanceService.calculateVat(charge.amount || 0, vatRule);
        const exRate = charge.exchangeRate || 1;
        
        // FIX: Use provided rate if available, otherwise get default from rule (which now returns 20, 14, etc)
        const finalRate = charge.vatRate !== undefined ? charge.vatRate : FinanceService.getVatRate(vatRule);

        const safeId = generateUUID();

        const newLine: Partial<ChargeLine> = {
            ...charge,
            id: safeId,
            dossierId: charge.dossierId, 
            type: charge.type || 'EXPENSE',
            code: charge.code || 'MISC',
            description: charge.description || 'New Charge',
            vendorName: charge.vendorName,
            currency: charge.currency || 'MAD',
            amount: charge.amount || 0,
            exchangeRate: exRate,
            amountLocal: (charge.amount || 0) * exRate,
            vatRule: vatRule,
            vatRate: finalRate, // Uses the percentage
            vatAmount: vatAmt, 
            totalAmount: ((charge.amount || 0) + vatAmt) * exRate,
            status: charge.type === 'EXPENSE' ? 'ACCRUED' : 'ESTIMATED',
            isBillable: true,
            createdAt: new Date()
        };
        
        // Optimistic
        const tempLine = newLine as ChargeLine;
        set(state => ({ ledger: [tempLine, ...state.ledger] }));

        try {
            await FinanceService.upsertCharge(newLine);
            useToast.getState().toast("Charge saved.", "success");
            
            if (charge.dossierId) {
                await get().loadLedger(charge.dossierId);
            }
        } catch (e: any) {
             useToast.getState().toast("Failed to save charge: " + e.message, "error");
             set(state => ({ ledger: state.ledger.filter(l => l.id !== safeId) }));
        }
    },

    updateCharge: async (id, updates) => {
        const currentLine = get().ledger.find(l => l.id === id);
        if (!currentLine) return;

        const newAmount = updates.amount !== undefined ? updates.amount : currentLine.amount;
        const newRate = updates.exchangeRate !== undefined ? updates.exchangeRate : currentLine.exchangeRate;
        const newVatRule = (updates.vatRule as VatRule) !== undefined ? (updates.vatRule as VatRule) : currentLine.vatRule;
        
        // FIX: Respect incoming rate update
        const newVatPercent = updates.vatRate !== undefined ? updates.vatRate : currentLine.vatRate;

        const vatAmt = FinanceService.calculateVat(newAmount, newVatRule);
        
        const merged: Partial<ChargeLine> = { 
            ...currentLine, 
            ...updates,
            amount: newAmount,
            exchangeRate: newRate,
            amountLocal: newAmount * newRate,
            vatRule: newVatRule,
            vatRate: newVatPercent,
            vatAmount: vatAmt,
            totalAmount: (newAmount + vatAmt) * newRate 
        };
        
        try {
            await FinanceService.upsertCharge(merged);
            useToast.getState().toast("Ledger updated.", "info");
             if (currentLine.dossierId) {
                await get().loadLedger(currentLine.dossierId);
            }
        } catch (e) {
            useToast.getState().toast("Update failed.", "error");
        }
    },

    deleteCharge: async (id) => {
        const line = get().ledger.find(l => l.id === id);
        if (!line) return;
        
        set(state => ({ ledger: state.ledger.filter(l => l.id !== id) }));

        try {
            await FinanceService.deleteCharge(id);
             // Also refresh ledger to trigger sync (if dossierId available)
             if (line.dossierId) {
                await get().loadLedger(line.dossierId);
             }
        } catch (e) {
             useToast.getState().toast("Deletion failed.", "error");
             set(state => ({ ledger: [...state.ledger, line] }));
        }
    },

    generateInvoice: async (dossierId, lineIds, type = 'INVOICE') => {
        const selectedLines = get().ledger.filter(l => lineIds.includes(l.id));
        if (selectedLines.length === 0) return null;

        const currency = selectedLines[0].currency;
        if(selectedLines.some(l => l.currency !== currency)) {
            useToast.getState().toast("Error: Cannot invoice mixed currencies.", "error");
            return null;
        }

        try {
            const invoiceObj = FinanceService.buildInvoiceObject(dossierId, selectedLines, type);
            
            const savedInvoice = await FinanceService.createInvoice(invoiceObj);
            
            useToast.getState().toast(`${type === 'CREDIT_NOTE' ? 'Credit Note' : 'Invoice'} generated`, "success");
            
            await get().loadLedger(dossierId);
            return savedInvoice;
        } catch (e: any) {
            useToast.getState().toast("Invoice generation failed: " + e.message, "error");
            return null;
        }
    },

    createManualInvoice: async (_data) => {
        useToast.getState().toast("Manual Invoice creation not fully implemented yet.", "warning");
    },

    updateInvoiceStatus: (id, status) => {
        set(state => ({
            invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
        }));
        get().fetchGlobalStats(); 
    },

    createCreditNote: (_invoiceId) => {
        useToast.getState().toast("Please select lines and use 'Generate Credit Note'", "info");
    }
}));