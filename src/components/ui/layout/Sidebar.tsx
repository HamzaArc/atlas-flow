import { 
  LayoutDashboard, 
  FileText, 
  Ship, 
  Settings, 
  Users, 
  Briefcase,
  LogOut,
  ChevronRight,
  Box,
  Banknote // Imported for Tariffs
} from "lucide-react";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    currentView: string;
    // Updated type definition
    onNavigate: (view: 'dashboard' | 'dossier' | 'crm' | 'finance' | 'tariffs') => void;
}

export function Sidebar({ className, currentView, onNavigate }: SidebarProps) {
  
  const NavItem = ({ 
      id, icon: Icon, label, active = false, onClick 
  }: { id: string, icon: any, label: string, active?: boolean, onClick: () => void }) => (
      <Button 
        variant="ghost" 
        onClick={onClick}
        className={cn(
            "w-full justify-between group px-3 py-2 h-9 mb-1 transition-all duration-200",
            active 
                ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-r-2 border-blue-600 rounded-r-none" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <div className="flex items-center">
            <Icon className={cn("mr-3 h-4 w-4", active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
            <span className={cn("text-sm font-medium", active ? "font-semibold" : "")}>{label}</span>
        </div>
        {active && <ChevronRight className="h-3 w-3 text-blue-600 opacity-50" />}
      </Button>
  );

  return (
    <div className={cn("flex flex-col h-screen bg-white border-r border-slate-200", className)}>
      
      {/* 1. BRAND HEADER */}
      <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-md">
                  <Box className="h-5 w-5 text-white" />
              </div>
              <div>
                  <h1 className="font-bold text-lg tracking-tight text-slate-900 leading-none">Atlas Flow</h1>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Logistics OS</span>
              </div>
          </div>
      </div>

      <div className="px-4 mb-2">
          <div className="h-px bg-slate-100 w-full"></div>
      </div>

      {/* 2. NAVIGATION MODULES */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        
        {/* Core Operations */}
        <div>
            <h4 className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operations</h4>
            <div className="space-y-0.5">
                <NavItem 
                    id="dashboard" 
                    icon={FileText} 
                    label="Quote Engine" 
                    active={currentView === 'dashboard' || currentView === 'create'}
                    onClick={() => onNavigate('dashboard')} 
                />
                <NavItem 
                    id="dossier" 
                    icon={Ship} 
                    label="Shipment Dossiers" 
                    active={currentView === 'dossier'}
                    onClick={() => onNavigate('dossier')} 
                />
                {/* NEW TARIFF MODULE */}
                <NavItem 
                    id="tariffs" 
                    icon={Banknote} 
                    label="Tariff Manager" 
                    active={currentView === 'tariffs'}
                    onClick={() => onNavigate('tariffs')} 
                />
            </div>
        </div>

        {/* Business */}
        <div>
            <h4 className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business</h4>
            <div className="space-y-0.5">
                <NavItem id="crm" icon={Users} label="CRM (Clients)" active={currentView === 'crm'} onClick={() => onNavigate('crm')} />
                <NavItem id="finance" icon={Briefcase} label="Finance & Billing" active={currentView === 'finance'} onClick={() => onNavigate('finance')} />
            </div>
        </div>

        {/* Admin */}
        <div>
            <h4 className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">System</h4>
            <div className="space-y-0.5">
                <NavItem id="analytics" icon={LayoutDashboard} label="Analytics" onClick={() => {}} />
                <NavItem id="settings" icon={Settings} label="Settings" onClick={() => {}} />
            </div>
        </div>

      </div>

      {/* 3. USER FOOTER */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200">
              <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-slate-200">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback className="bg-blue-600 text-white font-bold">YA</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">Youssef A.</span>
                      <span className="text-[10px] text-slate-500">Sales Manager</span>
                  </div>
              </div>
              <LogOut className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500" />
          </div>
      </div>
    </div>
  );
}