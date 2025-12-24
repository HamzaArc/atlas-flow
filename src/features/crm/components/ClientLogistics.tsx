import { useState } from 'react';
import { 
    Truck, Ship, Plane, Box, AlertTriangle, 
    Trash2, Anchor, UploadCloud, Clock, Plus, 
    MapPin, Factory
} from "lucide-react";
import { useClientStore } from "@/store/useClientStore";
import { SupplierRole, SupplierTier } from "@/types/index";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RouteDialog } from "./RouteDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ClientLogistics({ isEditing }: { isEditing: boolean }) {
  const { 
      activeClient, addRoute, removeRoute, 
      updateOperationalProfile, addSupplier, removeSupplier
  } = useClientStore();
  
  const [hsInput, setHsInput] = useState('');
  
  // Sourcing Supplier / Carrier Form State
  const [newSupplier, setNewSupplier] = useState({ 
      name: '', 
      role: 'EXPORTER' as SupplierRole, 
      tier: 'APPROVED' as SupplierTier,
      country: '',
      city: '',
      address: '',
      contactName: '',
      email: '',
      phone: '',
      products: '',
      notes: ''
  });
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'SUPPLIER' | 'CARRIER'>('SUPPLIER');

  if (!activeClient) return null;

  const { operational, routes, suppliers } = activeClient;

  // Split suppliers into Logistics vs Commercial
  const commercialSuppliers = suppliers.filter(s => s.role === 'EXPORTER');
  const logisticsPartners = suppliers.filter(s => s.role !== 'EXPORTER');

  // --- HANDLERS ---
  const handleAddHS = () => {
      if(!hsInput.trim()) return;
      const newCodes = [...(operational.hsCodes || []), hsInput.trim()];
      updateOperationalProfile('hsCodes', newCodes);
      setHsInput('');
  };

  const handleRemoveHS = (code: string) => {
      updateOperationalProfile('hsCodes', operational.hsCodes.filter(c => c !== code));
  };

  const openAddDialog = (mode: 'SUPPLIER' | 'CARRIER') => {
      setDialogMode(mode);
      setNewSupplier({ 
          name: '', 
          role: mode === 'SUPPLIER' ? 'EXPORTER' : 'SEA_LINE', 
          tier: 'APPROVED', 
          country: '', city: '', address: '', contactName: '', email: '', phone: '', products: '', notes: ''
      });
      setIsSupplierDialogOpen(true);
  };

  const handleAddSupplier = () => {
      if(!newSupplier.name) return;
      addSupplier({
          id: Math.random().toString(36).substr(2, 9),
          ...newSupplier
      });
      setIsSupplierDialogOpen(false);
  };

  // --- METRICS ---
  const totalTEU = routes.filter(r => r.volumeUnit === 'TEU').reduce((acc, curr) => acc + curr.volume, 0);
  const totalAir = routes.filter(r => r.volumeUnit === 'KG').reduce((acc, curr) => acc + curr.volume, 0);

  const getTierColor = (tier: SupplierTier) => {
      switch(tier) {
          case 'STRATEGIC': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
          case 'BACKUP': return 'bg-slate-100 text-slate-600 border-slate-200';
          case 'BLOCKED': return 'bg-red-50 text-red-700 border-red-200';
          default: return 'bg-slate-50';
      }
  };

  return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
          
          {/* SHARED DIALOG FOR BOTH SUPPLIERS AND CARRIERS */}
          <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
              <DialogContent className="max-w-2xl">
                  <DialogHeader>
                      <DialogTitle>{dialogMode === 'SUPPLIER' ? 'Add Commercial Supplier' : 'Add Logistics Partner'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-2 col-span-2">
                          <Label>Company Name</Label>
                          <Input value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} placeholder={dialogMode === 'SUPPLIER' ? "e.g. Shanghai Textile Co." : "e.g. Maersk Line"} />
                      </div>
                      <div className="space-y-2">
                          <Label>Role</Label>
                          <Select 
                            value={newSupplier.role} 
                            onValueChange={(v: any) => setNewSupplier({...newSupplier, role: v})}
                            disabled={dialogMode === 'SUPPLIER'} 
                          >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  {dialogMode === 'SUPPLIER' ? (
                                    <SelectItem value="EXPORTER">Exporter / Factory</SelectItem>
                                  ) : (
                                    <>
                                        <SelectItem value="SEA_LINE">Shipping Line</SelectItem>
                                        <SelectItem value="AIRLINE">Airline</SelectItem>
                                        <SelectItem value="HAULIER">Haulier</SelectItem>
                                        <SelectItem value="FORWARDER">Freight Forwarder</SelectItem>
                                    </>
                                  )}
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label>Relationship Tier</Label>
                          <Select value={newSupplier.tier} onValueChange={(v: any) => setNewSupplier({...newSupplier, tier: v})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="STRATEGIC">Strategic</SelectItem>
                                  <SelectItem value="APPROVED">Approved</SelectItem>
                                  <SelectItem value="BACKUP">Backup</SelectItem>
                                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      
                      <div className="col-span-2 border-t border-slate-100 my-2"></div>

                      <div className="space-y-2">
                          <Label>Country</Label>
                          <Input value={newSupplier.country} onChange={(e) => setNewSupplier({...newSupplier, country: e.target.value})} placeholder="e.g. China" />
                      </div>
                      <div className="space-y-2">
                          <Label>City</Label>
                          <Input value={newSupplier.city} onChange={(e) => setNewSupplier({...newSupplier, city: e.target.value})} placeholder="e.g. Shanghai" />
                      </div>

                      {dialogMode === 'SUPPLIER' && (
                        <>
                            <div className="col-span-2 border-t border-slate-100 my-2"></div>
                            <div className="space-y-2 col-span-2">
                                <Label>Primary Goods / Products</Label>
                                <Input value={newSupplier.products} onChange={(e) => setNewSupplier({...newSupplier, products: e.target.value})} placeholder="e.g. Cotton Fabrics" />
                            </div>
                        </>
                      )}
                  </div>
                  <Button onClick={handleAddSupplier} className="w-full">Save Partner</Button>
              </DialogContent>
          </Dialog>

          {/* 1. CAPACITY HEADER */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-100 shadow-sm flex items-center p-4 gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600"><Ship className="h-5 w-5" /></div>
                  <div>
                      <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Sea Volume</span>
                      <div className="text-xl font-bold text-slate-800">{totalTEU} <span className="text-xs font-medium text-slate-500">TEU/yr</span></div>
                  </div>
              </Card>
              <Card className="bg-orange-50 border-orange-100 shadow-sm flex items-center p-4 gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-orange-600"><Plane className="h-5 w-5" /></div>
                  <div>
                      <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">Air Volume</span>
                      <div className="text-xl font-bold text-slate-800">{totalAir} <span className="text-xs font-medium text-slate-500">kg/yr</span></div>
                  </div>
              </Card>
              <Card className="bg-white border-slate-200 shadow-sm flex items-center p-4 gap-3 md:col-span-2">
                  <div className="p-2 bg-slate-100 rounded-lg shadow-sm text-slate-600"><Clock className="h-5 w-5" /></div>
                  <div className="flex-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Negotiated Free Time (Detention at POD)</span>
                      <div className="flex items-center gap-2 mt-1">
                          {isEditing ? (
                              <Input 
                                type="number" 
                                className="h-7 w-20 text-sm" 
                                value={operational.negotiatedFreeTime || 7} 
                                onChange={(e) => updateOperationalProfile('negotiatedFreeTime', parseInt(e.target.value))} 
                              />
                          ) : (
                              <span className="text-xl font-bold text-slate-800">{operational.negotiatedFreeTime || 7}</span>
                          )}
                          <span className="text-xs font-medium text-slate-500">Days</span>
                          <span className="text-[10px] text-slate-400 ml-2">(Standard is 7)</span>
                      </div>
                  </div>
              </Card>
          </div>

          <div className="grid grid-cols-12 gap-6">
              
              {/* 2. SOURCING NETWORK */}
              <div className="col-span-12 space-y-4">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                          <Factory className="h-4 w-4 text-slate-500" /> Sourcing Network & Suppliers
                      </h3>
                      
                      {isEditing && (
                          <Button size="sm" className="h-8 bg-slate-900 text-white shadow-sm" onClick={() => openAddDialog('SUPPLIER')}>
                              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Supplier
                          </Button>
                      )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {commercialSuppliers.map((sup) => (
                          <Card key={sup.id} className="relative overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-200 group">
                              <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500"></div>
                              <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-3">
                                      <div>
                                          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                              {sup.name}
                                              <Badge variant="outline" className={`text-[8px] h-4 px-1 ${getTierColor(sup.tier)}`}>
                                                  {sup.tier}
                                              </Badge>
                                          </h4>
                                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                              <MapPin className="h-3 w-3" />
                                              {sup.city}, {sup.country}
                                          </div>
                                      </div>
                                      {isEditing && (
                                          <Button variant="ghost" size="icon" onClick={() => removeSupplier(sup.id)} className="h-6 w-6 text-slate-300 hover:text-red-500 -mr-2 -mt-2">
                                              <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                      )}
                                  </div>
                                  
                                  <div className="bg-slate-50 rounded-md p-2.5 space-y-2 border border-slate-100">
                                      <div className="flex items-start gap-2">
                                          <Box className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                                          <span className="text-xs font-medium text-slate-700 leading-tight">
                                              {sup.products || 'General Cargo'}
                                          </span>
                                      </div>
                                  </div>
                              </CardContent>
                          </Card>
                      ))}
                      {commercialSuppliers.length === 0 && (
                          <div className="col-span-2 h-24 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400">
                              <Factory className="h-6 w-6 opacity-20 mb-2" />
                              <span className="text-xs">No sourcing suppliers added.</span>
                          </div>
                      )}
                  </div>
              </div>

              {/* 3. TRADE LANES */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4 text-slate-500" /> Active Trade Lanes
                      </h3>
                      {isEditing && <RouteDialog onSave={addRoute} />}
                  </div>

                  <div className="space-y-3">
                      {routes.map((route) => {
                          const isImport = ['EXW', 'FCA', 'FOB'].includes(route.incoterm);
                          return (
                            <Card key={route.id} className="group relative overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-200">
                                <div className={`absolute top-0 left-0 bottom-0 w-1 ${route.mode === 'SEA' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex flex-col items-center w-12">
                                            {route.mode === 'SEA' ? <Ship className="h-5 w-5 text-blue-600" /> : <Plane className="h-5 w-5 text-orange-500" />}
                                            <span className="text-[9px] font-bold text-slate-400 mt-1">{route.mode}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-slate-800">{route.origin}</div>
                                                {isImport && <Badge variant="outline" className="text-[8px] bg-amber-50 text-amber-700 border-amber-200">Import</Badge>}
                                            </div>
                                            <div className="flex flex-col items-center px-2">
                                                <span className="text-[9px] text-slate-400 font-mono mb-0.5">{route.incoterm}</span>
                                                <div className="h-px w-8 bg-slate-300"></div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-slate-800">{route.destination}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 pl-6 border-l border-slate-100">
                                        <div className="text-right">
                                            <div className="text-xs text-slate-400 uppercase font-bold">Vol</div>
                                            <div className="font-mono text-sm font-semibold text-blue-700">{route.volume} {route.volumeUnit}</div>
                                        </div>
                                        {isEditing && (
                                            <Button variant="ghost" size="icon" onClick={() => removeRoute(route.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                          );
                      })}
                  </div>
              </div>

              {/* 4. INTELLIGENCE & LOGISTICS VENDORS */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                  
                  {/* CARD A: HANDLING SPECS */}
                  <Card className="shadow-sm border-slate-200">
                      <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
                          <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                              <Box className="h-3.5 w-3.5" /> Special Handling
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                  <AlertTriangle className={`h-4 w-4 ${operational.requiresHazmat ? 'text-red-500' : 'text-slate-400'}`} />
                                  <span className="text-sm font-medium text-slate-700">Dangerous Goods</span>
                              </div>
                              <Switch 
                                  checked={operational.requiresHazmat} 
                                  disabled={!isEditing}
                                  onCheckedChange={(c) => updateOperationalProfile('requiresHazmat', c)}
                              />
                          </div>
                          <div className="pt-2 border-t border-dashed">
                              <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">HS Codes & Rulings</span>
                              <div className="flex flex-wrap gap-2 mb-2">
                                  {operational.hsCodes.map((code, idx) => (
                                      <Badge key={idx} variant="outline" className="bg-slate-50 border-slate-200 font-mono text-xs pr-1">
                                          {code}
                                          <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                     <div className="ml-1 h-4 w-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-100">
                                                        <UploadCloud className="h-2.5 w-2.5" />
                                                     </div>
                                                </TooltipTrigger>
                                                <TooltipContent>Upload Technical Sheet</TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          {isEditing && (
                                              <Trash2 className="h-3 w-3 ml-1 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => handleRemoveHS(code)} />
                                          )}
                                      </Badge>
                                  ))}
                              </div>
                              {isEditing && (
                                  <div className="flex gap-2">
                                      <Input className="h-7 text-xs font-mono" placeholder="0000.00" value={hsInput} onChange={(e) => setHsInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddHS()} />
                                      <Button size="sm" variant="secondary" className="h-7" onClick={handleAddHS}>Add</Button>
                                  </div>
                              )}
                          </div>
                      </CardContent>
                  </Card>

                   {/* LOGISTICS VENDORS (Carrier Management) */}
                   <Card className="shadow-sm border-slate-200">
                      <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                          <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                              <Anchor className="h-3.5 w-3.5" /> Approved Carriers
                          </CardTitle>
                          {isEditing && (
                             <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openAddDialog('CARRIER')}>
                                <Plus className="h-3.5 w-3.5 text-blue-600" />
                             </Button>
                          )}
                      </CardHeader>
                      <CardContent className="p-4">
                          <div className="space-y-2">
                                {logisticsPartners.map((sup) => (
                                    <div key={sup.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-md border border-slate-100 group">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`text-[9px] h-4 px-1 py-0 ${getTierColor(sup.tier)}`}>
                                                {sup.tier}
                                            </Badge>
                                            <span className="font-semibold text-slate-700">{sup.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] text-slate-400">{sup.role.replace('_', ' ')}</span>
                                            {isEditing && (
                                                <Trash2 className="h-3 w-3 text-slate-300 hover:text-red-500 cursor-pointer" onClick={() => removeSupplier(sup.id)} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {logisticsPartners.length === 0 && <span className="text-xs text-slate-400 italic">No carriers assigned.</span>}
                          </div>
                      </CardContent>
                   </Card>
              </div>
          </div>
      </div>
  );
}