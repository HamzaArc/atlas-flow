import { create } from 'zustand';
import { ChargeLine, Invoice, ChargeType, Currency, VatRule, InvoiceStatus } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '@/features/finance/components/InvoicePDF';
import React from 'react';

// --- MOCK DATA FOR DEMO ---
const MOCK_LEDGER: ChargeLine[] = [
    {
        id: '1', dossierId: '1', type: 'EXPENSE', code: 'OF', description: 'Ocean Freight (Buy)',
        vendorName: 'MAERSK', currency: 'USD', amount: 1200, exchangeRate: 10.0, amountLocal: 12000,
        vatRule: 'EXPORT_0_ART92', vatRate: 0, vatAmount: 0, totalAmount: 12000, 
        status: 'ACCRUED', isBillable: true, createdAt: new Date()
    },
    {
        id: '2', dossierId: '1', type: 'INCOME', code: 'OF', description: 'Ocean Freight (Sell)',
        currency: 'USD', amount: 1550, exchangeRate: 10.0, amountLocal: 15500,
        vatRule: 'EXPORT_0_ART92', vatRate: 0, vatAmount: 0, totalAmount: 15500, 
        status: 'READY_TO_INVOICE', isBillable: true, createdAt: new Date()
    },
    {
        id: '3', dossierId: '1', type: 'EXPENSE', code: 'THC', description: 'THC Origin',
        vendorName: 'MARSA MAROC', currency: 'MAD', amount: 1600, exchangeRate: 1.0, amountLocal: 1600,
        vatRule: 'STD_20', vatRate: 0.2, vatAmount: 320, totalAmount: 1920, 
        status: 'ACCRUED', isBillable: true, createdAt: new Date()
    },
    {
        id: '4', dossierId: '1', type: 'INCOME', code: 'THC', description: 'THC Origin (Rebill)',
        currency: 'MAD', amount: 1850, exchangeRate: 1.0, amountLocal: 1850,
        vatRule: 'STD_20', vatRate: 0.2, vatAmount: 370, totalAmount: 2220, 
        status: 'READY_TO_INVOICE', isBillable: true, createdAt: new Date()
    }
];

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

    // Global KPIs (Fixes TS2339)
    globalRevenue: number;
    globalOverdue: number;
    globalMargin: number;
    
    // Actions
    loadLedger: (dossierId: string) => void;
    fetchGlobalStats: () => void;
    
    addCharge: (charge: Partial<ChargeLine>) => void;
    updateCharge: (id: string, updates: Partial<ChargeLine>) => void;
    deleteCharge: (id: string) => void;
    
    generateInvoice: (dossierId: string, lineIds: string[], type?: 'INVOICE' | 'CREDIT_NOTE') => Promise<void>;
    createManualInvoice: (invoice: Partial<Invoice>) => Promise<void>;
    updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
    createCreditNote: (invoiceId: string) => void;
}

const calculateVat = (amount: number, rule: VatRule): number => {
    switch(rule) {
        case 'STD_20': return amount * 0.20;
        case 'ROAD_14': return amount * 0.14;
        default: return 0;
    }
};

const getVatRate = (rule: VatRule): number => {
    switch(rule) {
        case 'STD_20': return 0.20;
        case 'ROAD_14': return 0.14;
        default: return 0;
    }
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    ledger: [],
    invoices: [],
    dossierStats: { revenue: 0, cost: 0, margin: 0, marginPercent: 0 },
    globalRevenue: 0,
    globalOverdue: 0,
    globalMargin: 0,

    loadLedger: (dossierId) => {
        // In real app, fetch from Supabase. Using Mock for now.
        const dossierLines = MOCK_LEDGER.filter(l => l.dossierId === dossierId || l.dossierId === '1'); 
        
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
        // Mocking aggregation for dashboard
        set({ 
            globalRevenue: 145000, 
            globalOverdue: 12000, 
            globalMargin: 18.5 
        });
    },

    addCharge: (charge) => {
        const vatAmt = calculateVat(charge.amount || 0, charge.vatRule as VatRule || 'STD_20');
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
            vatRule: charge.vatRule as VatRule || 'STD_20',
            vatRate: getVatRate(charge.vatRule as VatRule || 'STD_20'),
            vatAmount: vatAmt, 
            totalAmount: ((charge.amount || 0) + vatAmt) * exRate, // Simple local conversion logic
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
            const newVatRule = updates.vatRule !== undefined ? updates.vatRule : l.vatRule;
            
            const vatAmt = calculateVat(newAmount, newVatRule as VatRule);
            
            return { 
                ...l, 
                ...updates,
                amount: newAmount,
                exchangeRate: newRate,
                amountLocal: newAmount * newRate,
                vatAmount: vatAmt,
                totalAmount: (newAmount + vatAmt) * newRate // Simplified
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
        if (selectedLines.length === 0) return;

        // Validation: Ensure all lines have same currency
        const currency = selectedLines[0].currency;
        if(selectedLines.some(l => l.currency !== currency)) {
            useToast.getState().toast("Error: Cannot invoice mixed currencies.", "error");
            return;
        }

        const subTotal = selectedLines.reduce((acc, l) => acc + l.amount, 0);
        const taxTotal = selectedLines.reduce((acc, l) => acc + l.vatAmount, 0);
        const total = subTotal + taxTotal;

        const newInvoice: Invoice = {
            id: Math.random().toString(36),
            reference: `${type === 'CREDIT_NOTE' ? 'CN' : 'INV'}-24-${Math.floor(Math.random() * 1000)}`,
            type: type as any,
            dossierId,
            clientId: 'cli_1',
            clientName: 'TexNord SARL',
            date: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            // Correct status assignment from new Type Union
            status: 'ISSUED',
            currency: currency,
            exchangeRate: selectedLines[0].exchangeRate,
            subTotal,
            taxTotal,
            total: type === 'CREDIT_NOTE' ? -total : total,
            balanceDue: type === 'CREDIT_NOTE' ? 0 : total,
            lines: selectedLines
        };

        set(state => ({ invoices: [newInvoice, ...state.invoices] }));
        
        // Lock lines and link to invoice
        const newLedger = get().ledger.map(l => 
            lineIds.includes(l.id) ? { ...l, status: 'INVOICED' as const, invoiceId: newInvoice.id } : l
        );
        set({ ledger: newLedger });
        
        // PDF Gen
        try {
            const blob = await pdf(<InvoicePDF invoice={newInvoice} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            useToast.getState().toast(`${type === 'CREDIT_NOTE' ? 'Credit Note' : 'Invoice'} generated`, "success");
        } catch (e) {
            console.error(e);
            useToast.getState().toast("Failed to generate PDF", "error");
        }
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