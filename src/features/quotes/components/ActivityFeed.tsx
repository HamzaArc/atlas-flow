import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { MessageSquare, Bell, FileText, Filter, Send, Clock, User, AlertTriangle, Info } from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityCategory } from '@/types/index';

const TABS = [
    { id: 'ALL', label: 'All Activity', icon: Clock },
    { id: 'NOTE', label: 'Notes', icon: FileText },
    { id: 'SYSTEM', label: 'System', icon: Bell },
    { id: 'ALERT', label: 'Alerts', icon: AlertTriangle },
];

export function ActivityFeed() {
  const { activities, addActivity } = useQuoteStore();
  const { toast } = useToast();
  
  const [filter, setFilter] = useState<'ALL' | ActivityCategory>('ALL');
  const [noteContent, setNoteContent] = useState('');

  const filteredActivities = activities.filter(a => filter === 'ALL' || a.category === filter);

  const handleSaveNote = () => {
      if (!noteContent.trim()) return;
      addActivity(noteContent, 'NOTE', 'neutral');
      setNoteContent('');
      toast("Note added to timeline", "success");
  };

  const getIcon = (cat: ActivityCategory) => {
      switch(cat) {
          case 'NOTE': return <User className="h-3 w-3" />;
          case 'ALERT': return <AlertTriangle className="h-3 w-3" />;
          case 'SYSTEM': return <Info className="h-3 w-3" />;
          default: return <Clock className="h-3 w-3" />;
      }
  };

  const getColor = (cat: ActivityCategory, tone: string) => {
      if (cat === 'ALERT' || tone === 'warning') return 'bg-amber-100 text-amber-700 border-amber-200';
      if (cat === 'SYSTEM' || tone === 'success') return 'bg-blue-50 text-blue-700 border-blue-100';
      return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <Card className="h-full flex flex-row overflow-hidden bg-white shadow-md ring-1 ring-slate-200/60 border-none">
        
        {/* LEFT PANE: Feed & Filters (65%) */}
        <div className="flex-1 flex flex-col border-r border-slate-100">
            {/* Header / Tabs */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                        <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">Collaboration Hub</span>
                </div>
                <div className="flex gap-1 bg-slate-100/80 p-1 rounded-lg">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                filter === tab.id 
                                    ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' 
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            <tab.icon className="h-3 w-3" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Timeline */}
            <div className="flex-1 bg-slate-50/30 overflow-hidden relative">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                        {filteredActivities.length === 0 && (
                            <div className="h-32 flex flex-col items-center justify-center text-slate-400">
                                <Filter className="h-8 w-8 opacity-20 mb-2" />
                                <span className="text-xs">No activity found for this filter.</span>
                            </div>
                        )}
                        {filteredActivities.map((item) => (
                            <div key={item.id} className="flex gap-3 group">
                                <div className="flex flex-col items-center">
                                    <div className={`mt-1 h-6 w-6 rounded-full border flex items-center justify-center shadow-sm z-10 ${getColor(item.category, item.tone || 'neutral')}`}>
                                        {getIcon(item.category)}
                                    </div>
                                    <div className="w-px h-full bg-slate-200 group-last:hidden -my-1"></div>
                                </div>
                                <div className="flex-1 pb-2">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[11px] font-bold text-slate-700">{item.meta}</span>
                                        <span className="text-[9px] text-slate-400 font-medium">
                                            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                        </span>
                                        {item.category === 'ALERT' && <Badge variant="destructive" className="h-4 px-1 text-[9px]">Action Req</Badge>}
                                    </div>
                                    <div className={`text-xs text-slate-600 bg-white border border-slate-100 p-2.5 rounded-r-xl rounded-bl-xl shadow-sm ${item.category === 'NOTE' ? 'bg-indigo-50/30 border-indigo-100' : ''}`}>
                                        {item.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>

        {/* RIGHT PANE: Editor (35%) */}
        <div className="w-[35%] flex flex-col bg-white p-4">
            <div className="mb-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    Add Internal Note
                </label>
                <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full h-32 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all resize-none outline-none shadow-inner"
                    placeholder="Type a note for the team (e.g. 'Pending rates from Maersk')..."
                />
            </div>
            
            <div className="flex items-center justify-between mt-auto">
                <div className="flex -space-x-2 overflow-hidden">
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">YA</div>
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400">+2</div>
                </div>
                <Button 
                    onClick={handleSaveNote} 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 pl-4 pr-5 rounded-full h-9"
                    disabled={!noteContent.trim()}
                >
                    Post Note <Send className="h-3 w-3 ml-2" />
                </Button>
            </div>
        </div>

    </Card>
  );
}