import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { ChargeLine } from "@/types/index";

interface ManualInvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => void;
}

export function ManualInvoiceDialog({ open, onOpenChange, onSubmit }: ManualInvoiceDialogProps) {
    const [clientName, setClientName] = useState("");
    const [lines, setLines] = useState<Partial<ChargeLine>[]>([
        { id: '1', description: 'Service Fee', amount: 0, code: 'MISC' }
    ]);

    const addLine = () => {
        setLines([...lines, { id: Math.random().toString(), description: '', amount: 0, code: 'MISC' }]);
    };

    const updateLine = (id: string, field: string, value: any) => {
        setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const removeLine = (id: string) => {
        setLines(lines.filter(l => l.id !== id));
    };

    const handleSubmit = () => {
        onSubmit({ clientName, lines });
        onOpenChange(false);
        setClientName("");
        setLines([{ id: '1', description: '', amount: 0, code: 'MISC' }]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create Manual Invoice</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Client Name</Label>
                        <Input 
                            placeholder="Enter Client Name" 
                            value={clientName} 
                            onChange={(e) => setClientName(e.target.value)} 
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Line Items</Label>
                            <Button variant="ghost" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" /> Add Line</Button>
                        </div>
                        <div className="border rounded-md divide-y">
                            {lines.map((line) => (
                                <div key={line.id} className="grid grid-cols-12 gap-2 p-2 items-center">
                                    <div className="col-span-3">
                                        <Select value={line.code} onValueChange={(v) => updateLine(line.id!, 'code', v)}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MISC">Misc</SelectItem>
                                                <SelectItem value="CONSULTING">Consulting</SelectItem>
                                                <SelectItem value="ADMIN">Admin Fee</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-5">
                                        <Input 
                                            className="h-8 text-xs" 
                                            placeholder="Description" 
                                            value={line.description} 
                                            onChange={(e) => updateLine(line.id!, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Input 
                                            type="number" 
                                            className="h-8 text-xs text-right" 
                                            placeholder="0.00" 
                                            value={line.amount} 
                                            onChange={(e) => updateLine(line.id!, 'amount', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => removeLine(line.id!)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-2">
                        <div className="text-right">
                            <span className="text-xs text-slate-500 uppercase font-bold">Total Net:</span>
                            <span className="ml-2 text-lg font-bold font-mono text-slate-900">
                                {lines.reduce((acc, l) => acc + (l.amount || 0), 0).toLocaleString()} MAD
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} className="bg-blue-600 text-white hover:bg-blue-700">Generate Invoice</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}