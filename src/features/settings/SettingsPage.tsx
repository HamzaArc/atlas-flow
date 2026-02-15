import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Save, Building, CreditCard, FileText, Image as ImageIcon, Upload, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { company, updateCompany, fetchSettings, isInitialized, isLoading } = useSettingsStore();
  const { toast } = useToast();
  
  // Local state
  const [formData, setFormData] = useState(company);
  const [logoPreview, setLogoPreview] = useState(company.logoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Initial Fetch (only if not loaded)
  useEffect(() => {
    if (!isInitialized) {
        fetchSettings();
    }
  }, [isInitialized, fetchSettings]);

  // 2. Sync state when store updates (e.g. after fetch completes)
  useEffect(() => {
    setFormData(company);
    setLogoPreview(company.logoUrl);
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value }
    }));
  };

  // --- SUPABASE FILE UPLOAD ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `company-logo-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    setIsUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('branding') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      setLogoPreview(publicUrl);
      setFormData(prev => ({ ...prev, logoUrl: publicUrl }));
      
      toast("Logo uploaded successfully", "success");

    } catch (error: any) {
      console.error('Upload Error:', error);
      toast("Failed to upload image", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
      setLogoPreview('');
      setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await updateCompany(formData);
        toast("Settings saved to Supabase", "success");
    } catch (error) {
        toast("Failed to save settings", "error");
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading && !isInitialized) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
      );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-6 p-8 overflow-y-auto bg-slate-50/50">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage company profile, finance details, and system preferences.</p>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className={cn(
             "gap-2 min-w-[140px] shadow-sm transition-all duration-300",
             isSaving ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700"
          )}
        >
            {isSaving ? (
                <>
                   <Loader2 className="h-4 w-4 animate-spin" />
                   Saving...
                </>
            ) : (
                <>
                   <Save className="h-4 w-4" />
                   Save Changes
                </>
            )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="general" className="gap-2"><Building className="h-4 w-4"/> Company Profile</TabsTrigger>
          <TabsTrigger value="finance" className="gap-2"><CreditCard className="h-4 w-4"/> Banking & Tax</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2"><FileText className="h-4 w-4"/> Documents & PDF</TabsTrigger>
        </TabsList>

        {/* --- TAB: GENERAL --- */}
        <TabsContent value="general">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* BRANDING CARD */}
              <Card className="md:col-span-1 h-fit">
                 <CardHeader>
                    <CardTitle>Branding</CardTitle>
                    <CardDescription>Logo used on Quote & Invoice PDFs.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 transition-colors hover:bg-slate-100/50">
                        {isUploading ? (
                           <div className="h-24 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                           </div>
                        ) : logoPreview ? (
                            <div className="relative group">
                                <img src={logoPreview} alt="Company Logo" className="h-24 object-contain mb-4" />
                                <button 
                                  onClick={handleRemoveLogo}
                                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                   <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                                <ImageIcon className="h-10 w-10 text-slate-400" />
                            </div>
                        )}
                        
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors">
                                <Upload className="h-3 w-3" />
                                {logoPreview ? 'Change Logo' : 'Upload Logo'}
                            </div>
                            <Input 
                               id="logo-upload" 
                               type="file" 
                               accept="image/*"
                               className="hidden" 
                               onChange={handleFileUpload}
                               disabled={isUploading}
                            />
                        </Label>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">
                           Supported: PNG, JPG, SVG (Max 2MB)
                        </p>
                    </div>
                 </CardContent>
              </Card>

              {/* DETAILS CARD */}
              <Card className="md:col-span-2">
                 <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                    <CardDescription>Address and contact info appearing on quotes.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input name="name" value={formData.name} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input name="website" value={formData.website} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                    </div>

                    <Separator />
                    
                    <div className="space-y-2">
                        <Label>Address Line 1</Label>
                        <Input name="addressLine1" value={formData.addressLine1} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Address Line 2</Label>
                        <Input name="addressLine2" value={formData.addressLine2 || ''} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input name="city" value={formData.city} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>State / Province</Label>
                            <Input disabled placeholder="-" />
                        </div>
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Input name="country" value={formData.country} onChange={handleChange} />
                        </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* --- TAB: FINANCE --- */}
        <TabsContent value="finance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* LEGAL ENTITIES */}
                <Card>
                    <CardHeader>
                        <CardTitle>Legal Entities (Fiscal)</CardTitle>
                        <CardDescription>Tax identifiers for local compliance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>ICE (Common Identifier)</Label>
                                <Input name="ice" value={formData.ice} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tax ID (IF)</Label>
                                <Input name="taxId" value={formData.taxId} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>RC (Registry)</Label>
                                <Input name="rc" value={formData.rc} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>Patente</Label>
                                <Input name="patente" value={formData.patente} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>CNSS</Label>
                                <Input name="cnss" value={formData.cnss} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>Default Currency</Label>
                                <Input name="currency" value={formData.currency} onChange={handleChange} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* BANKING DETAILS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Banking Details</CardTitle>
                        <CardDescription>Displayed on Invoices for transfers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label>Bank Name</Label>
                            <Input name="bankName" value={formData.bankDetails.bankName} onChange={handleBankChange} />
                         </div>
                         <div className="space-y-2">
                            <Label>Account Name</Label>
                            <Input name="accountName" value={formData.bankDetails.accountName} onChange={handleBankChange} />
                         </div>
                         <div className="space-y-2">
                            <Label>RIB (24 Digits)</Label>
                            <Input name="rib" value={formData.bankDetails.rib} onChange={handleBankChange} className="font-mono" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>SWIFT / BIC</Label>
                                <Input name="swift" value={formData.bankDetails.swift} onChange={handleBankChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>IBAN</Label>
                                <Input name="iban" value={formData.bankDetails.iban} onChange={handleBankChange} />
                            </div>
                         </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* --- TAB: DOCUMENTS --- */}
        <TabsContent value="documents">
            <Card>
                <CardHeader>
                    <CardTitle>PDF Footer Configuration</CardTitle>
                    <CardDescription>Dynamic text that appears at the bottom of generated PDFs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Footer Line (Single Line)</Label>
                        <Input 
                            name="footerText" 
                            value={formData.footerText} 
                            onChange={handleChange} 
                            placeholder="e.g. Atlas Flow SARL | RC: 12345..."
                        />
                        <p className="text-xs text-slate-500">
                            Preview: {formData.footerText}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Standard Terms & Conditions (Quotes)</Label>
                        <Textarea 
                            name="termsAndConditions" 
                            value={formData.termsAndConditions} 
                            onChange={handleChange} 
                            className="min-h-[150px] font-mono text-xs"
                        />
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-slate-100 px-6 py-4">
                    <p className="text-xs text-slate-500">
                        Note: Changing terms here updates all future quotes. Existing signed quotes remain unchanged.
                    </p>
                </CardFooter>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}