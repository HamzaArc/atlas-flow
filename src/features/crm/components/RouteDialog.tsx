import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { ClientRoute } from "@/store/useClientStore";

interface RouteDialogProps {
    onSave: (route: ClientRoute) => void;
}

export function RouteDialog({ onSave }: RouteDialogProps) {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<Partial<ClientRoute>>({
        origin: '', destination: '', mode: 'SEA', volume: ''
    });

    const handleSubmit = () => {
        if (!data.origin || !data.destination) return;
        
        onSave({
            id: Math.random().toString(36).substr(2, 9),
            origin: data.origin.toUpperCase(),
            destination: data.destination.toUpperCase(),
            mode: data.mode as any,
            volume: data.volume || 'N/A'
        });
        setOpen(false);
        setData({ origin: '', destination: '', mode: 'SEA', volume: '' });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs border-dashed border-slate-300">
                    <MapPin className="h-3 w-3 mr-2" /> Add Route
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Preferred Route</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Origin</Label>
                            <Input value={data.origin} onChange={e => setData({...data, origin: e.target.value})} className="h-8 text-sm" placeholder="CASABLANCA" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Destination</Label>
                            <Input value={data.destination} onChange={e => setData({...data, destination: e.target.value})} className="h-8 text-sm" placeholder="SHANGHAI" />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Mode</Label>
                        <Select value={data.mode} onValueChange={(v: any) => setData({...data, mode: v})}>
                            <SelectTrigger className="col-span-3 h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SEA">Sea Freight</SelectItem>
                                <SelectItem value="AIR">Air Freight</SelectItem>
                                <SelectItem value="ROAD">Road Freight</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Vol / Freq</Label>
                        <Input value={data.volume} onChange={e => setData({...data, volume: e.target.value})} className="col-span-3 h-8 text-sm" placeholder="e.g. 50 TEU / Year" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} className="bg-slate-900 text-white hover:bg-slate-800">Add Route</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}