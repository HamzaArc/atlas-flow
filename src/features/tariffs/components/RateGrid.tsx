import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, FileSpreadsheet } from "lucide-react";
import { useTariffStore } from "@/store/useTariffStore";
import { RateCharge } from "@/types/tariff";
import { SmartPasteDialog } from "./SmartPasteDialog";

interface RateGridProps {
    section: 'freightCharges' | 'originCharges' | 'destCharges';
    title: string;
    readOnly?: boolean;
}

// UPDATED: Removed 40' RE
const COLUMNS_SEA = [
    { key: 'price20DV', label: "20' DV", w: 'w-24' },
    { key: 'price40HC', label: "40' HC", w: 'w-24' }, 
];

const COLUMNS_AIR = [
    { key: 'minPrice', label: "Min", w: 'w-24' },
    { key: 'unitPrice', label: "Per KG / Unit", w: 'w-24' },
];

export function RateGrid({ section, title, readOnly = false }: RateGridProps) {
    const { activeRate, addChargeRow, updateChargeRow, removeChargeRow, updateRateField } = useTariffStore();
    const [pasteOpen, setPasteOpen] = useState(false);

    if (!activeRate) return null;
    const rows = activeRate[section];
    const cols = activeRate.mode === 'AIR' ? COLUMNS_AIR : COLUMNS_SEA;

    const handleBulkImport = (newCharges: Partial<RateCharge>[]) => {
        const formatted: RateCharge[] = newCharges.map(c => ({
            id: Math.random().toString(36).substr(2, 9),
            chargeHead: c.chargeHead || 'Imported Charge',
            isSurcharge: false,
            basis: 'CONTAINER',
            price20DV: c.price20DV || 0,
            price40DV: c.price40DV || 0,
            price40HC: c.price40HC || 0,
            price40RF: 0, // Kept in data model for type safety, but hidden
            unitPrice: 0, 
            minPrice: 0, 
            percentage: 0,
            currency: c.currency || activeRate.currency,
            vatRule: 'STD_20'
        }));

        updateRateField(section, [...rows, ...formatted]);
    };

    if (readOnly) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-slate-400 opacity-70 border-dashed">
                <FileSpreadsheet className="h-8 w-8 mb-2 opacity-50" />
                <h4 className="font-bold text-sm uppercase">Section Disabled</h4>
                <p className="text-xs">Not applicable for Incoterm: {activeRate.incoterm}</p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col transition-all">
                <div className="flex justify-between items-center px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                            {title}
                        </h4>
                        <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-500 border-slate-200">
                            {rows.length}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPasteOpen(true)}
                            className="h-7 text-xs bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                        >
                            <FileSpreadsheet className="h-3 w-3 mr-1.5" /> Paste from Excel
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addChargeRow(section)} 
                            className="h-7 text-xs bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                        >
                            <Plus className="h-3 w-3 mr-1.5" /> Add Charge
                        </Button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-100 h-9">
                                <TableHead className="w-[30%] pl-4 text-[10px] font-bold uppercase text-slate-400 bg-white">Charge Name</TableHead>
                                <TableHead className="w-24 text-[10px] font-bold uppercase text-slate-400 bg-white">Currency</TableHead>
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
                                        No charges defined. Paste from Excel to start.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.map((row) => (
                                <TableRow key={row.id} className="group hover:bg-slate-50 transition-colors border-slate-100 h-10">
                                    <TableCell className="pl-4 py-1">
                                        <input 
                                            className="w-full text-sm font-medium border-transparent bg-transparent outline-none placeholder:text-slate-300 text-slate-700 focus:placeholder:text-slate-200" 
                                            placeholder="Charge name..."
                                            value={row.chargeHead}
                                            onChange={(e) => updateChargeRow(section, row.id, 'chargeHead', e.target.value)}
                                        />
                                    </TableCell>
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
                                    {cols.map(col => (
                                        <TableCell key={col.key} className="py-1 border-l border-slate-50">
                                            <input 
                                                type="number" 
                                                className="w-full text-sm text-right font-mono border-transparent bg-transparent outline-none hover:bg-white focus:bg-white focus:ring-1 focus:ring-blue-100 rounded px-1 transition-all placeholder:text-slate-200" 
                                                placeholder="-"
                                                value={(row[col.key as keyof RateCharge] as number) || ''}
                                                onChange={(e) => updateChargeRow(section, row.id, col.key as any, parseFloat(e.target.value))}
                                            />
                                        </TableCell>
                                    ))}
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

            <SmartPasteDialog 
                open={pasteOpen} 
                onOpenChange={setPasteOpen} 
                onImport={handleBulkImport}
                currency={activeRate.currency} 
            />
        </>
    );
}