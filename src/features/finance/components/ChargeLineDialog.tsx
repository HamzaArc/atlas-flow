import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChargeLine, ChargeType, Currency, VatRule } from "@/types/index";

interface ChargeLineDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<ChargeLine>;
    onSave: (data: Partial<ChargeLine>) => void;
    mode: 'CREATE' | 'EDIT';
}

export function ChargeLineDialog({ open, onOpenChange, initialData, onSave, mode }: ChargeLineDialogProps) {
    const [formData, setFormData] = useState<Partial<ChargeLine>>({
        type: 'EXPENSE',
        code: 'MISC',
        description: '',
        amount: 0,
        currency: 'MAD',
        vatRule: 'STD_20',
        vendorName: '',
        ...initialData
    });

    // Reset form when opening for Create
    useEffect(() => {
        if (open && mode === 'CREATE') {
            setFormData({ type: 'EXPENSE', code: 'MISC', description: '', amount: 0, currency: 'MAD', vatRule: 'STD_20', vendorName: '' });
        } else if (open && initialData) {
            setFormData(initialData);
        }
    }, [open, mode, initialData]);

    const handleSubmit = () => {
        onSave(formData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'CREATE' ? 'Add Charge Line' : 'Edit Charge Line'}</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    
                    {/* Row 1: Type & Code */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Transaction Type</Label>
                            <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v as ChargeType})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXPENSE">Expense (Cost)</SelectItem>
                                    <SelectItem value="INCOME">Revenue (Sell)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Charge Code</Label>
                            <Select value={formData.code} onValueChange={(v) => setFormData({...formData, code: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OF">Ocean Freight</SelectItem>
                                    <SelectItem value="THC">THC</SelectItem>
                                    <SelectItem value="DTHC">Destination THC</SelectItem>
                                    <SelectItem value="DUM">Customs (DUM)</SelectItem>
                                    <SelectItem value="TRUCK">Trucking</SelectItem>
                                    <SelectItem value="MISC">Miscellaneous</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 2: Description (Full Width) */}
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input 
                            value={formData.description} 
                            onChange={(e) => setFormData({...formData, description: e.target.value})} 
                            placeholder="e.g. Extra waiting time fees"
                        />
                    </div>

                    {/* Row 3: Vendor (Conditional) */}
                    {formData.type === 'EXPENSE' && (
                        <div className="space-y-2">
                            <Label>Vendor / Supplier</Label>
                            <Input 
                                value={formData.vendorName} 
                                onChange={(e) => setFormData({...formData, vendorName: e.target.value})} 
                                placeholder="e.g. MARSA MAROC"
                            />
                        </div>
                    )}

                    {/* Row 4: Financials */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input 
                                type="number" 
                                value={formData.amount} 
                                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select value={formData.currency} onValueChange={(v) => setFormData({...formData, currency: v as Currency})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MAD">MAD</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>VAT Rule</Label>
                            <Select value={formData.vatRule} onValueChange={(v) => setFormData({...formData, vatRule: v as VatRule})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STD_20">Standard 20%</SelectItem>
                                    <SelectItem value="ROAD_14">Transport 14%</SelectItem>
                                    <SelectItem value="EXPORT_0_ART92">Export 0%</SelectItem>
                                    <SelectItem value="DISBURSEMENT_0">Disbursement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>{mode === 'CREATE' ? 'Add Line' : 'Save Changes'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}