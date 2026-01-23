import React, { useState, useEffect } from 'react';
import { 
  FileText, Anchor, Mail, Bell, CheckCircle, 
  Lock, ArrowRight, Plus, UploadCloud 
} from "lucide-react";
import { Dossier, ShipmentStage } from "@/types/index";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dossier: Dossier;
  onAdvance: (updates: Partial<Dossier>, nextStage: ShipmentStage) => void;
}

export const WorkflowModal: React.FC<Props> = ({ isOpen, onClose, dossier, onAdvance }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Reset form data when opening
  useEffect(() => {
    if (isOpen) {
      setFormData({});
    }
  }, [isOpen, dossier.stage]);

  if (!isOpen) return null;

  const STAGES_ORDER = [
    ShipmentStage.INTAKE,
    ShipmentStage.BOOKING,
    ShipmentStage.ORIGIN,
    ShipmentStage.TRANSIT,
    ShipmentStage.DELIVERY,
    ShipmentStage.FINANCE,
    ShipmentStage.CLOSED
  ];

  const currentIndex = STAGES_ORDER.indexOf(dossier.stage);
  const nextStage = currentIndex >= 0 && currentIndex < STAGES_ORDER.length - 1 
    ? STAGES_ORDER[currentIndex + 1] 
    : null;

  const handleConfirm = () => {
    if (!nextStage) return;

    setIsLoading(true);
    
    // Simulate API delay for UX
    setTimeout(() => {
        const updates: Partial<Dossier> = {
            // Map form data to Dossier fields
            ...(dossier.stage === ShipmentStage.INTAKE && formData.bookingRef ? { bookingRef: formData.bookingRef } : {}),
            
            ...(dossier.stage === ShipmentStage.BOOKING && formData.mblNumber ? { mblNumber: formData.mblNumber } : {}),
            ...(dossier.stage === ShipmentStage.BOOKING && formData.vesselName ? { vesselName: formData.vesselName } : {}),
            
            ...(dossier.stage === ShipmentStage.ORIGIN && formData.etd ? { etd: new Date(formData.etd) } : {}),
            
            ...(dossier.stage === ShipmentStage.TRANSIT && formData.eta ? { eta: new Date(formData.eta) } : {}),
            
            ...(dossier.stage === ShipmentStage.DELIVERY && formData.ata ? { ata: new Date(formData.ata) } : {}),
        };

        onAdvance(updates, nextStage);
        setIsLoading(false);
        onClose();
    }, 800);
  };

  const renderContent = () => {
    switch (dossier.stage) {
      case ShipmentStage.INTAKE:
        return (
          <div className="space-y-4">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                <FileText className="text-blue-600 flex-shrink-0" size={20} />
                <div className="text-sm text-blue-900">
                   <strong>Confirm Quote & Create Booking</strong><br/>
                   This will convert the quote into an active shipment.
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Booking Reference</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. BK-2024-999" 
                  value={formData.bookingRef || dossier.bookingRef || ''} 
                  onChange={e => setFormData({...formData, bookingRef: e.target.value})}
                />
             </div>
          </div>
        );

      case ShipmentStage.BOOKING:
        return (
          <div className="space-y-4">
             <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3">
                <Anchor className="text-indigo-600 flex-shrink-0" size={20} />
                <div className="text-sm text-indigo-900">
                   <strong>Confirm Carrier Booking</strong><br/>
                   Enter the Master Bill of Lading (MBL) to proceed.
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Carrier MBL Number</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. MAEU12345678" 
                  value={formData.mblNumber || dossier.mblNumber || ''}
                  onChange={e => setFormData({...formData, mblNumber: e.target.value})}
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vessel / Flight Name</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. MAERSK MADRID" 
                  value={formData.vesselName || dossier.vesselName || ''}
                  onChange={e => setFormData({...formData, vesselName: e.target.value})}
                />
             </div>
          </div>
        );

      case ShipmentStage.ORIGIN:
        return (
          <div className="space-y-4">
             <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 flex gap-3">
                <Mail className="text-sky-600 flex-shrink-0" size={20} />
                <div className="text-sm text-sky-900">
                   <strong>Send Pre-Alert</strong><br/>
                   Vessel has departed. Confirm Actual Departure Date (ATD).
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actual Departure Date (ATD)</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.etd || (dossier.etd ? new Date(dossier.etd).toISOString().split('T')[0] : '')} 
                  onChange={e => setFormData({...formData, etd: e.target.value})}
                />
             </div>
             <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Checklist</div>
                <label className="flex items-center gap-2 text-sm text-slate-700 mb-1">
                   <input type="checkbox" defaultChecked className="rounded text-blue-600" /> HBL Issued
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                   <input type="checkbox" defaultChecked className="rounded text-blue-600" /> Pre-Alert Email Ready
                </label>
             </div>
          </div>
        );

      case ShipmentStage.TRANSIT:
        return (
          <div className="space-y-4">
             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
                <Bell className="text-orange-600 flex-shrink-0" size={20} />
                <div className="text-sm text-orange-900">
                   <strong>Generate Arrival Notice</strong><br/>
                   Confirm updated ETA before sending A/N to customer.
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm ETA</label>
                   <input 
                      type="date" 
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formData.eta || (dossier.eta ? new Date(dossier.eta).toISOString().split('T')[0] : '')}
                      onChange={e => setFormData({...formData, eta: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ex. Rate (MAD)</label>
                   <input type="number" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" defaultValue="10.05" />
                </div>
             </div>
          </div>
        );

      case ShipmentStage.DELIVERY:
         return (
          <div className="space-y-4">
             <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                <div className="text-sm text-green-900">
                   <strong>Confirm Delivery (POD)</strong><br/>
                   Enter actual delivery date to close operational cycle.
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actual Delivery Date</label>
                <input 
                  type="date" 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.ata || new Date().toISOString().split('T')[0]} 
                  onChange={e => setFormData({...formData, ata: e.target.value})}
                />
             </div>
             <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 hover:bg-white transition-colors cursor-pointer group">
                 <UploadCloud className="mx-auto text-slate-400 mb-1 group-hover:text-blue-500 transition-colors" size={20} />
                 <p className="text-xs font-bold text-slate-600">Upload Signed POD</p>
             </div>
          </div>
        );

      case ShipmentStage.FINANCE:
          return (
          <div className="space-y-4">
             <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3">
                <Lock className="text-emerald-600 flex-shrink-0" size={20} />
                <div className="text-sm text-emerald-900">
                   <strong>Close Dossier</strong><br/>
                   Finalize file. Ensure all costs and revenues are booked.
                </div>
             </div>
             <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between text-sm pt-2">
                   <span className="font-bold text-slate-700">Net Profit:</span>
                   <span className="font-bold text-green-600">{(dossier.totalRevenue - dossier.totalCost).toLocaleString()} {dossier.currency}</span>
                </div>
             </div>
             <label className="flex items-center gap-2 text-sm text-slate-700 font-bold">
                <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                I confirm all invoices have been issued.
             </label>
          </div>
        );

      default:
        return <div>Workflow completed.</div>;
    }
  };

  const getButtonText = () => {
     switch(dossier.stage) {
        case ShipmentStage.INTAKE: return "Confirm Booking";
        case ShipmentStage.BOOKING: return "Confirm Departure";
        case ShipmentStage.ORIGIN: return "Send Pre-Alert";
        case ShipmentStage.TRANSIT: return "Send Arrival Notice";
        case ShipmentStage.DELIVERY: return "Confirm Delivery";
        case ShipmentStage.FINANCE: return "Close Job";
        default: return "Advance";
     }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
             <h3 className="text-lg font-bold text-slate-900">{getButtonText()}</h3>
             <p className="text-xs text-slate-500 font-medium">Step {currentIndex + 1} of {STAGES_ORDER.length}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
            <Plus className="rotate-45" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
           {renderContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
           >
             Cancel
           </button>
           <button 
             onClick={handleConfirm}
             disabled={isLoading}
             className="px-6 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
           >
             {isLoading ? (
               <>Processing...</> 
             ) : (
               <>
                 {getButtonText()} <ArrowRight size={16} />
               </>
             )}
           </button>
        </div>

      </div>
    </div>
  );
};