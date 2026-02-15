import { supabase } from '@/lib/supabase';
import { CompanySettings, BankDetails } from '@/types';

export const settingsService = {
  /**
   * Fetches the company settings.
   * We assume there is only one row in the table for the single tenant.
   */
  async getSettings(): Promise<CompanySettings | null> {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }

    if (!data) return null;

    // Map DB columns (snake_case) to App types (camelCase)
    return {
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      website: data.website || '',
      logoUrl: data.logo_url || '',
      
      addressLine1: data.address_line1 || '',
      addressLine2: data.address_line2 || '',
      city: data.city || '',
      country: data.country || '',
      zipCode: data.zip_code || '',
      
      taxId: data.tax_id || '',
      ice: data.ice || '',
      rc: data.rc || '',
      patente: data.patente || '',
      cnss: data.cnss || '',
      
      currency: data.currency || 'MAD',
      
      // JSONB column comes back as object
      bankDetails: (data.bank_details as BankDetails) || {
        bankName: '',
        accountName: '',
        rib: '',
        swift: '',
        iban: '',
        address: ''
      },
      
      footerText: data.footer_text || '',
      termsAndConditions: data.terms_and_conditions || ''
    };
  },

  /**
   * Updates the company settings.
   * Uses the first row found or creates one if missing (edge case).
   */
  async updateSettings(settings: CompanySettings): Promise<boolean> {
    // 1. Map App types (camelCase) back to DB columns (snake_case)
    const dbPayload = {
      name: settings.name,
      email: settings.email,
      phone: settings.phone,
      website: settings.website,
      logo_url: settings.logoUrl,
      
      address_line1: settings.addressLine1,
      address_line2: settings.addressLine2,
      city: settings.city,
      country: settings.country,
      zip_code: settings.zipCode,
      
      tax_id: settings.taxId,
      ice: settings.ice,
      rc: settings.rc,
      patente: settings.patente,
      cnss: settings.cnss,
      currency: settings.currency,
      
      bank_details: settings.bankDetails, // JSONB
      
      footer_text: settings.footerText,
      terms_and_conditions: settings.termsAndConditions,
      
      updated_at: new Date().toISOString()
    };

    // 2. We need the ID of the row to update. 
    // Since we only have one row, we can fetch it first or update where ID is not null (if we knew the ID).
    // A safer way for single-row tables:
    
    // First, get the existing ID
    const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .limit(1)
        .single();

    let error;

    if (existing) {
        // Update existing
        const { error: updateErr } = await supabase
            .from('company_settings')
            .update(dbPayload)
            .eq('id', existing.id);
        error = updateErr;
    } else {
        // Insert new (shouldn't happen if SQL step 4 was run)
        const { error: insertErr } = await supabase
            .from('company_settings')
            .insert([dbPayload]);
        error = insertErr;
    }

    if (error) {
      console.error('Error updating settings:', error);
      return false;
    }

    return true;
  }
};