import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Plus,  
  Edit2, Trash2, Printer, FileCheck, 
  DollarSign, Mail, MoreHorizontal,
  Anchor, Box, Truck, Shield, AlertTriangle,
  Activity} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { useFinanceStore } from "@/store/useFinanceStore"; 
import { ChargeLine, Currency, ChargeStatus, VatRule } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// --- CONSTANTS & TYPES ---

const FX_RATES: Record<Currency, number> = { 
    USD: 10.05, 
    EUR: 10.85, 
    MAD: 1.00, 
    GBP: 12.50 
};

// VAT Rules Definition for Morocco
const VAT_RULES: { value: VatRule; label: string; rate: number }[] = [
    { value: 'STD_20', label: 'Standard (20%)', rate: 20 },
    { value: 'ROAD_14', label: 'Transport Routier (14%)', rate: 14 },
    { value: 'EXPORT_0_ART92', label: 'Export Exemption (Art 92)', rate: 0 },
    { value: 'EXEMPT_0', label: 'Exonéré (0%)', rate: 0 },
];

export const DossierFinancialsTab = () => {
  const { dossier } = useDossierStore();
  const { ledger, loadLedger, addCharge, updateCharge, deleteCharge, generateInvoice } = useFinanceStore();
  
  // Load Ledger
  useEffect(() => {
      if (dossier.id && !dossier.id.startsWith('new-')) {
          loadLedger(dossier.id);
      }
  }, [dossier.id, loadLedger]);

  // --- STATE ---
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeSide, setActiveSide] = useState<'AR' | 'AP' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<Partial<ChargeLine>>({});
  
  // Specific State for VAT Handling in Dialog
  const [selectedVatRule, setSelectedVatRule] = useState<VatRule>('STD_20');

  // --- CALCULATIONS (KPIs) ---
  const costs = useMemo(() => ledger.filter(l => l.type === 'EXPENSE'), [ledger]);
  const revenue = useMemo(() => ledger.filter(l => l.type === 'INCOME'), [ledger]);

  const calculateTotal = (lines: ChargeLine[], statusFilter?: 'CONFIRMED' | 'ALL') => {
    return lines.reduce((acc: number, line: ChargeLine) => {
      if (statusFilter === 'CONFIRMED' && (line.status === 'ESTIMATED')) return acc;
      
      const rate = line.exchangeRate || FX_RATES[line.currency] || 1;
      const base = line.amount * rate;
      const vat = base * (line.vatRate / 100);
      return acc + base + vat;
    }, 0);
  };

  // KPIs
  const totalRev = calculateTotal(revenue, 'ALL');
  const confirmedRev = calculateTotal(revenue, 'CONFIRMED');
  const totalCost = calculateTotal(costs, 'ALL');
  const grossProfit = totalRev - totalCost;
  const marginPercent = totalRev > 0 ? (grossProfit / totalRev) * 100 : 0;

  // Payment Progress
  const paidAmount = revenue
    .filter(r => r.status === 'PAID')
    .reduce((acc, r) => acc + (r.amount * (r.exchangeRate || 1) * (1 + r.vatRate/100)), 0);
  
  const paymentProgress = totalRev > 0 ? (paidAmount / totalRev) * 100 : 0;

  let invoiceStatusLabel = 'Pending Invoicing';
  if (paymentProgress === 100) invoiceStatusLabel = 'Fully Paid';
  else if (paymentProgress > 0) invoiceStatusLabel = 'Partially Paid';
  else if (revenue.some(r => r.status === 'INVOICED')) invoiceStatusLabel = 'Invoiced - Unpaid';

  // --- HANDLERS ---

  const handleSelection = (id: string, checked: boolean) => {
      const newSet = new Set(selectedIds);
      if(checked) newSet.add(id);
      else newSet.delete(id);
      setSelectedIds(newSet);
  };

  const handleGenerateInvoice = async () => {
    if(selectedIds.size === 0) return;
    if(confirm(`Generate Invoice for ${selectedIds.size} items? This will lock the selected charges.`)) {
        await generateInvoice(dossier.id, Array.from(selectedIds), 'INVOICE');
        setSelectedIds(new Set());
    }
  };

  const handleOpenAdd = (side: 'AR' | 'AP') => {
    setActiveSide(side);
    setSelectedVatRule('STD_20');
    setEditingLine({
      description: '',
      amount: 0,
      currency: 'MAD',
      vatRate: 20,
      status: 'ESTIMATED',
      code: 'MISC'
    });
    setIsDialogOpen(true);
  };

  const handleEditLine = (line: ChargeLine, side: 'AR' | 'AP') => {
    setActiveSide(side);
    // Find the matching rule for the rate, or default
    const rule = VAT_RULES.find(r => r.rate === line.vatRate)?.value || 'STD_20';
    setSelectedVatRule(rule);
    setEditingLine({ ...line });
    setIsDialogOpen(true);
  };

  const handleSaveLine = async () => {
    if (!editingLine.description || !activeSide) return;

    const vatInfo = VAT_RULES.find(r => r.value === selectedVatRule) || VAT_RULES[0];

    const payload: Partial<ChargeLine> = {
      ...editingLine,
      dossierId: dossier.id,
      type: activeSide === 'AR' ? 'INCOME' : 'EXPENSE',
      exchangeRate: FX_RATES[editingLine.currency as Currency] || 1,
      vatRule: vatInfo.value,
      vatRate: vatInfo.rate, // Auto-set rate based on rule
      code: editingLine.code || 'MISC'
    };

    if (editingLine.id) {
        await updateCharge(editingLine.id, payload);
    } else {
        await addCharge(payload);
    }
    setIsDialogOpen(false);
  };

  const deleteLine = async (id: string) => {
    if (confirm('Are you sure you want to delete this line?')) {
        await deleteCharge(id);
    }
  };

  // --- UI COMPONENTS ---

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'PAID': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'INVOICED': 'bg-blue-50 text-blue-700 border-blue-200',
      'READY_TO_INVOICE': 'bg-purple-50 text-purple-700 border-purple-200',
      'ESTIMATED': 'bg-slate-100 text-slate-500 border-slate-200 border-dashed',
    };
    return (
      <span className={cn("px-2 py-0.5 inline-flex text-[10px] font-bold uppercase tracking-wider rounded border", styles[status] || styles['ESTIMATED'])}>
         {status === 'ESTIMATED' ? 'Quote / Est.' : status}
      </span>
    );
  };

  const getCategoryIcon = (cat: string) => {
     if (cat === 'OF' || cat === 'Freight') return <Anchor size={14} className="text-blue-600" />;
     if (cat === 'THC' || cat === 'Origin') return <Box size={14} className="text-orange-600" />;
     if (cat === 'DTHC' || cat === 'Destination') return <Truck size={14} className="text-emerald-600" />;
     if (cat === 'DUM' || cat === 'Customs') return <Shield size={14} className="text-purple-600" />;
     return <AlertTriangle size={14} className="text-slate-400" />;
  };

  // --- MAIN TABLE COMPONENT ---
  const FinancialTable = ({ title, items, side }: { title: string, items: ChargeLine[], side: 'AR' | 'AP' }) => {
    const isAR = side === 'AR';
    
    // Split items into Estimated vs Actual for Readability
    const estimatedItems = items.filter(i => i.status === 'ESTIMATED');
    const actualItems = items.filter(i => i.status !== 'ESTIMATED');

    const renderRows = (itemList: ChargeLine[], isEstimated: boolean) => (
        itemList.map((item) => {
            const rate = item.exchangeRate || FX_RATES[item.currency] || 1;
            const total = item.amount * (1 + item.vatRate/100);
            const totalMAD = total * rate;
            const isForeign = item.currency !== 'MAD';
            
            return (
               <tr key={item.id} className={cn(
                   "group transition-colors border-b border-slate-50",
                   isEstimated ? "bg-slate-50/50 hover:bg-slate-100" : "bg-white hover:bg-blue-50/10"
               )}>
                  {isAR && (
                      <td className="px-3 py-3 text-center w-[40px]">
                          <Checkbox 
                               checked={selectedIds.has(item.id)}
                               onCheckedChange={(c) => handleSelection(item.id, c as boolean)}
                               disabled={item.status === 'INVOICED' || item.status === 'PAID'}
                               className={isEstimated ? "border-slate-300" : "border-blue-400"}
                          />
                      </td>
                  )}
                  <td className="px-4 py-3">
                     <div className="flex items-start gap-3">
                       <div className="mt-0.5 p-1.5 rounded-md bg-white border border-slate-100 shadow-sm">{getCategoryIcon(item.code || '')}</div>
                       <div className={isEstimated ? "opacity-75" : ""}>
                          <div className="text-xs font-bold text-slate-900 leading-tight mb-0.5">{item.description}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{item.code || 'MISC'}</div>
                       </div>
                     </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                     <div className={cn("text-xs font-mono font-medium", isEstimated ? "text-slate-500" : "text-slate-900")}>
                        {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-[9px] text-slate-400 ml-1">{item.currency}</span>
                     </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                     {item.vatRate > 0 ? (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                           {item.vatRate}%
                        </span>
                     ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                     <div className={cn("text-xs font-bold font-mono", isEstimated ? "text-slate-600" : "text-slate-900")}>
                        {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-[9px] text-slate-400 ml-1">{item.currency}</span>
                     </div>
                     {isForeign && (
                        <div className="text-[9px] text-slate-400 mt-0.5">≈ {totalMAD.toLocaleString(undefined, { maximumFractionDigits: 0 })} MAD</div>
                     )}
                  </td>
                  <td className="px-4 py-3 text-center">
                     {getStatusBadge(item.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                           <MoreHorizontal className="h-4 w-4 text-slate-400" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={() => handleEditLine(item, side)}>
                           <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit Line
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => deleteLine(item.id)} className="text-red-600 focus:text-red-600">
                           <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Line
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                  </td>
               </tr>
            );
        })
    );

    return (
      <Card className="flex flex-col h-full overflow-hidden border-slate-200 shadow-sm">
         <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${isAR ? 'bg-gradient-to-r from-emerald-50/30 to-white' : 'bg-gradient-to-r from-red-50/30 to-white'}`}>
            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-xl shadow-sm ${isAR ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {isAR ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
               </div>
               <div>
                  <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                     {items.length} Lines • {isAR ? `Bill To: ${dossier.clientName}` : 'Vendor Costs'}
                  </p>
               </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleOpenAdd(side)} className="bg-white hover:bg-slate-50 border-slate-200 text-slate-600">
               <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
         </div>

         <div className="flex-1 overflow-auto custom-scrollbar bg-white min-h-[300px]">
            <table className="min-w-full divide-y divide-slate-100">
               <thead className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                     {isAR && <th className="px-3 py-3 w-[40px] text-center">Sel.</th>}
                     <th className="px-4 py-3 text-left w-[35%]">Description</th>
                     <th className="px-4 py-3 text-right w-[15%]">Net</th>
                     <th className="px-4 py-3 text-right w-[10%]">VAT</th>
                     <th className="px-4 py-3 text-right w-[20%]">Total</th>
                     <th className="px-4 py-3 text-center w-[15%]">Status</th>
                     <th className="px-4 py-3 w-[5%]"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {/* ACTUAL / INVOICED SECTION */}
                  {actualItems.length > 0 && (
                      <>
                        <tr className="bg-slate-50/80"><td colSpan={7} className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Finalized / Actuals</td></tr>
                        {renderRows(actualItems, false)}
                      </>
                  )}
                  
                  {/* ESTIMATED SECTION */}
                  {estimatedItems.length > 0 && (
                      <>
                        <tr className="bg-slate-50/80"><td colSpan={7} className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 border-t">Pending / Estimated</td></tr>
                        {renderRows(estimatedItems, true)}
                      </>
                  )}

                  {items.length === 0 && (
                     <tr>
                         <td colSpan={7}>
                             <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <DollarSign size={24} className="opacity-20 mb-2" />
                                <p className="text-sm font-medium">No line items</p>
                             </div>
                         </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
            <div>
               <span className="font-bold text-slate-500 uppercase tracking-wide mr-2">Confirmed Total</span>
               <span className="text-slate-400">(Excl. Estimates)</span>
            </div>
            <div className="text-right">
                <span className="text-sm font-bold text-slate-900 font-mono block">
                {(isAR ? calculateTotal(actualItems, 'ALL') : calculateTotal(actualItems, 'ALL')).toLocaleString()} MAD
                </span>
                {estimatedItems.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium italic">
                        + {(isAR ? calculateTotal(estimatedItems, 'ALL') : calculateTotal(estimatedItems, 'ALL')).toLocaleString()} MAD Estimated
                    </span>
                )}
            </div>
         </div>
      </Card>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-32 space-y-8 relative">
      
      {/* 1. Header & FX Ticker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
             <h2 className="text-lg font-bold text-slate-900">Job Profitability</h2>
             <p className="text-sm text-slate-500">Manage operational costs, revenue, and client invoicing.</p>
         </div>
         <div className="flex items-center gap-5 text-xs text-slate-500 font-mono bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 text-blue-600 font-bold">
                 <Activity size={14} />
                 <span>LIVE FX</span>
             </div>
             <Separator orientation="vertical" className="h-4" />
             <span>USD <b className="text-slate-900">{FX_RATES.USD}</b></span>
             <span className="text-slate-300">|</span>
             <span>EUR <b className="text-slate-900">{FX_RATES.EUR}</b></span>
         </div>
      </div>

      {/* 2. KPI Cards (RESTORED AS REQUESTED) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Revenue */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={18}/></div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{totalRev.toLocaleString()} <span className="text-sm font-medium text-slate-400">MAD</span></div>
                <div className="text-[10px] text-slate-400 mt-1 font-medium">
                    Confirmed: <span className="text-emerald-600">{confirmedRev.toLocaleString()}</span>
                </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-emerald-500 h-full w-full"></div>
            </div>
         </div>

         {/* Costs */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Costs</span>
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={18}/></div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{totalCost.toLocaleString()} <span className="text-sm font-medium text-slate-400">MAD</span></div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-red-500 h-full" style={{ width: '60%' }}></div>
            </div>
         </div>

         {/* Net Margin */}
         <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-slate-800 opacity-20 group-hover:opacity-30 transition-opacity">
               <DollarSign size={100} />
            </div>
            <div className="relative z-10">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Profit</span>
               <div className="text-3xl font-bold mt-2 mb-1">
                  {grossProfit.toLocaleString()} <span className="text-lg font-medium text-slate-500">MAD</span>
               </div>
               <Badge className={cn("border-0", marginPercent >= 20 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400')}>
                  {marginPercent.toFixed(1)}% Margin
               </Badge>
            </div>
         </div>

         {/* Payment Status (Actionable) */}
         <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
             <div>
                <div className="flex justify-between items-start mb-4">
                   <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Payment Status</div>
                   {paymentProgress < 100 && paymentProgress > 0 && (
                       <button className="text-[10px] font-bold bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded-lg shadow-sm hover:bg-blue-50 flex items-center gap-1 transition-colors">
                           <Mail size={12} /> Remind
                       </button>
                   )}
                </div>
                <div className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    {invoiceStatusLabel}
                </div>
                <div className="w-full bg-white border border-blue-100 h-2.5 rounded-full overflow-hidden mb-2">
                   <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${paymentProgress}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Paid: {paidAmount.toLocaleString()}</span>
                    <span>Due: {(totalRev - paidAmount).toLocaleString()}</span>
                </div>
             </div>
         </div>
      </div>

      {/* 3. Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[500px]">
         <FinancialTable title="Payables (AP)" items={costs} side="AP" />
         <FinancialTable title="Receivables (AR)" items={revenue} side="AR" />
      </div>

      {/* 4. Floating Action Bar */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2.5 flex items-center gap-3 z-30 ring-1 ring-slate-900/5">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
          >
             <Printer size={18} /> Print Pro-Forma
          </button>
          <div className="w-px h-8 bg-slate-200"></div>
          <button 
            onClick={handleGenerateInvoice}
            disabled={selectedIds.size === 0}
            className={cn(
                "flex items-center gap-2 px-8 py-3 text-sm font-bold text-white rounded-xl transition-colors shadow-lg",
                selectedIds.size > 0 ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300 cursor-not-allowed"
            )}
          >
             <FileCheck size={18} /> 
             {selectedIds.size > 0 ? `Generate Invoice (${selectedIds.size})` : 'Select Items to Invoice'}
          </button>
       </div>

      {/* Add/Edit Modal (ENHANCED VAT HANDLING) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="max-w-lg">
            <DialogHeader>
               <DialogTitle>{editingLine.id ? 'Edit' : 'Add'} {activeSide === 'AR' ? 'Receivable' : 'Payable'} Line</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
               <div className="col-span-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Description</Label>
                  <Input 
                     value={editingLine.description} 
                     onChange={e => setEditingLine({...editingLine, description: e.target.value})}
                     placeholder="e.g. Ocean Freight"
                     className="mt-1.5"
                  />
               </div>
               
               <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase">Amount</Label>
                  <Input 
                     type="number"
                     value={editingLine.amount}
                     onChange={e => setEditingLine({...editingLine, amount: parseFloat(e.target.value)})}
                     className="mt-1.5 font-mono"
                  />
               </div>
               
               <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase">Currency</Label>
                  <Select 
                     value={editingLine.currency} 
                     onValueChange={v => setEditingLine({...editingLine, currency: v as Currency})}
                  >
                     <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="MAD">MAD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="col-span-2">
                   <Label className="text-xs font-bold text-slate-500 uppercase">VAT Rule (Legal)</Label>
                   <Select 
                     value={selectedVatRule} 
                     onValueChange={v => setSelectedVatRule(v as VatRule)}
                   >
                     <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                     <SelectContent>
                        {VAT_RULES.map(rule => (
                            <SelectItem key={rule.value} value={rule.value}>
                                {rule.label}
                            </SelectItem>
                        ))}
                     </SelectContent>
                   </Select>
                   <p className="text-[10px] text-slate-400 mt-1">
                       Applicable Rate: <span className="font-bold">{VAT_RULES.find(r => r.value === selectedVatRule)?.rate}%</span>
                   </p>
               </div>
               
               <div className="col-span-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Category</Label>
                  <Select 
                     value={editingLine.code} 
                     onValueChange={v => setEditingLine({...editingLine, code: v})}
                  >
                     <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="OF">Freight (OF)</SelectItem>
                        <SelectItem value="THC">Origin (THC)</SelectItem>
                        <SelectItem value="DTHC">Destination (DTHC)</SelectItem>
                        <SelectItem value="DUM">Customs (DUM)</SelectItem>
                        <SelectItem value="TRUCK">Trucking</SelectItem>
                        <SelectItem value="MISC">Miscellaneous</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               
               <div className="col-span-2 pt-2">
                   <Label className="text-xs font-bold text-slate-500 uppercase">Status</Label>
                   <div className="grid grid-cols-4 gap-2 mt-2">
                       {['ESTIMATED', 'READY_TO_INVOICE', 'INVOICED', 'PAID'].map(s => (
                           <button
                             key={s}
                             onClick={() => setEditingLine({...editingLine, status: s as ChargeStatus})}
                             className={cn(
                               "px-2 py-2 text-[10px] font-bold rounded-lg border transition-all",
                               editingLine.status === s 
                                  ? 'bg-slate-900 text-white border-slate-900' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                             )}
                           >
                             {s === 'ESTIMATED' ? 'Quote' : s.replace(/_/g, ' ')}
                           </button>
                       ))}
                   </div>
               </div>

            </div>
            <DialogFooter>
               <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
               <Button onClick={handleSaveLine}>Save Line</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
};