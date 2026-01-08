import { useClientStore } from "@/store/useClientStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Percent, Coins, Truck, Clock, AlertCircle, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ClientBillingConfig({ isEditing }: { isEditing: boolean }) {
    const { activeClient, updateActiveFinancials } = useClientStore();

    if (!activeClient) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
            <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Coins className="h-4 w-4 text-blue-600" />
                        Fixed Charges & Defaults
                    </CardTitle>
                    <CardDescription>
                        Configuration for automated quote generation and invoicing.
                    </CardDescription>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-6 pt-6">
                    
                    {/* 1. Retour de fond */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Retour de fond (Customs Rebate)</Label>
                        <div className="relative">
                            <Input 
                                disabled={!isEditing}
                                type="number"
                                className="pl-9 font-mono"
                                placeholder="0.0"
                                value={activeClient.financials.customsRebatePercent || ''}
                                onChange={(e) => updateActiveFinancials('customsRebatePercent', parseFloat(e.target.value))}
                            />
                            <Percent className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                        <p className="text-[10px] text-slate-400">
                            Applied as a percentage markup on the main freight line.
                        </p>
                    </div>

                    {/* 2. Frais de dossier */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Frais de dossier (Admin Fee)</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input 
                                    disabled={!isEditing}
                                    type="number"
                                    className="pl-9 font-mono"
                                    placeholder="0.00"
                                    value={activeClient.financials.adminFee || ''}
                                    onChange={(e) => updateActiveFinancials('adminFee', parseFloat(e.target.value))}
                                />
                                <Coins className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                            </div>
                            <Select 
                                disabled={!isEditing} 
                                value={activeClient.financials.adminFeeCurrency || 'MAD'}
                                onValueChange={(v: any) => updateActiveFinancials('adminFeeCurrency', v)}
                            >
                                <SelectTrigger className="w-24 bg-slate-50"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MAD">MAD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* 3. Péage */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Péage (Toll Fee - Default)</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input 
                                    disabled={!isEditing}
                                    type="number"
                                    className="pl-9 font-mono"
                                    placeholder="0.00"
                                    value={activeClient.financials.tollFee || ''}
                                    onChange={(e) => updateActiveFinancials('tollFee', parseFloat(e.target.value))}
                                />
                                <Truck className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                            </div>
                            <Select 
                                disabled={!isEditing} 
                                value={activeClient.financials.tollFeeCurrency || 'MAD'}
                                onValueChange={(v: any) => updateActiveFinancials('tollFeeCurrency', v)}
                            >
                                <SelectTrigger className="w-24 bg-slate-50"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MAD">MAD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-[10px] text-slate-400">
                            Default fixed value. Note: For Sea LCL, this is auto-calculated based on weight.
                        </p>
                    </div>

                    {/* 4. Frais NDL */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Frais NDL (Delivery Note)</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input 
                                    disabled={!isEditing}
                                    type="number"
                                    className="pl-9 font-mono"
                                    placeholder="0.00"
                                    value={activeClient.financials.fraisNDL || ''}
                                    onChange={(e) => updateActiveFinancials('fraisNDL', parseFloat(e.target.value))}
                                />
                                <FileText className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                            </div>
                            <Select 
                                disabled={!isEditing} 
                                value={activeClient.financials.fraisNDLCurrency || 'MAD'}
                                onValueChange={(v: any) => updateActiveFinancials('fraisNDLCurrency', v)}
                            >
                                <SelectTrigger className="w-24 bg-slate-50"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MAD">MAD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-[10px] text-slate-400">
                             Applied typically for Air Import shipments.
                        </p>
                    </div>

                    {/* 5. Payment Behavior */}
                    <div className="space-y-2 bg-orange-50 p-3 rounded-lg border border-orange-100">
                        <Label className="text-xs font-bold text-orange-700 uppercase flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" /> Average Days to Pay
                        </Label>
                        <Input 
                            disabled={!isEditing}
                            type="number"
                            className="bg-white border-orange-200 font-mono"
                            placeholder="e.g. 45"
                            value={activeClient.financials.averageDaysToPay || ''}
                            onChange={(e) => updateActiveFinancials('averageDaysToPay', parseFloat(e.target.value))}
                        />
                        <p className="text-[10px] text-orange-600">
                            Actual payment delay vs. agreed terms.
                        </p>
                    </div>

                </CardContent>
            </Card>

            <Card className="flex flex-col bg-white shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Invoicing Instructions
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <Textarea 
                        className="h-full min-h-[150px] resize-none bg-yellow-50/50 border-yellow-100 text-xs text-slate-700"
                        placeholder="Enter special requirements (e.g., 'Must mention PO#', 'Send to specific email', 'Stamp required')..."
                        value={activeClient.financials.specialInstructions || ''}
                        disabled={!isEditing}
                        onChange={(e) => updateActiveFinancials('specialInstructions', e.target.value)}
                    />
                </CardContent>
            </Card>
        </div>
    );
}