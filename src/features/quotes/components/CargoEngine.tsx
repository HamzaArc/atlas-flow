import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuoteStore } from "@/store/useQuoteStore";
import { Package, Plus, Trash2, Box } from "lucide-react";
import { Switch } from "@/components/ui/switch"; 
import { PackagingType } from "@/types/index";
import { Badge } from "@/components/ui/badge";

export function CargoEngine() {
  const { 
      cargoRows, updateCargo, totalVolume, totalWeight, chargeableWeight,
      hsCode, isHazmat, isStackable, isReefer, temperature, packagingType,
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
    <Card className="p-5 bg-white shadow-sm ring-1 ring-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><Package className="h-4 w-4" /></div>
          <span>Cargo Specs</span>
        </div>
        <div className="flex gap-2">
             <Badge variant="secondary" className="text-[10px] h-6 px-2 bg-slate-100 text-slate-600 font-mono border-slate-200">
                 {totalWeight} kg
             </Badge>
             <Badge variant="secondary" className="text-[10px] h-6 px-2 bg-slate-100 text-slate-600 font-mono border-slate-200">
                 {totalVolume} m³
             </Badge>
        </div>
      </div>

      {/* 1. CARGO NATURE */}
      <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Pack Type</Label>
              <Select value={packagingType} onValueChange={(v) => setIdentity('packagingType', v as PackagingType)}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 border-transparent font-medium hover:bg-slate-100 transition-colors">
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
          <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">HS Code</Label>
              <Input 
                  className="h-9 text-xs bg-slate-50 border-transparent font-mono font-medium hover:bg-slate-100 focus:bg-white transition-colors" 
                  placeholder="0000.00"
                  value={hsCode}
                  onChange={(e) => setIdentity('hsCode', e.target.value)}
              />
          </div>
      </div>

      {/* 2. COMPLIANCE TOGGLES */}
      <div className="space-y-3 mb-5 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-600">Stackable</Label>
              <Switch checked={isStackable} onCheckedChange={(c) => setIdentity('isStackable', c)} className="h-4 w-8" />
          </div>
          <div className="flex items-center justify-between">
              <Label className={`text-xs font-semibold ${isHazmat ? 'text-red-600' : 'text-slate-600'}`}>Dangerous (IMO)</Label>
              <Switch checked={isHazmat} onCheckedChange={(c) => setIdentity('isHazmat', c)} className="h-4 w-8 data-[state=checked]:bg-red-500" />
          </div>
          <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-600">Temp Control</Label>
              <div className="flex items-center gap-2">
                  {isReefer && (
                      <Input className="h-6 w-16 text-[10px] px-1 bg-slate-50 border-none text-right" placeholder="-18C" value={temperature} onChange={(e) => setIdentity('temperature', e.target.value)} />
                  )}
                  <Switch checked={isReefer} onCheckedChange={(c) => setIdentity('isReefer', c)} className="h-4 w-8 data-[state=checked]:bg-blue-500" />
              </div>
          </div>
      </div>

      {/* 3. DIMENSIONS LIST */}
      <div className="flex-1 overflow-auto min-h-[120px] rounded-lg border border-slate-100 bg-slate-50/50 mb-3 relative">
        <table className="w-full text-center border-collapse">
            <thead className="text-[9px] uppercase text-slate-400 font-bold bg-slate-100 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th className="py-2 pl-2">Qty</th>
                    <th className="py-2">L</th>
                    <th className="py-2">W</th>
                    <th className="py-2">H</th>
                    <th className="py-2">Kg</th>
                    <th className="py-2 pr-2"></th>
                </tr>
            </thead>
            <tbody className="text-xs">
                {cargoRows.map((row) => (
                    <tr key={row.id} className="group border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                        <td className="p-1"><Input className="h-7 w-full text-center px-0 bg-transparent border-transparent focus:bg-white focus:border-blue-200" value={row.qty} onChange={(e) => updateRow(row.id, 'qty', parseFloat(e.target.value))} /></td>
                        <td className="p-1"><Input className="h-7 w-full text-center px-0 bg-transparent border-transparent focus:bg-white focus:border-blue-200" value={row.length} onChange={(e) => updateRow(row.id, 'length', parseFloat(e.target.value))} /></td>
                        <td className="p-1"><Input className="h-7 w-full text-center px-0 bg-transparent border-transparent focus:bg-white focus:border-blue-200" value={row.width} onChange={(e) => updateRow(row.id, 'width', parseFloat(e.target.value))} /></td>
                        <td className="p-1"><Input className="h-7 w-full text-center px-0 bg-transparent border-transparent focus:bg-white focus:border-blue-200" value={row.height} onChange={(e) => updateRow(row.id, 'height', parseFloat(e.target.value))} /></td>
                        <td className="p-1"><Input className="h-7 w-full text-center px-0 bg-transparent border-transparent focus:bg-white focus:border-blue-200" value={row.weight} onChange={(e) => updateRow(row.id, 'weight', parseFloat(e.target.value))} /></td>
                        <td className="p-1">
                            <button onClick={() => updateCargo(cargoRows.filter(r => r.id !== row.id))} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      
      <Button variant="outline" size="sm" onClick={addRow} className="w-full h-8 text-xs border-dashed text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50">
          <Plus className="h-3 w-3 mr-1" /> Add Dimension Row
      </Button>

      {/* 4. Chargeable Weight Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Chargeable Weight</span>
          <div className="flex items-baseline gap-1">
              <span className="font-mono font-bold text-xl text-blue-600">{chargeableWeight}</span>
              <span className="text-xs text-slate-400 font-medium">kg</span>
          </div>
      </div>
    </Card>
  );
}