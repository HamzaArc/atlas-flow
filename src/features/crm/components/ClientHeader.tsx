import { useEffect } from "react";
import { ArrowLeft, CheckCircle2, MapPin, User, LayoutDashboard, FilePlus, Ship, Ban, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useClientStore } from "@/store/useClientStore";
import { useUserStore } from "@/store/useUserStore"; // Import User Store
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClientHeaderProps {
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    onSave: () => void;
    onBack: () => void;
}

export function ClientHeader({ isEditing, setIsEditing, onSave, onBack }: ClientHeaderProps) {
    const { activeClient, updateActiveField } = useClientStore();
    const { users, fetchUsers } = useUserStore(); // Hook into User System

    // Load users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    if (!activeClient) return null;

    // --- USER FILTERS ---
    // Sales: Sales Reps, Managers, Directors
    const salesReps = users.filter(u => ['SALES', 'MANAGER', 'DIRECTOR', 'ADMIN'].includes(u.role));
    // Ops: Operations, Managers, Directors
    const opsManagers = users.filter(u => ['OPERATIONS', 'MANAGER', 'DIRECTOR', 'ADMIN'].includes(u.role));

    // Helper to resolve ID to Name
    const getUserName = (id: string | undefined) => {
        if (!id) return 'Unassigned';
        const user = users.find(u => u.id === id);
        return user ? user.fullName : id; // Fallback to ID if not found (or legacy data)
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'PROSPECT': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'SUSPENDED': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'BLACKLISTED': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    // Financial Health Calculation
    const totalExposure = (activeClient.unpaidInvoices || 0) + (activeClient.unbilledWork || 0);
    const utilization = activeClient.creditLimit > 0 ? (totalExposure / activeClient.creditLimit) : 0;
    
    let healthColor = "bg-emerald-500"; 
    let healthText = "Healthy";
    if (activeClient.status === 'BLACKLISTED') { healthColor = "bg-slate-900"; healthText = "Blacklisted"; }
    else if (utilization > 1) { healthColor = "bg-red-500"; healthText = "Credit Exceeded"; }
    else if (utilization > 0.8) { healthColor = "bg-amber-500"; healthText = "Near Limit"; }

    return (
        <div className="bg-white border-b border-slate-200 px-8 py-5 shadow-sm sticky top-0 z-20">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="mr-2 text-slate-400 hover:text-slate-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="relative">
                        <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg text-white font-bold text-xl ring-4 ring-blue-50">
                            {activeClient.entityName ? activeClient.entityName.substring(0, 2).toUpperCase() : '??'}
                        </div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white", healthColor)} />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-bold">{healthText}</p>
                                    <p className="text-xs">Exposure: {Math.round(utilization * 100)}%</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
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
                            
                            {/* Ownership Split */}
                            <div className="flex items-center gap-4">
                                
                                {/* 1. SALES REP SELECTOR */}
                                <div className="flex items-center gap-1.5 text-xs" title="Sales Owner">
                                    <User className="h-3.5 w-3.5 text-blue-500" />
                                    {isEditing ? (
                                        <Select value={activeClient.salesRepId} onValueChange={(v) => updateActiveField('salesRepId', v)}>
                                            <SelectTrigger className="h-6 w-36 text-xs border-slate-200 bg-slate-50"><SelectValue placeholder="Select Sales Rep" /></SelectTrigger>
                                            <SelectContent>
                                                {salesReps.map(user => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.fullName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="font-medium text-slate-700">
                                            {getUserName(activeClient.salesRepId)}
                                        </span>
                                    )}
                                </div>

                                {/* 2. OPS KAM SELECTOR */}
                                <div className="flex items-center gap-1.5 text-xs" title="Operational KAM">
                                    <Ship className="h-3.5 w-3.5 text-slate-400" />
                                    {isEditing ? (
                                        <Select value={activeClient.opsManagerId || ''} onValueChange={(v) => updateActiveField('opsManagerId', v)}>
                                            <SelectTrigger className="h-6 w-36 text-xs border-slate-200 bg-slate-50"><SelectValue placeholder="Select Ops KAM" /></SelectTrigger>
                                            <SelectContent>
                                                {opsManagers.map(user => (
                                                    <SelectItem key={user.id} value={user.id}>
                                                        {user.fullName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="font-medium text-slate-700">
                                            {getUserName(activeClient.opsManagerId)}
                                        </span>
                                    )}
                                </div>
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm">
                                        Actions
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Operational</DropdownMenuLabel>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <FilePlus className="mr-2 h-4 w-4" /> New Quote
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <Ship className="mr-2 h-4 w-4" /> New Booking
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Financial</DropdownMenuLabel>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <LayoutDashboard className="mr-2 h-4 w-4" /> Account Statement
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 cursor-pointer focus:bg-red-50">
                                        <Ban className="mr-2 h-4 w-4" /> Block Client
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button onClick={() => setIsEditing(true)} className="bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                                Edit Profile
                            </Button>
                        </>
                    )}
                </div>
            </div>
            
            {/* Alert Banner for Blacklisted/Suspended */}
            {(activeClient.status === 'BLACKLISTED' || activeClient.status === 'SUSPENDED') && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-red-800">Operational Hold Active</h4>
                        <p className="text-xs text-red-700 mt-0.5">
                            Reason: {activeClient.blacklistReason || 'Administrative Block'}. Do not accept new bookings without CFO approval.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}