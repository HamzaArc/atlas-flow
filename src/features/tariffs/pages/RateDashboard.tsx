import { useEffect, useMemo, useState } from "react";
import { 
    Search, Filter, Plus, Calendar, 
    ArrowRight, MoreHorizontal, TrendingUp, AlertCircle,
    Activity, LineChart, Layers, Globe
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

    const filteredRates = useMemo(() => {
        const term = search.toLowerCase();
        return rates.filter(rate => (
            rate.pol.toLowerCase().includes(term) ||
            rate.pod.toLowerCase().includes(term) ||
            rate.carrierName.toLowerCase().includes(term) ||
            rate.reference.toLowerCase().includes(term)
        ));
    }, [rates, search]);

    const stats = useMemo(() => {
        const now = new Date();
        const active = rates.filter(r => r.status === 'ACTIVE');
        
        const expiringSoon = rates.filter(r => {
            const validTo = new Date(r.validTo);
            const diff = (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 7;
        });
        
        const laneSet = new Set(rates.filter(r => r.pol && r.pod).map(r => `${r.pol}-${r.pod}`));
        
        // Smarter Price Calculation: Sum of all FREIGHT section charges for 40HC
        const baseRates = rates
            .map(rate => {
                const totalFreight = rate.freightCharges.reduce((acc, c) => acc + (c.price40HC || c.unitPrice || 0), 0);
                return totalFreight;
            })
            .filter(p => p > 0);

        const avgBase = baseRates.length ? baseRates.reduce((acc, val) => acc + val, 0) / baseRates.length : 0;
        const maxBase = baseRates.length ? Math.max(...baseRates) : 0;
        const minBase = baseRates.length ? Math.min(...baseRates) : 0;
        
        const lastUpdated = rates.reduce((latest, rate) => {
            const updated = new Date(rate.updatedAt).getTime();
            return updated > latest ? updated : latest;
        }, 0);

        return {
            activeCount: active.length,
            expiringSoonCount: expiringSoon.length,
            laneCount: laneSet.size,
            avgBase,
            minBase,
            maxBase,
            lastUpdated
        };
    }, [rates]);

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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tariff Library</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor carrier pricing, lane coverage, and market signals.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-slate-600 border-slate-200">
                        <Layers className="h-3.5 w-3.5 mr-2" /> Import Excel
                    </Button>
                    <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                        <Plus className="h-4 w-4 mr-2" /> Add Rate Sheet
                    </Button>
                </div>
            </div>

            <div className="p-8 flex-1 overflow-auto">
                
                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Active Tariffs</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-slate-800">{stats.activeCount}</div>
                            <p className="text-[10px] text-slate-400 mt-1">Contracts + Spot sheets</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Expiring &lt; 7 Days</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-amber-600 flex items-center gap-2">
                                {stats.expiringSoonCount} <AlertCircle className="h-4 w-4 text-amber-400" />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Renewal attention</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Lane Coverage</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-emerald-600">{stats.laneCount}</div>
                            <p className="text-[10px] text-slate-400 mt-1">Unique POL → POD lanes</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm bg-blue-50/50">
                        <CardHeader className="p-4 pb-2"><CardTitle className="text-xs uppercase text-blue-600 font-bold tracking-wider">Avg Base Rate</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-blue-700">
                                {stats.avgBase ? stats.avgBase.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
                            </div>
                            <p className="text-[10px] text-blue-400 mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Market benchmark</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Tariff Library Table */}
                    <div className="col-span-8 space-y-4">
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <div className="relative w-96">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Search by POL, POD, carrier, or ref..." 
                                    className="pl-9 bg-slate-50 border-slate-200" 
                                    value={search} onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="text-slate-600 border-slate-200">
                                <Filter className="h-3.5 w-3.5 mr-2" /> Filter
                            </Button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Carrier & Mode</TableHead>
                                        <TableHead>Route (POL → POD)</TableHead>
                                        <TableHead>Validity</TableHead>
                                        <TableHead>Term</TableHead>
                                        <TableHead className="text-right">Total Freight</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRates.map(rate => {
                                        // Sum up all freight section charges for 40HC (or UnitPrice for Air)
                                        const totalFreight = rate.freightCharges.reduce((acc, c) => acc + (c.price40HC || c.unitPrice || 0), 0);
                                        
                                        return (
                                            <TableRow key={rate.id} className="cursor-pointer hover:bg-slate-50" onClick={() => handleEdit(rate.id)}>
                                                <TableCell className="font-medium text-slate-700 text-xs">
                                                    {rate.reference}
                                                    <div className="mt-1">
                                                        <Badge variant={rate.type === 'SPOT' ? 'secondary' : 'outline'} className="text-[9px]">
                                                            {rate.type}
                                                        </Badge>
                                                    </div>
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
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <Globe className="h-3 w-3" />
                                                        {rate.incoterm || 'CY/CY'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-slate-700">
                                                    {totalFreight > 0 ? totalFreight.toLocaleString() : '—'} {rate.currency}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); deleteRate(rate.id);}}>
                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {filteredRates.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-sm text-slate-400 py-10">
                                                No tariffs match your search.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Rate Intelligence - Right Side */}
                    <div className="col-span-4 space-y-4">
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Market Pulse</CardTitle>
                                <Activity className="h-4 w-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-2">
                                <div className="text-2xl font-bold text-slate-800">
                                    {stats.avgBase ? stats.avgBase.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'} USD
                                </div>
                                <div className="text-[11px] text-slate-400">Average freight across active tariffs</div>
                                <div className="flex items-center gap-2 text-xs text-emerald-600">
                                    <LineChart className="h-3.5 w-3.5" />
                                    Stable vs last cycle
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Price Range</CardTitle>
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-slate-800">{stats.minBase.toLocaleString() || '—'}</span>
                                    <span className="text-xs text-slate-400">min</span>
                                </div>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-lg font-bold text-slate-800">{stats.maxBase.toLocaleString() || '—'}</span>
                                    <span className="text-xs text-slate-400">max</span>
                                </div>
                                <div className="mt-2 text-[10px] text-slate-400">Latest update: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : '—'}</div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Lane Coverage Snapshot</CardTitle>
                                <Layers className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3">
                                {rates.slice(0, 3).map(rate => (
                                    <div key={rate.id} className="flex items-center justify-between text-xs text-slate-600">
                                        <span className="font-medium truncate max-w-[150px]">{rate.pol.split('(')[0]} → {rate.pod.split('(')[0]}</span>
                                        <Badge variant="outline" className="text-[9px]">{rate.status}</Badge>
                                    </div>
                                ))}
                                {rates.length === 0 && (
                                    <p className="text-xs text-slate-400">No lane insights yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}