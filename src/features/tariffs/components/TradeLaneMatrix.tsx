import { useMemo } from 'react';
import { SupplierRate } from '@/types/tariff';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton'; 

interface TradeLaneMatrixProps {
    rates: SupplierRate[];
    onSelectLane: (pol: string, pod: string) => void;
    isLoading?: boolean;
}

// Simple FX (In production this would come from FinanceStore)
const FX_EUR_USD = 1.1; 

export function TradeLaneMatrix({ rates, onSelectLane, isLoading }: TradeLaneMatrixProps) {
    
    const matrix = useMemo(() => {
        const pols = new Set<string>();
        const pods = new Set<string>();
        const map = new Map<string, SupplierRate[]>();

        // Only Active Rates
        const activeRates = rates.filter(r => r.status === 'ACTIVE');

        activeRates.forEach(rate => {
            const cleanPol = rate.pol.split('(')[0].trim();
            const cleanPod = rate.pod.split('(')[0].trim();
            pols.add(cleanPol);
            pods.add(cleanPod);
            
            const key = `${cleanPol}-${cleanPod}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)?.push(rate);
        });

        return {
            rows: Array.from(pols).sort(),
            cols: Array.from(pods).sort(),
            data: map
        };
    }, [rates]);

    const getBestRate = (pol: string, pod: string) => {
        const laneRates = matrix.data.get(`${pol}-${pod}`);
        if (!laneRates || laneRates.length === 0) return null;

        // Sort by Normalized Price (USD)
        return laneRates.sort((a, b) => {
            const priceA = getNormalizedPrice(a);
            const priceB = getNormalizedPrice(b);
            return priceA - priceB;
        })[0];
    };

    const getNormalizedPrice = (r: SupplierRate) => {
        const raw = r.freightCharges.reduce((acc, c) => acc + (c.price40HC || 0), 0);
        return r.currency === 'EUR' ? raw * FX_EUR_USD : raw;
    };

    if (isLoading) {
        return <Skeleton className="w-full h-[300px] rounded-lg" />
    }

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                    Market Coverage Heatmap
                </h3>
                <span className="text-[10px] text-slate-400">Comparing {rates.filter(r=>r.status === 'ACTIVE').length} active tariffs (Base 40' HC USD)</span>
            </div>
            
            <div className="overflow-auto flex-1">
                {matrix.rows.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                        <p className="text-sm italic">No Active Lanes Found.</p>
                        <p className="text-xs mt-1">Import rates or create a new sheet to populate the matrix.</p>
                    </div>
                ) : (
                    <table className="w-full text-xs border-collapse">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 bg-white text-left font-bold text-slate-400 border-b border-r border-slate-100 min-w-[120px]">
                                    POL \ POD
                                </th>
                                {matrix.cols.map(pod => (
                                    <th key={pod} className="p-2 bg-slate-50 font-bold text-slate-600 border-b border-slate-100 min-w-[140px] text-center whitespace-nowrap">
                                        {pod}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.rows.map(pol => (
                                <tr key={pol}>
                                    <td className="p-3 font-bold text-slate-700 bg-slate-50/30 border-r border-b border-slate-100 sticky left-0 z-10 whitespace-nowrap">
                                        {pol}
                                    </td>
                                    {matrix.cols.map(pod => {
                                        const bestRate = getBestRate(pol, pod);
                                        const normalizedPrice = bestRate ? getNormalizedPrice(bestRate) : 0;
                                        
                                        return (
                                            <td key={`${pol}-${pod}`} className="border-b border-r border-slate-100 p-1 min-w-[140px]">
                                                {bestRate ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div 
                                                                    onClick={() => onSelectLane(pol, pod)}
                                                                    className={cn(
                                                                        "h-full w-full p-2 rounded cursor-pointer transition-all border border-transparent hover:border-blue-200 hover:shadow-md group relative",
                                                                        bestRate.volatilityFlag ? "bg-amber-50 hover:bg-amber-100" : "bg-emerald-50/30 hover:bg-emerald-100"
                                                                    )}
                                                                >
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className={cn("font-bold text-sm", bestRate.volatilityFlag ? "text-amber-700" : "text-emerald-700")}>
                                                                            ${normalizedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                                        </span>
                                                                        {bestRate.volatilityFlag && <AlertTriangle className="h-3 w-3 text-amber-500 animate-pulse" />}
                                                                    </div>
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[9px] uppercase font-bold text-slate-500 truncate max-w-[80px]">{bestRate.carrierName}</span>
                                                                        <span className="text-[9px] text-slate-400 bg-white/50 px-1 rounded">{bestRate.transitTime}d</span>
                                                                    </div>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="text-xs max-w-[200px]">
                                                                <p className="font-bold border-b border-slate-600 pb-1 mb-1">{bestRate.carrierName}</p>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                                                                    <span className="text-slate-400">Ref:</span> <span>{bestRate.reference}</span>
                                                                    <span className="text-slate-400">Orig:</span> <span>{bestRate.currency} {(bestRate.freightCharges.reduce((a,c)=>a+(c.price40HC||0),0)).toLocaleString()}</span>
                                                                    <span className="text-slate-400">Valid:</span> <span>{new Date(bestRate.validTo).toLocaleDateString()}</span>
                                                                </div>
                                                                {bestRate.volatilityFlag && (
                                                                    <div className="mt-2 p-1.5 bg-amber-500/10 text-amber-300 rounded border border-amber-500/20">
                                                                        ⚠️ High Volatility: Price increased {'>'}10% vs previous contract.
                                                                    </div>
                                                                )}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <div className="h-full w-full p-2 min-h-[50px] flex items-center justify-center">
                                                        <span className="text-slate-200 text-lg">·</span>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}