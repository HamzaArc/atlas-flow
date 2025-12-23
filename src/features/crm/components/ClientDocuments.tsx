import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, UploadCloud, File, Calendar } from "lucide-react";
import { useClientStore } from "@/store/useClientStore";
import { ClientDocument } from "@/types/index"; // FIXED IMPORT
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function ClientDocuments({ isEditing }: { isEditing: boolean }) {
    const { activeClient, addDocument, removeDocument } = useClientStore();
    
    // Mock Upload Function
    const handleUpload = () => {
        const newDoc: ClientDocument = {
            id: Math.random().toString(),
            name: `Uploaded_Document_${new Date().getTime()}.pdf`,
            type: 'OTHER',
            size: '1.2 MB',
            uploadDate: new Date(),
            url: '#'
        };
        addDocument(newDoc);
    };

    if (!activeClient) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="shadow-md border-slate-200 bg-white">
                <CardHeader className="py-4 border-b flex flex-row justify-between items-center bg-slate-50/30">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <CardTitle className="text-sm font-bold text-slate-700">Digital Archive</CardTitle>
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
                                <TableHead>Upload Date</TableHead>
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
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(doc.uploadDate).toLocaleDateString()}
                                            </div>
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