import { useState } from 'react';
import { 
  FileText, UploadCloud, Download, Eye, Trash2, 
  Check, Search, Shield, Share2
} from "lucide-react";
import { useDossierStore } from "@/store/useDossierStore";
import { DocStatus, Document } from "@/types/index";

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const COMPLIANCE_CHECKLIST = [
  { id: 'req1', label: 'Booking Confirmation', key: 'Booking' },
  { id: 'req2', label: 'Master Bill of Lading', key: 'MBL' },
  { id: 'req3', label: 'Commercial Invoice', key: 'Invoice' },
  { id: 'req4', label: 'Packing List', key: 'PL' },
  { id: 'req5', label: 'Customs Declaration', key: 'Customs' },
];

export const DossierDocumentsTab = () => {
  const { dossier, uploadFile, updateFile, deleteFile } = useDossierStore();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Partial<Document> | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Grouping logic
  const categories = ['All', 'Shipping', 'Customs', 'Financial'];
  
  const getCategory = (type: string) => {
    if (['MBL', 'HBL', 'Booking', 'PL'].includes(type)) return 'Shipping';
    if (['Invoice', 'Debit Note'].includes(type)) return 'Financial';
    return 'Customs';
  };

  const documents = dossier.documents || [];

  const filteredDocs = documents.filter(d => {
    const matchesCategory = activeCategory === 'All' || getCategory(d.type) === activeCategory;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Compliance Logic
  const complianceStatus = COMPLIANCE_CHECKLIST.map(item => {
    const doc = documents.find(d => d.type === item.key || d.name.includes(item.label));
    const isMissing = !doc || doc.status === DocStatus.MISSING;
    return { ...item, isMissing, doc };
  });

  const missingCount = complianceStatus.filter(c => c.isMissing).length;

  const handleOpenAdd = () => {
    setEditingDoc({ 
      name: '', 
      type: 'Other', 
      status: DocStatus.RECEIVED, 
      isInternal: false,
      updatedAt: new Date()
    });
    setSelectedFile(null); // Reset file
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: Document) => {
    setEditingDoc({ ...doc });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingDoc || !editingDoc.type) return;

    if (editingDoc.id) {
      // Edit existing (Metadata update)
      await updateFile(editingDoc.id, {
          name: editingDoc.name,
          type: editingDoc.type,
          status: editingDoc.status as DocStatus,
          isInternal: editingDoc.isInternal
      });
    } else {
      // Add new (Upload)
      if (!selectedFile) {
          alert("Please select a file to upload.");
          return;
      }
      await uploadFile(
          selectedFile, 
          editingDoc.type, 
          editingDoc.isInternal || false,
          editingDoc.name // Use the custom name input if provided
      );
    }
    setIsModalOpen(false);
    setEditingDoc(null);
    setSelectedFile(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteFile(id);
    }
  };

  const handleToggleShare = async (doc: Document) => {
    await updateFile(doc.id, { isInternal: !doc.isInternal });
  };

  const handleDownload = (doc: Document) => {
    // Open the Supabase URL in a new tab
    if (doc.url) {
        window.open(doc.url, '_blank');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      [DocStatus.MISSING]: 'bg-red-50 text-red-700 border-red-100',
      [DocStatus.REQUESTED]: 'bg-orange-50 text-orange-700 border-orange-100',
      [DocStatus.RECEIVED]: 'bg-blue-50 text-blue-700 border-blue-100',
      [DocStatus.ISSUED]: 'bg-purple-50 text-purple-700 border-purple-100',
      [DocStatus.APPROVED]: 'bg-green-50 text-green-700 border-green-100',
    };
    return (
      <Badge variant="outline" className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles[DocStatus.RECEIVED]}`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-12 space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar: Categories & Upload */}
        <div className="space-y-6">
           <div 
             onClick={handleOpenAdd}
             className={`
               border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center 
               transition-all cursor-pointer group hover:bg-blue-100 hover:border-blue-300
             `}
           >
              <div className="bg-white p-3 rounded-xl shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud size={24} className="text-blue-600" />
              </div>
              <p className="text-sm font-bold text-gray-900">Upload Documents</p>
              <p className="text-xs text-gray-500 mt-1 px-4">Click to browse or drag & drop</p>
           </div>

           {/* Compliance Checklist */}
           <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Required Docs</h4>
                 {missingCount > 0 && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{missingCount} Missing</span>}
              </div>
              <div className="divide-y divide-gray-50">
                 {complianceStatus.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className={`
                             w-5 h-5 rounded-full flex items-center justify-center text-[10px] border
                             ${item.isMissing 
                                ? 'bg-white border-gray-300 text-gray-300' 
                                : 'bg-green-500 border-green-500 text-white'}
                          `}>
                             {item.isMissing ? '' : <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className={`text-xs font-medium ${item.isMissing ? 'text-gray-600' : 'text-gray-400 line-through'}`}>
                             {item.label}
                          </span>
                       </div>
                       {item.isMissing && (
                          <button onClick={handleOpenAdd} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity">
                             Upload
                          </button>
                       )}
                    </div>
                 ))}
              </div>
           </div>

           <nav className="space-y-1">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 pt-2">Filter By Type</h4>
              {categories.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setActiveCategory(cat)}
                   className={`
                     w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                     ${activeCategory === cat ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:bg-gray-100'}
                   `}
                 >
                    {cat}
                    <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                      {cat === 'All' ? documents.length : documents.filter(d => getCategory(d.type) === cat).length}
                    </span>
                 </button>
              ))}
           </nav>
        </div>

        {/* Main Content: Document List */}
        <div className="lg:col-span-3">
           <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <h3 className="text-base font-bold text-gray-900">{activeCategory} Documents</h3>
                 <div className="flex gap-2 w-64">
                    <div className="relative w-full">
                       <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                       <input 
                         type="text" 
                         placeholder="Filter documents..." 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 shadow-sm transition-all" 
                       />
                    </div>
                 </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Document Details</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type / Date</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sharing</th>
                      <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mr-4 border border-red-100">
                               <FileText size={20} />
                            </div>
                            <div>
                               <div className="text-sm font-bold text-gray-900 hover:text-blue-600 cursor-pointer" onClick={() => handleDownload(doc)}>{doc.name}</div>
                               <div className="text-xs text-gray-400 mt-0.5">PDF • {doc.size || '?? MB'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-xs font-semibold text-gray-700">{doc.type}</div>
                           <div className="text-[10px] text-gray-400 mt-1">{new Date(doc.updatedAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           {getStatusBadge(doc.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <button 
                             onClick={() => handleToggleShare(doc)}
                             className={`
                               inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors border
                               ${doc.isInternal 
                                  ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' 
                                  : 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'}
                             `}
                           >
                             {doc.isInternal ? <Shield size={10}/> : <Share2 size={10}/>}
                             {doc.isInternal ? 'Team Only' : 'Shared'}
                           </button>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleDownload(doc)} className="p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-all shadow-sm" title="Download">
                                 <Download size={16}/>
                              </button>
                              <button onClick={() => handleOpenEdit(doc)} className="p-2 text-gray-400 hover:text-green-600 bg-white border border-gray-200 rounded-lg hover:border-green-300 transition-all shadow-sm" title="Edit">
                                 <Eye size={16}/>
                              </button>
                              <button onClick={() => handleDelete(doc.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded-lg hover:border-red-300 transition-all shadow-sm" title="Delete">
                                 <Trash2 size={16}/>
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredDocs.length === 0 && (
                   <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                      <FileText size={32} className="mb-2 opacity-50" />
                      <p className="text-sm">No documents found matching "{searchQuery}" in {activeCategory}</p>
                   </div>
                )}
              </div>
           </div>
        </div>

      </div>

      {/* Add/Edit Document Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingDoc?.id ? "Edit Document" : "Upload New Document"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {!editingDoc?.id && (
              <div className="relative">
                  <input 
                    type="file" 
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if(file) {
                            setSelectedFile(file);
                            // Auto-fill name if empty
                            if(!editingDoc?.name) setEditingDoc(prev => ({...prev, name: file.name}));
                        }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`border-2 border-dashed ${selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'} rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition-colors`}>
                    <UploadCloud size={32} className={selectedFile ? "text-green-500 mb-2" : "text-gray-400 mb-2"} />
                    <p className="text-sm font-medium text-gray-700">{selectedFile ? selectedFile.name : "Click to select file"}</p>
                    <p className="text-xs text-gray-400">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "PDF, PNG, JPG up to 10MB"}</p>
                  </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                  <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Document Name</Label>
                  <Input 
                    placeholder="e.g. Commercial Invoice #1234"
                    value={editingDoc?.name || ''}
                    onChange={e => setEditingDoc({...editingDoc!, name: e.target.value})}
                  />
               </div>
               
               <div>
                  <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Document Type</Label>
                  <Select 
                     value={editingDoc?.type || 'Other'}
                     onValueChange={v => setEditingDoc({...editingDoc!, type: v})}
                  >
                     <SelectTrigger>
                         <SelectValue placeholder="Select type" />
                     </SelectTrigger>
                     <SelectContent>
                         <SelectItem value="Booking">Booking Confirmation</SelectItem>
                         <SelectItem value="MBL">Master Bill of Lading</SelectItem>
                         <SelectItem value="HBL">House Bill of Lading</SelectItem>
                         <SelectItem value="Invoice">Commercial Invoice</SelectItem>
                         <SelectItem value="PL">Packing List</SelectItem>
                         <SelectItem value="Customs">Customs Declaration</SelectItem>
                         <SelectItem value="Other">Other</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div>
                  <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</Label>
                  <Select 
                     value={editingDoc?.status || DocStatus.RECEIVED}
                     onValueChange={v => setEditingDoc({...editingDoc!, status: v as DocStatus})}
                  >
                     <SelectTrigger>
                         <SelectValue placeholder="Status" />
                     </SelectTrigger>
                     <SelectContent>
                         {Object.values(DocStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                     </SelectContent>
                  </Select>
               </div>
               
               <div className="col-span-2 mt-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white transition-colors cursor-pointer">
                     <input 
                       type="checkbox"
                       className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                       checked={editingDoc?.isInternal || false}
                       onChange={e => setEditingDoc({...editingDoc!, isInternal: e.target.checked})}
                     />
                     <div>
                        <div className="text-sm font-bold text-gray-900">Mark as Internal</div>
                        <div className="text-xs text-gray-500">Only visible to team members, hidden from customer.</div>
                     </div>
                  </label>
               </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
                {editingDoc?.id ? 'Save Changes' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};