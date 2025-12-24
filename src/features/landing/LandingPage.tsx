import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Globe, 
  Users, 
  FileText, 
  Ship, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Anchor,
  Box,
  CheckCircle2,
  Lock,
  UserCog
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reusable component for the 'Under Construction' overlay to ensure 100% consistency
  const ConstructionOverlay = () => (
    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
      <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full flex items-center gap-2">
        <Lock className="w-4 h-4 text-yellow-500" />
        <span className="text-yellow-500 text-sm font-semibold">Under Construction</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-[#020617]/80 backdrop-blur-md border-blue-900/30 py-4' : 'bg-transparent border-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              Atlas Flow
            </span>
          </div>
          <Button 
            onClick={onEnterApp}
            className="bg-white text-[#020617] hover:bg-blue-50 font-semibold rounded-full px-6 transition-all hover:scale-105"
          >
            Launch System
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-800/50 mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-sm font-medium text-blue-200 tracking-wide">v0.0.1 SYSTEM PREVIEW</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight animate-fade-in-up delay-100">
            Orchestrate Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
              Global Logistics
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up delay-200">
            An advanced operating system for modern freight forwarders. 
            Seamlessly bridge the gap between client acquisition, complex quoting, 
            and shipment execution in one unified interface.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-300">
            <Button 
              onClick={onEnterApp}
              size="lg" 
              className="h-14 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105"
            >
              Enter Workspace <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-8 rounded-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}
            >
              System Walkthrough
            </Button>
          </div>
        </div>
      </section>

      {/* The Workflow Engine */}
      <section id="workflow" className="py-24 relative border-t border-slate-800/50 bg-[#020617]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">The Logic Flow</h2>
            <p className="text-slate-400">How data travels through the Atlas Flow ecosystem.</p>
          </div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-900 to-transparent -translate-y-1/2" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 transition-all duration-300">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#020617] p-2 border border-slate-800 rounded-full group-hover:border-blue-500 transition-colors">
                  <div className="bg-blue-900/20 p-3 rounded-full text-blue-400">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mt-4 mb-2 text-center text-blue-100">CRM & Intake</h3>
                <p className="text-sm text-slate-400 text-center">
                  Capture client requirements, manage contacts, and track relationship history.
                </p>
              </div>

              {/* Step 2 */}
              <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl hover:border-cyan-500/50 transition-all duration-300">
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#020617] p-2 border border-slate-800 rounded-full group-hover:border-cyan-500 transition-colors">
                  <div className="bg-cyan-900/20 p-3 rounded-full text-cyan-400">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mt-4 mb-2 text-center text-cyan-100">Smart Quoting</h3>
                <p className="text-sm text-slate-400 text-center">
                  Generate complex multi-leg quotes using live tariff data and cargo logic.
                </p>
              </div>

              {/* Step 3 */}
              <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl hover:border-indigo-500/50 transition-all duration-300">
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#020617] p-2 border border-slate-800 rounded-full group-hover:border-indigo-500 transition-colors">
                  <div className="bg-indigo-900/20 p-3 rounded-full text-indigo-400">
                    <Ship className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mt-4 mb-2 text-center text-indigo-100">Dossier Ops</h3>
                <p className="text-sm text-slate-400 text-center">
                  Convert approved quotes into active shipments. Track container milestones.
                </p>
              </div>

              {/* Step 4 */}
              <div className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/50 transition-all duration-300">
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#020617] p-2 border border-slate-800 rounded-full group-hover:border-emerald-500 transition-colors">
                  <div className="bg-emerald-900/20 p-3 rounded-full text-emerald-400">
                    <CreditCard className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mt-4 mb-2 text-center text-emerald-100">Finance</h3>
                <p className="text-sm text-slate-400 text-center">
                  Automated invoicing, profit/loss analysis, and WIP management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Module Showcase (Bento Grid) */}
      <section className="py-24 bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">System Modules</h2>
              <p className="text-slate-400 max-w-xl">
                A granular look at the components powering Atlas Flow. 
                Some modules are currently in active development.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* --- ROW 1 --- */}

            {/* Card: Quote Workspace (Active) - Spans 2 */}
            <div className="col-span-1 md:col-span-2 bg-slate-900 rounded-3xl p-8 border border-slate-800 hover:border-blue-500/30 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Box className="w-64 h-64 text-blue-500 transform rotate-12 translate-x-10 -translate-y-10" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Box className="w-8 h-8 text-blue-400" />
                  </div>
                  <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20">Live System</Badge>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Quote Workspace</h3>
                <p className="text-slate-400 mb-6 max-w-md">
                  Advanced rate calculation engine with support for multi-modal transport, 
                  custom margins, and PDF generation.
                </p>
                <ul className="space-y-2 mb-8">
                  <li className="flex items-center text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-blue-500" /> Route Optimization
                  </li>
                  <li className="flex items-center text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-blue-500" /> Auto-PDF Generation
                  </li>
                  <li className="flex items-center text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-blue-500" /> Client Approval Workflow
                  </li>
                </ul>
              </div>
            </div>

            {/* Card: Client CRM (Active) - Spans 1 */}
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 hover:border-purple-500/30 transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Users className="w-32 h-32 text-purple-500 transform -rotate-12 translate-x-8 -translate-y-8" />
               </div>
               <div className="relative z-10">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-purple-500/10 rounded-xl">
                        <Users className="w-8 h-8 text-purple-400" />
                      </div>
                      <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20">Live System</Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">Client CRM</h3>
                    <p className="text-sm text-slate-400">
                      Comprehensive client database with contact management, document archives, and activity logging.
                    </p>
                </div>
            </div>

            {/* --- ROW 2 --- */}

            {/* Card: Tariffs (Active) - Spans 1 */}
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 hover:border-cyan-500/30 transition-all">
               <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <Anchor className="w-8 h-8 text-cyan-400" />
                  </div>
                  <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20">Live System</Badge>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">Tariff Management</h3>
                <p className="text-sm text-slate-400">
                  Centralized rate repository for air, sea, and road freight. 
                  Manage carrier contracts and spot rates.
                </p>
            </div>

            {/* Card: Users (Active) - Spans 1 */}
             <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 hover:border-pink-500/30 transition-all">
               <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-pink-500/10 rounded-xl">
                    <UserCog className="w-8 h-8 text-pink-400" />
                  </div>
                  <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20">Live System</Badge>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">User Directory</h3>
                <p className="text-sm text-slate-400">
                  Role-based access control, user profiles, and performance metrics tracking.
                </p>
            </div>

            {/* Card: Dossiers (Construction) - Spans 1 */}
             <div className="bg-slate-900/50 rounded-3xl p-8 border border-slate-800/50 dashed-border relative overflow-hidden">
               <ConstructionOverlay />
               <div className="flex justify-between items-start mb-6 opacity-50">
                  <div className="p-3 bg-indigo-500/10 rounded-xl">
                    <Ship className="w-8 h-8 text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white opacity-50">Shipment Dossiers</h3>
                <p className="text-sm text-slate-400 opacity-50">
                  End-to-end shipment execution, document bucket system, and container tracking.
                </p>
            </div>

            {/* --- ROW 3 --- */}

            {/* Card: Finance (Construction) - Spans 2 */}
            <div className="col-span-1 md:col-span-2 bg-slate-900/50 rounded-3xl p-8 border border-slate-800/50 dashed-border relative overflow-hidden h-full">
               <ConstructionOverlay />
               <div className="relative z-10 opacity-50 h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <CreditCard className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Finance & Billing</h3>
                <p className="text-slate-400 mb-6 flex-grow">
                  Complete ledger for invoicing, incoming bills, and profit/loss reporting per dossier.
                  Includes automated tax calculations and currency conversion.
                </p>
                 <div className="grid grid-cols-3 gap-4 mt-auto">
                     <div className="h-20 bg-slate-800 rounded-lg col-span-2"></div>
                     <div className="h-20 bg-slate-800 rounded-lg"></div>
                 </div>
              </div>
            </div>

            {/* Stack: Analytics & Settings (Construction) - Spans 1 (Vertical Bento) */}
            <div className="flex flex-col gap-6 h-full">
                {/* Analytics */}
                <div className="relative overflow-hidden bg-slate-900/50 rounded-3xl p-6 border border-slate-800/50 dashed-border flex-1">
                     <ConstructionOverlay />
                    <div className="flex items-center gap-3 mb-2 opacity-40">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                             <BarChart3 className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="font-semibold text-white">Analytics</span>
                    </div>
                    <div className="space-y-2 mt-4 opacity-20">
                        <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                        <div className="h-2 bg-slate-700 rounded w-1/2"></div>
                    </div>
                </div>

                {/* Settings */}
                <div className="relative overflow-hidden bg-slate-900/50 rounded-3xl p-6 border border-slate-800/50 dashed-border flex-1">
                     <ConstructionOverlay />
                    <div className="flex items-center gap-3 mb-2 opacity-40">
                         <div className="p-2 bg-slate-500/10 rounded-lg">
                            <Settings className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="font-semibold text-white">System Settings</span>
                    </div>
                    <div className="space-y-2 mt-4 opacity-20">
                        <div className="h-2 bg-slate-700 rounded w-full"></div>
                        <div className="h-2 bg-slate-700 rounded w-2/3"></div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 bg-[#020617] text-center">
        <div className="container mx-auto px-6">
             <div className="flex items-center justify-center gap-2 mb-4">
                <Globe className="h-4 w-4 text-slate-500" />
                <span className="text-lg font-bold text-slate-300">Atlas Flow</span>
             </div>
             <p className="text-slate-600 text-sm">
                 &copy; 2024 Atlas Flow Logistics System. All rights reserved. <br/>
                 Restricted Access. Authorized Personnel Only.
             </p>
        </div>
      </footer>
    </div>
  );
}