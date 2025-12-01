import { useState } from "react";
import { Sidebar } from "@/components/ui/layout/Sidebar";
import QuoteWorkspace from "@/features/quotes/QuoteWorkspace";
import QuoteDashboard from "@/features/quotes/pages/QuoteDashboard";
import DossierWorkspace from "@/features/dossier/DossierWorkspace";
import ClientDetailsPage from "@/features/crm/pages/ClientDetailsPage";
import ClientListPage from "@/features/crm/pages/ClientListPage"; // <--- NEW IMPORT
import { Toaster } from "@/components/ui/use-toast";
import { useQuoteStore } from "@/store/useQuoteStore"; 

function App() {
  // Main Navigation State
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'create' | 'dossier' | 'crm' | 'finance'>('dashboard');
  
  // Sub-Navigation States
  const [crmView, setCrmView] = useState<'list' | 'details'>('list');

  const { createNewQuote } = useQuoteStore();

  const handleSidebarNav = (page: any) => {
      setCurrentPage(page);
      // Reset sub-views when navigating main menu
      if (page === 'crm') setCrmView('list');
  };

  const handleNewQuote = () => {
      createNewQuote();
      setCurrentPage('create');
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      
      {/* Sidebar Area */}
      <aside className="w-64 flex-none hidden md:block z-30 shadow-sm">
          <Sidebar currentView={currentPage} onNavigate={handleSidebarNav} /> 
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative">
        
        {/* 1. Quote Module */}
        {currentPage === 'dashboard' && (
             <QuoteDashboard onNavigate={setCurrentPage} />
        )}
        {currentPage === 'create' && (
          <div className="absolute inset-0 z-20 bg-white">
             <QuoteWorkspace onBack={() => setCurrentPage('dashboard')} />
          </div>
        )}

        {/* 2. Operations Module */}
        {currentPage === 'dossier' && (
            <DossierWorkspace />
        )}

        {/* 3. CRM Module (Client Management) */}
        {currentPage === 'crm' && (
            crmView === 'list' ? (
                <ClientListPage onNavigate={setCrmView} />
            ) : (
                <div className="absolute inset-0 z-20 bg-white">
                    {/* Add back button logic inside ClientDetailsPage or wrap it here */}
                    <div className="h-full flex flex-col">
                        <div className="bg-white border-b px-4 py-2">
                            <button onClick={() => setCrmView('list')} className="text-xs text-blue-600 hover:underline">← Back to List</button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ClientDetailsPage />
                        </div>
                    </div>
                </div>
            )
        )}

        {/* 4. Finance Module (Placeholder) */}
        {currentPage === 'finance' && (
            <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-2">
                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🚧</span>
                </div>
                <p>Module under construction</p>
            </div>
        )}

      </main>
      <Toaster />
    </div>
  );
}

export default App;