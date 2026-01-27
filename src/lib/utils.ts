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

export type PortData = { 
  id: string; 
  country: string;
  code: string;
  tier?: boolean;
};

export const PORT_DB: PortData[] = [
  { id: "CASABLANCA (MAP)", country: "Morocco", code: "MACAS" },
  { id: "TANGER MED (MAP)", country: "Morocco", code: "MAPTM", tier: true },
  { id: "AGADIR (MAP)", country: "Morocco", code: "MAAGA" },
  { id: "ROTTERDAM (NL)", country: "Netherlands", code: "NLRTM", tier: true },
  { id: "HAMBURG (DE)", country: "Germany", code: "DEHAM" },
  { id: "VALENCIA (ES)", country: "Spain", code: "ESVLC" },
  { id: "MARSEILLE (FR)", country: "France", code: "FRMRS" },
  { id: "SHANGHAI (CN)", country: "China", code: "CNSHA", tier: true },
  { id: "NINGBO (CN)", country: "China", code: "CNNGB" },
  { id: "DUBAI (AE)", country: "UAE", code: "AEDXB", tier: true },
  { id: "SINGAPORE (SG)", country: "Singapore", code: "SGSIN", tier: true },
  { id: "NEW YORK (US)", country: "USA", code: "USNYC", tier: true },
  { id: "LOS ANGELES (US)", country: "USA", code: "USLAX" },
  { id: "SANTOS (BR)", country: "Brazil", code: "BRSSZ" },
];