import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDossierStore } from "@/store/useDossierStore";
import { DossierHeader } from "./components/DossierHeader";
import { DossierRightRail } from "./components/DossierRightRail";
import { 
   LayoutDashboard, Map, FileText, 
   Wallet, CheckSquare, History 
} from "lucide-react";

// --- Tab Components ---
import { DossierOperationsTab } from "./tabs/DossierOperationsTab";
import { DossierTrackingTab } from "./tabs/DossierTrackingTab";
import { DossierTasksTab } from "./tabs/DossierTasksTab";
import { DossierDocumentsTab } from "./tabs/DossierDocumentsTab";
import { DossierFinancialsTab } from "./tabs/DossierFinancialsTab";
import { DossierAuditTab } from "./tabs/DossierAuditTab";

type TabType = 'operations' | 'tracking' | 'docs' | 'finance' | 'tasks' | 'audit';

export default function DossierWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loadDossier, isLoading, dossier } = useDossierStore();
  const [activeTab, setActiveTab] = useState<TabType>('operations');

  useEffect(() => {
     if (id) {
        loadDossier(id);
     }
  }, [id, loadDossier]);

  if (isLoading) {
     return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium">Loading Shipment Data...</div>;
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

  const renderTab = () => {
     switch(activeTab) {
        case 'operations': return <DossierOperationsTab />;
        case 'tracking': return <DossierTrackingTab />;
        case 'docs': return <DossierDocumentsTab />;
        case 'finance': return <DossierFinancialsTab />;
        case 'tasks': return <DossierTasksTab />;
        case 'audit': return <DossierAuditTab />;
        default: return <DossierOperationsTab />;
     }
  };

  const NavTab = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors
        ${activeTab === id 
           ? 'border-blue-600 text-blue-700' 
           : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
      `}
    >
      <Icon className={`h-4 w-4 ${activeTab === id ? 'text-blue-600' : 'text-slate-400'}`} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* 1. Header (Fixed) */}
      <div className="flex-shrink-0">
         <DossierHeader />
      </div>

      {/* 2. Main Body (Flex Grow) */}
      <div className="flex flex-1 overflow-hidden">
         
         {/* Center Content: Tabs & View */}
         <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
            
            {/* Tab Bar */}
            <div className="bg-white border-b border-slate-200 px-8 sticky top-0 z-10 shadow-sm">
               <nav className="flex space-x-8">
                  <NavTab id="operations" label="Operations" icon={LayoutDashboard} />
                  <NavTab id="tracking" label="Tracking" icon={Map} />
                  <NavTab id="docs" label="Documents" icon={FileText} />
                  <NavTab id="finance" label="Financials" icon={Wallet} />
                  <NavTab id="tasks" label="Tasks" icon={CheckSquare} />
                  <NavTab id="audit" label="Audit Log" icon={History} />
               </nav>
            </div>

            {/* Scrollable Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar">
               {renderTab()}
            </main>

         </div>

         {/* 3. Right Rail (Fixed Width) */}
         <DossierRightRail />
         
      </div>

    </div>
  );
}