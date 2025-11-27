import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuoteStore } from "@/store/useQuoteStore";
import { Map, Plane, Ship, Truck, Handshake } from "lucide-react";
import { TransportMode, Incoterm } from "@/types/index";

export function RouteSelector() {
  const { pol, pod, mode, incoterm, setRoute, setIncoterm } = useQuoteStore();

  const handleUpdate = (field: 'pol' | 'pod' | 'mode', value: string) => {
    const newPol = field === 'pol' ? value : pol;
    const newPod = field === 'pod' ? value : pod;
    const newMode = field === 'mode' ? (value as TransportMode) : mode;
    setRoute(newPol, newPod, newMode);
  };

  return (
    <Card className="p-4 shadow-sm border-slate-200">
      <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold">
        <Map className="h-4 w-4" />
        <span>Route & Mode</span>
      </div>

      <div className="grid gap-4">
        {/* Visual Map Placeholder */}
        <div className="h-24 bg-slate-100 rounded-md border border-dashed border-slate-300 relative overflow-hidden group">
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 group-hover:text-slate-500 transition-colors">
            <Map className="h-8 w-8 opacity-20 mr-2" />
            <span>Interactive Map Visualization</span>
          </div>
        </div>

        {/* Incoterm Selector */}
        <div className="grid gap-2">
            <Label className="text-xs text-slate-500">Incoterm</Label>
            <Select value={incoterm} onValueChange={(val) => setIncoterm(val as Incoterm)}>
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select Incoterm" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="EXW"><div className="flex items-center gap-2"><Handshake className="h-3 w-3" /> EXW - Ex Works</div></SelectItem>
                    <SelectItem value="FOB"><div className="flex items-center gap-2"><Handshake className="h-3 w-3" /> FOB - Free On Board</div></SelectItem>
                    <SelectItem value="CFR"><div className="flex items-center gap-2"><Handshake className="h-3 w-3" /> CFR - Cost and Freight</div></SelectItem>
                    <SelectItem value="CIF"><div className="flex items-center gap-2"><Handshake className="h-3 w-3" /> CIF - Cost, Ins, Freight</div></SelectItem>
                    <SelectItem value="DDP"><div className="flex items-center gap-2"><Handshake className="h-3 w-3" /> DDP - Delivered Duty Paid</div></SelectItem>
                </SelectContent>
            </Select>
        </div>

        {/* Transport Mode */}
        <div className="grid gap-2">
            <Label className="text-xs text-slate-500">Transport Mode</Label>
            <Select value={mode} onValueChange={(val) => handleUpdate('mode', val)}>
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="SEA_FCL"><div className="flex items-center gap-2"><Ship className="h-3 w-3" /> Sea Freight (FCL)</div></SelectItem>
                    <SelectItem value="SEA_LCL"><div className="flex items-center gap-2"><Ship className="h-3 w-3" /> Sea Freight (LCL)</div></SelectItem>
                    <SelectItem value="AIR"><div className="flex items-center gap-2"><Plane className="h-3 w-3" /> Air Freight</div></SelectItem>
                    <SelectItem value="ROAD"><div className="flex items-center gap-2"><Truck className="h-3 w-3" /> Road Freight</div></SelectItem>
                </SelectContent>
            </Select>
        </div>

        {/* Origin & Destination with AUTOCOMPLETE [Gap 6] */}
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1.5">
            <Label className="text-xs text-slate-500">Origin (POL)</Label>
            <Input 
                list="ports" 
                className="h-8 text-sm uppercase" 
                placeholder="Start typing..." 
                value={pol}
                onChange={(e) => handleUpdate('pol', e.target.value.toUpperCase())}
            />
          </div>
          <div className="grid gap-1.5">
             <Label className="text-xs text-slate-500">Destination (POD)</Label>
             <Input 
                list="ports"
                className="h-8 text-sm uppercase" 
                placeholder="Start typing..." 
                value={pod}
                onChange={(e) => handleUpdate('pod', e.target.value.toUpperCase())}
            />
          </div>
          {/* THE DATA SOURCE */}
          <datalist id="ports">
              <option value="CASABLANCA (MAP)" />
              <option value="TANGER MED (MAP)" />
              <option value="AGADIR (MAP)" />
              <option value="JORF LASFAR (MAP)" />
              <option value="SHANGHAI (CN)" />
              <option value="NINGBO (CN)" />
              <option value="ROTTERDAM (NL)" />
              <option value="HAMBURG (DE)" />
              <option value="DUBAI (AE)" />
              <option value="NEW YORK (US)" />
              <option value="VALENCIA (ES)" />
              <option value="ALGECIRAS (ES)" />
              <option value="MARSEILLE (FR)" />
          </datalist>
        </div>
      </div>
    </Card>
  );
}