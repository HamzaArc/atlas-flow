import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Filter } from "lucide-react";

const MOCK_QUOTES = [
    { id: '1', ref: 'Q-24-9901', client: 'TexNord SARL', route: 'CASABLANCA -> NEW YORK', amount: '12,450 MAD', status: 'DRAFT', date: '2024-11-27' },
    { id: '2', ref: 'Q-24-9902', client: 'Maroc Telecom', route: 'SHANGHAI -> TANGER', amount: '45,200 MAD', status: 'SENT', date: '2024-11-26' },
    { id: '3', ref: 'Q-24-9880', client: 'Renault Tanger', route: 'LE HAVRE -> TANGER', amount: '8,100 MAD', status: 'ACCEPTED', date: '2024-11-20' },
];

// FIXED: Define strict type for navigation
type PageType = 'dashboard' | 'create';

export default function QuoteDashboard({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quote Management</h1>
            <p className="text-slate-500">View, track and approve freight quotes.</p>
        </div>
        <Button onClick={() => onNavigate('create')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> New Quote
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
          <div className="relative flex-1 max-w-sm">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
             <Input className="pl-9 bg-slate-50" placeholder="Search by Ref or Client..." />
          </div>
          <Button variant="outline" size="sm">
             <Filter className="h-4 w-4 mr-2" /> Filter Status
          </Button>
      </div>

      {/* The List */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
            <TableHeader className="bg-slate-50">
                <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Total (MAD)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {MOCK_QUOTES.map((quote) => (
                    <TableRow key={quote.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onNavigate('create')}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            {quote.ref}
                        </TableCell>
                        <TableCell>{quote.client}</TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono">{quote.route}</TableCell>
                        <TableCell className="font-bold text-slate-700">{quote.amount}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={
                                quote.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                quote.status === 'SENT' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                'bg-slate-100 text-slate-600'
                            }>
                                {quote.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500">{quote.date}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">Open</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}