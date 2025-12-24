import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, UploadCloud, File, AlertTriangle } from "lucide-react";
import { useClientStore } from "@/store/useClientStore";
import { ClientDocument } from "@/types/index";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function ClientDocuments({ isEditing }: { isEditing: boolean }) {
    const { activeClient, addDocument, removeDocument } = useClientStore();
    
    // Mock Upload
    const handleUpload = () => {
        const newDoc: ClientDocument = {
            id: Math.random().toString(),
            name: `Contract_2024_${new Date().getTime()}.pdf`,
            type: 'CONTRACT',
            size: '2.4 MB',
            uploadDate: new Date(),
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year expiry
            url: '#'
        };
        addDocument(newDoc);
    };

    if (!activeClient) return null;

    const isExpiringSoon = (date?: Date) => {
        if(!date) return false;
        const diffTime = new Date(date).getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays < 30 && diffDays > 0;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="shadow-md border-slate-200 bg-white">
                <CardHeader className="py-4 border-b flex flex-row justify-between items-center bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <CardTitle className="text-sm font-bold text-slate-700">Legal Archive</CardTitle>
                    </div>
                    {isEditing && (
                        <Button size="sm" onClick={handleUpload} className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm">
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
                                <TableHead>Size</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeClient.documents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic">
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
                                            {doc.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-50 shadow-sm">{doc.type}</Badge>
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