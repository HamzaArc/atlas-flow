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
import { Trash2, Plus, Plane, Ship, MapPin, Anchor } from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { QuoteLineItem, Currency } from "@/types/index";

// Section Header Component
const SectionHeader = ({ title, icon: Icon, onAdd }: { title: string, icon: any, onAdd: () => void }) => (
    <TableRow className="bg-slate-100 hover:bg-slate-100">
        <TableCell colSpan={8} className="py-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <Icon className="h-4 w-4 text-slate-500" />
                    {title}
                </div>
                <Button size="sm" variant="ghost" onClick={onAdd} className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <Plus className="h-3 w-3 mr-1" /> Add Charge
                </Button>
            </div>
        </TableCell>
    </TableRow>
);

export function PricingTable() {
  const { 
      items, addLineItem, updateLineItem, removeLineItem, 
      exchangeRates, quoteCurrency, status 
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
      
      if (sectionItems.length === 0) return null;

      return sectionItems.map((item) => (
        <TableRow key={item.id} className="group hover:bg-slate-50">
            <TableCell className="w-[30%]">
                <Input 
                    disabled={isReadOnly}
                    className="h-8 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent font-medium" 
                    value={item.description}
                    placeholder="Charge Name (e.g. THC)"
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                />
            </TableCell>

            {/* COSTING SIDE (Private) */}
            <TableCell className="w-[10%]">
                <Input 
                    disabled={isReadOnly}
                    type="number"
                    className="h-8 border-transparent hover:border-slate-200 text-right bg-transparent text-slate-500" 
                    value={item.buyPrice}
                    onChange={(e) => updateLineItem(item.id, 'buyPrice', parseFloat(e.target.value) || 0)}
                />
            </TableCell>
            <TableCell className="w-[10%]">
                <Select 
                    disabled={isReadOnly}
                    value={item.buyCurrency} 
                    onValueChange={(v) => updateLineItem(item.id, 'buyCurrency', v as Currency)}
                >
                    <SelectTrigger className="h-8 border-transparent bg-transparent text-xs text-slate-500">
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
            <TableCell className="w-[12%]">
                 <div className="flex items-center gap-1">
                    <Input 
                        disabled={isReadOnly}
                        type="number"
                        className="h-8 w-16 border-transparent hover:border-slate-200 text-right bg-transparent text-green-600 font-medium" 
                        value={item.markupValue}
                        onChange={(e) => updateLineItem(item.id, 'markupValue', parseFloat(e.target.value) || 0)}
                    />
                    <Badge variant="outline" className="text-[10px] h-5 px-1 bg-slate-50 text-slate-400">
                        {item.markupType === 'PERCENT' ? '%' : 'Fix'}
                    </Badge>
                 </div>
            </TableCell>

            {/* SELLING SIDE (Public) */}
            <TableCell className="w-[15%]">
                <Select 
                    disabled={isReadOnly}
                    value={item.vatRule} 
                    onValueChange={(v) => updateLineItem(item.id, 'vatRule', v)}
                >
                    <SelectTrigger className="h-8 border-transparent bg-transparent text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="STD_20">20%</SelectItem>
                        <SelectItem value="ROAD_14">14%</SelectItem>
                        <SelectItem value="EXPORT_0_ART92">0%</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

            <TableCell className="w-[15%] text-right font-mono font-bold text-slate-800 bg-slate-50/50">
                {calculateSellDisplay(item)} <span className="text-[10px] text-slate-400 font-normal">{quoteCurrency}</span>
            </TableCell>

            <TableCell className="w-[5%]">
                {!isReadOnly && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                        onClick={() => removeLineItem(item.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
      ));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-auto">
        <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <TableRow>
                    <TableHead className="text-xs uppercase tracking-wider">Item Description</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-right">Cost</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Curr</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-right">Margin</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">VAT</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-right text-blue-700">Sell Price</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {/* ORIGIN SECTION */}
                <SectionHeader title="Origin Charges (Pre-Carriage / POL)" icon={MapPin} onAdd={() => addLineItem('ORIGIN')} />
                {renderRows('ORIGIN')}

                {/* FREIGHT SECTION */}
                <SectionHeader title="Main Freight" icon={Ship} onAdd={() => addLineItem('FREIGHT')} />
                {renderRows('FREIGHT')}

                {/* DESTINATION SECTION */}
                <SectionHeader title="Destination Charges (POD / Delivery)" icon={Anchor} onAdd={() => addLineItem('DESTINATION')} />
                {renderRows('DESTINATION')}
                
                {items.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-slate-400">
                            Click "Add Charge" above to build your quote.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}