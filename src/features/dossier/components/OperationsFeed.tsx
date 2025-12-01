import { 
    MessageSquare, AlertTriangle, Bell, CheckCircle2, 
    X, Send, Radio
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// Mock Data for the Global Feed
const MOCK_FEED = [
    { id: 1, type: 'ALERT', msg: 'Demurrage risk for IMP-24-0056 (2 days left)', time: '10 min ago' },
    { id: 2, type: 'MSG', msg: 'Youssef: Documents for AIR-24-088 uploaded.', time: '1 hour ago' },
    { id: 3, type: 'SYSTEM', msg: 'Customs Clearance completed for EXP-24-0102', time: '2 hours ago' },
    { id: 4, type: 'MSG', msg: 'Fatima: Client TexNord asking for ETA update.', time: '4 hours ago' },
];

export function OperationsFeed() {
    const [isOpen, setIsOpen] = useState(true);

    if (!isOpen) return (
        <div className="fixed bottom-4 right-4 z-50">
            <Button onClick={() => setIsOpen(true)} className="rounded-full h-12 w-12 bg-slate-900 shadow-lg hover:bg-slate-800">
                <Radio className="h-5 w-5 animate-pulse text-green-400" />
            </Button>
        </div>
    );

    return (
        <div className="h-48 border-t border-slate-200 bg-white flex flex-col shrink-0 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100 h-10">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                        <Radio className="h-3 w-3 text-red-500 animate-pulse" /> Live Ops
                    </div>
                    <span className="text-xs font-medium text-slate-500">Control Tower Feed</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                    <X className="h-3 w-3 text-slate-400" />
                </Button>
            </div>

            {/* Content Split */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left: Alerts & Updates */}
                <div className="flex-1 border-r border-slate-100 flex flex-col">
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-2">
                            {MOCK_FEED.map((item) => (
                                <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                    <div className={`mt-0.5 p-1 rounded-full shrink-0 ${
                                        item.type === 'ALERT' ? 'bg-red-100 text-red-600' : 
                                        item.type === 'MSG' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                        {item.type === 'ALERT' ? <AlertTriangle className="h-3 w-3" /> : 
                                         item.type === 'MSG' ? <MessageSquare className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-700 leading-tight">{item.msg}</p>
                                        <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-6 opacity-0 group-hover:opacity-100 text-[10px]">Reply</Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right: Quick Action Input */}
                <div className="w-1/3 bg-slate-50/50 p-3 flex flex-col">
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2 mb-2">
                        <div className="h-8 w-8 bg-white border border-slate-200 rounded-full flex items-center justify-center">
                            <Bell className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-700">Broadcast Alert</h4>
                            <p className="text-[10px] text-slate-400">Send notification to all active operators.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Input className="h-8 text-xs bg-white" placeholder="Type global announcement..." />
                        <Button size="icon" className="h-8 w-8 bg-blue-600 hover:bg-blue-700"><Send className="h-3.5 w-3.5" /></Button>
                    </div>
                </div>
            </div>
        </div>
    );
}