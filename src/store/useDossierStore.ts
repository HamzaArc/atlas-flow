import { create } from 'zustand';
import { Dossier } from '@/types/index';

interface Container {
  id: string;
  number: string;
  type: '20DV' | '40HC' | '40RH';
  seal: string;
  weight: number;
  packages: number;
  status: 'GATE_IN' | 'LOADED' | 'ON_WATER' | 'DISCHARGED' | 'DELIVERED';
}

interface DossierState {
  dossier: Dossier;
  containers: Container[];
  
  // Actions
  setStatus: (status: Dossier['status']) => void;
  updateContainerStatus: (id: string, status: Container['status']) => void;
}

// MOCK DATA STARTING STATE
const MOCK_DOSSIER: Dossier = {
    id: '1',
    ref: 'IMP-24-0056',
    status: 'ON_WATER',
    mblNumber: 'MAEU123456789',
    vesselName: 'CMA CGM JULES VERNE',
    eta: new Date('2024-12-05'), // 5 Days from now
    dischargeDate: undefined,
    freeTimeEnd: new Date('2024-12-12') // 7 Days after ETA
};

const MOCK_CONTAINERS: Container[] = [
    { id: 'c1', number: 'MSKU9012345', type: '40HC', seal: '123456', weight: 12500, packages: 500, status: 'ON_WATER' },
    { id: 'c2', number: 'MRKU8812001', type: '40HC', seal: '123457', weight: 12400, packages: 480, status: 'ON_WATER' }
];

export const useDossierStore = create<DossierState>((set) => ({
  dossier: MOCK_DOSSIER,
  containers: MOCK_CONTAINERS,

  setStatus: (status) => set((state) => ({ 
    dossier: { ...state.dossier, status } 
  })),

  updateContainerStatus: (id, status) => set((state) => ({
    containers: state.containers.map(c => c.id === id ? { ...c, status } : c)
  }))
}));