import { useEffect, useState, useRef } from "react";
import { 
    Search, Plus, Layers, AlertCircle, FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTariffStore } from "@/store/useTariffStore";
import { TradeLaneMatrix } from "../components/TradeLaneMatrix";
import { ExpiryRadar } from "../components/ExpiryRadar";
import { SupplierRate } from "@/types/tariff";
import { useToast } from "@/components/ui/use-toast"; // Using your existing hook
import { cn } from "@/lib/utils"; // FIXED: Added missing import

export default function RateDashboard({ onNavigate }: { onNavigate: (page: 'dashboard' | 'workspace') => void }) {
    const { rates, fetchRates, loadRate, createRate, isLoading } = useTariffStore();
    const { toast } = useToast();
    
    const [search, setSearch] = useState("");
    const [filterVolatile, setFilterVolatile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchRates(); }, []);

    // Derived State: Counts
    const volatileCount = rates.filter(r => r.volatilityFlag).length;

    // Filter Logic
    const filteredRates = rates.filter(rate => {
        const matchesSearch = !search || 
            rate.pol.toLowerCase().includes(search.toLowerCase()) || 
            rate.pod.toLowerCase().includes(search.toLowerCase()) ||
            rate.carrierName.toLowerCase().includes(search.toLowerCase());
        
        const matchesVolatility = filterVolatile ? rate.volatilityFlag : true;

        return matchesSearch && matchesVolatility;
    });

    const handleCreate = () => {
        createRate();
        onNavigate('workspace');
    };

    const handleLaneSelect = (pol: string, pod: string) => {
        // Smart Selection: Find the BEST rate for this lane to open
        const laneRates = rates.filter(r => r.pol.includes(pol) && r.pod.includes(pod));
        if (laneRates.length > 0) {
            // Sort by newness
            const newest = laneRates.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
            loadRate(newest.id);
            onNavigate('workspace');
        }
    };

    const handleRenew = (rate: SupplierRate) => {
        loadRate(rate.id);
        // FIXED: Toast signature matches your use-toast.tsx (message, type)
        toast(`Renewal Mode: Loaded ${rate.reference}. Update validity dates and Save to renew.`, 'info');
        onNavigate('workspace');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // FIXED: Toast signature match
            toast(`Import Processing: Analyzing ${e.target.files[0].name}...`, 'info');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Hidden File Input for "Real" Import Action */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx,.csv" 
                onChange={handleFileChange}
            />

            {/* Header */}
            <div className="px-8 py-6 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        Procurement Control Tower
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 uppercase tracking-wide">
                            Live
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Monitor volatility, expiry risks, and market coverage across {new Set(rates.map(r => r.pol + r.pod)).size} trade lanes.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-64 mr-2">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Find lane or carrier..." 
                            className="pl-9 h-9 bg-slate-50 border-slate-200 text-xs focus-visible:ring-blue-500" 
                            value={search} onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50"
                        onClick={handleImportClick}
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Import
                    </Button>
                    <Button onClick={handleCreate} className="bg-slate-900 hover:bg-slate-800 shadow-sm text-xs font-bold transition-all active:scale-95">
                        <Plus className="h-4 w-4 mr-2" /> New Rate Sheet
                    </Button>
                </div>
            </div>

            <div className="p-8 flex-1 overflow-hidden flex flex-col gap-6">
                
                {/* 1. The Strategy Layer: Matrix & Radar */}
                <div className="grid grid-cols-12 gap-6 h-[60%] shrink-0">
                    {/* Left: The Market Matrix */}
                    <div className="col-span-8 h-full">
                        <TradeLaneMatrix 
                            rates={filteredRates} 
                            onSelectLane={handleLaneSelect} 
                            isLoading={isLoading}
                        />
                    </div>
                    
                    {/* Right: The Risk Radar */}
                    <div className="col-span-4 flex flex-col gap-6 h-full">
                        <div className="flex-1 min-h-0">
                            <ExpiryRadar rates={rates} onRenew={handleRenew} />
                        </div>
                        
                        {/* Interactive Volatility Alert */}
                        {volatileCount > 0 ? (
                            <div className={cn(
                                "border rounded-lg p-4 transition-all cursor-pointer",
                                filterVolatile ? "bg-amber-100 border-amber-300 ring-1 ring-amber-300 shadow-sm" : "bg-amber-50 border-amber-200 hover:bg-amber-100"
                            )}
                            onClick={() => setFilterVolatile(!filterVolatile)}
                            >
                                <div className="flex items-start gap-3">
                                    <AlertCircle className={cn("h-5 w-5 mt-0.5", filterVolatile ? "text-amber-700" : "text-amber-600")} />
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-800">
                                            {filterVolatile ? "Filtering by Volatility" : "Market Volatility Alert"}
                                        </h4>
                                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                            Detected <strong>{volatileCount} rates</strong> with price jumps {'>'} 10%.
                                            {filterVolatile ? " Click to clear filter." : " Click to filter matrix."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <Layers className="h-5 w-5 text-emerald-600" />
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-800">Market Stable</h4>
                                        <p className="text-xs text-emerald-700">No significant price anomalies detected.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Recent Activity List (Filling remainder) */}
                <div className="flex-1 min-h-0 flex flex-col">
                     <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 shrink-0">Recent Uploads</h3>
                     <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-auto flex-1">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-500">Reference</th>
                                    <th className="p-3 font-semibold text-slate-500">Route</th>
                                    <th className="p-3 font-semibold text-slate-500">Carrier</th>
                                    <th className="p-3 font-semibold text-slate-500 text-right">Base 40'</th>
                                    <th className="p-3 font-semibold text-slate-500 text-right">Valid To</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRates.slice(0, 8).map((rate) => (
                                    <tr 
                                        key={rate.id} 
                                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => { loadRate(rate.id); onNavigate('workspace'); }}
                                    >
                                        <td className="p-3 font-medium text-slate-700">{rate.reference}</td>
                                        <td className="p-3 text-slate-600">{rate.pol.split('(')[0]} → {rate.pod.split('(')[0]}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                 <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[9px]">
                                                    {rate.carrierName.substring(0, 1)}
                                                </div>
                                                {rate.carrierName}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-mono text-emerald-600 font-bold">
                                            {rate.freightCharges.reduce((acc, c) => acc + (c.price40HC || 0), 0).toLocaleString()} {rate.currency}
                                        </td>
                                        <td className="p-3 text-right text-slate-500">{new Date(rate.validTo).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                </div>
            </div>
        </div>
    );
}