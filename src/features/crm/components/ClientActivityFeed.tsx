import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { MessageSquare, Send, Clock, User, AlertTriangle, Info } from "lucide-react"; // REMOVED UNUSED ICONS
import { useClientStore } from "@/store/useClientStore";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActivityCategory } from '@/types/index';
import { cn } from "@/lib/utils";

const TABS = [
    { id: 'ALL', label: 'All' },
    { id: 'NOTE', label: 'Notes' },
    { id: 'SYSTEM', label: 'System' },
    { id: 'ALERT', label: 'Alerts' },
];

export function ClientActivityFeed({ className }: { className?: string }) {
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
      toast("Note added", "success");
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
    <Card className={cn("flex flex-col bg-white border border-slate-200 shadow-md overflow-hidden", className)}>
        
        {/* HEADER: Tabs Restored */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 h-14">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-indigo-600">
                    <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-bold text-slate-700">Activity</span>
            </div>
            
            {/* Pill Filters */}
            <div className="flex gap-1 bg-slate-200/50 p-1 rounded-lg">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id as any)}
                        className={cn(
                            "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                            filter === tab.id 
                                ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5" 
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        )}
                    >
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
                        <div className="h-32 flex flex-col items-center justify-center text-slate-400">
                            <Clock className="h-8 w-8 opacity-10 mb-2" />
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
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-bold text-slate-700">{item.meta}</span>
                                    <span className="text-[9px] text-slate-400 font-medium">
                                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-2 rounded-md border border-slate-100 group-hover:border-slate-200 transition-colors shadow-sm">
                                    {item.text}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/30 shrink-0 h-[60px] flex items-center">
            <div className="flex gap-2 w-full">
                <Input
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="h-9 text-xs bg-white focus-visible:ring-indigo-100 border-slate-200"
                    placeholder="Add a note..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                />
                <Button 
                    onClick={handleSaveNote} 
                    size="icon"
                    className="h-9 w-9 bg-slate-900 hover:bg-slate-800 shadow-sm shrink-0"
                    disabled={!noteContent.trim()}
                >
                    <Send className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    </Card>
  );
}