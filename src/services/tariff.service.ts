import { supabase } from '@/lib/supabase';
import { SupplierRate, RateCharge } from '@/types/tariff';

export const TariffService = {
    // 1. Fetch all rates - STRICTLY DB ONLY
    fetchAll: async (): Promise<SupplierRate[]> => {
        const { data: tariffs, error } = await supabase
            .from('tariffs')
            .select(`
                *,
                tariff_charges (*)
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // If no data, return empty array immediately (No Mocks!)
        if (!tariffs || tariffs.length === 0) return [];

        return tariffs.map((t: any) => ({
            id: t.id,
            reference: t.reference,
            carrierId: t.carrier_id,
            carrierName: t.carrier_name,
            mode: t.mode,
            type: t.type,
            status: t.status,
            validFrom: new Date(t.valid_from),
            validTo: new Date(t.valid_to),
            pol: t.pol,
            pod: t.pod,
            transitTime: t.transit_time,
            serviceLoop: t.service_loop,
            currency: t.currency,
            incoterm: t.incoterm || 'CY/CY', // Default if missing
            freeTime: t.free_time,
            paymentTerms: t.payment_terms,
            remarks: t.remarks,
            updatedAt: new Date(t.updated_at),
            
            freightCharges: mapCharges(t.tariff_charges, 'FREIGHT'),
            originCharges: mapCharges(t.tariff_charges, 'ORIGIN'),
            destCharges: mapCharges(t.tariff_charges, 'DESTINATION'),
        }));
    },

    // 2. Save Rate
    save: async (rate: SupplierRate): Promise<void> => {
        // A. Upsert Parent
        const payload: any = {
            reference: rate.reference,
            carrier_name: rate.carrierName,
            mode: rate.mode,
            type: rate.type,
            status: rate.status,
            pol: rate.pol,
            pod: rate.pod,
            valid_from: rate.validFrom,
            valid_to: rate.validTo,
            transit_time: rate.transitTime,
            currency: rate.currency,
            incoterm: rate.incoterm, // Saving the new field
            updated_at: new Date()
        };

        if (!rate.id.startsWith('new')) {
            payload.id = rate.id;
        }

        const { data: savedTariff, error: tariffError } = await supabase
            .from('tariffs')
            .upsert(payload)
            .select()
            .single();

        if (tariffError) throw tariffError;

        const tariffId = savedTariff.id;

        // B. Replace Charges
        const allCharges = [
            ...rate.freightCharges.map(c => ({ ...c, section: 'FREIGHT' })),
            ...rate.originCharges.map(c => ({ ...c, section: 'ORIGIN' })),
            ...rate.destCharges.map(c => ({ ...c, section: 'DESTINATION' }))
        ].map(c => ({
            tariff_id: tariffId,
            charge_head: c.chargeHead,
            basis: c.basis,
            is_surcharge: c.isSurcharge,
            price_20dv: c.price20DV || 0,
            price_40dv: c.price40DV || 0,
            price_40hc: c.price40HC || 0,
            price_40rf: c.price40RF || 0,
            unit_price: c.unitPrice || 0,
            min_price: c.minPrice || 0,
            currency: c.currency,
            vat_rule: c.vatRule,
            section: c.section
        }));

        await supabase.from('tariff_charges').delete().eq('tariff_id', tariffId);
        
        if (allCharges.length > 0) {
            const { error: chargesError } = await supabase
                .from('tariff_charges')
                .insert(allCharges);
            if (chargesError) throw chargesError;
        }
    },

    delete: async (id: string): Promise<void> => {
        const { error } = await supabase.from('tariffs').delete().eq('id', id);
        if (error) throw error;
    },

    createChargeRow: (currency: string = 'USD'): RateCharge => ({
        id: Math.random().toString(36).substr(2, 9),
        chargeHead: '', 
        isSurcharge: false,
        basis: 'CONTAINER',
        price20DV: 0, price40DV: 0, price40HC: 0, price40RF: 0,
        unitPrice: 0, minPrice: 0, percentage: 0,
        currency: currency,
        vatRule: 'STD_20'
    })
};

function mapCharges(dbRows: any[], section: string): RateCharge[] {
    if (!dbRows) return [];
    return dbRows
        .filter(r => r.section === section)
        .map(r => ({
            id: r.id,
            chargeHead: r.charge_head,
            isSurcharge: r.is_surcharge,
            basis: r.basis,
            price20DV: r.price_20dv,
            price40DV: r.price_40dv,
            price40HC: r.price_40hc,
            price40RF: r.price_40rf,
            unitPrice: r.unit_price,
            minPrice: r.min_price,
            percentage: 0,
            currency: r.currency,
            vatRule: r.vat_rule
        }));
}