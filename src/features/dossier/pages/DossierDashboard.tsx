import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Search, Filter, ArrowUpRight, 
  Anchor, Plane, Truck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { NewDossierDialog } from "../components/dialogs/NewDossierDialog"; 
import { DossierService } from "@/services/dossier.service";
import { Dossier } from "@/types/index";

export default function DossierDashboard() {
  const navigate = useNavigate();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
       const data = await DossierService.fetchAll();
       setDossiers(data);
       setIsLoading(false);
    };
    loadData();
  }, []);

  const getModeIcon = (mode: string) => {
     if (mode?.includes('SEA')) return <Anchor className="h-4 w-4 text-blue-600" />;
     if (mode?.includes('AIR')) return <Plane className="h-4 w-4 text-orange-600" />;
     return <Truck className="h-4 w-4 text-emerald-600" />;
  };

  const getStageColor = (stage: string) => {
    switch(stage) {
      case 'Intake': return 'bg-slate-100 text-slate-600';
      case 'Booking': return 'bg-purple-100 text-purple-700';
      case 'Transit': return 'bg-blue-100 text-blue-700';
      case 'Customs': return 'bg-orange-100 text-orange-700';
      case 'Delivery': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shipment Management</h1>
          <p className="text-slate-500 mt-1">Monitor active jobs, bookings, and deliveries.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="bg-white">
              <Filter className="h-4 w-4 mr-2" /> Filter View
           </Button>
           <Button onClick={() => setIsNewDialogOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" /> New Booking
           </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="p-5 border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Jobs</div>
               <div className="text-2xl font-bold text-slate-900 mt-1">{dossiers.length}</div>
            </div>
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Anchor className="h-5 w-5"/></div>
         </Card>
         <Card className="p-5 border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Arrivals (7d)</div>
               <div className="text-2xl font-bold text-slate-900 mt-1">3</div>
            </div>
            <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center"><Plane className="h-5 w-5"/></div>
         </Card>
         <Card className="p-5 border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Inv</div>
               <div className="text-2xl font-bold text-slate-900 mt-1">5</div>
            </div>
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><Truck className="h-5 w-5"/></div>
         </Card>
      </div>

      {/* Table Section */}
      <Card className="border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
         <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Search ref, client, container..." className="pl-9 bg-white border-slate-200" />
             </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                  <tr>
                     <th className="px-6 py-4">Reference</th>
                     <th className="px-6 py-4">Client</th>
                     <th className="px-6 py-4">Route</th>
                     <th className="px-6 py-4">Schedule</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                     <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading shipments...</td></tr>
                  ) : dossiers.map((file) => (
                     <tr key={file.id} className="group hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => navigate(`/dossiers/${file.id}`)}>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                 {getModeIcon(file.mode)}
                              </div>
                              <div>
                                 <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{file.ref}</div>
                                 <div className="text-xs text-slate-500 font-mono">{file.mblNumber || 'No MBL'}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                           {file.clientName}
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                              <span>{file.pol}</span>
                              <span className="text-slate-300">→</span>
                              <span>{file.pod}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-xs">
                              <div className="text-slate-400">ETA</div>
                              <div className="font-bold text-slate-900">{file.eta ? new Date(file.eta).toLocaleDateString() : 'TBD'}</div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant="secondary" className={`${getStageColor(file.stage)} border-0`}>
                              {file.stage}
                           </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                           </Button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>

      <NewDossierDialog 
         isOpen={isNewDialogOpen} 
         onClose={() => setIsNewDialogOpen(false)} 
      />

    </div>
  );
}