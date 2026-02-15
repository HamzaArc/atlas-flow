import { create } from 'zustand';
import { CompanySettings } from '@/types';
import { settingsService } from '@/services/settings.service';

interface SettingsState {
  company: CompanySettings;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  fetchSettings: () => Promise<void>;
  updateCompany: (settings: CompanySettings) => Promise<void>;
}

// Fallback defaults in case DB is empty or loading
const DEFAULT_SETTINGS: CompanySettings = {
  name: 'Atlas Flow',
  email: '',
  phone: '',
  website: '',
  logoUrl: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  country: '',
  zipCode: '',
  taxId: '',
  ice: '',
  rc: '',
  patente: '',
  cnss: '',
  currency: 'MAD',
  bankDetails: {
    bankName: '',
    accountName: '',
    rib: '',
    swift: '',
    iban: '',
    address: ''
  },
  footerText: '',
  termsAndConditions: ''
};

export const useSettingsStore = create<SettingsState>((set) => ({
  company: DEFAULT_SETTINGS,
  isLoading: false,
  isInitialized: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const data = await settingsService.getSettings();
      if (data) {
        set({ company: data, isInitialized: true });
      }
    } catch (err) {
      console.error("Failed to load settings from Supabase", err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateCompany: async (newSettings: CompanySettings) => {
    // Optimistic Update (Update UI immediately)
    set({ company: newSettings });

    // Background DB Update
    try {
      await settingsService.updateSettings(newSettings);
    } catch (err) {
      console.error("Failed to save settings to Supabase", err);
      // Optional: Revert state if needed, or show toast error in UI
    }
  }
}));