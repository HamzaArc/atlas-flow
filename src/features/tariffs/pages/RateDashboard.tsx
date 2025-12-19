import { useEffect, useState } from "react";
import { 
    Search, Filter, Plus, Ship, Calendar, 
    ArrowRight, MapPin, MoreHorizontal, FileText,
    TrendingUp, ShieldCheck, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { useTariffStore } from "@/store/useTariffStore";

export default function RateDashboard({ onNavigate }: { onNavigate: (page: 'dashboard' | 'workspace') => void }) {
    const { rates, fetchRates, loadRate, createRate, deleteRate } = useTariffStore();
    const [search, setSearch] = useState("");

    useEffect(() => { fetchRates(); }, []);

    const handleCreate = () => {
        createRate();
        onNavigate('workspace');
    };

    const handleEdit = (id: string) => {
        loadRate(id);
        onNavigate('workspace');
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Header */}
            <div className="px-8 py-6 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tariff Manager</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage carrier contracts, spot rates, and surcharges.</p>
                </div>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                    <Plus className="h-4 w-4 mr-2" /> Add Rate Sheet
                </Button>
            </div>

            <div className="p-8 flex-1 overflow-auto">
                
                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Active Contracts</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-slate-800">{rates.filter(r => r.status === 'ACTIVE').length}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Expiring &lt; 7 Days</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-amber-600 flex items-center gap-2">
                                0 <AlertCircle className="h-4 w-4 text-amber-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Route Coverage</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-emerald-600">85%</div>
                            <p className="text-[10px] text-slate-400 mt-1">Top 20 Lanes Covered</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm bg-blue-50/50">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-blue-600 font-bold tracking-wider">Avg Rate (40HC)</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-blue-700">$2,450</div>
                            <p className="text-[10px] text-blue-400 mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +12% vs last month</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Search by POL, POD, or Carrier..." 
                            className="pl-9 bg-slate-50 border-slate-200" 
                            value={search} onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="sm" className="text-slate-600 border-slate-200">
                        <Filter className="h-3.5 w-3.5 mr-2" /> Filter
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Reference</TableHead>
                                <TableHead>Carrier & Mode</TableHead>
                                <TableHead>Route (POL → POD)</TableHead>
                                <TableHead>Validity</TableHead>
                                <TableHead className="text-right">Base 40HC</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rates.map(rate => {
                                const baseRate = rate.freightCharges.find(c => c.chargeHead === 'Ocean Freight')?.price40HC || 0;
                                return (
                                    <TableRow key={rate.id} className="cursor-pointer hover:bg-slate-50" onClick={() => handleEdit(rate.id)}>
                                        <TableCell className="font-medium text-slate-700 text-xs">
                                            {rate.reference}
                                            <div className="mt-1"><Badge variant="outline" className="text-[9px]">{rate.type}</Badge></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-blue-50 text-blue-700 rounded-md flex items-center justify-center font-bold text-xs">
                                                    {rate.carrierName.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs text-slate-700">{rate.carrierName}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{rate.serviceLoop || 'Direct'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                                <span className="px-2 py-1 bg-slate-100 rounded">{rate.pol.split('(')[0]}</span>
                                                <ArrowRight className="h-3 w-3 text-slate-300" />
                                                <span className="px-2 py-1 bg-slate-100 rounded">{rate.pod.split('(')[0]}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(rate.validTo).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-700">
                                            {baseRate.toLocaleString()} {rate.currency}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); deleteRate(rate.id);}}>
                                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}