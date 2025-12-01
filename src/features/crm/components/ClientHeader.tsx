import { ArrowLeft, CheckCircle2, History, MapPin, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientStore } from "@/store/useClientStore";
import { cn } from "@/lib/utils";

interface ClientHeaderProps {
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    onSave: () => void;
    onBack: () => void;
}

export function ClientHeader({ isEditing, setIsEditing, onSave, onBack }: ClientHeaderProps) {
    const { activeClient, updateActiveField } = useClientStore();

    if (!activeClient) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'PROSPECT': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'SUSPENDED': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'BLACKLISTED': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="bg-white border-b border-slate-200 px-8 py-5 shadow-sm sticky top-0 z-20">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 text-slate-400 hover:text-slate-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg text-white font-bold text-xl ring-4 ring-blue-50">
                        {activeClient.entityName ? activeClient.entityName.substring(0, 2).toUpperCase() : '??'}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            {isEditing ? (
                                <Input
                                    value={activeClient.entityName}
                                    onChange={(e) => updateActiveField('entityName', e.target.value)}
                                    className="text-xl font-bold h-9 border-dashed border-slate-300 px-2 w-72 bg-slate-50"
                                    placeholder="Enter Client Name"
                                    autoFocus
                                />
                            ) : (
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{activeClient.entityName}</h1>
                            )}
                            <Badge className={cn("uppercase font-bold tracking-wider rounded-sm text-[10px] shadow-none", getStatusColor(activeClient.status))} variant="outline">
                                {activeClient.status}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5" /> {activeClient.city || 'No City'}, {activeClient.country || 'No Country'}</span>
                            <span className="h-3 w-px bg-slate-300"></span>
                            <span className="flex items-center gap-1.5 text-xs"><Calendar className="h-3.5 w-3.5" /> Since: {new Date(activeClient.created_at).toLocaleDateString()}</span>
                            <span className="h-3 w-px bg-slate-300"></span>
                            <div className="flex items-center gap-1.5 text-xs">
                                <User className="h-3.5 w-3.5" />
                                {isEditing ? (
                                    <Select value={activeClient.salesRepId} onValueChange={(v) => updateActiveField('salesRepId', v)}>
                                        <SelectTrigger className="h-7 w-36 text-xs border-slate-200 bg-slate-50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Youssef (Sales)">Youssef (Sales)</SelectItem>
                                            <SelectItem value="Fatima (Ops)">Fatima (Ops)</SelectItem>
                                            <SelectItem value="Admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span>{activeClient.salesRepId || 'Unassigned'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-800">Cancel</Button>
                            <Button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700 shadow-md text-white">
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm">
                                <History className="h-4 w-4 mr-2" /> Logs
                            </Button>
                            <Button onClick={() => setIsEditing(true)} className="bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                                Edit Profile
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}