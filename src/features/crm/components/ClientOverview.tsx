import { useState } from 'react';
import { Building2, Mail, Phone, Globe, FileText, CreditCard, Briefcase, Trash2, Plus } from "lucide-react";
import { useClientStore, ClientType, ClientStatus } from "@/store/useClientStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientActivityFeed } from "./ClientActivityFeed";

const FieldGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</Label>
    {children}
  </div>
);

export function ClientOverview({ isEditing }: { isEditing: boolean }) {
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
        <div className="grid grid-cols-12 gap-6 animate-in fade-in duration-500 pb-6">
            
            {/* LEFT COLUMN: IDENTITY & LEGAL */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                
                {/* Identity Card */}
                <Card className="border-slate-200 shadow-md bg-white">
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 h-14 justify-center">
                        <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" /> Corporate Identity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Client Type">
                                <Select disabled={!isEditing} value={activeClient.type} onValueChange={(v) => updateActiveField('type', v as ClientType)}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SHIPPER">Shipper</SelectItem>
                                        <SelectItem value="CONSIGNEE">Consignee</SelectItem>
                                        <SelectItem value="FORWARDER">Forwarder</SelectItem>
                                        <SelectItem value="PARTNER">Partner</SelectItem>
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
                                <Input value={activeClient.email} disabled={!isEditing} placeholder="Email Address" className="h-8 text-xs" onChange={(e) => updateActiveField('email', e.target.value)} />
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <Input value={activeClient.phone} disabled={!isEditing} placeholder="Phone Number" className="h-8 text-xs" onChange={(e) => updateActiveField('phone', e.target.value)} />
                            </div>
                            <div className="flex items-center gap-3">
                                <Globe className="h-4 w-4 text-slate-400" />
                                <Input value={activeClient.website || ''} disabled={!isEditing} placeholder="Website URL" className="h-8 text-xs" onChange={(e) => updateActiveField('website', e.target.value)} />
                            </div>
                        </div>
                        
                        <FieldGroup label="Physical Address">
                             <Input value={activeClient.address || ''} disabled={!isEditing} placeholder="Street Address" className="h-8 text-xs mb-2" onChange={(e) => updateActiveField('address', e.target.value)} />
                             <div className="grid grid-cols-2 gap-2">
                                <Input value={activeClient.city} disabled={!isEditing} placeholder="City" className="h-8 text-xs" onChange={(e) => updateActiveField('city', e.target.value)} />
                                <Input value={activeClient.country} disabled={!isEditing} placeholder="Country" className="h-8 text-xs" onChange={(e) => updateActiveField('country', e.target.value)} />
                             </div>
                        </FieldGroup>
                    </CardContent>
                </Card>

                {/* Legal Card */}
                <Card className="border-slate-200 shadow-md bg-white">
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 h-14 justify-center">
                        <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" /> Legal & Fiscal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 grid grid-cols-2 gap-4">
                        <FieldGroup label="ICE (Morocco)">
                            <Input value={activeClient.financials.ice || ''} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveFinancials('ice', e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="RC Number">
                            <Input value={activeClient.financials.rc || ''} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveFinancials('rc', e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="VAT / IF">
                            <Input value={activeClient.financials.vatNumber} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveFinancials('vatNumber', e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="Tax ID">
                            <Input value={activeClient.financials.taxId || ''} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveFinancials('taxId', e.target.value)} />
                        </FieldGroup>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                
                {/* 1. FINANCIALS (Top) */}
                <Card className="border-slate-200 shadow-md bg-white shrink-0">
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between h-14">
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
                                            className="font-mono pr-8 h-9"
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">{activeClient.financials.currency}</span>
                                    </div>
                                </FieldGroup>
                            </div>

                            <div className="col-span-2 bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-center shadow-inner">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credit Utilization</span>
                                    <span className="text-sm font-bold text-slate-700 font-mono">
                                        {activeClient.creditUsed.toLocaleString()} / {(activeClient.creditLimit || 0).toLocaleString()} {activeClient.financials.currency}
                                    </span>
                                </div>
                                <Progress 
                                    value={(activeClient.creditLimit > 0 ? (activeClient.creditUsed / activeClient.creditLimit) * 100 : 0)} 
                                    className="h-2.5 bg-slate-200" 
                                    indicatorClassName={(activeClient.creditUsed / (activeClient.creditLimit || 1)) > 0.9 ? "bg-red-500" : "bg-blue-600"}
                                />
                                <div className="mt-3 flex gap-4 text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Used</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200"></div> Available</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. BOTTOM SPLIT (Strictly Equal Heights) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                    
                    {/* LEFT: ACTIVITY FEED */}
                    <ClientActivityFeed className="h-full" />

                    {/* RIGHT: SEGMENTATION */}
                    <Card className="h-full flex flex-col bg-white border border-slate-200 shadow-md overflow-hidden">
                        <CardHeader className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 shrink-0 h-14 justify-center">
                            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <div className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-slate-500">
                                    <Briefcase className="h-3.5 w-3.5" /> 
                                </div>
                                Segmentation
                            </CardTitle>
                        </CardHeader>

                        {/* Content */}
                        <div className="flex-1 bg-white relative min-h-0">
                            <ScrollArea className="h-full">
                                <CardContent className="p-5 flex flex-col gap-6">
                                    <FieldGroup label="Market Tags">
                                        <div className="flex flex-wrap gap-2">
                                            {activeClient.tags?.map((tag, idx) => (
                                                <Badge key={idx} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 px-2 py-1 gap-1.5 shadow-sm">
                                                    {tag}
                                                    {isEditing && (
                                                        <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </Badge>
                                            ))}
                                            {activeClient.tags.length === 0 && (
                                                <div className="h-10 flex items-center text-xs text-slate-400 italic bg-slate-50/50 px-3 rounded-md w-full border border-dashed border-slate-200">
                                                    No market tags assigned.
                                                </div>
                                            )}
                                        </div>
                                    </FieldGroup>

                                    <Separator />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Lifetime Value</span>
                                            <span className="text-lg font-bold text-slate-700 font-mono">High</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Risk Profile</span>
                                            <span className="text-lg font-bold text-emerald-600 font-mono">Low</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </ScrollArea>
                        </div>

                        {/* Footer Matches Activity Feed */}
                        <div className="p-3 border-t border-slate-100 bg-slate-50/30 shrink-0 h-[60px] flex items-center justify-center">
                            {isEditing ? (
                                <div className="flex gap-2 w-full">
                                    <Input 
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        className="h-9 text-xs bg-white focus-visible:ring-slate-200 border-slate-200"
                                        placeholder="Add new tag..."
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                    />
                                    <Button 
                                        size="icon" 
                                        onClick={handleAddTag} 
                                        className="h-9 w-9 bg-slate-900 hover:bg-slate-800 shadow-sm shrink-0"
                                        disabled={!tagInput.trim()}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <span className="text-[10px] text-slate-400 font-medium">Read-only mode</span>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}