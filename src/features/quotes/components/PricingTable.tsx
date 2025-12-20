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
    Trash2, Plus, MapPin, Ship, Anchor, Zap, Wand2, 
    Building2, Calendar, AlertTriangle, XCircle, AlertCircle, RefreshCw
} from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { QuoteLineItem, Currency } from "@/types/index";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// --- MOCK VENDOR DATA ---
const SUGGESTED_VENDORS = [
    { id: 'v1', name: 'Maersk Line' },
    { id: 'v2', name: 'CMA CGM' },
    { id: 'v3', name: 'MSC' },
    { id: 'v4', name: 'Hapag-Lloyd' },
    { id: 'v5', name: 'Air France KLM' },
    { id: 'v6', name: 'Lufthansa Cargo' },
    { id: 'v7', name: 'DHL Global Forwarding' },
];

// Helper: Compact Date Formatter (DD/MM)
const formatDateCompact = (dateVal?: Date | string) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};

// Helper: Safe Date Creator (Fixes Timezone Offsets)
const createLocalOneDate = (dateString: string) => {
    if (!dateString) return undefined;
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const SectionHeader = ({ title, icon: Icon, onAdd, isCollect }: { title: string, icon: any, onAdd: () => void, isCollect?: boolean }) => (
    <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
        <TableCell colSpan={9} className="py-2 pt-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1 rounded-md bg-white border shadow-sm text-slate-600">
                        <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">{title}</span>
                    {isCollect !== undefined && (
                        <Badge variant="outline" className={cn("text-[9px] h-5 px-1.5", isCollect ? 'border-orange-200 text-orange-600 bg-orange-50' : 'border-blue-200 text-blue-600 bg-blue-50')}>
                            {isCollect ? 'COLLECT' : 'PREPAID'}
                        </Badge>
                    )}
                </div>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={onAdd} 
                    className="h-6 text-[10px] font-medium text-slate-500 hover:text-blue-600 hover:bg-white transition-all"
                >
                    <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
            </div>
        </TableCell>
    </TableRow>
);

export function PricingTable() {
  const { 
      items, addLineItem, updateLineItem, removeLineItem, 
      exchangeRates, quoteCurrency, status, applyTemplate,
      validityDate: quoteValidity 
  } = useQuoteStore();

  const isReadOnly = status !== 'DRAFT';

  // --- HELPER: Expiry Logic ---
  const checkValidityRisk = (itemValidity?: Date) => {
      if (!itemValidity) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const itemDate = new Date(itemValidity);

      // 1. STRICT EXPIRY (Blocker)
      if (itemDate < today) {
          return { level: 'expired', msg: 'Expired' };
      }

      // 2. LOGICAL INCONSISTENCY (Expires before quote validity)
      const globalDate = new Date(quoteValidity);
      if (itemDate < globalDate) {
          return { level: 'error', msg: 'Expires before Quote' };
      }

      // 3. TIGHT DEADLINE (Warning)
      const diffTime = Math.abs(itemDate.getTime() - globalDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays < 3) {
          return { level: 'warning', msg: 'Tight Validity' };
      }
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

      // New: Return object with details for Tooltip
      return {
          finalVal: finalSell.toFixed(2),
          mathString: `${sellInMAD.toFixed(2)} MAD` + (quoteCurrency !== 'MAD' ? ` / ${targetRate} = ${finalSell.toFixed(2)} ${quoteCurrency}` : ''),
          conversionNote: item.buyCurrency !== quoteCurrency 
             ? `1 ${item.buyCurrency} = ${buyRate} MAD` 
             : null,
          sellInMAD
      };
  };

  const renderRows = (section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION') => {
      const sectionItems = items.filter(i => i.section === section);
      
      if (sectionItems.length === 0) return (
          <TableRow>
              <TableCell colSpan={9} className="h-12 text-center text-xs text-slate-300 italic">
                  No items in {section.toLowerCase()} section.
              </TableCell>
          </TableRow>
      );

      return sectionItems.map((item) => {
        const risk = checkValidityRisk(item.validityDate);
        const isExpired = risk?.level === 'expired';
        const calc = calculateSellDetails(item);

        return (
        <TableRow 
            key={item.id} 
            className={cn(
                "group border-b transition-colors",
                isExpired ? "bg-red-50 hover:bg-red-100 border-red-200" : "border-slate-50 hover:bg-blue-50/30"
            )}
        >
            {/* 1. DESCRIPTION */}
            <TableCell className="w-[25%] py-1 pl-4">
                <div className="flex items-center gap-2">
                    {isExpired && (
                        <div title="Rate Expired" className="flex-shrink-0 text-red-600 animate-pulse">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                    )}
                    <Input 
                        disabled={isReadOnly}
                        className={cn(
                            "h-8 border-transparent bg-transparent hover:bg-white focus:bg-white focus:ring-2 font-medium text-xs transition-all placeholder:text-slate-300 shadow-none",
                            isExpired ? "text-red-700" : "text-slate-700 focus:border-blue-200 focus:ring-blue-100"
                        )}
                        value={item.description}
                        placeholder="Item Name"
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    />
                </div>
            </TableCell>

            {/* 2. VENDOR & VALIDITY (UPDATED) */}
            <TableCell className="w-[18%] py-1">
                <div className="flex items-center gap-1.5">
                    {/* Vendor Select */}
                    <div className="relative flex-1 min-w-0">
                        <Building2 className="absolute left-2 top-2.5 h-3 w-3 text-slate-300" />
                        <input 
                            list="vendors"
                            disabled={isReadOnly}
                            className="h-8 w-full pl-7 rounded-md border border-transparent bg-transparent hover:bg-white focus:bg-white text-xs text-slate-600 shadow-none placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 truncate" 
                            value={item.vendorName || ''}
                            placeholder="Vendor..."
                            onChange={(e) => updateLineItem(item.id, 'vendorName', e.target.value)}
                        />
                    </div>

                    {/* POPOVER DATE PICKER (No Invisible Inputs) */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button 
                                disabled={isReadOnly}
                                className={cn(
                                    "h-7 min-w-[3.5rem] px-1.5 flex items-center justify-center gap-1 rounded border text-[9px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-100",
                                    risk?.level === 'expired' ? "bg-red-100 text-red-700 border-red-300 shadow-sm" :
                                    risk?.level === 'error' ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" :
                                    risk?.level === 'warning' ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100" :
                                    item.validityDate ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" :
                                    "bg-white border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600"
                                )}
                            >
                                {item.validityDate ? (
                                    <span>{formatDateCompact(item.validityDate)}</span>
                                ) : (
                                    <Calendar className="h-3.5 w-3.5" />
                                )}
                                {risk && <AlertTriangle className="h-3 w-3" />}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="end">
                            <div className="flex flex-col gap-3">
                                <div className="space-y-1">
                                    <h4 className={cn("font-medium text-[10px] uppercase tracking-wider", isExpired ? "text-red-500" : "text-slate-500")}>
                                        {isExpired ? "Rate Expired!" : "Rate Validity"}
                                    </h4>
                                    <p className="text-[10px] text-slate-400">When does this specific price expire?</p>
                                </div>
                                
                                <Input 
                                    type="date" 
                                    className={cn("h-8 text-xs", isExpired ? "bg-red-50 border-red-200" : "bg-slate-50")}
                                    value={item.validityDate ? new Date(item.validityDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => updateLineItem(item.id, 'validityDate', createLocalOneDate(e.target.value))}
                                />
                                
                                {item.validityDate && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-6 w-full text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => updateLineItem(item.id, 'validityDate', undefined)}
                                    >
                                        <XCircle className="h-3 w-3 mr-1.5" /> Clear Validity
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </TableCell>

            {/* 3. COST PRICE */}
            <TableCell className="w-[10%] py-1">
                <Input 
                    disabled={isReadOnly}
                    type="number"
                    className="h-8 border-transparent bg-slate-50/50 hover:bg-white focus:bg-white text-right text-slate-600 font-mono text-xs shadow-none" 
                    value={item.buyPrice}
                    onChange={(e) => updateLineItem(item.id, 'buyPrice', parseFloat(e.target.value) || 0)}
                />
            </TableCell>

            {/* 4. CURRENCY */}
            <TableCell className="w-[8%] py-1">
                <Select 
                    disabled={isReadOnly}
                    value={item.buyCurrency} 
                    onValueChange={(v) => updateLineItem(item.id, 'buyCurrency', v as Currency)}
                >
                    <SelectTrigger className="h-8 border-transparent bg-slate-50/50 hover:bg-white text-xs font-semibold text-slate-500 shadow-none px-2">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MAD">MAD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

            {/* 5. MARKUP */}
            <TableCell className="w-[10%] py-1">
                 <div className="flex items-center gap-1">
                    <Input 
                        disabled={isReadOnly}
                        type="number"
                        className="h-8 w-full border-transparent bg-emerald-50/30 hover:bg-emerald-50 focus:bg-white text-right text-emerald-700 font-bold font-mono text-xs shadow-none" 
                        value={item.markupValue}
                        onChange={(e) => updateLineItem(item.id, 'markupValue', parseFloat(e.target.value) || 0)}
                    />
                    <Badge variant="outline" className="h-5 px-1 bg-white text-[8px] text-slate-400 border-slate-200 cursor-pointer hover:border-blue-300 hover:text-blue-500 transition-colors"
                        onClick={() => !isReadOnly && updateLineItem(item.id, 'markupType', item.markupType === 'PERCENT' ? 'FIXED_AMOUNT' : 'PERCENT')}
                    >
                        {item.markupType === 'PERCENT' ? '%' : '$'}
                    </Badge>
                 </div>
            </TableCell>

            {/* 6. VAT */}
            <TableCell className="w-[10%] py-1">
                <Select 
                    disabled={isReadOnly}
                    value={item.vatRule} 
                    onValueChange={(v) => updateLineItem(item.id, 'vatRule', v)}
                >
                    <SelectTrigger className="h-8 border-transparent bg-transparent hover:bg-slate-50 text-xs text-slate-500 shadow-none px-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="STD_20">20%</SelectItem>
                        <SelectItem value="ROAD_14">14%</SelectItem>
                        <SelectItem value="EXPORT_0_ART92">0%</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

            {/* 7. SELL PRICE (SMART) */}
            <TableCell className="w-[12%] py-1 text-right pr-4">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col items-end cursor-help group-hover:bg-slate-100 rounded px-1 transition-colors">
                                <span className="font-mono font-bold text-slate-800 text-sm flex items-center gap-1">
                                    {calc.finalVal}
                                    {/* Show conversion indicator if needed */}
                                    {item.buyCurrency !== quoteCurrency && (
                                        <RefreshCw className="h-3 w-3 text-blue-400 opacity-50" />
                                    )}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                            <div className="space-y-1">
                                <p className="font-semibold text-slate-700">Calculation Logic:</p>
                                {calc.conversionNote && (
                                    <p className="text-slate-500 italic border-b border-slate-200 pb-1 mb-1">{calc.conversionNote}</p>
                                )}
                                <p>Sell (MAD): {calc.sellInMAD.toFixed(2)}</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </TableCell>

            {/* 8. ACTIONS */}
            <TableCell className="w-[5%] py-1">
                {!isReadOnly && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        onClick={() => removeLineItem(item.id)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
      )});
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Native Datalist for Vendors */}
      <datalist id="vendors">
          {SUGGESTED_VENDORS.map(v => <option key={v.id} value={v.name} />)}
      </datalist>

      {/* Template Toolbar */}
      {!isReadOnly && (
          <div className="px-4 py-2 border-b border-dashed border-slate-200 flex justify-end bg-slate-50/30">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs border-dashed text-blue-600 border-blue-200 hover:bg-blue-50">
                          <Wand2 className="h-3 w-3 mr-2" />
                          Load Template
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Pricing Presets</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => applyTemplate('IMPORT_STD')}>
                          <span className="flex-1">Import Standard</span>
                          <Badge variant="secondary" className="text-[9px]">IMP</Badge>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => applyTemplate('EXPORT_STD')}>
                          <span className="flex-1">Export Standard</span>
                          <Badge variant="secondary" className="text-[9px]">EXP</Badge>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
          </div>
      )}

      <div className="flex-1 overflow-auto">
        <Table>
            <TableHeader className="bg-white sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="h-9 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-4">Description</TableHead>
                    <TableHead className="h-9 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor / Validity</TableHead>
                    <TableHead className="h-9 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Cost</TableHead>
                    <TableHead className="h-9 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Curr</TableHead>
                    <TableHead className="h-9 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Markup</TableHead>
                    <TableHead className="h-9 text-[10px] font-bold text-slate-400 uppercase tracking-widest">VAT</TableHead>
                    <TableHead className="h-9 text-[10px] font-bold text-blue-600 uppercase tracking-widest text-right pr-4">Sell Price</TableHead>
                    <TableHead className="h-9 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody className="px-2">
                <SectionHeader title="Origin Charges" icon={MapPin} onAdd={() => addLineItem('ORIGIN')} isCollect={false} />
                {renderRows('ORIGIN')}

                <SectionHeader title="Main Freight" icon={Ship} onAdd={() => addLineItem('FREIGHT')} isCollect={false} />
                {renderRows('FREIGHT')}

                <SectionHeader title="Destination Charges" icon={Anchor} onAdd={() => addLineItem('DESTINATION')} isCollect={true} />
                {renderRows('DESTINATION')}
                
                {items.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                <Zap className="h-8 w-8 opacity-10" />
                                <span className="text-sm font-medium">Pricing table is empty.</span>
                                <Button variant="link" size="sm" className="text-blue-500" onClick={() => applyTemplate('IMPORT_STD')}>Auto-fill Import Template</Button>
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