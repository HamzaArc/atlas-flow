import { useState } from "react";
import { 
  Ship, Plane, Truck, Copy, Trash2, 
  Plus, MoreHorizontal, 
  ArrowRightLeft, Container
} from "lucide-react";

import { QuoteHeader } from "./components/QuoteHeader"; 
import { QuoteComparison } from "./components/QuoteComparison";
import { QuotePDF } from './components/QuotePDF';
import { QuickQuoteBuilder } from "./components/QuickQuoteBuilder"; 

import { useQuoteStore } from "@/store/useQuoteStore";
import { pdf } from '@react-pdf/renderer';
import { Quote } from "@/types/index";
import { useToast } from "@/components/ui/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface QuoteWorkspaceProps {
    onBack: () => void;
}

export default function QuoteWorkspace({ onBack }: QuoteWorkspaceProps) {
  const { 
      // Financials
      totalSellTarget, totalTTCTarget, totalTaxTarget,
      // Data
      reference, clientName, validityDate, pol, pod, mode, incoterm,
      totalWeight, totalVolume,
      // Cargo
      cargoRows, 
      // Options
      options, activeOptionId, setActiveOption, createOption, removeOption, duplicateOption
  } = useQuoteStore();

  const [viewMode, setViewMode] = useState<'EDITOR' | 'COMPARE'>('EDITOR');
  const { toast } = useToast();

  const getModeIcon = (m: string) => {
      if (m === 'AIR') return <Plane className="h-3 w-3" />;
      if (m === 'ROAD') return <Truck className="h-3 w-3" />;
      return <Ship className="h-3 w-3" />;
  }

  // --- PDF GENERATION ---
  const handleGeneratePDF = async () => {
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
        toast("Popup Blocked! Please allow popups.", "error");
        return;
    }

    newWindow.document.write(`
        <html>
            <head><title>Generating Quote...</title></head>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;background:#f1f5f9;">
                <div style="text-align:center;">
                    <div style="font-size:20px;font-weight:600;color:#0f172a;margin-bottom:8px;">Generating PDF...</div>
                </div>
            </body>
        </html>
    `);

    try {
        const pdfData: Quote = {
            id: 'preview-mode',
            reference: reference,
            masterReference: reference,
            version: 1,
            status: 'DRAFT',
            
            clientId: 'preview',
            clientName: clientName || 'Unknown Client',
            paymentTerms: '30 Days',
            salespersonId: 'user-1',
            salespersonName: 'Youssef (Sales)',

            validityDate: new Date(validityDate),
            cargoReadyDate: new Date(),

            pol, pod, mode, incoterm,
            
            cargoRows: cargoRows || [], 
            totalWeight,
            totalVolume,
            
            totalSellTarget,
            totalTaxTarget,
            totalTTCTarget,

            activeOptionId,
            options,

            goodsDescription: '',
            packagingType: 'PALLETS',
            isHazmat: false,
            isReefer: false,
            isStackable: false,
            insuranceRequired: false,
            probability: 'MEDIUM',
            internalNotes: '',
            activities: [],
            approval: { requiresApproval: false, triggers: [], reason: null }
        };

        const blob = await pdf(<QuotePDF data={pdfData} />).toBlob();
        const url = URL.createObjectURL(blob);
        newWindow.location.href = url;
        
    } catch (error) {
        console.error("PDF Fail:", error);
        newWindow.close();
        toast("Failed to generate PDF.", "error");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50/50 overflow-hidden font-sans">
      <QuoteHeader onBack={onBack} />

      {/* --- TOP BAR: OPTIONS & VIEW TOGGLE --- */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)] z-10">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-r flex-1">
              {options.map((opt, idx) => (
                  <div key={opt.id} onClick={() => { setActiveOption(opt.id); setViewMode('EDITOR'); }}
                    className={cn(
                        "group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all select-none",
                        activeOptionId === opt.id
                            ? "bg-blue-50/50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-100" 
                            : "bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:border-slate-200"
                    )}
                  >
                      {getModeIcon(opt.mode)}
                      <span className="truncate max-w-[120px]">{opt.name || `Option ${idx+1}`}</span>
                      {activeOptionId === opt.id && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 opacity-50 hover:opacity-100 rounded-full">
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => duplicateOption(opt.id)}><Copy className="h-3 w-3 mr-2" /> Duplicate</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => removeOption(opt.id)} className="text-red-600"><Trash2 className="h-3 w-3 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                  </div>
              ))}
              
              <div className="h-5 w-px bg-slate-200 mx-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => createOption('SEA_LCL')}><Ship className="h-3 w-3 mr-2"/> Sea LCL</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => createOption('SEA_FCL')}><Container className="h-3 w-3 mr-2"/> Sea FCL</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => createOption('AIR')}><Plane className="h-3 w-3 mr-2"/> Air Freight</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => createOption('ROAD')}><Truck className="h-3 w-3 mr-2"/> Road Freight</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'EDITOR' ? 'COMPARE' : 'EDITOR')}
                className={cn(
                    "ml-2 h-8 text-xs font-medium border-slate-200",
                    viewMode === 'COMPARE' ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                  <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                  Compare
              </Button>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2">
             {/* PDF Button removed as requested */}
          </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50">
          {viewMode === 'COMPARE' ? (
              <QuoteComparison onSelect={() => setViewMode('EDITOR')} />
          ) : (
              <QuickQuoteBuilder onGeneratePDF={handleGeneratePDF} />
          )}
      </div>
    </div>
  );
}