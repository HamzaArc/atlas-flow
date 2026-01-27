import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote, Dossier } from "@/types/index";
import { useNavigate } from "react-router-dom";

interface RecentTransactionsProps {
  recentQuotes: Quote[];
  recentDossiers: Dossier[];
}

export function RecentTransactions({ recentQuotes, recentDossiers }: RecentTransactionsProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'ACCEPTED': case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
          case 'SENT': case 'ON_WATER': return 'bg-blue-100 text-blue-800';
          case 'DRAFT': case 'BOOKED': return 'bg-slate-100 text-slate-800';
          case 'REJECTED': case 'CANCELLED': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Quotes */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Quotes</CardTitle>
            <Badge variant="outline" className="cursor-pointer" onClick={() => navigate('/quotes')}>View All</Badge>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentQuotes.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No recent quotes found</TableCell>
                        </TableRow>
                    ) : (
                        recentQuotes.slice(0, 5).map((quote) => (
                            <TableRow 
                                key={quote.id} 
                                className="cursor-pointer hover:bg-slate-50"
                                onClick={() => navigate(`/quotes/${quote.id}`)}
                            >
                                <TableCell className="font-medium">{quote.reference}</TableCell>
                                <TableCell className="truncate max-w-[120px]">{quote.clientName || 'Unknown'}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(quote.status)} variant="secondary">
                                        {quote.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Recent Shipments */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Active Shipments</CardTitle>
            <Badge variant="outline" className="cursor-pointer" onClick={() => navigate('/dossiers')}>View All</Badge>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ref</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentDossiers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No active shipments</TableCell>
                        </TableRow>
                    ) : (
                        recentDossiers.slice(0, 5).map((dossier) => (
                            <TableRow 
                                key={dossier.id} 
                                className="cursor-pointer hover:bg-slate-50"
                                onClick={() => navigate(`/dossiers/${dossier.id}`)}
                            >
                                <TableCell className="font-medium">{dossier.ref}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {dossier.pol} → {dossier.pod}
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(dossier.status)} variant="secondary">
                                        {dossier.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}