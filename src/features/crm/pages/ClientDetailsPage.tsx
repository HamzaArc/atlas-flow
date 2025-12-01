import { useState, useEffect } from 'react';
import { useClientStore } from "@/store/useClientStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

// Modular Components
import { ClientHeader } from "../components/ClientHeader";
import { ClientOverview } from "../components/ClientOverview";
import { ClientContacts } from "../components/ClientContacts";
import { ClientDocuments } from "../components/ClientDocuments";
// Reuse existing Logistics Tab Logic (can also be extracted if needed, but included inline for now to save file count if it's small, 
// OR we reuse the Logic from previous iteration as a component. I will extract it for consistency).
import { ClientLogistics } from "../components/ClientLogistics"; 

export default function ClientDetailsPage() {
  const { activeClient, saveClient } = useClientStore();
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Auto-enter edit mode for new clients
  useEffect(() => {
    if (activeClient && activeClient.id.startsWith('new')) {
        setIsEditing(true);
    }
  }, [activeClient]);

  if (!activeClient) return <div className="p-8 text-center text-slate-500">No client selected.</div>;

  const handleSave = async () => {
    if (!activeClient.entityName) {
        toast("Entity Name is required", "error");
        return;
    }
    await saveClient(activeClient);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 min-h-screen">
      
      {/* 1. Header */}
      <ClientHeader 
          isEditing={isEditing} 
          setIsEditing={setIsEditing} 
          onSave={handleSave} 
          onBack={() => { /* Navigation handled by parent usually, or add logic here */ }} 
      />

      {/* 2. Tabs & Workspace */}
      <div className="flex-1 px-8 py-6 h-full min-h-0 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col space-y-6">
          <div className="flex items-center justify-between shrink-0">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg h-11 shadow-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Overview</TabsTrigger>
              <TabsTrigger value="logistics" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Logistics</TabsTrigger>
              <TabsTrigger value="contacts" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Contacts ({activeClient.contacts.length})</TabsTrigger>
              <TabsTrigger value="docs" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Documents ({activeClient.documents.length})</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-10">
            <TabsContent value="overview" className="h-full m-0 space-y-0 focus-visible:ring-0 outline-none">
              <ClientOverview isEditing={isEditing} />
            </TabsContent>
            
            <TabsContent value="logistics" className="h-full m-0 focus-visible:ring-0 outline-none">
              <ClientLogistics isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="contacts" className="h-full m-0 focus-visible:ring-0 outline-none">
                <ClientContacts isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="docs" className="h-full m-0 focus-visible:ring-0 outline-none">
                <ClientDocuments isEditing={isEditing} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}