import { useState, useEffect } from "react";
import { 
  Ship, Plane, Truck, Copy, Trash2, 
  Plus, MoreHorizontal, AlertCircle, FileOutput, 
  RefreshCw, LayoutGrid, ArrowRightLeft, Anchor, CircleDollarSign, FileText, Container, Zap, Gauge
} from "lucide-react";

import { QuoteHeader } from "./components/QuoteHeader"; 
import { RouteSelector } from "./components/RouteSelector";
import { CargoEngine } from "./components/CargoEngine";
import { PricingTable } from "./components/PricingTable";
import { QuoteComparison } from "./components/QuoteComparison";
import { QuoteSummaryTab } from "./components/QuoteSummaryTab";
import { QuotePDF } from './components/QuotePDF';
import { AgentEmailDialog } from "./components/AgentEmailDialog";
import { QuickQuoteBuilder } from "./components/QuickQuoteBuilder"; 

import { useQuoteStore } from "@/store/useQuoteStore";
import { pdf } from '@react-pdf/renderer';
import { Quote } from "@/types/index";
import { useToast } from "@/components/ui/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface QuoteWorkspaceProps {
    onBack: () => void;
}

export default function QuoteWorkspace({ onBack }: QuoteWorkspaceProps) {
  const { 
      // Financials
      totalSellMAD, totalMarginMAD, totalSellTarget, totalTTCTarget, totalTaxTarget, quoteCurrency,
      // Data
      reference, clientName, validityDate, pol, pod, mode, incoterm,
      totalWeight, totalVolume, exchangeRates, setExchangeRate,
      // Cargo
      cargoRows, 
      // Workflow
      hasExpiredRates,
      // Options
      options, activeOptionId, setActiveOption, createOption, removeOption, duplicateOption,
      // Editor State
      editorMode, setEditorMode 
  } = useQuoteStore();

  const [viewMode, setViewMode] = useState<'EDITOR' | 'COMPARE'>('EDITOR');
  const [activeTab, setActiveTab] = useState("logistics");
  const { toast } = useToast();

  // Force Express Mode on Mount
  useEffect(() => {
      setEditorMode('EXPRESS');
  }, []);

  const marginPercent = totalSellMAD > 0 ? ((totalMarginMAD / totalSellMAD) * 100).toFixed(1) : "0.0";
  const isCriticalMode = mode === 'AIR' || mode === 'SEA_LCL';

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
        // Construct FULL Data Object including CARGO ROWS
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
            
            // INJECT CARGO DATA
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

  const getModeIcon = (m: string) => {
      if (m === 'AIR') return <Plane className="h-3 w-3" />;
      if (m === 'ROAD') return <Truck className="h-3 w-3" />;
      return <Ship className="h-3 w-3" />;
  }

  const modernCardClass = "bg-white border border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden h-full flex flex-col transition-all duration-200";

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 ml-1">
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
          </div>

          {/* VIEW TOGGLE */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 ml-4">
              <button 
                onClick={() => setEditorMode('EXPRESS')}
                className={cn(
                    "px-3 py-1.5 rounded-[6px] text-xs font-bold flex items-center gap-2 transition-all", 
                    editorMode === 'EXPRESS' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                  <Zap className="h-3.5 w-3.5" /> Express
              </button>
              <button 
                onClick={() => setEditorMode('EXPERT')}
                className={cn(
                    "px-3 py-1.5 rounded-[6px] text-xs font-bold flex items-center gap-2 transition-all", 
                    editorMode === 'EXPERT' ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                  <Gauge className="h-3.5 w-3.5" /> Expert
              </button>
          </div>
      </div>

      {/* --- CONTENT AREA --- */}
      {editorMode === 'EXPRESS' ? (
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
            {/* Pass handlers to QuickQuoteBuilder */}
            <QuickQuoteBuilder onGeneratePDF={handleGeneratePDF} />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          
          <div className="px-6 pt-4 shrink-0 flex items-center justify-between">
            <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-200/50 p-1 text-slate-500">
                <TabsTrigger value="logistics" className="gap-2 px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md transition-all">
                    <Anchor className="h-3.5 w-3.5" /> Logistics & Cargo
                </TabsTrigger>
                <TabsTrigger value="commercial" className="gap-2 px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-md transition-all">
                    <CircleDollarSign className="h-3.5 w-3.5" /> Commercial Offer
                </TabsTrigger>
                <TabsTrigger value="summary" className="gap-2 px-4 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-md transition-all">
                    <FileText className="h-3.5 w-3.5" /> Summary & Audit
                </TabsTrigger>
            </TabsList>
            
            {activeTab === 'logistics' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <AgentEmailDialog />
                </div>
            )}
          </div>

          <TabsContent value="logistics" className="flex-1 p-6 min-h-0 data-[state=inactive]:hidden animate-in fade-in duration-300 pt-4">
              <div className="h-full grid grid-cols-12 gap-6 min-h-0 w-full">
                  <div className="col-span-12 lg:col-span-4 h-full flex flex-col min-h-0">
                      <div className={modernCardClass}>
                          <RouteSelector />
                      </div>
                  </div>
                  <div className="col-span-12 lg:col-span-8 h-full flex flex-col min-h-0">
                      <div className={cn(modernCardClass, isCriticalMode && "ring-2 ring-amber-400/30 bg-amber-50/10")}>
                          <CargoEngine />
                      </div>
                  </div>
              </div>
          </TabsContent>

          <TabsContent value="commercial" className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden bg-slate-50/30 animate-in fade-in duration-300">
             
             <div className="px-6 py-3 flex justify-between items-center bg-white border-b border-slate-200 shrink-0 shadow-sm z-10">
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button onClick={() => setViewMode('EDITOR')} className={cn("px-4 py-1.5 rounded-[6px] text-xs font-bold flex items-center gap-2 transition-all", viewMode === 'EDITOR' ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                        <LayoutGrid className="h-3.5 w-3.5" /> Pricing Editor
                    </button>
                    <button onClick={() => setViewMode('COMPARE')} className={cn("px-4 py-1.5 rounded-[6px] text-xs font-bold flex items-center gap-2 transition-all", viewMode === 'COMPARE' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Compare Options
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {hasExpiredRates && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-200 ring-2 ring-red-50 animate-pulse">
                            <AlertCircle className="h-3.5 w-3.5" /> Rates Expired
                        </div>
                    )}
                    
                    <div className="h-5 w-px bg-slate-200 mx-2" />

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-slate-600 hover:text-blue-600 border-slate-200 bg-white">
                                <RefreshCw className="h-3.5 w-3.5 mr-2" /> {quoteCurrency} Rates
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4" align="end">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Currency Exchange</h4>
                                {['EUR', 'USD'].map(curr => (
                                    <div key={curr} className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-bold w-8 bg-slate-100 py-1 px-2 rounded text-slate-600">{curr}</span>
                                        <Input type="number" className="h-8 text-xs text-right font-mono" 
                                            value={exchangeRates[curr] || 0} onChange={(e) => setExchangeRate(curr, parseFloat(e.target.value))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button onClick={handleGeneratePDF} size="sm" className="h-8 text-xs bg-slate-800 text-white hover:bg-slate-900 shadow-sm">
                        <FileOutput className="h-3.5 w-3.5 mr-2" /> Preview PDF
                    </Button>
                </div>
             </div>

             <div className="flex-1 overflow-hidden relative bg-slate-50/50">
                {viewMode === 'COMPARE' ? (
                    <QuoteComparison onSelect={() => setViewMode('EDITOR')} />
                ) : (
                    <div className="h-full flex flex-col w-full">
                        <div className="flex-1 overflow-hidden p-6">
                             <div className={modernCardClass}>
                                <PricingTable />
                             </div>
                        </div>
                        
                        <div className="h-20 border-t border-slate-200 flex bg-white shrink-0 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-20 px-8 items-center">
                             <div className="w-64 flex flex-col justify-center border-r border-slate-100 pr-8">
                                 <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Estimated Margin</span>
                                 <div className="flex items-end gap-2">
                                    <span className={cn("text-2xl font-bold font-mono tracking-tighter leading-none", parseFloat(marginPercent) < 15 ? 'text-amber-500' : 'text-emerald-600')}>
                                        {totalMarginMAD.toFixed(0)}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 mb-0.5">MAD</span>
                                    <Badge variant={parseFloat(marginPercent) < 15 ? "outline" : "default"} className={cn("ml-auto text-[10px] h-5", parseFloat(marginPercent) < 15 ? "text-amber-600 border-amber-200 bg-amber-50" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100")}>
                                        {marginPercent}%
                                    </Badge>
                                 </div>
                             </div>
                             <div className="flex-1 flex items-center justify-end gap-12">
                                 <div className="text-right">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Net</div>
                                    <div className="text-lg font-bold text-slate-700 font-mono tracking-tight">
                                      {totalSellTarget.toFixed(2)} <span className="text-sm text-slate-400">{quoteCurrency}</span>
                                    </div>
                                 </div>
                                 <div className="text-right pl-10 border-l border-slate-100">
                                    <div className="text-[10px] text-blue-600 uppercase font-bold tracking-widest mb-1">Total Payable (TTC)</div>
                                    <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter leading-none">
                                      {totalTTCTarget.toFixed(2)} <span className="text-lg font-bold text-blue-500">{quoteCurrency}</span>
                                    </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                )}
             </div>
          </TabsContent>

          <TabsContent value="summary" className="flex-1 min-h-0 data-[state=inactive]:hidden animate-in fade-in duration-300">
              <div className="w-full h-full">
                  <QuoteSummaryTab />
              </div>
          </TabsContent>

        </Tabs>
      )}
    </div>
  );
}