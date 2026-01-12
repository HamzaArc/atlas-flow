import { useMemo } from 'react';
import { SupplierRate } from '@/types/tariff';
import { CalendarClock, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ExpiryRadarProps {
    rates: SupplierRate[];
    onRenew: (rate: SupplierRate) => void;
}

export function ExpiryRadar({ rates, onRenew }: ExpiryRadarProps) {
    
    // Sort logic: Prioritize lanes that are expiring soonest OR have gaps
    const lanes = useMemo(() => {
        const uniqueLanes = new Map<string, SupplierRate[]>();
        const active = rates.filter(r => r.status === 'ACTIVE');
        
        active.forEach(r => {
            const key = `${r.pol.split('(')[0]} → ${r.pod.split('(')[0]}`;
            if (!uniqueLanes.has(key)) uniqueLanes.set(key, []);
            uniqueLanes.get(key)?.push(r);
        });

        const laneArray = Array.from(uniqueLanes.entries()).map(([name, laneRates]) => {
            // Find best validity in this lane
            const maxValidTo = laneRates.reduce((max, r) => {
                const d = new Date(r.validTo).getTime();
                return d > max ? d : max;
            }, 0);
            return { name, rates: laneRates, maxValidTo };
        });

        // Sort: Ascending by Expiry Date (Urgent first)
        return laneArray.sort((a, b) => a.maxValidTo - b.maxValidTo).slice(0, 5);
    }, [rates]);

    const today = new Date();
    // Timeline window: -5 days to +45 days
    const windowStart = new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000));
    const windowEnd = new Date(today.getTime() + (45 * 24 * 60 * 60 * 1000));
    const totalMs = windowEnd.getTime() - windowStart.getTime();

    const getPosition = (date: Date) => {
        const ms = date.getTime() - windowStart.getTime();
        return Math.max(0, Math.min(100, (ms / totalMs) * 100));
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5 text-indigo-600" />
                        Expiry Radar (Top Risks)
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Prioritizing lanes expiring within 45 days.</p>
                </div>
                <Badge variant="outline" className="text-[9px] font-normal border-slate-200">
                    {lanes.length} Critical Lanes
                </Badge>
            </div>

            <div className="space-y-4 flex-1 overflow-auto">
                {lanes.map(({ name, rates: laneRates, maxValidTo }, idx) => {
                    const bestRate = laneRates.find(r => new Date(r.validTo).getTime() === maxValidTo) || laneRates[0];
                    const startPos = getPosition(new Date(bestRate.validFrom));
                    const endPos = getPosition(new Date(bestRate.validTo));
                    
                    const daysLeft = Math.ceil((maxValidTo - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isCritical = daysLeft <= 7;
                    const isWarning = daysLeft <= 14;

                    return (
                        <div key={idx} className="flex flex-col gap-1.5 group">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-600 truncate max-w-[150px]" title={name}>{name}</span>
                                <span className={cn("font-mono", isCritical ? "text-red-600 font-bold" : "text-slate-400")}>
                                    {daysLeft < 0 ? 'EXPIRED' : `${daysLeft}d left`}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2.5 bg-slate-100 rounded-full relative overflow-hidden">
                                    {/* The Bar */}
                                    <div 
                                        className={cn(
                                            "absolute h-full rounded-full transition-all duration-500 shadow-sm",
                                            daysLeft < 0 ? "bg-slate-300" :
                                            isCritical ? "bg-red-500" : 
                                            isWarning ? "bg-amber-400" : "bg-emerald-500"
                                        )}
                                        style={{ left: `${startPos}%`, width: `${Math.max(5, endPos - startPos)}%` }}
                                    />
                                    {/* Today Line */}
                                    <div 
                                        className="absolute top-0 bottom-0 w-px bg-slate-900 z-10 opacity-30 dashed"
                                        style={{ left: `${getPosition(today)}%` }}
                                    />
                                </div>
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onRenew(bestRate)}
                                    title="Clone & Renew"
                                >
                                    <RefreshCw className="h-3 w-3 text-slate-400 hover:text-blue-600" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
                
                {lanes.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-24 text-center bg-slate-50/50 rounded border border-dashed border-slate-200">
                        <AlertCircle className="h-5 w-5 text-emerald-400 mb-1" />
                        <span className="text-xs text-slate-500">All lanes covered safely.</span>
                        <span className="text-[10px] text-slate-400">No expirations in next 45 days.</span>
                    </div>
                )}
            </div>
        </div>
    );
}