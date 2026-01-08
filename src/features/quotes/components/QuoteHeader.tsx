import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { 
    Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { 
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem 
} from "@/components/ui/command";
import { 
    Save, ArrowLeft, Copy, Coins, Settings2, 
    User, Clock, Check, GitBranch, MessageSquare, ChevronsUpDown
} from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { useClientStore } from "@/store/useClientStore"; 
import { useUserStore } from "@/store/useUserStore"; // Import User Store
import { Currency } from "@/types/index";
import { cn } from "@/lib/utils";
import { ApprovalAction } from "./ApprovalAction";
import { useToast } from "@/components/ui/use-toast";

interface QuoteHeaderProps {
    onBack: () => void;
}

const STEPS = [
    { id: 'DRAFT', label: 'Draft' },
    { id: 'VALIDATION', label: 'Review' },
    { id: 'SENT', label: 'Sent' },
    { id: 'ACCEPTED', label: 'Won' }
];

const STANDARD_PAYMENT_TERMS = ["Cash", "30 Days", "60 Days", "NET_60", "90 Days"];

export function QuoteHeader({ onBack }: QuoteHeaderProps) {
  // Quote Store
  const { 
    reference, status, clientName, clientId, validityDate, version,
    salespersonId, 
    quoteCurrency, exchangeRates, paymentTerms,
    setIdentity, setClientSnapshot, setStatus, saveQuote, duplicateQuote, createRevision,
    setQuoteCurrency, setExchangeRate,
    totalTTCTarget, mode, incoterm, pol, pod
  } = useQuoteStore();

  // Client Store Integration
  const { clients, fetchClients } = useClientStore();
  // User Store Integration
  const { users, fetchUsers } = useUserStore();
  
  const { toast } = useToast();
  
  // Local State for Combobox
  const [openClient, setOpenClient] = useState(false);

  // Initialize Data
  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, [fetchClients, fetchUsers]);

  const isReadOnly = status === 'ACCEPTED' || status === 'REJECTED' || status === 'SENT';
  const isLocked = status === 'ACCEPTED' || status === 'REJECTED';

  // --- FILTERS ---
  const salesReps = users.filter(u => ['SALES', 'MANAGER', 'DIRECTOR', 'ADMIN'].includes(u.role));

  // --- DYNAMIC PAYMENT TERMS ---
  // Ensure we display the current payment term even if it's not in the standard list
  const displayPaymentTerms = useMemo(() => {
      const current = paymentTerms || '30 Days';
      const termsSet = new Set([...STANDARD_PAYMENT_TERMS, current]);
      return Array.from(termsSet);
  }, [paymentTerms]);

  // --- HANDLER: SMART CLIENT SELECTION ---
  const handleClientSelect = (selectedId: string) => {
    const client = clients.find(c => c.id === selectedId);
    if (!client) return;

    // Resolve Sales Rep from Client
    let assignedRepId = undefined;
    let assignedRepName = undefined;

    // Mission 2: Auto-pull sales representative from customer
    if (client.salesRepId) {
        const rep = users.find(u => u.id === client.salesRepId);
        if (rep) {
            assignedRepId = rep.id;
            assignedRepName = rep.fullName;
        }
    }

    // Use Centralized Snapshot Setter
    setClientSnapshot({
        id: client.id,
        name: client.entityName,
        terms: client.financials.paymentTerms || '30 Days',
        taxId: client.financials.taxId,
        ice: client.financials.ice,
        salespersonId: assignedRepId,
        salespersonName: assignedRepName
    });
    
    setOpenClient(false);
  };

  // --- COMPONENT: WORKFLOW STEPPER ---
  const StatusStepper = () => (
      <div className="flex items-center mr-6 bg-slate-50 rounded-lg p-1 border border-slate-200">
          {STEPS.map((step, idx) => {
              const isActive = step.id === status;
              const currentIdx = STEPS.findIndex(s => s.id === status);
              const isCompleted = idx < currentIdx;

              return (
                  <div key={step.id} className="flex items-center">
                      <div 
                          className={cn(
                              "flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                              isActive ? "bg-white text-blue-700 shadow-sm border border-slate-100" : 
                              isCompleted ? "text-emerald-600" : "text-slate-400"
                          )}
                      >
                          {isCompleted && <Check className="h-3 w-3 mr-1" />}
                          {step.label}
                      </div>
                      {idx < STEPS.length - 1 && (
                          <div className="h-3 w-px bg-slate-200 mx-1"></div>
                      )}
                  </div>
              )
          })}
      </div>
  );

  // --- HELPER: Safe Date String ---
  const formatDateForInput = (dateVal: string | Date) => {
      if (!dateVal) return '';
      if (typeof dateVal === 'string') return dateVal.split('T')[0];
      return dateVal.toISOString().split('T')[0];
  };

  // --- ACTION: WHATSAPP DIRECT LINK ---
  const handleWhatsAppShare = () => {
    try {
        const totalDisplay = totalTTCTarget 
            ? totalTTCTarget.toLocaleString('en-US', { maximumFractionDigits: 2 }) 
            : '0.00';

        const text = 
`🚢 *Quote Ref: ${reference}*
📍 ${pol || 'POL'} ➡️ ${pod || 'POD'}
📦 ${mode} | ${incoterm}
💰 *Total: ${totalDisplay} ${quoteCurrency}* (All In)
⏳ Valid until: ${formatDateForInput(validityDate)}`;

        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        toast("WhatsApp opened in new tab", "success");
    } catch (error) {
        console.error("WhatsApp Error:", error);
        toast("Could not open WhatsApp window", "error");
    }
  };

  const handleRevision = async () => {
      if (confirm(`Create a new version (v${version + 1}) for negotiation? This will duplicate the current quote as a Draft.`)) {
          await createRevision();
      }
  };

  return (
    <div className="flex flex-col border-b bg-white shadow-sm z-20 sticky top-0">
      
      {/* 1. TOP BAR */}
      <div className="flex items-center justify-between px-6 h-16 bg-white">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 pr-3 h-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="font-semibold text-xs">Dashboard</span>
          </Button>

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-slate-900">{reference}</h1>
                <Badge variant="secondary" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-100">
                    v{version}
                </Badge>
                {isLocked && <Badge variant="outline" className="text-[10px] h-5 bg-slate-50 text-slate-500">Locked</Badge>}
              </div>
          </div>
        </div>

        <div className="flex items-center">
           <StatusStepper />

           <div className="h-6 w-px bg-slate-200 mx-4"></div>

           {/* Currency Selector */}
           <div className="flex items-center gap-1 mr-4">
               <Select value={quoteCurrency} onValueChange={(v) => setQuoteCurrency(v as Currency)} disabled={isLocked}>
                   <SelectTrigger className="h-8 w-24 text-xs font-semibold bg-slate-50 border-slate-200 focus:ring-0">
                       <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                       <SelectItem value="MAD">MAD</SelectItem>
                       <SelectItem value="USD">USD</SelectItem>
                       <SelectItem value="EUR">EUR</SelectItem>
                   </SelectContent>
               </Select>
               <Popover>
                   <PopoverTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                           <Settings2 className="h-4 w-4" />
                       </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-72 p-4" align="end">
                       <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-800">
                           <Coins className="h-4 w-4 text-blue-500" /> Exchange Rates
                       </h4>
                       <div className="space-y-3 bg-slate-50 p-3 rounded-md border">
                           <div className="grid grid-cols-4 gap-2 items-center">
                               <Label className="text-xs font-medium col-span-1">USD</Label>
                               <Input 
                                   type="number" 
                                   className="col-span-3 h-8 text-xs bg-white" 
                                   value={exchangeRates.USD}
                                   onChange={(e) => setExchangeRate('USD', parseFloat(e.target.value))}
                               />
                           </div>
                           <div className="grid grid-cols-4 gap-2 items-center">
                               <Label className="text-xs font-medium col-span-1">EUR</Label>
                               <Input 
                                   type="number" 
                                   className="col-span-3 h-8 text-xs bg-white" 
                                   value={exchangeRates.EUR}
                                   onChange={(e) => setExchangeRate('EUR', parseFloat(e.target.value))}
                               />
                           </div>
                       </div>
                   </PopoverContent>
               </Popover>
           </div>

           {/* Action Buttons */}
           <div className="flex gap-2 items-center">
               
               <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleWhatsAppShare} 
                    className="h-8 text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    title="Open in WhatsApp"
               >
                   <MessageSquare className="h-3.5 w-3.5 mr-2" /> WhatsApp
               </Button>

               <Button variant="outline" size="sm" onClick={duplicateQuote} className="h-8 text-xs border-slate-200 text-slate-600">
                   <Copy className="h-3.5 w-3.5 mr-2" /> Copy
               </Button>

               {isReadOnly && (
                   <Button variant="outline" size="sm" onClick={handleRevision} className="h-8 text-xs border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100">
                       <GitBranch className="h-3.5 w-3.5 mr-2" /> Revise (v{version+1})
                   </Button>
               )}

               {!isLocked && (
                   <>
                    <ApprovalAction />
                    <Button size="sm" onClick={saveQuote} className="h-8 bg-slate-900 hover:bg-slate-800 text-xs px-4 ml-2">
                        <Save className="h-3.5 w-3.5 mr-2" /> Save
                    </Button>
                   </>
               )}
               
               {isLocked && !isReadOnly && (
                   <Button size="sm" variant="outline" onClick={() => setStatus('DRAFT')} className="h-8 text-xs">
                        Re-open Quote
                   </Button>
               )}
           </div>
        </div>
      </div>

      {/* 2. BUSINESS CONTEXT GRID - ADJUSTED */}
      <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-3">
          <div className="grid grid-cols-12 gap-4">
              
              {/* SMART CLIENT SELECTOR (Expanded to col-span-4) */}
              <div className="col-span-4 space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" /> Customer Account
                  </Label>
                  <Popover open={openClient} onOpenChange={setOpenClient}>
                      <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openClient}
                              disabled={isReadOnly}
                              className="h-8 w-full justify-between bg-white border-slate-200 text-xs font-medium shadow-sm focus:ring-blue-500"
                          >
                              {clientName || "Select Customer..."}
                              <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                              <CommandInput placeholder="Search client directory..." className="h-8 text-xs" />
                              <CommandEmpty>No client found.</CommandEmpty>
                              <CommandGroup>
                                  {clients.map((client) => (
                                      <CommandItem
                                          key={client.id}
                                          value={client.entityName}
                                          onSelect={() => handleClientSelect(client.id)}
                                          className="text-xs"
                                      >
                                          <Check
                                              className={cn(
                                                  "mr-2 h-3 w-3",
                                                  clientId === client.id ? "opacity-100" : "opacity-0"
                                              )}
                                          />
                                          <div className="flex flex-col">
                                              <span>{client.entityName}</span>
                                              <span className="text-[10px] text-slate-400">
                                                  {client.type} • {client.city}
                                              </span>
                                          </div>
                                      </CommandItem>
                                  ))}
                              </CommandGroup>
                          </Command>
                      </PopoverContent>
                  </Popover>
              </div>

               {/* Payment Terms Selector (col-span-3) - MISSION 1: DYNAMIC OPTIONS */}
               <div className="col-span-3 space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Coins className="h-3 w-3" /> Payment Terms
                  </Label>
                  <Select 
                      disabled={isReadOnly}
                      value={paymentTerms || '30 Days'} 
                      onValueChange={(v) => setIdentity('paymentTerms', v)}
                  >
                      <SelectTrigger className="h-8 bg-white border-slate-200 text-xs shadow-sm">
                          <SelectValue placeholder="Terms" />
                      </SelectTrigger>
                      <SelectContent>
                          {displayPaymentTerms.map((term) => (
                              <SelectItem key={term} value={term}>
                                  {term}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>

              {/* Valid Until (col-span-2) */}
              <div className="col-span-2 space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-red-400 tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Valid Until
                  </Label>
                  <Input 
                      type="date"
                      className="h-8 bg-white border-red-100 text-red-600 font-medium text-xs shadow-sm focus:border-red-300 focus:ring-red-100"
                      value={formatDateForInput(validityDate)}
                      onChange={(e) => setIdentity('validityDate', e.target.value)}
                      disabled={isReadOnly}
                  />
              </div>

              {/* Sales Owner (col-span-3) */}
              <div className="col-span-3 space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" /> Sales Rep
                  </Label>
                  <Select 
                      disabled={isReadOnly}
                      value={salespersonId} 
                      onValueChange={(v) => {
                          const user = users.find(u => u.id === v);
                          if(user) {
                             setIdentity('salespersonId', user.id);
                             setIdentity('salespersonName', user.fullName);
                          }
                      }}
                  >
                      <SelectTrigger className="h-8 w-full bg-white border-slate-200 text-xs shadow-sm focus:ring-blue-500 font-medium">
                          <SelectValue placeholder="Select Rep..." />
                      </SelectTrigger>
                      <SelectContent>
                          {salesReps.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                  {user.fullName}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          </div>
      </div>
    </div>
  );
}