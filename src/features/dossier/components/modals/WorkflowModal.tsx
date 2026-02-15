import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dossier } from "@/types/index";
import { 
  Anchor, Mail, Bell, CheckCircle, 
  Lock, ArrowRight, UploadCloud, AlertCircle, Plane 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dossier: Dossier;
  targetStage: string; // The crucial new prop for synchronization
  onAdvance: (updates: Partial<Dossier>, targetStage: string, summary: string) => void;
}

export function WorkflowModal({ isOpen, onClose, dossier, targetStage, onAdvance }: Props) {
  const [summary, setSummary] = useState("");
  const [updates, setUpdates] = useState<Partial<Dossier>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Local state for non-dossier fields (like checklists)
  const [checklist, setChecklist] = useState({
      hblIssued: true,
      preAlertReady: true,
      invoicesConfirmed: false
  });

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      setSummary("");
      setUpdates({});
      setChecklist({
          hblIssued: true,
          preAlertReady: true,
          invoicesConfirmed: false
      });
    }
  }, [isOpen, targetStage]);

  const handleUpdate = (field: keyof Dossier, value: any) => {
    setUpdates(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Auto-generate summary if empty
    const finalSummary = summary || `Advanced to ${targetStage}`;

    // Simulate network delay for UX
    setTimeout(() => {
        onAdvance(updates, targetStage, finalSummary);
        setIsSubmitting(false);
        onClose();
    }, 500);
  };

  // --- LOGIC: Map the dynamic string stage to the correct Form Category ---
  const getStageCategory = (stage: string) => {
      const s = stage.toLowerCase();
      if (s.includes('intake') || s.includes('booking') || s.includes('order')) return 'BOOKING';
      if (s.includes('pickup') || s.includes('gate') || s.includes('drop') || s.includes('loading')) return 'ORIGIN';
      if (s.includes('water') || s.includes('transit') || s.includes('departed') || s.includes('crossing')) return 'TRANSIT';
      if (s.includes('arrival') || s.includes('arrived') || s.includes('customs')) return 'ARRIVAL';
      if (s.includes('delivery') || s.includes('delivered')) return 'DELIVERY';
      if (s.includes('finance') || s.includes('closed')) return 'FINANCE';
      return 'GENERIC';
  };

  const renderContent = () => {
    const category = getStageCategory(targetStage);

    switch (category) {
      case 'BOOKING':
        return (
          <div className="space-y-4">
             <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3">
                {dossier.mode?.includes('AIR') ? <Plane className="text-indigo-600" size={20}/> : <Anchor className="text-indigo-600" size={20}/>}
                <div className="text-sm text-indigo-900">
                   <strong>Confirm Booking Details</strong><br/>
                   Please enter the carrier reference and asset details.
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Booking Reference</Label>
                    <Input 
                        placeholder="e.g. BK-2024-999" 
                        value={updates.bookingRef || dossier.bookingRef || ''} 
                        onChange={e => handleUpdate('bookingRef', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Carrier Reference / MBL</Label>
                    <Input 
                        placeholder="Master Bill Number" 
                        value={updates.mblNumber || dossier.mblNumber || ''}
                        onChange={e => handleUpdate('mblNumber', e.target.value)}
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Vessel / Flight / Truck</Label>
                    <Input 
                        placeholder="Asset Name" 
                        value={updates.vesselName || dossier.vesselName || ''}
                        onChange={e => handleUpdate('vesselName', e.target.value)}
                    />
                </div>
             </div>
          </div>
        );

      case 'ORIGIN':
        return (
          <div className="space-y-4">
             <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 flex gap-3">
                <Mail className="text-sky-600 flex-shrink-0" size={20} />
                <div className="text-sm text-sky-900">
                   <strong>Confirm Departure</strong><br/>
                   Verify documents and confirm the Actual Departure Date (ATD).
                </div>
             </div>
             <div className="space-y-2">
                <Label>Actual Departure Date (ATD)</Label>
                <Input 
                  type="date" 
                  value={updates.etd ? new Date(updates.etd).toISOString().split('T')[0] : (dossier.etd ? new Date(dossier.etd).toISOString().split('T')[0] : '')} 
                  onChange={e => handleUpdate('etd', new Date(e.target.value))}
                />
             </div>
             {/* Restored Checklist */}
             <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Pre-Departure Checklist</div>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="chk-hbl" 
                        checked={checklist.hblIssued} 
                        onCheckedChange={(c) => setChecklist(prev => ({...prev, hblIssued: !!c}))}
                    />
                    <label htmlFor="chk-hbl" className="text-sm font-medium leading-none">House Bill (HBL) Issued</label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="chk-alert" 
                        checked={checklist.preAlertReady} 
                        onCheckedChange={(c) => setChecklist(prev => ({...prev, preAlertReady: !!c}))}
                    />
                    <label htmlFor="chk-alert" className="text-sm font-medium leading-none">Pre-Alert Email Ready</label>
                </div>
             </div>
          </div>
        );

      case 'TRANSIT':
      case 'ARRIVAL':
        return (
          <div className="space-y-4">
             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
                <Bell className="text-orange-600 flex-shrink-0" size={20} />
                <div className="text-sm text-orange-900">
                   <strong>{category === 'ARRIVAL' ? 'Confirm Arrival' : 'Transit Update'}</strong><br/>
                   Update ETA/ATA and verify exchange rates for invoicing.
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label>{category === 'ARRIVAL' ? 'Actual Arrival (ATA)' : 'Estimated Arrival (ETA)'}</Label>
                   <Input 
                      type="date" 
                      value={
                          category === 'ARRIVAL' 
                          ? (updates.ata ? new Date(updates.ata).toISOString().split('T')[0] : '')
                          : (updates.eta ? new Date(updates.eta).toISOString().split('T')[0] : (dossier.eta ? new Date(dossier.eta).toISOString().split('T')[0] : ''))
                      }
                      onChange={e => handleUpdate(category === 'ARRIVAL' ? 'ata' : 'eta', new Date(e.target.value))}
                   />
                </div>
                <div className="space-y-2">
                   {/* Restored Exchange Rate Field */}
                   <Label>Ex. Rate ({dossier.currency})</Label>
                   <Input type="number" step="0.01" placeholder="e.g. 10.05" />
                </div>
             </div>
          </div>
        );

      case 'DELIVERY':
         return (
          <div className="space-y-4">
             <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                <div className="text-sm text-green-900">
                   <strong>Confirm Delivery</strong><br/>
                   Enter actual delivery date to close operational cycle.
                </div>
             </div>
             <div className="space-y-2">
                <Label>Actual Delivery Date (POD)</Label>
                <Input 
                  type="date" 
                  value={updates.ata ? new Date(updates.ata).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
                  onChange={e => handleUpdate('ata', new Date(e.target.value))}
                />
             </div>
             {/* Restored Upload Placeholder */}
             <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                 <UploadCloud className="mx-auto text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" size={24} />
                 <p className="text-sm font-semibold text-slate-600">Upload Signed POD</p>
                 <p className="text-xs text-slate-400">Drag and drop or click to browse</p>
             </div>
          </div>
        );

      case 'FINANCE':
          const profit = (dossier.totalRevenue || 0) - (dossier.totalCost || 0);
          const isPositive = profit >= 0;

          return (
          <div className="space-y-4">
             <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3">
                <Lock className="text-emerald-600 flex-shrink-0" size={20} />
                <div className="text-sm text-emerald-900">
                   <strong>Close Dossier</strong><br/>
                   Finalize file. Ensure all costs and revenues are booked.
                </div>
             </div>
             {/* Restored Profit Display */}
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Estimated Net Profit</p>
                    <p className={cn("text-xl font-bold font-mono mt-1", isPositive ? "text-green-600" : "text-red-600")}>
                        {profit.toLocaleString()} {dossier.currency}
                    </p>
                </div>
                <div className={cn("px-2 py-1 rounded text-xs font-bold", isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                    {dossier.totalRevenue > 0 ? ((profit / dossier.totalRevenue) * 100).toFixed(1) : 0}% Margin
                </div>
             </div>
             {/* Restored Confirmation Checkbox */}
             <div className="flex items-center space-x-2 pt-2">
                 <Checkbox 
                    id="chk-finance" 
                    checked={checklist.invoicesConfirmed} 
                    onCheckedChange={(c) => setChecklist(prev => ({...prev, invoicesConfirmed: !!c}))}
                 />
                 <label htmlFor="chk-finance" className="text-sm font-bold text-slate-700 leading-none">
                     I confirm all invoices have been issued.
                 </label>
             </div>
          </div>
        );

      default:
        return (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                No specific data fields required for this stage transition.
            </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             Advance Workflow
             <span className="text-slate-400 font-normal text-sm">to</span>
             <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-sm border border-blue-100">
                {targetStage}
             </span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
           {renderContent()}

           <div className="space-y-2">
              <Label>Transition Note / Summary</Label>
              <Textarea 
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Briefly describe the action taken..."
                className="h-20 resize-none"
              />
           </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (getStageCategory(targetStage) === 'FINANCE' && !checklist.invoicesConfirmed)}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {isSubmitting ? 'Updating...' : (
                <span className="flex items-center gap-2">
                    Confirm & Advance <ArrowRight className="h-4 w-4" />
                </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}