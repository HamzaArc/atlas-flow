import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, UploadCloud, CheckCircle, AlertCircle, Eye } from "lucide-react";

// Types based on the Spec 
type DocType = 'MBL' | 'HBL' | 'COMMERCIAL_INV' | 'PACKING_LIST' | 'DUM' | 'EUR1';

interface DocItem {
  id: string;
  type: DocType;
  label: string;
  status: 'MISSING' | 'DRAFT' | 'ORIGINAL_RECEIVED' | 'VALIDATED';
  url?: string;
  required: boolean;
}

const MOCK_DOCS: DocItem[] = [
  { id: '1', type: 'MBL', label: 'Master Bill of Lading', status: 'ORIGINAL_RECEIVED', required: true, url: '#' },
  { id: '2', type: 'HBL', label: 'House Bill of Lading', status: 'DRAFT', required: true, url: '#' },
  { id: '3', type: 'COMMERCIAL_INV', label: 'Commercial Invoice', status: 'MISSING', required: true },
  { id: '4', type: 'PACKING_LIST', label: 'Packing List', status: 'MISSING', required: true },
  { id: '5', type: 'DUM', label: 'DUM (Customs)', status: 'MISSING', required: true }, // Critical for Morocco
];

export function DocBucketSystem() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {MOCK_DOCS.map((doc) => (
        <Card key={doc.id} className={`p-4 border-2 border-dashed transition-all hover:bg-slate-50 ${
            doc.status === 'MISSING' ? 'border-slate-200' : 
            doc.status === 'VALIDATED' ? 'border-green-200 bg-green-50/30' : 
            'border-blue-200 bg-blue-50/10'
        }`}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
               <div className={`p-2 rounded-full ${
                   doc.status === 'MISSING' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'
               }`}>
                   <FileText className="h-4 w-4" />
               </div>
               <div>
                   <h4 className="font-semibold text-sm text-slate-700">{doc.label}</h4>
                   {doc.required && <span className="text-[10px] text-red-500 font-medium">* Required</span>}
               </div>
            </div>
            <Badge variant="outline" className={
                doc.status === 'MISSING' ? 'text-slate-500' :
                doc.status === 'ORIGINAL_RECEIVED' ? 'text-blue-600 border-blue-200' : 
                'text-green-600 border-green-200'
            }>
                {doc.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Action Area */}
          <div className="flex items-center justify-between mt-4">
              {doc.status === 'MISSING' ? (
                  <Button variant="outline" size="sm" className="w-full border-dashed text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                      <UploadCloud className="h-4 w-4 mr-2" />
                      Upload PDF
                  </Button>
              ) : (
                  <div className="flex gap-2 w-full">
                      <Button variant="outline" size="sm" className="flex-1 text-xs">
                          <Eye className="h-3 w-3 mr-2" /> View
                      </Button>
                      <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                          <CheckCircle className="h-4 w-4" />
                      </Button>
                  </div>
              )}
          </div>
        </Card>
      ))}

      {/* Upload Drop Zone */}
      <Card className="p-4 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors min-h-[140px]">
          <UploadCloud className="h-8 w-8 mb-2" />
          <span className="text-sm font-medium">Drag & Drop other files</span>
          <span className="text-xs">or click to browse</span>
      </Card>
    </div>
  );
}