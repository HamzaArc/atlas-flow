import { 
    Edit3, Save, Printer, 
    MoreHorizontal, Ship, Lock, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDossierStore } from "@/store/useDossierStore";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DossierHeaderProps {
    onBack: () => void;
}

export function DossierHeader({ onBack }: DossierHeaderProps) {
  const { dossier, isEditing, setEditing, saveDossier, isLoading } = useDossierStore();

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'BOOKED': return 'bg-slate-100 text-slate-700 border-slate-200';
          case 'ON_WATER': return 'bg-sky-50 text-sky-700 border-sky-200';
          case 'CUSTOMS': return 'bg-amber-50 text-amber-700 border-amber-200';
          case 'DELIVERED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
          default: return 'bg-slate-50 text-slate-600';
      }
  };

  const hasBlockers = dossier.alerts.some(a => a.type === 'BLOCKER');

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-30">
        
        {/* LEFT: IDENTITY & CONTEXT */}
        <div className="flex items-center gap-4">
            {/* 1. BACK BUTTON INTEGRATION */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 pr-3 h-9"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="font-semibold text-xs">Back to Shipments</span>
            </Button>

            <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

            <div className="relative">
                <div className="h-11 w-11 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                    <Ship className="h-5 w-5" />
                </div>
                {hasBlockers && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Lock className="h-2.5 w-2.5 text-white" />
                    </div>
                )}
            </div>
            
            <div className="flex flex-col">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{dossier.ref}</h1>
                    <Badge variant="outline" className={cn("text-[10px] font-bold uppercase h-5", getStatusColor(dossier.status))}>
                        {dossier.status.replace('_', ' ')}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                    <span className="text-slate-800">{dossier.clientName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono">MBL: {dossier.mblNumber || 'Pending'}</span>
                    <span className="text-slate-300">•</span>
                    <span>{dossier.mode}</span>
                </div>
            </div>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-2">
            {!isEditing ? (
                <>
                    <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                        <Printer className="h-3.5 w-3.5 mr-2" /> Print PDF
                    </Button>
                    <Button onClick={() => setEditing(true)} size="sm" className="h-8 text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm font-semibold">
                        <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit File
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Audit Log</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate File</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">Cancel Shipment</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            ) : (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-slate-500 h-8 text-xs">
                        Discard Changes
                    </Button>
                    <Button onClick={saveDossier} disabled={isLoading} size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        <Save className="h-3.5 w-3.5 mr-2" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}
        </div>
    </div>
  );
}