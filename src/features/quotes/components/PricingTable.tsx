import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
    Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Trash2, Plus, MapPin, Ship, Anchor, Zap,
    Calendar, AlertCircle, RefreshCw
} from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { QuoteLineItem, Currency } from "@/types/index";
import { cn } from "@/lib/utils";

// --- CONSTANTS ---
const SUGGESTED_VENDORS = [
    { id: 'v1', name: 'Maersk Line' },
    { id: 'v2', name: 'CMA CGM' },
    { id: 'v3', name: 'MSC' },
    { id: 'v4', name: 'Hapag-Lloyd' },
    { id: 'v5', name: 'Air France KLM' },
    { id: 'v6', name: 'Lufthansa Cargo' },
    { id: 'v7', name: 'DHL Global Forwarding' },
];

const formatDateCompact = (dateVal?: Date | string) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};

const createLocalOneDate = (dateString: string) => {
    if (!dateString) return undefined;
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d);
};

// DENSITY: Reduced padding and heights for SectionHeader
const SectionHeader = ({ title, icon: Icon, onAdd, isCollect }: { title: string, icon: any, onAdd: () => void, isCollect?: boolean }) => (
    <TableRow className="hover:bg-transparent border-b border-slate-200 bg-slate-50/80">
        <TableCell colSpan={9} className="py-1.5 pl-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-3 w-3 text-slate-400" />
                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-600">{title}</span>
                    {isCollect !== undefined && (
                        <Badge variant="outline" className={cn("text-[9px] h-4 px-1 rounded-[2px]", isCollect ? 'border-orange-200 text-orange-600 bg-orange-50' : 'border-blue-200 text-blue-600 bg-blue-50')}>
                            {isCollect ? 'COLLECT' : 'PREPAID'}
                        </Badge>
                    )}
                </div>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={onAdd} 
                    className="h-5 text-[10px] font-medium text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all px-2"
                >
                    <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
            </div>
        </TableCell>
    </TableRow>
);

export function PricingTable() {
  const { 
      items, addLineItem, updateLineItem, removeLineItem, 
      exchangeRates, quoteCurrency, status,
      validityDate: quoteValidity 
  } = useQuoteStore();

  const isReadOnly = status !== 'DRAFT';

  const checkValidityRisk = (itemValidity?: Date) => {
      if (!itemValidity) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const itemDate = new Date(itemValidity);
      if (itemDate < today) return { level: 'expired', msg: 'Expired' };
      const globalDate = new Date(quoteValidity);
      if (itemDate < globalDate) return { level: 'error', msg: 'Early Exp' };
      return null;
  };

  const calculateSellDetails = (item: QuoteLineItem) => {
      const buyRate = exchangeRates[item.buyCurrency] || 1;
      const costInMAD = item.buyPrice * buyRate;
      let sellInMAD = 0;
      if (item.markupType === 'PERCENT') {
          sellInMAD = costInMAD * (1 + (item.markupValue / 100));
      } else {
          const marginInMAD = item.markupValue * buyRate;
          sellInMAD = costInMAD + marginInMAD;
      }
      const targetRate = exchangeRates[quoteCurrency] || 1;
      const finalSell = quoteCurrency === 'MAD' ? sellInMAD : sellInMAD / targetRate;
      return { finalVal: finalSell.toFixed(2), sellInMAD };
  };

  const renderRows = (section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION') => {
      const sectionItems = items.filter(i => i.section === section);
      
      if (sectionItems.length === 0) return null;

      return sectionItems.map((item) => {
        const risk = checkValidityRisk(item.validityDate);
        const isExpired = risk?.level === 'expired';
        const calc = calculateSellDetails(item);

        return (
        <TableRow 
            key={item.id} 
            className={cn(
                "group border-b border-slate-100 transition-colors hover:bg-blue-50/20 text-[10px]",
                isExpired && "bg-red-50/50"
            )}
        >
            {/* 1. DESCRIPTION */}
            <TableCell className="w-[30%] py-0.5 pl-3">
                <div className="flex items-center gap-2">
                    {isExpired && <AlertCircle className="h-3 w-3 text-red-500" />}
                    <Input 
                        disabled={isReadOnly}
                        className={cn(
                            "h-7 border-transparent px-2 bg-transparent focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 font-medium text-xs shadow-none rounded-sm transition-all placeholder:text-slate-300",
                            isExpired && "text-red-700"
                        )}
                        value={item.description}
                        placeholder="Description"
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    />
                </div>
            </TableCell>

            {/* 2. VENDOR & VALIDITY */}
            <TableCell className="w-[15%] py-0.5">
                <div className="flex items-center gap-1">
                    <input 
                        list="vendors"
                        disabled={isReadOnly}
                        className="h-7 w-full rounded-sm border-transparent bg-transparent px-2 hover:bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 text-[10px] text-slate-600 shadow-none placeholder:text-slate-300 focus:outline-none transition-all truncate" 
                        value={item.vendorName || ''}
                        placeholder="Select Vendor"
                        onChange={(e) => updateLineItem(item.id, 'vendorName', e.target.value)}
                    />
                    
                    <Popover>
                        <PopoverTrigger asChild>
                            <button disabled={isReadOnly} className={cn(
                                    "h-6 w-14 flex-shrink-0 flex items-center justify-center rounded-[2px] text-[9px] font-mono transition-colors",
                                    risk ? "bg-red-100 text-red-700" : item.validityDate ? "bg-blue-50 text-blue-700" : "text-transparent group-hover:text-slate-300 hover:bg-slate-100"
                            )}>
                                {item.validityDate ? formatDateCompact(item.validityDate) : <Calendar className="h-3 w-3" />}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="end">
                           <Input type="date" className="h-8 text-xs" value={item.validityDate ? new Date(item.validityDate).toISOString().split('T')[0] : ''} onChange={(e) => updateLineItem(item.id, 'validityDate', createLocalOneDate(e.target.value))} />
                        </PopoverContent>
                    </Popover>
                </div>
            </TableCell>

            {/* 3. COST PRICE */}
            <TableCell className="w-[12%] py-0.5">
                <Input 
                    disabled={isReadOnly}
                    type="number"
                    className="h-7 border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-blue-300 text-right text-slate-600 font-mono text-xs shadow-none px-2 rounded-sm" 
                    value={item.buyPrice}
                    onChange={(e) => updateLineItem(item.id, 'buyPrice', parseFloat(e.target.value) || 0)}
                />
            </TableCell>

            {/* 4. CURRENCY */}
            <TableCell className="w-[8%] py-0.5">
                <Select disabled={isReadOnly} value={item.buyCurrency} onValueChange={(v) => updateLineItem(item.id, 'buyCurrency', v as Currency)}>
                    <SelectTrigger className="h-7 border-transparent bg-transparent hover:bg-slate-50 text-[10px] font-bold text-slate-500 shadow-none px-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="MAD">MAD</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                </Select>
            </TableCell>

            {/* 5. MARKUP */}
            <TableCell className="w-[12%] py-0.5">
                 <div className="flex items-center justify-end gap-1 px-2 group/markup">
                    <Input 
                        disabled={isReadOnly}
                        type="number"
                        className="h-7 w-16 border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-emerald-300 text-right text-emerald-700 font-bold font-mono text-xs shadow-none px-0 rounded-sm" 
                        value={item.markupValue}
                        onChange={(e) => updateLineItem(item.id, 'markupValue', parseFloat(e.target.value) || 0)}
                    />
                    <button 
                        className="text-[9px] text-slate-300 hover:text-blue-600 font-bold w-4 text-center"
                        onClick={() => !isReadOnly && updateLineItem(item.id, 'markupType', item.markupType === 'PERCENT' ? 'FIXED_AMOUNT' : 'PERCENT')}
                    >
                        {item.markupType === 'PERCENT' ? '%' : '$'}
                    </button>
                 </div>
            </TableCell>

            {/* 6. VAT */}
            <TableCell className="w-[8%] py-0.5 text-center">
                <Select disabled={isReadOnly} value={item.vatRule} onValueChange={(v) => updateLineItem(item.id, 'vatRule', v)}>
                    <SelectTrigger className="h-7 border-transparent bg-transparent text-[9px] text-slate-400 shadow-none px-0 justify-center"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="STD_20">20%</SelectItem><SelectItem value="ROAD_14">14%</SelectItem><SelectItem value="EXPORT_0_ART92">0%</SelectItem></SelectContent>
                </Select>
            </TableCell>

            {/* 7. SELL PRICE */}
            <TableCell className="w-[10%] py-0.5 text-right pr-4">
                 <div className="font-mono font-bold text-slate-800 text-sm flex items-center justify-end gap-1 h-7">
                    {calc.finalVal}
                    {item.buyCurrency !== quoteCurrency && <RefreshCw className="h-2.5 w-2.5 text-blue-300" />}
                 </div>
            </TableCell>

            {/* 8. ACTIONS */}
            <TableCell className="w-[5%] py-0.5 pl-0">
                {!isReadOnly && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => removeLineItem(item.id)}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
      )});
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <datalist id="vendors">{SUGGESTED_VENDORS.map(v => <option key={v.id} value={v.name} />)}</datalist>

      <div className="flex-1 overflow-auto">
        <Table>
            <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                <TableRow className="hover:bg-transparent border-none h-8">
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-3">Description</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vendor</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Cost</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Curr</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Markup</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">VAT</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-blue-600 uppercase tracking-widest text-right pr-4">Sell</TableHead>
                    <TableHead className="h-8 w-8"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <SectionHeader title="Origin" icon={MapPin} onAdd={() => addLineItem('ORIGIN')} />
                {renderRows('ORIGIN')}

                <SectionHeader title="Freight" icon={Ship} onAdd={() => addLineItem('FREIGHT')} />
                {renderRows('FREIGHT')}

                <SectionHeader title="Destination" icon={Anchor} onAdd={() => addLineItem('DESTINATION')} isCollect={true} />
                {renderRows('DESTINATION')}
                
                {items.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                <Zap className="h-6 w-6 opacity-20" />
                                <span className="text-xs">No line items.</span>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}