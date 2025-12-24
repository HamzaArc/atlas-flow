import { Check, Truck, Ship, Package, FileCheck, Anchor, Home } from "lucide-react";
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
    { id: 'AT_POL', label: 'Departure', icon: Anchor },
    { id: 'ON_WATER', label: 'In Transit', icon: Ship },
    { id: 'AT_POD', label: 'Arrival', icon: Anchor },
    { id: 'CUSTOMS', label: 'Customs', icon: Package },
    { id: 'DELIVERED', label: 'Final Delivery', icon: Home },
];

export function ShipmentProgress() {
    const { dossier, setStatus } = useDossierStore();
    const currentIdx = STEPS.findIndex(s => s.id === dossier.status);
    
    // Calculate progress percentage for the fill bar
    const progressPercentage = (currentIdx / (STEPS.length - 1)) * 100;

    const handleStepClick = (stepId: ShipmentStatus, stepIdx: number) => {
        // Allow clicking any past step to revert, or immediate next step
        if (stepIdx <= currentIdx + 1) {
            setStatus(stepId);
        }
    };

    return (
        <div className="w-full py-4 px-4">
            <div className="relative flex items-center justify-between">
                
                {/* 1. Background Track (Gray) */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full -z-10" />

                {/* 2. Active Track (Colored Fill) */}
                <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-700 ease-in-out" 
                    style={{ width: `${progressPercentage}%` }}
                />

                {/* 3. Steps Nodes */}
                {STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    const isNext = idx === currentIdx + 1;
                    
                    return (
                        <div key={step.id} className="relative flex flex-col items-center group">
                            
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => handleStepClick(step.id, idx)}
                                            disabled={idx > currentIdx + 1}
                                            className={cn(
                                                "relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 z-10 bg-white",
                                                // Border & Shadow Logic
                                                isCurrent 
                                                    ? "border-blue-600 text-blue-600 shadow-lg shadow-blue-100 ring-4 ring-blue-50 scale-110" 
                                                    : isCompleted 
                                                        ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700" 
                                                        : isNext 
                                                            ? "border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer"
                                                            : "border-slate-200 text-slate-300 cursor-not-allowed"
                                            )}
                                        >
                                            {/* Icon Logic */}
                                            {isCompleted ? (
                                                <Check className="w-4 h-4 stroke-[3]" /> 
                                            ) : isCurrent ? (
                                                <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
                                            ) : (
                                                <step.icon className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs font-bold bg-slate-900 text-white mb-2">
                                        {isCompleted ? "Completed" : isCurrent ? "In Progress" : "Pending"}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Label Label */}
                            <span className={cn(
                                "absolute -bottom-7 text-[10px] font-bold uppercase tracking-wide transition-colors duration-300 whitespace-nowrap",
                                isCurrent ? "text-blue-700 translate-y-0.5" : isCompleted ? "text-slate-600" : "text-slate-300"
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}