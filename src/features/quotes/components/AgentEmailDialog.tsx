import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Copy, Check, CalendarClock, Plane, Ship, Truck } from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function AgentEmailDialog() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const { 
      reference, pol, pod, mode, incoterm,
      totalWeight, totalVolume, chargeableWeight, totalPackages, cargoRows,
      goodsDescription, hsCode, isHazmat, isReefer, temperature, 
      equipmentType, containerCount,
      cargoReadyDate, requestedDepartureDate,
      addActivity 
  } = useQuoteStore();

  const isLCL = mode === 'SEA_LCL' || mode === 'AIR' || (mode === 'ROAD' && equipmentType?.includes('LTL'));

  // --- HELPER: DATE FORMATTER ---
  const formatDate = (dateVal: string | Date | undefined) => {
      if (!dateVal) return 'TBA'; // To Be Announced
      const d = new Date(dateVal);
      // Format: DD MMM YYYY (e.g., 14 Oct 2024)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // --- GENERATE CONTENT ---
  const generateEmail = (lang: 'EN' | 'FR') => {
      // 1. HEADER DATA
      const readyDateStr = formatDate(cargoReadyDate);
      const targetDateStr = requestedDepartureDate ? formatDate(requestedDepartureDate) : (lang === 'EN' ? 'Earliest possible' : 'Dès que possible');
      
      const routeLine = `${pol || 'Origin'} ➡️ ${pod || 'Destination'}`;
      
      // 2. EQUIPMENT / CARGO SUMMARY
      let equipmentLine = '';
      if (isLCL) {
          equipmentLine = lang === 'EN' ? 'LOOSE CARGO (LCL)' : 'GROUPAGE (LCL)';
      } else {
          equipmentLine = `${containerCount}x ${equipmentType}`;
      }

      // 3. WEIGHTS & DIMS
      const grossWeight = `${totalWeight.toLocaleString()} kg`;
      const chgWeight = chargeableWeight > totalWeight ? `${chargeableWeight.toLocaleString()} kg` : 'N/A';
      const volume = `${totalVolume.toLocaleString()} m3`;
      
      const dimsList = isLCL && cargoRows.length > 0
        ? cargoRows.map(r => `   - ${r.qty}x ${r.pkgType} (${r.length}x${r.width}x${r.height} cm) - ${r.isStackable ? (lang === 'EN' ? 'Stackable' : 'Gerbable') : (lang === 'EN' ? 'Non-Stackable' : 'Non-Gerbable')}`).join('\n')
        : (lang === 'EN' ? '   (See Packing List)' : '   (Voir Liste de Colisage)');

      // 4. SPECIAL INSTRUCTIONS
      const commodity = `${goodsDescription || 'General Cargo'} ${hsCode ? `(HS: ${hsCode})` : ''}`;
      const hazard = isHazmat ? (lang === 'EN' ? "⚠️ HAZARDOUS (Class/UN required)" : "⚠️ DANGEREUX (Classe/UN requis)") : (lang === 'EN' ? "Non-Hazardous" : "Non-Dangereux");
      const temp = isReefer ? (lang === 'EN' ? `❄️ REEFER (${temperature}°C)` : `❄️ REEFER (${temperature}°C)`) : (lang === 'EN' ? "Ambient / General" : "Ambiant / Général");

      // --- ENGLISH TEMPLATE ---
      if (lang === 'EN') {
        return `Subject: RFQ: ${mode} - ${pol} to ${pod} - Ready ${readyDateStr} - Ref: ${reference}

Dear Partner,

Please provide your best spot rate availability for the following shipment.

📦 SHIPMENT DETAILS
------------------------------------------------
• Mode:           ${mode} (${incoterm})
• Route:          ${routeLine}
• Cargo Ready:    ${readyDateStr}
• Target ETD:     ${targetDateStr}

📋 CARGO SPECIFICATIONS
------------------------------------------------
• Commodity:      ${commodity}
• Equipment:      ${equipmentLine}
• Packages:       ${totalPackages} Pkgs
• Gross Weight:   ${grossWeight}
• Chargeable Wgt: ${chgWeight}
• Volume:         ${volume}
• Special:        ${hazard} | ${temp}

📏 DIMENSIONS
------------------------------------------------
${dimsList}

Please advise:
1. All-in freight charges (Air/Sea)
2. Local charges at origin/destination (if applicable)
3. Estimated Transit Time & Frequency
4. Validity of the offer

Looking forward to your swift offer.

Best regards,`;
      } 
      
      // --- FRENCH TEMPLATE ---
      else {
        return `Objet: Demande de Cotation: ${mode} - ${pol} > ${pod} - Prêt ${readyDateStr} - Ref: ${reference}

Cher Partenaire,

Merci de nous communiquer votre meilleure offre pour le flux suivant.

📦 DETAILS EXPEDITION
------------------------------------------------
• Mode:           ${mode} (${incoterm})
• Trajet:         ${routeLine}
• Dispo March.:   ${readyDateStr}
• ETD Souhaité:   ${targetDateStr}

📋 SPECIFICATIONS CARGAISON
------------------------------------------------
• Marchandise:    ${commodity}
• Equipement:     ${equipmentLine}
• Colisage:       ${totalPackages} Colis
• Poids Brut:     ${grossWeight}
• Poids Taxable:  ${chgWeight}
• Volume:         ${volume}
• Spécificités:   ${hazard} | ${temp}

📏 DIMENSIONS
------------------------------------------------
${dimsList}

Merci de nous confirmer:
1. Fret "All-in"
2. Charges locales (si applicable selon Incoterm)
3. Transit Time estimé & Fréquence
4. Validité de l'offre

Dans l'attente de votre retour rapide.

Cordialement,`;
      }
  };

  const handleCopy = (text: string, lang: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast(`Request for Quote (${lang}) copied!`, "success");
      addActivity(`Generated Agent RFQ (${lang}) for ${pol} -> ${pod}`, 'EMAIL', 'neutral');
  };

  // Icon selector
  const ModeIcon = mode === 'AIR' ? Plane : mode === 'ROAD' ? Truck : Ship;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold shadow-sm">
          <Mail className="h-3.5 w-3.5 mr-2" /> Request Rates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden gap-0">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-start">
            <div>
                <DialogTitle className="flex items-center gap-2 text-slate-800">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                        <ModeIcon className="h-5 w-5" />
                    </div>
                    Agent Rate Request
                </DialogTitle>
                <DialogDescription className="mt-1.5 ml-11 text-xs">
                    Generate a professional RFQ for your agent network based on current quote data.
                </DialogDescription>
            </div>
            <div className="text-right">
                 <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reference</div>
                 <div className="font-mono font-bold text-slate-700">{reference}</div>
            </div>
        </div>

        <Tabs defaultValue="en" className="w-full flex flex-col h-[500px]">
            <div className="px-6 py-2 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                <TabsList className="h-8 p-0.5 bg-slate-100">
                    <TabsTrigger value="en" className="text-xs px-3 py-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">🇬🇧 English</TabsTrigger>
                    <TabsTrigger value="fr" className="text-xs px-3 py-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">🇫🇷 Français</TabsTrigger>
                </TabsList>
                
                {copied ? (
                     <span className="text-xs text-emerald-600 font-bold flex items-center animate-in fade-in slide-in-from-right-2">
                        <Check className="h-3.5 w-3.5 mr-1.5"/> Copied to Clipboard
                     </span>
                ) : (
                    <span className="text-[10px] text-slate-400 italic flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" /> Includes dates & specs
                    </span>
                )}
            </div>

            <TabsContent value="en" className="flex-1 p-0 m-0 relative group">
                <Textarea 
                    readOnly 
                    className="w-full h-full resize-none border-0 p-6 font-mono text-xs leading-relaxed bg-white text-slate-700 focus-visible:ring-0" 
                    value={generateEmail('EN')} 
                />
                <div className="absolute bottom-6 right-6">
                    <Button onClick={() => handleCopy(generateEmail('EN'), 'English')} className="shadow-xl bg-slate-900 hover:bg-indigo-600 transition-all gap-2">
                        <Copy className="h-4 w-4" /> Copy English
                    </Button>
                </div>
            </TabsContent>

            <TabsContent value="fr" className="flex-1 p-0 m-0 relative group">
                <Textarea 
                    readOnly 
                    className="w-full h-full resize-none border-0 p-6 font-mono text-xs leading-relaxed bg-white text-slate-700 focus-visible:ring-0" 
                    value={generateEmail('FR')} 
                />
                <div className="absolute bottom-6 right-6">
                    <Button onClick={() => handleCopy(generateEmail('FR'), 'French')} className="shadow-xl bg-indigo-600 hover:bg-indigo-700 transition-all gap-2">
                        <Copy className="h-4 w-4" /> Copier Français
                    </Button>
                </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}