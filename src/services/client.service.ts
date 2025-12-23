import { 
    Client, 
    ClientContact, 
    ClientRoute, 
    ClientDocument, 
    ClientSupplier, 
    ClientCommodity, 
    OperationalProfile 
} from '@/types/index';

// --- MOCK DATA ---
const MOCK_DB_CLIENTS: Client[] = [
    {
        id: 'cli_1', created_at: '2023-01-15T10:00:00Z', entityName: 'TexNord SARL', status: 'ACTIVE', type: 'SHIPPER',
        email: 'logistics@texnord.ma', phone: '+212 522 00 00 00', website: 'www.texnord.ma',
        city: 'Casablanca', country: 'Morocco', 
        billingAddress: '123 Ind. Zone Sidi Maarouf, Casablanca',
        deliveryAddress: 'Unit 4, Parc Industriel Sapino, Nouaceur',
        creditLimit: 500000, 
        unbilledWork: 45000,
        unpaidInvoices: 80000,
        salesRepId: 'Youssef (Sales)', tags: ['VIP', 'Textile', 'Export'],
        contacts: [
            { id: 'ct_1', name: 'Ahmed Bennani', role: 'Logistics Manager', email: 'ahmed@texnord.ma', phone: '+212 600 11 22 33', isPrimary: true }
        ], 
        routes: [
            { id: 'rt_1', origin: 'CASABLANCA', destination: 'LE HAVRE', mode: 'SEA', incoterm: 'CIF', equipment: '40HC', volume: 50, volumeUnit: 'TEU', frequency: 'WEEKLY' },
            { id: 'rt_2', origin: 'CASABLANCA', destination: 'BARCELONA', mode: 'ROAD', incoterm: 'DAP', equipment: 'FTL', volume: 12, volumeUnit: 'TRK', frequency: 'MONTHLY' }
        ],
        documents: [
            { id: 'doc_1', name: 'Commercial Contract 2024.pdf', type: 'CONTRACT', uploadDate: new Date('2024-01-01'), size: '2.4 MB', url: '#' }
        ],
        suppliers: [
            { id: 'sup_1', name: 'Maersk', role: 'SEA_LINE', tier: 'STRATEGIC' },
            { id: 'sup_2', name: 'CMA CGM', role: 'SEA_LINE', tier: 'APPROVED' },
            { id: 'sup_3', name: 'DHL Aviation', role: 'AIRLINE', tier: 'BACKUP' },
            // NEW SOURCE SUPPLIER
            { 
                id: 'sup_source_1', 
                name: 'Zhejiang Textile Co.', 
                role: 'EXPORTER', 
                tier: 'STRATEGIC',
                country: 'China',
                city: 'Ningbo',
                address: 'No. 888 Industry Road, Yinzhou District',
                contactName: 'Ms. Li Mei',
                email: 'export@zhejiangtex.cn',
                phone: '+86 574 0000 1111',
                products: 'Polyester Fabric, Yarn'
            }
        ],
        commodities: [
            { id: 'com_1', name: 'Raw Cotton Fabric', sector: 'TEXTILE', isHazmat: false },
            { id: 'com_2', name: 'Industrial Dyes', sector: 'INDUSTRIAL', isHazmat: true }
        ],
        operational: {
            hsCodes: ['5208.10', '5209.42'],
            requiresHazmat: true,
            requiresReefer: false,
            requiresOOG: false,
            customsRegime: 'STANDARD',
            negotiatedFreeTime: 14
        },
        activities: [
            { id: 'a1', category: 'NOTE', text: 'Meeting with CEO next Tuesday regarding Q3 targets.', meta: 'Youssef', timestamp: new Date('2024-01-20'), tone: 'neutral' }
        ], 
        financials: { 
            paymentTerms: 'NET_60', 
            vatNumber: '12345678', 
            currency: 'MAD', 
            ice: '001528829000054', 
            rc: '34992',
            patente: '112233',
            cnss: '9876543',
            averageDaysToPay: 65,
            adminFee: 350,
            adminFeeCurrency: 'MAD',
            tollFee: 150
        }
    }
];

export const ClientService = {
    fetchAll: async (): Promise<Client[]> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve([...MOCK_DB_CLIENTS]), 600);
        });
    },

    save: async (client: Client): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), 600);
        });
    },

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