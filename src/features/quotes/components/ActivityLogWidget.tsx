import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, 
  History, Bell, Send 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useQuoteStore } from "@/store/useQuoteStore";
import { ActivityItem } from "@/types/index";

interface ActivityLogWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ActivityLogWidget({ isOpen, onToggle }: ActivityLogWidgetProps) {
  const { activities, addActivity } = useQuoteStore();
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Auto-scroll to bottom on new activity
  const bottomRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activities, isOpen]);

  const handleSend = () => {
    if (!note.trim()) return;
    addActivity(note, "NOTE", "neutral");
    setNote("");
  };

  const filteredActivities = activities.filter(a => {
    if (activeTab === "all") return true;
    if (activeTab === "notes") return a.category === "NOTE";
    if (activeTab === "system") return a.category === "SYSTEM" || a.category === "APPROVAL";
    return true;
  });

  const ActivityCard = ({ item }: { item: ActivityItem }) => (
    <div className="flex gap-3 group animate-in slide-in-from-right-2 fade-in duration-300">
      <div className="mt-0.5 flex flex-col items-center">
        <Avatar className="h-6 w-6 border border-slate-200">
           <AvatarImage src={`https://ui-avatars.com/api/?name=${item.meta}&background=random`} />
           <AvatarFallback className="text-[9px]">{item.meta.substring(0,2)}</AvatarFallback>
        </Avatar>
        <div className="w-px h-full bg-slate-200 my-1 group-last:hidden" />
      </div>
      <div className="flex-1 pb-4">
         <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700">{item.meta}</span>
            <span className="text-[9px] text-slate-400">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
         </div>
         <div className={cn(
             "mt-1 text-xs p-2 rounded-lg border",
             item.category === 'NOTE' ? "bg-white border-slate-200 text-slate-700 shadow-sm" :
             item.tone === 'destructive' ? "bg-red-50 border-red-100 text-red-700" :
             item.tone === 'warning' ? "bg-amber-50 border-amber-100 text-amber-700" :
             item.tone === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
             "bg-slate-50 border-transparent text-slate-500 italic"
         )}>
             {item.text}
         </div>
      </div>
    </div>
  );

  // --- COLLAPSED STATE (The Strip) ---
  if (!isOpen) {
      return (
          <div 
            onClick={onToggle}
            className="h-full w-12 border-l border-slate-200 bg-white flex flex-col items-center py-4 cursor-pointer hover:bg-slate-50 transition-colors z-20"
          >
              <div className="p-2 rounded-md bg-blue-50 text-blue-600 mb-6">
                  <History className="h-5 w-5" />
              </div>
              
              {/* Vertical Text */}
              <div className="flex-1 w-full flex items-center justify-center">
                  <span className="transform -rotate-90 whitespace-nowrap text-xs font-bold text-slate-400 tracking-widest uppercase">
                      Activity Log
                  </span>
              </div>

              <div className="mt-auto flex flex-col gap-4">
                  <div className="relative">
                    <Bell className="h-4 w-4 text-slate-400" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 border border-white animate-pulse" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <ChevronLeft className="h-4 w-4" />
                  </Button>
              </div>
          </div>
      );
  }

  // --- EXPANDED STATE (The Widget) ---
  return (
    <div className="h-full w-[380px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-20 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50 shrink-0">
            <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-500" />
                <span className="font-bold text-sm text-slate-700">Activity & Notes</span>
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-white border-slate-200">{activities.length}</Badge>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
            </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-3 border-b border-slate-100 shrink-0">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full h-8 bg-slate-100 p-0.5">
                    <TabsTrigger value="all" className="flex-1 h-7 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1 h-7 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Notes</TabsTrigger>
                    <TabsTrigger value="system" className="flex-1 h-7 text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">System</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

        {/* Scrollable Feed */}
        <ScrollArea className="flex-1 bg-slate-50/30">
            <div className="p-4 flex flex-col">
                {filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                        <MessageSquare className="h-8 w-8 opacity-20" />
                        <span className="text-xs">No activity yet.</span>
                    </div>
                ) : (
                    filteredActivities.map((a) => <ActivityCard key={a.id} item={a} />)
                )}
                <div ref={bottomRef} />
            </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-3 border-t border-slate-200 bg-white shrink-0">
            <div className="relative flex items-center gap-2">
                <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src="https://ui-avatars.com/api/?name=You&background=0f172a&color=fff" />
                    <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <div className="relative flex-1">
                    <Input 
                        placeholder="Add a private note..." 
                        className="h-9 pr-8 text-xs bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!note.trim()}
                        className="absolute right-2 top-2 text-blue-600 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}