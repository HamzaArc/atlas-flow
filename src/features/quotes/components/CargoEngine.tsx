import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuoteStore } from "@/store/useQuoteStore";
import { Package, Plus, Trash2, Box, ShieldCheck, Thermometer, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch"; 
import { PackagingType } from "@/types/index";

export function CargoEngine() {
  const { 
      cargoRows, updateCargo, totalVolume, totalWeight, chargeableWeight,
      hsCode, isHazmat, isStackable, isReefer, temperature, cargoValue, insuranceRequired, packagingType,
      setIdentity
  } = useQuoteStore();

  const addRow = () => {
    const newRow = { id: Math.random().toString(), qty: 1, length: 0, width: 0, height: 0, weight: 0 };
    updateCargo([...cargoRows, newRow]);
  };

  const updateRow = (id: string, field: string, value: number) => {
    const newRows = cargoRows.map(row => {
      if (row.id === id) return { ...row, [field]: value };
      return row;
    });
    updateCargo(newRows);
  };

  return (
    <Card className="p-3 shadow-sm border-slate-200 bg-white h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
          <Package className="h-4 w-4 text-blue-600" />
          <span>Cargo Specs</span>
        </div>
        <div className="flex gap-2">
             <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-500">
                 {totalWeight} kg
             </Badge>
             <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-500">
                 {totalVolume} m³
             </Badge>
        </div>
      </div>

      {/* 1. CARGO NATURE - Compact Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
              <Label className="text-[10px] uppercase text-slate-400 font-bold">Pack Type</Label>
              <Select value={packagingType} onValueChange={(v) => setIdentity('packagingType', v as PackagingType)}>
                  <SelectTrigger className="h-7 text-xs bg-slate-50 border-slate-200">
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="PALLETS">Pallets</SelectItem>
                      <SelectItem value="CARTONS">Cartons</SelectItem>
                      <SelectItem value="CRATES">Crates</SelectItem>
                      <SelectItem value="DRUMS">Drums</SelectItem>
                      <SelectItem value="LOOSE">Loose</SelectItem>
                  </SelectContent>
              </Select>
          </div>
          <div>
              <Label className="text-[10px] uppercase text-slate-400 font-bold">HS Code</Label>
              <Input 
                  className="h-7 text-xs bg-slate-50 border-slate-200 font-mono" 
                  placeholder="0000.00"
                  value={hsCode}
                  onChange={(e) => setIdentity('hsCode', e.target.value)}
              />
          </div>
      </div>

      {/* 2. COMPLIANCE TOGGLES - Stacked */}
      <div className="space-y-2 mb-4 bg-slate-50 p-2 rounded border border-slate-100">
          <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-600">Stackable</Label>
              <Switch checked={isStackable} onCheckedChange={(c) => setIdentity('isStackable', c)} className="h-4 w-7" />
          </div>
          <div className="flex items-center justify-between">
              <Label className={`text-xs font-medium ${isHazmat ? 'text-red-600' : 'text-slate-600'}`}>Dangerous (IMO)</Label>
              <Switch checked={isHazmat} onCheckedChange={(c) => setIdentity('isHazmat', c)} className="h-4 w-7 data-[state=checked]:bg-red-500" />
          </div>
          <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-slate-600">Temp Control</Label>
              <div className="flex items-center gap-2">
                  {isReefer && (
                      <Input className="h-5 w-14 text-[10px] px-1" placeholder="-18C" value={temperature} onChange={(e) => setIdentity('temperature', e.target.value)} />
                  )}
                  <Switch checked={isReefer} onCheckedChange={(c) => setIdentity('isReefer', c)} className="h-4 w-7 data-[state=checked]:bg-blue-500" />
              </div>
          </div>
      </div>

      {/* 3. DIMENSIONS LIST - Scrollable */}
      <div className="flex-1 overflow-auto min-h-[100px] border rounded-md border-slate-100 bg-slate-50/50 mb-3">
        <table className="w-full text-center">
            <thead className="text-[9px] uppercase text-slate-400 font-medium bg-slate-100 sticky top-0">
                <tr>
                    <th className="py-1">Qty</th>
                    <th>L</th>
                    <th>W</th>
                    <th>H</th>
                    <th>Kg</th>
                    <th></th>
                </tr>
            </thead>
            <tbody className="text-xs">
                {cargoRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                        <td className="p-1"><Input className="h-6 w-full text-center px-0 bg-white" value={row.qty} onChange={(e) => updateRow(row.id, 'qty', parseFloat(e.target.value))} /></td>
                        <td className="p-1"><Input className="h-6 w-full text-center px-0 bg-white" value={row.length} onChange={(e) => updateRow(row.id, 'length', parseFloat(e.target.value))} /></td>
                        <td className="p-1"><Input className="h-6 w-full text-center px-0 bg-white" value={row.width} onChange={(e) => updateRow(row.id, 'width', parseFloat(e.target.value))} /></td>
                        <td className="p-1"><Input className="h-6 w-full text-center px-0 bg-white" value={row.height} onChange={(e) => updateRow(row.id, 'height', parseFloat(e.target.value))} /></td>
                        <td className="p-1"><Input className="h-6 w-full text-center px-0 bg-white" value={row.weight} onChange={(e) => updateRow(row.id, 'weight', parseFloat(e.target.value))} /></td>
                        <td className="p-1">
                            <button onClick={() => updateCargo(cargoRows.filter(r => r.id !== row.id))} className="text-slate-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      
      <Button variant="outline" size="sm" onClick={addRow} className="w-full h-7 text-xs border-dashed text-slate-500 hover:text-blue-600">
          <Plus className="h-3 w-3 mr-1" /> Add Package
      </Button>

      {/* 4. Chargeable Weight Footer */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Chg. Weight</span>
          <span className="font-mono font-bold text-lg text-slate-700">{chargeableWeight} <span className="text-xs text-slate-400 font-sans font-normal">kg</span></span>
      </div>
    </Card>
  );
}

// Helper Badge component since we used it above
import { Badge } from "@/components/ui/badge";