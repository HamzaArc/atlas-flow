import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { 
  Building2, CreditCard, User, 
  Wallet, History, Send, MessageSquareText,
  FileBadge, Container
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuoteStore } from "@/store/useQuoteStore";
import { cn } from "@/lib/utils";

export function QuoteSummaryTab() {
  const { 
    // Identity
    clientName, paymentTerms, salespersonName, 
    // Logistics
    mode, incoterm, pol, pod, equipmentList,
    // Financials
    totalCostMAD, totalSellMAD, totalMarginMAD, totalTTCMAD,
    // Narrative
    internalNotes, setIdentity, activities, addActivity
  } = useQuoteStore();

  const [noteInput, setNoteInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll activity feed
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activities]);

  const handleAddNote = () => {
    if(!noteInput.trim()) return;
    addActivity(noteInput, "NOTE", "neutral");
    setNoteInput("");
  };

  const marginPercent = totalSellMAD > 0 ? ((totalMarginMAD / totalSellMAD) * 100).toFixed(1) : "0.0";

  // Modern Card Style (Matching Workspace)
  const cardStyle = "bg-white border border-slate-200 shadow-[0_2px_15px_rgba(0,0,0,0.04)] rounded-xl overflow-hidden";
  const headerStyle = "py-4 px-5 border-b border-slate-100 bg-white";
  const titleStyle = "text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2";

  return (
    <div className="h-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 overflow-y-auto w-full">
      
      {/* --- LEFT COLUMN: THE SNAPSHOT (READ ONLY) --- */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Deal Sheet Card */}
        <Card className={cardStyle}>
          <CardHeader className={headerStyle}>
            <CardTitle className={titleStyle}>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><Wallet className="h-3.5 w-3.5" /></div>
              Commercial Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Financial Summary */}
            <div className="p-6 bg-white space-y-5">
               <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Total Revenue</span>
                  <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight mt-1">
                    {totalSellMAD.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm text-slate-400 font-medium">MAD</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-6 pt-2">
                 <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Net Cost</span>
                    <div className="text-sm font-bold text-slate-600 font-mono mt-1">
                      {totalCostMAD.toLocaleString('en-US', { minimumFractionDigits: 2 })} MAD
                    </div>
                 </div>
                 <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">Net Margin</span>
                    <div className={cn("text-sm font-bold font-mono mt-1 flex items-center gap-2", parseFloat(marginPercent) < 15 ? "text-amber-600" : "text-emerald-600")}>
                      {totalMarginMAD.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      <Badge variant="secondary" className="h-4 px-1 text-[9px]">{marginPercent}%</Badge>
                    </div>
                 </div>
               </div>
               
               <Separator className="bg-slate-100" />
               
               <div className="flex justify-between items-end bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Total Payable (TTC)</span>
                  <div className="text-xl font-black text-blue-700 font-mono">
                    {totalTTCMAD.toLocaleString('en-US', { minimumFractionDigits: 2 })} MAD
                  </div>
               </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Key Entities */}
            <div className="p-5 bg-slate-50/30 space-y-4">
               <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white border border-slate-200 rounded shadow-sm text-slate-500">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{clientName || "Unknown Client"}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Client Account</div>
                  </div>
               </div>
               
               <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white border border-slate-200 rounded shadow-sm text-slate-500">
                    <CreditCard className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{paymentTerms}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Payment Terms</div>
                  </div>
               </div>

               <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white border border-slate-200 rounded shadow-sm text-slate-500">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{salespersonName}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Sales Owner</div>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Summary Small Card */}
        <Card className={cardStyle}>
             <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                   <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 px-3 py-1">{mode}</Badge>
                   <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold px-3 py-1">{incoterm}</Badge>
                </div>
                <div className="space-y-6 relative">
                   <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-slate-300 to-blue-200" />
                   
                   <div className="relative pl-8 group">
                      <div className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-slate-400 bg-white group-hover:border-slate-600 transition-colors" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Origin</span>
                      <div className="text-sm font-bold text-slate-800">{pol}</div>
                   </div>

                   <div className="relative pl-8 group">
                      <div className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-blue-600 bg-white group-hover:scale-110 transition-transform shadow-sm" />
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-0.5">Destination</span>
                      <div className="text-sm font-bold text-slate-800">{pod}</div>
                   </div>
                </div>

                {/* NEW: Equipment List Display */}
                {equipmentList && equipmentList.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-dashed border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Equipment</span>
                        <div className="flex flex-wrap gap-2">
                            {equipmentList.map(eq => (
                                <div key={eq.id} className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-xs">
                                    <Container className="h-3 w-3 text-slate-500" />
                                    <span className="font-bold text-slate-700">{eq.count}x</span>
                                    <span className="text-slate-600">{eq.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </CardContent>
        </Card>
      </div>

      {/* --- RIGHT COLUMN: THE STORY (EDITABLE) --- */}
      <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-0">
        
        {/* Internal Notes */}
        <Card className={cardStyle}>
            <CardHeader className={headerStyle}>
                <CardTitle className={titleStyle}>
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md"><FileBadge className="h-3.5 w-3.5" /></div>
                    Internal Remarks
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-amber-50/20">
                <Textarea 
                    className="min-h-[100px] text-xs bg-white border-amber-200 focus:border-amber-400 focus:ring-amber-100 shadow-sm resize-none rounded-lg p-3"
                    placeholder="e.g., Client requires special handling at destination..."
                    value={internalNotes}
                    onChange={(e) => setIdentity('internalNotes', e.target.value)}
                />
            </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className={cn(cardStyle, "flex-1 flex flex-col min-h-0")}>
            <CardHeader className={headerStyle}>
                <div className="flex items-center justify-between">
                    <CardTitle className={titleStyle}>
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md"><History className="h-3.5 w-3.5" /></div>
                        Audit Log
                    </CardTitle>
                    <Badge variant="secondary" className="bg-slate-100 border text-slate-500 font-mono text-[10px]">{activities.length} Events</Badge>
                </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 flex flex-col min-h-0 bg-slate-50/30">
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-5">
                        {activities.map((item) => (
                            <div key={item.id} className="flex gap-4 animate-in slide-in-from-bottom-2 duration-300 group">
                                <Avatar className="h-8 w-8 border border-white shadow-sm mt-1 ring-2 ring-slate-100">
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${item.meta}&background=random`} />
                                    <AvatarFallback className="text-[10px] bg-slate-200 text-slate-600">{item.meta.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-xs font-bold text-slate-800">{item.meta}</span>
                                        <span className="text-[10px] text-slate-400">
                                            {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "text-xs p-3.5 rounded-r-xl rounded-bl-xl border shadow-sm relative",
                                        item.category === 'NOTE' ? "bg-white border-slate-200 text-slate-700" :
                                        item.tone === 'destructive' ? "bg-red-50 border-red-100 text-red-800" :
                                        item.tone === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                                        "bg-slate-100 border-transparent text-slate-500 italic"
                                    )}>
                                        {item.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
                
                {/* Quick Add Note Footer */}
                <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-full text-slate-400">
                        <MessageSquareText className="h-4 w-4" />
                    </div>
                    <div className="relative flex-1">
                        <input 
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="Add a private note or reply..."
                            className="w-full h-10 pl-4 pr-12 text-xs bg-slate-50 border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddNote();
                            }}
                        />
                        <Button 
                            size="icon" 
                            onClick={handleAddNote} 
                            disabled={!noteInput.trim()} 
                            className="absolute right-1 top-1 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                        >
                            <Send className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}