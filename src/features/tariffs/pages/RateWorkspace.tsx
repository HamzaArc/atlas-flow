import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Ship, Calendar, Anchor, Clock, Calculator, Plane, Truck, MapPin, Handshake } from "lucide-react";
import { useTariffStore } from "@/store/useTariffStore";
import { RateGrid } from "../components/RateGrid";
import { SmartPortSelector } from "@/features/quotes/components/RouteSelector"; 
import { cn } from "@/lib/utils";

const INCOTERMS = [
    "CY/CY", "CY/FO", "FO/CY", "FO/FO", // Port-to-Port variants
    "EXW", "FCA", "FOB", "DAP", "DDP" // Door variants
];

interface RateWorkspaceProps {
    onBack: () => void;
}

export default function RateWorkspace({ onBack }: RateWorkspaceProps) {
    const { activeRate, updateRateField, saveRate, isLoading } = useTariffStore();

    if (!activeRate) return <div>Loading...</div>;

    const calcTotal = (key: 'price20DV' | 'price40HC') => {
        const freight = activeRate.freightCharges.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        const origin = activeRate.originCharges.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        const dest = activeRate.destCharges.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        return freight + origin + dest;
    };

    const ModeIcon = activeRate.mode === 'AIR' ? Plane : activeRate.mode === 'ROAD' ? Truck : Ship;

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5 text-slate-500" /></Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{activeRate.reference || 'New Rate Sheet'}</h1>
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

                        {/* 2. Route Definition & Scope (RESTORED INCOTERM) */}
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

                                {/* CRITICAL RESTORATION: Service Scope / Incoterm */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
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
                                    <p className="text-[10px] text-slate-400">
                                        Defines the responsibility boundaries (e.g. CY/CY does not include trucking).
                                    </p>
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

                        {/* 4. Carrier & Service */}
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
                                    <Label className="text-xs font-bold text-slate-700">Service Loop</Label>
                                    <Input className="h-9" placeholder="e.g. AEU3" value={activeRate.serviceLoop || ''} onChange={(e) => updateRateField('serviceLoop', e.target.value)} />
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

                {/* RIGHT: Pricing Engine (CONTAINED) */}
                <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden relative">
                    <Tabs defaultValue="freight" className="flex-1 flex flex-col h-full">
                        <div className="bg-white border-b border-slate-200 px-8 shrink-0">
                            <TabsList className="h-14 bg-transparent p-0 gap-8">
                                <TabsTrigger value="freight" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 font-bold text-sm px-2">
                                    Main Freight
                                </TabsTrigger>
                                <TabsTrigger value="local_origin" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 font-bold text-sm px-2">
                                    Origin Locals (POL)
                                </TabsTrigger>
                                <TabsTrigger value="local_dest" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 font-bold text-sm px-2">
                                    Destination Locals (POD)
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
                                    <RateGrid section="freightCharges" title="Base Freight & Surcharges" />
                                </TabsContent>
                                <TabsContent value="local_origin" className="m-0 focus-visible:ring-0">
                                    <RateGrid section="originCharges" title="Origin Handling & Customs" />
                                </TabsContent>
                                <TabsContent value="local_dest" className="m-0 focus-visible:ring-0">
                                    <RateGrid section="destCharges" title="Destination Handling & Delivery" />
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