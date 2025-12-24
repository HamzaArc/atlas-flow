import { useEffect, useState } from "react";
import { 
    Ship, Plane, Truck, Search, Filter, Plus, 
    MoreHorizontal, ArrowUpRight, AlertCircle, 
    Anchor, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useDossierStore } from "@/store/useDossierStore";
import { OperationsFeed } from "../components/OperationsFeed";
import { ShipmentStatus } from "@/types/index";

export default function DossierDashboard({ onNavigate }: { onNavigate: (view: 'dashboard' | 'dossier') => void }) {
  const { dossiers, fetchDossiers, loadDossier, createDossier, deleteDossier } = useDossierStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
      fetchDossiers();
  }, []);

  const handleOpen = (id: string) => {
      loadDossier(id);
      onNavigate('dossier');
  };

  const handleCreate = () => {
      createDossier();
      onNavigate('dossier');
  };

  // --- STATS CALCULATION ---
  const stats = {
      total: dossiers.length,
      onWater: dossiers.filter(d => d.status === 'ON_WATER').length,
      urgent: dossiers.filter(d => d.freeTimeDays < 3).length,
      revenue: dossiers.reduce((acc, curr) => acc + (curr.currency === 'MAD' ? curr.totalRevenue : curr.totalRevenue * 10), 0)
  };

  const filtered = dossiers.filter(d => 
      d.ref.toLowerCase().includes(search.toLowerCase()) || 
      d.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: ShipmentStatus) => {
      const styles = {
          'BOOKED': 'bg-slate-100 text-slate-600 border-slate-200',
          'PICKUP': 'bg-indigo-50 text-indigo-600 border-indigo-200',
          'AT_POL': 'bg-blue-50 text-blue-600 border-blue-200',
          'ON_WATER': 'bg-sky-100 text-sky-700 border-sky-200',
          'AT_POD': 'bg-amber-50 text-amber-600 border-amber-200',
          'CUSTOMS': 'bg-orange-50 text-orange-600 border-orange-200',
          'DELIVERED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
          'COMPLETED': 'bg-slate-50 text-slate-400 border-slate-100'
      };
      return <Badge variant="outline" className={styles[status] || styles['BOOKED']}>{status.replace('_', ' ')}</Badge>;
  };

  const getModeIcon = (mode: string) => {
      if (mode.includes('SEA')) return <Ship className="h-4 w-4 text-blue-500" />;
      if (mode.includes('AIR')) return <Plane className="h-4 w-4 text-orange-500" />;
      return <Truck className="h-4 w-4 text-emerald-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* 1. HEADER & KPI */}
      <div className="p-6 pb-2">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shipment Operations</h1>
                  <p className="text-slate-500 text-sm">Manage bookings, track cargo, and handle clearances.</p>
              </div>
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                  <Plus className="h-4 w-4 mr-2" /> New Booking
              </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-2">
              <Card className="shadow-sm border-slate-200">
                  <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-medium text-slate-500 uppercase">Active Files</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                  </CardContent>
              </Card>
              <Card className="shadow-sm border-slate-200">
                  <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-medium text-sky-600 uppercase">On Water</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex justify-between items-end">
                      <div className="text-2xl font-bold text-sky-700">{stats.onWater}</div>
                      <Ship className="h-5 w-5 text-sky-200 mb-1" />
                  </CardContent>
              </Card>
              <Card className="shadow-sm border-slate-200 bg-red-50/50">
                  <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-medium text-red-600 uppercase">Demurrage Risk</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex justify-between items-end">
                      <div className="text-2xl font-bold text-red-700">{stats.urgent}</div>
                      <AlertCircle className="h-5 w-5 text-red-300 mb-1" />
                  </CardContent>
              </Card>
              <Card className="shadow-sm border-slate-200">
                  <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-medium text-emerald-600 uppercase">Est. Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold text-emerald-700">{(stats.revenue / 1000).toFixed(1)}k <span className="text-sm font-normal text-slate-400">MAD</span></div>
                  </CardContent>
              </Card>
          </div>
      </div>

      {/* 2. MAIN LIST AREA */}
      <div className="flex-1 px-6 pb-0 overflow-hidden flex flex-col min-h-0">
          
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                      placeholder="Search ref, client, or container..." 
                      className="pl-9 border-slate-200 bg-slate-50"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                  />
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-white text-slate-600 border-slate-200">
                      <Filter className="h-3.5 w-3.5 mr-2" /> Filter Status
                  </Button>
              </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-t-xl shadow-sm flex-1 overflow-auto">
              <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10">
                      <TableRow>
                          <TableHead className="w-[180px]">Reference</TableHead>
                          <TableHead>Client & Route</TableHead>
                          <TableHead className="w-[140px]">Schedule</TableHead>
                          <TableHead className="w-[140px]">Status</TableHead>
                          <TableHead className="w-[180px]">Progress</TableHead>
                          <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filtered.map((d) => (
                          <TableRow key={d.id} className="group cursor-pointer hover:bg-blue-50/30 transition-colors" onClick={() => handleOpen(d.id)}>
                              <TableCell className="align-top py-3">
                                  <div className="flex items-center gap-3">
                                      <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 border border-slate-200">
                                          {getModeIcon(d.mode)}
                                      </div>
                                      <div>
                                          <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{d.ref}</div>
                                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{d.mode}</div>
                                      </div>
                                  </div>
                              </TableCell>
                              <TableCell className="align-top py-3">
                                  <div className="font-medium text-slate-700 text-sm mb-1">{d.clientName}</div>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                      <span className="font-bold">{d.pol.split('(')[0]}</span>
                                      <ArrowUpRight className="h-3 w-3 text-slate-300" />
                                      <span className="font-bold">{d.pod.split('(')[0]}</span>
                                  </div>
                              </TableCell>
                              <TableCell className="align-top py-3">
                                  <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                          <Anchor className="h-3 w-3 text-slate-400" /> 
                                          {new Date(d.etd).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                          <Calendar className="h-3 w-3 text-slate-400" />
                                          {new Date(d.eta).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                      </div>
                                  </div>
                              </TableCell>
                              <TableCell className="align-top py-3">
                                  {getStatusBadge(d.status)}
                                  {d.freeTimeDays < 4 && (
                                      <div className="flex items-center gap-1 mt-1 text-[10px] text-red-600 font-medium">
                                          <AlertCircle className="h-3 w-3" /> {d.freeTimeDays} Days Free
                                      </div>
                                  )}
                              </TableCell>
                              <TableCell className="align-top py-3">
                                  <div className="space-y-1.5">
                                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                          <span>Transit</span>
                                          <span>75%</span>
                                      </div>
                                      <Progress value={75} className="h-1.5 bg-slate-100" />
                                      <div className="text-[10px] text-slate-400">{d.vesselName}</div>
                                  </div>
                              </TableCell>
                              <TableCell className="align-top py-3 text-right">
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700" onClick={(e) => e.stopPropagation()}>
                                              <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpen(d.id); }}>
                                              View Details
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Logic for Track */ }}>
                                              Track Cargo
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                              onClick={(e) => { e.stopPropagation(); deleteDossier(d.id); }}
                                          >
                                              Archive
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </div>
      </div>

      {/* 3. COLLABORATION HUB (Fixed Bottom) */}
      <OperationsFeed />
    </div>
  );
}