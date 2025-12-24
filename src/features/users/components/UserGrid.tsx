import { CompanyUser } from "@/types/index";
import { Mail, Briefcase, MoreHorizontal, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface UserGridProps {
    users: CompanyUser[];
    onEdit: (user: CompanyUser) => void;
    onDelete: (id: string) => void;
}

export function UserGrid({ users, onEdit, onDelete }: UserGridProps) {
    
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

    const getRoleColor = (role: string) => {
        switch(role) {
            case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'DIRECTOR': return 'bg-slate-800 text-white border-slate-700';
            case 'MANAGER': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'SALES': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'OPERATIONS': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'FINANCE': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">
                <Briefcase className="h-10 w-10 mb-2 opacity-20" />
                <p>No users found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {users.map(user => (
                <Card key={user.id} className="group hover:shadow-md transition-all border-slate-200 bg-white overflow-hidden relative">
                    {/* Status Indicator Strip */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                        user.status === 'ACTIVE' ? 'bg-emerald-500' : 
                        user.status === 'INVITED' ? 'bg-amber-400' : 'bg-slate-300'
                    }`}></div>

                    <CardContent className="p-5 pl-6">
                        <div className="flex justify-between items-start mb-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback className="bg-slate-50 text-slate-600 font-bold text-sm">
                                    {getInitials(user.fullName)}
                                </AvatarFallback>
                            </Avatar>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400 group-hover:text-slate-600">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => onEdit(user)}>Edit Profile</DropdownMenuItem>
                                    <DropdownMenuItem>Reset Password</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600" onClick={() => onDelete(user.id)}>
                                        {user.status === 'ACTIVE' ? 'Deactivate User' : 'Delete User'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <div className="mb-4">
                            <h3 className="font-bold text-slate-900 truncate text-base">{user.fullName}</h3>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-1.5 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-medium border ${getRoleColor(user.role)}`}>
                                    {user.role}
                                </Badge>
                                <span className="truncate text-slate-400 max-w-[120px]" title={user.jobTitle}>{user.jobTitle}</span>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-500 pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-2.5">
                                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="truncate hover:text-blue-600 transition-colors cursor-pointer">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="capitalize">{user.department.toLowerCase()} Dept.</span>
                            </div>
                        </div>

                        {user.status === 'INVITED' && (
                            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-medium text-amber-700 bg-amber-50 py-1.5 rounded border border-amber-100">
                                <Clock className="h-3 w-3" /> Pending Acceptance
                            </div>
                        )}
                        {user.status === 'INACTIVE' && (
                            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-500 bg-slate-100 py-1.5 rounded border border-slate-200">
                                <Shield className="h-3 w-3" /> Account Suspended
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}