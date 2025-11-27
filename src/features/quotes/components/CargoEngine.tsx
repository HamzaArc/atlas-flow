import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuoteStore } from "@/store/useQuoteStore";
import { Package, Plus, Trash2 } from "lucide-react";

export function CargoEngine() {
  const { cargoRows, updateCargo, totalVolume, totalWeight, chargeableWeight, mode } = useQuoteStore();

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
    <Card className="p-4 shadow-sm border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <Package className="h-4 w-4" />
          <span>Cargo Details ({mode})</span>
        </div>
        <Button size="sm" variant="outline" onClick={addRow} className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-2">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-1 text-[10px] text-slate-400 font-medium uppercase text-center">
          <div className="col-span-2">Qty</div>
          <div className="col-span-2">L (cm)</div>
          <div className="col-span-2">W (cm)</div>
          <div className="col-span-2">H (cm)</div>
          <div className="col-span-3">Gw (Kg)</div>
          <div className="col-span-1"></div>
        </div>

        {/* Input Rows */}
        {cargoRows.map((row) => (
          <div key={row.id} className="grid grid-cols-12 gap-1">
            <Input className="col-span-2 h-8 text-center px-1" type="number" value={row.qty} 
                   onChange={(e) => updateRow(row.id, 'qty', parseFloat(e.target.value) || 0)} />
            <Input className="col-span-2 h-8 text-center px-1" placeholder="0" value={row.length || ''} 
                   onChange={(e) => updateRow(row.id, 'length', parseFloat(e.target.value) || 0)} />
            <Input className="col-span-2 h-8 text-center px-1" placeholder="0" value={row.width || ''} 
                   onChange={(e) => updateRow(row.id, 'width', parseFloat(e.target.value) || 0)} />
            <Input className="col-span-2 h-8 text-center px-1" placeholder="0" value={row.height || ''} 
                   onChange={(e) => updateRow(row.id, 'height', parseFloat(e.target.value) || 0)} />
            <Input className="col-span-3 h-8 text-center px-1 bg-slate-50" placeholder="0" value={row.weight || ''} 
                   onChange={(e) => updateRow(row.id, 'weight', parseFloat(e.target.value) || 0)} />
            
            <div className="col-span-1 flex justify-center">
               <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3 w-3" />
               </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Logic Block */}
      <div className="mt-4 p-3 bg-blue-50/50 rounded border border-blue-100">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Total Gross Weight</span>
          <span className="font-mono font-bold">{totalWeight} kg</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-slate-600">Total Volume</span>
          <span className="font-mono font-bold">{totalVolume} m³</span>
        </div>
        <div className="my-2 h-px bg-blue-200 w-full" />
        <div className="flex justify-between text-sm items-center">
          <span className="text-blue-700 font-medium text-xs uppercase tracking-wider">Chargeable Weight</span>
          <span className="font-mono font-bold text-lg text-blue-700">{chargeableWeight} kg</span>
        </div>
      </div>
    </Card>
  );
}