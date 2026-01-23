import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useDossierStore } from "@/store/useDossierStore";
import { Container, Plus, Trash2, Package, Weight } from "lucide-react";
import { DossierContainer, PackagingType } from "@/types/index";

// Local constant for dropdown, derived from type
const PACKAGE_TYPES: { value: PackagingType; label: string }[] = [
    { value: 'PALLETS', label: 'Pallets' },
    { value: 'CARTONS', label: 'Cartons' },
    { value: 'CRATES', label: 'Crates' },
    { value: 'DRUMS', label: 'Drums' },
    { value: 'LOOSE', label: 'Loose' },
];

export function ContainerManifest() {
  const { dossier, isEditing, addContainer, updateContainer, removeContainer } = useDossierStore();

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Container className="h-4 w-4 text-blue-600" />
                Equipment & Cargo
                <Badge variant="secondary" className="ml-2 text-[10px] h-5">{dossier.containers.length} Units</Badge>
            </h3>
            {isEditing && (
                // FIXED: Wrapped in anonymous function to prevent passing MouseEvent
                <Button size="sm" variant="outline" onClick={() => addContainer()} className="h-7 text-xs bg-white">
                    <Plus className="h-3 w-3 mr-1" /> Add Container
                </Button>
            )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
            <Table>
                <TableHeader className="bg-slate-50/80 sticky top-0 z-10">
                    <TableRow className="hover:bg-transparent border-b border-slate-200">
                        <TableHead className="w-[25%] text-[10px] font-bold uppercase text-slate-500 h-9">Container No. / Type</TableHead>
                        <TableHead className="w-[15%] text-[10px] font-bold uppercase text-slate-500 h-9">Seal No.</TableHead>
                        <TableHead className="w-[15%] text-[10px] font-bold uppercase text-slate-500 h-9 text-right">Weight (kg)</TableHead>
                        <TableHead className="w-[20%] text-[10px] font-bold uppercase text-slate-500 h-9">Packages</TableHead>
                        <TableHead className="w-[15%] text-[10px] font-bold uppercase text-slate-500 h-9">Status</TableHead>
                        {isEditing && <TableHead className="w-[5%] h-9"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {dossier.containers.map((c: DossierContainer) => (
                        <TableRow key={c.id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 group">
                            <TableCell className="py-2">
                                <div className="flex flex-col gap-1">
                                    <Input 
                                        value={c.number} 
                                        disabled={!isEditing} 
                                        onChange={(e) => updateContainer(c.id, 'number', e.target.value)}
                                        className="h-7 text-xs font-mono uppercase bg-transparent border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white p-1"
                                        placeholder="MSKU..."
                                    />
                                    <Select disabled={!isEditing} value={c.type} onValueChange={(v: any) => updateContainer(c.id, 'type', v)}>
                                        <SelectTrigger className="h-5 text-[10px] border-none bg-slate-100 w-fit px-2 min-h-0"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="20DV">20' DV</SelectItem>
                                            <SelectItem value="40HC">40' HC</SelectItem>
                                            <SelectItem value="40RH">40' Reefer</SelectItem>
                                            <SelectItem value="LCL">LCL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </TableCell>
                            <TableCell className="py-2">
                                <Input 
                                    value={c.seal} 
                                    disabled={!isEditing} 
                                    onChange={(e) => updateContainer(c.id, 'seal', e.target.value)}
                                    className="h-7 text-xs bg-transparent border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white p-1"
                                    placeholder="Seal..."
                                />
                            </TableCell>
                            <TableCell className="py-2 text-right">
                                <Input 
                                    type="number"
                                    value={c.weight} 
                                    disabled={!isEditing} 
                                    onChange={(e) => updateContainer(c.id, 'weight', parseFloat(e.target.value))}
                                    className="h-7 text-xs text-right bg-transparent border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white p-1"
                                />
                            </TableCell>
                            <TableCell className="py-2">
                                <div className="flex items-center gap-1">
                                    <Input 
                                        type="number"
                                        value={c.packages} 
                                        disabled={!isEditing} 
                                        onChange={(e) => updateContainer(c.id, 'packages', parseFloat(e.target.value))}
                                        className="h-7 w-16 text-xs text-right bg-transparent border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white p-1"
                                    />
                                    <Select disabled={!isEditing} value={c.packageType} onValueChange={(v: any) => updateContainer(c.id, 'packageType', v)}>
                                        <SelectTrigger className="h-7 text-[10px] border-transparent bg-transparent hover:bg-slate-100 focus:ring-0 min-h-0 px-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PACKAGE_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </TableCell>
                            <TableCell className="py-2">
                                <Select disabled={!isEditing} value={c.status} onValueChange={(v: any) => updateContainer(c.id, 'status', v)}>
                                    <SelectTrigger className={`h-6 text-[10px] font-bold border-none w-full px-2 min-h-0 ${
                                        c.status === 'ON_WATER' ? 'bg-blue-100 text-blue-700' : 
                                        c.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GATE_IN">Gate In</SelectItem>
                                        <SelectItem value="LOADED">Loaded</SelectItem>
                                        <SelectItem value="ON_WATER">On Water</SelectItem>
                                        <SelectItem value="DISCHARGED">Discharged</SelectItem>
                                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                                    </SelectContent>
                                </Select>
                            </TableCell>
                            {isEditing && (
                                <TableCell className="py-2">
                                    <Button variant="ghost" size="icon" onClick={() => removeContainer(c.id)} className="h-6 w-6 text-slate-300 hover:text-red-500">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                    {dossier.containers.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-xs text-slate-400 italic">
                                No containers attached. Add equipment to track.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
        
        {/* Footer Summary */}
        <div className="p-2 bg-slate-50 border-t border-slate-200 flex justify-end gap-4 text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1"><Weight className="h-3 w-3" /> Total Weight: {dossier.containers.reduce((a,c) => a + c.weight, 0).toLocaleString()} kg</span>
            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> Total Pkgs: {dossier.containers.reduce((a,c) => a + c.packages, 0)}</span>
        </div>
    </div>
  );
}