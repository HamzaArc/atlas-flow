import { useState, useEffect } from "react";
import { Copy, MessageCircle, Check, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { format, differenceInDays } from "date-fns";

// Interface for the data we need to generate the message
export interface QuoteOfferData {
    reference: string;
    pol: string;
    pod: string;
    mode: string; // 'AIR' | 'SEA_FCL' | 'SEA_LCL' | 'ROAD'
    commodity: string;
    equipment: string;
    totalPrice: number;
    currency: string;
    validityDate: string | Date;
    transitTime: number;
}

interface WhatsAppOfferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: QuoteOfferData;
}

export function WhatsAppOfferDialog({ open, onOpenChange, data }: WhatsAppOfferDialogProps) {
    const [tone, setTone] = useState<'casual' | 'formal' | 'urgent'>('casual');
    const [message, setMessage] = useState("");
    const [copied, setCopied] = useState(false);

    // Auto-generate message when data or tone changes
    useEffect(() => {
        if (open) {
            setMessage(generateMessage(tone, data));
        }
    }, [open, tone, data]);

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenWhatsApp = () => {
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-white rounded-xl shadow-2xl">
                {/* Header with WhatsApp Brand Colors */}
                <div className="bg-[#25D366] p-4 flex items-center gap-3 text-white">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                        <MessageCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-white text-lg font-bold">Share Offer</DialogTitle>
                        <p className="text-white/80 text-xs">Send smart format via WhatsApp</p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Tone Selector */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message Tone</Label>
                        <Tabs value={tone} onValueChange={(v) => setTone(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 h-9 bg-slate-100 p-1">
                                <TabsTrigger value="casual" className="text-xs">👋 Casual</TabsTrigger>
                                <TabsTrigger value="formal" className="text-xs">👔 Formal</TabsTrigger>
                                <TabsTrigger value="urgent" className="text-xs">⚡ Urgent</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Preview Area */}
                    <div className="relative group">
                        <Textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[250px] font-mono text-sm bg-slate-50 border-slate-200 resize-none p-4 leading-relaxed focus:ring-[#25D366] focus:border-[#25D366]"
                        />
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="secondary" className="h-8 w-8 shadow-sm" onClick={() => setMessage(generateMessage(tone, data))}>
                                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button variant="outline" onClick={handleCopy} className="border-slate-200 hover:bg-slate-50 text-slate-700">
                            {copied ? <Check className="h-4 w-4 mr-2 text-emerald-600" /> : <Copy className="h-4 w-4 mr-2" />}
                            {copied ? "Copied!" : "Copy Text"}
                        </Button>
                        <Button onClick={handleOpenWhatsApp} className="bg-[#25D366] hover:bg-[#128C7E] text-white border-0">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Open WhatsApp
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- LOGIC ENGINE ---

function generateMessage(tone: 'casual' | 'formal' | 'urgent', data: QuoteOfferData): string {
    const { reference, pol, pod, mode, commodity, equipment, totalPrice, currency, validityDate, transitTime } = data;
    
    // 1. Formatting Helpers
    const isAir = mode === 'AIR';
    const icon = isAir ? '✈️' : mode === 'ROAD' ? '🚛' : '🚢';
    const polCity = pol.split('(')[0].trim();
    const podCity = pod.split('(')[0].trim();
    const priceFormatted = totalPrice.toLocaleString('en-US', { maximumFractionDigits: 0 }); // No decimals for chat
    
    const validDateObj = new Date(validityDate);
    const daysLeft = differenceInDays(validDateObj, new Date());
    const validStr = format(validDateObj, 'dd MMM');
    
    // 2. Templates
    if (tone === 'formal') {
        return `Dear Partner,

Please find our best offer below for your reference: ${reference}

*ROUTE:* ${polCity} to ${podCity} ${icon}
*CARGO:* ${commodity}
*DETAILS:* ${equipment}

--------------------------------
*TOTAL: ${priceFormatted} ${currency}* (All-in)
--------------------------------

• Validity: ${validStr}
• Transit Time: approx ${transitTime} days

Looking forward to your confirmation.

Best regards,
Atlas Flow Team`;
    }

    if (tone === 'urgent') {
        return `⚡ *FLASH RATE: ${polCity} -> ${podCity}* ⚡

${icon} Equipment: ${equipment}
📦 Cargo: ${commodity}

💰 *OFFER: ${priceFormatted} ${currency}* !!
⚠️ Valid until: ${validStr} (${daysLeft} days left)

Space is tight! Please confirm ASAP to secure this rate.
Ref: ${reference}`;
    }

    // Default: Casual (The "Deal Closer")
    return `Salam! 👋
Got a great rate for your shipment to ${podCity}.

${icon} *${polCity} ➡️ ${podCity}*
📦 ${equipment} | ${commodity}

🏷️ *Price: ${priceFormatted} ${currency}*
⏱️ Transit: ${transitTime} days

Valid until ${validStr}. Let me know if we book? 🤝`;
}