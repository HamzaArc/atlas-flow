import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuoteStore } from "@/store/useQuoteStore";
import { 
    Package, Plus, Trash2, AlertCircle, 
    Layers, Scale, Thermometer,
    ArrowDownToLine, Zap
} from "lucide-react";
import { Switch } from "@/components/ui/switch"; 
import { PackagingType } from "@/types/index";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      setIdentity, mode
  } = useQuoteStore();

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

  // Logic: Highlight if cargo details are critical for the selected mode
  const isCritical = mode === 'AIR' || mode === 'SEA_LCL';

  return (
    <Card className={cn(
        "h-full flex flex-col transition-all duration-300 overflow-hidden border-none",
        isCritical 
            ? "bg-amber-50/30 ring-2 ring-amber-400/30 shadow-md" 
            : "bg-white shadow-sm ring-1 ring-slate-100"
    )}>
      
      {/* 1. FIXED HEADER (Ergonomic Stats) */}
      <div className="px-4 py-3 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <div className={cn("p-1.5 rounded-md transition-colors", isCritical ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600")}>
                  <Package className="h-4 w-4" />
              </div>
              <span className="tracking-tight">Cargo Manifest</span>
            </div>
            {isHazmat && <Badge variant="destructive" className="h-5 px-1.5 text-[9px]">IMO / ADR</Badge>}
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
              <div className="bg-white rounded border border-slate-100 p-1.5 flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Pkgs</span>
                  <span className="text-xs font-bold text-slate-700">{totalPackages}</span>
              </div>
              <div className="bg-white rounded border border-slate-100 p-1.5 flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">W (kg)</span>
                  <span className="text-xs font-bold text-slate-700">{totalWeight}</span>
              </div>
              <div className="bg-white rounded border border-slate-100 p-1.5 flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">V (m³)</span>
                  <span className="text-xs font-bold text-slate-700">{totalVolume}</span>
              </div>
              <div className={cn(
                  "rounded border p-1.5 flex flex-col items-center",
                  densityRatio < 167 && mode === 'AIR' ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
              )}>
                  <span className={cn("text-[9px] uppercase font-bold", densityRatio < 167 && mode === 'AIR' ? "text-red-400" : "text-emerald-500")}>Dens.</span>
                  <span className={cn("text-xs font-bold", densityRatio < 167 && mode === 'AIR' ? "text-red-700" : "text-emerald-700")}>
                      1:{densityRatio}
                  </span>
              </div>
          </div>
      </div>

      {/* 2. SCROLLABLE CONTENT AREA */}
      <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
              
              {/* Global Settings */}
              <div className="space-y-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                      
                      {/* HS CODE SECTION */}
                      <div className="space-y-1.5">
                          {/* Header aligns with Temp Header */}
                          <div className="flex items-center h-6">
                              <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">HS Code</Label>
                          </div>
                          <div className="relative">
                              <Input 
                                  className="h-8 text-xs pl-7 bg-slate-50 border-slate-200 focus:bg-white transition-colors" 
                                  placeholder="0000.00"
                                  value={hsCode}
                                  onChange={(e) => setIdentity('hsCode', e.target.value)}
                              />
                              <Scale className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                          </div>
                      </div>
                      
                      {/* TEMP CONTROL SECTION */}
                      <div className="space-y-1.5">
                          <div className="flex justify-between items-center h-6">
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
                                      className="data-[state=checked]:bg-blue-600 shadow-sm"
                                  />
                              </div>
                          </div>
                          <div className="relative">
                              <Input 
                                  disabled={!isReefer}
                                  className="h-8 text-xs pl-7 bg-slate-50 border-slate-200 disabled:opacity-50 disabled:bg-slate-100 focus:bg-white transition-colors" 
                                  placeholder="Ambient"
                                  value={temperature}
                                  onChange={(e) => setIdentity('temperature', e.target.value)}
                              />
                              <Thermometer className={cn("absolute left-2.5 top-2 h-3.5 w-3.5 transition-colors", isReefer ? "text-blue-500" : "text-slate-300")} />
                          </div>
                      </div>
                  </div>

                  {/* Hazmat Toggle */}
                  <div className="flex items-center gap-2 pt-1">
                      <div className={cn("flex-1 flex items-center justify-between p-2 rounded border transition-colors", isHazmat ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100")}>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", isHazmat ? "text-red-700" : "text-slate-400")}>Dangerous Goods (IMO)</span>
                          <Switch checked={isHazmat} onCheckedChange={(c) => setIdentity('isHazmat', c)} className="data-[state=checked]:bg-red-600" />
                      </div>
                  </div>
              </div>

              {/* Rows List */}
              <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Package List</span>
                      <Button variant="ghost" size="sm" onClick={addRow} className="h-6 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 -mr-1">
                          <Plus className="h-3 w-3 mr-1" /> Add Row
                      </Button>
                  </div>

                  {cargoRows.map((row, idx) => (
                      <div key={row.id} className="group relative bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all">
                          
                          {/* Row Header: Type & Stackability */}
                          <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[9px] h-5 bg-slate-100 border-slate-200 text-slate-500">#{idx + 1}</Badge>
                                  <Select value={row.pkgType} onValueChange={(v) => updateRow(row.id, 'pkgType', v)}>
                                      <SelectTrigger className="h-6 w-24 text-[10px] border-none bg-slate-50 font-medium focus:ring-0">
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
                                      className={cn("p-1 rounded transition-colors", row.isStackable ? "bg-green-100 text-green-600" : "bg-red-50 text-red-400")}
                                  >
                                      <Layers className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => removeRow(row.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                      <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                              </div>
                          </div>

                          {/* Dimensions Grid */}
                          <div className="grid grid-cols-5 gap-2 items-end">
                              <div className="col-span-1">
                                  <Label className="text-[9px] text-slate-400">Qty</Label>
                                  <Input className="h-7 text-xs text-center px-0 font-bold text-slate-700 bg-slate-50 border-transparent focus:bg-white focus:border-blue-200" 
                                      type="number" min={1} value={row.qty} 
                                      onChange={(e) => updateRow(row.id, 'qty', parseInt(e.target.value) || 0)} 
                                  />
                              </div>
                              <div className="col-span-3 grid grid-cols-3 gap-1">
                                  <div>
                                      <Label className="text-[9px] text-slate-400 pl-1">L</Label>
                                      <Input className="h-7 text-xs text-center px-0 bg-slate-50 border-transparent focus:bg-white" placeholder="cm"
                                          type="number" value={row.length} 
                                          onChange={(e) => updateRow(row.id, 'length', parseInt(e.target.value) || 0)} 
                                      />
                                  </div>
                                  <div>
                                      <Label className="text-[9px] text-slate-400 pl-1">W</Label>
                                      <Input className="h-7 text-xs text-center px-0 bg-slate-50 border-transparent focus:bg-white" placeholder="cm"
                                          type="number" value={row.width} 
                                          onChange={(e) => updateRow(row.id, 'width', parseInt(e.target.value) || 0)} 
                                      />
                                  </div>
                                  <div>
                                      <Label className="text-[9px] text-slate-400 pl-1">H</Label>
                                      <Input className="h-7 text-xs text-center px-0 bg-slate-50 border-transparent focus:bg-white" placeholder="cm"
                                          type="number" value={row.height} 
                                          onChange={(e) => updateRow(row.id, 'height', parseInt(e.target.value) || 0)} 
                                      />
                                  </div>
                              </div>
                              <div className="col-span-1">
                                  <Label className="text-[9px] text-slate-400">Kg/Unit</Label>
                                  <Input className="h-7 text-xs text-center px-0 font-medium bg-slate-50 border-transparent focus:bg-white" 
                                      type="number" value={row.weight} 
                                      onChange={(e) => updateRow(row.id, 'weight', parseInt(e.target.value) || 0)} 
                                  />
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
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
    </Card>
  );
}