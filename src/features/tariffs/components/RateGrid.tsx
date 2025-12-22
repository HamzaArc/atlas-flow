import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useTariffStore } from "@/store/useTariffStore";
import { RateCharge } from "@/types/tariff";

interface RateGridProps {
    section: 'freightCharges' | 'originCharges' | 'destCharges';
    title: string;
}

// 1. Define distinct column structures based on Mode
const COLUMNS_SEA = [
    { key: 'price20DV', label: "20' DV", w: 'w-24' },
    { key: 'price40HC', label: "40' HC", w: 'w-24' }, 
    { key: 'price40RF', label: "40' RE", w: 'w-24' },
];

const COLUMNS_AIR = [
    { key: 'minPrice', label: "Min", w: 'w-24' },
    { key: 'unitPrice', label: "Per KG / Unit", w: 'w-24' },
];

export function RateGrid({ section, title }: RateGridProps) {
    const { activeRate, addChargeRow, updateChargeRow, removeChargeRow } = useTariffStore();

    if (!activeRate) return null;
    const rows = activeRate[section];
    
    // Dynamic Column Selection
    const cols = activeRate.mode === 'AIR' ? COLUMNS_AIR : COLUMNS_SEA;

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        {title}
                    </h4>
                    <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-500 border-slate-200">
                        {rows.length}
                    </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => addChargeRow(section)} className="h-7 text-xs bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50">
                    <Plus className="h-3 w-3 mr-1.5" /> Add Charge
                </Button>
            </div>
            
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-100 h-9">
                            <TableHead className="w-[30%] pl-4 text-[10px] font-bold uppercase text-slate-400 bg-white">Charge Name</TableHead>
                            <TableHead className="w-24 text-[10px] font-bold uppercase text-slate-400 bg-white">Currency</TableHead>
                            
                            {/* Dynamic Pricing Columns */}
                            {cols.map(col => (
                                <TableHead key={col.key} className={`${col.w} text-right text-[10px] font-bold uppercase text-slate-400 bg-slate-50/50 border-l border-slate-100`}>
                                    {col.label}
                                </TableHead>
                            ))}
                            
                            <TableHead className="w-24 text-[10px] font-bold uppercase text-slate-400 bg-white border-l border-slate-100 pl-4">VAT (TVA)</TableHead>
                            <TableHead className="w-12 bg-white"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={cols.length + 4} className="h-24 text-center text-xs text-slate-400 italic bg-slate-50/20">
                                    No charges defined.
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map((row) => (
                            <TableRow key={row.id} className="group hover:bg-slate-50 transition-colors border-slate-100 h-10">
                                {/* Charge Name */}
                                <TableCell className="pl-4 py-1">
                                    <input 
                                        className="w-full text-sm font-medium border-transparent bg-transparent outline-none placeholder:text-slate-300 text-slate-700 focus:placeholder:text-slate-200" 
                                        placeholder="Charge name..."
                                        value={row.chargeHead}
                                        onChange={(e) => updateChargeRow(section, row.id, 'chargeHead', e.target.value)}
                                    />
                                </TableCell>
                                
                                {/* Currency Override */}
                                <TableCell className="py-1">
                                    <select 
                                        className="w-full bg-transparent text-xs font-mono text-slate-500 outline-none cursor-pointer hover:text-slate-800"
                                        value={row.currency || activeRate.currency}
                                        onChange={(e) => updateChargeRow(section, row.id, 'currency', e.target.value)}
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="MAD">MAD</option>
                                    </select>
                                </TableCell>

                                {/* Dynamic Prices - FIXED TYPE ERROR HERE */}
                                {cols.map(col => (
                                    <TableCell key={col.key} className="py-1 border-l border-slate-50">
                                        <input 
                                            type="number" 
                                            className="w-full text-sm text-right font-mono border-transparent bg-transparent outline-none hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-100 rounded px-1 transition-all placeholder:text-slate-200" 
                                            placeholder="-"
                                            // Fix: Cast explicitly to number to prevent TS from thinking it might be a boolean
                                            value={(row[col.key as keyof RateCharge] as number) || ''}
                                            onChange={(e) => updateChargeRow(section, row.id, col.key as any, parseFloat(e.target.value))}
                                        />
                                    </TableCell>
                                ))}

                                {/* VAT Rule */}
                                <TableCell className="py-1 border-l border-slate-50 pl-2">
                                     <select 
                                        className="w-full bg-transparent text-[10px] font-medium text-slate-500 outline-none cursor-pointer hover:text-slate-800"
                                        value={row.vatRule || 'STD_20'}
                                        onChange={(e) => updateChargeRow(section, row.id, 'vatRule', e.target.value as any)}
                                    >
                                        <option value="STD_20">20%</option>
                                        <option value="ROAD_14">14%</option>
                                        <option value="EXPORT_0">0%</option>
                                    </select>
                                </TableCell>

                                <TableCell className="py-1 pr-2 text-right">
                                    <Button variant="ghost" size="icon" onClick={() => removeChargeRow(section, row.id)} className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 className="h-3.5 w-3.5" />
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