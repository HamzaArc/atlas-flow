import { differenceInDays, format } from "date-fns";
import { Clock, AlertTriangle, CheckCircle, FileText, Banknote, Container } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useDossierStore } from "@/store/useDossierStore";

// Components
import { DossierHeader } from "./components/DossierHeader";
import { ShipmentDetails } from "./components/ShipmentDetails";
import { ContainerManifest } from "./components/ContainerManifest";
import { DocBucketSystem } from "./DocBucketSystem"; // Reused from previous step
import { ProfitLossTable } from "./ProfitLossTable"; // Reused from previous step
import { ClientActivityFeed } from "../crm/components/ClientActivityFeed"; // Reusing the Activity Feed UI logic

export default function DossierWorkspace() {
  const { dossier } = useDossierStore();

  // --- "DEATH CLOCK" LOGIC ---
  const today = new Date();
  const daysUntilArrival = differenceInDays(new Date(dossier.eta), today);
  const freeTimeEnd = new Date(dossier.eta);
  freeTimeEnd.setDate(freeTimeEnd.getDate() + dossier.freeTimeDays);
  const daysLeftInFreeTime = differenceInDays(freeTimeEnd, today);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      
      {/* 1. TOP HEADER */}
      <DossierHeader />

      {/* 2. DEMURRAGE BAR (The "Death Clock") */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10">
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ETA Casablanca</span>
                  <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded text-xs font-mono font-semibold text-slate-700">
                      {format(new Date(dossier.eta), 'dd MMM yyyy')}
                      <Badge variant={daysUntilArrival <= 2 ? "destructive" : "secondary"} className="h-4 px-1 text-[9px]">
                          {daysUntilArrival > 0 ? `T-${daysUntilArrival}` : 'ARRIVED'}
                      </Badge>
                  </div>
              </div>
              <div className="w-px h-6 bg-slate-200"></div>
              <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detention Free Time</span>
                  <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono font-bold ${daysLeftInFreeTime < 3 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Clock className="h-3.5 w-3.5" />
                      {daysLeftInFreeTime} Days Remaining
                  </div>
              </div>
          </div>
          {/* Financial Snapshot */}
          <div className="flex items-center gap-4">
              <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Revenue</span>
                  <span className="text-xs font-bold text-slate-700">{dossier.totalRevenue.toLocaleString()} {dossier.currency}</span>
              </div>
              <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Profit</span>
                  <span className="text-xs font-bold text-emerald-600">
                      {(dossier.totalRevenue - dossier.totalCost).toLocaleString()} {dossier.currency}
                  </span>
              </div>
          </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 p-6 overflow-hidden min-h-0">
          <div className="grid grid-cols-12 gap-6 h-full min-h-0">
              
              {/* LEFT COLUMN: CONTEXT & DETAILS (4 Cols) */}
              <div className="col-span-4 flex flex-col gap-6 h-full min-h-0">
                  {/* Top: Shipment Details Form */}
                  <div className="flex-1 min-h-0">
                      <ShipmentDetails />
                  </div>
                  
                  {/* Bottom: Activity Feed (Reused Component Structure) */}
                  <div className="h-1/3 min-h-0 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                          <h3 className="text-xs font-bold uppercase text-slate-500">Event Log</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                          {dossier.activities.map((act) => (
                              <div key={act.id} className="mb-4 last:mb-0 relative pl-4 border-l border-slate-200">
                                  <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                                  <p className="text-xs text-slate-700">{act.text}</p>
                                  <span className="text-[10px] text-slate-400">{act.meta} • {new Date(act.timestamp).toLocaleDateString()}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* RIGHT COLUMN: TABS & EXECUTION (8 Cols) */}
              <div className="col-span-8 flex flex-col h-full min-h-0 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                  <Tabs defaultValue="cargo" className="h-full flex flex-col">
                      <div className="px-2 pt-2 border-b border-slate-100 bg-slate-50/30">
                          <TabsList className="bg-transparent gap-2">
                              <TabsTrigger value="cargo" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 border border-transparent data-[state=active]:border-slate-200 rounded-t-lg px-4 text-xs font-semibold">
                                  <Container className="h-3.5 w-3.5 mr-2" /> Cargo & Containers
                              </TabsTrigger>
                              <TabsTrigger value="documents" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 border border-transparent data-[state=active]:border-slate-200 rounded-t-lg px-4 text-xs font-semibold">
                                  <FileText className="h-3.5 w-3.5 mr-2" /> Documents (EDM)
                              </TabsTrigger>
                              <TabsTrigger value="financials" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 border border-transparent data-[state=active]:border-slate-200 rounded-t-lg px-4 text-xs font-semibold">
                                  <Banknote className="h-3.5 w-3.5 mr-2" /> Profit & Loss
                              </TabsTrigger>
                          </TabsList>
                      </div>

                      <div className="flex-1 bg-white overflow-hidden p-0 relative">
                          <TabsContent value="cargo" className="h-full m-0 p-4 overflow-y-auto">
                              <ContainerManifest />
                          </TabsContent>
                          
                          <TabsContent value="documents" className="h-full m-0 p-6 overflow-y-auto bg-slate-50/50">
                              <div className="max-w-4xl mx-auto">
                                <DocBucketSystem />
                              </div>
                          </TabsContent>
                          
                          <TabsContent value="financials" className="h-full m-0 p-6 overflow-y-auto">
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