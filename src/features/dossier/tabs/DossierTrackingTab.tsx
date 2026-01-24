import { useState, useEffect } from 'react';
import { 
  Anchor, Clock, MapPin, Plus, Calendar, 
  AlertTriangle, Share2, 
  Copy, Activity, Edit2, Check, X
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { ShipmentEvent } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { generateUUID } from "@/lib/utils";

export const DossierTrackingTab = () => {
  const { dossier, updateDossier, saveDossier, isLoading } = useDossierStore();
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  
  // --- References Editing State ---
  const [isEditingRefs, setIsEditingRefs] = useState(false);
  const [refsFormData, setRefsFormData] = useState({
      carrier: '',
      mblNumber: '',
      hblNumber: ''
  });

  // Sync state with dossier data
  useEffect(() => {
      setRefsFormData({
          carrier: dossier.carrier || '',
          mblNumber: dossier.mblNumber || '',
          hblNumber: dossier.hblNumber || ''
      });
  }, [dossier.carrier, dossier.mblNumber, dossier.hblNumber]);

  // --- Event Adding State ---
  const [newEvent, setNewEvent] = useState<Partial<ShipmentEvent>>({
    title: '',
    location: '',
    timestamp: new Date().toISOString().slice(0, 16),
    isException: false,
    exceptionReason: ''
  });

  const sortedEvents = [...(dossier.events || [])].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // --- Handlers ---

  const handleSaveRefs = async () => {
      // Update store
      updateDossier('carrier', refsFormData.carrier);
      updateDossier('mblNumber', refsFormData.mblNumber);
      updateDossier('hblNumber', refsFormData.hblNumber);
      
      // Save to DB
      await saveDossier();
      setIsEditingRefs(false);
  };

  const handleCancelRefs = () => {
      setRefsFormData({
          carrier: dossier.carrier || '',
          mblNumber: dossier.mblNumber || '',
          hblNumber: dossier.hblNumber || ''
      });
      setIsEditingRefs(false);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title) return;

    const eventToAdd: ShipmentEvent = {
      id: `evt-${generateUUID()}`, // Safe UUID
      title: newEvent.title!,
      location: newEvent.location,
      timestamp: newEvent.timestamp || new Date().toISOString(),
      isException: newEvent.isException,
      exceptionReason: newEvent.exceptionReason,
      source: 'Manual'
    };

    updateDossier('events', [...(dossier.events || []), eventToAdd]);
    await saveDossier();

    setIsAddingEvent(false);
    setNewEvent({ title: '', location: '', timestamp: new Date().toISOString().slice(0, 16) });
  };

  // Helper to get initials for the carrier avatar
  const getCarrierInitials = (name: string) => {
      if (!name) return '??';
      return name.substring(0, 3).toUpperCase();
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 pb-24 space-y-8">
      
      {/* 1. Map Visualization (Mock) */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl relative h-[400px] w-full group ring-1 ring-slate-900/10">
         {/* Map Background Image */}
         <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/0,20,1.5,0/1200x600?access_token=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja2xsN3c0bDMwMG54MnBwYmZ4b3F4Y200In0.7bA7y4i4_6x4f5_8')] bg-cover bg-center opacity-50 mix-blend-screen grayscale-[20%]" />
         
         {/* Live Info Card */}
         <div className="absolute bottom-6 left-6 z-20">
            <div className="flex items-center gap-4">
               <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-2xl">
                  <div className="flex items-center gap-3 mb-1">
                     <Anchor className="h-5 w-5 text-sky-400" />
                     <span className="text-white font-bold tracking-wide text-sm uppercase">{dossier.vesselName || 'TBN VESSEL'}</span>
                  </div>
                  <div className="text-sky-200 text-xs font-mono mb-2">Voyage: {dossier.voyageNumber || '---'}</div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
                      <div>
                         <div className="text-slate-400 font-bold uppercase text-[10px]">ETA {dossier.pod}</div>
                         <div className="text-white font-bold text-xs">{new Date(dossier.eta).toLocaleDateString()}</div>
                      </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Actions */}
         <div className="absolute top-6 right-6 z-20">
            <Button variant="secondary" size="sm" className="bg-slate-800/80 hover:bg-slate-700 text-white backdrop-blur-md border border-white/10">
               <MapPin className="h-4 w-4 mr-2" /> Live Satellite
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Timeline Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
           
           <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
               <Activity className="h-5 w-5 text-blue-600" />
               Event Log
             </h3>
             <Button onClick={() => setIsAddingEvent(true)} className="bg-slate-900 text-white hover:bg-slate-800">
                <Plus className="h-4 w-4 mr-2" /> Update Status
             </Button>
           </div>

           <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
              {sortedEvents.length === 0 ? (
                <div className="pl-10 py-8 text-slate-400 italic">No events logged yet.</div>
              ) : (
                sortedEvents.map((event, idx) => {
                    const isFirst = idx === 0;
                    return (
                    <div key={event.id} className="relative pl-10 group">
                        {/* Dot */}
                        <div className={`
                          absolute -left-[11px] top-1 h-6 w-6 rounded-full border-4 transition-all z-10 flex items-center justify-center
                          ${event.isException 
                              ? 'bg-red-500 border-white ring-4 ring-red-50' 
                              : isFirst 
                                  ? 'bg-blue-600 border-white ring-4 ring-blue-50' 
                                  : 'bg-white border-slate-300'}
                        `} />

                        <Card className={`p-5 ${isFirst ? 'border-blue-100 shadow-md' : 'border-slate-200'}`}>
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                  <h4 className={`text-sm font-bold ${event.isException ? 'text-red-700' : 'text-slate-900'}`}>
                                      {event.title}
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(event.timestamp).toLocaleDateString()}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                  </div>
                              </div>
                              {isFirst && <Badge variant="secondary" className="bg-blue-50 text-blue-700">Latest</Badge>}
                          </div>

                          {event.location && (
                              <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-700">
                                  <MapPin className="h-3 w-3 text-slate-400" /> {event.location}
                              </div>
                          )}

                          {event.isException && (
                              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 flex gap-3">
                                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                                  <div className="text-xs text-red-800">
                                      <span className="font-bold block">Delay Reported</span>
                                      {event.exceptionReason}
                                  </div>
                              </div>
                          )}
                        </Card>
                    </div>
                    );
                })
              )}
           </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
           
           {/* Reference Data (Editable) */}
           <Card className="p-5 relative group">
              <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Tracking References</h4>
                  
                  {/* Edit Toggle */}
                  {!isEditingRefs ? (
                      <button 
                        onClick={() => setIsEditingRefs(true)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit References"
                      >
                          <Edit2 className="h-3.5 w-3.5" />
                      </button>
                  ) : (
                      <div className="flex items-center gap-1">
                          <button onClick={handleSaveRefs} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="h-4 w-4" /></button>
                          <button onClick={handleCancelRefs} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="h-4 w-4" /></button>
                      </div>
                  )}
              </div>

              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                       {getCarrierInitials(refsFormData.carrier)}
                    </div>
                    <div className="flex-1">
                       <div className="text-xs text-slate-500 uppercase">Carrier</div>
                       {isEditingRefs ? (
                           <Input 
                              value={refsFormData.carrier}
                              onChange={(e) => setRefsFormData({...refsFormData, carrier: e.target.value})}
                              className="h-7 text-xs mt-1"
                              placeholder="e.g. Maersk"
                           />
                       ) : (
                           <div className="text-sm font-bold text-slate-900">{dossier.carrier || 'Unknown'}</div>
                       )}
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                        <div className="text-xs text-slate-500 uppercase mb-1">MBL Number</div>
                        {isEditingRefs ? (
                            <Input 
                                value={refsFormData.mblNumber}
                                onChange={(e) => setRefsFormData({...refsFormData, mblNumber: e.target.value})}
                                className="h-7 text-xs font-mono"
                                placeholder="Master BL"
                            />
                        ) : (
                            <div className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded w-fit text-slate-800">
                                {dossier.mblNumber || '---'}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase mb-1">HBL Number</div>
                        {isEditingRefs ? (
                            <Input 
                                value={refsFormData.hblNumber}
                                onChange={(e) => setRefsFormData({...refsFormData, hblNumber: e.target.value})}
                                className="h-7 text-xs font-mono"
                                placeholder="House BL"
                            />
                        ) : (
                            <div className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded w-fit text-slate-800">
                                {dossier.hblNumber || '---'}
                            </div>
                        )}
                    </div>
                 </div>
              </div>
           </Card>

           {/* Share Link */}
           <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-sm">
                 <Share2 className="h-4 w-4" /> Share Tracking
              </div>
              <p className="text-xs text-blue-600 mb-4">Generate a public link for your customer.</p>
              <Button variant="outline" className="w-full bg-white border-blue-200 text-blue-700 hover:bg-blue-50">
                 <Copy className="h-3 w-3 mr-2" /> Copy Link
              </Button>
           </div>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log New Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <Label>Event Title</Label>
                 <Input 
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="e.g. Arrived at Port of Discharge"
                 />
              </div>
              <div>
                 <Label>Location</Label>
                 <Input 
                    value={newEvent.location}
                    onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                    placeholder="City or Port"
                 />
              </div>
              <div>
                 <Label>Date & Time</Label>
                 <Input 
                    type="datetime-local"
                    value={newEvent.timestamp}
                    onChange={e => setNewEvent({...newEvent, timestamp: e.target.value})}
                 />
              </div>
              <div className="col-span-2 flex items-center space-x-2 pt-2">
                 <Checkbox 
                    id="exception" 
                    checked={newEvent.isException}
                    onCheckedChange={(c) => setNewEvent({...newEvent, isException: c as boolean})}
                 />
                 <Label htmlFor="exception" className="text-red-600 font-bold cursor-pointer">Mark as Exception / Delay</Label>
              </div>
              {newEvent.isException && (
                 <div className="col-span-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-red-600">Reason</Label>
                    <Input 
                       className="border-red-200 bg-red-50 focus-visible:ring-red-500"
                       value={newEvent.exceptionReason}
                       onChange={e => setNewEvent({...newEvent, exceptionReason: e.target.value})}
                       placeholder="e.g. Port Congestion"
                    />
                 </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddingEvent(false)}>Cancel</Button>
            <Button onClick={handleAddEvent} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};