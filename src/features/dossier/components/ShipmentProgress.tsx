import { Check, ChevronRight, Truck, Ship, Package, FileCheck, Anchor, Home } from "lucide-react";
import { ShipmentStatus } from "@/types/index";
import { useDossierStore } from "@/store/useDossierStore";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STEPS: { id: ShipmentStatus; label: string; icon: any }[] = [
    { id: 'BOOKED', label: 'Booked', icon: FileCheck },
    { id: 'PICKUP', label: 'Pickup', icon: Truck },
    { id: 'AT_POL', label: 'Origin Port', icon: Anchor },
    { id: 'ON_WATER', label: 'In Transit', icon: Ship },
    { id: 'AT_POD', label: 'Dest. Port', icon: Anchor },
    { id: 'CUSTOMS', label: 'Customs', icon: Package },
    { id: 'DELIVERED', label: 'Delivered', icon: Home },
];

export function ShipmentProgress() {
    const { dossier, setStatus } = useDossierStore();
    const currentIdx = STEPS.findIndex(s => s.id === dossier.status);

    return (
        <div className="w-full overflow-x-auto py-2">
            <div className="flex items-center min-w-max px-2">
                {STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    
                    return (
                        <div key={step.id} className="flex items-center group">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setStatus(step.id)}
                                            className={cn(
                                                "relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
                                                isCurrent 
                                                    ? "bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-100" 
                                                    : isCompleted 
                                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                                                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex items-center justify-center w-5 h-5 rounded-full text-[10px]",
                                                isCurrent ? "bg-white/20" : isCompleted ? "bg-emerald-100" : "bg-slate-100"
                                            )}>
                                                {isCompleted ? <Check className="w-3 h-3" /> : <step.icon className="w-3 h-3" />}
                                            </div>
                                            <span className="text-xs font-bold whitespace-nowrap">{step.label}</span>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs bg-slate-900 text-white">
                                        {isCompleted ? "Completed" : isCurrent ? "Current Stage" : "Set Status"}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {idx < STEPS.length - 1 && (
                                <div className={cn(
                                    "h-0.5 w-6 mx-1 transition-colors duration-300",
                                    idx < currentIdx ? "bg-emerald-300" : "bg-slate-200"
                                )}></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}