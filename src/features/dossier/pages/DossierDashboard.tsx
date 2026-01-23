import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Activity, Calendar, Truck, AlertTriangle, 
  Search, ArrowRight, ChevronRight, Plus,
  Anchor, Plane, Box, FileText, CheckCircle2
} from "lucide-react";
import { DossierService } from "@/services/dossier.service";
import { Dossier, ShipmentStage } from "@/types/index";
import { NewDossierDialog } from "../components/dialogs/NewDossierDialog";
import { Badge } from "@/components/ui/badge";

export default function DossierDashboard() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('All');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
       const data = await DossierService.fetchAll();
       setDossiers(data);
       setIsLoading(false);
    };
    loadData();
  }, []);

  // --- Statistics ---
  const totalShipments = dossiers.length;
  const bookings = dossiers.filter(s => s.stage === ShipmentStage.BOOKING).length;
  const inTransit = dossiers.filter(s => s.stage === ShipmentStage.TRANSIT || s.stage === ShipmentStage.ORIGIN).length;
  const exceptions = dossiers.filter(s => s.alerts?.some(a => a.type === 'BLOCKER')).length;

  // --- Filtering ---
  const filteredDossiers = dossiers.filter(s => {
    if (filterMode !== 'All' && s.mode !== filterMode) return false;
    if (searchQuery && !s.clientName.toLowerCase().includes(searchQuery.toLowerCase()) && !s.ref.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
      case 'Transit': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Customs': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Delivery': return 'bg-green-50 text-green-700 border-green-200';
      case 'Finance': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
       <div className="flex justify-between items-start mb-4">
          <div>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</h3>
             <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
          </div>
          <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100 group-hover:scale-110 transition-transform`}>
             <Icon size={24} className={color.replace('bg-', 'text-')} />
          </div>
       </div>
       {subtext && <div className="text-xs font-medium text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded border border-slate-100">{subtext}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Welcome back. You have <span className="font-bold text-slate-900">{exceptions} critical items</span> requiring attention.</p>
           </div>
           <button 
             onClick={() => setIsNewDialogOpen(true)}
             className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
           >
              <Plus size={16} /> New Booking
           </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
              title="Active Jobs" 
              value={totalShipments} 
              icon={Activity} 
              color="bg-blue-500"
              subtext="+12% vs last month"
           />
           <StatCard 
              title="Pending Bookings" 
              value={bookings} 
              icon={Calendar} 
              color="bg-purple-500" 
              subtext="Requires approval"
           />
           <StatCard 
              title="In Transit" 
              value={inTransit} 
              icon={Truck} 
              color="bg-indigo-500" 
              subtext="Active shipments"
           />
           <StatCard 
              title="Exceptions" 
              value={exceptions} 
              icon={AlertTriangle} 
              color="bg-red-500" 
              subtext="Action required"
           />
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Left: Shipments Table (2/3 width) */}
           <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              {/* Table Toolbar */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
                 <div className="flex bg-slate-100/80 p-1 rounded-xl">
                    {['All', 'SEA', 'AIR', 'ROAD'].map((m) => (
                       <button
                         key={m}
                         onClick={() => setFilterMode(m)}
                         className={`
                           px-4 py-2 rounded-lg text-xs font-bold transition-all
                           ${filterMode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                         `}
                       >
                          {m}
                       </button>
                    ))}
                 </div>
                 <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                       type="text" 
                       placeholder="Search ref, client..." 
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
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID / Customer</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Route</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stage</th>
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mode</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                       {isLoading ? (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading data...</td></tr>
                       ) : filteredDossiers.map(file => (
                          <tr 
                             key={file.id} 
                             onClick={() => navigate(`/dossiers/${file.id}`)}
                             className="hover:bg-slate-50 transition-colors cursor-pointer group"
                          >
                             <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{file.ref}</div>
                                <div className="text-xs text-slate-500 font-medium mt-0.5">{file.clientName}</div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                   <span>{file.pol?.substring(0, 3) || 'POL'}</span>
                                   <ArrowRight size={12} className="text-slate-400" />
                                   <span>{file.pod?.substring(0, 3) || 'POD'}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">ETA: {file.eta ? new Date(file.eta).toLocaleDateString() : 'TBD'}</div>
                             </td>
                             <td className="px-6 py-4">
                                <Badge variant="secondary" className={`${getStageStyle(file.stage)} border`}>
                                   {file.stage}
                                </Badge>
                                {file.alerts?.some(a => a.type === 'BLOCKER') && (
                                   <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 mt-1.5">
                                      <AlertTriangle size={10} /> Needs Attention
                                   </div>
                                )}
                             </td>
                             <td className="px-6 py-4">
                                <div className="p-2 bg-slate-50 rounded-lg text-slate-500 inline-block border border-slate-100">
                                   {getModeIcon(file.mode)}
                                </div>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 ml-auto transition-colors" />
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
                 <button className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">View All Shipments</button>
              </div>
           </div>

           {/* Right: Insights & Tasks (1/3 width) */}
           <div className="space-y-6">
              
              {/* Volume Chart (Mock) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Monthly Volume (TEUs)</h3>
                 <div className="flex items-end justify-between h-40 gap-2">
                    {[35, 45, 30, 60, 75, 50].map((h, i) => (
                       <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                          <div 
                            className="w-full bg-slate-100 rounded-t-lg group-hover:bg-blue-500 transition-colors relative" 
                            style={{ height: `${h}%` }}
                          >
                             <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded mb-1 transition-opacity">
                                {h * 12}
                             </div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}</span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Action List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Action Items</h3>
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">3 Urgent</span>
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