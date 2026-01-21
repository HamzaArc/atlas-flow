import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, UploadCloud, File, AlertTriangle} from "lucide-react";
import { useClientStore } from "@/store/useClientStore";
import { ClientDocument } from "@/types/index";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ClientDocuments({ isEditing }: { isEditing: boolean }) {
    const { activeClient, addDocument, removeDocument } = useClientStore();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    
    // Upload State
    const [newDoc, setNewDoc] = useState<{
        file: File | null,
        type: string,
        expiryDate: string,
        description: string
    }>({
        file: null,
        type: 'CONTRACT',
        expiryDate: '',
        description: ''
    });

    if (!activeClient) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewDoc({ ...newDoc, file: e.target.files[0] });
        }
    };

    const handleSaveDocument = () => {
        if (!newDoc.file) return;

        // In a real app, this is where we upload to Supabase Storage
        // For now, we simulate the return object
        const docEntry: ClientDocument = {
            id: Math.random().toString(36).substr(2, 9),
            name: newDoc.file.name,
            type: newDoc.type as any,
            size: `${(newDoc.file.size / 1024 / 1024).toFixed(2)} MB`,
            uploadDate: new Date(),
            expiryDate: newDoc.expiryDate ? new Date(newDoc.expiryDate) : undefined,
            url: '#', // Placeholder for Storage URL
            description: newDoc.description
        };

        addDocument(docEntry);
        setIsUploadOpen(false);
        setNewDoc({ file: null, type: 'CONTRACT', expiryDate: '', description: '' });
    };

    const isExpiringSoon = (date?: Date) => {
        if(!date) return false;
        const diffTime = new Date(date).getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays < 30 && diffDays > 0;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* UPLOAD DIALOG */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-blue-600" /> Upload Document
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                {newDoc.file ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-8 w-8 text-blue-500" />
                                        <p className="text-sm text-slate-700 font-medium">{newDoc.file.name}</p>
                                        <Button variant="link" size="sm" className="h-auto p-0 text-red-500" onClick={(e) => { e.preventDefault(); setNewDoc({...newDoc, file: null}) }}>Remove</Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                                        <p className="text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-slate-500">PDF, JPG, PNG (MAX. 10MB)</p>
                                    </div>
                                )}
                                <input id="dropzone-file" type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.png,.jpeg" />
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Document Type</Label>
                                <Select value={newDoc.type} onValueChange={(v) => setNewDoc({...newDoc, type: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CONTRACT">Contract / Agreement</SelectItem>
                                        <SelectItem value="KYC">KYC / Legal ID</SelectItem>
                                        <SelectItem value="NDA">NDA</SelectItem>
                                        <SelectItem value="POWER_OF_ATTORNEY">Power of Attorney</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Expiry Date (Optional)</Label>
                                <Input type="date" value={newDoc.expiryDate} onChange={(e) => setNewDoc({...newDoc, expiryDate: e.target.value})} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description / Notes</Label>
                            <Textarea 
                                placeholder="Brief description of the document..." 
                                className="resize-none" 
                                value={newDoc.description}
                                onChange={(e) => setNewDoc({...newDoc, description: e.target.value})}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveDocument} disabled={!newDoc.file}>Save Document</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="shadow-md border-slate-200 bg-white">
                <CardHeader className="py-4 border-b flex flex-row justify-between items-center bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <CardTitle className="text-sm font-bold text-slate-700">Legal Archive</CardTitle>
                    </div>
                    {isEditing && (
                        <Button size="sm" onClick={() => setIsUploadOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm">
                            <UploadCloud className="h-4 w-4 mr-2" /> Upload New
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-[300px]">Filename</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeClient.documents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
                                        No documents archived.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                activeClient.documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded shadow-sm">
                                                <File className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-700">{doc.name}</span>
                                                <span className="text-[10px] text-slate-400">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-50 shadow-sm">{doc.type}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-xs text-slate-500">
                                            {doc.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs">{doc.size}</TableCell>
                                        <TableCell className="text-slate-500 text-xs">
                                            {doc.expiryDate ? (
                                                <div className={`flex items-center gap-1 ${isExpiringSoon(doc.expiryDate) ? 'text-amber-600 font-bold' : ''}`}>
                                                    {isExpiringSoon(doc.expiryDate) && <AlertTriangle className="h-3 w-3" />}
                                                    {new Date(doc.expiryDate).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                {isEditing && (
                                                    <Button variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} className="h-8 w-8 text-slate-400 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}