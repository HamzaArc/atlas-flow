import { 
    Ship, Anchor, Container as ContainerIcon, 
    FileText, AlertTriangle, CheckCircle, Clock 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDossierStore } from "@/store/useDossierStore";
import { differenceInDays, format } from "date-fns";

// --- NEW IMPORTS ---
import { DocBucketSystem } from "./DocBucketSystem";
import { ProfitLossTable } from "./ProfitLossTable";

export default function DossierWorkspace() {
  const { dossier, containers } = useDossierStore();

  // --- LOGIC: The Demurrage "Death Clock" ---
  const today = new Date();
  const daysUntilArrival = differenceInDays(dossier.eta, today);
  const daysLeftInFreeTime = dossier.freeTimeEnd ? differenceInDays(dossier.freeTimeEnd, today) : 7;
  
  // Status Color Logic
  const getStatusColor = (status: string) => {
      switch(status) {
          case 'PRE_ALERT': return 'bg-slate-100 text-slate-700';
          case 'ON_WATER': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'ARRIVAL': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
          case 'DELIVERY': return 'bg-green-100 text-green-700 border-green-200';
          default: return 'bg-slate-100';
      }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      
      {/* 1. OPERATIONAL HEADER */}
      <div className="bg-white border-b px-6 py-4 shadow-sm flex justify-between items-start">
         <div className="flex gap-4">
             <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                 <Ship className="h-6 w-6 text-blue-600" />
             </div>
             <div>
                 <div className="flex items-center gap-3">
                     <h1 className="text-xl font-bold text-slate-900">{dossier.ref}</h1>
                     <Badge className={getStatusColor(dossier.status)} variant="outline">
                         {dossier.status.replace('_', ' ')}
                     </Badge>
                 </div>
                 <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                     <span className="flex items-center gap-1"><Anchor className="h-3 w-3" /> {dossier.vesselName}</span>
                     <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> MBL: {dossier.mblNumber}</span>
                 </div>
             </div>
         </div>

         {/* The Demurrage Widget */}
         <div className="flex gap-6">
             <div className="text-right">
                 <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">ETA Casablanca</div>
                 <div className="font-mono font-bold text-lg flex items-center gap-2 justify-end">
                     {format(dossier.eta, 'dd MMM yyyy')}
                     <Badge variant="secondary" className="text-xs">
                        {daysUntilArrival > 0 ? `In ${daysUntilArrival} Days` : 'Arrived'}
                     </Badge>
                 </div>
             </div>
             
             <div className="w-px bg-slate-200 h-10"></div>

             <div className="text-right">
                 <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Free Time Remaining</div>
                 <div className={`font-mono font-bold text-lg flex items-center gap-2 justify-end ${daysLeftInFreeTime < 3 ? 'text-red-600' : 'text-green-600'}`}>
                     <Clock className="h-4 w-4" />
                     {daysLeftInFreeTime} Days
                 </div>
             </div>
         </div>
      </div>

      {/* 2. MAIN COCKPIT AREA */}
      <div className="flex-1 p-6 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
              <TabsList className="mb-4 w-fit bg-white border">
                  <TabsTrigger value="overview">Shipment Overview</TabsTrigger>
                  <TabsTrigger value="financials">Costs & Billing</TabsTrigger>
                  <TabsTrigger value="documents">Documents (EDM)</TabsTrigger>
              </TabsList>

              {/* TAB 1: OVERVIEW */}
              <TabsContent value="overview" className="flex-1 overflow-auto">
                  <div className="grid grid-cols-12 gap-6">
                      
                      {/* Timeline Spine */}
                      <Card className="col-span-3 p-4 h-fit">
                          <h3 className="font-semibold text-slate-700 mb-4">Milestones</h3>
                          <div className="space-y-6 relative pl-2">
                              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200"></div>

                              <div className="relative flex gap-3 items-start">
                                  <div className="relative z-10 w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-sm flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3 text-white" />
                                  </div>
                                  <div>
                                      <div className="text-sm font-medium text-slate-900">Booking Confirmed</div>
                                      <div className="text-xs text-slate-500">20 Nov 10:00</div>
                                  </div>
                              </div>
                              <div className="relative flex gap-3 items-start">
                                  <div className="relative z-10 w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-sm flex items-center justify-center">
                                      <Ship className="h-3 w-3 text-white" />
                                  </div>
                                  <div>
                                      <div className="text-sm font-medium text-slate-900">Vessel Departure</div>
                                      <div className="text-xs text-slate-500">22 Nov 14:30</div>
                                  </div>
                              </div>
                              <div className="relative flex gap-3 items-start opacity-50">
                                  <div className="relative z-10 w-6 h-6 rounded-full bg-slate-200 border-4 border-white shadow-sm"></div>
                                  <div>
                                      <div className="text-sm font-medium text-slate-900">Arrival Casablanca</div>
                                      <div className="text-xs text-slate-500">ETA: 05 Dec</div>
                                  </div>
                              </div>
                          </div>
                      </Card>

                      {/* Container Grid */}
                      <div className="col-span-9 space-y-4">
                          <Card className="p-0 overflow-hidden">
                              <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
                                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                      <ContainerIcon className="h-4 w-4" /> 
                                      Attached Containers ({containers.length})
                                  </h3>
                                  <Button size="sm" variant="outline">Import List</Button>
                              </div>
                              <div className="divide-y">
                                  {containers.map((c) => (
                                      <div key={c.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
                                          <div className="col-span-3 font-mono font-medium text-blue-600">{c.number}</div>
                                          <div className="col-span-1 text-sm text-slate-500">{c.type}</div>
                                          <div className="col-span-2 text-sm text-slate-500">Seal: {c.seal}</div>
                                          <div className="col-span-2 text-sm text-slate-500">{c.weight.toLocaleString()} kg</div>
                                          <div className="col-span-2 text-sm text-slate-500">{c.packages} pkgs</div>
                                          <div className="col-span-2 flex justify-end">
                                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                  {c.status}
                                              </Badge>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </Card>

                          {/* Alert Area */}
                          <Card className="border-l-4 border-l-yellow-400 p-4 bg-yellow-50/30">
                              <div className="flex gap-3">
                                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                  <div>
                                      <h4 className="text-sm font-bold text-yellow-800">Missing Documents for Customs</h4>
                                      <p className="text-sm text-yellow-700 mt-1">
                                          Original Bill of Lading not yet received. Arrival in 5 days.
                                      </p>
                                      <Button size="sm" variant="outline" className="mt-2 border-yellow-300 text-yellow-800 hover:bg-yellow-100">
                                          Upload OBL
                                      </Button>
                                  </div>
                              </div>
                          </Card>
                      </div>
                  </div>
              </TabsContent>

              {/* TAB 2: FINANCIALS [INTEGRATED] */}
              <TabsContent value="financials" className="flex-1 overflow-auto p-1">
                  <ProfitLossTable />
              </TabsContent>

              {/* TAB 3: DOCUMENTS [INTEGRATED] */}
              <TabsContent value="documents" className="flex-1 overflow-auto p-1">
                  <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-1">Document Control (EDM)</h3>
                      <p className="text-sm text-slate-500">Manage compliance documents for import clearance.</p>
                  </div>
                  <DocBucketSystem />
              </TabsContent>

          </Tabs>
      </div>
    </div>
  );
}