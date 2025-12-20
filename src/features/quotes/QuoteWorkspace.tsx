import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    FileOutput, Box, Lock, MoreHorizontal, Plus, Copy, Trash2, 
    Plane, Ship, Truck, AlertCircle, RefreshCw, Settings2, 
    ChevronUp, ChevronDown, ArrowRightLeft, LayoutGrid, Maximize2,
    Wand2
} from "lucide-react";
import { QuoteHeader } from "./components/QuoteHeader"; 
import { RouteSelector } from "./components/RouteSelector";
import { CargoEngine } from "./components/CargoEngine";
import { PricingTable } from "./components/PricingTable";
import { QuoteComparison } from "./components/QuoteComparison";
import { ActivityLogWidget } from "./components/ActivityLogWidget"; // IMPORT NEW WIDGET
import { useQuoteStore } from "@/store/useQuoteStore";
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from './components/QuotePDF';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface QuoteWorkspaceProps {
    onBack: () => void;
}

export default function QuoteWorkspace({ onBack }: QuoteWorkspaceProps) {
  const { 
      // Financials
      totalSellMAD, totalMarginMAD, totalSellTarget, totalTTCTarget, quoteCurrency,
      // Data
      items, pol, pod, mode, incoterm, reference, clientName, validityDate,
      exchangeRates, setExchangeRate, totalWeight, totalVolume, marginBuffer,
      // Workflow
      approval, status, submitForApproval, hasExpiredRates,
      // Options
      options, activeOptionId, setActiveOption, createOption, removeOption, duplicateOption,
      // Actions
      applyTemplate
  } = useQuoteStore();

  // --- LAYOUT STATE ---
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(false); 
  const [isLogOpen, setIsLogOpen] = useState(false); // NEW STATE FOR WIDGET
  const [viewMode, setViewMode] = useState<'EDITOR' | 'COMPARE'>('EDITOR');

  const marginPercent = totalSellMAD > 0 ? ((totalMarginMAD / totalSellMAD) * 100).toFixed(1) : "0.0";
  const activeOption = options.find(o => o.id === activeOptionId);
  const optionName = activeOption?.name || mode;
  const isReadOnly = status !== 'DRAFT';

  const handleGeneratePDF = async () => {
    const blob = await pdf(
      <QuotePDF 
        reference={reference} clientName={clientName || "Unknown Client"} pol={pol} pod={pod} mode={mode} incoterm={incoterm} items={items} totalHT={totalSellTarget} totalTax={0} totalTTC={totalTTCTarget} currency={quoteCurrency} validityDate={new Date(validityDate).toLocaleDateString()} weight={totalWeight} volume={totalVolume} exchangeRates={exchangeRates} marginBuffer={marginBuffer} optionName={optionName}
      />
    ).toBlob();
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const getModeIcon = (m: string) => {
      if (m === 'AIR') return <Plane className="h-3 w-3" />;
      if (m === 'ROAD') return <Truck className="h-3 w-3" />;
      return <Ship className="h-3 w-3" />;
  }

  // --- SUMMARY STRIP RENDERER ---
  const SummaryStrip = () => (
      <div className="w-full h-12 bg-white border-b border-slate-200 flex items-center justify-between px-6 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                    {getModeIcon(mode)} <span className="ml-1.5">{mode}</span>
                  </Badge>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span>{pol.split('(')[0]}</span>
                      <ArrowRightLeft className="h-3 w-3 text-slate-300" />
                      <span>{pod.split('(')[0]}</span>
                  </div>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{totalWeight}</span> kg
                  </div>
                  <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{totalVolume}</span> m³
                  </div>
                  <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{incoterm}</span>
                  </div>
              </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsDetailsCollapsed(false)} className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              Show Details <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
      </div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      <QuoteHeader onBack={onBack} />

      {/* --- OPTION TABS & TOOLBAR --- */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-20">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-r flex-1">
              {options.map((opt, idx) => (
                  <div key={opt.id} onClick={() => { setActiveOption(opt.id); setViewMode('EDITOR'); }}
                    className={cn(
                        "group flex items-center gap-2 px-3 py-1.5 rounded-[4px] border text-xs font-medium cursor-pointer transition-all select-none",
                        activeOptionId === opt.id && viewMode === 'EDITOR'
                            ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                            : "bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:border-slate-200"
                    )}
                  >
                      {getModeIcon(opt.mode)}
                      <span className="truncate max-w-[120px]">{opt.name || `Option ${idx+1}`}</span>
                      {activeOptionId === opt.id && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 opacity-50 hover:opacity-100">
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => duplicateOption(opt.id)}><Copy className="h-3 w-3 mr-2" /> Duplicate</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => removeOption(opt.id)} className="text-red-600"><Trash2 className="h-3 w-3 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                  </div>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => createOption('SEA_LCL')}><Ship className="h-3 w-3 mr-2"/> Sea Freight</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => createOption('AIR')}><Plane className="h-3 w-3 mr-2"/> Air Freight</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
              <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                  <button onClick={() => setViewMode('EDITOR')} className={cn("px-2 py-1 rounded-[3px] text-[10px] font-bold flex items-center gap-1.5 transition-all", viewMode === 'EDITOR' ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                      <LayoutGrid className="h-3 w-3" /> Editor
                  </button>
                  <button onClick={() => setViewMode('COMPARE')} className={cn("px-2 py-1 rounded-[3px] text-[10px] font-bold flex items-center gap-1.5 transition-all", viewMode === 'COMPARE' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                      <ArrowRightLeft className="h-3 w-3" /> Compare
                  </button>
              </div>
              {viewMode === 'EDITOR' && (
                  <Button variant="ghost" size="sm" onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)} className={cn("h-7 text-[10px] gap-1", isDetailsCollapsed ? "text-blue-600 bg-blue-50" : "text-slate-500")}>
                      {isDetailsCollapsed ? <Maximize2 className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                  </Button>
              )}
          </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-h-0 relative">
          
          {viewMode === 'COMPARE' && (
              <div className="flex-1 overflow-hidden z-10 bg-slate-50">
                  <QuoteComparison onSelect={() => setViewMode('EDITOR')} />
              </div>
          )}

          {viewMode === 'EDITOR' && (
             <>
                {/* 1. TOP PANEL (Route & Cargo) */}
                {isDetailsCollapsed ? <SummaryStrip /> : (
                    <div className="shrink-0 h-[45%] min-h-[300px] border-b border-slate-200 bg-slate-100/50 flex flex-col transition-all duration-300 ease-in-out">
                        <div className="flex-1 grid grid-cols-2 gap-0 min-h-0">
                            <div className="h-full border-r border-slate-200 overflow-hidden p-4">
                                <RouteSelector />
                            </div>
                            <div className="h-full overflow-hidden p-4">
                                <CargoEngine />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SPLIT VIEW: MAIN TABLE + LOG WIDGET */}
                <div className="flex-1 flex min-h-0 bg-white shadow-xl z-10 relative">
                     {/* LEFT: PRICING TABLE (FLEX-1) */}
                     <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                         {hasExpiredRates && (
                            <div className="bg-red-50 border-b border-red-100 px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-red-700">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span className="font-semibold">Rates Expired:</span> Update required.
                            </div>
                         )}
                         
                         {/* TABLE HEADER */}
                         <div className="px-5 py-2 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                             <div className="flex items-center gap-3">
                                <div className="h-7 w-7 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                                    <Box className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Commercial Offer</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 font-medium">Pricing</span>
                                        {approval.requiresApproval && <Badge variant="outline" className="text-[9px] h-4 px-1 text-amber-600 bg-amber-50 border-amber-200">Approval Req.</Badge>}
                                    </div>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-2">
                                {!isReadOnly && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-7 text-xs border-dashed border-blue-200 text-blue-600 hover:bg-blue-50">
                                                <Wand2 className="h-3 w-3 mr-1.5" /> Template
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>Auto-Fill Pricing</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => applyTemplate('IMPORT_STD')}>Import Standard</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => applyTemplate('EXPORT_STD')}>Export Standard</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}

                                <div className="h-4 w-px bg-slate-200 mx-1" />

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-blue-600">
                                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> {quoteCurrency}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-4" align="end">
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase">Exchange Rates</h4>
                                            {['EUR', 'USD'].map(curr => (
                                                <div key={curr} className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold w-8">{curr}</span>
                                                    <Input type="number" className="h-7 text-xs text-right" 
                                                        value={exchangeRates[curr] || 0} onChange={(e) => setExchangeRate(curr, parseFloat(e.target.value))}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                
                                <Button onClick={handleGeneratePDF} size="sm" className="h-7 text-xs bg-slate-800 text-white hover:bg-slate-700 ml-2">
                                    <FileOutput className="h-3.5 w-3.5 mr-2" /> Preview
                                </Button>
                             </div>
                         </div>

                         {/* THE TABLE */}
                         <div className="flex-1 overflow-hidden relative">
                             <PricingTable />
                         </div>

                         {/* FOOTER TOTALS */}
                         <div className="h-14 border-t border-slate-200 flex bg-white shrink-0">
                             <div className="w-48 border-r border-slate-100 flex flex-col justify-center px-4 bg-slate-50/50">
                                 <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Margin</span>
                                 <div className="flex items-baseline gap-2">
                                    <span className={`text-lg font-bold font-mono tracking-tight ${parseFloat(marginPercent) < 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {totalMarginMAD.toFixed(0)}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">MAD ({marginPercent}%)</span>
                                 </div>
                             </div>
                             <div className="flex-1 flex items-center justify-end px-6 gap-8">
                                 <div className="text-right">
                                    <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total Net</div>
                                    <div className="text-sm font-bold text-slate-700 font-mono">
                                      {totalSellTarget.toFixed(2)} {quoteCurrency}
                                    </div>
                                 </div>
                                 <div className="text-right pl-6 border-l border-slate-100">
                                    <div className="text-[9px] text-blue-600 uppercase font-bold tracking-wider">Total Payable</div>
                                    <div className="text-2xl font-black text-blue-700 font-mono tracking-tight leading-none">
                                      {totalTTCTarget.toFixed(2)} <span className="text-sm font-bold text-blue-300">{quoteCurrency}</span>
                                    </div>
                                 </div>
                             </div>
                         </div>
                     </div>

                     {/* RIGHT: ACTIVITY LOG WIDGET */}
                     <ActivityLogWidget isOpen={isLogOpen} onToggle={() => setIsLogOpen(!isLogOpen)} />

                </div>
             </>
          )}
      </div>
    </div>
  );
}