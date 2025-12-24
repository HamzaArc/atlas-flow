import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { ClientRoute } from "@/types/index"; // FIXED IMPORT

interface RouteDialogProps {
    onSave: (route: ClientRoute) => void;
}

export function RouteDialog({ onSave }: RouteDialogProps) {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<Partial<ClientRoute>>({
        origin: '', destination: '', mode: 'SEA', 
        incoterm: 'FOB', equipment: '40HC', 
        volume: 0, volumeUnit: 'TEU', frequency: 'MONTHLY'
    });

    const handleSubmit = () => {
        if (!data.origin || !data.destination) return;
        
        onSave({
            id: Math.random().toString(36).substr(2, 9),
            origin: data.origin.toUpperCase(),
            destination: data.destination.toUpperCase(),
            mode: data.mode as any,
            incoterm: data.incoterm as any,
            equipment: data.equipment as any,
            volume: Number(data.volume) || 0,
            volumeUnit: data.volumeUnit as any,
            frequency: data.frequency as any
        });
        setOpen(false);
        setData({ 
            origin: '', destination: '', mode: 'SEA', 
            incoterm: 'FOB', equipment: '40HC', 
            volume: 0, volumeUnit: 'TEU', frequency: 'MONTHLY' 
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs border-dashed border-slate-300">
                    <MapPin className="h-3 w-3 mr-2" /> Add Trade Lane
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Trade Lane</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* LOCATIONS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Origin (POL)</Label>
                            <Input value={data.origin} onChange={e => setData({...data, origin: e.target.value})} className="h-9 text-sm font-mono" placeholder="CASABLANCA" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Destination (POD)</Label>
                            <Input value={data.destination} onChange={e => setData({...data, destination: e.target.value})} className="h-9 text-sm font-mono" placeholder="SHANGHAI" />
                        </div>
                    </div>

                    {/* SPECS ROW 1 */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Mode</Label>
                            <Select value={data.mode} onValueChange={(v: any) => setData({...data, mode: v})}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SEA">Sea Freight</SelectItem>
                                    <SelectItem value="AIR">Air Freight</SelectItem>
                                    <SelectItem value="ROAD">Road Freight</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Incoterm</Label>
                            <Select value={data.incoterm} onValueChange={(v: any) => setData({...data, incoterm: v})}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXW">EXW - Ex Works</SelectItem>
                                    <SelectItem value="FOB">FOB - Free On Board</SelectItem>
                                    <SelectItem value="CIF">CIF - Cost Ins Frt</SelectItem>
                                    <SelectItem value="DAP">DAP - Delivered</SelectItem>
                                    <SelectItem value="DDP">DDP - Duty Paid</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Equipment</Label>
                            <Select value={data.equipment} onValueChange={(v: any) => setData({...data, equipment: v})}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="20DV">20' Standard</SelectItem>
                                    <SelectItem value="40HC">40' High Cube</SelectItem>
                                    <SelectItem value="LCL">LCL / Loose</SelectItem>
                                    <SelectItem value="AIR">Air Console</SelectItem>
                                    <SelectItem value="FTL">Full Truck</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* SPECS ROW 2 */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Forecast Vol.</Label>
                            <Input type="number" value={data.volume} onChange={e => setData({...data, volume: parseFloat(e.target.value)})} className="h-9 text-sm" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Unit</Label>
                            <Select value={data.volumeUnit} onValueChange={(v: any) => setData({...data, volumeUnit: v})}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TEU">TEU (Containers)</SelectItem>
                                    <SelectItem value="KG">Kilograms</SelectItem>
                                    <SelectItem value="TRK">Trucks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500">Frequency</Label>
                            <Select value={data.frequency} onValueChange={(v: any) => setData({...data, frequency: v})}>
                                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                    <SelectItem value="ADHOC">Ad-hoc</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} className="bg-slate-900 text-white hover:bg-slate-800">Save Lane</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}