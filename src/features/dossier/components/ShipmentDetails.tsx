import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDossierStore } from "@/store/useDossierStore";
import { MapPin, Calendar, Anchor, Box, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function ShipmentDetails() {
  const { dossier, isEditing, updateDossier, updateParty } = useDossierStore();

  const formatDate = (date: string | Date) => {
      if(!date) return '';
      return typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
  };

  return (
    <Card className="h-full border-none shadow-sm ring-1 ring-slate-200 flex flex-col overflow-hidden">
        <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100 shrink-0">
            <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                <Box className="h-3.5 w-3.5" /> Shipment Manifest
            </CardTitle>
        </CardHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* 1. ROUTING */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-blue-50 text-blue-600 rounded"><MapPin className="h-3 w-3" /></div>
                    <span className="text-xs font-bold text-slate-700">Route & Schedule</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 uppercase">POL (Origin)</Label>
                        <Input 
                            value={dossier.pol} 
                            disabled={!isEditing} 
                            onChange={(e) => updateDossier('pol', e.target.value)}
                            className="h-7 text-xs font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 uppercase">POD (Destination)</Label>
                        <Input 
                            value={dossier.pod} 
                            disabled={!isEditing} 
                            onChange={(e) => updateDossier('pod', e.target.value)}
                            className="h-7 text-xs font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 uppercase">ETD</Label>
                        <div className="relative">
                            <Input 
                                type="date"
                                value={formatDate(dossier.etd)} 
                                disabled={!isEditing} 
                                onChange={(e) => updateDossier('etd', new Date(e.target.value))}
                                className="h-7 text-xs font-medium pl-2"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 uppercase">ETA</Label>
                        <div className="relative">
                            <Input 
                                type="date"
                                value={formatDate(dossier.eta)} 
                                disabled={!isEditing} 
                                onChange={(e) => updateDossier('eta', new Date(e.target.value))}
                                className="h-7 text-xs font-medium pl-2"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            {/* 2. CARRIER INFO */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-indigo-50 text-indigo-600 rounded"><Anchor className="h-3 w-3" /></div>
                    <span className="text-xs font-bold text-slate-700">Carrier Information</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                        <Label className="text-[10px] text-slate-400 uppercase">Shipping Line / Airline</Label>
                        <Input 
                            value={dossier.carrier} 
                            disabled={!isEditing} 
                            onChange={(e) => updateDossier('carrier', e.target.value)}
                            className="h-7 text-xs font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 uppercase">Vessel Name</Label>
                        <Input 
                            value={dossier.vesselName} 
                            disabled={!isEditing} 
                            onChange={(e) => updateDossier('vesselName', e.target.value)}
                            className="h-7 text-xs font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 uppercase">Voyage / Flight No.</Label>
                        <Input 
                            value={dossier.voyageNumber} 
                            disabled={!isEditing} 
                            onChange={(e) => updateDossier('voyageNumber', e.target.value)}
                            className="h-7 text-xs font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 uppercase">MBL Number</Label>
                        <Input 
                            value={dossier.mblNumber} 
                            disabled={!isEditing} 
                            onChange={(e) => updateDossier('mblNumber', e.target.value)}
                            className="h-7 text-xs font-mono font-bold text-slate-800"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 uppercase">HBL Number</Label>
                        <Input 
                            value={dossier.hblNumber} 
                            disabled={!isEditing} 
                            onChange={(e) => updateDossier('hblNumber', e.target.value)}
                            className="h-7 text-xs font-mono text-slate-600"
                        />
                    </div>
                </div>
            </div>

            <Separator />

            {/* 3. PARTIES */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 bg-emerald-50 text-emerald-600 rounded"><User className="h-3 w-3" /></div>
                    <span className="text-xs font-bold text-slate-700">Involved Parties</span>
                </div>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 uppercase">Shipper</Label>
                        <Input 
                            value={dossier.shipper.name} 
                            disabled={!isEditing} 
                            onChange={(e) => updateParty('shipper', 'name', e.target.value)}
                            className="h-7 text-xs font-medium"
                            placeholder="Shipper Name"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400 uppercase">Consignee</Label>
                        <Input 
                            value={dossier.consignee.name} 
                            disabled={!isEditing} 
                            onChange={(e) => updateParty('consignee', 'name', e.target.value)}
                            className="h-7 text-xs font-medium"
                            placeholder="Consignee Name"
                        />
                    </div>
                </div>
            </div>

        </div>
    </Card>
  );
}