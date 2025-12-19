import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";

const KPI_DATA = [
  {
    label: "Active Lanes",
    value: "248",
    helper: "+18 new this quarter",
    tone: "text-emerald-600",
  },
  {
    label: "Contract Coverage",
    value: "82%",
    helper: "16 lanes uncovered",
    tone: "text-blue-600",
  },
  {
    label: "Avg Variance vs Market",
    value: "-6.3%",
    helper: "Savings above benchmark",
    tone: "text-emerald-600",
  },
  {
    label: "Rates Expiring <30d",
    value: "12",
    helper: "Review expiring offers",
    tone: "text-amber-600",
  },
];

const TARIFF_LIBRARY = [
  {
    id: "TL-SEA-044",
    lane: "Shanghai → Casablanca",
    mode: "Ocean FCL 40'",
    carrier: "MAERSK",
    buyRate: 1850,
    currency: "USD",
    margin: "18%",
    benchmark: "-4%",
    validity: "Nov 30, 2024",
    status: "On Track",
  },
  {
    id: "TL-AIR-109",
    lane: "Paris → Rabat",
    mode: "Air 500 kg",
    carrier: "Air France",
    buyRate: 3.8,
    currency: "EUR/kg",
    margin: "12%",
    benchmark: "+2%",
    validity: "Oct 12, 2024",
    status: "Review",
  },
  {
    id: "TL-ROAD-078",
    lane: "Tanger → Casablanca",
    mode: "Road FTL",
    carrier: "CTM Freight",
    buyRate: 5200,
    currency: "MAD",
    margin: "21%",
    benchmark: "-7%",
    validity: "Dec 22, 2024",
    status: "On Track",
  },
  {
    id: "TL-SEA-092",
    lane: "Savannah → Tanger",
    mode: "Ocean LCL",
    carrier: "MSC",
    buyRate: 72,
    currency: "USD/CBM",
    margin: "9%",
    benchmark: "+5%",
    validity: "Sep 28, 2024",
    status: "Action",
  },
  {
    id: "TL-AIR-033",
    lane: "Istanbul → Casablanca",
    mode: "Air 1000 kg",
    carrier: "Turkish Cargo",
    buyRate: 2.95,
    currency: "USD/kg",
    margin: "16%",
    benchmark: "-1%",
    validity: "Jan 15, 2025",
    status: "On Track",
  },
];

const INTELLIGENCE_FEED = [
  {
    title: "Ocean Asia lanes trending down",
    detail: "Market spot rates softened 5.2% in the last 14 days. Consider re-bidding TL-SEA-044.",
    trend: "down",
  },
  {
    title: "Air export capacity tightening",
    detail: "Limited belly space ex-CDG. Recommend margin buffer +3% on urgent lanes.",
    trend: "up",
  },
  {
    title: "Road carrier compliance risk",
    detail: "CTM Freight OTIF dropped below 92%. Escalate or source a secondary carrier.",
    trend: "alert",
  },
];

const OPPORTUNITY_LIST = [
  {
    label: "Consolidate Paris → Rabat air",
    savings: "-2.4%",
    note: "Route via MAD hub",
  },
  {
    label: "Bundle Tanger → Casablanca FTL",
    savings: "-5.1%",
    note: "Lock 3-month volume",
  },
  {
    label: "Negotiate MSC LCL base",
    savings: "-3.2%",
    note: "Leverage Q4 forecast",
  },
];

const coverageValue = 82;

export default function TariffDashboard() {
  return (
    <div className="p-8 h-full bg-slate-50 overflow-auto">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Tariff Library & Rate Intelligence
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Centralize carrier tariffs, benchmark performance, and surface rate opportunities.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white border-slate-200 text-slate-700">
              <Download className="h-4 w-4 mr-2" /> Export Library
            </Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800">
              <Upload className="h-4 w-4 mr-2" /> Upload Tariffs
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {KPI_DATA.map((kpi) => (
            <Card key={kpi.label} className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className={`text-2xl font-bold ${kpi.tone}`}>{kpi.value}</div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{kpi.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm border-slate-200 bg-white flex flex-col">
            <CardHeader className="border-b border-slate-100 p-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-700">Tariff Library</CardTitle>
                <p className="text-xs text-slate-400 mt-1">Rates synchronized across carrier contracts.</p>
              </div>
              <Button variant="outline" className="text-xs border-slate-200">
                <Target className="h-3.5 w-3.5 mr-1" /> Run Benchmark
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs">Lane</TableHead>
                    <TableHead className="text-xs">Mode</TableHead>
                    <TableHead className="text-xs">Carrier</TableHead>
                    <TableHead className="text-xs text-right">Buy Rate</TableHead>
                    <TableHead className="text-xs text-right">Margin</TableHead>
                    <TableHead className="text-xs text-right">Benchmark</TableHead>
                    <TableHead className="text-xs">Validity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TARIFF_LIBRARY.map((tariff) => (
                    <TableRow key={tariff.id}>
                      <TableCell>
                        <div className="font-semibold text-slate-800 text-xs">{tariff.lane}</div>
                        <div className="text-[10px] text-slate-400">{tariff.id}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{tariff.mode}</TableCell>
                      <TableCell className="text-xs text-slate-600">{tariff.carrier}</TableCell>
                      <TableCell className="text-xs text-right text-slate-700 font-semibold">
                        {tariff.buyRate.toLocaleString()} {tariff.currency}
                      </TableCell>
                      <TableCell className="text-xs text-right text-slate-700 font-semibold">
                        {tariff.margin}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <Badge
                          variant="secondary"
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            tariff.benchmark.startsWith("-")
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {tariff.benchmark}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="text-slate-700 font-medium">{tariff.validity}</div>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-[10px] border ${
                            tariff.status === "Action"
                              ? "border-red-200 text-red-600"
                              : tariff.status === "Review"
                              ? "border-amber-200 text-amber-600"
                              : "border-emerald-200 text-emerald-600"
                          }`}
                        >
                          {tariff.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" /> Rate Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {INTELLIGENCE_FEED.map((insight) => (
                  <div key={insight.title} className="flex gap-3">
                    <div className="mt-1">
                      {insight.trend === "down" ? (
                        <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                      ) : insight.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-amber-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{insight.title}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{insight.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-700">Coverage Health</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Contracted lanes</span>
                    <span className="text-slate-700 font-semibold">{coverageValue}%</span>
                  </div>
                  <Progress
                    value={coverageValue}
                    indicatorClassName="bg-blue-600"
                    className="mt-2"
                  />
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">
                    16 high-volume lanes require updated tariffs within the next 45 days. Prioritize
                    Europe and North America exports.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-slate-700">Savings Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {OPPORTUNITY_LIST.map((opportunity) => (
                  <div key={opportunity.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{opportunity.label}</p>
                      <p className="text-[10px] text-slate-400">{opportunity.note}</p>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {opportunity.savings}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
