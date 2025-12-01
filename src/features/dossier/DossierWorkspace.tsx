import { differenceInDays, format } from "date-fns";
import { Clock, Banknote, Container, FileText, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useDossierStore } from "@/store/useDossierStore";
import { cn } from "@/lib/utils";

// Components
import { DossierHeader } from "./components/DossierHeader";
import { ShipmentDetails } from "./components/ShipmentDetails";
import { ContainerManifest } from "./components/ContainerManifest";
import { DocBucketSystem } from "./DocBucketSystem"; 
import { ProfitLossTable } from "./ProfitLossTable";
import { DossierActivityFeed } from "./components/DossierActivityFeed";
import { ShipmentProgress } from "./components/ShipmentProgress";

interface DossierWorkspaceProps {
    onBack: () => void;
}

export default function DossierWorkspace({ onBack }: DossierWorkspaceProps) {
  const { dossier } = useDossierStore();

  // --- "DEATH CLOCK" LOGIC ---
  const today = new Date();
  const daysUntilArrival = differenceInDays(new Date(dossier.eta), today);
  const freeTimeEnd = new Date(dossier.eta);
  freeTimeEnd.setDate(freeTimeEnd.getDate() + dossier.freeTimeDays);
  const daysLeftInFreeTime = differenceInDays(freeTimeEnd, today);
  const isDemurrageRisk = daysLeftInFreeTime < 3 && ['AT_POD', 'CUSTOMS', 'DELIVERED'].includes(dossier.status);

  // Financial Quick Check
  const margin = dossier.totalRevenue - dossier.totalCost;
  const isNegative = margin < 0;

  return (
    <div className="h-screen flex flex-col bg-slate-50/50 overflow-hidden font-sans">
      
      {/* 1. TOP HEADER (Now accepts onBack) */}
      <DossierHeader onBack={onBack} />

      {/* 2. INTELLIGENCE BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-[0_2px_4px_rgba(0,0,0,0.02)] z-10 flex flex-col gap-4">
          
          {/* Row 1: Workflow Stepper */}
          <div className="pt-2 pb-1">
            <ShipmentProgress />
          </div>
          
          {/* Row 2: Critical Alerts & Metrics */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
              
              <div className="flex items-center gap-6">
                  {/* ALERTS SECTION */}
                  {dossier.alerts.length > 0 ? (
                      <div className="flex items-center gap-2 animate-pulse">
                          <Badge variant="destructive" className="flex items-center gap-1.5 px-2 py-1 h-6">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {dossier.alerts.length} Issue{dossier.alerts.length > 1 ? 's' : ''}
                          </Badge>
                          <span className="text-xs font-bold text-red-600">{dossier.alerts[0].message}</span>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-bold">Workflow Healthy</span>
                      </div>
                  )}

                  <div className="w-px h-4 bg-slate-200"></div>

                  {/* NEXT ACTION */}
                  <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Next Action:</span>
                      <span className="font-bold text-blue-700 flex items-center gap-1 cursor-pointer hover:underline">
                          {dossier.nextAction} <ChevronRight className="h-3 w-3" />
                      </span>
                  </div>
              </div>

              {/* KPI DASHBOARD */}
              <div className="flex items-center gap-4">
                  {/* Timeline Logic */}
                  <div className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-md border",
                      isDemurrageRisk ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-600"
                  )}>
                      <Clock className="h-3.5 w-3.5" />
                      <div className="flex flex-col leading-none">
                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Detention</span>
                          <span className="text-xs font-bold">{daysLeftInFreeTime > 0 ? `${daysLeftInFreeTime} Days Left` : 'In Demurrage'}</span>
                      </div>
                  </div>

                  {/* Finance Logic */}
                  <div className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-md border",
                      isNegative ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  )}>
                      <Banknote className="h-3.5 w-3.5" />
                      <div className="flex flex-col leading-none">
                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Est. Margin</span>
                          <span className="text-xs font-bold">{margin.toLocaleString()} {dossier.currency}</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 3. MAIN WORKSPACE GRID */}
      <div className="flex-1 p-6 overflow-hidden min-h-0">
          <div className="grid grid-cols-12 gap-6 h-full min-h-0">
              
              {/* === LEFT COLUMN: CONTEXT & FEED (4 Cols) === */}
              <div className="col-span-12 xl:col-span-4 flex flex-col gap-4 h-full min-h-0">
                  <div className="flex-1 min-h-0 shadow-sm rounded-xl overflow-hidden ring-1 ring-slate-200">
                      <ShipmentDetails />
                  </div>
                  <div className="h-[40%] min-h-0 shadow-sm rounded-xl overflow-hidden ring-1 ring-slate-200">
                      <DossierActivityFeed />
                  </div>
              </div>

              {/* === RIGHT COLUMN: EXECUTION TABS (8 Cols) === */}
              <div className="col-span-12 xl:col-span-8 flex flex-col h-full min-h-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <Tabs defaultValue="cargo" className="h-full flex flex-col">
                      <div className="px-2 pt-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                          <TabsList className="bg-transparent h-10 gap-2 p-0">
                              <TabsTrigger value="cargo" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-4 text-xs font-bold uppercase tracking-wide h-full flex gap-2">
                                  <Container className="h-4 w-4" /> Cargo & Equip
                              </TabsTrigger>
                              <TabsTrigger value="documents" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-4 text-xs font-bold uppercase tracking-wide h-full flex gap-2">
                                  <FileText className="h-4 w-4" /> Document Cloud
                              </TabsTrigger>
                              <TabsTrigger value="financials" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-4 text-xs font-bold uppercase tracking-wide h-full flex gap-2">
                                  <Banknote className="h-4 w-4" /> Profit & Loss
                              </TabsTrigger>
                          </TabsList>
                      </div>

                      <div className="flex-1 bg-white overflow-hidden relative">
                          <TabsContent value="cargo" className="h-full m-0 p-4 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                              <ContainerManifest />
                          </TabsContent>
                          
                          <TabsContent value="documents" className="h-full m-0 p-6 overflow-y-auto bg-slate-50/30 animate-in fade-in zoom-in-95 duration-200">
                              <div className="max-w-6xl mx-auto">
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