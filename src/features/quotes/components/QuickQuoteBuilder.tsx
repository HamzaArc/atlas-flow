import { useEffect, useState } from "react";
import { 
  User, MapPin, Package, Container, 
  Plane, Ship, Truck, ArrowRight, 
  Wand2, Calendar, Scale,
  Box, CheckCircle2, MoreHorizontal,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { SmartPortSelector } from "./RouteSelector";
import { UserDialog } from "@/features/users/components/UserDialog"; // Reuse if needed or create simplified client select
import { useQuoteStore } from "@/store/useQuoteStore";
import { useClientStore } from "@/store/useClientStore"; 
import { cn } from "@/lib/utils";
import { TransportMode, Incoterm } from "@/types/index";

// Helper for Mode Buttons
const ModeButton = ({ 
  mode, current, onClick 
}: { 
  mode: TransportMode, current: TransportMode, onClick: () => void 
}) => {
  const icons = {
    'SEA_FCL': <Container className="h-5 w-5" />,
    'SEA_LCL': <Box className="h-5 w-5" />,
    'AIR': <Plane className="h-5 w-5" />,
    'ROAD': <Truck className="h-5 w-5" />
  };
  const labels = {
    'SEA_FCL': 'Sea FCL',
    'SEA_LCL': 'Sea LCL',
    'AIR': 'Air Freight',
    'ROAD': 'Road Freight'
  };

  const isActive = mode === current;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "cursor-pointer flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
        isActive 
          ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-100" 
          : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <div className={cn("transition-colors", isActive ? "text-blue-600" : "text-slate-400")}>
        {icons[mode]}
      </div>
      <span className={cn("text-[10px] font-bold uppercase tracking-wide", isActive ? "text-blue-700" : "text-slate-500")}>
        {labels[mode]}
      </span>
    </div>
  );
};

export function QuickQuoteBuilder() {
  const { 
    // Identity
    clientName, setClientSnapshot,
    // Route
    pol, pod, mode, incoterm, setMode, setIncoterm, setRouteLocations,
    validityDate, setIdentity,
    // Equipment / Cargo
    equipmentList, updateEquipment, setEquipment,
    totalWeight, totalVolume, chargeableWeight, totalPackages, updateCargo,
    // Pricing
    items, initializeSmartLines,
    totalSellTarget, totalTTCTarget, quoteCurrency
  } = useQuoteStore();

  const { clients, fetchClients } = useClientStore();
  const [clientSearch, setClientSearch] = useState("");

  useEffect(() => {
    if (clients.length === 0) fetchClients();
  }, []);

  // -- HANDLERS --
  
  // Simplified Cargo Handler (Single line update vs Row Logic)
  const handleQuickCargoUpdate = (field: 'weight' | 'volume' | 'packages', val: number) => {
    // We create a "Dummy" single row to represent the total in Quick Mode
    // This preserves compatibility with the complex CargoEngine
    const safeVal = val || 0;
    const currentWeight = field === 'weight' ? safeVal : totalWeight;
    const currentVol = field === 'volume' ? safeVal : totalVolume;
    const currentPkg = field === 'packages' ? safeVal : totalPackages;

    // Reverse calculate dimensions for a single row that matches these totals
    // (Approximation for storage)
    updateCargo([{
        id: 'quick-1',
        qty: currentPkg || 1,
        pkgType: 'PALLETS',
        weight: currentWeight / (currentPkg || 1),
        length: 100, // Dummy
        width: 100, // Dummy
        height: (currentVol * 1000000) / (100 * 100 * (currentPkg || 1)), // Calc height to match volume
        isStackable: true
    }]);
  };

  const isFCL = mode === 'SEA_FCL' || mode === 'ROAD';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION 1: CLIENT IDENTITY */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <User className="h-4 w-4" /> Client Details
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Select Client</Label>
                <Select 
                    value={clientName} 
                    onValueChange={(val) => {
                        const c = clients.find(cl => cl.entityName === val);
                        if(c) setClientSnapshot({ 
                            id: c.id, 
                            name: c.entityName, 
                            terms: c.financials.paymentTerms,
                            taxId: c.financials.taxId,
                            ice: c.financials.ice
                        });
                    }}
                >
                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-500/20">
                        <SelectValue placeholder="Search client database..." />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map(c => (
                            <SelectItem key={c.id} value={c.entityName}>{c.entityName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Quote Validity</Label>
                <div className="relative">
                    <Input 
                        type="date" 
                        className="h-11 pl-10 bg-slate-50 border-slate-200"
                        value={validityDate}
                        onChange={(e) => setIdentity('validityDate', e.target.value)}
                    />
                    <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
            </div>
        </div>
      </section>

      {/* SECTION 2: ROUTE & MODE */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Route & Mode
        </h2>

        <div className="space-y-6">
            {/* Mode Selection Grid */}
            <div className="grid grid-cols-4 gap-4">
                {(['SEA_FCL', 'SEA_LCL', 'AIR', 'ROAD'] as TransportMode[]).map(m => (
                    <ModeButton key={m} mode={m} current={mode} onClick={() => setMode(m)} />
                ))}
            </div>

            {/* Smart Locations */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                 <div className="md:col-span-5">
                    <SmartPortSelector 
                        label="Origin (POL)" 
                        value={pol} 
                        onChange={(v) => setRouteLocations('pol', v)}
                        icon={MapPin}
                    />
                 </div>
                 <div className="hidden md:flex md:col-span-2 items-center justify-center pb-2">
                    <ArrowRight className="h-6 w-6 text-slate-300" />
                 </div>
                 <div className="md:col-span-5">
                    <SmartPortSelector 
                        label="Destination (POD)" 
                        value={pod} 
                        onChange={(v) => setRouteLocations('pod', v)}
                        icon={MapPin}
                    />
                 </div>
            </div>

            {/* Incoterm Quick Select */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['EXW', 'FOB', 'CFR', 'DAP', 'DDP'].map((term) => (
                    <button
                        key={term}
                        onClick={() => setIncoterm(term as Incoterm)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold border transition-all",
                            incoterm === term 
                                ? "bg-slate-800 text-white border-slate-800 shadow-md" 
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                        )}
                    >
                        {term}
                    </button>
                ))}
            </div>
        </div>
      </section>

      {/* SECTION 3: CARGO SNAPSHOT */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Package className="h-4 w-4" /> Cargo Snapshot
        </h2>

        {isFCL ? (
            <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Label className="text-xs font-semibold text-slate-500 mb-3 block">Container List</Label>
                    <div className="space-y-3">
                        {equipmentList.map(eq => (
                            <div key={eq.id} className="flex items-center gap-3">
                                <Input 
                                    type="number" 
                                    className="w-20 text-center font-bold" 
                                    value={eq.count}
                                    onChange={(e) => updateEquipment(eq.id, eq.type, parseInt(e.target.value) || 1)}
                                />
                                <Select value={eq.type} onValueChange={(v) => updateEquipment(eq.id, v, eq.count)}>
                                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20DV">20' Dry Standard</SelectItem>
                                        <SelectItem value="40HC">40' High Cube</SelectItem>
                                        <SelectItem value="40RF">40' Reefer</SelectItem>
                                        <SelectItem value="FTL Mega">FTL Mega Trailer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Total Packages</Label>
                    <div className="relative">
                        <Input 
                            type="number" className="h-11 pl-9 font-mono" placeholder="0" 
                            value={totalPackages || ''}
                            onChange={(e) => handleQuickCargoUpdate('packages', parseFloat(e.target.value))}
                        />
                        <Box className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Gross Weight (kg)</Label>
                    <div className="relative">
                        <Input 
                            type="number" className="h-11 pl-9 font-mono" placeholder="0.00" 
                            value={totalWeight || ''}
                            onChange={(e) => handleQuickCargoUpdate('weight', parseFloat(e.target.value))}
                        />
                        <Scale className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Volume (m³)</Label>
                    <div className="relative">
                        <Input 
                            type="number" className="h-11 pl-9 font-mono" placeholder="0.000" 
                            value={totalVolume || ''}
                            onChange={(e) => handleQuickCargoUpdate('volume', parseFloat(e.target.value))}
                        />
                        <Container className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    </div>
                </div>
            </div>
        )}
      </section>

      {/* SECTION 4: QUICK PRICING */}
      <section className="bg-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden text-white">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-purple-400" /> Quick Pricing
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                    Auto-generated based on {mode} / {incoterm} logic.
                </p>
            </div>
            <Button 
                onClick={() => initializeSmartLines()}
                variant="outline" 
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white text-xs border-dashed"
            >
                Re-Calculate Smart Lines
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Simple Total Display */}
            <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <span className="text-sm font-medium text-slate-400">Net Sell Price</span>
                    <div className="text-3xl font-mono font-bold tracking-tight">
                        {totalSellTarget.toLocaleString()} <span className="text-sm text-purple-400">{quoteCurrency}</span>
                    </div>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-sm font-medium text-slate-400">Total Payable (TTC)</span>
                    <div className="text-4xl font-mono font-black tracking-tighter text-emerald-400">
                        {totalTTCTarget.toLocaleString()} <span className="text-lg">{quoteCurrency}</span>
                    </div>
                </div>
            </div>

            {/* Mini Line Item Summary */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Breakdown Preview</p>
                {items.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                        <span className="text-slate-300 truncate max-w-[180px]">{item.description}</span>
                        <span className="font-mono text-slate-400">
                            {(item.buyPrice * (1 + (item.markupValue/100))).toFixed(0)}
                        </span>
                    </div>
                ))}
                {items.length > 3 && (
                    <div className="text-[10px] text-slate-500 text-center pt-2 italic">
                        + {items.length - 3} more lines...
                    </div>
                )}
            </div>
        </div>
      </section>
      
      <div className="h-12" /> {/* Spacer */}
    </div>
  );
}