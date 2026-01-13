import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Ship, Calendar, Anchor, Clock, Calculator, Plane, Truck, MapPin, Handshake, Timer, AlertTriangle } from "lucide-react";
import { useTariffStore } from "@/store/useTariffStore";
import { RateGrid } from "../components/RateGrid";
import { SmartPortSelector } from "@/features/quotes/components/RouteSelector"; 
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const INCOTERMS = [ 
    "EXW", "FCA", "FAS","FOB", "CPT","CFR", "CIF" , "CIP", "DAP", "DPU", "DDP"
];

interface RateWorkspaceProps {
    onBack: () => void;
}

export default function RateWorkspace({ onBack }: RateWorkspaceProps) {
    const { activeRate, updateRateField, saveRate, isLoading } = useTariffStore();

    if (!activeRate) return <div>Loading...</div>;

    // --- AUTO-REFERENCE GENERATOR ---
    useEffect(() => {
        // Condition: Only auto-generate if it's a "New" rate or explicitly generic
        // This prevents overwriting a custom reference on an existing valid rate
        const isGenericRef = !activeRate.reference || activeRate.reference === 'NEW-RATE' || activeRate.reference.startsWith('AUTO-');
        
        if (isGenericRef) {
            const carrierCode = activeRate.carrierName 
                ? activeRate.carrierName.split(' ')[0].substring(0, 4).toUpperCase() 
                : 'GEN'; // GEN = Generic if no carrier
            
            // Extract UN/LOCODE from "Shanghai (CNSHA)" -> "CNSHA"
            const extractCode = (val: string) => {
                const match = val.match(/\((.*?)\)/);
                return match ? match[1] : val.substring(0, 3).toUpperCase();
            };

            const polCode = activeRate.pol ? extractCode(activeRate.pol) : 'POL';
            const podCode = activeRate.pod ? extractCode(activeRate.pod) : 'POD';
            
            // Format: MAER-CNSHA-MAP-NOV24
            const dateCode = new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', '').toUpperCase();
            const autoRef = `${carrierCode}-${polCode}-${podCode}-${dateCode}`;

            if (activeRate.reference !== autoRef) {
                updateRateField('reference', autoRef);
            }
        }
    }, [activeRate.carrierName, activeRate.pol, activeRate.pod]);


    const calcTotal = (key: 'price20DV' | 'price40HC') => {
        const freight = activeRate.freightCharges.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        const origin = activeRate.originCharges.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        const dest = activeRate.destCharges.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        return freight + origin + dest;
    };

    // --- GUARDRAIL LOGIC ---
    const isOriginDisabled = ['FOB', 'FCA'].includes(activeRate.incoterm);
    const isFreightDisabled = false; 
    const isDestDisabled = ['CFR', 'CIF', 'CPT', 'CIP'].includes(activeRate.incoterm);

    // --- RISK MONITOR ---
    const estimatedCycle = (activeRate.transitTime || 0) + 7;
    const isDemurrageRisk = activeRate.freeTime > 0 && estimatedCycle > activeRate.freeTime;

    const ModeIcon = activeRate.mode === 'AIR' ? Plane : activeRate.mode === 'ROAD' ? Truck : Ship;

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5 text-slate-500" /></Button>
                    <div>
                        <div className="flex items-center gap-2">
                            {/* CHANGED: Editable Input instead of static H1 */}
                            <Input 
                                value={activeRate.reference} 
                                onChange={(e) => updateRateField('reference', e.target.value)}
                                className="text-xl font-bold text-slate-900 tracking-tight border-transparent hover:border-slate-200 focus:border-blue-300 px-0 h-auto w-[400px] bg-transparent shadow-none"
                                placeholder="Rate Reference"
                            />
                            
                            <div className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border", 
                                activeRate.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200")}>
                                {activeRate.status}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                            <ModeIcon className="h-3.5 w-3.5" /> 
                            {activeRate.mode.replace('_', ' ')} Tariff
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                     <Select value={activeRate.status} onValueChange={(v: any) => updateRateField('status', v)}>
                        <SelectTrigger className="h-9 w-32 border-slate-200 bg-slate-50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="EXPIRED">Expired</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    <Button onClick={saveRate} disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all">
                        <Save className="h-4 w-4 mr-2" /> {isLoading ? 'Saving...' : 'Save Rate'}
                    </Button>
                </div>
            </div>

            {/* Split Layout */}
            <div className="flex-1 overflow-hidden flex">
                
                {/* LEFT: Context & Configuration */}
                <div className="w-[420px] border-r border-slate-200 bg-white flex flex-col overflow-y-auto shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
                    <div className="p-6 space-y-8">
                        
                        {/* 1. Global Settings */}
                        <div className="space-y-4">
                            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parameters</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700">Transport Mode</Label>
                                    <Select value={activeRate.mode} onValueChange={(v: any) => updateRateField('mode', v)}>
                                        <SelectTrigger className="h-9 border-slate-200"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SEA_FCL">Sea FCL</SelectItem>
                                            <SelectItem value="SEA_LCL">Sea LCL</SelectItem>
                                            <SelectItem value="AIR">Air Freight</SelectItem>
                                            <SelectItem value="ROAD">Road Freight</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700">Rate Type</Label>
                                    <Select value={activeRate.type} onValueChange={(v: any) => updateRateField('type', v)}>
                                        <SelectTrigger className="h-9 border-slate-200"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SPOT">Spot Rate</SelectItem>
                                            <SelectItem value="CONTRACT">Long-term Contract</SelectItem>
                                            <SelectItem value="NAC">Named Account (NAC)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Route Definition & Scope */}
                        <div className="space-y-4 pt-2 border-t border-slate-200 border-dashed">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Route Logic</Label>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <SmartPortSelector 
                                        label="Port of Loading"
                                        value={activeRate.pol}
                                        onChange={(val) => updateRateField('pol', val)}
                                        icon={MapPin}
                                    />
                                    <div className="flex justify-center -my-2 z-10">
                                        <div className="bg-slate-100 p-1 rounded-full border border-slate-200">
                                            <Anchor className="h-3 w-3 text-slate-400" />
                                        </div>
                                    </div>
                                    <SmartPortSelector 
                                        label="Port of Discharge"
                                        value={activeRate.pod}
                                        onChange={(val) => updateRateField('pod', val)}
                                        icon={Anchor}
                                    />
                                </div>

                                {/* CRITICAL: Service Scope / Incoterm */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative overflow-hidden">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <Handshake className="h-3.5 w-3.5" />
                                        <span className="text-xs font-bold uppercase">Service Scope (Incoterm)</span>
                                    </div>
                                    <Select value={activeRate.incoterm} onValueChange={(v) => updateRateField('incoterm', v)}>
                                        <SelectTrigger className="h-8 bg-white border-slate-200 text-xs font-medium"><SelectValue placeholder="Select Scope" /></SelectTrigger>
                                        <SelectContent>
                                            {INCOTERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    
                                    {/* Guardrail Warnings */}
                                    <div className="space-y-1 mt-2">
                                        {isOriginDisabled && (
                                            <div className="flex items-start gap-2 text-[10px] text-amber-600 bg-amber-50 p-1.5 rounded border border-amber-100">
                                                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                                <span>Origin charges disabled (FOB/FCA).</span>
                                            </div>
                                        )}
                                        {isDestDisabled && (
                                            <div className="flex items-start gap-2 text-[10px] text-blue-600 bg-blue-50 p-1.5 rounded border border-blue-100">
                                                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                                <span>Dest charges disabled (CFR/CIF).</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Validity (Calendar) */}
                        <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wide mb-2">
                                <Calendar className="h-3.5 w-3.5" /> Validity Period
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-blue-600/80 uppercase font-bold">Valid From</Label>
                                    <Input type="date" className="h-9 text-xs bg-white border-blue-200 focus:border-blue-400" 
                                        value={new Date(activeRate.validFrom).toISOString().split('T')[0]} 
                                        onChange={(e) => updateRateField('validFrom', new Date(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-blue-600/80 uppercase font-bold">Valid To</Label>
                                    <Input type="date" className="h-9 text-xs bg-white border-blue-200 focus:border-blue-400"
                                        value={new Date(activeRate.validTo).toISOString().split('T')[0]}
                                        onChange={(e) => updateRateField('validTo', new Date(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. Carrier & Operational Risk */}
                        <div className="space-y-4 border-t border-slate-100 pt-6">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Primary Carrier / Vendor</Label>
                                <Select value={activeRate.carrierName} onValueChange={(v) => updateRateField('carrierName', v)}>
                                    <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Select Carrier" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Maersk Line">Maersk Line</SelectItem>
                                        <SelectItem value="CMA CGM">CMA CGM</SelectItem>
                                        <SelectItem value="MSC">MSC</SelectItem>
                                        <SelectItem value="Hapag-Lloyd">Hapag-Lloyd</SelectItem>
                                        <SelectItem value="Emirates SkyCargo">Emirates SkyCargo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-700">Free Time</Label>
                                        {isDemurrageRisk && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-red-50 text-red-700 border-red-200 max-w-[200px] text-xs">
                                                        Risk! Transit ({activeRate.transitTime}d) + Clearance (7d) {'>'} Free Time ({activeRate.freeTime}d).
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            className={cn("h-9 pl-8", isDemurrageRisk ? "border-red-300 text-red-700 bg-red-50" : "")}
                                            placeholder="e.g. 7" 
                                            value={activeRate.freeTime || ''} 
                                            onChange={(e) => updateRateField('freeTime', parseInt(e.target.value))} 
                                        />
                                        <Timer className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">Transit (Days)</Label>
                                    <div className="relative">
                                        <Input type="number" className="h-9 pl-8" value={activeRate.transitTime} onChange={(e) => updateRateField('transitTime', parseInt(e.target.value))} />
                                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Pricing Engine (Tabs) */}
                <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden relative">
                    <Tabs defaultValue="freight" className="flex-1 flex flex-col h-full">
                        <div className="bg-white border-b border-slate-200 px-8 shrink-0">
                            <TabsList className="h-14 bg-transparent p-0 gap-8">
                                <TabsTrigger 
                                    value="freight" 
                                    disabled={isFreightDisabled}
                                    className={cn(
                                        "h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 font-bold text-sm px-2",
                                        isFreightDisabled ? "opacity-50 cursor-not-allowed text-slate-300" : "data-[state=active]:text-blue-700"
                                    )}
                                >
                                    Main Freight
                                    {isFreightDisabled && <span className="ml-2 text-[10px] uppercase border border-slate-200 px-1 rounded bg-slate-50">N/A</span>}
                                </TabsTrigger>
                                
                                <TabsTrigger 
                                    value="local_origin" 
                                    disabled={isOriginDisabled}
                                    className={cn(
                                        "h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 font-bold text-sm px-2",
                                        isOriginDisabled ? "opacity-50 cursor-not-allowed text-slate-300" : "data-[state=active]:text-blue-700"
                                    )}
                                >
                                    Origin Locals (POL)
                                    {isOriginDisabled && <span className="ml-2 text-[10px] uppercase border border-slate-200 px-1 rounded bg-slate-50">N/A</span>}
                                </TabsTrigger>
                                
                                <TabsTrigger 
                                    value="local_dest" 
                                    disabled={isDestDisabled}
                                    className={cn(
                                        "h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 font-bold text-sm px-2",
                                        isDestDisabled ? "opacity-50 cursor-not-allowed text-slate-300" : "data-[state=active]:text-blue-700"
                                    )}
                                >
                                    Destination Locals (POD)
                                    {isDestDisabled && <span className="ml-2 text-[10px] uppercase border border-slate-200 px-1 rounded bg-slate-50">N/A</span>}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* SCROLLABLE AREA */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-7xl mx-auto space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-800">Charge Matrix</h2>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span className="font-semibold text-slate-700">Currency:</span>
                                        <Select value={activeRate.currency} onValueChange={(v) => updateRateField('currency', v)}>
                                            <SelectTrigger className="h-8 w-24 border-transparent bg-slate-100 hover:bg-slate-200"><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <TabsContent value="freight" className="m-0 focus-visible:ring-0">
                                    <RateGrid section="freightCharges" title="Base Freight & Surcharges" readOnly={isFreightDisabled} />
                                </TabsContent>
                                <TabsContent value="local_origin" className="m-0 focus-visible:ring-0">
                                    <RateGrid section="originCharges" title="Origin Handling & Customs" readOnly={isOriginDisabled} />
                                </TabsContent>
                                <TabsContent value="local_dest" className="m-0 focus-visible:ring-0">
                                    <RateGrid section="destCharges" title="Destination Handling & Delivery" readOnly={isDestDisabled} />
                                </TabsContent>
                            </div>
                        </div>

                        {/* LIVE CALCULATOR FOOTER */}
                        <div className="h-20 bg-white border-t border-slate-200 shrink-0 px-8 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-20">
                            <div className="flex items-center gap-4 text-slate-500">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg"><Calculator className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Estimate (FCL Only)</p>
                                    <p className="text-[10px]">Aggregated 20' / 40' Totals</p>
                                </div>
                            </div>
                            <div className="flex gap-8">
                                <div className="text-right">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">20' DV</span>
                                    <span className="text-2xl font-mono font-bold text-slate-800 tracking-tight">{calcTotal('price20DV').toLocaleString()} <span className="text-xs text-slate-400 font-sans font-medium">{activeRate.currency}</span></span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] uppercase font-bold text-blue-500 block mb-0.5">40' HC</span>
                                    <span className="text-2xl font-mono font-bold text-blue-700 tracking-tight">{calcTotal('price40HC').toLocaleString()} <span className="text-xs text-blue-400 font-sans font-medium">{activeRate.currency}</span></span>
                                </div>
                            </div>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}