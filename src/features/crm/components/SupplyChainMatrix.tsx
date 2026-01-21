import { useState } from 'react';
import { 
    Truck, Ship, Plane, Trash2, Plus, 
    MapPin, Factory, QrCode, Mail, Anchor, 
    ArrowRight, Globe, MessageCircle, Pencil
} from "lucide-react";
import { useClientStore } from "@/store/useClientStore";
import { SupplierRole, SupplierTier, Incoterm, TransportMode, ClientSupplier, ClientRoute } from "@/types/index";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AddressWithMap } from "@/components/ui/address-with-map";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_INCOTERMS: Incoterm[] = [
    'EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'
];

export function SupplyChainMatrix({ isEditing }: { isEditing: boolean }) {
  const { 
      activeClient, addRoute, updateRoute, removeRoute, 
      addSupplier, updateSupplier, removeSupplier
  } = useClientStore();
  
  // --- STATE ---
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [isCarrierOpen, setIsCarrierOpen] = useState(false);
  const [isLaneOpen, setIsLaneOpen] = useState(false);
  
  // Edit State Triggers
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingLaneId, setEditingLaneId] = useState<string | null>(null);

  // Supplier Form
  const [newSupplier, setNewSupplier] = useState({ 
      name: '', role: 'EXPORTER' as SupplierRole, tier: 'APPROVED' as SupplierTier,
      country: '', city: '', address: '', contactName: '', email: '', phone: '', 
      products: '', socialQrCodeUrl: '', socialId: '', defaultIncoterms: [] as Incoterm[]
  });

  // Lane Form
  const [newLane, setNewLane] = useState({
      origin: '', destination: '', mode: 'SEA_FCL' as TransportMode, 
      incoterm: 'FOB' as Incoterm, 
      equipment: '40HC' as '20DV' | '40HC' | 'LCL' | 'AIR' | 'FTL' | 'LTL',
      volume: 0, volumeUnit: 'TEU' as 'TEU' | 'KG' | 'TRK'
  });

  if (!activeClient) return null;

  const { routes, suppliers } = activeClient;
  const commercialSuppliers = suppliers.filter(s => s.role === 'EXPORTER');
  const carriers = suppliers.filter(s => s.role !== 'EXPORTER');

  // --- ACTIONS ---

  // 1. OPEN DIALOGS (Create vs Edit)
  const openNewSupplier = () => {
      setEditingSupplierId(null);
      setNewSupplier({
          name: '', role: 'EXPORTER', tier: 'APPROVED', country: '', city: '', address: '', 
          contactName: '', email: '', phone: '', products: '', socialQrCodeUrl: '', socialId: '', defaultIncoterms: []
      });
      setIsSupplierOpen(true);
  };

  const openEditSupplier = (supplier: ClientSupplier) => {
      setEditingSupplierId(supplier.id);
      setNewSupplier({
          name: supplier.name, 
          role: supplier.role, 
          tier: supplier.tier, 
          country: supplier.country || '', 
          city: supplier.city || '', 
          address: supplier.address || '', 
          contactName: supplier.contactName || '', 
          email: supplier.email || '', 
          phone: supplier.phone || '', 
          products: supplier.products || '', 
          socialQrCodeUrl: supplier.socialQrCodeUrl || '', 
          socialId: supplier.socialId ? String(supplier.socialId) : '', 
          defaultIncoterms: supplier.defaultIncoterms || []
      });
      
      if(supplier.role === 'EXPORTER') {
          setIsSupplierOpen(true);
      } else {
          setIsCarrierOpen(true);
      }
  };

  const openNewCarrier = () => {
      setEditingSupplierId(null);
      setNewSupplier({
          name: '', role: 'SEA_LINE', tier: 'APPROVED', country: '', city: '', address: '', 
          contactName: '', email: '', phone: '', products: '', socialQrCodeUrl: '', socialId: '', defaultIncoterms: []
      });
      setIsCarrierOpen(true);
  };

  const openNewLane = () => {
      setEditingLaneId(null);
      setNewLane({
          origin: '', destination: '', mode: 'SEA_FCL', incoterm: 'FOB', equipment: '40HC', volume: 0, volumeUnit: 'TEU'
      });
      setIsLaneOpen(true);
  };

  const openEditLane = (lane: ClientRoute) => {
      setEditingLaneId(lane.id);
      setNewLane({
          origin: lane.origin, 
          destination: lane.destination, 
          mode: lane.mode, 
          incoterm: lane.incoterm, 
          equipment: lane.equipment, 
          volume: lane.volume, 
          volumeUnit: lane.volumeUnit
      });
      setIsLaneOpen(true);
  };

  // 2. SAVE HANDLERS
  const handleSaveSupplier = (isCarrier: boolean) => {
      if(!newSupplier.name) return;
      
      const payload = { ...newSupplier };
      // Carrier defaults to SEA_LINE if new, but keep existing role if editing
      if(!editingSupplierId && isCarrier) {
          payload.role = 'SEA_LINE';
      }

      if(editingSupplierId) {
          updateSupplier({
              id: editingSupplierId,
              ...payload
          } as ClientSupplier);
      } else {
          addSupplier({
              id: Math.random().toString(36).substr(2, 9),
              ...payload
          } as ClientSupplier);
      }
      
      isCarrier ? setIsCarrierOpen(false) : setIsSupplierOpen(false);
  };

  const handleSaveLane = () => {
      if(!newLane.origin || !newLane.destination) return;

      if(editingLaneId) {
          updateRoute({
              id: editingLaneId,
              ...newLane,
              frequency: 'MONTHLY' // Keep existing or default
          } as ClientRoute);
      } else {
          addRoute({
              id: Math.random().toString(36).substr(2, 9),
              ...newLane,
              frequency: 'MONTHLY'
          });
      }
      setIsLaneOpen(false);
  };

  // --- HELPERS ---
  const toggleIncoterm = (term: Incoterm) => {
      const current = newSupplier.defaultIncoterms || [];
      if(current.includes(term)) {
          setNewSupplier({...newSupplier, defaultIncoterms: current.filter(t => t !== term)});
      } else {
          setNewSupplier({...newSupplier, defaultIncoterms: [...current, term]});
      }
  };

  const getTierColor = (tier: SupplierTier) => {
      switch(tier) {
          case 'STRATEGIC': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
          case 'BACKUP': return 'bg-slate-100 text-slate-600 border-slate-200';
          case 'BLOCKED': return 'bg-red-50 text-red-700 border-red-200';
          default: return 'bg-slate-50';
      }
  };

  const isSeaMode = (mode: TransportMode) => mode === 'SEA_FCL' || mode === 'SEA_LCL';

  // --- RENDER HELPERS ---
  const renderSupplierCard = (sup: ClientSupplier, icon: any, bgClass: string) => (
      <div key={sup.id} className="group flex flex-col p-3 rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all relative">
          <div className="flex justify-between items-start mb-2">
               <div className="flex items-center gap-3">
                   <div className={`h-8 w-8 rounded flex items-center justify-center ${bgClass}`}>
                       {icon}
                   </div>
                   <div>
                       <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                           {sup.name}
                           <Badge variant="outline" className={`text-[8px] h-4 px-1 py-0 ${getTierColor(sup.tier)}`}>{sup.tier}</Badge>
                       </div>
                       <div className="text-[10px] text-slate-500 flex items-center gap-1">
                           <MapPin className="h-3 w-3" /> {sup.address ? sup.address.split(',')[0] : 'No Address'}
                       </div>
                   </div>
               </div>
               {isEditing && (
                   <div className="flex items-center gap-1">
                       <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-blue-600" onClick={() => openEditSupplier(sup)}>
                           <Pencil className="h-3 w-3" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500" onClick={() => removeSupplier(sup.id)}>
                           <Trash2 className="h-3 w-3" />
                       </Button>
                   </div>
               )}
          </div>
          
          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              {sup.contactName && (
                  <div className="col-span-2 flex items-center gap-1.5 text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="font-medium">{sup.contactName}</span>
                      {sup.phone && <span className="text-slate-400">({sup.phone})</span>}
                  </div>
              )}
               {/* Contact & Socials */}
              <div className="col-span-2 flex items-center gap-3 mt-1">
                   {sup.email && (
                       <div className="flex items-center gap-1 text-slate-500">
                           <Mail className="h-3 w-3" /> {sup.email}
                       </div>
                   )}
                   {sup.socialId && (
                       <div className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                           <MessageCircle className="h-3 w-3" /> {sup.socialId}
                       </div>
                   )}
              </div>

              {sup.defaultIncoterms && sup.defaultIncoterms.length > 0 && (
                  <div className="col-span-2 flex flex-wrap gap-1 mt-1">
                      {sup.defaultIncoterms.map((t: string) => (
                          <Badge key={t} variant="secondary" className="text-[9px] h-4 px-1 bg-slate-100 text-slate-500 border-slate-200">{t}</Badge>
                      ))}
                  </div>
              )}
          </div>

          {sup.socialQrCodeUrl && (
              <div className="absolute bottom-2 right-2">
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger>
                              <QrCode className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                          </TooltipTrigger>
                          <TooltipContent>
                              <img src={sup.socialQrCodeUrl} className="w-24 h-24" alt="QR" />
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </div>
          )}
      </div>
  );

  return (
      <Card className="border-slate-200 shadow-md bg-white animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 h-14 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" /> Supply Chain Matrix
              </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-6">

              {/* 1. SOURCING NETWORK (SUPPLIERS) */}
              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Factory className="h-3 w-3" /> Commercial Suppliers
                      </h4>
                      {isEditing && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={openNewSupplier}>
                              <Plus className="h-3 w-3 mr-1" /> Add Supplier
                          </Button>
                      )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                      {commercialSuppliers.map(s => renderSupplierCard(s, <Factory className="h-4 w-4 text-indigo-600"/>, 'bg-indigo-50 text-indigo-600'))}
                      {commercialSuppliers.length === 0 && (
                          <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs italic">
                              No suppliers mapped.
                          </div>
                      )}
                  </div>
              </div>

              {/* 2. LOGISTICS PARTNERS (CARRIERS) */}
              <div className="space-y-3">
                  <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Anchor className="h-3 w-3" /> Logistics Carriers
                      </h4>
                      {isEditing && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={openNewCarrier}>
                              <Plus className="h-3 w-3 mr-1" /> Add Carrier
                          </Button>
                      )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                      {carriers.map(s => renderSupplierCard(s, <Ship className="h-4 w-4 text-blue-600"/>, 'bg-blue-50 text-blue-600'))}
                      {carriers.length === 0 && (
                          <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs italic">
                              No carriers assigned.
                          </div>
                      )}
                  </div>
              </div>

              {/* 3. TRADE LANES */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Truck className="h-3 w-3" /> Active Trade Lanes
                      </h4>
                      {isEditing && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={openNewLane}>
                              <Plus className="h-3 w-3 mr-1" /> Add Lane
                          </Button>
                      )}
                  </div>
                  <div className="space-y-2">
                      {routes.map((route) => (
                          <div key={route.id} className="flex items-center justify-between p-2.5 rounded border border-slate-100 bg-slate-50/50 hover:border-blue-200 transition-colors group">
                              <div className="flex items-center gap-3">
                                  {isSeaMode(route.mode) ? <Ship className="h-3.5 w-3.5 text-blue-500" /> : route.mode === 'AIR' ? <Plane className="h-3.5 w-3.5 text-orange-500" /> : <Truck className="h-3.5 w-3.5 text-emerald-500" />}
                                  
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                      <span>{route.origin}</span>
                                      <ArrowRight className="h-3 w-3 text-slate-300" />
                                      <span>{route.destination}</span>
                                  </div>
                                  <div className="flex gap-2">
                                     <Badge variant="outline" className="bg-white text-[9px] h-4 px-1 font-mono text-slate-500">{route.incoterm}</Badge>
                                     <Badge variant="outline" className="bg-blue-50 text-blue-600 text-[9px] h-4 px-1 font-mono">{route.equipment}</Badge>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-mono text-slate-400">{route.volume} {route.volumeUnit}</span>
                                  {isEditing && (
                                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Pencil className="h-3.5 w-3.5 text-slate-300 hover:text-blue-600 cursor-pointer" onClick={() => openEditLane(route)} />
                                          <Trash2 className="h-3.5 w-3.5 text-slate-300 hover:text-red-500 cursor-pointer" onClick={() => removeRoute(route.id)} />
                                     </div>
                                  )}
                              </div>
                          </div>
                      ))}
                      {routes.length === 0 && (
                          <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs italic">
                              No trade lanes defined.
                          </div>
                      )}
                  </div>
              </div>

          </CardContent>

          {/* --- DIALOGS --- */}
          
          {/* ADD/EDIT SUPPLIER DIALOG */}
          <Dialog open={isSupplierOpen} onOpenChange={setIsSupplierOpen}>
              <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>{editingSupplierId ? 'Edit' : 'Add'} Commercial Supplier</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="col-span-2 space-y-2">
                          <Label>Company Name</Label>
                          <Input value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="e.g. Shanghai Textile Co." />
                      </div>
                      
                      <div className="col-span-2 space-y-2">
                          <AddressWithMap label="Full Address" value={newSupplier.address} onChange={(v) => setNewSupplier({...newSupplier, address: v})} />
                      </div>
                      
                      <div className="col-span-2 space-y-2 border-t border-slate-100 pt-2">
                          <Label>Supported Incoterms</Label>
                          <div className="flex flex-wrap gap-2">
                              {ALL_INCOTERMS.map(term => (
                                  <div key={term} className="flex items-center space-x-1 border rounded px-2 py-1 bg-slate-50">
                                      <Checkbox 
                                          id={`sup-${term}`} 
                                          checked={newSupplier.defaultIncoterms.includes(term)}
                                          onCheckedChange={() => toggleIncoterm(term)}
                                      />
                                      <label htmlFor={`sup-${term}`} className="text-xs font-mono cursor-pointer">{term}</label>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="col-span-2 space-y-2 border-t border-slate-100 pt-2">
                          <Label>Contact & Social Media</Label>
                          <div className="grid grid-cols-2 gap-3">
                              <Input placeholder="Contact Name" value={newSupplier.contactName} onChange={(e) => setNewSupplier({...newSupplier, contactName: e.target.value})} />
                              <Input placeholder="Phone Number" value={newSupplier.phone} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} />
                              <Input placeholder="Email Address" value={newSupplier.email} onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})} />
                              <div className="flex gap-2">
                                  <Input placeholder="WeChat ID / Social" value={newSupplier.socialId} onChange={(e) => setNewSupplier({...newSupplier, socialId: e.target.value})} />
                                  <TooltipProvider>
                                      <Tooltip>
                                          <TooltipTrigger asChild>
                                             <Button variant="outline" size="icon" className="shrink-0">
                                                 <QrCode className="h-4 w-4" />
                                             </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Upload QR Code (Feature pending)</TooltipContent>
                                      </Tooltip>
                                  </TooltipProvider>
                              </div>
                          </div>
                      </div>
                  </div>
                  <DialogFooter>
                      <Button onClick={() => handleSaveSupplier(false)}>{editingSupplierId ? 'Update' : 'Save'} Supplier</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>

          {/* ADD/EDIT CARRIER DIALOG */}
          <Dialog open={isCarrierOpen} onOpenChange={setIsCarrierOpen}>
              <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{editingSupplierId ? 'Edit' : 'Add'} Logistics Carrier</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                      <div className="space-y-2">
                          <Label>Carrier Name</Label>
                          <Input value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="e.g. Maersk Line" />
                      </div>
                      
                      <div className="space-y-2">
                          <Label>Status Tier</Label>
                          <Select value={newSupplier.tier} onValueChange={(v: any) => setNewSupplier({...newSupplier, tier: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="STRATEGIC">Strategic</SelectItem>
                                  <SelectItem value="APPROVED">Approved</SelectItem>
                                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
                  <DialogFooter>
                      <Button onClick={() => handleSaveSupplier(true)}>{editingSupplierId ? 'Update' : 'Save'} Carrier</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>

          {/* ADD/EDIT LANE DIALOG */}
          <Dialog open={isLaneOpen} onOpenChange={setIsLaneOpen}>
              <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{editingLaneId ? 'Edit' : 'Add'} Trade Lane</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                               <Label>Origin (POL)</Label>
                               <Input value={newLane.origin} onChange={(e) => setNewLane({...newLane, origin: e.target.value})} placeholder="e.g. CNSHA" />
                           </div>
                           <div className="space-y-2">
                               <Label>Destination (POD)</Label>
                               <Input value={newLane.destination} onChange={(e) => setNewLane({...newLane, destination: e.target.value})} placeholder="e.g. MACAS" />
                           </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                               <Label>Transport Mode</Label>
                               <Select value={newLane.mode} onValueChange={(v: TransportMode) => setNewLane({...newLane, mode: v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="SEA_FCL">Sea FCL</SelectItem>
                                      <SelectItem value="SEA_LCL">Sea LCL</SelectItem>
                                      <SelectItem value="AIR">Air Freight</SelectItem>
                                      <SelectItem value="ROAD">Road Freight</SelectItem>
                                  </SelectContent>
                               </Select>
                           </div>
                           <div className="space-y-2">
                               <Label>Equipment List</Label>
                               <Select value={newLane.equipment} onValueChange={(v: any) => setNewLane({...newLane, equipment: v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="20DV">20' DV</SelectItem>
                                      <SelectItem value="40HC">40' HC</SelectItem>
                                      <SelectItem value="LCL">LCL</SelectItem>
                                      <SelectItem value="AIR">Air</SelectItem>
                                      <SelectItem value="FTL">FTL (Road)</SelectItem>
                                      <SelectItem value="LTL">LTL (Road)</SelectItem>
                                  </SelectContent>
                               </Select>
                           </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <Label>Incoterm</Label>
                               <Select value={newLane.incoterm} onValueChange={(v: Incoterm) => setNewLane({...newLane, incoterm: v})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                      {ALL_INCOTERMS.map(term => (
                                          <SelectItem key={term} value={term}>{term}</SelectItem>
                                      ))}
                                  </SelectContent>
                               </Select>
                           </div>
                           <div className="space-y-2">
                               <Label>Est. Annual Volume</Label>
                               <div className="flex gap-2">
                                   <Input type="number" value={newLane.volume} onChange={(e) => setNewLane({...newLane, volume: parseInt(e.target.value)})} />
                                   <Select value={newLane.volumeUnit} onValueChange={(v: any) => setNewLane({...newLane, volumeUnit: v})}>
                                      <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="TEU">TEU</SelectItem>
                                          <SelectItem value="KG">KG</SelectItem>
                                          <SelectItem value="TRK">Trucks</SelectItem>
                                      </SelectContent>
                                   </Select>
                               </div>
                           </div>
                      </div>
                  </div>
                  <DialogFooter>
                      <Button onClick={handleSaveLane}>{editingLaneId ? 'Update' : 'Add'} Trade Lane</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>

      </Card>
  );
}