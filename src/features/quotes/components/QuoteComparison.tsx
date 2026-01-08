import { useQuoteStore } from "@/store/useQuoteStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Ship, Truck, CheckCircle2, ArrowRight, MousePointerClick, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteComparisonProps {
    onSelect: () => void;
}

export function QuoteComparison({ onSelect }: QuoteComparisonProps) {
  const { options, setActiveOption, activeOptionId } = useQuoteStore();

  const getModeIcon = (mode: string) => {
    if (mode === 'AIR') return <Plane className="h-4 w-4" />;
    if (mode === 'ROAD') return <Truck className="h-4 w-4" />;
    return <Ship className="h-4 w-4" />;
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50/50 p-6 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Option Strategy</h2>
                <p className="text-sm text-slate-500">Compare options side-by-side to determine the best fit for the client.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {options.map((opt) => {
                 const isActive = opt.id === activeOptionId;
                 
                 // RESOLVE EQUIPMENT STRING
                 const equipmentStr = opt.equipmentList && opt.equipmentList.length > 0
                    ? opt.equipmentList.map(e => `${e.count}x${e.type}`).join(', ')
                    : `${opt.containerCount}x ${opt.equipmentType || 'Unit'}`;
                 
                 return (
                    <Card key={opt.id} 
                        className={cn(
                            "group relative flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-2",
                            isActive 
                                ? "border-blue-600 shadow-blue-100 ring-4 ring-blue-50" 
                                : "border-transparent bg-white shadow-sm hover:border-blue-200"
                        )}
                        onClick={() => {
                            setActiveOption(opt.id);
                            onSelect();
                        }}
                    >
                        {isActive && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 z-10" />
                        )}

                        <div className={cn("p-5 border-b flex flex-col gap-3", isActive ? "bg-blue-50/50" : "bg-white")}>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-white border-slate-200 shadow-sm text-slate-700">
                                    {getModeIcon(opt.mode)}
                                    <span className="ml-2 font-bold text-[10px]">{opt.mode}</span>
                                </Badge>
                                {opt.isRecommended && (
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-[10px] uppercase">Best Fit</Badge>
                                )}
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-slate-800 text-base leading-tight">{opt.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-medium">
                                    <span className="truncate max-w-[80px]">{opt.pol.split('(')[0]}</span>
                                    <ArrowRight className="h-3 w-3 text-slate-300" />
                                    <span className="truncate max-w-[80px]">{opt.pod.split('(')[0]}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-5 space-y-5 bg-white flex-1">
                             <div className="space-y-1">
                                 <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Total Amount</div>
                                 <div className="text-3xl font-black text-slate-800 font-mono tracking-tight">
                                    {opt.totalTTC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                                    <span className="text-sm text-slate-400 font-sans ml-1.5 font-bold">{opt.quoteCurrency}</span>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4 py-3 border-t border-dashed border-slate-100">
                                 <div>
                                     <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">Transit</div>
                                     <div className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                                         {opt.transitTime} <span className="text-[10px] font-normal text-slate-400">Days</span>
                                     </div>
                                 </div>
                                 <div>
                                     <div className="text-[10px] uppercase text-slate-400 font-bold mb-1">Margin</div>
                                     <div className="font-bold text-emerald-600 text-sm flex items-center gap-1.5">
                                         <TrendingUp className="h-3 w-3" />
                                         {(opt.marginBuffer * 100 - 100).toFixed(1)}%
                                     </div>
                                 </div>
                             </div>
                             
                             <div className="space-y-2">
                                 <div className="flex items-center justify-between text-xs">
                                     <span className="text-slate-500">Incoterm</span>
                                     <span className="font-mono font-bold text-slate-700">{opt.incoterm}</span>
                                 </div>
                                 <div className="flex items-center justify-between text-xs">
                                     <span className="text-slate-500">Equipment</span>
                                     <span className="font-mono font-bold text-slate-700 truncate max-w-[120px]" title={equipmentStr}>{equipmentStr}</span>
                                 </div>
                             </div>
                        </div>

                        <div className={cn(
                            "p-3 text-center text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2", 
                            isActive ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-blue-600"
                        )}>
                            {isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <MousePointerClick className="h-3.5 w-3.5" />}
                            {isActive ? "Currently Editing" : "Click to Edit"}
                        </div>
                    </Card>
                 );
             })}
        </div>
      </div>
    </div>
  );
}