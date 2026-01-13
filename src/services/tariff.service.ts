import { supabase } from '@/lib/supabase';
import { SupplierRate, RateCharge } from '@/types/tariff';

export const TariffService = {
    fetchAll: async (): Promise<SupplierRate[]> => {
        const { data: tariffs, error } = await supabase
            .from('tariffs')
            .select(`*, tariff_charges (*)`)
            .order('valid_from', { ascending: false }); // Newest first

        if (error) throw error;
        if (!tariffs || tariffs.length === 0) return [];

        // 1. Raw Map
        const mappedRates = tariffs.map((t: any) => mapToModel(t));

        // 2. "Real" Volatility & Intelligence Calculation
        // Group by Unique Lane + Carrier Key
        const historyMap = new Map<string, SupplierRate[]>();
        
        mappedRates.forEach(rate => {
            const key = `${rate.pol}-${rate.pod}-${rate.carrierName}-${rate.mode}`;
            if (!historyMap.has(key)) historyMap.set(key, []);
            historyMap.get(key)?.push(rate);
        });

        // Analyze history to flag volatility
        historyMap.forEach((history) => {
            // Sort by Date (Oldest to Newest)
            history.sort((a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime());

            for (let i = 1; i < history.length; i++) {
                const current = history[i];
                const prev = history[i - 1];

                // Calculate Base Freight (40HC)
                const currPrice = getBaseFreight(current);
                const prevPrice = getBaseFreight(prev);

                if (prevPrice > 0 && currPrice > 0) {
                    const diff = currPrice - prevPrice;
                    const percent = (diff / prevPrice) * 100;
                    
                    // Mark as Volatile if Jump > 10%
                    if (percent > 10) {
                        current.volatilityFlag = true;
                        current.previousRateRef = prev.reference;
                    }
                }
                
                // Reliability Score: Based on Data Completeness (0-5)
                let score = 3; // Base score
                if (current.transitTime > 0) score += 1;
                if (current.freeTime > 0) score += 1;
                if (current.originCharges.length === 0 && current.incoterm !== 'FOB') score -= 1; 
                current.reliabilityScore = Math.max(1, Math.min(5, score));
            }
        });

        return mappedRates;
    },

    save: async (rate: SupplierRate): Promise<void> => {
        const payload: any = {
            reference: rate.reference,
            carrier_name: rate.carrierName,
            carrier_id: rate.carrierId || null, // Ensure explicit null if missing
            mode: rate.mode,
            type: rate.type,
            status: rate.status,
            pol: rate.pol,
            pod: rate.pod,
            valid_from: rate.validFrom,
            valid_to: rate.validTo,
            transit_time: rate.transitTime || 0,
            currency: rate.currency,
            incoterm: rate.incoterm,
            updated_at: new Date()
        };

        // FIXED: Treat 'spot-' prefix as a new record (let DB generate UUID)
        const isNewRecord = rate.id.startsWith('new') || rate.id.startsWith('spot-');

        if (!isNewRecord) {
            payload.id = rate.id;
        }

        const { data: savedTariff, error: tariffError } = await supabase
            .from('tariffs')
            .upsert(payload)
            .select()
            .single();

        if (tariffError) throw tariffError;

        const tariffId = savedTariff.id;

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

        // Clean up old charges and insert new ones
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

// --- Helpers ---

function getBaseFreight(rate: SupplierRate): number {
    return rate.freightCharges.reduce((acc, c) => acc + (c.price40HC || c.unitPrice || 0), 0);
}

function mapToModel(t: any): SupplierRate {
    return {
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
        incoterm: t.incoterm || 'CY/CY',
        freeTime: t.free_time,
        paymentTerms: t.payment_terms,
        remarks: t.remarks,
        updatedAt: new Date(t.updated_at),
        volatilityFlag: false, 
        reliabilityScore: 0, 
        
        freightCharges: mapCharges(t.tariff_charges, 'FREIGHT'),
        originCharges: mapCharges(t.tariff_charges, 'ORIGIN'),
        destCharges: mapCharges(t.tariff_charges, 'DESTINATION'),
    };
}

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