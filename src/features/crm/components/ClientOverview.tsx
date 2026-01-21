import { Building2, Mail, Phone, Globe, FileText, CreditCard } from "lucide-react";
import { useClientStore } from "@/store/useClientStore";
import { ClientType, ClientStatus } from "@/types/index"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AddressWithMap } from "@/components/ui/address-with-map";
import { ClientContacts } from "./ClientContacts";
import { SupplyChainMatrix } from "./SupplyChainMatrix";

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
    const { activeClient, updateActiveField, updateActiveFinancials } = useClientStore();

    if (!activeClient) return null;

    const totalExposure = (activeClient.unbilledWork || 0) + (activeClient.unpaidInvoices || 0);
    const utilizationPercent = activeClient.creditLimit > 0 ? (totalExposure / activeClient.creditLimit) * 100 : 0;

    return (
        <div className="grid grid-cols-12 gap-6 animate-in fade-in duration-500 pb-6">
            
            {/* LEFT COLUMN: IDENTITY & CONTACTS */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                
                {/* Identity Card */}
                <Card className="border-slate-200 shadow-md bg-white">
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 h-14 justify-center">
                        <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" /> Corporate Identity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Client Type">
                                <Select disabled={!isEditing} value={activeClient.type} onValueChange={(v: string) => updateActiveField('type', v as ClientType)}>
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
                                <Select disabled={!isEditing} value={activeClient.status} onValueChange={(v: string) => updateActiveField('status', v as ClientStatus)}>
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

                        {/* Addresses with Google Maps Integration */}
                        <div className="space-y-4">
                             <AddressWithMap 
                                label="Billing Address (Siège Social)"
                                placeholder="Search legal address..."
                                value={activeClient.billingAddress || ''}
                                onChange={(val: string) => updateActiveField('billingAddress', val)}
                                disabled={!isEditing}
                                required
                                iconClassName="text-slate-400"
                             />
                             
                             <AddressWithMap 
                                label="Delivery Address (Usine/Dépôt)"
                                placeholder="Search factory/warehouse location..."
                                value={activeClient.deliveryAddress || ''}
                                onChange={(val: string) => updateActiveField('deliveryAddress', val)}
                                disabled={!isEditing}
                                iconClassName="text-blue-500"
                             />
                        </div>

                        <Separator />

                        <div className="space-y-4">
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

                {/* INTEGRATED CONTACTS LIST */}
                <ClientContacts isEditing={isEditing} />
            </div>

            {/* RIGHT COLUMN: FINANCIAL, LEGAL & SUPPLY CHAIN */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                
                {/* 1. FINANCIAL RISK & EXPOSURE */}
                <Card className="border-slate-200 shadow-md bg-white shrink-0">
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between h-14">
                        <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-400" /> Credit & Exposure Profile
                        </CardTitle>
                        {isEditing ? (
                            <Select 
                                value={activeClient.financials.currency} 
                                onValueChange={(v: string) => updateActiveFinancials('currency', v)}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="col-span-1 space-y-4">
                                <FieldGroup label="Payment Terms">
                                    <Select disabled={!isEditing} value={activeClient.financials.paymentTerms} onValueChange={(v: string) => updateActiveFinancials('paymentTerms', v)}>
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

                            <div className="col-span-1 lg:col-span-2 bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-center shadow-inner relative overflow-hidden">
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

                {/* 2. FISCAL & LEGAL ENTITY */}
                <Card className="border-slate-200 shadow-md bg-white">
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 h-14 justify-center">
                        <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" /> Fiscal Identity & Legal Registration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="col-span-1">
                                <FieldGroup label="ICE (15 Digits)" required>
                                    <div className="relative">
                                        <Input 
                                            value={activeClient.financials.ice || ''} 
                                            disabled={!isEditing} 
                                            maxLength={15}
                                            className={`font-mono text-xs h-9 ${activeClient.financials.ice?.length !== 15 ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`} 
                                            onChange={(e) => updateActiveFinancials('ice', e.target.value)} 
                                        />
                                        {activeClient.financials.ice?.length !== 15 && (
                                            <span className="absolute right-2 top-2.5 text-[9px] text-amber-600 font-bold">INVALID</span>
                                        )}
                                    </div>
                                </FieldGroup>
                            </div>
                            <FieldGroup label="VAT / IF">
                                <Input value={activeClient.financials.vatNumber} disabled={!isEditing} className="font-mono text-xs h-9" onChange={(e) => updateActiveFinancials('vatNumber', e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="RC Number">
                                <Input value={activeClient.financials.rc || ''} disabled={!isEditing} className="font-mono text-xs h-9" onChange={(e) => updateActiveFinancials('rc', e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="Patente">
                                <Input value={activeClient.financials.patente || ''} disabled={!isEditing} className="font-mono text-xs h-9" onChange={(e) => updateActiveFinancials('patente', e.target.value)} />
                            </FieldGroup>
                            <FieldGroup label="CNSS">
                                <Input value={activeClient.financials.cnss || ''} disabled={!isEditing} className="font-mono text-xs h-9" onChange={(e) => updateActiveFinancials('cnss', e.target.value)} />
                            </FieldGroup>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. SUPPLY CHAIN MATRIX (Moved Here) */}
                <SupplyChainMatrix isEditing={isEditing} />
            </div>
        </div>
    );
}