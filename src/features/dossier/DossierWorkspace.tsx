import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDossierStore } from '@/store/useDossierStore';

// UI Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Feature Components
import { DossierHeader } from './components/DossierHeader';
import { DossierRightRail } from './components/DossierRightRail';

import { DossierTrackingTab } from './tabs/DossierTrackingTab';
import { DossierTasksTab } from './tabs/DossierTasksTab';
import { DossierOperationsTab } from './tabs/DossierOperationsTab';
import { DossierFinancialsTab } from './tabs/DossierFinancialsTab';
import { DossierDocumentsTab } from './tabs/DossierDocumentsTab';
import { DossierAuditTab } from './tabs/DossierAuditTab';

export const DossierWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loadDossier, dossier, isLoading } = useDossierStore();
  
  // FIX: Controlled State for Tabs to prevent reset on re-render
  const [activeTab, setActiveTab] = useState("operations");

  useEffect(() => {
    if (id) {
      loadDossier(id);
    }
  }, [id, loadDossier]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
           <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
           <p className="text-sm text-slate-500 font-medium">Loading shipment data...</p>
        </div>
      </div>
    );
  }

  if (!dossier || !dossier.id) {
     return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
           <div className="text-red-500 font-bold text-lg">Shipment File Not Found</div>
           <Button onClick={() => navigate('/dashboard')} variant="link">
              Return to Dashboard
           </Button>
        </div>
     );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* 1. Fixed Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 z-30">
         <DossierHeader />
      </div>

      {/* 2. Main Body (Flex Grow to fill space) */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* Center Content: Tabs & View */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            
            {/* Sticky Tabs Header */}
            <div className="flex-none sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
               <div className="max-w-[1600px] mx-auto px-6">
                  <TabsList className="h-14 w-full justify-start gap-6 bg-transparent p-0 rounded-none">
                    <TabItem value="operations" label="Operations" />
                    <TabItem value="tracking" label="Tracking" count={dossier.events?.length} />
                    <TabItem value="documents" label="Documents" count={dossier.documents?.length} />
                    <TabItem value="financials" label="Financials" />
                    <TabItem value="tasks" label="Tasks" count={dossier.tasks?.filter(t => !t.completed).length} alert={dossier.tasks?.some(t => t.isBlocker && !t.completed)} />
                    <TabItem value="audit" label="Audit Log" />
                  </TabsList>
               </div>
            </div>

            {/* Scrollable Tab Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               <div className="max-w-[1600px] mx-auto px-6 py-8 min-h-full">
                  <TabsContent value="operations" className="mt-0 focus-visible:outline-none h-full">
                     <DossierOperationsTab />
                  </TabsContent>
                  
                  <TabsContent value="tracking" className="mt-0 focus-visible:outline-none h-full">
                     <DossierTrackingTab />
                  </TabsContent>
                  
                  <TabsContent value="documents" className="mt-0 focus-visible:outline-none h-full">
                     <DossierDocumentsTab />
                  </TabsContent>
                  
                  <TabsContent value="financials" className="mt-0 focus-visible:outline-none h-full">
                     <DossierFinancialsTab />
                  </TabsContent>
                  
                  <TabsContent value="tasks" className="mt-0 focus-visible:outline-none h-full">
                     <DossierTasksTab />
                  </TabsContent>
                  
                  <TabsContent value="audit" className="mt-0 focus-visible:outline-none h-full">
                     <DossierAuditTab />
                  </TabsContent>
               </div>
            </div>

          </Tabs>
        </div>

        {/* 3. Right Rail (Fixed Width - Restored) */}
        <DossierRightRail />
         
      </main>
    </div>
  );
};

// Sub-component for cleaner Tab Items
interface TabItemProps {
  value: string;
  label: string;
  count?: number;
  alert?: boolean;
}

const TabItem: React.FC<TabItemProps> = ({ value, label, count, alert }) => (
  <TabsTrigger 
    value={value}
    className={`
      relative h-14 rounded-none border-b-2 border-transparent px-4 pb-0 pt-0 font-semibold text-slate-500 hover:text-slate-800 transition-colors
      data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent
    `}
  >
    <div className="flex items-center gap-2">
      {label}
      {count !== undefined && count > 0 && (
        <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-100 px-1 text-[10px] font-bold text-slate-600 group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-700">
          {count}
        </span>
      )}
      {alert && (
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </div>
  </TabsTrigger>
);