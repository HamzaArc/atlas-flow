import { useState } from 'react';
import { 
    Truck, Ship, Plane, Box, AlertTriangle, 
    Trash2, UploadCloud, Clock, Plus, 
    MapPin, Factory, QrCode, Mail, ChevronDown, ChevronUp
} from "lucide-react";
import { useClientStore } from "@/store/useClientStore";
import { SupplierRole, SupplierTier, TransportMode } from "@/types/index";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RouteDialog } from "./RouteDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AddressWithMap } from "@/components/ui/address-with-map";

export function ClientLogistics({ isEditing }: { isEditing: boolean }) {
  const { 
      activeClient, addRoute, 
      updateOperationalProfile, addSupplier, removeSupplier
  } = useClientStore();
  
  const [hsInput, setHsInput] = useState('');
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  
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
      socialQrCodeUrl: '',
      defaultIncoterms: [] as string[],
      notes: ''
  });

  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);

  if (!activeClient) return null;

  const { operational, routes, suppliers } = activeClient;

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

  const handleAddSupplier = () => {
      if(!newSupplier.name) return;
      addSupplier({
          id: Math.random().toString(36).substr(2, 9),
          ...newSupplier
      } as any);
      setIsSupplierDialogOpen(false);
  };

  const handleFileUpload = () => {
      const fakeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WeChatID_Example";
      setNewSupplier({...newSupplier, socialQrCodeUrl: fakeUrl});
  };

  const toggleLanes = (id: string) => {
    setExpandedSupplierId(expandedSupplierId === id ? null : id);
  };

  // --- HELPERS ---
  const isSeaMode = (mode: TransportMode) => mode === 'SEA_FCL' || mode === 'SEA_LCL';

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
          
          {/* DIALOG: ADD SUPPLIER */}
          <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="bg-slate-50 -mx-6 -mt-6 p-6 border-b border-slate-100">
                      <DialogTitle className="flex items-center gap-2 text-slate-800">
                          <Factory className="h-5 w-5 text-blue-600" /> 
                          Add Supply Chain Partner
                      </DialogTitle>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-12 gap-6 py-4">
                      {/* Left: Identity */}
                      <div className="col-span-12 md:col-span-6 space-y-4">
                          <div className="space-y-2">
                              <Label>Company Name</Label>
                              <Input 
                                  value={newSupplier.name} 
                                  onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} 
                                  placeholder="e.g. Shanghai Textile Co." 
                                  className="font-bold"
                              />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label>Role</Label>
                                  <Select 
                                      value={newSupplier.role} 
                                      onValueChange={(v: string) => setNewSupplier({...newSupplier, role: v as SupplierRole})}
                                  >
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="EXPORTER">Exporter / Factory</SelectItem>
                                          <SelectItem value="SEA_LINE">Shipping Line</SelectItem>
                                          <SelectItem value="AIRLINE">Airline</SelectItem>
                                          <SelectItem value="FORWARDER">Freight Forwarder</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2">
                                  <Label>Relationship Tier</Label>
                                  <Select value={newSupplier.tier} onValueChange={(v: string) => setNewSupplier({...newSupplier, tier: v as SupplierTier})}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="STRATEGIC">Strategic (Preferred)</SelectItem>
                                          <SelectItem value="APPROVED">Approved</SelectItem>
                                          <SelectItem value="BACKUP">Backup</SelectItem>
                                          <SelectItem value="BLOCKED">Blocked</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>

                          <div className="space-y-2">
                               <Label>Commodities / Products</Label>
                               <Input value={newSupplier.products} onChange={(e) => setNewSupplier({...newSupplier, products: e.target.value})} placeholder="e.g. Cotton Fabrics, Electronics" />
                          </div>

                           <div className="space-y-2">
                               <Label>Incoterms Preference</Label>
                               <Input placeholder="e.g. FOB, EXW (Comma separated)" onChange={(e) => setNewSupplier({...newSupplier, defaultIncoterms: e.target.value.split(',')})} />
                           </div>
                      </div>

                      {/* Right: Location & Contact */}
                      <div className="col-span-12 md:col-span-6 space-y-4 pl-0 md:pl-6 border-l border-slate-100">
                           <AddressWithMap 
                                label="Factory / Office Location"
                                value={newSupplier.address}
                                onChange={(val: string) => setNewSupplier({...newSupplier, address: val})}
                                placeholder="Search location..."
                           />
                           <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label>City</Label>
                                  <Input value={newSupplier.city} onChange={(e) => setNewSupplier({...newSupplier, city: e.target.value})} />
                               </div>
                               <div className="space-y-2">
                                  <Label>Country</Label>
                                  <Input value={newSupplier.country} onChange={(e) => setNewSupplier({...newSupplier, country: e.target.value})} />
                               </div>
                           </div>
                           
                           <div className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-200 mt-2">
                                <Label className="text-blue-600 font-bold">Primary Contact Person</Label>
                                <Input 
                                    placeholder="Full Name" 
                                    value={newSupplier.contactName} 
                                    onChange={(e) => setNewSupplier({...newSupplier, contactName: e.target.value})}
                                    className="h-8 bg-white" 
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="Email" value={newSupplier.email} onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})} className="h-8 bg-white" />
                                    <Input placeholder="Phone / Mobile" value={newSupplier.phone} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} className="h-8 bg-white" />
                                </div>
                                <div className="pt-2">
                                    <Label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">WeChat / Social QR</Label>
                                    <div className="flex items-center gap-3">
                                        {newSupplier.socialQrCodeUrl ? (
                                            <div className="relative group">
                                                <img src={newSupplier.socialQrCodeUrl} className="w-16 h-16 rounded border bg-white p-1" alt="QR" />
                                                <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={() => setNewSupplier({...newSupplier, socialQrCodeUrl: ''})}>×</Button>
                                            </div>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={handleFileUpload} className="w-full h-16 border-dashed border-slate-300 text-slate-400 hover:bg-white">
                                                <QrCode className="h-4 w-4 mr-2" /> Upload QR Image
                                            </Button>
                                        )}
                                        <div className="text-[10px] text-slate-400 leading-tight flex-1">
                                            Upload WeChat, WhatsApp or Line QR code for quick scanning by operations team.
                                        </div>
                                    </div>
                                </div>
                           </div>
                      </div>
                  </div>
                  <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-4 border-t border-slate-100">
                      <Button variant="ghost" onClick={() => setIsSupplierDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddSupplier} className="bg-blue-600 hover:bg-blue-700">Save Partner</Button>
                  </DialogFooter>
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
              
              {/* 2. UNIFIED SUPPLY CHAIN MATRIX */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                          <Factory className="h-4 w-4 text-slate-500" /> Supply Chain Matrix
                      </h3>
                      
                      <div className="flex gap-2">
                          {isEditing && (
                             <>
                              <Button size="sm" variant="outline" onClick={() => setIsSupplierDialogOpen(true)}>
                                  <Plus className="h-3.5 w-3.5 mr-1.5" /> New Partner
                              </Button>
                              <RouteDialog onSave={addRoute} />
                             </>
                          )}
                      </div>
                  </div>

                  <div className="space-y-4">
                      {suppliers.length === 0 && (
                          <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                              <Factory className="h-8 w-8 opacity-20 mb-2" />
                              <span className="text-sm">No supply chain partners mapped.</span>
                              <span className="text-xs">Add exporters or carriers to visualize trade lanes.</span>
                          </div>
                      )}

                      {suppliers.map((sup) => {
                          const linkedRoutes = routes; 
                          const isExpanded = expandedSupplierId === sup.id;

                          return (
                              <Card key={sup.id} className="group border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                  <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-start">
                                      <div className="flex gap-4">
                                          {/* Partner Icon */}
                                          <div className={`h-12 w-12 rounded-lg flex items-center justify-center border shadow-sm ${sup.role === 'EXPORTER' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                              {sup.role === 'EXPORTER' ? <Factory className="h-6 w-6" /> : <Ship className="h-6 w-6" />}
                                          </div>
                                          
                                          {/* Details */}
                                          <div>
                                              <div className="flex items-center gap-2">
                                                  <h4 className="font-bold text-slate-800 text-base">{sup.name}</h4>
                                                  <Badge variant="outline" className={`text-[9px] h-5 ${getTierColor(sup.tier)}`}>{sup.tier}</Badge>
                                                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded uppercase tracking-wider">{sup.role}</span>
                                              </div>
                                              
                                              <div className="flex flex-wrap gap-4 mt-1.5">
                                                   <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                       <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                       {sup.city}, {sup.country}
                                                   </div>
                                                   {sup.contactName && (
                                                       <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                                            <span className="font-medium">{sup.contactName}</span>
                                                       </div>
                                                   )}
                                                   {sup.email && (
                                                       <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                            <Mail className="h-3 w-3 text-slate-400" />
                                                            <span className="hover:text-blue-600 cursor-pointer">{sup.email}</span>
                                                       </div>
                                                   )}
                                              </div>
                                          </div>
                                      </div>

                                      {/* Actions & QR */}
                                      <div className="flex items-start gap-3">
                                          {sup.socialQrCodeUrl && (
                                               <TooltipProvider>
                                                 <Tooltip>
                                                   <TooltipTrigger>
                                                     <div className="h-8 w-8 bg-white border border-slate-200 rounded flex items-center justify-center hover:border-blue-300 cursor-pointer">
                                                         <QrCode className="h-4 w-4 text-slate-600" />
                                                     </div>
                                                   </TooltipTrigger>
                                                   <TooltipContent>
                                                       <img src={sup.socialQrCodeUrl} className="w-32 h-32" alt="QR" />
                                                   </TooltipContent>
                                                 </Tooltip>
                                               </TooltipProvider>
                                          )}
                                          {isEditing && (
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => removeSupplier(sup.id)}>
                                                  <Trash2 className="h-4 w-4" />
                                              </Button>
                                          )}
                                      </div>
                                  </div>

                                  {/* Active Lanes (Custom Toggler) */}
                                  <div className="bg-white">
                                      <div 
                                          className="px-4 py-2 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                          onClick={() => toggleLanes(sup.id)}
                                      >
                                          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                                              <Truck className="h-3.5 w-3.5" /> Active Trade Lanes ({linkedRoutes.length})
                                          </span>
                                          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                      </div>
                                      
                                      {isExpanded && (
                                          <div className="p-4 space-y-3 animate-in slide-in-from-top-1 fade-in duration-200">
                                              {linkedRoutes.map((route) => (
                                                  <div key={route.id} className="flex items-center justify-between p-3 rounded border border-slate-100 bg-slate-50/50 hover:border-blue-200 transition-colors">
                                                      <div className="flex items-center gap-4">
                                                          {isSeaMode(route.mode) ? <Ship className="h-4 w-4 text-blue-500" /> : <Plane className="h-4 w-4 text-orange-500" />}
                                                          
                                                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                              <span>{route.origin}</span>
                                                              <span className="text-slate-300">→</span>
                                                              <span>{route.destination}</span>
                                                          </div>
                                                          
                                                          <Badge variant="outline" className="bg-white text-[10px] font-mono">{route.incoterm}</Badge>
                                                      </div>
                                                      <div className="text-xs font-mono font-medium text-slate-600">
                                                          {route.volume} {route.volumeUnit}/yr
                                                      </div>
                                                  </div>
                                              ))}
                                              {linkedRoutes.length === 0 && (
                                                  <div className="text-xs text-slate-400 italic pl-1">No specific lanes assigned yet.</div>
                                              )}
                                          </div>
                                      )}
                                  </div>
                              </Card>
                          );
                      })}
                  </div>
              </div>

              {/* 3. INTELLIGENCE & SPECS */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                  
                  {/* CARD A: HANDLING SPECS */}
                  <Card className="shadow-sm border-slate-200 bg-white">
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
              </div>
          </div>
      </div>
  );
}