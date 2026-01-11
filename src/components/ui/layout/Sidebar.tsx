import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Ship, 
  Settings, 
  Users, 
  Briefcase,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Box,
  Banknote,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen
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
    currentView: string;
    onNavigate: (view: 'dashboard' | 'dossier' | 'crm' | 'finance' | 'tariffs' | 'users') => void;
    onLogout?: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

export function Sidebar({ 
  className, 
  currentView, 
  onNavigate, 
  onLogout, 
  collapsed, 
  onToggleCollapse 
}: SidebarProps) {
  
  // Enhanced NavItem to support Status Flags and Tooltips for collapsed state
  const NavItem = ({ 
      icon: Icon, 
      label, 
      active = false, 
      onClick,
      status,       // 'beta' | 'soon'
      statusText    // The text to display
  }: { 
      id: string, 
      icon: any, 
      label: string, 
      active?: boolean, 
      onClick: () => void,
      status?: 'beta' | 'soon',
      statusText?: string
  }) => {
      const isSoon = status === 'soon';

      // Base Button Content
      const ButtonContent = (
        <Button 
          variant="ghost" 
          onClick={isSoon ? undefined : onClick}
          disabled={isSoon}
          className={cn(
              "w-full group transition-all duration-200", 
              // Expanded vs Collapsed Padding/Layout
              collapsed ? "h-10 w-10 p-0 justify-center rounded-lg" : "justify-between px-3 py-2 h-auto min-h-[44px] mb-1 items-start",
              
              // Active State Styles
              active 
                  ? (collapsed 
                      ? "bg-blue-50 text-blue-600" 
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-r-2 border-blue-600 rounded-r-none")
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              
              isSoon && "opacity-60 cursor-not-allowed hover:bg-transparent"
          )}
        >
          {/* Icon Container */}
          <div className={cn("flex items-center", collapsed ? "justify-center w-full" : "flex-col w-full text-left")}>
              
              {/* Row for Icon + Label (Expanded) */}
              <div className="flex items-center">
                  <Icon className={cn(
                    "transition-colors",
                    collapsed ? "h-5 w-5" : "mr-3 h-4 w-4 mt-0.5", 
                    active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  
                  {!collapsed && (
                    <span className={cn("text-sm font-medium", active ? "font-semibold" : "")}>
                      {label}
                    </span>
                  )}
              </div>
              
              {/* Status Flag (Expanded Only) */}
              {!collapsed && status && statusText && (
                  <span className={cn(
                      "ml-7 text-[9px] leading-none font-semibold uppercase tracking-wide mt-1.5 w-fit px-1.5 py-[2px] rounded border",
                      status === 'beta' && "bg-blue-50 text-blue-600 border-blue-200", 
                      status === 'soon' && "bg-slate-50 text-slate-400 border-slate-200"
                  )}>
                      {statusText}
                  </span>
              )}
          </div>
          
          {/* Active Indicator Chevron (Expanded Only) */}
          {!collapsed && active && <ChevronRight className="h-3 w-3 text-blue-600 opacity-50 mt-1" />}
        </Button>
      );

      // Wrap in Tooltip if Collapsed
      if (collapsed) {
        return (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="w-full flex justify-center mb-2">
                {ButtonContent}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              <span>{label}</span>
              {status && (
                <span className={cn(
                  "text-[9px] uppercase font-bold px-1 rounded border",
                  status === 'beta' ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-slate-50 text-slate-400 border-slate-200"
                )}>
                  {status}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        );
      }

      return ButtonContent;
  };

  const SectionHeader = ({ title }: { title: string }) => {
    if (collapsed) return <div className="h-4 w-full"></div>;
    return <h4 className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</h4>;
  };

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-screen bg-white", className)}>
        
        {/* HEADER */}
        <div className={cn("flex items-center transition-all duration-300", collapsed ? "p-4 justify-center" : "p-6 pb-4 justify-between")}>
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-8 w-8 min-w-[32px] bg-slate-900 rounded-lg flex items-center justify-center shadow-md">
                    <Box className="h-5 w-5 text-white" />
                </div>
                {!collapsed && (
                  <div className="whitespace-nowrap">
                      <h1 className="font-bold text-lg tracking-tight text-slate-900 leading-none">Atlas Flow</h1>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Logistics OS</span>
                  </div>
                )}
            </div>
            
            {!collapsed && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={onToggleCollapse}>
                 <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
        </div>

        {/* Separator / Toggle for Collapsed State */}
        <div className={cn("px-4 mb-2 flex items-center", collapsed ? "justify-center" : "")}>
            {collapsed ? (
               <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600 mb-2" onClick={onToggleCollapse}>
                 <PanelLeftOpen className="h-4 w-4" />
               </Button>
            ) : (
               <div className="h-px bg-slate-100 w-full"></div>
            )}
        </div>

        {/* NAV ITEMS */}
        <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-none">
          <div>
              <SectionHeader title="Operations" />
              <div className="space-y-0.5">
                  <NavItem 
                      id="dashboard" 
                      icon={FileText} 
                      label="Quote Engine" 
                      active={currentView === 'dashboard' || currentView === 'create'}
                      onClick={() => onNavigate('dashboard')} 
                      status="beta"
                      statusText="Beta"
                  />
                  <NavItem 
                      id="tariffs" 
                      icon={Banknote} 
                      label="Tariff Manager" 
                      active={currentView === 'tariffs'}
                      onClick={() => onNavigate('tariffs')} 
                      status="beta"
                      statusText="Beta"
                  />
                  <NavItem 
                      id="dossier" 
                      icon={Ship} 
                      label="Shipment Dossiers" 
                      active={currentView === 'dossier'}
                      onClick={() => onNavigate('dossier')} 
                      status="soon"
                      statusText="Soon"
                  />
              </div>
          </div>

          <div>
              <SectionHeader title="Business" />
              <div className="space-y-0.5">
                  <NavItem 
                      id="crm" 
                      icon={Users} 
                      label="CRM (Clients)" 
                      active={currentView === 'crm'} 
                      onClick={() => onNavigate('crm')} 
                      status="beta"
                      statusText="Beta"
                  />
                  <NavItem 
                      id="finance" 
                      icon={Briefcase} 
                      label="Finance & Billing" 
                      active={currentView === 'finance'} 
                      onClick={() => onNavigate('finance')} 
                      status="soon"
                      statusText="Soon"
                  />
              </div>
          </div>

          <div>
              <SectionHeader title="System" />
              <div className="space-y-0.5">
                  <NavItem 
                      id="users" 
                      icon={UserCog} 
                      label="User Directory" 
                      active={currentView === 'users'} 
                      onClick={() => onNavigate('users')} 
                      status="beta"
                      statusText="Beta"
                  />
                  <NavItem 
                      id="analytics" 
                      icon={LayoutDashboard} 
                      label="Analytics" 
                      onClick={() => {}} 
                      status="soon"
                      statusText="Soon"
                  />
                  <NavItem 
                      id="settings" 
                      icon={Settings} 
                      label="Settings" 
                      onClick={() => {}} 
                      status="soon"
                      statusText="Soon"
                  />
              </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div 
              onClick={onLogout}
              className={cn(
                "flex items-center cursor-pointer rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200",
                collapsed ? "justify-center p-2" : "justify-between p-2 group"
              )}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-8 w-8 border border-slate-200">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold">TU</AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                      <div className="flex flex-col whitespace-nowrap">
                          <span className="text-sm font-semibold text-slate-700">Test User</span>
                          <span className="text-[10px] text-slate-500">Admin Access</span>
                      </div>
                    )}
                </div>
                {!collapsed && (
                  <LogOut className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500" />
                )}
            </div>
        </div>
      </div>
    </TooltipProvider>
  );
}