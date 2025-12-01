import { differenceInDays, format } from "date-fns";
import { Clock, Banknote, Container, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useDossierStore } from "@/store/useDossierStore";

// Components
import { DossierHeader } from "./components/DossierHeader";
import { ShipmentDetails } from "./components/ShipmentDetails";
import { ContainerManifest } from "./components/ContainerManifest";
import { DocBucketSystem } from "./DocBucketSystem"; 
import { ProfitLossTable } from "./ProfitLossTable";
import { DossierActivityFeed } from "./components/DossierActivityFeed";
import { ShipmentProgress } from "./components/ShipmentProgress";

export default function DossierWorkspace() {
  const { dossier } = useDossierStore();

  // --- "DEATH CLOCK" LOGIC ---
  const today = new Date();
  const daysUntilArrival = differenceInDays(new Date(dossier.eta), today);
  const freeTimeEnd = new Date(dossier.eta);
  freeTimeEnd.setDate(freeTimeEnd.getDate() + dossier.freeTimeDays);
  const daysLeftInFreeTime = differenceInDays(freeTimeEnd, today);

  return (
    <div className="h-screen flex flex-col bg-slate-50/50 overflow-hidden font-sans">
      
      {/* 1. TOP HEADER */}
      <DossierHeader />

      {/* 2. CONTROL BAR (Progress & Critical KPIs) */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 shadow-sm z-10 flex flex-col gap-2">
          {/* Top Row: Stepper */}
          <ShipmentProgress />
          
          {/* Bottom Row: Metrics & Alerts */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <div className="flex items-center gap-6">
                  {/* ETA Indicator */}
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ETA Casablanca</span>
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-xs font-mono font-semibold text-slate-700">
                          {format(new Date(dossier.eta), 'dd MMM yyyy')}
                          <Badge variant={daysUntilArrival <= 2 ? "destructive" : "secondary"} className="h-4 px-1 text-[9px] rounded-sm">
                              {daysUntilArrival > 0 ? `T-${daysUntilArrival} Days` : 'ARRIVED'}
                          </Badge>
                      </div>
                  </div>
                  
                  <div className="w-px h-4 bg-slate-200"></div>

                  {/* Demurrage Indicator */}
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detention Free Time</span>
                      <div className={`flex items-center gap-2 px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                          daysLeftInFreeTime < 3 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                          <Clock className="h-3 w-3" />
                          {daysLeftInFreeTime} Days Left
                      </div>
                  </div>
              </div>

              {/* Financial Snapshot */}
              <div className="flex items-center gap-4 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Revenue</span>
                      <span className="text-xs font-bold text-slate-700">{dossier.totalRevenue.toLocaleString()} {dossier.currency}</span>
                  </div>
                  <div className="w-px h-3 bg-slate-300"></div>
                  <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Margin</span>
                      <span className="text-xs font-bold text-emerald-600">
                          {(dossier.totalRevenue - dossier.totalCost).toLocaleString()} {dossier.currency}
                      </span>
                  </div>
              </div>
          </div>
      </div>

      {/* 3. MAIN WORKSPACE GRID */}
      <div className="flex-1 p-6 overflow-hidden min-h-0">
          <div className="grid grid-cols-12 gap-6 h-full min-h-0">
              
              {/* === LEFT COLUMN: CONTEXT & FEED (4 Cols) === */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 h-full min-h-0">
                  
                  {/* Shipment Details (Top Half) */}
                  <div className="flex-1 min-h-0">
                      <ShipmentDetails />
                  </div>
                  
                  {/* Collaboration Hub (Bottom Half) */}
                  <div className="h-[45%] min-h-0">
                      <DossierActivityFeed />
                  </div>
              </div>

              {/* === RIGHT COLUMN: EXECUTION TABS (8 Cols) === */}
              <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ring-1 ring-slate-100">
                  <Tabs defaultValue="cargo" className="h-full flex flex-col">
                      <div className="px-1 pt-1 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <TabsList className="bg-transparent h-10 gap-1 p-0">
                              <TabsTrigger value="cargo" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-4 text-xs font-bold uppercase tracking-wide h-full">
                                  <Container className="h-3.5 w-3.5 mr-2" /> Cargo
                              </TabsTrigger>
                              <TabsTrigger value="documents" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-4 text-xs font-bold uppercase tracking-wide h-full">
                                  <FileText className="h-3.5 w-3.5 mr-2" /> Documents
                              </TabsTrigger>
                              <TabsTrigger value="financials" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-4 text-xs font-bold uppercase tracking-wide h-full">
                                  <Banknote className="h-3.5 w-3.5 mr-2" /> Profit & Loss
                              </TabsTrigger>
                          </TabsList>
                          
                          <div className="pr-4">
                              <Badge variant="outline" className="bg-white text-[10px] text-slate-400">
                                  WORKSPACE
                              </Badge>
                          </div>
                      </div>

                      <div className="flex-1 bg-white overflow-hidden p-0 relative">
                          <TabsContent value="cargo" className="h-full m-0 p-4 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                              <ContainerManifest />
                          </TabsContent>
                          
                          <TabsContent value="documents" className="h-full m-0 p-6 overflow-y-auto bg-slate-50/30 animate-in fade-in zoom-in-95 duration-200">
                              <div className="max-w-5xl mx-auto">
                                <DocBucketSystem />
                              </div>
                          </TabsContent>
                          
                          <TabsContent value="financials" className="h-full m-0 p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                              <ProfitLossTable />
                          </TabsContent>
                      </div>
                  </Tabs>
              </div>

          </div>
      </div>
    </div>
  );
}