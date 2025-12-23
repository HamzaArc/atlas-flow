import { useClientStore } from "@/store/useClientStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Percent, Coins, Truck } from "lucide-react";

export function ClientBillingConfig({ isEditing }: { isEditing: boolean }) {
    const { activeClient, updateActiveFinancials } = useClientStore();

    if (!activeClient) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
            <Card className="bg-white shadow-sm border-slate-200">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Coins className="h-4 w-4 text-blue-600" />
                        Fixed Charges Configuration
                    </CardTitle>
                    <CardDescription>
                        Define default billing values applied during quote generation.
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
                            Calculated as a percentage of the "Main Fret" line item.
                        </p>
                    </div>

                    {/* 2. Frais de dossier */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Frais de dossier (Admin Fee)</Label>
                        <div className="relative">
                            <Input 
                                disabled={!isEditing}
                                type="number"
                                className="pl-9 font-mono"
                                placeholder="0.00"
                                value={activeClient.financials.adminFee || ''}
                                onChange={(e) => updateActiveFinancials('adminFee', parseFloat(e.target.value))}
                            />
                            <span className="text-xs font-bold text-slate-400 absolute left-3 top-2.5">MAD</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                            Fixed standard fee applied to all dossiers.
                        </p>
                    </div>

                    {/* 3. Péage */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Péage (Toll Fee - Default)</Label>
                        <div className="relative">
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
                        <p className="text-[10px] text-slate-400">
                            Default fixed value. Note: For Sea LCL, this is auto-calculated based on weight.
                        </p>
                    </div>

                </CardContent>
            </Card>

            <Card className="bg-slate-50 border-dashed border-slate-300 shadow-none">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold text-slate-600">Logic Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-slate-500">
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-slate-200">
                        <span>Scenario A: Air Freight</span>
                        <span className="font-medium text-slate-700">Rebate + Admin Fee</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-slate-200">
                        <span>Scenario B: Sea LCL</span>
                        <span className="font-medium text-slate-700">Rebate + Toll (Auto) + Admin Fee</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded border border-slate-200">
                        <span>Scenario C: Others</span>
                        <span className="font-medium text-slate-700">Rebate + Toll (Fixed) + Admin Fee</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}