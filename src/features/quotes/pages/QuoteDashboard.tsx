// src/features/quotes/pages/QuoteDashboard.tsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // Hook
import { 
  Search, Filter, MoreHorizontal, 
  FileText, Clock, CheckCircle2, 
  LayoutGrid, Zap,
  ArrowUpDown, Trash2, X, Loader2,
  Calendar, ArrowUpRight, User,
  MapPin, Plane, Ship, Truck, AlertCircle,
  Layers, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useQuoteStore } from "@/store/useQuoteStore";
import { format, differenceInDays, addDays, isValid } from "date-fns";
import { cn } from "@/lib/utils";

// --- TYPES ---
type SortField = 'reference' | 'clientName' | 'validityDate' | 'totalTTCTarget' | 'probability';
type SortOrder = 'asc' | 'desc';
type TabView = 'ALL' | 'DRAFT' | 'VALIDATION' | 'SENT' | 'ACCEPTED' | 'CONVERTED' | 'EXPIRING' | 'ARCHIVED';

// --- COMPONENTS ---
const KpiCard = ({ title, value, subtext, icon: Icon, colorClass, trend, trendValue, bgClass }: any) => (
    <Card className="shadow-sm border-slate-200 bg-white relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className={cn("absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity", colorClass)}>
            <Icon className="h-24 w-24 transform translate-x-4 -translate-y-4" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</CardTitle>
            <div className={cn("p-2 rounded-full", bgClass)}>
                 <Icon className={cn("h-4 w-4", colorClass)} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                {trend && (
                    <div className={cn("flex items-center text-xs font-medium", trend === 'up' ? "text-emerald-600" : "text-red-600")}>
                        {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowUpRight className="h-3 w-3 mr-0.5 rotate-180" />}
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>
        </CardContent>
    </Card>
);

const ValidityIndicator = ({ date }: { date: Date | string }) => {
    const target = new Date(date);
    const today = new Date();
    const daysLeft = differenceInDays(target, today);
    const totalDuration = 30; 
    const progress = Math.max(0, Math.min(100, (daysLeft / totalDuration) * 100));
    
    let color = "bg-emerald-500";
    let textColor = "text-slate-500";
    let text = `${daysLeft} days`;
    
    if (daysLeft < 0) {
        color = "bg-slate-300";
        textColor = "text-slate-400";
        text = "Expired";
    } else if (daysLeft <= 3) {
        color = "bg-red-500";
        textColor = "text-red-600 font-bold";
        text = `${daysLeft} days left`;
    } else if (daysLeft <= 7) {
        color = "bg-amber-500";
        textColor = "text-amber-600";
        text = `${daysLeft} days`;
    }

    return (
        <div className="w-[90px] flex flex-col gap-1.5">
             <div className="flex justify-between items-center text-[10px] leading-none">
                <span className="text-slate-400 font-medium">Valid</span>
                <span className={cn(textColor)}>{text}</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-slate-100" indicatorClassName={color} />
        </div>
    );
};

const ModeIcon = ({ mode }: { mode: string | undefined }) => {
    switch(mode) {
        case 'AIR': return <Plane className="h-3.5 w-3.5 text-sky-500" />;
        case 'SEA_FCL':
        case 'SEA_LCL': return <Ship className="h-3.5 w-3.5 text-blue-600" />;
        case 'ROAD': return <Truck className="h-3.5 w-3.5 text-amber-600" />;
        default: return <MapPin className="h-3.5 w-3.5 text-slate-400" />;
    }
};

export default function QuoteDashboard() {
  const navigate = useNavigate(); // Hook integration
  const { quotes, fetchQuotes, isLoading, createNewQuote, setEditorMode, deleteQuote, loadQuote } = useQuoteStore();
  
  // Local State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState<TabView>("ALL");
  const [sortField, setSortField] = useState<SortField>('validityDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchQuotes();
  }, []);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [currentTab, searchTerm, sortField, sortOrder, pageSize]);

  const handleQuickEntry = () => {
      createNewQuote();
      setEditorMode('EXPRESS');
      navigate('/quotes/create'); // Router nav
  };

  const handleEdit = (id: string) => {
      loadQuote(id);
      navigate(`/quotes/${id}`); // Router nav
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(confirm("Are you sure you want to delete this quote?")) {
          await deleteQuote(id);
      }
  };

  const toggleSort = (field: SortField) => {
      if (sortField === field) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
          setSortField(field);
          setSortOrder('desc');
      }
  };

  const stats = useMemo(() => {
      const total = quotes.length;
      const draft = quotes.filter(q => q.status === 'DRAFT').length;
      const sent = quotes.filter(q => q.status === 'SENT').length;
      const accepted = quotes.filter(q => q.status === 'ACCEPTED').length;
      const converted = quotes.filter(q => q.status === 'CONVERTED').length;
      const validation = quotes.filter(q => q.status === 'VALIDATION').length;
      
      const getQuoteValue = (quote: any) => {
        if (quote.totalTTCTarget && quote.totalTTCTarget > 0) return quote.totalTTCTarget;
        const activeOption = quote.options?.find((o: any) => o.id === quote.activeOptionId) || quote.options?.[0];
        return activeOption?.totalTTC || 0;
      };

      const totalValue = quotes.reduce((acc, curr) => acc + getQuoteValue(curr), 0);
      const pipelineValue = quotes
          .filter(q => ['DRAFT', 'VALIDATION', 'SENT'].includes(q.status))
          .reduce((acc, curr) => acc + getQuoteValue(curr), 0);
          
      const winRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
      
      const nextWeek = addDays(new Date(), 7);
      const expiringSoon = quotes.filter(q => {
          const vDate = new Date(q.validityDate);
          return vDate > new Date() && vDate <= nextWeek && !['ACCEPTED', 'REJECTED', 'CONVERTED'].includes(q.status);
      }).length;

      return { total, draft, sent, accepted, converted, validation, pipelineValue, totalValue, winRate, expiringSoon };
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
      let data = quotes;

      // Filter handling
      if (currentTab === 'ALL') {
          // Exclude converted strictly from all tabs except CONVERTED tab itself
          data = data.filter(q => q.status !== 'CONVERTED');
      } else if (currentTab === 'ARCHIVED') {
          data = data.filter(q => ['ACCEPTED', 'REJECTED'].includes(q.status) && q.status !== 'CONVERTED');
      } else if (currentTab === 'EXPIRING') {
          const nextWeek = addDays(new Date(), 7);
          data = data.filter(q => {
              const vDate = new Date(q.validityDate);
              return vDate > new Date() && vDate <= nextWeek && !['ACCEPTED', 'REJECTED', 'CONVERTED'].includes(q.status);
          });
      } else if (currentTab === 'CONVERTED') {
          data = data.filter(q => q.status === 'CONVERTED');
      } else {
          data = data.filter(q => q.status === currentTab);
      }

      // Search handling
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          data = data.filter(q => 
            (q.reference || '').toLowerCase().includes(lower) ||
            (q.clientName || '').toLowerCase().includes(lower) ||
            (q.salespersonName || '').toLowerCase().includes(lower)
          );
      }

      // Sorting
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
  }, [quotes, searchTerm, currentTab, sortField, sortOrder]);

  const paginatedQuotes = useMemo(() => {
    return filteredQuotes.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredQuotes, currentPage, pageSize]);

  const renderTableBody = () => {
    if (isLoading) {
        return (
            <TableRow>
                <TableCell colSpan={12} className="h-48 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="text-sm">Fetching latest opportunities...</span>
                    </div>
                </TableCell>
            </TableRow>
        );
    }

    if (paginatedQuotes.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={12} className="h-48 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-3 bg-slate-50 rounded-full">
                            <Filter className="h-6 w-6 text-slate-300" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-600">No quotes found.</p>
                            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters.</p>
                        </div>
                    </div>
                </TableCell>
            </TableRow>
        );
    }

    return paginatedQuotes.map((quote: any) => {
        const activeOption = quote.options?.find((o: any) => o.id === quote.activeOptionId) || quote.options?.[0];
        const optionsCount = quote.options?.length || 0;
        
        const displayMode = quote.mode || activeOption?.mode || 'N/A';
        const displayIncoterm = quote.incoterm || activeOption?.incoterm || 'N/A';
        const displayPOL = quote.pol || activeOption?.pol || '---';
        const displayPOD = quote.pod || activeOption?.pod || '---';
        const ttc = quote.totalTTCTarget || activeOption?.totalTTC || 0;
        
        const reqDepDate = quote.requestedDepartureDate 
            ? new Date(quote.requestedDepartureDate) 
            : null;
        
        const targetEta = quote.estimatedArrivalDate
            ? new Date(quote.estimatedArrivalDate)
            : null;
            
        const estTransit = quote.transitTime || activeOption?.transitTime || '--';
        const displayFreeTime = quote.freeTime || activeOption?.freeTime || '--';

        return (
            <TableRow 
                key={quote.id} 
                className="group hover:bg-blue-50/30 transition-colors cursor-pointer border-b border-slate-100" 
                onClick={() => handleEdit(quote.id)}
            >
                <TableCell className="pl-6 align-top py-4 w-[160px]">
                    <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-2 font-mono font-bold text-xs text-blue-700">
                            {quote.reference}
                        </div>
                        <Badge className={cn(
                            "w-fit text-[9px] h-4 px-1 rounded-sm border font-semibold",
                            quote.status === 'DRAFT' ? "bg-slate-100 text-slate-500 border-slate-200" :
                            quote.status === 'SENT' ? "bg-blue-50 text-blue-600 border-blue-100" :
                            quote.status === 'ACCEPTED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            quote.status === 'CONVERTED' ? "bg-purple-100 text-purple-700 border-purple-200" :
                            quote.status === 'VALIDATION' ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-red-50 text-red-600 border-red-100"
                        )}>
                            {quote.status}
                        </Badge>
                        {quote.version > 1 && (
                            <Badge className="w-fit text-[10px] h-5 px-1.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold mt-1 shadow-sm">
                                v{quote.version}
                            </Badge>
                        )}
                    </div>
                </TableCell>
                
                <TableCell className="align-top py-4 w-[200px]">
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 border border-slate-100 bg-white shadow-sm mt-1">
                            <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-600 font-bold">
                                {quote.clientName.substring(0,2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-bold text-xs text-slate-800 line-clamp-1">{quote.clientName}</div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                                <User className="h-3 w-3" />
                                {quote.salespersonName || 'Unassigned'}
                            </div>
                        </div>
                    </div>
                </TableCell>

                <TableCell className="align-top py-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-700">
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Origin
                                </span>
                                <span className="font-semibold" title={displayPOL}>{displayPOL.split('(')[0]}</span>
                            </div>
                            
                            <div className="flex items-center px-2 pt-3">
                                <div className="h-px w-6 bg-slate-300"></div>
                                <div className="p-1 rounded-full bg-slate-100 border border-slate-200 -ml-3 z-10">
                                    <ModeIcon mode={displayMode} />
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Dest
                                </span>
                                <span className="font-semibold" title={displayPOD}>{displayPOD.split('(')[0]}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="text-[9px] h-4 bg-slate-50 text-slate-600 border-slate-200">
                                {displayMode}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] h-4 bg-slate-50 text-slate-600 border-slate-200">
                                {displayIncoterm}
                            </Badge>
                        </div>
                    </div>
                </TableCell>

                <TableCell className="align-top py-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Req. Departure</span>
                        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {reqDepDate && isValid(reqDepDate) ? format(reqDepDate, 'dd MMM yyyy') : <span className="text-slate-400">--</span>}
                        </div>
                    </div>
                </TableCell>
                
                {/* 3 New Columns */}
                <TableCell className="align-top py-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Target ETA</span>
                        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {targetEta && isValid(targetEta) ? format(targetEta, 'dd MMM yyyy') : <span className="text-slate-400">--</span>}
                        </div>
                    </div>
                </TableCell>
                
                <TableCell className="align-top py-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Transit</span>
                        <div className="text-xs font-semibold text-slate-700">
                            {estTransit} {estTransit !== '--' ? 'Days' : ''}
                        </div>
                    </div>
                </TableCell>
                
                <TableCell className="align-top py-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Free Time</span>
                        <div className="text-xs font-semibold text-slate-700">
                            {displayFreeTime} {displayFreeTime !== '--' ? 'Days' : ''}
                        </div>
                    </div>
                </TableCell>

                 <TableCell className="align-top py-4">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Options</span>
                        <Badge variant="secondary" className="w-fit bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 gap-1.5 h-6">
                            <Layers className="h-3 w-3" />
                            {optionsCount} {optionsCount === 1 ? 'Option' : 'Options'}
                        </Badge>
                    </div>
                </TableCell>

                <TableCell className="align-top py-4 text-right">
                    <div className="font-mono text-sm font-bold text-slate-800">
                        {ttc.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">MAD</span>
                    </div>
                </TableCell>

                <TableCell className="align-top py-4">
                    <ValidityIndicator date={quote.validityDate} />
                </TableCell>

                <TableCell className="align-middle text-right pr-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(quote.id)} className="cursor-pointer">
                                <FileText className="h-4 w-4 mr-2" /> Open Quote
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <Zap className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 cursor-pointer focus:bg-red-50" onClick={(e) => handleDelete(e, quote.id)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Quote
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
        );
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50/50 p-6 space-y-8 font-sans">
        
        {/* HEADER & ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quote Dashboard</h1>
                <p className="text-slate-500 text-sm font-medium">Welcome back. You have <span className="text-blue-600 font-bold">{stats.validation} quotes</span> pending approval.</p>
            </div>
            
            <div className="flex items-center gap-3">
                <Button 
                    onClick={handleQuickEntry} 
                    className="bg-slate-900 text-white hover:bg-slate-700 shadow-lg shadow-indigo-200/50 transition-all h-10 px-3 font-semibold"
                >
                    <Zap className="h-4 w-4 mr-2 fill-current" />
                    Create Quote
                </Button>
            </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard 
                title="Active Pipeline" 
                value={stats.pipelineValue > 1000000 ? `${(stats.pipelineValue / 1000000).toFixed(2)}M` : `${(stats.pipelineValue / 1000).toFixed(0)}k`} 
                subtext={`${stats.draft + stats.validation + stats.sent} active deals`} 
                icon={LayoutGrid} 
                colorClass="text-blue-600"
                bgClass="bg-blue-50"
                trend="up"
                trendValue="+12%"
            />
            <KpiCard 
                title="Pending Approval" 
                value={stats.validation} 
                subtext="Requires manager review" 
                icon={FileText} 
                colorClass="text-amber-500"
                bgClass="bg-amber-50" 
                trend={stats.validation > 3 ? "down" : "up"}
                trendValue="Action Needed"
            />
            <KpiCard 
                title="Expiring Soon" 
                value={stats.expiringSoon} 
                subtext="Within next 7 days" 
                icon={Clock} 
                colorClass="text-red-500"
                bgClass="bg-red-50"
                trend="down"
                trendValue="Critical"
            />
             <KpiCard 
                title="Win Ratio" 
                value={`${stats.winRate}%`} 
                subtext="Trailing 30 days" 
                icon={CheckCircle2} 
                colorClass="text-emerald-600"
                bgClass="bg-emerald-50"
                trend="up"
                trendValue="+2.4%"
            />
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            
            <Tabs defaultValue="ALL" onValueChange={(v) => setCurrentTab(v as TabView)} className="w-full">
                
                {/* TOOLBAR */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
                    <TabsList className="bg-slate-100 p-1 rounded-lg h-9 overflow-x-auto flex-nowrap shrink-0">
                        <TabsTrigger value="ALL" className="text-xs h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">All Quotes</TabsTrigger>
                        <TabsTrigger value="DRAFT" className="text-xs h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">Drafts</TabsTrigger>
                        <TabsTrigger value="VALIDATION" className="text-xs h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
                            In Review
                            {stats.validation > 0 && <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-600">{stats.validation}</span>}
                        </TabsTrigger>
                        <TabsTrigger value="SENT" className="text-xs h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">Sent</TabsTrigger>
                        
                        {/* New Dedicated Converted Tab */}
                        <TabsTrigger value="CONVERTED" className="text-xs h-7 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 data-[state=active]:shadow-sm px-3">
                            Converted
                            {stats.converted > 0 && <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-200 text-[9px] font-bold text-purple-700">{stats.converted}</span>}
                        </TabsTrigger>
                        
                        <TabsTrigger value="EXPIRING" className="text-xs h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">
                            <span className="flex items-center gap-1.5">
                                Expiring
                                {stats.expiringSoon > 0 && <AlertCircle className="h-3 w-3 text-red-500" />}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="ARCHIVED" className="text-xs h-7 data-[state=active]:bg-white data-[state=active]:shadow-sm px-3">History (Won/Lost)</TabsTrigger>
                    </TabsList>

                    <div className="relative w-full sm:max-w-xs shrink-0">
                         <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                         <Input 
                            placeholder="Filter by ref, client or rep..." 
                            className="pl-9 bg-white border-slate-200 h-9 text-xs focus:ring-blue-100 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                         {searchTerm && (
                             <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                 <X className="h-4 w-4" />
                             </button>
                         )}
                    </div>
                </div>

                {/* TABLE */}
                <TabsContent value={currentTab} className="m-0 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[160px] font-bold text-[11px] uppercase text-slate-500 cursor-pointer pl-6 h-10" onClick={() => toggleSort('reference')}>
                                    <div className="flex items-center gap-1">Reference {sortField === 'reference' && <ArrowUpDown className="h-3 w-3" />}</div>
                                </TableHead>
                                <TableHead className="w-[200px] font-bold text-[11px] uppercase text-slate-500 cursor-pointer h-10" onClick={() => toggleSort('clientName')}>
                                     <div className="flex items-center gap-1">Customer & Rep {sortField === 'clientName' && <ArrowUpDown className="h-3 w-3" />}</div>
                                </TableHead>
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500 h-10">Route Details</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500 h-10">Req. Dep</TableHead>
                                
                                {/* 3 New Grid Columns Added here */}
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500 h-10 whitespace-nowrap">Target ETA</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500 h-10 whitespace-nowrap">Est. Transit (Days)</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500 h-10 whitespace-nowrap">Free Time (Days)</TableHead>
                                
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500 h-10">Options</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500 text-right cursor-pointer h-10" onClick={() => toggleSort('totalTTCTarget')}>
                                     <div className="flex items-center justify-end gap-1">Value (TTC) {sortField === 'totalTTCTarget' && <ArrowUpDown className="h-3 w-3" />}</div>
                                </TableHead>
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500 h-10 pl-4">Validity</TableHead>
                                <TableHead className="w-[50px] h-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {renderTableBody()}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>
            
            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50 mt-auto">
                <div className="flex items-center gap-2 mb-4 sm:mb-0">
                    <span className="text-xs font-medium text-slate-500">Rows per page:</span>
                    <select 
                        className="h-8 rounded-md border border-slate-200 bg-white text-xs px-2 outline-none focus:ring-1 focus:ring-blue-500"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                
                <div className="text-xs font-medium text-slate-500 mb-4 sm:mb-0">
                    Showing {(currentPage - 1) * pageSize + (filteredQuotes.length > 0 ? 1 : 0)} to {Math.min(currentPage * pageSize, filteredQuotes.length)} of {filteredQuotes.length}
                </div>
                
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 text-xs" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 text-xs" 
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredQuotes.length / pageSize), p + 1))} 
                        disabled={currentPage >= Math.ceil(filteredQuotes.length / pageSize) || filteredQuotes.length === 0}
                    >
                        Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                </div>
            </div>
            
        </div>
    </div>
  );
}