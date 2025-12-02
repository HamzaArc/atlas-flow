import { useEffect } from "react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { FinanceHeader } from "./components/FinanceHeader";
import { WIPWorkbench } from "./components/WIPWorkbench";
import { Card } from "@/components/ui/card";
import { FileText, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react";
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
        if(confirm(`Generate invoice for ${ids.length} items?`)) {
            generateInvoice(dossierId, ids);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <FinanceHeader />

            <div className="flex-1 min-h-0">
                <WIPWorkbench onSelectForInvoice={handleGenerateInvoice} />
            </div>

            <Card className="h-48 shrink-0 bg-slate-50 border-t border-slate-200 rounded-none rounded-t-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b border-slate-200 bg-white flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" /> Billing History
                    </h3>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
                </div>
                <div className="flex-1 p-4 overflow-x-auto whitespace-nowrap flex gap-4 items-center">
                    {invoices.length === 0 && <span className="text-xs text-slate-400 italic">No invoices issued yet.</span>}
                    
                    {invoices.map(inv => (
                        <div key={inv.id} className="w-72 h-24 bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between">
                            <div className={`absolute top-0 left-0 w-1 h-full ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                            
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-800">{inv.reference}</span>
                                        {inv.reference.startsWith('CN') && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded">CREDIT NOTE</span>}
                                    </div>
                                    <div className="text-[10px] text-slate-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3 w-3" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => window.alert('Download PDF functionality here')}>Download PDF</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => updateInvoiceStatus(inv.id, 'PAID')} className="text-emerald-600">
                                            <CheckCircle2 className="h-3 w-3 mr-2" /> Mark Paid
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => createCreditNote(inv.id)} className="text-red-600">
                                            <XCircle className="h-3 w-3 mr-2" /> Credit Note
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="text-sm font-bold text-blue-700">{inv.total.toLocaleString()} {inv.currency}</div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{inv.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}