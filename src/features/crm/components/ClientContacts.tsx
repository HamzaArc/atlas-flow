import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Users, Trash2 } from "lucide-react";
import { useClientStore } from "@/store/useClientStore";
import { ContactDialog } from "./ContactDialog";

export function ClientContacts({ isEditing }: { isEditing: boolean }) {
    const { activeClient, addContact, removeContact } = useClientStore();

    if (!activeClient) return null;

    return (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-md border-slate-200 bg-white">
            <CardHeader className="py-4 border-b flex flex-row justify-between items-center bg-slate-50/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                    <Users className="h-4 w-4 text-slate-400" /> Stakeholders
                </CardTitle>
                {isEditing && <ContactDialog onSave={addContact} />}
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeClient.contacts.length > 0 ? activeClient.contacts.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell>
                                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100 uppercase shadow-sm">
                                        {c.name ? c.name.charAt(0) : '?'}
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-slate-700 text-sm">{c.name}</TableCell>
                                <TableCell className="text-xs text-slate-500">{c.role}</TableCell>
                                <TableCell className="text-xs text-blue-600 hover:underline cursor-pointer">{c.email}</TableCell>
                                <TableCell className="text-xs text-slate-500 font-mono">{c.phone}</TableCell>
                                <TableCell>
                                    {c.isPrimary && <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] shadow-sm">Primary</Badge>}
                                </TableCell>
                                <TableCell>
                                    {isEditing && (
                                        <Button variant="ghost" size="sm" onClick={() => removeContact(c.id)} className="text-slate-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-slate-400 text-xs h-32 italic">No contacts added yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}