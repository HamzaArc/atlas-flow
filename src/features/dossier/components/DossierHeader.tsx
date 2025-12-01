import { 
    ArrowLeft, Edit3, Save, Printer, 
    MoreHorizontal, Share2, AlertTriangle, Ship
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDossierStore } from "@/store/useDossierStore";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function DossierHeader() {
  const { dossier, isEditing, setEditing, saveDossier, isLoading } = useDossierStore();

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'BOOKED': return 'bg-slate-100 text-slate-700 border-slate-200';
          case 'ON_WATER': return 'bg-blue-50 text-blue-700 border-blue-200';
          case 'CUSTOMS': return 'bg-amber-50 text-amber-700 border-amber-200';
          case 'DELIVERED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
          default: return 'bg-slate-50 text-slate-600';
      }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20">
        
        {/* IDENTITY */}
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-md">
                <Ship className="h-5 w-5" />
            </div>
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">{dossier.ref}</h1>
                    <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", getStatusColor(dossier.status))}>
                        {dossier.status.replace('_', ' ')}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-medium text-slate-700">{dossier.clientName}</span>
                    <span className="text-slate-300">•</span>
                    <span>MBL: {dossier.mblNumber || 'Pending'}</span>
                </div>
            </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
            {!isEditing ? (
                <>
                    <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                        <Printer className="h-3.5 w-3.5 mr-2" /> Print File
                    </Button>
                    <Button onClick={() => setEditing(true)} size="sm" className="h-8 text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm">
                        <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit Details
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Archive File</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Cancel Shipment</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            ) : (
                <>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-slate-500 h-8 text-xs">
                        Cancel
                    </Button>
                    <Button onClick={saveDossier} disabled={isLoading} size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        <Save className="h-3.5 w-3.5 mr-2" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </>
            )}
        </div>
    </div>
  );
}