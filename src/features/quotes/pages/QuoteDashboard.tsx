import { useEffect, useState, useMemo } from "react";
import { 
  Search, Filter, MoreHorizontal, 
  FileText, Clock, CheckCircle2, 
  ChevronRight, LayoutGrid, Zap, Gauge,
  ArrowUpDown, Trash2, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useQuoteStore } from "@/store/useQuoteStore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Types matching original
type PageType = 'dashboard' | 'create';
type SortField = 'reference' | 'clientName' | 'validityDate' | 'totalTTCTarget';
type SortOrder = 'asc' | 'desc';

// KPI Component
const KpiCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
    <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
            <Icon className={cn("h-4 w-4", colorClass)} />
        </CardHeader>
        <CardContent>
            <div className={cn("text-2xl font-bold", colorClass?.replace('text-', 'text-'))}>{value}</div>
            <p className="text-xs text-slate-400 mt-1">{subtext}</p>
        </CardContent>
    </Card>
);

export default function QuoteDashboard({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  const { quotes, fetchQuotes, isLoading, createNewQuote, setEditorMode, deleteQuote, loadQuote } = useQuoteStore();
  
  // Local State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>('validityDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchQuotes();
  }, []);

  // --- ACTIONS ---
  const handleQuickEntry = () => {
      createNewQuote();
      setEditorMode('EXPRESS');
      onNavigate('create');
  };

  const handleExpertEntry = () => {
      createNewQuote();
      setEditorMode('EXPERT');
      onNavigate('create');
  };

  const handleEdit = (id: string) => {
      loadQuote(id);
      onNavigate('create');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      await deleteQuote(id);
  };

  const toggleSort = (field: SortField) => {
      if (sortField === field) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
          setSortField(field);
          setSortOrder('desc');
      }
  };

  // --- MEMOIZED LOGIC (No Regression) ---
  
  // 1. Stats Calculation
  const stats = useMemo(() => {
      const total = quotes.length;
      const draft = quotes.filter(q => q.status === 'DRAFT').length;
      const accepted = quotes.filter(q => q.status === 'ACCEPTED').length;
      const validation = quotes.filter(q => q.status === 'VALIDATION').length;
      const pipelineValue = quotes.reduce((acc, curr) => acc + (curr.totalTTCTarget || 0), 0);
      const winRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

      return { total, draft, accepted, validation, pipelineValue, winRate };
  }, [quotes]);

  // 2. Filtering & Sorting
  const filteredQuotes = useMemo(() => {
      // Filter
      let data = quotes.filter(q => {
        const matchesSearch = 
            (q.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (q.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      // Sort
      return data.sort((a, b) => {
          const valA = a[sortField];
          const valB = b[sortField];

          if (sortField === 'validityDate') {
              const dateA = new Date(a.validityDate).getTime();
              const dateB = new Date(b.validityDate).getTime();
              return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
          }
          
          if (typeof valA === 'number' && typeof valB === 'number') {
               return sortOrder === 'asc' ? valA - valB : valB - valA;
          }

          const strA = String(valA || '').toLowerCase();
          const strB = String(valB || '').toLowerCase();

          if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
          if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
      });
  }, [quotes, searchTerm, statusFilter, sortField, sortOrder]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-8 font-sans">
        
        {/* HEADER & ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quote Management</h1>
                <p className="text-slate-500 text-sm">Monitor pipeline, approvals, and conversion rates.</p>
            </div>
            
            <div className="flex items-center gap-3">
                <Button 
                    onClick={handleExpertEntry} 
                    className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm transition-all"
                >
                    <Gauge className="h-4 w-4 mr-2 text-slate-500" />
                    Expert Entry
                </Button>
                
                <Button 
                    onClick={handleQuickEntry} 
                    className="bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 transition-all"
                >
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Quote
                </Button>
            </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard 
                title="Total Pipeline" 
                value={stats.total} 
                subtext="Active quotations" 
                icon={LayoutGrid} 
                colorClass="text-blue-600" 
            />
            <KpiCard 
                title="Pending Approval" 
                value={stats.validation} 
                subtext="Needs validation" 
                icon={FileText} 
                colorClass="text-amber-500" 
            />
             <KpiCard 
                title="Win Ratio" 
                value={`${stats.winRate}%`} 
                subtext="Conversion rate" 
                icon={CheckCircle2} 
                colorClass="text-emerald-600" 
            />
            <Card className="shadow-sm border-slate-200 bg-blue-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-700">Value (Est)</CardTitle>
                    <span className="font-bold text-blue-700">MAD</span>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                        {(stats.pipelineValue / 1000).toFixed(1)}k
                    </div>
                    <p className="text-xs text-blue-600/60 mt-1">Total TTC Volume</p>
                </CardContent>
            </Card>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="relative flex-1 w-full sm:max-w-sm">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                 <Input 
                    placeholder="Search reference or client..." 
                    className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 {searchTerm && (
                     <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                         <X className="h-4 w-4" />
                     </button>
                 )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-white border-slate-200">
                        <Filter className="h-3.5 w-3.5 mr-2 text-slate-500" />
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="VALIDATION">Validation</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                 </Select>
            </div>
        </div>

        {/* QUOTE LIST TABLE */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/80">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[150px] font-bold text-xs uppercase text-slate-500 cursor-pointer" onClick={() => toggleSort('reference')}>
                            <div className="flex items-center gap-1">
                                Reference {sortField === 'reference' && <ArrowUpDown className="h-3 w-3" />}
                            </div>
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-500 cursor-pointer" onClick={() => toggleSort('clientName')}>
                             <div className="flex items-center gap-1">
                                Client {sortField === 'clientName' && <ArrowUpDown className="h-3 w-3" />}
                            </div>
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-500">Route</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-500">Mode</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-500 text-right cursor-pointer" onClick={() => toggleSort('totalTTCTarget')}>
                             <div className="flex items-center justify-end gap-1">
                                Value (TTC) {sortField === 'totalTTCTarget' && <ArrowUpDown className="h-3 w-3" />}
                            </div>
                        </TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-500 text-center">Status</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-slate-500 text-right cursor-pointer" onClick={() => toggleSort('validityDate')}>
                             <div className="flex items-center justify-end gap-1">
                                Valid Until {sortField === 'validityDate' && <ArrowUpDown className="h-3 w-3" />}
                            </div>
                        </TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         <TableRow>
                            <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                    <span>Loading quotes...</span>
                                </div>
                            </TableCell>
                         </TableRow>
                    ) : filteredQuotes.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <FileText className="h-8 w-8 opacity-20" />
                                    <p>No quotes found matching your filters.</p>
                                    <Button variant="link" size="sm" onClick={() => {setSearchTerm(''); setStatusFilter('ALL');}}>Clear Filters</Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredQuotes.map((quote) => (
                            <TableRow key={quote.id} className="group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleEdit(quote.id)}>
                                <TableCell className="font-mono font-medium text-xs text-blue-600">
                                    <div className="flex items-center gap-2">
                                        {quote.reference}
                                        {quote.version > 1 && <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">v{quote.version}</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-xs text-slate-700">{quote.clientName}</div>
                                    <div className="text-[10px] text-slate-400">{quote.salespersonName || 'Unassigned'}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                        <span className="max-w-[80px] truncate font-semibold" title={quote.pol}>{quote.pol?.split('(')[0]}</span>
                                        <ChevronRight className="h-3 w-3 text-slate-300" />
                                        <span className="max-w-[80px] truncate font-semibold" title={quote.pod}>{quote.pod?.split('(')[0]}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] h-5 bg-white border-slate-200 text-slate-600">
                                        {quote.mode}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs font-bold text-slate-700">
                                    {quote.totalTTCTarget?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge className={cn(
                                        "text-[9px] h-5 w-20 justify-center",
                                        quote.status === 'DRAFT' ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200" :
                                        quote.status === 'SENT' ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200" :
                                        quote.status === 'ACCEPTED' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200" :
                                        quote.status === 'VALIDATION' ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200" :
                                        "bg-red-50 text-red-600 border-red-200"
                                    )}>
                                        {quote.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-xs text-slate-500 font-mono">
                                    <div className="flex items-center justify-end gap-1">
                                        <Clock className="h-3 w-3 text-slate-300" />
                                        {format(new Date(quote.validityDate), 'dd MMM yyyy')}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600">
                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(quote.id)}>Edit Quote</DropdownMenuItem>
                                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                            <DropdownMenuItem>Download PDF</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600" onClick={(e) => handleDelete(e, quote.id)}>
                                                <Trash2 className="h-3 w-3 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>
    </div>
  );
}