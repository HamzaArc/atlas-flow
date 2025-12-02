import { useEffect } from "react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { WIPWorkbench } from "./components/WIPWorkbench";
import { Card } from "@/components/ui/card";
import { FileText, MoreHorizontal, CheckCircle2, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function DossierFinanceTab({ dossierId }: { dossierId: string }) {
    const { loadLedger, generateInvoice, invoices, updateInvoiceStatus, createCreditNote } = useFinanceStore();

    useEffect(() => {
        loadLedger(dossierId);
    }, [dossierId]);

    const handleGenerateInvoice = (ids: string[]) => {
        if(confirm(`Generate final invoice for ${ids.length} selected items? This will lock the charges.`)) {
            generateInvoice(dossierId, ids, 'INVOICE');
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            {/* 1. Workbench (Takes up most space) */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <WIPWorkbench onSelectForInvoice={handleGenerateInvoice} />
            </div>

            {/* 2. Invoice History Strip (Fixed Bottom) */}
            <div className="h-40 shrink-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col z-20">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" /> Billing History
                    </h3>
                </div>
                <div className="flex-1 p-4 overflow-x-auto whitespace-nowrap flex gap-4 items-center">
                    {invoices.length === 0 && (
                        <div className="w-full text-center flex flex-col items-center justify-center text-slate-400">
                            <span className="text-xs italic">No invoices issued yet.</span>
                        </div>
                    )}
                    
                    {invoices.map(inv => (
                        <div key={inv.id} className="w-64 bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all group relative">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${inv.type === 'CREDIT_NOTE' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            
                            <div className="flex justify-between items-start pl-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-800">{inv.reference}</span>
                                        {inv.type === 'CREDIT_NOTE' && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded font-bold">CN</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(inv.date).toLocaleDateString()}</div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1"><MoreHorizontal className="h-3 w-3" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem><Download className="h-3 w-3 mr-2" /> Download PDF</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => updateInvoiceStatus(inv.id, 'PAID')} className="text-emerald-600">
                                            <CheckCircle2 className="h-3 w-3 mr-2" /> Mark Paid
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => createCreditNote(inv.id)} className="text-red-600">
                                            <XCircle className="h-3 w-3 mr-2" /> Cancel / Credit
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex justify-between items-end mt-3 pl-2">
                                <div className={`text-sm font-bold font-mono ${inv.type === 'CREDIT_NOTE' ? 'text-red-600' : 'text-blue-700'}`}>
                                    {inv.total.toLocaleString()} {inv.currency}
                                </div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{inv.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}