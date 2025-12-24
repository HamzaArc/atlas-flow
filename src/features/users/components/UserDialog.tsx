import { useEffect, useState } from 'react';
import { CompanyUser, CompanyRole, UserDepartment, UserStatus } from '@/types/index';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface UserDialogProps {
    user: CompanyUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (user: CompanyUser) => void;
}

export function UserDialog({ user, open, onOpenChange, onSave }: UserDialogProps) {
    const [formData, setFormData] = useState<CompanyUser | null>(null);

    useEffect(() => {
        if (user) setFormData({ ...user });
    }, [user]);

    if (!formData) return null;

    const isInvite = user?.id.startsWith('new');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>{isInvite ? 'Invite New Team Member' : 'Edit User Profile'}</DialogTitle>
                    <DialogDescription>
                        {isInvite 
                            ? "Send an invitation to a new employee. They will receive an email to set up their account."
                            : "Update user details, roles, and access permissions."
                        }
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    
                    {/* PERSONAL INFO */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identity</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label>Full Name <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.fullName} 
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                                    placeholder="e.g. Sara Idrissi" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.email} 
                                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                    placeholder="name@company.com" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone (Optional)</Label>
                                <Input 
                                    value={formData.phone || ''} 
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                                    placeholder="+212 6..." 
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* ROLE & ACCESS */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Control</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select 
                                    value={formData.department} 
                                    onValueChange={(v: UserDepartment) => setFormData({...formData, department: v})}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COMMERCIAL">Commercial / Sales</SelectItem>
                                        <SelectItem value="OPERATIONS">Operations / Logistics</SelectItem>
                                        <SelectItem value="FINANCE">Finance & Accounting</SelectItem>
                                        <SelectItem value="MANAGEMENT">Management</SelectItem>
                                        <SelectItem value="IT">IT / Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Job Title</Label>
                                <Input 
                                    value={formData.jobTitle || ''} 
                                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} 
                                    placeholder="e.g. Sales Executive" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>System Role</Label>
                                <Select 
                                    value={formData.role} 
                                    onValueChange={(v: CompanyRole) => setFormData({...formData, role: v})}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SALES">Sales Rep (Restricted)</SelectItem>
                                        <SelectItem value="OPERATIONS">Ops Manager (Standard)</SelectItem>
                                        <SelectItem value="FINANCE">Finance Officer</SelectItem>
                                        <SelectItem value="MANAGER">Team Manager</SelectItem>
                                        <SelectItem value="DIRECTOR">Director (Full Access)</SelectItem>
                                        <SelectItem value="ADMIN">System Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Account Status</Label>
                                <Select 
                                    value={formData.status} 
                                    onValueChange={(v: UserStatus) => setFormData({...formData, status: v})}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INVITED">Invited (Pending)</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onSave(formData)} className="min-w-[120px]">
                        {isInvite ? 'Send Invite' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}