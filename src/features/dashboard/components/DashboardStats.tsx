import { Briefcase, FileText, Users, Activity, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStatsProps {
  totalRevenue: number;
  activeShipments: number;
  pendingQuotes: number;
  totalClients: number;
  winRate: number;
}

export function DashboardStats({ 
  totalRevenue, 
  activeShipments, 
  pendingQuotes, 
  totalClients,
  winRate
}: DashboardStatsProps) {
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Projected Revenue
          </CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(totalRevenue)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            From active shipments
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active Shipments
          </CardTitle>
          <Briefcase className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeShipments}</div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-emerald-500 font-medium flex items-center">
              <Activity className="h-3 w-3 mr-1" /> Live Operations
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending Quotes
          </CardTitle>
          <FileText className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingQuotes}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {winRate > 0 && (
                <span className="text-blue-600 font-medium">
                  {winRate.toFixed(1)}% Win Rate
                </span>
            )}
            {winRate === 0 && "No closed quotes yet"}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-indigo-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active Clients
          </CardTitle>
          <Users className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalClients}</div>
          <p className="text-xs text-muted-foreground mt-1">
             Customer Directory
          </p>
        </CardContent>
      </Card>
    </div>
  );
}