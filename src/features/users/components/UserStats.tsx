import { CompanyUser } from "@/types/index";
import { Users, UserCheck, UserPlus, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function UserStats({ users }: { users: CompanyUser[] }) {
    
    const total = users.length;
    const active = users.filter(u => u.status === 'ACTIVE').length;
    const pending = users.filter(u => u.status === 'INVITED').length;
    // Calculate admin/management count
    const admins = users.filter(u => ['ADMIN', 'DIRECTOR', 'MANAGER'].includes(u.role)).length;

    const StatCard = ({ label, value, icon: Icon, colorClass, subtext }: any) => (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{label}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-bold text-slate-900">{value}</span>
                        {subtext && <span className="text-xs text-slate-400 font-medium">{subtext}</span>}
                    </div>
                </div>
                <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <StatCard 
                label="Total Users" 
                value={total} 
                icon={Users} 
                colorClass="bg-blue-50 text-blue-600" 
            />
            <StatCard 
                label="Active Access" 
                value={active} 
                subtext={`of ${total}`}
                icon={UserCheck} 
                colorClass="bg-emerald-50 text-emerald-600" 
            />
            <StatCard 
                label="Pending Invites" 
                value={pending} 
                icon={UserPlus} 
                colorClass="bg-amber-50 text-amber-600" 
            />
            <StatCard 
                label="Admin & Management" 
                value={admins} 
                icon={ShieldAlert} 
                colorClass="bg-purple-50 text-purple-600" 
            />
        </div>
    );
}