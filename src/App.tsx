import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/ui/layout/Sidebar';
import LoginPage from './features/auth/LoginPage';
import { useUserStore } from './store/useUserStore';
import { supabase } from './lib/supabase'; 
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react"; 

// Pages
import LandingPage from './features/landing/LandingPage';
import RateDashboard from './features/tariffs/pages/RateDashboard';
import RateWorkspace from './features/tariffs/pages/RateWorkspace';
import QuoteDashboard from './features/quotes/pages/QuoteDashboard';
import QuoteWorkspace from './features/quotes/QuoteWorkspace';
import UserDirectoryPage from './features/users/pages/UserDirectoryPage';
import FinanceDashboard from './features/finance/pages/FinanceDashboard';
import ClientListPage from './features/crm/pages/ClientListPage';
import ClientDetailsPage from './features/crm/pages/ClientDetailsPage';
import DossierDashboard from './features/dossier/pages/DossierDashboard';

// FIX: Changed to named import to match the component export
import { DossierWorkspace } from './features/dossier/DossierWorkspace';

// --- LAYOUT WRAPPER FOR AUTHENTICATED ROUTES ---
const ProtectedLayout = () => {
  const { isAuthenticated, logout } = useUserStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 1. Guard: Redirect to Login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Render: App Layout with Sidebar
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar 
         isCollapsed={isSidebarCollapsed}
         onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
         onLogout={logout}
      />
      
      <main className={cn(
          "flex-1 min-h-screen transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
          isSidebarCollapsed ? 'pl-[72px]' : 'pl-[280px]'
      )}>
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  const { login, logout } = useUserStore();
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Restore session on app load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        login();
      } else {
        logout();
      }
      setIsSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        login();
      } else {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* --- PROTECTED ROUTES (Sidebar + Auth Check) --- */}
        <Route element={<ProtectedLayout />}>
            {/* FIX: Default Dashboard now points to Dossiers (Operations) */}
            <Route path="/dashboard" element={<Navigate to="/dossiers" replace />} />
            
            {/* Quotes */}
            <Route path="/quotes" element={<QuoteDashboard />} />
            <Route path="/quotes/create" element={<QuoteWorkspace />} />
            <Route path="/quotes/:id" element={<QuoteWorkspace />} />
            
            {/* Tariffs */}
            <Route path="/tariffs" element={<RateDashboard />} />
            <Route path="/tariffs/new" element={<RateWorkspace />} />

            {/* Dossiers */}
            <Route path="/dossiers" element={<DossierDashboard />} />
            <Route path="/dossiers/:id" element={<DossierWorkspace />} />
            
            {/* CRM */}
            <Route path="/clients" element={<ClientListPage />} />
            <Route path="/clients/new" element={<ClientDetailsPage />} />
            <Route path="/clients/:id" element={<ClientDetailsPage />} />
            
            {/* Finance */}
            <Route path="/finance" element={<FinanceDashboard />} />
            
            {/* Settings/Users */}
            <Route path="/users" element={<UserDirectoryPage />} />
        </Route>

        {/* Catch-all: Send to Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;