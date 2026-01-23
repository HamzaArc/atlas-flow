import { 
  Users, MapPin, Calendar, Tag, 
  MoreHorizontal, Phone, Mail, Globe, 
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDossierStore } from "@/store/useDossierStore";
import { ShipmentParty } from "@/types/index";

export const DossierRightRail = () => {
  const { dossier } = useDossierStore();

  const PartyCard = ({ role, data }: { role: string; data: ShipmentParty }) => (
    <div className="group flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
      <div className="mt-1">
        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
          <Users className="h-4 w-4" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{role}</p>
           {/* Quick Action Hover */}
           <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button className="text-slate-400 hover:text-blue-600"><Mail className="h-3 w-3" /></button>
           </div>
        </div>
        <p className="text-sm font-bold text-slate-900 truncate" title={data.name}>{data.name || "—"}</p>
        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 truncate">
          <MapPin className="h-3 w-3 text-slate-300" />
          <span className="truncate">{data.address || "No address listed"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full overflow-y-auto custom-scrollbar">
      
      {/* 1. Quick Stats / Key Dates */}
      <div className="p-5 border-b border-slate-100 space-y-4">
         <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
               <Calendar className="h-4 w-4 text-slate-400" /> Key Milestones
            </h3>
            <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">ETD {dossier.pol || 'Origin'}</span>
                  <span className="font-bold text-slate-900">{dossier.etd ? new Date(dossier.etd).toLocaleDateString() : '—'}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">ETA {dossier.pod || 'Dest.'}</span>
                  <span className="font-bold text-blue-600">{dossier.eta ? new Date(dossier.eta).toLocaleDateString() : '—'}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Demurrage Free</span>
                  <span className="font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">{dossier.freeTimeDays} Days</span>
               </div>
            </div>
         </div>
      </div>

      {/* 2. Stakeholders */}
      <div className="p-2 border-b border-slate-100">
         <div className="px-3 py-3 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Stakeholders</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
               <MoreHorizontal className="h-4 w-4" />
            </Button>
         </div>
         <div className="space-y-1">
            <PartyCard role="Shipper" data={dossier.shipper} />
            <PartyCard role="Consignee" data={dossier.consignee} />
            {dossier.notify && <PartyCard role="Notify" data={dossier.notify} />}
            {/* Map over generic parties array if populated */}
            {dossier.parties?.filter(p => p.role === 'Agent' || p.role === 'Carrier').map((p, i) => (
               <PartyCard key={i} role={p.role} data={p} />
            ))}
         </div>
      </div>

      {/* 3. Tags & Metadata */}
      <div className="p-5 space-y-6">
         <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
               <Tag className="h-4 w-4 text-slate-400" /> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
               {dossier.tags?.length > 0 ? dossier.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                     {tag}
                  </Badge>
               )) : (
                  <span className="text-xs text-slate-400 italic">No tags added</span>
               )}
               <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                  + Add
               </button>
            </div>
         </div>

         {/* 4. Internal Ownership */}
         <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
               <AlertCircle className="h-4 w-4 text-slate-400" /> Ownership
            </h3>
            <div className="flex items-center gap-3">
               <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">KA</AvatarFallback>
               </Avatar>
               <div>
                  <p className="text-sm font-bold text-slate-900">Karim Alami</p>
                  <p className="text-xs text-slate-500">Operations Manager</p>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
};