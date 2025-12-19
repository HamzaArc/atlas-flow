import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useTariffStore } from "@/store/useTariffStore";

interface RateGridProps {
    section: 'freightCharges' | 'originCharges' | 'destCharges';
    title: string;
}

export function RateGrid({ section, title }: RateGridProps) {
    const { activeRate, addChargeRow, updateChargeRow, removeChargeRow } = useTariffStore();

    if (!activeRate) return null;
    const rows = activeRate[section];

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50/80 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    {title}
                </h4>
                <Button variant="outline" size="sm" onClick={() => addChargeRow(section)} className="h-8 text-xs bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Charge Line
                </Button>
            </div>
            
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-100">
                            {/* WIDER CHARGE NAME COLUMN */}
                            <TableHead className="w-[40%] pl-6 h-10 text-xs font-bold uppercase text-slate-400 bg-white">Charge Name</TableHead>
                            
                            {/* FIXED WIDTH PRICING COLUMNS */}
                            <TableHead className="w-32 text-right h-10 text-xs font-bold uppercase text-slate-400 bg-slate-50/50 border-l border-slate-100">20' DV</TableHead>
                            <TableHead className="w-32 text-right h-10 text-xs font-bold uppercase text-slate-400 bg-slate-50/50 border-l border-slate-100">40' DV</TableHead>
                            <TableHead className="w-32 text-right h-10 text-xs font-bold uppercase text-blue-600 bg-blue-50/20 border-l border-slate-100">40' HC</TableHead>
                            <TableHead className="w-32 text-right h-10 text-xs font-bold uppercase text-slate-400 bg-slate-50/50 border-l border-slate-100">40' RF</TableHead>
                            
                            <TableHead className="w-12 bg-white"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-sm text-slate-400 italic bg-slate-50/20">
                                    No charges added. Click "Add Charge Line" to start.
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map((row) => (
                            <TableRow key={row.id} className="group hover:bg-slate-50 transition-colors border-slate-100">
                                <TableCell className="pl-6 py-2">
                                    <Input 
                                        className="h-9 text-sm font-medium border-transparent bg-transparent hover:bg-white hover:border-slate-200 focus:bg-white focus:border-blue-300 transition-all placeholder:text-slate-300" 
                                        placeholder="Type charge name..."
                                        value={row.chargeHead}
                                        onChange={(e) => updateChargeRow(section, row.id, 'chargeHead', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell className="py-2 border-l border-slate-50">
                                    <Input 
                                        type="number" 
                                        className="h-9 text-sm text-right font-mono border-transparent bg-transparent hover:bg-white hover:border-slate-200 focus:bg-white focus:border-blue-300 transition-all" 
                                        placeholder="0.00"
                                        value={row.price20DV || ''}
                                        onChange={(e) => updateChargeRow(section, row.id, 'price20DV', parseFloat(e.target.value))}
                                    />
                                </TableCell>
                                <TableCell className="py-2 border-l border-slate-50">
                                    <Input 
                                        type="number" 
                                        className="h-9 text-sm text-right font-mono border-transparent bg-transparent hover:bg-white hover:border-slate-200 focus:bg-white focus:border-blue-300 transition-all" 
                                        placeholder="0.00"
                                        value={row.price40DV || ''}
                                        onChange={(e) => updateChargeRow(section, row.id, 'price40DV', parseFloat(e.target.value))}
                                    />
                                </TableCell>
                                <TableCell className="py-2 bg-blue-50/10 border-l border-slate-50">
                                    <Input 
                                        type="number" 
                                        className="h-9 text-sm text-right font-mono font-bold text-blue-700 border-transparent bg-transparent hover:bg-white hover:border-blue-200 focus:bg-white focus:border-blue-300 transition-all" 
                                        placeholder="0.00"
                                        value={row.price40HC || ''}
                                        onChange={(e) => updateChargeRow(section, row.id, 'price40HC', parseFloat(e.target.value))}
                                    />
                                </TableCell>
                                <TableCell className="py-2 border-l border-slate-50">
                                    <Input 
                                        type="number" 
                                        className="h-9 text-sm text-right font-mono border-transparent bg-transparent hover:bg-white hover:border-slate-200 focus:bg-white focus:border-blue-300 transition-all" 
                                        placeholder="0.00"
                                        value={row.price40RF || ''}
                                        onChange={(e) => updateChargeRow(section, row.id, 'price40RF', parseFloat(e.target.value))}
                                    />
                                </TableCell>
                                <TableCell className="py-2 pr-4 text-right">
                                    <Button variant="ghost" size="icon" onClick={() => removeChargeRow(section, row.id)} className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}