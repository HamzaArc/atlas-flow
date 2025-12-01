import React, { useState, useEffect } from 'react';
import { 
  User, Building2, MapPin, Phone, Mail, Globe, 
  CreditCard, FileText, History, Truck, 
  MoreHorizontal, Save, AlertCircle, 
  Plus, ArrowRight, ShieldAlert, Clock, 
  Briefcase, StickyNote, Eye, Download
} from "lucide-react";

// --- STORE IMPORT ---
import { useClientStore, Client, ClientStatus, ClientType } from "@/store/useClientStore";

// --- UI IMPORTS ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// --- HELPER COMPONENTS ---
const FieldGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</Label>
    {children}
  </div>
);

export default function ClientDetailsPage() {
  const { activeClient, saveClient } = useClientStore();
  const [client, setClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // --- INIT LOGIC: Load Active Client or Setup New ---
  useEffect(() => {
    if (activeClient) {
        // Deep copy to ensure local mutation doesn't affect store until save
        setClient(JSON.parse(JSON.stringify(activeClient)));
        
        // If it's a new draft, auto-enable edit mode
        if (activeClient.id.toString().startsWith('new')) {
            setIsEditing(true);
        } else {
            setIsEditing(false);
        }
    }
  }, [activeClient]);

  if (!client) return <div className="p-8 text-center text-slate-500">No client selected. Please go back to the list.</div>;

  // --- ACTIONS ---
  const handleSave = async () => {
    if (!client.entityName) {
        toast("Entity Name is required", "error");
        return;
    }
    await saveClient(client);
    setIsEditing(false);
  };

  // --- STATE UPDATERS ---
  // Helper for top-level fields
  const updateField = (field: keyof Client, value: any) => {
      setClient(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  // Helper for nested financials
  const updateFinancials = (field: string, value: any) => {
      setClient(prev => prev ? ({ 
          ...prev, 
          financials: { ...prev.financials, [field]: value } 
      }) : null);
  };

  // Helper for nested arrays (contacts/routes)
  // Note: For a real app, you'd want dedicated modal handlers for adding rows.
  // For this version, we will just render the list read-only or allow simple edits if needed.

  // Dynamic Status Color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PROSPECT': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SUSPENDED': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BLACKLISTED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // --- TAB: OVERVIEW ---
  const OverviewTab = () => (
    <div className="grid grid-cols-12 gap-6 h-full animate-in fade-in duration-500">
      {/* LEFT COL: Core & Identity (4) */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" /> Corporate Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <FieldGroup label="Entity Name">
              <Input 
                value={client.entityName} 
                disabled={!isEditing}
                placeholder="e.g. Acme Corp SARL"
                className="font-bold text-slate-900 bg-slate-50/50 focus:bg-white transition-colors" 
                onChange={(e) => updateField('entityName', e.target.value)}
              />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Client Type">
                <Select disabled={!isEditing} value={client.type} onValueChange={(v) => updateField('type', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHIPPER">Shipper</SelectItem>
                    <SelectItem value="CONSIGNEE">Consignee</SelectItem>
                    <SelectItem value="FORWARDER">Forwarder</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
              {/* Note: activityType is implied but not in core interface, using tags/notes or extending interface if needed. 
                  For now we stick to the interface or map to tags. */}
              <FieldGroup label="Status">
                 <Select disabled={!isEditing} value={client.status} onValueChange={(v) => updateField('status', v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <Input 
                    value={client.email} 
                    disabled={!isEditing} 
                    placeholder="email@company.com"
                    className="h-8 text-xs border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white bg-transparent" 
                    onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <Input 
                    value={client.phone} 
                    disabled={!isEditing} 
                    placeholder="+212..."
                    className="h-8 text-xs border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white bg-transparent" 
                    onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-slate-400" />
                <Input 
                    value={client.city} 
                    disabled={!isEditing} 
                    placeholder="City"
                    className="h-8 text-xs border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white bg-transparent" 
                    onChange={(e) => updateField('city', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Card (Using Generic Fields mapped to tags or future fields) */}
        {/* Note: I'm mapping VAT/ICE to specific fields if they exist in your DB, or using placeholders if schema is strict */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" /> Legal & Fiscal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-2 gap-4">
             <FieldGroup label="VAT Number">
               <Input 
                value={client.financials.vatNumber} 
                disabled={!isEditing} 
                className="font-mono text-xs h-8" 
                onChange={(e) => updateFinancials('vatNumber', e.target.value)}
               />
             </FieldGroup>
             <FieldGroup label="Country">
               <Input 
                value={client.country} 
                disabled={!isEditing} 
                className="font-mono text-xs h-8" 
                onChange={(e) => updateField('country', e.target.value)}
               />
             </FieldGroup>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COL: Financials & CRM (8) */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        
        {/* FINANCIALS PANEL */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-400" /> Financial Profile
            </CardTitle>
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-mono">
              CUR: {client.financials.currency}
            </Badge>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="col-span-1 space-y-4">
                    <FieldGroup label="Payment Terms">
                        <Select disabled={!isEditing} value={client.financials.paymentTerms} onValueChange={(v) => updateFinancials('paymentTerms', v)}>
                          <SelectTrigger className={cn("font-semibold h-9", client.financials.paymentTerms === 'PREPAID' ? "text-green-600" : "text-blue-600")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PREPAID">Prepaid</SelectItem>
                            <SelectItem value="NET_30">Net 30 Days</SelectItem>
                            <SelectItem value="NET_60">Net 60 Days</SelectItem>
                            <SelectItem value="CAD">Cash Against Docs</SelectItem>
                          </SelectContent>
                        </Select>
                    </FieldGroup>
                    <FieldGroup label="Credit Limit">
                        <Input 
                            type="number"
                            value={client.creditLimit}
                            disabled={!isEditing}
                            onChange={(e) => updateField('creditLimit', parseFloat(e.target.value))}
                            className="font-mono"
                        />
                    </FieldGroup>
                </div>

                <div className="col-span-2 bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Credit Utilization</span>
                        <span className="text-xs font-bold text-slate-700">
                          {client.creditUsed.toLocaleString()} / {(client.creditLimit || 0).toLocaleString()} {client.financials.currency}
                        </span>
                    </div>
                    <Progress 
                        value={(client.creditLimit > 0 ? (client.creditUsed / client.creditLimit) * 100 : 0)} 
                        className="h-2.5 bg-slate-200" 
                        indicatorClassName={(client.creditUsed / (client.creditLimit || 1)) > 0.9 ? "bg-red-500" : "bg-blue-600"}
                    />
                    
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                           <span className="text-[9px] text-slate-400 block mb-1">SALES REP</span>
                           <div className="text-xs font-semibold text-slate-700">{client.salesRepId || 'Unassigned'}</div>
                        </div>
                        <div>
                           <span className="text-[9px] text-slate-400 block mb-1">CREATED AT</span>
                           <div className="text-xs font-mono text-slate-600">{client.created_at || 'New'}</div>
                        </div>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* CRM & NOTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm h-full">
              <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-400" /> CRM Context
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                  <FieldGroup label="Tags">
                      <div className="flex flex-wrap gap-2">
                          {client.tags?.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                                  {tag}
                              </Badge>
                          ))}
                          {isEditing && (
                              <Button size="sm" variant="outline" className="h-5 text-[10px] bg-white border-dashed">
                                  <Plus className="h-3 w-3 mr-1" /> Add
                              </Button>
                          )}
                      </div>
                  </FieldGroup>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm h-full flex flex-col">
              <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-slate-400" /> Internal Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex-1">
                  <Textarea 
                      disabled={!isEditing}
                      // Note: 'internalNotes' might need to be added to your interface or mapped
                      placeholder="Add notes about this client..."
                      className="h-full min-h-[140px] bg-yellow-50/30 border-yellow-200 text-slate-700 resize-none focus:ring-yellow-100 text-sm"
                  />
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );

  const LogisticsTab = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Truck className="h-5 w-5" /></div>
                      <div>
                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Total Volume</p>
                          <p className="text-xl font-bold text-slate-700">0 TEU</p>
                          <p className="text-[10px] text-slate-400">Year to Date</p>
                      </div>
                  </CardContent>
              </Card>
          </div>

          <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-8">
                  <Card>
                      <CardHeader className="py-4 border-b">
                          <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                  <Truck className="h-4 w-4 text-slate-400" /> Preferred Routes
                              </CardTitle>
                              <Button size="sm" variant="outline" className="h-7 text-xs bg-slate-50"><Plus className="h-3 w-3 mr-1" /> Add Route</Button>
                          </div>
                      </CardHeader>
                      <Table>
                          <TableHeader>
                              <TableRow className="bg-slate-50">
                                  <TableHead>Mode</TableHead>
                                  <TableHead>Origin</TableHead>
                                  <TableHead></TableHead>
                                  <TableHead>Destination</TableHead>
                                  <TableHead>Volume</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {client.routes && client.routes.length > 0 ? client.routes.map((route: any, i: number) => (
                                  <TableRow key={i}>
                                      <TableCell>{route.mode}</TableCell>
                                      <TableCell>{route.origin}</TableCell>
                                      <TableCell><ArrowRight className="h-3 w-3" /></TableCell>
                                      <TableCell>{route.destination}</TableCell>
                                      <TableCell>{route.volume}</TableCell>
                                  </TableRow>
                              )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-xs text-slate-400 h-24">No routes configured yet.</TableCell>
                                </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </Card>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 shadow-sm sticky top-0 z-20">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg text-white font-bold text-xl">
              {client.entityName ? client.entityName.substring(0, 2).toUpperCase() : '??'}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                {isEditing ? (
                    <Input 
                        value={client.entityName}
                        onChange={(e) => updateField('entityName', e.target.value)}
                        className="text-xl font-bold h-8 border-dashed border-slate-300 px-2 w-64"
                        placeholder="Enter Client Name"
                    />
                ) : (
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{client.entityName}</h1>
                )}
                <Badge className={cn("uppercase font-bold tracking-wider rounded-sm text-[10px]", getStatusColor(client.status))} variant="outline">
                  {client.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5" /> {client.city || 'No City'}, {client.country || 'No Country'}</span>
                <span className="h-3 w-px bg-slate-300"></span>
                <span className="flex items-center gap-1.5 text-xs"><User className="h-3.5 w-3.5" /> {client.salesRepId || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50">
                  <Phone className="h-4 w-4 mr-2" /> Log Call
                </Button>
                <Button onClick={() => setIsEditing(true)} className="bg-slate-900 text-white hover:bg-slate-800">
                  Edit Profile
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex-1 px-8 py-6">
        <Tabs defaultValue="overview" className="h-full flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg h-11 shadow-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Overview</TabsTrigger>
              <TabsTrigger value="logistics" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Logistics</TabsTrigger>
              <TabsTrigger value="contacts" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Contacts</TabsTrigger>
              <TabsTrigger value="docs" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">Documents</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-slate-500 font-medium text-xs px-4 h-9">History</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1">
            <TabsContent value="overview" className="h-full m-0 space-y-0 focus-visible:ring-0 outline-none">
              <OverviewTab />
            </TabsContent>
            
            <TabsContent value="logistics" className="h-full m-0 focus-visible:ring-0 outline-none">
              <LogisticsTab />
            </TabsContent>

            <TabsContent value="contacts" className="h-full m-0 focus-visible:ring-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {client.contacts && client.contacts.length > 0 ? client.contacts.map((c: any, i: number) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                            {c.name ? c.name.charAt(0) : '?'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-700 text-sm">
                                        {c.name}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">{c.role}</TableCell>
                                    <TableCell className="text-xs text-blue-600 underline cursor-pointer">{c.email}</TableCell>
                                    <TableCell className="text-xs text-slate-500">{c.phone}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px]">Active</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-slate-400 text-xs h-24">No contacts added.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </TabsContent>

            <TabsContent value="docs" className="h-full m-0 focus-visible:ring-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-4 gap-4">
                    <Card className="border-dashed border-2 hover:border-slate-400 cursor-pointer flex flex-col items-center justify-center p-6 gap-3 text-slate-400 hover:text-slate-600 bg-slate-50/50">
                        <div className="p-3 bg-white rounded-full shadow-sm">
                            <Plus className="h-6 w-6" />
                        </div>
                        <div className="text-center">
                            <span className="text-sm font-bold block">Upload Document</span>
                            <span className="text-[10px]">Drag & drop or click to browse</span>
                        </div>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="history" className="h-full m-0 focus-visible:ring-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Card>
                    <CardHeader className="py-4 border-b bg-slate-50/50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                            <History className="h-4 w-4 text-slate-400" /> Audit Log
                        </CardTitle>
                    </CardHeader>
                    <div className="p-8 text-center text-slate-400 text-xs">
                        No history available for this client.
                    </div>
                </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}