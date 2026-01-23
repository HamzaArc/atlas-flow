import { useState } from 'react';
import { 
  Anchor, Plane, Truck, Plus, 
  ChevronRight, Box, Users 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDossierStore } from "@/store/useDossierStore";
import { ShipmentMode, TransportMode, Incoterm } from "@/types/index";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDossierDialog = ({ isOpen, onClose }: Props) => {
  const { createDossier, updateDossier } = useDossierStore();
  const [step, setStep] = useState(1);
  
  // Local form state before committing to store
  const [formData, setFormData] = useState({
    ref: `REF-${Math.floor(Math.random() * 10000)}`,
    clientName: '',
    mode: 'SEA_FCL' as TransportMode,
    incoterm: 'FOB' as Incoterm,
    pol: '',
    pod: ''
  });

  const handleModeSelect = (mode: TransportMode) => {
    setFormData(prev => ({ ...prev, mode }));
  };

  const handleSubmit = () => {
    // 1. Initialize empty dossier in store
    createDossier();
    
    // 2. Hydrate with form data
    updateDossier('ref', formData.ref);
    updateDossier('clientName', formData.clientName);
    updateDossier('mode', formData.mode);
    updateDossier('incoterm', formData.incoterm);
    updateDossier('pol', formData.pol);
    updateDossier('pod', formData.pod);
    
    // 3. Reset & Close
    setStep(1);
    onClose();
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
          <DialogTitle className="text-xl font-bold text-slate-900">New Booking</DialogTitle>
          <p className="text-sm text-slate-500">Initialize a new shipment file.</p>
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
              <div className="col-span-2">
                 <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Name</Label>
                 <Input 
                   className="mt-1.5" 
                   placeholder="e.g. Atlas Textiles SARL"
                   value={formData.clientName}
                   onChange={e => setFormData({...formData, clientName: e.target.value})}
                 />
              </div>

              <div>
                 <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Origin (POL)</Label>
                 <div className="relative mt-1.5">
                    <Input 
                      placeholder="City or Port..."
                      value={formData.pol}
                      onChange={e => setFormData({...formData, pol: e.target.value})} 
                    />
                 </div>
              </div>

              <div>
                 <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination (POD)</Label>
                 <div className="relative mt-1.5">
                    <Input 
                      placeholder="City or Port..."
                      value={formData.pod}
                      onChange={e => setFormData({...formData, pod: e.target.value})} 
                    />
                 </div>
              </div>
           </div>

        </div>

        {/* Footer */}
        <DialogFooter className="px-8 py-5 border-t border-slate-100 bg-slate-50/50">
          <Button variant="ghost" onClick={onClose} className="text-slate-500 hover:text-slate-800">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8"
            disabled={!formData.clientName}
          >
            Create Booking
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};