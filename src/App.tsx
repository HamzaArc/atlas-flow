import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/ui/layout/Sidebar';
import LoginPage from './features/auth/LoginPage';
import { useUserStore } from './store/useUserStore';

// Existing Pages
import LandingPage from './features/landing/LandingPage';
import RateDashboard from './features/tariffs/pages/RateDashboard';
import QuoteDashboard from './features/quotes/pages/QuoteDashboard';
import QuoteWorkspace from './features/quotes/QuoteWorkspace';
import UserDirectoryPage from './features/users/pages/UserDirectoryPage';
import FinanceDashboard from './features/finance/pages/FinanceDashboard';
import ClientListPage from './features/crm/pages/ClientListPage';
import ClientDetailsPage from './features/crm/pages/ClientDetailsPage';

// --- NEW DOSSIER PAGES ---
import DossierDashboard from './features/dossier/pages/DossierDashboard';
import DossierWorkspace from './features/dossier/DossierWorkspace';

function App() {
  const { isAuthenticated } = useUserStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<LandingPage />} />
            
            {/* Tariff & Quoting */}
            <Route path="/tariffs" element={<RateDashboard />} />
            <Route path="/quotes" element={<QuoteDashboard />} />
            <Route path="/quotes/:id" element={<QuoteWorkspace />} />
            
            {/* --- NEW LOGISTICS ROUTES --- */}
            <Route path="/dossiers" element={<DossierDashboard />} />
            <Route path="/dossiers/:id" element={<DossierWorkspace />} />
            
            {/* CRM & Finance */}
            <Route path="/clients" element={<ClientListPage />} />
            <Route path="/clients/:id" element={<ClientDetailsPage />} />
            <Route path="/finance" element={<FinanceDashboard />} />
            <Route path="/users" element={<UserDirectoryPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;