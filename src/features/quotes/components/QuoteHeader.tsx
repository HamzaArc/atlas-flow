import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, ChevronLeft, CheckCircle, XCircle, Copy, Trash2 } from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";

export function QuoteHeader() {
  const { 
    reference, status, clientName, salespersonName, goodsDescription, internalNotes,
    setIdentity, setStatus, saveQuote, duplicateQuote, deleteQuote, id
  } = useQuoteStore();

  const isReadOnly = status !== 'DRAFT';

  const handleDelete = () => {
      if(confirm('Are you sure you want to delete this quote?')) {
          deleteQuote(id);
          // In a real app we'd navigate back here
          window.location.reload(); // Simple reload to go back to empty state or dashboard
      }
  }

  return (
    <div className="flex flex-col border-b bg-white">
      {/* 1. TOP BAR */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-slate-500">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="font-bold text-lg tracking-tight">{reference}</h1>
          <Badge variant={status === 'ACCEPTED' ? 'default' : 'secondary'} className="uppercase">
            {status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
           {/* Duplicate Action */}
           <Button size="sm" variant="outline" onClick={duplicateQuote} title="Duplicate Quote">
               <Copy className="h-4 w-4" />
           </Button>

           {/* Delete Action (Only DRAFT) */}
           {status === 'DRAFT' && (
               <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-400 hover:text-red-600">
                   <Trash2 className="h-4 w-4" />
               </Button>
           )}

           <Separator orientation="vertical" className="h-6 mx-1" />

           {/* Workflow Buttons */}
           {status === 'DRAFT' && (
               <Button size="sm" variant="outline" onClick={() => setStatus('VALIDATION')} className="text-blue-600 border-blue-200">
                  Submit for Validation
               </Button>
           )}
           {status === 'VALIDATION' && (
               <>
                <Button size="sm" variant="ghost" onClick={() => setStatus('DRAFT')} className="text-red-500">
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                </Button>
                <Button size="sm" variant="default" onClick={() => setStatus('SENT')} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                </Button>
               </>
           )}
           
           {/* Save is always available to update notes/state even if read-only for items */}
           <Button size="sm" onClick={saveQuote} className="bg-slate-900">
             <Save className="h-4 w-4 mr-2" />
             Save
           </Button>
        </div>
      </div>

      {/* 2. CONTEXT BAR */}
      <div className="px-6 py-4 bg-slate-50/50 grid grid-cols-12 gap-6 border-t text-sm">
         <div className="col-span-3 space-y-1.5">
            <Label className="text-xs text-slate-500 font-medium uppercase">Customer</Label>
            <Select 
                disabled={isReadOnly}
                value={clientName} 
                onValueChange={(v) => setIdentity('clientName', v)}
            >
                <SelectTrigger className="h-9 bg-white border-slate-300">
                    <SelectValue placeholder="Select Customer..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="TexNord SARL">TexNord SARL</SelectItem>
                    <SelectItem value="Maroc Telecom">Maroc Telecom</SelectItem>
                    <SelectItem value="Renault Tanger">Renault Tanger</SelectItem>
                </SelectContent>
            </Select>
         </div>

         <div className="col-span-3 space-y-1.5">
            <Label className="text-xs text-slate-500 font-medium uppercase">Sales Rep</Label>
             <Select 
                disabled={isReadOnly}
                value={salespersonName} 
                onValueChange={(v) => setIdentity('salespersonName', v)}
            >
                <SelectTrigger className="h-9 bg-white border-slate-300">
                    <SelectValue placeholder="Assign Salesperson" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Youssef (Sales)">Youssef (Sales)</SelectItem>
                    <SelectItem value="Fatima (Ops)">Fatima (Ops)</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
            </Select>
         </div>

         <div className="col-span-3 space-y-1.5">
             <Label className="text-xs text-slate-500 font-medium uppercase">Goods Description</Label>
             <Input 
                disabled={isReadOnly}
                className="h-9 bg-white border-slate-300" 
                placeholder="e.g. Textile Fabrics"
                value={goodsDescription}
                onChange={(e) => setIdentity('goodsDescription', e.target.value)}
             />
         </div>
        
         <div className="col-span-3 space-y-1.5">
             <Label className="text-xs text-slate-500 font-medium uppercase">Internal Notes</Label>
             <Input 
                className="h-9 bg-white border-slate-300" 
                placeholder="Internal use only"
                value={internalNotes}
                onChange={(e) => setIdentity('internalNotes', e.target.value)}
             />
         </div>
      </div>
    </div>
  );
}