import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, MapPin, Ship, Anchor, Zap, Wand2 } from "lucide-react";
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

// Section Header Component with prepaid/collect logic visual
const SectionHeader = ({ title, icon: Icon, onAdd, isCollect }: { title: string, icon: any, onAdd: () => void, isCollect?: boolean }) => (
    <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
        <TableCell colSpan={8} className="py-2 pt-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1 rounded-md bg-white border shadow-sm text-slate-600">
                        <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">{title}</span>
                    {isCollect !== undefined && (
                        <Badge variant="outline" className={`text-[9px] h-5 px-1.5 ${isCollect ? 'border-orange-200 text-orange-600 bg-orange-50' : 'border-blue-200 text-blue-600 bg-blue-50'}`}>
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
      exchangeRates, quoteCurrency, status, applyTemplate 
  } = useQuoteStore();

  const isReadOnly = status !== 'DRAFT';

  // --- HELPER: Calculation Logic Display ---
  const calculateSellDisplay = (item: QuoteLineItem) => {
      // 1. Get Cost in MAD
      const buyRate = exchangeRates[item.buyCurrency] || 1;
      const costInMAD = item.buyPrice * buyRate;

      // 2. Get Sell in MAD
      let sellInMAD = 0;
      if (item.markupType === 'PERCENT') {
          sellInMAD = costInMAD * (1 + (item.markupValue / 100));
      } else {
          const marginInMAD = item.markupValue * buyRate;
          sellInMAD = costInMAD + marginInMAD;
      }

      // 3. Convert to Quote Currency (Target)
      const targetRate = exchangeRates[quoteCurrency] || 1;
      const finalSell = quoteCurrency === 'MAD' ? sellInMAD : sellInMAD / targetRate;

      return finalSell.toFixed(2);
  };

  const renderRows = (section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION') => {
      const sectionItems = items.filter(i => i.section === section);
      
      if (sectionItems.length === 0) return (
          <TableRow>
              <TableCell colSpan={8} className="h-12 text-center text-xs text-slate-300 italic">
                  No items in {section.toLowerCase()} section.
              </TableCell>
          </TableRow>
      );

      return sectionItems.map((item) => (
        <TableRow key={item.id} className="group border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
            <TableCell className="w-[30%] py-1 pl-4">
                <Input 
                    disabled={isReadOnly}
                    className="h-8 border-transparent bg-transparent hover:bg-white focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 font-medium text-slate-700 text-xs transition-all placeholder:text-slate-300 shadow-none" 
                    value={item.description}
                    placeholder="Charge Name (e.g. THC)"
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                />
            </TableCell>

            {/* COSTING SIDE (Private) */}
            <TableCell className="w-[10%] py-1">
                <Input 
                    disabled={isReadOnly}
                    type="number"
                    className="h-8 border-transparent bg-slate-50/50 hover:bg-white focus:bg-white text-right text-slate-600 font-mono text-xs shadow-none" 
                    value={item.buyPrice}
                    onChange={(e) => updateLineItem(item.id, 'buyPrice', parseFloat(e.target.value) || 0)}
                />
            </TableCell>
            <TableCell className="w-[10%] py-1">
                <Select 
                    disabled={isReadOnly}
                    value={item.buyCurrency} 
                    onValueChange={(v) => updateLineItem(item.id, 'buyCurrency', v as Currency)}
                >
                    <SelectTrigger className="h-8 border-transparent bg-slate-50/50 hover:bg-white text-xs font-semibold text-slate-500 shadow-none">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MAD">MAD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

            {/* MARKUP */}
            <TableCell className="w-[12%] py-1">
                 <div className="flex items-center gap-1">
                    <Input 
                        disabled={isReadOnly}
                        type="number"
                        className="h-8 w-16 border-transparent bg-emerald-50/30 hover:bg-emerald-50 focus:bg-white text-right text-emerald-700 font-bold font-mono text-xs shadow-none" 
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

            {/* SELLING SIDE (Public) */}
            <TableCell className="w-[15%] py-1">
                <Select 
                    disabled={isReadOnly}
                    value={item.vatRule} 
                    onValueChange={(v) => updateLineItem(item.id, 'vatRule', v)}
                >
                    <SelectTrigger className="h-8 border-transparent bg-transparent hover:bg-slate-50 text-xs text-slate-500 shadow-none">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="STD_20">20%</SelectItem>
                        <SelectItem value="ROAD_14">14%</SelectItem>
                        <SelectItem value="EXPORT_0_ART92">0%</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

            <TableCell className="w-[15%] py-1 text-right pr-6">
                <div className="flex flex-col items-end">
                    <span className="font-mono font-bold text-slate-800 text-sm">
                        {calculateSellDisplay(item)}
                    </span>
                </div>
            </TableCell>

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
      ));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
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
                    <TableHead className="h-9 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Cost</TableHead>
                    <TableHead className="h-9 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Curr</TableHead>
                    <TableHead className="h-9 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Margin</TableHead>
                    <TableHead className="h-9 text-[10px] font-bold text-slate-400 uppercase tracking-widest">VAT</TableHead>
                    <TableHead className="h-9 text-[10px] font-bold text-blue-600 uppercase tracking-widest text-right pr-6">Sell Price</TableHead>
                    <TableHead className="h-9 w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody className="px-2">
                {/* ORIGIN SECTION */}
                <SectionHeader title="Origin Charges" icon={MapPin} onAdd={() => addLineItem('ORIGIN')} isCollect={false} />
                {renderRows('ORIGIN')}

                {/* FREIGHT SECTION */}
                <SectionHeader title="Main Freight" icon={Ship} onAdd={() => addLineItem('FREIGHT')} isCollect={false} />
                {renderRows('FREIGHT')}

                {/* DESTINATION SECTION */}
                <SectionHeader title="Destination Charges" icon={Anchor} onAdd={() => addLineItem('DESTINATION')} isCollect={true} />
                {renderRows('DESTINATION')}
                
                {items.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
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