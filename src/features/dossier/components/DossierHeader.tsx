import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Copy, Printer, 
  ChevronRight, Anchor, Plane, Truck, Box,
  AlertCircle, Archive, Save
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { ShipmentStage, Dossier } from "@/types/index";
import { ShipmentProgress } from "./ShipmentProgress";
import { WorkflowModal } from "./modals/WorkflowModal";
import { Button } from "@/components/ui/button";

export const DossierHeader = () => {
  const navigate = useNavigate();
  // ADDED: addActivity to destructuring
  const { dossier, setStage, updateDossier, saveDossier, isLoading, addActivity } = useDossierStore();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);

  // Helper for CTA button text
  const getCTA = (stage: ShipmentStage) => {
    switch (stage) {
      case ShipmentStage.INTAKE: return 'Confirm & Book';
      case ShipmentStage.BOOKING: return 'Confirm Departure';
      case ShipmentStage.ORIGIN: return 'Send Pre-Alert';
      case ShipmentStage.TRANSIT: return 'Arrival Notice';
      case ShipmentStage.DELIVERY: return 'Confirm POD';
      case ShipmentStage.FINANCE: return 'Close Job';
      default: return 'Job Completed';
    }
  };

  // Handler for the Workflow Modal
  const handleWorkflowAdvance = (updates: Partial<Dossier>, nextStage: ShipmentStage, summary: string) => {
    // 1. Update specific fields captured in modal (e.g. mblNumber, etd)
    Object.entries(updates).forEach(([key, value]) => {
      // @ts-ignore - dynamic update based on key
      updateDossier(key as keyof Dossier, value);
    });

    // 2. Add Audit Log for specific data changes
    if (summary) {
        addActivity(summary, 'SYSTEM', 'neutral');
    }

    // 3. Advance the stage
    setStage(nextStage);

    // 4. Persist everything (updates, stage change, and new activity) to DB
    saveDossier();
  };

  const handleSave = async () => {
      await saveDossier();
  };

  const isLastStage = dossier.stage === ShipmentStage.CLOSED;

  const ModeIcon = () => {
     if (dossier.mode?.includes('SEA')) return <Anchor className="h-6 w-6 text-blue-600" />;
     if (dossier.mode?.includes('AIR')) return <Plane className="h-6 w-6 text-orange-600" />;
     if (dossier.mode?.includes('ROAD')) return <Truck className="h-6 w-6 text-emerald-600" />;
     return <Box className="h-6 w-6 text-slate-600" />;
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      
      {/* Top Bar: Identity & Actions */}
      <div className="px-6 py-3 flex items-center justify-between">
         <div className="flex gap-4 items-center">
            <button 
               onClick={() => navigate('/dossiers')}
               className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
               title="Back to Operations Dashboard"
            >
               <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div className="h-8 w-px bg-slate-200"></div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
               <ModeIcon />
            </div>

            <div>
               <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{dossier.ref}</h1>
                  {dossier.mode && (
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                       {dossier.mode}
                    </span>
                  )}
                  {dossier.incoterm && (
                     <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 uppercase tracking-wider">
                        {dossier.incoterm}
                     </span>
                  )}
               </div>
               <div className="text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                  <span className="text-slate-900">{dossier.clientName}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-400 font-normal">MBL: {dossier.mblNumber || 'Pending'}</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <Button 
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
                className="hidden md:flex items-center gap-2 text-slate-600 hover:text-slate-900 border-slate-200"
            >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Job'}
            </Button>

            <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
               <Printer className="h-4.5 w-4.5" />
            </button>

            <div className="relative">
                <button 
                    onClick={() => setIsActionsOpen(!isActionsOpen)}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                    Actions <ChevronRight className={`h-4 w-4 transition-transform ${isActionsOpen ? 'rotate-90' : 'rotate-0'}`} />
                </button>
                {isActionsOpen && (
                    <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsActionsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <Copy className="h-3.5 w-3.5" /> Duplicate Job
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5" /> Cancel Job
                        </button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button className="w-full text-left px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 flex items-center gap-2">
                            <Archive className="h-3.5 w-3.5" /> Archive
                        </button>
                    </div>
                    </>
                )}
            </div>

            <button 
               onClick={() => setIsWorkflowOpen(true)}
               disabled={isLastStage}
               className={`
                 px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm transition-all transform flex items-center gap-2
                 ${isLastStage 
                    ? 'bg-slate-400 cursor-not-allowed opacity-75' 
                    : 'bg-slate-900 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0'
                 }
               `}
            >
               {getCTA(dossier.stage)}
               {!isLastStage && <ChevronRight className="h-4 w-4" />}
            </button>
         </div>
      </div>

      {/* Progress Stepper - Adaptive Width */}
      <ShipmentProgress />

      {/* Workflow Action Modal */}
      <WorkflowModal 
        isOpen={isWorkflowOpen}
        onClose={() => setIsWorkflowOpen(false)}
        dossier={dossier}
        onAdvance={handleWorkflowAdvance}
      />

    </div>
  );
};