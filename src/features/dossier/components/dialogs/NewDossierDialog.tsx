//
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Anchor, Plane, Truck, Loader2, Check, ChevronsUpDown, MapPin} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useDossierStore } from "@/store/useDossierStore";
import { useClientStore } from "@/store/useClientStore"; // Integration with CRM
import { TransportMode, Incoterm } from "@/types/index";
import { cn } from "@/lib/utils";
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

// --- SHARED DATA (Replicated from RouteSelector for consistency) ---
export type PortData = { 
  id: string; 
  country: string;
  code: string;
  tier?: boolean;
};

export const PORT_DB: PortData[] = [
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDossierDialog = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();
  const { createDossier, updateDossier, saveDossier, isLoading } = useDossierStore();
  const { clients, fetchClients } = useClientStore();
  
  const [clientOpen, setClientOpen] = useState(false);
  const [polOpen, setPolOpen] = useState(false);
  const [podOpen, setPodOpen] = useState(false);

  // Generate a unique reference: BKG-YYYY-XXXX
  const generateRef = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000); // Ensures 4 digits
    return `BKG-${year}-${random}`;
  };

  // Local form state before committing to store
  const [formData, setFormData] = useState({
    ref: '',
    clientId: '',
    clientName: '',
    mode: 'SEA_FCL' as TransportMode,
    incoterm: 'FOB' as Incoterm,
    pol: '',
    pod: ''
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ref: generateRef(),
        clientId: '',
        clientName: '',
        mode: 'SEA_FCL',
        incoterm: 'FOB',
        pol: '',
        pod: ''
      });
      fetchClients(); // Fetch CRM data
    }
  }, [isOpen]);

  const handleModeSelect = (mode: TransportMode) => {
    setFormData(prev => ({ ...prev, mode }));
  };

  const handleSubmit = async () => {
    if (!formData.clientName) return;

    try {
      // 1. Initialize empty dossier in store
      createDossier();
      
      // 2. Hydrate the store state with form data
      updateDossier('ref', formData.ref);
      updateDossier('clientId', formData.clientId);
      updateDossier('clientName', formData.clientName);
      updateDossier('mode', formData.mode);
      updateDossier('incoterm', formData.incoterm);
      updateDossier('pol', formData.pol);
      updateDossier('pod', formData.pod);
      // Set default dates
      updateDossier('etd', new Date());
      updateDossier('eta', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // +7 days
      
      // 3. Persist to Database
      await saveDossier();
      
      // 4. Get the new ID and Navigate
      const newDossierId = useDossierStore.getState().dossier.id;
      
      if (newDossierId && !newDossierId.startsWith('new-')) {
          onClose();
          navigate(`/dossiers/${newDossierId}`);
      } else {
          console.error("Failed to retrieve valid ID after save");
      }
      
    } catch (error) {
      console.error("Failed to create booking:", error);
    }
  };

  const ModeCard = ({ mode, icon: Icon, label, active }: any) => (
    <div 
      onClick={() => handleModeSelect(mode)}
      className={`
        cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-3
        ${active 
          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-500/20' 
          : 'border-slate-100 bg-white hover:border-slate-200 text-slate-600 hover:bg-slate-50'}
      `}
    >
      <Icon className={`h-8 w-8 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
      <span className="font-bold text-sm">{label}</span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden gap-0">
        
        {/* Header */}
        <DialogHeader className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-center">
             <div>
                <DialogTitle className="text-xl font-bold text-slate-900">New Booking</DialogTitle>
                <p className="text-sm text-slate-500">Initialize a new shipment file.</p>
             </div>
             <div className="bg-slate-200 px-3 py-1 rounded text-xs font-mono font-bold text-slate-600">
                {formData.ref}
             </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
           
           {/* Mode Selection */}
           <div className="grid grid-cols-3 gap-4">
              <ModeCard 
                mode="SEA_FCL" 
                icon={Anchor} 
                label="Sea Freight" 
                active={formData.mode.includes('SEA')} 
              />
              <ModeCard 
                mode="AIR" 
                icon={Plane} 
                label="Air Freight" 
                active={formData.mode === 'AIR'} 
              />
              <ModeCard 
                mode="ROAD" 
                icon={Truck} 
                label="Road Freight" 
                active={formData.mode === 'ROAD'} 
              />
           </div>

           {/* Core Details */}
           <div className="grid grid-cols-2 gap-6">
              
              {/* CRM Client Selector */}
              <div className="col-span-2 space-y-1.5">
                 <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client (CRM)</Label>
                 <Popover open={clientOpen} onOpenChange={setClientOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientOpen}
                        className="w-full justify-between h-10 text-sm bg-white border-slate-200"
                      >
                        {formData.clientName || "Select customer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search clients..." />
                        <CommandList>
                          <CommandEmpty>No client found.</CommandEmpty>
                          <CommandGroup heading="Active Clients">
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={client.entityName}
                                onSelect={() => {
                                  setFormData({ ...formData, clientName: client.entityName, clientId: client.id });
                                  setClientOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.clientId === client.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {client.entityName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                 </Popover>
              </div>

              {/* POL Selector */}
              <div className="space-y-1.5">
                 <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Origin (POL)</Label>
                 <Popover open={polOpen} onOpenChange={setPolOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={polOpen} className="w-full justify-between h-10 text-sm bg-white border-slate-200">
                         <div className="flex items-center gap-2 truncate">
                           <MapPin className="h-4 w-4 text-slate-400" />
                           {formData.pol ? formData.pol : <span className="text-slate-400 font-normal">Select Origin...</span>}
                         </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search ports..." />
                        <CommandList>
                           <CommandEmpty>No port found.</CommandEmpty>
                           <CommandGroup>
                              {PORT_DB.map((port) => (
                                 <CommandItem key={port.id} value={port.id} 
                                    onSelect={(currentValue) => {
                                       setFormData({...formData, pol: currentValue});
                                       setPolOpen(false);
                                    }}
                                 >
                                    <Check className={cn("mr-2 h-4 w-4", formData.pol === port.id ? "opacity-100" : "opacity-0")}/>
                                    {port.id} <span className="ml-1 text-slate-400 text-xs">({port.code})</span>
                                 </CommandItem>
                              ))}
                           </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                 </Popover>
              </div>

              {/* POD Selector */}
              <div className="space-y-1.5">
                 <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination (POD)</Label>
                 <Popover open={podOpen} onOpenChange={setPodOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={podOpen} className="w-full justify-between h-10 text-sm bg-white border-slate-200">
                         <div className="flex items-center gap-2 truncate">
                           <Anchor className="h-4 w-4 text-slate-400" />
                           {formData.pod ? formData.pod : <span className="text-slate-400 font-normal">Select Dest...</span>}
                         </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search ports..." />
                        <CommandList>
                           <CommandEmpty>No port found.</CommandEmpty>
                           <CommandGroup>
                              {PORT_DB.map((port) => (
                                 <CommandItem key={port.id} value={port.id} 
                                    onSelect={(currentValue) => {
                                       setFormData({...formData, pod: currentValue});
                                       setPodOpen(false);
                                    }}
                                 >
                                    <Check className={cn("mr-2 h-4 w-4", formData.pod === port.id ? "opacity-100" : "opacity-0")}/>
                                    {port.id} <span className="ml-1 text-slate-400 text-xs">({port.code})</span>
                                 </CommandItem>
                              ))}
                           </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                 </Popover>
              </div>
           </div>

        </div>

        {/* Footer */}
        <DialogFooter className="px-8 py-5 border-t border-slate-100 bg-slate-50/50">
          <Button variant="ghost" onClick={onClose} className="text-slate-500 hover:text-slate-800" disabled={isLoading}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8"
            disabled={!formData.clientName || isLoading}
          >
            {isLoading ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
               </>
            ) : (
               'Create Booking'
            )}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};