import { create } from 'zustand';
import { ChargeLine, Invoice, Currency, VatRule } from '@/types/index';
import { useToast } from "@/components/ui/use-toast";
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '@/features/finance/components/InvoicePDF';
import React from 'react';

// --- MOCK GLOBAL DATA ---
const MOCK_GLOBAL_INVOICES: Invoice[] = [
    {
        id: 'inv-001', reference: 'INV-24-1001', dossierId: '1', clientId: 'cli_1', clientName: 'TexNord SARL',
        date: new Date('2024-01-15'), dueDate: new Date('2024-02-15'), status: 'OVERDUE', currency: 'MAD',
        subTotal: 12000, taxTotal: 2400, total: 14400, lines: []
    },
    {
        id: 'inv-002', reference: 'INV-24-1002', dossierId: '2', clientId: 'cli_2', clientName: 'AgriSouss',
        date: new Date('2024-02-01'), dueDate: new Date('2024-03-01'), status: 'PAID', currency: 'MAD',
        subTotal: 8500, taxTotal: 1700, total: 10200, lines: []
    },
    {
        id: 'inv-003', reference: 'INV-24-1003', dossierId: '1', clientId: 'cli_1', clientName: 'TexNord SARL',
        date: new Date(), dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), status: 'ISSUED', currency: 'MAD',
        subTotal: 4500, taxTotal: 900, total: 5400, lines: []
    }
];

interface FinanceState {
    ledger: ChargeLine[];
    invoices: Invoice[];
    
    // Dossier-Specific KPIs
    totalRevenue: number;
    totalCost: number;
    totalMargin: number;
    marginPercent: number;

    // Global KPIs
    globalRevenue: number;
    globalOverdue: number;
    globalMargin: number;
    
    // Actions
    loadLedger: (dossierId: string) => void;
    fetchGlobalStats: () => void; // NEW: For Dashboard
    
    // CRUD Charges
    addCharge: (charge: Partial<ChargeLine>) => void;
    updateCharge: (id: string, updates: Partial<ChargeLine>) => void;
    deleteCharge: (id: string) => void;
    
    // Invoice Workflow
    generateInvoice: (dossierId: string, lineIds: string[]) => Promise<void>;
    createManualInvoice: (invoice: Partial<Invoice>) => Promise<void>; // NEW
    updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
    createCreditNote: (invoiceId: string) => void;
}

const MOCK_LEDGER: ChargeLine[] = [
    {
        id: '1', dossierId: '1', type: 'EXPENSE', code: 'OF', description: 'Ocean Freight (Buy)',
        vendorName: 'MAERSK', currency: 'USD', amount: 1200, exchangeRate: 10.0, amountLocal: 12000,
        vatRule: 'EXPORT_0_ART92', vatAmount: 0, totalAmount: 1200, status: 'ACCRUED', isBillable: true
    },
    {
        id: '2', dossierId: '1', type: 'INCOME', code: 'OF', description: 'Ocean Freight (Sell)',
        currency: 'USD', amount: 1550, exchangeRate: 10.0, amountLocal: 15500,
        vatRule: 'EXPORT_0_ART92', vatAmount: 0, totalAmount: 1550, status: 'ESTIMATED', isBillable: true
    },
    {
        id: '3', dossierId: '1', type: 'EXPENSE', code: 'THC', description: 'THC Origin',
        vendorName: 'MARSA MAROC', currency: 'MAD', amount: 1600, exchangeRate: 1.0, amountLocal: 1600,
        vatRule: 'STD_20', vatAmount: 320, totalAmount: 1920, status: 'INVOICED', isBillable: true
    },
    {
        id: '4', dossierId: '1', type: 'INCOME', code: 'THC', description: 'THC Origin (Rebill)',
        currency: 'MAD', amount: 1850, exchangeRate: 1.0, amountLocal: 1850,
        vatRule: 'STD_20', vatAmount: 370, totalAmount: 2220, status: 'ESTIMATED', isBillable: true
    }
];

export const useFinanceStore = create<FinanceState>((set, get) => ({
    ledger: [],
    invoices: MOCK_GLOBAL_INVOICES,
    totalRevenue: 0,
    totalCost: 0,
    totalMargin: 0,
    marginPercent: 0,
    globalRevenue: 0,
    globalOverdue: 0,
    globalMargin: 0,

    fetchGlobalStats: () => {
        // Simulating aggregation from DB
        const invs = get().invoices;
        const overdue = invs.filter(i => i.status === 'OVERDUE').reduce((acc, c) => acc + c.total, 0);
        // Revenue is mocked as sum of all invoices for this demo
        const revenue = invs.reduce((acc, c) => acc + c.total, 0);
        
        set({ 
            globalRevenue: 142500, // Mocked WIP from unbilled ledger
            globalOverdue: overdue,
            globalMargin: 18.4 
        });
    },

    loadLedger: (dossierId) => {
        const dossierLines = MOCK_LEDGER.filter(l => l.dossierId === '1'); 
        
        let rev = 0;
        let cost = 0;
        
        dossierLines.forEach(l => {
            if(l.type === 'INCOME') rev += l.amountLocal;
            else cost += l.amountLocal;
        });

        const margin = rev - cost;
        const percent = rev > 0 ? (margin / rev) * 100 : 0;

        set({ 
            ledger: dossierLines,
            totalRevenue: rev,
            totalCost: cost,
            totalMargin: margin,
            marginPercent: parseFloat(percent.toFixed(1))
        });
    },

    addCharge: (charge) => {
        const newLine: ChargeLine = {
            id: Math.random().toString(36).substr(2,9),
            dossierId: '1', 
            type: charge.type || 'EXPENSE',
            code: charge.code || 'MISC',
            description: charge.description || 'New Charge',
            vendorName: charge.vendorName || '',
            currency: charge.currency || 'MAD',
            amount: charge.amount || 0,
            exchangeRate: charge.exchangeRate || 1,
            amountLocal: (charge.amount || 0) * (charge.exchangeRate || 1),
            vatRule: charge.vatRule || 'STD_20',
            vatAmount: 0, 
            totalAmount: charge.amount || 0,
            status: 'ESTIMATED',
            isBillable: true,
            ...charge
        };
        
        const newLedger = [...get().ledger, newLine];
        set({ ledger: newLedger });
        get().loadLedger('1');
        useToast.getState().toast("Charge added successfully.", "success");
    },

    updateCharge: (id, updates) => {
        const newLedger = get().ledger.map(l => l.id === id ? { ...l, ...updates } : l);
        set({ ledger: newLedger });
        get().loadLedger('1');
        useToast.getState().toast("Charge updated.", "info");
    },

    deleteCharge: (id) => {
        set({ ledger: get().ledger.filter(l => l.id !== id) });
        get().loadLedger('1');
        useToast.getState().toast("Charge removed.", "info");
    },

    generateInvoice: async (dossierId, lineIds) => {
        const selectedLines = get().ledger.filter(l => lineIds.includes(l.id));
        if (selectedLines.length === 0) return;

        const subTotal = selectedLines.reduce((acc, curr) => acc + curr.amount, 0);
        
        const newInvoice: Invoice = {
            id: Math.random().toString(36),
            reference: `INV-24-${Math.floor(Math.random() * 1000)}`,
            dossierId,
            clientId: 'cli_1',
            clientName: 'TexNord SARL',
            date: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            status: 'ISSUED',
            currency: selectedLines[0].currency,
            subTotal,
            taxTotal: subTotal * 0.2, 
            total: subTotal * 1.2,
            lines: selectedLines
        };

        set(state => ({ invoices: [newInvoice, ...state.invoices] }));
        
        const newLedger = get().ledger.map(l => 
            lineIds.includes(l.id) ? { ...l, status: 'INVOICED' as const, invoiceRef: newInvoice.reference } : l
        );
        
        set({ ledger: newLedger });
        
        try {
            const blob = await pdf(<InvoicePDF invoice={newInvoice} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            useToast.getState().toast(`Invoice ${newInvoice.reference} generated`, "success");
        } catch (e) {
            console.error(e);
            useToast.getState().toast("Failed to generate PDF", "error");
        }
    },

    createManualInvoice: async (data) => {
        const subTotal = data.lines?.reduce((acc, l) => acc + l.amount, 0) || 0;
        
        const newInvoice: Invoice = {
            id: Math.random().toString(36),
            reference: `MAN-24-${Math.floor(Math.random() * 1000)}`,
            dossierId: 'GENERAL', // Not linked to dossier
            clientId: data.clientId || 'UNKNOWN',
            clientName: data.clientName || 'Cash Client',
            date: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            status: 'ISSUED',
            currency: 'MAD',
            subTotal,
            taxTotal: subTotal * 0.2, 
            total: subTotal * 1.2,
            lines: data.lines || []
        };

        set(state => ({ invoices: [newInvoice, ...state.invoices] }));
        
        // Generate PDF
        try {
            const blob = await pdf(<InvoicePDF invoice={newInvoice} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            useToast.getState().toast(`Manual Invoice ${newInvoice.reference} created`, "success");
        } catch (e) {
            useToast.getState().toast("Failed to generate PDF", "error");
        }
    },

    updateInvoiceStatus: (id, status) => {
        const newInvoices = get().invoices.map(inv => 
            inv.id === id ? { ...inv, status } : inv
        );
        set({ invoices: newInvoices });
        get().fetchGlobalStats(); // Refresh dashboard
        useToast.getState().toast(`Invoice status updated to ${status}`, "info");
    },

    createCreditNote: (invoiceId) => {
        const targetInv = get().invoices.find(i => i.id === invoiceId);
        if(!targetInv) return;

        const cn: Invoice = {
            ...targetInv,
            id: Math.random().toString(36),
            reference: `CN-${targetInv.reference}`,
            status: 'PAID', 
            total: -targetInv.total, 
            lines: targetInv.lines.map(l => ({...l, amount: -l.amount}))
        };

        set(state => ({ invoices: [cn, ...state.invoices] }));
        useToast.getState().toast("Credit Note created.", "warning");
    }
}));