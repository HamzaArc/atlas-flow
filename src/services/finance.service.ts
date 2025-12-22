import { ChargeLine, Invoice, ChargeType, Currency, VatRule, InvoiceStatus } from '@/types/index';

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

export const FinanceService = {
    
    fetchLedger: async (dossierId: string): Promise<ChargeLine[]> => {
        return MOCK_LEDGER.filter(l => l.dossierId === dossierId || l.dossierId === '1');
    },

    calculateVat: (amount: number, rule: VatRule): number => {
        switch(rule) {
            case 'STD_20': return amount * 0.20;
            case 'ROAD_14': return amount * 0.14;
            default: return 0;
        }
    },

    getVatRate: (rule: VatRule): number => {
        switch(rule) {
            case 'STD_20': return 0.20;
            case 'ROAD_14': return 0.14;
            default: return 0;
        }
    },

    /**
     * Constructs the Invoice Object from selected lines.
     * Logic Only. No PDF generation.
     */
    buildInvoiceObject: (dossierId: string, lines: ChargeLine[], type: 'INVOICE' | 'CREDIT_NOTE' = 'INVOICE'): Invoice => {
        const subTotal = lines.reduce((acc, l) => acc + l.amount, 0);
        const taxTotal = lines.reduce((acc, l) => acc + l.vatAmount, 0);
        const total = subTotal + taxTotal;
        
        return {
            id: Math.random().toString(36),
            reference: `${type === 'CREDIT_NOTE' ? 'CN' : 'INV'}-24-${Math.floor(Math.random() * 1000)}`,
            type: type,
            dossierId,
            clientId: 'cli_1',
            clientName: 'TexNord SARL',
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