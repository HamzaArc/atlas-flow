import { useState, useMemo } from 'react';
import { 
   MapPin, Box, Plus, Trash2, User, 
   ArrowRight, Shield,
   Truck, Check, ChevronsUpDown, Home, Calendar,
   FileText, Scale
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { ShipmentParty, CargoItem, DossierContainer } from "@/types/index";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Port Data (Shared)
const PORT_DB = [
  { id: "CASABLANCA (MAP)", country: "Morocco", code: "MACAS" },
  { id: "TANGER MED (MAP)", country: "Morocco", code: "MAPTM", tier: true },
  { id: "AGADIR (MAP)", country: "Morocco", code: "MAAGA" },
  { id: "ROTTERDAM (NL)", country: "Netherlands", code: "NLRTM", tier: true },
  { id: "HAMBURG (DE)", country: "Germany", code: "DEHAM" },
  { id: "VALENCIA (ES)", country: "Spain", code: "ESVLC" },
  { id: "MARSEILLE (FR)", country: "France", code: "FRMRS" },
  { id: "SHANGHAI (CN)", country: "China", code: "CNSHA", tier: true },
  { id: "NINGBO (CN)", country: "China", code: "CNNGB" },
  { id: "DUBAI (AE)", country: "UAE", code: "AEDXB", tier: true },
  { id: "SINGAPORE (SG)", country: "Singapore", code: "SGSIN", tier: true },
  { id: "NEW YORK (US)", country: "USA", code: "USNYC", tier: true },
  { id: "LOS ANGELES (US)", country: "USA", code: "USLAX" },
  { id: "SANTOS (BR)", country: "Brazil", code: "BRSSZ" },
];

// Helper Components
const InputField = ({ label, icon: Icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string, icon?: any }) => (
  <div className="flex-1">
    {label && <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
    <div className="relative">
      <input
        {...props}
        className={`
          block w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 shadow-sm 
          placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
          transition-all py-2 ${Icon ? 'pl-9' : 'px-3'} pr-3 hover:border-slate-400 outline-none
          ${props.className || ''}
        `}
      />
      {Icon && <Icon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />}
    </div>
  </div>
);

const SelectField = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) => (
  <div className="flex-1">
    {label && <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
    <div className="relative">
      <select
        {...props}
        className={`
          block w-full appearance-none rounded-lg border-slate-300 bg-white text-sm text-slate-900 shadow-sm 
          focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
          transition-all py-2 pl-3 pr-10 hover:border-slate-400 outline-none
          ${props.className || ''}
        `}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
        <ArrowRight className="rotate-90 h-4 w-4" />
      </div>
    </div>
  </div>
);

export const DossierOperationsTab = () => {
  const { 
     dossier, updateDossier,
     addContainer, removeContainer 
  } = useDossierStore();

  const [isAddingParty, setIsAddingParty] = useState(false);
  const [newParty, setNewParty] = useState<Partial<ShipmentParty>>({ role: 'Notify' });

  const [isAddingCargo, setIsAddingCargo] = useState(false);
  const [newCargo, setNewCargo] = useState<Partial<CargoItem>>({ packageType: 'Cartons' });

  const [isAddingContainer, setIsAddingContainer] = useState(false);
  const [newContainer, setNewContainer] = useState<Partial<DossierContainer>>({ type: '40HC' });

  // Dropdown states
  const [polOpen, setPolOpen] = useState(false);
  const [podOpen, setPodOpen] = useState(false);

  // --- Logic Helpers ---
  const isEXW = dossier.incoterm === 'EXW';
  const isDeliveryInco = ['DAP', 'DPU', 'DDP'].includes(dossier.incoterm);

  // --- Chargeable Weight Logic (Morocco Freight Standard) ---
  // AIR: 1 CBM = 167 KG
  // SEA: 1 CBM = 1000 KG
  // ROAD: 1 CBM = 333 KG (Often)
  const chargeableWeight = useMemo(() => {
     if(!dossier.cargoItems) return 0;
     
     let totalVol = 0;
     let totalGross = 0;
     
     dossier.cargoItems.forEach(item => {
         totalVol += item.volume;
         totalGross += item.weight;
     });

     let ratio = 1000; // Sea Default
     if(dossier.mode?.includes('AIR')) ratio = 166.67;
     if(dossier.mode?.includes('ROAD')) ratio = 333.33;

     const volWeight = totalVol * ratio;
     return Math.max(totalGross, volWeight);
  }, [dossier.cargoItems, dossier.mode]);


  // --- Handlers ---
  const handleAddParty = () => {
     if (!newParty.name) return;
     const partyToAdd: ShipmentParty = {
        id: Math.random().toString(36).substring(7),
        name: newParty.name,
        role: newParty.role as any,
        email: newParty.email,
        contact: newParty.contact
     };
     
     if (partyToAdd.role === 'Shipper') {
         updateDossier('shipper', partyToAdd);
     } else if (partyToAdd.role === 'Consignee') {
         updateDossier('consignee', partyToAdd);
     } else if (partyToAdd.role === 'Notify') {
         updateDossier('notify', partyToAdd);
     } else {
         updateDossier('parties', [...(dossier.parties || []), partyToAdd]);
     }
     
     setIsAddingParty(false);
     setNewParty({ role: 'Notify' });
  };

  const removeParty = (id: string) => {
     updateDossier('parties', (dossier.parties || []).filter(p => p.id !== id));
  };

  const handleAddCargo = () => {
    if (!newCargo.description) return;
    const item: CargoItem = {
      id: `ci-${Date.now()}`,
      description: newCargo.description,
      packageCount: Number(newCargo.packageCount) || 0,
      packageType: newCargo.packageType || 'Pkgs',
      weight: Number(newCargo.weight) || 0,
      volume: Number(newCargo.volume) || 0,
      dimensions: newCargo.dimensions
    };
    updateDossier('cargoItems', [...(dossier.cargoItems || []), item]);
    setIsAddingCargo(false);
    setNewCargo({ packageType: 'Cartons' });
  };

  const removeCargo = (id: string) => {
    updateDossier('cargoItems', (dossier.cargoItems || []).filter(c => c.id !== id));
  };

  const handleAddContainer = () => {
     if (!newContainer.number) return;
     const containerToAdd: DossierContainer = {
        id: Math.random().toString(36).substring(7),
        number: newContainer.number.toUpperCase(),
        type: newContainer.type as any || '40HC',
        seal: newContainer.seal ? newContainer.seal.toUpperCase() : '',
        packages: Number(newContainer.packages) || 0,
        weight: Number(newContainer.weight) || 0,
        packageType: 'CARTONS',
        volume: 0,
        status: 'GATE_IN'
     };
     addContainer(containerToAdd);
     setIsAddingContainer(false);
     setNewContainer({ type: '40HC' });
  };

  const hasCargoItems = (dossier.cargoItems?.length || 0) > 0;
  const totalWeight = hasCargoItems 
    ? dossier.cargoItems?.reduce((sum, item) => sum + item.weight, 0) || 0
    : dossier.containers?.reduce((acc, c) => acc + (c.weight || 0), 0) || 0;
  const totalPkgs = hasCargoItems
    ? dossier.cargoItems?.reduce((sum, item) => sum + item.packageCount, 0) || 0
    : dossier.containers?.reduce((acc, c) => acc + (c.packages || 0), 0) || 0;
  const totalVolume = hasCargoItems
    ? dossier.cargoItems?.reduce((sum, item) => sum + item.volume, 0) || 0
    : dossier.containers?.reduce((acc, c) => acc + (c.volume || 0), 0) || 0;

  return (
    <div className="max-w-[1600px] mx-auto p-6 pb-24 space-y-6">
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6 h-full">
          
          {/* CARD 1: Route & Schedule */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col relative z-20 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                 <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><MapPin className="h-4 w-4" /></div>
                 <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Logistics Route</h3>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                    {dossier.incoterm || 'INCOTERM?'}
                 </span>
              </div>
            </div>
            
            <div className="p-5 relative flex-1">
              <div className="absolute left-[24px] top-16 bottom-10 w-0.5 bg-slate-200 hidden md:block z-0"></div>

              <div className="space-y-6 relative z-10">
                {/* POL SECTION */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                   <div className="hidden md:flex flex-col items-center mt-1 min-w-[50px]">
                      <div className="h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow ring-1 ring-blue-100"></div>
                   </div>
                   <div className="flex-1 w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                      <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Origin (POL)</h4>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {isEXW && (
                            <InputField 
                                label="Pickup Address (EXW)" 
                                icon={Home}
                                placeholder="Factory address details..."
                                value={dossier.incotermPlace || ''}
                                onChange={(e) => updateDossier('incotermPlace', e.target.value)}
                                className="border-amber-200 bg-amber-50/10"
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Port of Loading</label>
                              <Popover open={polOpen} onOpenChange={setPolOpen}>
                                 <PopoverTrigger asChild>
                                   <Button variant="outline" className="w-full justify-between h-[38px] text-sm bg-white border-slate-300 hover:border-slate-400 text-slate-900 shadow-sm">
                                      <div className="flex items-center gap-2 truncate">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        {dossier.pol ? dossier.pol : <span className="text-slate-400 font-normal">Select POL...</span>}
                                      </div>
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                   </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-[300px] p-0" align="start">
                                   <Command>
                                     <CommandInput placeholder="Search ports..." />
                                     <CommandList>
                                        <CommandEmpty>No port found.</CommandEmpty>
                                        <CommandGroup>
                                           {PORT_DB.map((port) => (
                                              <CommandItem key={port.id} value={port.id} 
                                                 onSelect={(v) => { updateDossier('pol', v); setPolOpen(false); }}
                                              >
                                                 <Check className={cn("mr-2 h-4 w-4", dossier.pol === port.id ? "opacity-100" : "opacity-0")}/>
                                                 {port.id} <span className="ml-1 text-slate-400 text-xs">({port.code})</span>
                                              </CommandItem>
                                           ))}
                                        </CommandGroup>
                                     </CommandList>
                                   </Command>
                                 </PopoverContent>
                              </Popover>
                           </div>

                           <InputField 
                              label="ETD Date"
                              icon={Calendar}
                              type="date"
                              value={dossier.etd ? new Date(dossier.etd).toISOString().split('T')[0] : ''}
                              onChange={(e) => updateDossier('etd', new Date(e.target.value))}
                           />
                        </div>
                      </div>
                   </div>
                </div>

                {/* POD SECTION */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                   <div className="hidden md:flex flex-col items-center mt-1 min-w-[50px]">
                      <div className="h-3 w-3 rounded-full border-2 border-white bg-green-500 shadow ring-1 ring-green-100"></div>
                   </div>
                   <div className="flex-1 w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-green-200 transition-colors">
                      <h4 className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2"><ArrowRight className="h-3 w-3" /> Destination (POD)</h4>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Port of Discharge</label>
                              <Popover open={podOpen} onOpenChange={setPodOpen}>
                                 <PopoverTrigger asChild>
                                   <Button variant="outline" className="w-full justify-between h-[38px] text-sm bg-white border-slate-300 hover:border-slate-400 text-slate-900 shadow-sm">
                                      <div className="flex items-center gap-2 truncate">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        {dossier.pod ? dossier.pod : <span className="text-slate-400 font-normal">Select POD...</span>}
                                      </div>
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                   </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-[300px] p-0" align="start">
                                   <Command>
                                     <CommandInput placeholder="Search ports..." />
                                     <CommandList>
                                        <CommandEmpty>No port found.</CommandEmpty>
                                        <CommandGroup>
                                           {PORT_DB.map((port) => (
                                              <CommandItem key={port.id} value={port.id} 
                                                 onSelect={(v) => { updateDossier('pod', v); setPodOpen(false); }}
                                              >
                                                 <Check className={cn("mr-2 h-4 w-4", dossier.pod === port.id ? "opacity-100" : "opacity-0")}/>
                                                 {port.id} <span className="ml-1 text-slate-400 text-xs">({port.code})</span>
                                              </CommandItem>
                                           ))}
                                        </CommandGroup>
                                     </CommandList>
                                   </Command>
                                 </PopoverContent>
                              </Popover>
                           </div>

                           <InputField 
                              label="ETA Date"
                              icon={Calendar}
                              type="date"
                              value={dossier.eta ? new Date(dossier.eta).toISOString().split('T')[0] : ''}
                              onChange={(e) => updateDossier('eta', new Date(e.target.value))}
                           />
                        </div>
                        
                        {/* MOROCCO CUSTOMS DATA */}
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                             <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                 <FileText className="h-3 w-3" /> Customs Data (Morocco)
                             </h5>
                             <div className="grid grid-cols-2 gap-4">
                                <InputField 
                                    label="N° Gros / Manifest" 
                                    placeholder="e.g. 2024/9999"
                                    // @ts-ignore
                                    value={dossier.customsRef || ''}
                                    // @ts-ignore
                                    onChange={(e) => updateDossier('customsRef', e.target.value)}
                                    className="h-8 text-xs font-mono"
                                />
                                <InputField 
                                    label="N° Article" 
                                    placeholder="e.g. 1502"
                                    // @ts-ignore
                                    value={dossier.articleNumber || ''}
                                    // @ts-ignore
                                    onChange={(e) => updateDossier('articleNumber', e.target.value)}
                                    className="h-8 text-xs font-mono"
                                />
                             </div>
                        </div>

                        {isDeliveryInco && (
                           <div className="animate-in slide-in-from-top-1">
                               <InputField 
                                   label="Final Delivery Address" 
                                   icon={MapPin}
                                   placeholder="Warehouse/Store address..."
                                   value={dossier.incotermPlace || ''}
                                   onChange={(e) => updateDossier('incotermPlace', e.target.value)}
                                   className="border-blue-200 bg-blue-50/10"
                               />
                           </div>
                        )}
                      </div>
                   </div>
                </div>

              </div>
            </div>
          </div>

          {/* CARD 2: Parties Involved */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 relative z-10 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><User className="h-4 w-4" /></div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Parties</h3>
               </div>
               {!isAddingParty && (
                 <button onClick={() => setIsAddingParty(true)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-md transition-colors flex items-center shadow-sm">
                   <Plus className="h-3 w-3 mr-1"/> Add
                 </button>
               )}
            </div>
            <div className="p-5 flex-1">
              {isAddingParty && (
                 <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide mb-3">Add Stakeholder</h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                       <div className="md:col-span-4">
                          <SelectField label="Role" value={newParty.role} onChange={(e) => setNewParty({...newParty, role: e.target.value as any})}>
                             <option value="Shipper">Shipper</option>
                             <option value="Consignee">Consignee</option>
                             <option value="Notify">Notify</option>
                             <option value="Agent">Agent</option>
                             <option value="Carrier">Carrier</option>
                          </SelectField>
                       </div>
                       <div className="md:col-span-8"><InputField label="Company Name" placeholder="Company Name" value={newParty.name || ''} onChange={e => setNewParty({...newParty, name: e.target.value})} /></div>
                       <div className="md:col-span-12"><InputField label="Email" type="email" placeholder="contact@example.com" value={newParty.email || ''} onChange={e => setNewParty({...newParty, email: e.target.value})} /></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                       <button onClick={() => setIsAddingParty(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md">Cancel</button>
                       <button onClick={handleAddParty} className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-md hover:bg-slate-800">Save</button>
                    </div>
                 </div>
              )}
              <div className="grid grid-cols-1 gap-2">
                 {[
                    { role: 'Shipper', data: dossier.shipper },
                    { role: 'Consignee', data: dossier.consignee },
                    { role: 'Notify', data: dossier.notify },
                    ...(dossier.parties || [])
                 ].map((p: any, idx) => (
                    (p.id || p.data?.name) ? (
                        <div key={idx} className="group p-3 border border-slate-100 rounded-lg bg-white hover:border-blue-200 hover:shadow-sm transition-all flex justify-between items-center">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 h-7 w-7 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400"><User className="h-3.5 w-3.5" /></div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-px rounded">{p.role}</span>
                                </div>
                                <div className="font-bold text-slate-900 text-xs">{p.name || p.data?.name || '—'}</div>
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {p.id && !['Shipper', 'Consignee', 'Notify'].includes(p.role) && (
                                <button onClick={() => removeParty(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-all"><Trash2 className="h-3.5 w-3.5"/></button>
                            )}
                        </div>
                        </div>
                    ) : null
                 ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6 h-full">
           {/* CARD 3: Cargo (Refactored for Chargeable Weight) */}
           <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col relative z-20 overflow-hidden">
             <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Box className="h-4 w-4" /></div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Cargo & Goods</h3>
               </div>
               {!isAddingCargo && (
                 <button onClick={() => setIsAddingCargo(true)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-md transition-colors flex items-center shadow-sm">
                   <Plus className="h-3 w-3 mr-1"/> Add Item
                 </button>
               )}
            </div>
            <div className="p-5 flex-1">
               <div className="grid grid-cols-4 gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-center">
                     <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pkgs</div>
                     <div className="text-lg font-bold text-slate-800">{totalPkgs}</div>
                  </div>
                  <div className="text-center">
                     <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gross</div>
                     <div className="text-lg font-bold text-slate-800">{totalWeight.toLocaleString()} <span className="text-[10px] text-slate-400">KG</span></div>
                  </div>
                  <div className="text-center">
                     <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Volume</div>
                     <div className="text-lg font-bold text-slate-800">{totalVolume.toFixed(2)} <span className="text-[10px] text-slate-400">m³</span></div>
                  </div>
                  <div className="text-center bg-white rounded-lg border border-slate-200 shadow-sm py-1">
                     <div className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-1 flex justify-center items-center gap-1"><Scale size={10}/> Chg. Wgt</div>
                     <div className="text-lg font-bold text-blue-700">{chargeableWeight.toLocaleString()} <span className="text-[10px] text-blue-400">KG</span></div>
                  </div>
               </div>

               {isAddingCargo && (
                  <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                     <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide mb-3">New Cargo Item</h4>
                     <div className="grid grid-cols-1 gap-3 mb-3">
                        <div className="grid grid-cols-12 gap-3">
                           <div className="col-span-4"><InputField label="Qty" type="number" placeholder="0" value={newCargo.packageCount || ''} onChange={e => setNewCargo({...newCargo, packageCount: Number(e.target.value)})} /></div>
                           <div className="col-span-8"><InputField label="Type" placeholder="Cartons" value={newCargo.packageType || ''} onChange={e => setNewCargo({...newCargo, packageType: e.target.value})} /></div>
                        </div>
                        <InputField label="Description" placeholder="Goods description..." value={newCargo.description || ''} onChange={e => setNewCargo({...newCargo, description: e.target.value})} />
                         <div className="grid grid-cols-2 gap-3">
                            <InputField label="Weight (KG)" type="number" placeholder="0.00" value={newCargo.weight || ''} onChange={e => setNewCargo({...newCargo, weight: Number(e.target.value)})} />
                           <InputField label="Volume (CBM)" type="number" placeholder="0.000" value={newCargo.volume || ''} onChange={e => setNewCargo({...newCargo, volume: Number(e.target.value)})} />
                         </div>
                     </div>
                     <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <button onClick={() => setIsAddingCargo(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md">Cancel</button>
                        <button onClick={handleAddCargo} className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-md hover:bg-slate-800">Add Item</button>
                     </div>
                  </div>
               )}
               <div className="space-y-2">
                  {dossier.cargoItems && dossier.cargoItems.map(item => (
                    <div key={item.id} className="group p-3 border border-slate-100 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all bg-white relative">
                       <div className="flex justify-between items-start">
                          <div className="flex-1">
                             <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-px rounded border border-slate-200">{item.packageCount} {item.packageType}</span>
                                <span className="text-slate-300">|</span>
                                <span className="truncate max-w-[200px]">{item.description}</span>
                             </div>
                             <div className="text-[10px] text-slate-500 font-medium flex gap-3">
                                <span><b className="text-slate-700">{item.weight.toLocaleString()}</b> KG</span>
                                <span className="text-slate-300">•</span>
                                <span><b className="text-slate-700">{item.volume.toFixed(2)}</b> m³</span>
                             </div>
                          </div>
                          <button onClick={() => removeCargo(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-50"><Trash2 size={14} /></button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
           </div>

           {/* CARD 4: Containers */}
           <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 relative z-10 overflow-hidden">
               <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><Truck className="h-4 w-4" /></div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Containers</h3>
                  </div>
                  {!isAddingContainer && (
                    <button onClick={() => setIsAddingContainer(true)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-md transition-colors flex items-center shadow-sm">
                      <Plus className="h-3 w-3 mr-1"/> Add Cntr
                    </button>
                  )}
               </div>
               <div className="p-5 flex-1">
                 {isAddingContainer && (
                    <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                       <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide mb-3">New Container</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <InputField label="Container No." placeholder="CMAU..." value={newContainer.number || ''} onChange={e => setNewContainer({...newContainer, number: e.target.value.toUpperCase()})} />
                          <SelectField label="Type" value={newContainer.type} onChange={e => setNewContainer({...newContainer, type: e.target.value as any})}>
                             <option value="20DV">20' DV</option>
                             <option value="40HC">40' HC</option>
                             <option value="40RH">40' RH</option>
                             <option value="LCL">LCL</option>
                          </SelectField>
                          <InputField label="Seal No." placeholder="Seal..." value={newContainer.seal || ''} onChange={e => setNewContainer({...newContainer, seal: e.target.value.toUpperCase()})} />
                          <div className="grid grid-cols-2 gap-3">
                             <InputField label="Pkgs" type="number" placeholder="0" value={newContainer.packages || ''} onChange={e => setNewContainer({...newContainer, packages: +e.target.value})} />
                             <InputField label="VGM" type="number" placeholder="0" value={newContainer.weight || ''} onChange={e => setNewContainer({...newContainer, weight: +e.target.value})} />
                          </div>
                       </div>
                       <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                          <button onClick={() => setIsAddingContainer(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md">Cancel</button>
                          <button onClick={handleAddContainer} className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-md hover:bg-slate-800">Add</button>
                       </div>
                    </div>
                 )}
                 <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
                   <table className="min-w-full divide-y divide-slate-100">
                     <thead className="bg-slate-50">
                       <tr>
                         <th className="px-3 py-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit / Seal</th>
                         <th className="px-3 py-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-wider">Specs</th>
                         <th className="relative px-3 py-2"><span className="sr-only">Actions</span></th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-slate-100">
                       {dossier.containers.map(container => (
                         <tr key={container.id} className="hover:bg-blue-50/30 transition-colors group">
                           <td className="px-3 py-2">
                             <div className="text-xs font-bold text-slate-900 font-mono tracking-wide">{container.number}</div>
                             <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5"><Shield size={10} className="text-green-500"/> {container.seal || '-'}</div>
                           </td>
                           <td className="px-3 py-2">
                              <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-bold bg-blue-50 text-blue-700 mb-0.5 border border-blue-100">{container.type}</span>
                              <div className="text-[10px] text-slate-500 font-medium">{container.packages} p • {container.weight?.toLocaleString()} k</div>
                           </td>
                           <td className="px-3 py-2 text-right">
                             <button onClick={() => removeContainer(container.id)} className="p-1.5 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-50"><Trash2 size={14}/></button>
                           </td>
                         </tr>
                       ))}
                       {dossier.containers.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-400 italic">No units.</td></tr>}
                     </tbody>
                   </table>
                 </div>
               </div>
           </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-200">
        <span className="text-xs text-slate-500 flex items-center bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"><Shield className="h-3 w-3 text-green-500 mr-2" /> Changes autosaved locally</span>
      </div>
    </div>
  );
};