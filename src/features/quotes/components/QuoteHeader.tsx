import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, ChevronLeft, CheckCircle, XCircle } from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { useNavigate } from "react-router-dom"; // You might need to install react-router-dom

export function QuoteHeader() {
  const { 
    reference, status, clientName, salespersonName, goodsDescription, internalNotes,
    setIdentity, setStatus, saveQuote 
  } = useQuoteStore();

  return (
    <div className="flex flex-col border-b bg-white">
      {/* 1. TOP BAR: Status & Actions */}
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
           {/* Workflow Buttons [Gap 8] */}
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

           <Button size="sm" onClick={saveQuote} className="bg-slate-900">
             <Save className="h-4 w-4 mr-2" />
             Save
           </Button>
        </div>
      </div>

      {/* 2. CONTEXT BAR: Client, Goods, Notes [Gaps 3, 4, 7] */}
      <div className="px-6 py-4 bg-slate-50/50 grid grid-cols-12 gap-6 border-t text-sm">
         
         {/* Client Selector (Mocked for now, but UI ready) */}
         <div className="col-span-3 space-y-1.5">
            <Label className="text-xs text-slate-500 font-medium uppercase">Customer</Label>
            <Select value={clientName} onValueChange={(v) => setIdentity('clientName', v)}>
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

         {/* Salesperson Selector */}
         <div className="col-span-3 space-y-1.5">
            <Label className="text-xs text-slate-500 font-medium uppercase">Sales Rep</Label>
             <Select value={salespersonName} onValueChange={(v) => setIdentity('salespersonName', v)}>
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

         {/* Goods Description [Gap 7] */}
         <div className="col-span-3 space-y-1.5">
             <Label className="text-xs text-slate-500 font-medium uppercase">Goods Description</Label>
             <Input 
                className="h-9 bg-white border-slate-300" 
                placeholder="e.g. Textile Fabrics (Rolls)"
                value={goodsDescription}
                onChange={(e) => setIdentity('goodsDescription', e.target.value)}
             />
         </div>
        
         {/* Internal Notes */}
         <div className="col-span-3 space-y-1.5">
             <Label className="text-xs text-slate-500 font-medium uppercase">Internal Notes</Label>
             <Input 
                className="h-9 bg-white border-slate-300" 
                placeholder="e.g. Competitor offering $1100"
                value={internalNotes}
                onChange={(e) => setIdentity('internalNotes', e.target.value)}
             />
         </div>

      </div>
    </div>
  );
}