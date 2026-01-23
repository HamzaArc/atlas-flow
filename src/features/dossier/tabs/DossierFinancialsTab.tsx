import { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Plus, MoreHorizontal, 
  Edit2, Trash2, Printer, FileCheck, Mail,
  DollarSign, Euro, Percent
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { ChargeLine, Currency, ChargeCategory, ChargeStatus } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Mock FX Rates for the prototype refactor
const FX_RATES = { USD: 10.05, EUR: 10.85, MAD: 1.00, GBP: 12.50 };

export const DossierFinancialsTab = () => {
  const { dossier, updateDossier } = useDossierStore();
  
  // NOTE: In a real app, these would likely be separate 'chargeLines' collections
  // For this refactor, we assume the dossier object has these arrays as per the prototype.
  // We cast to any here to bypass the strict Step 1 type definition if it missed these arrays.
  const costs = (dossier as any).costs || [] as ChargeLine[];
  const revenue = (dossier as any).revenue || [] as ChargeLine[];

  const [activeSide, setActiveSide] = useState<'AR' | 'AP' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<Partial<ChargeLine>>({});

  // --- Calculations ---
  const calculateTotal = (lines: ChargeLine[]) => {
    return lines.reduce((acc, line) => {
      const rate = FX_RATES[line.currency] || 1;
      const base = line.amount * rate;
      const vat = base * (line.vatRate / 100);
      return acc + base + vat;
    }, 0);
  };

  const totalRevenueMAD = calculateTotal(revenue);
  const totalCostMAD = calculateTotal(costs);
  const grossProfitMAD = totalRevenueMAD - totalCostMAD;
  const marginPercent = totalRevenueMAD > 0 ? (grossProfitMAD / totalRevenueMAD) * 100 : 0;

  // --- Handlers ---
  const handleOpenAdd = (side: 'AR' | 'AP') => {
    setActiveSide(side);
    setEditingLine({
      description: '',
      amount: 0,
      currency: 'MAD',
      vatRate: 20,
      status: 'ESTIMATED',
      // Default to "Freight" but cast to string to avoid Select type issues initially
      category: 'Freight' as any 
    });
    setIsDialogOpen(true);
  };

  const handleSaveLine = () => {
    if (!editingLine.description || !activeSide) return;

    const newLine = {
      ...editingLine,
      id: editingLine.id || `${activeSide}-${Date.now()}`,
      dossierId: dossier.id,
      exchangeRate: FX_RATES[editingLine.currency as Currency] || 1,
      type: activeSide === 'AR' ? 'INCOME' : 'EXPENSE'
    } as ChargeLine;

    if (activeSide === 'AR') {
      const updated = editingLine.id 
        ? revenue.map((r: ChargeLine) => r.id === newLine.id ? newLine : r)
        : [newLine, ...revenue];
      updateDossier('revenue' as any, updated);
    } else {
      const updated = editingLine.id 
        ? costs.map((c: ChargeLine) => c.id === newLine.id ? newLine : c)
        : [newLine, ...costs];
      updateDossier('costs' as any, updated);
    }
    setIsDialogOpen(false);
  };

  const deleteLine = (id: string, side: 'AR' | 'AP') => {
    if (side === 'AR') {
      updateDossier('revenue' as any, revenue.filter((r: ChargeLine) => r.id !== id));
    } else {
      updateDossier('costs' as any, costs.filter((c: ChargeLine) => c.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'INVOICED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ESTIMATED': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  // --- Reusable Table Component ---
  const FinancialTable = ({ title, items, side }: { title: string, items: ChargeLine[], side: 'AR' | 'AP' }) => (
    <Card className="flex flex-col h-full overflow-hidden border-slate-200 shadow-sm">
       <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${side === 'AR' ? 'bg-emerald-50/30' : 'bg-red-50/30'}`}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${side === 'AR' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {side === 'AR' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
             </div>
             <div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 font-medium">{items.length} Line Items</p>
             </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => handleOpenAdd(side)} className="bg-white hover:bg-slate-50">
             <Plus className="h-4 w-4" />
          </Button>
       </div>

       <div className="flex-1 overflow-auto custom-scrollbar bg-white min-h-[300px]">
          <table className="min-w-full text-left text-sm">
             <thead className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
                   <th className="px-6 py-3">Description</th>
                   <th className="px-4 py-3 text-right">Net</th>
                   <th className="px-4 py-3 text-right">VAT</th>
                   <th className="px-4 py-3 text-right">Total</th>
                   <th className="px-4 py-3 text-center">Status</th>
                   <th className="px-4 py-3"></th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {items.map((item) => {
                   const rate = FX_RATES[item.currency] || 1;
                   const total = item.amount * (1 + item.vatRate/100);
                   const totalMAD = total * rate;
                   
                   return (
                      <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-3">
                            <div className="font-bold text-slate-900">{item.description}</div>
                            <div className="text-xs text-slate-500">{item.category}</div>
                         </td>
                         <td className="px-4 py-3 text-right font-mono text-xs">
                            {item.amount.toFixed(2)} {item.currency}
                         </td>
                         <td className="px-4 py-3 text-right text-xs">
                            {item.vatRate > 0 ? `${item.vatRate}%` : '-'}
                         </td>
                         <td className="px-4 py-3 text-right">
                            <div className="font-bold text-slate-900 font-mono text-xs">
                               {total.toFixed(2)} {item.currency}
                            </div>
                            {item.currency !== 'MAD' && (
                               <div className="text-[10px] text-slate-400">≈ {totalMAD.toFixed(0)} MAD</div>
                            )}
                         </td>
                         <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className={`border-0 ${getStatusColor(item.status)}`}>
                               {item.status}
                            </Badge>
                         </td>
                         <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex justify-end gap-1">
                               <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingLine(item); setActiveSide(side); setIsDialogOpen(true); }}>
                                  <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                               </Button>
                               <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-600" onClick={() => deleteLine(item.id, side)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                               </Button>
                            </div>
                         </td>
                      </tr>
                   );
                })}
             </tbody>
          </table>
       </div>
       
       <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-700">
          <span className="uppercase tracking-wide">Total (Inc. VAT)</span>
          <span className="font-mono text-sm">
             {(side === 'AR' ? totalRevenueMAD : totalCostMAD).toLocaleString()} MAD
          </span>
       </div>
    </Card>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-6 pb-24 space-y-8">
      
      {/* 1. Header & FX Ticker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
             <h2 className="text-lg font-bold text-slate-900">Job Profitability</h2>
             <p className="text-sm text-slate-500">Manage operational costs and client billing.</p>
         </div>
         <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-xs font-mono text-slate-500">
             <span className="flex items-center gap-2 text-blue-600 font-bold"><TrendingUp size={14} /> LIVE FX</span>
             <Separator orientation="vertical" className="h-4" />
             <span>USD <b className="text-slate-900">{FX_RATES.USD}</b></span>
             <span>EUR <b className="text-slate-900">{FX_RATES.EUR}</b></span>
         </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Revenue */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={18}/></div>
            </div>
            <div>
               <div className="text-2xl font-bold text-slate-900">{totalRevenueMAD.toLocaleString()} <span className="text-sm font-medium text-slate-400">MAD</span></div>
               <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-full"></div>
               </div>
            </div>
         </div>

         {/* Costs */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Costs</span>
                <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={18}/></div>
            </div>
            <div>
               <div className="text-2xl font-bold text-slate-900">{totalCostMAD.toLocaleString()} <span className="text-sm font-medium text-slate-400">MAD</span></div>
               <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div className="bg-red-500 h-full" style={{ width: '65%' }}></div>
               </div>
            </div>
         </div>

         {/* Profit (Dark Card) */}
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

         {/* Actions */}
         <div className="flex flex-col gap-3">
            <Button className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
               <Printer className="mr-2 h-4 w-4" /> Pro-Forma
            </Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
               <FileCheck className="mr-2 h-4 w-4" /> Generate Invoice
            </Button>
         </div>
      </div>

      {/* 3. Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[500px]">
         <FinancialTable title="Payables (AP)" items={costs} side="AP" />
         <FinancialTable title="Receivables (AR)" items={revenue} side="AR" />
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="max-w-lg">
            <DialogHeader>
               <DialogTitle>{editingLine.id ? 'Edit' : 'Add'} {activeSide === 'AR' ? 'Receivable' : 'Payable'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
               <div className="col-span-2">
                  <Label>Description</Label>
                  <Input 
                     value={editingLine.description} 
                     onChange={e => setEditingLine({...editingLine, description: e.target.value})}
                     placeholder="e.g. Ocean Freight"
                  />
               </div>
               <div>
                  <Label>Amount</Label>
                  <Input 
                     type="number"
                     value={editingLine.amount}
                     onChange={e => setEditingLine({...editingLine, amount: parseFloat(e.target.value)})}
                  />
               </div>
               <div>
                  <Label>Currency</Label>
                  <Select 
                     value={editingLine.currency} 
                     onValueChange={v => setEditingLine({...editingLine, currency: v as Currency})}
                  >
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="MAD">MAD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div>
                   <Label>VAT Rate (%)</Label>
                   <Select 
                     value={String(editingLine.vatRate)} 
                     onValueChange={v => setEditingLine({...editingLine, vatRate: parseFloat(v)})}
                   >
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="0">0% (Exempt)</SelectItem>
                        <SelectItem value="20">20% (Standard)</SelectItem>
                     </SelectContent>
                   </Select>
               </div>
               <div>
                  <Label>Category</Label>
                  <Select 
                     value={editingLine.category} 
                     onValueChange={v => setEditingLine({...editingLine, category: v as any})}
                  >
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="Freight">Freight</SelectItem>
                        <SelectItem value="Origin">Origin</SelectItem>
                        <SelectItem value="Destination">Destination</SelectItem>
                        <SelectItem value="Customs">Customs</SelectItem>
                     </SelectContent>
                  </Select>
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