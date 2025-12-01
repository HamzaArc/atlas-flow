import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { MessageSquare, Bell, FileText, Filter, Send, Clock, User, AlertTriangle, Info } from "lucide-react";
import { useClientStore } from "@/store/useClientStore";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityCategory } from '@/types/index';

const TABS = [
    { id: 'ALL', label: 'All', icon: Clock },
    { id: 'NOTE', label: 'Notes', icon: FileText },
    { id: 'SYSTEM', label: 'System', icon: Bell },
];

export function ClientActivityFeed() {
  const { activeClient, addActivity } = useClientStore();
  const { toast } = useToast();
  
  const [filter, setFilter] = useState<'ALL' | ActivityCategory>('ALL');
  const [noteContent, setNoteContent] = useState('');

  if (!activeClient) return null;

  const filteredActivities = activeClient.activities.filter(a => filter === 'ALL' || a.category === filter);

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
      if (cat === 'NOTE') return 'bg-purple-50 text-purple-700 border-purple-100';
      return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <Card className="h-full flex flex-col bg-white border-slate-200 shadow-sm overflow-hidden">
        
        {/* HEADER */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">Collaboration Hub</span>
            </div>
            <div className="flex gap-1 bg-white p-0.5 rounded-md border border-slate-200">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id as any)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            filter === tab.id 
                                ? 'bg-slate-100 text-slate-800' 
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <tab.icon className="h-3 w-3" />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* FEED */}
        <div className="flex-1 bg-white relative min-h-0">
            <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                    {filteredActivities.length === 0 && (
                        <div className="h-24 flex flex-col items-center justify-center text-slate-400">
                            <Filter className="h-6 w-6 opacity-20 mb-2" />
                            <span className="text-xs">No activity found.</span>
                        </div>
                    )}
                    {filteredActivities.map((item) => (
                        <div key={item.id} className="flex gap-3 group">
                            <div className="flex flex-col items-center">
                                <div className={`mt-0.5 h-6 w-6 rounded-full border flex items-center justify-center shadow-sm z-10 ${getColor(item.category, item.tone || 'neutral')}`}>
                                    {getIcon(item.category)}
                                </div>
                                <div className="w-px h-full bg-slate-100 group-last:hidden mt-1"></div>
                            </div>
                            <div className="flex-1 pb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[11px] font-bold text-slate-700">{item.meta}</span>
                                    <span className="text-[9px] text-slate-400 font-medium">
                                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-100">
                                    {item.text}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        {/* INPUT */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
            <div className="relative">
                <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full h-20 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all resize-none outline-none pr-12"
                    placeholder="Type an internal note..."
                />
                <Button 
                    onClick={handleSaveNote} 
                    size="icon"
                    className="absolute right-2 bottom-2 h-7 w-7 bg-blue-600 hover:bg-blue-700 rounded-md"
                    disabled={!noteContent.trim()}
                >
                    <Send className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    </Card>
  );
}