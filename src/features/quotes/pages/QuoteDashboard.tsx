import { useEffect, useState, useMemo } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Plus, Search, FileText, Filter, Trash2, Loader2, X, 
    ArrowUpDown, TrendingUp, CheckCircle2, Clock, History
} from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { Quote } from "@/types/index";

type PageType = 'dashboard' | 'create';
type SortField = 'reference' | 'clientName' | 'validityDate';
type SortOrder = 'asc' | 'desc';

export default function QuoteDashboard({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  const { quotes, createNewQuote, loadQuote, deleteQuote, fetchQuotes, isLoading } = useQuoteStore();
  
  // --- LOCAL STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>('validityDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Load Data on Mount
  useEffect(() => { fetchQuotes(); }, []);

  // --- DERIVED STATS (Fully Typed) ---
  const stats = useMemo(() => {
      const total = quotes.length;
      const draft = quotes.filter(q => q.status === 'DRAFT').length;
      const accepted = quotes.filter(q => q.status === 'ACCEPTED').length;
      // Using the strictly typed totalTTC from the mapped Quote object
      // Logic fix: Only count LATEST versions for pipeline value to avoid double counting history
      // For now, we sum all, but in V2 we should filter by isLatest.
      const pipelineValue = quotes.reduce((acc, curr) => acc + (curr.totalTTC || 0), 0);

      return { total, draft, accepted, pipelineValue };
  }, [quotes]);

  // --- FILTER & SORT LOGIC ---
  const filteredQuotes = useMemo(() => {
      const data = quotes.filter(q => {
        const matchesSearch = 
            (q.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (q.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      return data.sort((a, b) => {
          const valA = a[sortField];
          const valB = b[sortField];

          if (sortField === 'validityDate') {
              const dateA = valA ? new Date(valA as string | Date).getTime() : 0;
              const dateB = valB ? new Date(valB as string | Date).getTime() : 0;
              return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
          }

          const strA = String(valA || '').toLowerCase();
          const strB = String(valB || '').toLowerCase();

          if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
          if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
      });
  }, [quotes, searchTerm, statusFilter, sortField, sortOrder]);

  const handleCreateNew = () => { createNewQuote(); onNavigate('create'); };
  const handleOpenQuote = (id: string) => { loadQuote(id); onNavigate('create'); };
  
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

  const getStatusBadgeStyles = (status: string) => {
      switch (status) {
          case 'ACCEPTED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
          case 'SENT': return 'bg-blue-50 text-blue-700 border-blue-200';
          case 'REJECTED': return 'bg-red-50 text-red-700 border-red-200';
          case 'DRAFT': return 'bg-slate-100 text-slate-600 border-slate-200';
          case 'VALIDATION': return 'bg-purple-50 text-purple-700 border-purple-200';
          default: return 'bg-slate-50 text-slate-600 border-slate-200';
      }
  };

  if (isLoading && quotes.length === 0) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm font-medium text-slate-500">Syncing with Atlas Cloud...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      
      {/* 1. Header Section */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quote Management</h1>
            <p className="text-slate-500 mt-1">Manage freight tenders, pricing, and client approvals.</p>
        </div>
        <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 transition-all">
            <Plus className="h-4 w-4 mr-2" /> Create Quote
        </Button>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-slate-400 mt-1">Active quotations</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-slate-400 mt-1">Pending validation</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Win Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
                {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-slate-400 mt-1">Conversion ratio</p>
          </CardContent>
        </Card>
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

      {/* 3. Toolbar (Search & Filter) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 w-full sm:max-w-sm">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
             <Input 
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all" 
                placeholder="Search references or clients..." 
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

      {/* 4. Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
            <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[180px] cursor-pointer" onClick={() => toggleSort('reference')}>
                        <div className="flex items-center gap-2">
                            Reference 
                            {sortField === 'reference' && <ArrowUpDown className="h-3 w-3" />}
                        </div>
                    </TableHead>
                    <TableHead className="w-[80px]">Ver.</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('clientName')}>
                        <div className="flex items-center gap-2">
                            Client 
                            {sortField === 'clientName' && <ArrowUpDown className="h-3 w-3" />}
                        </div>
                    </TableHead>
                    <TableHead>Route (POL → POD)</TableHead>
                    <TableHead className="w-[150px] cursor-pointer" onClick={() => toggleSort('validityDate')}>
                        <div className="flex items-center gap-2">
                            Validity
                            {sortField === 'validityDate' && <ArrowUpDown className="h-3 w-3" />}
                        </div>
                    </TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="text-right w-[100px]">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredQuotes.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                <FileText className="h-10 w-10 opacity-20" />
                                <p className="font-medium text-slate-900">No quotes found</p>
                                <p className="text-xs">Try adjusting your filters or create a new one.</p>
                                <Button variant="link" onClick={() => {setSearchTerm(''); setStatusFilter('ALL');}}>Clear Filters</Button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}

                {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id} className="hover:bg-slate-50/80 cursor-pointer group transition-colors" onClick={() => handleOpenQuote(quote.id)}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <span className="text-slate-700 font-bold text-sm">{quote.reference}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center">
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-100 text-slate-600 border-slate-200">
                                    v{quote.version}
                                </Badge>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className="font-medium text-slate-700">{quote.clientName || "—"}</span>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                                    {quote.pol?.split('(')[0].trim().substring(0, 3).toUpperCase() || "???"}
                                </span>
                                <ArrowUpDown className="h-3 w-3 rotate-90 text-slate-300" />
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                                    {quote.pod?.split('(')[0].trim().substring(0, 3).toUpperCase() || "???"}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2 text-xs text-slate-500">
                               <Clock className="h-3 w-3" />
                               {new Date(quote.validityDate).toLocaleDateString()}
                           </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={`font-semibold ${getStatusBadgeStyles(quote.status)}`}>
                                {quote.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={(e) => handleDelete(e, quote.id)}
                                >
                                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}