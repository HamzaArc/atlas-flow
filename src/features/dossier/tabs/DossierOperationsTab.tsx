// src/features/dossier/tabs/DossierOperationsTab.tsx
import { useState, useMemo } from 'react';
import { 
   MapPin, Box, Plus, Trash2, User, 
   ArrowRight, Shield, Pencil, X,
   Truck, Check, ChevronsUpDown, Home, Calendar,
   Scale, Plane, Anchor, RefreshCw
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

  // --- EDIT STATE TRACKING ---
  const [editingPartyRole, setEditingPartyRole] = useState<string | null>(null);
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);

  // --- FORM STATES ---
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
  const isAir = dossier.mode === 'AIR';
  const isRoad = dossier.mode === 'ROAD';
  const isSea = dossier.mode?.startsWith('SEA');
  const isLCL = dossier.mode === 'SEA_LCL';

  // --- Dynamic Labels ---
  const LABELS = {
    bookingRef: isAir ? 'Airline Ref (LTA)' : isRoad ? 'Transport Order' : 'Booking Ref',
    pol: isAir ? 'Airport of Departure' : isRoad ? 'Pickup Place' : 'Port of Loading',
    pod: isAir ? 'Airport of Arrival' : isRoad ? 'Delivery Place' : 'Port of Discharge',
    etd: isRoad ? 'Pickup Date' : 'ETD',
    eta: isRoad ? 'Delivery Date' : 'ETA',
    masterDoc: isAir ? 'MAWB' : isRoad ? 'CMR' : 'Master B/L',
    houseDoc: isAir ? 'HAWB' : 'House B/L',
    vehicleId: isAir ? 'Flight Number' : isRoad ? 'Truck Plate' : 'Vessel Name',
    tripId: isAir ? 'Flight Date' : isRoad ? 'Trailer Plate' : 'Voyage No',
    freeTime: isAir ? 'Storage Free Time' : isRoad ? 'Stationnement' : 'Demurrage/Detention'
  };

  // --- Chargeable Weight Logic ---
  const calculatedChargeableWeight = useMemo(() => {
     if(!dossier.cargoItems) return 0;
     let totalVol = 0;
     let totalGross = 0;
     dossier.cargoItems.forEach(item => {
         totalVol += item.volume;
         totalGross += item.weight;
     });
     const airRatio = 166.67;
     const volWeight = totalVol * airRatio;
     return Math.max(totalGross, volWeight);
  }, [dossier.cargoItems]);

  // --- PARTY HANDLERS ---
  const handleSaveParty = () => {
     if (!newParty.name) return;

     const partyToSave: ShipmentParty = {
        id: editingPartyId || Math.random().toString(36).substring(7),
        name: newParty.name,
        role: newParty.role as any,
        email: newParty.email,
        contact: newParty.contact,
        address: newParty.address
     };
     
     if (partyToSave.role === 'Shipper') {
         updateDossier('shipper', partyToSave);
     } else if (partyToSave.role === 'Consignee') {
         updateDossier('consignee', partyToSave);
     } else if (partyToSave.role === 'Notify') {
         updateDossier('notify', partyToSave);
     } else {
         // Managing the additional parties list
         let currentParties = [...(dossier.parties || [])];
         if (editingPartyId) {
             const idx = currentParties.findIndex(p => p.id === editingPartyId);
             if (idx >= 0) currentParties[idx] = partyToSave;
         } else {
             currentParties.push(partyToSave);
         }
         updateDossier('parties', currentParties);
     }
     
     resetPartyForm();
  };

  const startEditParty = (party: ShipmentParty, _isMain: any) => {
      setNewParty({ ...party });
      setEditingPartyRole(party.role);
      setEditingPartyId(party.id || null);
      setIsAddingParty(true);
  };

  const removeParty = (id: string) => {
     updateDossier('parties', (dossier.parties || []).filter(p => p.id !== id));
  };

  const clearMainParty = (role: 'Shipper' | 'Consignee' | 'Notify') => {
      // "Delete" for main roles simply resets them
      const emptyParty: ShipmentParty = { name: '', role: role };
      if (role === 'Shipper') updateDossier('shipper', emptyParty);
      if (role === 'Consignee') updateDossier('consignee', emptyParty);
      if (role === 'Notify') updateDossier('notify', emptyParty);
  };

  const resetPartyForm = () => {
      setIsAddingParty(false);
      setNewParty({ role: 'Notify' });
      setEditingPartyId(null);
      setEditingPartyRole(null);
  }

  // --- CARGO HANDLERS ---
  const handleSaveCargo = () => {
    if (!newCargo.description) return;

    const item: CargoItem = {
      id: editingCargoId || `ci-${Date.now()}`,
      description: newCargo.description,
      packageCount: Number(newCargo.packageCount) || 0,
      packageType: newCargo.packageType || 'Pkgs',
      weight: Number(newCargo.weight) || 0,
      volume: Number(newCargo.volume) || 0,
      dimensions: newCargo.dimensions
    };

    let newItems = [...(dossier.cargoItems || [])];
    if (editingCargoId) {
        newItems = newItems.map(i => i.id === editingCargoId ? item : i);
    } else {
        newItems.push(item);
    }

    updateDossier('cargoItems', newItems);
    resetCargoForm();
  };

  const startEditCargo = (item: CargoItem) => {
      setNewCargo({ ...item });
      setEditingCargoId(item.id);
      setIsAddingCargo(true);
  };

  const removeCargo = (id: string) => {
    updateDossier('cargoItems', (dossier.cargoItems || []).filter(c => c.id !== id));
  };

  const resetCargoForm = () => {
      setIsAddingCargo(false);
      setNewCargo({ packageType: 'Cartons' });
      setEditingCargoId(null);
  };

  // --- CONTAINER HANDLERS ---
  const handleSaveContainer = () => {
     if (!newContainer.number) return;
     
     // Note: updateContainer in store is for single field updates, 
     // so we construct logic here for bulk update or add
     if (editingContainerId) {
         // We need to manually update all fields for the container in the array
         const updatedList = dossier.containers.map(c => 
             c.id === editingContainerId ? { ...c, ...newContainer } as DossierContainer : c
         );
         // There isn't a direct "setContainers" exposed, so we iterate or use a new method? 
         // Actually updateDossier('containers', ...) works perfectly if the type allows it.
         // Let's use updateDossier directly for the array to be safe.
         // Wait, updateDossier is strictly typed. Let's iterate `updateContainer` calls or 
         // realize that `updateDossier` can take 'containers' as key.
         // The store type definition: `updateDossier: <K extends keyof Dossier>(field: K, value: Dossier[K]) => void;`
         // So yes, we can pass the whole array.
         updateDossier('containers', updatedList);

     } else {
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
     }
     resetContainerForm();
  };

  const startEditContainer = (c: DossierContainer) => {
      setNewContainer({ ...c });
      setEditingContainerId(c.id);
      setIsAddingContainer(true);
  };

  const resetContainerForm = () => {
      setIsAddingContainer(false);
      setNewContainer({ type: '40HC' });
      setEditingContainerId(null);
  };

  // --- TOTALS ---
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
                 <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    {isAir ? <Plane className="h-4 w-4" /> : isRoad ? <Truck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                 </div>
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
                      <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2"><ArrowRight className="h-3 w-3" /> {LABELS.pol}</h4>
                      
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
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{LABELS.pol}</label>
                              <Popover open={polOpen} onOpenChange={setPolOpen}>
                                 <PopoverTrigger asChild>
                                   <Button variant="outline" className="w-full justify-between h-[38px] text-sm bg-white border-slate-300 hover:border-slate-400 text-slate-900 shadow-sm">
                                      <div className="flex items-center gap-2 truncate">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        {dossier.pol ? dossier.pol : <span className="text-slate-400 font-normal">Select Location...</span>}
                                      </div>
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                   </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-[300px] p-0" align="start">
                                   <Command>
                                     <CommandInput placeholder="Search..." />
                                     <CommandList>
                                        <CommandEmpty>No location found.</CommandEmpty>
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
                              label={LABELS.etd}
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
                      <h4 className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3 flex items-center gap-2"><ArrowRight className="h-3 w-3" /> {LABELS.pod}</h4>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{LABELS.pod}</label>
                              <Popover open={podOpen} onOpenChange={setPodOpen}>
                                 <PopoverTrigger asChild>
                                   <Button variant="outline" className="w-full justify-between h-[38px] text-sm bg-white border-slate-300 hover:border-slate-400 text-slate-900 shadow-sm">
                                      <div className="flex items-center gap-2 truncate">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        {dossier.pod ? dossier.pod : <span className="text-slate-400 font-normal">Select Location...</span>}
                                      </div>
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                   </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-[300px] p-0" align="start">
                                   <Command>
                                     <CommandInput placeholder="Search..." />
                                     <CommandList>
                                        <CommandEmpty>No location found.</CommandEmpty>
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
                              label={LABELS.eta}
                              icon={Calendar}
                              type="date"
                              value={dossier.eta ? new Date(dossier.eta).toISOString().split('T')[0] : ''}
                              onChange={(e) => updateDossier('eta', new Date(e.target.value))}
                           />
                        </div>
                        
                        {/* VEHICLE DETAILS (Dynamic) */}
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                             <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                 {isAir ? <Plane className="h-3 w-3" /> : isRoad ? <Truck className="h-3 w-3" /> : <Anchor className="h-3 w-3" />} 
                                 Details
                             </h5>
                             <div className="grid grid-cols-2 gap-4">
                                {isAir ? (
                                    <>
                                        <InputField 
                                            label={LABELS.vehicleId} 
                                            placeholder="AT801"
                                            value={dossier.flightNumber || ''}
                                            onChange={(e) => updateDossier('flightNumber', e.target.value)}
                                            className="h-8 text-xs font-mono"
                                        />
                                        <InputField 
                                            label={LABELS.tripId} 
                                            type="date"
                                            value={dossier.flightDate ? new Date(dossier.flightDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => updateDossier('flightDate', new Date(e.target.value))}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </>
                                ) : isRoad ? (
                                    <>
                                        <InputField 
                                            label={LABELS.vehicleId} 
                                            placeholder="12345-A-6"
                                            value={dossier.truckPlate || ''}
                                            onChange={(e) => updateDossier('truckPlate', e.target.value)}
                                            className="h-8 text-xs font-mono"
                                        />
                                        <InputField 
                                            label={LABELS.tripId} 
                                            placeholder="Trailer Plate"
                                            value={dossier.trailerPlate || ''}
                                            onChange={(e) => updateDossier('trailerPlate', e.target.value)}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <InputField 
                                            label={LABELS.vehicleId} 
                                            placeholder="Vessel Name"
                                            value={dossier.vesselName || ''}
                                            onChange={(e) => updateDossier('vesselName', e.target.value)}
                                            className="h-8 text-xs font-mono"
                                        />
                                        <InputField 
                                            label={LABELS.tripId} 
                                            placeholder="Voyage No"
                                            value={dossier.voyageNumber || ''}
                                            onChange={(e) => updateDossier('voyageNumber', e.target.value)}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </>
                                )}
                             </div>
                        </div>

                        {/* CUSTOMS & DEADLINES (Conditional) */}
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                             <div className="grid grid-cols-2 gap-4">
                                <InputField 
                                    label={LABELS.masterDoc} 
                                    placeholder={isAir ? "123-12345678" : "BL Number"}
                                    value={dossier.mblNumber || ''}
                                    onChange={(e) => updateDossier('mblNumber', e.target.value)}
                                    className="h-8 text-xs font-mono"
                                />
                                {!isRoad && (
                                    <InputField 
                                        label={LABELS.houseDoc} 
                                        placeholder="Reference"
                                        value={dossier.hblNumber || ''}
                                        onChange={(e) => updateDossier('hblNumber', e.target.value)}
                                        className="h-8 text-xs font-mono"
                                    />
                                )}
                             </div>
                             
                             {/* Deadlines - Only for SEA/AIR */}
                             {!isRoad && (
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    {isSea && (
                                        <div className="col-span-1">
                                            <label className="text-[9px] font-bold text-red-500 uppercase">VGM Cut-off</label>
                                            <input type="date" className="w-full text-[10px] border-b border-red-200 py-1 focus:outline-none" />
                                        </div>
                                    )}
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-bold text-red-500 uppercase">{isAir ? "Drop-off Deadline" : "Port Cut-off"}</label>
                                        <input type="date" className="w-full text-[10px] border-b border-red-200 py-1 focus:outline-none" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[9px] font-bold text-red-500 uppercase">Doc Cut-off</label>
                                        <input type="date" className="w-full text-[10px] border-b border-red-200 py-1 focus:outline-none" />
                                    </div>
                                </div>
                             )}
                        </div>

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
              
              {/* ROAD SPECIFIC: DRIVER DETAILS */}
              {isRoad && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                          <Truck className="h-3 w-3" /> Driver Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                          <InputField 
                              placeholder="Driver Name" 
                              value={dossier.driverName || ''}
                              onChange={(e) => updateDossier('driverName', e.target.value)}
                              className="bg-white"
                          />
                          <InputField 
                              placeholder="Phone Number" 
                              value={dossier.driverPhone || ''}
                              onChange={(e) => updateDossier('driverPhone', e.target.value)}
                              className="bg-white"
                          />
                          <InputField 
                              placeholder="Passport / CIN" 
                              value={dossier.driverPassport || ''}
                              onChange={(e) => updateDossier('driverPassport', e.target.value)}
                              className="bg-white"
                          />
                           <div className="flex items-center space-x-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="carnet" 
                                    checked={dossier.carnetTir || false}
                                    onChange={(e) => updateDossier('carnetTir', e.target.checked)}
                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                />
                                <label htmlFor="carnet" className="text-xs font-medium text-amber-900">Carnet TIR?</label>
                           </div>
                      </div>
                  </div>
              )}

              {isAddingParty && (
                 <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center justify-between">
                        {editingPartyId ? `Edit ${editingPartyRole || 'Party'}` : 'Add Stakeholder'}
                        <button onClick={resetPartyForm}><X className="h-3 w-3 text-slate-400 hover:text-slate-600"/></button>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                       <div className="md:col-span-4">
                          <SelectField 
                            label="Role" 
                            value={newParty.role} 
                            disabled={!!editingPartyRole && ['Shipper', 'Consignee', 'Notify'].includes(editingPartyRole)}
                            onChange={(e) => setNewParty({...newParty, role: e.target.value as any})}
                          >
                             <option value="Shipper">Shipper</option>
                             <option value="Consignee">Consignee</option>
                             <option value="Notify">Notify</option>
                             <option value="Agent">Agent</option>
                             <option value={isRoad ? "Haulier" : "Carrier"}>{isRoad ? "Haulier" : "Carrier"}</option>
                          </SelectField>
                       </div>
                       <div className="md:col-span-8"><InputField label="Company Name" placeholder="Company Name" value={newParty.name || ''} onChange={e => setNewParty({...newParty, name: e.target.value})} /></div>
                       <div className="md:col-span-12"><InputField label="Email" type="email" placeholder="contact@example.com" value={newParty.email || ''} onChange={e => setNewParty({...newParty, email: e.target.value})} /></div>
                       <div className="md:col-span-12"><InputField label="Address" placeholder="Full Address" value={newParty.address || ''} onChange={e => setNewParty({...newParty, address: e.target.value})} /></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                       <button onClick={resetPartyForm} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md">Cancel</button>
                       <button onClick={handleSaveParty} className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-md hover:bg-slate-800">
                           {editingPartyId ? 'Update' : 'Save'}
                       </button>
                    </div>
                 </div>
              )}
              
              <div className="grid grid-cols-1 gap-2">
                 {[
                    { role: 'Shipper', data: dossier.shipper, isMain: true },
                    { role: 'Consignee', data: dossier.consignee, isMain: true },
                    { role: 'Notify', data: dossier.notify, isMain: true },
                    ...(dossier.parties || []).map(p => ({ role: p.role, data: p, isMain: false }))
                 ].map((p: any, idx) => (
                    (p.data?.name || p.isMain) ? (
                        <div key={idx} className="group p-3 border border-slate-100 rounded-lg bg-white hover:border-blue-200 hover:shadow-sm transition-all flex justify-between items-center">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="mt-0.5 h-7 w-7 shrink-0 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400"><User className="h-3.5 w-3.5" /></div>
                                <div className="truncate">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-px rounded">{p.role}</span>
                                    </div>
                                    <div className="font-bold text-slate-900 text-xs truncate" title={p.data?.name}>{p.data?.name || <span className="text-slate-300 italic">Not Assigned</span>}</div>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => startEditParty(p.data, p.isMain)} 
                                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-all"
                                >
                                    <Pencil className="h-3.5 w-3.5"/>
                                </button>
                                {p.isMain ? (
                                    <button 
                                        onClick={() => clearMainParty(p.role)} 
                                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-all" 
                                        title="Clear Field"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5"/>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => removeParty(p.data.id)} 
                                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5"/>
                                    </button>
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
           {/* CARD 3: Cargo & Weight Widget */}
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
               
               {/* AIR SPECIFIC: WEIGHT CALC WIDGET */}
               {isAir && (
                   <div className="mb-4 grid grid-cols-3 gap-0 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                       <div className="p-4 text-center border-r border-slate-200">
                           <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Total Gross</div>
                           <div className="text-xl font-bold text-slate-900">{totalWeight.toLocaleString()} <span className="text-xs text-slate-400">KG</span></div>
                       </div>
                       <div className="p-4 text-center border-r border-slate-200">
                           <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Volumetric</div>
                           <div className="text-xl font-bold text-slate-900">{(totalVolume * 166.67).toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-xs text-slate-400">KG</span></div>
                       </div>
                       <div className="p-4 text-center bg-green-50">
                           <div className="text-[9px] font-bold text-green-700 uppercase mb-1">Chargeable</div>
                           <div className="text-2xl font-black text-green-700">{calculatedChargeableWeight.toLocaleString()} <span className="text-xs font-medium text-green-500">KG</span></div>
                       </div>
                   </div>
               )}
               
               {/* STANDARD STATS (Non-Air) */}
               {!isAir && (
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
                            <div className="text-lg font-bold text-blue-700">
                                {isRoad 
                                    ? Math.max(totalWeight, totalVolume * 333.33).toLocaleString()
                                    : Math.max(totalWeight, totalVolume * 1000).toLocaleString()
                                } <span className="text-[10px] text-blue-400">KG</span>
                            </div>
                        </div>
                    </div>
               )}

               {isAddingCargo && (
                  <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                     <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide mb-3 flex justify-between items-center">
                        {editingCargoId ? "Edit Cargo Item" : "New Cargo Item"}
                        <button onClick={resetCargoForm}><X className="h-3 w-3 text-slate-400 hover:text-slate-600"/></button>
                     </h4>
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
                        <button onClick={resetCargoForm} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md">Cancel</button>
                        <button onClick={handleSaveCargo} className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-md hover:bg-slate-800">
                            {editingCargoId ? 'Update Item' : 'Add Item'}
                        </button>
                     </div>
                  </div>
               )}
               <div className="space-y-2">
                  {dossier.cargoItems && dossier.cargoItems.map(item => (
                    <div key={item.id} className="group p-3 border border-slate-100 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all bg-white relative">
                       <div className="flex justify-between items-start">
                          <div className="flex-1 cursor-pointer" onClick={() => startEditCargo(item)}>
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
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditCargo(item)} className="p-1.5 text-slate-300 hover:text-blue-500 rounded hover:bg-blue-50">
                                  <Pencil size={14} />
                              </button>
                              <button onClick={() => removeCargo(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded hover:bg-red-50">
                                  <Trash2 size={14} />
                              </button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
           </div>

           {/* CARD 4: Containers (Hidden for Air/Road unless needed) */}
           {(!isAir && !isRoad) && (
               <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col flex-1 relative z-10 overflow-hidden">
                   <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><Truck className="h-4 w-4" /></div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{isLCL ? "LCL Handling" : "Containers"}</h3>
                      </div>
                      {!isLCL && !isAddingContainer && (
                        <button onClick={() => setIsAddingContainer(true)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-md transition-colors flex items-center shadow-sm">
                          <Plus className="h-3 w-3 mr-1"/> Add Cntr
                        </button>
                      )}
                   </div>
                   <div className="p-5 flex-1">
                     {/* LCL SPECIFIC DISPLAY */}
                     {isLCL ? (
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                            <div className="text-xs text-slate-500 mb-2">CFS Closing Date</div>
                            <input type="date" className="bg-transparent font-bold text-slate-900 border-b border-slate-300 focus:outline-none" />
                        </div>
                     ) : (
                         <>
                         {isAddingContainer && (
                            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                               <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide mb-3 flex justify-between items-center">
                                  {editingContainerId ? 'Edit Container' : 'New Container'}
                                  <button onClick={resetContainerForm}><X className="h-3 w-3 text-slate-400 hover:text-slate-600"/></button>
                               </h4>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                  <InputField label="Container No." placeholder="CMAU..." value={newContainer.number || ''} onChange={e => setNewContainer({...newContainer, number: e.target.value.toUpperCase()})} />
                                  <SelectField label="Type" value={newContainer.type} onChange={e => setNewContainer({...newContainer, type: e.target.value as any})}>
                                     <option value="20DV">20' DV</option>
                                     <option value="40HC">40' HC</option>
                                     <option value="40RH">40' RH</option>
                                  </SelectField>
                                  <InputField label="Seal No." placeholder="Seal..." value={newContainer.seal || ''} onChange={e => setNewContainer({...newContainer, seal: e.target.value.toUpperCase()})} />
                                  <div className="grid grid-cols-2 gap-3">
                                     <InputField label="Pkgs" type="number" placeholder="0" value={newContainer.packages || ''} onChange={e => setNewContainer({...newContainer, packages: +e.target.value})} />
                                     <InputField label="VGM" type="number" placeholder="0" value={newContainer.weight || ''} onChange={e => setNewContainer({...newContainer, weight: +e.target.value})} />
                                  </div>
                               </div>
                               <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                  <button onClick={resetContainerForm} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md">Cancel</button>
                                  <button onClick={handleSaveContainer} className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-md hover:bg-slate-800">
                                      {editingContainerId ? 'Update' : 'Add'}
                                  </button>
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
                                 <tr key={container.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => startEditContainer(container)}>
                                   <td className="px-3 py-2">
                                     <div className="text-xs font-bold text-slate-900 font-mono tracking-wide">{container.number || 'PENDING'}</div>
                                     <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5"><Shield size={10} className="text-green-500"/> {container.seal || '-'}</div>
                                   </td>
                                   <td className="px-3 py-2">
                                      <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-bold bg-blue-50 text-blue-700 mb-0.5 border border-blue-100">{container.type}</span>
                                      <div className="text-[10px] text-slate-500 font-medium">{container.packages} p • {container.weight?.toLocaleString()} k</div>
                                   </td>
                                   <td className="px-3 py-2 text-right">
                                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button onClick={(e) => { e.stopPropagation(); startEditContainer(container); }} className="p-1.5 text-slate-300 hover:text-blue-600 rounded hover:bg-blue-50"><Pencil size={14}/></button>
                                         <button onClick={(e) => { e.stopPropagation(); removeContainer(container.id); }} className="p-1.5 text-slate-300 hover:text-red-600 rounded hover:bg-red-50"><Trash2 size={14}/></button>
                                     </div>
                                   </td>
                                 </tr>
                               ))}
                               {dossier.containers.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-400 italic">No units.</td></tr>}
                             </tbody>
                           </table>
                         </div>
                         </>
                     )}
                   </div>
               </div>
           )}
        </div>
      </div>
      <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-200">
        <span className="text-xs text-slate-500 flex items-center bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"><Shield className="h-3 w-3 text-green-500 mr-2" /> Changes autosaved locally</span>
      </div>
    </div>
  );
};