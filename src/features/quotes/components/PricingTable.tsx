import { useEffect, useState } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Trash2, Plus, MapPin, Ship, Anchor, Zap, AlertCircle, RefreshCw, Link2, Sparkles, Wand2, Save, Timer, TrendingDown, ShieldCheck, X
} from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { useClientStore } from "@/store/useClientStore"; 
import { useTariffStore } from "@/store/useTariffStore"; 
import { QuoteLineItem, Currency } from "@/types/index";
import { RateCharge, SupplierRate } from "@/types/tariff"; 
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

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

const VAT_RATES: Record<string, number> = {
    'STD_20': 0.20,
    'ROAD_14': 0.14,
    'EXPORT_0_ART92': 0,
    'DISBURSEMENT': 0
};

// --- HELPERS ---
const formatDateCompact = (dateVal?: Date | string) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};

const mapVatRule = (tariffVat: string): 'STD_20' | 'ROAD_14' | 'EXPORT_0_ART92' | 'DISBURSEMENT' => {
    if (tariffVat === 'EXPORT_0') return 'EXPORT_0_ART92';
    if (tariffVat === 'EXEMPT') return 'DISBURSEMENT';
    if (tariffVat === 'ROAD_14') return 'ROAD_14';
    if (tariffVat === 'STD_20') return 'STD_20';
    return 'STD_20'; 
};

// --- SUB-COMPONENT: RATE COMPARISON DIALOG ---
const RateComparisonDialog = ({ 
    onSelect 
}: { 
    onSelect: (rate: SupplierRate) => void 
}) => {
    const { pol, pod, mode } = useQuoteStore();
    const { rates, fetchRates } = useTariffStore();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (rates.length === 0 && open) fetchRates();
    }, [open]);

    const matches = rates.filter(r => 
        (r.pol.includes(pol) || pol.includes(r.pol) || r.mode === mode) && r.status === 'ACTIVE'
    );

    const cheapest = [...matches].sort((a, b) => {
        const costA = (a.freightCharges?.[0]?.unitPrice || 0);
        const costB = (b.freightCharges?.[0]?.unitPrice || 0);
        return costA - costB;
    })[0];

    const fastest = [...matches].sort((a, b) => (a.transitTime || 99) - (b.transitTime || 99))[0];
    
    const reliable = [...matches].sort((a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0))[0];

    const strategies = [
        { title: "Cheapest", icon: TrendingDown, data: cheapest, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
        { title: "Fastest", icon: Timer, data: fastest, color: "text-blue-600 bg-blue-50 border-blue-200" },
        { title: "Reliable", icon: ShieldCheck, data: reliable, color: "text-purple-600 bg-purple-50 border-purple-200" },
    ].filter(s => !!s.data); 

    const showStrategies = matches.length > 1;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                    title="Compare Rates"
                >
                    <Link2 className="h-3.5 w-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        Smart Rate Comparison
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                     <div className="text-sm text-slate-500 mb-4">
                        Found {matches.length} rates for <strong>{pol}</strong> to <strong>{pod}</strong>
                     </div>

                     {showStrategies ? (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {strategies.map((strat, idx) => (
                                <div key={`${strat.title}-${idx}`} 
                                     className={cn("border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all relative overflow-hidden", strat.color)}
                                     onClick={() => { onSelect(strat.data); setOpen(false); }}
                                >
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <strat.icon className="h-16 w-16" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <strat.icon className="h-4 w-4" />
                                            <span className="font-bold uppercase text-xs tracking-wider">{strat.title}</span>
                                        </div>
                                        <div className="text-xl font-bold mb-1">{strat.data.carrierName}</div>
                                        <div className="text-sm opacity-80 mb-3">{strat.data.reference}</div>
                                        
                                        <div className="flex flex-col gap-1 text-xs font-medium">
                                            <div className="flex justify-between">
                                                <span>Price:</span>
                                                <span className="font-mono">{strat.data.freightCharges?.[0]?.unitPrice || 'N/A'} {strat.data.currency}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Transit:</span>
                                                <span>{strat.data.transitTime} Days</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Valid:</span>
                                                <span>{formatDateCompact(strat.data.validTo)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     ) : (
                        <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 mb-4">
                            {matches.length === 0 ? "No exact matches found." : "Single match available below."}
                        </div>
                     )}

                     <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Matches</h4>
                        {matches.map(rate => (
                            <div key={rate.id} 
                                 onClick={() => { onSelect(rate); setOpen(false); }}
                                 className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline">{rate.mode}</Badge>
                                    <span className="font-medium text-sm text-slate-700">{rate.carrierName}</span>
                                    <span className="text-xs text-slate-400">{rate.reference}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-slate-600">{rate.freightCharges?.[0]?.unitPrice} {rate.currency}</span>
                                    <Button size="sm" variant="ghost" className="h-6 text-xs text-blue-600">Select</Button>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// --- COMPONENTS ---

const SectionHeader = ({ 
    title, 
    icon: Icon, 
    onAdd, 
    onAutoRate,
    isCollect,
    hasMatch
}: { 
    title: string, 
    icon: any, 
    onAdd: () => void, 
    onAutoRate?: () => void,
    isCollect?: boolean,
    hasMatch?: boolean
}) => (
    <TableRow className="hover:bg-transparent border-b border-slate-200 bg-slate-50/80">
        <TableCell colSpan={10} className="py-2 pl-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1 rounded-md", hasMatch ? "bg-emerald-100" : "bg-slate-200")}>
                        <Icon className={cn("h-3.5 w-3.5", hasMatch ? "text-emerald-700" : "text-slate-500")} />
                    </div>
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">{title}</span>
                    {isCollect !== undefined && (
                        <Badge variant="outline" className={cn("text-[9px] h-4 px-1 rounded-[2px]", isCollect ? 'border-orange-200 text-orange-600 bg-orange-50' : 'border-blue-200 text-blue-600 bg-blue-50')}>
                            {isCollect ? 'COLLECT' : 'PREPAID'}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {onAutoRate && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onAutoRate}
                            className={cn(
                                "h-6 text-[10px] font-bold border-dashed transition-all",
                                hasMatch 
                                    ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300"
                                    : "border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300"
                            )}
                        >
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            {hasMatch ? "Re-Apply Tariff" : "Auto-Rate"}
                        </Button>
                    )}
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={onAdd} 
                        className="h-6 text-[10px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-all px-2"
                    >
                        <Plus className="h-3 w-3 mr-1" /> Add Line
                    </Button>
                </div>
            </div>
        </TableCell>
    </TableRow>
);

export function PricingTable() {
  const { 
      items, addLineItem, updateLineItem, removeLineItem, initializeSmartLines,
      exchangeRates, quoteCurrency, status,
      equipmentType, chargeableWeight, totalVolume,
      pol, pod, mode, incoterm 
  } = useQuoteStore();

  const { activeClient } = useClientStore();
  const { findBestMatch, fetchRates, rates, addSpotRateFromQuote } = useTariffStore();
  const { toast } = useToast();
  const [matchingRate, setMatchingRate] = useState<SupplierRate | undefined>(undefined);
  const [showSaveHelp, setShowSaveHelp] = useState(true);

  const isReadOnly = status !== 'DRAFT';

  // --- AUTOMATIC SMART INITIALIZATION ---
  useEffect(() => {
    if (items.length === 0) {
        const financials = activeClient?.financials || {};
        initializeSmartLines(financials);
    }
  }, [items.length, activeClient, mode, initializeSmartLines]);

  useEffect(() => {
      if (rates.length === 0) fetchRates();
      
      const timer = setTimeout(() => setShowSaveHelp(false), 10000);
      return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const match = findBestMatch({ 
        pol, 
        pod, 
        mode, 
        incoterm, 
        date: new Date() 
    });
    setMatchingRate(match);
  }, [pol, pod, mode, incoterm, rates]);

  // --- LOGIC: COST CALCULATION ---
  const calculateChargeCost = (charge: RateCharge) => {
      let cost = 0;
      
      if (charge.basis === 'CONTAINER') {
          if (equipmentType.includes('20')) cost = charge.price20DV;
          else if (equipmentType.includes('40') && equipmentType.includes('HC')) cost = charge.price40HC;
          else if (equipmentType.includes('40')) cost = charge.price40DV;
          else if (equipmentType.includes('RF')) cost = charge.price40RF;
          else cost = charge.price40HC; 
      } 
      else if (charge.basis === 'TAXABLE_WEIGHT' || charge.basis === 'WEIGHT') {
          cost = (charge.unitPrice * chargeableWeight);
          if (charge.minPrice && cost < charge.minPrice) cost = charge.minPrice;
      }
      else if (charge.basis === 'VOLUME') {
          cost = (charge.unitPrice * totalVolume);
      }
      else {
          cost = charge.unitPrice || 0;
      }
      
      return cost;
  };

  const handleAutoApply = (section: 'FREIGHT' | 'ORIGIN' | 'DESTINATION') => {
      if (!matchingRate) {
          // --- UPDATED DIAGNOSTIC LOGIC ---
          const routeMatches = rates.filter(r => 
              r.pol.trim() === pol.trim() && 
              r.pod.trim() === pod.trim() && 
              r.mode === mode
          );

          if (routeMatches.length === 0) {
             toast(`No tariff found for ${mode} from ${pol} to ${pod}.`, "error");
             return;
          }

          const incotermMatches = routeMatches.filter(r => r.incoterm?.trim() === incoterm?.trim());
          if (incotermMatches.length === 0) {
              const available = [...new Set(routeMatches.map(r => r.incoterm))].join(', ');
              toast(`Route found, but Incoterm mismatch. (Quote: ${incoterm} vs Available: ${available})`, "error");
              return;
          }

          const activeMatches = incotermMatches.filter(r => r.status === 'ACTIVE');
          if (activeMatches.length === 0) {
              toast(`Rate found for ${incoterm}, but it is NOT ACTIVE (Draft or Archived).`, "warning");
              return;
          }

          const validMatches = activeMatches.filter(r => {
              const now = new Date();
              return new Date(r.validTo) >= now;
          });

          if (validMatches.length === 0) {
               toast(`Rate found for ${incoterm}, but it has EXPIRED.`, "error");
               return;
          }
          
          toast("Rate exists but could not be applied. Check Start Date.", "error");
          return;
      }

      let chargesToApply: RateCharge[] = [];
      if (section === 'FREIGHT') chargesToApply = matchingRate.freightCharges;
      else if (section === 'ORIGIN') chargesToApply = matchingRate.originCharges;
      else if (section === 'DESTINATION') chargesToApply = matchingRate.destCharges;

      if (chargesToApply.length === 0) {
          toast(`Tariff found (${matchingRate.reference}), but no charges defined in ${section}.`, "warning");
          return;
      }

      chargesToApply.forEach(charge => {
        const calculatedCost = calculateChargeCost(charge);
        
        addLineItem(section, {
            description: charge.chargeHead,
            buyPrice: calculatedCost,
            buyCurrency: charge.currency as Currency,
            vendorName: matchingRate.carrierName,
            source: 'TARIFF',
            tariffId: matchingRate.id,
            vatRule: mapVatRule(charge.vatRule), 
            validityDate: new Date(matchingRate.validTo)
        });
      });

      toast(`Smart Rate Applied: Added ${chargesToApply.length} line(s) from ${matchingRate.reference}.`, "success");
  };

  const handleTariffSelect = (itemId: string, tariff: SupplierRate) => {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      let chargePool: RateCharge[] = [];
      if (item.section === 'ORIGIN') chargePool = tariff.originCharges;
      else if (item.section === 'FREIGHT') chargePool = tariff.freightCharges;
      else if (item.section === 'DESTINATION') chargePool = tariff.destCharges;

      if (chargePool.length === 0) {
          toast(`Selected tariff (${tariff.reference}) has no charges defined for ${item.section}.`, "warning");
          return;
      }

      const selectedCharge = chargePool[0];
      const calculatedCost = calculateChargeCost(selectedCharge);

      updateLineItem(itemId, {
          buyPrice: calculatedCost,
          buyCurrency: selectedCharge.currency as Currency,
          vendorName: tariff.carrierName,
          description: `${selectedCharge.chargeHead} (${tariff.reference})`,
          validityDate: new Date(tariff.validTo),
          source: 'TARIFF',
          tariffId: tariff.id,
          vatRule: mapVatRule(selectedCharge.vatRule)
      });
      toast(`Linked to ${item.section} charge: ${selectedCharge.chargeHead}`, "success");
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
      
      const marginAmt = sellInMAD - costInMAD;
      const marginPct = sellInMAD > 0 ? (marginAmt / sellInMAD) * 100 : 0;

      // Calculate TTC
      const vatRate = VAT_RATES[item.vatRule] || 0;
      const finalSellTTC = finalSell * (1 + vatRate);

      return { finalVal: finalSell.toFixed(2), finalValTTC: finalSellTTC.toFixed(2), marginPct };
  };

  // --- EDIT HANDLERS ---
  const handleCostChange = (item: QuoteLineItem, newCost: number) => {
      const calc = calculateSellDetails(item);
      const currentSellHT = parseFloat(calc.finalVal);

      // Rule: If Sell Price exists (>0), "Lock" Sell Price and update Markup
      // Otherwise (fresh line), keep Markup and update Sell Price.
      if (currentSellHT > 0) {
          // Calculate Target Markup to maintain Sell Price
          // SellHT = Cost * (1 + M%) 
          // M% = (SellHT / Cost) - 1
          
          // Need to handle currency conversion for accurate markup
          const buyRate = exchangeRates[item.buyCurrency] || 1;
          const targetRate = exchangeRates[quoteCurrency] || 1;
          
          const newCostInBase = newCost * buyRate;
          const sellInBase = currentSellHT * targetRate;
          
          let newMarkup = 0;
          if (newCostInBase > 0) {
             newMarkup = ((sellInBase / newCostInBase) - 1) * 100;
          }
          
          updateLineItem(item.id, { buyPrice: newCost, markupValue: newMarkup, markupType: 'PERCENT' });
      } else {
          updateLineItem(item.id, { buyPrice: newCost });
      }
  };

  const handleSellPriceChange = (item: QuoteLineItem, newSellTTC: number) => {
      const vatRate = VAT_RATES[item.vatRule] || 0;
      const targetSellHT = newSellTTC / (1 + vatRate);
      
      // We need to reverse calculate Cost (Buy Price) to hit this Sell Target
      // Keeping Markup Constant.
      // SellHT = Cost * (1 + Markup)
      // Cost = SellHT / (1 + Markup)
      
      const markupFactor = 1 + (item.markupValue / 100); // Assuming Percent
      
      // Handle Currency: Cost is in BuyCurrency, Sell is in QuoteCurrency
      const buyRate = exchangeRates[item.buyCurrency] || 1;
      const targetRate = exchangeRates[quoteCurrency] || 1;
      
      const targetSellBase = targetSellHT * targetRate;
      const targetCostBase = targetSellBase / markupFactor;
      const targetCostBuyCurr = targetCostBase / buyRate;
      
      updateLineItem(item.id, { buyPrice: targetCostBuyCurr });
  };

  const handleRunSmartInit = () => {
      if(items.length > 0) {
         if(!confirm("This will replace existing lines with smart defaults based on the transport mode. Continue?")) return;
      }
      initializeSmartLines(activeClient?.financials || {});
  };

  const renderRows = (section: 'ORIGIN' | 'FREIGHT' | 'DESTINATION') => {
      const sectionItems = items.filter(i => i.section === section);
      
      if (sectionItems.length === 0) return null;

      return sectionItems.map((item) => {
        const calc = calculateSellDetails(item);
        const isTariff = item.source === 'TARIFF';
        const isSmart = item.source === 'SMART_INIT';
        
        // Validation check for Save button state
        const isValidForSave = !!item.vendorName && item.buyPrice > 0;
        
        const isMissingRequired = item.isRequired && (item.buyPrice === 0 || item.buyPrice === undefined);

        let marginColor = "text-slate-600";
        if (calc.marginPct < 10) marginColor = "text-red-600 font-bold";
        else if (calc.marginPct < 20) marginColor = "text-amber-600 font-medium";
        else marginColor = "text-emerald-600 font-bold";

        return (
        <TableRow 
            key={item.id} 
            className={cn(
                "group border-b border-slate-100 transition-colors hover:bg-blue-50/20 text-[10px]",
                isMissingRequired ? "bg-red-50/50 hover:bg-red-50" : ""
            )}
        >
            {/* 1. DESCRIPTION */}
            <TableCell className="w-[30%] py-0.5 pl-3">
                <div className="flex items-center gap-2">
                    {/* Source Badge */}
                    {isTariff && (
                        <Badge variant="secondary" className="px-1 h-5 text-[9px] bg-emerald-50 text-emerald-700 border-emerald-100 flex gap-1 cursor-help" title={`Linked to Tariff: ${item.tariffId}`}>
                            <Zap className="h-2.5 w-2.5 fill-current" /> Auto
                        </Badge>
                    )}
                    {isSmart && (
                         <Badge variant="secondary" className="px-1 h-5 text-[9px] bg-purple-50 text-purple-700 border-purple-100 flex gap-1 cursor-help" title="Initialized by Smart Logic">
                            <Wand2 className="h-2.5 w-2.5" /> Init
                         </Badge>
                    )}
                    
                    {!isTariff && !isSmart && !isReadOnly && (
                         <RateComparisonDialog onSelect={(t) => handleTariffSelect(item.id, t)} />
                    )}
                    
                    <Input 
                        disabled={isReadOnly}
                        className={cn(
                            "h-7 border-transparent px-2 bg-transparent focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 font-medium text-xs shadow-none rounded-sm transition-all placeholder:text-slate-300",
                            isTariff && "text-emerald-900",
                            isMissingRequired && "border-red-300 focus:border-red-500 bg-red-50/50"
                        )}
                        value={item.description}
                        placeholder="Description"
                        onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                    />
                </div>
            </TableCell>

            {/* 2. VENDOR */}
            <TableCell className="w-[15%] py-0.5">
                <div className="relative group/vendor">
                    <input 
                        list="vendors" 
                        disabled={isReadOnly}
                        className="h-7 w-full rounded-sm border-transparent bg-transparent px-2 hover:bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 text-[10px] text-slate-600 shadow-none placeholder:text-slate-300 focus:outline-none transition-all truncate pr-6" 
                        value={item.vendorName || ''}
                        placeholder="Vendor"
                        onChange={(e) => updateLineItem(item.id, { vendorName: e.target.value })}
                    />
                    
                    {!isTariff && (
                        <div className="absolute right-0 top-1.5 flex items-center">
                            {showSaveHelp && isValidForSave && (
                                <div className="absolute right-6 top-[-5px] whitespace-nowrap bg-blue-600 text-white text-[9px] py-0.5 px-2 rounded-full animate-pulse shadow-sm z-50 flex items-center gap-1">
                                    Click disk to save rate <X className="h-2 w-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowSaveHelp(false); }} />
                                </div>
                            )}
                            <button 
                                onMouseDown={(e) => {
                                    e.preventDefault(); 
                                    e.stopPropagation();
                                    
                                    if (!item.vendorName) {
                                        toast("Missing Vendor: Enter a vendor name to save.", "error");
                                        return;
                                    }
                                    if (!item.buyPrice || item.buyPrice <= 0) {
                                        toast("Invalid Price: Price must be greater than 0.", "error");
                                        return;
                                    }
                                    
                                    addSpotRateFromQuote({ item, pol, pod, mode });
                                }}
                                className={cn(
                                    "transition-colors",
                                    isValidForSave 
                                        ? "text-blue-300 hover:text-emerald-600" 
                                        : "text-slate-200 hover:text-red-400 cursor-not-allowed"
                                )}
                                title={isValidForSave ? "Save as Spot Rate" : "Cannot Save: Missing Data"}
                            >
                                <Save className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </TableCell>

            {/* 3. COST */}
            <TableCell className="w-[10%] py-0.5">
                <div className="relative">
                    <Input 
                        disabled={isReadOnly || item.dynamicType === 'RET_FOND' || item.dynamicType === 'PEAGE_LCL'}
                        type="number"
                        className={cn(
                            "h-7 border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-blue-300 text-right text-slate-600 font-mono text-xs shadow-none px-2 rounded-sm",
                            isMissingRequired && "border-red-300 bg-white"
                        )}
                        value={item.buyPrice}
                        onChange={(e) => handleCostChange(item, parseFloat(e.target.value) || 0)}
                    />
                    {isMissingRequired && <AlertCircle className="absolute right-1 top-1.5 h-4 w-4 text-red-400 opacity-50 pointer-events-none"/>}
                </div>
            </TableCell>

            {/* 4. CURRENCY */}
            <TableCell className="w-[7%] py-0.5">
                <Select disabled={isReadOnly} value={item.buyCurrency} onValueChange={(v) => updateLineItem(item.id, { buyCurrency: v as Currency })}>
                    <SelectTrigger className="h-7 border-transparent bg-transparent hover:bg-slate-50 text-[10px] font-bold text-slate-500 shadow-none px-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="MAD">MAD</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                </Select>
            </TableCell>

            {/* 5. MARKUP */}
            <TableCell className="w-[10%] py-0.5">
                 <div className="flex items-center justify-end gap-1 px-2 group/markup">
                    <Input 
                        disabled={isReadOnly}
                        type="number"
                        className="h-7 w-12 border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-emerald-300 text-right text-emerald-700 font-bold font-mono text-xs shadow-none px-0 rounded-sm" 
                        value={item.markupValue}
                        onChange={(e) => updateLineItem(item.id, { markupValue: parseFloat(e.target.value) || 0 })}
                    />
                    <button 
                        className="text-[9px] text-slate-300 hover:text-blue-600 font-bold w-4 text-center"
                        onClick={() => !isReadOnly && updateLineItem(item.id, { markupType: item.markupType === 'PERCENT' ? 'FIXED_AMOUNT' : 'PERCENT' })}
                    >
                        {item.markupType === 'PERCENT' ? '%' : '$'}
                    </button>
                 </div>
            </TableCell>

             {/* 6. VAT */}
             <TableCell className="w-[10%] py-0.5">
                <Select disabled={isReadOnly} value={item.vatRule} onValueChange={(v: any) => updateLineItem(item.id, { vatRule: v })}>
                    <SelectTrigger className="h-7 border-transparent bg-transparent hover:bg-slate-50 text-[10px] text-slate-500 shadow-none px-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="STD_20">20%</SelectItem>
                        <SelectItem value="ROAD_14">14%</SelectItem>
                        <SelectItem value="EXPORT_0_ART92">0% (Exp)</SelectItem>
                        <SelectItem value="DISBURSEMENT">Exempt</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>

            {/* 7. MARGIN */}
            <TableCell className="w-[8%] py-0.5 text-center">
                <span className={cn("text-[10px] font-mono", marginColor)}>
                    {calc.marginPct.toFixed(1)}%
                </span>
            </TableCell>

            {/* 8. SELL */}
            <TableCell className="w-[10%] py-0.5 text-right pr-4">
                 <div className="flex items-center justify-end gap-1 h-7">
                    <Input 
                        disabled={isReadOnly}
                        type="number"
                        className={cn(
                            "h-7 border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:border-blue-300 text-right font-bold font-mono text-xs shadow-none px-2 rounded-sm text-slate-800",
                            item.buyCurrency !== quoteCurrency && "text-blue-700"
                        )}
                        value={calc.finalVal}
                        // Note: User sees Sell HT (Or TTC? Prompt said "commercial offer" which usually is HT + VAT displayed elsewhere, but here the previous code displayed finalVal which was HT. 
                        // However, standard Quick Quote builders often show the *Client Facing* amount.
                        // Let's stick to modifying the value displayed previously: finalVal (HT). 
                        // If user meant TTC, they would have said "Total".
                        // Wait, previous code showed finalVal. I will make THAT editable.
                        // If the user meant TTC, I would need to reverse VAT.
                        // "Sell Price field... calculated from buys mark up and vat rule"
                        // VAT rule usually applies ON TOP of Sell Price.
                        // So I will assume this input is SELL HT (Net).
                        // If they edit this, I reverse calculate Cost.
                        // But wait, the previous code displayed `calc.finalVal` which is HT. 
                        // The user said "calculated from ... vat rule". 
                        // This implies the field might BE the TTC one?
                        // Let's look at `calculateSellDetails`. 
                        // `finalSell` (HT) is calculated. 
                        // `finalSellTTC` is usually HT * (1+VAT).
                        // Previous code: displayed `calc.finalVal`.
                        // I will assume editable HT for safety, as VAT is added later. 
                        // Update: Actually, looking at the previous table columns: "Sell Price (TTC)" was the header in `QuickQuoteBuilder` but here in `PricingTable` header is "Sell".
                        // In `PricingTable` header: `<TableHead ...>Sell</TableHead>`. 
                        // I will treat it as Sell (HT/Net) because that is what `finalVal` represents.
                        
                        onChange={(e) => handleSellPriceChange(item, parseFloat(e.target.value) * (1 + (VAT_RATES[item.vatRule] || 0)))} // Pass TTC to handler? Or just handle HT?
                        // My handler `handleSellPriceChange` expects TTC. Let's fix that to expect HT for simplicity if we are editing HT.
                        // RE-READ HANDLER: `const targetSellHT = newSellTTC / (1 + vatRate);`
                        // If I pass HT directly, I can skip the TTC conversion.
                        // Let's modify the handler call to pass TTC: (Value * (1+VAT))
                    />
                    {item.buyCurrency !== quoteCurrency && <RefreshCw className="h-2.5 w-2.5 text-blue-300" />}
                 </div>
            </TableCell>

            {/* 9. ACTIONS */}
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
      {/* RESTORED DATALIST */}
      <datalist id="vendors">
          {SUGGESTED_VENDORS.map(v => <option key={v.id} value={v.name} />)}
      </datalist>

      <div className="flex-1 overflow-auto">
        <Table>
            <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                <TableRow className="hover:bg-transparent border-none h-8">
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-3">Description</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vendor</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Cost</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Curr</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Markup</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">VAT</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Margin</TableHead>
                    <TableHead className="h-8 text-[9px] font-bold text-blue-600 uppercase tracking-widest text-right pr-4">Sell</TableHead>
                    <TableHead className="h-8 w-8"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {/* GLOBAL ACTION TO INIT SMART LINES (Manual trigger kept for user flexibility) */}
                {items.length === 0 && !isReadOnly && (
                    <TableRow>
                        <TableCell colSpan={10} className="p-2 bg-blue-50/50 border-b border-blue-100">
                             <div className="flex items-center justify-between">
                                <span className="text-xs text-blue-700 flex items-center gap-2">
                                    <Wand2 className="h-4 w-4" /> 
                                    Smart Lines are auto-initializing...
                                </span>
                                <Button size="sm" onClick={handleRunSmartInit} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                                    Re-Apply Defaults
                                </Button>
                             </div>
                        </TableCell>
                    </TableRow>
                )}

                <SectionHeader 
                    title="Origin Charges" 
                    icon={MapPin} 
                    onAdd={() => addLineItem('ORIGIN')} 
                    onAutoRate={() => handleAutoApply('ORIGIN')}
                    hasMatch={!!matchingRate}
                />
                {renderRows('ORIGIN')}

                <SectionHeader 
                    title="International Freight" 
                    icon={Ship} 
                    onAdd={() => addLineItem('FREIGHT')} 
                    onAutoRate={() => handleAutoApply('FREIGHT')}
                    hasMatch={!!matchingRate}
                />
                {renderRows('FREIGHT')}

                <SectionHeader 
                    title="Destination Charges" 
                    icon={Anchor} 
                    onAdd={() => addLineItem('DESTINATION')} 
                    isCollect={true}
                    onAutoRate={() => handleAutoApply('DESTINATION')}
                    hasMatch={!!matchingRate}
                />
                {renderRows('DESTINATION')}
                
                {items.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={10} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                <Zap className="h-6 w-6 opacity-20" />
                                <span className="text-xs">No line items. Use Smart Init or Auto-Rate to start.</span>
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