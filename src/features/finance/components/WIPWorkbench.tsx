import { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; 
import { FilePlus, Lock, Edit3, Trash2, Wallet, Plus, AlertCircle } from "lucide-react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { ChargeLineDialog } from "./ChargeLineDialog";
import { ChargeLine } from "@/types/index";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function WIPWorkbench({ onSelectForInvoice }: { onSelectForInvoice: (ids: string[]) => void }) {
    const { ledger, addCharge, updateCharge, deleteCharge, dossierStats } = useFinanceStore();
    const [selected, setSelected] = useState<string[]>([]);
    
    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'CREATE' | 'EDIT'>('CREATE');
    const [editingItem, setEditingItem] = useState<Partial<ChargeLine> | undefined>(undefined);

    const receivables = ledger.filter(l => l.type === 'INCOME');
    const payables = ledger.filter(l => l.type === 'EXPENSE');

    const handleCheck = (id: string, checked: boolean | 'indeterminate') => {
        if(checked === true) setSelected([...selected, id]);
        else setSelected(selected.filter(s => s !== id));
    };

    const handleEdit = (item: ChargeLine) => {
        if(item.status === 'INVOICED' || item.status === 'POSTED') return; // Lock check
        setEditingItem(item);
        setDialogMode('EDIT');
        setIsDialogOpen(true);
    };

    const handleCreate = (type: 'INCOME' | 'EXPENSE') => {
        setEditingItem({ type });
        setDialogMode('CREATE');
        setIsDialogOpen(true);
    };

    const handleSave = (data: Partial<ChargeLine>) => {
        if (dialogMode === 'CREATE') {
            addCharge(data);
        } else if (editingItem?.id) {
            updateCharge(editingItem.id, data);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: Record<string, string> = {
            'ESTIMATED': 'bg-slate-100 text-slate-500 border-slate-200',
            'ACCRUED': 'bg-purple-50 text-purple-700 border-purple-200',
            'READY_TO_INVOICE': 'bg-blue-50 text-blue-700 border-blue-200',
            'INVOICED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'POSTED': 'bg-slate-800 text-white border-slate-900',
            'PAID': 'bg-green-100 text-green-800 border-green-300'
        };
        return <Badge variant="outline" className={styles[status] || 'bg-slate-50'}>{status.replace(/_/g, ' ')}</Badge>;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 p-4 gap-4">
            
            {/* 1. Quick Stats for this Dossier */}
            <div className="grid grid-cols-4 gap-4 mb-2">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Revenue</span>
                    <span className="text-lg font-bold text-slate-800">{dossierStats.revenue.toLocaleString()} MAD</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Direct Cost</span>
                    <span className="text-lg font-bold text-slate-800">{dossierStats.cost.toLocaleString()} MAD</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col">
                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Margin</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${dossierStats.margin < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {dossierStats.margin.toLocaleString()} MAD
                        </span>
                        <Badge variant="outline" className={dossierStats.marginPercent < 15 ? "text-red-600 bg-red-50 border-red-200" : "text-emerald-600 bg-emerald-50 border-emerald-200"}>
                            {dossierStats.marginPercent}%
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center justify-end">
                    {selected.length > 0 && (
                        <Button onClick={() => onSelectForInvoice(selected)} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 animate-in fade-in slide-in-from-right-4">
                            <Wallet className="h-4 w-4 mr-2" />
                            Generate Invoice ({selected.length})
                        </Button>
                    )}
                </div>
            </div>

            {/* 2. Main Workbench Area */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                <Tabs defaultValue="ar" className="flex-1 flex flex-col">
                    <div className="px-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <TabsList className="bg-transparent p-0 h-12 gap-6">
                            <TabsTrigger value="ar" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-transparent rounded-none px-0 h-full font-bold text-slate-500">
                                Accounts Receivable (Billing)
                            </TabsTrigger>
                            <TabsTrigger value="ap" className="data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:text-red-700 data-[state=active]:bg-transparent rounded-none px-0 h-full font-bold text-slate-500">
                                Accounts Payable (Costs)
                            </TabsTrigger>
                        </TabsList>
                        <div className="flex gap-2 py-2">
                            <Button size="sm" variant="outline" onClick={() => handleCreate('INCOME')} className="h-8 text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100">
                                <Plus className="h-3 w-3 mr-2" /> Add Revenue Line
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCreate('EXPENSE')} className="h-8 text-red-700 border-red-200 bg-red-50 hover:bg-red-100">
                                <Plus className="h-3 w-3 mr-2" /> Add Cost Line
                            </Button>
                        </div>
                    </div>

                    <TabsContent value="ar" className="flex-1 p-0 m-0 overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-12 text-center">Sel</TableHead>
                                    <TableHead className="uppercase text-[10px]">Description</TableHead>
                                    <TableHead className="uppercase text-[10px]">Code</TableHead>
                                    <TableHead className="uppercase text-[10px] text-right">Unit Price</TableHead>
                                    <TableHead className="uppercase text-[10px] text-center">Currency</TableHead>
                                    <TableHead className="uppercase text-[10px] text-center">ROE</TableHead>
                                    <TableHead className="uppercase text-[10px] text-right">Local Total</TableHead>
                                    <TableHead className="uppercase text-[10px] text-center">Status</TableHead>
                                    <TableHead className="w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receivables.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-32 text-center text-slate-400 italic">No revenue lines yet. Add one to start billing.</TableCell>
                                    </TableRow>
                                )}
                                {receivables.map(item => (
                                    <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="text-center">
                                            {['READY_TO_INVOICE', 'ESTIMATED'].includes(item.status) ? (
                                                <Checkbox checked={selected.includes(item.id)} onCheckedChange={(c) => handleCheck(item.id, c)} />
                                            ) : <Lock className="h-3 w-3 mx-auto text-slate-300" />}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-700">{item.description}</TableCell>
                                        <TableCell><Badge variant="secondary" className="text-[9px] font-mono">{item.code}</Badge></TableCell>
                                        <TableCell className="text-right font-mono">{item.amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-center text-[10px] font-bold text-slate-500">{item.currency}</TableCell>
                                        <TableCell className="text-center text-[10px] text-slate-400">{item.exchangeRate.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-bold font-mono text-blue-700">{item.amountLocal.toLocaleString()}</TableCell>
                                        <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                                        <TableCell className="text-right">
                                            {item.status !== 'INVOICED' && (
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(item)}><Edit3 className="h-3 w-3 text-slate-400" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCharge(item.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>

                    <TabsContent value="ap" className="flex-1 p-0 m-0 overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="uppercase text-[10px]">Vendor</TableHead>
                                    <TableHead className="uppercase text-[10px]">Description</TableHead>
                                    <TableHead className="uppercase text-[10px] text-right">Cost</TableHead>
                                    <TableHead className="uppercase text-[10px] text-center">Curr</TableHead>
                                    <TableHead className="uppercase text-[10px] text-right">Local Cost</TableHead>
                                    <TableHead className="uppercase text-[10px] text-center">Status</TableHead>
                                    <TableHead className="w-16"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payables.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-slate-400 italic">No cost lines accrued.</TableCell>
                                    </TableRow>
                                )}
                                {payables.map(item => (
                                    <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-bold text-slate-700">{item.vendorName || 'Pending'}</TableCell>
                                        <TableCell className="text-slate-600">{item.description}</TableCell>
                                        <TableCell className="text-right font-mono">{item.amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-center text-[10px] font-bold text-slate-500">{item.currency}</TableCell>
                                        <TableCell className="text-right font-bold font-mono text-red-700">{item.amountLocal.toLocaleString()}</TableCell>
                                        <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(item)}><Edit3 className="h-3 w-3 text-slate-400" /></Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCharge(item.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </div>

            {/* SHARED DIALOG */}
            <ChargeLineDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen} 
                mode={dialogMode}
                initialData={editingItem}
                onSave={handleSave}
            />
        </div>
    );
}