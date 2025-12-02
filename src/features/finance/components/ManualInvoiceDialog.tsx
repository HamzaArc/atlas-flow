import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calculator } from "lucide-react";
import { ChargeLine, VatRule, Currency } from "@/types/index";

interface ManualInvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => void;
}

// Helper to generate a valid empty line
const createEmptyLine = (): Partial<ChargeLine> => ({
    id: Math.random().toString(),
    code: 'MISC',
    description: '',
    amount: 0,
    currency: 'MAD',
    exchangeRate: 1,
    vatRule: 'STD_20',
    vatRate: 0.20,
    isBillable: true
});

export function ManualInvoiceDialog({ open, onOpenChange, onSubmit }: ManualInvoiceDialogProps) {
    const [clientName, setClientName] = useState("");
    const [currency, setCurrency] = useState<Currency>("MAD");
    const [lines, setLines] = useState<Partial<ChargeLine>[]>([createEmptyLine()]);

    // Reset when opening
    useEffect(() => {
        if (open) {
            setClientName("");
            setCurrency("MAD");
            setLines([createEmptyLine()]);
        }
    }, [open]);

    const addLine = () => {
        setLines([...lines, { ...createEmptyLine(), currency }]); // Inherit invoice currency
    };

    const updateLine = (id: string, field: keyof ChargeLine, value: any) => {
        setLines(lines.map(l => {
            if (l.id !== id) return l;
            const updated = { ...l, [field]: value };
            
            // Auto-calc tax logic if rules change
            if (field === 'vatRule') {
                updated.vatRate = value === 'STD_20' ? 0.20 : value === 'ROAD_14' ? 0.14 : 0;
            }
            return updated;
        }));
    };

    const removeLine = (id: string) => {
        setLines(lines.filter(l => l.id !== id));
    };

    const calculateTotals = () => {
        const sub = lines.reduce((acc, l) => acc + (l.amount || 0), 0);
        const tax = lines.reduce((acc, l) => acc + ((l.amount || 0) * (l.vatRate || 0)), 0);
        return { sub, tax, total: sub + tax };
    };

    const handleSubmit = () => {
        if (!clientName) return;
        
        // Finalize the lines structure before submitting
        const processedLines = lines.map(l => ({
            ...l,
            amountLocal: (l.amount || 0) * (l.exchangeRate || 1),
            vatAmount: (l.amount || 0) * (l.vatRate || 0),
            totalAmount: ((l.amount || 0) * (1 + (l.vatRate || 0))) * (l.exchangeRate || 1),
            status: 'INVOICED',
            type: 'INCOME' // Manual invoices are always income
        }));

        onSubmit({ clientName, currency, lines: processedLines });
        onOpenChange(false);
    };

    const totals = calculateTotals();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Create Manual Invoice</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    {/* Header Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Client / Bill To</Label>
                            <Input 
                                placeholder="Enter Client Name" 
                                value={clientName} 
                                onChange={(e) => setClientName(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Invoice Currency</Label>
                            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MAD">MAD</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="text-xs uppercase font-bold text-slate-500">Line Items</Label>
                            <Button variant="ghost" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" /> Add Line</Button>
                        </div>
                        
                        <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                            {lines.map((line) => (
                                <div key={line.id} className="grid grid-cols-12 gap-2 p-2 items-start bg-slate-50/50">
                                    <div className="col-span-3">
                                        <Select value={line.code} onValueChange={(v) => updateLine(line.id!, 'code', v)}>
                                            <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MISC">Misc</SelectItem>
                                                <SelectItem value="CONSULTING">Consulting</SelectItem>
                                                <SelectItem value="ADMIN">Admin Fee</SelectItem>
                                                <SelectItem value="DEMURRAGE">Demurrage</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-4">
                                        <Input 
                                            className="h-8 text-xs bg-white" 
                                            placeholder="Description" 
                                            value={line.description} 
                                            onChange={(e) => updateLine(line.id!, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input 
                                            type="number" 
                                            className="h-8 text-xs text-right bg-white" 
                                            placeholder="0.00" 
                                            value={line.amount} 
                                            onChange={(e) => updateLine(line.id!, 'amount', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Select value={line.vatRule} onValueChange={(v) => updateLine(line.id!, 'vatRule', v)}>
                                            <SelectTrigger className="h-8 text-[10px] bg-white"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="STD_20">20%</SelectItem>
                                                <SelectItem value="ROAD_14">14%</SelectItem>
                                                <SelectItem value="EXPORT_0_ART92">0%</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => removeLine(line.id!)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Totals Footer */}
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                        <div className="w-48 space-y-1">
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Subtotal:</span>
                                <span>{totals.sub.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Tax:</span>
                                <span>{totals.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1">
                                <span>Total:</span>
                                <span>{totals.total.toFixed(2)} {currency}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} className="bg-slate-900 text-white hover:bg-slate-800">
                        <Calculator className="h-4 w-4 mr-2" /> Generate Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}