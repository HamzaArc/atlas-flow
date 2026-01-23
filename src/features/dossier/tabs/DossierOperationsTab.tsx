import { useState } from 'react';
import { 
   MapPin, Calendar, Box, Anchor, 
   Plus, Trash2, MoreHorizontal, User,
   Truck, Ship, Plane
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ShipmentParty, DossierContainer } from "@/types/index";

export const DossierOperationsTab = () => {
  const { 
     dossier, updateDossier, updateParty,
     addContainer, updateContainer, removeContainer 
  } = useDossierStore();

  // --- Local State for UI Toggles ---
  const [isAddingParty, setIsAddingParty] = useState(false);
  const [newParty, setNewParty] = useState<Partial<ShipmentParty>>({ role: 'Notify' });

  // --- Handlers ---
  const handleAddParty = () => {
     if (!newParty.name) return;
     const partyToAdd: ShipmentParty = {
        id: Math.random().toString(36),
        name: newParty.name,
        role: newParty.role as any,
        email: newParty.email,
        contact: newParty.contact
     };
     // Update the main parties array
     updateDossier('parties', [...(dossier.parties || []), partyToAdd]);
     setIsAddingParty(false);
     setNewParty({ role: 'Notify' });
  };

  const handleRemoveParty = (id: string) => {
     updateDossier('parties', dossier.parties.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 pb-24 space-y-6">
      
      {/* 2x2 GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
        {/* === LEFT COLUMN === */}
        <div className="space-y-6">
          
          {/* CARD 1: Route & Schedule */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Route & Schedule</h3>
            </div>
            
            <div className="p-6 space-y-8 relative">
              {/* Connector Line */}
              <div className="absolute left-[35px] top-20 bottom-12 w-0.5 bg-slate-100 hidden md:block" />

              {/* POL */}
              <div className="flex gap-4 relative z-10">
                 <div className="hidden md:flex flex-col items-center mt-2">
                    <div className="h-4 w-4 rounded-full border-4 border-white bg-blue-500 shadow-sm ring-1 ring-blue-100" />
                 </div>
                 <div className="flex-1 bg-slate-50 p-5 rounded-xl border border-slate-200/60 hover:border-blue-200 transition-colors">
                    <Label className="text-xs font-bold text-blue-600 uppercase mb-2 block">Port of Loading (POL)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Input 
                          value={dossier.pol} 
                          onChange={(e) => updateDossier('pol', e.target.value)}
                          className="bg-white border-slate-200 font-medium" 
                          placeholder="Select Port..."
                       />
                       <Input 
                          type="date"
                          value={dossier.etd ? new Date(dossier.etd).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateDossier('etd', new Date(e.target.value))}
                          className="bg-white border-slate-200"
                       />
                    </div>
                 </div>
              </div>

              {/* POD */}
              <div className="flex gap-4 relative z-10">
                 <div className="hidden md:flex flex-col items-center mt-2">
                    <div className="h-4 w-4 rounded-full border-4 border-white bg-green-500 shadow-sm ring-1 ring-green-100" />
                 </div>
                 <div className="flex-1 bg-slate-50 p-5 rounded-xl border border-slate-200/60 hover:border-green-200 transition-colors">
                    <Label className="text-xs font-bold text-green-600 uppercase mb-2 block">Port of Discharge (POD)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Input 
                          value={dossier.pod} 
                          onChange={(e) => updateDossier('pod', e.target.value)}
                          className="bg-white border-slate-200 font-medium" 
                          placeholder="Select Port..."
                       />
                       <Input 
                          type="date"
                          value={dossier.eta ? new Date(dossier.eta).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateDossier('eta', new Date(e.target.value))}
                          className="bg-white border-slate-200"
                       />
                    </div>
                 </div>
              </div>
            </div>
          </Card>

          {/* CARD 2: Parties */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                    <User className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Stakeholders</h3>
               </div>
               <Button size="sm" variant="outline" onClick={() => setIsAddingParty(!isAddingParty)}>
                  <Plus className="h-4 w-4 mr-1" /> Add
               </Button>
            </div>
            
            <div className="p-6">
              {isAddingParty && (
                 <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-12 gap-3 mb-3">
                       <div className="col-span-4">
                          <Select 
                             value={newParty.role} 
                             onValueChange={(v) => setNewParty({...newParty, role: v as any})}
                          >
                             <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="Shipper">Shipper</SelectItem>
                                <SelectItem value="Consignee">Consignee</SelectItem>
                                <SelectItem value="Notify">Notify</SelectItem>
                                <SelectItem value="Agent">Agent</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="col-span-8">
                          <Input 
                             placeholder="Company Name..." 
                             className="bg-white"
                             value={newParty.name || ''}
                             onChange={e => setNewParty({...newParty, name: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="flex justify-end gap-2">
                       <Button size="sm" variant="ghost" onClick={() => setIsAddingParty(false)}>Cancel</Button>
                       <Button size="sm" onClick={handleAddParty}>Save</Button>
                    </div>
                 </div>
              )}

              <div className="space-y-3">
                 {/* Standard Roles */}
                 {[
                    { label: 'Shipper', data: dossier.shipper, key: 'shipper' },
                    { label: 'Consignee', data: dossier.consignee, key: 'consignee' },
                    ...(dossier.parties || [])
                 ].map((p: any, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-blue-200 hover:bg-slate-50 transition-colors group">
                       <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-24 justify-center bg-white text-slate-600 border-slate-200">
                             {p.role || p.label}
                          </Badge>
                          <div>
                             <div className="font-bold text-sm text-slate-900">{p.data?.name || p.name || '—'}</div>
                             <div className="text-xs text-slate-500">{p.data?.address || p.email || 'No details'}</div>
                          </div>
                       </div>
                       {/* Only show delete for dynamic parties, standard ones use generic update */}
                       {p.id && (
                          <Button 
                             size="icon" variant="ghost" 
                             className="h-8 w-8 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                             onClick={() => handleRemoveParty(p.id)}
                          >
                             <Trash2 className="h-4 w-4" />
                          </Button>
                       )}
                    </div>
                 ))}
              </div>
            </div>
          </Card>

        </div>

        {/* === RIGHT COLUMN === */}
        <div className="space-y-6">

           {/* CARD 3: Containers */}
           <Card className="border-slate-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                    <Box className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Containers</h3>
               </div>
               <Button size="sm" variant="outline" onClick={addContainer}>
                  <Plus className="h-4 w-4 mr-1" /> Add Unit
               </Button>
             </div>

             <div className="p-0">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                     <tr>
                        <th className="px-6 py-3">Number / Seal</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Payload</th>
                        <th className="px-6 py-3 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {dossier.containers.map((cnt) => (
                        <tr key={cnt.id} className="group hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-3">
                              <Input 
                                 className="h-8 text-xs font-mono uppercase w-32 mb-1" 
                                 placeholder="CNTR NO"
                                 value={cnt.number}
                                 onChange={(e) => updateContainer(cnt.id, 'number', e.target.value)}
                              />
                              <Input 
                                 className="h-7 text-[10px] w-32 border-dashed text-slate-500" 
                                 placeholder="SEAL NO"
                                 value={cnt.seal}
                                 onChange={(e) => updateContainer(cnt.id, 'seal', e.target.value)}
                              />
                           </td>
                           <td className="px-6 py-3">
                              <Select 
                                 value={cnt.type} 
                                 onValueChange={(v) => updateContainer(cnt.id, 'type', v as any)}
                              >
                                 <SelectTrigger className="h-8 text-xs w-24 bg-white">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="20DV">20' DV</SelectItem>
                                    <SelectItem value="40HC">40' HC</SelectItem>
                                    <SelectItem value="40RH">40' RH</SelectItem>
                                 </SelectContent>
                              </Select>
                           </td>
                           <td className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                 <Input 
                                    className="h-8 text-xs w-20 text-right"
                                    type="number"
                                    placeholder="KGS"
                                    value={cnt.weight || ''}
                                    onChange={(e) => updateContainer(cnt.id, 'weight', Number(e.target.value))}
                                 />
                                 <span className="text-xs text-slate-400">KG</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                 <Input 
                                    className="h-8 text-xs w-20 text-right"
                                    type="number"
                                    placeholder="PKGS"
                                    value={cnt.packages || ''}
                                    onChange={(e) => updateContainer(cnt.id, 'packages', Number(e.target.value))}
                                 />
                                 <span className="text-xs text-slate-400">PK</span>
                              </div>
                           </td>
                           <td className="px-6 py-3 text-right">
                              <Button 
                                 size="icon" variant="ghost" 
                                 className="h-8 w-8 text-slate-300 hover:text-red-600"
                                 onClick={() => removeContainer(cnt.id)}
                              >
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </td>
                        </tr>
                     ))}
                     {dossier.containers.length === 0 && (
                        <tr>
                           <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs italic">
                              No containers added. Click "Add Unit" to start.
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
             </div>
           </Card>

           {/* TOTALS SUMMARY */}
           <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg">
                 <div className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-1">Total Weight</div>
                 <div className="text-xl font-bold">
                    {dossier.containers.reduce((acc, c) => acc + (c.weight || 0), 0).toLocaleString()} <span className="text-sm font-normal opacity-70">KG</span>
                 </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                 <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Total Packages</div>
                 <div className="text-xl font-bold text-slate-800">
                    {dossier.containers.reduce((acc, c) => acc + (c.packages || 0), 0)} <span className="text-sm font-normal text-slate-400">PKGS</span>
                 </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                 <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Volume</div>
                 <div className="text-xl font-bold text-slate-800">
                    {dossier.containers.reduce((acc, c) => acc + (c.volume || 0), 0).toFixed(2)} <span className="text-sm font-normal text-slate-400">CBM</span>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
};