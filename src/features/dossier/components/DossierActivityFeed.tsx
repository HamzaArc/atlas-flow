import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { MessageSquare, Bell, FileText, Send, Clock, User, AlertTriangle, Info } from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityCategory } from '@/types/index';
import { cn } from "@/lib/utils";

const TABS = [
    { id: 'ALL', label: 'All', icon: Clock },
    { id: 'NOTE', label: 'Notes', icon: FileText },
    { id: 'SYSTEM', label: 'System', icon: Bell },
    { id: 'ALERT', label: 'Alerts', icon: AlertTriangle },
];

export function DossierActivityFeed() {
  const { dossier, addActivity } = useDossierStore();
  const { toast } = useToast();
  
  const [filter, setFilter] = useState<'ALL' | ActivityCategory>('ALL');
  const [noteContent, setNoteContent] = useState('');

  const filteredActivities = dossier.activities.filter(a => filter === 'ALL' || a.category === filter);

  const handleSaveNote = () => {
      if (!noteContent.trim()) return;
      addActivity(noteContent, 'NOTE', 'neutral');
      setNoteContent('');
      toast("Note added to dossier", "success");
  };

  const getIcon = (cat: ActivityCategory) => {
      switch(cat) {
          case 'NOTE': return <User className="h-3 w-3" />;
          case 'ALERT': return <AlertTriangle className="h-3 w-3" />;
          case 'SYSTEM': return <Info className="h-3 w-3" />;
          default: return <MessageSquare className="h-3 w-3" />;
      }
  };

  const getColor = (cat: ActivityCategory, tone: string) => {
      if (cat === 'ALERT' || tone === 'warning') return 'bg-amber-100 text-amber-700 border-amber-200';
      if (cat === 'SYSTEM' || tone === 'success') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      if (cat === 'NOTE') return 'bg-blue-50 text-blue-700 border-blue-200';
      return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <Card className="h-full flex flex-col bg-white border border-slate-200 shadow-sm overflow-hidden">
        
        {/* HEADER */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                    <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Collaboration Hub</span>
            </div>
            
            <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id as any)}
                        className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1",
                            filter === tab.id 
                                ? "bg-slate-800 text-white shadow-sm" 
                                : "text-slate-500 hover:bg-slate-100"
                        )}
                        title={tab.label}
                    >
                        <tab.icon className="h-3 w-3" />
                        <span className="hidden xl:inline">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* FEED */}
        <div className="flex-1 bg-white relative min-h-0">
            <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                    {filteredActivities.length === 0 && (
                        <div className="h-32 flex flex-col items-center justify-center text-slate-400">
                            <Clock className="h-8 w-8 opacity-10 mb-2" />
                            <span className="text-xs">No activity found.</span>
                        </div>
                    )}
                    {filteredActivities.map((item) => (
                        <div key={item.id} className="flex gap-3 group">
                            <div className="flex flex-col items-center">
                                <div className={cn("mt-0.5 h-6 w-6 rounded-full border flex items-center justify-center shadow-sm z-10", getColor(item.category, item.tone || 'neutral'))}>
                                    {getIcon(item.category)}
                                </div>
                                <div className="w-px h-full bg-slate-100 group-last:hidden mt-1"></div>
                            </div>
                            <div className="flex-1 pb-2">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-slate-800">{item.meta}</span>
                                        {item.category === 'SYSTEM' && <Badge variant="outline" className="text-[9px] h-4 px-1 bg-slate-50 border-slate-200 text-slate-500">Auto</Badge>}
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-medium">
                                        {item.timestamp ? new Date(item.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : ''}
                                    </span>
                                </div>
                                <div className={cn(
                                    "text-xs leading-relaxed p-2.5 rounded-lg border shadow-sm transition-all",
                                    item.category === 'NOTE' ? "bg-blue-50/30 border-blue-100 text-slate-700" :
                                    item.category === 'ALERT' ? "bg-amber-50/50 border-amber-100 text-amber-900" :
                                    "bg-white border-slate-100 text-slate-600 group-hover:border-slate-200"
                                )}>
                                    {item.text}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        {/* INPUT AREA */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/30 shrink-0">
            <div className="flex gap-2 w-full">
                <div className="relative flex-1">
                    <input
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="w-full h-9 pl-3 pr-10 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all placeholder:text-slate-400"
                        placeholder="Type a note or update..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                    />
                    <div className="absolute right-2 top-2 text-[9px] font-bold text-slate-300 pointer-events-none border border-slate-200 rounded px-1">
                        ENTER
                    </div>
                </div>
                <Button 
                    onClick={handleSaveNote} 
                    size="icon"
                    className="h-9 w-9 bg-slate-900 hover:bg-slate-800 shadow-sm shrink-0 rounded-lg"
                    disabled={!noteContent.trim()}
                >
                    <Send className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    </Card>
  );
}