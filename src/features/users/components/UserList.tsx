import { CompanyUser } from "@/types/index";
import { MoreHorizontal, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface UserListProps {
    users: CompanyUser[];
    onEdit: (user: CompanyUser) => void;
    onDelete: (id: string) => void;
}

export function UserList({ users, onEdit, onDelete }: UserListProps) {
    
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

    if (users.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">
                <p>No users found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[300px]">User</TableHead>
                        <TableHead>Role & Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id} className="hover:bg-slate-50/50">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-slate-200">
                                        <AvatarImage src={user.avatarUrl} />
                                        <AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-xs">
                                            {getInitials(user.fullName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm text-slate-900">{user.fullName}</span>
                                        <span className="text-xs text-slate-500">{user.email}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-slate-700 flex items-center gap-2">
                                        {user.role}
                                        {user.role === 'ADMIN' && <Shield className="h-3 w-3 text-purple-500" />}
                                    </span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">{user.department}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={`
                                    ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                    ${user.status === 'INVITED' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                    ${user.status === 'INACTIVE' ? 'bg-slate-100 text-slate-600 border-slate-200' : ''}
                                `}>
                                    {user.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="text-xs text-slate-500 font-mono">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onEdit(user)}>Edit Profile</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => window.location.href = `mailto:${user.email}`}>
                                            <Mail className="h-3 w-3 mr-2" /> Email User
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(user.id)}>
                                            Delete User
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}