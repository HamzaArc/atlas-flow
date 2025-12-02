import { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; 
import { FilePlus, Lock, Edit3, Trash2 } from "lucide-react";
import { useFinanceStore } from "@/store/useFinanceStore";
import { ChargeLineDialog } from "./ChargeLineDialog";
import { ChargeLine } from "@/types/index";

export function WIPWorkbench({ onSelectForInvoice }: { onSelectForInvoice: (ids: string[]) => void }) {
    const { ledger, addCharge, updateCharge, deleteCharge } = useFinanceStore();
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
        setEditingItem(item);
        setDialogMode('EDIT');
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingItem(undefined);
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
            'ESTIMATED': 'bg-slate-100 text-slate-500',
            'ACCRUED': 'bg-blue-50 text-blue-600 border-blue-200',
            'INVOICED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'PAID': 'bg-slate-800 text-white'
        };
        return <Badge variant="outline" className={styles[status] || 'bg-slate-50'}>{status}</Badge>;
    };

    return (
        <div className="grid grid-cols-2 gap-6 h-full min-h-0">
            
            {/* LEFT: PAYABLES (Costs) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                <div className="px-4 py-3 bg-red-50/30 border-b border-red-100 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">Accounts Payable (Costs)</h3>
                    <Button size="sm" variant="ghost" onClick={handleCreate} className="h-6 text-red-600 hover:bg-red-50"><FilePlus className="h-3 w-3 mr-1" /> Log Bill</Button>
                </div>
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-[10px] uppercase">Vendor</TableHead>
                                <TableHead className="text-[10px] uppercase">Charge</TableHead>
                                <TableHead className="text-[10px] uppercase text-right">Amount</TableHead>
                                <TableHead className="text-[10px] uppercase text-center">Status</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payables.map((item) => (
                                <TableRow key={item.id} className="text-xs group hover:bg-slate-50">
                                    <TableCell className="font-medium text-slate-700">{item.vendorName}</TableCell>
                                    <TableCell>{item.code} - {item.description}</TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {item.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">{item.currency}</span>
                                    </TableCell>
                                    <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                                    <TableCell>
                                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(item)}><Edit3 className="h-3 w-3 text-slate-400" /></Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCharge(item.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* RIGHT: RECEIVABLES (Billing) */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                <div className="px-4 py-3 bg-emerald-50/30 border-b border-emerald-100 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Accounts Receivable (Billing)</h3>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={handleCreate} className="h-6 text-emerald-700 hover:bg-emerald-100"><FilePlus className="h-3 w-3 mr-1" /> Add Item</Button>
                        {selected.length > 0 && (
                            <Button size="sm" onClick={() => onSelectForInvoice(selected)} className="h-6 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm animate-in fade-in zoom-in-95">
                                Invoice ({selected.length})
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead className="text-[10px] uppercase">Charge Item</TableHead>
                                <TableHead className="text-[10px] uppercase text-right">Sell Price</TableHead>
                                <TableHead className="text-[10px] uppercase text-center">Profit</TableHead>
                                <TableHead className="text-[10px] uppercase text-center">Status</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {receivables.map((item) => {
                                const relatedCost = payables.find(p => p.code === item.code)?.amountLocal || 0;
                                const profit = item.amountLocal - relatedCost;
                                
                                return (
                                    <TableRow key={item.id} className="text-xs group hover:bg-slate-50">
                                        <TableCell>
                                            {item.status !== 'INVOICED' ? (
                                                <Checkbox 
                                                    checked={selected.includes(item.id)} 
                                                    onCheckedChange={(c) => handleCheck(item.id, c)} 
                                                />
                                            ) : (
                                                <Lock className="h-3 w-3 text-slate-300" />
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-700">
                                            {item.description}
                                            {item.vatRule === 'EXPORT_0_ART92' && <Badge variant="secondary" className="ml-2 text-[9px] h-4 px-1">VAT 0%</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-blue-700">
                                            {item.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">{item.currency}</span>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-emerald-600">
                                            +{profit.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center"><StatusBadge status={item.status} /></TableCell>
                                        <TableCell>
                                            {item.status !== 'INVOICED' && (
                                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(item)}><Edit3 className="h-3 w-3 text-slate-400" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCharge(item.id)}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
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