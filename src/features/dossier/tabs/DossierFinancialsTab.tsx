import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Plus,  
  Edit2, Trash2, Printer, FileCheck, 
  DollarSign, Mail, MoreHorizontal,
  Anchor, Box, Truck, Shield, AlertTriangle,
  Activity
} from "lucide-react";
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

// Strict Typing for FX Rates
const FX_RATES: Record<Currency, number> = { 
    USD: 10.05, 
    EUR: 10.85, 
    MAD: 1.00, 
    GBP: 12.50 
};

// HELPER: Map Rate to Rule ensuring backend compatibility
const getVatRuleFromRate = (rate: number): VatRule => {
    if (rate === 20) return 'STD_20';
    if (rate === 14) return 'ROAD_14';
    return 'EXPORT_0_ART92';
};

export const DossierFinancialsTab = () => {
  const { dossier } = useDossierStore();
  const { ledger, loadLedger, addCharge, updateCharge, deleteCharge } = useFinanceStore();
  
  // Load data on mount
  useEffect(() => {
      if (dossier.id && !dossier.id.startsWith('new-')) {
          loadLedger(dossier.id);
      }
  }, [dossier.id, loadLedger]);

  // Filter ledger into AP (Expenses) and AR (Income)
  const costs = ledger.filter(l => l.type === 'EXPENSE');
  const revenue = ledger.filter(l => l.type === 'INCOME');

  const [activeSide, setActiveSide] = useState<'AR' | 'AP' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<Partial<ChargeLine>>({});

  // --- Calculations ---
  const calculateTotal = (lines: ChargeLine[]) => {
    return lines.reduce((acc: number, line: ChargeLine) => {
      const rate = line.exchangeRate || FX_RATES[line.currency] || 1;
      const base = line.amount * rate;
      const vat = base * (line.vatRate / 100);
      return acc + base + vat;
    }, 0);
  };

  const totalRevenueMAD = calculateTotal(revenue);
  const totalCostMAD = calculateTotal(costs);
  const grossProfitMAD = totalRevenueMAD - totalCostMAD;
  const marginPercent = totalRevenueMAD > 0 ? (grossProfitMAD / totalRevenueMAD) * 100 : 0;

  // --- Payment Status Logic ---
  const paidRevenueMAD = revenue
    .filter((r) => r.status === 'PAID')
    .reduce((acc: number, r: ChargeLine) => {
       const rate = r.exchangeRate || FX_RATES[r.currency] || 1;
       return acc + (r.amount * rate * (1 + r.vatRate/100));
    }, 0);
  
  const paymentProgress = totalRevenueMAD > 0 ? (paidRevenueMAD / totalRevenueMAD) * 100 : 0;
  
  const hasUninvoicedItems = revenue.some(r => r.status === 'ESTIMATED' || r.status === 'READY_TO_INVOICE');
  
  let invoiceStatusLabel = 'Invoiced - Awaiting Payment';
  if (paymentProgress === 100) invoiceStatusLabel = 'Fully Paid';
  else if (paymentProgress > 0) invoiceStatusLabel = 'Partially Paid';
  else if (hasUninvoicedItems) invoiceStatusLabel = 'Draft / Unbilled';
  else if (revenue.length === 0) invoiceStatusLabel = 'No Revenue';

  // --- Handlers ---
  const handleOpenAdd = (side: 'AR' | 'AP') => {
    setActiveSide(side);
    setEditingLine({
      description: '',
      amount: 0,
      currency: 'MAD',
      vatRate: 20, // Default to 20%
      status: 'ESTIMATED',
      code: 'MISC'
    });
    setIsDialogOpen(true);
  };

  const handleEditLine = (line: ChargeLine, side: 'AR' | 'AP') => {
    setActiveSide(side);
    setEditingLine({ ...line });
    setIsDialogOpen(true);
  };

  const handleSaveLine = async () => {
    if (!editingLine.description || !activeSide) return;

    // FIX: Map correct VAT Rule so backend calculates Amount correctly
    const currentRate = editingLine.vatRate ?? 20;
    const vatRule = getVatRuleFromRate(currentRate);

    const payload: Partial<ChargeLine> = {
      ...editingLine,
      dossierId: dossier.id,
      type: activeSide === 'AR' ? 'INCOME' : 'EXPENSE',
      exchangeRate: FX_RATES[editingLine.currency as Currency] || 1,
      vatRule: vatRule,
      vatRate: currentRate, // Explicitly send 20, 14, or 0
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

  const handleGenerateInvoice = async () => {
    // This would ideally call generateInvoice from store
    alert("Invoice generation triggered. Status will update after processing.");
  };

  const handlePrintProForma = () => window.print();
  const handleSendReminder = () => alert(`Reminder email sent to ${dossier.clientName} regarding outstanding balance.`);

  // --- UI Helpers ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'INVOICED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'READY_TO_INVOICE': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ESTIMATED': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getCategoryIcon = (cat: string) => {
     if (cat === 'OF' || cat === 'Freight') return <Anchor size={14} className="text-blue-600" />;
     if (cat === 'THC' || cat === 'Origin') return <Box size={14} className="text-orange-600" />;
     if (cat === 'DTHC' || cat === 'Destination') return <Truck size={14} className="text-emerald-600" />;
     if (cat === 'DUM' || cat === 'Customs') return <Shield size={14} className="text-purple-600" />;
     return <AlertTriangle size={14} className="text-slate-500" />;
  };

  // --- Sub-Component: Financial Table ---
  const FinancialTable = ({ title, items, side }: { title: string, items: ChargeLine[], side: 'AR' | 'AP' }) => {
    const isAR = side === 'AR';
    
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
                     {items.length} Lines • {isAR ? `Bill To: ${dossier.clientName}` : 'Various Vendors'}
                  </p>
               </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleOpenAdd(side)} className="bg-white hover:bg-slate-50 border-slate-200 text-slate-600">
               <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
         </div>

         <div className="flex-1 overflow-auto custom-scrollbar bg-white min-h-[300px]">
            <table className="min-w-full divide-y divide-slate-100">
               <thead className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                     <th className="px-6 py-3 text-left w-[35%]">Description</th>
                     <th className="px-4 py-3 text-right w-[15%]">Net</th>
                     <th className="px-4 py-3 text-right w-[10%]">VAT</th>
                     <th className="px-4 py-3 text-right w-[20%]">Total</th>
                     <th className="px-4 py-3 text-center w-[15%]">Status</th>
                     <th className="px-4 py-3 w-[5%]"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {items.map((item) => {
                     const rate = item.exchangeRate || FX_RATES[item.currency] || 1;
                     const total = item.amount * (1 + item.vatRate/100);
                     const totalMAD = total * rate;
                     const isForeign = item.currency !== 'MAD';
                     
                     return (
                        <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-3">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-1.5 rounded-md bg-slate-100">{getCategoryIcon(item.code || '')}</div>
                                <div>
                                   <div className="text-sm font-bold text-slate-900 leading-tight mb-0.5">{item.description}</div>
                                   <div className="text-[11px] text-slate-500 font-medium">{item.code || 'MISC'}</div>
                                </div>
                              </div>
                           </td>
                           <td className="px-4 py-3 text-right">
                              <div className="text-xs font-semibold text-slate-900 font-mono">
                                 {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                 <span className="text-[10px] text-slate-400 ml-1">{item.currency}</span>
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
                              <div className="text-sm font-bold text-slate-900 font-mono">
                                 {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                 <span className="text-[10px] text-slate-400 ml-1">{item.currency}</span>
                              </div>
                              {isForeign && (
                                 <div className="text-[10px] text-slate-400 mt-0.5">≈ {totalMAD.toLocaleString(undefined, { maximumFractionDigits: 0 })} MAD</div>
                              )}
                           </td>
                           <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusColor(item.status)}`}>
                                 {item.status}
                              </span>
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
                  })}
               </tbody>
            </table>
            {items.length === 0 && (
               <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <div className="bg-slate-50 p-3 rounded-full mb-3">
                    <DollarSign size={24} className="opacity-20" />
                  </div>
                  <p className="text-sm font-medium">No line items yet</p>
                  <button onClick={() => handleOpenAdd(side)} className="mt-2 text-xs font-bold text-blue-600 hover:underline">
                     Add your first {isAR ? 'charge' : 'cost'}
                  </button>
               </div>
            )}
         </div>

         <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wide">Total (Inc. VAT)</span>
            <span className="text-sm font-bold text-slate-900 font-mono">
               {(isAR ? totalRevenueMAD : totalCostMAD).toLocaleString()} MAD
            </span>
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

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Revenue */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={18}/></div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{totalRevenueMAD.toLocaleString()} <span className="text-sm font-medium text-slate-400">MAD</span></div>
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
                <div className="text-2xl font-bold text-slate-900">{totalCostMAD.toLocaleString()} <span className="text-sm font-medium text-slate-400">MAD</span></div>
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
                  {grossProfitMAD.toLocaleString()} <span className="text-lg font-medium text-slate-500">MAD</span>
               </div>
               <Badge className={`${marginPercent >= 20 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'} border-0`}>
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
                       <button onClick={handleSendReminder} className="text-[10px] font-bold bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded-lg shadow-sm hover:bg-blue-50 flex items-center gap-1 transition-colors">
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
                    <span>Paid: {paidRevenueMAD.toLocaleString()}</span>
                    <span>Due: {(totalRevenueMAD - paidRevenueMAD).toLocaleString()}</span>
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
            onClick={handlePrintProForma}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
          >
             <Printer size={18} /> Print Pro-Forma
          </button>
          <div className="w-px h-8 bg-slate-200"></div>
          <button 
            onClick={handleGenerateInvoice}
            className="flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-lg"
          >
             <FileCheck size={18} /> Generate Invoice
          </button>
       </div>

      {/* Add/Edit Modal */}
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

               <div>
                   <Label className="text-xs font-bold text-slate-500 uppercase">VAT Rate (%)</Label>
                   <Select 
                     value={String(editingLine.vatRate ?? 20)} 
                     onValueChange={v => setEditingLine({...editingLine, vatRate: parseFloat(v)})}
                   >
                     <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="0">0% (Exempt)</SelectItem>
                        <SelectItem value="14">14%</SelectItem>
                        <SelectItem value="20">20% (Standard)</SelectItem>
                     </SelectContent>
                   </Select>
               </div>
               
               <div>
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
                             className={`
                               px-2 py-2 text-[10px] font-bold rounded-lg border transition-all
                               ${editingLine.status === s 
                                  ? 'bg-slate-900 text-white border-slate-900' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                             `}
                           >
                             {s.replace(/_/g, ' ')}
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