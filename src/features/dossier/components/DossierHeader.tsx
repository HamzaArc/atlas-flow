import { 
  ArrowLeft, Copy, MoreHorizontal, 
  Anchor, Plane, Truck, Edit, 
  CheckCircle2, AlertCircle, ChevronRight 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useDossierStore } from "@/store/useDossierStore";
import { ShipmentMode, ShipmentStage } from "@/types/index";

export const DossierHeader = () => {
  const navigate = useNavigate();
  const { dossier, setStage } = useDossierStore();

  const ModeIcon = () => {
     if (dossier.mode?.includes('SEA')) return <Anchor className="h-5 w-5 text-blue-600" />;
     if (dossier.mode?.includes('AIR')) return <Plane className="h-5 w-5 text-orange-600" />;
     return <Truck className="h-5 w-5 text-emerald-600" />;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Intake': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Booking': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Transit': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Delivery': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const STAGES = [
     ShipmentStage.INTAKE, 
     ShipmentStage.BOOKING, 
     ShipmentStage.ORIGIN, 
     ShipmentStage.TRANSIT, 
     ShipmentStage.DELIVERY, 
     ShipmentStage.FINANCE
  ];

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm z-10">
      
      {/* Top Bar: Navigation & Core ID */}
      <div className="px-6 py-4 flex justify-between items-start">
         <div className="flex items-start gap-4">
            <Button 
               variant="ghost" 
               size="icon" 
               onClick={() => navigate('/dashboard')}
               className="mt-1 h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
               <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 shadow-sm">
                     <ModeIcon />
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{dossier.ref}</h1>
                        <button className="text-slate-400 hover:text-blue-600 transition-colors">
                           <Copy className="h-3.5 w-3.5" />
                        </button>
                        <Badge variant="outline" className={`ml-2 ${getStatusColor(dossier.stage)}`}>
                           {dossier.stage}
                        </Badge>
                     </div>
                     <p className="text-sm text-slate-500 font-medium">{dossier.clientName}</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 gap-2 text-slate-600 border-slate-200 hover:bg-slate-50">
               <Edit className="h-4 w-4" /> Edit Details
            </Button>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="default" className="h-9 gap-2 bg-slate-900 hover:bg-slate-800 shadow-md">
                     Actions <ChevronRight className="h-4 w-4 opacity-50" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>Generate Arrival Notice</DropdownMenuItem>
                  <DropdownMenuItem>Send Tracking Link</DropdownMenuItem>
                  <DropdownMenuItem>Create Invoice</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Cancel Shipment</DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </div>
      </div>

      {/* Bottom Bar: Workflow Stepper */}
      <div className="px-6 pb-0 overflow-x-auto">
         <div className="flex items-center gap-2 text-sm border-t border-slate-100 py-3">
            {STAGES.map((stage, idx) => {
               const isActive = dossier.stage === stage;
               const isPast = STAGES.indexOf(dossier.stage) > idx;
               
               return (
                  <div key={stage} className="flex items-center">
                     <button 
                        onClick={() => setStage(stage)}
                        className={`
                           flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                           ${isActive 
                              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-100 ring-offset-1' 
                              : isPast 
                                 ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' 
                                 : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                           }
                        `}
                     >
                        {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                        {stage}
                     </button>
                     {idx < STAGES.length - 1 && (
                        <div className="w-8 h-px bg-slate-200 mx-1" />
                     )}
                  </div>
               );
            })}
         </div>
      </div>

    </div>
  );
};