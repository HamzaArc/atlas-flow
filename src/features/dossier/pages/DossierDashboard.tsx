// src/features/dossier/pages/DossierDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Activity, Calendar, Truck, AlertTriangle, 
  Search, ArrowRight, ChevronRight, Plus,
  Anchor, Plane, Box, FileText, CheckCircle2, RefreshCw,
  Trash2, Filter, User, Loader2, ChevronLeft, Info
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { NewDossierDialog } from "../components/dialogs/NewDossierDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function DossierDashboard() {
  const navigate = useNavigate();
  const { 
      dossiers, 
      totalRecords, 
      dashboardStats: stats,
      fetchPaginatedDossiers, 
      fetchDashboardStats,
      deleteDossier, 
      isLoading, 
      error 
  } = useDossierStore();
  
  useToast();

  // Local Form & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterMode, setFilterMode] = useState<string>('All');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. Fetch Stats Independently on Mount
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // 2. Debounce Text Inputs
  useEffect(() => {
      const handler = setTimeout(() => {
          setDebouncedSearch(searchQuery);
      }, 400); 
      return () => clearTimeout(handler);
  }, [searchQuery]);

  // 3. Reset pagination if search or tabs change
  useEffect(() => {
      setCurrentPage(1);
  }, [filterMode, debouncedSearch, pageSize]);

  // 4. Primary Data Loader trigger (Server-Side Execution)
  useEffect(() => {
      fetchPaginatedDossiers({
          page: currentPage,
          pageSize,
          filterMode,
          searchTerm: debouncedSearch,
          sortField: 'created_at',
          sortOrder: 'desc'
      });
  }, [currentPage, pageSize, filterMode, debouncedSearch, fetchPaginatedDossiers]);

  // --- Handlers ---
  const handleManualRefresh = () => {
      fetchDashboardStats();
      fetchPaginatedDossiers({ page: currentPage, pageSize, filterMode, searchTerm: debouncedSearch });
  };

  const handleDelete = async (e: React.MouseEvent, id: string, ref: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete dossier ${ref}? This action cannot be undone.`)) {
      try {
        await deleteDossier(id);
        handleManualRefresh();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  // --- Helpers ---
  const getModeIcon = (mode: string) => {
     if (mode?.includes('SEA')) return <Anchor className="h-4 w-4" />;
     if (mode?.includes('AIR')) return <Plane className="h-4 w-4" />;
     if (mode?.includes('ROAD')) return <Truck className="h-4 w-4" />;
     return <Box className="h-4 w-4" />;
  };

  const getStageStyle = (stage: string) => {
    switch(stage) {
      case 'Intake': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Booking': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Origin': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Transit': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Customs': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Delivery': return 'bg-green-50 text-green-700 border-green-200';
      case 'Finance': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Closed': return 'bg-slate-200 text-slate-800 border-slate-300';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  // Enhanced Stat Card with native Tooltip integration
  const StatCard = ({ title, value, icon: Icon, color, subtext, details }: any) => {
    const CardContentWrapper = (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative h-full flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <div className="flex items-center gap-1.5 mb-1">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
                     {details && details.length > 0 && <Info className="h-3.5 w-3.5 text-blue-400 cursor-help" />}
                 </div>
                 <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
              </div>
              <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100 group-hover:scale-110 transition-transform shrink-0`}>
                 <Icon size={24} className={color.replace('bg-', 'text-')} />
              </div>
           </div>
           {subtext && <div className="text-xs font-medium text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded border border-slate-100 mt-auto self-start">{subtext}</div>}
        </div>
    );

    if (details && details.length > 0) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                        <div className="cursor-help block h-full">
                            {CardContentWrapper}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="w-64 p-3 bg-slate-900 text-slate-100 border-slate-800 shadow-xl rounded-xl z-50">
                        <p className="font-bold text-xs mb-3 text-slate-400 uppercase tracking-wider">Requires Attention</p>
                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                            {details.map((d: any) => (
                                <div key={d.id} className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-2 last:border-0 last:pb-0">
                                    <span className="font-mono text-xs font-bold text-blue-400">{d.ref}</span>
                                    <span className="text-[10px] text-slate-300 flex items-center gap-1.5">
                                        <AlertTriangle size={10} className="text-red-400" /> {d.reason}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return <div className="h-full">{CardContentWrapper}</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans w-full">
      <div className="w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">
                Real-time visibility across <span className="font-bold text-slate-900">{stats.total} active dossiers</span>.
                {stats.exceptions > 0 && <span className="ml-1 text-red-600 font-medium">• {stats.exceptions} require attention</span>}
              </p>
           </div>
           <div className="flex gap-2">
             <button 
                onClick={handleManualRefresh}
                className="bg-white text-slate-600 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
                title="Refresh Data"
             >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
             </button>
             <button 
                onClick={() => setIsNewDialogOpen(true)}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
             >
                <Plus size={16} /> New Booking
             </button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
              title="Active Jobs" 
              value={stats.total} 
              icon={Activity} 
              color="bg-blue-500"
              subtext="Total dossiers in pipe"
           />
           <StatCard 
              title="Booking" 
              value={stats.bookings} 
              icon={Calendar} 
              color="bg-purple-500" 
              subtext="Allocation pending"
           />
           <StatCard 
              title="In Transit" 
              value={stats.inTransit} 
              icon={Truck} 
              color="bg-indigo-500" 
              subtext="Live on water/road"
           />
           <StatCard 
              title="Exceptions" 
              value={stats.exceptions} 
              icon={AlertTriangle} 
              color="bg-red-500" 
              subtext="Blockers detected"
              details={stats.exceptionDetails} // Injects the hover tooltip details here!
           />
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
           
           {/* Left: Shipments Table (3/4 width on large screens) */}
           <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
              {/* Table Toolbar */}
              <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white">
                 <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="flex bg-slate-100/80 p-1 rounded-xl">
                        {['All', 'SEA', 'AIR', 'ROAD'].map((m) => (
                        <button
                            key={m}
                            onClick={() => setFilterMode(m)}
                            className={`
                            px-4 py-2 rounded-lg text-[11px] font-bold transition-all
                            ${filterMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                            `}
                        >
                            {m}
                        </button>
                        ))}
                    </div>
                    <div className="hidden lg:flex items-center gap-2 text-slate-400">
                        <Filter size={14} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Filters</span>
                    </div>
                 </div>
                 
                 <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                       type="text" 
                       placeholder="Search ref, client, carrier, owner..." 
                       className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 outline-none"
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                    />
                 </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto flex-1">
                 <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                       <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reference / Customer</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Route & Schedule</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carrier / Mode</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stage</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Financials</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                       {isLoading ? (
                          <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                              <div className="flex flex-col items-center justify-center gap-2">
                                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                  <span className="text-sm">Fetching logistics data...</span>
                              </div>
                          </td></tr>
                       ) : error ? (
                          <tr><td colSpan={7} className="px-6 py-12 text-center text-red-500">{error}</td></tr>
                       ) : dossiers.length === 0 ? (
                          <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No matching dossiers found.</td></tr>
                       ) : dossiers.map(dossier => (
                          <tr 
                             key={dossier.id} 
                             onClick={() => navigate(`/dossiers/${dossier.id}`)}
                             className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          >
                             <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{dossier.ref}</div>
                                <div className="text-xs text-slate-500 font-medium mt-0.5">{dossier.clientName}</div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                   <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{dossier.pol || 'POL'}</span>
                                   <ArrowRight size={12} className="text-slate-300" />
                                   <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{dossier.pod || 'POD'}</span>
                                </div>
                                <div className="flex gap-3 mt-1.5">
                                    <div className="text-[10px] text-slate-400">
                                        <span className="font-bold">ETD:</span> {dossier.etd ? new Date(dossier.etd).toLocaleDateString() : 'TBD'}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        <span className="font-bold text-blue-500">ETA:</span> {dossier.eta ? new Date(dossier.eta).toLocaleDateString() : 'TBD'}
                                    </div>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-500 border border-slate-100">
                                        {getModeIcon(dossier.mode)}
                                    </div>
                                    <div className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                                        {dossier.carrier || 'Unassigned'}
                                    </div>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <User size={12} />
                                    </div>
                                    <span className="text-xs font-medium text-slate-600 truncate max-w-[100px]">
                                        {dossier.owner || 'System'}
                                    </span>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <Badge variant="secondary" className={`${getStageStyle(dossier.stage)} border px-2 py-0.5 text-[10px] uppercase font-bold`}>
                                   {dossier.stage}
                                </Badge>
                                {dossier.alerts?.some(a => a.type === 'BLOCKER') && (
                                   <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 mt-1.5">
                                      <AlertTriangle size={10} /> Needs Attention
                                   </div>
                                )}
                             </td>
                             <td className="px-6 py-4 text-right">
                                <div className="text-sm font-bold text-slate-900">
                                    {dossier.totalRevenue?.toLocaleString()} <span className="text-[10px] text-slate-400 font-medium">{dossier.currency}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 italic">Live Revenue</div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-3">
                                    <button 
                                        onClick={(e) => handleDelete(e, dossier.id, dossier.ref)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete Dossier"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              {/* Server-Side Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50 mt-auto">
                  <div className="flex items-center gap-2 mb-4 sm:mb-0">
                      <span className="text-xs font-medium text-slate-500">Rows per page:</span>
                      <select 
                          className="h-8 rounded-md border border-slate-200 bg-white text-xs px-2 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          value={pageSize}
                          onChange={(e) => setPageSize(Number(e.target.value))}
                      >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                      </select>
                  </div>
                  
                  <div className="text-xs font-medium text-slate-500 mb-4 sm:mb-0">
                      Showing {(currentPage - 1) * pageSize + (totalRecords > 0 ? 1 : 0)} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords}
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 text-xs" 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                          disabled={currentPage === 1 || isLoading}
                      >
                          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                      </Button>
                      <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 text-xs" 
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalRecords / pageSize), p + 1))} 
                          disabled={currentPage >= Math.ceil(totalRecords / pageSize) || totalRecords === 0 || isLoading}
                      >
                          Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                  </div>
              </div>

           </div>

           {/* Right: Insights & Tasks (1/4 width) */}
           <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Transport Mix</h3>
                 <div className="space-y-4">
                    {[
                        { label: 'Sea Freight', count: stats.sea, color: 'bg-blue-500' },
                        { label: 'Air Freight', count: stats.air, color: 'bg-purple-500' },
                        { label: 'Road/Land', count: stats.road, color: 'bg-orange-500' }
                    ].map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-slate-600">{item.label}</span>
                                <span className="text-slate-900">{item.count}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`${item.color} h-full rounded-full transition-all duration-1000`} 
                                    style={{ width: `${(item.count / (stats.total || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Tasks</h3>
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">3 Immediate</span>
                 </div>
                 <div className="divide-y divide-slate-50">
                    <div className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                       <div className="flex items-start gap-3">
                          <div className="mt-1"><AlertTriangle size={16} className="text-red-500" /></div>
                          <div>
                             <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Submit Manifest Correction</div>
                             <div className="text-xs text-slate-500 mt-1">REF-2024-0899 • Due Today</div>
                          </div>
                       </div>
                    </div>
                    <div className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                       <div className="flex items-start gap-3">
                          <div className="mt-1"><FileText size={16} className="text-orange-500" /></div>
                          <div>
                             <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Approve Supplier Invoice</div>
                             <div className="text-xs text-slate-500 mt-1">REF-2024-0902 • Due Tomorrow</div>
                          </div>
                       </div>
                    </div>
                    <div className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                       <div className="flex items-start gap-3">
                          <div className="mt-1"><CheckCircle2 size={16} className="text-green-500" /></div>
                          <div>
                             <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600">Send Arrival Notice</div>
                             <div className="text-xs text-slate-500 mt-1">REF-2024-0892 • Due Jun 12</div>
                          </div>
                       </div>
                    </div>
                 </div>
                 <button className="w-full py-3 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors border-t border-slate-100">
                    View All Tasks
                 </button>
              </div>

           </div>

        </div>

        <NewDossierDialog 
           isOpen={isNewDialogOpen} 
           onClose={() => setIsNewDialogOpen(false)} 
        />
      </div>
    </div>
  );
}