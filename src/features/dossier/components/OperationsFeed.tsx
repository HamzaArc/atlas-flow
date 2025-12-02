import { 
    MessageSquare, AlertTriangle, Bell, CheckCircle2, 
    X, Send, Radio, User
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useDossierStore } from "@/store/useDossierStore";
import { ActivityCategory } from "@/types/index";

export function OperationsFeed() {
    const [isOpen, setIsOpen] = useState(true);
    const { dossier, addActivity } = useDossierStore();
    const [input, setInput] = useState("");

    const handleSend = () => {
        if(!input.trim()) return;
        addActivity(input, 'NOTE', 'neutral'); // Defaulting to Note
        setInput("");
    };

    const getIcon = (cat: ActivityCategory) => {
        switch(cat) {
            case 'ALERT': return <AlertTriangle className="h-3 w-3" />;
            case 'NOTE': return <User className="h-3 w-3" />;
            case 'SYSTEM': return <CheckCircle2 className="h-3 w-3" />;
            default: return <MessageSquare className="h-3 w-3" />;
        }
    };

    if (!isOpen) return (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4">
            <Button onClick={() => setIsOpen(true)} className="rounded-full h-12 w-12 bg-slate-900 shadow-xl hover:bg-slate-800 border-2 border-white">
                <Radio className="h-5 w-5 animate-pulse text-green-400" />
            </Button>
        </div>
    );

    return (
        <div className="h-48 border-t border-slate-200 bg-white flex flex-col shrink-0 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100 h-10">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        <Radio className="h-3 w-3 text-red-500 animate-pulse" /> Live Ops
                    </div>
                    <span className="text-xs font-medium text-slate-500">Global Control Tower Feed</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                    <X className="h-3 w-3 text-slate-400" />
                </Button>
            </div>

            {/* Content Split */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left: Alerts & Updates (Live from Store) */}
                <div className="flex-1 border-r border-slate-100 flex flex-col">
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-2">
                            {dossier.activities.length === 0 && (
                                <div className="text-center text-xs text-slate-400 italic py-4">
                                    No recent operational updates.
                                </div>
                            )}
                            {dossier.activities.map((item) => (
                                <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                    <div className={`mt-0.5 p-1 rounded-full shrink-0 ${
                                        item.category === 'ALERT' ? 'bg-red-100 text-red-600' : 
                                        item.category === 'NOTE' ? 'bg-blue-100 text-blue-600' : 
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {getIcon(item.category)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <p className="text-xs text-slate-700 font-medium leading-tight">{item.text}</p>
                                            <span className="text-[9px] text-slate-400">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">{item.meta}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right: Quick Action Input */}
                <div className="w-1/3 bg-slate-50/50 p-3 flex flex-col justify-between">
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2 mb-2">
                        <div className="h-8 w-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                            <Bell className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-700">Broadcast Update</h4>
                            <p className="text-[10px] text-slate-400 leading-tight px-4">
                                Post a message to the operations log for this dossier.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Input 
                            className="h-8 text-xs bg-white shadow-sm" 
                            placeholder="Type update..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <Button size="icon" className="h-8 w-8 bg-slate-900 hover:bg-slate-800" onClick={handleSend}>
                            <Send className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}