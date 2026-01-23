import React from 'react';
import { Check } from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { ShipmentStage } from "@/types/index";

export function ShipmentProgress() {
    const { dossier, setStage } = useDossierStore();
    
    const STAGES = [
        ShipmentStage.INTAKE,
        ShipmentStage.BOOKING,
        ShipmentStage.ORIGIN,
        ShipmentStage.TRANSIT,
        ShipmentStage.DELIVERY,
        ShipmentStage.FINANCE,
        ShipmentStage.CLOSED
    ];

    const activeStepIndex = STAGES.indexOf(dossier.stage);

    // FIXED: Removed unused 'idx' parameter
    const handleStepClick = (stage: ShipmentStage) => {
        setStage(stage);
    };

    return (
        <div className="px-6 pb-4 pt-2 flex items-center gap-6 overflow-x-auto border-t border-transparent">
            <div className="flex-1 flex items-center min-w-0">
                {STAGES.map((step, idx) => {
                    const isCompleted = idx < activeStepIndex;
                    const isCurrent = idx === activeStepIndex;
                    const isLast = idx === STAGES.length - 1;
                    
                    return (
                        <React.Fragment key={step}>
                            <div className="flex flex-col items-center relative group">
                                <button 
                                    // FIXED: Removed index argument
                                    onClick={() => handleStepClick(step)}
                                    className={`
                                        relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300
                                        ${isCompleted ? 'bg-green-500 text-white shadow-sm' : ''}
                                        ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-50 shadow-md scale-110' : ''}
                                        ${!isCompleted && !isCurrent ? 'bg-slate-100 text-slate-400 border border-slate-200 hover:border-blue-300 cursor-pointer' : ''}
                                    `}
                                >
                                    {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : idx + 1}
                                </button>
                                {/* Label */}
                                <span className={`
                                    absolute top-9 whitespace-nowrap text-[11px] font-bold tracking-tight transition-colors duration-300
                                    ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-600' : 'text-slate-400'}
                                `}>
                                    {step}
                                </span>
                            </div>
                            
                            {/* Connecting Line */}
                            {!isLast && (
                                <div className="flex-1 h-1 mx-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 ease-out ${idx < activeStepIndex ? 'bg-green-500 w-full' : 'w-0'}`}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            
            {/* Status Badge */}
            <div className="flex flex-col items-end flex-shrink-0 pl-4 border-l border-slate-100">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Current Status</span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                    </span>
                    {dossier.status || 'Active'}
                </span>
            </div>
        </div>
    );
}