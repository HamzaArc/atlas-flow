import { useFinanceStore } from "@/store/useFinanceStore";
import { TrendingUp, TrendingDown, AlertTriangle, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function FinanceHeader() {
    const { totalRevenue, totalCost, totalMargin, marginPercent } = useFinanceStore();

    // EXPLICIT TYPE CASTING TO PREVENT TS ERRORS
    const safeMarginPercent = Number(marginPercent || 0);
    const isHealthy: boolean = safeMarginPercent >= 15;

    return (
        <div className="grid grid-cols-4 gap-4 p-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
            
            {/* Revenue */}
            <div className="flex flex-col border-r border-slate-100 pr-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" /> Revenue (Accrued)
                </span>
                <span className="text-xl font-bold text-slate-800 font-mono mt-1">
                    {totalRevenue.toLocaleString()} <span className="text-xs text-slate-400">MAD</span>
                </span>
            </div>

            {/* Cost */}
            <div className="flex flex-col border-r border-slate-100 pr-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-red-500" /> Costs (Actuals)
                </span>
                <span className="text-xl font-bold text-slate-800 font-mono mt-1">
                    {totalCost.toLocaleString()} <span className="text-xs text-slate-400">MAD</span>
                </span>
            </div>

            {/* Margin */}
            <div className="flex flex-col border-r border-slate-100 pr-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Wallet className="h-3 w-3 text-blue-500" /> Net Margin
                </span>
                <div className="flex items-end gap-2 mt-1">
                    <span className={cn("text-xl font-bold font-mono", totalMargin < 0 ? "text-red-600" : "text-blue-700")}>
                        {totalMargin.toLocaleString()} <span className="text-xs text-slate-400 font-sans">MAD</span>
                    </span>
                    <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", isHealthy ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                        {safeMarginPercent}%
                    </span>
                </div>
            </div>

            {/* Alerts */}
            <div className="flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                {!isHealthy ? (
                    <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-xs font-bold">Low Margin Alert</span>
                    </div>
                ) : (
                    <span className="text-xs text-slate-400 font-medium">Financials Healthy</span>
                )}
            </div>
        </div>
    );
}