import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Plus, FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area 
} from "recharts";
import { useFinanceStore } from "@/store/useFinanceStore";
import { ManualInvoiceDialog } from "../components/ManualInvoiceDialog";
import { useToast } from "@/components/ui/use-toast";

// --- MOCK DATA FOR VISUALIZATION ---
const CHART_DATA = [
    { name: 'Jan', revenue: 45000, cost: 32000 },
    { name: 'Feb', revenue: 52000, cost: 38000 },
    { name: 'Mar', revenue: 48000, cost: 36000 },
    { name: 'Apr', revenue: 61000, cost: 42000 },
    { name: 'May', revenue: 55000, cost: 39000 },
    { name: 'Jun', revenue: 67000, cost: 48000 },
    { name: 'Jul', revenue: 72000, cost: 51000 },
];

export default function FinanceDashboard() {
    const { 
        invoices, fetchGlobalStats, 
        globalRevenue, globalOverdue, globalMargin, 
        createManualInvoice 
    } = useFinanceStore();
    
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchGlobalStats();
    }, [invoices]); // Re-calc when invoices change

    const handleExportSOA = () => {
        toast("SOA Exported", "success"); // Simulation
    };

    return (
        <div className="p-8 h-full bg-slate-50 overflow-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Overview</h1>
                    <p className="text-slate-500 text-sm mt-1">Global P&L, Aging Reports, and Cash Flow</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportSOA} className="bg-white border-slate-300 text-slate-700 shadow-sm">
                        <Download className="h-4 w-4 mr-2" /> Export SOA
                    </Button>
                    <Button onClick={() => setIsInvoiceOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white shadow-md">
                        <Plus className="h-4 w-4 mr-2" /> New Manual Invoice
                    </Button>
                </div>
            </div>

            {/* KPI Cards (LIVE DATA) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="shadow-sm border-slate-200 bg-white">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Unbilled Revenue (WIP)</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-blue-700">{globalRevenue.toLocaleString()} <span className="text-sm font-normal text-slate-400">MAD</span></div>
                        <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[65%]"></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 bg-white">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Overdue Invoices</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-red-600">{globalOverdue.toLocaleString()} <span className="text-sm font-normal text-slate-400">MAD</span></div>
                        {globalOverdue > 0 && (
                            <p className="text-[10px] text-red-400 mt-1 font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Critical Accounts
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 bg-white">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Net Margin (YTD)</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-emerald-700">{globalMargin}%</div>
                        <p className="text-[10px] text-emerald-600 mt-1 font-medium">+2.1% vs Last Year</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 bg-amber-50/50">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-amber-700 font-bold tracking-wider">Cash Flow Forecast</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-amber-900">+85k <span className="text-sm font-normal text-amber-700/60">Next 30d</span></div>
                        <div className="h-8 mt-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={CHART_DATA}>
                                    <Area type="monotone" dataKey="revenue" stroke="#d97706" fill="#fcd34d" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* MAIN CHART AREA */}
            <div className="grid grid-cols-3 gap-6 h-96">
                
                {/* Revenue vs Cost Chart */}
                <Card className="col-span-2 shadow-sm border-slate-200 bg-white flex flex-col">
                    <CardHeader className="border-b border-slate-100 p-4">
                        <CardTitle className="text-sm font-bold text-slate-700">Performance Analytics (Revenue vs Cost)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={CHART_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar dataKey="cost" name="Direct Cost" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pending Actions Feed (Live from Store) */}
                <Card className="col-span-1 shadow-sm border-slate-200 bg-white flex flex-col">
                    <CardHeader className="border-b border-slate-100 p-4">
                        <CardTitle className="text-sm font-bold text-slate-700">Recent Invoices</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-auto">
                        {invoices.map((inv) => (
                            <div key={inv.id} className="flex items-start gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                                    inv.status === 'PAID' ? 'bg-green-50 text-green-600 border-green-200' : 
                                    inv.status === 'OVERDUE' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                                }`}>
                                    <FileText className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">{inv.reference}</p>
                                    <p className="text-[10px] text-slate-500">{inv.clientName} • {inv.total.toLocaleString()} MAD</p>
                                </div>
                                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                                    {inv.status}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* MODAL */}
            <ManualInvoiceDialog 
                open={isInvoiceOpen} 
                onOpenChange={setIsInvoiceOpen} 
                onSubmit={createManualInvoice} 
            />
        </div>
    );
}