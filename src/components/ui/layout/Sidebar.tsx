import React from 'react'; 
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Ship, 
  Settings, 
  Users, 
  Briefcase,
  LogOut,
  ChevronRight,
  Box,
  Banknote,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onLogout?: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function Sidebar({ 
  className, 
  onLogout,
  isCollapsed,        
  onToggleCollapse    
}: SidebarProps) {
  
  const navigate = useNavigate();
  const location = useLocation();
  const expanded = !isCollapsed;

  // Helper to check active route
  const isActive = (path: string) => {
     if (path === '/dashboard' && location.pathname === '/dashboard') return true;
     if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
     return false;
  };

  const NavItem = ({ 
      path, 
      icon: Icon, 
      label, 
      status,      
      statusText
  }: { 
      path: string, 
      icon: any, 
      label: string, 
      status?: 'beta' | 'soon' | 'new',
      statusText?: string
  }) => {
      const isSoon = status === 'soon';
      const active = isActive(path);

      // Base Button Content
      const content = (
        <Button 
          variant="ghost" 
          onClick={isSoon ? undefined : () => navigate(path)}
          disabled={isSoon}
          className={cn(
              "relative group w-full flex items-center justify-start p-0 overflow-hidden", 
              "transition-all duration-300 ease-in-out",
              "h-12", 
              active 
                  ? "bg-blue-50/80 text-blue-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
              isSoon && "opacity-50 cursor-not-allowed hover:bg-transparent"
          )}
        >
          {/* FIXED ICON CONTAINER */}
          <div className="min-w-[72px] w-[72px] h-full flex items-center justify-center shrink-0 relative z-20">
             <div className={cn(
               "absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-blue-600 rounded-r-full transition-all duration-300 ease-in-out",
               active ? "h-8 opacity-100" : "h-0 opacity-0"
             )} />

             <Icon className={cn(
               "h-5 w-5 transition-all duration-300 ease-in-out",
               active ? "text-blue-600 scale-105" : "text-slate-400 group-hover:text-slate-600"
             )} />
          </div>
          
          {/* TEXT CONTAINER */}
          <div className={cn(
            "flex items-center flex-1 overflow-hidden whitespace-nowrap pl-2", 
            "transition-all duration-300 ease-in-out",
            expanded ? "opacity-100 translate-x-0 pr-4" : "opacity-0 -translate-x-2 pr-0 w-0"
          )}>
            <span className={cn("text-sm", active ? "font-semibold" : "font-medium")}>
              {label}
            </span>
            
            {status && statusText && (
                <span className={cn(
                    "ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border",
                    status === 'beta' && "bg-blue-100 text-blue-700 border-blue-200", 
                    status === 'soon' && "bg-slate-100 text-slate-500 border-slate-200",
                    status === 'new' && "bg-emerald-100 text-emerald-700 border-emerald-200"
                )}>
                    {statusText}
                </span>
            )}

            {!isSoon && (
              <ChevronRight className={cn(
                "h-3 w-3 ml-2 text-slate-300 transition-all duration-300 ease-in-out",
                expanded ? "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0" : "opacity-0"
              )} />
            )}
          </div>
        </Button>
      );

      // Tooltip only when collapsed
      if (!expanded) {
        return (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="w-full mb-1">
                {content}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2 font-medium bg-slate-900 text-white border-slate-800 ml-2">
              <span>{label}</span>
              {status && (
                <span className={cn(
                  "text-[9px] uppercase font-bold px-1 rounded",
                  status === 'beta' ? "bg-blue-500/20 text-blue-200" : "bg-white/10 text-slate-300"
                )}>
                  {status}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        );
      }

      return <div className="mb-1">{content}</div>;
  };

  const SectionHeader = ({ title }: { title: string }) => {
    return (
      <div className={cn(
        "flex items-center overflow-hidden whitespace-nowrap",
        "transition-all duration-300 ease-in-out",
        expanded ? "h-10 opacity-100 mt-2 mb-1" : "h-0 opacity-0 mt-0 mb-0"
      )}>
        <div className="min-w-[0px] w-[20px] shrink-0" />
        <div className="flex-1 flex items-center pr-4 pl-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {title}
            </h4>
            <div className="h-px bg-slate-100 flex-1 ml-3" />
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-white border-r border-slate-200/60",
          "flex flex-col shadow-sm will-change-[width,box-shadow]",
          "transition-all duration-300 ease-in-out", 
          expanded ? "w-[280px] shadow-2xl shadow-slate-200/50" : "w-[72px]",
          className
        )}
      >
        
        {/* HEADER / LOGO */}
        <div className="flex items-center h-[70px] shrink-0 relative overflow-hidden">
            <div className="flex items-center w-full">
                <div className="min-w-[72px] w-[72px] flex items-center justify-center z-20 bg-white">
                   <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-colors duration-300 ease-in-out",
                    expanded ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-slate-900 text-white"
                   )}>
                      <Box className="h-5 w-5" />
                   </div>
                </div>
                
                <div className={cn(
                  "flex flex-col justify-center whitespace-nowrap pl-1",
                  "transition-all duration-300 ease-in-out",
                  expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                )}>
                  <h1 className="font-bold text-xl tracking-tight text-slate-900 leading-none">Atlas Flow</h1>
                  <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Logistics OS</span>
                </div>
            </div>
        </div>

        {/* SEPARATOR */}
        <div className={cn(
          "w-10 mx-auto h-px bg-slate-100 my-2 transition-all duration-300 ease-in-out",
          expanded ? "opacity-0 h-0 my-0" : "opacity-100"
        )} />

        {/* NAV SCROLL AREA */}
        <div className="flex-1 py-2 overflow-y-auto overflow-x-hidden scrollbar-none space-y-1">
          
          <NavItem path="/dashboard" icon={LayoutDashboard} label="Dashboard" />

          <SectionHeader title="Operations" />
          <NavItem path="/quotes" icon={FileText} label="Quotes (Devis)" />
          <NavItem path="/tariffs" icon={Banknote} label="Tariff Manager" />
          <NavItem path="/dossiers" icon={Ship} label="Shipment Dossiers" />

          <SectionHeader title="Relations" />
          <NavItem path="/clients" icon={Users} label="Customers (Clients)" />
          <NavItem path="/finance" icon={Briefcase} label="Finance Hub" status="soon" statusText="In Dev" />

          <SectionHeader title="Configuration" />
          <NavItem path="/users" icon={UserCog} label="Team Directory" />
          <NavItem path="/settings" icon={Settings} label="Settings" status="soon" statusText="In Dev" />
        </div>

        {/* TOGGLE BUTTON */}
        <div className="shrink-0 p-3 bg-white border-t border-slate-50 z-20">
             <Button
                variant="ghost"
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-start h-10 px-0 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
             >
                 <div className="min-w-[48px] flex justify-center items-center">
                    {expanded ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                 </div>
                 
                 <div className={cn(
                    "whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out pl-1 text-sm font-medium",
                    expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                 )}>
                    Collapse Sidebar
                 </div>
             </Button>
        </div>

        {/* FOOTER */}
        <div className="shrink-0 p-3 bg-white border-t border-slate-50 z-20">
            <div 
              onClick={onLogout}
              className={cn(
                "flex items-center rounded-xl cursor-pointer group hover:bg-slate-50 border border-transparent",
                "transition-all duration-300 ease-in-out",
                expanded ? "p-3 bg-slate-50/50 hover:border-slate-200" : "p-0 justify-center h-12 w-full hover:border-transparent"
              )}
            >
                <div className="min-w-[48px] flex justify-center items-center">
                  <Avatar className={cn(
                    "border-2 border-white shadow-sm transition-all duration-300 ease-in-out",
                    expanded ? "h-9 w-9" : "h-8 w-8"
                  )}>
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs">TU</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className={cn(
                  "flex flex-col whitespace-nowrap overflow-hidden",
                  "transition-all duration-300 ease-in-out",
                  expanded ? "opacity-100 w-auto translate-x-0" : "opacity-0 w-0 -translate-x-4"
                )}>
                    <span className="text-sm font-bold text-slate-800">Test User</span>
                    <span className="text-[10px] text-slate-500 font-medium">Administrator</span>
                </div>

                {expanded && (
                  <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
            </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default Sidebar;