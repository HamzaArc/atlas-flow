import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Pencil } from "lucide-react";
import { ClientContact } from "@/types/index";

interface ContactDialogProps {
    onSave: (contact: ClientContact) => void;
    contactToEdit?: ClientContact;
}

export function ContactDialog({ onSave, contactToEdit }: ContactDialogProps) {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<Partial<ClientContact>>({
        name: '', role: '', email: '', phone: '', isPrimary: false
    });

    useEffect(() => {
        if (contactToEdit && open) {
            setData(contactToEdit);
        } else if (!open && !contactToEdit) {
            // Reset on close if not in edit mode
            setData({ name: '', role: '', email: '', phone: '', isPrimary: false });
        }
    }, [contactToEdit, open]);

    const handleSubmit = () => {
        if (!data.name || !data.email) return;
        
        onSave({
            id: contactToEdit?.id || Math.random().toString(36).substr(2, 9),
            name: data.name,
            role: data.role || 'N/A',
            email: data.email,
            phone: data.phone || '',
            isPrimary: data.isPrimary || false
        });
        
        setOpen(false);
        if (!contactToEdit) {
            setData({ name: '', role: '', email: '', phone: '', isPrimary: false });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {contactToEdit ? (
                     <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600">
                        <Pencil className="h-4 w-4" />
                     </Button>
                ) : (
                    <Button size="sm" variant="outline" className="h-8 text-xs border-dashed border-slate-300">
                        <UserPlus className="h-3 w-3 mr-2" /> Add Contact
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{contactToEdit ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Name</Label>
                        <Input value={data.name} onChange={e => setData({...data, name: e.target.value})} className="col-span-3 h-8 text-sm" placeholder="John Doe" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Role</Label>
                        <Input value={data.role} onChange={e => setData({...data, role: e.target.value})} className="col-span-3 h-8 text-sm" placeholder="Logistics Manager" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Email</Label>
                        <Input value={data.email} onChange={e => setData({...data, email: e.target.value})} className="col-span-3 h-8 text-sm" placeholder="email@company.com" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Phone</Label>
                        <Input value={data.phone} onChange={e => setData({...data, phone: e.target.value})} className="col-span-3 h-8 text-sm" placeholder="+212..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Primary</Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Switch checked={data.isPrimary} onCheckedChange={c => setData({...data, isPrimary: c})} />
                            <span className="text-[10px] text-slate-500">Main point of contact</span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} className="bg-slate-900 text-white hover:bg-slate-800">
                        {contactToEdit ? 'Update Contact' : 'Save Contact'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}