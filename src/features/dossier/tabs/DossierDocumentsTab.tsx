import { useState } from 'react';
import { 
  FileText, Upload, Download, Eye, Trash2, 
  CheckCircle2, AlertCircle, File
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientDocument } from "@/types/index";

// Mock Checklist
const REQUIRED_DOCS = [
  { key: 'MBL', label: 'Master Bill of Lading' },
  { key: 'INV', label: 'Commercial Invoice' },
  { key: 'PL', label: 'Packing List' }
];

export const DossierDocumentsTab = () => {
  const { dossier, updateDossier } = useDossierStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', type: 'OTHER' });

  // Use generic 'documents' array (typed as any[] or ClientDocument[] in actual store depending on strictness)
  // For now assuming dossier has documents[] or we use a fallback
  const documents = (dossier as any).documents || [];

  const handleUpload = () => {
    const newDoc = {
       id: Math.random().toString(36),
       name: uploadForm.name || 'Untitled',
       type: uploadForm.type,
       uploadDate: new Date(),
       size: '1.2 MB', // Mock
       url: '#'
    };
    updateDossier('documents' as any, [...documents, newDoc]);
    setIsUploadOpen(false);
    setUploadForm({ name: '', type: 'OTHER' });
  };

  const deleteDoc = (id: string) => {
     updateDossier('documents' as any, documents.filter((d: any) => d.id !== id));
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 pb-24 space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         
         {/* Left: Upload & Compliance */}
         <div className="space-y-6">
            <div 
               onClick={() => setIsUploadOpen(true)}
               className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors group"
            >
               <div className="bg-white p-3 rounded-full shadow-sm mb-3 text-blue-600 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
               </div>
               <div className="font-bold text-slate-900 text-sm">Upload Documents</div>
               <div className="text-xs text-slate-500 mt-1">Drag & drop or click to browse</div>
            </div>

            <Card className="overflow-hidden">
               <div className="bg-slate-50 p-3 border-b border-slate-100 font-bold text-xs uppercase text-slate-500">
                  Required Documents
               </div>
               <div className="divide-y divide-slate-100">
                  {REQUIRED_DOCS.map(req => {
                     const exists = documents.some((d: any) => d.type === req.key || d.name.includes(req.label));
                     return (
                        <div key={req.key} className="p-3 flex items-center justify-between">
                           <span className={`text-xs font-medium ${exists ? 'text-slate-700' : 'text-slate-400'}`}>
                              {req.label}
                           </span>
                           {exists ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                           ) : (
                              <Badge variant="outline" className="text-[10px] border-red-200 bg-red-50 text-red-600">Missing</Badge>
                           )}
                        </div>
                     );
                  })}
               </div>
            </Card>
         </div>

         {/* Right: File List */}
         <div className="lg:col-span-3">
            <Card className="min-h-[500px]">
               <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">File Repository</h3>
                  <Badge variant="secondary">{documents.length} Files</Badge>
               </div>
               
               <div className="divide-y divide-slate-100">
                  {documents.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <FileText className="h-12 w-12 mb-3 opacity-20" />
                        <p>No documents uploaded yet.</p>
                     </div>
                  ) : (
                     documents.map((doc: any) => (
                        <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center border border-red-100">
                                 <File className="h-5 w-5" />
                              </div>
                              <div>
                                 <div className="font-bold text-sm text-slate-900">{doc.name}</div>
                                 <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <span>{doc.type}</span>
                                    <span>•</span>
                                    <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600"><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900"><Download className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => deleteDoc(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </Card>
         </div>

      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
         <DialogContent>
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
               <div>
                  <Label>Document Name</Label>
                  <Input value={uploadForm.name} onChange={e => setUploadForm({...uploadForm, name: e.target.value})} placeholder="e.g. Master Bill of Lading" />
               </div>
               <div>
                  <Label>Type</Label>
                  <Select value={uploadForm.type} onValueChange={v => setUploadForm({...uploadForm, type: v})}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="MBL">MBL</SelectItem>
                        <SelectItem value="INV">Invoice</SelectItem>
                        <SelectItem value="PL">Packing List</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
            <DialogFooter>
               <Button variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
               <Button onClick={handleUpload}>Upload</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  );
};