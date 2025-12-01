import { useState } from 'react';
import { 
    Truck, Ship, Plane, Container, ArrowRight, 
    ShieldCheck, Thermometer, Box, AlertTriangle, 
    Plus, Trash2, Tag, Anchor, Package, Settings 
} from "lucide-react";
import { useClientStore, SupplierRole, SupplierTier, CommoditySector } from "@/store/useClientStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RouteDialog } from "./RouteDialog";

export function ClientLogistics({ isEditing }: { isEditing: boolean }) {
  const { 
      activeClient, addRoute, removeRoute, 
      updateOperationalProfile, addSupplier, removeSupplier, addCommodity, removeCommodity
  } = useClientStore();
  
  const [hsInput, setHsInput] = useState('');
  
  // Form States for Smart Adds
  const [newSupplier, setNewSupplier] = useState({ name: '', role: 'SEA_LINE' as SupplierRole, tier: 'APPROVED' as SupplierTier });
  const [newCommodity, setNewCommodity] = useState({ name: '', sector: 'INDUSTRIAL' as CommoditySector, isHazmat: false });

  if (!activeClient) return null;

  const { operational, routes, suppliers, commodities } = activeClient;

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
          id: Math.random().toString(36).substr(2,9), 
          ...newSupplier 
      });
      setNewSupplier({ name: '', role: 'SEA_LINE', tier: 'APPROVED' });
  };

  const handleAddCommodity = () => {
      if(!newCommodity.name) return;
      addCommodity({
          id: Math.random().toString(36).substr(2,9),
          ...newCommodity
      });
      setNewCommodity({ name: '', sector: 'INDUSTRIAL', isHazmat: false });
  };

  // --- STATS ---
  const totalTEU = routes.filter(r => r.volumeUnit === 'TEU').reduce((acc, curr) => acc + curr.volume, 0);
  const totalAir = routes.filter(r => r.volumeUnit === 'KG').reduce((acc, curr) => acc + curr.volume, 0);

  // --- HELPERS ---
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
          
          {/* 1. CAPACITY FORECAST HEADER */}
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
                  <div className="p-2 bg-slate-100 rounded-lg shadow-sm text-slate-600"><ShieldCheck className="h-5 w-5" /></div>
                  <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Compliance Status</span>
                      <div className="flex items-center gap-2 mt-0.5">
                          {operational.requiresHazmat && <Badge variant="destructive" className="text-[10px] h-5">HAZMAT</Badge>}
                          {operational.requiresReefer && <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-[10px] h-5">REEFER</Badge>}
                          {operational.customsRegime !== 'STANDARD' && <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 text-[10px] h-5">{operational.customsRegime}</Badge>}
                          {!operational.requiresHazmat && !operational.requiresReefer && <span className="text-sm font-medium text-slate-600">Standard General Cargo</span>}
                      </div>
                  </div>
              </Card>
          </div>

          <div className="grid grid-cols-12 gap-6">
              
              {/* 2. TRADE LANES (Left Column) */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                  <div className="flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4 text-slate-500" /> Active Trade Lanes
                      </h3>
                      {isEditing && <RouteDialog onSave={addRoute} />}
                  </div>

                  <div className="space-y-3">
                      {routes.length === 0 && (
                          <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                              <Container className="h-8 w-8 opacity-20 mb-2" />
                              <span className="text-sm">No trade lanes configured.</span>
                          </div>
                      )}
                      
                      {routes.map((route) => (
                          <Card key={route.id} className="group relative overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-200">
                              <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500"></div>
                              <CardContent className="p-4 flex items-center justify-between">
                                  {/* Route Visual */}
                                  <div className="flex items-center gap-4 flex-1">
                                      <div className="flex flex-col items-center w-12">
                                          {route.mode === 'SEA' ? <Ship className="h-5 w-5 text-blue-600" /> : 
                                           route.mode === 'AIR' ? <Plane className="h-5 w-5 text-orange-500" /> : 
                                           <Truck className="h-5 w-5 text-emerald-600" />}
                                          <span className="text-[9px] font-bold text-slate-400 mt-1">{route.mode}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <div className="text-center">
                                              <div className="text-lg font-bold text-slate-800">{route.origin}</div>
                                              <Badge variant="secondary" className="text-[9px] h-4 px-1">POL</Badge>
                                          </div>
                                          <div className="flex flex-col items-center px-2">
                                              <span className="text-[9px] text-slate-400 font-mono mb-0.5">{route.incoterm}</span>
                                              <ArrowRight className="h-4 w-4 text-slate-300" />
                                              <span className="text-[9px] text-slate-400 font-mono mt-0.5">{route.frequency}</span>
                                          </div>
                                          <div className="text-center">
                                              <div className="text-lg font-bold text-slate-800">{route.destination}</div>
                                              <Badge variant="secondary" className="text-[9px] h-4 px-1">POD</Badge>
                                          </div>
                                      </div>
                                  </div>
                                  {/* Metrics & Actions */}
                                  <div className="flex items-center gap-6 pl-6 border-l border-slate-100">
                                      <div className="text-right">
                                          <div className="text-xs text-slate-400 uppercase font-bold">Equipment</div>
                                          <div className="font-mono text-sm font-semibold text-slate-700">{route.equipment}</div>
                                      </div>
                                      <div className="text-right">
                                          <div className="text-xs text-slate-400 uppercase font-bold">Volume</div>
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
                      ))}
                  </div>
              </div>

              {/* 3. INTELLIGENCE COLUMN (Right Column) */}
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
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                  <Thermometer className={`h-4 w-4 ${operational.requiresReefer ? 'text-blue-500' : 'text-slate-400'}`} />
                                  <span className="text-sm font-medium text-slate-700">Temperature Control</span>
                              </div>
                              <Switch 
                                  checked={operational.requiresReefer} 
                                  disabled={!isEditing}
                                  onCheckedChange={(c) => updateOperationalProfile('requiresReefer', c)}
                              />
                          </div>
                          {/* HS CODES */}
                          <div className="pt-2 border-t border-dashed">
                              <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">HS Codes</span>
                              <div className="flex flex-wrap gap-2 mb-2">
                                  {operational.hsCodes.map((code, idx) => (
                                      <Badge key={idx} variant="outline" className="bg-slate-50 border-slate-200 font-mono text-xs">
                                          {code}
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

                  {/* CARD B: COMMERCIAL PREFERENCES (Restored & Upgraded) */}
                  <Card className="shadow-sm border-slate-200">
                      <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                          <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                              <Anchor className="h-3.5 w-3.5" /> Commercial Prefs
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-6">
                          
                          {/* SUPPLIERS SECTION */}
                          <div>
                              <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Preferred Vendors</span>
                                  {isEditing && (
                                      <Popover>
                                          <PopoverTrigger asChild>
                                              <Button size="icon" variant="ghost" className="h-5 w-5 text-slate-400"><Plus className="h-3 w-3" /></Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-64 p-3" align="end">
                                              <div className="space-y-2">
                                                  <h4 className="font-medium text-xs">Add Vendor</h4>
                                                  <Input placeholder="Name (e.g. Maersk)" className="h-7 text-xs" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                                                  <Select value={newSupplier.role} onValueChange={(v: any) => setNewSupplier({...newSupplier, role: v})}>
                                                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                      <SelectContent>
                                                          <SelectItem value="SEA_LINE">Shipping Line</SelectItem>
                                                          <SelectItem value="AIRLINE">Airline</SelectItem>
                                                          <SelectItem value="HAULIER">Haulier</SelectItem>
                                                      </SelectContent>
                                                  </Select>
                                                  <Select value={newSupplier.tier} onValueChange={(v: any) => setNewSupplier({...newSupplier, tier: v})}>
                                                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                      <SelectContent>
                                                          <SelectItem value="STRATEGIC">Strategic</SelectItem>
                                                          <SelectItem value="APPROVED">Approved</SelectItem>
                                                          <SelectItem value="BACKUP">Backup</SelectItem>
                                                          <SelectItem value="BLOCKED">Blocked</SelectItem>
                                                      </SelectContent>
                                                  </Select>
                                                  <Button size="sm" className="w-full h-7 text-xs" onClick={handleAddSupplier}>Add Vendor</Button>
                                              </div>
                                          </PopoverContent>
                                      </Popover>
                                  )}
                              </div>
                              <div className="space-y-2">
                                  {suppliers.map((sup) => (
                                      <div key={sup.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded border border-slate-100 group">
                                          <div className="flex items-center gap-2">
                                              <Badge variant="outline" className={`text-[9px] h-4 px-1 ${getTierColor(sup.tier)}`}>{sup.tier[0]}</Badge>
                                              <span className="font-semibold text-slate-700">{sup.name}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <span className="text-[9px] text-slate-400">{sup.role.replace('_', ' ')}</span>
                                              {isEditing && <Trash2 className="h-3 w-3 cursor-pointer text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeSupplier(sup.id)} />}
                                          </div>
                                      </div>
                                  ))}
                                  {suppliers.length === 0 && <span className="text-xs text-slate-400 italic">No vendors configured.</span>}
                              </div>
                          </div>

                          {/* COMMODITIES SECTION */}
                          <div className="pt-4 border-t border-dashed">
                              <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Commodities</span>
                                  {isEditing && (
                                      <Popover>
                                          <PopoverTrigger asChild>
                                              <Button size="icon" variant="ghost" className="h-5 w-5 text-slate-400"><Plus className="h-3 w-3" /></Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-64 p-3" align="end">
                                              <div className="space-y-2">
                                                  <h4 className="font-medium text-xs">Add Commodity</h4>
                                                  <Input placeholder="Name (e.g. Cotton)" className="h-7 text-xs" value={newCommodity.name} onChange={e => setNewCommodity({...newCommodity, name: e.target.value})} />
                                                  <Select value={newCommodity.sector} onValueChange={(v: any) => setNewCommodity({...newCommodity, sector: v})}>
                                                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                      <SelectContent>
                                                          <SelectItem value="TEXTILE">Textile</SelectItem>
                                                          <SelectItem value="AUTOMOTIVE">Automotive</SelectItem>
                                                          <SelectItem value="PERISHABLE">Perishable</SelectItem>
                                                          <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                                                      </SelectContent>
                                                  </Select>
                                                  <div className="flex items-center gap-2">
                                                      <Switch checked={newCommodity.isHazmat} onCheckedChange={(c) => setNewCommodity({...newCommodity, isHazmat: c})} className="scale-75" />
                                                      <span className="text-xs">Hazmat?</span>
                                                  </div>
                                                  <Button size="sm" className="w-full h-7 text-xs" onClick={handleAddCommodity}>Add Commodity</Button>
                                              </div>
                                          </PopoverContent>
                                      </Popover>
                                  )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                  {commodities.map((com) => (
                                      <Badge key={com.id} variant="outline" className={`gap-1 pr-1 ${com.isHazmat ? 'border-orange-200 bg-orange-50 text-orange-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                                          <Package className="h-3 w-3" /> 
                                          {com.name}
                                          {isEditing && <Trash2 className="h-3 w-3 ml-1 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeCommodity(com.id)} />}
                                      </Badge>
                                  ))}
                                  {commodities.length === 0 && <span className="text-xs text-slate-400 italic">No commodities listed.</span>}
                              </div>
                          </div>

                      </CardContent>
                  </Card>

              </div>
          </div>
      </div>
  );
}