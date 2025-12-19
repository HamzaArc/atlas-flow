import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Ship, Calendar, Anchor, Clock, DollarSign, Calculator } from "lucide-react";
import { useTariffStore } from "@/store/useTariffStore";
import { RateGrid } from "../components/RateGrid";
import { RouteSelector } from "@/features/quotes/components/RouteSelector"; 

interface RateWorkspaceProps {
    onBack: () => void;
}

export default function RateWorkspace({ onBack }: RateWorkspaceProps) {
    const { activeRate, updateRateField, saveRate, isLoading } = useTariffStore();

    if (!activeRate) return <div>Loading...</div>;

    // Auto-calc logic for the footer
    const calcTotal = (key: 'price20DV' | 'price40HC') => {
        const freight = activeRate.freightCharges.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        const origin = activeRate.originCharges.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        const dest = activeRate.destCharges.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        return freight + origin + dest;
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5 text-slate-500" /></Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-900">{activeRate.reference || 'New Rate Sheet'}</h1>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase border border-blue-100">{activeRate.status}</span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                            <Ship className="h-3 w-3" /> Procurement Manager
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={saveRate} disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 text-white shadow-md">
                        <Save className="h-4 w-4 mr-2" /> {isLoading ? 'Saving...' : 'Save Rate'}
                    </Button>
                </div>
            </div>

            {/* Split Layout */}
            <div className="flex-1 overflow-hidden flex">
                
                {/* LEFT: Context & Route (WIDENED to 450px) */}
                <div className="w-[450px] border-r border-slate-200 bg-white flex flex-col overflow-y-auto shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
                    <div className="p-6 space-y-8">
                        
                        {/* 1. Route Reuse (Taller) */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Route Definition</Label>
                            <div className="h-72 border rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-100">
                                <RouteSelector /> 
                            </div>
                        </div>

                        {/* 2. Validity (Better Spacing) */}
                        <div className="space-y-3 p-5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wide mb-2">
                                <Calendar className="h-3.5 w-3.5 text-blue-600" /> Validity Period
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-slate-500 uppercase font-bold">Valid From</Label>
                                    <Input type="date" className="h-9 text-xs bg-white border-slate-200" 
                                        value={new Date(activeRate.validFrom).toISOString().split('T')[0]} 
                                        onChange={(e) => updateRateField('validFrom', new Date(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-slate-500 uppercase font-bold">Valid To</Label>
                                    <Input type="date" className="h-9 text-xs bg-white border-slate-200"
                                        value={new Date(activeRate.validTo).toISOString().split('T')[0]}
                                        onChange={(e) => updateRateField('validTo', new Date(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Carrier & Service */}
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700">Carrier</Label>
                                <Select value={activeRate.carrierName} onValueChange={(v) => updateRateField('carrierName', v)}>
                                    <SelectTrigger className="h-10 border-slate-200"><SelectValue placeholder="Select Carrier" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Maersk Line">Maersk Line</SelectItem>
                                        <SelectItem value="CMA CGM">CMA CGM</SelectItem>
                                        <SelectItem value="MSC">MSC</SelectItem>
                                        <SelectItem value="Hapag-Lloyd">Hapag-Lloyd</SelectItem>
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

                        {/* 4. Terms */}
                        <div className="space-y-4 pt-6 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">Incoterm Scope</Label>
                                    <Select value={activeRate.incoterm} onValueChange={(v) => updateRateField('incoterm', v)}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CY/CY">CY / CY</SelectItem>
                                            <SelectItem value="CY/FO">CY / FO</SelectItem>
                                            <SelectItem value="FIFO">FI / FO</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700">Free Time</Label>
                                    <div className="relative">
                                        <Input type="number" className="h-9 pl-8" value={activeRate.freeTime} onChange={(e) => updateRateField('freeTime', parseInt(e.target.value))} />
                                        <Anchor className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Pricing Engine (CONTAINED) */}
                <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden relative">
                    <Tabs defaultValue="freight" className="flex-1 flex flex-col h-full">
                        <div className="bg-white border-b border-slate-200 px-8 shrink-0">
                            <TabsList className="h-14 bg-transparent p-0 gap-8">
                                <TabsTrigger value="freight" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 font-bold text-sm px-2">
                                    Freight & Surcharges
                                </TabsTrigger>
                                <TabsTrigger value="local_origin" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 font-bold text-sm px-2">
                                    Origin Locals
                                </TabsTrigger>
                                <TabsTrigger value="local_dest" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 font-bold text-sm px-2">
                                    Destination Locals
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* SCROLLABLE AREA WITH MAX-WIDTH CONTAINER */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-6xl mx-auto space-y-8">
                                <TabsContent value="freight" className="m-0 focus-visible:ring-0">
                                    <RateGrid section="freightCharges" title="Main Leg Charges" />
                                </TabsContent>
                                <TabsContent value="local_origin" className="m-0 focus-visible:ring-0">
                                    <RateGrid section="originCharges" title="POL Local Charges" />
                                </TabsContent>
                                <TabsContent value="local_dest" className="m-0 focus-visible:ring-0">
                                    <RateGrid section="destCharges" title="POD Local Charges" />
                                </TabsContent>
                            </div>
                        </div>

                        {/* LIVE CALCULATOR FOOTER */}
                        <div className="h-24 bg-white border-t border-slate-200 shrink-0 px-10 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-20">
                            <div className="flex items-center gap-4 text-slate-500">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Calculator className="h-6 w-6" /></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Total Buy Rate (All-In)</p>
                                    <p className="text-xs">Automatic aggregation of all active charges.</p>
                                </div>
                            </div>
                            <div className="flex gap-12">
                                <div className="text-right">
                                    <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">20' DV Total</span>
                                    <span className="text-3xl font-mono font-bold text-slate-800 tracking-tight">{calcTotal('price20DV').toLocaleString()} <span className="text-sm text-slate-400 font-sans font-medium">{activeRate.currency}</span></span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] uppercase font-bold text-blue-500 block mb-1">40' HC Total</span>
                                    <span className="text-3xl font-mono font-bold text-blue-700 tracking-tight">{calcTotal('price40HC').toLocaleString()} <span className="text-sm text-blue-400 font-sans font-medium">{activeRate.currency}</span></span>
                                </div>
                            </div>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}