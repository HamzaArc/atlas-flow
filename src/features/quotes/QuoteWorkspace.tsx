import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileOutput, Box } from "lucide-react";

// Feature Components
import { QuoteHeader } from "./components/QuoteHeader"; // <--- The New Smart Header
import { RouteSelector } from "./components/RouteSelector";
import { CargoEngine } from "./components/CargoEngine";
import { PricingTable } from "./components/PricingTable";

// State & PDF
import { useQuoteStore } from "@/store/useQuoteStore";
import { pdf } from '@react-pdf/renderer';
import { QuotePDF } from './components/QuotePDF';
import { Badge } from "@/components/ui/badge";

export default function QuoteWorkspace() {
  const { totalSellMAD, totalMarginMAD, items, pol, pod, mode, incoterm, reference, clientName, validityDate } = useQuoteStore();

  const marginPercent = totalSellMAD > 0 
    ? ((totalMarginMAD / totalSellMAD) * 100).toFixed(1) 
    : "0.0";

  // PDF Generation
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
        totalSell={totalSellMAD}
        currency="MAD"
        validityDate={new Date().toLocaleDateString()}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      
      {/* 1. NEW SMART HEADER [Gaps 3, 4, 7, 8] */}
      <QuoteHeader />

      {/* 2. MAIN GRID CANVAS */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        
        {/* LEFT PANEL */}
        <div className="col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 pb-20">
          <RouteSelector />
          <CargoEngine />
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-8 flex flex-col gap-4">
           <Card className="flex-1 shadow-sm border-slate-200 flex flex-col overflow-hidden">
              <div className="p-3 border-b bg-slate-50/50 flex justify-between items-center">
                 <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <Box className="h-4 w-4" />
                    <span>Pricing Matrix</span>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleGeneratePDF} className="h-7 text-xs">
                        <FileOutput className="h-3 w-3 mr-2" /> PDF Export
                    </Button>
                 </div>
              </div>
              
              <PricingTable />

              {/* Profit Card */}
              <div className="h-16 border-t bg-slate-900 text-white flex items-center justify-between px-6 shadow-lg z-20">
                 <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Sell (TTC)</span>
                    <span className="text-xl font-bold font-mono">
                      {totalSellMAD.toFixed(2)} <span className="text-sm font-normal text-slate-500">MAD</span>
                    </span>
                 </div>
                 <div className="h-8 w-px bg-slate-700"></div>
                 <div className="flex flex-col items-end">
                     <span className="text-[10px] text-green-400 uppercase tracking-wider">Net Margin</span>
                     <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold font-mono text-green-400">
                          + {totalMarginMAD.toFixed(2)}
                        </span>
                        <Badge variant="outline" className="border-green-500 text-green-400 h-5 px-1">
                          {marginPercent}%
                        </Badge>
                     </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}