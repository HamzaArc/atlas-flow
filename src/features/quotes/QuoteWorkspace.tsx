import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileOutput, Box, Lock, MoreHorizontal } from "lucide-react";
import { QuoteHeader } from "./components/QuoteHeader"; 
import { RouteSelector } from "./components/RouteSelector";
import { CargoEngine } from "./components/CargoEngine";
import { PricingTable } from "./components/PricingTable";
import { ActivityFeed } from "./components/ActivityFeed";
import { useQuoteStore } from "@/store/useQuoteStore";
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from './components/QuotePDF';
import { Badge } from "@/components/ui/badge";

interface QuoteWorkspaceProps {
    onBack: () => void;
}

export default function QuoteWorkspace({ onBack }: QuoteWorkspaceProps) {
  const { 
      // Financials
      totalSellMAD, totalMarginMAD, 
      totalSellTarget, totalTaxTarget, totalTTCTarget, quoteCurrency,
      
      // Data for PDF
      items, pol, pod, mode, incoterm, reference, clientName, validityDate,
      exchangeRates, totalWeight, totalVolume, marginBuffer
  } = useQuoteStore();

  const marginPercent = totalSellMAD > 0 
    ? ((totalMarginMAD / totalSellMAD) * 100).toFixed(1) 
    : "0.0";

  const handleGeneratePDF = async () => {
    const blob = await pdf(
      <QuotePDF 
        reference={reference}
        clientName={clientName || "Unknown Client"}
        pol={pol}
        pod={pod}
        mode={mode}
        incoterm={incoterm}
        items={items}
        totalHT={totalSellTarget}
        totalTax={totalTaxTarget}
        totalTTC={totalTTCTarget}
        currency={quoteCurrency}
        validityDate={new Date(validityDate).toLocaleDateString()}
        weight={totalWeight}
        volume={totalVolume}
        exchangeRates={exchangeRates}
        marginBuffer={marginBuffer}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
      
      {/* 1. TOP NAVIGATION - Passed onBack */}
      <QuoteHeader onBack={onBack} />

      {/* 2. SPLIT LAYOUT: Operations (Top) / Collaboration (Bottom) */}
      <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* TOP SECTION: OPERATIONS (65%) */}
          <div className="h-[65%] p-6 pb-3 overflow-hidden">
              <div className="grid grid-cols-12 gap-6 h-full">
                  
                  {/* LEFT: Route */}
                  <div className="col-span-3 flex flex-col h-full overflow-hidden">
                      <RouteSelector />
                  </div>

                  {/* MIDDLE: Pricing */}
                  <div className="col-span-6 flex flex-col h-full">
                       <Card className="flex-1 flex flex-col overflow-hidden bg-white shadow-md ring-1 ring-slate-200/60 border-none">
                          {/* Toolbar */}
                          <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                    <Box className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm">Commercial Offer</h3>
                                    <p className="text-[10px] text-slate-400 font-medium">Pricing & Margins</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="h-8 text-xs bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50 hover:text-blue-700">
                                    <FileOutput className="h-3.5 w-3.5 mr-2" /> Preview
                                </Button>
                             </div>
                          </div>
                          
                          {/* Table */}
                          <div className="flex-1 overflow-hidden relative bg-slate-50/30">
                              <PricingTable />
                          </div>

                          {/* Footer */}
                          <div className="h-20 border-t border-slate-100 flex z-10 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] shrink-0">
                             {/* Internal Margin */}
                             <div className="w-1/3 bg-slate-50/50 border-r border-slate-100 p-3 flex flex-col justify-center relative group">
                                 <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1 rounded bg-slate-200/50"><Lock className="h-3 w-3 text-slate-500" /></div>
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Margin</span>
                                 </div>
                                 <div className="flex items-baseline gap-3">
                                    <span className={`text-xl font-bold font-mono tracking-tight ${parseFloat(marginPercent) < 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {totalMarginMAD.toFixed(2)}
                                    </span>
                                    <Badge variant="secondary" className={`h-5 px-1.5 text-[10px] border ${parseFloat(marginPercent) < 15 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                        {marginPercent}%
                                    </Badge>
                                 </div>
                             </div>

                             {/* Totals */}
                             <div className="flex-1 flex items-center justify-end px-6 gap-6">
                                 <div className="text-right">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Net</div>
                                    <div className="text-base font-bold text-slate-700 font-mono">
                                      {totalSellTarget.toFixed(2)} <span className="text-[10px] text-slate-400 font-sans font-normal">{quoteCurrency}</span>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
                                     <div className="text-right">
                                        <div className="text-[10px] text-blue-600 uppercase font-bold tracking-wider mb-0.5">Payable</div>
                                        <div className="text-2xl font-extrabold text-blue-700 font-mono tracking-tight leading-none">
                                          {totalTTCTarget.toFixed(2)} 
                                        </div>
                                     </div>
                                     <span className="text-xs font-bold text-blue-200 self-end mb-1">{quoteCurrency}</span>
                                 </div>
                             </div>
                          </div>
                       </Card>
                  </div>

                  {/* RIGHT: Cargo */}
                  <div className="col-span-3 flex flex-col h-full overflow-hidden">
                      <CargoEngine />
                  </div>
              </div>
          </div>

          {/* BOTTOM SECTION: COLLABORATION (35%) */}
          <div className="h-[35%] p-6 pt-0 overflow-hidden">
              <ActivityFeed />
          </div>

      </div>
    </div>
  );
}