import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle } from "lucide-react";

const MOCK_FINANCIALS = [
    { id: '1', item: 'Ocean Freight', vendor: 'CMA CGM', est: 1200, actual: 1250, currency: 'USD', status: 'BILLED' },
    { id: '2', item: 'THC Origin', vendor: 'Marsa Maroc', est: 1500, actual: 1500, currency: 'MAD', status: 'PENDING' },
    { id: '3', item: 'Trucking', vendor: 'Tanger Transport', est: 3000, actual: 0, currency: 'MAD', status: 'MISSING_INVOICE' },
];

export function ProfitLossTable() {
  return (
    <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                <div className="text-xs text-green-600 uppercase font-semibold">Total Revenue</div>
                <div className="text-2xl font-bold text-green-700">18,450 MAD</div>
            </div>
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="text-xs text-red-600 uppercase font-semibold">Total Cost (Est)</div>
                <div className="text-2xl font-bold text-red-700">14,200 MAD</div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="text-xs text-blue-600 uppercase font-semibold">Est Margin</div>
                <div className="text-2xl font-bold text-blue-700">+ 4,250 MAD</div>
            </div>
        </div>

        {/* The Comparison Grid */}
        <div className="rounded-md border bg-white">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-slate-700">Cost Reconciliation</h3>
                <Button size="sm" variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Add Cost</Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Charge Item</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead className="text-right">Estimated</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-center">Variance</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {MOCK_FINANCIALS.map((row) => {
                        const variance = row.actual > 0 ? row.actual - row.est : 0;
                        return (
                            <TableRow key={row.id}>
                                <TableCell className="font-medium">{row.item}</TableCell>
                                <TableCell>{row.vendor}</TableCell>
                                <TableCell className="text-right">{row.est} {row.currency}</TableCell>
                                <TableCell className="text-right text-slate-500">
                                    {row.actual > 0 ? `${row.actual} ${row.currency}` : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    {variance > 0 ? (
                                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                            +{variance}
                                        </Badge>
                                    ) : variance < 0 ? (
                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                            {variance}
                                        </Badge>
                                    ) : (
                                        <span className="text-slate-300">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {row.status === 'MISSING_INVOICE' ? (
                                        <div className="flex items-center text-yellow-600 text-xs font-medium">
                                            <AlertTriangle className="h-3 w-3 mr-1" /> Missing Bill
                                        </div>
                                    ) : (
                                        <Badge variant="secondary" className="text-xs">{row.status}</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}