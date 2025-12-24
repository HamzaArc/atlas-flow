import { useState } from 'react';
import { Building2, Mail, Phone, Globe, FileText, CreditCard, Briefcase, Trash2, Plus, AlertCircle } from "lucide-react";
import { useClientStore } from "@/store/useClientStore";
import { ClientType, ClientStatus, Currency } from "@/types/index"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const FieldGroup = ({ label, children, required = false }: { label: string, children: React.ReactNode, required?: boolean }) => (
  <div className="space-y-1.5 w-full">
    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
        {label}
        {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
  </div>
);

export function ClientOverview({ isEditing }: { isEditing: boolean }) {
    const { activeClient, clients, updateActiveField, updateActiveFinancials, addTag, removeTag } = useClientStore();
    const [tagInput, setTagInput] = useState('');

    if (!activeClient) return null;

    const totalExposure = (activeClient.unbilledWork || 0) + (activeClient.unpaidInvoices || 0);
    const utilizationPercent = activeClient.creditLimit > 0 ? (totalExposure / activeClient.creditLimit) * 100 : 0;

    // Filter out the current client to prevent self-parenting
    const potentialParents = clients.filter(c => c.id !== activeClient.id);

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
                        
                        {/* Blacklist Reason Force */}
                        {activeClient.status === 'BLACKLISTED' && (
                            <FieldGroup label="Reason for Block" required>
                                <Textarea 
                                    value={activeClient.blacklistReason || ''} 
                                    disabled={!isEditing} 
                                    placeholder="Explanation required..."
                                    className="bg-red-50 border-red-200 text-xs"
                                    onChange={(e) => updateActiveField('blacklistReason', e.target.value)}
                                />
                            </FieldGroup>
                        )}

                        <Separator />

                        {/* Addresses */}
                        <div className="space-y-3">
                             <FieldGroup label="Billing Address (Siège Social)" required>
                                 <Input value={activeClient.billingAddress || ''} disabled={!isEditing} placeholder="Legal address for Invoicing" className="h-8 text-xs" onChange={(e) => updateActiveField('billingAddress', e.target.value)} />
                             </FieldGroup>
                             <FieldGroup label="Delivery Address (Usine/Dépôt)">
                                 <Input value={activeClient.deliveryAddress || ''} disabled={!isEditing} placeholder="Physical delivery location" className="h-8 text-xs" onChange={(e) => updateActiveField('deliveryAddress', e.target.value)} />
                             </FieldGroup>
                             <div className="grid grid-cols-2 gap-2">
                                <Input value={activeClient.city} disabled={!isEditing} placeholder="City" className="h-8 text-xs" onChange={(e) => updateActiveField('city', e.target.value)} />
                                <Input value={activeClient.country} disabled={!isEditing} placeholder="Country" className="h-8 text-xs" onChange={(e) => updateActiveField('country', e.target.value)} />
                             </div>
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
                    </CardContent>
                </Card>

                {/* Legal Card - Moroccan Specifics */}
                <Card className="border-slate-200 shadow-md bg-white">
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 h-14 justify-center">
                        <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" /> Fiscal Identity (Morocco)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <FieldGroup label="ICE (15 Digits)" required>
                                <div className="relative">
                                    <Input 
                                        value={activeClient.financials.ice || ''} 
                                        disabled={!isEditing} 
                                        maxLength={15}
                                        className={`font-mono text-xs h-8 ${activeClient.financials.ice?.length !== 15 ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`} 
                                        onChange={(e) => updateActiveFinancials('ice', e.target.value)} 
                                    />
                                    {activeClient.financials.ice?.length !== 15 && (
                                        <span className="absolute right-2 top-2 text-[9px] text-amber-600 font-bold">INVALID</span>
                                    )}
                                </div>
                            </FieldGroup>
                        </div>
                        <FieldGroup label="Patente">
                            <Input value={activeClient.financials.patente || ''} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveFinancials('patente', e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="RC Number">
                            <Input value={activeClient.financials.rc || ''} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveFinancials('rc', e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="VAT / IF">
                            <Input value={activeClient.financials.vatNumber} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveFinancials('vatNumber', e.target.value)} />
                        </FieldGroup>
                        <FieldGroup label="CNSS">
                            <Input value={activeClient.financials.cnss || ''} disabled={!isEditing} className="font-mono text-xs h-8" onChange={(e) => updateActiveFinancials('cnss', e.target.value)} />
                        </FieldGroup>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                
                {/* 1. FINANCIAL RISK & EXPOSURE */}
                <Card className="border-slate-200 shadow-md bg-white shrink-0">
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between h-14">
                        <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-400" /> Credit & Exposure Profile
                        </CardTitle>
                        {isEditing ? (
                            <Select 
                                value={activeClient.financials.currency} 
                                onValueChange={(v) => updateActiveFinancials('currency', v)}
                            >
                                <SelectTrigger className="w-24 h-8 text-xs bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MAD">MAD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-mono">
                                CUR: {activeClient.financials.currency}
                            </Badge>
                        )}
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
                                <FieldGroup label="Hard Credit Limit">
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

                            <div className="col-span-2 bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-center shadow-inner relative overflow-hidden">
                                {utilizationPercent > 100 && (
                                    <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] px-2 py-1 font-bold rounded-bl-lg">
                                        LIMIT EXCEEDED
                                    </div>
                                )}
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Exposure (WIP + AR)</span>
                                    <span className={`text-sm font-bold font-mono ${utilizationPercent > 90 ? 'text-red-600' : 'text-slate-700'}`}>
                                        {totalExposure.toLocaleString()} / {(activeClient.creditLimit || 0).toLocaleString()} {activeClient.financials.currency}
                                    </span>
                                </div>
                                <Progress 
                                    value={utilizationPercent} 
                                    className="h-2.5 bg-slate-200" 
                                    indicatorClassName={utilizationPercent > 90 ? "bg-red-500" : "bg-blue-600"}
                                />
                                <div className="mt-3 flex gap-6 text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                                    <div className="flex items-center gap-1.5" title="Unpaid Invoices">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div> 
                                        Unpaid: {(activeClient.unpaidInvoices || 0).toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-1.5" title="Unbilled Operations">
                                        <div className="w-2 h-2 rounded-full bg-orange-400"></div> 
                                        WIP: {(activeClient.unbilledWork || 0).toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-slate-200"></div> 
                                        Available: {Math.max(0, activeClient.creditLimit - totalExposure).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. SEGMENTATION & PARENT COMPANY */}
                <Card className="flex-1 bg-white border border-slate-200 shadow-md">
                    <CardHeader className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 shrink-0 h-14 justify-center">
                        <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <div className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm text-slate-500">
                                <Briefcase className="h-3.5 w-3.5" /> 
                            </div>
                            Commercial Segmentation
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-5 flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FieldGroup label="Parent Company (Group)">
                                 <Select disabled={!isEditing} value={activeClient.parentCompanyId} onValueChange={(v) => updateActiveField('parentCompanyId', v)}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Standalone Entity" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Standalone Entity</SelectItem>
                                        {potentialParents.map(parent => (
                                            <SelectItem key={parent.id} value={parent.id}>
                                                {parent.entityName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FieldGroup>
                            <FieldGroup label="Sales Funnel Win Rate">
                                <div className="h-9 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-600">
                                    14% (Low)
                                </div>
                            </FieldGroup>
                        </div>
                        
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
                                {isEditing && (
                                    <div className="flex gap-2">
                                        <Input 
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            className="h-7 w-32 text-[10px] bg-white"
                                            placeholder="Add tag..."
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                        />
                                        <Button size="icon" onClick={handleAddTag} className="h-7 w-7"><Plus className="h-3 w-3" /></Button>
                                    </div>
                                )}
                            </div>
                        </FieldGroup>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}