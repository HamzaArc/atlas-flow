import { useState } from "react";
import { Sidebar } from "@/components/ui/layout/Sidebar";
import QuoteWorkspace from "@/features/quotes/QuoteWorkspace";
import QuoteDashboard from "@/features/quotes/pages/QuoteDashboard";
import DossierWorkspace from "@/features/dossier/DossierWorkspace";
import DossierDashboard from "@/features/dossier/pages/DossierDashboard";
import ClientDetailsPage from "@/features/crm/pages/ClientDetailsPage";
import ClientListPage from "@/features/crm/pages/ClientListPage";
import FinanceDashboard from "@/features/finance/pages/FinanceDashboard";
import RateDashboard from "@/features/tariffs/pages/RateDashboard";
import RateWorkspace from "@/features/tariffs/pages/RateWorkspace";
import UserDirectoryPage from "@/features/users/pages/UserDirectoryPage"; 

import { Toaster } from "@/components/ui/use-toast";

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'create' | 'dossier' | 'crm' | 'finance' | 'tariffs' | 'users'>('dashboard');
  const [crmView, setCrmView] = useState<'list' | 'details'>('list');
  const [dossierView, setDossierView] = useState<'dashboard' | 'dossier'>('dashboard'); 
  const [tariffView, setTariffView] = useState<'dashboard' | 'workspace'>('dashboard');

  const handleSidebarNav = (page: any) => {
      setCurrentPage(page);
      if (page === 'crm') setCrmView('list');
      if (page === 'dossier') setDossierView('dashboard');
      if (page === 'tariffs') setTariffView('dashboard');
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      <aside className="w-64 flex-none hidden md:block z-30 shadow-sm">
          <Sidebar currentView={currentPage} onNavigate={handleSidebarNav} /> 
      </aside>

      <main className="flex-1 h-screen overflow-hidden flex flex-col relative">
        
        {currentPage === 'dashboard' && <QuoteDashboard onNavigate={setCurrentPage} />}
        {currentPage === 'create' && (
          <div className="absolute inset-0 z-20 bg-white">
             <QuoteWorkspace onBack={() => setCurrentPage('dashboard')} />
          </div>
        )}

        {currentPage === 'dossier' && (
            dossierView === 'dashboard' ? <DossierDashboard onNavigate={setDossierView} /> : (
                <div className="absolute inset-0 z-20 bg-white">
                    <DossierWorkspace onBack={() => setDossierView('dashboard')} />
                </div>
            )
        )}

        {currentPage === 'crm' && (
            crmView === 'list' ? <ClientListPage onNavigate={setCrmView} /> : (
                <div className="absolute inset-0 z-20 bg-white">
                    <div className="h-full flex flex-col">
                        {/* CRM Header for Mobile/Navigation */}
                        <div className="bg-white border-b px-4 py-2">
                            <button onClick={() => setCrmView('list')} className="text-xs text-blue-600 hover:underline">← Back to List</button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {/* FIXED: Passed onNavigate prop */}
                            <ClientDetailsPage onNavigate={setCrmView} />
                        </div>
                    </div>
                </div>
            )
        )}

        {currentPage === 'finance' && (
            <FinanceDashboard />
        )}

        {currentPage === 'tariffs' && (
            tariffView === 'dashboard' ? <RateDashboard onNavigate={setTariffView} /> : (
                <div className="absolute inset-0 z-20 bg-white">
                    <RateWorkspace onBack={() => setTariffView('dashboard')} />
                </div>
            )
        )}

        {currentPage === 'users' && (
            <UserDirectoryPage />
        )}

      </main>
      <Toaster />
    </div>
  );
}

export default App;