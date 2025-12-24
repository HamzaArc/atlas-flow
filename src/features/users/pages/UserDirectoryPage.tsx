import { useEffect, useState } from 'react';
import { useUserStore } from "@/store/useUserStore";
import { Plus, Search, LayoutGrid, List as ListIcon, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Sub-components
import { UserStats } from "../components/UserStats";
import { UserGrid } from "../components/UserGrid";
import { UserList } from "../components/UserList";
import { UserDialog } from "../components/UserDialog";

export default function UserDirectoryPage() {
    const { users, fetchUsers, isLoading, createNewUser, activeUser, setActiveUser, saveUser, deleteUser } = useUserStore();
    
    // UI State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    // Filter State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [deptFilter, setDeptFilter] = useState<string>('ALL');

    useEffect(() => {
        fetchUsers();
    }, []);

    // Advanced Filtering Logic
    const filteredUsers = users.filter(u => {
        const matchesSearch = 
            u.fullName.toLowerCase().includes(search.toLowerCase()) || 
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.jobTitle?.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
        const matchesDept = deptFilter === 'ALL' || u.department === deptFilter;

        return matchesSearch && matchesStatus && matchesDept;
    });

    return (
        <div className="flex flex-col h-full bg-slate-50/50 overflow-hidden">
            {/* DIALOG MANAGER */}
            <UserDialog 
                open={!!activeUser} 
                onOpenChange={(open) => !open && setActiveUser(null)}
                user={activeUser}
                onSave={saveUser}
            />

            {/* HEADER SECTION */}
            <div className="px-8 py-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage system access, roles, and organizational structure.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={createNewUser} className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all h-9 px-4">
                        <Plus className="h-4 w-4 mr-2" /> Invite User
                    </Button>
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-8">
                
                {/* 1. ANALYTICS */}
                <UserStats users={users} />

                {/* 2. CONTROLS TOOLBAR */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center mb-6">
                    
                    {/* LEFT: Search & Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-[300px]">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search by name, email or role..." 
                                className="pl-9 bg-white border-slate-200"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        
                        <Select value={deptFilter} onValueChange={setDeptFilter}>
                            <SelectTrigger className="w-[180px] bg-white border-slate-200">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Filter className="h-3.5 w-3.5" />
                                    <SelectValue placeholder="Department" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Departments</SelectItem>
                                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                                <SelectItem value="OPERATIONS">Operations</SelectItem>
                                <SelectItem value="FINANCE">Finance</SelectItem>
                                <SelectItem value="MANAGEMENT">Management</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* RIGHT: View & Status Tabs */}
                    <div className="flex items-center gap-4">
                        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
                            <TabsList className="bg-white border border-slate-200 h-9 p-0.5">
                                <TabsTrigger value="ALL" className="text-xs px-3 h-8 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">All</TabsTrigger>
                                <TabsTrigger value="ACTIVE" className="text-xs px-3 h-8 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">Active</TabsTrigger>
                                <TabsTrigger value="INVITED" className="text-xs px-3 h-8 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">Pending</TabsTrigger>
                                <TabsTrigger value="INACTIVE" className="text-xs px-3 h-8 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-500">Inactive</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Separator orientation="vertical" className="h-6" />

                        <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setViewMode('grid')}
                                className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setViewMode('list')}
                                className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <ListIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 3. DATA VIEW */}
                {isLoading ? (
                    <div className="text-center py-20 text-slate-400">Loading directory...</div>
                ) : (
                    viewMode === 'grid' 
                        ? <UserGrid users={filteredUsers} onEdit={setActiveUser} onDelete={deleteUser} />
                        : <UserList users={filteredUsers} onEdit={setActiveUser} onDelete={deleteUser} />
                )}
            </div>
        </div>
    );
}