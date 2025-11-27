import { useEffect, useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Filter, Trash2, Loader2, X } from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";

type PageType = 'dashboard' | 'create';

export default function QuoteDashboard({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  const { quotes, createNewQuote, loadQuote, deleteQuote, fetchQuotes, isLoading } = useQuoteStore();
  
  // --- LOCAL STATE FOR SEARCH ---
  const [searchTerm, setSearchTerm] = useState("");

  // Load Data on Mount
  useEffect(() => { fetchQuotes(); }, []);

  // --- FILTER LOGIC ---
  const filteredQuotes = quotes.filter(q => 
    q.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => { createNewQuote(); onNavigate('create'); };
  
  const handleOpenQuote = (id: string) => { loadQuote(id); onNavigate('create'); };
  
  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      await deleteQuote(id);
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
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quote Management</h1>
            <p className="text-slate-500">View, track and approve freight quotes.</p>
        </div>
        <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> New Quote
        </Button>
      </div>

      {/* Toolbar with Working Search */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
          <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
             <Input 
                className="pl-9 bg-slate-50" 
                placeholder="Search by Ref or Client..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
             {searchTerm && (
                 <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                     <X className="h-4 w-4" />
                 </button>
             )}
          </div>
          <Button variant="outline" size="sm">
             <Filter className="h-4 w-4 mr-2" /> Filter Status
          </Button>
      </div>

      {/* The List (Filtered) */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredQuotes.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                            {searchTerm ? "No results found for your search." : "No quotes found. Create your first one!"}
                        </TableCell>
                    </TableRow>
                )}

                {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleOpenQuote(quote.id)}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            {quote.reference}
                        </TableCell>
                        <TableCell>{quote.clientName}</TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono">
                            {quote.pol} <span className="text-slate-300">→</span> {quote.pod}
                        </TableCell>
                        <TableCell className="text-slate-500">
                           {new Date(quote.validityDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={
                                quote.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                quote.status === 'SENT' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                'bg-slate-100 text-slate-600'
                            }>
                                {quote.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-800"
                                onClick={(e) => { e.stopPropagation(); handleOpenQuote(quote.id); }}
                            >
                                Open
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-400 hover:text-red-600"
                                onClick={(e) => handleDelete(e, quote.id)}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}