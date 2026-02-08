import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'MAD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
}

// Generates a valid UUID v4 to satisfy Supabase requirements
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- SHARED LOGISTICS CONSTANTS ---

export type LocationData = { 
  id: string; 
  country: string;
  code: string;
  tier?: boolean;
  type: 'PORT' | 'AIRPORT';
  // Coordinates for map visualization (approximate for SVG map)
  mapLat?: number;
  mapLon?: number;
  realLat?: number;
  realLon?: number;
};

// 1. EXTENDED SEA PORTS (Europe, Asia, Turkey, Middle East, Morocco)
export const PORT_DB: LocationData[] = [
  // Morocco
  { id: "CASABLANCA", country: "Morocco", code: "MACAS", type: 'PORT', mapLat: 8.0, mapLon: -16.0 },
  { id: "TANGER MED", country: "Morocco", code: "MAPTM", tier: true, type: 'PORT', mapLat: 10.3, mapLon: -13.9 },
  { id: "AGADIR", country: "Morocco", code: "MAAGA", type: 'PORT', mapLat: 4.8, mapLon: -18.0 },
  { id: "JORF LASFAR", country: "Morocco", code: "MAJFL", type: 'PORT', mapLat: 7.0, mapLon: -16.5 },
  
  // Europe
  { id: "ROTTERDAM", country: "Netherlands", code: "NLRTM", tier: true, type: 'PORT', mapLat: 26.3, mapLon: -3.9 },
  { id: "HAMBURG", country: "Germany", code: "DEHAM", type: 'PORT', mapLat: 27.9, mapLon: 1.6 },
  { id: "ANTWERP", country: "Belgium", code: "BEANR", type: 'PORT', mapLat: 25.8, mapLon: -4.5 },
  { id: "LE HAVRE", country: "France", code: "FRLEH", type: 'PORT', mapLat: 22.0, mapLon: -8.0 },
  { id: "MARSEILLE", country: "France", code: "FRMRS", type: 'PORT', mapLat: 17.7, mapLon: -3.0 },
  { id: "VALENCIA", country: "Spain", code: "ESVLC", type: 'PORT', mapLat: 13.9, mapLon: -8.8 },
  { id: "ALGECIRAS", country: "Spain", code: "ESALG", type: 'PORT', mapLat: 10.5, mapLon: -13.5 },
  { id: "GENOA", country: "Italy", code: "ITGOA", type: 'PORT', mapLat: 18.5, mapLon: 1.0 },
  { id: "PIRAEUS", country: "Greece", code: "GRPIR", type: 'PORT', mapLat: 14.0, mapLon: 12.0 },
  { id: "FELIXSTOWE", country: "UK", code: "GBFXT", type: 'PORT', mapLat: 27.0, mapLon: -10.0 },

  // Turkey
  { id: "ISTANBUL (AMBARLI)", country: "Turkey", code: "TRIST", type: 'PORT', mapLat: 16.0, mapLon: 15.0 },
  { id: "MERSIN", country: "Turkey", code: "TRMER", type: 'PORT', mapLat: 12.0, mapLon: 20.0 },
  { id: "IZMIR", country: "Turkey", code: "TRIZM", type: 'PORT', mapLat: 14.0, mapLon: 14.5 },

  // Middle East
  { id: "JEBEL ALI", country: "UAE", code: "AEJEA", tier: true, type: 'PORT', mapLat: -0.3, mapLon: 46.9 },
  { id: "JEDDAH", country: "Saudi Arabia", code: "SAJED", type: 'PORT', mapLat: 2.0, mapLon: 28.0 },
  { id: "DAMMAM", country: "Saudi Arabia", code: "SADMM", type: 'PORT', mapLat: 0.5, mapLon: 42.0 },
  { id: "SALALAH", country: "Oman", code: "OMSLL", type: 'PORT', mapLat: -5.0, mapLon: 45.0 },

  // Asia
  { id: "SHANGHAI", country: "China", code: "CNSHA", tier: true, type: 'PORT', mapLat: 5.6, mapLon: 113.1 },
  { id: "NINGBO", country: "China", code: "CNNGB", type: 'PORT', mapLat: 4.3, mapLon: 113.2 },
  { id: "SINGAPORE", country: "Singapore", code: "SGSIN", tier: true, type: 'PORT', mapLat: -24.25, mapLon: 95.4 },
  { id: "BUSAN", country: "South Korea", code: "KRPUS", type: 'PORT', mapLat: 8.0, mapLon: 118.0 },
  { id: "NHAVA SHEVA", country: "India", code: "INNSA", type: 'PORT', mapLat: 2.0, mapLon: 65.0 },

  // Americas (Legacy)
  { id: "NEW YORK", country: "USA", code: "USNYC", tier: true, type: 'PORT', mapLat: 15.1, mapLon: -82.4 },
  { id: "SANTOS", country: "Brazil", code: "BRSSZ", type: 'PORT', mapLat: -49.55, mapLon: -54.73 },
];

// 2. NEW AIRPORTS LIST (Europe, Asia, Turkey, ME, Morocco)
export const AIRPORT_DB: LocationData[] = [
  // Morocco
  { id: "CASABLANCA (CMN)", country: "Morocco", code: "CMN", type: 'AIRPORT', mapLat: 8.0, mapLon: -16.0 },
  { id: "MARRAKECH (RAK)", country: "Morocco", code: "RAK", type: 'AIRPORT', mapLat: 6.0, mapLon: -16.5 },
  { id: "TANGIER (TNG)", country: "Morocco", code: "TNG", type: 'AIRPORT', mapLat: 10.3, mapLon: -13.9 },

  // Europe
  { id: "FRANKFURT (FRA)", country: "Germany", code: "FRA", tier: true, type: 'AIRPORT', mapLat: 25.0, mapLon: 2.0 },
  { id: "PARIS (CDG)", country: "France", code: "CDG", tier: true, type: 'AIRPORT', mapLat: 22.0, mapLon: -6.0 },
  { id: "LONDON (LHR)", country: "UK", code: "LHR", tier: true, type: 'AIRPORT', mapLat: 26.0, mapLon: -10.0 },
  { id: "AMSTERDAM (AMS)", country: "Netherlands", code: "AMS", type: 'AIRPORT', mapLat: 26.5, mapLon: -3.5 },
  { id: "MADRID (MAD)", country: "Spain", code: "MAD", type: 'AIRPORT', mapLat: 15.0, mapLon: -10.0 },
  { id: "BARCELONA (BCN)", country: "Spain", code: "BCN", type: 'AIRPORT', mapLat: 16.0, mapLon: -7.0 },
  { id: "MILAN (MXP)", country: "Italy", code: "MXP", type: 'AIRPORT', mapLat: 19.0, mapLon: 2.0 },
  { id: "ROME (FCO)", country: "Italy", code: "FCO", type: 'AIRPORT', mapLat: 16.0, mapLon: 4.0 },
  { id: "ZURICH (ZRH)", country: "Switzerland", code: "ZRH", type: 'AIRPORT', mapLat: 20.0, mapLon: 2.0 },
  { id: "LIEGE (LGG)", country: "Belgium", code: "LGG", type: 'AIRPORT', mapLat: 25.0, mapLon: -4.0 },

  // Turkey
  { id: "ISTANBUL (IST)", country: "Turkey", code: "IST", tier: true, type: 'AIRPORT', mapLat: 16.5, mapLon: 15.0 },
  { id: "ISTANBUL SABIHA (SAW)", country: "Turkey", code: "SAW", type: 'AIRPORT', mapLat: 16.0, mapLon: 15.5 },
  { id: "ANTALYA (AYT)", country: "Turkey", code: "AYT", type: 'AIRPORT', mapLat: 13.0, mapLon: 16.0 },

  // Middle East
  { id: "DUBAI (DXB)", country: "UAE", code: "DXB", tier: true, type: 'AIRPORT', mapLat: -0.3, mapLon: 46.9 },
  { id: "DOHA (DOH)", country: "Qatar", code: "DOH", type: 'AIRPORT', mapLat: 0.5, mapLon: 45.0 },
  { id: "RIYADH (RUH)", country: "Saudi Arabia", code: "RUH", type: 'AIRPORT', mapLat: 1.0, mapLon: 40.0 },
  { id: "JEDDAH (JED)", country: "Saudi Arabia", code: "JED", type: 'AIRPORT', mapLat: 2.0, mapLon: 28.0 },
  { id: "CAIRO (CAI)", country: "Egypt", code: "CAI", type: 'AIRPORT', mapLat: 5.0, mapLon: 18.0 },

  // Asia
  { id: "HONG KONG (HKG)", country: "Hong Kong", code: "HKG", tier: true, type: 'AIRPORT', mapLat: 6.0, mapLon: 110.0 },
  { id: "SHANGHAI (PVG)", country: "China", code: "PVG", type: 'AIRPORT', mapLat: 5.6, mapLon: 113.1 },
  { id: "BEIJING (PEK)", country: "China", code: "PEK", type: 'AIRPORT', mapLat: 12.0, mapLon: 112.0 },
  { id: "SINGAPORE (SIN)", country: "Singapore", code: "SIN", tier: true, type: 'AIRPORT', mapLat: -24.25, mapLon: 95.4 },
  { id: "TOKYO (NRT)", country: "Japan", code: "NRT", type: 'AIRPORT', mapLat: 10.0, mapLon: 120.0 },
  { id: "SEOUL (ICN)", country: "South Korea", code: "ICN", type: 'AIRPORT', mapLat: 11.0, mapLon: 118.0 },
  { id: "MUMBAI (BOM)", country: "India", code: "BOM", type: 'AIRPORT', mapLat: 2.0, mapLon: 65.0 },
  { id: "DELHI (DEL)", country: "India", code: "DEL", type: 'AIRPORT', mapLat: 8.0, mapLon: 68.0 },
];