import { 
  History, User, Search, Download, 
  Mail, FileText, CheckSquare, AlertCircle,
  Clock
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const DossierAuditTab = () => {
  const { dossier } = useDossierStore();
  
  // Combine Activities (Notes) and System Events (Audit) if stored separately
  // For this view, we primarily display the 'activities' array which contains the logs
  const logs = dossier.activities || [];

  const getIcon = (category: string) => {
    switch (category) {
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'SYSTEM': return <History className="h-4 w-4" />;
      case 'ALERT': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getToneColor = (tone: string = 'neutral') => {
     switch (tone) {
        case 'destructive': return 'bg-red-100 text-red-600 border-red-200';
        case 'warning': return 'bg-orange-100 text-orange-600 border-orange-200';
        case 'success': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
     }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24 space-y-8">
       
       <div className="flex justify-between items-center">
          <div>
             <h2 className="text-lg font-bold text-slate-900">Audit Trail</h2>
             <p className="text-sm text-slate-500">Immutable record of all actions and changes.</p>
          </div>
          <div className="flex gap-3">
             <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Search logs..." className="pl-9 bg-white" />
             </div>
             <Button variant="outline">
                <Download className="h-4 w-4 mr-2" /> Export CSV
             </Button>
          </div>
       </div>

       <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
          {logs.length === 0 ? (
             <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 relative z-10">
                <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No activity recorded yet.</p>
             </div>
          ) : (
             logs.map((log) => (
                <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                   
                   {/* Icon */}
                   <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-slate-500">
                      {getIcon(log.category)}
                   </div>
                   
                   {/* Card */}
                   <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                         <Badge variant="outline" className={`border-0 ${getToneColor(log.tone)}`}>
                            {log.category}
                         </Badge>
                         <time className="text-xs font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                         </time>
                      </div>
                      <p className="text-sm font-medium text-slate-800 leading-snug">
                         {log.text}
                      </p>
                      <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-50">
                         <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            sys
                         </div>
                         <span className="text-xs text-slate-500 font-medium">System</span>
                      </div>
                   </Card>

                </div>
             ))
          )}
       </div>

    </div>
  );
};