import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
import LandingPage from "@/features/landing/LandingPage";
import LoginPage from "@/features/auth/LoginPage"; // Ensure you created this file

import { Toaster } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  // Application State
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'create' | 'dossier' | 'crm' | 'finance' | 'tariffs' | 'users'>('dashboard');
  const [crmView, setCrmView] = useState<'list' | 'details'>('list');
  const [dossierView, setDossierView] = useState<'dashboard' | 'dossier'>('dashboard'); 
  const [tariffView, setTariffView] = useState<'dashboard' | 'workspace'>('dashboard');

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // If we just logged out, reset landing page
      if (!session) {
        setShowLanding(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSidebarNav = (page: any) => {
      setCurrentPage(page);
      if (page === 'crm') setCrmView('list');
      if (page === 'dossier') setDossierView('dashboard');
      if (page === 'tariffs') setTariffView('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // State update handled by onAuthStateChange listener
  };

  // --------------------------------------------------------------------------
  // RENDER LOGIC
  // --------------------------------------------------------------------------

  // 1. Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // 2. Landing Page (Public)
  // If user is logged in, clicking "Enter App" skips login.
  // If user is NOT logged in, clicking "Enter App" goes to Login Page.
  if (showLanding) {
    return (
        <LandingPage 
            onEnterApp={() => {
                if (session) {
                    setShowLanding(false);
                } else {
                    // Trigger switch to login view by hiding landing but not having session
                    setShowLanding(false);
                }
            }} 
        />
    );
  }

  // 3. Login Page (Not Authenticated)
  if (!session) {
    return <LoginPage onLoginSuccess={() => setShowLanding(false)} />;
  }

  // 4. Main Application (Authenticated)
  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      <aside className="w-64 flex-none hidden md:block z-30 shadow-sm">
          <Sidebar 
            currentView={currentPage} 
            onNavigate={handleSidebarNav} 
            onLogout={handleLogout}
          /> 
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