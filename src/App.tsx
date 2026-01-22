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
import LoginPage from "@/features/auth/LoginPage"; 

import { Toaster } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  // Application State
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'create' | 'dossier' | 'crm' | 'finance' | 'tariffs' | 'users'>('dashboard');
  const [crmView, setCrmView] = useState<'list' | 'details'>('list');
  const [dossierView, setDossierView] = useState<'dashboard' | 'dossier'>('dashboard'); 
  const [tariffView, setTariffView] = useState<'dashboard' | 'workspace'>('dashboard');

  // Sidebar State (False = Expanded by Default)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
  };

  // DYNAMIC LAYOUT CALCULATIONS
  // When collapsed (isSidebarCollapsed = true) -> Width is 72px -> content PL is 72px
  // When expanded (isSidebarCollapsed = false) -> Width is 280px -> content PL is 280px
  const mainContentPadding = isSidebarCollapsed ? 'pl-[72px]' : 'pl-[280px]';
  const overlayLeftPosition = isSidebarCollapsed ? 'left-[72px]' : 'left-[280px]';

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
  if (showLanding) {
    return (
        <LandingPage 
            onEnterApp={() => {
                setShowLanding(false);
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
      
      {/* Sidebar - Controlled by App state */}
      <Sidebar 
        currentView={currentPage} 
        onNavigate={handleSidebarNav} 
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      /> 

      {/* Main Content Area 
        Dynamically adjusted padding ensures content flows with sidebar expansion.
      */}
      <main className={cn("flex-1 h-screen overflow-hidden flex flex-col relative transition-all duration-300 ease-in-out", mainContentPadding)}>
        
        {currentPage === 'dashboard' && <QuoteDashboard onNavigate={setCurrentPage} />}
        {currentPage === 'create' && (
          <div className={cn("absolute inset-0 z-20 bg-white transition-all duration-300 ease-in-out", overlayLeftPosition)}>
             <QuoteWorkspace onBack={() => setCurrentPage('dashboard')} />
          </div>
        )}

        {currentPage === 'dossier' && (
            dossierView === 'dashboard' ? <DossierDashboard onNavigate={setDossierView} /> : (
                <div className={cn("absolute inset-0 z-20 bg-white transition-all duration-300 ease-in-out", overlayLeftPosition)}>
                    <DossierWorkspace onBack={() => setDossierView('dashboard')} />
                </div>
            )
        )}

        {currentPage === 'crm' && (
            crmView === 'list' ? <ClientListPage onNavigate={setCrmView} /> : (
                <div className={cn("absolute inset-0 z-20 bg-white transition-all duration-300 ease-in-out", overlayLeftPosition)}>
                    <div className="h-full flex flex-col">
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
                <div className={cn("absolute inset-0 z-20 bg-white transition-all duration-300 ease-in-out", overlayLeftPosition)}>
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