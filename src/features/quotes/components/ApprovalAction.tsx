import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
    AlertTriangle, Send, CheckCircle2, XCircle, ShieldAlert 
} from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { Badge } from "@/components/ui/badge";

export function ApprovalAction() {
  const { 
      status, approval, attemptSubmission, submitForApproval, 
      approveQuote, rejectQuote 
  } = useQuoteStore();

  const [rejectReason, setRejectReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  // --- LOGIC: SALES REP VIEW ---
  if (status === 'DRAFT') {
      if (approval.requiresApproval) {
          return (
              <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-amber-700 uppercase leading-none">Approval Required</span>
                          <span className="text-[9px] text-amber-600 leading-none mt-0.5">{approval.reason}</span>
                      </div>
                  </div>
                  <Button 
                      size="sm" 
                      onClick={submitForApproval}
                      className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-xs"
                  >
                      Submit Request
                  </Button>
              </div>
          );
      } else {
          return (
              <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={attemptSubmission}
                  className="h-8 text-xs border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                  <Send className="h-3.5 w-3.5 mr-2" /> Mark Sent
              </Button>
          );
      }
  }

  // --- LOGIC: MANAGER VIEW (VALIDATION STATE) ---
  if (status === 'VALIDATION') {
      return (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="mr-2 flex flex-col items-end">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mb-0.5">
                      Pending Review
                  </Badge>
                  <span className="text-[9px] text-slate-400">Requested by {approval.requestedBy?.split(' ')[0]}</span>
              </div>

              {/* APPROVE */}
              <Button 
                  size="sm" 
                  onClick={() => approveQuote()} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs shadow-sm"
              >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve
              </Button>

              {/* REJECT DIALOG */}
              <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                  <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="h-8 text-xs shadow-sm">
                          <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-red-600">
                              <AlertTriangle className="h-5 w-5" /> Reject Quote Request
                          </DialogTitle>
                          <DialogDescription>
                              Please provide a reason for rejection. This will be logged in the activity feed and the quote will return to Draft status.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="py-2">
                          <Textarea 
                              placeholder="e.g. Margin is too low for this lane..." 
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="min-h-[100px]"
                          />
                      </div>
                      <DialogFooter>
                          <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                          <Button 
                              variant="destructive" 
                              onClick={() => { rejectQuote(rejectReason); setIsRejectOpen(false); setRejectReason(''); }}
                              disabled={!rejectReason}
                          >
                              Confirm Rejection
                          </Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
          </div>
      );
  }

  // --- LOGIC: OTHER STATES (SENT/ACCEPTED) ---
  if (status === 'SENT') {
      return (
          <Button variant="outline" size="sm" onClick={() => useQuoteStore.getState().setStatus('ACCEPTED')} className="h-8 text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Mark Accepted
          </Button>
      );
  }

  return null;
}