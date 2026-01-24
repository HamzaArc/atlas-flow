import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDossierStore } from "@/store/useDossierStore";
import { MapPin, Anchor, Box, User, AlertCircle, Plane, Truck, Ship, Home, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Incoterm } from "@/types/index";

export function ShipmentDetails() {
  const { dossier, isEditing, updateDossier, updateParty } = useDossierStore();

  const formatDate = (date: string | Date) => {
      if(!date) return '';
      return typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
  };

  const isAir = dossier.mode === 'AIR';
  const isSea = dossier.mode.includes('SEA');

  const isEXW = dossier.incoterm === 'EXW';
  const isDeliveryInco = ['DAP', 'DPU', 'DDP'].includes(dossier.incoterm);

  return (
    <Card className="h-full border-none shadow-sm ring-1 ring-slate-200 flex flex-col overflow-hidden bg-white">
        <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100 shrink-0">
            <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Box className="h-3.5 w-3.5" /> Shipment Manifest
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium px-2 py-1 bg-white border border-slate-200 rounded text-slate-600">
                    {isAir ? <Plane className="h-3 w-3" /> : isSea ? <Ship className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
                    {dossier.mode}
                </div>
            </CardTitle>
        </CardHeader>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-[10px] text-slate-400 uppercase font-bold">Booking Ref</Label>
                    <Input 
                        value={dossier.bookingRef} 
                        disabled={!isEditing} 
                        onChange={(e) => updateDossier('bookingRef', e.target.value)}
                        className="h-8 text-xs font-mono font-semibold text-blue-700 bg-blue-50/50 border-blue-100 focus:border-blue-300"
                        placeholder="Carrier Booking No."
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-slate-400 uppercase font-bold">Incoterm</Label>
                    <Select disabled={!isEditing} value={dossier.incoterm} onValueChange={(v) => updateDossier('incoterm', v as Incoterm)}>
                        <SelectTrigger className="h-8 text-xs font-medium bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['EXW','FCA','CPT','CIP','DAP','DPU','DDP','FAS','FOB','CFR','CIF'].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 bg-blue-50 text-blue-600 rounded"><MapPin className="h-3 w-3" /></div>
                    <span className="text-xs font-bold text-slate-700">Route & Schedule</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                    
                    {isEXW && (
                        <div className="col-span-2 space-y-1 animate-in slide-in-from-top-1">
                            <Label className="text-[9px] text-amber-600 uppercase font-bold">Pickup Address (Origin)</Label>
                            <div className="relative">
                                <Input 
                                    value={dossier.incotermPlace || ''} 
                                    disabled={!isEditing} 
                                    onChange={(e) => updateDossier('incotermPlace', e.target.value)} 
                                    className="h-7 text-xs font-medium border-amber-200 bg-amber-50/30 pl-7" 
                                />
                                <Home className="absolute left-2 top-1.5 h-3.5 w-3.5 text-amber-500" />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400 uppercase">Port of Loading (POL)</Label>
                        <Input value={dossier.pol} disabled={!isEditing} onChange={(e) => updateDossier('pol', e.target.value)} className="h-7 text-xs font-bold uppercase" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400 uppercase">Port of Discharge (POD)</Label>
                        <Input value={dossier.pod} disabled={!isEditing} onChange={(e) => updateDossier('pod', e.target.value)} className="h-7 text-xs font-bold uppercase" />
                    </div>

                    {isDeliveryInco && (
                        <div className="col-span-2 space-y-1 animate-in slide-in-from-top-1">
                            <Label className="text-[9px] text-blue-600 uppercase font-bold">Final Delivery Address</Label>
                            <div className="relative">
                                <Input 
                                    value={dossier.incotermPlace || ''} 
                                    disabled={!isEditing} 
                                    onChange={(e) => updateDossier('incotermPlace', e.target.value)} 
                                    className="h-7 text-xs font-medium border-blue-200 bg-blue-50/30 pl-7" 
                                />
                                <MapPin className="absolute left-2 top-1.5 h-3.5 w-3.5 text-blue-500" />
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400 uppercase flex justify-between">ETD <span className="text-slate-300">Departure</span></Label>
                        <Input type="date" value={formatDate(dossier.etd)} disabled={!isEditing} onChange={(e) => updateDossier('etd', new Date(e.target.value))} className="h-7 text-xs" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400 uppercase flex justify-between">ETA <span className="text-slate-300">Arrival</span></Label>
                        <Input type="date" value={formatDate(dossier.eta)} disabled={!isEditing} onChange={(e) => updateDossier('eta', new Date(e.target.value))} className="h-7 text-xs" />
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400 uppercase">Free Time (Days)</Label>
                        <div className="relative">
                            <Input 
                                type="number" 
                                value={dossier.freeTimeDays} 
                                disabled={!isEditing} 
                                onChange={(e) => updateDossier('freeTimeDays', parseInt(e.target.value) || 0)} 
                                className="h-7 text-xs pl-7" 
                            />
                            <Clock className="absolute left-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400 uppercase">Est. Transit (Days)</Label>
                        <div className="relative">
                            <Input 
                                type="number" 
                                // @ts-ignore
                                value={dossier.transitTime || 0} 
                                disabled={!isEditing} 
                                // @ts-ignore
                                onChange={(e) => updateDossier('transitTime', parseInt(e.target.value) || 0)} 
                                className="h-7 text-xs pl-7" 
                            />
                            <Clock className="absolute left-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 bg-indigo-50 text-indigo-600 rounded"><Anchor className="h-3 w-3" /></div>
                    <span className="text-xs font-bold text-slate-700">Carrier Details</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <Label className="text-[9px] text-slate-400 uppercase">Carrier Name</Label>
                        <Input value={dossier.carrier} disabled={!isEditing} onChange={(e) => updateDossier('carrier', e.target.value)} className="h-7 text-xs" placeholder="e.g. MAERSK, CMA CGM" />
                    </div>
                    <div>
                        <Label className="text-[9px] text-slate-400 uppercase">{isAir ? "Flight No." : "Vessel Name"}</Label>
                        <Input value={dossier.vesselName} disabled={!isEditing} onChange={(e) => updateDossier('vesselName', e.target.value)} className="h-7 text-xs" />
                    </div>
                    <div>
                        <Label className="text-[9px] text-slate-400 uppercase">{isAir ? "Flight Date" : "Voyage No."}</Label>
                        <Input value={dossier.voyageNumber} disabled={!isEditing} onChange={(e) => updateDossier('voyageNumber', e.target.value)} className="h-7 text-xs" />
                    </div>
                    <div>
                        <Label className="text-[9px] text-slate-400 uppercase">Master B/L (MBL)</Label>
                        <Input value={dossier.mblNumber} disabled={!isEditing} onChange={(e) => updateDossier('mblNumber', e.target.value)} className="h-7 text-xs font-mono" />
                    </div>
                    <div>
                        <Label className="text-[9px] text-slate-400 uppercase">House B/L (HBL)</Label>
                        <Input value={dossier.hblNumber} disabled={!isEditing} onChange={(e) => updateDossier('hblNumber', e.target.value)} className="h-7 text-xs font-mono" />
                    </div>
                </div>
            </div>

            {isSea && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700 mb-1">
                        <AlertCircle className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase">Operational Deadlines</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[8px] text-amber-600/70 uppercase font-bold">VGM Cut-off</Label>
                            <Input type="date" value={formatDate(dossier.vgmCutOff || '')} disabled={!isEditing} onChange={(e) => updateDossier('vgmCutOff', new Date(e.target.value))} className="h-6 text-[10px] bg-white border-amber-200" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[8px] text-amber-600/70 uppercase font-bold">Port Cut-off</Label>
                            <Input type="date" value={formatDate(dossier.portCutOff || '')} disabled={!isEditing} onChange={(e) => updateDossier('portCutOff', new Date(e.target.value))} className="h-6 text-[10px] bg-white border-amber-200" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[8px] text-amber-600/70 uppercase font-bold">SI Cut-off</Label>
                            <Input type="date" value={formatDate(dossier.docCutOff || '')} disabled={!isEditing} onChange={(e) => updateDossier('docCutOff', new Date(e.target.value))} className="h-6 text-[10px] bg-white border-amber-200" />
                        </div>
                    </div>
                </div>
            )}

            <Separator />

            <div className="space-y-3 pb-4">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 bg-emerald-50 text-emerald-600 rounded"><User className="h-3 w-3" /></div>
                    <span className="text-xs font-bold text-slate-700">Involved Parties</span>
                </div>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400 uppercase">Shipper</Label>
                        <Input 
                            value={dossier.shipper.name} 
                            disabled={!isEditing} 
                            onChange={(e) => updateParty('shipper', 'name', e.target.value)}
                            className="h-7 text-xs font-medium placeholder:text-slate-300"
                            placeholder="Full Legal Name"
                        />
                        <Input 
                            value={dossier.shipper.address || ''} 
                            disabled={!isEditing} 
                            onChange={(e) => updateParty('shipper', 'address', e.target.value)}
                            className="h-7 text-xs text-slate-500 placeholder:text-slate-300"
                            placeholder="Address Line 1"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[9px] text-slate-400 uppercase">Consignee</Label>
                        <Input 
                            value={dossier.consignee.name} 
                            disabled={!isEditing} 
                            onChange={(e) => updateParty('consignee', 'name', e.target.value)}
                            className="h-7 text-xs font-medium placeholder:text-slate-300"
                            placeholder="Full Legal Name"
                        />
                        <Input 
                            value={dossier.consignee.address || ''} 
                            disabled={!isEditing} 
                            onChange={(e) => updateParty('consignee', 'address', e.target.value)}
                            className="h-7 text-xs text-slate-500 placeholder:text-slate-300"
                            placeholder="Address Line 1"
                        />
                    </div>
                </div>
            </div>

        </div>
    </Card>
  );
}