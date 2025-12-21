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
    Save, ArrowLeft, Copy, Coins, Settings2, 
    User, Calendar, Hash, Clock, Check, GitBranch, MessageSquare
} from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { Currency } from "@/types/index";
import { cn } from "@/lib/utils";
import { ApprovalAction } from "./ApprovalAction";
import { useToast } from "@/components/ui/use-toast"; // Your custom toast hook

interface QuoteHeaderProps {
    onBack: () => void;
}

const STEPS = [
    { id: 'DRAFT', label: 'Draft' },
    { id: 'VALIDATION', label: 'Review' },
    { id: 'SENT', label: 'Sent' },
    { id: 'ACCEPTED', label: 'Won' }
];

export function QuoteHeader({ onBack }: QuoteHeaderProps) {
  const { 
    reference, status, clientName, validityDate, version,
    salespersonName, cargoReadyDate, customerReference,
    quoteCurrency, exchangeRates, paymentTerms,
    setIdentity, setStatus, saveQuote, duplicateQuote, createRevision,
    setQuoteCurrency, setExchangeRate,
    // Access active option for WhatsApp summary
    mode, incoterm, pol, pod, totalTTCTarget
  } = useQuoteStore();

  // FIX: Destructure toast correctly from your store
  const { toast } = useToast();

  const isReadOnly = status === 'ACCEPTED' || status === 'REJECTED' || status === 'SENT';
  const isLocked = status === 'ACCEPTED' || status === 'REJECTED';

  // --- COMPONENT: WORKFLOW STEPPER ---
  const StatusStepper = () => (
      <div className="flex items-center mr-6 bg-slate-50 rounded-lg p-1 border border-slate-100">
          {STEPS.map((step, idx) => {
              const isActive = step.id === status;
              const currentIdx = STEPS.findIndex(s => s.id === status);
              // Draft is 0, Validation 1, Sent 2. 
              // If status is SENT(2), then DRAFT(0) and VALIDATION(1) are completed.
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

        // Encode and Open WhatsApp Web/App
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
        
        // FIX: Use simple string arguments supported by your useToast store
        toast("WhatsApp opened in new tab", "success");
        
    } catch (error) {
        console.error("WhatsApp Error:", error);
        // FIX: Use simple string arguments supported by your useToast store
        toast("Could not open WhatsApp window", "error");
    }
  };

  const handleRevision = async () => {
      if (confirm(`Create a new version (v${version + 1}) for negotiation? This will duplicate the current quote as a Draft.`)) {
          await createRevision();
      }
  };

  return (
    <div className="flex flex-col border-b bg-white shadow-sm z-20 relative sticky top-0">
      
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
               
               {/* WHATSAPP BUTTON (Direct Link) */}
               <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleWhatsAppShare} 
                    className="h-8 text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    title="Open in WhatsApp"
               >
                   <MessageSquare className="h-3.5 w-3.5 mr-2" /> WhatsApp
               </Button>

               {/* Always allow copying/templating */}
               <Button variant="outline" size="sm" onClick={duplicateQuote} className="h-8 text-xs border-slate-200 text-slate-600">
                   <Copy className="h-3.5 w-3.5 mr-2" /> Copy
               </Button>

               {/* REVISION BUTTON: Appears when we can no longer edit the current one safely */}
               {isReadOnly && (
                   <Button variant="outline" size="sm" onClick={handleRevision} className="h-8 text-xs border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100">
                       <GitBranch className="h-3.5 w-3.5 mr-2" /> Revise (v{version+1})
                   </Button>
               )}

               {!isLocked && (
                   <>
                    {/* INJECTED COMPONENT */}
                    <ApprovalAction />

                    <Button size="sm" onClick={saveQuote} className="h-8 bg-slate-900 hover:bg-slate-800 text-xs px-4 ml-2">
                        <Save className="h-3.5 w-3.5 mr-2" /> Save
                    </Button>
                   </>
               )}
               
               {/* Fallback to re-open if needed manually, but Revision is preferred */}
               {isLocked && !isReadOnly && (
                   <Button size="sm" variant="outline" onClick={() => setStatus('DRAFT')} className="h-8 text-xs">
                        Re-open Quote
                   </Button>
               )}
           </div>
        </div>
      </div>

      {/* 2. BUSINESS CONTEXT GRID */}
      <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-3">
          <div className="grid grid-cols-12 gap-4">
              
              {/* Client Section */}
              <div className="col-span-3 space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" /> Customer Account
                  </Label>
                  <Select 
                      disabled={isReadOnly}
                      value={clientName} 
                      onValueChange={(v) => setIdentity('clientName', v)}
                  >
                      <SelectTrigger className="h-8 bg-white border-slate-200 text-xs focus:ring-blue-500 font-medium shadow-sm">
                          <SelectValue placeholder="Select Customer..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="TexNord SARL">TexNord SARL</SelectItem>
                          <SelectItem value="Maroc Telecom">Maroc Telecom</SelectItem>
                          <SelectItem value="Renault Tanger">Renault Tanger</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

               {/* Payment Terms Selector (Safe Guarded) */}
               <div className="col-span-2 space-y-1">
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
                          <SelectItem value="Cash">Cash / Immediate</SelectItem>
                          <SelectItem value="30 Days">30 Days</SelectItem>
                          <SelectItem value="60 Days">60 Days Check</SelectItem>
                          <SelectItem value="90 Days">90 Days</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

              {/* Customer Reference */}
              <div className="col-span-2 space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Hash className="h-3 w-3" /> Client Ref / RFQ
                  </Label>
                  <Input 
                      className="h-8 bg-white border-slate-200 placeholder:text-slate-300 font-mono text-xs shadow-sm"
                      placeholder="e.g. RFQ-2024-001"
                      value={customerReference}
                      onChange={(e) => setIdentity('customerReference', e.target.value)}
                      disabled={isReadOnly}
                  />
              </div>

              {/* TIMELINE SECTION (Valid To / Cargo Ready) */}
              <div className="col-span-2 space-y-1">
                  <Label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Cargo Ready
                  </Label>
                  <Input 
                      type="date"
                      className="h-8 bg-white border-slate-200 text-xs shadow-sm"
                      value={formatDateForInput(cargoReadyDate)}
                      onChange={(e) => setIdentity('cargoReadyDate', e.target.value)}
                      disabled={isReadOnly}
                  />
              </div>

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

              {/* Sales Owner */}
              <div className="col-span-1 space-y-1 ml-auto">
                  <Label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" /> Rep
                  </Label>
                  <div className="h-8 flex items-center justify-end">
                    <span className="text-xs font-semibold text-slate-600 truncate">
                        {salespersonName ? salespersonName.split(' ')[0] : 'Admin'}
                    </span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}