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
import { Save, ArrowLeft, CheckCircle, XCircle, Copy, Trash2, Coins, Settings2, User, Target, Calendar, Hash, Clock } from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { Currency, Probability } from "@/types/index";

interface QuoteHeaderProps {
    onBack: () => void;
}

export function QuoteHeader({ onBack }: QuoteHeaderProps) {
  const { 
    reference, status, clientName, validityDate,
    salespersonName, probability, cargoReadyDate, competitorInfo, customerReference,
    quoteCurrency, exchangeRates,
    setIdentity, setStatus, saveQuote, duplicateQuote, deleteQuote, id,
    setQuoteCurrency, setExchangeRate
  } = useQuoteStore();

  const isReadOnly = status !== 'DRAFT';

  const handleDelete = () => {
      if(confirm('Are you sure you want to delete this quote?')) {
          deleteQuote(id);
          window.location.reload(); 
      }
  }

  return (
    <div className="flex flex-col border-b bg-white shadow-sm z-20 relative">
      
      {/* 1. TOP BAR */}
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          {/* Integrated Back Button - No Absolute Positioning */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 pr-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="font-semibold text-xs">Back</span>
          </Button>

          <div className="h-6 w-px bg-slate-200 mx-2"></div>

          <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="font-bold text-xl tracking-tight text-slate-900">{reference}</h1>
                <Badge variant={status === 'ACCEPTED' ? 'default' : 'secondary'} className="uppercase text-[10px] tracking-wider font-bold">
                    {status}
                </Badge>
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">Created on {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100 mr-4 shadow-sm">
               <Select value={quoteCurrency} onValueChange={(v) => setQuoteCurrency(v as Currency)} disabled={isReadOnly}>
                   <SelectTrigger className="h-8 w-28 text-xs font-semibold bg-white border-none shadow-sm">
                       <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                       <SelectItem value="MAD">MAD (DH)</SelectItem>
                       <SelectItem value="USD">USD ($)</SelectItem>
                       <SelectItem value="EUR">EUR (€)</SelectItem>
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
                           <Coins className="h-4 w-4 text-blue-500" /> Exchange Rates (Base: MAD)
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

           {status === 'DRAFT' ? (
               <>
                <Button variant="outline" size="sm" onClick={duplicateQuote} className="text-slate-600 border-slate-300">
                    <Copy className="h-4 w-4 mr-2" /> Duplicate
                </Button>
                <Button size="sm" onClick={saveQuote} className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200">
                    <Save className="h-4 w-4 mr-2" />
                    Save Quote
                </Button>
               </>
           ) : (
               <div className="flex gap-2">
                   <Button size="sm" variant="ghost" onClick={() => setStatus('DRAFT')} className="text-slate-500">
                        Back to Draft
                   </Button>
                   <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark Accepted
                   </Button>
               </div>
           )}
        </div>
      </div>

      {/* 2. BUSINESS CONTEXT GRID */}
      <div className="bg-slate-50 border-t border-b px-6 py-4">
          <div className="grid grid-cols-12 gap-6">
              
              {/* Client Section */}
              <div className="col-span-3 space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Customer Account</Label>
                  <Select 
                      disabled={isReadOnly}
                      value={clientName} 
                      onValueChange={(v) => setIdentity('clientName', v)}
                  >
                      <SelectTrigger className="h-9 bg-white border-slate-200 focus:ring-blue-500 font-medium">
                          <SelectValue placeholder="Select Customer..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="TexNord SARL">TexNord SARL</SelectItem>
                          <SelectItem value="Maroc Telecom">Maroc Telecom</SelectItem>
                          <SelectItem value="Renault Tanger">Renault Tanger</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

              {/* Customer Reference */}
              <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                      <Hash className="h-3 w-3" /> Client Ref / RFQ
                  </Label>
                  <Input 
                      className="h-9 bg-white border-slate-200 placeholder:text-slate-300 font-mono text-xs"
                      placeholder="e.g. RFQ-2024-001"
                      value={customerReference}
                      onChange={(e) => setIdentity('customerReference', e.target.value)}
                  />
              </div>

              {/* TIMELINE SECTION (Valid To / Cargo Ready) */}
              <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Cargo Ready
                  </Label>
                  <Input 
                      type="date"
                      className="h-9 bg-white border-slate-200"
                      value={cargoReadyDate}
                      onChange={(e) => setIdentity('cargoReadyDate', e.target.value)}
                  />
              </div>

              <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-red-500 tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Valid Until
                  </Label>
                  <Input 
                      type="date"
                      className="h-9 bg-white border-red-100 text-red-600 font-medium"
                      value={validityDate}
                      onChange={(e) => setIdentity('validityDate', e.target.value)}
                  />
              </div>

              {/* Sales Owner */}
              <div className="col-span-3 space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" /> Sales Owner
                  </Label>
                  <Select 
                      disabled={isReadOnly}
                      value={salespersonName} 
                      onValueChange={(v) => setIdentity('salespersonName', v)}
                  >
                      <SelectTrigger className="h-9 bg-white border-slate-200">
                          <SelectValue placeholder="Assign Salesperson" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Youssef (Sales)">Youssef (Sales)</SelectItem>
                          <SelectItem value="Fatima (Ops)">Fatima (Ops)</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

          </div>
      </div>
    </div>
  );
}