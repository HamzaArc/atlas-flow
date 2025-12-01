import React, { useState, useEffect } from 'react';
import { 
  User, Building2, MapPin, Phone, Mail, Globe, 
  CreditCard, FileText, History, Truck, 
  MoreHorizontal, CheckCircle2, Briefcase, 
  Trash2, Plus, Calendar, Boxes, Factory
} from "lucide-react";

import { useClientStore, ClientType, ClientStatus } from "@/store/useClientStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Sub Components
import { ContactDialog } from "@/features/crm/components/ContactDialog";
import { RouteDialog } from "@/features/crm/components/RouteDialog";
import { ClientActivityFeed } from "@/features/crm/components/ClientActivityFeed";

// --- HELPER COMPONENTS ---

const FieldGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</Label>
    {children}
  </div>
);

// --- TAB CONTENT: OVERVIEW ---
const OverviewTab = ({ isEditing }: { isEditing: boolean }) => {
  const { activeClient, updateActiveField, updateActiveFinancials, addTag, removeTag } = useClientStore();
  const [tagInput, setTagInput] = useState('');
  
  if (!activeClient) return null;

  const handleAddTag = () => {
      if(tagInput.trim()) {
          addTag(tagInput.trim());
          setTagInput('');
      }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full animate-in fade-in duration-500">
      
      {/* LEFT COL: Core Identity */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" /> Corporate Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <FieldGroup label="Entity Name">
              <Input 
                value={activeClient.entityName} 
                disabled={!isEditing}
                placeholder="Company Legal Name"
                className="font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition-colors" 
                onChange={(e) => updateActiveField('entityName', e.target.value)}
              />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Client Type">
                <Select disabled={!isEditing} value={activeClient.type} onValueChange={(v) => updateActiveField('type', v as ClientType)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHIPPER">Shipper</SelectItem>
                    <SelectItem value="CONSIGNEE">Consignee</SelectItem>
                    <SelectItem value="FORWARDER">Forwarder</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Status">
                 <Select disabled={!isEditing} value={activeClient.status} onValueChange={(v) => updateActiveField('status', v as ClientStatus)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <Input value={activeClient.email} disabled={!isEditing} placeholder="Email" className="h-8 text-xs" onChange={(e) => updateActiveField('email', e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <Input value={activeClient.phone} disabled={!isEditing} placeholder="Phone" className="h-8 text-xs" onChange={(e) => updateActiveField('phone', e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-slate-400" />
                <Input value={activeClient.city} disabled={!isEditing} placeholder="City" className="h-8 text-xs" onChange={(e) => updateActiveField('city', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" /> Legal & Fiscal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 gap-4">
             <FieldGroup label="ICE (Morocco)">
               <Input value={activeClient.financials.ice || ''} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveFinancials('ice', e.target.value)} />
             </FieldGroup>
             <FieldGroup label="RC">
               <Input value={activeClient.financials.rc || ''} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveFinancials('rc', e.target.value)} />
             </FieldGroup>
             <FieldGroup label="VAT / IF">
               <Input value={activeClient.financials.vatNumber} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveFinancials('vatNumber', e.target.value)} />
             </FieldGroup>
             <FieldGroup label="Country">
               <Input value={activeClient.country} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveField('country', e.target.value)} />
             </FieldGroup>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COL: Financials & CRM (Collaboration Hub) */}
      {/* We use flex-col and flex-1 to ensure it fills height but respects boundaries */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-[calc(100vh-220px)] min-h-[600px]">
        
        {/* FINANCIALS (Fixed Height) */}
        <Card className="border-slate-200 shadow-sm shrink-0">
          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-400" /> Financial Profile
            </CardTitle>
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-mono">
              CUR: {activeClient.financials.currency}
            </Badge>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 space-y-4">
                    <FieldGroup label="Payment Terms">
                        <Select disabled={!isEditing} value={activeClient.financials.paymentTerms} onValueChange={(v) => updateActiveFinancials('paymentTerms', v)}>
                          <SelectTrigger className="font-semibold h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PREPAID">Prepaid</SelectItem>
                            <SelectItem value="NET_30">Net 30 Days</SelectItem>
                            <SelectItem value="NET_60">Net 60 Days</SelectItem>
                            <SelectItem value="CAD">Cash Against Docs</SelectItem>
                          </SelectContent>
                        </Select>
                    </FieldGroup>
                    <FieldGroup label="Credit Limit">
                        <div className="relative">
                            <Input 
                                type="number"
                                value={activeClient.creditLimit}
                                disabled={!isEditing}
                                onChange={(e) => updateActiveField('creditLimit', parseFloat(e.target.value))}
                                className="font-mono pr-8"
                            />
                            <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">{activeClient.financials.currency}</span>
                        </div>
                    </FieldGroup>
                </div>

                <div className="col-span-2 bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Credit Utilization</span>
                        <span className="text-xs font-bold text-slate-700">
                          {activeClient.creditUsed.toLocaleString()} / {(activeClient.creditLimit || 0).toLocaleString()} {activeClient.financials.currency}
                        </span>
                    </div>
                    <Progress 
                        value={(activeClient.creditLimit > 0 ? (activeClient.creditUsed / activeClient.creditLimit) * 100 : 0)} 
                        className="h-2.5 bg-slate-200" 
                        indicatorClassName={(activeClient.creditUsed / (activeClient.creditLimit || 1)) > 0.9 ? "bg-red-500" : "bg-blue-600"}
                    />
                    
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                           <span className="text-[9px] text-slate-400 block mb-1">SALES REP</span>
                           <div className="text-xs font-semibold text-slate-700">{activeClient.salesRepId || 'Unassigned'}</div>
                        </div>
                        <div>
                           <span className="text-[9px] text-slate-400 block mb-1">LAST UPDATED</span>
                           <div className="text-xs font-mono text-slate-600">{activeClient.updated_at ? new Date(activeClient.updated_at).toLocaleDateString() : 'Never'}</div>
                        </div>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* BOTTOM ROW: Collaboration & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* COLLABORATION HUB */}
            <div className="h-full min-h-0">
                <ClientActivityFeed />
            </div>

            {/* SEGMENTATION (TAGS) */}
            <Card className="border-slate-200 shadow-sm h-full flex flex-col">
              <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 shrink-0">
                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400" /> Segmentation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col gap-4 overflow-y-auto">
                  <FieldGroup label="Market Tags">
                      <div className="flex flex-wrap gap-2">
                          {activeClient.tags?.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 pr-1 gap-1">
                                  {tag}
                                  {isEditing && (
                                      <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500">
                                          <Trash2 className="h-3 w-3" />
                                      </button>
                                  )}
                              </Badge>
                          ))}
                          {activeClient.tags.length === 0 && <span className="text-xs text-slate-400 italic">No tags assigned.</span>}
                      </div>
                  </FieldGroup>
                  
                  {isEditing && (
                      <div className="pt-2 border-t border-dashed">
                          <Label className="text-[10px] text-slate-400 uppercase font-bold mb-1.5 block">Add New Tag</Label>
                          <div className="flex gap-2">
                              <Input 
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                className="h-8 text-xs"
                                placeholder="e.g. VIP, Pharmaceutical..."
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                              />
                              <Button size="sm" onClick={handleAddTag} className="h-8 bg-slate-900 text-white">Add</Button>
                          </div>
                      </div>
                  )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

// --- TAB CONTENT: LOGISTICS ---
const LogisticsTab = ({ isEditing }: { isEditing: boolean }) => {
  const { activeClient, addRoute, removeRoute, addPreference, removePreference } = useClientStore();
  const [supplierInput, setSupplierInput] = useState('');
  const [goodsInput, setGoodsInput] = useState('');
  
  if (!activeClient) return null;

  return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
          
          {/* VOLUME CARD */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Truck className="h-5 w-5" /></div>
                      <div>
                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Projected Volume</p>
                          <p className="text-xl font-bold text-slate-700">120 TEU</p>
                          <p className="text-[10px] text-slate-400">Forecast 2024</p>
                      </div>
                  </CardContent>
              </Card>
          </div>

          {/* ROUTES TABLE */}
          <Card>
              <CardHeader className="py-4 border-b flex flex-row justify-between items-center bg-slate-50/30">
                  <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-slate-400" />
                      <CardTitle className="text-sm font-bold text-slate-700">Preferred Routes</CardTitle>
                  </div>
                  {isEditing && <RouteDialog onSave={addRoute} />}
              </CardHeader>
              <Table>
                  <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead>Mode</TableHead>
                          <TableHead>Origin</TableHead>
                          <TableHead></TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Est. Volume</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {activeClient.routes.length > 0 ? activeClient.routes.map((route) => (
                          <TableRow key={route.id}>
                              <TableCell><Badge variant="outline">{route.mode}</Badge></TableCell>
                              <TableCell className="font-medium">{route.origin}</TableCell>
                              <TableCell><Badge className="h-3 w-3 text-slate-300" /></TableCell>
                              <TableCell className="font-medium">{route.destination}</TableCell>
                              <TableCell className="text-slate-500 text-sm">{route.volume}</TableCell>
                              <TableCell>
                                  {isEditing && (
                                      <Button variant="ghost" size="sm" onClick={() => removeRoute(route.id)} className="text-slate-400 hover:text-red-500">
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  )}
                              </TableCell>
                          </TableRow>
                      )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center text-slate-400 text-xs h-24 italic">No preferred routes configured.</TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </Card>

          {/* PREFERENCES GRID */}
          <div className="grid grid-cols-2 gap-6">
              {/* Suppliers */}
              <Card>
                  <CardHeader className="py-3 border-b bg-slate-50/30">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                          <Factory className="h-4 w-4 text-slate-400" /> Preferred Suppliers
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                          {activeClient.preferredSuppliers?.map((item, i) => (
                              <Badge key={i} variant="outline" className="gap-1 bg-slate-50">
                                  {item}
                                  {isEditing && <Trash2 className="h-3 w-3 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removePreference('preferredSuppliers', item)} />}
                              </Badge>
                          ))}
                          {activeClient.preferredSuppliers.length === 0 && <span className="text-xs text-slate-400 italic">No suppliers listed.</span>}
                      </div>
                      {isEditing && (
                          <div className="flex gap-2">
                              <Input className="h-8 text-xs" placeholder="Add Supplier..." value={supplierInput} onChange={(e) => setSupplierInput(e.target.value)} />
                              <Button size="sm" variant="secondary" className="h-8" onClick={() => { if(supplierInput) { addPreference('preferredSuppliers', supplierInput); setSupplierInput(''); } }}>Add</Button>
                          </div>
                      )}
                  </CardContent>
              </Card>

              {/* Commodities */}
              <Card>
                  <CardHeader className="py-3 border-b bg-slate-50/30">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                          <Boxes className="h-4 w-4 text-slate-400" /> Commodities
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                          {activeClient.preferredGoods?.map((item, i) => (
                              <Badge key={i} variant="outline" className="gap-1 bg-slate-50">
                                  {item}
                                  {isEditing && <Trash2 className="h-3 w-3 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removePreference('preferredGoods', item)} />}
                              </Badge>
                          ))}
                          {activeClient.preferredGoods.length === 0 && <span className="text-xs text-slate-400 italic">No goods listed.</span>}
                      </div>
                      {isEditing && (
                          <div className="flex gap-2">
                              <Input className="h-8 text-xs" placeholder="Add Commodity..." value={goodsInput} onChange={(e) => setGoodsInput(e.target.value)} />
                              <Button size="sm" variant="secondary" className="h-8" onClick={() => { if(goodsInput) { addPreference('preferredGoods', goodsInput); setGoodsInput(''); } }}>Add</Button>
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
      </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function ClientDetailsPage() {
  const { 
      activeClient, saveClient, 
      updateActiveField, addContact, removeContact
  } = useClientStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PROSPECT': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SUSPENDED': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BLACKLISTED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 min-h-screen">
      
      {/* 1. HEADER & ACTIONS */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 shadow-sm sticky top-0 z-20">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg text-white font-bold text-xl ring-4 ring-blue-50">
              {activeClient.entityName ? activeClient.entityName.substring(0, 2).toUpperCase() : '??'}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                {isEditing ? (
                    <Input 
                        value={activeClient.entityName}
                        onChange={(e) => updateActiveField('entityName', e.target.value)}
                        className="text-xl font-bold h-8 border-dashed border-slate-300 px-2 w-72"
                        placeholder="Enter Client Name"
                        autoFocus
                    />
                ) : (
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{activeClient.entityName}</h1>
                )}
                <Badge className={cn("uppercase font-bold tracking-wider rounded-sm text-[10px] shadow-none", getStatusColor(activeClient.status))} variant="outline">
                  {activeClient.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5" /> {activeClient.city || 'No City'}, {activeClient.country || 'No Country'}</span>
                <span className="h-3 w-px bg-slate-300"></span>
                <span className="flex items-center gap-1.5 text-xs"><Calendar className="h-3.5 w-3.5" /> Customer From: {new Date(activeClient.created_at).toLocaleDateString()}</span>
                <span className="h-3 w-px bg-slate-300"></span>
                
                {/* Sales Rep Selector - Direct Binding */}
                <div className="flex items-center gap-1.5 text-xs">
                    <User className="h-3.5 w-3.5" />
                    {isEditing ? (
                        <Select value={activeClient.salesRepId} onValueChange={(v) => updateActiveField('salesRepId', v)}>
                            <SelectTrigger className="h-6 w-32 text-xs border-none bg-slate-100"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Youssef (Sales)">Youssef (Sales)</SelectItem>
                                <SelectItem value="Fatima (Ops)">Fatima (Ops)</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <span>{activeClient.salesRepId || 'Unassigned'}</span>
                    )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-800">Cancel</Button>
                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 shadow-md text-white">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm">
                  <History className="h-4 w-4 mr-2" /> Logs
                </Button>
                <Button onClick={() => setIsEditing(true)} className="bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                  Edit Profile
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. TABS & CONTENT */}
      <div className="flex-1 px-8 py-6 h-full min-h-0 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col space-y-6">
          <div className="flex items-center justify-between shrink-0">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg h-11 shadow-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Overview</TabsTrigger>
              <TabsTrigger value="logistics" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Logistics</TabsTrigger>
              <TabsTrigger value="contacts" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Contacts ({activeClient.contacts.length})</TabsTrigger>
              <TabsTrigger value="docs" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Documents</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-10">
            <TabsContent value="overview" className="h-full m-0 space-y-0 focus-visible:ring-0 outline-none">
              <OverviewTab isEditing={isEditing} />
            </TabsContent>
            
            <TabsContent value="logistics" className="h-full m-0 focus-visible:ring-0 outline-none">
              <LogisticsTab isEditing={isEditing} />
            </TabsContent>

            <TabsContent value="contacts" className="h-full m-0 focus-visible:ring-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Card>
                    <CardHeader className="py-4 border-b flex flex-row justify-between items-center bg-slate-50/30">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                            Team & Stakeholders
                        </CardTitle>
                        {isEditing && <ContactDialog onSave={addContact} />}
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Primary</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeClient.contacts.length > 0 ? activeClient.contacts.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell>
                                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
                                            {c.name ? c.name.charAt(0) : '?'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-700 text-sm">{c.name}</TableCell>
                                    <TableCell className="text-xs text-slate-500">{c.role}</TableCell>
                                    <TableCell className="text-xs text-blue-600 hover:underline cursor-pointer">{c.email}</TableCell>
                                    <TableCell className="text-xs text-slate-500">{c.phone}</TableCell>
                                    <TableCell>
                                        {c.isPrimary && <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px]">Primary</Badge>}
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
                </Card>
            </TabsContent>

            <TabsContent value="docs" className="h-full m-0 focus-visible:ring-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-4 gap-4">
                    <Card className="border-dashed border-2 hover:border-slate-400 cursor-pointer flex flex-col items-center justify-center p-8 gap-4 text-slate-400 hover:text-slate-600 bg-slate-50/50 hover:bg-slate-100 transition-all">
                        <div className="p-4 bg-white rounded-full shadow-sm">
                            <Plus className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                            <span className="text-sm font-bold block">Upload Document</span>
                            <span className="text-[10px]">KYC, RC, or Contracts (PDF)</span>
                        </div>
                    </Card>
                </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}