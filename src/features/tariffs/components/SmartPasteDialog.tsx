import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, ArrowRight, CheckCircle } from "lucide-react";
import { RateCharge } from '@/types/tariff';
import { useToast } from "@/components/ui/use-toast"; // Fixed import path based on your structure

interface SmartPasteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (charges: Partial<RateCharge>[]) => void;
    currency: string;
}

type ColumnType = 'IGNORE' | 'CHARGE_NAME' | '20DV' | '40DV' | '40HC' | 'CURRENCY';

export function SmartPasteDialog({ open, onOpenChange, onImport, currency }: SmartPasteDialogProps) {
    const [text, setText] = useState("");
    const [step, setStep] = useState<'INPUT' | 'MAPPING'>('INPUT');
    const [previewData, setPreviewData] = useState<string[][]>([]);
    const [mappings, setMappings] = useState<ColumnType[]>([]);
    const { toast } = useToast();

    const handleParse = () => {
        if (!text.trim()) return;

        // 1. Basic TSV/CSV Parser
        const rows = text.split(/\r?\n/).map(row => row.split(/\t/));
        // Filter empty rows
        const cleanRows = rows.filter(r => r.some(c => c.trim().length > 0));

        if (cleanRows.length === 0) {
            toast("No data detected. Please copy from Excel and paste again.", "error");
            return;
        }

        // 2. Auto-Detect Columns (Heuristic)
        const detectedMappings: ColumnType[] = cleanRows[0].map(cell => {
            const val = cell.toLowerCase();
            if (val.includes('20') || val.includes('teu')) return '20DV';
            if (val.includes('40') && val.includes('hc')) return '40HC';
            if (val.includes('40')) return '40DV';
            if (val.includes('curr') || val.includes('dev')) return 'CURRENCY';
            if (val.includes('desc') || val.includes('item') || val.includes('charge')) return 'CHARGE_NAME';
            return 'IGNORE';
        });

        // Fallback: If no charge name detected, assume col 0
        if (!detectedMappings.includes('CHARGE_NAME')) detectedMappings[0] = 'CHARGE_NAME';

        setPreviewData(cleanRows.slice(0, 5)); // Show top 5
        setMappings(detectedMappings);
        setStep('MAPPING');
    };

    const handleImport = () => {
        const rows = text.split(/\r?\n/).map(row => row.split(/\t/)).filter(r => r.some(c => c.trim().length > 0));
        
        const importedCharges: Partial<RateCharge>[] = rows.map(row => {
            const charge: any = { 
                basis: 'CONTAINER', 
                currency: currency,
                vatRule: 'STD_20',
                isSurcharge: false
            };

            row.forEach((cell, idx) => {
                const map = mappings[idx];
                if (map === 'CHARGE_NAME') charge.chargeHead = cell.trim();
                else if (map === 'CURRENCY') charge.currency = cell.trim().toUpperCase();
                else if (map === '20DV') charge.price20DV = parseFloat(cell.replace(/[^0-9.]/g, '')) || 0;
                else if (map === '40DV') charge.price40DV = parseFloat(cell.replace(/[^0-9.]/g, '')) || 0;
                else if (map === '40HC') charge.price40HC = parseFloat(cell.replace(/[^0-9.]/g, '')) || 0;
            });

            // Filter out header rows (where price is NaN or charge name is header-like)
            if (!charge.chargeHead || (charge.price20DV === 0 && charge.price40HC === 0)) return null;
            return charge;
        }).filter(Boolean);

        onImport(importedCharges);
        onOpenChange(false);
        setText("");
        setStep('INPUT');
        toast(`Successfully imported ${importedCharges.length} lines from clipboard.`, "success");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                        Smart Paste from Excel
                    </DialogTitle>
                </DialogHeader>

                {step === 'INPUT' ? (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
                            <p className="font-semibold mb-1">Instructions:</p>
                            <ol className="list-decimal pl-5 space-y-1">
                                <li>Open your Rate Sheet in Excel.</li>
                                <li>Select the rows containing charges (Charge Name, 20', 40', etc.).</li>
                                <li>Copy (Ctrl+C) and Paste (Ctrl+V) into the box below.</li>
                            </ol>
                        </div>
                        <Textarea 
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste your Excel data here..."
                            className="min-h-[200px] font-mono text-xs"
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-700">Confirm Column Mapping</h4>
                            <Button variant="ghost" size="sm" onClick={() => setStep('INPUT')} className="text-xs">
                                Back to Input
                            </Button>
                        </div>
                        
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        {mappings.map((map, idx) => (
                                            <TableHead key={idx} className="p-1">
                                                <Select value={map} onValueChange={(v: ColumnType) => {
                                                    const newM = [...mappings];
                                                    newM[idx] = v;
                                                    setMappings(newM);
                                                }}>
                                                    <SelectTrigger className="h-7 text-xs border-slate-300 bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="IGNORE">Ignore</SelectItem>
                                                        <SelectItem value="CHARGE_NAME">Description</SelectItem>
                                                        <SelectItem value="20DV">Price 20'</SelectItem>
                                                        <SelectItem value="40DV">Price 40'</SelectItem>
                                                        <SelectItem value="40HC">Price 40'HC</SelectItem>
                                                        <SelectItem value="CURRENCY">Currency</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((row, rIdx) => (
                                        <TableRow key={rIdx}>
                                            {row.map((cell, cIdx) => (
                                                <TableCell key={cIdx} className="py-2 text-xs font-mono text-slate-600 truncate max-w-[100px]" title={cell}>
                                                    {cell}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="bg-blue-50 text-blue-700 p-3 rounded text-xs flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Ready to import rows. Check mappings above before confirming.
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    {step === 'INPUT' ? (
                        <Button onClick={handleParse} disabled={!text.trim()}>
                            Next: Map Columns <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleImport} className="bg-emerald-600 hover:bg-emerald-700">
                            Import Data
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}