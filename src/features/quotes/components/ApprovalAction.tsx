import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
    AlertTriangle, Send, CheckCircle2, XCircle, ShieldAlert, Ban, Trash2, Lock 
} from "lucide-react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ApprovalAction() {
  const { 
      status, approval, attemptSubmission, submitForApproval, 
      approveQuote, rejectQuote, cancelQuote, hasExpiredRates 
  } = useQuoteStore();

  const [rejectReason, setRejectReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  
  // Distinguish between Manager Rejection (Validation) and Terminal Rejection (Draft/Sent)
  const isManagerReject = status === 'VALIDATION';

  const handleConfirmRejection = () => {
      if (isManagerReject) {
          rejectQuote(rejectReason);
      } else {
          cancelQuote(rejectReason);
      }
      setIsRejectOpen(false);
      setRejectReason('');
  };

  const RejectionDialog = () => (
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                      {isManagerReject ? <AlertTriangle className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
                      {isManagerReject ? "Reject Approval Request" : "Close / Reject Quote"}
                  </DialogTitle>
                  <DialogDescription>
                      {isManagerReject 
                        ? "Return this quote to the sales rep for corrections?" 
                        : "Mark this quote as LOST or REJECTED by client? This is final."}
                  </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                  <Textarea 
                      placeholder={isManagerReject ? "e.g. Margin is too low..." : "e.g. Price too high, Competitor won..."} 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="min-h-[100px]"
                  />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                  <Button 
                      variant="destructive" 
                      onClick={handleConfirmRejection}
                      disabled={!rejectReason}
                  >
                      {isManagerReject ? "Reject to Draft" : "Mark as Lost"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
  );

  // --- LOCKED STATE DUE TO EXPIRY ---
  if (hasExpiredRates && (status === 'DRAFT' || status === 'VALIDATION')) {
      return (
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" disabled className="h-8 text-xs border-red-200 bg-red-50 text-red-400 opacity-70 cursor-not-allowed">
                        <Lock className="h-3.5 w-3.5 mr-2" />
                        {status === 'VALIDATION' ? "Cannot Approve" : "Submission Locked"}
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-red-600 text-white border-red-700">
                    <p className="text-xs font-bold">Action Blocked: Expired Rates</p>
                    <p className="text-[10px]">Update the expired line items to proceed.</p>
                </TooltipContent>
            </Tooltip>
            {/* Allow cancel even if expired */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsRejectOpen(true)}
                className="h-8 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 ml-1"
                title="Cancel Quote"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
            <RejectionDialog />
          </TooltipProvider>
      );
  }

  // --- LOGIC: SALES REP VIEW (DRAFT) ---
  if (status === 'DRAFT') {
      return (
          <>
            <div className="flex items-center gap-2">
                {approval.requiresApproval ? (
                    <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md mr-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-[10px] font-bold text-amber-700 uppercase">Approval Needed</span>
                        <Button 
                            size="sm" 
                            onClick={submitForApproval}
                            className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-[10px] px-2 ml-1"
                        >
                            Submit
                        </Button>
                    </div>
                ) : (
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={attemptSubmission}
                        className="h-8 text-xs border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 mr-1"
                    >
                        <Send className="h-3.5 w-3.5 mr-2" /> Mark Sent
                    </Button>
                )}
                
                {/* CANCEL OPTION FOR DRAFT */}
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsRejectOpen(true)}
                    className="h-8 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Cancel Quote"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <RejectionDialog />
          </>
      );
  }

  // --- LOGIC: MANAGER VIEW (VALIDATION) ---
  if (status === 'VALIDATION') {
      return (
          <>
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="mr-2 flex flex-col items-end">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mb-0.5">
                        Pending Review
                    </Badge>
                    <span className="text-[9px] text-slate-400">Requested by {approval.requestedBy?.split(' ')[0]}</span>
                </div>

                <Button 
                    size="sm" 
                    onClick={() => approveQuote()} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs shadow-sm"
                >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve
                </Button>

                <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-8 text-xs shadow-sm"
                    onClick={() => setIsRejectOpen(true)}
                >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                </Button>
            </div>
            <RejectionDialog />
          </>
      );
  }

  // --- LOGIC: SENT (Client Decision) ---
  if (status === 'SENT') {
      return (
          <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 text-xs border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Status Update
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => useQuoteStore.getState().setStatus('ACCEPTED')}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Mark Accepted
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsRejectOpen(true)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                        <Ban className="h-3.5 w-3.5 mr-2" /> Client Rejected
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <RejectionDialog />
          </>
      );
  }

  return null;
}