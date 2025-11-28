import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileOutput, Box, Lock, MoreHorizontal } from "lucide-react";
import { QuoteHeader } from "./components/QuoteHeader"; 
import { RouteSelector } from "./components/RouteSelector";
import { CargoEngine } from "./components/CargoEngine";
import { PricingTable } from "./components/PricingTable";
import { useQuoteStore } from "@/store/useQuoteStore";
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from './components/QuotePDF';
import { Badge } from "@/components/ui/badge";

export default function QuoteWorkspace() {
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
    <div className="h-screen flex flex-col bg-slate-50/50 overflow-hidden font-sans">
      
      {/* 1. TOP NAVIGATION */}
      <QuoteHeader />

      {/* 2. COCKPIT GRID (The Main Stage) */}
      <div className="flex-1 p-4 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 h-full">
              
              {/* LEFT COLUMN: Route & Context (25%) */}
              <div className="col-span-3 flex flex-col h-full overflow-hidden gap-4">
                  <div className="flex-none">
                      <RouteSelector />
                  </div>
                  {/* Placeholder for future "Notes" or "Activity Log" if needed */}
                  <div className="flex-1 bg-transparent"></div>
              </div>

              {/* MIDDLE COLUMN: Pricing Engine (50%) - The Core Work Area */}
              <div className="col-span-6 flex flex-col h-full gap-4">
                   <Card className="flex-1 shadow-sm border-slate-200 flex flex-col overflow-hidden bg-white">
                      {/* Toolbar */}
                      <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white">
                         <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                                <Box className="h-4 w-4" />
                            </div>
                            <span>Commercial Offer</span>
                         </div>
                         <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="h-7 text-xs bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200">
                                <FileOutput className="h-3 w-3 mr-2" /> PDF Preview
                            </Button>
                         </div>
                      </div>
                      
                      {/* Scrollable Table Area */}
                      <div className="flex-1 overflow-hidden relative">
                          <PricingTable />
                      </div>

                      {/* Financial Footer (Fixed at bottom of card) */}
                      <div className="h-20 border-t border-slate-100 flex z-10 bg-white">
                         {/* Internal Margin (Hidden from Client) */}
                         <div className="w-1/3 bg-slate-50 border-r border-slate-100 p-3 flex flex-col justify-center relative overflow-hidden group">
                             <div className="flex items-center gap-2 mb-1">
                                <Lock className="h-3 w-3 text-slate-400" />
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Internal Margin</span>
                             </div>
                             <div className="flex items-baseline gap-2">
                                <span className={`text-xl font-bold font-mono ${parseFloat(marginPercent) < 15 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                    {totalMarginMAD.toFixed(2)}
                                </span>
                                <Badge variant="outline" className="h-4 px-1 text-[9px] border-slate-200 bg-white text-slate-500">
                                    {marginPercent}%
                                </Badge>
                             </div>
                         </div>

                         {/* Client Totals */}
                         <div className="flex-1 flex items-center justify-end px-6 gap-6">
                             <div className="text-right">
                                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total Net</div>
                                <div className="text-base font-bold text-slate-700 font-mono">
                                  {totalSellTarget.toFixed(2)} <span className="text-[10px] text-slate-400 font-sans">{quoteCurrency}</span>
                                </div>
                             </div>
                             <div className="w-px h-8 bg-slate-100"></div>
                             <div className="text-right">
                                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">VAT</div>
                                <div className="text-base font-bold text-slate-700 font-mono">
                                  {totalTaxTarget.toFixed(2)} <span className="text-[10px] text-slate-400 font-sans">{quoteCurrency}</span>
                                </div>
                             </div>
                             <div className="w-px h-8 bg-slate-100"></div>
                             <div className="text-right">
                                <div className="text-[9px] text-blue-600 uppercase font-bold tracking-wider">Payable</div>
                                <div className="text-2xl font-bold text-blue-700 font-mono tracking-tight">
                                  {totalTTCTarget.toFixed(2)} <span className="text-xs text-blue-400 font-sans font-medium">{quoteCurrency}</span>
                                </div>
                             </div>
                         </div>
                      </div>
                   </Card>
              </div>

              {/* RIGHT COLUMN: Cargo & Compliance (25%) */}
              <div className="col-span-3 flex flex-col h-full overflow-hidden">
                  <CargoEngine />
              </div>

          </div>
      </div>
    </div>
  );
}