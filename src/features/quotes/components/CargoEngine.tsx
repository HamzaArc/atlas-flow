import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuoteStore } from "@/store/useQuoteStore";
import { 
    Package, Plus, Trash2, 
    Layers, Scale, Thermometer,
    ArrowDownToLine, Zap, Wand2, ShieldAlert, CheckCircle2, Info, Loader2, Container
} from "lucide-react";
import { Switch } from "@/components/ui/switch"; 
import { PackagingType } from "@/types/index";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ComplianceService, ComplianceResult } from "@/services/compliance.service";
import { useToast } from "@/components/ui/use-toast";

// --- PACKING OPTIONS ---
const PACKAGE_TYPES: { value: PackagingType; label: string }[] = [
    { value: 'PALLETS', label: 'Pallet' },
    { value: 'CARTONS', label: 'Carton' },
    { value: 'CRATES', label: 'Crate' },
    { value: 'DRUMS', label: 'Drum' },
    { value: 'LOOSE', label: 'Loose' },
];

export function CargoEngine() {
  const { 
      cargoRows, updateCargo, totalVolume, totalWeight, chargeableWeight, totalPackages,
      hsCode, isHazmat, isReefer, temperature, densityRatio,
      setIdentity, mode, goodsDescription, equipmentType, containerCount
  } = useQuoteStore();
  
  const { toast } = useToast();

  const [isClassifying, setIsClassifying] = useState(false);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);

  // --- LOGIC: SHOW/HIDE PACKAGE LIST ---
  // Only needed in SEA_LCL, AIR, or ROAD LTL (contains "LTL" in name)
  const isLCL = mode === 'SEA_LCL' || mode === 'AIR' || (mode === 'ROAD' && equipmentType?.includes('LTL'));

  const addRow = () => {
    const newRow = { 
        id: Math.random().toString(), 
        qty: 1, 
        pkgType: 'PALLETS' as PackagingType,
        length: 120, width: 80, height: 100, 
        weight: 500,
        isStackable: true
    };
    updateCargo([...cargoRows, newRow]);
  };

  const updateRow = (id: string, field: string, value: any) => {
    const newRows = cargoRows.map(row => {
      if (row.id === id) return { ...row, [field]: value };
      return row;
    });
    updateCargo(newRows);
  };

  const removeRow = (id: string) => {
      updateCargo(cargoRows.filter(r => r.id !== id));
  };

  const handleAutoClassify = async () => {
    if (!goodsDescription || goodsDescription.length < 3) {
      toast("Description too short. Please enter a valid goods description.", "error");
      return;
    }

    setIsClassifying(true);
    setComplianceResult(null);

    try {
      const result = await ComplianceService.suggestHSCode(goodsDescription);
      
      if (result) {
        setComplianceResult(result);
        if (result.confidence === 'HIGH') {
            setIdentity('hsCode', result.code);
            
            if (result.isHazmat && !isHazmat) {
                setIdentity('isHazmat', true);
                toast("Compliance Alert: Dangerous Goods flag auto-enabled.", "warning");
            }
            
            if (result.requiresTemperature && !isReefer) {
                setIdentity('isReefer', true);
                setIdentity('temperature', "4");
                toast("Compliance Alert: Reefer requirement detected.", "info");
            }
        }
      } else {
        toast("No Match Found: Could not classify this item.", "warning");
      }
    } catch (error) {
      console.error(error);
      toast("Service Error: Classification service unavailable.", "error");
    } finally {
      setIsClassifying(false);
    }
  };

  const isCritical = mode === 'AIR' || mode === 'SEA_LCL';

  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden">
      
      {/* 1. FIXED HEADER (Ergonomic Stats) */}
      <div className="px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
              <div className={cn("p-1.5 rounded-md transition-colors", isCritical ? "bg-amber-100 text-amber-700" : "bg-amber-50 text-amber-600")}>
                  <Package className="h-3.5 w-3.5" />
              </div>
              <span className="tracking-widest">Cargo Manifest</span>
            </div>
            {isHazmat && <Badge variant="destructive" className="h-5 px-1.5 text-[9px] animate-pulse">IMO / ADR</Badge>}
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
              <div className="bg-slate-50 rounded border border-slate-100 p-2 flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Pkgs</span>
                  <span className="text-xs font-bold text-slate-700">{isLCL ? totalPackages : containerCount}</span>
              </div>
              <div className="bg-slate-50 rounded border border-slate-100 p-2 flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Weight</span>
                  <span className="text-xs font-bold text-slate-700">{totalWeight} <span className="text-[9px] font-normal text-slate-400">kg</span></span>
              </div>
              <div className="bg-slate-50 rounded border border-slate-100 p-2 flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Volume</span>
                  <span className="text-xs font-bold text-slate-700">{totalVolume} <span className="text-[9px] font-normal text-slate-400">m³</span></span>
              </div>
              <div className={cn(
                  "rounded border p-2 flex flex-col items-center",
                  densityRatio < 167 && mode === 'AIR' ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
              )}>
                  <span className={cn("text-[9px] uppercase font-bold tracking-wider", densityRatio < 167 && mode === 'AIR' ? "text-red-400" : "text-emerald-500")}>Ratio</span>
                  <span className={cn("text-xs font-bold", densityRatio < 167 && mode === 'AIR' ? "text-red-700" : "text-emerald-700")}>
                      1:{isLCL ? densityRatio : '-'}
                  </span>
              </div>
          </div>
      </div>

      {/* 2. SCROLLABLE CONTENT AREA */}
      <ScrollArea className="flex-1 bg-white">
          <div className="p-5 space-y-5">
              
              {/* Compliance & Identity Section */}
              <div className="space-y-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  
                  {/* GOODS DESCRIPTION + AI WAND */}
                  <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Goods Description</Label>
                      <div className="flex gap-2">
                          <Input 
                              className="h-9 text-xs bg-white border-slate-200 focus:bg-white" 
                              placeholder="E.g. Leather Shoes, Laptop, Mangoes..."
                              value={goodsDescription}
                              onChange={(e) => setIdentity('goodsDescription', e.target.value)}
                          />
                          <Button 
                              size="sm" 
                              onClick={handleAutoClassify}
                              disabled={isClassifying}
                              className="h-9 bg-violet-600 hover:bg-violet-700 text-white shadow-sm border border-violet-700"
                          >
                              {isClassifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
                              Classify
                          </Button>
                      </div>
                  </div>

                  {/* AI COMPLIANCE CARD RESULT */}
                  {complianceResult && (
                      <div className={cn(
                          "rounded-md border p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300",
                          complianceResult.confidence === 'HIGH' ? "bg-violet-50/50 border-violet-100" : "bg-amber-50/50 border-amber-100"
                      )}>
                          <div className="flex items-start justify-between">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-mono font-bold text-slate-800">{complianceResult.code}</span>
                                      <Badge variant="outline" className={cn(
                                          "text-[9px] h-4 px-1.5 border-0",
                                          complianceResult.confidence === 'HIGH' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                      )}>
                                          {complianceResult.confidence === 'HIGH' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                                          {complianceResult.confidence} CONFIDENCE
                                      </Badge>
                                  </div>
                                  <p className="text-[10px] font-medium text-slate-700 leading-tight">{complianceResult.title}</p>
                              </div>
                              <div className="text-right">
                                  <div className="text-[9px] text-slate-400 font-bold uppercase">Duty Rate</div>
                                  <div className="text-[10px] font-bold text-slate-700">{complianceResult.dutyRate}</div>
                              </div>
                          </div>
                          
                          <p className="text-[10px] text-slate-500 italic border-l-2 border-slate-300 pl-2">
                              {complianceResult.description}
                          </p>

                          {/* Critical Alerts */}
                          {(complianceResult.restrictions.length > 0 || complianceResult.isHazmat) && (
                              <div className="mt-1 pt-2 border-t border-slate-200/50 space-y-1">
                                  {complianceResult.isHazmat && (
                                      <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-bold">
                                          <ShieldAlert className="h-3 w-3" />
                                          HAZMAT DETECTED - DOCUMENTATION REQUIRED
                                      </div>
                                  )}
                                  {complianceResult.restrictions.map((res, i) => (
                                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-amber-600 font-medium">
                                          <Info className="h-3 w-3" />
                                          {res}
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-5">
                      {/* HS CODE SECTION */}
                      <div className="space-y-1.5">
                          <div className="flex items-center h-5">
                              <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">HS Code</Label>
                          </div>
                          <div className="relative">
                              <Input 
                                  className="h-8 text-xs pl-8 bg-white border-slate-200 focus:bg-white transition-colors shadow-sm" 
                                  placeholder="0000.00"
                                  value={hsCode}
                                  onChange={(e) => setIdentity('hsCode', e.target.value)}
                              />
                              <Scale className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          </div>
                      </div>
                      
                      {/* TEMP CONTROL SECTION */}
                      <div className="space-y-1.5">
                          <div className="flex justify-between items-center h-5">
                              <Label className={cn("text-[10px] uppercase font-bold tracking-wider transition-colors", isReefer ? "text-blue-600" : "text-slate-400")}>
                                  {isReefer ? "Reefer" : "Temp. Control"}
                              </Label>
                              <div className="flex items-center gap-1.5">
                                  <span className={cn("text-[9px] font-bold transition-colors", isReefer ? "text-blue-600" : "text-slate-300")}>
                                      {isReefer ? "ON" : "OFF"}
                                  </span>
                                  <Switch 
                                      checked={isReefer} 
                                      onCheckedChange={(c) => setIdentity('isReefer', c)} 
                                      className="h-4 w-8 data-[state=checked]:bg-blue-600 shadow-sm scale-90"
                                  />
                              </div>
                          </div>
                          <div className="relative">
                              <Input 
                                  disabled={!isReefer}
                                  className="h-8 text-xs pl-8 bg-white border-slate-200 disabled:opacity-50 disabled:bg-slate-100 focus:bg-white transition-colors shadow-sm" 
                                  placeholder="Ambient"
                                  value={temperature}
                                  onChange={(e) => setIdentity('temperature', e.target.value)}
                              />
                              <Thermometer className={cn("absolute left-2.5 top-2.5 h-3.5 w-3.5 transition-colors", isReefer ? "text-blue-500" : "text-slate-300")} />
                          </div>
                      </div>
                  </div>

                  {/* Hazmat Toggle */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 mt-2">
                      <div className={cn("flex-1 flex items-center justify-between p-2 rounded border transition-colors", isHazmat ? "bg-red-50 border-red-200" : "bg-white border-slate-200")}>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", isHazmat ? "text-red-700" : "text-slate-400")}>Dangerous Goods (IMO)</span>
                          <Switch checked={isHazmat} onCheckedChange={(c) => setIdentity('isHazmat', c)} className="data-[state=checked]:bg-red-600 h-4 w-8 scale-90" />
                      </div>
                  </div>
              </div>

              {/* ROWS LIST (CONDITIONALLY RENDERED) */}
              {isLCL ? (
                  <div className="space-y-3 animate-in fade-in duration-300">
                      <div className="flex justify-between items-end px-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Package List</span>
                          <Button variant="ghost" size="sm" onClick={addRow} className="h-6 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 -mr-1">
                              <Plus className="h-3 w-3 mr-1" /> Add Row
                          </Button>
                      </div>

                      {cargoRows.map((row, idx) => (
                          <div key={row.id} className="group relative bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-md transition-all">
                              
                              {/* Row Header: Type & Stackability */}
                              <div className="flex justify-between items-center mb-3">
                                  <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-[9px] h-5 bg-slate-50 border-slate-200 text-slate-500 font-mono">#{idx + 1}</Badge>
                                      <Select value={row.pkgType} onValueChange={(v) => updateRow(row.id, 'pkgType', v)}>
                                          <SelectTrigger className="h-6 w-28 text-[10px] border-none bg-slate-50 font-medium focus:ring-0">
                                              <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                              {PACKAGE_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <button 
                                          onClick={() => updateRow(row.id, 'isStackable', !row.isStackable)}
                                          title={row.isStackable ? "Stackable" : "Non-Stackable"}
                                          className={cn("p-1 rounded transition-colors", row.isStackable ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-400")}
                                      >
                                          <Layers className="h-3.5 w-3.5" />
                                      </button>
                                      <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                          <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                  </div>
                              </div>

                              {/* Dimensions Grid */}
                              <div className="grid grid-cols-5 gap-3 items-end">
                                  <div className="col-span-1">
                                      <Label className="text-[9px] text-slate-400 block mb-1">Qty</Label>
                                      <Input className="h-8 text-xs text-center px-0 font-bold text-slate-700 bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-200" 
                                          type="number" min={1} value={row.qty} 
                                          onChange={(e) => updateRow(row.id, 'qty', parseInt(e.target.value) || 0)} 
                                      />
                                  </div>
                                  <div className="col-span-3 grid grid-cols-3 gap-1.5">
                                      <div>
                                          <Label className="text-[9px] text-slate-400 pl-1 block mb-1">L</Label>
                                          <Input className="h-8 text-xs text-center px-0 bg-slate-50 border-slate-100 focus:bg-white" placeholder="cm"
                                              type="number" value={row.length} 
                                              onChange={(e) => updateRow(row.id, 'length', parseInt(e.target.value) || 0)} 
                                          />
                                      </div>
                                      <div>
                                          <Label className="text-[9px] text-slate-400 pl-1 block mb-1">W</Label>
                                          <Input className="h-8 text-xs text-center px-0 bg-slate-50 border-slate-100 focus:bg-white" placeholder="cm"
                                              type="number" value={row.width} 
                                              onChange={(e) => updateRow(row.id, 'width', parseInt(e.target.value) || 0)} 
                                          />
                                      </div>
                                      <div>
                                          <Label className="text-[9px] text-slate-400 pl-1 block mb-1">H</Label>
                                          <Input className="h-8 text-xs text-center px-0 bg-slate-50 border-slate-100 focus:bg-white" placeholder="cm"
                                              type="number" value={row.height} 
                                              onChange={(e) => updateRow(row.id, 'height', parseInt(e.target.value) || 0)} 
                                          />
                                      </div>
                                  </div>
                                  <div className="col-span-1">
                                      <Label className="text-[9px] text-slate-400 block mb-1">Kg/Unit</Label>
                                      <Input className="h-8 text-xs text-center px-0 font-medium bg-slate-50 border-slate-100 focus:bg-white" 
                                          type="number" value={row.weight} 
                                          onChange={(e) => updateRow(row.id, 'weight', parseInt(e.target.value) || 0)} 
                                      />
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                /* ALTERNATIVE VIEW FOR FCL/FTL */
                <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Container className="h-5 w-5 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">Full Unit Mode Active</h3>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                        Package list is disabled for {mode} ({equipmentType}). 
                        Total weight and volume are estimated per unit.
                    </p>
                </div>
              )}
          </div>
      </ScrollArea>

      {/* 3. FIXED FOOTER (KPIs) */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 shrink-0 backdrop-blur-sm">
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <div className={cn("p-1 rounded", chargeableWeight > totalWeight ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-500")}>
                      <Zap className="h-3.5 w-3.5" />
                  </div>
                  <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-0.5">Chargeable</div>
                      <div className="text-[9px] text-slate-400 leading-none">Taxable Weight</div>
                  </div>
              </div>
              <div className="flex flex-col items-end">
                  <div className="flex items-baseline gap-1">
                      <span className={cn("font-mono font-bold text-xl tracking-tight", chargeableWeight > totalWeight ? "text-amber-600" : "text-blue-600")}>
                          {chargeableWeight.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">kg</span>
                  </div>
                  {chargeableWeight > totalWeight && (
                      <span className="text-[9px] text-amber-600 font-medium flex items-center gap-1">
                          <ArrowDownToLine className="h-3 w-3" /> Volumetric
                      </span>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}