import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, PlusCircle, Lock } from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { QuoteLineItem, Currency } from "@/types/index";

export function PricingTable() {
  const { 
      items, addLineItem, updateLineItem, removeLineItem, exchangeRates, marginBuffer, incoterm, status 
  } = useQuoteStore();

  const isReadOnly = status !== 'DRAFT';

  const isSectionEnabled = (section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION') => {
      if (incoterm === 'EXW') return true; 
      if (incoterm === 'FOB') return section !== 'ORIGIN';
      if (incoterm === 'CFR' || incoterm === 'CIF') return section === 'DESTINATION';
      if (incoterm === 'DDP') return true;
      return true;
  };

  const calculateSell = (item: QuoteLineItem) => {
      const rate = exchangeRates[item.buyCurrency] || 1;
      const bufferedRate = rate * marginBuffer; 
      const costInMAD = item.buyPrice * bufferedRate;
      let sell = 0;
      if (item.markupType === 'PERCENT') {
          sell = costInMAD * (1 + (item.markupValue / 100));
      } else {
          sell = costInMAD + item.markupValue;
      }
      return sell.toFixed(2);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-auto">
        <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow>
                    <TableHead className="w-[10%]">Section</TableHead>
                    <TableHead className="w-[25%]">Description</TableHead>
                    <TableHead className="w-[10%]">Buy</TableHead>
                    <TableHead className="w-[10%]">Curr</TableHead>
                    <TableHead className="w-[10%]">Markup</TableHead>
                    <TableHead className="w-[15%]">VAT Rule</TableHead>
                    <TableHead className="w-[15%] text-right">Sell (MAD)</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-slate-400 border-dashed">
                            <div className="flex flex-col items-center gap-2">
                                <span>No charges added.</span>
                                <span className="text-xs text-slate-300">
                                    Current Incoterm: <Badge variant="secondary">{incoterm}</Badge>
                                </span>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
                
                {items.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50">
                        {/* Section */}
                        <TableCell className="p-2">
                            <Badge variant="outline" className="text-[10px] uppercase w-full justify-center bg-slate-50">
                                {item.section}
                            </Badge>
                        </TableCell>

                        {/* Description */}
                        <TableCell className="p-2">
                            <Input 
                                disabled={isReadOnly}
                                className="h-8 border-transparent hover:border-slate-200 focus:border-blue-500 bg-transparent" 
                                value={item.description}
                                placeholder="Description"
                                onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            />
                        </TableCell>

                        {/* Buy Price */}
                        <TableCell className="p-2">
                            <Input 
                                disabled={isReadOnly}
                                type="number"
                                className="h-8 border-transparent hover:border-slate-200 text-right bg-transparent" 
                                value={item.buyPrice}
                                onChange={(e) => updateLineItem(item.id, 'buyPrice', parseFloat(e.target.value) || 0)}
                            />
                        </TableCell>

                        {/* Currency */}
                        <TableCell className="p-2">
                            <Select 
                                disabled={isReadOnly}
                                value={item.buyCurrency} 
                                onValueChange={(v) => updateLineItem(item.id, 'buyCurrency', v as Currency)}
                            >
                                <SelectTrigger className="h-8 border-transparent bg-transparent">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MAD">MAD</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>

                        {/* Markup */}
                        <TableCell className="p-2">
                             <div className="flex items-center gap-1">
                                <Input 
                                    disabled={isReadOnly}
                                    type="number"
                                    className="h-8 w-16 border-transparent hover:border-slate-200 text-right bg-transparent" 
                                    value={item.markupValue}
                                    onChange={(e) => updateLineItem(item.id, 'markupValue', parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-xs text-slate-400">%</span>
                             </div>
                        </TableCell>

                        {/* VAT Rule Selector */}
                        <TableCell className="p-2">
                            <Select 
                                disabled={isReadOnly}
                                value={item.vatRule} 
                                onValueChange={(v) => updateLineItem(item.id, 'vatRule', v)}
                            >
                                <SelectTrigger className="h-8 border-transparent bg-transparent text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STD_20">20% (Std)</SelectItem>
                                    <SelectItem value="ROAD_14">14% (Tpt)</SelectItem>
                                    <SelectItem value="EXPORT_0_ART92">0% (Exp)</SelectItem>
                                    <SelectItem value="DISBURSEMENT">Exempt</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>

                        {/* Calculated Sell */}
                        <TableCell className="text-right font-mono font-medium text-slate-700">
                            {calculateSell(item)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
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
                ))}
            </TableBody>
        </Table>
      </div>

      {/* Action Bar */}
      {!isReadOnly ? (
        <div className="p-2 border-t bg-slate-50 flex gap-2 overflow-x-auto">
            {isSectionEnabled('FREIGHT') ? (
                <Button variant="outline" size="sm" onClick={() => addLineItem('FREIGHT')} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Freight
                </Button>
            ) : (
                <Button variant="ghost" disabled size="sm" className="opacity-50">
                    <Lock className="h-3 w-3 mr-2" /> Freight Locked ({incoterm})
                </Button>
            )}
            {isSectionEnabled('ORIGIN') && (
                <Button variant="ghost" size="sm" onClick={() => addLineItem('ORIGIN')}>+ Origin Charge</Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => addLineItem('DESTINATION')}>+ Destination Charge</Button>
        </div>
      ) : (
        <div className="p-2 border-t bg-slate-50 flex justify-center text-xs text-slate-500 gap-2 items-center">
             <Lock className="h-3 w-3" /> Quote is locked for editing.
        </div>
      )}
    </div>
  );
}