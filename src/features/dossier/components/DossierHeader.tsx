// src/features/dossier/components/DossierHeader.tsx
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Copy, Printer, 
  ChevronRight, Anchor, Plane, Truck, Box,
  AlertCircle, Archive, Save, FileText
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { Dossier, ShipmentStatus, SHIPMENT_WORKFLOWS, STAGE_CTA_LABELS } from "@/types/index";
import { ShipmentProgress } from "./ShipmentProgress";
import { WorkflowModal } from "./modals/WorkflowModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DossierHeader = () => {
  const navigate = useNavigate();
  const { 
      dossier, setStage, updateDossier, saveDossier, isLoading, 
      addActivity, duplicateDossier, cancelDossier 
  } = useDossierStore();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);

  // --- WORKFLOW LOGIC ---
  const getWorkflowSteps = () => {
     if (dossier.mode?.includes('AIR')) return SHIPMENT_WORKFLOWS.AIR;
     if (dossier.mode?.includes('ROAD')) return SHIPMENT_WORKFLOWS.ROAD;
     return SHIPMENT_WORKFLOWS.SEA;
  };

  const steps = getWorkflowSteps();
  const currentStepIndex = steps.indexOf(dossier.stage as string);
  const nextStep = currentStepIndex !== -1 && currentStepIndex < steps.length - 1 
      ? steps[currentStepIndex + 1] 
      : null;

  const getCTA = () => {
      // Use the map or fallback to "Next Step"
      return STAGE_CTA_LABELS[dossier.stage as string] || 'Next Step';
  };

  const handleWorkflowAdvance = (updates: Partial<Dossier>, targetStage: string, summary: string) => {
    Object.entries(updates).forEach(([key, value]) => {
      // @ts-ignore
      updateDossier(key as keyof Dossier, value);
    });

    if (summary) {
        addActivity(summary, 'SYSTEM', 'neutral');
    }

    setStage(targetStage);
    saveDossier();
  };

  const handleMainActionClick = () => {
      // If workflow modal logic is complex, we open the modal
      // But we pass the *calculated* next step to it
      setIsWorkflowOpen(true);
  };

  const handleSave = async () => {
      await saveDossier();
  };

  const handleDuplicate = () => {
      duplicateDossier();
      setIsActionsOpen(false);
  };

  const handleCancel = async () => {
      if (confirm("Are you sure you want to cancel this job? This action cannot be undone.")) {
          await cancelDossier();
          setIsActionsOpen(false);
      }
  };

  const isClosed = dossier.stage === 'Closed' || dossier.status === 'COMPLETED';
  const isCancelled = dossier.status === 'CANCELLED';

  const ModeIcon = () => {
     if (dossier.mode?.includes('SEA')) return <Anchor className="h-6 w-6 text-blue-600" />;
     if (dossier.mode?.includes('AIR')) return <Plane className="h-6 w-6 text-orange-600" />;
     if (dossier.mode?.includes('ROAD')) return <Truck className="h-6 w-6 text-emerald-600" />;
     return <Box className="h-6 w-6 text-slate-600" />;
  };

  const StatusBadge = ({ status }: { status: ShipmentStatus }) => {
      const styles = {
          'BOOKED': 'bg-blue-100 text-blue-700',
          'PICKUP': 'bg-amber-100 text-amber-700',
          'AT_POL': 'bg-indigo-100 text-indigo-700',
          'ON_WATER': 'bg-cyan-100 text-cyan-700',
          'AT_POD': 'bg-teal-100 text-teal-700',
          'CUSTOMS': 'bg-orange-100 text-orange-700',
          'DELIVERED': 'bg-green-100 text-green-700',
          'COMPLETED': 'bg-emerald-100 text-emerald-800',
          'CANCELLED': 'bg-red-100 text-red-700 line-through'
      };
      
      const label = status.replace(/_/g, ' ');
      
      return (
          <span className={cn("px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider", styles[status] || 'bg-slate-100 text-slate-600')}>
              {label}
          </span>
      );
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      
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
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                      {dossier.ref}
                      <StatusBadge status={dossier.status} />
                  </h1>
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
                  {dossier.customerReference && (
                     <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-tight">
                        <FileText className="h-3 w-3" />
                        QT: {dossier.customerReference}
                     </div>
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
                        <button 
                            onClick={handleDuplicate}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Copy className="h-3.5 w-3.5" /> Duplicate Job
                        </button>
                        <button 
                            onClick={handleCancel}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
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
               onClick={handleMainActionClick}
               disabled={isClosed || isCancelled || !nextStep}
               className={`
                 px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm transition-all transform flex items-center gap-2
                 ${isClosed || isCancelled || !nextStep
                    ? 'bg-slate-400 cursor-not-allowed opacity-75' 
                    : 'bg-slate-900 hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0'
                 }
               `}
            >
               {isCancelled ? 'Cancelled' : getCTA()}
               {!isClosed && !isCancelled && nextStep && <ChevronRight className="h-4 w-4" />}
            </button>
         </div>
      </div>

      <ShipmentProgress />

      <WorkflowModal 
        isOpen={isWorkflowOpen}
        onClose={() => setIsWorkflowOpen(false)}
        dossier={dossier}
        // Pass the explicit next step derived from our single source of truth
        targetStage={nextStep || dossier.stage as string} 
        onAdvance={handleWorkflowAdvance}
      />

    </div>
  );
};