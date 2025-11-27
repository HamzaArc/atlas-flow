import { useState } from "react";
// FIXED: Path updated to match your structure
import { Sidebar } from "@/components/ui/layout/Sidebar";
import QuoteWorkspace from "@/features/quotes/QuoteWorkspace";
import QuoteDashboard from "@/features/quotes/pages/QuoteDashboard";
import DossierWorkspace from "@/features/dossier/DossierWorkspace";

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'create' | 'dossier'>('dashboard');

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      
      {/* Sidebar Area */}
      <aside className="w-64 flex-none hidden md:block border-r bg-white z-10">
        <div className="h-full flex flex-col">
           {/* Temporary Navigation Links for Development */}
           <div className="p-4 border-b bg-slate-50">
               <div className="text-xs font-bold text-slate-400 uppercase mb-2">Dev Navigation</div>
               <button onClick={() => setCurrentPage('dashboard')} className="block w-full text-left text-sm font-medium mb-1 hover:text-blue-600">
                 1. Quote Management
               </button>
               <button onClick={() => setCurrentPage('dossier')} className="block w-full text-left text-sm font-medium hover:text-blue-600">
                 2. Operations (Dossier)
               </button>
           </div>
           
           {/* Your Main Sidebar Component */}
           <div className="flex-1">
              <Sidebar /> 
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative">
        
        {/* 1. Dashboard View */}
        {currentPage === 'dashboard' && (
             <QuoteDashboard onNavigate={setCurrentPage} />
        )}

        {/* 2. Quote Editor View */}
        {currentPage === 'create' && (
          <div className="absolute inset-0 z-20 bg-white">
             <div className="absolute top-4 left-4 z-50">
                <button 
                  onClick={() => setCurrentPage('dashboard')}
                  className="bg-white/90 backdrop-blur border shadow-sm px-3 py-1 rounded text-xs font-medium hover:bg-slate-100 transition"
                >
                  ← Back to Dashboard
                </button>
             </div>
             <QuoteWorkspace />
          </div>
        )}

        {/* 3. Dossier Operations View */}
        {currentPage === 'dossier' && (
            <DossierWorkspace />
        )}

      </main>
    </div>
  );
}

export default App;